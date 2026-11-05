"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/ffp/lib/i18n/client";
import { matchRoleToTitle } from "@/ffp/lib/actions/roles-match";

/** One role's match: pick a job title from the register, then Match. The row leaves the list once it is matched. */
export function MatchForm({ workspaceId, roleId, titles, suggested }: { workspaceId: string; roleId: string; titles: string[]; suggested: string }) {
  const m = useMessages().builder.roles;
  const router = useRouter();
  const [title, setTitle] = useState(suggested);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label={m.title}
        className="min-w-56 rounded-md border border-[var(--field-line)] bg-white px-2 py-1 text-[13px]"
      >
        <option value="">{m.pick}</option>
        {titles.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!title || pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await matchRoleToTitle({ workspaceId, roleId, title });
            if (!r.ok) setError(r.error === "VALIDATION_ERROR" ? (r.message ?? r.error) : r.error);
            else router.refresh();
          })
        }
        className="rounded-md bg-[var(--gold)] px-3 py-1 text-[12.5px] font-bold text-[var(--on-accent)] disabled:opacity-55"
      >
        {pending ? m.matching : m.match}
      </button>
      {error && (
        <span role="alert" className="w-full text-xs text-[var(--bad-tx)]">
          {error}
        </span>
      )}
    </div>
  );
}
