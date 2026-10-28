"use client";

import { useEffect, useState } from "react";
import { pageZoom } from "@/ffp/lib/client/page-zoom";

/**
 * Print / save as PDF. By default the SOPs print as ONE continuous page (no cut
 * at the end of a sheet), the same as the report (§522): the paper is sized to
 * the measured content at print time. Above Chrome's page-height limit it
 * falls back to ordinary pages.
 */
export function PrintButton() {
  const [continuous, setContinuous] = useState(true);

  useEffect(() => {
    if (!continuous) return;
    const MAX_MM = 200 * 25.4 - 20;
    const styleId = "sop-continuous-page";
    const root = () => document.querySelector<HTMLElement>("[data-sop-root]");
    const before = () => {
      const el = root();
      if (!el) return;
      el.dataset.prevWidth = el.style.width;
      el.style.width = "210mm";
      el.style.maxWidth = "none";
      const heightMm = Math.ceil((el.getBoundingClientRect().height / pageZoom() * 25.4) / 96) + 3;
      if (heightMm > MAX_MM) {
        el.style.width = el.dataset.prevWidth ?? "";
        el.style.maxWidth = "";
        return;
      }
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `@page { size: 210mm ${heightMm}mm; margin: 0; }
        [data-sop-root] { padding: 12mm !important; width: 210mm !important; }
        [data-sop-root] article { break-after: auto !important; margin-bottom: 14mm !important; }
        [data-sop-root] tr { break-inside: auto !important; }`;
      document.head.appendChild(style);
    };
    const after = () => {
      document.getElementById(styleId)?.remove();
      const el = root();
      if (el) {
        el.style.width = el.dataset.prevWidth ?? "";
        el.style.maxWidth = "";
      }
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      after();
    };
  }, [continuous]);

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 text-sm text-slate-600">
        <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
        One continuous page
      </label>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
      >
        Print / save as PDF
      </button>
    </div>
  );
}
