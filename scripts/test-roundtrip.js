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

/* `--client <schema>` runs the whole round trip inside ONE CLIENT's schema
   (spec 024). Worth having as a flag rather than a separate script: §113.7 is
   a migration that read a column schema.sql no longer creates — perfect on
   every database that already existed and broken on every fresh one — and the
   only way to see that class of fault is to run this against a client created
   today. */
const CLIENT_ARG = (function () {
  const i = process.argv.indexOf("--client");
  return i > -1 ? process.argv[i + 1] : "";
})();

(async function () {
  io.tuneTypes(pg);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const client = await pool.connect();
  if (CLIENT_ARG) {
    if (!/^[a-z][a-z0-9_]{0,48}$/.test(CLIENT_ARG)) throw new Error("not a schema name: " + CLIENT_ARG);
    await client.query("CREATE SCHEMA IF NOT EXISTS " + CLIENT_ARG);
    await client.query("SET search_path TO " + CLIENT_ARG);
    console.log("running inside client schema: " + CLIENT_ARG);
  }

  const r1 = await io.ensureReady(client, CLIENT_ARG || undefined);
  console.log("first ensureReady seeded:", r1.seeded);
  const r2 = await io.ensureReady(client, CLIENT_ARG || undefined);
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
  /* A CLIENT SCHEMA AND `public` ARE TWO DIFFERENT CLEAN SLATES, and asserting
     one of them of both reported FAIL on a perfectly correct empty client
     (spec 024). `public` is seeded and then cleared by migration 004, so it
     keeps the SETUP — ten units, eight functions, two companies — and loses
     every invented figure. A client created since the split is made with
     `seed: false` and never had any of it: the right expectation there is
     NOTHING AT ALL, and a check that cries wolf on the ordinary case is one
     somebody learns to scroll past. */
  const empty = Object.keys(slate).every(function (k) { return slate[k] === 0; });
  const seeded = slate.units === 10 && slate.functions === 8 && slate.themes === 3 &&
    slate.capabilities === 8 && slate.people === 1 && slate.pillars === 0 &&
    slate.measures === 0 && slate.tactics === 0 && slate.unitKOs === 0 &&
    slate.groupKOs === 0 && slate.projects === 0 && slate.history === 0 &&
    slate.wFactors === 4 && slate.wRows === 10 && slate.wValues === 0 &&
    slate.priorCycle === 0 && slate.companies === 2 && slate.inCompany === 6 &&
    slate.horizonSet === 0;
  /* AND A CLIENT SOMEBODY HAS ALREADY FILLED IN IS NEITHER — the Demo client
     is seeded from the worked example on purpose, so this says so rather than
     failing (it is the round trip below that has something to prove there). */
  const slateOk = CLIENT_ARG ? (empty || (!seeded && slate.units > 0)) : seeded;
  const word = CLIENT_ARG && !empty && slateOk ? "n/a — this client holds content"
             : slateOk ? "PASS" : "FAIL";
  console.log("clean slate after first deploy:", word, JSON.stringify(slate));

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
  /* ── A PENDING FILL ON A ROW THAT HAS NEVER CARRIED ONE (§177) ─────────
     §177 made an outcome's target and a milestone's owner and due date
     fillable, and a fill is stored as `row.pend = { field: {by, at} }`. Those
     two tables have no `pend` COLUMN — the mark rides `extra`, which is what
     makes this migration-free — and "rides extra" is a claim, not a fact,
     until something writes one and reads it back (§172's lesson: a value the
     round trip has never offered the database is a value nobody has tested).
     Written on the FIRST project that has both kinds of row, so this says
     nothing about which project it is. */
  const pState = await io.readState(client);
  const pCap = (pState.group.capabilities || []).filter(function (c) {
    return (c.projects || []).some(function (pr) {
      return (pr.outcomes || []).length && (pr.milestones || []).length; });
  })[0];
  if (!pCap) {
    console.log("pending marks round trip: SKIPPED — no project with both an outcome and a milestone");
  } else {
    const pPr = pCap.projects.filter(function (pr) {
      return (pr.outcomes || []).length && (pr.milestones || []).length; })[0];
    const MARK = { by: "rtprobe", at: "2026-08-29" };
    pPr.outcomes[0].pend = { target: MARK };
    pPr.milestones[0].pend = { finish: MARK, owner: MARK };
    await io.writeState(client, pState);
    const pBack = await io.readState(client);
    const bCap = (pBack.group.capabilities || []).filter(function (c) { return c.id === pCap.id; })[0];
    const bPr = ((bCap || {}).projects || []).filter(function (x) { return x.id === pPr.id; })[0];
    const got = bPr && {
      outcome: JSON.stringify((bPr.outcomes[0].pend || {}).target),
      finish:  JSON.stringify((bPr.milestones[0].pend || {}).finish),
      owner:   JSON.stringify((bPr.milestones[0].pend || {}).owner) };
    const want = JSON.stringify(MARK);
    /* Postgres jsonb reorders an object's keys, so {by,at} comes back as
       {at,by} — the mark is compared as a VALUE, never as a string (§145). */
    const same_ = function (a) {
      const o = JSON.parse(a || "null");
      return !!o && o.by === MARK.by && o.at === MARK.at;
    };
    const pOk = got && same_(got.outcome) && same_(got.finish) && same_(got.owner);
    console.log("pending marks round trip:", pOk ? "PASS" : "FAIL",
      pOk ? "[outcome.target, milestone.finish, milestone.owner]" : JSON.stringify(got));
    /* And put it back, or the next run measures this one's leavings. */
    delete bPr.outcomes[0].pend;
    delete bPr.milestones[0].pend;
    await io.writeState(client, pBack);
    const cleaned = await io.readState(client);
    const cCap = (cleaned.group.capabilities || []).filter(function (c) { return c.id === pCap.id; })[0];
    const cPr = ((cCap || {}).projects || []).filter(function (x) { return x.id === pPr.id; })[0];
    console.log("  ...and clears again:",
      (!cPr.outcomes[0].pend && !cPr.milestones[0].pend) ? "PASS" : "FAIL");
  }

  /* ── A MONTHLY PLAN SURVIVES THE DATABASE (§278) ────────────────────
     "No migration and no schema change" is a claim about `extra` JSONB, and
     §172 is the reason it is not left as one: that section's fourth grant
     value was agreed by four layers and REFUSED by a CHECK constraint nobody
     had asked, because the seed never offered one. The seed carries no
     monthly plan either, so the round trip above proves nothing about it —
     one is written and read back here, on all three shapes that can hold one.

     THE NULLS ARE THE POINT. A half-filled plan is stored, and a blank month
     must come back as null rather than as 0 — through `JSON.stringify` into
     jsonb and out again, where a lost null would silently put the row IN
     FORCE against a target nobody typed (§278, §104.10). */
  const mState = await io.readState(client);
  const mUnit = Object.keys(mState.units)[0];
  const mPil = (mState.units[mUnit].items || [])[0];
  const mMeas = mPil && (mPil.measures || [])[0];
  const mTac = mPil && (mPil.tactics || [])[0];
  const mKo = (mState.units[mUnit].keyObjectives || [])[0];
  if (mMeas && mTac && mKo) {
    const FULL = [15, 14, 16, 16, 17, 18, 24, 28, 32, 36, 40, 44];
    const PART = [0, 1, null, null, null, null, null, null, null, null, null, null];
    mMeas.monthly = FULL.slice();
    mKo.monthly = PART.slice();
    mTac.outMonthly = FULL.slice();
    await io.writeState(client, mState);
    const mBack = await io.readState(client);
    const bPil = (mBack.units[mUnit].items || []).filter(function (p) { return p.id === mPil.id; })[0];
    const bMeas = bPil && (bPil.measures || []).filter(function (x) { return x.id === mMeas.id; })[0];
    const bTac = bPil && (bPil.tactics || []).filter(function (x) { return x.id === mTac.id; })[0];
    const bKo = (mBack.units[mUnit].keyObjectives || []).filter(function (x) { return x.id === mKo.id; })[0];
    const same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
    const mOk = bMeas && bTac && bKo &&
      same(bMeas.monthly, FULL) && same(bTac.outMonthly, FULL) && same(bKo.monthly, PART);
    console.log("monthly plan round trip:", mOk ? "PASS" : "FAIL",
      mOk ? "[measure, tactic outcome, key objective — nulls kept]"
          : JSON.stringify({ meas: bMeas && bMeas.monthly, tac: bTac && bTac.outMonthly,
                             ko: bKo && bKo.monthly }));
    if (!mOk) process.exitCode = 1;
    /* AND THE KEY LEAVES AGAIN (§50.6). A row that never had one and one
       whose plan was cleared must be byte-identical, or every save after a
       clear carries a change nobody made. */
    delete bMeas.monthly; delete bTac.outMonthly; delete bKo.monthly;
    await io.writeState(client, mBack);
    const mClean = await io.readState(client);
    const cPil = (mClean.units[mUnit].items || []).filter(function (p) { return p.id === mPil.id; })[0];
    const cMeas = cPil && (cPil.measures || []).filter(function (x) { return x.id === mMeas.id; })[0];
    const cTac = cPil && (cPil.tactics || []).filter(function (x) { return x.id === mTac.id; })[0];
    const cKo = (mClean.units[mUnit].keyObjectives || []).filter(function (x) { return x.id === mKo.id; })[0];
    const cOk = cMeas && !("monthly" in cMeas) && !("outMonthly" in cTac) && !("monthly" in cKo);
    console.log("  ...and clears again, key DELETED:", cOk ? "PASS" : "FAIL");
    if (!cOk) process.exitCode = 1;
  } else {
    console.log("monthly plan round trip: SKIPPED — no measure/tactic/objective in the seed");
    process.exitCode = 1;
  }

  console.log("sample:", (await spot(
    "SELECT name, target, actual FROM measures WHERE id='mobile-P1-M2'"))[0]);

  client.release();
  await pool.end();
  if (!equal || !slateOk || !archOk || !gOk) process.exit(1);
})().catch(function (e) { console.error("FAIL:", e); process.exit(1); });
