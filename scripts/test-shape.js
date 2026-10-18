/* ── THE SHAPE: A LAYER PER KIND, AND A CHOSEN NAVIGATION (§544) ──────────
   Spec 066 stage 4. Islam, from the signed-off mockup: *"no not 1 list the
   business units has it's own layer above and the functions has their own
   layer above"*, and of the navigation: *"this should be a choice what are
   the navigation switch… so it needs to be chosen somehow not derived"*.

   Stage 4 moves no data (spec 066 §8) and must leave every client opening
   exactly as it does. Two answers are new and both are stored as an
   ABSENCE, so this check is mostly about what the absence says:

     1 · WHICH KIND'S LAYER A DIVISION IS ON, read from USE. The worked
         example is Raya's shape — two divisions named by six units and no
         function — so the units have a layer and the functions have none.
         El Abd's shape is built beside it (no units, three divisions named
         by functions) and reads the other way round. Both are asserted,
         because a rule that answered "bu" for everything would satisfy one.

     2 · AND A DIVISION NOBODY HAS PUT ANYTHING IN gives no kind a layer.
         This is the assertion the rule was rewritten around: asked off
         `layerCompanies`, El Abd read as having a layer above business
         units it does not have, because an empty division belongs to both
         rows for DRAWING and to neither for DECIDING.

     3 · THE NAVIGATION TICK, UNSAID, IS WHAT `navSides()` ANSWERS TODAY.
         Asserted against the sides themselves, built from the sources on
         both clients' shapes — not against a list of words typed here
         (§94.8). Raya: the units and the functions. El Abd: its divisions.

     4 · AND A TICK CHANGES THE ROW, both ways. A row that could be ticked
         and read by nothing would be decoration (§42).

     5 · NOTHING IS WRITTEN BY LOOKING (§42, §50.6): every reading above is
         taken twice, with a deep copy compared before and after.

   PROVED ABLE TO FAIL (§113.8), with what was counted, out of 30:
     · `coOnLayer` answering from the stored `layer` before use   → 2 red
     · `layerOn` asked off `layerCompanies` (the rewritten rule)  → 1 red
     · `navRowUnsaid` giving the functions a side at company level → 2 red
     · `navPicked` ignoring a stored answer                      → 2 red

   THE FIRST OF THOSE CAME BACK GREEN THE FIRST TIME, and that is why
   section 2 holds three more assertions than it did: no division in either
   fixture carried a stored `layer` AND a box of the other kind, so reading
   the stored answer first changed nothing anybody was watching. El Abd's
   Commercial carries both now.

   Usage:  node scripts/test-shape.js
   No browser, no database, no network. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
const R = require(path.join(ROOT, "lib", "rules.js"));

let failed = 0, passed = 0;
function ok(cond, what, detail) {
  if (cond) { passed++; console.log("  ok    " + what); }
  else { failed++; console.log("  FAIL  " + what + (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));
const raya = () => JSON.parse(JSON.stringify(SEED));

/* EL ABD'S SHAPE, built from what the live client holds (§255: the state is
   made here): the units switched off, three divisions, every function in
   one of them. Names are its own, so a reader can see which client this is. */
function elabd() {
  const s = { group: { structure: { bu: { exists: false } } },
              companyKeys: [], companies: {}, unitKeys: [], units: {},
              functionKeys: [], functions: {} };
  const by = { "Commercial": ["Retail", "External Sales", "E-Commerce", "Marketing", "Customer Experience"],
               "Operations": ["Planning", "Procurement", "Production", "Quality", "Engineering"],
               "Corporate Support": ["Internal Audit", "Finance", "HR", "IT", "PMO"] };
  Object.keys(by).forEach(function (nm, i) {
    const ck = "c" + (i + 1);
    s.companyKeys.push(ck); s.companies[ck] = { name: nm };
    by[nm].forEach(function (fn, j) {
      const fk = "f" + (i + 1) + "_" + j;
      s.functionKeys.push(fk); s.functions[fk] = { name: fn, company: ck };
    });
  });
  return s;
}
const layer = (s, k) => R.layerOn(s.group, k, s.companyKeys, s.companies, s.units, s.functions);
const onRow = (s, k) => R.layerCompanies(k, s.companyKeys, s.companies, s.units, s.functions)
  .map(function (c) { return s.companies[c].name; });

