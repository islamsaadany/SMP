/* ── THE INTERNAL TRACKER: the page (spec 054, drawn 2026-09-15) ─────────
   One list, read by the week, and IT WORKS LIKE THE SHEET IT REPLACES
   (Islam: "super simple"): the list ends in the next empty line, a title and
   Enter add an action, and every fact on a row is changed on the row — the
   date, the owner, the status, the done tick, the name by a double-click. An
   arrow at the row's end opens it in place for its notes and its history,
   and folds it again. No form, no detail page, no Save button.

   THE STYLESHEET IS THE ONE SIGNED OFF, verbatim from
   design-mockups/internal-tracker/2026-09-15_row-first-name-dots-rename.html
   (rule 1c, §356.11), which is the first mockup's stylesheet with the row's
   controls redrawn: the owner as a first name that opens the team, the
   arrow, the title renamed in place, a small scrolling history, and the
   grouping as a choice on the views row. The chrome and the switcher are
   Insights' (modules/insights/page.ts), because a module that drew its own
   would be the second place a module's name is spelt (§53.5).

   ONE RENDERER FOR THE LIST, WHETHER THE PAGE IS READ OR A ROW IS PRESSED
   (§356.12): adding is silent — no reload — and the way that stays honest is
   that the server answers every press with the list drawn AGAIN by the same
   function that drew the page, and the script swaps it in. The browser
   never renders a row of its own, so it cannot disagree with the server
   about one (§53.5); `listFragment()` is `trackerDocument()`'s own body.

   THE ONE SCRIPT the shell's policy admits is served by this module at its
   own address (`script-src 'self'`, lib/shell.ts) — modules/tracker/script.ts
   — and nothing here is inline. Every control is drawn as the FACT until it
   is pressed, and only for somebody the server would let press it (§61): a
   control the server refuses is never drawn. */
