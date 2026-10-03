/* THE ADDRESS AND THE PLACE (spec 043 Phase B, phases.md §1) — the one piece
   of browser code that is NEW on the shell, and it is small because §173
   already built what it needs.

   The frozen shell has no addresses: it opens where the person works
   (§94.6) and remembers where they were across a refresh in sessionStorage
   (§173's `smp.where`, a destination · a tab · a section). On the new stack a
   page IS an address — /<client>/<module>/<target>/<tab>[/<section>] —
   because the landing's doors point at one (§315) and a link somebody sends
   has to open the page it names.

   THE MODULE IS NOT A LIST HELD HERE (spec 046 §7). The document is stamped
   `data-module` by the server, which owns the list (lib/modules.ts), and this
   writes that word back into every address it pushes — so a module added
   tomorrow needs no edit in the browser. What IS this file's own vocabulary
   is which destinations belong to the SPINE and carry no module: the intro
   round, and the CLIENT'S Setup — the pages that belong to no module (spec
   054 §4.1) — both of which kindOf() and placeOf() already had to name.

   SETUP HAS TWO ADDRESSES AND THE MODULE WORD IS WHAT TELLS THEM APART
   (§359.2, spec 056 §4.2, research R2). `/<client>/<module>/setup/<page>` is
   that module's own Setup and `/<client>/setup/<page>` is the client's; the
   difference is written onto the document as `data-setup-scope` (the module
   word, or `client`) and the frozen shell draws its rail from that one
   attribute. The address is a REQUEST rather than the authority: the landing
   writes every Setup door in the spine form and the shell moves the scope
   to the page's own module (shell.html resolveSetupScope), after which the
   place becomes the address again — so a door pressed on the landing ends
   at the address the product writes, and Back walks through it.

   So this does two things and nothing else:
     · on arrival, the address becomes §173's remembered place, so the
       shell's own restoreWhere() lands there with no second opener — the
       address a person pressed wins over where they were, because a door
       pressed is what they asked for;
     · after every paint, the place becomes the address (pushState), so a
       refresh stays put (§173, by address now) and Back walks the places
       visited; a popstate sets the place and repaints.
   A target is `fn/<key>` and `co/<key>` in the address, because a colon in a
   path segment is nobody's friend (lib/landing.ts doorHref, the same rule
   the landing writes with). Modes are never in the address (§63.1, §173:
   edit, reporting and arrange are dropped on every navigation).

   The shell's welcome overlay is THE welcome again (§360, spec 057): the
   landing at /<client> was stood in for it while it existed (§315) and is a
   redirect into the module now, so welcome.js offers itself once a session
   exactly as it does over file://, and the house mark is its way back — over
   the module's HOME, and never over a page somebody asked for by address
   (§360.9: `data-deep-address`, below). */
