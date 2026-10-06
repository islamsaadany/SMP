/* ── ONE TOP BAR FOR EVERY MODULE (§444) ──────────────────────────────────
   Islam, of Strategy's bar: *"we need to maintain this top bar across all the
   modules as this would be the main navigation bar across all the module and
   clients."* Measured first: Strategy and the settings pages drew the trail
   (Platform › client ▾ › module ▾), Viewing as, the theme switch and Sign out;
   Insights, the Internal Tracker and Meeting Notes each drew a navy bar of
   their own with a four-square button and none of those — so walking from
   Strategy into another module lost the way to other clients and the way to
   sign out. Settled from a mockup (design-mockups/top-bar-modules/), with his
   four answers: Viewing as only where it changes something (Insights, not the
   Tracker or Notes); the trail is the consultants' alone; the console keeps
   its own bar; white everywhere.

   ONE PLACE, SO THE THREE CANNOT DRIFT (§53.5). Each module page used to carry
   its own copy of the switcher, byte for byte; they call `topBarHtml()` now
   and the copies are deleted (§24). Strategy's own bar is the frozen shell's
   and is the reference this one is drawn after, not a second thing to keep
   in step by hand — the classes and sizes below are its own (platform.css
   §400 / §401 / §425).

   WHAT IS SERVER-DRAWN AND WHAT IS NOT: everything the server already knows
   is in the markup — the client, the module menu (every module, a rule,
   every module's settings, Client settings, §425's one full list), the
   viewer. The OTHER clients are the one thing it does not hold here, so
   `/topbar.js` asks `/api/platform {action:"clients"}` exactly as the trail
   does in Strategy (shell/route.js askClients, §401), and until it answers
   the menu says so.

   THE THEME SWITCH HAD TO REACH THE PAGE, NOT ONLY THE BAR. The module pages
   followed the device alone (`@media (prefers-color-scheme:dark)`), so a
   switch that set `data-theme` would have flipped the bar and left the page
   behind it. `themedCss()` rewrites a page's dark block into the three-state
   shape the platform uses (a guarded media block, and the same values under
   `[data-theme="dark"]`), and the script sets the attribute in the head,
   before the body paints, from the same `smp.theme` key Strategy reads — the
   same browser, so the same choice. */
import type { ModuleKey } from "./modules.ts";
import { MODULE_DEF, moduleMenu, clientHref, DEFAULT_MODULE } from "./modules.ts";

export type TopViewer = {
  /* the person whose eyes the page is drawn through, and the signed-in one */
  current: string;
  self: string;
  people: { key: string; name: string; note: string }[];
};
export type TopBar = {
  slug: string;
  tenantName: string;
  module: ModuleKey;
  have: ModuleKey[];
  /* Forefront's own people (a session whose kind is not "client"). Only they
     get the trail — Islam: "they don't get it it's only for the consultants". */
  consultant: boolean;
  viewer?: TopViewer | null;
};

const esc = (v: unknown): string =>
  String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]!);

const DOWN = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.6 5 6.6 8 3.6" ' +
  'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function item(label: string, href: string, here: boolean, note?: string): string {
  return '<a role="menuitem" href="' + esc(href) + '"' + (here ? ' aria-current="true"' : "") + ">" + esc(label) +
    (note ? '<span class="tbsub">' + esc(note) + "</span>" : "") + "</a>";
}

