import "server-only";
import type { prisma } from "@/ffp/lib/db/client";
import { FIRST_STEP_X, STEP_X_SPACING } from "@/ffp/lib/domain/process-layout";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * The Map places steps by their order (spec 067 §4.3; dragging went with the
 * redraw), so the stored left-to-right place, which the printed map reads
 * when it does not wrap, follows the order too: a step slotted in mid-line
 * would otherwise print at the far right, and nothing could move it.
 */
export async function placeByOrder(tx: Tx, processId: string): Promise<void> {
  const steps = await tx.processStep.findMany({ where: { processId }, select: { id: true, positionX: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  for (const [index, s] of steps.entries()) {
    const x = FIRST_STEP_X + index * STEP_X_SPACING;
    if (s.positionX !== x) await tx.processStep.update({ where: { id: s.id }, data: { positionX: x } });
  }
}