import { withTenant } from "../../lib/tenant.ts";
import { barFor } from "../../lib/branding.ts";
import { clientHref, moduleMenu, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import {
  type Action, type Who, type View, type Group, type Person, type Event, VIEWS, VIEW_WORD, STATUSES, STATUS_WORD, GROUPS, GROUP_WORD,
  todayIn, weekOf, weekLabel, readableDay, isLate, carriedWeeks, lateWord, inView, summary, mayChange,
  officeRows, namesOf, shortNames, listActions, eventsOf,
} from "../../lib/tracker.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);
const brk = () => process.env.SMP_BREAK || "";

const CSS = `
*{box-sizing:border-box}
:root{--bar:%BAR%;--ink:#141C2B;--ink-2:#465268;--ink-3:#5E6E85;--line:#D8DEE8;--ground:#F5F6F9;--surface:#FFF;--surface-2:#EDF0F5;--gold:#9C5D08;
  --good:#1B6E4E;--good-bg:#E9F4EF;--warn:#8A6410;--warn-bg:#FBF2DC;--bad:#B23025;--bad-bg:#FBEDEB}
@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8590A3;--line:#333B4A;--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;--gold:#F5A623;
  --good:#63BE96;--good-bg:#1B2C26;--warn:#D7B04A;--warn-bg:#2A2515;--bad:#E8776B;--bad-bg:#33211F}}
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
h2.pt small{font-weight:400;color:var(--ink-3);font-size:14px;margin-left:8px}
.cats{display:flex;gap:3px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:15px}
.cats a{color:var(--ink-3);text-decoration:none;font:600 13.5px/1 inherit;padding:9px 11px;border-bottom:2px solid transparent;margin-bottom:-1px}
.cats a[aria-current="true"]{color:var(--ink);border-bottom-color:var(--gold)}
.cats a:hover,.cats a:focus-visible{color:var(--ink);outline:none}
/* how the list is grouped is a choice, on the far right of the views row */
.gby{margin-left:auto;align-self:center;display:inline-flex;align-items:center;gap:6px;font:600 12px/1 inherit;color:var(--ink-3);padding-bottom:6px}
.gby select{font:600 12.5px/1.4 inherit;color:var(--ink);border:1px solid var(--line);border-radius:7px;background:var(--surface);padding:4px 24px 4px 9px;appearance:none;-webkit-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%235E6E85'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center}
.gby select:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.tools form{display:flex;gap:8px;flex:1 1 260px;min-width:0}
.srch{flex:1 1 260px;min-width:0;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 inherit}
.go{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:8px 13px;font:600 13px/1.5 inherit;cursor:pointer;flex:none}
.cnt{font:600 10.5px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-left:auto;flex:none}
.list{display:flex;flex-direction:column;border-top:1px solid var(--line);margin-top:12px}
.none{padding:40px 4px 10px;color:var(--ink-3);font-size:14px;max-width:60ch}
.none b{color:var(--ink);font-weight:600;display:block;font-size:15.5px;margin-bottom:6px}
.strip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 16px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 13px}
.tile b{display:block;font-size:22px;font-weight:600;line-height:1.1;font-variant-numeric:tabular-nums}
.tile span{display:block;font:600 10.5px/1.4 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-top:4px}
.tile.late b{color:var(--bad)}
.grp{display:flex;align-items:center;gap:9px;padding:14px 2px 6px;font-size:13px;font-weight:600;color:var(--ink-2)}
.grp .cnt{margin-left:0}
/* the row: tick · name · date · owner · status · the arrow */
.row{display:grid;grid-template-columns:22px 1fr auto auto auto 26px;gap:12px;align-items:center;padding:11px 2px;border-bottom:1px solid var(--line)}
/* the name is plain text; a double-click turns it into a box in place */
.row .t{min-width:0;font-size:15px;line-height:1.35}
.row .t[data-rename]{cursor:text}
.row input.ttl{width:100%;min-width:0;border:1px solid var(--gold);border-radius:6px;background:var(--surface);color:var(--ink);padding:3px 7px;margin:-4px -8px;font:400 15px/1.35 inherit;outline:none}
.row.done .t{color:var(--ink-3);text-decoration:line-through}
.tick{width:18px;height:18px;border:1.5px solid var(--line);border-radius:5px;display:grid;place-items:center;color:var(--surface);background:var(--surface);cursor:pointer;padding:0}
.tick:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.row.done .tick{background:var(--good);border-color:var(--good)}
.tick svg{width:11px;height:11px}
.tick[disabled]{cursor:default;opacity:.55}
.when{font:400 12.5px/1.4 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);white-space:nowrap;text-align:right;background:none;border:0;padding:0}
.when.late{color:var(--bad);font-weight:600}
.when.pick{cursor:pointer;border-radius:6px;padding:3px 5px;margin:-3px -5px}
.when.pick:hover,.when.pick:focus-visible{background:var(--surface-2);outline:none}
.row input.dt{font:400 12.5px/1.4 ui-monospace,SFMono-Regular,monospace;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:2px 5px;background:var(--surface)}
/* the owner is a first name, drawn as the fact; a press opens the team */
.who{font:600 12.5px/1.4 inherit;color:var(--ink-2);white-space:nowrap;min-width:52px;text-align:right;background:none;border:0;padding:0;position:relative}
.who.pick{cursor:pointer;border-radius:6px;padding:3px 7px;margin:-3px -7px}
.who.pick:hover,.who.pick.on,.who.pick:focus-visible{background:var(--surface-2);outline:none}
.team{position:absolute;top:26px;right:0;z-index:5;min-width:140px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:5px;text-align:left}
.team button{display:flex;width:100%;align-items:center;gap:9px;background:none;border:0;border-radius:7px;padding:7px 9px;font:400 14px/1.4 inherit;color:var(--ink);cursor:pointer;text-align:left}
.team button:hover,.team button:focus-visible{background:var(--ground);outline:none}
.team button.on{font-weight:600}
.team button.on::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);margin-left:auto}
.st{font:600 11px/1 inherit;letter-spacing:.02em;padding:6px 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink-2);background:var(--surface);white-space:nowrap;min-width:104px;text-align:center;appearance:none;-webkit-appearance:none}
select.st{cursor:pointer;padding-right:22px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%235E6E85'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center}
select.st:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.st.prog{border-color:var(--gold);color:var(--gold)}
.st.done{border-color:var(--good);background:var(--good-bg);color:var(--good)}
/* the arrow that expands a row for its notes and history, and folds it */
.more{width:26px;height:26px;border-radius:7px;border:0;background:none;color:var(--ink-3);display:grid;place-items:center;cursor:pointer;padding:0;justify-self:end}
.more:hover,.more.on,.more:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
.more svg{width:16px;height:16px;transition:transform .15s}
.more.on svg{transform:rotate(180deg)}
@media (prefers-reduced-motion:reduce){.more svg{transition:none}}
.addrow{display:grid;grid-template-columns:22px 1fr auto auto auto 26px;gap:12px;align-items:center;padding:9px 2px;border-bottom:1px dashed var(--line)}
.addrow .plus{width:18px;height:18px;display:grid;place-items:center;color:var(--ink-3);font:600 15px/1 inherit}
.addrow input{border:0;background:transparent;color:var(--ink);font:400 15px/1.35 inherit;padding:2px 0;width:100%;min-width:0;outline:none}
.addrow input::placeholder{color:var(--ink-3)}
.addrow .when,.addrow .who,.addrow .st{opacity:.55}
.addrow:focus-within{background:var(--surface)}
.addrow:focus-within .when,.addrow:focus-within .who,.addrow:focus-within .st{opacity:1}
.addhint{font:400 12px/1.5 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);padding:6px 2px 0 34px}
/* the opened row is notes and history only — no Title box, no With */
.open{grid-column:1/-1;display:grid;grid-template-columns:1.4fr 1fr;gap:18px;padding:12px 2px 6px 34px;border-bottom:1px solid var(--line);background:var(--surface)}
.open .lab{font:600 10.5px/1.7 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin:10px 0 4px}
.open .lab:first-child{margin-top:0}
.open textarea{border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 inherit;width:100%;min-height:72px;resize:vertical}
.open .hint{font-size:12.5px;color:var(--ink-3);margin-top:4px}
.open .ro{font-size:14px;color:var(--ink-2)}
/* the history is small type in a box that scrolls, so a long life never
   lengthens the row it sits under; the track is shown, since on a Mac a
   scrollbar is an overlay that appears only once you scroll (§158) */
.hist{list-style:none;margin:0;padding:0 8px 0 0;font-size:11.5px;line-height:1.45;max-height:118px;overflow-y:auto;scrollbar-width:thin;scrollbar-gutter:stable;color:var(--ink-2)}
.hist li{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)}
.hist li:last-child{border-bottom:0}
.hist time{font:400 10.5px/1.6 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);white-space:nowrap}
.hist b{font-weight:600;color:var(--ink)}
.open .acts{display:flex;gap:14px;padding-top:10px;font-size:13px;align-items:center}
.open .acts button{background:none;border:0;padding:0;font:inherit;color:var(--ink-3);cursor:pointer;text-decoration:underline}
.open .acts button.danger{color:var(--bad)}
.open .acts .sure{display:flex;gap:10px;align-items:center;color:var(--ink-2)}
/* An author display beats the browser's own [hidden] rule (§298.2 measured
   it the other way and was wrong about Chromium's; here the question was
   asked of the page, checks/tracker.mjs §10, and the box was drawn OPEN).
   So hidden says hidden for every control that uses the attribute. */
[hidden]{display:none!important}
.open .acts .sure .go{padding:5px 10px}
.open .acts .sure .go.danger{color:var(--bad);border-color:var(--bad)}
.row.on{background:var(--surface);border-bottom-color:transparent}
.said{margin:0 0 12px;padding:9px 13px;border:1px solid var(--bad);border-radius:8px;background:var(--bad-bg);color:var(--bad);font-size:13.5px}
.said:empty{display:none}
.unread{margin:0 0 12px;padding:9px 13px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink-2);font-size:13.5px}
@media (max-width:720px){.strip{grid-template-columns:1fr 1fr}.open{grid-template-columns:1fr;padding-left:2px}.addrow{grid-template-columns:22px 1fr 26px}.addrow .when,.addrow .who,.addrow .st{display:none}
  .row{grid-template-columns:22px 1fr auto 26px;grid-template-areas:"tick t st more" ". when who more"}.row .tick{grid-area:tick}.row .t{grid-area:t}.row .st{grid-area:st}.row .when{grid-area:when;text-align:left}.row .who{grid-area:who}.row .more{grid-area:more}
  .team{right:auto;left:0}}
`;

function switcher(slug: string, have: ModuleKey[], here: ModuleKey): string {
  const items = moduleMenu(have).map((m) =>
    m.key === here
      ? '<span class="mi on" aria-current="true">' + esc(m.label) + "<i>" + esc(m.note) + "</i></span>"
      : '<a class="mi" href="' + esc(clientHref(slug, m.key, "")) + '">' + esc(m.label) + "<i>" + esc(m.note) + "</i></a>").join("");
  return '<details class="msw"><summary title="Modules" aria-label="Modules">' +
    '<svg viewBox="0 0 20 20" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1.2"/>' +
    '<rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2"/>' +
    "</g></svg></summary><div class=\"mmenu\">" + items + "</div></details>";
}

/* What the script needs to know rides on <body>: the two addresses it talks
   to, and the view, the search and the grouping the page was drawn with, so
   a press asks the server for the same list it is looking at. */
type BodyAttrs = { api: string; list: string; view: string; q: string; group: string };
function skeleton(slug: string, tenantName: string, have: ModuleKey[], bar: string, attrs: BodyAttrs | null, body: string): string {
  const a = attrs
    ? ' data-api="' + esc(attrs.api) + '" data-list="' + esc(attrs.list) + '" data-view="' + esc(attrs.view) + '" data-q="' + esc(attrs.q) + '" data-group="' + esc(attrs.group) + '"'
    : "";
  return "<!doctype html>\n<html lang='en' data-module='tracker'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " &mdash; " + esc(MODULE_DEF.tracker.label) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    "<style>" + CSS.replace("%BAR%", bar) + "</style>\n</head>\n" +
    "<body" + a + ">\n" +
    '<header class="bar">' + switcher(slug, have, "tracker") +
    "<h1>" + esc(MODULE_DEF.tracker.label) + "</h1>" +
    '<span class="org">&middot; <b>' + esc(tenantName) + "</b></span></header>\n" +
    body +
    (attrs ? '<script src="' + esc(clientHref(slug, "tracker", "app.js")) + '"></script>\n' : "") +
    "</body>\n</html>\n";
}

/* Not the office: said in words, with the way back (§61). */
export async function refusedDocument(slug: string, tenantId: string, tenantName: string, have: ModuleKey[]): Promise<string> {
  const bar = await barFor(tenantId);
  return skeleton(slug, tenantName, have, bar, null,
    '<main class="pg"><div class="none"><b>The Internal Tracker is the office\'s.</b>' +
    'It is where Forefront keeps its own weekly actions about ' + esc(tenantName) + '. ' +
    '<a href="' + esc(clientHref(slug, null, "")) + '">Back to ' + esc(tenantName) + "</a></div></main>\n");
}

export type Ask = { view: View; q: string; open: string | null; group: Group };
export type PageArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[]; ask: Ask; who: Who; today?: string;
};

