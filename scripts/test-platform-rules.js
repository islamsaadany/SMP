/* Does the office's model actually decide what it claims to?
   Run: node scripts/test-platform-rules.js      (no database — pure functions)

   TWO LEVELS, so the tests come in two halves: what the PLATFORM admin may do,
   and what a SEAT on a client means. The second half matters more, for the
   reason test-authorize.js gives — refusing somebody is easy, and the real risk
   is a rule so tight that a consultant cannot do the job they are on. */

const F = require("../lib/platform-rules.js");

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name + (extra ? "\n        " + extra : ""));
}
const eq = (name, got, want) =>
  check(name + "  (got " + JSON.stringify(got) + ", wanted " + JSON.stringify(want) + ")", got === want);

const RAYA = { key:"raya-trade", name:"Raya Trade", kind:"client", status:"active" };
const RHI  = { key:"rhi",        name:"RHI",        kind:"client", status:"active" };
const DEMO = { key:"demo",       name:"Demo",       kind:"demo",   status:"active" };
const GONE = { key:"old",        name:"Old",        kind:"client", status:"retired" };
const ALL = [RAYA, RHI, DEMO, GONE];

const acct = (email, extra) => Object.assign({ email: email, name: email, kind: "office",
  status: "active", is_admin: false }, extra || {});
const world = (mine, access) => ({ mine: mine || [], access: access || {} });
const on = (key, seat) => ({ client_key: key, person_key: "ff_x", seat: seat || "smoteam" });
const setting = (map) => ({ everyone: map });

const admin = acct("islam@forefront.consulting", { is_admin: true });
const lead = acct("essam@forefront.consulting");
const newJoiner = acct("nadia@forefront.consulting");
const retired = acct("gone@forefront.consulting", { status: "retired" });
const rayaCEO = { email:"ceo@rayatrade.com", name:"CEO", kind:"client", status:"active" };

const wAdmin = world([on("raya-trade", "super")]);
const wLead  = world([on("raya-trade", "smoteam"), on("rhi", "super")]);
const wNew   = world([]);
const wCEO   = world([on("raya-trade")]);

console.log("── 1 · a seat opens a client, and nothing else does ──────");
check("a seat on a client opens it", F.mayOpenClient(wLead, lead, RAYA));
eq("…and says what they hold there", F.seatOn(wLead, "raya-trade"), "smoteam");
eq("…which can differ per client", F.seatOn(wLead, "rhi"), "super");
check("somebody's super user on one client is not on another",
  F.isSuperOf(wLead, "rhi") && !F.isSuperOf(wLead, "raya-trade"));
eq("no seat is no seat", F.seatOn(wLead, "el-abd"), null);

console.log("── 2 · a client they hold no seat on ─────────────────────");
/* Islam's answer: whether a consultant sees other clients is a setting in
   Who sees what — three states, not two. */
/* Written first as a ternary that answered itself — the shape constitution
   XVI warns about. Asked plainly of a client they hold no seat on. */
const OTHER = { key:"x", name:"X", kind:"client", status:"active" };
eq("listed by default", F.clientState(wLead, lead, OTHER), "listed");
const wHidden = world(wLead.mine, setting({ other_clients: "hidden" }));
const wOpen   = world(wLead.mine, setting({ other_clients: "open" }));
check("hidden means not even on the cards", !F.mayListClient(wHidden, lead, OTHER));
check("listed means on the cards and not openable",
  F.mayListClient(wLead, lead, OTHER) && !F.mayOpenClient(wLead, lead, OTHER));
check("open means readable", F.mayOpenClient(wOpen, lead, OTHER));

console.log("── 3 · the platform admin ────────────────────────────────");
check("opens every client", F.mayOpenClient(wAdmin, admin, RHI) && F.mayOpenClient(wAdmin, admin, DEMO));
check("…arriving as that client's Super user where they hold no seat",
  F.seatFor(wAdmin, admin, RHI) === "super");
check("…and as the seat they hold where they do", F.seatFor(wLead, lead, RAYA) === "smoteam");
check("adds clients and consultants", F.mayCreateClient(wAdmin, admin) && F.mayManageConsultants(wAdmin, admin));
check("sets the table", F.mayEditAccess(wAdmin, admin));

