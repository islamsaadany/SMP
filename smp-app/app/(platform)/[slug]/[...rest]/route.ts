import { doorPool } from "../../../../lib/auth.ts";
import { resolveTenant } from "../../../../lib/door.ts";
import { requestUser, SLUG } from "../../../../lib/session.ts";
import { shellDocument, shellHeaders } from "../../../../lib/shell.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string; rest: string[] }> };

/* Every page inside a client — /<client>/<target>/<tab>[/<section>] — is the
   frozen shell served in its own document (lib/shell.ts), behind the same
   door rule as the landing (contracts §1): a signed-out person goes to this
   client's door (§313.36), a temporary password to the password card, a
   client that is not theirs to their own, anything else the one refusal.
   The shell then reads which page the address names (shell/route.js) and
   asks /api/state for the tenant's graph. A route handler rather than a
   page, because the shell is a document of its own and React has nothing to
   do inside it. */
export async function GET(req: Request, { params }: P) {
  const { slug } = await params;
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
  return new Response(shellDocument(ans.tenant.name), { status: 200, headers: shellHeaders() });
}
