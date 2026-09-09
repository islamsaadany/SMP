import { readFileSync } from "node:fs";
import { makeDb, seedTwoTenants, tenantTables } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";
import { readState, loadGraph } from "../lib/state-io.ts";
const db = await makeDb();
const { A } = await seedTwoTenants(db.owner);
const ts = await tenantTables(db.owner);
for (const t of ts.slice().reverse()) await db.owner.query("DELETE FROM " + t + " WHERE tenant_id = $1", [A]);
const seed = JSON.parse(readFileSync(new URL("../../db/seed-state.json", import.meta.url), "utf8"));
await withTenant(A, (c) => loadGraph(c, seed));
const back = await withTenant(A, (c) => readState(c));
const diffs = [];
function walk(a, b, p) {
  if (diffs.length > 12) return;
  if (a === b) return;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of ks) walk(a[k], b[k], p + "." + k);
  } else diffs.push(p + ": seed=" + JSON.stringify(a) + " back=" + JSON.stringify(b));
}
walk(seed, back, "$");
console.log(diffs.join("\n"));
await db.drop();
