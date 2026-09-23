/* The document the frozen shell is served in (spec 043 Phase B).

   build.py's head, as a served page: charset, viewport, the tenant's name
   in the title, the theme-colour metas, the icon, the product's own
   stylesheet LINKED (scripts/sync-css.mjs, verbatim), theme.js from the head
   (it stamps `booting` and the theme before the body parses, §94.10), the
   body markup (shell/body.html, generated), and the whole shell as ONE
   external script. No inline script anywhere, so the page carries
   `script-src 'self'` — §238's net without a hash to go stale. The rest of
   the policy is vercel.json's, word for word. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODULE_DEF, isModule } from "./modules.ts";

let body: string | null = null;
export function shellBody(): string {
  if (body === null) body = readFileSync(join(process.cwd(), "shell", "body.html"), "utf8");
  return body;
}
/* ONE ESCAPER, SAFE IN AN ATTRIBUTE (§235, one file over). Every stamp
   below is a SINGLE-quoted attribute, and this escaped `& < > "` and not
   `'` — a text-node escaper being used inside an attribute, which is the
   fault §235 found in the frozen product and fixed there. The served app
   kept its own copy and never learned it.

   IT IS LIVE, NOT HYPOTHETICAL, AND IT WAS FOUND BY A FIXTURE RATHER THAN BY
   READING: `MODULE_DEF.tracker.note` is "The office's weekly actions about
   this client", so a client holding the Internal Tracker was served a root
   element whose `data-modules` ENDED at that apostrophe — the rest parsed as
   stray attributes, `JSON.parse` threw, and the module switcher was silently
   not drawn (§96's family: the page renders perfectly and a control is
   missing). And `data-landing` carries a published report's TITLE
   (lib/modules.ts, the `latest` line), which is typed by a person — so the
   same break could forge `data-*` attributes the shell reads to decide what
   chrome to draw. No script: the policy is `script-src 'self'` with nothing
   inline (§238), so an injected attribute cannot run. */
