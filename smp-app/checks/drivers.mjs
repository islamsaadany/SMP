/* REVENUE DRIVERS — the arithmetic, proved against the tool it came from
   (spec 062 §5).

   WHAT THIS FILE IS FOR. The drivers model in `lib/rules.js` is a
   translation of somebody else's working arithmetic, and the failure that
   matters is not a crash — it is a figure that is plausible and wrong. A
   revenue plan renders perfectly at every number, so nothing on a screen
   would ever say so (§96's family, in money).

   SO IT DOES NOT RETYPE THE EXPECTED ANSWERS. It runs the REFERENCE TOOL'S
   OWN FUNCTIONS in a sandbox beside the shared module and asserts the two
   AGREE, on the tool's own five channels (§94.8). A number typed into this
   file would be a third answer to the question, drifting the first time
   either side is corrected (§53.5); an agreement goes red on its own.

   AND IT ASSERTS THE FIXTURE IS WORTH COMPARING (§113.8, §54.5). Two
   arithmetics agree perfectly over an empty list, and a slice that captured
   nothing would pass every section below it — so §1 asserts the reference
   loaded, and §8 asserts that all the awkward cases are actually IN it: a
   flat channel and a split one, a rate channel and a count one, a season, an
   increment, a per-cent driver and a plus-n uplift.

   IT READS THE FROZEN SOURCE, NOT THE CARRIED COPY. `lib/rules.js` is where
   the rule lives; `smp-app/lib/rules.cjs` is a copy of it and
   `checks/generated-in-step.mjs` is what keeps the two byte-identical
   (§335). Asserting against the copy would prove the copy right about
   itself.

   THE BREAKS ARE APPLIED TO THE MODULE'S TEXT, never shipped inside it.
   `lib/rules.js` runs in every browser in the product; a falsification hook
   living there would be test scaffolding on a production path. So each
   break is a substitution made here, and EACH ONE ASSERTS IT MATCHED
   before it is believed (§344.1 — a break that silently applies to nothing
   reports 0 red, which is indistinguishable from a guard that works).

   NO DATABASE, NO BROWSER, NO NETWORK — the whole model is pure functions.

     node checks/drivers.mjs
     SMP_BREAK=no-season-cut      node checks/drivers.mjs   # must go red
     SMP_BREAK=count-prorated     node checks/drivers.mjs   # must go red
     SMP_BREAK=pct-raw            node checks/drivers.mjs   # must go red
     SMP_BREAK=increment-baseline node checks/drivers.mjs   # must go red
     SMP_BREAK=no-interaction     node checks/drivers.mjs   # must go red */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const RULES = join(ROOT, "lib", "rules.js");
const REF = join(ROOT, "specs", "062-revenue-drivers", "reference",
                 "revenue-driver-tree-tool-v12.html");

let pass = 0; const bad = [];
const ok = (label, good, detail) => {
  if (good) { pass++; console.log("  ok   " + label); }
  else { bad.push(label); console.log("  FAIL " + label + (detail ? "  — " + detail : "")); }
};
const stop = (why) => {
  console.log("\ncannot continue — " + why);
  console.log("\n" + (bad.length || 1) + " FAILED"); process.exit(1);
};
/* Money compared as money: a relative epsilon, because these run to 1e9 and
   an absolute one would either pass a real drift or fail on float noise. */
const near = (a, b) => {
  if (!isFinite(a) || !isFinite(b)) return a === b || (Number.isNaN(a) && Number.isNaN(b));
  const m = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / m < 1e-9;
};

/* ══ §0 · THE MODULE, AND THE BREAK IF ONE IS ASKED FOR ════════════════ */
console.log("\n§0 · the shared rules module");

const BREAKS = {
  /* The seasons never cut out of the base year, so a season is counted
     twice and every sub-channel with one reads high. */
  "no-season-cut": ["return Math.max(0, 12 - used);", "return 12;"],
  /* A count channel read as a rate — *Events per year 45* becoming 540. */
  "count-prorated": ['if (driverMode(ch) === "count" || (p && p.type === "increment")) return 1;',
                     'if (p && p.type === "increment") return 1;'],
  /* A per-cent driver multiplying raw: a 70% maturity factor reading 70. */
  "pct-raw": ['return (d && d.unit === "%") ? v / 100 : v;', "return v;"],
  /* An increment given a baseline, so new business reports as flat growth. */
  "increment-baseline": ['if (p && p.type === "increment") {\n      var rev = y.rev * months;',
                         "if (false) {\n      var rev = y.rev * months;"],
  /* The interaction term dropped, so the four parts stop adding up. */
  "no-interaction": ["intEff: (y.vol - b.vol) * (y.val - b.val) * months,", "intEff: 0,"],
};

