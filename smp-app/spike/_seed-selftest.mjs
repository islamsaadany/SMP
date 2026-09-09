import { makeDb, seedTwoTenants, tenantTables, finish, check } from "./_harness.mjs";
const db = await makeDb();
const { A, B } = await seedTwoTenants(db.owner);
const ts = await tenantTables(db.owner);
let empty = 0;
for (const t of ts) { const n = (await db.owner.query("SELECT count(*)::int AS n FROM " + t)).rows[0].n; if (n < 2) empty++; }
check(empty === 0, ts.length + " tenant tables each hold a row for A and B", empty + " short");
await db.drop(); finish();
