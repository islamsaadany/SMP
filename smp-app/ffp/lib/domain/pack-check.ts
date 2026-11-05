/**
 * How many processes the end-to-end check reads at once, and what its button
 * says when it cannot run. Pure, so it is testable with no browser
 * (Constitution Principle III).
 *
 * ONE VALUE, read by the server action that refuses a bigger pack
 * (actions/pack-check.ts) and by the export picker's button. The button used to
 * stay pressable however many processes were ticked, so a consultant who ticked
 * the whole list pressed it and only then read "Pick between 1 and 12".
 */
export const PACK_CHECK_MAX = 12;

/** Why the check cannot run with this many processes ticked, or null when it can. */
export function packCheckBlocked(ticked: number): string | null {
  if (ticked < 1) return "Tick at least one process to check";
  if (ticked > PACK_CHECK_MAX) {
    const over = ticked - PACK_CHECK_MAX;
    return `The check reads up to ${PACK_CHECK_MAX} processes at a time and ${ticked} are ticked. Untick ${over} to run it.`;
  }
  return null;
}