export function topBarHtml(t: TopBar): string {
  const right = viewerHtml(t) +
    '<div class="tbacts"><button class="tbtheme" id="tbtheme" type="button" aria-label="Theme"></button>' +
    '<button class="tbout" id="tbout" type="button" data-door="/' + esc(t.slug) + '/sign-in">Sign out</button></div>';
  /* `trail-for-staff` is the falsification route.js already answers to
     (§400): the same rule broken on this bar must turn checks/modules.mjs §5b
     red, so the one break exercises both bars (§94.5). Never set on a
     deployment (constitution XVI). */
  const brk = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";
  if (!t.consultant && brk !== "trail-for-staff") {
    /* A CLIENT'S OWN PERSON: no trail and no module menu (his rule), and the
       product's name is the way back into their platform, so a page reached
       by its address is never a room with no door (§61). */
    return '<header class="tb"><div class="tbin">' +
      '<a class="tbbrand" href="' + esc(clientHref(t.slug, DEFAULT_MODULE, "")) + '">Strategy Management Platform</a>' +
      '<span class="tborg">' + esc(t.tenantName) + "</span>" + right + "</div></header>";
  }
  const mods = moduleMenu(t.have);
  /* A module that lives inside another (the Copilot, §501) is not in this
     menu, so its own page wears and marks the module it lives in — the trail
     reads Strategy, which is where it is reached from. */
  const here: ModuleKey = MODULE_DEF[t.module].inside || t.module;
  const modItems = mods.map((m) => item(m.label, clientHref(t.slug, m.key, ""), m.key === here, m.note)).join("") +
    (mods.length ? '<div class="tbrule" role="separator"></div>' : "") +
    mods.map((m) => item(m.label + " settings", clientHref(t.slug, m.key, "setup"), false)).join("") +
    item("Client settings", "/" + t.slug + "/setup", false);
  const sep = '<span class="tbsep" aria-hidden="true">›</span>';
  return '<header class="tb"><div class="tbin">' +
    '<nav class="tbtrail" aria-label="Where you are">' +
      '<a class="tbff" href="/platform">Platform</a>' + sep +
      '<details class="tbstep tbclient"><summary><span>' + esc(t.tenantName) + "</span>" + DOWN + "</summary>" +
        '<div class="tbmenu" role="menu" data-clients="' + esc(t.slug) + '">' +
          '<div class="tbquiet">Reading your clients…</div><div class="tbrule" role="separator"></div>' +
          item("All clients", "/platform#clients", false) + "</div></details>" + sep +
      '<details class="tbstep tbmod"><summary><span>' + esc(MODULE_DEF[here].label) + "</span>" + DOWN + "</summary>" +
        '<div class="tbmenu" role="menu">' + modItems + "</div></details>" +
    "</nav>" + right + "</div></header>";
}

function viewerHtml(t: TopBar): string {
  const v = t.viewer;
  if (!v || !v.people.length) return "";
  const cur = v.people.find((p) => p.key === v.current);
  return '<div class="tbviewer"><label for="tbas">Viewing as</label>' +
    '<select id="tbas" data-self="' + esc(v.self) + '">' +
    v.people.map((p) => '<option value="' + esc(p.key) + '"' + (p.key === v.current ? " selected" : "") + ">" +
      esc(p.name) + "</option>").join("") +
    "</select>" + (cur && cur.note ? '<span class="tbnote">' + esc(cur.note) + "</span>" : "") + "</div>";
}

/* The script is a file, never inline: the shell's policy is `script-src
   'self'` (lib/shell.ts SHELL_CSP), so an inline handler would render
   perfectly and never run. Loaded in the HEAD so the theme lands before the
   body paints. */
export const TOPBAR_SCRIPT_TAG = '<script src="/topbar.js"></script>\n';

