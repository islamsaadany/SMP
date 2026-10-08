"use client";

import { useCanEdit } from "../workspace-access";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateProcessTemplateDraft,
  createProcessFromTemplate,
  fillEmptyProcessFromTemplate,
  type ProcessTemplateDraft,
} from "@/ffp/lib/actions/process-template";

const STEP_TYPE_STYLES: Record<string, string> = {
  START: "bg-emerald-50 text-emerald-700",
  END: "bg-emerald-50 text-emerald-700",
  TASK: "bg-slate-100 text-slate-600",
  DECISION: "bg-indigo-50 text-indigo-700",
};

/**
 * `intoProcess` switches the box from "make a new process" to "draft into this
 * empty process": the name is fixed and the result is written into it.
 */
export function GenerateTemplateForm({
  workspaceId,
  intoProcess,
}: {
  workspaceId: string;
  intoProcess?: { id: string; name: string };
}) {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(intoProcess?.name ?? "");
  const [notes, setNotes] = useState("");
  const [useOrgChart, setUseOrgChart] = useState(true);
  const [draft, setDraft] = useState<ProcessTemplateDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerating] = useTransition();
  const [creating, startCreating] = useTransition();
  const router = useRouter();
  const known = new Set((draft?.orgRoles ?? []).map((r) => r.toLowerCase()));
  const roleMark = (name: string) =>
    known.has(name.trim().toLowerCase()) ? "text-emerald-700" : "text-amber-700";

  // Nothing here but a way to change something, so a Viewer is shown none
  // of it rather than controls the server would refuse.
  if (!canEdit) return null;

  function generate() {
    setError(null);
    setDraft(null);
    startGenerating(async () => {
      const result = await generateProcessTemplateDraft({ workspaceId, processName: topic, notes, useOrgChart });
      if (!result.ok) {
        setError(result.error === "AI_UNAVAILABLE" || result.error === "VALIDATION_ERROR" ? (result.message ?? "Could not generate a draft") : result.error);
        return;
      }
      setDraft(result.data);
    });
  }

  function useDraft() {
    if (!draft) return;
    setError(null);
    startCreating(async () => {
      if (intoProcess) {
        const filled = await fillEmptyProcessFromTemplate({
          workspaceId,
          processId: intoProcess.id,
          steps: draft.steps,
          activities: draft.activities,
        });
        if (!filled.ok) {
          setError(filled.error === "VALIDATION_ERROR" ? (filled.message ?? "Could not add the draft") : filled.error);
          return;
        }
        setOpen(false);
        setDraft(null);
        router.refresh();
        return;
      }
      const result = await createProcessFromTemplate({
        workspaceId,
        processName: draft.processName,
        steps: draft.steps,
        activities: draft.activities,
      });
      if (!result.ok) {
        setError(result.error === "VALIDATION_ERROR" ? (result.message ?? "Could not create process") : result.error);
        return;
      }
      router.push(`/${workspaceId}/processes/processes/${result.data.id}/map`);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
      >
        {intoProcess ? "✨ Draft it with AI" : "✨ Generate from best practice"}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/30 p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Process to draft
          <input
            readOnly={!!intoProcess}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Employee Onboarding, Procure to Pay"
            required
            className="w-72 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={generating || !topic.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? "Drafting…" : "Generate draft"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setDraft(null);
            setTopic(intoProcess?.name ?? "");
            setNotes("");
            setError(null);
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-600">
        How it works today <span className="font-normal text-slate-400">(optional — the draft follows your notes over generic practice)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="e.g. HR raises the request, the line manager approves, Finance sets up payroll…"
          className="w-full max-w-2xl rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </label>
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={useOrgChart} onChange={(e) => setUseOrgChart(e.target.checked)} />
        Use the roles in our org chart
      </label>
      <p className="mt-2 text-xs text-slate-500">
        Uses this workspace&rsquo;s industry/background notes for context — a starting point you refine
        afterward, not a finished process.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {draft && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">{draft.processName}</h3>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Process Map</p>
            <ol className="mt-1.5 flex flex-col gap-1">
              {draft.steps.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-4 flex-none font-mono text-slate-400">{i + 1}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STEP_TYPE_STYLES[s.type]}`}>
                    {s.type}
                  </span>
                  <span className="text-slate-800">{s.label}</span>
                  {s.roleName && <span className={roleMark(s.roleName)}>· {s.roleName}</span>}
                </li>
              ))}
            </ol>
          </div>

          {draft.activities.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">RACI Matrix</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {draft.activities.map((a, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-slate-800">{a.name}</span>
                    <span className="text-slate-400">
                      {" — "}
                      {a.assignments.map((asn, j) => (
                        <span key={j} className={roleMark(asn.roleName)}>
                          {j > 0 ? ", " : ""}
                          {asn.roleName} ({asn.code[0]})
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            <span className="text-emerald-700">Green</span> = a role in your org chart.{" "}
            <span className="text-amber-700">Amber</span> = not in the org chart; it will be added as a new role when you use the draft.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={useDraft}
              disabled={creating}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (intoProcess ? "Adding…" : "Creating…") : intoProcess ? "Put this draft in the process →" : "Use this draft →"}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={generating || creating}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
