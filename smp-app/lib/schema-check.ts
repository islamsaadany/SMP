/* S5 — the schema check (data-model.md), read from the catalogue at every
   deploy and in the spike, so a table added next month without tenant_id, the
   policy or FORCE is named the day it is added. Never a literal list of tables.

   1. every public table not on the platform list has tenant_id uuid NOT NULL
      referencing tenants (id) ON DELETE CASCADE;
   2. relrowsecurity AND relforcerowsecurity, and exactly one policy named
      tenant_rows covering ALL commands;
   3. smp_app owns no table and has NOBYPASSRLS;
   4. every FK between two tenant tables carries tenant_id on both sides. */
import type { Pool, PoolClient } from "pg";

export const PLATFORM_TABLES = ["tenants", "users", "tenant_users", "sessions", "login_attempts",
  "platform_access", "tenant_log", "push_keys", "_migrations"];

export type SchemaReport = { ok: boolean; problems: string[]; tenantTables: string[] };

export async function schemaCheck(c: Pool | PoolClient): Promise<SchemaReport> {
  const problems: string[] = [];
  const tables = (await c.query(
    "SELECT c.oid, c.relname AS t, c.relrowsecurity AS rls, c.relforcerowsecurity AS force " +
    "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
    "WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT (c.relname = ANY($1)) ORDER BY c.relname",
    [PLATFORM_TABLES])).rows as { oid: number; t: string; rls: boolean; force: boolean }[];
  const tenantTables = tables.map((x) => x.t);
  const tenantsOid = (await c.query("SELECT oid FROM pg_class WHERE relname = 'tenants' AND relnamespace = 'public'::regnamespace")).rows[0]?.oid;

  for (const tb of tables) {
    /* 1 · tenant_id uuid NOT NULL → tenants ON DELETE CASCADE */
    const col = (await c.query(
      "SELECT a.attnotnull AS notnull, t.typname AS type FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid " +
      "WHERE a.attrelid = $1 AND a.attname = 'tenant_id' AND NOT a.attisdropped", [tb.oid])).rows[0];
    if (!col) { problems.push(tb.t + ": no tenant_id column (rule 1)"); continue; }
    if (col.type !== "uuid" || !col.notnull) problems.push(tb.t + ": tenant_id is " + col.type + (col.notnull ? "" : " NULL-able") + " (rule 1)");
    const fk = (await c.query(
      "SELECT confdeltype FROM pg_constraint WHERE conrelid = $1 AND contype = 'f' AND confrelid = $2 " +
      "AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = $1 AND attname = 'tenant_id')]",
      [tb.oid, tenantsOid])).rows[0];
    if (!fk) problems.push(tb.t + ": tenant_id has no FK to tenants (rule 1)");
    else if (fk.confdeltype !== "c") problems.push(tb.t + ": FK to tenants is not ON DELETE CASCADE (rule 1)");
    /* 2 · ENABLE, FORCE, one policy tenant_rows FOR ALL */
    if (!tb.rls) problems.push(tb.t + ": row level security not enabled (rule 2)");
    if (!tb.force) problems.push(tb.t + ": row level security not FORCED (rule 2)");
    const pols = (await c.query("SELECT polname, polcmd FROM pg_policy WHERE polrelid = $1", [tb.oid])).rows as { polname: string; polcmd: string }[];
    const mine = pols.filter((p) => p.polname === "tenant_rows");
    if (mine.length !== 1) problems.push(tb.t + ": " + mine.length + " policies named tenant_rows (rule 2)");
    else if (mine[0].polcmd !== "*") problems.push(tb.t + ": tenant_rows does not cover ALL commands (rule 2)");
    if (pols.length !== mine.length) problems.push(tb.t + ": extra policies " + pols.filter((p) => p.polname !== "tenant_rows").map((p) => p.polname).join(",") + " (rule 2)");
    /* 4 · FKs between tenant tables carry tenant_id on both sides */
    const fks = (await c.query(
      "SELECT f.conname, f.confrelid, " +
      " (SELECT array_agg(attname::text ORDER BY k.ord) FROM unnest(f.conkey) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a ON a.attrelid = f.conrelid AND a.attnum = k.attnum) AS cols, " +
      " (SELECT array_agg(attname::text ORDER BY k.ord) FROM unnest(f.confkey) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a ON a.attrelid = f.confrelid AND a.attnum = k.attnum) AS refcols " +
      "FROM pg_constraint f WHERE f.conrelid = $1 AND f.contype = 'f' AND f.confrelid <> $2", [tb.oid, tenantsOid])).rows as
      { conname: string; confrelid: number; cols: string[]; refcols: string[] }[];
    for (const f of fks) {
      if (!tables.some((x) => x.oid === f.confrelid)) continue;   /* → a platform table: not this rule */
      if (!f.cols.includes("tenant_id") || !f.refcols.includes("tenant_id"))
        problems.push(tb.t + ": FK " + f.conname + " does not carry tenant_id on both sides (rule 4)");
    }
  }
  /* 3 · the role */
  const role = (await c.query("SELECT rolbypassrls FROM pg_roles WHERE rolname = 'smp_app'")).rows[0];
  if (!role) problems.push("smp_app: role does not exist (rule 3)");
  else if (role.rolbypassrls) problems.push("smp_app: has BYPASSRLS (rule 3)");
  const owned = (await c.query("SELECT tablename FROM pg_tables WHERE tableowner = 'smp_app'")).rows;
  for (const o of owned) problems.push("smp_app: owns " + o.tablename + " (rule 3)");
  return { ok: problems.length === 0, problems, tenantTables };
}
