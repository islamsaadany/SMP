/**
 * A process's controlled lifecycle — pure, no DB and no clock (`today` is a
 * parameter), the same shape as policy-lifecycle.ts so the two behave alike.
 *
 * Draft → In review → Approved → Published → Retired. Editing something in
 * force (Approved or Published) sends it back to Draft: the approval was for
 * the text that was approved, not for whatever it became.
 */

export type ProcessLifecycleStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";

export type LifecycleAction = "submit" | "approve" | "return" | "publish" | "retire";

/** The moves each state offers, and where each one lands. */
const MOVES: Record<ProcessLifecycleStatus, Partial<Record<LifecycleAction, ProcessLifecycleStatus>>> = {
  DRAFT: { submit: "IN_REVIEW" },
  IN_REVIEW: { approve: "APPROVED", return: "DRAFT" },
  APPROVED: { publish: "PUBLISHED", return: "DRAFT" },
  PUBLISHED: { retire: "RETIRED" },
  RETIRED: {},
};

export function actionsFrom(status: ProcessLifecycleStatus): LifecycleAction[] {
  return Object.keys(MOVES[status]) as LifecycleAction[];
}

export function nextStatus(status: ProcessLifecycleStatus, action: LifecycleAction): ProcessLifecycleStatus | null {
  return MOVES[status][action] ?? null;
}

/** Only an approved or published process is "in force"; editing it undoes the approval. */
export function editResetsToDraft(status: ProcessLifecycleStatus): boolean {
  return status === "APPROVED" || status === "PUBLISHED";
}

/**
 * Whether somebody may approve: the named approver, identified by the People-register key the door
 * gave them (the approver is a client's own person, and signs in as one), and never the person who
 * sent it for review (compared by email, case-blind; a missing one on either side is no match).
 */
export function mayApprove(args: {
  actorPersonKey: string | null | undefined;
  approverPersonKey: string | null | undefined;
  actorEmail: string | null | undefined;
  submitterEmail: string | null | undefined;
}): { ok: true } | { ok: false; reason: "NOT_THE_APPROVER" | "OWN_DRAFT" } {
  const key = (args.actorPersonKey ?? "").trim();
  if (!key || key !== (args.approverPersonKey ?? "").trim()) return { ok: false, reason: "NOT_THE_APPROVER" };
  const norm = (x: string | null | undefined) => (x ?? "").trim().toLowerCase();
  if (norm(args.actorEmail) && norm(args.actorEmail) === norm(args.submitterEmail)) return { ok: false, reason: "OWN_DRAFT" };
  return { ok: true };
}

/** Only a Published process can be overdue; a date left on anything else is not "in force". */
export function isOverdueForReview(status: ProcessLifecycleStatus, nextReviewDue: Date | null, today: Date): boolean {
  if (status !== "PUBLISHED" || !nextReviewDue) return false;
  return nextReviewDue.getTime() < today.getTime();
}

/** Same day-of-month `months` later, clamped to the month's last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(from.getUTCDate(), last));
  return d;
}

/** Days until the review is due; negative once it is late. */
export function daysToReview(nextReviewDue: Date, today: Date): number {
  return Math.round((nextReviewDue.getTime() - today.getTime()) / 86_400_000);
}

export const STATUS_LABEL: Record<ProcessLifecycleStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  RETIRED: "Retired",
};

export type ReviewBucket = "overdue" | "next30" | "next90" | "later";

/** Which calendar group a review date falls in. Overdue uses the same test as isOverdueForReview, so the two never disagree. */
export function reviewBucket(due: Date, today: Date): ReviewBucket {
  if (due.getTime() < today.getTime()) return "overdue";
  const days = (due.getTime() - today.getTime()) / 86_400_000;
  if (days <= 30) return "next30";
  if (days <= 90) return "next90";
  return "later";
}
