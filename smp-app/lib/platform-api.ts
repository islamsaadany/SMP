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
type ClientRow = Tenant & { industry: string; notes: string; size: string };

const CLIENT_COLS = "id, key, name, kind, status, mark, industry, notes, size, made_here";
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
        canConfig: FF.mayReadConfig(world, account, row), units: facts.units, planned: facts.planned, cycleOpen: facts.cycleOpen, unreadable: !!facts.unreadable });
    }
    return ok({ cards, canAdd: FF.mayCreateClient(world, account), canConsultants: FF.mayReadConsultants(world, account), canAccess: FF.mayEditAccess(world, account) });
  }

  /* ── Forefront's own people ── */
  if (action === "consultants") {
    if (!FF.mayReadConsultants(world, account)) return no(403, "The consultants list is not yours to open.");
    const rows = (await pool.query(
      "SELECT u.email, u.name, u.is_admin, u.status, u.must_change, " +
      "  COALESCE((SELECT json_agg(json_build_object('client', t.name, 'key', t.key, 'seat', m.seat) ORDER BY t.name) " +
      "            FROM tenant_users m JOIN tenants t ON t.id = m.tenant_id WHERE m.user_id = u.id), '[]'::json) AS seats " +
      "FROM users u WHERE u.kind = 'office' ORDER BY u.name")).rows;
    return ok({ people: rows.map((r: any) => ({ email: r.email, name: r.name, isAdmin: !!r.is_admin, status: r.status, seats: r.seats, password: r.must_change ? "temporary" : "set" })),
      canEdit: FF.mayManageConsultants(world, account), canSetAdmin: FF.isAdmin(account), me: account.email });
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
    if (existing) {
      await pool.query("UPDATE users SET name = COALESCE($2, name), status = COALESCE($3, status), updated_at = now() WHERE id = $1", [existing.id, body.name || null, body.status || null]);
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
    /* ── THE SHAPE THE SET-UP FLOW OPENS WITH (§320) ──────────────────
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
    const { id: _id, ...client } = row;
    return ok({ client, team: await teamOf(pool, row.id), seats: FF.SEATS, canEdit: FF.mayConfigureClient(world, account, row), register,
      shape, holds,
      office: (await pool.query("SELECT email, name, is_admin FROM users WHERE kind = 'office' AND status = 'active' ORDER BY name")).rows });
  }

  if (action === "saveClient") {
    const row = await clientByKey(pool, body.key);
    if (!row || !FF.mayReadConfig(world, account, row)) return no(404, NO_CLIENT);
    if (!FF.mayConfigureClient(world, account, row)) return no(403, "This client's configuration is not yours to change.");
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

  /* ── SETTING A CLIENT UP, FROM THE OUTSIDE (§320) ────────────────────
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

  if (action === "createClient") {
    if (!FF.mayCreateClient(world, account)) return no(403, "Adding a client is the platform admin's.");
    const name = String(body.name || "").trim();
    if (!name) return no(400, "A client needs a name.");
    const key = slugFor(body.key || name);
    if (!key) return no(400, "That name does not make an address.");
    if (await clientByKey(pool, key)) return no(400, "There is already a client at /" + key + ".");
    /* THE ROW, THEN THE GRAPH IT STARTS WITH — AND IT IS EMPTY (§320).
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
    /* THE CLIENT'S OWN NAME, AND NOBODY ON ITS REGISTER. §67's cleared
       graph keeps the bootstrap SMO because a deployment with no way in is
       not a deployment (§21); on the shared schema the platform's admin
       opens a client by rule (door.ts seatFor) and the team is added on the
       card (setTeam) — so the register starts EMPTY, and the org is the
       client's. The unit and function names stay, as §67 left them, for
       Setup to rename. */
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
