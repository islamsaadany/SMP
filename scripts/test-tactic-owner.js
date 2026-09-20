#!/usr/bin/env node
/* A TACTIC'S OWNER IS A ROW ON THE TABLE (§379).
 * Run: node scripts/test-tactic-owner.js        (no database, no browser)
 *      node scripts/test-tactic-owner.js --break=<name>   (falsify)
 *
 * Islam, after being shown that a person reached a whole supporting function
 * because a project there named them: *"I believe we need to add measures &
 * tactics owners as roles so I can set their accessability and accordingly
 * Mahdy access can be switched on of orr."*
 *
 * WHAT THIS ASSERTS IS THE PROBLEM, NOT THE IMPLEMENTATION (§94.8). The role
 * is §147.7's shape one level down, so almost nothing here is new machinery —
 * what is new is that a tactic's Owner used to derive NOTHING, and the only
 * thing that ever reached such a person was the Contributor floor, which fires
 * only for somebody holding no other role at all. So a unit head who also owns
 * a tactic somewhere else reached it through no row on the table, and could
 * therefore be switched off by nobody.
 *
 * BOTH ENDS, EVERY TIME (§94.2). A row that grants nothing is trivially safe
 * and trivially useless: every assertion that the shut row reaches nothing is
 * paired with the same question asked of the OPEN row, or a build that had
 * simply added a dead row would pass the whole file.
 *
 * AND IT MUST TAKE NOTHING AWAY, which is the half a reading would miss. The
 * Contributor floor fires on `!out.length`, so ANY role deriving here
 * suppresses it — and this one ships at nothing where the floor gives view.
 * §4 is that case, made (§255), because nobody in the worked example stands on
 * the floor at all.
 *
 * THE STATE IS MADE AND THE PEOPLE ARE MINTED. The demo names 18 tactic owners
 * and every one of them already holds owner/custodian/fnhead/plowner at that
 * same place, so not one of the questions below can be asked of it as it
 * ships.
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");

/* ── THE BREAK IS APPLIED TO THE SOURCE (§276) ───────────────────────────
   `lib/authorize.js` requires `./rules.js`, so doctoring the rules in memory
   would leave the server half reading the real ones and half this file green
   for the wrong reason. The three files are copied out, the break is a text
   substitution on the copy, and the copy is what is required — so a break that
   does not MATCH is a loud failure rather than a quiet no-op (§344.1). */
const BREAKS = {
  /* the row derives nobody — the state before this section */
  "no-derive": [
    /var ownsTactic = function \(pillars\) \{[\s\S]*?once\("towner", "fn:" \+ k\);\n    \}\);\n/,
    ""],
  /* the branch reads the row's own owner again — which a MEASURE's ctx
     synthesises from its PILLAR's owner (§55), so a pillar owner is reached
     through a row that says Tactic owner */
  "row-owner": [
    /return ctx\.tacticOwner != null && ctx\.tacticOwner !== "" &&\n             namedOn\(\{ owner: ctx\.tacticOwner \}, person\);/,
    'return !!ctx.row && ctx.row.owner != null && ctx.row.owner !== "" &&\n             namedOn({ owner: ctx.row.owner }, person);'],
  /* the row ships open, the way the two owner rows above it do */
  "view-default": [
    /towner:    \{ a_group:"none", a_unit_own:"none", a_unit_own_strat:"none", a_unit_other:"none",\n                 a_fn_own:"none", a_fn_own_strat:"none", a_fn_other:"none", a_cycle:"none", a_setup:"none" \}/,
    'towner:    { a_group:"view", a_unit_own:"view", a_unit_own_strat:"view", a_unit_other:"none",\n                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" }'],
  /* the floor is asked of every role again, so a row granting nothing takes
     away the one that granted something */
  "floor": [
    /var grantless = out\.filter\(function \(r\) \{ return r\.role !== "towner"; \}\);\n    if \(!grantless\.length/,
    "var grantless = out;\n    if (!out.length"],
  /* it stops being an own-lines role, so it speaks for the whole subject and
     the register offers it as something to grant by hand */
  "not-bounded": [
    /var OWN_LINES_ONLY = \["contrib", NO_ROLE, "powner", "plowner", "towner"\];/,
    'var OWN_LINES_ONLY = ["contrib", NO_ROLE, "powner", "plowner"];']
};

