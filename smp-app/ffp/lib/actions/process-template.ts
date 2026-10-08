"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { generateProcessCode, isCodeAvailable } from "@/ffp/lib/domain/process-hierarchy";
import { laneY, nextStepX, FIRST_STEP_X } from "@/ffp/lib/domain/process-layout";
import { runProcessTemplateGeneration, type ProcessTemplateResult } from "@/ffp/lib/ai/process-template";
import { getActionLocale } from "@/ffp/lib/i18n/server";
import { withAnswerLanguage } from "@/ffp/lib/i18n/locale";
import { ok, notFound, validationError, aiUnavailable, type ActionResult } from "@/ffp/lib/actions/errors";

const generateSchema = z.object({
  workspaceId: z.string().min(1),
  processName: z.string().trim().min(1).max(120),
  /** How the work runs today, in the consultant's own words (optional). */
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  /** Offer the workspace's org-chart roles to the model (default on). */
  useOrgChart: z.boolean().default(true),
});

export type ProcessTemplateDraft = ProcessTemplateResult & {
  /** Active org-chart role names, so the screen can mark a draft role as known or not. */
  orgRoles: string[];
};

/**
 * Drafts a best-practice Process Map + RACI matrix using the workspace's
 * industry/description as context. Returns the draft for review — nothing
 * is persisted until createProcessFromTemplate is called with the (possibly
 * edited) result.
 */
export async function generateProcessTemplateDraft(
  input: z.infer<typeof generateSchema>
): Promise<ActionResult<ProcessTemplateDraft>> {
  const parsed = generateSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: parsed.data.workspaceId } });

  const orgRoles = (
    await prisma.role.findMany({
      where: { workspaceId: parsed.data.workspaceId, archivedAt: null },
      orderBy: { name: "asc" },
      select: { name: true },
    })
  ).map((r) => r.name);

  const promptLines = [
    `Draft a process named or about: "${parsed.data.processName}".`,
    `Client: ${workspace.name}`,
    workspace.industry ? `Industry / sector: ${workspace.industry}` : "Industry / sector: not specified.",
    workspace.description ? `Background: ${workspace.description}` : "No further background provided.",
  ];
  if (parsed.data.notes) {
    promptLines.push(`How this works today (the consultant's notes — follow them over generic practice):\n${parsed.data.notes}`);
  }
  if (parsed.data.useOrgChart && orgRoles.length > 0) {
    promptLines.push(
      `Roles in this client's org chart: ${orgRoles.join("; ")}.\n` +
        "Use these exact names for steps and RACI wherever one fits. Only invent a new role name when none of them can do the work."
    );
  }

  const outcome = await runProcessTemplateGeneration(
    withAnswerLanguage(promptLines.join("\n"), await getActionLocale())
  );
  if (!outcome.ok) {
    if (outcome.reason === "NOT_CONFIGURED") return aiUnavailable(outcome.message);
    return validationError(outcome.message);
  }

  return ok({ ...outcome.data, orgRoles });
}

const templateStepSchema = z.object({
  type: z.enum(["START", "TASK", "DECISION", "END"]),
  label: z.string().trim().min(1).max(200),
  roleName: z.string().trim().max(80).optional().or(z.literal("")),
});

const templateActivitySchema = z.object({
  name: z.string().trim().min(1).max(160),
  assignments: z
    .array(
      z.object({
        roleName: z.string().trim().min(1).max(80),
        code: z.enum(["RESPONSIBLE", "ACCOUNTABLE", "CONSULTED", "INFORMED"]),
      })
    )
    .default([]),
});

const createFromTemplateSchema = z.object({
  workspaceId: z.string().min(1),
  processName: z.string().trim().min(1).max(120),
  categoryId: z.string().min(1).optional().or(z.literal("")),
  parentProcessId: z.string().min(1).optional().or(z.literal("")),
  steps: z.array(templateStepSchema).min(1).max(40),
  activities: z.array(templateActivitySchema).max(40).default([]),
});

type DraftTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Writes a draft's steps (chained in order), RACI activities and assignments
 * into a process, resolving Roles by name — an existing one in this workspace,
 * or a new one. Shared by "create a process from a draft" and "fill an empty
 * process from a draft" so the two cannot lay a draft out differently.
 */
