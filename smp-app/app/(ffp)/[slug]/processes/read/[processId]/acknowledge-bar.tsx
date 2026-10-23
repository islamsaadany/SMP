"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeProcess } from "@/ffp/lib/actions/process-acknowledge";

/** The sticky bar at the foot of a process: "I have read version N". */
export function AcknowledgeBar(p: { workspaceId: string; processId: string; version: number | null; canAcknowledge: boolean; already: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
        {p.already ? (
          <span className="text-sm font-semibold text-emerald-700">You have read version {p.version}. Thank you.</span>
        ) : p.canAcknowledge ? (
          <>
            <span className="text-sm text-slate-700">Confirm you have read and understood version {p.version}.</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                start(async () => {
                  const res = await acknowledgeProcess({ workspaceId: p.workspaceId, processId: p.processId });
                  if (!res.ok) {
                    setError(res.error === "VALIDATION_ERROR" ? (res.message ?? "That could not be saved") : res.error);
                    return;
                  }
                  router.refresh();
                });
              }}
              className="ms-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {pending ? "Saving…" : "I have read this"}
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-500">You are looking at this as the office, which is not on the People register, so there is nothing to acknowledge.</span>
        )}
        {error && <span role="alert" className="w-full text-sm text-rose-700">{error}</span>}
      </div>
    </div>
  );
}
