import Link from "next/link";
import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady } from "@/ffp/lib/register-sync";
import { prisma } from "@/ffp/lib/db/client";
import { auth } from "@/ffp/lib/auth/config";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { hasSufficientAccess } from "@/ffp/lib/domain/access-control";
import { loadPlan, loadPriorityRows } from "@/ffp/lib/data/priorities";
import { planEditable } from "@/ffp/lib/domain/priorities";
import { WorkspacePageHeader } from "../workspace-page-header";
import { ScoreTable } from "./score-table";
import { RankView } from "./rank-view";
import { PlanBoard } from "./plan-board";
import { SignOff } from "./sign-off";

const STEPS = [
  { key: "score", n: 1, label: "Score", sub: "Importance, complexity, risk" },
  { key: "rank", n: 2, label: "Rank", sub: "See them side by side" },
  { key: "plan", n: 3, label: "Plan", sub: "Waves and progress" },
  { key: "sign", n: 4, label: "Sign-off", sub: "One page for the client" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];
const parseStep = (raw: string | string[] | undefined): StepKey => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return STEPS.some((s) => s.key === v) ? (v as StepKey) : "score";
};

/** Choosing which high-level processes to take deep: score, rank, plan, and the client's sign-off. */
export default async function PrioritiesPage(props: PageProps<"/[slug]/processes/priorities">) {
  const { slug: workspaceId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);
  const sp = await props.searchParams;
  const step = parseStep(sp.step);
  const sel = Array.isArray(sp.sel) ? sp.sel[0] : sp.sel;

  const access = await requireWorkspaceAccess(workspaceId, "VIEWER");
  const canEdit = access.ok && hasSufficientAccess(access.data.accessLevel, "EDITOR");
  const [plan, workspace, session, register] = await Promise.all([
    loadPlan(workspaceId),
    prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } }),
    auth(),
    prisma.person.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, smpKey: true, personRoles: { select: { role: { select: { name: true, archivedAt: true } } } } },
    }),
  ]);
  const rows = await loadPriorityRows(workspaceId, plan.weights);
  const editable = canEdit && planEditable(plan.status);
  const lockedMessage =
    !planEditable(plan.status)
      ? plan.status === "SENT"
        ? "The plan is with the client, so scores, weights and decisions are locked. Reopen it on the Sign-off step, with a reason, to change it."
        : "The plan is approved, so scores, weights and decisions are locked. Reopen it on the Sign-off step, with a reason, to change it."
      : null;
  const people = register.map((x) => {
    const roles = x.personRoles.filter((r) => !r.role.archivedAt).map((r) => r.role.name);
    return { id: x.id, name: x.name, email: x.email, key: x.smpKey, role: roles.length ? roles.join(", ") : null };
  });
  const isSender = !!session && session.user.email.trim().toLowerCase() === (plan.sentByEmail ?? "").trim().toLowerCase();
  const base = `/${workspaceId}/processes/priorities`;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-8">
      <div className="mx-auto w-full max-w-6xl xl:mx-0 xl:ms-[17rem] xl:w-auto">
        <WorkspacePageHeader title="Deep-dive priorities" subtitle={`${rows.length} high-level process${rows.length === 1 ? "" : "es"}. Which ones do we take deep next: full steps, RACI, controls and an SOP?`} />
        <nav aria-label="Steps" className="mb-4 grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4">
          {STEPS.map((s) => (
            <Link
              key={s.key}
              href={`${base}?step=${s.key}`}
              aria-current={s.key === step ? "step" : undefined}
              className={`border-slate-200 px-4 py-2.5 text-sm sm:border-e last:border-e-0 ${s.key === step ? "bg-slate-50 shadow-[inset_0_3px_0_0_#b45309]" : "hover:bg-slate-50"}`}
            >
              <b className="block text-slate-900">{s.n} · {s.label}</b>
              <span className="text-xs text-slate-500">{s.sub}</span>
            </Link>
          ))}
        </nav>

        {step !== "sign" && (
          <div className="mb-3 flex justify-end">
            <a href={`/api/ffp/export/priorities/${workspaceId}`} download className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
              Download as Excel
            </a>
          </div>
        )}
        {step === "score" && <ScoreTable workspaceId={workspaceId} rows={rows} weights={plan.weights} capacity={plan.capacity} editable={editable} lockedMessage={lockedMessage} />}
        {step === "rank" && <RankView workspaceId={workspaceId} rows={rows} selectedId={sel ?? null} editable={editable} />}
        {step === "plan" && <PlanBoard workspaceId={workspaceId} plan={plan} rows={rows} editable={editable} />}
        {step === "sign" && <SignOff workspaceId={workspaceId} clientName={workspace.name} plan={plan} rows={rows} canEdit={canEdit} people={people} isSender={isSender} />}
      </div>
    </main>
  );
}
