/* ── A CAPABILITY BECOMES AN INTERNAL PILLAR, AND THE PAGES DO NOT MOVE ───
   Spec 066 stage 3b (c) and the move (d) waits on. §542.

   WHAT THIS CHECK IS FOR. (a) gave a box a setting, (b) gave a pillar its
   code; this is the one that answers the question Islam actually asked —
   *"nothing will change for the users this is just a structural change"*.
   So it does not test functions. It RENDERS THE PAGES, performs the move,
   renders them again, and compares the words a person would read.

   THREE COLUMNS, NOT TWO, and that is the point of the design:
     · TODAY     — the build before §542, over the state as stored.
     · THE CODE  — this build, over the SAME state, nothing moved. Every
                   difference here is something §542's code did on its own,
                   to a client that has not migrated. Those must be none, or
                   named.
     · THE MOVE  — this build, after `capFoldIntoTop()`. Differences here are
                   what the migration does.
   Two columns cannot tell those apart, and "the page changed" is a useless
   finding when you cannot say which half changed it.

   THE STATE IS MADE, EL ABD'S SHAPE (§255). Five capabilities, each already
   exactly one pillar, none naming a function, none holding projects or key
   objectives — measured off the real client (§535.6) and rebuilt here so the
   check runs for anybody with the repository and no client file.

   WHAT IS ASSERTED
     1 · the code alone moves nothing, on an unmigrated client;
     2 · the move is refused where a capability is not a clean one pillar,
         and the refusal names which and why;
     3 · the plan it would run matches what it then runs;
     4 · every id survives, so no figure, snapshot or report is orphaned;
     5 · page by page, what a person reads is the same — the Capabilities tab
         (compared ACROSS the two different renderers that draw it before and
         after), the Directions tab, Performance's sections, the Reporting
         page's two sections, the Temple's base and the deck's roll-call;
     6 · and the four differences that ARE intended are asserted to be
         exactly those four and no others.

   PROVED ABLE TO FAIL (§113.8), with what was counted:
     · the move refusing nothing                          →  8 of 38 red
     · the owner not carried off the record               →  1 of 38 red
     · the moved row not marked internal                  → 14 of 38 red
     · the move not setting the split (§540)              →  5 of 38 red
     · the Temple's base reading the records only         →  2 of 38 red
     · the deck's heading dropping the second kind        →  1 of 38 red
     · the empty capabilities section kept on Performance →  2 of 38 red
     · Reporting drawing no second section                →  2 of 38 red
     · the deck naming both kinds on a JOINED box          →  2 of 42 red
     · `boxHasHalf` asking the BOX instead of the VIEWER    →  4 of 52 red
       (and its output is Islam's own symptom, word for word: "This unit has
        no Pillars yet, so there is nothing to report against")
     · the heading never dropping                           →  1 of 52 red

   Usage:
     node scripts/test-capability-fold.js
     node scripts/test-capability-fold.js --base <commit>
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
const BASE = baseArg >= 0 ? args[baseArg + 1] : "b773ac3";

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
  if (run("typeof renderUnitPlan") !== "function") throw new Error("the sources did not define renderUnitPlan");
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

/* ── EL ABD'S SHAPE, MADE (§255, §535.6) ─────────────────────────────────
   The company plans in pillars with the business units off; five directions
   on its own list; five capabilities, each planning in pillars and holding
   exactly one pillar with real measures and tactics on it; the capability's
   seat on the RECORD and the inner pillar storing no owner, which is how the
   real client stores it and is the case the move has to carry. */
const CAPS = ["End-to-End Quality Mindset", "ERP Enhancement", "Digital Transformation",
              "Talent & Workforce Optimization", "Operational excellence"];
const DIRS = ["Maximizing Current Stores", "Egypt Expansion", "Growing FMCG",
              "ELABD Corner, Events and Catering", "E-Commerce Growth"];
