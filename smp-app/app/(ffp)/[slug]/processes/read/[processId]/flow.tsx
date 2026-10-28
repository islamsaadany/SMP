"use client";

/* ── FLOW (spec 067 §3.2): one lane per job title, one column per step ──────
   The steps in their order, each in the lane of the title that does it, with
   the arrows the office drew between them and the labels on a decision's
   branches. Clicking a step opens its detail beside the flow: who does it, the
   approval, the time limit, what they do, and its control. The arrows are
   measured from the drawn boxes, so they follow any width. The page opens
   here; on a phone it opens on Steps instead, because the flow scrolls
   sideways there. A diagram reads left to right in either language. */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import type { ReadProcess, ReadStep } from "@/ffp/lib/data/reading-side";
import { SuggestButton } from "../dialogs";

type Suggest = { workspaceId: string; processId: string; steps: { id: string; n: number; label: string }[] } | null;

type Edge = { d: string; lx: number; ly: number; label: string | null };

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
  const arrow = useId().replace(/:/g, "");
  const grid = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(steps.find((s) => s.n)?.id ?? null);
  const [edges, setEdges] = useState<Edge[]>([]);

  /* a phone opens on Steps (spec 067 §3.2) when no tab was asked for */
  useEffect(() => {
    if (toSteps && window.innerWidth < 640) router.replace(toSteps);
  }, [toSteps, router]);

  useLayoutEffect(() => {
    const draw = () => {
      const L = grid.current;
      if (!L) return;
      const o = L.getBoundingClientRect();
      /* SMP zooms the page to 0.8 on a wide screen (lib/topbar.ts): what is measured is zoomed, what is drawn is not */
      const k = o.width ? L.offsetWidth / o.width : 1;
      const box = (id: string) => {
        const r = L.querySelector<HTMLElement>(`[data-step="${id}"]`)?.getBoundingClientRect();
        return r && { left: o.left + (r.left - o.left) * k, right: o.left + (r.right - o.left) * k, top: o.top + (r.top - o.top) * k, bottom: o.top + (r.bottom - o.top) * k, width: r.width * k, height: r.height * k };
      };
      const out: Edge[] = [];
      for (const c of connections) {
        const a = box(c.from), b = box(c.to);
        if (!a || !b) continue;
        if (b.left > a.right - 2) {
          const sx = a.right - o.left, sy = a.top - o.top + a.height / 2, ex = b.left - o.left - 2, ey = b.top - o.top + b.height / 2;
          const mx = Math.round(sx + Math.min(22, (ex - sx) / 2));
          out.push({ d: Math.abs(sy - ey) < 2 ? `M${sx} ${sy}H${ex}` : `M${sx} ${sy}H${mx}V${ey}H${ex}`, lx: mx + 5, ly: (sy + ey) / 2 + 4, label: c.label });
        } else {
          /* a step that loops back runs under the boxes */
          const sx = a.left - o.left + a.width / 2, sy = a.bottom - o.top, ex = b.left - o.left + b.width / 2, ey = b.bottom - o.top + 2, low = Math.max(sy, ey) + 18;
          out.push({ d: `M${sx} ${sy}V${low}H${ex}V${ey}`, lx: (sx + ex) / 2 - 20, ly: low - 4, label: c.label });
        }
      }
      setEdges(out);
    };
    /* the boxes settle after the fonts load and as the width changes: redraw whenever the drawing area changes size */
    draw();
    const seen = new ResizeObserver(draw);
    if (grid.current) seen.observe(grid.current);
    document.fonts?.ready.then(draw);
    return () => seen.disconnect();
  }, [connections, steps]);

  if (!steps.length) return <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">{m.noSteps}</div>;
  const cols = steps.length;
  return (
    <>
      <p className="mb-2.5 text-[12.5px] text-[#636C79]">{m.flowNote}</p>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="overflow-x-auto rounded-lg border border-[#D6DCE5] bg-white" dir="ltr">
          <div
            ref={grid}
            className="relative grid"
            style={{ gridTemplateColumns: `104px repeat(${cols}, minmax(116px, 1fr))`, gridTemplateRows: `repeat(${lanes.length}, 96px)`, minWidth: 104 + cols * 116 }}
          >
            {lanes.map((l, i) => (
              <div key={l.key} className="contents">
                <div className={`col-span-full border-t border-[#E6EAF0] first:border-t-0 ${i % 2 ? "bg-[#F5F7FA]" : ""}`} style={{ gridRow: i + 1, gridColumn: "1 / -1" }} />
                <div
                  className="sticky left-0 z-[3] flex items-center border-r border-[#D6DCE5] bg-[#EFF2F6] px-3 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[.1em] text-[#414A58]"
                  style={{ gridRow: i + 1, gridColumn: 1 }}
                >
                  {l.name ?? m.noRole}
                </div>
              </div>
            ))}
            {steps.map((s, i) => {
              const ends = s.type === "START" || s.type === "END";
              const pos = { gridRow: lanes.findIndex((l) => l.key === s.lane) + 1, gridColumn: i + 2 };
              const inner = (
                <>
                  <span className="block font-mono text-[10px] font-bold text-[#636C79]">{s.n ? m.step(s.n).toUpperCase() : s.type === "START" ? m.start.toUpperCase() : m.end.toUpperCase()}</span>
                  <b className="block text-[12.5px] leading-tight text-[#171B22]">{s.label}</b>
                </>
              );
              return ends ? (
                <div key={s.id} data-step={s.id} style={pos} className="relative z-[2] w-[100px] self-center justify-self-center rounded-full border-[1.5px] border-[#78899F] bg-[#EFF2F6] px-[9px] py-1.5 text-center">
                  {inner}
                </div>
              ) : (
                <button
                  key={s.id}
                  type="button"
                  data-step={s.id}
                  style={pos}
                  aria-pressed={s.id === sel}
                  onClick={() => setSel(s.id)}
                  className={`relative z-[2] w-[108px] self-center justify-self-center rounded-lg border-[1.5px] bg-white px-[9px] py-1.5 text-left ${s.type === "DECISION" ? "border-dashed border-[#16325C]" : "border-[#78899F]"} ${s.id === sel ? "shadow-[0_0_0_3px_#C9A24D]" : ""}`}
                >
                  {inner}
                  {s.changed && (
                    <span className="absolute -left-1.5 -top-[9px] rounded-[3px] bg-[#C9A24D] px-1 text-[9px] font-extrabold tracking-[.05em] text-[#16325C]">{m.changed.toUpperCase()}</span>
                  )}
                  {s.controls.some((c) => !c.control) && (
                    <span title={m.noControlChip} className="absolute -right-[7px] -top-[9px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[#B04434] text-[11px] font-extrabold text-white">
                      !
                    </span>
                  )}
                </button>
              );
            })}
            <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <marker id={arrow} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0 0 8 4 0 8z" fill="#78899F" />
                </marker>
              </defs>
              {edges.map((e, i) => (
                <path key={i} d={e.d} fill="none" stroke="#78899F" strokeWidth="1.5" markerEnd={`url(#${arrow})`} />
              ))}
              {edges.map(
                (e, i) =>
                  e.label && (
                    <g key={`l${i}`}>
                      <rect x={e.lx - 3} y={e.ly - 11} width={e.label.length * 5.7 + 8} height="15" rx="3" fill="#FFFFFF" stroke="#D6DCE5" />
                      <text x={e.lx} y={e.ly} fontSize="10.5" fontWeight="600" fill="#414A58">
                        {e.label}
                      </text>
                    </g>
                  )
              )}
            </svg>
          </div>
        </div>
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
