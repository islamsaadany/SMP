/* The scoring engine, ported from the platform's config-data.js.

   These rules are stack-independent and are the ones the decisions document
   binds hardest (§5): nothing is stored, nulls are dropped rather than counted
   as zero, and the colour and the status word come from the same band
   function so they can never contradict each other. Ported first because
   every screen reads through them. */

export type Band = { key: "good" | "attn" | "warn" | "bad" | "none"; label: string };

/* One scale for every figure scored against a benchmark (§3.2). Read from the
   database in a later step; the defaults match the seeded tenant. */
export const DEFAULT_BANDS = [
  { key: "good", floor: 85, label: "On track" },
  { key: "attn", floor: 70, label: "Needs attention" },
  { key: "warn", floor: 50, label: "At risk" },
  { key: "bad", floor: 0, label: "Off track" },
] as const;

export function bandOf(
  v: number | null | undefined,
  bands: readonly { key: string; floor: number; label: string }[] = DEFAULT_BANDS
): Band {
  if (v == null || Number.isNaN(v)) return { key: "none", label: "No data" };
  for (const b of bands) if (v >= b.floor) return b as Band;
  return bands[bands.length - 1] as Band;
}

/* A missing number and a failing number must never look the same (§5.7):
   nulls are dropped from the mean, never averaged in as zero. */
export function avg(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => x != null && !Number.isNaN(x));
  if (!v.length) return null;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

/* A unit's headline: its Key Objectives, optionally weighted. Unweighted means
   equal — the one default nobody has to argue for (§5.4). */
export function koScore(
  list: { progress: number | null }[],
  weights?: number[] | null
): number | null {
  const scorable = list.filter((m) => m.progress != null);
  if (!scorable.length) return null;
  if (!weights) return avg(scorable.map((m) => m.progress));
  let total = 0;
  let acc = 0;
  list.forEach((m, i) => {
    if (m.progress == null) return;
    const w = weights[i] ?? 0;
    acc += m.progress * w;
    total += w;
  });
  return total ? Math.round(acc / total) : null;
}

/* A null reaches a screen as a dash by construction rather than by each call
   site remembering (§5.7). */
export function pct(v: number | null | undefined): string {
  return v == null || Number.isNaN(v) ? "—" : `${v}%`;
}
