import Link from "next/link";
import { requireOffice } from "@/ffp/lib/auth/require-office";
import { prisma } from "@/ffp/lib/db/client";
import { buildSnapshot, loadPlan, loadPriorityRows } from "@/ffp/lib/data/priorities";
import { PrioritiesDocument } from "../../priorities-document";
import { PrintPageButton } from "./print-page-button";

/** The deep-dive priorities on a page of their own: what is on screen is what prints. */
export default async function PrioritiesExportPage(props: PageProps<"/[slug]/processes/reports/priorities">) {
  const { slug: workspaceId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  const [plan, workspace] = await Promise.all([loadPlan(workspaceId), prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } })]);
  const rows = await loadPriorityRows(workspaceId, plan.weights);
  // A draft shows the proposal as it stands; once sent, what was sent.
  const snapshot = plan.status === "DRAFT" || !plan.snapshot ? buildSnapshot(plan, rows) : plan.snapshot;
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8 print:p-0">
      <div className="mb-4 flex items-center gap-4 print:hidden">
        <Link href={`/${workspaceId}/processes/priorities?step=sign`} className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back to Priorities</Link>
        <PrintPageButton />
      </div>
      <PrioritiesDocument clientName={workspace.name} snapshot={snapshot} status={plan.status} approvedBy={plan.approvedByName} approvedAt={plan.approvedAt} sentBy={plan.sentByName} />
    </main>
  );
}
