/* The stored graph, per tenant (spec 043 §4.8, research §P3, §314.2).

   readState(c)            — the frozen reader, inside withTenant (RLS gives
                             one tenant; no WHERE tenant_id anywhere)
   loadGraph(c, graph)     — a whole graph into an EMPTY tenant: the migration
                             and the demo seed, never a save
   writeChanges(c, a, b)   — THE SAVE'S WRITER: the rows of graph `a` and
                             graph `b` are built with the same builders the
                             loader uses (graph-io.cjs tableRows), keyed by
                             each table's primary key, and ONLY the rows that
                             differ are written — an UPDATE of the columns
                             that changed, an INSERT for a row that appeared,
                             a DELETE for one that went. No statement in a
                             save clears a table, and a one-box save is one
                             UPDATE of one row (S9 proves it by xmin).

   Why a table-level diff rather than an interpreter over the change list's
   paths: the change list has a dozen shapes (§210, §215, §234) and every one
   of them, applied to the stored graph, produces a graph whose rows can be
   compared with the stored graph's rows. Comparing rows covers every shape
   the differ can produce — settings, the register, a reorder (idx moves on
   the rows that moved), an add, a remove — by construction, which is what
   §314.2 asked for; a shape needs no writer of its own to be safe. What is
   NOT addressable is a row without a key (§191: two rows sharing `undefined`
   are not one row), and that is refused before any write. */
import type { PoolClient } from "pg";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const G = require("./graph-io.cjs");

export const readState: (c: PoolClient) => Promise<any> = G.readState;
export const loadGraph: (c: PoolClient, graph: any) => Promise<void> = G.loadGraph;
export const tableRows: (graph: any) => { table: string; cols: string[]; rows: Record<string, unknown>[] }[] = G.tableRows;

/* Each graph table's key inside a tenant (data-model.md — tenant_id is
   supplied by the policy and the column default, never written here). */
export const KEYS: Record<string, string[]> = {
  org: [], cycle: [], review: [], prior_cycle: [],
  group_clauses: ["idx"], group_key_objectives: ["idx"], themes: ["idx"], bands: ["idx"], history: ["idx"],
  units: ["key"], companies: ["key"], functions: ["key"], people: ["key"], labels: ["key"], weighting_factors: ["key"],
  capabilities: ["id"], projects: ["id"], deliverables: ["id"], outcomes: ["id"], milestones: ["id"],
  cap_key_objectives: ["id"], unit_key_objectives: ["id"], pillars: ["id"], measures: ["id"], tactics: ["id"],
  plan_archives: ["id"],
  unit_clauses: ["unit_key", "idx"], swot_items: ["unit_key", "cat", "idx"],
  unit_roles: ["unit_key"], weighting_rows: ["unit_key"], ko_weights: ["unit_key"],
  weighting_values: ["unit_key", "factor_key"], access_grants: ["role_key", "page_key"],
};

export class UnaddressableChange extends Error {
  status = 400;
  table: string;
  why: string;
  constructor(table: string, why: string) {
    super("This change cannot be written row by row: " + table + " - " + why);
    this.table = table; this.why = why;
  }
}

/* jsonb columns come back with sorted keys; a column written by j() is a
   string — compare both canonically (§249.3, §145). */
function canon(v: unknown): string {
  if (v === undefined || v === null) return "null";
  if (typeof v === "string") {
    const t = v.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try { return canon(JSON.parse(t)); } catch { /* a plain string */ }
    }
    return JSON.stringify(v);
  }
  if (typeof v === "number" || typeof v === "boolean") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (typeof v === "object") return "{" + Object.keys(v as object).sort().map((k) => JSON.stringify(k) + ":" + canon((v as any)[k])).join(",") + "}";
  return JSON.stringify(String(v));
}
function keyOf(table: string, row: Record<string, unknown>): string {
  const ks = KEYS[table];
  if (!ks) throw new UnaddressableChange(table, "no key is declared for this table");
  if (!ks.length) return "";
  const parts = ks.map((k) => row[k]);
  if (parts.some((p) => p === undefined || p === null || p === ""))
    throw new UnaddressableChange(table, "a row has no " + ks.join("+") + " (§191)");
  return JSON.stringify(parts.map(String));
}
function index(table: string, rows: Record<string, unknown>[]): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const k = keyOf(table, r);
    if (m.has(k)) throw new UnaddressableChange(table, "two rows share the key " + k + " (§191)");
    m.set(k, r);
  }
  return m;
}

