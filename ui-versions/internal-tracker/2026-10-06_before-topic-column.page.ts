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
import { topBarHtml, TOPBAR_CSS, TOPBAR_SCRIPT_TAG, themedCss, type TopBar } from "../../lib/topbar.ts";
import { withTenant } from "../../lib/tenant.ts";
import { BAR_DEFAULT, barFor, barVars } from "../../lib/branding.ts";
import { clientHref, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import {
  type Action, type Who, type View, type Group, type Format, type Person, type Event, VIEWS, VIEW_WORD, STATUSES, STATUS_WORD, GROUPS, GROUP_WORD,
  FORMATS, FORMAT_WORD, todayIn, weekOf, weekLabel, readableDay, isLate, carriedWeeks, lateWord, inView, summary, mayChange,
  thursdayOf, weekWord, sameWeek, weekOptions,
  officeRows, namesOf, shortNames, listActions, eventsOf, listTopics, type Topic,
} from "../../lib/tracker.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plural = (n: number, one: string, many: string) => n + " " + (n === 1 ? one : many);
const brk = () => process.env.SMP_BREAK || "";

/* THE FALSIFICATION SWITCHES for the look (§276): each puts back exactly what
   a decision removed, so a check that goes green with one of them on is a check
   that was not asserting the decision. They are CSS appended after the
   stylesheet, never edits inside it, so the shipped rules stay readable. */
function brkCss(): string {
  const b = brk();
  if (b === "card-jumps") return ".tile{min-height:0}";                                         /* §356.16 put back */
  if (b === "details-always") return ".addrow .tpk,.addrow .when,.addrow .who,.addrow .st,.addrow .more{visibility:visible}";
  if (b === "wide-names") return ".team{min-width:140px}.team button{padding:7px 9px;font-size:14px;gap:9px}";
  return "";
}

const CSS = `
*{box-sizing:border-box}
/* THE LEDGER (§497), from design-mockups/internal-tracker/2026-10-06_topics-refined.html,
   its "Refined" column, with Islam's two changes: no way back above the
   title (the top bar is the way back) and the third count reads "Due". */
:root{%BARVARS%;--ink:#141C2B;--ink-2:#465268;--ink-3:#5E6E85;--line:#D8DEE8;--line-2:#E6EAF0;--ground:#F7F8FA;--surface:#FFF;--surface-2:#EDF0F5;--gold:#9C5D08;--gold-bg:#FBF3E4;
  --good:#1B6E4E;--good-bg:#E9F4EF;--bad:#B23025;--bad-bg:#FBEDEB;
  --font:'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
/* THE FONT FAMILY IS NAMED, NEVER "inherit" INSIDE THE SHORTHAND (§356.14):
   a shorthand ending in a CSS-wide keyword is not CSS a browser will read,
   so every such line was silently dropped. */
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8E99AC;--line:#333B4A;--line-2:#2A303C;--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;--gold:#F5A623;--gold-bg:#2E2715;
  --good:#63BE96;--good-bg:#1B2C26;--bad:#E8776B;--bad-bg:#33211F;color-scheme:dark}}
:root[data-theme="dark"]{--ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8E99AC;--line:#333B4A;--line-2:#2A303C;--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;--gold:#F5A623;--gold-bg:#2E2715;
  --good:#63BE96;--good-bg:#1B2C26;--bad:#E8776B;--bad-bg:#33211F;color-scheme:dark}
body{margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.55 var(--font);-webkit-font-smoothing:antialiased}
.pg{max-width:1000px;margin:0 auto;padding:20px 20px 48px}
/* the masthead: the week, the name, the four counts, the views */
.mast{background:var(--bar);color:var(--bar-ink);border-radius:12px;padding:16px 20px 0;margin:0 0 18px;position:relative;box-shadow:inset 0 -3px 0 var(--bar-accent)}
.mrow{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}
.wkof{font:600 11px/1 var(--font);letter-spacing:.14em;text-transform:uppercase;color:var(--bar-accent);margin:0 0 7px}
h2.pt{margin:0;font:600 24px/1.15 var(--font);letter-spacing:-.01em;color:var(--bar-ink)}
.strip{display:flex;gap:22px;font-variant-numeric:tabular-nums}
/* ONE HEIGHT, WHATEVER THE WORDS SAY (§356.16): the floor holds the counts
   still when a status changes; the label never takes a second line. */
.tile{text-align:right;min-height:48px}
.tile b{display:block;font:600 22px/1 var(--font);color:var(--bar-ink)}
.tile span{display:block;font:600 10.5px/1.6 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--bar-quiet);margin-top:3px;white-space:nowrap}
.tile.late b{color:var(--bar-late)}
.cats{display:flex;gap:2px;margin:14px 0 0;align-items:flex-end;flex-wrap:wrap}
.cats a{font:600 13.5px/1 var(--font);color:var(--bar-quiet);padding:10px 12px 12px;border-bottom:3px solid transparent;text-decoration:none}
.cats a[aria-current="true"]{color:var(--bar-ink);border-bottom-color:var(--bar-accent)}
.cats a:hover,.cats a:focus-visible{color:var(--bar-ink);outline:none}
.cats .sp{flex:1}
/* the settings — how the list is grouped, and dates as weeks or days —
   behind "Group by" on the far right of the views row (§356.14, §497) */
.dots{position:relative;align-self:center;margin-bottom:9px}
.dots>button{display:inline-flex;align-items:center;gap:6px;font:500 13px/1 var(--font);color:var(--bar-quiet);padding:6px 8px;border-radius:7px;background:none;border:0;cursor:pointer}
.dots>button b{color:var(--bar-ink);font-weight:600}
.dots>button svg{width:12px;height:12px}
.dots>button svg.d3{width:16px;height:16px;margin-left:4px}
.dots>button:hover,.dots>button.on,.dots>button:focus-visible{background:var(--bar-hover);color:var(--bar-ink);outline:none}
.setmenu,.tmenu{position:absolute;top:32px;right:0;z-index:9;display:flex;gap:4px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:6px;text-align:left}
.setmenu .col{display:grid;align-content:start;min-width:0}
.setmenu .col+.col{border-left:1px solid var(--line);padding-left:4px}
.setmenu .lab{display:block;font:600 10.5px/1.7 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding:3px 9px 2px}
.setmenu button,.tmenu button{display:flex;align-items:center;gap:8px;background:none;border:0;border-radius:7px;padding:5px 9px;font:400 13.5px/1.3 var(--font);color:var(--ink);cursor:pointer;text-align:left;white-space:nowrap}
.setmenu button:hover,.setmenu button:focus-visible,.tmenu button:hover,.tmenu button:focus-visible{background:var(--ground);outline:none}
.setmenu button.on{font-weight:600}
.setmenu button.on::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);margin-left:auto;flex:none}
.tmenu{display:grid;min-width:150px}
.tmenu button.danger{color:var(--bad)}
.tmenu .sure{display:grid;gap:4px;padding:4px 9px;font-size:13px;color:var(--ink-2);max-width:220px;white-space:normal}
/* the tools: write the next action, or search */
.tools{display:flex;gap:18px;align-items:stretch;margin:0 0 22px;flex-wrap:wrap}
.write{flex:1 1 380px;min-width:0;border-bottom:1.5px solid var(--gold)}
.find{display:flex;align-items:center;gap:8px;flex:0 1 240px;min-width:0;border-bottom:1.5px solid var(--line);padding:6px 2px;color:var(--ink-3)}
.find svg{width:14px;height:14px;flex:none}
.srch{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font:400 14px/1.5 var(--font);padding:2px 0;outline:none}
.srch::placeholder{color:var(--ink-3)}
.go{border:0;background:none;color:var(--ink-3);font:600 12.5px/1 var(--font);cursor:pointer;padding:4px 2px}
.cnt{font:500 12.5px/1 var(--font);color:var(--ink-3);white-space:nowrap}
.find .cnt{display:none}
.counted{font:500 12.5px/1 var(--font);color:var(--ink-3);margin:-14px 0 18px;text-align:right}
.list{display:flex;flex-direction:column}
.none{padding:30px 4px 10px;color:var(--ink-3);font-size:14px;max-width:60ch}
.none b{color:var(--ink);font-weight:600;display:block;font-size:15.5px;margin-bottom:6px}
/* a section: a numbered head, its counts, its rows, and what it folds */
.sec{margin:0 0 26px}
.sh{display:flex;align-items:baseline;gap:12px;padding:0 0 8px;border-bottom:2px solid var(--ink)}
.sh .ix{font:600 12px/1 var(--font);color:var(--gold);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.sh h3{margin:0;font:600 17px/1.2 var(--font);min-width:0}
.sh h3 input{font:600 17px/1.2 var(--font);color:var(--ink);border:1px solid var(--gold);border-radius:6px;padding:1px 6px;background:var(--surface);outline:none}
.sh .meta{font:400 13px/1 var(--font);color:var(--ink-3)}
.sh .meta .bad{color:var(--bad);font-weight:600}
.sh .end{margin-left:auto;display:flex;align-items:center;gap:10px;font:500 12.5px/1 var(--font);color:var(--ink-3)}
.sh .tdots{position:relative}
.sh .tdots>button{background:none;border:0;border-radius:6px;color:var(--ink-3);padding:3px 5px;cursor:pointer;display:grid;place-items:center}
.sh .tdots>button:hover,.sh .tdots>button.on,.sh .tdots>button:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
.sh .tdots svg{width:16px;height:16px}
.sh .tmenu{top:26px}
.sh.quiet{border-bottom-color:var(--line)}
.sh.quiet h3{color:var(--ink-2);font-weight:500;font-style:italic}
.sh .shut{font:600 10.5px/1 var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);border:1px solid var(--line);border-radius:999px;padding:3px 7px}
.meter{height:2px;background:var(--line-2);position:relative;top:-2px;margin-bottom:-2px}
.meter i{display:block;height:100%;background:var(--good)}
.foot{display:flex;gap:16px;padding:9px 0 0 32px;font:500 13px/1.4 var(--font);color:var(--ink-3)}
.foot button{background:none;border:0;padding:0;font:500 13px/1.4 var(--font);color:var(--ink-3);cursor:pointer}
.foot button b{color:var(--gold);font-weight:600}
.foot button:hover,.foot button:focus-visible{color:var(--ink);outline:none}
/* DONE FOLDS UNDER ITS SECTION (§497): a section shows what is still to do,
   and "N done ›" opens the rest. A row ticked a moment ago stays where the
   hand left it, and an opened row always shows. */
.sec:not(.showdone) .row.done:not(.fresh):not(.on){display:none}
/* the row: tick · name · when · owner · status · the arrow */
.row{display:grid;grid-template-columns:20px minmax(0,1fr) auto 64px 128px 26px;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line-2)}
.row .t{min-width:0;font-size:15px;line-height:1.35}
.row .t[data-rename]{cursor:text}
.row .tn2{min-width:0;display:flex;align-items:baseline;flex-wrap:wrap;column-gap:8px}
.tn2.editing{align-items:center}.tn2.editing .tg{display:none}
.tn2 select.tsel{border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:5px 8px;font:400 13px/1.3 var(--font);max-width:220px}
.tg{font:600 10.5px/1 var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
.row input.ttl{width:100%;min-width:0;border:1px solid var(--gold);border-radius:6px;background:var(--surface);color:var(--ink);padding:3px 7px;margin:-4px -8px;font:400 15px/1.35 var(--font);outline:none}
.row.done .t{color:var(--ink-3)}
.tick{width:17px;height:17px;border:1.5px solid var(--line);border-radius:4px;display:grid;place-items:center;color:var(--surface);background:var(--surface);cursor:pointer;padding:0}
.tick:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.row.late .tick{border-color:var(--bad)}
.row.done .tick{background:var(--good);border-color:var(--good)}
.tick svg{width:11px;height:11px}
.tick[disabled]{cursor:default;opacity:.55}
.when{font:500 13px/1.4 var(--font);color:var(--ink-2);white-space:nowrap;text-align:left;background:none;border:0;padding:0;position:relative}
.when.late{color:var(--bad);font-weight:600}
.when.pick{cursor:pointer;border-radius:6px;padding:3px 6px;margin:-3px -6px}
.when.pick:hover,.when.pick.on,.when.pick:focus-visible{background:var(--surface-2);outline:none}
.when .wk{display:inline-block;font:500 13px/1.4 var(--font);color:inherit}
/* the week picker: a small table — the week, the days — this week bold
   (§356.15); No date and a day of your own at the foot */
.weeks{position:absolute;top:26px;right:0;z-index:5;width:232px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:4px;text-align:left;font-variant-numeric:tabular-nums}
.weeks .wh{display:grid;grid-template-columns:86px 1fr;padding:5px 9px 4px;font:600 10px/1.6 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);border-bottom:1px solid var(--line);margin-bottom:3px}
.weeks button{display:grid;grid-template-columns:86px 1fr;width:100%;align-items:baseline;background:none;border:0;border-radius:7px;padding:6px 9px;font:400 13.5px/1.3 var(--font);color:var(--ink);cursor:pointer;text-align:left}
.weeks button b{font-weight:400;font-variant-numeric:tabular-nums}
.weeks button.now b{font-weight:700}
.weeks button small{font:400 12px/1.3 var(--font);color:var(--ink-3);white-space:nowrap}
.weeks button:hover,.weeks button:focus-visible{background:var(--ground);outline:none}
.weeks button.on{background:var(--surface-2)}
.weeks .wf{display:grid;border-top:1px solid var(--line);margin-top:3px;padding-top:3px}
.weeks .wf button{grid-template-columns:1fr;color:var(--ink-3);font-size:13px}
.row input.dt,.addrow input.dt{font:400 13px/1.4 var(--font);color:var(--ink);border:1px solid var(--gold);border-radius:6px;padding:2px 5px;background:var(--surface)}
/* the owner is a first name, drawn as the fact; a press opens the team */
.who{font:500 13px/1.4 var(--font);color:var(--ink-2);white-space:nowrap;text-align:left;background:none;border:0;padding:0;position:relative}
.who.pick{cursor:pointer;border-radius:6px;padding:3px 6px;margin:-3px -6px}
.who.pick:hover,.who.pick.on,.who.pick:focus-visible{background:var(--surface-2);outline:none}
/* COMPACT (§356.16): the box is its widest name */
.team,.topics{position:absolute;top:26px;right:0;z-index:5;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:4px;text-align:left}
.team button,.topics button{display:flex;width:100%;align-items:center;gap:8px;background:none;border:0;border-radius:7px;padding:5px 9px;font:400 13.5px/1.4 var(--font);color:var(--ink);cursor:pointer;text-align:left;white-space:nowrap}
.team button:hover,.team button:focus-visible,.topics button:hover,.topics button:focus-visible{background:var(--ground);outline:none}
.team button.on,.topics button.on{font-weight:600}
.team button.on::after,.topics button.on::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);margin-left:auto}
.topics{min-width:190px}
.topics .tnew{display:block;width:100%;border:0;border-top:1px solid var(--line);margin-top:3px;padding:7px 9px 5px;background:transparent;color:var(--ink);font:400 13.5px/1.4 var(--font);outline:none}
/* THE STATUS IS A WORD (§497): one box whether it can be pressed or not —
   the same font, height and width for a select and a span — with a dash
   before it in the colour of what it says. */
.st{display:inline-flex;align-items:center;gap:7px;height:26px;width:128px;font:600 11px/1 var(--font);letter-spacing:.08em;text-transform:uppercase;padding:0;border:0;border-radius:6px;color:var(--ink-3);background:transparent;white-space:nowrap;text-align:left;appearance:none;-webkit-appearance:none;margin:0}
span.st::before{content:"";width:12px;height:2px;background:currentColor;flex:none}
select.st{cursor:pointer;padding:0 14px 0 19px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='2'%3E%3Crect width='12' height='2' fill='%235E6E85'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%235E6E85'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 0 center,right 3px center}
select.st:hover,select.st:focus-visible{background-color:var(--surface-2);outline:none}
.st.prog{color:var(--gold)}
select.st.prog{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='2'%3E%3Crect width='12' height='2' fill='%239C5D08'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%239C5D08'/%3E%3C/svg%3E")}
.st.done{color:var(--good)}
select.st.done{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='2'%3E%3Crect width='12' height='2' fill='%231B6E4E'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%231B6E4E'/%3E%3C/svg%3E")}
select.st option{text-transform:none;letter-spacing:0;color:var(--ink);background:var(--surface)}
/* the arrow that expands a row for its notes and history, and folds it */
.more{width:26px;height:26px;border-radius:7px;border:0;background:none;color:var(--ink-3);display:grid;place-items:center;cursor:pointer;padding:0;justify-self:end}
.more:hover,.more.on,.more:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
.more svg{width:14px;height:14px;transition:transform .15s}
.more.on svg{transform:rotate(180deg)}
@media (prefers-reduced-motion:reduce){.more svg{transition:none}}
/* THE NEXT ACTION is written at the top, under a gold rule: the pen, the box,
   and — once a first letter lands — its topic, week, owner and note */
.addrow{display:grid;grid-template-columns:20px minmax(0,1fr) auto auto auto 0 26px;gap:12px;align-items:center;padding:6px 0}
.addrow .plus{width:18px;height:18px;display:grid;place-items:center;color:var(--gold)}
.addrow .plus svg{width:15px;height:15px}
.addrow input.new{border:0;background:transparent;color:var(--ink);font:400 15px/1.35 var(--font);padding:2px 0;width:100%;min-width:0;outline:none}
.addrow input::placeholder{color:var(--ink-3)}
.addrow .tn{min-width:0;display:grid;gap:2px}
.addrow input.nt{border:0;background:transparent;color:var(--ink-2);font:400 13px/1.4 var(--font);padding:0;width:100%;min-width:0;outline:none}
.addrow .tpk{font:600 13px/1.4 var(--font);color:var(--ink-3);white-space:nowrap;background:none;border:0;padding:3px 6px;margin:-3px -6px;border-radius:6px;cursor:pointer;position:relative}
.addrow .tpk .tw{text-decoration:underline dotted;text-underline-offset:3px}
.addrow .tpk.set{color:var(--gold)}
.addrow .tpk.set .tw{text-decoration:underline solid 1.5px}
.addrow .tpk:hover,.addrow .tpk.on,.addrow .tpk:focus-visible{background:var(--surface-2);outline:none}
.addrow .when .wk,.addrow .who .wn{text-decoration:underline dotted;text-underline-offset:3px}
.addrow .st{width:0;overflow:hidden;padding:0;gap:0}
/* THE DETAILS ARRIVE WITH THE FIRST LETTER (§356.16): their space is kept,
   so the box does not narrow under the hand when a letter lands */
.addrow .tpk,.addrow .when,.addrow .who,.addrow .st,.addrow .more{visibility:hidden}
.addrow.typing .tpk,.addrow.typing .when,.addrow.typing .who,.addrow.typing .st,.addrow.typing .more{visibility:visible}
.addhint{font:400 12.5px/1.5 var(--font);color:var(--ink-3);padding:6px 0 0 32px}
/* the opened row: its topic, its notes, its history */
.open{grid-column:1/-1;display:grid;grid-template-columns:1.4fr 1fr;gap:18px;padding:12px 4px 10px 32px;border-bottom:1px solid var(--line-2);background:var(--surface)}
.open .lab{font:600 10.5px/1.7 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin:10px 0 4px}
.open .lab:first-child{margin-top:0}
.open textarea{border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 var(--font);width:100%;min-height:72px;resize:vertical}
.open select.tsel{border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:6px 9px;font:400 14px/1.4 var(--font);max-width:100%}
.open .hint{font-size:12.5px;color:var(--ink-3);margin-top:4px}
.open .ro{font-size:14px;color:var(--ink-2)}
.hist{list-style:none;margin:0;padding:0 8px 0 0;font-size:11.5px;line-height:1.45;max-height:118px;overflow-y:auto;scrollbar-width:thin;scrollbar-gutter:stable;color:var(--ink-2)}
.hist li{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:4px 0;border-bottom:1px solid var(--line-2)}
.hist li:last-child{border-bottom:0}
.hist time{font:400 10.5px/1.6 var(--font);color:var(--ink-3);white-space:nowrap}
.hist b{font-weight:600;color:var(--ink)}
.open .acts{display:flex;gap:14px;padding-top:10px;font-size:13px;align-items:center}
.open .acts button{background:none;border:0;padding:0;font:400 13px/1.4 var(--font);color:var(--ink-3);cursor:pointer;text-decoration:underline}
.open .acts button.danger{color:var(--bad)}
.open .acts .sure{display:flex;gap:10px;align-items:center;color:var(--ink-2)}
/* An author display beats the browser's own [hidden] rule (§356.8). */
[hidden]{display:none!important}
.open .acts .sure .go,.tmenu .sure .go{border:1px solid var(--line);border-radius:7px;padding:5px 10px;text-decoration:none;color:var(--ink)}
.open .acts .sure .go.danger,.tmenu .sure .go.danger{color:var(--bad);border-color:var(--bad)}
.row.on{background:var(--surface);border-bottom-color:transparent}
.said{margin:0 0 12px;padding:9px 13px;border:1px solid var(--bad);border-radius:8px;background:var(--bad-bg);color:var(--bad);font-size:13.5px}
.said:empty{display:none}
.unread{margin:0 0 12px;padding:9px 13px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink-2);font-size:13.5px}
@media (max-width:760px){.strip{gap:14px}.open{grid-template-columns:1fr;padding-left:4px}
  .addrow{grid-template-columns:20px minmax(0,1fr) 26px}.addrow .tpk,.addrow .when,.addrow .who,.addrow .st{display:none}
  .row{grid-template-columns:20px minmax(0,1fr) auto 26px;grid-template-areas:"tick t st more" ". when who more"}.row .tick{grid-area:tick}.row .tn2{grid-area:t}.row .st{grid-area:st}.row .when{grid-area:when}.row .who{grid-area:who}.row .more{grid-area:more}
  .team,.weeks,.topics{right:auto;left:0}}
`;


/* What the script needs to know rides on <body>: the two addresses it talks
   to, and the view, the search and the grouping the page was drawn with, so
   a press asks the server for the same list it is looking at. */
const topOf = (p: PageArgs): TopBar => ({ slug: p.slug, tenantName: p.tenantName, module: "tracker", have: p.have, consultant: !!p.consultant });

/* §499 — THE TRACKER WEARS FOREFRONT'S COLOURS, NEVER THE CLIENT'S. Islam:
   "not the banner only the whole module". It is the office's own weekly list
   (§356), so it is Forefront's page about a client rather than the client's
   page, and the signed-off ledger mockup drew it navy and gold. §498's
   barVars stays the one reader of how words sit on a band; it is simply
   handed Forefront's navy here and nothing the client set. The break puts
   the client's colour back so the check can prove it is not read. */
async function trackerBar(tenantId: string): Promise<string> { return brk() === "client-bar" ? barFor(tenantId) : BAR_DEFAULT; }

type BodyAttrs = { api: string; list: string; view: string; q: string; group: string; dates: string };
function skeleton(slug: string, tenantName: string, top: TopBar, bar: string, attrs: BodyAttrs | null, body: string): string {
  const a = attrs
    ? ' data-api="' + esc(attrs.api) + '" data-list="' + esc(attrs.list) + '" data-view="' + esc(attrs.view) + '" data-q="' + esc(attrs.q) + '" data-group="' + esc(attrs.group) + '" data-dates="' + esc(attrs.dates) + '"'
    : "";
  return "<!doctype html>\n<html lang='en' data-module='tracker'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " &mdash; " + esc(MODULE_DEF.tracker.label) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    TOPBAR_SCRIPT_TAG + "<style>" + TOPBAR_CSS + themedCss(CSS.replace("%BARVARS%", barVars(bar))) + brkCss() + "</style>\n</head>\n" +
    "<body" + a + ">\n" +
    topBarHtml(top) + "\n" +
    body +
    (attrs ? '<script src="' + esc(clientHref(slug, "tracker", "app.js")) + '"></script>\n' : "") +
    "</body>\n</html>\n";
}

/* Not the office: said in words, with the way back (§61). */
export async function refusedDocument(slug: string, tenantId: string, tenantName: string, have: ModuleKey[], consultant = false): Promise<string> {
  const bar = await trackerBar(tenantId);
  return skeleton(slug, tenantName, { slug, tenantName, module: "tracker", have, consultant }, bar, null,
    '<main class="pg"><div class="none"><b>The Internal Tracker is the office\'s.</b>' +
    'It is where Forefront keeps its own weekly actions about ' + esc(tenantName) + '. ' +
    '<a href="' + esc(clientHref(slug, null, "")) + '">Back to ' + esc(tenantName) + "</a></div></main>\n");
}

export type Ask = { view: View; q: string; open: string | null; group: Group; dates: Format };
export type PageArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[]; ask: Ask; who: Who; today?: string; consultant?: boolean;
};

