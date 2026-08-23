/* ── Presentation mode ────────────────────────────────────────────────────
   A unit's review, built from whatever the platform holds at the moment it is
   opened. There is no exported copy and no version to go stale: a figure
   corrected an hour before the meeting is the figure on the slide.

   It is a mode rather than a page. It takes the whole window, the app chrome
   disappears, and Exit returns the presenter to exactly where they were.
   ──────────────────────────────────────────────────────────────────────── */

var DECK = { i:0, slides:[], root:null };

function dPct(v){ return v == null || isNaN(v) ? "&mdash;" : v + "%"; }
function dBand(v){ return band(v); }

/* ── WHERE A PICTURE SLIDE CAN GO (§50.3) ─────────────────────────────────
   An anchor is a NAMED POINT IN THIS DECK, written on the slide it names and
   carrying its own label. The position picker is built by generating the deck
   and reading these back — so the list of places a picture can go IS the deck,
   and the two cannot drift. Adding a slide to the deck later gives it a
   position in the picker for free, or gives it none, and either is a decision
   made in one place rather than in two lists that agree until they do not.

   `where` is "after" unless it says otherwise. The Thank-you slide is the one
   that says otherwise: "the end" means the last thing anybody looks at, and
   that is not after the thanks. */
function anch(key, label, where){
  return ' data-anchor="' + esc(key) + '" data-anchor-label="' + esc(label) + '"' +
    (where ? ' data-anchor-where="' + esc(where) + '"' : '');
}

/* The anchors of a deck, in the order they appear in it. Built by rendering
   the deck into a detached element — nothing is shown, and the answer is
   therefore the real deck's rather than a description of it. */
function deckAnchors(kind, key){
  var box = document.createElement("div");
  box.innerHTML = kind === "fn" ? deckSlidesFn(key) : deckSlides(UNITS[key]);
  var seen = {}, out = [];
  [].forEach.call(box.querySelectorAll("[data-anchor]"), function(el){
    var a = el.dataset.anchor;
    if (seen[a]) return;
    seen[a] = 1;
    out.push({ a:a, label:el.dataset.anchorLabel || a });
  });
  return out;
}

