import { NextResponse } from "next/server";
import { signIn, cookieFor, doorPool } from "../../../../lib/auth.ts";
import { landingAt } from "../../../../lib/door.ts";
import { clientIp, isSecure, SLUG } from "../../../../lib/session.ts";

/* POST { email, password, door? } → the cookie, and { mustChange, landing }
   (contracts §2). Rate-limited before the password is verified, failures
   only, one sentence that never says which threshold or whether the email
   exists (§43). `door` is the client whose door this was (§313.36) and only
   ever narrows where the person lands. */
export async function POST(req: Request) {
  let body: any = {};
  const form = (req.headers.get("content-type") || "").startsWith("application/x-www-form-urlencoded");
  try { body = form ? Object.fromEntries((await req.formData()).entries()) : await req.json(); } catch { body = {}; }
  const email = String(body.email || ""), password = String(body.password || "");
  const door = typeof body.door === "string" && SLUG.test(body.door) ? body.door : null;
  const pool = doorPool();
  const r = await signIn(pool, email, password, clientIp(req));
  const doorPath = door ? "/" + door + "/sign-in" : "/";
  if (!r.ok) {
    /* a form post (the script not yet live) is sent back to the door, which
       says the one sentence; a fetch gets it in the body */
    if (form) return NextResponse.redirect(new URL(doorPath + "?refused=1", req.url), { status: 303 });
    return NextResponse.json({ ok: false, message: r.message }, { status: 401 });
  }
  const landing = await landingAt(pool, r.user, door);
  const cookie = cookieFor(r.token, isSecure(req));
  if (form) return NextResponse.redirect(new URL(r.user.mustChange ? doorPath : landing, req.url), { status: 303, headers: { "Set-Cookie": cookie } });
  return NextResponse.json({ ok: true, mustChange: r.user.mustChange, landing }, { headers: { "Set-Cookie": cookie } });
}
