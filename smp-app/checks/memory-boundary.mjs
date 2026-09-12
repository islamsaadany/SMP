/* THE ASSERTION THE CONSULTING MEMORY RESTS ON (spec 045).
 *
 * Specs 042 and 043 spent two weeks making sure one client's data can never
 * reach another. This feature is deliberately the opposite — an insight from
 * Raya Trade is worth having BECAUSE it helps on RHI — so the one thing that
 * must be true is the one thing everything else here is built to prevent:
 * a row written about one client is readable while another is being looked at.
 *
 * AND THE WAY IT WOULD BREAK IS SILENT. schema.sql ends in one loop that gives
 * every table row-level security and the `tenant_rows` policy BY EXCLUSION, so
 * a memory table carrying the obvious column name `tenant_id` would be handed
 * a policy reading "this row belongs to the tenant being looked at" and the
 * page would simply go empty — no error, nothing in a log. Worse, the two
 * apply paths would DISAGREE (§113.7's mirror): schema.sql runs once and is
 * recorded, so an existing database would be fine and every fresh one dead.
 *
 * So this asserts four things, and the CONTROL beside each of them (§113.8):
 * no policy HERE while a tenant table has one; the column named
 * `about_tenant_id` and no `tenant_id` column at all, which is what makes a
 * forgotten exclusion fail the apply loudly instead of quietly; the table on
 * the list in schema.sql; and the read itself, through the RUNTIME role, which
 * is the only one of the four that fails if any of the others is got wrong.
 *
 * Needs no server and no build — the database and the served bytes are the
 * subject. Prints one line per property (§215) and ends RED/GREEN.
 *
 *   DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/memory-boundary.mjs
 *   … --break=policy    (RED: the loop reached this table after all)
 *   … --break=in-shell  (RED: a client's own platform carries the memory)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
/* THE SAME DEFAULT THE PRODUCT TAKES, never a second one: `lib/db.ts`,
   `db/apply.mjs` and `scripts/dev-tenant.mjs` all fall back to the literal
   word, so a check inventing its own reads as the boundary being broken
   when what is broken is the check (§100.3, §53.5). */
const APP_PW = process.env.SMP_APP_PASSWORD || "smp_app";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
const here = import.meta.dirname;
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

const owner = new pg.Pool({ connectionString: URL_, max: 3, options: "-c search_path=" + SCHEMA });
const u = new URL(URL_);
const app = new pg.Pool({
  host: u.hostname, port: Number(u.port || 5432), database: u.pathname.slice(1),
  user: "smp_app", password: APP_PW, max: 3, options: "-c search_path=" + SCHEMA,
});

if (brk === "policy") {
  /* THE FAULT, MADE: what the loop would have done had the column been called
     tenant_id and the exclusion list been forgotten. Dropped again at the end,
     so the check leaves the database as it found it (§94.2). */
  await owner.query("ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY");
  await owner.query("ALTER TABLE memory_entries FORCE ROW LEVEL SECURITY");
  await owner.query(
    "CREATE POLICY tenant_rows ON memory_entries FOR ALL " +
    "USING (about_tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) " +
    "WITH CHECK (about_tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)");
}

await section("1 · the table is the platform's, not a tenant's", async () => {
  const pol = (await owner.query(
    "SELECT count(*)::int n FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid " +
    "JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relname = 'memory_entries'", [SCHEMA])).rows[0].n;
  check(pol === 0, "memory_entries carries NO row policy", "policies: " + pol);
  const r = (await owner.query(
    "SELECT relrowsecurity, relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = $1 AND c.relname = 'memory_entries'", [SCHEMA])).rows[0];
  check(r && !r.relrowsecurity && !r.relforcerowsecurity, "…and row-level security is not switched on for it", JSON.stringify(r));
  /* THE CONTROL: a build with no RLS anywhere would satisfy both of those
     perfectly, so a tenant table is measured in the same breath (§113.8). */
  const t = (await owner.query(
    "SELECT relrowsecurity AND relforcerowsecurity AS on FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = $1 AND c.relname = 'tactics'", [SCHEMA])).rows[0];
  check(t && t.on === true, "CONTROL — a tenant table (tactics) has RLS forced, so the two above mean something", JSON.stringify(t));
});

