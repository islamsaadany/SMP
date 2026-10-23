/* THE SHARED RULES, READ BY TYPESCRIPT'S CHECKER (§585) — no browser, no
   database. `lib/rules.js` is plain JavaScript that both sides load (§42);
   its type comments describe the world it reads, a person and a held role,
   and this runs the checker over it and over `lib/authorize.js`, the
   server's caller, which sees those types through its `require`.

   GREEN IS NOT THE VERDICT ON ITS OWN (§298.3): a checker that reads nothing
   passes everything, so --red makes each fault below in a copy and asserts
   the checker refuses it — a key the world does not hold, a key the world
   is built with that W() never names (§102's trap), a person handed where a
   role is wanted, a word that is not a grant, and the server calling a rule
   one argument short.

     node checks/rules-types.mjs          # run from smp-app/
     node checks/rules-types.mjs --red    # every break must go red */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const LIB = join(APP, "..", "lib");
/* authorize.js requires these two, so the copy a break is made in carries them. */
const FILES = ["rules.js", "authorize.js", "graph-diff.js"];
const TSC = join(APP, "node_modules", "typescript", "bin", "tsc");

const BREAKS = {
  "misspelt-key": ["rules.js", "return w.unitKeys.filter(", "return w.unitkeys.filter("],
  "key-W-never-names": ["rules.js", "focusOff: (state.group || {}).focusOff,", "focusOf: (state.group || {}).focusOff,"],
  "person-for-role": ["rules.js", "if (!companyAllows(w, rs[i], target)) continue;", "if (!companyAllows(w, person, target)) continue;"],
  "not-a-grant": ["rules.js", 'if (row && Object.prototype.hasOwnProperty.call(row, areaKey)) return row[areaKey] || "none";',
                  'if (row && Object.prototype.hasOwnProperty.call(row, areaKey)) return row[areaKey] || "nothing";'],
  "caller-short": ["authorize.js", 'return R.grantIn(w, person, area, target) === "edit";', 'return R.grantIn(w, person, area) === "edit";'],
};

function tsc(dir) {
  /* --ignoreConfig: run from smp-app/, the app's own tsconfig.json would
     otherwise make TypeScript refuse the whole run — and a refusal is a
     non-zero exit, which --red would have counted as every break caught. */
  return spawnSync(process.execPath, [TSC, "--ignoreConfig", "--noEmit", "--allowJs", "--checkJs", "--skipLibCheck", "--strict", "false",
    "--target", "es2022", "--module", "commonjs", "--lib", "es2022,dom",
    "--types", "node", "--typeRoots", join(APP, "node_modules", "@types"),
    "rules.js", "authorize.js"], { cwd: dir, encoding: "utf8" });
}

if (process.argv.includes("--red")) {
  let bad = 0;
  for (const [n, [file, a, b]] of Object.entries(BREAKS)) {
    const dir = mkdtempSync(join(tmpdir(), "rules-types-"));
    try {
      for (const f of FILES) writeFileSync(join(dir, f), readFileSync(join(LIB, f), "utf8"));
      const src = readFileSync(join(dir, file), "utf8");
      if (src.split(a).length !== 2) { console.log("BREAK DID NOT MATCH ONCE: " + n); bad++; continue; }
      writeFileSync(join(dir, file), src.replace(a, b));
      /* Red only when the checker points INTO the broken file: an error
         anywhere else, or none located at all, is the check failing to run,
         not the break being caught. */
      const r = tsc(dir), out = r.stdout + r.stderr;
      const at = out.split("\n").filter((l) => l.startsWith(file + "(")).map((l) => (/error (TS\d+)/.exec(l) || [])[1]);
      if (!at.length) { console.log("NOT RED: " + n + (out.trim() ? "\n" + out.trim() : "")); bad++; }
      else console.log("red: " + n + " (" + at.join(", ") + ")");
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  process.exit(bad ? 1 : 0);
}

let ok = 0; const fails = [];
const check = (w, g, d) => { if (g) { ok++; console.log("  ok   " + w); } else { fails.push(w); console.log("  FAIL " + w + (d ? "\n" + d : "")); } };
const r = tsc(LIB);
check("the shared rules and the server's authoriser agree with the rules' own types",
  r.status === 0, (r.stdout + r.stderr).trim());
check("the rules file asks for checking in an editor too",
  readFileSync(join(LIB, "rules.js"), "utf8").startsWith("// @ts-check\n"));
console.log(`\n${ok} ok, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
