import { NextResponse } from "next/server";
import { doorPool } from "../../../lib/auth.ts";
import { resolveTenant, NO_SUCH_TENANT } from "../../../lib/door.ts";
import { requestUser, SLUG } from "../../../lib/session.ts";
import { personFor, NoPerson, type Resolved } from "../../../lib/state-api.ts";
import { withTenant } from "../../../lib/tenant.ts";
import { createRequire } from "node:module";

/* The endpoint is a CommonJS module carried verbatim, so it is REQUIRED
   rather than imported — the same way every other frozen module reaches
   this app (`rules.cjs`, `authorize.cjs`, `graph-io.cjs`). */
const chatHandler = createRequire(import.meta.url)("../../../lib/chat-api.cjs") as
  (c: unknown, me: unknown, body: unknown, req: unknown, slug: string) => Promise<{ code: number; body: unknown }>;

export const dynamic = "force-dynamic";

/* TALKING TO THE STRATEGY OFFICE, on the new stack (§97, ported at §316.7).
   The endpoint is `lib/chat-api.cjs` — the frozen `api/chat.js` carried across
   with its plumbing replaced and nothing else — and this file is the plumbing:
   the door in front of it, the tenant transaction around it, and the sentence
   a person gets when something goes wrong.

   THE SLUG RIDES THE BODY, because that is where `chat.js` puts it (it reads
   its own address and sends what it was served at). An unknown client, a
   client this account may not open and a schema name typed into the address
   are ONE refusal (§313): trying slugs tells nobody anything.

   A raw database message is a free map of the inside of this deployment
   (§43), so it goes to the runtime log and the person gets one sentence —
   the same sentence the frozen endpoint wrote for itself. */
const json = (code: number, body: unknown) =>
  NextResponse.json(body, { status: code, headers: { "Cache-Control": "no-store" } });

async function resolved(req: Request, slug: string): Promise<{ ok: true; r: Resolved } | { ok: false; res: Response }> {
  if (!slug || !SLUG.test(slug)) return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  const user = await requestUser(req);
  if (!user) return { ok: false, res: json(401, { ok: false, error: "sign in first" }) };
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    /* IDENTITY BEFORE ANYTHING ELSE (§43.2). A temporary password buys a
       session and nothing a session is for; the chat is no exception. */
    if (ans.status === 403) return { ok: false, res: json(403, { ok: false, error: "choose a password first" }) };
    return { ok: false, res: json(404, { ok: false, error: NO_SUCH_TENANT }) };
  }
  return { ok: true, r: { user, tenant: ans.tenant, seat: ans.seat, personKey: ans.personKey } };
}

async function answer(req: Request, body: any, method: "GET" | "POST") {
  const slug = String(body.client || new URL(req.url).searchParams.get("client") || "");
  const d = await resolved(req, slug);
  if (!d.ok) return d.res;
  try {
    const person = await personFor(d.r);
    /* All this file ever asked of `req`: the referrer the platform's own
       address is read from (`platformHref`), and the method the GET default
       reads. */
    const shim = { method, headers: { referer: req.headers.get("referer") || "" } };
    /* --break=no-boundary: the request is served against SOME tenant rather
       than the one the door resolved — the fault the whole model exists to
       make impossible, and the only way to falsify it from outside. */
    const tid = process.env.SMP_BREAK === "no-boundary"
      ? (await doorPool().query("SELECT id FROM tenants ORDER BY key LIMIT 1")).rows[0].id
      : d.r.tenant.id;
    const a = await withTenant(tid, (c) => chatHandler(c, person, body, shim, slug));
    return json(a.code, a.body);
  } catch (e) {
    if (e instanceof NoPerson) return json(404, { ok: false, error: e.message });
    console.error("api/chat:", e instanceof Error ? e.stack || e.message : e);
    const tooBig = e instanceof Error && e.message === "too large";
    return json(500, { ok: false, error: tooBig ? "Too large." : "Something went wrong." });
  }
}

export async function GET(req: Request) { return answer(req, {}, "GET"); }
export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  if (!body || typeof body !== "object") body = {};
  return answer(req, body, "POST");
}
