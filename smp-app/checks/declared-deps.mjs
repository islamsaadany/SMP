/* EVERY PACKAGE THE DEPLOYED APP NEEDS IS DECLARED WHERE IT IS INSTALLED FROM.

   Vercel's Root Directory is `smp-app`, so the build installs from
   `smp-app/package.json` and nothing else — the repository root's own
   dependencies are never installed. A package this app's code requires and
   that file does not name is therefore absent on the deployment, and present
   on every laptop, because Node walks UP from the file and finds the root's
   `node_modules` there. That difference is the whole of why this check exists.

   AND IT HAS ALREADY BITTEN TWICE, SILENTLY, WHICH IS WHY IT IS A CHECK
   RATHER THAN A HABIT. Both of the modules that load an optional package do
   it inside a `try` and degrade in words rather than throwing — which is
   right (§231.3: a notification helper degrades to no push, never to no
   conversation; §261: a missing store is said and the rest of the library
   works). The cost of being right about that is that an absent package looks
   exactly like a store nobody has set up yet:

     · `@vercel/blob` — missing since the cutover, so a video clip could not
       load on the deployment and the reason read as "no store here";
     · `web-push`     — missing since the cutover, so notifications were off
       and the diagnostic said the library did not load (§231.3's own
       sentence, telling the truth about a cause nobody could see).

   WHAT IS ASSERTED IS THE RULE, never a list of names (§94.8): every bare
   specifier this app's own code imports is either Node's own, or Next's
   framework-provided, or a declared dependency. A package added tomorrow is
   covered the day it is added.

   Run:  node checks/declared-deps.mjs
         node checks/declared-deps.mjs --break=drop   (must go red)
   No database, no network. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";

const APP = dirname(dirname(fileURLToPath(import.meta.url)));
const BREAK = process.argv.slice(2).find((a) => a.startsWith("--break="))?.split("=")[1] || "";

const bad = [];
const check = (what, good, detail) => {
  if (good) console.log("  ok   " + what);
  else { console.log("  FAIL " + what + (detail ? "  — " + detail : "")); bad.push(what); }
};

/* The code that SHIPS. `checks/` and `spike/` are not deployed and may import
   whatever they like; `scripts/` IS run by the build, so it counts. */
const DIRS = ["app", "lib", "scripts"];
const walk = (d) => {
  let out = [];
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(n)) out.push(p);
  }
  return out;
};

/* A bare specifier is one that is not a path and not a URL. The package it
   names is the first segment, or the first two when it is scoped.

   `createRequire(...)("pkg")` IS ONE OF THE FORMS, and it had to be, because
   it is exactly how the two optional packages are loaded — a plain `require`
   is not available in a module, so the one shape that matters most here is
   the one a naive sweep walks past. Found by the first run reporting
   `@vercel/blob` as wanted by nobody.

   AND THE NAME IS TESTED, NOT TRUSTED (§96.2's shape): the first run also
   swept up two English sentences, because a multi-line string inside a
   `from`-looking construction matches a specifier pattern perfectly. An npm
   package name has no spaces and no newlines, so asking whether the match IS
   a package name costs one test and removes the whole class. */
const SPEC = /(?:require\(\s*["']([^"'\n]+)["']\s*\)|from\s+["']([^"'\n]+)["']|import\(\s*["']([^"'\n]+)["']\s*\)|createRequire\([^)]*\)\(\s*["']([^"'\n]+)["']\s*\))/g;
const NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const packageOf = (s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]);

const pkg = JSON.parse(readFileSync(join(APP, "package.json"), "utf8"));
let declared = new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})]);
if (BREAK === "drop") declared = new Set([...declared].filter((k) => k !== "web-push" && k !== "@vercel/blob"));

const builtins = new Set([...builtinModules, ...builtinModules.map((m) => "node:" + m)]);
/* Next provides these to the code it builds; they are not dependencies to
   declare and never appear in a package.json. */
const FRAMEWORK = new Set(["next", "react", "react-dom", "server-only", "client-only"]);

const wanted = new Map();          // package -> the first file that asks for it
for (const dir of DIRS) {
  for (const file of walk(join(APP, dir))) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(SPEC)) {
      const spec = m[1] || m[2] || m[3] || m[4];
      if (!spec || spec.startsWith(".") || spec.startsWith("/") || spec.includes("://")) continue;
      const p = packageOf(spec);
      if (!NAME.test(p)) continue;
      if (builtins.has(p) || builtins.has(spec)) continue;
      if (!wanted.has(p)) wanted.set(p, file.slice(APP.length + 1));
    }
  }
}

console.log("\n1 · what the shipped code asks for");
console.log("     " + [...wanted.keys()].sort().join(", "));
check("the sweep found something to check, or every assertion below is vacuous (§113.8)",
  wanted.size >= 3, String(wanted.size));

console.log("\n2 · every one of them is declared where the build installs from");
const missing = [...wanted].filter(([p]) => !declared.has(p) && !FRAMEWORK.has(p));
check("no package is needed and undeclared",
  missing.length === 0,
  missing.map(([p, f]) => p + " (wanted by " + f + ")").join("; "));

/* BOTH ENDS (§94.2): a build that declared every package in the registry
   would satisfy the assertion above, so the two that have actually bitten are
   named here — not as the rule, but as the evidence the rule is live. */
console.log("\n3 · the two that were missing, by name");
for (const p of ["@vercel/blob", "web-push"]) {
  check(p + " is declared, and something still asks for it",
    declared.has(p) && wanted.has(p),
    "declared=" + declared.has(p) + " wanted=" + wanted.has(p));
}

console.log("\n" + (bad.length ? "FAILED: " + bad.length : "declared-deps: all clear"));
process.exit(bad.length ? 1 : 0);
