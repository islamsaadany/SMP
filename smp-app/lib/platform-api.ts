/* Forefront's own platform — api/platform.js carried onto the shared schema
   (spec 043 Phase B). ONE endpoint with an action, the shape platform.html
   posts; every rule is lib/platform-rules.cjs's, the frozen module byte for
   byte, answering from a world built in ONE place (§102.4):
     mine   — tenant_users for this login, as {client_key, person_key, seat}
     access — platform_access, the stored half of the office's own table
   The registry is `tenants` (clients), `users` (accounts) and `tenant_users`
   (account_clients); a client's own rows are reached through withTenant and
   nothing else. What each action answers is what the frozen page reads, so
   platform.html is served unchanged. */
import type { Pool, PoolClient } from "pg";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
import type { SessionUser } from "./auth.ts";
import { hashPassword } from "./auth.ts";
import type { Tenant } from "./door.ts";
import { withTenant } from "./tenant.ts";
import { loadGraph, readState } from "./state-io.ts";
import { officeRow } from "./state-api.ts";
import * as LIB from "./library.ts";
import { dropBlob, ready as storeReady, beginUpload, putPart, finishUpload } from "./blob-api.ts";
import { deleteTenant } from "./tenant-delete.ts";
import { ownerPool } from "./db.ts";
import { moduleRows, modulesFor, offerable, isModule, MODULE_DEF, DEFAULT_MODULE } from "./modules.ts";

const require = createRequire(import.meta.url);
/* the worked example the product generates (scripts/extract-state.js), at the
   repository's root beside the frozen sources it is made from */
const SEED = join(process.cwd(), "..", "db", "seed-state.json");
const FF = require("./platform-rules.cjs");
const frozen = require("./frozen.cjs") as {
  cleared: (g: unknown) => unknown;
  bare: (g: unknown) => any;
  shape: (g: unknown, a: unknown) => any;
  holds: (g: unknown) => { plans: number; capabilities: number; units: number; functions: number };
};

type Q = Pool | PoolClient;
export type Answer = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown>): Answer => ({ code: 200, body: { ok: true, ...body } });
const no = (code: number, error: string): Answer => ({ code, body: { ok: false, error } });
const NO_CLIENT = "That client is not available.";

type Account = { id: string; email: string; name: string; is_admin: boolean; kind: string; status: string };
type World = { mine: { client_key: string; person_key: string; seat: string; tenant_id: string }[]; access: Record<string, Record<string, string>> };
type ClientRow = Tenant & { industry: string; notes: string; size: string;
  archived_at: string | null; archived_by: string | null; modules?: unknown };

