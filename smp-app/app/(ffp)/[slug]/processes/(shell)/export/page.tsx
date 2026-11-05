import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady } from "@/ffp/lib/register-sync";
import { prisma } from "@/ffp/lib/db/client";
import { ExportPickerForm } from "./export-picker-form";
import { resolveArrangement, BLOCKS, isBlockEmpty } from "@/ffp/lib/domain/report-arrangement";
import { loadReportData } from "@/ffp/lib/reports/load-report-data";

export default async function ExportPickerPage(props: PageProps<"/[slug]/processes/export">) {
  const { slug: workspaceId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);

  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const processes = await prisma.process.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { code: "asc" },
  });

  // Which blocks would come out empty for every process in this pack, so a
  // consultant can see what is still to be captured without exporting to find
  // out. The export page is not a hot path, and this is the same data the
  // report itself reads.
  const report = await loadReportData(
    workspaceId,
    processes.map((p) => p.id)
  );
  const emptyBlockIds = BLOCKS.filter((block) =>
    (report?.processes ?? []).every((process) => isBlockEmpty(block.id, process))
  ).map((block) => block.id);

  return (
    <main className="w-full">

      {processes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-400">
          No processes yet in {workspace.name}.
        </p>
      ) : (
        <ExportPickerForm
          workspaceId={workspaceId}
          processes={processes.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
          arrangement={resolveArrangement(workspace.reportArrangement)}
          emptyBlockIds={emptyBlockIds}
        />
      )}
    </main>
  );
}
