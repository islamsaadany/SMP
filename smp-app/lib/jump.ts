/* ── JUMP TO: WHAT IT LISTS, FOR WHOM (§701) ───────────────────────────────
   Islam, of the HR platform's own: *"the jump to concept"*, then of the
   mockup (design-mockups/jump-to-offline/), *"it should only cover the other
   modules and the settings but not the functions or the pages inside the
   strategy module itself"*, and *"build it"*.

   And, round three, of the Processes sections and the console's tabs: *"no
   need for internal parts of the modules. and for the console the same
   thing"*.

   SO THE LIST IS THREE KINDS OF THING, AND ONLY THESE:
     · the modules this person may open, each as ONE entry — never the tabs,
       units, views or sections inside one (its own navigation reaches them);
     · Setup's pages, the client's and each module's;
     · the console, as one entry, for Forefront's own people.

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
import { isOffice } from "./tracker.ts";
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
const SETUP_INSIGHTS: [string, string][] = [["landing", "Landing line"]];   /* §702: its Roles & access is gone */

/* THE CONSOLE IS ONE ENTRY, as Strategy is (Islam, round three: *"the same
   thing"* for the console as for the modules' insides): its tabs are its
   own column's to reach. Forefront's people only. */
function consoleItem(): JumpItem {
  return { name: "Console", where: "Forefront", href: "/platform", group: "Console" };
}

function moduleItems(slug: string, open: ModuleKey[], setup: boolean): JumpItem[] {
  const out: JumpItem[] = [];
  const mods = open.filter(shownOutside);
  for (const k of mods) out.push({ name: MODULE_DEF[k].label, where: "Module", href: clientHref(slug, k, ""), group: "Modules" });
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
  /* the console's own rule for the client's settings, asked through the
     console's own code */
  const ff = consultant
    ? await platformAction(pool as never, user, { action: "jump", client: slug })
    : null;
  const facts = ff && ff.code === 200 ? (ff.body as { canConfig?: boolean }) : {};
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
  if (consultant) items.push(consoleItem());
  return items;
}
