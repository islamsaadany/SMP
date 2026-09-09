/* S6 — the Prisma wrapper (research §P2). Through tenantClient(A) every kind
   of operation sees A's world and current_setting('app.tenant_id') reads A;
   through the unextended client the same reads null and a tenant table is
   EMPTY — both halves asserted, because the empty world is the safe failure
   and a safe failure that is assumed is a blank page nobody can explain.

     node spike/s6-prisma-wrapper.mjs
     node spike/s6-prisma-wrapper.mjs --break=escape   (RED: one operation routed round the extension) */
import { makeDb, seedTwoTenants, check, fail, finish, brk } from "./_harness.mjs";

const db = await makeDb();
try {
  const { A, B } = await seedTwoTenants(db.owner);
  const { tenantClient, platformPrisma, resetPrisma } = await import("../lib/prisma.ts");
  resetPrisma();
  const t = tenantClient(A);
  const escape = brk("escape");

  /* 1 · findMany with no where */
  const units = await t.units.findMany();
  check(units.length === 1 && units[0].tenant_id === A, "findMany on units returns A's row only", units.length + " rows: " + [...new Set(units.map((u) => u.tenant_id === A ? "A" : "B"))]);
  /* 2 · the setting, read from INSIDE a wrapped raw query */
  const set = await t.$queryRaw`SELECT current_setting('app.tenant_id', true) AS v`;
  check(set[0].v === A, "$queryRaw inside the extension reads app.tenant_id = A", set[0].v);
  /* 3 · create lands under A (tenant_id supplied by the caller as today's rows are) */
  await t.labels.create({ data: { tenant_id: A, key: "s6", idx: 9, internal: "s6" } });
  const owned = (await db.owner.query("SELECT tenant_id::text AS t FROM labels WHERE key = 's6'")).rows.map((r) => r.t);
  check(owned.length === 1 && owned[0] === A, "create on labels lands under A", owned.join(","));
  /* 4 · create under B from inside A is refused by the policy */
  let refused;
  try { await t.labels.create({ data: { tenant_id: B, key: "s6b", idx: 10, internal: "x" } }); refused = "accepted"; }
  catch (e) { refused = /42501|row-level security/.test(String(e.message)) ? "refused" : "error: " + e.message.slice(0, 80); }
  check(refused === "refused", "create under B from inside A is refused by the policy", refused);
  /* 5 · update — or, under the break, the same update routed round the extension */
  const upd = escape
    ? await platformPrisma.client.labels.updateMany({ where: { key: "s6" }, data: { internal: "s6-updated" } })
    : await t.labels.updateMany({ where: { key: "s6" }, data: { internal: "s6-updated" } });
  const after = (await db.owner.query("SELECT internal FROM labels WHERE key = 's6' AND tenant_id = $1", [A])).rows[0];
  check(upd.count === 1 && after && after.internal === "s6-updated", "updateMany writes A's row (count 1, value read back as the owner)", "count " + upd.count + ", value " + (after && after.internal));
  /* 6 · delete */
  const del = await t.labels.deleteMany({ where: { key: "s6" } });
  check(del.count === 1, "deleteMany removes A's row", del.count);
  /* 7 · two operations issued together — each is its own transaction and both
     see A; a batch $transaction([...]) on the extended client is NOT the
     contract (it would nest), and that is said in lib/prisma.ts */
  const [u2, p2] = await Promise.all([t.units.findMany(), t.people.findMany()]);
  check(u2.length === 1 && p2.length === 1 && u2[0].tenant_id === A && p2[0].tenant_id === A, "two operations at once — both see A", u2.length + "/" + p2.length);
  /* 7b · $executeRaw goes through the wrapper too */
  const n = await t.$executeRaw`UPDATE units SET name = name`;
  check(n === 1, "$executeRaw inside the extension touches A's one row", n);
  /* 8 · the UNEXTENDED client: null setting, empty world — the safe failure, asserted */
  const raw = platformPrisma.client;
  const nul = await raw.$queryRaw`SELECT current_setting('app.tenant_id', true) AS v`;
  check(nul[0].v === null || nul[0].v === "", "the unextended client reads no setting", JSON.stringify(nul[0].v));
  const none = await raw.units.findMany();
  check(none.length === 0, "the unextended client sees an EMPTY units table", none.length + " rows");
  /* 9 · B's rows untouched throughout */
  const bLabels = (await db.owner.query("SELECT count(*)::int AS n FROM labels WHERE tenant_id = $1", [B])).rows[0].n;
  check(bLabels === 1, "B's labels untouched", bLabels);
  await raw.$disconnect();
} catch (e) { fail("S6 ran", (e.code || "") + " " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 4).join("\n")); }
await db.drop();
finish();
