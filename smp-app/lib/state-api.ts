/* The state API (spec 043 Phase A — api/state.js carried onto the shared
   schema, contracts/tenant-request.md §3).

     GET  /api/<slug>/state                → { ok, person, state }   the graph
     GET  …?since=<iso>&target=<t>[&sync]  → { ok, changed:[{by,at}] } §258's peek
     GET  …?log=1[&target&person&kind&from&to&limit] → { ok, office, log } §262
     POST /api/<slug>/state { changes, viewAs? } → lib/save.ts (§210/§215/§240/§184/§185)

   The tenant is the door's answer (lib/door.ts) and nothing else; every read
   and write runs inside withTenant(), so no query here names a tenant. The
   route is thin and the check drives THIS module through the route over
   HTTP — the same code, not a copy. */
import type { PoolClient } from "pg";
import { createRequire } from "node:module";
import type { SessionUser } from "./auth.ts";
import type { Tenant, Membership } from "./door.ts";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { save, type SaveBody, type SaveResult } from "./save.ts";

const R = createRequire(import.meta.url)("./rules.cjs");

export type Person = { key: string; name: string; role: string; email: string; kind: SessionUser["kind"]; mustChange: false; clientName: string; cards: boolean };
export type Answer = { code: number; body: Record<string, unknown> };

/* ── THE OFFICE ARRIVES ON THE REGISTER (§313.29–§313.32, ported) ────────
   A client user IS a register row (tenant_users.person_key, checked at
   COMMIT by the deferred FK). An office user may arrive holding a seat and
   no row — an admin opening a client nobody is on yet (door.ts's seatFor) —
   and the rules are the frozen ones, in order:
     · a membership names a row the register holds → adopted, never rewritten
       (§313.29): one mark, `forefront`, and nothing else on a row the
       platform did not mint; a row it DID mint (`ffrow`) follows the seat;
     · no membership → the register is asked BY EMAIL (§313.32): exactly one
       active row, or refused — two matches refuse rather than guess (§87);
     · nobody by email → a row is MINTED only where the platform built the
       register or the register is empty (§313.30/§313.31); a client that
       brought its own register gets nothing created in it, and the person
       is told they are not on it (NO_PERSON) rather than invented (§313.32).
   The membership is written where one was missing, so the next request
   resolves at the door and never reaches this again. */
export class NoPerson extends Error { status = 404; code = "NO_PERSON"; }