const TOPBAR_CSS_RAW = `
@font-face{font-family:'Source Sans 3';font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/Source_Sans_3.woff2) format('woff2')}
:root{--tb-surface:#FFFFFF;--tb-surface-2:#EFF2F6;--tb-line:#D6DCE5;--tb-ink:#171B22;--tb-ink-2:#414A58;--tb-ink-3:#636C79;--tb-soft:#24487A;--tb-gold:#C9A24D}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--tb-surface:#1C2027;--tb-surface-2:#242932;--tb-line:#333A45;--tb-ink:#E9ECF1;--tb-ink-2:#B4BCC8;--tb-ink-3:#949DAA;--tb-soft:#5C82BC;--tb-gold:#D9B665}}
:root[data-theme="dark"]{--tb-surface:#1C2027;--tb-surface-2:#242932;--tb-line:#333A45;--tb-ink:#E9ECF1;--tb-ink-2:#B4BCC8;--tb-ink-3:#949DAA;--tb-soft:#5C82BC;--tb-gold:#D9B665}
.tb{background:var(--tb-surface);border-bottom:1px solid var(--tb-line);color:var(--tb-ink);font-family:'Source Sans 3',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;position:relative;z-index:30}
.tbin{display:flex;align-items:center;gap:16px;padding:0 24px;min-height:40px}
.tbtrail{display:flex;align-items:center;gap:6px;min-width:0;margin-right:auto;font-size:13.5px;white-space:nowrap}
.tbff{color:var(--tb-ink-2);text-decoration:none;font-weight:600;letter-spacing:.04em;font-size:12px;text-transform:uppercase}
.tbff:hover{color:var(--tb-ink);text-decoration:underline}
.tbsep{color:var(--tb-ink-3);font-size:15px;line-height:1}
.tbstep{position:relative}
.tbstep>summary{list-style:none;display:inline-flex;align-items:center;cursor:pointer;gap:6px;padding:3px 7px;border-radius:7px;color:var(--tb-ink);font-weight:600}
.tbstep>summary::-webkit-details-marker{display:none}
.tbclient>summary{color:var(--tb-ink-2)}
.tbstep>summary:hover,.tbstep[open]>summary{background:var(--tb-surface-2);color:var(--tb-ink)}
.tbstep>summary>span{overflow:hidden;text-overflow:ellipsis;max-width:220px}
.tbstep>summary>svg{width:10px;height:10px;flex:none;color:var(--tb-ink-3)}
.tbmenu{position:absolute;z-index:40;top:calc(100% + 6px);left:0;min-width:290px;background:var(--tb-surface);border:1px solid var(--tb-line);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.16);padding:4px 0;white-space:normal}
.tbmenu a{display:block;text-decoration:none;font-size:13.5px;color:var(--tb-ink);padding:9px 14px}
.tbmenu a:hover{background:var(--tb-surface-2)}
.tbmenu a[aria-current="true"]{font-weight:700}
.tbsub{display:block;font-size:11.5px;color:var(--tb-ink-2);margin-top:2px;font-weight:400}
.tbquiet{padding:9px 14px;font-size:13.5px;color:var(--tb-ink-2);font-style:italic}
.tbrule{height:1px;background:var(--tb-line);margin:4px 0}
.tbbrand{font-weight:600;font-size:14px;color:var(--tb-ink);text-decoration:none}
.tbbrand:hover{text-decoration:underline}
.tborg{color:var(--tb-ink-3);font-size:13.5px;margin-right:auto}
.tbviewer{display:flex;align-items:center;gap:8px;padding-right:16px;border-right:1px solid var(--tb-line);min-width:0}
.tbviewer label{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--tb-ink-2);white-space:nowrap}
.tbviewer select{font-family:inherit;font-size:12.5px;max-width:260px;border:1px solid var(--tb-line);border-radius:5px;padding:2px 6px;background:var(--tb-surface);color:var(--tb-ink)}
.tbnote{font-size:12.5px;color:var(--tb-ink-3);white-space:nowrap}
.tbacts{display:flex;align-items:center;gap:10px}
.tbtheme{width:26px;height:26px;padding:0;border-radius:50%;border:1px solid var(--tb-line);background:none;color:var(--tb-ink-3);display:grid;place-items:center;cursor:pointer}
.tbtheme svg{width:14px;height:14px}
.tbout{font-family:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--tb-ink-3);background:none;border:1px solid var(--tb-line);border-radius:99px;padding:5px 14px;cursor:pointer}
.tbtheme:hover,.tbout:hover{border-color:var(--tb-soft);color:var(--tb-ink)}
.tb a:focus-visible,.tb button:focus-visible,.tb summary:focus-visible,.tb select:focus-visible{outline:2px solid var(--tb-gold);outline-offset:2px}
@media (max-width:760px){.tbin{flex-wrap:wrap;padding:6px 16px;gap:8px}.tbviewer{border-right:0;padding-right:0}}
`;

