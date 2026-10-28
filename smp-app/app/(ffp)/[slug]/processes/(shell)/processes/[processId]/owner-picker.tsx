"use client";

/* The process's owner, picked from the client register (stage 4; Islam: "all
   names from register"). The owner does the yearly review and sees the
   process under Yours on the reading side. */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import { setProcessOwner } from "@/ffp/lib/actions/suggestions";

export function OwnerPicker({ workspaceId, processId, ownerId, people }: { workspaceId: string; processId: string; ownerId: string | null; people: { id: string; name: string; role: string | null }[] }) {
  const m = useMessages().builder.page;
  const router = useRouter();
  const [value, setValue] = useState(ownerId ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={m.ownerPick}
        value={value}
        onChange={(e) => (setValue(e.target.value), setSaved(false))}
        className="min-w-64 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
      >
        <option value="">{m.ownerNone}</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.role ? ` — ${p.role}` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || value === (ownerId ?? "")}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await setProcessOwner({ workspaceId, processId, ownerPersonId: value || null });
            if (!r.ok) return setError(r.error === "VALIDATION_ERROR" ? (r.message ?? "That could not be saved") : r.error);
            setSaved(true);
            router.refresh();
          })
        }
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {m.ownerSave}
      </button>
      {saved && <span className="text-xs font-semibold text-emerald-700">{m.ownerSaved}</span>}
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
      <p className="w-full text-xs text-slate-500">{m.ownerHint}</p>
    </div>
  );
}
