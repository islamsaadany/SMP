"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/ffp/lib/db/client";
import { readerSeat } from "@/ffp/lib/auth/workspace";
import { ok, notFound, unauthorized, validationError, type ActionResult } from "@/ffp/lib/actions/errors";

const schema = z.object({ workspaceId: z.string().min(1), processId: z.string().min(1) });

/**
 * "I have read this version." Open to a client's own person on the People
 * register (that is the point of it), so it asks readerSeat, not the office
 * seat, and records the person from their sign-in — never from the request.
 * Always the version published now; a person cannot acknowledge an old one.
 */
export async function acknowledgeProcess(input: z.infer<typeof schema>): Promise<ActionResult<{ version: number }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationError("Invalid input", parsed.error.issues);
  const { workspaceId, processId } = parsed.data;

  const seat = await readerSeat(workspaceId);
  if (!seat.ok) return unauthorized();
  if (!seat.personKey) {
    return { ok: false, error: "VALIDATION_ERROR", message: "Only people on the Client register can acknowledge. Ask the office to add you" };
  }

  const process = await prisma.process.findUnique({ where: { id: processId }, select: { workspaceId: true, lifecycleStatus: true, archivedAt: true } });
  if (!process || process.workspaceId !== workspaceId || process.archivedAt || process.lifecycleStatus !== "PUBLISHED") return notFound();

  const version = await prisma.processVersion.findFirst({
    where: { processId, publishedAt: { not: null } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  if (!version) return notFound();

  await prisma.processAcknowledgement.createMany({
    data: [{ processId, versionNumber: version.number, personKey: seat.personKey, personName: seat.name }],
    skipDuplicates: true,
  });
  revalidatePath(`/${workspaceId}/processes/read`);
  revalidatePath(`/${workspaceId}/processes/processes/${processId}`);
  return ok({ version: version.number });
}
