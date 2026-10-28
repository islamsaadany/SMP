import { requireOffice } from "@/ffp/lib/auth/require-office";

/* The reports are documents drawn to be printed, so they stay on white paper
   whatever the theme: the wrapper restates the module's colours in their
   light reading (ffp/globals.css, .ffp-paper) and takes no room itself. */
export default async function ReportsLayout(props: LayoutProps<"/[slug]/processes/reports">) {
  const { slug } = await props.params;
  await requireOffice(slug);
  return <div className="ffp-paper contents">{props.children}</div>;
}
