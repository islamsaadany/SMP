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
import { PLATFORM_TABLES } from "../lib/schema-check.ts";  /* not a tenant's, so not fenced (§331, §442.13) */
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
     AND ASKED OF `SCHEMA`, NEVER `public` (§330): the catalogue is asked by
     NAME, which is the one kind of query a `search_path` cannot help — so
     §317.4 correctly moved this pool's path at line 37 and left this query
     naming the room the tables had just left. It then found nought tables and
     scanned nothing, and a scan of nothing finds no forbidden name.
     AND CARRYING A `tenant_id` IS NOT THE SAME AS BEING A TENANT'S (§442.13):
     `tenant_users` and `memory_entries` carry one and are the PLATFORM's, so
     row-level security deliberately does not fence them (§331) — and this
     scan runs under `withTenant`, whose narrowing IS that fence, so on those
     tables it read every tenant's rows and attributed them to the demo: 102
     hits, of which the first was a consultant's seat on somebody else's
     client. §330's fault turned inside out — *a scan whose narrowing is not
     there reports the whole platform as this tenant's* — and both halves have
     one root, the list being derived from a COLUMN rather than from the
     product's own answer to which tables are a tenant's. That answer exists,
     is shared, and is asserted against `db/schema.sql`'s own loop
     (`PLATFORM_TABLES`, §331), so it is IMPORTED rather than listed
     (§104.7). */
  const tables = (await owner.query(
    "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' " +
    "WHERE n.nspname = $1 AND c.relkind = 'r' AND NOT (c.relname = ANY($2)) " +
    "ORDER BY c.relname", [SCHEMA, PLATFORM_TABLES])).rows.map((x) => x.relname);
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
  /* THE OFFICE IS NOT CONTENT (2026-09-30). A person a membership points at
     is one of Forefront's consultants, placed on the tenant so they can open
     it, and a replace keeps that row on purpose; the example names some of
     them as owners, so their names are forbidden words. Skipped by KEY, only
     in `people`, only while the membership exists — the first production
     replace refused its own kept rows and failed the build. */
  const scan = async (tid) => {
    const hits = [];
    const members = new Set((await owner.query(
      "SELECT person_key FROM tenant_users WHERE tenant_id = $1", [tid])).rows.map((r) => r.person_key));
    await withTenant(tid, async (c) => {
      for (const t of tables) {
        /* …and a field that only HOLDS one of their keys (a membership, a
           tracker owner) names the office, not the client. */
        const rows = (await c.query('SELECT * FROM "' + t + '"')).rows
          .filter((r) => !(t === "people" && members.has(r.key)))
          .map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => !members.has(v))));
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

  /* THE DEMO'S OWN CONTENT (scripts/demo-content.js, 2026-09-29). What it
     exists to show: every form a plan can take, reporting that is filled in,
     and the office's modules with something in them. Read back from the
     DATABASE, not from the graph the script built, so a form that did not
     survive the row builders fails here. */
  console.log("── what the demo shows");
  const back = await withTenant(row.id, async (c) => (await import("../lib/state-io.ts")).readState(c));
  const fnForms = new Set(Object.values(back.functions).map((f) => f.format || "projects"));
  check(["projects", "pillars", "objectives"].every((x) => fnForms.has(x)),
    "the functions plan all three ways — projects, pillars, objectives and actions", [...fnForms]);
  const unitForms = new Set(Object.values(back.units).map((u) => u.format || "pillars"));
  check(unitForms.has("objectives") && unitForms.has("pillars"), "and a unit plans in objectives and actions", [...unitForms]);
  check((back.group.capabilities || []).some((c) => c.format === "pillars"), "and a capability plans in pillars");
  const thin = Object.entries(back.units).filter(([, u]) => (u.format || "pillars") === "pillars" && (u.items || []).length < 3).map(([k]) => k);
  check(thin.length === 0, "every unit planning in pillars has at least three", thin);
  const unrep = [];
  Object.entries(back.units).forEach(([k, u]) => {
    if ((u.format || "pillars") !== "pillars") return;
    (u.keyObjectives || []).concat(...(u.items || []).map((p) => p.measures || []))
      .forEach((m) => { if (m.actual == null || m.actual === "") unrep.push(k + ":" + (m.id || m.name)); });
  });
  check(unrep.length === 0, "every objective and measure has a reported figure", unrep.slice(0, 6));
  const noSW = Object.entries(back.functions).filter(([, f]) => !((f.swot || {}).s || []).length || !((f.swot || {}).w || []).length).map(([k]) => k);
  check(noSW.length === 0, "every function has strengths and weaknesses", noSW);
  check(back.history.length >= 3 && back.archives.length >= 1, "three closed periods and an archived cycle",
    { history: back.history.length, archives: back.archives.length });
  const unsub = Object.keys(back.units).filter((k) => !back.review.submitted[k]);
  check(unsub.length === 2, "two units are left to chase, on purpose", unsub);

  /* REPLACING KEEPS WHO HAS THE DEMO. The first re-seed deleted the tenant,
     which cascaded through tenant_users; a membership planted here must be
     there after --replace, and the tracker is owned by that seat. */
  console.log("── replacing keeps the tenant and who has it");
  const office = (await owner.query("SELECT id FROM users WHERE kind = 'office' ORDER BY created_at LIMIT 1")).rows[0];
  if (!office) fail("no office login to place on the demo", "run scripts/dev-tenant.mjs first");
  else {
    await owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,'smo','super') " +
      "ON CONFLICT (tenant_id, user_id) DO UPDATE SET person_key = 'smo', seat = 'super'", [row.id, office.id]);
    const again = await seedDemo({ url: URL_, replace: true, brk, log: () => {} });
    check(again.tenantId === row.id, "--replace keeps the tenant rather than making a new one", again.tenantId);
    const kept = (await owner.query("SELECT seat FROM tenant_users WHERE tenant_id = $1 AND user_id = $2", [row.id, office.id])).rows[0];
    /* AND A KEPT PERSON WHOSE NAME IS A FORBIDDEN WORD DOES NOT REFUSE THE
       REPLACE — production's own case: a consultant the example names as an
       owner, placed on the demo. Named from the example's own words, so the
       check never types a real name. */
    const word = [...real].find((n) => /\s/.test(n)) || "Placed Person";
    await withTenant(row.id, (c) => c.query(
      "INSERT INTO people (key, idx, name, role) VALUES ('ff_check', 99, $1, 'super') ON CONFLICT (tenant_id, key) DO UPDATE SET name = $1", [word]));
    const second = (await owner.query("SELECT id FROM users WHERE kind = 'office' AND id <> $1 ORDER BY created_at LIMIT 1", [office.id])).rows[0];
    let replaced = null, why = null;
    if (second) {
      await owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,'ff_check','smoteam') " +
        "ON CONFLICT (tenant_id, user_id) DO UPDATE SET person_key = 'ff_check', seat = 'smoteam'", [row.id, second.id]);
      try { replaced = await seedDemo({ url: URL_, replace: true, brk, log: () => {} }); } catch (e) { why = e.message.split("\n")[0]; }
    }
    check(!second || (replaced && !why), "a placed consultant the example names does not refuse the replace", why || (second ? "ok" : "no second office login"));
    check(kept && kept.seat === "super", "and the office seat on it survives", kept);
    const seats = new Set((await owner.query(
      "SELECT person_key FROM tenant_users WHERE tenant_id = $1 AND seat IN ('super','smoteam')", [row.id])).rows.map((r) => r.person_key));
    const mods = await withTenant(row.id, async (c) => ({
      actions: (await c.query("SELECT owner_key FROM tracker_actions")).rows,
      notes: (await c.query("SELECT count(*)::int AS n FROM notes")).rows[0].n,
    }));
    check(mods.actions.length >= 10 && mods.actions.every((a) => seats.has(a.owner_key)),
      "the tracker is filled, owned by the office seat it found", mods.actions.length);
    check(mods.notes >= 3, "and meeting notes are there", mods.notes);
    const t = (await owner.query("SELECT modules FROM tenants WHERE id = $1", [row.id])).rows[0];
    check(t && ["tracker", "notes"].every((m) => (t.modules || []).includes(m)), "and both modules are switched on", t && t.modules);
  }

  /* THE INSIGHTS REPORTS (point 19). The real store is not reachable from a
     check, so a stand-in records what the seeder hands it — the seeder's own
     path through the library's functions is what runs. Both ends (§94.2): a
     build with no store key publishes nothing and leaves Insights off; one
     with a store publishes five, one per category, and a replace takes back
     exactly the seed's own reports and files while a hand-uploaded one stays. */
  console.log("── the Insights reports");
  const none = { ready: () => false, dropBlob: async () => true };
  await seedDemo({ url: URL_, replace: true, brk, log: () => {}, store: none });
  const offMods = (await owner.query("SELECT modules FROM tenants WHERE id = $1", [row.id])).rows[0].modules;
  const offRows = await withTenant(row.id, async (c) => (await c.query(
    "SELECT count(*)::int n FROM library_items WHERE extra->>'demo' = 'true'")).rows[0].n);
  check(!offMods.includes("insights") && offRows === 0, "with no file store, no reports and Insights stays off", { offMods, offRows });
  const put = [], dropped = [];
  const fake = { ready: () => true,
    beginUpload: async (p) => ({ key: "k", uploadId: "u:" + p }),
    putPart: async (p, k, u, n, bytes) => { put.push({ p, size: bytes.length, pdf: bytes.subarray(0, 4).toString() }); return "etag"; },
    finishUpload: async () => true,
    dropBlob: async (p) => { dropped.push(p); return true; } };
  await seedDemo({ url: URL_, replace: true, brk, log: () => {}, store: fake });
  const lib = await withTenant(row.id, async (c) => (await c.query(
    "SELECT title, state, file_path, file_size, categories FROM library_items WHERE extra->>'demo' = 'true' ORDER BY report_date")).rows);
  const cats = new Set(lib.flatMap((r) => r.categories));
  check(lib.length === 5 && lib.every((r) => r.state === "published" && r.file_path && Number(r.file_size) > 1000),
    "five reports published, each with its file", lib.map((r) => [r.title, r.state, r.file_size]));
  check(["Analysis", "Macro", "Market", "Sector", "Governance"].every((c2) => cats.has(c2)), "one in every category", [...cats]);
  check(put.length === 5 && put.every((x) => x.pdf === "%PDF"), "and what went to the store is five PDFs", put);
  const onMods = (await owner.query("SELECT modules FROM tenants WHERE id = $1", [row.id])).rows[0].modules;
  check(onMods.includes("insights"), "and Insights is switched on", onMods);
  await withTenant(row.id, (c) => c.query("INSERT INTO library_items (title, state) VALUES ('Uploaded by hand', 'published')"));
  const firstPaths = lib.map((r) => r.file_path);
  await seedDemo({ url: URL_, replace: true, brk, log: () => {}, store: fake });
  const after = await withTenant(row.id, async (c) => (await c.query("SELECT title, extra->>'demo' AS demo FROM library_items")).rows);
  check(firstPaths.every((p2) => dropped.includes(p2)), "a replace takes the seed's old files out of the store", { dropped: dropped.length });
  check(after.filter((r) => r.demo === "true").length === 5 && after.some((r) => r.title === "Uploaded by hand"),
    "and leaves five of its own and the one uploaded by hand", after.map((r) => r.title));
  await withTenant(row.id, (c) => c.query("DELETE FROM library_items WHERE title = 'Uploaded by hand'"));
} catch (e) {
  fail("the file died rather than reporting (§215)", e && e.message ? e.message.split("\n")[0] : e);
} finally { await owner.end(); }
console.log("\n" + (fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
