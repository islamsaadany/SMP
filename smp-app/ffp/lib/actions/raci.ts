"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { validateRaciMatrix, type RaciActivity, type RaciIssue } from "@/ffp/lib/domain/raci-validation";
import { buildRaciTableRows } from "@/ffp/lib/domain/raci-table";
import { syncOwnerFromRaci, unhideRaciRoles } from "@/ffp/lib/data/raci-owner-sync";
import { ok, notFound, validationError, type ActionResult } from "@/ffp/lib/actions/errors";

/** Verifies processId actually belongs to workspaceId, not just that the caller can access workspaceId. */
async function loadProcessInWorkspace(workspaceId: string, processId: string) {
  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process || process.workspaceId !== workspaceId) return null;
  return process;
}

const setAssignmentSchema = z.object({
  workspaceId: z.string().min(1),
  activityId: z.string().min(1),
  roleId: z.string().min(1),
  code: z.enum(["RESPONSIBLE", "ACCOUNTABLE", "CONSULTED", "INFORMED"]).nullable(),
});

export async function setRaciAssignment(
  input: z.infer<typeof setAssignmentSchema>
): Promise<ActionResult<{ cleared: boolean }>> {
  const parsed = setAssignmentSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid assignment", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const { activityId, roleId, code } = parsed.data;

  const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { process: true } });
  if (!activity || activity.process.workspaceId !== parsed.data.workspaceId) return notFound();

  if (code === null) {
    await prisma.raciAssignment.deleteMany({ where: { activityId, roleId } });
  } else {
    await prisma.raciAssignment.upsert({
      where: { activityId_roleId: { activityId, roleId } },
      update: { code },
      create: { activityId, roleId, code },
    });
  }

  if (code !== null) await unhideRaciRoles(activity.processId, [roleId]);
  /* the Map's owner of this step follows the row's Responsible */
  if (activity.relatedStepId && (await syncOwnerFromRaci(activity.processId, activity.relatedStepId))) {
    revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${activity.processId}/map`);
  }
  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${activity.processId}/raci`);
  return ok({ cleared: code === null });
}

const setStepRaciCellSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  stepId: z.string().min(1),
  roleId: z.string().min(1),
  code: z.enum(["RESPONSIBLE", "ACCOUNTABLE", "CONSULTED", "INFORMED"]).nullable(),
});

/**
 * Sets one role's RACI code for a Process Map step that doesn't have a
 * linked Activity yet — creating one (reusing it if it already exists) the
 * first time a cell on that step's row is filled in. Clears raciSkipped,
 * in case the step was previously skipped and is now being assigned
 * instead. This is what makes every step in the RACI table immediately
 * assignable without a separate "add to RACI" step first.
 */
export async function setStepRaciCell(
  input: z.infer<typeof setStepRaciCellSchema>
): Promise<ActionResult<{ activityId: string }>> {
  const parsed = setStepRaciCellSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const { processId, stepId, roleId, code } = parsed.data;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, processId);
  if (!process) return notFound();

  const step = await prisma.processStep.findUnique({ where: { id: stepId } });
  if (!step || step.processId !== processId) return notFound();

  const activity = await prisma.$transaction(async (tx) => {
    let activity = await tx.activity.findFirst({ where: { relatedStepId: stepId } });
    if (!activity) {
      const count = await tx.activity.count({ where: { processId } });
      activity = await tx.activity.create({
        data: { processId, name: step.label, relatedStepId: stepId, order: count },
      });
    }

    if (code === null) {
      await tx.raciAssignment.deleteMany({ where: { activityId: activity.id, roleId } });
    } else {
      await tx.raciAssignment.upsert({
        where: { activityId_roleId: { activityId: activity.id, roleId } },
        update: { code },
        create: { activityId: activity.id, roleId, code },
      });
    }

    if (step.raciSkipped) {
      await tx.processStep.update({ where: { id: stepId }, data: { raciSkipped: false } });
    }

    return activity;
  });

  if (code !== null) await unhideRaciRoles(processId, [roleId]);
  /* the Map's owner of this step follows the row's Responsible */
  if (await syncOwnerFromRaci(processId, stepId)) revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${processId}/map`);
  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${processId}/raci`);
  return ok({ activityId: activity.id });
}

const stepRaciSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  stepId: z.string().min(1),
});

