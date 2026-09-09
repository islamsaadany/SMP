/* Applies the schema and the migrations AS THE OWNER, once, at deploy — never
   on a request path (research §P6: §98 measured what a per-request bootstrap
   costs, §289 what it does under a burst).

   One transaction under a transaction-scoped advisory lock (§289's shape):
   two deploys starting in the same second cannot both apply one file, and a
   file that fails rolls the whole run back and records nothing, so the next
   run applies it again rather than skipping past a half-applied migration.

     DATABASE_URL_UNPOOLED=postgres://owner@… SMP_APP_PASSWORD=… node db/apply.mjs
     node db/apply.mjs --url postgres://…        (the spike harness passes it)

   Order: roles.sql (idempotent, every run) → schema.sql (once, recorded as
   "schema") → migrations/*.sql not yet in _migrations, by name. Prints one
   line per file applied; exits non-zero on the first failure. */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const LOCK_NS = 420043;   /* the platform's advisory-lock namespace (contracts/tenant-request.md) */

export async function applyAll(url, opts = {}) {
  const log = opts.log || ((s) => console.log(s));
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const applied = [];
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1, 0)", [LOCK_NS]);
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    /* The role's password rides a transaction-local setting so roles.sql never
       carries it; SET LOCAL dies with the COMMIT (§289). */
    const pw = opts.appPassword || process.env.SMP_APP_PASSWORD || "smp_app";
    await client.query("SELECT set_config('smp.app_password', $1, true)", [pw]);
    await client.query(readFileSync(join(here, "roles.sql"), "utf8"));

    const done = new Set((await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name));
    if (!done.has("schema")) {
      await client.query(readFileSync(join(here, "schema.sql"), "utf8"));
      await client.query("INSERT INTO _migrations (name) VALUES ('schema')");
      applied.push("schema.sql");
      log("applied schema.sql");
    }
    const dir = join(here, "migrations");
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sql")).sort() : [];
    for (const f of files) {
      if (done.has(f)) continue;
      await client.query(readFileSync(join(dir, f), "utf8"));
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [f]);
      applied.push(f);
      log("applied " + f);
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--url");
  const url = i > 0 ? process.argv[i + 1]
    : process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
      || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) { console.error("apply: no owner connection string (DATABASE_URL_UNPOOLED)"); process.exit(2); }
  applyAll(url).then((a) => { console.log(a.length ? "applied " + a.length : "nothing to apply"); },
                     (e) => { console.error("apply FAILED: " + (e.code || "") + " " + e.message); process.exit(1); });
}
