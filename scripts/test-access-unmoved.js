#!/usr/bin/env node
/* WHAT EVERY PERSON CAN OPEN, MEASURED BEFORE ANYTHING MOVES (T0, spec 056).
 *
 * Islam, of the client/module split: *"bring any access that was removed"* —
 * and the only honest answer to that is a measurement rather than a reading.
 * Stage 3 rewrites the Roles & access table (rows the client's, columns the
 * module's) on a promise that NOBODY'S ACCESS CHANGES, and a promise like
 * that is worth exactly what the baseline behind it is worth. Measuring it
 * after the change would be measuring the change (§303).
 *
 * IT ASKS THE RULE, NOT A SCREEN. `grantAtPage` is the one function both the
 * browser and the server ask (§42), so this is the whole access surface and
 * not a walk of the pages that happen to be drawn today — a page moved
 * between rails is invisible here, which is right: moving a page is not
 * moving access, and this exists to tell the two apart.
 *
 * NO BROWSER AND NO DATABASE. The world is built from `db/seed-state.json`
 * with the product's own `worldOf` — never a graph typed out here (§100.3) —
 * so the fixture is the worked example's own 33 people against every page
 * key the matrix answers for, at every target in the tenant.
 *
 * THE FIXTURE IS THE RUN'S OWN, NEVER A TYPED LIST (T0.1): a list written by
 * hand is a second opinion about the answer, and the one thing this must not
 * have. Write it from the build you are comparing AGAINST, then compare:
 *
 *     node scripts/test-access-unmoved.js --write /tmp/access-main.json
 *     node scripts/test-access-unmoved.js --against /tmp/access-main.json
 *
 * A KEY THE OTHER SIDE DOES NOT HOLD IS REPORTED AND IS NOT A FAILURE: a page
 * added since the baseline has no answer to disagree with. A key that has GONE
 * is a failure, and so is any answer that moved. Both are printed in full —
 * *any difference is a finding, not a tolerance* (T3.4).
 */
"use strict";
const fs = require("fs"), path = require("path");
const R = require(path.join(__dirname, "..", "lib", "rules.js"));
const GRAPH = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));

const w = R.worldOf(GRAPH);
const people = (GRAPH.people || []).slice().sort((a, b) => String(a.key).localeCompare(String(b.key)));
const pages = Object.keys(R.PAGE_AREA).slice().sort();

/* EVERY TARGET IN THE TENANT, because the same page answers differently for a
   unit somebody owns and one they do not (§37) — asking at one target would
   measure one column of the matrix and call it the table. */
const keysOf = (o) => Object.keys(o || {}).sort();
const targets = ["group"]
  .concat(keysOf(GRAPH.units))
  .concat(keysOf(GRAPH.functions).map((k) => "fn:" + k))
  .concat(keysOf(GRAPH.companies).map((k) => "co:" + k));

const map = {};
for (const p of people) {
  const row = {};
  for (const page of pages) {
    for (const t of targets) {
      let g;
      try { g = R.grantAtPage(w, p, page, t); } catch (e) { g = "THREW:" + (e && e.message); }
      /* `none` is the overwhelming majority and says nothing; storing only
         what somebody CAN open keeps the fixture readable and makes a
         difference in either direction show as a line rather than a diff of
         one word inside forty thousand. */
      if (g && g !== "none") row[page + "@" + t] = g;
    }
  }
  map[p.key] = row;
}

const total = Object.values(map).reduce((n, r) => n + Object.keys(r).length, 0);
const argAt = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null; };
const write = argAt("--write"), against = argAt("--against");

console.log("people %d · pages %d · targets %d · grants that are not `none`: %d",
  people.length, pages.length, targets.length, total);

if (write) {
  /* WHERE IT CAME FROM, IN THE FILE (§303): a baseline with no provenance is
     a number somebody has to take on trust, and the whole of its job is to be
     the thing a later run is held against. */
  let from = "";
  try { from = require("child_process").execSync("git rev-parse HEAD", { cwd: path.join(__dirname, "..") }).toString().trim(); } catch (e) { from = "unknown"; }
  fs.writeFileSync(write, JSON.stringify({ from, taken: new Date().toISOString().slice(0, 10), pages, targets, map }, null, 1));
  console.log("wrote %s", write);
  process.exit(0);
}
if (!against) {
  console.log("nothing to compare against — pass --write <file> or --against <file>");
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(against, "utf8"));
const notes = [], bad = [];
console.log("against %s taken %s", (base.from || "?").slice(0, 8), base.taken || "?");
/* PAGES AND PEOPLE FIRST, because a missing row explains every missing grant
   under it and printing both is how one change reads as five hundred. */
const gone = base.pages.filter((k) => pages.indexOf(k) < 0);
const added = pages.filter((k) => base.pages.indexOf(k) < 0);
if (added.length) notes.push("page keys ADDED since the baseline (no answer to disagree with): " + added.join(", "));
if (gone.length) bad.push("page keys GONE since the baseline: " + gone.join(", "));
const tGone = base.targets.filter((k) => targets.indexOf(k) < 0);
const tAdded = targets.filter((k) => base.targets.indexOf(k) < 0);
if (tAdded.length) notes.push("targets added: " + tAdded.join(", "));
if (tGone.length) bad.push("targets GONE: " + tGone.join(", "));

const who = Object.keys(base.map).concat(Object.keys(map).filter((k) => !(k in base.map)));
for (const k of who) {
  if (!(k in map)) { bad.push(k + " — the person is GONE from the register"); continue; }
  if (!(k in base.map)) { notes.push(k + " — new person, nothing to compare"); continue; }
  const a = base.map[k], b = map[k];
  for (const cell of Object.keys(a)) {
    const page = cell.split("@")[0];
    if (added.indexOf(page) >= 0) continue;
    if (!(cell in b)) bad.push(k + ": " + cell + " was `" + a[cell] + "`, is now `none`");
    else if (a[cell] !== b[cell]) bad.push(k + ": " + cell + " was `" + a[cell] + "`, is now `" + b[cell] + "`");
  }
  for (const cell of Object.keys(b)) {
    const page = cell.split("@")[0];
    if (added.indexOf(page) >= 0) { continue; }
    if (!(cell in a)) bad.push(k + ": " + cell + " was `none`, is now `" + b[cell] + "`");
  }
}

for (const n of notes) console.log("  note  %s", n);
if (!bad.length) { console.log("\nUNMOVED — every person opens exactly what they opened, at every target"); process.exit(0); }
for (const b of bad) console.log("  MOVED %s", b);
console.log("\n%d differences — any difference is a finding, not a tolerance (T3.4)", bad.length);
process.exit(1);
