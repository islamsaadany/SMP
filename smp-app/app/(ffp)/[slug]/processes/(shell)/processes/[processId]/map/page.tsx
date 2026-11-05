import { requireOffice } from "@/ffp/lib/auth/require-office";
import { officeSuggestions, stepName } from "@/ffp/lib/data/office-suggestions";
import { getLocale, getMessages } from "@/ffp/lib/i18n/server";
import { formatDate } from "@/ffp/lib/i18n/locale";
import { registerReady } from "@/ffp/lib/register-sync";
import { notFound } from "next/navigation";
import { prisma } from "@/ffp/lib/db/client";
import { deriveGapsByStep } from "@/ffp/lib/domain/step-readiness";
import { describeAuthorityRule } from "@/ffp/lib/domain/authority-table";
import { changedSteps, inForce, liveContent, sameContent } from "@/ffp/lib/data/process-content";
import { BulkAddStepsForm } from "./step-form";
import { MapEditor, type MapStep } from "./map-editor";
import { GenerateTemplateForm } from "../../template-form";
import { ProcessDocumentation } from "./process-documentation";
import { SopDocumentControl } from "./sop-document-control";
import type { Revision } from "@/ffp/lib/domain/sop";
import { getActiveReviewFindings } from "@/ffp/lib/data/review-findings-data";
import { AUTHORITY_ASSIGNMENT_INCLUDE, toAuthorityAssignmentData } from "@/ffp/lib/data/authority-assignments";