function mintKey(email: string): string {
  const local = String(email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return "ff_" + (local || "office");
}
export async function officeRow(c: PoolClient, user: SessionUser, tenant: Tenant, seat: Membership["seat"] | null, personKey: string | null): Promise<string> {
  const role = seat === "super" || seat === "smoteam" ? seat : "smoteam";
  if (personKey) {
    const found = await c.query("SELECT key, role, COALESCE(extra->>'ffrow','') AS mine FROM people WHERE key = $1", [personKey]);
    if (found.rowCount) {
      if (!found.rows[0].mine) {
        await c.query("UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{forefront}', 'true'::jsonb) WHERE key = $1 AND COALESCE(extra->>'forefront','') <> 'true'", [personKey]);
      } else if (found.rows[0].role !== role) {
        await c.query("UPDATE people SET role = $2 WHERE key = $1", [personKey, role]);
      }
      return personKey;
    }
  }
  /* by email, on the stored register (§313.32) — `active` is an absence, so
     a retired row carries extra.active = 'false' (§247's own test) */
  const byMail = await c.query(
    "SELECT key FROM people WHERE lower(COALESCE(extra->>'email','')) = lower($1) AND COALESCE(extra->>'active','') <> 'false'", [user.email]);
  if (byMail.rowCount === 1) return byMail.rows[0].key;
  if ((byMail.rowCount || 0) > 1) throw new NoPerson("Two people on this register carry your address, so the platform cannot say which you are. Ask the SMO to settle it.");
  const anybody = await c.query("SELECT 1 FROM people LIMIT 1");
  if (!tenant.made_here && anybody.rowCount) throw new NoPerson("You are signed in, but you are not on this client's register. Ask the SMO to place you.");
  const key = personKey || mintKey(user.email);
  const rowRole = role;
  const idx = (await c.query("SELECT COALESCE(MAX(idx),0) + 1 AS n FROM people")).rows[0].n;
  await c.query("INSERT INTO people (key, idx, name, role, extra) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (tenant_id, key) DO NOTHING",
    [key, idx, user.name || user.email, rowRole, JSON.stringify({ forefront: true, ffrow: true, email: user.email })]);
  return key;
}
export type Resolved = { user: SessionUser; tenant: Tenant; seat: Membership["seat"] | null; personKey: string | null };

/* WHO THIS REQUEST IS, on the register: the key, the seat as `role` (what
   actingFor and the history read ask), and what the chrome draws (§313). */
export async function personFor(r: Resolved): Promise<Person> {
  let key = r.personKey;
  if (r.user.kind !== "client") {
    /* No membership is written here: an admin with no seat holds the
       client's Super user seat BY RULE at the door (door.ts, seatFor), and
       the team is set on the client's own configuration (api/platform setTeam)
       and nowhere else (§53.5). The row minted below carries the address, so
       the next request finds them by it (§313.32) — idempotent, one row. */
    key = await withTenant(r.tenant.id, (c) => officeRow(c, r.user, r.tenant, r.seat, r.personKey));
  }
  if (!key) throw new NoPerson("You are signed in, but you are not on this client's register. Ask the SMO to place you.");
  const seatRole = r.seat === "super" || r.seat === "smoteam" ? r.seat : "";
  return { key, name: r.user.name, role: seatRole, email: r.user.email, kind: r.user.kind, mustChange: false,
           clientName: r.tenant.name, cards: r.user.kind !== "client" };
}

function within(q: URLSearchParams, name: string): string | null {
  const v = q.get(name);
  return v && !isNaN(Date.parse(v)) ? v : null;
}

export async function readAnswer(r: Resolved, q: URLSearchParams): Promise<Answer> {
  const person = await personFor(r);
  const brk = process.env.SMP_BREAK || "";
  /* ── HISTORY (§262): a filtered read of the log, never the whole ── */
  if (q.get("log")) {
    const office = brk === "log-for-all" ? true : R.isOfficeRole(person.role);
    const t = q.get("target") || null, who = q.get("person") || null, kind = q.get("kind") || null;
    const from = within(q, "from"), to = within(q, "to");
    const limit = Math.min(500, Math.max(1, parseInt(q.get("limit") || "200", 10) || 200));
    return withTenant(r.tenant.id, async (c) => {
      if (!office) {
        if (!t) return { code: 403, body: { ok: false, error: "History is the Strategy Office's; ask about one unit or function by name." } };
        const stored = await readState(c);
        const w = R.worldOf(stored);
        const me = (stored.people || []).find((p: any) => p && p.key === person.key);
        const places = R.personRoles(w, me).map((x: any) => x.at);
        if (places.indexOf(t) < 0) return { code: 403, body: { ok: false, error: "You hold no role there, so its history is not yours to read." } };
      }
      const conds: string[] = [], params: unknown[] = [];
      const add = (sql: string, v: unknown) => { params.push(v); conds.push(sql.replace("?", "$" + params.length)); };
      if (t) add("target = ?", t);
      if (who) add("person_key = ?", who);
      if (kind) add("kind = ?", kind);
      if (from) add("at >= ?::timestamptz", from);
      if (to) add("at < ?::timestamptz", to);
      params.push(limit);
      const rows = (await c.query(
        "SELECT id, at, person_key, person_name, kind, target, what, rows_ FROM change_log" +
        (conds.length ? " WHERE " + conds.join(" AND ") : "") + " ORDER BY at DESC, id DESC LIMIT $" + params.length, params)).rows;
      return { code: 200, body: { ok: true, office, log: rows } };
    });
  }
  /* ── THE PEEK (§258): who else landed a change on this page since ── */
  const since = within(q, "since"), target = q.get("target");
  if (since && target) {
    return withTenant(r.tenant.id, async (c) => {
      if (q.get("sync")) {
        const n = (await c.query("SELECT now() AS now")).rows[0].now;
        return { code: 200, body: { ok: true, changed: [], now: n } };
      }
      const rows = (await c.query(
        "SELECT person_key AS by_key, person_name AS by, at FROM change_log WHERE target = $1 AND at > $2::timestamptz" +
        (brk === "peek-includes-me" ? "" : " AND person_key <> $3") + " ORDER BY at ASC LIMIT 50",
        brk === "peek-includes-me" ? [target, since] : [target, since, person.key])).rows;
      return { code: 200, body: { ok: true, changed: rows.map((x: any) => ({ by: x.by || x.by_key, at: x.at })) } };
    });
  }
  const state = await withTenant(r.tenant.id, (c) => readState(c));
  if (!state) return { code: 404, body: { ok: false, error: "This client holds no plan yet." } };
  return { code: 200, body: { ok: true, person, state } };
}

export async function writeAnswer(r: Resolved, body: SaveBody): Promise<Answer> {
  const person = await personFor(r);
  const out: SaveResult = await save(r.tenant.id, { key: person.key, name: person.name, role: person.role, email: person.email }, body);
  return { code: out.code, body: out.body as Record<string, unknown> };
}
