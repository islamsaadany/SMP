import { NextResponse } from "next/server";
import { doorPool } from "../../../../lib/auth.ts";
import { requestUser } from "../../../../lib/session.ts";

/* GET → who is signed in, and the clients they are on (contracts §2). */
export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const tenants = (await doorPool().query(
    "SELECT t.key, t.name, m.seat FROM tenant_users m JOIN tenants t ON t.id = m.tenant_id WHERE m.user_id = $1 AND t.status = 'active' ORDER BY t.name",
    [user.id])).rows;
  return NextResponse.json({ ok: true, email: user.email, name: user.name, kind: user.kind, isAdmin: user.isAdmin, mustChange: user.mustChange, tenants });
}
