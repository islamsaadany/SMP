/* REVENUE DRIVERS — the port, proved against the tool it was ported from
   (spec 062 §5).

   WHAT THIS FILE IS FOR. `lib/drivers.ts` is a translation of somebody else's
   working arithmetic, and the failure that matters is not a crash — it is a
   figure that is plausible and wrong. A revenue plan renders perfectly at
   every number, so nothing on a screen would ever say so (§96's family, in
   money).

   SO IT DOES NOT RETYPE THE EXPECTED ANSWERS. It runs the REFERENCE TOOL'S
   OWN FUNCTIONS in a sandbox beside the port and asserts the two AGREE, on
   the tool's own five channels (§94.8). A number typed into this file would
   be a third answer to the question, drifting the first time either side is
   corrected (§53.5); an agreement goes red on its own.

   AND IT ASSERTS THE FIXTURE IS WORTH COMPARING (§113.8, §54.5). Two
   arithmetics agree perfectly over an empty list, and a slice that captured
   nothing would pass every section below it — so §1 asserts the reference
   loaded, and §8 asserts that all six awkward cases are actually IN it: a
   flat channel and a split one, a rate channel and a count one, a season, an
   increment, a per-cent driver and a plus-n uplift. Without §8 this file
   would prove the port correct on the easy half and say nothing about the
   half where the two could differ.

   NO DATABASE, NO BROWSER, NO NETWORK — the whole model is pure functions,
   which is what spec 062 §5 asks for in those words.

     node --experimental-strip-types checks/drivers.mjs
     SMP_BREAK=no-season-cut      node … checks/drivers.mjs   # must go red
     SMP_BREAK=count-prorated     node … checks/drivers.mjs   # must go red
     SMP_BREAK=pct-raw            node … checks/drivers.mjs   # must go red
     SMP_BREAK=increment-baseline node … checks/drivers.mjs   # must go red
     SMP_BREAK=no-interaction     node … checks/drivers.mjs   # must go red */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import {
  seasonMonths, monthsFor, periodFigures,
  subFigures, channelFigures, treeFigures, revenueTarget, bridge,
} from "../lib/drivers.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REF = join(HERE, "..", "..", "specs", "062-revenue-drivers", "reference",
                 "revenue-driver-tree-tool-v12.html");

let pass = 0; const bad = [];
const ok = (label, good, detail) => {
  if (good) { pass++; console.log("  ok   " + label); }
  else { bad.push(label); console.log("  FAIL " + label + (detail ? "  — " + detail : "")); }
};
/* Money compared as money: a relative epsilon, because these run to 1e9 and
   an absolute one would either pass a real drift or fail on float noise. */
const near = (a, b) => {
  if (!isFinite(a) || !isFinite(b)) return a === b || (Number.isNaN(a) && Number.isNaN(b));
  const m = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / m < 1e-9;
};

/* ══ §1 · THE REFERENCE, RUN RATHER THAN READ ══════════════════════════ */
console.log("\n§1 · the reference tool");

const html = readFileSync(REF, "utf8");
/* Slice the arithmetic out of his file: from the driver constructor down to
   the last roll-up. Everything after it touches `document` and is a screen. */
const from = html.indexOf("const D = (n,k,u,b,up,note,uu)");
const to = html.indexOf("const totals = () => agg(model, cCalc);");
ok("the arithmetic was found in the reference file", from > 0 && to > from,
   "from=" + from + " to=" + to);
const stop = (why) => { console.log("\ncannot continue — " + why); console.log("\n" + (bad.length || 1) + " FAILED"); process.exit(1); };
if (from < 0 || to < 0) stop("the reference file's shape moved");

/* AND IT HAS TO BE HANDED BACK EXPLICITLY. A `const` or `let` at the top
   level of a script does NOT become a property of the sandbox — only `var`
   and function declarations do — so reading them off the context returns
   nothing and every comparison below would be against `undefined`. The
   epilogue names them; his file is not touched. */
