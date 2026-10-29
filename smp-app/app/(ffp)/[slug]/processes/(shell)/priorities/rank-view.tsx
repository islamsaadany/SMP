import Link from "next/link";
import { DECISION_LABEL, type Decision } from "@/ffp/lib/domain/priorities";
import type { PriorityRow } from "@/ffp/lib/data/priorities";
import { DecisionSelect } from "./decision-select";

const W = 560, H = 400, L = 46, B = 36, T = 14, R = 14;
const PW = W - L - R, PH = H - T - B;
const FILL: Record<Decision | "NONE", string> = { WAVE_1: "#3730a3", WAVE_2: "#d97706", LATER: "#94a3b8", HIGH_LEVEL: "#e2e8f0", NONE: "#f8fafc" };

/** Importance across, risk up, circle size = complexity. Each circle opens that process's detail beside it. */
export function RankView({ workspaceId, rows, selectedId, editable }: { workspaceId: string; rows: PriorityRow[]; selectedId: string | null; editable: boolean }) {
  const plotted = rows.filter((r) => r.importance != null && r.risk != null && r.complexity != null);
  const unscored = rows.filter((r) => !(r.importance != null && r.risk != null && r.complexity != null));
  const selected = rows.find((r) => r.id === selectedId) ?? rows.find((r) => r.rank === 1) ?? null;
  const seen: Record<string, number> = {};
  const href = (id: string) => `/${workspaceId}/processes/priorities?step=rank&sel=${id}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Importance across, risk up — bigger circle means more complex</h2>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Importance against risk for each process">
          <rect x={L} y={T} width={PW} height={PH} rx={6} fill="var(--color-slate-100)" />
          <rect x={L + PW / 2} y={T} width={PW / 2} height={PH / 2} rx={6} fill="var(--color-amber-100)" />
          <text x={L + PW - 8} y={T + 18} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--color-slate-700)">Start here</text>
          <text x={L + 8} y={T + 18} fontSize={12} fill="var(--color-slate-500)">Risky, less central</text>
          <text x={L + PW - 8} y={T + PH - 8} textAnchor="end" fontSize={12} fill="var(--color-slate-500)">Central, lower risk</text>
          <text x={L + 8} y={T + PH - 8} fontSize={12} fill="var(--color-slate-500)">Leave high-level</text>
          {[1, 2, 3, 4, 5].map((k) => (
            <g key={k}>
              <text x={L + ((k - 0.5) / 5) * PW} y={H - 18} textAnchor="middle" fontSize={11} fill="var(--color-slate-500)">{k}</text>
              <text x={L - 8} y={T + PH - ((k - 0.5) / 5) * PH + 4} textAnchor="end" fontSize={11} fill="var(--color-slate-500)">{k}</text>
            </g>
          ))}
          <text x={L + PW / 2} y={H - 3} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-slate-700)">Importance</text>
          <text transform={`translate(12 ${T + PH / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-slate-700)">Risk</text>
          {plotted.map((r) => {
            const k = `${r.importance}-${r.risk}`;
            seen[k] = (seen[k] ?? 0) + 1;
            const off = (seen[k]! - 1) * 16;
            const x = L + ((r.importance! - 0.5) / 5) * PW + off - 6;
            const y = T + PH - ((r.risk! - 0.5) / 5) * PH - off * 0.6;
            const on = selected?.id === r.id;
            return (
              <Link key={r.id} href={href(r.id)} aria-label={`${r.name}: importance ${r.importance}, risk ${r.risk}, complexity ${r.complexity}`}>
                <circle cx={x} cy={y} r={7 + r.complexity! * 2.6} fill={FILL[r.decision ?? "NONE"]} stroke={on ? "var(--color-slate-900)" : "var(--color-white)"} strokeWidth={on ? 2.5 : 2} strokeDasharray={r.decision ? undefined : "3 2"} opacity={0.9} />
              </Link>
            );
          })}
        </svg>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
          {(["WAVE_1", "WAVE_2", "LATER", "HIGH_LEVEL"] as const).map((d) => (
            <span key={d} className="inline-flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-full border border-slate-300" style={{ background: FILL[d] }} />{DECISION_LABEL[d]}</span>
          ))}
          <span className="inline-flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-full border border-dashed border-slate-400" />Not decided</span>
        </div>
        {unscored.length > 0 && <p className="mt-2 text-xs text-slate-500">Not scored yet, so not on the chart: {unscored.map((r) => r.name).join(", ")}.</p>}
      </section>

      <div className="space-y-4">
        {selected && (
          <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Selected process">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Selected</div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{selected.name}</h2>
            <div className="text-xs text-slate-500">{selected.code} · {selected.department ?? "No department"}</div>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              {([["Importance", selected.importance], ["Risk", selected.risk], ["Complexity", selected.complexity], ["Score", selected.score]] as const).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-slate-200 px-2 py-2"><dd className="text-xl font-bold text-slate-900">{v ?? "—"}</dd><dt className="text-[11px] text-slate-500">{k}</dt></div>
              ))}
            </dl>
            {selected.why && <p className="mt-3 text-sm text-slate-700">{selected.why}</p>}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              Decision <DecisionSelect workspaceId={workspaceId} processId={selected.id} value={selected.decision} disabled={!editable} />
            </div>
            <Link href={`/${workspaceId}/processes/processes/${selected.id}`} className="mt-3 inline-block text-xs font-semibold text-indigo-700 hover:underline">Open process →</Link>
          </section>
        )}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Ranked</h2>
          <ol className="mt-2 divide-y divide-slate-100 text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-1.5">
                <Link href={href(r.id)} className="hover:underline"><b>{r.rank ?? "—"}</b> &nbsp;{r.name}</Link>
                <span className="flex items-center gap-2"><b className="tabular-nums">{r.score ?? "—"}</b><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{r.decision ? DECISION_LABEL[r.decision] : "Not decided"}</span></span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
