import "server-only";
import { prisma } from "@/ffp/lib/db/client";
import { describeAuthorityRule } from "@/ffp/lib/domain/authority-table";
import { deriveGapsByStep } from "@/ffp/lib/domain/step-readiness";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

/**
 * A PROCESS AS ITS READERS READ IT (spec 067 §1, §3.2; stage 5). What the
 * reading side shows of a process, worked out in one place: what it is for,
 * its scope and measures, its document control, its steps (who does each,
 * what they do, the approval and time limit in plain words, the risks and
 * controls), the arrows between them, and the RACI's gaps.
 *
 * The office edits the process itself; that is the draft. When a version is
 * approved, this is taken from the process and kept on the version
 * (ProcessVersion.snapshot), so what the approver approved is exactly what is
 * published, and readers keep reading the version in force while the office
 * drafts the next one. Nothing that edits a process has to know about it.
 */

export type ContentStep = {
  id: string;
  type: "START" | "TASK" | "DECISION" | "END";
  /** Its number among the steps a reader counts (tasks and decisions); null for Start and End. */
  n: number | null;
  label: string;
  lane: string;
  roleId: string | null;
  role: string | null;
  acts: string[];
  approval: string[];
  time: string[];
  controls: { risk: string; control: string | null }[];
};

export type Content = {
  purpose: string | null;
  inScope: string[];
  outScope: string[];
  kpis: { metric: string; target: string; frequency: string }[];
  sopVersion: string | null;
  sopEffectiveDate: string | null;
  steps: ContentStep[];
  lanes: { key: string; name: string | null }[];
  connections: { from: string; to: string; label: string | null }[];
  gaps: { stepId: string; kind: "ACCOUNTABLE" | "TOO_MANY_ACCOUNTABLE" | "RESPONSIBLE" }[];
  looseNoControl: string[];
};

/** The process as it stands now: the draft the office is editing. */
export async function liveContent(processId: string): Promise<Content | null> {
  const p = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      processPurpose: true, inScope: true, outOfScope: true, kpis: true, sopVersion: true, sopEffectiveDate: true,
      steps: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, type: true, label: true, detailedAction: true, raciSkipped: true, assignedRoleId: true, assignedRole: { select: { name: true } } } },
      controls: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { stepId: true, risk: true, control: true } },
      activities: { orderBy: { order: "asc" }, select: { id: true, name: true, relatedStepId: true, order: true, raciAssignments: { select: { roleId: true, code: true } } } },
      authorityAssignments: { include: AUTHORITY_ASSIGNMENT_INCLUDE },
    },
  });
  if (!p) return null;
  const connections = await prisma.stepConnection.findMany({ where: { processId }, orderBy: { id: "asc" }, select: { fromStepId: true, toStepId: true, label: true } });

  /* who a rule lands on, by name */
  const roleIds = new Set<string>(), personIds = new Set<string>();
  for (const a of p.authorityAssignments) for (const r of a.rules) { if (r.whoRoleId) roleIds.add(r.whoRoleId); if (r.whoPersonId) personIds.add(r.whoPersonId); }
  const [roles, people] = await Promise.all([
    prisma.role.findMany({ where: { id: { in: [...roleIds] } }, select: { id: true, name: true } }),
    prisma.person.findMany({ where: { id: { in: [...personIds] } }, select: { id: true, name: true } }),
  ]);
  const who = new Map([...roles, ...people].map((x) => [x.id, x.name]));
  const stepOfActivity = new Map(p.activities.map((a) => [a.id, a.relatedStepId]));
  const rulesByStep = new Map<string, ReturnType<typeof toAuthorityAssignmentData>["rules"]>();
  for (const a of p.authorityAssignments) {
    if (a.skipped) continue;
    const sid = a.stepId ?? (a.activityId ? stepOfActivity.get(a.activityId) : null);
    if (sid) rulesByStep.set(sid, [...(rulesByStep.get(sid) ?? []), ...toAuthorityAssignmentData(a).rules]);
  }

  /* lanes are job titles, in the order they first do a step; Start and End sit with the step beside them */
  const counted = p.steps.filter((s) => s.type === "TASK" || s.type === "DECISION");
  const laneOf = (s: (typeof p.steps)[number]) =>
    s.assignedRoleId ?? (s.type === "START" ? counted[0]?.assignedRoleId : s.type === "END" ? counted.at(-1)?.assignedRoleId : null) ?? "none";
  const lanes: Content["lanes"] = [];
  for (const s of p.steps) {
    const k = laneOf(s);
    if (!lanes.some((l) => l.key === k)) lanes.push({ key: k, name: k === "none" ? null : (p.steps.find((x) => x.assignedRoleId === k)?.assignedRole?.name ?? null) });
  }
  const steps: ContentStep[] = p.steps.map((s) => {
    const rules = rulesByStep.get(s.id) ?? [];
    const say = (measure: string) => rules.filter((r) => r.measure === measure).map((r) => describeAuthorityRule(r, (r.whoPersonId && who.get(r.whoPersonId)) || (r.whoRoleId && who.get(r.whoRoleId)) || null));
    const i = counted.findIndex((c) => c.id === s.id);
    return {
      id: s.id,
      type: s.type,
      n: i >= 0 ? i + 1 : null,
      label: s.label,
      lane: laneOf(s),
      roleId: s.assignedRoleId,
      role: s.assignedRole?.name ?? null,
      acts: s.detailedAction,
      approval: say("MONEY"),
      time: say("TIME"),
      controls: p.controls.filter((c) => c.stepId === s.id).map((c) => ({ risk: c.risk, control: c.control?.trim() || null })),
    };
  });

  /* the RACI's gaps, as the map and the RACI flag them (step-readiness.ts) */
  const byStep = deriveGapsByStep({
    steps: p.steps.map((s) => ({ id: s.id, type: s.type, label: s.label, raciSkipped: s.raciSkipped })),
    activities: p.activities.map((a) => ({ id: a.id, name: a.name, relatedStepId: a.relatedStepId, order: a.order, assignments: a.raciAssignments })),
    authorityAssignments: p.authorityAssignments.map(toAuthorityAssignmentData),
    incomingStepIds: new Set(connections.map((c) => c.toStepId)),
  });
  const gaps: Content["gaps"] = [];
  for (const s of counted)
    for (const k of byStep.get(s.id) ?? []) if (k === "ACCOUNTABLE" || k === "TOO_MANY_ACCOUNTABLE" || k === "RESPONSIBLE") gaps.push({ stepId: s.id, kind: k });

  const kpis = Array.isArray(p.kpis) ? (p.kpis as { metric?: unknown; target?: unknown; frequency?: unknown }[]) : [];
  return {
    purpose: p.processPurpose,
    inScope: p.inScope,
    outScope: p.outOfScope,
    kpis: kpis.map((k) => ({ metric: String(k.metric ?? ""), target: String(k.target ?? ""), frequency: String(k.frequency ?? "") })).filter((k) => k.metric),
    sopVersion: p.sopVersion,
    sopEffectiveDate: p.sopEffectiveDate,
    steps,
    lanes,
    connections: connections.map((c) => ({ from: c.fromStepId, to: c.toStepId, label: c.label })),
    gaps,
    looseNoControl: p.controls.filter((c) => !c.stepId && !c.control?.trim()).map((c) => c.risk),
  };
}

