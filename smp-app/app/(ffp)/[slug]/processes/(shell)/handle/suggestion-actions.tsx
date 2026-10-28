"use client";

/* What the office does with a suggestion on To handle (spec 067 §4.2):
   answer it (it lands in the person's To do), start a draft from it (the
   builder opens on its Map, and it closes when the process is next
   published), or mark it done. */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import { answerSuggestion, closeSuggestion, startDraftFrom } from "@/ffp/lib/actions/suggestions";
import { Modal } from "../../read/dialogs";

type Res = { ok: boolean; error?: string; message?: string };
const said = (r: Res) => (r.error === "VALIDATION_ERROR" ? (r.message ?? "That could not be saved") : (r.error ?? "Failed"));
export const btnPlain = "whitespace-nowrap rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink)] disabled:opacity-50";
export const btnGold = "whitespace-nowrap rounded-md border border-[var(--gold)] bg-[var(--gold)] px-3 py-1.5 text-[12.5px] font-bold text-[var(--on-accent)] disabled:opacity-50";

export function AnswerButton({ workspaceId, suggestionId, who, text }: { workspaceId: string; suggestionId: string; who: string; text: string }) {
  const m = useMessages().builder.handle;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" className={btnPlain} onClick={() => setOpen(true)}>
        {m.answer}
      </button>
      {open && (
        <Modal
          title={m.answerTitle(who)}
          sub={`“${text}”`}
          onClose={() => setOpen(false)}
          foot={
            <>
              <button type="button" className={btnPlain} onClick={() => setOpen(false)}>
                {m.cancel}
              </button>
              <button
                type="button"
                className={btnGold}
                disabled={pending || !answer.trim()}
                onClick={() =>
                  start(async () => {
                    setError(null);
                    const r = await answerSuggestion({ workspaceId, suggestionId, text: answer });
                    if (!r.ok) return setError(said(r));
                    setOpen(false);
                    router.refresh();
                  })
                }
              >
                {pending ? m.sending : m.sendAnswer}
              </button>
            </>
          }
        >
          <label className="grid gap-1 text-[12.5px] font-semibold text-[var(--ink-2)]">
            {m.yourAnswer}
            <textarea
              className="min-h-24 w-full rounded-md border border-[var(--field-line)] bg-white px-2.5 py-2 text-[13.5px] text-[var(--ink)]"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={m.answerPh}
              maxLength={2000}
            />
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

/** Start a draft from it, or open the builder where it is already being worked in. */
export function DraftButton({ workspaceId, suggestionId, label }: { workspaceId: string; suggestionId: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className={btnGold}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await startDraftFrom({ workspaceId, suggestionId });
            if (!r.ok) return setError(said(r));
            router.push(`/${workspaceId}/processes/processes/${r.data.processId}/map`);
          })
        }
      >
        {label}
      </button>
      {error && <span className="text-[12px] font-semibold text-[var(--bad-tx)]">{error}</span>}
    </>
  );
}

export function DoneButton({ workspaceId, suggestionId }: { workspaceId: string; suggestionId: string }) {
  const m = useMessages().builder.handle;
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={btnPlain}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await closeSuggestion({ workspaceId, suggestionId });
          if (r.ok) router.refresh();
        })
      }
    >
      {m.markDone}
    </button>
  );
}
