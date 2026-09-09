import { NextResponse } from "next/server";
import { doorPool } from "../../../../lib/auth.ts";
import { resolveTenant, NO_SUCH_TENANT } from "../../../../lib/door.ts";
import { requestUser, SLUG } from "../../../../lib/session.ts";
import { readAnswer, writeAnswer, NoPerson, type Resolved } from "../../../../lib/state-api.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

/* Every answer: no store, JSON. A refused or unknown client is one 404 with
   one sentence (§313); no session is 401; a temporary password is 403 with
   mustChange so the shell sends them back to the door (§43.2). A database
   error names tables and values, so it goes to the log and the person gets
   one sentence (api/state.js's safeError). */
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

async function resolved(req: Request, slug: string): Promise<{ ok: true; r: Resolved } | { ok: false; res: Response }> {
  if (!SLUG.test(slug)) return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  const user = await requestUser(req);
  if (!user) return { ok: false, res: json(401, { ok: false, auth: true, error: "sign in required" }) };
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 403) return { ok: false, res: json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." }) };
    if (ans.status === 302) return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
    return { ok: false, res: json(404, { ok: false, error: ans.message }) };
  }
  return { ok: true, r: { user, tenant: ans.tenant, seat: ans.seat, personKey: ans.personKey } };
}
function failed(e: unknown): Response {
  if (e instanceof NoPerson) return json(404, { ok: false, error: e.message });
  console.error("api/state:", e instanceof Error ? e.stack || e.message : e);
  return json(500, { ok: false, error: "Something went wrong saving. Nothing was changed — try again, and tell the SMO if it keeps happening." });
}

export async function GET(req: Request, { params }: P) {
  const { slug } = await params;
  const d = await resolved(req, slug);
  if (!d.ok) return d.res;
  try {
    const a = await readAnswer(d.r, new URL(req.url).searchParams);
    return json(a.code, a.body);
  } catch (e) { return failed(e); }
}

export async function POST(req: Request, { params }: P) {
  const { slug } = await params;
  const d = await resolved(req, slug);
  if (!d.ok) return d.res;
  let body: any = null;
  try { body = await req.json(); } catch { body = null; }
  if (!body || typeof body !== "object") return json(400, { ok: false, error: "The save carried no change list." });
  try {
    const a = await writeAnswer(d.r, body);
    return json(a.code, a.body);
  } catch (e) { return failed(e); }
}
