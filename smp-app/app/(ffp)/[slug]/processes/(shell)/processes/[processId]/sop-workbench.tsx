"use client";

/* THE SOP SECTION'S STEP TABLE (the builder's "SOP" item). One row per task or decision, with the five things the
   written procedure needs from it side by side: what they do, what goes in, what comes out, the common errors and the
   risk if it is mishandled. They are the same fields as "For the SOP" on the Map's step form; this is the whole
   procedure in one place instead of one step at a time. A box saves as you leave it. A red mark is something the SOP
   still lacks (the errors and the risk are optional, so they are never marked). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStepSop } from "@/ffp/lib/actions/process";
import { suggestStepSops, setStepSopSkipped } from "@/ffp/lib/actions/sop-suggest";
import { emptyFields, type SopAnswer, type SopField } from "@/ffp/lib/domain/sop-suggest";
import { useCanEdit } from "../../workspace-access";

export type SopRow = {
  id: string;
  n: number | null;
  label: string;
  type: "TASK" | "DECISION";
  role: string | null;
  acts: string[];
  inputs: string;
  output: string;
  errors: string;
  risk: string;
  /** "No SOP needed for this step". */
  skipped?: boolean;
};

type Field = "acts" | "inputs" | "output" | "errors" | "risk";
const FIELD_OF: Record<SopField, Field> = { how: "acts", inputs: "inputs", output: "output", errors: "errors", risk: "risk" };
const FIELD_NAME: Record<SopField, string> = { how: "What they do", inputs: "Inputs, tools and systems", output: "Expected output", errors: "Common errors and exceptions", risk: "Risk if mishandled" };

const box = "w-full rounded-md border bg-white px-2 py-1.5 text-[13px] text-[var(--ink)] disabled:bg-[var(--zebra)]";
const ok = "border-[var(--field-line)]";
const lacking = "border-[var(--bad)] bg-[var(--bad-bg)]";
const cap = "mb-1 block text-[11px] font-extrabold uppercase tracking-[.06em] text-[var(--ink-3)]";

