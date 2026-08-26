/* ── The assistant's corpus, generated from the platform's own sources ──────
   `node scripts/extract-kb.js` writes `db/kb.json`, which is what the office
   assistant answers from. Nothing here is authored: every word is already on
   the Knowledge base page or behind an Info button, so the words a person
   reads and the words the assistant answers from cannot drift (§42, applied to
   prose — the same argument that makes `lib/rules.js` one file and
   `db/seed-state.json` generated rather than typed).

   THREE SOURCES, AND ONLY ONE OF THEM WAS EASY.

   · `recipes.js` and `pageinfo.js` are plain data and are simply evaluated.

   · The Knowledge base page's own nine sections are prose inside `renderKB()`
     — but they are prose PASSED TO A FUNCTION: `kbSection(id, title, blocks)`
     takes an array of `{h, p}` objects. So they are captured AT THE CALL, by
     evaluating `config-render.js` with `kbSection` stubbed to record its
     arguments and then running `renderKB()`. No parsing, no regex over source,
     and no copy: if somebody edits a paragraph on that page, this picks it up
     on the next run.

   THE SANDBOX RETURNS A NO-OP FOR ANY GLOBAL IT DOES NOT KNOW, deliberately.
   `config-render.js` is four thousand lines and reaches for a great deal that
   has nothing to do with the knowledge base; enumerating those would make this
   file break every time that one grew. A Proxy answering "a function that
   returns an empty string" for the unknown is what lets it stay a capture
   rather than becoming a second implementation.

   OUTPUT IS DETERMINISTIC — no timestamp, no ordering by anything unstable —
   so re-running with nothing changed produces a byte-identical file and an
   empty diff. A generated artefact that always looks changed is one nobody
   reads the diff of. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder/src");
const read = function (f) { return fs.readFileSync(path.join(SRC, f), "utf8"); };

/* A global object that answers for anything: known values first, then a
   function that returns "" for anything else. Assignments land in `store`. */
function sandbox(known) {
  const store = Object.assign({ console: console, JSON: JSON, Math: Math,
                                Object: Object, Array: Array, String: String,
                                Number: Number, Boolean: Boolean, Date: Date,
                                RegExp: RegExp, isNaN: isNaN, parseInt: parseInt,
                                parseFloat: parseFloat, undefined: undefined },
                              known);
  const noop = function () { return ""; };
  return new Proxy(store, {
    has: function () { return true; },              /* every name resolves */
    get: function (t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      return noop;
    },
    set: function (t, k, v) { t[k] = v; return true; }
  });
}

/* `tolerant` is for a file evaluated ONLY for something it declares early.
   config-data.js is a browser file four thousand lines long and reaches for
   `localStorage` on the way down; we need `LABELS`, which is declared at the
   top. So the throw is expected and swallowed, and WHAT WE CAME FOR IS
   ASSERTED INSTEAD — which is the stronger check anyway: it fails if the
   declaration moves below the throw, and swallowing tells us nothing on its
   own (§54.5: a check that asks whether it can run is a check that passes). */
function runIn(ctx, code, label, tolerant) {
  try {
    vm.runInContext(code, ctx, { filename: label });
  } catch (e) {
    if (tolerant) return;
    throw new Error("could not evaluate " + label + ": " + e.message);
  }
}

/* ── 1 · The recipes ──────────────────────────────────────────────── */
const recCtx = vm.createContext(sandbox({ module: { exports: {} } }));
runIn(recCtx, read("recipes.js"), "recipes.js");
const recipes = recCtx.recipesFlat();

/* ── 2 · Every page's Info panel ──────────────────────────────────── */
const piCtx = vm.createContext(sandbox({}));
runIn(piCtx, read("pageinfo.js"), "pageinfo.js");
const PAGE_INFO = piCtx.PAGE_INFO || {};
const pages = Object.keys(PAGE_INFO).map(function (k) {
  const e = PAGE_INFO[k] || {};
  return { id: "page:" + k, title: e.title || k,
           blocks: (e.body || []).map(function (b) {
             return { h: b[0] || null, p: b[1] || "" };
           }) };
});

/* ── 3 · The Knowledge base page's own sections, captured at the call ── */
/* config-data.js is evaluated only for LABELS — the shipped vocabulary that
   `L()` reads. Everything else it defines is discarded with its sandbox. */
const cdCtx = vm.createContext(sandbox({}));
runIn(cdCtx, read("config-data.js"), "config-data.js", true);
const LABELS = cdCtx.LABELS;
if (!LABELS || !Array.isArray(LABELS.entries) || !LABELS.entries.length)
  throw new Error("LABELS did not evaluate — has it moved below a browser-only line?");

