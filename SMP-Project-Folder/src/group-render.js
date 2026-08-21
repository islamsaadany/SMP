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
  var c = d >= 0 ? "var(--good)" : d <= -8 ? "var(--bad)" : "var(--warn)";
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
  var b = band(val);
  var id = modalFor(opts.modalTitle || title.replace(/<[^>]*>/g, ""), opts.modalSub, opts.drill);
  var vs = opts.planned != null ? ' <span class="vs">vs ' + opts.planned + '% planned</span>' : '';
  var mark = opts.planned != null ? '<div class="marker" style="left:' + opts.planned + '%"></div>' : '';
  var body = val == null
    ? '<div class="big nodata">' + (opts.empty || "Not yet measurable") + '</div><div class="track empty"></div>'
    : '<div class="big">' + val + '<small>%</small>' + vs + '</div>' +
      '<div class="track"><div class="fill" style="width:' + val + '%;background:var(--' + b + ')"></div>' + mark + '</div>';
  return '<div class="card' + (opts.primary ? ' primary-card' : '') + '">' +
    '<div class="score-h"><h3>' + title + (opts.primary ? ' <span class="rank">primary</span>' : '') + '</h3>' +
    '<span class="pill ' + b + '">' + (opts.pill || bandWord(val)) + '</span></div>' +
    body + (opts.sub ? '<p class="sub">' + opts.sub + '</p>' : '') +
    '<p class="sub"><button class="linkbu" data-modal="' + id + '">How this is calculated &rarr;</button></p></div>';
}

/* Dark header with the name, then Objectives (2/3, the dial) and Execution
   (1/3, figures). Execution is a RATIO TO PLAN, so one number replaces two the
   reader would otherwise have to subtract. Colour appears exactly twice: the
   dial, and the variance. */
function varColour(d){ return d >= 0 ? "var(--good)" : d <= -8 ? "var(--bad)" : "var(--warn)"; }

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

