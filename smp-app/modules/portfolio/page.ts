/* ── PORTFOLIO: THE PAGES (spec 060, built 2026-09-30) ────────────────────
   The first slice: the LANDING — this client's projects, one row each —
   and a project's CHARTER. Both drawn and signed off before a line of this
   existed (§9.13 and §5.1, rule 1c), and the stylesheet below is the
   landing's own, verbatim from
   design-mockups/portfolio/2026-09-20_portfolio-landing.html, less the three
   blocks that belong to a drawing rather than to a product: the *Looking as*
   switch (which says in its own words it is not a control of the product),
   the dashed empty-state specimen, and the explanatory note.

   THE CHROME IS THE TRACKER'S AND INSIGHTS', class for class — a module that
   drew its own bar would be the second place a module's name is spelt
   (§53.5) — with the client's own colour through `barFor` (§354.3).

   NOTHING ON THE LANDING IS STORED (§9.13): a project has no status field.
   How far along it is, whether it is behind, what is waiting on somebody and
   when anybody next looks at it are all worked out from the plan underneath
   and the checkpoint cadence, by `lib/portfolio.ts` — the same functions
   `checks/portfolio.mjs` proves and the same ones the drawings read, so this
   list cannot disagree with the pages behind it (§5.2). */
import { barFor } from "../../lib/branding.ts";
import { clientHref, moduleMenu, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import {
  type Row, type Cadence, ROLE_WORD, type Role,
  rollUp, overall, owed, waitingSignOff, overdue, nobodyOn, behind, nextCheckpoint,
} from "../../lib/portfolio.ts";
import type { Charter, Project } from "../../lib/portfolio-io.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plural = (n: number, one: string, many?: string) => n + " " + (n === 1 ? one : (many || one + "s"));
const brk = () => process.env.SMP_BREAK || "";

/* No look-only break is declared here yet. The first one written was CSS —
   `.noplan{visibility:hidden}` — and it went GREEN, because every assertion
   this module has is about the document's own WORDS and no stylesheet can
   take a word out of them (§54.5: a falsification that does not falsify is
   indistinguishable from a working guard). The break that earns its place is
   `no-plan-yet` below, which makes the page print what the decision forbids
   rather than hiding what it prints. */
function brkCss(): string { return ""; }

/* ══ the stylesheet, as signed off ═════════════════════════════════════ */
const CSS = `
*{box-sizing:border-box}
:root{
  --bar:%BAR%;
  --panel:#16325C; --panel-ink:#FFFFFF; --panel-quiet:#B7C4D8; --panel-accent:#E6C65C;
  --gold:#C9A24D; --gold-deep:#8A6B22; --focus:#8A6B22; --stone:#16325C;
  --ground:#F7F8FA; --surface:#FFFFFF; --surface-2:#EFF2F6;
  --line:#D6DCE5; --line-soft:#E6EAF0; --zebra:#F5F7FA;
  --ink:#171B22; --ink-2:#414A58; --ink-3:#636C79;
  --good:#2E7D5B; --good-tx:#1F6248; --good-bg:#E4F0EA;
  --attn:#B8860B; --attn-tx:#7A5D1C; --attn-bg:#F7EFD6;
  --bad:#B04434; --bad-tx:#8C3327; --bad-bg:#F7E3E0;
  --none:#8E97A3; --on-fill:#FFFFFF; --on-accent:#16325C;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --panel:#0E1014; --panel-ink:#EAF0FA; --panel-quiet:#9AA6B8; --panel-accent:#E6C65C;
    --gold:#D9B665; --gold-deep:#C9A24D; --focus:#E6C65C; --stone:#7FA3D8;
    --ground:#14161A; --surface:#1C2027; --surface-2:#242932;
    --line:#333A45; --line-soft:#2A303A; --zebra:#212630;
    --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA;
    --good:#5FB68C; --good-tx:#8FD3B0; --good-bg:#1B3129;
    --attn:#D9B23C; --attn-tx:#E8CA6A; --attn-bg:#332C16;
    --bad:#D97066; --bad-tx:#E79A93; --bad-bg:#33201E;
    --none:#8E97A3; --on-fill:#14161A; --on-accent:#14161A;
  }
}
:root[data-theme="dark"]{
  --panel:#0E1014; --panel-ink:#EAF0FA; --panel-quiet:#9AA6B8; --panel-accent:#E6C65C;
  --gold:#D9B665; --gold-deep:#C9A24D; --focus:#E6C65C; --stone:#7FA3D8;
  --ground:#14161A; --surface:#1C2027; --surface-2:#242932;
  --line:#333A45; --line-soft:#2A303A; --zebra:#212630;
  --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA;
  --good:#5FB68C; --good-tx:#8FD3B0; --good-bg:#1B3129;
  --attn:#D9B23C; --attn-tx:#E8CA6A; --attn-bg:#332C16;
  --bad:#D97066; --bad-tx:#E79A93; --bad-bg:#33201E;
  --none:#8E97A3; --on-fill:#14161A; --on-accent:#14161A;
}

body{margin:0;background:var(--ground);color:var(--ink);
  font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
button{font:inherit;cursor:pointer}
button:focus-visible,a:focus-visible{outline:2px solid var(--focus);outline-offset:1px}

/* the module chrome — the tracker's and Insights', class for class */
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

.wrap{max-width:1180px;margin:0 auto;padding:28px 16px 56px}
.phead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.phead h1{font-size:21px;font-weight:700;margin:0;letter-spacing:-.01em}
.crumb{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);font-weight:700;margin:0 0 4px}
.crumb a{color:inherit;text-decoration:none}
.crumb a:hover{text-decoration:underline}
.start{background:var(--gold);color:var(--on-accent);border:0;border-radius:6px;padding:8px 15px;font-size:13px;font-weight:700}
.start:hover{background:var(--gold-deep);color:var(--on-fill)}

.strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0}
@media (max-width:820px){.strip{grid-template-columns:1fr}}
.cell{background:var(--surface);border:1px solid var(--line);border-radius:7px;padding:12px 15px}
.cell .k{margin:0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:700}
.cell .v{font-size:25px;font-weight:700;line-height:1.15;margin-top:3px;letter-spacing:-.02em}
.cell .w{font-size:11.5px;color:var(--ink-3);margin-top:1px}
.cell.late .v{color:var(--bad-tx)}
.cell.owed .v{color:var(--attn-tx)}

.sect{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);font-weight:700;margin:0 0 7px}
.sect span{color:var(--ink-3);font-weight:600;letter-spacing:0;text-transform:none;font-size:11.5px}
.box{background:var(--surface);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:22px}
table{width:100%;border-collapse:collapse}
thead th{background:var(--panel);color:var(--panel-ink);text-align:left;font-size:10px;letter-spacing:.07em;text-transform:uppercase;font-weight:700;padding:8px 14px;white-space:nowrap}
tbody td{border-top:1px solid var(--line-soft);padding:11px 14px;vertical-align:top;font-size:13.5px}
tbody tr:nth-child(even) td{background:var(--zebra)}

.pname{font-weight:700;font-size:14.5px}
.pname a{color:inherit;text-decoration:none;border-bottom:1px solid transparent}
.pname a:hover{border-bottom-color:var(--gold)}
.pbrief{font-size:11.5px;color:var(--ink-3);margin-top:2px;max-width:42ch}
.far{width:210px}
.bar2{height:7px;background:var(--surface-2);border:1px solid var(--line);border-radius:4px;overflow:hidden;margin-top:6px}
.bar2 i{display:block;height:100%;background:var(--gold)}
.bar2 i.done{background:var(--good)}
.figs{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.pc{font-size:17px;font-weight:700;letter-spacing:-.01em}
.word{font-size:11.5px;color:var(--ink-3)}
.behind,.cb{display:inline-block;font-size:10px;letter-spacing:.05em;text-transform:uppercase;font-weight:700;border-radius:4px;padding:1px 6px}
.behind,.cb.over{color:var(--bad-tx);background:var(--bad-bg);border:1px solid var(--bad)}
.cb.wait{color:var(--panel-ink);background:var(--panel);border:1px solid var(--panel)}
.cb.soon{color:var(--attn-tx);background:var(--attn-bg);border:1px solid var(--attn)}
.noplan{font-size:12.5px;color:var(--ink-3);font-style:italic}
.owe{width:230px}
.owe .n{font-size:17px;font-weight:700;color:var(--attn-tx)}
.owe .n.clear{color:var(--ink-3);font-weight:600;font-size:13px}
.owe .parts{font-size:11.5px;color:var(--ink-3);margin-top:2px}
.mine{box-shadow:inset 3px 0 0 var(--gold)}
.when{width:150px;font-size:12.5px}
.when .d{font-weight:600}
.when .s{font-size:11px;color:var(--ink-3)}
.when .none{color:var(--ink-3)}
.empty{margin:0;padding:22px 16px;text-align:center;font-size:13px;color:var(--ink-3)}
.cdue{width:104px;font-variant-numeric:tabular-nums;font-weight:600}
.cdue.past{color:var(--bad-tx)}
.cwhat{width:188px}
.cname{font-weight:600}
.cproj{font-size:11.5px;color:var(--ink-3);margin-top:2px}

/* the charter (§5.1) — a page of rows, read, with a pen per section */
.ch h2{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:22px 0 7px;font-weight:700}
.chbox{background:var(--surface);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.row{display:flex;gap:16px;padding:11px 15px;border-top:1px solid var(--line-soft)}
.row:first-child{border-top:0}
.row em{flex:none;width:158px;font-style:normal;font-size:11.5px;color:var(--ink-3);font-weight:600;padding-top:2px}
.row .val{flex:1;min-width:0;font-size:13.5px;white-space:pre-wrap}
.row .val.none{color:var(--ink-3);font-style:italic}
.pen{background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--ink-2)}
.pen:hover{border-color:var(--gold)}
.fld{width:100%;font:inherit;color:inherit;background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:6px 9px}
.fld:focus{outline:2px solid var(--focus);outline-offset:0}
textarea.fld{min-height:64px;resize:vertical}
.none2{color:var(--ink-3)}
.dlg{position:fixed;inset:0;background:rgba(10,14,22,.5);display:grid;place-items:center;padding:20px;z-index:20}
.dlg[hidden]{display:none!important}
.card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px;max-width:440px;width:100%}
.card h2{margin:0 0 4px;font-size:15px}
.card p{margin:0 0 12px;font-size:12.5px;color:var(--ink-3)}
.cbtns{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
.ghost{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:7px 13px;font-size:13px;color:var(--ink-2);font-weight:600}
`;

function switcher(slug: string, have: ModuleKey[]): string {
  const items = moduleMenu(have).map((m) =>
    m.key === "portfolio"
      ? '<span class="mi on" aria-current="true">' + esc(m.label) + "<i>" + esc(m.note) + "</i></span>"
      : '<a class="mi" href="' + esc(clientHref(slug, m.key, "")) + '">' + esc(m.label) + "<i>" + esc(m.note) + "</i></a>").join("");
  return '<details class="msw"><summary title="Modules" aria-label="Modules">' +
    '<svg viewBox="0 0 20 20" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1.2"/>' +
    '<rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2"/>' +
    '</g></svg></summary><div class="mmenu">' + items + "</div></details>";
}

function skeleton(a: { slug: string; tenantName: string; have: ModuleKey[]; bar: string; api?: string; body: string }): string {
  return "<!doctype html>\n<html lang='en' data-module='portfolio'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(a.tenantName) + " &mdash; " + esc(MODULE_DEF.portfolio.label) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(a.bar) + '">\n' +
    "<style>" + CSS.replace("%BAR%", a.bar) + brkCss() + "</style>\n</head>\n" +
    "<body" + (a.api ? ' data-api="' + esc(a.api) + '"' : "") + ">\n" +
    '<header class="bar">' + switcher(a.slug, a.have) +
    "<h1>" + esc(MODULE_DEF.portfolio.label) + "</h1>" +
    '<span class="org">&middot; <b>' + esc(a.tenantName) + "</b></span></header>\n" +
    a.body +
    (a.api ? '<script src="' + esc(clientHref(a.slug, "portfolio", "app.js")) + '"></script>\n' : "") +
    "</body>\n</html>\n";
}

/* ══ the landing (§9.13) ═══════════════════════════════════════════════ */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYNAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function stamp(d: string): string { return Number(d.slice(8, 10)) + " " + MON[Number(d.slice(5, 7)) - 1]; }
function daysTo(d: string, today: string): number {
  return Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 864e5);
}
function awayIn(d: string, today: string): string {
  const n = daysTo(d, today);
  return n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + plural(n, "day");
}
/* The drawing's own words for a percentage, one place (§9.13). */
function howFar(pct: number): string {
  if (pct === 0) return "Not started";
  if (pct === 100) return "Finished";
  if (pct < 34) return "Early";
  if (pct < 67) return "Under way";
  return "Nearly there";
}

