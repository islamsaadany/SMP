"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { auth } from "@/ffp/lib/auth/config";
import { readerSeat, requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { ok, notFound, unauthorized, validationError, type ActionResult } from "@/ffp/lib/actions/errors";
import { readProcess, readerOf } from "@/ffp/lib/data/reading-side";
import { addMonths } from "@/ffp/lib/domain/process-lifecycle";

/* OWNERS, REVIEWS AND SUGGESTIONS (spec 067 §3, §4.2; stage 4).

   A client's own person (readerSeat, their register key from the sign-in,
   never from the request) suggests a change to a process they can read, asks
   for a new process, replies to the office's answer, and, as its owner, says
   on the yearly review that a process is still right. The office
   (requireWorkspaceAccess) answers, starts a draft from a suggestion, marks it
   done, and picks a process's owner from the client register. */

const refresh = (workspaceId: string) => {
  revalidatePath(`/${workspaceId}/processes`, "layout");
};
const words = z.string().trim().min(1, "Write what should change first").max(2000);
const refuse = (message: string): ActionResult<never> => ({ ok: false, error: "VALIDATION_ERROR", message });

/** The signed-in client person, as a register row in Processes, or a refusal. */
async function asReader(workspaceId: string) {
  const seat = await readerSeat(workspaceId);
  if (!seat.ok) return { ok: false as const, res: unauthorized() };
  if (!seat.personKey) return { ok: false as const, res: refuse("Only people on the Client register can do this") };
  const reader = await readerOf(workspaceId, seat.personKey);
  if (!reader.personId) return { ok: false as const, res: refuse("Only people on the Client register can do this") };
  return { ok: true as const, reader };
}

const suggestSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  stepId: z.string().min(1).optional().or(z.literal("")),
  text: words,
  why: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Suggest a change to a process the person can read, pinned to a step or to the whole of it. */
export async function suggestChange(input: z.infer<typeof suggestSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = suggestSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const me = await asReader(d.workspaceId);
  if (!me.ok) return me.res;
  const p = await readProcess(d.workspaceId, d.processId, me.reader);
  if (!p) return notFound();
  if (d.stepId && !p.steps.some((s) => s.id === d.stepId)) return notFound();
  const s = await prisma.processSuggestion.create({
    data: { workspaceId: d.workspaceId, processId: d.processId, stepId: d.stepId || null, byPersonId: me.reader.personId!, byName: me.reader.name, text: d.text, why: d.why || null },
    select: { id: true },
  });
  refresh(d.workspaceId);
  return ok({ id: s.id });
}

const askSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1, "Give it a name first").max(120),
  what: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Ask the Strategy Office for a process that does not exist yet. */
export async function askForProcess(input: z.infer<typeof askSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = askSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const me = await asReader(d.workspaceId);
  if (!me.ok) return me.res;
  const s = await prisma.processSuggestion.create({
    data: { workspaceId: d.workspaceId, byPersonId: me.reader.personId!, byName: me.reader.name, text: d.what ? `${d.name}: ${d.what}` : d.name },
    select: { id: true },
  });
  refresh(d.workspaceId);
  return ok({ id: s.id });
}

const replySchema = z.object({ workspaceId: z.string().min(1), suggestionId: z.string().min(1), text: z.string().trim().min(1, "Write your reply first").max(2000) });

/** Reply to the office's answer on one of the person's own suggestions. */
export async function replyToAnswer(input: z.infer<typeof replySchema>): Promise<ActionResult<null>> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const me = await asReader(d.workspaceId);
  if (!me.ok) return me.res;
  const moved = await prisma.processSuggestion.updateMany({
    where: { id: d.suggestionId, workspaceId: d.workspaceId, byPersonId: me.reader.personId!, state: "ANSWERED" },
    data: { state: "REPLIED", replyText: d.text, repliedAt: new Date() },
  });
  if (!moved.count) return notFound();
  refresh(d.workspaceId);
  return ok(null);
}

const processSchema = z.object({ workspaceId: z.string().min(1), processId: z.string().min(1) });

