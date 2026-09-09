import { redirect, notFound } from "next/navigation";
import { doorPool } from "../../../../lib/auth.ts";
import { resolveTenant } from "../../../../lib/door.ts";
import { subjectLabel, targetOf } from "../../../../lib/landing.ts";
import { currentUser, SLUG } from "../../../../lib/session.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string; rest: string[] }> };

const TABS: Record<string, string> = { strategy: "Strategy", performance: "Performance", reporting: "Reporting", tour: "The intro round", setup: "Setup" };

/* EVERY DOOR ON THE LANDING GOES SOMEWHERE (§61), and where it goes says so
   in words: the pages behind the landing are the next screen group's, and
   until they arrive this answers at their addresses. Behind the same door
   rule as the landing, so the address is checked before anything is said. */
export default async function Page({ params }: P) {
  const { slug, rest } = await params;
  if (!SLUG.test(slug)) notFound();
  const user = await currentUser();
  if (!user) redirect("/" + slug + "/sign-in");
  const ans = await resolveTenant(doorPool(), user, slug);
  if (!ans.ok) {
    if (ans.status === 302) redirect(ans.redirect);
    if (ans.status === 403) redirect("/" + slug + "/sign-in");
    notFound();
  }
  const head = rest[0] === "setup" || rest[0] === "tour" ? TABS[rest[0]] : await subjectLabel(ans.tenant.id, targetOf(rest));
  const tab = rest.filter((s) => TABS[s] && s !== rest[0]).map((s) => TABS[s]);
  return (
    <main className="holder">
      <h1>{head}{tab.length ? " — " + tab.join(" · ") : ""}</h1>
      <p>This page is not built in the new platform yet. It opens with the next screen group.</p>
      <p><a href={"/" + slug}>Back to the landing</a></p>
      <form method="post" action="/api/auth/sign-out"><button type="submit">Sign out</button></form>
    </main>
  );
}
