import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { requestUser } from "../../../lib/session.ts";
import { copilotSettingsAction, mayRead } from "../../../lib/copilot-settings-api.ts";
import { templateFile } from "../../../lib/copilot-settings.ts";

export const dynamic = "force-dynamic";
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

/* /api/copilot — the Copilot's settings on Forefront's console (§501). The
   frameworks library's door, word for word: a session, and a password that is
   no longer temporary. A template download is a GET (?file=<key>), because a
   download is a link and a link is a GET. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange) return json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." });
  let b: any = {};
  try { b = await req.json(); } catch { b = {}; }
  try { const a = await copilotSettingsAction(doorPool(), user, b, user.isAdmin ? user.id : null); return json(a.code, a.body); }
  catch (e) {
    console.error("api/copilot:", e instanceof Error ? e.stack || e.message : e);
    return json(500, { ok: false, error: "That did not save. Nothing was changed — try again." });
  }
}

export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user) return json(401, { ok: false, auth: true, error: "sign in required" });
  if (user.mustChange || !mayRead(user)) return json(403, { ok: false, error: "That is not something this account opens." });
  const key = new URL(req.url).searchParams.get("file") || "";
  try {
    const f = await templateFile(doorPool(), key);
    if (!f) return json(404, { ok: false, error: "That template is not here." });
    return new Response(new Uint8Array(f.bytes), { status: 200, headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff", "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(f.name) } });
  } catch (e) {
    console.error("api/copilot GET:", e instanceof Error ? e.message : e);
    return json(500, { ok: false, error: "This could not be read just now." });
  }
}
