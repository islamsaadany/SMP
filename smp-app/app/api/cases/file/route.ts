import { NextResponse } from "next/server";
import { doorPool } from "../../../../lib/auth.ts";
import { requestUser } from "../../../../lib/session.ts";
import { casePart } from "../../../../lib/case-api.ts";

export const dynamic = "force-dynamic";
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

/* ONE PIECE OF A DELIVERABLE'S FILE (spec 067). Raw bytes, so a route of its
   own, as app/api/platform/file is for a report; every rule is casePart's. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange) return json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." });
  try {
    const bytes = Buffer.from(await req.arrayBuffer());
    const a = await casePart(doorPool(), user, new URL(req.url).searchParams, bytes);
    return json(a.code, a.body);
  } catch (e) {
    console.error("api/cases/file:", e instanceof Error ? e.stack || e.message : e);
    return json(500, { ok: false, error: "Something went wrong. Nothing was changed — try again." });
  }
}
