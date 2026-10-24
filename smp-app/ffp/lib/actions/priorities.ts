"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { auth } from "@/ffp/lib/auth/config";
import { readerSeat, requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { ok, notFound, unauthorized, validationError, type ActionResult } from "@/ffp/lib/actions/errors";
import { registerPerson } from "@/ffp/lib/data/register-person";
import { buildSnapshot, loadPlan, loadPriorityRows } from "@/ffp/lib/data/priorities";
import {
  DECISIONS,
  goesDeep,
  mayApprovePlan,
  planCanReopen,
  planCanSend,
  planEditable,
  suggestDecisions,
  validWeights,
  type Decision,
} from "@/ffp/lib/domain/priorities";

const ws = z.object({ workspaceId: z.string().min(1) });
const score = z.number().int().min(1).max(5);

function refresh(workspaceId: string) {
  revalidatePath(`/${workspaceId}/processes/priorities`);
  revalidatePath(`/${workspaceId}/processes/processes`);
  revalidatePath(`/${workspaceId}/processes/helicopter`);
  revalidatePath(`/${workspaceId}/processes/read`);
}
const refuse = (message: string): ActionResult<never> => ({ ok: false, error: "VALIDATION_ERROR", message });

/** The plan row exists once anybody touches it; until then the defaults stand. */
async function ensurePlan(workspaceId: string) {
  return prisma.priorityPlan.upsert({ where: { workspaceId }, update: {}, create: { workspaceId } });
}

async function history(planId: string, entry: { by: string; what: string; reason?: string }) {
  const p = await prisma.priorityPlan.findUniqueOrThrow({ where: { id: planId }, select: { history: true } });
  const list = ((p.history as unknown as unknown[]) ?? []).concat({ at: new Date().toISOString(), ...entry });
  await prisma.priorityPlan.update({ where: { id: planId }, data: { history: list as object[] } });
}

/** Scores, weights and decisions move only while the plan is a draft. Returns a refusal to show, or null. */
async function mustBeDraft(workspaceId: string): Promise<ActionResult<never> | null> {
  const plan = await ensurePlan(workspaceId);
  return planEditable(plan.status)
    ? null
    : refuse(plan.status === "SENT" ? "The plan is with the client. Reopen it, with a reason, to change it" : "The plan is approved. Reopen it, with a reason, to change it");
}

async function editor(workspaceId: string) {
  const access = await requireWorkspaceAccess(workspaceId, "EDITOR");
  return access.ok ? null : access;
}

async function ownsProcess(workspaceId: string, processId: string) {
  return !!(await prisma.process.findFirst({ where: { id: processId, workspaceId, archivedAt: null }, select: { id: true } }));
}

const scoreSchema = ws.extend({
  processId: z.string().min(1),
  importance: score.nullable().optional(),
  complexity: score.nullable().optional(),
  risk: score.nullable().optional(),
  why: z.string().trim().max(200).nullable().optional(),
});

export async function setProcessPriority(input: z.infer<typeof scoreSchema>): Promise<ActionResult<null>> {
  const parsed = scoreSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const denied = await editor(d.workspaceId);
  if (denied) return denied;
  if (!(await ownsProcess(d.workspaceId, d.processId))) return notFound();
  const locked = await mustBeDraft(d.workspaceId);
  if (locked) return locked;
  await prisma.process.update({
    where: { id: d.processId },
    data: {
      ...(d.importance !== undefined ? { priorityImportance: d.importance } : {}),
      ...(d.complexity !== undefined ? { priorityComplexity: d.complexity } : {}),
      ...(d.risk !== undefined ? { priorityRisk: d.risk } : {}),
      ...(d.why !== undefined ? { priorityWhy: d.why || null } : {}),
    },
  });
  refresh(d.workspaceId);
  return ok(null);
}

const decisionSchema = ws.extend({ processId: z.string().min(1), decision: z.enum(DECISIONS as [Decision, ...Decision[]]).nullable() });

export async function setDeepDiveDecision(input: z.infer<typeof decisionSchema>): Promise<ActionResult<null>> {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const denied = await editor(d.workspaceId);
  if (denied) return denied;
  if (!(await ownsProcess(d.workspaceId, d.processId))) return notFound();
  const locked = await mustBeDraft(d.workspaceId);
  if (locked) return locked;
  await prisma.process.update({ where: { id: d.processId }, data: { deepDiveDecision: d.decision } });
  refresh(d.workspaceId);
  return ok(null);
}

const settingsSchema = ws.extend({
  weightImportance: z.number().int().min(0).max(100).optional(),
  weightRisk: z.number().int().min(0).max(100).optional(),
  weightComplexity: z.number().int().min(0).max(100).optional(),
  capacity: z.number().int().min(1).max(20).optional(),
  wave1Label: z.string().trim().min(1).max(60).optional(),
  wave2Label: z.string().trim().min(1).max(60).optional(),
  laterLabel: z.string().trim().min(1).max(60).optional(),
});

export async function setPlanSettings(input: z.infer<typeof settingsSchema>): Promise<ActionResult<null>> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, ...rest } = parsed.data;
  const denied = await editor(workspaceId);
  if (denied) return denied;
  const locked = await mustBeDraft(workspaceId);
  if (locked) return locked;
  const plan = await ensurePlan(workspaceId);
  const next = {
    importance: rest.weightImportance ?? plan.weightImportance,
    risk: rest.weightRisk ?? plan.weightRisk,
    complexity: rest.weightComplexity ?? plan.weightComplexity,
  };
  if (!validWeights(next)) return refuse("At least one weight must be above zero");
  await prisma.priorityPlan.update({
    where: { id: plan.id },
    data: {
      weightImportance: next.importance,
      weightRisk: next.risk,
      weightComplexity: next.complexity,
      ...(rest.capacity !== undefined ? { capacity: rest.capacity } : {}),
      ...(rest.wave1Label !== undefined ? { wave1Label: rest.wave1Label } : {}),
      ...(rest.wave2Label !== undefined ? { wave2Label: rest.wave2Label } : {}),
      ...(rest.laterLabel !== undefined ? { laterLabel: rest.laterLabel } : {}),
    },
  });
  refresh(workspaceId);
  return ok(null);
}

