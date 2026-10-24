/* ── ONE ADDRESS, ONE PARSE — HELD TO THE ANSWER IT GAVE BEFORE (§531) ────
   Spec 066 stage 3a replaces the hand-sliced prefix in every reader with one
   parse (`SMPRules.boxRef`). Stage 3a MOVES NO DATA and is meant to move no
   answer either, so this check is not about what the new function returns in
   the abstract — it is about whether each converted caller still returns what
   it returned before the conversion.

   SO IT ASKS BOTH BUILDS THE SAME QUESTIONS. The sources as they stand are
   loaded beside the sources at the commit before this section (`--base`,
   default below), and every converted function is called on every address
   form the platform mints, in both, and compared. A check that only asserted
   `boxRef("fn:it").kind === "fn"` would pass over a build whose callers were
   all converted wrongly, because it never asks a caller anything (§94.8: an
   assertion has to be an agreement with something computed elsewhere).

   THE ADDRESS CORPUS IS THE POINT. Five prefixes, the top layer, a bare unit
   key, and the three ways a MISSING target reaches this code as text — "",
   "undefined" and "null" — because those are what the guards in `UNIT_TARGET`
   and `targetWord` were written for, and a corpus of well-formed addresses
   would pass over a build that dropped them (§94.2: asserted at both ends, or
   a build that answers one fixed thing passes half). Addresses that look
   nearly like a prefix are in it too (`capx`, `fnord`, `u:group`), because
   `indexOf(p) === 0` and a tidier-looking `split(":")` are not the same
   function and this is where that would show.

   Usage:
     node scripts/test-box-ref.js                  # against the default base
     node scripts/test-box-ref.js --base <commit>
   No browser, no database, no network. */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const baseArg = args.indexOf("--base");
/* The commit before §531 — the build whose answers this one must reproduce. */
const BASE = baseArg >= 0 ? args[baseArg + 1] : "f9b1a80";

