/* S4 — deletion (spec 043 §4.6). After DELETE FROM tenants WHERE id = A,
   every table the catalogue says carries tenant_id holds 0 rows for A, and
   B's per-table counts equal their values before.

     node spike/s4-delete.mjs
     node spike/s4-delete.mjs --break=no-cascade:measures   (RED: that FK made RESTRICT — the delete is refused and nothing moves) */
import { makeDb, seedTwoTenants, tenantTables, check, fail, finish, brk } from "./_harness.mjs";
import { deleteTenant } from "../lib/tenant-delete.ts";

const db = await makeDb();
try {
  const { A, B } = await seedTwoTenants(db.owner);
  const tables = await tenantTables(db.owner);
  const nc = brk("no-cascade");
  if (nc) {
    const con = (await db.owner.query(
      "SELECT conname FROM pg_constraint WHERE conrelid = $1::regclass AND contype = 'f' AND confrelid = 'tenants'::regclass", [nc])).rows[0].conname;
    await db.owner.query("ALTER TABLE " + nc + " DROP CONSTRAINT " + con + ", ADD CONSTRAINT " + con + " FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT");
  }
  const before = {};
  for (const t of tables) before[t] = (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [B])).rows[0].n;
  let outcome;
  try { outcome = await deleteTenant(db.owner, A); } catch (e) { outcome = { error: (e.code || "") + " " + e.message }; }
  check(!outcome.error, "DELETE FROM tenants WHERE id = A ran", outcome.error);
  let survivors = 0, moved = 0;
  for (const t of tables) {
    const a = (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [A])).rows[0].n;
    const b = (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [B])).rows[0].n;
    if (a !== 0) { survivors++; fail(t + ": " + a + " rows of A survived"); }
    if (b !== before[t]) { moved++; fail(t + ": B " + before[t] + " → " + b); }
  }
  check(survivors === 0, "0 rows for A in every one of " + tables.length + " tenant tables", survivors + " tables kept rows");
  check(moved === 0, "B's counts unchanged in every table", moved + " tables moved");
  const gone = (await db.owner.query("SELECT count(*)::int AS n FROM tenants WHERE id = $1", [A])).rows[0].n;
  check(gone === 0, "the tenants row is gone", gone);
} catch (e) { fail("S4 ran", (e.code || "") + " " + e.message); }
await db.drop();
finish();
