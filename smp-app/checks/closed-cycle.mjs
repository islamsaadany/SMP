/* A CLOSED CYCLE STILL TAKES FIGURES FROM THE OFFICE (§754, Islam
   2026-11-16: *"we agreed that the SMO can report even if the cycle is
   closed"*).

   What this asserts, on the BUILT single file driven headless in Chromium —
   the same file §690's check drove, opened from disk on the baked demo, so
   no server, no database and no sign-in are needed:

     1. the office, on the open cycle, is offered the unit's figure boxes
        (the baseline the closed page is measured against);
     2. the cycle closed exactly as the Close press closes it (the score
        snapshot filed, the state set), the office's Reporting page carries
        the closed note in the OFFICE's voice — the cycle is closed, the
        office can still correct the figures — with the same boxes under it,
        and never the old "cannot be changed here";
     3. a figure typed on the closed cycle is written, and the closing record
        (the last HISTORY entry, matched by the cycle's name) follows it,
        with the cycle still closed;
     4. a function's Reporting page says and offers the same (A15);
     5. everybody OUTSIDE the office is still refused: canReport says no and
        their page is the old note with no box under it — both ends (§94.2);
     6. reopened, the note goes and the boxes are as at 1.

   Proved able to fail: against the build before §754 it is 8 red (the note
   in the old words, no boxes, no figure written, the record unmoved).

     node checks/closed-cycle.mjs
     SMP_BUILT=/path/to/a/build.html node checks/closed-cycle.mjs   (another build) */
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const BUILT = process.env.SMP_BUILT ||
  join(here, "..", "..", "SMP-Project-Folder", "strategy-management-platform-v3.22.html");
/* The browser the way checks/shell.mjs finds it: the pre-installed Chromium,
   or SMP_CHROME. */
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium";

let okN = 0, bad = 0;
const ok = (name, c, extra) => {
  if (c) okN++; else bad++;
  console.log((c ? "  ok   " : "  RED  ") + name + (c ? "" : "  " + JSON.stringify(extra)));
};