let failed = 0, passed = 0;
function ok(cond, what, detail) {
  if (cond) { passed++; console.log("  ok    " + what); }
  else { failed++; console.log("  FAIL  " + what + (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

/* ── the two builds ───────────────────────────────────────────────────────
   The base is checked out into a temporary directory rather than read through
   `git show` into a string, because rules.js and authorize.js require each
   other by relative path and a string has no path (§54.5's lesson: the first
   attempt at this pattern asked git for src/../../lib/… and got nothing). */
function atCommit(commit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smp-box-ref-"));
  fs.mkdirSync(path.join(dir, "lib"));
  ["rules.js", "authorize.js", "graph-diff.js", "audience.js", "platform-rules.js"].forEach(function (f) {
    let code;
    try { code = execFileSync("git", ["show", commit + ":lib/" + f], { cwd: ROOT, maxBuffer: 1 << 28 }); }
    catch (e) { return; /* a file that did not exist at the base is not required by it either */ }
    fs.writeFileSync(path.join(dir, "lib", f), code);
  });
  return { rules: require(path.join(dir, "lib", "rules.js")), dir: dir };
}

const NOW = { rules: require(path.join(ROOT, "lib", "rules.js")) };
let WAS;
try { WAS = atCommit(BASE); }
catch (e) { console.log("FAIL  the sources at " + BASE + " could not be loaded: " + e.message); process.exit(1); }

/* ── THE ADDRESS CORPUS ───────────────────────────────────────────────── */
const ADDRESSES = [
  /* the six kinds the platform addresses today */
  "group", "mobile", "retailstores", "fn:it", "fn:merchandising", "cap:cap6", "co:east", "dir:p1",
  /* a missing target, as text — the three spellings that reach this code */
  "", "undefined", "null",
  /* and nearly-a-prefix, where indexOf and split disagree */
  "capx", "fnord", "cooperations", "u:group", "u:mobile", "dir", "fn:", "cap:", "co:", "cap:cap7",
  /* `u:retailstores` is the unit the made state below switches to projects, so
     the holder namespace has something to answer with (see `doctored`). */
  "u:retailstores",
  /* a key with a colon in it, which a client's own naming can mint */
  "fn:a:b", "cap:a:b"
];
/* The world the two shared rules are asked against — small, and made here so
   the check does not depend on a tenant's stored state (§94.2). */
const WORLD = {
  group: { org: "Demo" },
  units: { mobile: { ukey: "mobile", name: "Mobile" }, retailstores: { ukey: "retailstores", name: "Retail" } },
  functions: { it: { name: "IT" }, merchandising: { name: "Merchandising" } },
  companies: { east: { name: "East", seeGroup: true, seeOthers: false } },
  capabilities: [{ id: "cap6", name: "Product Mindset", fn: "it" }],
  people: {}, unitRoles: {}, access: {}
};

/* ── 1 · THE PARSE ITSELF, AGAINST THE PREFIXES IT REPLACED ───────────────
   Asserted against this file's OWN arithmetic rather than against the base,
   because the base has no `boxRef` to compare with: the five prefixes, spelled
   out here a second time, are what the 90 converted call sites used to say. */
console.log("1 · the parse, against the prefixes it replaced");
{
  const KIND = [["co:", "mid"], ["fn:", "fn"], ["cap:", "cap"], ["dir:", "dir"]];
  let kindMoves = [], keyMoves = [], areaMoves = [], namedMoves = [];
  ADDRESSES.forEach(function (a) {
    const r = NOW.rules.boxRef(a);
    /* what the old hand-sliced readers worked out, written out again */
    let kind = "bu", key = a;
    if (!a || a === "group") { kind = "top"; key = "group"; }
    else KIND.some(function (p) {
      if (a.indexOf(p[0]) === 0) { kind = p[1]; key = a.slice(p[0].length); return true; }
      return false;
    });
    const area = (kind === "fn" || kind === "cap") ? "fn" : "unit";
    const named = !!a && a !== "undefined" && a !== "null";
    if (r.kind !== kind) kindMoves.push([a, kind, r.kind]);
    if (r.key !== key) keyMoves.push([a, key, r.key]);
    if (r.area !== area) areaMoves.push([a, area, r.area]);
    if (r.named !== named) namedMoves.push([a, named, r.named]);
    if (r.at !== String(a)) kindMoves.push([a, "at " + String(a), "at " + r.at]);
  });
  ok(kindMoves.length === 0, "every address reads the kind its prefix always meant", kindMoves);
  ok(keyMoves.length === 0, "every address reads the key its prefix always left", keyMoves);
  ok(areaMoves.length === 0, "a function and a capability are the fn area, the rest are unit", areaMoves);
  ok(namedMoves.length === 0, '"", "undefined" and "null" are the three that name nothing', namedMoves);
  /* Both ends (§94.2): the corpus has to contain each answer, or an agreement
     over addresses that are all one kind proves nothing. */
  const kinds = {};
  ADDRESSES.forEach(function (a) { kinds[NOW.rules.boxRef(a).kind] = 1; });
  ok(Object.keys(kinds).sort().join(",") === "bu,cap,dir,fn,mid,top",
     "the corpus holds every kind, so the agreement above is not one answer repeated",
     Object.keys(kinds).sort());
  ok(ADDRESSES.filter(function (a) { return !NOW.rules.boxRef(a).named; }).length === 3,
     "and it holds all three unnamed spellings");
}

/* ── 2 · EVERY CONVERTED SHARED READER, BOTH BUILDS, EVERY ADDRESS ────── */
console.log("2 · the shared readers answer what they answered at " + BASE);
{
  /* name → how to ask it. Each is a function §531 rewrote in lib/rules.js. */
  const ASK = {
    structLevelOf: function (R, a) { return R.structLevelOf(a); },
    planPageOf: function (R, a) { return R.planPageOf(a); },
    reportPageOf: function (R, a) { return R.reportPageOf(a); },
    descPart: function (R, a) { return R.descPart(a); },
    unitLikeOf: function (R, a) { const u = R.unitLikeOf(WORLD, a); return u ? (u.name || u.ukey || true) : null; },
    /* strategyPageOf is reached through planPageOf for `u_plan`; the other two
       pages it pairs are asked here directly, because the UNIT_PAIR branch is
       the one `UNIT_TARGET` decides and it is the branch that moved. */
    strategyFound: function (R, a) { return R.strategyPageOf(a, "k_found"); },
    strategyProj: function (R, a) { return R.strategyPageOf(a, "k_proj"); },
    strategyReport: function (R, a) { return R.strategyPageOf(a, "k_report"); },
    strategyOther: function (R, a) { return R.strategyPageOf(a, "c_people"); },
    compOfferedDesc: function (R, a) { return R.compOffered(a, "fndesc"); },
    compOfferedCompete: function (R, a) { return R.compOffered(a, "compete"); },
    compOfferedSwot: function (R, a) { return R.compOffered(a, "swot"); },
    /* The four readers that go through `structLevelOf` to a stored level's
       switches: these are what a client's Structure step actually drives, so a
       level answered one kind wrong shows here as a section switched off. */
    foundOn: function (R, a) { return R.foundOn(WORLD.group, a, "aspiration"); },
    foundTitle: function (R, a) { return R.foundTitle(WORLD.group, a); },
    swotTitle: function (R, a) { return R.swotTitle(WORLD.group, a); },
    planOn: function (R, a) { return R.planOn(WORLD.group, a, "pillar"); },
    planTitle: function (R, a) { return R.planTitle(WORLD.group, a); },
    targetParts: function (R, a) { return R.targetParts(WORLD.group, a); },
    levelComponents: function (R, a) { return R.levelComponents(WORLD.group, R.structLevelOf(a)); }
  };
  /* ── ONE READER HAS DELIBERATELY MOVED SINCE, AND IT IS NAMED (§218) ──
     §608 made How we compete a setting a function may carry, so
     `compOffered(fn, "compete")` answers TRUE on every function address
     where it answered false. Asserted as the move, exactly, on precisely the
     addresses `boxRef` calls a function — every other address is still held
     to its old answer, and the move must really have happened. */
  const MOVED2 = { compOfferedCompete: { why: "§608", to: function (a) {
    return NOW.rules.boxRef(a).kind === "fn" ? ["false", "true"] : null; } } };
  Object.keys(ASK).forEach(function (name) {
    const moves = [], kept = [], m = MOVED2[name];
    ADDRESSES.forEach(function (a) {
      let was, now;
      try { was = JSON.stringify(ASK[name](WAS.rules, a)); } catch (e) { was = "threw: " + e.message; }
      try { now = JSON.stringify(ASK[name](NOW.rules, a)); } catch (e) { now = "threw: " + e.message; }
      const want = m ? m.to(a) : null;
      if (want) {
        if (was === want[0] && now === want[1]) kept.push(a);
        else moves.push([a, "expected " + want.join(" → "), was + " → " + now]);
        return;
      }
      if (was !== now) moves.push([a, was, now]);
    });
    ok(moves.length === 0, name + " · unmoved on all " + ADDRESSES.length + " addresses" +
       (m ? " but the ones " + m.why + " moved" : ""), moves);
    if (m) ok(kept.length > 0 && kept.length === ADDRESSES.filter(function (a) { return m.to(a); }).length,
              name + " · and every function address moved as " + m.why + " says", kept);
  });
}

/* ── 3 · THE AUTHORISER'S OWN WORDING AND AREAS ───────────────────────────
   `targetWord` and `ctxOfFn` are not exported, so they are asked through the
   door that reaches them: a refusal's text. Rather than build a whole change
   envelope here, the two are checked against the expressions they replaced —
   written out again, as in section 1 — and the authoriser's own suite
   (scripts/test-authorize.js) is what holds the rest. */
console.log("3 · the authoriser's wording, against the expression it replaced");
{
  const moves = [];
  ADDRESSES.forEach(function (a) {
    const r = NOW.rules.boxRef(a);
    const s = String(a == null ? "" : a);
    /* targetWord's non-capability half, as it read before §531 */
    const wasWord = s === "group" ? "the top layer" : s.replace(/^fn:/, "");
    const nowWord = (r.named && r.kind === "top") ? "the top layer"
                  : (r.kind === "fn" ? r.key : r.at);
    if (r.kind !== "cap" && wasWord !== nowWord) moves.push(["word", a, wasWord, nowWord]);
    /* ctxOfFn's two keys */
    const wasCap = s.indexOf("cap:") === 0 ? s.slice(4) : null;
    const nowCap = r.kind === "cap" ? r.key : null;
    if (wasCap !== nowCap) moves.push(["capId", a, wasCap, nowCap]);
    const wasFn = wasCap ? null : s.replace(/^fn:/, "");
    const nowFn = nowCap ? null : (r.kind === "fn" ? r.key : r.at);
    if (wasFn !== nowFn) moves.push(["fnKey", a, wasFn, nowFn]);
    /* the three `isFn` sites and `capArea` */
    const wasArea = (s.indexOf("fn:") === 0 || s.indexOf("cap:") === 0) ? "fn" : "unit";
    if (wasArea !== r.area) moves.push(["area", a, wasArea, r.area]);
    /* the direction's report-state branch */
    const wasDir = s.indexOf("dir:") === 0;
    if (wasDir !== (r.kind === "dir")) moves.push(["dir", a, wasDir, r.kind === "dir"]);
  });
  ok(moves.length === 0, "the authoriser's five converted expressions read as they read before", moves);
}

/* ── 4 · THE CLIENT'S OWN DATA LAYER, BOTH BUILDS, EVERY ADDRESS ──────────
   config-data.js is not a module — it is inlined into the page by build.py —
   so both builds are loaded in a vm the way scripts/stage1-readings.js loads
   them, over the worked example from db/seed-state.json. Thirty-one functions
   were converted there; every one that can be asked with a target alone is
   asked here, on all 22 addresses, in both builds.

   THE STATE IS A FRESH COPY FOR EACH BUILD and the SAME copy for both, so a
   difference can only come from the code (§94.2). Several of these functions
   READ the viewer and the cycle, which is why they are asked after `hydrate`
   rather than over an empty world: asked over nothing they would all answer
   false and agree perfectly. */
console.log("4 · the client's data layer answers what it answered at " + BASE);
{
  const vm = require("node:vm");
  const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));
  function clientAt(read, state) {
    const build = read("build.py");
    const files = [...build.match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                         .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((m) => m[1]);
    const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Intl, setTimeout });
    vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
    files.forEach(function (f) {
      /* Reading is outside the try and running inside it, for the reason
         scripts/test-stage1-rules.js gives: a file that cannot be READ is a
         failure of this check, while the files that reach for the page at load
         throw and define nothing this check asks for. */
      const code = read(f);
      try { vm.runInContext(code, ctx, { filename: f }); } catch (e) { /* see above */ }
    });
    const run = (code) => vm.runInContext(code, ctx);
    if (run("typeof boxRef") === "undefined" && read === readNow)
      throw new Error("the sources did not alias boxRef");
    if (run("typeof unitLike") !== "function") throw new Error("the sources did not define unitLike");
    ctx.__state = state();
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
  const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
  const readNow = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
  /* NORMALISED FIRST, and this is §54.5's trap exactly: build.py lists the
     shared files as "../../lib/rules.js", relative to src, and git has no
     notion of `..` inside a path — asked for
     "SMP-Project-Folder/src/../../lib/rules.js" it answers that the path
     exists on disk but not in the commit. It did, the first time this section
     ran. So the path is resolved against the repository root and made
     repo-relative before git is asked. */
  const readWas = function (f) {
    const rel = path.relative(ROOT, path.resolve(SRC, f)).split(path.sep).join("/");
    return execFileSync("git", ["show", BASE + ":" + rel],
                        { cwd: ROOT, maxBuffer: 1 << 28 }).toString("utf8");
  };
  /* ── THE TWO STATES, AND WHY THERE ARE TWO (§255, §113.8) ──────────────
     The worked example holds ONE capability, on one function, planned in
     PROJECTS. So `capAsUnit` answers null for it, and the whole
     capability-planned-in-pillars path — the one `unitLike`'s comment is about,
     and the one a stage 3b migration walks — is never entered. Measured: with
     `unitLike`'s `cap:` branch deliberately deleted, the grid over the seed
     alone read UNMOVED, because both builds fell to UNITS["cap:cap6"] and both
     answered null. An agreement like that is worth nothing.
     So the grid runs twice: over the seed as it is, and over a state this file
     MAKES — the capability switched to pillars with a pillar and an objective
     on it, and a SECOND capability on a second function, which is also the
     shape smp-app/tests/graph-diff.cjs's §216 section wants and the seed does
     not have. */
  const plain = () => JSON.parse(JSON.stringify(SEED));
  const doctored = function () {
    const s = plain();
    const caps = s.group.capabilities || (s.group.capabilities = []);
    const first = caps[0];
    if (first) {
      first.format = "pillars";
      first.items = [{ id: "cp1", name: "A pillar on a capability", kind: "Capability",
                       measures: [{ id: "cm1", name: "A measure", dir: "≥", target: "100",
                                    compile: "Latest", actual: "80", weight: 50 }],
                       tactics: [] }];
      first.keyObjectives = [{ id: "ck1", name: "A capability objective", dir: "≥",
                               target: "100", compile: "Latest", actual: "60" }];
    }
    /* On a DIFFERENT function from the first, so "capabilities across several
       functions" is true of this state. */
    const otherFn = (s.functionKeys || []).filter((k) => !first || k !== first.fn)[0];
    caps.push({ id: "cap7", name: "A second capability", fn: otherFn,
                head: null, custodian: null, format: "projects",
                keyObjectives: [], projects: [{ id: "p7", name: "Its project",
                                                outcomes: [], milestones: [] }] });
    /* AND A UNIT THAT PLANS IN PROJECTS (§405). Every unit in the worked
       example plans in pillars, so `unitOwnHolder` answers null for all of
       them and the whole `u:<key>` holder namespace is dead in the grid —
       measured: with `holderById`'s `u:` branch deliberately deleted, the grid
       read UNMOVED. */
    const u2 = (s.unitKeys || [])[1];
    if (u2 && s.units[u2]) {
      s.units[u2].format = "projects";
      s.units[u2].projects = [{ id: "up1", name: "A unit's own project",
                                outcomes: [], milestones: [] }];
      s.units[u2].keyObjectives = s.units[u2].keyObjectives || [];
    }
    return s;
  };
  const STATES = [["the worked example", plain], ["a capability in pillars, and a second one", doctored]];

  let builds = null;
  try {
    builds = STATES.map(function (st) {
      return { name: st[0], now: clientAt(readNow, st[1]), was: clientAt(readWas, st[1]) };
    });
  } catch (e) { ok(false, "both client builds load over both states", e.message); }

  if (builds) {
    /* Each entry is a converted function, called with a target alone. The ones
       that take a second argument, or a holder rather than a target
       (`holderCodeOwner`, `projCode`, `fnWriteBack`, `capWriteBack`), are
       exercised by qa.py and the gap suite instead — named here so the list is
       honest about what it does not reach. */
    const CALLS = [
      "roleWhereLabel(T)", "roleWhereLabel2(T)", "placeLabel(T)",
      "roleHolderAt('owner', T)", "roleHolderAt('fnhead', T)",
      "roleHolderAt('custodian', T)", "roleHolderAt('capowner', T)",
      "foundKeyFor(T)", "koHolderById(T)", "holderById(T)", "holderByIdWritable(T)",
      "unitLike(T) && (unitLike(T).ukey || unitLike(T).name || true)",
      "unitLikeWritable(T) && (unitLikeWritable(T).ukey || unitLikeWritable(T).name || true)",
      "holderTarget(T)", "canSpeakFor(T)", "reportPending(T)", "areaOfTarget(T)",
      "fnKeyOfTarget(T)", "plansInPillars(T)", "plansInObjectives(T)",
      "isCapTarget(T)", "capKeyOf(T)", "capOfTarget(T) && capOfTarget(T).id",
      "subjKey(T)", "subjUnit(T) && (subjUnit(T).ukey || subjUnit(T).name || true)",
      "isUnitHolderId(T)", "fnKoCounted(T)", "fnKoHolder(T)", "swotWritable(T)",
      "competeHolder(T) && (competeHolder(T).ukey || competeHolder(T).org || true)",
      "competeOf(T)", "foundationRecord(T) && (foundationRecord(T).ukey || foundationRecord(T).org || true)",
      "foundationName(T)", "peopleFor(T) && peopleFor(T).here.length",
      "attachPersonAt({}, T)", "gapMap(T) && Object.keys(gapMap(T)).length",
      "focusBands(T) && focusBands(T).length", "myLinesHome()",
      "roleAtWord('owner')", "roleAtWord('custodian')", "roleAtWord('cceo')", "roleAtWord('fnhead')",
      /* ── PART 3's SCREENS, in the same grid (§531.2) ────────────────────
         The deck, the export and the builder read an address too, and they
         are in this vm already because build.py inlines them. Only the ones
         reachable without a DOM are here; `shell.html`'s own script is the
         page body rather than one of build.py's files, so its five converted
         helpers (navLabelFor, capForBounded, isFn, isCapDest, isCo) are not
         in scope at all and are held by qa.py and the browser checks instead.
         Named so the list is honest about what it does not reach. */
      "deckSubject(T) && (deckSubject(T).ukey || deckSubject(T).name || true)",
      "deckCode(T, 'A name')", "masterKind(T)", "deckSubjectWord(T)",
      "deckSubjectName(T)", "planPptxName(T)",
      "impSubjectFormat(T)", "impHolderFor(T) && impHolderFor(T).id",
      "builderRoute(T)", "builderSubjectName(T)", "builderHasPlan(T)",
      "capKoTarget({ id: T })", "capKoTarget({ id: 'x', fn: T })",
      "renderFnSW(T).length"
    ];
    const ask = function (run, call, a) {
      const pre = "var T = " + JSON.stringify(a) + "; ";
      try { return String(run("JSON.stringify((function(){" + pre + "return " + call + ";})())")); }
      catch (e) { return "threw: " + e.message; }
    };
    /* ── ONE ANSWER HAS DELIBERATELY MOVED SINCE, AND IT IS NAMED (§218) ───
       §542 taught `plansInPillars` to answer for the TOP LAYER, which it had
       never done: the company is not in `UNITS`, so `subjUnit("group")` was
       null and a company planning in pillars answered FALSE — which sent
       `subjectAsked("group")` down the holder branch to an empty list and
       left El Abd's Reporting rail unable to say which direction still owed
       a figure, though `askedItems(topAsUnit())` held 42 rows.

       SO THE EXCEPTION IS AN ASSERTION, NOT A SKIP. The grid below still
       holds every other address of this call to its old answer; `group` is
       asserted to have moved from false to true, in both states, which is
       exactly as strict and says why. A check loosened to pass is a check
       deleted slowly (§218); this one gained a line. */
    /* §608: a function holds its own How we compete, so `competeHolder`
       answers it for the two function addresses the corpus names.
       §591: the company's own plan is labelled the company in the Master
       presentation (CO), never a business unit (BU). */
    const MOVED = {
      "plansInPillars(T)": { group: ["false", "true"] },
      "competeHolder(T) && (competeHolder(T).ukey || competeHolder(T).org || true)":
        { "fn:it": ["null", "true"], "fn:merchandising": ["null", "true"] },
      "masterKind(T)": { group: ['"<span class=\\"mfkind\\">BU</span>"', '"<span class=\\"mfkind\\">CO</span>"'] }
    };
    const WHY = { "plansInPillars(T)": "§542",
      "competeHolder(T) && (competeHolder(T).ukey || competeHolder(T).org || true)": "§608",
      "masterKind(T)": "§591" };
    /* §564: THE PLAN DOWNLOAD IS NAMED BY ITS PLACE. It became the deck
       without its figures, and its file takes the deck's own name for the
       box — `placeLabel`, which section 4 holds unmoved above — where it
       used to read only a unit's or a function's name and called every
       other box "Plan". So it is held to AGREE with placeLabel on every
       address, in both states: as strict as the grid, and it says why. */
    const AGREES = { "planPptxName(T)": "(placeLabel(T) || 'Plan') + ' — Strategy plan.pptx'" };
    CALLS.forEach(function (call) {
      const moves = [], expected = MOVED[call] || {}, kept = [];
      if (AGREES[call]) {
        builds.forEach(function (b) {
          ADDRESSES.forEach(function (a) {
            const now = ask(b.now, call, a), want = ask(b.now, AGREES[call], a);
            if (now !== want || now.indexOf("threw: ") === 0) moves.push([b.name, a, want, now]);
          });
        });
        ok(moves.length === 0, call + " · agrees with " + AGREES[call] + " on every address (§564)", moves.slice(0, 6));
        return;
      }
      builds.forEach(function (b) {
        ADDRESSES.forEach(function (a) {
          const was = ask(b.was, call, a), now = ask(b.now, call, a);
          const want = Object.prototype.hasOwnProperty.call(expected, a) ? expected[a] : null;
          if (want) {
            if (was === want[0] && now === want[1]) kept.push([b.name, a]);
            else moves.push([b.name, a, "expected " + want.join(" → "), was + " → " + now]);
            return;
          }
          if (was !== now) moves.push([b.name, a, was, now]);
        });
      });
      ok(moves.length === 0, call + " · unmoved" +
         (Object.keys(expected).length ? " but for " + Object.keys(expected).join(", ") : ""),
         moves.slice(0, 6));
      /* And the named move really happened, in both states — or the
         exception above is covering for a reader that never changed. */
      if (Object.keys(expected).length)
        ok(kept.length === builds.length * Object.keys(expected).length,
           call + " · and " + Object.keys(expected).join(", ") + " moved as " + (WHY[call] || "named") + " says, in both states", kept);
    });
    /* BOTH ENDS AGAIN (§94.2): an agreement where every call threw in both
       builds is no agreement at all, so the run has to have produced real
       answers. Counted over the whole grid rather than asserted per call,
       because several of these legitimately answer null for most addresses. */
    let real = 0;
    builds.forEach(function (b) {
      CALLS.forEach(function (call) {
        ADDRESSES.forEach(function (a) {
          const v = ask(b.now, call, a);
          if (v !== "undefined" && v !== "null" && v !== "false" && v !== '""' &&
              v.indexOf("threw: ") !== 0) real++;
        });
      });
    });
    ok(real > 400, "the grid produced " + real + " answers that are not null, false or empty", real);
    /* And the made state has to have actually entered the path it was made for,
       or the second run is the first run again (§113.8). */
    const capUnit = ask(builds[1].now, "unitLike(T) && unitLike(T).ukey", "cap:cap6");
    ok(capUnit === '"cap:cap6"',
       "in the made state a capability planned in pillars IS read as a unit", capUnit);
    const capSecond = ask(builds[1].now, "capOfTarget(T) && capOfTarget(T).id", "cap:cap7");
    ok(capSecond === '"cap7"', "and the second capability, on a second function, is reachable", capSecond);
    const ownHolder = ask(builds[1].now, "holderById(T) && holderById(T).id", "u:retailstores");
    ok(ownHolder === '"u:retailstores"',
       "and a unit that plans in projects HAS an own holder to answer with", ownHolder);
  }
}

console.log("");
console.log(failed === 0
  ? "UNMOVED — " + passed + " agreements, nothing moved against " + BASE
  : "MOVED — " + failed + " of " + (failed + passed) + " moved");
process.exit(failed === 0 ? 0 : 1);
