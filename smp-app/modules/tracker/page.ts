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
import { CARD_LOOK_CSS, bandHtml, cardHead } from "../../lib/card-look.ts";
import { clientHref, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import {
  type Action, type Who, type View, type Group, type Format, type Person, type Event, VIEWS, VIEW_WORD, STATUSES, STATUS_WORD, GROUPS, GROUP_WORD,
  FORMATS, FORMAT_WORD, todayIn, weekOf, weekLabel, readableDay, isLate, carriedWeeks, lateWord, inView, summary, mayChange,
  thursdayOf, weekWord, sameWeek, weekOptions, weekDays, weekInMonth,
  type CheckWeek, CHECK_WEEKS, CHECK_WORD, checkWeek, checkWeeks, mayCarry, nextWeekDay, topicShown,
  officeRows, namesOf, shortNames, listActions, eventsOf, listTopics, type Topic,
  type Progress, progressOf, latestProgress, mayChangeProgress, PROGRESS_MAX, addDays, oneLine,
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
  if (b === "week-auto") return ".row{grid-template-columns:20px minmax(0,1fr) 132px auto 64px 128px 26px}"; /* §503 put back: the week sized by its words */
  if (b === "wide-names") return ".team{min-width:140px}.team button{padding:7px 9px;font-size:14px;gap:9px}";
  if (b === "narrow-rename") return ".tn2.editing .t{flex:0 1 auto}";                       /* §565 put back: the box sized by an input's default */
  if (b === "bar-scrolls") return ".tb{position:relative}.pin{top:0}";                        /* §566 put back: the top bar scrolls away */
  if (b === "no-busy-mark") return ".busy{opacity:1!important;cursor:auto!important}.busy [data-act]{pointer-events:auto!important}"; /* §668 put back: a press shows nothing until the answer */
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
/* THE BAND STAYS PUT (§565, design-mockups/internal-tracker/2026-10-21_frozen-band.html).
   Islam: *"make this part freezed on scrolling down"* — the masthead, the add
   line, the search and the count ride together at the top while the list
   scrolls under them. It paints the page's ground behind itself, the .pg's
   own 20px above it included, so a row never shows through the band's
   rounded corners or the gap over the add line; flow-root keeps the last
   line's margin inside that ground rather than letting it collapse out
   under the rows. The 20px is taken back only while no refusal is showing
   above it (#said), or the band's ground would paint over that sentence's
   foot; with one showing the band pins flush to the top. On a phone, or a
   window too short to spare it, it scrolls away as before: pinned, it would
   cover most of the screen. */
/* ...AND THE PLATFORM'S WHITE TOP BAR PINS ABOVE IT (§566). Islam: *"the
   freeze starts by the top bar and ends by the text box to add an action"*.
   On this page only — the bar is every module's (lib/topbar.ts) and nobody
   asked for the others. The band pins at the bar's foot, which the script
   MEASURES into --tbh rather than this file assuming 41px (a sticky offset
   written as a number is right until the thing above it changes height, the
   smeared header the platform has already paid for); 41px is only the first
   paint's guess. */
.tb{position:sticky;top:0}
.pin{position:sticky;top:var(--tbh,41px);z-index:20;display:flow-root;background:var(--ground)}
.said:empty+#body>.pin{margin-top:-20px;padding-top:20px}
@media (max-width:760px),(max-height:600px){.pin{position:static}.tb{position:relative}}
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
/* TOPICS JOINS THE TWO SETTINGS (§533), on a row of its own under them
   because it is not a third way of reading the list — it is the list of
   topics itself. So the menu stacks: the two columns, then the way in. */
.setmenu{display:grid}
.setmenu .two{display:flex;gap:4px}
.setmenu .sep{display:block;border-top:1px solid var(--line);margin:2px 3px 0;padding-top:3px}
.setmenu .sep button{width:100%}
.setmenu .sep svg{width:14px;height:14px;color:var(--ink-3);flex:none}
.setmenu .sep .arr{margin-left:auto;color:var(--ink-3);display:grid}
.setmenu .sep .arr svg{width:12px;height:12px}
/* THE TOPICS PANEL (§533): every topic on this client, open and closed, and
   the ones with no actions on them — which the page could not reach at all
   before, because a heading is only drawn over rows that are in view. */
.tpanel{position:absolute;top:32px;right:0;z-index:9;width:380px;max-width:min(380px,calc(var(--winw) - 48px));background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(20,28,43,.2);text-align:left}
.tpanel .ph{display:flex;align-items:center;gap:8px;padding:9px 12px 8px;border-bottom:1px solid var(--line)}
.tpanel .ph .lab{font:600 10.5px/1.6 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.tpanel .ph .hint{margin-left:auto;font:400 12px/1.4 var(--font);color:var(--ink-3)}
.tlist{display:block;max-height:304px;overflow-y:auto}
.trow{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto 24px;gap:9px;align-items:center;padding:4px 8px 4px 12px;border-bottom:1px solid var(--line-2)}
.trow:last-child{border-bottom:0}
.trow:hover{background:var(--ground)}
.trow .nm{min-width:0;display:flex;align-items:center;gap:7px;font:400 14.5px/1.35 var(--font);color:var(--ink);background:none;border:0;border-radius:6px;padding:4px 5px;margin-left:-5px;cursor:text;text-align:left}
.trow .nm .who2{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trow .nm svg{width:13px;height:13px;color:var(--gold);opacity:0;flex:none}
.trow:hover .nm svg,.trow .nm:focus-visible svg{opacity:1}
.trow .nm:focus-visible{outline:none;background:var(--surface-2)}
.trow .shut{font:600 9.5px/1 var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);border:1px solid var(--line);border-radius:999px;padding:3px 6px;flex:none}
.trow .ct{font:500 12px/1 var(--font);color:var(--ink-3);font-variant-numeric:tabular-nums;white-space:nowrap}
.trow .ct.nil{font-style:italic}
.trow .tdots>button{background:none;border:0;border-radius:6px;color:var(--ink-3);padding:3px 5px;cursor:pointer;display:grid;place-items:center}
.trow .tdots{position:relative}
.trow .tdots>button:hover,.trow .tdots>button.on{background:var(--surface-2);color:var(--ink)}
.trow .tdots svg{width:16px;height:16px}
.trow .tmenu{top:26px;z-index:11}
.trow input{display:block;width:100%;min-width:0;font:400 14.5px/1.3 var(--font);color:var(--ink);background:var(--surface);border:1.5px solid var(--gold);border-radius:7px;padding:4px 8px;outline:none}
/* While a name is being typed over, the line is the box and nothing else:
   the count and the ⋯ would only be in the way of the one thing being done. */
.trow.edit{background:var(--gold-bg)}
.trow.edit input{grid-column:1/-1}
.trow.edit .ct,.trow.edit .tdots{display:none}
.tpanel .tadd{display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:7px 12px}
.tpanel .tadd .pl{color:var(--gold);font-weight:600}
.tpanel .tadd input{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font:400 14px/1.5 var(--font);padding:2px 0;outline:none}
.tpanel .tadd input::placeholder{color:var(--ink-3)}
.tpanel .tnone{padding:14px 12px;font-size:13.5px;color:var(--ink-3)}
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
/* THE CHECK COUNTS TOPICS, NOT ACTIONS (§532), and says how far through the
   meeting you are: the gold is what is still owed to next week. */
.counted.ck{text-align:left;margin:4px 0 4px;font:600 10.5px/1.6 var(--mono);letter-spacing:.09em;text-transform:uppercase}
.counted.ck .left{color:var(--gold)}
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
/* ...BUT NEVER ON THE WEEKLY CHECK (§532), where a finished action is not
   something to fold away: last week's card holds nothing else, so this rule
   emptied it and left a card standing over nothing — the very thing §497
   refused for headings, in a box. A done row ticked during the meeting also
   has to stay where the hand left it, under this week. Caught by drawing the
   real page and looking at it, not by reading this file. */
.sec:not(.showdone) .row.done:not(.fresh):not(.on):not(.chk){display:none}
/* the row: tick · name · when · owner · status · the arrow */
.row{display:grid;grid-template-columns:20px minmax(0,1fr) 132px 84px 64px 128px 26px;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line-2)}
.row .t{min-width:0;font-size:15px;line-height:1.35}
.row .t[data-rename]{cursor:text}
.row .tn2{min-width:0;display:flex;align-items:baseline;flex-wrap:wrap;column-gap:8px}
.tn2.editing{align-items:center}
/* THE TOPIC'S OWN COLUMN (§503), beside the week: a quiet rounded tag with a
   gold dot, or "+ Add a topic" on a row that has none — outlined when the row
   is under the pointer, so the empty column says what it is for without
   shouting on every row. The press opens the add line's own topic list. */
.tcwrap{position:relative;justify-self:end;max-width:132px;min-width:0;cursor:pointer;border-radius:999px;outline:none}
.tc{display:inline-flex;align-items:center;gap:6px;max-width:132px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 12.5px/1 var(--font);color:var(--ink-2);background:var(--surface-2);border:1px solid transparent;border-radius:999px;padding:5px 10px}
.tc .tw{overflow:hidden;text-overflow:ellipsis}
.tc::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);flex:none}
.tcwrap:hover .tc,.tcwrap.on .tc,.tcwrap:focus-visible .tc{border-color:var(--line)}
.tc.add{background:transparent;color:var(--ink-3);border:1px dashed transparent}
.tc.add::before{display:none}
.row:hover .tc.add,.tcwrap.on .tc.add,.tcwrap:focus-visible .tc.add{border-color:var(--line);color:var(--ink)}
.tcwrap.ro{cursor:default}.tcwrap.ro .tc{border-color:transparent}
.tcwrap .topics{top:30px;right:0}
/* THE RENAME BOX TAKES THE NAME'S WHOLE SPACE (§565). Islam: *"give the text
   space we already have space to write in"*. The name is a flex item sized
   by its words, so the box inside it was sized by an input's default — about
   twenty letters, the rest of a long name scrolled out of sight with the
   whole column empty beside it. While it is a box, the name grows to the
   topic's column. */
