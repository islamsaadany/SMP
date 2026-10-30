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
   exactly where they were. AND AN ADDRESS OF ITS OWN (§689):
   /<client>/strategy/read, /read/<unit>, /read/<unit>/<tab> — written and
   read by shell/route.js off the `smp:reading` event this fires, so a link
   a CEO is sent opens the window on the page it names. And NOTHING NEW IS COMPUTED (welcome.js's rule,
   §53.5): every figure is the same function the workbench's page calls —
   measureScore, pillarPerf, unitObjectives, unitPillars, unitExec and their
   group twins — and every list goes through SMPRules.shown, so the window
   never disagrees with the page behind it. It only leaves out what edits,
   weighs or orders.

   THE SUBJECTS ARE THE NAVIGATOR'S, CUT DOWN BY REACH (§692; mockup rounds
   5 and 6). Islam: *"why don't we have the plans like the navigator
   approach units and functions where the viewer can see what he wants to
   see. that should follow the visibility logic we already have in the roles
   and access"*, then of a drop-down, *"not usable for long lists. why don't
   we use the navigator concept?"*. So the window carries the workbench's own
   row under its strip — the company menu pinned at the left, the Units |
   Functions switch, the names on one line that scrolls — built by the same
   builder the workbench's row is (shell.html navParts), which is what makes
   the matrix's grant the only rule: a subject is on the row when the viewer
   holds a page there and not otherwise, one side alone is a word, and a
   viewer who reaches one subject lands on it. And each subject is read in
   its own shape: a unit as before; a supporting function as its Overview,
   its S&W, its plan under the plan's own name — Directions, Projects or
   Objectives, by the way it plans — and Overall performance; a division as
   its own Foundation (§404) and the performance of what it holds. */
