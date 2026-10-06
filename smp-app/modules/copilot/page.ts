/* ── THE COPILOT'S OWN PAGE AND ITS SETTINGS (§456, spec 064) ────────────
   Signed off from design-mockups/copilot-settings/2026-10-01_copilot-page-
   and-settings.html (rule 1c). Three documents, drawn by the server with no
   script at all — the filters are a GET form, so a filtered list is a link
   somebody can send and Back works, which is the shape Insights already
   chose for the same reason (modules/insights/page.ts):

     /<client>/copilot                       every chat (or deliverable) on the client
     (its settings moved to Forefront's console in §501 — /platform#copilot)

   THE PAGE FINDS, THE TAB WORKS. A row is a link into its place's Copilot
   tab inside Strategy, ending in `#cop=chat-<id>` so the tab opens that chat
   (src/copilot.js DEEP). Nothing about a chat is done here, so nothing about
   a chat can be done in two places (§53.5).

   THE SETTINGS ARE THE SAME FOR EVERY CLIENT (Islam, 2026-10-01), so the page
   says so in a chip, and only a Forefront super user is offered Edit or
   Replace. The office reads them; the refusal on the server is the rule
   (lib/copilot-settings.ts). Who may USE the Copilot is not here — it stays
   a column on Strategy's Roles & access (Islam: "stay"), and the rail says
   where in one row rather than drawing a page that would be a second copy. */
import { clientHref, MODULE_DEF, type ModuleKey } from "../../lib/modules.ts";
import { topBarHtml, TOPBAR_CSS, TOPBAR_SCRIPT_TAG, themedCss } from "../../lib/topbar.ts";
import { barFor, barVars } from "../../lib/branding.ts";
import { SECTIONS, SECTION_WORD, type Chat, type Deliverable } from "../../lib/copilot.ts";

