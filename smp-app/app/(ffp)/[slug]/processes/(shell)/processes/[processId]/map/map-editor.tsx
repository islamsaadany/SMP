"use client";

/* The Map's editor (spec 067 §4.3; the approved prototype's Map): the toolbar,
   the lane drawing readers see (../../../../lane-drawing.tsx) with a red mark
   on every gap and the AI review's proposals dashed in gold, and beside it the
   picked step's form (step-panel.tsx). Every press saves at once and the page
   refreshes, so the drawing, the band's counts and the form move together. */
import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMessages } from "@/ffp/lib/i18n/client";
import { addProcessStep, arrangeProcessStepsByFlow, createStepConnection } from "@/ffp/lib/actions/process";
import { confirmProposedStep, deleteProposedStep } from "@/ffp/lib/actions/ai-review";
import type { StepGap } from "@/ffp/lib/domain/step-readiness";
import { useCanEdit } from "../../../workspace-access";
import { LaneDrawing, type DrawArrow, type DrawStep } from "../../../../lane-drawing";
import { Modal } from "../../../../read/dialogs";
import { StepPanel } from "./step-panel";
import type { HandoffStepOption, HandoffT } from "./handoff-types";

export type MapStep = DrawStep & {
  roleId: string | null;
  acts: string[];
  milestone: boolean;
  joinRequiresAll: boolean;
  reviewNote: string | null;
  sop: { inputs: string; output: string; errors: string; risk: string };
  links: string[];
  branches: { id: string; code: string; name: string }[];
  gaps: (StepGap | "NO_CONTROL")[];
  raci: { activities: number; letters: Record<string, "R" | "A" | "C" | "I"> };
  rules: { row: { id: string; kind: "activity" | "step" } | null; list: { id: string; text: string }[] };
  controls: { id: string; risk: string; control: string | null }[];
};
export type MapArrow = { id: string; from: string; to: string; label: string | null };
export type Proposal = { id: string; label: string; notes: string | null; after: string | null };
type Res = { ok: boolean; error?: string; message?: string };
export type Run = <T extends Res>(fn: () => Promise<T>) => Promise<T>;

export const field = "w-full rounded-md border border-[var(--field-line)] bg-white px-2.5 py-1.5 text-[13px] text-[var(--ink)] disabled:bg-[var(--zebra)]";
export const lbl = "grid gap-1 text-[12px] font-semibold text-[var(--ink-2)]";
export const btn = "rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[var(--ink)] hover:border-[var(--gold)] disabled:opacity-50";
export const btnGold = "rounded-md border border-[var(--gold)] bg-[var(--gold)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--on-accent)] disabled:opacity-50";

