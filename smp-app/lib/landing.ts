/* What the landing page shows, and where its doors lead (§148 on the new
   stack, spec 043's first screen group). The rows are the welcome screen's
   own — computed by the frozen readers in lib/frozen.cjs from the tenant's
   graph, read under withTenant() as smp_app — so this page cannot say one
   thing while the pages behind it say another (§53.5). */
import { createRequire } from "node:module";
import { withTenant } from "./tenant.ts";
import { readState } from "./state-io.ts";
import { registerKeyFor } from "./state-api.ts";
import { clientHref, DEFAULT_MODULE, MODULE_DEF, modulesFor, landingLine, isModule, NO_FACTS, type ModuleKey, type LandingFacts } from "./modules.ts";
import { landingFactsFor, viewerFor } from "./landing-facts.ts";

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

/* ══ THE CLIENT SETUP BLOCK AND YOUR MODULES (spec 054 §4.1, §9.3) ═══════
   What the landing draws BESIDE the frozen readers' rows, computed here and
   never in the page, so a check can ask this function and the page the same
   question (§53.5, §94.8).

   THE BLOCK IS THE SUPER USER'S AND NOBODY ELSE'S — absent, never disabled
   (§61) — and the seat is THE ONE THE DOOR RESOLVED (door.ts resolveTenant):
   a Forefront admin opening a client they hold no seat on holds its Super
   user seat by rule (seatFor, §339), so they see it too, which is right, since
   they are the one person who can set that client up. It is asked of the
   SEAT and never of the register's role, because the seat is what the
   platform holds about who may configure this client (spec 054 §4.4).

   SIX DOORS ONTO EXISTING PAGES, each at its spine address
   `/<client>/setup/<page>` (research R2: the shell moves a spine-form door to
   the page's own rail, so this list keeps no copy of which page sits where).
   Organisation is one door onto four pages — four doors for the shape of the
   business would make the block longer than the list it sits beside, and the
   four are one errand (§32 the other way round). Two doors name a PLACE ON a
   page with a hash the shell honours (shell/route.js): Access opens the
   register at its seat column (`#seat` — the seats and where each person
   sits are already set there, §33/§186, and a second surface onto one fact
   is §110's pair), and Email opens the email settings, which today are the
   third section of Strategy's Send an email page (`send#comms`, §135) —
   spec 054's own table calls them "the email half of brand", which the
   product does not hold; recorded rather than silently realigned (§356.3).

   YOUR MODULES is one row per module the client HAS (modulesFor — the
   registry's own reader, so a module switched off takes its row with it,
   spec 054 §4.2), in MODULES' order, each opening the module at its own
   address and carrying its landing line (landingLine, filled by step 4). A
   client with one module still sees the row: a list that appeared at two
   would be a screen that changes shape on the day a module is added. */
export type SetupDoor = { key: string; label: string; sub: string; href: string };
export type ModuleLine = { key: ModuleKey; label: string; line: string; href: string };
export type LandingShape = { clientSetup: SetupDoor[] | null; modules: ModuleLine[] };
export function landingShape(slug: string, seat: string | null | undefined, stored: unknown,
                             lines: { facts: LandingFacts; picks: Record<string, string> } = { facts: NO_FACTS, picks: {} },
                             /* the modules this person may OPEN (lib/access.ts openableModules,
                                §356.5) — null means every module the client has, which is the
                                seat's answer and the checks' pure one */
                             open: readonly ModuleKey[] | null = null): LandingShape {
  const brk = process.env.SMP_BREAK || "";
  const door = (key: string, label: string, sub: string, page: string) =>
    ({ key, label, sub, href: clientHref(slug, null, "setup/" + page) });
  const doors: SetupDoor[] = [
    door("people",  "People",         "The register",                                  "people"),
    door("access",  "Access",         "Seats, and where each person sits",             "people#seat"),
    door("org",     "Organisation",   "Companies, units, functions, Official BU list", "companies"),
    door("brand",   "Branding",       "Colours and the mark",                          "brand"),
    door("email",   "Email",          "Sender name, reply-to, footer",                 "send#comms"),
    door("kb",      "Knowledge base", "The platform\u2019s own explanations",           "kb"),
  ];
  /* THE CHECK'S BREAKS (constitution XVI): a build that drew the block for
     every seat, or stopped reading the client's own module list, must turn
     checks/door-landing.mjs red before its green run is believed (§94.5). */
  const clientSetup = brk === "setup-any-seat" || seat === "super" ? doors : null;
  const have = (brk === "modules-unread" ? [DEFAULT_MODULE] : modulesFor(stored))
    .filter((k) => !open || open.includes(k));
  const modules: ModuleLine[] = have.map((k) => ({
    key: k, label: MODULE_DEF[k].label, line: landingLine(k, lines.picks[k], lines.facts), href: clientHref(slug, k, ""),
  }));
  return { clientSetup, modules };
}

/* THE LANDING LINE PAGE'S STAMP (spec 054 §4.5, §356.4): what the module the
   document is served for can say, each line with its example AND its text
   right now, and the client's pick — written onto the Setup document as
   `data-landing` (lib/shell.ts) for the frozen renderLandingLine() to draw
   from. The frozen shell cannot import a module's declaration, and the
   sentence's TEXT is computed by the one reader on the server, so the page's
   preview is that reader's answer and never a second one (§53.5). */
export type LandingStamp = { module: ModuleKey; pick: string; lines: { key: string; label: string; example: string; text: string }[] };
export async function landingStampFor(tenantId: string, module: string, seat: string | null | undefined, personKey: string | null | undefined, stored: unknown): Promise<LandingStamp | null> {
  if (!isModule(module)) return null;
  const { facts, picks } = await landingFactsFor(tenantId, modulesFor(stored), await viewerFor(tenantId, seat, personKey));
  return {
    module,
    pick: picks[module] || "",
    lines: MODULE_DEF[module].lines.map((l) => ({ key: l.key, label: l.label, example: l.example, text: l.read(facts) })),
  };
}

/* A door's address inside this client: `/<slug>/<module>/<target>/<tab>`, a
   function spelt `fn/<key>` because a colon in a path segment is nobody's
   friend. Every door on the landing opens a STRATEGY page today, which is
   why the module is the default one rather than a parameter — when a second
   module puts a row on this screen, that row brings its own (spec 046 §7).

   A SETUP DOOR IS WRITTEN IN THE SPINE FORM WHATEVER MODULE OWNS THE PAGE
   (spec 054 §4.1, research R2): `/<client>/setup/<page>` is a request, and
   the shell moves it to the page's own module — Strategy's Reporting cycle
   ends at `/<client>/strategy/setup/cycle` — so this file keeps no copy of
   which page belongs to which rail (§53.5). */
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