const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const CSS = `
*{box-sizing:border-box}
:root{%BARVARS%;--ink:#141C2B;--ink-2:#414A58;--ink-3:#5E6E85;--line:#D8DEE8;--ground:#F5F6F9;--surface:#FFF;--surface-2:#EFF2F6;--gold:#9C5D08;--good-tx:#1E6B41;--bad-tx:#A23123;--note:#FFF7E3}
@media (prefers-color-scheme:dark){:root{--ink:#E7EBF2;--ink-2:#B4BCC8;--ink-3:#8F9AAD;--line:#333B4A;--ground:#12151C;--surface:#1A1F29;--surface-2:#222833;--gold:#F5A623;--good-tx:#6FCF97;--bad-tx:#F19A8E;--note:#2E2A1C}}
body{margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.crumbs{color:var(--ink-3);font-size:13px}.crumbs a{color:inherit}
.pg{max-width:1180px;margin:0 auto;padding:20px 20px 48px;display:flex;flex-direction:column;gap:14px}
.head{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.head h2{margin:0 auto 0 0;font-size:21px;font-weight:600}
.chip{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px;color:var(--ink-2);background:var(--surface)}
.btn{border:1px solid var(--line);border-radius:7px;padding:6px 13px;font:600 13px/1.4 inherit;background:var(--surface);color:var(--ink);text-decoration:none;cursor:pointer;display:inline-block}
.btn:hover,.btn:focus-visible{border-color:var(--gold);outline:none}
.btn.solid{background:var(--bar);color:var(--bar-ink);border-color:var(--bar)}
.btn.quiet{border-color:transparent;background:transparent;color:var(--ink-3);padding-inline:6px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:7px;overflow:hidden;flex-wrap:wrap;background:var(--surface)}
.seg a{padding:6px 13px;font-size:13.5px;border-right:1px solid var(--line);color:var(--ink-2);text-decoration:none}
.seg a:last-child{border-right:0}
.seg a[aria-current="true"]{background:var(--bar);color:var(--bar-ink)}
.seg a:hover:not([aria-current]),.seg a:focus-visible{background:var(--surface-2);outline:none}
.filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.filters form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex:1 1 420px;min-width:0}
.filters select,.filters input[type=search]{border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink);padding:6px 10px;font:400 13.5px/1.4 inherit}
.filters input[type=search]{flex:1 1 200px;min-width:0}
.cnt{font:600 10.5px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-left:auto}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:640px}
th{background:var(--bar);color:var(--bar-ink);text-align:left;font:600 11.5px/1.3 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:8px 12px;white-space:nowrap}
td{padding:8px 12px;border-bottom:1px solid var(--line);white-space:nowrap;max-width:360px;overflow:hidden;text-overflow:ellipsis;font-size:14px}
tr:last-child td{border-bottom:0}
tbody tr:nth-child(even) td{background:var(--surface-2)}
td a{color:var(--ink);font-weight:600;text-decoration:none}
td a:hover,td a:focus-visible{text-decoration:underline;outline:none}
td.q{color:var(--ink-3)}
.none{padding:30px 16px;color:var(--ink-3);font-size:14px;max-width:62ch}
.none b{color:var(--ink);display:block;font-size:15.5px;margin-bottom:5px}
.split{display:grid;grid-template-columns:220px minmax(0,1fr);gap:0;align-items:start;border:1px solid var(--line);border-radius:10px;background:var(--surface);overflow:hidden}
.rail{background:var(--surface-2);border-right:1px solid var(--line);padding:12px 0;align-self:stretch;display:flex;flex-direction:column}
.rail .rh{font:700 11px system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding:4px 16px 10px}
.rail .g{font:700 10.5px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);padding:8px 16px 4px}
.rail a.it{display:block;padding:7px 16px;color:var(--ink-2);text-decoration:none;font-size:14px}
.rail a.it[aria-current="true"]{background:var(--surface);color:var(--ink);font-weight:600;box-shadow:inset 3px 0 0 var(--gold)}
.rail a.it:hover:not([aria-current]),.rail a.it:focus-visible{background:var(--surface);outline:none}
.rail .foot{border-top:1px solid var(--line);margin-top:auto;padding:10px 16px 2px;display:flex;flex-direction:column;gap:6px;font-size:13px}
.rail .foot a{color:var(--gold);text-decoration:none;font-weight:600}
.rail .foot span{color:var(--ink-3)}
.pane{padding:16px 20px 20px;min-width:0;display:flex;flex-direction:column;gap:12px}
details.part{border:1px solid var(--line);border-radius:8px;background:var(--surface)}
details.part>summary{padding:9px 12px;cursor:pointer;display:flex;gap:10px;align-items:baseline;list-style:none}
details.part>summary::-webkit-details-marker{display:none}
details.part>summary b{min-width:22px;color:var(--gold)}
details.part>summary .t{font-weight:600}
details.part>summary .m{margin-left:auto;color:var(--ink-3);font-size:12px}
.md{border-top:1px solid var(--line);padding:10px 16px 14px;color:var(--ink-2);font-size:14px;max-width:none}
.md h3,.md h4,.md h5,.md h6{color:var(--ink);margin:14px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.05em}
.md h3{font-size:14px}
.md p{margin:6px 0;max-width:86ch}
.md ul{margin:4px 0;padding-left:20px;max-width:86ch}
.md li{margin:2px 0}
.md strong{color:var(--ink)}
.edit{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding:12px 16px}
.edit textarea{width:100%;min-height:340px;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink);padding:10px;font:400 13px/1.5 ui-monospace,SFMono-Regular,monospace;resize:vertical}
.edit .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.flash{border:1px solid var(--line);border-radius:8px;padding:9px 12px;font-size:14px;background:var(--note);color:var(--ink)}
.flash.bad{color:var(--bad-tx)}
.edited{color:var(--good-tx);font-size:12px;font-weight:600}
.up{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.up input[type=file]{font-size:12px;max-width:220px;color:var(--ink-2)}
.why{color:var(--ink-3);font-size:13.5px;margin:0}
@media (max-width:760px){.split{grid-template-columns:1fr}.rail{border-right:0;border-bottom:1px solid var(--line)}}
`;

