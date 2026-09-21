/* ── INSIGHTS SERVES ITSELF (spec 053) ───────────────────────────────────
   Two addresses and no more: the library, and one report's file.

   THE FILE IS A ROUTE RATHER THAN A LINK TO THE STORE, because the store's
   address has to be minted, short-lived and asked for by somebody this client
   would answer — a bare blob URL would be a permanent way past every rule the
   route applied before getting here (§261.10).

   THE SEARCH AND THE CATEGORY RIDE THE ADDRESS, so a filtered library is a
   link somebody can send and Back works (lib/library is read, never written,
   from a client's session). Anything else inside the module is sent back to
   the library rather than refused.

   WHO IS LOOKING IS RESOLVED ONCE, HERE, AND HANDED TO BOTH ADDRESSES (spec
   046 §4.10). The library and the file must narrow by exactly the same rule or
   a report missing from somebody's list is still downloadable by its
   address — so they are given one `Viewer` rather than each working it out,
   which is how two answers to one question get made (§53.5). */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { libraryFile } from "../../lib/library-file.ts";
import { viewerFor } from "../../lib/library-viewer.ts";
import type { Viewer } from "../../lib/library.ts";
import type { ServeArgs } from "../registry.ts";
import { insightsDocument, libraryFragment } from "./page.ts";

/* WHO IS LOOKING IS THE SPINE'S (§382). This rule was written here and then
   COPIED into lib/landing-facts.ts under a comment naming this file, which is
   §53.5 written down rather than closed — and the reports tab's own stamp
   would have been the third copy. It is lib/library-viewer.ts's now: the
   seat that reads everything, the place the register gives anybody else, and
   the two branches that answer without opening a connection at all. Nothing
   about the rule moved; what moved is how many places hold it. */
const viewerOf = (a: ServeArgs): Promise<Viewer> => viewerFor(a.tenantId, a.seat, a.personKey);

export async function serve(a: ServeArgs): Promise<Response> {
  if (!a.rest.length) {
    const q = new URL(a.req.url).searchParams;
    return new Response(
      await insightsDocument(a.slug, a.tenantId, a.tenantName, a.have,
        { q: q.get("q") || "", category: q.get("category") || "" }, await viewerOf(a)),
      { status: 200, headers: shellHeaders() });
  }
  /* ── THE ROWS, FOR THE TAB INSIDE THE PLATFORM (§376) ──────────────
     Islam picked the tab over the two other placements, and a tab that is a
     link is still going to another module from a different button — which is
     the thing he asked to stop. So the platform draws the reports in its own
     pane, and this is where it gets them: the module's OWN markup, narrowed
     by the module's OWN viewer, as JSON so the count can be drawn beside the
     search without the shell counting nodes (§93 — an unreadable library
     would otherwise count as nought reports).

     A GET, because it is a read (§356.12's own line). No gate of its own: the
     route has already asked whether this person may open this module at all
     (lib/access.ts, before serverFor), and what they may SEE inside it is
     `viewerOf`, the same answer the page and the file both take. */
  if (a.rest.length === 1 && a.rest[0] === "list") {
    const q = new URL(a.req.url).searchParams;
    const body = await libraryFragment(a.slug, a.tenantId, a.tenantName,
      { q: q.get("q") || "", category: q.get("category") || "" }, await viewerOf(a));
    return new Response(JSON.stringify(body), { status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  }
  if (a.rest.length === 2 && a.rest[1] === "file")
    return libraryFile(a.tenantId, "insights", a.rest[0]!, a.req.url, await viewerOf(a));
  return Response.redirect(new URL(clientHref(a.slug, "insights", ""), a.req.url), 302);
}
