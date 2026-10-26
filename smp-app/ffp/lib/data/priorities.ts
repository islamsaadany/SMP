import "server-only";
import { prisma } from "@/ffp/lib/db/client";
import { planUnits } from "@/ffp/lib/domain/priority-units";
import {
  DEFAULT_WEIGHTS,
  deepDiveProgress,
  rankProcesses,
  suggestComplexity,
  suggestRisk,
  stepSignals,
  suggestStepComplexity,
  suggestStepRisk,
  weightedScore,
  type Decision,
  type PlanStatus,
  type ScoreFacts,
  type StepFacts,
  type StepSignal,
  type Weights,
} from "@/ffp/lib/domain/priorities";

export type PlanView = {
  id: string | null;
  weights: Weights;
  capacity: number;
  wave1Label: string;
  wave2Label: string;
  laterLabel: string;
  status: PlanStatus;
  approverPersonId: string | null;
  approverName: string | null;
  approverRole: string | null;
  sentAt: Date | null;
  sentByName: string | null;
  sentByEmail: string | null;
  returnReason: string | null;
  approvedAt: Date | null;
  approvedByName: string | null;
  approvedByRole: string | null;
  history: { at: string; by: string; what: string; reason?: string }[];
  /** What was sent to the client, frozen. Null until it is sent. */
  snapshot: PlanSnapshot | null;
};

/** A step inside a process that the office flagged, or that the map says is worth a look. */
export type StepRow = {
  id: string;
  label: string;
  order: number;
  flagged: boolean;
  /** Nothing stands out on the map and it is not flagged; shown only when asked for. */
  quiet: boolean;
  /** The step's own wave; empty means it goes with its process. */
  decision: Decision | null;
  importance: number | null;
  complexity: number | null;
  risk: number | null;
  why: string | null;
  score: number | null;
  signals: StepSignal[];
  suggestedComplexity: { score: number; reason: string } | null;
  suggestedRisk: { score: number; reason: string } | null;
  /** Processes already branching from this step: it has been made into its own process. */
  nowProcesses: { id: string; code: string; name: string }[];
};

export type PriorityRow = {
  id: string;
  code: string;
  name: string;
  department: string | null;
  /** The main process this one sits under, when it is a sub-process. */
  parentId: string | null;
  importance: number | null;
  complexity: number | null;
  risk: number | null;
  why: string | null;
  decision: Decision | null;
  score: number | null;
  rank: number | null;
  suggestedComplexity: { score: number; reason: string } | null;
  suggestedRisk: { score: number; reason: string } | null;
  progress: { done: number; total: number; aspects: { label: string; help: string; done: boolean }[] };
  lifecycleStatus: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
  /** Every step in map order; the quiet ones are marked. */
  steps: StepRow[];
  /** How many of them are quiet. */
  otherSteps: number;
};

const DEFAULT_PLAN: PlanView = {
  id: null,
  weights: DEFAULT_WEIGHTS,
  capacity: 4,
  wave1Label: "Start now",
  wave2Label: "Next",
  laterLabel: "Review later",
  status: "DRAFT",
  approverPersonId: null,
  approverName: null,
  approverRole: null,
  sentAt: null,
  sentByName: null,
  sentByEmail: null,
  returnReason: null,
  approvedAt: null,
  approvedByName: null,
  approvedByRole: null,
  history: [],
  snapshot: null,
};

export async function loadPlan(workspaceId: string): Promise<PlanView> {
  const p = await prisma.priorityPlan.findUnique({ where: { workspaceId } });
  if (!p) return DEFAULT_PLAN;
  return {
    id: p.id,
    weights: { importance: p.weightImportance, risk: p.weightRisk, complexity: p.weightComplexity },
    capacity: p.capacity,
    wave1Label: p.wave1Label,
    wave2Label: p.wave2Label,
    laterLabel: p.laterLabel,
    status: p.status,
    approverPersonId: p.approverPersonId,
    approverName: p.approverName,
    approverRole: p.approverRole,
    sentAt: p.sentAt,
    sentByName: p.sentByName,
    sentByEmail: p.sentByEmail,
    returnReason: p.returnReason,
    approvedAt: p.approvedAt,
    approvedByName: p.approvedByName,
    approvedByRole: p.approvedByRole,
    history: (p.history as unknown as PlanView["history"]) ?? [],
    snapshot: (p.snapshot as unknown as PlanSnapshot | null) ?? null,
  };
}

