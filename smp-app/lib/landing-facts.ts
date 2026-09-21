/* THE FACTS A LANDING LINE IS MADE OF (spec 056 §4.5, §359.4) — read ONCE
   here for both places that draw a module's line, the console's card
   (lib/platform-api.ts) and the client's landing (lib/landing.ts), so the
   two cannot compute a sentence from two different readings (§53.5).

   The cycle half is the frozen product's own (lib/frozen.cjs landingFacts:
   REVIEW and cycleTotals(), the count the cycle board reads). The library
   half is the library's own reader (listItems), asked FOR THE VIEWER: a
   report narrowed to one place (§355) is invisible to everybody else, and a
   count on the landing that included it would be that report leaking as a
   number. The console reads as somebody who sees everything, which is what
   the console is. A half that cannot be read is null, never nought (§35). */
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { listItems, type Viewer } from "./library.ts";
import { NO_FACTS, type LandingFacts, type ModuleKey } from "./modules.ts";

const frozen = createRequire(import.meta.url)("./frozen.cjs") as {
  landingFacts: (graph: unknown) => Pick<LandingFacts, "cycleOpen" | "cycleName" | "due" | "total" | "sub">;
};

/* The picks stored on the group, read off the graph the caller already holds
   (SMPRules.landingPicks's shape: a map keyed by module, absent is none). */
export function picksOf(graph: any): Record<string, string> {
  const v = graph && graph.group && graph.group.landing;
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const k of Object.keys(v)) if (typeof v[k] === "string" && v[k]) out[k] = v[k];
  return out;
}

export async function landingFactsFor(tenantId: string, have: readonly ModuleKey[], viewer: Viewer, graph?: any): Promise<{ facts: LandingFacts; picks: Record<string, string> }> {
  const g = graph === undefined ? await withTenant(tenantId, (c) => readState(c)) : graph;
  const facts: LandingFacts = { ...NO_FACTS };
  if (g) {
    try { Object.assign(facts, frozen.landingFacts(g)); } catch (e) { console.error("landing facts:", (e as Error).message); }
  }
  if (have.includes("insights")) {
    try {
      const rows = await withTenant(tenantId, (c) => listItems(c, { kind: "insights", forClient: true, viewer }));
      const now = new Date(), y = now.getUTCFullYear(), m = now.getUTCMonth();
      const dated = rows.filter((r) => r.publishedAt);
      facts.newReports = dated.filter((r) => { const d = new Date(r.publishedAt); return d.getUTCFullYear() === y && d.getUTCMonth() === m; }).length;
      const latest = dated.slice().sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))[0];
      facts.latestReport = latest ? String(latest.title || "") : "";
    } catch (e) { console.error("landing facts (insights):", (e as Error).message); }
  }
  return { facts, picks: picksOf(g) };
}

/* WHO IS LOOKING LEFT THIS FILE (§380). It kept a copy of that rule under a
   comment NAMING the original — *"modules/insights/index.ts's own rule"* —
   which is §53.5 written down rather than closed. One answer now, in
   lib/library-viewer.ts, asked by the landing, by the module and by the tab's
   own stamp; this file's callers import it from there. */