export type Seen = {
  project: Project;
  rows: Row[];      /* already rolled up */
  pct: number | null;
  behind: boolean;
  owed: Row[]; wait: number; late: number; free: number;
  mine: boolean;
};

function farCell(s: Seen): string {
  /* THE CHECK'S BREAK (§94.5): a project with NO plan reading as 0% is the
     fault this row exists to avoid — a plan nobody has written and a plan
     nobody has started are different facts (§35, §93). Never set on a
     deployment. */
  if (s.pct === null && brk() === "no-plan-yet")
    return '<div class="figs"><span class="pc">0%</span>' +
      '<span class="word">Not started</span></div>' +
      '<div class="bar2"><i style="width:0%"></i></div>';
  if (s.pct === null) return '<span class="noplan">No plan yet</span>';
  return '<div class="figs"><span class="pc">' + s.pct + "%</span>" +
    '<span class="word">' + esc(howFar(s.pct)) + "</span>" +
    (s.behind ? '<span class="behind">Behind</span>' : "") +
    '</div><div class="bar2"><i class="' + (s.pct === 100 ? "done" : "") +
    '" style="width:' + s.pct + '%"></i></div>';
}
function oweCell(s: Seen): string {
  /* ONE SPELLING OF A DASH: the strip's goes through `esc()`, which would
     turn an entity into its own text, so the character is what works on both
     sides of this file (§53.5, in the small). */
  if (s.pct === null) return '<span class="n clear">\u2014</span>';
  if (!s.owed.length) return '<span class="n clear">Nothing owed</span>';
  const parts: string[] = [];
  if (s.wait) parts.push(s.wait + " to sign off");
  if (s.late) parts.push(s.late === 1 ? "1 past its date" : s.late + " past their date");
  if (s.free) parts.push(s.free === 1 ? "1 with nobody on it" : s.free + " with nobody on them");
  return '<span class="n">' + s.owed.length + "</span>" +
    '<div class="parts">' + esc(parts.join(" · ")) + "</div>";
}
function whenCell(s: Seen, today: string): string {
  const cad = s.project.cadence as Cadence | null;
  const when = nextCheckpoint(cad, s.project.cadenceDay, today);
  if (!when) return '<span class="none">No checkpoint set</span>';
  const how = cad === "weekly"
    ? "weekly, on a " + DAYNAME[s.project.cadenceDay || 0]
    : "monthly, on the " + (s.project.cadenceDay || 1) + ((s.project.cadenceDay || 1) === 1 ? "st" : "th");
  return '<div class="d">' + esc(stamp(when)) + "</div>" +
    '<div class="s">' + esc(awayIn(when, today)) + " · " + esc(how) + "</div>";
}

