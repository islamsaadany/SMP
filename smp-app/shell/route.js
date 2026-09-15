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
   (§356.2, spec 054 §4.2, research R2). `/<client>/<module>/setup/<page>` is
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

   The shell's welcome overlay is stood down: the landing at /<client> IS the
   welcome screen (§315), so a second one drawn over the first page would be
   two greetings for one arrival. */
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
    if (seg[0] === "fn" && seg[1]) { d = "fn:" + seg[1]; i = 2; }
    else if (seg[0] === "co" && seg[1]) { d = "co:" + seg[1]; i = 2; }
    else if (seg[0] === "tour") { return { tour: true }; }
    else d = seg[0];
    var kind = kindOf(d), s = null, c = null;
    if (kind === "setup") {
      s = seg[i] || null; setScope(led ? MODULE : "client");
      /* A HASH ON A SETUP ADDRESS NAMES A PLACE ON THE PAGE (spec 054 §4.1):
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
  function addressOf(d, s, c) {
    var kind = kindOf(d);
    var seg = kind === "fn" ? "fn/" + d.slice(3) : kind === "co" ? "co/" + d.slice(3) : d;
    /* A module's Setup carries its module word and the client's carries
       none (spec 054 §4.2): the scope the shell resolved decides, so a door
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
  /* ── THE MODULE SWITCHER (spec 046, E1 — signed off 2026-09-11) ──────
     The four-square mark at the far left of the top bar, opening the list of
     modules this client has with the one you are in marked.

     IT IS BUILT HERE AND NOT IN THE FROZEN SHELL, for the reason that decides
     whether it is drawn at all: a module list only exists where there is a
     server to say which ones a client has. The offline copy (§306) is the
     built file with one tenant's graph baked in and no server behind it, so a
     switcher in the frozen shell would be a control that could never open
     anything (§61). Its SHAPE is in arrange.css beside the family it belongs
     to (`details.dlmenu`), because a stylesheet is inert either way.

     DRAWN ONLY WHERE THERE IS A CHOICE. `data-modules` is written by the
     server only for a client holding more than one (lib/shell.ts), so a menu
     of one is never built — that is a door behind a door (§32) — and the
     ABSENT attribute is what says so, rather than a flag beside it (§50.6).

     THE NAMES COME FROM THE SERVER, never from the key. `moduleMenu()` is the
     one answer to what the switcher lists, read by this and by the trial
     module's own bar (§53.5): a label worked out here by capitalising a key
     is how two screens come to spell one module differently.

     IT SITS BEFORE `.brand`, NOT INSIDE IT. The approved mockup put it
     inside, and that drawing's `.brand` was a flex ROW while the product's is
     a COLUMN — copying the markup would have stranded the mark on a line of
     its own above the product's name. `.top-in` is already a row and
     `.brand` carries `margin-right:auto`, so first-in-the-row is the top left
     (§296.1: measure the paint, never the cascade).

     NOTHING HERE IS REWIRED ON A PAINT. `paintUnits()` replaces the row
     BELOW this one and nothing rewrites `.top-in`, so the markup is built and
     wired exactly once, at load — no second handler on a repaint (§24, §47.2).
     A press navigates, so the menu never has to be closed afterwards. */
  (function modules() {
    var raw = document.documentElement.getAttribute("data-modules");
    if (!raw) return;                               /* one module: no choice to offer */
    var list;
    try { list = JSON.parse(raw); } catch (e) { return; }
    if (!Array.isArray(list) || list.length < 2) return;
    var bar = document.querySelector(".top .top-in");
    if (!bar || bar.querySelector(".topmark")) return;

    var d = document.createElement("details");
    d.className = "dlmenu topmark";
    var here = list.filter(function (m) { return m && m.key === MODULE; })[0];
    var sum = document.createElement("summary");
    sum.setAttribute("title", here ? "Modules — you are in " + here.label : "Modules");
    sum.setAttribute("aria-label", sum.getAttribute("title"));
    /* DRAWN, NEVER A FONT CHARACTER (§52): a glyph the subset does not carry
       ships as a blank box, and this mark has no word beside it to recover
       from that. */
    sum.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
      '<rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1.2"/>' +
      '<rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1.2"/><rect x="11.2" y="11.2" width="5.6" height="5.6" rx="1.2"/>' +
      "</g></svg>";
    d.appendChild(sum);

    var menu = document.createElement("div");
    menu.className = "menu";
    menu.setAttribute("role", "menu");
    list.forEach(function (m) {
      if (!m || !m.key) return;
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.dataset.module = m.key;
      if (m.key === MODULE) b.setAttribute("aria-current", "true");
      b.appendChild(document.createTextNode(m.label || m.key));
      if (m.note) {
        var sub = document.createElement("span");
        sub.className = "dlsub";
        sub.appendChild(document.createTextNode(m.note));
        b.appendChild(sub);
      }
      menu.appendChild(b);
    });
    /* ONE LISTENER ON THE MENU, not one per item — and the module you are
       ALREADY in does nothing rather than reloading the page under somebody
       (§61's other half: a control that appears to act and does not). */
    menu.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("[data-module]") : null;
      if (!b || b.dataset.module === MODULE) return;
      location.assign("/" + SLUG + "/" + b.dataset.module);
    });
    d.appendChild(menu);
    bar.insertBefore(d, bar.firstChild);
  })();

  /* ── on arrival: the address is the place ── */
  var here = placeOf(m[2] || "");
  try {
    sessionStorage.setItem("smp.welcome.done", "1");
    if (here && !here.tour && here.d) {
      var rem = { d: here.d, s: here.s };
      if (here.c && here.s) rem.c = here.c;
      sessionStorage.setItem("smp.where", JSON.stringify(rem));
      /* AND AN ADDRESS IS NOT A TOUR. The intro round navigates by pressing
         the platform's own controls (§107), so offered over a page somebody
         asked for by address it walks them off it — measured: a unit head
         opening /<client>/mobile/performance landed on Strategy › Plan, the
         tour's own first stop, with the address rewritten under them. The
         landing carries the offer (§159's intro-round card, `/<client>/tour`)
         and Continue is the answer to it, so a deep address is somebody who
         has already chosen a page. Stood down for THIS SESSION ONLY, through
         the tour's own "Skip for now" mark rather than a second memory beside
         it (§53.5): "Don't show again" is untouched, `/<client>/tour` still
         offers, and the Knowledge base's replay button still starts one. */
      sessionStorage.setItem("smp.tour.later", "1");
    }
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
    paint = function () { var r = painted.apply(this, arguments); try { sync(true); scrollToWanted(); } catch (e) {} return r; };
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
