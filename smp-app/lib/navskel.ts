/* §620 — A PRESS THAT LEAVES THE PAGE SHOWS WHERE IT IS GOING, AT ONCE.
   Islam: "the navigation between the pages needs to be momentarily", and of
   the mockup (design-mockups/instant-navigation/2026-10-23_skeletons.html):
   "yes build it". Measured before (a 600ms round trip, §369's production
   figure): a press that opened another module, a client from the console or
   the console from a client left the page standing still for a round trip
   and then blank for another, with no sign the press had been heard.

   WHAT THIS DOES. On a press that is going to load another document of
   this platform, the page that was pressed draws the next page's grey shape
   over itself straight away — the client's top line with the module's name,
   and the module's shape in the platform's own skeleton greys (§94.10's
   bars, their slow pulse) — and the browser replaces it with the real page
   when that arrives. Nothing is fetched and nothing is remembered: it is a
   drawing, and the page it covers is still the page underneath.

   HEARD THROUGH THE NAVIGATION API, which reports every way a document is
   left — a link, `location.assign` (the console's cards and the Strategy
   trail), Back and Forward — with where it is going. A browser without it
   gets the drawing for plain links only, and otherwise behaves as before.

   AND IT NEVER STRANDS A PAGE UNDER A DRAWING:
     · a move the page cancels (an unsaved-work question answered "stay")
       takes it down — the check is made after every other listener has had
       its say, and again at the leave itself (`beforeunload`);
     · a page restored from the browser's back-forward memory takes it down
       on `pageshow`;
     · an address that answers with a file rather than a page leaves the
       page where it is, so the drawing comes down by itself after 8 s;
     · only this platform's own pages are drawn for: the console and a
       client's modules. Anything else — another site, an /api address, a
       file — draws nothing.

   ONE SOURCE, TWO WAYS IN: served on its own at /navskel.js for the console
   and the Strategy document, and appended to /topbar.js, which every other
   module page and Processes already load. `window.__navskel` keeps a page
   that has both from running it twice. */
import { createHash } from "node:crypto";
import { MODULE_DEF } from "./modules.ts";

const LABELS: Record<string, string> = Object.fromEntries(Object.entries(MODULE_DEF).map(([k, d]) => [k, d.label]));

/* SMP_BREAK=no-navskel serves the script empty, so checks/instant-nav.mjs
   can be proved able to fail. Never set on a deployment. */
