/* ── INSIGHTS: the client's half (spec 053, drawn 2026-09-13) ───────────
   Search, open, download — and nothing on this screen can write, because
   publishing is Forefront's and happens on the client's card in the console
   (spec 046 decision #9). That is not enforced by leaving the buttons off: it
   is enforced by there being no write endpoint a client's session can reach
   (§42, §44). What the absence of buttons buys is that nobody is offered
   something they would be refused (§61).

   NO SCRIPT AT ALL, and it is not a limitation — it is what the shape already
   wanted. The categories are the module's navigation (spec 046 §4.6) and the
   search is a GET form, so the address carries the filter: a filtered library
   is a link somebody can send, Back works, and the shell's `script-src 'self'`
   policy has nothing to admit (the trial module made the same call for the
   same
   reason).

   THE STYLESHEET IS THE ONE SIGNED OFF, verbatim from
   design-mockups/insights/2026-09-13_library-and-publishing-room.html (rule
   1c), which is itself the trial module's token block extended with a list
   — that module is gone (§363) and its block lives on here. */
import { createRequire } from "node:module";
import { withTenant } from "../../lib/tenant.ts";
import { listItems, shape, CATEGORIES, normalizeCategories, oneLine, type Item, type Viewer } from "../../lib/library.ts";
import { clientHref, moduleMenu, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import { barFor } from "../../lib/branding.ts";

/* THE MONTH IS THE PRODUCT'S OWN WORD, not the browser's (§53.5). The first
   build used `toLocaleDateString("en-GB")` and the check caught it: Node
   renders September as **Sept** under that locale, where every other date in
   this product — the deck, a milestone, a cycle — is three letters, because
   they all come from SMPRules.MONTH_NAMES. A library writing "4 Sept 2026"
   beside a plan writing "Sep 26" is two vocabularies for one month. */
const R = createRequire(import.meta.url)("../../lib/rules.cjs");

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* THE CLIENT'S OWN COLOUR, asked of the spine (§354). This file used to carry
   the shipped navy as a literal, so a client who had chosen a colour saw it on
   Strategy and on the trial module and NOT here — the drift its own note
   recorded and left. `barFor` is that note done: one rule for what counts as a
   colour, one read of one column, and a database that will not answer gives
   the shipped navy rather than no page at all. */
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);

/* A DATE A PERSON READS. Built from the STRING's own parts, so no timezone
   can move the day (lib/library.ts dayOut has the same care, one layer down),
   and from the product's own month names, so there is one spelling of a month
   in the product. */
export function readableDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const month = R.MONTH_NAMES[Number(m[2]) - 1];
  if (!month) return "";
  return String(Number(m[3])) + " " + month + " " + m[1];
}

/* THE FACT LINE, one place, so the list cannot say a report's size one way
   and its date another (§53.5). Absent parts are DROPPED rather than drawn as
   an em-dash between two separators — a process has no date and no file, and
   a row reading "· · v1" is a control that failed to render (§15.1). */
export function factLine(it: Item): string {
  const bits: string[] = [];
  if (it.categories.length) bits.push("<b>" + it.categories.map(esc).join(" &middot; ") + "</b>");
  const day = readableDay(it.reportDate);
  if (day) bits.push(esc(day));
  bits.push("v" + it.version);
  if (it.sizeLabel) bits.push(esc(it.sizeLabel));
  return bits.join(" &middot; ");
}

/* THE SWITCHER IS the trial module's, carried here when that module went
   (§363), and the module menu behind it is
   lib/modules.ts's — a module that drew its own would be the second place a
   module's name is spelt (§53.5). It is also this page's way back. */
function switcher(slug: string, have: ModuleKey[], here: ModuleKey): string {
  const items = moduleMenu(have).map((m) =>
    m.key === here
      ? '<span class="mi on" aria-current="true">' + esc(m.label) + "<i>" + esc(m.note) + "</i></span>"
      : '<a class="mi" href="' + esc(clientHref(slug, m.key, "")) + '">' + esc(m.label) +
        "<i>" + esc(m.note) + "</i></a>").join("");
  return '<details class="msw"><summary title="Modules" aria-label="Modules">' +
    '<svg viewBox="0 0 20 20" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1.2"/>' +
    '<rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2"/>' +
    "</g></svg></summary><div class=\"mmenu\">" + items + "</div></details>";
}

