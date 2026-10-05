"use client";

// The Processes list shows main processes only; a plus beside one opens its
// sub-processes underneath it (Islam, 2026-10-05, from the signed-off mockup
// design-mockups/processes-list-fold/2026-10-05_plus-to-open-subs.html).
//
// The rows stay server-rendered — their cells hold the edit, clone and delete
// forms — and only the <tr> around them is this client component, so a row
// can be hidden without the page having to rebuild what is inside it.
//
// Everything starts closed. A sub-process that has subs of its own gets its own
// plus, so opening a main process shows one level at a time. Search results are
// drawn flat and are never folded (`enabled` false): a closed plus must never
// hide a match.

import { createContext, useContext, useState, type ReactNode } from "react";

type Fold = {
  enabled: boolean;
  open: ReadonlySet<string>;
  toggle: (id: string) => void;
  setAll: (on: boolean) => void;
};

const FoldContext = createContext<Fold>({
  enabled: false,
  open: new Set(),
  toggle: () => {},
  setAll: () => {},
});

export function FoldProvider({
  enabled,
  parentIds,
  children,
}: {
  enabled: boolean;
  /** Every process on the list that has at least one sub-process under it. */
  parentIds: string[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };
  const setAll = (on: boolean) => setOpen(on ? new Set(parentIds) : new Set());
  return <FoldContext.Provider value={{ enabled, open, toggle, setAll }}>{children}</FoldContext.Provider>;
}

/** A row is shown only while every process above it is open. */
export function FoldRow({
  ancestors,
  className,
  children,
}: {
  ancestors: string[];
  className?: string;
  children: ReactNode;
}) {
  const { enabled, open } = useContext(FoldContext);
  const hidden = enabled && ancestors.some((id) => !open.has(id));
  return (
    <tr className={className} hidden={hidden} data-fold-row={ancestors.length > 0 ? "sub" : "main"}>
      {children}
    </tr>
  );
}

const PLUS = (
  <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M6 2v8M2 6h8" />
  </svg>
);
const MINUS = (
  <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M2 6h8" />
  </svg>
);

/**
 * The plus beside a process with sub-processes. A process with none gets the
 * same space and no button, so the codes still line up.
 */
export function FoldToggle({ id, code, count }: { id: string; code: string; count: number }) {
  const { enabled, open, toggle } = useContext(FoldContext);
  if (!enabled) return null;
  if (count === 0) return <span className="me-2 inline-block w-[22px]" aria-hidden="true" />;
  const isOpen = open.has(id);
  const what = count === 1 ? "1 sub-process" : `${count} sub-processes`;
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-expanded={isOpen}
      aria-label={`${isOpen ? "Hide" : "Show"} ${what} of ${code}`}
      data-fold-toggle={id}
      className="me-2 inline-flex h-[22px] w-[22px] items-center justify-center rounded-md border border-slate-300 bg-white align-[-5px] text-slate-700 hover:bg-slate-100"
    >
      {isOpen ? MINUS : PLUS}
    </button>
  );
}

/** "Open all · Close all" above the table — drawn only while folding is on. */
export function FoldAllControls({ any }: { any: boolean }) {
  const { enabled, setAll } = useContext(FoldContext);
  if (!enabled || !any) return null;
  return (
    <p className="mt-3 flex justify-end gap-1 text-xs">
      <button type="button" onClick={() => setAll(true)} className="font-semibold text-slate-600 hover:text-slate-900" data-fold-all="open">
        Open all
      </button>
      <span className="text-slate-400">·</span>
      <button type="button" onClick={() => setAll(false)} className="font-semibold text-slate-600 hover:text-slate-900" data-fold-all="close">
        Close all
      </button>
    </p>
  );
}
