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
  /* §215: THE PROPERTY, NOT THE MECHANISM. This asked for the path in
     `ch.set`, which was the only way a change travelled until row-level
     landed — an aspiration is now a row edit ON the unit. What the section is
     about is that the change names THIS unit and nothing else, which is true
     either way (§94.8). */
  check("...and it names the unit",
        (Object.keys(ch.set)[0] === "units." + U) ||
        ((ch.rows || []).length === 1 && ch.rows[0].at === "units." + U),
        JSON.stringify(ch).slice(0, 90));
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

/* ── §215 · ROW BY ROW, AND ONLY WHERE IT IS SAFE ──────────────────────
   Islam: *"for the business units, when you change a small thing it just
   sends the thing that changed."* The risk §210 named was a value landing on
   somebody else's row; the guard is that anything STRUCTURAL — a row added,
   removed or moved — still travels whole, and that a row is found by ID and
   never by position. Both halves are asserted, and the round trip is asserted
   to be a FIXED POINT: apply the changes and you have what the screen has. */
console.log("\n§215 · row-level changes");
(function () {
  /* Deep equality, by the module's OWN canonical comparison — asking a
     different question here than the code asks is how a test passes on a
     build that is subtly wrong (§145: Postgres reorders object keys). */
  const same = (a, b) => D.sameValue(a, b);
  const plan = () => ({
    units: {
      mobile: { name:"Mobile", aspiration:"A", swot:{s:["x"]},
        keyObjectives:[{id:"k1",target:"1"},{id:"k2",target:"2"}],
        items:[{id:"p1",name:"P1",owner:"Ann",
                 measures:[{id:"m1",target:"x"},{id:"m2",target:"y"}],
                 tactics:[{id:"t1",owner:"Ann"}]},
               {id:"p2",name:"P2",measures:[],tactics:[]}] },
      retail: { name:"Retail", aspiration:"R", keyObjectives:[], items:[] }
    },
    people: [{ key:"a", name:"A" }]
  });
  const edit = (f) => { const n = JSON.parse(JSON.stringify(plan())); f(n); return n; };
  /* A THROW IS A FAILURE, NOT THE END OF THE RUN (§192's rule, earned here).
     Breaking the structural guard makes the differ throw on a removed row —
     and the suite died at that trial, so `grep -c FAIL` read ZERO and the
     falsification looked like a pass. A count is only honest when the harness
     reports a broken trial rather than crashing on it. */
  const chg  = (f) => D.graphChanges(plan(), edit(f));
  const land = (f) => {
    try {
      const ch = chg(f);
      const r = D.applyChanges(JSON.parse(JSON.stringify(plan())), ch);
      return { ok: r.ok, error: r.error, state: r.state, changes: ch };
    } catch (e) {
      /* A shape the assertions can still read — otherwise the reporting of a
         failure fails, which is the same blindness one layer out. */
      return { ok: false, error: "THREW: " + e.message, state: null,
               changes: { set: {}, del: [] } };
    }
  };

  /* — the fine path, and it must be a FIXED POINT — */
  [["a measure's target", n => { n.units.mobile.items[0].measures[1].target = "9"; }],
   ["a tactic's owner",   n => { n.units.mobile.items[0].tactics[0].owner = "Bea"; }],
   ["a key objective",    n => { n.units.mobile.keyObjectives[1].target = "7"; }],
   ["a pillar's owner",   n => { n.units.mobile.items[0].owner = "Cy"; }],
   ["the aspiration",     n => { n.units.mobile.aspiration = "B"; }],
   ["the SWOT",           n => { n.units.mobile.swot = { s:["x","y"] }; }]
  ].forEach(function (pair) {
    const want = edit(pair[1]);
    const got = land(pair[1]);
    check("§215: " + pair[0] + " travels", got.changes.rows && got.changes.rows.length === 1,
          JSON.stringify(got.changes));
    check("§215: ...and nothing else does",
          !Object.keys(got.changes.set || {}).length && !(got.changes.del || []).length,
          JSON.stringify(got.changes.set));
    check("§215: ...and applying it gives exactly the screen's plan",
          got.ok && same(got.state, want), got.error || "differs");
  });

  /* — the guard: anything structural travels WHOLE — */
  [["a pillar added",     n => { n.units.mobile.items.push({ id:"p3", name:"P3" }); }],
   ["a pillar removed",   n => { n.units.mobile.items.pop(); }],
   ["pillars reordered",  n => { n.units.mobile.items.reverse(); }],
   ["a measure added",    n => { n.units.mobile.items[0].measures.push({ id:"m3" }); }],
   ["a measure removed",  n => { n.units.mobile.items[0].measures.pop(); }],
   ["measures reordered", n => { n.units.mobile.items[0].measures.reverse(); }],
   ["an objective added", n => { n.units.mobile.keyObjectives.push({ id:"k3" }); }]
  ].forEach(function (pair) {
    const got = land(pair[1]);
    check("§215: " + pair[0] + " falls back to the whole unit",
          !got.changes.rows && !!got.changes.set["units.mobile"], JSON.stringify(got.changes).slice(0,90));
    check("§215: ...and still lands exactly", got.ok && same(got.state, edit(pair[1])), got.error);
  });

  /* — A STRUCTURAL CHANGE **BESIDE** A FIELD EDIT, which is the case the
       guard actually exists for and the one this file could not see at first.
       Alone, an add or a reorder produces no row edits and falls back to the
       whole unit by accident, so removing the guard broke nothing measurable;
       TOGETHER, the field edit travels and the new row is silently dropped —
       a pillar that never reaches the database while the screen shows it.
       §94.5: a check that cannot fail is not a check. — */
  [["a measure edited AND a pillar added",
    n => { n.units.mobile.items[0].measures[0].target = "EDITED";
           n.units.mobile.items.push({ id:"p3", name:"NEW", measures:[], tactics:[] }); }],
   ["a measure edited AND a pillar removed",
    n => { n.units.mobile.items[0].measures[0].target = "EDITED";
           n.units.mobile.items.pop(); }],
   ["an objective edited AND one added",
    n => { n.units.mobile.keyObjectives[0].target = "EDITED";
           n.units.mobile.keyObjectives.push({ id:"k9", target:"9" }); }],
   ["a tactic edited AND a measure added in the same pillar",
    n => { n.units.mobile.items[0].tactics[0].owner = "EDITED";
           n.units.mobile.items[0].measures.push({ id:"m9", target:"9" }); }]
  ].forEach(function (pair) {
    const want = edit(pair[1]);
    const got = land(pair[1]);
    check("§215: " + pair[0] + " travels WHOLE",
          !got.changes.rows && !!got.changes.set["units.mobile"],
          JSON.stringify(got.changes).slice(0, 100));
    /* THE ASSERTION THAT MATTERS: what lands IS what the screen holds. */
    check("§215: ...and what lands is exactly what the screen has",
          got.ok && same(got.state, want), got.error || "the plan differs");
  });

  /* — A ROW WITHOUT AN ID IS NOT ADDRESSABLE (§191) — */
  (function () {
    const b = plan(); delete b.units.mobile.items[0].measures[0].id;
    const n = JSON.parse(JSON.stringify(b)); n.units.mobile.items[0].measures[1].target = "9";
    const ch = D.graphChanges(b, n);
    check("§215: a list holding an id-less row travels WHOLE",
          !ch.rows && !!ch.set["units.mobile"], JSON.stringify(ch).slice(0,80));
  })();
  (function () {
    const b = plan(); b.units.mobile.items[0].measures[1].id = "m1";   /* a duplicate */
    const n = JSON.parse(JSON.stringify(b)); n.units.mobile.items[0].measures[0].target = "9";
    const ch = D.graphChanges(b, n);
    check("§215: ...and so does one holding a duplicate id",
          !ch.rows && !!ch.set["units.mobile"], JSON.stringify(ch).slice(0,80));
  })();

  /* — TWO PEOPLE ON THE SAME UNIT NO LONGER OVERWRITE EACH OTHER.
       The scenario Islam hit on Consumer Finance: two of the office filling
       gaps on one unit at the same time, each from the same baseline. — */
  (function () {
    const stored = plan();
    const aWrote = edit(n => { n.units.mobile.items[0].measures[0].target = "AAA"; });
    const bWrote = edit(n => { n.units.mobile.items[1].name = "BBB"; });
    let world = JSON.parse(JSON.stringify(stored));
    world = D.applyChanges(world, D.graphChanges(stored, aWrote)).state;
    world = D.applyChanges(world, D.graphChanges(stored, bWrote)).state;
    check("§215: the first person's fill survives the second's save",
          world.units.mobile.items[0].measures[0].target === "AAA",
          world.units.mobile.items[0].measures[0].target);
    check("§215: ...and the second's landed too",
          world.units.mobile.items[1].name === "BBB", world.units.mobile.items[1].name);
  })();

  /* — AND A BODY NAMING A ROW THAT IS NOT THERE CHANGES NOTHING AT ALL.
       Validated before applied: half a save is worse than none. — */
  (function () {
    const t = plan();
    const r = D.applyChanges(t, { set:{}, del:[], rows:[
      { at:"units.mobile", path:["items","p1","measures"], id:"m1", set:{ target:"ok" }, del:[] },
      { at:"units.mobile", path:["items","p1","measures"], id:"NOPE", set:{ target:"bad" }, del:[] }
    ]});
    check("§215: an unknown row id is refused", !r.ok, "was ALLOWED");
    check("§215: ...and NOTHING was applied before the refusal",
          t.units.mobile.items[0].measures[0].target === "x",
          t.units.mobile.items[0].measures[0].target);
  })();
  [["a part it does not address", { at:"people.0", path:[], id:null, set:{a:1} }],
   ["a list it does not know",    { at:"units.mobile", path:["nope"], id:"k1", set:{a:1} }],
   ["a path shape it does not apply", { at:"units.mobile", path:["items","p1","measures","deeper"], id:"m1", set:{a:1} }],
   ["a pillar that is not there", { at:"units.mobile", path:["items","NOPE","measures"], id:"m1", set:{a:1} }],
   ["an entry that is not there", { at:"units.nosuch", path:[], id:null, set:{a:1} }]
  ].forEach(function (pair) {
    const r = D.applyChanges(plan(), { set:{}, del:[], rows:[pair[1]] });
    check("§215: " + pair[0] + " is refused", !r.ok, "was ALLOWED");
  });
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
