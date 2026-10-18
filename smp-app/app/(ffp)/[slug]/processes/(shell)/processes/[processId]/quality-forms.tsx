"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProcessControl,
  deleteProcessControl,
  createNonConformance,
  setNonConformanceStatus,
} from "@/ffp/lib/actions/process-quality";

const input = "w-full rounded-md border border-slate-300 px-2 py-1 text-sm";

type Step = { id: string; label: string };

export function AddControlForm({ workspaceId, processId, steps }: { workspaceId: string; processId: string; steps: Step[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "");
    start(async () => {
      const res = await createProcessControl({
        workspaceId,
        processId,
        stepId: g("stepId"),
        risk: g("risk"),
        riskLevel: g("riskLevel") as "low" | "medium" | "high",
        control: g("control"),
        controlType: g("controlType") as "" | "preventive" | "detective" | "corrective",
        frequency: g("frequency"),
        owner: g("owner"),
        evidence: g("evidence"),
        lastTestResult: g("lastTestResult") as "" | "pass" | "fail" | "not_tested",
      });
      if (!res.ok) {
        setError("Could not save. Check that a risk is written and try again.");
        return;
      }
      setError(null);
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
      <label className="sm:col-span-2 text-xs text-slate-500">
        Risk
        <input name="risk" required maxLength={300} className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Step
        <select name="stepId" className={input} defaultValue="">
          <option value="">Whole process</option>
          {steps.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Risk level
        <select name="riskLevel" className={input} defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label className="sm:col-span-2 text-xs text-slate-500">
        Control
        <input name="control" maxLength={300} className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Control type
        <select name="controlType" className={input} defaultValue="">
          <option value="">Not set</option>
          <option value="preventive">Preventive</option>
          <option value="detective">Detective</option>
          <option value="corrective">Corrective</option>
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Last test
        <select name="lastTestResult" className={input} defaultValue="not_tested">
          <option value="not_tested">Not tested</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Frequency
        <input name="frequency" maxLength={60} className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Owner
        <input name="owner" maxLength={80} className={input} />
      </label>
      <label className="sm:col-span-2 text-xs text-slate-500">
        Evidence
        <input name="evidence" maxLength={200} className={input} />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Add risk and control"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

export function DeleteControlButton({ workspaceId, processId, id }: { workspaceId: string; processId: string; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteProcessControl({ workspaceId, processId, id });
          router.refresh();
        })
      }
      className="text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
      aria-label="Remove this risk"
    >
      Remove
    </button>
  );
}

export function AddNonConformanceForm({ workspaceId, processId }: { workspaceId: string; processId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "");
    start(async () => {
      const res = await createNonConformance({
        workspaceId,
        processId,
        title: g("title"),
        detail: g("detail"),
        correctiveAction: g("correctiveAction"),
        actionOwner: g("actionOwner"),
      });
      if (!res.ok) {
        setError("Could not save. Check that a title is written and try again.");
        return;
      }
      setError(null);
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
      <label className="sm:col-span-2 text-xs text-slate-500">
        What went wrong
        <input name="title" required maxLength={200} className={input} />
      </label>
      <label className="sm:col-span-2 text-xs text-slate-500">
        Detail
        <textarea name="detail" maxLength={1000} rows={2} className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Corrective action
        <input name="correctiveAction" maxLength={500} className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Action owner
        <input name="actionOwner" maxLength={80} className={input} />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Record non-conformance"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

export function NonConformanceStatus({
  workspaceId,
  processId,
  id,
  status,
}: {
  workspaceId: string;
  processId: string;
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      aria-label="Status"
      onChange={(e) =>
        start(async () => {
          await setNonConformanceStatus({
            workspaceId,
            processId,
            id,
            status: e.target.value as "open" | "in_progress" | "closed",
          });
          router.refresh();
        })
      }
      className="rounded-md border border-slate-300 px-1 py-0.5 text-xs"
    >
      <option value="open">Open</option>
      <option value="in_progress">In progress</option>
      <option value="closed">Closed</option>
    </select>
  );
}