/** Fills the scores nobody has set yet from what the map and the risk log already say. Never overwrites a score; importance stays the office's call. */
export async function acceptSuggestedScores(input: z.infer<typeof ws>): Promise<ActionResult<{ filled: number }>> {
  const parsed = ws.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId } = parsed.data;
  const denied = await editor(workspaceId);
  if (denied) return denied;
  const locked = await mustBeDraft(workspaceId);
  if (locked) return locked;
  const plan = await loadPlan(workspaceId);
  const rows = await loadPriorityRows(workspaceId, plan.weights);
  let filled = 0;
  for (const r of rows) {
    const data: Record<string, number> = {};
    if (r.complexity == null && r.suggestedComplexity) data.priorityComplexity = r.suggestedComplexity.score;
    if (r.risk == null && r.suggestedRisk) data.priorityRisk = r.suggestedRisk.score;
    if (Object.keys(data).length) {
      await prisma.process.update({ where: { id: r.id }, data });
      filled++;
    }
  }
  refresh(workspaceId);
  return ok({ filled });
}

const KINDS = ["importance", "complexity", "risk", "why", "decision"] as const;
const clearSchema = ws.extend({
  kinds: z.array(z.enum(KINDS)).min(1),
  processIds: z.array(z.string().min(1)).min(1).max(1000),
});

/** Empties the chosen kinds of entry on the chosen processes. Only what was picked is touched; the draft rule applies. */
export async function clearPriorityEntries(input: z.infer<typeof clearSchema>): Promise<ActionResult<{ cleared: number }>> {
  const parsed = clearSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, kinds, processIds } = parsed.data;
  const denied = await editor(workspaceId);
  if (denied) return denied;
  const locked = await mustBeDraft(workspaceId);
  if (locked) return locked;
  const data: Record<string, null> = {};
  if (kinds.includes("importance")) data.priorityImportance = null;
  if (kinds.includes("complexity")) data.priorityComplexity = null;
  if (kinds.includes("risk")) data.priorityRisk = null;
  if (kinds.includes("why")) data.priorityWhy = null;
  if (kinds.includes("decision")) data.deepDiveDecision = null;
  const res = await prisma.process.updateMany({ where: { id: { in: processIds }, workspaceId, archivedAt: null }, data });
  refresh(workspaceId);
  return ok({ cleared: res.count });
}

