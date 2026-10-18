import { currentUser } from "@/lib/session.ts";
import { doorPool } from "@/lib/auth.ts";
import { resolveTenant } from "@/lib/door.ts";
import { clientHref, DEFAULT_MODULE } from "@/lib/modules.ts";
import { officeSeat } from "@/ffp/lib/auth/workspace";

/**
 * The office-only gate for the Processes areas that are the office's own. Call
 * it FIRST in the area's layout: a non-null answer is the page to return, in
 * words and with the way back (§61); null means the caller holds an office
 * seat and the layout carries on.
 */
export async function officeOnlyNotice(slug: string): Promise<React.ReactElement | null> {
  const seat = await officeSeat(slug);
  if (seat.ok) return null;
  const user = await currentUser();
  const door = user ? await resolveTenant(doorPool(), user, slug) : null;
  const name = door && door.ok ? door.tenant.name : slug.toUpperCase();
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-lg font-semibold">Processes is the office&apos;s own</h1>
      <p className="mt-2 text-sm text-slate-600">
        The process maps for {name} are kept by the Strategy Management Office.
      </p>
      <a className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline" href={clientHref(slug, DEFAULT_MODULE, "")}>
        Back to the platform
      </a>
    </main>
  );
}
