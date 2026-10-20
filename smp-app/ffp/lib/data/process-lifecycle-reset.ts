import "server-only";
import { prisma } from "@/ffp/lib/db/client";

/**
 * Editing a process that is in force undoes its approval: the approval was for
 * the text that was approved. Called by the actions that change a process's
 * content, after they have checked access. It lives outside the "use server"
 * actions file so it is never reachable from a browser on its own.
 */
export async function resetIfInForce(processId: string) {
  await prisma.process.updateMany({
    where: { id: processId, lifecycleStatus: { in: ["APPROVED", "PUBLISHED"] } },
    data: { lifecycleStatus: "DRAFT", returnReason: null },
  });
}
