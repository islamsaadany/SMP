/* ── THE INTERNAL TRACKER: the page (spec 054, drawn 2026-09-15) ─────────
   One list, read by the week, and IT WORKS LIKE THE SHEET IT REPLACES
   (Islam: "super simple"): the list ends in the next empty line, a title and
   Enter add an action, and every fact on a row is changed on the row — the
   date, the owner, who else, the status, the done tick. A row opens in place
   for its notes and its history. No form, no detail page, no Save button.

   THE STYLESHEET IS THE ONE SIGNED OFF, verbatim from
   design-mockups/internal-tracker/2026-09-15_this-week-edit-detail-empty.html
   (rule 1c), which is the module page's own token block extended with a list
   of actions. The chrome and the switcher are Insights' (modules/insights/
   page.ts), because a module that drew its own would be the second place a
   module's name is spelt (§53.5).

   THE ONE SCRIPT the shell's policy admits is served by this module at its
   own address (`script-src 'self'`, lib/shell.ts) — modules/tracker/script.ts
   — and nothing here is inline. Every control is drawn as the FACT until it
   is pressed, and only for somebody the server would let press it (§61): a
   control the server refuses is never drawn. */
import { withTenant } from "../../lib/tenant.ts";
import { barFor } from "../../lib/branding.ts";
import { clientHref, moduleMenu, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import {
  type Action, type Who, type View, type Person, type Event, VIEWS, VIEW_WORD, STATUSES, STATUS_WORD,
  todayIn, weekOf, weekLabel, readableDay, isLate, carriedWeeks, inView, summary, mayChange, mayOwn,
  officeRows, namesOf, listActions, eventsOf,
} from "../../lib/tracker.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);

/* Initials are the first letter of the first two words of the register's
   name — a square the same on every row. */
export function initials(name: string): string {
  const w = String(name || "").trim().split(/\s+/).filter(Boolean);
  return (w.length ? (w[0][0] || "") + (w[1] ? w[1][0] : "") : "?").toUpperCase();
}

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
.av{width:22px;height:22px;border-radius:6px;background:var(--surface-2);color:var(--ink-2);display:inline-grid;place-items:center;font:600 10px/1 ui-monospace,SFMono-Regular,monospace;flex:none}
.row{display:grid;grid-template-columns:22px 1fr auto auto auto;gap:12px;align-items:center;padding:11px 2px;border-bottom:1px solid var(--line)}
.row .t{min-width:0;font-size:15px;line-height:1.35}
.row .t a{color:inherit;text-decoration:none}.row .t a:hover,.row .t a:focus-visible{text-decoration:underline;outline:none}
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
.who{display:flex;gap:3px;min-width:52px;justify-content:flex-end;background:none;border:0;padding:0}
.who .av{width:20px;height:20px;font-size:9px}
.who.pick{cursor:pointer;border-radius:6px}.who.pick:hover .av,.who.pick:focus-visible .av{outline:1px solid var(--gold)}
.who.pick:focus-visible{outline:none}
.st{font:600 11px/1 inherit;letter-spacing:.02em;padding:6px 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink-2);background:var(--surface);white-space:nowrap;min-width:104px;text-align:center;appearance:none;-webkit-appearance:none}
select.st{cursor:pointer;padding-right:22px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%235E6E85'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center}
select.st:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.st.prog{border-color:var(--gold);color:var(--gold)}
.st.done{border-color:var(--good);background:var(--good-bg);color:var(--good)}
.addrow{display:grid;grid-template-columns:22px 1fr auto auto auto;gap:12px;align-items:center;padding:9px 2px;border-bottom:1px dashed var(--line)}
.addrow .plus{width:18px;height:18px;display:grid;place-items:center;color:var(--ink-3);font:600 15px/1 inherit}
.addrow input{border:0;background:transparent;color:var(--ink);font:400 15px/1.35 inherit;padding:2px 0;width:100%;min-width:0;outline:none}
.addrow input::placeholder{color:var(--ink-3)}
.addrow .when,.addrow .who,.addrow .st{opacity:.55}
.addrow:focus-within{background:var(--surface)}
.addrow:focus-within .when,.addrow:focus-within .who,.addrow:focus-within .st{opacity:1}
.addhint{font:400 12px/1.5 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);padding:6px 2px 0 34px}
.open{grid-column:1/-1;display:grid;grid-template-columns:1.4fr 1fr;gap:18px;padding:12px 2px 6px 34px;border-bottom:1px solid var(--line);background:var(--surface)}
.open .lab{font:600 10.5px/1.7 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin:10px 0 4px}
.open .lab:first-child{margin-top:0}
.open textarea,.open input.ttl,.open select.own{border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 inherit;width:100%}
.open textarea{min-height:72px;resize:vertical}
.open .hint{font-size:12.5px;color:var(--ink-3);margin-top:4px}
.open .ro{font-size:14px;color:var(--ink-2)}
.ticks{display:flex;flex-wrap:wrap;gap:8px}
.ticks label{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:999px;padding:5px 11px 5px 7px;font:500 13px/1.4 inherit;color:var(--ink-2);background:var(--surface);cursor:pointer}
.ticks input{accent-color:var(--gold)}
.hist{list-style:none;margin:0;padding:0;font-size:13.5px}
.hist li{display:grid;grid-template-columns:auto 1fr;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)}
.hist li:last-child{border-bottom:0}
.hist time{font:400 12px/1.6 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);white-space:nowrap}
.hist b{font-weight:600}
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
@media (max-width:720px){.strip{grid-template-columns:1fr 1fr}.open{grid-template-columns:1fr;padding-left:2px}.addrow{grid-template-columns:22px 1fr}.addrow .when,.addrow .who,.addrow .st{display:none}
  .row{grid-template-columns:22px 1fr auto;grid-template-areas:"tick t st" ". when who"}.row .tick{grid-area:tick}.row .t{grid-area:t}.row .st{grid-area:st}.row .when{grid-area:when;text-align:left}.row .who{grid-area:who}}
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

