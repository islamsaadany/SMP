"use client";

import { useEffect, useRef, useState } from "react";

export type PickerItem = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  sub: boolean;
  scored: boolean;
  flaggedSteps: number;
};

/**
 * "Choose processes": a searchable drop-down of every process, mains with their subs. Ticking a main
 * ticks its subs too (they can be unticked one by one). The table shows only what is ticked.
 */
export function ProcessPicker({
  items,
  shown,
  onChange,
}: {
  items: PickerItem[];
  /** Null means every process. */
  shown: ReadonlySet<string> | null;
  onChange: (next: ReadonlySet<string> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const all = new Set(items.map((i) => i.id));
  const on = shown ?? all;

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const set = (next: Set<string>) => onChange(next.size === all.size ? null : next);
  const toggle = (it: PickerItem, checked: boolean) => {
    const next = new Set(on);
    const ids = it.sub ? [it.id] : [it.id, ...items.filter((x) => x.parentId === it.id).map((x) => x.id)];
    for (const id of ids) (checked ? next.add(id) : next.delete(id));
    set(next);
  };
  const needle = q.trim().toLowerCase();
  const list = needle ? items.filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(needle)) : items;

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Choose processes · {on.size} of {items.length} ▾
      </button>
      {open && (
        <div role="group" aria-label="Choose processes" className="absolute start-0 top-11 z-20 w-96 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a process or code…"
            aria-label="Search the processes"
            className="mb-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <ul className="max-h-80 overflow-y-auto">
            {list.map((i) => (
              <li key={i.id}>
                <label className={`flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50 ${i.sub && !needle ? "ps-6" : ""}`}>
                  <input type="checkbox" checked={on.has(i.id)} onChange={(e) => toggle(i, e.target.checked)} />
                  <span className={i.sub ? "text-slate-800" : "font-semibold text-slate-900"}>{i.name}</span>
                  <span className="ms-auto font-mono text-xs text-slate-500">{i.code}</span>
                </label>
              </li>
            ))}
            {list.length === 0 && <li className="px-1 py-2 text-sm text-slate-500">Nothing matches.</li>}
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-2 text-xs font-semibold text-indigo-700">
            <button type="button" className="hover:underline" onClick={() => onChange(null)}>Select all</button>
            <button type="button" className="hover:underline" onClick={() => onChange(new Set())}>None</button>
            <button type="button" className="hover:underline" onClick={() => set(new Set(items.filter((i) => !i.scored).map((i) => i.id)))}>Only unscored</button>
            <button type="button" className="hover:underline" onClick={() => set(new Set(items.filter((i) => i.flaggedSteps > 0).map((i) => i.id)))}>Has flagged steps</button>
            <button type="button" onClick={() => setOpen(false)} className="ms-auto rounded-lg bg-slate-900 px-3 py-1 text-white hover:bg-slate-800">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
