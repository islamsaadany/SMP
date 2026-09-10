/* THE SHARED SCHEMA HAS A ROOM OF ITS OWN, AND `public` IS A CLIENT (§317.4).

   The rebuild was built and proved against databases whose `public` was
   empty — a sandbox, a throwaway, a fresh Neon branch. The real one is not
   like that: when spec 042 gave each client a schema, the client that
   already existed STAYED WHERE IT STOOD, so `public` holds Raya Trade's 47
   live tables and `platform.clients` says so in a column. §113.7's shape
   exactly, from the other side — perfect on every database anybody was
   testing against, broken on the only one that matters.

   What the first real build did was stop one table in:
   `relation "sessions" already exists`. What it was ABOUT to do is the
   reason this check exists — schema.sql's row-level-security loop reads the
   catalogue and then ALTERs whatever it finds, and pointed at `public` it
   would have enumerated a client's live tables and attached policies to
   them. It failed politely by luck, not by design.

   SO THIS BUILDS THE REAL DATABASE'S SHAPE and asserts the apply never
   reaches it: a frozen client in `public`, the registry pointing at it, then
   the whole deploy — schema, migrations, roles — and `public` compared
   before and after, table for table, policy for policy, privilege for
   privilege.

     DATABASE_URL_UNPOOLED=postgres://…/postgres node checks/schema-room.mjs
     … --break=public     # the shared schema put back in public; must go red  */
import pg from "pg";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const REPO = join(APP, "..");
const BREAK = (process.argv.find((a) => a.startsWith("--break=")) || "").split("=")[1] || "";
if (BREAK === "public") process.env.SMP_SCHEMA = "public";

const { SCHEMA } = await import("../db/schema-name.mjs");
const { applyAll } = await import("../db/apply.mjs");

const ADMIN = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!ADMIN) { console.error("schema-room: no DATABASE_URL_UNPOOLED"); process.exit(2); }

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail !== undefined ? "  — " + detail : "")); }
};

const NAME = "smp_room_" + Date.now().toString(36);
const admin = new pg.Client({ connectionString: ADMIN });
await admin.connect();
await admin.query('CREATE DATABASE "' + NAME + '"');
await admin.end();
const url = (() => { const u = new URL(ADMIN); u.pathname = "/" + NAME; return u.toString(); })();

