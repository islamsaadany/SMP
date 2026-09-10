import { NextResponse } from "next/server";
import { doorPool, signOut } from "../../../lib/auth.ts";
import { requestToken, requestUser, SLUG } from "../../../lib/session.ts";
import { resolveTenant, NO_SUCH_TENANT } from "../../../lib/door.ts";
import { personFor, NoPerson, type Resolved } from "../../../lib/state-api.ts";
import { registerAction, REGISTER_ACTIONS } from "../../../lib/register-api.ts";

export const dynamic = "force-dynamic";

/* THE FROZEN SPELLING OF THE DOOR'S ACTIONS. sync.js posts `{action}` to
   /api/auth (the frozen api/auth.js's one-endpoint shape). The door itself
   is the routes beside this (contracts §2); this answers the shell's own
   spelling. `logout` is the one the shell needs to run at all (Sign out on
   the chrome); the register's five — setPassword, issueTemporary,
   passwordStates, dismissWhere, declarations — are ported at §316.7.

   THE SLUG RIDES THE BODY here, because that is where `authPost` puts it
   (sync.js's withClientBody) — the same name to look up at the door as every
   other endpoint takes, and never a schema (§36.4). A raw database message is
   a free map of the inside of this deployment (§43), so it goes to the log
   and the person gets one sentence. */
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

async function resolved(req: Request, slug: string): Promise<{ ok: true; r: Resolved } | { ok: false; res: Response }> {
  if (!slug || !SLUG.test(slug)) return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  const user = await requestUser(req);
  if (!user) return { ok: false, res: json(401, { ok: false, auth: true, error: "sign in required" }) };
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 403) return { ok: false, res: json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." }) };
    return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  }
  return { ok: true, r: { user, tenant: ans.tenant, seat: ans.seat, personKey: ans.personKey } };
}

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action || "");
  if (action === "logout") {
    await signOut(doorPool(), requestToken(req));
    return json(200, { ok: true });
  }
  if (REGISTER_ACTIONS.has(action)) {
    const d = await resolved(req, String(body.client || ""));
    if (!d.ok) return d.res;
    try {
      const a = await registerAction(d.r.tenant.id, await personFor(d.r), action, body);
      return json(a.code, a.body);
    } catch (e) {
      if (e instanceof NoPerson) return json(404, { ok: false, error: e.message });
      console.error("api/auth:", e instanceof Error ? e.stack || e.message : e);
      return json(500, { ok: false, error: "Something went wrong. Try again, and tell the SMO if it keeps happening." });
    }
  }
  return json(400, { ok: false, error: "Unknown action." });
}
