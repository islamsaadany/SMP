/**
 * The page's own CSS zoom — 0.8 on a computer, 1 on a phone (lib/topbar.ts,
 * every module page at 80% from 1000px). A box the browser reports
 * (getBoundingClientRect) and a pointer's clientX/clientY are in the
 * screen's pixels; a length written back into a style is in the page's. So a
 * measured length is divided by this before it is used as a size or an
 * offset, and a comparison of two measured values needs nothing.
 */
export function pageZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
}