const TAIL = "const totals = () => agg(model, cCalc);";
const EPILOGUE = "\n;globalThis.__out = { SEASONS, SKELETON, model, tCalc, sCalc, cCalc, totals," +
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
if (missing.length || !Array.isArray(T.SEASONS) || !Array.isArray(T.model))
  stop("the reference's arithmetic did not come back out of the sandbox");

ok("his own five channels are loaded", Array.isArray(theirs) && theirs.length === 5,
   "channels=" + (theirs || []).length);
ok("at least one season is defined", Array.isArray(T.SEASONS) && T.SEASONS.length >= 1);

/* ══ §2 · THE SAME TREE, IN THE PORT'S SHAPE ═══════════════════════════
   ONE RENAME AND NOTHING ELSE — `tables` is his word for a period and reads
   as a database table in this codebase. The conversion is asserted rather
   than trusted: a drop anywhere in it would make every agreement below it an
   agreement about fewer rows (§113.8). */
console.log("\n§2 · the tree, converted");

const tree = {
  seasons: T.SEASONS.map((s) => ({ id: s.id, name: s.name, start: s.start, end: s.end })),
  channels: theirs.map((ch) => ({
    name: ch.name, mode: ch.mode, flat: ch.flat,
    subs: ch.subs.map((sub) => ({
      name: sub.name,
      periods: sub.tables.map((t) => ({
        name: t.name, type: t.type, seasonId: t.seasonId,
        drivers: t.drivers.map((d) => ({
          name: d.name, kind: d.kind, unit: d.unit,
          base: d.base, up: d.up, upUnit: d.upUnit, note: d.note || "",
        })),
      })),
    })),
  })),
};

const countTheirs = (k) => theirs.reduce((n, ch) =>
  n + ch.subs.reduce((m, s) => m + (k === "sub" ? 1 : s.tables.reduce((q, t) =>
    q + (k === "period" ? 1 : t.drivers.length), 0)), 0), 0);
const countMine = (k) => tree.channels.reduce((n, ch) =>
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
     near(T.seasonMonths(s), seasonMonths(tree.seasons[i])),
     "theirs=" + T.seasonMonths(s) + " ours=" + seasonMonths(tree.seasons[i]));
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
      const mine = tree.channels[ci].subs[si].periods[ti];
      const a = T.tCalc(t, ch, sub);
      const b = periodFigures(tree, tree.channels[ci], tree.channels[ci].subs[si], mine);
      const where = ch.name + " · " + sub.name + " · " + t.name;
      const mOk = near(T.monthsFor(t, ch, sub), monthsFor(tree, tree.channels[ci], tree.channels[ci].subs[si], mine))
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
console.log("\n§5 · sub-channel, channel, whole tree");
theirs.forEach((ch, ci) => {
  ch.subs.forEach((sub, si) => {
    const a = T.sCalc(ch, sub), b = subFigures(tree, tree.channels[ci], tree.channels[ci].subs[si]);
    ok("sub-channel agrees — " + ch.name + " · " + sub.name, KEYS.every((k) => near(a[k], b[k])));
  });
  const a = T.cCalc(ch), b = channelFigures(tree, tree.channels[ci]);
  ok("channel agrees — " + ch.name, KEYS.every((k) => near(a[k], b[k])),
     "theirs Y1=" + a.b1 + " ours Y1=" + b.b1);
});
const tA = T.totals(), tB = treeFigures(tree);
ok("the whole tree agrees", KEYS.every((k) => near(tA[k], tB[k])),
   "theirs Y1=" + tA.b1 + " ours Y1=" + tB.b1);
/* AND THE TOTAL IS NOT NOUGHT — two empty arithmetics agree perfectly. */
ok("and it is a real number", tB.b1 > 0 && tB.growth !== 0,
   "Y1=" + Math.round(tB.b1) + " growth=" + Math.round(tB.growth));

