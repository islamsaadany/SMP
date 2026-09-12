#!/usr/bin/env node
/* §325 — THE SERVED COPIES ARE IN STEP WITH THE FROZEN SOURCES.
 *
 * `smp-app/public/` and `smp-app/shell/` are not written by hand. Four
 * generators read the frozen product and produce what the Next app SERVES:
 * `build-shell.mjs` assembles build.py's own script list into `shell.js`,
 * `sync-css.mjs` concatenates the stylesheets into `platform.css`,
 * `sync-static.mjs` carries the manifest and icons, and `build-sw.mjs` splits
 * the frozen worker. Every one of those outputs is TRACKED.
 *
 * WHICH MEANS A CHANGE TO A FROZEN SOURCE THAT STOPS THERE LEAVES THE NEW
 * STACK SERVING THE OLD BYTES — §91's failure by a different road, and silent,
 * because until this file nothing on either stack compared the two. §319
 * recorded the trap in its own words; §324 fell into it one section later,
 * deleting a dead CSS rule from `arrange.css` and leaving `platform.css`
 * carrying it. Behaviour-neutral that time. The next one need not be.
 *
 * NOT A SECOND GENERATOR (§53.5): it runs the real ones and compares, so a
 * generator that changes what it emits stays green and a source edited without
 * re-running one goes red — which is the fault, and the only one.
 *
 * THE SUBJECT IS DERIVED, NEVER TYPED: every file git already tracks under
 * those two directories. A list written here would be the fifth place to edit
 * the day a generator gains a file, which is this section's own fault wearing
 * a hat — and a typed list cannot notice a file that STOPPED being generated.
 *
 * THE TREE IS PUT BACK (§94.2): the committed bytes are held in memory and the
 * originals restored in a `finally`, whether this passes, fails or throws. A
 * check that leaves the thing it measures rewritten has fixed the tree and
 * told nobody.
 *
 * Run: node checks/generated-in-step.mjs   (from smp-app/)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const repo = join(app, "..");

const GENERATORS = ["build-shell.mjs", "sync-css.mjs", "sync-static.mjs", "build-sw.mjs"];
const WATCHED = ["smp-app/public", "smp-app/shell", "smp-app/security-headers.json"];

let bad = 0;
const check = (ok, what, detail) => {
  if (!ok) bad++;
  console.log((ok ? "  ok   " : "  FAIL ") + what + (ok || !detail ? "" : "  — " + detail));
};

/* THE TREE MUST BE CLEAN IN THESE PATHS BEFORE ANYTHING RUNS, or "in step"
   cannot be told from "you have edits in flight" (§94.2, §113.8). */
const dirty = execFileSync("git", ["status", "--porcelain", "--", ...WATCHED],
  { cwd: repo, encoding: "utf8" }).trim();

console.log("── what is being compared");
check(dirty === "", "the served copies have no uncommitted edits to confuse this with",
  dirty.split("\n").slice(0, 4).join(" | "));

const tracked = execFileSync("git", ["ls-files", "--", ...WATCHED],
  { cwd: repo, encoding: "utf8" }).trim().split("\n").filter(Boolean);
check(tracked.length >= 8, "git tracks the served copies", tracked.length + " files");

const paths = tracked.map((p) => join(repo, p));
const before = new Map();
for (const p of paths) if (existsSync(p)) before.set(p, readFileSync(p));

console.log("\n── running the four generators, then comparing");
try {
  for (const g of GENERATORS) {
    try {
      execFileSync(process.execPath, [join(app, "scripts", g)], { cwd: app, stdio: "pipe" });
      check(true, g + " runs");
    } catch (e) {
      check(false, g + " runs", String((e && e.message) || e).split("\n")[0]);
    }
  }

  const moved = [];
  for (const p of paths) {
    const was = before.get(p);
    const now = existsSync(p) ? readFileSync(p) : null;
    if (!was) continue;
    if (now === null) { moved.push([p, "the generator deleted it"]); continue; }
    if (Buffer.compare(now, was) !== 0)
      moved.push([p, "committed " + was.length + " bytes, generated " + now.length]);
  }
  check(moved.length === 0,
    "every served copy is byte-identical to what its generator produces",
    moved.map(([p, why]) => p.replace(repo + "/", "") + " (" + why + ")").join("; "));
  if (moved.length) {
    console.log("\n       Re-run the generators from smp-app/ and commit what they write:");
    for (const g of GENERATORS) console.log("         node scripts/" + g);
  }
} finally {
  for (const [p, buf] of before) {
    try { if (!existsSync(p) || Buffer.compare(readFileSync(p), buf) !== 0) writeFileSync(p, buf); }
    catch (e) { console.log("  !!   could not restore " + p.replace(repo + "/", "") + ": " + e.message); }
  }
}

console.log("\n" + (bad ? bad + " FAILED" : "generated-in-step: all clear"));
process.exit(bad ? 1 : 0);
