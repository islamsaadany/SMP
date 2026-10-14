"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { buildProcessReviewPrompt } from "@/ffp/lib/domain/process-review";
import {
  normalizeFindingTitle,
  partitionNewFindings,
  appendReviewNote,
  toPersistedFinding,
  type PersistedReviewFinding,
} from "@/ffp/lib/domain/review-findings";
import { runProcessReview } from "@/ffp/lib/ai/process-review";
import { ok, notFound, validationError, aiUnavailable, type ActionResult } from "@/ffp/lib/actions/errors";
import type { ReviewFindingCategory, ReviewFindingArea, ReviewFindingSeverity } from "@/ffp/generated/prisma/client";
import { laneY, nextStepX } from "@/ffp/lib/domain/process-layout";
import { insertPositionAfter } from "@/ffp/lib/domain/step-order";
import { loadProcessReviewContext } from "@/ffp/lib/data/process-review-context";
import { getActionLocale } from "@/ffp/lib/i18n/server";
import { withAnswerLanguage } from "@/ffp/lib/i18n/locale";

export type { PersistedReviewFinding } from "@/ffp/lib/domain/review-findings";

const SEVERITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const reviewProcessSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
});

/**
 * Gathers a Process's Map, RACI matrix, and this Process's Authority Matrix
 * (plus the workspace's industry/background notes, for sector-aware
 * findings), asks Claude to review it end to end, and persists any genuinely
 * new findings as ReviewFinding rows scoped to this process. A finding the
 * user already dismissed on this process won't be re-created even if a later
 * run rediscovers the same issue; a finding already being tracked (open,
 * edited, or integrated) is left as-is rather than duplicated. Read-only —
 * any Workspace member (VIEWER+) can run it, same as the export routes.
 */
export async function reviewProcessWithAI(
  input: z.infer<typeof reviewProcessSchema>
): Promise<ActionResult<{ summary: string; findings: PersistedReviewFinding[] }>> {
  const parsed = reviewProcessSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "VIEWER");
  if (!access.ok) return access;

  const { workspaceId, processId } = parsed.data;

  const [workspace, process] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.process.findUnique({ where: { id: processId } }),
  ]);
  if (!workspace || !process || process.workspaceId !== workspaceId) return notFound();

  const [promptContext, existingFindings] = await Promise.all([
    loadProcessReviewContext(workspace, process),
    prisma.reviewFinding.findMany({ where: { processId }, include: { integratedStep: true } }),
  ]);
  const promptText = buildProcessReviewPrompt(promptContext);

  const outcome = await runProcessReview(withAnswerLanguage(promptText, await getActionLocale()));
  if (!outcome.ok) {
    if (outcome.reason === "NOT_CONFIGURED") return aiUnavailable(outcome.message);
    return validationError(outcome.message);
  }

  const dismissedTitles = new Set(
    existingFindings.filter((f) => f.status === "DISMISSED").map((f) => normalizeFindingTitle(f.title))
  );
  const trackedTitles = new Set(
    existingFindings.filter((f) => f.status !== "DISMISSED").map((f) => normalizeFindingTitle(f.title))
  );
  const newFindings = partitionNewFindings(outcome.data.findings, dismissedTitles, trackedTitles);

  if (newFindings.length > 0) {
    await prisma.reviewFinding.createMany({
      data: newFindings.map((f) => ({
        processId,
        category: f.category.toUpperCase() as ReviewFindingCategory,
        area: f.area.toUpperCase() as ReviewFindingArea,
        severity: f.severity.toUpperCase() as ReviewFindingSeverity,
        title: f.title,
        description: f.description,
        recommendation: f.recommendation,
      })),
    });
  }

  const allFindings = await prisma.reviewFinding.findMany({
    where: { processId, status: { not: "DISMISSED" } },
    include: { integratedStep: true },
  });
  allFindings.sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return sev !== 0 ? sev : a.createdAt.getTime() - b.createdAt.getTime();
  });

  revalidatePath(`/${workspaceId}/processes/processes/${processId}/review`);
  return ok({ summary: outcome.data.summary, findings: allFindings.map(toPersistedFinding) });
}

const findingIdSchema = z.object({
  workspaceId: z.string().min(1),
  findingId: z.string().min(1),
});

/**
 * Loads a finding and its owning process, checking both belong to the given
 * workspace. Shared by every action below that mutates a single finding.
 */
