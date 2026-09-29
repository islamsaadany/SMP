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

export async function seedDemo({ url, replace = false, brk = null, log = (s) => console.log(s) } = {}) {
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
    const extra = D.moduleContent([]).modules;
    await owner.query("UPDATE tenants SET name = $2, modules = $3::jsonb WHERE id = $1",
      [row.id, graph.group.org, JSON.stringify(extra)]);
    await withTenant(row.id, (c) => replaceContent(c, row.id, graph));
    const back = await withTenant(row.id, (c) => readState(c));
    if (!back) throw new Error("seed-demo: the tenant holds no graph after loading it");
    if (!brk) D.refuseIfAnySurvives(back, real);
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