const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  /* ── the database production actually has ──────────────────────────── */
  await c.query(readFileSync(join(REPO, "db", "schema.sql"), "utf8"));
  const fm = join(REPO, "db", "migrations");
  for (const f of (existsSync(fm) ? readdirSync(fm).filter((x) => x.endsWith(".sql")).sort() : [])) {
    try { await c.query(readFileSync(join(fm, f), "utf8")); } catch { /* the frozen set is not this check's subject */ }
  }
  await c.query("CREATE SCHEMA platform");
  await c.query("SET search_path TO platform");
  await c.query(readFileSync(join(REPO, "db", "platform-schema.sql"), "utf8"));
  await c.query("SET search_path TO public");
  await c.query("INSERT INTO platform.clients (key,name,schema_name,industry,kind) VALUES ('raya-trade','Raya Trade','public','Trade','client')");

  const shape = async () => ({
    tables: (await c.query("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY 1")).rows.map((r) => r.relname).join(","),
    rls: (await c.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (c.relrowsecurity OR c.relforcerowsecurity)")).rows[0].n,
    policies: (await c.query("SELECT count(*)::int n FROM pg_policies WHERE schemaname='public'")).rows[0].n,
  });
  const before = await shape();
  check("the rehearsal is production's shape — a client sitting in public",
    before.tables.split(",").length > 30 && before.rls === 0, before.tables.split(",").length + " tables");

  /* ── the deploy ────────────────────────────────────────────────────── */
  console.log("\n1 · the name");
  check("the shared schema is not `public`", SCHEMA !== "public", SCHEMA);

  console.log("\n2 · the apply");
  let applyErr = null;
  try { await applyAll(url, { appPassword: "roomcheckpw", log: () => {} }); } catch (e) { applyErr = e; }
  check("the schema and its migrations apply", applyErr === null, applyErr && applyErr.code + " " + applyErr.message);

  console.log("\n3 · and the client is exactly as it was");
  const after = await shape();
  check("public's tables are the same tables", after.tables === before.tables,
    after.tables.split(",").length + " vs " + before.tables.split(",").length);
  check("…with no row-level security switched on in it", after.rls === 0, after.rls);
  check("…and no policy attached to any of them", after.policies === 0, after.policies);
  /* THE RUNTIME ROLE IS THE OTHER HALF: the tables being untouched is worth
     little if the role serving every request can read them. */
  const reach = (await c.query(
    "SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace " +
    "WHERE n.nspname='public' AND c.relkind='r' AND has_table_privilege('smp_app', c.oid, 'SELECT')")).rows[0].n;
  check("…and smp_app can read none of them", reach === 0, reach + " readable");

  console.log("\n4 · while the shared schema is properly its own");
  /* BOTH ENDS (§94.2): an apply that created nothing at all would satisfy
     every assertion above perfectly. */
  const mine = await c.query(
    "SELECT count(*)::int n, count(*) FILTER (WHERE c.relforcerowsecurity)::int forced " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relkind='r'", [SCHEMA]);
  check("the shared schema holds the platform's tables", mine.rows[0].n > 30, mine.rows[0].n);
  check("…with row-level security FORCED on the tenant ones", mine.rows[0].forced >= 40, mine.rows[0].forced + " forced");
  /* ── 5 · and nothing opens a connection without saying where ───────
     Four files had their own `new pg.Client`/`new pg.Pool` and every one of
     them opened in `public` until it was told otherwise — the harness's
     pools, its pooler model, s1's direct run and the dev fixture. Each
     failed differently and none of them failed obviously ("relation tenants
     does not exist" reads like a missing migration). Grepped, because a
     connection that forgets is the one shape this whole section is about
     and the next one will be written by somebody who was not here. */
  console.log("\n5 · every connection says which schema it opens in");
  const { readdirSync: rd, readFileSync: rf } = await import("node:fs");
  const scan = [];
  for (const dir of ["lib", "scripts", "spike", "checks", "db"]) {
    let names = [];
    try { names = rd(join(APP, dir)); } catch { continue; }
    for (const f of names) {
      if (!/\.(ts|mjs|cjs)$/.test(f)) continue;
      const text = rf(join(APP, dir, f), "utf8");
      for (const m of text.matchAll(/new pg\.(?:Client|Pool)\(\{([^}]*)\}/g)) {
        /* db/apply.mjs sets the path with SET LOCAL inside its own
           transaction — it CREATES the schema, so it cannot open in one. */
        if (dir === "db" && f === "apply.mjs") continue;
        /* Either way of saying it counts: the connection option, or an
           explicit `SET search_path` in the same file — migrate-raya and
           this check both open somewhere on purpose and say so in SQL. */
        if (!/options/.test(m[1]) && !/SET search_path/.test(text)) scan.push(dir + "/" + f);
      }
    }
  }
  check("no connection is opened without a search_path", scan.length === 0, [...new Set(scan)].join(", "));

  /* ── 6 · and nothing names the schema in the text of a query ────────
     §5 looks at CONNECTIONS, and that is not the whole of it: `demo-seed.mjs`
     had been given the search_path option by that same sweep and the very
     next line still asked the catalogue `WHERE n.nspname = 'public'`. An
     option cannot reach inside a string. So it enumerated a CLIENT'S schema,
     found no tenant-owned table, and scanned an empty list — passing its
     privacy assertion over nothing, which only §113.8's control beside it
     caught (§317.11).

     THE ONE EXEMPTION IS THIS FILE, and it is named rather than pattern-matched:
     `public` is exactly what this check is about, so it must say the word. */
  console.log("\n6 · and no query names the schema in its own text");
  const named = [];
  for (const dir of ["lib", "scripts", "spike", "checks", "db"]) {
    let names = [];
    try { names = rd(join(APP, dir)); } catch { continue; }
    for (const f of names) {
      if (!/\.(ts|mjs|cjs)$/.test(f)) continue;
      if (dir === "checks" && f === "schema-room.mjs") continue;   /* its subject IS public */
      const text = rf(join(APP, dir, f), "utf8");
      if (/(?:nspname|table_schema|schemaname|schema_name)\s*=\s*'public'/.test(text)) named.push(dir + "/" + f);
    }
  }
  check("no file asks the catalogue for `public` by name", named.length === 0, named.join(", "));
} finally {
  await c.end();
  const a2 = new pg.Client({ connectionString: ADMIN });
  await a2.connect();
  await a2.query('DROP DATABASE IF EXISTS "' + NAME + '" WITH (FORCE)').catch(() => {});
  await a2.end();
}

console.log("\n%d ok, %d failed", ok, bad.length);
if (bad.length) { console.log("FAILED: " + bad.join("; ")); process.exit(1); }
