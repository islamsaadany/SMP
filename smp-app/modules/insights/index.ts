/* ── INSIGHTS SERVES ITSELF (spec 053) ───────────────────────────────────
   Two addresses and no more: the library, and one report's file.

   THE FILE IS A ROUTE RATHER THAN A LINK TO THE STORE, because the store's
   address has to be minted, short-lived and asked for by somebody this client
   would answer — a bare blob URL would be a permanent way past every rule the
   route applied before getting here (§261.10).

   THE SEARCH AND THE CATEGORY RIDE THE ADDRESS, so a filtered library is a
   link somebody can send and Back works (lib/library is read, never written,
   from a client's session). Anything else inside the module is sent back to
   the library rather than refused. */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { libraryFile } from "../../lib/library-file.ts";
import type { ServeArgs } from "../registry.ts";
import { insightsDocument } from "./page.ts";

export async function serve(a: ServeArgs): Promise<Response> {
  if (!a.rest.length) {
    const q = new URL(a.req.url).searchParams;
    return new Response(
      await insightsDocument(a.slug, a.tenantId, a.tenantName, a.have,
        { q: q.get("q") || "", category: q.get("category") || "" }),
      { status: 200, headers: shellHeaders() });
  }
  if (a.rest.length === 2 && a.rest[1] === "file")
    return libraryFile(a.tenantId, "insights", a.rest[0]!, a.req.url);
  return Response.redirect(new URL(clientHref(a.slug, "insights", ""), a.req.url), 302);
}