export type WriteReport = { updated: number; inserted: number; deleted: number; rows: number; tables: string[] };

export async function writeChanges(c: PoolClient, stored: any, incoming: any): Promise<WriteReport> {
  const before = tableRows(stored), after = tableRows(incoming);
  if (before.length !== after.length) throw new UnaddressableChange("*", "the two graphs build different table sets");
  type Op = { sql: string; params: unknown[] };
  const inserts: { table: string; ops: Op[] }[] = [], updates: Op[] = [], deletes: { table: string; ops: Op[] }[] = [];
  const touched = new Set<string>();
  /* Every table's plan is worked out BEFORE any statement runs, so an
     unaddressable row costs no write at all. */
  for (let i = 0; i < after.length; i++) {
    const t = after[i].table;
    if (before[i].table !== t) throw new UnaddressableChange(t, "table order differs");
    const ks = KEYS[t]; const cols = after[i].cols;
    const was = index(t, before[i].rows), now = index(t, after[i].rows);
    const ins: Op[] = [], del: Op[] = [];
    for (const [k, row] of now) {
      const old = was.get(k);
      if (!old) {
        const names = cols.filter((n) => row[n] !== undefined);
        ins.push({ sql: "INSERT INTO " + t + " (" + names.map((n) => '"' + n + '"').join(",") + ") VALUES (" + names.map((_, j) => "$" + (j + 1)).join(",") + ")", params: names.map((n) => row[n]) });
        touched.add(t); continue;
      }
      const changed = cols.filter((n) => !ks.includes(n) && canon(row[n]) !== canon(old[n]));
      if (!changed.length) continue;
      const where = ks.length ? " WHERE " + ks.map((k2, j) => '"' + k2 + '" = $' + (changed.length + j + 1)).join(" AND ") : "";
      updates.push({ sql: "UPDATE " + t + " SET " + changed.map((n, j) => '"' + n + '" = $' + (j + 1)).join(", ") + where,
        params: [...changed.map((n) => row[n] === undefined ? null : row[n]), ...ks.map((k2) => row[k2])] });
      touched.add(t);
    }
    for (const [k, old] of was) {
      if (now.has(k)) continue;
      const where = ks.length ? " WHERE " + ks.map((k2, j) => '"' + k2 + '" = $' + (j + 1)).join(" AND ") : "";
      /* a singleton that went (no key) is the whole row for this tenant —
         still one row, still addressed by the policy */
      del.push({ sql: "DELETE FROM " + t + where, params: ks.map((k2) => old[k2]) });
      touched.add(t);
    }
    inserts.push({ table: t, ops: ins }); deletes.push({ table: t, ops: del });
  }
  /* deletes children-first (reverse table order), then updates, then inserts
     parents-first — every FK satisfied inside the one transaction */
  let n = 0;
  for (const d of deletes.slice().reverse()) for (const op of d.ops) { n += (await c.query(op.sql, op.params)).rowCount || 0; }
  const deleted = n; n = 0;
  for (const op of updates) { n += (await c.query(op.sql, op.params)).rowCount || 0; }
  const updated = n; n = 0;
  for (const i of inserts) for (const op of i.ops) { n += (await c.query(op.sql, op.params)).rowCount || 0; }
  const inserted = n;
  return { updated, inserted, deleted, rows: updated + inserted + deleted, tables: [...touched] };
}
