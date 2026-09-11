/* S7 — the door (contracts/tenant-request.md §1–§2). A client user at another
   client's slug lands on their own; an office user not on a tenant is refused
   IDENTICALLY to a slug that does not exist; must_change blocks the tenant
   before any tenant is set; the limiter answers before the password does.

     node spike/s7-door.mjs
     node spike/s7-door.mjs --break=follow-slug     (RED: the client branch follows the slug)
     node spike/s7-door.mjs --break=two-refusals    (RED: nonexistent 404, refused 403) */
import { makeDb, seedTwoTenants, check, fail, finish, brk } from "./_harness.mjs";
import * as auth from "../lib/auth.ts";
import * as door from "../lib/door.ts";

const db = await makeDb();
try {
  const { A, B } = await seedTwoTenants(db.owner);
  const pw = "Right-1234!";
  const mk = async (email, kind, isAdmin, mustChange) =>
    (await db.owner.query("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [email, email, kind, isAdmin, mustChange, auth.hashPassword(pw)])).rows[0].id;
  const clientU = await mk("client@a.co", "client", false, false);
  const officeU = await mk("office@ff.co", "office", false, false);
  const adminU = await mk("admin@ff.co", "office", true, false);
  const mustU = await mk("new@a.co", "client", false, true);
  await db.owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,'k','none'), ($1,$3,'k','smoteam'), ($1,$4,'k','none')", [A, clientU, officeU, mustU]);
  const app = db.app;

  /* sign in through the real door: a real hash, a real session row */
  const s1 = await auth.signIn(app, "client@a.co", pw, "1.1.1.1");
  check(s1.ok, "sign-in with the right password makes a session", s1.ok ? "" : s1.message);
  const bad = await auth.signIn(app, "client@a.co", "wrong", "1.1.1.1");
  check(!bad.ok && bad.message === "That email and password do not match.", "a wrong password is refused in the one sentence", bad.message);
  const me = await auth.getSession(app, s1.ok ? s1.token : null);
  check(me && me.email === "client@a.co" && me.kind === "client", "the cookie's token resolves to the user", JSON.stringify(me));
  const office = (await auth.signIn(app, "office@ff.co", pw, "2.2.2.2"));
  const officeMe = await auth.getSession(app, office.token);
  const admin = await auth.signIn(app, "admin@ff.co", pw, "3.3.3.3");
  const adminMe = await auth.getSession(app, admin.token);
  const must = await auth.signIn(app, "new@a.co", pw, "4.4.4.4");
  const mustMe = await auth.getSession(app, must.token);

  const followSlug = brk("follow-slug"), twoRefusals = brk("two-refusals");
  /* the breaks are applied by wrapping resolveTenant, so the shape under test is the door's own */
  const bKey = (await db.owner.query("SELECT key FROM tenants WHERE id = $1", [B])).rows[0].key;
  const resolve = async (user, slug) => {
    const ans = await door.resolveTenant(app, user, slug);
    if (followSlug && user && user.kind === "client" && ans.status === 302) {
      const t = await door.tenantByKey(app, slug); if (t) return { ok: true, tenant: t, seat: "none", personKey: "k" };
    }
    if (twoRefusals && ans.status === door.NO_SUCH_STATUS) {
      const t = await door.tenantByKey(app, slug);
      return t ? { ok: false, status: 403, message: "You are not on that client." } : ans;
    }
    return ans;
  };

  /* 1 · client user at B's slug → 302 to A's */
  const r1 = await resolve(me, bKey);
  check(r1.ok === false && r1.status === 302 && r1.redirect === "/a-co", "a client user at B's slug is sent to their own (/a-co)", JSON.stringify(r1));
  const r1b = await resolve(me, "a-co");
  check(r1b.ok === true && r1b.tenant.id === A, "…and at their own slug they are in", JSON.stringify(r1b).slice(0, 80));
  /* 2 · office user with no membership on B → refused */
  const r2 = await resolve(officeMe, bKey);
  check(r2.ok === false && r2.status === door.NO_SUCH_STATUS && r2.message === door.NO_SUCH_TENANT, "an office user not on B is refused", JSON.stringify(r2));
  /* 3 · a slug that does not exist → byte-identical to 2 */
  const r3 = await resolve(officeMe, "no-such-client");
  check(JSON.stringify(r3) === JSON.stringify(r2), "a nonexistent slug answers byte-identically to the refusal", JSON.stringify(r3) + " vs " + JSON.stringify(r2));
  const r3c = await resolve(me, "no-such-client");
  check(r3c.ok === false && r3c.status === 302 && r3c.redirect === "/a-co", "a client user at a nonexistent slug is also sent home", JSON.stringify(r3c));
  /* 3b · the admin opens B with no membership, holding the super seat */
  const r3b = await resolve(adminMe, bKey);
  check(r3b.ok === true && r3b.seat === "super", "the admin opens a client nobody is on, holding its Super user seat", JSON.stringify(r3b).slice(0, 80));
  /* 4 · must_change blocks before any tenant */
  const r4 = await resolve(mustMe, "a-co");
  check(r4.ok === false && r4.status === 403 && r4.code === "MUST_CHANGE", "must_change blocks the tenant route", JSON.stringify(r4));
  const r4b = await door.resolveTenant(app, mustMe, "a-co", { passwordRoute: true });
  check(r4b.ok === true, "…and not the password route", JSON.stringify(r4b).slice(0, 60));
  const err = await auth.changePassword(app, mustU, must.token, "New-Pass-99!");
  const afterMe = await auth.getSession(app, must.token);
  check(err === null && afterMe && afterMe.mustChange === false, "a password change clears must_change and keeps THIS session", err + " " + JSON.stringify(afterMe));
  /* 5 · the limiter: 8 failures on one email, then refused with the one sentence, cleared by a success */
  for (let i = 0; i < 8; i++) await auth.signIn(app, "client@a.co", "wrong", "9.9.9.9");
  const r5 = await auth.signIn(app, "client@a.co", pw, "9.9.9.9");
  check(!r5.ok && /Too many sign-in attempts/.test(r5.message), "the 9th attempt is refused even with the RIGHT password", r5.ok ? "accepted" : r5.message);
  await db.owner.query("DELETE FROM login_attempts");
  const r5b = await auth.signIn(app, "client@a.co", pw, "9.9.9.9");
  const left = (await db.owner.query("SELECT count(*)::int AS n FROM login_attempts WHERE key_tried = 'client@a.co'")).rows[0].n;
  check(r5b.ok && left === 0, "a success clears that email's failures", left);
  /* 6 · the slug never reaches SQL as a schema, and no default: no user → refused */
  const r6 = await door.resolveTenant(app, null, "a-co");
  check(r6.ok === false && r6.status === door.NO_SUCH_STATUS, "no session → the same refusal, no default tenant", JSON.stringify(r6));
} catch (e) { fail("S7 ran", (e.code || "") + " " + e.message + "\n" + (e.stack || "").split("\n").slice(0, 4).join("\n")); }
await db.drop();
finish();
