/* Two pools, two roles (spec 043 §4.3).

   ownerPool()  — the key from the environment: migrations (db/apply.mjs) and
                  the platform's own tables when a request has no tenant yet.
   appPool()    — `smp_app`, the non-owner runtime role every tenant request
                  runs as, because Postgres bypasses row-level security for a
                  table's OWNER and `FORCE ROW LEVEL SECURITY` only bites a
                  role that is not.

   THE DIRECT CONNECTION IS ASKED FOR FIRST (§313.34, §289): a tenant is chosen
   per request with `SET LOCAL` inside a transaction, which a transaction
   pooler keeps for the life of that transaction and not one statement
   longer — so the unpooled names win over the pooled ones. The pooled names
   stay as the fallback (a project holding only those must still start) and
   one line names which was used, never its value. */
import pg from "pg";
import { schemaIdent } from "../db/schema-name.mjs";
import { createRequire } from "node:module";
/* numeric comes back as a Number, not a string — the frozen product's own
   type tuning, applied once per process (lib/state-io.js tuneTypes). */
createRequire(import.meta.url)("./graph-io.cjs").tuneTypes(pg);

const DIRECT = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
const POOLED = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "NEON_DATABASE_URL"];

let said = false;
function ownerUrl(): string {
  for (const name of [...DIRECT, ...POOLED]) {
    const v = process.env[name];
    if (v) {
      if (!said) {
        said = true;
        console.log("[db] connecting through " + name +
          (DIRECT.includes(name) ? "" : " — POOLED; set DATABASE_URL_UNPOOLED (§313.34)"));
      }
      return v;
    }
  }
  throw new Error("No database connection configured (DATABASE_URL_UNPOOLED).");
}

/* smp_app's URL: SMP_APP_URL when set, otherwise the owner's URL with the user
   and password swapped — the same host, the same DIRECT endpoint. */
function appUrl(): string {
  if (process.env.SMP_APP_URL) return process.env.SMP_APP_URL;
  const u = new URL(ownerUrl());
  u.username = "smp_app";
  u.password = process.env.SMP_APP_PASSWORD || "smp_app";
  return u.toString();
}

const g = globalThis as unknown as { __smpOwner?: pg.Pool; __smpApp?: pg.Pool };

/* EVERY CONNECTION OPENS IN THE SHARED SCHEMA AND NOWHERE ELSE (§317.4).
   `public` on the real database is a CLIENT — Raya Trade, left where it stood
   when the clients were split — so an unqualified name must never be able to
   fall through to it: `public` is left OUT of the path, not put after ours,
   because a fallback there resolves a missing table silently to live data.

   AS A CONNECTION OPTION, NEVER `ALTER ROLE`. The owner role here is the
   database's owner, which the FROZEN site still connects as and which relies
   on `public` being in its path — setting a default on the role would take
   the live site down in a way nothing on this side would show. A per-pool
   option touches only the connections this app opens. */
const OPTS = "-c search_path=" + schemaIdent();

export function ownerPool(): pg.Pool {
  return (g.__smpOwner ??= new pg.Pool({ connectionString: ownerUrl(), max: 4, options: OPTS }));
}
export function appPool(): pg.Pool {
  return (g.__smpApp ??= new pg.Pool({ connectionString: appUrl(), max: 10, options: OPTS }));
}
/* The spike points both pools at a throwaway database per run. */
export function usePools(owner: pg.Pool, app: pg.Pool): void {
  g.__smpOwner = owner; g.__smpApp = app;
}
export async function endPools(): Promise<void> {
  await Promise.all([g.__smpOwner?.end(), g.__smpApp?.end()]);
  g.__smpOwner = undefined; g.__smpApp = undefined;
}