type Q = Parameters<typeof officeRows>[0];
export type Loaded = { office: Person[]; names: Map<string, string>; short: Map<string, string>; actions: Action[]; events: Event[]; open: string | null; topics: Topic[] };

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
  return { office, names, short, actions, events: open ? await eventsOf(c, open) : [], open, topics: await listTopics(c) };
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

/* WHAT THE WHEN CELL SAYS. As weeks (§356.15): the week in words — This
   week, Next week, then W40 and beyond (weekWord) — and a late row says only
   how late, since in weeks a row is late from the Friday and the week it was
   due in is behind it. THE BOLD WENT WITH THE WORDS: this week's NUMBER was
   bold to mark it out among numbers, and once the row says "This week" the
   bold says it a second time (§87), so the row is plain and the picker keeps
   its mark. As exact dates: the day, and late with the day after it. Done is
   a day either way, because finishing happened on one. */
export function whenText(a: Action, today: string, dates: Format = "weeks"): { text: string; late: boolean; week?: boolean } {
  if (a.status === "done") return { text: "Done " + readableDay(a.doneDay, today), late: false };
  if (!a.due) return { text: "No date", late: false };
  const late = isLate(a.due, today);
  if (dates === "weeks") {
    if (late) return { text: lateWord(carriedWeeks(a.firstDue || a.due, today)), late: true };
    return { text: weekWord(a.due, today), late: false, week: true };
  }
  if (!late) return { text: readableDay(a.due, today), late: false };
  return { text: lateWord(carriedWeeks(a.firstDue || a.due, today)) + " · " + readableDay(a.due, today), late: true };
}

