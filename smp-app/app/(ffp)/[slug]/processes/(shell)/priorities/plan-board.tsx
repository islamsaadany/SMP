import Link from "next/link";
import { DECISION_LABEL, wave1OverCapacity, type Decision } from "@/ffp/lib/domain/priorities";
import type { PlanView, PriorityRow } from "@/ffp/lib/data/priorities";
import { WaveLabel } from "./wave-label";
import { AspectInfo } from "./aspect-info";

const COLS: { d: Decision; sub: (p: PlanView) => string; edit?: "wave1Label" | "wave2Label" | "laterLabel" }[] = [
  { d: "WAVE_1", sub: (p) => p.wave1Label, edit: "wave1Label" },
  { d: "WAVE_2", sub: (p) => p.wave2Label, edit: "wave2Label" },
  { d: "LATER", sub: (p) => p.laterLabel, edit: "laterLabel" },
  { d: "HIGH_LEVEL", sub: () => "no deep dive planned" },
];

export function PlanBoard({ workspaceId, plan, rows, editable }: { workspaceId: string; plan: PlanView; rows: PriorityRow[]; editable: boolean }) {
  const by = (d: Decision) => rows.filter((r) => r.decision === d).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const w1 = by("WAVE_1").length;
  const over = wave1OverCapacity(w1, plan.capacity);
  const undecided = rows.filter((r) => r.decision == null);
  return (
    <div>
      <p role="status" className={`mb-3 rounded-lg px-3 py-2 text-sm ${over ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
        <b>Team capacity: {plan.capacity} deep dives at a time.</b> Wave 1 holds {w1}{over ? " — too many to run together; move one to Wave 2." : " — fits."}
      </p>
      <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {COLS.map((c) => {
          const list = by(c.d);
          return (
            <section key={c.d} className="rounded-xl border border-slate-200 bg-slate-50 p-3" aria-label={DECISION_LABEL[c.d]}>
              <h2 className="flex items-center justify-between text-sm font-semibold text-slate-900">{DECISION_LABEL[c.d]}<span className="rounded-full bg-slate-200 px-2 text-xs">{list.length}</span></h2>
              <div className="text-xs text-slate-500">
                {c.edit ? <WaveLabel workspaceId={workspaceId} field={c.edit} value={c.sub(plan)} disabled={!editable} /> : c.sub(plan)}
              </div>
              {list.map((r) => (
                <article key={r.id} className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.code} · {r.department ?? "No department"}</div>
                  <div className="my-1.5 flex gap-[3px]" role="img" aria-label={`Deep dive ${r.progress.done} of ${r.progress.total}: ${r.progress.aspects.map((a) => `${a.label} ${a.done ? "done" : "not yet"}`).join(", ")}`}>
                    {r.progress.aspects.map((a) => <i key={a.label} title={`${a.label}${a.done ? " ✓ done" : " — not yet"}: ${a.help}`} className={`h-[7px] flex-1 rounded ${a.done ? "bg-emerald-600" : "bg-slate-200"}`} />)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Deep dive {r.progress.done} of {r.progress.total} <AspectInfo aspects={r.progress.aspects} /> · <Link href={`/${workspaceId}/processes/processes/${r.id}`} className="font-semibold text-indigo-700 hover:underline">Open process →</Link>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      {undecided.length > 0 && <p className="mt-3 text-xs text-slate-500">Not decided yet: {undecided.map((r) => r.name).join(", ")}. Decide them on the Score step.</p>}
      <p className="mt-3 text-xs text-slate-500">Each card has one bar per aspect: Map · RACI · Authority · Controls · SOP · Approved. A green bar means that aspect is done; they fill in by themselves as the work is done on the process. Press the ! on a card to see what each one needs.</p>
    </div>
  );
}