function elAbd(bend) {
  const s = JSON.parse(JSON.stringify(SEED));
  s.group.structure = Object.assign({}, s.group.structure, { bu: { exists: false } });
  const who = s.people.filter(function (p) { return p.key && p.name; });
  s.group.items = DIRS.map(function (n, i) {
    return { id: "group-P" + (i + 1), code: "", name: n, sub: "", kind: "Direction", theme: "", owner: "",
             measures: [{ id: "group-P" + (i + 1) + "-M1", name: n + " measure", dir: "≥",
                          target: "100", compile: "Latest", actual: "" }],
             tactics: [{ id: "group-P" + (i + 1) + "-T1", name: n + " tactic", owner: "", q1: 1 }] };
  });
  s.group.capabilities = CAPS.map(function (n, i) {
    return { id: "cap" + i, name: n, def: "", format: "pillars",
             /* three of the five name a head, as the client does */
             head: i < 3 ? who[i].key : undefined,
             keyObjectives: [], projects: [],
             items: [{ id: "cap:cap" + i + "-P1", code: "", name: i === 0 ? "" : n, sub: "",
                       kind: "", theme: "", owner: "",
                       measures: [{ id: "cap:cap" + i + "-P1-M1", name: n + " measure", dir: "≥",
                                    target: "100", compile: "Latest", actual: "" }],
                       tactics: [{ id: "cap:cap" + i + "-P1-T1", name: n + " tactic", owner: "", q1: 1 }] }] };
  });
  if (bend === "projects") s.group.capabilities[2].format = "projects";
  if (bend === "two") s.group.capabilities[1].items.push(
    { id: "cap:cap1-P2", name: "A second pillar", kind: "", measures: [], tactics: [] });
  if (bend === "kos") s.group.capabilities[3].keyObjectives = [{ id: "k1", name: "Its own objective" }];
  if (bend === "fn") s.group.capabilities[0].fn = s.functionKeys[0];
  return s;
}

/* The words a person reads, markup and spacing taken out. */
const WORDS = function (h) {
  return String(h).replace(/<[^>]*>/g, " ").replace(/&middot;/g, "·").replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&").replace(/&rarr;/g, "→").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
};
/* Every surface the company's capabilities are drawn on, as one expression
   each, so adding a page to this check is one line. */
const PAGES = {
  "Strategy · the pillar tab": `drawHalf("dir", function(){ return renderUnitPlan(topAsUnit()); })`,
  "Strategy · Foundation": `renderGroupFoundation()`,
  "Strategy · SWOT": `renderUnitAnalysis(topAsUnit())`,
  "Performance · its sections": `(renderGroupPerformance(), JSON.stringify(GROUP_SECTIONS))`,
  "Reporting": `renderReport(topAsUnit())`,
  "Temple": `renderTemple()`,
  "The review deck": `deckHtmlFor("group")`,
  "Focus board": `JSON.stringify(focusBands())`
};
/* The capabilities tab is drawn by two DIFFERENT renderers before and after,
   which is the whole of (c): the records' own page, then the internal half
   of the company's one list. So it is compared across the pair. */
const CAPTAB = [`renderTopCaps()`, `drawHalf("cap", function(){ return renderUnitPlan(topAsUnit()); })`];