/** Marks a Process Map step as intentionally not needing a RACI row. */
export async function skipStepRaci(
  input: z.infer<typeof stepRaciSchema>
): Promise<ActionResult<{ stepId: string }>> {
  const parsed = stepRaciSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, parsed.data.processId);
  if (!process) return notFound();

  const step = await prisma.processStep.findUnique({ where: { id: parsed.data.stepId } });
  if (!step || step.processId !== parsed.data.processId) return notFound();

  await prisma.processStep.update({ where: { id: step.id }, data: { raciSkipped: true } });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${parsed.data.processId}/raci`);
  return ok({ stepId: step.id });
}

/** Reverses skipStepRaci — puts the step back in the pending queue. */
export async function unskipStepRaci(
  input: z.infer<typeof stepRaciSchema>
): Promise<ActionResult<{ stepId: string }>> {
  const parsed = stepRaciSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, parsed.data.processId);
  if (!process) return notFound();

  const step = await prisma.processStep.findUnique({ where: { id: parsed.data.stepId } });
  if (!step || step.processId !== parsed.data.processId) return notFound();

  await prisma.processStep.update({ where: { id: step.id }, data: { raciSkipped: false } });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${parsed.data.processId}/raci`);
  return ok({ stepId: step.id });
}

const updateActivitySchema = z.object({
  workspaceId: z.string().min(1),
  activityId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
});

/** Renames a RACI Activity — whether it's linked to a Process Map step or freestanding. */
export async function updateActivity(
  input: z.infer<typeof updateActivitySchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateActivitySchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const activity = await prisma.activity.findUnique({
    where: { id: parsed.data.activityId },
    include: { process: true },
  });
  if (!activity || activity.process.workspaceId !== parsed.data.workspaceId) return notFound();

  const updated = await prisma.activity.update({
    where: { id: activity.id },
    data: { name: parsed.data.name },
  });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${activity.processId}/raci`);
  return ok({ id: updated.id });
}

const deleteActivitySchema = z.object({
  workspaceId: z.string().min(1),
  activityId: z.string().min(1),
});

/**
 * Deletes a RACI Activity and its assignments. If it was linked to a
 * Process Map step, that step reverts to a plain unassigned row in the
 * table (the step itself is untouched — deleting a step happens on the
 * Process Map page, not here).
 */
export async function deleteActivity(
  input: z.infer<typeof deleteActivitySchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteActivitySchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const activity = await prisma.activity.findUnique({
    where: { id: parsed.data.activityId },
    include: { process: true },
  });
  if (!activity || activity.process.workspaceId !== parsed.data.workspaceId) return notFound();

  await prisma.activity.delete({ where: { id: activity.id } });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${activity.processId}/raci`);
  return ok({ id: activity.id });
}

const pinRaciRoleSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  roleId: z.string().min(1),
});

/**
 * Pins a Role as a visible RACI table column for this process ("+ Add
 * title"), even before it has any assignment — a plain workspace-wide Role
 * list can run to dozens of titles across a large org, most irrelevant to
 * any one process, so the table defaults to only what's actually in use
 * (see computeVisibleRoleIds) and this is how you explicitly widen that set.
 */
