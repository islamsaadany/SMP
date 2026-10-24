import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { requestUser } from "../../../lib/session.ts";
import { caseAction } from "../../../lib/case-api.ts";

export const dynamic = "force-dynamic";
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

/* /api/cases — case studies (spec 067). Its own route, for the memory's
   reason (app/api/memory/route.ts); every rule is in lib/case-api.ts. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange) return json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." });
  let b: any = {};
  try { b = await req.json(); } catch { b = {}; }
  try { const a = await caseAction(doorPool(), user, b); return json(a.code, a.body); }
  catch (e) {
    console.error("api/cases:", e instanceof Error ? e.stack || e.message : e);
    return json(500, { ok: false, error: "Something went wrong. Nothing was changed — try again, and tell the platform's admin if it keeps happening." });
  }
}