.tn2.editing .t{flex:1 1 auto}
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
/* THE DESCRIPTION FITS WHAT IS WRITTEN (§657, Islam: "fit the content not
   with a scrolling"): the box grows with its text and never scrolls inside
   itself; the script sizes it where the browser cannot (field-sizing). */
.open textarea.desc{min-height:44px;resize:none;overflow:hidden;field-sizing:content}
/* PROGRESS (§657): the box with Enter, and the entries under it — newest
   first, the week in front, who wrote it, Edit and Delete for the writer.
   The entries scroll inside their own box once there are many. */
.pbox{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;padding:7px 11px;background:var(--surface)}
.pbox:focus-within{border-color:var(--gold)}
.pbox input{flex:1;min-width:0;border:0;background:transparent;outline:none;font:400 14px/1.5 var(--font);padding:0;color:var(--ink)}
.pbox input::placeholder{color:var(--ink-3)}
.pbox .ent{font:600 10px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);border:1px solid var(--line);border-radius:5px;padding:4px 6px;white-space:nowrap}
.prog{list-style:none;margin:8px 0 0;padding:0 8px 0 0;max-height:236px;overflow-y:auto;scrollbar-width:thin;scrollbar-gutter:stable}
.prog li{display:grid;grid-template-columns:72px minmax(0,1fr);gap:10px;padding:7px 0;border-bottom:1px solid var(--line-2);font-size:13.5px;line-height:1.45;color:var(--ink)}
.prog li:last-child{border-bottom:0}
.prog .wk{font:600 11px/1.6 var(--font);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);white-space:nowrap;padding-top:2px;cursor:default}
.prog .wk.now{color:var(--gold)}
.prog .pb{min-width:0}
.prog .ptxt{white-space:pre-wrap;overflow-wrap:anywhere}
.prog .by{font:600 12px/1.4 var(--font);color:var(--ink-2);margin-top:1px;display:flex;flex-wrap:wrap;gap:0 10px;align-items:center}
.prog .by .ed{font-weight:400;color:var(--ink-3);font-style:italic}
.prog .by button{background:none;border:0;padding:0;font:400 12px/1.4 var(--font);color:var(--ink-3);cursor:pointer;text-decoration:underline}
.prog .by button.danger{color:var(--bad)}
.prog .by .sure{display:flex;gap:8px;align-items:center;font-weight:400;color:var(--ink-2)}
.prog .by .sure .go{border:1px solid var(--line);border-radius:6px;padding:2px 8px;text-decoration:none;color:var(--ink)}
.prog .by .sure .go.danger{color:var(--bad);border-color:var(--bad)}
.prog textarea{border:1px solid var(--gold);border-radius:7px;background:var(--surface);color:var(--ink);padding:5px 9px;font:400 13.5px/1.45 var(--font);width:100%;resize:none;overflow:hidden;display:block;field-sizing:content}
.pnone{font-size:13px;color:var(--ink-3);margin-top:8px}
/* the automatic history, behind one link */
.histlink{display:inline-flex;align-items:center;gap:5px;margin-top:12px;background:none;border:0;padding:0;font:500 12.5px/1.4 var(--font);color:var(--ink-3);cursor:pointer}
.histlink svg{width:10px;height:10px}
.histlink.on svg{transform:rotate(90deg)}
.hist{margin-top:6px}
/* the latest entry under a row's name, one line, cut at the edge */
.last{font:400 12.5px/1.4 var(--font);color:var(--ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}
.last b{font-weight:600;color:var(--ink-2)}
/* on the Weekly check, the box under every open row of this week */
.pline{display:grid;grid-template-columns:20px minmax(0,1fr);gap:12px;padding:0 14px 10px;border-bottom:1px solid var(--line-soft)}
.pline .pbox{grid-column:2;border-color:var(--line-2);background:var(--ground)}
.row.chk:has(+ .pline){border-bottom:0}
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
/* A PRESS SHOWS AT ONCE (§668, rule 1d): the row under the hand dims — the
   same .55 a tick nobody may press already wears — and takes no second press
   until the server's answer redraws it. The script marks it at the press and
   the swap carries the mark away; a refusal takes it off by hand. */
.row.busy,.open.busy,.pline.busy,.trow.busy,.sh.busy{opacity:.55;cursor:progress}
.busy [data-act]{pointer-events:none}
.said{margin:0 0 12px;padding:9px 13px;border:1px solid var(--bad);border-radius:8px;background:var(--bad-bg);color:var(--bad);font-size:13.5px}
.said:empty{display:none}
.unread{margin:0 0 12px;padding:9px 13px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink-2);font-size:13.5px}
/* ══ THE WEEKLY CHECK (§532) ═══════════════════════════════════════════
   EACH WEEK INSIDE A TOPIC IS ITS OWN CARD — option D of the four put to
   Islam, chosen over the band this file would otherwise have drawn. Nothing
   can be mistaken for belonging to the wrong week, and this week's is the
   only one lit: last week plain, this week ringed in gold, next week a
   dashed outline with no fill, which says "not written yet" as a shape
   rather than as a second word. Measured before it was built: four topics
   stand 1258px, about one and a half laptop screens. */
