/* The boundary, against a real database.
   Run: DATABASE_URL=postgres://…  node scripts/test-platform.js

   Every assertion here is about something that fails SILENTLY if it is wrong:
   a second client that is never migrated, a pooled connection still pointed at
   the last request's client, a new client seeded with somebody else's units.
   None of them throws; all of them render. */

const pg = require("pg");
const path = require("path");
const { spawn } = require("child_process");
const io = require("../lib/state-io.js");
const P = require("../lib/platform-io.js");
const auth = require("../lib/auth.js");

const PORT = 3991;
const BASE = "http://127.0.0.1:" + PORT;

function waitFor(url, tries) {
  return new Promise(function (resolve, reject) {
    (function go(n) {
      fetch(url).then(function () { resolve(); })
        .catch(function () {
          if (n <= 0) return reject(new Error("dev-server never came up"));
          setTimeout(function () { go(n - 1); }, 300);
        });
    })(tries);
  });
}

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

  /* ── 8 · over HTTP, which is the only place the refusal is real ──
     Everything above proves the plumbing; this proves what a browser gets.
     The endpoints resolve the client themselves, and a refusal that is only
     ever asserted in-process is a refusal nobody has seen. */
  await P.createClientSchema(pg, "t_http", "HTTP Client");
  await P.withPlatform(pg, async function (pc) {
    await pc.query("INSERT INTO clients (key, name, schema_name) VALUES ('t-http','HTTP Client','t_http') " +
                   "ON CONFLICT (key) DO NOTHING");
  });
  /* Somebody to sign in as. SINCE US2 THE ACCOUNT IS THE PLATFORM'S, keyed by
     email, and the row inside the client says who that account is there — the
     two halves this file exists to keep apart. (Written first against the
     client's own `credentials` table, which is what the door used to read: the
     check went red the day the door moved, which is the right way round.) */
  await P.withSchema(pg, "t_http", async function (c) {
    await c.query("INSERT INTO people (key, idx, name) VALUES ('smo', 1, 'Test SMO') " +
                  "ON CONFLICT (key) DO NOTHING");
    await c.query("UPDATE org SET org_name = 'HTTP Client' WHERE id = 1");
  });
  await P.withPlatform(pg, async function (c) {
    await c.query(
      "INSERT INTO accounts (email, name, kind, password_hash, must_change) " +
      "VALUES ('desk@t-http.example','Test SMO','client',$1,false) " +
      "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_change = false",
      [auth.hashPassword("testpw123")]);
    await c.query(
      "INSERT INTO account_clients (email, client_key, person_key) " +
      "VALUES ('desk@t-http.example','t-http','smo') ON CONFLICT (email, client_key) DO NOTHING");
  });

  const dev = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), String(PORT)], {
    env: Object.assign({}, process.env, { SMP_DEFAULT_CLIENT: "t-http" }), stdio: "ignore" });
  try {
    await waitFor(BASE + "/api/state", 25);
    const post = (body) => fetch(BASE + "/api/auth", { method:"POST",
      headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });

    const login = await post({ action:"login", user:"desk@t-http.example", password:"testpw123", client:"t-http" });
    const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
    check("a person signs in by email, against the platform's accounts", (await login.json()).ok === true);

    const get = (q) => fetch(BASE + "/api/state" + q, { headers: cookie ? { cookie: cookie } : {} });

    const mine = await (await get("?client=t-http")).json();
    eq("…and reads that client's own state", mine.state && mine.state.group.org, "HTTP Client");

    /* THE TWO REFUSALS MUST BE INDISTINGUISHABLE. Told apart, trying slugs
       tells an outsider which clients Forefront has. */
    const unknown = await get("?client=nobody-here");
    const asSchema = await get("?client=t_http");     /* a schema name, not a slug */
    const uBody = await unknown.json(), sBody = await asSchema.json();
    eq("an unknown client is refused", unknown.status, 404);
    eq("a SCHEMA name is refused too — the address bar cannot name a schema", asSchema.status, 404);
    eq("…and the two refusals are word for word the same", uBody.error, sBody.error);
    /* AND BOTH ARE THE PLATFORM'S ONE REFUSAL. Asserting only that they match
       each other passes when an endpoint invents its own message and both
       paths happen to use it — §113.8's blind spot, found by breaking this
       very assertion and watching it stay green. Asked against the shared
       constant, so a hand-written refusal anywhere fails here. */
    eq("…and both are the platform's single refusal", uBody.error, P.noSuchClient().message);
    /* TWO FILES DECLARE THAT SENTENCE — platform-io for a slug that is not in
       the registry, auth for a session that may not open the client — and a
       refusal that differs by a word tells the two cases apart. */
    eq("…and the door's copy of it says exactly the same thing",
       auth.notThisClient().message, P.noSuchClient().message);
    check("…which mentions neither a schema nor what was tried",
      !/schema/i.test(uBody.error || "") && !/nobody-here|t_http/.test(uBody.error || ""), uBody.error);

    /* A browser holding the PREVIOUS platform file (§91: a service worker
       serves the shell from its own disk) posts no client at all. It must
       land on the named default rather than be refused, or deploy day takes
       the live client down. */
    const noSlug = await (await get("")).json();
    eq("a request naming no client lands on the default", noSlug.state && noSlug.state.group.org, "HTTP Client");
  } finally {
    dev.kill();
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  await pool.end();
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) {
  console.error("\nTHREW: " + (e && (e.stack || e.message)));
  process.exit(1);
});
