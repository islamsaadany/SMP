/* VOCABULARY, fixed after review:
     Group theme  = One Trade / Deepen Value Chain / Diversification.
                    The group's motto elements; the temple's columns.
     Pillar       = a business unit's direction OR capability. Each carries
                    key measures and tactics, and is tagged with one group theme.
     Performance  = the score from a pillar's KEY MEASURES. Primary.
     Execution    = the score from its TACTICS. Secondary, never blended in. */

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }
/* Four bands. 70 and 50 match the platform's existing STATUS_THRESHOLDS so
   the strategy layer and the functional layer never disagree about a colour;
   85 is the added top edge that splits on-track from needs-attention. */
function band(v){ return bandOf(v).key; }
function bandWord(v){ return bandOf(v).label; }
/* A score with nothing behind it renders as a dash, never as the number zero
   and never as the word null. This is the brief's rule made a single function
   so it cannot be forgotten at one call site out of twenty. */
/* A mark, not a label. The row already carries six numbers, and a word beside
   every marked one turns a quiet signal into a column of shouting. */
function fmark(id){
  return isFocus(id) ? '<span class="fmark" title="Carries reward this cycle"></span>' : '';
}


/* What a score was at the last close, shown beside what it is now. This is the
   only reason the cycle exists: a figure with no past is a fact, a figure with
   a delta is a story. Nothing renders before the first close. */
function deltaTag(key){
  var d = deltaFor(key);
  if (!d || !d.d) return "";
  var up = d.d > 0;
  return '<span class="delta ' + (up ? "up" : "down") + '" title="was ' + d.was +
    '% at the last close">' + (up ? "\u25b2" : "\u25bc") + " " + Math.abs(d.d) + '</span>';
}

function pct(v){ return v == null || isNaN(v) ? "&mdash;" : v + "%"; }
function pctBig(v){ return v == null || isNaN(v) ? '<span class="nodata">&mdash;</span>' : v + '<small>%</small>'; }

function varCell(a, p){
  if (a == null || p == null) return '<span class="pill none">&mdash;</span>';
  var d = a - p;
  var c = d >= 0 ? "var(--good-tx)" : d <= -8 ? "var(--bad-tx)" : "var(--warn-tx)";
  return '<span style="color:' + c + '">' + (d >= 0 ? "+" : "−") + Math.abs(d) + '</span>';
}

function scoreCard(title, val, opts){
  opts = opts || {};
  var b = band(val), body;
  if (val == null) {
    body = '<div class="big nodata">' + (opts.empty || "Not yet measurable") + '</div><div class="track empty"></div>';
  } else {
    var vs = opts.planned != null ? ' <span class="vs">vs ' + opts.planned + '% planned</span>' : '';
    var mark = opts.planned != null ? '<div class="marker" style="left:' + opts.planned + '%"></div>' : '';
    body = '<div class="big">' + val + '<small>%</small>' + vs + '</div>' +
           '<div class="track"><div class="fill" style="width:' + val + '%;background:var(--' + b + ')"></div>' + mark + '</div>';
  }
  return '<div class="card' + (opts.primary ? ' primary-card' : '') + '">' +
         '<div class="score-h"><h3>' + title + (opts.primary ? ' <span class="rank">primary</span>' : '') + '</h3>' +
         '<span class="pill ' + b + '">' + (opts.pill || bandWord(val)) + '</span></div>' +
         body + (opts.sub ? '<p class="sub">' + opts.sub + '</p>' : '') + '</div>';
}


/* ── Visual performance: a labelled row with a primary Performance bar and a
   secondary Execution bar carrying its planned marker. Used everywhere the
   group compares things, in place of a table. ─────────────────────── */
function bar(label, val, opts){
  opts = opts || {};
  if (val == null) {
    return '<div class="bar' + (opts.sec ? ' sec' : '') + '"><label>' + label + '</label>' +
           '<div class="bar-track"></div><span class="bar-none">&mdash;</span></div>';
  }
  var plan = opts.planned != null
    ? '<i class="bar-plan" style="left:' + opts.planned + '%" data-l="' + (opts.planLabel || "plan " + opts.planned + "%") + '"></i>'
    : '';
  var colour = opts.sec ? "var(--stone-soft)" : "var(--" + band(val) + ")";
  return '<div class="bar' + (opts.sec ? ' sec' : '') + '"><label>' + label + '</label>' +
         '<div class="bar-track"><div class="bar-fill" style="width:' + val + '%;background:' + colour + '"></div>' +
         plan + '</div><span class="bar-val">' + val + '%</span></div>';
}


/* ── Circular gauge. Units read as distinct objects rather than rows to
   compare along a shared scale. ──────────────────────────────────── */
function gauge(val, label, small){
  var cls = "gauge" + (small ? " sm" : "");
  if (val == null) {
    return '<div class="' + cls + '" style="--p:0;--c:var(--none)"><span class="gauge-in">' +
           '<b style="font-size:15px;color:var(--none)">&mdash;</b><em>' + label + '</em></span></div>';
  }
  return '<div class="' + cls + '" style="--p:' + val + ';--c:var(--' + band(val) + ')">' +
         '<span class="gauge-in"><b>' + val + '<span style="font-size:.55em">%</span></b><em>' + label + '</em></span></div>';
}

