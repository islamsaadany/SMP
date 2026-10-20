import Link from "next/link";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import type { Revision } from "@/ffp/lib/domain/sop";
import { ProcessTabs, parseTab } from "./process-tabs";

type Kpi = { metric: string; target: string; frequency: string };

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
      {children}
    </p>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">None recorded.</p>;
  return (
    <ul className="list-disc ps-5 text-sm text-slate-700">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

export default async function ProcessPage(props: PageProps<"/[slug]/processes/processes/[processId]">) {
  const { slug: workspaceId, processId } = await props.params;
  const tab = parseTab((await props.searchParams).tab);
  await registerReady(workspaceId);

  const process = await prisma.process.findUnique({
    where: { id: processId },
    include: { parentProcess: true, _count: { select: { steps: true } } },
  });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const base = `/${workspaceId}/processes/processes/${processId}`;
  const kpis = (process.kpis as unknown as Kpi[]) ?? [];
  const revisions = (process.sopRevisions as unknown as Revision[]) ?? [];

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        {process.parentProcess && (
          <div className="mb-1 text-xs text-slate-500">
            {process.parentProcess.code} · {process.parentProcess.name} <span className="mx-1">/</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{process.name}</h1>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700">
            {process.code}
          </span>
        </div>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          {process._count.steps} step(s) ·{" "}
          <Link href={`${base}/map`} className="font-semibold text-slate-700 hover:text-slate-900">
            Open process map →
          </Link>{" "}
          ·{" "}
          <Link href={`${base}/raci`} className="font-semibold text-slate-700 hover:text-slate-900">
            RACI →
          </Link>{" "}
          ·{" "}
          <Link href={`${base}/review`} className="font-semibold text-slate-700 hover:text-slate-900">
            AI review →
          </Link>
        </p>

        <ProcessTabs workspaceId={workspaceId} processId={processId} active={tab} />

        {tab === "overview" && (
          <>
            <Card title="Purpose">
              <p className="text-sm text-slate-700">{process.processPurpose || "No purpose recorded yet."}</p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="In scope">
                <List items={process.inScope} />
              </Card>
              <Card title="Out of scope">
                <List items={process.outOfScope} />
              </Card>
            </div>
            <Card title="Measures">
              {kpis.length === 0 ? (
                <p className="text-sm text-slate-500">No measures recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-start text-xs text-slate-500">
                    <tr>
                      <th className="py-1 text-start">Metric</th>
                      <th className="py-1 text-start">Target</th>
                      <th className="py-1 text-start">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((k, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1">{k.metric}</td>
                        <td className="py-1">{k.target}</td>
                        <td className="py-1">{k.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}

        {tab === "lifecycle" && (
          <>
            <Card title="Document control">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Version</dt>
                <dd>{process.sopVersion || "Not recorded yet"}</dd>
                <dt className="text-slate-500">Owner</dt>
                <dd>{process.sopOwner || "Not recorded yet"}</dd>
                <dt className="text-slate-500">Effective</dt>
                <dd>{process.sopEffectiveDate ? String(process.sopEffectiveDate).slice(0, 10) : "Not recorded yet"}</dd>
                <dt className="text-slate-500">Approved by</dt>
                <dd>{process.sopApprovedBy || "Not recorded yet"}</dd>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Edit these on the{" "}
                <Link href={`${base}/map`} className="font-semibold text-slate-700 underline">
                  process map page
                </Link>
                .
              </p>
            </Card>
            <Card title="Revision history">
              {revisions.length === 0 ? (
                <p className="text-sm text-slate-500">No revisions recorded yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {revisions.map((r, i) => (
                    <li key={i} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                      <span className="font-mono font-semibold">{r.version}</span> · {r.date} · {r.by}
                      <div className="text-slate-600">{r.change}</div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </>
        )}

        {tab === "risks" && <Empty>Risks and controls are not recorded yet for this process.</Empty>}
        {tab === "quality" && <Empty>Quality checks and non-conformances are not recorded yet for this process.</Empty>}
        {tab === "people" && <Empty>Who reads and acknowledges this process is not recorded yet.</Empty>}
        {tab === "compliance" && <Empty>Compliance coverage is not recorded yet for this process.</Empty>}
        {tab === "connections" && (
          <Empty>
            Connections to pillars, Tracker actions and systems are not recorded yet. The step-level hand-overs
            live on the{" "}
            <Link href={`${base}/map`} className="font-semibold underline">
              process map
            </Link>
            .
          </Empty>
        )}
      </div>
    </main>
  );
}
