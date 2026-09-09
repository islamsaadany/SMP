/* What the landing page shows, and where its doors lead (§148 on the new
   stack, spec 043's first screen group). The rows are the welcome screen's
   own — computed by the frozen readers in lib/frozen.cjs from the tenant's
   graph, read under withTenant() as smp_app — so this page cannot say one
   thing while the pages behind it say another (§53.5). */
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";

const frozen = createRequire(import.meta.url)("./frozen.cjs") as {
  landing: (graph: unknown, personKey: string) => Landing;
  placeLabel: (graph: unknown, target: string) => string;
};

export type Door = { target?: string; tab?: string; report?: boolean; setup?: string };
export type Act = { title: string; sub: { text: string; kind: "em" | "alert" | "plain" }[]; btn: string; cta: boolean; go: Door };
export type Landing = {
  known: boolean; org: string; initials: string;
  office?: boolean; name?: string; chips?: { role: string; where: string }[];
  review?: { name: string; open: boolean } | null;
  cycle?: { name: string; open: boolean; done: number; total: number; sub: number; progress: number; none: number; meta: string } | null;
  acts?: Act[]; pages?: { label: string; small: string; go: Door }[];
  tour?: boolean; home?: string | null; continueWord?: string;
};

/* null when the tenant holds no graph yet (a client made and never seeded). */
export async function landingFor(tenantId: string, personKey: string | null): Promise<Landing | null> {
  const graph = await withTenant(tenantId, (c) => readState(c));
  if (!graph) return null;
  const out = frozen.landing(graph, personKey || "");
  /* THE CHECK'S BREAKS (constitution XVI, the spike's --break shape, here as
     an environment switch because the page runs in a server): a build that
     lost the rows or the doors must turn checks/door-landing.mjs red before
     its green run is believed. Never set on a deployment. */
  const brk = process.env.SMP_BREAK || "";
  if (brk === "no-rows") out.acts = [];
  if (brk === "first-person") return frozen.landing(graph, "");
  return out;
}

/* A door's address inside this client: `/<slug>/<target>/<tab>`, a function
   spelt `fn/<key>` because a colon in a path segment is nobody's friend.
   Every page behind a door is the NEXT screen group's; the address is
   already the one it will answer at. */
export function doorHref(slug: string, go: Door): string {
  if (go.setup) return "/" + slug + "/setup/" + go.setup;
  const t = String(go.target || "group");
  const seg = t.startsWith("fn:") ? "fn/" + t.slice(3) : t;
  return "/" + slug + "/" + seg + (go.tab ? "/" + go.tab : "") + (go.report ? "/reporting" : "");
}
/* The reverse, for the page that answers such an address. */
export function targetOf(rest: string[]): string {
  if (rest[0] === "fn" && rest[1]) return "fn:" + rest[1];
  return rest[0] || "group";
}
export async function subjectLabel(tenantId: string, target: string): Promise<string> {
  const graph = await withTenant(tenantId, (c) => readState(c));
  return graph ? frozen.placeLabel(graph, target) : target;
}
