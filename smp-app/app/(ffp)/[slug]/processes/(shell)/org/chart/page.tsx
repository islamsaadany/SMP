import { registerReady } from "@/ffp/lib/register-sync";
import Link from "next/link";
import { prisma } from "@/ffp/lib/db/client";
import { WorkspacePageHeader } from "../../workspace-page-header";
import { OrgChartCanvas } from "./org-chart-canvas";

export default async function OrgChartPage(props: PageProps<"/[slug]/processes/org/chart">) {
  const { slug: workspaceId } = await props.params;
  await registerReady(workspaceId);

  const people = await prisma.person.findMany({
    where: { workspaceId, archivedAt: null },
    include: { personRoles: { include: { role: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <WorkspacePageHeader
        title="Org Chart"
        subtitle="Built from each person's manager in the Org Directory — set or change “Reports to” there."
        eyebrow={
          <Link href={`/${workspaceId}/processes/org`} className="font-semibold underline-offset-2 hover:underline">
            ← Org Directory
          </Link>
        }
        actions={
          <a
            href={`/api/ffp/export/org-chart/${workspaceId}`}
            className="rounded-lg border border-[var(--accent-ink)]/30 bg-[var(--accent-ink)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-ink)]/20"
          >
            Export PDF
          </a>
        }
      />

      {people.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          No people yet —{" "}
          <Link href={`/${workspaceId}/processes/org`} className="font-semibold text-slate-600 hover:text-slate-900">
            add some in the Org Directory
          </Link>{" "}
          first.
        </p>
      ) : (
        <OrgChartCanvas
          people={people.map((p) => ({
            id: p.id,
            name: p.name,
            managerId: p.managerId,
            roleNames: p.personRoles.map((pr) => pr.role.name),
          }))}
        />
      )}
    </main>
  );
}
