"use client";

import type { HandoffDraft } from "@/ffp/lib/domain/step-handoff";
import type { HandoffStepOption, HandoffT } from "./handoff-types";

/**
 * Predecessors that are steps of ANOTHER process. A staging surface like the
 * predecessor editor: it never calls an action; step-list-row.tsx reconciles
 * the drafts on Save. One grouped picker (process, then its steps) rather than
 * two, so a step can never be chosen without its process.
 */
export function HandoffEditor({
  drafts,
  onChange,
  options,
}: {
  drafts: HandoffDraft[];
  onChange: (drafts: HandoffDraft[]) => void;
  options: HandoffStepOption[];
}) {
  const byProcess = new Map<string, HandoffStepOption[]>();
  for (const o of options) byProcess.set(o.processCode, [...(byProcess.get(o.processCode) ?? []), o]);

  function updateAt(i: number, patch: Partial<HandoffDraft>) {
    onChange(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <span className="text-xs font-semibold text-amber-800">Waits on a step in another process</span>
      {drafts.map((d, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-white p-2">
          <select
            value={d.fromStepId}
            onChange={(e) => updateAt(i, { fromStepId: e.target.value })}
            aria-label="Comes from a step in another process"
            className="max-w-xs rounded-lg border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">— choose a step —</option>
            {[...byProcess.entries()].map(([code, list]) => (
              <optgroup key={code} label={code}>
                {list.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.number}. {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            value={d.label}
            onChange={(e) => updateAt(i, { label: e.target.value })}
            placeholder="Label"
            aria-label="Hand-over label"
            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(drafts.filter((_, j) => j !== i))}
            aria-label="Remove this hand-over"
            className="ms-auto rounded-md px-1.5 py-1 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={options.length === 0}
        onClick={() => onChange([...drafts, { handoffId: null, fromStepId: "", label: "" }])}
        className="self-start rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        title={options.length === 0 ? "There are no other processes with steps yet" : undefined}
      >
        + Add a step from another process
      </button>
    </div>
  );
}

export function seedHandoffDrafts(incoming: HandoffT[]): HandoffDraft[] {
  return incoming.map((h) => ({ handoffId: h.id, fromStepId: h.fromStepId, label: h.label ?? "" }));
}
