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
    priorCycle:   await count("SELECT count(*) n FROM prior_cycle")
  };
  const slateOk = slate.units === 10 && slate.functions === 7 && slate.themes === 3 &&
    slate.capabilities === 8 && slate.people === 1 && slate.pillars === 0 &&
    slate.measures === 0 && slate.tactics === 0 && slate.unitKOs === 0 &&
    slate.groupKOs === 0 && slate.projects === 0 && slate.history === 0 &&
    slate.wFactors === 4 && slate.wRows === 10 && slate.wValues === 0 &&
    slate.priorCycle === 0;
  console.log("clean slate after first deploy:", slateOk ? "PASS" : "FAIL", JSON.stringify(slate));

  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));
  /* Fidelity is the writer's and the reader's business, not the migration's. */
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
  console.log("sample:", (await spot(
    "SELECT name, target, actual FROM measures WHERE id='mobile-P1-M2'"))[0]);

  client.release();
  await pool.end();
  if (!equal || !slateOk || !archOk) process.exit(1);
})().catch(function (e) { console.error("FAIL:", e); process.exit(1); });
