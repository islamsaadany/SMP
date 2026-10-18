/* ── THE MOVE, AS SQL FOR NEON'S EDITOR (§542.2, spec 066 stage 3b d) ─────
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
const FLAGVAL = ["--schema", "--rename", "--tenant"];
const input = argv.find((a) => !a.startsWith("--") && FLAGVAL.indexOf(argv[argv.indexOf(a) - 1]) < 0);
const sIdx = argv.indexOf("--schema");
const SCHEMA = sIdx >= 0 ? argv[sIdx + 1] : null;
/* §542.5 — TWO LAYOUTS, BECAUSE THE LIVE DATABASE IS NOT THE ONE IN THIS
   REPOSITORY. `db/schema.sql` and scripts/migrate-to-multi-client.js describe
   a schema per client (`el_abd.org`, `platform.clients`). The deployment has
   moved past that: one set of tables in a `smp` schema with a `tenant_id`
   column on every row, and `smp.tenants` as the register. Both of the older
   shapes are still in the database as leftovers, which is exactly why a file
   written from the repository ran against the wrong one and failed.

   SO THE LAYOUT IS CHOSEN BY THE CALLER, NEVER GUESSED: `--tenant <key>` for
   the live shape, `--schema <name>` for the older one. Guessing is what cost
   two rounds; a flag costs a word. */
const tIdx = argv.indexOf("--tenant");
const TENANT = tIdx >= 0 ? argv[tIdx + 1] : null;
/* §542.4: and the client's own name, where it is being corrected at the same
   time — stored in two places, so a rename done by hand in one of them leaves
   the cards and the pages disagreeing. */
const rIdx = argv.indexOf("--rename");
const RENAME = rIdx >= 0 ? argv[rIdx + 1] : null;
/* §544.6 — WHOSE THE CAPABILITIES ARE, said rather than guessed. A record
   held by a function refuses to move to the company, because §7.1's other
   answer — it becomes a pillar of that function — is a real way to do this
   and nothing should choose between them silently. `--to-company` is the
   office's statement, and the SQL writes it into the client's own structure
   so the stored state ends up as the rehearsal left it. */
const TOTOP = argv.indexOf("--to-company") >= 0;
if (!input || (!SCHEMA && !TENANT) || (SCHEMA && TENANT)) {
  console.error("usage: node scripts/stage3-move-sql.js <working-copy.html> --tenant <key> [--to-company] [--rename <name>]");
  console.error("   or: node scripts/stage3-move-sql.js <working-copy.html> --schema <name> [--rename <name>]");
  console.error("--tenant is the live layout (smp.* with a tenant_id); --schema is the older one.");
  process.exit(2);
}
if (rIdx >= 0 && !String(RENAME || "").trim()) { console.error("--rename needs a name"); process.exit(2); }
if (SCHEMA && !/^[a-z_][a-z0-9_]*$/.test(SCHEMA)) { console.error("that is not a schema name: " + SCHEMA); process.exit(2); }
if (TENANT && !/^[a-z0-9][a-z0-9-]*$/.test(TENANT)) { console.error("that is not a tenant key: " + TENANT); process.exit(2); }

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

if (TOTOP) run(`(function(){ var st = SMPRules.structureOf(GROUP) ? JSON.parse(JSON.stringify(SMPRules.structureOf(GROUP))) : {};
  st.cap = Object.assign({}, st.cap || {}, { at: "top", exists: true }); GROUP.structure = st; })()`);

const blockers = run(`capFoldBlockers()`);
if (blockers.length) {
  console.error("NO SQL EMITTED. The move is refused on this client:");
  blockers.forEach(function (b) { console.error("  " + (b.name || b.id) + " — " + b.why.join("; ")); });
  process.exit(1);
}
const plan = run(`capFoldPlan()`);
if (!plan.length) { console.error("NO SQL EMITTED. This client stores no capabilities to move."); process.exit(1); }
const nBefore = run(`(GROUP.items || []).length`);
/* §544.6/.7 — WHAT THIS CLIENT'S CAPABILITIES ARE SHAPED LIKE, counted here
   so the SQL can assert it before it writes. A capability may hold several
   inner pillars (each becomes one), or one project (which becomes one, its
   deliverables the measures and its milestones the tactics). */
