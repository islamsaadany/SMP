/* ── STAGE 1: EVERY HEADLINE NUMBER, TODAY AND UNDER ONE SET OF RULES ──
   §515.2: THE SIX RULES ARE NOW BUILT INTO THE PRODUCT, so against the
   current sources this reports "0 number(s) move" — which is the point of
   running it now: the built rules and the overrides below are asked the same
   questions and give the same answers on the worked example (Finance's
   execution 84, HR's 90, Merchandising's headline 93, exactly §515.1's
   "after"). Run from a checkout of the commit before §515.2 it still prints
   the sixteen moves.

   Spec 066 §8, stage 1: "Before/after headline numbers for every client,
   shown to Islam BEFORE anything ships." This prints them. It changes no
   product code: the proposed rules are installed as overrides INSIDE a vm that
   runs the platform's own sources, so "before" is the product exactly as it is
   and "after" is the product with only the proposed rules swapped in.

   Usage:
     node scripts/stage1-readings.js                      # the worked example (db/seed-state.json)
     node scripts/stage1-readings.js <working-copy.html>  # a client's contingency working copy
     node scripts/stage1-readings.js <file> --json        # the same, as JSON

   A working copy is the file Setup › Reporting cycle › Contingency files hands
   out (§306): the platform with the tenant's graph in a
   <script type="application/json" id="smp-offline"> block. That graph is the
   same shape /api/state answers, so it hydrates exactly as the server's does.

   THE PROPOSALS (spec 066 §4), each one switchable so its effect can be read
   on its own:
     P1  one weight rule      — a capability's / function's objectives use the
                                unit's rule: a blank weight is the average of
                                the weights that were set; hidden rows excluded.
     P2  one Execution        — milestones and actions count only once their
                                date has come, as tactics already do.
     P3  one roll-up          — the group's and a division's execution is the
                                weighted average of the figures their units show.
     P4  one headline         — a function's headline is its objectives when
                                its plan HAS objectives (shown and switched
                                on), reading "not yet" until they are
                                reported; with none, or switched off, it is its
                                pillars' or projects' figure. Today a pillars
                                function with none reads "—" (§437 covers only
                                "switched off"), and a projects function with
                                objectives not yet reported quietly reads its
                                projects instead (§119.1's fallback, applied
                                one state too wide).
     P5  deck = page          — the deck reads a unit's objectives the way its
                                page does.
     P6  Focus board          — a yes/no measure reads its answer, not
                                "Not reported".
   Row scores (measureScore) are NEVER touched, and that is asserted. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const input = args.find((a) => !a.startsWith("--"));

/* ── the platform, loaded the way test-my-reporting.js loads it ─────── */
const BUILD = fs.readFileSync(path.join(SRC, "build.py"), "utf8");
const FILES = [...BUILD.match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                     .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((m) => m[1]);
const ctx = vm.createContext({ console, JSON, Math, Date, Intl, setTimeout });
vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
const threw = [];
FILES.forEach((f) => {
  try { vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, { filename: f }); }
  catch (e) { threw.push(path.basename(f)); }
});
const run = (code) => vm.runInContext(code, ctx);
if (run("typeof koScore") !== "function" || run("typeof fnMemberScores") !== "function") {
  console.error("The scoring sources did not load (" + threw.join(", ") + ") — nothing measured.");
  process.exit(2);
}

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
/* sync.js's hydrate(), as smp-app/lib/frozen.cjs carries it (§53.5). */
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

