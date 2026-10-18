"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { auth } from "@/ffp/lib/auth/config";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { ok, notFound, validationError, type ActionResult } from "@/ffp/lib/actions/errors";
import {
  addMonths,
  mayApprove,
  nextStatus,
  type LifecycleAction,
  type ProcessLifecycleStatus,
} from "@/ffp/lib/domain/process-lifecycle";
import type { Revision } from "@/ffp/lib/domain/sop";

type Reviewer = { personId: string; name: string; role: string | null };

const base = z.object({ workspaceId: z.string().min(1), processId: z.string().min(1) });

function refresh(workspaceId: string, processId: string) {
  revalidatePath(`/${workspaceId}/processes/processes/${processId}`);
  revalidatePath(`/${workspaceId}/processes/processes`);
}

/** A refusal the screen can show as written. */
function refuse(message: string): ActionResult<never> {
  return { ok: false, error: "VALIDATION_ERROR", message };
}

async function load(workspaceId: string, processId: string) {
  const p = await prisma.process.findUnique({ where: { id: processId } });
  return p && p.workspaceId === workspaceId ? p : null;
}

/** A person from this workspace's People register, with their role(s) as they stand today. */
async function registerPerson(workspaceId: string, personId: string) {
  const person = await prisma.person.findFirst({
    where: { id: personId, workspaceId, archivedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      personRoles: { select: { role: { select: { name: true, archivedAt: true } } } },
    },
  });
  if (!person) return null;
  const roles = person.personRoles.filter((r) => !r.role.archivedAt).map((r) => r.role.name);
  return { id: person.id, name: person.name, email: person.email, role: roles.length ? roles.join(", ") : null };
}

/** Moves a process from `from` to the state `action` leads to — only if nobody moved it first. */
async function move(
  processId: string,
  from: ProcessLifecycleStatus,
  data: Record<string, unknown>
): Promise<boolean> {
  const res = await prisma.process.updateMany({ where: { id: processId, lifecycleStatus: from }, data });
  return res.count === 1;
}

const submitSchema = base.extend({
  approverPersonId: z.string().min(1),
  reviewerPersonIds: z.array(z.string().min(1)).max(10).default([]),
  changeNote: z.string().trim().min(1, "Say what changed").max(500),
});

export async function submitProcessForReview(input: z.infer<typeof submitSchema>): Promise<ActionResult<null>> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await load(d.workspaceId, d.processId);
  if (!process) return notFound();
  if (!nextStatus(process.lifecycleStatus, "submit")) return refuse("Only a draft can be sent for review");

  const approver = await registerPerson(d.workspaceId, d.approverPersonId);
  if (!approver) return refuse("Pick the approver from the People register");
  if (!approver.email) return refuse(`${approver.name} has no email on the People register, so they could not sign in to approve. Add one first`);
  if (!approver.role) return refuse(`${approver.name} has no role on the People register. The approval records a name and a role, so give them one first`);

  const reviewers: Reviewer[] = [];
  for (const id of new Set(d.reviewerPersonIds)) {
    if (id === d.approverPersonId) continue; // the approver is not also a reviewer
    const r = await registerPerson(d.workspaceId, id);
    if (!r) return refuse("A reviewer is not on the People register");
    reviewers.push({ personId: r.id, name: r.name, role: r.role });
  }

  const session = await auth();
  const me = session?.user;
  if (me && me.email.trim().toLowerCase() === approver.email.trim().toLowerCase()) {
    return refuse("You cannot send a process to yourself for approval. Pick somebody else as the approver");
  }

  const moved = await move(d.processId, "DRAFT", {
    lifecycleStatus: "IN_REVIEW",
    approverPersonId: approver.id,
    approverName: approver.name,
    approverRole: approver.role,
    reviewers,
    submittedByName: me?.name ?? me?.email ?? null,
    submittedByEmail: me?.email ?? null,
    submittedAt: new Date(),
    returnReason: null,
    // Held until approval, where it becomes the version's change note.
    pendingChangeNote: d.changeNote,
  });
  if (!moved) return { ok: false, error: "CONFLICT" };
  refresh(d.workspaceId, d.processId);
  return ok(null);
}

const approveSchema = base;

export async function approveProcess(input: z.infer<typeof approveSchema>): Promise<ActionResult<{ version: number }>> {
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await load(d.workspaceId, d.processId);
  if (!process) return notFound();
  if (!nextStatus(process.lifecycleStatus, "approve")) return refuse("Only a process in review can be approved");

  const approver = process.approverPersonId ? await registerPerson(d.workspaceId, process.approverPersonId) : null;
  const session = await auth();
  const verdict = mayApprove({
    actorEmail: session?.user.email,
    approverEmail: approver?.email,
    submitterEmail: process.submittedByEmail,
  });
  if (!verdict.ok) {
    return refuse(
      verdict.reason === "OWN_DRAFT"
        ? "You sent this for review, so you cannot also approve it"
        : `Only ${process.approverName ?? "the named approver"} can approve this`
    );
  }

  const last = await prisma.processVersion.aggregate({ where: { processId: d.processId }, _max: { number: true } });
  const number = (last._max.number ?? 0) + 1;
  const approvedRole = approver?.role ?? process.approverRole;
  const approvedName = approver?.name ?? process.approverName ?? "";

  const moved = await move(d.processId, "IN_REVIEW", { lifecycleStatus: "APPROVED" });
  if (!moved) return { ok: false, error: "CONFLICT" };
  await prisma.processVersion.create({
    data: {
      processId: d.processId,
      number,
      changeNote: process.pendingChangeNote ?? "",
      submittedBy: process.submittedByName,
      approvedBy: approvedName,
      approvedRole,
    },
  });
  refresh(d.workspaceId, d.processId);
  return ok({ version: number });
}

