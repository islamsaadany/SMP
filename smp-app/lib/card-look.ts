/* ── MY TASKS' LOOK, FOR THE OFFICE'S MODULES (§646) ─────────────────────
   Islam, of design-mockups/modules-look/2026-10-26_modules-in-my-tasks-look.html:
   *"proceed"*, after answering its four questions — the band follows the
   client's colour (the Tracker too, reversing §499), the sentence under the
   title stays, the typeface is the main screens', and on the Tracker the
   card's header with the filters freezes with the band.

   The Internal Tracker, Meeting Notes and Insights wear what My tasks wears
   in the console (smp-app/shell/platform.html, §622.3–§622.5): Home's band
   (the gold line, the title in Georgia, a sentence, the counts, two circles
   at its right), ONE card whose header holds the title, its count and the
   page's filters, the groups labelled inside it over a grey rule, and rows
   striped light grey and white, grey first.

   LAID AFTER THE PAGE'S OWN STYLESHEET, never in place of it: the markup the
   scripts and the checks read (.mast, h2.pt, .cats, .sh, .row, .find) keeps
   its names, and this file decides only how it looks. Portfolio keeps
   lib/ledger.ts as it is, because nobody asked for it.

   The band's inks come from the client's own colour (lib/branding.ts
   barVars), so a client with a light colour gets dark words on it. The
   dark block is written as a media block on :root because themedCss
   (lib/topbar.ts) turns exactly that shape into the three theme states. */

export const CARD_LOOK_CSS = `
:root{--ground:#F5F6F9;--surface:#FFFFFF;--surface-2:#EDF0F5;--zebra:#F4F6F9;--line:#D8DEE8;--line-2:#E6EAF1;--line-soft:#E6EAF1;
  --ink:#141C2B;--ink-2:#465268;--ink-3:#5E6E85;--gold:#9C5D08;--amber:#F5A623;--amber-ink:#231500;--amber-wash:#FEF4E2;
  --shadow:0 1px 2px rgba(20,28,43,.06),0 8px 26px rgba(20,28,43,.07);
  --font:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--title:Georgia,'Times New Roman',serif}
@media (prefers-color-scheme:dark){:root{--ground:#12151C;--surface:#1A1F29;--surface-2:#222834;--zebra:#1F2531;--line:#333B4A;--line-2:#2A313E;--line-soft:#2A313E;
  --ink:#E7EBF2;--ink-2:#AAB4C6;--ink-3:#8E99AC;--gold:#F5A623;--amber-wash:#2B2210;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.35)}}
body{font-family:var(--font)}
.pg{max-width:1000px}
/* THE BAND: Home's, in the client's colour */
.mast,.mast.flat{position:relative;overflow:hidden;border-radius:14px;padding:16px 22px 17px;margin:0 0 16px;box-shadow:none;min-height:113px;display:flex;flex-direction:column;justify-content:flex-end}
.mast::before{content:"";position:absolute;width:300px;height:300px;right:-90px;top:-120px;border-radius:50%;border:1.5px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);pointer-events:none}
.mast::after{content:"";position:absolute;width:210px;height:210px;right:-20px;top:-70px;border-radius:50%;border:1.5px solid rgba(255,255,255,.07);pointer-events:none}
.mast>*{position:relative}
.mast .mrow{align-items:flex-end;gap:16px}
.mast .wkof{font:700 10.5px/1.5 var(--font);letter-spacing:.16em;margin:0 0 4px;color:var(--bar-accent)}
.mast h2.pt{font:400 27px/1.15 var(--title);letter-spacing:0}
.mast .lsub{margin:4px 0 0;font:400 13.5px/1.5 var(--font);color:var(--bar-quiet)}
.mast .strip{gap:20px}
.mast .tile b{font:600 19px/1 var(--font)}
.mast .tile span{font:600 10.5px/1.5 var(--font);letter-spacing:.1em}
.mast .ends{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap}
.mast .act{border:0;border-radius:9px;background:var(--amber);color:var(--amber-ink);font:700 13px/1.5 var(--font);padding:8px 14px;cursor:pointer;white-space:nowrap}
.mast .act:hover{filter:brightness(1.05)}
.mast .act:focus-visible{outline:2px solid var(--bar-ink);outline-offset:2px}
/* THE CARD: its header holds the title, the count and the filters */
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);overflow:clip;margin:0 0 16px}
.chd{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:10px 14px;border-bottom:1px solid var(--line-soft)}
.cic{flex:none;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:var(--amber-wash);color:var(--gold)}
.cic svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
.chd h2{margin:0;font:700 19px/1.15 var(--title);color:var(--ink);white-space:nowrap}
.chd .ccnt{display:inline-block;font:700 11.5px/1.5 var(--font);border-radius:999px;padding:1px 8px;background:var(--surface-2);color:var(--ink-2);font-variant-numeric:tabular-nums}
.chd .sp{flex:1}
.chd .cx{display:inline-flex;align-items:center;gap:6px;font:400 12px/1.4 var(--font);color:var(--ink-3);white-space:nowrap;min-width:0;max-width:100%}
/* the views, as My tasks' switch */
.chd .cats{display:inline-flex;gap:0;margin:0;padding:2px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;max-width:100%}
.chd .cats::-webkit-scrollbar{display:none}
.chd .cats a{font:600 12px/1.4 var(--font);color:var(--ink-2);padding:3px 9px;border:0;border-radius:6px;text-decoration:none;white-space:nowrap}
.chd .cats a[aria-current="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(20,28,43,.08)}
.chd .cats a:hover{color:var(--ink)}
.chd .cats a:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
/* the search, as My tasks' box */
.chd .find{flex:0 1 210px;display:flex;align-items:center;gap:6px;margin:0;border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:3px 4px 3px 9px;color:var(--ink-3)}
.chd .find:focus-within{border-color:var(--gold)}
.chd .find svg{width:13px;height:13px;flex:none}
.chd .find .srch{font:400 12.5px/1.5 var(--font);padding:1px 0}
.chd .find .go{font:600 12px/1 var(--font);padding:3px 4px}
/* THE GROUPS: a label over a grey rule, as on My tasks */
.card .sh{align-items:baseline;gap:8px;padding:14px 14px 7px;border-bottom:2px solid var(--line)}
.card .sh .ix{display:none}
.card .sh h3{font:700 11px/1.4 var(--font);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.card .sh .meta{font:600 11.5px/1.4 var(--font);color:var(--ink-3)}
.card .sec{margin:0}
.card .none{padding:16px 14px 18px;margin:0}
`;

