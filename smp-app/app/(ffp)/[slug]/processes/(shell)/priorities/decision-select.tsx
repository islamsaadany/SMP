"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDeepDiveDecision } from "@/ffp/lib/actions/priorities";
import { DECISIONS, DECISION_LABEL, type Decision } from "@/ffp/lib/domain/priorities";

export function DecisionSelect({ workspaceId, processId, value, disabled }: { workspaceId: string; processId: string; value: Decision | null; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={value ?? ""}
        disabled={disabled || pending}
        aria-label="Decision"
        onChange={(e) => {
          setError(null);
          start(async () => {
            const res = await setDeepDiveDecision({ workspaceId, processId, decision: (e.target.value || null) as Decision | null });
            if (!res.ok) setError(res.error === "VALIDATION_ERROR" ? (res.message ?? "Could not save") : res.error);
            else router.refresh();
          });
        }}
        className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
      >
        <option value="">Not decided</option>
        {DECISIONS.map((d) => <option key={d} value={d}>{DECISION_LABEL[d]}</option>)}
      </select>
      {error && <span role="alert" className="text-rose-700">{error}</span>}
    </span>
  );
}
