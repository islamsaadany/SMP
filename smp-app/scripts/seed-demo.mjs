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
    if (row) await owner.query("DELETE FROM tenants WHERE key = $1", [D.CLIENT_KEY]);
    /* `kind = 'demo'` is the registry's own word for it (schema.sql's CHECK),
       so nothing has to infer what this tenant is from its key. */
    row = (await owner.query(
      "INSERT INTO tenants (key, name, kind, made_here) VALUES ($1,$2,'demo',true) RETURNING id",
      [D.CLIENT_KEY, graph.group.org])).rows[0];
    await withTenant(row.id, (c) => loadGraph(c, graph));
    const back = await withTenant(row.id, (c) => readState(c));
    if (!back) throw new Error("seed-demo: the tenant holds no graph after loading it");
    if (!brk) D.refuseIfAnySurvives(back, real);
    log("Written and read back: " + (back.group && back.group.org) + " · " +
        Object.keys(back.units || {}).length + " units · " + (back.people || []).length + " people.");
    return { tenantId: row.id, graph: back, units, people, marks };
  } finally { await owner.end(); }
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
