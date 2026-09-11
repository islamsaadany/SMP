import { NextResponse } from "next/server";
import { signOut, doorPool, COOKIE } from "../../../../lib/auth.ts";
import { requestToken, isSecure } from "../../../../lib/session.ts";

/* POST — deletes the session row and clears the cookie. A plain form post
   (no script on the holder pages) is sent back to the door; a fetch gets
   JSON. */
export async function POST(req: Request) {
  await signOut(doorPool(), requestToken(req));
  const clear = COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + (isSecure(req) ? "; Secure" : "");
  const form = (req.headers.get("content-type") || "").startsWith("application/x-www-form-urlencoded");
  if (form) return NextResponse.redirect(new URL("/", req.url), { status: 303, headers: { "Set-Cookie": clear } });
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clear } });
}
