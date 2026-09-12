/* THE MODULE IN THE ADDRESS (spec 046 §7, landed before the cutover).

   A client's pages become `/<client>/<module>/<target>/<tab>[/<section>]`.
   Only Strategy exists today, so this changes nothing anybody can see — it
   is here now because nobody holds a bookmark yet, and after the cutover the
   same change means either breaking every saved link or special-casing
   Strategy for ever (spec 046 §7, Islam's call on 2026-09-11).

   TWO SEGMENTS STAY ON THE SPINE and are not a module's:
     · `setup`  — one Setup page for the whole client, a Client group and a
                  group per module (spec 046 §4.5, which REJECTS a Setup page
                  per module: an administrator sets several up in one sitting,
                  and the spine has to live somewhere inside no module);
     · `tour`   — the intro round, offered by the landing, which is spine too.
   `/<client>` itself is the landing and shows what is waiting across every
   module, so it never carries one either.

   THE LIST IS NAMED HERE AND NOWHERE ELSE. The browser is TOLD its module by
   the document it is served in (lib/shell.ts stamps `data-module`), so
   shell/route.js keeps no second copy of these words (§53.5). */

export const MODULES = ["strategy", "portfolio", "insights", "processes", "trial"] as const;
export type ModuleKey = (typeof MODULES)[number];

/* Where a client lands when the address names no module. */
export const DEFAULT_MODULE: ModuleKey = "strategy";

/* The two spine words, which a module name may never be. */
export const SPINE_SEGMENTS = ["setup", "tour"] as const;

/* ══ WHAT A MODULE SAYS ABOUT ITSELF (spec 046 §4.2) ═══════════════════
   The contract asks a module for its own navigation, roles, Setup group and
   landing. This is the part of it every surface needs today — the name a
   person reads and the one line under it — declared ONCE, so a fifth module
   is an entry here rather than an edit in the console, the switcher and
   Setup, which is how two screens come to spell one module differently
   (§53.5).

   `built` IS NOT A PREFERENCE, IT IS WHAT STOPS A DOOR OPENING ONTO THE
   WRONG ROOM. A module nobody has built is a word the address resolves with
   nothing behind it: offered today, Portfolio would open the STRATEGY
   platform wearing another name, which is worse than not offering it at all
   (§61). So the three unbuilt ones keep their entries — the words stay
   reserved and isModule() must go on knowing them, or a business unit keyed
   `portfolio` would quietly claim the address the day the module lands — and
   nobody is offered them until there is something to open. */
export type ModuleDef = { label: string; note: string; built: boolean };
export const MODULE_DEF: Record<ModuleKey, ModuleDef> = {
  strategy:  { label: "Strategy",  note: "Plans, measures, reporting and the review",        built: true  },
  portfolio: { label: "Portfolio", note: "Detailed projects, timelines and checkpoints",     built: false },
  insights:  { label: "Insights",  note: "Research, analytics and market reports",           built: false },
  processes: { label: "Processes", note: "How things are done here",                         built: false },
  /* DELIBERATELY NOT A PRODUCT NAME (Islam, 2026-09-12: "something even for
     the trial"). It exists to prove a module can be turned on for one client
     and opened, and it says so in its own line, so nobody can mistake it for
     something the client bought. */
  trial:     { label: "Trial",     note: "Says hello and names the client. Proves a module can be turned on.", built: true },
};

export function isModule(s: unknown): s is ModuleKey {
  return typeof s === "string" && (MODULES as readonly string[]).includes(s);
}
export function isSpineSegment(s: unknown): boolean {
  return typeof s === "string" && (SPINE_SEGMENTS as readonly string[]).includes(s);
}

/* ══ WHICH MODULES A CLIENT HAS (spec 046 §4.5) ════════════════════════
   Stored on the client's own registry row and read HERE, so the card, the
   address, the switcher and Setup cannot disagree about it (§53.5). What is
   stored is a list of words somebody chose weeks ago; what comes back is a
   list this code can stand behind, and the three differences are each a way
   a stored list goes wrong:

     · THE ORDER IS MODULES', never the order they were switched on, so two
       clients holding the same modules read the same way round and a row
       cannot move under somebody because of when it was bought;
     · AN UNKNOWN OR UNBUILT WORD IS DROPPED. A stored word is not a promise
       the code still honours it: a module retired later must not make a
       client unopenable, and one not yet built must not be reachable by a
       list written in hope;
     · THE DEFAULT IS ALWAYS IN IT, because it is where an address naming no
       module lands (whereOf below) — a client without it could not be opened
       at its own front door, so the drawer says "Always on" rather than
       drawing a control that must not be pressed (§94.15). */
