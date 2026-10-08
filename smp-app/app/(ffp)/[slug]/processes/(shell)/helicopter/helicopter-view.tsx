"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProcessLandscapeCanvas, type LandscapeProcessInput } from "./landscape-canvas";
import { MilestoneRailsView } from "./milestone-rails-view";
import type { RailProcess } from "@/ffp/lib/domain/milestone-rails";
import {
  groupProcesses,
  groupState,
  hiddenOrigins,
  pickLabel,
  shownFromHidden,
  toggleGroup,
  toggleOne,
} from "@/ffp/lib/domain/helicopter-pick";

/**
 * Two ways to read the same engagement. Rails lead, because they say what each
 * process actually does and where one picks up from another; Cards stay for
 * the plain question of which processes exist and how they connect.
 *
 * A "Processes" picker chooses which are drawn, in both views and in the PNG.
 * It hides from the picture only — nothing is deleted — and is remembered per
 * browser.
 */
export function HelicopterView({
  workspaceId,
  workspaceName,
  cardProcesses,
  railProcesses,
}: {
  workspaceId: string;
  workspaceName: string;
  cardProcesses: LandscapeProcessInput[];
  railProcesses: RailProcess[];
}) {
  const [mode, setMode] = useState<"rails" | "cards">("rails");
  const allIds = useMemo(() => cardProcesses.map((p) => p.id), [cardProcesses]);
  const [shown, setShown] = useState<Set<string>>(() => new Set(allIds));
  const storeKey = `ffp.helicopter.hidden.${workspaceId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setShown(shownFromHidden(allIds, JSON.parse(raw) as string[]));
    } catch {
      /* storage blocked or unreadable — show everything */
    }
  }, [storeKey, allIds]);

  function update(next: Set<string>) {
    setShown(next);
    try {
      const hidden = allIds.filter((id) => !next.has(id));
      if (hidden.length === 0) localStorage.removeItem(storeKey);
      else localStorage.setItem(storeKey, JSON.stringify(hidden));
    } catch {
      /* not remembered, still works */
    }
  }

  const cards = useMemo(() => {
    const visible = cardProcesses.filter((p) => shown.has(p.id));
    return visible.map((p) => ({
      ...p,
      linksTo: p.linksTo.filter((l) => shown.has(l.targetProcessId)),
    }));
  }, [cardProcesses, shown]);
  const rails = useMemo(() => railProcesses.filter((p) => shown.has(p.id)), [railProcesses, shown]);
  const origins = useMemo(
    () => hiddenOrigins(railProcesses, new Map(cardProcesses.map((p) => [p.id, p.code])), shown),
    [railProcesses, cardProcesses, shown]
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5" role="group" aria-label="Helicopter View mode">
          {(["rails", "cards"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold ${
                mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              {m === "rails" ? "▤ Milestones" : "▭ Cards"}
            </button>
          ))}
        </div>
        <ProcessPicker processes={cardProcesses} shown={shown} onChange={update} />
      </div>

      {shown.size === 0 && cardProcesses.length > 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-600">
          No processes chosen — tick at least one to see the picture.
        </p>
      ) : mode === "rails" ? (
        <MilestoneRailsView
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          processes={rails}
          hiddenOrigins={origins}
        />
      ) : (
        <ProcessLandscapeCanvas workspaceId={workspaceId} workspaceName={workspaceName} processes={cards} />
      )}
    </div>
  );
}

function ProcessPicker({
  processes,
  shown,
  onChange,
}: {
  processes: LandscapeProcessInput[];
  shown: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupProcesses(processes), [processes]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const hit = (p: { code: string; name: string }) => !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Processes: {pickLabel(shown.size, processes.length)} ▾
      </button>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-1 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name"
            aria-label="Search processes"
            className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <div className="mb-1 flex gap-3 px-1 text-[11px] font-semibold text-[var(--accent)]">
            <button type="button" onClick={() => onChange(new Set(processes.map((p) => p.id)))}>Select all</button>
            <button type="button" onClick={() => onChange(new Set())}>Select none</button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {groups.map((g) => {
              const visibleSubs = g.subs.filter(hit);
              if (!hit(g.main) && visibleSubs.length === 0) return null;
              const state = groupState(shown, g);
              return (
                <div key={g.main.id} className="py-0.5">
                  <label className="flex items-center gap-2 rounded px-1 py-0.5 text-xs font-semibold text-slate-900 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={state === "all"}
                      ref={(el) => {
                        if (el) el.indeterminate = state === "some";
                      }}
                      onChange={(e) => onChange(toggleGroup(shown, g, e.target.checked))}
                    />
                    <span className="font-mono text-[10px] text-[var(--accent)]">{g.main.code}</span>
                    <span className="truncate">{g.main.name}</span>
                  </label>
                  {visibleSubs.map((s) => (
                    <label key={s.id} className="ms-5 flex items-center gap-2 rounded px-1 py-0.5 text-xs text-slate-700 hover:bg-slate-50">
                      <input type="checkbox" checked={shown.has(s.id)} onChange={() => onChange(toggleOne(shown, s.id))} />
                      <span className="font-mono text-[10px] text-slate-500">{s.code}</span>
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
