/* Does the office's table actually decide what it claims to?
   Run: node scripts/test-platform-rules.js      (no database — pure functions)

   The second half matters more than the first, for the reason
   test-authorize.js gives: refusing an Observer is easy, and the real risk is
   a rule written so tightly that a Lead cannot do their own job. Every role is
   therefore also made to do the work it is FOR, and must not be refused. */

const F = require("../lib/platform-rules.js");

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name + (extra ? "\n        " + extra : ""));
}
const eq = (name, got, want) => check(name + "  (got " + JSON.stringify(got) + ")", got === want);

/* ── The world, as the server will build it ───────────────────────── */
const RAYA = { key:"raya-trade", name:"Raya Trade", kind:"client", status:"active" };
const RHI  = { key:"rhi",        name:"RHI",        kind:"client", status:"active" };
const DEMO = { key:"demo",       name:"Demo",       kind:"demo",   status:"active" };
const GONE = { key:"old",        name:"Old",        kind:"client", status:"retired" };
const CLIENTS = [RAYA, RHI, DEMO, GONE];

const account = (role, extra) => Object.assign({ email: role + "@forefront.consulting",
  name: role, role: role, status: "active" }, extra || {});
/* `mine` is account_clients read for this account — the ONE statement of what
   "my clients" means. */
const world = (mine, access) => ({ mine: mine || [], access: access || {} });
const on = (key, isSuper) => ({ client_key: key, person_key: "ff_x", is_super: !!isSuper });

const admin = account("admin");
const lead = account("lead");
const consultant = account("consultant");
const observer = account("observer");
const noRole = account(null, { email:"new@forefront.consulting", role:null });
const retired = account("lead", { email:"gone@forefront.consulting", status:"retired" });

const wLead = world([on("raya-trade"), on("rhi", true)]);
const wCons = world([on("raya-trade")]);
const wObs  = world([on("raya-trade")]);
const wAdmin = world([on("raya-trade", true)]);

console.log("── 1 · the defaults, as approved 2026-08-28 ──────────────");
eq("admin · other clients", F.grantIn(world(), "admin", "other_clients"), "edit");
eq("lead · other clients", F.grantIn(world(), "lead", "other_clients"), "view");
eq("consultant · other clients", F.grantIn(world(), "consultant", "other_clients"), "none");
eq("observer · my clients", F.grantIn(world(), "observer", "my_clients"), "view");
eq("consultant · demo", F.grantIn(world(), "consultant", "demo"), "view");
eq("lead · create a client", F.grantIn(world(), "lead", "create_client"), "none");

console.log("── 2 · nothing until granted, and nothing when retired ───");
eq("no role · my clients", F.grantIn(world(), null, "my_clients"), "none");
check("no role opens nothing", !F.mayOpenClient(world([on("raya-trade")]), noRole, RAYA));
check("no role sees no cards", F.visibleClients(world([on("raya-trade")]), noRole, CLIENTS).length === 0);
check("a retired account opens nothing", !F.mayOpenClient(wLead, retired, RAYA));
check("a retired account manages nobody", !F.mayManageConsultants(wLead, retired));

console.log("── 3 · an area nobody declared answers none ──────────────");
eq("unknown area", F.grantIn(world(), "admin", "billing"), "none");

console.log("── 4 · stored is MERGED over the defaults, never substituted");
const tightened = world([on("raya-trade")], { lead: { other_clients: "none" } });
eq("stored cell wins", F.grantIn(tightened, "lead", "other_clients"), "none");
eq("an untouched cell keeps its default", F.grantIn(tightened, "lead", "my_clients"), "edit");
eq("an area added later keeps its default", F.grantIn(tightened, "lead", "demo"), "edit");

