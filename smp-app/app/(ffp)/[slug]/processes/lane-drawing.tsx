"use client";

/* ── THE LANE DRAWING (spec 067 §3.2, §4.3): one lane per job title, one column per step ──
   The steps in their order, each in the lane of the title that does it, with
   the arrows between them and the labels on a decision's branches. The same
   drawing on both sides: readers' Flow, and the office's Map, where it also
   marks a step's gaps, a step the AI review proposed, and lets Start and End
   be picked too. The arrows are measured from the drawn boxes, so they follow
   any width. A diagram reads left to right in either language.

   WHERE AN ARROW MAY RUN (2026-10-28). The first drawing bent every arrow
   22px past its box, which put a long arrow's vertical run through the next
   column's box and let a loop's horizontal run graze the boxes in the lane
   under it. The grid itself says where nothing is drawn: the gutter between
   two columns (the columns are wider than the boxes for this), and the
   channel along the line between two lanes (a box sits in the middle of its
   lane). So an arrow forward goes out of its box, turns in a gutter and comes
   in level with its target; when a box in between would be in its way it
   climbs to the channel beside its lane, runs along it and comes down in the
   gutter before its target. An arrow back leaves from under its box, runs
   along the channel under the lower of the two lanes and comes up into its
   target from below — a little under the lane's line, where an arrow forward
   along the same channel runs a little over it, so the two never lie on one
   another. A label sits on the run that is its own, and a branch's label by
   the decision it leaves. */
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
type Box = { left: number; right: number; top: number; bottom: number; cx: number; cy: number; col: number; lane: number };

