/* ── INSIGHTS: the client's half (spec 053, drawn 2026-09-13) ───────────
   Search, open, download — and nothing on this screen can write, because
   publishing is Forefront's and happens on the client's card in the console
   (spec 046 decision #9). That is not enforced by leaving the buttons off: it
   is enforced by there being no write endpoint a client's session can reach
   (§42, §44). What the absence of buttons buys is that nobody is offered
   something they would be refused (§61).

   NO SCRIPT OF ITS OWN, and it is not a limitation — it is what the shape
   already wanted (the shared top bar's `/topbar.js` is the bar's, §444). The categories are the module's navigation (spec 046 §4.6) and the
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
import { listItems, shape, normalizeCategories, oneLine, CATEGORIES, type Item, type OfficeItem, type Viewer } from "../../lib/library.ts";
import { placesFor } from "../../lib/place.ts";
import { categoriesFor } from "../../lib/library-viewer.ts";
import { clientHref, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import { topBarHtml, TOPBAR_CSS, TOPBAR_SCRIPT_TAG, themedCss, type TopViewer } from "../../lib/topbar.ts";
import { barFor } from "../../lib/branding.ts";
import { ledgerCss, LENS } from "../../lib/ledger.ts";
import { CARD_LOOK_CSS, bandHtml, cardHead } from "../../lib/card-look.ts";
import type { Rules } from "../../lib/shared-types.ts";

/* THE MONTH IS THE PRODUCT'S OWN WORD, not the browser's (§53.5). The first
   build used `toLocaleDateString("en-GB")` and the check caught it: Node
   renders September as **Sept** under that locale, where every other date in
   this product — the deck, a milestone, a cycle — is three letters, because
   they all come from SMPRules.MONTH_NAMES. A library writing "4 Sept 2026"
   beside a plan writing "Sep 26" is two vocabularies for one month. */
const R = createRequire(import.meta.url)("../../lib/rules.cjs") as Rules;

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* THE CLIENT'S OWN COLOUR, asked of the spine (§354). This file used to carry
   the shipped navy as a literal, so a client who had chosen a colour saw it on
   Strategy and on the trial module and NOT here — the drift its own note
   recorded and left. `barFor` is that note done: one rule for what counts as a
   colour, one read of one column, and a database that will not answer gives
   the shipped navy rather than no page at all. */

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
  if (day) bits.push("<span>" + esc(day) + "</span>");
  bits.push("<span>v" + it.version + "</span>");
  if (it.sizeLabel) bits.push("<span>" + esc(it.sizeLabel) + "</span>");
  /* THE SEPARATOR IS ITS OWN ELEMENT (§605) so the module's page can lay the
     parts out as the Tracker's row does — a tag, then the facts, spaced — and
     drop the dots; the platform's tab draws it exactly as it always read. */
  return bits.join('<span class="sep"> &middot; </span>');
}


/* MY TASKS' LOOK (§646), from design-mockups/modules-look/
   2026-10-26_modules-in-my-tasks-look.html: the band, the card and its
   header are lib/card-look.ts; what is here is the report's own row inside
   the card, striped grey and white, grey first. The row's markup is the one
   the platform's tab draws too (libraryRows, §376), so only how it is laid
   out is this page's: the category is My tasks' pill, the separators make
   way for space, and Download is a word in the gold, as a link is in the
   console. */
const CSS = `
.card .list{display:flex;flex-direction:column}
.item{display:flex;gap:16px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line-soft)}
.item:last-child{border-bottom:0}
.list .item:nth-child(odd of .item){background:var(--zebra)}
.item .body{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px}
.item h3{margin:0;font:600 14.5px/1.35 var(--font)}
.item p{margin:0;font-size:13.5px;line-height:1.5;color:var(--ink-2)}
.item .facts{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;margin-top:3px;font:400 13px/1.4 var(--font);color:var(--ink-3);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.item .facts .sep{display:none}
.item .facts b{display:inline-flex;align-items:center;gap:6px;font:400 12px/1.4 var(--font);color:var(--ink-2);background:var(--surface);border:1px solid var(--line-soft);border-radius:999px;padding:2px 10px}
.item .facts b::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--amber);flex:none}
.dl{flex:none;color:var(--gold);font:600 13px/1.5 var(--font);text-decoration:none;white-space:nowrap}
.dl:hover{text-decoration:underline}
.dl:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:4px}
.nofile{flex:none;font-size:13px;color:var(--ink-3)}
@media (max-width:560px){.item{flex-direction:column;align-items:flex-start;gap:6px}}
`;

/* ── PUBLISHING IN PLACE (§647), sent ONLY to whoever may publish: a
   draft's tag, who a narrowed report reaches, Open on each row, and the
   pop-up. A client's page carries none of it, so it says nothing about
   writing (checks/insights.mjs §11). ── */
