import "server-only";
import { prisma } from "@/ffp/lib/db/client";

/** A person from this workspace's People register, with their role(s) as they stand today. */
export async function registerPerson(workspaceId: string, personId: string) {
  const person = await prisma.person.findFirst({
    where: { id: personId, workspaceId, archivedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      smpKey: true,
      personRoles: { select: { role: { select: { name: true, archivedAt: true } } } },
    },
  });
  if (!person) return null;
  const roles = person.personRoles.filter((r) => !r.role.archivedAt).map((r) => r.role.name);
  return { id: person.id, name: person.name, email: person.email, smpKey: person.smpKey, role: roles.length ? roles.join(", ") : null };
}
