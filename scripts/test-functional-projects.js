/* ── §322 · A FUNCTION'S PROJECTS ARE ITS OWN, AT THE STORAGE LAYER ────────
   The half the browser cannot see, and the half where being wrong is
   expensive: `projects.cap_id` is NOT NULL and CASCADEs, so a dissolve that
   does not land lets Postgres delete every project under the box while the
   save reports success (§321's own proof, one model on).

   THREE CLAIMS, each asserted at BOTH ENDS (§94.2):

   1 · NO SCHEMA CHANGE AND NO MIGRATION. A function's projects ride in
       `functions.extra` — claimed since §118 for `items` and §213 for `def`,
       and claimed WRONGLY once before in this file (§172), so it is proved by
       writing one and reading it back off a real database.
   2 · THE ONE-OFF MOVES A TENANT ONTO THE MODEL: every box dissolved, every
       project's ID unchanged, every figure still against the row it was
       entered on, the definition and objectives carried only where the
       function had none, and an archive left behind.
   3 · IT RUNS ONCE, and a tenant with no boxes has nothing to do.

   Needs a throwaway Postgres:
     DATABASE_URL=... node scripts/test-functional-projects.js               */

const { Pool } = require("pg");
const io = require("../lib/state-io.js");
const R = require("../lib/rules.js");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok  " + m); }
                       else { fail++; console.log("  FAIL " + m); } };
/* CANONICAL, NEVER `JSON.stringify` (§145, §249.3): Postgres jsonb reorders
   object keys, so an order-sensitive compare calls an untouched round trip a
   change — the exact fault §145 records a refused save for, and §249.3 records
   again as "the first comparison said FAIL and the COMPARISON was wrong". */
const canon = (v) => Array.isArray(v) ? v.map(canon)
  : (v && typeof v === "object"
      ? Object.keys(v).sort().reduce((o, k) => (o[k] = canon(v[k]), o), {})
      : v);
/* AND IT NEVER RETURNS `undefined` (§215): JSON.stringify(undefined) is not a
   string, so a failing assertion whose value is missing threw inside the
   REPORTER — the run stopped, printed one failure of several, and the count
   read as a weak falsification rather than as a check that died. */
const J = (v) => { const t = JSON.stringify(canon(v)); return t === undefined ? "undefined" : t; };
const eq = (a, b, m) => ok(J(a) === J(b),
  m + (J(a) === J(b) ? "" : "  (" + J(a).slice(0, 220) + " != " + J(b).slice(0, 220) + ")"));

/* THE FIXTURE IS THE PLATFORM'S OWN SEED, cut down — never a graph typed out
   here (§100.3, §255): a hand-built state models what I think the shape is,
   and the one thing this file exists to prove is what the shape really does. */
