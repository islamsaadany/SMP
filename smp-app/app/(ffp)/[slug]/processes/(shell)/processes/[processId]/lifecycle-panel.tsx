"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitProcessForReview,
  approveProcess,
  returnProcessToDraft,
  publishProcess,
  retireProcess,
  setReviewInterval,
} from "@/ffp/lib/actions/process-lifecycle";
import { STATUS_LABEL, type ProcessLifecycleStatus } from "@/ffp/lib/domain/process-lifecycle";

const FLOW: ProcessLifecycleStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "RETIRED"];
const field = "w-full rounded-md border border-slate-300 px-2 py-1 text-sm";
const primary = "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40";
const secondary = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40";

export type PanelPerson = { id: string; name: string; email: string | null; role: string | null };

export type PanelProps = {
  workspaceId: string;
  processId: string;
  status: ProcessLifecycleStatus;
  people: PanelPerson[];
  approver: { name: string; role: string | null } | null;
  reviewers: { name: string; role: string | null }[];
  changeNote: string | null;
  submittedBy: string | null;
  returnReason: string | null;
  reviewIntervalMonths: number;
  /** Server-decided: this signed-in person is the named approver and did not send it up. */
  canApprove: boolean;
  /** Server-decided: this signed-in person is the approver or the sender. */
  canReturnFromReview: boolean;
};

export function LifecyclePanel(p: PanelProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  // The approver cannot also be a reviewer: their box is greyed and left out.
  const [approverId, setApproverId] = useState("");
  const [reviewerIds, setReviewerIds] = useState<ReadonlySet<string>>(new Set());

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error === "VALIDATION_ERROR" ? (res.message ?? "That could not be saved") : (res.error ?? "Failed"));
        return;
      }
      setReason("");
      router.refresh();
    });
  }

  const ids = { workspaceId: p.workspaceId, processId: p.processId };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(() =>
      submitProcessForReview({
        ...ids,
        approverPersonId: String(f.get("approver") ?? ""),
        reviewerPersonIds: [...reviewerIds].filter((id) => id !== approverId),
        changeNote: String(f.get("changeNote") ?? ""),
      })
    );
  }

  const label = (x: { name: string; role: string | null }) => `${x.name}${x.role ? ` — ${x.role}` : ""}`;

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <ol className="mb-4 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Lifecycle">
        {FLOW.map((s) => (
          <li
            key={s}
            aria-current={s === p.status ? "step" : undefined}
            className={
              s === p.status
                ? "rounded-full bg-slate-900 px-3 py-1 text-white"
                : "rounded-full border border-slate-200 px-3 py-1 text-slate-500"
            }
          >
            {STATUS_LABEL[s]}
          </li>
        ))}
      </ol>

      {error && (
        <p role="alert" className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {p.status === "DRAFT" && (
        <form onSubmit={submit} className="space-y-3">
          {p.returnReason && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Sent back: {p.returnReason}
            </p>
          )}
          <p className="text-sm text-slate-600">
            This is a draft. Pick who approves it and say what changed, then send it for review.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Approver</span>
            <select
              name="approver"
              required
              value={approverId}
              onChange={(e) => setApproverId(e.target.value)}
              className={field}
            >
              <option value="" disabled>
                Choose from the People register…
              </option>
              {p.people.map((x) => {
                const missing = !x.email ? "no email" : !x.role ? "no role" : null;
                return (
                  <option key={x.id} value={x.id} disabled={!!missing}>
                    {x.name}
                    {x.role ? ` — ${x.role}` : ""}
                    {missing ? ` (${missing} on the register)` : ""}
                  </option>
                );
              })}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              The approval records this person&apos;s name and role. They need an email and a role on the register.
            </span>
          </label>
          <fieldset className="text-sm">
            <legend className="mb-1 font-semibold text-slate-700">Reviewers (optional)</legend>
            <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-slate-200 p-2 sm:grid-cols-2">
              {p.people.map((x) => (
                <label key={x.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="reviewer"
                    value={x.id}
                    checked={x.id !== approverId && reviewerIds.has(x.id)}
                    disabled={x.id === approverId}
                    onChange={(e) => {
                      const next = new Set(reviewerIds);
                      if (e.target.checked) next.add(x.id);
                      else next.delete(x.id);
                      setReviewerIds(next);
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    {label(x)}
                    {x.id === approverId ? " (approver)" : ""}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">What changed</span>
            <textarea name="changeNote" required maxLength={500} rows={2} className={field} />
          </label>
          <button type="submit" disabled={pending} className={primary}>
            {pending ? "Sending…" : "Send for review"}
          </button>
        </form>
      )}

      {p.status !== "DRAFT" && (
        <dl className="mb-3 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500">Approver</dt>
          <dd>{p.approver ? label(p.approver) : "Not recorded"}</dd>
          <dt className="text-slate-500">Reviewers</dt>
          <dd>{p.reviewers.length ? p.reviewers.map(label).join("; ") : "None named"}</dd>
          <dt className="text-slate-500">Sent by</dt>
          <dd>{p.submittedBy ?? "Not recorded"}</dd>
          <dt className="text-slate-500">What changed</dt>
          <dd>{p.changeNote || "—"}</dd>
        </dl>
      )}

      {p.status === "IN_REVIEW" && (
        <div className="space-y-3">
          {p.canApprove ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => approveProcess(ids))}
              className={primary}
            >
              Approve
            </button>
          ) : (
            <p className="text-sm text-slate-600">
              Waiting for {p.approver ? label(p.approver) : "the approver"} to approve.
            </p>
          )}
          {p.canReturnFromReview && <ReturnForm reason={reason} setReason={setReason} pending={pending} onReturn={() => run(() => returnProcessToDraft({ ...ids, reason }))} />}
        </div>
      )}

      {p.status === "APPROVED" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Approved. Publishing makes it the official version and starts the review clock.</p>
          <button type="button" disabled={pending} onClick={() => run(() => publishProcess(ids))} className={primary}>
            Publish
          </button>
          <ReturnForm reason={reason} setReason={setReason} pending={pending} onReturn={() => run(() => returnProcessToDraft({ ...ids, reason }))} />
        </div>
      )}

      {p.status === "PUBLISHED" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">Review every</span>
            <input
              type="number"
              min={1}
              max={60}
              defaultValue={p.reviewIntervalMonths}
              aria-label="Review interval in months"
              className="w-20 rounded-md border border-slate-300 px-2 py-1"
              onBlur={(e) => {
                const months = Number(e.currentTarget.value);
                if (months !== p.reviewIntervalMonths && Number.isInteger(months)) run(() => setReviewInterval({ ...ids, months }));
              }}
            />
            <span>months</span>
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Retire this process? It stays on record but is no longer in force.")) run(() => retireProcess(ids));
            }}
            className={secondary}
          >
            Retire
          </button>
        </div>
      )}

      {p.status === "RETIRED" && <p className="text-sm text-slate-600">Retired. It stays on record but is no longer in force.</p>}
    </section>
  );
}

function ReturnForm(props: { reason: string; setReason: (s: string) => void; pending: boolean; onReturn: () => void }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-60 flex-1 text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Send back to draft</span>
        <input
          value={props.reason}
          onChange={(e) => props.setReason(e.target.value)}
          placeholder="Why"
          maxLength={500}
          className={field}
        />
      </label>
      <button type="button" disabled={props.pending || !props.reason.trim()} onClick={props.onReturn} className={secondary}>
        Send back
      </button>
    </div>
  );
}
