import { doorPool } from "../../../../lib/auth.ts";
import { resolveTenant } from "../../../../lib/door.ts";
import { requestUser, SLUG } from "../../../../lib/session.ts";
import { whereOf, clientHref, modulesFor, moduleMenu, DEFAULT_MODULE } from "../../../../lib/modules.ts";
import { serverFor } from "../../../../modules/registry.ts";
import { landingStampFor } from "../../../../lib/landing.ts";
import { mayOpenModule, openableModules } from "../../../../lib/access.ts";
import { MODULE_DEF } from "../../../../lib/modules.ts";
import { shellDocument, shellHeaders } from "../../../../lib/shell.ts";
import { viewAsOf, narrowToViewed } from "../../../../lib/view-as.ts";
import { libraryStampFor } from "../../../../lib/library-viewer.ts";

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
  /* WHICH MODULES THIS CLIENT HAS decides what its address can name (spec
     046 §4.5): a word outside the list is read as any other word the client
     does not hold — redirected once and landed on the person's own first
     page — rather than refused in a second way that would have to be worded
     and kept in step with the first (lib/modules.ts whereOf). */
  /* ── WHO THE PAGE IS BEING DRAWN FOR (§377) ────────────────────────
     Narrowed ONCE, here, before any of it is used: which modules may be
     opened, what the Setup document is stamped with, and what the module
     itself is handed. A module that asked about view-as for itself would be
     a second answer to a question the door exists to settle (§53.5), and
     three of the four copies would be written by somebody who had never met
     the fault — the office's seat answering for a client's person, so every
     narrowed report read as everyone's (lib/view-as.ts).

     IT CAN ONLY NARROW, and a refusal is said rather than swallowed: the
     only way to reach one from a browser is a forged or stale request, and
     an empty library reads exactly like a client with nothing published
     (§35, §93). */
  const asked = viewAsOf(req.url);
  const who = asked
    ? await narrowToViewed(doorPool(), ans.tenant.id, { personKey: ans.personKey, seat: ans.seat }, asked)
    : { personKey: ans.personKey, seat: ans.seat };
  if ("refuse" in who) return new Response(who.refuse, { status: 403 });
  const have = modulesFor(ans.tenant.modules);
  const w = whereOf(rest || [], have);
  if (w.legacy) return Response.redirect(new URL(clientHref(slug, DEFAULT_MODULE, (rest || []).join("/")), req.url), 302);
  /* A MODULE SERVES ITSELF, AND WHICH ONE DRAWS WHAT IS A TABLE (§354,
     modules/registry.ts). This was a chain of ifs under a comment saying it
     would become a table at the third module; Insights was the third, and
     grew an eighth line under that sentence instead. What the route keeps is
     the part that is the route's: the door, the client, and which module the
     address names. What it stops holding is any knowledge of what a module
     draws — so a fourth module is a folder and an entry, and this file is not
     edited at all.

     SETUP IS THE SPINE'S OWN DOCUMENT, FOR EVERY MODULE (§359.2, spec 056
     §4.2, research R1). `/<client>/setup/…` is the client's pages and
     `/<client>/<module>/setup/…` is that module's own — both are the frozen
     shell served by lib/shell.ts, stamped with the module whose word led (or
     the default's when none did), and the shell draws the right rail from
     that stamp (shell/route.js, shell.html setupScope). Served HERE, before
     the table is asked, so a module that draws its own document (Insights)
     never has to know how a Setup page is drawn: its Setup arrives on the
     spine with the rest of Setup, and the module brings only its defs.
     `tour` stays the default module's, being where the intro round is drawn. */
  const key = w.module || DEFAULT_MODULE;
  /* WHO MAY OPEN THE MODULE (§359.5, spec 056 §4.4, research R3): asked of
     the spine BEFORE anything of the module is drawn — its Setup included —
     and a refusal is the redirect an unknown module word gets above, so a
     shut module and an absent one answer identically (§320.5). Only an
     address that LED with a module word is gated: the spine's own pages are
     the client's. The switcher and the landing read the same answer
     (openableModules), so a module shut by its address is shut on its row. */
  if (w.module && !(await mayOpenModule(ans.tenant.id, who.seat, who.personKey, w.module)))
    return Response.redirect(new URL(clientHref(slug, DEFAULT_MODULE, (rest || []).join("/")), req.url), 302);
  const open = await openableModules(ans.tenant.id, who.seat, who.personKey, ans.tenant.modules);
  if (w.rest[0] === "setup") {
    /* the module's Landing line page reads its declaration off the document
       (§359.4) — computed here, on the Setup document alone — and its Access
       page the module's declared areas (§359.5), the same way */
    const landing = await landingStampFor(ans.tenant.id, key, who.seat, who.personKey, ans.tenant.modules);
    /* WHICH RAIL, STAMPED BY THE SIDE THAT KNOWS (§362, spec 058). `w.module`
       is set only where the module word LED the address, which is exactly the
       difference between a module's own Setup and the client's — the same
       test shell/route.js's placeOf makes in the browser, answered here so it
       is on the document before any of the chrome is built from it. */
    /* AND THE REPORTS TAB'S FILTERS (§380). A Setup document carries no
       destination tabs, and the shell walks from Setup to a unit without
       asking for the document again — so the stamp has to be right on THIS
       one too, or the tab drawn on arrival would offer the module's whole
       list. The same answer the module's own document is stamped with
       (lib/library-viewer.ts), asked once per document and never per paint. */
    return new Response(shellDocument(ans.tenant.name, key, moduleMenu(open), landing, MODULE_DEF[key].areas,
                                      w.module ? key : "client",
                                      await libraryStampFor(ans.tenant.id, who.seat, who.personKey, open)),
                        { status: 200, headers: shellHeaders() });
  }
  const serve = serverFor(key);
  if (!serve) return new Response("Not found", { status: 404 });
  /* WHO IS LOOKING travels with the address (spec 046 §4.10). The door has
     already resolved both — a module asking for them again would be a second
     answer to a question `resolveTenant` exists to settle (§53.5). */
  return serve({ req, slug, module: key, tenantId: ans.tenant.id, tenantName: ans.tenant.name,
    have: open, rest: w.rest, personKey: who.personKey, seat: who.seat });
}

/* A MODULE MAY BE WRITTEN TO (spec 054): the Internal Tracker's rows are
   changed on the row, so its server takes a POST at an address inside the
   module. The door, the client and the module are resolved exactly as for a
   GET — the same function, so a write cannot reach a module a GET would not
   — and what to do with the body is the module's own. The frozen shell's
   writes still go to /api/*; this is only for a module that serves itself. */
export const POST = GET;