async function materializeDraft(
  tx: DraftTx,
  args: {
    workspaceId: string;
    processId: string;
    steps: z.infer<typeof templateStepSchema>[];
    activities: z.infer<typeof templateActivitySchema>[];
  }
) {
  const { workspaceId, processId, steps, activities } = args;
  const roleIdByName = new Map<string, string>();
  async function resolveRoleId(name: string): Promise<string> {
    const key = name.trim();
    const cached = roleIdByName.get(key.toLowerCase());
    if (cached) return cached;
    const existingRole = await tx.role.findFirst({
      where: { workspaceId, name: { equals: key, mode: "insensitive" }, archivedAt: null },
    });
    const roleId = existingRole ? existingRole.id : (await tx.role.create({ data: { workspaceId, name: key } })).id;
    roleIdByName.set(key.toLowerCase(), roleId);
    return roleId;
  }

  const laneOrder: string[] = [];
  const usedX: number[] = [];
  let previousStepId: string | undefined;

  for (const s of steps) {
    const roleId = s.roleName ? await resolveRoleId(s.roleName) : undefined;
    if (roleId && !laneOrder.includes(roleId)) laneOrder.push(roleId);
    const positionX = usedX.length === 0 ? FIRST_STEP_X : nextStepX(usedX);
    usedX.push(positionX);
    const positionY = laneY(roleId ?? null, laneOrder);

    const newStep = await tx.processStep.create({
      data: {
        processId,
        type: s.type,
        label: s.label,
        assignedRoleId: roleId,
        swimlaneRoleId: roleId,
        positionX,
        positionY,
      },
    });
    if (previousStepId) {
      await tx.stepConnection.create({
        data: { processId, fromStepId: previousStepId, toStepId: newStep.id },
      });
    }
    previousStepId = newStep.id;
  }

  for (const [i, a] of activities.entries()) {
    const newActivity = await tx.activity.create({
      data: { processId, name: a.name, order: i },
    });
    for (const asn of a.assignments) {
      const roleId = await resolveRoleId(asn.roleName);
      await tx.raciAssignment.create({
        data: { activityId: newActivity.id, roleId, code: asn.code },
      });
    }
  }
}

const MAX_CODE_GENERATION_ATTEMPTS = 5;

/**
 * Materializes an (optionally edited) generated draft into a real Process —
 * steps chained in the given order, RACI activities and assignments, and
 * Roles resolved by name (matching an existing Role in this workspace, or
 * creating one) since the draft only knows role/title names, not real ids.
 */
export async function createProcessFromTemplate(
  input: z.infer<typeof createFromTemplateSchema>
): Promise<ActionResult<{ id: string; code: string }>> {
  const parsed = createFromTemplateSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const { workspaceId, steps, activities } = parsed.data;

  const parentProcessId = parsed.data.parentProcessId || undefined;
  const parent = parentProcessId
    ? await prisma.process.findUnique({ where: { id: parentProcessId }, select: { code: true } })
    : null;
  if (parentProcessId && !parent) return notFound();

  const categoryId = parsed.data.categoryId || undefined;
  if (categoryId) {
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const category = await prisma.processCategory.findUnique({ where: { id: categoryId } });
    if (!category || category.firmId !== workspace.firmId) return notFound();
  }

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const existing = await prisma.process.findMany({ where: { workspaceId }, select: { code: true } });
    const code = generateProcessCode({
      name: parsed.data.processName,
      parentCode: parent?.code ?? null,
      existingCodes: existing.map((p) => p.code),
    });
    if (!isCodeAvailable(code, existing.map((p) => p.code))) continue;

    try {
      const process = await prisma.$transaction(async (tx) => {
        const newProcess = await tx.process.create({
          data: { workspaceId, code, name: parsed.data.processName, parentProcessId, categoryId },
        });
        await materializeDraft(tx, { workspaceId, processId: newProcess.id, steps, activities });

        return newProcess;
      });

      revalidatePath(`/${workspaceId}/processes/processes`);
      return ok({ id: process.id, code: process.code });
    } catch (error) {
      const isUniqueConflict =
        typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
      if (!isUniqueConflict || attempt === MAX_CODE_GENERATION_ATTEMPTS - 1) throw error;
    }
  }

  return validationError("Could not generate a unique Process Code — please try again.");
}

const fillSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  steps: z.array(templateStepSchema).min(1).max(40),
  activities: z.array(templateActivitySchema).max(40).default([]),
});

/**
 * Puts a draft into a process that already exists but has no steps yet.
 * Refuses outright if the process has any step, so a draft can never
 * overwrite or mix into work somebody already did.
 */
export async function fillEmptyProcessFromTemplate(
  input: z.infer<typeof fillSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = fillSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const { workspaceId, processId, steps, activities } = parsed.data;
  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process || process.workspaceId !== workspaceId) return notFound();

  const refused = await prisma.$transaction(async (tx) => {
    // Checked inside the transaction so two presses cannot both pass it.
    const [stepCount, activityCount] = await Promise.all([
      tx.processStep.count({ where: { processId } }),
      tx.activity.count({ where: { processId } }),
    ]);
    if (stepCount > 0 || activityCount > 0) return true;
    await materializeDraft(tx, { workspaceId, processId, steps, activities });
    return false;
  });
  if (refused) return validationError("This process already has steps, so a draft can't be added to it.");

  revalidatePath(`/${workspaceId}/processes/processes/${processId}/map`);
  revalidatePath(`/${workspaceId}/processes/processes`);
  return ok({ id: processId });
}