let src = readFileSync(RULES, "utf8");
const brk = process.env.SMP_BREAK || "";
if (brk) {
  const b = BREAKS[brk];
  if (!b) stop("no such break: " + brk);
  /* §344.1: assert it MATCHED. A substitution that lands on nothing reports
     a clean run, which reads exactly like a guard that works. */
  if (!src.includes(b[0])) stop("the break '" + brk + "' matched nothing — the module moved");
  src = src.replace(b[0], b[1]);
  console.log("  ·· BREAK APPLIED: " + brk);
}
const modBox = { module: { exports: {} }, console };
modBox.exports = modBox.module.exports;
vm.runInNewContext(src, modBox);
const R = modBox.module.exports;
ok("the drivers model is exported", typeof R.driverFigures === "function" &&
   typeof R.driverBridge === "function" && typeof R.driverTarget === "function");
if (typeof R.driverFigures !== "function") stop("the shared module did not export the model");

const { seasonMonths, driverMonths, driverPeriod, driverSub, driverFigures,
        driverTarget, driverBridge, driverFlat, driverRows, driverById,
        driverMintId, driverState, driverUnanswered, driverChannel,
        seasonsOf } = R;

/* ══ §1 · THE REFERENCE, RUN RATHER THAN READ ══════════════════════════ */
console.log("\n§1 · the reference tool");

const html = readFileSync(REF, "utf8");
/* Slice the arithmetic out of his file: from the driver constructor down to
   the last roll-up. Everything after it touches `document` and is a screen. */
const from = html.indexOf("const D = (n,k,u,b,up,note,uu)");
const TAIL = "const totals = () => agg(model, cCalc);";
const to = html.indexOf(TAIL);
ok("the arithmetic was found in the reference file", from > 0 && to > from,
   "from=" + from + " to=" + to);
if (from < 0 || to < 0) stop("the reference file's shape moved");

/* AND IT HAS TO BE HANDED BACK EXPLICITLY. A `const` or `let` at the top
   level of a script does NOT become a property of the sandbox — only `var`
   and function declarations do — so reading them off the context returns
   nothing and every comparison below would be against `undefined`. The
   epilogue names them; his file is not touched. */
const EPILOGUE = "\n;globalThis.__out = { SEASONS, model, tCalc, sCalc, cCalc, totals," +
                 " monthsFor, seasonMonths, seasonById, fac, y1of, eff, agg };";
const sandbox = {};
vm.runInNewContext(html.slice(from, to + TAIL.length) + EPILOGUE, sandbox);
const T = sandbox.__out || {};

const HANDLES = ["tCalc", "sCalc", "cCalc", "totals", "monthsFor", "seasonMonths"];
const missing = HANDLES.filter((k) => typeof T[k] !== "function");
ok("it exposes the functions this port was made from", missing.length === 0,
   missing.length ? "missing: " + missing.join(", ") : "");

/* THE FIXTURE IS HIS, NOT MINE (§100.3): the five channels he ships in the
   tool, not a tree written here to be easy to agree with. */
const theirs = T.model;
if (missing.length || !Array.isArray(T.SEASONS) || !Array.isArray(theirs))
  stop("the reference's arithmetic did not come back out of the sandbox");

ok("his own five channels are loaded", theirs.length === 5, "channels=" + theirs.length);
ok("at least one season is defined", T.SEASONS.length >= 1);

/* ══ §2 · THE SAME TREE, IN THE PLATFORM'S SHAPE ═══════════════════════
   A CHANNEL IS A UNIT (spec 062 §4.1), so each of his channels converts to
   one `unit.drivers` object and his seasons to the group's. Two renames and
   nothing else — `tables` is his word for a period and reads as a database
   table in this codebase, and `flat` is DERIVED here rather than stored
   (§110's pair). The conversion is asserted rather than trusted: a drop
   anywhere in it would make every agreement below it an agreement about
   fewer rows (§113.8). */
