/* THE MODULE IN THE ADDRESS (spec 046 §7, landed before the cutover).

   A client's pages become `/<client>/<module>/<target>/<tab>[/<section>]`.
   Only Strategy exists today, so this changes nothing anybody can see — it
   is here now because nobody holds a bookmark yet, and after the cutover the
   same change means either breaking every saved link or special-casing
   Strategy for ever (spec 046 §7, Islam's call on 2026-09-11).

   TWO SEGMENTS STAY ON THE SPINE and are not a module's:
     · `setup`  — the CLIENT'S Setup: the pages that belong to no module
                  (people, the organisation, branding, the knowledge base).
                  A module's own Setup is `/<client>/<module>/setup/…`, which
                  reads as that module with `setup` inside it (spec 056 §4.2,
                  REVERSING spec 046 §4.5's one page for the whole client:
                  Islam, 2026-09-15, each module has its own setup elements,
                  its access and its landing line);
     · `tour`   — the intro round, offered by the landing, which is spine too.
   `/<client>` itself is the landing and shows what is waiting across every
   module, so it never carries one either.

   THE LIST IS NAMED HERE AND NOWHERE ELSE. The browser is TOLD its module by
   the document it is served in (lib/shell.ts stamps `data-module`), so
   shell/route.js keeps no second copy of these words (§53.5). */

export const MODULES = ["strategy", "portfolio", "insights", "processes", "tracker", "notes"] as const;
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
   (§61). So the unbuilt ones keep their entries — the words stay
   reserved and isModule() must go on knowing them, or a business unit keyed
   `portfolio` would quietly claim the address the day the module lands — and
   nobody is offered them until there is something to open. */
/* ── A MODULE'S OWN AREAS (spec 046 §4.2, §4.4; spec 053 §4.5) ─────────
   The contract's second line — *its own roles and areas* — answered HERE
   rather than in a file of its own, because this is already where a module
   says what it is called and whether it is built: a second place would be
   the fourth thing to edit the day a module is added, which is how two
   screens come to spell one module differently (§53.5).

   AND IT MUST NOT BE AN EDIT TO THE CLIENT'S MATRIX, for a reason that is
   mechanical rather than tidy: `lib/rules.cjs` is a CARRIED copy of the
   frozen `lib/rules.js` and `checks/generated-in-step.mjs` asserts the two
   are identical after one declared transform (§335). Adding a module's area
   to the carried copy alone turns that check red; adding it to both puts a
   module's area into the frozen Strategy product, where it does not belong.

   `states` IS TWO AND NOT THREE where nobody in the client's app writes: an
   `edit` there would be a grant with nothing behind it (§94.15).

   STRATEGY DECLARES NONE, AND THAT IS AN ANSWER RATHER THAN A GAP: its areas
   ARE the frozen matrix's, which is the one place they may live (above), and
   listing them again here would be that second copy. A module with nothing
   for a client to be granted separately declares none too.

   WHAT READS THIS TODAY IS `checks/modules.mjs` AND NOTHING ELSE, said here
   rather than left to be discovered (§54.5, §24). The tab that would SET a
   narrowing is spec 046 §4.4's Access page — one page, a Client tab and a tab
   per module — which is not built; until it is, every role holds the default
   below, which for Insights is `view`, so the module opens for everybody in
   the client exactly as decided (spec 053 §4.5, §7.2). Declaring it now is
   what stops the answer being invented a second time when that page lands
   (§42's drift, from in front). */
export type ModuleArea = { key: string; label: string; note: string; states: string[]; shipped: string };
/* ── THE LANDING LINE (spec 056 §4.5, §359.4) ───────────────────────
   Each module DECLARES the sentences it can say about itself: a key, the
   label the module's Landing line page offers, an example for that page, and
   a reader that makes the sentence out of facts the module already has
   (lib/landing-facts.ts). The client picks ONE key per module on that page;
   the pick is stored on the group under SMPRules.LANDING_PICK (shared, so
   the authoriser and the browser spell it once) and the FIRST declared line
   is the default, so an unchosen module still says something. NEVER FREE
   TEXT: a typed line goes stale the day the fact behind it changes, and the
   whole reason for the line is that it is true today. `none` draws the
   module's row with no line under it and is declared like the rest, so it is
   a choice rather than an absence. A facts field the reader cannot see
   (null) reads as the honest sentence for not knowing, never as nought. */