/* THE MAP (spec 067 §4.3): the process drawn as readers see it, one lane per
   job title, with a toolbar to add, connect and arrange steps, and beside it
   the picked step's form, which saves as you type: who does it, what they do,
   the RACI letters, its rules, its risks and controls, and under More its
   type, arrows, hand-overs, links and SOP detail. Below: steps from a pasted
   list, what the process is for, and its document control. */
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
      branchFromStep: { select: { id: true, label: true, processId: true, process: { select: { code: true } } } },
      steps: {
        include: {
          links: { select: { targetProcessId: true } },
          // Processes that pick up from this step — the other end of a branch.
          branchedProcesses: { where: { archivedAt: null }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!process || process.workspaceId !== workspaceId) notFound();

  const [roles, otherProcesses, connections, activities, authorityAssignments, controls, content, held] = await Promise.all([
    prisma.role.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.process.findMany({ where: { workspaceId, archivedAt: null, id: { not: processId } }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.stepConnection.findMany({ where: { processId }, orderBy: { id: "asc" } }),
    prisma.activity.findMany({ where: { processId }, include: { raciAssignments: true }, orderBy: { order: "asc" } }),
    prisma.authorityAssignment.findMany({ where: { processId }, include: AUTHORITY_ASSIGNMENT_INCLUDE }),
    prisma.processControl.findMany({ where: { processId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, stepId: true, risk: true, control: true } }),
    liveContent(processId),
    inForce(processId),
  ]);
  if (!content) notFound();

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
    select: { id: true, code: true, steps: { select: { id: true, label: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });
  const numberInOwnProcess = new Map<string, number>();
  for (const p of pickerProcesses) p.steps.forEach((st, i) => numberInOwnProcess.set(st.id, i + 1));
  const handoff = (h: (typeof handoffRows)[number], other: "from" | "to") => {
    const o = other === "from" ? h.fromStep : h.toStep;
    return { id: h.id, fromStepId: h.fromStepId, toStepId: h.toStepId, label: h.label, otherStepLabel: o.label, otherStepNumber: numberInOwnProcess.get(o.id) ?? 0, otherProcessId: o.processId, otherProcessCode: o.process.code };
  };
  const handoffsIn = handoffRows.filter((h) => ownStepIds.includes(h.toStepId)).map((h) => handoff(h, "from"));
  const handoffsOut = handoffRows.filter((h) => ownStepIds.includes(h.fromStepId)).map((h) => handoff(h, "to"));
  const handoffOptions = pickerProcesses.flatMap((p) => p.steps.map((st, i) => ({ id: st.id, label: st.label, number: i + 1, processId: p.id, processCode: p.code })));

  // Steps the AI review suggested that nobody has confirmed yet. They are not
  // part of the process (no step exists) — the map only shows them, dashed.
  const proposals = (await getActiveReviewFindings(processId))
    .filter((f) => f.proposal && f.status !== "INTEGRATED" && f.status !== "DISMISSED")
    .map((f) => ({ id: f.id, label: f.proposal!.label, notes: f.proposal!.notes, after: f.proposal!.afterStepId }));

  const authorityData = authorityAssignments.map(toAuthorityAssignmentData);
  // What each step still needs, through the very builders the RACI and
  // Authority pages use, so the mark here and the flag there never disagree.
  const gapsByStepId = deriveGapsByStep({
    steps: process.steps.map((s) => ({ id: s.id, type: s.type, label: s.label, raciSkipped: s.raciSkipped })),
    activities: activities.map((a) => ({ id: a.id, name: a.name, relatedStepId: a.relatedStepId, order: a.order, assignments: a.raciAssignments.map((x) => ({ roleId: x.roleId, code: x.code })) })),
    authorityAssignments: authorityData,
    incomingStepIds: new Set([...connections.map((c) => c.toStepId), ...handoffsIn.map((h) => h.toStepId)]),
  });

  /* who a rule lands on, by name */
  const personIds = [...new Set(authorityData.flatMap((a) => a.rules.map((r) => r.whoPersonId)).filter((x): x is string => !!x))];
  const people = personIds.length ? await prisma.person.findMany({ where: { id: { in: personIds } }, select: { id: true, name: true } }) : [];
  const who = new Map([...roles, ...people].map((x) => [x.id, x.name]));

  /* while a version is in force, the steps this draft changed carry a mark, as readers will see them */
  const changed = held && !sameContent(held.content, content) ? changedSteps(held.content, content) : new Set<string>();
  const drawn = new Map(content.steps.map((s) => [s.id, s]));
  const LETTER = { RESPONSIBLE: "R", ACCOUNTABLE: "A", CONSULTED: "C", INFORMED: "I" } as const;

  const steps: MapStep[] = process.steps.map((s) => {
    const d = drawn.get(s.id);
    const mine = activities.filter((a) => a.relatedStepId === s.id);
    /* the step's row in the RACI and Authority tables: its one activity, or the step itself; several activities each keep their own row there */
    const row = mine.length > 1 ? null : mine.length === 1 ? { id: mine[0].id, kind: "activity" as const } : { id: s.id, kind: "step" as const };
    const rules = row ? (authorityData.find((a) => (row.kind === "activity" ? a.activityId === row.id : a.stepId === row.id))?.rules ?? []) : [];
    const own = controls.filter((c) => c.stepId === s.id);
    return {
      id: s.id,
      type: s.type,
      n: d?.n ?? null,
      label: s.label,
      lane: d?.lane ?? "none",
      changed: changed.has(s.id),
      roleId: s.assignedRoleId,
      acts: s.detailedAction,
      milestone: s.milestone,
      joinRequiresAll: s.joinRequiresAll,
      reviewNote: s.reviewNotes,
      sop: { inputs: s.sopInputs ?? "", output: s.sopOutput ?? "", errors: s.sopErrors ?? "", risk: s.exceptionHandling ?? "" },
      links: s.links.map((l) => l.targetProcessId),
      branches: s.branchedProcesses,
      gaps: [...(gapsByStepId.get(s.id) ?? []), ...(own.some((c) => !c.control?.trim()) ? (["NO_CONTROL"] as const) : [])],
      raci: { activities: mine.length, letters: Object.fromEntries((mine.length === 1 ? mine[0].raciAssignments : []).map((x) => [x.roleId, LETTER[x.code]])) },
      rules: {
        row,
        list: [...rules].sort((a, b) => a.order - b.order).map((r) => ({ id: r.id, text: describeAuthorityRule(r, (r.whoPersonId && who.get(r.whoPersonId)) || (r.whoRoleId && who.get(r.whoRoleId)) || null) })),
      },
      controls: own.map((c) => ({ id: c.id, risk: c.risk, control: c.control })),
    };
  });

  /* the step this process picks up from, numbered as that process's own map numbers it */
  const from = process.branchFromStep;
  const branchFrom = from
    ? { processId: from.processId, code: from.process.code, label: from.label, n: (await prisma.processStep.findMany({ where: { processId: from.processId }, select: { id: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] })).findIndex((x) => x.id === from.id) + 1 }
    : null;

  /* a draft started from a suggestion: the person's words sit at the top (spec 067 §4.3) */
  const [drafting, msgs, locale] = await Promise.all([officeSuggestions(workspaceId, ["IN_DRAFT"], processId), getMessages(), getLocale()]);
  const bp = msgs.builder.page;

  return (
    <main className="w-full">
      {drafting.length > 0 && (
        <div className="mb-3 grid gap-1.5">
          {drafting.map((x) => (
            <div key={x.id} className="rounded-lg border border-[var(--gold)] bg-[var(--over-bg)] px-3 py-2.5 text-[13.5px] text-[var(--ink)]">
              <b>{bp.fromSuggestion(x.byName, stepName(x, msgs.reading.page.step))}</b> · {formatDate(x.createdAt, locale)}
              <span className="block">“{x.text}”</span>
              {x.why && <span className="block text-[12.5px] text-[var(--ink-3)]">{x.why}</span>}
              {x.answerText && <span className="block text-[12.5px] text-[var(--ink-3)]">{bp.officeAsked(x.answerText)}</span>}
              {x.replyText && <span className="block text-[12.5px]">{bp.theyReplied(x.byName, x.replyText)}</span>}
            </div>
          ))}
        </div>
      )}
      {process.steps.length === 0 && (
        <div className="mb-4 w-full">
          <GenerateTemplateForm workspaceId={workspaceId} intoProcess={{ id: processId, name: process.name }} />
        </div>
      )}
      <MapEditor
        workspaceId={workspaceId}
        processId={processId}
        processCode={process.code}
        steps={steps}
        lanes={content.lanes}
        arrows={connections.map((c) => ({ id: c.id, from: c.fromStepId, to: c.toStepId, label: c.label }))}
        proposals={proposals}
        branchFrom={branchFrom}
        roles={roles}
        otherProcesses={otherProcesses}
        handoffsIn={handoffsIn}
        handoffsOut={handoffsOut}
        handoffOptions={handoffOptions}
      />
      <div className="mt-4 w-full">
        <BulkAddStepsForm workspaceId={workspaceId} processId={processId} />
      </div>
      <div className="mt-6 w-full">
        <ProcessDocumentation
          workspaceId={workspaceId}
          processId={processId}
          processPurpose={process.processPurpose}
          inScope={process.inScope}
          outOfScope={process.outOfScope}
          externalEntities={process.externalEntities as unknown as { name: string; description: string }[]}
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
