import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { doorPool } from "../../../lib/auth.ts";
import { resolveTenant, tenantByKey } from "../../../lib/door.ts";
import { landingFor, landingShape } from "../../../lib/landing.ts";
import { landingFactsFor, viewerFor } from "../../../lib/landing-facts.ts";
import { modulesFor } from "../../../lib/modules.ts";
import { currentUser, SLUG } from "../../../lib/session.ts";
import Welcome from "./Welcome.tsx";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const t = SLUG.test(slug) ? await tenantByKey(doorPool(), slug) : null;
  return { title: t ? t.name + " — Strategy Management Platform" : "Strategy Management Platform" };
}

/* Where a client's person lands (§94.6, §148): the welcome screen for THIS
   tenant, behind the one door rule (contracts §1). A signed-out person is
   sent to this client's own door (§313.36); a temporary password to the
   password card; a client that is not theirs to their own; anything else
   answers the one refusal. */
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
  const data = await landingFor(ans.tenant.id, ans.personKey, user.email);
  /* the Client setup block and Your modules read the seat THE DOOR resolved
     and the client's own module list (spec 054 §4.1) — never the graph */
  const lines = await landingFactsFor(ans.tenant.id, modulesFor(ans.tenant.modules), await viewerFor(ans.tenant.id, ans.seat, ans.personKey));
  const shape = landingShape(slug, ans.seat, ans.tenant.modules, lines);
  return <Welcome slug={slug} tenant={ans.tenant} user={user} data={data} shape={shape} />;
}
