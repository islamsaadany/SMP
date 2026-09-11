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

export const MODULES = ["strategy", "portfolio", "insights", "processes"] as const;
export type ModuleKey = (typeof MODULES)[number];

/* Where a client lands when the address names no module. */
export const DEFAULT_MODULE: ModuleKey = "strategy";

/* The two spine words, which a module name may never be. */
export const SPINE_SEGMENTS = ["setup", "tour"] as const;

export function isModule(s: unknown): s is ModuleKey {
  return typeof s === "string" && (MODULES as readonly string[]).includes(s);
}
export function isSpineSegment(s: unknown): boolean {
  return typeof s === "string" && (SPINE_SEGMENTS as readonly string[]).includes(s);
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
   given machinery, because the redirect exists for links made before today. */
export type Where = { module: ModuleKey | null; rest: string[]; legacy: boolean };
export function whereOf(rest: string[]): Where {
  const seg = (rest || []).filter(Boolean);
  if (isSpineSegment(seg[0])) return { module: null, rest: seg, legacy: false };
  if (isModule(seg[0])) return { module: seg[0], rest: seg.slice(1), legacy: false };
  return { module: DEFAULT_MODULE, rest: seg, legacy: true };
}

/* The address of a path inside a client, written in one place. `rest` is
   already spelt the way the shell reads it (a function as `fn/<key>`). */
export function clientHref(slug: string, module: ModuleKey | null, rest: string): string {
  const tail = String(rest || "").replace(/^\/+/, "");
  return "/" + slug + (module ? "/" + module : "") + (tail ? "/" + tail : "");
}
