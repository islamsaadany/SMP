/* The fidelity proof: writeState then readState must give back a graph
   deep-equal to db/seed-state.json (after normalization: key order ignored,
   null and absent treated as the same word — which is how the codebase reads
   every optional field). A second ensureReady must not re-seed.

   Fidelity is asserted against an EXPLICIT write of the seed rather than
   against what ensureReady leaves behind. Since the clean slate (§21) a fresh
   database is seeded and then cleared by migration 004, so what ensureReady
   leaves is the client's empty tenant — which this file also checks, because
   that is now the thing a first deployment gets.

     DATABASE_URL=postgres://... node scripts/test-roundtrip.js
*/
const fs = require("fs");
const path = require("path");
const pg = require("pg");
const io = require("../lib/state-io.js");

function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v).sort().forEach(function (k) {
      if (v[k] === null || v[k] === undefined) return;
      out[k] = normalize(v[k]);
    });
    return out;
  }
  return v;
}

function firstDiff(a, b, at) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return at + " array shape " + (a && a.length) + " vs " + (b && b.length);
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], at + "[" + i + "]");
      if (d) return d;
    }
    return null;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = Object.keys(a).concat(Object.keys(b));
    for (const k of keys) {
      const d = firstDiff(a[k], b[k], at + "." + k);
      if (d) return d;
    }
    return null;
  }
  if (a !== b) return at + ": " + JSON.stringify(a) + " vs " + JSON.stringify(b);
  return null;
}