/** Sets a decision for every scored process that has none, from the ranking and the team's capacity. Never changes a decision somebody made. */
export async function fillDecisionsFromRanking(input: z.infer<typeof ws>): Promise<ActionResult<{ filled: number }>> {
  const parsed = ws.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId } = parsed.data;
  const denied = await editor(workspaceId);
  if (denied) return denied;
  const locked = await mustBeDraft(workspaceId);
  if (locked) return locked;
  const plan = await loadPlan(workspaceId);
  const rows = await loadPriorityRows(workspaceId, plan.weights);
  const ranked = rows.filter((r) => r.rank != null);
  const suggestion = suggestDecisions(ranked.map((r) => r.id), plan.capacity);
  let filled = 0;
  for (const r of ranked) {
    if (r.decision == null) {
      await prisma.process.update({ where: { id: r.id }, data: { deepDiveDecision: suggestion[r.id]! } });
      filled++;
    }
  }
  refresh(workspaceId);
  return ok({ filled });
}

/* ── the client's sign-off ── */

const sendSchema = ws.extend({ approverPersonId: z.string().min(1) });

export async function sendPlanForApproval(input: z.infer<typeof sendSchema>): Promise<ActionResult<null>> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const d = parsed.data;
  const denied = await editor(d.workspaceId);
  if (denied) return denied;
  const plan = await ensurePlan(d.workspaceId);
  const rows = await loadPriorityRows(d.workspaceId, {
    importance: plan.weightImportance,
    risk: plan.weightRisk,
    complexity: plan.weightComplexity,
  });
  const shortlisted = rows.filter((r) => goesDeep(r.decision));
  if (!planCanSend(plan.status, shortlisted.length)) {
    return refuse(plan.status !== "DRAFT" ? "This plan has already been sent" : "Choose at least one process for Wave 1 or Wave 2 first");
  }
  const unscored = shortlisted.filter((r) => r.score == null);
  if (unscored.length) return refuse(`Score every chosen process first: ${unscored.map((r) => r.name).join(", ")}`);

  const approver = await registerPerson(d.workspaceId, d.approverPersonId);
  if (!approver) return refuse("Pick the approver from the Client register");
  if (!approver.email) return refuse(`${approver.name} has no email on the Client register, so they could not sign in to approve. Add one first`);
  if (!approver.role) return refuse(`${approver.name} has no role on the Client register. The sign-off records a name and a role, so give them one first`);
  if (!approver.smpKey) return refuse(`${approver.name} is not on the Client register`);

  const me = (await auth())?.user;
  if (me && me.email.trim().toLowerCase() === approver.email.trim().toLowerCase()) return refuse("You cannot send the plan to yourself for approval. Pick somebody else");

  const snapshot = buildSnapshot(await loadPlan(d.workspaceId), rows);
  const res = await prisma.priorityPlan.updateMany({
    where: { id: plan.id, status: "DRAFT" },
    data: {
      status: "SENT",
      approverPersonId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      sentAt: new Date(),
      sentByName: me?.name ?? me?.email ?? null,
      sentByEmail: me?.email ?? null,
      snapshot: snapshot as object,
      returnReason: null,
    },
  });
  if (res.count !== 1) return { ok: false, error: "CONFLICT" };
  await history(plan.id, { by: me?.name ?? me?.email ?? "Office", what: `Sent to ${approver.name} (${approver.role}) for approval` });
  refresh(d.workspaceId);
  return ok(null);
}