var READING = (function () {
  var ST = { target: "group", tab: "found", open: {}, fold: "units", followed: null };

  /* ── what can be read: whatever the navigator would list for this viewer ──
     The row's parts, from the workbench's own builder, with the window's
     subject as the place and the window's own side open; and the keys a
     press can land on — the top layer and the divisions the row offers,
     every side's names, and a side's own division where it carries one. */
  function kindOf(key) {
    if (key === "group") return "group";
    if (/^fn:/.test(key)) return "fn";
    if (/^co:/.test(key)) return "co";
    if (/^cap:/.test(key)) return "cap";
    return UNITS[key] ? "unit" : null;
  }
  function fnKey(key) { return String(key).slice(3); }
  function rowParts() {
    var r = navParts(ST.target, ST.fold, ST.followed);
    ST.fold = r.fold; ST.followed = r.followed;
    return r.parts;
  }
  function reachKeys() {
    var keys = [];
    var add = function (k) { if (k && keys.indexOf(k) < 0) keys.push(k); };
    var tops = [];
    if (ownTabs(SUBS.group, "group").length) tops.push("group");
    if (buExists() || !tops.length) companiesReachable().forEach(function (ck) {
      if (ownTabs(SUBS.co, "co:" + ck).length) tops.push("co:" + ck);
    });
    tops.forEach(add);
    navSides().forEach(function (x) { if (x.co) add("co:" + x.co); (x.keys || []).forEach(add); });
    return keys;
  }
  /* the side a subject sits on, so opening the window on it lights the name */
  function sideOf(key) {
    var hit = null;
    navSides().forEach(function (x) { if (!hit && ((x.keys || []).indexOf(key) >= 0 || (x.co && key === "co:" + x.co))) hit = x.fold; });
    return hit;
  }
  /* a target somebody asked for, read as a subject the window can show:
     a capability reads as the function that holds it; anything out of
     reach falls to the first subject reached; nothing reached is null */
  function norm(t) {
    var k = String(t || ""), reach = reachKeys();
    if (kindOf(k) === "cap") { var c = capById(k.slice(4)); k = c && c.fn ? "fn:" + c.fn : ""; }
    if (reach.indexOf(k) >= 0) return k;
    return reach.length ? reach[0] : null;
  }
  /* the record the Foundation reads: a unit's own, a function's own, a
     division's (coFoundOf, §404), or the group's; the plan and the SWOT of a
     unit or a pillars function come through unitLike, the group's through
     topAsUnit() */
  function recordOf(key) {
    var kind = kindOf(key);
    return kind === "unit" ? UNITS[key] : kind === "fn" ? FUNCTIONS[fnKey(key)] : kind === "co" ? coFoundOf(key.slice(3)) : GROUP;
  }
  function planOf(key) { return key === "group" ? topAsUnit() : unitLike(key); }
  function swotOf(key) {
    var o = kindOf(key) === "fn" ? FUNCTIONS[fnKey(key)] : planOf(key);
    return (o && o.swot && typeof o.swot === "object") ? o.swot : {};
  }
  function fnWay(key) { return kindOf(key) === "fn" ? fnFormat(FUNCTIONS[fnKey(key)]) : null; }

  /* THE TABS' WORDS IN AN ADDRESS (§689): /<client>/strategy/read/<subject>/<word> */
  var TAB_WORD = { found: "foundation", swot: "analysis", dir: "directions", cap: "capabilities", proj: "projects", obj: "objectives", perf: "performance" };
  function tabKeyOf(word) { for (var k in TAB_WORD) if (TAB_WORD[k] === word || k === word) return k; return null; }
  /* EACH SUBJECT'S OWN TABS (§692): a tab is offered on the kinds it names
     and where its `when` — the workbench's own conditions for the matching
     page (shell.html SUBS) — answers yes. */
  var TABS = [
    { k: "found", label: function (key) { return SMPRules.foundTitle(GROUP, key) || "Foundation"; },
      when: function (key) {
        var kind = kindOf(key);
        if (kind === "fn") return SMPRules.foundOn(GROUP, key) && (compOn(key, SMPRules.descPart(key)) || (compOn(key, "keyobj") && !plansInObjectives(key)));
        if (kind === "co") {
          var st = SMPRules.structureOf(GROUP), m = st && st.mid;
          return !!(m && Array.isArray(m.on)) && SMPRules.foundOn(GROUP, key) &&
            ["brief", "purpose", "aspiration", "keyobj", "values"].some(function (c) { return compOn(key, c); });
        }
        return true;
      } },
    { k: "swot", label: function (key) { return SMPRules.swotTitle(GROUP, key) || (kindOf(key) === "fn" ? "S&W" : "Analysis"); },
      when: function (key) { var kind = kindOf(key); return kind === "fn" ? compOn(key, "swot") : kind !== "co"; } },
    { k: "dir", label: function () { return "Directions"; },
      when: function (key) { var kind = kindOf(key); return kind === "fn" ? (fnWay(key) === "pillars" && planOn(key)) : kind !== "co"; } },
    /* CAPABILITIES, A TAB OF THEIR OWN WHERE THE BOX KEEPS THEM APART (§679).
       Islam, of El Abd: *"where is the capabilities tab?"* — §677 had put them
       under Directions as a second list; the workbench gives a split box a
       Capabilities tab (§560), and so does the window. Offered only where the
       box's own question (boxSplit) answers yes and there is a capability to
       read, since a tab over nothing is not a choice (§61). */
    { k: "cap", label: function () { return L("capability", "bu"); },
      when: function (key) { var u = planOf(key); return !!u && kindOf(key) !== "co" && boxSplit(u) && SMPRules.shown(itemsNow(u)).some(function (it) { return SMPRules.pillarIsCap(it); }); } },
    /* a function's plan under the plan's own name — the title the office gave
       that way of planning, else the client's word for a project, else
       Objectives — exactly as its own Strategy tab names the section */
    { k: "proj", label: function (key) { return SMPRules.planTitle(GROUP, key, "projects") || L("project"); },
      when: function (key) { return fnWay(key) === "projects" && planOn(key); } },
    { k: "obj", label: function (key) { return SMPRules.planTitle(GROUP, key, "objectives") || "Objectives"; },
      when: function (key) { return fnWay(key) === "objectives" && planOn(key); } },
    { k: "perf", label: function () { return "Overall performance"; } }
  ];
  function tabsFor(key) { return TABS.filter(function (t) { return !t.when || t.when(key); }); }

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
    if (kindOf(key) === "fn") return fnFoundation(key);
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

  /* A FUNCTION'S OVERVIEW (§692), as its own page draws it (group-render.js
     holderOverview): what it is — the function, who leads it, its
     definition — while the brief is on, and its key objectives while they
     are on and it does not keep them on its plan (a function planning in
     objectives and actions holds them there, §430). */
  function fnFoundation(key) {
    var fk = fnKey(key), f = FUNCTIONS[fk]; if (!f) return '<p class="rnone">Nothing written here yet.</p>';
    var briefOn = compOn(key, SMPRules.descPart(key)), koOn = compOn(key, "keyobj") && !plansInObjectives(key), out = "";
    if (briefOn) {
      var def = String(f.def || "").trim();
      out += '<div class="rcard"><h3>What it is</h3><div class="rclauses">' +
        '<b>' + esc(L1("fnword")) + '</b><span>' + esc(f.name || "") + '</span>' +
        '<b>Led by</b><span>' + (f.head ? esc(personName(f.head)) : '\u2014') + '</span>' +
        '<b>Definition</b><span>' + (def ? esc(def) : '\u2014') + '</span></div></div>';
    }
    if (koOn) {
      var kw = L1("keyobj"), list = Array.isArray(f.keyObjectives) ? f.keyObjectives : [];
      out += '<div><p class="rk">' + kw + (/s$/i.test(kw) ? "" : "s") + '</p><div class="rcard">' +
        (SMPRules.shown(list).length ? measureRows(list) : '<p class="rnone">None. This ' + esc(L1("fnword")) + ' is judged by its ' + esc(fnPlansInPillars(f) ? L("pillar", "bu") : L("project")) + '.</p>') + '</div></div>';
    }
    return out || '<p class="rnone">Nothing written here yet.</p>';
  }

  function analysis(key) {
    var sw = swotOf(key);
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
    var kind = kindOf(key);
    if (kind === "co") return coPerformance(key.slice(3));
    if (kind === "fn" && fnWay(key) === "projects") return projPerformance(key);
    if (kind === "fn" && fnWay(key) === "objectives") return objPerformance(key);
    var unit = kind === "unit" || kind === "fn", u = unit ? planOf(key) : null;
    if (unit && !u) return '<p class="rnone">Nothing to score yet.</p>';
    var own = !unit && topHasPlan() && planOn("group") && topWay() !== "projects";
    var tu = own ? topAsUnit() : null;
    var a = unit ? unitObjectives(u) : groupKeyObjectives();
    var b = unit ? unitPillars(u) : own ? unitPillars(tu) : groupUnitsObjectives();
    var c = unit ? unitRatio(u) : own ? unitRatio(tu) : groupExec();
    var head = unit ? u.keyObjectives : GROUP.keyObjectives;
    var bw = unit || own ? "Directions" : L1("unitword") + "s";
    var bs = unit ? "each direction\u2019s measures, averaged per direction" : own ? "the " + esc(labelWord("topword", "group") || "company").toLowerCase() + "\u2019s own directions, averaged" : "the units\u2019 own headlines, at their weights";
    return '<div class="rthree">' +
      figure(a, "Measures", unit ? "the " + (kind === "fn" ? esc(L1("fnword")).toLowerCase() : "unit") + "\u2019s headline measures against their targets" : "the group\u2019s own headline measures against their targets") +
      figure(b, bw, bs) +
      figure(c, "Execution", "delivered against what should have been by now; 100% is on plan, not finished") + '</div>' +
      '<div class="rcard"><h3>Headline measures</h3>' + measureRows(head) + '</div>';
  }

  /* ── A FUNCTION THAT PLANS IN PROJECTS (§692) ─────────────────────────
     Its Performance page's own three readings (group-render.js
     renderFnPerformance → capScoreCards): the key objectives' score, the
     projects' own readings averaged (capPerf), and the milestones due so
     far as read (capExec). The holder is the function's own (capsShown →
     fnOwnHolder), the same list its page draws. */
  function holderOf(key) { var hs = capsShown(key); return hs && hs.length ? hs[0] : null; }
  function projPerformance(key) {
    var c = holderOf(key);
    if (!c) return '<p class="rnone">No ' + esc(L("project")) + ' yet. Nothing to report until there are.</p>';
    var ex = capExec(c), ps = SMPRules.shown(c.projects || []);
    return '<div class="rthree">' +
      figure(capKOScore(c), L1("keyobj") + "s", "the " + esc(L1("fnword")).toLowerCase() + "\u2019s own headline measures against their targets") +
      figure(capPerf(c), L("project"), "each " + esc(L1("project")).toLowerCase() + "\u2019s deliverables and outcomes, averaged") +
      figure(ex.pct, "Execution", "the milestones due so far, as read; " + ex.done + " of " + ex.total + " completed") + '</div>' +
      '<div class="rcard"><h3>Headline measures</h3>' + measureRows(c.keyObjectives) + '</div>' +
      (ps.length ? '<div class="rcard"><h3>' + esc(L("project")) + '</h3><table class="rtable rprojs"><thead><tr><th>Code</th><th>' + esc(L1("project")) + '</th><th>Owner</th><th class="num">Milestones</th><th>Standing</th></tr></thead><tbody>' +
        ps.map(function (p) {
          var v = projPerf(p), m = projMilestones(p);
          return '<tr><td class="rcodecell">' + esc(projCode(holderCodeOwner(c), p)) + '</td><td>' + esc(p.name || "") + '</td><td>' + esc(p.owner || "\u2014") + '</td>' +
            '<td class="num">' + m.done + ' of ' + m.total + '</td><td class="rst">' + stand(v) + '<i style="color:' + bandInk(v) + '">' + pct(v) + '</i></td></tr>';
        }).join("") + '</tbody></table></div>' : '');
  }
  /* the plan as it was formed: one folded line per project, as a direction
     is (§677), opened to its deliverables and outcomes and its milestones */
  function projects(key) {
    var c = holderOf(key), ps = c ? SMPRules.shown(c.projects || []) : [];
    if (!ps.length) return '<p class="rnone">No ' + esc(L("project")) + ' yet.</p>';
    return '<div class="rtools">' + ps.length + ' ' + esc(ps.length === 1 ? L1("project") : L("project")).toLowerCase() + ', folded \u2014 press one to open it.' +
      '<button type="button" data-rall="open">Open all</button><button type="button" data-rall="close">Close all</button></div>' +
      '<div class="rdirs">' + ps.map(function (p) {
        var id = key + "|" + p.id, open = !!ST.open[id], sc = projPerf(p), m = projMilestones(p);
        var ds = SMPRules.shown(p.deliverables || []).length, os = SMPRules.shown(p.outcomes || []).length;
        return '<div class="rdir' + (open ? " open" : "") + '" data-rdir="' + esc(id) + '">' +
          '<div class="rfold" role="button" tabindex="0" aria-expanded="' + (open ? "true" : "false") + '">' +
          '<span class="rcode">' + esc(projCode(holderCodeOwner(c), p)) + '</span>' +
          '<h3>' + esc(p.name || "") + (p.brief ? '<span class="rsub">' + esc(p.brief) + '</span>' : '') + '</h3>' +
          '<span class="rsum">' + (p.owner ? esc(p.owner) + ' · ' : '') + '<b>' + ds + '</b> deliverable' + (ds === 1 ? "" : "s") + ' · <b>' + os + '</b> outcome' + (os === 1 ? "" : "s") +
          ' · <b>' + m.done + '</b> of <b>' + m.total + '</b> milestones · <b style="color:' + bandInk(sc) + '">' + pct(sc) + '</b></span>' + stand(sc) +
          '<span class="rchev" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l5 5 5-5"/></svg></span></div>' +
          '<div class="rmore">' + dxTable(p) + milestoneRows(p) + '</div></div>';
      }).join("") + '</div>';
  }
  function dxTable(p) {
    var rows = SMPRules.shown(p.deliverables || []).map(function (d) { return { d: true, o: d }; })
      .concat(SMPRules.shown(p.outcomes || []).map(function (o) { return { d: false, o: o }; }));
    if (!rows.length) return '<p class="rnone">No deliverables or outcomes yet.</p>';
    return '<table class="rtable rdx"><thead><tr><th>Deliverable or outcome</th><th>Kind</th><th class="num">Target</th><th>Reads</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var v = r.d ? delivReads(r.o) : r.o.progress;
        return '<tr><td>' + esc(r.o.name || "") + '</td><td class="row">' + (r.d ? "Deliverable" : "Outcome") + '</td>' +
          '<td class="num">' + (r.d ? "Y/N" : (r.o.target ? (r.o.dir ? esc(r.o.dir) + ' ' : '') + esc(r.o.target) : '\u2014')) + '</td>' +
          '<td>' + (r.d ? statusPill(r.o, "Delivered") : (v == null || v === "" ? '\u2014' : esc(String(v)) + '%')) + '</td></tr>';
      }).join("") + '</tbody></table>';
  }
  function milestoneRows(p) {
    var rows = SMPRules.shown(p.milestones || []);
    if (!rows.length) return '<p class="rnone">No milestones yet.</p>';
    return '<table class="rtable rms"><thead><tr><th>Milestone</th><th>Due</th><th>Status</th><th class="num">Done</th></tr></thead><tbody>' +
      rows.map(function (m) {
        var v = msReads(m);
        return '<tr><td>' + esc(m.name || "") + '</td><td class="row">' + dxDate(m.finish, m.status === "done") + '</td><td>' + statusPill(m, "Completed") + '</td>' +
          '<td class="num">' + (v == null ? '\u2014' : v + '%') + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  /* ── A FUNCTION THAT PLANS IN OBJECTIVES AND ACTIONS (§692, §342) ────
     Its page's two cards (fnObjCards): the objectives' score and the
     actions due so far as read; its plan, the objectives and the actions
     as two tables. */
  function objPerformance(key) {
    var fk = fnKey(key), h = fnOwnHolder(fk), t = fnActionsTally(fk);
    return '<div class="rthree rtwo-fig">' +
      figure(fnObjScore(fk), L1("keyobj") + "s", "the " + esc(L1("fnword")).toLowerCase() + "\u2019s own objectives against their targets") +
      figure(t.pct, L("action"), "the " + esc(L("action")).toLowerCase() + " due so far, as read; " + t.done + " of " + t.total + " done") + '</div>' +
      '<div class="rcard"><h3>' + esc(L1("keyobj")) + 's</h3>' + measureRows(h ? h.keyObjectives : []) + '</div>' +
      '<div class="rcard"><h3>' + esc(L("action")) + '</h3>' + actionRows(fk) + '</div>';
  }
  function objectives(key) {
    var fk = fnKey(key), h = fnOwnHolder(fk);
    return '<div class="rcard"><h3>' + esc(L1("keyobj")) + 's</h3>' + measureRows(h ? h.keyObjectives : []) + '</div>' +
      '<div class="rcard"><h3>' + esc(L("action")) + '</h3>' + actionRows(fk) + '</div>';
  }
  function actionRows(fk) {
    var rows = SMPRules.shown(fnActions(fk));
    if (!rows.length) return '<p class="rnone">No ' + esc(L("action")).toLowerCase() + ' yet.</p>';
    return '<table class="rtable racts"><thead><tr><th>' + esc(L1("action")) + '</th><th>Owner</th><th>Due</th><th>Status</th><th class="num">Done</th></tr></thead><tbody>' +
      rows.map(function (a) {
        var v = msReads(a);
        return '<tr><td>' + esc(a.name || "") + '</td><td class="row">' + esc(a.owner || "\u2014") + '</td><td class="row">' + dxDate(a.due, a.status === "done") + '</td>' +
          '<td>' + statusPill(a, "Done") + '</td><td class="num">' + (v == null ? '\u2014' : v + '%') + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  /* ── A DIVISION (§692) ─────────────────────────────────────────────────
     Its Performance page's own cards (renderCompanyPerformance): the units'
     performance at their weights re-normalised to the division, their
     execution as a share of plan, and the division's share of the group;
     then each unit's own readings, and the supporting functions it holds
     with their headline. */
  function fnHeadline(fk) {
    var f = FUNCTIONS[fk]; if (!f) return null;
    if (fnPlansInPillars(f)) { var u = fnAsUnit(fk); return u ? unitObjectives(u) : null; }
    if (fnPlansInObjectives(f)) return fnObjScore(fk);
    var h = fnOwnHolder(fk); return h ? capPerf(h) : null;
  }
  function coPerformance(ck) {
    var co = COMPANIES[ck]; if (!co) return '<p class="rnone">No such division.</p>';
    syncWeights();
    var keys = companyUnitKeys(ck), fks = companyFnKeys(ck), share = companyWeight(ck);
    if (!keys.length && !fks.length) return '<p class="rnone">' + esc(co.name) + ' holds nothing yet.</p>';
    var uw = L1("unitword");
    return '<div class="rthree">' +
      figure(companyObjectives(ck), uw + "s", "the " + plural(keys.length, uw.toLowerCase()) + " in " + esc(co.name) + ", each on its own headline, at their weights") +
      figure(companyRatio(ck), "Execution", "the " + uw.toLowerCase() + "s\u2019 delivery as a share of plan, at the same weights") +
      '<div class="rfig"><b>' + share + '%</b><span>Share of the group \u2014 what these ' + uw.toLowerCase() + 's together are worth at group level</span></div></div>' +
      (keys.length ? '<div class="rcard"><h3>The ' + esc(uw.toLowerCase()) + 's it holds</h3><table class="rtable rcos"><thead><tr><th>' + esc(uw) + '</th><th class="num">Measures</th><th class="num">Directions</th><th class="num">Execution</th><th class="num">Weight in ' + esc(co.name) + '</th></tr></thead><tbody>' +
        keys.map(function (k) {
          var u = UNITS[k], w = share ? Math.round((u.weight || 0) / share * 1000) / 10 : 0;
          return '<tr><td>' + esc(u.name) + '</td><td class="num" style="color:' + bandInk(unitObjectives(u)) + '">' + pct(unitObjectives(u)) + '</td><td class="num" style="color:' + bandInk(unitPillars(u)) + '">' + pct(unitPillars(u)) + '</td>' +
            '<td class="num" style="color:' + bandInk(unitRatio(u)) + '">' + pct(unitRatio(u)) + '</td><td class="num">' + w + '%</td></tr>';
        }).join("") + '</tbody></table></div>' : '') +
      (fks.length ? '<div class="rcard"><h3>The ' + esc(L("fnword")).toLowerCase() + ' it holds</h3><table class="rtable rcofn"><thead><tr><th>' + esc(L1("fnword")) + '</th><th>Plans in</th><th class="num">Headline</th></tr></thead><tbody>' +
        fks.map(function (fk) {
          var f = FUNCTIONS[fk], v = fnHeadline(fk), way = fnFormat(f);
          return '<tr><td>' + esc(f.name) + '</td><td class="row">' + esc(way === "pillars" ? "directions" : way === "objectives" ? "objectives and actions" : L("project").toLowerCase()) + '</td><td class="num" style="color:' + bandInk(v) + '">' + pct(v) + '</td></tr>';
        }).join("") + '</tbody></table></div>' : '');
  }

  /* ── the window ── */
  function root() { return document.getElementById("readroot"); }
  function paint() {
    var r = root(); if (!r) return;
    var key = norm(ST.target);
    if (!key) { close(); return; }
    ST.target = key;
    var tabs = tabsFor(key);
    var tab = tabs.filter(function (t) { return t.k === ST.tab; })[0] || tabs[0];
    r.querySelector(".rwtop").innerHTML =
      '<span class="rmark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 13.9 10.1 21.2 12 13.9 13.9 12 21.2 10.1 13.9 2.8 12 10.1 10.1z"/></svg></span>' +
      '<span class="rco">' + esc(GROUP.org || "") + '</span>' +
      '<span class="rsp"></span>' +
      (REVIEW && REVIEW.name ? '<span class="rasof">' + esc(REVIEW.name) + '</span>' : '') +
      '<button type="button" class="rexit" data-rexit title="Exit (Esc)">Exit</button>';
    r.querySelector(".rwnav").innerHTML = rowHTML(key);
    r.querySelector(".rwtabs").innerHTML = tabs.map(function (t) {
      return '<button type="button" data-rtab="' + t.k + '"' + (t.k === tab.k ? ' aria-current="page"' : '') + '>' + esc(t.label(key)) + '</button>';
    }).join("");
    var body = tab.k === "found" ? foundation(key) : tab.k === "swot" ? analysis(key) : tab.k === "dir" ? directions(key, false)
      : tab.k === "cap" ? directions(key, true) : tab.k === "proj" ? projects(key) : tab.k === "obj" ? objectives(key) : performance(key);
    r.querySelector(".rwbody").innerHTML = body;
    r.querySelector(".rwbody").scrollTop = 0;
    ST.tab = tab.k;
    rowSettle();
    said();
  }

  /* ── THE ROW (§692): the navigator's parts, drawn in the window's own
     markup. The first part, where it is the top layer or a division, is
     pinned at the left as the company menu is; the switch is pinned; the
     names scroll between two fades that say there is more (§136). ── */
  function rowHTML(key) {
    var parts = rowParts(), names = [], ctrl = "";
    parts.forEach(function (p, i) {
      if (p.tops) {
        var here = p.tops.filter(function (x) { return x.k === key; })[0];
        ctrl += '<details class="rtops"><summary aria-haspopup="menu"' + (here ? ' class="here"' : '') + '>' + esc((here || p.tops[0]).label) + '<i aria-hidden="true">\u25be</i></summary>' +
          '<div class="rmenu" role="menu">' + p.tops.map(function (x) {
            return '<button type="button" role="menuitem" data-rgo="' + esc(x.k) + '"' + (x.k === key ? ' aria-current="true"' : '') + '>' + esc(x.label) +
              (x.k === "group" ? '' : '<span class="rsubn">' + plural(companyUnitKeys(x.k.slice(3)).length, L1("unitword"), L("unitword")) + '</span>') + '</button>';
          }).join("") + '</div></details>';
        return;
      }
      if (p.folds) {
        if (p.folds.length === 1 && p.folds[0].one) { ctrl += '<span class="rsep"></span><span class="rsw one"><span class="nsw on">' + esc(p.folds[0].label) + '</span></span>'; return; }
        if (p.folds.length > 2 || p.multi) {
          ctrl += '<span class="rsep"></span><div class="rsw multi" role="group" aria-label="Which list to show">' + p.folds.map(function (f) {
            return '<button type="button" class="nsw' + (f.open ? " on" : "") + '" data-rfold="' + esc(f.fold) + '"' + (f.co ? ' data-rco="' + esc(f.co) + '"' : '') + ' aria-pressed="' + (f.open ? "true" : "false") + '">' + esc(f.label) + '</button>';
          }).join("") + '</div>';
          return;
        }
        var lit = p.folds.filter(function (f) { return f.open; })[0] || p.folds[0];
        var other = p.folds.filter(function (f) { return f !== lit; })[0] || lit;
        ctrl += '<span class="rsep"></span><button type="button" class="rsw" data-rfold="' + esc(other.fold) + '" aria-label="Showing ' + esc(lit.label.toLowerCase()) + '. Press to show ' + esc(other.label.toLowerCase()) + '.">' +
          p.folds.map(function (f) { return '<span class="nsw' + (f.open ? " on" : "") + '">' + esc(f.label) + '</span>'; }).join("") + '</button>';
        return;
      }
      if (!p.k) return;
      var b = '<button type="button" data-rgo="' + esc(p.k) + '"' + (p.k === key ? ' aria-current="page"' : '') + '>' + esc(p.label) + '</button>';
      if (i === 0 && (p.k === "group" || /^co:/.test(p.k))) ctrl += '<span class="rtop1">' + b + '</span>'; else names.push(b);
    });
    return ctrl + (names.length ? '<span class="rsep"></span><div class="rclip"><div class="rscroll">' + names.join("") + '</div><div class="rfade l" hidden></div><div class="rfade r" hidden></div></div>' : '');
  }
  function rowSettle() {
    var r = root(), sc = r && r.querySelector(".rscroll"); if (!sc) return;
    var lit = sc.querySelector('[aria-current="page"]');
    if (lit && (lit.offsetLeft < sc.scrollLeft || lit.offsetLeft + lit.offsetWidth > sc.scrollLeft + sc.clientWidth)) sc.scrollLeft = Math.max(0, lit.offsetLeft - 24);
    fades();
  }
  function fades() {
    var r = root(), sc = r && r.querySelector(".rscroll"); if (!sc) return;
    var l = r.querySelector(".rfade.l"), rt = r.querySelector(".rfade.r");
    if (l) l.hidden = sc.scrollLeft <= 0;
    if (rt) rt.hidden = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 1;
  }
  function go(key) {
    if (!key || key === ST.target) return;
    ST.target = key; ST.open = {};
    var side = sideOf(key); if (side) ST.fold = side;
    paint();
  }

  /* WHAT THE WINDOW SHOWS, SAID TO WHOEVER LISTENS (§689): shell/route.js
     writes it into the address and reads an address back into it. */
  function state() { return { open: isOpen(), target: ST.target, tab: TAB_WORD[ST.tab] || "foundation" }; }
  function said() {
    try { document.dispatchEvent(new CustomEvent("smp:reading", { detail: state() })); } catch (e) {}
  }
  function isOpen() { var r = root(); return !!(r && r.classList.contains("on")); }

  function open(target, tab) {
    var r = root(); if (!r) return;
    var t = norm(target === null ? "" : String(target || TARGET || "group"));
    if (!t) return false;   /* nothing this viewer reaches: no window to open (§61) */
    ST.target = t;
    var side = sideOf(t); if (side) ST.fold = side;
    ST.tab = (tab && tabKeyOf(String(tab))) || "found";
    ST.open = {};
    r.classList.add("on");
    document.body.classList.add("reading");
    paint();
    r.focus();
    return isOpen();
  }
  function close() {
    var r = root(); if (!r) return;
    r.classList.remove("on");
    document.body.classList.remove("reading");
    said();
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
      /* the row (§692): a name or a top goes there; a side opens its list,
         and a side that carries a division opens that division's page too
         (§464), where the viewer reaches it */
      var goto = t.closest("[data-rgo]"); if (goto) { go(goto.getAttribute("data-rgo")); return; }
      var side = t.closest("[data-rfold]");
      if (side) {
        ST.fold = side.getAttribute("data-rfold");
        var co = side.getAttribute("data-rco");
        if (co && reachKeys().indexOf("co:" + co) >= 0 && ST.target !== "co:" + co) { ST.target = "co:" + co; ST.open = {}; }
        paint(); return;
      }
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
    r.addEventListener("scroll", function (e) { var el = e.target; if (el instanceof Element && el.classList.contains("rscroll")) fades(); }, true);
    window.addEventListener("resize", function () { if (r.classList.contains("on")) fades(); });
    /* THE WINDOW'S OWN KEYS, AND NONE OF THE PLATFORM'S WHILE IT IS UP. Taken
       at the document, first, so the tab keys, the action keys and the
       deck's own Escape (all listening at the document) never see a key
       pressed in the window: Escape returns, Enter or Space opens the
       direction under the focus, and anything else is the browser's own. */
    document.addEventListener("keydown", function (e) {
      if (!r.classList.contains("on")) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Enter" || e.key === " ") { var el = e.target; if (el instanceof HTMLElement && el.classList.contains("rfold")) { e.preventDefault(); el.click(); } }
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
    /* §692: on the first subject this seat reaches — the company where it
       reaches the company, its one unit or function where that is all */
    return !!open(null);
  }

  return { wire: wire, open: open, close: close, offer: offer, readerSeat: readerSeat, state: state, isOpen: isOpen };
})();
