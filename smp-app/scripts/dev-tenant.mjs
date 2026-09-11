/* A tenant to open the door on, locally (spec 043's first screen group).

   Applies the schema into the sandbox database named by DATABASE_URL_UNPOOLED
   (default: the sandbox cluster), makes ONE client — raya-trade, holding the
   worked example's graph from db/seed-state.json through the app's own
   loadGraph() — and the logins the door needs to be driven: the SMO (an
   office admin), Mobile's head, Finance's head, and one person on a
   temporary password. Development and the checks only; never a deployment.

     node scripts/dev-tenant.mjs            (re-runnable: drops and remakes the tenant)

   The one password is DEV_PASSWORD, printed nowhere; every email is minted
   from the register key as <key>@raya.example. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { applyAll } from "../db/apply.mjs";
import { SCHEMA } from "../db/schema-name.mjs";
import { hashPassword } from "../lib/auth.ts";
import { withTenant } from "../lib/tenant.ts";
import { loadGraph } from "../lib/state-io.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const OWNER_URL = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
  || "postgres://postgres:postgres@localhost:5432/postgres";
export const DEV_PASSWORD = "Raya-2026!";
export const TEMP_PASSWORD = "Temp-2026!";

export async function devTenant({ url = OWNER_URL, log = (s) => console.log(s) } = {}) {
  await applyAll(url, { appPassword: process.env.SMP_APP_PASSWORD || "smp_app", log: () => {} });
  /* The shared schema (§317.4) — a client without it opens in `public`,
     which on the real database is somebody's live data. */
  const owner = new pg.Client({ connectionString: url, options: "-c search_path=" + SCHEMA });
  await owner.connect();
  /* everything a run of the checks may have made: the tenant, its logins, a
     client created through Forefront's pages, and the office's own table */
  await owner.query("DELETE FROM tenants WHERE key = 'raya-trade' OR made_here");
  await owner.query("DELETE FROM users WHERE email LIKE '%@raya.example' OR email LIKE '%@forefront.example'");
  await owner.query("DELETE FROM platform_access");
  const t = (await owner.query("INSERT INTO tenants (key, name, made_here) VALUES ('raya-trade', 'Raya Trade', true) RETURNING id")).rows[0];
  const graph = JSON.parse(readFileSync(join(here, "..", "..", "db", "seed-state.json"), "utf8"));
  await withTenant(t.id, (c) => loadGraph(c, graph));
  const people = graph.people;
  const mk = async (key, kind, isAdmin, mustChange, seat) => {
    const p = people.find((x) => x.key === key);
    const email = key === "smo" ? "office@forefront.example" : key + "@raya.example";
    const u = (await owner.query(
      "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [email, p ? p.name : key, kind, isAdmin, mustChange, hashPassword(mustChange ? TEMP_PASSWORD : DEV_PASSWORD)])).rows[0];
    await owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [t.id, u.id, key, seat]);
    return email;
  };
  const made = [
    await mk("smo", "office", true, false, "super"),
    await mk("mobhead", "client", false, false, "none"),
    await mk("fn_fin", "client", false, false, "none"),
    await mk("own_mob", "client", false, true, "none"),
  ];
  await owner.end();
  log("raya-trade ready — logins: " + made.join(", "));
  return { tenantId: t.id, emails: made };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  devTenant().catch((e) => { console.error(e.message); process.exit(1); });
}