function tip(text){
  return '<span class="tip" tabindex="0" data-tip="' + esc(text).replace(/"/g,"&quot;") + '">i</span>';
}

/* name → gauge → execution strip. `opts.href` makes the whole card open a unit. */
function gaugeCard(name, sub, perf, exec, planned, opts){
  opts = opts || {};
  var execLine = exec == null ? '' :
    '<div class="gexec">' + gauge(exec, "exec", true) +
    '<span>Execution <b>' + exec + '%</b>' +
    (planned != null ? '<br><span style="color:var(--ink-3)">plan ' + planned + '% &middot; ' + varCell(exec, planned) + '</span>' : '') +
    '</span></div>';
  return '<div class="gcard' + (opts.click ? ' click' : '') + '"' + (opts.go ? ' data-go="' + opts.go + '"' : '') + '>' +
    gauge(perf, "performance") +
    '<div><div class="gname">' + name + '</div>' + (sub ? '<div class="gsub">' + sub + '</div>' : '') + '</div>' +
    execLine + '</div>';
}


/* ── Modal registry. Drill-downs render into a dialog rather than expanding
   the page, so a full table fits without the layout shifting. ─────── */
var MODALS = {};
var MODAL_N = 0;
function modalFor(title, sub, body){
  var id = "m" + (++MODAL_N);
  MODALS[id] = { title: title, sub: sub, body: body };
  return id;
}
/* The glyph is an "i", not a "+": these buttons open an EXPLANATION of how a
   number was derived, they never add anything. A plus promises creation. */
function plus(id, label){
  return '<button class="plusbtn" data-modal="' + id + '" aria-label="' + esc(label) + '">i</button>';
}

/* A headline figure whose derivation opens in a modal. */
function drillCard(title, val, opts){
  opts = opts || {};
  /* A NUMBER THAT IS NOT A SCORE MUST NOT WEAR A SCORING COLOUR (§68). The
     company page's "share of the group" is 43%, and band(43) is off-track red —
     so the card said a perfectly ordinary share of a ten-unit group was
     failing. The bands mean something, and spending them on a number that is
     not being judged is how they stop meaning it. */
  var b = opts.plain ? "stone" : band(val);
  var id = modalFor(opts.modalTitle || title.replace(/<[^>]*>/g, ""), opts.modalSub, opts.drill);
  var vs = opts.planned != null ? ' <span class="vs">vs ' + opts.planned + '% planned</span>' : '';
  var mark = opts.planned != null ? '<div class="marker" style="left:' + opts.planned + '%"></div>' : '';
  var body = val == null
    ? '<div class="big nodata">' + (opts.empty || "Not yet measurable") + '</div><div class="track empty"></div>'
    : '<div class="big">' + val + '<small>%</small>' + vs + '</div>' +
      '<div class="track"><div class="fill" style="width:' + val + '%;background:var(--' + b + ')"></div>' + mark + '</div>';
  return '<div class="card' + (opts.primary ? ' primary-card' : '') + '">' +
    '<div class="score-h"><h3>' + title + (opts.primary ? ' <span class="rank">primary</span>' : '') + '</h3>' +
    '<span class="pill ' + (opts.plain ? "kind" : b) + '">' +
      (opts.pill || bandWord(val)) + '</span></div>' +
    body + (opts.sub ? '<p class="sub">' + opts.sub + '</p>' : '') +
    '<p class="sub"><button class="linkbu" data-modal="' + id + '">How this is calculated &rarr;</button></p></div>';
}

/* Dark header with the name, then Objectives (2/3, the dial) and Execution
   (1/3, figures). Execution is a RATIO TO PLAN, so one number replaces two the
   reader would otherwise have to subtract. Colour appears exactly twice: the
   dial, and the variance. */
/* TEXT, so the text-weight tokens (§38): the bare --good is the fill and
   the dot, and at 3.77:1 it was not readable as a figure. */
function varColour(d){ return d >= 0 ? "var(--good-tx)" : d <= -8 ? "var(--bad-tx)" : "var(--warn-tx)"; }

function splitCard(name, sub, perf, exec, planned, perfDrill, execDrill, ctx, ctxGrip){
  var pid = modalFor(ctx + " \u2014 objectives", "Where the objectives figure comes from", perfDrill);
  var eid = execDrill ? modalFor(ctx + " \u2014 execution", "Where the execution figure comes from", execDrill) : null;

  var execBody;
  if (exec == null || planned == null || planned === 0) {
    execBody = '<div class="ratio" style="font-size:15px;color:var(--none);font-family:var(--sans)">&mdash;</div>' +
               '<span class="ratio-l">no plan</span>';
  } else {
    var ratio = Math.round((exec / planned) * 100);
    var v = exec - planned;
    execBody = '<div class="ratio">' + ratio + '<small>%</small></div>' +
      '<span class="ratio-l">of plan</span>' +
      '<dl class="led">' +
        '<dt>Delivered</dt><dd>' + exec + '%</dd>' +
        '<dt>Planned</dt><dd>' + planned + '%</dd>' +
        '<dt>Variance</dt><dd class="varv" style="color:' + varColour(v) + '">' +
          (v >= 0 ? "+" : "\u2212") + Math.abs(v) + '</dd>' +
      '</dl>';
  }

  return '<div class="gcard">' +
    '<div class="card-head">' + (ctxGrip || '') + '<div class="gname">' + name + '</div>' +
    (sub ? '<div class="gsub">' + sub + '</div>' : '') + '</div>' +
    '<div class="two">' +
      '<div class="box-obj"><div class="boxlabel"><span>Objectives</span>' +
        plus(pid, "Objectives breakdown for " + ctx) + '</div>' +
        gauge(perf, "") + '</div>' +
      '<div class="box-exec"><div class="boxlabel"><span>Execution</span>' +
        (eid ? plus(eid, "Execution breakdown for " + ctx) : '') + '</div>' +
        execBody + '</div>' +
    '</div></div>';
}

/* `sort` is the tbody's attributes when the table can be reordered — the
   container says what it holds, so nothing outside has to know (§63.3). */
function miniTable(head, rows, sort){
  return '<div class="scroll"><table><thead><tr>' +
    head.map(function(h){ return '<th>' + h + '</th>'; }).join("") +
    '</tr></thead><tbody' + (sort || "") + '>' + rows + '</tbody></table></div>';
}

function barRow(main, sub, perf, exec, planned, opts){
  opts = opts || {};
  return '<div class="brow' + (opts.total ? ' total' : '') + '">' +
    '<div class="brow-l">' + main + (sub ? '<span>' + sub + '</span>' : '') + '</div>' +
    '<div class="brow-r">' + bar("Performance", perf) +
      bar("Execution", exec, { sec: true, planned: planned }) + '</div></div>';
}

function chartLegend(){
  return '<div class="chart-legend">' +
    '<span><i class="sw" style="background:var(--good)"></i> On track 70+</span>' +
    '<span><i class="sw" style="background:var(--warn)"></i> At risk 50\u201369</span>' +
    '<span><i class="sw" style="background:var(--bad)"></i> Off track under 50</span>' +
    '<span><i class="sw" style="background:var(--stone-soft)"></i> Execution</span>' +
    '<span><i class="sw line"></i> Planned</span></div>';
}

/* Four flags, not a range — a tactic can run Q2 and Q4 with nothing between,
   and the chips have to be able to show that gap. Quarters already passed are
   marked, so a row says at a glance what is due. */
function qs(t){
  var q = quartersOf(t), out = "";
  for (var i = 0; i < 4; i++) {
    var cls = q[i] ? (i + 1 <= GROUP.asOfQuarter ? "on past" : "on") : "";
    out += '<i class="' + cls + '">' + (i + 1) + "</i>";
  }
  return '<span class="qs">' + out + "</span>";
}

/* Measure name reads left; every figure centres under its column. Progress
   carries the band colour, since it is the row's conclusion. */
function measureRows(ms, opts){
  opts = opts || {};
  var on = arranging("unit", opts.unit);
  return ms.map(function(m, i){
    var scored = m.target && m.progress != null;
    var head = '<tr data-oi="' + i + '"' + (isFocus(m.id) ? ' class="focusrow"' : '') + '><td class="idx">' +
               (on ? handle("Reorder " + m.name) : '') +
               '<span class="idx-n">' + (i+1) + '</span></td><td>' + esc(m.name) + fmark(m.id) +
               (m.horizon ? '<span class="why">measured at ' + esc(m.horizon) + '</span>' : '') +
               '</td><td class="num">' + esc(m.dir) + '</td><td class="num">' + esc(m.target) +
               '</td><td class="cc">' + esc(m.compile) + '</td>';
    if (opts.unscored) return head + '</tr>';
    return head + '<td class="num">' + esc(m.actual) + '</td>' +
           (scored
             ? '<td class="num final" style="color:var(--' + band(m.progress) + ')">' + m.progress + '%</td>'
             : '<td class="cc"><span class="pill none">Not scored</span></td>') + '</tr>';
  }).join("");
}
function measureHead(unscored){
  return '<thead><tr><th class="idx">#</th><th>Measure</th><th class="cc">Dir.</th><th class="cc">Target</th>' +
    '<th class="cc">Compile</th>' + (unscored ? '' : '<th class="cc">H1 actual</th><th class="cc">Progress</th>') +
    '</tr></thead>';
}

/* ── Owner, and the people supporting them (§50) ─────────────────
   A tactic has carried COLLABORATORS since the import template was built: the
   upload writes them, the database stores them, and being named on one is what
   lets a Contributor report a line that is theirs. What it never had was a
   COLUMN. They were a small "with A, B" line tucked under the owner's name on
   the unit's Performance page, and absent from the Plan page and the deck
   entirely — so on the two surfaces a client actually sees, the people
   supporting a tactic did not exist.

   ONE PERSON IS ACCOUNTABLE AND SEVERAL SUPPORT THEM. That is two different
   facts about a tactic, so it is two columns rather than one column carrying a
   sub-line. Owner stays exactly what it was: one name, never a list.

   ONE FUNCTION, THREE TABLES — Performance, Plan and the deck all ask here, so
   a tactic cannot say one thing on screen and another in front of the board.
   Names are TYPED, matched against a person's key or their name (lib/rules.js
   §5), which is the same weakness `owner` already carries and is recorded
   there rather than invented again here. */
function collabNames(t){
  return (t && Array.isArray(t.collaborators) ? t.collaborators : [])
    .map(function(x){ return String(x == null ? "" : x).trim(); })
    .filter(Boolean);
}
function collabText(t){ return collabNames(t).join(", "); }
/* Nobody supporting is a real and ordinary answer, not an omission — so it
   reads as an em-dash rather than as "Missing" (§15.1: absent, never zero). */
function collabCell(t){
  var n = collabNames(t);
  return n.length ? esc(n.join(", ")) : '<span class="nobody">&mdash;</span>';
}
/* Typed back the way it is shown. Commas separate; a stray semicolon or a
   trailing comma is somebody typing, not an error worth a message. */
function collabParse(v){
  return String(v == null ? "" : v).split(/[,;]/)
    .map(function(x){ return x.trim(); }).filter(Boolean);
}

/* Tactic, owner and quarters read left; the rest centres. A tactic whose
   quarters have not begun is not behind \u2014 it is not yet due, and scoring it
   would say otherwise. */
function tacticRows(ts, unitKey){
  var on = arranging("unit", unitKey);
  return ts.map(function(t, i){
    var pl = tacticPlanned(t), due = tacticDue(t), r = tacticRatio(t);
    var status = t.status === "Done" ? '<span class="pill good">Done</span>'
                                     : '<span class="pill warn">' + esc(t.status) + '</span>';
    /* Three distinct states, and they must not look alike: not yet due, due
       but unreported, and reported. */
    var tail = !due
      ? '<td class="cc" colspan="3"><span class="pill kind">Not yet due</span></td>'
      : t.actual == null
      ? '<td class="cc" colspan="3"><span class="pill none">Not reported</span>' +
        '<span class="why" style="margin:2px 0 0">due at ' + pl + '%</span></td>'
      : '<td class="num"><span class="pair"><b>' + t.actual + '</b> / ' + pl + '</span></td>' +
        '<td class="num">' + varCell(t.actual, pl) + '</td>' +
        '<td class="num final" style="color:var(--' + band(r) + ')">' + pct(r) + '</td>';
    return '<tr data-oi="' + i + '"' + (due && t.actual != null ? '' : ' class="notdue"') + '><td class="idx">' +
      (on ? handle("Reorder " + t.name) : '') +
      '<span class="idx-n">' + (i+1) + '</span></td><td>' + esc(t.name) +
      (t.outcome ? '<span class="why">' + esc(t.outcome) + '</span>' : '') + '</td>' +
      '<td>' + esc(t.owner) + '</td><td class="collabs">' + collabCell(t) + '</td>' +
      '<td>' + qs(t) + '</td><td class="cc">' + status + '</td>' + tail + '</tr>';
  }).join("");
}
function tacticHead(){
  return '<thead><tr><th class="idx">#</th><th>Tactic</th><th>Owner</th><th>Collabs.</th><th>Quarters</th>' +
    '<th class="cc">Status</th><th class="cc">Deliv. / plan</th><th class="cc">Var.</th>' +
    '<th class="cc">Of plan</th></tr></thead>';
}


/* A pillar renders as a table ROW, not a card: the list carries column
   headers once at the top rather than repeating a label under every value.
   Clicking a row opens its measures and tactics beneath it. */
var PGRID_COLS = "1fr 96px 54px 108px 78px 80px 48px 18px";
/* Open or close every panel at once, beside the first column header. Arrows
   apart mean "unfold everything"; arrows together mean "fold it back". Drawn
   rather than typed, because a glyph at this size renders differently in every
   font and the two states have to be told apart at a glance. */
var ICON_UNFOLD = '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M8 2.5v11M4.5 6L8 2.5 11.5 6M4.5 10L8 13.5 11.5 10"/></svg>';
var ICON_FOLD = '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M8 2.5v11M4.5 5.5L8 9l3.5-3.5M4.5 10.5L8 7l3.5 3.5"/></svg>';

function allToggle(){
  return '<button class="foldall" data-allrows title="Expand all" ' +
    'aria-label="Expand or collapse all">' + ICON_UNFOLD + '</button>';
}

function pgrid(on){ return "grid-template-columns:" + (on ? "26px " : "") + PGRID_COLS; }

function pillarRow(it, i, u){
  var perf = pillarPerf(it), r = pillarRatio(it);
  var on = arranging("unit", u && u.ukey);
  return '<div class="prow-wrap" data-oi="' + i + '">' +
    '<button class="prow" style="' + pgrid(on) + '" aria-expanded="false" data-p="' + i + '">' +
    (on ? handle("Reorder " + it.name) : '') +
    '<span class="pname"><b><span class="pcode">' + pillarCode(u, i) + '</span> ' + esc(it.name) + '</b>' +
      (it.sub ? '<span class="psub">' + esc(it.sub) + '</span>' : '') + '</span>' +
    '<span>' + kindPill(it) + '</span>' +
    '<span><span class="pill theme">' + esc(it.theme) + '</span></span>' +
    '<span class="powner">' + esc(it.owner) + '</span>' +
    '<span class="num lead" style="color:var(--' + band(perf) + ')">' + pct(perf) + '</span>' +
    '<span class="num" style="color:var(--' + band(r) + ')">' + pct(r) + '</span>' +
    '<span class="num">' + varCell(pillarExec(it), pillarPlan(it)) + '</span>' +
    '<span class="chev">&#9654;</span></button>' + pillarBody(it, u) + '</div>';
}

/* Compact score pair. Three figures laid across rather than stacked, so the
   card is a band rather than a column. Both headline and status word come from
   the same band function, so they can never contradict each other. */
function scorePair(perf, ex, pl, nMeasures, nScored, hi, lo){
  var r = pl ? Math.round(ex / pl * 100) : null;
  return '<div class="scores">' +
    '<div class="card tight primary"><div class="score-h"><h4>' + L("measure","bu") + ' performance</h4>' +
      '<span class="pill ' + band(perf) + '">' + bandWord(perf) + '</span></div>' +
      '<div class="headline"><span class="big" style="color:var(--' + band(perf) + ')">' + pctBig(perf) + '</span></div>' +
      '<div class="minirow"><div><em>Measures</em><b>' + nMeasures + '</b>' +
          (nScored < nMeasures ? '<em class="sub-n">' + nScored + ' scored</em>' : '') + '</div>' +
        '<div><em>Highest</em><b style="color:var(--' + band(hi) + ')">' +
          pct(hi) + '</b></div>' +
        '<div><em>Lowest</em><b style="color:var(--' + band(lo) + ')">' +
          pct(lo) + '</b></div></div></div>' +
    '<div class="card tight"><div class="score-h"><h4>Execution performance</h4>' +
      '<span class="pill ' + band(r) + '">' + bandWord(r) + '</span></div>' +
      '<div class="headline"><span class="big" style="color:var(--' + band(r) + ')">' + pctBig(r) + '</span>' +
        (r == null ? '' : '<span class="ofplan">of plan</span>') + '</div>' +
      '<div class="minirow"><div><em>Delivered</em><b>' + pct(ex) + '</b></div>' +
        '<div><em>Planned</em><b>' + pct(pl) + '</b></div>' +
        '<div><em>Variance</em><b>' + varCell(ex, pl) + '</b></div></div></div>' +
  '</div>';
}

function pillarBody(it, u){
  /* Highest and lowest read the scored measures only. Math.max over a list
     containing null treats null as zero, so an unscored measure was reporting
     a lowest of 0% \u2014 exactly the false failure the null rule exists to prevent. */
  var scored = scorableMeasures(it).map(function(m){ return m.progress; });
  var uk = u && u.ukey;
  return '<div class="pbody" hidden>' +
    scorePair(pillarPerf(it), pillarExec(it), pillarPlan(it),
              it.measures.length, scored.length,
              scored.length ? Math.max.apply(null, scored) : null,
              scored.length ? Math.min.apply(null, scored) : null) +
    '<h5 class="mini">' + L("measure","bu") + '</h5>' +
    '<div class="scroll"><table>' + measureHead() +
      '<tbody class="sortable" data-item="tr" data-kind="measures" data-u="' + uk + '">' +
      measureRows(it.measures, { unit: uk }) + '</tbody></table></div>' +
    '<h5 class="mini">' + L("tactic","bu") + '</h5>' +
    '<div class="scroll"><table>' + tacticHead() +
      '<tbody class="sortable" data-item="tr" data-kind="tactics" data-u="' + uk + '">' +
      tacticRows(it.tactics, uk) + '</tbody></table></div>' +
  '</div>';
}

function pillarList(u){
  var on = arranging("unit", u.ukey);
  return '<div class="plist' + (on ? ' arranging' : '') + '">' +
    '<div class="pheadwrap"><div class="phead" style="' + pgrid(on) + '">' +
      (on ? '<span></span>' : '') +
      '<span class="hfirst">' + L("pillar","bu") + allToggle() + '</span>' +
      '<span>Kind</span><span>Theme</span><span>Owner</span>' +
      '<span class="num">Perform.</span><span class="num">Execution</span>' +
      '<span class="num">Var.</span><span></span></div></div>' +
    '<div class="sortable" data-item=".prow-wrap" data-kind="pillars" data-u="' + u.ukey + '">' +
      u.items.map(function(it, i){ return pillarRow(it, i, u); }).join("") + '</div>' +
    '<div class="ptotal" style="' + pgrid(on) + '">' +
      (on ? '<span></span>' : '') +
      '<span>' + esc(u.name) + '<span class="tsub">' + u.items.length + ' ' + L("pillar","bu").toLowerCase() + '</span></span>' +
      '<span></span><span></span><span></span>' +
      '<span class="num">' + pct(unitPillars(u)) + '</span>' +
      '<span class="num">' + pct(unitRatio(u)) + '</span>' +
      '<span class="num">' + (function(){ var d = unitExec(u) - unitPlan(u); return (d>=0?"+":"\u2212") + Math.abs(d); })() + '</span>' +
      '<span></span></div>' +
  '</div>';
}

/* ── GROUP · Performance ─────────────────────────────────────────── */
/* §64 REVERSES HALF OF THIS SENTENCE, and the half it reverses is worth
   naming. "It is NOT a roll-up of its pillars' key measures" is still true and
   is the whole point of the two cards sitting side by side — the objectives
   figure is the unit's scorecard and nothing else feeds it. What is no longer
   true is "and never aggregate": Islam asked for the pillars' collective
   figure as a third headline, and unitPillars() has been computing it since
   the scoring model existed — it was in the rail's footer as a bare number.
   The decision that changed is where it is SHOWN, not what it means. */
var TIP_PERF = "Performance scores this unit's own Key Objectives \u2014 each actual against its target, averaged. It is NOT a roll-up of its pillars' key measures: those average to their own figure, shown beside this one, and the two are meant to be comparable rather than the same number.";
/* A FUNCTION, not a string. Every other TIP_ is a constant because it names no
   tenant-specific thing; this one names the tenant's word for a pillar, and a
   constant would freeze whatever LABELS held when the file loaded — before
   hydration on a deployed tenant, so it would say "Pillars" for a client who
   calls them Directions (§30.2's shape, in prose). */
function tipPillars(){
  var w = L("pillar", "bu").toLowerCase().replace(/s$/, "");
  return "The mean of every " + esc(w) + "'s own performance \u2014 each one being " +
    "its key measures scored against their targets, averaged. It says how the work " +
    "the unit set itself is going, one level below the Key Objectives it is judged " +
    "on, and the two are meant to be comparable rather than the same number.";
}
var TIP_EXEC = "Execution scores the tactics under this unit's pillars \u2014 each tactic's percent complete, averaged across those whose quarter span has started. Planned is derived from those same spans.";
var TIP_THEME = "Performance and execution across every pillar carrying this theme, in every business unit.";
var TIP_CAP = "Group capabilities are pillars in their own right: performance from their key measures, execution from their tactics.";

/* The legend renders from the configured bands rather than restating them,
   so editing a threshold in Setup cannot leave the legend lying. */
/* The legend row had free space at its right end and the Arrange button had a
   row of its own. They share one now. */
function bands(action){
  var b = BANDS.bands;
  return '<div class="bands"><b>Reading the colours</b>' +
    b.map(function(x,i){
      var top = i === 0 ? "%+" : "\u2013" + (b[i-1].floor - 1) + "%";
      var rng = i === b.length-1 ? "below " + b[i-1].floor + "%" : x.floor + top;
      return '<span><i style="background:var(--'+x.key+')"></i> '+x.label+' &mdash; '+rng+'</span>';
    }).join("") + (action ? '<span class="bands-act">' + action + '</span>' : '') + '</div>';
}

function arrangeBtn(scope, unitKey){
  return canArrange(scope, unitKey)
    ? '<button class="editbtn" data-arrange="1">' + (ARRANGE ? "Done" : "Arrange") + '</button>' : '';
}

/* ── The Performance page's own actions (§63) ─────────────────────────
   PERFORMANCE IS A RESULT OF REPORTING, so a row of two sibling tabs reading
   Performance | Report inside a tab already called Performance was asking the
   same word twice and calling one of them a page. Islam: "having inside
   performance 2 buttons performance and reporting actually doesn't make
   sense." Performance is now what opens, and reporting is something you GO AND
   DO from it and come back from — which is what it always was for two weeks a
   quarter (§15.10), finally said in the navigation.

   REPORT, then PRESENTATION. Entering figures is the thing somebody came here
   to do during a cycle; presenting is the thing they do at the end of one.
   Arrange has left entirely: it belongs to the plan, which is where the order
   is decided (§63.3). */
function reportBtn(target){
  var r = reportSectionState();
  if (!r) return "";
  var ac = String(target).indexOf("fn:") === 0 ? "k_report" : "u_report";
  if (grantAt(ac, target) === "none") return "";
  /* ── SOLID, NOT OUTLINED (§94, Islam 2026-08-25) ────────────────
     "the report button in performance make it all orange to obvious for the
     user." It is the one thing somebody came to this page to DO during a
     cycle, and it was wearing the same quiet outline as Presentation, Arrange
     and every other secondary control in the product.

     THE ACCENT BUDGET IS NOT BROKEN BY THIS (§41). It is one solid fill, on
     one button, drawn only while a cycle is OPEN and only for somebody who
     may report — so the page is back to its quiet register for the rest of
     the quarter, which is what a budget means. */
  return '<button class="editbtn cta" data-report="' + esc(target) + '"' +
    ' title="Enter this cycle\u2019s figures">Report' + r.badge + '</button>';
}

/* SAVE DRAFT AND CANCEL (§63.2). Islam: "keep save draft button as a feeling
   for the user that he is saving keeping the autosave just in case."

   The autosave is unchanged and still the thing that actually protects the
   work — this is the reassurance, and reassurance that lies is worse than
   none. So it FLUSHES rather than pretending to, and says which of the real
   outcomes happened: saved, already saved, refused, or there is no server here
   at all (opened from a file). Cancel leaves the mode; it does not undo,
   because there is nothing to undo — every figure was saved as it was typed,
   which is exactly why the button had to be honest about what it does. */
function draftBtns(){
  return '<span class="repdraft">' +
    '<button class="editbtn" data-repsave="1">Save draft</button>' +
    '<button class="linkbu" data-repcancel="1">Cancel</button>' +
    '<span class="savesay" data-savesay="1" role="status" aria-live="polite"></span>' +
    '</span>';
}

/* One button with two entries, the same <details> the template download uses
   (§61) — so a menu's action cannot unmount the button the click is still in
   (§47.2). "Present" starts the deck; "Manage slides" is the editor, and it
   keeps the name §51.8 settled on rather than gaining a second one. */
function presentMenu(kind, key){
  var target = kind === "fn" ? "fn:" + key : key;
  var slides = canSpeakFor(target)
    ? '<button role="menuitem" data-picedit="' + esc(kind) + '" data-pickey="' + esc(key) + '">' +
        'Manage slides' + (pslidesOf(target).length
          ? ' <span class="pill kind">' + pslidesOf(target).length + '</span>' : '') +
        '<span class="dlsub">Add and arrange your own picture slides</span></button>'
    : "";
  /* ONE ATTRIBUTE, CARRYING THE TARGET. It used to be `data-present="1"` for a
     unit and `data-present-fn="<key>"` for a function, and the unit handler
     read `UNITS[current]` — so a FUNCTION THAT PLANS IN PILLARS could not be
     presented at all: it is drawn by the unit's page, so it rendered the unit's
     button, and `UNITS["fn:merchandising"]` is undefined (§63.4). The button
     now says which target it is for and the handler resolves it, which is
     §59's `unitLike()` rule applied to the one place that still asked
     differently. */
  var present = '<button role="menuitem" data-present="' + esc(target) + '">Present' +
    '<span class="dlsub">Open the review deck for this ' +
    (String(target).indexOf("fn:") === 0 ? "function" : "unit") + '</span></button>';
  return '<details class="dlmenu right"><summary class="editbtn">Presentation' +
    '<span class="dlcar" aria-hidden="true">\u25be</span></summary>' +
    '<div class="menu" role="menu">' + present + slides + '</div></details>';
}

/* ── Cards or a table (§16.6) ────────────────────────────────────────
   Cards to judge, a table to scan: ten units or eight capabilities are quick
   to compare in a table and slow in a grid, and the reverse is true when one
   has to stand out. The toggle sits on BOTH sections or neither, or the two
   stop matching. A view preference, held for the session and stored on
   nothing — it changes how a section is laid out, not what anything is. */
var GVIEW = { units:"cards", caps:"cards" };

function viewToggle(key){
  return '<span class="minisw" role="group" aria-label="Cards or table">' +
    '<button data-gview="' + key + '|cards" aria-pressed="' + (GVIEW[key] === "cards") + '">Cards</button>' +
    '<button data-gview="' + key + '|table" aria-pressed="' + (GVIEW[key] === "table") + '">Table</button></span>';
}

/* The table mirrors the card: nothing is computed differently, only laid out
   differently. The row's conclusion is the last column and carries the band
   colour, as every table in the platform reads. */
function unitsTable(keys){
  var rows = keys.map(function(k){
    var u = UNITS[k], ko = unitObjectives(u), r = unitRatio(u);
    return '<tr><td><button class="linkbu" data-go="' + k + '">' + esc(u.name) + '</button>' +
      (u.real ? '' : '<span class="why">illustrative</span>') + '</td>' +
      '<td class="num">' + u.weight + '%</td>' +
      '<td class="num">' + u.items.length + '</td>' +
      '<td class="num">' + pct(r) + '</td>' +
      '<td class="num">' + varCell(unitExec(u), unitPlan(u)) + '</td>' +
      '<td class="num final" style="color:var(--' + band(ko) + ')">' + pct(ko) + '</td></tr>';
  }).join("");
  return '<div class="cfg"><table><thead><tr>' +
    '<th style="width:30%">Business unit</th><th class="num">Weight</th>' +
    '<th class="num">' + L("pillar","bu") + '</th><th class="num">Execution of plan</th>' +
    '<th class="num">Var.</th><th class="num">Objectives</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* Ranked on project performance — the one reading all eight capabilities
   have (§15.1). Key objectives are optional, so ranking on them would order
   the haves above the have-nots by shape rather than by standing. */
function capsTable(){
  var sorted = GROUP.capabilities.slice().sort(function(a, b){
    var pa = capPerf(a), pb = capPerf(b);
    return (pb == null ? -1 : pb) - (pa == null ? -1 : pa);
  });
  var rows = sorted.map(function(c){
    var perf = capPerf(c), ce = capExec(c), fn = functionOf(c.fn);
    var headName = fn && personName(fn.head);
    return '<tr><td>' + esc(c.name) +
      (fn ? '<span class="why">' + esc(fn.name) +
        (headName && headName !== fn.name ? " &middot; " + esc(headName) : "") + '</span>' : '') + '</td>' +
      '<td class="num">' + c.projects.length + '</td>' +
      '<td class="cc"><span class="mono">' +
        '<b style="color:var(--good-tx)">' + ce.done + '</b> / ' +
        '<b style="color:var(--attn)">' + ce.wip + '</b> / ' +
        '<span style="color:var(--none)">' + ce.todo + '</span></span></td>' +
      '<td class="num final" style="color:var(--' + band(perf) + ')">' + pct(perf) + '</td></tr>';
  }).join("");
  return '<div class="cfg"><table><thead><tr>' +
    '<th style="width:44%">Capability</th><th class="num">Projects</th>' +
    '<th class="cc">Milestones</th><th class="num">Performance</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="sub">Ranked on project performance. Milestones read completed / in progress / not started.</p>';
}


/* DIRECTION / CAPABILITY — HIDDEN, NOT REMOVED (§29).

   Islam: "across the platform hide the distinction of direction and capability.
   it will be brought later not now." So the field stays in the data, stays in
   the import template, and stays editable in Setup, where an SMO sets it. What
   goes is every place a READER meets it: the pill on a pillar, the meta line
   above it, the rail's sub-line and the Kind column in the drill table.

   One flag, because the alternative is deleting five call sites and then
   reconstructing them from a git log when the distinction comes back. Flip
   SHOW_KIND to true and every one of them returns.

   Note what is NOT touched: the "Direction" COLUMN in a key-objective table
   means the direction of travel - whether higher is better - and has nothing
   to do with this. Same word, different thing. */
var SHOW_KIND = false;
function kindPill(it){
  return SHOW_KIND ? '<span class="pill kind">' + esc(it.kind) + '</span>' : '';
}
/* The meta line, built from the parts that actually have a value. It used to
   concatenate kind, theme and owner with fixed separators, so a pillar with no
   theme and no owner read "Direction · theme ·" - two separators pointing at
   nothing. With the kind hidden that would have become "theme ·". */
function pillarMeta(it){
  var parts = [];
  if (SHOW_KIND && it.kind) parts.push(esc(it.kind));
  if (it.theme) parts.push("theme " + esc(it.theme));
  if (it.owner) parts.push(esc(it.owner));
  return parts.join(" &middot; ");
}

function section(eyebrow, title, note, body, tipText, action){
  /* A section with nothing to say in its header does not get one. Emitting an
     empty <h2> still spends its line-height and its margin, which on the unit
     Performance page was pushing the rail a heading's worth further down the
     page for a heading that rendered as blank. */
  var head = (eyebrow || title || action)
    ? '<div class="section-h">' +
        (eyebrow ? '<span class="section-n">' + eyebrow + '</span>' : '') +
        (title ? '<h2>' + title + (tipText ? tip(tipText) : '') + '</h2>' : '') +
        (action || '') + '</div>'
    : '';
  return '<div class="section">' + head +
    (note ? '<p class="sec-note">' + note + '</p>' : '') + body + '</div>';
}

/* ── Weighting configuration. Impact is the one factor a human sets, so it
   is editable here and the composite recomputes live. ─────────────── */
/* A share of nothing is not zero. Until 2026-08-20 every value here was a
   number because the demo data filled the table; a tenant that has not entered
   its factors yet has no values at all, and dividing by a total of nothing gave
   every unit a 0% share — which reads as "contributes nothing" rather than
   "not entered". Absent stays absent (§5.7). Within a factor that HAS been
   started, a unit still missing its figure counts nothing toward the total,
   because that is what a share of a total is. */
function num(v){ var n = Number(v); return (v === "" || v == null || isNaN(n)) ? null : n; }
function shareOf(vals){
  var ns = vals.map(num);
  var t = ns.reduce(function(a,b){ return a + (b == null ? 0 : b); }, 0);
  if (!t) return ns.map(function(){ return null; });
  return ns.map(function(v){ return v == null ? null : (v / t) * 100; });
}

/* Unit weights are derived from the factor table and written back onto each
   unit, so one composite serves the weighting page, the cards and the group
   compile. A weight typed on a unit record would be a second source. */
function syncWeights(){
  var res = computeWeights();
  /* Rows are matched by KEY. They were matched by display name, which is the
     rename bug all over again \u2014 renaming Mobile detached it from its factor
     row and its weight, silently. The document claimed this was already fixed;
     it was fixed for everything except the one table that owns the weights.

     The composite covers ACTIVE rows only, so it is walked over the same
     filtered list \u2014 walking all rows against a filtered composite shifts
     every weight after the first retired unit. */
  var live = GROUP.weighting.units.filter(function(row){
    return UNITS[row.key] && UNITS[row.key].active !== false;
  });
  live.forEach(function(row, i){ UNITS[row.key].weight = res.composite[i]; });
  return res;
}

/* The column always reads exactly 100, as the table's footer promises.
   Contributions are normalised to the total first and only the rounding
   remainder is given to the largest unit. Handing the whole shortfall to one
   row is what the old code did, and it was invisible while the table was full
   (the contributions already summed to 100); with a half-filled table it made
   whoever happened to be first read 100%. */
function settle(raw){
  var tot = raw.reduce(function(a,b){ return a + b; }, 0);
  var comp = tot ? raw.map(function(x){ return Math.round(x / tot * 100); })
                 : raw.map(function(){ return 0; });
  var drift = 100 - comp.reduce(function(a,b){ return a + b; }, 0);
  if (drift && comp.length) comp[comp.indexOf(Math.max.apply(null, comp))] += drift;
  return comp;
}

function computeWeights(){
  var w = GROUP.weighting;
  /* Retired units leave the composite entirely \u2014 their factor values stop
     counting toward anyone's share, and the live units re-split to 100. A
     retired unit that kept its weight would keep scoring the group. */
  var us = w.units.filter(function(row){ return UNITS[row.key] && UNITS[row.key].active !== false; });
  GROUP.weighting.units.forEach(function(row){
    if (UNITS[row.key] && UNITS[row.key].active === false) UNITS[row.key].weight = 0;
  });
  /* One share list per FACTOR, taken from the factor table rather than from
     four hardcoded names — the whole point of factors being rows is that a
     tenant can add or drop one, and a share list that only knew the original
     four left any added factor without one. */
  var sh = {};
  w.factors.forEach(function(f){
    sh[f.key] = shareOf(us.map(function(u){ return u[f.key]; }));
  });
  var fw = {};
  w.factors.forEach(function(f){ fw[f.key] = f.weight / 100; });
  /* Nothing entered anywhere: every unit counts the same. Equal weight is the
     default nobody has to defend — the same answer the Key Objectives take
     when no weights are set. Without this the whole column computed to zero and
     the rounding correction below handed all 100% to whichever unit happened to
     be first, which is a claim the tenant never made. */
  var anySet = us.some(function(u){
    return w.factors.some(function(f){ return num(u[f.key]) != null; });
  });
  if (!anySet) {
    var even = us.map(function(){ return Math.floor(100 / (us.length || 1)); });
    return { shares: sh, composite: settle(even), entered: false };
  }
  var raw = us.map(function(u, i){
    return w.factors.reduce(function(a, f){
      var sv = sh[f.key] && sh[f.key][i];
      return a + (fw[f.key] || 0) * (sv == null ? 0 : sv);
    }, 0);
  });
  return { shares: sh, composite: settle(raw.map(function(x){ return Math.round(x); })), entered: true };
}

/* The equation, written out, plus the first unit's own numbers substituted in.
   A formula nobody can check against the row above it is not an explanation. */
function weightingFormula(f, res){
  var u0 = GROUP.weighting.units[0];
  var base = "share of a factor = that unit's value \u00f7 the sum of all units' values. " +
    "contribution = " + f.map(function(){ return "(weight \u00d7 share)"; }).join(" + ") + ", summed. ";
  /* With nothing entered there is no worked example to show, and inventing one
     from empty cells would be the opposite of an explanation. */
  if (!u0 || !res.entered)
    return base + "The contributions always total 100%. Until the factors are " +
      "filled in, every business unit counts equally.";
  var terms = f.map(function(x){
    var sv = res.shares[x.key] && res.shares[x.key][0];
    return "(" + x.weight + "% \u00d7 " + (sv == null ? "\u2014" : Math.round(sv) + "%") + ")";
  }).join(" + ");
  return base + "For " + u0.unit + ": " + terms + " = " + res.composite[0] + "%. " +
    "The contributions always total 100%.";
}

/* A bound input that is not tied to a page's EDIT_PAGE flag. */
function inputOr2(value, label, setter){
  var i = FIELDS.push(setter) - 1;
  return '<input class="fld mono" data-fld="' + i + '" value="' + esc(value) +
    '" aria-label="' + esc(label) + '">';
}

function renderWeighting(){
  var w = GROUP.weighting, f = w.factors;
  var res = syncWeights();
  /* The suffix is display; what is stored is the number. A cell nobody has
     filled in shows a dash, not "undefinedB". */
  var SUFFIX = { rev:"B", prof:"M", growth:"%" };
  var shown = function(u, key){
    var n = num(u[key]);
    return n == null ? "\u2014" : n + (SUFFIX[key] || "");
  };
  var typed = function(u, key){ var n = num(u[key]); return n == null ? "" : String(n); };
  var shareCell = function(key, i){
    var sv = res.shares[key] && res.shares[key][i];
    return '<span class="why fw">' + (sv == null ? "share \u2014" : "share " + Math.round(sv) + "%") + '</span>';
  };

  var head = '<tr><th>Business unit</th>' + f.map(function(x){
      var kindNote = x.kind === "derived" ? "derived" : x.kind === "judgement" ? "set by hand" : "estimated";
      return '<th><div class="factor-h"><b>' + esc(x.name) + '</b><span>' + esc(x.basis) +
             '<br>' + kindNote + ' &middot; weight ' + x.weight + '%</span></div></th>';
    }).join("") + '<th class="wcol">Weighted<br>contribution' + tip(weightingFormula(f, res)) + '</th></tr>';

  /* Read-only until Edit is pressed. A weight determines how much a unit counts
     toward the group figure, so changing one should be an act rather than a
     stray keystroke in a table someone was reading. */
  var live = grant("g_weight") === "edit" && EDITING.weights;

  var liveRows = w.units.filter(function(row){ return UNITS[row.key] && UNITS[row.key].active !== false; });
  var retired = w.units.length - liveRows.length;
  var rows = liveRows.map(function(u, i){
    var cells = f.map(function(x){
      if (x.key === "imp") {
        var scale = "";
        for (var n = 1; n <= 4; n++) {
          scale += live
            ? '<button type="button" class="' + (n <= u.imp ? "on" : "") + '" data-imp="' + i +
              '" data-val="' + n + '" aria-label="Set impact ' + n + ' of 4 for ' + esc(u.unit) + '">' + n + '</button>'
            : '<i class="' + (n <= u.imp ? "on" : "") + '">' + n + '</i>';
        }
        /* The written reason is what makes a judgement defensible, so it stays
           where the judgement is made \u2014 in edit \u2014 and off the reading view,
           where it turned one column into a paragraph. */
        return '<td><span class="qual' + (live ? '' : ' static') + '">' + scale + '</span>' +
               (live ? (function(uu){
                   var fi = FIELDS.push(function(v){ uu.why = v; }) - 1;
                   return '<textarea class="fld why-f" rows="2" data-fld="' + fi +
                     '" aria-label="Reason for ' + esc(uu.unit) + '">' + esc(uu.why || "") + '</textarea>';
                 })(u) : '') +
               shareCell(x.key, i) + '</td>';
      }
      /* Bound like every other editable field. These rendered as bare inputs
         for two sessions \u2014 looked editable, saved nothing \u2014 which is exactly
         the failure the FIELDS registry exists to prevent. The suffix (B, M,
         %) is display; what is stored is the number. */
      var setVal = (function(uu, key){
        return function(v){
          /* Emptying a cell must unset it, not silently keep the old figure.
             The guard was there to ignore junk typing; a blank field is not
             junk, it is the tenant saying "not this one". */
          if (String(v).trim() === "") { delete uu[key]; return; }
          var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
          if (!isNaN(n)) uu[key] = n;
        };
      })(u, x.key);
      return '<td>' + (live
          ? inputOr2(typed(u, x.key), x.name + " for " + u.unit, setVal)
          : '<span class="mono val">' + shown(u, x.key) + '</span>') +
             shareCell(x.key, i) + '</td>';
    }).join("");
    return '<tr><td><b>' + esc(UNITS[u.key] ? UNITS[u.key].name : u.unit) + '</b></td>' + cells +
           '<td class="num"><b data-comp="' + i + '">' + res.composite[i] + '%</b></td></tr>';
  }).join("");

  var editorBlock = renderFactorEditor();

  var body =
    '<div class="cfg"><table><thead>' + head + '</thead><tbody>' + rows + '</tbody>' +
    '<tfoot><tr><td>Always totals</td>' + f.map(function(){ return '<td></td>'; }).join("") +
    '<td class="num">100%</td></tr></tfoot></table></div>';

  return section("", "Business unit weighting",
      res.entered ? null
        : "No factor values have been entered yet, so every business unit counts " +
          "equally in the group compile. Press Edit and fill the table to weight them.",
      '<div class="cfgwrap open">' +
        '<div class="cfg-bar">' +
          '<span class="cfg-lab">' + liveRows.length + ' business units' +
            (retired ? ' &middot; ' + retired + ' retired, excluded' : '') + '</span>' +
          (grant("g_weight") === "edit"
            ? '<button class="editbtn" data-edit="weights">' + (EDITING.weights ? "Done" : "Edit") + '</button>'
            : '<span class="pill none">View only</span>') +
        '</div>' +
        '<div class="cfg-body">' + body + '</div>' +
      '</div>') + editorBlock;
}

/* ONE UNIT CARD, DRAWN ON TWO PAGES (§68). The group's Business units section
   and a company's are the same section over a different list — extracted here
   rather than copied, because two cards that were meant to be identical and
   are maintained apart is exactly how the group and a company come to disagree
   about the same unit.

   `data-oi` is the position in the list being drawn and the handle only
   appears in arrange mode, which is reachable from the group's page alone — so
   the company page gets the card and none of the reordering. */
function unitCards(keys){
  return keys.map(function(k){
    var u = UNITS[k];
    var pd = miniTable(["Key objective","Direction","Target","H1 actual","Progress"],
      u.keyObjectives.map(function(m){
        return '<tr><td>' + esc(m.name) + '</td><td class="num">' + esc(m.dir) + '</td>' +
          '<td class="num">' + esc(m.target) + '</td><td class="num">' + esc(m.actual) +
          '</td><td class="num">' + m.progress + '%</td></tr>';
      }).join("")) +
      '<p class="sub">Headline: <b>' + unitObjectives(u) + '%</b> &mdash; ' + (KO_WEIGHTS[u.ukey] ? 'weighted' : 'equal weight') + ' across its Key Objectives. Contributes at <b>' +
      u.weight + '%</b> weight to the group.</p>' +
      '<h4 class="mini">Pillars beneath</h4>' +
      miniTable(SHOW_KIND ? ["Pillar","Kind","Theme","Performance","Of plan"]
                          : ["Pillar","Theme","Performance","Of plan"],
        u.items.map(function(it, i){
          return '<tr><td>' + pillarCode(u, i) + " " + esc(it.name) + '</td>' +
            (SHOW_KIND ? '<td>' + kindPill(it) + '</td>' : '') +
            '<td><span class="pill theme">' + it.theme + '</span></td>' +
            '<td class="num">' + pillarPerf(it) + '%</td>' +
            '<td class="num">' + pillarRatio(it) + '%</td></tr>';
        }).join("")) +
      '<p class="sub">The pillars explain the number rather than produce it &mdash; the headline above is the Key Objectives.</p>';
    var ed = miniTable(["Pillar","Delivered","Planned","Variance"],
      u.items.map(function(it, i){
        return '<tr><td>' + pillarCode(u, i) + " " + esc(it.name) + '</td><td class="num">' + pillarExec(it) +
          '%</td><td class="num">' + pillarPlan(it) + '%</td><td class="num">' + varCell(pillarExec(it), pillarPlan(it)) + '</td></tr>';
      }).join("")) +
      '<p class="sub">Mean across the unit\'s pillars: <b>' + unitExec(u) + '%</b> against <b>' +
      unitPlan(u) + '%</b> planned &mdash; <b>' + unitRatio(u) + '%</b> of plan.</p>';
    return '<div class="gwrap" data-oi="' + keys.indexOf(k) + '">' +
      splitCard('<button class="linkbu" data-go="' + k + '">' + esc(u.name) + '</button>',
        u.weight + "% weight &middot; " + u.items.length + " pillars" + (u.real ? "" : " &middot; illustrative"),
        unitObjectives(u), unitExec(u), unitPlan(u), pd, ed, u.name,
        arranging("group") ? handle("Reorder " + u.name) : '') + '</div>';
  }).join("");
}

/* ── COMPANY · Performance (§68) ──────────────────────────────────────
   Islam: "we will need to add a Companies performance page that includes the
   overall performance of the company and the general view of the units
   belonging to them, like the group's first 2 tabs in the performance."

   So it is the group's first two sections over a smaller list, and it is the
   GROUP's page that is generalised rather than a second one written beside it:
   `unitCards()` and `unitsTable()` draw the cards on both, and weightedOver()
   compiles both. A company page that drifted from the group's would be two
   answers to one question.

   TWO CARDS, NOT THREE. The group's first card is its own Key Objectives — the
   scorecard it authored — and a company has none: §23 says a company carries
   visibility rather than strategy, and §68 reverses only the "no score, no
   page" half of that. What it has is a reading of the units it holds. Stating
   that in the sub-line rather than leaving a gap where the group has a card:
   an empty slot asserts something is missing when the model simply does not
   work that way (§15.1). */
function renderCompanyPerformance(coKey){
  var ck = String(coKey).indexOf("co:") === 0 ? String(coKey).slice(3) : String(coKey);
  var co = COMPANIES[ck];
  if (!co) return '<div class="note">No such company.</div>';
  syncWeights();
  var keys = companyUnitKeys(ck);
  if (!keys.length) return '<div class="note"><b>' + esc(co.name) +
    ' holds no business unit yet.</b> A unit belongs to a company on ' +
    '<b>Setup \u2192 Business units</b>; until one does, there is nothing here to read.</div>';

  var perf = companyObjectives(ck), ex = companyExec(ck),
      pl = companyPlan(ck), r = companyRatio(ck);
  var share = companyWeight(ck);

  var perfDrill = miniTable(["Business unit", "Objectives performance", "Weight in " + esc(co.name), "Weighted contribution"],
    keys.map(function(k){
      var u = UNITS[k], w = share ? Math.round(u.weight / share * 1000) / 10 : 0;
      return '<tr><td><b>' + esc(u.name) + '</b></td>' +
        '<td class="num">' + pct(unitObjectives(u)) + '</td>' +
        '<td class="num">' + w + '%</td>' +
        '<td class="num">' + (unitObjectives(u) == null ? "&mdash;"
          : (Math.round(unitObjectives(u) * w) / 100).toFixed(1)) + '</td></tr>';
    }).join("") +
    '<tr style="background:var(--surface-2)"><td><b>' + esc(co.name) + '</b></td><td></td>' +
    '<td class="num">100%</td><td class="num"><b>' + pct(perf) + '</b></td></tr>') +
    '<p class="sub">Each unit\u2019s own ' + L("keyobj","bu") + ', weighted by the weight it ' +
    'already carries at group level and <b>re-normalised</b> so this company\u2019s units sum ' +
    'to 100%. Nothing is weighted twice and nothing is set here \u2014 the weights are composed ' +
    'on the group\u2019s <b>Weighting</b> tab.</p>';

  var execDrill = miniTable(["Business unit", "Of plan", "Weight in " + esc(co.name), "Delivered", "Planned", "Var."],
    keys.map(function(k){
      var u = UNITS[k], w = share ? Math.round(u.weight / share * 1000) / 10 : 0;
      return '<tr><td><b>' + esc(u.name) + '</b></td>' +
        '<td class="num">' + pct(unitRatio(u)) + '</td>' +
        '<td class="num">' + w + '%</td>' +
        '<td class="num">' + pct(unitExec(u)) + '</td>' +
        '<td class="num">' + pct(unitPlan(u)) + '</td>' +
        '<td class="num">' + varCell(unitExec(u), unitPlan(u)) + '</td></tr>';
    }).join("") +
    '<tr style="background:var(--surface-2)"><td><b>' + esc(co.name) + '</b></td>' +
    '<td class="num"><b>' + pct(r) + '</b></td><td class="num">100%</td>' +
    '<td class="num"><b>' + pct(ex) + '</b></td><td class="num"><b>' + pct(pl) + '</b></td>' +
    '<td class="num"><b>' + varCell(ex, pl) + '</b></td></tr>') +
    '<p class="sub">Tactic completion under every pillar in these units, weighted identically ' +
    'to performance. The planned line is derived from each tactic\u2019s quarter span, never ' +
    'entered.</p>';

  var head = '<div class="scores">' +
    drillCard("Business units &mdash; performance" + tip(TIP_PERF), perf, {
      primary: true,
      sub: "The " + plural(keys.length, "unit") + " in " + esc(co.name) +
        ", each on its own " + L("keyobj","bu").toLowerCase() + ". " + esc(co.name) +
        " has no scorecard of its own \u2014 what it has is a reading of what it holds.",
      drill: perfDrill, modalTitle: esc(co.name) + " \u2014 performance",
      modalSub: "Weighted across the units in this company"
    }) +
    drillCard("Business units &mdash; execution" + tip(TIP_EXEC), r, {
      sub: r == null
        ? "No tactic in these units has a plan against it yet, so there is nothing to deliver against."
        : "Delivered <b>" + pct(ex) + "</b> against <b>" + pct(pl) +
          "</b> planned &mdash; variance <b>" + varCell(ex, pl) + "</b>.",
      drill: execDrill, modalTitle: esc(co.name) + " \u2014 execution",
      modalSub: "Weighted compile of tactic delivery, as a share of plan"
    }) +
    drillCard("Share of the group" + tip("What these units together are worth at group level, " +
        "before this company's own figures are re-normalised. It is the one number that only " +
        "means something here."), share, {
      plain: true, pill: "of the group",
      sub: plural(keys.length, "unit") + " of the group\u2019s " + activeKeys().length +
        ", carrying <b>" + share + "%</b> of its weight between them.",
      drill: perfDrill, modalTitle: esc(co.name) + " \u2014 weight",
      modalSub: "Where this company's share of the group comes from"
    }) +
  '</div>';

  return bands("") + head +
    section("", "Business units", null,
      GVIEW.units === "table" ? unitsTable(keys)
        : '<div class="gauges g3">' + unitCards(keys) + '</div>',
      TIP_PERF, viewToggle("units"));
}

function renderGroupPerformance(){
  syncWeights();
  /* The one shared list — reordering business units mutates UNIT_KEYS, so a
     local copy here would silently ignore the new order. */
  var keys = activeKeys();

  var koDrill = miniTable(["Objective","Direction","Target","Compile","H1 actual","Progress"],
    GROUP.keyObjectives.map(function(m){
      return '<tr><td>' + (m.group ? esc(m.group) + " &mdash; " : "") + esc(m.name) + '</td>' +
        '<td class="num">' + esc(m.dir) + '</td><td class="num">' + esc(m.target) + '</td>' +
        '<td>' + esc(m.compile) + '</td><td class="num">' + esc(m.actual) + '</td>' +
        '<td class="num">' + m.progress + '%</td></tr>';
    }).join("")) +
    '<p class="sub">Mean of the ' + GROUP.keyObjectives.length + ': <b>' +
      pct(groupKeyObjectives()) + '</b>. Every objective carries a target, so none is excluded from the average.</p>';

  var perfDrill = miniTable(["Business unit","Objectives performance","Weight","Weighted contribution"],
    keys.map(function(k){
      var u = UNITS[k];
      return '<tr><td><b>' + esc(u.name) + '</b></td>' +
        '<td class="num">' + unitObjectives(u) + '%</td>' +
        '<td class="num">' + u.weight + '%</td>' +
        '<td class="num">' + (Math.round(unitObjectives(u) * u.weight) / 100).toFixed(1) + '</td></tr>';
    }).join("") +
    '<tr style="background:var(--surface-2)"><td><b>Group</b></td><td></td><td class="num">100%</td>' +
    '<td class="num"><b>' + groupUnitsObjectives() + '%</b></td></tr>') +
    '<p class="sub">Each unit\'s own Key Objectives &times; its weight. Weights are composed on the <b>Weighting</b> tab from revenue, profit, impact and growth.</p>';

  var execDrill = miniTable(["Business unit","Of plan","Weight","Delivered","Planned","Variance"],
    keys.map(function(k){
      var u = UNITS[k];
      return '<tr><td><b>' + esc(u.name) + '</b></td>' +
        '<td class="num">' + unitRatio(u) + '%</td>' +
        '<td class="num">' + u.weight + '%</td>' +
        '<td class="num">' + unitExec(u) + '%</td>' +
        '<td class="num">' + unitPlan(u) + '%</td>' +
        '<td class="num">' + varCell(unitExec(u), unitPlan(u)) + '</td></tr>';
    }).join("") +
    '<tr style="background:var(--surface-2)"><td><b>Group</b></td>' +
    '<td class="num"><b>' + groupRatio() + '%</b></td><td class="num">100%</td>' +
    '<td class="num"><b>' + groupExec() + '%</b></td>' +
    '<td class="num"><b>' + groupPlan() + '%</b></td>' +
    '<td class="num"><b>' + varCell(groupExec(), groupPlan()) + '</b></td></tr>') +
    '<p class="sub">Tactic completion under every unit\'s pillars, weighted identically to performance. The planned line is derived from each tactic\'s quarter span, never entered.</p>';

  var units = unitCards(keys);


  var themes = GROUP.themes.map(function(t, ti){
    var st = themeStats(t.ab);
    var pd = miniTable(["Business unit", L("pillar","bu"), "Performance"],
      st.list.map(function(x){
        return '<tr><td>' + esc(x.unit) + '</td><td>' + x.code + ' ' + esc(x.it.name) + '</td>' +
          '<td class="num final" style="color:var(--' + band(pillarPerf(x.it)) + ')">' + pillarPerf(x.it) + '%</td></tr>';
      }).join("")) +
      '<p class="sub">Mean across <b>' + st.list.length + '</b> ' + L("pillar","bu").toLowerCase() +
      ' carrying this theme, in <b>' + st.units.length + '</b> business units: <b>' + st.perf + '%</b>.</p>';
    var ed = miniTable(["Business unit", L("pillar","bu"), "Delivered", "Planned", "Var."],
      st.list.map(function(x){
        return '<tr><td>' + esc(x.unit) + '</td><td>' + x.code + ' ' + esc(x.it.name) + '</td>' +
          '<td class="num">' + pillarExec(x.it) + '%</td><td class="num">' + pillarPlan(x.it) + '%</td>' +
          '<td class="num">' + varCell(pillarExec(x.it), pillarPlan(x.it)) + '</td></tr>';
      }).join("")) +
      '<p class="sub">Delivered <b>' + st.exec + '%</b> against <b>' + st.plan +
      '%</b> planned &mdash; <b>' + Math.round(st.exec / st.plan * 100) + '%</b> of plan.</p>';
    return '<div class="gwrap" data-oi="' + ti + '">' +
      splitCard('<span class="pill theme">' + t.ab + '</span> ' + esc(t.name),
        st.list.length + " " + L("pillar","bu").toLowerCase() + " &middot; " + st.units.length + " units",
        st.perf, st.exec, st.plan, pd, ed, t.name,
        arranging("group") ? handle("Reorder " + t.name) : '') + '</div>';
  }).join("");

  /* A capability is a pillar in its own right, so it is scored exactly like
     one \u2014 performance from its measures, execution from its tactics, both
     derived. It was the last place in the product still carrying typed scores,
     which meant its execution figure could not be checked against anything. */
  var caps = GROUP.capabilities.map(function(c, ci){
    /* A capability no longer scores like a pillar. Its performance is its
       projects' \u2014 half what they handed over, half what that achieved \u2014 and
       its execution is milestones completed. Key objectives are optional and
       sit beside both rather than inside them. */
    var perf = capPerf(c), ce = capExec(c), ko = capKOScore(c);
    var fn = functionOf(c.fn);
    var pd = '<p class="sub" style="margin:0 0 14px">' + esc(c.def) + '</p>' +
      (ko == null
        ? '<p class="sub">No key objectives of its own. This capability is judged by its projects.</p>'
        : miniTable(["#","Key objective","Direction","Target","Actual","Progress"],
            c.keyObjectives.map(function(m, i){
              return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
                '<td class="num">' + esc(m.dir) + '</td>' +
                '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
                '<td class="num">' + esc(m.actual) + '</td>' +
                '<td class="num final" style="color:var(--' + band(m.progress) + ')">' + pct(m.progress) + '</td></tr>';
            }).join("")) +
          '<p class="sub">Weighted across <b>' + c.keyObjectives.length + '</b> objectives: <b>' + pct(ko) + '</b>.</p>') +
      miniTable(["#","Project","Deliverables","Outcomes","Performance"],
        c.projects.map(function(p, i){
          return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(p.name) + '</td>' +
            '<td class="num">' + pct(projDeliverySide(p)) + '</td>' +
            '<td class="num">' + pct(projOutcomeSide(p)) + '</td>' +
            '<td class="num final" style="color:var(--' + band(projPerf(p)) + ')">' + pct(projPerf(p)) + '</td></tr>';
        }).join("")) +
      '<p class="sub">Half from the deliverables side, half from the outcomes side, per side rather than per row.</p>';
    var ed = miniTable(["#","Project","Completed","In progress","Not started"],
        c.projects.map(function(p, i){
          var m = projMilestones(p);
          return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(p.name) + '</td>' +
            '<td class="num">' + m.done + '</td><td class="num">' + m.wip + '</td>' +
            '<td class="num">' + m.todo + '</td></tr>';
        }).join("")) +
      '<p class="sub"><b>' + ce.done + '</b> of <b>' + ce.total +
      '</b> milestones completed across <b>' + c.projects.length + '</b> projects.</p>';
    /* §16.6, settled by mock-capcard option 2: the same two-box card a business
       unit carries. The dial reads project performance; the right box holds the
       milestones that produce its execution — the workings behind the number,
       exactly as Execution explains itself with delivered, planned and
       variance. A one-box card was tried in the mockup and its labels clipped;
       the card is sized for two. */
    var pid = modalFor(c.name + " — performance", "Where the performance figure comes from", pd);
    var eid = modalFor(c.name + " — milestones", "Where the execution figure comes from", ed);
    /* The head is skipped where it repeats the function's own name — the SMO
       "function" is headed by the SMO, and one name twice reads as a stutter. */
    var fnHeadName = fn && personName(fn.head);
    var sub = (fn ? esc(fn.name) +
        (fnHeadName && fnHeadName !== fn.name ? " &middot; " + esc(fnHeadName) : "") + " &middot; " : "") +
      c.projects.length + " project" + (c.projects.length === 1 ? "" : "s");
    var msBody = !ce.total
      ? '<div class="ratio" style="font-size:15px;color:var(--none);font-family:var(--sans)">&mdash;</div>' +
        '<span class="ratio-l">no milestones</span>'
      : '<div class="ratio">' + ce.done + '<small> of ' + ce.total + '</small></div>' +
        '<span class="ratio-l">completed</span>' +
        '<dl class="led">' +
          '<dt>In progress</dt><dd>' + ce.wip + '</dd>' +
          '<dt>Not started</dt><dd>' + ce.todo + '</dd>' +
          '<dt>Projects</dt><dd>' + c.projects.length + '</dd>' +
        '</dl>';
    return '<div class="gwrap" data-oi="' + ci + '"><div class="gcard">' +
      '<div class="card-head">' + (arranging("group") ? handle("Reorder " + c.name) : '') +
        '<div class="gname">' + esc(c.name) + '</div>' +
        '<div class="gsub">' + sub + '</div></div>' +
      '<div class="two">' +
        '<div class="box-obj"><div class="boxlabel"><span>Performance</span>' +
          plus(pid, "Performance breakdown for " + c.name) + '</div>' +
          gauge(perf, "") + '</div>' +
        '<div class="box-exec"><div class="boxlabel"><span>Milestones</span>' +
          plus(eid, "Milestones behind " + c.name) + '</div>' +
          msBody + '</div>' +
      '</div></div></div>';
  }).join("");

  var SECS = [];
  SECS.push({ t: "Overall performance", h: section("", "Overall performance", null,
      '<div class="scores">' +
        drillCard("Group Key Objectives" + tip("The objectives the group set itself \u2014 each actual against its target, averaged. Authored by the group, never summed from the business units."), groupKeyObjectives(), {
          primary: true, sub: "The group\'s own scorecard. All <b>" + GROUP.keyObjectives.length + "</b> objectives have a target set.",
          drill: koDrill, modalTitle: "Group Key Objectives", modalSub: "The group\'s own scorecard, authored not compiled"
        }) +
        drillCard("Business units &mdash; performance" + tip(TIP_PERF) + deltaTag("group"), groupUnitsObjectives(), {
          primary: true, sub: "Each unit\'s own " + L("keyobj","bu") + ", weighted " + UNIT_KEYS.map(function(k){ return UNITS[k].weight; }).join(" / ") + " \u2014 composed on the Weighting tab.",
          drill: perfDrill, modalTitle: "Business units \u2014 performance", modalSub: "Weighted compile across the three units"
        }) +
        drillCard("Business units &mdash; execution" + tip(TIP_EXEC), groupRatio(), {
          /* The sentence has to survive the empty tenant too. Reading
             "Delivered 0% against 0% planned - variance +0" under a card that
             says "Not yet measurable" is three false precisions in a row. */
          sub: groupRatio() == null
               ? "No tactic anywhere in the group has a plan against it yet, so there is nothing to deliver against."
               : "Delivered <b>" + groupExec() + "%</b> against <b>" + groupPlan() +
                 "%</b> planned &mdash; variance <b>" + varCell(groupExec(), groupPlan()) + "</b>.",
          drill: execDrill, modalTitle: "Business units \u2014 execution", modalSub: "Weighted compile of tactic delivery, as a share of plan"
        }) +
      '</div>') });

  var arrangeBar = function(label, n){
    return canArrange("group") && ARRANGE
      ? '<div class="cfg-bar plain"><span class="cfg-lab">' + n + ' ' + label +
        ' &middot; drag by the handle to reorder</span></div>' : '';
  };

  SECS.push({ t: "Business units", h: section("", "Business units",
      null,
      GVIEW.units === "table"
        ? unitsTable(keys)
        : arrangeBar("business units", UNIT_KEYS.length) +
          '<div class="gauges g3 sortable" data-item=".gwrap" data-kind="units">' + units + '</div>',
      TIP_PERF, viewToggle("units")) });

  SECS.push({ t: "Group themes", h: section("", "Group themes",
      null,
      arrangeBar("themes", GROUP.themes.length) +
      '<div class="gauges g3 sortable" data-item=".gwrap" data-kind="themes">' + themes + '</div>', TIP_THEME) });

  SECS.push({ t: "Group capabilities", h: section("", "Group capabilities",
      null,
      GVIEW.caps === "table"
        ? capsTable()
        : arrangeBar("capabilities", GROUP.capabilities.length) +
          '<div class="gauges g4 sortable" data-item=".gwrap" data-kind="caps">' + caps + '</div>',
      TIP_CAP, viewToggle("caps")) });

  GROUP_SECTIONS = SECS.map(function(x){ return x.t; });
  return bands(arrangeBtn("group")) + SECS[Math.min(GSEC, SECS.length - 1)].h;
}
var GROUP_SECTIONS = [], GSEC = 0;

/* ── GROUP · Temple ───────────────────────────────────────────────
   A view, not a scoreboard: roof, aspiration, key objectives with targets
   only, themes as columns, capabilities as the base.

   Editing happens in tables, because a temple is a picture and a picture is
   an awkward thing to type into. What is saved is the temple \u2014 the tables
   write to the same objects the view renders. */

function templeTables(){
  var editing = EDIT_PAGE.temple;

  var stmt =
    '<h4 class="mini">' + L("aspiration","group") + '</h4>' +
    '<div class="tcard">' +
      '<div class="trow"><label>Statement</label>' +
        fieldOr("temple", GROUP.aspiration, "big-field", function(v){ GROUP.aspiration = v; }) + '</div>' +
      '<div class="trow"><label>End in mind</label>' +
        fieldOr("temple", GROUP.endInMind, "big-field", function(v){ GROUP.endInMind = v; }) + '</div>' +
      '<div class="trow"><label>Horizon</label>' +
        inputOr("temple", GROUP.horizon, "mono yr", function(v){ GROUP.horizon = v; }) + '</div>' +
    '</div>';

  var koRows = GROUP.keyObjectives.map(function(m, i){
    return '<tr><td class="idx">' + (i + 1) + '</td>' +
      '<td>' + fieldOr("temple", m.name, "", function(v){ m.name = v; }) + '</td>' +
      '<td class="cc">' + inputOr("temple", m.group || "", "", function(v){ m.group = v || null; }) + '</td>' +
      '<td class="cc">' + inputOr("temple", m.dir, "mono", function(v){ m.dir = v; }) + '</td>' +
      '<td class="cc">' + inputOr("temple", m.target3y || "", "mono", function(v){ m.target3y = v; }) + '</td>' +
      '<td class="cc">' + inputOr("temple", m.target || "", "mono", function(v){ m.target = v; }) + '</td>' +
      '<td class="cc">' + inputOr("temple", m.compile, "", function(v){ m.compile = v; }) + '</td>' +
      '<td class="cc">' + (editing ? '<button class="rmbtn" data-trm="ko|' + i + '">Remove</button>' : '') + '</td></tr>';
  }).join("");

  var themeRows = GROUP.themes.map(function(t, i){
    var used = pillarsUsingTheme(t.ab);
    return '<tr><td class="idx">' + (i + 1) + '</td>' +
      '<td class="cc">' + inputOr("temple", t.ab, "mono", function(v){
        var old = t.ab; t.ab = v.toUpperCase().slice(0, 4); renameTheme(old, t.ab); }) + '</td>' +
      '<td>' + fieldOr("temple", t.name, "", function(v){ t.name = v; }) + '</td>' +
      '<td>' + fieldOr("temple", t.note || "", "", function(v){ t.note = v; }) + '</td>' +
      '<td class="cc"><span class="mono">' + used + '</span></td>' +
      '<td class="cc">' + (editing
        ? (used
            ? '<span class="why" style="margin:0">in use</span>'
            : '<button class="rmbtn" data-trm="theme|' + i + '">Remove</button>')
        : '') + '</td></tr>';
  }).join("");

  var capRows = GROUP.capabilities.map(function(c, i){
    return '<tr><td class="idx">' + (i + 1) + '</td>' +
      '<td>' + fieldOr("temple", c.name, "", function(v){ c.name = v; }) + '</td>' +
      '<td>' + fieldOr("temple", c.def, "", function(v){ c.def = v; }) + '</td>' +
      '<td class="cc"><span class="mono">' + c.keyObjectives.length + '</span></td>' +
      '<td class="cc"><span class="mono">' + c.projects.length + '</span></td>' +
      '<td class="cc">' + (editing ? '<button class="rmbtn" data-trm="cap|' + i + '">Remove</button>' : '') + '</td></tr>';
  }).join("");

  var add = function(kind, label){
    return editing ? '<div class="addrow"><button class="editbtn" data-tadd="' + kind + '">+ ' + label + '</button></div>' : '';
  };

  return '<div class="templeedit">' + stmt +
    '<h4 class="mini">' + L("keyobj","group") + '</h4>' +
    '<div class="cfg"><table><thead><tr><th class="idx">#</th><th style="width:26%">Objective</th>' +
      '<th class="cc">Group</th><th class="cc">Dir.</th><th class="cc">3-year</th>' +
      '<th class="cc">This year</th><th class="cc">Compile</th><th class="cc"></th>' +
      '</tr></thead><tbody>' + koRows + '</tbody></table></div>' + add("ko", "Add an objective") +

    '<h4 class="mini">' + L("theme","group") + '</h4>' +
    '<div class="cfg"><table><thead><tr><th class="idx">#</th><th class="cc" style="width:9%">Code</th>' +
      '<th style="width:24%">Name</th><th>Note</th><th class="cc">Pillars</th><th class="cc"></th>' +
      '</tr></thead><tbody>' + themeRows + '</tbody></table></div>' + add("theme", "Add a theme") +

    '<h4 class="mini">' + L("pillar","group") + '</h4>' +
    '<div class="cfg"><table><thead><tr><th class="idx">#</th><th style="width:24%">Capability</th>' +
      '<th>Definition</th><th class="cc">Measures</th><th class="cc">Tactics</th><th class="cc"></th>' +
      '</tr></thead><tbody>' + capRows + '</tbody></table></div>' + add("cap", "Add a capability") +

    '<div class="note"><b>A theme in use cannot be removed.</b> Its code is what every pillar points at; ' +
    'renaming one carries its pillars with it, and deleting one would leave them pointing at nothing.</div>' +
  '</div>';
}

function renderTemple(){
  var can = grant("g_temple") === "edit";
  var bar = can
    ? '<div class="pageact"><button class="editbtn" data-page="temple">' +
      (EDIT_PAGE.temple ? "Done" : "Edit") + '</button></div>' : '';

  if (EDIT_PAGE.temple) return bar + templeTables();

  var groups = {};
  GROUP.keyObjectives.forEach(function(m){ (groups[m.group || ""] = groups[m.group || ""] || []).push(m); });

  var cell = function(m){
    return '<div class="ns-item"><span class="ns-label">' + esc(m.name) + '</span>' +
           '<span class="ns-target">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</span>' +
           '<span class="ns-dir">' + esc(m.dir) + ' &middot; ' + esc(m.compile).toLowerCase() + '</span></div>';
  };
  var ns = '<span class="ko-head">' + L("keyobj","group") + horizonBy() + '</span>' +
    Object.keys(groups).map(function(k){
      var inner = groups[k].map(cell).join("");
      return k ? '<div class="ns-group"><span class="ns-group-h">' + esc(k) + '</span><div class="ns-group-in">' + inner + '</div></div>' : inner;
    }).join("");

  return bar + '<div class="temple"><div class="roof"></div>' +
    '<div class="architrave">' + esc(GROUP.aspiration) + '</div>' +
    '<div class="entablature">' + ns + '</div>' +
    '<div class="pillars">' + GROUP.themes.map(function(p){
      return '<div class="pillar"><span>' + esc(p.ab) + '</span><b>' + esc(p.name) + '</b><em>' + esc(p.note || "") + '</em></div>';
    }).join("") + '</div>' +
    '<div class="stylobate"><div class="base-head">' + L("pillar","group") + ' &mdash; cross-cutting, no theme</div><div class="base-grid">' +
      GROUP.capabilities.map(function(c){
        return '<details class="encard"><summary><b>' + esc(c.name) + '</b>' +
          '<span>' + c.projects.length + ' project' + (c.projects.length === 1 ? '' : 's') +
            (c.keyObjectives.length ? ' &middot; ' + c.keyObjectives.length + ' key objectives' : '') +
            '</span></summary>' +
          '<div class="encard-body"><p>' + esc(c.def) + '</p><ul>' +
          c.projects.map(function(p){
            return '<li>' + esc(p.name) + ' &mdash; <span class="mono">' + p.deliverables.length +
              ' deliverables, ' + p.outcomes.length + ' outcomes, ' + p.milestones.length + ' milestones</span></li>';
          }).join("") + '</ul></div></details>';
      }).join("") +
    '</div></div></div>';
}

function renderGroupFoundation(){
  /* One question for every field on the page, asked once (§94). */
  var gpg = authoring("foundation", "g_found") ? "foundation" : null;
  /* `return` ON ITS OWN LINE RETURNED UNDEFINED. Automatic semicolon insertion
     ended the statement there and left everything below as dead code, so the
     group's Foundation page has rendered the literal word "undefined" since
     v3.5 — and threw no error, which is exactly why a sweep that asserts "no
     console errors" walked past it every time.

     It broke when `editBar(...) +` was removed for the pen-on-hover change:
     the operand went and the `+` went with it, leaving the `return` stranded.
     Cost: a blank page for every viewer, and no edit route to the group's
     clauses, purpose, aspiration or values for anyone including the SMO. */
  return '<div class="fgrid"><div class="card"><h2 class="sec first">Who we are</h2>' +
      '<dl style="margin:0">' +
      GROUP.clauses.map(function(c){
        return '<div class="clause"><dt>' + esc(c[0]) + '</dt><dd>' +
          fieldOr(gpg, c[1], "", function(v){ c[1] = v; }) + '</dd></div>';
      }).join("") + '</dl></div>' +
      '<div class="fcol">' +
        '<div class="card"><h2 class="sec first">' + L("purpose","group") + '</h2>' +
        '<p class="statement">' + fieldOr(gpg, GROUP.mission, "big-field",
          function(v){ GROUP.mission = v; }) + '</p></div>' +
        aspirationCard(L("aspiration","group"), GROUP.aspiration, GROUP.endInMind, GROUP.keyObjectives, "foundation",
          function(v){ GROUP.aspiration = v; }, function(v){ GROUP.endInMind = v; }, "g_found",
          true, GROUP) +
      '</div>' +
    '</div>' +
    koBand(GROUP.keyObjectives, "foundation", "g_found", GROUP, true) +

    '<div class="card valbox"><h2 class="sec first">' + L("values","group") + '</h2>' +
    '<div class="valgrid">' +
      (GROUP.values || []).map(function(v){
        return '<details class="valcard"><summary>' + esc(v.name) + '</summary>' +
          '<div class="valcard-body">' + fieldOr(gpg, v.def, "",
            function(x){ v.def = x; }) + '</div></details>';
      }).join("") +
    '</div></div>';
}

/* ── UNIT · Performance (pillars live here) ──────────────────────── */
/* The unit's own reading of its focus measures. It leads with a COUNT, not a
   mean: three measures at 163, 44 and 97 average to 101, which reads as "just
   there" when in truth one is earning and two are short. Reward is won per
   measure, so the count is the situation and the mean is a footnote. */
/* A panel, below the two headline boxes and above the pillars, closed until
   asked for. It is a lens on a few measures, not the unit's headline \u2014 opening
   the page to it put a nine-row table where the score should be.

   Nothing is marked from here. Marking is a configuration act and lives in
   Setup; this view reads. */
function focusStrip(u){
  var items = unitFocus(u);
  if (!items.length) return '';

  var t = focusTally(u);
  var chipsShort = [["over","earning"],["met","met"],["short","short"],["none","not reported"]]
    .filter(function(x){ return t[x[0]]; })
    .map(function(x){ return '<span class="badge b-' + x[0] + '">' + t[x[0]] + ' ' + x[1] + '</span>'; })
    .join("");

  var bar =
    '<summary class="fstrip-head">' +
      '<span class="fstrip-t"><span class="fmark" style="margin:0 7px 0 0"></span>Focus this cycle</span>' +
      '<span class="fstrip-sum"><b>' + t.over + '</b> of ' + t.total + ' earning</span>' +
      '<span class="fchips">' + chipsShort + '</span>' +
      '<span class="fstrip-meta">reward begins at ' + CYCLE.rewardAt + '%</span>' +
    '</summary>';
  var rows = items.map(function(x){
    var st = focusStanding(x.m.progress);
    return '<tr><td>' + esc(x.m.name) + '</td>' +
      '<td class="cc"><span class="why" style="margin:0">' + esc(x.src) + '</span></td>' +
      '<td class="num">' + (x.m.target ? esc(x.m.target) : '<span class="missing">Missing</span>') + '</td>' +
      '<td class="num">' + esc(x.m.actual) + '</td>' +
      /* Uncoloured here on purpose. The band scale answers "is this on plan";
         the standing answers "does this earn". A measure can be 88% and green
         on the band while being short of the reward line, and colouring both
         in one row makes the strip argue with itself. The badge carries the
         meaning this table is about. */
      '<td class="num final">' + pct(x.m.progress) + '</td>' +
      '<td class="cc"><span class="badge b-' + st.key + '">' + st.label + '</span></td></tr>';
  }).join("");

  return '<details class="fstrip">' + bar +
    '<div class="fstrip-body">' +
      '<div class="fmean">mean progress ' + pct(t.mean) +
        ' &mdash; the count above is the situation; reward is won per measure</div>' +
    '</div>' +
    '<div class="cfg"><table><thead><tr><th>Focus measure</th><th class="cc">Source</th>' +
      '<th class="cc">Target</th><th class="cc">Actual</th>' +
      '<th class="cc">Progress</th><th class="cc">Standing</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
    '</details>';
}

function renderUnitPerformance(u){
  var ko = unitObjectives(u);
  var r  = unitRatio(u);
  var kps = u.keyObjectives.filter(function(m){ return m.target && m.progress != null; })
                           .map(function(m){ return m.progress; });
  var koHi = kps.length ? Math.max.apply(null, kps) : null;
  var koLo = kps.length ? Math.min.apply(null, kps) : null;
  var ws = KO_WEIGHTS[u.ukey];

  /* The unit's Key Objectives are authored on its Foundation, but they are what
     this page scores — so the breakdown opens from the headline rather than
     making someone go and find it. Same drill-down the group page offers. */
  var koDrill =
    '<p class="sub" style="margin:0 0 14px">' + TIP_PERF + '</p>' +
    miniTable(["#", L("keyobj","bu"), "Dir.", "Target", "H1 actual", "Progress"].concat(ws ? ["Weight","Contribution"] : []),
      u.keyObjectives.map(function(m, i){
        var w = ws ? (ws[i] == null ? 0 : ws[i]) : null;
        return '<tr' + (isFocus(m.id) ? ' class="focusrow"' : '') + '><td class="idx">' + (i+1) + '</td>' +
          '<td>' + esc(m.name) + fmark(m.id) + '</td>' +
          '<td class="num">' + esc(m.dir) + '</td><td class="num">' + esc(m.target) + '</td>' +
          '<td class="num">' + esc(m.actual) + '</td>' +
          '<td class="num final" style="color:var(--' + band(m.progress) + ')">' + pct(m.progress) + '</td>' +
          (ws ? '<td class="num">' + w + '%</td><td class="num">' +
                (Math.round(m.progress * w) / 100).toFixed(1) + '</td>' : '') + '</tr>';
      }).join("")) +
    '<p class="sub">' + (ws
      ? 'Weighted mean across <b>' + u.keyObjectives.length + '</b> objectives: <b>' + ko + '%</b>. Weights are set on the unit\'s Foundation.'
      : 'Mean across <b>' + u.keyObjectives.length + '</b> objectives, equally weighted: <b>' + ko + '%</b>.') +
    ' This unit contributes at <b>' + u.weight + '%</b> weight to the group figure.</p>';

  /* ── THE THIRD NUMBER (§64) ────────────────────────────────────────
     Islam: "add to the 2 main numbers of the objectives and the execution a
     third number in the middle for the pillars collective performance based on
     the pillars measures."

     It reads what the unit AGREED TO MEASURE ITSELF ON, one level down from
     the key objectives — and it was already computed and already on screen, in
     the rail's footer, as a bare number beside a bare execution figure. Two
     numbers with no card is not the same claim as a headline: unitPillars() is
     what every pillar's score averages to, so it belongs beside the two
     figures the page is about rather than under the list.

     WHAT IT IS NOT: the key objectives figure. A unit's objectives are its
     scorecard and its pillars are how it intends to move them, so the two
     answer different questions and can disagree — which is the interesting
     case and the reason for showing both.

     Nothing new is computed. unitPillars() has existed since the scoring model
     did; only the highest and lowest are worked out here, exactly as the key
     objectives card does. */
  var pps = u.items.map(pillarPerf).filter(function(v){ return v != null && !isNaN(v); });
  var pl = unitPillars(u);
  var plHi = pps.length ? Math.max.apply(null, pps) : null;
  var plLo = pps.length ? Math.min.apply(null, pps) : null;
  var plWord = L("pillar", "bu");
  var plDrill =
    '<p class="sub" style="margin:0 0 14px">' + tipPillars() + '</p>' +
    miniTable(["#", plWord, "Measures", "Scored", "Performance"],
      u.items.map(function(it, i){
        var pp = pillarPerf(it), carrier = pillarCarrier(it);
        /* A pillar handed to a function is scored by ITS pillars, not by
           measures of its own (§59) — so the count would read 0 beside a real
           figure and look like a fault. It says whose it is instead. */
        var ms = carrier ? "\u2014" : String((it.measures || []).length);
        var sc = carrier
          ? '<span class="why" style="margin:0">from ' + esc(carrier.name) + '</span>'
          : String(scorableMeasures(it).length);
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td>' + pillarCode(u, i) + ' ' + esc(it.name) + '</td>' +
          '<td class="num">' + ms + '</td><td class="num">' + sc + '</td>' +
          '<td class="num final" style="color:var(--' + band(pp) + ')">' + pct(pp) + '</td></tr>';
      }).join("")) +
    '<p class="sub">Mean across <b>' + pps.length + '</b> of <b>' + u.items.length + '</b> ' +
    plWord.toLowerCase() + ' with something scored: <b>' + pct(pl) + '</b>. ' +
    'A ' + plWord.toLowerCase().replace(/s$/, "") + ' with no reported measure is left out ' +
    'rather than counted as zero: nothing reported is not the same as nothing achieved.</p>';

  var exDrill =
    '<p class="sub" style="margin:0 0 14px">' + TIP_EXEC + '</p>' +
    miniTable(["#", L("pillar","bu"), "Delivered", "Planned", "Of plan", "Var."],
      u.items.map(function(it, i){
        var pr = pillarRatio(it);
        return '<tr><td class="idx">' + (i+1) + '</td><td>' + pillarCode(u, i) + ' ' + esc(it.name) + '</td>' +
          '<td class="num">' + pillarExec(it) + '%</td><td class="num">' + pillarPlan(it) + '%</td>' +
          '<td class="num final" style="color:var(--' + band(pr) + ')">' + pr + '%</td>' +
          '<td class="num">' + varCell(pillarExec(it), pillarPlan(it)) + '</td></tr>';
      }).join("")) +
    '<p class="sub">Delivered <b>' + unitExec(u) + '%</b> against <b>' + unitPlan(u) +
    '%</b> planned across <b>' + u.items.length + '</b> ' + L("pillar","bu").toLowerCase() +
    ' &mdash; <b>' + r + '%</b> of plan. The planned line is derived from each tactic\'s quarter span, never entered.</p>';

  var koId = modalFor(esc(u.name) + " &mdash; " + L("keyobj","bu"), "The unit's own scorecard, and how the headline is built", koDrill);
  var plId = modalFor(esc(u.name) + " &mdash; " + plWord.toLowerCase() + " performance",
    "What each " + plWord.toLowerCase().replace(/s$/, "") + "'s own measures average to", plDrill);
  var exId = modalFor(esc(u.name) + " &mdash; execution performance", "Tactic delivery across the unit's pillars", exDrill);

  /* ── THE ACTIONS STAY IN THE LEGEND, AND THE LEGEND GETS QUIETER
     (§94.9, REVERSING §94.8's first half the same day) ───────────────
     Asked for a row of their own — "bring the 2 buttons above the reading
     colours rectangle" — and then, having looked at it: "I think we can leave
     the 2 buttons in the same line with the reading colours and we can even
     shrink the reading colours a bit in font size so the buttons are more
     obvious."

     WHICH IS THE BETTER ANSWER TO THE SAME COMPLAINT, and it is worth saying
     why rather than just doing it. The problem was never WHERE the buttons
     were, it was that they read as quietly as the legend they sat beside —
     two 12px uppercase controls against a 12.5px reference strip, all of it
     the same weight of grey. Moving them bought a whole row of vertical space
     to solve a CONTRAST problem. Making the legend smaller than the buttons
     solves it where it is: the row now has one thing that shouts, one thing
     that speaks and one thing that whispers, in that order.

     So `.bands` drops to 11px / 9.5px and the dot with it, Report keeps its
     solid fill, and the page keeps the row. See `group-extra.css`. */
  return bands(reportBtn(u.ukey) + presentMenu("unit", u.ukey)) +

    '<div class="scores">' +
      '<div class="card tight primary"><div class="score-h"><h4>' + L("keyobj","bu") + ' performance</h4>' +
        '<span class="pill ' + band(ko) + '">' + bandWord(ko) + '</span></div>' +
        '<div class="headline"><span class="big" style="color:var(--' + band(ko) + ')">' + pctBig(ko) + '</span>' +
          deltaTag(u.ukey) +
          '<button class="drill" data-modal="' + koId + '">See the ' + L("keyobj","bu").toLowerCase() + ' &rarr;</button></div>' +
        '<div class="minirow"><div><em>Objectives</em><b>' + u.keyObjectives.length + '</b></div>' +
          '<div><em>Highest</em><b style="color:var(--' + band(koHi) + ')">' +
            pct(koHi) + '</b></div>' +
          '<div><em>Lowest</em><b style="color:var(--' + band(koLo) + ')">' +
            pct(koLo) + '</b></div></div></div>' +
      /* IN THE MIDDLE, as asked: the objectives are what the unit is judged
         on, the pillars are how it means to get there, and execution is
         whether the work happened. Read left to right that is the argument. */
      '<div class="card tight"><div class="score-h"><h4>' + plWord + ' performance</h4>' +
        '<span class="pill ' + band(pl) + '">' + bandWord(pl) + '</span></div>' +
        '<div class="headline"><span class="big" style="color:var(--' + band(pl) + ')">' + pctBig(pl) + '</span>' +
          '<button class="drill" data-modal="' + plId + '">See the ' +
            plWord.toLowerCase() + ' &rarr;</button></div>' +
        '<div class="minirow"><div><em>' + plWord + '</em><b>' + u.items.length + '</b></div>' +
          '<div><em>Highest</em><b style="color:var(--' + band(plHi) + ')">' +
            pct(plHi) + '</b></div>' +
          '<div><em>Lowest</em><b style="color:var(--' + band(plLo) + ')">' +
            pct(plLo) + '</b></div></div></div>' +
      '<div class="card tight"><div class="score-h"><h4>Execution performance</h4>' +
        '<span class="pill ' + band(r) + '">' + bandWord(r) + '</span></div>' +
        '<div class="headline"><span class="big" style="color:var(--' + band(r) + ')">' + pctBig(r) + '</span>' +
          (r == null ? '' : '<span class="ofplan">of plan</span>') +
          '<button class="drill" data-modal="' + exId + '">See the breakdown &rarr;</button></div>' +
        '<div class="minirow"><div><em>Delivered</em><b>' + pct(unitExec(u)) + '</b></div>' +
          '<div><em>Planned</em><b>' + pct(unitPlan(u)) + '</b></div>' +
          '<div><em>Variance</em><b>' + varCell(unitExec(u), unitPlan(u)) + '</b></div></div></div>' +
    '</div>' +

    focusStrip(u) +
    /* No heading over the rail. "Pillars - directions and capabilities" sat
       above a rail whose own header already reads PILLARS and counts them,
       and it pushed the rail a heading's height further down the page - which
       is exactly the space the rail needs to stay in view while the pane
       beside it scrolls. The arrange hint stays: it appears only in arrange
       mode and says something the rail does not. */
    /* The arrange hint went with the button (§63.3): reordering is decided on
       the plan now, and a hint on a page with no control is a hint about
       something you cannot do from here. */
    section("", "", null, unitPerfRail(u));
}

/* ── Foundation ────────────────────────────────────────────────────
   A static page. It holds authored content, not reported numbers, so reading
   is the normal state and editing is entered deliberately.

   Key Objectives sit INSIDE the aspiration card, beneath the statement: the
   aspiration says where the unit is going, the objectives say how you would
   know it got there. They appear as TARGETS ONLY — no actual, no progress, no
   colour. Performance is the Performance page's job, and one number in two
   places is one number too many. */

/* A bare button, right-aligned above the columns. The labelled bar it replaced
   announced a section that did not need announcing. */
/* IS THIS PAGE ACTUALLY OPEN FOR AUTHORING RIGHT NOW (§94)?
   `EDIT_PAGE` is a switch, and a switch survives things a grant does not —
   the viewer switcher repaints without leaving modes, and a person's roles
   can change under an open pane. So the fields ask the same question the pen
   asked rather than trusting the flag the pen set, which is §48.2 applied to
   a mode instead of a button. It takes the ACCESS KEY and not just the page
   name, because the group's Foundation and a unit's share one page key and
   only one of them is a strategy page. */
function authoring(page, acKey){ return !!EDIT_PAGE[page] && mayAuthor(acKey); }

/* mayAuthor(), NOT the raw grant (§94). Every "Edit" bar and every pen in
   the platform asks this one question, so a strategy page cannot acquire a
   pen that is open to somebody the rule closes it to — the gate is on the
   control, not on each of the eleven call sites that draw one. */
function editBar(page, acKey){
  if (!mayAuthor(acKey || "u_found")) return '';
  return '<div class="pageact"><button class="editbtn" data-page="' + page + '">' +
    (EDIT_PAGE[page] ? "Done" : "Edit") + '</button></div>';
}

/* The pen, in the corner of the box it edits.

   A bare "Edit" bar floating above a page says a page is editable; a pen in
   the corner of a card says THIS is. It appears on hover and on keyboard
   focus, and stays put once you are editing - a control that vanishes while
   you are using it is worse than one that was never subtle.

   `visibility`, not `display`: the button keeps its box at all times, so
   hovering a card never reflows it. (Note what §27 taught: an invisible box
   still contributes to layout - which is a problem for a 320px tooltip
   hanging off the page, and exactly what is wanted for a 26px button that
   must not move anything when it appears.)

   Same data-page contract as editBar, so the shell's wiring is untouched. */
function penBtn(page, acKey){
  if (!mayAuthor(acKey || "u_found")) return '';
  var on = EDIT_PAGE[page];
  return '<button class="penbtn' + (on ? " on" : "") + '" data-page="' + page + '"' +
    ' title="' + (on ? "Done editing" : "Edit") + '" aria-label="' + (on ? "Done editing" : "Edit") + '">' +
    (on ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" ' +
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.4 3.6l3 3L7.9 15.1l-3.9.9.9-3.9z" ' +
            'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>') +
    '</button>';
}

/* An edit field has to know where to write. Every field registers its own
   setter and carries the index; the shell wires them generically. Before this
   the foundation rendered inputs that were bound to nothing, so every edit
   looked accepted and was silently discarded on the next repaint. */
var FIELDS = [];
/* A PARAGRAPH TYPED AS TWO PARAGRAPHS MUST READ AS TWO PARAGRAPHS (§51.1).
   The editing control is a <textarea>, which keeps every line break the person
   typed; the READING control was a bare <span>, and HTML collapses newlines to
   a single space. So a purpose statement written as three sentences with air
   between them came back as one run-on block the moment the pen was closed —
   the text was never lost, it was only never shown.

   `flow` carries `white-space:pre-line`: line breaks survive, runs of spaces
   and stray indentation do not. That is the right pair for prose somebody
   typed, and it is on fieldOr rather than on each caller so every long-text
   field in the platform behaves the same way. */
function fieldOr(page, value, cls, setter){
  if (!EDIT_PAGE[page] || !setter)
    return '<span class="flow ' + (cls || '') + '">' + esc(value) + '</span>';
  var i = FIELDS.push(setter) - 1;
  return '<textarea class="fld ' + (cls || '') + '" data-fld="' + i + '" rows="2">' + esc(value) + '</textarea>';
}
function inputOr(page, value, cls, setter){
  if (!EDIT_PAGE[page] || !setter) return '<span class="' + (cls || '') + '">' + esc(value) + '</span>';
  var i = FIELDS.push(setter) - 1;
  return '<input class="fld ' + (cls || '') + '" data-fld="' + i + '" value="' + esc(value) + '">';
}

/* THE THIRD WAY TO DRAW A BOUND FIELD, because a `<select>` is not an
   `<input>` and `koEdit` was building its own — which is exactly how it ended
   up building unbound ones (§96). `data-fld` already works for a select: the
   shell's handler reads `el.value` and asks nothing about the tag. */
function selectOr(page, value, opts, cls, setter){
  if (!EDIT_PAGE[page] || !setter)
    return '<span class="' + (cls || '') + '">' + esc(value) + '</span>';
  var i = FIELDS.push(setter) - 1;
  return '<select class="fld ' + (cls || '') + '" data-fld="' + i + '">' +
    opts.map(function(o){
      return '<option' + (String(value) === String(o) ? " selected" : "") + '>' +
        esc(o) + '</option>';
    }).join("") + '</select>';
}

/* Two readings of the same targets. Columns compares them down a line; chips
   read this year as a figure. A toggle rather than a decision, because which
   one is better depends on how many objectives a unit has written. */
/* Show or hide the near horizon on a unit's objectives (§66). A switch, not a
   pair of buttons: there are two states and one of them is on — the same shape
   §47.5 settled for Units | Functions, at the size a header allows. */
function koYearToggle(){
  return '<button class="minitog' + (SHOW_KO_THIS_YEAR ? " on" : "") + '" data-koyear="1"' +
    ' aria-pressed="' + SHOW_KO_THIS_YEAR + '"' +
    ' title="' + (SHOW_KO_THIS_YEAR ? "Hide this year\u2019s target" : "Show this year\u2019s target") +
    '">This year</button>';
}
function koToggle(){
  return '<span class="minisw" role="group" aria-label="Objectives layout">' +
    '<button data-kov="cols"  aria-pressed="' + (KO_VIEW === "cols")  + '" title="Columns">&#9776;</button>' +
    '<button data-kov="chips" aria-pressed="' + (KO_VIEW === "chips") + '" title="Chips">&#9632;&#9632;</button></span>';
}

/* `isGroup` decides whether the near horizon is shown: it is hidden on a
   UNIT's objectives and kept on the group's (§51.16). The chips view drops the
   same value, and the 3-year loses its "3-year" prefix there — with only one
   number left, a label saying which one it is has nothing to distinguish it
   from. */
function koView(list, isGroup){
  var near = isGroup || SHOW_KO_THIS_YEAR;
  var miss = '<span class="missing">Missing</span>';
  if (KO_VIEW === "chips") {
    return '<div class="ochips">' + list.map(function(m){
      var far = m.target3y ? esc(m.target3y) : miss;
      return '<div class="ochip"><b>' + esc(m.name) + '</b>' +
        (near ? '<div class="v">' + (m.target ? esc(m.target) : miss) + '</div>' +
                '<div class="h">3-year ' + far + '</div>'
              : '<div class="v">' + far + '</div>') + '</div>';
    }).join("") + '</div>';
  }
  return '<div class="ohead' + (near ? '' : ' one') + '"><span>Objective</span>' +
      '<span>' + horizonColLabel() + '</span>' +
      (near ? '<span>This year</span>' : '') + '</div>' +
    list.map(function(m){
      return '<div class="orow' + (near ? '' : ' one') + '"><span class="on">' + esc(m.name) + '</span>' +
        '<span class="ot h">' + (m.target3y ? esc(m.target3y) : miss) + '</span>' +
        (near ? '<span class="ot">' + (m.target ? esc(m.target) : miss) + '</span>' : '') + '</div>';
    }).join("");
}
/* The far column says WHICH year when the tenant has set one — "By 2028" reads
   as a date and "3-year" reads as a duration, and with the near column gone
   the heading is the only thing left saying what the number is. */
function horizonColLabel(){
  return horizonSet() ? "By " + esc(GROUP.horizon) : "3-year";
}

/* ── THE OBJECTIVES EDITOR WAS DRAWN AND CONNECTED TO NOTHING (§96) ──
   Islam, on a unit's Foundation with the pen open: *"I can't remove
   objectives."* Measured: **20 inputs, 0 wired; 4 Remove buttons, 0 wired; the
   Add button, 0 wired.** Every control in this table was decoration — typing a
   name, changing a direction, correcting a target, removing a row and adding
   one all looked accepted and were discarded on the next repaint.

   IT IS THE FAULT THE `FIELDS` REGISTRY EXISTS TO PREVENT, three lines above
   this, in the comment that says so in the past tense: *"Before this the
   foundation rendered inputs that were bound to nothing, so every edit looked
   accepted and was silently discarded."* That fix went to `fieldOr` and
   `inputOr` — the prose fields in the same card — and this table was left
   behind, because it builds its own `<input>` tags rather than calling them.
   **A helper that exists is not a helper that was used**, and nothing catches
   the difference: the markup is identical apart from one absent attribute.

   The group's own Temple edit (`renderTempleEdit`) has the same table and has
   been fully wired the whole time, which is why this never came up — the two
   surfaces edit THE SAME `GROUP.keyObjectives` and only one of them worked.

   Every field goes through `fieldOr`/`inputOr`/`selectOr` now, so there is no
   second way to draw one of these cells and no second place to forget. */
function koEdit(list, page, acKey, owner){
  var editing = authoring(page, acKey), pg = editing ? page : null;
  /* WHICH LIST THIS IS. Add and Remove act on an array, and the two callers
     hand in two different arrays (the group's and a unit's) — so the table
     registers its own, exactly as a field registers its own setter. */
  var li = KOLISTS.push({ list: list, owner: owner }) - 1;
  return '<div class="scroll"><table><thead><tr><th>Objective</th><th class="cc">Dir.</th>' +
    '<th class="cc">3-year</th><th class="cc">This year</th><th class="cc">Compile</th><th></th></tr></thead><tbody>' +
    list.map(function(m, i){
      return '<tr><td>' + inputOr(pg, m.name, "", function(v){ m.name = v; }) + '</td>' +
        '<td class="cc">' + selectOr(pg, m.dir, ["\u2265", "\u2264"], "",
          function(v){ m.dir = v; }) + '</td>' +
        '<td class="cc">' + inputOr(pg, m.target3y || "", "mono",
          function(v){ m.target3y = v; }) + '</td>' +
        '<td class="cc">' + inputOr(pg, m.target || "", "mono",
          function(v){ m.target = v; }) + '</td>' +
        '<td class="cc">' + selectOr(pg, m.compile, ["Sum", "Latest", "Average"], "",
          function(v){ m.compile = v; }) + '</td>' +
        '<td class="cc">' + (editing
          ? '<button class="rmbtn" data-korm="' + li + '|' + i + '">Remove</button>' : '') +
        '</td></tr>';
    }).join("") + '</tbody></table></div>' +
    (editing ? '<div class="addrow"><button class="editbtn" data-koadd="' + li +
      '">+ Add an objective</button></div>' : '');
}

/* WHERE ADD AND REMOVE WRITE. Registered during render and emptied on every
   repaint beside `FIELDS`, or stale arrays accumulate and an index from the
   last paint acts on the paint before it. */
var KOLISTS = [];

/* MINTED FROM THE MAXIMUM, NEVER FROM THE COUNT (§96.2). Removing the middle
   of KO1·KO2·KO3 and adding leaves two rows and mints "KO3" — the id the
   surviving third row already holds. Two rows with one id is not cosmetic: the
   authoriser compares plans BY ID (§59), a reporting snapshot is keyed by id
   and never by position (§48), and the rail selects on it. The group's own
   Temple handler has minted from the count since it was written and carries
   the same latent collision; it is corrected there too rather than left as the
   one place that still does it. */
function koMint(list, prefix){
  var top = 0;
  list.forEach(function(m){
    var n = /-KO(\d+)$/.exec(String(m && m.id || ""));
    if (n && +n[1] > top) top = +n[1];
  });
  return { id: prefix + "-KO" + (top + 1), name: "New objective", dir: "\u2265",
           target3y: "", target: "", compile: "Latest", actual: "", progress: null };
}

/* A unit numbers its whole plan positionally at load (`renumberUnit`), so a
   row added or removed here is brought back into that sequence at once rather
   than waiting for the next load to disagree with what is on screen.

   THE GROUP'S OWN OBJECTIVES CARRY NO IDS AT ALL (§96.4), found by the check
   the moment it asked the group the same questions it asks a unit: all six
   read `null`, in the seed and in the database, because only rows ADDED
   through the Temple's button have ever been given one. That was survivable
   while nothing minted ids into that list; it stops being survivable the
   moment this editor does, because a list where one row is identified and six
   are not is worse than either state — the authoriser compares plans by id
   (§59) and a reporting snapshot is keyed by id and never by position (§48).

   So the missing ones are FILLED IN, and an existing one is never rewritten —
   the same rule `renumberUnit` already applies to a pillar's code, and for the
   same reason: a code already quoted somewhere else is not ours to change.

   IT RUNS FROM ADD AND REMOVE, NOT FROM PAINT. A reader that writes what it
   reads puts a phantom change into every save and would have every non-SMO
   save refused for ever (§42, §50.6) — this only ever runs inside an edit that
   is already the group's to make. */
function koSettle(entry){
  var o = entry && entry.owner;
  if (o && o.ukey && typeof renumberUnit === "function") { renumberUnit(o); return; }
  if (!o || !o.keyObjectives) return;
  var top = 0;
  o.keyObjectives.forEach(function(m){
    var n = /-KO(\d+)$/.exec(String(m && m.id || ""));
    if (n && +n[1] > top) top = +n[1];
  });
  o.keyObjectives.forEach(function(m){ if (m && !m.id) m.id = "group-KO" + (++top); });
}

/* Two statements, not one. An earlier reading treated Winning Aspiration and
   End in Mind as the same thing under two labels; the client's own deck carries
   both, saying different things. */
/* `isGroup` decides whether the HORIZON IS EDITABLE HERE. The card is shared by
   the group's Foundation and every unit's, and it was rendering the group's
   horizon field on both — so a unit owner's own-unit pen offered a control that
   writes GROUP.horizon. The server refuses it ("The group's own strategy cannot
   be changed here"), which means one keystroke on a page they are entitled to
   edit left that person unable to save anything until the change was undone.

   The horizon is still SHOWN on a unit, as a pill: it is the horizon the unit's
   objectives are measured against and reading it there is the point. Only the
   input is the group's (§48.1). */
/* `owner` is what Add and Remove act ON — the group or the unit whose list
   this is. It is passed rather than inferred from `isGroup`, because a unit
   also has to be renumbered afterwards and a boolean cannot say which unit
   (§96). */
function aspirationCard(label, statement, endInMind, objectives, page, setAsp, setEnd, acKey, isGroup, owner){
  var editing = authoring(page, acKey), pg = editing ? page : null;
  return '<div class="card hoverpen"><div class="cardhead"><h2 class="sec first">' + label + '</h2>' +
    penBtn(page, acKey) +
      (editing && isGroup
        ? '<label class="horizon-f">Horizon ' +
          inputOr(pg, GROUP.horizon, "mono yr", function(v){ GROUP.horizon = v; }) + '</label>'
        : '<span class="pill horizon">Horizon &middot; ' + horizonLabel() + '</span>') +
    '</div>' +
    '<p class="statement">' + fieldOr(pg, statement, "big-field", setAsp) + '</p>' +
    /* End in mind is optional. Where a unit does not have one, nothing appears
       \u2014 an empty labelled block asserts that something is missing when the
       plan simply does not work that way. In edit the field is always there,
       so one can be added. */
    (endInMind || editing
      ? '<div class="endin"><span class="boxlab">End in mind</span>' +
        '<p class="statement">' + fieldOr(pg, endInMind, "big-field", setEnd) + '</p></div>'
      : '') +
    /* ── WHILE THE PEN IS OPEN THE TABLE IS NOT IN HERE (§96.6) ────
       Islam: *"when I edit the objectives table the table is very tight and
       crammed."* The Foundation is a two-column grid, so this card gets about
       45% of the page — and it was being asked to hold a six-column table with
       a text field in every cell. Measured at a 1537px page: the table had
       **696px**, the objective name clipped at about twelve characters, and the
       direction dropdown was too narrow to show its own value.

       READING MODE IS UNTOUCHED. The objectives belong inside the aspiration
       when you are reading it — the aspiration says where the unit is going and
       the objectives say how you would know it got there — and it is only
       AUTHORING that needs the room. So the block stays here when it is being
       read and moves out to `koBand()` when it is being written.

       DELIBERATELY NOT THE WHOLE PAGE STACKING, which is the other thing that
       was asked about: "Who we are" and the aspiration statement are short
       prose and read BETTER side by side. Stacking everything would push the
       table further down the page to solve a problem it does not have. */
    (editing ? '' : '<div class="divide"></div>' +
      koBlock(objectives, page, acKey, owner, isGroup, false)) +
  '</div>';
}

/* The objectives, wherever they are being drawn. One function, so the card and
   the band cannot come to say different things about the same list. */
function koBlock(objectives, page, acKey, owner, isGroup, editing){
  return '<div class="boxhead"><span class="boxlab">' + L("keyobj","bu") + '</span>' +
      /* THE UNIT'S ONLY, because the group's objectives have always shown both
         and there is nothing there to toggle (§51.16). Hidden in edit for the
         same reason the layout switch is: authoring shows every field there is,
         so a control that hides one would be lying about what is stored. */
      (editing ? '' : (isGroup ? '' : koYearToggle()) + koToggle()) + '</div>' +
    (editing ? koEdit(objectives, page, acKey, owner) : koView(objectives, isGroup));
}

/* THE BAND ASKS THE SAME QUESTION THE CARD ASKS (§94). `authoring()` and not a
   flag passed down from the caller: the viewer switcher repaints without
   leaving modes, so the band has to be able to decide for itself that this page
   is no longer open to whoever is now looking at it. Nothing is drawn at all
   when it is not — the band exists only while the pen is on. */
function koBand(objectives, page, acKey, owner, isGroup){
  if (!authoring(page, acKey)) return '';
  return '<div class="card koband">' +
    koBlock(objectives, page, acKey, owner, isGroup, true) + '</div>';
}

function renderUnitFoundation(u){
  var upg = authoring("foundation", "u_found") ? "foundation" : null;
  return '<div class="fgrid"><div class="card"><h2 class="sec first">Who we are</h2>' +
      '<dl style="margin:0">' +
      u.clauses.map(function(c){
        return '<div class="clause"><dt>' + esc(c[0]) + '</dt><dd>' +
          fieldOr(upg, c[1], "", function(v){ c[1] = v; }) + '</dd></div>';
      }).join("") + '</dl></div>' +
      aspirationCard(L("aspiration","bu"), u.aspiration, u.endInMind, u.keyObjectives, "foundation",
        function(v){ u.aspiration = v; }, function(v){ u.endInMind = v; }, "u_found",
        false, u) +
    '</div>' +
    koBand(u.keyObjectives, "foundation", "u_found", u, false);
}

/* ── UNIT · Analysis ───────────────────────────────────────────────
   Static, like the foundation. Context, not a score — nothing here feeds a
   number. */
function renderUnitAnalysis(u){
  var box = function(cls, key, title){
    var list = u.swot[key] || [];
    return '<section class="' + cls + '"><h3>' + title + '</h3><ol class="swotlist">' +
      list.map(function(x, i){
        return '<li><span class="swot-n">' + (i + 1) + '</span>' +
          (authoring("analysis", "u_anal")
            ? fieldOr("analysis", x, "", function(v){ list[i] = v; })
            : '<span>' + esc(x) + '</span>') + '</li>';
      }).join("") + '</ol></section>';
  };
  return '<div class="swot hoverpen">' + penBtn("analysis", "u_anal") +
    box("s","s","Strengths") + box("w","w","Weaknesses") +
    box("o","o","Opportunities") + box("t","t","Threats") + '</div>';
}

/* ── GROUP · Focus board ────────────────────────────────────────────
   The only screen where every unit's focus measures appear together, and the
   only place they can be reviewed side by side. A business unit never reaches
   it: what another unit is rewarded on is not its business, and a league table
   nobody asked for is the fastest way to make this political.

   Shaded by unit block rather than by row. Plain zebra striping would cut
   across the groups the row-spanning cell creates and make the unit boundaries
   harder to see, which is the thing that actually needs to be visible here. */
function renderFocusBoard(){
  var live = activeKeys().filter(function(k){ return unitFocus(UNITS[k]).length; });
  var totals = { over:0, met:0, short:0, none:0, total:0 };

  var body = live.map(function(k, ui){
    var u = UNITS[k], items = unitFocus(u);
    return items.map(function(x, i){
      var st = focusStanding(x.m.progress);
      totals[st.key]++; totals.total++;
      return '<tr class="' + (ui % 2 ? "alt " : "") + (i === 0 ? "unitstart" : "") + '">' +
        (i === 0 ? '<td class="unitcell" rowspan="' + items.length + '"><b>' + esc(u.name) + '</b>' +
                   '<span class="why" style="margin:3px 0 0">weight ' + u.weight + '%</span></td>' : '') +
        '<td>' + esc(x.m.name) + '</td>' +
        '<td class="cc"><span class="why" style="margin:0">' + esc(x.src) + '</span></td>' +
        '<td class="num">' + (x.m.target ? esc(x.m.target) : '<span class="missing">Missing</span>') + '</td>' +
        '<td class="num">' + esc(x.m.actual) + '</td>' +
        '<td class="num final">' + pct(x.m.progress) + '</td>' +
        '<td class="cc"><span class="badge b-' + st.key + '">' + st.label + '</span></td></tr>';
    }).join("");
  }).join("");

  var unmarked = activeKeys().filter(function(k){ return !unitFocus(UNITS[k]).length; })
                             .map(function(k){ return UNITS[k].name; });

  var chips = [["over","earning"],["met","met, not earning"],["short","short"],["none","not reported"]]
    .filter(function(x){ return totals[x[0]]; })
    .map(function(x){ return '<span class="badge b-' + x[0] + '">' + totals[x[0]] + ' ' + x[1] + '</span>'; })
    .join("");

  return '<div class="fstrip" style="margin-bottom:20px"><div class="fstrip-head">' +
      '<span class="fstrip-t"><span class="fmark" style="margin:0 7px 0 0"></span>Cycle ' +
        esc(CYCLE.name) + '</span>' +
      '<span class="fstrip-meta">reward begins at ' + CYCLE.rewardAt + '% of target' +
        (CYCLE.locked ? ' &middot; locked' : ' &middot; open for marking') + '</span>' +
    '</div>' +
    '<div class="fstrip-body">' +
      '<div class="fcount"><b>' + totals.over + '</b><span> of ' + totals.total + '</span><em>earning</em></div>' +
      '<div class="fchips">' + chips + '</div>' +
      '<div class="fmean">' + live.length + ' of ' + activeKeys().length + ' units marked</div>' +
    '</div></div>' +

    section("", "Focus measures", null,
      (totals.total
        ? '<div class="cfg"><table class="board"><thead><tr>' +
            '<th style="width:16%">Business unit</th><th>Focus measure</th>' +
            '<th class="cc">Source</th><th class="cc">Target</th><th class="cc">Actual</th>' +
            '<th class="cc">Progress</th><th class="cc">Standing</th>' +
          '</tr></thead><tbody>' + body + '</tbody></table></div>'
        /* IT SENT PEOPLE TO A CONTROL THAT DOES NOT EXIST (§48.7). Both notes
           said marking happens on a unit's own Performance page, by pressing
           "Mark focus" — there is no such button anywhere, for any viewer.
           Marking moved to Setup a long time ago, and focusStrip()'s own
           comment thirty lines up says so: "Nothing is marked from here.
           Marking is a configuration act and lives in Setup." The page and the
           comment beside it disagreed, and the page was wrong.

           A note that names a route is worth more than one that describes a
           feeling, which is why these two survived this morning's prose cut —
           but only if the route is real. */
        : '<div class="note">Nothing marked in this cycle. Marks are made on ' +
          '<b>Setup &rsaquo; Focus measures</b>.</div>') +
      (unmarked.length
        ? '<div class="note"><b>' + unmarked.length + ' unit' + (unmarked.length > 1 ? 's have' : ' has') +
          ' nothing marked.</b> ' + unmarked.map(esc).join(", ") +
          '. Marked on <b>Setup &rsaquo; Focus measures</b>.</div>'
        : ''));
}

/* ── UNIT · Reporting ────────────────────────────────────────────
   The screen the platform did not have. Without it the only way a number
   reaches the product is an SMO uploading a sheet, which makes this a
   publishing tool rather than a management one.

   Only this unit's items, only what this cycle asks for, and no plan editing:
   a target cannot be moved from the screen where it is being reported against. */
function renderReport(u){
  var may = canReport(u.ukey);
  /* Submitting is the UNIT's act, and the unit's note speaks for the unit. A
     contributor limited to their own lines does neither — the server refuses
     both, so the screen does not offer them (spec 006 §7.2). */
  var mayAll = canSpeakFor(u.ukey);
  var c = reportedCount(u);
  var subd = !!REVIEW.submitted[u.ukey];
  var miss = missingNotes(u);
  var pctDone = c.total ? Math.round(c.done / c.total * 100) : 0;

  if (REVIEW.state !== "open") {
    return '<div class="note"><b>' + esc(REVIEW.name) + ' is closed.</b> Its figures are a record ' +
      'now and cannot be changed here. The SMO reopens a cycle if something has to be corrected.</div>';
  }

  /* One cell shape for every reportable row, so a measure and a tactic are
     entered the same way even though they mean different things. */
  /* The box carries the measure's own unit as a fixed suffix, so a tactic is
     plainly a percentage and a revenue measure is plainly billions of EGP. The
     number alone goes in the field \u2014 actuals are stored with their unit, and
     showing "28%" beside a "%" suffix reads as 28% %. The unit is rejoined on
     save so nothing downstream sees a bare number. */
  var entry = function(x){
    var isT = x.kind === "tactic";
    var unit = isT ? "%" : splitTarget(x.obj.target).unit;
    var cur = x.obj.actual, has = cur != null && cur !== "";
    var shown = !has ? "" : (isT ? String(cur) : splitTarget(cur).value || String(cur));
    /* Per ROW, not per page. A contributor is limited to the lines they are
       named on (spec 006 §7.2); a figure with a SOURCE is entered by that
       source and by nobody in the unit (§16.7). Both are refused by the
       server, so neither is offered here. */
    if (!canEnterFigure(u.ukey, x)) {
      var src = srcOf(x), lab = src ? srcLabel(x) : "";
      return '<span class="mono' + (src ? " sourced" : "") + '">' +
        (has ? esc(cur) + (isT ? "%" : "") : "\u2014") + '</span>' +
        (src ? ' <span class="srcby" title="Set by ' + esc(lab) + '">' + esc(lab) + '</span>' : '');
    }
    return '<span class="entry' + (has ? " filled" : "") + '">' +
      '<input class="field" data-rep="' + x.id + '" data-unit="' + esc(unit) + '" value="' + esc(shown) +
      '" placeholder="\u2014" aria-label="Report ' + esc(x.obj.name) + '">' +
      (unit ? '<span class="unitsuf">' + esc(unit) + '</span>' : '') + '</span>';
  };
  var noteCell = function(x){
    var want = needsNote(x);
    return canEnterNote(u.ukey, x)
      ? '<input class="fld notefld' + (want ? " needed" : "") + '" data-note="' + x.id + '" value="' +
        esc(x.obj.note || "") + '" placeholder="' +
        (want ? "Why, and what is being done" : "Note, if there is one") + '">'
      : (x.obj.note ? '<span class="why" style="margin:0">' + esc(x.obj.note) + '</span>' : '');
  };
  var doneOf = function(list){
    var n = 0;
    list.forEach(function(x){ if (x.obj.actual != null && x.obj.actual !== "") n++; });
    return n;
  };
  var tally = function(done, total){
    return '<span class="rtally' + (done === total ? " full" : "") + '">' + done + '/' + total + '</span>';
  };

  /* ── Key Objectives, in their own section \u2014 they are the unit's headline
     and should not be a block among blocks. */
  var objs = reportItems(u).filter(function(x){ return x.kind === "objective"; });
  var objTable = miniTable(["#", L("keyobj","bu"), "Dir.", "Target", "Reported", "Note"],
    objs.map(function(x, i){
      return '<tr' + (needsNote(x) ? ' class="wantnote"' : '') + '>' +
        '<td class="idx">' + (i+1) + '</td>' +
        '<td>' + esc(x.obj.name) + fmark(x.id) + '</td>' +
        '<td class="num">' + esc(x.obj.dir) + '</td>' +
        '<td class="num">' + (x.obj.target ? esc(x.obj.target) : '<span class="missing">Missing</span>') + '</td>' +
        '<td class="cc">' + entry(x) + '</td>' +
        '<td class="notecol">' + noteCell(x) + '</td></tr>';
    }).join(""));

  /* ── The rail carries the pillars (§15.12, the second half of the move that
     put it on Performance in 1.8). Where it earns most is exactly here: each
     rail row carries its pillar's tally, so while entering one pillar the
     state of the others stays visible — which an accordion cannot show from
     inside an open body. The selection belongs to the unit and is shared with
     Performance and Strategy. No reordering here: entry, not arrangement. */
  var reportPillarPane = function(p, pi){
    var ms = [];
    p.measures.forEach(function(m){ ms.push({ id:m.id, obj:m, kind:"measure" }); });
    var ts = [];
    p.tactics.forEach(function(t){
      ts.push({ id:t.id, obj:t, kind:"tactic", sub:spanLabel(t), asked:tacticDue(t) });
    });
    var askedT = ts.filter(function(x){ return x.asked; });
    var done = doneOf(ms) + doneOf(askedT), total = ms.length + askedT.length;

    var mTable = ms.length
      ? '<h4 class="mini">' + L("measure","bu") + '</h4>' +
        miniTable(["#", "Measure", "Dir.", "Target", "Reported", "Note"],
          ms.map(function(x, i){
            return '<tr' + (needsNote(x) ? ' class="wantnote"' : '') + '>' +
              '<td class="idx">' + (i+1) + '</td>' +
              '<td>' + esc(x.obj.name) + fmark(x.id) + '</td>' +
              '<td class="num">' + esc(x.obj.dir) + '</td>' +
              '<td class="num">' + (x.obj.target ? esc(x.obj.target) : '<span class="missing">Missing</span>') + '</td>' +
              '<td class="cc">' + entry(x) + '</td>' +
              '<td class="notecol">' + noteCell(x) + '</td></tr>';
          }).join(""))
      : "";

    var tTable = ts.length
      ? '<h4 class="mini">Tactics</h4>' +
        miniTable(["#", "Tactic", "Owner", "Quarters", "Due at", "Reported", "Note"],
          ts.map(function(x, i){
            if (!x.asked) {
              return '<tr class="notdue"><td class="idx">' + (i+1) + '</td>' +
                '<td>' + esc(x.obj.name) + '</td><td>' + esc(x.obj.owner) + '</td>' +
                '<td>' + qs(x.obj) + '</td>' +
                '<td colspan="3" class="cc"><span class="pill kind">Not asked \u2014 outside this cycle</span></td></tr>';
            }
            return '<tr' + (needsNote(x) ? ' class="wantnote"' : '') + '>' +
              '<td class="idx">' + (i+1) + '</td>' +
              '<td>' + esc(x.obj.name) + '</td><td>' + esc(x.obj.owner) + '</td>' +
              '<td>' + qs(x.obj) + '</td>' +
              '<td class="num">' + tacticPlanned(x.obj) + '%</td>' +
              '<td class="cc">' + entry(x) + '</td>' +
              '<td class="notecol">' + noteCell(x) + '</td></tr>';
          }).join(""))
      : "";

    /* THE SAME BAND THE PLAN AND PERFORMANCE PANES WEAR (§46.3). This page was
       left behind when they changed: a 19px heading over a meta line, which is
       the shape those two shed. The counts and the tally are real information
       and move to the band's right end rather than onto a second line.

       `p.kind` goes with it. SHOW_KIND has been false since 3.4 and every
       other surface honours it; this one printed "Direction" straight from the
       data and was the last place in the product still saying it. */
    return pillarBand(pillarCode(u, pi), p.name,
        '<span class="pband-n">' + ms.length + ' measures &middot; ' +
        askedT.length + ' tactics asked' +
        (ts.length - askedT.length ? ' &middot; ' + (ts.length - askedT.length) + ' outside this cycle' : '') +
        '</span>' + tally(done, total)) +
      mTable + tTable;
  };

  /* Entries given of asked, per pillar \u2014 what the rail rows and the pane pill
     both read, so they can never disagree. */
  var pillarTally = function(p){
    var done = 0, total = 0;
    p.measures.forEach(function(m){
      total++;
      if (m.actual != null && m.actual !== "") done++;
    });
    p.tactics.forEach(function(t){
      if (!tacticDue(t)) return;
      total++;
      if (t.actual != null && t.actual !== "") done++;
    });
    return { done: done, total: total };
  };

  var sel = unitRailPick(u);
  var pillars;
  if (!sel) {
    pillars = '<div class="note">This unit has no ' + L("pillar","bu").toLowerCase() +
      ' yet, so there is nothing to report against.</div>';
  } else {
    var railRows = u.items.map(function(p, pi){
      var t = pillarTally(p);
      var sub = t.total === 0 ? 'Not asked this cycle'
              : t.done >= t.total ? 'Complete'
              : (t.total - t.done) + ' still to enter';
      return '<button class="ritem' + (p.code === sel.code ? " on" : "") + '" data-urail="' +
          esc(u.ukey) + '|' + esc(p.code) + '">' +
        railName(pillarCode(u, pi), p.name) +
        '<span class="rnum"><span class="rtally' + (t.total && t.done >= t.total ? " full" : "") + '">' +
          t.done + '/' + t.total + '</span></span>' +
        railSub(sub) + '</button>';
    }).join("");
    var rail = '<div class="rail">' + railHead(L("pillar","bu"), u.items.length) + railRows +
      '<div class="rfoot">Tally is entries given of asked</div></div>';
    var pane = reportPillarPane(sel, u.items.indexOf(sel));
    pillars = u.items.length >= 2
      ? '<div class="split">' + rail + '<div class="pane">' + pane + '</div></div>'
      : '<div class="pane">' + pane + '</div>';
  }

  var bar =
    '<div class="rep-bar">' +
      '<div class="kpi"><b>' + c.done + '</b><span>of ' + c.total + ' reported</span></div>' +
      '<div class="repbar' + (pctDone < 100 ? " part" : "") + '"><i style="width:' + pctDone + '%"></i></div>' +
      '<span class="why" style="margin:0">' + esc(REVIEW.name) + ' &middot; due ' + esc(REVIEW.due) + '</span>' +
      (mayAll
        ? (subd
            ? '<span class="badge b-done">Submitted</span>' +
              '<button class="linkbu" data-unsubmit="' + u.ukey + '">Reopen my report</button>'
            : '<button class="editbtn" data-submit="' + u.ukey + '">Submit to the SMO</button>')
        : '<span class="pill none">View only</span>') +
      draftBtns() +
    '</div>';

  var summary =
    '<h4 class="mini">The owner\'s note on this cycle</h4>' +
    '<div class="card" style="padding:14px 16px">' + (mayAll
      ? '<textarea class="fld" data-unote="' + u.ukey + '" rows="3" style="width:100%;max-width:none" ' +
        'placeholder="What the numbers do not say \u2014 what happened, what is being done, what to expect next.">' +
        esc(REVIEW.note[u.ukey] || "") + '</textarea>'
      : '<span class="why" style="margin:0">' + (REVIEW.note[u.ukey] ? esc(REVIEW.note[u.ukey]) : "None.") + '</span>') +
    '</div>';

  /* A blocked Submit with no explanation is hostile. If the unit is waiting on
     somebody else's figures, the page names them and who owes them — the person
     is accountable for the completeness, so they need a route to act on it
     (§16.7, settled). */
  var waiting = outstandingSources(u);
  var waitingNote = waiting.length && may
    ? '<div class="note attn-note"><b>' + waiting.length + ' figure' +
      (waiting.length > 1 ? 's are' : ' is') + ' entered by another team, and not in yet.</b> ' +
      /* Names the PERSON as well as the set's team: "ask Finance" is not an
         instruction anybody can act on once there are several sets; "ask
         Hossam" is. */
      waiting.map(function(x){
        var who = personName(figureAssignee(x));
        return esc(x.obj.name) + " (" + esc(srcLabel(x)) +
               (who ? " \u2014 " + esc(who) : "") + ")";
      }).join(" &middot; ") +
      '. Your report is not complete until they arrive \u2014 ask them, the SMO cannot ' +
      'be the only one chasing.</div>'
    : '';

  return waitingNote + (miss.length && may
      ? '<div class="note bad-note"><b>' + miss.length + ' figure' + (miss.length > 1 ? 's need' : ' needs') +
        ' a note.</b> Anything at risk or off track carries an explanation before it can be ' +
        'submitted.</div>'
      : '') +
    bar +
    section("", L("keyobj","bu") + " " + tally(doneOf(objs), objs.length), null, objTable) +
    section("", L("pillar","bu") + " &mdash; measures and tactics", null, pillars) +
    summary;
}


/* ── A capability's own pages ────────────────────────────────────────
   Reached directly by the people of the function that carries it. Three tabs
   now, matching a business unit's shape: what it reads, the plan, and
   reporting. The function is the destination; the capabilities it carries are
   named inside — Marketing carries two, which is exactly why. */
function fnOf(key){ return FUNCTIONS[String(key).replace(/^fn:/, "")] || null; }
function fnKeyOf(key){ return String(key).replace(/^fn:/, ""); }
function capHead(c){
  var f = functionOf(c.fn), r = capReported(c);
  return '<div class="caphdr">' +
    '<div><div class="capname">' + esc(c.name) + '</div>' +
      '<div class="why" style="margin:3px 0 0">' +
        'Supporting function ' + esc(f ? f.name : "\u2014") +
        (f ? ' &middot; ' + esc(functionPeople(c.fn).map(personName).join(", ")) : '') +
        ' &middot; scored by the group, not by a business unit</div></div>' +
    '<div class="capkpi"><div><i>Reported</i><b>' + r.done + ' / ' + r.total + '</b></div></div></div>';
}

function fnKeyOf(key){ return String(key).replace(/^fn:/, ""); }
function capHead(c){
  var f = functionOf(c.fn), r = capReported(c);
  return '<div class="caphdr">' +
    '<div><div class="capname">' + esc(c.name) + '</div>' +
      '<div class="why" style="margin:3px 0 0">' +
        'Supporting function ' + esc(f ? f.name : "\u2014") +
        (f ? ' &middot; ' + esc(functionPeople(c.fn).map(personName).join(", ")) : '') +
        ' &middot; scored by the group, not by a business unit</div></div>' +
    '<div class="capkpi"><div><i>Reported</i><b>' + r.done + ' / ' + r.total + '</b></div></div></div>';
}

/* THE FUNCTION'S OWN NAMEPLATE IS GONE (§51.4, Islam).

   It printed the function's name, its people, how many capabilities it carries
   and "scored by the group" — above a navigation row that already highlights
   the function you are looking at. That is §24's argument, and the unit pages
   settled it two versions earlier: a UNIT has no such band on any of its
   tabs, so a function carrying one made the two halves of the product read as
   two products.

   It was also lying on a tenant where nobody is attached: with no people the
   line rendered "Supporting function \u00b7 \u00b7 carries 1 capability" — two
   middots with nothing between them, which is what a joined empty list looks
   like. A line that has to be defended by a fallback for the ordinary case is
   a line nobody needed.

   The capability's own band (`capBand`) stays: a function may carry several,
   and that band is what says which one a section belongs to. */

function capBand(c){
  var r = capReported(c);
  return '<div class="capline"><span class="captag">Capability</span>' +
    '<span class="capnm">' + esc(c.name) + '</span>' +
    '<span class="captally">' + r.done + ' / ' + r.total + ' reported</span></div>';
}

/* ── The rail ────────────────────────────────────────────────────────
   Which project is open is held by the capability, not by the page, so it
   keeps its place when the tab changes. That is not hidden state: the rail
   shows the selection at all times, which is the whole reason it is allowed
   to persist. It is dropped when the viewer leaves the capability. */
var RAIL = {};
function railKeyFor(c){ return "cap:" + c.id; }
function railPick(c){
  var k = railKeyFor(c), want = RAIL[k];
  var list = c.projects || [];
  if (!list.length) return null;
  for (var i = 0; i < list.length; i++) if (list[i].id === want) return list[i];
  return list[0];
}
/* Below two items there are no siblings to move between, so the rail is a
   column of wasted width. The pane simply fills it. */
function railWorthIt(list){ return (list || []).length >= 2; }

/* `codeOf` is optional and last, so every existing caller is untouched. The
   unit rail has shown `MB01 Digital & Data-Driven Operations` since §46.3; a
   project rail beside it showed a bare name, and the two rails are the same
   component doing the same job (§51.3). */
/* ── THE RAIL'S CODE, AND THE SUB-LINE TOGGLE (§60) ────────────────
   Islam: "the code looks like the same name with the pillar name — that needs
   distinction in terms of colour and alignment."

   It did, and for a plain reason: the code was INSIDE the same bold element as
   the name, same colour, same weight, on the same line — so `FIN01` read as
   the first word of the title. The pane's band beside it had already solved
   this (`.pband-code`: mono, letter-spaced, `--stone`), so the rail takes the
   pane's treatment rather than a new one, and the two say the code the same
   way. That is §53's parity rule, not a fresh choice.

   ONE HELPER FOR FOUR RAILS. The unit's Plan, Performance and Report rails and
   the capability's Projects rail each built this string themselves — the shape
   §59.3 was bitten by, where the same question answered in two places meant
   fixing one of them changed nothing. */
function railName(code, name){
  return (code ? '<span class="rcode">' + esc(code) + '</span>' : '') +
    '<b>' + esc(name) + '</b>';
}
/* The header, and the control that drops every row's small line. A SCREEN
   PREFERENCE, so it lives in localStorage beside the theme and the People
   page's columns (§25, §47.1) — putting it in the state graph would change
   the rail for everyone in the tenant. */
var RAIL_TERSE = (function(){
  try { return localStorage.getItem("smp.rail.terse") === "1"; } catch(e){ return false; }
})();
function railHead(label, n){
  return '<div class="rhead"><span class="rhl">' + label + ' <span>' + n + '</span></span>' +
    '<button class="railterse' + (RAIL_TERSE ? " on" : "") + '" data-railterse="1" ' +
    'title="' + (RAIL_TERSE ? "Show the detail under each name" : "Just the names") + '" ' +
    'aria-pressed="' + (RAIL_TERSE ? "true" : "false") + '">' +
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h7" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>' +
    '</button></div>';
}
function railSub(html){
  return (RAIL_TERSE || !html) ? "" : '<span class="rsub">' + html + '</span>';
}

/* `opts` carries the two things the PLAN page's rail needs and the
   Performance page's must not have (§69.13): drag handles, and an Add row at
   the end. Optional and absent by default, so the four other callers are
   untouched — a rail that grew an Add button on Performance would be offering
   to author a plan from the page that reports against it. */
function railFor(list, sel, numOf, subOf, groupOf, footNote, codeOf, opts){
  opts = opts || {};
  var lastGroup = null;
  var rows = list.map(function(it, i){
    var g = groupOf ? groupOf(it) : null, head = "";
    if (g && g !== lastGroup) { head = '<div class="rgroup">' + esc(g) + '</div>'; lastGroup = g; }
    var code = codeOf ? codeOf(it) : "";
    return head +
      '<button class="ritem' + (it.id === sel.id ? " on" : "") + '" data-rail="' + esc(it.id) +
        '" data-oi="' + i + '">' +
        (opts.arranging ? handle("Reorder " + it.name) : '') +
        railName(code, it.name) +
        /* NO NUMBER MEANS NO ELEMENT. An empty `.rnum` still takes its column in
         the row's grid, so a rail with nothing to show on the right laid its
         names out as though something were there — the unit's Plan rail, which
         has never had a number, does not render one at all. */
      (numOf ? '<span class="rnum">' + numOf(it) + '</span>' : '') +
        railSub(subOf ? subOf(it) : "") +
      '</button>';
  }).join("");
  /* THE CONTAINER SAYS WHAT IT HOLDS (§63.5): `data-item=".ritem"`, because
     picking the selector off `data-kind` is exactly how the unit rail's grips
     came to be bound to nothing for as long as the rail has had handles. */
  var body = opts.arranging
    ? '<div class="sortable" data-item=".ritem" data-kind="projects" data-cap="' +
        esc(opts.capId || "") + '">' + rows + '</div>'
    : rows;
  return '<div class="rail' + (opts.arranging ? ' arranging' : '') + '">' +
    railHead("Projects", list.length) + body +
    (opts.add ? '<div class="railadd"><button class="linkbu" data-rowadd="project|' +
      esc(opts.capId) + '">+ Add a project</button></div>' : '') +
    (footNote ? '<div class="rfoot">' + footNote + '</div>' : '') + '</div>';
}
function splitOrPane(list, sel, rail, pane){
  return railWorthIt(list)
    ? '<div class="split">' + rail + '<div class="pane">' + pane + '</div></div>'
    : '<div class="pane">' + pane + '</div>';
}

/* THERE IS NO projMeta(). It built "Q1 2026 → Q4 2026 · timeline by quarter"
   for the rail's small line, and the rail dropped it (§53.2) to match the
   unit's. The dates are on the project's own cover line, which is where a
   date belongs; a function left holding a helper nothing calls is how a
   stylesheet ends up describing a control the product does not have (§24). */
/* ── ONE TABLE, ONE ROW SHAPE (§101, undoing §99's split) ────────────────
   §99 cut the table in two because Direction, Target and Due date had nothing
   to say for a deliverable -- the em-dash was the table asking a row a
   question its kind could not answer. Islam: *"wait, I over complicated
   things … make them 1 table … for the deliverables the direction is always
   bigger than and the target is 100%"*, later *"change it from 100% to Y/N"*.

   GIVING A DELIVERABLE A REAL DIRECTION AND A REAL TARGET IS THE BETTER FIX.
   The cells now have ANSWERS, so the dead cells go because the questions
   became answerable rather than because the table was cut in two. Fewer
   parts, same problem solved -- and the band, the per-half column strip and
   the colspan arithmetic that kept two halves aligned all go with it (§24).

   THE TYPE COLUMN COMES BACK, and that is coherent rather than a reversal of
   a reversal: §99 removed it because the BAND said which kind a row was, and
   with no band something has to.

   THE DIRECTION IS "=", NOT ">=". With a target of Y/N there is nothing to be
   greater than, and a blank cell would put back the one thing this merge
   removed. "= Y/N" is what the row actually says. */
var DX_HEADING = "Deliverables and outcomes";
function dxIsDeliv(row){ return row.kind === "d"; }
function dxType(row){
  /* One box for both words: "Deliverable" and "Outcome" are seven characters
     apart, so left to themselves the column reads as two different marks
     rather than one question answered two ways. The width is in the CSS. */
  return '<span class="pill kind tk">' + (dxIsDeliv(row) ? "Deliverable" : "Outcome") + '</span>';
}
/* A deliverable's direction and target are written FOR it rather than asked
   OF it, and shown quietly, because a value nobody can change should not look
   like a field. */
function dxDir(row){ return dxIsDeliv(row) ? '<span class="fixedval">=</span>' : esc(row.obj.dir || ""); }
function dxTarget(row){
  return dxIsDeliv(row) ? '<span class="fixedval">Y/N</span>'
                        : (row.obj.target ? esc(row.obj.target) : '<span class="missing">Missing</span>');
}
/* ONE WORD FOR WHEN. A deliverable stores `due`, an outcome `measureAt` and a
   milestone `finish` -- three spellings for one question, kept because a
   stored field is an identifier and renaming one is a migration for a word
   nobody reads (§58, §65). `dxWhen` is the one place that knows which.

   §101.8: NO SETTER. The date is off the tables and off the templates "for
   now", so nothing writes it any more -- and a setter with no caller is the
   kind of leftover §24 exists to stop. The READER stays, because the date is
   still what decides whether a row is asked for and whether it is late, for
   any plan that already carries one. */
function dxWhen(row){ return dxIsDeliv(row) ? row.obj.due : row.obj.measureAt; }
/* THE DUE-DATE CELL SAYS WHICH OF THREE THINGS IS TRUE. Overdue is red and
   loud -- past its date, unfinished, and being asked for. Not due is quiet --
   its cycle has not come, so nothing is asked and nothing is scored. On time
   is just a date. */
/* THE DUE DATE IS HIDDEN, NOT DELETED (§101.8). It still decides whether a
   row is asked for this cycle and whether it is late -- it simply stopped
   being a column on the two panes people READ. So the lateness it used to
   carry moves under the name, which is where a row's own qualifiers already
   live, and says the date rather than assuming somebody remembers it. */
function lateNote(v, done){
  return overdue(v, done)
    ? '<span class="why lateval" style="margin:0">Overdue &mdash; was due ' + esc(v) + '</span>'
    : "";
}
function dxDate(v, done){
  var t = v ? esc(v) : '<span class="missing">Missing</span>';
  if (!dueThisCycle(v)) return '<span class="soonval">' + t + '</span>';
  if (overdue(v, done)) return '<span class="lateval">' + t +
    '<span class="latenote">overdue</span></span>';
  return t;
}
/* Deliverables then outcomes, as ONE list -- numbered straight through,
   because with one table and one row shape it IS one list again. */
function dxRows(p){
  return (p.deliverables || []).map(function(d){ return { kind:"d", obj:d }; })
    .concat((p.outcomes || []).map(function(o){ return { kind:"o", obj:o }; }));
}
/* ONE PILL FOR BOTH, because a deliverable and a milestone are now reported
   the same way. The last word differs and should: a deliverable is
   DELIVERED, a milestone is COMPLETED. */
function statusPill(x, doneWord){
  if (!x.status) return '<span class="pill kind">&mdash;</span>';
  if (x.status === "done") return '<span class="pill good">' + doneWord + '</span>';
  if (x.status === "wip") return '<span class="pill attn">In progress</span>';
  return '<span class="pill kind">Not started</span>';
}
function delivShown(d){ return statusPill(d, "Delivered"); }
function msPill(m){ return statusPill(m, "Completed"); }
/* The per-cent follows the word at both ends and is typed only in the middle
   -- a box that can contradict the word beside it is a box that eventually
   will. A row nobody is being asked for shows what it is instead. */
function pctRead(x, when){
  if (when != null && !dueThisCycle(when)) return notDueCell();
  var v = statusReads(x);
  return v == null ? "&mdash;" : v + "%";
}
/* ── NOT DUE IS A LABEL, NOT A LOCK (§101.8) ──────────────────────
   The comment over the reporting pane has said exactly that since it was
   written, and the code did the opposite: a row not due this cycle had its
   control REPLACED by the word, so the one thing the sentence promised —
   reporting early — was the one thing that could not be done. The same gate
   on Performance read a row that HAD been reported early as a dash while its
   figure went on counting toward the score, which is a screen disagreeing
   with the number beside it.

   One rule, four places: a not-due row is QUIET UNTIL IT CARRIES A READING,
   and says what it carries the moment it does. The gate moves from "is this
   due" to "has this been answered". */
function notDueCell(){ return '<span class="pill kind">Not due</span>'; }
function reportedAny(x, d){
  return d ? !!x.status : (x.actual != null && x.actual !== "");
}
var MS_WORDS = [["", "\u2014"], ["todo", "Not started"], ["wip", "In progress"], ["done", "Completed"]];
var DX_WORDS = [["", "\u2014"], ["todo", "Not started"], ["wip", "In progress"], ["done", "Delivered"]];
/* A milestone finishing after the project's end date is saved as entered and
   said out loud. Two things might be true and the platform picks neither. */
function overrunNote(p){
  var over = projOverruns(p);
  if (!over.length) return "";
  return '<div class="note bad-note"><b>' + over.length + ' milestone' + (over.length === 1 ? "" : "s") +
    ' finish after this project ends on ' + esc(p.end) + '.</b> ' +
    'The dates are saved exactly as entered \u2014 the platform does not refuse one. The project has run ' +
    'past its timeline, so either the timeline moves or the overrun stands. Both are yours to decide.</div>';
}

/* ── Capability \u2192 Performance ───────────────────────────────────────
   Three readings, side by side, never folded into one. Key objectives is
   optional: where a capability has none the card is absent, not zero. */
function capScoreCards(c){
  var ko = capKOScore(c), perf = capPerf(c), ce = capExec(c);
  var cards = [];
  if (ko != null) {
    cards.push('<div class="card tight primary-card">' +
      '<div class="score-h"><h4>Key objectives <span class="rank">primary</span></h4>' +
        '<span class="pill ' + band(ko) + '">' + bandWord(ko) + '</span></div>' +
      '<div class="headline"><span class="big" style="color:var(--' + band(ko) + ')">' + pctBig(ko) + '</span></div>' +
      '<div class="minirow"><div><em>Objectives</em><b>' + c.keyObjectives.length + '</b></div>' +
        '<div><em>Weighted</em><b>' + c.keyObjectives.map(function(m){ return m.weight == null ? "\u2014" : m.weight; }).join(" / ") + '</b></div>' +
        '<div><em>Reported</em><b>' + c.keyObjectives.filter(function(m){ return m.actual != null && m.actual !== ""; }).length +
          ' / ' + c.keyObjectives.length + '</b></div></div></div>');
  }
  cards.push('<div class="card tight' + (ko == null ? " primary-card" : "") + '">' +
    '<div class="score-h"><h4>Project performance' + (ko == null ? ' <span class="rank">primary</span>' : '') + '</h4>' +
      '<span class="pill ' + band(perf) + '">' + bandWord(perf) + '</span></div>' +
    '<div class="headline"><span class="big" style="color:var(--' + band(perf) + ')">' + pctBig(perf) + '</span></div>' +
    '<div class="minirow"><div><em>Deliverables</em><b>' + pct(capDeliverySide(c)) + '</b></div>' +
      '<div><em>Outcomes</em><b>' + pct(capOutcomeSide(c)) + '</b></div>' +
      '<div><em>Projects</em><b>' + c.projects.length + '</b></div></div></div>');
  cards.push('<div class="card tight">' +
    '<div class="score-h"><h4>Execution</h4>' +
      '<span class="pill ' + band(ce.pct) + '">' + bandWord(ce.pct) + '</span></div>' +
    '<div class="headline"><span class="big" style="color:var(--' + band(ce.pct) + ')">' + pctBig(ce.pct) + '</span>' +
      '<span class="ofplan">' + ce.done + ' of ' + ce.total + ' milestones</span></div>' +
    '<div class="minirow"><div><em>Completed</em><b>' + ce.done + '</b></div>' +
      '<div><em>In progress</em><b>' + ce.wip + '</b></div>' +
      '<div><em>Not started</em><b>' + ce.todo + '</b></div></div></div>');
  return '<div class="scores">' + cards.join("") + '</div>';
}

function capKOTable(c){
  if (!c.keyObjectives.length) return "";
  return '<h4 class="mini">Key objectives</h4>' +
    miniTable(["#","Objective","Weight","Dir.","Target","Reported","Score"],
      c.keyObjectives.map(function(m, i){
        return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) +
          (m.note ? '<span class="why">' + esc(m.note) + '</span>' : '') + '</td>' +
          '<td class="cc">' + (m.weight == null ? "&mdash;" : m.weight + "%") + '</td>' +
          '<td class="cc">' + esc(m.dir) + '</td>' +
          '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
          '<td class="num">' + (m.actual == null || m.actual === "" ? "&mdash;" : esc(m.actual)) + '</td>' +
          '<td class="num final" style="color:var(--' + band(m.progress) + ')">' + pct(m.progress) + '</td></tr>';
      }).join(""));
}

function projPerformanceBody(p, fk){
  /* Status holds the WORD for a deliverable and the FIGURE for an outcome --
     both are "what was reported" -- and % holds the number the score is built
     from, for both, so the score column runs down one edge (§101). */
  var dxr = dxRows(p).map(function(row, i){
    var o = row.obj, when = dxWhen(row), d = dxIsDeliv(row);
    var notDue = !dueThisCycle(when);
    var has = reportedAny(o, d);
    var got = d ? statusPill(o, "Delivered")
                : (has ? esc(o.actual) : (notDue ? notDueCell() : '<span class="pill kind">&mdash;</span>'));
    var reads = d ? statusReads(o) : o.progress;
    /* "Finished" is a status for a deliverable and a REPORTED FIGURE for an
       outcome. Asking statusReads() of an outcome answers null, which read
       every measured outcome as overdue. */
    var done = d ? statusReads(o) === 100 : (o.actual != null && o.actual !== "");
    return '<tr' + (notDue && !has ? ' class="notdue"' : '') + '>' +
      '<td class="idx">' + (i+1) + '</td><td>' + esc(o.name) + lateNote(when, done) +
        (o.note ? '<span class="why">' + esc(o.note) + '</span>' : '') + '</td>' +
      '<td class="cc">' + dxType(row) + '</td>' +
      '<td class="num">' + dxTarget(row) + '</td>' +
      '<td class="cc">' + got + '</td>' +
      '<td class="num final"' + (reads == null ? '' :
        ' style="color:var(--' + band(reads) + ')"') + '>' +
        (has ? pct(reads) : (notDue ? notDueCell() : "&mdash;")) + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    var v = msReads(m), quiet = !dueThisCycle(m.finish) && !m.status;
    return '<tr' + (quiet ? ' class="notdue"' : '') + '>' +
      '<td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + esc(m.owner || "\u2014") + '</td>' +
      '<td class="cc">' + dxDate(m.finish, m.status === "done") + '</td>' +
      '<td class="cc">' + (quiet ? notDueCell() : msPill(m)) + '</td>' +
      '<td class="num final">' + (quiet ? notDueCell() : (v == null ? "&mdash;" : v + "%")) +
      '</td></tr>';
  }).join("");
  var mst = projMilestones(p);
  /* THE SAME BAND THE PILLAR PANE WEARS (§51.3). It was an `.ptitle` with a
     19px <h3> and a meta line — the shape the unit's pane carried until §46.3
     replaced it with a 33px band, code first, on `--surface-2` with a gold
     left edge. Two panes doing the same job in the same component wore two
     different headers; they wear one now, and the project shows the code the
     rail beside it shows. The `right` slot pillarBand has always had and never
     used carries the score. */
  return pillarBand(projCode(fk, p), p.name,
      '<span class="pill ' + band(projPerf(p)) + '">' + pct(projPerf(p)) + '</span>') +
    '<h4 class="mini">' + DX_HEADING + '</h4>' +
    miniTable(["#","Deliverables &amp; outcomes","Type","Target","Status","%"], dxr) +
    '<h4 class="mini">Milestones <em>' + mst.done + ' of ' + mst.total + ' completed</em></h4>' +
    miniTable(["#","Milestone","Owner","Due date","Status","%"], mRows);
}

/* A FUNCTION WHOSE PLAN LIVES IN ITS CAPABILITIES AND WHICH CARRIES NONE
   rendered NOTHING AT ALL on all three of its pages — `[].map().join("")` is
   the empty string, and an empty string is a blank page rather than an empty
   state (§61, §45.2). It was unreachable before §61 and is not now, so the
   page has to say what would fill it.

   Named once, because it is the same sentence three times and the third copy
   is the one that gets left behind (§59). */
function fnNothingBehind(fk){
  var f = FUNCTIONS[fk];
  return '<div class="note">' + esc(f ? f.name : "This function") +
    ' improves no capability yet, so there is nothing here to plan or report. ' +
    'Allocate one on <b>Setup \u2192 Capabilities</b>, or set this function to plan ' +
    'in ' + L("pillar", "bu").toLowerCase() + ' on <b>Setup \u2192 Functions</b>.</div>';
}

function renderFnPerformance(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  /* A FUNCTION THAT PLANS IN PILLARS IS DRAWN BY THE UNIT'S PAGE (spec 010).
     One branch at the top of each of the four function pages, and nothing
     below it changes — the alternative was four more renderers that would have
     to be kept in step with the unit's for ever. */
  if (fnPlansInPillars(FUNCTIONS[fk])) return renderUnitPerformance(fnAsUnit(fk));
  /* The same Present a unit's Performance page carries (§8.8): available to
     anyone who can view this page, assembling the review from whatever the
     platform holds at that moment. */
  if (!caps.length) return fnNothingBehind(fk);
  return '<div class="pageact">' + reportBtn("fn:" + fk) + presentMenu("fn", fk) + '</div>' +
    caps.map(function(c){
    var sel = railPick(c);
    if (!sel) return capBand(c) + '<div class="capbody">' + capScoreCards(c) + capKOTable(c) +
      '<div class="note">No projects yet. Nothing to report until there are.</div></div>';
    /* And the same rail a unit's Performance page carries: the score on the
       right, execution and the owner underneath, and a footer that STATES the
       summary rather than captioning the column ("83% across 4 · execution
       71%"). "Figure shown is performance" explained a number nobody had
       asked about. */
    var ce = capExec(c);
    var rail = railFor(c.projects, sel,
      function(p){ var v = projPerf(p);
        return v == null ? '&mdash;'
          : '<b style="color:var(--' + band(v) + ')">' + v + '%</b>'; },
      function(p){ var m = projMilestones(p);
        return 'execution ' + m.done + ' of ' + m.total +
          (p.owner ? ' &middot; ' + esc(p.owner) : ''); },
      null, pct(capPerf(c)) + ' across ' + plural(c.projects.length, "project") +
        ' &middot; execution ' + pct(ce.pct),
      function(p){ return projCode(fk, p); });
    return capBand(c) + '<div class="capbody">' + capScoreCards(c) + capKOTable(c) +
      /* NO HEADING OVER THE RAIL. The rail's own head says "Projects 3" two
         lines below it, and a unit's Performance page puts no heading over
         its pillars either (§53.2). */
      splitOrPane(c.projects, sel, rail, projPerformanceBody(sel, fk)) + '</div>';
  }).join("");
}

/* ── Capability \u2192 Projects ──────────────────────────────────────────
   The plan as it was formed. Nothing here has been reported: no progress, no
   status, no actuals. Those are entered on Reporting and read on Performance. */
/* ── THE PEN REACHES THE PROJECTS PAGE (§69.13) ────────────────────────
   Islam: "in the projects and pillars pages I need to have the edit with
   include the arrange and add access, to edit current projects and pillars or
   add one."

   The pillars page has had a pen since §31 and drag handles since §63.3; the
   projects page had NEITHER, which is §53.5 exactly — a unit and a function
   are the same product, and the two pages were fine DIFFERENTLY. It is the
   SAME pen: `EDIT_PAGE.plan`, one mode, so pressing it on a function and
   walking to a unit does not find a second switch in the other position.

   And the same gate. `mayEditPlan()` is the SMO's alone (§31) — a plan
   correctable by the person measured against it is a different decision from
   one correctable by its custodian — and giving a function's plan a looser
   gate than a unit's would be inventing that decision here, on the quiet. */
function projEditing(){
  return EDIT_PAGE.plan && typeof mayEditPlan === "function" && mayEditPlan();
}
/* Arranging on the projects page, on the same two ways in the plan page has
   (§63.3): the pen turns the handles on with the fields, and somebody who may
   reorder but has no pen keeps the explicit button. A capability belongs to a
   FUNCTION, so the scope is the function's key — `canArrange("unit", "fn:x")`
   asks grantAt("u_plan", …) against it, which is the same question the unit
   side asks about a unit. */
function projArranging(fk){
  return arranging("unit", "fn:" + fk) || projEditing();
}
function projPlanBody(p, fk){
  /* NO DUE AND NO OWNER (§53.4). Islam: a deliverable is delivered when the
     project ends, so a date of its own was a second answer to a question the
     project had already answered; and the department carries it, not a named
     person — the project has an owner, and naming somebody per row invited
     the unit to argue about which of them it was. */
  var ed = projEditing();
  var on = projArranging(fk);
  /* The row's own id travels on the row, so removing one is by ID and never by
     index (§48.2): the render that drew the × and the array being spliced are
     a repaint apart, and the index is what goes stale in between. */
  var xb = function(list, id){
    return ed ? '<button class="xbtn" data-rowoff="' + esc(list) + '|' + esc(id) +
      '" title="Remove this row" aria-label="Remove this row">&times;</button>' : '';
  };
  var f = function(v, setter){
    return ed ? inputOr("plan", v == null ? "" : v, "", setter)
              : (v ? esc(v) : '<span class="missing">Missing</span>');
  };
  var sortAttr = function(kind){
    return on ? ' class="sortable" data-item="tr" data-kind="' + kind +
      '" data-fk="' + esc(fk) + '" data-pid="' + esc(p.id) + '"' : '';
  };
  /* ONE ROW SHAPE (§101). A deliverable's direction and target are written
     for it; only its due date is its own to choose. An outcome carries all
     three. Every cell answered, and no band to keep two halves aligned. */
  var dxr = dxRows(p).map(function(row, i){
    var o = row.obj, d = dxIsDeliv(row);
    return '<tr data-oi="' + i + '"><td class="idx">' +
      (on ? handle("Reorder " + o.name) : '') + '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? inputOr("plan", o.name, "", function(v){ o.name = v; }) : esc(o.name)) +
        xb(d ? "deliverables" : "outcomes", o.id) + '</td>' +
      '<td class="cc">' + dxType(row) + '</td>' +
      '<td class="cc">' + dxDir(row) + '</td>' +
      '<td class="num">' + (d ? dxTarget(row) : f(o.target, function(v){ o.target = v; })) +
      '</td></tr>';
  }).join("") +
  /* TWO ADD BUTTONS UNDER ONE TABLE, as §53.4 had them: one table of two
     kinds, and a single "add a row" would have to ask which -- a question
     the two buttons answer by existing. */
  (ed ? '<tr class="newrow"><td class="idx">+</td><td colspan="4">' +
      '<button class="linkbu" data-rowadd="deliverable|' + esc(p.id) + '">Add a deliverable</button>' +
      '<button class="linkbu" data-rowadd="outcome|' + esc(p.id) + '">Add an outcome</button>' +
    '</td></tr>' : '');
  var mRows = p.milestones.map(function(m, i){
    return '<tr data-oi="' + i + '"><td class="idx">' +
      (on ? handle("Reorder " + m.name) : '') + '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? inputOr("plan", m.name, "", function(v){ m.name = v; }) : esc(m.name)) +
        xb("milestones", m.id) + '</td>' +
      '<td>' + (ed ? inputOr("plan", m.covers || "", "", function(v){ m.covers = v; })
                   : esc(m.covers || "")) + '</td>' +
      '<td class="cc">' + (ed ? inputOr("plan", m.owner || "", "", function(v){ m.owner = v; })
                              : esc(m.owner || "\u2014")) + '</td>' +
      '<td class="cc">' + f(m.finish, function(v){ m.finish = v; }) + '</td></tr>';
  }).join("") +
  (ed ? '<tr class="newrow"><td class="idx">+</td><td colspan="4">' +
      '<button class="linkbu" data-rowadd="milestone|' + esc(p.id) + '">Add a milestone</button>' +
    '</td></tr>' : '');
  /* The owner sits on the band rather than in the rail. A pillar has two
     child lists and a project has three, so the rail's small line is a count
     longer here — adding a name to it took every row to three lines while a
     unit's sat at two, which is the sizing that had to match. */
  /* THE PANE'S OWN PEN, in the same corner the plan page puts it (§53.2). The
     band carries the project's NAME, so in edit mode it has to become a field
     or the one thing a new project needs most cannot be typed — the same
     exception the pillar heading makes (see unitPlanBody). */
  var band = ed
    ? '<div class="pband"><span class="pband-code">' + esc(projCode(fk, p)) + '</span>' +
        '<span class="pband-name">' +
          inputOr("plan", p.name, "", function(v){ p.name = v; }) + '</span>' +
        '<span class="pband-r">' +
          inputOr("plan", p.owner || "", "", function(v){ p.owner = v; }) +
          '<span class="pill kind">' + (p.timeline === "date" ? "By date" : "By quarter") +
        '</span></span></div>'
    : pillarBand(projCode(fk, p), p.name,
        (p.owner ? '<span class="pband-n">' + esc(p.owner) + '</span>' : '') +
        '<span class="pill kind">' + (p.timeline === "date" ? "By date" : "By quarter") + '</span>');
  return band +
    (mayEditPlan() ? '<div class="paneact">' + penBtn("plan", "u_plan") + '</div>' : '') +

    '<h4 class="mini">Brief</h4><p class="sub" style="margin:0">' +
      (ed ? fieldOr("plan", p.brief || "", "", function(v){ p.brief = v; }) : esc(p.brief)) + '</p>' +
    '<h4 class="mini">Stakeholders</h4>' +
    /* Typed as one line and stored as a list, through collabParse/collabNames
       — the same pair the tactics table uses for collaborators (§50.2), so
       "how is a list of names typed" has one answer in the platform. */
    /* collabText() takes the ROW and reads `.collaborators` off it; a project's
       list is `.stakeholders`, so it is handed a row-shaped object rather than
       the array — which returned [] and would have blanked every stakeholder
       list the moment the pen went on. */
    (ed ? inputOr("plan", collabText({ collaborators: p.stakeholders }), "",
            function(v){ p.stakeholders = collabParse(v); })
        : (p.stakeholders || []).map(function(x){
            return '<span class="pill kind">' + esc(x) + '</span> '; }).join("")) +
    '<h4 class="mini">' + DX_HEADING +
      ' <em>\u2014 what the project hands over, and what it is meant to change</em></h4>' +
    miniTable(["#","Deliverables &amp; outcomes","Type","Direction","Target"], dxr) +
    '<h4 class="mini">Milestones <em>\u2014 the timeline as planned</em></h4>' +
    /* NAME, THEN DESCRIPTION (§100). Islam: "we need the milestone name before
       the description." So the pair stays -- a milestone is identified by a
       short name and explained by a line under it -- and only the LABEL
       changes: "What it covers" was a question, "Description" is the word the
       tactics sheet has always used for the same thing. The stored field keeps
       its spelling (§58, §65): `covers` is an identifier, this is a label. */
    miniTable(["#","Milestone","Description","Owner","Due date"], mRows) +
    overrunNote(p);
}

function renderFnProjects(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  if (fnPlansInPillars(FUNCTIONS[fk])) return renderUnitPlan(fnAsUnit(fk));
  if (!caps.length) return fnNothingBehind(fk);
  var ed = projEditing(), on = projArranging(fk);
  /* Gone here for the same reason and in the same breath (§94.15, §53.5):
     a unit and a function are the same product, and a button removed from one
     side of the navigation switch and left on the other is exactly the drift
     that rule exists to stop. */
  return caps.map(function(c){
    var sel = railPick(c);
    /* AN EMPTY CAPABILITY IS WHERE THE FIRST PROJECT GOES (§61's lesson, the
       same shape): the note said "No projects yet" and offered nothing, so the
       only way to get a project was to upload a whole plan. With the pen on it
       carries the Add button instead — an empty state that says what would
       fill it AND lets you fill it. */
    if (!sel) return capBand(c) + '<div class="capbody"><div class="note">' +
      'No projects yet.' + (ed
        ? ' <button class="linkbu" data-rowadd="project|' + esc(c.id) +
          '">Add the first one</button>'
        : '') + '</div></div>';
    /* THE SAME RAIL A UNIT'S PLAN CARRIES (§53.2). §29.6 took the bare number
       and the footer explaining it off the unit's Plan rail — nothing on a
       plan page has been reported, so there is no figure to explain — and left
       them standing on the function's, which is the same rail on the same kind
       of page. The sub line loses projMeta with them: the unit's says how many
       of each thing and who owns it, in one line; this said that AND the start
       date AND the end date AND which kind of timeline, over three. */
    var rail = railFor(c.projects, sel, null,
      function(p){ return plural(p.deliverables.length, "deliverable") + ' &middot; ' +
        plural(p.outcomes.length, "outcome") + ' &middot; ' +
        plural(p.milestones.length, "milestone"); },
      null, null,
      function(p){ return projCode(fk, p); },
      { arranging: on, add: ed, capId: c.id });
    /* splitOrPane() drops the rail below railWorthIt()'s threshold, which is
       right for reading and wrong while a plan is being authored: with one
       project there would be nowhere to press Add. */
    var pane = projPlanBody(sel, fk);
    return capBand(c) + '<div class="capbody">' +
      ((ed || on)
        ? '<div class="split">' + rail + '<div class="pane">' + pane + '</div></div>'
        : splitOrPane(c.projects, sel, rail, pane)) + '</div>';
  }).join("");
}

/* ── Capability \u2192 Reporting ─────────────────────────────────────────
   The unit's reporting page with projects where pillars are. Same bar, same
   tally, same entry box stating its unit, same dimming for anything outside
   the cycle. */
function capEntryBox(x, unit, may, label){
  var cur = x.actual, has = cur != null && cur !== "";
  var shown = !has ? "" : (unit === "%" ? String(cur) : (splitTarget(String(cur)).value || String(cur)));
  if (!may) return '<span class="mono">' + (has ? esc(String(cur)) : "\u2014") + '</span>';
  return '<span class="entry' + (has ? " filled" : "") + '">' +
    '<input class="field" data-crep="' + x.id + '" data-unit="' + esc(unit) + '" value="' + esc(shown) +
    '" placeholder="\u2014" aria-label="Report ' + esc(label) + '">' +
    (unit ? '<span class="unitsuf">' + esc(unit) + '</span>' : '') + '</span>';
}
/* THE PER-CENT AN IN-PROGRESS ROW REQUIRES (§101). Its own field rather than
   capEntryBox's, because that one writes `actual` -- the outcome's figure --
   and this writes `pct`. One box, two meanings, would be exactly the fault
   this whole section removed from the tables. */
function capPctBox(x, may, label){
  var has = x.pct != null && x.pct !== "";
  if (!may) return '<span class="mono">' + (has ? esc(String(x.pct)) + "%" : "\u2014") + '</span>';
  return '<span class="entry' + (has ? " filled" : "") + '">' +
    '<input class="field" data-cpct="' + x.id + '" value="' + esc(has ? String(x.pct) : "") +
    '" placeholder="\u2014" aria-label="Per cent complete for ' + esc(label) + '">' +
    '<span class="unitsuf">%</span></span>';
}
function capNoteBox(x, may){
  return may
    ? '<input class="fld notefld" data-cnote="' + x.id + '" value="' + esc(x.note || "") +
      '" placeholder="Note, if there is one">'
    : (x.note ? '<span class="why" style="margin:0">' + esc(x.note) + '</span>' : '');
}
function capPickBox(x, may, opts, val){
  if (!may) return '<span class="mono">' + (val ? esc(val) : "\u2014") + '</span>';
  return '<select class="fld selbox" data-cpick="' + x.id + '">' +
    opts.map(function(o){
      return '<option value="' + esc(o[0]) + '"' + (o[0] === (val || "") ? " selected" : "") + '>' +
        esc(o[1]) + '</option>';
    }).join("") + '</select>';
}

function projReportBody(p, may, fk){
  var r = projReported(p);
  /* THE PANE SOMEBODY FILLS IN UNDER TIME PRESSURE, and the widest table in
     the product at eight columns -- the honest cost of one row shape carrying
     Type, Due date, Target, Status, % and Note (§101).

     A deliverable PICKS a status and the per-cent follows: 100 for Delivered,
     0 for Not started, a box only for In progress, which is the whole of "in
     progress requires a % of completion". An outcome TYPES a figure and its
     per-cent is computed against the target -- shown, never typed.

     A ROW NOT DUE THIS CYCLE IS NOT ASKED, and says so rather than sitting
     there as an empty box somebody forgot -- but THE CONTROL IS STILL THERE,
     because anyone who wants to report early may (§101.8). That sentence was
     written here first and the code under it did the opposite for a version:
     it replaced the picker with the word, so the one act the sentence
     promised was the one act the pane refused. The word now sits where the
     READING would be, and steps aside the moment there is one. */
  var dxr = dxRows(p).map(function(row, i){
    var o = row.obj, d = dxIsDeliv(row), when = dxWhen(row);
    var notDue = d ? !dueThisCycle(when) : !outcomeDue(o);
    var has = reportedAny(o, d), quiet = notDue && !has;
    var ent, pcell;
    if (d) {
      ent = capPickBox(o, may, DX_WORDS, o.status);
      pcell = o.status === "wip" ? capPctBox(o, may, o.name)
        : (has ? '<b>' + statusReads(o) + '%</b>'
               : (notDue ? notDueCell() : '<b>&mdash;</b>'));
    } else {
      ent = capEntryBox(o, splitTarget(String(o.target)).unit, may, o.name);
      pcell = has ? '<span class="fixedval">' + (o.progress == null ? "&mdash;" : o.progress + "%") + '</span>'
                  : (notDue ? notDueCell() : '<span class="fixedval">&mdash;</span>');
    }
    var done = d ? statusReads(o) === 100 : (o.actual != null && o.actual !== "");
    return '<tr' + (quiet ? ' class="notdue"' : '') + '><td class="idx">' + (i+1) + '</td>' +
      '<td>' + esc(o.name) + lateNote(when, done) + '</td>' +
      '<td class="cc">' + dxType(row) + '</td>' +
      '<td class="num">' + dxTarget(row) + '</td>' +
      '<td class="cc">' + ent + '</td>' +
      '<td class="cc">' + pcell + '</td>' +
      '<td class="notecol">' + capNoteBox(o, may) + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    var notDue = !dueThisCycle(m.finish), quiet = notDue && !m.status;
    return '<tr' + (quiet ? ' class="notdue"' : '') + '><td class="idx">' + (i+1) + '</td>' +
      '<td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + dxDate(m.finish, m.status === "done") + '</td>' +
      '<td class="cc">' + capPickBox(m, may, MS_WORDS, m.status) + '</td>' +
      '<td class="cc">' + (m.status === "wip" ? capPctBox(m, may, m.name)
        : (m.status ? '<b>' + msReads(m) + '%</b>'
                    : (notDue ? notDueCell() : '<b>&mdash;</b>'))) + '</td>' +
      '<td class="notecol">' + capNoteBox(m, may) + '</td></tr>';
  }).join("");
  return pillarBand(projCode(fk, p), p.name,
      '<span class="pill ' + (r.done >= r.total ? "good" : "attn") + '">' + r.done + ' / ' + r.total + '</span>') +
    '<h4 class="mini">' + DX_HEADING + '</h4>' +
    miniTable(["#","Deliverables &amp; outcomes","Type","Target","Status","%","Note"], dxr) +
    '<h4 class="mini">Milestones</h4>' +
    miniTable(["#","Milestone","Due date","Status","%","Note"], mRows);
}

function capReportBody(c){
  /* Same two gates as a unit's reporting: the cycle has to be open AND
     unlocked, or the server refuses the figures the page is inviting. */
  /* inOffice(), not hasRole("super") — the TENTH place meaning "the office"
     (§89, found in §94). A unit's Reporting page has asked it this way since
     §89; a function's had not, so an SMO team member could report past a
     locked cycle on one side of the navigation switch and not the other
     (§53.5). The server was on `super` for both and refused either way. */
  var may = REVIEW.state === "open" && !(CYCLE.locked && !inOffice()) &&
            grant("k_report") === "edit";
  var kRows = c.keyObjectives.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + esc(m.dir) + '</td>' +
      '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
      '<td class="cc">' + capEntryBox(m, splitTarget(String(m.target)).unit, may, m.name) + '</td>' +
      '<td class="notecol">' + capNoteBox(m, may) + '</td></tr>';
  }).join("");
  var sel = railPick(c);
  var koBlock = c.keyObjectives.length
    ? '<h4 class="mini">Key objectives</h4>' +
      miniTable(["#","Objective","Dir.","Target","Reported","Note"], kRows)
    : '';
  if (!sel) return koBlock + '<div class="note">No projects to report on.</div>';
  var rail = railFor(c.projects, sel,
    function(p){ var r = projReported(p);
      return '<span class="rtally' + (r.total && r.done >= r.total ? " full" : "") + '">' +
        r.done + '/' + r.total + '</span>'; },
    function(p){ var r = projReported(p);
      return r.total === 0 ? 'Not asked this cycle'
        : (r.done >= r.total ? 'Complete' : (r.total - r.done) + ' still to enter'); },
    null, 'Tally is entries given of asked',
    function(p){ return projCode(c.fn, p); });
  return koBlock +
    splitOrPane(c.projects, sel, rail, projReportBody(sel, may, c.fn));
}

