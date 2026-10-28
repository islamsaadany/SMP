"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { registerTitles } from "@/ffp/lib/data/role-matching";
import { titleKey } from "@/ffp/lib/register-sync";
import { notFound, ok, validationError, type ActionResult } from "@/ffp/lib/actions/errors";

const schema = z.object({
  workspaceId: z.string().min(1),
  roleId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
});

/**
 * MATCH A ROLE TO A JOB TITLE ON THE REGISTER, ONCE (stage 1b, Islam: "2 A").
 * Everything the role is named in moves to the title's role, in one
 * transaction: the steps it does or supports or swims in, its RACI cells (where
 * the title already holds a cell on the same activity, the title's stands),
 * the authority rules it signs, the governance items it owns, and the RACI
 * columns pinned to it. Then the old role is retired, never deleted (§35), and
 * the people linked to it let go: a person's role is their title now.
 * The title must be one the register holds today.
 */
export async function matchRoleToTitle(input: z.infer<typeof schema>): Promise<ActionResult<{ roleId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationError("Pick a job title", parsed.error.issues);
  const { workspaceId, roleId, title } = parsed.data;
  const access = await requireWorkspaceAccess(workspaceId, "EDITOR");
  if (!access.ok) return access;

  const titles = await registerTitles(workspaceId);
  const exact = titles.find((t) => titleKey(t) === titleKey(title));
  if (!exact) return validationError(`"${title}" is not a job title on the client register.`);
  const from = await prisma.role.findFirst({ where: { id: roleId, workspaceId, archivedAt: null }, select: { id: true, name: true } });
  if (!from) return notFound();
  if (titleKey(from.name) === titleKey(exact)) return ok({ roleId: from.id });

  const toId = await prisma.$transaction(async (tx) => {
    const roles = await tx.role.findMany({ where: { workspaceId }, select: { id: true, name: true, archivedAt: true } });
    const found = roles.filter((r) => titleKey(r.name) === titleKey(exact)).sort((a, b) => Number(!!a.archivedAt) - Number(!!b.archivedAt))[0];
    const to = found ?? (await tx.role.create({ data: { workspaceId, name: exact }, select: { id: true, name: true, archivedAt: true } }));
    if (to.archivedAt) await tx.role.update({ where: { id: to.id }, data: { archivedAt: null } });

    await tx.processStep.updateMany({ where: { assignedRoleId: from.id }, data: { assignedRoleId: to.id } });
    await tx.processStep.updateMany({ where: { swimlaneRoleId: from.id }, data: { swimlaneRoleId: to.id } });
    const supported = await tx.processStep.findMany({ where: { supportingRoles: { some: { id: from.id } } }, select: { id: true } });
    for (const s of supported)
      await tx.processStep.update({ where: { id: s.id }, data: { supportingRoles: { disconnect: { id: from.id }, connect: { id: to.id } } } });

    const cells = await tx.raciAssignment.findMany({ where: { roleId: from.id }, select: { id: true, activityId: true } });
    const taken = new Set(
      (await tx.raciAssignment.findMany({ where: { roleId: to.id, activityId: { in: cells.map((c) => c.activityId) } }, select: { activityId: true } })).map((c) => c.activityId)
    );
    for (const c of cells) {
      if (taken.has(c.activityId)) await tx.raciAssignment.delete({ where: { id: c.id } });
      else await tx.raciAssignment.update({ where: { id: c.id }, data: { roleId: to.id } });
    }

    await tx.authorityRule.updateMany({ where: { whoRoleId: from.id }, data: { whoRoleId: to.id } });
    await tx.governanceRisk.updateMany({ where: { ownerRoleId: from.id }, data: { ownerRoleId: to.id } });
    await tx.governanceChecklistItem.updateMany({ where: { ownerRoleId: from.id }, data: { ownerRoleId: to.id } });
    await tx.governanceRiskTreatmentAction.updateMany({ where: { ownerRoleId: from.id }, data: { ownerRoleId: to.id } });

    const pinned = await tx.process.findMany({ where: { workspaceId, raciVisibleRoleIds: { has: from.id } }, select: { id: true, raciVisibleRoleIds: true } });
    for (const p of pinned)
      await tx.process.update({
        where: { id: p.id },
        data: { raciVisibleRoleIds: [...new Set(p.raciVisibleRoleIds.map((id) => (id === from.id ? to.id : id)))] },
      });

    await tx.personRole.deleteMany({ where: { roleId: from.id } });
    await tx.role.update({ where: { id: from.id }, data: { archivedAt: new Date() } });
    return to.id;
  });

  revalidatePath(`/${workspaceId}/processes`, "layout");
  return ok({ roleId: toId });
}
