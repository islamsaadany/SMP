import "server-only";
import { cache } from "react";
import { prisma } from "@/ffp/lib/db/client";
import { deriveGapsByStep, type StepGap } from "@/ffp/lib/domain/step-readiness";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

/** One process's gaps, and what the readiness marks need to read them (ffp/lib/domain/process-readiness.ts). */
export type ProcessGapDetail = { gaps: number; kinds: Set<StepGap>; steps: number; controls: number; controlsMissing: number };

/**
 * How many gaps each process carries, for the builder home (spec 067 §4.2): the
 * band's Gaps count, To handle and the All processes table. A gap is what the
 * map, the RACI and the Authority pages already flag on a step
 * (deriveGapsByStep, the same rules the value chain's cards use), plus each
 * risk logged with no control yet.
 *
 * Cached per request: the frame and the page under it both ask.
 */
export const processGaps = cache(async (workspaceId: string): Promise<Map<string, ProcessGapDetail>> => {
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
  const out = new Map<string, ProcessGapDetail>();
  const of = (id: string) => {
    let d = out.get(id);
    if (!d) out.set(id, (d = { gaps: 0, kinds: new Set(), steps: 0, controls: 0, controlsMissing: 0 }));
    return d;
  };
  for (const s of steps) {
    const d = of(s.processId), g = byStep.get(s.id) ?? [];
    d.steps++;
    d.gaps += g.length;
    for (const k of g) d.kinds.add(k);
  }
  for (const c of controls) {
    const d = of(c.processId);
    d.controls++;
    if (!c.control?.trim()) { d.controlsMissing++; d.gaps++; }
  }
  return out;
});

/** Just the counts, by process. */
export const gapsByProcess = cache(async (workspaceId: string): Promise<Map<string, number>> =>
  new Map([...(await processGaps(workspaceId))].map(([id, d]) => [id, d.gaps]))
);
