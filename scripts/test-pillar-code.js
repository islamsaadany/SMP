/* ── A PILLAR'S CODE COMES FROM ITS KIND, AND NOBODY IS RENUMBERED (§538) ──
   Spec 066 stage 3b (b). Islam, 2026-10-15: *"the capability tab should stay
   as is and the coding is c001 to c005"*.

   A code is what people say out loud in a meeting and what is written on
   slides that are already out, so changing how one is derived is the most
   visible thing in the whole of stage 3b and the easiest to get wrong
   quietly. This check is therefore mostly about what did NOT change.

     1 · EVERY CODE IN THE WORKED EXAMPLE IS THE CODE IT WAS, compared string
         for string against the build before §538 — every pillar of every
         unit, every pillar of every function that plans in pillars, and the
         company's own. Both builds, one state.

     2 · AND A UNIT IS NOT RENUMBERED BY THE BACK DOOR. This is the assertion
         the rule was written around. Six of the ten units carry pillars
         marked Capability; a rule that numbered per KIND rather than per
         PREFIX would have turned MB03 into MB01 on a client that changed
         nothing. Asserted directly, not left to section 1 — a build that
         renumbered units AND a base that did the same would agree.

     3 · THE COMPANY CODES ITS TWO KINDS APART: directions numbered among the
         directions from D001, capabilities among the capabilities from C001,
         whatever order they are interleaved in.

     4 · AND THE §447 FOLD MINTS THE RIGHT ONE. It writes a code onto a row it
         creates; a capability folded onto the company plan must take a C.

     5 · THE PROOF OBLIGATION FOR (d), MEASURED NOW. El Abd's five
         capabilities read C001–C005 today, from `topCapCode` over the
         capabilities list. After the move they will read from `pillarCode`
         over the company's pillar list. This section builds both shapes side
         by side and asserts the two answers are the SAME FIVE STRINGS. If
         that ever stops being true, the data does not move.

   PROVED ABLE TO FAIL (§113.8), with what was counted:
     · numbering per KIND rather than per PREFIX, at a unit too  → 2 of 19 red
     · `pillarCapPrefix` left off `topAsUnit`                    → 5 of 19 red
     · the old positional rule restored at the company           → 5 of 19 red
     · the fold coding before the push, as it did                → 1 of 19 red

   THE FIRST OF THOSE WAS WRITTEN WRONG ONCE AND CAME BACK GREEN, which is
   worth the line: the break deleted the prefix guard INSIDE the company's
   branch, and a unit never reaches that branch — it returns at the guard
   above it. The break that matters is the one that changes what a UNIT does,
   and under it seven boxes renumber at once: MB03 becomes MB01, RS03 becomes
   RS01, and a supporting function's MRC03 goes with them. That is the output
   the rule exists to prevent, and it is red.

   Usage:
     node scripts/test-pillar-code.js
     node scripts/test-pillar-code.js --base <commit>
   No browser, no database, no network. */
"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
const args = process.argv.slice(2);
const baseArg = args.indexOf("--base");
/* The commit before §538 — the build whose codes this one must reproduce. */
const BASE = baseArg >= 0 ? args[baseArg + 1] : "1f05216";

