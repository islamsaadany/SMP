"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
    >
      Print / save as PDF
    </button>
  );
}
