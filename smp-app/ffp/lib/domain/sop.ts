/**
 * The SOP compile — a pure function over the same data the Export Report
 * reads, so the SOP and the report cannot disagree about a step, a role or an
 * approval. Anything the process has not said is `null`, which the page draws
 * as a red "Missing"; nothing is invented and nothing is recorded
 * automatically (document control and revisions are hand-kept free text).
 */

export type Revision = { version: string; date: string; by: string; change: string };

export type SopSource = {
  code: string;
  name: string;
  processPurpose: string | null;
  inScope: string[];
  outOfScope: string[];
  sopVersion: string | null;
  sopOwner: string | null;
  sopEffectiveDate: string | null;
  sopApprovedBy: string | null;
  sopRevisions: Revision[];
  kpis: { metric: string; target: string; frequency: string }[];
  steps: {
    id: string;
    type: "START" | "TASK" | "DECISION" | "END";
    label: string;
    detailedAction: string[];
    sopInputs: string | null;
    sopOutput: string | null;
    sopErrors: string | null;
    assignedRole: { name: string } | null;
    slaDays: number | null;
    links: { targetProcess: { code: string; name: string } }[];
  }[];
  connections: { fromStepId: string; toStepId: string; label: string | null }[];
  combinedRows: { label: string; approverLabel: string | null; requiresApproval: boolean }[];
  involvedRoles: { name: string }[];
  controlPoints: { statement: string }[];
};

export type SopStep = {
  number: number;
  label: string;
  type: "START" | "TASK" | "DECISION" | "END";
  who: string | null;
  how: string[];
  inputs: string | null;
  output: string | null;
  errors: string | null;
  /** Approval and time limit, e.g. "Approver: Finance Manager · within 2 days"; null when the step needs none. */
  approval: string | null;
  handoff: string | null;
  /** Which SOP detail cells are blank on a step that should carry them. */
  missing: ("who" | "how" | "inputs" | "output")[];
};

export type Sop = {
  code: string;
  name: string;
  control: { version: string | null; owner: string | null; effectiveDate: string | null; approvedBy: string | null };
  purpose: string | null;
  inScope: string[];
  outOfScope: string[];
  roles: string[];
  procedure: SopStep[];
  controls: string[];
  kpis: SopSource["kpis"];
  revisions: Revision[];
  /** Every blank the page will mark "Missing" — control fields, purpose, and step cells. */
  missingCount: number;
};

const blank = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export function compileSop(src: SopSource): Sop {
  const stepById = new Map(src.steps.map((s) => [s.id, s]));
  const usedRows = new Set<number>();

  const procedure: SopStep[] = src.steps.map((s, i) => {
    // Approval lives on the Authority row, which is keyed by the activity's
    // name; the first unused row with the step's own label is its row.
    const rowIdx = src.combinedRows.findIndex((r, idx) => !usedRows.has(idx) && r.label === s.label);
    if (rowIdx >= 0) usedRows.add(rowIdx);
    const row = rowIdx >= 0 ? src.combinedRows[rowIdx] : null;
    const parts: string[] = [];
    if (row?.requiresApproval && row.approverLabel) parts.push(`Approver: ${row.approverLabel}`);
    if (s.slaDays != null) parts.push(`within ${s.slaDays} day${s.slaDays === 1 ? "" : "s"}`);

    const outs = src.connections.filter((c) => c.fromStepId === s.id);
    const handoffParts = outs
      .map((c) => {
        const to = stepById.get(c.toStepId);
        if (!to) return null;
        const n = src.steps.findIndex((x) => x.id === to.id) + 1;
        return c.label ? `${c.label} → ${n}. ${to.label}` : `→ ${n}. ${to.label}`;
      })
      .filter((x): x is string => !!x);
    for (const l of s.links) handoffParts.push(`→ ${l.targetProcess.code} ${l.targetProcess.name}`);

    const isWork = s.type === "TASK" || s.type === "DECISION";
    const how = s.detailedAction.map((a) => a.trim()).filter(Boolean);
    const inputs = blank(s.sopInputs);
    const output = blank(s.sopOutput);
    const who = s.assignedRole?.name ?? null;
    const missing: SopStep["missing"] = [];
    if (isWork) {
      if (!who) missing.push("who");
      if (how.length === 0) missing.push("how");
      if (!inputs) missing.push("inputs");
      if (!output) missing.push("output");
    }
    return {
      number: i + 1,
      label: s.label,
      type: s.type,
      who,
      how,
      inputs,
      output,
      errors: blank(s.sopErrors),
      approval: parts.length ? parts.join(" · ") : null,
      handoff: handoffParts.length ? handoffParts.join("; ") : null,
      missing,
    };
  });

  const control = {
    version: blank(src.sopVersion),
    owner: blank(src.sopOwner),
    effectiveDate: blank(src.sopEffectiveDate),
    approvedBy: blank(src.sopApprovedBy),
  };
  const purpose = blank(src.processPurpose);

  const missingCount =
    Object.values(control).filter((v) => v === null).length +
    (purpose === null ? 1 : 0) +
    procedure.reduce((n, s) => n + s.missing.length, 0);

  return {
    code: src.code,
    name: src.name,
    control,
    purpose,
    inScope: src.inScope,
    outOfScope: src.outOfScope,
    roles: src.involvedRoles.map((r) => r.name),
    procedure,
    controls: src.controlPoints.map((c) => c.statement),
    kpis: src.kpis,
    revisions: src.sopRevisions,
    missingCount,
  };
}
