/* The report's document-control block. Run: node --experimental-strip-types tests/document-control.mjs */
import { documentControl as dc } from "../ffp/lib/domain/document-control.ts";
let pass = 0, fail = 0;
const check = (n, c) => (c ? pass++ : (fail++, console.log("  FAIL  " + n)));
const base = { lifecycleStatus: "DRAFT", sopVersion: null, sopOwner: null, sopEffectiveDate: null, sopApprovedBy: null, reviewIntervalMonths: 12, nextReviewDue: null, processOwnerName: null };

// Nothing invented
const d = dc(base);
check("a process with nothing recorded shows dashes, not 1.0", d.version === "—" && d.approvedBy === "—" && d.effectiveDate === "—" && d.owner === "—");
check("the status is said plainly", d.status === "Draft");
check("a draft has a cycle but no next review date", d.reviewCycle === "Every 12 months");
check("blank or spaces count as nothing", dc({ ...base, sopVersion: "  ", sopApprovedBy: "" }).version === "—" && dc({ ...base, sopApprovedBy: "" }).approvedBy === "—");
check("in review and approved-not-published are told apart", dc({ ...base, lifecycleStatus: "IN_REVIEW" }).status === "In review" && /not yet published/.test(dc({ ...base, lifecycleStatus: "APPROVED" }).status));
check("a published process with no review date shows no date", dc({ ...base, lifecycleStatus: "PUBLISHED" }).reviewCycle === "Every 12 months");

// The real values
const pub = dc({ ...base, lifecycleStatus: "PUBLISHED", sopVersion: "v3", sopOwner: "Head of Finance", sopEffectiveDate: "2026-10-18", sopApprovedBy: "Hossam Abuelenien", nextReviewDue: "2027-10-18", reviewIntervalMonths: 6 });
check("version, effective date, approver and owner are the process's own", pub.version === "v3" && pub.effectiveDate === "2026-10-18" && pub.approvedBy === "Hossam Abuelenien" && pub.owner === "Head of Finance");
check("the review cycle follows the interval and names the next review", pub.reviewCycle === "Every 6 months · next 2027-10-18");
check("a hand-kept version on a draft is still shown (nothing is lost)", dc({ ...base, sopVersion: "2.1" }).version === "2.1");
check("the document-control owner wins, the owning role is the fallback", dc({ ...base, sopOwner: "A", processOwnerName: "B" }).owner === "A" && dc({ ...base, processOwnerName: "B" }).owner === "B");
check("one month reads naturally", dc({ ...base, reviewIntervalMonths: 1 }).reviewCycle === "Every month");

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
