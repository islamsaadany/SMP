/* ── MEETING NOTES: the pages (spec 055, drawn 2026-09-16) ───────────────
   Two: the LIST of meetings, newest first with a search; and ONE NOTE — its
   title, its date, its attendees, the text you type while the meeting runs,
   and beside them the minutes once they have been refined or written.

   THE STYLESHEET IS THE ONE SIGNED OFF, from
   design-mockups/meeting-notes/2026-09-16_list-note-minutes-email.html
   (rule 1c), which is the tracker's own with a note's page added to it — so
   the two office modules read as one product and nothing here invents a
   second vocabulary for a row, a chip or a box. The chrome and the switcher
   are the tracker's (modules/tracker/page.ts), because a module that drew
   its own would be the second place a module's name is spelt (§53.5).

   EVERY WRITE ANSWERS WITH THE PAGE DRAWN AGAIN, the way the tracker's list
   is (§356.12): the server re-reads under the tenant and hands back the
   note's own body, which the script swaps in — so the browser never renders
   a part of its own and cannot disagree with the server about one. Nothing
   is inline: the one script is served at the module's own address under
   `script-src 'self'` (lib/shell.ts).

   AND A CONTROL IS DRAWN ONLY FOR SOMEBODY THE SERVER WOULD LET PRESS IT
   (§61): the whole module is the office's, so inside it every control is
   live — what is drawn as a fact rather than a control is what nothing can
   change, like a send that has already gone. */