function renderFnReport(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  if (fnPlansInPillars(FUNCTIONS[fk])) return renderReport(fnAsUnit(fk));
  if (!caps.length) return fnNothingBehind(fk);
  if (REVIEW.state !== "open") {
    return '<div class="note"><b>' + esc(REVIEW.name) + ' is closed.</b> ' +
      'Its figures are a record now.</div>';
  }
  var done = 0, total = 0;
  caps.forEach(function(c){ var r = capReported(c); done += r.done; total += r.total; });
  var pctDone = total ? Math.round(done / total * 100) : 0;
  var bar = '<div class="rep-bar">' +
      '<div class="kpi"><b>' + done + '</b><span>of ' + total + ' reported</span></div>' +
      '<div class="repbar' + (pctDone < 100 ? " part" : "") + '"><i style="width:' + pctDone + '%"></i></div>' +
      '<span class="why" style="margin:0">' + esc(REVIEW.name) + ' &middot; due ' + esc(REVIEW.due) + '</span>' +
      draftBtns() +
    '</div>';
  return bar + caps.map(function(c){
    return capBand(c) + '<div class="capbody">' + capReportBody(c) + '</div>';
  }).join("");
}

/* ── UNIT · Strategy ─────────────────────────────────────────────────
   The plan and the reading of the plan stop sharing a page. Performance
   answers how it is going; Strategy carries what was agreed, with no reported
   figure anywhere on it \u2014 the same separation the group's Temple already
   makes, and the same one a capability makes between Projects and Performance.

   The rail is here for the same reason it is on a capability: a unit's items
   are a list worked through one at a time, and Mobile's fourth item sits two
   screens below its first in an accordion. Unlike a capability's projects,
   they group by kind \u2014 a Direction and a Capability are different things and
   the rail says so. */
