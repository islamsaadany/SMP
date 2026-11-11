"use client";

/* THE SOP SECTION'S STEP TABLE (the builder's "SOP" item). One row per task or decision, with the five things the
   written procedure needs from it side by side: what they do, what goes in, what comes out, the common errors and the
   risk if it is mishandled. They are the same fields as "For the SOP" on the Map's step form; this is the whole
   procedure in one place instead of one step at a time. A box saves as you leave it. A red mark is something the SOP
   still lacks (the errors and the risk are optional, so they are never marked). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStepSop } from "@/ffp/lib/actions/process";
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
};

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
        {err ?? (busy ? "Saving…" : "Each box saves as you leave it")}
      </p>
      {rows.map((r) => {
        const missing = (k: "acts" | "inputs" | "output") => !val(r, k).trim();
        return (
          <section key={r.id} className="rounded-lg border border-[var(--line)] bg-white px-3.5 py-3" aria-label={`SOP for step ${r.n ?? ""} ${r.label}`}>
            <h3 className="mb-2 text-[14px] font-semibold text-[var(--ink)]">
              <span className="me-1.5 font-mono text-[12px] font-bold text-[var(--ink-3)]">{r.n ? `STEP ${r.n}` : ""}</span>
              {r.label}
              <span className="ms-2 text-[12px] font-normal text-[var(--ink-3)]">{r.role ?? <b className="text-[var(--bad-tx)]">No role named</b>}</span>
            </h3>
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
