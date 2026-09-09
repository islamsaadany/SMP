import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { requestUser } from "../../../lib/session.ts";
import { platformAction } from "../../../lib/platform-api.ts";

export const dynamic = "force-dynamic";
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

/* /api/platform — the frozen page's one endpoint (lib/platform-api.ts). */
async function handle(req: Request, body: any) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange) return json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." });
  try { const a = await platformAction(doorPool(), user, body); return json(a.code, a.body); }
  catch (e) {
    console.error("api/platform:", e instanceof Error ? e.stack || e.message : e);
    return json(500, { ok: false, error: "Something went wrong. Nothing was changed — try again, and tell the platform's admin if it keeps happening." });
  }
}
export async function GET(req: Request) { return handle(req, { action: "me" }); }
export async function POST(req: Request) { let b: any = {}; try { b = await req.json(); } catch { b = {}; } return handle(req, b); }
