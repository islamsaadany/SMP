/* THE BLANK LINES ALREADY IN A TENANT'S PLAN (§253) — the server half.
   ═══════════════════════════════════════════════════════════════════════

   Islam, from a client's plan with the pen open: a tactic's name box 643px
   tall holding one line. The value was carrying thirty blank lines, and every
   other surface prints these fields on one line, so nothing but the pen ever
   showed it.

   WHAT THIS ASSERTS, and why each half is here:

   1. A TENANT ALREADY HOLDING THEM IS HEALED — on a unit, on a supporting
      function that plans in pillars (whose whole plan is one JSON blob, §118)
      and on a capability's project, because those are three different shapes
      and a heal that reached only the first would leave two thirds of a
      client's plan exactly as it was.

   2. THE PARAGRAPHS SURVIVE (§113.8, both ends). A capability's definition, a
      unit's aspiration and a reporter's note are prose that is MEANT to hold
      breaks — a heal that flattened them would pass every assertion above
      while destroying content, which is the worse failure of the two.

   3. NO WORD IS LOST. The healed value is asserted to hold the same words in
      the same order, never merely to be shorter.

   4. IT RUNS ONCE. The registry row is what stops it, so a second ensureReady
      must not rewrite anything — asserted by putting a break BACK afterwards
      and finding it still there.

   Run:  DATABASE_URL=postgres://... node scripts/test-one-line-heal.js       */
const path = require("path");
const pg = require("pg");
const io = require(path.join(__dirname, "..", "lib", "state-io.js"));
const R = require(path.join(__dirname, "..", "lib", "rules.js"));

let bad = 0;
function ck(what, ok, got) {
  if (!ok) bad++;
  console.log((ok ? "  ok      " : "  FAIL    ") + what +
    (ok || got === undefined ? "" : "  — " + JSON.stringify(got)));
}
const words = (s) => String(s || "").split(/\s+/).filter(Boolean).join(" ");

