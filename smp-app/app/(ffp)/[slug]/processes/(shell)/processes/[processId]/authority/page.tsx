import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { buildAuthorityTableRows, validateAuthorityTable } from "@/ffp/lib/domain/authority-table";
import { AuthorityTable } from "./authority-table";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

export default async function AuthorityMatrixPage(
  props: PageProps<"/[slug]/processes/processes/[processId]/authority">
) {
  const { slug: workspaceId, processId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);

  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [roles, people, activities, steps, assignments] = await Promise.all([
    prisma.role.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.person.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.activity.findMany({ where: { processId }, orderBy: { order: "asc" } }),
    prisma.processStep.findMany({
      where: { processId },
      select: { id: true, type: true, label: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.authorityAssignment.findMany({ where: { processId }, include: AUTHORITY_ASSIGNMENT_INCLUDE }),
  ]);

  const rows = buildAuthorityTableRows(
    steps,
    activities.map((a) => ({ id: a.id, name: a.name, relatedStepId: a.relatedStepId, order: a.order })),
    assignments.map(toAuthorityAssignmentData)
  );

  const issues = validateAuthorityTable(rows);

  return (
    <main className="w-full">
      <div className="mb-2 flex items-center justify-end gap-3">
        <div className="flex gap-2">
          <a
            href={`/api/ffp/export/authority/${processId}?format=pdf`}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export PDF
          </a>
          <a
            href={`/api/ffp/export/authority/${processId}?format=xlsx`}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </a>
        </div>
      </div>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Each task carries as many rules as it needs. A rule turns on an amount of money or an elapsed time, and says
        what happens then — the task needs approval, or it escalates.
      </p>

      <AuthorityTable
        workspaceId={workspaceId}
        processId={processId}
        roles={roles.map((r) => ({ id: r.id, name: r.name }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        initialRows={rows}
        initialIssues={issues}
      />
    </main>
  );
}
