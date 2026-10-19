import "server-only";
import { redirect } from "next/navigation";
import { officeSeat } from "@/ffp/lib/auth/workspace";

/**
 * The office-only gate for the Processes areas that are the office's own. Call it FIRST in the
 * area's layout. A client's own person is REDIRECTED to their reading page rather than shown a
 * notice in place: Next.js runs a page's code even when its layout does not draw it, and the page's
 * data rides in the response — a layout that merely declines to render `children` still sends it.
 * A redirect sends nothing of the page at all.
 */
export async function requireOffice(slug: string): Promise<void> {
  const seat = await officeSeat(slug);
  if (!seat.ok) redirect(`/${slug}/processes/read`);
}
