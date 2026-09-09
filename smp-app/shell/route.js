/* THE ADDRESS AND THE PLACE (spec 043 Phase B, phases.md §1) — the one piece
   of browser code that is NEW on the shell, and it is small because §173
   already built what it needs.

   The frozen shell has no addresses: it opens where the person works
   (§94.6) and remembers where they were across a refresh in sessionStorage
   (§173's `smp.where`, a destination · a tab · a section). On the new stack a
   page IS an address — /<client>/<target>/<tab>[/<section>] — because the
   landing's doors point at one (§315) and a link somebody sends has to open
   the page it names.

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
  /* tab words in the address ↔ tab keys in SUBS; a function's Strategy and
     Performance keys are its own (fnstrat, fnperf), the group's and a
     company's are `performance` and their own pages */
  var TAB_IN = { strategy: { unit: "strategy", fn: "fnstrat" }, performance: { unit: "performance", fn: "fnperf", group: "performance", co: "performance" },
                 reporting: { unit: "report", fn: "report" } };
  var TAB_OUT = { strategy: "strategy", fnstrat: "strategy", performance: "performance", fnperf: "performance", report: "reporting" };
  function kindOf(d) { return d === "group" ? "group" : d === "setup" ? "setup" : /^fn:/.test(d) ? "fn" : /^co:/.test(d) ? "co" : "unit"; }
  function placeOf(rest) {
    var seg = (rest || "").split("/").filter(Boolean);
    if (!seg.length) return null;
    var d, i = 1;
    if (seg[0] === "fn" && seg[1]) { d = "fn:" + seg[1]; i = 2; }
    else if (seg[0] === "co" && seg[1]) { d = "co:" + seg[1]; i = 2; }
    else if (seg[0] === "tour") { return { tour: true }; }
    else d = seg[0];
    var kind = kindOf(d), s = null, c = null;
    if (kind === "setup") { s = seg[i] || null; }
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
    var out = "/" + SLUG + "/" + seg;
    if (s) out += "/" + (kind === "setup" || kind === "group" ? s : (TAB_OUT[s] || s));
    if (c && kind !== "setup") out += "/" + c;
    return out;
  }
  /* ── on arrival: the address is the place ── */
  var here = placeOf(m[2]);
  try {
    sessionStorage.setItem("smp.welcome.done", "1");
    if (here && !here.tour && here.d) {
      var rem = { d: here.d, s: here.s };
      if (here.c && here.s) rem.c = here.c;
      sessionStorage.setItem("smp.where", JSON.stringify(rem));
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
  if (typeof paint === "function") {
    var painted = paint;
    paint = function () { var r = painted.apply(this, arguments); try { sync(true); } catch (e) {} return r; };
  }
  window.addEventListener("popstate", function (ev) {
    var st = ev.state || placeOf(String(location.pathname).replace(/^\/[^/]+\/?/, ""));
    if (!st || !st.d || typeof current === "undefined") return;
    last = location.pathname;
    current = st.d; currentSub = st.s || null;
    if (st.c && st.s && typeof CURSEC !== "undefined") CURSEC[st.s] = st.c;
    if (typeof leaveModes === "function") { try { leaveModes(); } catch (e) {} }
    if (typeof paint === "function") paint();
  });
})();
