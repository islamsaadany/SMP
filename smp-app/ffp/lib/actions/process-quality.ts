"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { ok, notFound, validationError, type ActionResult } from "@/ffp/lib/actions/errors";

const text = (n: number) => z.string().trim().max(n).optional().or(z.literal(""));
const orNull = (v: string | undefined) => (v ? v : null);

const controlSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  stepId: z.string().optional().or(z.literal("")),
  risk: z.string().trim().min(1).max(300),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  control: text(300),
  controlType: z.enum(["preventive", "detective", "corrective"]).optional().or(z.literal("")),
  frequency: text(60),
  owner: text(80),
  evidence: text(200),
  lastTestResult: z.enum(["pass", "fail", "not_tested"]).optional().or(z.literal("")),
});

const ncSchema = z.object({
  workspaceId: z.string().min(1),
  processId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  detail: text(1000),
  correctiveAction: text(500),
  actionOwner: text(80),
});

function refresh(workspaceId: string, processId: string) {
  revalidatePath(`/${workspaceId}/processes/processes/${processId}`);
}

/** The process must belong to the workspace the caller is editing. */
async function ownsProcess(workspaceId: string, processId: string) {
  const p = await prisma.process.findFirst({ where: { id: processId, workspaceId }, select: { id: true } });
  return !!p;
}

export async function createProcessControl(
  input: z.infer<typeof controlSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = controlSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid risk", parsed.error.issues);
  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const d = parsed.data;
  if (!(await ownsProcess(d.workspaceId, d.processId))) return notFound();
  if (d.stepId) {
    const step = await prisma.processStep.findFirst({ where: { id: d.stepId, processId: d.processId }, select: { id: true } });
    if (!step) return notFound();
  }
  const row = await prisma.processControl.create({
    data: {
      processId: d.processId,
      stepId: orNull(d.stepId),
      risk: d.risk,
      riskLevel: d.riskLevel,
      control: orNull(d.control),
      controlType: orNull(d.controlType),
      frequency: orNull(d.frequency),
      owner: orNull(d.owner),
      evidence: orNull(d.evidence),
      lastTestResult: orNull(d.lastTestResult),
      lastTestedAt: d.lastTestResult && d.lastTestResult !== "not_tested" ? new Date() : null,
    },
    select: { id: true },
  });
  refresh(d.workspaceId, d.processId);
  return ok(row);
}

export async function deleteProcessControl(input: { workspaceId: string; processId: string; id: string }): Promise<ActionResult<null>> {
  const access = await requireWorkspaceAccess(input.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const res = await prisma.processControl.deleteMany({
    where: { id: input.id, processId: input.processId, process: { workspaceId: input.workspaceId } },
  });
  if (res.count === 0) return notFound();
  refresh(input.workspaceId, input.processId);
  return ok(null);
}

export async function createNonConformance(
  input: z.infer<typeof ncSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = ncSchema.safeParse(input);
  if (!parsed.success) return validationError("Invalid non-conformance", parsed.error.issues);
  const access = await requireWorkspaceAccess(parsed.data.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const d = parsed.data;
  if (!(await ownsProcess(d.workspaceId, d.processId))) return notFound();
  const row = await prisma.processNonConformance.create({
    data: {
      processId: d.processId,
      title: d.title,
      detail: orNull(d.detail),
      correctiveAction: orNull(d.correctiveAction),
      actionOwner: orNull(d.actionOwner),
    },
    select: { id: true },
  });
  refresh(d.workspaceId, d.processId);
  return ok(row);
}

export async function setNonConformanceStatus(input: {
  workspaceId: string;
  processId: string;
  id: string;
  status: "open" | "in_progress" | "closed";
}): Promise<ActionResult<null>> {
  if (!["open", "in_progress", "closed"].includes(input.status)) return validationError("Invalid status", []);
  const access = await requireWorkspaceAccess(input.workspaceId, "EDITOR");
  if (!access.ok) return access;
  const res = await prisma.processNonConformance.updateMany({
    where: { id: input.id, processId: input.processId, process: { workspaceId: input.workspaceId } },
    data: { status: input.status, closedAt: input.status === "closed" ? new Date() : null },
  });
  if (res.count === 0) return notFound();
  refresh(input.workspaceId, input.processId);
  return ok(null);
}
