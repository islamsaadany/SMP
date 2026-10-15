/* ── WHAT THE MOVE WOULD DO TO THIS CLIENT, PAGE BY PAGE (§539) ───────────
   Spec 066 stage 3b. Islam set the terms: a per-client before-and-after
   shown to him BEFORE anything runs, rehearsed on a copy, and *"nothing will
   change for the users this is just a structural change"*.

   This is that list. It reads a working copy — the file Setup › Reporting
   cycle › Contingency files hands out (§306) — and NEVER writes anything,
   anywhere. The move it rehearses is the product's own `capFoldIntoTop()`
   (§539), not a script's idea of one, so what is shown here is what would
   run (§100.3).

   THREE COLUMNS, BECAUSE TWO CANNOT TELL THE HALVES APART:
     TODAY      the build this client is on, over its state as stored
     THE CODE   this build, over the SAME state, nothing moved — so every
                difference is something the new CODE does on its own
     THE MOVE   this build, after the capabilities become internal pillars

   Usage:
     node scripts/stage3-before-after.js <working-copy.html>
     node scripts/stage3-before-after.js <file> --base <commit>
     node scripts/stage3-before-after.js <file> --words   (show the text too)
   No browser, no database, no network. Nothing is written. */
"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
const argv = process.argv.slice(2);
const input = argv.find((a) => !a.startsWith("--"));
const baseArg = argv.indexOf("--base");
const BASE = baseArg >= 0 ? argv[baseArg + 1] : "b773ac3";
const SHOW = argv.includes("--words");
if (!input) { console.error("usage: node scripts/stage3-before-after.js <working-copy.html> [--base <commit>] [--words]"); process.exit(2); }

const html = fs.readFileSync(input, "utf8");
const m = html.match(/<script type="application\/json" id="smp-offline">([\s\S]*?)<\/script>/);
if (!m) { console.error(path.basename(input) + " holds no smp-offline block — is it a working copy?"); process.exit(2); }
const STATE = JSON.parse(m[1]);
const copy = () => JSON.parse(JSON.stringify(STATE));

const readNow = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const readWas = function (f) {
  const rel = path.relative(ROOT, path.resolve(SRC, f)).split(path.sep).join("/");
  return execFileSync("git", ["show", BASE + ":" + rel], { cwd: ROOT, maxBuffer: 1 << 28 }).toString("utf8");
};
function boot(read, state) {
  const files = [...read("build.py").match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                      .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((x) => x[1]);
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Intl, setTimeout });
  vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
  files.forEach(function (f) { try { vm.runInContext(read(f), ctx, { filename: f }); } catch (e) {} });
  ctx.__s = state;
  vm.runInContext(`(function(x){
    GROUP=x.group; UNIT_KEYS=x.unitKeys; UNITS=x.units;
    FUNCTION_KEYS=x.functionKeys; FUNCTIONS=x.functions;
    if (typeof fnPruneNulls==="function") (FUNCTION_KEYS||[]).forEach(function(k){ fnPruneNulls(FUNCTIONS[k]); });
    COMPANY_KEYS=x.companyKeys||[]; COMPANIES=x.companies||{};
    PEOPLE=x.people; UNIT_ROLES=x.unitRoles; ACCESS=x.access;
    LABELS.entries=x.labels; BANDS.bands=x.bands;
    KO_WEIGHTS=x.koWeights||{}; CYCLE=x.cycle; REVIEW=x.review;
    HISTORY=x.history; ARCHIVES=x.archives||[]; PRIOR_CYCLE=x.priorCycle||{factors:[]};
    UNIT_KEYS.forEach(function(k){ UNITS[k].ukey=k; }); syncWeights();
  })(__s)`, ctx);
  return (c) => vm.runInContext(c, ctx);
}
const WORDS = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/&middot;/g, "·")
  .replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&rarr;/g, "→")
  .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/* Every page the company's capabilities are drawn on. The capabilities TAB is
   drawn by two different renderers before and after — that is the whole of
   stage 3b (c) — so it is listed as a pair and compared across them. */
