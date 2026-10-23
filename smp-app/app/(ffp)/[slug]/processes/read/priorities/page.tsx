import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { loadPlan } from "@/ffp/lib/data/priorities";
import { planAwaitingApprovalBy } from "@/ffp/lib/data/process-reading";
import { PrioritiesDocument } from "../../priorities-document";
import { PlanApprovalBar } from "./plan-approval-bar";

/** The deep-dive priorities as the client was sent them — only for the person asked to approve them. */
export default async function ReadPriorities(props: PageProps<"/[slug]/processes/read/priorities">) {
  const { slug } = await props.params;
  const seat = await readerSeat(slug);
  const key = seat.ok ? seat.personKey : null;
  // Nobody else reads it: the plan is the office's working proposal until the named approver is asked.
  if (!key || !(await planAwaitingApprovalBy(slug, key))) notFound();
  const [plan, workspace] = await Promise.all([loadPlan(slug), prisma.workspace.findUniqueOrThrow({ where: { id: slug }, select: { name: true } })]);
  if (!plan.snapshot) notFound();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8 pb-28">
      <Link href={`/${slug}/processes/read`} className="text-xs font-semibold text-slate-500 hover:text-slate-900">← All processes</Link>
      <div className="mt-3">
        <PrioritiesDocument clientName={workspace.name} snapshot={plan.snapshot} status="SENT" sentBy={plan.sentByName} />
      </div>
      <PlanApprovalBar workspaceId={slug} />
    </main>
  );
}
