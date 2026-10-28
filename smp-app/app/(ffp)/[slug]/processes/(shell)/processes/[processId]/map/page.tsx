import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { deriveGapsByStep } from "@/ffp/lib/domain/step-readiness";
import { buildStepAuthoritySummary } from "@/ffp/lib/domain/step-authority-summary";
import { AddStepForm, BulkAddStepsForm } from "./step-form";
import { MapView } from "./map-view";
import { GenerateTemplateForm } from "../../template-form";
import { ProcessDocumentation } from "./process-documentation";
import { SopDocumentControl } from "./sop-document-control";
import type { Revision } from "@/ffp/lib/domain/sop";
import { getActiveReviewFindings } from "@/ffp/lib/data/review-findings-data";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

export default async function ProcessMapPage(
  props: PageProps<"/[slug]/processes/processes/[processId]/map">
) {
  const { slug: workspaceId, processId } = await props.params;
  // The office's own: nothing below runs, reads or sends for anybody else (see ffp/lib/auth/require-office.ts).
  await requireOffice(workspaceId);
  await registerReady(workspaceId);

  const process = await prisma.process.findUnique({
    where: { id: processId },
    include: {
      parentProcess: true,
      branchFromStep: {
        select: { id: true, label: true, processId: true, process: { select: { id: true, code: true } } },
      },
      steps: {
        include: {
          assignedRole: true,
          swimlaneRole: true,
          links: { include: { targetProcess: true } },
          // Processes that pick up from this step — the other end of a branch.
          branchedProcesses: { select: { id: true, code: true, name: true }, orderBy: { code: "asc" } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [roles, otherProcesses, connections, activities, authorityAssignments] = await Promise.all([
    prisma.role.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.process.findMany({
      where: { workspaceId, archivedAt: null, id: { not: processId } },
      orderBy: { code: "asc" },
    }),
    prisma.stepConnection.findMany({ where: { processId } }),
    // Enough of the RACI and Authority matrices to say what each step is still
    // missing, so the Steps List can show it without anyone opening either.
    prisma.activity.findMany({
      where: { processId },
      include: { raciAssignments: true },
      orderBy: { order: "asc" },
    }),
    prisma.authorityAssignment.findMany({ where: { processId }, include: AUTHORITY_ASSIGNMENT_INCLUDE }),
  ]);

  // Hand-overs with other processes' steps (StepHandoff): the ones that wait on
  // a step elsewhere (in) and the ones that continue into another process (out).
  // The other end's number comes from its own process's step order, so it
  // matches what that map shows.
  const ownStepIds = process.steps.map((s) => s.id);
  const handoffRows = await prisma.stepHandoff.findMany({
    where: { OR: [{ toStepId: { in: ownStepIds } }, { fromStepId: { in: ownStepIds } }] },
    include: {
      fromStep: { select: { id: true, label: true, processId: true, process: { select: { code: true } } } },
      toStep: { select: { id: true, label: true, processId: true, process: { select: { code: true } } } },
    },
  });
  const pickerProcesses = await prisma.process.findMany({
    where: { workspaceId, archivedAt: null, id: { not: processId } },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      steps: { select: { id: true, label: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });
  const numberInOwnProcess = new Map<string, number>();
  for (const p of pickerProcesses) p.steps.forEach((st, i) => numberInOwnProcess.set(st.id, i + 1));
  const stepNumberOf = (stepId: string) => numberInOwnProcess.get(stepId) ?? 0;
  const handoffsIn = handoffRows
    .filter((h) => ownStepIds.includes(h.toStepId))
    .map((h) => ({
      id: h.id,
      fromStepId: h.fromStepId,
      toStepId: h.toStepId,
      label: h.label,
      otherStepLabel: h.fromStep.label,
      otherStepNumber: stepNumberOf(h.fromStepId),
      otherProcessId: h.fromStep.processId,
      otherProcessCode: h.fromStep.process.code,
    }));
  const handoffsOut = handoffRows
    .filter((h) => ownStepIds.includes(h.fromStepId))
    .map((h) => ({
      id: h.id,
      fromStepId: h.fromStepId,
      toStepId: h.toStepId,
      label: h.label,
      otherStepLabel: h.toStep.label,
      otherStepNumber: stepNumberOf(h.toStepId),
      otherProcessId: h.toStep.processId,
      otherProcessCode: h.toStep.process.code,
    }));
  const handoffStepOptions = pickerProcesses.flatMap((p) =>
    p.steps.map((st, i) => ({ id: st.id, label: st.label, number: i + 1, processId: p.id, processCode: p.code }))
  );

  // Steps the AI review suggested that nobody has confirmed yet. They are not
  // part of the process (no step exists) — the map only shows them highlighted.
  const proposals = (await getActiveReviewFindings(processId))
    .filter((f) => f.proposal && f.status !== "INTEGRATED" && f.status !== "DISMISSED")
    .map((f) => ({
      findingId: f.id,
      label: f.proposal!.label,
      notes: f.proposal!.notes,
      afterStepId: f.proposal!.afterStepId,
    }));

  const externalEntities = process.externalEntities as unknown as { name: string; description: string }[];

  const activityData = activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    relatedStepId: activity.relatedStepId,
    order: activity.order,
    assignments: activity.raciAssignments.map((a) => ({ roleId: a.roleId, code: a.code })),
  }));

  const authorityData = authorityAssignments.map(toAuthorityAssignmentData);

  // What each step still needs — derived through the very builders and
  // validators the RACI and Authority pages use, so the chip in the list and
  // the flag on those pages can never disagree.
  const gapsByStepId = deriveGapsByStep({
    steps: process.steps.map((step) => ({
      id: step.id,
      type: step.type,
      label: step.label,
      raciSkipped: step.raciSkipped,
    })),
    activities: activityData,
    authorityAssignments: authorityData,
    incomingStepIds: new Set([...connections.map((c) => c.toStepId), ...handoffsIn.map((h) => h.toStepId)]),
  });

  // The SLA and approval threshold each step's card shows on the diagram —
  // the same Authority data the matrix page displays, read here by step
  // rather than by row (see lib/domain/step-authority-summary.ts).
  const authorityByStepId = buildStepAuthoritySummary(
    process.steps.map((step) => ({ id: step.id, type: step.type, label: step.label })),
    activityData,
    authorityData
  );

  // The step this process picks up from, if any. Its number comes from the
  // source process's own step order, so it matches what that map shows.
  let branchFrom: {
    stepId: string;
    stepLabel: string;
    stepNumber: number;
    sourceProcessId: string;
    sourceProcessCode: string;
  } | null = null;
  if (process.branchFromStep) {
    const sourceSteps = await prisma.processStep.findMany({
      where: { processId: process.branchFromStep.processId },
      select: { id: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    branchFrom = {
      stepId: process.branchFromStep.id,
      stepLabel: process.branchFromStep.label,
      stepNumber: sourceSteps.findIndex((s) => s.id === process.branchFromStep!.id) + 1,
      sourceProcessId: process.branchFromStep.process.id,
      sourceProcessCode: process.branchFromStep.process.code,
    };
  }

  return (
    <main className="w-full">
      {/* The flow first (spec 067 §4.3), then adding steps, then what the process is for and its document control. */}
      {process.steps.length === 0 && (
        <div className="mb-4 w-full">
          <GenerateTemplateForm workspaceId={workspaceId} intoProcess={{ id: processId, name: process.name }} />
        </div>
      )}
      <MapView
        workspaceId={workspaceId}
        processId={processId}
        processCode={process.code}
        steps={process.steps.map((s) => ({
          ...s,
          branches: s.branchedProcesses,
          gaps: gapsByStepId.get(s.id) ?? [],
          slaDays: authorityByStepId.get(s.id)?.slaDays ?? null,
          threshold: authorityByStepId.get(s.id)?.threshold ?? null,
          direction: authorityByStepId.get(s.id)?.direction,
        }))}
        connections={connections}
        roles={roles.map((r) => ({ id: r.id, name: r.name }))}
        branchFrom={branchFrom}
        handoffsIn={handoffsIn}
        handoffsOut={handoffsOut}
        handoffStepOptions={handoffStepOptions}
        otherProcesses={otherProcesses.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        proposals={proposals}
      />
      <div className="mt-4 flex w-full flex-col gap-3">
        <AddStepForm
          workspaceId={workspaceId}
          processId={processId}
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
          steps={process.steps.map((s) => ({ id: s.id, label: s.label, type: s.type }))}
          otherProcesses={otherProcesses.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
        />
        <BulkAddStepsForm workspaceId={workspaceId} processId={processId} />
      </div>
      <div className="mt-6 w-full">
      <ProcessDocumentation
        workspaceId={workspaceId}
        processId={processId}
        processPurpose={process.processPurpose}
        inScope={process.inScope}
        outOfScope={process.outOfScope}
        externalEntities={externalEntities}
      />
      <SopDocumentControl
        workspaceId={workspaceId}
        processId={processId}
        sopVersion={process.sopVersion}
        sopOwner={process.sopOwner}
        sopEffectiveDate={process.sopEffectiveDate}
        sopApprovedBy={process.sopApprovedBy}
        revisions={process.sopRevisions as unknown as Revision[]}
      />
      </div>
    </main>
  );
}
