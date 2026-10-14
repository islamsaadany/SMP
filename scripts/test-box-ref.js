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
  "capx", "fnord", "cooperations", "u:group", "u:mobile", "dir", "fn:", "cap:", "co:",
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
  Object.keys(ASK).forEach(function (name) {
    const moves = [];
    ADDRESSES.forEach(function (a) {
      let was, now;
      try { was = JSON.stringify(ASK[name](WAS.rules, a)); } catch (e) { was = "threw: " + e.message; }
      try { now = JSON.stringify(ASK[name](NOW.rules, a)); } catch (e) { now = "threw: " + e.message; }
      if (was !== now) moves.push([a, was, now]);
    });
    ok(moves.length === 0, name + " · unmoved on all " + ADDRESSES.length + " addresses", moves);
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

console.log("");
console.log(failed === 0
  ? "UNMOVED — " + passed + " agreements, nothing moved against " + BASE
  : "MOVED — " + failed + " of " + (failed + passed) + " moved");
process.exit(failed === 0 ? 0 : 1);