type Q = Parameters<typeof officeRows>[0];
export type Loaded = { office: Person[]; names: Map<string, string>; short: Map<string, string>; actions: Action[]; events: Event[]; open: string | null };

/* ONE READ FOR THE PAGE AND FOR A PRESS. An opened row that is no longer on
   the list (deleted, or another client's id on a pasted link) is read as
   nothing opened, never as an empty panel. The short names are worked out
   over everybody NAMED on the list, seat or no seat, so a former owner's
   row is shortened by the same rule as a present one. */
export async function load(c: Q, openId: string | null): Promise<Loaded> {
  const office = await officeRows(c), names = await namesOf(c), actions = await listActions(c);
  const named = new Map<string, string>(office.map((p) => [p.key, p.name]));
  for (const a of actions) if (!named.has(a.ownerKey)) named.set(a.ownerKey, names.get(a.ownerKey) || a.ownerKey);
  const short = shortNames(Array.from(named, ([key, name]) => ({ key, name })));
  const open = openId && actions.some((a) => a.id === openId) ? openId : null;
  return { office, names, short, actions, events: open ? await eventsOf(c, open) : [], open };
}

const statusPill = (a: Action, live: boolean): string => {
  const cls = "st" + (a.status === "in_progress" ? " prog" : a.status === "done" ? " done" : "");
  if (!live) return '<span class="' + cls + '">' + esc(STATUS_WORD[a.status]) + "</span>";
  return '<select class="' + cls + '" data-act="status" aria-label="Status">' +
    STATUSES.map((s) => '<option value="' + s + '"' + (s === a.status ? " selected" : "") + ">" + esc(STATUS_WORD[s]) + "</option>").join("") +
    "</select>";
};
const TICK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function whenText(a: Action, today: string): { text: string; late: boolean } {
  if (a.status === "done") return { text: "Done " + readableDay(a.doneDay, today), late: false };
  if (!a.due) return { text: "No date", late: false };
  if (!isLate(a.due, today)) return { text: readableDay(a.due, today), late: false };
  return { text: lateWord(carriedWeeks(a.firstDue || a.due, today)) + " · " + readableDay(a.due, today), late: true };
}