const arg = (process.argv.slice(2).filter(a => a.indexOf("--break=") === 0)[0] || "").slice(8);
const LIB = path.join(__dirname, "..", "lib");
let libDir = LIB;
if (arg) {
  if (!BREAKS[arg]) { console.log("unknown break: " + arg); process.exit(2); }
  libDir = fs.mkdtempSync(path.join(os.tmpdir(), "smp-break-"));
  ["rules.js", "authorize.js", "graph-diff.js"].forEach(f =>
    fs.copyFileSync(path.join(LIB, f), path.join(libDir, f)));
  const f = path.join(libDir, "rules.js");
  const was = fs.readFileSync(f, "utf8");
  const [re, to] = BREAKS[arg];
  const now = was.replace(re, to);
  if (now === was) { console.log("BREAK DID NOT MATCH: " + arg); process.exit(2); }
  fs.writeFileSync(f, now);
  console.log("break applied to the source: " + arg);
}
const R = require(path.join(libDir, "rules.js"));
const A = require(path.join(libDir, "authorize.js"));

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log("  ok      " + name); return; }
  fail++; console.log("  FAIL    " + name + (extra ? "\n          " + extra : ""));
};
const clone = x => JSON.parse(JSON.stringify(x));

/* ── THE FIXTURE ─────────────────────────────────────────────────────── */
const SEED = JSON.parse(fs.readFileSync(
  path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));

const UNIT = "mobile";
const FN = Object.keys(SEED.functions || {})
  .filter(k => String(SEED.functions[k].format) === "pillars")[0];

function make(openTo) {
  const s = clone(SEED);
  const P = s.units[UNIT].items[0];
  /* Somebody who owns ONE tactic, somebody who owns the one beside it, and
     the pillar's own Owner — three people minted, so each question below has
     exactly one answer and the demo's own names cannot muddle it. */
  const add = (key, name) => {
    s.people.push({ key: key, name: name, unit: UNIT, active: true });
    return name;
  };
  P.tactics[0].owner = add("tess", "Tess Ownatactic");
  P.tactics[1].owner = add("otto", "Otto Othertactic");
  P.owner            = add("pia",  "Pia Pillarowner");
  /* §6's SUBJECT, AND IT HAS TO BE MADE: the leak the named handle exists to
     stop is only reachable by somebody who owns a pillar AND a tactic under
     it. Asked of the pillar's owner alone the question answers "no" because
     they hold no EDIT grant at all — true, and true of every build, which is
     §113.8's blind spot on the one assertion this section is for. */
  s.units[UNIT].items[1].owner = add("duo", "Duo Bothatonce");
  s.units[UNIT].items[1].tactics[0].owner = "Duo Bothatonce";
  /* AND THE SAME ROLE ON THE OTHER SIDE OF THE SWITCH (§53.5, A15). */
  if (FN) s.functions[FN].items[0].tactics[0].owner = "Tess Ownatactic";
  /* Somebody who ALREADY holds a role and also owns a tactic — the case the
     Contributor floor could never cover, and the whole reason for a row. */
  const headKey = (s.unitRoles[UNIT] || {}).head;
  const head = s.people.filter(p => p.key === headKey)[0];
  const OTHER = s.unitKeys.filter(k => k !== UNIT)[0];
  s.units[OTHER].items[0].tactics[0].owner = head.name;
  if (openTo) {
    s.access = s.access || {};
    s.access.towner = Object.assign({}, R.ACCESS_DEFAULTS.towner, openTo);
  }
  const P2 = s.units[UNIT].items[1];
  return { s: s, w: R.worldOf(s), P: P, P2: P2, OTHER: OTHER, head: head,
           T0: P.tactics[0], T1: P.tactics[1], M0: P.measures[0],
           D0: P2.tactics[0], DM: P2.measures[0] };
}
const who = (f, key) => f.s.people.filter(p => p.key === key)[0];
const roleAt = (f, key) => R.personRoles(f.w, who(f, key))
  .map(r => r.role + "@" + r.at).sort().join(" ");

/* The reporting ctx, built exactly as `reportItems`/`ctxOfUnit` build it —
   a TACTIC carries its own Owner, a MEASURE carries its PILLAR's (§55). */