function cell(k: string, v: string | number, lab: string, sub: string): string {
  return '<div class="cell ' + k + '"><p class="k">' + esc(lab) + "</p>" +
    '<div class="v">' + esc(String(v)) + '</div><div class="w">' + esc(sub) + "</div></div>";
}

export type LandingArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[];
  /* NULL is *it could not be read*, which is not an empty list (§35, §93,
     §231.4): an empty list is a statement about this client's data, and
     making it when nothing was read is a false all-clear. */
  seen: Seen[] | null; today: string; office: boolean; mayStart: boolean;
};

export async function landingDocument(a: LandingArgs): Promise<string> {
  const bar = await barFor(a.tenantId);
  const unread = a.seen === null;
  const seen = a.seen || [];
  const beh = seen.filter((s) => s.behind);
  const ow = seen.reduce((n, s) => n + s.owed.length, 0);
  /* A COUNT THAT WAS NOT READ IS A DASH, never a nought (§35). */
  const strip = unread
    ? cell("", "\u2014", "Projects", "Not read just now") +
      cell("", "\u2014", "Behind", "Not read just now") +
      cell("", "\u2014", "Waiting on somebody", "Not read just now")
    : cell("", seen.length, "Projects",
      a.office ? "Every project on this client" : "The ones that name you") +
    cell("late", beh.length, "Behind",
      beh.length ? beh.map((s) => s.project.name).join(", ") : "Nothing is past a date") +
    cell("owed", ow, "Waiting on somebody",
      ow ? seen.filter((s) => s.owed.length).map((s) => s.project.name).join(", ")
         : "Nothing is owed across these");

  const rows = seen.map((s) =>
    '<tr' + (s.mine ? ' class="mine"' : "") + ">" +
    '<td><div class="pname"><a href="' + esc(clientHref(a.slug, "portfolio", s.project.id)) + '">' +
      esc(s.project.name) + "</a></div>" +
      (s.project.brief ? '<div class="pbrief">' + esc(s.project.brief) + "</div>" : "") + "</td>" +
    '<td class="far">' + farCell(s) + "</td>" +
    '<td class="owe">' + oweCell(s) + "</td>" +
    '<td class="when">' + whenCell(s, a.today) + "</td></tr>").join("");

  /* THE EMPTY LIST IS AN ANSWER, never a blank table (§45.2), and it says
     what to do next only to somebody who may do it (§61). */
  const list = unread
    ? '<div class="box"><p class="empty"><b>The projects could not be read just now.</b> ' +
      "Nothing has been lost &mdash; try again in a moment.</p></div>"
    : seen.length
    ? '<div class="box"><table><thead><tr><th>Project</th><th class="far">How far along</th>' +
      '<th class="owe">Waiting on somebody</th><th class="when">Next look</th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table></div>"
    : '<div class="box"><p class="empty">' +
      (a.mayStart
        ? "No projects yet. <b>Start a project</b> above, and its plan comes after its charter."
        : a.office
          ? "No projects yet on this client."
          : "No project names you yet. Somebody in the office adds you to one.") +
      "</p></div>";

  const body = '<main class="wrap">\n' +
    '<div class="phead"><div><p class="crumb"><a href="' + esc(clientHref(a.slug, null, "")) + '">' +
      esc(a.tenantName) + "</a> &middot; Portfolio</p><h1>Projects</h1></div>" +
    (a.mayStart ? '<button class="start" id="start">Start a project</button>' : "") + "</div>\n" +
    '<div class="strip">' + strip + "</div>\n" +
    '<p class="sect">The projects</p>\n' + list +
    (unread ? "" : commitmentsBlock(seen, a.today)) +
    (a.mayStart ? startDialog() : "") +
    "</main>\n";

  return skeleton({ slug: a.slug, tenantName: a.tenantName, have: a.have, bar,
    api: clientHref(a.slug, "portfolio", "api"), body });
}

