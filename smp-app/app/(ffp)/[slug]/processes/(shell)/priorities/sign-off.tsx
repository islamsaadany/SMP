import Link from "next/link";
import { buildSnapshot, type PlanView, type PriorityRow } from "@/ffp/lib/data/priorities";
import { goesDeep } from "@/ffp/lib/domain/priorities";
import { planUnits } from "@/ffp/lib/domain/priority-units";
import { PrioritiesDocument } from "../../priorities-document";
import { PlanActions, type ApproverOption } from "./plan-actions";

export function SignOff({
  workspaceId,
  clientName,
  plan,
  rows,
  canEdit,
  people,
  isSender,
}: {
  workspaceId: string;
  clientName: string;
  plan: PlanView;
  rows: PriorityRow[];
  canEdit: boolean;
  people: ApproverOption[];
  isSender: boolean;
}) {
  // A draft shows the proposal as it stands; once sent, what was sent.
  const snapshot = plan.status === "DRAFT" || !plan.snapshot ? buildSnapshot(plan, rows) : plan.snapshot;
  return (
    <div>
      {plan.status === "DRAFT" && plan.returnReason && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">Sent back: {plan.returnReason}</p>
      )}
      <PrioritiesDocument clientName={clientName} snapshot={snapshot} status={plan.status} approvedBy={plan.approvedByName} approvedAt={plan.approvedAt} sentBy={plan.sentByName} />
      <PlanActions
        workspaceId={workspaceId}
        status={plan.status}
        canEdit={canEdit}
        people={people}
        canWithdraw={isSender}
        approverLabel={plan.approverName ? `${plan.approverName}${plan.approverRole ? ` (${plan.approverRole})` : ""}` : null}
        shortlisted={planUnits(rows).filter((r) => goesDeep(r.decision)).length}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/${workspaceId}/processes/reports/priorities`} target="_blank" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Export one page
        </Link>
        <span className="text-xs text-slate-500">Opens the page on its own, ready to print or save as PDF.</span>
      </div>
      {plan.history.length > 0 && (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 print:hidden" aria-label="Record">
          <h2 className="text-sm font-semibold text-slate-900">Record</h2>
          <ol className="mt-2 space-y-1.5 text-sm text-slate-700">
            {[...plan.history].reverse().map((h, i) => (
              <li key={i}><span className="text-xs text-slate-500">{h.at.slice(0, 10)}</span> · <b>{h.by}</b> — {h.what}{h.reason ? ` (“${h.reason}”)` : ""}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
