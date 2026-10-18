import { clientHref, DEFAULT_MODULE } from "@/lib/modules.ts";
import { readerSeat } from "@/ffp/lib/auth/workspace";

/* THE STAFF READER VIEW — the one part of Processes a client's own person may
   open (see ../layout.tsx). It asks readerSeat: the office, or somebody on the
   client's People register. */
export default async function ReadLayout(props: LayoutProps<"/[slug]/processes/read">) {
  const { slug } = await props.params;
  const seat = await readerSeat(slug);
  if (!seat.ok) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-lg font-semibold">You are not on the People register</h1>
        <p className="mt-2 text-sm text-slate-600">
          The processes are shown to the people the register holds for this client. Ask the Strategy Management Office to add you.
        </p>
        <a className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline" href={clientHref(slug, DEFAULT_MODULE, "")}>
          Back to the platform
        </a>
      </main>
    );
  }
  return props.children;
}
