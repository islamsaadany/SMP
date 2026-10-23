"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptSuggestedScores,
  clearPriorityEntries,
  fillDecisionsFromRanking,
  setDeepDiveDecision,
  setPlanSettings,
  setProcessPriority,
} from "@/ffp/lib/actions/priorities";
import { DECISIONS, DECISION_LABEL, type Decision, type Weights } from "@/ffp/lib/domain/priorities";
import type { PriorityRow } from "@/ffp/lib/data/priorities";

const WEIGHTS: { key: keyof Weights; setting: "weightImportance" | "weightRisk" | "weightComplexity"; label: string }[] = [
  { key: "importance", setting: "weightImportance", label: "Importance to the business" },
  { key: "risk", setting: "weightRisk", label: "Risk if it goes wrong" },
  { key: "complexity", setting: "weightComplexity", label: "Complexity" },
];

const DOT_ON: Record<"importance" | "complexity" | "risk", string> = {
  importance: "border-indigo-900 bg-indigo-900",
  complexity: "border-amber-600 bg-amber-500",
  risk: "border-rose-700 bg-rose-600",
};

const CLEAR_KINDS = [
  { key: "importance", label: "Importance" },
  { key: "complexity", label: "Complexity" },
  { key: "risk", label: "Risk" },
  { key: "why", label: "Why notes" },
  { key: "decision", label: "Decisions" },
] as const;

/** Main processes in code order, each followed by its own sub-processes; a sub whose main is not in the list stands as a main. */
function inTree(rows: PriorityRow[]): { row: PriorityRow; sub: boolean; hasSubs: boolean }[] {
  const ids = new Set(rows.map((r) => r.id));
  const byCode = (a: PriorityRow, b: PriorityRow) => a.code.localeCompare(b.code, undefined, { numeric: true });
  const kids = new Map<string, PriorityRow[]>();
  for (const r of rows) if (r.parentId && ids.has(r.parentId)) (kids.get(r.parentId) ?? kids.set(r.parentId, []).get(r.parentId)!).push(r);
  const out: { row: PriorityRow; sub: boolean; hasSubs: boolean }[] = [];
  for (const m of rows.filter((r) => !r.parentId || !ids.has(r.parentId)).sort(byCode)) {
    const subs = (kids.get(m.id) ?? []).sort(byCode);
    out.push({ row: m, sub: false, hasSubs: subs.length > 0 });
    for (const c of subs) out.push({ row: c, sub: true, hasSubs: false });
  }
  return out;
}

