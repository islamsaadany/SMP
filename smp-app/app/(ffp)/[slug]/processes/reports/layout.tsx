import { officeOnlyNotice } from "../office-only-notice";

export default async function ReportsLayout(props: LayoutProps<"/[slug]/processes/reports">) {
  const { slug } = await props.params;
  const notice = await officeOnlyNotice(slug);
  if (notice) return notice;
  return props.children;
}