/* ══ §6 · THE GROWTH SPLIT ═════════════════════════════════════════════ */
console.log("\n§6 · where the growth comes from");
const br = bridge(tB);
ok("the four parts add up to the growth they explain",
   near(br.volume + br.price + br.interaction + br.newBusiness, tB.growth),
   "parts=" + (br.volume + br.price + br.interaction + br.newBusiness) + " growth=" + tB.growth);
ok("the shares add to 100%", br.shares &&
   Math.abs(br.shares.volume + br.shares.price + br.shares.interaction + br.shares.newBusiness - 100) < 1e-6);
ok("a plan that does not grow is given no shares at all",
   bridge({ b0: 100, b1: 100, growth: 0, volEff: 0, valEff: 0, intEff: 0, newEff: 0 }).shares === null);
ok("and it says so in words rather than printing nought per cent",
   /does not grow/.test(bridge({ b0: 100, b1: 90, growth: -10, volEff: -10, valEff: 0, intEff: 0, newEff: 0 }).reading));

/* ══ §7 · THE UNIT'S REVENUE TARGET (spec 062 §4.2) ════════════════════ */
console.log("\n§7 · the revenue target a unit would read");
ok("a channel's Year 1 figure is the target",
   near(revenueTarget(tree, "Retail"), channelFigures(tree, tree.channels[0]).b1),
   "Retail Y1=" + Math.round(revenueTarget(tree, "Retail")));
/* BOTH ENDS (§94.2): a unit with no channel has NO target, which is a
   different fact from a target of nought and must never be scored as one. */
ok("a unit with no channel in the tree has no target, not a target of nought",
   revenueTarget(tree, "Nothing by this name") === null);

/* ══ §8 · THE FIXTURE IS WORTH COMPARING (§113.8) ══════════════════════
   Every case where the two arithmetics COULD differ, asserted present in the
   tree above. Without this the file proves agreement on the easy half. */
console.log("\n§8 · the awkward cases are actually in it");
const every = { periods: [], drivers: [] };
tree.channels.forEach((ch) => ch.subs.forEach((s) => s.periods.forEach((p) => {
  every.periods.push({ ch, p }); p.drivers.forEach((d) => every.drivers.push(d));
})));
ok("a flat channel", tree.channels.some((c) => c.flat));
ok("a channel split into sub-channels", tree.channels.some((c) => !c.flat && c.subs.length > 1));
ok("a rate channel", tree.channels.some((c) => c.mode === "rate"));
ok("a count channel, which is never prorated", tree.channels.some((c) => c.mode === "count"));
ok("a season period, cut out of a base year", every.periods.some((x) => x.p.type === "season"));
ok("an increment, which has no baseline", every.periods.some((x) => x.p.type === "increment"));
ok("a per-cent driver, which divides by 100", every.drivers.some((d) => d.unit === "%"));
ok("a plus-n uplift, which adds rather than scales", every.drivers.some((d) => d.upUnit === "#"));
ok("a driver carrying its rationale", every.drivers.some((d) => d.note && d.note.length > 20));
/* AND THE BASE PERIOD REALLY IS SHORTENED BY ITS SEASON — the one line
   §3.4 turns on. A tree whose seasons were ignored would agree with a port
   that ignored them too, so this asserts the FACT and not the agreement. */
const shortened = every.periods.some((x) =>
  x.p.type === "base" && x.ch.mode === "rate" &&
  monthsFor(tree, x.ch, x.ch.subs.find((s) => s.periods.includes(x.p)), x.p) < 11.99);
ok("and a base period is genuinely shortened by its season", shortened);

/* ══ VERDICT ═══════════════════════════════════════════════════════════ */
console.log("\n" + (bad.length ? bad.length + " FAILED of " + (pass + bad.length) : pass + " checks, 0 failed"));
if (bad.length) { bad.forEach((b) => console.log("  · " + b)); process.exit(1); }