/* ── what is read: every number a headline, a card or a roll-up prints ── */
const READ = String.raw`(function(){
  function safe(f){ try { var v = f(); return v == null || (typeof v === "number" && isNaN(v)) ? null : v; } catch (e) { return "ERR " + e.message; } }
  var out = { units: [], functions: [], capabilities: [], companies: [], group: {}, focus: {}, rows: {} };
  var keys = typeof activeKeys === "function" ? activeKeys() : UNIT_KEYS;
  keys.forEach(function(k){
    var u = UNITS[k]; if (!u) return;
    var fmt = safe(function(){ return unitFormat(u); });
    var r = { key: k, name: u.name, format: fmt,
      objectives: safe(function(){ return unitObjectives(u); }),
      pillars:    safe(function(){ return unitPillars(u); }),
      delivered:  safe(function(){ return unitExec(u); }),
      planned:    safe(function(){ return unitPlan(u); }),
      execution:  safe(function(){ return unitRatio(u); }) };
    var h = safe(function(){ return unitOwnHolder(k); });
    if (h && typeof h === "object") {
      r.deckObjectives = safe(function(){ return __deckKO(h); });
      r.pageObjectives = safe(function(){ return holderKOScore(h); });
    }
    out.units.push(r);
  });
  (FUNCTION_KEYS || []).forEach(function(fk){
    var f = FUNCTIONS[fk]; if (!f || f.active === false) return;
    var fmt = safe(function(){ return fnFormat(f); });
    var ms = safe(function(){ return fnMemberScores(fk); }) || {};
    var r = { key: fk, name: f.name, format: fmt, company: safe(function(){ return fnCompanyOf(fk); }),
      headline: ms.perf == null ? null : ms.perf, execution: ms.exec == null ? null : ms.exec };
    if (fmt === "pillars") {
      var uu = safe(function(){ return unitLike("fn:" + fk); });
      if (uu && typeof uu === "object") {
        r.objectives = safe(function(){ return unitObjectives(uu); });
        r.pillars = safe(function(){ return unitPillars(uu); });
      }
    } else if (fmt === "objectives") {
      r.objectives = safe(function(){ return fnObjScore(fk); });
      r.actions = safe(function(){ return fnActionsTally(fk).pct; });
    } else {
      var hh = safe(function(){ return fnHolders(fk)[0]; });
      if (hh && typeof hh === "object") {
        r.objectives = safe(function(){ return capKOScore(hh); });
        r.projects = safe(function(){ return capPerf(hh); });
        r.milestones = safe(function(){ return capExec(hh).pct; });
        r.deckObjectives = safe(function(){ return __deckKO(hh); });
      }
    }
    out.functions.push(r);
  });
  (GROUP.capabilities || []).forEach(function(c){
    if (!c || c.own) return;
    out.capabilities.push({ key: c.id, name: c.name, fn: c.fn,
      objectives: safe(function(){ return capKOScore(c); }),
      projects:   safe(function(){ return capPerf(c); }),
      execution:  safe(function(){ return capExec(c).pct; }),
      deckObjectives: safe(function(){ return __deckKO(c); }) });
  });
  (COMPANY_KEYS || []).forEach(function(ck){
    var co = COMPANIES[ck]; if (!co) return;
    out.companies.push({ key: ck, name: co.name,
      objectives: safe(function(){ return companyObjectives(ck); }),
      delivered:  safe(function(){ return companyExec(ck); }),
      planned:    safe(function(){ return companyPlan(ck); }),
      execution:  safe(function(){ return companyRatio(ck); }) });
  });
  /* The company's own plan (§428, §447, §466): drawn beside the units, or as
     the headline when the units are off (El Abd). Read the way topPlanCard
     reads it. */
  if (safe(function(){ return topHasPlan() && planOn("group"); }) === true) {
    var way = safe(function(){ return topWay(); });
    if (way === "projects") {
      var th = safe(function(){ return unitOwnHolder("group"); });
      out.top = { name: "own plan (projects)",
        headline:  th && typeof th === "object" ? safe(function(){ return capPerf(th); }) : null,
        execution: th && typeof th === "object" ? safe(function(){ return capExec(th).pct; }) : null };
    } else {
      var tu = safe(function(){ return topAsUnit(); });
      out.top = { name: "own plan (pillars)",
        headline:  tu && typeof tu === "object" ? safe(function(){ return unitPillars(tu); }) : null,
        execution: tu && typeof tu === "object" ? safe(function(){ return unitRatio(tu); }) : null };
    }
  }
  out.group = {
    ownObjectives:   safe(function(){ return groupKeyObjectives(); }),
    unitsObjectives: safe(function(){ return groupUnitsObjectives(); }),
    delivered:       safe(function(){ return groupExec(); }),
    planned:         safe(function(){ return groupPlan(); }),
    execution:       safe(function(){ return groupRatio(); }) };
  /* The Focus board reads the stored raw figure on purpose (§239); a yes/no
     measure stores none, so it reads "Not reported" while scoring 100 or 0. */
  var yn = 0, ynScored = 0;
  keys.forEach(function(k){
    var u = UNITS[k]; if (!u) return;
    (safe(function(){ return unitFocus(u); }) || []).forEach(function(x){
      if (!x || !x.m || !SMPRules.isYesNo(x.m.target)) return;
      yn++;
      if (x.m.progress == null && measureScore(x.m) != null) ynScored++;
    });
  });
  out.focus = { yesNoMarked: yn, readsNotReportedWhileScored: ynScored };
  /* Row scores, to prove they never move. */
  var rows = {};
  function row(id, m){ rows[id] = safe(function(){ return measureScore(m); }); }
  keys.forEach(function(k){
    var u = UNITS[k]; if (!u) return;
    (u.keyObjectives || []).forEach(function(m, i){ row(k + ".ko" + i, m); });
    (u.items || []).forEach(function(p, i){ (p.measures || []).forEach(function(m, j){ row(k + ".p" + i + ".m" + j, m); }); });
  });
  (GROUP.capabilities || []).forEach(function(c){ (c.keyObjectives || []).forEach(function(m, i){ row("cap" + c.id + ".ko" + i, m); }); });
  out.rows = rows;
  return JSON.stringify(out);
})()`;

