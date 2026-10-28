import "server-only";
import { cache } from "react";
import type { ProcessLifecycleStatus } from "@/ffp/lib/domain/process-lifecycle";
import { prisma } from "@/ffp/lib/db/client";
import type { Prisma } from "@/ffp/generated/prisma/client";
import { expectedAcknowledgers } from "@/ffp/lib/domain/process-reader";
import { asContent, changedSteps, inForce, liveContent, type Content, type ContentStep } from "@/ffp/lib/data/process-content";

/**
 * WHAT THE READING SIDE READS (spec 067 §3, stage 2). A client's own person
 * sees the processes in force, their part in each, and what waits on them.
 * What waits on them is worked out here, once, and read by the band, the
 * Processes rows' buttons, the To do tab and the top bar's link alike (spec
 * 067 §7: one source, so acting in one place clears it in all of them).
 *
 * Their part comes from the client register: they APPROVE a process when it
 * names them as its approver; they HAVE A STEP in it when a job title they hold
 * does one of its steps (job titles are roles, §660); they OWN it when it names
 * them as its owner (stage 4). Cached per request: the layout and the page under
 * it both ask.
 *
 * What a reader reads is the version in force (stage 5): what was approved,
 * kept on the version (process-content.ts), not the process the office is
 * drafting. A process stays in force while its next version is drawn, sent and
 * approved, until that one is published.
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
  /** Where the process itself is: its draft, while a version is in force. */
  status: ProcessLifecycleStatus;
  /** Whether a version is in force, and which one: what readers read. */
  inForce: boolean;
  /** The version a reader reads: the one in force, or before there is one, the one being drawn. */
  version: number | null;
  /** The version being drawn, sent or approved, when there is one. */
  draftVersion: number | null;
  since: Date | null;
  approverId: string | null;
  approverName: string | null;
  submittedByName: string | null;
  submittedAt: Date | null;
  changeNote: string | null;
  returnReason: string | null;
  nextReviewDue: Date | null;
  ownerName: string | null;
  /** The reader's part: they own it, they approve it, or a title they hold does a step in it. */
  owns: boolean;
  approves: boolean;
  mySteps: string[];
  /** Their steps the version in force changed, against the version before it. */
  myChanged: string[];
  /** Who is asked to read the version in force (everyone with a step), and how many have. */
  readers: number;
  readBy: number;
  iRead: boolean;
  noControl: number;
};

const live = (r: Pick<ReadRow, "inForce">) => r.inForce;

/**
 * Every process the reader may hear about: what is in force (its next version
 * may be in the drawing), and what names them as its owner or its approver in
 * any state but retired.
 */
export const readingRows = cache(
  async (slug: string, reader: Reader): Promise<ReadRow[]> =>
    rowsWhere(slug, reader, {
      OR: [
        { lifecycleStatus: { not: "RETIRED" as const }, versions: { some: { publishedAt: { not: null } } } },
        ...(reader.personId
          ? [
              { approverPersonId: reader.personId, lifecycleStatus: { not: "RETIRED" as const } },
              { ownerPersonId: reader.personId, lifecycleStatus: { not: "RETIRED" as const } },
            ]
          : []),
      ],
    })
);