console.log("── 4 · and nobody else does those things ─────────────────");
check("a consultant does not add a client", !F.mayCreateClient(wLead, lead));
check("a consultant does not set the table", !F.mayEditAccess(wLead, lead));
check("…even one who is a client's Super user", !F.mayEditAccess(wLead, lead) && F.isSuperOf(wLead, "rhi"));
check("a consultant reads the consultants list by default", F.mayReadConsultants(wLead, lead));
check("…and does not manage it", !F.mayManageConsultants(wLead, lead));
const wNoList = world(wLead.mine, setting({ consultants: "none" }));
check("…which the table can close", !F.mayReadConsultants(wNoList, lead));

console.log("── 5 · a new joiner, on no client ────────────────────────");
check("signs in and can open nothing",
  !F.mayOpenClient(wNew, newJoiner, RAYA) && !F.mayOpenClient(wNew, newJoiner, RHI));
check("…but reaches Demo, which is what practising is for",
  F.mayOpenClient(wNew, newJoiner, DEMO));
const wNoDemo = world([], setting({ demo: "none" }));
check("…unless the table closes it", !F.mayOpenClient(wNoDemo, newJoiner, DEMO));
check("a retired account holds nothing", !F.mayOpenClient(wLead, retired, RAYA) &&
  !F.mayReadConsultants(wLead, retired));

console.log("── 6 · a client's configuration ──────────────────────────");
check("the admin configures any client", F.mayConfigureClient(wAdmin, admin, RHI));
check("a client's own Super user configures theirs", F.mayConfigureClient(wLead, lead, RHI));
check("…and not one they are only on the team of", !F.mayConfigureClient(wLead, lead, RAYA));
check("…nor one they hold no seat on", !F.mayConfigureClient(wLead, lead, OTHER));

console.log("── 7 · a client's own person is not one of us ────────────");
check("their own client, always", F.mayOpenClient(wCEO, rayaCEO, RAYA));
check("nobody else's, ever", !F.mayOpenClient(wCEO, rayaCEO, RHI) && !F.mayOpenClient(wCEO, rayaCEO, DEMO));
check("no page of this platform", !F.mayReadConsultants(wCEO, rayaCEO) &&
  !F.mayCreateClient(wCEO, rayaCEO) && !F.mayEditAccess(wCEO, rayaCEO));
check("and a stray admin flag on them grants nothing",
  !F.isAdmin(Object.assign({}, rayaCEO, { is_admin: true })));

console.log("── 8 · issuing a password, and the admin flag ────────────");
check("the admin issues to a consultant", F.mayIssuePasswordTo(wAdmin, admin, lead));
check("…not to another admin", !F.mayIssuePasswordTo(wAdmin, admin, acct("b@ff.example", { is_admin: true })));
check("…and never to themselves", !F.mayIssuePasswordTo(wAdmin, admin, admin));
check("a consultant issues to nobody", !F.mayIssuePasswordTo(wLead, lead, newJoiner));
check("the admin may make somebody else an admin", F.maySetAdmin(wAdmin, admin, lead));
check("…and may not change their own", !F.maySetAdmin(wAdmin, admin, admin));

console.log("── 9 · stored is merged over the defaults ────────────────");
const tight = world(wLead.mine, setting({ other_clients: "hidden" }));
eq("a stored cell wins", F.grantIn(tight, "other_clients"), "hidden");
eq("an untouched cell keeps its default", F.grantIn(tight, "consultants"), "view");
eq("a column added later keeps its default", F.grantIn(tight, "demo"), "edit");
eq("a column nobody declared answers none", F.grantIn(tight, "billing"), "none");

console.log("── 10 · the cards are the list the server will open ──────");
const seen = F.visibleClients(wLead, lead, ALL).map(c => c.key);
check("a retired client is on nobody's cards", seen.indexOf("old") < 0, seen.join(","));
eq("a consultant sees their seats and whatever the table lists", seen.join(","), "raya-trade,rhi,demo");
eq("hidden takes the rest away",
  F.visibleClients(wHidden, lead, ALL).map(c => c.key).join(","), "raya-trade,rhi,demo");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
