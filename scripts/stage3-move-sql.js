/* ── THE MOVE, AS SQL FOR NEON'S EDITOR (§539.2, spec 066 stage 3b d) ─────
   Islam set the terms for the data move: a per-client before-and-after shown
   to him first, rehearsed on a copy, and *"the final step handed over as SQL
   for Neon's SQL editor"*.

   THE SQL IS GENERATED FROM THE PRODUCT'S OWN PLAN, never typed. It reads a
   working copy, asks `capFoldBlockers()` whether the move may run at all and
   `capFoldPlan()` what it would do, and emits statements that do exactly
   that — so the list Islam approves, the rehearsal that was measured and the
   statements that run are one thing (§100.3). Change the move and this
   changes with it.

   AND NO FIGURE IS EVER RETYPED. The statements build each new pillar FROM
   THE ROW ALREADY IN THE DATABASE (`capabilities.extra->'items'->0`), adding
   only the three fields the move decides: the kind, the name where the inner
   pillar stores none, and the owner where it stores none. Every measure,
   tactic, target, actual and note travels inside the object that is already
   there. A generator that printed the data back out could mistranscribe it;
   this one cannot, because it never handles it.

   WHERE THE DATA ACTUALLY LIVES, which is why this is short:
     · the company's own pillars are NOT in the `pillars` table — that table's
       `unit_key` is NOT NULL and references `units`. They ride whole, as
       JSON, in `org.extra->'items'`.
     · a capability's inner pillars ride the same way, in
       `capabilities.extra->'items'`, because `items` is neither a column of
       `capabilities` nor in state-io's drop list for it.
   So the move is three statements inside one jsonb column plus a delete, and
   the `pillars`, `measures` and `tactics` tables are never touched.

   IT REFUSES TO EMIT ANYTHING it cannot do safely, and the SQL it does emit
   refuses to run against a database that is not in the state it was written
   for: every precondition is asserted inside the transaction and raises,
   which rolls the whole thing back.

   Usage:
     node scripts/stage3-move-sql.js <working-copy.html> --schema el_abd
     node scripts/stage3-move-sql.js <file> --schema el_abd > move.sql
   Reads a file and prints SQL. It connects to nothing and writes nothing. */
"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "SMP-Project-Folder", "src");
const argv = process.argv.slice(2);
const input = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--schema");
const sIdx = argv.indexOf("--schema");
const SCHEMA = sIdx >= 0 ? argv[sIdx + 1] : null;
if (!input || !SCHEMA) {
  console.error("usage: node scripts/stage3-move-sql.js <working-copy.html> --schema <client schema>");
  console.error("the schema is the client's own, e.g. el_abd — see scripts/migrate-to-multi-client.js");
  process.exit(2);
}
if (!/^[a-z_][a-z0-9_]*$/.test(SCHEMA)) { console.error("that is not a schema name: " + SCHEMA); process.exit(2); }

const html = fs.readFileSync(input, "utf8");
const m = html.match(/<script type="application\/json" id="smp-offline">([\s\S]*?)<\/script>/);
if (!m) { console.error(path.basename(input) + " holds no smp-offline block — is it a working copy?"); process.exit(2); }
const STATE = JSON.parse(m[1]);

const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const files = [...read("build.py").match(/for tag, f in \[([\s\S]*?)\]:/)[1]
                    .matchAll(/\("[A-Z]+"\s*,\s*"([^"]+)"\)/g)].map((x) => x[1]);
const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Intl, setTimeout });
vm.runInContext("var window = this, document = undefined, localStorage = undefined;", ctx);
files.forEach(function (f) { try { vm.runInContext(read(f), ctx, { filename: f }); } catch (e) {} });
ctx.__s = JSON.parse(JSON.stringify(STATE));
vm.runInContext(`(function(x){
  GROUP=x.group; UNIT_KEYS=x.unitKeys; UNITS=x.units;
  FUNCTION_KEYS=x.functionKeys; FUNCTIONS=x.functions;
  if (typeof fnPruneNulls==="function") (FUNCTION_KEYS||[]).forEach(function(k){ fnPruneNulls(FUNCTIONS[k]); });
  COMPANY_KEYS=x.companyKeys||[]; COMPANIES=x.companies||{};
  PEOPLE=x.people; UNIT_ROLES=x.unitRoles; ACCESS=x.access;
  LABELS.entries=x.labels; BANDS.bands=x.bands;
  KO_WEIGHTS=x.koWeights||{}; CYCLE=x.cycle; REVIEW=x.review;
  HISTORY=x.history; ARCHIVES=x.archives||[]; PRIOR_CYCLE=x.priorCycle||{factors:[]};
  UNIT_KEYS.forEach(function(k){ UNITS[k].ukey=k; }); syncWeights();
})(__s)`, ctx);
const run = (c) => vm.runInContext(c, ctx);

