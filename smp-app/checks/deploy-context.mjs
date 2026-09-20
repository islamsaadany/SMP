/* WHAT REACHES THE BUILD (§317.3).

   `.vercelignore` decides which files are uploaded before Vercel builds
   anything, and it was written for the FROZEN deployment — which served the
   whole repository as static files, so everything internal had to be named
   in it or it was fetchable. On the new stack Next serves `public/` and its
   own output and nothing else, so that job is done by the framework; what
   the file still decides is what the BUILD can read.

   AND EXCLUDING SOMETHING THE BUILD READS IS NOT A SMALLER DEPLOYMENT, IT IS
   NO DEPLOYMENT. `smp-app/` was listed, so with the Root Directory pointed at
   it Vercel deleted the app, found nothing to build (13ms, "Build output
   contains no functions, static, or services directory") and published an
   empty deployment that answered 404 on every address — the door, /platform,
   every client, the demo — marked Ready throughout. Nothing in a build log
   says "you excluded the thing you asked me to build"; it says the output is
   empty, which reads like a hundred other faults.

   SO THE LIST IS DERIVED, NEVER KEPT (§53.5). build.py's own script list,
   sync-css's ORDER, sync-static's FILES and frozen.cjs's FILES are read out
   of those files, so a source the product gains tomorrow is checked the day
   it is added rather than the day somebody remembers this file exists.

   AND THE PATTERNS ARE ASSERTED ANCHORED. .gitignore syntax matches a bare
   `scripts/` at ANY depth, so the previous file's would have deleted
   `smp-app/scripts/` — the build scripts themselves — the moment `smp-app/`
   stopped being excluded, producing the same empty output one log line
   further on. That is not hypothetical: measured before it could happen.

     node checks/deploy-context.mjs
     node checks/deploy-context.mjs --break=ignore-app   # must go red     */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, unlinkSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const ROOT = join(APP, "..");
const SRC = join(ROOT, "SMP-Project-Folder", "src");
const BREAK = (process.argv.find((a) => a.startsWith("--break=")) || "").split("=")[1] || "";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

