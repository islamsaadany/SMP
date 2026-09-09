/* S2 — isolation (spec 043 §4.3, §5). As smp_app with A set, on EVERY tenant
   table from the catalogue: a SELECT with no WHERE returns A's rows only, an
   INSERT carrying B's tenant_id is refused (42501), a DELETE with no WHERE
   removes A's rows and B's counts are unchanged. No WHERE tenant_id anywhere:
   an application filter is never the guarantee.

     node spike/s2-isolation.mjs
     node spike/s2-isolation.mjs --break=no-policy:tactics   (RED: that table's policy dropped)
     node spike/s2-isolation.mjs --break=owner               (RED: the three verbs run as the owner) */
import { makeDb, seedTwoTenants, tenantTables, check, fail, finish, brk } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";

const db = await makeDb();
try {
  const { A, B, order } = await seedTwoTenants(db.owner);
  /* children before parents: the DELETE verb must not take the next table's
     rows with it through a cascade */
  const tables = order.slice().reverse();
  const noPol = brk("no-policy"), asOwner = brk("owner");
  if (noPol) await db.owner.query("DROP POLICY tenant_rows ON " + noPol);
  /* the break `owner`: the same statements, the same SET LOCAL, on the OWNER pool */
  const run = asOwner
    ? async (tid, fn) => { const c = await db.owner.connect(); try {
        await c.query("BEGIN"); await c.query("SELECT set_config('app.tenant_id', $1, true)", [tid]);
        const out = await fn(c); await c.query("COMMIT"); return out; } catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); } }
    : withTenant;

  const countAs = async (t, tid) => (await db.owner.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [tid])).rows[0].n;
  let bad = 0;
  for (const t of tables) {
    const a0 = await countAs(t, A), b0 = await countAs(t, B);
    /* 1 · read with no WHERE */
    const seen = await run(A, async (c) => (await c.query("SELECT tenant_id::text AS t FROM " + t)).rows.map((r) => r.t));
    const onlyA = seen.length === a0 && seen.every((x) => x === A);
    if (!onlyA) { bad++; fail(t + ": SELECT with no WHERE returned " + seen.length + " rows, of A's " + a0 + " — tenants " + [...new Set(seen)].map((x) => x === A ? "A" : x === B ? "B" : x).join(",")); }
    /* 2 · insert under B, inside A */
    const cols = (await db.owner.query("SELECT * FROM " + t + " WHERE tenant_id = $1 LIMIT 1", [A])).rows[0];
    const ins = await run(A, async (c) => {
      const row = Object.assign({}, cols, { tenant_id: B });
      /* a bigserial `id` must not collide: leave it out so the sequence mints one */
      const ks = Object.keys(cols).filter((k) => !(k === "id" && typeof cols.id === "string" && /^\d+$/.test(cols.id)));
      try { await c.query("INSERT INTO " + t + " (" + ks.join(",") + ") VALUES (" + ks.map((_, i) => "$" + (i + 1)).join(",") + ")", ks.map((k) => row[k])); return "accepted"; }
      catch (e) { return e.code; }
    });
    const b1 = await countAs(t, B);
    if (ins !== "42501" || b1 !== b0) { bad++; fail(t + ": INSERT under B inside A — " + ins + ", B " + b0 + " → " + b1); }
    /* 3 · delete with no WHERE */
    const del = await run(A, async (c) => (await c.query("DELETE FROM " + t)).rowCount);
    const a2 = await countAs(t, A), b2 = await countAs(t, B);
    if (!(del === a0 && a2 === 0 && b2 === b0)) { bad++; fail(t + ": DELETE with no WHERE removed " + del + " (A had " + a0 + "), A now " + a2 + ", B " + b0 + " → " + b2); }
    if (onlyA && ins === "42501" && b1 === b0 && del === a0 && a2 === 0 && b2 === b0) check(true, t + ": read · insert-refused · delete, all inside A");
  }
  check(bad === 0, tables.length + " tenant tables isolated on all three verbs", bad + " tables leaked");
} catch (e) { fail("S2 ran", (e.code || "") + " " + e.message + "\n" + e.stack); }
await db.drop();
finish();
