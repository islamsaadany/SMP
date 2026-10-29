/* ── THE READING WINDOW (§676; design-mockups/strategy-reading-view) ─────
   Islam, 2026-10-29: *"people who see for the first time they get confused
   somehow … some sort of a window that opens, and this window has the
   multiple tabs, the foundation, the analysis, the directions and so on just
   for viewing things rather than the detailed view … this view is mainly for
   the CEO or people are not owners on the function or people who want to see
   the company Strategy in general"*. Settled from three mockup rounds: a
   window over the platform, a picker for the company or a unit, four tabs in
   the approach's own order — Foundation, Analysis, Directions (each with its
   measures and its tactics, folded to one line), Overall performance — and
   Exit. The line per tab that said what the tab answers went on Islam's word
   (2026-10-29, §680): the names say it.

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
    { k: "found", label: function (key) { return SMPRules.foundTitle(GROUP, key) || "Foundation"; } },
    { k: "swot", label: function (key) { return SMPRules.swotTitle(GROUP, key) || "Analysis"; } },
    { k: "dir", label: function () { return "Directions"; } },
    /* CAPABILITIES, A TAB OF THEIR OWN WHERE THE BOX KEEPS THEM APART (§679).
       Islam, of El Abd: *"where is the capabilities tab?"* — §677 had put them
       under Directions as a second list; the workbench gives a split box a
       Capabilities tab (§560), and so does the window. Offered only where the
       box's own question (boxSplit) answers yes and there is a capability to
       read, since a tab over nothing is not a choice (§61). */
    { k: "cap", label: function () { return L("capability", "bu"); },
      when: function (key) { var u = planOf(key); return boxSplit(u) && SMPRules.shown(itemsNow(u)).some(function (it) { return SMPRules.pillarIsCap(it); }); } },
    { k: "perf", label: function () { return "Overall performance"; } }
  ];

  /* ── the pieces ── */
  function stand(v) {
    if (v == null || isNaN(v)) return '<span class="rbar"><b style="width:0"></b></span>';
    var w = Math.max(0, Math.min(100, Math.round(v)));
    return '<span class="rbar ' + band(v) + '"><b style="width:' + w + '%"></b></span>';
  }
  /* THE TWO TABLES (§682). Islam, of an opened direction: *"the tables
     columns are too far away … no frame or grid is confusing and the tables
     are titled measures and then the table start with measures and then
     tactics … confusing as well"*. So: a real table with a frame and a line
     under every row, its header the only title — no label over it saying
     the same word — and the columns kept to the width the figures need
     rather than spread to the card's edge. */
  function measureRows(list) {
    var rows = SMPRules.shown(list || []);
    if (!rows.length) return '<p class="rnone">No measures yet.</p>';
    return '<table class="rtable rmeas"><thead><tr><th>Measure</th><th class="num">Target</th><th class="num">Actual</th><th>Standing</th></tr></thead><tbody>' +
      rows.map(function (m) {
        var sc = measureScore(m);
        /* a measure not yet given a target or a figure shows a dash, never a bare direction sign over nothing (El Abd, 2026-10-29) */
        var tgt = String(m.target == null ? "" : m.target).trim(), fig = String(figShown(m) || "").trim();
        return '<tr><td>' + esc(m.name || "") + '</td><td class="num">' + (tgt ? (m.dir ? esc(m.dir) + ' ' : '') + tgtShown(m.target) : '\u2014') + '</td>' +
          '<td class="num">' + (fig ? fig : '\u2014') + '</td><td class="rst">' + stand(sc) + '<i style="color:' + bandInk(sc) + '">' + pct(sc) + '</i></td></tr>';
      }).join("") + '</tbody></table>';
  }
  function tacticRows(list) {
    var rows = SMPRules.shown(list || []);
    if (!rows.length) return '<p class="rnone">No tactics yet.</p>';
    return '<table class="rtable rtacs"><thead><tr><th>Tactic</th><th>Owner</th><th>Quarters</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (t) {
        return '<tr><td>' + esc(t.name || "") + '</td><td class="row">' + esc(t.owner || "\u2014") + '</td>' +
          '<td><span class="rq">' + [t.q1, t.q2, t.q3, t.q4].map(function (q) { return '<span class="' + (q ? "on" : "") + '"></span>'; }).join("") + '</span></td>' +
          '<td><span class="rsts">' + esc(t.status || "\u2014") + '</span></td></tr>';
      }).join("") + '</tbody></table>';
  }

  /* FOUNDATION, AS ISLAM READS IT (§680): who we are on the left; on the
     right the vision (the aspiration), the end in mind and the mission (the
     purpose), each a card in the layer's own word for it; under
     them the key objectives and the core values. Each block only where
     Structure carries it (compOn). */
  function foundation(key) {
    var o = recordOf(key), on = function (c) { return compOn(key, c); }, out = "";
    var asp = String(o.aspiration || "").trim(), end = String(o.endInMind || "").trim(), mis = String(o.mission || "").trim();
    var cl = Array.isArray(o.clauses) ? o.clauses : [];
    var who = on("brief") && cl.length ? '<div class="rcard"><h3>' + L("brief") + '</h3><div class="rclauses">' +
      cl.map(function (c) { return '<b>' + esc(c[0] || "") + '</b><span>' + esc(c[1] || "") + '</span>'; }).join("") + '</div></div>' : "";
    var vision = on("aspiration") && asp ? '<div class="rcard"><h3>' + L1("aspiration") + '</h3><p class="rasp">' + esc(asp) + '</p></div>' : "";
    /* the end in mind is its own card under the layer's own word for it — "Moto" at El Abd — not a line under the vision (Islam, 2026-10-29) */
    var endin = on("aspiration") && end ? '<div class="rcard"><h3>' + L1("endinmind") + '</h3><p class="rmis">' + esc(end) + '</p></div>' : "";
    var mission = on("purpose") && mis ? '<div class="rcard"><h3>' + L1("purpose") + '</h3><p class="rmis">' + esc(mis) + '</p></div>' : "";
    var right = vision + endin + mission;
    if (who || right) out += '<div class="rtwo">' + (who || '') + (right ? '<div class="rcol">' + right + '</div>' : '') + '</div>';
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
          '<div class="rmore">' + measureRows(it.measures) + tacticRows(it.tactics) + '</div></div>';
      }).join("") + '</div>';
  }

  function figure(v, what, sub) {
    return '<div class="rfig"><b style="color:' + bandInk(v) + '">' + pct(v) + '</b><span>' + what + ' — ' + sub + '</span>' +
      (v == null || isNaN(v) ? '' : '<i class="rband ' + band(v) + '">' + esc(bandWord(v)) + '</i>') + '</div>';
  }
  /* OVERALL PERFORMANCE (§686). Islam, of El Abd's company: *"why the
     overall performance is not showing while it is showing in the
     performance tab for directions performance and execution"*. §676 scored
     a top layer by its units alone; El Abd has none, and its plan is the top
     layer's own. So the three figures are the ones the Performance page
     draws for that subject: a unit's headline, its directions' mean and its
     execution ratio (`unitObjectives`, `unitPillars`, `unitRatio` — the
     ratio, delivered against planned, which is the page's own card, not the
     delivered mean); a top layer's own key objectives, then, where it has a
     plan of its own in directions, that plan's mean and ratio over
     `topAsUnit()`, as the group page's own section does (§607), else the
     units' headlines at their weights and their execution. */
  function performance(key) {
    var unit = isUnit(key), u = unit ? UNITS[key] : null;
    var own = !unit && topHasPlan() && planOn("group") && topWay() !== "projects";
    var tu = own ? topAsUnit() : null;
    var a = unit ? unitObjectives(u) : groupKeyObjectives();
    var b = unit ? unitPillars(u) : own ? unitPillars(tu) : groupUnitsObjectives();
    var c = unit ? unitRatio(u) : own ? unitRatio(tu) : groupExec();
    var head = unit ? u.keyObjectives : GROUP.keyObjectives;
    var bw = unit || own ? "Directions" : L1("unitword") + "s";
    var bs = unit ? "each direction\u2019s measures, averaged per direction" : own ? "the " + esc(labelWord("topword", "group") || "company").toLowerCase() + "\u2019s own directions, averaged" : "the units\u2019 own headlines, at their weights";
    return '<div class="rthree">' +
      figure(a, "Measures", unit ? "the unit\u2019s headline measures against their targets" : "the group\u2019s own headline measures against their targets") +
      figure(b, bw, bs) +
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
      (REVIEW && REVIEW.name ? '<span class="rasof">' + esc(REVIEW.name) + '</span>' : '') +
      '<button type="button" class="rexit" data-rexit title="Exit (Esc)">Exit</button>';
    r.querySelector(".rwtabs").innerHTML = tabs.map(function (t) {
      return '<button type="button" data-rtab="' + t.k + '"' + (t.k === tab.k ? ' aria-current="page"' : '') + '>' + esc(t.label(key)) + '</button>';
    }).join("");
    var body = tab.k === "found" ? foundation(key) : tab.k === "swot" ? analysis(key) : tab.k === "dir" ? directions(key, false) : tab.k === "cap" ? directions(key, true) : performance(key);
    r.querySelector(".rwbody").innerHTML = body;
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

  /* ── A SEAT THAT EDITS NOTHING OPENS IN THE WINDOW (§687) ──────────────
     Islam: *"build it yes"*, of the mockup's first position. A reader's seat
     — a CEO's, a peer's, anybody's that the access matrix lets look and never
     write — lands in the window, with the workbench a press of Exit away;
     everybody else lands on the workbench as before.

     THE SEAT IS READ FROM THE MATRIX AND THE ROLES, NOT GUESSED FROM A NAME:
     the office is never a reader (SMPRules.isOffice), nor is anybody holding
     a piece — a unit, a function, a capability, a project, a pillar, a
     direction, a contribution — and otherwise a seat is a reader exactly
     when no page of the platform grants it edit or fill on any target it
     could reach — the group, every unit, every supporting function,
     every capability, every company — asked through the one rule every pen
     asks, `SMPRules.grantAtPage` (§42). The same silences the welcome keeps:
     no person, a projector, a deep address (a link straight to a page is a
     page somebody meant to open, §148). */
  var HOLDING = ["owner", "custodian", "capowner", "fnhead", "powner", "plowner", "dirowner", "contrib"];
  function readerSeat(person) {
    if (!person) return false;
    var w = world();
    if (SMPRules.isOffice(w, person)) return false;
    /* a bounded role holds rows the page-level grant does not show — a
       project's owner fills his project (§177) — so anybody holding a piece
       works in the platform, whatever the matrix says of the page */
    var roles = SMPRules.personRoleKeys ? SMPRules.personRoleKeys(w, person) : [];
    if (roles.some(function (k) { return HOLDING.indexOf(k) > -1; })) return false;
    var targets = ["group"];
    (typeof UNIT_KEYS !== "undefined" ? UNIT_KEYS : []).forEach(function (k) { targets.push(k); });
    Object.keys(typeof FUNCTIONS !== "undefined" ? FUNCTIONS : {}).forEach(function (k) { targets.push("fn:" + k); });
    (Array.isArray(GROUP.capabilities) ? GROUP.capabilities : []).forEach(function (c) { if (c && c.id) targets.push("cap:" + c.id); });
    Object.keys(typeof COMPANIES !== "undefined" ? COMPANIES : {}).forEach(function (k) { targets.push("co:" + k); });
    var pages = SMPRules.PAGES || [];
    for (var i = 0; i < pages.length; i++) {
      for (var j = 0; j < targets.length; j++) {
        var g = SMPRules.grantAtPage(w, person, pages[i].key, targets[j]);
        if (g === "edit" || g === "fill") return false;
      }
    }
    return true;
  }
  function offer(person) {
    /* the client's own switch first (Structure step, SMPRules.readersOpen) */
    if (!SMPRules.readersOpen(GROUP)) return false;
    if (!readerSeat(person)) return false;
    if (document.body && document.body.classList.contains("presenting")) return false;
    try { if (document.documentElement.getAttribute("data-deep-address") === "1") return false; } catch (e) {}
    open("group");
    return true;
  }

  return { wire: wire, open: open, close: close, offer: offer, readerSeat: readerSeat,
           isOpen: function () { var r = root(); return !!(r && r.classList.contains("on")); } };
})();