/** Every process in the workspace with its scores, rank, starting suggestions and how far its deep dive has got. Ranked rows first. */
export async function loadPriorityRows(workspaceId: string, weights: Weights): Promise<PriorityRow[]> {
  const where = { workspaceId, archivedAt: null };
  const [processes, steps, controls, authority] = await Promise.all([
    prisma.process.findMany({
      where,
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        parentProcessId: true,
        category: { select: { name: true } },
        priorityImportance: true,
        priorityComplexity: true,
        priorityRisk: true,
        priorityWhy: true,
        deepDiveDecision: true,
        sopVersion: true,
        lifecycleStatus: true,
        raciMatrixStatus: { select: { status: true } },
      },
    }),
    prisma.processStep.findMany({
      where: { process: where },
      orderBy: { order: "asc" },
      select: {
        id: true,
        processId: true,
        label: true,
        order: true,
        type: true,
        assignedRoleId: true,
        priorityFlagged: true,
        priorityImportance: true,
        priorityComplexity: true,
        priorityRisk: true,
        priorityWhy: true,
        deepDiveDecision: true,
        exceptionHandling: true,
        detailedAction: true,
        _count: { select: { links: true, handoffsOut: true, handoffsIn: true, supportingRoles: true, activities: true } },
        links: { select: { targetProcess: { select: { name: true, archivedAt: true } } } },
        handoffsOut: { select: { toStep: { select: { process: { select: { name: true } } } } } },
        handoffsIn: { select: { fromStep: { select: { process: { select: { name: true } } } } } },
        branchedProcesses: { where: { archivedAt: null }, select: { id: true, code: true, name: true } },
      },
    }),
    prisma.processControl.findMany({ where: { process: where }, select: { processId: true, stepId: true, riskLevel: true, control: true } }),
    prisma.authorityAssignment.groupBy({ by: ["processId"], where: { process: where }, _count: { _all: true } }),
  ]);

  const facts = new Map<string, ScoreFacts & { controlsLogged: number }>();
  const get = (id: string) => {
    let f = facts.get(id);
    if (!f) facts.set(id, (f = { steps: 0, decisions: 0, crossProcess: 0, roles: 0, risksHigh: 0, risksMedium: 0, risksLow: 0, controlsLogged: 0 }));
    return f;
  };
  const roleSets = new Map<string, Set<string>>();
  for (const s of steps) {
    const f = get(s.processId);
    f.steps++;
    if (s.type === "DECISION") f.decisions++;
    f.crossProcess += s._count.links + s._count.handoffsOut + s._count.handoffsIn;
    if (s.assignedRoleId) (roleSets.get(s.processId) ?? roleSets.set(s.processId, new Set()).get(s.processId)!).add(s.assignedRoleId);
  }
  for (const [id, set] of roleSets) get(id).roles = set.size;
  for (const c of controls) {
    const f = get(c.processId);
    if (c.riskLevel === "high") f.risksHigh++;
    else if (c.riskLevel === "medium") f.risksMedium++;
    else f.risksLow++;
    if (c.control && c.control.trim()) f.controlsLogged++;
  }
  const controlsByStep = new Map<string, { high: number; medium: number; low: number }>();
  for (const c of controls) {
    if (!c.stepId) continue;
    const x = controlsByStep.get(c.stepId) ?? controlsByStep.set(c.stepId, { high: 0, medium: 0, low: 0 }).get(c.stepId)!;
    if (c.riskLevel === "high") x.high++;
    else if (c.riskLevel === "medium") x.medium++;
    else x.low++;
  }
  const stepRowsBy = new Map<string, StepRow[]>();
  const otherStepsBy = new Map<string, number>();
  for (const st of steps) {
    const cs = controlsByStep.get(st.id) ?? { high: 0, medium: 0, low: 0 };
    const others = new Set<string>([
      ...st.links.filter((l) => !l.targetProcess.archivedAt).map((l) => l.targetProcess.name),
      ...st.handoffsOut.map((h) => h.toStep.process.name),
      ...st.handoffsIn.map((h) => h.fromStep.process.name),
    ]);
    const sf: StepFacts = {
      decision: st.type === "DECISION",
      controlsHigh: cs.high,
      controlsMedium: cs.medium,
      controlsLow: cs.low,
      handoverTo: [...others],
      roles: (st.assignedRoleId ? 1 : 0) + st._count.supportingRoles,
      subtasks: st._count.activities,
      riskNoted: !!(st.exceptionHandling && st.exceptionHandling.trim()),
      instructions: st.detailedAction.filter((l) => l.trim()).length,
    };
    const signals = stepSignals(sf);
    const quiet = !st.priorityFlagged && signals.length === 0 && st.branchedProcesses.length === 0;
    if (quiet) otherStepsBy.set(st.processId, (otherStepsBy.get(st.processId) ?? 0) + 1);
    (stepRowsBy.get(st.processId) ?? stepRowsBy.set(st.processId, []).get(st.processId)!).push({
      id: st.id,
      label: st.label,
      order: st.order,
      flagged: st.priorityFlagged,
      quiet,
      decision: st.deepDiveDecision as Decision | null,
      importance: st.priorityImportance,
      complexity: st.priorityComplexity,
      risk: st.priorityRisk,
      why: st.priorityWhy,
      score: st.priorityFlagged ? weightedScore(weights, { importance: st.priorityImportance, complexity: st.priorityComplexity, risk: st.priorityRisk }) : null,
      signals,
      suggestedComplexity: suggestStepComplexity(sf),
      suggestedRisk: suggestStepRisk(sf),
      nowProcesses: st.branchedProcesses,
    });
  }
  const authorityBy = new Map(authority.map((a) => [a.processId, a._count._all]));

  const base = processes.map((p) => {
    const f = get(p.id);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      department: p.category?.name ?? null,
      parentId: p.parentProcessId,
      importance: p.priorityImportance,
      complexity: p.priorityComplexity,
      risk: p.priorityRisk,
      why: p.priorityWhy,
      decision: p.deepDiveDecision as Decision | null,
      suggestedComplexity: suggestComplexity(f),
      suggestedRisk: suggestRisk(f),
      progress: deepDiveProgress({
        steps: f.steps,
        raciFinal: p.raciMatrixStatus?.status === "FINAL",
        authorityAssigned: authorityBy.get(p.id) ?? 0,
        controlsLogged: f.controlsLogged,
        sopVersion: p.sopVersion,
        lifecycleStatus: p.lifecycleStatus,
      }),
      lifecycleStatus: p.lifecycleStatus,
      steps: stepRowsBy.get(p.id) ?? [],
      otherSteps: otherStepsBy.get(p.id) ?? 0,
    };
  });
  return rankProcesses(base, weights).map(({ item, score, rank }) => ({ ...item, score, rank }));
}