/* THE WEEK PICKER, drawn once per page and carried hidden in every cell that
   may open it — like the team under an owner's name, nothing is fetched to
   open it, and every row is a DAY the server checks again (§42): the week's
   Thursday. `on` marks the week the row already holds. */
export function weeksList(today: string, due: string | null): string {
  const rows = weekOptions(today).map((w) =>
    '<button type="button" role="option" data-act="pick-week" data-day="' + w.to + '" class="' + (w.now ? "now" : "") + (due && sameWeek(due, w.to) ? " on" : "") + '"' +
    ' aria-selected="' + (!!due && sameWeek(due, w.to)) + '"><b>' + w.word + "</b><small>" + esc(w.days) + "</small></button>").join("");
  return '<span class="weeks" role="listbox" aria-label="Due" hidden><span class="wh"><span>Week</span><span>Sun – Thu</span></span>' + rows +
    '<span class="wf"><button type="button" role="option" data-act="pick-week" data-day="" aria-selected="' + !due + '">No date</button>' +
    '<button type="button" data-act="pick-day">A day of my own…</button></span></span>';
}
/* The when cell for a row somebody may change: as weeks, the word with the
   picker behind it; as exact dates, the day, which a press turns into a date
   box in place (the script). */
function whenCell(a: Action, today: string, dates: Format, live: boolean): string {
  const w = whenText(a, today, dates);
  const word = w.week ? '<span class="wk">' + esc(w.text) + "</span>" : esc(w.text);
  if (!live || a.status === "done") return '<span class="when' + (w.late ? " late" : "") + '">' + word + "</span>";
  if (dates === "weeks")
    return '<span class="when' + (w.late ? " late" : "") + ' pick" role="button" tabindex="0" data-act="due" data-due="' + esc(a.due || "") + '" aria-haspopup="listbox" aria-expanded="false" title="Change the week">' +
      word + weeksList(today, a.due) + "</span>";
  return '<button class="when' + (w.late ? " late" : "") + ' pick" type="button" data-act="due" data-due="' + esc(a.due || "") + '" title="Change the date">' + word + "</button>";
}

