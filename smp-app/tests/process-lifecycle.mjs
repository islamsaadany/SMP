/* The process lifecycle rules. Run: node --experimental-strip-types tests/process-lifecycle.mjs
   Pure functions, no database. The second half checks that legitimate moves are
   NOT refused — a rule written too tight is the likelier failure. */
import * as L from "../ffp/lib/domain/process-lifecycle.ts";

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name);
}
const d = (s) => new Date(s + "T00:00:00Z");

// Refusals
check("a draft cannot be approved", L.nextStatus("DRAFT", "approve") === null);
check("a draft cannot be published", L.nextStatus("DRAFT", "publish") === null);
check("in review cannot be published directly", L.nextStatus("IN_REVIEW", "publish") === null);
check("retired is final", L.actionsFrom("RETIRED").length === 0);
/* REWRITTEN (§218, stage 5, spec 067 §1): a published version now stays in force for its readers while the next
   one is drawn, so a process in force CAN send its next version for review; the action refuses it until something
   has changed (process-lifecycle.ts submitProcessForReview). What the old line guarded, that publishing is never
   undone in place, the next two lines still hold. */
check("a version in force can be followed by a new one sent for review", L.nextStatus("PUBLISHED", "submit") === "IN_REVIEW");
check("published cannot be approved or published again in place", L.nextStatus("PUBLISHED", "approve") === null && L.nextStatus("PUBLISHED", "publish") === null);
const ap = (o) => L.mayApprove({ actorPersonKey: "fn_fin", approverPersonKey: "fn_fin", actorEmail: "f@x.com", submitterEmail: "o@x.com", ...o });
check("somebody who is not the approver may not approve", ap({ actorPersonKey: "mobhead" }).reason === "NOT_THE_APPROVER");
check("the person who sent it may not approve their own", ap({ actorEmail: "O@X.com ", submitterEmail: "o@x.com" }).reason === "OWN_DRAFT");
check("no register key is a refusal", !ap({ actorPersonKey: null }).ok && !ap({ actorPersonKey: "  " }).ok);
check("no approver on record is a refusal", !ap({ approverPersonKey: null }).ok);
check("an email match alone is not the approver", !ap({ actorPersonKey: "mobhead", actorEmail: "f@x.com" }).ok);
check("a draft is never overdue", !L.isOverdueForReview("DRAFT", d("2020-01-01"), d("2026-01-01")));
check("a retired process is never overdue", !L.isOverdueForReview("RETIRED", d("2020-01-01"), d("2026-01-01")));
check("editing a draft does not reset", !L.editResetsToDraft("DRAFT") && !L.editResetsToDraft("IN_REVIEW"));

// Legitimate moves
check("draft → in review", L.nextStatus("DRAFT", "submit") === "IN_REVIEW");
check("in review → approved", L.nextStatus("IN_REVIEW", "approve") === "APPROVED");
check("in review → draft (returned)", L.nextStatus("IN_REVIEW", "return") === "DRAFT");
check("approved → published", L.nextStatus("APPROVED", "publish") === "PUBLISHED");
check("published → retired", L.nextStatus("PUBLISHED", "retire") === "RETIRED");
check("the named approver, by register key, may approve", ap({}).ok);
check("editing approved or published resets", L.editResetsToDraft("APPROVED") && L.editResetsToDraft("PUBLISHED"));
check("published past its date is overdue", L.isOverdueForReview("PUBLISHED", d("2026-01-01"), d("2026-01-02")));
check("published on its date is not yet overdue", !L.isOverdueForReview("PUBLISHED", d("2026-01-02"), d("2026-01-02")));
check("published with no date is not overdue", !L.isOverdueForReview("PUBLISHED", null, d("2026-01-02")));
check("12 months on", L.addMonths(d("2026-03-15"), 12).toISOString().slice(0, 10) === "2027-03-15");
check("31 Jan + 1 month clamps to 28 Feb", L.addMonths(d("2026-01-31"), 1).toISOString().slice(0, 10) === "2026-02-28");
check("29 Feb + 12 months clamps to 28 Feb", L.addMonths(d("2028-02-29"), 12).toISOString().slice(0, 10) === "2029-02-28");
check("days to review goes negative when late", L.daysToReview(d("2026-01-01"), d("2026-01-11")) === -10);

// Review calendar groups
check("past date is overdue", L.reviewBucket(d("2026-01-01"), d("2026-01-02")) === "overdue");
check("due today is not overdue", L.reviewBucket(d("2026-01-02"), d("2026-01-02")) === "next30");
check("bucket agrees with isOverdueForReview at the boundary", (L.reviewBucket(new Date(1000), new Date(1001)) === "overdue") === L.isOverdueForReview("PUBLISHED", new Date(1000), new Date(1001)));
check("30 days out is in the 30-day group", L.reviewBucket(d("2026-01-31"), d("2026-01-01")) === "next30");
check("31 days out is in the 90-day group", L.reviewBucket(d("2026-02-01"), d("2026-01-01")) === "next90");
check("90 days out is in the 90-day group", L.reviewBucket(d("2026-04-01"), d("2026-01-01")) === "next90");
check("91 days out is later", L.reviewBucket(d("2026-04-02"), d("2026-01-01")) === "later");

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