const caught = [];
const kbCtx = vm.createContext(sandbox({
  /* THE REAL LABELS, not a stubbed L(). config-render.js declares its own
     `L()`, and a function declaration hoists over anything the sandbox
     supplies — so the way to control it is to give it what it reads. Taken
     from config-data.js, which is where the shipped defaults live: kb.json
     belongs to the PRODUCT, and a tenant that renames a pillar has its own
     word substituted when the corpus is read, not baked in here (§65). */
  LABELS: LABELS,
  section: function () { return ""; },
  cfgHead: function () { return ""; },
  esc: function (x) { return String(x == null ? "" : x); },
  plural: function (n, w, many) { return n === 1 ? w : (many || w + "s"); },
}));
/* recipes.js is evaluated INTO this sandbox as well, rather than `kbRecipes`
   being stubbed. Second time the same lesson: config-render.js declares
   `kbRecipes()` itself and a function declaration hoists over anything the
   sandbox supplies, so the way to control one of its functions is to give it
   what it READS, never to try replacing it. Harmless here — the recipes are
   captured from their own file above, and what renderKB does with them is
   pushed straight into its own array rather than through kbSection(). */
runIn(kbCtx, read("recipes.js"), "recipes.js (into the page's sandbox)");
runIn(kbCtx, read("config-render.js"), "config-render.js");
if (typeof kbCtx.renderKB !== "function") throw new Error("renderKB is not defined — did it move?");

/* THE CAPTURE IS INSTALLED AFTER EVALUATION, NOT BEFORE — and this is the
   third time the same lesson bit in this one file. `config-render.js` declares
   `kbSection()` itself, and a function declaration hoists over anything the
   sandbox supplied, so a stub passed in at construction is simply overwritten
   the moment the file is evaluated. `L()` and `kbRecipes()` were the first
   two, and there the answer was to feed the function its DATA; here there is
   no data to feed, so the function itself is replaced once the file has
   finished defining it. `renderKB()` looks `kbSection` up at call time, which
   is what makes that work.

   Caught by the guard below rather than by reading — the first two runs wrote
   a corpus with a third of it silently missing. */
kbCtx.kbSection = function (id, title, blocks) {
  caught.push({ id: "kb:" + id, title: title,
                blocks: (blocks || []).map(function (b) {
                  return { h: b.h || null, p: b.p || "" };
                }) });
  return "";
};
kbCtx.renderKB();

if (!caught.length) {
  /* LOUDLY, NEVER QUIETLY. A capture that silently returns nothing would write
     a corpus missing a third of itself and the assistant would decline
     questions it can answer — §54.5's rule: a check that asks whether it can
     run is a check that passes. */
  throw new Error("no kbSection() calls were captured — the page's shape has changed");
}

const out = {
  note: "Generated by scripts/extract-kb.js from the platform's own sources. " +
        "Do not edit: edit the Knowledge base page, pageinfo.js or recipes.js.",
  sections: caught,
  pages: pages,
  recipes: recipes
};

const dest = path.join(ROOT, "db/kb.json");
const text = JSON.stringify(out, null, 1) + "\n";
const before = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : null;

/* `--check` writes nothing and fails if the committed corpus is out of step
   with the sources — the same discipline `build.py` has, where the built file
   must be byte-identical to the shipped one. A generated artefact nobody
   regenerates is a copy, and a copy is the thing this file exists to avoid. */
if (process.argv.indexOf("--check") > -1) {
  if (before === text) { console.log("db/kb.json is in step with the sources"); process.exit(0); }
  console.log("db/kb.json is STALE — run `node scripts/extract-kb.js`");
  process.exit(1);
}
fs.writeFileSync(dest, text);

const words = function (t) { return String(t).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length; };
let n = 0;
caught.forEach(function (s) { s.blocks.forEach(function (b) { n += words(b.h) + words(b.p); }); });
pages.forEach(function (s) { s.blocks.forEach(function (b) { n += words(b.h) + words(b.p); }); });
recipes.forEach(function (r) { n += words(r.q) + words(r.a); });

console.log("db/kb.json written" + (before === text ? " (unchanged)" : ""));
console.log("  " + caught.length + " knowledge-base sections");
console.log("  " + pages.length + " page explainers");
console.log("  " + recipes.length + " recipes (" +
            recipes.filter(function (r) { return r.who === "office"; }).length + " for the office)");
console.log("  ~" + n + " words, about " + Math.round(n * 1.35 / 100) * 100 + " tokens");