await section("2 · the column is named so that forgetting the list is LOUD", async () => {
  const cols = (await owner.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'memory_entries'", [SCHEMA]))
    .rows.map((r) => r.column_name);
  check(cols.includes("about_tenant_id"), "the client is `about_tenant_id`", cols.join(","));
  check(!cols.includes("tenant_id"),
    "…and there is NO `tenant_id` column, so the loop's own CREATE INDEX would fail the apply rather than attach a policy", cols.join(","));
  const schema = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");
  const loop = schema.slice(schema.indexOf("c.relname NOT IN ("));
  check(/'memory_entries'/.test(loop.slice(0, 400)), "…and the table is named in schema.sql's exclusion list", loop.slice(0, 200));

  /* AND THE OTHER COPY OF THAT LIST AGREES (§327). Which tables are the
     platform's own is written TWICE — in the SQL loop above, which cannot
     import anything, and in `lib/schema-check.ts`, which runs in the app — and
     they cannot share a constant. So the guard is that they name the same set.
     `memory_entries` was added to the SQL and not to the TypeScript, and the
     two then disagreed about what a tenant owns: the schema check reported a
     CORRECT schema as broken, and `deleteTenant` would have asked a platform
     table for a `tenant_id` it does not have. Asserted as the SET, never as a
     count — two lists of ten can differ by two names (§94.8). */
  const sqlList = (loop.slice(0, loop.indexOf(")")).match(/'([a-z_]+)'/g) || [])
    .map((x) => x.slice(1, -1)).sort();
  const { PLATFORM_TABLES } = await import("../lib/schema-check.ts");
  const tsList = [...PLATFORM_TABLES].sort();
  const only = (a, b) => a.filter((x) => !b.includes(x));
  check(sqlList.length > 5, "schema.sql's exclusion list was parsed at all", sqlList.length + " names");
  check(only(sqlList, tsList).length === 0 && only(tsList, sqlList).length === 0,
    "…and PLATFORM_TABLES names exactly the same tables — the two copies agree",
    "only in the SQL: [" + only(sqlList, tsList) + "]  only in the TypeScript: [" + only(tsList, sqlList) + "]");
});

await section("3 · a client's own platform carries none of it", async () => {
  /* The client's shell is assembled by scripts/build-shell.mjs from the frozen
     sources; the memory lives only on Forefront's page. Asserted on the SERVED
     bytes rather than on the sources, because what a client's browser receives
     is the whole of the claim. */
  const shell = readFileSync(join(here, "..", "public", "shell.js"), "utf8")
    + readFileSync(join(here, "..", "shell", "body.html"), "utf8")
    + (brk === "in-shell" ? '\n/* fetch("/api/memory") */\n' : "");
  check(!/\/api\/memory/.test(shell), "the client platform never calls /api/memory", (shell.match(/.{0,40}\/api\/memory.{0,40}/) || [""])[0]);
  check(!/memory_entries/.test(shell), "…and never names its table", "found memory_entries");
  /* THE CONTROL: Forefront's own page DOES carry it, or a build that simply
     never shipped the feature would pass both of those (§94.2). */
  const ff = readFileSync(join(here, "..", "shell", "platform.html"), "utf8")
    + readFileSync(join(here, "..", "public", "platform-page.js"), "utf8");
  check(/\/api\/memory/.test(ff), "CONTROL — Forefront's own platform does call it", "not found");
});

await section("4 · the read that IS the feature", async () => {
  const t = (await owner.query("SELECT id, key FROM tenants ORDER BY created_at LIMIT 1")).rows[0];
  if (!t) { fail("no tenant to write about — run scripts/dev-tenant.mjs first"); return; }
  /* A SECOND CLIENT, because the whole assertion is about crossing between
     two, and a check with one tenant cannot tell a working boundary from a
     missing one (§113.8). Made here and removed at the end. */
  await owner.query("DELETE FROM tenants WHERE key = 'mem-other'");
  const other = (await owner.query("INSERT INTO tenants (key, name, industry) VALUES ('mem-other','Other Client','Healthcare') RETURNING id")).rows[0];
  const author = (await owner.query("SELECT id FROM users WHERE kind = 'office' ORDER BY email LIMIT 1")).rows[0];
  if (!author) { fail("no office account to write as — run scripts/dev-tenant.mjs first"); return; }

  const id = (await owner.query(
    "INSERT INTO memory_entries (about_tenant_id, author_id, kind, title, happened) VALUES ($1,$2,'hiccup',$3,$4) RETURNING id",
    [t.id, author.id, "Written about the first client", "the body"])).rows[0].id;

  /* Read as the RUNTIME role (smp_app, NOBYPASSRLS) with the OTHER client set
     as the request's tenant — which is what a consultant looking at RHI is. */
  const c = await app.connect();
  let seen = -1, seenNoTenant = -1;
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [other.id]);
    seen = (await c.query("SELECT count(*)::int n FROM memory_entries WHERE id = $1", [id])).rows[0].n;
    await c.query("COMMIT");
    /* and with no tenant set at all, which is every request to /api/memory */
    seenNoTenant = (await c.query("SELECT count(*)::int n FROM memory_entries WHERE id = $1", [id])).rows[0].n;
  } finally { c.release(); }
  check(seen === 1, "an insight about one client is READ while another client is the request's tenant", "rows seen: " + seen);
  check(seenNoTenant === 1, "…and with no tenant set at all, which is every request this endpoint makes", "rows seen: " + seenNoTenant);

  /* THE CONTROL, and it is the same connection and the same role: a TENANT
     table must still refuse. Otherwise "it can be read" proves only that RLS
     is off everywhere. */
  const c2 = await app.connect();
  let leak = -1;
  try {
    await c2.query("BEGIN");
    await c2.query("SELECT set_config('app.tenant_id', $1, true)", [other.id]);
    leak = (await c2.query("SELECT count(*)::int n FROM tactics")).rows[0].n;
    await c2.query("COMMIT");
  } finally { c2.release(); }
  check(leak === 0, "CONTROL — the same role reading a TENANT table under the other client sees none of its rows", "rows seen: " + leak);

  await owner.query("DELETE FROM memory_entries WHERE id = $1", [id]);
  await owner.query("DELETE FROM tenants WHERE key = 'mem-other'");
});

if (brk === "policy") await owner.query("DROP POLICY IF EXISTS tenant_rows ON memory_entries").catch(() => {});
if (brk === "policy") await owner.query("ALTER TABLE memory_entries NO FORCE ROW LEVEL SECURITY, DISABLE ROW LEVEL SECURITY").catch(() => {});
await owner.end(); await app.end();
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
