import { redirect } from "next/navigation";
import { doorPool } from "../../../lib/auth.ts";
import { memberships } from "../../../lib/door.ts";
import { currentUser } from "../../../lib/session.ts";

export const dynamic = "force-dynamic";

/* FOREFRONT'S OWN LANDING IS NOT IN THIS SCREEN GROUP (the cards, the
   consultants and the table — §313.3). An office login has to land
   somewhere meanwhile, so this holds the address and lists, as plain links,
   the clients this person may open — the cards' facts without the cards'
   design, which waits on its own mockup (rule 1c). */
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/");
  if (user.mustChange) redirect("/");
  const pool = doorPool();
  const mine = await memberships(pool, user.id);
  const rows = user.isAdmin
    ? (await pool.query("SELECT key, name FROM tenants WHERE status = 'active' ORDER BY name")).rows
    : mine.length
      ? (await pool.query("SELECT key, name FROM tenants WHERE status = 'active' AND id = ANY($1::uuid[]) ORDER BY name", [mine.map((m) => m.tenant_id)])).rows
      : [];
  return (
    <main className="holder">
      <h1>Forefront&rsquo;s pages are not built in the new platform yet</h1>
      <p>They open with a later screen group. The clients you can open:</p>
      <ul>{rows.map((t: { key: string; name: string }) => <li key={t.key}><a href={"/" + t.key}>{t.name}</a></li>)}</ul>
      {!rows.length && <p>None yet.</p>}
      <form method="post" action="/api/auth/sign-out"><button type="submit">Sign out</button></form>
    </main>
  );
}
