/* ── THE TRIAL MODULE SERVES ITSELF (spec 046 §4.5) ──────────────────────
   One address and no more. Anything deeper is sent back to it rather than
   refused, which is what every other unknown word inside a client already
   gets (lib/modules.ts whereOf): one behaviour for "that is not a thing
   here", not a second refusal to word and keep in step. */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import type { ServeArgs } from "../registry.ts";
import { trialDocument } from "./page.ts";

export async function serve(a: ServeArgs): Promise<Response> {
  if (a.rest.length)
    return Response.redirect(new URL(clientHref(a.slug, "trial", ""), a.req.url), 302);
  return new Response(await trialDocument(a.slug, a.tenantId, a.tenantName, a.have),
    { status: 200, headers: shellHeaders() });
}
