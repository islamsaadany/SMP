/* What the landing page shows, and where its doors lead (§148 on the new
   stack, spec 043's first screen group). The rows are the welcome screen's
   own — computed by the frozen readers in lib/frozen.cjs from the tenant's
   graph, read under withTenant() as smp_app — so this page cannot say one
   thing while the pages behind it say another (§53.5). */
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { registerKeyFor } from "./state-api.ts";
import { clientHref, DEFAULT_MODULE } from "./modules.ts";

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
export async function landingFor(tenantId: string, personKey: string | null, email?: string | null): Promise<Landing | null> {
  /* THE REGISTER, NOT THE MEMBERSHIP. A Forefront admin opens a client BY
     RULE and holds no membership row (door.ts's seatFor), so asking the
     membership told them they were not on the register while `people` held
     their row — see registerKeyFor's own note. Resolved read-only, inside
     the one transaction that reads the graph. */
  const read = await withTenant(tenantId, async (c) => ({
    graph: await readState(c),
    key: email ? await registerKeyFor(c, email, personKey) : personKey,
  }));
  const graph = read.graph;
  if (!graph) return null;
  const out = frozen.landing(graph, read.key || "");
  /* THE CHECK'S BREAKS (constitution XVI, the spike's --break shape, here as
     an environment switch because the page runs in a server): a build that
     lost the rows or the doors must turn checks/door-landing.mjs red before
     its green run is believed. Never set on a deployment. */
  const brk = process.env.SMP_BREAK || "";
  if (brk === "no-rows") out.acts = [];
  if (brk === "first-person") return frozen.landing(graph, "");
  /* the fault registerKeyFor closed: the landing asking the MEMBERSHIP,
     which a Forefront admin opening a client by rule does not have */
  if (brk === "membership-key") return frozen.landing(graph, personKey || "");
  return out;
}

/* A door's address inside this client: `/<slug>/<module>/<target>/<tab>`, a
   function spelt `fn/<key>` because a colon in a path segment is nobody's
   friend. Every door on the landing opens a STRATEGY page today, which is
   why the module is the default one rather than a parameter — when a second
   module puts a row on this screen, that row brings its own (spec 046 §7).

   SETUP CARRIES NO MODULE: it is one page for the whole client, a Client
   group and a group per module (spec 046 §4.5). */
export function doorHref(slug: string, go: Door): string {
  if (go.setup) return clientHref(slug, null, "setup/" + go.setup);
  const t = String(go.target || "group");
  const seg = t.startsWith("fn:") ? "fn/" + t.slice(3) : t;
  return clientHref(slug, DEFAULT_MODULE, seg + (go.tab ? "/" + go.tab : "") + (go.report ? "/reporting" : ""));
}
/* The intro round, offered by the landing and therefore reached from the
   spine (lib/modules.ts). */
export function tourHref(slug: string): string { return clientHref(slug, null, "tour"); }
/* The reverse, for a page that answers such an address. CALLERLESS since
   Phase B replaced the holder pages with the shell's own route — recorded
   rather than deleted here, because removing it is a tidy-up and not this
   change (§24 against §2b). If it is given a caller it must be handed the
   rest INSIDE the module (lib/modules.ts whereOf), never the raw path. */
export function targetOf(rest: string[]): string {
  if (rest[0] === "fn" && rest[1]) return "fn:" + rest[1];
  return rest[0] || "group";
}
export async function subjectLabel(tenantId: string, target: string): Promise<string> {
  const graph = await withTenant(tenantId, (c) => readState(c));
  return graph ? frozen.placeLabel(graph, target) : target;
}
