import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { AcknowledgeBar } from "./acknowledge-bar";

/** One published process, read-only: what it is, what changed, who does what. */
export default async function ReadProcess(props: PageProps<"/[slug]/processes/read/[processId]">) {
  const { slug, processId } = await props.params;
  const seat = await readerSeat(slug);
  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      workspaceId: true, archivedAt: true, lifecycleStatus: true, code: true, name: true, processPurpose: true,
      inScope: true, outOfScope: true, sopVersion: true, sopEffectiveDate: true,
      steps: {
        orderBy: { order: "asc" },
        select: { id: true, type: true, label: true, detailedAction: true, assignedRole: { select: { name: true } } },
      },
    },
  });
  // Only what is published, in this client: a draft or a retired process is not for staff to read.
  if (!process || process.workspaceId !== slug || process.archivedAt || process.lifecycleStatus !== "PUBLISHED") notFound();

  const version = await prisma.processVersion.findFirst({
    where: { processId, publishedAt: { not: null } },
    orderBy: { number: "desc" },
    select: { number: true, changeNote: true },
  });
  const key = seat.ok ? seat.personKey : null;
  const already =
    key && version
      ? !!(await prisma.processAcknowledgement.findUnique({
          where: { processId_versionNumber_personKey: { processId, versionNumber: version.number, personKey: key } },
          select: { id: true },
        }))
      : false;
  const steps = process.steps.filter((s) => s.type === "TASK" || s.type === "DECISION");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 pb-28">
      <Link href={`/${slug}/processes/read`} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
        ← All processes
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">
        {process.name} <span className="ms-1 rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700">{process.code}</span>
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Version {version?.number ?? "—"}
        {process.sopEffectiveDate ? ` · in force from ${process.sopEffectiveDate}` : ""}
      </p>

      {version?.changeNote && (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">What changed in this version</h2>
          <p className="mt-1 text-sm text-amber-900">{version.changeNote}</p>
        </section>
      )}

      {process.processPurpose && (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Purpose</h2>
          <p className="mt-1 text-sm text-slate-700">{process.processPurpose}</p>
        </section>
      )}

      {(process.inScope.length > 0 || process.outOfScope.length > 0) && (
        <section className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Covers</h2>
            <ul className="mt-1 list-disc ps-5 text-sm text-slate-700">{process.inScope.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Does not cover</h2>
            <ul className="mt-1 list-disc ps-5 text-sm text-slate-700">{process.outOfScope.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </section>
      )}

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">The steps</h2>
        {steps.length === 0 ? (
          <p className="text-sm text-slate-500">No steps are written down.</p>
        ) : (
          <ol className="space-y-3 text-sm">
            {steps.map((s, i) => (
              <li key={s.id} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                <div className="font-semibold text-slate-900">
                  {i + 1}. {s.label}
                  {s.type === "DECISION" ? <span className="ms-2 text-xs font-normal text-slate-500">decision</span> : null}
                </div>
                <div className="text-xs text-slate-500">{s.assignedRole ? `Done by: ${s.assignedRole.name}` : "No role named"}</div>
                {s.detailedAction.length > 0 && (
                  <ul className="mt-1 list-disc ps-5 text-slate-700">{s.detailedAction.map((a, j) => <li key={j}>{a}</li>)}</ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <AcknowledgeBar
        workspaceId={slug}
        processId={processId}
        version={version?.number ?? null}
        canAcknowledge={!!key && !!version}
        already={already}
      />
    </main>
  );
}
