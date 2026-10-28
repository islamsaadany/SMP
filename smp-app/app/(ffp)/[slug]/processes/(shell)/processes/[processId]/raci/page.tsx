import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { validateRaciMatrix } from "@/ffp/lib/domain/raci-validation";
import { buildRaciTableRows, computeVisibleRoleIds, type StepOwners } from "@/ffp/lib/domain/raci-table";
import { RaciIntro, RaciTable } from "./raci-table";
import { AddActivityForm } from "./activity-form";

export default async function RaciMatrixPage(
  props: PageProps<"/[slug]/processes/processes/[processId]/raci">
) {
  const { slug: workspaceId, processId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);

  const process = await prisma.process.findUnique({ where: { id: processId } });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [roles, activities, matrixStatus, steps, people] = await Promise.all([
    prisma.role.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.activity.findMany({
      where: { processId },
      include: { raciAssignments: true },
      orderBy: { order: "asc" },
    }),
    prisma.raciMatrixStatus.findUnique({ where: { processId } }),
    prisma.processStep.findMany({
      where: { processId },
      select: {
        id: true,
        type: true,
        label: true,
        raciSkipped: true,
        assignedRoleId: true,
        swimlaneRoleId: true,
        supportingRoles: { select: { id: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.person.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, managerId: true, personRoles: { select: { roleId: true } } },
    }),
  ]);

  // For each Role: the Role its holders' managers most often hold (ties go to
  // the lower id so the answer is stable). This is where "the owner's manager"
  // comes from — the Org Directory, never a guess.
  const rolesOf = new Map(people.map((p) => [p.id, p.personRoles.map((pr) => pr.roleId)]));
  const managerRoleOf = new Map<string, string>();
  const tally = new Map<string, Map<string, number>>();
  for (const p of people) {
    if (!p.managerId) continue;
    for (const ownerRole of rolesOf.get(p.id) ?? []) {
      const counts = tally.get(ownerRole) ?? new Map<string, number>();
      for (const mr of rolesOf.get(p.managerId) ?? []) {
        if (mr === ownerRole) continue;
        counts.set(mr, (counts.get(mr) ?? 0) + 1);
      }
      tally.set(ownerRole, counts);
    }
  }
  for (const [ownerRole, counts] of tally) {
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    if (best) managerRoleOf.set(ownerRole, best[0]);
  }
  const stepOwners: StepOwners = Object.fromEntries(
    steps.map((s) => [
      s.id,
      {
        ownerRoleId: s.assignedRoleId,
        managerRoleId: s.assignedRoleId ? (managerRoleOf.get(s.assignedRoleId) ?? null) : null,
      },
    ])
  );

  // Owner/supporting Roles a step already names — set on the Value Chain
  // board or the Process Map, independent of any RACI cell being clicked yet.
  const mentionedRoleIds = Array.from(
    new Set(
      steps.flatMap((s) =>
        [s.assignedRoleId, s.swimlaneRoleId, ...s.supportingRoles.map((r) => r.id)].filter(
          (id): id is string => id !== null
        )
      )
    )
  );

  const rows = buildRaciTableRows(
    steps,
    activities.map((a) => ({
      id: a.id,
      name: a.name,
      relatedStepId: a.relatedStepId,
      order: a.order,
      assignments: a.raciAssignments.map((ra) => ({ roleId: ra.roleId, code: ra.code })),
    }))
  );

  const issues = validateRaciMatrix(
    rows
      .filter((r) => !r.skipped)
      .map((r) => ({
        activityId: r.id,
        name: r.label,
        assignments: Object.entries(r.assignments).map(([roleId, code]) => ({ roleId, code })),
      }))
  );

  const visibleRoleIds = computeVisibleRoleIds(
    roles.map((r) => r.id),
    rows,
    process.raciVisibleRoleIds,
    mentionedRoleIds
  );
  const visibleRoles = roles.filter((r) => visibleRoleIds.includes(r.id));

  return (
    <main className="w-full">
      <div className="mb-2 flex items-center justify-end gap-3">
        <div className="flex gap-2">
          <a
            href={`/api/ffp/export/raci/${processId}?format=pdf`}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export PDF
          </a>
          <a
            href={`/api/ffp/export/raci/${processId}?format=xlsx`}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </a>
        </div>
      </div>
      <RaciIntro />

      <RaciTable
        workspaceId={workspaceId}
        processId={processId}
        allRoles={roles.map((r) => ({ id: r.id, name: r.name }))}
        initialVisibleRoles={visibleRoles.map((r) => ({ id: r.id, name: r.name }))}
        initialRows={rows}
        initialIssues={issues}
        initialStatus={matrixStatus?.status ?? "DRAFT"}
        stepOwners={stepOwners}
      />

      <AddActivityForm workspaceId={workspaceId} processId={processId} />
    </main>
  );
}
