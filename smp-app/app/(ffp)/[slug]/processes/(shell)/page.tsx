import { redirect } from "next/navigation";
import { requireOffice } from "@/ffp/lib/auth/require-office";

/* The builder opens on All processes (spec 067 §4.2): the Dashboard went, because
   All processes and the band's counts do its job. A client's own person is sent
   to their reading page first, as everywhere in the office's area. */
export default async function BuilderHome(props: PageProps<"/[slug]/processes">) {
  const { slug: workspaceId } = await props.params;
  await requireOffice(workspaceId);
  redirect(`/${workspaceId}/processes/processes`);
}
