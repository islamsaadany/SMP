/* THE DEMO TENANT'S CONTENT, under the shared schema (spec 043 Phase I).

   §313.8 made the worked example a CLIENT with a schema of its own; §314
   replaced schema-per-client with one shared schema and row-level security,
   so the demo is a TENANT now and what keeps it apart is the policy rather
   than a `search_path`. Nothing else about it moves.

   THE NAMES AND THE REFUSAL ARE THE FROZEN SCRIPT'S, REQUIRED AND NOT COPIED
   (§53.5). `scripts/seed-demo-client.js` holds the renaming table Islam
   approved and the scan that THROWS on any real name that survived it
   (§52.10's lesson: a substitution pass that misses a string produces a file
   that looks perfect and names a real client in one sentence nobody scrolled
   to). A second copy here would be a second answer to what the demo is, and
   the one that drifted would be the one nobody was reading.

   AND IT IS REFUSED TWICE: once on the graph this builds, and once on the
   graph POSTGRES HANDS BACK — a write that half-lands is a demo with a plan
   and no people, and the round trip through jsonb is exactly where a string
   could survive a check made in memory.

     DATABASE_URL_UNPOOLED=postgres://owner@… node scripts/seed-demo.mjs [--dry-run] [--replace]
     … --break=raw-names   (RED: the demo is seeded from the UNRENAMED example)
     … --break=keep-marks  (RED: the units keep the real client's lockups)

   Re-running without --replace is refused: a demo somebody has practised in
   is not something to overwrite by typing a command twice. */
