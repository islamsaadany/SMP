"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveProcess, returnProcessToDraft } from "@/ffp/lib/actions/process-lifecycle";

/** The sticky bar at the foot of a process waiting for this person's approval. */
export function ApprovalBar({ workspaceId, processId }: { workspaceId: string; processId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sendingBack, setSendingBack] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error === "VALIDATION_ERROR" ? (res.message ?? "That could not be saved") : (res.error ?? "Failed"));
        return;
      }
      router.push(`/${workspaceId}/processes/read`);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
        <span className="text-sm text-slate-700">You are asked to approve this version.</span>
        {sendingBack ? (
          <>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why it is sent back"
              maxLength={500}
              aria-label="Why it is sent back"
              className="min-w-60 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={pending || !reason.trim()}
              onClick={() => run(() => returnProcessToDraft({ workspaceId, processId, reason }))}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
            >
              Send back
            </button>
            <button type="button" onClick={() => setSendingBack(false)} className="text-sm font-semibold text-slate-600 underline">
              Cancel
            </button>
          </>
        ) : (
          <div className="ms-auto flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setSendingBack(true)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
            >
              Send back
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => approveProcess({ workspaceId, processId }))}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {pending ? "Saving…" : "Approve"}
            </button>
          </div>
        )}
        {error && <span role="alert" className="w-full text-sm text-rose-700">{error}</span>}
      </div>
    </div>
  );
}
