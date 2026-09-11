/* S3 — the pooler (§289, §313.34; spec 043 §4.3).

   A bare SET on a pooled connection lands on one backend and the next
   statement may run on another; SET LOCAL inside BEGIN … COMMIT pins one
   backend for the life of the transaction. Modelled as test-cold-starts.js
   models it, against a scratch table under the real policy.

     node spike/s3-pooler.mjs
     node spike/s3-pooler.mjs --break=bare-set   (RED: withTenant made with SET outside a transaction) */
import { makeDb, poolerModel, check, fail, finish, brk } from "./_harness.mjs";
import { withTenant } from "../lib/tenant.ts";

const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";
const T = "_spike_rls";
const db = await makeDb();
try {
  await db.owner.query("CREATE TABLE " + T + " (tenant_id uuid NOT NULL, v text NOT NULL)");
  await db.owner.query("ALTER TABLE " + T + " ENABLE ROW LEVEL SECURITY; ALTER TABLE " + T + " FORCE ROW LEVEL SECURITY");
  await db.owner.query("CREATE POLICY tenant_rows ON " + T + " FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)");
  await db.owner.query("GRANT SELECT, INSERT, UPDATE, DELETE ON " + T + " TO smp_app");
  await db.owner.query("INSERT INTO " + T + " VALUES ($1, 'a'), ($2, 'b')", [A, B]);

  /* 1 · a bare SET through the pooler model reads nothing on the next statement */
  const c1 = poolerModel(db.appUrl);
  await c1.query("SET app.tenant_id = '" + A + "'");
  const n1 = (await c1.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n;
  await c1.release();
  check(n1 === 0, "pooler model: a bare SET does not survive to the next statement (reads 0)", n1);

  /* 2 · withTenant on the direct pool reads A */
  const bare = brk("bare-set");
  const n2 = bare
    ? await (async () => { const c = poolerModel(db.appUrl); try {
        await c.query("SET app.tenant_id = '" + A + "'");   /* the break: no transaction, through the pooler */
        return (await c.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n;
      } finally { await c.release(); } })()
    : await withTenant(A, async (c) => (await c.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n);
  check(n2 === 1, "withTenant(A) on the direct connection reads A's row", n2);

  /* 3 · SET LOCAL inside BEGIN … COMMIT holds even through the pooler model */
  const c3 = poolerModel(db.appUrl);
  await c3.query("BEGIN");
  await c3.query("SELECT set_config('app.tenant_id', $1, true)", [A]);
  const n3 = (await c3.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n;
  await c3.query("COMMIT");
  const n3b = (await c3.query("SELECT count(*)::int AS n FROM " + T)).rows[0].n;
  await c3.release();
  check(n3 === 1, "pooler model: SET LOCAL inside a transaction reads A's row (the transaction pins a backend)", n3);
  check(n3b === 0, "…and after COMMIT the setting is gone (reads 0)", n3b);

  /* 4 · nothing in lib/tenant.ts says SET outside a transaction */
  const src = (await import("node:fs")).readFileSync(new URL("../lib/tenant.ts", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  check(!/\bSET\s+app\./.test(src) && /set_config\('app\.tenant_id', \$1, true\)/.test(src),
    "lib/tenant.ts sets the tenant only as a transaction-local setting", "a bare SET is in the file");
} catch (e) { fail("S3 ran", (e.code || "") + " " + e.message); }
await db.drop();
finish();