import Module, { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { schemaIdent } from "../db/schema-name.mjs";
import { withTenant } from "../lib/tenant.ts";
import { loadGraph, readState } from "../lib/state-io.ts";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
/* THE FROZEN SCRIPT RUNS ON THE APP'S OWN PACKAGES (§317.10). It lives at the
   repository root and does `require("pg")` from there — which on a laptop
   finds the root's node_modules and on Vercel finds nothing, because only
   smp-app/ is installed: "Cannot find module 'pg'", one line after the carry
   had correctly stood down. It is REQUIRED rather than copied on purpose
   (§316.9: the renaming table and its refusal are the frozen product's, and a
   second copy is the drift §53.5 names), so the app's node_modules is put on
   the resolution path before it is loaded. `pg` is the one package the chain
   needs and the app already depends on it. */
process.env.NODE_PATH = [join(here, "..", "node_modules"), process.env.NODE_PATH].filter(Boolean).join(":");
Module._initPaths();
const D = require("../../scripts/seed-demo-client.js");   /* the frozen renamer AND its refusal */
const G = require("../lib/graph-io.cjs");                 /* the loader's own row builders */

export async function seedDemo({ url, replace = false, brk = null, log = (s) => console.log(s), store = null } = {}) {
  const real = D.realNames(JSON.parse(readFileSync(join(here, "..", "..", "db", "seed-state.json"), "utf8")));
  /* THE BREAK IS THE UNRENAMED EXAMPLE, which is the one thing a demo must
     never be — so the falsification is of the claim that matters rather than
     of a mechanism (§94.8). */
  const graph = brk === "raw-names"
    ? JSON.parse(readFileSync(join(here, "..", "..", "db", "seed-state.json"), "utf8"))
    : D.demoGraph();
  if (brk === "keep-marks") {
    const from = JSON.parse(readFileSync(join(here, "..", "..", "db", "seed-state.json"), "utf8"));
    for (const k of Object.keys(graph.units || {}))
      if (from.units[k] && from.units[k].logo) graph.units[k].logo = from.units[k].logo;
  }
  if (!brk) D.refuseIfAnySurvives(graph, real);
  if (!brk) D.refuseIfAnySurvives(D.moduleContent([]), real);   /* the tracker and the notes too */

  const units = Object.keys(graph.units || {}).length, people = (graph.people || []).length;
  const marks = Object.values(graph.units || {}).filter((u) => u && u.logo).length;
  log("Demo content: " + graph.group.org + " · " + units + " units · " + people + " people · " + marks + " marks.");
  if (!url) { log("--dry-run: nothing written."); return { graph, units, people, marks }; }

  const owner = new pg.Client({ connectionString: url });
  await owner.connect();
  /* The shared schema, said out loud (§317.4): a connection with no path of
     its own opens in `public`, which on the real database is a client. */
  await owner.query("SET search_path TO " + schemaIdent());
  try {
    let row = (await owner.query("SELECT id FROM tenants WHERE key = $1", [D.CLIENT_KEY])).rows[0];
    if (row && !replace) throw new Error("the '" + D.CLIENT_KEY + "' tenant already exists — pass --replace to overwrite it");
    /* REPLACING KEEPS THE TENANT, and that is the whole of the change
       (2026-09-29). The first version deleted the row and made a new one,
       which CASCADES through `tenant_users` — everybody who had been given
       the demo lost it on the next re-seed, and an insight written about it
       (`memory_entries`, ON DELETE RESTRICT) refused the delete outright. So
       the tenant stays, its CONTENT is swapped, and the people its
       memberships point at are the one part of the register left standing. */
    if (!row) {
      /* `kind = 'demo'` is the registry's own word for it (schema.sql's
         CHECK), so nothing has to infer what this tenant is from its key. */
      row = (await owner.query(
        "INSERT INTO tenants (key, name, kind, made_here) VALUES ($1,$2,'demo',true) RETURNING id",
        [D.CLIENT_KEY, graph.group.org])).rows[0];
    }
    const done = await withTenant(row.id, (c) => replaceContent(c, row.id, graph));
    const kept = done.keep;
    /* THE LIBRARY AFTER THE GRAPH, OUTSIDE ITS TRANSACTION: a report is a file
       in the store as well as a row, and a store that is not set up in this
       build must cost the demo its reports, never the build (point 19). The
       modules are written after it, so Insights is switched on only where the
       library has something in it. */
    const reports = await seedLibrary(row.id, done.oldFiles, log, store);
    const extra = D.moduleContent([]).modules.concat(reports > 0 ? ["insights"] : []);
    await owner.query("UPDATE tenants SET name = $2, modules = $3::jsonb WHERE id = $1",
      [row.id, graph.group.org, JSON.stringify(extra)]);
    const back = await withTenant(row.id, (c) => readState(c));
    if (!back) throw new Error("seed-demo: the tenant holds no graph after loading it");
    /* THE PEOPLE A MEMBERSHIP POINTS AT ARE NOT THE DEMO'S CONTENT. They are
       the office — Forefront's own consultants, placed on the demo so they can
       open it — and replacing keeps their register rows on purpose. The real
       example names some of them as owners, so their names are on the
       forbidden list, and the first production replace refused its own kept
       rows (2026-09-30: "Islam Saadany" at people[33]). The scan skips exactly
       those keys and nothing else: every row this seed WROTE is still read. */
    if (!brk) D.refuseIfAnySurvives(Object.assign({}, back,
      { people: (back.people || []).filter((p) => !kept.has(p.key)) }), real);
    log("Written and read back: " + (back.group && back.group.org) + " · " +
        Object.keys(back.units || {}).length + " units · " + (back.people || []).length + " people.");
    return { tenantId: row.id, graph: back, units, people, marks };
  } finally { await owner.end(); }
}

/* ONE TRANSACTION, UNDER THE TENANT (withTenant): the policy narrows every
   statement to the demo, and the explicit `tenant_id` below says it again,
   because a superuser connection bypasses the policy and "every row" would
   then mean every client's. */
const MODULE_TABLES = ["tracker_events", "tracker_actions", "note_sends", "notes"];
async function replaceContent(c, tenantId, graph) {
  const members = (await c.query(
    "SELECT person_key, seat FROM tenant_users WHERE tenant_id = $1", [tenantId])).rows;
  const keep = new Set(members.map((m) => m.person_key));
  for (const t of MODULE_TABLES) await c.query('DELETE FROM "' + t + '" WHERE tenant_id = $1', [tenantId]);
  /* THE LIBRARY: ONLY WHAT THIS SEED PUT THERE. A report somebody uploaded to
     the demo by hand is theirs and stays; the seed's own carry `extra.demo`,
     and their files are handed back so the store is emptied of them too. */
  const oldFiles = (await c.query(
    "DELETE FROM library_items WHERE tenant_id = $1 AND extra->>'demo' = 'true' RETURNING file_path",
    [tenantId])).rows.map((r) => r.file_path).filter(Boolean);
  for (const t of G.ALL_TABLES) {
    if (t === "people") {
      await c.query("DELETE FROM people WHERE tenant_id = $1 AND NOT (key = ANY($2::text[]))", [tenantId, [...keep]]);
    } else {
      await c.query('DELETE FROM "' + t + '" WHERE tenant_id = $1', [tenantId]);
    }
  }
  for (const t of G.tableRows(graph)) {
    const rows = t.table === "people" ? t.rows.filter((r) => !keep.has(r.key)) : t.rows;
    await G.insertMany(c, t.table, t.cols, rows);
  }
  /* The office's own lists. An owner has to hold an office seat (spec 054
     decision 5), so the seats found on this demo own them; a demo nobody has
     been placed on yet falls back to the register's head of the office. */
  const office = members.filter((m) => m.seat === "super" || m.seat === "smoteam").map((m) => m.person_key);
  const m = D.moduleContent(office);
  for (const a of m.tracker) {
    const id = (await c.query(
      "INSERT INTO tracker_actions (title, description, owner_key, due, first_due, status, done_at, created_by) " +
      "VALUES ($1,$2,$3,$4,$4,$5, CASE WHEN $5 = 'done' THEN now() END, 'demo') RETURNING id",
      [a.title, a.description, a.owner, a.due, a.status])).rows[0].id;
    await c.query("INSERT INTO tracker_events (action_id, kind, to_status, by_key) VALUES ($1,'created','not_started',$2)", [id, a.owner]);
    if (a.status !== "not_started") {
      await c.query("INSERT INTO tracker_events (action_id, kind, from_status, to_status, by_key) VALUES ($1,'status','not_started',$2,$3)",
        [id, a.status, a.owner]);
    }
  }
  for (const n of m.notes) {
    await c.query(
      "INSERT INTO notes (title, met_on, attendees, raw, minutes, created_by) VALUES ($1,$2,$3::jsonb,$4,$5::jsonb,'demo')",
      [n.title, n.metOn, JSON.stringify(n.attendees), n.raw, JSON.stringify(n.minutes)]);
  }
  return { keep, oldFiles };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dry = process.argv.includes("--dry-run");
  const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8) || null;
  const url = dry ? null : (process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!dry && !url) { console.error("seed-demo: no owner connection string (DATABASE_URL_UNPOOLED)"); process.exit(2); }
  seedDemo({ url, replace: process.argv.includes("--replace"), brk })
    .then(() => {}, (e) => { console.error(e.message); process.exit(1); });
}