const tCtx = (f, t, p) => ({ row: { owner: t.owner, collaborators: t.collaborators },
                             pillarOwner: (p || f.P).owner, tacticOwner: t.owner });
const mCtx = (f, m, p) => ({ row: { owner: (p || f.P).owner, collaborators: m.collaborators },
                             pillarOwner: (p || f.P).owner });

/* ── 1 · IT IS A ROW ON THE TABLE ────────────────────────────────────── */
console.log("\n1 · the row");
const row = (R.ROLES || []).filter(r => r.key === "towner")[0];
ck("Tactic owner is a role on Roles & access", !!row, "no row with key `towner`");
if (row) {
  ck("...it is called Tactic owner", row.name === "Tactic owner", row.name);
  ck("...and it is held on a unit or a pillars function, like a pillar owner",
     row.scope === "unitfn", row.scope);
  ck("...and it says what it is for", (row.note || "").length > 20, row.note);
}

/* ── 2 · IT STARTS SHUT, AND IT IS NOT GRANTED BY HAND ───────────────── */
console.log("\n2 · what it ships as");
const AREAS = (R.AREAS || []).map(a => a.key || a);
const def = R.ACCESS_DEFAULTS.towner || {};
const open = AREAS.filter(a => (def[a] || "none") !== "none");
ck("it ships at nothing in every column — Islam's own instruction",
   AREAS.length > 0 && open.length === 0, "open at: " + open.join(", "));
/* BOTH ENDS: the two rows it sits beside ship at view, so a build that had
   quietly shut every owner row would fail here rather than pass §2 (§113.8). */
ck("...while Pillar owner still ships at view on its own unit — this narrows nothing else",
   (R.ACCESS_DEFAULTS.plowner || {}).a_unit_own === "view",
   (R.ACCESS_DEFAULTS.plowner || {}).a_unit_own);
ck("it is an own-lines role, so the register's picker and the people workbook refuse it",
   R.isOwnLinesRole("towner") === true);

/* ── 3 · IT DERIVES FROM BEING NAMED, ON BOTH SIDES OF THE SWITCH ────── */
console.log("\n3 · who holds it");
const shut = make(null);
ck("owning a tactic on a unit derives it, at that unit",
   roleAt(shut, "tess").indexOf("towner@" + UNIT) > -1, roleAt(shut, "tess"));
if (FN) ck("...and on a pillars function, at that function (§53.5)",
   roleAt(shut, "tess").indexOf("towner@fn:" + FN) > -1, roleAt(shut, "tess"));
ck("owning the tactic BESIDE it is a different person's row",
   roleAt(shut, "otto").indexOf("towner@" + UNIT) > -1, roleAt(shut, "otto"));
ck("...and it is UNCONDITIONAL: a unit head who also owns a tactic elsewhere holds both",
   roleAt(shut, shut.head.key).indexOf("owner@" + UNIT) > -1 &&
   roleAt(shut, shut.head.key).indexOf("towner@" + shut.OTHER) > -1,
   roleAt(shut, shut.head.key));
ck("owning a PILLAR is still a Pillar owner and not this",
   roleAt(shut, "pia").indexOf("plowner@" + UNIT) > -1 &&
   roleAt(shut, "pia").indexOf("towner@") < 0, roleAt(shut, "pia"));

/* ── 4 · IT TAKES NOTHING AWAY ───────────────────────────────────────── */
console.log("\n4 · the floor it must not stand on");
ck("somebody who owns a tactic and holds nothing else KEEPS the Contributor floor",
   roleAt(shut, "tess").indexOf("contrib@" + UNIT) > -1, roleAt(shut, "tess"));
/* BOTH ENDS: the floor is a floor, not a gift — somebody the plan names
   nowhere still holds nothing, or the assertion above passes on a build that
   hands the floor to the whole register. */
const nobody = clone(shut.s);
nobody.people.push({ key: "nul", name: "Nula Namednowhere", unit: UNIT, active: true });
ck("...and somebody the plan names nowhere still holds nothing",
   R.personRoles(R.worldOf(nobody), nobody.people.filter(p => p.key === "nul")[0]).length === 0,
   JSON.stringify(R.personRoles(R.worldOf(nobody), nobody.people.filter(p => p.key === "nul")[0])));

