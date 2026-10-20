/* Reader-view access and acknowledgement rules. Run: node --experimental-strip-types tests/process-reader.mjs */
import * as R from "../ffp/lib/domain/process-reader.ts";
let pass = 0, fail = 0;
const check = (n, c) => (c ? pass++ : (fail++, console.log("  FAIL  " + n)));

// Refusals
check("a client person with no register key is refused", !R.mayRead({ office: false, userKind: "client", personKey: null }));
check("a blank register key is refused", !R.mayRead({ office: false, userKind: "client", personKey: "  " }));
check("a consultant with no office seat is refused", !R.mayRead({ office: false, userKind: "consultant", personKey: "p1" }));
check("nobody expected when no step has a role", R.expectedAcknowledgers({ stepRoleIds: [null, null], people: [{ personKey: "a", name: "A", roleIds: ["r1"] }] }).length === 0);
check("a person holding no used role is not expected", R.expectedAcknowledgers({ stepRoleIds: ["r1"], people: [{ personKey: "a", name: "A", roleIds: ["r2"] }] }).length === 0);
check("a person with no register key is not expected", R.expectedAcknowledgers({ stepRoleIds: ["r1"], people: [{ personKey: null, name: "A", roleIds: ["r1"] }] }).length === 0);

// Legitimate
check("the office may read", R.mayRead({ office: true, userKind: "consultant", personKey: null }));
check("a client person on the register may read", R.mayRead({ office: false, userKind: "client", personKey: "p1" }));
const people = [
  { personKey: "a", name: "A", roleIds: ["r1"] },
  { personKey: "b", name: "B", roleIds: ["r1", "r2"] },
  { personKey: "c", name: "C", roleIds: ["r3"] },
];
const exp = R.expectedAcknowledgers({ stepRoleIds: ["r1", "r1", "r2", null], people });
check("people holding any used role are expected, once each", exp.length === 2 && exp[0].personKey === "a" && exp[1].personKey === "b");
const pr = R.acknowledgementProgress(exp, new Set(["a", "zzz"]));
check("progress counts only expected people", pr.total === 2 && pr.done === 1 && pr.outstanding.length === 1 && pr.outstanding[0].name === "B");
check("an acknowledgement by somebody not expected does not count", R.acknowledgementProgress(exp, new Set(["c"])).done === 0);
check("all acknowledged leaves none outstanding", R.acknowledgementProgress(exp, new Set(["a", "b"])).outstanding.length === 0);

// The bar's reading link
const B = await import("../lib/bar-extras.ts");
const offer = (o) => R.offersReadingLink({ clientHasProcesses: true, office: false, userKind: "client", personKey: "k1", ...o });
check("a client person on the register is offered the link", offer({}));
check("not offered when the client does not use Processes", !offer({ clientHasProcesses: false }));
check("not offered to the office", !offer({ office: true }));
check("not offered to a consultant", !offer({ userKind: "consultant" }));
check("not offered without a register key", !offer({ personKey: null }));
check("no link when nothing is published", B.readingLink({ published: 0, waiting: 0 }) === null && B.readingLink(null) === null);
check("link with a count when something waits", B.readingLink({ published: 3, waiting: 2 }).count === "2 to read");
check("link stays, no count, when all read", B.readingLink({ published: 3, waiting: 0 }).count === null && B.readingLink({ published: 3, waiting: 0 }).label === "Processes");
check("an approval waiting alone gives a link", B.readingLink({ published: 0, waiting: 0, approvals: 1 }).count === "1 to approve");
check("reading and approving are both said", B.readingLink({ published: 3, waiting: 2, approvals: 1 }).count === "2 to read · 1 to approve");
check("nothing to read or approve: no link", B.readingLink({ published: 0, waiting: 0, approvals: 0 }) === null);
check("outside a request the bar has nothing", B.barExtras().processesRead === null);
check("inside a request the bar reads what the router set", B.withBarExtras({ processesRead: { published: 1, waiting: 1 } }, () => B.barExtras().processesRead.waiting) === 1);
check("it survives an await", await B.withBarExtras({ processesRead: { published: 1, waiting: 4 } }, async () => { await Promise.resolve(); return B.barExtras().processesRead.waiting; }) === 4);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