import { withTenant } from "../../lib/tenant.ts";
import { barFor } from "../../lib/branding.ts";
import { clientHref, moduleMenu, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import {
  type Note, type Who, type Minutes, type Named, type SendRow, type Register, type Person,
  readableDay, todayIn, minutesEmpty, namedOf, registerOf, officeRows, shortNames,
  listNotes, oneNote, sendsOf, subjectFor,
} from "../../lib/notes.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);

const CSS = `
*{box-sizing:border-box}
:root{--bar:%BAR%;--ink:#141C2B;--ink-2:#465268;--ink-3:#5E6E85;--line:#D8DEE8;--line-ctl:#7C8798;--focus:#8A6B22;--ground:#F5F6F9;--surface:#FFF;--surface-2:#EDF0F5;--gold:#9C5D08;
  --good:#1B6E4E;--good-bg:#E9F4EF;--warn:#8A6410;--warn-bg:#FBF2DC;--bad:#B23025;--bad-bg:#FBEDEB}
@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8590A3;--line:#333B4A;--line-ctl:#6E7A8E;--focus:#E6C65C;--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;--gold:#F5A623;
  --good:#63BE96;--good-bg:#1B2C26;--warn:#D7B04A;--warn-bg:#2A2515;--bad:#E8776B;--bad-bg:#33211F}}
/* ── THE FOCUS RING (2026-09-20) ────────────────────────────────────
   This module declared 24 rules between the three of them that set
   `outline:none` on `:focus-visible` and put a background change in its
   place -- measured, #FFFFFF to #F5F6F9, which is 1.08:1. So every button
   and every link here had an invisible keyboard focus, and because each of
   those rules named `:hover` in the same breath, a keyboard position and a
   mouse position looked identical. WCAG 2.2 AA, 2.4.7.
   The rules are gone and this is what the frozen shell has declared since
   v3.11 (_shared.css :252) -- the same indicator, so there is nothing new
   to invent and nothing to keep in step. The hover backgrounds are
   UNTOUCHED, which is what finally makes the two states look different.
   ON THE BAR THE RING TAKES THE BAR'S OWN INK. The bar is the tenant's
   colour (barFor), so a gold ring on it is a guess; #EAF0FA is what the
   bar already draws its text and its borders in, so the ring inherits
   whatever guarantee that ink already has rather than making a new one. */
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.bar :focus-visible{outline-color:#EAF0FA}
body{margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
[hidden]{display:none!important}
.bar{background:var(--bar);color:#EAF0FA;display:flex;align-items:center;gap:10px;padding:11px 16px;flex-wrap:wrap}
.bar h1{margin:0;font-size:14.5px;font-weight:600}
.bar .org{color:#A9BBD8;font-size:13px}.bar .org b{color:#EAF0FA;font-weight:600}
.msw{position:relative;flex:none}
.msw>summary{list-style:none;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;border:1px solid rgba(234,240,250,.28);cursor:pointer;color:#EAF0FA}
.msw>summary::-webkit-details-marker{display:none}
.msw>summary:hover,.msw>summary:focus-visible{background:rgba(234,240,250,.14)}
.msw svg{width:17px;height:17px;display:block}
.mmenu{position:absolute;top:34px;left:0;z-index:9;min-width:290px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:11px;box-shadow:0 8px 26px rgba(20,28,43,.16);overflow:hidden}
.mi{display:block;padding:10px 15px;text-decoration:none;color:inherit;font-size:14px;font-weight:600;border-bottom:1px solid var(--line)}
.mi:last-child{border-bottom:0}.mi:hover,.mi:focus-visible{background:var(--ground)}
.mi.on{background:var(--ground);cursor:default}
.mi i{display:block;font-style:normal;font-weight:400;font-size:12px;color:var(--ink-3);margin-top:2px}
.pg{max-width:1000px;margin:0 auto;padding:20px 20px 40px}
h2.pt{margin:0 0 14px;font-size:21px;font-weight:600;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
h2.pt small{font-weight:400;color:var(--ink-3);font-size:14px}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.tools form{display:flex;gap:8px;flex:1 1 260px;min-width:0}
.srch{flex:1 1 260px;min-width:0;border:1px solid var(--line-ctl);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 inherit}
.go{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:8px 13px;font:600 13px/1.5 inherit;cursor:pointer;flex:none}
.cnt{font:600 10.5px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-left:auto;flex:none}
.btn{font:600 13px/1 inherit;padding:9px 13px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;white-space:nowrap}
.btn:hover,.btn:focus-visible{background:var(--ground)}
.btn.gold{background:var(--gold);border-color:var(--gold);color:#FFF}
.btn.gold:hover{filter:brightness(1.06);background:var(--gold)}
.btn[disabled],.btn[aria-disabled="true"]{opacity:.55;cursor:default}
.btn.quiet{color:var(--ink-3)}
.lab{font:600 10.5px/1.7 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin:12px 0 4px}
.none{padding:40px 4px 10px;color:var(--ink-3);font-size:14px;max-width:60ch}
.none b{color:var(--ink);font-weight:600;display:block;font-size:15.5px;margin-bottom:6px}
.said{margin:0 0 12px;padding:9px 13px;border:1px solid var(--bad);border-radius:8px;background:var(--bad-bg);color:var(--bad);font-size:13.5px}
.said:empty{display:none}
.said.good{border-color:var(--good);background:var(--good-bg);color:var(--good)}
.unread{margin:0 0 12px;padding:9px 13px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink-2);font-size:13.5px}
/* ── the list ── */
.list{display:flex;flex-direction:column;border-top:1px solid var(--line);margin-top:12px}
.mrow{display:grid;grid-template-columns:104px 1fr auto auto;gap:14px;align-items:center;padding:12px 2px;border-bottom:1px solid var(--line);text-decoration:none;color:inherit}
.mrow:hover,.mrow:focus-visible{background:var(--surface)}
.mrow .d{font:400 12.5px/1.4 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);white-space:nowrap}
.mrow .t{min-width:0;font-size:15px}
.mrow .t small{display:block;font-size:12.5px;color:var(--ink-3);margin-top:1px}
.mrow .n{font:600 12.5px/1.4 inherit;color:var(--ink-2);white-space:nowrap}
.sent{font:600 11px/1 inherit;letter-spacing:.02em;padding:6px 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink-2);background:var(--surface);white-space:nowrap;min-width:96px;text-align:center}
.sent.ok{border-color:var(--good);background:var(--good-bg);color:var(--good)}
.sent.upd{border-color:var(--gold);color:var(--gold)}
.grp{display:flex;align-items:center;gap:9px;padding:14px 2px 6px;font-size:13px;font-weight:600;color:var(--ink-2)}
.grp .cnt{margin-left:0}
/* ── one note ── */
.back{display:inline-block;font:600 12.5px/1 inherit;color:var(--ink-3);text-decoration:none;margin-bottom:10px}
.back:hover,.back:focus-visible{color:var(--ink)}
.head{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:start;margin-bottom:8px}
.ttl{width:100%;border:1px solid var(--line-ctl);border-radius:8px;background:var(--surface);color:var(--ink);font:600 21px/1.3 inherit;padding:9px 11px;outline:none}
.ttl:focus{border-color:var(--gold)}
/* THE KEY ABOVE IT IS WHY THE NUDGE GOES: the date carried margin-top:4px to
   sit level with a title that had no key over it. Both have one now.
   NO BACKTICK IN HERE, as the script's own header says one file along: this
   stylesheet is a template literal, so a name quoted in a comment ends it
   and every rule after it is read as JavaScript. */
.head .date{margin-top:0}
.ttl::placeholder{color:var(--ink-3);font-weight:400}
.date{font:400 13px/1.4 ui-monospace,SFMono-Regular,monospace;color:var(--ink-2);border:1px solid var(--line-ctl);border-radius:7px;background:var(--surface);padding:6px 9px;white-space:nowrap;margin-top:4px;cursor:pointer}
button.date{display:inline-flex;align-items:center;gap:8px}
.date svg{width:14px;height:14px;flex:none;color:var(--gold)}
.date:hover,.date:focus-visible{border-color:var(--gold);color:var(--ink)}
input.date{cursor:auto}
/* THE NATIVE BOX IS HIDDEN IN PLACE AND DRIVEN, never swapped in for the word
   (the searchable select's own idiom): clipped rather than display:none,
   because a box that is not rendered cannot be asked to open its calendar.
   It is shown only where the calendar cannot be opened for them, and there it
   wears .date like every other field on this page. */
.datenative{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0;padding:0;margin:0;clip-path:inset(50%)}
.att{display:flex;flex-wrap:wrap;gap:6px;align-items:center;position:relative}
.chip{display:inline-flex;align-items:center;gap:6px;font:600 12.5px/1 inherit;color:var(--ink-2);background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 8px 6px 10px}
.chip i{font-style:normal;font-weight:400;color:var(--ink-3)}
.chip b{font-weight:400;color:var(--ink-3);cursor:pointer;background:none;border:0;padding:0 2px;font-size:13px}
.chip b:hover,.chip b:focus-visible{color:var(--bad)}
.chip.warn{border-color:var(--warn);color:var(--warn)}
.chip.once{border-style:dashed}
.addatt{font:600 12.5px/1 inherit;color:var(--gold);background:none;border:1px dashed var(--line);border-radius:999px;padding:6px 10px;cursor:pointer}
.addatt:hover,.addatt:focus-visible{border-color:var(--gold)}
.pick{position:absolute;top:34px;left:0;z-index:5;width:300px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:8px}
.pick input{width:100%;border:1px solid var(--line-ctl);border-radius:7px;background:var(--surface);color:var(--ink);padding:6px 9px;font:400 13px/1.5 inherit;margin-bottom:6px}
.pick .pl{max-height:190px;overflow-y:auto;scrollbar-width:thin;scrollbar-gutter:stable}
.pick .prow{display:flex;width:100%;align-items:center;gap:9px;padding:6px 7px;border:0;background:none;border-radius:7px;font:400 13.5px/1.4 inherit;color:var(--ink);cursor:pointer;text-align:left}
.pick .prow:hover,.pick .prow:focus-visible{background:var(--ground)}
.pick .prow small{margin-left:auto;color:var(--ink-3);font-size:11.5px;white-space:nowrap}
.pick .sq{width:15px;height:15px;border:1.5px solid var(--line);border-radius:4px;display:grid;place-items:center;background:var(--surface);color:var(--surface);flex:none}
.pick .sq.on{background:var(--gold);border-color:var(--gold)}
.pick .sq svg{width:9px;height:9px}
.pick .else{border-top:1px solid var(--line);margin-top:6px;padding-top:8px;display:grid;grid-template-columns:1fr 1fr auto;gap:6px}
.pick .else input{margin:0;font-size:12.5px;padding:5px 7px}
.pick .else .btn{padding:6px 9px;font-size:12px}
.pick .done{border-top:1px solid var(--line);margin-top:8px;padding-top:8px;display:flex;align-items:center;gap:8px}
.pick .done .btn{flex:none;padding:6px 9px;font-size:12px}
.pick .done span{font-size:12px;color:var(--ink-3)}
.pick .nobody{padding:8px 7px;color:var(--ink-3);font-size:13px}
.raw{width:100%;min-height:300px;border:1px solid var(--line-ctl);border-radius:10px;background:var(--surface);color:var(--ink);padding:14px 16px;font:400 15px/1.6 inherit;resize:vertical;outline:none}
.raw:focus{border-color:var(--gold)}
.raw::placeholder{color:var(--ink-3)}
.foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px}
.foot .hint{font-size:13px;color:var(--ink-3)}
.foot .spacer{flex:1}
.saved{font:400 12px/1.4 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3)}
/* ── the minutes beside the raw notes ── */
.two{display:grid;grid-template-columns:1.25fr 1fr;gap:20px;align-items:start}
.mins{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px 16px}
.mins .lab:first-child{margin-top:0}
.mins [contenteditable]{outline:none;border-radius:6px;padding:2px 4px;margin:0 -4px}
.mins [contenteditable]:hover{background:var(--ground)}
.mins [contenteditable]:focus{background:var(--ground);box-shadow:0 0 0 1px var(--gold)}
.mins p{margin:0;font-size:14.5px}
.mins ul{margin:0;padding-left:20px;font-size:14.5px}
.mins li{margin:0 0 3px}
.mins .empty{color:var(--ink-3);font-style:italic;font-size:14px}
.acts{width:100%;border-collapse:collapse;font-size:14px}
.acts th{text-align:left;font:600 10.5px/1.6 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);padding:0 6px 4px 0;border-bottom:1px solid var(--line)}
.acts td{padding:6px 6px 6px 0;border-bottom:1px solid var(--line);vertical-align:top}
.acts td.blank{color:var(--ink-3);font-style:italic}
.side .raw{min-height:340px;font-size:14px}
.side .lab{display:flex;align-items:center;gap:8px}
.side .lab .btn{margin-left:auto;padding:5px 9px;font:600 11.5px/1 inherit;letter-spacing:0;text-transform:none}
.hist{list-style:none;margin:0;padding:0 8px 0 0;font-size:11.5px;line-height:1.45;max-height:118px;overflow-y:auto;scrollbar-width:thin;scrollbar-gutter:stable;color:var(--ink-2)}
.hist li{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)}
.hist li:last-child{border-bottom:0}
.hist time{font:400 10.5px/1.6 ui-monospace,SFMono-Regular,monospace;color:var(--ink-3);white-space:nowrap}
.hist b{font-weight:600;color:var(--ink)}
.sure{display:inline-flex;gap:10px;align-items:center;color:var(--ink-2);font-size:13px}
.sure .go.danger{color:var(--bad);border-color:var(--bad)}
.rm{background:none;border:0;padding:0;font:inherit;font-size:13px;color:var(--bad);cursor:pointer;text-decoration:underline}
@media (max-width:760px){.two{grid-template-columns:1fr}
  .mrow{grid-template-columns:1fr auto;grid-template-areas:"t s" "d n"}.mrow .t{grid-area:t}.mrow .sent{grid-area:s}.mrow .d{grid-area:d}.mrow .n{grid-area:n;text-align:right}
  .head{grid-template-columns:1fr}.pick{width:min(300px,calc(100vw - 60px))}}
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

type BodyAttrs = { api: string; here: string; note: string };
function skeleton(slug: string, tenantName: string, have: ModuleKey[], bar: string, attrs: BodyAttrs | null, body: string): string {
  const a = attrs ? ' data-api="' + esc(attrs.api) + '" data-here="' + esc(attrs.here) + '" data-note="' + esc(attrs.note) + '"' : "";
  return "<!doctype html>\n<html lang='en' data-module='notes'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " &mdash; " + esc(MODULE_DEF.notes.label) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    /* `title-as-heading` puts the reported look back — borderless, transparent,
       no key — which must turn checks/notes.mjs red (§94.5). Never set on a
       deployment (constitution XVI). */
    "<style>" + CSS.replace("%BAR%", bar) +
      (BRK() === "title-as-heading" ? ".ttl{border:0!important;border-radius:0!important;background:transparent!important}.head .lab{display:none}" : "") +
      "</style>\n</head>\n" +
    "<body" + a + ">\n" +
    '<header class="bar">' + switcher(slug, have, "notes") +
    "<h1>" + esc(MODULE_DEF.notes.label) + "</h1>" +
    '<span class="org">&middot; <b>' + esc(tenantName) + "</b></span></header>\n" +
    body +
    (attrs ? '<script src="' + esc(clientHref(slug, "notes", "app.js")) + '"></script>\n' : "") +
    "</body>\n</html>\n";
}

/* Not the office: said in words, with the way back (§61). */
export async function refusedDocument(slug: string, tenantId: string, tenantName: string, have: ModuleKey[]): Promise<string> {
  const bar = await barFor(tenantId);
  return skeleton(slug, tenantName, have, bar, null,
    '<main class="pg"><div class="none"><b>Meeting Notes is the office\'s.</b>' +
    "It is where Forefront keeps its notes of meetings with " + esc(tenantName) + ", and sends the minutes. " +
    '<a href="' + esc(clientHref(slug, null, "")) + '">Back to ' + esc(tenantName) + "</a></div></main>\n");
}

export type Ask = { q: string; note: string | null };
export type PageArgs = { slug: string; tenantId: string; tenantName: string; have: ModuleKey[]; ask: Ask; who: Who; today?: string };

type Q = Parameters<typeof listNotes>[0];
export type Loaded = { notes: Note[]; reg: Register; office: Person[]; short: Map<string, string>; note: Note | null; sends: SendRow[] };

/* ONE READ, whether the list or a note is being drawn. A note id that is not
   on this client's list reads as no note at all — a pasted link from another
   client, or one somebody deleted — never as an empty page. */
export async function load(c: Q, noteId: string | null): Promise<Loaded> {
  const notes = await listNotes(c), reg = await registerOf(c), office = await officeRows(c);
  const short = shortNames(Array.from(reg, ([key, p]) => ({ key, name: p.name })));
  const note = noteId ? notes.find((n) => n.id === noteId) || null : null;
  return { notes, reg, office, short, note, sends: note ? await sendsOf(c, note.id) : [] };
}

const TICK = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 5.2l2.4 2.3 4.6-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const BRK = () => process.env.SMP_BREAK || "";
const monthLabel = (day: string) => MONTH[Number(day.slice(5, 7)) - 1] + " " + day.slice(0, 4);

/* WHAT WENT OUT, as a word: never sent, sent on a day, or updated on one.
   IT TAKES `today` FOR THE REASON THE MEETING'S OWN DATE DOES, one cell along:
   readableDay() carries the year only when it is not the current one, so
   without it a row would print "Updated 16 Sep 2026" beside "Wed 16 Sep" and
   read as two different days. */
export function sentWord(n: Note, today?: string): { word: string; cls: string } {
  if (!n.sends) return { word: "Not sent", cls: "" };
  const day = (n.lastSentAt || "").slice(0, 10);
  return { word: (n.lastSentUpdate ? "Updated " : "Sent ") + readableDay(day, today).replace(/^\w+ /, ""), cls: n.lastSentUpdate ? "upd" : "ok" };
}

export function listBody(L: Loaded, p: PageArgs, today: string): string {
  const here = clientHref(p.slug, "notes", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const shown = L.notes.filter((n) => !q || (n.title + " " + n.raw).toLowerCase().includes(q.toLowerCase()));
  const nameOf = (n: Note) => {
    const named = namedOf(n.attendees, L.reg, new Set(L.office.map((o) => o.key)));
    return named.map((a) => (a.key ? L.short.get(a.key) || a.name : a.name)).join(", ");
  };
  let month = "";
  const rows = shown.map((n) => {
    const m = monthLabel(n.metOn);
    const head = m === month ? "" : ((month = m), '<div class="grp">' + esc(m) + ' <span class="cnt">' +
      shown.filter((x) => monthLabel(x.metOn) === m).length + "</span></div>");
    const s = sentWord(n, today);
    return head + '<a class="mrow" href="' + esc(here + "?note=" + encodeURIComponent(n.id)) + '" data-id="' + esc(n.id) + '">' +
      '<span class="d">' + esc(readableDay(n.metOn, today)) + "</span>" +
      '<span class="t">' + esc(n.title || "Untitled meeting") +
      (nameOf(n) ? "<small>" + esc(nameOf(n)) + "</small>" : "") + "</span>" +
      '<span class="n">' + n.attendees.length + "</span>" +
      '<span class="sent ' + s.cls + '">' + esc(s.word) + "</span></a>";
  }).join("");
  const tools = '<div class="tools"><form method="get" action="' + esc(here) + '" role="search">' +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search meetings" aria-label="Search meetings">' +
    '<button class="go" type="submit">Search</button></form>' +
    '<button class="btn gold" type="button" data-act="new">+ New meeting</button>' +
    '<span class="cnt">' + esc(plural(shown.length, "meeting", "meetings")) + "</span></div>";
  const none = !L.notes.length
    ? '<div class="none"><b>No meetings noted for ' + esc(p.tenantName) + " yet.</b>Start one and type as it runs; the assistant turns the notes into minutes, and the minutes go to the attendees.</div>"
    : !shown.length
      ? '<div class="none"><b>Nothing matches.</b>Try another word, or <a href="' + esc(here) + '">see them all</a>.</div>'
      : "";
  return tools + (rows ? '<div class="list">' + rows + "</div>" : "") + none;
}

/* THE ATTENDEES: a chip each, the register behind + Add attendee. A keyed
   person with no address is MARKED rather than dropped — they were at the
   meeting; what they do not get is the email (decision 5). */
function attendeeBlock(n: Note, L: Loaded): string {
  const office = new Set(L.office.map((o) => o.key));
  const named: Named[] = namedOf(n.attendees, L.reg, office);
  const chips = named.map((a, i) =>
    '<span class="chip' + (a.casual ? " once" : !a.email ? " warn" : "") + '"' +
    (a.casual ? ' title="At this meeting only — not on the register"' : !a.email ? ' title="No email on the register — will not receive the minutes"' : "") +
    ' data-at="' + i + '">' + esc(a.name) +
    /* EACH PART IS ESCAPED AND THE SEPARATOR IS NOT (§235): joining with the
       entity INSIDE esc() and unescaping afterwards printed `&middot;` as
       four characters on every chip that had two parts to say. */
    (a.place || !a.email ? " <i>&middot; " + [a.place, a.email ? "" : "no email"].filter(Boolean).map(esc).join(" &middot; ") + "</i>" : "") +
    ' <button type="button" data-act="drop-att" data-i="' + i + '" aria-label="Remove ' + esc(a.name) + '">&times;</button></span>').join("");
  const have = new Set(n.attendees.filter((a) => "key" in a).map((a: any) => a.key));
  const rows = Array.from(L.reg, ([key, p]) => ({ key, ...p })).filter((p) => p.active);
  const list = rows.length
    ? rows.map((p) =>
      '<button class="prow" type="button" data-act="pick-att" data-key="' + esc(p.key) + '" data-on="' + have.has(p.key) + '">' +
      '<span class="sq' + (have.has(p.key) ? " on" : "") + '">' + (have.has(p.key) ? TICK : "") + "</span>" + esc(p.name) +
      "<small>" + esc(office.has(p.key) ? "office" : p.place || (p.email ? "" : "no email")) + "</small></button>").join("")
    : '<div class="nobody">Nobody is on this client\'s register yet.</div>';
  return '<p class="lab">Attendees</p><div class="att">' + chips +
    '<button class="addatt" type="button" data-act="open-att" aria-expanded="false">+ Add attendee</button>' +
    '<div class="pick" hidden>' +
    '<input type="search" data-act="find-att" placeholder="Search the register" aria-label="Search the register">' +
    '<div class="pl">' + list + "</div>" +
    '<div class="else"><input data-att-name placeholder="Somebody else — name" aria-label="Name" maxlength="120">' +
    '<input data-att-mail type="email" placeholder="their email" aria-label="Email" maxlength="160">' +
    '<button class="btn" type="button" data-act="add-casual">Add</button></div>' +
    /* A WAY TO SAY YOU ARE FINISHED, never a way to confirm: a tick is already
       saved when it is made, and the chip appears above as you go — nothing in
       this product has a Save button and this is not the first. What was
       missing is the OTHER half, because the list now stays open while you
       tick (Islam: "let me make the checks for all the attendees"), and a
       tablet has no Escape key, which was the only deliberate way out. */
    '<div class="done"><button class="btn" type="button" data-act="done-att">Done</button>' +
    "<span>Each tick is already saved.</span></div></div></div>";
}

const EDITABLE = ' contenteditable="true" spellcheck="false"';
/* THE MINUTES, every part a box the writer edits (decision 3). A part with
   nothing in it still draws its heading and an empty line, because this is
   the surface where the minutes are WRITTEN — a heading that vanished would
   leave nowhere to write that part by hand (§61, and the reverse of the
   email's rule, where an empty part is simply not printed). */
function minutesBlock(m: Minutes): string {
  const line = (t: string) => '<p class="lab">' + t + "</p>";
  const ul = (key: string, xs: string[]) => '<ul data-part="' + key + '">' +
    (xs.length ? xs : [""]).map((x) => "<li" + EDITABLE + ">" + esc(x) + "</li>").join("") + "</ul>";
  const acts = '<table class="acts"><thead><tr><th>What</th><th>Who</th><th>By when</th></tr></thead><tbody data-part="actions">' +
    (m.actions.length ? m.actions : [{ what: "", who: "", when: "" }]).map((a) =>
      "<tr><td" + EDITABLE + ">" + esc(a.what) + "</td>" +
      "<td" + (a.who ? "" : ' class="blank"') + EDITABLE + ">" + esc(a.who) + "</td>" +
      "<td" + (a.when ? "" : ' class="blank"') + EDITABLE + ">" + esc(a.when) + "</td></tr>").join("") + "</tbody></table>";
  return '<div class="mins" data-minutes>' +
    line("Summary") + '<p data-part="summary"' + EDITABLE + ">" + esc(m.summary) + "</p>" +
    line("Discussed") + ul("discussed", m.discussed) +
    line("Agreed") + ul("agreed", m.agreed) +
    line("Actions") + acts +
    line("Open") + ul("open", m.open) +
    line("Next meeting") + '<p data-part="next"' + EDITABLE + ">" + esc(m.next) + "</p>" +
    "</div>";
}

function historyBlock(L: Loaded, n: Note, today: string): string {
  const name = (k: string) => (L.reg.get(k) ? L.reg.get(k)!.name : k || "Somebody");
  const when = (at: string) => {
    const d = at ? new Date(at) : null;
    if (!d) return "";
    const day = todayIn(d);
    const hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
    return readableDay(day, today) + " " + hm;
  };
  const items = L.sends.map((s) => {
    const okN = s.to.filter((x) => x.ok).length, badN = s.to.length - okN;
    return "<li><time>" + esc(when(s.sentAt)) + "</time><span><b>" + esc(name(s.sentBy)) + "</b> &middot; " +
      (s.isUpdate ? "sent updated minutes to " : "sent the minutes to ") + plural(okN, "person", "people") +
      (badN ? " &middot; " + plural(badN, "did not arrive", "did not arrive") : "") + "</span></li>";
  });
  if (n.refinedAt) items.push("<li><time>" + esc(when(n.refinedAt)) + "</time><span><b>" + esc(name(n.refinedBy)) + "</b> &middot; refined the notes into minutes</span></li>");
  items.push("<li><time>" + esc(when(n.createdAt)) + "</time><span><b>" + esc(name(n.createdBy)) + "</b> &middot; started the note</span></li>");
  return '<p class="lab">History</p><ul class="hist">' + items.join("") + "</ul>";
}

/* THE NOTE'S OWN BODY — everything a press redraws. Drawn once by
   noteDocument() and again by the api after every change (§356.12's shape,
   one module over), so the browser never renders a part of its own. */
export function noteBody(L: Loaded, p: PageArgs, today: string): string {
  const n = L.note!;
  const office = new Set(L.office.map((o) => o.key));
  const named = namedOf(n.attendees, L.reg, office);
  const withMail = named.filter((a) => a.email).length;
  const noMail = named.filter((a) => !a.email).map((a) => a.name);
  const empty = minutesEmpty(n.minutes);
  const sendable = !empty && withMail > 0;
  /* A KEY OVER EACH, BECAUSE THE TITLE DID NOT READ AS TYPED (Islam, of the
     built page: "I need to set the title manually"). It always was a box —
     borderless, transparent and 21px bold, so it drew as a heading the
     platform had written. Every other thing on this page carries an
     uppercase key and these two were the only ones without, so they take
     the page's own `.lab` rather than a new device (§53.5), and the box
     takes the border every other field here already has. */
  const head = '<div class="head">' +
    '<div><p class="lab">Title</p>' +
    '<input class="ttl" data-act="title" value="' + esc(n.title) + '" placeholder="What was the meeting about?" aria-label="Meeting title" maxlength="200"></div>' +
    '<div><p class="lab">Date</p>' +
    /* THE DATE IS THE TRACKER'S OWN CONTROL, never a second answer to how a
       date is set (§53.5): a button reading the day in the platform's own
       words. A raw date input prints whatever format the browser's locale
       chooses — `09/16/2026` on this machine — which is a spelling the
       platform uses nowhere, and the signed-off drawing reads "Wed 16 Sep
       2026". §357.4: THE WORD IS THE CONTROL AND IT STAYS THE WORD — the
       press opens the calendar rather than swapping the word for a box, so
       the day never reformats under the hand that pressed it. The native box
       sits beside it, hidden in place and driven (see the script). The mark
       is DRAWN and never a font character, which a font may map and fail to
       draw (§52, §120.2). */
    '<button class="date" type="button" data-act="date" data-day="' + esc(n.metOn) + '" title="Change the date" aria-label="Date of the meeting">' +
    esc(readableDay(n.metOn) || "No date") +
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<rect x="1.8" y="3" width="12.4" height="11.2" rx="2"/><path d="M1.8 6.4h12.4M5 1.6v2.6M11 1.6v2.6"/></svg>' +
    "</button>" +
    '<input class="datenative" type="date" data-native-date value="' + esc(n.metOn) + '" tabindex="-1" aria-hidden="true">' +
    "</div></div>";
  const notes = '<p class="lab">Notes</p><textarea class="raw" data-act="raw" aria-label="Notes" maxlength="60000" placeholder="Type as the meeting runs. Saved when you leave the box.">' + esc(n.raw) + "</textarea>";
  const refine = '<button class="btn gold" type="button" data-act="refine">' + (empty ? "Refine into minutes" : "Refine again") + "</button>";
  const sendWord = "Send to " + plural(withMail, "attendee", "attendees") + (n.sends ? " again" : "");
  const send = '<button class="btn' + (sendable ? " gold" : "") + '" type="button" data-act="send"' +
    (sendable ? "" : ' aria-disabled="true" data-why="' + esc(empty ? "The minutes are empty — refine the notes, or write them, before sending." : "Nobody on this meeting has an email address.") + '"') +
    ">" + esc(sendWord) + "</button>";
  const hint = noMail.length ? '<span class="hint">' + esc(noMail.join(", ")) + (noMail.length === 1 ? " has" : " have") + " no email and will not receive them.</span>" : "";
  const del = '<span class="sure" hidden>Delete this note and everything about it? ' +
    '<button type="button" class="go btn danger" data-act="delete">Yes, delete it</button>' +
    '<button type="button" class="btn" data-act="delete-no">Keep it</button></span>' +
    '<button type="button" class="rm" data-act="delete-ask">Delete this note</button>';
  const foot = '<div class="foot"><span class="saved" data-saved></span><span class="spacer"></span>' + hint + refine + send + "</div>";
  const body = empty
    ? notes + foot
    : '<div class="two"><div>' + minutesBlock(n.minutes!) + "</div>" +
      '<div class="side"><p class="lab">Notes ' + refine + "</p>" +
      '<textarea class="raw" data-act="raw" aria-label="Notes" maxlength="60000">' + esc(n.raw) + "</textarea>" +
      historyBlock(L, n, today) + "</div></div>" +
      '<div class="foot"><span class="saved" data-saved></span><span class="spacer"></span>' + hint + send + "</div>";
  const sentLine = n.sends
    ? '<p class="unread">' + esc(subjectFor({ title: n.title, metOn: n.metOn, sends: 0 })) + " last went out " +
      esc(readableDay((n.lastSentAt || "").slice(0, 10), today)) + " to " + plural(L.sends[0] ? L.sends[0].to.filter((x) => x.ok).length : 0, "person", "people") +
      ". Editing these minutes and sending again marks them as updated.</p>"
    : "";
  return head + attendeeBlock(n, L) + sentLine + body + '<div class="foot" style="margin-top:18px">' + del + "</div>";
}

export async function notesDocument(p: PageArgs): Promise<string> {
  const today = p.today || todayIn();
  const bar = await barFor(p.tenantId);
  const here = clientHref(p.slug, "notes", "");
  const attrs: BodyAttrs = { api: clientHref(p.slug, "notes", "api"), here, note: p.ask.note || "" };

  /* A LIST THAT COULD NOT BE READ IS NOT AN EMPTY ONE (§35, §93). */
  let L: Loaded | null = null;
  try { L = await withTenant(p.tenantId, (c) => load(c, p.ask.note)); }
  catch (e) { console.error("notes: reading " + p.slug + ":", (e as Error).message); }
  if (!L) {
    return skeleton(p.slug, p.tenantName, p.have, bar, null,
      '<main class="pg"><h2 class="pt">Meetings</h2>' +
      '<p class="unread">The meetings could not be read just now. Nothing has been lost &mdash; try again in a moment.</p></main>\n');
  }
  /* A note asked for and not found: said, with the way back (§35, §61). */
  if (p.ask.note && !L.note) {
    return skeleton(p.slug, p.tenantName, p.have, bar, null,
      '<main class="pg"><div class="none"><b>That meeting is not on this client\'s list any more.</b>' +
      'It may have been deleted, or the link may be another client\'s. <a href="' + esc(here) + '">Back to the meetings</a></div></main>\n');
  }
  const body = L.note
    ? '<main class="pg"><a class="back" href="' + esc(here) + '">&larr; All meetings</a>' +
      '<p class="said" id="said" role="alert" aria-live="polite"></p>' +
      '<div id="body">' + noteBody(L, p, today) + "</div></main>\n"
    : '<main class="pg"><h2 class="pt">Meetings <small>' + esc(p.tenantName) + "</small></h2>" +
      '<p class="said" id="said" role="alert" aria-live="polite"></p>' +
      '<div id="body">' + listBody(L, p, today) + "</div></main>\n";
  return skeleton(p.slug, p.tenantName, p.have, bar, attrs, body);
}

/* A press's answer: the note read again under the tenant and drawn by the
   same function — never a second renderer (§53.5). */
export async function noteFragment(p: PageArgs): Promise<{ body: string; note: string | null }> {
  const today = p.today || todayIn();
  const L = await withTenant(p.tenantId, (c) => load(c, p.ask.note));
  if (!L.note) return { body: listBody(L, p, today), note: null };
  return { body: noteBody(L, p, today), note: L.note.id };
}