/* ── 1 · WHICH KIND'S LAYER A DIVISION IS ON ────────────────────────────── */
console.log("1 · a division belongs to the kind whose boxes name it");
{
  const a = raya(), e = elabd();
  ok(layer(a, "bu") === true, "Raya: the units have a layer");
  ok(layer(a, "fn") === false, "…and the functions have none");
  ok(onRow(a, "bu").join(",") === "Distribution,B2C", "…its two divisions are on the units' row", onRow(a, "bu"));
  ok(onRow(a, "fn").length === 0, "…and on no other row", onRow(a, "fn"));
  ok(layer(e, "fn") === true, "El Abd: the functions have a layer");
  ok(layer(e, "bu") === false, "…and the units, which it has none of, have none");
  ok(onRow(e, "fn").join(",") === "Commercial,Operations,Corporate Support",
     "…its three divisions are on the functions' row", onRow(e, "fn"));
  /* BOTH ENDS (§94.2): the two clients answer differently, so a rule that
     said one thing for everybody could not pass both. */
  ok(layer(a, "bu") !== layer(e, "bu") && layer(a, "fn") !== layer(e, "fn"),
     "…the two clients read the opposite way round, so neither answer is a constant");
}

/* ── 2 · A DIVISION NOBODY USES ─────────────────────────────────────────── */
console.log("2 · an empty division is drawn on both rows and decides neither");
{
  const e = elabd();
  e.companyKeys.push("c9"); e.companies.c9 = { name: "New division" };
  ok(layer(e, "bu") === false, "a division with nothing in it does not give the units a layer");
  ok(onRow(e, "bu").join(",") === "New division", "…but it IS drawn, on both rows, so it can be filled (§61)", onRow(e, "bu"));
  ok(onRow(e, "fn").indexOf("New division") >= 0, "…including the row whose layer is on", onRow(e, "fn"));
  /* and a list where NOTHING has been assigned yet is a layer on both rows,
     or a client that made its divisions first would see them nowhere */
  const bare = { group: {}, companyKeys: ["c1"], companies: { c1: { name: "Only" } },
                 unitKeys: [], units: {}, functionKeys: [], functions: {} };
  ok(layer(bare, "bu") === true && layer(bare, "fn") === true,
     "a list nothing is assigned to yet is a layer on both rows");
  /* the office's own answer wins over use when nothing uses it */
  e.companies.c9.layer = "bu";
  ok(onRow(e, "bu").join(",") === "New division" && onRow(e, "fn").indexOf("New division") < 0,
     "…and once the office says which kind made it, it is on that row alone", [onRow(e, "bu"), onRow(e, "fn")]);
  /* AND USE BEATS A STORED ANSWER THAT CONTRADICTS IT. Written after the
     first break of this check came back GREEN (§113.8): swapping the two
     so the stored `layer` was read FIRST changed nothing any assertion
     watched, because no division here held a stored answer AND a box of
     the other kind. One does now — El Abd's Commercial, full of functions,
     marked "bu" by an older pass — and the rule is that what is in it
     decides. */
  const stale = elabd();
  stale.companies.c1.layer = "bu";
  ok(onRow(stale, "fn").indexOf("Commercial") >= 0,
     "a division full of functions stays the functions', whatever an old answer says",
     onRow(stale, "fn"));
  ok(onRow(stale, "bu").indexOf("Commercial") < 0,
     "…and does not appear above business units it holds none of", onRow(stale, "bu"));
  ok(layer(stale, "bu") === false, "…and gives them no layer either");
  /* an explicit layer switch beats both */
  const a = raya();
  a.group.structure = { fn: { layer: true } };
  ok(layer(a, "fn") === true, "a layer switched on explicitly is on, whatever use says");
  a.group.structure = { bu: { layer: false } };
  ok(layer(a, "bu") === false, "…and one switched off is off");
  /* and the second layer switched off answers for both (§418) */
  a.group.structure = { mid: { exists: false }, fn: { layer: true } };
  ok(layer(a, "bu") === false && layer(a, "fn") === false,
     "the second layer switched off takes both kinds' layers with it");
}