function esc(s: string): string { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

/* `module` is the module word this document's addresses are written with.
   It is stamped on the root element so the browser is TOLD its module rather
   than keeping a second copy of the list (§53.5): shell/route.js reads
   `data-module` and writes it back into every address it pushes.

   A SPINE PAGE IS STAMPED TOO, with the module its neighbours use, because
   somebody walks from Setup to a unit without the document being served
   again — and the browser already knows which destinations are the spine's
   (`setup` and `tour` are its own vocabulary in shell/route.js, not a list
   copied from here). */
export function shellDocument(tenantName: string, module: string | null = null, modules: readonly { key: string; label: string; note: string }[] = [],
                              landing: { module: string; pick: string; lines: { key: string; label: string; example: string; text: string }[] } | null = null,
                              areas: readonly { key: string; label: string; note: string; states: string[]; shipped: string }[] | null = null,
                              /* WHICH SETUP RAIL THIS DOCUMENT IS (§362, spec 058): `client` for
                                 `/<client>/setup/…`, the module's own word for
                                 `/<client>/<module>/setup/…`, absent everywhere else. The
                                 browser writes the same attribute from the address on arrival
                                 (shell/route.js placeOf), and this is the SAME answer stamped
                                 EARLIER — not a second one (§53.5). It has to be earlier,
                                 because the module switcher is built at load, before placeOf
                                 has run, and the client's own settings are not a module's
                                 pages for it to offer a way out of. */
                              scope: string | null = null,
                              /* WHICH CATEGORIES THE LIBRARY ACTUALLY HAS FOR THIS PERSON
                                 (§385). Worked out by the CALLER, because this file is a
                                 pure function of its arguments and the answer needs the
                                 tenant and the viewer — `lib/library.ts` categoriesPresent,
                                 which asks the same two clauses the list itself is read
                                 through, so the row can never offer a category the list
                                 would refuse. `null` is *no library behind this tab* and is
                                 the honest answer for file://, for a client without the
                                 module and for somebody it is shut to; `[]` is a library
                                 with nothing filed under any category yet, which draws the
                                 tab and no filters. */
                              libraryCats: readonly string[] | null = null): string {
  /* THE CHECK'S BREAKS (constitution XVI, checks/shell.mjs): `no-route`
     stands shell/route.js down, so the address stops naming the page;
     `open-csp` (shellHeaders) drops the policy. Never set on a deployment. */
  const brk = process.env.SMP_BREAK || "";
  /* `switch-always` is route.js's, not this file's (§362.1): the attribute
     below is the LIST, and who draws a switcher from it is that file's rule,
     so its break has to reach it. */
  const routeBrk = (brk === "no-route" || brk === "switch-always") ? brk : "";
  return "<!doctype html>\n<html lang='en'" + (routeBrk ? " data-break='" + routeBrk + "'" : "") +
    (module ? " data-module='" + esc(module) + "'" : "") +
    /* AND ITS NAME (§359.2): the frozen shell heads a module's own Setup rail
       with the module's word, and a label capitalised out of the key in the
       browser is how two screens come to spell one module differently
       (§53.5) — so the label the console and the switcher read is stamped
       beside the key, from the one definition. */
    (module && isModule(module) ? " data-module-label='" + esc(MODULE_DEF[module].label) + "'" : "") +
    /* AND WHICH MODULES THIS CLIENT HAS (spec 046 §4.5). The browser holds no
       list of its own — `data-module` already told it where it IS, and this
       tells it where else it may go, so shell/route.js can draw the switcher
       without a second copy of MODULE_DEF or a request to ask (§53.5).

       THE ATTRIBUTE IS THE LIST, AND NOT "IS THERE A CHOICE" (§362.1). It
       was written only for a client holding more than one, which is the
       SWITCHER's rule wearing the attribute's name — and it left the client's
       own Setup rail unable to name the one module it should offer a way
       across to, which is what Islam met as *"I can't find the access page"*.
       Two readers now, each with its own rule over one answer (§53.5): the
       switcher is drawn only where there is a choice (shell/route.js keeps
       that test, a menu of one being a door behind a door, §32) and the rail
       draws a row per module whatever the count. The list is already the
       modules THIS PERSON MAY OPEN (moduleMenu(openableModules)), so neither
       reader has to ask a second time. */
    (modules.length ? " data-modules='" + esc(JSON.stringify(modules)) + "'" : "") +
    /* AND THE LIBRARY'S CATEGORIES, WHERE THIS PERSON MAY OPEN INSIGHTS
       (§376). The reports are a TAB inside the platform now (Islam's C of
       three drawn), and its categories are drawn in the section row — which
       the shell builds at paint time, before any answer from the server can
       have arrived. So the list is stamped rather than fetched, and stamped
       rather than written out in the frozen shell, which would be a second
       copy of lib/library.ts's own CATEGORIES (§53.5).

       ONLY WHERE THE TAB IS DRAWN, and an absent attribute is the honest
       answer for somebody the library is shut to — and over file://, where
       there is no server to ask for the rows at all, there is no attribute
       and therefore no tab (§61, the switcher's own rule).

       AND IT IS WHAT THE CLIENT HAS, NOT WHAT THE MODULE OFFERS (§385).
       It was `CATEGORIES` whole, so a client with nothing published opened on
       a row of six sections, five of which could only ever return nothing —
       measured before it was changed. The caller works the list out through
       `categoriesPresent`, which reads the shelf through the same two clauses
       the list itself is read through; this file stamps whatever it is
       handed, so there is one answer and this is not the second place it is
       decided (§53.5).

       THE CHECK'S BREAK: `no-library-cats` drops the stamp, so the tab is
       not drawn at all — checks/shell.mjs §3d, which is the one place the
       SEAM is measured (the rule is checks/insights.mjs §14 and the row is
       checks/insights-tab.mjs §2, and neither can see this attribute).
       Never set on a deployment. */
    (libraryCats && brk !== "no-library-cats"
      ? " data-library-cats='" + esc(JSON.stringify(libraryCats)) + "'" : "") +
    /* THE LANDING LINE PAGE'S DECLARATION (§359.4): what this module can
       say, its texts right now and the client's pick — stamped on a SETUP
       document only, where the page that draws it lives (lib/landing.ts
       landingStampFor). Absent everywhere else, and over file://, where the
       page says the served platform is where the line is set. */
    (landing && brk !== "no-landing-stamp" ? " data-landing='" + esc(JSON.stringify(landing)) + "'" : "") +
    /* THE MODULE'S DECLARED AREAS (§359.5, spec 056 §4.4): what its Access
       page has columns for, on the Setup document alone and only for a
       module that declares any — MODULE_DEF's own list, never a copy
       (renderModuleAccess in the frozen config-render.js reads it). Absent,
       the page says the served platform sets it. */
    (areas && areas.length && brk !== "no-areas-stamp" ? " data-areas='" + esc(JSON.stringify(areas)) + "'" : "") +
    /* THE CHECK'S BREAK: a build that served the client's own settings under a
       module's bar — the fault §362 exists to remove — must go red. Never set
       on a deployment. */
    (scope && brk !== "no-setup-scope" ? " data-setup-scope='" + esc(scope) + "'" : "") + ">\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " — Strategy Management Platform</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">\n' +
    /* §26: the manifest and the touch icon, as the frozen platform file and
       the gate both carry them — what lets somebody add SMP to a home
       screen, and on an iPhone the only way a notification is delivered. */
    '<link rel="manifest" href="/manifest.webmanifest">\n<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">\n' +
    '<meta name="theme-color" content="#16325C" media="(prefers-color-scheme: light)">\n' +
    '<meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)">\n' +
    '<link rel="stylesheet" href="/platform.css">\n' +
    '<script src="/theme.js"></script>\n' +
    "</head>\n<body>\n" + shellBody() + '\n<script src="/shell.js"></script>\n</body>\n</html>\n';
}

/* vercel.json's policy with ONE change: script-src is 'self' alone. */
export const SHELL_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; " +
  "connect-src 'self'; worker-src 'self'; manifest-src 'self'; media-src 'self' blob: https://*.blob.vercel-storage.com; " +
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://drive.google.com https://*.sharepoint.com; " +
  "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

export function shellHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    ...(process.env.SMP_BREAK === "open-csp" ? {} : { "Content-Security-Policy": SHELL_CSP }),
    /* ONLY WHAT DIFFERS FROM THE REST OF THE SITE (Phase J). The other six —
       X-Frame-Options, nosniff, HSTS, Permissions-Policy, COOP and the
       prefetch switch — are set for every path by next.config.ts, read out
       of the frozen vercel.json; repeating them here would send each twice,
       and a second copy of a header is not an override.

       same-origin: the frozen site said no-referrer everywhere and the
       shell's own scripts spell /api/state with no client on it (history.js,
       safety.js) — the referrer is how the server learns which client's page
       is asking (app/api/state/route.ts), and nothing leaves the origin. */
    "Referrer-Policy": "same-origin",
  };
}

/* Forefront's own page (§313.3), served as it is. */
let platformPage: string | null = null;
export function platformDocument(): string {
  if (platformPage === null) platformPage = readFileSync(join(process.cwd(), "shell", "platform.html"), "utf8");
  return platformPage;
}
