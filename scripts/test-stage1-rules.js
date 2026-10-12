/* ── STAGE 1'S SIX RULES, ASKED OF THE PLATFORM'S OWN CODE (§515.2) ──────
   Spec 066 stage 1 changes how rows are COMBINED and never how a row is
   SCORED. This check asks each of the six rules of the platform's own sources,
   run in a vm exactly as scripts/stage1-readings.js runs them, over states it
   MAKES — the worked example holds no blank weight beside a set one, no
   pillars function without objectives, and no yes/no focus measure, so every
   assertion here would pass over a build that never had the rule (§255,
   §113.8). Each rule is asserted as an AGREEMENT with arithmetic this file
   does itself (§94.8), and each one is asserted at both ends, or a build that
   answers one fixed number passes half (§94.2).

     P1  one weight rule   a blank weight is the average of the set ones, and
                           a hidden row is not counted — for a capability and
                           a function exactly as for a unit
     P2  one Execution     a milestone or an action counts once its date has
                           come; nothing due yet is no figure, never nought
     P3  one roll-up       the group's and a division's execution are the
                           weighted average of the figures their units show
     P4  one headline      a function's headline is its objectives when its
                           plan has them, and its pillars or projects when not
     P5  deck = page       the deck prints the objectives figure the page does
     P6  Focus yes/no      a yes/no focus measure reads its answer

   And the rule under all six: no row's own score moves. That is asserted by
   loading the sources as they stood BEFORE stage 1 (commit f1f5d29) and
   comparing every row's measureScore over the same tenant.

   Usage:
     node scripts/test-stage1-rules.js                 # the repository's sources
     node scripts/test-stage1-rules.js --src <dir>     # a doctored copy (§276)
   No browser, no database, no network. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const srcArg = args.indexOf("--src");
const SRC = srcArg >= 0 ? path.resolve(args[srcArg + 1]) : path.join(ROOT, "SMP-Project-Folder", "src");
const BASE_COMMIT = "f1f5d29";
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));

let failed = 0, passed = 0;
function ok(cond, what, detail) {
  if (cond) { passed++; console.log("  ok    " + what); }
  else { failed++; console.log("  FAIL  " + what + (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

/* ── the platform, loaded from a reader so a past commit can be loaded too ── */
function load(read) {
  const build = read("build.py");
  const files = [...build.match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                       .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((m) => m[1]);
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Intl, setTimeout });
  vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
  files.forEach((f) => {
    /* READING is outside the try: a file that cannot be read is a failure of
       this check and must say so, or a whole module goes missing in silence
       and the comparison is between two builds of which one is half there
       (§54.5 — it did, the first time: git was asked for src/../../lib/…). */
    const code = read(f);
    /* RUNNING is inside it: the files that reach for the page at load
       (welcome, history, …) throw here and define nothing this check asks
       for; every scoring and deck function is declared before any of them
       could throw. */
    try { vm.runInContext(code, ctx, { filename: f }); } catch (e) { /* see above */ }
  });
  const run = (code) => vm.runInContext(code, ctx);
  ["koScore", "capKOScore", "capExec", "fnMemberScores", "groupRatio", "measureScore"].forEach((n) => {
    if (run("typeof " + n) !== "function") throw new Error("the sources did not define " + n);
  });
  return { ctx, run };
}
/* sync.js's hydrate(), as smp-app/lib/frozen.cjs carries it (§53.5), over a
   fresh copy each time so a state one section makes cannot leak into the next
   (§94.2). */