const PUBLISH_CSS = `
.item h3 .draft,.chd .draft{font:700 10.5px/1.5 var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--gold);border:1px solid var(--gold);border-radius:999px;padding:0 8px;margin-left:8px;vertical-align:2px;white-space:nowrap}
.item .reach{font-size:12.5px;color:var(--ink-3)}
.openr{flex:none;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink-2);font:600 13px/1.5 var(--font);padding:3px 10px;cursor:pointer}
.openr:hover,.openr:focus-visible{border-color:var(--gold);color:var(--ink);outline:none}
html.held{overflow:hidden}
.mscrim{position:fixed;inset:0;z-index:50;background:rgba(20,28,43,.45);display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px 24px;overflow-y:auto}
.modal{width:100%;max-width:680px;background:var(--surface);color:var(--ink);border-radius:14px;box-shadow:0 24px 64px rgba(20,28,43,.35);margin:0 auto auto}
.modal .chd{border-radius:14px 14px 0 0}
.modal .chd h2{white-space:normal;min-width:0}
.modal .x{width:32px;height:32px;border-radius:8px;border:0;background:none;color:var(--ink-3);font:400 22px/1 var(--font);cursor:pointer}
.modal .x:hover,.modal .x:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
.mform{padding:16px 18px 4px;display:grid;gap:14px}
.mlab{display:block;font:700 10.5px/1.5 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin:0 0 5px}
.modal .fld{display:block;width:100%;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.45 var(--font)}
.modal textarea.fld{resize:vertical;min-height:62px}
.modal .fld:focus{border-color:var(--gold);outline:none}
.modal .two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{font:600 12.5px/1.4 var(--font);border:1px solid var(--line);border-radius:999px;padding:5px 11px;color:var(--ink-2);background:var(--surface);cursor:pointer}
.chip[aria-pressed="true"]{background:var(--amber-wash);border-color:var(--gold);color:var(--gold)}
.chip:focus-visible,.trow:focus-visible,.lnk:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.file,.who{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--line);border-radius:8px;padding:6px 6px 6px 11px;font-size:14px;min-height:40px}
.file{border-style:dashed;color:var(--ink-3)}
.file.has{border-style:solid;color:var(--ink)}
.file .fname,.who .wt{min-width:0;overflow-wrap:anywhere}
.file .sp,.who .sp{flex:1}
.mnote{margin:5px 0 0;font-size:12.5px;line-height:1.45;color:var(--ink-3)}
.modal .btn{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:6px 12px;font:600 13px/1.5 var(--font);cursor:pointer;white-space:nowrap}
.modal .btn:hover,.modal .btn:focus-visible{border-color:var(--gold);outline:none}
.modal .btn.amber{background:var(--amber);border-color:var(--amber);color:var(--amber-ink)}
.modal .btn.risk{color:var(--bad);border-color:var(--bad)}
.modal .btn.risksolid{background:var(--bad);border-color:var(--bad);color:#FFF}
.modal .btn[disabled],.modal .btn[aria-disabled="true"]{opacity:.55;cursor:default}
.tick{border:1px solid var(--line);border-radius:10px;margin-top:8px;padding:8px}
.tickhead{display:flex;gap:8px;align-items:center}
.tickhead .fld{flex:1;min-width:0;padding:5px 9px;font-size:13px}
.lnk{border:0;background:none;color:var(--gold);font:600 13px/1.4 var(--font);cursor:pointer;padding:4px}
.ticklist{max-height:220px;overflow-y:auto;margin-top:6px;display:grid}
.ticklist .gp{font:700 10.5px/1.6 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding:6px 6px 2px}
.trow{display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;border-radius:7px;padding:6px;font:400 13.5px/1.4 var(--font);color:var(--ink);text-align:left;cursor:pointer}
.trow::before{content:"";width:15px;height:15px;border:1.5px solid var(--line);border-radius:4px;flex:none;background:var(--surface)}
.trow[aria-pressed="true"]::before{background:var(--gold);border-color:var(--gold);box-shadow:inset 0 0 0 2px var(--surface)}
.trow:hover{background:var(--ground)}
.msaid{margin:8px 18px 0;padding:8px 12px;border:1px solid var(--bad);border-radius:8px;background:var(--bad-bg);color:var(--bad);font-size:13.5px}
.mfoot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 18px 14px;border-top:1px solid var(--line-soft);margin-top:14px}
.mfoot .sp,.mask .sp{flex:1}
.mstate{font:700 11px/1.4 var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.mstate.pub{color:var(--good)}
.mask{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 18px 12px;padding:10px 12px;border:1px solid var(--gold);border-radius:8px;background:var(--amber-wash);font-size:13.5px}
.apart{border-top:1px solid var(--line-soft);padding:8px 18px 12px}
.apart .mlab{margin:6px 0 0}
.arow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid var(--line-soft)}
.arow:last-child{border-bottom:0}
.arow .w{flex:1;min-width:200px}
.arow b{display:block;font-size:14px}
.arow .w span{display:block;font-size:13px;color:var(--ink-3)}
@media (max-width:560px){.mscrim{padding:0}.modal{max-width:none;min-height:100%;border-radius:0}.modal .chd{border-radius:0}.modal .two{grid-template-columns:1fr}}
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
  /* §647: drawn for whoever may publish, on the module's own page only — the
     platform's tab never passes it. A draft says so, a narrowed report says
     how far it reaches, and each row has Open; a draft's file is not offered
     for download, because the file's address answers only for what is out. */
  office = false,
): string {
  if (items.length)
    return '<div class="list">' + items.map((it) => {
      const o = office ? it as OfficeItem : null;
      const draft = !!o && o.state !== "published";
      return '<div class="item"><span class="body">' +
      "<h3>" + esc(it.title) + (draft ? '<span class="draft">Draft</span>' : "") + "</h3>" +
      (it.summary ? "<p>" + esc(it.summary) + "</p>" : "") +
      '<span class="facts">' + factLine(it) + (o && o.seenLabel ? '<span class="reach">Seen by ' + esc(o.seenLabel) + "</span>" : "") + "</span>" +
      "</span>" +
      (it.hasFile && !draft
        ? '<a class="dl" href="' + esc(clientHref(slug, "insights", it.id + "/file")) + '">Download</a>'
        /* A report with nothing attached says so rather than drawing a
           button that would answer "not found" (§61). */
        : it.hasFile ? '<span class="nofile">File attached</span>' : '<span class="nofile">No file yet</span>') +
      (o ? '<button class="openr" type="button" data-act="open-report" data-id="' + esc(it.id) + '">Open</button>' : "") +
      "</div>";
    }).join("") + "</div>";
  return '<div class="none">' + (
    !read
      ? "<b>This library could not be read just now.</b>Nothing has been lost. Try again in a moment."
    : q || category
      ? "<b>No reports match.</b>Try clearing the search, or choosing a different category."
    : office
      ? "<b>Nothing here yet.</b>Press + Publish a report to write the first one for " + esc(tenantName) + "."
      /* IT SAYS WHO, because the client cannot fix it themselves and a
         screen saying only "nothing here" reads as a fault rather than as
         a beginning (§45.2). */
      : "<b>Nothing has been published here yet.</b>Research, market reports and analysis written for " +
        esc(tenantName) + " will appear here. Forefront publishes them."
  ) + "</div>";
}

export type Ask = { q?: string; category?: string };

/* §647 — WHAT THE POP-UP WORKS FROM, served at /<client>/insights/data and
   only to whoever may publish (index.ts): every report as the office reads
   it (drafts, who each reaches), the one list of categories, and this
   client's places to narrow a report to. A failed read is said, never an
   empty library (§93). */
export async function publishData(slug: string, tenantId: string, tenantName: string): Promise<Record<string, unknown>> {
  try {
    return await withTenant(tenantId, async (c) => {
      const rows = await listItems(c, { kind: "insights", forClient: false });
      return { ok: true, key: slug, client: tenantName, categories: CATEGORIES, places: await placesFor(c),
        items: Object.fromEntries(rows.map((r) => { const it = shape(r, false); return [it.id, it]; })) };
    });
  } catch (e) {
    console.error("insights: reading " + slug + "'s library for publishing:", (e as Error).message);
    return { ok: false, error: "The library could not be read just now. Nothing has been lost." };
  }
}

export async function insightsDocument(
  slug: string, tenantId: string, tenantName: string, have: ModuleKey[], ask: Ask, viewer: Viewer,
  /* §444: whose bar this is — a consultant gets the trail, and the office
     may pick whose eyes the page is drawn through */
  top: { consultant?: boolean; viewer?: TopViewer | null; publish?: boolean } = {},
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
  /* §647: WHOEVER MAY PUBLISH READS THE OFFICE'S LIST — drafts and all, as
     the console's room read it (forClient false) — and the places a report
     can be narrowed to. Everybody else reads exactly what they read before. */
  const pub = !!top.publish;
  let items: Item[] = [], read = true;
  if (pub) {
    try {
      items = (await withTenant(tenantId, (c) => listItems(c, { kind: "insights", forClient: false, q, category })))
        .map((r) => shape(r, false) as OfficeItem);
    } catch (e) {
      console.error("insights: reading " + slug + "'s library for publishing:", (e as Error).message);
      read = false;
    }
  } else ({ items, read } = await readLibrary(tenantId, slug, ask, viewer));
  const outCount = pub ? items.filter((it) => (it as OfficeItem).state === "published").length : items.length;

  const here = clientHref(slug, "insights", "");
  const catHref = (c: string) => {
    const p = new URLSearchParams();
    if (c) p.set("category", c);
    if (q) p.set("q", q);
    const s = p.toString();
    return here + (s ? "?" + s : "");
  };

  /* A FILTER IS DRAWN ONLY WHERE THERE IS THAT TYPE OF REPORT (§385). Islam:
     *"the filters of the reports should appear only if there is this type of
     report."* It was the module's whole list, so a client with nothing
     published met five filters that could only ever return nothing — §94.15's
     furniture and §61's control with nothing behind it, on the first screen
     they open.

     THE SAME ANSWER THE TAB IS STAMPED WITH (lib/library-viewer.ts), never a
     second reading of the same shelf: the two hosts draw this row from one
     function, or one of them would eventually offer a category the other
     refuses (§53.5).

     IT ASKS THE LIBRARY AND NOT THE SEARCH, which is why it is not `items`:
     the row says what has been published, so it is the same row whatever is
     typed — a filter row that rearranged itself as you typed would be a worse
     screen than the one this replaces.

     THE ROW IS STILL DRAWN WHEN A FILTER IS WHAT EMPTIED THE LIST, or there
     would be no way back to the reports (§61) — All is always in it. */
  const present = await categoriesFor(tenantId, viewer);
  /* a draft's category is a filter for whoever can see the draft */
  if (pub) for (const it of items) for (const c of it.categories) if (!present.includes(c)) present.push(c);
  const anyShelf = present.length > 0 || !!q || !!category;
  const cats = !anyShelf ? "" :
    '<span class="cx">Show <nav class="cats" aria-label="Categories">' +
    ['<a href="' + esc(catHref("")) + '"' + (category ? "" : ' aria-current="true"') + ">All</a>"]
      .concat(present.map((c) =>
        '<a href="' + esc(catHref(c)) + '"' + (category === c ? ' aria-current="true"' : "") + ">" + esc(c) + "</a>"))
      .join("") + "</nav></span>";

  /* THE SEARCH BOX KEEPS ITS OWN QUESTION, which is not the row's: it is
     drawn where there is something to search, and the categories where there
     is something to filter by. A library of five reports under no category at
     all has a search box and no filters, and that is the honest pair. */
  const anyReports = items.length > 0 || !!q || !!category;
  /* THE COUNT IS THE PANEL'S NOW (§605), the number it always was — the
     reports listed — said the way the Tracker says its own. */
  const find = !anyReports ? "" :
    '<form class="find" method="get" action="' + esc(here) + '" role="search">' + LENS +
    (category ? '<input type="hidden" name="category" value="' + esc(category) + '">' : "") +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search reports" aria-label="Search reports">' +
    '<button class="go" type="submit">Search</button>' +
    "</form>";
  /* THE BAND AND ONE CARD (§646): the count in the band as the Tracker says
     its own, and in the card's header beside its title; the categories and
     the search are the card's filters, as My tasks' Show and search are. */
  /* THE BAND COUNTS WHAT THE CLIENT CAN SEE, for everybody; whoever may
     publish has + Publish a report beside it, as Meeting Notes has + New
     meeting (§647). */
  const mast = bandHtml({ esc, eyebrow: named, title: MODULE_DEF.insights.label,
    sentence: "Research, market reports and analysis written for " + named + ".",
    tiles: anyReports ? [{ n: outCount, label: outCount === 1 ? "Report" : "Reports" }] : [],
    act: pub ? '<button class="act" type="button" data-act="new-report">+ Publish a report</button>' : "" });

  const list = '<section class="card">' +
    cardHead({ esc, icon: "bulb", title: "Reports", count: read && anyReports ? items.length : null, right: cats + find }) +
    libraryRows(slug, items, read, q, category, tenantName, pub) + "</section>";
  /* THE POP-UP'S SCRIPT, for whoever may publish; it asks the module's own
     /data for the reports as the office reads them (publishData), so the
     page carries nothing inline for the shell's script-src to refuse. */
  const data = !pub ? "" : '<script src="' + esc(clientHref(slug, "insights", "app.js")) + '"></script>\n';

  return "<!doctype html>\n<html lang='en' data-module='insights'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(named) + " &mdash; Insights</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    TOPBAR_SCRIPT_TAG + "<style>" + TOPBAR_CSS + themedCss(ledgerCss(bar) + CARD_LOOK_CSS + CSS + (pub ? PUBLISH_CSS : "")) + "</style>\n</head>\n<body>\n" +
    topBarHtml({ slug, tenantName: named, module: "insights", have, consultant: !!top.consultant, viewer: top.viewer }) + "\n" +
    '<main class="pg">\n' + mast + "\n" + list +
    "\n</main>\n" + data + "</body>\n</html>\n";
}
