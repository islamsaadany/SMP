import "server-only";
/* FFProcess signed people in with its own Auth.js credentials. Inside SMP the
   SMP sign-in is the only door: the session is SMP's cookie, and the
   Processes module keeps a row in its own `users` table per SMP account,
   found by email, so every "who saved this" column it already has goes on
   working. Nothing here sets a password — FFProcess's own login page, invite
   flow and account settings are not carried across. */
import { cache } from "react";
import { currentUser } from "@/lib/session.ts";
import { prisma } from "@/ffp/lib/db/client";

export type FfpSession = { user: { id: string; email: string; name: string | null; smpId: string; isAdmin: boolean } };

/* The Firm every client's workspace hangs off. FFProcess had one Firm per
   consulting firm; inside SMP there is one — Forefront. */
export const FFP_FIRM_ID = "forefront";

export const auth = cache(async (): Promise<FfpSession | null> => {
  const u = await currentUser();
  if (!u || u.kind !== "office") return null;
  const email = u.email.trim().toLowerCase();
  const row = await prisma.user.upsert({
    where: { email },
    update: { name: u.name },
    create: { id: u.id, email, name: u.name },
  });
  return { user: { id: row.id, email: row.email, name: row.name, smpId: u.id, isAdmin: u.isAdmin } };
});

export async function ensureFirm(): Promise<string> {
  await prisma.firm.upsert({ where: { id: FFP_FIRM_ID }, update: {}, create: { id: FFP_FIRM_ID, name: "Forefront" } });
  return FFP_FIRM_ID;
}
