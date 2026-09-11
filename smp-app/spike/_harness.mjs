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
import { SCHEMA } from "../db/schema-name.mjs";

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
  const admin = new pg.Client({ connectionString: OWNER_URL, options: "-c search_path=" + SCHEMA });
  await admin.connect();
  await admin.query('CREATE DATABASE "' + name + '"');
  await admin.end();
  const ownerUrl = withDb(OWNER_URL, name);
  const appUrl = asApp(ownerUrl);
  if (!opts.bare) await applyAll(ownerUrl, { appPassword: APP_PASSWORD, log: () => {} });
  /* THE SHARED SCHEMA IS NOT `public` (§317.4), so the harness's own pools
     open where lib/db.ts's do — a pool without the option lands in `public`
     and every proof reports "relation tenants does not exist", which is the
     harness testing something the product does not do (§100.3). */
  const OPTS = "-c search_path=" + SCHEMA;
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 4, options: OPTS });
  const app = new pg.Pool({ connectionString: appUrl, max: 4, options: OPTS });
  /* Point lib/db.ts at this database for anything that imports it. */
  const { usePools } = await import("../lib/db.ts");
  usePools(owner, app);
  async function drop() {
    const wait = (p) => Promise.race([p, new Promise((r) => setTimeout(r, 3000))]);
    await wait(owner.end()); await wait(app.end());
    const a = new pg.Client({ connectionString: OWNER_URL, options: "-c search_path=" + SCHEMA });
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
      /* Every connection this model opens lives in the shared schema, exactly
         as lib/db.ts's pools do (§317.4) — a fresh backend per statement is
         the whole point of the model, so each one has to be told. */
      const c = new pg.Client({ connectionString: url, options: "-c search_path=" + SCHEMA });
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
    "WHERE n.nspname = current_schema() AND c.relkind = 'r' AND NOT (c.relname = ANY($1)) ORDER BY 1", [PLATFORM_TABLES]);
  return r.rows.map((x) => x.t);
}

/* Two tenants, and ONE ROW IN EVERY TENANT TABLE for each (§113.8: a proof
   over an empty table is vacuous). Walked from the catalogue in FK order, the
   NOT NULL columns filled with typed placeholders and every FK column taken
   from the parent row already inserted — so a table added later is seeded
   the day it is added, and a table this cannot seed fails loudly. */
export async function seedTwoTenants(owner) {
  const r = await owner.query(
    "INSERT INTO tenants (key, name) VALUES ('a-co', 'Tenant A'), ('b-co', 'Tenant B') RETURNING id, key");
  const A = r.rows.find((x) => x.key === "a-co").id, B = r.rows.find((x) => x.key === "b-co").id;
  const order = await seedRows(owner, A); await seedRows(owner, B);
  return { A, B, order };
}

const PLACEHOLDER = { s: "'k'", w: "'w'" };
function placeholder(col, table) {
  if (table === "swot_items" && col.name === "cat") return "'s'";
  if (table === "access_grants" && col.name === "grant_") return "'view'";
  const t = col.type;
  if (t === "text" || t.startsWith("character")) return "'k'";
  if (t === "integer" || t === "bigint" || t === "numeric" || t === "smallint") return "1";
  if (t === "boolean") return "true";
  if (t === "jsonb" || t === "json") return "'{}'";
  if (t.startsWith("timestamp")) return "now()";
  if (t === "uuid") return "gen_random_uuid()";
  throw new Error("seed: no placeholder for " + table + "." + col.name + " " + t);
}

export async function seedRows(owner, tenantId) {
  const tables = await tenantTables(owner);
  const cols = {}, fks = {};
  for (const t of tables) {
    cols[t] = (await owner.query(
      "SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull, " +
      "(a.atthasdef OR a.attidentity <> '') AS hasdef FROM pg_attribute a WHERE a.attrelid = $1::regclass " +
      "AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum", [t])).rows;
    fks[t] = (await owner.query(
      "SELECT f.conname, f.confrelid::regclass::text AS ref, " +
      " (SELECT array_agg(attname::text ORDER BY k.ord) FROM unnest(f.conkey) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a ON a.attrelid = f.conrelid AND a.attnum = k.attnum) AS cols, " +
      " (SELECT array_agg(attname::text ORDER BY k.ord) FROM unnest(f.confkey) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a ON a.attrelid = f.confrelid AND a.attnum = k.attnum) AS refcols " +
      "FROM pg_constraint f WHERE f.conrelid = $1::regclass AND f.contype = 'f' AND f.confrelid <> 'tenants'::regclass ORDER BY f.conname", [t])).rows;
  }
  /* FK order: a table after every table it references. */
  const order = []; const seen = new Set();
  function visit(t, stack) {
    if (seen.has(t)) return; if (stack.has(t)) throw new Error("seed: FK cycle at " + t);
    stack.add(t); for (const f of fks[t]) if (tables.includes(f.ref) && f.ref !== t) visit(f.ref, stack);
    stack.delete(t); seen.add(t); order.push(t);
  }
  for (const t of tables) visit(t, new Set());
  const first = {};
  for (const t of order) {
    const row = { tenant_id: "'" + tenantId + "'" };
    /* FK columns from the parent row: every NOT NULL FK, and — where none is
       NOT NULL — the first nullable one only (pillars_one_owner wants exactly
       one of two). */
    const notNullFk = fks[t].filter((f) => f.cols.every((c) => cols[t].find((x) => x.name === c).notnull));
    const use = notNullFk.length ? notNullFk : fks[t].slice(0, 1);
    for (const f of use) {
      if (!first[f.ref]) throw new Error("seed: " + t + " references " + f.ref + " which has no row yet");
      f.cols.forEach((c, i) => { if (c !== "tenant_id") row[c] = first[f.ref][f.refcols[i]]; });
    }
    for (const c of cols[t]) {
      if (row[c.name] !== undefined) continue;
      if (c.notnull && !c.hasdef) row[c.name] = placeholder(c, t);
    }
    const names = Object.keys(row);
    const ins = await owner.query("INSERT INTO " + t + " (" + names.join(", ") + ") VALUES (" + names.map((n) => row[n]).join(", ") + ") RETURNING *");
    const got = ins.rows[0]; const lit = {};
    for (const k of Object.keys(got)) lit[k] = got[k] === null ? "NULL" : typeof got[k] === "number" ? String(got[k]) : "'" + String(got[k]).replace(/'/g, "''") + "'";
    first[t] = lit;
  }
  for (const t of tables) {
    const n = (await owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [tenantId])).rows[0].n;
    if (!n) throw new Error("seed: " + t + " is empty for " + tenantId);
  }
  return order;
}
