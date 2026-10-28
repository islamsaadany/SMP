import "server-only";
import { cache } from "react";
import type { ProcessLifecycleStatus } from "@/ffp/lib/domain/process-lifecycle";
import { prisma } from "@/ffp/lib/db/client";
import type { Prisma } from "@/ffp/generated/prisma/client";
import { expectedAcknowledgers } from "@/ffp/lib/domain/process-reader";
import { describeAuthorityRule } from "@/ffp/lib/domain/authority-table";
import { deriveGapsByStep } from "@/ffp/lib/domain/step-readiness";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

/**
 * WHAT THE READING SIDE READS (spec 067 §3, stage 2). A client's own person
 * sees the processes in force, their part in each, and what waits on them.
 * What waits on them is worked out here, once, and read by the band, the
 * Processes rows' buttons, the To do tab and the top bar's link alike (spec
 * 067 §7: one source, so acting in one place clears it in all of them).
 *
 * Their part comes from the client register: they APPROVE a process when it
 * names them as its approver; they HAVE A STEP in it when a job title they hold
 * does one of its steps (job titles are roles, §658). Owners join in stage 4.
 * Cached per request: the layout and the page under it both ask.
 */

export type Reader = { personId: string | null; key: string | null; name: string; title: string | null; roleIds: string[] };

/**
 * The signed-in person as Processes knows them, by their register key. The
 * office holds no register row, so it is nobody in particular (no part, nothing
 * waiting); its name comes from the seat.
 */
export const readerOf = cache(async (slug: string, key: string | null): Promise<Reader> => {
  const none = { personId: null, key, name: "", title: null, roleIds: [] };
  if (!key) return none;
  const p = await prisma.person.findFirst({
    where: { workspaceId: slug, smpKey: key, archivedAt: null },
    select: { id: true, name: true, personRoles: { where: { role: { archivedAt: null } }, select: { roleId: true, role: { select: { name: true } } } } },
  });
  if (!p) return none;
  return { personId: p.id, key, name: p.name, title: p.personRoles[0]?.role.name ?? null, roleIds: p.personRoles.map((r) => r.roleId) };
});

export type ReadRow = {
  id: string;
  code: string;
  name: string;
  department: string | null;
  status: ProcessLifecycleStatus;
  /** The version in force, or for one in review, the version being approved. */
  version: number | null;
  since: Date | null;
  approverId: string | null;
  approverName: string | null;
  submittedByName: string | null;
  submittedAt: Date | null;
  changeNote: string | null;
  returnReason: string | null;
  nextReviewDue: Date | null;
  /** The reader's part: they approve it, or a title they hold does a step in it. */
  approves: boolean;
  mySteps: string[];
  /** Who is asked to read the version in force (everyone with a step), and how many have. */
  readers: number;
  readBy: number;
  iRead: boolean;
  noControl: number;
};

const live = (r: Pick<ReadRow, "status">) => r.status === "PUBLISHED";

/**
 * Every process the reader may hear about: what is in force, and what names
 * them as its approver in any state but retired.
 */
export const readingRows = cache(
  async (slug: string, reader: Reader): Promise<ReadRow[]> =>
    rowsWhere(slug, reader, {
      OR: [{ lifecycleStatus: "PUBLISHED" }, ...(reader.personId ? [{ approverPersonId: reader.personId, lifecycleStatus: { not: "RETIRED" as const } }] : [])],
    })
);