async function loadFindingInWorkspace(workspaceId: string, findingId: string) {
  const finding = await prisma.reviewFinding.findUnique({
    where: { id: findingId },
    include: { process: true },
  });
  if (!finding || finding.process.workspaceId !== workspaceId) return null;
  return finding;
}

const updateFindingSchema = findingIdSchema.extend({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  recommendation: z.string().trim().min(1).max(1000),
});

/** Edits a finding's text. Only open/already-edited findings can be edited. */
export async function updateReviewFinding(
  input: z.infer<typeof updateFindingSchema>
): Promise<ActionResult<PersistedReviewFinding>> {
  const parsed = updateFindingSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const finding = await loadFindingInWorkspace(parsed.data.workspaceId, parsed.data.findingId);
  if (!finding) return notFound();
  if (finding.status !== "OPEN" && finding.status !== "EDITED") {
    return validationError("Only open findings can be edited.");
  }

  const { title, description, recommendation } = parsed.data;
  const updated = await prisma.reviewFinding.update({
    where: { id: finding.id },
    data: { title, description, recommendation, status: "EDITED" },
    include: { integratedStep: true },
  });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${finding.processId}/review`);
  return ok(toPersistedFinding(updated));
}

/**
 * Dismisses a finding permanently for this process: soft-deleted from view,
 * and excluded from future AI review runs even if the same issue resurfaces
 * (matched by normalized title). If the finding was already integrated into
 * the Process Map, that change to the map is not reverted.
 */
export async function deleteReviewFinding(
  input: z.infer<typeof findingIdSchema>
): Promise<ActionResult<{ findingId: string }>> {
  const parsed = findingIdSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const finding = await loadFindingInWorkspace(parsed.data.workspaceId, parsed.data.findingId);
  if (!finding) return notFound();

  await prisma.reviewFinding.update({ where: { id: finding.id }, data: { status: "DISMISSED" } });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${finding.processId}/review`);
  return ok({ findingId: finding.id });
}

const integrateFindingSchema = findingIdSchema.extend({
  stepId: z.string().min(1),
  mode: z.enum(["MERGED", "REPLACED"]),
});

/**
 * Pushes a finding's recommendation into the Process Map. MERGED appends it
 * as a note on the target step, leaving the step's label, connections, and
 * RACI assignments untouched. REPLACED overwrites the step's label with the
 * finding's title and its notes with the recommendation — the old label is
 * gone, but the step keeps its id, so its connections and RACI assignments
 * carry over unchanged.
 */
export async function integrateReviewFinding(
  input: z.infer<typeof integrateFindingSchema>
): Promise<ActionResult<PersistedReviewFinding>> {
  const parsed = integrateFindingSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const finding = await loadFindingInWorkspace(parsed.data.workspaceId, parsed.data.findingId);
  if (!finding) return notFound();
  if (finding.status === "DISMISSED") return validationError("A dismissed finding can't be integrated.");

  const step = await prisma.processStep.findUnique({ where: { id: parsed.data.stepId } });
  if (!step || step.processId !== finding.processId) return notFound();

  const { mode } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (mode === "MERGED") {
      await tx.processStep.update({
        where: { id: step.id },
        data: { reviewNotes: appendReviewNote(step.reviewNotes, finding.recommendation) },
      });
    } else {
      await tx.processStep.update({
        where: { id: step.id },
        data: { label: finding.title, reviewNotes: finding.recommendation },
      });
    }

    return tx.reviewFinding.update({
      where: { id: finding.id },
      data: { status: "INTEGRATED", integratedStepId: step.id, integrationMode: mode },
      include: { integratedStep: true },
    });
  });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${finding.processId}/review`);
  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${finding.processId}/map`);
  return ok(toPersistedFinding(updated));
}

const proposeStepSchema = findingIdSchema.extend({
  label: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  afterStepId: z.string().min(1).optional().or(z.literal("")),
});

function revalidateReview(workspaceId: string, processId: string) {
  revalidatePath(`/${workspaceId}/processes/processes/${processId}/review`);
  revalidatePath(`/${workspaceId}/processes/processes/${processId}/map`);
}

/**
 * Suggests a new step from a finding. Nothing is added to the process yet:
 * the suggestion is only stored on the finding and shown, highlighted, on the
 * map until the user confirms or deletes it.
 */