/* THE SHARED TOP BAR (main's §444): the Copilot's own pages wear the bar
   Insights, the Tracker and Notes wear, so walking here from Strategy keeps
   the way to other clients and to Sign out. No Viewing as — it is the
   office's page and the switch would change nothing (his §444 answer for
   the Tracker and Notes). Where you are inside the Copilot is a line under
   the bar, since the trail ends at the module. */
function frame(slug: string, tenantName: string, have: ModuleKey[], bar: string, crumbs: string, title: string, body: string, consultant = false): string {
  return "<!doctype html>\n<html lang='en' data-module='copilot'>\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " &mdash; " + esc(title) + "</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '<meta name="theme-color" content="' + esc(bar) + '">\n' +
    TOPBAR_SCRIPT_TAG + "<style>" + TOPBAR_CSS + themedCss(CSS.replace("%BARVARS%", barVars(bar))) + "</style>\n</head>\n<body>\n" +
    topBarHtml({ slug, tenantName, module: "copilot", have, consultant, viewer: null }) + "\n" +
    '<main class="pg">\n' + (crumbs ? '<div class="crumbs">' + crumbs + "</div>\n" : "") + body + "\n</main>\n</body>\n</html>\n";
}

/* ── WHERE A ROW SITS, IN WORDS ────────────────────────────────────────
   The place word is the product's own (lib/copilot.ts isPlace); the page
   reads the client's names for it once per document and spells an unknown
   one as itself rather than inventing a name (§35). */
export type Names = { places: Map<string, string>; people: Map<string, string> };
export function placeName(n: Names, place: string): string {
  if (place === "group") return "The group";
  return n.places.get(place) || place;
}
/* A place word as the Strategy address spells it (shell/route.js addressOf):
   `fn:` and `co:` become a path segment, everything else stands. */
export function placeSegment(place: string): string {
  if (/^fn:/.test(place)) return "fn/" + place.slice(3);
  if (/^co:/.test(place)) return "co/" + place.slice(3);
  return place;
}
export function openHref(slug: string, kind: "chat" | "deliv", row: { place: string; section: string; id: string }): string {
  return clientHref(slug, "strategy", placeSegment(row.place) + "/copilot/" + row.section) + "#cop=" + kind + "-" + row.id;
}