const SEED = require("../db/seed-state.json");
function base() {
  const s = JSON.parse(JSON.stringify(SEED));
  /* Two capabilities on ONE function, so the walk has to append rather than
     assign — a second box arriving onto a list the first already filled is
     the case a fresh array silently empties. */
  const caps = s.group.capabilities.filter(c => c.fn === "finance" || c.fn === "marketing");
  s.group.capabilities = caps;
  return s;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await io.ensureReady(client, { seed: false });

    /* ── 1 · a function's projects need no column ───────────────────────── */
    console.log("\n1 · a function's own projects round-trip with no schema change");
    const s0 = base();
    s0.functions.finance.projects = [{ id: "own-P1", capId: "fn:fin", name: "Straight to the function",
      owner: "Hossam", brief: "", stakeholders: ["Finance"], timeline: "quarter",
      start: "Q1 2026", end: "", deliverables: [], outcomes: [], milestones: [] }];
    s0.functions.finance.keyObjectives = [{ id: "fn:fin-KO1", name: "DSO", dir: "≤",
      target: "65", compile: "Latest", actual: "70", progress: 90 }];
    s0.functions.finance.def = "Run the money.";
    await io.writeState(client, s0);
    const r0 = await io.readState(client);
    eq(r0.functions.finance.projects, s0.functions.finance.projects,
       "the projects come back byte for byte");
    eq(r0.functions.finance.keyObjectives, s0.functions.finance.keyObjectives,
       "so do its key objectives");
    eq(r0.functions.finance.def, "Run the money.", "and its definition");
    const cols = (await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"
    )).rows.map(r => r.column_name).sort();
    ok(cols.indexOf("fn_key") === -1,
       "and `projects` gained NO column — they ride in functions.extra (§118)");
    const capProj = s0.group.capabilities.reduce((a, c) => a + c.projects.length, 0);
    const inTable = (await client.query("SELECT count(*)::int n FROM projects")).rows[0].n;
    ok(inTable === capProj,
       "the capabilities' " + capProj + " projects are rows; the function's own is not (" +
       inTable + ")");

    /* ── 2 · the one-off moves a tenant onto the model ──────────────────── */
    console.log("\n2 · the one-off dissolves every box into its function");
    /* THE HEAL RECORDS ITSELF, and ensureReady above already ran it on the
       empty database — so without this the fixture is written AFTER the one
       thing under test has declared itself done, and every assertion below
       reports a working migration as broken. §54.5 wearing a registry row. */
    await client.query("DELETE FROM _sql_migrations WHERE name LIKE '045-%'");
    await io.writeState(client, base());
    const before = await io.readState(client);
    const finCaps = before.group.capabilities.filter(c => c.fn === "finance");
    const mktCaps = before.group.capabilities.filter(c => c.fn === "marketing");
    const idsBefore = finCaps.reduce((a, c) => a.concat(c.projects.map(p => p.id)), []).sort();
    const mktIds = mktCaps.reduce((a, c) => a.concat(c.projects.map(p => p.id)), []);
    const firstId = finCaps[0].projects[0].id;
    const figBefore = JSON.stringify(finCaps[0].projects[0]);
    const capDef = finCaps[0].def, capKos = finCaps[0].keyObjectives.map(m => m.id);
    await io.healOwnProjects(client);
    const after = await io.readState(client);
    eq(after.group.capabilities, [], "no capability is left");
    const own = after.functions.finance.projects || [];
    eq(own.map(p => p.id).sort(), idsBefore, "every project is on the function, with its ID unchanged");
    eq(own.filter(p => p.id === firstId)[0], JSON.parse(figBefore),
       "and every figure under it is still against the row it was entered on");
    eq((after.functions.marketing.projects || []).map(p => p.id), mktIds,
       "two boxes on ONE function both land, in order — the second does not " +
       "throw the first away");
    eq(after.functions.finance.def, capDef,
       "the definition came across, the function having none");
    eq((after.functions.finance.keyObjectives || []).map(m => m.id), capKos,
       "and so did the key objectives");
    eq((after.archives || []).map(a => a.name).sort(),
       before.group.capabilities.map(c => c.name).sort(),
       "every box is archived, so their names are still readable");
    eq(after.functions.merchandising.items, before.functions.merchandising.items,
       "a function that plans in pillars is untouched");
    ok(!(after.functions.merchandising.projects || []).length,
       "and gains no projects of its own");

    /* ── 3 · both ends, and it runs once ────────────────────────────────── */
    console.log("\n3 · both ends");
    const again = await io.healOwnProjects(client);
    ok(again === 0, "run twice it does nothing at all (" + again + ")");
    const s3 = base();
    s3.functions.finance.def = "The function already said what it is.";
    s3.functions.finance.keyObjectives = [{ id: "own-KO1", name: "Mine" }];
    const moved = R.dissolvePlan(s3.group.capabilities[0], s3.functions.finance);
    eq(moved.def, null, "a function that already has a definition keeps its own");
    eq(moved.keyObjectives, null, "and keeps its own key objectives");
    eq(moved.projects.map(p => p.id), s3.group.capabilities[0].projects.map(p => p.id),
       "the projects still travel — they are the one thing that always does");
  } finally {
    client.release(); await pool.end();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