export async function proposeStepFromFinding(
  input: z.infer<typeof proposeStepSchema>
): Promise<ActionResult<PersistedReviewFinding>> {
  const parsed = proposeStepSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const finding = await loadFindingInWorkspace(parsed.data.workspaceId, parsed.data.findingId);
  if (!finding) return notFound();
  if (finding.status === "DISMISSED" || finding.status === "INTEGRATED") {
    return validationError("This finding is already handled.");
  }

  let afterStepId: string | null = null;
  if (parsed.data.afterStepId) {
    const anchor = await prisma.processStep.findUnique({ where: { id: parsed.data.afterStepId } });
    if (!anchor || anchor.processId !== finding.processId) return notFound();
    afterStepId = anchor.id;
  }

  const updated = await prisma.reviewFinding.update({
    where: { id: finding.id },
    data: {
      proposedLabel: parsed.data.label,
      proposedNotes: parsed.data.notes || null,
      proposedAfterStepId: afterStepId,
    },
    include: { integratedStep: true },
  });

  revalidateReview(parsed.data.workspaceId, finding.processId);
  return ok(toPersistedFinding(updated));
}

/** Turns a waiting proposal into a real step placed after its chosen step. */
export async function confirmProposedStep(
  input: z.infer<typeof findingIdSchema>
): Promise<ActionResult<PersistedReviewFinding>> {
  const parsed = findingIdSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const finding = await loadFindingInWorkspace(parsed.data.workspaceId, parsed.data.findingId);
  if (!finding) return notFound();
  if (!finding.proposedLabel) return validationError("There is no proposed step to confirm.");
  const label = finding.proposedLabel;
  const notes = finding.proposedNotes;
  const processId = finding.processId;

  const steps = await prisma.processStep.findMany({
    where: { processId },
    select: { id: true, positionX: true, swimlaneRoleId: true, assignedRoleId: true, order: true },
    orderBy: { order: "asc" },
  });
  const orderedIds = steps.map((s) => s.id);
  // If the chosen step has been deleted meanwhile, fall back to the end.
  const anchorId =
    finding.proposedAfterStepId && orderedIds.includes(finding.proposedAfterStepId)
      ? finding.proposedAfterStepId
      : null;
  const position = insertPositionAfter(orderedIds, anchorId);
  const laneOrder: string[] = [];
  for (const s of steps) {
    const roleId = s.swimlaneRoleId ?? s.assignedRoleId;
    if (roleId && !laneOrder.includes(roleId)) laneOrder.push(roleId);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (position < orderedIds.length) {
      await tx.processStep.updateMany({
        where: { processId, id: { in: orderedIds.slice(position) } },
        data: { order: { increment: 1 } },
      });
    }
    const created = await tx.processStep.create({
      data: {
        processId,
        type: "TASK",
        label,
        reviewNotes: notes || undefined,
        positionX: nextStepX(steps.map((s) => s.positionX)),
        positionY: laneY(null, laneOrder),
        order: position,
      },
    });
    if (anchorId) {
      // Slot it into the flow: what followed the chosen step now follows the new one.
      await tx.stepConnection.updateMany({
        where: { processId, fromStepId: anchorId },
        data: { fromStepId: created.id },
      });
      await tx.stepConnection.create({ data: { processId, fromStepId: anchorId, toStepId: created.id } });
    }
    return tx.reviewFinding.update({
      where: { id: finding.id },
      data: {
        status: "INTEGRATED",
        integratedStepId: created.id,
        integrationMode: null,
        proposedLabel: null,
        proposedNotes: null,
        proposedAfterStepId: null,
      },
      include: { integratedStep: true },
    });
  });

  revalidateReview(parsed.data.workspaceId, processId);
  return ok(toPersistedFinding(updated));
}

/** Throws a waiting proposal away; the finding goes back to open. */
export async function deleteProposedStep(
  input: z.infer<typeof findingIdSchema>
): Promise<ActionResult<PersistedReviewFinding>> {
  const parsed = findingIdSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const finding = await loadFindingInWorkspace(parsed.data.workspaceId, parsed.data.findingId);
  if (!finding) return notFound();

  const updated = await prisma.reviewFinding.update({
    where: { id: finding.id },
    data: {
      proposedLabel: null,
      proposedNotes: null,
      proposedAfterStepId: null,
      ...(finding.status === "INTEGRATED" || finding.status === "DISMISSED" ? {} : { status: "OPEN" }),
    },
    include: { integratedStep: true },
  });

  revalidateReview(parsed.data.workspaceId, finding.processId);
  return ok(toPersistedFinding(updated));
}