/* THE OWNER CELL. The name is the fact for everybody; for whoever may hand
   the action on it is also the way to — pressing it opens the office on
   this client, first names only, the present owner marked. The team rides
   in the cell hidden, so nothing is fetched to open it, and every option is
   a register KEY the server checks again (§42). */
function teamList(L: Loaded, ownerKey: string): string {
  const nm = (k: string) => L.short.get(k) || L.names.get(k) || k;
  const team = L.office.map((p) =>
    '<button type="button" role="option" data-act="pick-owner" data-key="' + esc(p.key) + '"' +
    (p.key === ownerKey ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + ">" + esc(nm(p.key)) + "</button>").join("");
  return '<span class="team" role="listbox" aria-label="Owner" hidden>' + team + "</span>";
}
function whoCell(a: Action, L: Loaded, live: boolean): string {
  const nm = (k: string) => L.short.get(k) || L.names.get(k) || k;
  if (!live) return '<span class="who">' + esc(nm(a.ownerKey)) + "</span>";
  return '<span class="who pick" role="button" tabindex="0" data-act="who" aria-haspopup="listbox" aria-expanded="false" title="Hand it to somebody else">' +
    '<span class="wn">' + esc(nm(a.ownerKey)) + "</span>" + teamList(L, a.ownerKey) + "</span>";
}

const PEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13l1-3 7-7 2 2-7 7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const LENS = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const CARET = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const DOTS3 = '<svg class="d3" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>';

/* THE ROW (§497): tick · the name, with its topic beside it unless the list
   is grouped by topic (the heading says it then, §87) · when · owner · the
   status as a word · the arrow. A late row's tick is ringed in the alarm. */
function row(a: Action, L: Loaded, who: Who, today: string, dates: Format, opened: boolean, group: Group): string {
  const live = brk() === "who-everyone" ? true : mayChange(a, who);
  const late = a.status !== "done" && !!a.due && isLate(a.due, today);
  const t = a.topicId ? L.topics.find((x) => x.id === a.topicId) : null;
  const tag = t && group !== "topic" ? '<span class="tg">' + esc(t.name) + "</span>" : "";
  return '<div class="row' + (a.status === "done" ? " done" : "") + (late ? " late" : "") + (opened ? " on" : "") + '" data-id="' + esc(a.id) + '" data-status="' + a.status + '">' +
    '<button class="tick" type="button" role="checkbox" aria-checked="' + (a.status === "done") + '" aria-label="' + (a.status === "done" ? "Mark not done" : "Mark done") + '"' +
    (live ? ' data-act="tick"' : " disabled") + ">" + (a.status === "done" ? TICK : "") + "</button>" +
    '<div class="tn2"><div class="t"' + (live ? ' data-rename="1" data-topic="' + esc(a.topicId || "") + '"' + (t ? ' data-tname="' + esc(t.name) + '"' : "") + ' title="Double-click to rename or set its topic"' : "") + ">" + esc(a.title) + "</div>" + tag + "</div>" +
    whenCell(a, today, dates, live) +
    whoCell(a, L, live) +
    statusPill(a, live) +
    '<button class="more' + (opened ? " on" : "") + '" type="button" data-act="more" aria-expanded="' + opened + '" aria-label="' + (opened ? "Close" : "Notes and history") + '" title="' + (opened ? "Close" : "Notes and history") + '">' + ARROW + "</button>" +
    "</div>";
}

/* The opened row: its topic, the notes, Delete behind a question, and the
   history in a box that scrolls. The topic is a plain choice here, the open
   topics and the one the row already holds (a closed topic stays on the row
   that carries it, §497). */
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
  const cur = a.topicId ? L.topics.find((x) => x.id === a.topicId) : null;
  const opts = L.topics.filter((t) => !t.closed || t.id === a.topicId);
  const topic = live
    ? '<p class="lab">Topic</p><select class="tsel" data-act="topic" aria-label="Topic">' +
      '<option value=""' + (cur ? "" : " selected") + ">No topic</option>" +
      opts.map((t) => '<option value="' + esc(t.id) + '"' + (t.id === a.topicId ? " selected" : "") + ">" + esc(t.name) + (t.closed ? " (closed)" : "") + "</option>").join("") +
      "</select>"
    : '<p class="lab">Topic</p><div class="ro">' + (cur ? esc(cur.name) : "&mdash;") + "</div>";
  const left = live
    ? topic + '<p class="lab">Notes</p><textarea data-act="notes" aria-label="Notes" maxlength="5000">' + esc(a.description) + "</textarea>" +
      '<div class="hint">Saved when you leave the box.</div>' +
      '<div class="acts"><button type="button" class="danger" data-act="delete-ask">Delete</button>' +
      '<span class="sure" hidden>Delete this action? <button type="button" class="go danger" data-act="delete">Yes, delete it</button>' +
      '<button type="button" class="go" data-act="delete-no">Keep it</button></span></div>'
    : topic + '<p class="lab">Notes</p><div class="ro">' + (a.description ? esc(a.description).replace(/\n/g, "<br>") : "&mdash;") + "</div>";
  return '<div class="open" data-id="' + esc(a.id) + '"><div>' + left + "</div>" +
    '<div><p class="lab">History</p><ul class="hist">' + hist + "</ul></div></div>";
}