const CSS = `
*{box-sizing:border-box}
:root{--bar:%BAR%;--ink:#141C2B;--ink-3:#5E6E85;--line:#D8DEE8;--ground:#F5F6F9;--surface:#FFF;--gold:#9C5D08}
@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-3:#8590A3;--line:#333B4A;--ground:#12151C;--surface:#1A1F29;--gold:#F5A623}}
body{margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.bar{background:var(--bar);color:#EAF0FA;display:flex;align-items:center;gap:10px;padding:11px 16px;flex-wrap:wrap}
.bar h1{margin:0;font-size:14.5px;font-weight:600}
.bar .org{color:#A9BBD8;font-size:13px}.bar .org b{color:#EAF0FA;font-weight:600}
.msw{position:relative;flex:none}
.msw>summary{list-style:none;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;border:1px solid rgba(234,240,250,.28);cursor:pointer;color:#EAF0FA}
.msw>summary::-webkit-details-marker{display:none}
.msw>summary:hover,.msw>summary:focus-visible{background:rgba(234,240,250,.14);outline:none}
.msw svg{width:17px;height:17px;display:block}
.mmenu{position:absolute;top:34px;left:0;z-index:9;min-width:290px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:11px;box-shadow:0 8px 26px rgba(20,28,43,.16);overflow:hidden}
.mi{display:block;padding:10px 15px;text-decoration:none;color:inherit;font-size:14px;font-weight:600;border-bottom:1px solid var(--line)}
.mi:last-child{border-bottom:0}.mi:hover,.mi:focus-visible{background:var(--ground);outline:none}
.mi.on{background:var(--ground);cursor:default}
.mi i{display:block;font-style:normal;font-weight:400;font-size:12px;color:var(--ink-3);margin-top:2px}
.pg{max-width:1000px;margin:0 auto;padding:20px 20px 40px}
h2.pt{margin:0 0 14px;font-size:21px;font-weight:600}
.cats{display:flex;gap:3px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:15px}
.cats a{color:var(--ink-3);text-decoration:none;font:600 13.5px/1 inherit;padding:9px 11px;border-bottom:2px solid transparent;margin-bottom:-1px}
.cats a[aria-current="true"]{color:var(--ink);border-bottom-color:var(--gold)}
.cats a:hover,.cats a:focus-visible{color:var(--ink);outline:none}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.srch{flex:1 1 260px;min-width:0;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 inherit}
.tools form{display:flex;gap:8px;flex:1 1 260px;min-width:0}
.go{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:8px 13px;font:600 13px/1.5 inherit;cursor:pointer;flex:none}
.cnt{font:600 10.5px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-left:auto;flex:none}
.list{display:flex;flex-direction:column;border-top:1px solid var(--line);margin-top:12px}
.item{display:flex;gap:16px;align-items:flex-start;padding:14px 2px;border-bottom:1px solid var(--line)}
.item .body{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:4px}
.item h3{margin:0;font-size:15.5px;font-weight:600;line-height:1.35}
.item p{margin:0;font-size:13.5px;line-height:1.5;color:var(--ink-3)}
.item .facts{font:400 12px/1.5 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);overflow-wrap:anywhere}
.item .facts b{font-weight:600;color:var(--ink)}
.dl{flex:none;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:7px 13px;font:600 13px/1.5 inherit;text-decoration:none;display:inline-block}
.dl:hover,.dl:focus-visible{border-color:var(--gold);outline:none}
.nofile{flex:none;font-size:12.5px;color:var(--ink-3)}
.none{padding:40px 4px 10px;color:var(--ink-3);font-size:14px;max-width:60ch}
.none b{color:var(--ink);font-weight:600;display:block;font-size:15.5px;margin-bottom:6px}
@media (max-width:560px){.item{flex-direction:column;gap:9px}}
`;

