/* What the Setup document is stamped with, and how a door inside a client
   is spelt. THIS FILE WAS THE LANDING PAGE'S (§148 on the new stack, spec
   043's first screen group): the welcome's rows, computed by the frozen
   readers, and spec 056 §4.1's Client setup and Your modules blocks. §360
   (spec 057) made `/<client>` a redirect into the person's first module —
   Islam: "I just need a welcome screen for the strategy module for now" —
   so the rows are Strategy's own welcome.js's again and the blocks went to
   the client's Setup rail, where a set-up is a one-off rather than a
   greeting. What stays is what the Setup document still needs: the module's
   landing-line declaration (landingStampFor) and the one rule for spelling
   a door's address (doorHref), which the checks read. */
import { clientHref, DEFAULT_MODULE, MODULE_DEF, modulesFor, isModule, type ModuleKey } from "./modules.ts";
import { landingFactsFor, viewerFor } from "./landing-facts.ts";

export type Door = { target?: string; tab?: string; report?: boolean; setup?: string };

/* THE LANDING LINE PAGE'S STAMP (spec 056 §4.5, §359.4): what the module the
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
   (spec 056 §4.1, research R2): `/<client>/setup/<page>` is a request, and
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
