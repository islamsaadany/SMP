/* A CLIENT'S CONNECTION WEARS THAT CLIENT'S BADGE (§303.35, spec 030).

   The boundary between two clients was our own code being right: a slug
   looked up in the registry, a schema set on a checked-out connection, and a
   reset when it went back. This proves the DATABASE now refuses when the code
   is not — every connection serving a client request wears a role that may
   see that client's schema and nothing else.

   BOTH ENDS, EVERY TIME (§94.2): what the badge allows is asserted beside
   what it refuses, or a build that refused everything would pass every
   refusal here. And the OWNER is asserted still able to reach both rooms,
   because that is the stated limit — the badge fences a mistake in our code,
   not a leaked key — and a check that did not say so would be claiming more
   than the feature does.

   Run three times, as three different database roles, to model the host:
     · a superuser                      — the local rehearsal's default
     · CREATEROLE, not superuser        — Neon's `neondb_owner` (the real one)
     · neither                          — SMP_EXPECT_BADGE=0: served WITHOUT a
                                          badge, said once, nothing refused
   Run: DATABASE_URL=postgres://…  [SMP_EXPECT_BADGE=0]  node scripts/test-client-badge.js */

const pg = require("pg");
const P = require("../lib/platform-io.js");
const io = require("../lib/state-io.js");

const EXPECT = process.env.SMP_EXPECT_BADGE !== "0";
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name + (extra ? "\n        " + extra : ""));
}
/* A refusal is a 42501 and nothing else: a missing table (42P01) would also
   "fail", and would pass a check that only asked whether the query threw. */
async function refused(client, sql, args) {
  try { await client.query(sql, args || []); return "allowed"; }
  catch (e) { return e.code === "42501" ? "refused" : "threw " + e.code + " " + e.message; }
}
async function allowed(client, sql, args) {
  try { await client.query(sql, args || []); return "allowed"; }
  catch (e) { return "threw " + e.code + " " + e.message; }
}

const A = "t_badge_a", B = "t_badge_b";

async function cleanup(pool) {
  const c = await pool.connect();
  try {
    for (const s of [A, B]) {
      await c.query("DROP SCHEMA IF EXISTS " + s + " CASCADE");
      const role = P.badgeRoleFor(s);
      const there = await c.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [role]);
      if (there.rowCount) {
        await c.query("DROP OWNED BY " + role);
        await c.query("DROP ROLE " + role);
      }
    }
    await c.query("DELETE FROM platform.clients WHERE key IN ($1,$2,$3)", ["badge-a", "badge-b", "badge-x"]).catch(function () {});
  } finally { c.release(); }
  P.forgetBadged(); io.forgetReady();
}

/* A section that throws reports and the run goes on (§215): a check that dies
   at section 4 says nothing about sections 5 to 7, and the build that makes
   it die is exactly the one that needs the rest read. */
async function section(name, fn) {
  try { await fn(); } catch (e) { fail++; console.log("  FAIL  " + name + " died: " + (e.code ? e.code + " " : "") + e.message); }
}

