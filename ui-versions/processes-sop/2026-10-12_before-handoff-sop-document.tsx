import type { Sop } from "@/ffp/lib/domain/sop";
import { PrintButton } from "./print-button";

const MISSING = (
  <span className="font-bold text-red-700">Missing</span>
);

function Val({ v }: { v: string | null }) {
  return v ? <>{v}</> : MISSING;
}

/** One SOP per process, each starting on a new printed page. */
export function SopDocument({ companyName, firmName, sops }: { companyName: string; firmName: string; sops: Sop[] }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8 text-slate-900 print:max-w-none print:px-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm text-slate-500">
          {sops.length} SOP{sops.length === 1 ? "" : "s"} · {companyName}
        </span>
        <PrintButton />
      </div>
      {sops.map((sop) => (
        <article key={sop.code} className="mb-10 break-after-page">
          <header className="border-b-2 border-slate-900 pb-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {companyName} · Standard Operating Procedure
            </div>
            <h1 className="mt-1 text-2xl font-semibold">
              {sop.name} <span className="font-mono text-base text-slate-500">{sop.code}</span>
            </h1>
            {sop.missingCount > 0 && (
              <div className="mt-1 text-xs font-semibold text-red-700">{sop.missingCount} item(s) still Missing</div>
            )}
          </header>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-600">Document control</h2>
          <table className="mt-1 w-full text-sm">
            <tbody>
              <tr>
                <th className="w-40 py-1 text-start font-medium text-slate-500">Version</th>
                <td><Val v={sop.control.version} /></td>
                <th className="w-40 py-1 text-start font-medium text-slate-500">Effective date</th>
                <td><Val v={sop.control.effectiveDate} /></td>
              </tr>
              <tr>
                <th className="py-1 text-start font-medium text-slate-500">Owner</th>
                <td><Val v={sop.control.owner} /></td>
                <th className="py-1 text-start font-medium text-slate-500">Approved by</th>
                <td><Val v={sop.control.approvedBy} /></td>
              </tr>
            </tbody>
          </table>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-600">Purpose and scope</h2>
          <p className="mt-1 text-sm"><Val v={sop.purpose} /></p>
          {(sop.inScope.length > 0 || sop.outOfScope.length > 0) && (
            <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold uppercase text-slate-500">In scope</div>
                <ul className="list-disc ps-4">{sop.inScope.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
              <div>
                <div className="font-bold uppercase text-slate-500">Out of scope</div>
                <ul className="list-disc ps-4">{sop.outOfScope.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            </div>
          )}

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-600">Who is involved</h2>
          <p className="mt-1 text-sm">{sop.roles.length > 0 ? sop.roles.join(" · ") : MISSING}</p>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-600">Procedure</h2>
          <table className="mt-1 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-start text-white">
                <th className="w-8 px-2 py-1.5 text-start">#</th>
                <th className="px-2 py-1.5 text-start">Step and who</th>
                <th className="px-2 py-1.5 text-start">How</th>
                <th className="px-2 py-1.5 text-start">In / out</th>
                <th className="px-2 py-1.5 text-start">Approval, hand-over</th>
              </tr>
            </thead>
            <tbody>
              {sop.procedure.map((s) => {
                const work = s.type === "TASK" || s.type === "DECISION";
                return (
                  <tr key={s.number} className="break-inside-avoid border-b border-slate-200 align-top">
                    <td className="px-2 py-1.5 font-mono">{s.number}</td>
                    <td className="px-2 py-1.5">
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-slate-600">{s.who ?? (work ? MISSING : "—")}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      {s.how.length > 0 ? (
                        <ol className="list-decimal ps-4">{s.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
                      ) : work ? (
                        MISSING
                      ) : (
                        "—"
                      )}
                      {s.errors && (
                        <div className="mt-1 text-slate-600">
                          <span className="font-semibold">Common errors:</span> {s.errors}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {work ? (
                        <>
                          <div><span className="text-slate-500">In:</span> {s.inputs ?? MISSING}</div>
                          <div><span className="text-slate-500">Out:</span> {s.output ?? MISSING}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <div>{s.approval ?? "—"}</div>
                      {s.handoff && <div className="text-slate-600">{s.handoff}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-600">Controls and KPIs</h2>
          {sop.controls.length === 0 && sop.kpis.length === 0 ? (
            <p className="mt-1 text-sm">{MISSING}</p>
          ) : (
            <div className="mt-1 text-xs">
              {sop.controls.length > 0 && <ul className="list-disc ps-4">{sop.controls.map((c, i) => <li key={i}>{c}</li>)}</ul>}
              {sop.kpis.length > 0 && (
                <ul className="mt-1 list-disc ps-4">
                  {sop.kpis.map((k, i) => (
                    <li key={i}>
                      {k.metric} — target {k.target}, {k.frequency}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-600">Revision history</h2>
          {sop.revisions.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">No revisions recorded.</p>
          ) : (
            <table className="mt-1 w-full text-xs">
              <thead>
                <tr className="text-start text-slate-500">
                  <th className="py-1 text-start">Version</th>
                  <th className="py-1 text-start">Date</th>
                  <th className="py-1 text-start">By</th>
                  <th className="py-1 text-start">What changed</th>
                </tr>
              </thead>
              <tbody>
                {sop.revisions.map((r, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="py-1">{r.version}</td>
                    <td className="py-1">{r.date}</td>
                    <td className="py-1">{r.by}</td>
                    <td className="py-1">{r.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-6 text-[10px] text-slate-400">{firmName}</div>
        </article>
      ))}
    </main>
  );
}
