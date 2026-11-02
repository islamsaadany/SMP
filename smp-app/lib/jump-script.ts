/* ── JUMP TO AND THE OFFLINE STRIP, ON EVERY PAGE (§701) ───────────────────
   Islam, of two things the HR platform does: *"the jump to concept and the
   page that shows that you are offline if there is no internet"*; drawn in
   design-mockups/jump-to-offline/ (two rounds), then *"build it"*.

   ONE SCRIPT, RIDING WITH §620's. /navskel.js is already loaded by the
   console and the Strategy document, and appended to /topbar.js, which every
   other module page loads — so this costs no request of its own and reaches
   every signed-in page there is (lib/navskel.ts NAVSKEL_FILE).
   `window.__smpjump` keeps a page that has both from running it twice.

   JUMP TO. Ctrl K (⌘K on a Mac) on any page, or the "Jump to…" box the
   script puts in the page's own bar, opens a window listing what
   /api/jump answers for this person (lib/jump.ts says what and why). Typing
   narrows it; the arrows and Enter open one; Escape or a press outside
   shuts it. The list is asked for once, the first time the window opens.
   A page with no bar to put the box in (the door, the sign-in card) gets
   neither the box nor the key: nothing there is a page to jump from.

   THE OFFLINE STRIP. When the browser says the connection has gone, an
   amber strip across the top says so; a press on Save, Submit, Send or
   Apply is held while it shows, with a bubble saying why, so nobody types
   on into a page that cannot keep it. When the connection comes back the
   strip turns green for a few seconds and goes. The page under it is never
   touched: what is typed stays where it was typed. Opening the platform
   with no connection at all is the worker's half (scripts/build-sw.mjs),
   because no page of ours has loaded to say anything. */
