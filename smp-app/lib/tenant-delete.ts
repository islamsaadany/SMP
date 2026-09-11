/* Deleting a tenant (spec 043 §4.6): export first (§304's workbooks — the
   caller's step, not this file's), then ONE statement that cascades through
   every tenant-owned table, then a COUNT from the catalogue asserting zero.
   Runs as the OWNER — the only role that reaches `tenants` for writing — in
   one transaction, so a table that did not cascade rolls the whole thing
   back rather than leaving a tenant half gone. */
import type { Pool } from "pg";
import { schemaCheck } from "./schema-check.ts";

export async function deleteTenant(owner: Pool, tenantId: string): Promise<{ counts: Record<string, number> }> {
  const c = await owner.connect();
  try {
    await c.query("BEGIN");
    const { tenantTables } = await schemaCheck(c);
    const del = await c.query("DELETE FROM tenants WHERE id = $1", [tenantId]);
    if (del.rowCount !== 1) throw new Error("deleteTenant: no such tenant " + tenantId);
    const counts: Record<string, number> = {};
    for (const t of tenantTables) {
      const n = (await c.query("SELECT count(*)::int AS n FROM " + t + " WHERE tenant_id = $1", [tenantId])).rows[0].n as number;
      counts[t] = n;
      if (n !== 0) throw new Error("deleteTenant: " + n + " rows of " + t + " survived for " + tenantId);
    }
    await c.query("COMMIT");
    return { counts };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