export function ScoreTable({
  workspaceId,
  rows,
  weights,
  capacity,
  editable,
  lockedMessage,
}: {
  workspaceId: string;
  rows: PriorityRow[];
  weights: Weights;
  capacity: number;
  /** The viewer may edit AND the plan is a draft. */
  editable: boolean;
  lockedMessage: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(weights);
  const [cap, setCap] = useState(capacity);
  const [note, setNote] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [kinds, setKinds] = useState<ReadonlySet<string>>(new Set());
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const tree = useMemo(() => inTree(rows), [rows]);

  function openClear() {
    setKinds(new Set());
    setPicked(new Set(rows.map((r) => r.id)));
    setClearing(true);
  }
  function toggle<T>(set: ReadonlySet<T>, v: T, on: boolean): Set<T> {
    const next = new Set(set);
    if (on) next.add(v);
    else next.delete(v);
    return next;
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string; data?: unknown }>, after?: (d: unknown) => void) {
    setError(null);
    setNote(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error === "VALIDATION_ERROR" ? (res.message ?? "That could not be saved") : (res.error ?? "Failed"));
        return;
      }
      after?.(res.data);
      router.refresh();
    });
  }

  const score = (id: string, key: "importance" | "complexity" | "risk", value: number | null) =>
    run(() => setProcessPriority({ workspaceId, processId: id, [key]: value }));

  return (
    <div className="space-y-4">
      {lockedMessage && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{lockedMessage}</p>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="weights-h">
        <h2 id="weights-h" className="text-sm font-semibold text-slate-900">What counts, and how much <span className="font-normal text-slate-500">(agree this with the client first)</span></h2>
        <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {WEIGHTS.map((w) => (
            <label key={w.key} className="block text-xs text-slate-600">
              <span className="flex justify-between">{w.label}<b className="text-slate-900">{live[w.key]}%</b></span>
              <input
                type="range"
                min={0}
                max={100}
                value={live[w.key]}
                disabled={!editable}
                aria-label={w.label}
                onChange={(e) => setLive({ ...live, [w.key]: Number(e.target.value) })}
                onPointerUp={() => run(() => setPlanSettings({ workspaceId, [w.setting]: live[w.key] }))}
                onKeyUp={() => run(() => setPlanSettings({ workspaceId, [w.setting]: live[w.key] }))}
                className="mt-1 w-full accent-amber-600"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <label className="flex items-center gap-2">
            Deep dives the team can run at once
            <input
              type="number"
              min={1}
              max={20}
              value={cap}
              disabled={!editable}
              onChange={(e) => setCap(Number(e.target.value))}
              onBlur={() => cap !== capacity && cap >= 1 && run(() => setPlanSettings({ workspaceId, capacity: cap }))}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
              aria-label="Deep dives the team can run at once"
            />
          </label>
          <span>Click the dots to score 1 to 5. The score out of 100 and the rank follow the weights.</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!editable || pending}
            onClick={() => run(() => acceptSuggestedScores({ workspaceId }), (d) => setNote(`Filled ${(d as { filled: number }).filled} process(es) from the map and the risks logged. Importance is always yours to give.`))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            Fill the empty complexity and risk from the map
          </button>
          <button
            type="button"
            disabled={!editable || pending}
            onClick={() => run(() => fillDecisionsFromRanking({ workspaceId }), (d) => setNote(`Set ${(d as { filled: number }).filled} decision(s) from the ranking. Nothing you decided was changed.`))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            Suggest waves from the ranking
          </button>
          <button
            type="button"
            disabled={!editable || pending}
            onClick={() => (clearing ? setClearing(false) : openClear())}
            aria-expanded={clearing}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-40"
          >
            Clear entries…
          </button>
        </div>
        {clearing && (
          <div role="group" aria-label="Clear entries" className="mt-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">What do you want to clear? <span className="font-normal text-slate-500">Then tick the processes in the list (all are ticked to start).</span></p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {CLEAR_KINDS.map((k) => (
                <label key={k.key} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={kinds.has(k.key)} onChange={(e) => setKinds(toggle(kinds, k.key, e.target.checked))} />
                  {k.label}
                </label>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" className="underline" onClick={() => setPicked(new Set(rows.map((r) => r.id)))}>Tick all</button>
              <button type="button" className="underline" onClick={() => setPicked(new Set())}>Untick all</button>
              <button
                type="button"
                disabled={pending || kinds.size === 0 || picked.size === 0}
                onClick={() => {
                  if (!window.confirm(`Clear ${[...kinds].join(", ")} on ${picked.size} process(es)? This cannot be undone.`)) return;
                  run(() => clearPriorityEntries({ workspaceId, kinds: [...kinds] as (typeof CLEAR_KINDS)[number]["key"][], processIds: [...picked] }), (d) => {
                    setNote(`Cleared ${(d as { cleared: number }).cleared} process(es).`);
                    setClearing(false);
                  });
                }}
                className="rounded-lg bg-rose-700 px-3 py-1.5 font-semibold text-white hover:bg-rose-800 disabled:opacity-40"
              >
                Clear the selected
              </button>
              <button type="button" className="underline" onClick={() => setClearing(false)}>Cancel</button>
            </div>
          </div>
        )}
        {note && <p role="status" className="mt-2 text-xs text-emerald-700">{note}</p>}
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-start text-xs font-semibold uppercase text-slate-500">
            <tr>
              {clearing && <th className="px-3 py-2"><span className="sr-only">Clear</span></th>}
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Process</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Importance</th>
              <th className="px-3 py-2">Complexity</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Why (one line)</th>
              <th className="px-3 py-2">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={clearing ? 10 : 9} className="px-3 py-6 text-center text-slate-400">No processes yet. Map the high-level processes first.</td></tr>
            )}
            {tree.map(({ row: r, sub, hasSubs }) => (
              <tr key={r.id} className={`border-t border-slate-100 align-top ${sub ? "" : "bg-slate-50/40"}`}>
                {clearing && (
                  <td className="px-3 py-2">
                    <input type="checkbox" aria-label={`Clear ${r.name}`} checked={picked.has(r.id)} onChange={(e) => setPicked(toggle(picked, r.id, e.target.checked))} />
                  </td>
                )}
                <td className="px-3 py-2 font-bold">{r.rank ?? "—"}</td>
                <td className={`px-3 py-2 ${sub ? "ps-8" : ""}`}>
                  <div className={sub ? "font-medium text-slate-800" : "font-semibold text-slate-900"}>
                    {sub && <span aria-hidden className="me-1 text-slate-400">↳</span>}
                    {r.name}
                    {hasSubs && <span className="ms-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">Main</span>}
                  </div>
                  <div className="font-mono text-xs text-slate-500">{r.code}</div>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.department ?? "—"}</td>
                {(["importance", "complexity", "risk"] as const).map((k) => (
                  <td key={k} className="px-3 py-2">
                    <div className="flex gap-1" role="group" aria-label={`${r.name}: ${k}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          disabled={!editable || pending}
                          aria-label={`${k} ${n} of 5 for ${r.name}`}
                          aria-pressed={(r[k] ?? 0) >= n}
                          onClick={() => score(r.id, k, r[k] === n ? null : n)}
                          className={`h-3 w-3 rounded-full border ${(r[k] ?? 0) >= n ? DOT_ON[k] : "border-slate-300 bg-slate-100"} disabled:cursor-default`}
                        />
                      ))}
                    </div>
                    {k !== "importance" && r[k] == null && (k === "complexity" ? r.suggestedComplexity : r.suggestedRisk) && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        suggested {(k === "complexity" ? r.suggestedComplexity : r.suggestedRisk)!.score}: {(k === "complexity" ? r.suggestedComplexity : r.suggestedRisk)!.reason}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 font-bold tabular-nums">{r.score ?? "—"}</td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={r.why ?? ""}
                    key={r.why ?? ""}
                    disabled={!editable}
                    maxLength={200}
                    aria-label={`Why: ${r.name}`}
                    onBlur={(e) => e.currentTarget.value.trim() !== (r.why ?? "") && run(() => setProcessPriority({ workspaceId, processId: r.id, why: e.currentTarget.value.trim() || null }))}
                    className="w-full min-w-40 rounded-md border border-transparent px-1 py-0.5 text-sm hover:border-slate-300 focus:border-slate-400"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.decision ?? ""}
                    disabled={!editable || pending}
                    aria-label={`Decision for ${r.name}`}
                    onChange={(e) => run(() => setDeepDiveDecision({ workspaceId, processId: r.id, decision: (e.target.value || null) as Decision | null }))}
                    className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
                  >
                    <option value="">Not decided</option>
                    {DECISIONS.map((d) => (
                      <option key={d} value={d}>{DECISION_LABEL[d]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="rounded-lg border-s-4 border-amber-400 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        Office-only working view. The suggestions come from the process map and the risks already logged. You accept or change them, and none of this is printed in anything the client receives except the sign-off page.
      </p>
    </div>
  );
}