function unitRailKey(u){ return "unit:" + u.ukey; }
function unitRailPick(u){
  var want = RAIL[unitRailKey(u)], list = u.items || [];
  if (!list.length) return null;
  for (var i = 0; i < list.length; i++) if (list[i].code === want) return list[i];
  return list[0];
}
function unitRailFor(u, sel){
  /* The rail does not group by Direction and Capability. It did in the first
     drawing; the distinction is on the item itself and splitting the rail on it
     bought nothing at this size. Kept in the backlog rather than the code. */
  var list = u.items;
  /* ORDER IS DECIDED ON THE PLAN (§63.3). It is part of what was agreed, not
     part of how it is going — and Progress and Performance need nothing to
     follow it, because the order IS the array. */
  var on = arranging("unit", u.ukey);
  var rows = list.map(function(it, i){
    /* THE CODE SHOWN IS DERIVED; THE CODE STORED IS AN IDENTIFIER, and they
       are not the same thing (found 2026-08-22, §46.3). `it.code` is what the
       plan arrived with — "01" for Mobile, because its pillars predate the
       minting rule — while every other surface in the platform derives
       `codePrefix + position` and shows "MB01". Putting the code back on the
       Plan page made the two visible side by side: one tab of a unit called a
       pillar 01 and the next called it MB01.

       So the DISPLAY moves to pillarCode() and the data attribute does NOT:
       `data-urail` is the rail's selection key and unitRailPick() matches on
       `it.code`. Change that and the rail stops being able to find the pillar
       it just selected. */
    return '<button class="ritem' + (it.code === sel.code ? " on" : "") + '" data-urail="' +
        esc(u.ukey) + '|' + esc(it.code) + '" data-oi="' + i + '">' +
        (on ? handle("Reorder " + it.name) : '') +
        railName(pillarCode(u, i), it.name) +
        /* Both counts, both labelled, on one line. It used to put the tactics
           count in the small line and the MEASURES count as a bare number on
           the right - two numbers, one of them unlabelled, and nothing saying
           which was which. The bare number went with the footer that tried to
           explain it (§29.6). */
        railSub(plural(it.measures.length, "measure") +
          ' &middot; ' + plural(it.tactics.length, "tactic") +
          (it.owner ? ' &middot; ' + esc(it.owner) : '')) +
      '</button>';
  }).join("");
  /* No footer. It said "Figure shown is key measures", explaining a number
     that no longer exists - and on the PLAN page there is no figure to explain
     in the first place: nothing here has been reported. */
  return '<div class="rail' + (on ? ' arranging' : '') + '">' +
    railHead(L("pillar","bu"), list.length) +
    '<div class="sortable" data-item=".ritem" data-kind="pillars" data-u="' +
      esc(u.ukey) + '">' + rows + '</div>' +
    /* ADD, in the rail that holds them (§69.13). The same place the projects
       rail puts it, because a unit and a function are the same product
       (§53.5) and the two rails drifting is what that rule exists to stop. */
    (EDIT_PAGE.plan && mayEditPlan()
      ? '<div class="railadd"><button class="linkbu" data-rowadd="pillar|' +
        esc(u.ukey) + '">+ Add a ' + L("pillar","bu").toLowerCase().replace(/s$/, "") +
        '</button></div>'
      : '') + '</div>';
}
/* THE PLAN IS EDITABLE, FOR THE SMO ONLY.

   A plan is authored by upload (§22) and that has not changed: the template,
   the minting of codes and the archive-on-replace are all still how a plan
   ARRIVES. What this adds is the correction afterwards - a target typed wrong,
   an owner who moved - without making the SMO re-upload a whole unit to fix a
   word.

   SMO only, deliberately, and not merely by access key. c_units-style "edit"
   on u_plan is held by unit heads too, and a plan being correctable by the
   person measured against it is a different decision from a plan being
   correctable by its custodian. When per-action authorisation and the change
   log arrive (§19.2) this is the first thing to revisit. */
