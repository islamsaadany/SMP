import { NextResponse } from "next/server";
import { changePassword, verifyCurrent, doorPool } from "../../../../lib/auth.ts";
import { landingAt } from "../../../../lib/door.ts";
import { requestToken, requestUser, SLUG } from "../../../../lib/session.ts";

/* POST { next, current?, door? } — the one route a temporary password may
   reach (§43.2). A settled password is changed only by somebody who knows
   it (`current`); a temporary one is replaced without asking, because the
   door has just checked it. Ends every OTHER session of this user (§43.7).
   Answers where to land, so choosing a password lands exactly where the
   sign-in would have. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ ok: false, message: "Sign in first." }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const pool = doorPool();
  if (!user.mustChange && !(await verifyCurrent(pool, user.id, String(body.current || "")))) {
    return NextResponse.json({ ok: false, message: "That is not your current password." }, { status: 403 });
  }
  const bad = await changePassword(pool, user.id, requestToken(req), String(body.next || ""));
  if (bad) return NextResponse.json({ ok: false, message: "The new password needs " + bad + "." }, { status: 400 });
  const door = typeof body.door === "string" && SLUG.test(body.door) ? body.door : null;
  return NextResponse.json({ ok: true, landing: await landingAt(pool, { ...user, mustChange: false }, door) });
}
