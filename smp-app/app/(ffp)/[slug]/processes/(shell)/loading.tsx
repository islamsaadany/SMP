/* §620 — A PRESS INSIDE PROCESSES SHOWS THE PAGE'S SHAPE AT ONCE. Moving
   between Processes' own pages does not load a new document (Next draws the
   next page in place), so the shape drawn at the press elsewhere
   (lib/navskel.ts) never runs here; this is the same promise in Next's own
   words: the band and the tabs stay (they are the layout's, spec 067 §4.2),
   and the page area under them shows a grey shape until the page is ready:
   a line of controls and a table's rows, at the page's full width.
   Nothing here is pressable and nothing is read out. */
const bar = "block rounded-md bg-slate-200 motion-safe:animate-pulse";
const quiet = "block rounded-md bg-slate-100 motion-safe:animate-pulse";

export default function Loading() {
  return (
    <div className="w-full" aria-busy="true" aria-hidden="true">
      <div className="mb-3 flex gap-3">
        <span className={bar + " h-8 w-72"} />
        <span className={quiet + " h-8 w-40"} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <span className={bar + " h-9 w-full rounded-b-none"} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 border-t border-slate-100 px-4 py-3">
            <span className={quiet + " h-4 w-1/3"} />
            <span className={quiet + " h-4 w-1/6"} />
            <span className={quiet + " h-4 w-1/5"} />
          </div>
        ))}
      </div>
    </div>
  );
}