/* What the deck prints today for a holder's objectives (present.js:1098). */
run("var __deckKO = function(c){ return capKOScore(c); };");

const before = JSON.parse(run(READ));

/* ── the proposed rules, installed as overrides ───────────────────────── */
const ON = (p) => !only.length || only.includes(p);
if (ON("P1")) run(`
  capKOScore = function(c){
    if (c && c.own && !fnKoCounted(c.id)) return null;
    return koScore(c.keyObjectives || []);
  };`);
if (ON("P2")) run(`
  var __capExec0 = capExec;
  capExec = function(c){
    var r = __capExec0(c), sum = 0, scored = 0;
    (c.projects || []).forEach(function(p){
      SMPRules.shown(p.milestones).forEach(function(x){
        if (!dueThisCycle(x.finish)) return;
        if (statusPending(x)) return;
        scored++; sum += msReads(x) || 0;
      });
    });
    r.pct = scored ? Math.round(sum / scored) : null;
    return r;
  };
  var __fnAT0 = fnActionsTally;
  fnActionsTally = function(fk){
    var r = __fnAT0(fk), sum = 0, scored = 0;
    SMPRules.shown(fnActions(fk)).forEach(function(a){
      if (!dueThisCycle(a.due)) return;
      if (statusPending(a)) return;
      scored++; sum += msReads(a) || 0;
    });
    r.pct = scored ? Math.round(sum / scored) : null;
    return r;
  };`);
if (ON("P3")) run(`
  groupRatio = function(){ return weightedOver(scoringUnitKeys(), unitRatio); };
  var __coRatio0 = companyRatio;
  companyRatio = function(ck){
    return companyFnKeys(ck).length ? __coRatio0(ck) : weightedOver(companyUnitKeys(ck), unitRatio);
  };`);
if (ON("P4")) run(`
  var __fms0 = fnMemberScores;
  fnMemberScores = function(fk){
    var r = __fms0(fk), f = FUNCTIONS[fk];
    if (!f || !planOn("fn:" + fk) || fnPlansInObjectives(f)) return r;
    var t = "fn:" + fk;
    if (fnPlansInPillars(f)) {
      var u = unitLike(t); if (!u) return r;
      var has = fnKoCounted(t) && SMPRules.shown(u.keyObjectives || []).length > 0;
      return { perf: has ? unitObjectives(u) : unitPillars(u), exec: r.exec };
    }
    var h = fnHolders(fk)[0]; if (!h) return r;
    var has2 = fnKoCounted(t) && SMPRules.shown(h.keyObjectives || []).length > 0;
    return { perf: has2 ? capKOScore(h) : capPerf(h), exec: r.exec };
  };`);
if (ON("P5")) run("__deckKO = function(c){ return holderKOScore(c); };");

const after = JSON.parse(run(READ));

/* ── the comparison ───────────────────────────────────────────────────── */
const rowsMoved = Object.keys(before.rows).filter((k) => before.rows[k] !== after.rows[k]);
const changes = [];
function cmp(kind, b, a, fields) {
  fields.forEach((f) => {
    if (!(f in b) && !(f in a)) return;
    if (b[f] !== a[f]) changes.push({ kind, name: b.name || kind, field: f, before: b[f], after: a[f] });
  });
}
before.units.forEach((b, i) => cmp("unit", b, after.units[i],
  ["objectives", "pillars", "delivered", "planned", "execution", "deckObjectives", "pageObjectives"]));