/* mayEditPlan() moved to config-data.js in 3.10, beside the other two rules
   that are rules rather than settings. One definition, not two. */
/* THE PANE NO LONGER REPEATS THE RAIL (Islam, 2026-08-22: "do we need this
   part since the information is already on the card on the rail?").

   He is right, and the rail card is the proof: it already carries the code,
   the name, the counts and the owner, and it sits four inches to the left of a
   heading saying the same three things. So where there IS a rail the pane
   opens straight onto the plan.

   Two exceptions, both of them the same rule — a pane with nothing naming it
   is only acceptable while something else names it:

   1. A unit with ONE pillar has no rail (see renderUnitPlan), so the heading
      is the only thing on the page that says which pillar this is. It stays.
   2. EDITING needs it back whatever the rail says: the pillar's NAME is typed
      in that heading and its theme and owner are read from the line under it.
      Take the block away in edit mode and the name becomes uneditable.

   Which leaves the pen. It used to appear on hover of the heading, and a
   heading that is gone cannot be hovered, so in the read case it becomes a
   small action of its own — still the SMO's alone (§31). */
/* THE PILLAR NAME COMES BACK, AS THE RAIL'S OWN MARK (§46.3, treatment B3).
   Islam, having seen it removed: "we will need the title of the pillar here
   you were right. we need to bring it back but with a better condensed design
   … would be better if the line is highlighted maybe grey."

   The rail says which pillar is SELECTED, but by the time you have scrolled to
   the tactics table the rail is off-screen and nothing on the page says what
   you are reading. So it returns — at 33px rather than 57, and wearing
   something it did not have to invent: `--surface-2` with a 3px gold left
   edge is, to the pixel, what `.rail .ritem.on` already puts on the row you
   picked. THE TWO HALVES OF THE SCREEN SAY "THIS ONE" THE SAME WAY.

   No border, deliberately — a bordered box inside a bordered pane reads as a
   control, and this is a label. Theme and owner stay gone: the rail card
   carries the owner, and the theme is a Strategy question. */
