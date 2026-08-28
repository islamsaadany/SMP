/* The boundary, against a real database.
   Run: DATABASE_URL=postgres://…  node scripts/test-platform.js

   Every assertion here is about something that fails SILENTLY if it is wrong:
   a second client that is never migrated, a pooled connection still pointed at
   the last request's client, a new client seeded with somebody else's units.
   None of them throws; all of them render. */

const pg = require("pg");
const io = require("../lib/state-io.js");
const P = require("../lib/platform-io.js");

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name + (extra ? "\n        " + extra : ""));
}
const eq = (name, got, want) =>
  check(name + "  (got " + JSON.stringify(got) + ", wanted " + JSON.stringify(want) + ")", got === want);

async function main() {
  const pool = P.getPool(pg);

  /* ── 1 · the platform schema ──────────────────────────────────── */
  await P.withPlatform(pg, async function (c) {
    const r = await P.ensurePlatformReady(c);
    check("the platform schema is created", r.created === true);
    const t = await c.query("SELECT to_regclass('platform.clients') AS t");
    check("…with its registry", !!t.rows[0].t);
  });
  await P.withPlatform(pg, async function (c) {
    const again = await P.ensurePlatformReady(c);
    check("…and asking twice does the work once (§98's memo)", again.created === false);
  });

  /* ── 2 · two clients, and the trap ────────────────────────────── */
  /* THE ASSERTION THIS FILE EXISTS FOR. With ensureReady memoised per PROCESS
     rather than per schema, the second client opened in a warm instance
     answers from the first one's "already ready" and gets no tables at all. */
  await P.createClientSchema(pg, "t_alpha", "Alpha Group");
  await P.createClientSchema(pg, "t_beta", "Beta Holdings");

  /* Caught rather than allowed to throw, so a broken memo REPORTS the trap by
     name instead of ending the run with a stack: a test that dies says only
     that something went wrong, and this one knows exactly what. */
  const safely = async (what, fn, fallback) => {
    try { return await fn(); } catch (e) { console.log("  (" + what + " threw: " + e.message + ")"); return fallback; }
  };
  for (const s of ["t_alpha", "t_beta"]) {
    const there = await safely(s, () => P.withSchema(pg, s, async function (c) {
      return (await c.query("SELECT to_regclass($1) AS t", [s + ".org"])).rows[0].t;
    }), null);
    check("client " + s + " has its own tables — the per-schema readiness memo", !!there);
  }

  const names = {};
  for (const s of ["t_alpha", "t_beta"]) {
    names[s] = await safely(s, () => P.withSchema(pg, s, async function (c) {
      return (await c.query("SELECT org_name FROM org WHERE id = 1")).rows[0].org_name;
    }), null);
  }
  eq("alpha holds its own name", names.t_alpha, "Alpha Group");
  eq("beta holds its own name", names.t_beta, "Beta Holdings");

  /* ── 3 · a new client is EMPTY, not somebody else's example ───── */
  const counts = await safely("t_beta counts", () => P.withSchema(pg, "t_beta", async function (c) {
    const q = async (t) => Number((await c.query("SELECT count(*)::int AS n FROM " + t)).rows[0].n);
    return { units: await q("units"), people: await q("people"), pillars: await q("pillars"),
             creds: await q("credentials"), companies: await q("companies") };
  }), { units:-1, people:-1, pillars:-1, creds:-1, companies:-1 });
  eq("a new client has no business units", counts.units, 0);
  eq("…no people", counts.people, 0);
  eq("…no plan", counts.pillars, 0);
  eq("…no companies", counts.companies, 0);
  /* No bootstrap seat: a client is opened from a card by an account that
     already exists, so a known password on its door buys nothing (spec §4). */
  eq("…and no bootstrap password", counts.creds, 0);

  /* ── 3b · a new client is the same SHAPE as a long-lived one ────
     A client created today runs the same schema.sql and the same migrations a
     tenant from v2.0 ran — so their shapes must match exactly. §113.7 is what
     this guards: a migration reading a column schema.sql no longer creates is
     perfect on every existing database and broken on every fresh one, and
     only a comparison catches it. */
  const shapeOf = (schema) => P.withSchema(pg, schema, async function (c) {
    const r = await c.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns " +
      "WHERE table_schema = $1 ORDER BY table_name, column_name", [schema]);
    return r.rows.map(function (x) { return x.table_name + "." + x.column_name + ":" + x.data_type; });
  });
  /* t_migrated runs the real path — seed then migrations, as a deployment
     that has existed since v2.0 did. */
  await P.withPlatform(pg, function (c) { return c.query("CREATE SCHEMA IF NOT EXISTS t_migrated"); });
  await P.withSchema(pg, "t_migrated", function (c) { return io.ensureReady(c, "t_migrated"); });
  const baselined = await shapeOf("t_beta");
  const migrated = await shapeOf("t_migrated");
  const only = (a, b) => a.filter(function (x) { return b.indexOf(x) < 0; });
  check("a baselined client has the same columns as a migrated one",
    only(migrated, baselined).length === 0 && only(baselined, migrated).length === 0,
    "missing from a new client: " + (only(migrated, baselined).join(", ") || "none") +
    "\n        only in a new client: " + (only(baselined, migrated).join(", ") || "none"));

  /* ── 4 · one client cannot see another ────────────────────────── */
  await P.withSchema(pg, "t_alpha", async function (c) {
    await c.query("INSERT INTO units (key, idx, name) VALUES ('mobile', 1, 'Mobile')");
  });
  const seenFromBeta = await P.withSchema(pg, "t_beta", async function (c) {
    return (await c.query("SELECT count(*)::int AS n FROM units")).rows[0].n;
  });
  eq("a row written in one client is invisible in the other", Number(seenFromBeta), 0);

  /* ── 5 · the connection does not carry the last client home ───── */
  /* A pg pool keeps session state across checkouts. A connection released
     while still pointed at a client would serve the NEXT request — possibly
     another client's — from the wrong schema, and it would look like data
     loss rather than like a bug. */
  await P.withSchema(pg, "t_alpha", async function (c) {
    const p = (await c.query("SHOW search_path")).rows[0].search_path;
    check("inside withSchema the path is the client's", /t_alpha/.test(p), p);
  });
  const raw = await pool.connect();
  try {
    const p = (await raw.query("SHOW search_path")).rows[0].search_path;
    check("a released connection is no longer pointed at that client", !/t_alpha/.test(p), p);
  } finally { raw.release(); }

  /* ── 6 · a schema name is never taken from a request ──────────── */
  let refused = false;
  try { P.ident('public"; DROP SCHEMA platform CASCADE; --'); } catch (e) { refused = e.code === "BAD_SCHEMA"; }
  check("a schema name that is not an identifier is refused", refused);
  eq("a slug becomes its schema name", P.schemaNameFor("raya-trade"), "raya_trade");
  eq("…and a client's name becomes its slug", P.slugFor("El Abd"), "el-abd");

  /* ── 7 · the registry answers, and never invents ──────────────── */
  await P.withPlatform(pg, async function (c) {
    await c.query(
      "INSERT INTO clients (key, name, schema_name, industry) VALUES ($1,$2,$3,$4) " +
      "ON CONFLICT (key) DO NOTHING", ["t-alpha", "Alpha Group", "t_alpha", "Industrial"]);
    const got = await P.clientByKey(c, "t-alpha");
    eq("a client is read by its slug", got.schema_name, "t_alpha");
    const missing = await P.clientByKey(c, "nobody");
    eq("an unknown client is an empty answer, not a built one", Object.keys(missing).length, 0);
    check("…and it is frozen (constitution XII)", Object.isFrozen(missing));
  });

  console.log("\n" + pass + " passed, " + fail + " failed");
  await pool.end();
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) {
  console.error("\nTHREW: " + (e && (e.stack || e.message)));
  process.exit(1);
});
