"use client";

/* ── THE LANE DRAWING (spec 067 §3.2, §4.3): one lane per job title, one column per step ──
   The steps in their order, each in the lane of the title that does it, with
   the arrows between them and the labels on a decision's branches. The same
   drawing on both sides: readers' Flow, and the office's Map, where it also
   marks a step's gaps, a step the AI review proposed, and lets Start and End
   be picked too. The arrows are measured from the drawn boxes, so they follow
   any width. A diagram reads left to right in either language. */
import { useId, useLayoutEffect, useRef, useState } from "react";
import { useMessages } from "@/ffp/lib/i18n/client";

export type DrawStep = {
  id: string;
  type: "START" | "TASK" | "DECISION" | "END";
  /** Its number among the steps a reader counts; null for Start, End and a proposal. */
  n: number | null;
  label: string;
  lane: string;
  changed?: boolean;
  /** What is missing, said on hover; a red mark when set. */
  gap?: string | null;
  /** Proposed by the AI review, not a step until it is confirmed. */
  proposed?: boolean;
};
export type DrawArrow = { from: string; to: string; label: string | null; dashed?: boolean };

type Edge = { d: string; lx: number; ly: number; label: string | null; dashed: boolean };

export function LaneDrawing({
  steps,
  lanes,
  connections,
  sel,
  onPick,
  pickEnds = false,
  proposedLabel = "",
}: {
  steps: DrawStep[];
  lanes: { key: string; name: string | null }[];
  connections: DrawArrow[];
  sel: string | null;
  onPick: (id: string) => void;
  /** The office picks Start and End too, to rename or remove them. */
  pickEnds?: boolean;
  proposedLabel?: string;
}) {
  const m = useMessages().reading.page;
  const arrow = useId().replace(/:/g, "");
  const grid = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);

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
        const dashed = !!c.dashed;
        if (b.left > a.right - 2) {
          const sx = a.right - o.left, sy = a.top - o.top + a.height / 2, ex = b.left - o.left - 2, ey = b.top - o.top + b.height / 2;
          const mx = Math.round(sx + Math.min(22, (ex - sx) / 2));
          out.push({ d: Math.abs(sy - ey) < 2 ? `M${sx} ${sy}H${ex}` : `M${sx} ${sy}H${mx}V${ey}H${ex}`, lx: mx + 5, ly: (sy + ey) / 2 + 4, label: c.label, dashed });
        } else {
          /* a step that loops back runs under the boxes */
          const sx = a.left - o.left + a.width / 2, sy = a.bottom - o.top, ex = b.left - o.left + b.width / 2, ey = b.bottom - o.top + 2, low = Math.max(sy, ey) + 18;
          out.push({ d: `M${sx} ${sy}V${low}H${ex}V${ey}`, lx: (sx + ex) / 2 - 20, ly: low - 4, label: c.label, dashed });
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

  const cols = steps.length;
  return (
    <div className="overflow-x-auto rounded-lg border border-[#D6DCE5] bg-white" dir="ltr">
      <div
        ref={grid}
        data-lane-grid=""
        className="relative grid bg-white"
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
          const pos = { gridRow: Math.max(1, lanes.findIndex((l) => l.key === s.lane) + 1), gridColumn: i + 2 };
          const head = s.proposed ? proposedLabel : s.n ? m.step(s.n) : s.type === "START" ? m.start : s.type === "END" ? m.end : "";
          const inner = (
            <>
              <span className={`block font-mono text-[10px] font-bold ${s.proposed ? "text-[#8A6B22]" : "text-[#636C79]"}`}>{head.toUpperCase()}</span>
              <b className="block text-[12.5px] leading-tight text-[#171B22]">{s.label}</b>
            </>
          );
          const on = s.id === sel ? "shadow-[0_0_0_3px_#C9A24D]" : "";
          if (ends && !pickEnds)
            return (
              <div key={s.id} data-step={s.id} style={pos} className="relative z-[2] w-[100px] self-center justify-self-center rounded-full border-[1.5px] border-[#78899F] bg-[#EFF2F6] px-[9px] py-1.5 text-center">
                {inner}
              </div>
            );
          return (
            <button
              key={s.id}
              type="button"
              data-step={s.id}
              style={pos}
              aria-pressed={s.id === sel}
              onClick={() => onPick(s.id)}
              className={`relative z-[2] self-center justify-self-center px-[9px] py-1.5 ${
                ends
                  ? "w-[100px] rounded-full border-[1.5px] border-[#78899F] bg-[#EFF2F6] text-center"
                  : s.proposed
                    ? "w-[108px] rounded-lg border-2 border-dashed border-[#C9A24D] bg-[#FBF6E9] text-left"
                    : `w-[108px] rounded-lg border-[1.5px] bg-white text-left ${s.type === "DECISION" ? "border-dashed border-[#16325C]" : "border-[#78899F]"}`
              } ${on}`}
            >
              {inner}
              {s.changed && <span className="absolute -left-1.5 -top-[9px] rounded-[3px] bg-[#C9A24D] px-1 text-[9px] font-extrabold tracking-[.05em] text-[#16325C]">{m.changed.toUpperCase()}</span>}
              {s.gap && (
                <span title={s.gap} className="absolute -right-[7px] -top-[9px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[#B04434] text-[11px] font-extrabold text-white">
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
            <path key={i} d={e.d} fill="none" stroke={e.dashed ? "#C9A24D" : "#78899F"} strokeWidth="1.5" strokeDasharray={e.dashed ? "4 3" : undefined} markerEnd={`url(#${arrow})`} />
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
  );
}
