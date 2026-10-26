/**
 * What the plan is actually made of. A process with no flagged steps is one item. A process with
 * flagged steps is represented by those steps only: the steps the office chose to take deep, each
 * in its own wave (its own choice, or its process's when it made none). Pure, so the plan board,
 * the sign-off page and the send rule cannot disagree.
 */
import type { Decision } from "./priorities";

type Scored = { importance: number | null; complexity: number | null; risk: number | null; score: number | null; why: string | null };

export type UnitSource = Scored & {
  id: string;
  code: string;
  name: string;
  department: string | null;
  rank: number | null;
  decision: Decision | null;
  steps: (Scored & { id: string; label: string; flagged: boolean; decision: Decision | null })[];
};

export type PlanUnit = Scored & {
  kind: "process" | "step";
  id: string;
  /** The process this belongs to (itself, for a process). */
  processId: string;
  code: string;
  name: string;
  inProcess: string | null;
  department: string | null;
  rank: number | null;
  /** Where it goes: a step's own choice, else its process's. */
  decision: Decision | null;
};

export function planUnits(rows: readonly UnitSource[]): PlanUnit[] {
  const out: PlanUnit[] = [];
  for (const r of rows) {
    const flagged = r.steps.filter((s) => s.flagged);
    if (flagged.length === 0) {
      out.push({ kind: "process", id: r.id, processId: r.id, code: r.code, name: r.name, inProcess: null, department: r.department, importance: r.importance, complexity: r.complexity, risk: r.risk, score: r.score, why: r.why, rank: r.rank, decision: r.decision });
      continue;
    }
    for (const s of flagged) {
      out.push({ kind: "step", id: s.id, processId: r.id, code: r.code, name: s.label, inProcess: r.name, department: r.department, importance: s.importance, complexity: s.complexity, risk: s.risk, score: s.score, why: s.why, rank: null, decision: s.decision ?? r.decision });
    }
  }
  return out;
}

/** Best score first; unscored last. */
export const byScoreDesc = (a: { score: number | null; rank: number | null }, b: { score: number | null; rank: number | null }) =>
  (b.score ?? -1) - (a.score ?? -1) || (a.rank ?? 99) - (b.rank ?? 99);
