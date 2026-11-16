"use server";

import { z } from "zod";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { ok, notFound, validationError, aiUnavailable, type ActionResult } from "@/ffp/lib/actions/errors";
import { runSopSuggest } from "@/ffp/lib/ai/sop-suggest";
import { buildSopPrompt, cleanAnswers, emptyFields, type SopAnswer, type SopStepFacts } from "@/ffp/lib/domain/sop-suggest";
import { getActionLocale } from "@/ffp/lib/i18n/server";
import { withAnswerLanguage } from "@/ffp/lib/i18n/locale";

const schema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  /** The steps to draft for; at most 8 at a time so the answer comes back while the person waits. */
  stepIds: z.array(z.string().min(1)).min(1).max(8),
});

/**
 * Drafts the empty SOP fields of some steps from the workspace's industry and what the person has already entered
 * about the process and its steps. NOTHING IS SAVED here: the drafts go back to the page, where each one is used,
 * edited or deleted by the person. A field that already has text is never drafted.
 */
export async function suggestStepSops(input: z.infer<typeof schema>): Promise<ActionResult<{ suggestions: SopAnswer[] }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, processId, stepIds } = parsed.data;

  const access = await requireWorkspaceAccess(workspaceId, "EDITOR");
  if (!access.ok) return access;

  const [workspace, process] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { industry: true } }),
    prisma.process.findUnique({ where: { id: processId }, select: { workspaceId: true, name: true, description: true, processPurpose: true } }),
  ]);
  if (!workspace || !process || process.workspaceId !== workspaceId) return notFound();

  const rows = await prisma.processStep.findMany({ where: { processId }, include: { assignedRole: { select: { name: true } } }, orderBy: { createdAt: "asc" } });
  let n = 0;
  const steps: SopStepFacts[] = [];
  for (const s of rows) {
    if (s.type !== "TASK" && s.type !== "DECISION") continue;
    n += 1;
    if (s.skippedGaps.includes("SOP")) continue;
    steps.push({
      id: s.id, n, type: s.type, label: s.label, role: s.assignedRole?.name ?? null,
      how: s.detailedAction, inputs: s.sopInputs ?? "", output: s.sopOutput ?? "", errors: s.sopErrors ?? "", risk: s.exceptionHandling ?? "",
      note: s.stepNote ?? "", rules: s.escalationNote ?? "",
    });
  }
  const targetIds = stepIds.filter((id) => steps.some((s) => s.id === id && emptyFields(s).length > 0));
  if (!targetIds.length) return ok({ suggestions: [] });

  const prompt = buildSopPrompt({ industry: workspace.industry, processName: process.name, description: process.description, purpose: process.processPurpose, steps, targetIds });
  const outcome = await runSopSuggest(withAnswerLanguage(prompt, await getActionLocale()));
  if (!outcome.ok) {
    if (outcome.reason === "NOT_CONFIGURED") return aiUnavailable(outcome.message);
    return validationError(outcome.message);
  }
  return ok({ suggestions: cleanAnswers(outcome.data.steps, steps, targetIds) });
}

const skipSchema = z.object({ workspaceId: z.string().min(1), processId: z.string().min(1), stepId: z.string().min(1), skipped: z.boolean() });

/** Marks one step "no SOP needed" (or brings it back). A skipped step is not counted as lacking anything and is not drafted for. */
export async function setStepSopSkipped(input: z.infer<typeof skipSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = skipSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, processId, stepId, skipped } = parsed.data;
  const access = await requireWorkspaceAccess(workspaceId, "EDITOR");
  if (!access.ok) return access;
  const process = await prisma.process.findUnique({ where: { id: processId }, select: { workspaceId: true } });
  if (!process || process.workspaceId !== workspaceId) return notFound();
  const step = await prisma.processStep.findUnique({ where: { id: stepId }, select: { processId: true, skippedGaps: true } });
  if (!step || step.processId !== processId) return notFound();
  const next = skipped ? [...new Set([...step.skippedGaps, "SOP"])] : step.skippedGaps.filter((g) => g !== "SOP");
  await prisma.processStep.update({ where: { id: stepId }, data: { skippedGaps: next } });
  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/${workspaceId}/processes/processes/${processId}`);
  revalidatePath(`/${workspaceId}/processes/reports/sop`);
  return ok({ id: stepId });
}
