"use client";

/* ── FLOW (spec 067 §3.2): one lane per job title, one column per step ──────
   The steps in their order, each in the lane of the title that does it, with
   the arrows the office drew between them and the labels on a decision's
   branches (the drawing is shared with the office's Map, ../../lane-drawing.tsx).
   Clicking a step opens its detail beside the flow: who does it, the
   approval, the time limit, what they do, and its control. The page opens
   here; on a phone it opens on Steps instead, because the flow scrolls
   sideways there. A diagram reads left to right in either language. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import type { ReadProcess, ReadStep } from "@/ffp/lib/data/reading-side";
import { SuggestButton } from "../dialogs";
import { LaneDrawing } from "../../lane-drawing";

type Suggest = { workspaceId: string; processId: string; steps: { id: string; n: number; label: string }[] } | null;

export function StepDetail({ step }: { step: ReadStep | undefined }) {
  const m = useMessages().reading.page;
  if (!step) return <p className="text-[12.5px] text-[#636C79]">{m.pick}</p>;
  return (
    <>
      <span className="font-mono text-[12.5px] font-bold text-[#636C79]">
        {step.n ? m.step(step.n).toUpperCase() : ""}
        {step.type === "DECISION" ? ` · ${m.decision.toUpperCase()}` : ""}
      </span>
      <h3 className="text-base font-semibold text-[#171B22]">{step.label}</h3>
      <dl className="m-0 grid grid-cols-[96px_minmax(0,1fr)] gap-x-2.5 gap-y-[5px] text-[13px]">
        <dt className="text-[12.5px] text-[#636C79]">{m.doneBy}</dt>
        <dd className="m-0">{step.role ?? m.noRole}</dd>
        {step.approval.length > 0 && (
          <>
            <dt className="text-[12.5px] text-[#636C79]">{m.approval}</dt>
            <dd className="m-0">{step.approval.join(" ")}</dd>
          </>
        )}
        {step.time.length > 0 && (
          <>
            <dt className="text-[12.5px] text-[#636C79]">{m.timeLimit}</dt>
            <dd className="m-0">{step.time.join(" ")}</dd>
          </>
        )}
      </dl>
      {step.acts.length > 0 && (
        <ul className="list-disc ps-[18px] text-[13px]">
          {step.acts.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
      {step.controls.map((c, i) =>
        c.control ? (
          <p key={i} className="text-[12.5px] text-[#414A58]">
            {m.control(c.control)}
          </p>
        ) : (
          <p key={i} className="text-[12.5px] font-semibold text-[#8C3327]">
            {m.noControlFor(c.risk)}
          </p>
        )
      )}
    </>
  );
}

export function ReadingFlow({ steps, lanes, connections, toSteps, suggest }: Pick<ReadProcess, "steps" | "lanes" | "connections"> & { toSteps: string | null; suggest: Suggest }) {
  const m = useMessages().reading.page;
  const router = useRouter();
  const [sel, setSel] = useState(steps.find((s) => s.n)?.id ?? null);

  /* a phone opens on Steps (spec 067 §3.2) when no tab was asked for */
  useEffect(() => {
    if (toSteps && window.innerWidth < 640) router.replace(toSteps);
  }, [toSteps, router]);

  if (!steps.length) return <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">{m.noSteps}</div>;
  return (
    <>
      <p className="mb-2.5 text-[12.5px] text-[#636C79]">{m.flowNote}</p>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        <LaneDrawing
          steps={steps.map((s) => ({ ...s, gap: s.controls.some((c) => !c.control) ? m.noControlChip : null }))}
          lanes={lanes}
          connections={connections}
          sel={sel}
          onPick={setSel}
        />
        <aside className="grid gap-2.5 rounded-lg border border-[#D6DCE5] bg-white px-3.5 py-3" aria-live="polite">
          <StepDetail step={steps.find((s) => s.id === sel)} />
          {suggest && sel && (
            <div>
              <SuggestButton
                {...suggest}
                stepId={sel}
                label={m.suggestStep}
                className="rounded-md border border-[#D6DCE5] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[#171B22] hover:border-[#C9A24D]"
              />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
