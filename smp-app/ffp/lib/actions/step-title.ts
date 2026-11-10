"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { titleKey } from "@/ffp/lib/register-sync";
import { ok, validationError, type ActionResult } from "@/ffp/lib/actions/errors";

const schema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1, "Write the title").max(160),
});

/**
 * A TITLE THAT IS NOT IN THE COMPANY STRUCTURE, FOR A STEP TO BE DONE BY.
 * The register's job titles are the roles a step is normally given. Some steps are done by somebody
 * the structure does not hold (a committee, a vendor desk, a title the client has not recorded yet), so the
 * office can name one here. It is found by the same title key the register uses (so "Head of Finance " and
 * "head of finance" are one role, and nothing is made twice); when no role carries it, one is made. A role made
 * this way waits on the office's matching page to be merged into a register title, once, if the register ever
 * gains it. Never deletes anything.
 */
export async function createStepTitle(input: z.infer<typeof schema>): Promise<ActionResult<{ id: string; name: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? "Write the title", parsed.error.issues);
  const { workspaceId, name } = parsed.data;
  const access = await requireWorkspaceAccess(workspaceId, "EDITOR");
  if (!access.ok) return access;

  const clean = name.replace(/\s+/g, " ");
  const role = await prisma.$transaction(async (tx) => {
    const roles = await tx.role.findMany({ where: { workspaceId }, select: { id: true, name: true, archivedAt: true } });
    const found = roles.filter((r) => titleKey(r.name) === titleKey(clean)).sort((a, b) => Number(!!a.archivedAt) - Number(!!b.archivedAt))[0];
    if (found) {
      if (found.archivedAt) await tx.role.update({ where: { id: found.id }, data: { archivedAt: null } });
      return { id: found.id, name: found.name };
    }
    return tx.role.create({ data: { workspaceId, name: clean }, select: { id: true, name: true } });
  });

  revalidatePath(`/${workspaceId}/processes/processes`);
  return ok(role);
}