/* ── 1 · THE CODE ALONE MOVES NOTHING ON AN UNMIGRATED CLIENT ───────────── */
console.log("1 · §542's code, over a client that has not moved, changes nothing");
{
  const was = clientAt(readWas, elAbd()), now = clientAt(readNow, elAbd());
  const moves = [];
  Object.keys(PAGES).forEach(function (name) {
    let a, b;
    try { b = WORDS(was(PAGES[name])); } catch (e) { b = "threw: " + e.message; }
    try { a = WORDS(now(PAGES[name])); } catch (e) { a = "threw: " + e.message; }
    if (a !== b) moves.push([name, b.length, a.length]);
  });
  /* THE REPORTING PAGE IS THE ONE EXCEPTION AND IT IS NAMED (§218, §542):
     `plansInPillars("group")` answered false for every company in the
     product, so the company's Reporting rail could not say which row still
     owed a figure. Fixed, which ADDS the fill bar and its per-row marks to a
     page that had neither. Asserted as a move rather than excused. */
  const rep = moves.filter(function (m) { return m[0] === "Reporting"; });
  ok(rep.length === 1 && rep[0][2] > rep[0][1],
     "the Reporting page gains the fill bar §542 gave every other box", rep);
  ok(WORDS(was(`renderReport(topAsUnit())`)).indexOf("to finish") < 0 &&
     WORDS(now(`renderReport(topAsUnit())`)).indexOf("to finish") >= 0,
     "and that is specifically the 'N to finish' bar, absent before and present after");
  const rest = moves.filter(function (m) { return m[0] !== "Reporting"; });
  ok(rest.length === 0, "and every other page is word for word what it was", rest);
  /* BOTH ENDS (§94.2): pages that rendered nothing would agree perfectly. */
  const size = Object.keys(PAGES).reduce(function (n, k) { return n + WORDS(now(PAGES[k])).length; }, 0);
  ok(size > 3000, "and those pages really drew something — " + size + " words of it", size);
  ok(WORDS(now(CAPTAB[0])).indexOf(CAPS[0]) >= 0,
     "the capabilities tab names the first capability, so the state really has them");
}

/* ── 1b · AND IT MOVES NOTHING FOR A JOINED BOX HOLDING BOTH KINDS ──────
   THE GAP THIS SECTION WAS WRITTEN FROM. Section 1 measures the COMPANY, and
   the company's capabilities are records, so nothing above asks what §542's
   code does to a box whose ONE JOINED LIST already holds pillars marked
   Capability — which is six of the worked example's ten units, today, on
   every client built like Raya. The first draft of the deck's roll-call
   asked the MARK instead of the SETTING and put "Pillars & Capabilities"
   over all six of their decks, and a "Capability" line under rows that had
   none. Every assertion in this file passed. `checks/deck-figures.py` caught
   it; this is the same question asked here, where it belongs. */
console.log("1b · a joined box holding both kinds is untouched, on every surface");
{
  const was = clientAt(readWas, elAbd()), now = clientAt(readNow, elAbd());
  const mixed = now(`UNIT_KEYS.filter(function(k){ var it = UNITS[k].items || [];
    return it.some(function(p){ return SMPRules.pillarIsCap(p); }) &&
           it.some(function(p){ return !SMPRules.pillarIsCap(p); }); })`);
  ok(mixed.length >= 2, "the state holds " + mixed.length + " joined units carrying both kinds", mixed);
  const per = `(function(k){ var u = UNITS[k]; return WORDSX([
      renderUnitPlan(u), renderReport(u), deckHtmlFor(k)
    ].join(" \u2016 ")); })`;
  const helper = `var WORDSX = function(h){ return String(h).replace(/<[^>]*>/g," ")
    .replace(/&middot;/g,"\u00b7").replace(/&mdash;/g,"\u2014").replace(/&amp;/g,"&")
    .replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(); };`;
  was(helper); now(helper);
  const moves = [];
  mixed.forEach(function (k) {
    let a, b;
    try { b = was(per + "(" + JSON.stringify(k) + ")"); } catch (e) { b = "threw: " + e.message; }
    try { a = now(per + "(" + JSON.stringify(k) + ")"); } catch (e) { a = "threw: " + e.message; }
    if (a !== b) { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
      moves.push([k, b.slice(Math.max(0, i - 40), i + 80), a.slice(Math.max(0, i - 40), i + 80)]); }
  });
  ok(moves.length === 0,
     "their plan, their reporting and their deck are word for word what they were", moves.slice(0, 2));
  /* BOTH ENDS (§94.2): three pages apiece, really drawn. */
  const size = mixed.reduce(function (n, k) { return n + now(per + "(" + JSON.stringify(k) + ")").length; }, 0);
  ok(size > 10000, "and those " + (mixed.length * 3) + " pages really drew something — " + size + " words", size);
  /* The specific thing that went wrong, named, so a future reader sees it. */
  ok(now(`deckHtmlFor(${JSON.stringify(mixed[0])})`).indexOf("&amp; " + now(`L("capability","bu")`)) < 0,
     "no joined unit's deck heading names a second kind, however its rows are marked");
}

