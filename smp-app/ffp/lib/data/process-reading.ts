import "server-only";
import { prisma } from "@/ffp/lib/db/client";
import type { ProcessesRead } from "@/lib/bar-extras.ts";
import { readerOf, readingRows, todoOf } from "@/ffp/lib/data/reading-side";

/** Whether the deep-dive priorities have been sent for approval and name this person (by their register key) as the one to approve. */
export async function planAwaitingApprovalBy(workspaceId: string, personKey: string): Promise<boolean> {
  const person = await prisma.person.findFirst({ where: { workspaceId, smpKey: personKey, archivedAt: null }, select: { id: true } });
  if (!person) return false;
  const plan = await prisma.priorityPlan.findUnique({ where: { workspaceId }, select: { status: true, approverPersonId: true } });
  return !!plan && plan.status === "SENT" && plan.approverPersonId === person.id;
}

/**
 * For one person on a client's People register: how many processes are
 * published, how many versions in force they have a step in and have not read,
 * and how many things wait for their approval. Read from the same list as the
 * reading side's To do (reading-side.ts todoOf), so the top bar and the page
 * never disagree. Never throws: a client whose Processes tables are not there
 * yet, or a read that fails, answers "nothing to show" and the bar draws no
 * link — a top bar must not take a page down.
 */
export async function readingFor(workspaceId: string, personKey: string): Promise<ProcessesRead | null> {
  try {
    const reader = await readerOf(workspaceId, personKey);
    const rows = await readingRows(workspaceId, reader);
    const todo = await todoOf(workspaceId, reader);
    return {
      published: rows.filter((r) => r.status === "PUBLISHED").length,
      waiting: todo.filter((t) => t.kind === "read").length,
      approvals: todo.filter((t) => t.kind !== "read").length,
    };
  } catch {
    return null;
  }
}