export async function pinRaciRole(
  input: z.infer<typeof pinRaciRoleSchema>
): Promise<ActionResult<{ processId: string }>> {
  const parsed = pinRaciRoleSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, parsed.data.processId);
  if (!process) return notFound();

  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
  if (!role || role.workspaceId !== parsed.data.workspaceId) return notFound();

  if (!process.raciVisibleRoleIds.includes(role.id)) {
    await prisma.process.update({
      where: { id: process.id },
      data: { raciVisibleRoleIds: { push: role.id } },
    });
  }
  await unhideRaciRoles(process.id, [role.id]);

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${process.id}/raci`);
  return ok({ processId: process.id });
}

const removeRaciRoleSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  roleId: z.string().min(1),
  /** Set once the person has seen the warning about what is already entered under the title. */
  confirm: z.boolean().optional(),
});

/**
 * Takes a title (a column) out of this process's RACI table. A title with nothing under it goes at once. A title
 * with letters under it is NOT removed until the person has confirmed: the first call answers `needsConfirm` with how
 * many letters would go, and only a call with `confirm` deletes them. The title stays on the Map where a step names
 * it (this is the table's own list), and comes back by itself if a step or a letter names it again.
 */
export async function removeRaciRole(
  input: z.infer<typeof removeRaciRoleSchema>
): Promise<ActionResult<{ removed: boolean; needsConfirm: boolean; letters: number }>> {
  const parsed = removeRaciRoleSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const { processId, roleId } = parsed.data;
  const process = await loadProcessInWorkspace(parsed.data.workspaceId, processId);
  if (!process) return notFound();
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.workspaceId !== parsed.data.workspaceId) return notFound();

  const letters = await prisma.raciAssignment.count({ where: { roleId, activity: { processId } } });
  if (letters > 0 && !parsed.data.confirm) return ok({ removed: false, needsConfirm: true, letters });

  await prisma.$transaction([
    prisma.raciAssignment.deleteMany({ where: { roleId, activity: { processId } } }),
    prisma.process.update({
      where: { id: processId },
      data: {
        raciVisibleRoleIds: process.raciVisibleRoleIds.filter((id) => id !== roleId),
        raciHiddenRoleIds: process.raciHiddenRoleIds.includes(roleId) ? process.raciHiddenRoleIds : [...process.raciHiddenRoleIds, roleId],
      },
    }),
  ]);
  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${processId}/raci`);
  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${processId}/authority`);
  return ok({ removed: true, needsConfirm: false, letters });
}

/**
 * Loads the same unified row set the RACI table renders — every step (its
 * linked Activity if it has one, otherwise an empty assignable row) plus
 * any freestanding Activity — and shapes it for validateRaciMatrix. A
 * skipped step's row is excluded, same as it's excluded from the table's
 * "needs RACI" set. Used by both validateRaciMatrixAction and
 * finalizeRaciMatrix so finalizing is blocked by any unassigned,
 * unskipped step — not just ones that already happen to have an Activity.
 */
async function loadRaciActivities(processId: string): Promise<RaciActivity[]> {
  const [steps, activities] = await Promise.all([
    prisma.processStep.findMany({
      where: { processId },
      select: { id: true, type: true, label: true, raciSkipped: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.activity.findMany({
      where: { processId },
      include: { raciAssignments: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const rows = buildRaciTableRows(
    steps,
    activities.map((a) => ({
      id: a.id,
      name: a.name,
      relatedStepId: a.relatedStepId,
      order: a.order,
      assignments: a.raciAssignments.map((ra) => ({ roleId: ra.roleId, code: ra.code })),
    }))
  );

  return rows
    .filter((r) => !r.skipped)
    .map((r) => ({
      activityId: r.id,
      name: r.label,
      assignments: Object.entries(r.assignments).map(([roleId, code]) => ({ roleId, code })),
    }));
}

const processIdSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
});

export async function validateRaciMatrixAction(
  input: z.infer<typeof processIdSchema>
): Promise<ActionResult<{ issues: RaciIssue[] }>> {
  const parsed = processIdSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "VIEWER");
  if (!access.ok) return access;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, parsed.data.processId);
  if (!process) return notFound();

  const activities = await loadRaciActivities(parsed.data.processId);
  return ok({ issues: validateRaciMatrix(activities) });
}

export async function finalizeRaciMatrix(
  input: z.infer<typeof processIdSchema>
): Promise<ActionResult<{ status: "FINAL" }> | { ok: false; error: "VALIDATION_FAILED"; issues: RaciIssue[] }> {
  const parsed = processIdSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues) as never;

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access as never;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, parsed.data.processId);
  if (!process) return notFound() as never;

  const activities = await loadRaciActivities(parsed.data.processId);
  const issues = validateRaciMatrix(activities);
  if (issues.length > 0) {
    return { ok: false, error: "VALIDATION_FAILED", issues };
  }

  await prisma.raciMatrixStatus.upsert({
    where: { processId: parsed.data.processId },
    update: { status: "FINAL", finalizedAt: new Date() },
    create: { processId: parsed.data.processId, status: "FINAL", finalizedAt: new Date() },
  });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${parsed.data.processId}/raci`);
  return ok({ status: "FINAL" });
}

export async function reopenRaciMatrix(
  input: z.infer<typeof processIdSchema>
): Promise<ActionResult<{ status: "DRAFT" }>> {
  const parsed = processIdSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const process = await loadProcessInWorkspace(parsed.data.workspaceId, parsed.data.processId);
  if (!process) return notFound();

  await prisma.raciMatrixStatus.upsert({
    where: { processId: parsed.data.processId },
    update: { status: "DRAFT", finalizedAt: null },
    create: { processId: parsed.data.processId, status: "DRAFT" },
  });

  revalidatePath(`/${parsed.data.workspaceId}/processes/processes/${parsed.data.processId}/raci`);
  return ok({ status: "DRAFT" });
}