/* ── the list the app reaches for, read out of the code that reaches ── */
const buildPy = readFileSync(join(SRC, "build.py"), "utf8");
const scripts = [...buildPy.matchAll(/\("([A-Z]+)","([^"]+)"\)/g)].map((m) => m[2]);
if (scripts.length < 20) throw new Error("deploy-context: build.py's list was not read");

const arrayOf = (file, name) => {
  const s = readFileSync(file, "utf8");
  const m = new RegExp("const " + name + "\\s*=\\s*\\[([\\s\\S]*?)\\]").exec(s);
  if (!m) throw new Error("deploy-context: " + name + " was not found in " + file);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const css = arrayOf(join(APP, "scripts", "sync-css.mjs"), "ORDER");
const stat = arrayOf(join(APP, "scripts", "sync-static.mjs"), "FILES");
const frozen = arrayOf(join(APP, "lib", "frozen.cjs"), "FILES");

/* AND EVERY `../../` THE APP'S OWN CODE REACHES FOR, READ OUT OF THAT CODE
   (§317.9). The first version of this list was typed, and it was typed
   short: scripts/seed-demo.mjs requires the frozen renaming script at the
   repository root and `/scripts/` was excluded, so the cutover build failed
   one line AFTER the carry had completed — the check that exists for exactly
   this had been green over it. A list kept beside the code is what §53.5
   warns about; this is the code asked instead. */
const reaches = [];
for (const dir of ["scripts", "lib"]) {
  for (const f of readdirSync(join(APP, dir))) {
    if (!/\.(mjs|cjs|ts)$/.test(f)) continue;
    const text = readFileSync(join(APP, dir, f), "utf8");
    for (const m of text.matchAll(/["']\.\.\/\.\.\/([^"']+)["']/g)) {
      const rel = m[1];
      if (rel.startsWith("SMP-Project-Folder/src")) continue;   /* covered file by file above */
      reaches.push(rel);
    }
  }
}

const NEEDED = [
  ...reaches,
  ...scripts.map((f) => "SMP-Project-Folder/src/" + f),
  ...css.map((f) => "SMP-Project-Folder/src/" + f),
  ...frozen.map((f) => "SMP-Project-Folder/src/" + f),
  "SMP-Project-Folder/src/build.py",
  "SMP-Project-Folder/src/shell.html",
  "SMP-Project-Folder/src/theme.js",
  "SMP-Project-Folder/src/fonts/Source_Sans_3.woff2",
  ...stat,
  "platform.html", "sw.js", "index.html", "vercel.json", "db/seed-state.json",
];

/* ── what .vercelignore actually removes, asked of git rather than
      re-implemented: the same syntax, the same matcher Vercel uses ── */
const IGNORE = join(ROOT, ".vercelignore");
let restore = null;
if (BREAK === "ignore-app") {
  restore = readFileSync(IGNORE, "utf8");
  writeFileSync(IGNORE, restore + "\nsmp-app/\n");
}
if (BREAK === "unanchored") {
  /* The trap as it was: a bare `scripts/` matches at any depth, so it eats
     smp-app/scripts/ — the build scripts themselves. */
  restore = readFileSync(IGNORE, "utf8");
  writeFileSync(IGNORE, restore + "\nscripts/\n");
}
if (BREAK === "ignore-scripts") {
  /* §317.9 as it happened: the ROOT scripts folder excluded, taking the
     frozen renaming script the demo seed requires with it. */
  restore = readFileSync(IGNORE, "utf8");
  writeFileSync(IGNORE, restore + "\n/scripts/\n");
}
let removed;
try {
  removed = new Set(execFileSync("git", ["ls-files", "-ci", "--exclude-from=" + IGNORE],
    { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean));
} finally {
  if (restore !== null) writeFileSync(IGNORE, restore);
}

console.log("\n1 · every file the app reaches for outside its own folder");
const swallowed = NEEDED.filter((f) => removed.has(f));
check("nothing the build or the runtime reads is excluded (" + NEEDED.length + " files)",
  swallowed.length === 0, swallowed.slice(0, 6).join(", "));
/* BOTH ENDS (§94.2): a list of files that do not exist is not excluded
   either, and would pass the assertion above perfectly. */
const missing = NEEDED.filter((f) => !existsSync(join(ROOT, f)));
check("…and every one of them is actually there", missing.length === 0, missing.slice(0, 6).join(", "));

console.log("\n2 · the app's own folder");
const app = [...removed].filter((f) => f.startsWith("smp-app/"));
check("no part of smp-app/ is excluded", app.length === 0, app.length + " files, e.g. " + app.slice(0, 3).join(", "));

console.log("\n3 · the patterns are anchored");
const loose = readFileSync(IGNORE, "utf8").split("\n")
  .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  .filter((l) => !l.startsWith("/"));
check("every pattern starts at the repository root", loose.length === 0, loose.join(", "));

console.log("\n4 · and it still keeps something out");
/* A .vercelignore that excluded NOTHING would satisfy every assertion above,
   which is the shape §94.2 keeps naming: the absence needs the presence
   beside it or the check passes on an empty file. */
check("the checks, the mockups and the specs stay out of the deployment",
  removed.size > 200 &&
  [...removed].some((f) => f.startsWith("SMP-Project-Folder/src/checks/")) &&
  [...removed].some((f) => f.startsWith("specs/")),
  removed.size + " files excluded");

/* ── 5 · AND WHAT REACHES THE BUILD IS NOT ONLY FILES (§374) ──────────
   A package the server loads through a require the BUNDLER CANNOT SEE is
   never traced into a function, so it is missing from the deployment however
   correctly it is declared in package.json. Two were:
   `createRequire(import.meta.url)("@vercel/blob")` in lib/blob-api.ts, and
   `require("web-push")` inside lib/push.cjs — which is itself loaded that
   way, so nothing static ever looks inside it. Measured on the built app:
   0 of their files in all nineteen route traces, while `pg` — named in
   `serverExternalPackages` — was in all nineteen.

   NEITHER FAILED LOUDLY, WHICH IS WHY THIS EXISTS. Both loaders catch, by
   design (§231.3: a notification helper must not take the chat down with
   it), so the deployment degrades to a sentence about a store that is not
   set up, on a deployment whose store was set up. It had already happened
   once and was never explained — §282 records *why `web-push` was once
   missing from the deployment was never established*.

   THE RULE IS ASSERTED, NOT THE TWO NAMES (§104.7, §53.5): every package
   loaded this way must be named in `serverExternalPackages`, which is what
   carries it. A third one added next month is checked the day it is added
   rather than the day somebody remembers this paragraph. Needs no build, no
   browser and no database — it is the sources asked about themselves. */
console.log("\n5 · every package the server loads by a require the bundler cannot see");
const NODE = new Set(builtinModules);
const pkgOf = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
const scan = (dir, deep) => {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) { if (deep) out.push(...scan(full, deep)); continue; }
    if (!/\.(ts|tsx|mjs|cjs)$/.test(e.name)) continue;
    out.push([full, readFileSync(full, "utf8")]);
  }
  return out;
};
const loaded = new Map();                   /* package -> where it is reached */
for (const [file, text] of [...scan(join(APP, "lib"), false), ...scan(join(APP, "app"), true)]) {
  /* A `.cjs` here is only ever reached through createRequire, so the bundler
     never looks inside it and EVERY require in it is invisible; a `.ts` hides
     one only where it spells createRequire itself. */
  const cjs = file.endsWith(".cjs");
  const hits = cjs ? text.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)
                   : text.matchAll(/createRequire\([^)]*\)\(\s*["']([^"']+)["']\s*\)/g);
  for (const m of hits) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("node:") || NODE.has(spec)) continue;
    if (!loaded.has(spec)) loaded.set(spec, file.replace(APP + "/", ""));
  }
}
/* Read out of next.config.ts rather than kept here — the list that carries
   them is the one that must name them. */