/* ── THE COLOUR SWEEP'S BREAK (§484's own audit, constitution XVI) ─────────
   `bar-ink` makes this bar's own ink unreadable, which must turn
   `checks/module-look.mjs` red on EVERY ONE of the five served module pages
   (§94.5) — one edit for one claim, and the claim is that all five are
   genuinely opened and measured rather than listed. A break per module would
   be five edits saying the same thing once each. Never set on a deployment.

   TWO SUBSTITUTIONS, BECAUSE NO ONE COLOUR FAILS AGAINST BOTH GROUNDS: a
   value dark enough to fail on white passes on #1C2027 and the other way
   round (#808A96 is 3.50 on white and 4.66 on the dark surface), so the
   light token and the dark one each move — the dark value is spelt twice,
   once per dark block, so it is `replaceAll` or the explicit-dark half of
   every page stays readable and the break only half lands (§94.2).

   THE RATIOS BELOW ARE MEASURED AND NOT PREDICTED. The first version of this
   comment stated the dark one as 1.54 from its own arithmetic, and the run
   reads 1.30 on the menu's surface and 1.16 on the open summary's — worth
   correcting rather than leaving, because a figure in a comment is read as an
   observation (§124). Its first red run printed 2.07 in BOTH themes, which is
   the light value on a white ground: that is what exposed the dark half of
   the sweep measuring light twice (checks/module-look.mjs's `call()`). */
const BARBRK = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";
export const TOPBAR_CSS = BARBRK === "bar-ink"
  ? TOPBAR_CSS_RAW
      .replace("--tb-ink:#171B22", "--tb-ink:#AEB5BE")        /* 2.07 on #FFFFFF */
      .replaceAll("--tb-ink:#E9ECF1", "--tb-ink:#2E343D")     /* 1.30 on #1C2027 */
  : TOPBAR_CSS_RAW;

/* A page's dark block, made to answer the switch as well as the device. The
   page's values are taken as they are — nothing about its colours moves —
   and repeated under `[data-theme="dark"]`, with the media block guarded so
   an explicit Light wins on a dark device. */
export function themedCss(css: string): string {
  const head = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{/g;
  let out = "", last = 0, m: RegExpExecArray | null;
  while ((m = head.exec(css))) {
    let i = m.index + m[0].length, depth = 1;
    const start = i;
    while (i < css.length && depth) { if (css[i] === "{") depth++; else if (css[i] === "}") depth--; i++; }
    const body = css.slice(start, i - 1);            // the :root's declarations
    let j = i; while (j < css.length && css[j] !== "}") j++; // the media block's own close
    out += css.slice(last, m.index) +
      '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + body + '}}' +
      ':root[data-theme="dark"]{' + body + "}";
    last = j + 1;
    head.lastIndex = last;
  }
  return out + css.slice(last);
}

