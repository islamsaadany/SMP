/** The "!" on a deep-dive card: what each bar is and what turns it green. Plain <details>, so it needs no script. */
export function AspectInfo({ aspects }: { aspects: { label: string; help: string; done: boolean }[] }) {
  return (
    <details className="relative inline-block align-middle">
      <summary
        aria-label="What the bars mean"
        className="inline-flex h-4 w-4 cursor-pointer list-none items-center justify-center rounded-full border border-slate-400 text-[10px] font-bold leading-none text-slate-600 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
      >
        !
      </summary>
      <div className="absolute start-0 top-5 z-10 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg">
        <p className="mb-1.5 font-semibold text-slate-900">One bar per aspect. Green = done.</p>
        <ul className="space-y-1.5">
          {aspects.map((a) => (
            <li key={a.label} className="flex gap-2">
              <span aria-hidden className={`mt-1 h-2 w-2 flex-none rounded-full ${a.done ? "bg-emerald-600" : "bg-slate-300"}`} />
              <span>
                <b className="text-slate-900">{a.label}</b>
                <span className="text-slate-500"> · {a.done ? "done" : "not yet"}</span>
                <br />
                {a.help}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-slate-500">Nobody ticks these. They turn green by themselves as the work is done on the process.</p>
      </div>
    </details>
  );
}
