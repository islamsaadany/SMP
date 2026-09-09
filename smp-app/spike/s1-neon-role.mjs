/* S1 — the role and FORCE (spec 043 §4.3, §5; contracts/spike.md).

   The one thing the whole spec rests on: smp_app can be made, owns nothing,
   and FORCE ROW LEVEL SECURITY holds against it while the owner bypasses —
   which is exactly why the app must never connect as the owner.

     node spike/s1-neon-role.mjs                      (throwaway database)
     node spike/s1-neon-role.mjs --break=no-force     (expected RED: the owner sees every row)
     node spike/s1-neon-role.mjs --break=bypass       (expected RED: the role bypasses)
     DATABASE_URL_UNPOOLED='…' node spike/s1-neon-role.mjs --neon   (Islam's shell — quickstart §4)

   --neon makes no throwaway: it works in the connected database, creates
   smp_app only if absent, uses one scratch table, and prints the key's
   rolcreaterole / rolsuper first. If the first line is `rolcreaterole f`
   it stops (exit 2) — research §P5 names the two ways forward. Nothing here
   prints the URL. */
import pg from "pg";
import { readFileSync } from "node:fs";
import { OWNER_URL, APP_PASSWORD, makeDb, ok, fail, check, finish, brk } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";

const NEON = process.argv.includes("--neon");
const noForce = brk("no-force"), bypass = brk("bypass");
const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";

let db, owner, app;
if (NEON) {
  owner = new pg.Pool({ connectionString: OWNER_URL, max: 2 });
} else {
  db = await makeDb({ bare: true });
  owner = db.owner;
}

/* 0 · what kind of key is this */
const me = (await owner.query("SELECT rolname, rolcreaterole, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user")).rows[0];
console.log("key   rolcreaterole " + (me.rolcreaterole ? "t" : "f") + " · rolsuper " + (me.rolsuper ? "t" : "f") + " · rolbypassrls " + (me.rolbypassrls ? "t" : "f"));
if (!me.rolcreaterole && !me.rolsuper) {
  const exists = (await owner.query("SELECT 1 FROM pg_roles WHERE rolname = 'smp_app'")).rowCount;
  if (!exists) {
    console.log("STOP  this key cannot create roles (rolcreaterole f) and smp_app does not exist — research §P5 names the two ways forward; neither is taken without a decision.");
    await owner.end(); if (db) await db.drop();
    process.exit(2);
  }
}

/* 1 · the role, from db/roles.sql — or made wrongly for the break */
try {
  const c = await owner.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('smp.app_password', $1, true)", [APP_PASSWORD]);
    if (bypass) {
      await c.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='smp_app') THEN " +
        "EXECUTE format('CREATE ROLE smp_app LOGIN BYPASSRLS PASSWORD %L', current_setting('smp.app_password', true)); " +
        "ELSE EXECUTE 'ALTER ROLE smp_app BYPASSRLS'; END IF; END $$; GRANT USAGE ON SCHEMA public TO smp_app; " +
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smp_app;");
    } else {
      await c.query(readFileSync(new URL("../db/roles.sql", import.meta.url), "utf8"));
    }
    await c.query("COMMIT");
  } catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
  const role = (await owner.query("SELECT rolcanlogin, rolbypassrls, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = 'smp_app'")).rows[0];
  check(role && role.rolcanlogin && !role.rolbypassrls, "smp_app exists: LOGIN, NOBYPASSRLS", JSON.stringify(role));
} catch (e) {
  fail("smp_app can be created by this key", (e.code || "") + " " + e.message);
}

/* 2 · the scratch table with the policy (FORCE unless the break says not) */
const T = "_spike_rls";
await owner.query("DROP TABLE IF EXISTS " + T);
await owner.query("CREATE TABLE " + T + " (tenant_id uuid NOT NULL, v text NOT NULL)");
await owner.query("ALTER TABLE " + T + " ENABLE ROW LEVEL SECURITY");
if (!noForce) await owner.query("ALTER TABLE " + T + " FORCE ROW LEVEL SECURITY");
await owner.query("CREATE POLICY tenant_rows ON " + T + " FOR ALL " +
  "USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) " +
  "WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)");
await owner.query("GRANT SELECT, INSERT, UPDATE, DELETE ON " + T + " TO smp_app");
await owner.query("INSERT INTO " + T + " VALUES ($1, 'a'), ($2, 'b')", [A, B]);

const owned = (await owner.query("SELECT count(*)::int AS n FROM pg_tables WHERE tableowner = 'smp_app'")).rows[0].n;
check(owned === 0, "smp_app owns no table", owned + " owned");

/* 3–4 · as smp_app: nothing with no setting, A's row inside withTenant(A) */
const appUrl = (() => { const u = new URL(NEON ? OWNER_URL : db.ownerUrl); u.username = "smp_app"; u.password = APP_PASSWORD; return u.toString(); })();
app = new pg.Pool({ connectionString: appUrl, max: 2 });
const { usePools } = await import("../lib/db.ts");
usePools(owner, app);
try {
  /* The break `no-force` reads as the OWNER here — that is what a build that
     connected as the owner would do, and FORCE off is what lets it see all. */
  const reader = noForce ? owner : app;
  const n0 = (await reader.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n;
  check(n0 === 0, "with no tenant set the app role reads 0 rows", n0 + " rows visible with nothing set");
  const n1 = await withTenant(A, async (c) => (await c.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n);
  check(n1 === 1, "inside withTenant(A) the app role reads A's one row", n1);
  const leaked = await withTenant(A, async (c) => {
    try { await c.query("INSERT INTO " + T + " VALUES ($1, 'x')", [B]); return "accepted"; }
    catch (e) { return e.code; }
  });
  check(leaked === "42501", "inside withTenant(A) an INSERT under B is refused (42501)", leaked);
} catch (e) {
  fail("the app role can read the scratch table", (e.code || "") + " " + e.message);
}
/* 5 · the owner bypasses — the reason the app must not be the owner */
const nOwner = (await owner.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n;
check(nOwner === 2, "the OWNER with no setting reads every row (bypass — why the app is not the owner)", nOwner);

await owner.query("DROP TABLE IF EXISTS " + T);
await app.end();
if (db) await db.drop(); else await owner.end();
finish();