function pillarBand(code, name, right){
  return '<div class="pband"><span class="pband-code">' + esc(code) + '</span>' +
    '<span class="pband-name">' + esc(name) + '</span>' +
    (right ? '<span class="pband-r">' + right + '</span>' : '') + '</div>';
}
function unitPlanBody(it, u, railed){
  var ed = EDIT_PAGE.plan && mayEditPlan();
  var showHead = !railed || ed;
  var code = pillarCode(u, u.items.indexOf(it));
  var cell = function(v, setter, cls){
    return ed ? inputOr("plan", v == null ? "" : v, cls || "", setter)
              : (v ? esc(v) : '<span class="missing">Missing</span>');
  };
  var on = arranging("unit", u.ukey);
  var pi = u.items.indexOf(it);
  /* The tbody carries the pillar it belongs to. On Performance the shell found
     it by walking up to `.pbody` and reading the accordion row above; the plan
     has no accordion, and a second way of answering the same question is how
     the two come to disagree (§63.3). */
  var sortAttr = function(kind){
    return on ? ' class="sortable" data-item="tr" data-kind="' + kind +
      '" data-u="' + esc(u.ukey) + '" data-pi="' + pi + '"' : '';
  };
  /* The add row goes INSIDE the tbody the sortable owns, which is why it is
     not draggable: `data-item="tr"` would pick it up as an item and it would
     be reorderable into the middle of the list it appends to. `.newrow` has no
     handle, and makeSortable() binds to handles only (arrange.js), so it sits
     in the tbody and stays put. */
  var addRow = function(cols, what, label){
    if (!ed) return "";
    return '<tr class="newrow"><td class="idx">+</td><td colspan="' + cols + '">' +
      '<button class="linkbu" data-rowadd="' + what + '|' + esc(u.ukey) + '|' + pi +
      '">' + label + '</button></td></tr>';
  };
  /* Removing one, by ID rather than by index (§48.2). It rides in the name
     cell rather than in a column of its own: a column costs every row its
     width, and the × is only there while the pen is on. */
  var xb = function(list, id){
    return ed ? '<button class="xbtn" data-rowoff="' + esc(list) + '|' + esc(id) +
      '" title="Remove this row" aria-label="Remove this row">&times;</button>' : '';
  };
  var mRows = it.measures.map(function(m, i){
    return '<tr data-oi="' + i + '"><td class="idx">' +
      (on ? handle("Reorder " + m.name) : '') +
      '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? inputOr("plan", m.name, "", function(v){ m.name = v; }) : esc(m.name)) +
        xb("measures", m.id) + '</td>' +
      '<td class="cc">' + esc(m.dir) + '</td>' +
      '<td class="num">' + cell(m.target, function(v){ m.target = v; }, "mono") + '</td>' +
      /* NO 3-YEAR COLUMN. Islam, 2026-08-22: "in the direction plans the key
         measures are for 1 year only". A pillar's key measures carry one
         target and it is this year's; the three-year horizon belongs to the
         unit's KEY OBJECTIVES, which are a different table on a different page
         and keep theirs. `target3y` is still stored and still travels through
         import, export and the archive — this removes a column, not a field,
         so nothing a plan already carries is lost. */
      '<td class="cc">' + esc(m.compile || "\u2014") + '</td></tr>';
  }).join("");
  var tRows = it.tactics.map(function(t, i){
    return '<tr data-oi="' + i + '"><td class="idx">' +
      (on ? handle("Reorder " + t.name) : '') +
      '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? inputOr("plan", t.name, "", function(v){ t.name = v; }) : esc(t.name)) +
        xb("tactics", t.id) + '</td>' +
      '<td>' + (ed ? inputOr("plan", t.owner || "", "", function(v){ t.owner = v; }) : esc(t.owner)) + '</td>' +
      /* THE ONE PLACE COLLABORATORS CAN BE TYPED (§50.2). Before this they
         could only arrive with the upload, so a name that changed after the
         plan landed meant re-uploading the unit to fix it. It sits under the
         SAME pen that corrects the rest of the plan, and behind the same gate
         (§31): who is named on a tactic decides who may report it, so it is
         not a field the people being measured hold. */
      '<td class="collabs">' + (ed
        ? inputOr("plan", collabText(t), "", function(v){ t.collaborators = collabParse(v); })
        : collabCell(t)) + '</td>' +
      '<td>' + qs(t) + '</td></tr>';
  }).join("");
  var meta = pillarMeta(it);
  var head = showHead
    ? '<div class="ptitle hoverpen"><div><h3>' + code + '&nbsp; ' +
        (ed ? inputOr("plan", it.name, "", function(v){ it.name = v; }) : esc(it.name)) + '</h3>' +
        (meta ? '<div class="pmeta">' + meta + '</div>' : '') + '</div>' +
        kindPill(it) +
        (mayEditPlan() ? penBtn("plan", "u_plan") : '') + '</div>'
    : pillarBand(code, it.name) +
      (mayEditPlan() ? '<div class="paneact">' + penBtn("plan", "u_plan") + '</div>' : '');
  return head +
    /* NO NOTE UNDER THE PILLAR (Islam, 2026-08-22: "there is a statement under
       the title of the direction in the mobile, generally standardize the view
       there is no notes under the pillars"). Mobile's first pillar carried
       "End-state: unified market intelligence engine" and the other nine units
       carried nothing, so the line was not a feature of the page — it was one
       unit's plan having a field the rest left empty, and a layout that shifts
       depending on which pillar you picked.

       IT IS STILL EDITABLE while the plan is being corrected, because the
       field is real data that arrived with the upload and a page that cannot
       show it also cannot fix it. Read-only, it is gone. */
    (ed
      ? '<p class="sub" style="margin:10px 0 0">' +
        inputOr("plan", it.sub || "", "", function(v){ it.sub = v; }) + '</p>'
      : '') +
    /* The "Plan only" notice went in 3.4. The tab you are on says Plan, the
       table headings say "as planned", and every actual column reads em-dash -
       three statements of the same thing above a fourth. */
    '<h4 class="mini">Key measures <em>\u2014 as planned: this year\u2019s target, and how it compiles</em></h4>' +
    miniTable(["#","Measure","Dir.","Target","Compiled"],
      mRows + addRow(5, "measure", "Add a measure"), sortAttr("measures")) +
    '<h4 class="mini">Tactics <em>\u2014 who carries it, who supports, and in which quarters</em></h4>' +
    miniTable(["#","Tactic","Owner","Collabs.","Quarters"],
      tRows + addRow(4, "tactic", "Add a tactic"), sortAttr("tactics"));
}
function renderUnitPlan(u){
  var sel = unitRailPick(u);
  /* AN EMPTY PAGE HAS TO SAY WHAT WOULD FILL IT (§61). This said "This unit"
     on a supporting function's own page — and only ever appeared there,
     because before §61 a function with no plan was missing from the navigation
     and there was no way to reach the sentence. */
  if (!sel) return '<div class="note">' + esc(u.name) + ' has no ' +
    L("pillar", "bu").toLowerCase() + ' yet, so there is no plan to show. ' +
    'A plan arrives as a file: <b>Setup \u2192 Import</b>, the pillars template.</div>';
  /* Key objectives are NOT repeated here. They are authored on Foundation and
     read on Performance \u2014 one place to author, one place to read. Showing them
     again above the rail was duplication, and a duplicated table is a table
     that will one day disagree with itself. */
  /* Neither the unit's name nor a note about the page. The navigation row
     highlights the unit and the tab row says Plan, so both were restating
     where you already knew you were - the same redundancy the chrome shed in
     2.9 - and the PILLARS heading below them repeated the rail's own header
     word for word. The page opens straight onto the rail and the pillar. */
  /* ── THE ARRANGE BUTTON IS GONE FROM HERE (§94.15) ───────────────
     Islam: "remove the arrange button from the units and functions as it's
     already embedded in the edit button — when I press the pencil I can
     arrange, so the button is not needed."

     IT IS §94.3 CATCHING UP WITH ITSELF. §63.3 kept an explicit button for a
     precise reason: "a BU head has no pen — mayEditPlan() is the SMO's — and
     could arrange before this, so they keep an explicit button; tying the
     handles to the pen alone would have taken reordering away from the people
     who use it most, silently." §94.3 then closed reordering to the office,
     which is the only group of people who DO have the pen — so the sentence
     that justified the button had stopped being true, and what was left was a
     second control doing what the pen beside it already does.

     A CONTROL WITH NO AUDIENCE OF ITS OWN IS NOT A CHOICE, IT IS A DUPLICATE.
     It also had to be hidden while the pen was on (a button reading "Done" for
     a mode it did not start lies about what pressing it will do), so the two
     were already an either/or dressed as two things.

     THE GROUP KEEPS ITS OWN, and that is not an inconsistency: the group's
     Performance page has no pen at all, so `arrangeBtn("group")` is the only
     way to reorder units, themes and capabilities. The button is redundant
     exactly where a pen sits beside it.

     `return` STAYS ON THE SAME LINE AS ITS EXPRESSION. Deleting the leading
     `arr +` left it alone on a line, and automatic semicolon insertion ends
     the statement there — the function returns undefined and every line below
     becomes dead code. This file already carries that scar on
     renderGroupFoundation(), which rendered the literal word "undefined" for
     versions; the note is here so the next deletion of a leading term does not
     re-earn it. */
  return (arranging("unit", u.ukey)
      ? '<p class="sec-hint">' + u.items.length + ' ' + L("pillar","bu").toLowerCase() +
        ' &middot; drag by the handle to reorder, here and inside each ' +
        L("pillar","bu").toLowerCase().replace(/s$/, "") + '</p>' : '') +
    (u.items.length >= 2
      ? '<div class="split">' + unitRailFor(u, sel) + '<div class="pane">' + unitPlanBody(sel, u, true) + '</div></div>'
      : '<div class="pane">' + unitPlanBody(sel, u, false) + '</div>');
}


