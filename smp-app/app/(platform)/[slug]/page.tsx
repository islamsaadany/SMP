import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { doorPool } from "../../../lib/auth.ts";
import { resolveTenant, tenantByKey } from "../../../lib/door.ts";
import { clientHref, DEFAULT_MODULE } from "../../../lib/modules.ts";
import { openableModules } from "../../../lib/access.ts";
import { currentUser, SLUG } from "../../../lib/session.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const t = SLUG.test(slug) ? await tenantByKey(doorPool(), slug) : null;
  return { title: t ? t.name + " — Strategy Management Platform" : "Strategy Management Platform" };
}

/* ── A CLIENT'S ADDRESS OPENS THE MODULE, NOT A WELCOME OF ITS OWN (§360,
   spec 057; reversing §315's landing and spec 056 §4.1's blocks).

   Islam: *"why do I have a welcome screen for the client overall, I just need
   a welcome screen for the strategy module for now."* The landing was a
   SECOND welcome: the Next page drew spec 056's Client setup and Your modules
   blocks, while the house mark inside the platform opened the frozen
   welcome.js overlay, which never had them — two answers to one screen,
   §53.5's drift with a person standing between them. So `/<client>` is a
   door and nothing more: the one door rule holds exactly as before (a
   signed-out person to this client's own door, §313.36; a temporary
   password to the card; a client that is not theirs to their own; anything
   else the one refusal), and a person who may open the client is sent into
   THE FIRST MODULE THEY MAY OPEN — Strategy for nearly everybody, read from
   the same answer the switcher and the card read (openableModules, §359.5),
   never from a second list. Strategy's own welcome greets them there, once a
   session (welcome.js), and the house mark is its way back.

   THE CLIENT'S SET-UP MOVED WITH IT: what the landing's blocks pointed at is
   the client's own Setup rail now, at `/<client>/setup`, reached from the
   console's card (platform.html) and from the row under every module's
   Setup head — not from here, because a page that only ever redirects is not
   a place to put a door on. */
export default async function Page({ params }: P) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  const user = await currentUser();
  if (!user) redirect("/" + slug + "/sign-in");
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 302) redirect(ans.redirect);
    if (ans.status === 403) redirect("/" + slug + "/sign-in");
    notFound();
  }
  const open = await openableModules(ans.tenant.id, ans.seat, ans.personKey, ans.tenant.modules);
  /* A PERSON WHO MAY OPEN NONE OF THEM still lands on the default module's
     address: its own gate answers there in words (route.ts, §359.5), where a
     404 here would say the CLIENT is not available, which is not true. */
  redirect(clientHref(slug, open[0] || DEFAULT_MODULE, ""));
}