/** The same JSON whatever order its keys come back in (Postgres keeps jsonb keys in its own order). */
export function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

/** Whether the draft differs from the version in force, in anything a reader would see. */
export const sameContent = (a: Content, b: Content) => stable(a) === stable(b);

/** The steps a new version changed or added, against the version before it (a step's number may move without it changing). */
export function changedSteps(before: Content | null, now: Content): Set<string> {
  if (!before) return new Set();
  const key = (s: ContentStep) => stable({ type: s.type, label: s.label, roleId: s.roleId, acts: s.acts, approval: s.approval, time: s.time, controls: s.controls });
  const was = new Map(before.steps.map((s) => [s.id, key(s)]));
  return new Set(now.steps.filter((s) => s.n && was.get(s.id) !== key(s)).map((s) => s.id));
}

export const asContent = (v: unknown): Content | null => (v && typeof v === "object" && Array.isArray((v as Content).steps) ? (v as Content) : null);

/**
 * The version in force and what it holds. A version published before stage 5
 * has nothing kept; while its process is still Published (nothing edited since,
 * because editing sends a process in force back to Draft), what the process
 * holds IS that version, so it is taken now and kept. One that was edited
 * before stage 5 is not in force: readers did not have it then either.
 */
export async function inForce(processId: string): Promise<{ number: number; publishedAt: Date; changeNote: string; content: Content; before: Content | null } | null> {
  const p = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      lifecycleStatus: true, archivedAt: true,
      versions: { where: { publishedAt: { not: null } }, orderBy: { number: "desc" }, take: 2, select: { id: true, number: true, publishedAt: true, changeNote: true, snapshot: true } },
    },
  });
  if (!p || p.archivedAt || p.lifecycleStatus === "RETIRED" || !p.versions.length) return null;
  const [v, prev] = p.versions;
  let content = asContent(v.snapshot);
  if (!content) {
    if (p.lifecycleStatus !== "PUBLISHED") return null;
    content = await liveContent(processId);
    if (!content) return null;
    await prisma.processVersion.update({ where: { id: v.id }, data: { snapshot: content } });
  }
  return { number: v.number, publishedAt: v.publishedAt!, changeNote: v.changeNote, content, before: prev ? asContent(prev.snapshot) : null };
}
