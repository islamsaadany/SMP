/* S5 — the schema check, written BEFORE the tenant tables so the schema phase
   can fail it one table at a time (plan.md delivery order).

     node spike/s5-schema-check.mjs
     node spike/s5-schema-check.mjs --break=add-table          (RED naming `stray`)
     node spike/s5-schema-check.mjs --break=no-force:<table>   (RED naming the table)
     node spike/s5-schema-check.mjs --break=bare-fk            (RED: an FK without the tenant, rule 4) */
import { makeDb, check, fail, finish, brk } from "./_harness.mjs";
import { schemaCheck } from "../lib/schema-check.ts";

const db = await makeDb();
try {
  if (brk("add-table")) await db.owner.query("CREATE TABLE stray (id int PRIMARY KEY, name text)");
  const nf = brk("no-force");
  if (nf) await db.owner.query('ALTER TABLE "' + nf + '" NO FORCE ROW LEVEL SECURITY');
  /* --break=bare-fk: deliverables → projects by bare id, the FK a rewrite
     that forgot the tenant would write. (array_agg(name) came back as a
     STRING once, and "…".includes("tenant_id") is true of a string — rule 4
     passed on a build it should have failed; this break is why it is cast.) */
  if (brk("bare-fk")) {
    await db.owner.query("CREATE UNIQUE INDEX projects_bare_id ON projects (id)");
    await db.owner.query("ALTER TABLE deliverables DROP CONSTRAINT deliverables_project_id_fkey");
    await db.owner.query("ALTER TABLE deliverables ADD CONSTRAINT deliverables_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE");
  }
  const r = await schemaCheck(db.owner);
  console.log("info  " + r.tenantTables.length + " tenant-owned tables in the catalogue");
  for (const p of r.problems) fail(p);
  check(r.ok, r.tenantTables.length + " tenant tables pass the four rules", r.problems.length + " problems");
} catch (e) { fail("the check ran", (e.code || "") + " " + e.message); }
await db.drop();
finish();
