#!/usr/bin/env node
/* WHAT THE DESTINATION ROW OFFERS, AND WHY (§380).
 *
 * Islam, viewing as a unit's strategy custodian on the build §376 shipped:
 * *"when viewing as Mahdy he started seeing the other units and functions
 * while he should only see his unit."*
 *
 * He was right, and the cause is one property. The Insights tab is keyed on
 * `c_kb`, which is `area:"always"` — view, for every role, at every target —
 * so `allowed(SUBS.unit, k)` came back non-empty for every unit in the
 * tenant, for everybody, and `myUnits()` is written on top of it. The group
 * button and the Units | Functions switch went with it.
 *
 * THE ASSERTION IS AN AGREEMENT, NEVER A LIST (§94.8): the row a person is
 * offered with the library on the tab list must be the row they are offered
 * without it. That stays true when a unit is added, when somebody's grants
 * change, and when a SECOND client-wide tab is added tomorrow — which a list
 * of expected destinations would not.
 *
 * IT RUNS THE SHIPPED CODE, NOT A MODEL OF IT (§100.3). The built file's own
 * inline script is evaluated in a vm behind a global that answers for the
 * hundreds of render functions `SUBS` names, and the only things supplied
 * are the four answers the gates ask for — `grantAt` (the product's own
 * shared rule, over the worked example), the active keys, and whether the
 * library is on the tab row at all.
 *
 *     node scripts/test-nav-row.js
 *     node scripts/test-nav-row.js --break=everywhere     (must go red)
 *     node scripts/test-nav-row.js --built <path>         (another build)
 */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..");
const R = require(path.join(ROOT, "lib", "rules.js"));
const GRAPH = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));
const W = R.worldOf(GRAPH);

const argv = process.argv.slice(2);
const argOf = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };
const BREAK = (argv.find((a) => a.startsWith("--break=")) || "").split("=")[1] || "";
const BUILT = argOf("--built") ||
  path.join(ROOT, "SMP-Project-Folder", "src", "strategy-management-platform.html");

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

/* THE BREAK IS MADE FROM THE SOURCE (§276), because the thing under test is
   one `.filter` in the shipped script: with it gone, `ownTabs` is `allowed`
   and the fault is back exactly as it was. */
let script = (() => {
  const html = fs.readFileSync(BUILT, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) throw new Error("no inline script in " + BUILT);
  return blocks.reduce((a, b) => (b.length > a.length ? b : a));
})();
if (BREAK === "everywhere") {
  const filter = ".filter(function(d){ return !d.everywhere; })";
  if (script.indexOf(filter) < 0) throw new Error("--break=everywhere: the filter is not in this build");
  script = script.replace(filter, "");          /* asserted MATCHED before written (§344.1) */
}

const units = Object.keys(GRAPH.units || {}).filter((k) => (GRAPH.units[k] || {}).active !== false);
const fns = Object.keys(GRAPH.functions || {}).filter((k) => (GRAPH.functions[k] || {}).active !== false);

let PERSON = null, LIBRARY_ON = true, MYLINES = "off";
const box = {};
const supplied = {
  UNITS: GRAPH.units, FUNCTIONS: GRAPH.functions, COMPANIES: GRAPH.companies || {},
  FUNCTION_KEYS: fns,
  activeKeys: () => units,
  fnShows: () => true,
  capsReachable: () => [],
  companiesReachable: () => [],
  navName: (o) => (o && o.name) || "",
  TARGET: "group",
  /* the two `when` helpers a unit's and a function's tab lists ask; both OFF,
     which is the ordinary state and the one where the library would be the
     only tab left standing */
  reportSectionState: () => null,
  namingOn: () => false,
  LIBRARY: { shown: () => LIBRARY_ON, sections: () => [] },
  grantAt: (ac, target) => R.grantAtPage(W, PERSON, ac, target),
  /* §379's My reporting tab, ANSWERED HERE RATHER THAN RUN, and saying which
     is the point (§100.3). Its real `myLinesHere()` lives in config-data.js,
     which this harness deliberately does not evaluate — it takes the ONE
     largest inline block, because the gates under test are all in it.

     AND AN UNSUPPLIED `when` IS NOT A CLOSED ONE, which is how this was
     found: the host answers an unknown name with `undefined`, `allowed()`
     reads `if (d.when && ...)`, and a tab whose gate is undefined skips
     straight to `grantAt` — which for `c_mylines` is `area:"always"` and
     therefore "view" for everybody, at every target. So the merged build
     reported §380's own fault on a build that does not have it: 10 units and
     8 functions for somebody who reaches nowhere. The product is fine and was
     checked rather than assumed — in the built file `myLinesHere` is declared
     44,000 lines before the tab object is created.

     THREE STATES, because a stand-in that can only answer "no" makes every
     assertion below pass while proving nothing about this tab (§113.8):
       off    what an untouched tenant is — the switch ships off, so
              `ownsAnyLine()` is false for all 33 people on the seed;
       own    the switch on — the tab is drawn on the person's OWN place and
              nowhere else, which is Islam's answer to his own case 2;
       always a tab that ignores its gate, which MUST move the row or this
              harness cannot see §380's fault through a `when` at all.
     `homeOf` mirrors `myLinesHome()` off the person's row rather than calling
     it, for the same reason — named as a mirror so nobody reads it as the
     rule (§53.5). */
  myLinesHere: (t) => (MYLINES === "off" ? false
                     : MYLINES === "always" ? true
                     : ownsALine(PERSON) && homeOf(PERSON) === String(t || "")),
};
/* Does the plan name this person as a tactic's Owner anywhere? The product's
   own `ownedBy()` is asked rather than a second matcher written here, so
   §130.7's name runs and a typed short name reach this the day they reach the
   page. The WALK is mirrored (their `myLineRows()` lives in config-data.js),
   which is the half a comment has to name (§53.5). */
