/* ── STAGE 3b: EVERY CAPABILITY, AND EXACTLY WHAT IT BECOMES ───────────────
   Spec 066 stage 3 is the only stage that moves data, and the promise made
   with it is that Islam sees the row-by-row list for each client BEFORE
   anything runs. This prints that list. It MOVES NOTHING and writes nothing:
   it loads the platform's own sources in a vm, hydrates a tenant, and reports.

   WHY A CAPABILITY BECOMES ONE PILLAR, decided and not invented here (§535.5):
   §488.1 records Islam's own sentence — *"a capability planning in a pillar
   approach is typical to a direction"* — and `topCapBody` acts on it: a
   capability planned in pillars is drawn by the DIRECTIONS pane's own body
   over `items[0]`, with the comment *"the capability's one pillar row carries
   them"*. So such a capability is already one pillar wearing a container's
   record, and the move is one-to-one.

   THE TWO THINGS THAT ARE NOT ONE-TO-ONE, and both are REPORTED rather than
   decided here:
     · a capability planned in PROJECTS — it becomes one internal pillar whose
       work is those projects (§7.1's "a pillar's work may be tactics or
       projects"), so its projects are listed, not silently folded;
     · a capability carrying MORE THAN ONE pillar row — the product already
       draws the first and prints "holds N plans from before", so the extra
       rows are already legacy and already hidden. They are named here, loudly,
       because the one thing a migration must never do is drop a row nobody was
       told about.

   Usage:
     node scripts/stage3-capability-readings.js                      # the worked example
     node scripts/stage3-capability-readings.js <working-copy.html>  # a client
     node scripts/stage3-capability-readings.js <file> --json

   A working copy is the file Setup › Reporting cycle › Contingency files hands
   out (§306): the platform with the tenant's graph in a
   <script type="application/json" id="smp-offline"> block — the same shape
   /api/state answers, so it hydrates exactly as the server's does. That is how
   a client this repository does not hold gets measured.

   No browser, no database, no network. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const input = args.find((a) => !a.startsWith("--"));

/* ── the platform, loaded as scripts/stage1-readings.js loads it ───────── */
const BUILD = fs.readFileSync(path.join(SRC, "build.py"), "utf8");
const FILES = [...BUILD.match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                     .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((m) => m[1]);
const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Intl, setTimeout });
vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
const threw = [];
FILES.forEach((f) => {
  /* Reading is outside the try and running inside it, as every loader here
     does: a file that cannot be READ is a failure of this script, while the
     files that reach for the page at load throw and define nothing it asks
     for (§54.5). */
  const code = fs.readFileSync(path.join(SRC, f), "utf8");
  try { vm.runInContext(code, ctx, { filename: f }); } catch (e) { threw.push(path.basename(f)); }
});
const run = (code) => vm.runInContext(code, ctx);
["capAsUnit", "capPlansInPillars", "capItems", "itemsNow"].forEach(function (n) {
  if (run("typeof " + n) !== "function") {
    console.error("The sources did not define " + n + " (" + threw.join(", ") + ") — nothing measured.");
    process.exit(2);
  }
});

/* ── the tenant ───────────────────────────────────────────────────────── */
let state, source;
if (input) {
  const html = fs.readFileSync(input, "utf8");
  const m = html.match(/<script type="application\/json" id="smp-offline">([\s\S]*?)<\/script>/);
  if (!m) { console.error(input + " holds no smp-offline block — is it a working copy?"); process.exit(2); }
  state = JSON.parse(m[1]);
  source = path.basename(input);
} else {
  state = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));
  source = "the worked example (db/seed-state.json)";
}
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

/* ── what is read ─────────────────────────────────────────────────────────
   Everything is asked of the PLATFORM's own readers, never re-derived here:
   `capPlansInPillars` for the shape, `capItems` for the rows, `topCapCode`
   for the code the rail prints, `capAtTop` and `buExists` for where the
   capabilities live. A second opinion about any of these is how a migration
   comes to move something the product never showed (§42). */
const READ = String.raw`(function(){
  function nameOf(k){ var p = (PEOPLE || []).filter(function(x){ return x.key === k || x.name === k; })[0];
    return p ? p.name : (k || null); }
  var caps = (GROUP.capabilities || []).map(function(c, i){
    var pillars = capPlansInPillars(c);
    var items = pillars ? capItems(c) : [];
    var first = items[0] || null;
    return {
      id: c.id,
      code: typeof topCapCode === "function" ? topCapCode(c) : ("C" + String(i + 1).padStart(3, "0")),
      name: c.name || "",
      def: c.def || "",
      heldBy: c.fn || null,
      heldByName: c.fn && FUNCTIONS[c.fn] ? FUNCTIONS[c.fn].name : null,
      owner: nameOf(c.head), custodian: nameOf(c.custodian),
      plansIn: pillars ? "pillars" : "projects",
      keyObjectives: (c.keyObjectives || []).length,
      pillarRows: items.length,
      extraRows: pillars && items.length > 1 ? items.slice(1).map(function(x){
        return { id: x.id, name: x.name || "",
                 measures: (x.measures || []).length, tactics: (x.tactics || []).length }; }) : [],
      becomes: pillars && first
        ? { from: "its one pillar row", rowId: first.id, name: c.name || first.name || "",
            measures: (first.measures || []).length, tactics: (first.tactics || []).length }
        : pillars
          ? { from: "nothing — it has no plan yet", rowId: null, name: c.name || "", measures: 0, tactics: 0 }
          : { from: "its projects", rowId: null, name: c.name || "",
              projects: (c.projects || []).map(function(p){ return {
                id: p.id, name: p.name || "",
                deliverables: (p.deliverables || []).length,
                outcomes: (p.outcomes || []).length,
                milestones: (p.milestones || []).length }; }) }
    };
  });
  return {
    org: GROUP.org || "",
    word: { pillar: L1("pillar"), capability: L1("capability") },
    buExists: SMPRules.buExists(GROUP),
    capAtTop: SMPRules.capAtTop(GROUP),
    capExists: SMPRules.capExists(GROUP),
    topPillars: (Array.isArray(GROUP.items) ? GROUP.items : []).map(function(p){
      return { id: p.id, name: p.name || "", kind: p.kind || "",
               measures: (p.measures || []).length, tactics: (p.tactics || []).length }; }),
    capabilities: caps
  };
})()`;