/** The client's named approver approves, from their own reading page — by the register key the door gave them. */
export async function approvePriorityPlan(input: z.infer<typeof ws>): Promise<ActionResult<null>> {
  const parsed = ws.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId } = parsed.data;
  const seat = await readerSeat(workspaceId);
  if (!seat.ok) return unauthorized();
  const plan = await prisma.priorityPlan.findUnique({ where: { workspaceId } });
  if (!plan || plan.status !== "SENT") return refuse("There is no plan waiting for approval");
  const approver = plan.approverPersonId ? await registerPerson(workspaceId, plan.approverPersonId) : null;
  const verdict = mayApprovePlan({ actorPersonKey: seat.personKey, approverPersonKey: approver?.smpKey, actorEmail: seat.email, senderEmail: plan.sentByEmail });
  if (!verdict.ok) return refuse(verdict.reason === "OWN_PLAN" ? "You sent this plan, so you cannot also approve it" : `Only ${plan.approverName ?? "the named approver"} can approve this`);
  const res = await prisma.priorityPlan.updateMany({
    where: { id: plan.id, status: "SENT" },
    data: { status: "APPROVED", approvedAt: new Date(), approvedByName: approver?.name ?? plan.approverName, approvedByRole: approver?.role ?? plan.approverRole },
  });
  if (res.count !== 1) return { ok: false, error: "CONFLICT" };
  await history(plan.id, { by: approver?.name ?? plan.approverName ?? "Approver", what: "Approved the plan" });
  refresh(workspaceId);
  return ok(null);
}

const returnSchema = ws.extend({ reason: z.string().trim().min(1, "Say why").max(500) });

/** The approver sends it back, or whoever sent it withdraws it. It becomes a draft again. */
export async function returnPriorityPlan(input: z.infer<typeof returnSchema>): Promise<ActionResult<null>> {
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, reason } = parsed.data;
  const plan = await prisma.priorityPlan.findUnique({ where: { workspaceId } });
  if (!plan || plan.status !== "SENT") return refuse("There is no plan waiting for approval");
  let by: string | null = null;
  const seat = await readerSeat(workspaceId);
  if (seat.ok && seat.personKey) {
    const approver = plan.approverPersonId ? await registerPerson(workspaceId, plan.approverPersonId) : null;
    if (approver?.smpKey && approver.smpKey === seat.personKey) by = approver.name;
  }
  if (!by) {
    const access = await requireWorkspaceAccess(workspaceId, "EDITOR");
    if (!access.ok) return access;
    const me = (await auth())?.user;
    if (!me || me.email.trim().toLowerCase() !== (plan.sentByEmail ?? "").trim().toLowerCase()) return refuse(`Only ${plan.approverName ?? "the approver"} or the person who sent it can send it back`);
    by = me.name ?? me.email;
  }
  const res = await prisma.priorityPlan.updateMany({ where: { id: plan.id, status: "SENT" }, data: { status: "DRAFT", returnReason: reason, sentAt: null } });
  if (res.count !== 1) return { ok: false, error: "CONFLICT" };
  await history(plan.id, { by, what: "Sent the plan back to draft", reason });
  refresh(workspaceId);
  return ok(null);
}

/** After it has been sent or approved, changing the plan is a reopening: with a reason, kept on record. */
export async function reopenPriorityPlan(input: z.infer<typeof returnSchema>): Promise<ActionResult<null>> {
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, reason } = parsed.data;
  const denied = await editor(workspaceId);
  if (denied) return denied;
  const plan = await prisma.priorityPlan.findUnique({ where: { workspaceId } });
  if (!plan || !planCanReopen(plan.status)) return refuse("Only a sent or approved plan can be reopened");
  const me = (await auth())?.user;
  await prisma.priorityPlan.update({
    where: { id: plan.id },
    data: { status: "DRAFT", sentAt: null, approvedAt: null, approvedByName: null, approvedByRole: null, returnReason: null },
  });
  await history(plan.id, { by: me?.name ?? me?.email ?? "Office", what: `Reopened the plan (it was ${plan.status === "APPROVED" ? "approved" : "with the client"})`, reason });
  refresh(workspaceId);
  return ok(null);
}

