/**
 * Priorities — choosing which high-level processes to take deep. Pure: no DB, no clock.
 *
 * The office scores each process 1–5 on importance, complexity and risk; the weights are agreed with
 * the client; the score is out of 100; the ranking decides where to start; the decision says which
 * wave a process goes in. The client signs off the resulting shortlist.
 */

export type Decision = "WAVE_1" | "WAVE_2" | "LATER" | "HIGH_LEVEL";
export const DECISIONS: readonly Decision[] = ["WAVE_1", "WAVE_2", "LATER", "HIGH_LEVEL"];
export const DECISION_LABEL: Record<Decision, string> = {
  WAVE_1: "Wave 1",
  WAVE_2: "Wave 2",
  LATER: "Later",
  HIGH_LEVEL: "Stays high-level",
};
/** Wave 1 and 2 are the ones that go deep. */
export const goesDeep = (d: Decision | null | undefined) => d === "WAVE_1" || d === "WAVE_2";

export type Weights = { importance: number; risk: number; complexity: number };
export const DEFAULT_WEIGHTS: Weights = { importance: 35, risk: 40, complexity: 25 };

/** Each weight a whole number 0–100 and at least one above zero, or the score means nothing. */
export function validWeights(w: Weights): boolean {
  const all = [w.importance, w.risk, w.complexity];
  return all.every((x) => Number.isInteger(x) && x >= 0 && x <= 100) && all.some((x) => x > 0);
}

export const validScore = (n: unknown): n is 1 | 2 | 3 | 4 | 5 => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;

export type Scores = { importance: number | null; complexity: number | null; risk: number | null };

/** Out of 100, or null until all three are scored — a half-scored process is not ranked as if it were. */
export function weightedScore(w: Weights, s: Scores): number | null {
  if (!validWeights(w) || s.importance == null || s.complexity == null || s.risk == null) return null;
  const total = w.importance + w.risk + w.complexity;
  return Math.round(((w.importance * s.importance + w.risk * s.risk + w.complexity * s.complexity) / (5 * total)) * 100);
}

export type Rankable = Scores & { id: string; code: string };

/** Highest score first; a tie goes to the riskier, then the more important, then the code. Unscored ones come last, unranked. */
export function rankProcesses<T extends Rankable>(items: readonly T[], w: Weights): { item: T; score: number | null; rank: number | null }[] {
  const scored = items.map((item) => ({ item, score: weightedScore(w, item) }));
  scored.sort((a, b) => {
    if ((a.score == null) !== (b.score == null)) return a.score == null ? 1 : -1;
    if (a.score != null && b.score != null && a.score !== b.score) return b.score - a.score;
    const r = (b.item.risk ?? 0) - (a.item.risk ?? 0);
    if (r) return r;
    const i = (b.item.importance ?? 0) - (a.item.importance ?? 0);
    if (i) return i;
    return a.item.code.localeCompare(b.item.code);
  });
  let n = 0;
  return scored.map((x) => ({ ...x, rank: x.score == null ? null : ++n }));
}

const LATER_COUNT = 3;

/** A starting point for the decisions from the ranking: the first `capacity` go in Wave 1, the next in Wave 2, a few Later, the rest stay. Unscored processes are left out. */
export function suggestDecisions(rankedIds: readonly string[], capacity: number): Record<string, Decision> {
  const cap = Math.max(1, Math.floor(capacity));
  const out: Record<string, Decision> = {};
  rankedIds.forEach((id, i) => {
    out[id] = i < cap ? "WAVE_1" : i < 2 * cap ? "WAVE_2" : i < 2 * cap + LATER_COUNT ? "LATER" : "HIGH_LEVEL";
  });
  return out;
}

export const wave1OverCapacity = (wave1Count: number, capacity: number) => wave1Count > capacity;

/* ── a starting score the office accepts or changes — from what the map already says, never invented ── */