export type PlanSnapshot = {
  weights: Weights;
  capacity: number;
  labels: { WAVE_1: string; WAVE_2: string; LATER: string };
  total: number;
  rows: {
    id: string;
    code: string;
    name: string;
    /** For a flagged step taken deep on its own: the process it is a step of. */
    inProcess?: string | null;
    department: string | null;
    importance: number | null;
    complexity: number | null;
    risk: number | null;
    score: number | null;
    rank: number | null;
    why: string | null;
    decision: Decision | null;
  }[];
};

/** What the client is shown and signs: the weights, the capacity, and every ranked or decided process as it stands. One builder, so the preview and what is sent cannot differ. */
export function buildSnapshot(plan: PlanView, rows: PriorityRow[]): PlanSnapshot {
  return {
    weights: plan.weights,
    capacity: plan.capacity,
    labels: { WAVE_1: plan.wave1Label, WAVE_2: plan.wave2Label, LATER: plan.laterLabel },
    total: rows.length,
    rows: planUnits(rows)
      .filter((u) => u.rank != null || u.decision != null || u.kind === "step")
      .map((u) => ({ id: u.id, code: u.code, name: u.name, inProcess: u.inProcess, department: u.department, importance: u.importance, complexity: u.complexity, risk: u.risk, score: u.score, rank: u.rank, why: u.why, decision: u.decision })),
  };
}