async function rowsWhere(slug: string, reader: Reader, where: Prisma.ProcessWhereInput): Promise<ReadRow[]> {
  const processes = await prisma.process.findMany({
    where: { workspaceId: slug, archivedAt: null, ...where },
    orderBy: { code: "asc" },
    select: {
      id: true, code: true, name: true, lifecycleStatus: true, approverPersonId: true, approverName: true, submittedByName: true,
      submittedAt: true, pendingChangeNote: true, returnReason: true, nextReviewDue: true, publishedAt: true,
      category: { select: { name: true } },
      steps: { where: { type: { in: ["TASK", "DECISION"] } }, orderBy: { order: "asc" }, select: { label: true, assignedRoleId: true } },
      controls: { select: { control: true } },
      versions: { orderBy: { number: "desc" }, select: { number: true, publishedAt: true } },
    },
  });
  if (!processes.length) return [];
  /* who is asked to read: everyone on the register whose title does a step (process-reader.ts) */
  const people = (
    await prisma.person.findMany({
      where: { workspaceId: slug, archivedAt: null, smpKey: { not: null } },
      select: { smpKey: true, name: true, personRoles: { select: { roleId: true } } },
    })
  ).map((p) => ({ personKey: p.smpKey, name: p.name, roleIds: p.personRoles.map((r) => r.roleId) }));
  const acks = await prisma.processAcknowledgement.findMany({
    where: { processId: { in: processes.map((p) => p.id) } },
    select: { processId: true, versionNumber: true, personKey: true },
  });
  const mine = new Set(reader.roleIds);
  return processes.map((p) => {
    const inForce = p.versions.find((v) => v.publishedAt);
    const version = p.lifecycleStatus === "PUBLISHED" ? inForce?.number ?? null : p.lifecycleStatus === "IN_REVIEW" ? (p.versions[0]?.number ?? 0) + 1 : p.versions[0]?.number ?? null;
    const expected = p.lifecycleStatus === "PUBLISHED" ? expectedAcknowledgers({ stepRoleIds: p.steps.map((s) => s.assignedRoleId), people }) : [];
    const read = new Set(acks.filter((a) => a.processId === p.id && a.versionNumber === version).map((a) => a.personKey));
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      department: p.category?.name ?? null,
      status: p.lifecycleStatus,
      version,
      since: inForce?.publishedAt ?? p.publishedAt,
      approverId: p.approverPersonId,
      approverName: p.approverName,
      submittedByName: p.submittedByName,
      submittedAt: p.submittedAt,
      changeNote: p.pendingChangeNote,
      returnReason: p.returnReason,
      nextReviewDue: p.nextReviewDue,
      approves: !!reader.personId && p.approverPersonId === reader.personId,
      mySteps: p.steps.filter((s) => s.assignedRoleId && mine.has(s.assignedRoleId)).map((s) => s.label),
      readers: expected.length,
      readBy: expected.filter((e) => read.has(e.personKey)).length,
      iRead: !!reader.key && read.has(reader.key),
      noControl: p.controls.filter((c) => !c.control?.trim()).length,
    };
  });
}

/** The three filters of the Processes tab (spec 067 §3.1): all in force, theirs, and the ones they have a step in. */
export function filterRows(rows: ReadRow[]) {
  const yours = rows.filter((r) => r.approves);
  return {
    all: rows.filter(live),
    yours,
    step: rows.filter((r) => live(r) && !r.approves && r.mySteps.length > 0),
  };
}

export type TodoItem =
  | { kind: "approve"; row: ReadRow }
  | { kind: "plan" }
  | { kind: "read"; row: ReadRow };

/** What waits on the reader: versions to approve, the deep-dive plan to sign off, and versions in force they have a step in and have not read. */
export const todoOf = cache(async (slug: string, reader: Reader): Promise<TodoItem[]> => {
  if (!reader.personId) return [];
  const rows = await readingRows(slug, reader);
  const plan = await prisma.priorityPlan.findUnique({ where: { workspaceId: slug }, select: { status: true, approverPersonId: true } });
  return [
    ...rows.filter((r) => r.approves && r.status === "IN_REVIEW").map((row) => ({ kind: "approve" as const, row })),
    ...(plan?.status === "SENT" && plan.approverPersonId === reader.personId ? [{ kind: "plan" as const }] : []),
    ...rows.filter((r) => live(r) && r.mySteps.length > 0 && !r.iRead).map((row) => ({ kind: "read" as const, row })),
  ];
});

export type DoneItem = { kind: "read" | "approved"; name: string; version: number; at: Date };