/* ── 2 · THE MOVE REFUSES WHAT IT CANNOT CARRY ──────────────────────────── */
console.log("2 · a capability that is not one clean pillar blocks the move, by name");
{
  const clean = clientAt(readNow, elAbd());
  ok(JSON.stringify(clean(`capFoldBlockers()`)) === "[]", "the clean shape has no blockers",
     clean(`capFoldBlockers()`));
  [["projects", "plans in"], ["two", "not one"], ["kos", "of its own"], ["fn", "held by"]].forEach(function (b) {
    const run = clientAt(readNow, elAbd(b[0]));
    const blk = run(`capFoldBlockers()`);
    ok(blk.length === 1 && JSON.stringify(blk[0].why).indexOf(b[1]) >= 0,
       "a capability that " + b[0] + " is named, with the reason", blk);
    ok(run(`capFoldIntoTop()`) === -1 && run(`GROUP.capabilities.length`) === 5,
       "and the whole move is refused — all five records are still there", b[0]);
  });
}

/* ── 3 · THE PLAN IS WHAT RUNS ──────────────────────────────────────────── */
console.log("3 · what the rehearsal says it will do is what it does");
{
  const run = clientAt(readNow, elAbd());
  const plan = run(`capFoldPlan()`);
  ok(plan.length === 5, "it plans five rows", plan.length);
  ok(JSON.stringify(plan.map(function (r) { return r.was; })) ===
     JSON.stringify(["C001", "C002", "C003", "C004", "C005"]), "from C001–C005",
     plan.map(function (r) { return r.was; }));
  ok(JSON.stringify(plan.map(function (r) { return r.becomes; })) ===
     JSON.stringify(["C001", "C002", "C003", "C004", "C005"]), "to C001–C005 — §535.10's constraint",
     plan.map(function (r) { return r.becomes; }));
  ok(plan.filter(function (r) { return r.owner; }).length === 3,
     "three of the five carry an owner off the record, as the client stores them",
     plan.map(function (r) { return r.owner; }));
  ok(run(`capFoldIntoTop()`) === 5, "and the move reports five");
  const after = run(`(function(){ var t = topAsUnit();
    return t.items.map(function(p, i){ return pillarCode(t, i) + "|" + (p.name || "") + "|" + (p.owner || ""); }); })()`);
  const want = plan.map(function (r) { return r.becomes + "|" + r.name + "|" + r.owner; });
  ok(JSON.stringify(after.slice(5)) === JSON.stringify(want),
     "row for row, code, name and owner are what the plan said", [want, after.slice(5)]);
  ok(run(`GROUP.capabilities.length`) === 0, "and the records are gone");
  ok(run(`SMPRules.topSplit(GROUP)`) === true,
     "and the company is set to show its pillars apart, so the tabs do not move");
}

/* ── 4 · EVERY ID SURVIVES ──────────────────────────────────────────────── */
console.log("4 · every row keeps its id, so nothing keyed on one is orphaned");
{
  const run = clientAt(readNow, elAbd());
  const before = run(`(function(){ var out = [];
    (GROUP.capabilities || []).forEach(function(c){ (c.items || []).forEach(function(p){
      out.push(p.id);
      (p.measures || []).forEach(function(m){ out.push(m.id); });
      (p.tactics || []).forEach(function(t){ out.push(t.id); }); }); });
    return out.sort(); })()`);
  run(`capFoldIntoTop()`);
  const after = run(`(function(){ var out = [];
    (GROUP.items || []).forEach(function(p){
      if (!SMPRules.pillarIsCap(p)) return;
      out.push(p.id);
      (p.measures || []).forEach(function(m){ out.push(m.id); });
      (p.tactics || []).forEach(function(t){ out.push(t.id); }); });
    return out.sort(); })()`);
  ok(before.length === 15, "the five capabilities hold 15 identified rows between them", before.length);
  ok(JSON.stringify(after) === JSON.stringify(before),
     "and all 15 ids are on the company's list afterwards, unchanged",
     before.filter(function (x) { return after.indexOf(x) < 0; }));
}

