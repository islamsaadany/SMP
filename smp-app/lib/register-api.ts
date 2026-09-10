/* ── THE REGISTER'S FIVE DOOR ACTIONS (§316.7, porting api/auth.js) ───────
   Phase E's second piece of porting, and the one the Setup screens cannot do
   without: passwordStates, setPassword, issueTemporary, declarations and
   dismissWhere. Carried across whole — every decision in api/auth.js is kept
   and none re-argued; what changes is WHERE a password lands.

   `platform.accounts` is `users` and `platform.account_clients` is
   `tenant_users` (§314): one login, keyed by address, tied to a tenant as a
   person. The address is still what the door takes, so somebody on the
   register with no address still cannot be given a password — said plainly
   with the thing to go and do, never refused as "not allowed" (§16.7).

   TWO GATES, AND THEY ARE NOT THE SAME GATE. Reading and answering a
   declaration is the SUPER USER's (`role === "super"`); the password actions
   are the OFFICE's, with setPassword narrowed BY TARGET — a team member may
   reset the client's people and never a Super user's or another team member's
   (§89). Both are asked HERE and not trusted from the screen (§42). */
import type { PoolClient } from "pg";
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { appPool } from "./db.ts";
import { hashPassword, passwordPolicy } from "./auth.ts";
import type { Person } from "./state-api.ts";

const R = createRequire(import.meta.url)("./rules.cjs");

export type RegAnswer = { code: number; body: unknown };
const isOffice = (p: { role?: string }) => R.isOfficeRole(p.role || "");

/* Ending somebody's sessions is a PLATFORM act — sessions are keyed on the
   login, not on the tenant — so it runs on the pool rather than inside the
   tenant transaction, and it takes ADDRESSES because that is what a login is
   named by here. */
async function endSessionsFor(emails: string[]): Promise<void> {
  const list = emails.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean);
  if (!list.length) return;
  await appPool().query(
    "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))", [list]);
}
/* One login, and the row that ties it to this tenant as this person. Without
   the second row they would have a password and nowhere to use it. */
async function issueTo(c: PoolClient, tenantId: string, email: string, name: string, key: string, hash: string): Promise<void> {
  const u = await c.query(
    "INSERT INTO users (email, name, kind, password_hash, must_change) VALUES ($1,$2,'client',$3,true) " +
    "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_change = true, updated_at = now() " +
    "RETURNING id", [email, name || "", hash]);
  await c.query(
    "INSERT INTO tenant_users (tenant_id, user_id, person_key) VALUES ($1,$2,$3) " +
    "ON CONFLICT (tenant_id, user_id) DO NOTHING", [tenantId, u.rows[0].id, key]);
}