const CLIENT_COLS = "id, key, name, kind, status, mark, industry, notes, size, made_here, archived_at, archived_by, modules";
async function clientByKey(c: Q, key: unknown): Promise<ClientRow | null> {
  if (!key) return null;
  const r = await c.query("SELECT " + CLIENT_COLS + " FROM tenants WHERE key = $1", [String(key)]);
  return r.rowCount ? r.rows[0] : null;
}
async function accountByEmail(c: Q, email: unknown): Promise<Account | null> {
  if (!email) return null;
  const r = await c.query("SELECT id, email, name, is_admin, kind, status FROM users WHERE email = $1", [String(email).toLowerCase()]);
  return r.rowCount ? r.rows[0] : null;
}
async function worldFor(c: Q, userId: string): Promise<World> {
  const mine = (await c.query(
    "SELECT t.key AS client_key, m.person_key, m.seat, m.tenant_id FROM tenant_users m JOIN tenants t ON t.id = m.tenant_id WHERE m.user_id = $1", [userId])).rows;
  const access: Record<string, Record<string, string>> = {};
  for (const r of (await c.query("SELECT role_key, area_key, grant_ FROM platform_access")).rows) (access[r.role_key] ||= {})[r.area_key] = r.grant_;
  return { mine, access };
}
async function teamOf(c: Q, tenantId: string) {
  return (await c.query(
    "SELECT u.email, m.person_key, m.seat, u.name, u.is_admin, u.status FROM tenant_users m JOIN users u ON u.id = m.user_id " +
    "WHERE m.tenant_id = $1 AND u.kind = 'office' ORDER BY (m.seat = 'super') DESC, u.name", [tenantId])).rows;
}
function slugFor(name: unknown): string {
  return String(name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
function officePersonKey(email: string): string {
  return "ff_" + String(email || "").toLowerCase().split("@")[0].replace(/[^a-z0-9]+/g, "_").slice(0, 24);
}
function tempPassword(): string { return crypto.randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 12); }

/* What a card says — every number read, never stored (constitution V). */
async function factsFor(t: ClientRow) {
  try {
    return await withTenant(t.id, async (c) => {
      const n = async (tbl: string) => Number((await c.query("SELECT count(*)::int AS n FROM " + tbl)).rows[0].n);
      const units = await n("units"), pillars = await n("pillars");
      const cyc = (await c.query("SELECT name, locked FROM cycle")).rows[0] || null;
      return { units, planned: pillars > 0, cycleOpen: !!(cyc && String(cyc.name || "").trim() && !cyc.locked), unreadable: false };
    });
  } catch (e) {
    console.error("card facts for " + t.key + ":", (e as Error).message);
    return { units: null, planned: null, cycleOpen: null, unreadable: true };
  }
}

export async function platformAction(pool: Q, me: SessionUser, body: any): Promise<Answer> {
  const action = String((body && body.action) || "me");
  if (me.kind === "client") return no(403, "That is not something this account opens.");
  const account: Account = { id: me.id, email: me.email, name: me.name, is_admin: me.isAdmin, kind: me.kind, status: "active" };
  const world = await worldFor(pool, me.id);

  if (action === "me") return ok({ account: { email: account.email, name: account.name, isAdmin: !!account.is_admin }, access: world.access, mine: FF.myClientKeys(world) });

  if (action === "cards") {
    const all: ClientRow[] = (await pool.query("SELECT " + CLIENT_COLS + " FROM tenants ORDER BY kind, name")).rows;
    const shown: ClientRow[] = FF.visibleClients(world, account, all);
    const cards = [];
    for (const row of shown) {
      const facts = await factsFor(row);
      cards.push({ key: row.key, name: row.name, industry: row.industry, kind: row.kind, mark: row.mark, mine: FF.isMine(world, row.key),
        seat: FF.seatOn(world, row.key), state: FF.clientState(world, account, row), canOpen: FF.mayOpenClient(world, account, row),
        canConfig: FF.mayReadConfig(world, account, row), units: facts.units, planned: facts.planned, cycleOpen: facts.cycleOpen, unreadable: !!facts.unreadable,
        /* THE CARD'S DOORS (spec 046 §4.6a): one row per module this client
           has, each with the one line that module says about it. Worked out
           HERE and never on the page, so the console cannot spell a module
           differently from the switch or from Setup (§53.5). */
        modules: moduleRows(modulesFor(row.modules), facts) });
    }
    /* ── THE ARCHIVED BAND (§323) ────────────────────────────────────
       Its own list, not a flag on the grid's: `visibleClients` keeps a
       retired client off the cards and every other caller depends on that,
       so widening it would change what "visible" means for all of them.
       Drawn only for somebody who can bring one back (FF.archivedClients),
       and carrying NO facts — an archived client's rows are not read, both
       because nothing on the card says anything about them and because
       reading every archived tenant's graph on every visit to this page is a
       cost nobody asked for. */
    const archived = FF.archivedClients(world, account, all).map((row: ClientRow) => ({
      key: row.key, name: row.name, industry: row.industry, kind: row.kind, mark: row.mark,
      at: row.archived_at, by: row.archived_by,
      canConfig: FF.mayReadConfig(world, account, row)
    }));
    return ok({ cards, archived, canAdd: FF.mayCreateClient(world, account), canConsultants: FF.mayReadConsultants(world, account), canAccess: FF.mayEditAccess(world, account) });
  }

  /* ── Forefront's own people ── */
  if (action === "consultants") {
    if (!FF.mayReadConsultants(world, account)) return no(403, "The consultants list is not yours to open.");
    const rows = (await pool.query(
      "SELECT u.email, u.name, u.is_admin, u.status, u.must_change, " +
      "  COALESCE((SELECT json_agg(json_build_object('client', t.name, 'key', t.key, 'seat', m.seat) ORDER BY t.name) " +
      "            FROM tenant_users m JOIN tenants t ON t.id = m.tenant_id WHERE m.user_id = u.id), '[]'::json) AS seats " +
      "FROM users u WHERE u.kind = 'office' ORDER BY u.name")).rows;
    return ok({ people: rows.map((r: any) => ({ email: r.email, name: r.name, isAdmin: !!r.is_admin, status: r.status, seats: r.seats, password: r.must_change ? "temporary" : "set",
      /* WHAT THE CARDS DRAW IS WHAT THE ENDPOINT WILL ACCEPT (§42), asked
         once here rather than re-derived on the page — a row that offers
         Delete and is then refused is the drift §337 has just been fixed. */
      canRetire: FF.mayRetireConsultant(world, account, r),
      canDelete: FF.mayDeleteConsultant(world, account, r) })),
      canEdit: FF.mayManageConsultants(world, account), canSetAdmin: FF.isAdmin(account), me: account.email });
  }

  /* ── TAKING SOMEBODY OFF THE LIST (§338) ─────────────────────────────
     Retiring is `saveConsultant`'s own `status`, which has been accepted
     since that action was written and had no control (§61); what is new
     here is the DELETE, and the two things the rules deliberately do not
     answer because the database owns them: a seat still held, and the
     sessions that have to end.

     THE SEATS ARE THE REFUSAL, AND IT NAMES THEM (§62, §16.7): deleting
     somebody who still runs a client would take their seat and their
     register rows with it by cascade, so it stops and says which clients to
     take them off first. A refusal that sends somebody to a screen is worth
     more than one that says no. */
  if (action === "deleteConsultant") {
    const target = await accountByEmail(pool, body.email);
    if (!target || target.kind !== "office") return no(400, "No such account.");
    if (!FF.mayDeleteConsultant(world, account, target)) {
      return no(403,
        target.email === account.email ? "You cannot delete your own account." :
        target.is_admin ? "That is an admin's account — take the admin flag off first." :
        target.status !== "retired" ? "Retire " + (target.name || target.email) + " first. Deleting is only offered on an account that is already retired." :
        "Deleting a consultant is the platform admin's.");
    }
    const seats = (await pool.query(
      "SELECT t.name FROM tenant_users m JOIN tenants t ON t.id = m.tenant_id WHERE m.user_id = $1 ORDER BY t.name", [target.id])).rows.map((x: any) => x.name);
    if (seats.length) {
      return no(409, (target.name || target.email) + " still holds a seat on " +
        (seats.length === 1 ? seats[0] : seats.slice(0, -1).join(", ") + " and " + seats[seats.length - 1]) +
        ". Take them off " + (seats.length === 1 ? "that client" : "those clients") + " first.");
    }
    /* sessions go with the account (they cascade, and saying so is cheaper
       than somebody wondering whether a signed-in tab survives) */
    await pool.query("DELETE FROM users WHERE id = $1", [target.id]);
    console.log("[platform] " + account.email + " deleted consultant " + target.email);
    return ok({ deleted: target.email });
  }

  if (action === "saveConsultant") {
    if (!FF.mayManageConsultants(world, account)) return no(403, "Adding and changing consultants is the platform admin's.");
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return no(400, "That is not an email address.");
    const existing = await accountByEmail(pool, email);
    if (body.isAdmin !== undefined && existing) {
      if (!FF.maySetAdmin(world, account, existing)) return no(403, existing.email === account.email ? "You cannot change your own admin rights." : "Only the platform admin sets that.");
      await pool.query("UPDATE users SET is_admin = $2, updated_at = now() WHERE id = $1", [existing.id, !!body.isAdmin]);
    }
    /* RETIRING IS ITS OWN ACT, ASKED OF THE TARGET (§338). It used to ride
       the blanket UPDATE below with no test at all, so whoever manages
       consultants could retire an ADMIN — or themselves, and sign nobody
       back in. §89's rule (the test is the target) applied to the one field
       on this action that closes a door. The sessions end with it, or
       somebody keeps a signed-in tab for thirty days after being retired
       (§43's rule for a password change, and the same argument). */
    const want = String(body.status || "");
    if (want && existing) {
      if (want !== "active" && want !== "retired") return no(400, "That is not a standing.");
      if (!FF.mayRetireConsultant(world, account, existing)) {
        return no(403, existing.email === account.email ? "You cannot retire your own account." :
          existing.is_admin ? "That is an admin's account — take the admin flag off first." :
          "Retiring a consultant is the platform admin's.");
      }
      await pool.query("UPDATE users SET status = $2, updated_at = now() WHERE id = $1", [existing.id, want]);
      if (want === "retired") await pool.query("DELETE FROM sessions WHERE user_id = $1", [existing.id]);
    }
    if (existing) {
      await pool.query("UPDATE users SET name = COALESCE($2, name), updated_at = now() WHERE id = $1", [existing.id, body.name || null]);
      /* THE ADDRESS ITSELF CAN CHANGE (§313.27). Keyed by id here, so a rename
         is one UPDATE; the sessions still end (§43's rule for a password
         change) and the address on each client's register follows, best
         effort per client. The person key never moves (§87). */
      const to = String(body.newEmail || "").trim().toLowerCase();
      if (to && to !== email) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return no(400, "That is not an email address.");
        if (await accountByEmail(pool, to)) return { code: 409, body: { ok: false, error: "That address already belongs to somebody on this platform." } };
        await pool.query("UPDATE users SET email = $2, updated_at = now() WHERE id = $1", [existing.id, to]);
        await pool.query("DELETE FROM sessions WHERE user_id = $1", [existing.id]);
        for (const m of (await pool.query("SELECT tenant_id, person_key FROM tenant_users WHERE user_id = $1", [existing.id])).rows) {
          try {
            await withTenant(m.tenant_id, (c) => c.query("UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{email}', to_jsonb($2::text)) WHERE key = $1", [m.person_key, to]));
          } catch (e) { console.error("renaming " + m.person_key + ":", (e as Error).message); }
        }
        return ok({ email: to, signedOut: true });
      }
      return ok({});
    }
    const pw = tempPassword();
    await pool.query("INSERT INTO users (email, name, kind, is_admin, password_hash, must_change) VALUES ($1,$2,'office',$3,$4,true)",
      [email, body.name || "", !!body.isAdmin && FF.isAdmin(account), hashPassword(pw)]);
    return ok({ created: true, password: pw });
  }

  if (action === "issuePassword") {
    const target = await accountByEmail(pool, String(body.email || "").toLowerCase());
    if (!target) return no(400, "No such account.");
    if (!FF.mayIssuePasswordTo(world, account, target)) return no(403, target.is_admin ? "That is an admin's account." : "Issuing passwords is the platform admin's.");
    const pw = tempPassword();
    await pool.query("UPDATE users SET password_hash = $2, must_change = true, updated_at = now() WHERE id = $1", [target.id, hashPassword(pw)]);
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [target.id]);
    return ok({ password: pw });
  }

  /* ── A client's configuration ── */
  if (action === "client") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    let register: unknown[] = [];
    try {
      register = await withTenant(row.id, async (c) => (await c.query(
        "SELECT key, name, role, extra->>'email' AS email, extra->>'forefront' AS ff FROM people WHERE COALESCE(extra->>'active','true') <> 'false' ORDER BY idx")).rows);
    } catch (e) { console.error("reading " + row.key + "'s register:", (e as Error).message); }
    /* ── THE SHAPE THE SET-UP FLOW OPENS WITH (§322) ──────────────────
       Read from the stored graph, so opening a client afterwards shows the
       answers that are actually in it rather than what somebody typed last
       time — there is no draft, and the data IS the progress (§129). Read
       beside the register in the same transaction, and allowed to fail the
       same way: a client whose graph cannot be read still opens its card. */
    let shape: unknown = null, holds: unknown = null;
    try {
      const g = await withTenant(row.id, (c) => readState(c));
      holds = frozen.holds(g);
      shape = {
        companies: (g.companyKeys || []).map((k: string) => ({ name: g.companies[k].name })),
        units: (g.unitKeys || []).map((k: string) => ({
          name: g.units[k].name,
          company: g.units[k].company && g.companies[g.units[k].company]
            ? g.companies[g.units[k].company].name : "" })),
        functions: (g.functionKeys || []).map((k: string) => ({
          name: g.functions[k].name, format: g.functions[k].format === "pillars" ? "pillars" : "projects" })),
        words: (g.labels || []).reduce((o: Record<string, string>, e: { key: string; bu: string }) => {
          o[e.key] = e.bu; return o; }, {})
      };
    } catch (e) { console.error("reading " + row.key + "'s shape:", (e as Error).message); }
    /* ── WHAT A DELETE WOULD TAKE (§323) ──────────────────────────────
       Counted from the client's own rows at the moment of asking, never
       written from memory, so the sentence in front of the one irreversible
       press names what is actually there. Read ONLY for a client that is
       already archived — that is the only place Delete exists, and reading
       five counts for every card's Settings would be paying for a screen
       almost nobody opens. A count that cannot be read is NULL and the page
       says so rather than printing a nought (§93: an error is not an
       absence, and here it would read as "there is nothing to lose"). */
    let goes: unknown = null;
    if (row.status === "retired" && FF.mayDeleteClient(world, account, row)) {
      try {
        goes = await withTenant(row.id, async (c) => {
          const n = async (tbl: string) => Number((await c.query("SELECT count(*)::int AS n FROM " + tbl)).rows[0].n);
          const h = holds as { plans: number; capabilities: number; units: number; functions: number } | null;
          return {
            units: h ? h.units : null, functions: h ? h.functions : null,
            plans: h ? h.plans : null, capabilities: h ? h.capabilities : null,
            people: await n("people"), conversations: await n("chat_threads")
          };
        });
      } catch (e) { console.error("counting " + row.key + "'s rows:", (e as Error).message); }
    }
    const { id: _id, ...client } = row;
    /* WHAT THIS CLIENT HAS, AND WHAT IT COULD BE GIVEN (spec 046 §4.5) —
       both worked out on the server from lib/modules.ts, so the drawer draws
       the list rather than holding one: a module added to MODULE_DEF appears
       in this list the day it is built, and one that is not built is not
       offered at all, because a switch for a module with nothing behind it
       opens the Strategy platform wearing another name (§61). */
    return ok({ client, team: await teamOf(pool, row.id), seats: FF.SEATS, canEdit: FF.mayConfigureClient(world, account, row), register,
      shape, holds, goes,
      canArchive: FF.mayArchiveClient(world, account, row), canDelete: FF.mayDeleteClient(world, account, row),
      modules: modulesFor(row.modules),
      offer: offerable().map((k) => ({ key: k, label: MODULE_DEF[k].label, note: MODULE_DEF[k].note, always: k === DEFAULT_MODULE })),
      office: (await pool.query("SELECT email, name, is_admin FROM users WHERE kind = 'office' AND status = 'active' ORDER BY name")).rows });
  }

  if (action === "saveClient") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's configuration is not yours to change.");
    /* AN ARCHIVED CLIENT IS READ, NOT EDITED (§323, §42). The flow draws its
       fields read-only; without this the promise is the screen's alone and a
       console walks past it. Refused BY NAME, so the answer names the state
       rather than the permission — they are not the same errand. */
    if (row.status === "retired") return no(409, row.name + " is archived. Bring them back before changing anything.");
    let mark: string | null = null;
    if (typeof body.mark === "string") {
      if (body.mark === "") mark = "";
      else if (/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.mark) && body.mark.length <= 400000) mark = body.mark;
      else return no(400, "The mark must be a PNG under 300 KB.");
    }
    await pool.query(
      "UPDATE tenants SET name = COALESCE($2,name), industry = COALESCE($3,industry), notes = COALESCE($4,notes), " +
      "size = COALESCE($6,size), " +
      "mark = CASE WHEN $5::text IS NULL THEN mark WHEN $5 = '' THEN NULL ELSE $5 END WHERE id = $1",
      [row.id, body.name || null, body.industry == null ? null : String(body.industry), body.notes == null ? null : String(body.notes), mark,
       body.size == null ? null : String(body.size)]);
    return ok({});
  }

  /* ── SETTING A CLIENT UP, FROM THE OUTSIDE (§322) ────────────────────
     Islam: "the setup should happen on the external creatoin not inside ...
     the wizard should start on the outside window so the people after the
     setup can get intop the platform ready." So the shape a client has —
     its companies, its business units, its supporting functions and how
     each plans, and the words it uses — is written from Forefront's own
     page, before anybody from the client has signed in.

     EVERY ROW IS MINTED BY THE PLATFORM'S OWN MINTER (frozen.shape, running
     addCompany · addBusinessUnit · addFunction in the frozen sources): a
     unit created out here is byte for byte a unit created on Setup's own
     page, and there is no second answer to what a unit is shaped like
     (§53.5).

     AND IT REFUSES A CLIENT THAT HAS ALREADY BEEN PLANNED. The answers ARE
     the list, so this replaces the shapes — safe while a client is being
     set up, and a way to lose real work once anybody has authored a pillar.
     Asked of the STORED graph (§42), never of what the browser believes. */
  if (action === "shapeClient") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's set-up is not yours to change.");
    /* AN ARCHIVED CLIENT IS READ, NOT EDITED (§323, §42). The flow draws its
       fields read-only; without this the promise is the screen's alone and a
       console walks past it. Refused BY NAME, so the answer names the state
       rather than the permission — they are not the same errand. */
    if (row.status === "retired") return no(409, row.name + " is archived. Bring them back before changing anything.");
    const a = (body.shape || {}) as Record<string, unknown>;
    const list = (k: string) => Array.isArray(a[k]) ? (a[k] as unknown[]).slice(0, 200) : [];
    const answers = {
      companies: list("companies"), units: list("units"), functions: list("functions"),
      words: (a.words && typeof a.words === "object") ? a.words : {}
    };
    let held: { plans: number; capabilities: number } | null = null;
    await withTenant(row.id, async (c) => {
      const g = await readState(c);
      held = frozen.holds(g);
      if (held.plans || held.capabilities) return;
      await loadGraph(c, frozen.shape(g, answers));
    });
    const h = held as { plans: number; capabilities: number } | null;
    if (h && (h.plans || h.capabilities)) {
      return no(409, "This client already has a plan in it — " +
        (h.plans ? h.plans + " authored " + (h.plans === 1 ? "line" : "lines") : "") +
        (h.plans && h.capabilities ? " and " : "") +
        (h.capabilities ? h.capabilities + " " + (h.capabilities === 1 ? "capability" : "capabilities") : "") +
        ". Set-up rewrites the units and functions, so it stops here rather than " +
        "losing that. Change them on the client's own Setup pages instead.");
    }
    return ok({});
  }

  /* ── ARCHIVING A CLIENT, AND BRINGING ONE BACK (§323) ────────────────
     Islam: "we need an option to remove the client" — "both, demo client is
     not removable, and the name is Archive not put aside".

     ONE ACTION, BOTH DIRECTIONS, because it is one right and one row: `on`
     says which way. Two endpoints would be two places to forget the demo
     client in.

     THE STATE IS `status`, WHICH EVERYTHING DOWNSTREAM ALREADY READS —
     door.ts turns an archived client's address away exactly as it turns away
     one that never existed, and visibleClients keeps it off the cards. This
     writes the one column and nothing else follows it around. The stored word
     is `retired` and the label is "Archived" (§30.2, §65).

     AND THE TWO FACTS ARE CLEARED ON THE WAY BACK, never left standing: they
     describe the state the row is IN, so a live client carrying "archived 12
     Sep by Islam" is a value nobody chose (§50.6). */
  if (action === "archiveClient") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayArchiveClient(world, account, row)) {
      return no(403, row.kind === "demo"
        ? "The worked example is not archived — it is reseeded."
        : "Archiving a client is the platform admin's.");
    }
    const on = body.on !== false;
    if (on) {
      await pool.query("UPDATE tenants SET status = 'retired', archived_at = now(), archived_by = $2 WHERE id = $1",
        [row.id, account.email]);
    } else {
      await pool.query("UPDATE tenants SET status = 'active', archived_at = NULL, archived_by = NULL WHERE id = $1", [row.id]);
    }
    return ok({ status: on ? "retired" : "active" });
  }

  /* ── DELETING ONE ────────────────────────────────────────────────────
     THREE THINGS STAND IN FRONT OF THIS, and all three are asked HERE rather
     than on the screen (§42): the admin's right, the client being archived
     ALREADY, and the name typed back. A rule the page keeps and the endpoint
     does not is a rule anybody with a console can walk past.

     THE NAME IS COMPARED AS IT IS STORED, trimmed at both ends and nothing
     looser: a match that ignored case or spacing would be a smaller gate than
     the one the screen promises, and this is the press it exists for.

     IT RUNS ON THE OWNER POOL, AND THAT IS NOT A PREFERENCE. deleteTenant
     proves the delete by counting every tenant-owned table back to zero, and
     those tables are RLS-FORCED: as `smp_app`, with no tenant set, every one
     of those counts reads nought whatever survived — the assertion would pass
     because it could see nothing, which is the one way this check must never
     fail (§113.8). The owner bypasses the policy, so the count is real.

     EXPORTING FIRST IS THE CALLER'S STEP AND IT IS A PERSON'S, said on the
     screen rather than done here: there is nowhere to put a copy that this
     delete would not also reach. */
  if (action === "deleteClient") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayArchiveClient(world, account, row)) {
      return no(403, row.kind === "demo"
        ? "The worked example is not deleted — it is reseeded."
        : "Deleting a client is the platform admin's.");
    }
    if (!FF.mayDeleteClient(world, account, row)) {
      return no(409, "Archive " + row.name + " first. Deleting is only offered on a client that is already archived.");
    }
    if (String(body.confirm || "").trim() !== String(row.name).trim()) {
      return no(400, "Type the client's name exactly as it is written to confirm.");
    }
    const { counts } = await deleteTenant(ownerPool(), row.id);
    console.log("[platform] " + account.email + " deleted " + row.key + " (" + row.name + ") — " +
      Object.keys(counts).length + " tenant tables at zero");
    return ok({ deleted: row.key });
  }

  /* ── TURNING A MODULE ON OR OFF FOR ONE CLIENT (spec 046 §4.5) ──────
     Its own action rather than a field on saveClient, because it is a switch
     and not a box: it takes effect on the press, the way adding somebody to
     the team does, and there is nothing half-typed for a Save to rescue.

     OFF HIDES AND FORGETS NOTHING (§44, three times in this project now: a
     switch that destroys data is a delete with a friendly label). All this
     writes is the list; whatever the module held is still there when it comes
     back, and what leaves with it is the module's Setup group, which is the
     point — a group whose pages have nothing behind them is worse than no
     group (§61).

     THE REFUSALS ARE THE RULE, NOT THE SCREEN'S: the default module cannot be
     switched off, because it is where an address naming no module lands and a
     client without it could not be opened at its own front door; and a module
     that is not built cannot be switched on however the request is spelt. The
     drawer draws neither control, and the server refuses both anyway — a
     guard that only hides a control is decoration (§42, §44). */
  if (action === "setModules") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's configuration is not yours to change.");
    /* AND AN ARCHIVED CLIENT IS READ, NOT EDITED (§323), here as well as on
       saveClient and shapeClient — a rule kept at two of three doors is the
       drift this project keeps recording (§53.5), and the third door is the
       one somebody reaches with a console rather than with the drawer. */
    if (row.status === "retired") return no(409, row.name + " is archived. Bring them back before changing anything.");
    const key = String(body.module || "");
    if (!isModule(key)) return no(400, "There is no such module.");
    const on = body.on === true;
    if (key === DEFAULT_MODULE) return no(400, MODULE_DEF[DEFAULT_MODULE].label + " is where a client lands, so it cannot be switched off.");
    if (on && !MODULE_DEF[key].built) return no(400, MODULE_DEF[key].label + " is not built yet, so there is nothing to open.");
    const have = modulesFor(row.modules).filter((k) => k !== key);
    const next = on ? modulesFor([...have, key]) : have;
    await pool.query("UPDATE tenants SET modules = $2::jsonb WHERE id = $1", [row.id, JSON.stringify(next)]);
    return ok({ modules: next });
  }

  /* ── THE DOCUMENT ROOM (spec 049; spec 046 §4.9) ──────────────────────
     Publishing is Forefront's, so the authoring surface for a client's
     library is HERE, on their card, and the client's app has none at all.
     Every action below is the same three guards as setModules, in the same
     order, for the same reasons:

       · `mayReadConfig` first, and its refusal is the SAME 404 a client that
         does not exist gets — a consultant who may not open this client is
         not told it has a library;
       · `mayConfigureClient` next — whoever may turn the module on is who may
         publish to it. One rule rather than a second one to keep in step
         (§53.5), and it is already the narrowest thing on this page: the
         platform's admin, or that client's own Super user;
       · AN ARCHIVED CLIENT IS READ, NEVER WRITTEN (§323), which is the third
         door that rule is kept at rather than the two it started with.

     AND THE ROWS ARE THE CLIENT'S, so every one of them is reached through
     `withTenant` (§314) — the console reads a client's library exactly the
     way the client's own app does, through the policy and never around it. */
  if (action.startsWith("library")) {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    const kind = LIB.isKind(body.kind) ? body.kind : "insights";

    /* Reading is the one that stops at mayReadConfig: somebody who may see a
       client's configuration may see what has been published to them. */
    if (action === "library") {
      const rows = await withTenant(row.id, (c) => LIB.listItems(c, {
        kind, forClient: false, q: String(body.q || ""), category: String(body.category || ""), state: String(body.state || "") }));
      return ok({ items: rows.map((r) => LIB.shape(r, false)), categories: LIB.CATEGORIES, kind });
    }

    if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's library is not yours to publish to.");
    if (row.status === "retired") return no(409, row.name + " is archived. Bring them back before publishing anything.");

    /* Create or amend. WHAT IS ABSENT FROM THE FORM IS LEFT ALONE is the
       caller's business; what is enforced here is that a title is the one
       thing an item cannot be without — the database says so too (the
       library_title CHECK), so this refusal is the readable half of a rule
       that holds either way (§42). */
    if (action === "librarySave") {
      const d = LIB.draftOf(body);
      if (!d.title) return no(400, "A report needs a title.");
      const id = String(body.id || "");
      const saved = await withTenant(row.id, (c) => id ? LIB.updateItem(c, id, d) : LIB.insertItem(c, kind, d));
      if (!saved) return no(404, "That report is not there any more.");
      return ok({ item: LIB.shape(saved, false) });
    }

    /* Publishing and taking back. The state is named by the caller and
       checked here rather than trusted — an unknown word is a 400 and never
       a silent draft. */
    if (action === "libraryState") {
      const want = String(body.state || "");
      if (want !== "published" && want !== "draft") return no(400, "A report is published or it is a draft.");
      const saved = await withTenant(row.id, (c) => LIB.setState(c, String(body.id || ""), want, account.email));
      if (!saved) return no(404, "That report is not there any more.");
      return ok({ item: LIB.shape(saved, false) });
    }

    /* DELETE TAKES THE FILE WITH IT, and it is refused while the report is
       still in the client's library: withdrawing is what closes the door, so
       nobody deletes something a client is reading (spec 049 §4.8 — the guard
       rather than a second confirmation, which is §323's own shape). */
    /* ── THE FILE, IN PIECES (spec 049 §4.3) ─────────────────────────
       Three steps, because a serverless function refuses a body over about
       4.5MB and a report is bigger than that: begin, then one request per
       piece (app/api/platform/file), then finish. EVERY PIECE IS AUTHORISED
       rather than one address minted and then trusted (§261's rule, carried).

       THE PATH IS BUILT HERE AND NEVER SENT. A browser that could name the
       path could write over another client's file however good the guards
       above were, so it is derived from the tenant and the item's id — both
       of which are things the SERVER resolved. */
    if (action === "libraryUploadBegin") {
      if (!storeReady()) return no(503, "There is no file store set up yet, so a report cannot be uploaded. Everything else about the library works.");
      const item = await withTenant(row.id, (c) => LIB.oneItem(c, kind, String(body.id || ""), false));
      if (!item) return no(404, "That report is not there any more.");
      const size = Number(body.bytes || 0);
      if (!(size > 0)) return no(400, "That file is empty.");
      if (size > LIB.MAX_FILE_BYTES)
        return no(400, "That file is " + LIB.sizeLabel(size) + " — bigger than the " + LIB.sizeLabel(LIB.MAX_FILE_BYTES) + " a report may be.");
      const path = LIB.filePath(kind, row.id, item.id, String(body.name || ""));
      const up = await beginUpload(path, "application/pdf");
      if (!up) return no(503, "The file store would not take it. Nothing was changed.");
      return ok({ path, storeKey: up.key, uploadId: up.uploadId, piece: LIB.UPLOAD_PIECE_BYTES });
    }

    /* THE ROW IS WRITTEN ONLY ONCE THE STORE HAS THE WHOLE FILE, so a report
       never points at half an upload: if finishing fails the row still names
       the file it had, and the client's library is unchanged (§171 — and the
       old file is deliberately NOT removed here, because the row may still be
       pointing at it). */
    if (action === "libraryUploadFinish") {
      if (!storeReady()) return no(503, "There is no file store set up yet.");
      const id = String(body.id || ""), path = String(body.path || "");
      const item = await withTenant(row.id, (c) => LIB.oneItem(c, kind, id, false));
      if (!item) return no(404, "That report is not there any more.");
      if (path !== LIB.filePath(kind, row.id, item.id, String(body.name || "")))
        return no(400, "That file does not belong to this report.");
      /* `storeKey` AND NEVER `key`: `body.key` is the CLIENT's key, read at
         the top of this block, so a store key sent under that name would have
         been the client's slug handed to the store — a complete that could
         never succeed, and one nothing without a store could ever have found
         (§261.10's shape, §87's twins in a request body). The piece route has
         always spelt the two apart, which is why only this call was wrong. */
      const done = await finishUpload(path, String(body.storeKey || ""), String(body.uploadId || ""), body.parts || []);
      if (!done) return no(503, "The file store would not finish it. Nothing was changed.");
      const saved = await withTenant(row.id, (c) => LIB.setFile(c, id, path, String(body.name || ""), Number(body.bytes || 0)));
      if (!saved) return no(404, "That report is not there any more.");
      return ok({ item: LIB.shape(saved, false) });
    }

    if (action === "libraryDelete") {
      const id = String(body.id || "");
      const item = await withTenant(row.id, (c) => LIB.oneItem(c, kind, id, false));
      if (!item) return no(404, "That report is not there any more.");
      if (item.state === "published") return no(409, "Withdraw it first — it is in " + row.name + "'s library.");
      const path = await withTenant(row.id, (c) => LIB.deleteItem(c, id));
      const gone = path ? await dropBlob(path) : true;
      /* The row goes either way, and the answer SAYS which happened: a file
         the store no longer holds is not a reason to keep a row nobody can
         open, and a store that refused is worth knowing about rather than
         swallowing (§171: a failure nobody is told about is not a fix). */
      return ok({ removed: true, fileRemoved: gone });
    }
  }

  if (action === "createClient") {
    if (!FF.mayCreateClient(world, account)) return no(403, "Adding a client is the platform admin's.");
    const name = String(body.name || "").trim();
    if (!name) return no(400, "A client needs a name.");
    const key = slugFor(body.key || name);
    if (!key) return no(400, "That name does not make an address.");
    if (await clientByKey(pool, key)) return no(400, "There is already a client at /" + key + ".");
    /* THE ROW, THEN THE GRAPH IT STARTS WITH — AND IT IS EMPTY (§322).
       It used to be §67's cleared graph, which keeps the unit and function
       NAMES and empties their content: right for migration 004, which clears
       a deployment that is already this client's, and wrong for one that has
       never existed. Islam: "the default create it's own units and functions
       that's wrong there is not default. it should open blank if they want."
       So `frozen.bare()` — the same clear with the shapes emptied too — and
       the set-up flow writes what the client actually has. MADE HERE, so its
       register is the platform's to write into (§313.31). */
    const seed = JSON.parse(readFileSync(SEED, "utf8"));
    const t = (await pool.query("INSERT INTO tenants (key, name, industry, notes, size, made_here) VALUES ($1,$2,$3,$4,$5,true) RETURNING id",
      [key, name, String(body.industry || ""), String(body.notes || ""), String(body.size || "")])).rows[0];
    /* THE CLIENT'S OWN NAME, AND NOBODY ON ITS REGISTER BUT WHOEVER MADE IT.
       §67's cleared graph keeps the bootstrap SMO because a deployment with
       no way in is not a deployment (§21); on the shared schema the graph
       carries no people at all and the team is added on the card (setTeam).
       The unit and function names stay, as §67 left them, for Setup to
       rename. The creator is written below (§339). */
    const g: any = frozen.bare(seed);
    g.group.org = name;
    g.people = [];
    for (const k of g.functionKeys || []) if (g.functions[k]) g.functions[k].head = null;
    try { await withTenant(t.id, (c) => loadGraph(c, g)); }
    catch (e) {
      /* a client with no graph cannot be opened and would answer "not
         available" with no way to see why — so the row goes with the failure */
      await pool.query("DELETE FROM tenants WHERE id = $1", [t.id]).catch(() => {});
      throw e;
    }
    /* AND WHOEVER MADE IT IS ON ITS TEAM FROM THE START (§339). Islam, after
       §338: *"yes the one who create the client should appear from the
       start."* Until now they were on it by RULE and nowhere in the data —
       door.ts's seatFor gives a platform admin the Super user seat with no
       `tenant_users` row — and that absence is what §338 had to heal: the
       moment they added the first colleague, setTeam's sweep read the creator
       as nobody and retired the register row `officeRow` had minted for them.
       §338's heal stays and is what rescues a client already in that state;
       this stops the state arising for a client made from today.

       IT REVERSES "THE REGISTER STARTS EMPTY" (§313.31, §322) for exactly one
       row, and the FK is why the two writes cannot be one: `tenant_users`
       points at `people` by (tenant, key), so the register row is written
       FIRST — setTeam's own order, and its own comment says why (the
       constraint is deferred, not absent).

       A FAILURE HERE DOES NOT UNDO THE CLIENT, unlike the graph above: a
       client with no graph cannot be opened at all, while one whose creator's
       row did not land opens perfectly by rule and heals on the next request
       (§338). Destroying a made client over it would be the larger fault. */
    const personKey = officePersonKey(me.email);
    try {
      if (process.env.SMP_BREAK === "no-creator") throw new Error("no-creator");
      const T = { id: t.id, key, name, kind: "client" as const, status: "active", made_here: true, mark: null };
      await withTenant(t.id, (c) => officeRow(c, me, T, "super", personKey));
      await pool.query(
        "INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,'super') ON CONFLICT (tenant_id, user_id) DO NOTHING",
        [t.id, me.id, personKey]);
    } catch (e) { console.error("placing the creator on " + key + ":", (e as Error).message); }
    return ok({ key });
  }

  if (action === "setTeam") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's team is not yours to change.");
    const email = String(body.email || "").trim().toLowerCase();
    const who = await accountByEmail(pool, email);
    if (!who || who.kind !== "office") return no(400, "That is not somebody at Forefront.");
    if (body.on === false) {
      const seat = (await pool.query("SELECT person_key FROM tenant_users WHERE user_id = $1 AND tenant_id = $2", [who.id, row.id])).rows[0];
      await pool.query("DELETE FROM tenant_users WHERE user_id = $1 AND tenant_id = $2", [who.id, row.id]);
      /* retired, never deleted (§35, §62): the seat goes with the row's standing */
      if (seat && seat.person_key) {
        try {
          await withTenant(row.id, (c) => c.query("UPDATE people SET role = '', extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{active}', 'false'::jsonb) WHERE key = $1", [seat.person_key]));
        } catch (e) { console.error("retiring " + seat.person_key + " in " + row.key + ":", (e as Error).message); }
      }
      return ok({});
    }
    let personKey = officePersonKey(email);
    const asKey = String(body.personKey || "").trim();
    if (!asKey && !row.made_here) {
      /* on a client that brought its own register, saying who they are is
         required (§313.30/31) — nothing is created there */
      let peopled = false;
      try { peopled = await withTenant(row.id, async (c) => ((await c.query("SELECT 1 FROM people LIMIT 1")).rowCount || 0) > 0); }
      catch (e) { console.error("reading " + row.key + "'s register:", (e as Error).message); }
      const has = (await pool.query("SELECT person_key FROM tenant_users WHERE user_id = $1 AND tenant_id = $2", [who.id, row.id])).rows[0];
      if (peopled && !has) return no(400, "Say who they are on this client's register — nobody is created there.");
    }
    if (asKey && asKey !== personKey) {
      let there = false;
      try { there = await withTenant(row.id, async (c) => ((await c.query("SELECT 1 FROM people WHERE key = $1", [asKey])).rowCount || 0) > 0); }
      catch (e) { console.error("checking " + asKey + " in " + row.key + ":", (e as Error).message); }
      if (!there) return no(400, "That person is not on this client's register.");
      personKey = asKey;
    }
    const seat = FF.SEAT_KEYS.indexOf(String(body.seat)) > -1 ? String(body.seat) : "smoteam";
    /* THE ROW IS WRITTEN FIRST on a client made here (§313.31), so the
       deferred FK on tenant_users has a row to point at when it commits. */
    if (row.made_here) {
      try {
        await withTenant(row.id, (c) => officeRow(c, { id: who.id, email: who.email, name: who.name, kind: "office", isAdmin: !!who.is_admin, mustChange: false }, row, seat as any, personKey));
      } catch (e) { console.error("seat into " + row.key + ":", (e as Error).message); }
    }
    /* a client may have more than one super user (§313.26): nothing is
       demoted; the person key moves only when it was asked for */
    await pool.query(
      "INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4) " +
      "ON CONFLICT (tenant_id, user_id) DO UPDATE SET seat = EXCLUDED.seat, person_key = COALESCE($5, tenant_users.person_key)",
      [row.id, who.id, personKey, seat, asKey || null]);
    const landed = (await pool.query("SELECT person_key FROM tenant_users WHERE user_id = $1 AND tenant_id = $2", [who.id, row.id])).rows[0];
    const key2 = landed ? landed.person_key : personKey;
    const team = (await pool.query("SELECT person_key FROM tenant_users WHERE tenant_id = $1", [row.id])).rows.map((x: any) => x.person_key);
    try {
      await withTenant(row.id, async (c) => {
        /* a row the platform minted and nobody is any more is retired (§313.30) */
        await c.query("UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{active}', 'false'::jsonb) WHERE extra->>'ffrow' = 'true' AND key <> ALL($1::text[])", [team]);
        /* the seat reaches the register — on a row the platform minted only (§313.29) */
        await c.query("UPDATE people SET role = $2 WHERE key = $1 AND extra->>'ffrow' = 'true'", [key2, seat]);
      });
    } catch (e) { console.error("seat into " + row.key + ":", (e as Error).message); }
    return ok({});
  }

  /* ── Who sees what ── */
  if (action === "access") {
    return ok({ areas: FF.AREAS, defaults: FF.ACCESS_DEFAULTS[FF.EVERYONE], stored: world.access[FF.EVERYONE] || {}, canEdit: FF.mayEditAccess(world, account) });
  }
  if (action === "saveAccess") {
    if (!FF.mayEditAccess(world, account)) return no(403, "This table is the platform admin's.");
    const areaKey = String(body.area || "");
    const area = FF.AREAS.find((a: any) => a.key === areaKey);
    if (!area) return no(400, "There is no such column.");
    const state = String(body.grant || "");
    if (area.states.indexOf(state) < 0) return no(400, "That is not a setting for that column.");
    if (state === FF.ACCESS_DEFAULTS[FF.EVERYONE][areaKey]) await pool.query("DELETE FROM platform_access WHERE role_key = $1 AND area_key = $2", [FF.EVERYONE, areaKey]);
    else await pool.query("INSERT INTO platform_access (role_key, area_key, grant_) VALUES ($1,$2,$3) ON CONFLICT (role_key, area_key) DO UPDATE SET grant_ = EXCLUDED.grant_", [FF.EVERYONE, areaKey, state]);
    return ok({});
  }
  return no(400, "unknown action");
}