/* ── 3 · THE NAVIGATION TICK, UNSAID ────────────────────────────────────── */
console.log("3 · unsaid, the tick is the row each client has today");
{
  const a = raya(), e = elabd();
  const rows = (s) => R.NAV_ROWS.map(function (r) { return r + "=" + R.navPicked(s.group, r); }).join(" ");
  ok(rows(a) === "bu=true fn=true bu@g=false fn@g=false",
     "Raya: the units and the functions, neither layer", rows(a));
  ok(rows(e) === "bu=false fn=false bu@g=false fn@g=true",
     "El Abd: its functions' divisions, and nothing else", rows(e));
  /* §94.8: agreed with something computed independently — what the live
     navSides() does today, which is the units wherever they exist, the
     functions beside them, and the divisions in their place at company
     level (companyFnSides). */
  const sidesToday = (s) => {
    const bu = R.buExists(s.group), fn = R.fnExists(s.group);
    const out = [];
    if (s.unitKeys.length && bu) out.push("units");
    if (s.functionKeys.length && fn) out.push(bu ? "fns" : "divisions");
    return out.join(",");
  };
  const picked = (s) => {
    const out = [];
    if (s.unitKeys.length && R.navPicked(s.group, "bu@g")) out.push("unit divisions");
    if (s.unitKeys.length && R.navPicked(s.group, "bu")) out.push("units");
    if (s.functionKeys.length && R.navPicked(s.group, "fn@g")) out.push("divisions");
    if (s.functionKeys.length && R.navPicked(s.group, "fn")) out.push("fns");
    return out.join(",");
  };
  ok(picked(a) === sidesToday(a), "Raya's ticks give the sides it has today", [picked(a), sidesToday(a)]);
  ok(picked(e) === sidesToday(e), "…and El Abd's give the sides it has today", [picked(e), sidesToday(e)]);
}

/* ── 4 · AND A TICK CHANGES THE ROW ─────────────────────────────────────── */
console.log("4 · a tick is read, both ways");
{
  const a = raya();
  a.group.structure = { fn: { nav: false } };
  ok(R.navPicked(a.group, "fn") === false, "a stored false takes the functions off the row");
  a.group.structure = { bu: { layerNav: true } };
  ok(R.navPicked(a.group, "bu@g") === true, "…and a stored true puts the units' divisions on it");
  ok(R.navPicked(a.group, "bu") === true, "…without touching the row beside it");
  /* an unknown row is not a row */
  ok(R.navPicked(a.group, "cap") === false && R.navRowUnsaid(a.group, "") === false,
     "a row the platform does not know is never on the navigation");
}

/* ── 5 · NOTHING IS WRITTEN BY LOOKING ──────────────────────────────────── */
console.log("5 · every reader here creates nothing (§42)");
{
  const a = raya(), e = elabd();
  const snap = (s) => JSON.stringify([s.group, s.companies, s.units, s.functions]);
  const before = [snap(a), snap(e)];
  [a, e].forEach(function (s) {
    R.LAYER_KINDS.forEach(function (k) { layer(s, k); onRow(s, k); });
    R.NAV_ROWS.forEach(function (r) { R.navPicked(s.group, r); R.navRowUnsaid(s.group, r); });
    R.layerWords(s.group, "bu"); R.layerWords(s.group, "fn");
    R.layerOrphans("bu", s.unitKeys, s.units, s.companyKeys, s.companies, s.units, s.functions);
  });
  ok(snap(a) === before[0] && snap(e) === before[1], "asking twice changed nothing in either client");
}

/* ── 6 · THE BOXES WITH NO DIVISION YET ─────────────────────────────────── */
console.log("6 · the boxes a layer has not been given");
{
  const a = raya();
  const orph = R.layerOrphans("bu", a.unitKeys, a.units, a.companyKeys, a.companies, a.units, a.functions);
  const none = a.unitKeys.filter(function (k) { return !a.units[k].company; });
  ok(orph.join(",") === none.join(",") && orph.length === 4,
     "Raya's four units with no division are the ones flagged", [orph, none]);
  const e = elabd();
  ok(R.layerOrphans("fn", e.functionKeys, e.functions, e.companyKeys, e.companies, e.units, e.functions).length === 0,
     "…and El Abd's functions, every one in a division, flag none");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