/* ── WHAT IS OWED NEXT, ACROSS EVERY PROJECT (§9.13b) ──────────────────
   Three things put a commitment on this list: it is waiting on a sign-off,
   it is late, or it falls due inside the warning window. A SIGN-OFF IS OWED
   NOW WHATEVER ITS DATE SAYS — the strip above already counts it as waiting
   on somebody, so leaving it off here would be two answers on one screen
   (§5.2). The window is `SOON`, read from lib/portfolio.ts rather than typed
   again (§9.13a's own lesson). */
const SOON = 14;
function commitmentsBlock(seen: Seen[], today: string): string {
  type C = { s: Seen; r: Row };
  const all: C[] = [];
  for (const s of seen) for (const r of s.rows) {
    if (r.lvl !== 2) continue;
    if (!r.milestone) continue;
    if (r.status === "completed") continue;
    all.push({ s, r });
  }
  all.sort((x, y) => String(x.r.end || "9999").localeCompare(String(y.r.end || "9999")));
  const inWindow = (c: C) =>
    c.r.status === "done" || !c.r.end || daysTo(c.r.end, today) <= SOON;
  const list = all.filter(inWindow);

  const state = (r: Row) =>
    r.status === "done" ? "wait" : (r.end && daysTo(r.end, today) < 0) ? "over" : "soon";
  const word = (r: Row) => {
    const st = state(r);
    if (st === "wait") return "Waiting to sign off";
    if (st === "over") return plural(-daysTo(String(r.end), today), "day") + " over";
    return "In " + plural(daysTo(String(r.end), today), "day");
  };

  if (!list.length) {
    const next = all.length ? all[0] : null;
    return '<p class="sect">What is owed next</p><div class="box"><p class="empty">' +
      (next && next.r.end
        ? "Nothing is owed in the next " + plural(SOON, "day") + ". The next is <b>" +
          esc(String(next.r.name)) + "</b> on " + esc(stamp(String(next.r.end))) + "."
        : "No commitments are set on these projects yet.") +
      "</p></div>";
  }
  const rows = list.map((c) =>
    '<tr' + (c.s.mine ? ' class="mine"' : "") + ">" +
    '<td class="cdue' + (c.r.end && daysTo(c.r.end, today) < 0 ? " past" : "") + '">' +
      esc(c.r.end ? stamp(c.r.end) : "—") + "</td>" +
    '<td><div class="cname">' + esc(String(c.r.name)) + "</div>" +
      '<div class="cproj">' + esc(c.s.project.name) + "</div></td>" +
    '<td class="cwhat"><span class="cb ' + state(c.r) + '">' + esc(word(c.r)) + "</span></td></tr>").join("");
  return '<p class="sect">What is owed next <span>&mdash; late, waiting on a sign-off, ' +
    "or due inside " + plural(SOON, "day") + "</span></p>" +
    '<div class="box"><table><thead><tr><th class="cdue">Due</th><th>Commitment</th>' +
    '<th class="cwhat">What is in the way</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
}

