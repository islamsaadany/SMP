/**
 * Pure, framework-free access-control rules — no Prisma/session imports here so
 * these stay unit-testable without a database (Constitution Principle III).
 */

export type AccessLevel = "VIEWER" | "EDITOR" | "ADMIN";

const LEVEL_RANK: Record<AccessLevel, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
};

export function hasSufficientAccess(actual: AccessLevel, required: AccessLevel): boolean {
  return LEVEL_RANK[actual] >= LEVEL_RANK[required];
}

/**
 * Who may change a workspace's own profile and branding: its industry and
 * background notes, its logo and colours. Ordinary engagement upkeep, so Admin
 * rather than Firm Owner. ONE VALUE, read by the two server actions that save
 * these (organization.ts) and by the two cards that offer Edit
 * (workspace-access.tsx useCanKeepUpWorkspace). The cards used to ask whether
 * the viewer could edit content (Editor) while the saves asked for Admin, so an
 * Editor was offered a form the server then refused.
 */
export const WORKSPACE_UPKEEP_LEVEL: AccessLevel = "ADMIN";

export function mayKeepUpWorkspace(actual: AccessLevel): boolean {
  return hasSufficientAccess(actual, WORKSPACE_UPKEEP_LEVEL);
}

/** FR-016: a Workspace must always retain at least one active Admin. */
export function canChangeLastAdmin(activeAdminCount: number): boolean {
  return activeAdminCount > 1;
}

/** FR-026: the Firm must always retain at least one Firm Owner. */
export function canChangeLastFirmOwner(activeOwnerCount: number): boolean {
  return activeOwnerCount > 1;
}
