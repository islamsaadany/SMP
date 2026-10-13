/**
 * Builds the unified RACI table's rows, in Process Map order: a step with
 * one or more linked Activities becomes one row per Activity (a step can be
 * split into several finer-grained RACI lines); a step with none becomes a
 * single empty, assignable row of its own. Any freestanding Activity that
 * isn't tied to a step at all is appended after. Pure and framework-free
 * (Constitution Principle III).
 */

export type RaciCode = "RESPONSIBLE" | "ACCOUNTABLE" | "CONSULTED" | "INFORMED";
export type StepType = "START" | "TASK" | "DECISION" | "END";

export type TableStep = { id: string; type: StepType; label: string; raciSkipped: boolean };
export type TableActivity = {
  id: string;
  name: string;
  relatedStepId: string | null;
  order: number;
  assignments: { roleId: string; code: RaciCode }[];
};

export type RaciTableRow = {
  id: string; // the Activity's id if one exists for this row, otherwise the Step's id
  kind: "activity" | "step"; // "step" rows (skippable, empty) are the only ones with no Activity yet
  stepId: string | null; // the Process Map step this row came from, if any (set for both kinds)
  stepType: StepType | null;
  label: string;
  skipped: boolean;
  assignments: Record<string, RaciCode>;
};

export function buildRaciTableRows(steps: TableStep[], activities: TableActivity[]): RaciTableRow[] {
  // A step can have more than one Activity linked to it (e.g. one Process
  // Map step split into several finer-grained RACI lines) — keep all of
  // them, not just the last one seen.
  const activitiesByStepId = new Map<string, TableActivity[]>();
  const freestanding: TableActivity[] = [];
  for (const a of activities) {
    if (a.relatedStepId) {
      const list = activitiesByStepId.get(a.relatedStepId) ?? [];
      list.push(a);
      activitiesByStepId.set(a.relatedStepId, list);
    } else {
      freestanding.push(a);
    }
  }

  function toRow(activity: TableActivity, step: TableStep | null): RaciTableRow {
    return {
      id: activity.id,
      kind: "activity",
      stepId: step?.id ?? null,
      stepType: step?.type ?? null,
      label: activity.name,
      skipped: false,
      assignments: Object.fromEntries(activity.assignments.map((a) => [a.roleId, a.code])),
    };
  }

  const stepRows: RaciTableRow[] = steps.flatMap((step) => {
    const linked = activitiesByStepId.get(step.id);
    if (linked && linked.length > 0) {
      return [...linked].sort((a, b) => a.order - b.order).map((activity) => toRow(activity, step));
    }
    return [
      {
        id: step.id,
        kind: "step" as const,
        stepId: step.id,
        stepType: step.type,
        label: step.label,
        skipped: step.raciSkipped,
        assignments: {},
      },
    ];
  });

  const freestandingRows: RaciTableRow[] = freestanding
    .sort((a, b) => a.order - b.order)
    .map((activity) => toRow(activity, null));

  return [...stepRows, ...freestandingRows];
}

/**
 * Which Role columns the RACI table should actually show. A workspace can
 * have far more Roles than any single process needs (e.g. every section head
 * across a whole plant), so the table defaults to only the Roles already in
 * use here — anything with at least one RACI assignment among these rows, or
 * mentioned as a step's owner or supporting department on the Process Map or
 * Value Chain board (mentionedRoleIds) — plus whatever's been explicitly
 * pinned via "+ Add title" (pinnedRoleIds, Process.raciVisibleRoleIds).
 *
 * mentionedRoleIds matters because a process built from the Value Chain
 * board gets its steps' owner and supporting Roles for free — from each
 * Activity's Owner/Supporting Departments — before anyone has clicked a
 * single RACI cell. Without it, a freshly-built process has zero used Roles
 * and zero pins, which used to hit the "never-touched matrix" fallback below
 * and show every workspace Role instead of the handful this process
 * actually involves.
 *
 * The fallback to every workspace Role is now for the genuinely empty case
 * only — a process with no steps yet, or steps with no owner assigned at
 * all — so the table is still never columnless.
 */
export function computeVisibleRoleIds(
  allRoleIds: string[],
  rows: RaciTableRow[],
  pinnedRoleIds: string[],
  mentionedRoleIds: string[] = []
): string[] {
  const usedRoleIds = new Set<string>();
  for (const row of rows) {
    for (const roleId of Object.keys(row.assignments)) usedRoleIds.add(roleId);
  }
  for (const roleId of mentionedRoleIds) usedRoleIds.add(roleId);

  const visible = new Set([...usedRoleIds, ...pinnedRoleIds]);
  if (visible.size === 0) return allRoleIds;
  return allRoleIds.filter((id) => visible.has(id));
}

/**
 * Per step: the Role that owns it (the step's assigned Role) and the Role its
 * owner's manager usually holds. Built on the server from the Org Directory.
 */
export type StepOwners = Record<string, { ownerRoleId: string | null; managerRoleId: string | null }>;

export type PlannedCell = { row: RaciTableRow; roleId: string; code: RaciCode };

/**
 * "Fill from step owners": R for each step's assigned Role, on every row of
 * that step. Empty cells only — a cell that already holds any code is left
 * alone — and skipped rows are never touched.
 */
export function planOwnerFill(rows: RaciTableRow[], owners: StepOwners): PlannedCell[] {
  const out: PlannedCell[] = [];
  for (const row of rows) {
    if (row.skipped || !row.stepId) continue;
    const ownerRoleId = owners[row.stepId]?.ownerRoleId;
    if (!ownerRoleId || row.assignments[ownerRoleId]) continue;
    out.push({ row, roleId: ownerRoleId, code: "RESPONSIBLE" });
  }
  return out;
}

/**
 * Suggestions: the owner's manager's Role as A, only on a row that has no A
 * yet, only into an empty cell, and only into a column that is on show.
 * Nothing here is saved — the person accepts, edits or dismisses each one.
 */
export function planSuggestions(
  rows: RaciTableRow[],
  owners: StepOwners,
  visibleRoleIds: string[]
): PlannedCell[] {
  const out: PlannedCell[] = [];
  for (const row of rows) {
    if (row.skipped || !row.stepId) continue;
    if (Object.values(row.assignments).includes("ACCOUNTABLE")) continue;
    const managerRoleId = owners[row.stepId]?.managerRoleId;
    if (!managerRoleId || !visibleRoleIds.includes(managerRoleId)) continue;
    if (row.assignments[managerRoleId]) continue;
    out.push({ row, roleId: managerRoleId, code: "ACCOUNTABLE" });
  }
  return out;
}