/* THE OWNER CELL. The name is the fact for everybody; for whoever may hand
   the action on it is also the way to — pressing it opens the office on
   this client, first names only, the present owner marked. The team rides
   in the cell hidden, so nothing is fetched to open it, and every option is
   a register KEY the server checks again (§42). */
function whoCell(a: Action, L: Loaded, live: boolean): string {
  const nm = (k: string) => L.short.get(k) || L.names.get(k) || k;
  if (!live) return '<span class="who">' + esc(nm(a.ownerKey)) + "</span>";
  const team = L.office.map((p) =>
    '<button type="button" role="option" data-act="pick-owner" data-key="' + esc(p.key) + '"' +
    (p.key === a.ownerKey ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + ">" + esc(nm(p.key)) + "</button>").join("");
  return '<span class="who pick" role="button" tabindex="0" data-act="who" aria-haspopup="listbox" aria-expanded="false" title="Hand it to somebody else">' +
    '<span class="wn">' + esc(nm(a.ownerKey)) + "</span>" +
    '<span class="team" role="listbox" aria-label="Owner" hidden>' + team + "</span></span>";
}

function row(a: Action, L: Loaded, who: Who, today: string, opened: boolean): string {
  const live = brk() === "who-everyone" ? true : mayChange(a, who);
  const w = whenText(a, today);
  return '<div class="row' + (a.status === "done" ? " done" : "") + (opened ? " on" : "") + '" data-id="' + esc(a.id) + '" data-status="' + a.status + '">' +
    '<button class="tick" type="button" role="checkbox" aria-checked="' + (a.status === "done") + '" aria-label="' + (a.status === "done" ? "Mark not done" : "Mark done") + '"' +
    (live ? ' data-act="tick"' : " disabled") + ">" + (a.status === "done" ? TICK : "") + "</button>" +
    '<div class="t"' + (live ? ' data-rename="1" title="Double-click to rename"' : "") + ">" + esc(a.title) + "</div>" +
    (live && a.status !== "done"
      ? '<button class="when' + (w.late ? " late" : "") + ' pick" type="button" data-act="due" data-due="' + esc(a.due || "") + '" title="Change the date">' + esc(w.text) + "</button>"
      : '<span class="when' + (w.late ? " late" : "") + '">' + esc(w.text) + "</span>") +
    whoCell(a, L, live) +
    statusPill(a, live) +
    '<button class="more' + (opened ? " on" : "") + '" type="button" data-act="more" aria-expanded="' + opened + '" aria-label="' + (opened ? "Close" : "Notes and history") + '" title="' + (opened ? "Close" : "Notes and history") + '">' + ARROW + "</button>" +
    "</div>";
}

/* The opened row: the notes, Delete behind a question, and the history in a
   box that scrolls. No Title box (the name is renamed on the row) and no
   owner control (the name on the row is it). */
function openPanel(a: Action, L: Loaded, who: Who, today: string): string {
  const live = mayChange(a, who);
  const name = (k: string) => L.names.get(k) || k;
  const hist = L.events.map((e) => {
    const at = e.at ? new Date(e.at) : null;
    const day = at ? todayIn(at) : "";
    const hm = at ? new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).format(at) : "";
    const what = e.kind === "created"
      ? "created it, owner " + esc(name(a.ownerKey))
      : esc(STATUS_WORD[e.from || "not_started"]) + " → " + esc(STATUS_WORD[e.to || "not_started"]);
    return "<li><time>" + esc(readableDay(day, today)) + " " + esc(hm) + "</time><span><b>" + esc(name(e.by)) + "</b> · " + what + "</span></li>";
  }).join("");
  const left = live
    ? '<p class="lab">Notes</p><textarea data-act="notes" aria-label="Notes" maxlength="5000">' + esc(a.description) + "</textarea>" +
      '<div class="hint">Saved when you leave the box.</div>' +
      '<div class="acts"><button type="button" class="danger" data-act="delete-ask">Delete</button>' +
      '<span class="sure" hidden>Delete this action? <button type="button" class="go danger" data-act="delete">Yes, delete it</button>' +
      '<button type="button" class="go" data-act="delete-no">Keep it</button></span></div>'
    : '<p class="lab">Notes</p><div class="ro">' + (a.description ? esc(a.description).replace(/\n/g, "<br>") : "&mdash;") + "</div>";
  return '<div class="open" data-id="' + esc(a.id) + '"><div>' + left + "</div>" +
    '<div><p class="lab">History</p><ul class="hist">' + hist + "</ul></div></div>";
}