function startDialog(): string {
  return '<div class="dlg" id="startdlg" hidden><div class="card" role="dialog" aria-modal="true" aria-labelledby="sdt">' +
    '<h2 id="sdt">Start a project</h2>' +
    "<p>Its name is all that is needed now. The charter and the plan come after.</p>" +
    '<input class="fld" id="pname" maxlength="200" placeholder="Culture Transformation">' +
    '<div class="cbtns"><button class="ghost" data-close>Cancel</button>' +
    '<button class="start" id="make">Start it</button></div></div></div>';
}

/* ══ the charter (§5.1) ════════════════════════════════════════════════ */
const SECTIONS: { head: string; rows: { f: string; lab: string; area?: boolean }[] }[] = [
  { head: "Project information", rows: [
    { f: "name", lab: "Title" },
    { f: "brief", lab: "Brief", area: true },
  ] },
  { head: "Rationale &amp; scope", rows: [
    { f: "painDrivers", lab: "Pain drivers", area: true },
    { f: "gainDrivers", lab: "Gain drivers", area: true },
    { f: "inScope", lab: "In scope", area: true },
    { f: "outScope", lab: "Out of scope", area: true },
  ] },
  { head: "Outcomes &amp; deliverables", rows: [
    { f: "deliverables", lab: "Deliverables", area: true },
    { f: "successCriteria", lab: "Success criteria", area: true },
  ] },
  { head: "Plan &amp; resources", rows: [
    { f: "agreedStart", lab: "Agreed start" },
    { f: "agreedEnd", lab: "Agreed end" },
    { f: "resources", lab: "Resources", area: true },
    { f: "budget", lab: "Budget" },
    { f: "risks", lab: "Risks", area: true },
  ] },
];

