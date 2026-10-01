/* THE ORG DIRECTORY MIRRORS THE CLIENT'S PEOPLE REGISTER (FFProcess carried
   in, decision "smp client register", 2026-10-01).

   Who works at a client is the register's question and nobody else's (§53.5:
   one fact, one door). So every active person on it appears in Processes'
   Org Directory, their NAME and EMAIL follow the register, and somebody the
   register retires — or no longer holds — is hidden here too. What stays
   Processes' own is what the register does not know: a person's roles in the
   process maps and their reporting line.

   NEVER A DELETE. A person hidden here keeps every RACI cell, step and
   authority rule that names them, exactly as FFProcess archives (§35).

   MATCHED BY THE REGISTER KEY, ADOPTED BY EMAIL ONCE. A Processes person
   carried from the old FFProcess database has no key; the first time a
   register row shares their address (case-insensitive) they are LINKED rather
   than duplicated — and only an unlinked person is ever adopted, so two
   register rows cannot fight over one. A name is never an identifier (§87).

   The office's own rows on the register (extra.forefront, §313.29) are not
   the client's staff and do not appear.

   Run on every Processes page load: one register read and one people read,
   and writes only where something differs, so a quiet load writes nothing. */
import { cache } from "react";
import { prisma } from "@/ffp/lib/db/client";
import { withTenant } from "@/lib/tenant";
import { currentUser } from "@/lib/session.ts";
import { doorPool } from "@/lib/auth.ts";
import { resolveTenant } from "@/lib/door.ts";
import { officeSeat } from "@/ffp/lib/auth/workspace";

type RegRow = { key: string; name: string; email: string; active: boolean };

export async function readRegister(tenantId: string): Promise<RegRow[]> {
  return withTenant(tenantId, async (c) => {
    const r = await c.query(
      "SELECT key, COALESCE(NULLIF(name, ''), key) AS name, lower(trim(COALESCE(extra->>'email', ''))) AS email, " +
      "COALESCE(extra->>'active', 'true') <> 'false' AS active FROM people " +
      "WHERE COALESCE(extra->>'forefront', '') = '' ORDER BY idx, key");
    return (r.rows as any[]).map((x) => ({ key: String(x.key), name: String(x.name), email: String(x.email || ""), active: !!x.active }));
  });
}

export async function syncRegister(workspaceId: string, tenantId: string): Promise<{ created: number; updated: number }> {
  const reg = await readRegister(tenantId);
  const people = await prisma.person.findMany({
    where: { workspaceId },
    select: { id: true, name: true, email: true, archivedAt: true, smpKey: true },
  });
  const byKey = new Map(people.filter((p) => p.smpKey).map((p) => [p.smpKey as string, p]));
  const byEmail = new Map<string, (typeof people)[number]>();
  for (const p of people) {
    const e = (p.email || "").trim().toLowerCase();
    if (!p.smpKey && e && !byEmail.has(e)) byEmail.set(e, p);
  }
  let created = 0, updated = 0;
  const held = new Set<string>();
  for (const r of reg) {
    held.add(r.key);
    let p = byKey.get(r.key);
    if (!p && r.email) {
      const e = byEmail.get(r.email);
      if (e) { byEmail.delete(r.email); p = e; }
    }
    const email = r.email || null;
    if (p) {
      const archive = r.active ? null : (p.archivedAt || new Date());
      const differs = p.smpKey !== r.key || p.name !== r.name || (p.email || null) !== email
        || (!!p.archivedAt) !== (!r.active);
      if (differs) {
        await prisma.person.update({ where: { id: p.id }, data: { smpKey: r.key, name: r.name, email, archivedAt: archive } });
        updated++;
      }
    } else if (r.active) {
      try {
        await prisma.person.create({ data: { workspaceId, smpKey: r.key, name: r.name, email: email || undefined } });
        created++;
      } catch (e: any) {
        /* A second page load creating the same person at the same moment —
           the unique (workspaceId, smpKey) index refused it, and the row the
           other load made is the one we wanted. */
        if (e?.code !== "P2002") throw e;
      }
    }
  }
  /* A row the register no longer holds at all: hidden, never deleted. */
  for (const p of people) {
    if (p.smpKey && !held.has(p.smpKey) && !p.archivedAt) {
      await prisma.person.update({ where: { id: p.id }, data: { archivedAt: new Date() } });
      updated++;
    }
  }
  return { created, updated };
}

/* ONE SYNC PER REQUEST, AWAITED BY WHOEVER READS PEOPLE. Next renders a
   layout and its page CONCURRENTLY, so a sync started in the layout alone
   lost the race on the first load — the Org Directory read an empty list and
   the people appeared one refresh later (measured). React's cache() makes
   this one promise per request: the layout and every page that lists people
   await the same sync, so none of them can read ahead of it. The office only
   (a client's own person never reaches these pages), and a failed sync costs
   a stale directory, never the page. */
export const registerReady = cache(async (slug: string): Promise<void> => {
  try {
    const user = await currentUser();
    if (!user) return;
    const door = await resolveTenant(doorPool(), user, slug);
    if (!door.ok || (door.seat !== "super" && door.seat !== "smoteam")) return;
    await officeSeat(slug);
    await syncRegister(slug, door.tenant.id);
  } catch (e) {
    console.error("processes: register sync failed —", (e as Error).message);
  }
});