export function MapEditor({
  workspaceId,
  processId,
  processCode,
  steps,
  lanes,
  arrows,
  proposals,
  branchFrom,
  roles,
  otherProcesses,
  handoffsIn,
  handoffsOut,
  handoffOptions,
}: {
  workspaceId: string;
  processId: string;
  processCode: string;
  steps: MapStep[];
  lanes: { key: string; name: string | null }[];
  arrows: MapArrow[];
  proposals: Proposal[];
  branchFrom: { processId: string; code: string; label: string; n: number } | null;
  roles: { id: string; name: string }[];
  otherProcesses: { id: string; code: string; name: string }[];
  handoffsIn: HandoffT[];
  handoffsOut: HandoffT[];
  handoffOptions: HandoffStepOption[];
}) {
  const all = useMessages();
  const m = all.builder.map;
  const canEdit = useCanEdit();
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(steps.find((s) => s.n)?.id ?? steps[0]?.id ?? null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  /* "Saved" once the drawing shows the change, not only once the server has it */
  const [refreshing, startRefresh] = useTransition();

  const run: Run = useCallback(
    async (fn) => {
      setBusy((b) => b + 1);
      setErr(null);
      try {
        const r = await fn();
        if (!r.ok) setErr(r.error === "VALIDATION_ERROR" && r.message ? r.message : m.failed);
        else startRefresh(() => router.refresh());
        return r;
      } finally {
        setBusy((b) => b - 1);
      }
    },
    [router, m.failed]
  );

  /* the drawing: each proposal sits after the step the review placed it after, dashed, with a dashed arrow from that step */
  const gapText = (s: MapStep) => (s.gaps.length ? s.gaps.map((g) => m.gap[g]).join(" · ") : null);
  const placed = new Set<string>();
  const drawn: DrawStep[] = [];
  const dashed: DrawArrow[] = [];
  const prop = (p: Proposal, lane: string) => {
    placed.add(p.id);
    drawn.push({ id: `prop:${p.id}`, type: "TASK", n: null, label: p.label, lane, proposed: true });
    if (p.after && steps.some((s) => s.id === p.after)) dashed.push({ from: p.after, to: `prop:${p.id}`, label: null, dashed: true });
  };
  for (const s of steps) {
    drawn.push({ ...s, gap: gapText(s) });
    for (const p of proposals) if (p.after === s.id) prop(p, s.lane);
  }
  for (const p of proposals) if (!placed.has(p.id)) prop(p, steps.at(-1)?.lane ?? lanes[0]?.key ?? "none");
  const drawLanes = lanes.length ? lanes : [{ key: "none", name: null }];

  const stepName = (s: MapStep) => (s.n ? `${all.reading.page.step(s.n)}, ${s.label}` : `${m.types[s.type]}, ${s.label}`);

  /* + Step and + Decision go after the picked step, in its lane, into the line (spec 067 §4.3) */
  const add = (type: "TASK" | "DECISION") => {
    const anchor = steps.find((s) => s.id === sel && s.type !== "END") ?? steps.filter((s) => s.type !== "END").at(-1);
    const role = anchor?.roleId ?? "";
    void run(() =>
      addProcessStep({
        workspaceId,
        processId,
        step: { type, label: type === "DECISION" ? m.newDecision : m.newStep, assignedRoleId: role, swimlaneRoleId: role, linkedProcessIds: [] },
        fromStepId: anchor?.id,
        insertAfterStepId: anchor?.id ?? "",
        intoLine: true,
      })
    ).then((r) => r.ok && setSel(r.data.id));
  };

  const picture = async () => {
    const el = wrap.current?.querySelector<HTMLElement>("[data-lane-grid]");
    if (!el) return;
    const { toPng } = await import("html-to-image");
    /* the drawing's own ground, so a dark theme's picture is not laid on white */
    const url = await toPng(el, { backgroundColor: getComputedStyle(el).backgroundColor || "#ffffff", pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${processCode}-process-map.png`;
    a.click();
  };

  const picked = sel?.startsWith("prop:") ? proposals.find((p) => `prop:${p.id}` === sel) : null;
  const step = steps.find((s) => s.id === sel);

  return (
    <div ref={wrap}>
      {canEdit && (
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <button type="button" className={btn} onClick={() => add("TASK")}>
            {m.addStep}
          </button>
          <button type="button" className={btn} onClick={() => add("DECISION")}>
            {m.addDecision}
          </button>
          <button type="button" className={btn} disabled={steps.length < 2} onClick={() => setConnecting(step?.id ?? "")}>
            {m.connect}
          </button>
          <button type="button" className={btn} disabled={steps.length < 2} title={m.arrangeTip} onClick={() => void run(() => arrangeProcessStepsByFlow({ workspaceId, processId }))}>
            {m.arrange}
          </button>
          <button type="button" className={btn} disabled={!steps.length} onClick={() => void picture()}>
            {m.picture}
          </button>
          <a className={btn} href={`/api/ffp/export/process-map/${processId}`}>
            {m.pdf}
          </a>
          <span className="flex-1" />
          <span role="status" className={`text-[12px] ${err ? "font-semibold text-[var(--bad-tx)]" : "text-[var(--ink-3)]"}`}>
            {err ?? (busy || refreshing ? m.saving : m.status)}
          </span>
        </div>
      )}
      {branchFrom && (
        <p className="mb-2 text-[12.5px] text-[var(--ink-2)]">
          <Link className="font-semibold text-[var(--stone)] underline" href={`/${workspaceId}/processes/processes/${branchFrom.processId}/map`}>
            {m.branchFrom(branchFrom.code, branchFrom.n, branchFrom.label)}
          </Link>
        </p>
      )}
      {drawn.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] bg-white px-[18px] py-[22px] text-[13.5px] text-[var(--ink-2)]">{m.empty}</div>
      ) : (
        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <LaneDrawing steps={drawn} lanes={drawLanes} connections={[...arrows, ...dashed]} sel={sel} onPick={setSel} pickEnds proposedLabel={m.proposed} />
          <aside className="grid gap-3 rounded-lg border border-[var(--line)] bg-white px-3.5 py-3 text-[var(--ink)]" aria-live="polite">
            {picked ? (
              <ProposalPanel workspaceId={workspaceId} proposal={picked} after={steps.find((s) => s.id === picked.after)?.label ?? null} canEdit={canEdit} run={run} onGone={() => setSel(null)} />
            ) : step ? (
              <StepPanel
                key={step.id}
                workspaceId={workspaceId}
                processId={processId}
                step={step}
                steps={steps}
                stepName={stepName}
                arrows={arrows}
                roles={roles}
                otherProcesses={otherProcesses}
                handoffsIn={handoffsIn.filter((h) => h.toStepId === step.id)}
                handoffsOut={handoffsOut.filter((h) => h.fromStepId === step.id)}
                handoffOptions={handoffOptions}
                canEdit={canEdit}
                run={run}
                onConnect={() => setConnecting(step.id)}
                onGone={() => setSel(null)}
              />
            ) : (
              <p className="text-[12.5px] text-[var(--ink-3)]">{m.pickHint}</p>
            )}
          </aside>
        </div>
      )}
      {connecting !== null && (
        <ConnectDialog
          steps={steps}
          stepName={stepName}
          from={connecting}
          onClose={() => setConnecting(null)}
          onConnect={(from, to, label) => run(() => createStepConnection({ workspaceId, processId, fromStepId: from, toStepId: to, label })).then((r) => r.ok && setConnecting(null))}
        />
      )}
    </div>
  );
}

function ConnectDialog({
  steps,
  stepName,
  from: start,
  onClose,
  onConnect,
}: {
  steps: MapStep[];
  stepName: (s: MapStep) => string;
  from: string;
  onClose: () => void;
  onConnect: (from: string, to: string, label: string) => void;
}) {
  const m = useMessages().builder.map;
  const [from, setFrom] = useState(start || steps[0]?.id || "");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");
  const same = !!to && from === to;
  return (
    <Modal
      title={m.connTitle}
      sub={m.connSub}
      onClose={onClose}
      foot={
        <>
          <button type="button" className={btn} onClick={onClose}>
            {m.cancel}
          </button>
          <button type="button" className={btnGold} disabled={!from || !to || same} onClick={() => onConnect(from, to, label.trim())}>
            {m.connGo}
          </button>
        </>
      }
    >
      <label className={lbl}>
        {m.connFrom}
        <select className={field} value={from} onChange={(e) => setFrom(e.target.value)}>
          {steps.map((s) => (
            <option key={s.id} value={s.id}>
              {stepName(s)}
            </option>
          ))}
        </select>
      </label>
      <label className={lbl}>
        {m.connTo}
        <select className={field} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">—</option>
          {steps.map((s) => (
            <option key={s.id} value={s.id}>
              {stepName(s)}
            </option>
          ))}
        </select>
      </label>
      <label className={lbl}>
        {m.connLabel}
        <input className={field} value={label} maxLength={60} placeholder={m.connLabelPh} onChange={(e) => setLabel(e.target.value)} />
      </label>
      {same && (
        <p role="alert" className="text-[13px] font-semibold text-[var(--bad-tx)]">
          {m.connSame}
        </p>
      )}
    </Modal>
  );
}

function ProposalPanel({ workspaceId, proposal, after, canEdit, run, onGone }: { workspaceId: string; proposal: Proposal; after: string | null; canEdit: boolean; run: Run; onGone: () => void }) {
  const m = useMessages().builder.map;
  const act = (fn: typeof confirmProposedStep) => void run(() => fn({ workspaceId, findingId: proposal.id })).then((r) => r.ok && onGone());
  return (
    <>
      <span className="font-mono text-[12px] font-bold text-[var(--gold-deep)]">{m.proposedTitle.toUpperCase()}</span>
      <h3 className="text-base font-semibold">{proposal.label}</h3>
      <p className="text-[12.5px] text-[var(--ink-3)]">
        {after ? m.after(after) : m.atEnd}
        {proposal.notes ? ` ${proposal.notes}` : ""}
      </p>
      <p className="text-[13px]">{m.proposedNote}</p>
      {canEdit && (
        <div className="flex gap-1.5">
          <button type="button" className={btnGold} onClick={() => act(confirmProposedStep)}>
            {m.confirm}
          </button>
          <button type="button" className={btn} onClick={() => act(deleteProposedStep)}>
            {m.del}
          </button>
        </div>
      )}
    </>
  );
}
