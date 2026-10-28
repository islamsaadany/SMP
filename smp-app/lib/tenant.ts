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

/* A FEW TENANTS AT ONCE, NEVER ALL AND NEVER ONE BY ONE (§668). The console
   walked every client in turn — one transaction after another, so a page
   that reads ten clients waited ten times. This runs `fn` over `items` with
   at most `limit` in flight, keeps the answers in the items' order, and
   lets a failure surface exactly as a serial loop would (the caller's own
   try/catch, per item, decides what a failed client reads as). The limit
   stays well under the pool (lib/db.ts, 10), so two console reads running
   together still leave connections for everybody else. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const lane = async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, lane));
  return out;
}

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