async function main() {
  const pool = P.getPool(pg);
  const me = (await pool.query("SELECT current_user AS u, (SELECT rolsuper OR rolcreaterole FROM pg_roles WHERE rolname = current_user) AS can")).rows[0];
  console.log("running as " + me.u + " (" + (me.can ? "may create roles" : "may NOT create roles") + "), expecting " + (EXPECT ? "a badge" : "NO badge"));
  check("the role under test matches what the run expects", !!me.can === EXPECT,
        "SMP_EXPECT_BADGE says " + EXPECT + " and the role " + (me.can ? "can" : "cannot") + " create roles");

  await P.withPlatform(pg, function (c) { return P.ensurePlatformReady(c); });
  await cleanup(pool);

  /* ── 1 · two rooms, made the way the Clients page makes them ─────── */
  await P.createClientSchema(pg, A, "Badge A");
  await P.createClientSchema(pg, B, "Badge B");
  await P.withPlatform(pg, async function (c) {
    for (const [key, s, name] of [["badge-a", A, "Badge A"], ["badge-b", B, "Badge B"]]) {
      await c.query("INSERT INTO clients (key, name, schema_name, kind, status, made_here) " +
                    "VALUES ($1,$2,$3,'client','active',true) ON CONFLICT (key) DO UPDATE SET schema_name = EXCLUDED.schema_name",
                    [key, name, s]);
    }
  });
  await P.withOwner(pg, A, function (c) {
    return c.query("INSERT INTO units (key, idx, name) VALUES ('mobile', 1, 'Mobile')");
  });
  await P.withOwner(pg, B, function (c) {
    return c.query("INSERT INTO units (key, idx, name) VALUES ('shops', 1, 'Shops')");
  });

  const roleA = P.badgeRoleFor(A), roleB = P.badgeRoleFor(B);
  const roles = (await pool.query("SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname IN ($1,$2)", [roleA, roleB])).rows;
  if (EXPECT) {
    check("a badge exists for each room, made with the room", roles.length === 2, JSON.stringify(roles));
    check("…and neither can log in on its own", roles.every(function (r) { return !r.rolcanlogin; }));
  } else {
    check("no badge is made where the key cannot make one", roles.length === 0, JSON.stringify(roles));
  }

  await section("2 · wearing the badge", async function () {
  /* ── 2 · wearing A's badge, through the platform's own door ──────── */
  await P.withSchema(pg, A, async function (c) {
    const who = (await c.query("SELECT current_user AS u")).rows[0].u;
    if (EXPECT) check("inside withSchema the connection IS the badge", who === roleA, who);
    else        check("without a badge the connection stays the owner", who === me.u, who);
    check("its own room answers",            await allowed(c, "SELECT count(*) FROM units") === "allowed");
    check("its own room takes a write",      await allowed(c, "UPDATE units SET name = 'Mobile' WHERE key = 'mobile'") === "allowed");
    check("its own sequences answer (a message id)", await allowed(c, "SELECT nextval(pg_get_serial_sequence('messages','id'))") === "allowed");
    const cross = await refused(c, "SELECT count(*) FROM " + B + ".units");
    /* MOVING THE PATH IS REFUSED DIFFERENTLY, AND THAT IS NOT LOOSENING: a
       role with no USAGE on a schema does not get "permission denied" when
       the path points there — Postgres leaves that schema OUT of name
       resolution, so an unqualified `units` is "does not exist" (42P01).
       Either code means the room could not be reached; "allowed" is the only
       answer that fails. The first run of this check asked for 42501 alone
       and reported a correct build broken. */
    const viaPath = await (async function () {
      await c.query("SET search_path TO " + B);
      const r = await refused(c, "SELECT count(*) FROM units");
      await c.query("SET search_path TO " + A);
      return r === "refused" || /^threw 42P01/.test(r) ? "refused" : r;
    })();
    const make = await refused(c, "CREATE TABLE badge_probe (x int)");
    /* The two write probes run inside a transaction that is rolled back,
       because on the no-badge run they are ALLOWED — that is the degrade path
       stated honestly — and the first run of this check let them land,
       deleting the very client section 3 then asked for. */
    const inTx = async function (sql) {
      await c.query("BEGIN");
      try { return await refused(c, sql); } finally { await c.query("ROLLBACK"); }
    };
    const platW = await inTx("INSERT INTO platform.clients (key, name, schema_name, kind, status) VALUES ('badge-x','x','t_badge_x','client','active')");
    const platD = await inTx("DELETE FROM platform.clients WHERE key = 'badge-a'");
    if (EXPECT) {
      check("the other room is REFUSED by name",                     cross === "refused", cross);
      check("…and by moving the path (the old boundary alone cannot cross)", viaPath === "refused", viaPath);
      check("the badge cannot make a table",                         make === "refused", make);
      check("the badge cannot add a client",                         platW === "refused", platW);
      check("the badge cannot remove a client",                      platD === "refused", platD);
    } else {
      check("(no badge) the other room is reachable, as it always was", cross === "allowed", cross);
      check("(no badge) the registry is writable, as it always was",     platW === "allowed", platW);
    }
    /* THE STATED LIMIT, asserted so nobody later reads this check as
       claiming it: the shared tables sign-in lives in are readable. */
    check("the shared account book is readable — sign-in lives there (stated limit)",
          await allowed(c, "SELECT count(*) FROM platform.accounts") === "allowed");
    check("…and the registry is readable, so the door can list clients",
          await allowed(c, "SELECT count(*) FROM platform.clients") === "allowed");
  });
  });

  await section("3 · the request path", async function () {
  /* ── 3 · the request path itself: connectFor / releaseClient ────── */
  const conn = await P.connectFor(pg, "badge-a");
  try {
    check("connectFor says whether the badge went on", conn._smpBadged === EXPECT, String(conn._smpBadged));
    const who = (await conn.query("SELECT current_user AS u")).rows[0].u;
    check("a client request runs as " + (EXPECT ? "the badge" : "the owner"), who === (EXPECT ? roleA : me.u), who);
    const cross = await refused(conn, "SELECT count(*) FROM " + B + ".units");
    check("…and " + (EXPECT ? "cannot" : "can") + " see the other client", cross === (EXPECT ? "refused" : "allowed"), cross);
    check("…while ensureReady is satisfied before the badge (memo hit, no throw)",
          (await io.ensureReady(conn, A)).seeded === false);
  } finally { await P.releaseClient(conn); }
  });

  await section("4 · the badge comes off", async function () {
  /* ── 4 · the badge comes off at release ─────────────────────────── */
  const raw = await pool.connect();
  try {
    const r = (await raw.query("SELECT current_user AS u, current_setting('search_path') AS p")).rows[0];
    check("a released connection is the owner again", r.u === me.u, r.u);
    check("…and no longer pointed at that client", !/t_badge/.test(r.p), r.p);
  } finally { raw.release(); }
  });

  await section("5 · the owner still reaches both", async function () {
  /* ── 5 · the owner still reaches both rooms (the stated limit) ──── */
  const both = await P.withOwner(pg, A, async function (c) {
    return (await c.query("SELECT (SELECT count(*) FROM " + A + ".units) + (SELECT count(*) FROM " + B + ".units) AS n")).rows[0].n;
  });
  check("the owner reaches both rooms — the badge fences a mistake, not a leaked key", Number(both) === 2, both);
  });

  await section("6 · a later table", async function () {
  /* ── 6 · a table added AFTER the badge is still the badge's ──────── */
  await P.withOwner(pg, A, function (c) { return c.query("CREATE TABLE later_table (x int); INSERT INTO later_table VALUES (1)"); });
  await P.withSchema(pg, A, async function (c) {
    check("a table a later migration adds is readable by the badge (default privileges)",
          await allowed(c, "SELECT count(*) FROM later_table") === "allowed");
  });
  });

  await section("7 · two cold starts", async function () {
  /* ── 7 · two cold starts making one badge ───────────────────────── */
  P.forgetBadged();
  const twice = await Promise.all([
    P.withSchema(pg, B, function (c) { return c.query("SELECT current_user AS u"); }),
    P.withSchema(pg, B, function (c) { return c.query("SELECT current_user AS u"); })
  ]).then(function (rs) { return rs.map(function (r) { return r.rows[0].u; }); }, function (e) { return "threw " + e.message; });
  check("two first requests at once both get the badge (locked, §289)",
        Array.isArray(twice) && twice.every(function (u) { return u === (EXPECT ? roleB : me.u); }), JSON.stringify(twice));

  });

  await cleanup(pool);
  console.log((fail ? "FAIL  " : "ok    ") + pass + " passed, " + fail + " failed");
  await pool.end();
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) {
  console.log("  FAIL  the check itself died: " + (e.stack || e.message));
  process.exit(1);
});