const CAPROWS = run(`(GROUP.capabilities || []).map(function(c){
  var pr = (c.projects || [])[0] || null;
  return { id: c.id, name: c.name || "", idx: 0,
           pillars: (c.items || []).length,
           project: pr ? pr.id : null,
           deliverables: pr ? (pr.deliverables || []).length : 0,
           milestones: pr ? (pr.milestones || []).length : 0,
           outcomes: pr ? (pr.outcomes || []).length : 0,
           plainRows: pr ? (pr.milestones || []).concat(pr.deliverables || []).every(function(x){
             return !String(x.covers || "").trim() && !String(x.finish || "").trim() &&
                    !String(x.status || "").trim() && (x.pct == null || x.pct === "") &&
                    !String(x.note || "").trim(); }) : true }; })`);
const PROJ = CAPROWS.filter(function (c) { return c.project; });
/* A dated or reported milestone would need its quarter worked out, and a
   per-cent carried, inside PL/pgSQL where nothing here could test it. The
   generator refuses instead and says so: when a client turns up with one,
   that is when it gets written, and tested (§113.8). */
const dated = PROJ.filter(function (c) { return !c.plainRows; });
if (dated.length) {
  console.error("NO SQL EMITTED. A project's rows carry dates, states or notes, which this");
  console.error("generator will not translate unseen:");
  dated.forEach(function (c) { console.error("  " + c.name); });
  process.exit(1);
}
if (PROJ.some(function (c) { return c.outcomes; })) {
  console.error("NO SQL EMITTED. A project carries outcomes, which have nowhere to go yet.");
  process.exit(1);
}
const org = run(`GROUP.org || ""`);
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
/* §544.6: DISTINCT, because one record may plan several rows now — Data
   Management's two pillars are two rows of one capability, and counting the
   list would have asserted four records where there are three. */
const capIds = plan.map((r) => r.capId).filter((v, i, a) => a.indexOf(v) === i);
const ids = capIds.map(q).join(", ");