/** The owner's yearly review: it still describes how the work is done, so the next review is a cycle away. */
export async function confirmStillRight(input: z.infer<typeof processSchema>): Promise<ActionResult<{ nextReviewDue: string }>> {
  const parsed = processSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const me = await asReader(d.workspaceId);
  if (!me.ok) return me.res;
  const p = await prisma.process.findUnique({ where: { id: d.processId }, select: { workspaceId: true, archivedAt: true, lifecycleStatus: true, ownerPersonId: true, reviewIntervalMonths: true } });
  if (!p || p.workspaceId !== d.workspaceId || p.archivedAt || p.lifecycleStatus !== "PUBLISHED") return notFound();
  if (p.ownerPersonId !== me.reader.personId) return refuse("Only the process's owner can confirm its review");
  const now = new Date();
  const next = addMonths(now, p.reviewIntervalMonths);
  await prisma.process.update({ where: { id: d.processId }, data: { nextReviewDue: next, reviewConfirmedAt: now, reviewConfirmedByKey: me.reader.key } });
  refresh(d.workspaceId);
  return ok({ nextReviewDue: next.toISOString() });
}

/* ── the office ── */

const answerSchema = z.object({ workspaceId: z.string().min(1), suggestionId: z.string().min(1), text: z.string().trim().min(1, "Write your answer first").max(2000) });

/** Answer a suggestion (a question back, or why not): it lands in the person's To do. */
export async function answerSuggestion(input: z.infer<typeof answerSchema>): Promise<ActionResult<null>> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const user = (await auth())?.user;
  const moved = await prisma.processSuggestion.updateMany({
    where: { id: d.suggestionId, workspaceId: d.workspaceId, state: { in: ["NEW", "REPLIED", "IN_DRAFT"] } },
    data: { state: "ANSWERED", answerText: d.text, answerBy: user?.name || user?.email || "The Strategy Office", answeredAt: new Date() },
  });
  if (!moved.count) return notFound();
  refresh(d.workspaceId);
  return ok(null);
}

const oneSchema = z.object({ workspaceId: z.string().min(1), suggestionId: z.string().min(1) });

/** Work a suggestion into its process: it is marked in draft, and closes when the process is next published. */
export async function startDraftFrom(input: z.infer<typeof oneSchema>): Promise<ActionResult<{ processId: string }>> {
  const parsed = oneSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const s = await prisma.processSuggestion.findFirst({ where: { id: d.suggestionId, workspaceId: d.workspaceId }, select: { processId: true, state: true } });
  if (!s || !s.processId) return notFound();
  if (s.state !== "CLOSED") await prisma.processSuggestion.update({ where: { id: d.suggestionId }, data: { state: "IN_DRAFT" } });
  refresh(d.workspaceId);
  return ok({ processId: s.processId });
}

/** Done with it: nothing more to do on this suggestion. */
export async function closeSuggestion(input: z.infer<typeof oneSchema>): Promise<ActionResult<null>> {
  const parsed = oneSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const moved = await prisma.processSuggestion.updateMany({ where: { id: d.suggestionId, workspaceId: d.workspaceId }, data: { state: "CLOSED", closedAt: new Date() } });
  if (!moved.count) return notFound();
  refresh(d.workspaceId);
  return ok(null);
}

const ownerSchema = z.object({ workspaceId: z.string().min(1), processId: z.string().min(1), ownerPersonId: z.string().min(1).nullable() });

/** Pick a process's owner from the client register (Islam: "all names from register"), or name none. */
export async function setProcessOwner(input: z.infer<typeof ownerSchema>): Promise<ActionResult<null>> {
  const parsed = ownerSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const access = await requireWorkspaceAccess(d.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const p = await prisma.process.findUnique({ where: { id: d.processId }, select: { workspaceId: true } });
  if (!p || p.workspaceId !== d.workspaceId) return notFound();
  if (d.ownerPersonId) {
    const person = await prisma.person.findFirst({ where: { id: d.ownerPersonId, workspaceId: d.workspaceId, archivedAt: null, smpKey: { not: null } }, select: { id: true } });
    if (!person) return refuse("The owner is picked from the client register");
  }
  await prisma.process.update({ where: { id: d.processId }, data: { ownerPersonId: d.ownerPersonId } });
  refresh(d.workspaceId);
  return ok(null);
}
