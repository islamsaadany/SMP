/* Unsaved changes sent to the Strategy Office (§504).

   A save that FAILS (the server or the network, never a refusal) is kept on
   the person's own computer and resent by itself (src/sync.js). If they
   press "Send to the Strategy Office", the change list arrives here as LINES
   (lib/graph-diff splitLines) — one per part path or row field — so the
   office works through one list rather than a whole plan per person:

     POST { unsaved:"send", lines, error, viewAs? } → any signed-in person
     POST { unsaved:"landed", report }               → the sender: it saved itself
     POST { unsaved:"apply", id }                    → the office: run it AS THE SENDER
     POST { unsaved:"discard", id }                  → the office
     GET  ?unsaved=1                                 → the office: the open list

   APPLYING NEVER BORROWS THE OFFICE'S RIGHTS. It is the ordinary save
   (lib/save.ts) with the SENDER as the actor — their register key, the seat
   the server knew them by when they sent it, and the view they were in — so
   a line the sender could not have saved is refused exactly as it would have
   been for them (§42), and the change log names them, because the change is
   theirs. The residual risk is stated: a seat stored at send time may have
   changed by the time the office presses Apply.

   Every statement runs inside withTenant() (lib/tenant.ts), so no query here
   names a tenant. */
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { save } from "./save.ts";
import type { Answer } from "./state-api.ts";

const require = createRequire(import.meta.url);
const R = require("./rules.cjs");
const D = require("./graph-diff.cjs");

export type UnsavedActor = { key: string; name?: string; role?: string };

const MAX_LINES = 500;          /* one failed save is a handful; this is a fence, not a budget */
const MAX_ERROR = 2000;

/* A line is accepted only if splitting its own change gives back exactly one
   line with the same address — so the office's list can never hold a
   "line" that is really a whole plan, or an address that lies about what it
   changes. */
function cleanLine(l: any): { addr: string; change: any; mine: any; base: any } | null {
  if (!l || typeof l !== "object" || typeof l.addr !== "string" || !l.change || typeof l.change !== "object") return null;
  const again = D.splitLines(l.change);
  if (again.length !== 1 || again[0].addr !== l.addr) return null;
  const base = l.base && typeof l.base === "object" ? { has: !!l.base.has, value: l.base.has ? l.base.value : undefined } : null;
  return { addr: l.addr, change: again[0].change, mine: again[0].mine, base };
}

export async function unsavedRead(tenantId: string, me: UnsavedActor): Promise<Answer> {
  if (!R.isOfficeRole(me.role || "")) return { code: 403, body: { ok: false, error: "Unsaved changes are the Strategy Office's to work through." } };
  return withTenant(tenantId, async (c) => {
    const state = await readState(c);
    const rows = (await c.query(
      "SELECT id, report, person_key, person_name, view_as, sent_at, addr, change, base, mine, error " +
      "FROM unsaved_lines WHERE status = 'open' ORDER BY sent_at ASC, id ASC LIMIT 2000")).rows;
    /* A LINE THAT HAS LANDED BY ITSELF LEAVES THE LIST — the sender's own
       computer resent it once the server answered, or somebody typed the same
       thing — so the office is never asked to act on something already true. */
    const landed: string[] = [], open: any[] = [];
    for (const x of rows) {
      const now = D.valueAt(state, { change: x.change });
      const mine = x.mine || { has: false };
      if (now.has === !!mine.has && (!now.has || D.sameValue(now.value, mine.value))) landed.push(x.id);
      else open.push({ id: x.id, report: x.report, by: x.person_key, byName: x.person_name || x.person_key,
        viewAs: x.view_as || null, at: x.sent_at, addr: x.addr, change: x.change, mine, base: x.base, now, error: x.error || "" });
    }
    if (landed.length)
      await c.query("UPDATE unsaved_lines SET status = 'landed', done_at = now() WHERE id = ANY($1::uuid[]) AND status = 'open'", [landed]);
    return { code: 200, body: { ok: true, lines: open } };
  });
}

