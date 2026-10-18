/* WHAT THE TOP BAR MAY SAY ABOUT THE PERSON LOOKING, carried with the request.
   The router works out facts about the viewer once; the bar (lib/topbar.ts) and
   the stamped shell (lib/shell.ts) read them here, so no module page has to
   pass them down by hand (§53.5 — one answer, two readers). Only the Node
   runtime's AsyncLocalStorage holds it; outside a request it reads as nothing.

   Today: the staff reader view's link (spec: Processes lifecycle, §542). */
import { AsyncLocalStorage } from "node:async_hooks";

/** How many processes are published for this person, and how many they have not yet acknowledged. */
export type ProcessesRead = { published: number; waiting: number };
export type BarExtras = { processesRead: ProcessesRead | null };

const store = new AsyncLocalStorage<BarExtras>();

export function withBarExtras<T>(extras: BarExtras, fn: () => T): T {
  return store.run(extras, fn);
}

export function barExtras(): BarExtras {
  return store.getStore() ?? { processesRead: null };
}

/** The link's words, or null when there is nothing published and so no link at all. */
export function readingLink(r: ProcessesRead | null | undefined): { label: string; count: string | null } | null {
  if (!r || r.published <= 0) return null;
  return { label: "Processes", count: r.waiting > 0 ? r.waiting + " to read" : null };
}
