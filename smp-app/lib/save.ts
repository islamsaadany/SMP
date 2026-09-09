/* The save (contracts/tenant-request.md §3, research §P3, §314.2).

   POST /api/<slug>/state  { base, changes, viewAs? }

   Inside withTenant, in this order and nothing else:
     1. pg_advisory_xact_lock(420043, hashtext(tenantId)) — §240's lock, PER
        TENANT: two saves naming the same row still read-modify-write the
        graph they are authorised against, so they take turns; a second
        tenant's saves never wait on this one's.
     2. readState()                → the stored world, under the lock
     3. actingFor + applyChanges   → the incoming world (§210/§215; view-as
                                     narrows, never widens — §185)
     4. authorize(stored, incoming, actor) → 403 with §184's verdict shape
     5. writeChanges(stored, incoming)     → ONLY the rows that differ
        (§314.2); a row the writer cannot address is a 400 naming it, and
        nothing has been written when it is thrown
     6. change_log from the verdict's own change list (§42), then COMMIT

   A whole-graph body (`state`) is refused (400): the frozen build never
   posts one to this app, and accepting it would be a second save path. */
import type { PoolClient } from "pg";
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { readState, writeChanges, UnaddressableChange } from "./state-io.ts";
const require = createRequire(import.meta.url);
const R = require("./rules.cjs");
const D = require("./graph-diff.cjs");
const { authorize } = require("./authorize.cjs");

export const LOCK_NS = 420043;
const LOG_ROW_CAP = 20;   /* api/state.js's cap on the rows a log line carries */

export type Actor = { key: string; name?: string; role?: string; email?: string };
export type SaveBody = { base?: unknown; changes?: unknown; viewAs?: string; state?: unknown };
export type SaveResult =
  | { code: 200; body: { ok: true; wrote: "rows"; rows: number; tables: string[]; at: string } }
  | { code: 400; body: { ok: false; error: string; table?: string } }
  | { code: 403; body: { ok: false; refused: true; error: string; refusals: string[]; refusedChanges: unknown[]; undoable: boolean; judgedAs: { key: string; name: string } | null } };

export async function save(tenantId: string, person: Actor, body: SaveBody): Promise<SaveResult> {
  if (body && body.state !== undefined)
    return { code: 400, body: { ok: false, error: "A whole graph is not a save. Post the change list." } };
  if (!body || !body.changes || typeof body.changes !== "object")
    return { code: 400, body: { ok: false, error: "No change list." } };

  return withTenant(tenantId, async (c: PoolClient) => {
    await c.query("SELECT pg_advisory_xact_lock($1, hashtext($2))", [LOCK_NS, tenantId]);
    const stored = await readState(c);
    if (!stored) return { code: 400 as const, body: { ok: false as const, error: "This tenant holds no graph yet." } };
    const me = (stored.people || []).find((p: any) => p && p.key === person.key) || { key: person.key, name: person.name };
    const act = R.actingFor(me, body.viewAs, person.role, stored.people);
    if (act.refuse)
      return { code: 403 as const, body: { ok: false as const, refused: true as const, error: act.refuse, refusals: [act.refuse], refusedChanges: [], undoable: false, judgedAs: null } };
    const acting = act.person;
    const applied = D.applyChanges(JSON.parse(JSON.stringify(stored)), body.changes);
    if (!applied.ok) return { code: 400 as const, body: { ok: false as const, error: applied.error } };
    const incoming = applied.state;
    const verdict = authorize(stored, incoming, acting);
    if (!verdict.ok) {
      const undoable = verdict.refused.length > 0 && verdict.refused.every((r: any) => r.rows && r.rows.length);
      return { code: 403 as const, body: { ok: false as const, refused: true as const, error: verdict.refusals.join(" "), refusals: verdict.refusals,
        refusedChanges: verdict.refused, undoable, judgedAs: acting.key === me.key ? null : { key: acting.key, name: acting.name || acting.key } } };
    }
    let report;
    try {
      report = await writeChanges(c, stored, incoming);
    } catch (e) {
      if (e instanceof UnaddressableChange) {
        /* nothing has been written: writeChanges plans every table before its
           first statement — and the transaction is rolled back regardless */
        throw Object.assign(new Error(e.message), { status: 400, table: e.table, unaddressable: true });
      }
      throw e;
    }
    /* the record (§42) — from the verdict's own list, the same rows api/state.js logs */
    const changes: any[] = verdict.changes || [];
    if (changes.length) {
      const vals: string[] = [], params: unknown[] = [];
      changes.forEach((ch, i) => {
        const rows = ch.rows && ch.rows.length ? { count: ch.rows.length, moved: ch.rows.slice(0, LOG_ROW_CAP) } : null;
        const b = i * 7;
        vals.push("($" + (b + 1) + ",$" + (b + 2) + ",$" + (b + 3) + ",$" + (b + 4) + ",$" + (b + 5) + ",$" + (b + 6) + ",$" + (b + 7) + ")");
        params.push(me.key, me.name || null, person.email || null, ch.kind, ch.target, ch.what, rows ? JSON.stringify(rows) : null);
      });
      await c.query("INSERT INTO change_log (person_key, person_name, email, kind, target, what, rows_) VALUES " + vals.join(","), params);
    }
    return { code: 200 as const, body: { ok: true as const, wrote: "rows" as const, rows: report.rows, tables: report.tables, at: new Date().toISOString() } };
  }).catch((e: any) => {
    if (e && e.unaddressable) return { code: 400 as const, body: { ok: false as const, error: e.message, table: e.table } };
    throw e;
  });
}