const CONFIG = join(APP, "next.config.ts");
let cfgRestore = null;
if (BREAK === "drop-external") {
  /* The state that shipped: the package declared in package.json, reached by
     a require nothing can see, and not named here. */
  cfgRestore = readFileSync(CONFIG, "utf8");
  writeFileSync(CONFIG, cfgRestore.replace(/,\s*"@vercel\/blob"/, ""));
}
let external;
try {
  const cfg = readFileSync(CONFIG, "utf8");
  const m = /serverExternalPackages:\s*\[([\s\S]*?)\]/.exec(cfg);
  if (!m) throw new Error("deploy-context: next.config.ts no longer sets serverExternalPackages");
  external = new Set([...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
} finally {
  if (cfgRestore !== null) writeFileSync(CONFIG, cfgRestore);
}
const scanned = BREAK === "no-scan" ? [] : [...loaded.keys()];
const stranded = scanned.filter((spec) => !external.has(pkgOf(spec)));
check("every one of them is named in serverExternalPackages, so the build carries it"
      + " (" + scanned.map((k) => k + " ← " + loaded.get(k)).join(", ") + ")",
  stranded.length === 0, stranded.join(", ") + " — declared in package.json and traced into nothing");
/* BOTH ENDS (§94.2, §54.5): a scan that matched nothing finds nothing
   stranded and reports a clean run, which is the failure this whole section
   is about wearing a green tick. */
check("…and the scan found the requires it is about", scanned.length > 0,
  "nothing matched — the check reached no code, so it proved nothing");

console.log("\n%d ok, %d failed", ok, bad.length);
if (bad.length) { console.log("FAILED: " + bad.join("; ")); process.exit(1); }