console.log("\n§2 · the tree, in unit-and-group shape");

const seasons = T.SEASONS.map((s) => ({ id: s.id, name: s.name, start: s.start, end: s.end }));
const group = { seasons };
let nid = 0;
const units = theirs.map((ch) => ({
  name: ch.name,
  drivers: {
    mode: ch.mode,
    subs: ch.subs.map((sub) => ({
      name: sub.name,
      periods: sub.tables.map((t) => ({
        name: t.name, type: t.type, seasonId: t.seasonId,
        drivers: t.drivers.map((d) => ({
          id: "d" + (++nid),
          name: d.name, kind: d.kind, unit: d.unit,
          base: d.base, up: d.up, upUnit: d.upUnit, note: d.note || "",
        })),
      })),
    })),
  },
}));
const mine = units.map((u) => u.drivers);

const countTheirs = (k) => theirs.reduce((n, ch) =>
  n + ch.subs.reduce((m, s) => m + (k === "sub" ? 1 : s.tables.reduce((q, t) =>
    q + (k === "period" ? 1 : t.drivers.length), 0)), 0), 0);
const countMine = (k) => mine.reduce((n, ch) =>
  n + ch.subs.reduce((m, s) => m + (k === "sub" ? 1 : s.periods.reduce((q, p) =>
    q + (k === "period" ? 1 : p.drivers.length), 0)), 0), 0);

ok("every sub-channel came across", countTheirs("sub") === countMine("sub") && countMine("sub") > 5,
   theirs.length + " channels, " + countMine("sub") + " sub-channels");
ok("every period came across", countTheirs("period") === countMine("period") && countMine("period") > 10,
   countMine("period") + " periods");
ok("every driver came across", countTheirs("driver") === countMine("driver") && countMine("driver") > 40,
   countMine("driver") + " drivers");

/* ══ §3 · SEASONS ══════════════════════════════════════════════════════ */
console.log("\n§3 · season windows");
T.SEASONS.forEach((s, i) => {
  ok("season months agree — " + s.name,
     near(T.seasonMonths(s), seasonMonths(seasons[i])),
     "theirs=" + T.seasonMonths(s) + " ours=" + seasonMonths(seasons[i]));
});

/* ══ §4 · EVERY PERIOD ═════════════════════════════════════════════════
   The months AND all seven figures, on every period in the tree — because a
   port can agree on a total while two periods inside it are wrong in
   opposite directions (§264's own shape: a summary made of numbers that do
   not make it). */
console.log("\n§4 · every period, figure by figure");
const KEYS = ["b0", "b1", "growth", "volEff", "valEff", "intEff", "newEff"];
let periodChecks = 0;
theirs.forEach((ch, ci) => {
  ch.subs.forEach((sub, si) => {
    sub.tables.forEach((t, ti) => {
      const mCh = mine[ci], mSub = mCh.subs[si], mP = mSub.periods[ti];
      const a = T.tCalc(t, ch, sub);
      const b = driverPeriod(seasons, mCh, mSub, mP);
      const where = ch.name + " · " + sub.name + " · " + t.name;
      const mOk = near(T.monthsFor(t, ch, sub), driverMonths(seasons, mCh, mSub, mP))
                  && near(a.months, b.months);
      const fOk = KEYS.every((k) => near(a[k], b[k]));
      const off = KEYS.filter((k) => !near(a[k], b[k]))
                      .map((k) => k + ": theirs=" + a[k] + " ours=" + b[k]).join("; ");
      ok("agrees — " + where, mOk && fOk,
         (mOk ? "" : "months theirs=" + a.months + " ours=" + b.months + "  ") + off);
      periodChecks++;
    });
  });
});
ok("every period in the tree was compared", periodChecks === countMine("period"),
   periodChecks + " of " + countMine("period"));

