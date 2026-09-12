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
    /* THE MEMORY OUTLIVES THE ENGAGEMENT (spec 045). memory_entries is a
       PLATFORM table holding what Forefront learned on this client, and it is
       `ON DELETE RESTRICT` on purpose: when we stop working with somebody,
       what was learned there is worth more, not less. Counted and NAMED here
       rather than left to surface as a raw foreign-key error — the caller
       needs to know what is in the way, not that something was (§62, §184).
       Retiring a client, which is the ordinary path, is untouched by this. */
    const held = (await c.query(
      "SELECT count(*)::int AS n FROM memory_entries WHERE about_tenant_id = $1", [tenantId])).rows[0].n as number;
    if (held > 0) throw new Error(
      "deleteTenant: " + held + " insight" + (held === 1 ? "" : "s") +
      " in the consulting memory are about this client. The memory outlives the engagement — " +
      "retire the client instead, or remove those insights first.");
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
