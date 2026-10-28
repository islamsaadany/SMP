import Link from "next/link";
import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady } from "@/ffp/lib/register-sync";
import { prisma } from "@/ffp/lib/db/client";
import { gapsByProcess } from "@/ffp/lib/data/process-gaps";
import { unmatchedRoles } from "@/ffp/lib/data/role-matching";
import { getMessages } from "@/ffp/lib/i18n/server";

/**
 * To handle (spec 067 §4.2): what waits on the office. A draft the approver
 * sent back, with their note; an approved process waiting to be published; and
 * the processes still being drawn that have gaps; and the job roles still to
 * match to the register's titles (stage 1b). Suggestions from owners join
 * this list when they exist (stage 4). Each row opens the process, where its
 * lifecycle panel does the sending and the publishing.
 */
export default async function ToHandlePage(props: PageProps<"/[slug]/processes/handle">) {
  const { slug: workspaceId } = await props.params;
  await requireOffice(workspaceId);
  await registerReady(workspaceId);
  const m = (await getMessages()).builder.handle;

  const [processes, gaps, toMatch] = await Promise.all([
    prisma.process.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, code: true, name: true, lifecycleStatus: true, returnReason: true, approverName: true },
      orderBy: { code: "asc" },
    }),
    gapsByProcess(workspaceId),
    unmatchedRoles(workspaceId),
  ]);
  const sentBack = processes.filter((p) => p.lifecycleStatus === "DRAFT" && p.returnReason);
  const approved = processes.filter((p) => p.lifecycleStatus === "APPROVED");
  const withGaps = processes.filter((p) => p.lifecycleStatus !== "PUBLISHED" && (gaps.get(p.id) ?? 0) > 0);
  const open = (id: string) => `/${workspaceId}/processes/processes/${id}`;

  if (!sentBack.length && !approved.length && !withGaps.length && !toMatch.length)
    return (
      <main className="w-full">
        <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">
          <b className="mb-1 block text-[15px] text-[#171B22]">{m.emptyTitle}</b>
          {m.emptyBody}
        </div>
      </main>
    );

  const chip = (tone: "bad" | "gold" | "plain", text: string) => (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-px text-[10.5px] font-bold uppercase tracking-[.04em] ${
        tone === "bad" ? "border-[#B04434] bg-[#F7E3E0] text-[#8C3327]" : tone === "gold" ? "border-[#C9A24D] bg-[#FBF6E9] text-[#8A6B22]" : "border-[#D6DCE5] bg-white text-[#414A58]"
      }`}
    >
      {text}
    </span>
  );
  const row = "grid grid-cols-[110px_minmax(0,1fr)_auto] items-start gap-3 border-t border-[#E6EAF0] px-4 py-3 first:border-t-0 max-sm:grid-cols-[minmax(0,1fr)]";
  const openBtn = (id: string) => (
    <Link href={open(id)} className="whitespace-nowrap rounded-md bg-[#C9A24D] px-3 py-1.5 text-[12.5px] font-bold text-[#16325C]">
      {m.open}
    </Link>
  );

  return (
    <main className="w-full">
      <div className="overflow-hidden rounded-lg border border-[#D6DCE5] bg-white">
        {sentBack.map((p) => (
          <div key={p.id} className={row}>
            <span>{chip("bad", m.sentBack)}</span>
            <div className="min-w-0 text-[13.5px]">
              <span className="font-mono text-xs font-bold text-[#16325C]">{p.code}</span> <b>{p.name}</b>
              <small className="block text-[12.5px] text-[#636C79]">{m.sentBackBy(p.approverName ?? m.theApprover)}</small>
              <blockquote className="mt-1.5 border-s-[3px] border-[#C9A24D] bg-[#FBF6E9] px-2.5 py-1.5 text-[13px] text-[#414A58]">{p.returnReason}</blockquote>
            </div>
            <div>{openBtn(p.id)}</div>
          </div>
        ))}
        {approved.map((p) => (
          <div key={p.id} className={row}>
            <span>{chip("gold", m.approved)}</span>
            <div className="min-w-0 text-[13.5px]">
              <span className="font-mono text-xs font-bold text-[#16325C]">{p.code}</span> <b>{p.name}</b>
              <small className="block text-[12.5px] text-[#636C79]">{m.approvedLine(p.approverName ?? m.theApprover)}</small>
            </div>
            <div>{openBtn(p.id)}</div>
          </div>
        ))}
        {toMatch.length > 0 && (
          <div className={row}>
            <span>{chip("gold", m.roles)}</span>
            <div className="min-w-0 text-[13.5px]">
              <b>{m.rolesLine(toMatch.length)}</b>
              <small className="block text-[12.5px] text-[#636C79]">{toMatch.map((r) => r.name).join(", ")}</small>
            </div>
            <div>
              <Link href={`/${workspaceId}/processes/roles`} className="whitespace-nowrap rounded-md bg-[#C9A24D] px-3 py-1.5 text-[12.5px] font-bold text-[#16325C]">
                {m.rolesOpen}
              </Link>
            </div>
          </div>
        )}
        {withGaps.length > 0 && (
          <div className={row}>
            <span>{chip("plain", m.gaps)}</span>
            <div className="min-w-0 text-[13.5px]">
              <b>{m.gapsLine(withGaps.length)}</b>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#636C79]">
                {withGaps.map((p) => (
                  <li key={p.id}>
                    <Link href={open(p.id)} className="underline decoration-[#C9A24D] underline-offset-2 hover:text-[#171B22]">
                      {p.code} {p.name}
                    </Link>{" "}
                    · {m.gapCount(gaps.get(p.id) ?? 0)}
                  </li>
                ))}
              </ul>
            </div>
            <div />
          </div>
        )}
      </div>
    </main>
  );
}