/* ── THE INSIGHTS REPORTS (point 19, 2026-09-30) ─────────────────────────
   Five invented reports, one per library category, rendered once to PDF by
   scripts/demo-reports/reports.mjs and committed. Each goes the way a
   consultant's upload goes — a row, the file under the path the library
   mints for it, the file set on the row, published — through the library's
   and the store's OWN functions, so there is no second writer of either.

   A BUILD WITHOUT THE STORE'S KEY SKIPS THEM AND SAYS SO: the rows would list
   reports whose Download answers "Not found". `store` is the check's stand-in
   for the real store; everything else is the product's. */
async function seedLibrary(tenantId, oldFiles, log, store) {
  const B = store || await import("../lib/blob-api.ts");
  for (const f of oldFiles) { try { await B.dropBlob(f); } catch { /* an orphan file is not a failed demo */ } }
  if (!B.ready()) {
    log("Insights: no file store key in this build — the demo's reports are skipped and Insights stays off");
    return 0;
  }
  const LIB = await import("../lib/library.ts");
  const { REPORTS, reportText } = await import("../../scripts/demo-reports/reports.mjs");
  D.refuseIfAnySurvives(REPORTS.map(reportText),
    D.realNames(JSON.parse(readFileSync(join(here, "..", "..", "db", "seed-state.json"), "utf8"))));
  let n = 0;
  for (const r of REPORTS) {
    try {
      const bytes = readFileSync(join(here, "..", "..", "scripts", "demo-reports", r.file));
      const item = await withTenant(tenantId, (c) => LIB.insertItem(c, "insights",
        LIB.draftOf({ title: r.title, summary: r.summary, categories: r.categories, reportDate: r.date })));
      await withTenant(tenantId, (c) => c.query(
        "UPDATE library_items SET extra = COALESCE(extra,'{}'::jsonb) || '{\"demo\":true}'::jsonb WHERE id = $1", [item.id]));
      const path = LIB.filePath("insights", tenantId, item.id, r.file);
      const up = await B.beginUpload(path, "application/pdf");
      if (!up) throw new Error("the store refused to start the upload");
      const etag = await B.putPart(path, up.key, up.uploadId, 1, bytes);
      await B.finishUpload(path, up.key, up.uploadId, [{ etag, partNumber: 1 }]);
      await withTenant(tenantId, async (c) => {
        await LIB.setFile(c, item.id, path, r.file, bytes.length);
        await LIB.setState(c, item.id, "published", "demo");
      });
      n++;
    } catch (e) {
      log("Insights: '" + r.title + "' was not published — " + String((e && e.message) || e).split("\n")[0]);
    }
  }
  log("Insights: " + n + " of " + REPORTS.length + " demo reports published");
  return n;
}