function deckSlides(u){
  var S = [];
  var ko = unitObjectives(u), ex = unitRatio(u);
  var dl = deltaFor(u.ukey);
  var dtag = (!dl || !dl.d) ? "" :
    '<span class="ddelta ' + (dl.d > 0 ? "up" : "down") + '">' +
    (dl.d > 0 ? "\u25b2" : "\u25bc") + " " + Math.abs(dl.d) + '</span>';

  /* 1 — the cover carries the unit and the cycle, and nothing else. */
  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") + '>' +
    '<div class="eyebrow">' + esc(GROUP.org) + '</div>' +
    '<h1 class="cover">' + esc(u.name) + '</h1><div class="coverrule"></div>' +
    '<p class="coversub">Strategy review &middot; ' + esc(REVIEW.name) + '</p></section>');

  /* 2 — what we are aiming at: statement above, targets below, no actuals. */
  /* The near horizon is hidden on a unit's objectives (§51.16). This is the
     deck's other side-by-side view of the two, so it drops the same column the
     Foundation page does — and the scoring slide further on keeps it, because
     that is where an actual is read against a target. */
  var aimNear = SHOW_KO_THIS_YEAR;
  var aimRows = u.keyObjectives.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      '<td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
      '<td class="num">' + esc(m.dir) + '</td>' +
      '<td class="num big3">' + (m.target3y ? esc(m.target3y) : "&mdash;") + '</td>' +
      (aimNear
        ? '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>'
        : '') + '</tr>';
  }).join("");
  S.push('<section class="dslide"' + anch("aim", "After \u201cWhat we are aiming at\u201d") +
    '><h2>What we are aiming at</h2>' +
    '<div class="aimtop"><div><span class="dlab">' + L("aspiration","bu") + '</span>' +
      '<p class="asp2">' + esc(u.aspiration) + '</p></div>' +
      (u.endInMind
        ? '<div><span class="dlab">End in mind</span><p class="asp3">' + esc(u.endInMind) + '</p></div>'
        : '') +
    '</div><div class="aimbottom"><span class="dlab">' + L("keyobj","bu") +
      horizonBy() + '</span>' +
      '<table class="zebra dbig"><thead><tr><th class="idx">#</th><th>Objective</th>' +
      '<th class="num">Dir.</th><th class="num">' + horizonColLabel() + '</th>' +
      (aimNear ? '<th class="num">This year</th>' : '') +
      '</tr></thead><tbody>' + aimRows + '</tbody></table>' +
    '</div></section>');

  /* 3 — the two readings, at the size they deserve. */
  S.push('<section class="dslide d-head"' + anch("stand", "After \u201cWhere the unit stands\u201d") +
    '><h2>Where the unit stands</h2>' +
    '<div class="headgrid">' +
      '<div class="headcell"><span class="dlab">' + L("keyobj","bu") + ' performance</span>' +
        '<b class="' + dBand(ko) + '">' + dPct(ko) + '</b>' +
        '<span class="headsub">' + (dtag ? dtag + " against the last cycle" : "no earlier cycle to compare") +
        '</span></div>' +
      '<div class="headcell"><span class="dlab">Execution performance</span>' +
        '<b class="' + dBand(ex) + '">' + dPct(ex) + '</b>' +
        '<span class="headsub">' + dPct(unitExec(u)) + ' delivered against ' +
          dPct(unitPlan(u)) + ' planned</span></div>' +
    '</div><p class="headfoot">Objectives measure what the unit committed to achieve. ' +
    'Execution measures whether the work behind it is landing on time.</p></section>');

  /* 4 — the objectives in detail. */
  var oRows = u.keyObjectives.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      '<td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
      '<td class="num">' + esc(m.dir) + '</td>' +
      '<td class="num">' + (m.target ? esc(m.target) : "&mdash;") + '</td>' +
      '<td class="num">' + esc(m.actual) + '</td>' +
      '<td class="num final ' + dBand(m.progress) + '">' + dPct(m.progress) + '</td></tr>';
  }).join("");
  S.push('<section class="dslide"' + anch("objectives", L("keyobj","bu") + " \u2014 after the table") +
    '><h2>' + L("keyobj","bu") + ' &mdash; where we stand</h2>' +
    '<table class="zebra dbig"><thead><tr><th class="idx">#</th><th>Objective</th>' +
    '<th class="num">Dir.</th><th class="num">This year</th><th class="num">Actual</th>' +
    '<th class="num">Progress</th></tr></thead><tbody>' + oRows + '</tbody></table></section>');

  /* 5 — SWOT opens with its own page, then one category per slide. */
  var sw = [["s","Strengths","good"],["w","Weaknesses","bad"],
            ["o","Opportunities","stone"],["t","Threats","warn"]];
  S.push('<section class="dslide d-cover"><span class="seclab">Section</span>' +
    '<h1 class="cover">SWOT</h1><div class="coverrule"></div>' +
    '<p class="coversub">Where this unit is strong, exposed, and what the market is offering it.</p>' +
    '<div class="secgrid">' + sw.map(function(x){
      return '<div class="seccell t-' + x[2] + '"><b>' + (u.swot[x[0]] || []).length + '</b>' +
        '<span>' + x[1] + '</span></div>';
    }).join("") + '</div></section>');
  sw.forEach(function(x, xi){
    var items = (u.swot[x[0]] || []).map(function(t, i){
      return '<li><span class="n">' + (i+1) + '</span><span>' + esc(t) + '</span></li>';
    }).join("");
    /* The anchor sits on the LAST category, so "after SWOT" means after all
       four rather than in the middle of them. */
    S.push('<section class="dslide d-swot t-' + x[2] + '"' +
      (xi === sw.length - 1 ? anch("swot", "After the SWOT section") : "") +
      '><h2>' + x[1] + '</h2>' +
      '<ol class="dswot">' + items + '</ol></section>');
  });

  /* 6 — the pillars, overview then one lead-in and two tables each. */
  var pRows = u.items.map(function(p, i){
    var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
    return '<tr><td class="idx">' + (i+1) + '</td><td class="dirname">' +
      '<b><span class="dcode">' + pillarCode(u, i) + '</span> ' + esc(p.name) + '</b>' +
      '<span class="dsub">' + esc(p.kind) + ' &middot; ' + esc(p.theme) + ' &middot; ' + esc(p.owner) + '</span></td>' +
      '<td class="num final ' + dBand(pillarPerf(p)) + '">' + dPct(pillarPerf(p)) + '</td>' +
      '<td class="num final ' + dBand(r) + '">' + dPct(r) + '</td></tr>';
  }).join("");
  S.push('<section class="dslide"' + anch("pillars", "After the " + L("pillar","bu").toLowerCase() + " overview") +
    '><h2>' + L("pillar","bu") + '</h2>' +
    '<table class="zebra dirs"><thead><tr><th class="idx">#</th><th>Pillar</th>' +
    '<th class="num">Measures</th><th class="num">Execution</th></tr></thead>' +
    '<tbody>' + pRows + '</tbody></table></section>');

  u.items.forEach(function(p, pi){
    var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
    S.push('<section class="dslide d-cover"><span class="seclab">' + esc(p.kind) +
      ' &middot; theme ' + esc(p.theme) + ' &middot; ' + esc(p.owner) + '</span>' +
      '<h1 class="pillarname"><span class="dcode huge">' + pillarCode(u, pi) + '</span> ' +
        esc(p.name) + '</h1>' +
      (p.sub ? '<p class="coversub">' + esc(p.sub) + '</p>' : '') +
      '<div class="coverrule"></div><div class="leadstats">' +
        '<div><span class="dlab">Key measures</span><b class="' + dBand(pillarPerf(p)) + '">' +
          dPct(pillarPerf(p)) + '</b></div>' +
        '<div><span class="dlab">Execution</span><b class="' + dBand(r) + '">' + dPct(r) + '</b></div>' +
        '<div><span class="dlab">Delivered / planned</span><b class="plain">' +
          dPct(pillarExec(p)) + ' / ' + dPct(pillarPlan(p)) + '</b></div>' +
      '</div></section>');

    var mRows = p.measures.map(function(m, i){
      return '<tr><td class="idx">' + (i+1) + '</td>' +
        '<td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
        '<td class="num">' + esc(m.dir) + '</td>' +
        '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
        '<td class="num">' + esc(m.actual) + '</td>' +
        '<td class="num final ' + dBand(m.progress) + '">' + dPct(m.progress) + '</td>' +
        (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') +
        '</tr>';
    }).join("");
    S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'M">' +
      deckPillarHead(u, p, pi, "Key measures") +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Measure</th>' +
      '<th class="num">Dir.</th><th class="num">Target</th><th class="num">Actual</th>' +
      '<th class="num">Progress</th><th>Note</th></tr></thead><tbody>' + mRows + '</tbody></table></section>');

    var tRows = p.tactics.map(function(t, i){
      if (!tacticDue(t)) {
        return '<tr class="dim"><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(t.name) + '</td><td>' + esc(t.owner) + '</td>' +
          '<td class="collabs">' + collabCell(t) + '</td>' +
          '<td class="num">' + spanLabel(t) + '</td>' +
          '<td colspan="2" class="cc">Outside this cycle</td>' +
          '<td class="dnote empty">&mdash;</td></tr>';
      }
      return '<tr><td class="idx">' + (i+1) + '</td>' +
        '<td class="lead">' + esc(t.name) + '</td><td>' + esc(t.owner) + '</td>' +
        '<td class="collabs">' + collabCell(t) + '</td>' +
        '<td class="num">' + spanLabel(t) + '</td>' +
        '<td class="num">' + (t.actual == null ? "&mdash;" : t.actual) + ' / ' + tacticPlanned(t) + '</td>' +
        '<td class="num final ' + dBand(tacticRatio(t)) + '">' + dPct(tacticRatio(t)) + '</td>' +
        (t.note ? '<td class="dnote">' + esc(t.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') +
        '</tr>';
    }).join("");
    S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'T"' +
      anch("p" + pillarCode(u, pi), "After " + pillarCode(u, pi) + " \u2014 " + p.name) + '>' +
      deckPillarHead(u, p, pi, "Tactics") +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Tactic</th><th>Owner</th>' +
      '<th>Collabs.</th>' +
      '<th class="num">Quarters</th><th class="num">Deliv. / due</th><th class="num">Of plan</th>' +
      '<th>Note</th></tr></thead><tbody>' + tRows + '</tbody></table></section>');
  });

  /* 7 — the owner's note, editable in the room. */
  S.push('<section class="dslide"' + anch("notes", "After \u201cNotes and achievements\u201d") +
    '><h2>Notes and achievements</h2>' +
    '<div class="dnotebox" contenteditable="true" data-deckunote="' + u.ukey + '">' +
      esc(REVIEW.note[u.ukey] || "") + '</div>' +
    '<p class="dhint">Editable here. A number challenged in the room is corrected in the ' +
    'platform, not in a deck that is already wrong.</p></section>');

  /* 8 — everything at risk or off track, with what is being done about it. */
  var att = [], n = 0;
  u.items.forEach(function(p, pi){
    p.measures.forEach(function(m){
      if (m.progress != null && m.progress < 70) {
        n++;
        att.push('<tr><td class="idx">' + n + '</td>' +
          '<td class="lead">' + esc(m.name) + '<span class="dsub">' + pillarCode(u, pi) +
            ' &middot; measure</span></td>' +
          '<td class="num">' + esc(m.target) + '</td><td class="num">' + esc(m.actual) + '</td>' +
          '<td class="num final ' + dBand(m.progress) + '">' + dPct(m.progress) + '</td>' +
          '<td class="dnote' + (m.note ? '' : ' empty') + '">' + (m.note ? esc(m.note) : "&mdash;") + '</td></tr>');
      }
    });
    p.tactics.forEach(function(t){
      var r = tacticRatio(t);
      if (tacticDue(t) && r != null && r < 70) {
        n++;
        att.push('<tr><td class="idx">' + n + '</td>' +
          '<td class="lead">' + esc(t.name) + '<span class="dsub">' + pillarCode(u, pi) +
            ' &middot; tactic &middot; ' + esc(t.owner) + '</span></td>' +
          '<td class="num">' + tacticPlanned(t) + '%</td><td class="num">' + t.actual + '%</td>' +
          '<td class="num final ' + dBand(r) + '">' + dPct(r) + '</td>' +
          '<td class="dnote' + (t.note ? '' : ' empty') + '">' + (t.note ? esc(t.note) : "&mdash;") + '</td></tr>');
      }
    });
  });
  if (att.length) {
    S.push('<section class="dslide" data-split="ATT"' +
      anch("attention", "After \u201cWhat needs attention\u201d") + '><h2>What needs attention' +
      '<span class="dwhich">' + att.length + ' at risk or off track</span></h2>' +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Item</th>' +
      '<th class="num">Target / due</th><th class="num">Actual</th><th class="num">Progress</th>' +
      '<th>What is being done</th></tr></thead><tbody>' + att.join("") + '</tbody></table></section>');
  }

  S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last \u2014 before Thank you", "before") +
    '><h1 class="cover">Thank you</h1>' +
    '<div class="coverrule"></div><p class="coversub">' + esc(u.name) +
    ' &middot; ' + esc(REVIEW.name) + '</p></section>');

  return S.join("");
}

