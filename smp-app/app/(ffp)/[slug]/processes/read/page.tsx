import Link from "next/link";
import { prisma } from "@/ffp/lib/db/client";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { awaitingApproval, planAwaitingApprovalBy } from "@/ffp/lib/data/process-reading";

export default async function ReadList(props: PageProps<"/[slug]/processes/read">) {
  const { slug } = await props.params;
  const seat = await readerSeat(slug);
  const processes = await prisma.process.findMany({
    where: { workspaceId: slug, archivedAt: null, lifecycleStatus: "PUBLISHED" },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, sopVersion: true, sopEffectiveDate: true, versions: { where: { publishedAt: { not: null } }, orderBy: { number: "desc" }, take: 1, select: { number: true } } },
  });
  const key = seat.ok ? seat.personKey : null;
  const acked = key
    ? await prisma.processAcknowledgement.findMany({ where: { personKey: key, processId: { in: processes.map((p) => p.id) } }, select: { processId: true, versionNumber: true } })
    : [];
  const done = new Set(acked.map((a) => `${a.processId}:${a.versionNumber}`));
  const toApprove = key ? await awaitingApproval(slug, key) : [];
  const planToApprove = key ? await planAwaitingApprovalBy(slug, key) : false;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Processes</h1>
      <p className="mt-1 mb-4 text-sm text-slate-500">The approved way we work. Open one to read it and confirm you have.</p>
      {(toApprove.length > 0 || planToApprove) && (
        <section className="mb-5" aria-labelledby="approve-h">
          <h2 id="approve-h" className="mb-2 text-sm font-semibold text-slate-900">Waiting for your approval</h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-amber-200 bg-amber-50">
            {planToApprove && (
              <li>
                <Link href={`/${slug}/processes/read/priorities`} className="flex flex-wrap items-baseline gap-x-3 px-4 py-3 hover:bg-amber-100">
                  <span className="font-semibold text-slate-900">Deep-dive priorities</span>
                  <span className="text-xs text-slate-600">which processes to take deep, and in what order</span>
                  <span className="ms-auto text-xs font-semibold text-amber-800">Open to approve</span>
                </Link>
              </li>
            )}
            {toApprove.map((p) => (
              <li key={p.id}>
                <Link href={`/${slug}/processes/read/${p.id}`} className="flex flex-wrap items-baseline gap-x-3 px-4 py-3 hover:bg-amber-100">
                  <span className="font-mono text-xs text-slate-500">{p.code}</span>
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="ms-auto text-xs font-semibold text-amber-800">Open to approve</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {processes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">Nothing has been published yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {processes.map((p) => {
            const n = p.versions[0]?.number ?? 0;
            const read = done.has(`${p.id}:${n}`);
            return (
              <li key={p.id}>
                <Link href={`/${slug}/processes/read/${p.id}`} className="flex flex-wrap items-baseline gap-x-3 px-4 py-3 hover:bg-slate-50">
                  <span className="font-mono text-xs text-slate-500">{p.code}</span>
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="text-xs text-slate-500">v{n}</span>
                  {key && (
                    <span className={`ms-auto text-xs font-semibold ${read ? "text-emerald-700" : "text-amber-700"}`}>
                      {read ? "You have read this version" : "Needs your acknowledgement"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