/* ── 5 · PAGE BY PAGE, WHAT A PERSON READS ──────────────────────────────── */
console.log("5 · the pages, before the move and after it");
{
  const before = clientAt(readNow, elAbd()), after = clientAt(readNow, elAbd());
  after(`capFoldIntoTop()`);
  /* The capabilities tab, across the two renderers. */
  const capWas = WORDS(before(CAPTAB[0])), capNow = WORDS(after(CAPTAB[1]));
  ok(capWas.length > 200 && capNow.length > 200,
     "both renderings of the capabilities tab drew a page", [capWas.length, capNow.length]);
  ok(capNow.indexOf("Capabilities " + CAPS.length) === 0,
     "after the move the tab is still headed Capabilities, with five under it",
     capNow.slice(0, 60));
  ok(capWas.indexOf("Capabilities " + CAPS.length) === 0,
     "as it was before", capWas.slice(0, 60));
  CAPS.forEach(function (n, i) {
    ok(capNow.indexOf("C00" + (i + 1) + " " + n) >= 0,
       "C00" + (i + 1) + " " + n + " is on it, under the code it had");
  });
  const diffs = [];
  Object.keys(PAGES).forEach(function (name) {
    const b = WORDS(before(PAGES[name])), a = WORDS(after(PAGES[name]));
    if (a !== b) diffs.push(name);
  });
  /* THE FOUR INTENDED DIFFERENCES, ASSERTED AS EXACTLY FOUR. Reporting and
     the deck gain the five rows; the Temple's base swaps a record's counts
     for a pillar's. Anything else appearing here is a regression, and
     anything here NOT appearing means a page stopped drawing them. */
  ok(JSON.stringify(diffs.sort()) ===
     JSON.stringify(["Reporting", "Temple", "The review deck"]),
     "three pages change, and they are the three the move is about", diffs);
  ok(WORDS(after(`(renderGroupPerformance(), JSON.stringify(GROUP_SECTIONS))`)) ===
     WORDS(before(`(renderGroupPerformance(), JSON.stringify(GROUP_SECTIONS))`)),
     "Performance offers the same sections, by the same names, before and after",
     [before(`(renderGroupPerformance(), JSON.stringify(GROUP_SECTIONS))`),
      after(`(renderGroupPerformance(), JSON.stringify(GROUP_SECTIONS))`)]);
  /* And each of the three changed in the direction it should have. */
  const rep = WORDS(after(`renderReport(topAsUnit())`));
  ok(CAPS.every(function (n) { return rep.indexOf(n) >= 0; }),
     "Reporting still asks for every capability");
  ok(rep.indexOf("Capabilities —") >= 0,
     "under its own heading, in the client's word", rep.slice(rep.indexOf("Capabilities") - 20, rep.indexOf("Capabilities") + 60));
  const tem = WORDS(after(`renderTemple()`));
  ok(CAPS.every(function (n) { return tem.indexOf(n) >= 0; }),
     "the Temple's base still names all five");
  const deck = WORDS(after(`deckHtmlFor("group")`));
  ok(CAPS.every(function (n) { return deck.indexOf(n) >= 0; }) &&
     deck.indexOf("Pillars & Capabilities") >= 0,
     "and the deck's roll-call lists them under a heading naming both kinds",
     deck.slice(deck.indexOf("E-Commerce Growth"), deck.indexOf("E-Commerce Growth") + 120));
}

/* ── 6 · AND EACH PERSON IS OFFERED ONLY THE HALF THEY HAVE (§543) ───────
   Islam, on the live client with the half eye on: *"viewing as osama I
   shouldn't see the directions part at the top … for amr I shouldn't see the
   capabilities tab as it has nothing for him there"*, and *"drop the heading
   when there's only one half"*.

   §540 asked whether the BOX held a half; this asks whether the VIEWER does.
   Measured on three people at once, because the rule is only right if it
   narrows two of them and leaves the third alone — a test on the part owners
   alone would pass over a build that hid the halves from everybody. */