(async function () {
  io.tuneTypes(pg);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const client = await pool.connect();

  const r1 = await io.ensureReady(client);
  console.log("first ensureReady seeded:", r1.seeded);
  const r2 = await io.ensureReady(client);
  console.log("second ensureReady seeded:", r2.seeded, "(must be false)");

  /* What a first deployment actually gets: seeded, then cleared. */
  const count = async function (sql) { return Number((await client.query(sql)).rows[0].n); };
  const slate = {
    units:        await count("SELECT count(*) n FROM units"),
    functions:    await count("SELECT count(*) n FROM functions"),
    themes:       await count("SELECT count(*) n FROM themes"),
    capabilities: await count("SELECT count(*) n FROM capabilities"),
    people:       await count("SELECT count(*) n FROM people"),
    pillars:      await count("SELECT count(*) n FROM pillars"),
    measures:     await count("SELECT count(*) n FROM measures"),
    tactics:      await count("SELECT count(*) n FROM tactics"),
    unitKOs:      await count("SELECT count(*) n FROM unit_key_objectives"),
    groupKOs:     await count("SELECT count(*) n FROM group_key_objectives"),
    projects:     await count("SELECT count(*) n FROM projects"),
    history:      await count("SELECT count(*) n FROM history"),
    /* The weighting model stays; what a tenant would enter into it does not. */
    wFactors:     await count("SELECT count(*) n FROM weighting_factors"),
    wRows:        await count("SELECT count(*) n FROM weighting_rows"),
    wValues:      await count("SELECT count(*) n FROM weighting_values"),
    priorCycle:   await count("SELECT count(*) n FROM prior_cycle"),
    /* The company level survives the clean slate: companies, like the units
       and the supporting functions, are the client's own (§15.13, §21). */
    companies:    await count("SELECT count(*) n FROM companies"),
    inCompany:    await count("SELECT count(*) n FROM units WHERE company IS NOT NULL"),
    /* The horizon is the tenant's to enter (§23.5), so a fresh deployment must
       not arrive carrying the demo's 2029. */
    horizonSet:   await count("SELECT count(*) n FROM org WHERE coalesce(horizon,'') <> ''")
  };
  /* EIGHT functions since spec 010 — Merchandising, which plans in pillars and
     sits under Retail. Like the ten units and the seven before it, the
     FUNCTION survives the clean slate and its invented CONTENT does not (§21). */
  const slateOk = slate.units === 10 && slate.functions === 8 && slate.themes === 3 &&
    slate.capabilities === 8 && slate.people === 1 && slate.pillars === 0 &&
    slate.measures === 0 && slate.tactics === 0 && slate.unitKOs === 0 &&
    slate.groupKOs === 0 && slate.projects === 0 && slate.history === 0 &&
    slate.wFactors === 4 && slate.wRows === 10 && slate.wValues === 0 &&
    slate.priorCycle === 0 && slate.companies === 2 && slate.inCompany === 6 &&
    slate.horizonSet === 0;
  console.log("clean slate after first deploy:", slateOk ? "PASS" : "FAIL", JSON.stringify(slate));

  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));
  /* Fidelity is the writer's and the reader's business, not the migration's. */
  /* PICTURE SLIDES SURVIVE THE ROUND TRIP (§50). They land in the review
     row's `extra` and are merged back on read, which is why the feature needed
     no migration — but "needs no migration" is a claim, and this is the proof.
     Asserted on the SAME graph as everything else, so a picture cannot pass a
     test of its own while breaking the fixed point. */
  seed.review = seed.review || {};
  seed.review.slides = {
    [seed.unitKeys[0]]: [{ id: "psRT1", title: "Site visit", at: "cover", layout: 2,
      pics: [{ src: "data:image/png;base64,iVBORw0KGgo=", cap: "The new fit-out",
               z: 1.4, x: 62.5, y: 30 },
             { src: "data:image/jpeg;base64,/9j/4AAQ", cap: "", z: 1, x: 50, y: 50 }] }],
    "fn:_rt_": [{ id: "psRT2", title: "", at: "end", layout: 1,
      pics: [{ src: "data:image/png;base64,iVBORw0KGgo=", cap: "", z: 1, x: 0, y: 100 }] }]
  };

  await io.writeState(client, seed);
  const back = await io.readState(client);

  const a = normalize(seed), b = normalize(back);
  const equal = JSON.stringify(a) === JSON.stringify(b);
  console.log("round trip deep-equal:", equal ? "PASS" : "FAIL");
  if (!equal) console.log("first difference:", firstDiff(a, b, "state"));

  /* write the read-back state again — a fixed point, byte for byte */
  await io.writeState(client, back);
  const again = await io.readState(client);
  console.log("write(read()) fixed point:",
    JSON.stringify(normalize(again)) === JSON.stringify(b) ? "PASS" : "FAIL");

  /* Archived plans (§22). The seed carries none — the demo tenant has never
     had a plan replaced — so one is written here on purpose: a snapshot is the
     largest single document the state holds, and if it did not survive the
     round trip a restore would hand back something subtly different from what
     was archived. */
  const withArchive = JSON.parse(JSON.stringify(back));
  const mob = withArchive.units.mobile;
  withArchive.archives = [{
    id: "arch1", kind: "unit", key: "mobile", name: "Mobile",
    at: "20 Aug 2026", by: "Strategy Management Officer", why: "replaced by an upload",
    counts: { pillars: mob.items.length, measures: 19, tactics: 21, objectives: 4, reported: 14 },
    plan: { clauses: mob.clauses, aspiration: mob.aspiration, endInMind: mob.endInMind,
            keyObjectives: mob.keyObjectives, swot: mob.swot, items: mob.items }
  }];
  await io.writeState(client, withArchive);
  const archBack = await io.readState(client);
  const archOk = JSON.stringify(normalize(archBack.archives)) ===
                 JSON.stringify(normalize(withArchive.archives));
  console.log("archived plan round trip:", archOk ? "PASS" : "FAIL");
  if (!archOk) console.log("  first difference:",
    firstDiff(normalize(withArchive.archives), normalize(archBack.archives), "archives"));
  console.log("  archive holds:", (archBack.archives[0] || {}).name,
    "|", ((archBack.archives[0] || {}).plan || {}).items?.length, "pillars restorable");

  /* SQL spot checks — the exact rows the pages read */
  const spot = async function (sql) { return (await client.query(sql)).rows; };
  console.log("mobile measures:", (await spot(
    "SELECT count(*) n FROM measures m JOIN pillars p ON m.pillar_id=p.id WHERE p.unit_key='mobile'"))[0].n);
  console.log("access grants:", (await spot("SELECT count(*) n FROM access_grants"))[0].n);

  /* ── EVERY GRANT VALUE THE SCREEN CAN PRODUCE, NOT ONLY THE SHIPPED THREE
     (§172) ────────────────────────────────────────────────────────────────
     §145 gave the two Strategy cells a third state, `fill`, and the CHECK on
     `access_grants` was never widened — so the first tenant to grant it got a
     500 on that save AND on every save afterwards, of any page, because the
     refused value stays in the posted graph. It reads exactly like "Roles &
     access never saves", and that is how it was reported three times.

     NOTHING HERE COULD HAVE SEEN IT. The seed grants no `fill` anywhere, so
     this file wrote only none/view/edit and the fourth value was never once
     offered to the database — §94.2's rule with the sign reversed: a check
     that exercises only the shipped defaults cannot see a value nobody has
     set. So the values are taken from the SHARED RULE rather than listed
     here, and one is written and read back for each: a state added to
     `STATE_RANK` tomorrow is exercised the day it is added, with no list to
     remember. */
  const RULES = require("../lib/rules.js");
  const GRANTS = Object.keys(RULES.STATE_RANK);
  const gState = await io.readState(client);
  gState.access = JSON.parse(JSON.stringify(gState.access || {}));
  GRANTS.forEach(function (g, i) {
    gState.access["rtprobe" + i] = { a_unit_own_strat: g };
  });
  await io.writeState(client, gState);
  const gBack = await io.readState(client);
  const gGot = GRANTS.map(function (g, i) {
    const row = gBack.access["rtprobe" + i];
    return row && row.a_unit_own_strat;
  });
  const gOk = JSON.stringify(gGot) === JSON.stringify(GRANTS);
  console.log("every grant value round trips:", gOk ? "PASS" : "FAIL",
    "[" + GRANTS.join(", ") + "]" + (gOk ? "" : " got [" + gGot.join(", ") + "]"));
  /* Put the tenant back, so this file stays a fixed point for whatever runs
     after it (§94.2's other half: a trial that leaves state behind is a trial
     the next one measures). */
  GRANTS.forEach(function (g, i) { delete gBack.access["rtprobe" + i]; });
  await io.writeState(client, gBack);
  console.log("sample:", (await spot(
    "SELECT name, target, actual FROM measures WHERE id='mobile-P1-M2'"))[0]);

  client.release();
  await pool.end();
  if (!equal || !slateOk || !archOk || !gOk) process.exit(1);
})().catch(function (e) { console.error("FAIL:", e); process.exit(1); });