/* ── Capability \u2192 Strategy \u2192 Foundation ────────────────────────────
   A capability has no clauses, no aspiration and no SWOT \u2014 its foundation is
   the group's. What it does have is a definition and, where it has any, its key
   objectives. Same two-card grid a unit's Foundation uses, so the two read as
   the same page with different content.

   The third column is WEIGHT rather than a three-year target: a capability's
   objectives carry the optional weighting and have never had a horizon. */
function renderFnFoundation(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  /* A pillars function has no capabilities to describe, and no foundation of
     its own yet — it belongs to whatever it sits under. Said plainly rather
     than drawn as an empty card: an empty labelled block asserts that
     something is missing when the plan simply does not work that way (§15.1). */
  if (fnPlansInPillars(FUNCTIONS[fk])) {
    var f = FUNCTIONS[fk], parent = f.under ? UNITS[f.under] : null;
    return '<div class="note"><b>' + esc(f.name) + ' plans in ' +
      L("pillar","bu").toLowerCase() + '.</b> Its foundation is ' +
      (parent ? esc(parent.name) + '\u2019s' : 'the group\u2019s') +
      ' \u2014 the aspiration, the SWOT and the key objectives are set there, and ' +
      'what is planned here is the work under them. Open <b>Plan</b> to see it.</div>';
  }
  return editBar("capfoundation", "k_found") + caps.map(function(c){
    var f = functionOf(c.fn);
    var koBlock = c.keyObjectives.length
      ? '<div class="ohead"><span>Objective</span><span>This year</span><span>Weight</span></div>' +
        c.keyObjectives.map(function(m){
          return '<div class="orow"><span class="on">' + esc(m.name) + '</span>' +
            '<span class="ot">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</span>' +
            '<span class="ot h">' + (m.weight == null ? "&mdash;" : m.weight + "%") + '</span></div>';
        }).join("")
      : '<p class="sub" style="margin:0">None. This capability is judged by its projects.</p>';
    return capBand(c) + '<div class="capbody"><div class="fgrid">' +
      '<div class="card"><h2 class="sec first">What it is</h2><dl style="margin:0">' +
        '<div class="clause"><dt>Capability</dt><dd>' + esc(c.name) + '</dd></div>' +
        '<div class="clause"><dt>Carried by</dt><dd>' +
          esc(f ? f.name : "\u2014") +
          (f && f.head ? " \u2014 " + esc(personName(f.head)) : "") + '</dd></div>' +
        '<div class="clause"><dt>Definition</dt><dd>' +
          fieldOr(authoring("capfoundation", "k_found") ? "capfoundation" : null,
                  c.def, "", function(v){ c.def = v; }) + '</dd></div>' +
      '</dl></div>' +
      '<div class="card"><div class="cardhead"><h2 class="sec first">' + L("keyobj","bu") + '</h2>' +
        '<span class="pill horizon">Horizon &middot; ' + horizonLabel() + '</span></div>' +
        koBlock + '</div>' +
    '</div></div>';
  }).join("");
}


