/* ── THE LEDGER LOOK, FOR THE MODULES THAT FOLLOW THE TRACKER (§605) ─────
   Islam, from design-mockups/modules-look/2026-10-23_one-look.html: *"ok for
   insights, meeting notes and projects"*. The three pages wear the Internal
   Tracker's furniture (modules/tracker/page.ts, §497): the client's panel
   with the name and the counts on the right, the underlined search line,
   numbered sections under a heavy rule, quiet rows and status words.

   ONE COPY FOR THE THREE, so they cannot come to disagree about a panel or a
   search line the way four hand-written stylesheets did (§53.5). The Tracker
   keeps its own: it is the reference these are drawn from, and it carries a
   pinned band and a write line none of these have.

   THE FONT FAMILY IS NAMED IN EVERY SHORTHAND, never `inherit` (§356.14,
   §584.3): a `font:` ending in a CSS-wide keyword is not CSS a browser will
   read, so the whole line is dropped and a button draws in the browser's own
   13.33px Arial — which is what these three pages did, Notes on thirteen
   rules. `ledger-inherit` puts that form back on the buttons and the search
   box, `ledger-fixed-bar` paints the panel the shipped navy whatever the
   client chose, and `ledger-phone-wide` holds the counts to a line wider
   than a phone; checks/module-look.mjs must go red on each (§94.5). The
   first goes red on Insights and Meeting Notes and NOT on Portfolio, whose
   own stylesheet already says `button{font:inherit}` — the longhand-free
   form a browser does read — so its one button keeps the page's face under
   the break. Measured, not assumed (§54.5). Never set on a deployment.

   The bar's inks come from the client's own colour (lib/branding.ts barVars),
   the same answer the Tracker's panel takes, so a client with a light colour
   gets dark words on it here too. */
import { barVars } from "./branding.ts";

const brk = () => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

/* The tokens every one of the three starts from: the Tracker's own values.
   A module adds what only it uses in a :root of its own after these. Dark
   is written as a media block on :root because themedCss (lib/topbar.ts)
   turns exactly that shape into the three theme states. */
