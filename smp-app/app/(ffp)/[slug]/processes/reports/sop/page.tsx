import { registerReady } from "@/ffp/lib/register-sync";
import { notFound as nextNotFound, redirect } from "next/navigation";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { loadReportData } from "@/ffp/lib/reports/load-report-data";
import { compileSop } from "@/ffp/lib/domain/sop";
import { SopDocument } from "./sop-document";

/**
 * The SOP export — its own document, separate from the Export Report, built
 * from the same loaded report data so the two cannot disagree. Outside the
 * (shell) group like the report, so what is on screen is what prints.
 */
export default async function SopPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug: workspaceId } = await props.params;
  await registerReady(workspaceId);
  const searchParams = await props.searchParams;
  const idsRaw = searchParams["ids"];
  const processIds = (Array.isArray(idsRaw) ? idsRaw : idsRaw ? [idsRaw] : []).filter(Boolean);

  const access = await requireWorkspaceAccess(workspaceId, "VIEWER");
  if (!access.ok) {
    if (access.error === "UNAUTHORIZED") redirect("/" + workspaceId + "/sign-in");
    nextNotFound();
  }

  const data = await loadReportData(workspaceId, processIds);
  if (!data) nextNotFound();

  const sops = data.processes.map((p) => compileSop(p));
  return <SopDocument companyName={data.companyName} firmName={data.firmName} sops={sops} />;
}