export type LandingFacts = {
  cycleOpen: boolean | null; cycleName: string; due: string;
  total: number | null; sub: number | null;
  newReports: number | null; latestReport: string;
};
export type LineDef = { key: string; label: string; example: string; read: (f: LandingFacts) => string };

/* ── WHAT A MODULE MARKS ON A CLIENT'S CARD (§368) ─────────────────────
   Islam, of the console's cards: "we don't needs notes that take 2 lines we
   can just have a notificaiton here if something is new to check ... to keep
   it neat and clean nad let's make it compact." Answered with a MARK rather
   than a sentence, from a mockup he signed off (design-mockups/
   client-card-rows/2026-09-17_a-mark-not-a-sentence.html, option A).

   THE MARK SAYS WHAT IS OUTSTANDING, AND NOTHING WHEN NOTHING IS — which is
   the whole of why the cards get shorter without anything being squeezed:
   silence is the resting state. Counted off his own screenshot, nine pieces
   of text sat on nine rows and five of them said that nothing was happening.

   AND IT IS FOREFRONT'S OWN ANSWER, NOT THE CLIENT'S PICK (his, chosen with
   the cost stated). The landing line lets a client choose the WORDING of a
   sentence about themselves; this card exists so a consultant can decide
   which client to open next, so it always says the thing that decides that.
   `lines` and this are two different questions now and are declared apart —
   `moduleRows` no longer reads a pick at all, which `checks/modules.mjs`
   asserts at both ends (a pick moving must NOT move a mark).

   `alarm` IS THE TWO THINGS THAT MEAN SOMETHING IS BROKEN rather than busy —
   *not answering* and *no plan yet* — and is what the row paints in the
   warning ink. A count is not an alarm however large it is.

   `tip` IS THE WHOLE SENTENCE, for the hover: the mark is the fact in the
   fewest words, so this is a nicety and never the only copy of it (a hover
   is unreachable on a tablet, where pressing the row opens the module —
   stated rather than solved).

   DECLARED PER MODULE, beside `lines`, for the reason MODULE_DEF exists: a
   fifth module is an entry here rather than an edit in the console (§53.5).
   A module with nothing to mark declares none, which is `undefined` and
   never a function returning a placeholder. */
export type CardFacts = { unreadable?: boolean; cycleOpen?: boolean | null; planned?: boolean | null; landing?: LandingFacts | null };
export type Mark = { mark: string; alarm?: boolean; tip?: string };
export type MarkDef = (f: CardFacts) => Mark | null;

/* WORST FIRST, and every branch that cannot READ its fact answers null —
   absent is never nought (§35, §93). A cycle known open whose counts cannot
   be read says *Cycle open* rather than nothing, or an unreadable count
   would be indistinguishable from nothing owed. */
const STRATEGY_MARK: MarkDef = (f) => {
  if (f.unreadable) return { mark: "Not answering", alarm: true, tip: "This client's platform did not answer" };
  if (f.planned === false) return { mark: "No plan", alarm: true, tip: "No plan has been built for this client yet" };
  if (f.cycleOpen !== true) return null;
  const g = f.landing;
  const due = g && g.due ? " · reports due " + g.due : "";
  if (!g || g.total === null || g.sub === null) return { mark: "Cycle open", tip: "Cycle open" + due };
  const owed = g.total - g.sub;
  if (owed <= 0) return null;
  return { mark: owed + " of " + g.total, tip: "Cycle open" + due + " · " + owed + " of " + g.total + " still to submit" };
};
const INSIGHTS_MARK: MarkDef = (f) => {
  const g = f.landing;
  if (!g || g.newReports === null || g.newReports <= 0) return null;
  return { mark: g.newReports + " new",
    tip: g.newReports + " new report" + (g.newReports === 1 ? "" : "s") + " this month" };
};

