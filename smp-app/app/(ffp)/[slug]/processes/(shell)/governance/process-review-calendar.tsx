import Link from "next/link";
import { StaffLink } from "../staff-link";
import { prisma } from "@/ffp/lib/db/client";
import { reviewBucket, type ReviewBucket } from "@/ffp/lib/domain/process-lifecycle";

const GROUPS: { key: ReviewBucket; title: string; tone: string }[] = [
  { key: "overdue", title: "Overdue", tone: "text-rose-700" },
  { key: "next30", title: "Next 30 days", tone: "text-amber-700" },
  { key: "next90", title: "31 to 90 days", tone: "text-slate-700" },
  { key: "later", title: "Later", tone: "text-slate-500" },
];

/** When each Published process is next due for review, grouped by how soon. Read-only. */
export async function ProcessReviewCalendar({ workspaceId }: { workspaceId: string }) {
  const rows = await prisma.process.findMany({
    where: { workspaceId, archivedAt: null, lifecycleStatus: "PUBLISHED", nextReviewDue: { not: null } },
    orderBy: { nextReviewDue: "asc" },
    select: { id: true, code: true, name: true, sopVersion: true, approverName: true, approverRole: true, nextReviewDue: true },
  });
  const today = new Date();
  const grouped = new Map<ReviewBucket, typeof rows>(GROUPS.map((g) => [g.key, []]));
  for (const r of rows) grouped.get(reviewBucket(r.nextReviewDue!, today))!.push(r);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="review-calendar">
      <div className="mb-4 border-b border-slate-100 pb-3">
        <StaffLink label="Staff reading page" path={`/${workspaceId}/processes/read`} />
        <p className="mt-1 text-xs text-slate-500">Everything published, for staff to read and acknowledge. Send it to the people on the register.</p>
      </div>
      <h2 id="review-calendar" className="text-sm font-semibold text-slate-900">
        Process review calendar
      </h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No process is published yet, so none has a review date. Publishing a process starts its review clock.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {GROUPS.map((g) => {
            const list = grouped.get(g.key)!;
            if (list.length === 0) return null;
            return (
              <div key={g.key}>
                <h3 className={`mb-1 text-xs font-semibold uppercase ${g.tone}`}>
                  {g.title} · {list.length}
                </h3>
                <ul className="divide-y divide-slate-100 text-sm">
                  {list.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 py-1.5">
                      <span className="w-24 font-mono text-xs text-slate-500">{r.nextReviewDue!.toISOString().slice(0, 10)}</span>
                      <Link
                        href={`/${workspaceId}/processes/processes/${r.id}?tab=lifecycle`}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {r.code} · {r.name}
                      </Link>
                      <span className="text-slate-500">
                        {r.sopVersion ?? ""}
                        {r.approverName ? ` · approved by ${r.approverName}${r.approverRole ? ` (${r.approverRole})` : ""}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
