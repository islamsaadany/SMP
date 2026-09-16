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

   AND SETUP ARRIVES HERE, which is not a claim that Setup is Strategy's. A
   spine segment resolves to the default module's server because the frozen
   platform is where Setup is drawn today (spec 046 §4.5 wants one Setup page
   for the whole client, and it is not built). Recorded rather than papered
   over: the day Setup is the spine's own document, it stops arriving here. */
import { shellDocument, shellHeaders } from "../../lib/shell.ts";
import { moduleMenu } from "../../lib/modules.ts";
import type { ServeArgs } from "../registry.ts";

export async function serve(a: ServeArgs): Promise<Response> {
  return new Response(shellDocument(a.tenantName, a.module, moduleMenu(a.have)),
    { status: 200, headers: shellHeaders() });
}
