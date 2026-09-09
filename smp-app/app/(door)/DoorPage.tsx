/* The door, decided on the server (§32: nothing is shown until the answer is
   known — and the server knows it before it writes the page). A live session
   goes straight through to where that person lands; a temporary password
   opens on the password card; nobody else sees the sign-in card. */
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { doorPool } from "../../lib/auth.ts";
import { doorDress, landingAt } from "../../lib/door.ts";
import { currentUser, SLUG } from "../../lib/session.ts";
import Door from "./Door.tsx";

export async function doorMetadata(slug: string | null): Promise<Metadata> {
  const dress = await doorDress(doorPool(), slug);
  return { title: dress ? dress.name + " — Strategy Management Platform" : "SMP — Access" };
}

export async function DoorPage({ slug }: { slug: string | null }) {
  const clean = slug && SLUG.test(slug) ? slug : null;
  const pool = doorPool();
  const user = await currentUser();
  if (user && !user.mustChange) redirect(await landingAt(pool, user, clean));
  const dress = await doorDress(pool, clean);
  return <Door slug={clean} dress={dress} initial={user ? "change" : "login"} />;
}
