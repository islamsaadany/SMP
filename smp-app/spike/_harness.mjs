/* The spike's harness (spec 043 §5, contracts/spike.md).

   Every proof: a fresh throwaway database as the owner, db/apply.mjs run into
   it (roles, schema, migrations), two tenants seeded with one row in every
   tenant table, then the script's own assertions — printed one line each,
   `ok` or `FAIL`, never a throw mid-run (§215: a red run that prints nothing
   is the harness dying, not a failure). `--break=<name>` builds the thing
   under test wrongly in the way named; that red run is recorded before the
   green one is believed (constitution XVI).

     DATABASE_URL_UNPOOLED=postgres://postgres:postgres@localhost:5432/postgres */
import pg from "pg";
import { applyAll } from "../db/apply.mjs";

export const OWNER_URL = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
  || "postgres://postgres:postgres@localhost:5432/postgres";
export const APP_PASSWORD = process.env.SMP_APP_PASSWORD || "smp_app";

let fails = 0, oks = 0;
export function ok(label) { oks++; console.log("ok    " + label); }
export function fail(label, measured) {
  fails++; console.log("FAIL  " + label + (measured === undefined ? "" : " — " + String(measured)));
}
export function check(cond, label, measured) { cond ? ok(label) : fail(label, measured); }
export function finish() {
  console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
  process.exit(fails ? 1 : 0);
}
/* --break=<name> ; --break=no-policy:tactics → brk("no-policy") === "tactics" */
export function brk(name) {
  const arg = process.argv.find((a) => a.startsWith("--break="));
  if (!arg) return null;
  const v = arg.slice(8);
  if (v === name) return true;
  if (v.startsWith(name + ":")) return v.slice(name.length + 1);
  return null;
}
export function arg(name) {
  const a = process.argv.find((x) => x.startsWith("--" + name + "="));
  return a ? a.slice(name.length + 3) : null;
}

function withDb(url, db) { const u = new URL(url); u.pathname = "/" + db; return u.toString(); }
function asApp(url) { const u = new URL(url); u.username = "smp_app"; u.password = APP_PASSWORD; return u.toString(); }

/* A throwaway database per run. */
export async function makeDb(opts = {}) {
  const name = "smp_spike_" + process.pid + "_" + Date.now().toString(36);
  const admin = new pg.Client({ connectionString: OWNER_URL });
  await admin.connect();
  await admin.query('CREATE DATABASE "' + name + '"');
  await admin.end();
  const ownerUrl = withDb(OWNER_URL, name);
  const appUrl = asApp(ownerUrl);
  if (!opts.bare) await applyAll(ownerUrl, { appPassword: APP_PASSWORD, log: () => {} });
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 4 });
  const app = new pg.Pool({ connectionString: appUrl, max: 4 });
  /* Point lib/db.ts at this database for anything that imports it. */
  const { usePools } = await import("../lib/db.ts");
  usePools(owner, app);
  async function drop() {
    const wait = (p) => Promise.race([p, new Promise((r) => setTimeout(r, 3000))]);
    await wait(owner.end()); await wait(app.end());
    const a = new pg.Client({ connectionString: OWNER_URL });
    await a.connect();
    await a.query('DROP DATABASE IF EXISTS "' + name + '" WITH (FORCE)');
    await a.end();
  }
  return { name, ownerUrl, appUrl, owner, app, drop };
}

/* The pooler model — test-cold-starts.js's idea, one step more faithful: a
   transaction pooler hands every autocommit statement to WHATEVER backend is
   free, so session state set by one statement is not there for the next.
   Modelled as a fresh connection per statement outside a transaction (BEGIN …
   COMMIT holds one client, because a transaction pins one backend there too).
   RESET ALL is not enough — a custom setting reset that way reads '' not
   NULL, which is a different fault from the one being modelled. */
export function poolerModel(url) {
  let held = null;
  return {
    async query(sql, params) {
      const word = typeof sql === "string" ? (sql.trim().split(/\s+/)[0] || "").toUpperCase() : "";
      if (held) {
        const r = await held.query(sql, params);
        if (word === "COMMIT" || word === "ROLLBACK") { await held.end(); held = null; }
        return r;
      }
      const c = new pg.Client({ connectionString: url });
      await c.connect();
      if (word === "BEGIN") { held = c; return c.query(sql, params); }
      try { return await c.query(sql, params); } finally { await c.end(); }
    },
    async release() { if (held) { await held.end(); held = null; } },
  };
}

/* Every tenant-owned table, from the catalogue and never a literal. */
export const PLATFORM_TABLES = ["tenants", "users", "tenant_users", "sessions", "login_attempts",
  "platform_access", "tenant_log", "push_keys", "_migrations"];
export async function tenantTables(client) {
  const r = await client.query(
    "SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT (c.relname = ANY($1)) ORDER BY 1", [PLATFORM_TABLES]);
  return r.rows.map((x) => x.t);
}

/* Two tenants. seedRows() fills every tenant table for each once the tables
   exist (schema phase, T028); until then the registry rows alone. */
export async function seedTwoTenants(owner) {
  const r = await owner.query(
    "INSERT INTO tenants (key, name) VALUES ('a-co', 'Tenant A'), ('b-co', 'Tenant B') RETURNING id, key");
  const A = r.rows.find((x) => x.key === "a-co").id, B = r.rows.find((x) => x.key === "b-co").id;
  return { A, B };
}