/** The grid's fixed measures: the lane label's column, a lane's height, the room above and below the lanes, a column's least width, and how far off a lane's line a channel run keeps. */
const LABEL_W = 104, LANE_H = 96, PAD = 16, COL_MIN = 150, OFF = 5;

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
  const marker = useId().replace(/:/g, "");
  const grid = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);

  useLayoutEffect(() => {
    const draw = () => {
      const L = grid.current;
      if (!L) return;
      const o = L.getBoundingClientRect();
      /* SMP zooms the page to 0.8 on a wide screen (lib/topbar.ts): what is measured is zoomed, what is drawn is not */
      const k = o.width ? L.offsetWidth / o.width : 1;
      const laneOf = (key: string) => Math.max(0, lanes.findIndex((l) => l.key === key));
      const boxes = new Map<string, Box>();
      steps.forEach((s, col) => {
        const r = L.querySelector<HTMLElement>(`[data-step="${s.id}"]`)?.getBoundingClientRect();
        if (!r) return;
        const left = (r.left - o.left) * k, right = (r.right - o.left) * k, top = (r.top - o.top) * k, bottom = (r.bottom - o.top) * k;
        boxes.set(s.id, { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2, col, lane: laneOf(s.lane) });
      });
      /* the columns share the width left of the lane labels; a box sits in the middle of its column */
      const colW = (L.offsetWidth - LABEL_W) / Math.max(1, steps.length);
      const gutterAfter = (col: number) => LABEL_W + colW * (col + 1);
      const channelBelow = (lane: number) => PAD + LANE_H * (lane + 1) - OFF;
      const channelAbove = (lane: number) => PAD + LANE_H * lane + OFF;
      /* a branch's label, just out of its box beside the turn: nearer the decision than the target, and off the lane's line */
      const byTurn = (a: Box, b: Box) => a.cy + Math.sign(b.cy - a.cy) * Math.min(24, Math.abs(b.cy - a.cy) / 2);
      /* a box in this lane in the columns strictly between the two */
      const occupied = (lane: number, c1: number, c2: number) => steps.slice(c1 + 1, c2).some((s) => laneOf(s.lane) === lane);

      const out: Edge[] = [];
      for (const c of connections) {
        const a = boxes.get(c.from), b = boxes.get(c.to);
        if (!a || !b) continue;
        const dashed = !!c.dashed;
        const end = b.left - 2;
        if (b.col > a.col) {
          const same = a.lane === b.lane;
          if (same && !occupied(a.lane, a.col, b.col)) {
            out.push({ d: `M${a.right} ${a.cy}H${end}`, lx: (a.right + end) / 2, ly: a.cy - 9, label: c.label, dashed });
          } else if (!same && !occupied(b.lane, a.col, b.col)) {
            /* turn in the gutter after the source, come in level with the target */
            const gx = gutterAfter(a.col);
            out.push({ d: `M${a.right} ${a.cy}H${gx}V${b.cy}H${end}`, lx: gx, ly: byTurn(a, b), label: c.label, dashed });
          } else if (!same && !occupied(a.lane, a.col, b.col)) {
            /* run level with the source, turn in the gutter before the target */
            const gx = gutterAfter(b.col - 1);
            out.push({ d: `M${a.right} ${a.cy}H${gx}V${b.cy}H${end}`, lx: gx, ly: byTurn(b, a), label: c.label, dashed });
          } else {
            /* a box in the way either way: along the channel beside the source's lane, toward the target's */
            const ch = !same ? (a.lane < b.lane ? channelBelow(a.lane) : channelAbove(a.lane)) : a.lane + 1 < lanes.length ? channelBelow(a.lane) : channelAbove(a.lane);
            const g1 = gutterAfter(a.col), g2 = gutterAfter(b.col - 1);
            out.push({ d: `M${a.right} ${a.cy}H${g1}V${ch}H${g2}V${b.cy}H${end}`, lx: (g1 + g2) / 2, ly: ch, label: c.label, dashed });
          }
        } else {
          /* back: from under the source, along the channel under the lower lane, up into the target */
          const ch = channelBelow(Math.max(a.lane, b.lane)) + 2 * OFF;
          out.push({ d: `M${a.cx} ${a.bottom}V${ch}H${b.cx}V${b.bottom + 2}`, lx: (a.cx + b.cx) / 2, ly: ch, label: c.label, dashed });
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
  }, [connections, steps, lanes]);

  const cols = steps.length;
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--surface)]" dir="ltr">
      <div
        ref={grid}
        data-lane-grid=""
        className="relative grid bg-[var(--surface)]"
        style={{
          gridTemplateColumns: `${LABEL_W}px repeat(${cols}, minmax(${COL_MIN}px, 1fr))`,
          gridTemplateRows: `repeat(${lanes.length}, ${LANE_H}px)`,
          minWidth: LABEL_W + cols * COL_MIN,
          paddingBlock: PAD,
        }}
      >
        {lanes.map((l, i) => (
          <div key={l.key} className="contents">
            <div className={`col-span-full border-t border-[var(--line-soft)] first:border-t-0 ${i % 2 ? "bg-[var(--zebra)]" : ""}`} style={{ gridRow: i + 1, gridColumn: "1 / -1" }} />
            <div
              className="sticky left-0 z-[3] flex items-center border-r border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[.1em] text-[var(--ink-2)]"
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
              <span className={`block font-mono text-[10px] font-bold ${s.proposed ? "text-[var(--gold-deep)]" : "text-[var(--ink-3)]"}`}>{head.toUpperCase()}</span>
              <b className="block text-[12.5px] leading-tight text-[var(--ink)]">{s.label}</b>
            </>
          );
          const on = s.id === sel ? "shadow-[0_0_0_3px_var(--gold)]" : "";
          if (ends && !pickEnds)
            return (
              <div key={s.id} data-step={s.id} style={pos} className="relative z-[2] w-[100px] self-center justify-self-center rounded-full border-[1.5px] border-[var(--field-line)] bg-[var(--surface-2)] px-[9px] py-1.5 text-center">
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
                  ? "w-[100px] rounded-full border-[1.5px] border-[var(--field-line)] bg-[var(--surface-2)] text-center"
                  : s.proposed
                    ? "w-[108px] rounded-lg border-2 border-dashed border-[var(--gold)] bg-[var(--over-bg)] text-left"
                    : `w-[108px] rounded-lg border-[1.5px] bg-[var(--surface)] text-left ${s.type === "DECISION" ? "border-dashed border-[var(--stone)]" : "border-[var(--field-line)]"}`
              } ${on}`}
            >
              {inner}
              {s.changed && <span className="absolute -left-1.5 -top-[9px] rounded-[3px] bg-[var(--gold)] px-1 text-[9px] font-extrabold tracking-[.05em] text-[var(--on-accent)]">{m.changed.toUpperCase()}</span>}
              {s.gap && (
                <span title={s.gap} className="absolute -right-[7px] -top-[9px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[var(--bad)] text-[11px] font-extrabold text-white">
                  !
                </span>
              )}
            </button>
          );
        })}
        <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <marker id={`${marker}a`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 8 4 0 8z" style={{ fill: "var(--field-line)" }} />
            </marker>
            <marker id={`${marker}g`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 8 4 0 8z" style={{ fill: "var(--gold)" }} />
            </marker>
          </defs>
          {edges.map((e, i) => (
            <path
              key={i}
              d={e.d}
              fill="none"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeDasharray={e.dashed ? "4 3" : undefined}
              markerEnd={`url(#${marker}${e.dashed ? "g" : "a"})`}
              style={{ stroke: e.dashed ? "var(--gold)" : "var(--field-line)" }}
            />
          ))}
          {edges.map((e, i) => {
            if (!e.label) return null;
            const w = e.label.length * 6 + 10;
            return (
              <g key={`l${i}`}>
                <rect x={e.lx - w / 2} y={e.ly - 8} width={w} height="16" rx="3" style={{ fill: "var(--surface)", stroke: "var(--line)" }} />
                <text x={e.lx} y={e.ly + 3.5} textAnchor="middle" fontSize="10.5" fontWeight="600" style={{ fill: "var(--ink-2)" }}>
                  {e.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
