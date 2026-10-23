"use client";

export function PrintPageButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 print:hidden">
      Print or save as PDF
    </button>
  );
}
