/* §606 — A PRESS INSIDE PROCESSES SHOWS THE PAGE'S SHAPE AT ONCE. Moving
   between Processes' own pages does not load a new document (Next draws the
   next page in place), so the shape drawn at the press elsewhere
   (lib/navskel.ts) never runs here; this is the same promise in Next's own
   words: the sidebar stays, and the page area shows a grey shape until the
   page is ready. The page's own width (max-w-4xl, px-6 py-8), so the page
   replaces a box with the thing that box stood for rather than moving.
   Nothing here is pressable and nothing is read out. */
const bar = "block rounded-md bg-slate-200 motion-safe:animate-pulse";
const quiet = "block rounded-md bg-slate-100 motion-safe:animate-pulse";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8" aria-busy="true" aria-hidden="true">
      <span className={bar + " h-16 w-full rounded-xl"} />
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <span className={bar + " h-3.5 w-52"} />
        <span className={quiet + " mt-3 h-3 w-4/5"} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <span className={bar + " h-5 w-8"} />
            <span className={quiet + " mt-3 h-3 w-20"} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className={quiet + " h-10 w-full"} />
        ))}
      </div>
    </div>
  );
}
