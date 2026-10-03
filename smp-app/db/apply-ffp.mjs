/* PROCESSES' OWN TABLES (FFProcess, carried in whole, 2026-10-01).

   FFProcess arrived with 32 tables and 43 Prisma migrations of its own. They
   live in their OWN Postgres schema, `ffprocess`, beside SMP's shared one,
   because seven of their names (`users`, `sessions`, `people`, …) are names
   SMP already uses — one schema per product is what lets both keep their
   names. The migrations are applied here exactly as Prisma wrote them, in
   name order, each recorded once in `ffprocess._migrations`, in ONE
   transaction under a transaction-scoped lock (§289's shape, db/apply.mjs's
   own), with `SET LOCAL search_path` so every unqualified CREATE lands in
   `ffprocess` and nowhere else.

   The running app connects as `smp_app` (lib/db.ts), so it is granted the
   schema and everything in it, now and later. Isolation between clients is
   the app's own check — every read and write asks requireWorkspaceAccess,
   whose answer is SMP's door (ffp/lib/auth/workspace.ts) — and a workspace's
   id IS the client's address, so one client's rows are never another's. Row
   security for this schema is recorded as not done. */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const DIR = join(here, "..", "ffp", "prisma", "migrations");
const LOCK_NS = 420043;
export const FFP_SCHEMA = "ffprocess";

export async function applyFfp(url, opts = {}) {
  const log = opts.log || ((s) => console.log(s));
  const client = new pg.Client({ connectionString: url, options: "-c search_path=" + FFP_SCHEMA });
  await client.connect();
  const applied = [];
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1, 1)", [LOCK_NS]);
    await client.query("CREATE SCHEMA IF NOT EXISTS " + FFP_SCHEMA);
    await client.query("SET LOCAL search_path TO " + FFP_SCHEMA);
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const done = new Set((await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name));
    const names = readdirSync(DIR).filter((n) => existsSync(join(DIR, n, "migration.sql"))).sort();
    for (const n of names) {
      if (done.has(n)) continue;
      await client.query(readFileSync(join(DIR, n, "migration.sql"), "utf8"));
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [n]);
      applied.push(n);
      log("applied ffprocess/" + n);
    }
    /* smp_app is made by db/roles.sql, which applyAll runs first. */
    const role = (await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'smp_app'")).rowCount;
    if (role) {
      await client.query("GRANT USAGE ON SCHEMA " + FFP_SCHEMA + " TO smp_app");
      await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA " + FFP_SCHEMA + " TO smp_app");
      await client.query("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA " + FFP_SCHEMA + " TO smp_app");
      await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA " + FFP_SCHEMA + " GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smp_app");
      await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA " + FFP_SCHEMA + " GRANT USAGE, SELECT ON SEQUENCES TO smp_app");
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
  return applied;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf("--url");
  const url = i > 0 ? process.argv[i + 1] : process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  applyFfp(url).then((a) => console.log("ffprocess: " + (a.length ? a.length + " applied" : "up to date")))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