/* ── 5 · SHUT IT REACHES NOTHING; OPEN IT REACHES ONE ROW ────────────── */
console.log("\n5 · reach");
const rep = (f, key, ctx) =>
  R.mayReportRow(f.w, who(f, key), "unit", UNIT, ctx);
ck("shut, the tactic's owner reports nothing",
   rep(shut, "tess", tCtx(shut, shut.T0)) === false);
const on = make({ a_unit_own: "edit" });
ck("opened to edit on this unit's Reporting, they report their own tactic",
   rep(on, "tess", tCtx(on, on.T0)) === true);
ck("...and NOT the tactic beside it",
   rep(on, "tess", tCtx(on, on.T1)) === false);
ck("...and NOT a key measure under the same pillar",
   rep(on, "tess", mCtx(on, on.M0)) === false);
ck("...and not another unit's rows at all",
   R.mayReportRow(on.w, who(on, "tess"), "unit", on.OTHER, tCtx(on, on.T0)) === false);

/* ── 6 · THE PILLAR'S OWNER IS NOT REACHED THROUGH THIS ROW ──────────── */
console.log("\n6 · the handle's whole reason");
/* A MEASURE's reporting ctx carries `row.owner = the PILLAR's owner` (§55),
   so a branch reading `ctx.row.owner` would make opening THIS row open every
   measure to pillar owners — a switch that moves something it does not name. */
ck("somebody who owns a pillar AND a tactic under it reports that tactic",
   rep(on, "duo", tCtx(on, on.D0, on.P2)) === true);
ck("...and NOT the measures of the pillar they own — the row says tactic, so it moves tactics",
   rep(on, "duo", mCtx(on, on.DM, on.P2)) === false);
ck("a pillar's own Owner, holding no tactic, reports nothing through this row",
   rep(on, "pia", mCtx(on, on.M0)) === false &&
   rep(on, "pia", tCtx(on, on.T0)) === false);
/* BOTH ENDS: they are not shut out of the product — their own row still works. */
const pOpen = make({ });
pOpen.s.access = pOpen.s.access || {};
pOpen.s.access.plowner = Object.assign({}, R.ACCESS_DEFAULTS.plowner, { a_unit_own: "edit" });
pOpen.w = R.worldOf(pOpen.s);
ck("...while opening the PILLAR owner row does reach that measure",
   R.mayReportRow(pOpen.w, who(pOpen, "pia"), "unit", UNIT, mCtx(pOpen, pOpen.M0)) === true);

/* ── 7 · IT NEVER SPEAKS FOR THE SUBJECT ─────────────────────────────── */
console.log("\n7 · what it is not");
ck("every way they may edit here is an own-lines role, so no Submit and no cycle note",
   R.onlyOwnLines(on.w, who(on, "tess"), "unit", UNIT) === true);
ck("...and they may not mark the pillar done",
   R.mayMarkDone(on.w, who(on, "tess"), "unit", UNIT, on.P.owner) === false);

/* ── 8 · AND THE SERVER ANSWERS THE SAME (§42) ───────────────────────── */
console.log("\n8 · the save");
function save(f, key, mutate) {
  const inc = clone(f.s); mutate(inc);
  return A.authorize(f.s, inc, f.s.people.filter(p => p.key === key)[0]);
}
const figure = id => s => {
  s.units[UNIT].items[0].tactics.forEach(t => { if (t.id === id) t.actual = "42"; });
};
ck("shut, the server refuses their own tactic's figure",
   save(shut, "tess", figure(shut.T0.id)).ok === false);
const okOwn = save(on, "tess", figure(on.T0.id));
ck("opened, the server accepts their own tactic's figure",
   okOwn.ok === true, (okOwn.refusals || []).join(" / "));
const noOther = save(on, "tess", figure(on.T1.id));
ck("...and refuses the tactic beside it",
   noOther.ok === false, "was ALLOWED");
const noPlan = save(on, "tess", s => {
  s.units[UNIT].items[0].tactics[0].name = "Renamed by the owner";
});
ck("...and refuses them the PLAN, which is the office's (§94)",
   noPlan.ok === false, "was ALLOWED");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
