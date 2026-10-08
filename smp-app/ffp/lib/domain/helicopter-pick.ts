/**
 * Which processes the Helicopter View shows. Pure, so the rules (a main ticks
 * its subs, hidden-only-from-the-picture, a link to a hidden process is
 * remembered as a note) can be checked without a browser.
 */

export type PickProcess = { id: string; code: string; name: string; parentCode: string | null };
export type PickGroup = { main: PickProcess; subs: PickProcess[] };

/** Mains in code order, each with its subs; a sub whose main is absent stands as its own main. */
export function groupProcesses(processes: PickProcess[]): PickGroup[] {
  const sorted = [...processes].sort((a, b) => a.code.localeCompare(b.code));
  const codes = new Set(sorted.map((p) => p.code));
  const groups: PickGroup[] = [];
  const byMain = new Map<string, PickGroup>();
  for (const p of sorted) {
    if (!p.parentCode || !codes.has(p.parentCode)) {
      const g = { main: p, subs: [] as PickProcess[] };
      groups.push(g);
      byMain.set(p.code, g);
    }
  }
  for (const p of sorted) {
    if (p.parentCode && codes.has(p.parentCode)) byMain.get(p.parentCode)?.subs.push(p);
  }
  return groups;
}

/** Ticking or unticking a main does the same to all its subs; a sub alone changes only itself. */
export function toggleGroup(shown: Set<string>, group: PickGroup, on: boolean): Set<string> {
  const next = new Set(shown);
  for (const p of [group.main, ...group.subs]) {
    if (on) next.add(p.id);
    else next.delete(p.id);
  }
  return next;
}

export function toggleOne(shown: Set<string>, id: string): Set<string> {
  const next = new Set(shown);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** "All (12)" when everything is shown, else "5 of 12". */
export function pickLabel(shownCount: number, total: number): string {
  return shownCount === total ? `All (${total})` : `${shownCount} of ${total}`;
}

/** none | some | all, for a main's checkbox (some = indeterminate). */
export function groupState(shown: Set<string>, group: PickGroup): "none" | "some" | "all" {
  const ids = [group.main, ...group.subs].map((p) => p.id);
  const n = ids.filter((id) => shown.has(id)).length;
  return n === 0 ? "none" : n === ids.length ? "all" : "some";
}

/**
 * For each shown process that branches from a hidden one: its id → the hidden
 * origin's code, so the picture can say "from ADM105, hidden" instead of
 * silently dropping the line.
 */
export function hiddenOrigins(
  processes: { id: string; branchFrom: { processId: string } | null }[],
  codeById: Map<string, string>,
  shown: Set<string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of processes) {
    if (!shown.has(p.id) || !p.branchFrom) continue;
    if (shown.has(p.branchFrom.processId)) continue;
    const code = codeById.get(p.branchFrom.processId);
    if (code) out[p.id] = code;
  }
  return out;
}

/** The ids a browser remembers as hidden, applied to the processes that exist now (new ones default to shown). */
export function shownFromHidden(allIds: string[], hidden: string[]): Set<string> {
  const h = new Set(hidden);
  return new Set(allIds.filter((id) => !h.has(id)));
}