/** What the reader did lately: the versions they read and the ones they approved. */
export async function doneLately(slug: string, reader: Reader, take = 6): Promise<DoneItem[]> {
  if (!reader.personId || !reader.key) return [];
  const [acks, approved] = await Promise.all([
    prisma.processAcknowledgement.findMany({
      where: { personKey: reader.key, process: { workspaceId: slug } },
      orderBy: { acknowledgedAt: "desc" },
      take,
      select: { versionNumber: true, acknowledgedAt: true, process: { select: { name: true } } },
    }),
    prisma.processVersion.findMany({
      where: { approvedBy: reader.name, process: { workspaceId: slug, approverPersonId: reader.personId } },
      orderBy: { approvedAt: "desc" },
      take,
      select: { number: true, approvedAt: true, process: { select: { name: true } } },
    }),
  ]);
  return [
    ...acks.map((a) => ({ kind: "read" as const, name: a.process.name, version: a.versionNumber, at: a.acknowledgedAt })),
    ...approved.map((v) => ({ kind: "approved" as const, name: v.process.name, version: v.number, at: v.approvedAt })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, take);
}

export type ReadStep = {
  id: string;
  type: "START" | "TASK" | "DECISION" | "END";
  /** The step's number among the steps a reader counts (tasks and decisions); null for Start and End. */
  n: number | null;
  label: string;
  lane: string;
  role: string | null;
  acts: string[];
  approval: string[];
  time: string[];
  controls: { risk: string; control: string | null }[];
  mine: boolean;
};

export type ReadProcess = {
  row: ReadRow;
  /** preview: the office reading the current draft as a reader will once it is published (Preview as manager, spec 067 §4.1). */
  mode: "live" | "approve" | "notyet" | "preview";
  purpose: string | null;
  inScope: string[];
  outScope: string[];
  kpis: { metric: string; target: string; frequency: string }[];
  sopVersion: string | null;
  sopEffectiveDate: string | null;
  versionNote: string | null;
  steps: ReadStep[];
  lanes: { key: string; name: string | null }[];
  connections: { from: string; to: string; label: string | null }[];
  gaps: { stepId: string; kind: "ACCOUNTABLE" | "TOO_MANY_ACCOUNTABLE" | "RESPONSIBLE" }[];
  looseNoControl: string[];
  stillToRead: string[];
};

/**
 * One process as the reader may read it: the version in force; or, for its
 * approver, the version sent to them (and once they approved it, the same
 * version until the office publishes it). Anything else is not theirs to read:
 * null, and the page answers 404.
 */
export const readProcess = cache(async (slug: string, processId: string, reader: Reader, preview = false): Promise<ReadProcess | null> => {
  const row = preview ? (await rowsWhere(slug, reader, { id: processId }))[0] : (await readingRows(slug, reader)).find((r) => r.id === processId);
  if (!row) return null;
  const mode = preview ? "preview" : row.status === "PUBLISHED" ? "live" : row.approves && row.status === "IN_REVIEW" ? "approve" : row.approves && row.status === "APPROVED" ? "notyet" : null;
  if (!mode) return null;
  const p = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      processPurpose: true, inScope: true, outOfScope: true, kpis: true, sopVersion: true, sopEffectiveDate: true,
      steps: { orderBy: { order: "asc" }, select: { id: true, type: true, label: true, detailedAction: true, raciSkipped: true, assignedRoleId: true, assignedRole: { select: { name: true } } } },
      controls: { orderBy: { order: "asc" }, select: { stepId: true, risk: true, control: true } },
      activities: { orderBy: { order: "asc" }, select: { id: true, name: true, relatedStepId: true, order: true, raciAssignments: { select: { roleId: true, code: true } } } },
      authorityAssignments: { include: AUTHORITY_ASSIGNMENT_INCLUDE },
      versions: { where: { number: row.version ?? -1 }, select: { changeNote: true } },
    },
  });
  if (!p) return null;
  const connections = await prisma.stepConnection.findMany({ where: { processId }, select: { fromStepId: true, toStepId: true, label: true } });

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
  const lanes: ReadProcess["lanes"] = [];
  for (const s of p.steps) {
    const k = laneOf(s);
    if (!lanes.some((l) => l.key === k)) lanes.push({ key: k, name: k === "none" ? null : (p.steps.find((x) => x.assignedRoleId === k)?.assignedRole?.name ?? null) });
  }
  const mine = new Set(reader.roleIds);
  const steps: ReadStep[] = p.steps.map((s) => {
    const rules = rulesByStep.get(s.id) ?? [];
    const say = (measure: string) => rules.filter((r) => r.measure === measure).map((r) => describeAuthorityRule(r, (r.whoPersonId && who.get(r.whoPersonId)) || (r.whoRoleId && who.get(r.whoRoleId)) || null));
    const i = counted.findIndex((c) => c.id === s.id);
    return {
      id: s.id,
      type: s.type,
      n: i >= 0 ? i + 1 : null,
      label: s.label,
      lane: laneOf(s),
      role: s.assignedRole?.name ?? null,
      acts: s.detailedAction,
      approval: say("MONEY"),
      time: say("TIME"),
      controls: p.controls.filter((c) => c.stepId === s.id).map((c) => ({ risk: c.risk, control: c.control?.trim() || null })),
      mine: !!s.assignedRoleId && mine.has(s.assignedRoleId),
    };
  });

  /* the RACI's gaps, as the map and the RACI flag them (step-readiness.ts) */
  const byStep = deriveGapsByStep({
    steps: p.steps.map((s) => ({ id: s.id, type: s.type, label: s.label, raciSkipped: s.raciSkipped })),
    activities: p.activities.map((a) => ({ id: a.id, name: a.name, relatedStepId: a.relatedStepId, order: a.order, assignments: a.raciAssignments })),
    authorityAssignments: p.authorityAssignments.map(toAuthorityAssignmentData),
    incomingStepIds: new Set(connections.map((c) => c.toStepId)),
  });
  const gaps: ReadProcess["gaps"] = [];
  for (const s of counted)
    for (const k of byStep.get(s.id) ?? []) if (k === "ACCOUNTABLE" || k === "TOO_MANY_ACCOUNTABLE" || k === "RESPONSIBLE") gaps.push({ stepId: s.id, kind: k });

  /* who is still to read the version in force */
  let stillToRead: string[] = [];
  if (mode === "live" && row.readBy < row.readers) {
    const reg = (
      await prisma.person.findMany({
        where: { workspaceId: slug, archivedAt: null, smpKey: { not: null } },
        select: { smpKey: true, name: true, personRoles: { select: { roleId: true } } },
      })
    ).map((x) => ({ personKey: x.smpKey, name: x.name, roleIds: x.personRoles.map((r) => r.roleId) }));
    const read = new Set(
      (await prisma.processAcknowledgement.findMany({ where: { processId, versionNumber: row.version ?? -1 }, select: { personKey: true } })).map((a) => a.personKey)
    );
    stillToRead = expectedAcknowledgers({ stepRoleIds: counted.map((s) => s.assignedRoleId), people: reg })
      .filter((e) => !read.has(e.personKey))
      .map((e) => e.name);
  }

  const kpis = Array.isArray(p.kpis) ? (p.kpis as { metric?: unknown; target?: unknown; frequency?: unknown }[]) : [];
  return {
    row,
    mode,
    purpose: p.processPurpose,
    inScope: p.inScope,
    outScope: p.outOfScope,
    kpis: kpis.map((k) => ({ metric: String(k.metric ?? ""), target: String(k.target ?? ""), frequency: String(k.frequency ?? "") })).filter((k) => k.metric),
    sopVersion: p.sopVersion,
    sopEffectiveDate: p.sopEffectiveDate,
    versionNote: mode === "live" ? p.versions[0]?.changeNote || null : row.changeNote,
    steps,
    lanes,
    connections: connections.map((c) => ({ from: c.fromStepId, to: c.toStepId, label: c.label })),
    gaps,
    looseNoControl: p.controls.filter((c) => !c.stepId && !c.control?.trim()).map((c) => c.risk),
    stillToRead,
  };
});
