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

/** One list for every aspect, so a new one cannot be added without saying what turns it green. Order is the order of the bars and of `done` below. */
export const ASPECT_DEFS = [
  { label: "Map", help: "The process is drawn step by step: at least 3 steps on its map." },
  { label: "RACI", help: "Who does, owns, is consulted and told at each step: the RACI is marked final." },
  { label: "Authority", help: "Who may approve what: at least one approval authority is assigned on the process." },
  { label: "Controls", help: "Risks and the controls that answer them: at least one control is logged." },
  { label: "SOP", help: "The written procedure exists: the process has an SOP version." },
  { label: "Approved", help: "The client's named approver has approved it (Approved or Published)." },
] as const;
export const ASPECTS = ASPECT_DEFS.map((a) => a.label);

/** Six aspects, each done or not, read off what the process holds — nobody ticks them by hand. */
export function deepDiveProgress(p: ProgressFacts): { done: number; total: number; aspects: { label: string; help: string; done: boolean }[] } {
  const done = [
    p.steps >= 3,
    p.raciFinal,
    p.authorityAssigned > 0,
    p.controlsLogged > 0,
    !!(p.sopVersion && p.sopVersion.trim()),
    p.lifecycleStatus === "APPROVED" || p.lifecycleStatus === "PUBLISHED",
  ];
  return { done: done.filter(Boolean).length, total: ASPECTS.length, aspects: ASPECT_DEFS.map((a, i) => ({ label: a.label, help: a.help, done: done[i]! })) };
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

/** Main processes in code order, each followed by its own sub-processes; a sub whose main is not in the list stands as a main. */
export function inTree<T extends { id: string; code: string; parentId: string | null }>(rows: T[]): { row: T; sub: boolean; hasSubs: boolean }[] {
  const ids = new Set(rows.map((r) => r.id));
  const byCode = (a: T, b: T) => a.code.localeCompare(b.code, undefined, { numeric: true });
  const kids = new Map<string, T[]>();
  for (const r of rows) if (r.parentId && ids.has(r.parentId)) (kids.get(r.parentId) ?? kids.set(r.parentId, []).get(r.parentId)!).push(r);
  const out: { row: T; sub: boolean; hasSubs: boolean }[] = [];
  for (const m of rows.filter((r) => !r.parentId || !ids.has(r.parentId)).sort(byCode)) {
    const subs = (kids.get(m.id) ?? []).sort(byCode);
    out.push({ row: m, sub: false, hasSubs: subs.length > 0 });
    for (const c of subs) out.push({ row: c, sub: true, hasSubs: false });
  }
  return out;
}

/* ── steps inside a process: what makes a step worth a look, and a starting score from it ── */

export type StepFacts = {
  decision: boolean;
  controlsHigh: number;
  controlsMedium: number;
  controlsLow: number;
  /** Names of the other processes this step hands over to or links to. */
  handoverTo: string[];
  roles: number;
  subtasks: number;
};

export type StepSignal = { key: string; label: string; tone: "bad" | "warn" | "info" | "plain" };

const MANY_ROLES = 3;
const MANY_SUBTASKS = 6;

/** What the map already says about a step. Empty when nothing stands out; the office decides what to flag. */
export function stepSignals(f: StepFacts): StepSignal[] {
  const out: StepSignal[] = [];
  if (f.controlsHigh > 0) out.push({ key: "high-risk", label: "High-risk control", tone: "bad" });
  else if (f.controlsMedium > 0) out.push({ key: "medium-risk", label: "Medium-risk control", tone: "warn" });
  if (f.decision) out.push({ key: "decision", label: "Decision point", tone: "info" });
  if (f.handoverTo.length) out.push({ key: "handover", label: `Hands over to ${f.handoverTo.slice(0, 2).join(", ")}${f.handoverTo.length > 2 ? "…" : ""}`, tone: "info" });
  if (f.roles >= MANY_ROLES) out.push({ key: "roles", label: `${f.roles} roles`, tone: "plain" });
  if (f.subtasks >= MANY_SUBTASKS) out.push({ key: "subtasks", label: `${f.subtasks} sub-tasks`, tone: "plain" });
  return out;
}

/** Complexity of one step from its decision, hand-overs, roles and sub-tasks. Null when none of those is there to go on. */
export function suggestStepComplexity(f: StepFacts): { score: number; reason: string } | null {
  const points = (f.decision ? 2 : 0) + 2 * f.handoverTo.length + f.roles + Math.floor(f.subtasks / 3);
  if (points === 0) return null;
  const score = points < 3 ? 1 : points < 5 ? 2 : points < 7 ? 3 : points < 10 ? 4 : 5;
  const bits = [f.decision ? "decision" : "", f.handoverTo.length ? `${f.handoverTo.length} hand-over${f.handoverTo.length === 1 ? "" : "s"}` : "", f.roles ? `${f.roles} role${f.roles === 1 ? "" : "s"}` : "", f.subtasks ? `${f.subtasks} sub-task${f.subtasks === 1 ? "" : "s"}` : ""].filter(Boolean);
  return { score, reason: bits.join(", ") };
}

/** Risk of one step from the risks logged against it; null when none is logged. */
export function suggestStepRisk(f: StepFacts): { score: number; reason: string } | null {
  return suggestRisk({ steps: 1, decisions: 0, crossProcess: 0, roles: 0, risksHigh: f.controlsHigh, risksMedium: f.controlsMedium, risksLow: f.controlsLow });
}