export function modulesFor(stored: unknown): ModuleKey[] {
  const want = new Set<string>(Array.isArray(stored) ? stored.filter((s) => typeof s === "string") : []);
  /* THE CHECK'S BREAKS (constitution XVI, lib/landing.ts's own shape): a
     build that stopped dropping an unbuilt module, or stopped reading the
     client's list at all, must turn checks/modules.mjs red before its green
     run is believed (§94.5). Never set on a deployment. */
  const brk = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";
  if (brk === "any-module") return MODULES.filter((k) => k === DEFAULT_MODULE || want.has(k));
  return MODULES.filter((k) => k === DEFAULT_MODULE || (want.has(k) && MODULE_DEF[k].built));
}

/* What a consultant may turn on, and what the drawer draws a row for: the
   built ones, in MODULES' order, the default among them so it can say it is
   always on rather than leaving a gap where a row would be (§45.2). */
export function offerable(): ModuleKey[] {
  return MODULES.filter((k) => MODULE_DEF[k].built);
}

/* What an address after the client's slug names: the module it is in, and
   the rest of the path inside it. A spine segment is in NO module and says
   so with `null`, or Setup would be pushed under whichever module happened
   to be first. An address naming neither is the OLD form — `module` is the
   default and `legacy` is true, which is what the route 302s on.

   THE FIRST SEGMENT DECIDES, by position and never by the word: a business
   unit keyed `strategy` sits at /<client>/strategy/strategy/plan and is read
   correctly. The one casualty is the back-compat redirect, where such a unit's
   old address is indistinguishable from a new-form one — stated rather than
   given machinery, because the redirect exists for links made before today.

   AND A MODULE THIS CLIENT DOES NOT HAVE IS NOT A MODULE IN ITS ADDRESS.
   `have` is the client's own list (modulesFor above); a word outside it
   falls through to the LEGACY branch rather than to a refusal of its own, so
   /<client>/portfolio is read exactly as any other word the client does not
   hold — redirected once and landed on the person's own first page. One
   behaviour for "that is not a thing here", rather than a second refusal
   that has to be worded, tested and kept in step with the first.
   `have` DEFAULTS TO THE DEFAULT ALONE, never to every module: a caller that
   forgets to say gets the narrow answer, which is the safe direction (§42). */
export type Where = { module: ModuleKey | null; rest: string[]; legacy: boolean };
export function whereOf(rest: string[], have?: ModuleKey[]): Where {
  const seg = (rest || []).filter(Boolean);
  const mine: readonly ModuleKey[] = have && have.length ? have : [DEFAULT_MODULE];
  if (isSpineSegment(seg[0])) return { module: null, rest: seg, legacy: false };
  const brk = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";
  if (brk === "open-address" && isModule(seg[0])) return { module: seg[0], rest: seg.slice(1), legacy: false };
  if (isModule(seg[0]) && mine.includes(seg[0])) return { module: seg[0], rest: seg.slice(1), legacy: false };
  return { module: DEFAULT_MODULE, rest: seg, legacy: true };
}

/* The address of a path inside a client, written in one place. `rest` is
   already spelt the way the shell reads it (a function as `fn/<key>`). */
export function clientHref(slug: string, module: ModuleKey | null, rest: string): string {
  const tail = String(rest || "").replace(/^\/+/, "");
  return "/" + slug + (module ? "/" + module : "") + (tail ? "/" + tail : "");
}

/* The one line a module says about a client on its card (spec 046 §4.6a).
   Strategy's is what the card already reads; a module with nothing to say
   draws its name alone, which is `""` and never a placeholder. `have` is the
   client's own list, so the card cannot offer a door the address refuses. */
export type ModuleRow = { key: ModuleKey; label: string; state: string };
export function moduleRows(have: ModuleKey[], facts: { unreadable?: boolean; cycleOpen?: boolean | null; planned?: boolean | null }): ModuleRow[] {
  return have.map((k) => ({
    key: k,
    label: MODULE_DEF[k].label,
    state: k !== "strategy" ? ""
      : facts.unreadable ? "not answering"
      : facts.cycleOpen ? "cycle open"
      : facts.planned === false ? "no plan yet"
      : "",
  }));
}