const returnSchema = base.extend({ reason: z.string().trim().min(1, "Say why").max(500) });

export async function returnProcessToDraft(input: z.infer<typeof returnSchema>): Promise<ActionResult<null>> {
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await load(d.workspaceId, d.processId);
  if (!process) return notFound();
  if (!nextStatus(process.lifecycleStatus, "return")) return refuse("This process is not in review or approved");

  if (process.lifecycleStatus === "IN_REVIEW") {
    // The approver sends it back, or whoever sent it up withdraws it.
    const session = await auth();
    const me = (session?.user.email ?? "").trim().toLowerCase();
    const approver = process.approverPersonId ? await registerPerson(d.workspaceId, process.approverPersonId) : null;
    const isApprover = !!me && me === (approver?.email ?? "").trim().toLowerCase();
    const isSubmitter = !!me && me === (process.submittedByEmail ?? "").trim().toLowerCase();
    if (!isApprover && !isSubmitter) return refuse(`Only ${process.approverName ?? "the approver"} or the person who sent it can send it back`);
  } else {
    // An approved version that will not be published goes back. The version it created stays on record.
  }

  const moved = await move(d.processId, process.lifecycleStatus, {
    lifecycleStatus: "DRAFT",
    returnReason: d.reason,
    pendingChangeNote: null,
  });
  if (!moved) return { ok: false, error: "CONFLICT" };
  refresh(d.workspaceId, d.processId);
  return ok(null);
}

export async function publishProcess(input: z.infer<typeof base>): Promise<ActionResult<null>> {
  const parsed = base.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await load(d.workspaceId, d.processId);
  if (!process) return notFound();
  if (!nextStatus(process.lifecycleStatus, "publish")) return refuse("Only an approved process can be published");

  const version = await prisma.processVersion.findFirst({ where: { processId: d.processId }, orderBy: { number: "desc" } });
  if (!version) return refuse("There is no approved version to publish");

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  // The SOP's own document-control fields follow the lifecycle, so the SOP and
  // the Export Report show the version that was actually approved.
  const revisions = ((process.sopRevisions as unknown as Revision[]) ?? []).concat({
    version: `v${version.number}`,
    date: today,
    by: version.approvedBy,
    change: version.changeNote,
  });
  const moved = await move(d.processId, "APPROVED", {
    lifecycleStatus: "PUBLISHED",
    publishedAt: now,
    retiredAt: null,
    nextReviewDue: addMonths(now, process.reviewIntervalMonths),
    sopVersion: `v${version.number}`,
    sopApprovedBy: version.approvedBy,
    sopEffectiveDate: today,
    sopRevisions: revisions,
  });
  if (!moved) return { ok: false, error: "CONFLICT" };
  await prisma.processVersion.update({ where: { id: version.id }, data: { publishedAt: now } });
  revalidatePath(`/${d.workspaceId}/processes/reports/sop`);
  refresh(d.workspaceId, d.processId);
  return ok(null);
}

export async function retireProcess(input: z.infer<typeof base>): Promise<ActionResult<null>> {
  const parsed = base.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await load(d.workspaceId, d.processId);
  if (!process) return notFound();
  if (!nextStatus(process.lifecycleStatus, "retire")) return refuse("Only a published process can be retired");
  const moved = await move(d.processId, "PUBLISHED", { lifecycleStatus: "RETIRED", retiredAt: new Date() });
  if (!moved) return { ok: false, error: "CONFLICT" };
  refresh(d.workspaceId, d.processId);
  return ok(null);
}

const intervalSchema = base.extend({ months: z.number().int().min(1).max(60) });

export async function setReviewInterval(input: z.infer<typeof intervalSchema>): Promise<ActionResult<null>> {
  const parsed = intervalSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await load(d.workspaceId, d.processId);
  if (!process) return notFound();
  await prisma.process.update({
    where: { id: d.processId },
    data: {
      reviewIntervalMonths: d.months,
      // A published process's next review follows from when it was published.
      ...(process.lifecycleStatus === "PUBLISHED" && process.publishedAt
        ? { nextReviewDue: addMonths(process.publishedAt, d.months) }
        : {}),
    },
  });
  refresh(d.workspaceId, d.processId);
  return ok(null);
}

export type { LifecycleAction };
