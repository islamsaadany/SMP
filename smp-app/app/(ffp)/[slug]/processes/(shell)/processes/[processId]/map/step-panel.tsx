"use client";

/* The picked step's form on the Map (spec 067 §4.3; the approved prototype's
   step form). It saves as you type: a field when you leave it, a choice or a
   letter at once. Who does it moves the step to that lane; the RACI letters,
   the rules and the controls are the same records the RACI, Authority and
   Risks & controls pages edit. Under More: the step's type, its arrows, its
   hand-overs with other processes, its links, its SOP detail and its place. */
import { useState } from "react";
import Link from "next/link";
import { useMessages } from "@/ffp/lib/i18n/client";
import { deleteProcessStep, moveProcessStep, setStepMilestone, updateProcessStep, deleteStepConnection } from "@/ffp/lib/actions/process";
import { setStepRaciCell } from "@/ffp/lib/actions/raci";
import { addAuthorityRule, deleteAuthorityRule, updateAuthorityRule } from "@/ffp/lib/actions/authority";
import { createProcessControl, updateProcessControl } from "@/ffp/lib/actions/process-quality";
import { createStepHandoff, deleteStepHandoff } from "@/ffp/lib/actions/step-handoff";
import { Modal } from "../../../../read/dialogs";
import { btn, btnGold, field, lbl, type MapArrow, type MapStep, type Run } from "./map-editor";
import type { HandoffStepOption, HandoffT } from "./handoff-types";

type Letter = "" | "R" | "A" | "C" | "I";
type Kind = "money" | "time" | "none";
const CYCLE: Letter[] = ["", "R", "A", "C", "I"];
const CODE = { R: "RESPONSIBLE", A: "ACCOUNTABLE", C: "CONSULTED", I: "INFORMED" } as const;
const LETTER_STYLE: Record<Letter, string> = {
  "": "border-[var(--line)] bg-white text-[var(--ink-4)]",
  R: "border-[var(--panel)] bg-[var(--panel)] text-[var(--panel-ink)]",
  A: "border-[var(--gold)] bg-[var(--gold)] text-[var(--on-accent)]",
  C: "border-[var(--field-line)] bg-[var(--surface-2)] text-[var(--ink)]",
  I: "border-[var(--line)] bg-white text-[var(--ink-2)]",
};
const sub = "text-[11px] font-extrabold uppercase tracking-[.08em] text-[var(--ink-3)]";
const xdel = "grid h-6 w-6 shrink-0 place-items-center rounded text-[15px] text-[var(--bad-tx)] hover:bg-[var(--bad-bg)]";

