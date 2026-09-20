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
import { withTenant } from "../../lib/tenant.ts";
import { placeOf } from "../../lib/place.ts";
import type { Viewer } from "../../lib/library.ts";
import type { ServeArgs } from "../registry.ts";
import { insightsDocument, libraryFragment } from "./page.ts";

/* THE OFFICE READS EVERYTHING, AND IT IS THE SEAT THAT SAYS SO (spec 046
   §4.10). Whoever holds this client's Super user or SMO team seat sees every
   report whatever its list says — which on every client today is us, because
   there is no client-side strategy office (Islam, 2026-09-15). Written
   against the seat rather than against who employs somebody, since the seat
   is the only one of the two the platform holds.

   WHERE THEY SIT IS ASKED OF THE SPINE, never worked out here: the register
   is the client's and no module's (spec 046 §4.1, lib/place.ts).

   NEITHER BRANCH THAT ALREADY KNOWS THE ANSWER ASKS THE DATABASE. A seat that
   sees everything is not asked where it sits, because nothing about the place
   could change what it reads — and it cannot then disagree with the seat.
   Nobody on the register has no place to look up, which is not an
   optimisation but the same answer arrived at without a connection: an office
   login opening a client before `officeRow` has minted them a row (§313.32)
   is exactly that person, and every request they make would otherwise open a
   tenant connection to be told null. Found by checks/modules.mjs, which
   drives each module's server with no database at all and went red on it. */
async function viewerOf(a: ServeArgs): Promise<Viewer> {
  if (a.seat === "super" || a.seat === "smoteam") return { place: null, seesAll: true };
  if (!a.personKey) return { place: null, seesAll: false };
  return { place: await withTenant(a.tenantId, (c) => placeOf(c, a.personKey)), seesAll: false };
}

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
