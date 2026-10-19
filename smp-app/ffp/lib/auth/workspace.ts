import "server-only";
import { cache } from "react";
import { auth, ensureFirm } from "@/ffp/lib/auth/config";
import { prisma } from "@/ffp/lib/db/client";
import { hasSufficientAccess, type AccessLevel } from "@/ffp/lib/domain/access-control";
import { forbidden, unauthorized, type ActionResult } from "@/ffp/lib/actions/errors";
import { currentUser } from "@/lib/session.ts";
import { doorPool } from "@/lib/auth.ts";
import { resolveTenant } from "@/lib/door.ts";
import { mayRead } from "@/ffp/lib/domain/process-reader";

export type WorkspaceAccess = {
  userId: string;
  accessLevel: AccessLevel;
  accessVia: "MEMBER" | "OWNER_CARVEOUT";
};

/* WHO MAY OPEN A CLIENT'S PROCESSES IS SMP'S ANSWER, NOT FFPROCESS'S.
   A workspace's id IS the SMP client's address (`rhi`), so the door is asked
   about that client exactly as every other page asks it (resolveTenant), and
   the Processes module is the office's alone: a seat of super user or SMO team
   on that client. FFProcess's own Member and FirmMember rows are no longer
   consulted — inside SMP the seat is the membership. The workspace row is
   made the first time the office opens the client, named after it. */
export const officeSeat = cache(async (slug: string): Promise<{ ok: true; userId: string } | { ok: false }> => {
  const session = await auth();
  if (!session) return { ok: false };
  const user = await currentUser();
  const door = await resolveTenant(doorPool(), user, slug);
  if (!door.ok) return { ok: false };
  if (door.seat !== "super" && door.seat !== "smoteam") return { ok: false };
  const firmId = await ensureFirm();
  await prisma.workspace.upsert({
    where: { id: door.tenant.key },
    update: {},
    create: { id: door.tenant.key, firmId, name: door.tenant.name },
  });
  return { ok: true, userId: session.user.id };
});

/* WHO MAY OPEN THE STAFF READER VIEW — the one part of Processes that is not
   the office's alone. The office, or a client's own person who holds a row on
   that client's People register. Everything else in Processes still asks
   officeSeat above; a page that does not ask for either is open to nobody it
   should not be, because tests/processes-gate.mjs fails if one is left bare. */
export type ReaderSeat =
  | { ok: true; office: boolean; userId: string; email: string; name: string; personKey: string | null; tenantName: string }
  | { ok: false };

export const readerSeat = cache(async (slug: string): Promise<ReaderSeat> => {
  /* SMP's own session, NOT this module's auth(): that one answers only for the office, and the whole
     point of the reading view is that a client's own person can open it. */
  const user = await currentUser();
  if (!user) return { ok: false };
  const door = await resolveTenant(doorPool(), user, slug);
  if (!door.ok) return { ok: false };
  const office = door.seat === "super" || door.seat === "smoteam";
  if (!mayRead({ office, userKind: user.kind, personKey: door.personKey })) return { ok: false };
  return {
    ok: true,
    office,
    userId: user.id,
    email: user.email,
    name: user.name || user.email,
    personKey: door.personKey,
    tenantName: door.tenant.name,
  };
});

export async function requireWorkspaceAccess(
  workspaceId: string,
  minLevel: AccessLevel = "VIEWER"
): Promise<ActionResult<WorkspaceAccess>> {
  const seat = await officeSeat(workspaceId);
  if (!seat.ok) return unauthorized();
  const accessLevel: AccessLevel = "ADMIN";
  if (!hasSufficientAccess(accessLevel, minLevel)) return forbidden(minLevel);
  return { ok: true, data: { userId: seat.userId, accessLevel, accessVia: "MEMBER" } };
}

/** A Forefront platform admin — FFProcess's Firm Owner. */
export async function requireFirmOwner(): Promise<ActionResult<{ userId: string }>> {
  const session = await auth();
  if (!session) return unauthorized();
  if (!session.user.isAdmin) return forbidden("ADMIN");
  const firmId = await ensureFirm();
  await prisma.firmMember.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { firmId, userId: session.user.id, role: "OWNER" },
  });
  return { ok: true, data: { userId: session.user.id } };
}
