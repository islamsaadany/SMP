/* S9 — the row-addressed save (§314.2, research §P3, contracts/spike.md).

   Tenant A holds the worked example. Every change list is made by the
   differ's OWN graphChanges() from a modified copy, exactly as the browser
   makes it, and posted through the real save() (lock · read · apply ·
   authorise · write · log). After each: the named rows hold the new value,
   and EVERY OTHER ROW in every tenant table carries the xmin it had before
   the save — read as the owner, so nothing the policy hides is missed.

     node spike/s9-row-write.mjs
     node spike/s9-row-write.mjs --break=full-write        (RED: the save clears and re-inserts the graph — the reported fault)
     node spike/s9-row-write.mjs --break=silent-fallback   (RED: an unaddressable shape rewritten whole instead of refused) */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { makeDb, seedTwoTenants, tenantTables, check, fail, finish, brk } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";
import { readState, loadGraph, tableRows, writeChanges, UnaddressableChange } from "../lib/state-io.ts";
import { save } from "../lib/save.ts";

const D = createRequire(import.meta.url)("../lib/graph-diff.cjs");
const fullWrite = brk("full-write"), silentFallback = brk("silent-fallback");

const db = await makeDb();
try {
  const { A, B } = await seedTwoTenants(db.owner);
  const ts = await tenantTables(db.owner);
  for (const t of ts.slice().reverse()) await db.owner.query("DELETE FROM " + t + " WHERE tenant_id = $1", [A]);
  const seed = JSON.parse(readFileSync(new URL("../../db/seed-state.json", import.meta.url), "utf8"));
  await withTenant(A, (c) => loadGraph(c, seed));
  const smo = { key: "smo", name: "Mohamed Essam", role: "super", email: "smo@a.co" };

  /* the whole-graph clear-and-reinsert — what a build that kept the old writer would do */
  const clearAndReinsert = async (c, incoming) => {
    for (const t of tableRows(incoming).slice().reverse()) await c.query("DELETE FROM " + t.table);
    for (const t of ts) if (!tableRows(incoming).some((x) => x.table === t)) { /* outside the graph: untouched */ }
    const G = createRequire(import.meta.url)("../lib/graph-io.cjs");
    for (const t of G.tableRows(incoming)) await G.insertMany(c, t.table, t.cols, t.rows);
    return { rows: -1, tables: ["*"] };
  };
  /* one save through the product's path, or the break's */
  const post = async (changes) => {
    if (!fullWrite && !silentFallback) return save(A, smo, { changes });
    return withTenant(A, async (c) => {
      const stored = await readState(c);
      const applied = D.applyChanges(JSON.parse(JSON.stringify(stored)), changes);
      if (!applied.ok) return { code: 400, body: { ok: false, error: applied.error } };
      if (fullWrite) { await clearAndReinsert(c, applied.state); return { code: 200, body: { ok: true, wrote: "full" } }; }
      try { const r = await writeChanges(c, stored, applied.state); return { code: 200, body: { ok: true, wrote: "rows", rows: r.rows, tables: r.tables } }; }
      catch (e) {
        if (!(e instanceof UnaddressableChange)) throw e;
        /* the break: drop what cannot be addressed and rewrite the rest whole — silently */
        const g = applied.state;
        for (const u of Object.values(g.units)) for (const p of u.items || []) p.measures = (p.measures || []).filter((m) => m.id);
        await clearAndReinsert(c, g); return { code: 200, body: { ok: true, wrote: "full-fallback" } };
      }
    });
  };
  const xmin = async () => {
    const m = {};
    for (const t of ts) for (const r of (await db.owner.query("SELECT xmin::text AS x, ctid::text AS c FROM " + t + " WHERE tenant_id = $1", [A])).rows) m[t + ":" + r.c] = r.x;
    return m;
  };
  const bBefore = {};
  for (const t of ts) bBefore[t] = (await db.owner.query("SELECT xmin::text AS x FROM " + t + " WHERE tenant_id = $1 ORDER BY xmin::text", [B])).rows.map((r) => r.x).join(",");
  /* a row counts as rewritten when its xmin changed OR its ctid is gone — a
     clear-and-reinsert gives every row a NEW ctid, which a "changed xmin"
     test alone walks straight past (the first draft did, §94.5) */
  const movedRows = (x0, x1) => Object.keys(x0).filter((k) => x1[k] === undefined || x1[k] !== x0[k]);
  const changed = (stored, edit) => { const m = JSON.parse(JSON.stringify(stored)); edit(m); return { m, changes: D.graphChanges(stored, m) }; };

  /* 1 · one field — one row */
  let stored = await withTenant(A, (c) => readState(c));
  let x0 = await xmin();
  let e = changed(stored, (m) => { m.units.mobile.items[0].measures[0].target = "999"; });
  let r = await post(e.changes);
  const row = (await db.owner.query("SELECT target FROM measures WHERE tenant_id = $1 AND id = $2", [A, stored.units.mobile.items[0].measures[0].id])).rows[0];
  check(r.code === 200 && row && row.target === "999", "a one-field change list is accepted and the row holds the value", JSON.stringify(r.body).slice(0, 120) + " / " + JSON.stringify(row));
  let x1 = await xmin(); let mv = movedRows(x0, x1);
  /* an UPDATE gives its own row a new xmin (and a new ctid), so exactly ONE
     row moves: the measure named. Anything else moving is the fault. */
  check(mv.length === 1 && mv[0].startsWith("measures:"), "every OTHER row's xmin is what it was (" + Object.keys(x0).length + " rows swept; one measures row rewritten)", mv.length + " rows rewritten, e.g. " + mv.slice(0, 3).join(" "));
  check(r.body.wrote === "rows" && r.body.rows === 1, "the save reports it wrote 1 row", JSON.stringify(r.body).slice(0, 100));
  const logged = (await db.owner.query("SELECT count(*)::int AS n FROM change_log WHERE tenant_id = $1", [A])).rows[0].n;
  check(logged >= 1, "change_log carries the save (§42)", logged);

  /* 2 · a row added — one INSERT */
  stored = await withTenant(A, (c) => readState(c)); x0 = await xmin();
  e = changed(stored, (m) => { m.units.mobile.items[0].tactics.push({ id: "mobile-P1-T99", name: "S9 tactic", q1: true, q2: false, q3: false, q4: false }); });
  r = await post(e.changes); x1 = await xmin(); mv = movedRows(x0, x1);
  const added = (await db.owner.query("SELECT count(*)::int AS n FROM tactics WHERE tenant_id = $1 AND id = 'mobile-P1-T99'", [A])).rows[0].n;
  check(r.code === 200 && added === 1 && mv.length === 0, "adding a tactic writes one row and rewrites none", "code " + r.code + ", added " + added + ", rewritten " + mv.length);

  /* 3 · a row removed — one DELETE */
  stored = await withTenant(A, (c) => readState(c)); x0 = await xmin();
  e = changed(stored, (m) => { m.units.mobile.items[0].tactics = m.units.mobile.items[0].tactics.filter((t) => t.id !== "mobile-P1-T99"); });
  r = await post(e.changes); x1 = await xmin(); mv = movedRows(x0, x1);
  const gone = (await db.owner.query("SELECT count(*)::int AS n FROM tactics WHERE tenant_id = $1 AND id = 'mobile-P1-T99'", [A])).rows[0].n;
  check(r.code === 200 && gone === 0 && mv.length === 1 && mv[0].startsWith("tactics:"), "removing it deletes one row and rewrites none", "code " + r.code + ", left " + gone + ", rewritten " + mv.length + ": " + mv.slice(0, 3).join(" "));

  /* 4 · a reorder — idx on the rows that moved, nothing else */
  stored = await withTenant(A, (c) => readState(c)); x0 = await xmin();
  e = changed(stored, (m) => { const it = m.units.mobile.items; [it[0], it[1]] = [it[1], it[0]]; });
  r = await post(e.changes); x1 = await xmin(); mv = movedRows(x0, x1);
  const onlyPillars = mv.every((k) => k.startsWith("pillars:"));
  check(r.code === 200 && mv.length === 2 && onlyPillars, "swapping two pillars rewrites exactly those two pillar rows", "code " + r.code + ", rewritten " + mv.length + ": " + mv.slice(0, 4).join(" "));

  /* 5 · a shape the writer cannot address — a measure with no id (§191) */
  stored = await withTenant(A, (c) => readState(c)); x0 = await xmin();
  const bad = JSON.parse(JSON.stringify(stored.units.mobile));
  bad.items[0].measures.push({ name: "no id here", target: "1" });
  r = await post({ set: { "units.mobile": bad }, del: [], rows: [] });
  x1 = await xmin(); mv = movedRows(x0, x1);
  const stray = (await db.owner.query("SELECT count(*)::int AS n FROM measures WHERE tenant_id = $1 AND name = 'no id here'", [A])).rows[0].n;
  check(r.code === 400 && /measures/.test(r.body.error || "") && stray === 0 && mv.length === 0,
    "a row with no id is refused (400 naming measures) and nothing is written", "code " + r.code + " " + JSON.stringify(r.body).slice(0, 120) + ", stray " + stray + ", rewritten " + mv.length);

  /* 6 · a settings change (§241's fallback shape today) — one row */
  stored = await withTenant(A, (c) => readState(c)); x0 = await xmin();
  e = changed(stored, (m) => { m.group.horizon = "2027-2029"; });
  r = await post(e.changes); x1 = await xmin(); mv = movedRows(x0, x1);
  const org = (await db.owner.query("SELECT horizon FROM org WHERE tenant_id = $1", [A])).rows[0];
  check(r.code === 200 && org && org.horizon === "2027-2029" && mv.length === 1 && mv[0].startsWith("org:"), "a group setting is one UPDATE on org and nothing else", "code " + r.code + ", " + JSON.stringify(org) + ", rewritten " + mv.length + ": " + mv.slice(0, 3).join(" "));

  /* 7 · the register (another of §241's fallback shapes) — one row */
  stored = await withTenant(A, (c) => readState(c)); x0 = await xmin();
  e = changed(stored, (m) => { m.people[3].title = "S9 title"; });
  r = await post(e.changes); x1 = await xmin(); mv = movedRows(x0, x1);
  check(r.code === 200 && mv.length === 1 && mv[0].startsWith("people:"), "a register edit rewrites that one people row and no other", "code " + r.code + ", rewritten " + mv.length + ": " + mv.slice(0, 3).join(" "));

  /* 8 · a whole-graph body is refused */
  r = await save(A, smo, { state: stored });
  check(r.code === 400, "a whole-graph body is a 400", r.code);

  /* 9 · B untouched throughout */
  let bMoved = 0;
  for (const t of ts) { const now = (await db.owner.query("SELECT xmin::text AS x FROM " + t + " WHERE tenant_id = $1 ORDER BY xmin::text", [B])).rows.map((r) => r.x).join(","); if (now !== bBefore[t]) bMoved++; }
  check(bMoved === 0, "B's rows untouched in every table", bMoved + " tables moved");

  /* 10 · the writer's own text: no clear anywhere */
  const src = readFileSync(new URL("../lib/state-io.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  check(!/TRUNCATE/.test(src) && !/DELETE FROM [a-z_]+"?\s*(;|$|\+ *"\s*$)/m.test(src) && /DELETE FROM " \+ t \+ where/.test(src),
    "lib/state-io.ts holds no TRUNCATE and no DELETE without a key", "");
} catch (e) { fail("S9 ran", (e.code || "") + " " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 5).join("\n")); }
await db.drop();
finish();
