import { requireOffice } from "@/ffp/lib/auth/require-office";
import { clientSettings } from "@/ffp/lib/data/client-settings";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { getActiveReviewFindings } from "@/ffp/lib/data/review-findings-data";
import { ReviewPanel } from "./review-panel";

export default async function ProcessReviewPage(
  props: PageProps<"/[slug]/processes/processes/[processId]/review">
) {
  const { slug: workspaceId, processId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);

  const process = await prisma.process.findUnique({
    where: { id: processId },
    include: { workspace: { select: { industry: true } } },
  });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [initialFindings, steps] = await Promise.all([
    getActiveReviewFindings(processId),
    prisma.processStep.findMany({
      where: { processId },
      select: { id: true, type: true, label: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <main className="w-full">
      <ReviewPanel
        workspaceId={workspaceId}
        processId={processId}
        workspaceIndustry={(await clientSettings(workspaceId))?.industry || process.workspace.industry}
        initialFindings={initialFindings}
        steps={steps}
      />
    </main>
  );
}