/* ── The rail on a unit's Performance ────────────────────────────────
   The pillar accordion becomes the rail, for the reason the rail exists: a
   unit's items are worked through one at a time, and Mobile's fourth sits two
   screens below its first when every body is stacked.

   Reordering comes WITH it. The handle moves into the rail row, which is a
   better drag target than a wide table row ever was \u2014 a vertical list of four
   is exactly what pointer reordering was written for. The whole-row click still
   selects rather than drags, which is why the handle is separate. */
function unitPerfRail(u){
  var sel = unitRailPick(u);
  if (!sel) return '<div class="note">This unit has no ' + L("pillar","bu").toLowerCase() + ' yet.</div>';
  var on = arranging("unit", u.ukey);
  var rows = u.items.map(function(it, i){
    var perf = pillarPerf(it), r = pillarRatio(it);
    return '<button class="ritem' + (it.code === sel.code ? " on" : "") + '" data-urail="' +
      esc(u.ukey) + '|' + esc(it.code) + '" data-oi="' + i + '">' +
      (on ? handle("Reorder " + it.name) : '') +
      railName(pillarCode(u, i), it.name) +
      '<span class="rnum" style="color:var(--' + band(perf) + ');font-weight:700">' + pct(perf) + '</span>' +
      railSub((SHOW_KIND ? esc(it.kind) + ' &middot; ' : '') +
        'execution ' + pct(r) + (it.owner ? ' &middot; ' + esc(it.owner) : '')) +
      '</button>';
  }).join("");
  var rail = '<div class="rail' + (on ? ' arranging' : '') + '">' +
    railHead(L("pillar","bu"), u.items.length) +
    /* `.ritem`, NOT `.prow-wrap` (§63.5). The rail's four grips rendered and
       were bound to NOTHING: the shell chose the item selector from `data-kind`
       and "pillars" meant the accordion's `.prow-wrap`, which does not exist
       inside a rail — so `g.closest(sel)` returned null and every drag
       returned before it started. Measured, not reasoned: 4 grips, 0 bound, 0
       items. A handle that renders is a feature that looks built (§51.11). The
       CONTAINER says what it holds now, so the two cannot disagree. */
    '<div class="sortable" data-item=".ritem" data-kind="pillars" data-u="' + u.ukey + '">' + rows + '</div>' +
    '<div class="rfoot">' + pct(unitPillars(u)) + ' across ' + u.items.length + ' &middot; execution ' +
      pct(unitRatio(u)) + '</div></div>';
  return u.items.length >= 2
    ? '<div class="split">' + rail + '<div class="pane">' + unitPerfPane(sel, u, true) + '</div></div>'
    : '<div class="pane">' + unitPerfPane(sel, u, false) + '</div>';
}
/* Same removal as the plan pane, and here the duplication was worse: the rail
   row states the name, the score AND the execution figure, and scorePair
   below states both scores again at the size they deserve. The heading was the
   third telling. Nothing on this page is edited in it, so unlike the plan
   there is no edit case to keep it for — only the no-rail one. */
function unitPerfPane(it, u, railed){
  var scored = scorableMeasures(it).map(function(m){ return m.progress; });
  var uk = u && u.ukey;
  var meta = pillarMeta(it);
  /* The same band as the Plan page, for the same reason and by the same
     argument: scrolled down to the tactics table, the rail is gone. It is the
     scorePair below that made the OLD header redundant — a 19px name, a meta
     line and a score pill above two scores stated again at the size they
     deserve — not the fact of naming the pillar at all. */
  return (railed ? pillarBand(pillarCode(u, u.items.indexOf(it)), it.name) :
    '<div class="ptitle"><div><h3>' + esc(it.name) + '</h3>' +
      (meta ? '<div class="pmeta">' + meta + '</div>' : '') + '</div>' +
      '<span class="pill ' + band(pillarPerf(it)) + '">' + pct(pillarPerf(it)) + '</span></div>') +
    scorePair(pillarPerf(it), pillarExec(it), pillarPlan(it),
              it.measures.length, scored.length,
              scored.length ? Math.max.apply(null, scored) : null,
              scored.length ? Math.min.apply(null, scored) : null) +
    '<h5 class="mini">' + L("measure","bu") + '</h5>' +
    '<div class="scroll"><table>' + measureHead() +
      '<tbody class="sortable" data-item="tr" data-kind="measures" data-u="' + uk + '">' +
      measureRows(it.measures, { unit: uk }) + '</tbody></table></div>' +
    '<h5 class="mini">' + L("tactic","bu") + '</h5>' +
    '<div class="scroll"><table>' + tacticHead() +
      '<tbody class="sortable" data-item="tr" data-kind="tactics" data-u="' + uk + '">' +
      tacticRows(it.tactics, uk) + '</tbody></table></div>';
}
