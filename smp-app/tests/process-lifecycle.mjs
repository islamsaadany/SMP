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
check("published cannot go back to review", L.nextStatus("PUBLISHED", "submit") === null);
check("only the approver may approve", !L.mayApprove({ actorEmail: "x@a.com", approverEmail: "y@a.com", submitterEmail: "z@a.com" }).ok);
check("the submitter may not approve their own", L.mayApprove({ actorEmail: "y@a.com", approverEmail: "y@a.com", submitterEmail: "y@a.com" }).reason === "OWN_DRAFT");
check("no approver email is a refusal", !L.mayApprove({ actorEmail: "y@a.com", approverEmail: null, submitterEmail: "z@a.com" }).ok);
check("no actor email is a refusal", !L.mayApprove({ actorEmail: "", approverEmail: "", submitterEmail: "z@a.com" }).ok);
check("a draft is never overdue", !L.isOverdueForReview("DRAFT", d("2020-01-01"), d("2026-01-01")));
check("a retired process is never overdue", !L.isOverdueForReview("RETIRED", d("2020-01-01"), d("2026-01-01")));
check("editing a draft does not reset", !L.editResetsToDraft("DRAFT") && !L.editResetsToDraft("IN_REVIEW"));

// Legitimate moves
check("draft → in review", L.nextStatus("DRAFT", "submit") === "IN_REVIEW");
check("in review → approved", L.nextStatus("IN_REVIEW", "approve") === "APPROVED");
check("in review → draft (returned)", L.nextStatus("IN_REVIEW", "return") === "DRAFT");
check("approved → published", L.nextStatus("APPROVED", "publish") === "PUBLISHED");
check("published → retired", L.nextStatus("PUBLISHED", "retire") === "RETIRED");
check("the named approver, not the submitter, may approve", L.mayApprove({ actorEmail: "Y@A.com ", approverEmail: "y@a.com", submitterEmail: "z@a.com" }).ok);
check("editing approved or published resets", L.editResetsToDraft("APPROVED") && L.editResetsToDraft("PUBLISHED"));
check("published past its date is overdue", L.isOverdueForReview("PUBLISHED", d("2026-01-01"), d("2026-01-02")));
check("published on its date is not yet overdue", !L.isOverdueForReview("PUBLISHED", d("2026-01-02"), d("2026-01-02")));
check("published with no date is not overdue", !L.isOverdueForReview("PUBLISHED", null, d("2026-01-02")));
check("12 months on", L.addMonths(d("2026-03-15"), 12).toISOString().slice(0, 10) === "2027-03-15");
check("31 Jan + 1 month clamps to 28 Feb", L.addMonths(d("2026-01-31"), 1).toISOString().slice(0, 10) === "2026-02-28");
check("29 Feb + 12 months clamps to 28 Feb", L.addMonths(d("2028-02-29"), 12).toISOString().slice(0, 10) === "2029-02-28");
check("days to review goes negative when late", L.daysToReview(d("2026-01-01"), d("2026-01-11")) === -10);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