.blk{border:1px solid var(--line);border-radius:10px;background:var(--surface);margin:10px 0 0}
.blk.now{border-color:var(--gold);box-shadow:0 2px 10px rgba(156,93,8,.10)}
.blk.next{border-style:dashed;background:transparent}
.wkh{display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--surface-2);border-bottom:1px solid var(--line);border-radius:9px 9px 0 0;font:600 11px/1 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.wkh .days{margin-left:auto;font:500 12px/1 var(--font);letter-spacing:0;text-transform:none;color:var(--ink-3)}
.blk.now .wkh{background:var(--gold-bg);border-bottom-color:var(--gold);color:var(--gold)}
.blk.now .wkh .days{color:var(--gold)}
.blk.next .wkh{background:transparent;border-bottom-style:dashed;color:var(--gold)}
/* The row sheds two columns here: the heading says the topic and the card
   says the week (§87), so what is left is the tick, the name, how late it
   is, the owner, the status, the carry and the arrow. */
.row.chk{grid-template-columns:20px minmax(0,1fr) 84px 64px 128px 140px 26px;padding:9px 14px}
.row.chk:last-child{border-bottom:0}
.blk .row.on{background:var(--surface-2)}
.blk .open{padding-left:46px;padding-right:14px}
.carry{display:inline-flex;align-items:center;gap:6px;font:500 12.5px/1 var(--font);color:var(--gold);background:none;border:1px solid transparent;border-radius:7px;padding:5px 8px;white-space:nowrap;cursor:pointer;justify-self:start}
.carry svg{width:13px;height:13px;flex:none}
.carry:hover,.carry:focus-visible{border-color:var(--gold);background:var(--gold-bg);outline:none}
.carry.off{visibility:hidden}
/* THE WRITE LINE SITS IN THE TOPIC IT IS FOR, and it is the SAME line the
   page writes at the top — one renderer, one behaviour (§53.5) — with its
   topic fixed by the card it stands in and its week already Next week. */
.addrow.chk{grid-template-columns:20px minmax(0,1fr) auto auto auto 0 26px;padding:7px 14px;gap:10px}
.addrow.chk .tpk,.addrow.chk .when,.addrow.chk .who,.addrow.chk .more{visibility:visible}
.addrow.chk .ent{font:600 10px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);border:1px solid var(--line);border-radius:5px;padding:4px 6px;white-space:nowrap}
.blk .quiet{padding:10px 14px;font:400 13.5px/1.4 var(--font);color:var(--ink-3);font-style:italic}
.sec .asleep{font:400 13.5px/1.4 var(--font);color:var(--ink-3);font-style:italic;padding:10px 0 0}
@media (max-width:760px){.strip{gap:14px}.open{grid-template-columns:1fr;padding-left:4px}
  .pline{grid-template-columns:1fr}.pline .pbox{grid-column:1}
  .row.chk{grid-template-columns:20px minmax(0,1fr) auto 26px;grid-template-areas:"tick t t more" ". when st more" ". carry carry carry"}
  .row.chk .tick{grid-area:tick}.row.chk .tn2{grid-area:t}.row.chk .st{grid-area:st}.row.chk .when{grid-area:when}.row.chk .who{display:none}.row.chk .carry{grid-area:carry}.row.chk .more{grid-area:more}
  .addrow.chk{grid-template-columns:20px minmax(0,1fr) 26px}.addrow.chk .tpk,.addrow.chk .when,.addrow.chk .who,.addrow.chk .ent{display:none}
  .tpanel{width:min(380px,calc(var(--winw) - 32px))}
  .addrow{grid-template-columns:20px minmax(0,1fr) 26px}.addrow .tpk,.addrow .when,.addrow .who,.addrow .st{display:none}
  .row{grid-template-columns:20px minmax(0,1fr) auto auto 26px;grid-template-areas:"tick t t st more" ". when tcol who more"}.row .tick{grid-area:tick}.row .tn2{grid-area:t}.row .tcol{grid-area:tcol;justify-self:start}.row .st{grid-area:st}.row .when{grid-area:when}.row .who{grid-area:who}.row .more{grid-area:more}
  .team,.weeks,.topics{right:auto;left:0}}