const L = [];
L.push("-- ── SPEC 066 STAGE 3b (d) · " + (org || SCHEMA) + " ─────────────────────────────");
L.push("-- Generated by scripts/stage3-move-sql.js from " + path.basename(input));
L.push("-- on " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC. Do not edit by hand:");
L.push("-- regenerate it, so what runs is what the product's own capFoldPlan() says.");
L.push("--");
L.push("-- WHAT IT DOES: the " + CAPROWS.length + " capability record" + (CAPROWS.length === 1 ? "" : "s") +
       " become " + plan.length + " internal pillar" + (plan.length === 1 ? "" : "s") + " of the");
L.push("-- " + (org || "client") + " company's own plan, and the company is set to show its pillars apart");
L.push("-- so the two tabs people read today do not move.");
if (RENAME) {
  L.push("-- Step 8, at the end, also renames the client to " + RENAME + " in both the places");
  L.push("-- the name is stored. Once it has run this file cannot run again, which is");
  L.push("-- deliberate: its first check is the OLD name.");
}
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
/* ── THE TWO LAYOUTS, SAID ONCE ──────────────────────────────────────────
   Everything below writes the same five statements; only the names and the
   row filter differ. `W` is the clause that picks this client's rows, `TB`
   qualifies a table, and `TID` resolves the tenant. In the per-schema layout
   the schema itself is the filter, so `W` is the id test the old file used. */
var TB, W, WORG, TIDSQL, REG, REGW, SETPATH;
if (TENANT) {
  TB = function (t) { return "smp." + t; };
  TIDSQL = "(SELECT id FROM smp.tenants WHERE key = " + q(TENANT) + ")";
  W = "tenant_id = " + TIDSQL;
  WORG = W;
  REG = "smp.tenants"; REGW = "key = " + q(TENANT);
  SETPATH = null;
} else {
  TB = function (t) { return t; };
  TIDSQL = null;
  W = "true";
  WORG = "id = 1";
  REG = "platform.clients"; REGW = "schema_name = " + q(SCHEMA);
  SETPATH = SCHEMA;
}
var ORG = TB("org"), CAPS = TB("capabilities"), PPL = TB("people");
var BK = TENANT ? "smp.org_before_" + stamp : "org_before_" + stamp;
var BKC = TENANT ? "smp.capabilities_before_" + stamp : "capabilities_before_" + stamp;

L.push("-- 0 · WHICH CLIENT IS WHICH? Run this first, on its own. It only reads, and");
L.push("--     it makes the database name itself rather than asking you to know. The");
L.push("--     row to look for is " + (org ? String(org).replace(/-/g, "-") : "this client") +
       " with " + plan.length + " capabilities.");
L.push("--");
if (TENANT) {
  L.push("-- SELECT t.key, t.name, t.status,");
  L.push("--        (SELECT count(*) FROM smp.capabilities c WHERE c.tenant_id = t.id) AS capabilities,");
  L.push("--        (SELECT o.org_name FROM smp.org o WHERE o.tenant_id = t.id)        AS \"name inside\"");
  L.push("--   FROM smp.tenants t ORDER BY t.name;");
} else {
  L.push("-- SELECT n.nspname AS \"schema\",");
  L.push("--        (xpath('/row/v/text()', query_to_xml(");
  L.push("--           format('SELECT org_name AS v FROM %I.org WHERE id = 1', n.nspname), false, true, '')))[1]::text AS \"client\"");
  L.push("--   FROM pg_namespace n JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = 'org' AND c.relkind = 'r'");
  L.push("--  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') ORDER BY 1;");
}
L.push("");
if (SETPATH) { L.push("SET search_path TO " + SETPATH + ";"); L.push(""); }
L.push("BEGIN;");
L.push("");
L.push("-- 1 · THE PRECONDITIONS, BEFORE ANYTHING ELSE. Each raises, which rolls the");
L.push("--     whole transaction back. They come first so that a second run says what is");
L.push("--     actually wrong rather than tripping over a backup table it made before.");
L.push("DO $$");
L.push("DECLARE n int;");
L.push("BEGIN");
if (TENANT) {
  L.push("  SELECT count(*) INTO n FROM smp.tenants WHERE key = " + q(TENANT) + ";");
  L.push("  IF n <> 1 THEN RAISE EXCEPTION 'no client with the key " +
         String(TENANT).replace(/'/g, "''") + "'; END IF;");
}
L.push("  -- the rows really are the client this file was generated from");
L.push("  SELECT count(*) INTO n FROM " + ORG + " WHERE " + WORG + " AND org_name = " + q(org) + ";");
L.push("  IF n <> 1 THEN RAISE EXCEPTION 'this is not " + String(org).replace(/'/g, "''") +
       ", which this file was generated for'; END IF;");
L.push("  SELECT count(*) INTO n FROM " + CAPS + " WHERE " + W + " AND id IN (" + ids + ");");
L.push("  IF n <> " + capIds.length + " THEN");
L.push("    RAISE EXCEPTION 'expected " + capIds.length + " capabilities by id, found %', n; END IF;");
L.push("  SELECT count(*) INTO n FROM " + CAPS + " WHERE " + W + ";");
L.push("  IF n <> " + CAPROWS.length + " THEN");
L.push("    RAISE EXCEPTION 'this client holds % capabilities, not the " + CAPROWS.length +
       " this was generated for', n; END IF;");
/* §544.6: each capability's shape is asserted ROW BY ROW, by id, because
   one holding a different number of pillars than the rehearsal saw would
   put a different number of rows on the company plan. */
CAPROWS.forEach(function (c) {
  L.push("  SELECT jsonb_array_length(coalesce(extra->'items','[]'::jsonb)) INTO n FROM " + CAPS +
         " WHERE " + W + " AND id = " + q(c.id) + ";");
  L.push("  IF n <> " + c.pillars + " THEN RAISE EXCEPTION '" +
         String(c.name).replace(/'/g, "''") + " holds % pillars, not the " + c.pillars +
         " this was generated for', n; END IF;");
});
L.push("  SELECT count(*) INTO n FROM " + TB("cap_key_objectives") + " WHERE " + W + ";");
L.push("  IF n <> 0 THEN RAISE EXCEPTION '% capability objectives would be lost', n; END IF;");
L.push("  SELECT count(*) INTO n FROM " + TB("projects") + " WHERE " + W + ";");
L.push("  IF n <> " + PROJ.length + " THEN RAISE EXCEPTION '% capability projects, not the " +
       PROJ.length + " this was generated for', n; END IF;");
PROJ.forEach(function (c) {
  L.push("  -- " + String(c.name).replace(/-/g, "-") + "'s project, and every row hanging off it");
  L.push("  SELECT count(*) INTO n FROM " + TB("projects") + " WHERE " + W + " AND id = " + q(c.project) +
         " AND cap_id = " + q(c.id) + ";");
  L.push("  IF n <> 1 THEN RAISE EXCEPTION 'the project " + String(c.project).replace(/'/g, "''") +
         " is not there'; END IF;");
  L.push("  SELECT count(*) INTO n FROM " + TB("deliverables") + " WHERE project_id = " + q(c.project) + ";");
  L.push("  IF n <> " + c.deliverables + " THEN RAISE EXCEPTION '% deliverables, not the " +
         c.deliverables + " this was generated for', n; END IF;");
  L.push("  SELECT count(*) INTO n FROM " + TB("milestones") + " WHERE project_id = " + q(c.project) + ";");
  L.push("  IF n <> " + c.milestones + " THEN RAISE EXCEPTION '% milestones, not the " +
         c.milestones + " this was generated for', n; END IF;");
  L.push("  SELECT count(*) INTO n FROM " + TB("outcomes") + " WHERE project_id = " + q(c.project) + ";");
  L.push("  IF n <> 0 THEN RAISE EXCEPTION '% outcomes would be lost', n; END IF;");
  /* and that none of them carries what this file does not translate */
  L.push("  SELECT count(*) INTO n FROM " + TB("milestones") + " WHERE project_id = " + q(c.project));
  L.push("     AND (coalesce(covers,'') <> '' OR coalesce(finish,'') <> '' OR coalesce(status,'') <> ''");
  L.push("          OR pct IS NOT NULL OR coalesce(note,'') <> '');");
  L.push("  IF n <> 0 THEN RAISE EXCEPTION '% milestones carry a date, a state or a note, which this file does not translate', n; END IF;");
  L.push("  SELECT count(*) INTO n FROM " + TB("deliverables") + " WHERE project_id = " + q(c.project));
  L.push("     AND (coalesce(status,'') <> '' OR pct IS NOT NULL OR coalesce(note,'') <> '' OR coalesce(due,'') <> '');");
  L.push("  IF n <> 0 THEN RAISE EXCEPTION '% deliverables carry a state, a date or a note, which this file does not translate', n; END IF;");
});
L.push("  SELECT jsonb_array_length(coalesce(extra->'items','[]'::jsonb)) INTO n FROM " + ORG +
       " WHERE " + WORG + ";");
L.push("  IF n <> " + nBefore + " THEN");
L.push("    RAISE EXCEPTION 'the company plan holds % pillars, not the " + nBefore +
       " this was generated for', n; END IF;");
L.push("END $$;");
L.push("");
L.push("-- 2 · A COPY OF THIS CLIENT'S ROWS IN BOTH TABLES, BEFORE ANYTHING CHANGES.");
L.push("--     Keep them until the pages have been looked at; drop them after.");
L.push("CREATE TABLE " + BK + " AS SELECT * FROM " + ORG + " WHERE " + WORG + ";");
L.push("CREATE TABLE " + BKC + " AS SELECT * FROM " + CAPS + " WHERE " + W + ";");
L.push("");
L.push("-- 3 · THE MOVE. Each new pillar is the row ALREADY IN THE DATABASE, with three");
L.push("--     fields laid over it: the kind, the name where the inner pillar stores none,");
L.push("--     and the owner where it stores none (a capability's seat holds a person's");
L.push("--     key, a pillar's owner their name). No figure is retyped, because none is");
L.push("--     read out and written back.");
/* §544.6 — ONE ROW PER INNER PILLAR, AND ONE FOR A PROJECT. The two kinds
   are built separately and appended in the rehearsal's order: by the
   capability's own `idx`, then by the pillar's place in its list. A project
   sorts where its capability sits, with no pillar before it. */
L.push("UPDATE " + ORG + " o SET extra = jsonb_set(o.extra, '{items}', (o.extra->'items') || (");
L.push("  SELECT coalesce(jsonb_agg(r.np ORDER BY r.ci, r.pi), '[]'::jsonb) FROM (");
L.push("    -- a capability's inner pillars: the rows ALREADY IN THE DATABASE, with");
L.push("    -- three fields laid over each — the kind, the name where the pillar");
L.push("    -- stores none, and the owner where it stores none (a capability's seat");
L.push("    -- holds a person's key, a pillar's owner their name).");
L.push("    SELECT c.idx AS ci, el.ord AS pi,");
L.push("           el.item");
L.push("           || jsonb_build_object('kind', 'Capability')");
L.push("           || jsonb_build_object('name', CASE");
L.push("                WHEN coalesce(el.item->>'name','') <> '' THEN el.item->>'name'");
L.push("                ELSE c.name END)");
L.push("           || jsonb_build_object('owner', CASE");
L.push("                WHEN coalesce(el.item->>'owner','') <> '' THEN el.item->>'owner'");
L.push("                ELSE coalesce((SELECT p.name FROM " + PPL + " p");
L.push("                                WHERE p.key = c.extra->>'head'" +
       (TENANT ? " AND p.tenant_id = c.tenant_id" : "") + "), '') END) AS np");
L.push("      FROM " + CAPS + " c");
L.push("      CROSS JOIN LATERAL jsonb_array_elements(coalesce(c.extra->'items','[]'::jsonb))");
L.push("                         WITH ORDINALITY AS el(item, ord)");
L.push("     WHERE c." + (TENANT ? "tenant_id = o.tenant_id" : "id IS NOT NULL"));
L.push("    UNION ALL");
L.push("    -- §544.7: and a capability that plans in a project becomes ONE pillar");
L.push("    -- under the capability's own name, the project's id kept as the");
L.push("    -- pillar's. Its DELIVERABLES are the key measures (they are targets)");
L.push("    -- and its MILESTONES are the tactics (they are steps); every row keeps");
L.push("    -- its own id. The target is left blank on purpose and no figure is");
L.push("    -- written: the preconditions above have already refused any row that");
L.push("    -- carries a date, a state or a note.");
L.push("    SELECT c.idx AS ci, 0 AS pi,");
L.push("           jsonb_build_object(");
L.push("             'id', pr.id, 'code', '', 'sub', '', 'theme', '',");
L.push("             'kind', 'Capability',");
L.push("             'name', CASE WHEN coalesce(c.name,'') <> '' THEN c.name ELSE pr.name END,");
L.push("             'owner', coalesce(pr.owner, ''),");
L.push("             'measures', coalesce((");
L.push("                SELECT jsonb_agg(jsonb_build_object(");
L.push("                         'id', d.id, 'name', d.name, 'dir', '\u2265',");
L.push("                         'target', '', 'compile', '',");
L.push("                         'actual', NULL, 'progress', NULL) ORDER BY d.idx)");
L.push("                  FROM " + TB("deliverables") + " d WHERE d.project_id = pr.id), '[]'::jsonb),");
L.push("             'tactics', coalesce((");
L.push("                SELECT jsonb_agg(jsonb_build_object(");
L.push("                         'id', m.id, 'name', m.name, 'owner', coalesce(m.owner,''),");
L.push("                         'q1', 0, 'q2', 0, 'q3', 0, 'q4', 0,");
L.push("                         'status', '', 'actual', NULL) ORDER BY m.idx)");
L.push("                  FROM " + TB("milestones") + " m WHERE m.project_id = pr.id), '[]'::jsonb)");
L.push("           ) AS np");
L.push("      FROM " + TB("projects") + " pr");
L.push("      JOIN " + CAPS + " c ON c.id = pr.cap_id");
L.push("     WHERE c." + (TENANT ? "tenant_id = o.tenant_id" : "id IS NOT NULL"));
L.push("  ) r");
L.push(")) WHERE o." + WORG + ";");
L.push("");
L.push("-- 4 · THE COMPANY SHOWS ITS PILLARS APART, so Directions and Capabilities");
L.push("--     read as two tabs. Written defensively: the levels above the key are");
L.push("--     created, because this client stores none of them yet.");
L.push("--");
L.push("--     §544.6: AND THE COMPANY HAS TO BE SHOWING A PLAN AT ALL. On a company");
L.push("--     that never planned anything of its own — this one — the rows would");
L.push("--     otherwise land stored and INVISIBLE: the top layer's plan starts off");
L.push("--     (§428.2) and `pillar` is not among its components until it is ticked.");
L.push("--     Measured in the rehearsal, where the Strategy tab went on reading");
L.push("--     Foundation alone with four capabilities sitting behind it.");
const topOn = run(`SMPRules.levelComponents(GROUP, "top").slice()`);
if (topOn.indexOf("pillar") < 0) topOn.push("pillar");
L.push("UPDATE " + ORG + " SET extra =");
L.push("  jsonb_set(");
L.push("  jsonb_set(");
L.push("  jsonb_set(");
L.push("  jsonb_set(coalesce(extra, '{}'::jsonb),");
L.push("    '{structure}',     coalesce(extra->'structure', '{}'::jsonb), true),");
L.push("    '{structure,top}', coalesce(extra->'structure'->'top', '{}'::jsonb), true),");
L.push("    '{structure,top,plan}',");
L.push("        (coalesce(extra->'structure'->'top'->'plan', '{}'::jsonb) - 'on')");
L.push("        || '{\"split\": true}'::jsonb, true),");
L.push("    '{structure,top,on}', " + q(JSON.stringify(topOn)) + "::jsonb, true)");
L.push("WHERE " + WORG + ";");
if (TOTOP) {
  L.push("");
  L.push("-- 4b · AND WHERE THE CAPABILITIES LIVE, which is the office's own answer and");
  L.push("--      the reason this file was allowed to move records a function held");
  L.push("--      (§544.6). Written so the stored state ends up as the rehearsal left it.");
  L.push("UPDATE " + ORG + " SET extra = jsonb_set(");
  L.push("  jsonb_set(coalesce(extra, '{}'::jsonb), '{structure}',");
  L.push("            coalesce(extra->'structure', '{}'::jsonb), true),");
  L.push("  '{structure,cap}',");
  L.push("  coalesce(extra->'structure'->'cap', '{}'::jsonb)");
  L.push("    || '{\"at\": \"top\", \"exists\": true}'::jsonb, true)");
  L.push("WHERE " + WORG + ";");
}
L.push("");
L.push("-- 5 · THE RECORDS GO, now that every one of their pillars is in the list.");
L.push("DELETE FROM " + CAPS + " WHERE " + W + " AND id IN (" + ids + ");");
L.push("");
L.push("-- 6 · AND IT CHECKS ITS OWN WORK before it is allowed to commit.");
L.push("DO $$");
L.push("DECLARE n int; got text; want text;");
L.push("BEGIN");
L.push("  SELECT jsonb_array_length(extra->'items') INTO n FROM " + ORG + " WHERE " + WORG + ";");
L.push("  IF n <> " + (nBefore + plan.length) + " THEN");
L.push("    RAISE EXCEPTION 'the company plan holds % pillars, expected " + (nBefore + plan.length) + "', n; END IF;");
L.push("  SELECT count(*) INTO n FROM " + CAPS + " WHERE " + W + ";");
L.push("  IF n <> 0 THEN RAISE EXCEPTION '% capability records are still there', n; END IF;");
L.push("  SELECT (extra->'structure'->'top'->'plan'->>'split') INTO got FROM " + ORG + " WHERE " + WORG + ";");
L.push("  IF got IS DISTINCT FROM 'true' THEN");
L.push("    RAISE EXCEPTION 'the company is not set to show its pillars apart (%)', got; END IF;");
L.push("  SELECT string_agg(x.v, ' | ' ORDER BY x.i) INTO got FROM (");
L.push("    SELECT ord AS i, (e->>'id') || '/' || (e->>'name') || '/' || coalesce(e->>'owner','') AS v");
L.push("    FROM " + ORG + " o, jsonb_array_elements(o.extra->'items') WITH ORDINALITY AS t(e, ord)");
L.push("    WHERE o." + WORG + " AND e->>'kind' = 'Capability') x;");
L.push("  want := " + q(plan.map(function (r) { return r.pillarId + "/" + r.name + "/" + (r.owner || ""); }).join(" | ")) + ";");
L.push("  IF got IS DISTINCT FROM want THEN");
L.push("    RAISE EXCEPTION 'the moved rows are not the ones planned. got: % want: %', got, want;");
L.push("  END IF;");
L.push("END $$;");
L.push("");
L.push("COMMIT;");
L.push("");
L.push("-- 7 · READ IT BACK. Run this after the commit; it changes nothing.");
L.push("SELECT ord AS \"#\", e->>'kind' AS \"kind\", e->>'name' AS \"name\",");
L.push("       e->>'owner' AS \"owner\", e->>'id' AS \"row id\",");
L.push("       jsonb_array_length(coalesce(e->'measures','[]'::jsonb)) AS \"measures\",");
L.push("       jsonb_array_length(coalesce(e->'tactics','[]'::jsonb))  AS \"tactics\"");
L.push("  FROM " + ORG + " o, jsonb_array_elements(o.extra->'items') WITH ORDINALITY AS t(e, ord)");
L.push(" WHERE o." + WORG + " ORDER BY ord;");
if (RENAME) {
  L.push("");
  L.push("-- 8 · AND THE CLIENT'S NAME, in the two places it is stored: inside the client,");
  L.push("--     where the chrome and every page read it, and on the register, where the");
  L.push("--     cards read it. Its own transaction, so it can be run on its own, and");
  L.push("--     matched on the client rather than on the old name, so it is right however");
  L.push("--     many times it runs.");
  L.push("BEGIN;");
  L.push("UPDATE " + ORG + " SET org_name = " + q(RENAME) + " WHERE " + WORG + ";");
  L.push("UPDATE " + REG + " SET name = " + q(RENAME) + " WHERE " + REGW + ";");
  L.push("COMMIT;");
  L.push("");
  L.push("SELECT (SELECT org_name FROM " + ORG + " WHERE " + WORG + ") AS \"inside the client\",");
  L.push("       (SELECT name FROM " + REG + " WHERE " + REGW + ")      AS \"on the card\";");
}

L.push("-- TO UNDO IT, before the backups are dropped:");
L.push("--   BEGIN;");
L.push("--   UPDATE " + ORG + " o SET extra = b.extra FROM " + BK + " b WHERE o." + WORG + ";");
L.push("--   INSERT INTO " + CAPS + " SELECT * FROM " + BKC + ";");
L.push("--   COMMIT;");
L.push("-- AND WHEN THE PAGES HAVE BEEN LOOKED AT:");
L.push("--   DROP TABLE " + BK + ", " + BKC + ";");
console.log(L.join("\n"));