let failed = 0, passed = 0;
function ok(cond, what, detail) {
  if (cond) { passed++; console.log("  ok    " + what); }
  else { failed++; console.log("  FAIL  " + what + (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

const readNow = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const readWas = function (f) {
  const rel = path.relative(ROOT, path.resolve(SRC, f)).split(path.sep).join("/");
  return execFileSync("git", ["show", BASE + ":" + rel], { cwd: ROOT, maxBuffer: 1 << 28 }).toString("utf8");
};
function clientAt(read, state) {
  const build = read("build.py");
  const files = [...build.match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                       .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((m) => m[1]);
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Intl, setTimeout });
  vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
  files.forEach(function (f) {
    const code = read(f);
    try { vm.runInContext(code, ctx, { filename: f }); } catch (e) { /* the files that reach for the page */ }
  });
  const run = (code) => vm.runInContext(code, ctx);
  if (run("typeof pillarCode") !== "function") throw new Error("the sources did not define pillarCode");
  ctx.__state = state;
  run(`(function(s){
    GROUP = s.group; UNIT_KEYS = s.unitKeys; UNITS = s.units;
    FUNCTION_KEYS = s.functionKeys; FUNCTIONS = s.functions;
    if (typeof fnPruneNulls === "function") (FUNCTION_KEYS || []).forEach(function (k) { fnPruneNulls(FUNCTIONS[k]); });
    COMPANY_KEYS = s.companyKeys || []; COMPANIES = s.companies || {};
    PEOPLE = s.people; UNIT_ROLES = s.unitRoles; ACCESS = s.access;
    LABELS.entries = s.labels; BANDS.bands = s.bands;
    KO_WEIGHTS = s.koWeights || {}; CYCLE = s.cycle; REVIEW = s.review;
    HISTORY = s.history; ARCHIVES = s.archives || [];
    PRIOR_CYCLE = s.priorCycle || { factors: [] };
    UNIT_KEYS.forEach(function (k) { UNITS[k].ukey = k; });
    syncWeights();
  })(__state)`);
  return run;
}
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));
const plain = () => JSON.parse(JSON.stringify(SEED));

/* El Abd's five, in the order its Capabilities tab lists them (§535.6). */
const ELABD_CAPS = ["End-to-End Quality Mindset", "ERP Enhancement", "Digital Transformation",
                    "Talent & Workforce Optimization", "Operational excellence"];
const ELABD_DIRS = ["Maximizing Current Stores", "Egypt Expansion", "Growing FMCG",
                    "Owning the Customer", "Winning on Cost"];

/* ── 1 · EVERY CODE IN THE WORKED EXAMPLE IS THE CODE IT WAS ────────────── */
console.log("1 · every code the product shows is unmoved against " + BASE);
{
  const ASK = `(function(){
    var out = {};
    UNIT_KEYS.forEach(function(k){
      out["unit:" + k] = (UNITS[k].items || []).map(function(p, i){ return pillarCode(UNITS[k], i); });
    });
    FUNCTION_KEYS.forEach(function(k){
      var f = FUNCTIONS[k];
      if (!f || String(f.format) !== "pillars") return;
      out["fn:" + k] = (f.items || []).map(function(p, i){ return pillarCode(fnAsUnit ? fnAsUnit(k) : f, i); });
    });
    var t = topAsUnit();
    out["(company)"] = (t.items || []).map(function(p, i){ return pillarCode(t, i); });
    /* And the code the NEXT row would take, which §447's fold asks for. */
    out["(next)"] = pillarCode(t, (t.items || []).length);
    return out; })()`;
  const a = clientAt(readNow, plain())(ASK), b = clientAt(readWas, plain())(ASK);
  const moves = Object.keys(b).filter(function (k) { return JSON.stringify(a[k]) !== JSON.stringify(b[k]); });
  ok(moves.length === 0, "unmoved across all " + Object.keys(b).length + " boxes",
     moves.map(function (k) { return [k, b[k], a[k]]; }));
  const n = Object.keys(a).reduce(function (t, k) { return t + (Array.isArray(a[k]) ? a[k].length : 0); }, 0);
  ok(n === 28, "and that is " + n + " codes, so the agreement is over content", n);
  /* BOTH ENDS (§94.2): the codes must not all be the empty string. */
  ok(Object.keys(a).every(function (k) {
       return !Array.isArray(a[k]) || a[k].every(function (c) { return /^[A-Z]+\d+$/.test(c); }); }),
     "and every one of them is a real code, not a blank", a);
}

/* ── 2 · A UNIT IS NOT RENUMBERED BY ITS KINDS ──────────────────────────── */
console.log("2 · a unit holding both kinds numbers across its whole list, as it always has");
{
  const run = clientAt(readNow, plain());
  const mixed = run(`UNIT_KEYS.filter(function(k){ var it = UNITS[k].items || [];
    return it.some(function(p){ return SMPRules.pillarIsCap(p); }) &&
           it.some(function(p){ return !SMPRules.pillarIsCap(p); }); })`);
  ok(mixed.length >= 2, "the worked example has " + mixed.length + " units carrying both kinds", mixed);
  const bad = [];
  mixed.forEach(function (k) {
    const got = run(`(UNITS[${JSON.stringify(k)}].items || []).map(function(p, i){
      return pillarCode(UNITS[${JSON.stringify(k)}], i); })`);
    const want = run(`(UNITS[${JSON.stringify(k)}].items || []).map(function(p, i){
      return (UNITS[${JSON.stringify(k)}].codePrefix || "") + String(i + 1).padStart(2, "0"); })`);
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push([k, want, got]);
  });
  ok(bad.length === 0, "every one of them runs 01, 02, 03… unbroken by the marks", bad);
  /* AND THE MARKS REALLY ARE INTERLEAVED, or the run above proves nothing. */
  const inter = run(`(function(){ var k = ${JSON.stringify(mixed[0])};
    var kinds = (UNITS[k].items || []).map(function(p){ return SMPRules.pillarIsCap(p) ? "C" : "D"; });
    return { kinds: kinds.join(""), mixedInside: /DC|CD/.test(kinds.join("")) }; })()`);
  ok(inter.mixedInside === true,
     "and the two kinds sit next to each other inside one of them (" + inter.kinds + ")", inter);
}

/* ── 3 · THE COMPANY CODES ITS TWO KINDS APART ──────────────────────────── */
console.log("3 · the company numbers directions among directions and capabilities among capabilities");
{
  const s = plain();
  s.group.structure = Object.assign({}, s.group.structure, { bu: { exists: false } });
  /* Deliberately interleaved, so a rule that only worked on a sorted list
     would show here rather than on El Abd's tidy one (§94.2). */
  s.group.items = [
    { id: "a", name: ELABD_DIRS[0], kind: "Direction",  measures: [], tactics: [] },
    { id: "b", name: ELABD_CAPS[0], kind: "Capability", measures: [], tactics: [] },
    { id: "c", name: ELABD_DIRS[1], kind: "Direction",  measures: [], tactics: [] },
    { id: "d", name: ELABD_DIRS[2], kind: "Direction",  measures: [], tactics: [] },
    { id: "e", name: ELABD_CAPS[1], kind: "Capability", measures: [], tactics: [] },
    { id: "f", name: "A pillar nobody marked",          measures: [], tactics: [] }
  ];
  const run = clientAt(readNow, s);
  const got = run(`(function(){ var t = topAsUnit();
    return t.items.map(function(p, i){ return pillarCode(t, i); }); })()`);
  ok(JSON.stringify(got) === JSON.stringify(["D001", "C001", "D002", "D003", "C002", "D004"]),
     "interleaved, the two runs count independently and in order", got);
  ok(got.filter(function (c) { return c[0] === "C"; }).length === 2 &&
     got.filter(function (c) { return c[0] === "D"; }).length === 4,
     "two capabilities and four directions, so neither run is empty", got);
  ok(run(`pillarCode(topAsUnit(), topAsUnit().items.length)`) === "D005",
     "and the code the next row would take continues the external run",
     run(`pillarCode(topAsUnit(), topAsUnit().items.length)`));
}

/* ── 4 · THE §447 FOLD MINTS THE CODE THE ROW DESERVES ──────────────────── */
console.log("4 · folding a unit onto the company plan codes each row by its own kind");
{
  const s = plain();
  s.group.items = [];
  const run = clientAt(readNow, s);
  const r = run(`(function(){
    var k = UNIT_KEYS.filter(function(x){ var it = UNITS[x].items || [];
      return it.some(function(p){ return SMPRules.pillarIsCap(p); }) &&
             it.some(function(p){ return !SMPRules.pillarIsCap(p); }); })[0];
    var kinds = (UNITS[k].items || []).map(function(p){ return SMPRules.pillarIsCap(p) ? "C" : "D"; });
    UNIT_KEYS.forEach(function(x){ if (x !== k) UNITS[x].items = []; });
    buFoldIntoTop();
    return { unit: k, kinds: kinds.join(""),
             stored: GROUP.items.map(function(p){ return p.code; }),
             shown: GROUP.items.map(function(p, i){ return pillarCode(topAsUnit(), i); }) }; })()`);
  ok((r.stored || []).length > 0, "the fold moved " + (r.stored || []).length + " rows", r);
  ok(JSON.stringify(r.stored) === JSON.stringify(r.shown),
     "each row's minted code is the code the page shows for it", r);
  const want = (function () {
    let d = 0, c = 0;
    return String(r.kinds || "").split("").map(function (x) {
      return x === "C" ? "C" + String(++c).padStart(3, "0") : "D" + String(++d).padStart(3, "0"); });
  })();
  ok(JSON.stringify(r.shown) === JSON.stringify(want),
     "and a folded capability takes a C, a folded direction a D", [want, r.shown]);
  ok(String(r.kinds || "").indexOf("C") >= 0 && String(r.kinds || "").indexOf("D") >= 0,
     "the folded unit really held both, so the line above is not one answer repeated", r.kinds);
}

/* ── 5 · THE PROOF OBLIGATION FOR (d), MEASURED NOW ─────────────────────── */
console.log("5 · El Abd's five read the same five strings before and after the move");
{
  const s = plain();
  s.group.structure = Object.assign({}, s.group.structure, { bu: { exists: false } });
  /* BEFORE: five directions in the pillar list, five capabilities in the
     capabilities list — the shape El Abd stores today. */
  s.group.items = ELABD_DIRS.map(function (n, i) {
    return { id: "d" + i, name: n, kind: "Direction", measures: [], tactics: [] }; });
  s.group.capabilities = ELABD_CAPS.map(function (n, i) {
    return { id: "cap" + i, name: n, def: "", fn: "", keyObjectives: [], projects: [] }; });
  const run = clientAt(readNow, s);
  const before = run(`(function(){ var t = topAsUnit();
    return { dirs: t.items.map(function(p, i){ return pillarCode(t, i); }),
             caps: GROUP.capabilities.map(topCapCode) }; })()`);
  ok(JSON.stringify(before.dirs) === JSON.stringify(["D001", "D002", "D003", "D004", "D005"]),
     "today its directions read D001–D005", before.dirs);
  ok(JSON.stringify(before.caps) === JSON.stringify(["C001", "C002", "C003", "C004", "C005"]),
     "and its capabilities read C001–C005", before.caps);
  /* AFTER: the five capabilities appended to the one pillar list, marked
     internal, the capabilities list emptied — stage 3b (d), in three lines. */
  const after = run(`(function(){
    GROUP.capabilities.forEach(function(c){
      GROUP.items.push({ id: c.id, name: c.name, kind: SMPRules.PILLAR_CAP,
                         measures: [], tactics: [] }); });
    GROUP.capabilities = [];
    var t = topAsUnit();
    var all = t.items.map(function(p, i){ return pillarCode(t, i); });
    return { dirs: all.slice(0, 5), caps: all.slice(5), names: t.items.map(function(p){ return p.name; }) }; })()`);
  ok(JSON.stringify(after.dirs) === JSON.stringify(before.dirs),
     "after the move its directions read the same five strings", [before.dirs, after.dirs]);
  ok(JSON.stringify(after.caps) === JSON.stringify(before.caps),
     "AND SO DO ITS CAPABILITIES — C001–C005, not D006–D010", [before.caps, after.caps]);
  ok(JSON.stringify(after.names.slice(5)) === JSON.stringify(ELABD_CAPS),
     "with each code still on the row whose name it was on", after.names);
  /* BOTH ENDS: the move really happened — ten rows in one list, none left in
     the old one — or the two answers above are about the same data twice. */
  ok(run(`[GROUP.items.length, GROUP.capabilities.length]`).join(",") === "10,0",
     "and the ten really are one list now, with the old one empty",
     run(`[GROUP.items.length, GROUP.capabilities.length]`));
}

console.log("");
console.log(failed === 0
  ? "PASS — " + passed + " agreements; the codes come from the kind and nobody is renumbered"
  : "FAIL — " + failed + " of " + (failed + passed));
process.exit(failed ? 1 : 0);
