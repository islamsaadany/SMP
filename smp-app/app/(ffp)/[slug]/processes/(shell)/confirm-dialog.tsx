"use client";

/* THE PROCESSES MODULE'S OWN "ARE YOU SURE" (§724). The four questions this
   module used to ask through the browser's confirm() and prompt() go through
   this instead — a browser box can be silenced for good with one tick on some
   other site, after which the act happens on one press with nothing shown
   (the main app's §95), and it cannot name the thing, colour the act or hold
   a field.

   THE SHAPE IS THE ONE ISLAM SIGNED OFF, the same as the main app's dialogs
   and the Delete-a-process dialog in process-forms.tsx: the TITLE is the
   question with the verb and the thing in it ("Retire this process?"); the
   BODY says what actually happens; CANCEL ON THE LEFT, the ACT ON THE RIGHT
   carrying its own verb (never "Yes" or "OK"); red only when the act
   destroys or cannot be walked back; an × and Escape both mean Cancel.

   Focus lands on Cancel — or on the dialog's field when it holds one, since a
   dialog with a field is asking for words — and goes back to the control
   that opened it when it closes. The page behind is covered, not inert: this
   module's pages re-render on every server answer, and an `inert` left on a
   node React replaces is a page nobody can press. */
import { useEffect, useId, useRef, type ReactNode } from "react";

export function ConfirmDialog({
  title,
  action,
  destructive = false,
  pending = false,
  disabled = false,
  onConfirm,
  onClose,
  children,
}: {
  /** The question, verb and thing in it: "Retire this process?" */
  title: string;
  /** The act, as the button's own words: "Retire the process". Never "Yes". */
  action: string;
  /** Red: the act deletes something or cannot be walked back. */
  destructive?: boolean;
  pending?: boolean;
  /** The act is not yet possible (a field still empty). */
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** What really happens, in a sentence or two; a field if the act needs words. */
  children: ReactNode;
}) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  /* Read through a ref so the effect runs once per open, not once per render:
     callers pass a fresh arrow every render, and an effect keyed on it would
     pull the focus back to Cancel on every keystroke in the field. */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const was = document.activeElement as HTMLElement | null;
    const field = boxRef.current?.querySelector<HTMLElement>("input, textarea, select");
    if (field) {
      field.focus();
      if (field instanceof HTMLInputElement) field.select();
    } else cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      was?.focus?.();
    };
  }, []);

  const btn = "rounded-lg px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        data-ffp-confirm=""
        className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 text-start shadow-lg"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-full text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          ×
        </button>
        <h2 id={id} className="pe-8 text-base font-semibold text-slate-900">
          {title}
        </h2>
        <div className="mt-2 space-y-2 text-sm text-slate-700">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-900`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending || disabled}
            onClick={onConfirm}
            className={`${btn} text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              destructive
                ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-900"
                : "bg-slate-900 hover:bg-slate-800 focus-visible:outline-slate-900"
            }`}
          >
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}
