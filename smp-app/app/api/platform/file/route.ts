import { NextResponse } from "next/server";
import { doorPool } from "../../../../lib/auth.ts";
import { requestUser } from "../../../../lib/session.ts";
import { libraryPart } from "../../../../lib/platform-api.ts";

export const dynamic = "force-dynamic";
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

/* ONE PIECE OF A REPORT'S FILE (spec 053). Its own route because the body is
   RAW BYTES and /api/platform is JSON — §261's clips are split the same way
   for the same reason, and the naming rides the query, which is the one place
   both kinds of call can share.

   EVERY RULE IS IN lib/platform-api.ts's libraryPart and none of them is here:
   a route that made its own decision about who may write would be the second
   place this is answered, and the drift would be invisible until somebody
   uploaded through it (§42, §53.5). */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange) return json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." });
  try {
    const bytes = Buffer.from(await req.arrayBuffer());
    const a = await libraryPart(doorPool(), user, new URL(req.url).searchParams, bytes);
    return json(a.code, a.body);
  } catch (e) {
    console.error("api/platform/file:", e instanceof Error ? e.stack || e.message : e);
    return json(500, { ok: false, error: "Something went wrong. Nothing was changed — try again." });
  }
}