function skeleton(slug: string, tenantName: string, have: ModuleKey[], bar: string, api: string, body: string, withScript: boolean): string {
  return "<!doctype html>\n<html lang='en' data-module='tracker'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " &mdash; " + esc(MODULE_DEF.tracker.label) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    "<style>" + CSS.replace("%BAR%", bar) + "</style>\n</head>\n" +
    '<body data-api="' + esc(api) + '">\n' +
    '<header class="bar">' + switcher(slug, have, "tracker") +
    "<h1>" + esc(MODULE_DEF.tracker.label) + "</h1>" +
    '<span class="org">&middot; <b>' + esc(tenantName) + "</b></span></header>\n" +
    body +
    (withScript ? '<script src="' + esc(clientHref(slug, "tracker", "app.js")) + '"></script>\n' : "") +
    "</body>\n</html>\n";
}

/* Not the office: said in words, with the way back (§61). */
export async function refusedDocument(slug: string, tenantId: string, tenantName: string, have: ModuleKey[]): Promise<string> {
  const bar = await barFor(tenantId);
  return skeleton(slug, tenantName, have, bar, "",
    '<main class="pg"><div class="none"><b>The Internal Tracker is the office\'s.</b>' +
    'It is where Forefront keeps its own weekly actions about ' + esc(tenantName) + '. ' +
    '<a href="' + esc(clientHref(slug, null, "")) + '">Back to ' + esc(tenantName) + "</a></div></main>\n", false);
}

export type Ask = { view: View; q: string; open: string | null };
export type PageArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[]; ask: Ask; who: Who; today?: string;
};

type Loaded = { office: Person[]; names: Map<string, string>; actions: Action[]; events: Event[] };

const statusPill = (a: Action, live: boolean): string => {
  const cls = "st" + (a.status === "in_progress" ? " prog" : a.status === "done" ? " done" : "");
  if (!live) return '<span class="' + cls + '">' + esc(STATUS_WORD[a.status]) + "</span>";
  return '<select class="' + cls + '" data-act="status" aria-label="Status">' +
    STATUSES.map((s) => '<option value="' + s + '"' + (s === a.status ? " selected" : "") + ">" + esc(STATUS_WORD[s]) + "</option>").join("") +
    "</select>";
};
const TICK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function whenText(a: Action, today: string): { text: string; late: boolean } {
  if (a.status === "done") return { text: "Done " + readableDay(a.doneDay, today), late: false };
  if (!a.due) return { text: "No date", late: false };
  if (!isLate(a.due, today)) return { text: readableDay(a.due, today), late: false };
  const n = carriedWeeks(a.firstDue || a.due, today);
  return { text: "Late · " + readableDay(a.due, today) + (n ? " · carried " + plural(n, "week", "weeks") : ""), late: true };
}