export async function unsavedWrite(tenantId: string, me: UnsavedActor, body: any): Promise<Answer> {
  const act = String(body.unsaved || "");
  if (act === "send") {
    const raw = Array.isArray(body.lines) ? body.lines : [];
    if (!raw.length) return { code: 400, body: { ok: false, error: "There were no changes to send." } };
    if (raw.length > MAX_LINES) return { code: 400, body: { ok: false, error: "Too many changes to send in one go." } };
    const lines = raw.map(cleanLine);
    if (lines.some((l: any) => !l)) return { code: 400, body: { ok: false, error: "One of the changes is not shaped like a change." } };
    const error = String(body.error || "").slice(0, MAX_ERROR);
    const viewAs = typeof body.viewAs === "string" && body.viewAs.trim() ? body.viewAs.trim() : null;
    return withTenant(tenantId, async (c) => {
      const report = (await c.query("SELECT gen_random_uuid() AS id")).rows[0].id;
      const vals: string[] = [], params: unknown[] = [];
      lines.forEach((l: any, i: number) => {
        const b = i * 10;
        vals.push("(" + Array.from({ length: 10 }, (_, k) => "$" + (b + k + 1)).join(",") + ")");
        params.push(report, me.key, me.name || null, me.role || "", viewAs, l.addr,
          JSON.stringify(l.change), l.base ? JSON.stringify(l.base) : null, JSON.stringify(l.mine), error);
      });
      await c.query("INSERT INTO unsaved_lines (report, person_key, person_name, role, view_as, addr, change, base, mine, error) VALUES " + vals.join(","), params);
      return { code: 200, body: { ok: true, report, lines: lines.length } };
    });
  }
  if (act === "landed") {
    const report = String(body.report || "");
    if (!/^[0-9a-f-]{36}$/i.test(report)) return { code: 400, body: { ok: false, error: "No report named." } };
    return withTenant(tenantId, async (c) => {
      const n = (await c.query("UPDATE unsaved_lines SET status = 'landed', done_by = $2, done_at = now() " +
        "WHERE report = $1 AND person_key = $2 AND status = 'open'", [report, me.key])).rowCount;
      return { code: 200, body: { ok: true, landed: n } };
    });
  }
  if (act === "apply" || act === "discard") {
    if (!R.isOfficeRole(me.role || "")) return { code: 403, body: { ok: false, error: "Unsaved changes are the Strategy Office's to work through." } };
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { code: 400, body: { ok: false, error: "No line named." } };
    const row = await withTenant(tenantId, async (c) =>
      (await c.query("SELECT id, person_key, person_name, role, view_as, addr, change FROM unsaved_lines WHERE id = $1 AND status = 'open'", [id])).rows[0]);
    if (!row) return { code: 404, body: { ok: false, error: "That line is no longer waiting — somebody has already dealt with it." } };
    if (act === "discard") {
      await withTenant(tenantId, (c) => c.query("UPDATE unsaved_lines SET status = 'discarded', done_by = $2, done_at = now() WHERE id = $1 AND status = 'open'", [id, me.key]));
      return { code: 200, body: { ok: true } };
    }
    /* THE BREAK (constitution XVI): `apply-as-office` runs the save with the
       office's own rights — the one thing this action must never do — so
       checks/unsaved-lines.mjs goes red before its green is believed. */
    const actor = process.env.SMP_BREAK === "apply-as-office"
      ? { key: me.key, name: me.name, role: me.role }
      : { key: row.person_key, name: row.person_name || undefined, role: row.role || "" };
    const out = await save(tenantId, actor, { changes: row.change, viewAs: row.view_as || undefined });
    if (out.code !== 200) return { code: out.code, body: out.body as Record<string, unknown> };
    /* the line is applied, and anybody else's answer to the SAME line goes
       with it — one place, one value (the office chose this one) */
    await withTenant(tenantId, (c) => c.query(
      "UPDATE unsaved_lines SET status = CASE WHEN id = $1 THEN 'applied' ELSE 'discarded' END, done_by = $3, done_at = now() " +
      "WHERE status = 'open' AND (id = $1 OR addr = $2)", [id, row.addr, me.key]));
    return { code: 200, body: { ok: true } };
  }
  return { code: 400, body: { ok: false, error: "Unknown action." } };
}