export const NAVSKEL_SCRIPT = process.env.SMP_BREAK === "no-navskel" ? "/* §620: switched off for a check */\n" : `/* §620 — the next page's shape, drawn at the press (lib/navskel.ts). */
(function () {
  if (window.__navskel) return;
  window.__navskel = 1;
  var LABELS = ${JSON.stringify(LABELS)};
  var SKIP = /\\.(?:js|css|json|png|jpe?g|svg|webp|gif|pdf|pptx?|xlsx?|csv|docx?|zip|txt|mp4|webm)$/i;

  /* where a press is going, and which shape stands for it — or null */
  function where(url) {
    var u;
    try { u = new URL(url, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    var p = u.pathname.replace(/\\/+$/, "") || "/";
    if (SKIP.test(p)) return null;
    if (p === "/platform") return { kind: "console", tab: u.hash.replace(/^#/, "") };
    var m = /^\\/([a-z0-9][a-z0-9-]{0,48})(?:\\/([a-z-]+))?/.exec(p);
    if (!m || m[1] === "api" || m[1] === "platform" || m[2] === "sign-in") return null;
    var mod = m[2] || "strategy";
    if (mod === "setup") return { kind: "setup", slug: m[1], label: "Client settings" };
    if (!LABELS[mod]) return null;
    return { kind: mod, slug: m[1], label: LABELS[mod] };
  }

  /* the client's name, from what is on screen: this client's own page says
     it in its title, and a console card carries it on the card */
  var pressed = null;
  document.addEventListener("pointerdown", function (e) { pressed = e.target; }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") pressed = e.target; }, true);
  function clientName(slug) {
    var here = /^\\/([a-z0-9][a-z0-9-]{0,48})(?:\\/|$)/.exec(location.pathname);
    if (here && here[1] === slug) { var t = String(document.title || "").split(" \\u2014 ")[0].trim(); if (t) return t; }
    var card = pressed && pressed.closest ? pressed.closest("[data-name]") : null;
    return card ? card.getAttribute("data-name") : "";
  }

  var CSS = "#navskel{position:fixed;inset:0;z-index:2147483646;display:flex;flex-direction:column;" +
    "--ns-ground:#F5F6F9;--ns-surface:#FFFFFF;--ns-q:#EDF0F5;--ns-line:#D8DEE8;--ns-ink:#141C2B;--ns-ink3:#5E6E85;--ns-ff:#0F2C69;--ns-ffq:#A9BAD8;--ns-rule:rgba(255,255,255,.12);--ns-amber:#F5A623;--ns-navy:#0F2C69;--ns-sbon:#E8EEF8;--ns-sbink:#0F2C69;--ns-sbq:#5E6E85;--ns-wash:#FEF4E2;" +
    "background:var(--ns-ground);color:var(--ns-ink);font:400 14px/1.4 'Source Sans 3',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;cursor:progress}" +
    "@media (prefers-color-scheme:dark){html:not([data-theme=light]) #navskel{--ns-ground:#12151C;--ns-surface:#1A1F29;--ns-q:#222834;--ns-line:#333B4A;--ns-ink:#E7EBF2;--ns-ink3:#8590A3;--ns-ff:#0D2350;--ns-ffq:#95A9CC;--ns-sbon:#28303E;--ns-sbink:#E7EBF2;--ns-sbq:#8590A3;--ns-wash:#2B2210}}" +
    "html[data-theme=dark] #navskel{--ns-ground:#12151C;--ns-surface:#1A1F29;--ns-q:#222834;--ns-line:#333B4A;--ns-ink:#E7EBF2;--ns-ink3:#8590A3;--ns-ff:#0D2350;--ns-ffq:#95A9CC;--ns-sbon:#28303E;--ns-sbink:#E7EBF2;--ns-sbq:#8590A3;--ns-wash:#2B2210}" +
    "#navskel *{box-sizing:border-box}" +
    "#navskel .b{display:block;flex:none;height:13px;border-radius:6px;background:var(--ns-line);animation:nspulse 1.5s ease-in-out infinite}" +
    "#navskel .q{background:var(--ns-q)}#navskel .t{height:20px}#navskel .p{height:24px;border-radius:999px}#navskel .k{height:32px;border-radius:8px}#navskel .blk{height:64px}" +
    "#navskel .r{display:flex;align-items:center;gap:12px}#navskel .c{display:flex;flex-direction:column;gap:12px}#navskel .grow{flex:1;min-width:0}" +
    "#navskel .box{border:1px solid var(--ns-line);border-radius:12px;background:var(--ns-surface);padding:14px 16px}" +
    "#navskel .tb{height:44px;flex:none;display:flex;align-items:center;gap:8px;padding:0 18px;background:var(--ns-surface);border-bottom:1px solid var(--ns-line);font-size:13px}" +
    "#navskel .sp{color:var(--ns-ink3)}#navskel .tb b{font-weight:600}" +
    "#navskel .body{flex:1;min-height:0;overflow:hidden;padding:24px 28px;display:flex;flex-direction:column;gap:14px}" +
    "#navskel .mid{width:100%;max-width:680px;margin:0 auto}" +
    /* the platform's mark, the console column's own north star (.sblogo) */
    "#navskel .mk{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:var(--ns-amber);color:var(--ns-navy)}" +
    "#navskel .mk svg{width:17px;height:17px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}" +
    "#navskel .hb{flex:none;width:1px;height:18px;background:var(--ns-line);margin:0 6px 0 4px}" +
    /* THE CONSOLE AS IT IS (§601, §622, §628): a white column of 224px headed
       by the mark and the name, its tabs in three runs and History at the
       foot, and Home — the navy band, two cards side by side and a wide one
       under them. Drawn in the console's own units and zoomed as the console
       is (0.8 from 1000px, platform.html), so it lands where the page will —
       the zoom worked out at the press from the page it is drawn on, which
       may be zoomed itself (the Strategy document is, 0.8). */
    "#navskel .con{position:absolute;inset:0;display:flex;align-items:stretch}" +
    "#navskel .side{flex:none;width:224px;display:flex;flex-direction:column;background:var(--ns-surface);border-right:1px solid var(--ns-line)}" +
    "#navskel .side .hd{min-height:58px;display:flex;align-items:center;gap:8px;padding:12px 8px 12px 14px;border-bottom:1px solid var(--ns-line)}" +
    "#navskel .side .hd .mk{width:28px;height:28px;border-radius:8px}#navskel .side .hd .mk svg{width:20px;height:20px}" +
    "#navskel .nm{display:flex;flex-direction:column;line-height:1.15;min-width:0}#navskel .nm b{font-size:12px;font-weight:700;color:var(--ns-sbink);white-space:nowrap}" +
    "#navskel .nm span{margin-top:2px;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ns-sbq)}" +
    "#navskel .nv{flex:1;display:flex;flex-direction:column;gap:12px;padding:10px}" +
    "#navskel .g{display:flex;flex-direction:column;gap:2px}#navskel .g.ft{margin-top:auto;padding-top:10px;border-top:1px solid var(--ns-line)}" +
    "#navskel .it>.b:first-child{width:18px;height:18px;border-radius:5px}#navskel .gl{height:22px;display:flex;align-items:center;padding:0 10px}#navskel .it{height:34px;display:flex;align-items:center;gap:11px;padding:0 10px;border-radius:8px}" +
    "#navskel .it.on{background:var(--ns-sbon)}#navskel .side .b{background:var(--ns-sbon)}#navskel .it.on .b{background:var(--ns-line)}" +
    "#navskel .sf{display:flex;align-items:center;gap:10px;padding:12px 12px 14px 14px;border-top:1px solid var(--ns-line)}" +
    "#navskel .av{flex:none;width:30px;height:30px;border-radius:50%;background:var(--ns-sbon)}" +
    "#navskel .mn{flex:1;min-width:0;display:flex;flex-direction:column}#navskel .wr{padding:16px 22px 56px;display:flex;flex-direction:column}" +
    "#navskel .band{height:113px;border-radius:14px;background:var(--ns-ff);padding:21px 22px 17px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;margin:0 0 16px}" +
    "#navskel .band .b{background:rgba(255,255,255,.18)}#navskel .band .b.a{background:rgba(245,166,35,.55);height:10px}" +
    "#navskel .two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin:0 0 24px}" +
    "#navskel .cd{display:flex;flex-direction:column;background:var(--ns-surface);border:1px solid var(--ns-line);border-radius:12px;min-height:109px}" +
    "#navskel .ch{display:flex;align-items:center;gap:10px;height:51px;padding:0 14px;border-bottom:1px solid var(--ns-line)}" +
    "#navskel .ic{flex:none;width:30px;height:30px;border-radius:8px;background:var(--ns-wash)}#navskel .cb{flex:1;padding:14px;display:flex;flex-direction:column;gap:12px}" +
    "#navskel .mtop{display:none;height:50px;flex:none;align-items:center;gap:10px;padding:8px 12px;background:var(--ns-surface);border-bottom:1px solid var(--ns-line)}" +
    "@media (max-width:999px){#navskel .side{display:none}#navskel .mtop{display:flex}#navskel .two{grid-template-columns:minmax(0,1fr)}#navskel .wr{padding:14px 14px 50px}}" +
    "html[data-rail='1'] #navskel .side{width:64px}html[data-rail='1'] #navskel .nm,html[data-rail='1'] #navskel .side .b{display:none}" +
    "@keyframes nspulse{0%,100%{opacity:1}50%{opacity:.45}}" +
    "@media (prefers-reduced-motion:reduce){#navskel .b{animation:none;opacity:.75}}";

  function b(w, cls) { return '<span class="b' + (cls ? " " + cls : "") + '" style="width:' + w + '"></span>'; }
  function n(k, f) { var s = ""; for (var i = 0; i < k; i++) s += f(i); return s; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  var STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.8 13.9 10.1 21.2 12 13.9 13.9 12 21.2 10.1 13.9 2.8 12 10.1 10.1z"/><circle cx="12" cy="12" r="1.3"/></svg>';
  /* the bar opens on the platform's mark and a hairline (option D, 2026-10-26) */
  function topLine(name, label) {
    return '<div class="tb"><span class="mk">' + STAR + '</span><span class="hb"></span>' +
      (name ? "<b>" + esc(name) + "</b>" : b("90px")) + '<span class="sp">\\u203a</span><b>' + esc(label) + "</b></div>";
  }
  function rows(k, cols) { return n(k, function (i) { return '<div class="r" style="padding:10px 0;border-bottom:1px solid var(--ns-line)">' + b("16px") + b((60 - i * 7) + "%") + '<span class="grow"></span>' + cols + "</div>"; }); }
  var LEDGER = { insights: 1, notes: 1, portfolio: 1 };
  var SHAPE = {
    strategy: function () {
      return '<div class="r" style="height:44px;flex:none;padding:0 18px;background:var(--ns-q);border-bottom:1px solid var(--ns-line)">' + b("26px", "k") +
        n(6, function (i) { return b((60 + (i % 3) * 18) + "px", i ? "q" : ""); }) + '</div><div class="body">' + n(5, function (i) { return '<span class="b blk" style="width:100%;opacity:' + [1, 1, 1, .78, .56][i] + '"></span>'; }) + "</div>";
    },
    setup: function () {
      return '<div class="r" style="flex:1;min-height:0;align-items:flex-start;gap:0"><div class="c" style="width:210px;padding:16px"><div class="box c" style="padding:12px">' + b("110px", "q") + b("100%", "k q") +
        n(7, function (i) { return b((90 + (i % 3) * 20) + "px", "q"); }) + '</div></div><div class="body">' + b("160px", "t") + '<div class="r">' + n(3, function () { return b("90px", "p q"); }) + "</div>" +
        n(3, function () { return '<div class="c" style="gap:8px;max-width:520px">' + b("100px", "q") + b("100%", "k q") + "</div>"; }) + "</div></div>";
    },
    tracker: function () {
      return '<div class="body"><div class="mid c"><div class="box" style="background:var(--ns-q)"><div class="r" style="align-items:flex-end"><div class="c">' + b("150px", "q") + b("150px", "t") + '</div><span class="grow"></span>' +
        n(4, function () { return '<div class="c" style="align-items:flex-end;gap:6px">' + b("22px", "t") + b("40px", "q") + "</div>"; }) + '</div></div>' + b("100%", "k q") + rows(5, b("70px", "q") + b("80px")) + "</div></div>";
    },
    /* Insights, Meeting Notes and Portfolio wear the Tracker's furniture
       since §605 (lib/ledger.ts): the panel with the counts and the views,
       the underlined search line, numbered sections under a heavy rule */
    ledger: function () {
      return '<div class="body"><div class="mid c" style="max-width:1000px;gap:18px"><div class="box" style="background:var(--ns-q);padding:16px 20px"><div class="r" style="align-items:flex-end"><div class="c">' +
        b("150px", "q") + b("170px", "t") + '</div><span class="grow"></span>' + n(3, function () { return '<div class="c" style="align-items:flex-end;gap:6px">' + b("22px", "t") + b("56px", "q") + "</div>"; }) +
        '</div><div class="r" style="margin-top:14px">' + n(4, function (i) { return b((54 + (i % 2) * 22) + "px", "q"); }) + '</div></div><div class="r">' + b("280px", "q") + "</div>" +
        n(2, function () { return '<div class="c" style="gap:0"><div class="r" style="padding-bottom:8px;border-bottom:2px solid var(--ns-line)">' + b("16px", "q") + b("130px", "t") + b("60px", "q") + "</div>" +
          n(3, function (i) { return '<div class="r" style="padding:12px 0;border-bottom:1px solid var(--ns-line)">' + b((58 - i * 9) + "%") + '<span class="grow"></span>' + b("110px", "q") + b("80px") + "</div>"; }) + "</div>"; }) +
        "</div></div>";
    },
    copilot: function () {
      return '<div class="body"><div class="mid c" style="max-width:780px"><div class="r">' + b("100px", "t") + '<span class="grow"></span>' + b("130px", "k q") + '</div><div class="r">' +
        b("150px", "k") + b("130px", "k q") + b("110px", "k q") + b("200px", "k q") + "</div>" + n(4, function (i) { return '<div class="box c">' + b((260 - i * 30) + "px") + b("75%", "q") + "</div>"; }) + "</div></div>";
    },
    processes: function () {
      return '<div class="r" style="flex:1;min-height:0;align-items:stretch;gap:0"><div class="c" style="width:200px;padding:18px 16px;border-right:1px solid var(--ns-line);background:var(--ns-surface)">' + b("70px", "q") + b("110px") +
        n(8, function (i) { return b((70 + (i % 3) * 20) + "px", "q"); }) + '</div><div class="body">' + b("100%", "blk") + '<div class="box c">' + b("200px") + b("80%", "q") + '</div><div class="r">' +
        n(3, function () { return '<div class="box c grow">' + b("30px", "t") + b("80px", "q") + "</div>"; }) + "</div></div></div>";
    }
  };
  function consoleShape(tab) {
    var it = function (w, on) { return '<div class="it' + (on ? " on" : "") + '">' + b("18px") + b(w) + "</div>"; };
    var grp = function (ws, on) { return '<div class="g"><div class="gl">' + b("46px", "q") + "</div>" + ws.map(function (w, i) { return it(w, on === i); }).join("") + "</div>"; };
    var home = !tab || tab === "home";
    var card = function (k) { return '<div class="cd"><div class="ch"><span class="ic"></span>' + b("110px", "t") + '<span class="grow"></span>' + b("70px", "q") + '</div><div class="cb">' +
      n(k, function (i) { return '<div class="r">' + b((58 - i * 10) + "%") + '<span class="grow"></span>' + b("60px", "q") + "</div>"; }) + "</div></div>"; };
    var body = home
      ? '<div class="two">' + card(1) + card(1) + "</div>" + card(2)
      : '<div class="cd"><div class="cb" style="gap:16px">' + rows(5, b("90px", "q")) + "</div></div>";
    return '<div class="con"><div class="side"><div class="hd"><span class="mk">' + STAR + '</span><span class="nm"><b>Strategy Management</b><span>Platform</span></span></div>' +
      '<div class="nv">' + grp(["50px", "70px", "56px"], home ? 0 : -1) + grp(["86px", "96px"]) + grp(["90px", "80px", "62px"]) + '<div class="g ft">' + it("58px") + "</div></div>" +
      '<div class="sf"><span class="av"></span>' + b("100px") + "</div></div>" +
      '<div class="mn"><div class="mtop">' + b("22px") + '<span class="mk">' + STAR + "</span>" + b("180px") + '</div><div class="wr"><div class="band">' + b("150px", "a") + b("260px", "t") + b("320px") + "</div>" + body + "</div></div></div>";
  }

  var up = null, safety = 0;
  function down() {
    if (safety) { clearTimeout(safety); safety = 0; }
    if (up && up.parentNode) up.parentNode.removeChild(up);
    up = null;
  }
  function draw(to) {
    if (!document.body) return;
    down();
    if (!document.getElementById("navskel-css")) {
      var st = document.createElement("style");
      st.id = "navskel-css";
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    up = document.createElement("div");
    up.id = "navskel";
    up.setAttribute("aria-busy", "true");
    up.setAttribute("aria-label", "Opening " + (to.kind === "console" ? "the platform" : to.label));
    var shape = SHAPE[to.kind] || SHAPE[LEDGER[to.kind] ? "ledger" : ""] || SHAPE.ledger;
    up.innerHTML = to.kind === "console" ? consoleShape(to.tab) : topLine(clientName(to.slug), to.label) + shape();
    var con = up.querySelector(".con");
    if (con) {
      var hz = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      var z = (window.matchMedia && matchMedia("(min-width:1000px)").matches ? 0.8 : 1) / hz;
      if (Math.abs(z - 1) > 0.001) con.style.zoom = String(z);
    }
    document.body.appendChild(up);
    safety = setTimeout(down, 8000);
    /* registered now, so it runs after the page's own: a page that asks
       "leave with unsaved work?" keeps its own face for the question */
    window.addEventListener("beforeunload", function (e) {
      if (e.defaultPrevented || (typeof e.returnValue === "string" && e.returnValue !== "") || e.returnValue === false) down();
    }, { once: true });
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted) down(); });

  if (window.navigation && typeof window.navigation.addEventListener === "function") {
    window.navigation.addEventListener("navigate", function (e) {
      if (!e.destination || e.destination.sameDocument || e.hashChange || e.downloadRequest || e.formData) return;
      var to = where(e.destination.url);
      if (!to) return;
      /* after every listener has had its say: a move another one cancels is
         not drawn at all */
      Promise.resolve().then(function () { if (!e.defaultPrevented) draw(to); });
    });
  } else {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      var to = where(a.href);
      if (to && a.href.split("#")[0] !== location.href.split("#")[0]) setTimeout(function () { if (!e.defaultPrevented) draw(to); }, 0);
    });
  }
})();
`;

export const NAVSKEL_STAMP = createHash("sha256").update(NAVSKEL_SCRIPT).digest("hex").slice(0, 12);