/* ══ §5 · THE ROLL-UP ══════════════════════════════════════════════════ */
console.log("\n§5 · sub-channel, unit, and every unit added up");
theirs.forEach((ch, ci) => {
  ch.subs.forEach((sub, si) => {
    const a = T.sCalc(ch, sub), b = driverSub(seasons, mine[ci], mine[ci].subs[si]);
    ok("sub-channel agrees — " + ch.name + " · " + sub.name, KEYS.every((k) => near(a[k], b[k])));
  });
  const a = T.cCalc(ch), b = driverFigures(seasons, mine[ci]);
  ok("unit agrees — " + ch.name, KEYS.every((k) => near(a[k], b[k])),
     "theirs Y1=" + a.b1 + " ours Y1=" + b.b1);
});
/* The group's roll-up is every unit added, which is what the group page
   already does for every other figure — so the check adds them the same way
   rather than the module growing a function for it (spec 062 §4.1). */
const tA = T.totals();
const tB = KEYS.reduce((t, k) => (t[k] = 0, t), {});
mine.forEach((ch) => { const f = driverFigures(seasons, ch); KEYS.forEach((k) => { tB[k] += f[k]; }); });
ok("every unit added up agrees with his Master tab", KEYS.every((k) => near(tA[k], tB[k])),
   "theirs Y1=" + tA.b1 + " ours Y1=" + tB.b1);
/* AND THE TOTAL IS NOT NOUGHT — two empty arithmetics agree perfectly. */
ok("and it is a real number", tB.b1 > 0 && tB.growth !== 0,
   "Y1=" + Math.round(tB.b1) + " growth=" + Math.round(tB.growth));

/* ══ §6 · THE GROWTH SPLIT ═════════════════════════════════════════════ */
console.log("\n§6 · where the growth comes from");
const br = driverBridge(tB);
ok("the four parts add up to the growth they explain",
   near(br.volume + br.price + br.interaction + br.newBusiness, tB.growth),
   "parts=" + (br.volume + br.price + br.interaction + br.newBusiness) + " growth=" + tB.growth);
ok("the shares add to 100%", br.shares &&
   Math.abs(br.shares.volume + br.shares.price + br.shares.interaction + br.shares.newBusiness - 100) < 1e-6);
ok("a plan that does not grow is given no shares at all",
   driverBridge({ b0: 100, b1: 100, growth: 0, volEff: 0, valEff: 0, intEff: 0, newEff: 0 }).shares === null);
ok("and it says so in words rather than printing nought per cent",
   /does not grow/.test(driverBridge({ b0: 100, b1: 90, growth: -10, volEff: -10, valEff: 0, intEff: 0, newEff: 0 }).reading));

/* ══ §7 · THE UNIT'S REVENUE TARGET (spec 062 §4.2) ════════════════════ */
console.log("\n§7 · the revenue target a unit would read");
ok("a unit's Year 1 figure is its target",
   near(driverTarget(group, units[0]), driverFigures(seasons, mine[0]).b1),
   units[0].name + " Y1=" + Math.round(driverTarget(group, units[0])));
/* BOTH ENDS (§94.2): a unit with no tree has NO target, which is a
   different fact from a target of nought and must never be scored as one. */
ok("a unit with no tree has no target, not a target of nought",
   driverTarget(group, { name: "Nothing here" }) === null);
ok("and an empty tree is no target either",
   driverTarget(group, { drivers: { mode: "rate", subs: [] } }) === null);

/* ══ §8 · THE FIXTURE IS WORTH COMPARING (§113.8) ══════════════════════
   Every case where the two arithmetics COULD differ, asserted present in the
   tree above. Without this the file proves agreement on the easy half. */
console.log("\n§8 · the awkward cases are actually in it");
const every = { periods: [], drivers: [] };
mine.forEach((ch) => ch.subs.forEach((s) => s.periods.forEach((p) => {
  every.periods.push({ ch, s, p }); p.drivers.forEach((d) => every.drivers.push(d));
})));
ok("a flat unit, which draws no rail", mine.some((c) => driverFlat(c)));
ok("a unit split into routes to market", mine.some((c) => !driverFlat(c) && c.subs.length > 1));
ok("a rate unit", mine.some((c) => c.mode === "rate"));
ok("a count unit, which is never prorated", mine.some((c) => c.mode === "count"));
ok("a season period, cut out of a base year", every.periods.some((x) => x.p.type === "season"));
ok("an increment, which has no baseline", every.periods.some((x) => x.p.type === "increment"));
ok("a per-cent driver, which divides by 100", every.drivers.some((d) => d.unit === "%"));
ok("a plus-n uplift, which adds rather than scales", every.drivers.some((d) => d.upUnit === "#"));
ok("a driver carrying its rationale", every.drivers.some((d) => d.note && d.note.length > 20));
/* AND THE BASE PERIOD REALLY IS SHORTENED BY ITS SEASON — the one line
   §3.4 turns on. A tree whose seasons were ignored would agree with a port
   that ignored them too, so this asserts the FACT and not the agreement. */
