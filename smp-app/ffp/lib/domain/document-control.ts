/**
 * The document-control block at the top of each process in the Export Report — pure.
 *
 * It states what the process says about itself, and never invents: the version, effective date and
 * approver are the SOP document-control fields (set when a version is published, or kept by hand
 * before the lifecycle existed), the status is the lifecycle's, and a field nobody has filled in is a
 * dash. It used to print "1.0", today's date and "Annual" whatever the process held.
 */
export type ControlSource = {
  lifecycleStatus: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
  sopVersion: string | null;
  sopOwner: string | null;
  sopEffectiveDate: string | null;
  sopApprovedBy: string | null;
  reviewIntervalMonths: number;
  /** ISO date (YYYY-MM-DD), set when published. */
  nextReviewDue: string | null;
  /** The role the process is owned by, in the report's own terms. */
  processOwnerName: string | null;
};

const STATUS: Record<ControlSource["lifecycleStatus"], string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved, not yet published",
  PUBLISHED: "Published",
  RETIRED: "Retired",
};

const dash = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "—");

export function documentControl(p: ControlSource) {
  const months = p.reviewIntervalMonths;
  const cycle = months === 12 ? "Every 12 months" : months === 1 ? "Every month" : `Every ${months} months`;
  return {
    status: STATUS[p.lifecycleStatus],
    version: dash(p.sopVersion),
    effectiveDate: dash(p.sopEffectiveDate),
    approvedBy: dash(p.sopApprovedBy),
    owner: dash(p.sopOwner ?? p.processOwnerName),
    // The next review is only known once it is published; before that the cycle says how often it will be.
    reviewCycle: p.lifecycleStatus === "PUBLISHED" && p.nextReviewDue ? `${cycle} · next ${p.nextReviewDue}` : cycle,
  };
}
