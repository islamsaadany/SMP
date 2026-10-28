/**
 * The six readiness marks on every process in the builder's All processes
 * table (spec 067 §4.2, Q15): Map, RACI, Authority, Controls, SOP, Approved.
 * Each is read from what the process already holds, through the gaps the map,
 * RACI and Authority pages flag (step-readiness.ts), so a mark can never
 * disagree with the page it summarises.
 *
 * Pure and framework-free (Constitution Principle III).
 */
import type { StepGap } from "./step-readiness";

export type ReadinessFacts = {
  steps: number;
  kinds: Set<StepGap>;
  controls: number;
  controlsMissing: number;
  sopVersion: string | null;
  sopEffectiveDate: string | null;
  lifecycleStatus: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
};

export const READINESS_MARKS = ["Map", "RACI", "Authority", "Controls", "SOP", "Approved"] as const;
export type ReadinessMark = (typeof READINESS_MARKS)[number];

/** What each mark asks, for the mark's own tooltip. */
export const READINESS_RULES: Record<ReadinessMark, string> = {
  Map: "At least two steps, and every step is connected into the flow",
  RACI: "Every step has one role accountable and one responsible",
  Authority: "Every step that needs an approver has one, and no rule is half-filled",
  Controls: "At least one risk is logged, and every risk has a control",
  SOP: "The SOP has a version and an effective date",
  Approved: "Approved, or published",
};

export function readinessMarks(f: ReadinessFacts): Record<ReadinessMark, boolean> {
  const has = f.steps > 0;
  return {
    Map: f.steps >= 2 && !f.kinds.has("PREDECESSOR"),
    RACI: has && !f.kinds.has("ACCOUNTABLE") && !f.kinds.has("TOO_MANY_ACCOUNTABLE") && !f.kinds.has("RESPONSIBLE"),
    Authority: has && !f.kinds.has("APPROVER") && !f.kinds.has("INCOMPLETE_RULE"),
    Controls: f.controls > 0 && f.controlsMissing === 0,
    SOP: !!f.sopVersion?.trim() && !!f.sopEffectiveDate?.trim(),
    Approved: f.lifecycleStatus === "APPROVED" || f.lifecycleStatus === "PUBLISHED",
  };
}