export async function registerAction(tenantId: string, person: Person, action: string, body: any): Promise<RegAnswer> {

  /* Who has a password, and is it still the temporary one. The People page
     cannot draw its column without this and cannot derive it from the state
     graph: credentials live outside the graph and deliberately never enter it
     (§19). Keys and states only — no hash, no timestamp, nothing that helps
     anyone guess. A person with no login has no password, which is the same
     dash the column has always drawn for "we never asked" (§35). */
  if (action === "passwordStates") {
    if (!isOffice(person)) return { code: 403, body: { ok: false, error: "Passwords are the SMO's." } };
    return withTenant(tenantId, async (c) => {
      const rows = (await c.query(
        "SELECT p.key, u.must_change FROM people p " +
        "LEFT JOIN tenant_users tu ON tu.tenant_id = $1 AND tu.person_key = p.key " +
        "LEFT JOIN users u ON u.id = tu.user_id", [tenantId])).rows;
      const states: Record<string, string> = {};
      rows.forEach((r: any) => { states[r.key] = r.must_change == null ? "none" : (r.must_change ? "temporary" : "set"); });
      return { code: 200, body: { ok: true, states } };
    });
  }

  if (action === "setPassword") {
    if (!isOffice(person)) return { code: 403, body: { ok: false, error: "Issuing passwords is the SMO's." } };
    /* LOWERCASED, BECAUSE THE DOOR LOWERCASES (§69.11): a key stored as it
       arrived while the door compares a lowercased one writes a credential
       nothing can ever match — the correct password refused for ever, with
       nothing saying why. */
    const key = String(body.person || "").trim().toLowerCase();
    return withTenant(tenantId, async (c) => {
      const target = (await c.query(
        "SELECT key, name, role, COALESCE(extra->>'email','') AS email FROM people WHERE key = $1", [key])).rows[0];
      if (!target) return { code: 400, body: { ok: false, error: "No person with key " + key + "." } };
      /* NAMED, NOT VAGUE (§16.7): which rule stopped them, and who can do it. */
      if (person.role !== "super" && isOffice(target))
        return { code: 403, body: { ok: false, error: "That is the strategy office's own account. A Super user resets those." } };
      const why = passwordPolicy(body.password);
      if (why) return { code: 400, body: { ok: false, error: "The password needs " + why + "." } };
      const addr = String(target.email || "").trim().toLowerCase();
      if (!addr) return { code: 400, body: { ok: false, error:
        "That person has no email address on the register, and people sign in by email. " +
        "Add their address first, then issue the password." } };
      await issueTo(c, tenantId, addr, target.name, key, hashPassword(body.password));
      /* Admin-issued passwords are temporary and their existing sessions end —
         a reset is usually a lockout or a handover, and either way old
         sessions die. */
      await endSessionsFor([addr]);
      return { code: 200, body: { ok: true } };
    });
  }

  /* Bulk issue: ONE temporary password, set for everyone who has none.
     THE SERVER DECIDES WHO IS IN THE SET — the client sends a scope, never a
     list, so the worst a bad request can do is nothing. */
  if (action === "issueTemporary") {
    if (!isOffice(person)) return { code: 403, body: { ok: false, error: "Issuing passwords is the SMO's." } };
    const why = passwordPolicy(body.password);
    if (why) return { code: 400, body: { ok: false, error: "The password needs " + why + "." } };
    const hash = hashPassword(body.password);
    const all = body.scope === "all";
    return withTenant(tenantId, async (c) => {
      /* AND THE SET SHRINKS FOR THE SMO TEAM (§89): a Super user reaches
         everybody, a team member reaches the client's people, and the office's
         own rows are excluded IN SQL rather than trusted to have been left out
         of a list nobody sent. Retired people are excluded from both — §35
         turns them away at the door with the correct password, so issuing them
         one is issuing a password that cannot be used. */
      const officeOnly = person.role !== "super" ? " AND COALESCE(p.role,'') NOT IN ('super','smoteam')" : "";
      const rows = (await c.query(
        "SELECT p.key, p.name, lower(trim(COALESCE(p.extra->>'email',''))) AS email FROM people p " +
        "WHERE COALESCE(p.extra->>'active','true') <> 'false' AND p.key <> $1" + officeOnly,
        [person.key])).rows;
      /* PEOPLE WITH NO ADDRESS ARE NOT IN THE SET, and they are COUNTED rather
         than passed over in silence — "12 issued" when the register holds 20
         is a number somebody has to explain. */
      const withAddress = rows.filter((r: any) => !!r.email);
      const noAddress = rows.filter((r: any) => !r.email).map((r: any) => r.name || r.key);
      const held = (await c.query(
        "SELECT tu.person_key FROM tenant_users tu WHERE tu.tenant_id = $1", [tenantId])
      ).rows.map((r: any) => r.person_key);
      /* 'none' (the default) reaches only people who never had a password: it
         can lock nobody out. 'all' is a RESET, so it ends their other sessions
         and EXCLUDES THE PERSON ASKING — mistype the shared password while
         resetting everybody and the SMO has locked themselves out of their own
         deployment with no second SMO to ask (§43). */
      const set = all ? withAddress : withAddress.filter((r: any) => held.indexOf(r.key) < 0);
      const issued: string[] = [];
      for (const r of set) { await issueTo(c, tenantId, r.email, r.name, r.key, hash); issued.push(r.key); }
      if (all && issued.length) await endSessionsFor(set.map((r: any) => r.email));
      return { code: 200, body: { ok: true, issued, noAddress } };
    });
  }

  /* Where people say they work (§56), and the SMO's other answer (§180). */
  if (action === "declarations") {
    if (person.role !== "super") return { code: 403, body: { ok: false, error: "The register is the SMO's." } };
    return withTenant(tenantId, async (c) => {
      const rows = (await c.query("SELECT person_key, at, dismissed_on FROM bu_declarations")).rows;
      /* §180 · TWO SHAPES, DELIBERATELY. An undismissed declaration is still
         the bare string it has always been; only a DISMISSED one becomes
         {at, dismissed}, which an older client reads as an object and draws no
         note for — the safe way round, since the one it cannot understand is
         the one already answered (§58: write the new shape, leave the old one
         readable). */
      const said: Record<string, unknown> = {};
      rows.forEach((r: any) => { said[r.person_key] = r.dismissed_on ? { at: r.at, dismissed: r.dismissed_on } : r.at; });
      return { code: 200, body: { ok: true, said } };
    });
  }

  if (action === "dismissWhere") {
    if (person.role !== "super") return { code: 403, body: { ok: false, error: "The register is the SMO's." } };
    const key = String(body.person || "").trim();
    if (!key) return { code: 400, body: { ok: false, error: "Which person?" } };
    return withTenant(tenantId, async (c) => {
      /* Nothing is INSERTED: dismissing something nobody said is not a state
         this table should be able to hold, so an unknown key changes nothing
         and says so rather than inventing a row (§15.1). */
      const r = await c.query(
        "UPDATE bu_declarations SET dismissed_on = now(), dismissed_by = $2 WHERE person_key = $1", [key, person.key]);
      if (!r.rowCount) return { code: 404, body: { ok: false, error: "They have not said where they work." } };
      return { code: 200, body: { ok: true } };
    });
  }

  return { code: 400, body: { ok: false, error: "Unknown action." } };
}
export const REGISTER_ACTIONS = new Set(["setPassword", "issueTemporary", "passwordStates", "dismissWhere", "declarations"]);
