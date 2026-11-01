/* JUMP TO'S LIST (§699, lib/jump.ts): GET /api/jump?client=<slug>. The
   pages this person may open, asked once when the window is first opened. */
import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { requestUser, SLUG } from "../../../lib/session.ts";
import { jumpList } from "../../../lib/jump.ts";

export const dynamic = "force-dynamic";
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange) return json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." });
  const c = new URL(req.url).searchParams.get("client") || "";
  const slug = c && SLUG.test(c) && c !== "platform" && c !== "api" ? c : null;
  try { return json(200, { ok: true, items: await jumpList(doorPool(), user, slug) }); }
  catch (e) {
    console.error("api/jump:", e instanceof Error ? e.stack || e.message : e);
    return json(500, { ok: false, error: "The list could not be read. Try again." });
  }
}
