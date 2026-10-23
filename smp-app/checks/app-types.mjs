/* THE APP SEES THE CARRIED RULE MODULES' OWN TYPES (§592) — no browser, no
   database. This app loads four plain-JavaScript modules carried from the
   frozen product (§330) — the shared rules, the change-list differ, the
   authoriser and the platform's own rules — and `require` hands back `any`,
   so until §592 no call from here into a rule was checked at all.
   lib/shared-types.ts reads each module's types out of the module itself
   (allowJs on, checkJs off) and closes them (§589: a JavaScript object is
   open, so a misspelt rule would read as `any`); every load is declared
   with one.

   This asserts the three things that keep that true, none of which the
   app's own typecheck would say out loud if it stopped being so:
     · every load of one of the four, in every .ts/.tsx here, carries its
       type — a new file loading the rules bare is `any` again, silently;
     · tsconfig keeps allowJs on and checkJs off;
     · the app's checker reports nothing in the files that load them.

   --red breaks each of the seven below IN PLACE, runs the same assertions,
   and puts the file back byte for byte in a `finally` (§94.2) — copying the
   app would mean copying its generated Prisma and route types too. Red only
   when the failure names the broken file.

     node checks/app-types.mjs          # run from smp-app/
     node checks/app-types.mjs --red    # every break must go red */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const TSC = join(APP, "node_modules", "typescript", "bin", "tsc");
const MODULES = { "rules.cjs": "Rules", "graph-diff.cjs": "Differ", "authorize.cjs": "Authorizer", "platform-rules.cjs": "PlatformRules" };

const BREAKS = {
  "rule-misspelt": ["lib/blob-api.ts", "if (!R.isSuperRole(person.role))", "if (!R.isSuperRol(person.role))"],
  "rule-short": ["lib/blob-api.ts", 'if (R.grantIn(world, person, area, target) !== "edit") return false;',
                 'if (R.grantIn(world, person, area) !== "edit") return false;'],
  "not-a-grant": ["lib/blob-api.ts", 'if (R.grantIn(world, person, area, target) !== "edit") return false;',
                  'if (R.grantIn(world, person, area, target) !== "edited") return false;'],
  "differ-misspelt": ["lib/save.ts", "D.applyChanges(JSON.parse", "D.applyChange(JSON.parse"],
  "authorizer-misspelt": ["lib/save.ts", 'const { authorize } = require("./authorize.cjs") as Authorizer;',
                          'const { authorise: authorize } = require("./authorize.cjs") as Authorizer;'],
  "platform-rule-misspelt": ["lib/platform-api.ts", "const was = FF.grantIn(world, areaKey);", "const was = FF.grantInn(world, areaKey);"],
  "untyped-load": ["lib/people.ts", 'const R = need("./rules.cjs") as Rules;', 'const R = need("./rules.cjs");'],
};

function sources(dir = APP, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n === ".next" || n === "generated" || n.startsWith(".")) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(ts|tsx)$/.test(n) && !n.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

/* Every failure carries the file it is about, so --red can ask whether the
   broken file is the one named. */
function run() {
  const fails = [];
  const loads = [];
  for (const p of sources()) {
    const rel = relative(APP, p), src = readFileSync(p, "utf8");
    for (const [mod, type] of Object.entries(MODULES)) {
      const re = new RegExp('\\(\\s*"[./]*(?:lib/)?' + mod.replace(/[.-]/g, "\\$&") + '"\\s*\\)([^;\\n]*)', "g");
      for (const m of src.matchAll(re)) {
        if (rel === "lib/shared-types.ts") continue;
        loads.push(rel);
        if (!new RegExp("^\\s*as\\s+" + type + "\\b").test(m[1]))
          fails.push({ file: rel, what: "loads " + mod + " without `as " + type + "` — it is `any` there" });
      }
    }
  }
  const ts = readFileSync(join(APP, "tsconfig.json"), "utf8");
  if (!/"allowJs":\s*true/.test(ts) || /"checkJs":\s*true/.test(ts))
    fails.push({ file: "tsconfig.json", what: "allowJs must be on and checkJs off, or the four modules' types are not read (or are held to this app's strict settings)" });
  /* --incremental false: the cache trap (§320.5a) — a stale tsbuildinfo
     reports a clean tree on one that does not compile. */
  const r = spawnSync(process.execPath, [TSC, "--noEmit", "-p", join(APP, "tsconfig.json"), "--incremental", "false"], { cwd: APP, encoding: "utf8" });
  const watched = new Set([...loads, "lib/shared-types.ts"]);
  for (const l of (r.stdout + r.stderr).split("\n")) {
    const m = /^([^\s(]+)\((\d+),\d+\): error (TS\d+): (.*)$/.exec(l);
    if (m && watched.has(m[1])) fails.push({ file: m[1], what: m[1] + ":" + m[2] + "  " + m[3] + "  " + m[4] });
  }
  return { fails, loads: [...new Set(loads)] };
}

if (process.argv.includes("--red")) {
  let bad = 0;
  for (const [n, [file, a, b]] of Object.entries(BREAKS)) {
    const p = join(APP, file), orig = readFileSync(p, "utf8");
    if (orig.split(a).length !== 2) { console.log("BREAK DID NOT MATCH ONCE: " + n); bad++; continue; }
    try {
      writeFileSync(p, orig.replace(a, b));
      const hit = run().fails.filter((f) => f.file === file);
      if (!hit.length) { console.log("NOT RED: " + n); bad++; }
      else console.log("red: " + n + " (" + hit[0].what.replace(/^[^ ]+\s+/, "").slice(0, 70) + ")");
    } finally {
      writeFileSync(p, orig);
      if (readFileSync(p, "utf8") !== orig) { console.log("COULD NOT PUT BACK " + file + " — restore it from git"); process.exit(2); }
    }
  }
  process.exit(bad ? 1 : 0);
}

let ok = 0; const fails = [];
const check = (w, g, d) => { if (g) { ok++; console.log("  ok   " + w); } else { fails.push(w); console.log("  FAIL " + w + (d ? "\n" + d : "")); } };
const res = run();
check("the four carried rule modules are loaded in " + res.loads.length + " files", res.loads.length >= 9);
const by = (f) => res.fails.filter(f);
check("every load is declared with the module's own closed type", !by((f) => f.what.startsWith("loads ")).length,
  by((f) => f.what.startsWith("loads ")).map((f) => "       " + f.file + ": " + f.what).join("\n"));
check("tsconfig reads the modules' types without holding them to strict", !by((f) => f.file === "tsconfig.json").length);
check("the app's checker reports nothing where the modules are used",
  !by((f) => !f.what.startsWith("loads ") && f.file !== "tsconfig.json").length,
  by((f) => !f.what.startsWith("loads ") && f.file !== "tsconfig.json").map((f) => "       " + f.what).join("\n"));
console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