/* ── ONE PIECE OF A REPORT (spec 049) ────────────────────────────────────
   Its own export rather than an `action`, because the body is RAW BYTES and
   every other call to this endpoint is JSON — the same split §261 made for
   the same reason, and the query is where the naming rides.

   IT ASKS THE SAME QUESTIONS THE OTHER LIBRARY ACTIONS ASK, in the same
   order, because a piece that skipped them would be the way past all of them:
   a piece is the only part of an upload that carries the file's actual
   contents. The path is REBUILT from the tenant and the item here too and
   compared with the one sent — a browser that could name its own path could
   write over another client's file. */
export async function libraryPart(pool: Q, me: SessionUser, q: URLSearchParams, bytes: Buffer): Promise<Answer> {
  if (me.kind === "client") return no(403, "That is not something this account opens.");
  const account: Account = { id: me.id, email: me.email, name: me.name, is_admin: me.isAdmin, kind: me.kind, status: "active" };
  const world = await worldFor(pool, me.id);
  const row = await clientByKey(pool, q.get("client"));
  if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
  if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's library is not yours to publish to.");
  if (row.status === "retired") return no(409, row.name + " is archived.");
  if (!storeReady()) return no(503, "There is no file store set up yet.");

  const kind = LIB.isKind(q.get("kind")) ? (q.get("kind") as LIB.Kind) : "insights";
  const id = String(q.get("id") || ""), path = String(q.get("path") || "");
  const key = String(q.get("storeKey") || ""), uploadId = String(q.get("uploadId") || "");
  const n = Number(q.get("n") || 0);
  if (!id || !path || !key || !uploadId || !(n > 0)) return no(400, "That piece names nothing.");
  if (!bytes || !bytes.length) return no(400, "That piece is empty.");
  if (bytes.length > LIB.UPLOAD_PIECE_BYTES + 1024) return no(413, "That piece is too big.");

  const item = await withTenant(row.id, (c) => LIB.oneItem(c, kind, id, false));
  if (!item) return no(404, "That report is not there any more.");
  if (path !== LIB.filePath(kind, row.id, item.id, String(q.get("name") || "")))
    return no(400, "That file does not belong to this report.");

  /* THE FIRST PIECE IS WHAT SAYS IT IS A PDF, checked by its own first bytes
     and never by the name it arrived under (spec 049 §5). A later piece
     cannot be checked — it is the middle of a file — which is exactly why the
     first one is. */
  if (n === 1 && !LIB.looksLikePdf(bytes))
    return no(400, "That is not a PDF. A report has to be one, whatever the file is called.");

  const etag = await putPart(path, key, uploadId, n, bytes);
  if (!etag) return no(503, "The file store would not take that piece.");
  return ok({ partNumber: n, etag });
}
