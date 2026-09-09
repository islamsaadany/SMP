/* The fixed point the save rests on: the worked example loaded into A,
   read back byte-identical (canonical JSON), then one field changed and
   written — one row updated, nothing else's xmin moved. */
import { readFileSync } from "node:fs";
import { makeDb, seedTwoTenants, tenantTables, check, fail, finish } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";
import { readState, loadGraph, writeChanges } from "../lib/state-io.ts";

/* scripts/test-roundtrip.js's own normalisation: key order ignored, a null
   and an absent key the same word (mergeRow omits null columns) */
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) { if (v[k] !== null && v[k] !== undefined) out[k] = normalize(v[k]); }
    return out;
  }
  return v;
}
const canon = (v) => JSON.stringify(normalize(v));

const db = await makeDb();
try {
  const { A, B } = await seedTwoTenants(db.owner);
  const ts = await tenantTables(db.owner);
  for (const t of ts.slice().reverse()) await db.owner.query("DELETE FROM " + t + " WHERE tenant_id = $1", [A]);
  const seed = JSON.parse(readFileSync(new URL("../../db/seed-state.json", import.meta.url), "utf8"));
  await withTenant(A, (c) => loadGraph(c, seed));
  const back = await withTenant(A, (c) => readState(c));
  check(canon(back) === canon(seed), "loadGraph then readState is a fixed point on the worked example",
    "differs (" + canon(back).length + " vs " + canon(seed).length + ")");

  const xmin = async () => {
    const m = {};
    for (const t of ts) for (const r of (await db.owner.query("SELECT xmin::text AS x, ctid::text AS c FROM " + t + " WHERE tenant_id = $1", [A])).rows) m[t + ":" + r.c] = r.x;
    return m;
  };
  const x0 = await xmin();
  const next = JSON.parse(JSON.stringify(back));
  next.units.mobile.items[0].measures[0].target = "999";
  const rep = await withTenant(A, (c) => writeChanges(c, back, next));
  check(rep.rows === 1 && rep.updated === 1 && rep.tables.join() === "measures", "one field changed - one UPDATE on measures", JSON.stringify(rep));
  const x1 = await xmin();
  const moved = Object.keys(x0).filter((k) => x1[k] !== undefined && x1[k] !== x0[k]);
  check(moved.length === 0, "no other row's xmin moved", moved.slice(0, 5).join(" "));
  const again = await withTenant(A, (c) => readState(c));
  check(again.units.mobile.items[0].measures[0].target === "999" && canon(again) === canon(next), "read back equals the incoming graph", "");
  const bCount = (await db.owner.query("SELECT count(*)::int AS n FROM measures WHERE tenant_id = $1", [B])).rows[0].n;
  check(bCount === 1, "B untouched", bCount);
} catch (e) { fail("ran", (e.code || "") + " " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 5).join("\n")); }
await db.drop();
finish();
