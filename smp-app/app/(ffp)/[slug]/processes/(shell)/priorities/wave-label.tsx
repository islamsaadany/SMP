"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPlanSettings } from "@/ffp/lib/actions/priorities";

/** The timing line under a wave ("by end of November"), editable by the office while the plan is a draft. */
export function WaveLabel({ workspaceId, field, value, disabled }: { workspaceId: string; field: "wave1Label" | "wave2Label" | "laterLabel"; value: string; disabled: boolean }) {
  const router = useRouter();
  const [text, setText] = useState(value);
  const [, start] = useTransition();
  return (
    <input
      value={text}
      disabled={disabled}
      maxLength={60}
      aria-label="When"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text.trim() && text.trim() !== value && start(async () => { const r = await setPlanSettings({ workspaceId, [field]: text.trim() }); if (r.ok) router.refresh(); })}
      className="w-full rounded border border-transparent bg-transparent px-1 text-xs hover:border-slate-300 focus:border-slate-400"
    />
  );
}
