import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { resolveTenant, NO_SUCH_TENANT } from "../../../lib/door.ts";
import { requestUser, SLUG } from "../../../lib/session.ts";
import { personFor, NoPerson, type Resolved } from "../../../lib/state-api.ts";
import { playAnswer, partAnswer, postAnswer, type BlobAnswer } from "../../../lib/blob-api.ts";

export const dynamic = "force-dynamic";

/* THE CLIPS (§261, ported at §316.5). THE SLUG RIDES THE QUERY and never the
   body: the piece upload posts RAW BYTES and the play address is a GET, so the
   query is the one place all of this endpoint's calls share — sync.js's
   `withClient` puts it there for exactly that reason (§313.37, where a slug in
   the body meant every store action from a client other than the default
   landed on the default's schema).

   A raw store or database message is a free map of the inside of this
   deployment to anybody probing it (§43), so it goes to the log and the person
   gets one sentence. */
const json = (code: number, body: unknown) => NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

function answer(a: BlobAnswer): Response {
  if (a.code === 302 && a.redirect) return NextResponse.redirect(a.redirect, { status: 302 });
  return json(a.code, a.body);
}
async function resolved(req: Request): Promise<{ ok: true; r: Resolved } | { ok: false; res: Response }> {
  const slug = new URL(req.url).searchParams.get("client") || "";
  if (!slug || !SLUG.test(slug)) return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  const user = await requestUser(req);
  if (!user) return { ok: false, res: json(401, { ok: false, auth: true, error: "sign in required" }) };
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 403) return { ok: false, res: json(403, { ok: false, auth: true, mustChange: true, error: "Choose your own password before going on." }) };
    return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  }
  return { ok: true, r: { user, tenant: ans.tenant, seat: ans.seat, personKey: ans.personKey } };
}
function failed(e: unknown): Response {
  if (e instanceof NoPerson) return json(404, { ok: false, error: e.message });
  console.error("api/blob:", e instanceof Error ? e.stack || e.message : e);
  return json(500, { ok: false, error: "that did not work" });
}

export async function GET(req: Request) {
  const d = await resolved(req);
  if (!d.ok) return d.res;
  const play = new URL(req.url).searchParams.get("play");
  if (!play) return json(400, { ok: false, error: "nothing named to play" });
  try { return answer(await playAnswer(d.r.tenant.id, await personFor(d.r), play)); }
  catch (e) { return failed(e); }
}

export async function POST(req: Request) {
  const d = await resolved(req);
  if (!d.ok) return d.res;
  const q = new URL(req.url).searchParams;
  try {
    const person = await personFor(d.r);
    /* A part carries BYTES, so its instructions ride in the query string —
       there is no JSON body to put them in. */
    if (q.get("action") === "part")
      return answer(await partAnswer(d.r.tenant.id, person, q, Buffer.from(await req.arrayBuffer())));
    let body: any = null;
    try { body = await req.json(); } catch { body = null; }
    if (!body || typeof body !== "object") return json(400, { ok: false, error: "unknown action" });
    return answer(await postAnswer(d.r.tenant.id, person, body));
  } catch (e) { return failed(e); }
}