/* HOW THE ROWS ARE GROUPED: by owner in the register's own order (decision
   6), by status in the three words' own order, by due day soonest first
   with the undated last, or not at all. A group is made from the rows it
   holds, so a heading never stands over nothing. */
type Grp = { key: string; label: string | null; rows: Action[] };
function grouped(shown: Action[], L: Loaded, group: Group, today: string): Grp[] {
  const by = new Map<string, Action[]>();
  const keyOf = (a: Action) => group === "owner" ? a.ownerKey : group === "status" ? a.status : group === "due" ? (a.due || "none") : "all";
  for (const a of shown) { const k = keyOf(a); if (!by.has(k)) by.set(k, []); by.get(k)!.push(a); }
  let keys = Array.from(by.keys());
  if (group === "owner") {
    const order = new Map<string, number>(L.office.map((o, i) => [o.key, i]));
    keys.sort((x, y) => (order.get(x) ?? 999) - (order.get(y) ?? 999) || (L.names.get(x) || x).localeCompare(L.names.get(y) || y));
  } else if (group === "status") {
    keys.sort((x, y) => (STATUSES as readonly string[]).indexOf(x) - (STATUSES as readonly string[]).indexOf(y));
  } else if (group === "due") {
    keys.sort((x, y) => (x === "none" ? 1 : 0) - (y === "none" ? 1 : 0) || x.localeCompare(y));
  }
  const label = (k: string) => group === "owner" ? (L.names.get(k) || k)
    : group === "status" ? STATUS_WORD[k as keyof typeof STATUS_WORD]
    : group === "due" ? (k === "none" ? "No date" : readableDay(k, today))
    : null;
  return keys.map((k) => ({ key: k, label: label(k), rows: by.get(k)! }));
}

