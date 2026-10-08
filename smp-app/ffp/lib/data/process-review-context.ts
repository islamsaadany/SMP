import "server-only";
import { prisma } from "@/ffp/lib/db/client";
import { validateRaciMatrix } from "@/ffp/lib/domain/raci-validation";
import {
  additionalApprovals,
  buildAuthorityTableRows,
  validateAuthorityTable,
  DIRECTION_LABELS,
  requiresApproval,
} from "@/ffp/lib/domain/authority-table";
import { findStructuralGaps, type ProcessReviewContext } from "@/ffp/lib/domain/process-review";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

/**
 * Gathers one process's Map, RACI and Authority data into the context the AI
 * review reads. Shared by the single-process AI Review and the pre-export
 * check, so the two can never be shown different facts about one process.
 */
export async function loadProcessReviewContext(
  workspace: { id: string; name: string; industry: string | null },
  process: { id: string; code: string; name: string; description: string | null }
): Promise<ProcessReviewContext> {
  const processId = process.id;
  const [steps, connections, activities, matrixStatus, roles, people, authorityAssignments] = await Promise.all([
    prisma.processStep.findMany({
      where: { processId },
      include: { assignedRole: true, swimlaneRole: true, links: { include: { targetProcess: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.stepConnection.findMany({ where: { processId } }),
    prisma.activity.findMany({
      where: { processId },
      include: { raciAssignments: { include: { role: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.raciMatrixStatus.findUnique({ where: { processId } }),
    prisma.role.findMany({ where: { workspaceId: workspace.id } }),
    prisma.person.findMany({ where: { workspaceId: workspace.id } }),
    prisma.authorityAssignment.findMany({ where: { processId }, include: AUTHORITY_ASSIGNMENT_INCLUDE }),
  ]);

  const stepLabelById = new Map(steps.map((s) => [s.id, s.label]));

  const raciIssues = validateRaciMatrix(
    activities.map((a) => ({
      activityId: a.id,
      name: a.name,
      assignments: a.raciAssignments.map((ra) => ({ roleId: ra.roleId, code: ra.code })),
    }))
  );

  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
  const personNameById = new Map(people.map((p) => [p.id, p.name]));
  const authorityRows = buildAuthorityTableRows(
    steps.map((s) => ({ id: s.id, type: s.type, label: s.label })),
    activities.map((a) => ({ id: a.id, name: a.name, relatedStepId: a.relatedStepId, order: a.order })),
    authorityAssignments.map(toAuthorityAssignmentData)
  );
  const authorityIssues = validateAuthorityTable(authorityRows);

  return {
    workspaceName: workspace.name,
    workspaceIndustry: workspace.industry,
    processCode: process.code,
    processName: process.name,
    processDescription: process.description,
    steps: steps.map((s) => ({
      type: s.type,
      label: s.label,
      assignedRoleName: s.assignedRole?.name ?? null,
      swimlaneRoleName: s.swimlaneRole?.name ?? null,
      linkedProcessCodes: s.links.map((l) => l.targetProcess.code),
    })),
    connections: connections.map((c) => ({
      fromLabel: stepLabelById.get(c.fromStepId) ?? c.fromStepId,
      toLabel: stepLabelById.get(c.toStepId) ?? c.toStepId,
      connectionLabel: c.label,
    })),
    raci: {
      matrixStatus: matrixStatus?.status ?? "DRAFT",
      activities: activities.map((a) => ({
        id: a.id,
        name: a.name,
        assignments: a.raciAssignments.map((ra) => ({ roleName: ra.role.name, code: ra.code })),
      })),
      issues: raciIssues,
    },
    authority: {
      rows: authorityRows.map((r) => ({
        rowId: r.id,
        label: r.label,
        skipped: r.skipped,
        slaDays: r.slaDays,
        threshold: r.threshold,
        directionLabel: DIRECTION_LABELS[r.direction].label,
        requiresApproval: requiresApproval(r.direction),
        approverLabel: r.approverRoleId
          ? (roleNameById.get(r.approverRoleId) ?? null)
          : r.approverPersonId
            ? (personNameById.get(r.approverPersonId) ?? null)
            : null,
        extraApprovals: additionalApprovals(r.rules).map((rule) => ({
          amount: rule.amount,
          label: rule.whoRoleId ? (roleNameById.get(rule.whoRoleId) ?? null) : null,
        })),
        escalationLabel: r.escalationRoleId ? (roleNameById.get(r.escalationRoleId) ?? null) : null,
      })),
      issues: authorityIssues,
    },
    structuralGaps: findStructuralGaps(
      steps.map((s) => ({ id: s.id, type: s.type, label: s.label })),
      connections.map((c) => ({ fromStepId: c.fromStepId, toStepId: c.toStepId }))
    ),
  };
}
