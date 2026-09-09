/* How a request learns which tenant it is for (spec 043 §4.4,
   contracts/tenant-request.md §1).

   1. the session → the users row, or 401; must_change → MUST_CHANGE for
      every route but the password change (§43.2);
   2. the slug → an ACTIVE tenants row, or refused;
   3. may this user open it — a `client` user only their one membership (a
      different slug sends them to their own, §313.36's landingFor); an
      office user through a membership, is_admin, or platform_access
      (mayOpenClient, ported from lib/platform-rules.js);
   4. refused and non-existent answer IDENTICALLY — one status, one sentence
      (§313's one refusal: a door that says "sign in" for a client that exists
      and "no such client" for one that does not has listed Forefront's
      clients one slug at a time);
   5. only then is app.tenant_id set, from the row's id — the slug text never
      reaches SQL, and there is no default tenant. */
import type { Pool, PoolClient } from "pg";
import type { SessionUser } from "./auth.ts";

type Q = Pool | PoolClient;

export const NO_SUCH_TENANT = "That client is not available.";
export const NO_SUCH_STATUS = 404;

export type Tenant = { id: string; key: string; name: string; kind: "client" | "demo"; status: string; made_here: boolean };
export type Membership = { tenant_id: string; person_key: string; seat: "super" | "smoteam" | "none" };
export type DoorAnswer =
  | { ok: true; tenant: Tenant; seat: Membership["seat"] | null; personKey: string | null }
  | { ok: false; status: 302; redirect: string }
  | { ok: false; status: 403; code: "MUST_CHANGE" }
  | { ok: false; status: typeof NO_SUCH_STATUS; message: typeof NO_SUCH_TENANT };

const refused = (): DoorAnswer => ({ ok: false, status: NO_SUCH_STATUS, message: NO_SUCH_TENANT });

/* lib/platform-rules.js's grantIn / clientState / mayOpenClient, ported. The
   world is the office user's memberships and the platform's own matrix. */
const RANK: Record<string, number> = { none: 0, hidden: 0, listed: 1, view: 1, open: 2, edit: 2, yes: 2 };
function atLeast(state: string, want: string): boolean { return (RANK[state] ?? 0) >= (RANK[want] ?? 0); }
function grantIn(access: Record<string, Record<string, string>>, roleKey: string, area: string): string {
  return (access[roleKey] && access[roleKey][area]) || "none";
}
export function clientState(user: SessionUser, mine: Membership[], access: Record<string, Record<string, string>>, tenant: Tenant | null): string {
  if (!tenant) return "hidden";
  if (user.kind === "client") return mine.some((m) => m.tenant_id === tenant.id) ? "open" : "hidden";
  if (user.isAdmin) return "open";
  if (mine.some((m) => m.tenant_id === tenant.id)) return "open";
  if (tenant.kind === "demo") return grantIn(access, "consultant", "demo") === "none" ? "hidden" : "open";
  return grantIn(access, "consultant", "other_clients");
}
export function mayOpen(user: SessionUser, mine: Membership[], access: Record<string, Record<string, string>>, tenant: Tenant | null): boolean {
  return atLeast(clientState(user, mine, access, tenant), "open");
}

export async function memberships(c: Q, userId: string): Promise<Membership[]> {
  return (await c.query("SELECT tenant_id, person_key, seat FROM tenant_users WHERE user_id = $1", [userId])).rows;
}
async function platformAccess(c: Q): Promise<Record<string, Record<string, string>>> {
  const rows = (await c.query("SELECT role_key, area_key, grant_ FROM platform_access")).rows as { role_key: string; area_key: string; grant_: string }[];
  return rows.reduce((m, r) => { (m[r.role_key] ||= {})[r.area_key] = r.grant_; return m; }, {} as Record<string, Record<string, string>>);
}
export async function tenantByKey(c: Q, slug: string): Promise<Tenant | null> {
  const r = await c.query("SELECT id, key, name, kind, status, made_here FROM tenants WHERE key = $1 AND status = 'active'", [String(slug || "")]);
  return r.rowCount ? r.rows[0] : null;
}

/* Where a signed-in user lands with no slug: their one client, or the
   platform's own pages. */
export async function landingFor(c: Q, user: SessionUser): Promise<string> {
  if (user.kind !== "client") return "/platform";
  const mine = await memberships(c, user.id);
  if (mine.length !== 1) return "/";
  const t = (await c.query("SELECT key FROM tenants WHERE id = $1 AND status = 'active'", [mine[0].tenant_id])).rows[0];
  return t ? "/" + t.key : "/";
}

export async function resolveTenant(c: Q, user: SessionUser | null, slug: string, opts: { passwordRoute?: boolean } = {}): Promise<DoorAnswer> {
  if (!user) return { ok: false, status: NO_SUCH_STATUS, message: NO_SUCH_TENANT };
  if (user.mustChange && !opts.passwordRoute) return { ok: false, status: 403, code: "MUST_CHANGE" };
  const tenant = await tenantByKey(c, slug);
  const mine = await memberships(c, user.id);
  if (user.kind === "client") {
    /* exactly their one row; a different slug — or one that does not exist —
       sends them to their own, and a client user on no tenant is refused */
    if (mine.length !== 1) return refused();
    if (tenant && mine[0].tenant_id === tenant.id) return { ok: true, tenant, seat: mine[0].seat, personKey: mine[0].person_key };
    const own = await landingFor(c, user);
    return own === "/" ? refused() : { ok: false, status: 302, redirect: own };
  }
  if (!tenant) return refused();
  const access = await platformAccess(c);
  if (!mayOpen(user, mine, access, tenant)) return refused();
  const seat = mine.find((m) => m.tenant_id === tenant.id);
  /* the admin arriving with no seat holds the client's own Super user seat —
     somebody has to open a client nobody is on yet (seatFor) */
  return { ok: true, tenant, seat: seat ? seat.seat : user.isAdmin ? "super" : null, personKey: seat ? seat.person_key : null };
}
