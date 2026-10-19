import { requireOffice } from "@/ffp/lib/auth/require-office";

export default async function ReportsLayout(props: LayoutProps<"/[slug]/processes/reports">) {
  const { slug } = await props.params;
  await requireOffice(slug);
  return props.children;
}