console.log("6 · each person is offered the half they have, and no heading when it is alone");
{
  const s = elAbd();
  /* TWO PART OWNERS, MADE (§255). The worked example's people all hold a unit
     seat or a function's, so none of them is narrowed by the half eye — a
     section built on them would measure nothing. These two hold one part and
     nothing else, which is what §533's rule means by a part owner. */
  const capMan = { key: "capman", name: "Osama Yousef", title: "Quality", unit: null };
  const dirMan = { key: "dirman", name: "Amr Hassan", title: "Retail", unit: null };
  s.people = s.people.concat([capMan, dirMan]);
  s.group.capabilities[0].head = capMan.key;      /* the first capability is his */
  s.group.items[0].owner = dirMan.name;           /* the first direction is hers */
  s.group.dirScope = "part";                      /* the half eye, as El Abd has it */
  const run = clientAt(readNow, s);
  run(`capFoldIntoTop();`);
  /* String.raw, because a plain template literal eats the escapes before the
     vm sees them — `\s` became a bare "s" and the count read nought while the
     headings were plainly there. */
  const H = String.raw`(function(){ var r = renderReport(topAsUnit()).replace(/<[^>]*>/g," ")
      .replace(/&mdash;/g,"\u2014").replace(/\s+/g," ");
    return (r.match(/\u2014 Key [Mm]easures and Tactics/g) || []).length; })()`;
  const office = run(`PEOPLE.filter(function(p){ return p.role === "super"; })[0].key`);
  const read = function (key) {
    run("VIEWER = " + JSON.stringify(key) + ";");
    return { roles: run(`personRoles(viewer()).map(function(r){ return r.role; }).sort()`),
             narrowed: run(`partOnly()`),
             dir: run(`boxHasHalf(topAsUnit(), "dir")`),
             cap: run(`boxHasHalf(topAsUnit(), "cap")`),
             heads: run(H) };
  };
  const o = read(office), c = read(capMan.key), d = read(dirMan.key);
  ok(JSON.stringify(c.roles) === JSON.stringify(["dirowner"]) &&
     JSON.stringify(d.roles) === JSON.stringify(["dirowner"]),
     "both made people hold one part role and nothing else", [c.roles, d.roles]);
  ok(o.narrowed === false && c.narrowed === true && d.narrowed === true,
     "the office is not narrowed and the two part owners are — or this proves nothing",
     [o.narrowed, c.narrowed, d.narrowed]);
  ok(o.dir === true && o.cap === true, "the office is offered both halves", o);
  ok(o.heads === 2, "and both headings, which is what tells them apart for them", o.heads);
  ok(c.cap === true && c.dir === false,
     "a capability's owner is offered the capabilities half and NOT the directions one", c);
  ok(d.dir === true && d.cap === false,
     "a direction's owner is offered the directions half and NOT the capabilities one", d);
  ok(c.heads === 0 && d.heads === 0,
     "and neither gets a heading, because neither has a second half to tell it from",
     [c.heads, d.heads]);
  run("VIEWER = " + JSON.stringify(capMan.key) + ";");
  const capPage = WORDS(run(`renderReport(topAsUnit())`));
  ok(capPage.indexOf("nothing to report against") < 0,
     "a capability owner is never told the company has no directions", capPage.slice(0, 140));
  ok(capPage.indexOf(CAPS[0]) >= 0, "and their own capability is on the page", capPage.slice(0, 140));
  run("VIEWER = " + JSON.stringify(dirMan.key) + ";");
  const dirPage = WORDS(run(`renderReport(topAsUnit())`));
  ok(CAPS.every(function (n) { return dirPage.indexOf(n) < 0; }),
     "and a direction owner's page names no capability at all", dirPage.slice(0, 140));
}

console.log("");
console.log(failed === 0
  ? "PASS — " + passed + " agreements; the capabilities move and the pages do not"
  : "FAIL — " + failed + " of " + (failed + passed));
process.exit(failed ? 1 : 0);
