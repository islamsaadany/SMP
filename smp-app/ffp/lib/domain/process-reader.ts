/**
 * Who may open the staff reader view, and who still owes an acknowledgement.
 * Pure: no DB, no session. The reader pages are the ONLY part of Processes a
 * client's own person may open; everything else stays the office's.
 */

/** The office, or a client's own person who holds a row on the People register. */
export function mayRead(args: {
  office: boolean;
  userKind: "client" | "consultant" | string;
  personKey: string | null | undefined;
}): boolean {
  if (args.office) return true;
  return args.userKind === "client" && !!(args.personKey ?? "").trim();
}

export type Expected = { personKey: string; name: string };

/**
 * Who is expected to acknowledge a process: people holding a role that one of
 * its steps is assigned to. A process with no assigned role expects nobody —
 * it does not fall back to "everyone".
 */
export function expectedAcknowledgers(args: {
  stepRoleIds: readonly (string | null)[];
  people: readonly { personKey: string | null; name: string; roleIds: readonly string[] }[];
}): Expected[] {
  const used = new Set(args.stepRoleIds.filter((r): r is string => !!r));
  if (used.size === 0) return [];
  const out: Expected[] = [];
  for (const p of args.people) {
    if (!p.personKey) continue;
    if (p.roleIds.some((r) => used.has(r))) out.push({ personKey: p.personKey, name: p.name });
  }
  return out;
}

export function acknowledgementProgress(expected: readonly Expected[], ackedKeys: ReadonlySet<string>) {
  const outstanding = expected.filter((e) => !ackedKeys.has(e.personKey));
  return { total: expected.length, done: expected.length - outstanding.length, outstanding };
}
