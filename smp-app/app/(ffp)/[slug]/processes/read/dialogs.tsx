"use client";

/* What a client's person sends the Strategy Office (spec 067 §3.2, stage 4):
   a suggested change, pinned to a step or to the whole process; a request for
   a new process; a reply to the office's answer. And the owner's yearly
   review: "It is still right". Each opens a small dialog, or acts at once,
   and the page refreshes, so the band, the rows and To do move together. */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import { askForProcess, confirmStillRight, replyToAnswer, suggestChange } from "@/ffp/lib/actions/suggestions";

type Res = { ok: boolean; error?: string; message?: string };
const said = (r: Res) => (r.error === "VALIDATION_ERROR" ? (r.message ?? "That could not be saved") : (r.error ?? "Failed"));
const field = "w-full rounded-md border border-[var(--field-line)] bg-white px-2.5 py-2 text-[13.5px] text-[var(--ink)]";
const lbl = "grid gap-1 text-[12.5px] font-semibold text-[var(--ink-2)]";

export function Modal({ title, sub, onClose, children, foot }: { title: string; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode; foot: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(10,14,22,.45)] p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} data-ffp-dialog="" className="grid w-full max-w-[520px] gap-3 rounded-xl border border-[var(--line)] bg-white p-5 text-start text-[var(--ink)] shadow-[0_10px_28px_rgba(15,23,42,.16)]">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {sub && <p className="mt-0.5 text-[13px] text-[var(--ink-3)]">{sub}</p>}
        </div>
        {children}
        <div className="flex flex-wrap justify-end gap-2">{foot}</div>
      </div>
    </div>
  );
}

function useSend(onDone: () => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<Res>) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(said(r));
      onDone();
      router.refresh();
    });
  };
  return { pending, error, run };
}

const btnPlain = "rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)]";
const btnGold = "rounded-md border border-[var(--gold)] bg-[var(--gold)] px-3 py-1.5 text-[13px] font-semibold text-[var(--on-accent)] disabled:opacity-50";

/** Suggest a change: the trigger's look comes from the caller (the band's gold button, a step's link, a health row's link). */
export function SuggestButton({
  workspaceId,
  processId,
  steps,
  stepId,
  label,
  className,
}: {
  workspaceId: string;
  processId: string;
  steps: { id: string; n: number; label: string }[];
  stepId?: string;
  label: string;
  className: string;
}) {
  const m = useMessages().reading.dialog;
  const [open, setOpen] = useState(false);
  const [where, setWhere] = useState(stepId ?? "");
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const { pending, error, run } = useSend(() => {
    setOpen(false);
    setWhat("");
    setWhy("");
  });
  return (
    <>
      <button type="button" className={className} onClick={() => (setWhere(stepId ?? ""), setOpen(true))}>
        {label}
      </button>
      {open && (
        <Modal
          title={m.suggestTitle}
          sub={m.suggestSub}
          onClose={() => setOpen(false)}
          foot={
            <>
              <button type="button" className={btnPlain} onClick={() => setOpen(false)}>
                {m.cancel}
              </button>
              <button type="button" className={btnGold} disabled={pending || !what.trim()} onClick={() => run(() => suggestChange({ workspaceId, processId, stepId: where, text: what, why }))}>
                {pending ? m.saving : m.send}
              </button>
            </>
          }
        >
          <label className={lbl}>
            {m.where}
            <select className={field} value={where} onChange={(e) => setWhere(e.target.value)}>
              <option value="">{m.whole}</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>
                  {m.stepOpt(s.n, s.label)}
                </option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            {m.what}
            <textarea className={`${field} min-h-24`} value={what} onChange={(e) => setWhat(e.target.value)} placeholder={m.whatPh} maxLength={2000} />
          </label>
          <label className={lbl}>
            {m.why}
            <textarea className={`${field} min-h-14`} value={why} onChange={(e) => setWhy(e.target.value)} maxLength={2000} />
          </label>
          {error && (
            <p role="alert" className="text-[13px] font-semibold text-[var(--bad-tx)]">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

/** Ask the Strategy Office for a process that does not exist yet (the reading side's band). */
export function AskButton({ workspaceId, label, className }: { workspaceId: string; label: string; className: string }) {
  const m = useMessages().reading.dialog;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [what, setWhat] = useState("");
  const { pending, error, run } = useSend(() => {
    setOpen(false);
    setName("");
    setWhat("");
  });
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal
          title={m.askTitle}
          sub={m.askSub}
          onClose={() => setOpen(false)}
          foot={
            <>
              <button type="button" className={btnPlain} onClick={() => setOpen(false)}>
                {m.cancel}
              </button>
              <button type="button" className={btnGold} disabled={pending || !name.trim()} onClick={() => run(() => askForProcess({ workspaceId, name, what }))}>
                {pending ? m.saving : m.send}
              </button>
            </>
          }
        >
          <label className={lbl}>
            {m.askName}
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={m.askNamePh} maxLength={120} />
          </label>
          <label className={lbl}>
            {m.askWhat}
            <textarea className={`${field} min-h-20`} value={what} onChange={(e) => setWhat(e.target.value)} maxLength={2000} />
          </label>
          {error && (
            <p role="alert" className="text-[13px] font-semibold text-[var(--bad-tx)]">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

/** Reply to the office's answer on one of the person's suggestions (To do, and the process page's wait line). */
export function ReplyButton({
  workspaceId,
  suggestionId,
  suggestion,
  answer,
  answerBy,
  label,
  className,
}: {
  workspaceId: string;
  suggestionId: string;
  suggestion: string;
  answer: string;
  answerBy: string;
  label: string;
  className: string;
}) {
  const m = useMessages().reading.dialog;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { pending, error, run } = useSend(() => {
    setOpen(false);
    setText("");
  });
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal
          title={m.replyTitle}
          sub={m.yourSuggestion(suggestion)}
          onClose={() => setOpen(false)}
          foot={
            <>
              <button type="button" className={btnPlain} onClick={() => setOpen(false)}>
                {m.cancel}
              </button>
              <button type="button" className={btnGold} disabled={pending || !text.trim()} onClick={() => run(() => replyToAnswer({ workspaceId, suggestionId, text }))}>
                {pending ? m.saving : m.sendReply}
              </button>
            </>
          }
        >
          <blockquote className="m-0 border-s-[3px] border-[var(--gold)] bg-[var(--over-bg)] px-2.5 py-2 text-[13.5px]">
            {answer}
            <br />
            <span className="text-[12.5px] text-[var(--ink-3)]">{answerBy}</span>
          </blockquote>
          <label className={lbl}>
            {m.yourReply}
            <textarea className={`${field} min-h-20`} value={text} onChange={(e) => setText(e.target.value)} placeholder={m.replyPh} maxLength={2000} />
          </label>
          {error && (
            <p role="alert" className="text-[13px] font-semibold text-[var(--bad-tx)]">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

/** The owner's yearly review: "It is still right" puts the next review a cycle away. */
export function StillRightButton({ workspaceId, processId, label, className }: { workspaceId: string; processId: string; label: string; className: string }) {
  const { pending, error, run } = useSend(() => {});
  const m = useMessages().reading.page;
  return (
    <>
      <button type="button" className={className} disabled={pending} onClick={() => run(() => confirmStillRight({ workspaceId, processId }))}>
        {pending ? m.saving : label}
      </button>
      {error && (
        <span role="alert" className="text-[12.5px] font-semibold text-[var(--bad-tx)]">
          {error}
        </span>
      )}
    </>
  );
}
