/* The one way tenant data is reached (spec 043 §4.3, contracts/tenant-request.md §1).

     withTenant(tenantId, async (c) => { … })

   BEGIN · SET LOCAL app.tenant_id · fn · COMMIT, on the app pool as smp_app.
   The setting is transaction-local (set_config(…, true)) so it dies with the
   COMMIT — a transaction pins one backend under a transaction pooler as well
   (§289), and there is NO `SET` outside a transaction anywhere in this file
   (S3 proves the difference). With no setting the policy compares against
   null and every tenant table is empty to the caller: a request that forgot
   to name its tenant reads nothing rather than everybody's. */
import type { PoolClient } from "pg";
import { appPool } from "./db.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function withTenant<T>(tenantId: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  if (!UUID.test(String(tenantId))) throw new Error("withTenant: not a tenant id");
  const c = await appPool().connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
