import type { PlanSnapshot } from "@/ffp/lib/data/priorities";
import { DECISION_LABEL, goesDeep } from "@/ffp/lib/domain/priorities";

/**
 * The deep-dive priorities as one page for the client: how the choice was made, what is in each wave
 * and why, and where the signatures go. Drawn from a snapshot — the proposal as sent — so what the
 * client signs is what they were shown. Nothing from the working view (suggestions, notes) is here.
 */
export function PrioritiesDocument({
  clientName,
  snapshot,
  status,
  approvedBy,
  approvedAt,
  sentBy,
}: {
  clientName: string;
  snapshot: PlanSnapshot;
  status: "DRAFT" | "SENT" | "APPROVED";
  approvedBy?: string | null;
  approvedAt?: Date | null;
  sentBy?: string | null;
}) {
  const w1 = snapshot.rows.filter((r) => r.decision === "WAVE_1").sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const w2 = snapshot.rows.filter((r) => r.decision === "WAVE_2").sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const rest = snapshot.rows.filter((r) => !goesDeep(r.decision));
  const deep = w1.length + w2.length;

  const Wave = ({ title, sub, rows }: { title: string; sub: string; rows: typeof w1 }) =>
    rows.length === 0 ? null : (
      <section className="mt-5">
        <h3 className="text-sm font-bold text-slate-900">{title} <span className="font-normal text-slate-500">· {sub}</span></h3>
        <table className="mt-1 w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 align-top">
                <td className="w-8 py-1.5 font-bold text-slate-900">{r.rank}</td>
                <td className="py-1.5 pe-3 font-semibold text-slate-900">{r.name}</td>
                <td className="py-1.5 pe-3 text-slate-600">{r.department ?? ""}</td>
                <td className="py-1.5 text-slate-700">{r.why ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );

  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Deep-dive priorities — {clientName}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : status === "SENT" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
          {status === "APPROVED" ? `Approved${approvedBy ? ` by ${approvedBy}` : ""}${approvedAt ? `, ${approvedAt.toISOString().slice(0, 10)}` : ""}` : status === "SENT" ? "Waiting for approval" : "Draft"}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        From {snapshot.total} high-level processes we propose to go deep on {deep}, in this order. They were chosen on three things, weighted as shown.
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
        {([["Importance", snapshot.weights.importance], ["Risk", snapshot.weights.risk], ["Complexity", snapshot.weights.complexity]] as const).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-slate-200 px-3 py-2">
            <dt className="text-xs text-slate-500">{k}</dt>
            <dd className="text-lg font-bold text-slate-900">{v}%</dd>
          </div>
        ))}
      </dl>
      <Wave title={`Wave 1 — ${snapshot.labels.WAVE_1}`} sub={`${w1.length} process${w1.length === 1 ? "" : "es"}`} rows={w1} />
      <Wave title={`Wave 2 — ${snapshot.labels.WAVE_2}`} sub={`${w2.length} process${w2.length === 1 ? "" : "es"}`} rows={w2} />
      {rest.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-bold text-slate-900">Later, or stays high-level</h3>
          <p className="mt-1 text-sm text-slate-600">
            {rest.map((r) => `${r.name}${r.decision ? ` (${DECISION_LABEL[r.decision]})` : ""}`).join(" · ")}
          </p>
        </section>
      )}
      <div className="mt-8 grid grid-cols-2 gap-8 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-500">
        <div><div className="h-8 border-b border-slate-400" />Approved for {clientName} — name, role, date</div>
        <div><div className="h-8 border-b border-slate-400" />{sentBy ? `Strategy Office — ${sentBy}` : "Strategy Office — name, date"}</div>
      </div>
    </article>
  );
}
