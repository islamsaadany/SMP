import { notFound } from "next/navigation";
import { readerSeat } from "@/ffp/lib/auth/workspace";

/* THE STAFF READER VIEW — the one part of Processes a client's own person may
   open (see ../layout.tsx). It asks readerSeat: the office, or somebody on the
   client's People register. */
export default async function ReadLayout(props: LayoutProps<"/[slug]/processes/read">) {
  const { slug } = await props.params;
  const seat = await readerSeat(slug);
  // Not the office and not on the People register: nothing of this area is sent (a 404, not a notice
  // drawn over page data — see ../require-office.ts).
  if (!seat.ok) notFound();
  return props.children;
}
