"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reopenPriorityPlan, returnPriorityPlan, sendPlanForApproval } from "@/ffp/lib/actions/priorities";

export type ApproverOption = { id: string; name: string; email: string | null; role: string | null; key: string | null };

const primary = "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40";
const secondary = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40";

export function PlanActions({
  workspaceId,
  status,
  canEdit,
  people,
  canWithdraw,
  approverLabel,
  shortlisted,
}: {
  workspaceId: string;
  status: "DRAFT" | "SENT" | "APPROVED";
  canEdit: boolean;
  people: ApproverOption[];
  /** The signed-in office person is the one who sent it. */
  canWithdraw: boolean;
  approverLabel: string | null;
  shortlisted: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [approver, setApprover] = useState("");
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) { setError(res.error === "VALIDATION_ERROR" ? (res.message ?? "That could not be saved") : (res.error ?? "Failed")); return; }
      setReason("");
      router.refresh();
    });
  }
  const label = (x: { name: string; role: string | null }) => `${x.name}${x.role ? ` — ${x.role}` : ""}`;

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 print:hidden">
      {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      {status === "DRAFT" && canEdit && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Who signs for the client</span>
            <select value={approver} onChange={(e) => setApprover(e.target.value)} className="min-w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm" aria-label="Who signs for the client">
              <option value="" disabled>Choose from the People register…</option>
              {people.map((x) => {
                const missing = !x.email ? "no email" : !x.role ? "no role" : !x.key ? "not on the register" : null;
                return <option key={x.id} value={x.id} disabled={!!missing}>{label(x)}{missing ? ` (${missing})` : ""}</option>;
              })}
            </select>
          </label>
          <button type="button" disabled={pending || !approver || shortlisted === 0} onClick={() => run(() => sendPlanForApproval({ workspaceId, approverPersonId: approver }))} className={primary}>
            {pending ? "Sending…" : "Send to client for approval"}
          </button>
          {shortlisted === 0 && <span className="text-xs text-slate-500">Choose at least one process for Wave 1 or Wave 2 first.</span>}
        </div>
      )}
      {status === "SENT" && (
        <p className="text-sm text-slate-700">Waiting for {approverLabel ?? "the client"} to approve. They approve from their own reading page; the link is on the Governance page.</p>
      )}
      {status === "APPROVED" && <p className="text-sm text-emerald-800">Approved. Changing it from here needs a reason, which is kept on record.</p>}
      {canEdit && (status === "SENT" || status === "APPROVED") && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-64 flex-1 text-sm">
            <span className="mb-1 block font-semibold text-slate-700">{status === "SENT" && canWithdraw ? "Withdraw, or reopen to change it" : "Reopen to change it"}</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why" maxLength={500} aria-label="Why reopen" className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <button type="button" disabled={pending || !reason.trim()} onClick={() => run(() => (status === "SENT" && canWithdraw ? returnPriorityPlan({ workspaceId, reason }) : reopenPriorityPlan({ workspaceId, reason })))} className={secondary}>
            {status === "SENT" && canWithdraw ? "Withdraw" : "Reopen"}
          </button>
        </div>
      )}
    </div>
  );
}
