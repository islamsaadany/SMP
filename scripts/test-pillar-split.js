/* ── ONE PILLAR LIST, SHOWN AS ONE OR AS TWO — AND NOBODY MOVED (§537) ────
   Spec 066 stage 3b (a). A box gains one setting: does it draw its pillars as
   one list, or with the internal ones — the capabilities — on a tab of their
   own. Islam's requirement for the whole of stage 3b is *"ok noting that
   nothing will change for the users this is just a structural change"*, so
   this check has two halves and the first is the larger:

     1 · ABSENT IS TODAY. Every box in every client is unset, so the list each
         page draws must be byte for byte the list the build before this one
         drew. Asked of BOTH BUILDS over the worked example, through the one
         function every draw site already goes through (`partItems`), for all
         ten units and the company, with the half eye off and on.

     2 · AND SET, IT PARTITIONS. On a state this file MAKES — a box marked
         apart, holding both kinds — the two halves must between them hold
         every pillar, each exactly once, in the order the list stores them.
         A partition is the whole claim: a filter that answered "everything"
         or "nothing" would satisfy either half alone, so neither is asserted
         on its own (§94.2).

   WHY THE WORKED EXAMPLE IS ENOUGH FOR THE UNIT HALF AND NOT THE COMPANY'S.
   Its ten units already carry both kinds — 18 marked Direction and 7 marked
   Capability — which is Raya's shape, so the unit case is measured on real
   stored data rather than on a fixture. Its COMPANY holds no pillars at all
   (`group.items` is empty), so El Abd's shape — the one that matters, the one
   the whole setting exists for — has to be made, and it is, with its five
   capabilities as internal pillars of the company's own list.

   PROVED ABLE TO FAIL (§113.8), and the numbers below are what was actually
   counted rather than what was expected. Seven deliberate breaks:
     · `pillarIsCap` always true                          → 7 of 35 red
     · `pillarIsCap` always false                         → 8 of 35 red
     · `halfFilter` ignoring the setting                  → 1 of 35 red
     · `pillarsSplit` reading `!== false` not `=== true`  → 3 of 35 red
     · `partFilter` returning the half instead of composing → 2 of 35 red
     · `drawHalf` clearing instead of restoring           → 2 of 35 red
     · `boxHasHalf` ignoring the setting                  → 1 of 35 red

   AND THE SEVENTH IS WHY THIS PARAGRAPH IS HERE. On the first run of these
   breaks it came back GREEN — every assertion passed over a build in which
   every Raya unit carrying a pillar marked Capability would have grown a
   second Plan tab overnight, which is precisely the one thing Islam said
   must not happen. The file had measured what the SETTING does and never
   asked what it does to a box that was never set. The last two assertions of
   section 1 are that question, and they were written from the break.

   Usage:
     node scripts/test-pillar-split.js
     node scripts/test-pillar-split.js --base <commit>
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
/* The commit before §537 — the build whose drawn lists this one must reproduce. */
const BASE = baseArg >= 0 ? args[baseArg + 1] : "2158aab";