export type ListOut = { body: string; count: string; open: string | null };
/* THE LIST, THE STRIP AND THE COUNT — the part of the page a press redraws.
   trackerDocument() wraps it once; the api answers a press with it again. */
export function listBody(L: Loaded, p: PageArgs, today: string): ListOut {
  const here = clientHref(p.slug, "tracker", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;
  const viewHref = (v: View) => here + "?view=" + v + (q ? "&q=" + encodeURIComponent(q) : "");
  const all = L.actions;
  const sum = summary(all, today);
  const shown = all.filter((a) => inView(a, view, p.who, today))
    .filter((a) => !q || a.title.toLowerCase().includes(q.toLowerCase()));
  const strip = '<div class="strip">' +
    '<div class="tile"><b>' + sum.open + "</b><span>Open</span></div>" +
    '<div class="tile' + (sum.late ? " late" : "") + '"><b>' + sum.late + "</b><span>Late</span></div>" +
    '<div class="tile"><b>' + sum.dueWeek + "</b><span>Due this week" + (sum.dueWeekNotStarted ? " &middot; " + sum.dueWeekNotStarted + " not started" : "") + "</span></div>" +
    '<div class="tile"><b>' + sum.doneWeek + "</b><span>Done this week</span></div></div>";
  const count = plural(shown.length, "action", "actions") + (view === "week" ? " on this week" : "");
  const tools = '<div class="tools"><form method="get" action="' + esc(here) + '" role="search">' +
    '<input type="hidden" name="view" value="' + view + '">' +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search actions" aria-label="Search actions">' +
    '<button class="go" type="submit">Search</button></form>' +
    '<span class="cnt" id="count">' + esc(count) + "</span></div>";
  const me = p.who.personKey;
  const meShort = me ? L.short.get(me) || L.names.get(me) || me : "";
  const rows = grouped(shown, L, p.ask.group, today).map((g) =>
    (g.label == null ? "" : '<div class="grp" data-key="' + esc(g.key) + '">' + esc(g.label) + ' <span class="cnt">' + g.rows.length + "</span></div>") +
    g.rows.map((a) => row(a, L, p.who, today, a.id === L.open) + (a.id === L.open ? openPanel(a, L, p.who, today) : "")).join("")).join("");
  /* THE NEXT EMPTY LINE — the sheet's own way in. Somebody the register has
     not placed yet (§313.32) is told so rather than handed a box that would
     be refused on Enter (§61). */
  const addrow = me
    ? '<div class="addrow"><span class="plus">+</span>' +
      '<input id="add" data-act="add" placeholder="' + (all.length ? "Type an action and press Enter" : "Type the first action for " + esc(p.tenantName) + " and press Enter") + '" aria-label="New action" maxlength="200">' +
      '<span class="when">No date</span><span class="who">' + esc(meShort) + '</span><span class="st">Not started</span><span></span></div>'
    : '<div class="addhint">You are not on this client\'s register yet, so nothing can be owned by you here; open the client once more and it will be.</div>';
  const hint = me ? '<div class="addhint">Enter adds it under you &middot; then set its date, owner or status on the row &middot; the arrow for its notes</div>' : "";
  const none = !all.length
    ? '<div class="none"><b>Nothing on the list for ' + esc(p.tenantName) + ' yet.</b>The first line lands under you; give it a date on the row and it moves to the week it is due.</div>'
    : !shown.length
      ? '<div class="none"><b>Nothing ' + (q ? "matches" : "here") + '.</b>' + (q ? "Try another word, or " : "Add one on the line above, or ") + '<a href="' + esc(viewHref("all")) + '">see all of them</a>.</div>'
      : "";
  return { body: strip + (all.length ? tools : "") + '<div class="list">' + rows + addrow + "</div>" + hint + none, count, open: L.open };
}

/* A press's answer: the list read again under the tenant and drawn by the
   same function — never a second renderer (§53.5). */
export async function listFragment(p: PageArgs): Promise<ListOut> {
  const today = p.today || todayIn();
  const L = await withTenant(p.tenantId, (c) => load(c, p.ask.open));
  return listBody(L, p, today);
}

export async function trackerDocument(p: PageArgs): Promise<string> {
  const today = p.today || todayIn();
  const bar = await barFor(p.tenantId);
  const here = clientHref(p.slug, "tracker", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;
  const attrs: BodyAttrs = { api: clientHref(p.slug, "tracker", "api"), list: clientHref(p.slug, "tracker", "list"), view, q, group: p.ask.group };

  /* A LIST THAT COULD NOT BE READ IS NOT AN EMPTY ONE (§35, §93). */
  let L: Loaded | null = null;
  try {
    L = await withTenant(p.tenantId, (c) => load(c, p.ask.open));
  } catch (e) {
    console.error("tracker: reading " + p.slug + "'s list:", (e as Error).message);
  }

  const w = weekOf(today);
  const viewHref = (v: View) => here + "?view=" + v + (q ? "&q=" + encodeURIComponent(q) : "");
  const nav = '<nav class="cats" aria-label="Views">' +
    VIEWS.map((v) => '<a href="' + esc(viewHref(v)) + '"' + (v === view ? ' aria-current="true"' : "") + ">" + esc(VIEW_WORD[v]) + "</a>").join("") +
    '<label class="gby">Group by <select data-act="group" aria-label="Group by">' +
    GROUPS.map((g) => '<option value="' + g + '"' + (g === p.ask.group ? " selected" : "") + ">" + esc(GROUP_WORD[g]) + "</option>").join("") +
    "</select></label></nav>";
  const title = '<h2 class="pt">' + esc(VIEW_WORD[view]) +
    (view === "week" ? " <small>" + esc(weekLabel(w, today)) + "</small>" : "") + "</h2>";

  if (!L) {
    const body = '<main class="pg">' + title + nav +
      '<p class="unread">The list could not be read just now. Nothing has been lost &mdash; try again in a moment.</p></main>\n';
    return skeleton(p.slug, p.tenantName, p.have, bar, null, body);
  }
  const out = listBody(L, p, today);
  const body = '<main class="pg">' + title + nav +
    '<p class="said" id="said" role="alert" aria-live="polite"></p>' +
    '<div id="body">' + out.body + "</div></main>\n";
  return skeleton(p.slug, p.tenantName, p.have, bar, attrs, body);
}