function row(a: Action, L: Loaded, who: Who, today: string, href: string, opened: boolean): string {
  const live = mayChange(a, who);
  const w = whenText(a, today);
  const name = (k: string) => L.names.get(k) || k;
  const others = a.collaborators.filter((k) => k !== a.ownerKey);
  const whoCell = '<span class="av" title="' + esc(name(a.ownerKey)) + '">' + esc(initials(name(a.ownerKey))) + "</span>" +
    others.map((k) => '<span class="av" title="' + esc(name(k)) + '">' + esc(initials(name(k))) + "</span>").join("");
  return '<div class="row' + (a.status === "done" ? " done" : "") + (opened ? " on" : "") + '" data-id="' + esc(a.id) + '" data-status="' + a.status + '">' +
    '<button class="tick" type="button" role="checkbox" aria-checked="' + (a.status === "done") + '" aria-label="' + (a.status === "done" ? "Mark not done" : "Mark done") + '"' +
    (live ? ' data-act="tick"' : " disabled") + ">" + (a.status === "done" ? TICK : "") + "</button>" +
    '<div class="t"><a href="' + esc(href) + '"' + (opened ? ' aria-expanded="true"' : "") + ">" + esc(a.title) + "</a></div>" +
    (live && a.status !== "done"
      ? '<button class="when' + (w.late ? " late" : "") + ' pick" type="button" data-act="due" data-due="' + esc(a.due || "") + '" title="Change the date">' + esc(w.text) + "</button>"
      : '<span class="when' + (w.late ? " late" : "") + '">' + esc(w.text) + "</span>") +
    (live ? '<a class="who pick" href="' + esc(href) + '" title="Who is on it">' + whoCell + "</a>" : '<span class="who">' + whoCell + "</span>") +
    statusPill(a, live) +
    "</div>";
}

function openPanel(a: Action, L: Loaded, who: Who, today: string): string {
  const live = mayChange(a, who), own = mayOwn(a, who);
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
    ? '<p class="lab">Title</p><input class="ttl" data-act="rename" value="' + esc(a.title) + '" aria-label="Title" maxlength="200">' +
      '<p class="lab">Notes</p><textarea data-act="notes" aria-label="Notes" maxlength="5000">' + esc(a.description) + "</textarea>" +
      '<div class="hint">Saved when you leave the box.</div>'
    : '<p class="lab">Notes</p><div class="ro">' + (a.description ? esc(a.description).replace(/\n/g, "<br>") : "&mdash;") + "</div>";
  const owner = own
    ? '<p class="lab">Owner</p><select class="own" data-act="owner" aria-label="Owner">' +
      L.office.map((p) => '<option value="' + esc(p.key) + '"' + (p.key === a.ownerKey ? " selected" : "") + ">" + esc(p.name) + "</option>").join("") +
      (L.office.some((p) => p.key === a.ownerKey) ? "" : '<option value="' + esc(a.ownerKey) + '" selected>' + esc(name(a.ownerKey)) + "</option>") +
      "</select>" +
      '<p class="lab">With</p><div class="ticks">' +
      L.office.filter((p) => p.key !== a.ownerKey).map((p) =>
        '<label><input type="checkbox" data-act="collab" value="' + esc(p.key) + '"' + (a.collaborators.includes(p.key) ? " checked" : "") + "> " + esc(p.name) + "</label>").join("") +
      (L.office.filter((p) => p.key !== a.ownerKey).length ? "" : '<span class="ro">Nobody else holds a seat here yet.</span>') +
      "</div>"
    : '<p class="lab">Owner</p><div class="ro">' + esc(name(a.ownerKey)) + "</div>" +
      '<p class="lab">With</p><div class="ro">' + (a.collaborators.length ? a.collaborators.map((k) => esc(name(k))).join(", ") : "Nobody yet") + "</div>";
  const acts = own
    ? '<div class="acts"><button type="button" class="danger" data-act="delete-ask">Delete</button>' +
      '<span class="sure" hidden>Delete this action? <button type="button" class="go danger" data-act="delete">Yes, delete it</button>' +
      '<button type="button" class="go" data-act="delete-no">Keep it</button></span></div>'
    : "";
  return '<div class="open" data-id="' + esc(a.id) + '"><div>' + left + owner + acts + "</div>" +
    '<div><p class="lab">History</p><ul class="hist">' + hist + "</ul></div></div>";
}