export const TOPBAR_SCRIPT = `/* §444 — the top bar every module draws (lib/topbar.ts). */
(function () {
  var KEY = "smp.theme";
  function read() {
    try { var v = localStorage.getItem(KEY); if (v === "light" || v === "dark") return v; } catch (e) {}
    try { return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) {}
    return "light";
  }
  var mode = read();
  document.documentElement.setAttribute("data-theme", mode);
  var ICONS = {
    light: '<circle cx="10" cy="10" r="3.7" fill="currentColor"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6"/><path d="M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6M15.9 15.9l-1.6-1.6M5.7 5.7L4.1 4.1"/></g>',
    dark: '<path d="M15.8 12.6A6.6 6.6 0 0 1 7.4 4.2a6.9 6.9 0 1 0 8.4 8.4z" fill="currentColor"/>'
  };
  function paintTheme(btn) {
    btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true">' + ICONS[mode] + "</svg>";
    var next = mode === "light" ? "dark" : "light";
    btn.title = "Theme: " + mode + " \\u2014 click for " + next;
    btn.setAttribute("aria-label", btn.title);
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function wire() {
    var bar = document.querySelector("header.tb");
    if (!bar) return;
    var t = document.getElementById("tbtheme");
    if (t) {
      paintTheme(t);
      t.addEventListener("click", function () {
        mode = mode === "light" ? "dark" : "light";
        try { localStorage.setItem(KEY, mode); } catch (e) {}
        document.documentElement.setAttribute("data-theme", mode);
        paintTheme(t);
      });
    }
    var out = document.getElementById("tbout");
    if (out) out.addEventListener("click", function () {
      var door = out.getAttribute("data-door") || "/";
      fetch("/api/auth", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: '{"action":"logout"}' })
        .catch(function () {}).then(function () { location.replace(door); });
    });
    /* Viewing as: the page is drawn again through the chosen person's eyes,
       carried on the address the route already reads (lib/view-as.ts). */
    var as = document.getElementById("tbas");
    if (as) as.addEventListener("change", function () {
      var u = new URL(location.href);
      if (as.value && as.value !== as.getAttribute("data-self")) u.searchParams.set("viewAs", as.value);
      else u.searchParams.delete("viewAs");
      location.assign(u.toString());
    });
    /* ...and every link and form of this module keeps it, or the first press
       inside the page would quietly hand the office its own face back. */
    var va = new URL(location.href).searchParams.get("viewAs");
    if (va) {
      var mine = location.pathname.split("/").slice(0, 3).join("/");
      Array.prototype.forEach.call(document.querySelectorAll("a[href]"), function (a) {
        if (bar.contains(a)) return;
        try {
          var h = new URL(a.getAttribute("href"), location.href);
          if (h.origin !== location.origin || h.pathname.indexOf(mine) !== 0) return;
          h.searchParams.set("viewAs", va); a.setAttribute("href", h.pathname + h.search + h.hash);
        } catch (e) {}
      });
      Array.prototype.forEach.call(document.querySelectorAll("form"), function (f) {
        if ((f.getAttribute("method") || "get").toLowerCase() !== "get") return;
        var i = document.createElement("input"); i.type = "hidden"; i.name = "viewAs"; i.value = va; f.appendChild(i);
      });
    }
    /* The other clients, asked once, as the trail in Strategy asks (§401). */
    var cm = bar.querySelector("[data-clients]");
    if (cm) {
      var slug = cm.getAttribute("data-clients");
      var fill = function (list) {
        var others = list.filter(function (x) { return x.key !== slug; });
        var h = others.length
          ? others.map(function (x) { return '<a role="menuitem" href="/' + esc(x.key) + '">' + esc(x.name) + "</a>"; }).join("")
          : '<div class="tbquiet">No other clients</div>';
        var q = cm.querySelector(".tbquiet");
        if (q) q.outerHTML = h;
      };
      fetch("/api/platform", { method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "clients" }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { fill(j && j.ok !== false && Array.isArray(j.clients) ? j.clients : []); })
        .catch(function () { fill([]); });
    }
    /* A press anywhere else closes an open menu, opening one shuts the other,
       and Escape shuts either (§401's own behaviour). */
    var shut = function (keep) {
      Array.prototype.forEach.call(bar.querySelectorAll("details[open]"), function (d) { if (d !== keep) d.open = false; });
    };
    document.addEventListener("pointerdown", function (ev) {
      shut(ev.target && ev.target.closest ? ev.target.closest("header.tb details") : null);
    }, true);
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") shut(null); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
`;