const b = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const pg = await b.newPage({ viewport: { width: 1366, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await pg.goto("file://" + BUILT);
await pg.waitForTimeout(1200);

const info = await pg.evaluate(() => ({ units: UNIT_KEYS, fns: FUNCTION_KEYS, state: REVIEW.state, name: REVIEW.name }));
ok("the demo opens on an open cycle", info.state === "open", info);
const unit = info.units[0], fn = info.fns[0];
await pg.selectOption("#asWho", "smo");
await pg.waitForTimeout(400);

console.log("\n── 1 · the office on the open cycle ──");
await pg.evaluate((u) => { current = u; currentSub = "report"; paint(); }, unit);
await pg.waitForTimeout(400);
const openBoxes = await pg.evaluate(() => document.querySelectorAll("#panel [data-rep]").length);
ok("the unit's page offers figure boxes", openBoxes > 0, openBoxes);

console.log("\n── 2 · the cycle closed, the office's page ──");
await pg.evaluate(() => {
  var snap = { name: REVIEW.name, group: groupUnitsObjectives(), units: {} };
  activeKeys().forEach((k) => { snap.units[k] = unitObjectives(UNITS[k]); });
  HISTORY.push(snap); REVIEW.state = "closed"; paint();
});
await pg.waitForTimeout(400);
const c = await pg.evaluate(() => ({
  note: (document.querySelector("#panel .note") || {}).textContent || "",
  boxes: document.querySelectorAll("#panel [data-rep]").length,
  tab: !!document.querySelector(".tabs button.cta")
}));
ok("the Reporting tab stands (§690)", c.tab, c);
ok("the note says the cycle is closed", /is closed/.test(c.note), c.note);
ok("...in the office's voice: it can still correct the figures", /office can still correct/.test(c.note), c.note);
ok("...and never 'cannot be changed here'", !/cannot be changed here/.test(c.note), c.note);
ok("the same figure boxes stand under it", c.boxes > 0 && c.boxes === openBoxes, c);
ok("canReport says yes to the office", await pg.evaluate((u) => canReport(u), unit));

console.log("\n── 3 · a figure typed on the closed cycle ──");
const before = await pg.evaluate(() => JSON.stringify(HISTORY[HISTORY.length - 1]));
const typed = await pg.evaluate(() => {
  const el = [...document.querySelectorAll("#panel [data-rep]")]
    .find((e) => e.tagName === "INPUT" && !e.dataset.bdcol && !e.dataset.ynpart && !/^outActs:/.test(e.dataset.fld || ""));
  if (!el) return null;
  el.value = "1"; el.dispatchEvent(new Event("change", { bubbles: true }));
  return el.dataset.rep;
});
await pg.waitForTimeout(400);
const after = await pg.evaluate(() => JSON.stringify(HISTORY[HISTORY.length - 1]));
ok("a plain figure box was found and written", !!typed, typed);
ok("the closing record follows the figure", before !== after, { before: before.slice(0, 90), after: after.slice(0, 90) });
ok("...under the cycle's own name", await pg.evaluate(() => HISTORY[HISTORY.length - 1].name === REVIEW.name));
ok("...and the cycle stays closed", await pg.evaluate(() => REVIEW.state === "closed"));

console.log("\n── 4 · a function's page, closed, as the office (A15) ──");
await pg.evaluate((f) => { current = "fn:" + f; currentSub = "report"; paint(); }, fn);
await pg.waitForTimeout(400);
const f = await pg.evaluate(() => ({
  note: (document.querySelector("#panel .note") || {}).textContent || "",
  boxes: document.querySelectorAll("#panel [data-rep],#panel [data-crep],#panel [data-cpick],#panel [data-cpct]").length
}));
ok("the same note, the office's voice", /office can still correct/.test(f.note), f.note);
ok("...and its entry controls under it", f.boxes > 0, f.boxes);

console.log("\n── 5 · everybody outside the office, closed ──");
const others = await pg.evaluate((u) => {
  const keys = [...document.querySelectorAll("#asWho option")].map((o) => o.value).filter((k) => k && k !== "smo");
  return keys.map((k) => {
    const sel = document.getElementById("asWho"); sel.value = k; sel.dispatchEvent(new Event("change"));
    return { k, office: inOffice(), can: canReport(u), html: renderReport(UNITS[u]) };
  });
}, unit);
const outside = others.filter((o) => !o.office), inside = others.filter((o) => o.office);
ok("somebody outside the office was tried (" + outside.length + ")", outside.length > 0);
ok("canReport says no to every one of them", outside.every((o) => !o.can), outside.filter((o) => o.can).map((o) => o.k));
ok("their page is the old note and nothing under it", outside.every((o) => /cannot be changed here/.test(o.html) && !/data-rep=/.test(o.html)),
  outside.filter((o) => !(/cannot be changed here/.test(o.html) && !/data-rep=/.test(o.html))).map((o) => o.k));
ok("every other office seat is let through too", inside.every((o) => o.can), inside.filter((o) => !o.can).map((o) => o.k));

console.log("\n── 6 · reopened ──");
await pg.selectOption("#asWho", "smo");
await pg.waitForTimeout(300);
await pg.evaluate((u) => { HISTORY.pop(); REVIEW.state = "open"; current = u; currentSub = "report"; paint(); }, unit);
await pg.waitForTimeout(400);
const o2 = await pg.evaluate(() => ({
  note: (document.querySelector("#panel .note") || {}).textContent || "",
  boxes: document.querySelectorAll("#panel [data-rep]").length
}));
ok("no closed note", !/is closed/.test(o2.note), o2.note);
ok("the boxes as at the start", o2.boxes === openBoxes, o2);
ok("no page error", errs.length === 0, errs.slice(0, 3));

console.log("\n" + okN + " ok, " + bad + " failed");
await b.close();
process.exit(bad ? 1 : 0);
