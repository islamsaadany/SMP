"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { HANDOFF_REFUSALS, judgeHandoff } from "@/ffp/lib/domain/step-handoff";
import { ok, notFound, validationError, type ActionResult } from "@/ffp/lib/actions/errors";

const createSchema = z.object({
  workspaceId: z.string().min(1),
  /** The process whose map the person is editing (revalidated, and the to-step's home). */
  processId: z.string().min(1),
  /** The step in ANOTHER process that comes first. */
  fromStepId: z.string().min(1),
  /** The step in `processId` that waits for it. */
  toStepId: z.string().min(1),
  label: z.string().trim().max(60).optional().or(z.literal("")),
});

function revalidateMaps(workspaceId: string, processIds: string[]) {
  for (const id of new Set(processIds)) {
    revalidatePath(`/${workspaceId}/processes/processes/${id}/map`);
  }
}

/** Makes a step of another process a predecessor of a step in this one. */
export async function createStepHandoff(
  input: z.infer<typeof createSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid hand-over", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const { workspaceId, processId, fromStepId, toStepId, label } = parsed.data;

  // Every step of the workspace, so both ends are proven to belong to it and
  // the loop check can follow the whole picture.
  const steps = await prisma.processStep.findMany({
    where: { process: { workspaceId } },
    select: { id: true, processId: true },
  });
  const stepProcessId = new Map(steps.map((s) => [s.id, s.processId]));
  // The step being edited must be in the process the caller says.
  if (stepProcessId.get(toStepId) !== processId) return notFound();

  const stepIds = [...stepProcessId.keys()];
  const [connections, handoffs] = await Promise.all([
    prisma.stepConnection.findMany({
      where: { fromStepId: { in: stepIds } },
      select: { fromStepId: true, toStepId: true },
    }),
    prisma.stepHandoff.findMany({
      where: { fromStepId: { in: stepIds } },
      select: { fromStepId: true, toStepId: true },
    }),
  ]);

  const refusal = judgeHandoff({ fromStepId, toStepId }, stepProcessId, connections, handoffs);
  if (refusal) return validationError(HANDOFF_REFUSALS[refusal]);

  const created = await prisma.stepHandoff.create({
    data: { fromStepId, toStepId, label: label || undefined },
  });

  revalidateMaps(workspaceId, [processId, stepProcessId.get(fromStepId) as string]);
  return ok({ id: created.id });
}

const deleteSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  handoffId: z.string().min(1),
});

/** Removes a hand-over. Either end's process may do it; the caller names one of them. */
export async function deleteStepHandoff(
  input: z.infer<typeof deleteSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);

  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;

  const handoff = await prisma.stepHandoff.findUnique({
    where: { id: parsed.data.handoffId },
    include: {
      fromStep: { select: { processId: true, process: { select: { workspaceId: true } } } },
      toStep: { select: { processId: true } },
    },
  });
  if (
    !handoff ||
    handoff.fromStep.process.workspaceId !== parsed.data.workspaceId ||
    (handoff.fromStep.processId !== parsed.data.processId &&
      handoff.toStep.processId !== parsed.data.processId)
  ) {
    return notFound();
  }

  await prisma.stepHandoff.delete({ where: { id: handoff.id } });
  revalidateMaps(parsed.data.workspaceId, [handoff.fromStep.processId, handoff.toStep.processId]);
  return ok({ id: handoff.id });
}