before.functions.forEach((b, i) => cmp("function", b, after.functions[i],
  ["headline", "execution", "objectives", "pillars", "actions", "projects", "milestones", "deckObjectives"]));
before.capabilities.forEach((b, i) => cmp("capability", b, after.capabilities[i],
  ["objectives", "projects", "execution", "deckObjectives"]));
before.companies.forEach((b, i) => cmp("division", b, after.companies[i],
  ["objectives", "delivered", "planned", "execution"]));
cmp("group", Object.assign({ name: "the group" }, before.group), Object.assign({ name: "the group" }, after.group),
  ["ownObjectives", "unitsObjectives", "delivered", "planned", "execution"]);
if (before.top && after.top) cmp("company plan", before.top, after.top, ["headline", "execution"]);

/* The one caveat P3 carries: the group's card prints "Delivered X% against
   Y% planned" under its execution figure, and after P3 X/Y no longer equals
   the headline. Measured, so it is a number rather than a worry. */
const gA = after.group;
const caveat = (gA.delivered != null && gA.planned)
  ? { headline: gA.execution, deliveredOverPlanned: Math.round(gA.delivered / gA.planned * 100) } : null;

const result = { source, proposals: only.length ? only : ["P1", "P2", "P3", "P4", "P5", "P6"],
  rowScoresMoved: rowsMoved.length, rowsChecked: Object.keys(before.rows).length,
  changes, focus: before.focus, groupCardCaveat: caveat, before, after };

if (asJson) { console.log(JSON.stringify(result, null, 2)); process.exit(rowsMoved.length ? 1 : 0); }

const show = (v) => v == null ? "—" : (typeof v === "number" ? v + "%" : String(v));
console.log("Stage 1 readings — " + source);
console.log("Proposals applied: " + result.proposals.join(" "));
console.log("Row scores checked: " + result.rowsChecked + ", moved: " + rowsMoved.length +
  (rowsMoved.length ? "  ← MUST BE NOUGHT: " + rowsMoved.slice(0, 5).join(", ") : "  (ok — stage 1 never touches a row)"));
console.log("");
function block(label, bs, as, fields, extra) {
  console.log("── " + label + " " + "─".repeat(Math.max(0, 66 - label.length)));
  bs.forEach((b, i) => {
    const a = as[i];
    const parts = fields.filter((f) => f in b).map((f) => {
      const moved = b[f] !== a[f];
      return f + " " + show(b[f]) + (moved ? " → " + show(a[f]) + " *" : "");
    });
    console.log("  " + (b.name || b.key).padEnd(28).slice(0, 28) + (extra ? extra(b).padEnd(12) : "") + parts.join(" · "));
  });
  console.log("");
}
block("Business units", before.units, after.units,
  ["objectives", "pillars", "execution", "deckObjectives", "pageObjectives"], (b) => b.format || "");
block("Supporting functions", before.functions, after.functions,
  ["headline", "execution", "objectives", "pillars", "projects", "milestones", "actions", "deckObjectives"],
  (b) => b.format || "");
if (before.capabilities.length) block("Capabilities with their own page", before.capabilities, after.capabilities,
  ["objectives", "projects", "execution", "deckObjectives"]);
if (before.companies.length) block("Divisions", before.companies, after.companies,
  ["objectives", "delivered", "planned", "execution"]);
block("The group", [Object.assign({ name: "the group" }, before.group)], [Object.assign({ name: "the group" }, after.group)],
  ["ownObjectives", "unitsObjectives", "delivered", "planned", "execution"]);
if (before.top && after.top) block("The company's own plan", [before.top], [after.top], ["headline", "execution"]);
console.log("Focus board: " + before.focus.yesNoMarked + " yes/no measure(s) marked, " +
  before.focus.readsNotReportedWhileScored + " reading \"Not reported\" while scored (P6 makes them read their answer).");
if (caveat) console.log("Group card after P3: headline " + show(caveat.headline) +
  ", while \"delivered against planned\" divides to " + show(caveat.deliveredOverPlanned) + ".");
console.log("\n" + changes.length + " number(s) move.  (* marks each one.)");
process.exit(rowsMoved.length ? 1 : 0);
