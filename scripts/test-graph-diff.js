/* §210 — the change list, tested on its own before it is wired to anything.
   The properties that matter: only what changed travels; applying to a
   DIFFERENT target leaves that target's other work alone; and a path the
   server does not understand is refused rather than guessed at. */
const fs = require("fs");
const D = require("/home/user/SMP/lib/graph-diff.js");
const SEED = JSON.parse(fs.readFileSync("/home/user/SMP/db/seed-state.json", "utf8"));
const clone = o => JSON.parse(JSON.stringify(o));
let pass = 0, fail = 0;
function check(w, ok, x) {
  if (ok) { pass++; console.log("  ok  " + w); }
  else { fail++; console.log("  FAIL  " + w + (x ? "  — " + x : "")); }
}

const U = Object.keys(SEED.units)[0], U2 = Object.keys(SEED.units)[1];

console.log("\n1 · only what changed travels");
{
  const base = clone(SEED), next = clone(SEED);
  next.units[U].aspiration = "Changed";
  const ch = D.graphChanges(base, next);
  check("one part changed", D.countChanges(ch) === 1, JSON.stringify(Object.keys(ch.set)));
  check("...and it names the unit", Object.keys(ch.set)[0] === "units." + U, Object.keys(ch.set)[0]);
  check("nothing was deleted", ch.del.length === 0, JSON.stringify(ch.del));
}
{
  const base = clone(SEED), next = clone(SEED);
  const ch = D.graphChanges(base, next);
  check("an untouched graph sends NOTHING", D.countChanges(ch) === 0,
        JSON.stringify(ch).slice(0, 120));
}
{
  /* key order must not read as a change — Postgres jsonb reorders it (§145) */
  const base = clone(SEED), next = clone(SEED);
  const u = next.units[U];
  const reordered = {}; Object.keys(u).sort().reverse().forEach(k => reordered[k] = u[k]);
  next.units[U] = reordered;
  check("a re-ordered object is not a change",
        D.countChanges(D.graphChanges(base, next)) === 0);
}

console.log("\n2 · applying leaves everything else alone — the overwrite, gone");
{
  const base = clone(SEED);              // what the tab hydrated from
  const next = clone(base);
  next.units[U].aspiration = "The filler's own change";
  const ch = D.graphChanges(base, next);

  // MEANWHILE the server moved on: somebody else saved other things.
  const stored = clone(base);
  stored.units[U2].aspiration = "SOMEBODY ELSE'S WORK";
  stored.people[0].name = "SOMEBODY ELSE'S RENAME";
  stored.access = Object.assign({}, stored.access, { __theirs: { a_group: "view" } });

  const out = D.applyChanges(clone(stored), ch);
  check("the change applies", out.ok, out.error);
  check("the filler's own change landed",
        out.state.units[U].aspiration === "The filler's own change");
  check("...the other unit's work SURVIVES",
        out.state.units[U2].aspiration === "SOMEBODY ELSE'S WORK",
        out.state.units[U2].aspiration);
  check("...the register rename SURVIVES",
        out.state.people[0].name === "SOMEBODY ELSE'S RENAME", out.state.people[0].name);
  check("...and the matrix change SURVIVES", !!out.state.access.__theirs);
}

console.log("\n3 · a removal is not a null");
{
  const base = clone(SEED), next = clone(SEED);
  delete next.units[U2];
  next.unitKeys = next.unitKeys.filter(k => k !== U2);
  const ch = D.graphChanges(base, next);
  check("the unit is in the delete list", ch.del.indexOf("units." + U2) > -1, JSON.stringify(ch.del));
  const out = D.applyChanges(clone(SEED), ch);
  check("...and applying removes it", out.ok && !out.state.units[U2]);
  check("...while the others stay", Object.keys(out.state.units).length === Object.keys(SEED.units).length - 1);
}
{
  const base = clone(SEED), next = clone(SEED);
  next.priorCycle = null;
  const ch = D.graphChanges(base, next);
  const nulled = ch.set.priorCycle === null || base.priorCycle === null;
  check("a value set to null is a SET, never a delete",
        ch.del.indexOf("priorCycle") < 0, JSON.stringify(ch.del));
}

console.log("\n4 · a path the server does not understand is refused");
[["units.mobile.items", "reaches inside a part written whole"],
 ["group.branding.accent", "three segments"],
 ["people.0", "people is written whole"],
 ["", "empty"],
 ["units.", "empty segment"]].forEach(([p, why]) => {
  const out = D.applyChanges(clone(SEED), { set: { [p]: 1 }, del: [] });
  check("refused: " + why + " (" + JSON.stringify(p) + ")", !out.ok, "was applied");
});
{
  const out = D.applyChanges(clone(SEED), null);
  check("refused: no change list at all", !out.ok);
  const out2 = D.applyChanges(clone(SEED), { set: [], del: {} });
  check("refused: a change list of the wrong shape", !out2.ok);
}

console.log("\n5 · a round trip is a fixed point");
{
  const base = clone(SEED), next = clone(SEED);
  next.units[U].aspiration = "A";
  next.people = next.people.concat([{ key: "new_person", name: "New Person" }]);
  next.cycle = Object.assign({}, next.cycle, { note: "a note" });
  const ch = D.graphChanges(base, next);
  const out = D.applyChanges(clone(base), ch);
  check("applying the changes to the base reproduces the screen exactly",
        D.sameValue(out.state, next), "differed");
  check("...and it took " + D.countChanges(ch) + " parts, not the whole graph",
        D.countChanges(ch) === 3, D.countChanges(ch));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