export const JUMP_SCRIPT = `/* §701 — Jump to, and the offline strip (lib/jump-script.ts). */
(function () {
  if (window.__smpjump) return;
  window.__smpjump = 1;
  var MAC = /Mac|iPhone|iPad/.test(navigator.platform || "");
  var KEYWORD = MAC ? "\\u2318K" : "Ctrl K";
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var LIGHT = "--sj-surface:#FFFFFF;--sj-surface2:#EFF2F6;--sj-line:#D6DCE5;--sj-ink:#171B22;--sj-ink2:#414A58;--sj-ink3:#636C79;--sj-gold:#8A6720;--sj-hl:#E8EEF7;--sj-scrim:rgba(23,27,34,.45);--sj-attnbg:#FFF4E5;--sj-attn:#B45309;--sj-goodbg:#E6F2EA;--sj-good:#2E6B45;";
  var DARK = "--sj-surface:#1C1F25;--sj-surface2:#23272E;--sj-line:#333A45;--sj-ink:#E9ECF1;--sj-ink2:#B4BCC8;--sj-ink3:#949DAA;--sj-gold:#D9B665;--sj-hl:#24324A;--sj-scrim:rgba(0,0,0,.6);--sj-attnbg:#2E2410;--sj-attn:#FCD34D;--sj-goodbg:#1C2E23;--sj-good:#8FCBA4;";
  var CSS =
    ":root{" + LIGHT + "}" +
    "@media (prefers-color-scheme:dark){html:not([data-theme=light]){" + DARK + "}}" +
    "html[data-theme=dark]{" + DARK + "}" +
    ".sjbtn{display:inline-flex;align-items:center;gap:8px;min-width:190px;height:28px;padding:0 6px 0 9px;border:1px solid var(--sj-line);border-radius:7px;background:var(--sj-surface);color:var(--sj-ink3);font:400 13px/1 'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;cursor:pointer;flex:none}" +
    ".sjbtn:hover{border-color:var(--sj-ink3);color:var(--sj-ink)}" +
    ".sjbtn:focus-visible{outline:2px solid var(--sj-gold);outline-offset:2px}" +
    ".sjbtn svg{width:14px;height:14px;flex:none}" +
    ".sjbtn .sjl{flex:1;text-align:left}" +
    ".sjside{display:flex;width:calc(100% - 20px);margin:10px 10px 0;min-width:0}" +
    /* the console's column folded to icons (§601, html[data-rail="1"], 64px
       from 1000px): the box folds with it to its glass alone, centred, the
       way every other row of the column does (§710) */
    "@media (min-width:1000px){html[data-rail='1'] .sjside{width:38px;min-width:0;height:34px;margin:10px auto 0;padding:0;justify-content:center}" +
    "html[data-rail='1'] .sjside .sjl,html[data-rail='1'] .sjside .sjk{display:none}}" +
    ".sjk{font:600 11px/1 'Source Sans 3',system-ui,sans-serif;border:1px solid var(--sj-line);border-bottom-width:2px;border-radius:4px;padding:2px 5px;background:var(--sj-surface);color:var(--sj-ink2);white-space:nowrap}" +
    "#sjscrim{position:fixed;inset:0;z-index:2147483600;background:var(--sj-scrim);display:flex;justify-content:center;align-items:flex-start;padding:10vh 12px 12px;font-family:'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif}" +
    "#sjscrim[hidden]{display:none}" +
    "#sjpal{width:min(560px,100%);max-height:min(480px,80vh);display:flex;flex-direction:column;overflow:hidden;background:var(--sj-surface);color:var(--sj-ink);border:1px solid var(--sj-line);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.25)}" +
    "#sjpal *{box-sizing:border-box}" +
    "#sjpal .sjq{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--sj-line);color:var(--sj-ink3)}" +
    "#sjpal .sjq svg{width:16px;height:16px;flex:none}" +
    "#sjpal input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--sj-ink);font-family:inherit;font-size:15px;line-height:1.4}" +
    "#sjpal .sjres{flex:1;overflow-y:auto;padding:6px}" +
    "#sjpal .sjg{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--sj-gold);padding:8px 8px 4px}" +
    "#sjpal .sjit{display:flex;align-items:center;gap:10px;width:100%;border:0;background:transparent;color:var(--sj-ink);text-align:left;padding:7px 9px;border-radius:6px;font-family:inherit;font-size:14px;line-height:1.35;cursor:pointer}" +
    "#sjpal .sjit.on{background:var(--sj-hl)}" +
    "#sjpal .sjn{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#sjpal .sjn mark{background:transparent;color:var(--sj-gold);text-decoration:underline;text-underline-offset:2px}" +
    "#sjpal .sjw{margin-left:auto;padding-left:8px;font-size:12.5px;color:var(--sj-ink3);white-space:nowrap}" +
    "#sjpal .sjmsg{padding:22px 12px;text-align:center;color:var(--sj-ink3);font-size:13.5px}" +
    "#sjpal .sjfoot{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:8px 14px;border-top:1px solid var(--sj-line);background:var(--sj-surface2);font-size:12px;color:var(--sj-ink3)}" +
    "#sjpal .sjfoot .sjsp{flex:1}" +
    "@media (max-width:640px){#sjpal .sjw{display:none}#sjscrim{padding-top:16px}.sjbtn{min-width:0}.sjbtn .sjl,.sjbtn .sjk{display:none}}" +
    "#sjstrip{position:fixed;left:0;right:0;top:0;z-index:2147483500;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px max(16px,env(safe-area-inset-right,0px)) 7px max(16px,env(safe-area-inset-left,0px));font:400 13px/1.4 'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--sj-ink);background:var(--sj-attnbg);border-bottom:1px solid var(--sj-line);box-shadow:0 2px 8px rgba(0,0,0,.08)}" +
    "#sjstrip[hidden]{display:none}" +
    "#sjstrip.sjon{background:var(--sj-goodbg)}" +
    "#sjstrip .sjdot{width:8px;height:8px;border-radius:50%;background:var(--sj-attn);flex:none}" +
    "#sjstrip.sjon .sjdot{background:var(--sj-good)}" +
    "#sjstrip .sjsp{flex:1}" +
    "#sjstrip button{border:0;background:none;padding:0;color:inherit;font-family:inherit;font-size:13px;font-weight:600;text-decoration:underline;cursor:pointer}" +
    "#sjstrip .sjsaid{color:var(--sj-ink2)}" +
    "#sjtip{position:fixed;z-index:2147483550;max-width:260px;background:var(--sj-ink);color:var(--sj-surface);font:600 12px/1.35 'Source Sans 3',system-ui,sans-serif;padding:6px 9px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.25);pointer-events:none}" +
    "#sjtip[hidden]{display:none}" +
    "@media (prefers-reduced-motion:no-preference){#sjpal{animation:sjpop .14s ease-out}@keyframes sjpop{from{transform:translateY(-6px);opacity:.6}}}";
  var GLASS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  function addStyle() {
    if (document.getElementById("sjcss")) return;
    var s = document.createElement("style");
    s.id = "sjcss"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ══ JUMP TO ═══════════════════════════════════════════════════════════ */
  var seg = /^\\/([a-z0-9][a-z0-9-]{0,48})(?:\\/|$)/.exec(location.pathname);
  var SLUG = seg && seg[1] !== "platform" && seg[1] !== "api" ? seg[1] : "";
  var items = null, asking = false, failed = false, shown = [], sel = 0, scrim = null, lastFocus = null, mounted = false;

  /* where the box goes: Strategy's bar, a module's bar, the console's column */
  function mount() {
    if (mounted) return true;
    var b = document.createElement("button");
    b.type = "button"; b.className = "sjbtn"; b.setAttribute("data-jump", "1");
    b.setAttribute("aria-label", "Jump to a page (" + KEYWORD + ")");
    b.title = "Jump to\u2026 (" + KEYWORD + ")";
    b.innerHTML = GLASS + '<span class="sjl">Jump to\\u2026</span><span class="sjk">' + esc(KEYWORD) + "</span>";
    b.addEventListener("click", function () { open(); });
    var at = document.getElementById("topacts") || document.querySelector("header.tb .tbacts");
    if (at) { at.insertBefore(b, at.firstChild); mounted = true; return true; }
    var nav = document.getElementById("nav");
    if (nav && nav.parentNode && document.getElementById("signout")) {
      b.classList.add("sjside"); nav.parentNode.insertBefore(b, nav); mounted = true; return true;
    }
    return false;
  }

  function ask() {
    if (items || asking) return;
    asking = true; failed = false;
    fetch("/api/jump" + (SLUG ? "?client=" + encodeURIComponent(SLUG) : ""), { credentials: "same-origin", cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok && Array.isArray(j.items)) items = j.items; else failed = true; })
      .catch(function () { failed = true; })
      .then(function () { asking = false; if (scrim && !scrim.hidden) draw(); });
  }

  function build() {
    scrim = document.createElement("div");
    scrim.id = "sjscrim"; scrim.hidden = true;
    scrim.innerHTML = '<div id="sjpal" role="dialog" aria-modal="true" aria-label="Jump to">' +
      '<div class="sjq">' + GLASS + '<input id="sjin" type="text" autocomplete="off" spellcheck="false" ' +
        'placeholder="Jump to a module, page or setting\\u2026" aria-label="Jump to" aria-controls="sjres" role="combobox" aria-expanded="true">' +
        '<span class="sjk">Esc</span></div>' +
      '<div class="sjres" id="sjres" role="listbox"></div>' +
      '<div class="sjfoot"><span><span class="sjk">\\u2191</span> <span class="sjk">\\u2193</span> to move</span>' +
        '<span><span class="sjk">Enter</span> to open</span><span><span class="sjk">Esc</span> to close</span>' +
        '<span class="sjsp"></span><span>' + esc(KEYWORD) + " from any page</span></div></div>";
    document.body.appendChild(scrim);
    var inp = document.getElementById("sjin");
    inp.addEventListener("input", function () { sel = 0; draw(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (shown.length) { sel = Math.min(sel + 1, shown.length - 1); mark(); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (shown.length) { sel = Math.max(sel - 1, 0); mark(); } }
      else if (e.key === "Enter") { e.preventDefault(); go(sel); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
    });
    var res = document.getElementById("sjres");
    res.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".sjit") : null;
      if (b) go(+b.getAttribute("data-i"));
      else if (e.target.closest && e.target.closest("[data-retry]")) { ask(); draw(); }
    });
    res.addEventListener("mousemove", function (e) {
      var b = e.target.closest ? e.target.closest(".sjit") : null;
      if (b && +b.getAttribute("data-i") !== sel) { sel = +b.getAttribute("data-i"); mark(); }
    });
    scrim.addEventListener("mousedown", function (e) { if (e.target === scrim) close(); });
  }

  function draw() {
    var res = document.getElementById("sjres");
    if (!res) return;
    if (!items) {
      shown = [];
      res.innerHTML = failed
        ? '<div class="sjmsg">The list could not be read. <button type="button" class="sjit" data-retry="1" style="display:inline;width:auto;padding:0;text-decoration:underline">Try again</button></div>'
        : '<div class="sjmsg">Reading your pages\\u2026</div>';
      return;
    }
    var q = document.getElementById("sjin").value.trim().toLowerCase();
    var html = "", group = null;
    shown = items.filter(function (it) {
      return !q || it.name.toLowerCase().indexOf(q) >= 0 || it.where.toLowerCase().indexOf(q) >= 0;
    });
    shown.forEach(function (it, i) {
      if (it.group !== group) { group = it.group; html += '<div class="sjg">' + esc(group) + "</div>"; }
      var n = esc(it.name), k = q ? it.name.toLowerCase().indexOf(q) : -1;
      if (k >= 0) n = esc(it.name.slice(0, k)) + "<mark>" + esc(it.name.slice(k, k + q.length)) + "</mark>" + esc(it.name.slice(k + q.length));
      html += '<button type="button" class="sjit" role="option" tabindex="-1" id="sjo' + i + '" data-i="' + i + '"><span class="sjn">' + n +
        '</span><span class="sjw">' + esc(it.where) + "</span></button>";
    });
    res.innerHTML = html || '<div class="sjmsg">Nothing called \\u201c' + esc(q) + '\\u201d. Try part of a module, page or setting name.</div>';
    if (sel >= shown.length) sel = Math.max(shown.length - 1, 0);
    mark();
  }

  function mark() {
    var bs = document.querySelectorAll("#sjres .sjit[data-i]");
    for (var i = 0; i < bs.length; i++) {
      var on = +bs[i].getAttribute("data-i") === sel;
      bs[i].classList.toggle("on", on);
      bs[i].setAttribute("aria-selected", on ? "true" : "false");
      if (on) { bs[i].scrollIntoView({ block: "nearest" }); document.getElementById("sjin").setAttribute("aria-activedescendant", bs[i].id); }
    }
  }

  function open() {
    if (!scrim) build();
    if (!scrim.hidden) { document.getElementById("sjin").focus(); return; }
    lastFocus = document.activeElement;
    scrim.hidden = false;
    var inp = document.getElementById("sjin");
    inp.value = ""; sel = 0;
    ask(); draw();
    inp.focus();
  }
  function close() {
    if (!scrim || scrim.hidden) return;
    scrim.hidden = true;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  function go(i) {
    var it = shown[i];
    if (!it) return;
    close();
    var u = new URL(it.href, location.href);
    /* the console reads its tab from the hash at load, so a jump that only
       changes the hash is a reload of the page at that hash */
    if (u.pathname === location.pathname && u.search === location.search && u.hash !== location.hash) {
      location.hash = u.hash; location.reload(); return;
    }
    location.assign(it.href);
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === "k" || e.key === "K")) {
      if (!mounted) return;
      e.preventDefault();
      if (scrim && !scrim.hidden) close(); else open();
    }
  }, true);

  /* ══ THE OFFLINE STRIP ══════════════════════════════════════════════════ */
  var strip = null, tip = null, backTimer = null, tipTimer = null;
  var OFF_WORDS = "<b>You\\u2019re offline.</b> What you see may be out of date, and nothing can be saved until the connection is back.";
  function stripEl() {
    if (strip) return strip;
    strip = document.createElement("div");
    strip.id = "sjstrip"; strip.hidden = true;
    strip.setAttribute("role", "status"); strip.setAttribute("aria-live", "polite");
    document.body.appendChild(strip);
    strip.addEventListener("click", function (e) {
      if (!(e.target.closest && e.target.closest("[data-sjretry]"))) return;
      var said = strip.querySelector(".sjsaid");
      fetch("/favicon.svg?online=" + Date.now(), { cache: "no-store" })
        .then(function (r) { if (r.ok) backOnline(); else throw 0; })
        .catch(function () { if (said) said.textContent = "Checked just now. Still no connection."; });
    });
    return strip;
  }
  var isOff = false;
  function wentOffline() {
    isOff = true;
    clearTimeout(backTimer);
    var s = stripEl();
    s.className = "";
    s.innerHTML = '<span class="sjdot"></span><span>' + OFF_WORDS + '</span><span class="sjsaid"></span><span class="sjsp"></span><button type="button" data-sjretry="1">Try again</button>';
    s.hidden = false;
    room(true);
  }
  /* THE STRIP MAKES ROOM RATHER THAN COVERING THE BAR: the page is moved
     down by the strip's height while it shows, so the trail, Sign out and
     the bar's own controls stay where a press can reach them. */
  function room(on) {
    var b = document.body;
    if (!b) return;
    if (on) {
      if (!b.hasAttribute("data-sjpad")) b.setAttribute("data-sjpad", b.style.paddingTop || "");
      b.style.paddingTop = strip.offsetHeight + "px";
    } else if (b.hasAttribute("data-sjpad")) {
      b.style.paddingTop = b.getAttribute("data-sjpad");
      b.removeAttribute("data-sjpad");
    }
  }
  function backOnline() {
    if (!isOff) return;
    isOff = false;
    hideTip();
    var s = stripEl();
    s.className = "sjon";
    s.innerHTML = '<span class="sjdot"></span><span><b>Back online.</b> Saving works again.</span>';
    s.hidden = false;
    clearTimeout(backTimer);
    room(true);
    backTimer = setTimeout(function () { s.hidden = true; room(false); }, 4000);
  }
  window.addEventListener("offline", wentOffline);
  window.addEventListener("online", backOnline);

  /* A SAVE PRESSED WHILE OFFLINE IS HELD, AND SAYS WHY. Only a press on a
     control that says it saves or sends — its own first word — so nothing
     else on the page changes behaviour. */
  var SAVES = /^(save|submit|send|apply)\\b/i;
  function hideTip() { if (tip) tip.hidden = true; clearTimeout(tipTimer); }
  document.addEventListener("click", function (e) {
    if (!isOff) return;
    var b = e.target && e.target.closest ? e.target.closest("button, input[type=submit], a.btn, [role=button]") : null;
    if (!b || (strip && strip.contains(b)) || (scrim && scrim.contains(b))) return;
    var words = String(b.innerText || b.value || b.getAttribute("aria-label") || "").trim();
    if (!SAVES.test(words)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!tip) { tip = document.createElement("div"); tip.id = "sjtip"; tip.setAttribute("role", "status"); document.body.appendChild(tip); }
    tip.textContent = "Held until you\\u2019re back online. What you typed stays here.";
    tip.hidden = false;
    var r = b.getBoundingClientRect(), z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    /* the rectangle is in the screen's pixels and the bubble is placed in
       the page's, which differ by the zoom the platform's pages wear (0.8 on
       a computer) */
    tip.style.left = Math.max(8, Math.min(r.left / z, window.innerWidth / z - 270)) + "px";
    tip.style.top = (r.bottom / z + 6) + "px";
    clearTimeout(tipTimer);
    tipTimer = setTimeout(hideTip, 3500);
  }, true);

  function start() {
    addStyle();
    if (!mount()) setTimeout(mount, 1200);
    if (navigator.onLine === false) wentOffline();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
`;