/* HOW THE ROWS ARE GROUPED: by owner in the register's own order (decision
   6), by status in the three words' own order, by due day soonest first
   with the undated last, or not at all. A group is made from the rows it
   holds, so a heading never stands over nothing. */
type Grp = { key: string; label: string | null; rows: Action[] };
function grouped(shown: Action[], L: Loaded, group: Group, today: string, dates: Format): Grp[] {
  const by = new Map<string, Action[]>();
  /* as weeks, a due-date grouping is by the WEEK — every day of one week
     under one heading, keyed by its Thursday so the order is still by day */
  const dueKey = (a: Action) => !a.due ? "none" : dates === "weeks" ? thursdayOf(a.due) : a.due;
  const keyOf = (a: Action) => group === "owner" ? a.ownerKey : group === "status" ? a.status : group === "due" ? dueKey(a) : group === "topic" ? (a.topicId || "none") : "all";
  for (const a of shown) { const k = keyOf(a); if (!by.has(k)) by.set(k, []); by.get(k)!.push(a); }
  let keys = Array.from(by.keys());
  if (group === "owner") {
    const order = new Map<string, number>(L.office.map((o, i) => [o.key, i]));
    keys.sort((x, y) => (order.get(x) ?? 999) - (order.get(y) ?? 999) || (L.names.get(x) || x).localeCompare(L.names.get(y) || y));
  } else if (group === "status") {
    keys.sort((x, y) => (STATUSES as readonly string[]).indexOf(x) - (STATUSES as readonly string[]).indexOf(y));
  } else if (group === "topic") {
    const order = new Map<string, number>(L.topics.map((t, i) => [t.id, i]));
    keys.sort((x, y) => (order.get(x) ?? 999) - (order.get(y) ?? 999));
  } else if (group === "due") {
    keys.sort((x, y) => (x === "none" ? 1 : 0) - (y === "none" ? 1 : 0) || x.localeCompare(y));
  }
  const label = (k: string) => group === "owner" ? (L.names.get(k) || k)
    : group === "status" ? STATUS_WORD[k as keyof typeof STATUS_WORD]
    : group === "topic" ? (k === "none" ? "No topic" : (L.topics.find((t) => t.id === k)?.name || k))
    : group === "due" ? (k === "none" ? "No date" : dates === "weeks" ? weekWord(k, today) + " · " + weekOptions(k, 1)[0].days : readableDay(k, today))
    : null;
  return keys.map((k) => ({ key: k, label: label(k), rows: by.get(k)! }));
}

