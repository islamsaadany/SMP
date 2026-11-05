import "server-only";
import { cache } from "react";
import { prisma } from "@/ffp/lib/db/client";

/**
 * THE SUGGESTIONS THE OFFICE WORKS ON (spec 067 §4.2, stage 4). To handle lists
 * the new ones and the replies to its answers; the builder page shows the ones
 * being worked into a process. A step is named by its number among the steps
 * a reader counts (tasks and decisions), as the reading side numbers them.
 */
export type OfficeSuggestion = {
  id: string;
  processId: string | null;
  processCode: string | null;
  processName: string | null;
  stepId: string | null;
  stepNo: number | null;
  stepLabel: string | null;
  byName: string;
  text: string;
  why: string | null;
  state: "NEW" | "ANSWERED" | "REPLIED" | "IN_DRAFT" | "CLOSED";
  answerText: string | null;
  replyText: string | null;
  createdAt: Date;
  repliedAt: Date | null;
};

export const officeSuggestions = cache(async (workspaceId: string, states: OfficeSuggestion["state"][], processId?: string): Promise<OfficeSuggestion[]> => {
  const rows = await prisma.processSuggestion.findMany({
    where: { workspaceId, state: { in: states }, ...(processId ? { processId } : {}) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, processId: true, stepId: true, byName: true, text: true, why: true, state: true, answerText: true, replyText: true, createdAt: true, repliedAt: true,
      process: { select: { code: true, name: true, steps: { where: { type: { in: ["TASK", "DECISION"] } }, orderBy: { order: "asc" }, select: { id: true, label: true } } } },
    },
  });
  return rows.map((r) => {
    const i = r.process?.steps.findIndex((s) => s.id === r.stepId) ?? -1;
    return {
      id: r.id,
      processId: r.processId,
      processCode: r.process?.code ?? null,
      processName: r.process?.name ?? null,
      stepId: r.stepId,
      stepNo: i >= 0 ? i + 1 : null,
      stepLabel: i >= 0 ? r.process!.steps[i].label : null,
      byName: r.byName,
      text: r.text,
      why: r.why,
      state: r.state as OfficeSuggestion["state"],
      answerText: r.answerText,
      replyText: r.replyText,
      createdAt: r.createdAt,
      repliedAt: r.repliedAt,
    };
  });
});

/** How a suggestion's step reads: "step 4, Deliver". */
export const stepName = (s: Pick<OfficeSuggestion, "stepNo" | "stepLabel">, step: (n: number) => string) => (s.stepNo ? `${step(s.stepNo).toLowerCase()}, ${s.stepLabel}` : null);
