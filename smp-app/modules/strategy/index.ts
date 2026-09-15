/* ── STRATEGY SERVES ITSELF (spec 046 §4.2) ──────────────────────────────
   The whole of Strategy is the frozen platform, served as one document by
   lib/shell.ts — so this file is nine lines and that is the honest size of it.

   WHY `lib/shell.ts` DID NOT MOVE IN HERE WITH IT. Two things live in that
   file and only one is Strategy's: `shellDocument` draws the frozen platform,
   and `shellHeaders` is the security policy EVERY served document wears —
   this module's, the trial module's and Insights'. A policy that lived inside
   one module and was imported by the other two would be that module reaching
   into another's folder, which is the boundary this round exists to make
   visible (§345 §3). It stays on the spine.

   SETUP NO LONGER ARRIVES HERE (§356.2, spec 054): the route serves every
   Setup address — the client's and each module's own — as the spine's
   document itself, before this table is asked, so this module draws its
   pages and nothing about anybody's Setup. The intro round still does,
   being drawn inside this document. */
import { shellDocument, shellHeaders } from "../../lib/shell.ts";
import { moduleMenu } from "../../lib/modules.ts";
import type { ServeArgs } from "../registry.ts";

export async function serve(a: ServeArgs): Promise<Response> {
  return new Response(shellDocument(a.tenantName, a.module, moduleMenu(a.have)),
    { status: 200, headers: shellHeaders() });
}
