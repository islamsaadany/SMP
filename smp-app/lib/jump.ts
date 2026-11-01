/* ── JUMP TO: WHAT IT LISTS, FOR WHOM (§699) ───────────────────────────────
   Islam, of the HR platform's own: *"the jump to concept"*, then of the
   mockup (design-mockups/jump-to-offline/), *"it should only cover the other
   modules and the settings but not the functions or the pages inside the
   strategy module itself"*, and *"build it"*.

   SO THE LIST IS FOUR KINDS OF THING, AND ONLY THESE:
     · the modules this person may open — Strategy as ONE entry, never its
       tabs, units or functions (its own row already reaches them);
     · the pages inside the other modules (the Tracker's views, Processes'
       sections);
     · Setup's pages, the client's and each module's;
     · the console's tabs, for Forefront's own people.

   ASKED OF THE SERVER, NOT WORKED OUT IN THE BROWSER, because "only what
   your role can open" is the door's question and the door is here (§42,
   §53.5). The modules are `openableModules` — the switcher's own answer, so
   Jump to can never offer a module the switcher hides. Setup is offered to
   whoever the console would let read the client's settings (a consultant,
   platform-rules mayReadConfig) and to a client's own Super user or SMO team
   seat; a client person with no seat is offered none of it. That is the
   narrower reading: a seatless person granted a Setup page by the matrix
   still reaches it from the rail, and Jump to simply does not list it.

   The list is the signed-in person's, never a viewed person's: Viewing as
   only narrows, and a jump is a press that leaves the page anyway. */
import type { SessionUser } from "./auth.ts";
import { resolveTenant } from "./door.ts";
import { openableModules } from "./access.ts";
import { MODULE_DEF, clientHref, shownOutside, type ModuleKey } from "./modules.ts";
import { VIEWS, VIEW_WORD, isOffice } from "./tracker.ts";
import { platformAction } from "./platform-api.ts";

export type JumpItem = { name: string; where: string; href: string; group: string };
type Q = Parameters<typeof resolveTenant>[0];

/* Setup's pages, as the frozen rail names them (shell.js, the setup rail's
   rows: `k`, `mod`, `label`). Companies is left out: it is drawn only for a
   client shaped as a group of companies, and a jump to a page the rail would
   not draw lands on the rail's first page instead. */
const SETUP_CLIENT: [string, string][] = [
  ["start", "Profile"], ["shape", "The shape"], ["units", "Business units"], ["fns", "Functions"],
  ["caps", "Capabilities"], ["mainbu", "Official BU list"], ["people", "Client register"],
];
const SETUP_STRATEGY: [string, string][] = [
  ["access", "Roles & access"], ["landing", "Landing line"], ["sets", "Figure sets"], ["focusset", "Focus measures"],
  ["bands", "Scoring bands"], ["seasons", "Revenue drivers"], ["cycle", "Planning & reporting"],
  ["chat", "Platform Inbox"], ["history", "History"],
];
const SETUP_INSIGHTS: [string, string][] = [["access", "Roles & access"], ["landing", "Landing line"]];

/* Processes' sections, as its own band names them (ffp/lib/i18n/messages/en.ts). */
const PROCESSES: [string, string][] = [
  ["processes", "All processes"], ["handle", "To handle"], ["value-chain", "Value chain"],
  ["helicopter", "Helicopter view"], ["priorities", "Priorities"], ["governance", "Governance"],
  ["export", "Export"], ["roles", "Job roles"], ["read", "Staff view"],
];

/* The console's tabs (public/platform-page.js `tabs`), two of them gated. */
function consoleItems(f: { canConsultants: boolean; canAccess: boolean }): JumpItem[] {
  const tabs: [string, string, boolean][] = [
    ["home", "Home", true], ["mywork", "My tasks", true], ["clients", "Clients", true],
    ["consultants", "Consultants", f.canConsultants], ["access", "Who sees what", f.canAccess],
    ["memory", "Track Record", true], ["frameworks", "Frameworks", true],
    ["copilot", "Copilot settings", true], ["history", "History", true],
  ];
  return tabs.filter((t) => t[2]).map((t) => ({ name: t[1], where: "Console", href: "/platform#" + t[0], group: "Console" }));
}

function moduleItems(slug: string, open: ModuleKey[], setup: boolean): JumpItem[] {
  const out: JumpItem[] = [];
  const mods = open.filter(shownOutside);
  for (const k of mods) out.push({ name: MODULE_DEF[k].label, where: "Module", href: clientHref(slug, k, ""), group: "Modules" });
  for (const k of mods) {
    const label = MODULE_DEF[k].label;
    if (k === "tracker")
      for (const v of VIEWS) out.push({ name: VIEW_WORD[v], where: label, href: clientHref(slug, k, "") + "?view=" + v, group: label });
    if (k === "processes")
      for (const [p, n] of PROCESSES) out.push({ name: n, where: label, href: clientHref(slug, k, p), group: label });
  }
  if (setup) {
    const s = (scope: ModuleKey | null, rows: [string, string][], where: string) =>
      rows.forEach(([p, n]) => out.push({ name: n, where, href: clientHref(slug, scope, "setup/" + p), group: "Setup" }));
    s(null, SETUP_CLIENT, "Setup · Client");
    if (mods.includes("strategy")) s("strategy", SETUP_STRATEGY, "Setup · Strategy");
    if (mods.includes("insights")) s("insights", SETUP_INSIGHTS, "Setup · Insights");
    /* No "<module> settings" row for the Tracker, Notes, Portfolio or
       Processes: none of them has a Setup page of its own yet, and their
       `/<module>/setup` address lands on the shell's remembered place
       instead — measured, 2026-11-01. A jump must land where it says. */
  }
  return out;
}

export async function jumpList(pool: Q, user: SessionUser, slug: string | null): Promise<JumpItem[]> {
  const consultant = user.kind !== "client";
  /* the console's own rules, asked through the console's own code, so the
     two gated tabs and the settings answer exactly as the console does */
  const ff = consultant
    ? await platformAction(pool as never, user, { action: "jump", client: slug })
    : null;
  const facts = ff && ff.code === 200 ? (ff.body as { canConsultants?: boolean; canAccess?: boolean; canConfig?: boolean }) : {};
  const items: JumpItem[] = [];
  if (slug) {
    const ans = await resolveTenant(pool, user, slug);
    if (ans.ok) {
      /* SMP_BREAK=jump-office-for-all hands everybody the office's list,
         which must turn checks/jump.mjs red (§94.5). Never set on a
         deployment. */
      const office = process.env.SMP_BREAK === "jump-office-for-all" || isOffice(ans.seat);
      /* The Tracker and Meeting Notes are the office's: the switcher's list
         holds them for anybody (they declare no area), and their own pages
         turn a client's person away at the door (modules/tracker,
         modules/notes, both on isOffice). Jump to asks the door's question,
         so a page that would only refuse is not offered (§61). */
      const open = (await openableModules(ans.tenant.id, ans.seat, ans.personKey, ans.tenant.modules))
        .filter((k) => office || (k !== "tracker" && k !== "notes"));
      items.push(...moduleItems(slug, open, consultant ? !!facts.canConfig || office : office));
    }
  }
  if (consultant) items.push(...consoleItems({ canConsultants: !!facts.canConsultants, canAccess: !!facts.canAccess }));
  return items;
}