const blockers = run(`capFoldBlockers()`);
if (blockers.length) {
  console.error("NO SQL EMITTED. The move is refused on this client:");
  blockers.forEach(function (b) { console.error("  " + (b.name || b.id) + " — " + b.why.join("; ")); });
  process.exit(1);
}
const plan = run(`capFoldPlan()`);
if (!plan.length) { console.error("NO SQL EMITTED. This client stores no capabilities to move."); process.exit(1); }
const nBefore = run(`(GROUP.items || []).length`);
const org = run(`GROUP.org || ""`);
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const ids = plan.map((r) => q(r.capId)).join(", ");

const L = [];
L.push("-- ── SPEC 066 STAGE 3b (d) · " + (org || SCHEMA) + " ─────────────────────────────");
L.push("-- Generated by scripts/stage3-move-sql.js from " + path.basename(input));
L.push("-- on " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC. Do not edit by hand:");
L.push("-- regenerate it, so what runs is what the product's own capFoldPlan() says.");
L.push("--");
L.push("-- WHAT IT DOES: the " + plan.length + " capability records become " + plan.length +
       " internal pillars of the");
L.push("-- " + (org || "client") + " company's own plan, and the company is set to show its pillars apart");
L.push("-- so the two tabs people read today do not move.");
L.push("--");
L.push("--   CODE          NAME                                     OWNER AFTER       ROW ID");
plan.forEach(function (r) {
  L.push("--   " + (r.was + " → " + r.becomes).padEnd(13) + " " +
    String(r.name).slice(0, 40).padEnd(40) + " " + String(r.owner || "(none)").padEnd(18) + " " + r.pillarId);
});
L.push("--");
L.push("-- Every row id is kept, so every figure, snapshot, submitted report and");
L.push("-- history entry still points at the row it pointed at.");
L.push("--");
L.push("-- HOW TO RUN IT: paste the whole file into Neon's SQL editor and run it once.");
L.push("-- It is ONE transaction with its preconditions asserted inside: if the database");
L.push("-- is not in the state this was generated for, it raises and rolls everything");
L.push("-- back, changing nothing. Running it twice is refused by the same guards.");
L.push("");
L.push("-- 0 · WHICH SCHEMA IS THIS CLIENT? Run this first, on its own. It only reads,");
L.push("--     and it makes the database name itself rather than asking you to know:");
L.push("--     one row per client, with the name the platform shows and how many");
L.push("--     capability records each holds. The row to look for is");
L.push("--     " + (org ? q(org).slice(1, -1) : "this client") + ", with " + plan.length + " capabilities.");
L.push("--     If its schema is not \"" + SCHEMA + "\", stop: regenerate this file with the");
L.push("--     right --schema rather than editing the line below.");
L.push("--");
L.push("-- SELECT n.nspname AS \"schema name\",");
L.push("--        (xpath('/row/v/text()', query_to_xml(");
L.push("--           format('SELECT org_name AS v FROM %I.org WHERE id = 1', n.nspname), false, true, '')))[1]::text");
L.push("--          AS \"the client, as the platform shows it\",");
L.push("--        (xpath('/row/v/text()', query_to_xml(");
L.push("--           format('SELECT count(*) AS v FROM %I.capabilities', n.nspname), false, true, '')))[1]::text");
L.push("--          AS \"capabilities\"");
L.push("--   FROM pg_namespace n");
L.push("--   JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = 'org' AND c.relkind = 'r'");
L.push("--  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')");
L.push("--  ORDER BY 1;");
L.push("");
L.push("SET search_path TO " + SCHEMA + ";");
L.push("");
L.push("BEGIN;");
L.push("");
L.push("-- 1 · THE PRECONDITIONS, BEFORE ANYTHING ELSE. Each raises, which rolls the");
L.push("--     whole transaction back. They come before the backup tables so that a");
L.push("--     second run says what is actually wrong (\"found 0 capabilities\") rather");
L.push("--     than tripping over a backup table it made the first time.");
L.push("DO $$");
L.push("DECLARE n int;");
L.push("BEGIN");
L.push("  -- the schema holds the client this was generated from, and not another");
L.push("  SELECT count(*) INTO n FROM org WHERE id = 1 AND org_name = " + q(org) + ";");
L.push("  IF n <> 1 THEN");
L.push("    RAISE EXCEPTION 'this schema is not " + String(org).replace(/'/g, "''") +
       ", which this file was generated for'; END IF;");
L.push("  SELECT count(*) INTO n FROM capabilities WHERE id IN (" + ids + ");");
L.push("  IF n <> " + plan.length + " THEN");
L.push("    RAISE EXCEPTION 'expected " + plan.length + " capabilities by id, found %', n; END IF;");
L.push("  SELECT count(*) INTO n FROM capabilities;");
L.push("  IF n <> " + plan.length + " THEN");
L.push("    RAISE EXCEPTION 'this client holds % capabilities, not the " + plan.length +
       " this was generated for', n; END IF;");
L.push("  SELECT count(*) INTO n FROM capabilities");
L.push("   WHERE jsonb_array_length(coalesce(extra->'items','[]'::jsonb)) <> 1;");
L.push("  IF n <> 0 THEN");
L.push("    RAISE EXCEPTION '% capabilities do not hold exactly one pillar', n; END IF;");
L.push("  SELECT count(*) INTO n FROM cap_key_objectives;");
L.push("  IF n <> 0 THEN RAISE EXCEPTION '% capability objectives would be lost', n; END IF;");
L.push("  SELECT count(*) INTO n FROM projects;");   /* every row in this table belongs to a capability: cap_id is NOT NULL */
L.push("  IF n <> 0 THEN RAISE EXCEPTION '% capability projects would be lost', n; END IF;");
L.push("  SELECT jsonb_array_length(coalesce(extra->'items','[]'::jsonb)) INTO n FROM org WHERE id = 1;");
L.push("  IF n <> " + nBefore + " THEN");
L.push("    RAISE EXCEPTION 'the company plan holds % pillars, not the " + nBefore +
       " this was generated for', n; END IF;");
L.push("END $$;");
L.push("");
L.push("-- 2 · A COPY OF BOTH TABLES THIS TOUCHES, BEFORE IT TOUCHES THEM.");
L.push("--     Keep them until the pages have been looked at; drop them after.");
L.push("CREATE TABLE org_before_" + stamp + " AS SELECT * FROM org;");
L.push("CREATE TABLE capabilities_before_" + stamp + " AS SELECT * FROM capabilities;");
L.push("");
L.push("-- 3 · THE MOVE. Each new pillar is the row ALREADY IN THE DATABASE, with three");
L.push("--     fields decided by the move laid over it: the kind, the name where the");
L.push("--     inner pillar stores none, and the owner where it stores none (a");
L.push("--     capability's seat holds a person's key, a pillar's owner their name).");
L.push("--     No figure is retyped, because none is read out and written back.");
L.push("UPDATE org SET extra = jsonb_set(extra, '{items}', (extra->'items') || (");
L.push("  SELECT coalesce(jsonb_agg(np ORDER BY c.idx), '[]'::jsonb)");
L.push("  FROM capabilities c");
L.push("  CROSS JOIN LATERAL (SELECT");
L.push("    (c.extra->'items'->0)");
L.push("    || jsonb_build_object('kind', 'Capability')");
L.push("    || jsonb_build_object('name', CASE");
L.push("         WHEN coalesce(c.extra->'items'->0->>'name','') <> '' THEN c.extra->'items'->0->>'name'");
L.push("         ELSE c.name END)");
L.push("    || jsonb_build_object('owner', CASE");
L.push("         WHEN coalesce(c.extra->'items'->0->>'owner','') <> '' THEN c.extra->'items'->0->>'owner'");
L.push("         ELSE coalesce((SELECT p.name FROM people p WHERE p.key = c.extra->>'head'), '') END)");
L.push("    AS np) x");
L.push(")) WHERE id = 1;");
L.push("");
L.push("-- 4 · THE COMPANY SHOWS ITS PILLARS APART, so the Directions and Capabilities");
L.push("--     tabs stay exactly where they are. Written defensively: the three levels");
L.push("--     above the key are created if this client has never saved a Structure.");
L.push("UPDATE org SET extra = jsonb_set(");
L.push("  jsonb_set(");
L.push("    jsonb_set(coalesce(extra, '{}'::jsonb), '{structure}',");
L.push("              coalesce(extra->'structure', '{}'::jsonb), true),");
L.push("    '{structure,top}', coalesce(extra->'structure'->'top', '{}'::jsonb), true),");
L.push("  '{structure,top,plan}',");
L.push("  coalesce(extra->'structure'->'top'->'plan', '{}'::jsonb) || '{\"split\": true}'::jsonb, true)");
L.push("WHERE id = 1;");
L.push("");
L.push("-- 5 · THE RECORDS GO, now that every one of their pillars is in the list.");
L.push("DELETE FROM capabilities WHERE id IN (" + ids + ");");
L.push("");
L.push("-- 6 · AND IT CHECKS ITS OWN WORK before it is allowed to commit.");
L.push("DO $$");
L.push("DECLARE n int; got text; want text;");
L.push("BEGIN");
L.push("  SELECT jsonb_array_length(extra->'items') INTO n FROM org WHERE id = 1;");
L.push("  IF n <> " + (nBefore + plan.length) + " THEN");
L.push("    RAISE EXCEPTION 'the company plan holds % pillars, expected " + (nBefore + plan.length) + "', n; END IF;");
L.push("  SELECT count(*) INTO n FROM capabilities;");
L.push("  IF n <> 0 THEN RAISE EXCEPTION '% capability records are still there', n; END IF;");
L.push("  SELECT (extra->'structure'->'top'->'plan'->>'split') INTO got FROM org WHERE id = 1;");
L.push("  IF got IS DISTINCT FROM 'true' THEN");
L.push("    RAISE EXCEPTION 'the company is not set to show its pillars apart (%)', got; END IF;");
L.push("  -- the moved rows, by id, name and owner — exactly the list at the top of this file");
L.push("  SELECT string_agg(x.v, ' | ' ORDER BY x.i) INTO got FROM (");
L.push("    SELECT ord AS i, (e->>'id') || '/' || (e->>'name') || '/' || coalesce(e->>'owner','') AS v");
L.push("    FROM org, jsonb_array_elements(extra->'items') WITH ORDINALITY AS t(e, ord)");
L.push("    WHERE id = 1 AND e->>'kind' = 'Capability') x;");
L.push("  want := " + q(plan.map((r) => r.pillarId + "/" + r.name + "/" + (r.owner || "")).join(" | ")) + ";");
L.push("  IF got IS DISTINCT FROM want THEN");
L.push("    RAISE EXCEPTION 'the moved rows are not the ones planned. got: % want: %', got, want;");
L.push("  END IF;");
L.push("END $$;");
L.push("");
L.push("COMMIT;");
L.push("");
L.push("-- 7 · READ IT BACK. Run this after the commit; it changes nothing.");
L.push("SELECT ord AS \"#\",");
L.push("       e->>'kind'  AS \"kind\",");
L.push("       e->>'name'  AS \"name\",");
L.push("       e->>'owner' AS \"owner\",");
L.push("       e->>'id'    AS \"row id\",");
L.push("       jsonb_array_length(coalesce(e->'measures','[]'::jsonb)) AS \"measures\",");
L.push("       jsonb_array_length(coalesce(e->'tactics','[]'::jsonb))  AS \"tactics\"");
L.push("  FROM org, jsonb_array_elements(extra->'items') WITH ORDINALITY AS t(e, ord)");
L.push(" WHERE id = 1 ORDER BY ord;");
L.push("");
L.push("-- TO UNDO IT, before the backups are dropped:");
L.push("--   BEGIN;");
L.push("--   UPDATE org o SET extra = b.extra FROM org_before_" + stamp + " b WHERE o.id = b.id;");
L.push("--   INSERT INTO capabilities SELECT * FROM capabilities_before_" + stamp + ";");
L.push("--   COMMIT;");
L.push("-- AND WHEN THE PAGES HAVE BEEN LOOKED AT:");
L.push("--   DROP TABLE org_before_" + stamp + ", capabilities_before_" + stamp + ";");
console.log(L.join("\n"));