const PAGES = {
  "Strategy · the pillars tab":  [`drawHalf("dir", function(){ return renderUnitPlan(topAsUnit()); })`],
  "Strategy · the capabilities tab":
    [`renderTopCaps()`, `drawHalf("cap", function(){ return renderUnitPlan(topAsUnit()); })`],
  "Strategy · Foundation":       [`renderGroupFoundation()`],
  "Strategy · SWOT":             [`renderUnitAnalysis(topAsUnit())`],
  "Performance · its sections":  [`(renderGroupPerformance(), JSON.stringify(GROUP_SECTIONS))`],
  "Reporting":                        [`renderReport(topAsUnit())`],
  "Temple":                           [`renderTemple()`],
  "The review deck":                  [`deckHtmlFor("group")`],
  "Focus board":                      [`JSON.stringify(focusBands())`]
};

let today, code, moved;
try { today = boot(readWas, copy()); }
catch (e) { console.error("the build at " + BASE + " would not load: " + e.message); process.exit(1); }
code = boot(readNow, copy());
moved = boot(readNow, copy());

const org = code(`GROUP.org || ""`);
console.log("STAGE 3b · WHAT THE MOVE WOULD DO, PAGE BY PAGE");
console.log("source: " + path.basename(input) + (org ? "   client: " + org : ""));
console.log("today's build: " + BASE + "   ·   nothing below is written anywhere");
console.log("");

/* ── 1 · can it run at all ─────────────────────────────────────────────── */
const blockers = moved(`capFoldBlockers()`);
if (blockers.length) {
  console.log("THE MOVE IS REFUSED on this client. " + blockers.length + " capabilit" +
              (blockers.length === 1 ? "y is" : "ies are") + " not one clean pillar:");
  blockers.forEach(function (b) { console.log("   " + (b.name || b.id) + " — " + b.why.join("; ")); });
  console.log("");
  console.log("Nothing below would run until each is dealt with. Stopping here.");
  process.exit(0);
}
const plan = moved(`capFoldPlan()`);
if (!plan.length) { console.log("This client stores no capabilities to move. Nothing to do."); process.exit(0); }

console.log("1 · THE ROWS THAT MOVE — " + plan.length + ", each already exactly one pillar");
console.log("   CODE          NAME                                   OWNER                 CONTENT       ROW ID");
plan.forEach(function (r) {
  const code2 = r.was === r.becomes ? r.was + " → same" : r.was + " → " + r.becomes;
  console.log("   " + code2.padEnd(13) + " " + String(r.name).slice(0, 38).padEnd(38) + " " +
    String(r.owner || "—").padEnd(21) + " " +
    (r.measures + "m / " + r.tactics + "t").padEnd(13) + " " + r.pillarId);
});
const kept = plan.every(function (r) { return r.was === r.becomes; });
console.log("   " + (kept ? "EVERY CODE IS UNCHANGED." : "SOME CODES CHANGE — read the column above."));
console.log("   Every row id is kept, so every figure, snapshot and submitted report still points at it.");
console.log("");

moved(`capFoldIntoTop()`);

/* ── 2 · page by page ──────────────────────────────────────────────────── */
console.log("2 · PAGE BY PAGE");
console.log("   " + "".padEnd(34) + "THE CODE ALONE      AND THE MOVE");
const notes = [];
Object.keys(PAGES).forEach(function (name) {
  const pair = PAGES[name], first = pair[0], last = pair[pair.length - 1];
  let a, b, c;
  try { a = WORDS(today(first)); } catch (e) { a = "threw: " + e.message; }
  try { b = WORDS(code(first)); } catch (e) { b = "threw: " + e.message; }
  try { c = WORDS(moved(last)); } catch (e) { c = "threw: " + e.message; }
  const codeSame = a === b, moveSame = b === c;
  console.log("   " + name.padEnd(34) +
    (codeSame ? "same            " : "CHANGED         ") + "    " +
    (moveSame ? "same" : "CHANGED"));
  if (!codeSame) notes.push([name, "the code alone", a, b]);
  if (!moveSame) notes.push([name, "the move", b, c]);
});
console.log("");
if (!notes.length) console.log("   Nothing on any page reads differently. ");
else {
  console.log("3 · EVERY DIFFERENCE, IN FULL");
  notes.forEach(function (n) {
    let i = 0; while (i < n[2].length && i < n[3].length && n[2][i] === n[3][i]) i++;
    console.log("");
    console.log("   " + n[0] + " — " + n[1]);
    console.log("      was: …" + n[2].slice(Math.max(0, i - 60), i + (SHOW ? 400 : 180)));
    console.log("      now: …" + n[3].slice(Math.max(0, i - 60), i + (SHOW ? 400 : 180)));
  });
}
console.log("");
console.log("Nothing here has been changed. This script only reads.");
