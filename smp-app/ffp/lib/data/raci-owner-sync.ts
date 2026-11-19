import "server-only";
import { prisma } from "@/ffp/lib/db/client";
import { assignSwimlanes } from "@/ffp/lib/domain/process-layout";
import { resetIfInForce } from "@/ffp/lib/data/process-lifecycle-reset";

/* THE MAP'S OWNER OF A STEP AND THE RACI'S RESPONSIBLE ARE ONE FACT, kept in step from both sides:
   - Map -> RACI: when a step's role changes, the new role is Responsible on the step's row and the old role's
     Responsible letter (only that letter) goes, so the table follows the Map instead of piling up stale titles.
   - RACI -> Map: when a row's Responsible changes, the step's role follows (see syncOwnerFromRaci for the exact rule).
   A letter other than R is never touched, and a skipped step's row is never created or changed here. */

/** A role the office put back on a step or a row is shown in the RACI again, even if it had been removed from the table. */
export async function unhideRaciRoles(processId: string, roleIds: (string | null | undefined)[]): Promise<void> {
  const ids = roleIds.filter((x): x is string => !!x);
  if (!ids.length) return;
  const p = await prisma.process.findUnique({ where: { id: processId }, select: { raciHiddenRoleIds: true } });
  if (!p || !ids.some((id) => p.raciHiddenRoleIds.includes(id))) return;
  await prisma.process.update({ where: { id: processId }, data: { raciHiddenRoleIds: p.raciHiddenRoleIds.filter((id) => !ids.includes(id)) } });
}

/** Map -> RACI. Call after a step's role changed from `oldRoleId` to `newRoleId` (either may be empty). */
export async function moveOwnerResponsible(processId: string, stepId: string, oldRoleId: string | null, newRoleId: string | null): Promise<void> {
  if (oldRoleId === newRoleId) return;
  const step = await prisma.processStep.findUnique({ where: { id: stepId }, select: { raciSkipped: true, label: true } });
  if (!step || step.raciSkipped) return;
  let rows = await prisma.activity.findMany({ where: { relatedStepId: stepId }, select: { id: true } });
  if (rows.length === 0 && newRoleId) {
    const count = await prisma.activity.count({ where: { processId } });
    rows = [await prisma.activity.create({ data: { processId, name: step.label, relatedStepId: stepId, order: count }, select: { id: true } })];
  }
  for (const row of rows) {
    if (oldRoleId) await prisma.raciAssignment.deleteMany({ where: { activityId: row.id, roleId: oldRoleId, code: "RESPONSIBLE" } });
    if (newRoleId) {
      const held = await prisma.raciAssignment.findUnique({ where: { activityId_roleId: { activityId: row.id, roleId: newRoleId } }, select: { id: true } });
      if (!held) await prisma.raciAssignment.create({ data: { activityId: row.id, roleId: newRoleId, code: "RESPONSIBLE" } });
    }
  }
  await unhideRaciRoles(processId, [newRoleId]);
}

/**
 * RACI -> Map. After a letter on a step's row was set or cleared: the step's role follows the row's Responsible when
 * that is unambiguous — the step has no role yet and the row has exactly one R, or the step's current role is no
 * longer an R on the row and exactly one other role is. With two or more R's (a shared task) the Map is left alone.
 * Returns whether the step's role changed.
 */
export async function syncOwnerFromRaci(processId: string, stepId: string): Promise<boolean> {
  const step = await prisma.processStep.findUnique({ where: { id: stepId }, select: { processId: true, assignedRoleId: true, raciSkipped: true } });
  if (!step || step.processId !== processId || step.raciSkipped) return false;
  const rs = await prisma.raciAssignment.findMany({ where: { activity: { relatedStepId: stepId }, code: "RESPONSIBLE" }, select: { roleId: true } });
  const rIds = [...new Set(rs.map((r) => r.roleId))];
  if (rIds.length !== 1) return false;
  const only = rIds[0]!;
  if (step.assignedRoleId === only) return false;
  /* the current owner is still an R on the row only when it is `only`, so reaching here means they are not */
  await prisma.processStep.update({ where: { id: stepId }, data: { assignedRoleId: only, swimlaneRoleId: only } });
  const steps = await prisma.processStep.findMany({ where: { processId }, select: { id: true, assignedRoleId: true, swimlaneRoleId: true, positionY: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const layout = assignSwimlanes(steps);
  for (const s of steps) if (layout.yOf.get(s.id) !== s.positionY) await prisma.processStep.update({ where: { id: s.id }, data: { positionY: layout.yOf.get(s.id)! } });
  await resetIfInForce(processId);
  return true;
}
