"use client";

import { useState } from "react";

/** A staff reading address the office can send: shown in full, opened, or copied. */
export function StaffLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the address is on screen to select by hand.
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{path}</code>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <a href={path} className="text-xs font-semibold text-slate-600 underline">
        Open
      </a>
      {failed && <span role="alert" className="text-xs text-rose-700">Could not copy. Select the address above.</span>}
    </div>
  );
}
