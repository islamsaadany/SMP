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
  type Action, type Who, type View, type Group, type Format, type Person, type Event, VIEWS, VIEW_WORD, STATUSES, STATUS_WORD, GROUPS, GROUP_WORD,
  FORMATS, FORMAT_WORD, todayIn, weekOf, weekLabel, readableDay, isLate, carriedWeeks, lateWord, inView, summary, mayChange,
  thursdayOf, weekWord, sameWeek, weekOptions,
  officeRows, namesOf, shortNames, listActions, eventsOf,
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
  if (b === "details-always") return ".addrow .when,.addrow .who,.addrow .st,.addrow .more{visibility:visible}";
  if (b === "wide-names") return ".team{min-width:140px}.team button{padding:7px 9px;font-size:14px;gap:9px}";
  return "";
}

const CSS = `
*{box-sizing:border-box}
:root{--bar:%BAR%;--ink:#141C2B;--ink-2:#465268;--ink-3:#5E6E85;--line:#D8DEE8;--ground:#F5F6F9;--surface:#FFF;--surface-2:#EDF0F5;--gold:#9C5D08;
  --good:#1B6E4E;--good-bg:#E9F4EF;--warn:#8A6410;--warn-bg:#FBF2DC;--bad:#B23025;--bad-bg:#FBEDEB;
  --font:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
/* THE FONT FAMILY IS NAMED, NEVER "inherit" INSIDE THE SHORTHAND (§356.14):
   a shorthand such as "600 11px/1" ending in the word inherit is not CSS a browser will read — a CSS-wide
   keyword cannot sit inside a shorthand beside other values — so every such
   line was silently DROPPED, and a control fell to whatever font it would
   have had anyway: the page's 15px for a span, the browser's own 13.3px
   Arial for a select. That is the pill Islam saw at two sizes. */
@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8590A3;--line:#333B4A;--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;--gold:#F5A623;
  --good:#63BE96;--good-bg:#1B2C26;--warn:#D7B04A;--warn-bg:#2A2515;--bad:#E8776B;--bad-bg:#33211F}}
body{margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.55 var(--font);-webkit-font-smoothing:antialiased}
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
.cats a{color:var(--ink-3);text-decoration:none;font:600 13.5px/1 var(--font);padding:9px 11px;border-bottom:2px solid transparent;margin-bottom:-1px}
.cats a[aria-current="true"]{color:var(--ink);border-bottom-color:var(--gold)}
.cats a:hover,.cats a:focus-visible{color:var(--ink);outline:none}
/* the way back to the client's platform, above the page's title (§356.14) */
.back{display:inline-flex;align-items:center;gap:4px;color:var(--ink-3);text-decoration:none;font:600 12.5px/1 var(--font);margin:0 0 10px -4px;padding:4px 8px 4px 4px;border-radius:6px}
.back svg{width:14px;height:14px}
.back:hover,.back:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
/* the two settings — how the list is grouped, and dates as weeks or days —
   behind three dots on the far right of the views row (§356.14) */
.cats{align-items:flex-end}
.dots{margin-left:auto;margin-bottom:6px;position:relative}
.dots>button{width:28px;height:24px;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink-3);display:grid;place-items:center;cursor:pointer;padding:0}
.dots>button:hover,.dots>button.on,.dots>button:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
.dots svg{width:16px;height:16px}
.setmenu{position:absolute;top:30px;right:0;z-index:9;display:flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:6px}
.setmenu .col{display:grid;align-content:start;min-width:0}
.setmenu .col+.col{border-left:1px solid var(--line);padding-left:4px}
.setmenu .lab{display:block;font:600 10.5px/1.7 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);padding:3px 9px 2px}
.setmenu button{display:flex;align-items:center;gap:8px;background:none;border:0;border-radius:7px;padding:5px 9px;font:400 13.5px/1.3 var(--font);color:var(--ink);cursor:pointer;text-align:left;white-space:nowrap}
.setmenu button:hover,.setmenu button:focus-visible{background:var(--ground);outline:none}
.setmenu button.on{font-weight:600}
.setmenu button.on::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);margin-left:auto;flex:none}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.tools form{display:flex;gap:8px;flex:1 1 260px;min-width:0}
.srch{flex:1 1 260px;min-width:0;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 var(--font)}
.go{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:8px 13px;font:600 13px/1.5 var(--font);cursor:pointer;flex:none}
.cnt{font:600 10.5px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-left:auto;flex:none}
.list{display:flex;flex-direction:column;border-top:1px solid var(--line);margin-top:12px}
.none{padding:40px 4px 10px;color:var(--ink-3);font-size:14px;max-width:60ch}
.none b{color:var(--ink);font-weight:600;display:block;font-size:15.5px;margin-bottom:6px}
.strip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 16px}
/* ONE HEIGHT, WHATEVER THE WORDS SAY (§356.16). Islam: "the change between the
   status of the actions changes the size of the top cards ... the top cards
   size should be fixed on the bigger size." Measured: the third card's own
   tail took a second line and pushed all four 65 → 80px, so the whole page
   below them shifted every time somebody changed a status. The tail is gone
   (below) AND the height is fixed at the taller one, so no wording can move
   them again — the two are separate, because a label that wraps at some
   window nobody has tried would bring the jump straight back. */
.tile{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 13px;min-height:80px}
.tile b{display:block;font-size:22px;font-weight:600;line-height:1.1;font-variant-numeric:tabular-nums}
.tile span{display:block;font:600 10.5px/1.4 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-top:4px}
.tile.late b{color:var(--bad)}
.grp{display:flex;align-items:center;gap:9px;padding:14px 2px 6px;font-size:13px;font-weight:600;color:var(--ink-2)}
.grp .cnt{margin-left:0}
/* the row: tick · name · date · owner · status · the arrow */
.row{display:grid;grid-template-columns:22px 1fr auto auto auto 26px;gap:12px;align-items:center;padding:11px 2px;border-bottom:1px solid var(--line)}
/* the name is plain text; a double-click turns it into a box in place */
.row .t{min-width:0;font-size:15px;line-height:1.35}
.row .t[data-rename]{cursor:text}
.row input.ttl{width:100%;min-width:0;border:1px solid var(--gold);border-radius:6px;background:var(--surface);color:var(--ink);padding:3px 7px;margin:-4px -8px;font:400 15px/1.35 var(--font);outline:none}
.row.done .t{color:var(--ink-3);text-decoration:line-through}
.tick{width:18px;height:18px;border:1.5px solid var(--line);border-radius:5px;display:grid;place-items:center;color:var(--surface);background:var(--surface);cursor:pointer;padding:0}
.tick:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.row.done .tick{background:var(--good);border-color:var(--good)}
.tick svg{width:11px;height:11px}
.tick[disabled]{cursor:default;opacity:.55}
.when{font:400 12.5px/1.4 var(--mono);color:var(--ink-3);white-space:nowrap;text-align:right;background:none;border:0;padding:0}
.when.late{color:var(--bad);font-weight:600}
.when.pick{cursor:pointer;border-radius:6px;padding:3px 5px;margin:-3px -5px}
.when.pick:hover,.when.pick.on,.when.pick:focus-visible{background:var(--surface-2);outline:none}
/* a week reads in words — This week, Next week, then its number (§356.15),
   and nothing on the row marks this one twice */
.when .wk{display:inline-block;font:500 12.5px/1.4 var(--font);color:var(--ink-2)}
.when.late .wk{color:var(--bad)}
/* the week picker: a small table — the week, the days — this week bold,
   because here the rows ARE a list and the mark says which one you are in
   (§356.15); No date and a day of your own at the foot. Its first column is
   86px to hold two words, which is what the words cost (§53.5). */
.weeks{position:absolute;top:26px;right:0;z-index:5;width:232px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:4px;text-align:left;font-variant-numeric:tabular-nums}
.weeks .wh{display:grid;grid-template-columns:86px 1fr;padding:5px 9px 4px;font:600 10px/1.6 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);border-bottom:1px solid var(--line);margin-bottom:3px}
.weeks button{display:grid;grid-template-columns:86px 1fr;width:100%;align-items:baseline;background:none;border:0;border-radius:7px;padding:6px 9px;font:400 13.5px/1.3 var(--font);color:var(--ink);cursor:pointer;text-align:left}
.weeks button b{font-weight:400;font-variant-numeric:tabular-nums}
.weeks button.now b{font-weight:700}
.weeks button small{font:400 12px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap}
.weeks button:hover,.weeks button:focus-visible{background:var(--ground);outline:none}
.weeks button.on{background:var(--surface-2)}
.weeks .wf{display:grid;border-top:1px solid var(--line);margin-top:3px;padding-top:3px}
.weeks .wf button{grid-template-columns:1fr;color:var(--ink-3);font-size:13px}
.row input.dt,.addrow input.dt{font:400 12.5px/1.4 var(--mono);color:var(--ink);border:1px solid var(--gold);border-radius:6px;padding:2px 5px;background:var(--surface)}
/* the owner is a first name, drawn as the fact; a press opens the team */
.who{font:600 12.5px/1.4 var(--font);color:var(--ink-2);white-space:nowrap;min-width:52px;text-align:right;background:none;border:0;padding:0;position:relative}
.who.pick{cursor:pointer;border-radius:6px;padding:3px 7px;margin:-3px -7px}
.who.pick:hover,.who.pick.on,.who.pick:focus-visible{background:var(--surface-2);outline:none}
/* COMPACT (§356.16). Islam: "the names list is wide for no reason make it
   compact." Measured: 140px of box holding a longest first name of 69px, and
   247px tall for seven people — the width was a FLOOR set here rather than
   anything the names needed, so taking it off is what makes it narrow and the
   rows are what make it short. 140 × 247 → 95 × 212, his pick of two drawn;
   the tighter one took a row to 25px, under every other small control here. */
.team{position:absolute;top:26px;right:0;z-index:5;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 26px rgba(20,28,43,.16);padding:4px;text-align:left}
.team button{display:flex;width:100%;align-items:center;gap:8px;background:none;border:0;border-radius:7px;padding:5px 9px;font:400 13.5px/1.4 var(--font);color:var(--ink);cursor:pointer;text-align:left}
.team button:hover,.team button:focus-visible{background:var(--ground);outline:none}
.team button.on{font-weight:600}
.team button.on::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);margin-left:auto}
/* ONE BOX FOR THE PILL, pressable or not (§356.14): the same font, height
   and width whether it is a select or a span, the arrow only where it can be
   pressed — and the Done ground set with background-COLOR, because the
   shorthand took the arrow off with it. */
.st{display:inline-grid;place-items:center;height:26px;width:118px;font:600 11px/1 var(--font);letter-spacing:.02em;padding:0 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink-2);background:var(--surface);white-space:nowrap;text-align:center;appearance:none;-webkit-appearance:none;margin:0}
select.st{cursor:pointer;padding:0 24px 0 14px;text-align-last:center;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%235E6E85'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center}
select.st:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.st.prog{border-color:var(--gold);color:var(--gold)}
.st.done{border-color:var(--good);background-color:var(--good-bg);color:var(--good)}
/* the arrow that expands a row for its notes and history, and folds it */
.more{width:26px;height:26px;border-radius:7px;border:0;background:none;color:var(--ink-3);display:grid;place-items:center;cursor:pointer;padding:0;justify-self:end}
.more:hover,.more.on,.more:focus-visible{background:var(--surface-2);color:var(--ink);outline:none}
.more svg{width:16px;height:16px;transition:transform .15s}
.more.on svg{transform:rotate(180deg)}
@media (prefers-reduced-motion:reduce){.more svg{transition:none}}
.addrow{display:grid;grid-template-columns:22px 1fr auto auto auto 26px;gap:12px;align-items:center;padding:9px 2px;border-bottom:1px dashed var(--line)}
.addrow .plus{width:18px;height:18px;display:grid;place-items:center;color:var(--ink-3);font:600 15px/1 var(--font)}
.addrow input.new{border:0;background:transparent;color:var(--ink);font:400 15px/1.35 var(--font);padding:2px 0;width:100%;min-width:0;outline:none}
.addrow input::placeholder{color:var(--ink-3)}
/* the note is a quiet second line under the action, in its own column, so
   the week, the owner and the status never move (§356.14) */
.addrow .tn{min-width:0;display:grid;gap:2px}
.addrow input.nt{border:0;background:transparent;color:var(--ink-2);font:400 13px/1.4 var(--font);padding:0;width:100%;min-width:0;outline:none}
/* THE DETAILS ARRIVE WITH THE FIRST LETTER (§356.16). Islam: "for the new
   action remove the details until someone start typing the action name then
   the details required to set appears to avoid the clutering." At rest the
   line is the plus and the box and nothing else.
   THEIR SPACE IS KEPT, WHICH IS HIS PICK OF TWO DRAWN: visibility rather than
   display, so the typing box does not narrow under the hand the moment a
   first letter lands — the cost, stated before he chose it, is that the right
   of the line sits empty until then. TYPING is the trigger and not focus:
   clicking into the box is not yet an action, and the cells cannot be pressed
   while they are invisible anyway, so the week and the owner are set after
   the name rather than before it — which is what the hint under the line now
   says. */
.addrow .when,.addrow .who,.addrow .st,.addrow .more{visibility:hidden}
.addrow:focus-within,.addrow.typing{background:var(--surface)}
.addrow.typing .when,.addrow.typing .who,.addrow.typing .st,.addrow.typing .more{visibility:visible}
.addhint{font:400 12px/1.5 var(--mono);color:var(--ink-3);padding:6px 2px 0 34px}
/* the opened row is notes and history only — no Title box, no With */
.open{grid-column:1/-1;display:grid;grid-template-columns:1.4fr 1fr;gap:18px;padding:12px 2px 6px 34px;border-bottom:1px solid var(--line);background:var(--surface)}
.open .lab{font:600 10.5px/1.7 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin:10px 0 4px}
.open .lab:first-child{margin-top:0}
.open textarea{border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:8px 11px;font:400 14px/1.5 var(--font);width:100%;min-height:72px;resize:vertical}
.open .hint{font-size:12.5px;color:var(--ink-3);margin-top:4px}
.open .ro{font-size:14px;color:var(--ink-2)}
/* the history is small type in a box that scrolls, so a long life never
   lengthens the row it sits under; the track is shown, since on a Mac a
   scrollbar is an overlay that appears only once you scroll (§158) */
.hist{list-style:none;margin:0;padding:0 8px 0 0;font-size:11.5px;line-height:1.45;max-height:118px;overflow-y:auto;scrollbar-width:thin;scrollbar-gutter:stable;color:var(--ink-2)}
.hist li{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)}
.hist li:last-child{border-bottom:0}
.hist time{font:400 10.5px/1.6 var(--mono);color:var(--ink-3);white-space:nowrap}
.hist b{font-weight:600;color:var(--ink)}
.open .acts{display:flex;gap:14px;padding-top:10px;font-size:13px;align-items:center}
.open .acts button{background:none;border:0;padding:0;font:var(--font);color:var(--ink-3);cursor:pointer;text-decoration:underline}
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
  .team,.weeks{right:auto;left:0}}
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
type BodyAttrs = { api: string; list: string; view: string; q: string; group: string; dates: string };
function skeleton(slug: string, tenantName: string, have: ModuleKey[], bar: string, attrs: BodyAttrs | null, body: string): string {
  const a = attrs
    ? ' data-api="' + esc(attrs.api) + '" data-list="' + esc(attrs.list) + '" data-view="' + esc(attrs.view) + '" data-q="' + esc(attrs.q) + '" data-group="' + esc(attrs.group) + '" data-dates="' + esc(attrs.dates) + '"'
    : "";
  return "<!doctype html>\n<html lang='en' data-module='tracker'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " &mdash; " + esc(MODULE_DEF.tracker.label) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    "<style>" + CSS.replace("%BAR%", bar) + brkCss() + "</style>\n</head>\n" +
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

export type Ask = { view: View; q: string; open: string | null; group: Group; dates: Format };
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

function row(a: Action, L: Loaded, who: Who, today: string, dates: Format, opened: boolean): string {
  const live = brk() === "who-everyone" ? true : mayChange(a, who);
  return '<div class="row' + (a.status === "done" ? " done" : "") + (opened ? " on" : "") + '" data-id="' + esc(a.id) + '" data-status="' + a.status + '">' +
    '<button class="tick" type="button" role="checkbox" aria-checked="' + (a.status === "done") + '" aria-label="' + (a.status === "done" ? "Mark not done" : "Mark done") + '"' +
    (live ? ' data-act="tick"' : " disabled") + ">" + (a.status === "done" ? TICK : "") + "</button>" +
    '<div class="t"' + (live ? ' data-rename="1" title="Double-click to rename"' : "") + ">" + esc(a.title) + "</div>" +
    whenCell(a, today, dates, live) +
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
function grouped(shown: Action[], L: Loaded, group: Group, today: string, dates: Format): Grp[] {
  const by = new Map<string, Action[]>();
  /* as weeks, a due-date grouping is by the WEEK — every day of one week
     under one heading, keyed by its Thursday so the order is still by day.
     THE BREAK GROUPS BY THE DAY WHILE STILL ASKED FOR WEEKS, which is this
     decision failing rather than a function failing: two days of one week
     draw the same heading twice, so the check's one-heading-per-week
     assertion reddens and nothing about weekWord moves (§113.8 — an
     agreement is preserved by breaking both its sides at once). */
  const dueKey = (a: Action) => !a.due ? "none" : (dates === "weeks" && brk() !== "day-groups") ? thursdayOf(a.due) : a.due;
  const keyOf = (a: Action) => group === "owner" ? a.ownerKey : group === "status" ? a.status : group === "due" ? dueKey(a) : "all";
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
    : group === "due" ? (k === "none" ? "No date" : dates === "weeks" ? weekWord(k, today) + " · " + weekOptions(k, 1)[0].days : readableDay(k, today))
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
    /* NO COUNT ON THE CARD (§356.16, Islam: "in case of not started no need
       for the naming on the card due is enough") — what is due this week is
       the number above it, and how many of those have not been started is
       read off the rows themselves. */
    /* the break puts back the exact tail §356.16 removed, counted the way the
       summary counted it, or "the cards did not move" is asserted against a
       tail that never changes and the falsification proves nothing (§94.5).
       ONE BREAK PER DECISION: card-count is the tail, card-jumps is the
       floor — a break that did both would redden the other's assertions too
       and neither would be isolated (§276). */
    '<div class="tile"><b>' + sum.dueWeek + "</b><span>Due this week" + (() => {
      if (brk() !== "card-count") return "";
      const w = weekOf(today);
      const n = all.filter((a) => a.status === "not_started" && !!a.due && a.due >= w.from && a.due <= w.to).length;
      return n ? " &middot; " + n + " not started" : "";
    })() + "</span></div>" +
    '<div class="tile"><b>' + sum.doneWeek + "</b><span>Done this week</span></div></div>";
  const count = plural(shown.length, "action", "actions") + (view === "week" ? " on this week" : "");
  const tools = '<div class="tools"><form method="get" action="' + esc(here) + '" role="search">' +
    '<input type="hidden" name="view" value="' + view + '">' +
    '<input class="srch" type="search" name="q" value="' + esc(q) + '" placeholder="Search actions" aria-label="Search actions">' +
    '<button class="go" type="submit">Search</button></form>' +
    '<span class="cnt" id="count">' + esc(count) + "</span></div>";
  const me = p.who.personKey;
  const meShort = me ? L.short.get(me) || L.names.get(me) || me : "";
  const dates = p.ask.dates;
  const rows = grouped(shown, L, p.ask.group, today, dates).map((g) =>
    (g.label == null ? "" : '<div class="grp" data-key="' + esc(g.key) + '">' + esc(g.label) + ' <span class="cnt">' + g.rows.length + "</span></div>") +
    g.rows.map((a) => row(a, L, p.who, today, dates, a.id === L.open) + (a.id === L.open ? openPanel(a, L, p.who, today) : "")).join("")).join("");
  /* THE NEXT EMPTY LINE — the sheet's own way in, AND IT TAKES EVERYTHING
     (§356.14): the action, the week (this week's Thursday until another is
     picked — Islam's default), the owner (you until another is picked), Not
     started. Nothing is posted until Enter; the picks ride on the line as
     data- attributes the script reads. Somebody the register has not placed
     yet (§313.32) is told so rather than handed a box that would be refused
     on Enter (§61).
     AND THE NOTE IS ASKED FOR, NEVER STANDING (§356.15). Islam: "a note
     should be an option not a common thing in the actions." It was drawn on
     every add line, so the sheet's one way in read as two fields to fill.
     THE CONTROL IS THE ARROW THE ROWS ALREADY CARRY, in the column it already
     sits in, meaning what it already means — a row's notes — so the line adds
     no word to the screen and there is nothing new to learn; Islam picked it
     over a word reading "note", which would have sat in that same column and
     stopped the add line lining up with the rows above it. The box is HIDDEN
     and never absent (§298's shape, §100.2): folding it must not throw away
     what a hand has half-typed. */
  const thu = thursdayOf(today);
  const addrow = me
    ? '<div class="addrow" data-due="' + thu + '" data-owner="' + esc(me) + '"><span class="plus">+</span>' +
      '<div class="tn"><input id="add" class="new" data-act="add" placeholder="' + (all.length ? "Type an action and press Enter" : "Type the first action for " + esc(p.tenantName) + " and press Enter") + '" aria-label="New action" maxlength="200">' +
      '<input id="addnote" class="nt" placeholder="A note, if the line needs one" aria-label="Note for the new action" maxlength="5000"' + (brk() === "note-standing" ? "" : " hidden") + '></div>' +
      (dates === "weeks"
        ? '<span class="when pick" role="button" tabindex="0" data-act="due" data-due="' + thu + '" aria-haspopup="listbox" aria-expanded="false" title="Which week"><span class="wk">' + weekWord(thu, today) + "</span>" + weeksList(today, thu) + "</span>"
        : '<button class="when pick" type="button" data-act="due" data-due="' + thu + '" title="Which day">' + esc(readableDay(thu, today)) + "</button>") +
      '<span class="who pick" role="button" tabindex="0" data-act="who" aria-haspopup="listbox" aria-expanded="false" title="Whose it is"><span class="wn">' + esc(meShort) + "</span>" + teamList(L, me) + "</span>" +
      '<span class="st">Not started</span>' +
      '<button class="more" type="button" data-act="add-note" aria-expanded="false" aria-controls="addnote" aria-label="Add a note" title="Add a note">' + ARROW + "</button></div>"
    : '<div class="addhint">You are not on this client\'s register yet, so nothing can be owned by you here; open the client once more and it will be.</div>';
  const hint = me ? '<div class="addhint">Enter adds it under you, due this week &middot; type the action and its week, owner and note appear on the line &middot; or set them on the row after</div>' : "";
  const none = !all.length
    ? '<div class="none"><b>Nothing on the list for ' + esc(p.tenantName) + ' yet.</b>The first line lands under you, due this week; pick another week on the line before Enter, or on the row after.</div>'
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
  const attrs: BodyAttrs = { api: clientHref(p.slug, "tracker", "api"), list: clientHref(p.slug, "tracker", "list"), view, q, group: p.ask.group, dates: p.ask.dates };

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
    /* the two settings behind three dots (§356.14): each choice is a button
       naming its value, the one in force marked; the script writes a cookie
       and reads the list again */
    '<span class="dots"><button type="button" data-act="settings" aria-haspopup="menu" aria-expanded="false" title="Settings" aria-label="Settings">' +
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="13" cy="8" r="1.5" fill="currentColor"/></svg></button>' +
    '<span class="setmenu" role="menu" hidden>' +
    '<span class="col"><span class="lab">Group by</span>' +
    GROUPS.map((g) => '<button type="button" role="menuitemradio" data-act="set-group" data-value="' + g + '"' + (g === p.ask.group ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + ">" + esc(GROUP_WORD[g]) + "</button>").join("") + "</span>" +
    '<span class="col"><span class="lab">Dates as</span>' +
    FORMATS.map((f) => '<button type="button" role="menuitemradio" data-act="set-dates" data-value="' + f + '"' + (f === p.ask.dates ? ' class="on" aria-checked="true"' : ' aria-checked="false"') + ">" + esc(FORMAT_WORD[f]) + "</button>").join("") + "</span>" +
    "</span></span></nav>";
  /* the way back to the client's platform, above the title (§356.14) */
  const back = '<a class="back" href="' + esc(clientHref(p.slug, null, "")) + '"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(p.tenantName) + "</a>";
  const title = back + '<h2 class="pt">' + esc(VIEW_WORD[view]) +
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
