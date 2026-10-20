import "server-only";
import { prisma } from "@/ffp/lib/db/client";
import type { ProcessesRead } from "@/lib/bar-extras.ts";

/** Processes sent for review that name this person (by their register key) as the approver. */
export async function awaitingApproval(workspaceId: string, personKey: string) {
  const person = await prisma.person.findFirst({ where: { workspaceId, smpKey: personKey, archivedAt: null }, select: { id: true } });
  if (!person) return [];
  return prisma.process.findMany({
    where: { workspaceId, archivedAt: null, lifecycleStatus: "IN_REVIEW", approverPersonId: person.id },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}

/**
 * For one person on a client's People register: how many processes are
 * published, and how many of them they have not yet acknowledged at the version
 * in force. Never throws: a client whose Processes tables are not there yet, or
 * a read that fails, answers "nothing to show" and the bar draws no link —
 * a top bar must not take a page down.
 */
export async function readingFor(workspaceId: string, personKey: string): Promise<ProcessesRead | null> {
  try {
    const published = await prisma.process.findMany({
      where: { workspaceId, archivedAt: null, lifecycleStatus: "PUBLISHED" },
      select: { id: true, versions: { where: { publishedAt: { not: null } }, orderBy: { number: "desc" }, take: 1, select: { number: true } } },
    });
    const approvals = (await awaitingApproval(workspaceId, personKey)).length;
    if (published.length === 0) return { published: 0, waiting: 0, approvals };
    const acks = await prisma.processAcknowledgement.findMany({
      where: { personKey, processId: { in: published.map((p) => p.id) } },
      select: { processId: true, versionNumber: true },
    });
    const done = new Set(acks.map((a) => `${a.processId}:${a.versionNumber}`));
    const waiting = published.filter((p) => !done.has(`${p.id}:${p.versions[0]?.number ?? 0}`)).length;
    return { published: published.length, waiting, approvals };
  } catch {
    return null;
  }
}
