/**
 * HOW THE PROCESS LIBRARY CAN BE ARRANGED — pure, no DB and no clock.
 *
 * The library is a tree (a main process, then its sub-processes). An arrangement keeps that shape and orders each
 * level by one key, so a main's subs stay under it whatever the key is. "My order" is the office's own saved order,
 * kept per level (a main among the mains, a sub among its main's subs). The default, by code, is what the list has
 * always shown. Grouping by department only reorders the whole blocks (a main with everything under it) and never
 * splits one.
 */
import type { HierarchyNode } from "./process-hierarchy";

export const ARRANGE_KEYS = ["code", "mine", "name", "dept", "state", "steps", "updated"] as const;
export type ArrangeKey = (typeof ARRANGE_KEYS)[number];

export const ARRANGE_LABEL: Record<ArrangeKey, string> = {
  code: "By code",
  mine: "My order",
  name: "By name",
  dept: "By department",
  state: "By where it is",
  steps: "By number of steps",
  updated: "By last changed",
};

/** What a key needs to know about a process. */
export type Arrangeable = HierarchyNode & {
  code: string;
  name: string;
  /** The saved position among its siblings, when it has one. */
  sortOrder: number | null;
  dept: string | null;
  /** Lower comes first: what needs the office soonest. */
  state: number;
  steps: number;
  /** Milliseconds since the epoch. */
  updated: number;
};

export const parseArrange = (v: unknown): ArrangeKey => (ARRANGE_KEYS as readonly string[]).includes(v as string) ? (v as ArrangeKey) : "code";

const byCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code, undefined, { numeric: true });

/** The order of two siblings under a key; a tie falls back to the code so the order is always the same. */
export function compareBy(key: ArrangeKey, a: Arrangeable, b: Arrangeable): number {
  let c = 0;
  switch (key) {
    case "code":
      break;
    case "mine":
      // Positions first; a process nobody has placed yet comes after every placed one.
      c = (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
      break;
    case "name":
      c = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      break;
    case "dept":
      // No department goes last.
      c = (a.dept ?? "￿").localeCompare(b.dept ?? "￿", undefined, { sensitivity: "base" });
      break;
    case "state":
      c = a.state - b.state;
      break;
    case "steps":
      c = a.steps - b.steps;
      break;
    case "updated":
      c = a.updated - b.updated;
      break;
  }
  return c || byCode(a, b);
}

/**
 * Every process exactly once, in tree order, with each level ordered by `key` (reversed when `desc`). A process
 * whose parent is not in the list is a root rather than lost, as in orderProcessTree.
 */
export function arrangeProcessTree<T extends Arrangeable>(processes: T[], key: ArrangeKey, desc = false): { process: T; depth: number }[] {
  const present = new Set(processes.map((p) => p.id));
  const children = new Map<string | null, T[]>();
  for (const p of processes) {
    const k = p.parentProcessId && present.has(p.parentProcessId) ? p.parentProcessId : null;
    (children.get(k) ?? children.set(k, []).get(k)!).push(p);
  }
  const out: { process: T; depth: number }[] = [];
  const placed = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    const level = [...(children.get(parent) ?? [])].sort((a, b) => (desc ? -1 : 1) * compareBy(key, a, b));
    for (const p of level) {
      if (placed.has(p.id)) continue;
      placed.add(p.id);
      out.push({ process: p, depth });
      walk(p.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const p of processes) if (!placed.has(p.id)) out.push({ process: p, depth: 0 }); // a cycle's leftovers
  return out;
}

/**
 * Whole blocks (a top-level row and everything under it) put in group order, stably. `groupOf` is the group's
 * position for a top-level process; blocks of one group keep the order they already had.
 */
export function groupBlocks<T>(rows: { process: T; depth: number }[], groupOf: (p: T) => number): { process: T; depth: number }[] {
  const blocks: { process: T; depth: number }[][] = [];
  for (const r of rows) {
    if (r.depth === 0 || blocks.length === 0) blocks.push([r]);
    else blocks[blocks.length - 1]!.push(r);
  }
  return blocks
    .map((b, i) => ({ b, g: groupOf(b[0]!.process), i }))
    .sort((x, y) => x.g - y.g || x.i - y.i)
    .flatMap((x) => x.b);
}

/**
 * Moving one process up or down among its siblings. `siblings` are the ids in their current "My order" order;
 * the result is the new full order, with every sibling given a position (so ones nobody had placed are placed
 * where they were shown). Moving past either end changes nothing.
 */
export function moveWithin(siblings: string[], id: string, direction: "UP" | "DOWN"): string[] {
  const i = siblings.indexOf(id);
  const j = direction === "UP" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return siblings;
  const next = [...siblings];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}