export type ScoreFacts = {
  steps: number;
  decisions: number;
  /** Hand-overs to or from another process, and links to other processes. */
  crossProcess: number;
  roles: number;
  /** Logged risks, by level. */
  risksHigh: number;
  risksMedium: number;
  risksLow: number;
};

/** Complexity from the shape of the map: how many steps, decisions, hand-overs and roles. Null when nothing is mapped yet. */
export function suggestComplexity(f: ScoreFacts): { score: number; reason: string } | null {
  if (f.steps <= 0) return null;
  const points = f.steps + 2 * f.decisions + 2 * f.crossProcess + f.roles;
  const score = points < 6 ? 1 : points < 12 ? 2 : points < 20 ? 3 : points < 30 ? 4 : 5;
  return { score, reason: `${f.steps} steps, ${f.decisions} decisions, ${f.crossProcess} hand-overs, ${f.roles} roles` };
}

/** Risk from what has been logged against the process. Null when nothing is logged — absence of a log is not low risk. */
export function suggestRisk(f: ScoreFacts): { score: number; reason: string } | null {
  const logged = f.risksHigh + f.risksMedium + f.risksLow;
  if (logged === 0) return null;
  const score = f.risksHigh >= 2 ? 5 : f.risksHigh === 1 ? 4 : f.risksMedium > 0 ? 3 : 2;
  return { score, reason: `${logged} risk${logged === 1 ? "" : "s"} logged, ${f.risksHigh} high` };
}

/* ── how far a deep dive has got ── */

export type ProgressFacts = {
  steps: number;
  raciFinal: boolean;
  authorityAssigned: number;
  controlsLogged: number;
  sopVersion: string | null;
  lifecycleStatus: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
};

export const ASPECTS = ["Map", "RACI", "Authority", "Controls", "SOP", "Approved"] as const;

/** Six aspects, each done or not, read off what the process holds — nobody ticks them by hand. */
export function deepDiveProgress(p: ProgressFacts): { done: number; total: number; aspects: { label: string; done: boolean }[] } {
  const done = [
    p.steps >= 3,
    p.raciFinal,
    p.authorityAssigned > 0,
    p.controlsLogged > 0,
    !!(p.sopVersion && p.sopVersion.trim()),
    p.lifecycleStatus === "APPROVED" || p.lifecycleStatus === "PUBLISHED",
  ];
  return { done: done.filter(Boolean).length, total: ASPECTS.length, aspects: ASPECTS.map((label, i) => ({ label, done: done[i]! })) };
}

/* ── the sign-off ── */

export type PlanStatus = "DRAFT" | "SENT" | "APPROVED";

/** Scores, weights and decisions change only while the plan is a draft; once it is with the client it is reopened, with a reason. */
export const planEditable = (s: PlanStatus) => s === "DRAFT";
export const planCanSend = (s: PlanStatus, shortlisted: number) => s === "DRAFT" && shortlisted > 0;
export const planCanReopen = (s: PlanStatus) => s === "SENT" || s === "APPROVED";

/** The same rule as a process's approval: the named approver by register key, never the person who sent it. */
export function mayApprovePlan(args: {
  actorPersonKey: string | null | undefined;
  approverPersonKey: string | null | undefined;
  actorEmail: string | null | undefined;
  senderEmail: string | null | undefined;
}): { ok: true } | { ok: false; reason: "NOT_THE_APPROVER" | "OWN_PLAN" } {
  const key = (args.actorPersonKey ?? "").trim();
  if (!key || key !== (args.approverPersonKey ?? "").trim()) return { ok: false, reason: "NOT_THE_APPROVER" };
  const norm = (x: string | null | undefined) => (x ?? "").trim().toLowerCase();
  if (norm(args.actorEmail) && norm(args.actorEmail) === norm(args.senderEmail)) return { ok: false, reason: "OWN_PLAN" };
  return { ok: true };
}