export function SopWorkbench({ workspaceId, processId, rows }: { workspaceId: string; processId: string; rows: SopRow[] }) {
  const canEdit = useCanEdit();
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, Partial<Record<"acts" | "inputs" | "output" | "errors" | "risk", string>>>>({});
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  /* what the AI drafted, kept on the page until each draft is used, edited or deleted; a draft is never saved on its own */
  const [drafts, setDrafts] = useState<Record<string, Partial<Record<SopField, string>>>>({});
  const [asking, setAsking] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const asText = (a: SopAnswer): Partial<Record<SopField, string>> => {
    const o: Partial<Record<SopField, string>> = {};
    if (a.how.length) o.how = a.how.join("\n");
    if (a.inputs) o.inputs = a.inputs;
    if (a.output) o.output = a.output;
    if (a.errors) o.errors = a.errors;
    if (a.risk) o.risk = a.risk;
    return o;
  };

  async function ask(ids: string[]) {
    setErr(null); setNote(null);
    setAsking((x) => [...x, ...ids]);
    let got = 0;
    let failed = false;
    try {
      for (let i = 0; i < ids.length; i += 6) {
        const batch = ids.slice(i, i + 6);
        const res = await suggestStepSops({ workspaceId, processId, stepIds: batch });
        if (!res.ok) { failed = true; setErr(res.error === "AI_UNAVAILABLE" || res.error === "VALIDATION_ERROR" ? (res.message ?? "The AI could not draft this just now") : "The AI could not draft this just now"); break; }
        got += res.data.suggestions.length;
        setDrafts((d) => { const n = { ...d }; for (const a of res.data.suggestions) n[a.stepId] = { ...n[a.stepId], ...asText(a) }; return n; });
      }
      if (got === 0 && !failed) setNote("Nothing to draft: every box on those steps already has text.");
    } finally {
      setAsking((x) => x.filter((id) => !ids.includes(id)));
    }
  }

  const dropDraft = (id: string, f: SopField) => setDrafts((d) => { const n = { ...d, [id]: { ...d[id] } }; delete n[id]![f]; return n; });

  async function useDraft(r: SopRow, f: SopField) {
    const v = drafts[r.id]?.[f];
    if (v === undefined || !v.trim()) return;
    setBusy((b) => b + 1); setErr(null);
    try {
      const patch = f === "how" ? { detailedAction: v.split("\n").map((x) => x.trim()).filter(Boolean) } : f === "inputs" ? { sopInputs: v.trim() } : f === "output" ? { sopOutput: v.trim() } : f === "errors" ? { sopErrors: v.trim() } : { exceptionHandling: v.trim() };
      const res = await updateStepSop({ workspaceId, processId, stepId: r.id, ...patch });
      if (!res.ok) setErr("That could not be saved");
      else { dropDraft(r.id, f); router.refresh(); }
    } finally {
      setBusy((b) => b - 1);
    }
  }

  async function skip(r: SopRow, skipped: boolean) {
    setBusy((b) => b + 1); setErr(null);
    try {
      const res = await setStepSopSkipped({ workspaceId, processId, stepId: r.id, skipped });
      if (!res.ok) setErr("That could not be saved");
      else router.refresh();
    } finally {
      setBusy((b) => b - 1);
    }
  }

  const lackingIds = rows.filter((r) => !r.skipped && emptyFields({ how: r.acts, inputs: r.inputs, output: r.output, errors: r.errors, risk: r.risk }).length > 0).map((r) => r.id);

  const val = (r: SopRow, k: "acts" | "inputs" | "output" | "errors" | "risk") => draft[r.id]?.[k] ?? (k === "acts" ? r.acts.join("\n") : r[k]);
  const edit = (r: SopRow, k: "acts" | "inputs" | "output" | "errors" | "risk", v: string) => setDraft((d) => ({ ...d, [r.id]: { ...d[r.id], [k]: v } }));

  async function save(r: SopRow, k: "acts" | "inputs" | "output" | "errors" | "risk") {
    const v = (draft[r.id]?.[k] ?? "").toString();
    if (draft[r.id]?.[k] === undefined) return;
    const was = k === "acts" ? r.acts.join("\n") : r[k];
    if (v.trim() === was.trim()) return;
    setBusy((b) => b + 1);
    setErr(null);
    try {
      const patch =
        k === "acts"
          ? { detailedAction: v.split("\n").map((x) => x.trim()).filter(Boolean) }
          : k === "inputs"
            ? { sopInputs: v.trim() }
            : k === "output"
              ? { sopOutput: v.trim() }
              : k === "errors"
                ? { sopErrors: v.trim() }
                : { exceptionHandling: v.trim() };
      const res = await updateStepSop({ workspaceId, processId, stepId: r.id, ...patch });
      if (!res.ok) setErr("That could not be saved");
      else router.refresh();
    } finally {
      setBusy((b) => b - 1);
    }
  }

  if (!rows.length)
    return <p className="rounded-lg border border-dashed border-[var(--line)] bg-white px-[18px] py-[22px] text-[13.5px] text-[var(--ink-2)]">Draw the steps on the Map first: the SOP is written one step at a time from them.</p>;

  return (
    <div className="grid gap-3">
      <p role="status" className={`text-[12px] ${err ? "font-semibold text-[var(--bad-tx)]" : "text-[var(--ink-3)]"}`}>
        {err ?? note ?? (busy ? "Saving…" : "Each box saves as you leave it")}
      </p>
      {canEdit && lackingIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3.5 py-2.5">
          <button type="button" disabled={asking.length > 0} onClick={() => void ask(lackingIds)} className="rounded-md border border-[var(--gold)] bg-[var(--gold)] px-3 py-1.5 text-[13px] font-bold text-[var(--on-accent)] disabled:opacity-60">
            {asking.length ? "Drafting…" : "Draft the empty boxes with AI"}
          </button>
          <span className="text-[12px] text-[var(--ink-3)]">Written from your industry and what you entered on the steps. Nothing is saved until you use it; you can edit or delete each draft.</span>
        </div>
      )}
      {rows.map((r) => {
        if (r.skipped)
          return (
            <section key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--line)] bg-[var(--zebra)] px-3.5 py-2.5" aria-label={`SOP skipped for step ${r.n ?? ""} ${r.label}`}>
              <span className="text-[13px] text-[var(--ink-2)]"><b className="me-1.5 font-mono text-[12px] text-[var(--ink-3)]">{r.n ? `STEP ${r.n}` : ""}</b>{r.label} — SOP skipped for this step</span>
              {canEdit && <button type="button" onClick={() => void skip(r, false)} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--ink)]">Bring back</button>}
            </section>
          );
        const dr = drafts[r.id] ?? {};
        const missing = (k: "acts" | "inputs" | "output") => !val(r, k).trim();
        return (
          <section key={r.id} className="rounded-lg border border-[var(--line)] bg-white px-3.5 py-3" aria-label={`SOP for step ${r.n ?? ""} ${r.label}`}>
            <h3 className="mb-2 text-[14px] font-semibold text-[var(--ink)]">
              <span className="me-1.5 font-mono text-[12px] font-bold text-[var(--ink-3)]">{r.n ? `STEP ${r.n}` : ""}</span>
              {r.label}
              <span className="ms-2 text-[12px] font-normal text-[var(--ink-3)]">{r.role ?? <b className="text-[var(--bad-tx)]">No role named</b>}</span>
              {canEdit && (
                <span className="float-end flex gap-1.5">
                  <button type="button" disabled={asking.includes(r.id) || emptyFields({ how: r.acts, inputs: r.inputs, output: r.output, errors: r.errors, risk: r.risk }).length === 0} onClick={() => void ask([r.id])} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--ink)] disabled:opacity-50">
                    {asking.includes(r.id) ? "Drafting…" : "Draft with AI"}
                  </button>
                  <button type="button" onClick={() => void skip(r, true)} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--ink-3)]">Skip this SOP</button>
                </span>
              )}
            </h3>
            {(Object.keys(dr) as SopField[]).length > 0 && (
              <div className="mb-2.5 grid gap-2 rounded-md border border-[var(--gold)] bg-[var(--over-bg)] p-2.5" data-sop-drafts={r.id}>
                <p className="text-[12px] font-bold text-[var(--ink)]">AI draft — use it, edit it first, or delete it</p>
                {(Object.keys(dr) as SopField[]).map((f) => (
                  <div key={f}>
                    <span className={cap}>{FIELD_NAME[f]}</span>
                    <textarea aria-label={`Draft: ${FIELD_NAME[f]}`} className={`${box} ${ok} min-h-[64px]`} value={dr[f] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], [f]: e.target.value } }))} />
                    <div className="mt-1 flex gap-1.5">
                      <button type="button" onClick={() => void useDraft(r, f)} className="rounded-md border border-[var(--gold)] bg-[var(--gold)] px-2.5 py-1 text-[12px] font-bold text-[var(--on-accent)]">Use</button>
                      <button type="button" onClick={() => dropDraft(r.id, f)} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--ink)]">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label>
                <span className={cap}>What they do, one line each</span>
                <textarea className={`${box} min-h-[72px] ${missing("acts") ? lacking : ok}`} disabled={!canEdit} value={val(r, "acts")} onChange={(e) => edit(r, "acts", e.target.value)} onBlur={() => void save(r, "acts")} />
              </label>
              <label>
                <span className={cap}>Inputs, tools and systems</span>
                <textarea className={`${box} min-h-[72px] ${missing("inputs") ? lacking : ok}`} disabled={!canEdit} maxLength={2000} value={val(r, "inputs")} onChange={(e) => edit(r, "inputs", e.target.value)} onBlur={() => void save(r, "inputs")} />
              </label>
              <label>
                <span className={cap}>Expected output</span>
                <textarea className={`${box} min-h-[72px] ${missing("output") ? lacking : ok}`} disabled={!canEdit} maxLength={2000} value={val(r, "output")} onChange={(e) => edit(r, "output", e.target.value)} onBlur={() => void save(r, "output")} />
              </label>
              <label>
                <span className={cap}>Common errors and exceptions</span>
                <textarea className={`${box} min-h-[72px] ${ok}`} disabled={!canEdit} maxLength={2000} value={val(r, "errors")} onChange={(e) => edit(r, "errors", e.target.value)} onBlur={() => void save(r, "errors")} />
              </label>
              <label className="sm:col-span-2">
                <span className={cap}>Risk if mishandled</span>
                <textarea className={`${box} min-h-[56px] ${ok}`} disabled={!canEdit} maxLength={2000} value={val(r, "risk")} onChange={(e) => edit(r, "risk", e.target.value)} onBlur={() => void save(r, "risk")} />
              </label>
            </div>
          </section>
        );
      })}
    </div>
  );
}
