"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProcessSop } from "@/ffp/lib/actions/process";
import type { Revision } from "@/ffp/lib/domain/sop";
import { useCanEdit } from "../../../workspace-access";

const MISSING = <span className="font-bold text-red-700">Missing</span>;

/** The SOP's document control and its hand-kept revision list. Nothing here is recorded automatically. */
export function SopDocumentControl({
  workspaceId,
  processId,
  sopVersion,
  sopOwner,
  sopEffectiveDate,
  sopApprovedBy,
  revisions,
}: {
  workspaceId: string;
  processId: string;
  sopVersion: string | null;
  sopOwner: string | null;
  sopEffectiveDate: string | null;
  sopApprovedBy: string | null;
  revisions: Revision[];
}) {
  const canEdit = useCanEdit();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(sopVersion ?? "");
  const [owner, setOwner] = useState(sopOwner ?? "");
  const [effective, setEffective] = useState(sopEffectiveDate ?? "");
  const [approver, setApprover] = useState(sopApprovedBy ?? "");
  const [revs, setRevs] = useState<Revision[]>(revisions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setVersion(sopVersion ?? "");
    setOwner(sopOwner ?? "");
    setEffective(sopEffectiveDate ?? "");
    setApprover(sopApprovedBy ?? "");
    setRevs(revisions);
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateProcessSop({
        workspaceId,
        processId,
        sopVersion: version,
        sopOwner: owner,
        sopEffectiveDate: effective,
        sopApprovedBy: approver,
        sopRevisions: revs.filter((r) => r.version.trim()),
      });
      if (!result.ok) {
        setError(result.error === "VALIDATION_ERROR" ? (result.message ?? "Invalid input") : result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function patchRev(i: number, patch: Partial<Revision>) {
    setRevs((items) => items.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const input = "rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm";

  if (editing) {
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-800">SOP document control</div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["Version", version, setVersion],
              ["Effective date", effective, setEffective],
              ["Owner", owner, setOwner],
              ["Approved by", approver, setApprover],
            ] as const
          ).map(([label, value, set]) => (
            <label key={label} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              {label}
              <input value={value} onChange={(e) => set(e.target.value)} className={input} />
            </label>
          ))}
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">Revision history</div>
          <div className="mt-1.5 space-y-2">
            {revs.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={r.version} aria-label="Version" placeholder="Version" onChange={(e) => patchRev(i, { version: e.target.value })} className={`${input} w-20`} />
                <input value={r.date} aria-label="Date" placeholder="Date" onChange={(e) => patchRev(i, { date: e.target.value })} className={`${input} w-28`} />
                <input value={r.by} aria-label="By" placeholder="By" onChange={(e) => patchRev(i, { by: e.target.value })} className={`${input} w-32`} />
                <input value={r.change} aria-label="What changed" placeholder="What changed" onChange={(e) => patchRev(i, { change: e.target.value })} className={`${input} flex-1`} />
                <button type="button" onClick={() => setRevs((items) => items.filter((_, idx) => idx !== i))} className="text-xs text-slate-400 hover:text-red-600">
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRevs((items) => [...items, { version: "", date: "", by: "", change: "" }])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              + Add a revision
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setEditing(false);
            }}
            disabled={pending}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-slate-800">SOP document control</div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit SOP document control"
            className="flex-none rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
        )}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {(
          [
            ["Version", sopVersion],
            ["Effective date", sopEffectiveDate],
            ["Owner", sopOwner],
            ["Approved by", sopApprovedBy],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-28 flex-none text-xs font-medium text-slate-500">{label}</dt>
            <dd>{value || MISSING}</dd>
          </div>
        ))}
      </dl>
      {revisions.length > 0 && (
        <ul className="mt-2 text-xs text-slate-700">
          {revisions.map((r, i) => (
            <li key={i}>
              <strong>{r.version}</strong> · {r.date} · {r.by} — {r.change}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
