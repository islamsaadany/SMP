/* ── VIEWING AS SOMEBODY, ON A READ PATH (§383) ──────────────────────────
 *
 * Islam, with the office's own session and the viewer switcher set to a
 * unit's strategy custodian: *"karim from mobile is seeing the report while
 * the report is made only for the retail and online team in the report
 * settings."*
 *
 * NO DATABASE AND NO BROWSER, because the rules are pure (lib/view-as.ts
 * splits the decision from the two lookups for exactly this, the shape
 * lib/access.ts already has). What a check like this can assert is the
 * whole of the rule; what it cannot is that the route wires it, which is
 * checks/shell.mjs and a run against a real client.
 *
 * BOTH ENDS, EVERY TIME (§94.2): a build that refused every simulation
 * would satisfy every "it does not widen" assertion here and leave the
 * office unable to look at anything through anybody's eyes.
 */
import { viewAsOf, maySimulate, viewAsDecision, NOT_ALLOWED, NO_SUCH_PERSON }
  from "../lib/view-as.ts";

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (n) => console.log("\n" + n);

const OFFICE = { personKey: "ff_islam", seat: "super" };
const TEAM   = { personKey: "ff_omar", seat: "smoteam" };
const THEIRS = { personKey: "karim", seat: "none" };
const refused = (r) => !!(r && r.refuse);

section("§1  the address carries it, and only when it is there");
check("no viewAs on the address is the empty string",
  viewAsOf("https://x/raya-trade/insights/list") === "");
check("a viewAs is read off the query",
  viewAsOf("https://x/raya-trade/insights/list?viewAs=karim") === "karim");
check("whitespace is not a person",
  viewAsOf("https://x/a/b?viewAs=%20%20") === "");
check("a rubbish address answers nothing rather than throwing",
  viewAsOf("not a url") === "");

section("§2  who may act through somebody else's view");
check("the office's Super user seat may", maySimulate(OFFICE));
check("an SMO team seat may NOT — §185 gates on super alone", !maySimulate(TEAM));
check("a client's own person may not", !maySimulate(THEIRS));
check("no seat at all may not", !maySimulate({ personKey: "x", seat: null }));

section("§3  it can only ever narrow");
const asKarim = viewAsDecision(OFFICE, "karim", true, null);
check("the office viewing as Karim becomes Karim",
  asKarim.personKey === "karim", JSON.stringify(asKarim));
check("...and takes THEIR seat, not the office's — this is the narrowing",
  asKarim.seat === "none", JSON.stringify(asKarim));
check("...and says it is a simulation", asKarim.simulated === true);
const asOffice = viewAsDecision(OFFICE, "ff_omar", true, "smoteam");
check("viewing as somebody who DOES hold a seat gets that seat",
  asOffice.seat === "smoteam", JSON.stringify(asOffice));

section("§4  a session that cannot simulate is judged as itself");
check("a team seat asking to view as somebody is refused",
  refused(viewAsDecision(TEAM, "karim", true, null)));
check("...in the frozen rule's own words (§53.5)",
  viewAsDecision(TEAM, "karim", true, null).refuse === NOT_ALLOWED);
check("a client's own person asking is refused",
  refused(viewAsDecision(THEIRS, "mahdy", true, null)));

section("§5  an unknown person is refused, never read as nobody");
const unknown = viewAsDecision(OFFICE, "nobody-at-all", false, null);
check("refused", refused(unknown), JSON.stringify(unknown));
check("...in the frozen rule's own words",
  unknown.refuse === NO_SUCH_PERSON);

section("§6  and nothing happens when nobody is simulating");
check("no key at all leaves the session as it is",
  viewAsDecision(OFFICE, "", true, null) === OFFICE);
check("viewing as yourself leaves the session as it is",
  viewAsDecision(OFFICE, "ff_islam", true, null) === OFFICE);
check("...even for somebody who could not have simulated anyway",
  viewAsDecision(THEIRS, "karim", true, null) === THEIRS);

console.log("\nview-as: " + ok + " ok, " + bad.length + " failed");
if (bad.length) { bad.forEach((b) => console.log("  - " + b)); process.exit(1); }
