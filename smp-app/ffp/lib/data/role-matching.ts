import "server-only";
import { cache } from "react";
import { prisma } from "@/ffp/lib/db/client";
import { currentUser } from "@/lib/session.ts";
import { doorPool } from "@/lib/auth.ts";
import { resolveTenant } from "@/lib/door.ts";
import { readRegister, titleKey } from "@/ffp/lib/register-sync";

/** The job titles on the client's register, as the register spells them, A to Z. */
export const registerTitles = cache(async (slug: string): Promise<string[]> => {
  const user = await currentUser();
  if (!user) return [];
  const door = await resolveTenant(doorPool(), user, slug);
  if (!door.ok) return [];
  const byKey = new Map<string, string>();
  for (const r of await readRegister(door.tenant.id)) if (r.active && r.title) byKey.set(titleKey(r.title), r.title.trim().replace(/\s+/g, " "));
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
});

export type UnmatchedRole = { id: string; name: string; steps: number; raci: number; rules: number; governance: number };

/**
 * The roles Processes holds that no job title on the register matches (stage
 * 1b, Islam: "2 A"): made before the register was the source, or by a bulk
 * path (the AI draft, a spreadsheet import, the value chain's import) that
 * named a role nobody has as a title. Each is matched to a title once, on the
 * office's matching page, and is gone from this list after.
 */
export const unmatchedRoles = cache(async (slug: string): Promise<UnmatchedRole[]> => {
  const titles = new Set((await registerTitles(slug)).map(titleKey));
  if (!titles.size) return [];
  const roles = await prisma.role.findMany({
    where: { workspaceId: slug, archivedAt: null },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          processSteps: true,
          swimlaneSteps: true,
          supportedSteps: true,
          raciAssignments: true,
          authorityRules: true,
          governanceRisks: true,
          checklistItemsOwned: true,
          treatmentActionsOwned: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return roles
    .filter((r) => !titles.has(titleKey(r.name)))
    .map((r) => ({
      id: r.id,
      name: r.name,
      steps: r._count.processSteps + r._count.swimlaneSteps + r._count.supportedSteps,
      raci: r._count.raciAssignments,
      rules: r._count.authorityRules,
      governance: r._count.governanceRisks + r._count.checklistItemsOwned + r._count.treatmentActionsOwned,
    }));
});