function deckPillarHead(u, p, pi, which){
  var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
  return '<div class="dphdr"><h2><span class="dcode">' + pillarCode(u, pi) + '</span> ' +
    esc(p.name) + '<span class="dwhich">' + which + '</span></h2>' +
    '<div class="dstats"><span><i>Measures</i><b class="' + dBand(pillarPerf(p)) + '">' +
      dPct(pillarPerf(p)) + '</b></span>' +
    '<span><i>Delivered</i><b>' + dPct(pillarExec(p)) + '</b></span>' +
    '<span><i>Planned</i><b>' + dPct(pillarPlan(p)) + '</b></span></div></div>';
}

/* ── A supporting function's review (§15.12) ──────────────────────────────
   The same deck, carrying the project model's content: no measures, no
   tactics. One system — a function's review must read as the same product as
   a unit's, which is why every slide reuses the unit deck's shapes. */

function deckSlidesFn(fk){
  var f = FUNCTIONS[fk], caps = capsOfFunction(fk);
  var S = [];

  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") + '>' +
    '<div class="eyebrow">' + esc(GROUP.org) + '</div>' +
    '<h1 class="cover">' + esc(f.name) + '</h1><div class="coverrule"></div>' +
    '<p class="coversub">Capability review &middot; ' + esc(REVIEW.name) +
    ' &middot; ' + caps.length + (caps.length === 1 ? ' capability' : ' capabilities') + '</p></section>');

  caps.forEach(function(c){
    var ko = capKOScore(c), perf = capPerf(c), ce = capExec(c);

    /* The capability's cover carries its definition and its readings — key
       objectives only where it has any (§15.1: absent, never zero). */
    S.push('<section class="dslide d-cover"><span class="seclab">Capability &middot; ' +
        esc(f.name) + '</span>' +
      '<h1 class="cover">' + esc(c.name) + '</h1>' +
      '<p class="coversub">' + esc(c.def) + '</p>' +
      '<div class="coverrule"></div><div class="leadstats">' +
        (c.keyObjectives.length
          ? '<div><span class="dlab">Key objectives</span><b class="' + dBand(ko) + '">' + dPct(ko) + '</b></div>'
          : '') +
        '<div><span class="dlab">Project performance</span><b class="' + dBand(perf) + '">' + dPct(perf) + '</b></div>' +
        '<div><span class="dlab">Milestones</span><b class="plain">' + ce.done + ' of ' + ce.total + '</b></div>' +
      '</div></section>');

    if (c.keyObjectives.length) {
      var kRows = c.keyObjectives.map(function(m, i){
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(m.name) + '</td>' +
          '<td class="num">' + (m.weight == null ? "&mdash;" : m.weight + "%") + '</td>' +
          '<td class="num">' + esc(m.dir) + '</td>' +
          '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
          '<td class="num">' + (m.actual == null || m.actual === "" ? "&mdash;" : esc(m.actual)) + '</td>' +
          '<td class="num final ' + dBand(m.progress) + '">' + dPct(m.progress) + '</td>' +
          (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      S.push('<section class="dslide"><h2>Key objectives &mdash; where we stand' +
        '<span class="dwhich">' + esc(c.name) + '</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Objective</th>' +
        '<th class="num">Weight</th><th class="num">Dir.</th><th class="num">Target</th>' +
        '<th class="num">Actual</th><th class="num">Score</th><th>Note</th></tr></thead>' +
        '<tbody>' + kRows + '</tbody></table></section>');
    }

    var pRows = c.projects.map(function(p, i){
      var mst = projMilestones(p);
      return '<tr><td class="idx">' + (i+1) + '</td><td class="dirname">' +
        '<b>' + esc(p.name) + '</b>' +
        '<span class="dsub">' + esc(p.owner || "") + ' &middot; ' + esc(p.start) + ' &rarr; ' + esc(p.end) + '</span></td>' +
        '<td class="num">' + dPct(projDeliverySide(p)) + '</td>' +
        '<td class="num">' + dPct(projOutcomeSide(p)) + '</td>' +
        '<td class="num final ' + dBand(projPerf(p)) + '">' + dPct(projPerf(p)) + '</td>' +
        '<td class="num">' + mst.done + ' / ' + mst.total + '</td></tr>';
    }).join("");
    S.push('<section class="dslide"' + anch("cap" + c.id, "After " + c.name + " \u2014 projects") +
      '><h2>Projects<span class="dwhich">' + esc(c.name) + '</span></h2>' +
      '<table class="zebra dirs"><thead><tr><th class="idx">#</th><th>Project</th>' +
      '<th class="num">Deliverables</th><th class="num">Outcomes</th>' +
      '<th class="num">Performance</th><th class="num">Milestones</th></tr></thead>' +
      '<tbody>' + (pRows || '<tr><td colspan="6">No projects yet.</td></tr>') + '</tbody></table>' +
      '<p class="headfoot">Performance is half deliverables, half outcomes, per side. Milestones are completed of total.</p></section>');

    c.projects.forEach(function(p){
      var mst = projMilestones(p);
      S.push('<section class="dslide d-cover"><span class="seclab">' + esc(c.name) +
          ' &middot; ' + esc(p.owner || "") + ' &middot; ' + esc(p.start) + ' &rarr; ' + esc(p.end) + '</span>' +
        '<h1 class="pillarname">' + esc(p.name) + '</h1>' +
        '<p class="coversub">' + esc(p.brief || "") + '</p>' +
        '<div class="coverrule"></div><div class="leadstats">' +
          '<div><span class="dlab">Performance</span><b class="' + dBand(projPerf(p)) + '">' + dPct(projPerf(p)) + '</b></div>' +
          '<div><span class="dlab">Deliverables</span><b class="' + dBand(projDeliverySide(p)) + '">' + dPct(projDeliverySide(p)) + '</b></div>' +
          '<div><span class="dlab">Outcomes</span><b class="' + dBand(projOutcomeSide(p)) + '">' + dPct(projOutcomeSide(p)) + '</b></div>' +
          '<div><span class="dlab">Milestones</span><b class="plain">' + mst.done + ' of ' + mst.total + '</b></div>' +
        '</div></section>');

      var dRows = p.deliverables.map(function(d, i){
        var v = delivReads(d);
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(d.name) + '</td>' +
          '<td>' + esc(d.owner || "—") + '</td>' +
          '<td class="num">' + esc(d.due || "—") + '</td>' +
          '<td class="num">' + (d.actual == null || d.actual === "" ? "&mdash;"
            : d.kind === "pct" ? esc(String(d.actual)) + "%"
            : (String(d.actual).toLowerCase() === "yes" ? "Delivered" : "Not yet")) + '</td>' +
          '<td class="num final ' + dBand(v) + '">' + dPct(v) + '</td>' +
          (d.note ? '<td class="dnote">' + esc(d.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      S.push('<section class="dslide" data-split="' + esc(p.id) + 'D">' +
        '<h2>' + esc(p.name) + '<span class="dwhich">Deliverables</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Deliverable</th>' +
        '<th>Owner</th><th class="num">Due</th><th class="num">Reported</th><th class="num">Reads</th>' +
        '<th>Note</th></tr></thead><tbody>' + dRows + '</tbody></table></section>');

      var oRows = p.outcomes.map(function(o, i){
        if (o.progress == null) {
          return '<tr class="dim"><td class="idx">' + (i+1) + '</td>' +
            '<td class="lead">' + esc(o.name) + '</td>' +
            '<td class="num">' + esc(o.target) + '</td>' +
            '<td colspan="2" class="cc">Measured at ' + esc(o.measureAt || "—") + '</td>' +
            '<td class="dnote empty">&mdash;</td></tr>';
        }
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(o.name) + '</td>' +
          '<td class="num">' + esc(o.target) + '</td>' +
          '<td class="num">' + esc(o.actual) + '</td>' +
          '<td class="num final ' + dBand(o.progress) + '">' + dPct(o.progress) + '</td>' +
          (o.note ? '<td class="dnote">' + esc(o.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      S.push('<section class="dslide" data-split="' + esc(p.id) + 'O">' +
        '<h2>' + esc(p.name) + '<span class="dwhich">Outcomes</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Outcome</th>' +
        '<th class="num">Target</th><th class="num">Actual</th><th class="num">Reads</th>' +
        '<th>Note</th></tr></thead><tbody>' + oRows + '</tbody></table></section>');

      var over = projOverruns(p).map(function(m){ return m.id; });
      var mRows = p.milestones.map(function(m, i){
        var word = m.status === "done" ? "Completed" : m.status === "wip" ? "In progress" : "Not started";
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(m.name) +
          (m.covers ? '<span class="dsub">' + esc(m.covers) + '</span>' : '') + '</td>' +
          '<td>' + esc(m.owner || "—") + '</td>' +
          '<td class="num' + (over.indexOf(m.id) > -1 ? ' warn' : '') + '">' + esc(m.finish) +
          (over.indexOf(m.id) > -1 ? ' <span class="dsub">after the project ends</span>' : '') + '</td>' +
          '<td class="num final ' + (m.status === "done" ? "good" : m.status === "wip" ? "attn" : "") + '">' + word + '</td>' +
          (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      S.push('<section class="dslide" data-split="' + esc(p.id) + 'M">' +
        '<h2>' + esc(p.name) + '<span class="dwhich">Milestones &middot; ' + mst.done + ' of ' + mst.total + ' completed</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Milestone</th>' +
        '<th>Owner</th><th class="num">Finish</th><th class="num">Status</th>' +
        '<th>Note</th></tr></thead><tbody>' + mRows + '</tbody></table></section>');
    });
  });

  /* Everything at risk or off track across the function, with what is being
     done — the same closing gather a unit's deck makes. */
  var att = [], n = 0;
  caps.forEach(function(c){
    c.projects.forEach(function(p){
      p.deliverables.forEach(function(d){
        var v = delivReads(d);
        if (delivDue(d) && v != null && v < 70) {
          n++;
          att.push('<tr><td class="idx">' + n + '</td>' +
            '<td class="lead">' + esc(d.name) + '<span class="dsub">' + esc(p.name) + ' &middot; deliverable</span></td>' +
            '<td class="num">' + esc(d.due || "—") + '</td>' +
            '<td class="num final ' + dBand(v) + '">' + dPct(v) + '</td>' +
            '<td class="dnote' + (d.note ? '' : ' empty') + '">' + (d.note ? esc(d.note) : "&mdash;") + '</td></tr>');
        }
      });
      p.outcomes.forEach(function(o){
        if (o.progress != null && o.progress < 70) {
          n++;
          att.push('<tr><td class="idx">' + n + '</td>' +
            '<td class="lead">' + esc(o.name) + '<span class="dsub">' + esc(p.name) + ' &middot; outcome</span></td>' +
            '<td class="num">' + esc(o.target) + '</td>' +
            '<td class="num final ' + dBand(o.progress) + '">' + dPct(o.progress) + '</td>' +
            '<td class="dnote' + (o.note ? '' : ' empty') + '">' + (o.note ? esc(o.note) : "&mdash;") + '</td></tr>');
        }
      });
      projOverruns(p).forEach(function(m){
        n++;
        att.push('<tr><td class="idx">' + n + '</td>' +
          '<td class="lead">' + esc(m.name) + '<span class="dsub">' + esc(p.name) + ' &middot; milestone overrun</span></td>' +
          '<td class="num">' + esc(m.finish) + '</td>' +
          '<td class="num">ends ' + esc(p.end) + '</td>' +
          '<td class="dnote' + (m.note ? '' : ' empty') + '">' + (m.note ? esc(m.note) : "&mdash;") + '</td></tr>');
      });
    });
  });
  if (att.length) {
    S.push('<section class="dslide" data-split="FNATT"' +
      anch("attention", "After \u201cWhat needs attention\u201d") + '><h2>What needs attention' +
      '<span class="dwhich">' + att.length + ' at risk, off track or overrunning</span></h2>' +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Item</th>' +
      '<th class="num">Target / due</th><th class="num">Reads</th>' +
      '<th>What is being done</th></tr></thead><tbody>' + att.join("") + '</tbody></table></section>');
  }

  S.push('<section class="dslide"' + anch("notes", "After \u201cNotes and achievements\u201d") +
    '><h2>Notes and achievements</h2>' +
    '<div class="dnotebox" contenteditable="true" data-deckunote="fn:' + esc(fk) + '">' +
      esc(REVIEW.note["fn:" + fk] || "") + '</div>' +
    '<p class="dhint">Editable here. A number challenged in the room is corrected in the ' +
    'platform, not in a deck that is already wrong.</p></section>');

  S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last \u2014 before Thank you", "before") +
    '><h1 class="cover">Thank you</h1>' +
    '<div class="coverrule"></div><p class="coversub">' + esc(f.name) +
    ' &middot; ' + esc(REVIEW.name) + '</p></section>');

  return S.join("");
}

/* ── Opening, moving and closing ──────────────────────────────────────── */

/* The custodian's own slides, put into the deck they were placed in (§50.3).

   BEFORE THE FIT PASS, deliberately: the fit pass CLONES a long table's slide
   to continue it, so a picture slide inserted afterwards could land between a
   table and its own continuation — and an anchor read after cloning would
   match twice.

   AN ANCHOR THAT IS NO LONGER THERE IS NOT A LOST SLIDE. A pillar can be
   renamed, replaced by an upload or removed between the day a picture was
   placed and the day the deck is opened; the picture then goes to the end,
   where it is still in the room, rather than being silently dropped. */
function insertPictureSlides(deck, target, blank){
  var list = pslidesOf(target);
  if (!list.length) return;
  var host = {}, where = {};
  [].forEach.call(deck.querySelectorAll("[data-anchor]"), function(el){
    var a = el.dataset.anchor;
    if (host[a]) return;
    host[a] = el;
    where[a] = el.dataset.anchorWhere === "before" ? "beforebegin" : "afterend";
  });
  var tail = deck.querySelector("[data-anchor-where='before']");
  list.forEach(function(sl){
    var html = pslideHtml(sl, blank);
    /* A slide somebody started and put no picture in is not shown — and it
       must not move the anchor either, or the NEXT slide on that anchor would
       be placed after whatever happened to follow it. The editor passes
       `blank` and does see it (§51.8). */
    if (!html) return;
    var at = host[sl.at];
    if (!at) { /* the anchor has gone; the slide has not */
      if (tail) tail.insertAdjacentHTML("beforebegin", html);
      else deck.insertAdjacentHTML("beforeend", html);
      return;
    }
    at.insertAdjacentHTML(where[sl.at], html);
    /* Two slides on one anchor keep the order they were written in: the next
       one hangs off the one just inserted, not off the anchor again. */
    host[sl.at] = where[sl.at] === "before" || where[sl.at] === "beforebegin"
      ? at.previousElementSibling : at.nextElementSibling;
    where[sl.at] = "afterend";
  });
}

function openDeckWith(titleHtml, slides, target){
  var root = document.getElementById("deckroot");
  root.querySelector(".deck").innerHTML = slides;
  if (target) insertPictureSlides(root.querySelector(".deck"), target);
  root.querySelector(".dtitle").innerHTML = titleHtml;
  root.classList.add("on");
  document.body.classList.add("presenting");
  deckFitPass();
  deckIndex();
  deckShow(0);
  deckScale();
  root.focus();
}
function openDeck(u){
  openDeckWith("<b>" + esc(u.name) + "</b> &middot; " + esc(REVIEW.name), deckSlides(u), u.ukey);
}
function openDeckFn(fk){
  openDeckWith("<b>" + esc(FUNCTIONS[fk].name) + "</b> &middot; " + esc(REVIEW.name),
    deckSlidesFn(fk), "fn:" + fk);
}
function closeDeck(){
  var root = document.getElementById("deckroot");
  root.classList.remove("on");
  document.body.classList.remove("presenting");
  if (document.fullscreenElement) document.exitFullscreen();
}

/* Squeeze anything that overruns, then split what still does. Run once on
   open, so the deck never reflows while it is being presented. */
function deckFitPass(){
  var deck = document.querySelector("#deckroot .deck");
  var all = deck.querySelectorAll(".dslide");
  [].forEach.call(all, function(s){
    s.classList.add("on");
    if (s.scrollHeight > s.clientHeight) s.classList.add("tight");
    s.classList.remove("on");
  });
  for (var pass = 0; pass < 20; pass++) {
    var changed = false;
    [].forEach.call(deck.querySelectorAll(".dslide[data-split]"), function(s){
      s.classList.add("on");
      var tb = s.querySelector("tbody");
      if (!tb || tb.rows.length < 2 || s.scrollHeight <= s.clientHeight) {
        s.classList.remove("on"); return;
      }
      var next = s.nextElementSibling;
      /* A continuation is splittable in its turn, or a long table stops one
         slide short and quietly overflows. */
      if (!next || next.dataset.cont !== s.dataset.split) {
        next = s.cloneNode(true);
        next.dataset.cont = s.dataset.split;
        next.querySelector("tbody").innerHTML = "";
        var h2 = next.querySelector("h2");
        if (h2 && !h2.querySelector(".contd"))
          h2.insertAdjacentHTML("beforeend", '<span class="contd">continued</span>');
        s.parentNode.insertBefore(next, s.nextSibling);
      }
      var ntb = next.querySelector("tbody");
      ntb.insertBefore(tb.rows[tb.rows.length - 1], ntb.firstChild);
      changed = true;
      s.classList.remove("on");
    });
    if (!changed) break;
  }
  [].forEach.call(deck.querySelectorAll(".dslide"), function(s){ s.classList.remove("on"); });
}

function deckIndex(){
  var root = document.getElementById("deckroot");
  DECK.slides = [].slice.call(root.querySelectorAll(".dslide"));
  root.querySelector(".dcount-t").textContent = DECK.slides.length;
  var dots = root.querySelector(".ddots");
  dots.innerHTML = DECK.slides.map(function(_, k){
    return '<button class="ddot" data-dgo="' + k + '" aria-label="Slide ' + (k+1) + '"></button>';
  }).join("");
  [].forEach.call(dots.querySelectorAll(".ddot"), function(b){
    b.addEventListener("click", function(){ deckShow(+b.dataset.dgo); });
  });
}
function deckShow(n){
  DECK.i = Math.max(0, Math.min(DECK.slides.length - 1, n));
  DECK.slides.forEach(function(s, k){ s.classList.toggle("on", k === DECK.i); });
  var root = document.getElementById("deckroot");
  [].forEach.call(root.querySelectorAll(".ddot"), function(b, k){
    b.classList.toggle("on", k === DECK.i);
  });
  root.querySelector(".dcount-c").textContent = DECK.i + 1;
}
/* Scale the fixed stage into whatever room there is. */
function deckScale(){
  var root = document.getElementById("deckroot");
  var deck = root.querySelector(".deck");
  if (root.classList.contains("fitwin")) { deck.style.transform = ""; return; }
  var st = root.querySelector(".deckstage");
  var k = Math.min(st.clientWidth / 1600, st.clientHeight / 900);
  deck.style.transform = "scale(" + k + ")";
}

function wireDeck(){
  var root = document.getElementById("deckroot");
  root.querySelector("[data-dnext]").addEventListener("click", function(){ deckShow(DECK.i + 1); });
  root.querySelector("[data-dprev]").addEventListener("click", function(){ deckShow(DECK.i - 1); });
  root.querySelector("[data-dexit]").addEventListener("click", closeDeck);
  root.querySelector("[data-dfit]").addEventListener("click", function(){
    root.classList.toggle("fitwin");
    this.textContent = root.classList.contains("fitwin") ? "16:9" : "Fit";
    deckScale();
  });
  root.querySelector("[data-dfs]").addEventListener("click", function(){
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen();
  });
  root.addEventListener("input", function(ev){
    var box = ev.target.closest("[data-deckunote]");
    if (box) REVIEW.note[box.dataset.deckunote] = box.textContent;
  });
  addEventListener("resize", deckScale);
  addEventListener("fullscreenchange", deckScale);
  addEventListener("keydown", function(ev){
    if (!root.classList.contains("on")) return;
    if (ev.target.isContentEditable) { if (ev.key === "Escape") ev.target.blur(); return; }
    if (ev.key === "ArrowRight" || ev.key === " ") { ev.preventDefault(); deckShow(DECK.i + 1); }
    if (ev.key === "ArrowLeft") deckShow(DECK.i - 1);
    if (ev.key === "Home") deckShow(0);
    if (ev.key === "End") deckShow(DECK.slides.length - 1);
    if (ev.key === "Escape") closeDeck();
    if (ev.key === "f" || ev.key === "F") root.querySelector("[data-dfs]").click();
    if (ev.key === "w" || ev.key === "W") root.querySelector("[data-dfit]").click();
  });
}
