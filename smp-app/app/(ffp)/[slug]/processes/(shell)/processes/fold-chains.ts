// Each row's chain of processes above it, read off the tree's own order (a row
// at depth d sits under the last row seen at depth d-1), and how many
// sub-processes sit directly under each. A row is shown only while every
// process in its chain is open (process-fold.tsx). Pure, so the page and its
// check ask the same function.
export function foldChains(rows: readonly { process: { id: string }; depth: number }[]) {
  const chain: string[] = [];
  const ancestorsOf = new Map<string, string[]>();
  const directSubs = new Map<string, number>();
  for (const { process: p, depth } of rows) {
    chain.length = depth;
    ancestorsOf.set(p.id, [...chain]);
    const parent = chain[depth - 1];
    if (parent) directSubs.set(parent, (directSubs.get(parent) ?? 0) + 1);
    chain[depth] = p.id;
  }
  return { ancestorsOf, directSubs };
}