ok("and a base period is genuinely shortened by its season",
   every.periods.some((x) =>
     x.p.type === "base" && x.ch.mode === "rate" &&
     driverMonths(seasons, x.ch, x.s, x.p) < 11.99));

/* ══ §9 · THE PLATFORM'S OWN HALF ══════════════════════════════════════
   Not the tool's arithmetic — what the screens read. Every one of these is
   a decision in spec 062 §6, and each has BOTH ENDS asserted (§94.2). */
console.log("\n§9 · what the screens read");

const u0 = units[0];
ok("every driver is walked once, in reading order",
   driverRows(u0).length === u0.drivers.subs.reduce((n, s) =>
     n + s.periods.reduce((m, p) => m + p.drivers.length, 0), 0),
   driverRows(u0).length + " rows");
ok("a driver is found by its id", driverById(u0, "d1") &&
   driverById(u0, "d1").driver.name === u0.drivers.subs[0].periods[0].drivers[0].name);
ok("and an id nobody holds finds nothing, rather than the first row",
   driverById(u0, "nope") === null && driverById(u0, "") === null);

/* A NEW ID IS ONE MORE THAN THE HIGHEST, never one more than the count
   (§96.2, §316) — so this deletes from the middle, which is the only state
   that tells the two apart. */
const gappy = JSON.parse(JSON.stringify(u0));
gappy.drivers.subs[0].periods[0].drivers.splice(0, 1);
const held = {};
driverRows(gappy).forEach((r) => { held[String(r.driver.id)] = 1; });
ok("a new id cannot collide with a row still on the screen",
   !held[driverMintId(gappy)], "minted " + driverMintId(gappy));

/* THE THREE STATES (spec 062 §6.2), all three made rather than waited for
   (§255) — none of the tool's rows carries a connection or an assumption
   mark, so without making them this section would prove one state. */
const linked = JSON.parse(JSON.stringify(u0));
linked.keyObjectives = [{ id: "k1", name: "Footfall conversion", driver: "d2" }];
linked.items = [{ id: "p1", measures: [{ id: "m1", name: "Basket", driver: "d3" }] }];
linked.drivers.subs[0].periods[0].drivers[0].assume = true;
ok("a row an objective answers to reads as connected",
   driverState(linked, driverById(linked, "d2").driver) === "linked");
ok("a row a pillar MEASURE answers to reads as connected too",
   driverState(linked, driverById(linked, "d3").driver) === "linked");
ok("a row marked as an assumption reads as one",
   driverState(linked, driverById(linked, "d1").driver) === "assume");
ok("and a row that is neither says nobody has said yet",
   driverState(linked, driverById(linked, "d4").driver) === "notyet");
const un = driverUnanswered(linked);
ok("the unanswered ones are counted, and it is neither nought nor all of them",
   un > 0 && un === driverRows(linked).length - 3, un + " of " + driverRows(linked).length);

/* READERS THAT CREATE NOTHING (§42, §50.6). `branding()` cost this project
   a refused save for every non-office person by minting what it looked for,
   so both readers are asserted to hand back an empty and leave the object
   they were asked about untouched. */
const bare = {};
ok("reading a unit with no tree mints nothing on it",
   driverChannel(bare) === null && Object.keys(bare).length === 0);
const bareGroup = {};
ok("reading a group with no seasons mints nothing on it",
   seasonsOf(bareGroup).length === 0 && Object.keys(bareGroup).length === 0);
ok("and a malformed tree reads as no tree rather than throwing",
   driverChannel({ drivers: "yes" }) === null && driverChannel({ drivers: {} }) === null);

/* ══ VERDICT ═══════════════════════════════════════════════════════════ */
console.log("\n" + (bad.length ? bad.length + " FAILED of " + (pass + bad.length) : pass + " checks, 0 failed"));
if (bad.length) { bad.forEach((b) => console.log("  · " + b)); process.exit(1); }
