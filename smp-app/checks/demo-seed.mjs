/* THE DEMO TENANT, AND THE ONE THING IT MUST NOT BE (spec 043 Phase I).

   §313.8's demo is seeded from the worked example with the company, the units,
   the people and every mention of them renamed. The frozen script refuses on
   any real name that survived — and it walks the GRAPH, which is what the
   reader hands it. On this stack the graph is thirty-odd tables, and a reader
   surfaces what it knows about: a string sitting in a column no reader reaches
   is invisible to that refusal and perfectly visible to anyone with the
   database. So this scans the COLUMNS — every tenant-owned table, under the
   demo tenant, where row-level security is what narrows it — and it scans
   RAYA'S the same way as the control, because a scan that finds nothing
   proves nothing until it has been shown finding something (§113.8).

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/demo-seed.mjs
     … --break=raw-names   (RED: the demo is seeded from the UNRENAMED example)
     … --break=keep-marks  (RED: the units keep the real client's lockups)

   Re-runnable: it seeds the demo tenant each time, with --replace. */
import { createRequire } from "node:module";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { withTenant } from "../lib/tenant.ts";
import { seedDemo } from "../scripts/seed-demo.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8) || null;
const require = createRequire(import.meta.url);
const D = require("../../scripts/seed-demo-client.js");
let oks = 0, fails = 0;
const say = (m) => (typeof m === "string" ? m : (() => { try { return JSON.stringify(m); } catch { return String(m); } })());
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + say(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
try {
  const real = D.realNames(JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "db", "seed-state.json"), "utf8")));

  console.log("── the tenant");
  const r = await seedDemo({ url: URL_, replace: true, brk, log: () => {} });
  const row = (await owner.query("SELECT id, key, name, kind FROM tenants WHERE key = $1", [D.CLIENT_KEY])).rows[0];
  check(row && row.kind === "demo", "the demo is a tenant, and the registry says which kind", row);
  check(row && row.name === "Meridian Group", "wearing the invented name, not the client's", row && row.name);

  /* EVERY TENANT-OWNED TABLE, asked of the catalogue rather than listed here —
     a list in a check is a list somebody forgets to add to (§104.7).
     AND ASKED OF `SCHEMA`, NEVER `public` (§326): the catalogue is asked by
     NAME, which is the one kind of query a `search_path` cannot help — so
     §317.4 correctly moved this pool's path at line 37 and left this query
     naming the room the tables had just left. It then found nought tables and
     scanned nothing, and a scan of nothing finds no forbidden name. */
  const tables = (await owner.query(
    "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' " +
    "WHERE n.nspname = $1 AND c.relkind = 'r' ORDER BY c.relname", [SCHEMA])).rows.map((x) => x.relname);
  check(tables.length > 25, "and there are tenant-owned tables to scan at all", tables.length);

  /* THE MATCHING RULE IS THE FROZEN SCRIPT'S, ASKED AND NOT REWRITTEN
     (§53.5). The first version of this scan tested `includes` on a row's JSON
     and called a CORRECT demo broken five times over: the forbidden list holds
     the bare token `Nour` from a real *Nour Selim*, and the demo has an
     invented **Noura Ghanem** — a substring, not a name. The frozen refusal
     splits on non-letters and matches WHOLE WORDS, which is why it passed
     while this failed, and asking it per ROW gets its picture rule too (a
     `data:` URI anywhere is refused outright, because a mark cannot be
     renamed). What is different here is only WHERE it looks: at the columns,
     including any a graph reader does not surface. */
  const scan = async (tid) => {
    const hits = [];
    await withTenant(tid, async (c) => {
      for (const t of tables) {
        const rows = (await c.query('SELECT * FROM "' + t + '"')).rows;
        for (const row2 of rows) {
          try { D.refuseIfAnySurvives(row2, real); }
          catch (e) { hits.push(t + " · " + (String(e.message).split("\n")[1] || String(e.message)).trim().slice(0, 120)); }
        }
      }
    });
    return hits;
  };

  console.log("── the one thing a demo must not be");
  const demoHits = await scan(row.id);
  check(demoHits.length === 0, "no real name survives anywhere in the demo's own rows",
    { found: demoHits.length, first: demoHits.slice(0, 4) });

  /* THE CONTROL. Raya's tenant holds the real names by definition, so this is
     what says the scan can see one at all (§94.2, §113.8). */
  const raya = (await owner.query("SELECT id FROM tenants WHERE key = 'raya-trade'")).rows[0];
  if (!raya) fail("the control — no raya-trade tenant to scan", "run scripts/dev-tenant.mjs first");
  else {
    const rayaHits = await scan(raya.id);
    check(rayaHits.length > 0, "and the same scan DOES find them next door, so it can see one",
      { found: rayaHits.length, first: rayaHits.slice(0, 3) });
  }

  console.log("── the marks, and running it twice");
  const marks = await withTenant(row.id, async (c) =>
    (await c.query("SELECT key FROM units WHERE extra ? 'logo'")).rows.map((x) => x.key));
  check(marks.length === 0, "no unit carries a lockup — a picture cannot be renamed (§313.8)", marks);
  let refused = null;
  try { await seedDemo({ url: URL_, replace: false, brk, log: () => {} }); }
  catch (e) { refused = e.message; }
  check(refused && /already exists/.test(refused),
    "and seeding it a second time is refused rather than silently overwriting", refused);
} catch (e) {
  fail("the file died rather than reporting (§215)", e && e.message ? e.message.split("\n")[0] : e);
} finally { await owner.end(); }
console.log("\n" + (fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