export function StepPanel({
  workspaceId,
  processId,
  step,
  steps,
  stepName,
  arrows,
  roles,
  otherProcesses,
  handoffsIn,
  handoffsOut,
  handoffOptions,
  canEdit,
  run,
  onConnect,
  onGone,
}: {
  workspaceId: string;
  processId: string;
  step: MapStep;
  steps: MapStep[];
  stepName: (s: MapStep) => string;
  arrows: MapArrow[];
  roles: { id: string; name: string }[];
  otherProcesses: { id: string; code: string; name: string }[];
  handoffsIn: HandoffT[];
  handoffsOut: HandoffT[];
  handoffOptions: HandoffStepOption[];
  canEdit: boolean;
  run: Run;
  onConnect: () => void;
  onGone: () => void;
}) {
  const all = useMessages();
  const m = all.builder.map;
  const ro = !canEdit;
  const [label, setLabel] = useState(step.label);
  /* choices show at once; the save follows */
  const [roleId, setRoleId] = useState(step.roleId ?? "");
  const [type, setType] = useState(step.type);
  const [milestone, setMilestone] = useState(step.milestone);
  const [joinAll, setJoinAll] = useState(step.joinRequiresAll);
  const [links, setLinks] = useState(step.links);
  const [acts, setActs] = useState(step.acts.join("\n"));
  const [sop, setSop] = useState(step.sop);
  const [letters, setLetters] = useState<Record<string, Letter>>(step.raci.letters);
  /* what is typed into each control, by risk, until it is saved: a risk added after the step was picked gets its own box too */
  const [controls, setControls] = useState<Record<string, string>>({});
  const [asking, setAsking] = useState<"rule" | "control" | null>(null);
  const [removing, setRemoving] = useState(false);
  const [handPick, setHandPick] = useState("");
  const [handLabel, setHandLabel] = useState("");
  const roleName = new Map(roles.map((r) => [r.id, r.name]));
  const base = { workspaceId, processId, stepId: step.id };

  /* every save sends what the step is now, with the one change in it */
  const save = (patch: { type?: MapStep["type"]; label?: string; roleId?: string; detailedAction?: string[]; joinRequiresAll?: boolean; linkedProcessIds?: string[]; sop?: MapStep["sop"] }) => {
    const role = patch.roleId ?? roleId;
    const s = patch.sop;
    return run(() =>
      updateProcessStep({
        ...base,
        type: patch.type ?? type,
        label: patch.label ?? (label.trim() || step.label),
        assignedRoleId: role,
        swimlaneRoleId: role,
        ...(patch.detailedAction ? { detailedAction: patch.detailedAction } : {}),
        ...(patch.joinRequiresAll !== undefined ? { joinRequiresAll: patch.joinRequiresAll } : {}),
        ...(patch.linkedProcessIds ? { linkedProcessIds: patch.linkedProcessIds } : {}),
        ...(s ? { sopInputs: s.inputs, sopOutput: s.output, sopErrors: s.errors, exceptionHandling: s.risk } : {}),
      })
    );
  };
  const saveLabel = () => {
    const v = label.trim();
    if (!v) return setLabel(step.label);
    if (v !== step.label) void save({ label: v });
  };
  const saveActs = () => {
    const list = acts.split("\n").map((x) => x.trim()).filter(Boolean);
    if (list.join("\n") !== step.acts.join("\n")) void save({ detailedAction: list });
  };
  const saveSop = () => {
    if (JSON.stringify(sop) !== JSON.stringify(step.sop)) void save({ sop });
  };

  /* the RACI letters: the role in the lane first, then everyone else who has one */
  const shown = [...new Set([...(roleId ? [roleId] : []), ...Object.keys(letters)])];
  const setLetter = (roleId: string, next: Letter) => {
    setLetters((l) => ({ ...l, [roleId]: next }));
    void run(() => setStepRaciCell({ ...base, roleId, code: next ? CODE[next] : null }));
  };
  const addRole = (roleId: string) => {
    const have = Object.values(letters);
    setLetter(roleId, !have.includes("R") ? "R" : !have.includes("A") ? "A" : "I");
  };

  const ins = arrows.filter((a) => a.to === step.id), outs = arrows.filter((a) => a.from === step.id);
  const nameOf = (id: string) => {
    const s = steps.find((x) => x.id === id);
    return s ? stepName(s) : "";
  };
  const i = steps.findIndex((s) => s.id === step.id);
  const head = step.n ? all.reading.page.step(step.n) : m.types[step.type];

  return (
    <>
      <div>
        <span className="font-mono text-[12px] font-bold text-[var(--ink-3)]">
          {head.toUpperCase()}
          {type === "DECISION" ? ` · ${m.types.DECISION.toUpperCase()}` : ""}
        </span>
        {step.gaps.map((g) => (
          <p key={g} className="mt-1 text-[12.5px] font-semibold text-[var(--bad-tx)]">
            {m.gap[g]}
          </p>
        ))}
        {step.reviewNote && <p className="mt-1 rounded-md bg-[var(--over-bg)] px-2 py-1 text-[12.5px] text-[var(--ink-2)]">{m.reviewNote(step.reviewNote)}</p>}
      </div>

      <label className={lbl}>
        {m.name}
        <input
          className={field}
          value={label}
          disabled={ro}
          maxLength={200}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        />
      </label>
      <label className={lbl}>
        {m.who}
        <select
          className={field}
          value={roleId}
          disabled={ro}
          onChange={(e) => {
            setRoleId(e.target.value);
            void save({ roleId: e.target.value });
          }}
        >
          <option value="">{m.nobody}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      {(type === "TASK" || type === "DECISION") && (
        <>
          <label className={lbl}>
            {m.acts}
            <textarea className={`${field} min-h-[64px]`} value={acts} disabled={ro} onChange={(e) => setActs(e.target.value)} onBlur={saveActs} />
          </label>

          <div className="grid gap-1.5">
            <span className={lbl}>{m.involved}</span>
            {step.raci.activities > 1 ? (
              <p className="text-[12.5px] text-[var(--ink-2)]">
                {m.manyActivities(step.raci.activities)}{" "}
                <Link className="font-semibold underline" href={`/${workspaceId}/processes/processes/${processId}/raci`}>
                  {m.openRaci}
                </Link>
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {shown.map((r) => {
                    const l = letters[r] ?? "";
                    return (
                      <span key={r} className="inline-flex items-center gap-1.5 text-[12.5px]">
                        <button
                          type="button"
                          disabled={ro}
                          aria-label={m.letter(roleName.get(r) ?? "", l)}
                          onClick={() => setLetter(r, CYCLE[(CYCLE.indexOf(l) + 1) % CYCLE.length])}
                          className={`grid h-6 w-6 place-items-center rounded border text-[12px] font-extrabold ${LETTER_STYLE[l]}`}
                        >
                          {l || "–"}
                        </button>
                        {roleName.get(r) ?? "?"}
                      </span>
                    );
                  })}
                </div>
                {!ro && (
                  <select className={field} value="" aria-label={m.addRole} onChange={(e) => e.target.value && addRole(e.target.value)}>
                    <option value="">{m.addRole}</option>
                    {roles
                      .filter((r) => !shown.includes(r.id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                )}
              </>
            )}
          </div>

          <div className="grid gap-1.5">
            <span className={lbl}>{m.rules}</span>
            {step.rules.row ? (
              <>
                {step.rules.list.length ? (
                  step.rules.list.map((r) => (
                    <div key={r.id} className="flex items-start gap-1.5 text-[13px]">
                      <span className="flex-1">{r.text}</span>
                      {!ro && (
                        <button type="button" className={xdel} aria-label={m.removeRule} onClick={() => void run(() => deleteAuthorityRule({ workspaceId, processId, ruleId: r.id }))}>
                          ×
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[12.5px] text-[var(--ink-3)]">{m.none}</span>
                )}
                {!ro && (
                  <div>
                    <button type="button" className={btn} onClick={() => setAsking("rule")}>
                      {m.addRule}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[12.5px] text-[var(--ink-2)]">
                {m.manyRules}{" "}
                <Link className="font-semibold underline" href={`/${workspaceId}/processes/processes/${processId}/authority`}>
                  {m.openAuthority}
                </Link>
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <span className={lbl}>{m.risks}</span>
            {step.controls.length ? (
              step.controls.map((c) => (
                <div key={c.id} className={`grid gap-1 rounded-md border px-2 py-1.5 ${c.control ? "border-[var(--line)]" : "border-[var(--bad)] bg-[var(--bad-bg)]"}`}>
                  <span className="text-[12.5px]">{m.risk(c.risk)}</span>
                  <input
                    className={field}
                    value={controls[c.id] ?? c.control ?? ""}
                    disabled={ro}
                    maxLength={300}
                    placeholder={m.controlPh}
                    aria-label={m.controlFor(c.risk)}
                    onChange={(e) => setControls((x) => ({ ...x, [c.id]: e.target.value }))}
                    onBlur={() => {
                      const v = controls[c.id];
                      if (v !== undefined && v.trim() !== (c.control ?? "")) void run(() => updateProcessControl({ workspaceId, processId, id: c.id, control: v.trim() }));
                    }}
                  />
                </div>
              ))
            ) : (
              <span className="text-[12.5px] text-[var(--ink-3)]">{m.noRisk}</span>
            )}
            {!ro && (
              <div>
                <button type="button" className={btn} onClick={() => setAsking("control")}>
                  {m.addControl}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <details className="rounded-md border border-[var(--line-soft)] px-2.5 py-2">
        <summary className="cursor-pointer text-[12.5px] font-semibold text-[var(--stone)]">{m.more}</summary>
        <div className="mt-2.5 grid gap-3">
          <label className={lbl}>
            {m.type}
            <select
              className={field}
              value={type}
              disabled={ro}
              onChange={(e) => {
                const t = e.target.value as MapStep["type"];
                setType(t);
                void save({ type: t });
              }}
            >
              {(["TASK", "DECISION", "START", "END"] as const).map((t) => (
                <option key={t} value={t}>
                  {m.types[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[12.5px]">
            <input
              type="checkbox"
              checked={milestone}
              disabled={ro}
              onChange={(e) => {
                setMilestone(e.target.checked);
                void run(() => setStepMilestone({ ...base, milestone: e.target.checked }));
              }}
            />
            {m.milestone}
          </label>

          {[
            [m.comesFrom, ins, (a: MapArrow) => a.from],
            [m.goesTo, outs, (a: MapArrow) => a.to],
          ].map(([title, list, other]) => (
            <div key={title as string} className="grid gap-1">
              <span className={sub}>{title as string}</span>
              {(list as MapArrow[]).length ? (
                (list as MapArrow[]).map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 text-[12.5px]">
                    <span className="flex-1">
                      {nameOf((other as (a: MapArrow) => string)(a))}
                      {a.label && <span className="ms-1 rounded bg-[var(--surface-2)] px-1 text-[11.5px] font-semibold">{a.label}</span>}
                    </span>
                    {!ro && (
                      <button type="button" className={xdel} aria-label={m.removeArrow} onClick={() => void run(() => deleteStepConnection({ workspaceId, processId, connectionId: a.id }))}>
                        ×
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-[12.5px] text-[var(--ink-3)]">{m.noArrows}</span>
              )}
            </div>
          ))}
          {!ro && (
            <div>
              <button type="button" className={btn} onClick={onConnect}>
                {m.connectHere}
              </button>
            </div>
          )}
          {ins.length + handoffsIn.length > 1 && (
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={joinAll}
                disabled={ro}
                onChange={(e) => {
                  setJoinAll(e.target.checked);
                  void save({ joinRequiresAll: e.target.checked });
                }}
              />
              {m.joinAll}
            </label>
          )}

          <div className="grid gap-1">
            <span className={sub}>{m.handIn}</span>
            {handoffsIn.map((h) => (
              <div key={h.id} className="flex items-center gap-1.5 text-[12.5px]">
                <span className="flex-1">
                  {h.otherProcessCode} · {all.reading.page.step(h.otherStepNumber)}, {h.otherStepLabel}
                  {h.label && <span className="ms-1 rounded bg-[var(--surface-2)] px-1 text-[11.5px] font-semibold">{h.label}</span>}
                </span>
                {!ro && (
                  <button type="button" className={xdel} aria-label={m.removeHand} onClick={() => void run(() => deleteStepHandoff({ workspaceId, processId, handoffId: h.id }))}>
                    ×
                  </button>
                )}
              </div>
            ))}
            {!ro && handoffOptions.length > 0 && (
              <div className="grid gap-1">
                <select className={field} value={handPick} aria-label={m.handIn} onChange={(e) => setHandPick(e.target.value)}>
                  <option value="">{m.handPick}</option>
                  {handoffOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.processCode} · {o.number}. {o.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <input className={field} value={handLabel} maxLength={60} placeholder={m.handLabel} aria-label={m.handLabel} onChange={(e) => setHandLabel(e.target.value)} />
                  <button
                    type="button"
                    className={btn}
                    disabled={!handPick}
                    onClick={() =>
                      void run(() => createStepHandoff({ workspaceId, processId, fromStepId: handPick, toStepId: step.id, label: handLabel.trim() })).then((r) => {
                        if (r.ok) {
                          setHandPick("");
                          setHandLabel("");
                        }
                      })
                    }
                  >
                    {m.handAdd}
                  </button>
                </div>
              </div>
            )}
          </div>
          {handoffsOut.length > 0 && (
            <div className="grid gap-1">
              <span className={sub}>{m.handOut}</span>
              {handoffsOut.map((h) => (
                <span key={h.id} className="text-[12.5px]">
                  {h.otherProcessCode} · {all.reading.page.step(h.otherStepNumber)}, {h.otherStepLabel}
                </span>
              ))}
              <span className="text-[11.5px] text-[var(--ink-3)]">{m.handOutNote}</span>
            </div>
          )}

          {step.branches.length > 0 && (
            <div className="grid gap-1">
              <span className={sub}>{m.branchesHere}</span>
              {step.branches.map((p) => (
                <Link key={p.id} className="text-[12.5px] font-semibold text-[var(--stone)] underline" href={`/${workspaceId}/processes/processes/${p.id}/map`}>
                  {p.code} · {p.name}
                </Link>
              ))}
            </div>
          )}

          {otherProcesses.length > 0 && (
            <div className="grid gap-1">
              <span className={sub}>{m.links}</span>
              <div className="flex max-h-32 flex-wrap gap-x-3 gap-y-1 overflow-y-auto">
                {otherProcesses.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 text-[12.5px]">
                    <input
                      type="checkbox"
                      disabled={ro}
                      checked={links.includes(p.id)}
                      onChange={(e) => {
                        const next = e.target.checked ? [...links, p.id] : links.filter((x) => x !== p.id);
                        setLinks(next);
                        void save({ linkedProcessIds: next });
                      }}
                    />
                    {p.code} · {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <span className={sub}>{m.sop}</span>
            {(
              [
                ["inputs", m.sopInputs],
                ["output", m.sopOutput],
                ["errors", m.sopErrors],
                ["risk", m.sopRisk],
              ] as const
            ).map(([k, t]) => (
              <label key={k} className={lbl}>
                {t}
                <textarea className={`${field} min-h-[48px]`} value={sop[k]} disabled={ro} maxLength={2000} onChange={(e) => setSop((x) => ({ ...x, [k]: e.target.value }))} onBlur={saveSop} />
              </label>
            ))}
          </div>

          {!ro && (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={btn} disabled={i <= 0} onClick={() => void run(() => moveProcessStep({ ...base, direction: "UP" }))}>
                {m.moveEarlier}
              </button>
              <button type="button" className={btn} disabled={i >= steps.length - 1} onClick={() => void run(() => moveProcessStep({ ...base, direction: "DOWN" }))}>
                {m.moveLater}
              </button>
            </div>
          )}
        </div>
      </details>

      {!ro &&
        (removing ? (
          <div className="grid gap-2 rounded-md border border-[var(--bad)] bg-[var(--bad-bg)] px-2.5 py-2 text-[12.5px]">
            <span>{m.removeAsk(step.label)}</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="rounded-md border border-[var(--bad)] bg-[var(--bad)] px-2.5 py-1 text-[12.5px] font-bold text-white"
                onClick={() => void run(() => deleteProcessStep({ ...base, fromMap: true })).then((r) => r.ok && onGone())}
              >
                {m.removeYes}
              </button>
              <button type="button" className={btn} onClick={() => setRemoving(false)}>
                {m.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button type="button" className="text-[12.5px] font-semibold text-[var(--bad-tx)] underline" onClick={() => setRemoving(true)}>
              {m.remove}
            </button>
          </div>
        ))}

      {asking === "rule" && step.rules.row && <RuleDialog roles={roles} defaultRole={roleId || null} onClose={() => setAsking(null)} onAdd={(rule) => addRule(rule)} />}
      {asking === "control" && <ControlDialog stepName={stepName(step)} onClose={() => setAsking(null)} onAdd={(c) => addControl(c)} />}
    </>
  );

  function addRule(r: { kind: Kind; n: number; roleId: string }) {
    const row = step.rules.row!;
    void run(async () => {
      const made = await addAuthorityRule({ workspaceId, processId, rowId: row.id, kind: row.kind });
      if (!made.ok) return made;
      return updateAuthorityRule({
        workspaceId,
        processId,
        ruleId: made.data.id,
        rule:
          r.kind === "none"
            ? { measure: "NONE", amount: null, days: null, direction: "EQUAL_NO_APPROVAL", consequence: "APPROVAL", whoRoleId: null, whoPersonId: null }
            : {
                measure: r.kind === "money" ? "MONEY" : "TIME",
                amount: r.kind === "money" ? r.n : null,
                days: r.kind === "money" ? null : Math.round(r.n),
                direction: r.kind === "money" ? "GREATER_OR_EQUAL" : "GREATER_THAN",
                consequence: r.kind === "money" ? "APPROVAL" : "ESCALATION",
                whoRoleId: r.roleId || null,
                whoPersonId: null,
              },
      });
    }).then((res) => res.ok && setAsking(null));
  }
  function addControl(c: { risk: string; level: "low" | "medium" | "high"; control: string }) {
    void run(() => createProcessControl({ workspaceId, processId, stepId: step.id, risk: c.risk, riskLevel: c.level, control: c.control })).then((res) => res.ok && setAsking(null));
  }
}

function RuleDialog({ roles, defaultRole, onClose, onAdd }: { roles: { id: string; name: string }[]; defaultRole: string | null; onClose: () => void; onAdd: (r: { kind: Kind; n: number; roleId: string }) => void }) {
  const m = useMessages().builder.map;
  const [kind, setKind] = useState<Kind>("money");
  const [n, setN] = useState("50000");
  const [roleId, setRoleId] = useState(defaultRole ?? roles[0]?.id ?? "");
  const num = Number(n), okN = kind === "none" || num > 0;
  return (
    <Modal
      title={m.ruleTitle}
      sub={m.ruleSub}
      onClose={onClose}
      foot={
        <>
          <button type="button" className={btn} onClick={onClose}>
            {m.cancel}
          </button>
          <button type="button" className={btnGold} disabled={!okN} onClick={() => onAdd({ kind, n: num, roleId })}>
            {m.ruleAdd}
          </button>
        </>
      }
    >
      <label className={lbl}>
        {m.ruleKind}
        <select
          className={field}
          value={kind}
          onChange={(e) => {
            const k = e.target.value as Kind;
            setKind(k);
            setN(k === "money" ? "50000" : "3");
          }}
        >
          <option value="money">{m.ruleMoney}</option>
          <option value="time">{m.ruleTime}</option>
          <option value="none">{m.ruleNone}</option>
        </select>
      </label>
      {kind !== "none" && (
        <>
          <label className={lbl}>
            {m.ruleN}
            <input className={field} type="number" min="1" value={n} onChange={(e) => setN(e.target.value)} />
          </label>
          <label className={lbl}>
            {m.ruleTo}
            <select className={field} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {!okN && (
        <p role="alert" className="text-[13px] font-semibold text-[var(--bad-tx)]">
          {m.ruleNeedN}
        </p>
      )}
    </Modal>
  );
}

function ControlDialog({ stepName, onClose, onAdd }: { stepName: string; onClose: () => void; onAdd: (c: { risk: string; level: "low" | "medium" | "high"; control: string }) => void }) {
  const m = useMessages().builder.map;
  const [risk, setRisk] = useState("");
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
  const [control, setControl] = useState("");
  return (
    <Modal
      title={m.ctlTitle}
      sub={m.ctlSub(stepName)}
      onClose={onClose}
      foot={
        <>
          <button type="button" className={btn} onClick={onClose}>
            {m.cancel}
          </button>
          <button type="button" className={btnGold} disabled={!risk.trim()} onClick={() => onAdd({ risk: risk.trim(), level, control: control.trim() })}>
            {m.ctlAdd}
          </button>
        </>
      }
    >
      <label className={lbl}>
        {m.ctlRisk}
        <input className={field} value={risk} maxLength={300} placeholder={m.ctlRiskPh} onChange={(e) => setRisk(e.target.value)} />
      </label>
      <label className={lbl}>
        {m.ctlLevel}
        <select className={field} value={level} onChange={(e) => setLevel(e.target.value as "low" | "medium" | "high")}>
          {(["low", "medium", "high"] as const).map((l) => (
            <option key={l} value={l}>
              {m.levels[l]}
            </option>
          ))}
        </select>
      </label>
      <label className={lbl}>
        {m.ctlHow}
        <input className={field} value={control} maxLength={300} onChange={(e) => setControl(e.target.value)} />
      </label>
    </Modal>
  );
}