export async function trackerDocument(p: PageArgs): Promise<string> {
  const today = p.today || todayIn();
  const bar = await barFor(p.tenantId);
  const api = clientHref(p.slug, "tracker", "api");
  const here = clientHref(p.slug, "tracker", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;

  /* A LIST THAT COULD NOT BE READ IS NOT AN EMPTY ONE (§35, §93). */
  let L: Loaded | null = null;
  try {
    L = await withTenant(p.tenantId, async (c) => ({
      office: await officeRows(c), names: await namesOf(c), actions: await listActions(c),
      events: p.ask.open ? await eventsOf(c, p.ask.open) : [],
    }));
  } catch (e) {
    console.error("tracker: reading " + p.slug + "'s list:", (e as Error).message);
  }

  const w = weekOf(today);
  const viewHref = (v: View) => here + "?view=" + v + (q ? "&q=" + encodeURIComponent(q) : "");
  const openHref = (id: string) => here + "?view=" + view + (q ? "&q=" + encodeURIComponent(q) : "") + "&open=" + encodeURIComponent(id);
  const nav = '<nav class="cats" aria-label="Views">' +
    VIEWS.map((v) => '<a href="' + esc(viewHref(v)) + '"' + (v === view ? ' aria-current="true"' : "") + ">" + esc(VIEW_WORD[v]) + "</a>").join("") + "</nav>";
  const title = '<h2 class="pt">' + esc(VIEW_WORD[view]) +
    (view === "week" ? " <small>" + esc(weekLabel(w, today)) + "</small>" : "") + "</h2>";

  let body: string;
  if (!L) {
    body = '<main class="pg">' + title + nav +
      '<p class="unread">The list could not be read just now. Nothing has been lost &mdash; try again in a moment.</p></main>\n';
    return skeleton(p.slug, p.tenantName, p.have, bar, api, body, false);
  }

  const all = L.actions;
  const sum = summary(all, today);
  const shown = all.filter((a) => inView(a, view, p.who, today))
    .filter((a) => !q || a.title.toLowerCase().includes(q.toLowerCase()));
  const strip = '<div class="strip">' +
    '<div class="tile"><b>' + sum.open + "</b><span>Open</span></div>" +
    '<div class="tile' + (sum.late ? " late" : "") + '"><b>' + sum.late + "</b><span>Late</span></div>" +
    '<div class="tile"><b>' + sum.dueWeek + "</b><span>Due this week" + (sum.dueWeekNotStarted ? " &middot; " + sum.dueWeekNotStarted + " not started" : "") + "</span></div>" +
    '<div class="tile"><b>' + sum.doneWeek + "</b><span>Done this week</span></div></div>";
  const tools = '<div class="tools"><form method="get" action="' + esc(here) + '" role="search">' +
    '<input type="hidden" name="view" value="' + view + '">' +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search actions" aria-label="Search actions">' +
    '<button class="go" type="submit">Search</button></form>' +
    '<span class="cnt">' + esc(plural(shown.length, "action", "actions")) + (view === "week" ? " on this week" : "") + "</span></div>";

  /* GROUPED BY OWNER, in the register's own order (decision 6); an owner no
     longer holding a seat still heads a group, by the register's name. */
  const order = new Map<string, number>(L.office.map((o, i) => [o.key, i]));
  const owners = Array.from(new Set(shown.map((a) => a.ownerKey)))
    .sort((x, y) => (order.get(x) ?? 999) - (order.get(y) ?? 999) || (L!.names.get(x) || x).localeCompare(L!.names.get(y) || y));
  const me = p.who.personKey;
  const meName = me ? L.names.get(me) || me : "";
  const rows = owners.map((k) => {
    const mine = shown.filter((a) => a.ownerKey === k);
    const nm = L!.names.get(k) || k;
    return '<div class="grp"><span class="av">' + esc(initials(nm)) + "</span>" + esc(nm) + ' <span class="cnt">' + mine.length + "</span></div>" +
      mine.map((a) => row(a, L!, p.who, today, openHref(a.id), a.id === p.ask.open) +
        (a.id === p.ask.open ? openPanel(a, L!, p.who, today) : "")).join("");
  }).join("");
  /* THE NEXT EMPTY LINE — the sheet's own way in. Somebody the register has
     not placed yet (§313.32) is told so rather than handed a box that would
     be refused on Enter (§61). */
  const addrow = me
    ? '<div class="addrow"><span class="plus">+</span>' +
      '<input id="add" data-act="add" placeholder="' + (all.length ? "Type an action and press Enter" : "Type the first action for " + esc(p.tenantName) + " and press Enter") + '" aria-label="New action" maxlength="200">' +
      '<span class="when">No date</span><span class="who"><span class="av" title="' + esc(meName) + '">' + esc(initials(meName)) + '</span></span><span class="st">Not started</span></div>'
    : '<div class="addhint">You are not on this client\'s register yet, so nothing can be owned by you here; open the client once more and it will be.</div>';
  const hint = me ? '<div class="addhint">Enter adds it under you &middot; then set its date, owner or status on the row</div>' : "";
  const none = !all.length
    ? '<div class="none"><b>Nothing on the list for ' + esc(p.tenantName) + ' yet.</b>The first line lands under you; give it a date on the row and it moves to the week it is due.</div>'
    : !shown.length
      ? '<div class="none"><b>Nothing ' + (q ? "matches" : "here") + '.</b>' + (q ? "Try another word, or " : "Add one on the line above, or ") + '<a href="' + esc(viewHref("all")) + '">see all of them</a>.</div>'
      : "";

  body = '<main class="pg">' + title + nav + strip + (all.length ? tools : "") +
    '<p class="said" id="said" role="alert" aria-live="polite"></p>' +
    '<div class="list">' + rows + addrow + "</div>" + hint + none + "</main>\n";
  return skeleton(p.slug, p.tenantName, p.have, bar, api, body, true);
}