function ownsALine(p) {
  if (!p) return false;
  const pillarsOf = (o) => (o && o.items) || [];
  const any = (items) => items.some((pl) =>
    ((pl || {}).tactics || []).some((t) => R.ownedBy(t, p)));
  if (Object.keys(GRAPH.units || {}).some((k) => any(pillarsOf(GRAPH.units[k])))) return true;
  return Object.keys(GRAPH.functions || {}).some((k) => {
    const f = GRAPH.functions[k] || {};
    return String(f.format) === "pillars" && any(pillarsOf(f));
  });
}
function homeOf(p) {
  if (!p) return "group";
  if (p.unit && GRAPH.units[p.unit]) return p.unit;
  if (p.fn) return "fn:" + p.fn;
  if (p.company) return "co:" + p.company;
  return "group";
}
const host = new Proxy(box, {
  has: () => true,
  get: (t, k) => (k in supplied ? supplied[k] : t[k]),
  set: (t, k, v) => { t[k] = v; return true; },
});
const ctx = vm.createContext(host);
try { vm.runInContext(script, ctx, { filename: "shell-inline.js" }); }
catch (e) { /* the tail of the shell wires the document; the gates are declared above it */ }

const fn = (n) => { if (typeof box[n] !== "function") throw new Error("this build has no " + n + "()"); return box[n]; };
function row(p) {
  PERSON = p;
  return {
    units: fn("myUnits")().length,
    fns: fn("myFns")().length,
    group: fn("ownTabs")(box.SUBS.group, "group").length ? 1 : 0,
    switch: fn("foldsNeeded")(),
  };
}
const people = (GRAPH.people || []).slice().sort((a, b) => String(a.key).localeCompare(String(b.key)));

console.log("\n§1  the gates are the shipped ones");
const GATES = ["allowed", "ownTabs", "myUnits", "myFns", "foldsNeeded", "anyDestination"];
GATES.forEach((n) => check(n + "() is in this build", typeof box[n] === "function"));
/* A CHECK THAT DIES REPORTS NOTHING (§215). Measured against a build from
   before §380 every later section would throw on the first missing gate and
   print a stack trace where a verdict belongs — which is exactly the run
   somebody makes to establish that a fault is not theirs (§303). */
if (GATES.some((n) => typeof box[n] !== "function")) {
  console.log("\nnav-row: " + ok + " ok, " + bad.length + " failed" +
    "\n  this build predates \u00a7380 \u2014 the gates it measures are not in it, " +
    "so nothing below could be asked");
  process.exit(1);
}

console.log("\n§2  the library is not what makes a destination reachable");
const moved = [];
for (const p of people) {
  LIBRARY_ON = false; const off = JSON.stringify(row(p));
  LIBRARY_ON = true;  const on = JSON.stringify(row(p));
  if (off !== on) moved.push(p.key + ": " + off + " -> " + on);
}
check("every person is offered the same row with the library as without it — " +
  people.length + " of " + people.length,
  moved.length === 0, moved.length ? moved.length + " moved: " + moved.slice(0, 3).join("; ") : "");

console.log("\n§3  and the row still says what it always said (§94.2)");
LIBRARY_ON = true;
const R_ = (k) => row(people.find((p) => p.key === k));
const smo = R_("smo"), mob = R_("own_mob"), ret = R_("own_ret");
check("the SMO reaches every unit and every function",
  smo.units === units.length && smo.fns === fns.length, JSON.stringify(smo));
check("...and meets the Units | Functions switch", smo.switch === true);
check("a unit's strategy custodian reaches ONE unit (Islam's own report)",
  mob.units === 1, JSON.stringify(mob));
check("...and does not meet the switch", mob.switch === false);
check("the other unit's custodian the same", ret.units === 1 && ret.switch === false, JSON.stringify(ret));

console.log("\n§4  somebody who reaches nowhere keeps a way to the reports (§61)");
const none = R_("cfo");
check("they are offered no destination at all",
  none.units === 0 && none.fns === 0 && none.group === 0, JSON.stringify(none));
check("...so anyDestination() is false, and the switcher goes on listing Insights",
  fn("anyDestination")() === false);
PERSON = people.find((p) => p.key === "own_mob");
check("...while somebody who reaches one says true",
  fn("anyDestination")() === true);

console.log("\n§5  the My reporting tab does not make a destination reachable either (§379)");
LIBRARY_ON = true;
const rowsIn = (mode) => { MYLINES = mode; return people.map((p) => p.key + ":" + JSON.stringify(row(p))).join("|"); };
const OFF = rowsIn("off"), OWN = rowsIn("own"), ALWAYS = rowsIn("always");
MYLINES = "off";
check("with the switch off every person is offered exactly what §3 measured",
  OFF === rowsIn("off"));
check("and with it ON the row is still the same — the tab sits on the person's " +
  "own place, which they already reach (Islam's case 2)", OWN === OFF);
check("...while a tab that ignored its gate WOULD move it, so this can still " +
  "see §380's fault through a `when` (§113.8)", ALWAYS !== OFF);

console.log("\nnav-row: " + ok + " ok, " + bad.length + " failed" + (BREAK ? "   [--break=" + BREAK + "]" : ""));
if (bad.length) { bad.forEach((b) => console.log("  - " + b)); process.exit(1); }