function miniTable(head, rows){
  return '<div class="scroll"><table><thead><tr>' +
    head.map(function(h){ return '<th>' + h + '</th>'; }).join("") +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
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

/* Tactic, owner and quarters read left; the rest centres. A tactic whose
   quarters have not begun is not behind \u2014 it is not yet due, and scoring it
   would say otherwise. */
function tacticRows(ts, unitKey){
  var on = arranging("unit", unitKey);
  return ts.map(function(t, i){
    var pl = tacticPlanned(t), due = tacticDue(t), r = tacticRatio(t);
    var status = t.status === "Done" ? '<span class="pill good">Done</span>'
                                     : '<span class="pill warn">' + esc(t.status) + '</span>';
    var who = esc(t.owner) + (t.collaborators && t.collaborators.length
      ? '<span class="why" style="margin:2px 0 0">with ' + t.collaborators.map(esc).join(", ") + '</span>' : '');
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
      '<td>' + who + '</td><td>' + qs(t) + '</td><td class="cc">' + status + '</td>' + tail + '</tr>';
  }).join("");
}
function tacticHead(){
  return '<thead><tr><th class="idx">#</th><th>Tactic</th><th>Owner</th><th>Quarters</th>' +
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
      '<tbody class="sortable" data-kind="measures" data-u="' + uk + '">' +
      measureRows(it.measures, { unit: uk }) + '</tbody></table></div>' +
    '<h5 class="mini">' + L("tactic","bu") + '</h5>' +
    '<div class="scroll"><table>' + tacticHead() +
      '<tbody class="sortable" data-kind="tactics" data-u="' + uk + '">' +
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
    '<div class="sortable" data-kind="pillars" data-u="' + u.ukey + '">' +
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
var TIP_PERF = "Performance scores this unit's own Key Objectives \u2014 each actual against its target, averaged. It is NOT a roll-up of its pillars' key measures; those are shown per pillar inside the unit and never aggregate.";
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
        '<b style="color:var(--good)">' + ce.done + '</b> / ' +
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

  var units = keys.map(function(k){
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
                 "%</b> planned &mdash; variance <b>" + varCell(groupExec(), groupPlan()) + "</b>. Read as a share of plan, not of the whole year.",
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
          '<div class="gauges g3 sortable" data-kind="units">' + units + '</div>',
      TIP_PERF, viewToggle("units")) });

  SECS.push({ t: "Group themes", h: section("", "Group themes",
      null,
      arrangeBar("themes", GROUP.themes.length) +
      '<div class="gauges g3 sortable" data-kind="themes">' + themes + '</div>', TIP_THEME) });

  SECS.push({ t: "Group capabilities", h: section("", "Group capabilities",
      null,
      GVIEW.caps === "table"
        ? capsTable()
        : arrangeBar("capabilities", GROUP.capabilities.length) +
          '<div class="gauges g4 sortable" data-kind="caps">' + caps + '</div>',
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
  return
    '<div class="fgrid"><div class="card"><h2 class="sec first">Who we are</h2>' +
      '<dl style="margin:0">' +
      GROUP.clauses.map(function(c){
        return '<div class="clause"><dt>' + esc(c[0]) + '</dt><dd>' +
          fieldOr("foundation", c[1], "", function(v){ c[1] = v; }) + '</dd></div>';
      }).join("") + '</dl></div>' +
      '<div class="fcol">' +
        '<div class="card"><h2 class="sec first">' + L("purpose","group") + '</h2>' +
        '<p class="statement">' + fieldOr("foundation", GROUP.mission, "big-field",
          function(v){ GROUP.mission = v; }) + '</p></div>' +
        aspirationCard(L("aspiration","group"), GROUP.aspiration, GROUP.endInMind, GROUP.keyObjectives, "foundation",
          function(v){ GROUP.aspiration = v; }, function(v){ GROUP.endInMind = v; }, "g_found") +
      '</div>' +
    '</div>' +

    '<div class="card valbox"><h2 class="sec first">' + L("values","group") + '</h2>' +
    '<div class="valgrid">' +
      (GROUP.values || []).map(function(v){
        return '<details class="valcard"><summary>' + esc(v.name) + '</summary>' +
          '<div class="valcard-body">' + fieldOr("foundation", v.def, "",
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
  var exId = modalFor(esc(u.name) + " &mdash; execution performance", "Tactic delivery across the unit's pillars", exDrill);

  return bands('<button class="editbtn" data-present="1" title="Present this unit">Present</button>' +
      arrangeBtn("unit", u.ukey)) +

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
    section("", "", null,
      (canArrange("unit", u.ukey) && ARRANGE
        ? '<p class="sec-hint">' + u.items.length + ' ' + L("pillar","bu").toLowerCase() +
          ' &middot; drag by the handle to reorder</p>' : '') +
      unitPerfRail(u));
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
function editBar(page, acKey){
  if (grant(acKey || "u_found") !== "edit") return '';
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
  if (grant(acKey || "u_found") !== "edit") return '';
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
function fieldOr(page, value, cls, setter){
  if (!EDIT_PAGE[page] || !setter) return '<span class="' + (cls || '') + '">' + esc(value) + '</span>';
  var i = FIELDS.push(setter) - 1;
  return '<textarea class="fld ' + (cls || '') + '" data-fld="' + i + '" rows="2">' + esc(value) + '</textarea>';
}
function inputOr(page, value, cls, setter){
  if (!EDIT_PAGE[page] || !setter) return '<span class="' + (cls || '') + '">' + esc(value) + '</span>';
  var i = FIELDS.push(setter) - 1;
  return '<input class="fld ' + (cls || '') + '" data-fld="' + i + '" value="' + esc(value) + '">';
}

/* Two readings of the same targets. Columns compares them down a line; chips
   read this year as a figure. A toggle rather than a decision, because which
   one is better depends on how many objectives a unit has written. */
function koToggle(){
  return '<span class="minisw" role="group" aria-label="Objectives layout">' +
    '<button data-kov="cols"  aria-pressed="' + (KO_VIEW === "cols")  + '" title="Columns">&#9776;</button>' +
    '<button data-kov="chips" aria-pressed="' + (KO_VIEW === "chips") + '" title="Chips">&#9632;&#9632;</button></span>';
}

function koView(list){
  if (KO_VIEW === "chips") {
    return '<div class="ochips">' + list.map(function(m){
      return '<div class="ochip"><b>' + esc(m.name) + '</b>' +
        '<div class="v">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</div>' +
        '<div class="h">3-year ' + (m.target3y ? esc(m.target3y) : '<span class="missing">Missing</span>') + '</div></div>';
    }).join("") + '</div>';
  }
  return '<div class="ohead"><span>Objective</span><span>3-year</span><span>This year</span></div>' +
    list.map(function(m){
      return '<div class="orow"><span class="on">' + esc(m.name) + '</span>' +
        '<span class="ot h">' + (m.target3y ? esc(m.target3y) : '<span class="missing">Missing</span>') + '</span>' +
        '<span class="ot">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</span></div>';
    }).join("");
}

/* Edit is where the detail lives — direction and compile never appear in the
   view, because reading a foundation is not the same act as authoring one. */
function koEdit(list){
  return '<div class="scroll"><table><thead><tr><th>Objective</th><th class="cc">Dir.</th>' +
    '<th class="cc">3-year</th><th class="cc">This year</th><th class="cc">Compile</th><th></th></tr></thead><tbody>' +
    list.map(function(m){
      return '<tr><td><input class="fld" value="' + esc(m.name) + '"></td>' +
        '<td class="cc"><select class="fld"><option' + (m.dir === "\u2265" ? " selected" : "") + '>\u2265</option>' +
        '<option' + (m.dir === "\u2264" ? " selected" : "") + '>\u2264</option></select></td>' +
        '<td class="cc"><input class="fld mono" value="' + esc(m.target3y || "") + '"></td>' +
        '<td class="cc"><input class="fld mono" value="' + esc(m.target) + '"></td>' +
        '<td class="cc"><select class="fld"><option' + (m.compile === "Sum" ? " selected" : "") + '>Sum</option>' +
        '<option' + (m.compile === "Latest" ? " selected" : "") + '>Latest</option>' +
        '<option' + (m.compile === "Average" ? " selected" : "") + '>Average</option></select></td>' +
        '<td><button class="rmbtn">Remove</button></td></tr>';
    }).join("") + '</tbody></table></div>' +
    '<div class="addrow"><button class="editbtn">+ Add an objective</button></div>';
}

/* Two statements, not one. An earlier reading treated Winning Aspiration and
   End in Mind as the same thing under two labels; the client's own deck carries
   both, saying different things. */
function aspirationCard(label, statement, endInMind, objectives, page, setAsp, setEnd, acKey){
  var editing = EDIT_PAGE[page];
  return '<div class="card hoverpen"><div class="cardhead"><h2 class="sec first">' + label + '</h2>' +
    penBtn(page, acKey) +
      (editing ? '<label class="horizon-f">Horizon ' +
                 inputOr(page, GROUP.horizon, "mono yr", function(v){ GROUP.horizon = v; }) + '</label>'
               : '<span class="pill horizon">Horizon &middot; ' + horizonLabel() + '</span>') +
    '</div>' +
    '<p class="statement">' + fieldOr(page, statement, "big-field", setAsp) + '</p>' +
    /* End in mind is optional. Where a unit does not have one, nothing appears
       \u2014 an empty labelled block asserts that something is missing when the
       plan simply does not work that way. In edit the field is always there,
       so one can be added. */
    (endInMind || editing
      ? '<div class="endin"><span class="boxlab">End in mind</span>' +
        '<p class="statement">' + fieldOr(page, endInMind, "big-field", setEnd) + '</p></div>'
      : '') +
    '<div class="divide"></div>' +
    '<div class="boxhead"><span class="boxlab">' + L("keyobj","bu") + '</span>' +
      (editing ? '' : koToggle()) + '</div>' +
    (editing ? koEdit(objectives) : koView(objectives)) +
  '</div>';
}

function renderUnitFoundation(u){
  return '<div class="fgrid"><div class="card"><h2 class="sec first">Who we are</h2>' +
      '<dl style="margin:0">' +
      u.clauses.map(function(c){
        return '<div class="clause"><dt>' + esc(c[0]) + '</dt><dd>' +
          fieldOr("foundation", c[1], "", function(v){ c[1] = v; }) + '</dd></div>';
      }).join("") + '</dl></div>' +
      aspirationCard(L("aspiration","bu"), u.aspiration, u.endInMind, u.keyObjectives, "foundation",
        function(v){ u.aspiration = v; }, function(v){ u.endInMind = v; }, "u_found") +
    '</div>';
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
          (EDIT_PAGE.analysis
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
        : '<div class="note">Nothing marked in this cycle. Marks are made on each unit\'s own ' +
          'Performance page \u2014 press <b>Mark focus</b> there, then click the diamond beside any ' +
          'objective or key measure.</div>') +
      (unmarked.length
        ? '<div class="note"><b>' + unmarked.length + ' unit' + (unmarked.length > 1 ? 's have' : ' has') +
          ' nothing marked.</b> ' + unmarked.map(esc).join(", ") + '. Marking happens on each unit\'s ' +
          'own page, beside the target and the history that inform the choice.</div>'
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
    if (!may) return '<span class="mono">' + (has ? esc(cur) + (isT ? "%" : "") : "\u2014") + '</span>';
    return '<span class="entry' + (has ? " filled" : "") + '">' +
      '<input class="field" data-rep="' + x.id + '" data-unit="' + esc(unit) + '" value="' + esc(shown) +
      '" placeholder="\u2014" aria-label="Report ' + esc(x.obj.name) + '">' +
      (unit ? '<span class="unitsuf">' + esc(unit) + '</span>' : '') + '</span>';
  };
  var noteCell = function(x){
    var want = needsNote(x);
    return may
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

    return '<div class="ptitle"><div><h3><span class="pcode">' + pillarCode(u, pi) + '</span> ' +
        esc(p.name) + '</h3>' +
        '<div class="pmeta">' + esc(p.kind) + ' &middot; ' + ms.length + ' measures &middot; ' +
        askedT.length + ' tactics asked' +
        (ts.length - askedT.length ? ' &middot; ' + (ts.length - askedT.length) + ' outside this cycle' : '') +
        '</div></div>' +
        tally(done, total) + '</div>' +
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
        '<b>' + pillarCode(u, pi) + '&nbsp; ' + esc(p.name) + '</b>' +
        '<span class="rnum"><span class="rtally' + (t.total && t.done >= t.total ? " full" : "") + '">' +
          t.done + '/' + t.total + '</span></span>' +
        '<span class="rsub">' + sub + '</span></button>';
    }).join("");
    var rail = '<div class="rail"><div class="rhead">' + L("pillar","bu") +
      ' <span>' + u.items.length + '</span></div>' + railRows +
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
      (may
        ? (subd
            ? '<span class="badge b-done">Submitted</span>' +
              '<button class="linkbu" data-unsubmit="' + u.ukey + '">Reopen my report</button>'
            : '<button class="editbtn" data-submit="' + u.ukey + '">Submit to the SMO</button>')
        : '<span class="pill none">View only</span>') +
    '</div>';

  var summary =
    '<h4 class="mini">The owner\'s note on this cycle</h4>' +
    '<div class="card" style="padding:14px 16px">' + (may
      ? '<textarea class="fld" data-unote="' + u.ukey + '" rows="3" style="width:100%;max-width:none" ' +
        'placeholder="What the numbers do not say \u2014 what happened, what is being done, what to expect next.">' +
        esc(REVIEW.note[u.ukey] || "") + '</textarea>'
      : '<span class="why" style="margin:0">' + (REVIEW.note[u.ukey] ? esc(REVIEW.note[u.ukey]) : "None.") + '</span>') +
    '</div>';

  return (miss.length && may
      ? '<div class="note bad-note"><b>' + miss.length + ' figure' + (miss.length > 1 ? 's need' : ' needs') +
        ' a note.</b> Anything at risk or off track carries an explanation before it can be submitted \u2014 ' +
        'a red number with nothing beside it is where a review meeting stalls.</div>'
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

function fnHead(fk){
  var f = FUNCTIONS[fk], caps = capsOfFunction(fk), people = functionPeople(fk);
  return '<div class="caphdr">' +
    '<div><div class="capname">' + esc(f.name) + '</div>' +
      '<div class="why" style="margin:3px 0 0">Supporting function &middot; ' +
        esc(people.map(personName).join(", ")) +
        ' &middot; carries ' + caps.length + ' ' + (caps.length === 1 ? "capability" : "capabilities") +
        ', scored by the group</div></div></div>';
}

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

function railFor(list, sel, numOf, subOf, groupOf, footNote){
  var lastGroup = null;
  var rows = list.map(function(it){
    var g = groupOf ? groupOf(it) : null, head = "";
    if (g && g !== lastGroup) { head = '<div class="rgroup">' + esc(g) + '</div>'; lastGroup = g; }
    return head +
      '<button class="ritem' + (it.id === sel.id ? " on" : "") + '" data-rail="' + esc(it.id) + '">' +
        '<b>' + esc(it.name) + '</b>' +
        '<span class="rnum">' + (numOf ? numOf(it) : "") + '</span>' +
        (subOf ? '<span class="rsub">' + subOf(it) + '</span>' : '') +
      '</button>';
  }).join("");
  return '<div class="rail"><div class="rhead">Projects <span>' + list.length + '</span></div>' +
    rows + (footNote ? '<div class="rfoot">' + footNote + '</div>' : '') + '</div>';
}
function splitOrPane(list, sel, rail, pane){
  return railWorthIt(list)
    ? '<div class="split">' + rail + '<div class="pane">' + pane + '</div></div>'
    : '<div class="pane">' + pane + '</div>';
}

function projMeta(p){
  return (p.timeline === "date" ? esc(p.start) + " &rarr; " + esc(p.end) + " &middot; timeline by date"
                                : esc(p.start) + " &rarr; " + esc(p.end) + " &middot; timeline by quarter");
}
function delivKindPill(d){
  return '<span class="pill kind">' + (d.kind === "pct" ? "% delivered" : "Delivered / not") + '</span>';
}
function delivShown(d){
  var v = delivReads(d);
  if (v == null) return '<span class="pill kind">&mdash;</span>';
  if (d.kind === "pct") return '<span class="pill ' + band(v) + '">' + v + '%</span>';
  return v === 100 ? '<span class="pill good">Delivered</span>' : '<span class="pill warn">Not yet</span>';
}
function msPill(m){
  if (m.status === "done") return '<span class="pill good">Completed</span>';
  if (m.status === "wip") return '<span class="pill attn">In progress</span>';
  return '<span class="pill kind">Not started</span>';
}
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

function projPerformanceBody(p){
  var dRows = p.deliverables.map(function(d, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(d.name) +
      (d.note ? '<span class="why">' + esc(d.note) + '</span>' : '') + '</td>' +
      '<td class="cc">' + delivShown(d) + '</td>' +
      '<td class="num final">' + pct(delivReads(d)) + '</td></tr>';
  }).join("");
  var oRows = p.outcomes.map(function(o, i){
    if (o.progress == null) {
      return '<tr class="notdue"><td class="idx">' + (i+1) + '</td><td>' + esc(o.name) + '</td>' +
        '<td class="num">' + esc(o.target) + '</td>' +
        '<td colspan="2" class="cc"><span class="pill kind">Measured at ' + esc(o.measureAt) + '</span></td></tr>';
    }
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(o.name) +
      (o.note ? '<span class="why">' + esc(o.note) + '</span>' : '') + '</td>' +
      '<td class="num">' + esc(o.target) + '</td>' +
      '<td class="num">' + esc(o.actual) + '</td>' +
      '<td class="num final" style="color:var(--' + band(o.progress) + ')">' + pct(o.progress) + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + esc(m.finish) + '</td>' +
      '<td class="cc">' + msPill(m) + '</td></tr>';
  }).join("");
  var mst = projMilestones(p);
  return '<div class="ptitle"><div><h3>' + esc(p.name) + '</h3>' +
      '<div class="pmeta">' + projMeta(p) + ' &middot; deliverables ' + pct(projDeliverySide(p)) +
      ', outcomes ' + pct(projOutcomeSide(p)) + '</div></div>' +
      '<span class="pill ' + band(projPerf(p)) + '">' + pct(projPerf(p)) + '</span></div>' +
    '<h4 class="mini">Deliverables</h4>' +
    miniTable(["#","Deliverable","Reported","Reads"], dRows) +
    '<h4 class="mini">Outcomes</h4>' +
    miniTable(["#","Outcome","Target","Reported","Reads"], oRows) +
    '<h4 class="mini">Milestones <em>' + mst.done + ' of ' + mst.total + ' completed</em></h4>' +
    miniTable(["#","Milestone","Finish","Progress"], mRows);
}

function renderFnPerformance(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  /* The same Present a unit's Performance page carries (§8.8): available to
     anyone who can view this page, assembling the review from whatever the
     platform holds at that moment. */
  return '<div class="pageact"><button class="editbtn" data-present-fn="' + esc(fk) +
      '" title="Present this function">Present</button></div>' +
    fnHead(fk) + caps.map(function(c){
    var sel = railPick(c);
    if (!sel) return capBand(c) + '<div class="capbody">' + capScoreCards(c) + capKOTable(c) +
      '<div class="note">No projects yet. Nothing to report until there are.</div></div>';
    var rail = railFor(c.projects, sel,
      function(p){ var v = projPerf(p);
        return v == null ? '<span class="rnum">&mdash;</span>'
          : '<b style="color:var(--' + band(v) + ')">' + v + '%</b>'; },
      function(p){ var m = projMilestones(p); return m.done + ' of ' + m.total + ' milestones'; },
      null, 'Figure shown is performance');
    return capBand(c) + '<div class="capbody">' + capScoreCards(c) + capKOTable(c) +
      '<h4 class="mini">Projects</h4>' +
      splitOrPane(c.projects, sel, rail, projPerformanceBody(sel)) + '</div>';
  }).join("");
}

/* ── Capability \u2192 Projects ──────────────────────────────────────────
   The plan as it was formed. Nothing here has been reported: no progress, no
   status, no actuals. Those are entered on Reporting and read on Performance. */
function projPlanBody(p){
  var dRows = p.deliverables.map(function(d, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(d.name) + '</td>' +
      '<td class="cc">' + delivKindPill(d) + '</td>' +
      '<td class="cc">' + esc(d.due || "\u2014") + '</td>' +
      '<td class="cc">' + esc(d.owner || "\u2014") + '</td></tr>';
  }).join("");
  var oRows = p.outcomes.map(function(o, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(o.name) + '</td>' +
      '<td class="cc">' + esc(o.dir) + '</td>' +
      '<td class="num">' + esc(o.target) + '</td>' +
      '<td class="cc">' + esc(o.measureAt || "\u2014") + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td>' + esc(m.covers || "") + '</td>' +
      '<td class="cc">' + esc(m.owner || "\u2014") + '</td>' +
      '<td class="cc">' + esc(m.finish) + '</td></tr>';
  }).join("");
  return '<div class="ptitle"><div><h3>' + esc(p.name) + '</h3>' +
      '<div class="pmeta">' + projMeta(p) + '</div></div>' +
      '<span class="pill kind">' + (p.timeline === "date" ? "By date" : "By quarter") + '</span></div>' +

    '<h4 class="mini">Brief</h4><p class="sub" style="margin:0">' + esc(p.brief) + '</p>' +
    '<h4 class="mini">Stakeholders</h4>' +
    (p.stakeholders || []).map(function(s){ return '<span class="pill kind">' + esc(s) + '</span> '; }).join("") +
    '<h4 class="mini">Deliverables <em>\u2014 what the project hands over</em></h4>' +
    miniTable(["#","Deliverable","Kind","Due","Owner"], dRows) +
    '<h4 class="mini">Outcomes <em>\u2014 always a measure, always with a measurement time</em></h4>' +
    miniTable(["#","Outcome","Dir.","Target","Measured at"], oRows) +
    '<h4 class="mini">Milestones <em>\u2014 the timeline as planned</em></h4>' +
    miniTable(["#","Milestone","What it covers","Owner","Finish"], mRows) +
    overrunNote(p);
}

function renderFnProjects(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  return fnHead(fk) + caps.map(function(c){
    var sel = railPick(c);
    if (!sel) return capBand(c) + '<div class="capbody"><div class="note">' +
      'No projects yet.</div></div>';
    var rail = railFor(c.projects, sel,
      function(p){ return p.deliverables.length; },
      function(p){ return p.outcomes.length + ' outcomes &middot; ' + p.milestones.length + ' milestones'; },
      null, 'Figure shown is deliverables');
    return capBand(c) + '<div class="capbody">' +
      splitOrPane(c.projects, sel, rail, projPlanBody(sel)) + '</div>';
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

function projReportBody(p, may){
  var r = projReported(p);
  var dRows = p.deliverables.map(function(d, i){
    if (!delivDue(d)) {
      return '<tr class="notdue"><td class="idx">' + (i+1) + '</td><td>' + esc(d.name) + '</td>' +
        '<td colspan="3" class="cc"><span class="pill kind">Not asked \u2014 due ' + esc(d.due) + '</span></td></tr>';
    }
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(d.name) + '</td>' +
      '<td class="cc">' + delivKindPill(d) + '</td>' +
      '<td class="cc">' + (d.kind === "pct"
        ? capEntryBox(d, "%", may, d.name)
        : capPickBox(d, may, [["","\u2014"],["yes","Delivered"],["no","Not yet"]], d.actual)) + '</td>' +
      '<td class="notecol">' + capNoteBox(d, may) + '</td></tr>';
  }).join("");
  var oRows = p.outcomes.map(function(o, i){
    if (!outcomeDue(o)) {
      return '<tr class="notdue"><td class="idx">' + (i+1) + '</td><td>' + esc(o.name) + '</td>' +
        '<td class="num">' + esc(o.target) + '</td>' +
        '<td colspan="3" class="cc"><span class="pill kind">Not asked \u2014 measured at ' +
        esc(o.measureAt) + '</span></td></tr>';
    }
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(o.name) + '</td>' +
      '<td class="num">' + esc(o.target) + '</td>' +
      '<td class="cc">' + esc(o.measureAt || "\u2014") + '</td>' +
      '<td class="cc">' + capEntryBox(o, splitTarget(String(o.target)).unit, may, o.name) + '</td>' +
      '<td class="notecol">' + capNoteBox(o, may) + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + esc(m.finish) + '</td>' +
      '<td class="cc">' + capPickBox(m, may,
        [["","\u2014"],["todo","Not started"],["wip","In progress"],["done","Completed"]], m.status) + '</td>' +
      '<td class="notecol">' + capNoteBox(m, may) + '</td></tr>';
  }).join("");
  return '<div class="ptitle"><div><h3>' + esc(p.name) + '</h3>' +
      '<div class="pmeta">' + esc(REVIEW.name) + ' &middot; ' + r.total + ' entries asked, ' +
      r.done + ' given</div></div>' +
      '<span class="pill ' + (r.done >= r.total ? "good" : "attn") + '">' + r.done + ' / ' + r.total + '</span></div>' +
    '<h4 class="mini">Deliverables</h4>' +
    miniTable(["#","Deliverable","Kind","Reported","Note"], dRows) +
    '<h4 class="mini">Outcomes</h4>' +
    miniTable(["#","Outcome","Target","Measured at","Reported","Note"], oRows) +
    '<h4 class="mini">Milestones</h4>' +
    miniTable(["#","Milestone","Finish","Progress","Note"], mRows);
}

function capReportBody(c){
  var may = REVIEW.state === "open" && grant("k_report") === "edit";
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
    null, 'Tally is entries given of asked');
  return koBlock + '<h4 class="mini">Projects</h4>' +
    splitOrPane(c.projects, sel, rail, projReportBody(sel, may));
}

function renderFnReport(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  if (REVIEW.state !== "open") {
    return fnHead(fk) + '<div class="note"><b>' + esc(REVIEW.name) + ' is closed.</b> ' +
      'Its figures are a record now.</div>';
  }
  var done = 0, total = 0;
  caps.forEach(function(c){ var r = capReported(c); done += r.done; total += r.total; });
  var pctDone = total ? Math.round(done / total * 100) : 0;
  var bar = '<div class="rep-bar">' +
      '<div class="kpi"><b>' + done + '</b><span>of ' + total + ' reported</span></div>' +
      '<div class="repbar' + (pctDone < 100 ? " part" : "") + '"><i style="width:' + pctDone + '%"></i></div>' +
      '<span class="why" style="margin:0">' + esc(REVIEW.name) + ' &middot; due ' + esc(REVIEW.due) + '</span>' +
    '</div>';
  return fnHead(fk) + bar + caps.map(function(c){
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
  var rows = list.map(function(it){
    return '<button class="ritem' + (it.code === sel.code ? " on" : "") + '" data-urail="' +
        esc(u.ukey) + '|' + esc(it.code) + '">' +
        '<b>' + esc(it.code) + '&nbsp; ' + esc(it.name) + '</b>' +
        /* Both counts, both labelled, on one line. It used to put the tactics
           count in the small line and the MEASURES count as a bare number on
           the right - two numbers, one of them unlabelled, and nothing saying
           which was which. The bare number went with the footer that tried to
           explain it (§29.6). */
        '<span class="rsub">' + plural(it.measures.length, "measure") +
          ' &middot; ' + plural(it.tactics.length, "tactic") +
          (it.owner ? ' &middot; ' + esc(it.owner) : '') + '</span>' +
      '</button>';
  }).join("");
  /* No footer. It said "Figure shown is key measures", explaining a number
     that no longer exists - and on the PLAN page there is no figure to explain
     in the first place: nothing here has been reported. */
  return '<div class="rail"><div class="rhead">' + L("pillar","bu") +
    ' <span>' + list.length + '</span></div>' + rows + '</div>';
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
function mayEditPlan(){
  return viewer().level === "smo" && grant("u_plan") === "edit";
}
function unitPlanBody(it){
  var ed = EDIT_PAGE.plan && mayEditPlan();
  var cell = function(v, setter, cls){
    return ed ? inputOr("plan", v == null ? "" : v, cls || "", setter)
              : (v ? esc(v) : '<span class="missing">Missing</span>');
  };
  var mRows = it.measures.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      '<td>' + (ed ? inputOr("plan", m.name, "", function(v){ m.name = v; }) : esc(m.name)) + '</td>' +
      '<td class="cc">' + esc(m.dir) + '</td>' +
      '<td class="num">' + cell(m.target, function(v){ m.target = v; }, "mono") + '</td>' +
      '<td class="num">' + (ed ? inputOr("plan", m.target3y || "", "mono", function(v){ m.target3y = v; })
                               : (m.target3y ? esc(m.target3y) : "&mdash;")) + '</td>' +
      '<td class="cc">' + esc(m.compile || "\u2014") + '</td></tr>';
  }).join("");
  var tRows = it.tactics.map(function(t, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      '<td>' + (ed ? inputOr("plan", t.name, "", function(v){ t.name = v; }) : esc(t.name)) + '</td>' +
      '<td>' + (ed ? inputOr("plan", t.owner || "", "", function(v){ t.owner = v; }) : esc(t.owner)) + '</td>' +
      '<td>' + qs(t) + '</td></tr>';
  }).join("");
  var meta = pillarMeta(it);
  return '<div class="ptitle hoverpen"><div><h3>' + esc(it.code) + '&nbsp; ' +
      (ed ? inputOr("plan", it.name, "", function(v){ it.name = v; }) : esc(it.name)) + '</h3>' +
      (meta ? '<div class="pmeta">' + meta + '</div>' : '') + '</div>' +
      kindPill(it) +
      (mayEditPlan() ? penBtn("plan", "u_plan") : '') + '</div>' +
    (it.sub || ed
      ? '<p class="sub" style="margin:10px 0 0">' +
        (ed ? inputOr("plan", it.sub || "", "", function(v){ it.sub = v; }) : esc(it.sub)) + '</p>'
      : '') +
    /* The "Plan only" notice went in 3.4. The tab you are on says Plan, the
       table headings say "as planned", and every actual column reads em-dash -
       three statements of the same thing above a fourth. */
    '<h4 class="mini">Key measures <em>\u2014 as planned: target, horizon, how it compiles</em></h4>' +
    miniTable(["#","Measure","Dir.","Target","3-year","Compiled"], mRows) +
    '<h4 class="mini">Tactics <em>\u2014 who carries it, and in which quarters</em></h4>' +
    miniTable(["#","Tactic","Owner","Quarters"], tRows);
}
function renderUnitPlan(u){
  var sel = unitRailPick(u);
  if (!sel) return '<div class="note">This unit has no ' + L("pillar","bu").toLowerCase() +
    ' yet, so there is no plan to show.</div>';
  /* Key objectives are NOT repeated here. They are authored on Foundation and
     read on Performance \u2014 one place to author, one place to read. Showing them
     again above the rail was duplication, and a duplicated table is a table
     that will one day disagree with itself. */
  /* Neither the unit's name nor a note about the page. The navigation row
     highlights the unit and the tab row says Plan, so both were restating
     where you already knew you were - the same redundancy the chrome shed in
     2.9 - and the PILLARS heading below them repeated the rail's own header
     word for word. The page opens straight onto the rail and the pillar. */
  return (u.items.length >= 2
      ? '<div class="split">' + unitRailFor(u, sel) + '<div class="pane">' + unitPlanBody(sel) + '</div></div>'
      : '<div class="pane">' + unitPlanBody(sel) + '</div>');
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
  return fnHead(fk) + editBar("capfoundation", "k_found") + caps.map(function(c){
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
          fieldOr("capfoundation", c.def, "", function(v){ c.def = v; }) + '</dd></div>' +
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
      '<b>' + pillarCode(u, i) + '&nbsp; ' + esc(it.name) + '</b>' +
      '<span class="rnum" style="color:var(--' + band(perf) + ');font-weight:700">' + pct(perf) + '</span>' +
      '<span class="rsub">' + (SHOW_KIND ? esc(it.kind) + ' &middot; ' : '') +
        'execution ' + pct(r) + (it.owner ? ' &middot; ' + esc(it.owner) : '') +
        '</span></button>';
  }).join("");
  var rail = '<div class="rail' + (on ? ' arranging' : '') + '">' +
    '<div class="rhead">' + L("pillar","bu") + ' <span>' + u.items.length + '</span></div>' +
    '<div class="sortable" data-kind="pillars" data-u="' + u.ukey + '">' + rows + '</div>' +
    '<div class="rfoot">' + pct(unitPillars(u)) + ' across ' + u.items.length + ' &middot; execution ' +
      pct(unitRatio(u)) + '</div></div>';
  return u.items.length >= 2
    ? '<div class="split">' + rail + '<div class="pane">' + unitPerfPane(sel, u) + '</div></div>'
    : '<div class="pane">' + unitPerfPane(sel, u) + '</div>';
}
function unitPerfPane(it, u){
  var scored = scorableMeasures(it).map(function(m){ return m.progress; });
  var uk = u && u.ukey;
  var meta = pillarMeta(it);
  return '<div class="ptitle"><div><h3>' + esc(it.name) + '</h3>' +
      (meta ? '<div class="pmeta">' + meta + '</div>' : '') + '</div>' +
      '<span class="pill ' + band(pillarPerf(it)) + '">' + pct(pillarPerf(it)) + '</span></div>' +
    scorePair(pillarPerf(it), pillarExec(it), pillarPlan(it),
              it.measures.length, scored.length,
              scored.length ? Math.max.apply(null, scored) : null,
              scored.length ? Math.min.apply(null, scored) : null) +
    '<h5 class="mini">' + L("measure","bu") + '</h5>' +
    '<div class="scroll"><table>' + measureHead() +
      '<tbody class="sortable" data-kind="measures" data-u="' + uk + '">' +
      measureRows(it.measures, { unit: uk }) + '</tbody></table></div>' +
    '<h5 class="mini">' + L("tactic","bu") + '</h5>' +
    '<div class="scroll"><table>' + tacticHead() +
      '<tbody class="sortable" data-kind="tactics" data-u="' + uk + '">' +
      tacticRows(it.tactics, uk) + '</tbody></table></div>';
}
