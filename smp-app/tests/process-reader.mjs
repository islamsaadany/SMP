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

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
