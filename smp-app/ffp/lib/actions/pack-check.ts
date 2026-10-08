"use server";

import { z } from "zod";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { buildProcessReviewPrompt } from "@/ffp/lib/domain/process-review";
import { loadProcessReviewContext } from "@/ffp/lib/data/process-review-context";
import { runPackCheck, type PackCheckFinding } from "@/ffp/lib/ai/pack-check";
import { getActionLocale } from "@/ffp/lib/i18n/server";
import { withAnswerLanguage } from "@/ffp/lib/i18n/locale";
import { ok, notFound, validationError, aiUnavailable, type ActionResult } from "@/ffp/lib/actions/errors";

const MAX_PROCESSES = 12;

const schema = z.object({
  workspaceId: z.string().min(1),
  processIds: z.array(z.string().min(1)).min(1).max(MAX_PROCESSES),
});

export type PackCheckReport = {
  summary: string;
  findings: (PackCheckFinding & { processId: string | null })[];
  processes: { id: string; code: string; name: string }[];
};

/**
 * Reads the processes ticked for an export together, before the report is
 * opened. Nothing is stored: it answers about this pack as it stands now, and
 * a stored answer would go stale the moment a step changed. Read-only, so any
 * member (VIEWER+) may run it, like the export itself.
 */
export async function checkPackWithAI(input: z.infer<typeof schema>): Promise<ActionResult<PackCheckReport>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return validationError(`Pick between 1 and ${MAX_PROCESSES} processes to check.`, parsed.error.issues);
  }
  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "VIEWER");
  if (!access.ok) return access;

  const { workspaceId, processIds } = parsed.data;
  const [workspace, found] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.process.findMany({ where: { id: { in: processIds }, workspaceId, archivedAt: null } }),
  ]);
  if (!workspace || found.length !== new Set(processIds).size) return notFound();

  // Keep the order the consultant arranged.
  const byId = new Map(found.map((p) => [p.id, p]));
  const processes = processIds.map((id) => byId.get(id)!).filter(Boolean);

  const contexts = await Promise.all(processes.map((p) => loadProcessReviewContext(workspace, p)));
  const inPack = new Set(processes.map((p) => p.code));

  // Facts that only exist across processes — worked out here, not left to the model.
  const cross: string[] = [];
  for (const c of contexts) {
    const missing = new Set<string>();
    for (const s of c.steps) for (const code of s.linkedProcessCodes) if (!inPack.has(code)) missing.add(code);
    if (missing.size) cross.push(`${c.processCode} hands off to ${[...missing].join(", ")}, which is not in this pack.`);
  }
  const ownersByActivity = new Map<string, Map<string, string[]>>();
  for (const c of contexts) {
    for (const a of c.raci.activities) {
      const key = a.name.trim().toLowerCase();
      const owner = a.assignments.filter((x) => x.code === "ACCOUNTABLE").map((x) => x.roleName).sort().join(" + ");
      if (!owner) continue;
      const m = ownersByActivity.get(key) ?? new Map<string, string[]>();
      m.set(owner, [...(m.get(owner) ?? []), c.processCode]);
      ownersByActivity.set(key, m);
    }
  }
  for (const [name, m] of ownersByActivity) {
    if (m.size > 1) {
      cross.push(
        `The activity "${name}" has different Accountable roles: ` +
          [...m].map(([owner, codes]) => `${owner} in ${codes.join(", ")}`).join("; ") + "."
      );
    }
  }

  const promptText = [
    `This pack has ${processes.length} process(es): ${processes.map((p) => `${p.code} ${p.name}`).join("; ")}.`,
    "## Facts across the pack",
    cross.length ? cross.map((l) => `- ${l}`).join("\n") : "(none found)",
    "",
    ...contexts.map((c) => buildProcessReviewPrompt(c)),
  ].join("\n");

  const outcome = await runPackCheck(withAnswerLanguage(promptText, await getActionLocale()));
  if (!outcome.ok) {
    if (outcome.reason === "NOT_CONFIGURED") return aiUnavailable(outcome.message);
    return validationError(outcome.message);
  }

  const idByCode = new Map(processes.map((p) => [p.code.toLowerCase(), p.id]));
  return ok({
    summary: outcome.data.summary,
    findings: outcome.data.findings.map((f) => ({
      ...f,
      scope: f.scope.toUpperCase() === "ACROSS" ? "ACROSS" : f.scope,
      processId: idByCode.get(f.scope.trim().toLowerCase()) ?? null,
    })),
    processes: processes.map((p) => ({ id: p.id, code: p.code, name: p.name })),
  });
}