export type CharterArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[];
  charter: Charter; mayEdit: boolean; role: Role | null; office: boolean;
};

export async function charterDocument(a: CharterArgs): Promise<string> {
  const bar = await barFor(a.tenantId);
  const c = a.charter as unknown as Record<string, string>;
  const secs = SECTIONS.map((s) =>
    "<h2>" + s.head + "</h2><div class=\"chbox\">" +
    s.rows.map((r) => {
      const v = String(c[r.f] ?? "");
      const val = v
        ? '<div class="val" data-v>' + esc(v) + "</div>"
        : '<div class="val none" data-v>Not set</div>';
      return '<div class="row" data-row="' + esc(r.f) + '"' + (r.area ? ' data-area="1"' : "") + ">" +
        "<em>" + esc(r.lab) + "</em>" + val +
        (a.mayEdit ? '<button class="pen" data-edit>Edit</button>' : "") + "</div>";
    }).join("") + "</div>").join("");

  const who = a.office ? "a seat on " + a.tenantName : a.role ? ROLE_WORD[a.role] : "";
  const body = '<main class="wrap ch">\n' +
    '<div class="phead"><div><p class="crumb">' +
      '<a href="' + esc(clientHref(a.slug, "portfolio", "")) + '">Projects</a> &middot; Charter</p>' +
      "<h1>" + esc(a.charter.name) + "</h1></div>" +
      (who ? '<span class="word">You are here as ' + esc(who) + "</span>" : "") + "</div>\n" +
    secs + "\n</main>\n";
  return skeleton({ slug: a.slug, tenantName: a.tenantName, have: a.have, bar,
    api: a.mayEdit ? clientHref(a.slug, "portfolio", "api") : undefined, body });
}

/* Nothing here for this viewer, in words, with the way back (§61). */
export async function refusedDocument(slug: string, tenantId: string, tenantName: string, have: ModuleKey[], why: string): Promise<string> {
  const bar = await barFor(tenantId);
  return skeleton({ slug, tenantName, have, bar,
    body: '<main class="wrap"><div class="box"><p class="empty"><b>' + esc(why) + "</b><br>" +
      '<a href="' + esc(clientHref(slug, "portfolio", "")) + '">Back to the projects</a></p></div></main>\n" ' });
}

/* WHAT THE LANDING NEEDS WORKED OUT, in one place, from the plan's own rows
   — so the strip, the row and the commitments list cannot disagree (§5.2). */
export function seeProject(project: Project, rows: Row[], today: string, mine: boolean): Seen {
  const rolled = rollUp(rows.slice());
  const acts = rolled.filter((r) => r.lvl === 2);
  return {
    project, rows: rolled,
    pct: overall(rolled),
    behind: acts.some((r) => behind(r, today)),
    owed: owed(rolled, today),
    wait: waitingSignOff(rolled).length,
    late: overdue(rolled, today).length,
    free: nobodyOn(rolled).length,
    mine,
  };
}