let R;
try { R = JSON.parse(run("JSON.stringify(" + READ + ")")); }
catch (e) { console.error("could not read the tenant: " + e.message); process.exit(2); }

if (asJson) { console.log(JSON.stringify({ source: source, reading: R }, null, 2)); process.exit(0); }

/* ── the list ─────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s === null || s === undefined ? "—" : s).padEnd(n);
console.log("STAGE 3b · what each " + R.word.capability.toLowerCase() + " becomes");
console.log("source: " + source + (R.org ? "   client: " + R.org : ""));
console.log("");
console.log("the tree:  business units " + (R.buExists ? "exist" : "are OFF") +
            "   ·   a " + R.word.capability.toLowerCase() + " lives " + (R.capAtTop ? "at the company" : "as a layer of its own") +
            "   ·   the word for a pillar here is “" + R.word.pillar + "”");
console.log("the company's own pillars today: " + R.topPillars.length +
            (R.topPillars.length ? "  (" + R.topPillars.filter(p => p.kind === "Capability").length + " already marked internal)" : ""));
console.log("");

if (!R.capabilities.length) {
  console.log("No " + R.word.capability.toLowerCase() + " in this client. NOTHING MOVES.");
  process.exit(0);
}

console.log(pad("CODE", 7) + pad("NAME", 34) + pad("HELD BY", 16) + pad("PLANS IN", 10) + pad("OWNER", 20) + "BECOMES");
console.log("-".repeat(118));
R.capabilities.forEach(function (c) {
  const b = c.becomes;
  const tail = c.plansIn === "pillars"
    ? (b.rowId ? "one internal pillar — " + b.measures + " measures, " + b.tactics + " tactics"
               : "one internal pillar, EMPTY (no plan yet)")
    : "one internal pillar whose work is " + (b.projects || []).length + " project(s)";
  console.log(pad(c.code, 7) + pad(c.name.slice(0, 32), 34) + pad(c.heldByName || "— unassigned —", 16) +
              pad(c.plansIn, 10) + pad(c.owner, 20) + tail);
});
console.log("");

/* Everything that is NOT a plain one-to-one, named in full. */
const projectOnes = R.capabilities.filter((c) => c.plansIn === "projects");
const extras = R.capabilities.filter((c) => c.extraRows.length);
const empties = R.capabilities.filter((c) => c.plansIn === "pillars" && !c.becomes.rowId);
const held = R.capabilities.filter((c) => c.heldBy);

console.log("WHAT IS NOT A PLAIN ONE-TO-ONE");
if (!projectOnes.length && !extras.length && !empties.length) {
  console.log("  nothing — every " + R.word.capability.toLowerCase() + " here is one pillar already, and moves as one row.");
} else {
  projectOnes.forEach(function (c) {
    console.log("  " + c.code + " " + c.name + " plans in PROJECTS, so its work moves as projects under the new pillar:");
    (c.becomes.projects || []).forEach(function (p) {
      console.log("      · " + p.name + "  (" + p.deliverables + " deliverables, " + p.outcomes +
                  " outcomes, " + p.milestones + " milestones)");
    });
    if (!(c.becomes.projects || []).length) console.log("      · (no projects — the pillar arrives empty)");
  });
  empties.forEach(function (c) {
    console.log("  " + c.code + " " + c.name + " has NO plan yet — it becomes an empty internal pillar, nothing is lost.");
  });
  extras.forEach(function (c) {
    console.log("  " + c.code + " " + c.name + " carries " + (c.extraRows.length + 1) + " pillar rows. The product already");
    console.log("      shows the first and calls the rest “plans from before”. These are the hidden ones:");
    c.extraRows.forEach(function (x) {
      console.log("      · " + (x.name || "(unnamed)") + "  (" + x.measures + " measures, " + x.tactics +
                  " tactics)   id " + x.id);
    });
    console.log("      DECIDE before running: carry them across as pillars of their own, or leave them stored and hidden.");
  });
}
console.log("");

console.log("OWNERSHIP, which does not decide placement (§535)");
if (!held.length) {
  console.log("  no " + R.word.capability.toLowerCase() + " here names a function at all — every one is already the company's,");
  console.log("  which is the model this stage is moving toward. Nothing to re-point.");
} else {
  held.forEach(function (c) {
    console.log("  " + c.code + " " + c.name + " is held by " + c.heldByName +
                " — that link becomes plain ownership and stops deciding where it lives.");
  });
}
console.log("");
console.log("Ids are kept on every row above, so every figure, snapshot and history entry still points");
console.log("at the same row after the move. Nothing here has been changed — this script only reads.");
