/* ── THE CX REFUSAL, BEFORE AND AFTER (§216) ───────────────────────────
   Hala — a strategy custodian and project owner working on CX — was refused
   with *"a project's milestones (admin) cannot be changed here"*, naming a
   supporting function she had never opened.

   THIS RUNS HER SCENARIO TWICE: once against the `lib/graph-diff.js` that is
   on `origin/main`, and once against the working tree. The first must produce
   the refusal and lose the other function's work; the second must not.

   It is a BEFORE-AND-AFTER rather than an assertion about the fix, because
   the fault is only visible as a difference: every part of this passes on the
   broken build except the two lines that matter (§94.5). Run it from the repo
   root with a checkout of main available:

       git show origin/main:lib/graph-diff.js > /tmp/live-diff.js
       node scripts/test-cx-refusal.js

   The fixture models THEIR tenant, not the demo: reporting is open to the
   custodian, which the demo ships shut — a fixture that does not model the
   server is testing something the product does not do (§100.3). */
/* HALA'S EXACT SCENARIO, RUN TWICE: on what is LIVE, and on the fix.
   She is on CX. Somebody else changes a milestone on ANOTHER function.
   Her tab was opened before that. She then edits ONE row of her own. */
const fs = require("fs");
const A = require("/home/user/SMP/lib/authorize.js");
const SEED = JSON.parse(fs.readFileSync("/home/user/SMP/db/seed-state.json", "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));

function run(label, D) {
  const caps = SEED.group.capabilities;
  const HERS = 0;
  const OTHER = caps.findIndex((c, i) => i > 0 && c.fn !== caps[0].fn);

  /* the world as it stands when her tab opens */
  const tabOpened = { group: clone(SEED.group), units: clone(SEED.units),
                      functions: clone(SEED.functions), people: clone(SEED.people),
                      review: clone(SEED.review), access: clone(SEED.access),
                      cycle: clone(SEED.cycle), unitRoles: clone(SEED.unitRoles),
                      unitKeys: clone(SEED.unitKeys), functionKeys: clone(SEED.functionKeys) };
  tabOpened.functions[caps[HERS].fn].custodian = "hala";
  if (!tabOpened.people.find(p => p.key === "hala"))
    tabOpened.people.push({ key: "hala", name: "Hala", role: null });
  if (tabOpened.review) tabOpened.review.state = "open";
  /* their tenant has reporting open to the custodian; the demo ships it shut,
     and a fixture that does not model the tenant tests nothing (§100.3). */
  tabOpened.access = Object.assign({}, tabOpened.access, {
    custodian: Object.assign({}, (tabOpened.access || {}).custodian,
                             { a_fn_own: "edit", a_fn_own_strat: "fill" }) });

  /* somebody else then changes a milestone on ANOTHER function */
  const stored = clone(tabOpened);
  stored.group.capabilities[OTHER].projects[0].milestones[0].owner = "SOMEBODY ELSE";

  /* she edits ONE row of her own, from the stale tab */
  const herScreen = clone(tabOpened);
  herScreen.group.capabilities[HERS].projects[0].milestones[0].status = "wip";
  herScreen.group.capabilities[HERS].projects[0].milestones[0].pct = 40;

  /* what her browser puts on the wire */
  const changes = D.graphChanges(tabOpened, herScreen);
  const bytes = new TextEncoder().encode(JSON.stringify({ changes })).length;
  const parts = Object.keys(changes.set || {});
  const rows  = (changes.rows || []).length;

  /* the server applies it onto ITS OWN current copy and judges the result */
  const applied = D.applyChanges(clone(stored), changes);
  const incoming = applied.ok ? applied.state : null;
  const person = stored.people.find(p => p.key === "hala");
  const v = incoming ? A.authorize(stored, incoming, person) : { ok:false, refusals:[applied.error] };

  console.log("── " + label);
  console.log("   on the wire     : " + bytes + " bytes  | whole parts: [" +
              parts.join(",") + "]  | rows: " + rows);
  console.log("   save            : " + (v.ok ? "ACCEPTED" : "REFUSED"));
  if (!v.ok) console.log("   refusal         : " + (v.refusals || []).join(" | ").slice(0, 150));
  const kept = incoming &&
    incoming.group.capabilities[OTHER].projects[0].milestones[0].owner === "SOMEBODY ELSE";
  const landed = incoming &&
    incoming.group.capabilities[HERS].projects[0].milestones[0].status === "wip";
  console.log("   her own edit    : " + (landed ? "landed" : "LOST"));
  console.log("   the OTHER function's work: " + (kept ? "survived" : "WIPED"));
  console.log("");
  return { accepted: !!v.ok, landed: !!landed, kept: !!kept,
           parts: parts, rows: rows, bytes: bytes,
           /* THE ASSERTION THAT MATTERS: does the refusal name a function she
              never opened? Asked by NAME rather than by the wording, which is
              what the product may reword (§94.8). */
           namesOther: !v.ok && (v.refusals || []).join(" ")
                         .indexOf(caps[OTHER].fn) > -1 };
}
let fail = 0;
function expect(label, got, want) {
  const ok = got === want;
  if (!ok) fail++;
  console.log("  " + (ok ? "ok  " : "FAIL") + "  " + label +
              (ok ? "" : "  — got " + JSON.stringify(got)));
}
const before = fs.existsSync("/tmp/live-diff.js")
  ? run("WHAT IS LIVE ON main RIGHT NOW", require("/tmp/live-diff.js")) : null;
const after = run("WITH THE FIX", require("/home/user/SMP/lib/graph-diff.js"));

console.log("what must be true of the fix:");
expect("her save is accepted", after.accepted, true);
expect("...and names no function she never opened", after.namesOther, false);
expect("her own edit lands", after.landed, true);
expect("the other function's work survives", after.kept, true);
expect("only her own row travels", after.rows === 1 && !after.parts.length, true);

if (before) {
  console.log("");
  console.log("and the fault was REAL — on main, the same scenario:");
  expect("was refused", before.accepted, false);
  expect("...naming a function she never opened", before.namesOther, true);
  expect("and wiped the other function's work", before.kept, false);
  expect("carrying the whole group", before.parts.indexOf("group") > -1, true);
} else {
  console.log("\n(no /tmp/live-diff.js — the before half was not run)");
}
console.log("\n" + (fail ? fail + " FAILED" : "all good"));
process.exit(fail ? 1 : 0);
