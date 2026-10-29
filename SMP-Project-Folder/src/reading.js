/* ── THE READING WINDOW (§676; design-mockups/strategy-reading-view) ─────
   Islam, 2026-10-29: *"people who see for the first time they get confused
   somehow … some sort of a window that opens, and this window has the
   multiple tabs, the foundation, the analysis, the directions and so on just
   for viewing things rather than the detailed view … this view is mainly for
   the CEO or people are not owners on the function or people who want to see
   the company Strategy in general"*. Settled from three mockup rounds: a
   window over the platform, a picker for the company or a unit, four tabs in
   the approach's own order — Foundation, Analysis, Directions (each with its
   measures and its tactics, folded to one line), Overall performance — a line
   per tab for first-timers, and Exit.

   A MODE, NOT A PAGE, as Presentation mode is (present.js): it takes the
   whole window, the chrome disappears, Exit and Escape return the reader to
   exactly where they were. And NOTHING NEW IS COMPUTED (welcome.js's rule,
   §53.5): every figure is the same function the workbench's page calls —
   measureScore, pillarPerf, unitObjectives, unitPillars, unitExec and their
   group twins — and every list goes through SMPRules.shown, so the window
   never disagrees with the page behind it. It only leaves out what edits,
   weighs or orders. */
var READING = (function () {
  var ST = { target: "group", tab: "found", open: {} };

  /* ── what can be read: the top layer, then every active unit ── */
  function subjects() {
    var list = [{ key: "group", name: topAsUnit().name }];
    activeKeys().forEach(function (k) { var u = UNITS[k]; if (u) list.push({ key: k, name: u.name }); });
    return list;
  }
  function isUnit(key) { return key !== "group" && !!UNITS[key]; }
  /* the record the tab reads: a unit's own, or the group's — the group's
     foundation lives on GROUP itself, its plan and SWOT on topAsUnit() */
  function recordOf(key) { return isUnit(key) ? UNITS[key] : GROUP; }
  function planOf(key) { return isUnit(key) ? UNITS[key] : topAsUnit(); }

  var TABS = [
    { k: "found", label: function (key) { return SMPRules.foundTitle(GROUP, key) || "Foundation"; },
      why: "What has been committed to, and why: the aspiration, what it is, and the values it holds itself to. It outruns the year; the directions are annual, the foundation is not." },
    { k: "swot", label: function (key) { return SMPRules.swotTitle(GROUP, key) || "Analysis"; },
      why: "Where things stand going in: what it is good at, what holds it back, what the market offers, and what could hurt. The reasoning behind the directions." },
    { k: "dir", label: function () { return "Directions"; },
      why: "What is being pushed on this year: each direction with the measures that say what done looks like and where they stand at the review point, and the tactics that deliver it — who owns each, the quarters it runs, whether it is on its way." },
    /* CAPABILITIES, A TAB OF THEIR OWN WHERE THE BOX KEEPS THEM APART (§679).
       Islam, of El Abd: *"where is the capabilities tab?"* — §677 had put them
       under Directions as a second list; the workbench gives a split box a
       Capabilities tab (§560), and so does the window. Offered only where the
       box's own question (boxSplit) answers yes and there is a capability to
       read, since a tab over nothing is not a choice (§61). */
    { k: "cap", label: function () { return L("capability", "bu"); },
      when: function (key) { var u = planOf(key); return boxSplit(u) && SMPRules.shown(itemsNow(u)).some(function (it) { return SMPRules.pillarIsCap(it); }); },
      why: "What is being built to carry every direction: each capability with the measures that say what done looks like and where they stand, and the tactics that deliver it — who owns each, the quarters it runs, whether it is on its way." },
    { k: "perf", label: function () { return "Overall performance"; },
      why: "The reading across all of it, three figures never blended: how the headline measures are doing, how the directions are doing, and how much of the work has been delivered against what should have been by now." }
  ];

  /* ── the pieces ── */
  function stand(v) {
    if (v == null || isNaN(v)) return '<span class="rbar"><b style="width:0"></b></span>';
    var w = Math.max(0, Math.min(100, Math.round(v)));
    return '<span class="rbar ' + band(v) + '"><b style="width:' + w + '%"></b></span>';
  }
  function measureRows(list) {
    var rows = SMPRules.shown(list || []);
    if (!rows.length) return '<p class="rnone">No measures yet.</p>';
    return '<div class="robj"><span class="rh">Measure</span><span class="rh num">Target</span><span class="rh num">Actual</span><span class="rh">Standing</span>' +
      rows.map(function (m) {
        var sc = measureScore(m);
        /* a measure not yet given a target or a figure shows a dash, never a bare direction sign over nothing (El Abd, 2026-10-29) */
        var tgt = String(m.target == null ? "" : m.target).trim(), fig = String(figShown(m) || "").trim();
        return '<span class="rnm">' + esc(m.name || "") + '</span><span class="rn">' + (tgt ? (m.dir ? esc(m.dir) + ' ' : '') + tgtShown(m.target) : '\u2014') + '</span>' +
          '<span class="rn">' + (fig ? fig : '\u2014') + '</span><span class="rst">' + stand(sc) + '<i style="color:' + bandInk(sc) + '">' + pct(sc) + '</i></span>';
      }).join("") + '</div>';
  }
  function tacticRows(list) {
    var rows = SMPRules.shown(list || []);
    if (!rows.length) return '<p class="rnone">No tactics yet.</p>';
    return '<div class="rtac"><span class="rh">Tactic</span><span class="rh">Owner</span><span class="rh">Quarters</span><span class="rh">Status</span>' +
      rows.map(function (t) {
        return '<span>' + esc(t.name || "") + '</span><span class="row">' + esc(t.owner || "—") + '</span>' +
          '<span class="rq">' + [t.q1, t.q2, t.q3, t.q4].map(function (q) { return '<span class="' + (q ? "on" : "") + '"></span>'; }).join("") + '</span>' +
          '<span class="rsts">' + esc(t.status || "—") + '</span>';
      }).join("") + '</div>';
  }

  function foundation(key) {
    var o = recordOf(key), on = function (c) { return compOn(key, c); }, out = "";
    var asp = String(o.aspiration || "").trim(), end = String(o.endInMind || "").trim();
    if (on("aspiration") && (asp || end)) {
      out += '<div><p class="rk">' + L1("aspiration") + '</p>' + (asp ? '<p class="rasp">' + esc(asp) + '</p>' : '') +
        (end ? '<p class="rmis">' + esc(end) + '</p>' : '') + '</div>';
    }
    var cl = Array.isArray(o.clauses) ? o.clauses : [], mis = String(o.mission || "").trim();
    var brief = on("brief") && cl.length ? '<div class="rcard"><h3>' + L("brief") + '</h3><div class="rclauses">' +
      cl.map(function (c) { return '<b>' + esc(c[0] || "") + '</b><span>' + esc(c[1] || "") + '</span>'; }).join("") + '</div></div>' : "";
    var purpose = on("purpose") && mis ? '<div class="rcard"><h3>' + L1("purpose") + '</h3><p class="rmis">' + esc(mis) + '</p></div>' : "";
    if (brief || purpose) out += '<div class="rtwo">' + brief + purpose + '</div>';
    if (on("keyobj") && SMPRules.shown(o.keyObjectives || []).length) {
      var kw = L1("keyobj");
      out += '<div><p class="rk">' + kw + (/s$/i.test(kw) ? "" : "s") + '</p><div class="rcard">' + measureRows(o.keyObjectives) + '</div></div>';
    }
    var vals = Array.isArray(o.values) ? o.values : [];
    if (on("values") && vals.length)
      out += '<div><p class="rk">' + L1("values") + '</p><div class="rvals">' + vals.map(function (v) {
        return '<div class="rval"><b>' + esc(v.name || "") + '</b>' + (v.def ? '<span>' + esc(v.def) + '</span>' : '') + '</div>';
      }).join("") + '</div></div>';
    return out || '<p class="rnone">Nothing written here yet.</p>';
  }

  function analysis(key) {
    var o = planOf(key), sw = (o.swot && typeof o.swot === "object") ? o.swot : {};
    var quads = SMPRules.swotQuads(GROUP, key) || [];
    if (!quads.length) return '<p class="rnone">No analysis is kept at this level.</p>';
    return '<div class="rswot">' + quads.map(function (q) {
      var list = Array.isArray(sw[q]) ? sw[q] : [];
      return '<div class="rcard rq-' + esc(q) + '"><h3><i>' + esc(String(q).charAt(0).toUpperCase()) + '</i>' + L(SMPRules.QUAD_KEYS[q]) + '</h3>' +
        (list.length ? '<ol>' + list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ol>' : '<p class="rnone">Nothing listed.</p>') + '</div>';
    }).join("") + '</div>';
  }

  /* DIRECTIONS AND CAPABILITIES APART WHERE THE BOX KEEPS THEM APART (§677,
     §679). The question is the workbench's own, `boxSplit(u)`
     (SMPRules.pillarsSplit): where it answers yes, Directions holds the
     directions alone and the capabilities have the tab above; where it
     answers no, one list, as the box itself is. */
  function directions(key, caps) {
    var u = planOf(key), items = SMPRules.shown(itemsNow(u));
    if (boxSplit(u)) items = items.filter(function (it) { return !!SMPRules.pillarIsCap(it) === !!caps; });
    var word = caps ? L1("capability").toLowerCase() : "direction";
    if (!items.length) return '<p class="rnone">No ' + esc(word) + 's this year.</p>';
    return '<div class="rtools">' + items.length + ' ' + esc(word) + (items.length === 1 ? "" : "s") + ', folded \u2014 press one to open it.' +
      '<button type="button" data-rall="open">Open all</button><button type="button" data-rall="close">Close all</button></div>' +
      dirList(u, items);
  }
  function dirList(u, items) {
    var all = u.items || [];
    return '<div class="rdirs">' + items.map(function (it) {
        var id = u.ukey + "|" + all.indexOf(it), open = !!ST.open[id], sc = pillarPerf(it);
        var ms = SMPRules.shown(it.measures || []).length, ts = SMPRules.shown(it.tactics || []).length;
        return '<div class="rdir' + (open ? " open" : "") + '" data-rdir="' + esc(id) + '">' +
          '<div class="rfold" role="button" tabindex="0" aria-expanded="' + (open ? "true" : "false") + '">' +
          '<span class="rcode">' + esc(pillarCode(u, all.indexOf(it))) + '</span>' +
          '<h3>' + esc(it.name || "") + (it.sub ? '<span class="rsub">' + esc(it.sub) + '</span>' : '') + '</h3>' +
          '<span class="rsum"><b>' + ms + '</b> measure' + (ms === 1 ? "" : "s") + ' · <b>' + ts + '</b> tactic' + (ts === 1 ? "" : "s") +
          ' · <b style="color:' + bandInk(sc) + '">' + pct(sc) + '</b></span>' + stand(sc) +
          '<span class="rchev" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l5 5 5-5"/></svg></span></div>' +
          '<div class="rmore"><p class="rk">Measures</p>' + measureRows(it.measures) + '<p class="rk">Tactics</p>' + tacticRows(it.tactics) + '</div></div>';
      }).join("") + '</div>';
  }

  function figure(v, what, sub) {
    return '<div class="rfig"><b style="color:' + bandInk(v) + '">' + pct(v) + '</b><span>' + what + ' — ' + sub + '</span>' +
      (v == null || isNaN(v) ? '' : '<i class="rband ' + band(v) + '">' + esc(bandWord(v)) + '</i>') + '</div>';
  }
  function performance(key) {
    var unit = isUnit(key), u = unit ? UNITS[key] : null;
    var a = unit ? unitObjectives(u) : groupKeyObjectives();
    var b = unit ? unitPillars(u) : groupUnitsObjectives();
    var c = unit ? unitExec(u) : groupExec();
    var head = unit ? u.keyObjectives : GROUP.keyObjectives;
    return '<div class="rthree">' +
      figure(a, "Measures", unit ? "the unit’s headline measures against their targets" : "the group’s own headline measures against their targets") +
      figure(b, unit ? "Directions" : L1("unitword") + "s", unit ? "each direction’s measures, averaged per direction" : "the units’ own headlines, at their weights") +
      figure(c, "Execution", "delivered against what should have been by now; 100% is on plan, not finished") + '</div>' +
      '<div class="rcard"><h3>Headline measures</h3>' + measureRows(head) + '</div>';
  }

  /* ── the window ── */
  function root() { return document.getElementById("readroot"); }
  function paint() {
    var r = root(); if (!r) return;
    var key = ST.target, subs = subjects();
    if (!subs.some(function (s) { return s.key === key; })) { key = ST.target = "group"; }
    var tabs = TABS.filter(function (t) { return !t.when || t.when(key); });
    var tab = tabs.filter(function (t) { return t.k === ST.tab; })[0] || tabs[0];
    r.querySelector(".rwtop").innerHTML =
      '<span class="rmark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 13.9 10.1 21.2 12 13.9 13.9 12 21.2 10.1 13.9 2.8 12 10.1 10.1z"/></svg></span>' +
      '<span class="rco">' + esc(GROUP.org || "") + '</span>' +
      '<label class="rpick"><span class="vh">Reading</span><select data-rpick>' + subs.map(function (s) {
        return '<option value="' + esc(s.key) + '"' + (s.key === key ? ' selected' : '') + '>' + esc(s.name) + '</option>';
      }).join("") + '</select></label>' +
      '<span class="rsp"></span>' +
      (typeof cycleLabel === "function" ? '<span class="rasof">' + esc(cycleLabel()) + '</span>' : '') +
      '<button type="button" class="rexit" data-rexit title="Exit (Esc)">Exit</button>';
    r.querySelector(".rwtabs").innerHTML = tabs.map(function (t) {
      return '<button type="button" data-rtab="' + t.k + '"' + (t.k === tab.k ? ' aria-current="page"' : '') + '>' + esc(t.label(key)) + '</button>';
    }).join("");
    var body = tab.k === "found" ? foundation(key) : tab.k === "swot" ? analysis(key) : tab.k === "dir" ? directions(key, false) : tab.k === "cap" ? directions(key, true) : performance(key);
    r.querySelector(".rwbody").innerHTML = '<p class="rwhy"><i>' + esc(tab.label(key)) + '</i>' + tab.why + '</p>' + body;
    r.querySelector(".rwbody").scrollTop = 0;
  }

  function open(target) {
    var r = root(); if (!r) return;
    var t = String(target || TARGET || "group");
    ST.target = isUnit(t) ? t : "group";
    ST.tab = "found";
    ST.open = {};
    paint();
    r.classList.add("on");
    document.body.classList.add("reading");
    r.focus();
  }
  function close() {
    var r = root(); if (!r) return;
    r.classList.remove("on");
    document.body.classList.remove("reading");
    var b = document.getElementById("readbtn");
    if (b) b.focus();
  }

  function wire() {
    var r = root(), b = document.getElementById("readbtn");
    if (b) { b.hidden = false; b.addEventListener("click", function () { open(TARGET); }); }
    if (!r) return;
    r.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null; if (!t) return;
      var tab = t.closest("[data-rtab]"); if (tab) { ST.tab = tab.getAttribute("data-rtab"); paint(); return; }
      if (t.closest("[data-rexit]")) { close(); return; }
      var all = t.closest("[data-rall]");
      if (all) {
        var on = all.getAttribute("data-rall") === "open";
        r.querySelectorAll(".rdir").forEach(function (d) { ST.open[d.getAttribute("data-rdir")] = on; d.classList.toggle("open", on); d.querySelector(".rfold").setAttribute("aria-expanded", String(on)); });
        return;
      }
      var fold = t.closest(".rfold");
      if (fold) {
        var d = fold.parentNode, id = d.getAttribute("data-rdir"), now = !d.classList.contains("open");
        ST.open[id] = now; d.classList.toggle("open", now); fold.setAttribute("aria-expanded", String(now));
      }
    });
    r.addEventListener("change", function (e) {
      if (e.target && e.target.matches && e.target.matches("[data-rpick]")) { ST.target = e.target.value; ST.open = {}; paint(); }
    });
    /* THE WINDOW'S OWN KEYS, AND NONE OF THE PLATFORM'S WHILE IT IS UP. Taken
       at the document, first, so the tab keys, the action keys and the
       deck's own Escape (all listening at the document) never see a key
       pressed in the window: Escape returns, Enter or Space opens the
       direction under the focus, and anything else is the browser's own. */
    document.addEventListener("keydown", function (e) {
      if (!r.classList.contains("on")) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if ((e.key === "Enter" || e.key === " ") && e.target && e.target.classList && e.target.classList.contains("rfold")) { e.preventDefault(); e.target.click(); }
      e.stopPropagation();
    }, true);
  }

  return { wire: wire, open: open, close: close, isOpen: function () { var r = root(); return !!(r && r.classList.contains("on")); } };
})();