export type ListOut = { body: string; count: string; open: string | null };

/* THE MASTHEAD (§497): the week, the name, the four counts and the views on
   the client's own colour. It is part of what a press redraws, so the counts
   follow a tick without a reload. */
function masthead(p: PageArgs, today: string, all: Action[], sum: { open: number; late: number; dueWeek: number; doneWeek: number } | null): string {
  const here = clientHref(p.slug, "tracker", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;
  const viewHref = (v: View) => here + "?view=" + v + (q ? "&q=" + encodeURIComponent(q) : "");
  const thu = thursdayOf(today);
  const strip = !sum ? "" : '<div class="strip">' +
    '<div class="tile"><b>' + sum.open + "</b><span>Open</span></div>" +
    '<div class="tile' + (sum.late ? " late" : "") + '"><b>' + sum.late + "</b><span>Late</span></div>" +
    /* NO COUNT ON THE CARD (§356.16); the break puts back the tail it
       removed, counted the way the summary counted it (§94.5, §276). */
    '<div class="tile"><b>' + sum.dueWeek + "</b><span>Due" + (() => {
      if (brk() !== "card-count") return "";
      const w = weekOf(today);
      const n = all.filter((a) => a.status === "not_started" && !!a.due && a.due >= w.from && a.due <= w.to).length;
      return n ? " &middot; " + n + " not started" : "";
    })() + "</span></div>" +
    '<div class="tile"><b>' + sum.doneWeek + "</b><span>Done this week</span></div></div>";
  /* the two settings behind "Group by" on the far right (§356.14, §497):
     each choice names its value, the one in force marked; the script writes
     a cookie and reads the list again */
  const settings = '<span class="dots"><button type="button" data-act="settings" aria-haspopup="menu" aria-expanded="false" title="Settings">' +
    'Group by <b>' + esc(GROUP_WORD[p.ask.group]) + "</b>" + CARET + DOTS3 + "</button>" +
    '<span class="setmenu" role="menu" hidden>' +
    '<span class="col"><span class="lab">Group by</span>' +
    GROUPS.map((g) => '<button type="button" role="menuitemradio" data-act="set-group" data-value="' + g + '"' + (g === p.ask.group ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + ">" + esc(GROUP_WORD[g]) + "</button>").join("") + "</span>" +
    '<span class="col"><span class="lab">Dates as</span>' +
    FORMATS.map((f) => '<button type="button" role="menuitemradio" data-act="set-dates" data-value="' + f + '"' + (f === p.ask.dates ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + ">" + esc(FORMAT_WORD[f]) + "</button>").join("") + "</span>" +
    "</span></span>";
  return '<header class="mast"><div class="mrow"><div class="mt">' +
    '<div class="wkof">' + esc(weekWord(thu, today)) + " &middot; " + esc(weekLabel(weekOf(today), today)) + "</div>" +
    '<h2 class="pt">' + esc(MODULE_DEF.tracker.label) + "</h2></div>" + strip + "</div>" +
    '<nav class="cats" aria-label="Views">' +
    VIEWS.map((v) => '<a href="' + esc(viewHref(v)) + '"' + (v === view ? ' aria-current="true"' : "") + ">" + esc(VIEW_WORD[v]) + "</a>").join("") +
    '<span class="sp"></span>' + settings + "</nav></header>";
}

/* A TOPIC'S OWN MENU, on its heading: rename, close or reopen, delete behind
   a question. Anybody in the office (§497, Islam's third answer). */
function topicMenu(t: Topic): string {
  return '<span class="tdots"><button type="button" data-act="topic-menu" data-topic="' + esc(t.id) + '" aria-haspopup="menu" aria-expanded="false" aria-label="Topic options" title="Topic options">' + DOTS3 + "</button>" +
    '<span class="tmenu" role="menu" hidden>' +
    '<button type="button" role="menuitem" data-act="topic-rename" data-topic="' + esc(t.id) + '">Rename</button>' +
    (t.closed
      ? '<button type="button" role="menuitem" data-act="topic-reopen" data-topic="' + esc(t.id) + '">Reopen</button>'
      : '<button type="button" role="menuitem" data-act="topic-close" data-topic="' + esc(t.id) + '">Close the topic</button>') +
    '<button type="button" role="menuitem" class="danger" data-act="topic-delete-ask" data-topic="' + esc(t.id) + '">Delete</button>' +
    '<span class="sure" hidden>Delete the topic? Its actions stay, with no topic. ' +
    '<button type="button" class="go danger" data-act="topic-delete" data-topic="' + esc(t.id) + '">Yes, delete it</button>' +
    '<button type="button" class="go" data-act="topic-delete-no">Keep it</button></span>' +
    "</span></span>";
}

/* THE LIST, THE MASTHEAD AND THE COUNT — the part of the page a press
   redraws. trackerDocument() wraps it once; the api answers a press with it
   again. */
export function listBody(L: Loaded, p: PageArgs, today: string): ListOut {
  const here = clientHref(p.slug, "tracker", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;
  const viewHref = (v: View) => here + "?view=" + v + (q ? "&q=" + encodeURIComponent(q) : "");
  const all = L.actions;
  const sum = summary(all, today);
  const shown = all.filter((a) => inView(a, view, p.who, today))
    .filter((a) => !q || a.title.toLowerCase().includes(q.toLowerCase()));
  const count = plural(shown.length, "action", "actions") + (view === "week" ? " on this week" : "");
  const me = p.who.personKey;
  const meShort = me ? L.short.get(me) || L.names.get(me) || me : "";
  const dates = p.ask.dates;
  const group = p.ask.group;

  /* THE SECTIONS (§497): a numbered heading, its open and late counts, its
     rows with the done ones folded under "N done ›", and — for a topic — how
     much of it is done, a thin bar, its menu and "+ Add to <topic>". A topic
     with no rows in this view is not drawn: a heading never stands over
     nothing. Grouped by nothing, one section and no heading. */
  const groups = grouped(shown, L, group, today, dates);
  let ix = 0;
  const secs = groups.map((g) => {
    const open = g.rows.filter((a) => a.status !== "done");
    const late = open.filter((a) => !!a.due && isLate(a.due, today)).length;
    const done = g.rows.length - open.length;
    const rows = g.rows.map((a) => row(a, L, p.who, today, dates, a.id === L.open, group) + (a.id === L.open ? openPanel(a, L, p.who, today) : "")).join("");
    const t = group === "topic" && g.key !== "none" ? L.topics.find((x) => x.id === g.key) || null : null;
    const quiet = group === "topic" && g.key === "none";
    let head = "";
    if (g.label != null) {
      const all4 = t ? all.filter((a) => a.topicId === t.id) : [];
      const allDone = all4.filter((a) => a.status === "done").length;
      head = '<div class="grp sh' + (quiet ? " quiet" : "") + '" data-key="' + esc(g.key) + '">' +
        '<span class="ix">' + (quiet ? "&mdash;" : String(++ix).padStart(2, "0")) + "</span>" +
        "<h3>" + esc(g.label) + "</h3>" +
        '<span class="meta">' + open.length + " open" + (late ? ' &middot; <span class="bad">' + late + " late</span>" : "") + "</span>" +
        '<span class="end">' + (t ? (t.closed ? '<span class="shut">Closed</span>' : "") + allDone + " of " + all4.length + " done" + topicMenu(t) : "") + "</span></div>" +
        (t ? '<div class="meter"><i style="width:' + (all4.length ? Math.round(allDone * 100 / all4.length) : 0) + '%"></i></div>' : "");
    }
    const foot = (done ? '<button type="button" data-act="show-done">' + done + " done &rsaquo;</button>" : "") +
      (t && !t.closed && me ? '<button type="button" data-act="add-to-topic" data-topic="' + esc(t.id) + '" data-name="' + esc(t.name) + '"><b>+</b> Add to ' + esc(t.name) + "</button>" : "");
    return '<div class="sec" data-key="' + esc(g.key) + '">' + head + rows + (foot ? '<div class="foot">' + foot + "</div>" : "") + "</div>";
  }).join("");

  /* THE NEXT ACTION is written at the top, under a gold rule (§497). It takes
     everything — the topic, the week (this week's Thursday until another is
     picked), the owner (you), and a note behind the arrow (§356.15) — and the
     details arrive with the first letter (§356.16). Nothing is posted until
     Enter; the picks ride on the line as data- attributes. Somebody the
     register has not placed yet (§313.32) is told so (§61). */
  const thu = thursdayOf(today);
  const openTopics = L.topics.filter((t) => !t.closed);
  const tpk = '<span class="tpk" role="button" tabindex="0" data-act="tpk" aria-haspopup="listbox" aria-expanded="false" title="Which topic"><span class="tw">Topic</span>' +
    '<span class="topics" role="listbox" aria-label="Topic" hidden>' +
    openTopics.map((t) => '<button type="button" role="option" data-act="pick-topic" data-topic="' + esc(t.id) + '">' + esc(t.name) + "</button>").join("") +
    '<button type="button" role="option" data-act="pick-topic" data-topic="">No topic</button>' +
    '<input class="tnew" placeholder="New topic…" aria-label="New topic" maxlength="120"></span></span>';
  const addrow = me
    ? '<div class="addrow" data-due="' + thu + '" data-owner="' + esc(me) + '"><span class="plus">' + PEN + "</span>" +
      '<div class="tn"><input id="add" class="new" data-act="add" placeholder="' + (all.length ? "Write the next action and press Enter" : "Write the first action for " + esc(p.tenantName) + " and press Enter") + '" aria-label="New action" maxlength="200">' +
      '<input id="addnote" class="nt" placeholder="A note, if the line needs one" aria-label="Note for the new action" maxlength="5000"' + (brk() === "note-standing" ? "" : " hidden") + "></div>" +
      tpk +
      (dates === "weeks"
        ? '<span class="when pick" role="button" tabindex="0" data-act="due" data-due="' + thu + '" aria-haspopup="listbox" aria-expanded="false" title="Which week"><span class="wk">' + weekWord(thu, today) + "</span>" + weeksList(today, thu) + "</span>"
        : '<button class="when pick" type="button" data-act="due" data-due="' + thu + '" title="Which day">' + esc(readableDay(thu, today)) + "</button>") +
      '<span class="who pick" role="button" tabindex="0" data-act="who" aria-haspopup="listbox" aria-expanded="false" title="Whose it is"><span class="wn">' + esc(meShort) + "</span>" + teamList(L, me) + "</span>" +
      '<span class="st">Not started</span>' +
      '<button class="more" type="button" data-act="add-note" aria-expanded="false" aria-controls="addnote" aria-label="Add a note" title="Add a note">' + ARROW + "</button></div>"
    : '<div class="addhint">You are not on this client\'s register yet, so nothing can be owned by you here; open the client once more and it will be.</div>';
  const find = '<form class="find" role="search" method="get" action="' + esc(here) + '">' + LENS +
    '<input type="hidden" name="view" value="' + view + '">' +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search" aria-label="Search actions">' +
    '<button class="go" type="submit">Search</button>' +
    '<span class="cnt" id="count">' + esc(count) + "</span></form>";
  const tools = '<div class="tools' + (all.length ? "" : " solo") + '"><div class="write">' + addrow + "</div>" + (all.length ? find : "") + "</div>";
  const counted = all.length ? '<div class="counted">' + esc(count) + "</div>" : "";
  const none = !all.length
    ? '<div class="none"><b>Nothing on the list for ' + esc(p.tenantName) + ' yet.</b>The first line lands under you, due this week; pick another week on the line before Enter, or on the row after.</div>'
    : !shown.length
      ? '<div class="none"><b>Nothing ' + (q ? "matches" : "here") + '.</b>' + (q ? "Try another word, or " : "Add one on the line above, or ") + '<a href="' + esc(viewHref("all")) + '">see all of them</a>.</div>'
      : "";
  return { body: masthead(p, today, all, sum) + tools + counted + '<div class="list">' + secs + "</div>" + none, count, open: L.open };
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
  const bar = await trackerBar(p.tenantId);
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;
  const attrs: BodyAttrs = { api: clientHref(p.slug, "tracker", "api"), list: clientHref(p.slug, "tracker", "list"), view, q, group: p.ask.group, dates: p.ask.dates };

  /* A LIST THAT COULD NOT BE READ IS NOT AN EMPTY ONE (§35, §93): the
     masthead without its counts, and the sentence. */
  let L: Loaded | null = null;
  try {
    L = await withTenant(p.tenantId, (c) => load(c, p.ask.open));
  } catch (e) {
    console.error("tracker: reading " + p.slug + "'s list:", (e as Error).message);
  }
  if (!L) {
    const body = '<main class="pg">' + masthead(p, today, [], null) +
      '<p class="unread">The list could not be read just now. Nothing has been lost &mdash; try again in a moment.</p></main>\n';
    return skeleton(p.slug, p.tenantName, topOf(p), bar, null, body);
  }
  const out = listBody(L, p, today);
  const body = '<main class="pg"><p class="said" id="said" role="alert" aria-live="polite"></p>' +
    '<div id="body">' + out.body + "</div></main>\n";
  return skeleton(p.slug, p.tenantName, topOf(p), bar, attrs, body);
}
