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
import { viewAsOf, maySimulate, maySimulateSeat, viewAsDecision,
         NOT_ALLOWED, NO_SUCH_PERSON, NOT_THE_SUPER } from "../lib/view-as.ts";

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
check("an SMO team seat may too (§554)", maySimulate(TEAM));
check("a client's own person may not", !maySimulate(THEIRS));
check("no seat at all may not", !maySimulate({ personKey: "x", seat: null }));

/* §554's OWN HALF, AND BOTH ENDS OF IT (§94.2): a build that let the team
   simulate nobody at all would satisfy every "it does not widen" assertion
   below, and a build with no ceiling would satisfy every "it works" one. */
section("§2b the ceiling is your own seat (§554)");
check("the Super user may look through the Super user's own row",
  maySimulateSeat(OFFICE, "super"));
check("the Super user may look through an SMO team member",
  maySimulateSeat(OFFICE, "smoteam"));
check("the Super user may look through a client's own person",
  maySimulateSeat(OFFICE, "none"));
check("the SMO team may look through a client's own person",
  maySimulateSeat(TEAM, "none"));
check("...and through another SMO team member",
  maySimulateSeat(TEAM, "smoteam"));
check("...and NOT through the Super user — the one row above them",
  !maySimulateSeat(TEAM, "super"));
check("a client's own person may look through nobody, whatever they hold",
  !maySimulateSeat(THEIRS, "none") && !maySimulateSeat(THEIRS, "super"));

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
/* THE TEAM'S OWN SIMULATION, END TO END (§554) — the half that proves the
   widening actually widened, beside §4's proof that it is still capped. */
const teamAsKarim = viewAsDecision(TEAM, "karim", true, null);
check("an SMO team member viewing as Karim becomes Karim",
  teamAsKarim.personKey === "karim", JSON.stringify(teamAsKarim));
check("...and takes Karim's seat, not the team's",
  teamAsKarim.seat === "none", JSON.stringify(teamAsKarim));
check("...and says it is a simulation", teamAsKarim.simulated === true);

section("§4  a session that cannot simulate is judged as itself");
check("a client's own person asking is refused",
  refused(viewAsDecision(THEIRS, "mahdy", true, null)));
check("...in the frozen rule's own words (§53.5)",
  viewAsDecision(THEIRS, "mahdy", true, null).refuse === NOT_ALLOWED);
check("no seat at all is refused",
  refused(viewAsDecision({ personKey: "x", seat: null }, "karim", true, null)));
/* AND THE ONE ROW THE TEAM MAY NOT WEAR, refused on the decision itself and
   not only left out of a list — a forged address is the case this is for. */
const teamAsSuper = viewAsDecision(TEAM, "ff_islam", true, "super");
check("an SMO team member asking to view as the Super user is refused",
  refused(teamAsSuper), JSON.stringify(teamAsSuper));
check("...in the frozen rule's own words",
  teamAsSuper.refuse === NOT_THE_SUPER);
check("...and it is the SEAT that refuses, not the name: the same key with " +
  "no seat on it goes through",
  viewAsDecision(TEAM, "ff_islam", true, "none").personKey === "ff_islam");

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