console.log("── 5 · every role can do the work it is FOR ──────────────");
check("admin opens any client", F.mayOpenClient(wAdmin, admin, RHI) && F.mayEditClient(wAdmin, admin, RHI));
check("admin adds a client", F.mayCreateClient(wAdmin, admin));
check("admin manages consultants", F.mayManageConsultants(wAdmin, admin));
check("admin edits the table", F.mayEditAccess(wAdmin, admin));
check("lead edits their own client", F.mayEditClient(wLead, lead, RAYA));
check("lead reads another client", F.mayOpenClient(wLead, lead, DEMO) && F.mayOpenClient(world(), lead, RHI));
check("lead configures their own client", F.mayConfigureClient(wLead, lead, RAYA));
check("lead reads the consultants list", F.mayReadConsultants(wLead, lead));
check("consultant works in their own client", F.mayEditClient(wCons, consultant, RAYA));
check("consultant practises in Demo", F.mayOpenClient(wCons, consultant, DEMO));
check("observer reads their own client", F.mayOpenClient(wObs, observer, RAYA));

console.log("── 6 · and no more than that ─────────────────────────────");
check("lead does not add clients", !F.mayCreateClient(wLead, lead));
check("lead does not manage consultants", !F.mayManageConsultants(wLead, lead));
/* Written once as `!x === false || …`, which passes whatever the rule does —
   the unfalsifiable assertion constitution XVI names. Asked plainly now. */
check("lead does not edit a client they are not on",
  !F.mayEditClient(world([on("raya-trade")]), lead, RHI));
check("consultant cannot open another client", !F.mayOpenClient(wCons, consultant, RHI));
check("consultant cannot configure their own client", !F.mayConfigureClient(wCons, consultant, RAYA));
check("consultant cannot edit Demo", !F.mayEditClient(wCons, consultant, DEMO));
check("observer cannot edit their own client", !F.mayEditClient(wObs, observer, RAYA));
check("observer sees no other client", !F.mayOpenClient(wObs, observer, RHI));

console.log("── 7 · configuration rides what the role can REACH ───────");
/* A Lead's client_config is `edit`, but RHI is not theirs to open here, so the
   configuration must not be reachable through it either. */
const wLeadOnlyRaya = world([on("raya-trade")], { lead: { other_clients: "none" } });
check("config follows the client, not the cell",
  F.mayConfigureClient(wLeadOnlyRaya, lead, RAYA) && !F.mayConfigureClient(wLeadOnlyRaya, lead, RHI));

console.log("── 8 · the demo column is asked FIRST ────────────────────");
/* A new joiner with nothing but Demo must reach Demo and no client. */
const wNew = world([], { observer: { my_clients: "none", other_clients: "none", demo: "view" } });
check("observer with nothing reaches Demo", F.mayOpenClient(wNew, observer, DEMO));
check("...and reaches no client", !F.mayOpenClient(wNew, observer, RAYA) && !F.mayOpenClient(wNew, observer, RHI));
eq("demo is read through its own column", F.areaFor(wNew, DEMO), "demo");

console.log("── 9 · the admin row is nobody's, including the admin's ──");
check("admin may edit another row", F.mayEditAccessRow(wAdmin, admin, "lead"));
check("admin may NOT edit the admin row", !F.mayEditAccessRow(wAdmin, admin, "admin"));
check("a lead may not edit the table at all", !F.mayEditAccess(wLead, lead));

console.log("── 10 · issuing a password: the test is the TARGET ───────");
check("admin issues to a consultant", F.mayIssuePasswordTo(wAdmin, admin, consultant));
check("admin does NOT issue to another admin",
  !F.mayIssuePasswordTo(wAdmin, admin, account("admin", { email:"other@forefront.consulting" })));
check("nobody issues to themselves", !F.mayIssuePasswordTo(wAdmin, admin, admin));
check("a lead issues to nobody", !F.mayIssuePasswordTo(wLead, lead, consultant));

console.log("── 11 · the cards are the list the server will open ──────");
const seen = F.visibleClients(wLead, lead, CLIENTS).map(function (c) { return c.key; });
check("a retired client is on nobody's cards", seen.indexOf("old") < 0, seen.join(","));
check("every card shown is openable",
  seen.every(function (k) { return F.mayOpenClient(wLead, lead, CLIENTS.filter(c => c.key === k)[0]); }));
eq("a consultant sees only their own and Demo",
  F.visibleClients(wCons, consultant, CLIENTS).map(c => c.key).join(","), "raya-trade,demo");

console.log("── 12 · the seat an office account holds inside a client ─");
eq("their super user", F.seatIn(wLead, "rhi"), "super");
eq("everyone else on the team", F.seatIn(wLead, "raya-trade"), "smoteam");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
