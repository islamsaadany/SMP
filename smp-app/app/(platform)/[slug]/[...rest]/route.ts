import { doorPool } from "../../../../lib/auth.ts";
import { resolveTenant } from "../../../../lib/door.ts";
import { requestUser, SLUG } from "../../../../lib/session.ts";
import { shellDocument, shellHeaders } from "../../../../lib/shell.ts";
import { whereOf, clientHref, DEFAULT_MODULE } from "../../../../lib/modules.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string; rest: string[] }> };

/* Every page inside a client — /<client>/<module>/<target>/<tab>[/<section>]
   — is the frozen shell served in its own document (lib/shell.ts), behind
   the same door rule as the landing (contracts §1): a signed-out person goes
   to this client's door (§313.36), a temporary password to the password card,
   a client that is not theirs to their own, anything else the one refusal.
   The shell then reads which page the address names (shell/route.js) and
   asks /api/state for the tenant's graph. A route handler rather than a
   page, because the shell is a document of its own and React has nothing to
   do inside it.

   THE MODULE SEGMENT (spec 046 §7) is read by lib/modules.ts and is settled
   HERE rather than in the browser, because an old address must be corrected
   before a page is drawn at it: a link made before today — /<client>/mobile
   /strategy — 302s to /<client>/strategy/mobile/strategy, so there is one
   address per page and Back never walks through a shape the product no
   longer writes. `setup` and `tour` are the spine's and are served as they
   are. The redirect happens AFTER the door has answered, or it would tell
   a stranger which addresses exist. */
export async function GET(req: Request, { params }: P) {
  const { slug, rest } = await params;
  if (!SLUG.test(slug)) return new Response("Not found", { status: 404 });
  const user = await requestUser(req);
  const door = "/" + slug + "/sign-in";
  if (!user) return Response.redirect(new URL(door, req.url), 302);
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 302) return Response.redirect(new URL(ans.redirect, req.url), 302);
    if (ans.status === 403) return Response.redirect(new URL(door, req.url), 302);
    return new Response("Not found", { status: 404 });
  }
  const w = whereOf(rest || []);
  if (w.legacy) return Response.redirect(new URL(clientHref(slug, DEFAULT_MODULE, (rest || []).join("/")), req.url), 302);
  return new Response(shellDocument(ans.tenant.name, w.module || DEFAULT_MODULE), { status: 200, headers: shellHeaders() });
}