(function () {
  "use strict";
  var m = String(location.pathname || "").match(/^\/([a-z0-9][a-z0-9-]{0,48})(?:\/(.*))?$/);
  if (!m) return;
  if (document.documentElement.getAttribute("data-break") === "no-route") return;   /* the check's break */
  var SLUG = m[1];
  var MODULE = document.documentElement.getAttribute("data-module") || "";
  /* tab words in the address ↔ tab keys in SUBS; a function's Strategy and
     Performance keys are its own (fnstrat, fnperf), the group's and a
     company's are `performance` and their own pages */
  var TAB_IN = { strategy: { unit: "strategy", fn: "fnstrat" }, performance: { unit: "performance", fn: "fnperf", group: "performance", co: "performance" },
                 reporting: { unit: "report", fn: "report" } };
  var TAB_OUT = { strategy: "strategy", fnstrat: "strategy", performance: "performance", fnperf: "performance", report: "reporting" };
  function kindOf(d) { return d === "group" ? "group" : d === "setup" ? "setup" : /^fn:/.test(d) ? "fn" : /^co:/.test(d) ? "co" : "unit"; }
  /* The path after the client's slug, whichever address this is asked of. */
  function restOf(path) { return String(path || "").replace(/^\/[^/]+\/?/, ""); }
  /* The rail the document draws (shell.html setupScope): a module word for
     that module's own Setup, `client` for the pages that belong to no module,
     absent everywhere else. The frozen shell reads and writes the same
     attribute, so the two never hold a second copy of each other. */
  function setScope(v) {
    if (v) document.documentElement.setAttribute("data-setup-scope", v);
    else document.documentElement.removeAttribute("data-setup-scope");
  }
  var LIB_TAB_KEY = "insights";
  function libAddr() { return "/" + SLUG + "/" + LIB_TAB_KEY; }
  function placeOf(rest) {
    var seg = (rest || "").split("/").filter(Boolean);
    /* the module leads every address but the spine's; `tour` and the
       client's `setup` are the spine's own words and are read where they
       stand — and whether the module word LED is what says which Setup an
       address names, so it is remembered before the word is dropped */
    var led = !!(MODULE && seg[0] === MODULE);
    if (led) seg = seg.slice(1);
    if (!seg.length) return null;
    var d, i = 1;
    /* The reports' own address, which `addressOf` writes for the Insights
       tab. Reached here only by a history entry carrying no state (above);
       `null` leaves the page exactly where it is rather than reading the
       word as a destination. */
    if (seg.length === 1 && seg[0] === LIB_TAB_KEY) return null;
    if (seg[0] === "fn" && seg[1]) { d = "fn:" + seg[1]; i = 2; }
    else if (seg[0] === "co" && seg[1]) { d = "co:" + seg[1]; i = 2; }
    else if (seg[0] === "tour") { return { tour: true }; }
    else d = seg[0];
    var kind = kindOf(d), s = null, c = null;
    if (kind === "setup") {
      s = seg[i] || null; setScope(led ? MODULE : "client");
      /* A HASH ON A SETUP ADDRESS NAMES A PLACE ON THE PAGE (spec 056 §4.1):
         the landing's Email door opens `setup/send#comms`, the third section
         of that page, and its Access door opens `setup/people#seat`, a column
         of the register. It rides as the section (`c`): the shell's own
         restoreWhere() applies a section key the page holds and the page's
         renderer falls back to its first section for a word that is not one
         (config-render.js's CURSEC guard), so `seat` does no harm there and
         the element it names is scrolled to after the paint (below). Never
         written back into the address — addressOf keeps a Setup address to
         its page — so the hash is consumed on arrival and not carried. */
      var h = String(location.hash || "").replace(/^#/, "");
      if (h && /^[\w-]+$/.test(h)) c = h;
    }
    else {
      var w = seg[i] ? TAB_IN[seg[i]] : null;
      s = w ? (w[kind] || null) : (seg[i] || null);
      /* the group's own pages are their keys (foundation, focus, temple, weighting) */
      if (!s && seg[i] && kind === "group") s = seg[i];
      c = seg[i + 1] || null;
    }
    return { d: d, s: s, c: c };
  }
  /* ── THE REPORTS KEEP THEIR OWN ADDRESS (§376, decision 2) ────────
     The library is the CLIENT'S and is the same list whichever unit you are
     standing on, so the ordinary address `addressOf` would write —
     `/raya-trade/strategy/mobile/insights` — names a unit in a link that is
     not about that unit. Worse than untidy: the screen's own untruth is
     gone the moment you look away, and a link outlives the look.

     So the tab writes the module's own address, which is where the reports
     live from every other direction too. Spelled ONCE and read by both ends
     of this file (§53.5).

     A SHARED OR RELOADED LINK OPENS THE MODULE'S OWN PAGE — the same
     reports, the whole window, its own way back — because that address is
     served by the module and not by the shell. Stated rather than
     discovered: the room differs, the reports do not.

     BACK AND FORWARD ARE THE STATE OBJECT'S, NEVER THE ADDRESS'S.
     `sync()` pushes `{d, s, c}` beside the address, and the popstate
     handler reads `ev.state` first, so the destination somebody was
     standing on is restored exactly. `placeOf` is the fallback for an entry
     that carries no state, and there it answers NOTHING rather than reading
     `insights` as a unit nobody has — landing on an arbitrary destination
     is worse than staying put (§96.2, §61). */
  function addressOf(d, s, c) {
    var kind = kindOf(d);
    if (kind !== "setup" && s === LIB_TAB_KEY) return libAddr();
    var seg = kind === "fn" ? "fn/" + d.slice(3) : kind === "co" ? "co/" + d.slice(3) : d;
    /* A module's Setup carries its module word and the client's carries
       none (spec 056 §4.2): the scope the shell resolved decides, so a door
       pressed at `/<client>/setup/cycle` is rewritten to Strategy's own
       address once the page has said whose it is. Unscoped — which the
       served shell never is inside Setup — the spine form is written. */
    var scoped = kind === "setup" ? (document.documentElement.getAttribute("data-setup-scope") || "") : "";
    var word = kind === "setup" ? (scoped && scoped !== "client" ? scoped : "") : MODULE;
    var out = "/" + SLUG + (word ? "/" + word : "") + "/" + seg;
    if (s) out += "/" + (kind === "setup" || kind === "group" ? s : (TAB_OUT[s] || s));
    if (c && kind !== "setup") out += "/" + c;
    return out;
  }
  /* ── THE TRAIL (§400) ─────────────────────────────────────────────
     Islam, of moving between the console, a client and its modules: every
     way out was a different control in a different place — a client-name
     pill reading "change", a four-square mark with no word beside it, the
     house, the gear, a "Save & close", and rows at the foot of a Setup rail
     reading "‹ Back to the console" and "Client settings ›". Replaced, for
     Forefront's own people, by ONE line reading where you are:

         Forefront  ›  Raya Trade ▾  ›  Strategy ▾

     Each step is a place. Forefront is the console. Since §401 the client
     opens a menu of the OTHER clients this person may open (and "All
     clients"); the module opens the other modules, a rule, and "Client
     settings"; on the client's own settings the third step reads "Client
     settings" and opens the same menu with each module's settings. No
     client mark on the bar (§401).

     ONLY FOR SOMEBODY WITH A CONSOLE (`data-console`, written by sync.js
     off `person.cards`, which only the server can answer). A client's own
     person gets NO trail and NO module switcher — his word: "he doesn't
     really navigate, we bring everything to his view in the strategy
     platform" — so their bar names their company and nothing else, and the
     reports reach them as a tab (§376).

     DRAWN ON PAINT, REBUILT ONLY WHEN WHAT IT SAYS CHANGES — the client's
     settings and a module's are one document (§367), so crossing between
     them is a paint and the third step has to follow it; rebuilding on
     every paint would shut a menu somebody has open. */
  var ICO_DOWN = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.6 5 6.6 8 3.6" ' +
    'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function modulesOn() {
    try { var l = JSON.parse(document.documentElement.getAttribute("data-modules") || "[]");
      return Array.isArray(l) ? l.filter(function (x) { return x && x.key; }) : []; }
    catch (e) { return []; }
  }
  function onClientSettings() {
    return document.documentElement.hasAttribute("data-client-settings");
  }
  var trailSaid = null;
  function menuHTML(items) {
    return '<div class="menu" role="menu">' + items.map(function (it) {
      if (it.rule) return '<div class="trrule" role="separator"></div>';
      if (it.quiet) return '<div class="trquiet">' + esc(it.label) + "</div>";
      return '<button type="button" role="menuitem" data-trgo="' + esc(it.go) + '"' +
        (it.here ? ' aria-current="true"' : "") + ">" + esc(it.label) +
        (it.note ? '<span class="dlsub">' + esc(it.note) + "</span>" : "") + "</button>";
    }).join("") + "</div>";
  }
  function mountTrail() {
    var root = document.documentElement;
    /* data-break="trail-for-staff" is checks/modules.mjs's falsification: a
       client's own person drawn the trail they must never get. */
    if (!root.hasAttribute("data-console") && root.getAttribute("data-break") !== "trail-for-staff") return;
    var bar = document.querySelector(".top .top-in");
    if (!bar) return;
    var client = root.getAttribute("data-console-client") || SLUG;
    var mods = modulesOn();
    var here = mods.filter(function (x) { return x.key === MODULE; })[0];
    var modLabel = here ? here.label : (root.getAttribute("data-module-label") || "");
    var cs = onClientSettings();
    var said = [client, cs, MODULE, mods.map(function (x) { return x.key; }).join(","),
                trailClients ? trailClients.map(function (x) { return x.key; }).join(",") : "?"].join("|");
    var nav = bar.querySelector("nav.trail");
    if (nav && said === trailSaid) return;
    trailSaid = said;
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "trail";
      nav.setAttribute("aria-label", "Where you are");
      bar.insertBefore(nav, bar.firstChild);
      /* ONE LISTENER FOR THE WHOLE TRAIL, wired once: the markup below is
         rewritten when the place changes and this survives it (§24, §47.2). */
      nav.addEventListener("click", function (ev) {
        var b = ev.target.closest ? ev.target.closest("[data-trgo]") : null;
        if (!b) return;
        var go = b.dataset.trgo;
        Array.prototype.forEach.call(nav.querySelectorAll("details[open]"), function (d) { d.open = false; });
        /* A CROSSING BETWEEN THE TWO SETTINGS RAILS IS A PRESS (§367), the
           same one the rail rows made: one document, one attribute. */
        var cross = /^cross:/.test(go) ? go.slice(6) : null;
        if (cross && typeof current !== "undefined" && current === "setup" &&
            typeof setupLandingKey === "function") {
          var k = setupLandingKey(cross);
          if (k) {
            if (currentSub !== k && typeof leaveModes === "function") leaveModes();
            setScope(cross);
            current = "setup"; currentSub = k;
            paint(); window.scrollTo(0, 0);
            return;
          }
        }
        var href = cross ? (cross === "client" ? "/" + SLUG + "/setup" : "/" + SLUG + "/" + cross + "/setup") : go;
        if (href === location.pathname) return;
        location.assign(href);
      });
      /* A PRESS ANYWHERE ELSE CLOSES AN OPEN MENU (§401, Islam: "when I click
         outside them the menue should close"). `<details>` has no such
         behaviour of its own. On pointerdown, as the chat corner does
         (§100.4): a menu that lingers until the mouse comes up reads as
         having missed the press. Opening one menu shuts the other, and
         Escape shuts either. Wired once, beside the one listener above. */
      var shutAll = function (keep) {
        Array.prototype.forEach.call(nav.querySelectorAll("details[open]"), function (d) { if (d !== keep) d.open = false; });
      };
      document.addEventListener("pointerdown", function (ev) {
        var inside = ev.target && ev.target.closest ? ev.target.closest("nav.trail details") : null;
        shutAll(inside);
      }, true);
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && nav.querySelector("details[open]")) shutAll(null);
      });
    }
    var sep = '<span class="trsep" aria-hidden="true">›</span>';
    /* THE CLIENT STEP LISTS THE OTHER CLIENTS (§401, Islam: "when I click on
       the name of the client drop down I should get the other clients"). The
       list is the server's (`clients`: visible AND openable, the cards' own
       two rules, §42), asked once per page. Until it answers the menu says
       so, and if it cannot answer the console is still the way (§61). No
       mark: the client's logo is not on this bar any more (Islam: "the logo
       of the client shouldn't appear in the top navigation bar"). */
    var clientItems = [];
    var others = (trailClients || []).filter(function (x) { return x.key !== SLUG; });
    if (trailClients === null) clientItems.push({ label: "Reading your clients…", quiet: true });
    others.forEach(function (x) { clientItems.push({ label: x.name, go: "/" + x.key }); });
    if (trailClients && !others.length) clientItems.push({ label: "No other clients", quiet: true });
    clientItems.push({ rule: true });
    clientItems.push({ label: "All clients", go: "/platform#clients" });
    /* THE MODULE STEP LISTS THE OTHER MODULES, THEN THE CLIENT'S SETTINGS
       (§401, his words: "the other modules and then the separator and the
       client settings"). On the client's own settings the step reads "Client
       settings" and opens the same menu, where each module goes to THAT
       module's settings — from a settings page that is the next place, and
       it keeps §362.1's one press. */
    var modItems = [];
    mods.forEach(function (x) {
      if (!cs && x.key === MODULE) return;
      modItems.push(cs ? { label: x.label + " settings", go: "cross:" + x.key }
                       : { label: x.label, note: x.note, go: "/" + SLUG + "/" + x.key });
    });
    if (modItems.length) modItems.push({ rule: true });
    modItems.push({ label: "Client settings", go: "cross:client", here: cs });
    var third = '<details class="dlmenu trstep trmod"><summary' + (cs ? ' aria-current="page"' : "") + "><span>" +
      esc(cs ? "Client settings" : (modLabel || "Module")) + "</span>" + ICO_DOWN + "</summary>" + menuHTML(modItems) + "</details>";
    nav.innerHTML =
      '<a class="trff" href="/platform">Forefront</a>' + sep +
      '<details class="dlmenu trstep trclient"><summary>' +
        "<span>" + esc(client) + "</span>" + ICO_DOWN + "</summary>" + menuHTML(clientItems) + "</details>" +
      sep + third;
    if (trailClients === null && !trailAsked) askClients();
  }
  /* the clients this person may open, asked once per page (§401) */
  var trailClients = null, trailAsked = false;
  function askClients() {
    trailAsked = true;
    try {
      fetch("/api/platform", { method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "clients" }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { trailClients = (j && j.ok !== false && Array.isArray(j.clients)) ? j.clients : []; })
        .catch(function () { trailClients = []; })
        .then(function () { try { mountTrail(); } catch (e) {} });
    } catch (e) { trailClients = []; }
  }

  /* ── on arrival: the address is the place ── */
  var here = placeOf(m[2] || "");
  try {
    /* NOTHING MARKS THE WELCOME SEEN HERE ANY MORE (§360): that line stood
       the frozen overlay down while the Next landing was the welcome, and
       with the landing gone it was the reason the house mark opened a screen
       nobody had been offered. welcome.js keeps its own memory. */
    if (here && !here.tour && here.d) {
      var rem = { d: here.d, s: here.s };
      if (here.c && here.s) rem.c = here.c;
      sessionStorage.setItem("smp.where", JSON.stringify(rem));
      /* AND AN ADDRESS IS NOT A GREETING EITHER (§360.9). Islam, pressing
         the console card's *Settings* and meeting the welcome overlay over
         the client's own Setup rail: *"when I press continue it opens the
         clietn settings!! … the settings should open the settings
         directly."* He is right, and it is the argument two paragraphs down
         with a wider box around it: the welcome fills the viewport and its
         only way out is Continue, so over a page somebody NAMED it is a wall
         in front of the thing they asked for, and taking it down reads as
         the thing behind it having been opened by the press.

         THE HOME OF THE MODULE IS WHERE IT BELONGS (his own words): a bare
         `/<client>/<module>` names no page — which is exactly what the
         redirect at `/<client>` and the door's own landing produce — so
         `placeOf` answers null there and the greeting stands.

         A DOCUMENT FACT, NOT A REMEMBERED ONE, and that is the difference
         from the tour's mark below. This is true of THIS LOAD, so a person
         who types the module's home address afterwards is greeted; storing
         it would stand the welcome down for the session on the strength of
         one address, and `welcome.js`'s own memory would then be answering
         two questions instead of one (§107). Written the way the scope is
         (spec 056 §4.2) because route.js is the only file that knows the
         address's shape; read by `WELCOME.offer()` alone, never by
         `WELCOME.open()` — pressing the house mark IS the ask (§185). */
      document.documentElement.setAttribute("data-deep-address", "1");
      /* AND AN ADDRESS IS NOT A TOUR. The intro round navigates by pressing
         the platform's own controls (§107), so offered over a page somebody
         asked for by address it walks them off it — measured: a unit head
         opening /<client>/mobile/performance landed on Strategy › Plan, the
         tour's own first stop, with the address rewritten under them. So a
         deep address is somebody who has already chosen a page. Stood down
         for THIS SESSION ONLY, through the tour's own "Skip for now" mark
         rather than a second memory beside it (§53.5): "Don't show again" is
         untouched, `/<client>/tour` still offers, and the Knowledge base's
         replay button still starts one. */
      sessionStorage.setItem("smp.tour.later", "1");
    }
    /* AND `/<client>/tour` IS AN ADDRESS TOO (§360.9), which is why the
       welcome's stand-down is asked of it as well and the two lines above are
       not: nothing is remembered for a tour address (it is not a place) and
       the tour's own mark must certainly not be set on it — but somebody who
       typed it asked for the intro round, and `land()` offers the tour only
       where the welcome DECLINED (§148: two docks over one page fight for
       every click). Without this, the one address that names the tour is the
       one address that cannot start it. */
    if (here && here.tour) document.documentElement.setAttribute("data-deep-address", "1");
  } catch (e) { /* a store that refuses: the shell opens where it would have */ }
  /* ── after every paint: the place is the address ── */
  var last = null;
  function sync(push) {
    if (typeof current === "undefined" || !current) return;
    var d = current, s = currentSub || null, c = (s && typeof CURSEC !== "undefined" && CURSEC[s]) || null;
    var a = addressOf(d, s, c);
    if (a === last) return;
    var was = last; last = a;
    try {
      if (push && was !== null) history.pushState({ d: d, s: s, c: c }, "", a);
      else history.replaceState({ d: d, s: s, c: c }, "", a);
    } catch (e) {}
  }
  /* the element a hash named, scrolled to once it has been drawn — the
     first paints are the skeleton's, so it is tried on each until found */
  var wantEl = (here && here.c && String(location.hash || "").replace(/^#/, "") === here.c) ? here.c : null;
  function scrollToWanted() {
    if (!wantEl) return;
    var el = document.getElementById(wantEl);
    if (!el) return;
    wantEl = null;
    try { el.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {}
  }
  if (typeof paint === "function") {
    var painted = paint;
    paint = function () { var r = painted.apply(this, arguments);
      try { mountTrail(); } catch (e) {}
      try { sync(true); scrollToWanted(); } catch (e) {} return r; };
  }
  window.addEventListener("popstate", function (ev) {
    var st = ev.state || placeOf(restOf(location.pathname));
    if (!st || !st.d || typeof current === "undefined") return;
    last = location.pathname;
    current = st.d; currentSub = st.s || null;
    if (st.c && st.s && typeof CURSEC !== "undefined") CURSEC[st.s] = st.c;
    if (typeof leaveModes === "function") { try { leaveModes(); } catch (e) {} }
    if (typeof paint === "function") paint();
  });
})();