export function ledgerCss(bar: string): string {
  const inherit = brk() === "ledger-inherit";
  const ctl = (w: number, s: string) => "font:" + w + " " + s + " " + (inherit ? "inherit" : "var(--font)");
  return `
*{box-sizing:border-box}
:root{${barVars(bar)};--ink:#141C2B;--ink-2:#465268;--ink-3:#5E6E85;--line:#D8DEE8;--line-2:#E6EAF0;--ground:#F7F8FA;--surface:#FFF;--surface-2:#EDF0F5;
  --gold:#9C5D08;--amber:#F5A623;--amber-ink:#231500;--good:#1B6E4E;--bad:#B23025;
  --font:'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8E99AC;--line:#333B4A;--line-2:#2A303C;--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;
  --gold:#F5A623;--good:#63BE96;--bad:#E8776B}}
body{margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.55 var(--font);-webkit-font-smoothing:antialiased}
[hidden]{display:none!important}
.pg{max-width:1000px;margin:0 auto;padding:20px 20px 48px}
/* the panel: the client, the page's name, its counts, its views */
.mast{background:${brk() === "ledger-fixed-bar" ? "#16325C" : "var(--bar)"};color:var(--bar-ink);border-radius:12px;padding:16px 20px 0;margin:0 0 18px;box-shadow:inset 0 -3px 0 var(--bar-accent)}
.mast.flat{padding-bottom:19px}
.mrow{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}
.wkof{font:600 11px/1 var(--font);letter-spacing:.14em;text-transform:uppercase;color:var(--bar-accent);margin:0 0 7px}
h2.pt{margin:0;font:600 24px/1.15 var(--font);letter-spacing:-.01em;color:var(--bar-ink)}
.strip{display:flex;gap:22px;font-variant-numeric:tabular-nums}
.tile{text-align:right;min-height:48px}
.tile b{display:block;font:600 22px/1 var(--font);color:var(--bar-ink)}
.tile span{display:block;font:600 10.5px/1.6 var(--font);letter-spacing:.1em;text-transform:uppercase;color:var(--bar-quiet);margin-top:3px;white-space:nowrap}
.tile.late b{color:var(--bar-late)}
.cats{display:flex;gap:2px;margin:14px 0 0;align-items:flex-end;flex-wrap:wrap}
.cats a{font:600 13.5px/1 var(--font);color:var(--bar-quiet);padding:10px 12px 12px;border-bottom:3px solid transparent;text-decoration:none}
.cats a[aria-current="true"]{color:var(--bar-ink);border-bottom-color:var(--bar-accent)}
.cats a:hover,.cats a:focus-visible{color:var(--bar-ink);outline:none}
/* the line under the panel: the search on the left, the page's one action on the right */
.tools{display:flex;gap:18px;align-items:center;margin:0 0 22px;flex-wrap:wrap}
.tools .sp{flex:1}
.find{display:flex;align-items:center;gap:8px;flex:0 1 280px;min-width:0;margin:0;border-bottom:1.5px solid var(--line);padding:6px 2px;color:var(--ink-3)}
.find:focus-within{border-bottom-color:var(--gold)}
.find svg{width:14px;height:14px;flex:none}
.srch{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);${ctl(400, "14px/1.5")};padding:2px 0;outline:none}
.srch::placeholder{color:var(--ink-3)}
.go{border:0;background:none;color:var(--ink-3);${ctl(600, "12.5px/1")};cursor:pointer;padding:4px 2px}
.go:hover,.go:focus-visible{color:var(--ink);outline:none}
.btn{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:6px 12px;${ctl(600, "13px/1.5")};cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-block}
.btn:hover,.btn:focus-visible{border-color:var(--gold);outline:none}
.btn.amber{background:var(--amber);border-color:var(--amber);color:var(--amber-ink)}
.btn.amber:hover{filter:brightness(1.05);border-color:var(--amber)}
.btn.amber:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.btn[disabled],.btn[aria-disabled="true"]{opacity:.55;cursor:default}
/* numbered sections under a heavy rule, the Tracker's own */
.sec{margin:0 0 30px}
.sh{display:flex;align-items:baseline;gap:12px;padding:0 0 8px;border-bottom:2px solid var(--ink)}
.sh .ix{font:600 12px/1 var(--font);color:var(--gold);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.sh h3{margin:0;font:600 17px/1.2 var(--font);min-width:0}
.sh .meta{font:400 13px/1 var(--font);color:var(--ink-3)}
.none{padding:30px 4px 10px;color:var(--ink-3);font-size:14px;max-width:60ch}
.none b{color:var(--ink);font-weight:600;display:block;font-size:15.5px;margin-bottom:6px}
.none a{color:var(--ink)}
/* a status said in words, with the Tracker's dash, in the colour of what it says */
.word{display:inline-flex;align-items:center;gap:7px;font:600 11px/1 var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);white-space:nowrap}
.word::before{content:"";width:12px;height:2px;background:currentColor;flex:none}
.word.ok{color:var(--good)}
.word.upd{color:var(--gold)}
@media (max-width:760px){.strip{gap:14px}.find{flex:1 1 180px}}
${brk() === "ledger-phone-wide" ? ".strip{min-width:640px}" : ""}
`;
}

export const LENS = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/* THE PANEL. `tiles` are drawn as given — a count that was not read is the
   caller's to say as a dash (§35) — and `views` is the row of links inside
   it, or nothing, in which case the panel closes under the name. */
export type Tile = { n: string | number; label: string; late?: boolean; title?: string };
export function mastHtml(o: { esc: (s: unknown) => string; eyebrow: string; title: string; tiles?: Tile[]; views?: string }): string {
  const e = o.esc;
  const strip = o.tiles && o.tiles.length
    ? '<div class="strip">' + o.tiles.map((t) =>
      '<div class="tile' + (t.late ? " late" : "") + '"' + (t.title ? ' title="' + e(t.title) + '"' : "") + "><b>" + e(t.n) + "</b><span>" + e(t.label) + "</span></div>").join("") + "</div>"
    : "";
  return '<header class="mast' + (o.views ? "" : " flat") + '"><div class="mrow"><div><div class="wkof">' + e(o.eyebrow) + '</div><h2 class="pt">' + e(o.title) + "</h2></div>" +
    strip + "</div>" + (o.views || "") + "</header>";
}

/* A numbered section's head: its place in the page, its name, and what it holds. */
export function sectionHead(esc: (s: unknown) => string, ix: number, title: string, meta = ""): string {
  return '<div class="sh"><span class="ix">' + String(ix).padStart(2, "0") + "</span><h3>" + esc(title) + "</h3>" +
    (meta ? '<span class="meta">' + esc(meta) + "</span>" : "") + "</div>";
}
