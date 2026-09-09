/* S5 — the schema check, written BEFORE the tenant tables so the schema phase
   can fail it one table at a time (plan.md delivery order).

     node spike/s5-schema-check.mjs
     node spike/s5-schema-check.mjs --break=add-table          (RED naming `stray`)
     node spike/s5-schema-check.mjs --break=no-force:<table>   (RED naming the table) */
import { makeDb, check, fail, finish, brk } from "./_harness.mjs";
import { schemaCheck } from "../lib/schema-check.ts";

const db = await makeDb();
try {
  if (brk("add-table")) await db.owner.query("CREATE TABLE stray (id int PRIMARY KEY, name text)");
  const nf = brk("no-force");
  if (nf) await db.owner.query('ALTER TABLE "' + nf + '" NO FORCE ROW LEVEL SECURITY');
  const r = await schemaCheck(db.owner);
  console.log("info  " + r.tenantTables.length + " tenant-owned tables in the catalogue");
  for (const p of r.problems) fail(p);
  check(r.ok, r.tenantTables.length + " tenant tables pass the four rules", r.problems.length + " problems");
} catch (e) { fail("the check ran", (e.code || "") + " " + e.message); }
await db.drop();
finish();