function fresh(P) {
  P.ctx.__state = JSON.parse(JSON.stringify(SEED));
  P.run(`(function(s){
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
}
const J = (P, code) => JSON.parse(P.run("JSON.stringify(" + code + ")"));

let P;
try { P = load((f) => fs.readFileSync(path.join(SRC, f), "utf8")); }
catch (e) { console.log("FAIL  the sources at " + SRC + " could not be loaded: " + e.message); process.exit(1); }

/* A key objective whose score is exactly `score`: a Latest row is measured
   against its whole target, so 100 as the target makes the score the figure. */
P.run(`var __ko = function(id, score, weight, extra){
  var m = { id: id, name: "Objective " + id, dir: "\\u2265", target: "100", compile: "Latest",
            actual: score == null ? "" : String(score) };
  if (weight !== undefined) m.weight = weight;
  for (var k in (extra || {})) m[k] = extra[k];
  return m;
};`);

/* ── P1 · ONE WEIGHT RULE ─────────────────────────────────────────────── */
console.log("P1 · one weight rule");
fresh(P);
{
  const r = J(P, `(function(){
    var list = [__ko("K1", 80, 60), __ko("K2", 40, null), __ko("K3", 100, 40), __ko("K4", 0, 100, { hide: true })];
    var c = { id: "capx", keyObjectives: list };
    UNITS.mobile.keyObjectives = list.map(function(m){ return JSON.parse(JSON.stringify(m)); });
    delete KO_WEIGHTS.mobile;
    var blank = [__ko("B1", 80), __ko("B2", 40), __ko("B3", 100)];
    return { scores: list.map(function(m){ return measureScore(m); }),
             cap: capKOScore(c), unit: unitObjectives(UNITS.mobile),
             blank: capKOScore({ id: "capy", keyObjectives: blank }) };
  })()`);
  ok(JSON.stringify(r.scores) === "[80,40,100,0]", "the fixture's rows score what they were made to", r.scores);
  /* This file's own arithmetic, and it is the UNIT's rule (§243's
     koWeights), which P1 adopts unchanged: a blank is worth the average of
     every weight that was SET — the hidden row's 100 included, because
     somebody set it — and the hidden row itself is not counted (§233). So the
     blank is worth (60+40+100)/3 and the score is 69. Whether a hidden row
     should also stop counting toward what a blank is worth is a question
     about the unit's rule, not stage 1's, and is recorded rather than
     answered here. The old rule (a blank counts as ONE, the hidden row in)
     reads 44. */
  const m = (60 + 40 + 100) / 3;
  const mine = Math.round((80 * 60 + 40 * m + 100 * 40) / (60 + m + 40));
  const old = Math.round((80 * 60 + 40 * 1 + 100 * 40 + 0 * 100) / (60 + 1 + 40 + 100));
  ok(mine !== old, "the fixture separates the two rules", { mine, old });
  ok(r.cap === mine, "a capability's objectives: a blank weight is the average of the set ones, a hidden row not counted", { got: r.cap, want: mine });
  ok(r.unit === r.cap, "the same objectives on a unit read the same number", { unit: r.unit, cap: r.cap });
  ok(r.blank === Math.round((80 + 40 + 100) / 3), "nothing weighted at all is an equal average", r.blank);
}

/* ── P2 · ONE EXECUTION ───────────────────────────────────────────────── */
console.log("P2 · one execution");
fresh(P);
{
  const r = J(P, `(function(){
    var past = "Jan 2020", future = "Dec 2099";
    function holder(ms){ return { id: "caph", projects: [{ id: "P1", milestones: ms }] }; }
    var one = holder([{ id: "M1", status: "done", finish: past }, { id: "M2", status: "", finish: future }]);
    var both = holder([{ id: "M1", status: "done", finish: past }, { id: "M2", status: "", finish: past }]);
    var none = holder([{ id: "M1", status: "done", finish: future }, { id: "M2", status: "wip", finish: future }]);
    FUNCTIONS.hr.format = "objectives";
    FUNCTIONS.hr.actions = [{ id: "A1", name: "a", status: "done", due: past }, { id: "A2", name: "b", status: "", due: future }];
    var a1 = fnActionsTally("hr");
    FUNCTIONS.hr.actions = [{ id: "A1", name: "a", status: "done", due: future }];
    var a0 = fnActionsTally("hr");
    return { due: [dueThisCycle(past), dueThisCycle(future)],
             one: capExec(one), both: capExec(both), none: capExec(none), a1: a1, a0: a0 };
  })()`);
  ok(r.due[0] === true && r.due[1] === false, "the fixture's dates are one due and one not", r.due);
  ok(r.one.pct === 100 && r.one.due === 1 && r.one.total === 2,
     "one milestone due and done, one not yet due: 100%, one due of two", r.one);
  ok(r.both.pct === 50 && r.both.due === 2, "both due, one done: 50% — the same rows, once their date has come", r.both);
  ok(r.none.pct === null && r.none.due === 0, "nothing due yet is no figure, never nought (§35)", r.none);
  ok(r.none.pending === 1, "a milestone In progress with no per-cent is still counted as said-not-finished", r.none.pending);
  ok(r.a1.pct === 100 && r.a1.due === 1 && r.a1.total === 2, "an action counts once its date has come, as a milestone does", r.a1);
  ok(r.a0.pct === null && r.a0.due === 0, "and with no action due yet it is no figure", r.a0);
}

/* ── P3 · ONE ROLL-UP ─────────────────────────────────────────────────── */
console.log("P3 · one roll-up");
fresh(P);
{
  /* The worked example does NOT separate the two rules at the group — both
     read 51 there, measured — so the state is MADE (§255): all the weight on
     the PAIR of units where "delivered over planned" and "the average of the
     units' own figures" part company most. The pair is FOUND rather than
     guessed at — the two units whose plans differ most read 54 either way,
     because their ratios happen to sit close — and that the made state
     separates them is asserted before anything is asserted about it
     (§113.8). */
  const r = J(P, `(function(){
    /* Every tactic in the worked example carries an outcome since §353, and
       an outcome's plan is 100 (tacticPlanShare), so every unit's plan reads
       100 and the two rules cannot differ on any pair — which is why 51 = 51.
       One unit's tactics are measured by their quarters again (the outcome
       taken off), so its plan is the share of its quarters due by now and the
       two rules have something to disagree about. */
    var first = UNIT_KEYS.filter(function(k){ return unitRatio(UNITS[k]) != null; })[0];
    (UNITS[first].items || []).forEach(function(p){ (p.tactics || []).forEach(function(t){
      ["outcome", "outTarget", "outActual", "outDir", "outCompile"].forEach(function(f){ delete t[f]; });
    }); });
    var withR = UNIT_KEYS.filter(function(k){ return unitRatio(UNITS[k]) != null && unitPlan(UNITS[k]); });
    var keep = {}; UNIT_KEYS.forEach(function(k){ keep[k] = UNITS[k].weight; });
    var lo = null, hi = null, gap = -1;
    withR.forEach(function(a, i){ withR.slice(i + 1).forEach(function(b){
      UNIT_KEYS.forEach(function(k){ UNITS[k].weight = (k === a || k === b) ? 50 : 0; });
      var d = Math.abs(groupRatio() - ratioOf(groupExec(), groupPlan()));
      if (d > gap) { gap = d; lo = a; hi = b; }
    }); });
    UNIT_KEYS.forEach(function(k){ UNITS[k].weight = keep[k]; });
    /* The division is read on the worked example's OWN weights, before the
       group's are bent below, or most of its units would weigh nought and
       "the average" would be one unit's figure, or null === null (§113.8). */
    var co = COMPANY_KEYS.filter(function(ck){ return !companyFnKeys(ck).length && companyUnitKeys(ck).length; })[0];
    var coPer = co ? companyUnitKeys(co).map(function(k){ return { r: unitRatio(UNITS[k]), w: UNITS[k].weight }; }) : [];
    var coRatio = co ? companyRatio(co) : null, coOld = co ? ratioOf(companyExec(co), companyPlan(co)) : null;
    UNIT_KEYS.forEach(function(k){ UNITS[k].weight = (k === lo || k === hi) ? 50 : 0; });
    var per = UNIT_KEYS.map(function(k){ return { k: k, r: unitRatio(UNITS[k]), w: UNITS[k].weight }; });
    return { bu: buExists(), per: per, group: groupRatio(), old: ratioOf(groupExec(), groupPlan()), plans: withR.map(function(k){ return unitPlan(UNITS[k]); }),
             co: co, coPer: coPer, coRatio: coRatio, coOld: coOld };
  })()`);
  const wmean = (xs) => {
    let a = 0, t = 0;
    xs.forEach((x) => { if (x.r == null) return; a += x.r * x.w; t += x.w; });
    return t ? Math.round(a / t) : null;
  };
  ok(r.bu === true && r.per.filter((x) => x.r != null).length >= 2, "the worked example has units with an execution figure", r.per.length);
  ok(r.group === wmean(r.per), "the group's execution is the weighted average of its units' own figures", { got: r.group, want: wmean(r.per) });
  ok(r.group !== r.old, "and the made state separates that from delivered over planned", { now: r.group, old: r.old });
  ok(!!r.co && r.coPer.filter((x) => x.r != null && x.w > 0).length >= 2,
     "the worked example has a division of units alone, two of them weighted with a figure", r.coPer);
  ok(r.coRatio === wmean(r.coPer), "a division of units alone is the weighted average of its units' figures",
     { got: r.coRatio, want: wmean(r.coPer), old: r.coOld });
}

/* ── P4 · ONE HEADLINE ────────────────────────────────────────────────── */
console.log("P4 · one headline");
{
  const pil = (setup) => {
    fresh(P);
    return J(P, `(function(){
      var f = FUNCTIONS.merchandising;
      ${setup}
      var u = unitLike("fn:merchandising");
      return { fmt: fnFormat(f), ms: fnMemberScores("merchandising"),
               pillars: unitPillars(u), objectives: unitObjectives(u) };
    })()`);
  };
  const none = pil(`f.keyObjectives = [];`);
  ok(none.fmt === "pillars" && none.pillars != null, "the fixture is a pillars function whose pillars read a figure", none);
  ok(none.ms.perf === none.pillars, "a pillars function with no objectives reads its pillars, not a dash", none.ms);
  const some = pil(`f.keyObjectives = [__ko("K1", 80, 60), __ko("K2", 40, null), __ko("K3", 100, 40)];`);
  ok(some.ms.perf === 72 && some.ms.perf === some.objectives, "with objectives it reads its objectives (one weight rule)", some.ms);
  const off = pil(`f.keyObjectives = [__ko("K1", 80)];
    GROUP.structure = GROUP.structure || {}; GROUP.structure.over = GROUP.structure.over || {};
    GROUP.structure.over["fn:merchandising"] = { keyobj: false };`);
  ok(off.ms.perf === off.pillars && off.objectives === null, "with its objectives switched off it reads its pillars", off);

  const proj = (setup) => {
    fresh(P);
    return J(P, `(function(){
      var f = FUNCTIONS.finance;
      ${setup}
      var h = fnHolders("finance")[0];
      return { fmt: fnFormat(f), ms: fnMemberScores("finance"), perf: capPerf(h), ko: capKOScore(h) };
    })()`);
  };
  const pNone = proj(`f.keyObjectives = [];`);
  ok(pNone.fmt === "projects" && pNone.perf != null, "the fixture is a projects function whose projects read a figure", pNone);
  ok(pNone.ms.perf === pNone.perf, "a projects function with no objectives reads its projects", pNone.ms);
  const pSome = proj(`f.keyObjectives = [__ko("K1", 80, 60), __ko("K2", 40, null), __ko("K3", 100, 40)];`);
  ok(pSome.ms.perf === 72, "with objectives it reads its objectives", pSome.ms);
  const pWait = proj(`f.keyObjectives = [__ko("K1", null), __ko("K2", null)];`);
  ok(pWait.ms.perf === null, "objectives not yet reported read not-yet, never the projects in their place", { ms: pWait.ms, projects: pWait.perf });
}

/* ── P5 · DECK = PAGE ─────────────────────────────────────────────────── */
console.log("P5 · deck = page");
fresh(P);
{
  /* WHERE THE PROJECTOR PRINTS A HOLDER'S OBJECTIVES FIGURE IS A CAPABILITY'S
     OWN COVER — a unit's or a function's own work draws no second cover
     (§326), so a unit that plans in projects never prints one at all and
     asserting "deck = page" there would be asserting about a number that is
     not on the slide (§113.8). The capability's cover is compared with the
     capability's own page card, over P1's list: a blank weight beside set
     ones, so the figure is one only the shared rule gives (69) and never an
     equal average (73) nor the old one (44). */
  const r = J(P, `(function(){
    var c = GROUP.capabilities[0];
    c.keyObjectives = [__ko("K1", 80, 60), __ko("K2", 40, null), __ko("K3", 100, 40), __ko("K4", 0, 100, { hide: true })];
    var html = String(deckHtmlFor("cap:" + c.id));
    var i = html.indexOf('<span class="dlab">' + L("keyobj") + '</span>');
    var b = i < 0 ? null : html.slice(i).match(/<b class="[^"]*">([^<]*)<[/]b>/);
    var page = String(capScoreCards(c));
    var pb = page.match(/primary-card[\\s\\S]*?<span class="big"[^>]*>([\\s\\S]*?)<[/]span>/);
    return { id: c.id, ko: holderKOScore(c), deck: b ? b[1] : null,
             page: pb ? pb[1].replace(/<[^>]+>/g, "") : null, table: html.indexOf("Objective K1") >= 0 };
  })()`);
  const num = (x) => (x == null ? null : parseInt(String(x), 10));
  ok(r.ko === 69, "the fixture's capability scores by the shared rule", r);
  ok(num(r.deck) === r.ko && num(r.page) === r.ko, "the capability's cover prints the number its own page card prints", r);
  ok(r.table === true, "and draws the objectives slide", r.table);

  /* A pillars function's "where it stands" slide, at BOTH ENDS (§94.2): with
     its objectives on it prints the page's objectives figure, and with them
     switched off (§437) it prints no objectives cell at all — the page leads
     with the pillars card there, so a projector drawing the cell would be the
     deck and the page disagreeing about what the function is judged on. */
  const stand = (switchOff) => {
    fresh(P);
    return J(P, `(function(){
      FUNCTIONS.merchandising.keyObjectives = [__ko("K1", 80, 60), __ko("K2", 40, null), __ko("K3", 100, 40)];
      ${switchOff ? `GROUP.structure = GROUP.structure || {}; GROUP.structure.over = GROUP.structure.over || {};
      GROUP.structure.over["fn:merchandising"] = { keyobj: false };` : ""}
      var html = String(deckHtmlFor("fn:merchandising"));
      var i = html.indexOf('<span class="dlab">' + L("keyobj","bu") + ' performance</span>');
      var b = i < 0 ? null : html.slice(i).match(/<b class="[^"]*">([^<]*)<[/]b>/);
      return { cell: i >= 0, deck: b ? b[1] : null,
               page: unitObjectives(unitLike("fn:merchandising")), perf: fnMemberScores("merchandising").perf };
    })()`);
  };
  const sOn = stand(false), sOff = stand(true);
  ok(sOn.cell === true && num(sOn.deck) === 72 && sOn.page === 72 && sOn.perf === 72,
     "a pillars function's \u201cwhere it stands\u201d prints the objectives figure its page leads with", sOn);
  ok(sOff.cell === false && sOff.page === null,
     "and with its objectives switched off it prints no objectives cell, as its page draws no card", sOff);

  fresh(P);
  const off = J(P, `(function(){
    FUNCTIONS.finance.keyObjectives = [__ko("K1", 80)];
    var html = String(deckHtmlFor("fn:finance"));
    var on = html.indexOf("Objective K1") >= 0;
    GROUP.structure = GROUP.structure || {}; GROUP.structure.over = GROUP.structure.over || {};
    GROUP.structure.over["fn:finance"] = { keyobj: false };
    var html2 = String(deckHtmlFor("fn:finance"));
    return { on: on, off: html2.indexOf("Objective K1") >= 0 };
  })()`);
  ok(off.on === true && off.off === false, "objectives switched off draw no objectives slide, as the page draws no card", off);
}

/* ── P6 · FOCUS · A YES/NO MEASURE READS ITS ANSWER ───────────────────── */
console.log("P6 · focus");
fresh(P);
{
  const r = J(P, `(function(){
    var yn = { id: "F1", dir: "\\u2265", target: "Y/N", actual: "Done" };
    var ynSilent = { id: "F2", dir: "\\u2265", target: "Y/N", actual: "" };
    var num = { id: "F3", dir: "\\u2265", target: "100", compile: "Sum", actual: "50", progress: 50 };
    var t = focusTallyOf([{ m: yn }, { m: ynSilent }, { m: num }]);
    return { yn: focusFigure(yn), ynStand: focusStanding(focusFigure(yn)).key,
             silent: focusStanding(focusFigure(ynSilent)).key, num: focusFigure(num), numScore: measureScore(num), tally: t };
  })()`);
  ok(r.yn === 100 && r.ynStand !== "none", "a yes/no focus measure answered Done reads 100, not Not reported", r);
  ok(r.silent === "none", "a yes/no measure nobody answered still reads not reported (§35) — the control: true either side of the change", r.silent);
  ok(r.num === 50 && r.numScore !== 50, "a numeric focus measure still reads its raw stored figure (§239: reward is a year-end judgement)", { figure: r.num, score: r.numScore });
  ok(r.tally.none === 1 && r.tally.total === 3, "the tally counts the answered yes/no as reported", r.tally);
}

/* ── UNDER ALL SIX · NO ROW'S OWN SCORE MOVES ─────────────────────────── */
console.log("No row's own score moves");
{
  const ROWS = `(function(){
    var out = {};
    function row(id, m){ try { out[id] = measureScore(m); } catch (e) { out[id] = "ERR"; } }
    UNIT_KEYS.forEach(function(k){
      var u = UNITS[k];
      (u.keyObjectives || []).forEach(function(m, i){ row(k + ".ko" + i, m); });
      (u.items || []).forEach(function(p, i){
        (p.measures || []).forEach(function(m, j){ row(k + ".p" + i + ".m" + j, m); });
        (p.tactics || []).forEach(function(t, j){ if (t.outTarget) row(k + ".p" + i + ".t" + j, { target: t.outTarget, dir: t.outDir, compile: t.outCompile, actual: t.outActual }); });
      });
    });
    (FUNCTION_KEYS || []).forEach(function(fk){ (FUNCTIONS[fk].keyObjectives || []).forEach(function(m, i){ row("fn" + fk + ".ko" + i, m); }); });
    (GROUP.capabilities || []).forEach(function(c){ (c.keyObjectives || []).forEach(function(m, i){ row("cap" + c.id + ".ko" + i, m); }); });
    (GROUP.keyObjectives || []).forEach(function(m, i){ row("group.ko" + i, m); });
    return out;
  })()`;
  fresh(P);
  const now = J(P, ROWS);
  let base = null, why = "";
  try {
    const sh = (f) => execFileSync("git", ["show", BASE_COMMIT + ":" + path.posix.normalize("SMP-Project-Folder/src/" + f)], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });
    const B = load(sh);
    fresh(B);
    base = J(B, ROWS);
  } catch (e) { why = e.message.split("\n")[0]; }
  if (!base) {
    console.log("  NOT RUN  the sources before stage 1 (" + BASE_COMMIT + ") could not be read: " + why);
    console.log("           — this half says nothing; it did not pass.");
  } else {
    const keys = Object.keys(now);
    const moved = keys.filter((k) => now[k] !== base[k]);
    ok(keys.length > 100 && keys.length === Object.keys(base).length, "every row of the worked example is read on both builds", { now: keys.length, base: Object.keys(base).length });
    ok(keys.filter((k) => now[k] != null).length > 100, "and most of them carry a score, so the comparison is not of nulls", keys.filter((k) => now[k] != null).length);
    ok(moved.length === 0, "no row's own score moved against " + BASE_COMMIT, moved.slice(0, 5).map((k) => k + " " + base[k] + "→" + now[k]));
  }
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