`;


/* MY TASKS' LOOK, THE TRACKER'S OWN PART (§646). The band and the card are
   lib/card-look.ts; what is here is how the Tracker's furniture sits in the
   card. The card is two boxes that read as one: its top (the header and the
   add line) rides in the pinned wrapper with the band, so the filters freeze
   with it (Islam: "yes headers filter stay fixed"), and its body is the
   list. Neither clips what overflows it, because the week, the owner, the
   topic and the settings open their lists over the rows below. */
const LOOK = `
.card.ctop{margin:0;border-radius:12px 12px 0 0;box-shadow:none;overflow:visible}
.card.ctop.solo{border-radius:12px;margin:0 0 16px}
.card.cbot{border-top:0;border-radius:0 0 12px 12px;overflow:visible;padding-bottom:6px;margin:0 0 16px}
.ctop .chd .dots{margin:0;align-self:center}
.ctop .chd .dots>button{color:var(--ink-3);font:400 12px/1 var(--font);padding:4px 8px;border:1px solid var(--line);background:var(--surface)}
.ctop .chd .dots>button b{color:var(--ink);font-weight:600}
.ctop .chd .dots>button:hover,.ctop .chd .dots>button.on,.ctop .chd .dots>button:focus-visible{background:var(--surface-2);color:var(--ink)}
.ctop .tools{margin:0;padding:4px 14px;border-top:0;gap:0}
.ctop .write{border-bottom:0}
.ctop .tools+.counted,.ctop .counted.ck{margin:0;padding:8px 14px 4px;text-align:left}
.ctop .unread{margin:0;border:0;border-radius:0}
.pin .card.ctop{border-bottom:1.5px solid var(--gold)}
.pin .card.ctop.solo{border-bottom:1px solid var(--line)}
.cbot .list .row{padding:8px 14px;border-bottom-color:var(--line-soft)}
.cbot .sec .row:nth-child(odd of .row:not(.done)),.cbot .sec.showdone .row:nth-child(odd of .row){background:var(--zebra)}
.cbot .sec .row.on{background:var(--surface)}
.cbot .open{padding-left:46px;padding-right:14px}
.cbot .foot{padding:8px 14px 10px 46px}
.cbot .sh .end{font:600 11.5px/1.4 var(--font)}
.cbot .sh h3 input{font:600 14px/1.2 var(--font);letter-spacing:0;text-transform:none}
.cbot .sh.quiet h3{font-style:italic}
.cbot .meter{margin:0 14px -2px}
.cbot .asleep{padding:10px 14px 0}
.cbot .blk{margin:10px 14px 0}
.cbot .sec:has(.blk){padding-bottom:12px}
.cbot .blk .row.chk{padding:9px 14px}
.cbot .none{padding:16px 14px 12px}
@media (max-width:760px){.cbot .open{padding-left:14px}.cbot .foot{padding-left:14px}}
`;

/* What the script needs to know rides on <body>: the two addresses it talks
   to, and the view, the search and the grouping the page was drawn with, so
   a press asks the server for the same list it is looking at. */
const topOf = (p: PageArgs): TopBar => ({ slug: p.slug, tenantName: p.tenantName, module: "tracker", have: p.have, consultant: !!p.consultant });

/* §646 REVERSES §499 — THE TRACKER'S BAND FOLLOWS THE CLIENT'S COLOUR, as
   Meeting Notes' and Insights' do. Islam, asked whether the Tracker should
   stay Forefront's navy as §499 had it: *"Tracker follows client"*. §499's
   reasoning (the office's own list, Forefront's page about a client) is kept
   in the record; the answer changed. barVars stays the one reader of how
   words sit on a band. The break puts §499's fixed navy back so the check
   can prove the client's colour is read. */
async function trackerBar(tenantId: string): Promise<string> { return brk() === "fixed-bar" ? BAR_DEFAULT : barFor(tenantId); }

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
    TOPBAR_SCRIPT_TAG + "<style>" + TOPBAR_CSS + themedCss(CSS.replace("%BARVARS%", barVars(bar)) + CARD_LOOK_CSS + LOOK) + brkCss() + "</style>\n</head>\n" +
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
export type Loaded = { office: Person[]; names: Map<string, string>; short: Map<string, string>; actions: Action[]; events: Event[]; open: string | null; topics: Topic[];
  /* §657: the opened row's progress entries, and the latest entry of every row */
  progress: Progress[]; latest: Map<string, Progress> };

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
  return { office, names, short, actions, events: open ? await eventsOf(c, open) : [], open, topics: await listTopics(c),
    progress: open ? await progressOf(c, open) : [], latest: await latestProgress(c) };
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
const LINES = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const RIGHT = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/* THE ROW (§497): tick · the name, with its topic beside it unless the list
   is grouped by topic (the heading says it then, §87) · when · owner · the
   status as a word · the arrow. A late row's tick is ringed in the alarm. */
function row(a: Action, L: Loaded, who: Who, today: string, dates: Format, opened: boolean, group: Group, chk = false): string {
  const live = brk() === "who-everyone" ? true : mayChange(a, who);
  const late = a.status !== "done" && !!a.due && isLate(a.due, today);
  return '<div class="row' + (chk ? " chk" : "") + (a.status === "done" ? " done" : "") + (late ? " late" : "") + (opened ? " on" : "") + '" data-id="' + esc(a.id) + '" data-status="' + a.status + '">' +
    '<button class="tick" type="button" role="checkbox" aria-checked="' + (a.status === "done") + '" aria-label="' + (a.status === "done" ? "Mark not done" : "Mark done") + '"' +
    (live ? ' data-act="tick"' : " disabled") + ">" + (a.status === "done" ? TICK : "") + "</button>" +
    '<div class="tn2"><div class="t"' + (live ? ' data-rename="1" title="Double-click to rename"' : "") + ">" + esc(a.title) + "</div>" + lastLine(a, L, today) + "</div>" +
    (chk ? "" : topicCell(a, L, live, group)) +
    (chk ? checkWhenCell(a, today, dates, live) : whenCell(a, today, dates, live)) +
    whoCell(a, L, live) +
    statusPill(a, live) +
    (chk ? carryCell(a, today, live) : "") +
    '<button class="more' + (opened ? " on" : "") + '" type="button" data-act="more" aria-expanded="' + opened + '" aria-label="' + (opened ? "Close" : "Notes and history") + '" title="' + (opened ? "Close" : "Notes and history") + '">' + ARROW + "</button>" +
    "</div>";
}

/* ON THE CHECK THE WHEN CELL SAYS ONLY WHAT THE CARD CANNOT (§87, §532).
   The card already names the week, so a row simply due in its own card
   would repeat it — the cell is empty there. What the card does not say is
   HOW LATE a row is (the alarm, which is the whole reason a late row sits
   under this week rather than under the week it was due) and WHICH DAY a
   finished one was finished. Both come from whenCell, never from a second
   spelling of them (§53.5), so a late row keeps its week picker too. */
function checkWhenCell(a: Action, today: string, dates: Format, live: boolean): string {
  const w = whenText(a, today, dates);
  if (a.status !== "done" && !w.late) return '<span class="when"></span>';
  return whenCell(a, today, dates, live);
}

const CARRY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* CARRY TO NEXT WEEK (§532): drawn only where the server would allow it —
   an open row under this week, changeable by whoever is looking (§42, §61).
   The cell keeps its width when there is nothing to press, so the columns
   do not shuffle down a card as rows are finished. */
function carryCell(a: Action, today: string, live: boolean): string {
  if (brk() === "no-carry") return '<span class="carry off"></span>';          /* §532 put back: the week picker, four presses */
  if (!live || !mayCarry(a, today)) return '<span class="carry off"></span>';
  return '<button class="carry" type="button" data-act="carry" title="Carry this action to next week">' + CARRY + "Carry to next week</button>";
}

/* THE TOPIC CELL (§503): its own column, immediately before the week. Grouped
   by topic the heading already says it (§87), so the cell stays empty; a row
   nobody may change shows its topic and offers nothing; otherwise the tag (or
   "+ Add a topic") opens the same list the add line offers — the open topics,
   the closed one this row still carries, No topic, and New topic…. */
function topicCell(a: Action, L: Loaded, live: boolean, group: Group): string {
  const t = a.topicId ? L.topics.find((x) => x.id === a.topicId) : null;
  if (group === "topic") return '<span class="tcol"></span>';
  if (!t && brk() === "no-add-topic") return '<span class="tcol"></span>';                /* §503 put back: an empty row offers nothing */
  if (!live) return t ? '<span class="tcol tcwrap ro"><span class="tc"><span class="tw">' + esc(t.name) + "</span></span></span>" : '<span class="tcol"></span>';
  const opts = L.topics.filter((x) => !x.closed || x.id === a.topicId);
  const on = (id: string) => (id === (a.topicId || "") ? ' class="on" aria-selected="true"' : ' aria-selected="false"');
  return '<span class="tcol tcwrap tpk" role="button" tabindex="0" data-act="tpk" aria-haspopup="listbox" aria-expanded="false" title="' + (t ? "Change the topic" : "Add a topic") + '">' +
    '<span class="tc' + (t ? "" : " add") + '"><span class="tw">' + (t ? esc(t.name) : "+ Add a topic") + "</span></span>" +
    '<span class="topics" role="listbox" aria-label="Topic" hidden>' +
    opts.map((x) => '<button type="button" role="option" data-act="pick-topic" data-topic="' + esc(x.id) + '"' + on(x.id) + ">" + esc(x.name) + (x.closed ? " (closed)" : "") + "</button>").join("") +
    '<button type="button" role="option" data-act="pick-topic" data-topic=""' + on("") + ">No topic</button>" +
    '<input class="tnew" placeholder="New topic…" aria-label="New topic" maxlength="120"></span></span>';
}

/* The opened row: its topic, the notes, Delete behind a question, and the
   history in a box that scrolls. The topic is a plain choice here, the open
   topics and the one the row already holds (a closed topic stays on the row
   that carries it, §497). */
/* WHEN AN ENTRY WAS WRITTEN, as the list reads time (§657): the week in words
   — This week, Last week, Next week, then W4 Oct — with the day and the hour
   on hover. Last week is this file's own word: weekWord has no need of it on
   a due date, and the history reads backwards. */
function entryWeek(at: string, today: string): { word: string; now: boolean; full: string } {
  const d = at ? new Date(at) : null;
  const day = d ? todayIn(d) : today;
  const hm = d ? new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).format(d) : "";
  const word = sameWeek(day, today) ? "This week" : sameWeek(day, addDays(weekOf(today).from, -7)) ? "Last week" : weekWord(day, today);
  return { word, now: sameWeek(day, today), full: readableDay(day, today) + " · " + hm };
}
/* THE LATEST ENTRY UNDER THE NAME (§657): one quiet line, the week in front,
   cut at the row's edge so a row is never taller than two lines; a row with
   no progress yet has no second line. */
function lastLine(a: Action, L: Loaded, today: string): string {
  const p = L.latest.get(a.id);
  if (!p) return "";
  const w = entryWeek(p.at, today);
  return '<div class="last" title="' + esc(w.full) + '"><b>' + esc(w.word) + "</b> &middot; " + esc(oneLine(p.body)) + "</div>";
}
/* THE PROGRESS BOX (§657): one line and Enter, on the opened row and under
   every open row of this week on the check — one box, two places (§53.5). */
function progressBox(a: Action, label: string): string {
  return '<div class="pbox"><input class="pnew" data-act="progress-new" placeholder="' + esc(label) + '" aria-label="Progress on ' + esc(a.title) + '" maxlength="' + PROGRESS_MAX + '"><span class="ent" aria-hidden="true">Enter</span></div>';
}
/* THE ENTRIES, newest first: the week, the words, who — and for the writer
   alone, Edit and Delete (behind a question). An edited one says so. */
function progressList(L: Loaded, who: Who, today: string): string {
  const name = (k: string) => L.short.get(k) || L.names.get(k) || k;
  if (!L.progress.length) return '<div class="pnone">Nothing written yet. The first line goes in at the next review.</div>';
  return '<ul class="prog">' + L.progress.map((p) => {
    const w = entryWeek(p.at, today);
    const mine = mayChangeProgress(p, who);
    return '<li class="pe" data-pid="' + esc(p.id) + '"><span class="wk' + (w.now ? " now" : "") + '" title="' + esc(w.full) + '">' + esc(w.word) + "</span>" +
      '<div class="pb"><div class="ptxt">' + esc(p.body) + "</div>" +
      '<div class="by"><span>' + esc(name(p.by)) + "</span>" + (p.editedAt ? '<span class="ed">edited</span>' : "") +
      (mine ? '<button type="button" data-act="progress-edit">Edit</button><button type="button" class="danger" data-act="progress-delete-ask">Delete</button>' +
        '<span class="sure" hidden>Delete this entry? <button type="button" class="go danger" data-act="progress-delete">Yes, delete it</button>' +
        '<button type="button" class="go" data-act="progress-delete-no">Keep it</button></span>' : "") +
      "</div></div></li>";
  }).join("") + "</ul>";
}
const RIGHT_SM = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* The opened row (§657, from §356.11): the topic, the DESCRIPTION where Notes
   was — same stored text, the box fitting it — and Delete behind a question
   on the left; on the right the PROGRESS box and its entries, and under them
   the automatic history behind one small link, unfolding in place. The
   history now says every movement (§657): a status change, a carry to another
   week, a hand-over, a rename, a move to another topic — the day, who, what,
   and what it was before. */
function openPanel(a: Action, L: Loaded, who: Who, today: string): string {
  const live = mayChange(a, who);
  const name = (k: string) => L.names.get(k) || k;
  const wk = (d: string | null | undefined) => d ? weekWord(d, today) : "no date";
  const topicName = (id: string | null | undefined) => id ? (L.topics.find((t) => t.id === id)?.name || "a topic since deleted") : "No topic";
  const hist = L.events.map((e) => {
    const at = e.at ? new Date(e.at) : null;
    const day = at ? todayIn(at) : "";
    const hm = at ? new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).format(at) : "";
    const d = e.detail || {};
    const what = e.kind === "created"
      ? "created it, owner " + esc(name(d.owner || a.ownerKey)) + (d.due !== undefined ? ", due " + esc(wk(d.due)) : "")
      : e.kind === "due" ? "carried to " + esc(wk(d.to)) + " (was " + esc(wk(d.from)) + ")"
      : e.kind === "owner" ? "handed to " + esc(name(d.to || "")) + " (was " + esc(name(d.from || "")) + ")"
      : e.kind === "title" ? "renamed to &ldquo;" + esc(d.to || "") + "&rdquo; (was &ldquo;" + esc(d.from || "") + "&rdquo;)"
      : e.kind === "topic" ? "moved to " + esc(topicName(d.to)) + " (was " + esc(topicName(d.from)) + ")"
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
    ? topic + '<p class="lab">Description</p><textarea class="desc" data-act="notes" aria-label="Description" maxlength="5000" rows="2">' + esc(a.description) + "</textarea>" +
      '<div class="hint">What the task is. Grows with what you write; saved when you leave the box.</div>' +
      '<div class="acts"><button type="button" class="danger" data-act="delete-ask">Delete</button>' +
      '<span class="sure" hidden>Delete this action? <button type="button" class="go danger" data-act="delete">Yes, delete it</button>' +
      '<button type="button" class="go" data-act="delete-no">Keep it</button></span></div>'
    : topic + '<p class="lab">Description</p><div class="ro">' + (a.description ? esc(a.description).replace(/\n/g, "<br>") : "&mdash;") + "</div>";
  /* anybody past the gate writes progress (§657); somebody the register has
     not placed yet has no name to write it under (§313.32) */
  const right = '<p class="lab">Progress</p>' + (who.personKey ? progressBox(a, "What happened on this task this week?") : "") + progressList(L, who, today) +
    '<button type="button" class="histlink" data-act="hist" aria-expanded="false">' + RIGHT_SM + "History</button>" +
    '<ul class="hist" hidden>' + hist + "</ul>";
  return '<div class="open" data-id="' + esc(a.id) + '"><div>' + left + "</div><div>" + right + "</div></div>";
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

/* ══ THE WEEKLY CHECK (§532) ═══════════════════════════════════════════
   THE WRITE LINE IS THE PAGE'S OWN ADD LINE, moved inside the topic it is
   for. Not a second kind of line: same classes, same controls, same script,
   same `add` the top of the page posts (§53.5) — with two things already
   answered, because at a check they always have the same answer. The TOPIC
   is the card it stands in, so it is not asked for; the WEEK is Next week,
   because that is what the meeting is writing. Both are still changeable:
   the week opens the same picker every other line opens.

   AND THE LIST'S OWN SECTIONS WRITE ON IT TOO (§656). Islam: an action added
   under a person or a topic *"should appear in the same place rather than
   adding from the top task entry"*. So the same line stands inside every
   section the list is grouped by — a topic's, with the topic fixed as on
   the check; a person's, with the OWNER fixed, drawn as a name and not a
   pick, because a line under Noran that could hand the action to Omar
   would land it elsewhere with nothing on the screen saying so (§96). Due
   this week, as the page's own line is. It is drawn `hidden` and the
   section's "+ Add to …" / "+ Add for …" opens it where the press was made,
   so the row lands under the heading the hand is already on. The page's
   own line at the top stays for an action under nobody and nothing in
   particular. One line, named by what it writes into: `data-line` is
   "t:<topic>" or "o:<owner>", and the script knows no other way to tell. */
type Line = { key: string; topic: Topic | null; owner: string | null; due: string; label: string; hidden?: boolean };
function writeLine(f: Line, L: Loaded, me: string, meShort: string, today: string, dates: Format): string {
  const owner = f.owner || me;
  const ownerShort = f.owner ? L.short.get(f.owner) || L.names.get(f.owner) || f.owner : meShort;
  return '<div class="addrow chk" data-due="' + esc(f.due) + '" data-owner="' + esc(owner) + '"' + (f.topic ? ' data-topic="' + esc(f.topic.id) + '"' : "") +
    ' data-line="' + esc(f.key) + '"' + (f.hidden ? " hidden" : "") + ">" +
    '<span class="plus">' + PEN + "</span>" +
    '<div class="tn"><input class="new" data-act="add" placeholder="' + esc(f.label) + '" aria-label="' + esc(f.label) + '" maxlength="200">' +
    '<input class="nt" placeholder="A note, if the line needs one" aria-label="Note for the new action" maxlength="5000" hidden></div>' +
    /* the topic is picked where the line does not already stand in one */
    (f.topic ? "" : topicPick(L)) +
    (dates === "weeks"
      ? '<span class="when pick" role="button" tabindex="0" data-act="due" data-due="' + esc(f.due) + '" aria-haspopup="listbox" aria-expanded="false" title="Which week"><span class="wk">' + esc(weekWord(f.due, today)) + "</span>" + weeksList(today, f.due) + "</span>"
      : '<button class="when pick" type="button" data-act="due" data-due="' + esc(f.due) + '" title="Which day">' + esc(readableDay(f.due, today)) + "</button>") +
    (f.owner
      ? '<span class="who" title="Whose it is"><span class="wn">' + esc(ownerShort) + "</span></span>"
      : '<span class="who pick" role="button" tabindex="0" data-act="who" aria-haspopup="listbox" aria-expanded="false" title="Whose it is"><span class="wn">' + esc(ownerShort) + "</span>" + teamList(L, owner) + "</span>") +
    /* the Enter badge stands where the topic pick would, so the line keeps
       its seven cells whichever of the two it carries */
    (f.topic ? '<span class="ent" aria-hidden="true">Enter</span>' : "") + '<span class="st"></span>' +
    '<button class="more" type="button" data-act="add-note" aria-expanded="false" aria-label="Add a note" title="Add a note">' + ARROW + "</button>" +
    "</div>";
}
/* The check's own line (§532): next week, inside its topic. */
function checkLine(t: Topic, L: Loaded, me: string, meShort: string, today: string, dates: Format): string {
  return writeLine({ key: "t:" + t.id, topic: t, owner: null, due: nextWeekDay(today), label: "Write next week's action for " + t.name }, L, me, meShort, today, dates);
}

/* THE ADD LINE'S TOPIC (§497): the open topics, No topic, and a new one
   named in the box under them — the one list the page's line and a
   person's section line both open. */
function topicPick(L: Loaded): string {
  const openTopics = L.topics.filter((t) => !t.closed);
  return '<span class="tpk" role="button" tabindex="0" data-act="tpk" aria-haspopup="listbox" aria-expanded="false" title="Which topic"><span class="tw">Topic</span>' +
    '<span class="topics" role="listbox" aria-label="Topic" hidden>' +
    openTopics.map((t) => '<button type="button" role="option" data-act="pick-topic" data-topic="' + esc(t.id) + '">' + esc(t.name) + "</button>").join("") +
    '<button type="button" role="option" data-act="pick-topic" data-topic="">No topic</button>' +
    '<input class="tnew" placeholder="New topic…" aria-label="New topic" maxlength="120"></span></span>';
}

/* ONE WEEK'S CARD. Drawn only where there is something in it — a card over
   nothing is the empty heading §497 already refused, in a box. Next week is
   the exception and always stands, because its write line IS the something:
   the meeting's whole purpose is the line that is not there yet. */
function weekCard(k: CheckWeek, rows: string, today: string, extra = ""): string {
  if (!rows && !extra) return "";
  const w = checkWeeks(today)[k];
  return '<div class="blk ' + (k === "now" ? "now" : k === "next" ? "next" : "past") + '">' +
    '<div class="wkh">' + esc(CHECK_WORD[k]) + '<span class="days">' + esc(weekInMonth(w.from)) + " &middot; " + esc(weekDays(w, today)) + "</span></div>" +
    rows + extra + "</div>";
}

/* A TOPIC, READ DOWN ITS THREE WEEKS. The heading is the grouped list's own
   — number, name, counts, how much is done, its ⋯ — so a topic looks the
   same wherever the page draws it (§53.5). Under it: what happened, what is
   being decided, what is being promised. */
function checkSections(L: Loaded, p: PageArgs, today: string, dates: Format): { html: string; count: string; countHtml: string } {
  const all = L.actions;
  const shown = all.filter((a) => inView(a, "check", p.who, today));
  const me = p.who.personKey;
  const meShort = me ? L.short.get(me) || L.names.get(me) || me : "";
  /* EVERY TOPIC THE LIST STILL HOLDS, not only the ones with rows in these
     three weeks (§532's own point): a topic skipped three weeks running is
     the one the meeting most needs to see. A closed one leaves once its last
     open action is done, which is topicShown's rule and not a second one. */
  const topics = L.topics.filter((t) => topicShown(t, all));
  const loose = shown.filter((a) => !a.topicId);
  let ix = 0;
  const secOf = (t: Topic | null): string => {
    const rows = t ? shown.filter((a) => a.topicId === t.id) : loose;
    const byWeek = (k: CheckWeek) => rows.filter((a) => checkWeek(a, today) === k);
    const open = rows.filter((a) => a.status !== "done");
    const late = open.filter((a) => isLate(a.due, today)).length;
    const nowRows = byWeek("now");
    /* THE PROGRESS BOX UNDER EVERY OPEN ROW OF THIS WEEK (§657): the entry is
       typed while the task is being talked about. Last week's and next week's
       rows show their latest line and no box — progress is written on the
       week being reviewed. */
    const draw = (k: CheckWeek) =>
      byWeek(k).map((a) => row(a, L, p.who, today, dates, a.id === L.open, "topic", true) + (a.id === L.open ? openPanel(a, L, p.who, today) : "") +
        (k === "now" && a.status !== "done" && me && a.id !== L.open ? '<div class="pline" data-id="' + esc(a.id) + '">' + progressBox(a, "What happened this week?") + "</div>" : "")).join("");
    const mine = t ? all.filter((a) => a.topicId === t.id) : all.filter((a) => !a.topicId);
    const done = mine.filter((a) => a.status === "done").length;
    const head = t
      ? '<div class="grp sh' + (nowRows.length ? "" : " quiet") + '" data-key="' + esc(t.id) + '">' +
        '<span class="ix">' + String(++ix).padStart(2, "0") + "</span>" +
        "<h3>" + esc(t.name) + "</h3>" +
        '<span class="meta">' + (nowRows.length ? open.length + " open" + (late ? ' &middot; <span class="bad">' + late + " late</span>" : "") : "nothing this week") + "</span>" +
        '<span class="end">' + (t.closed ? '<span class="shut">Closed</span>' : "") + done + " of " + mine.length + " done" + topicMenu(t) + "</span></div>" +
        '<div class="meter"><i style="width:' + (mine.length ? Math.round(done * 100 / mine.length) : 0) + '%"></i></div>'
      : '<div class="grp sh quiet" data-key="none"><span class="ix">&mdash;</span><h3>No topic</h3>' +
        '<span class="meta">' + open.length + " open" + (late ? ' &middot; <span class="bad">' + late + " late</span>" : "") + '</span><span class="end"></span></div>';
    /* A TOPIC NOBODY HAS TOUCHED FOR THESE THREE WEEKS SAYS SO, and points
       at the one control that clears it away — otherwise the check fills up
       with threads the office has quietly left (§61). */
    const asleep = t && !rows.length
      ? '<div class="asleep">Nothing on this topic in these three weeks. Write the next action, or close the topic from its &middot;&middot;&middot;</div>'
      : "";
    const line = me && t && !t.closed ? checkLine(t, L, me, meShort, today, dates) : "";
    const body = weekCard("last", draw("last"), today) + weekCard("now", draw("now"), today) +
      (t ? weekCard("next", draw("next"), today, line) : weekCard("next", draw("next"), today));
    return '<div class="sec" data-key="' + esc(t ? t.id : "none") + '">' + head + asleep + body + "</div>";
  };
  const html = topics.map((t) => secOf(t)).join("") + (loose.length ? secOf(null) : "");
  /* HOW FAR THROUGH THE MEETING YOU ARE: the topics, and the ones whose next
     week is still empty — which is the question the check exists to answer. */
  const toWrite = topics.filter((t) => !shown.some((a) => a.topicId === t.id && checkWeek(a, today) === "next")).length;
  const tail = toWrite + " still to write for next week";
  return {
    html,
    count: plural(topics.length, "topic", "topics") + " · " + tail,
    countHtml: plural(topics.length, "topic", "topics") + " &middot; " + (toWrite ? '<span class="left">' + tail + "</span>" : "all written for next week"),
  };
}

export type ListOut = { body: string; count: string; open: string | null };

/* THE BAND AND THE CARD'S HEAD (§646, from §497): the week, the name, a
   sentence and the four counts on the client's own colour; under it the top
   of the Actions card, whose header holds the views as My tasks' switch,
   Group by and the search, and under that header `inner` — the add line, or
   the check's count. Both ride in the pinned wrapper, and both are part of
   what a press redraws, so the counts follow a tick without a reload.
   `solo` closes the card when no list follows it (the unread page). */
function masthead(p: PageArgs, today: string, all: Action[], sum: { open: number; late: number; dueWeek: number; doneWeek: number } | null, L: Loaded | null = null,
  o: { find?: string; inner?: string; shown?: number | null; solo?: boolean } = {}): string {
  const here = clientHref(p.slug, "tracker", "");
  const q = String(p.ask.q || "").trim().slice(0, 120);
  const view: View = p.ask.view;
  const viewHref = (v: View) => here + "?view=" + v + (q ? "&q=" + encodeURIComponent(q) : "");
  const thu = thursdayOf(today);
  const tiles = !sum ? [] : [
    { n: sum.open, label: "Open" },
    { n: sum.late, label: "Late", late: !!sum.late },
    /* NO COUNT ON THE CARD (§356.16); the break puts back the tail it
       removed, counted the way the summary counted it (§94.5, §276). */
    { n: sum.dueWeek, label: "Due" + (() => {
      if (brk() !== "card-count") return "";
      const w = weekOf(today);
      const n = all.filter((a) => a.status === "not_started" && !!a.due && a.due >= w.from && a.due <= w.to).length;
      return n ? " \u00b7 " + n + " not started" : "";
    })() },
    { n: sum.doneWeek, label: "Done this week" },
  ];
  /* the two settings behind "Group by" on the far right (§356.14, §497):
     each choice names its value, the one in force marked; the script writes
     a cookie and reads the list again */
  /* ON THE WEEKLY CHECK THE GROUPING IS NOT A CHOICE (§532): the view is read
     by topic because the topic is what the meeting walks down, so the column
     that would offer four other answers is not drawn and the button stops
     naming one. A control that cannot change anything is worse than no
     control (§96). Dates as, and Topics, go on working there. */
  const isCheck = view === "check";
  const settings = '<span class="dots"><button type="button" data-act="settings" aria-haspopup="menu" aria-expanded="false" title="Settings"' + (isCheck ? ' aria-label="Settings"' : "") + ">" +
    (isCheck ? "" : "Group by <b>" + esc(GROUP_WORD[p.ask.group]) + "</b>" + CARET) + DOTS3 + "</button>" +
    '<span class="setmenu" role="menu" hidden><span class="two">' +
    (isCheck ? "" :
      '<span class="col"><span class="lab">Group by</span>' +
      GROUPS.map((g) => '<button type="button" role="menuitemradio" data-act="set-group" data-value="' + g + '"' + (g === p.ask.group ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + ">" + esc(GROUP_WORD[g]) + "</button>").join("") + "</span>") +
    '<span class="col"><span class="lab">Dates as</span>' +
    FORMATS.map((f) => '<button type="button" role="menuitemradio" data-act="set-dates" data-value="' + f + '"' + (f === p.ask.dates ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + ">" + esc(FORMAT_WORD[f]) + "</button>").join("") + "</span>" +
    "</span>" +
    '<span class="sep"><button type="button" role="menuitem" data-act="topics">' + LINES + "Topics" + '<span class="arr">' + RIGHT + "</span></button></span>" +
    "</span>" + topicsPanel(L) + "</span>";
  const band = bandHtml({ esc, eyebrow: weekWord(thu, today) + " \u00b7 " + weekLabel(weekOf(today), today), title: MODULE_DEF.tracker.label,
    sentence: p.tenantName + "\u2019s actions, read by the week.", tiles });
  const views = '<span class="cx">Show <nav class="cats" aria-label="Views">' +
    VIEWS.map((v) => '<a href="' + esc(viewHref(v)) + '"' + (v === view ? ' aria-current="true"' : "") + ">" + esc(VIEW_WORD[v]) + "</a>").join("") +
    "</nav></span>";
  return band + '<div class="card ctop' + (o.solo ? " solo" : "") + '">' +
    cardHead({ esc, icon: "tasks", title: "Actions", count: o.shown == null ? null : o.shown, right: views + settings + (o.find || "") }) +
    (o.inner || "") + "</div>";
}

/* ══ THE TOPICS PANEL (§533) ═══════════════════════════════════════════
   Islam: "in the internal tracker module I want to be able to edit the
   topics names." He could already — from ONE place: group the list by Topic,
   then the ⋯ on a topic's heading. Two topics could not be reached from the
   page at all, because a heading is only ever drawn over rows that are in
   view: a topic with NO actions, and a closed one whose last action is done.
   Neither could be renamed, closed or deleted by any route.

   So the list of topics gets a place of its own, behind the ⋯ where the
   list's own settings already live, open whatever the page is grouped by.
   Each line: the name (pressed, it becomes a box in place — Enter saves,
   Escape puts it back, and there is no Save button anywhere in SMP), how
   many actions hold it and how many are done, Closed if it is closed, and
   the SAME ⋯ the heading carries — the same three words calling the same
   acts, so one rule is not written twice (§53.5). Ordered as listTopics
   orders it, open first then by name, so one list is not ordered two ways.

   THE HEADING'S OWN ⋯ IS UNTOUCHED. This is a second door to one room, not
   a second room. */
function topicsPanel(L: Loaded | null): string {
  if (!L) return "";
  /* §533 put back: only the topics that already hold an action, which is
     every list the page could draw BEFORE the panel — and leaves the empty
     one and the finished closed one unreachable all over again. */
  const list = brk() === "topics-with-actions" ? L.topics.filter((t) => L.actions.some((a) => a.topicId === t.id)) : L.topics;
  const rows = list.map((t) => {
    const mine = L.actions.filter((a) => a.topicId === t.id);
    const done = mine.filter((a) => a.status === "done").length;
    const ct = !mine.length
      ? '<span class="ct nil">no actions yet</span>'
      : '<span class="ct">' + plural(mine.length, "action", "actions") + " &middot; " + (done === mine.length ? "all done" : done + " done") + "</span>";
    return '<div class="trow" data-topic="' + esc(t.id) + '">' +
      '<button type="button" class="nm" data-act="topic-rename" data-topic="' + esc(t.id) + '" title="Rename this topic">' +
      '<span class="who2">' + esc(t.name) + "</span>" + (t.closed ? '<span class="shut">Closed</span>' : "") + PEN + "</button>" +
      ct + topicMenu(t) + "</div>";
  }).join("");
  return '<span class="tpanel" hidden>' +
    '<span class="ph"><span class="lab">Topics</span><span class="hint">Press a name to rename it</span></span>' +
    (rows
      ? '<div class="tlist">' + rows + "</div>"
      : '<div class="tnone">No topics yet. Make the first one here, or type one on any action\'s topic tag.</div>') +
    '<div class="tadd"><span class="pl" aria-hidden="true">+</span>' +
    '<input class="tpnew" placeholder="New topic&hellip;" aria-label="New topic" maxlength="120"></div></span>';
}

/* A TOPIC'S OWN MENU, on its heading AND on its line in the panel: rename,
   close or reopen, delete behind a question. Anybody in the office (§497,
   Islam's third answer). */
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
     much of it is done, a thin bar, its menu and "+ Add to <topic>"; for a
     person, "+ Add for <name>". Either opens the section's own write line
     (§656), so the action lands under the heading it was written under. A
     topic with no rows in this view is not drawn: a heading never stands
     over nothing. Grouped by nothing, one section and no heading. */
  /* THE WEEKLY CHECK IS NOT THE LIST WITH A FILTER ON IT (§532). It is read
     by topic, three weeks deep, and it carries no add line or search at the
     top: the writing happens inside the topic the meeting is on, which is
     the whole reason the view exists. */
  if (view === "check") {
    const ck = checkSections(L, p, today, dates);
    const nothing = ck.html ? ""
      : '<div class="none"><b>No topics yet for ' + esc(p.tenantName) + ".</b>" +
        "The check is read one topic at a time, so it needs a topic first. Make one on any action's topic tag, or behind the &middot;&middot;&middot; above.</div>";
    return {
      body: pinned(masthead(p, today, all, sum, L, { inner: '<div class="counted ck">' + ck.countHtml + "</div>" })) +
        '<div class="card cbot"><div class="list">' + ck.html + "</div>" + nothing + "</div>",
      count: ck.count, open: L.open,
    };
  }

  const groups = grouped(shown, L, group, today, dates);
  const thu = thursdayOf(today);
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
    /* THE SECTION'S OWN LINE (§656): under a topic's rows with the topic
       fixed, under a person's with the owner fixed; hidden until the foot's
       "+ Add …" opens it, so the action is written where it will land. The
       break puts §497's way back — the press fills the line at the TOP and
       scrolls there — which must turn checks/tracker.mjs red (§94.5). */
    const atTop = brk() === "add-at-top";
    const who4 = group === "owner" && me && !atTop ? g.key : "";
    const who4Name = who4 ? L.short.get(who4) || L.names.get(who4) || who4 : "";
    const line = t && !t.closed && me && !atTop
      ? writeLine({ key: "t:" + t.id, topic: t, owner: null, due: thu, label: "Write the next action for " + t.name, hidden: true }, L, me, meShort, today, dates)
      : who4 && me
        ? writeLine({ key: "o:" + who4, topic: null, owner: who4, due: thu, label: "Write the next action for " + who4Name, hidden: true }, L, me, meShort, today, dates)
        : "";
    const addWord = t ? "Add to " + esc(t.name) : who4 ? "Add for " + esc(who4Name) : "";
    const foot = (done ? '<button type="button" data-act="show-done">' + done + " done &rsaquo;</button>" : "") +
      (line ? '<button type="button" data-act="add-here" data-line="' + esc(t ? "t:" + t.id : "o:" + who4) + '"><b>+</b> ' + addWord + "</button>"
        : t && !t.closed && me ? '<button type="button" data-act="add-to-topic" data-topic="' + esc(t.id) + '" data-name="' + esc(t.name) + '"><b>+</b> Add to ' + esc(t.name) + "</button>" : "");
    return '<div class="sec" data-key="' + esc(g.key) + '">' + head + rows + line + (foot ? '<div class="foot">' + foot + "</div>" : "") + "</div>";
  }).join("");

  /* THE NEXT ACTION is written at the top, under a gold rule (§497). It takes
     everything — the topic, the week (this week's Thursday until another is
     picked), the owner (you), and a note behind the arrow (§356.15) — and the
     details arrive with the first letter (§356.16). Nothing is posted until
     Enter; the picks ride on the line as data- attributes. Somebody the
     register has not placed yet (§313.32) is told so (§61). */
  const tpk = topicPick(L);
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
  const tools = '<div class="tools' + (all.length ? "" : " solo") + '"><div class="write">' + addrow + "</div></div>";
  /* NO COUNT LINE UNDER THE ADD LINE (§566). Islam: *"remove the small 14
     action line under the add action as it's already existing in the navy
     large panel"*. It went with its search figure too, said and agreed. The
     search form's own #count stays, hidden as it always was. */
  const counted = all.length && brk() === "count-line" ? '<div class="counted">' + esc(count) + "</div>" : "";
  const none = !all.length
    ? '<div class="none"><b>Nothing on the list for ' + esc(p.tenantName) + ' yet.</b>The first line lands under you, due this week; pick another week on the line before Enter, or on the row after.</div>'
    : !shown.length
      ? '<div class="none"><b>Nothing ' + (q ? "matches" : "here") + '.</b>' + (q ? "Try another word, or " : "Add one on the line above, or ") + '<a href="' + esc(viewHref("all")) + '">see all of them</a>.</div>'
      : "";
  return { body: pinned(masthead(p, today, all, sum, L, { find: all.length ? find : "", inner: tools + counted, shown: shown.length })) +
    '<div class="card cbot"><div class="list">' + secs + "</div>" + none + "</div>", count, open: L.open };
}

/* What stays at the top while the list scrolls (§565): one wrapper, so the
   band, the add line and the count cannot be pinned apart. */
function pinned(html: string): string {
  return brk() === "band-scrolls" ? html : '<div class="pin">' + html + "</div>";
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
    const body = '<main class="pg">' + masthead(p, today, [], null, null, { solo: true,
      inner: '<p class="unread">The list could not be read just now. Nothing has been lost &mdash; try again in a moment.</p>' }) + "</main>\n";
    return skeleton(p.slug, p.tenantName, topOf(p), bar, null, body);
  }
  const out = listBody(L, p, today);
  const body = '<main class="pg"><p class="said" id="said" role="alert" aria-live="polite"></p>' +
    '<div id="body">' + out.body + "</div></main>\n";
  return skeleton(p.slug, p.tenantName, topOf(p), bar, attrs, body);
}