let failed = 0, passed = 0;
function ok(cond, what, detail) {
  if (cond) { passed++; console.log("  ok    " + what); }
  else { failed++; console.log("  FAIL  " + what + (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

/* ── the vm, as scripts/test-box-ref.js §4 builds it ──────────────────────
   config-data.js is inlined into the page by build.py rather than exported,
   so both builds are loaded by running build.py's own file list in a context.
   The list is READ from build.py so that a file added there arrives here the
   same day (§53.5). */
const readNow = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
/* §54.5: build.py lists the shared files as "../../lib/rules.js", relative to
   src, and git has no notion of `..` inside a path — so the path is resolved
   against the repository root and made repo-relative before git is asked. */
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
    /* Reading outside the try and running inside it: a file that cannot be
       READ is a failure of this check, while the files that reach for the
       page at load throw and define nothing this check asks for. */
    const code = read(f);
    try { vm.runInContext(code, ctx, { filename: f }); } catch (e) { /* see above */ }
  });
  const run = (code) => vm.runInContext(code, ctx);
  if (run("typeof partItems") !== "function") throw new Error("the sources did not define partItems");
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

/* ── THE EL ABD SHAPE, MADE HERE ──────────────────────────────────────────
   Its company plans in pillars with the business-unit layer off, and after
   stage 3b (d) its five capabilities are five pillars of that list marked
   Capability. That is the state the setting exists for, so it is the state
   it is measured on — made here rather than read from a client file, so the
   check runs for anybody with the repository (§94.2). */
function elAbdish() {
  const s = plain();
  s.group.structure = s.group.structure || {};
  s.group.structure.bu = { exists: false };
  s.group.items = [
    { id: "d1", name: "Maximizing Current Stores", kind: "Direction", measures: [], tactics: [] },
    { id: "d2", name: "Egypt Expansion", kind: "Direction", measures: [], tactics: [] },
    { id: "d3", name: "Growing FMCG", kind: "Direction", measures: [], tactics: [] },
    { id: "c1", name: "End-to-End Quality Mindset", kind: "Capability", measures: [], tactics: [] },
    { id: "c2", name: "ERP Enhancement", kind: "Capability", measures: [], tactics: [] },
    /* An unsaid kind, because `addPillar` mints `kind: ""` and most stored
       pillars carry nothing — the half it lands in is the claim (§488). */
    { id: "x1", name: "A pillar nobody marked", measures: [], tactics: [] }
  ];
  return s;
}

/* ── 1 · UNSET, THE DRAWN LIST IS THE LIST IT WAS ───────────────────────── */
console.log("1 · with the setting absent, every box draws what it drew at " + BASE);
{
  const now = clientAt(readNow, plain());
  const was = clientAt(readWas, plain());
  /* `partItems` is the one function every pillar rail, count and pane goes
     through, so holding IT to the base holds all of them (§53.5). The names
     are compared rather than the objects: two vm contexts hold two different
     object graphs and only the content is the question. */
  const askAll = `(function(){
    var out = {};
    UNIT_KEYS.forEach(function(k){
      out[k] = partItems(UNITS[k]).map(function(p){ return p.id || p.name; });
    });
    out["(company)"] = partItems(topAsUnit()).map(function(p){ return p.id || p.name; });
    return out;
  })()`;
  const a = now(askAll), b = was(askAll);
  const moves = Object.keys(b).filter(function (k) {
    return JSON.stringify(a[k]) !== JSON.stringify(b[k]); });
  ok(moves.length === 0, "the drawn pillar list is unmoved for all " +
     Object.keys(b).length + " boxes", moves.map(function (k) { return [k, b[k], a[k]]; }));
  /* BOTH ENDS (§94.2): an agreement over empty lists is not an agreement. */
  const drawn = Object.keys(a).reduce(function (n, k) { return n + a[k].length; }, 0);
  ok(drawn === 25, "and those lists hold 25 pillars between them, so the agreement is over content", drawn);
  /* AND THE WORKED EXAMPLE REALLY HOLDS BOTH KINDS, or section 2's partition
     would be measured on a list that is all one thing. */
  const kinds = now(`(function(){
    var n = { cap: 0, other: 0 };
    UNIT_KEYS.forEach(function(k){ (UNITS[k].items || []).forEach(function(p){
      n[SMPRules.pillarIsCap(p) ? "cap" : "other"]++; }); });
    return n; })()`);
  ok(kinds.cap === 7 && kinds.other === 18,
     "and its units carry both kinds — 7 marked Capability, 18 not", kinds);
  /* The same question with the half eye ON, because §517's filter is the one
     this change composes with and a composition can break only one side. */
  const askNarrowed = `(function(){
    GROUP.dirScope = "part";
    var out = {};
    UNIT_KEYS.forEach(function(k){ out[k] = partItems(UNITS[k]).length; });
    out["(company)"] = partItems(topAsUnit()).length;
    delete GROUP.dirScope;
    return out; })()`;
  const na = now(askNarrowed), nb = was(askNarrowed);
  ok(JSON.stringify(na) === JSON.stringify(nb),
     "and unmoved again with the half eye on", [nb, na]);
  /* ── AND NO BOX GROWS A SECOND TAB (§45.2, and the whole requirement) ───
     The tab asks `boxHasHalf`, and this is the assertion that holds it to the
     SETTING rather than to the content. Seven of the worked example's pillars
     are marked Capability, spread over its units, so a `boxHasHalf` that
     asked only *does it hold one* would put a second Plan tab on every unit
     that carries one — which is Raya, today, and is exactly the change Islam
     said must not happen. Found by breaking it: with the setting test taken
     out of `boxHasHalf`, every other assertion in this file still passed. */
  const tabs = now(`(function(){
    var out = { would: [], does: [] };
    UNIT_KEYS.forEach(function(k){
      if ((UNITS[k].items || []).some(function(p){ return SMPRules.pillarIsCap(p); })) out.would.push(k);
      if (boxHasHalf(UNITS[k], "cap")) out.does.push(k);
    });
    return out; })()`);
  ok(tabs.would.length > 0,
     "the worked example has " + tabs.would.length + " units holding an internal pillar", tabs.would);
  ok(tabs.does.length === 0,
     "and not one of them is offered a second tab, because not one is set apart", tabs.does);
}

/* ── 2 · SET, IT PARTITIONS THE LIST ─────────────────────────────────────── */
console.log("2 · set apart, the two halves are a partition of the one list");
{
  const run = clientAt(readNow, elAbdish());
  const whole = run(`topAsUnit().items.map(function(p){ return p.id; })`);
  ok(whole.length === 6, "the made company holds six pillars", whole);
  /* UNSET FIRST. The setting is what splits; the kinds alone must not. */
  const joined = run(`[drawHalf("dir", function(){ return partItems(topAsUnit()).map(function(p){ return p.id; }); }),
                       drawHalf("cap", function(){ return partItems(topAsUnit()).map(function(p){ return p.id; }); })]`);
  ok(JSON.stringify(joined[0]) === JSON.stringify(whole) &&
     JSON.stringify(joined[1]) === JSON.stringify(whole),
     "unset, both halves draw the whole list — the kinds alone split nothing", joined);
  /* Now set it, the way the Structure step does. */
  run(`GROUP.structure.top = GROUP.structure.top || {};
       GROUP.structure.top.plan = GROUP.structure.top.plan || {};
       GROUP.structure.top.plan.split = true;`);
  ok(run(`SMPRules.pillarsSplit(topAsUnit())`) === true,
     "the company reads as shown apart once the Structure step says so");
  const ext = run(`drawHalf("dir", function(){ return partItems(topAsUnit()).map(function(p){ return p.id; }); })`);
  const int = run(`drawHalf("cap", function(){ return partItems(topAsUnit()).map(function(p){ return p.id; }); })`);
  ok(ext.length > 0 && int.length > 0,
     "both halves hold something, so neither assertion below is vacuous", [ext, int]);
  ok(JSON.stringify(int) === JSON.stringify(["c1", "c2"]),
     "the internal half is exactly the pillars marked Capability", int);
  ok(JSON.stringify(ext) === JSON.stringify(["d1", "d2", "d3", "x1"]),
     "the external half is everything else, the unmarked pillar with it", ext);
  /* THE PARTITION ITSELF, computed from the two answers rather than restated:
     every pillar in exactly one half, and the halves in the stored order. */
  const together = ext.concat(int).slice().sort();
  ok(JSON.stringify(together) === JSON.stringify(whole.slice().sort()),
     "between them the halves hold every pillar, none twice", [whole, ext, int]);
  ok(JSON.stringify(ext) === JSON.stringify(whole.filter(function (id) { return ext.indexOf(id) >= 0; })) &&
     JSON.stringify(int) === JSON.stringify(whole.filter(function (id) { return int.indexOf(id) >= 0; })),
     "and each half keeps the order the one list stores");
  /* THE TAB APPEARS ONLY WHERE THERE IS SOMETHING IN IT (§45.2). */
  ok(run(`boxHasHalf(topAsUnit(), "cap")`) === true,
     "the internal tab is offered while the company holds an internal pillar");
  run(`GROUP.items = GROUP.items.filter(function(p){ return !SMPRules.pillarIsCap(p); });`);
  ok(run(`boxHasHalf(topAsUnit(), "cap")`) === false,
     "and withdrawn the moment it holds none, so no box grows an empty tab");
  ok(run(`SMPRules.pillarsSplit(topAsUnit())`) === true,
     "though the setting itself is untouched — the tab is about content, not about the switch");
}

/* ── 3 · THE SETTING IS AN ABSENCE, AND A ROUND TRIP LEAVES NO TRACE ─────── */
console.log("3 · absent is one list, and setting it back leaves the box as it was");
{
  const R = require(path.join(ROOT, "lib", "rules.js"));
  ok(R.pillarsSplit({}) === false, "a box that was never asked reads as one list");
  ok(R.pillarsSplit({ pillarSplit: false }) === false, "and so does one storing false");
  ok(R.pillarsSplit({ pillarSplit: "split" }) === false,
     "and a word where a boolean belongs is not a yes — only `true` is");
  ok(R.topSplit({}) === false && R.topSplit({ structure: { top: {} } }) === false &&
     R.topSplit({ structure: { top: { plan: {} } } }) === false,
     "the company reads as one list at every depth the structure may be missing");
  ok(R.topSplit({ structure: { top: { plan: { split: true } } } }) === true,
     "and as apart only where the Structure step wrote it");
  /* The round trip, as the two controls perform it: set, then unset. */
  const u = { ukey: "mobile", name: "Mobile", items: [] };
  const before = JSON.stringify(u);
  u[R.PILLAR_SPLIT] = true;
  ok(R.pillarsSplit(u) === true, "setting it on the box takes effect");
  delete u[R.PILLAR_SPLIT];
  ok(JSON.stringify(u) === before,
     "and unsetting it leaves the box byte for byte what it was — an absence, never a false", u);
}

/* ── 4 · IT COMPOSES WITH THE HALF EYE RATHER THAN REPLACING IT ──────────
   §517's half eye narrows a part owner to the parts that are theirs; §537
   narrows a tab to one kind. They are independent questions and a change that
   made one replace the other would pass every other section of this file, so
   the person below is MADE rather than looked for: a direction owner who also
   owns a capability and holds nothing else, which is what §533's rule means
   by a part owner. The check asserts that they ARE one before it asks what
   they see — an escape hatch here would be an assertion that never runs. */
console.log("4 · a narrowed part owner on a split company sees their own part OF THAT HALF");
{
  const s = elAbdish();
  s.group.structure.top = { plan: { split: true } };
  s.group.dirScope = "part";
  /* Named on one direction and one capability, attached to nothing, no seat. */
  const mine = { key: "amr", name: "Amr Hassan", title: "Head of Expansion", unit: null };
  s.people = s.people.concat([mine]);
  s.group.items[1].owner = mine.name;          /* d2, external */
  s.group.items[4].owner = mine.name;          /* c2, internal */
  const run = clientAt(readNow, s);
  run(`VIEWER = ${JSON.stringify(mine.key)};`);
  const roles = run(`personRoles(viewer()).map(function(r){ return r.role; }).sort()`);
  ok(JSON.stringify(roles) === JSON.stringify(["dirowner"]),
     "the made person holds one part role and nothing else, so the half eye reaches them", roles);
  ok(run(`partOnly()`) === true, "and the half eye is on for them");
  const ext = run(`drawHalf("dir", function(){ return partItems(topAsUnit()).map(function(p){ return p.id; }); })`);
  const int = run(`drawHalf("cap", function(){ return partItems(topAsUnit()).map(function(p){ return p.id; }); })`);
  ok(JSON.stringify(ext) === JSON.stringify(["d2"]),
     "the external tab holds their direction and no other", ext);
  ok(JSON.stringify(int) === JSON.stringify(["c2"]),
     "the internal tab holds their capability and no other", int);
  /* BOTH ENDS (§94.2): the company holds four external and two internal
     pillars, so neither answer above could have come from a filter that
     dropped one side wholesale. */
  ok(run(`topAsUnit().items.length`) === 6,
     "out of a list of six, which is what makes those two answers narrow");
  /* And the office, who is narrowed by neither, still sees both halves whole. */
  run(`VIEWER = PEOPLE.filter(function(p){ return p.role === "super"; })[0].key;`);
  ok(run(`partOnly()`) === false, "the office is not narrowed");
  const oe = run(`drawHalf("dir", function(){ return partItems(topAsUnit()).length; })`);
  const oi = run(`drawHalf("cap", function(){ return partItems(topAsUnit()).length; })`);
  ok(oe === 4 && oi === 2, "and reads four external and two internal", [oe, oi]);
}

/* ── 5 · THE HALF IS PUT BACK, WHATEVER THE RENDERER DOES ────────────────── */
console.log("5 · drawHalf restores what it found, so no page is drawn half-hidden");
{
  const run = clientAt(readNow, elAbdish());
  run(`GROUP.structure.top = { plan: { split: true } };`);
  const after = run(`(function(){
    var seen = drawHalf("cap", function(){ return PILLAR_HALF; });
    var left = PILLAR_HALF;
    var threw = "";
    try { drawHalf("cap", function(){ throw new Error("the renderer blew up"); }); }
    catch (e) { threw = e.message; }
    return [seen, left, PILLAR_HALF, threw];
  })()`);
  ok(after[0] === "cap", "the renderer runs inside the half it was given", after);
  ok(after[1] === "", "and the half is cleared the moment it returns", after);
  ok(after[2] === "" && after[3] === "the renderer blew up",
     "and cleared even when the renderer throws — the error travels, the half does not", after);
  /* Nested, because the company's Capabilities tab draws a renderer that
     itself asks for a list: an inner half must not leak into the outer one. */
  const nested = run(`drawHalf("dir", function(){
    var inner = drawHalf("cap", function(){ return PILLAR_HALF; });
    return [inner, PILLAR_HALF]; })`);
  ok(JSON.stringify(nested) === JSON.stringify(["cap", "dir"]),
     "and an inner half is put back to the outer one, not to nothing", nested);
}

console.log("");
console.log(failed === 0
  ? "PASS — " + passed + " agreements; the setting splits what it is told to and nothing else"
  : "FAIL — " + failed + " of " + (failed + passed));
process.exit(failed ? 1 : 0);