(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  try {
    await io.ensureReady(client);

    /* MAKE THE STATE (§94.2), AND MAKE IT A REAL PLAN. A first deployment is
       a CLEAN SLATE (§21) — no pillars, no capabilities — so this writes the
       worked example first and puts the fault into ITS rows: hand-built rows
       are a guess at the shape the writer expects, and a guess that is wrong
       fails as a database error rather than as a finding. */
    const s0 = JSON.parse(JSON.stringify(
      require(path.join(__dirname, "..", "db", "seed-state.json"))));
    const uk = s0.unitKeys[0];
    const unit = s0.units[uk];
    const tac = unit.items[0].tactics[0];
    tac.name = "Utilize Raya shop as the digital interface" + "\n".repeat(30);
    tac.description = "Raya Trade and Raya Group" + "\n\n";
    tac.outcome = "Min 3 BUs On-boarded\non Raya Shop";
    unit.items[0].measures[0].name = "Orders processed\ndigitally";
    unit.keyObjectives[0].name = "Grow the category\n\n";
    unit.items[0].name = "Digital & Data-Driven Operations\n";
    /* The paragraphs that must NOT move. */
    unit.aspiration = "First line.\n\nSecond paragraph.";
    unit.items[0].tactics[0].note = "Late because\n\nof the supplier.";

    /* A supporting function that plans in pillars — one JSON blob (§118). */
    const fk = s0.functionKeys.find((k) => (s0.functions[k].items || []).length) ||
               s0.functionKeys[0];
    const fn = s0.functions[fk];
    fn.items[0].name = "A function pillar\n\n\n";
    fn.items[0].tactics[0].name = "A function tactic\n\n";
    fn.keyObjectives = [{ id: "fnko-oneline", name: "A function objective\n\n", dir: "\u2265" }];

    /* A capability's project, its two evidence halves and a milestone. */
    const cap = s0.group.capabilities.find((c) => (c.projects || []).length);
    const proj = cap.projects[0];
    proj.name = "Rebuild the month-end close\n\n";
    proj.brief = "What this project is for\nand what changes at the end of it.";
    cap.def = "A definition.\n\nWith two paragraphs.";
    if (proj.outcomes[0]) proj.outcomes[0].name = "Days to a signed set\nof accounts";
    if (proj.milestones[0]) {
      proj.milestones[0].name = "Agree the new close calendar\n\n\n";
      proj.milestones[0].covers = "The ten units\nand the two companies";
    }
    const before = {
      tac: tac.name, desc: tac.description, out: tac.outcome,
      asp: unit.aspiration, note: unit.items[0].tactics[0].note, def: cap.def,
      brief: proj.brief
    };
    await io.writeState(client, s0);

    /* It is in the database, breaks and all — or the rest of this proves
       nothing about a heal (§94.5). */
    const dirty = await io.readState(client);
    ck("the fault is really stored",
      dirty.units[uk].items[0].tactics[0].name.indexOf("\n") > -1,
      JSON.stringify(dirty.units[uk].items[0].tactics[0].name).slice(0, 40));

    /* THE HEAL. Run through the same door the deployment runs it through:
       forget the memoised ready-state and let ensureReady do it. */
    await client.query("DELETE FROM _sql_migrations WHERE name = '040-a-title-is-one-line.js'");
    io.forgetReady();
    await io.ensureReady(client);
    const s = await io.readState(client);

    const u = s.units[uk], t = u.items[0].tactics[0];
    ck("a tactic's name is one line", t.name.indexOf("\n") === -1, t.name);
    ck("...and keeps every word", words(t.name) === words(before.tac), t.name);
    ck("a tactic's description is one line", t.description.indexOf("\n") === -1, t.description);
    ck("...and keeps every word", words(t.description) === words(before.desc), t.description);
    ck("a tactic's outcome is one line", t.outcome.indexOf("\n") === -1, t.outcome);
    ck("...and keeps every word", words(t.outcome) === words(before.out), t.outcome);
    ck("a measure's name is one line",
      u.items[0].measures[0].name.indexOf("\n") === -1, u.items[0].measures[0].name);
    ck("a key objective's name is one line",
      u.keyObjectives[0].name.indexOf("\n") === -1, u.keyObjectives[0].name);
    ck("a pillar's name is one line",
      u.items[0].name.indexOf("\n") === -1, u.items[0].name);

    /* THE FUNCTION'S BLOB — the third of a client's plan a column-by-column
       heal would have missed entirely. */
    const f = s.functions[fk];
    ck("a function's pillar is one line", f.items[0].name.indexOf("\n") === -1, f.items[0].name);
    ck("a function's tactic is one line",
      f.items[0].tactics[0].name.indexOf("\n") === -1, f.items[0].tactics[0].name);
    ck("a function's objective is one line",
      f.keyObjectives[0].name.indexOf("\n") === -1, f.keyObjectives[0].name);

    const c2 = (s.group.capabilities || []).find((c) => c.id === cap.id);
    const p2 = c2.projects.find((p) => p.id === proj.id);
    ck("a project's name is one line", p2.name.indexOf("\n") === -1, p2.name);
    ck("a project's brief is one line", p2.brief.indexOf("\n") === -1, p2.brief);
    ck("...and keeps every word", words(p2.brief) === words(before.brief), p2.brief);
    if (proj.outcomes[0])
      ck("an outcome's name is one line",
        p2.outcomes[0].name.indexOf("\n") === -1, p2.outcomes[0].name);
    if (proj.milestones[0]) {
      ck("a milestone's name is one line",
        p2.milestones[0].name.indexOf("\n") === -1, p2.milestones[0].name);
      ck("what it covers is one line",
        p2.milestones[0].covers.indexOf("\n") === -1, p2.milestones[0].covers);
    }

    /* BOTH ENDS: the paragraphs are untouched, byte for byte. */
    ck("an aspiration keeps its paragraphs", u.aspiration === before.asp, u.aspiration);
    ck("a capability's definition keeps its paragraphs", c2.def === before.def, c2.def);
    ck("a reporter's note keeps its paragraphs",
      u.items[0].tactics[0].note === before.note, u.items[0].tactics[0].note);

    /* AND IT RUNS ONCE. Put a break back and open the deployment again: the
       registry row is what must stop it, not the absence of anything to do. */
    const s2 = await io.readState(client);
    s2.units[uk].items[0].tactics[0].name = "Typed again\n\nafter the heal";
    await io.writeState(client, s2);
    io.forgetReady();
    await io.ensureReady(client);
    const s3 = await io.readState(client);
    ck("it does not run a second time",
      s3.units[uk].items[0].tactics[0].name.indexOf("\n") > -1,
      s3.units[uk].items[0].tactics[0].name);

    /* The walk on its own, where a graph with nothing to clean must report
       nothing to clean — a heal that always writes is a save on every boot. */
    ck("a clean graph is left alone", io.cleanOneLine(s) === 0, io.cleanOneLine(s));
    ck("the rule keeps ordinary spacing",
      R.oneLine("keep  inner   spaces") === "keep  inner   spaces");
  } finally {
    client.release();
    await pool.end();
  }
  console.log(bad ? "\n" + bad + " FAILED" : "\nall good");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