/* THE BAND. `tiles` are drawn as given — a count that was not read is the
   caller's to say as a dash (§35) — and `act` is the page's one button, at
   the band's right as Clients carries + Add a client. */
export type Tile = { n: string | number; label: string; late?: boolean; title?: string };
export function bandHtml(o: { esc: (s: unknown) => string; eyebrow: string; title: string; sentence: string; tiles?: Tile[]; act?: string; eyebrowHtml?: string }): string {
  const e = o.esc;
  const strip = o.tiles && o.tiles.length
    ? '<div class="strip">' + o.tiles.map((t) =>
      '<div class="tile' + (t.late ? " late" : "") + '"' + (t.title ? ' title="' + e(t.title) + '"' : "") + "><b>" + e(t.n) + "</b><span>" + e(t.label) + "</span></div>").join("") + "</div>"
    : "";
  return '<header class="mast"><div class="mrow"><div class="mt"><div class="wkof">' + (o.eyebrowHtml != null ? o.eyebrowHtml : e(o.eyebrow)) + '</div><h2 class="pt">' + e(o.title) + "</h2>" +
    '<p class="lsub">' + e(o.sentence) + "</p></div>" +
    (strip || o.act ? '<div class="ends">' + strip + (o.act || "") + "</div>" : "") + "</div></header>";
}

/* THE CARD'S HEADER: its icon, its title, its count, and on the right what
   filters it. `right` is markup the page has already escaped. */
export const ICON = {
  tasks: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
  cal: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
} as const;
export function cardHead(o: { esc: (s: unknown) => string; icon: keyof typeof ICON; title: string; count?: string | number | null; right?: string }): string {
  return '<div class="chd"><span class="cic" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICON[o.icon] + "</svg></span>" +
    "<h2>" + o.esc(o.title) + "</h2>" + (o.count != null ? '<span class="ccnt">' + o.esc(o.count) + "</span>" : "") +
    '<span class="sp"></span>' + (o.right || "") + "</div>";
}