function when(iso: string): string {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export type ListAsk = { view: "chats" | "deliverables"; section: string; place: string; q: string };

export function listDocument(
  slug: string, tenantName: string, have: ModuleKey[], bar: string, names: Names, ask: ListAsk,
  chats: Chat[] | null, delivs: Deliverable[] | null, consultant = false,
): string {
  const here = clientHref(slug, "copilot", "");
  const href = (over: Partial<ListAsk>) => {
    const a = { ...ask, ...over }, p = new URLSearchParams();
    if (a.view === "deliverables") p.set("view", "deliverables");
    if (a.section) p.set("section", a.section);
    if (a.place) p.set("place", a.place);
    if (a.q) p.set("q", a.q);
    const s = p.toString();
    return here + (s ? "?" + s : "");
  };
  const q = ask.q.toLowerCase();
  const keep = (r: { place: string; section: string; title: string }) =>
    (!ask.section || r.section === ask.section) && (!ask.place || r.place === ask.place) &&
    (!q || r.title.toLowerCase().includes(q) || placeName(names, r.place).toLowerCase().includes(q));
  const isChats = ask.view !== "deliverables";
  const rows: Array<Chat | Deliverable> | null = isChats ? chats : delivs;
  const all = rows || [];
  const shown = all.filter(keep);
  /* The place filter offers the places that HAVE something, in the order
     they were last worked on — a list of every unit in the client would be
     mostly doors to nothing (§61). */
  const placesWithWork = Array.from(new Set(all.map((r) => r.place)));
  const opt = (v: string, label: string, cur: string) =>
    '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(label) + "</option>";

  const seg = '<nav class="seg" aria-label="Show">' +
    '<a href="' + esc(href({ view: "chats" })) + '"' + (isChats ? ' aria-current="true"' : "") + ">Chats</a>" +
    '<a href="' + esc(href({ view: "deliverables" })) + '"' + (!isChats ? ' aria-current="true"' : "") + ">Deliverables</a></nav>";
  const form = '<form method="get" action="' + esc(here) + '" role="search">' +
    (!isChats ? '<input type="hidden" name="view" value="deliverables">' : "") +
    '<select name="section" aria-label="Section">' + opt("", "All sections", ask.section) +
      SECTIONS.map((s) => opt(s, SECTION_WORD[s], ask.section)).join("") + "</select>" +
    '<select name="place" aria-label="Place">' + opt("", "All places", ask.place) +
      placesWithWork.map((p) => opt(p, placeName(names, p), ask.place)).join("") + "</select>" +
    '<input type="search" name="q" value="' + esc(ask.q) + '" placeholder="Search&hellip;" aria-label="Search">' +
    '<button class="btn" type="submit">Show</button></form>';
  const count = rows ? '<span class="cnt">' + shown.length + " " + (isChats ? (shown.length === 1 ? "chat" : "chats") : (shown.length === 1 ? "deliverable" : "deliverables")) + "</span>" : "";

  let table: string;
  if (!rows) {
    table = '<div class="tw"><div class="none"><b>The Copilot could not be read just now.</b>Nothing has been lost. Try again in a moment.</div></div>';
  } else if (!shown.length) {
    table = '<div class="tw"><div class="none">' + (all.length
      ? "<b>Nothing matches.</b>Clear the search or choose a different section or place."
      : isChats
        ? "<b>No chats yet.</b>A chat is started from the Copilot tab of a place in Strategy, and every one appears here."
        : "<b>No deliverables yet.</b>A deliverable is kept from a Copilot chat, and every one appears here.") + "</div></div>";
  } else if (isChats) {
    table = '<div class="tw"><table><thead><tr><th>Place</th><th>Section</th><th>Chat</th><th>By</th><th>Last activity</th></tr></thead><tbody>' +
      (shown as Chat[]).map((c) => "<tr><td>" + esc(placeName(names, c.place)) + "</td><td>" + esc(SECTION_WORD[c.section] || c.section) +
        '</td><td title="' + esc(c.title) + '"><a href="' + esc(openHref(slug, "chat", c)) + '">' + esc(c.title) + "</a></td>" +
        "<td>" + esc(names.people.get(c.by) || c.by || "—") + '</td><td class="q">' + esc(when(c.last || c.at)) + "</td></tr>").join("") +
      "</tbody></table></div>";
  } else {
    table = '<div class="tw"><table><thead><tr><th>Place</th><th>Section</th><th>Title</th><th>Version</th><th>Last by</th><th>Last change</th></tr></thead><tbody>' +
      (shown as Deliverable[]).map((d) => "<tr><td>" + esc(placeName(names, d.place)) + "</td><td>" + esc(SECTION_WORD[d.section] || d.section) +
        '</td><td title="' + esc(d.title) + '"><a href="' + esc(openHref(slug, "deliv", d)) + '">' + esc(d.title) + "</a></td>" +
        "<td>v" + esc(d.latest || 1) + "</td><td>" + esc(names.people.get(d.latestBy || d.by) || d.latestBy || d.by || "—") +
        '</td><td class="q">' + esc(when(d.latestAt || d.at)) + "</td></tr>").join("") +
      "</tbody></table></div>";
  }

  const body = '<div class="head"><h2>' + esc(MODULE_DEF.copilot.label) + "</h2>" +
    (consultant ? '<a class="btn" href="/platform#copilot">Copilot settings &rsaquo;</a>' : "") + "</div>" +
    '<div class="filters">' + seg + form + count + "</div>" + table;
  return frame(slug, tenantName, have, bar, "", "Copilot", body, consultant);
}

export async function barOf(tenantId: string): Promise<string> { return barFor(tenantId); }

export async function refusedCopilot(slug: string, tenantName: string, have: ModuleKey[], tenantId: string, why: string, consultant = false): Promise<string> {
  const bar = await barFor(tenantId);
  return frame(slug, tenantName, have, bar, "", "Copilot",
    '<div class="tw"><div class="none"><b>' + esc(why) + '</b><a href="' + esc(clientHref(slug, "strategy", "")) + '">Back to Strategy</a></div></div>', consultant);
}