/* ── THE ROWS, AND THE ROWS ALONE (§376) ──────────────────────────────
   The reports as a list, or the honest sentence for a list that is empty —
   asked for by this module's own page AND by the Insights tab inside the
   platform, which is the whole of why it is a function rather than an
   expression inside the document.

   WHAT IS SHARED IS THE PART THAT WOULD HURT IF IT DRIFTED: a report's
   title, its summary, its fact line, its download, and the THREE different
   reasons a list can be empty. Those are the product's own answers about a
   report and there must be one of each (§53.5).

   WHAT IS DELIBERATELY NOT SHARED IS THE CHROME AROUND THEM. Here the
   categories are links and the search is a GET form, because the address
   carries the filter and a filtered library is a link somebody can send;
   in the tab the categories are the section row and the search re-asks,
   because a form that navigates would take the platform's own page with
   it. §53.5 is about one ANSWER to one question, never about one lump of
   markup — and the question those two differ on is "how does this host
   navigate", which genuinely has two answers.

   `read` IS NOT `items.length` AND THE TWO SAY DIFFERENT THINGS (§93,
   §231.4): a library that could not be read is not a library with nothing
   in it, and counting an error as absence tells a client that Forefront
   has published nothing. */
/* ── READ ONCE, FOR EITHER HOST (§376) ────────────────────────────────
   The library as this viewer may see it. Its own function because the tab
   asks for exactly what the page asks for — and because the narrowing is
   the one thing that must not differ between them: a report kept off
   somebody's page and listed in their tab would be spec 053's rule undone
   by the surface that came second.

   A FAILED READ IS `read:false`, NEVER AN EMPTY LIST (§93). */
export async function readLibrary(
  tenantId: string, slug: string, ask: Ask, viewer: Viewer,
): Promise<{ items: Item[]; read: boolean }> {
  const q = oneLine(ask.q).slice(0, 120);
  const category = normalizeCategories(ask.category)[0] || "";
  let rows: any[] | null = null;
  try {
    rows = await withTenant(tenantId, (c) => listItems(c, { kind: "insights", forClient: true, q, category, viewer }));
  } catch (e) {
    console.error("insights: reading " + slug + "'s library:", (e as Error).message);
  }
  return { items: (rows || []).map((r) => shape(r, true) as Item), read: rows !== null };
}

/* ── THE TAB'S ANSWER (§376) ──────────────────────────────────────────
   The rows the platform's Insights tab drops into its pane, as JSON so the
   count can be drawn beside the search box without the shell counting
   nodes — which would read an empty state as nought reports and an
   unreadable library as nought as well (§93 again, one layer out).

   THE HTML IS THE MODULE'S OWN, so the tab cannot spell a report's date or
   its size differently from the page (§53.5). */
export async function libraryFragment(
  slug: string, tenantId: string, tenantName: string, ask: Ask, viewer: Viewer,
): Promise<{ ok: true; html: string; count: number; read: boolean }> {
  const q = oneLine(ask.q).slice(0, 120);
  const category = normalizeCategories(ask.category)[0] || "";
  const { items, read } = await readLibrary(tenantId, slug, ask, viewer);
  return { ok: true, html: libraryRows(slug, items, read, q, category, tenantName), count: items.length, read };
}

export function libraryRows(
  slug: string, items: Item[], read: boolean, q: string, category: string, tenantName: string,
): string {
  if (items.length)
    return '<div class="list">' + items.map((it) =>
      '<div class="item"><span class="body">' +
      "<h3>" + esc(it.title) + "</h3>" +
      (it.summary ? "<p>" + esc(it.summary) + "</p>" : "") +
      '<span class="facts">' + factLine(it) + "</span>" +
      "</span>" +
      (it.hasFile
        ? '<a class="dl" href="' + esc(clientHref(slug, "insights", it.id + "/file")) + '">Download</a>'
        /* A report with nothing attached says so rather than drawing a
           button that would answer "not found" (§61). */
        : '<span class="nofile">No file yet</span>') +
      "</div>").join("") + "</div>";
  return '<div class="none">' + (
    !read
      ? "<b>This library could not be read just now.</b>Nothing has been lost. Try again in a moment."
    : q || category
      ? "<b>No reports match.</b>Try clearing the search, or choosing a different category."
      /* IT SAYS WHO, because the client cannot fix it themselves and a
         screen saying only "nothing here" reads as a fault rather than as
         a beginning (§45.2). */
      : "<b>Nothing has been published here yet.</b>Research, market reports and analysis written for " +
        esc(tenantName) + " will appear here. Forefront publishes them."
  ) + "</div>";
}

