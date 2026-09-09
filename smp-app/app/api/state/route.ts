import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { resolveTenant, NO_SUCH_TENANT } from "../../../lib/door.ts";
import { requestUser, SLUG } from "../../../lib/session.ts";
import { readAnswer, writeAnswer, NoPerson } from "../../../lib/state-api.ts";

export const dynamic = "force-dynamic";

/* THE FROZEN SPELLING OF THE ONE ADDRESS. The shell is carried verbatim
   (phases.md §1) and its scripts spell the state endpoint as `/api/state`,
   naming the client three ways the frozen server read them: `?client=` on
   a GET (sync.js withClient), `client` in a POST body (withClientBody), and
   — for history.js and safety.js, which name none — the page the request
   came from, which the referrer carries under the shell's own
   `Referrer-Policy: same-origin`. All three are a NAME to look up at the
   door and never a schema (§36.4); the answer is the same module the
   canonical route /api/<slug>/state calls, never a copy. There is no
   default client (§4.4): a request that names none is refused. */
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

function slugFrom(req: Request, body: any): string {
  const q = new URL(req.url).searchParams.get("client");
  if (q && SLUG.test(q)) return q;
  if (body && typeof body.client === "string" && SLUG.test(body.client)) return body.client;
  const ref = req.headers.get("referer") || "";
  const m = /^https?:\/\/[^/]+\/([a-z0-9][a-z0-9-]{0,48})(?:[/?#]|$)/.exec(ref);
  return m ? m[1] : "";
}
async function resolved(req: Request, slug: string) {
  if (!slug) return { ok: false as const, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  const user = await requestUser(req);
  if (!user) return { ok: false as const, res: json(401, { ok: false, auth: true, error: "sign in required" }) };
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 403) return { ok: false as const, res: json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." }) };
    return { ok: false as const, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  }
  return { ok: true as const, r: { user, tenant: ans.tenant, seat: ans.seat, personKey: ans.personKey } };
}
function failed(e: unknown): Response {
  if (e instanceof NoPerson) return json(404, { ok: false, error: e.message });
  console.error("api/state:", e instanceof Error ? e.stack || e.message : e);
  return json(500, { ok: false, error: "Something went wrong saving. Nothing was changed — try again, and tell the SMO if it keeps happening." });
}
export async function GET(req: Request) {
  const d = await resolved(req, slugFrom(req, null));
  if (!d.ok) return d.res;
  try { const a = await readAnswer(d.r, new URL(req.url).searchParams); return json(a.code, a.body); }
  catch (e) { return failed(e); }
}
export async function POST(req: Request) {
  let body: any = null;
  try { body = await req.json(); } catch { body = null; }
  const d = await resolved(req, slugFrom(req, body));
  if (!d.ok) return d.res;
  if (!body || typeof body !== "object") return json(400, { ok: false, error: "The save carried no change list." });
  try { const a = await writeAnswer(d.r, body); return json(a.code, a.body); }
  catch (e) { return failed(e); }
}
