/* THE ORG DIRECTORY MIRRORS THE CLIENT'S PEOPLE REGISTER (FFProcess carried
   in, decision "smp client register", 2026-10-01).

   Who works at a client is the register's question and nobody else's (§53.5:
   one fact, one door). So every active person on it appears in Processes'
   Org Directory, their NAME and EMAIL follow the register, and somebody the
   register retires — or no longer holds — is hidden here too.
   SINCE STAGE 1b (spec 067 §4.4, Islam 2026-10-28: "2 A") THE REGISTER ALSO
   HOLDS THEIR JOB AND THEIR MANAGER. A person's role in the maps and the RACI
   is their Job title: each title on the register is a role here, and a
   person holds the role of their title. Who they report to is the register's
   Reports to. A role Processes made that no title matches waits on the
   office's matching page ((shell)/roles) to be merged into one, once. A
   client's DEPARTMENTS are its Official BU list: each name is a process
   category, so a process files under the client's own department names.

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
import { clientSettings } from "@/ffp/lib/data/client-settings";

type RegRow = { key: string; name: string; email: string; active: boolean; title: string; reportsTo: string };

export async function readRegister(tenantId: string): Promise<RegRow[]> {
  return withTenant(tenantId, async (c) => {
    const r = await c.query(
      "SELECT key, COALESCE(NULLIF(name, ''), key) AS name, lower(trim(COALESCE(extra->>'email', ''))) AS email, " +
      "COALESCE(extra->>'active', 'true') <> 'false' AS active, trim(COALESCE(title, '')) AS title, " +
      "trim(COALESCE(extra->>'reportsTo', '')) AS \"reportsTo\" FROM people " +
      "WHERE COALESCE(extra->>'forefront', '') = '' ORDER BY idx, key");
    return (r.rows as any[]).map((x) => ({ key: String(x.key), name: String(x.name), email: String(x.email || ""), active: !!x.active, title: String(x.title || ""), reportsTo: String(x.reportsTo || "") }));
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
  updated += await syncJobTitles(workspaceId, reg);
  updated += await syncReportsTo(workspaceId, reg);
  return { created, updated };
}

/** The same job title however it is spaced or cased: "Head of Finance" and "head of finance " are one role. */
export const titleKey = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/* EACH TITLE ON THE REGISTER IS A ROLE; EACH PERSON HOLDS THEIR TITLE'S ROLE.
   A role is found by its name, made when no role carries the title, and
   brought back if it had been retired. A person's link to another TITLE's
   role is dropped (their title changed); a link to a role that is no title at
   all is left for the matching page to settle. Writes only where something
   differs, so a quiet load writes nothing. */
async function syncJobTitles(workspaceId: string, reg: RegRow[]): Promise<number> {
  /* Roles carry no unique name, so two loads at once (the tabs prefetch
     together) would each make the same new title: one at a time per client. */
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(420067, hashtext(${workspaceId}))`;
    const active = reg.filter((r) => r.active && r.title);
    let writes = 0;
    const roles = await tx.role.findMany({ where: { workspaceId }, select: { id: true, name: true, archivedAt: true } });
    const byKey = new Map<string, (typeof roles)[number]>();
    for (const r of roles) {
      const k = titleKey(r.name), had = byKey.get(k);
      if (!had || (had.archivedAt && !r.archivedAt)) byKey.set(k, r);
    }
    for (const title of new Set(active.map((r) => r.title))) {
      const k = titleKey(title), role = byKey.get(k);
      if (!role) {
        const made = await tx.role.create({ data: { workspaceId, name: title.trim().replace(/\s+/g, " ") }, select: { id: true, name: true, archivedAt: true } });
        byKey.set(k, made);
        writes++;
      } else if (role.archivedAt) {
        await tx.role.update({ where: { id: role.id }, data: { archivedAt: null } });
        role.archivedAt = null;
        writes++;
      }
    }
    const titleRoleIds = new Set([...new Set(active.map((r) => titleKey(r.title)))].map((k) => byKey.get(k)!.id));
    const people = await tx.person.findMany({
      where: { workspaceId, smpKey: { in: reg.map((r) => r.key) } },
      select: { id: true, smpKey: true, personRoles: { select: { roleId: true } } },
    });
    const titleOf = new Map(reg.map((r) => [r.key, r.active && r.title ? byKey.get(titleKey(r.title))!.id : null]));
    for (const p of people) {
      const want = titleOf.get(p.smpKey as string) ?? null;
      const have = p.personRoles.map((x) => x.roleId);
      if (want && !have.includes(want)) {
        await tx.personRole.create({ data: { personId: p.id, roleId: want } });
        writes++;
      }
      const stale = have.filter((id) => id !== want && titleRoleIds.has(id));
      if (stale.length) {
        await tx.personRole.deleteMany({ where: { personId: p.id, roleId: { in: stale } } });
        writes++;
      }
    }
    return writes;
  }, { timeout: 30000 });
}

/* WHO REPORTS TO WHOM IS THE REGISTER'S REPORTS TO (§655): a register key,
   turned into the manager's person row here. Somebody the register names as
   nobody's report has no manager. SMP already refuses a chain that loops;
   a key pointing at oneself, or at somebody not mirrored, reads as none.
   People added in Processes only (not on the register) keep theirs. */
async function syncReportsTo(workspaceId: string, reg: RegRow[]): Promise<number> {
  const people = await prisma.person.findMany({
    where: { workspaceId, smpKey: { not: null } },
    select: { id: true, smpKey: true, managerId: true, archivedAt: true },
  });
  const idOf = new Map(people.filter((p) => !p.archivedAt).map((p) => [p.smpKey as string, p.id]));
  const toOf = new Map(reg.map((r) => [r.key, r.reportsTo]));
  let writes = 0;
  for (const p of people) {
    if (!toOf.has(p.smpKey as string)) continue;
    const m = idOf.get(toOf.get(p.smpKey as string) || "") ?? null;
    const want = m && m !== p.id ? m : null;
    if (p.managerId !== want) {
      await prisma.person.update({ where: { id: p.id }, data: { managerId: want } });
      writes++;
    }
  }
  return writes;
}

/* THE CLIENT'S DEPARTMENTS ARE PROCESS CATEGORIES. Categories are kept per
   firm (one table for every client), so a department is found by its name
   there and made when missing; nothing is removed, because another client
   may file under the same name. Which names this client offers is decided
   where the list is shown (processes/page.tsx), from the Official BU list. */
export async function syncDepartments(workspaceId: string, names: string[]): Promise<void> {
  if (!names.length) return;
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { firmId: true } });
  if (!ws) return;
  const have = new Set((await prisma.processCategory.findMany({ where: { firmId: ws.firmId, name: { in: names } }, select: { name: true } })).map((c) => c.name));
  for (const name of names.filter((n) => !have.has(n)))
    await prisma.processCategory.create({ data: { firmId: ws.firmId, name } }).catch((e: any) => { if (e?.code !== "P2002") throw e; });
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
    const settings = await clientSettings(slug);
    if (settings) await syncDepartments(slug, settings.departments);
  } catch (e) {
    console.error("processes: register sync failed —", (e as Error).message);
  }
});