async function rowsWhere(slug: string, reader: Reader, where: Prisma.ProcessWhereInput): Promise<ReadRow[]> {
  const processes = await prisma.process.findMany({
    where: { workspaceId: slug, archivedAt: null, ...where },
    orderBy: { code: "asc" },
    select: {
      id: true, code: true, name: true, lifecycleStatus: true, approverPersonId: true, approverName: true, submittedByName: true,
      submittedAt: true, pendingChangeNote: true, returnReason: true, nextReviewDue: true, publishedAt: true, ownerPersonId: true,
      owner: { select: { name: true } },
      category: { select: { name: true } },
      steps: { where: { type: { in: ["TASK", "DECISION"] } }, orderBy: { order: "asc" }, select: { label: true, assignedRoleId: true } },
      controls: { select: { control: true } },
      versions: { orderBy: { number: "desc" }, select: { number: true, publishedAt: true, snapshot: true } },
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
  const rows: ReadRow[] = [];
  for (const p of processes) {
    /* the version in force and what it holds: kept on the version, or taken now for one published before stage 5 */
    const published = p.versions.filter((v) => v.publishedAt);
    let content: Content | null = null;
    let before: Content | null = null;
    if (published.length && p.lifecycleStatus !== "RETIRED") {
      content = asContent(published[0].snapshot);
      before = published[1] ? asContent(published[1].snapshot) : null;
      if (!content && p.lifecycleStatus === "PUBLISHED") content = (await inForce(p.id))?.content ?? null;
    }
    const top = p.versions[0]?.number ?? 0;
    const draftVersion = p.lifecycleStatus === "APPROVED" ? top || null : p.lifecycleStatus === "DRAFT" || p.lifecycleStatus === "IN_REVIEW" ? top + 1 : null;
    const version = content ? published[0].number : draftVersion;
    const counted = content
      ? content.steps.filter((s) => s.n).map((s) => ({ id: s.id, label: s.label, roleId: s.roleId }))
      : p.steps.map((s) => ({ id: "", label: s.label, roleId: s.assignedRoleId }));
    const expected = content ? expectedAcknowledgers({ stepRoleIds: counted.map((s) => s.roleId), people }) : [];
    const read = new Set(acks.filter((a) => a.processId === p.id && a.versionNumber === version).map((a) => a.personKey));
    const changed = content ? changedSteps(before, content) : new Set<string>();
    const isMine = (s: { roleId: string | null }) => !!s.roleId && mine.has(s.roleId);
    rows.push({
      id: p.id,
      code: p.code,
      name: p.name,
      department: p.category?.name ?? null,
      status: p.lifecycleStatus,
      inForce: !!content,
      version,
      draftVersion,
      since: content ? published[0].publishedAt : p.publishedAt,
      approverId: p.approverPersonId,
      approverName: p.approverName,
      submittedByName: p.submittedByName,
      submittedAt: p.submittedAt,
      changeNote: p.pendingChangeNote,
      returnReason: p.returnReason,
      nextReviewDue: p.nextReviewDue,
      ownerName: p.owner?.name ?? null,
      owns: !!reader.personId && p.ownerPersonId === reader.personId,
      approves: !!reader.personId && p.approverPersonId === reader.personId,
      mySteps: counted.filter(isMine).map((s) => s.label),
      myChanged: counted.filter((s) => isMine(s) && changed.has(s.id)).map((s) => s.label),
      readers: expected.length,
      readBy: expected.filter((e) => read.has(e.personKey)).length,
      iRead: !!reader.key && read.has(reader.key),
      noControl: content
        ? content.steps.reduce((n, s) => n + s.controls.filter((c) => !c.control).length, 0) + content.looseNoControl.length
        : p.controls.filter((c) => !c.control?.trim()).length,
    });
  }
  return rows;
}

/** The three filters of the Processes tab (spec 067 §3.1): all in force, theirs (owned or approved), and the ones they have a step in. */
export function filterRows(rows: ReadRow[]) {
  const yours = rows.filter((r) => r.owns || r.approves);
  return {
    all: rows.filter(live),
    yours,
    step: rows.filter((r) => live(r) && !r.owns && !r.approves && r.mySteps.length > 0),
  };
}

/** Whole days from today to a date, negative once it has passed. */
export function daysUntil(d: Date) {
  const day = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.round((day(d) - day(new Date())) / 864e5);
}
/** The owner's yearly review is theirs to do from a month before it is due (spec 067 §3.1). */
export const reviewOpen = (r: ReadRow) => live(r) && r.owns && !!r.nextReviewDue && daysUntil(r.nextReviewDue) <= 30;

export type MySuggestion = {
  id: string;
  processId: string | null;
  processName: string | null;
  stepId: string | null;
  stepLabel: string | null;
  text: string;
  state: "NEW" | "ANSWERED" | "REPLIED" | "IN_DRAFT" | "CLOSED";
  answerText: string | null;
  answerBy: string | null;
  answeredAt: Date | null;
  replyText: string | null;
  repliedAt: Date | null;
  createdAt: Date;
};

/** The reader's own suggestions and requests for a new process, newest first. */
export const mySuggestions = cache(async (slug: string, reader: Reader): Promise<MySuggestion[]> => {
  if (!reader.personId) return [];
  const rows = await prisma.processSuggestion.findMany({
    where: { workspaceId: slug, byPersonId: reader.personId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, processId: true, stepId: true, text: true, state: true, answerText: true, answerBy: true, answeredAt: true, replyText: true, repliedAt: true, createdAt: true,
      process: { select: { name: true } },
      step: { select: { label: true } },
    },
  });
  return rows.map((r) => ({ ...r, state: r.state as MySuggestion["state"], processName: r.process?.name ?? null, stepLabel: r.step?.label ?? null }));
});

export type TodoItem =
  | { kind: "approve"; row: ReadRow }
  | { kind: "plan" }
  | { kind: "review"; row: ReadRow }
  | { kind: "read"; row: ReadRow }
  | { kind: "answer"; s: MySuggestion };

/**
 * What waits on the reader: versions to approve, the deep-dive plan to sign
 * off, the yearly review of what they own, versions in force they have a step
 * in and have not read, and the office's answers to their suggestions.
 */
export const todoOf = cache(async (slug: string, reader: Reader): Promise<TodoItem[]> => {
  if (!reader.personId) return [];
  const rows = await readingRows(slug, reader);
  const plan = await prisma.priorityPlan.findUnique({ where: { workspaceId: slug }, select: { status: true, approverPersonId: true } });
  return [
    ...rows.filter((r) => r.approves && r.status === "IN_REVIEW").map((row) => ({ kind: "approve" as const, row })),
    ...(plan?.status === "SENT" && plan.approverPersonId === reader.personId ? [{ kind: "plan" as const }] : []),
    ...rows.filter(reviewOpen).map((row) => ({ kind: "review" as const, row })),
    ...rows.filter((r) => live(r) && r.mySteps.length > 0 && !r.iRead).map((row) => ({ kind: "read" as const, row })),
    ...(await mySuggestions(slug, reader)).filter((s) => s.state === "ANSWERED").map((s) => ({ kind: "answer" as const, s })),
  ];
});

export type DoneItem =
  | { kind: "read" | "approved"; name: string; version: number; at: Date }
  | { kind: "confirmed" | "suggested" | "asked" | "replied"; name: string; at: Date };

/** What the reader did lately: versions read and approved, reviews confirmed, suggestions sent and replies. */
export async function doneLately(slug: string, reader: Reader, take = 6): Promise<DoneItem[]> {
  if (!reader.personId || !reader.key) return [];
  const [confirmed, sugs] = await Promise.all([
    prisma.process.findMany({ where: { workspaceId: slug, reviewConfirmedByKey: reader.key, reviewConfirmedAt: { not: null } }, select: { name: true, reviewConfirmedAt: true } }),
    mySuggestions(slug, reader),
  ]);
  const more: DoneItem[] = [
    ...confirmed.map((p) => ({ kind: "confirmed" as const, name: p.name, at: p.reviewConfirmedAt! })),
    ...sugs.map((s) => (s.processId ? { kind: "suggested" as const, name: s.processName ?? "", at: s.createdAt } : { kind: "asked" as const, name: s.text.split(":")[0], at: s.createdAt })),
    ...sugs.filter((s) => s.repliedAt).map((s) => ({ kind: "replied" as const, name: s.processName ?? s.text.split(":")[0], at: s.repliedAt! })),
  ];
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
    ...more,
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, take);
}

export type ReadStep = ContentStep & {
  mine: boolean;
  /** Changed or added by the version in force, against the version before it. */
  changed: boolean;
};

export type ReadProcess = Omit<Content, "steps"> & {
  row: ReadRow;
  /**
   * live: the version in force. approve: the version sent to this approver.
   * notyet: the first version, with the approver or approved, read by its owner
   * or approver. preview: the office reading the draft as a reader will once it
   * is published (Preview as manager, spec 067 §4.1).
   */
  mode: "live" | "approve" | "notyet" | "preview";
  versionNote: string | null;
  steps: ReadStep[];
  stillToRead: string[];
};

/**
 * One process as the reader may read it: the version in force; or, for its
 * approver, the version sent to them; or, before any version is in force, the
 * first one, to its owner or approver while it is with the approver or
 * approved. Anything else is not theirs to read: null, and the page answers 404.
 */
export const readProcess = cache(async (slug: string, processId: string, reader: Reader, preview = false): Promise<ReadProcess | null> => {
  const row = preview ? (await rowsWhere(slug, reader, { id: processId }))[0] : (await readingRows(slug, reader)).find((r) => r.id === processId);
  if (!row) return null;
  const mode = preview
    ? "preview"
    : row.approves && row.status === "IN_REVIEW"
      ? "approve"
      : row.inForce
        ? "live"
        : (row.approves || row.owns) && (row.status === "APPROVED" || row.status === "IN_REVIEW")
          ? "notyet"
          : null;
  if (!mode) return null;
  const held = mode === "live" ? await inForce(processId) : null;
  const content = held ? held.content : await liveContent(processId);
  if (!content) return null;
  const changed = held ? changedSteps(held.before, held.content) : new Set<string>();
  const mine = new Set(reader.roleIds);
  const counted = content.steps.filter((s) => s.n);

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
    stillToRead = expectedAcknowledgers({ stepRoleIds: counted.map((s) => s.roleId), people: reg })
      .filter((e) => !read.has(e.personKey))
      .map((e) => e.name);
  }

  return {
    ...content,
    row,
    mode,
    versionNote: held ? held.changeNote || null : row.changeNote,
    steps: content.steps.map((s) => ({ ...s, mine: !!s.roleId && mine.has(s.roleId), changed: changed.has(s.id) })),
    stillToRead,
  };
});