export type Ask = { q?: string; category?: string };

export async function insightsDocument(
  slug: string, tenantId: string, tenantName: string, have: ModuleKey[], ask: Ask, viewer: Viewer,
): Promise<string> {
  const q = oneLine(ask.q).slice(0, 120);
  const category = normalizeCategories(ask.category)[0] || "";
  const bar = await barFor(tenantId);
  /* THE CHECK'S BREAK (constitution XVI), carried here from the trial module
     when that module went (§363): a build whose page stopped naming THIS
     client — the one thing a module drawn per client has to get right, and
     the thing a static page would satisfy every other assertion about —
     must turn checks/modules.mjs red before its green run is believed
     (§94.5). Never set on a deployment. */
  const named = process.env.SMP_BREAK === "static-hello" ? "this client" : tenantName;

  /* A LIBRARY THAT COULD NOT BE READ IS NOT AN EMPTY ONE (§35, §93: counting
     an error as absence reports everybody as having none). The two states say
     different things, and neither of them says "nothing has been published". */
  const { items, read } = await readLibrary(tenantId, slug, ask, viewer);

  const here = clientHref(slug, "insights", "");
  const catHref = (c: string) => {
    const p = new URLSearchParams();
    if (c) p.set("category", c);
    if (q) p.set("q", q);
    const s = p.toString();
    return here + (s ? "?" + s : "");
  };

  /* THE CATEGORIES ARE NOT DRAWN OVER AN EMPTY LIBRARY. A row of filters that
     can only ever return nothing is furniture (§94.15) — but they ARE drawn
     when a filter is what emptied the list, or there would be no way back to
     the reports (§61). */
  const anyShelf = items.length > 0 || !!q || !!category;
  const cats = !anyShelf ? "" :
    '<nav class="cats" aria-label="Categories">' +
    ['<a href="' + esc(catHref("")) + '"' + (category ? "" : ' aria-current="true"') + ">All</a>"]
      .concat(CATEGORIES.map((c) =>
        '<a href="' + esc(catHref(c)) + '"' + (category === c ? ' aria-current="true"' : "") + ">" + esc(c) + "</a>"))
      .join("") + "</nav>";

  const tools = !anyShelf ? "" :
    '<div class="tools">' +
    '<form method="get" action="' + esc(here) + '" role="search">' +
    (category ? '<input type="hidden" name="category" value="' + esc(category) + '">' : "") +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search reports&hellip;" aria-label="Search reports">' +
    '<button class="go" type="submit">Search</button>' +
    "</form>" +
    '<span class="cnt">' + esc(plural(items.length, "report", "reports")) + "</span></div>";

  const list = libraryRows(slug, items, read, q, category, tenantName);

  return "<!doctype html>\n<html lang='en' data-module='insights'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(named) + " &mdash; Insights</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    "<style>" + CSS.replace("%BAR%", bar) + "</style>\n</head>\n<body>\n" +
    '<header class="bar">' + switcher(slug, have, "insights") +
    "<h1>Strategy Management Platform</h1>" +
    '<span class="org">&middot; ' + esc(named) + " <b>&rsaquo; " + esc(MODULE_DEF.insights.label) + "</b></span></header>\n" +
    '<main class="pg">\n<h2 class="pt">' + esc(MODULE_DEF.insights.label) + "</h2>\n" +
    cats + tools + list +
    "\n</main>\n</body>\n</html>\n";
}
