import "server-only";
import { cache } from "react";
import { prisma } from "@/ffp/lib/db/client";
import { deriveGapsByStep } from "@/ffp/lib/domain/step-readiness";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

/**
 * How many gaps each process carries, for the builder home (spec 067 §4.2): the
 * band's Gaps count and To handle. A gap is what the map, the RACI and the
 * Authority pages already flag on a step (deriveGapsByStep, the same rules the
 * value chain's cards use), plus each risk logged with no control yet.
 *
 * Cached per request: the frame and the page under it both ask.
 */
export const gapsByProcess = cache(async (workspaceId: string): Promise<Map<string, number>> => {
  const live = { workspaceId, archivedAt: null };
  const [steps, connections, activities, authorityAssignments, controls] = await Promise.all([
    prisma.processStep.findMany({
      where: { process: live },
      select: { id: true, type: true, label: true, raciSkipped: true, processId: true },
    }),
    prisma.stepConnection.findMany({ where: { toStep: { process: live } }, select: { toStepId: true } }),
    prisma.activity.findMany({ where: { process: live }, include: { raciAssignments: true }, orderBy: { order: "asc" } }),
    prisma.authorityAssignment.findMany({ where: { process: live }, include: AUTHORITY_ASSIGNMENT_INCLUDE }),
    prisma.processControl.findMany({ where: { process: live }, select: { processId: true, control: true } }),
  ]);
  const byStep = deriveGapsByStep({
    steps: steps.map((s) => ({ id: s.id, type: s.type, label: s.label, raciSkipped: s.raciSkipped })),
    activities: activities.map((a) => ({
      id: a.id,
      name: a.name,
      relatedStepId: a.relatedStepId,
      order: a.order,
      assignments: a.raciAssignments.map((r) => ({ roleId: r.roleId, code: r.code })),
    })),
    authorityAssignments: authorityAssignments.map(toAuthorityAssignmentData),
    incomingStepIds: new Set(connections.map((c) => c.toStepId)),
  });
  const out = new Map<string, number>();
  const add = (id: string, n: number) => out.set(id, (out.get(id) ?? 0) + n);
  for (const s of steps) add(s.processId, byStep.get(s.id)?.length ?? 0);
  for (const c of controls) if (!c.control?.trim()) add(c.processId, 1);
  return out;
});