export type ModuleDef = { label: string; note: string; built: boolean; areas: ModuleArea[]; lines: LineDef[]; mark?: MarkDef };
const NOTHING: LineDef = { key: "none", label: "Nothing", example: "The module is listed with no line under it", read: () => "" };
const STRATEGY_LINES: LineDef[] = [
  { key: "cycle", label: "The cycle\u2019s state", example: "Cycle open \u00b7 reports due 30 Sep",
    read: (f) => f.cycleOpen === null ? "" : !f.cycleOpen ? "No cycle open"
      : "Cycle open" + (f.due ? " \u00b7 reports due " + f.due : "") },
  { key: "waiting", label: "What is waiting", example: "3 of 10 units still to submit",
    read: (f) => f.cycleOpen === null || f.total === null || f.sub === null ? ""
      : !f.cycleOpen ? "No cycle open"
      : f.total - f.sub <= 0 ? "Every unit has submitted"
      : (f.total - f.sub) + " of " + f.total + " still to submit" },
  NOTHING,
];
const INSIGHTS_LINES: LineDef[] = [
  { key: "new", label: "New reports this month", example: "2 new reports this month",
    read: (f) => f.newReports === null ? "" : f.newReports === 0 ? "No new reports this month"
      : f.newReports + " new report" + (f.newReports === 1 ? "" : "s") + " this month" },
  { key: "latest", label: "The latest report, by name", example: "Latest: Egypt retail outlook, Q3",
    read: (f) => f.newReports === null ? "" : f.latestReport ? "Latest: " + f.latestReport : "No reports yet" },
  NOTHING,
];
export const MODULE_DEF: Record<ModuleKey, ModuleDef> = {
  strategy:  { label: "Strategy",  note: "Plans, measures, reporting and the review",        built: true,  areas: [], lines: STRATEGY_LINES, mark: STRATEGY_MARK },
  portfolio: { label: "Portfolio", note: "Detailed projects, timelines and checkpoints",     built: false, areas: [], lines: [NOTHING] },
  insights:  { label: "Insights",  note: "Research, analytics and market reports",           built: true,
    /* ONE AREA, because there is one thing to be granted: opening the
       library. Per-item visibility is spec 046 decision #15's deferral —
       *whole module, for now* — and a second area for it now would be a
       column nobody could fill (§61). The shipped state is a DEFAULT and not
       a floor: a library Forefront chose to publish to a client is for that
       client, and their Super user narrows it on the table the day there is
       one; an absent key falls back here, because absent means *not answered
       yet* and never *no* (§30.2). */
    areas: [{ key: "a_insights", label: "Insights",
              note: "Open the library and download what is in it",
              states: ["view", "none"], shipped: "view" }],
    lines: INSIGHTS_LINES, mark: INSIGHTS_MARK },
  processes: { label: "Processes", note: "How things are done here",                         built: false, areas: [], lines: [NOTHING] },
  /* THE OFFICE'S OWN LIST ABOUT THIS CLIENT (spec 054). Built, and NO AREA:
     it is opened by the seat and by nothing a client could be granted
     (decision 2) — the way Inbox and Setup are — so a column here would be a
     cell nobody should fill (§61). The day a client person needs in is the
     day this gains one. Two words on the switcher, Islam's, because the
     second says who it is for. */
  tracker:   { label: "Internal Tracker", note: "The office's weekly actions about this client", built: true, areas: [], lines: [NOTHING] },
  /* ONE MEETING, ONE NOTE, AND THE MINUTES AS AN EMAIL (spec 055). Built,
     and NO AREA for the tracker's reason: it is the office's own record of
     this client, opened by the seat. The attendees get an email and never
     open it. The word is Islam's to change (decision 11). */
  notes:     { label: "Meeting Notes",     note: "Notes taken in a meeting, refined into minutes and sent to the attendees", built: true, areas: [], lines: [NOTHING] },
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

/* WHAT THE SWITCHER LISTS (spec 046, E1). One answer for both places that
   draw it — the shell's top bar (shell/route.js, through the document's
   `data-modules`) and a module's own bar (modules/insights/page.ts) — because
   a label invented at a call site is how two screens come to spell one module
   differently (§53.5). */
export type ModuleMenuItem = { key: ModuleKey; label: string; note: string };
export function moduleMenu(have: ModuleKey[]): ModuleMenuItem[] {
  return have.map((k) => ({ key: k, label: MODULE_DEF[k].label, note: MODULE_DEF[k].note }));
}

/* The one line a module says about a client on its card (spec 046 §4.6a).
   Strategy's is what the card already reads; a module with nothing to say
   draws its name alone, which is `""` and never a placeholder. `have` is the
   client's own list, so the card cannot offer a door the address refuses. */
/* ── WHICH MODULES FOREFRONT WORKS ON RATHER THAN WALKS INTO (spec 053) ──
   A library is published BY US and read by the client (spec 046 §4.9), so a
   consultant pressing its row on a client's card belongs in the publishing
   room in this console — not in the client's own read-only page, which is the
   one place they can do nothing at all. Strategy's row goes the other way,
   into the client's platform, because that IS where the work is.

   NAMED HERE for the reason every other module fact is: the card, the address
   and Setup ask one place what a module is (§53.5). The card reads the flag
   off the row the server sent it and decides nothing itself. */
export const LIBRARY_MODULES: readonly ModuleKey[] = ["insights", "processes"];
export function isLibrary(k: unknown): boolean {
  return typeof k === "string" && (LIBRARY_MODULES as readonly string[]).includes(k);
}

/* THE LINE A MODULE SAYS, from its declaration, the client's pick and the
   facts — ONE reader for the console's card and the client's landing
   (§53.5). An unknown or absent pick is the first declared line, which is
   the default; a facts object the caller could not read gives every line
   the empty string, so a module whose facts are unreadable says nothing
   rather than guessing (§35). */
export const NO_FACTS: LandingFacts = { cycleOpen: null, cycleName: "", due: "", total: null, sub: null, newReports: null, latestReport: "" };
export function lineDef(k: ModuleKey, pick: string | null | undefined): LineDef {
  const lines = MODULE_DEF[k].lines;
  return lines.find((l) => l.key === pick) || lines[0];
}
export function landingLine(k: ModuleKey, pick: string | null | undefined, facts: LandingFacts | null | undefined): string {
  return lineDef(k, pick).read(facts || NO_FACTS);
}

export type ModuleRow = { key: ModuleKey; label: string; mark: string; alarm: boolean; tip: string; room: boolean };
/* ONE MARK PER ROW, AND NOTHING WHEN THERE IS NOTHING (§368).
   REVERSING the pair this returned before — a `line` (the client's chosen
   sentence) and a `state` (the card's own health word) — which is recorded
   as a reversal rather than overwritten, because both were right on their
   own terms and what was never asked is what they did to each other: on a
   client with a cycle running the two said the SAME FACT TWICE ("Cycle open"
   in the line and "cycle open" beside it), and it was that duplicate the
   row could not fit on one line.

   The mark is the module's own declaration (MODULE_DEF[k].mark), so this
   function decides nothing and a module added tomorrow marks its card the
   day it is added rather than the day somebody remembers this file (§104.7).
   The whole-sentence `tip` rides with it for the hover.

   THE PICK IS NO LONGER READ, which is the one thing to know before
   changing this back: the mark is Forefront's own answer (Islam's, §368),
   so a client's landing-line pick cannot move it. `landingLine` keeps its
   other caller — lib/landing.ts's stamp, which is what the Landing line
   Setup page previews — so nothing about that page changes here. */
export function moduleRows(have: ModuleKey[], facts: CardFacts): ModuleRow[] {
  /* A build that marked a row with nothing outstanding — the behaviour
     §368 removed, and the one that makes the cards no shorter than the ones
     Islam photographed. Must turn checks/modules.mjs red before its green
     run is believed (§94.5). Never set on a deployment. */
  const brk = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";
  return have.map((k) => {
    const d = MODULE_DEF[k].mark;
    let m = (d || (() => null))(facts);
    if (!m && brk === "mark-always") m = { mark: d ? "Nothing to do" : "—" };
    const got = m || { mark: "", alarm: false, tip: "" };
    return { key: k, label: MODULE_DEF[k].label, room: isLibrary(k),
             mark: got.mark, alarm: !!got.alarm, tip: got.tip || "" };
  });
}
