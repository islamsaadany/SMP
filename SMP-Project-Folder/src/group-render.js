/* VOCABULARY, fixed after review:
     Group theme  = One Trade / Deepen Value Chain / Diversification.
                    The group's motto elements; the temple's columns.
     Pillar       = a business unit's direction OR capability. Each carries
                    key measures and tactics, and is tagged with one group theme.
     Performance  = the score from a pillar's KEY MEASURES. Primary.
     Execution    = the score from its TACTICS. Secondary, never blended in. */

/* ── ONE ESCAPER, SAFE IN BOTH CONTEXTS (2026-09-01 security sweep) ──────
   This was a TEXT-NODE escaper (`&` and `<` only) and it is used inside
   double-quoted HTML attributes ~226 times — where a literal " in tenant data
   breaks out of the attribute and, because the CSP allows inline handlers, an
   injected onfocus=/onerror= runs in the reader's browser (an SMO's, with full
   SMO authority). Two call sites had hand-patched .replace(/"/g,"&quot;") on
   top of esc(); those become harmless no-ops now that esc() escapes the quote
   itself. Escaping >, " and ' as well is INERT in a text node — an entity
   renders as the character — so nothing that displays normally changes; only a
   payload is neutralised. Verified: esc()'s output is only ever concatenated
   into innerHTML, never compared, stored as a key, or read back. */
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
/* Four bands. 70 and 50 match the platform's existing STATUS_THRESHOLDS so
   the strategy layer and the functional layer never disagree about a colour;
   85 is the added top edge that splits on-track from needs-attention. */
function band(v){ return bandOf(v).key; }
/* ── A BAND'S COLOUR AS *TYPE*, NOT AS A MARK (§154) ────────────────────
   §38.4's rule, applied where it had never been: "a colour that works as a
   FILL usually fails as TYPE", which is why every scoring colour was given a
   `-tx` twin. Thirty-one places then went on painting TEXT with the fill —
   invisible until §153 measured a hovered control and found the rail's figure
   at 3.26 and a scored per-cent at 4.45 on the quiet ground.

   THE FALLBACK IS LOAD-BEARING: the bands are the tenant's (Setup › Scoring
   bands), so a key without a twin is possible; `var(--x-tx, var(--x))` then
   paints exactly what it paints today rather than nothing. */
function bandInk(v){ var k = band(v); return 'var(--' + k + '-tx, var(--' + k + '))'; }
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
/* ── WHAT A DELIVERY RATIO MEANS, IN WORDS (§156) ─────────────────────────
   Islam, on a card reading 104%: *"it's 104% while the description is saying
   something else."* The line said "Delivered 50% against 48% planned —
   variance +2", which is arithmetically the same fact and asks the reader to
   divide one number by the other to see that it is. The headline is a RATIO;
   what it needs underneath is the plain-English reading of it, and "variance
   +2" is a third number rather than a reading.

   ONE FUNCTION, because the group's card and a company's carried the same
   sentence twice (§53.5) and would otherwise explain the same ratio
   differently. The empty case keeps its own words: reading "0% delivered
   against 0% planned" under "Not yet measurable" is three false precisions in
   a row. */
function deliveryLine(ex, pl, whose){
  if (ex == null || pl == null || !pl)
    return "No tactic " + (whose || "anywhere in the group") +
           " has a plan against it yet, so there is nothing to deliver against.";
  var r = Math.round(ex / pl * 100);
  var verdict = r > 100 ? "ahead of plan" : r < 100 ? "behind plan" : "exactly on plan";
  return "<b>" + ex + "%</b> of the work delivered against <b>" + pl +
         "%</b> planned \u2014 <b>" + verdict + "</b>.";
}

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
  /* A DELTA BELONGS TO ITS NUMBER (§156). It used to be appended to the
     TITLE by the caller, so "▲ 3" sat among the labels — pushing the heading
     onto two lines and standing four words away from the figure it qualifies.
     The unit's own cards have always drawn it inside `.headline`, beside the
     number; this is the group's card catching up rather than a new idea
     (§53.5). */
  var delta = opts.delta || "";
  var body = val == null
    ? '<div class="big nodata">' + (opts.empty || "Not yet measurable") + '</div><div class="track empty"></div>'
    : '<div class="big">' + val + '<small>%</small>' + vs + delta + '</div>' +
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
/* A heading may carry a class as `{h, cls}` — a plain string still means what
   it always did, so every existing caller is untouched. It exists because a
   column that hides on a narrow window has to hide its HEAD with its cells
   (§248), and `:nth-child` would silently point at the wrong column the day
   somebody inserts one. */
function miniTable(head, rows, sort){
  return '<div class="scroll"><table><thead><tr>' +
    head.map(function(h){
      return typeof h === "string" ? '<th>' + h + '</th>'
                                   : '<th class="' + (h.cls || '') + '">' + h.h + '</th>'; }).join("") +
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
  /* A SECOND COPY OF THE BANDS, AND IT WAS ALREADY LYING (§163). This read
     "On track 70+ / At risk 50-69 / Off track under 50" while the bands said
     85 / 70 / 50 — two definitions of the same thing, drifted, on one page.
     §53.5: it is derived from `BANDS.bands` now, like the button, so the
     legend, the button and every score answer to one list. */
  return '<div class="chart-legend">' +
    BANDS.bands.map(function(x, i){
      var rng = i === 0 ? x.floor + "+"
        : i === BANDS.bands.length - 1 ? "under " + BANDS.bands[i-1].floor
        : x.floor + "\u2013" + (BANDS.bands[i-1].floor - 1);
      return '<span><i class="sw" style="background:var(--' + x.key + ')"></i> ' +
        esc(x.label) + ' ' + rng + '</span>';
    }).join("") +
    '<span><i class="sw" style="background:var(--stone-soft)"></i> Execution</span>' +
    '<span><i class="sw line"></i> Planned</span></div>';
}

/* Four flags, not a range — a tactic can run Q2 and Q4 with nothing between,
   and the chips have to be able to show that gap. Quarters already passed are
   marked, so a row says at a glance what is due. */
function qs(t){
  var q = quartersOf(t), out = "";
  for (var i = 0; i < 4; i++) {
    /* §239: ONE ANSWER TO "HOW FAR ARE WE". This read `GROUP.asOfQuarter`
       while the figures beside it read `REVIEW.endsQuarter` -- two fields, one
       meaning, disagreeing on the same row the moment a cycle is not reported
       at its own end. Both now go through the review point. */
    var cls = q[i] ? (quarterPast(i) ? "on past" : "on") : "";
    out += '<i class="' + cls + '">' + (i + 1) + "</i>";
  }
  return '<span class="qs">' + out + "</span>";
}

/* THE QUARTERS, PRESSABLE (§114). The same four marks qs() draws, as
   buttons, behind the pen — §42 classified a tactic's quarter as PLAN on the
   server four versions before the screen could edit one, so this draws the
   control the authoriser has been guarding all along. By id, never index
   (§48.2). */
function qsEdit(t){
  var q = quartersOf(t), out = "";
  for (var i = 0; i < 4; i++) {
    out += '<button class="qtog' + (q[i] ? " on" : "") + '" data-qtog="' +
      esc(t.id) + '|' + (i + 1) + '" title="Quarter ' + (i + 1) +
      (q[i] ? " — planned; press to clear" : " — press to plan") + '">' + (i + 1) + '</button>';
  }
  return '<span class="qs qs-edit">' + out + '</span>';
}
/* The fill grant's quarters (§145): the same four marks, wired to the fill
   handler that stamps the pending mark — drawn only where the tactic names
   NO quarter at all (§128's gap) or while that fill is still pending. */
function qsFill(t){
  var q = quartersOf(t), out = "";
  for (var i = 0; i < 4; i++) {
    out += '<button class="qtog' + (q[i] ? " on" : "") + '" data-qfill="' +
      esc(t.id) + '|' + (i + 1) + '" title="Quarter ' + (i + 1) +
      (q[i] ? " — filled; press to clear" : " — press to fill") + '">' + (i + 1) + '</button>';
  }
  return '<span class="qs qs-edit qs-fill">' + out + '</span>';
}

/* ── WHAT A GLYPH AND A ONE-WORD RULE ACTUALLY MEAN (§149) ───────────────
   Islam, on the audit's two "columns that say nothing": keep the glyphs, and
   say something better than "at least / at most" — *"some descriptive like
   Less is better or more is better"* — and give COMPILED the same treatment,
   *"take last measure, accumulative across the time, average across the
   time"*.

   THE WORDS ARE A DIRECTION OF TRAVEL, NOT A RESTATEMENT. "At least the
   target" says what the glyph already says in longer form; "More is better"
   says which way the number should move, which is the thing somebody reading
   a scorecard actually wants and the one thing the glyph cannot spell.

   ONE PAIR OF MAPS, READ BY EVERY SURFACE. Eight read-mode cells across the
   unit, group, company and capability tables print `m.dir`, and four print
   `m.compile` — so the words live here and nowhere else, or the plan page and
   the deck end up explaining the same glyph differently (§53.5).

   A STORED VALUE OUTSIDE THE LIST KEEPS ITS OWN SPELLING AND GETS NO NOTE
   (§96.2, §130.1): an imported plan may carry a direction or a rule this
   product never offered, and inventing an explanation for it would be the
   platform speaking for the client's own words. */
var DIR_WORDS = { "≥": "More is better", "≤": "Less is better" };
var COMPILE_WORDS = {
  Latest:  "Takes the last measure reported",
  Sum:     "Adds up across the period",
  Average: "Averages across the period"
};
/* The mark is drawn as it always was; the note rides on it. `title` alone —
   the platform's own hover, so nothing new has to be positioned, and
   `clipTitles()` only fills an EMPTY title so this is never overwritten
   (§93.6). */
/* THE PRODUCT'S OWN NOTE, NOT THE BROWSER'S (§163). This shipped as a `title`
   and Islam reported the hover as "not working" — it was working, and that is
   the finding: a native tooltip waits about a second, hangs off an 11px target,
   and on an iPad DOES NOT EXIST. §127 settled this once for the chat settings
   and the answer is the same here: `data-tip`, the platform's own bubble,
   which opens at once on hover and on FOCUS — and focus is what a tap gives
   you, which is the half the browser's tooltip can never do.

   `tabindex="0"` is what makes the tap work, and it is a real cost: eight more
   stops on a plan page. Taken deliberately — the audience for these pages
   opens them on a tablet.

   THE `title` IS GONE RATHER THAN KEPT ALONGSIDE. Both would mean two notes
   for one value, the product's appearing at once and the browser's a second
   later underneath it. `aria-label` carries the words for anything that reads
   the page aloud, which the focusable span now announces. */
function noteSpan(text, note, cls){
  if (!note) return cls ? '<span class="' + cls + '">' + esc(text) + '</span>' : esc(text);
  return '<span class="' + (cls ? cls + " " : "") + 'hasnote" tabindex="0" data-tip="' +
    esc(note).replace(/"/g, "&quot;") + '" aria-label="' + esc(text) + ' \u2014 ' + esc(note) +
    '">' + esc(text) + '</span>';
}
function dirCell(d){ return d ? noteSpan(d, DIR_WORDS[d] || "") : ""; }
/* THE REPEATED DEFAULT DROPS TO THE QUIET INK (§149). "Latest" is what almost
   every row says, so at full strength it is a column of noise that hides the
   two rows saying something else. Quiet, never hidden: the value is still
   there for anybody reading down the column. */
function compileCell(c){
  if (!c) return "";
  var note = COMPILE_WORDS[c] || "";
  /* THROUGH `noteSpan`, WHICH IS WHY IT EXISTS (§163.3). This built its own
     span and set its own `title` — §163 converted the direction cell and left
     this one behind, and the two faults then met: the span still carried
     `hasnote`, so the new bubble matched it with NO `data-tip` to fill it and
     painted an EMPTY BLACK BOX, and a second later the browser's tooltip
     arrived underneath with the words. Islam saw exactly that: "it shows a
     black box and later it shows the description."

     §96's lesson, again and in the same shape: a helper that exists is not a
     helper that was used, and nothing catches the difference — both spans
     render, both carry the class, and only one has the attribute. */
  return noteSpan(c, note, c === "Latest" ? "cdefault" : "");
}

/* Measure name reads left; every figure centres under its column. Progress
   carries the band colour, since it is the row's conclusion. */
function measureRows(ms, opts){
  opts = opts || {};
  var on = arranging("unit", opts.unit);
  return ms.map(function(m, i){
    /* §218: nothing is held back for the office any more — a filled target
       or direction is live, so a measure is scored the moment it has a
       figure to score. */
    /* §239: the score is the PRORATED one; `m.progress` stays the stored raw
       ratio and is what the Focus board reads (reward is a year-end
       judgement). */
    var sc = measureScore(m), scored = m.target && sc != null;
    var head = '<tr data-oi="' + i + '"' +
               (SMPRules.isHidden(m) ? ' class="hiddenrow"'
                : isFocus(m.id) ? ' class="focusrow"' : '') + '><td class="idx">' +
               (on ? handle("Reorder " + m.name) : '') +
               '<span class="idx-n">' + (i+1) + '</span></td><td>' + esc(m.name) + hidChip(m) + fmark(m.id) +
               (m.horizon ? '<span class="why">measured at ' + esc(m.horizon) + '</span>' : '') +
               (m.note ? '<span class="why">' + esc(m.note) + '</span>' : '') +
               '</td><td class="num">' + dirCell(m.dir) + '</td><td class="num">' + esc(m.target) +
               '</td><td class="cc">' + compileCell(m.compile) + '</td>';
    if (opts.unscored) return head + '</tr>';
    /* §239 + §243: main's benchmark rides inside the figure's cell, and this
       branch's figure is read at its target's scale. Both, or a long figure
       loses its scale and a scaled one loses what it is measured against. */
    var dueLab = measureDueLabel(m);
    var actCell = (m.actual == null || m.actual === "") ? '&mdash;'
      : dueLab ? '<span class="pair"><b>' + figShown(m) + '</b> <i>/ ' + esc(dueLab) + '</i></span>'
               : figShown(m);
    return head + '<td class="num">' + actCell + '</td>' +
           (scored
             ? '<td class="num final" style="color:' + bandInk(sc) + '">' + sc + '%</td>'
             : '<td class="cc"><span class="pill none">Not scored</span></td>') + '</tr>';
  }).join("");
}
function measureHead(unscored){
  /* §239: "Annual target" says outright that it is the year's number, which
     is what makes the quiet figure beside the actual make sense. And "YTD
     actual" replaces a hardcoded "H1 actual" that read H1 in every cycle. */
  return '<thead><tr><th class="idx">#</th><th>Measure</th><th class="cc">Dir.</th><th class="cc">Annual target</th>' +
    '<th class="cc">Compile</th>' + (unscored ? '' : '<th class="cc">YTD actual</th><th class="cc">Progress</th>') +
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

/* WRITE, OR DELETE THE KEY (§50.6). A value put back to nothing must leave
   the row byte-identical to one that never had it, or every save carries a
   phantom change nobody made and a non-office person is refused for it. */
function setOr(row, field, v){
  v = (v == null ? "" : String(v)).trim();
  if (v) row[field] = v; else delete row[field];
}
/* The outcome's four controls, in ONE cell and ONE grid (Islam: "the 4 boxes
   should be the same size ... so we can give space for the other columns").
   Equal boxes sized by what the compile select needs for its longest word, so
   the width the four give back goes to the prose columns beside them — Target
   275px to 220 and Tactic 324 to 380, measured, with the rows falling from 149
   to 131 because the prose stops wrapping so hard.

   The number and its unit above, the two rules below — his grouping, chosen
   over pairing the direction with the value it qualifies. The unit rides ON
   the target string exactly as a measure's does (§199), so there is no second
   convention for what a target looks like. */
/* THE UNIT, WHETHER OR NOT A NUMBER IS THERE YET. `targetParts` reads a value
   FOLLOWED BY a unit, so a bare "#" comes back as a value of "#" with no unit
   — right for a target, wrong here, where the office may pick what a thing is
   measured in before deciding how much of it. One field still (§53.5): with no
   number the whole string IS the unit, and typing one joins them. */
function outUnitOf(t){
  var v = String((t && t.outTarget) || "").trim();
  if (!v) return "";
  var parts = splitTarget(v);
  /* NUMERIC, not merely non-empty. `targetParts` falls back to `{value: the
     whole string, unit: ""}` when it cannot see a number, so a bare "#" comes
     back with a truthy value and an empty unit — and a truthiness test then
     throws the unit away on the next keystroke. Measured: the unit vanished
     the moment a number was typed. */
  return /^-?[\d.,]+$/.test(parts.value) ? parts.unit : v;
}
/* §249: THE TARGET IS A COUNTED GAP, SO THE BLOCK IS DRAWN THROUGH `gapCell`
   AND THE WRITE COMES BACK THROUGH IT. `set` is the wrapped setter — the
   office's lifts the pending mark, the filler's stamps one — and it is handed
   the finished `outTarget` string, because that one field is where the number
   and its unit both live (§199, and §248's own reason for keeping it one
   field). `set` absent keeps the old direct write, so a later caller that
   knows nothing about the lifecycle still behaves as this always did.

   `fillOnly` DRAWS THE OTHER TWO AND OPENS NEITHER. The direction and the
   compile rule are not gaps — both carry a working default (§248: `≥`, and a
   blank compile keeps the annual target) — so a filler writing one would be
   authoring, and the save would refuse the WHOLE graph for it, costing the
   fills beside it (§184). They are drawn read-only rather than dropped, which
   is §248's own ruling about the unit picker applied to its neighbours:
   inside a block of four equal boxes a hole reads as a control that failed to
   render, not as one somebody else owns. */
function outcomeEdit(t, set, pendCls, fillOnly){
  var unit = outUnitOf(t);
  var put  = set || function(v){
    if (SMPRules.gapBlank(v)) delete t.outTarget; else t.outTarget = v;
  };
  /* THE WALK MARK GOES ON THE NUMBER AND NOWHERE ELSE. `gapwalk` is what
     "Next gap" steps through (§177.2), and one gap wearing it twice would
     cost two presses to walk one blank. */
  var quiet = String(pendCls || "").replace(/\bgapwalk\b/g, "").trim();
  return '<div class="tgrid">' +
    inputOr("plan", splitTarget(t.outTarget || "").value, "mono " + (pendCls || ""),
            function(v){
      var n = String(v == null ? "" : v).trim();
      var u = outUnitOf(t);
      /* Cleared, the UNIT survives — somebody correcting a figure has not
         changed their mind about what it is measured in. */
      if (!n) put(u || "");
      else put(joinTarget(t.outTarget || "", n, u));
    }) +
    /* THE UNIT PICKER IS ALWAYS THERE. The measures table hides it until a
       target exists — right in a column of its own, and wrong inside a block
       of four equal boxes, where the hole reads as a control that failed to
       draw (Islam: "the target column is missing the unit drop down"). So the
       unit can be chosen FIRST and is held on its own until a number arrives
       to join it: `outTarget` is "%" for as long as it takes to type 90. */
    selectOr("plan", unit, targetUnitOpts(unit), quiet,
             function(v){ put(nextTargetUnit(t, v)); }) +
    (fillOnly
      /* `.why` on BOTH, because `.tgrid > .why` is what centres a plain span
         inside a `--tw` column — without it the direction sits left of the box
         above it and the block stops reading as four equal ones, which is the
         whole shape §248 settled. Quiet is also the honest colour: in this
         mode they are facts, not controls. */
      ? '<span class="why mono">' + esc(t.outDir || "\u2265") + '</span>' +
        '<span class="why">' + esc(t.outCompile || "\u2014") + '</span>'
      : selectOr("plan", t.outDir || "\u2265", ["\u2265", "\u2264"], "mono",
                 function(v){ setOr(t, "outDir", v); }) +
        selectOr("plan", t.outCompile || "", ["", "Sum", "Latest", "Average"], "",
                 function(v){ setOr(t, "outCompile", v); })) +
    '</div>';
}
/* `setTargetUnit` is written against a measure's `target`/`target3y` pair; the
   outcome has one field, so it asks the same question of that one — never a
   second definition of how a unit joins a number (§53.5).

   §249: IT ANSWERS WITH THE STRING AND WRITES NOTHING. The target is a
   counted gap now, so every write to it goes through `gapCell`'s setter —
   which stamps a filler's mark and lifts the office's — and a function that
   assigned the field itself would slip past that lifecycle while looking
   exactly like the one that does not. Emptied, it answers "" and the caller's
   `del` deletes the key (§50.6). */
function nextTargetUnit(t, u){
  var want = String(u == null ? "" : u).trim();
  var val  = splitTarget(t.outTarget || "").value;
  if (!/^-?[\d.,]+$/.test(val)) val = "";
  var cur  = { value: val, unit: outUnitOf(t) };
  if (want === cur.unit) return t.outTarget || "";
  /* With no number yet the unit is stored alone and joins the moment one is
     typed; emptied with no number, the whole value goes. */
  if (!cur.value) return want;
  return joinTarget("", cur.value, want);
}

/* ── A TACTIC'S OUTCOME, ON THE READING SURFACES (§248, §249) ──────
   The outcome takes a column beside the figure it is judged by, on the plan,
   on Performance and on Reporting.

   §249: AN EMPTY ONE SAYS MISSING, REVERSING §248's OWN DASH. That dash was
   argued from the count — *"it is not a counted gap, so saying Missing over a
   count of nought is §214.4's fault with the sign reversed"* — and the count
   is exactly what has changed, so the reason expired with it (§94.15's rule:
   a decision resting on a sentence that has stopped being true does not get
   to stand on habit). The other half of that sentence, that shipping it loud
   would mark all 83 demo tactics at once, was a judgement about the rollout,
   and Islam has now made it the other way.

   ONE FUNCTION, THREE SURFACES, so the plan cannot call a row owed while
   Performance beside it calls the same row answered (§53.5). The plan's own
   cell reaches this through gapCell's `read` hook, which is what keeps the
   fill lifecycle in one place. */
function outcomeCell(t){
  return t && t.outcome
    ? '<b>' + esc(t.outcome) + '</b>'
    : '<span class="missing">Missing</span>';
}
/* The reported figure written the platform's own way, so `7` against a target
   in `#` reads `7#` and one in `M EGP` reads `7 M EGP` — never joined by hand
   (§199.4), and never doubled if somebody typed the unit in (§243). */
function outcomeShown(t){
  var o = outcomeOf(t);
  if (!o || o.actual == null || o.actual === "") return null;
  return joinTarget("", String(o.actual), splitTarget(o.target).unit) || String(o.actual);
}
/* The target as it is written on the plan — the whole year's number, unit and
   all. `tacticBenchmark` gives what it is measured against RIGHT NOW, which
   for a Sum row is a part of this. */
function outcomeTargetShown(t){ return t && t.outTarget ? String(t.outTarget) : null; }

/* Tactic, owner and quarters read left; the rest centres. A tactic whose
   quarters have not begun is not behind \u2014 it is not yet due, and scoring it
   would say otherwise. */
function tacticRows(ts, unitKey){
  var on = arranging("unit", unitKey);
  return ts.map(function(t, i){
    var pl = tacticPlanned(t), due = tacticDue(t);
    /* §248: an outcome answers with its own score and its own benchmark; a
       tactic without one is read exactly as it was. `tacticRatio` stays the
       reader for the second case so nothing about it moves. */
    var oc = onOutcome(t), bench = tacticBenchmark(t);
    var r = oc ? tacticReads(t) : tacticRatio(t);
    var shown = oc ? outcomeShown(t) : (t.actual == null ? null : t.actual + "%");
    var status = t.status === "Done" ? '<span class="pill good">Done</span>'
                                     : '<span class="pill warn">' + esc(t.status) + '</span>';
    /* Three distinct states, and they must not look alike: not yet due, due
       but unreported, and reported. */
    /* §239: BOTH HALVES ARE PER CENTS of this tactic's own plan and the sign
       is written, because "45 / 50" reads as a count of things -- and the same
       cell has always printed "due at 50%" WITH the sign in its unreported
       state, so one cell spelt one unit two ways. */
    var tail = !due
      ? '<td class="cc" colspan="2"><span class="pill kind">Not yet due</span></td>'
      : !tacticAnswered(t)
      ? '<td class="cc" colspan="2"><span class="pill none">Not reported</span>' +
        (bench ? '<span class="why" style="margin:2px 0 0">due at ' + esc(bench) + '</span>' : '') + '</td>'
      : '<td class="num"><span class="pair"><b>' + esc(shown) + '</b>' +
        (bench ? ' <i>/ ' + esc(bench) + '</i>' : '') + '</span></td>' +
        '<td class="num final" style="color:' + bandInk(r) + '">' + pct(r) + '</td>';
    return '<tr data-oi="' + i + '"' +
      (SMPRules.isHidden(t) ? ' class="hiddenrow"'
        : due && t.actual != null ? '' : ' class="notdue"') + '><td class="idx">' +
      (on ? handle("Reorder " + t.name) : '') +
      /* §248: the NAME carries the weight now, because the description sits
         under it — two greys at one weight run together as a single block.
         And the outcome leaves this cell for a column of its own: it is what
         the figure beside it is measured against, so it belongs on the line,
         not tucked under a name where it cannot be scanned. */
      '<span class="idx-n">' + (i+1) + '</span></td><td><b class="tacname">' +
      esc(t.name) + '</b>' + hidChip(t) +
      (t.description ? '<span class="why">' + esc(t.description) + '</span>' : '') +
      (t.note ? '<span class="why">' + esc(t.note) + '</span>' : '') + '</td>' +
      '<td>' + outcomeCell(t) + '</td>' +
      '<td>' + esc(t.owner) + '</td><td class="collabs">' + collabCell(t) + '</td>' +
      '<td>' + qs(t) + '</td><td class="cc">' + status + '</td>' + tail + '</tr>';
  }).join("");
}
function tacticHead(){
  return '<thead><tr><th class="idx">#</th><th>Tactic</th><th>Outcome</th>' +
    '<th>Owner</th><th>Collabs.</th><th>Quarters</th>' +
    /* §239: VARIANCE GOES -- the pair beside it already shows it, and the
       column was spending width to restate a subtraction. "Of plan" becomes
       "Progress" so both tables on the page end in the same word. */
    /* §248: "YTD delivery" becomes "YTD actual" — the word the key measures
       table on this same page already uses, so one page stops having two names
       for the same kind of number, and "delivery" stops being wrong for a row
       measured in stores or in EGP. */
    '<th class="cc">Status</th><th class="cc">YTD actual</th>' +
    '<th class="cc">Progress</th></tr></thead>';
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
    /* THE PILLAR'S NOTE IS GONE FROM EVERY SCREEN (§196.2). §194 removed the
       bar that EDITED it, at Islam's direction, and left this — the rail row's
       grey sub-line — so the value was readable in one place and correctable
       in none: the worst of the three states (§61). Islam: *"pillar note
       remove it for now."*

       THE STORED VALUE IS UNTOUCHED. `sub` still round-trips through
       `units.extra` exactly as it did, so nothing an upload wrote is lost and
       one line gives the sub-line back — which is what "for now" asks for.
       Deleting the data is a separate, irreversible act and is not this. */
    '<span class="pname"><b><span class="pcode">' + pillarCode(u, i) + '</span> ' + esc(it.name) + '</b></span>' +
    '<span>' + kindPill(it) + '</span>' +
    '<span><span class="pill theme">' + esc(it.theme) + '</span></span>' +
    '<span class="powner">' + esc(it.owner) + '</span>' +
    '<span class="num lead" style="color:' + bandInk(perf) + '">' + pct(perf) + '</span>' +
    '<span class="num" style="color:' + bandInk(r) + '">' + pct(r) + '</span>' +
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
      '<div class="headline"><span class="big" style="color:' + bandInk(perf) + '">' + pctBig(perf) + '</span></div>' +
      '<div class="minirow"><div><em>Measures</em><b>' + nMeasures + '</b>' +
          (nScored < nMeasures ? '<em class="sub-n">' + nScored + ' scored</em>' : '') + '</div>' +
        '<div><em>Highest</em><b style="color:' + bandInk(hi) + '">' +
          pct(hi) + '</b></div>' +
        '<div><em>Lowest</em><b style="color:' + bandInk(lo) + '">' +
          pct(lo) + '</b></div></div></div>' +
    '<div class="card tight"><div class="score-h"><h4>Execution performance</h4>' +
      '<span class="pill ' + band(r) + '">' + bandWord(r) + '</span></div>' +
      '<div class="headline"><span class="big" style="color:' + bandInk(r) + '">' + pctBig(r) + '</span>' +
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

/* THE COLOURS MOVE BEHIND A BUTTON (§163) ─────────────────────────────
   It was a full-width bar reading "READING THE COLOURS" with every band spelt
   out, and it carried Report and Presentation at its right end — which is why
   those two read as a row of their own rather than as the page's controls.
   Islam: put them on the performance line, and make the colours a button that
   opens and shuts. The bar goes, the page gains a row, and the three controls
   sit together where every other page in the product keeps its controls.

   THE WORD IS "Bands", HIS (over "Colour key"). It is what the Setup page that
   edits them already calls them, so the button and the setting share a noun.

   STILL RENDERED FROM `BANDS.bands`, never restated — editing a threshold in
   Setup cannot leave this lying, which was the whole point of the bar it
   replaces. The ranges are derived: the first band reads upward, the last
   downward, and any band between reads as a span.

   A `<details class="dlmenu">` because that is the product's dropdown and
   Presentation is standing right beside it (§53.5); a second shape for the
   same gesture, one control apart, is how two vocabularies get started.

   THE COST, RECORDED BECAUSE IT IS REAL: the colours are now explained only to
   somebody who presses the button. A red number is a red number to everyone
   else. Put to Islam in those words before he chose it. */
function bandsMenu(){
  var b = BANDS.bands;
  return '<details class="dlmenu right bandsmenu"><summary class="editbtn">Bands' +
    '<span class="dlcar" aria-hidden="true">\u25be</span></summary>' +
    '<div class="menu bandslist" role="menu">' +
    b.map(function(x, i){
      var rng = i === 0 ? x.floor + "% and above"
        : i === b.length - 1 ? "below " + b[i-1].floor + "%"
        : x.floor + " to " + (b[i-1].floor - 1) + "%";
      return '<div><i style="background:var(--' + x.key + ')"></i>' +
        '<b>' + esc(x.label) + '</b><span>' + esc(rng) + '</span></div>';
    }).join("") + '</div></details>';
}

/* The page's controls all travel the same way now: written into REPORT_CHROME
   during the render and hung on the tab row by the shell afterwards, because
   the tab row is drawn BEFORE the page that owns the controls (§150's channel,
   used by one more page). */
function perfActs(action){
  REPORT_CHROME = (action || "") + bandsMenu();
  return "";
}

function arrangeBtn(scope, unitKey){
  return canArrange(scope, unitKey)
    ? '<button class="editbtn" data-arrange="1">' + (ARRANGE ? "Done" : "Arrange") + '</button>' : '';
}

/* §222: THE REPORT BUTTON IS GONE, AND THE TAB IS WHY. Islam asked for
   Reporting as a tab beside Strategy and Performance; a button that opens
   what a tab beside it opens is a control with no audience of its own, which
   is the argument that retired the Arrange button (§94.15). `reportBtn()` is
   DELETED rather than left uncalled — a builder nobody calls is one the next
   reader takes for load-bearing (§24).

   §94's ruling survives the move: "make it all orange to obvious for the
   user" is now the tab's solid fill while you are in it, and the accent
   budget is unchanged because the fill moved rather than multiplied — drawn
   only while a cycle is open, only for somebody who may report. */

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

/* ── THE REPORTING CONTROLS RIDE THE TAB ROW (§150) ──────────────────────
   Islam, asked whether the audit's pinned bar should instead be a box beside
   the Performance tab: *"if we take the floating bar to be in a box beside
   the performance icon would that look better?"* — and it does, twice over.
   A 41-figure report used to scroll its tally, Submit and Save draft off the
   screen on the first flick; the tab row is ALREADY pinned chrome, so the box
   is on screen for the whole report with no new sticky element and none of
   the arithmetic one needs (§122.5's whole class of fault, avoided by
   placement rather than by getting the numbers right).

   ONE BUILDER FOR BOTH SIDES (§53.5). A unit's report and a supporting
   function's built this bar twice, line for line; two boxes explaining the
   same state differently is exactly the drift that rule exists to stop.

   THE CYCLE LINE MOVES TO THE HOVER, because the row is shared with the tabs
   and a date is the one fact here nobody acts on — while the COUNT stays
   written, since it is what says whether the report is finished.

   THE COLOURS ARE ISLAM'S: Submit wears the Report orange (`--cta`, the fill
   and ink §94.8 declared as a pair) and Save draft the same orange as TYPE
   with no box and a lighter weight — one family in two volumes, the act that
   ends the report against the act that parks it. Inside §41's accent budget:
   drawn only while a cycle is open, for somebody who may report. */
/* `own` (§250) is what stands where the "View only" pill did, for somebody who
   reports here through bounded roles alone — built by the caller through
   ownStateChip(). Null for everybody else, and the pill is then the honest
   answer it always was: they really are reading. */
function repChrome(target, done, total, pct, mayAll, subd, parked, submitWhy, own){
  return '<div class="repchrome">' +
    '<span title="' + esc(REVIEW.name + " · due " + REVIEW.due) + '">' +
      '<span class="rc-n">' + done + '</span> ' +
      '<span class="rc-of">of ' + total + '</span></span>' +
    '<span class="rc-bar' + (pct < 100 ? " part" : "") + '">' +
      '<i style="width:' + pct + '%"></i></span>' +
    (mayAll
      ? (subd || parked
          ? '<span class="rc-state ' + (subd ? 'done">Submitted' : 'draft">Draft saved') +
            '</span><button class="rc-reopen" data-unsubmit="' + esc(target) + '">Reopen</button>'
          : submitWhy
          /* §221: NOT READY, SO THE CONTROL SAYS SO BEFORE IT IS PRESSED.
             `aria-disabled` rather than `disabled`, because a disabled button
             takes no focus and the reason would be unreachable without a
             mouse — the bubble opens on hover AND on focus (§163). The click
             handler still refuses, so the hover is the explanation and not
             the enforcement. */
          ? '<button class="rc-submit hasnote" data-submit="' + esc(target) + '"' +
              ' aria-disabled="true" data-tip="' + esc(submitWhy) + '">Submit to the SMO</button>' +
            '<button class="rc-draft" data-repsave="1">Save draft</button>'
          : '<button class="rc-submit" data-submit="' + esc(target) + '">Submit to the SMO</button>' +
            '<button class="rc-draft" data-repsave="1">Save draft</button>')
      : (own || '<span class="pill none">View only</span>')) +
    /* §220: CLOSE, NOT CANCEL. The handler is `REPORTING = null; paint()` and
       nothing is discarded — figures are written as they are typed — so the
       old word promised a threat it never carried out. */
    '<button class="linkbu" data-repcancel="1">Close</button>' +
    '<span class="savesay" data-savesay="1" role="status" aria-live="polite"></span>' +
    '</div>';
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
      '<td class="num final" style="color:' + bandInk(ko) + '">' + pct(ko) + '</td></tr>';
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
      '<td class="num final" style="color:' + bandInk(perf) + '">' + pct(perf) + '</td></tr>';
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
/* `ownerBelow` is the plan pane with the pen on, where the owner has its own
   row now (§130.1) — the meta line drops it rather than saying it twice three
   inches above the control that changes it (§41's budget, in one line). */
function pillarMeta(it, ownerBelow){
  var parts = [];
  if (SHOW_KIND && it.kind) parts.push(esc(it.kind));
  if (it.theme) parts.push("theme " + esc(it.theme));
  if (it.owner && !ownerBelow) parts.push(esc(it.owner));
  return parts.join(" &middot; ");
}

function section(eyebrow, title, note, body, tipText, action){
  /* A section with nothing to say in its header does not get one. Emitting an
     empty <h2> still spends its line-height and its margin, which on the unit
     Performance page was pushing the rail a heading's worth further down the
     page for a heading that rendered as blank. */
  /* AND A HEADING THAT REPEATS THE PAGE'S OWN NAME DOES NOT GET ONE EITHER
     (§121.1). The Setup page's name is drawn by the shell now, so a section
     called what the page is called says it twice — the same argument as the
     empty header above, with the header full of a word already on screen.
     Compared against the name being shown rather than by position: a real
     first section keeps its heading. */
  var dupTitle = title && typeof PAGE_TITLE !== "undefined" && PAGE_TITLE != null &&
                 String(title).trim().toLowerCase() === String(PAGE_TITLE).trim().toLowerCase();
  var head = (eyebrow || (title && !dupTitle) || action)
    ? '<div class="section-h">' +
        (eyebrow ? '<span class="section-n">' + eyebrow + '</span>' : '') +
        (title && !dupTitle ? '<h2>' + title + (tipText ? tip(tipText) : '') + '</h2>' : '') +
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
        return '<tr><td>' + esc(m.name) + '</td><td class="num">' + dirCell(m.dir) + '</td>' +
          '<td class="num">' + esc(m.target) + '</td><td class="num">' + figShown(m) +
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
      sub: deliveryLine(ex, pl, "in these units"),
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

  return perfActs("") + head +
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
        '<td class="num">' + dirCell(m.dir) + '</td><td class="num">' + esc(m.target) + '</td>' +
        '<td>' + compileCell(m.compile) + '</td><td class="num">' + figShown(m) + '</td>' +
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
          '<td class="num final" style="color:' + bandInk(pillarPerf(x.it)) + '">' + pillarPerf(x.it) + '%</td></tr>';
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
                '<td class="num">' + dirCell(m.dir) + '</td>' +
                '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
                '<td class="num">' + figShown(m) + '</td>' +
                '<td class="num final" style="color:' + bandInk(m.progress) + '">' + pct(m.progress) + '</td></tr>';
            }).join("")) +
          '<p class="sub">Weighted across <b>' + c.keyObjectives.length + '</b> objectives: <b>' + pct(ko) + '</b>.</p>') +
      miniTable(["#","Project","Deliverables","Outcomes","Performance"],
        c.projects.map(function(p, i){
          return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(p.name) + '</td>' +
            '<td class="num">' + pct(projDeliverySide(p)) + '</td>' +
            '<td class="num">' + pct(projOutcomeSide(p)) + '</td>' +
            '<td class="num final" style="color:' + bandInk(projPerf(p)) + '">' + pct(projPerf(p)) + '</td></tr>';
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

/* ── WHERE TO LOOK NEXT (§155) ─────────────────────────────────────────────
   The group's first section — the first screen of every session — said how the
   group was doing in three cards and then stopped, with 330px of empty page
   under it and the units one click away on another section. It answered "how
   are we doing" and never "where do I look next", which is the question a
   chief executive opens this page with.

   NOTHING NEW IS COMPUTED. `unitObjectives(u)` is the same figure the Business
   units section draws in its gauges, so the strip cannot disagree with the
   detail it summarises (§53.5) — and `checks/wave3.py` asserts exactly that,
   entry by entry, rather than asserting a number.

   WORST FIRST, because a list sorted by anything else makes the reader do the
   sorting. Each entry is a real destination carrying `data-u`, so it is wired
   by the same loop as every other one in the product (§24) — a chip that
   looked like a link and went nowhere would be worse than no chip.

   The score wears its band's TEXT twin, never the fill (§154). */
function whereNext(keys){
  var rows = keys.map(function(k){
    var u = UNITS[k];
    return u ? { k: k, name: navName(u), v: unitObjectives(u) } : null;
  }).filter(function(r){ return r && r.v != null; });
  if (rows.length < 2) return "";
  rows.sort(function(a, b){ return a.v - b.v; });
  return '<div class="ustrip-h">Where to look next</div><div class="ustrip">' +
    rows.map(function(r){
      /* `data-go`, NOT `data-u` (§155.1). The row of destinations at the top
         wires `#units [data-u]` — scoped to the chrome — so a button carrying
         that attribute anywhere else looks navigable and does nothing. The
         platform already has the attribute for exactly this: `[data-go]` is
         wired document-wide and lands on the unit's Performance page, which
         is where somebody following a low score is going anyway. Found by
         pressing it (§96, §150.1 — twice in one session). */
      return '<button type="button" data-go="' + esc(r.k) + '">' +
        '<span class="un">' + esc(r.name) + '</span>' +
        '<span class="uv" style="color:' + bandInk(r.v) + '">' + r.v + '%</span></button>';
    }).join("") + '</div>';
}

  var SECS = [];
  SECS.push({ t: "Overall performance", h: section("", "Overall performance", null,
      '<div class="scores">' +
        drillCard("Group Key Objectives" + tip("The objectives the group set itself \u2014 each actual against its target, averaged. Authored by the group, never summed from the business units."), groupKeyObjectives(), {
          /* Was "The group's own scorecard. All 6 objectives have a target
             set." — a data-quality note where the reader wanted to know what
             the number IS (§156). The count stays, because it is the size of
             the thing being scored. */
          primary: true, sub: "The group\u2019s own <b>" + GROUP.keyObjectives.length +
            "</b> objectives, each scored against its target.",
          drill: koDrill, modalTitle: "Group Key Objectives", modalSub: "The group\'s own scorecard, authored not compiled"
        }) +
        drillCard("Business units &mdash; performance" + tip(TIP_PERF), groupUnitsObjectives(), {
          delta: deltaTag("group"),
          /* THE LINE SAYS WHAT THE NUMBER IS, NOT HOW IT WAS MADE (§156).
             It used to print all ten unit weights — "21 / 14 / 10 / 15 / 8 /
             6 / 6 / 7 / 8 / 5" — which is a derivation nobody can use at a
             glance and which grows with the business. "How this is
             calculated →" is two lines below and opens exactly that. */
          primary: true, sub: "All <b>" + UNIT_KEYS.length + "</b> business units\u2019 own " +
            L("keyobj","bu").toLowerCase() + ", weighted by size.",
          drill: perfDrill, modalTitle: "Business units \u2014 performance", modalSub: "Weighted compile across the three units"
        }) +
        drillCard("Business units &mdash; execution" + tip(TIP_EXEC), groupRatio(), {
          /* The sentence has to survive the empty tenant too. Reading
             "Delivered 0% against 0% planned - variance +0" under a card that
             says "Not yet measurable" is three false precisions in a row. */
          sub: deliveryLine(groupExec(), groupPlan()),
          drill: execDrill, modalTitle: "Business units \u2014 execution", modalSub: "Weighted compile of tactic delivery, as a share of plan"
        }) +
      '</div>' + whereNext(UNIT_KEYS)) });

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
  return perfActs(arrangeBtn("group")) + SECS[Math.min(GSEC, SECS.length - 1)].h;
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
           /* A SENTENCE, NOT A COLUMN (§149, §99.8's rule). The hover words
              belong on the table cells somebody runs an eye down; this line
              already reads "≥ · latest" as prose, and half of it wearing a
              note would be the drift the helpers exist to prevent. */
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
  /* Same first-line fix as the unit's (§129's audit): the lead opens with
     the pen, a line can be removed, and the first one can be written. */
  return '<div class="fgrid"><div class="card"><h2 class="sec first">Who we are</h2>' +
      '<dl style="margin:0">' +
      GROUP.clauses.map(function(c, ci){
        return '<div class="clause"><dt>' +
          (gpg ? inputOr(gpg, c[0], "", function(v){ c[0] = v; }) : esc(c[0])) + '</dt><dd>' +
          fieldOr(gpg, c[1], "", function(v){ c[1] = v; }) +
          (gpg ? '<button class="xbtn" data-clauserm="group|' + ci +
            '" title="Remove this line" aria-label="Remove this line">&times;</button>' : '') +
          '</dd></div>';
      }).join("") + '</dl>' +
      (gpg ? '<div class="addrow"><button class="editbtn" data-clauseadd="group">+ Add a line</button></div>' : '') +
      '</div>' +
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
  /* §243: THE RESOLVED WEIGHTS, never the raw array. A row's own `weight`
     wins, a blank takes the average of the ones that were set, and a list
     nobody has weighted answers null — so this table shows the two extra
     columns exactly when the score is actually weighted, and the number in
     them is the number koScore() divided by (§53.5: a breakdown that
     disagrees with the headline it sits under is worse than none). */
  var ws = koWeights(u.keyObjectives, KO_WEIGHTS[u.ukey]);

  /* The unit's Key Objectives are authored on its Foundation, but they are what
     this page scores — so the breakdown opens from the headline rather than
     making someone go and find it. Same drill-down the group page offers. */
  var koDrill =
    '<p class="sub" style="margin:0 0 14px">' + TIP_PERF + '</p>' +
    miniTable(["#", L("keyobj","bu"), "Dir.", "Target", "H1 actual", "Progress"].concat(ws ? ["Weight","Contribution"] : []),
      u.keyObjectives.map(function(m, i){
        var w = ws ? Math.round(ws[i] * 10) / 10 : null;
        return '<tr' + (isFocus(m.id) ? ' class="focusrow"' : '') + '><td class="idx">' + (i+1) + '</td>' +
          '<td>' + esc(m.name) + fmark(m.id) + '</td>' +
          '<td class="num">' + dirCell(m.dir) + '</td><td class="num">' + esc(m.target) + '</td>' +
          '<td class="num">' + figShown(m) + '</td>' +
          '<td class="num final" style="color:' + bandInk(m.progress) + '">' + pct(m.progress) + '</td>' +
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
          '<td class="num final" style="color:' + bandInk(pp) + '">' + pct(pp) + '</td></tr>';
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
          '<td class="num final" style="color:' + bandInk(pr) + '">' + pr + '%</td>' +
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
  return perfActs(presentMenu("unit", u.ukey)) +

    '<div class="scores">' +
      '<div class="card tight primary"><div class="score-h"><h4>' + L("keyobj","bu") + ' performance</h4>' +
        '<span class="pill ' + band(ko) + '">' + bandWord(ko) + '</span></div>' +
        '<div class="headline"><span class="big" style="color:' + bandInk(ko) + '">' + pctBig(ko) + '</span>' +
          deltaTag(u.ukey) +
          '<button class="drill" data-modal="' + koId + '">See the ' + L("keyobj","bu").toLowerCase() + ' &rarr;</button></div>' +
        '<div class="minirow"><div><em>Objectives</em><b>' + u.keyObjectives.length + '</b></div>' +
          '<div><em>Highest</em><b style="color:' + bandInk(koHi) + '">' +
            pct(koHi) + '</b></div>' +
          '<div><em>Lowest</em><b style="color:' + bandInk(koLo) + '">' +
            pct(koLo) + '</b></div></div></div>' +
      /* IN THE MIDDLE, as asked: the objectives are what the unit is judged
         on, the pillars are how it means to get there, and execution is
         whether the work happened. Read left to right that is the argument. */
      '<div class="card tight"><div class="score-h"><h4>' + plWord + ' performance</h4>' +
        '<span class="pill ' + band(pl) + '">' + bandWord(pl) + '</span></div>' +
        '<div class="headline"><span class="big" style="color:' + bandInk(pl) + '">' + pctBig(pl) + '</span>' +
          '<button class="drill" data-modal="' + plId + '">See the ' +
            plWord.toLowerCase() + ' &rarr;</button></div>' +
        '<div class="minirow"><div><em>' + plWord + '</em><b>' + u.items.length + '</b></div>' +
          '<div><em>Highest</em><b style="color:' + bandInk(plHi) + '">' +
            pct(plHi) + '</b></div>' +
          '<div><em>Lowest</em><b style="color:' + bandInk(plLo) + '">' +
            pct(plLo) + '</b></div></div></div>' +
      '<div class="card tight"><div class="score-h"><h4>Execution performance</h4>' +
        '<span class="pill ' + band(r) + '">' + bandWord(r) + '</span></div>' +
        '<div class="headline"><span class="big" style="color:' + bandInk(r) + '">' + pctBig(r) + '</span>' +
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
/* IS THIS PAGE OPEN FOR FILLING THE GAPS (§145)? The same shape, one grant
   down: the pen is on, the person may NOT author (an author's write settles
   and never wears the mark), and the fill grant answers for this page and
   target. Only `gapCell`, the quarters and the mode bar read this — every
   other `ed ?` site stays false, which is what keeps Add, ×, the drag
   handles and every name field out of fill mode without a second gate. */
/* §177: AND WHICH ROWS. A bounded role -- a project owner, a pillar owner,
   a contributor -- fills only what it holds, so a call site that knows the
   row hands in its context and the answer narrows to that row. Without a
   `ctx` the page-level answer stands, which is what the office and an
   unbounded role want and what a gap sitting inside no row (a unit's
   aspiration) has to have. */
function filling(page, acKey, ctx){
  if (!EDIT_PAGE[page] || mayAuthor(acKey)) return false;
  return ctx ? mayFillRow(acKey, ctx) : mayFill(acKey);
}

/* mayAuthor(), NOT the raw grant (§94). Every "Edit" bar and every pen in
   the platform asks this one question, so a strategy page cannot acquire a
   pen that is open to somebody the rule closes it to — the gate is on the
   control, not on each of the eleven call sites that draw one. */
function editBar(page, acKey){
  /* THE DOWNLOAD IS NOT AN AUTHORING CONTROL (§119.9), so it is asked for
     BEFORE the pen's gate and the bar is drawn when either is answered — a
     custodian who may not author the overview may still take it away. */
  var dl = dlPlanBtn(page);
  /* §145.14: the worded bar takes the corner button's three states — red
     while something is missing, quiet amber while only pending remains,
     nothing after; Done while the mode is open. */
  if (!mayAuthor(acKey || "u_found")) {
    if (mayFill(acKey || "u_found")) {
      var inner;
      if (EDIT_PAGE[page])
        inner = '<button class="editbtn fdone" data-page="' + page + '">Done filling</button>';
      /* §223: THE DOOR ASKS WHAT IS FILLABLE, THE WORDS ASK WHAT IS COUNTED.
         A page whose only blanks are optional (§214.2, §214.4) counts nought
         and still has something to fill in — offering no way in was how Hala
         met a Definition she could edit and no control to edit it with. */
      else if (gapTotal(TARGET))
        inner = '<button class="fillcta" data-fillcta="' + page + '">Fill in missing elements</button>';
      else if (gapOpenable(TARGET))
        inner = '<button class="fillcta" data-fillcta="' + page + '">Fill in what is empty</button>';
      else inner = '';
      return (dl || inner) ? '<div class="pageact">' + dl + inner + '</div>' : '';
    }
    return dl ? '<div class="pageact">' + dl + '</div>' : '';
  }
  return '<div class="pageact">' + dl + '<button class="editbtn" data-page="' + page + '">' +
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
/* THE ARRANGE CONTROL (§101). It shares the pen's SLOT and the pen's shape —
   28px, same corner, gold when live — because whoever has one never has the
   other: the office arranges through the pen, everybody else through this.

   THE ICON IS THE UP-DOWN ARROWS, and it is Islam's pick over a grip mark that
   would have matched the handles it turns on. Recorded rather than re-argued:
   the cost of a generic glyph is that it matches nothing else on the page, so
   the title and the aria-label carry the whole meaning and are not decoration.

   NOT DRAWN FOR SOMEBODY WHO HAS THE PEN, or the corner holds two controls
   that do the same thing — §94.15's argument, which is what removed the last
   Arrange button, and it still holds in the one direction that matters. */
/* ONE SLOT, ASKED ONCE. The unit's Plan pane and a capability's Projects pane
   had the same line written twice; a third would have been written the day
   somebody added a pane, and §53.5's whole rule is that a unit and a function
   must not drift apart in silence. */
function paneActs(page, acKey){
  var inner = penBtn(page, acKey) + arrangePaneBtn() + dlPlanBtn(page);
  return inner ? '<div class="paneact">' + inner + '</div>' : '';
}

/* ── THE PLAN LEAVES AS SLIDES (§117) ─────────────────────────────
   Islam: "add the access of downloading a presentation for the plan for the
   custodian and the business unit owner through a button in the strategy
   panel." Drawn ONLY on the plan pane — the page the ask names — and gated by
   the shared rule, so the office, the unit's owner and custodian and a
   function's head see it and a CEO passing through does not (§37: reaching is
   not holding). The press asks the rule AGAIN (§48.2, in pptx.js), because
   the viewer switcher can change who this is between paint and click. */
/* THE WHOLE STRATEGY TAB CARRIES IT, NOT ONLY THE PLAN PANE (§119.9).
   Islam: "the functional projects has no download button we need a download
   button." A capability function's strategy tab is TWO sections — Function
   overview (what each capability is) and Projects — and only the second had
   a `.paneact` to hang the button on, so from the first half of the same tab
   there was no way to take the plan away. One deck comes out either way, so
   the button belongs on both: `"capfoundation"` is the overview's page key,
   drawn in its Edit bar rather than a pane corner because that section is
   cards and has no pane (§30's rule about which control suits which shape). */
var DL_PAGES = { plan:1, capfoundation:1 };
function dlPlanBtn(page){
  /* ── HIDDEN AT ISLAM'S DIRECTION (2026-08-27, §145.9) ────────────────
     "hide the download button of the plans and the capabilities in the ppt
     format that we created earlier." HIDDEN, not deleted: pptx.js,
     mayDownloadPlan and sendPlanPptx all stand, so giving it back is one
     line here — and §119.1's Missing marks (now §145's "(pending)" too)
     keep the deck honest for that day. The early return is above the gate
     on purpose: the feature is off for EVERYONE, office included. */
  return '';
  if (!DL_PAGES[page]) return '';
  if (!SMPRules.mayDownloadPlan(world(), viewer(), TARGET)) return '';
  return '<button class="penbtn dlpen" data-dlpptx="' + esc(TARGET) + '"' +
    ' title="Download the plan as slides (.pptx)"' +
    ' aria-label="Download the plan as slides (.pptx)">' +
    '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor"' +
    ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M10 3.5v8M6.8 8.7L10 11.9l3.2-3.2M4.5 15h11"/></svg></button>';
}

function arrangePaneBtn(target){
  if (mayEditPlan() || !mayArrangeHere(target)) return '';
  var on = !!ARRANGE;
  var label = on ? "Done arranging" : "Arrange";
  return '<button class="penbtn arrpen' + (on ? " on" : "") + '" data-arrange="1"' +
    ' title="' + label + '" aria-label="' + label + '">' +
    '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M7 7L10 4l3 3M13 13l-3 3-3-3M10 4.6v10.8"/></svg>' +
    '</button>';
}

function penBtn(page, acKey){
  var author = mayAuthor(acKey || "u_found");
  /* §145.14: THE FILL GRANT'S CONTROL IS A WORDED RED BUTTON, not a pen
     glyph (Islam: "a clear red button with the wording fill in missing
     elements") — drawn only while something is missing; once everything is
     filled a quiet amber "Review pending · N" remains until the office has
     confirmed the lot, and then nothing. The office keeps its pen: their
     write settles, and their control did not change. */
  if (!author) {
    if (!mayFill(acKey || "u_found")) return '';
    if (EDIT_PAGE[page])
      return '<button class="editbtn cornerbtn fdone" data-page="' + page +
        '">Done filling</button>';
    var miss = gapTotal(TARGET);
    if (miss) return '<button class="fillcta cornerbtn" data-fillcta="' + page +
      '" title="' + plural(miss, "missing element") + ' in this plan">' +
      'Fill in missing elements</button>';
    /* §223: nothing COUNTED, but something fillable — same door, quieter
       words, because nothing here is owed. */
    var open = gapOpenable(TARGET);
    if (open) return '<button class="fillcta cornerbtn" data-fillcta="' + page +
      '" title="' + plural(open, "empty field") + ' you can fill in">' +
      'Fill in what is empty</button>';
    return '';
  }
  var on = EDIT_PAGE[page];
  var word = on ? "Done editing" : "Edit";
  return '<button class="penbtn' + (on ? " on" : "") + '" data-page="' + page + '"' +
    ' title="' + word + '" aria-label="' + word + '">' +
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
/* ── PROSE YOU CAN READ WHILE YOU EDIT IT (§189) ──────────────────────
   Islam: *"wrap the content of the plans edit boxes across pillars and
   functions, specially for the titles and descriptions, as they become hard
   to read when the lines get long."*

   IT IS NOT THAT THEY WRAPPED BADLY — THEY COULD NOT WRAP AT ALL. Every
   title and description on a plan was `inputOr()`, and an `<input>` is a
   single line by definition, so a long title ran past the end of its box and
   you scrolled sideways inside it to read your own words. Measured with the
   pen open: 4 of 23 boxes clipped at 1440px, 8 at 1100px on a unit's Plan,
   and on a function's Projects the Description column already had two clipped
   cells in the demo's own data before anybody typed a long one.

   A GROWING TEXTAREA, NOT A TALLER ONE. `fieldOr()`'s two rows is a guess
   that is too many for a short title and too few for a long one; this is
   sized to what is actually in it, on every paint and on every keystroke.

   IT IS ITS OWN BUILDER RATHER THAN A FLAG ON `inputOr`, because which
   fields are PROSE is a decision per call site and not something a builder
   can infer: an owner is picked, a target is one value, a direction is a
   symbol. Guessing by class is how the target field would quietly become a
   paragraph box.

   ENTER IS NOT A NEWLINE HERE. These are titles, not notes — a plan row's
   name is one line of prose however long it is, and the tables, the deck and
   both workbooks all print it as one. Enter blurs, which is what commits the
   value (§35), so the key does what it did when this was an input. */
/* Size every growing box to what is in it. Called at the end of paint()
   beside SEARCHSEL.wire(), because these are rebuilt on every paint and a
   height measured before the row is laid out is a height measured against
   nothing. */
function growFields(root){
  (root || document).querySelectorAll("textarea.fld.grow").forEach(function(t){
    t.style.height = "auto";
    t.style.height = (t.scrollHeight + 2) + "px";
  });
}
function textOr(page, value, cls, setter){
  if (!EDIT_PAGE[page] || !setter)
    return '<span class="' + (cls || '') + '">' + esc(value) + '</span>';
  var i = FIELDS.push(setter) - 1;
  return '<textarea class="fld grow ' + (cls || '') + '" data-fld="' + i +
    '" rows="1">' + esc(value) + '</textarea>';
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
    optionsHtml(opts, function(v){ return String(value) === v; }) + '</select>';
}

/* ── A DUE DATE IS PICKED, NEVER TYPED (§177) ─────────────────────────
   Islam: "for the date make it only Month Year like Jul 26 not days and
   remove the entry and just keep it a calendar selection."

   WHY A MONTH AND NOT A DAY. Every comparison the platform makes about a due
   date is monthly -- `monthsOf()` reduces every shape it reads to a month,
   `dueThisCycle()` compares months, `shiftWhen()` moves whole months -- so a
   day was precision the product could not use and one more thing to get
   wrong. And `Jul 26` reads one way in every country, where 24/07/26 and
   07/24/26 do not.

   WHY NOTHING IS TYPED. With no box there is nothing to mistype, nothing to
   validate and no half-typed value to store: the picker can only produce a
   shape `monthsOf()`, `dueFits()` and `shiftWhen()` already read (all three
   asserted in checks/milestone-fill.py). Clearing writes "" and puts the row
   back to Missing.

   THE POPUP IS position:fixed, and that is not a detail -- a project's tables
   sit inside `.tblscroll`, an overflow container, which clips an absolute
   popup to a strip of itself (§45.5 settled the same point for searchsel).
   It is placed by the shell when it opens, off the button's own rect. */
var MONTH_ABB = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
/* What the picker WRITES. Two digits, because that is the shape the plans in
   this tenant already carry and `shiftWhen()` preserves the width it is given. */
function monthValue(mi, year){ return MONTH_ABB[mi] + " " + ("0" + (year % 100)).slice(-2); }
/* Reading a stored value BACK into the picker: which month and which year it
   should open on. Anything the platform cannot read as a time -- "On-going",
   "Done" -- opens on the cycle's year with nothing chosen, and is left
   exactly as it is until somebody picks (§96.2's rule, from the other side:
   a stored value outside the vocabulary is never silently rewritten). */
function monthParts(v){
  var s = String(v == null ? "" : v).trim();
  var t = monthsOf(s);
  if (t == null) return { mi: null, year: cycleYear() || new Date().getFullYear() };
  /* A QUARTER OR A HALF NAMES NO MONTH, and nothing is lit for one. `Q1 2026`
     reduces to January because that is its FIRST month, which is the right
     answer for a comparison and the wrong one for a picker: lighting January
     would have the control assert a month the plan never chose (§15.1 --
     absent is never zero, and a derived value is not an answer). The YEAR is
     still right, which is the useful half of what was stored. */
  var named = s.split(/[^A-Za-z]+/).some(function(w){ return w && monthIndex(w) >= 0; });
  return { mi: named ? ((t % 12) + 12) % 12 : null, year: Math.floor(t / 12) };
}
function monthPickOr(page, value, cls, setter){
  var shown = value == null ? "" : String(value);
  if (!EDIT_PAGE[page] || !setter)
    return shown ? esc(shown) : '<span class="missing">Missing</span>';
  return monthBtnHtml(shown, cls, setter);
}
/* THE BUTTON ITSELF, drawn for anybody who may set the value (§239). The plan
   pages reach it through `monthPickOr` and its edit-mode gate; the reporting
   cycle has no edit mode and reaches it directly, because the office either
   may change the review point or is not offered a control at all. One builder,
   because two would drift about what a month looks like (§53.5). */
function monthBtnHtml(value, cls, setter){
  var shown = value == null ? "" : String(value);
  var i = FIELDS.push(setter) - 1;
  var p = monthParts(shown);
  return '<button type="button" class="monthbtn ' + (cls || '') + '" data-month="' + i + '"' +
    ' data-mi="' + (p.mi == null ? "" : p.mi) + '" data-yr="' + p.year + '"' +
    ' aria-haspopup="dialog" aria-expanded="false"' +
    ' title="' + (shown ? "Change the month" : "Pick a month") + '">' +
    (shown ? '<span class="mval">' + esc(shown) + '</span>'
           : '<span class="mval mnone">Missing</span>') +
    '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/>' +
      '<path d="M3 8.5h14M7 2.8v3.4M13 2.8v3.4"/></svg></button>';
}
/* The panel itself, rebuilt on every year step so the lit month follows the
   year it belongs to -- Jul 26 lit on 2026 and nothing lit on 2027. */
function monthPopHtml(mi, year, onYear){
  return '<div class="mp-yr">' +
      '<button type="button" class="mp-nav" data-myr="-1" aria-label="Previous year">&lsaquo;</button>' +
      '<b>' + year + '</b>' +
      '<button type="button" class="mp-nav" data-myr="1" aria-label="Next year">&rsaquo;</button>' +
    '</div><div class="mp-grid">' +
    MONTH_ABB.map(function(w, k){
      return '<button type="button" class="mp-m' +
        (onYear && k === mi ? " on" : "") + '" data-mpick="' + k + '">' + w + '</button>';
    }).join("") +
    '</div><div class="mp-foot">' +
      '<button type="button" class="linkbu" data-mclear="1">Clear</button></div>';
}

/* ── AN OPTION, A LABELLED OPTION, AND A GROUP OF THEM (§130.1) ───────
   Three shapes, and the plain string is BYTE-FOR-BYTE what selectOr always
   emitted: no `value` attribute, the text escaped, `selected` when it matches.
   That matters because the direction and compile-rule pickers (§114) pass a
   bare `""` in their list to mean "not answered", and it renders as an empty
   option exactly as it did before this — a `value`/label pair here would have
   quietly turned two dropdowns nobody asked about into em-dashes.

     "Ramy Behairy"            an option whose value is its text
     { v:"", label:"\u2014" }   a value and a label that differ
     { group:"People", items:[…] }   an <optgroup>

   `chosen` is asked of the VALUE, never of the label, or the pair above can
   never be selected. */
function optionHtml(o, chosen){
  var pair = o && typeof o === "object";
  var v = String(pair ? o.v : o), t = String(pair ? o.label : o);
  /* A HINT IS NOT PART OF THE ANSWER (§130.9). It rides on the option as data
     and searchsel.js draws it quietly beside the name in the popup; the
     option's TEXT — which is what the closed control shows and what the field
     stores — is the name alone. */
  var hint = pair && o.hint ? ' data-hint="' + esc(String(o.hint)) + '"' : '';
  return '<option' + (v === t ? '' : ' value="' + esc(v) + '"') + hint +
    (chosen(v) ? " selected" : "") + '>' + esc(t) + '</option>';
}
function optionsHtml(opts, chosen){
  return (opts || []).map(function(o){
    if (o && typeof o === "object" && o.group)
      return '<optgroup label="' + esc(o.group) + '">' +
        (o.items || []).map(function(x){ return optionHtml(x, chosen); }).join("") +
        '</optgroup>';
    return optionHtml(o, chosen);
  }).join("");
}

/* ── THE FOURTH WAY TO DRAW A BOUND FIELD: SEVERAL ANSWERS (§130.1) ───
   A `<select multiple>`, for a field that holds a LIST. It is its own builder
   for the same reason selectOr is (§96): a control the callers build by hand
   is a control that ends up bound to nothing.

   THE SETTER IS HANDED AN ARRAY, not a string. The shell's one `data-fld`
   handler reads `el.value` for every other field, and on a multiple select
   `value` is only the FIRST selected option — so it asks `el.multiple` and
   passes every selected value instead. One question, in the one place every
   bound field already goes through.

   NO BLANK OPTION. On a single select the blank is how you say "nobody"; on a
   multiple one you say it by ticking nothing, and an em-dash sitting in the
   list as a thing you could tick is a second way to say it. */
function selectManyOr(page, values, opts, cls, setter){
  var list = (values || []).map(function(v){ return String(v); });
  if (!EDIT_PAGE[page] || !setter)
    return '<span class="' + (cls || '') + '">' + esc(list.join(", ")) + '</span>';
  var i = FIELDS.push(setter) - 1;
  var has = {};
  list.forEach(function(v){ has[v] = 1; });
  return '<select class="fld ' + (cls || '') + '" multiple data-fld="' + i + '">' +
    optionsHtml((opts || []).filter(function(o){ return o !== ""; }),
      function(v){ return has[v] === 1; }) + '</select>';
}

/* ══ WHO OR WHAT OWNS A LINE (§130.1) ═══════════════════════════════════
   Islam: "for the owners in the plans, projects, tactics, milestones, let it
   be a searchable list from the registry", and asked whether that list is
   people or departments: "people or department".

   IT IS NOT ONLY TIDINESS, AND THIS IS THE PART WORTH KEEPING. A tactic's
   owner is matched against the register BY NAME — `SMPRules.namedOn()` reads
   `row.owner` beside the collaborators and that is what makes somebody a
   Contributor who may report that line (§55, §42). Measured on the demo before
   any of this was built: 38 different owner names across the plan, 14 of them
   naming nobody the platform can recognise, and **32 of the 78 tactics** owned
   by a short spelling — "Karim", "Hossam" — that matches no one. Every one of
   those is a person who owns a line and cannot enter its figure. A typed box
   could not have told them apart from a real name; a list cannot produce one.

   THE VOCABULARY IS `placeLabel()`'s, NEVER A SECOND ONE (§53.5). It is the
   register's own word for a place — the navigation's name, with "(function)"
   kept only where a unit and a function share one (§93.12). A department that
   the platform has no page for is a real answer too, so an **Official BU that
   points at nothing** is offered under its own name (§54: Risk employs people
   and carries no strategy); a mapped one is not, because the place it points
   at is already in the list under the navigation's word for it.

   WHAT IS STORED IS STILL THE NAME, not a person key. `namedOn()` matches on
   the name, the plan workbook carries the name, the deck prints the name and
   the archive holds the name — a key would be a migration through all four for
   a field nobody reads as an identifier (§87 is about not TRUSTING a name to
   say who somebody is; this is a label that now happens to match one).

   A VALUE ALREADY ON THE PLAN IS KEPT, in a group that says what it is (§96.2:
   a stored value outside the list is shown as it is, never silently displayed
   as something else). So a plan uploaded before today opens reading exactly
   what it read yesterday, and only what somebody deliberately changes moves.
   ═══════════════════════════════════════════════════════════════════════ */
function ownerAdder(){
  var seen = {}, out = [];
  return { list: out, add: function(n){
    n = String(n == null ? "" : n).trim();
    if (!n) return;
    var k = n.toLowerCase();
    if (seen[k]) return;
    seen[k] = 1; out.push(n);
  }, has: function(n){ return !!seen[String(n == null ? "" : n).trim().toLowerCase()]; } };
}
/* ── THE REGISTER'S NAME, NOT THE FULL ONE (§130.7) ──────────────────
   Islam, looking at the list on his own tenant: *"for the drop down of names
   go for the list of names in the registry not the full name."* The register
   carries two facts about what somebody is called (§93.8) — **Name**, what the
   office says out loud, and **Full Name**, what the employee file holds, which
   on his register runs to *Abd El Moniem Mohamed Abd El Moniem Mahmoud*. A
   dropdown of fifty of those is a list nobody can scan.

   IT COULD NOT BE SEEN IN THE DEMO. Every one of the 33 people here has a full
   name of two or three words, and not one has a typed short name — so
   `knownName()` returns exactly `p.name` for all of them and the first build
   looked correct on the only data it was tested against. Measured, not
   guessed: the fault lives on a tenant this file cannot open.

   THROUGH `displayNames()`, ALWAYS. That map is what lengthens the guess for a
   pair whose first two names match (§81.1), so the list can never show two
   people as one entry — which for a picker is not cosmetic, since the second
   of them would be silently dropped by the dedupe below.

   AND WHAT IS SHOWN IS WHAT IS STORED, so the plan reads the same word the
   register does (§53.5). `namedOn()` learned this name in the same edit — the
   whole point of the picker is that the person it names may report the line,
   and a label the rules cannot recognise would have put that back. */
/* ── AND WHERE THEY WORK, BESIDE THE NAME (§130.9) ───────────────────
   Islam: *"for the names in the lists, you can make it the name - the unit or
   function so people don't get confused."* Two people called Ahmed on a
   register of a hundred are told apart by their name here and by nothing else,
   and the register already knows the answer.

   THE PLACE IS A HINT, NEVER PART OF THE ANSWER. It is drawn in the popup and
   nowhere else: the cell shows the name, the plan STORES the name, the
   workbook and the deck print the name, and `namedOn()` matches the name. A
   label of "Ramy Behairy — Mobile" written into a tactic would name nobody the
   platform can resolve, which is the fault §130.1 exists to fix (§130.7 makes
   the same argument about the short name from the other side).

   `personAt()` IS THE ONE PAIR THAT ANSWERS THIS (§54), and `placeLabel()` the
   one vocabulary (§53.5). Somebody the register has not placed gets no hint
   rather than a guess or the word "group" — an absence is honest and a wrong
   place is worse than none (§15.1). */
function ownerPeople(){
  var a = ownerAdder(), dn = displayNames(), out = [];
  PEOPLE.forEach(function(p){
    if (!personActive(p)) return;
    var n = knownName(p, dn);
    if (a.has(n)) return;
    a.add(n);
    var at = personAt(p);
    out.push({ name: n, where: at && at !== "group" ? placeLabel(at) : "" });
  });
  return out.sort(function(x, y){ return x.name.localeCompare(y.name); });
}
/* NOT sorted: the navigation's order is the order somebody learned these in,
   and it is short enough to read. Retired ones are left out — a retired place
   is not somewhere work can be given to (§49.3) — and one already written on a
   plan is kept by the caller below, so nothing is lost by leaving it out here. */
function ownerDepts(){
  var a = ownerAdder();
  activeKeys().forEach(function(k){ a.add(placeLabel(k)); });
  activeFunctionKeys().forEach(function(k){ a.add(placeLabel("fn:" + k)); });
  activeCompanyKeys().forEach(function(k){ a.add(placeLabel("co:" + k)); });
  mainbus().forEach(function(b){ if (!mainbuAts(b).length) a.add(b.name); });
  return a.list;
}
/* `current` is a string or a list of them — whatever the field already holds,
   so the caller never has to reason about which of its values are known. */
function ownerChoices(current, blank){
  var people = ownerPeople(), depts = ownerDepts();
  var known = ownerAdder();
  people.forEach(function(x){ known.add(x.name); });
  depts.forEach(known.add);
  var kept = ownerAdder();
  (Array.isArray(current) ? current : [current]).forEach(function(v){
    if (!known.has(v)) kept.add(v);
  });
  var out = blank ? [{ v:"", label:"\u2014" }] : [];
  if (kept.list.length) out.push({ group:"Already on this plan", items:kept.list });
  if (people.length) out.push({ group:"People", items: people.map(function(x){
    return { v:x.name, label:x.name, hint:x.where }; }) });
  if (depts.length)     out.push({ group:"Departments", items:depts });
  return out;
}
/* The two controls every owner and every collaborator list in the plan is
   drawn by. One place, so the five fields cannot be given five lists. */
function ownerSel(page, value, setter){
  return selectOr(page, value == null ? "" : value,
    ownerChoices(value, true), "ownersel", setter);
}
function collabSel(page, list, setter){
  return selectManyOr(page, list, ownerChoices(list, false), "collabsel", setter);
}

/* ── FILL THE GAPS: ONE BUILDER FOR A FILLABLE CELL (§145, spec 023) ──────
   Every gap-fillable value in the product is drawn through gapCell, in all
   three of its states — a gap (fill mode draws the field), pending (amber,
   still the filler's, the office sees a confirm tick), settled (ordinary
   text, the office's alone). One builder, because §96 is what happens when
   there is a second way to draw one of these cells.

   THE SETTERS CARRY THE LIFECYCLE. A fill writes the value AND stamps the
   mark; clearing the box takes both away (the filler's own undo); an
   office write through the ordinary pen DELETES the mark on that field —
   correcting is confirming. The server judges the same transitions from
   the diff (lib/authorize.js's gap pass), so nothing here is trusted. */
function gapStamp(row, field){
  row.pend = row.pend || {};
  row.pend[field] = { by: (viewer() || {}).key || null,
                      at: new Date().toISOString().slice(0, 10) };
}
function gapLift(row, field){
  if (!row.pend) return;
  delete row.pend[field];
  /* The last mark leaving deletes the key (§50.6). */
  if (!Object.keys(row.pend).length) delete row.pend;
}
/* The tenant-facing word for each fillable field — the chip's hover names
   WHICH value is pending, because two chips reading "pending" on one row
   otherwise cannot be told apart. */
var GAP_WORDS = { dir:"Direction", target:"Target", target3y:"3-year target",
                  compile:"Compile rule", owner:"Owner", quarters:"Quarters",
                  start:"Start", end:"End", aspiration:"Aspiration",
                  weight:"Weight" };
/* pendBadge() was here. It drew the subject-wide pending count in the pillar
   band's right slot; §192 moved that number onto the totals row with the
   other subject-wide counts, where it can be walked and where it cannot land
   under the fill button. Removed rather than left uncalled (§24): a builder
   nothing calls is one the next reader has to prove is dead. */
/* ── THE MISSING BAR (§145.14, reshaping §145.12 from Islam's r2 mockup) ──
   The WHOLE signal lives in the section row beside Foundation · SWOT · Plan
   — read mode included, no line of the page spent: red "N Missing", one
   red chip per place that OWES (a clear place draws no chip), and the red
   "Fill in missing elements" button. Drawn only for the fill grant and the
   office (§69) and only while something is missing; it vanishes at zero.
   RED ALWAYS MEANS MISSING, AMBER ALWAYS MEANS PENDING CONFIRMATION — two
   colours, two meanings, never mixed. */
function missChipInner(e){
  return e.count ? esc(e.label) + ' <b>' + e.count + '</b>'
                 : '&#10003; ' + esc(e.label);
}
/* Which page a section's fill pen is (the bar's button opens it). */
function fillPageForSec(sec){
  var t = String(TARGET || "");
  if (sec === "found")
    return t.indexOf("fn:") === 0 && !fnPlansInPillars(FUNCTIONS[t.slice(3)])
      ? "capfoundation" : "foundation";
  if (sec === "plan" || sec === "proj") return "plan";
  return "";
}
function missBarCta(total){
  var inFill = EDIT_PAGE.plan || EDIT_PAGE.foundation || EDIT_PAGE.capfoundation;
  /* §223: WITH NOTHING OWED THE WALK HAS NOTHING TO WALK, so the door stays
     a door and does not offer to take you to a next gap that is not there. */
  if (inFill && total) return '<button type="button" class="fillcta" data-nextgap="1">' +
    'Next gap &rarr;&nbsp;<span class="ngleft">' + total + ' left</span></button>';
  if (inFill) return '<button class="editbtn fdone" data-page="' +
    esc(fillPageForSec((typeof CURSEC !== "undefined" && CURSEC[currentSub]) || "")) +
    '">Done filling</button>';
  var sec = (typeof CURSEC !== "undefined" && CURSEC[currentSub]) || "";
  return '<button type="button" class="fillcta" data-fillcta="' +
    esc(fillPageForSec(sec)) + '">' +
    (total ? 'Fill in missing elements' : 'Fill in what is empty') + '</button>';
}
/* §218: THE PENDING HALF OF THIS BAR IS GONE. §192 put a count and a walk
   here for values waiting on the office; with the approval removed there is
   nothing to wait for, so the bar counts what is MISSING and nothing else.
   The walk's machinery went with it rather than being left callerless — a
   builder nobody calls is one the next reader takes for load-bearing (§24). */
function missBar(){
  if (typeof seesGaps !== "function" || !seesGaps()) return '';
  var map = gapMap(TARGET), total = gapTotal(TARGET);
  /* §218: nothing is awaiting confirmation any more, so the bar is drawn
     for what is MISSING and nothing else — which is what it was before
     §192 added the pending half. */
  /* §223: DRAWN FOR EITHER — what is owed, or what is merely fillable. With
     nothing owed the bar carries no red count and no chips; it is the way in
     and nothing else. */
  var openable = typeof gapOpenable === "function" ? gapOpenable(TARGET) : 0;
  if (!total && !openable) return '';
  var chips = map.filter(function(e){ return e.count > 0; }).map(function(e){
    return '<button type="button" class="mchip"' +
      ' data-gkey="' + esc(e.key) + '"' +
      ' data-gpage="' + esc(e.go.page) + '" data-gsec="' + esc(e.go.sec) + '"' +
      (e.go.rail ? ' data-grail="' + esc(e.go.rail) + '" data-gcode="' +
        esc(String(e.go.code == null ? "" : e.go.code)) + '"' : '') +
      ' title="' + plural(e.count, "missing element") + ' — press to go">' +
      missChipInner(e) + '</button>';
  }).join("");
  /* THE WALK IS ONLY OFFERED TO SOMEBODY WHO CAN CONFIRM. A filler sees the
     count — those values are still theirs to correct — and confirming is the
     office's alone (§145), so a Next-pending button drawn for them would walk
     to a tick that is not there (§61, and §177's own rule that a count is a
     promise the press opens something). */
  return '<div class="missbar" data-gapband="1">' +
    (total ? '<span class="secmiss">' + total + ' Missing</span>' : '') + chips +
    '<span class="gaptail">' +
    (total || openable ? missBarCta(total) : '') + '</span></div>';
}
/* The counts rewritten IN PLACE after a fill — §63's write-into-the-node,
   because a repaint here would destroy the field being typed into (§71.2).
   The chips are kept (their handler rides the band by delegation), only
   their words move: a place reaching zero flips its chip to the green tick
   until the next paint drops it. The rail rows follow the same list. */
function gapBandRefresh(){
  var map = gapMap(TARGET), total = gapTotal(TARGET);
  var band = document.querySelector('[data-gapband]');
  if (band){
    var tot = band.querySelector(".secmiss");
    if (tot) tot.textContent = total + " Missing";
    map.forEach(function(e){
      var chip = band.querySelector('[data-gkey="' + CSS.escape(e.key) + '"]');
      if (!chip) return;
      chip.classList.toggle("done", !e.count);
      chip.innerHTML = missChipInner(e);
    });
    var tail = band.querySelector(".gaptail");
    if (tail) tail.innerHTML = total
      ? missBarCta(total)
      : '<span class="gapdone">&#10003; Nothing missing</span>';
  }
  document.querySelectorAll('[data-rgap]').forEach(function(el){
    var e = map.filter(function(x){ return x.key === el.dataset.rgap; })[0];
    if (!e) return;
    el.classList.toggle("ok", !e.count);
    el.innerHTML = e.count ? e.count + " Missing" : "&#10003;";
  });
}

/* The sentence over a page in fill mode — the contract, where the person
   is working, not in the knowledge base (§32's rule, one surface in). */
function fillBar(page, acKey){
  if (!filling(page, acKey)) return '';
  return '<div class="fillbar"><b>Filling the gaps.</b> You can write only where the ' +
    'plan holds nothing. A value you fill stays yours to correct until the ' +
    'Strategy Office confirms it — after that, changes are the office’s.</div>';
}
/* §145.14: A PAGE WITH NOTHING MISSING SAYS SO AND POINTS AWAY — Islam's
   Mazaya moment: fill mode opened an empty hand and said nothing, which
   read as broken. When the surface being looked at owes nothing but the
   plan still does, the contract line gives way to the answer and a door. */
function fillBarOr(page, acKey, ownCount, place){
  if (!filling(page, acKey)) return '';
  var total = gapTotal(TARGET);
  if (!ownCount && total)
    return '<div class="emptynote"><b>&#10003; Nothing missing in ' + esc(place) +
      '.</b> ' + plural(total, "missing element") + ' elsewhere in this plan. ' +
      '<button class="linkbu" data-nextgap="1">Go to the next place &rarr;</button></div>';
  return fillBar(page, acKey);
}
function gapCell(page, acKey, row, field, opts){
  opts = opts || {};
  /* `text` renders a stored shape as the string the field holds (a
     collaborators ARRAY reads and types as "A, B"); `parse` is its way
     back. §145.10's cell is why they exist — one pair, beside `num`. */
  var val = opts.text ? opts.text(row) : row[field];
  var blank = SMPRules.gapBlank(val);
  /* IS THIS A GAP — which for a DATE is wider than blank (§184). A milestone
     due `30/09/2026` holds a value the platform cannot read: every score
     treats it as no date, the pane already prints a red note naming it, and
     yet the fill grant would not open it, so the only person who could
     correct it was the office. `gapEmptyValue` is the shared test the SERVER
     also asks, which is the whole point — the field that opens here is the
     field the save accepts (§42).

     KEPT APART FROM `blank` DELIBERATELY. `blank` is "there is nothing to
     show", and it drives the placeholder and the read text; a value the
     reader cannot parse is still a value somebody typed, so it is DISPLAYED
     rather than replaced by the word Missing (§96.2). One is about writing,
     the other about showing, and collapsing them would hide the very value
     the person needs to see in order to correct it. */
  var open = SMPRules.gapEmptyValue(field, val);
  var mark = SMPRules.pendOf(row)[field];
  var ed = authoring(page, acKey);
  /* §177: DEFAULTING TO "INSIDE NO ROW" IS THE SAFE WAY ROUND. A cell that
     does not say where it sits -- a unit's aspiration, its key objectives, a
     capability's -- closes to every bounded role, and a cell that IS inside
     something hands in its context. The alternative (page-level by default)
     would have left a project owner filling a capability's objectives because
     somebody forgot a call site, which is §42's rule in the small: an
     unstated case resolves to the office's, never to a client role's. */
  var fl = filling(page, acKey, opts.ctx || {});
  var draw = function(setter, pendCls){
    /* §130.1 MET §145 AT THE MERGE: an owner or a collaborator is PICKED
       from the register, never typed — so those call sites hand in the
       CONTROL and this builder keeps the LIFECYCLE. The hook receives the
       wrapped setter (stamp on fill, lift on office write) and the pending
       class, and renders through selectOr/selectManyOr, which register the
       setter in FIELDS themselves. */
    if (opts.control) return opts.control(setter, pendCls);
    var i = FIELDS.push(setter) - 1;
    var cls = "fld " + (pendCls || "") + " " + (opts.cls || "");
    if (opts.kind === "select") {
      var list = (opts.opts || []).slice();
      /* A stored value outside the list is prepended rather than displayed
         wrong (§96.2); a blank leads with the blank so nothing is chosen by
         accident (§69's picker rule). */
      if (!blank && list.indexOf(val) < 0) list.unshift(val);
      if (blank) list.unshift("");
      return '<select class="' + cls + '" data-fld="' + i + '">' +
        list.map(function(o){
          return '<option' + (String(val == null ? "" : val) === String(o) ? " selected" : "") + '>' +
            esc(o) + '</option>';
        }).join("") + '</select>';
    }
    if (opts.kind === "area")
      return '<textarea class="' + cls + '" data-fld="' + i + '" rows="2"' +
        (blank ? ' placeholder="Missing"' : '') + '>' + esc(blank ? "" : val) + '</textarea>';
    return '<input class="' + cls + '" data-fld="' + i + '" value="' + esc(blank ? "" : val) +
      '"' + (blank ? ' placeholder="Missing"' : '') + '>';
  };
  /* `num` writes a number or null (§104.7's rule the other way round: the
     type comes from the field, and a numeric field must never store the
     string that would turn `tw += w` into concatenation). */
  var put = function(v){
    if (opts.parse) return opts.parse(v);
    return opts.num ? ((v === "" || !isFinite(+v)) ? null : +v) : v;
  };
  var empty = function(){
    return opts.parse ? opts.parse("") : (opts.num ? null : "");
  };
  if (ed) {
    /* The office's ordinary field — writing it settles the value, which is
       why the setter lifts the mark: correcting is confirming. `del` is
       §50.6's rule carried from §130.1's collaborators: an emptied list
       DELETES its key, or a tactic nobody supports and one never asked
       stop being byte-identical and every save carries a phantom change. */
    /* §177.2: MARKED FOR THE WALKER, AND NOT PAINTED. `Next gap` had nothing
       to walk in the office's pen, because `gapfld` is fill mode's class and
       an author's fields carry none — so the loudest button on the bar has
       never done anything for the person who uses it most. `gapwalk` carries
       no styling at all: what the walker needs to know is "this control fills
       a gap", which is a different fact from "paint it red", and merging the
       two would have restyled every blank field in the pen to fix a button. */
    return draw(function(v){
      var nv = put(v);
      if (opts.del && SMPRules.gapBlank(nv)) delete row[field];
      else row[field] = nv;
      gapLift(row, field); gapBandRefresh();
    }, open && !SMPRules.isHidden(row) && SMPRules.isGapField(field) ? "gapwalk" : "");
  }
  /* ── A CELL THE FILLABLE LIST HAS CLOSED NEVER OPENS TO A FILLER ────
     (§228.2, found by the §227 merge.) §224.2 took `def` out of
     GAP_FILLABLE and its assertion passed because the check's projects
     function had NOTHING fillable — no door, no fill mode, nothing to see.
     §227 made the milestones' collaborators fillable, the door appeared,
     and behind it the definition opened a box whose save the server
     refuses: §205's drift exactly, latent on any page that had a genuine
     gap beside the definition. The gate reads the ONE list the server
     reads (`fillKind` names the row's GAP kind), so a later decision about
     what is fillable reaches this cell without anybody coming back here;
     a call site that names no kind keeps today's behaviour. */
  var fillable = !opts.fillKind ||
    (SMPRules.GAP_FILLABLE[opts.fillKind] || []).indexOf(field) > -1;
  /* §233: a hidden row never opens to a filler — its blanks are not gaps
     (gapMap skips it), so a control here would be a door the count denies
     (§192.4: the count and the walk are one list). The office's pen above
     is untouched: hiding is the office's own mark and their edit settles. */
  if (fl && fillable && !SMPRules.isHidden(row) && (open || mark)) {
    return draw(function(v){
      var nv = put(v);
      if (SMPRules.gapBlank(nv)) {
        if (opts.del) delete row[field]; else row[field] = empty();
        gapLift(row, field);
      }
      /* §249.2: A VALUE THAT IS STILL A GAP IS NOT A FILL, AND MUST NOT WEAR
         THE MARK. §248 lets the unit be chosen before the number, so a filler
         picking "%" writes a field that is non-blank and still holds nothing
         the platform can use — and `gapMissing` treats a MARKED field as
         answered, so stamping here would take the row out of the count, out
         of the walk and out of Submit's refusal while its target was still
         unusable. The value is kept (the unit survives, which is the whole
         point of being able to pick it first) and the mark is not written.
         `gapEmptyValue` is the same test the count and the server ask, so
         the three cannot disagree about one string (§42, §205). */
      else if (SMPRules.gapEmptyValue(field, nv)) {
        row[field] = nv; gapLift(row, field);
      }
      else { row[field] = nv; gapStamp(row, field); }
      gapBandRefresh();
      /* §192.4: `gapwalk` ONLY WHERE THE FIELD IS ACTUALLY COUNTED. The walk
         and the count are one list (§116.2) and §187 split them: it took
         collaborators out of GAP_FIELDS, so the band stopped counting them and
         this class went on marking them. `gapfld` is untouched — whether the
         cell is FILLABLE is a separate decision and §187 did not change it. */
    }, mark ? "pendfld"
            : (SMPRules.isGapField(field) ? "gapfld gapwalk" : "gapfld"));
  }
  /* Read — and fill mode on a settled value reads too.
     `read` IS WHY §149 SURVIVED THE MERGE. A direction and a compile rule are
     stored as `\u2265` and `Latest`, and §149 gave each a dotted hover saying
     what it MEANS ("More is better", "Takes the last measure"). gapCell's read
     path is `esc(val)`, so routing those two cells through it would have
     silently dropped the words while every check went on passing — the value
     is still correct, just mute. A hook rather than a special case, because
     the next field that reads differently from how it is stored will need the
     same thing (§53.5). */
  /* §197.3: A DATE THE PLATFORM CANNOT READ SAYS SO, AND STILL SHOWS ITSELF.
     Islam: *"for any project that marks on going to be missing, and when they
     go and fill they get into the date selection."* The filling half was
     already built — `open` is exactly this case and the control is §177's
     month panel — and the PAGE said nothing: the bar read "1 Missing" over
     three rows that all looked filled in, so whoever was closing gaps had to
     guess which, and `On-going` looks like a perfectly good answer.

     THE WORD LEADS AND THE VALUE FOLLOWS IT. Missing is what the count uses,
     so the page and the bar finally agree; and the value stays on screen
     because somebody is being asked to CORRECT it, which §184 settled and
     this must not undo (§96.2). The value is quiet rather than red: red type
     on a value means *this figure is off track* everywhere else, and one
     colour cannot carry two meanings on one screen.

     `open && !blank` IS THE WHOLE CONDITION — a blank falls to the branch
     above, and `open` is only ever wider than `blank` for a date (§184's
     GAP_WHEN), so no other kind of field can reach this. */
  var text = blank
    ? (opts.readEmpty !== undefined ? opts.readEmpty : '<span class="missing">Missing</span>')
    : open
      ? '<span class="missing">Missing</span>' +
        '<span class="wasval"> \u2014 currently \u201C' + esc(val) + '\u201D</span>'
    : (opts.read ? opts.read(val)
      : opts.flow ? '<span class="flow ' + (opts.cls || "") + '">' + esc(val) + '</span>' : esc(val));
  return text;
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


/* `isGroup` decides whether the near horizon is shown: it is hidden on a
   UNIT's objectives and kept on the group's (§51.16). The chips view drops the
   same value, and the 3-year loses its "3-year" prefix there — with only one
   number left, a label saying which one it is has nothing to distinguish it
   from. */
/* ── THE UNIT IS ITS OWN COLUMN, AND NOTHING NEW IS STORED (§199) ──────
   Islam: *"for the key objectives we need a unit, as some are numbers, some
   might be money and some are SQM."*

   THERE IS NO UNIT FIELD AND THERE DOES NOT NEED TO BE. The unit has always
   been typed INTO the target — `"6.2B EGP"`, `"60000 SQM"`, `"100#"` — and
   the platform has held a matched pair for taking that apart and putting it
   back since the upload template gained a Unit column: `splitTarget` and
   `joinTarget`, which the download already round-trips through on every
   export. Measured before a line was written: **178 targets across every
   unit, capability, group objective and pillar measure in the shipped plan,
   0 round-trip failures.**

   SO THE COLUMN IS A VIEW OF WHAT IS ALREADY THERE. `target` goes on holding
   the whole string, all 103 places that read it keep working, the deck and
   both workbooks are untouched, and there is no migration — which is the
   difference between this and adding a field: a second home for the unit
   would be a second source of truth, and the two would drift the first time
   anything wrote only one of them (§53.5).

   THE NEAR TARGET NAMES THE UNIT, falling back to the far one. A row where
   the two disagree keeps both exactly as typed and shows the near one's,
   because inventing a single unit for a row that holds two would be the
   platform deciding something nobody said (§96.2). */
function targetUnitOf(m){
  if (!m) return "";
  var u = splitTarget(m.target).unit;
  return u || splitTarget(m.target3y).unit || "";
}
/* WRITING THE UNIT WRITES THE TARGETS, because that is where it lives (§199).
   Both horizons take it: a row whose 3-year target is measured in one thing
   and this year's in another is not something anybody has asked for, and
   showing ONE unit while silently leaving the other would be the column
   telling a half-truth.

   THE SEPARATOR IS DERIVED FROM THE NEW UNIT, never carried from the old
   spacing. `joinTarget` reads the gap out of the value it is given, which is
   right when the unit has not changed and wrong here: "100#" carries no space,
   so keeping it would turn a change to "trips" into "100trips". Passing an
   empty original asks joinTarget for its own rule instead — a space before a
   word, none before a symbol.

   AN UNCHANGED UNIT WRITES NOTHING AT ALL (§50.6, §42): re-typing what is
   already there must leave the plan byte-identical, or every visit to this
   table puts a phantom change into the next save and a non-office save is
   refused for the rest of the cycle. */
function setTargetUnit(m, u){
  var want = String(u == null ? "" : u).trim();
  if (want === targetUnitOf(m)) return;
  /* BUILT HERE RATHER THAN THROUGH `joinTarget`, and that is deliberate:
     joinTarget takes its separator from the value it is REPLACING, which is
     exactly right when the unit has not changed and exactly wrong here —
     "6.2B EGP" carries no space, so keeping it would turn a change to "SQM"
     into "6.2SQM". The convention belongs to the NEW unit (TIGHT_UNITS above).

     WHAT IS WRITTEN STILL ROUND-TRIPS, which is the property the whole
     feature rests on: joinTarget reads the separator back out of the stored
     string, so a value written here splits and rejoins to itself, and the
     check asserts that over everything the plan holds. */
  var sep = want && !TIGHT_UNITS[want] ? " " : "";
  ["target", "target3y"].forEach(function(f){
    var v = m[f];
    if (v == null || v === "") return;   /* nothing to attach it to */
    m[f] = splitTarget(v).value + (want ? sep + want : "");
  });
}
/* A unit with no target to sit inside cannot be stored, so the field says so
   rather than accepting a word and losing it on the next paint (§61: a control
   that takes input and discards it is worse than one that is not there). */
/* ── A NUMBER TYPED INTO A ROW TAKES THAT ROW'S UNIT (§199.6) ──────────
   Islam, from a group objective reading `3-year 30` with no unit at all:
   *"the objectives need to inherit the unit automatically as they are entered
   as a number in the value cell."*

   §199 only ever wrote the unit onto targets that ALREADY EXISTED, so the
   order of work decided the result: set the unit, then type the number, and
   the number was stored bare and the unit silently lost. Setting a unit and
   then filling the row is the obvious way round, and it was the one that did
   not work.

   ONLY A BARE NUMBER INHERITS. "TBD" must not become "TBD%", and a value
   somebody typed WITH its own unit ("50 EGP") is what they meant — it is left
   exactly as typed, and the picker then shows it, because the unit is read
   back out of the target (§96.2: never rewrite what somebody wrote).

   THE ROW'S UNIT IS THE OTHER HORIZON'S when this one is empty, which is what
   `targetUnitOf` already answers — so filling `This year` on a row whose
   3-year reads `30%` gives `50%` without anybody picking anything twice. */
function unitInherit(m){
  return function(v){
    var t = String(v == null ? "" : v).trim();
    if (!t || !/^-?[\d.,]+$/.test(t)) return v;   /* not a bare number */
    var u = targetUnitOf(m);
    if (!u) return v;
    return t + (TIGHT_UNITS[u] ? "" : " ") + u;
  };
}

function hasTargetToHoldAUnit(m){
  return !!(String(m.target || "").trim() || String(m.target3y || "").trim());
}

/* ── THE FILLER SETS A MISSING UNIT (§201.2) ───────────────────────────
   Islam: *"he can't fill the unit while he needs to fill if missing."* Drawn
   only where the row's unit is EMPTY — a unit already set stays the
   office's — and the write stamps a pending mark on every target it
   touched, because a fill is pending until the office confirms it (§145).
   Clearing it back lifts the marks, which is the undo the server's own
   transition expects. NOT a counted gap: 46 of the shipped 178 targets
   carry no unit and are complete without one, so this offers without
   nagging (§119.1: an optional blank is not a gap). */
function fillUnitOffered(page, acKey, m, ctx){
  return filling(page, acKey, ctx || {}) &&
         !targetUnitOf(m) && hasTargetToHoldAUnit(m);
}
function fillUnitCell(page, acKey, m, ctx){
  if (!fillUnitOffered(page, acKey, m, ctx)) return null;
  return selectOr(page, "", targetUnitOpts(""), "", function(v){
    var had = { target: m.target, target3y: m.target3y };
    setTargetUnit(m, v);
    ["target", "target3y"].forEach(function(f){
      if (m[f] === had[f]) return;
      if (String(v == null ? "" : v).trim()) gapStamp(m, f);
      else gapLift(m, f);
    });
    gapBandRefresh();
  });
}

/* ── THE UNITS ARE PICKED FROM A LIST (§199.4) ─────────────────────────
   Islam, on money: *"the financial units can be B EGP or M EGP or EGP only"*,
   and on counts: *"# into trips and orders is tricky, as we will need to add
   units all the time, so let's commit to #"*.

   BOTH ARE THE SAME DECISION and it is the right one. A free box invites a
   fourth spelling of the same currency and a different noun for every kind of
   thing counted — and the moment two rows say `#` and `trips` for the same
   idea, nothing can compare them and somebody has to maintain a vocabulary
   nobody agreed. A short fixed list is the maintenance NOT happening.

   `#` IS THE COMMITMENT, not a placeholder for a better word later. §199's
   own mockup argued for `trips` and `orders`; he priced that and turned it
   down, and the cost is recorded rather than re-argued: a count says how
   MANY and the objective's name says of what.

   A STORED VALUE OUTSIDE THE LIST IS KEPT AND OFFERED (§96.2, §114). The
   shipped plan holds `M`, `K` and `M USD` on four rows between them; a
   dropdown that could not show them would either display the row wrong or
   drop the unit on the first repaint, and both are worse than one extra
   entry. Nothing is rewritten by this list — only what the pen writes next. */
/* §239.5: DOLLARS JOIN THE LIST, at Islam's instruction — the plan holds
   figures in USD as well as EGP (a regional hub's revenue among them) and the
   pen could only offer Egyptian pounds, so a stored `M USD` was kept and
   offered by the rule below and could never be CHOSEN for a new row. K and M
   only, which is what he asked for; `B USD` and `K EGP` are deliberately not
   invented alongside them. */
var TARGET_UNITS = ["", "%", "#", "EGP", "M EGP", "B EGP",
                    "K USD", "M USD", "SQM", "d", "h"];
/* WRITTEN AGAINST THE NUMBER, OR AFTER A SPACE — and it is the PLAN's own
   habit, read off the shipped data rather than invented: `30%`, `100#` and
   `6.2B EGP` are written tight, while `28 EGP`, `4 d` and `24 h` take a space.
   A scaled currency reads as one token (`6.2B EGP`) and a bare one does not.

   IT IS A LIST RATHER THAN A RULE because there is no rule: "a symbol is
   tight, a word takes a space" gets `EGP` right and `B EGP` wrong, and the
   difference is convention, not grammar. Nine entries is cheaper to read than
   a predicate nobody can quite state. */
/* A SCALED CURRENCY IS ONE TOKEN whichever currency it is, so the dollars
   join their Egyptian twins here and read `8M USD`, not `8 M USD` — the same
   convention the plan already uses for `6.2B EGP`. */
var TIGHT_UNITS = { "%":1, "#":1, "M EGP":1, "B EGP":1, "K USD":1, "M USD":1 };
function targetUnitOpts(cur){
  var opts = TARGET_UNITS.slice();
  if (cur && opts.indexOf(cur) < 0) opts.splice(1, 0, cur);
  return opts;
}

function koView(list, isGroup, acKey){
  var near = isGroup || SHOW_KO_THIS_YEAR;
  var miss = '<span class="missing">Missing</span>';
  /* §145: every pending mark on the row, chips beside the values it shows —
     including a pending direction or compile, which have no column here, or
     the office would have nothing to confirm them from in read mode. */
  var chips = function(m){
    return "";
  };
  /* §243: THE OBJECTIVES READ AS A TABLE, AND THE LAYOUT SWITCH IS GONE.
     Islam: *"the other toggle that shows the objective in table or cards —
     remove it and make the view in table only."*

     The cards gave each objective its own box with the 3-year figure beneath
     it in small grey type; the table lines the targets up in a column an eye
     can run down, which is what reading a plan actually needs. The chips
     branch, `koToggle()`, `KO_VIEW`, its click handler and the `.ochips` /
     `.ochip` rules are DELETED rather than left unreachable (§24) — CSS left
     behind is what a later reader takes for load-bearing, and a mockup drawn
     from the stylesheet then draws something the product does not have
     (§41.9's own scar).

  /* §199.4: THE READING VIEW KEEPS THE UNIT ON THE FIGURE. §199 split it into
     a column of its own and Islam looked at it: *"let the unit be set in the
     edit table, but in the view attach the unit to the target."*

     He is right, and the reason is worth keeping. The argument for splitting
     was that a column of targets could then be read straight down — but the
     unit is a property of ONE ROW, not of the table, so a column of them lines
     up "B EGP" against "%" against "SQM" and gives the eye nothing. What
     reading a plan actually needs is each figure complete where it stands.
     The column stays where a unit IS one question with one answer: the pen,
     where it is being set. */
  return '<div class="ohead' + (near ? '' : ' one') + '"><span>Objective</span>' +
      '<span>' + horizonColLabel() + '</span>' +
      (near ? '<span>This year</span>' : '') + '</div>' +
    list.map(function(m){
      return '<div class="orow' + (near ? '' : ' one') +
        (SMPRules.isHidden(m) ? ' hiddenrow' : '') + '"><span class="on">' + esc(m.name) +
        hidChip(m) + chips(m) + '</span>' +
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
/* ── HIDDEN FROM THE PRESENTATION (§233) ──────────────────────────────
   The eye beside a row's × in the pen; the chip in read mode. An SVG taking
   currentColor, never a colour emoji (§45); lit on the attention ground
   while hidden — a decision, not a warning (§168). The chip is drawn for
   EVERYONE, because a row that does not count has to say so or the average
   above it cannot be explained. The handler re-asks authoring at the click
   through the page/acKey the button carries (§48.2). */
function eyeSvg(off){
  return '<svg viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<path d="M2 10s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 10 2 10z"/><circle cx="12" cy="10" r="2.6"/>' +
    (off ? '<line x1="4" y1="18" x2="20" y2="2"/>' : '') + '</svg>';
}
function eyeBtn(row, page, acKey){
  if (!row || !row.id) return '';
  var on = SMPRules.isHidden(row);
  var word = on ? 'Hidden from the presentation \u2014 press to show it again'
               : 'Hide from the presentation';
  return '<button class="eyebtn' + (on ? ' on' : '') + '" data-hiderow="' + esc(row.id) +
    '" data-hideac="' + esc(page) + '|' + esc(acKey) + '" aria-pressed="' + (on ? 'true' : 'false') +
    '" title="' + word + '" aria-label="' + word + '">' + eyeSvg(on) + '</button>';
}
function hidChip(row){
  return SMPRules.isHidden(row)
    ? '<span class="hidchip">Hidden \u2014 not counted</span>' : '';
}
function hidCls(row){ return SMPRules.isHidden(row) ? ' class="hiddenrow"' : ''; }

function koEdit(list, page, acKey, owner){
  var editing = authoring(page, acKey), pg = editing ? page : null;
  /* WHICH LIST THIS IS. Add and Remove act on an array, and the two callers
     hand in two different arrays (the group's and a unit's) — so the table
     registers its own, exactly as a field registers its own setter. */
  var li = KOLISTS.push({ list: list, owner: owner }) - 1;
  /* §243: A UNIT'S OBJECTIVES GET A WEIGHT COLUMN, which reverses §226's
     "the unit side is untouched" at Islam's own instruction: *"there is no
     weighting on the objectives in units it needs to be added."* Recorded as
     a reversal rather than overwritten — that earlier note is why this table
     was left behind when the function's gained the column.

     IT WRITES THE ROW, not `KO_WEIGHTS`. The stored array is positional
     (§48: remove the middle row and every weight below it lands on the wrong
     objective), and a capability's and a function's objectives have carried
     `weight` on the row all along — so the column the office now sees on all
     three writes one field and `koWeights()` resolves the old array behind it
     for a tenant that already has one. */
  return '<div class="scroll"><table><thead><tr><th>Objective</th><th class="cc">Dir.</th>' +
    '<th class="cc">Unit</th>' +
    '<th class="cc">3-year</th><th class="cc">This year</th><th class="cc">Compile</th>' +
    '<th class="cc">Weight %</th><th></th></tr></thead><tbody>' +
    list.map(function(m, i){
      /* \u00a7130: the four gap-fillable columns go through gapCell \u2014 in the
         office's edit they are the same bound fields as before (with the
         setter lifting a pending mark, since correcting confirms); in fill
         mode only a blank or still-pending one opens. The NAME never does:
         a row that exists is named, and renaming is authoring. */
      return '<tr' + hidCls(m) + '><td>' + inputOr(pg, m.name, "", function(v){ m.name = v; }) +
        (pg ? '' : hidChip(m)) + '</td>' +
        '<td class="cc">' + gapCell(page, acKey, m, "dir",
          { kind:"select", opts:["\u2265", "\u2264"] }) + '</td>' +
        /* §199: THE OFFICE'S, NOT THE FILLER'S. A unit is not a gap — 46 of
           the 178 targets in the shipped plan carry none and are complete
           without one — so it does not go through gapCell and does not join
           the count. It is `inputOr` like the NAME beside it: a fact about
           how the objective is written, which is authoring. */
        '<td class="cc">' + (pg
          ? (hasTargetToHoldAUnit(m)
              ? selectOr(pg, targetUnitOf(m), targetUnitOpts(targetUnitOf(m)), "",
                  function(v){ setTargetUnit(m, v); })
              : '<span class="why" title="Set a target first \u2014 the unit is ' +
                'written with it">\u2014</span>')
          : (fillUnitCell(page, acKey, m) || esc(targetUnitOf(m)))) + '</td>' +
        '<td class="cc">' + gapCell(page, acKey, m, "target3y",
          { kind:"input", cls:"mono", parse: unitInherit(m) }) + '</td>' +
        '<td class="cc">' + gapCell(page, acKey, m, "target",
          { kind:"input", cls:"mono", parse: unitInherit(m) }) + '</td>' +
        '<td class="cc">' + gapCell(page, acKey, m, "compile",
          { kind:"select", opts:["Sum", "Latest", "Average"] }) + '</td>' +
        /* §243: the same cell the capability's table already draws — one
           column, one field, one answer on all three surfaces (§53.5). Left
           blank it is not nought: koWeights() gives it the average of the
           weights that were set. */
        '<td class="cc">' + gapCell(page, acKey, m, "weight",
          { kind:"input", cls:"mono", num:true }) + '</td>' +
        '<td class="cc">' + (editing
          ? eyeBtn(m, page, acKey) +
            ' <button class="rmbtn" data-korm="' + li + '|' + i + '">Remove</button>' : '') +
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
    /* §145: a unit's (or function's) aspiration is a gap the fill grant can
       close — through gapCell, whose edit-mode setter also lifts a pending
       mark (correcting confirms). The GROUP's stays exactly as it was: the
       group's own pages are never fillable (§94's list). */
    '<p class="statement">' + (isGroup
      ? fieldOr(pg, statement, "big-field", setAsp)
      : gapCell(page, acKey, owner, "aspiration",
          { kind:"area", cls:"big-field", flow:true, readEmpty:"" })) + '</p>' +
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
      (editing ? '' : (isGroup ? '' : koYearToggle())) + '</div>' +
    (editing ? koEdit(objectives, page, acKey, owner) : koView(objectives, isGroup, acKey));
}

/* THE BAND ASKS THE SAME QUESTION THE CARD ASKS (§94). `authoring()` and not a
   flag passed down from the caller: the viewer switcher repaints without
   leaving modes, so the band has to be able to decide for itself that this page
   is no longer open to whoever is now looking at it. Nothing is drawn at all
   when it is not — the band exists only while the pen is on. */
function koBand(objectives, page, acKey, owner, isGroup){
  /* §145: the band also opens for the fill grant — koEdit's gap cells then
     draw only the blanks, and Add/Remove stay gated on authoring alone. */
  if (!authoring(page, acKey) && !filling(page, acKey)) return '';
  return '<div class="card koband">' + fillBar(page, acKey) +
    koBlock(objectives, page, acKey, owner, isGroup, true) + '</div>';
}

function renderUnitFoundation(u){
  var upg = authoring("foundation", "u_found") ? "foundation" : null;
  /* THE FIRST LINE CAN BE WRITTEN (§129's audit). The pen edited a clause's
     TEXT and never its lead, and an empty list rendered nothing to edit and
     no way to add — so a from-scratch unit could not say who it is at all
     (§61's trap on the oldest surface in the product). The lead opens with
     the pen because the leads are the unit's own words, not a fixed form. */
  return fillBarOr("foundation", "u_found",
      SMPRules.gapMissing("unit", u).length +
      (u.keyObjectives || []).reduce(function(a, m){
        return a + SMPRules.gapMissing("ko", m).length; }, 0),
      "the Foundation") +
    '<div class="fgrid"><div class="card"><h2 class="sec first">Who we are</h2>' +
      '<dl style="margin:0">' +
      u.clauses.map(function(c, ci){
        return '<div class="clause"><dt>' +
          (upg ? inputOr(upg, c[0], "", function(v){ c[0] = v; }) : esc(c[0])) + '</dt><dd>' +
          fieldOr(upg, c[1], "", function(v){ c[1] = v; }) +
          (upg ? '<button class="xbtn" data-clauserm="' + esc(u.ukey) + '|' + ci +
            '" title="Remove this line" aria-label="Remove this line">&times;</button>' : '') +
          '</dd></div>';
      }).join("") + '</dl>' +
      (upg ? '<div class="addrow"><button class="editbtn" data-clauseadd="' + esc(u.ukey) +
        '">+ Add a line</button></div>' : '') + '</div>' +
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
  /* THE FIRST LINE CAN BE WRITTEN (§129's audit). The pen edited what a file
     had put here and an empty quadrant offered nothing at all — so a SWOT
     could only ever ARRIVE, never start. Add per quadrant, remove per line,
     both re-asked on the click (§48.2). */
  var box = function(cls, key, title){
    var list = u.swot[key] || [];
    var ed = authoring("analysis", "u_anal");
    return '<section class="' + cls + '"><h3>' + title + '</h3><ol class="swotlist">' +
      list.map(function(x, i){
        return '<li><span class="swot-n">' + (i + 1) + '</span>' +
          (ed
            ? fieldOr("analysis", x, "", function(v){ list[i] = v; }) +
              '<button class="xbtn" data-swrm="' + esc(u.ukey) + '|' + key + '|' + i +
              '" title="Remove this line" aria-label="Remove this line">&times;</button>'
            : '<span>' + esc(x) + '</span>') + '</li>';
      }).join("") + '</ol>' +
      (ed ? '<div class="addrow"><button class="editbtn" data-swadd="' + esc(u.ukey) + '|' + key +
        '">+ Add</button></div>' : '') + '</section>';
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
  /* ── AND THE FUNCTIONS ARE ON IT (§135.5) ─────────────────────────
     Marking reaches supporting functions now, and a mark the board cannot show
     is a mark stored where nobody can see it — §61's trap, which is exactly
     what "built and unreachable" looks like from the other end. So the board
     walks the same `focusSubjects()` the marking page does, and a row's
     subject is a DESTINATION rather than a unit.

     THE WEIGHT LINE IS A UNIT'S ONLY. A function carries no weight in the
     group's score and never has (§59), so the cell says the name alone rather
     than inventing a number to keep the column tidy. */
  var subs = focusSubjects();
  var all = subs.units.concat(subs.fns);
  var live = all.filter(function(x){ return focusIn(x.key).length; });
  var totals = { over:0, met:0, short:0, none:0, total:0 };

  var body = live.map(function(sub, ui){
    var u = UNITS[sub.key], items = focusIn(sub.key);
    return items.map(function(x, i){
      var st = focusStanding(x.m.progress);
      totals[st.key]++; totals.total++;
      return '<tr class="' + (ui % 2 ? "alt " : "") + (i === 0 ? "unitstart" : "") + '">' +
        (i === 0 ? '<td class="unitcell" rowspan="' + items.length + '"><b>' + esc(sub.name) + '</b>' +
                   (u ? '<span class="why" style="margin:3px 0 0">weight ' + u.weight + '%</span>'
                      : '<span class="why" style="margin:3px 0 0">supporting function</span>') +
                   '</td>' : '') +
        '<td>' + esc(x.m.name) + '</td>' +
        '<td class="cc"><span class="why" style="margin:0">' + esc(x.src) + '</span></td>' +
        '<td class="num">' + (x.m.target ? esc(x.m.target) : '<span class="missing">Missing</span>') + '</td>' +
        '<td class="num">' + esc(x.m.actual) + '</td>' +
        '<td class="num final">' + pct(x.m.progress) + '</td>' +
        '<td class="cc"><span class="badge b-' + st.key + '">' + st.label + '</span></td></tr>';
    }).join("");
  }).join("");

  var unmarked = all.filter(function(x){ return !focusIn(x.key).length; })
                    .map(function(x){ return x.name; });

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
      '<div class="fmean">' + live.length + ' of ' + all.length + ' marked</div>' +
    '</div></div>' +

    section("", "Focus measures", null,
      (totals.total
        ? '<div class="cfg"><table class="board"><thead><tr>' +
            '<th style="width:16%">Where</th><th>Focus measure</th>' +
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
        ? '<div class="note"><b>' + plural(unmarked.length, "place") +
          (unmarked.length > 1 ? ' have' : ' has') + ' nothing marked.</b> ' + unmarked.map(esc).join(", ") +
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
    /* §248: a tactic measured by its OUTCOME is asked for the outcome's
       figure, in the outcome's own unit, and stores it in `outActual` — never
       in `actual`, which has always meant "% delivered" and is what every
       closed cycle and every archive hold. Same box, different field, and the
       tactic falls back to the old question until its outcome has a target. */
    var oc  = isT ? outcomeOf(x.obj) : null;
    var fld = oc ? "outActual" : "actual";
    var unit = oc ? splitTarget(oc.target).unit : (isT ? "%" : splitTarget(x.obj.target).unit);
    var cur = x.obj[fld], has = cur != null && cur !== "";
    var shown = !has ? "" : ((isT && !oc) ? String(cur) : splitTarget(cur).value || String(cur));
    /* Per ROW, not per page. A contributor is limited to the lines they are
       named on (spec 006 §7.2); a figure with a SOURCE is entered by that
       source and by nobody in the unit (§16.7). Both are refused by the
       server, so neither is offered here. */
    if (!canEnterFigure(u.ukey, x)) {
      var src = srcOf(x), lab = src ? srcLabel(x) : "";
      return '<span class="mono' + (src ? " sourced" : "") + '">' +
        (has ? esc(cur) + ((isT && !oc) ? "%" : "") : "\u2014") + '</span>' +
        (src ? ' <span class="srcby" title="Set by ' + esc(lab) + '">' + esc(lab) + '</span>' : '');
    }
    return '<span class="entry' + (has ? " filled" : "") + '">' +
      '<input class="field" data-rep="' + x.id + '" data-fld="' + fld +
      '" data-unit="' + esc(unit) + '" value="' + esc(shown) +
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
    /* §233: a hidden row is not asked, so it is not drawn here — the same
       skip reportItems() makes, or the pane would collect a figure the
       submit gate no longer waits on. */
    var ms = [];
    SMPRules.shown(p.measures).forEach(function(m){ ms.push({ id:m.id, obj:m, kind:"measure" }); });
    var ts = [];
    SMPRules.shown(p.tactics).forEach(function(t){
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
        /* §248: the Outcome takes a column here too, so somebody entering a
           figure can see what they are being measured against without leaving
           the page. It is a PLAN fact, so a row outside this cycle still shows
           its outcome — the cycle decides what is asked for, not what the plan
           says. */
        miniTable(["#", "Tactic", "Outcome", "Owner", "Quarters", "YTD Target", "Reported", "Note"],
          ts.map(function(x, i){
            var nameCell = '<td><b class="tacname">' + esc(x.obj.name) + '</b>' +
              (x.obj.description ? '<span class="why">' + esc(x.obj.description) + '</span>' : '') +
              '</td><td>' + outcomeCell(x.obj) + '</td>';
            if (!x.asked) {
              return '<tr class="notdue"><td class="idx">' + (i+1) + '</td>' +
                nameCell + '<td>' + esc(x.obj.owner) + '</td>' +
                '<td>' + qs(x.obj) + '</td>' +
                '<td colspan="3" class="cc"><span class="pill kind">Not asked \u2014 outside this cycle</span></td></tr>';
            }
            /* WHAT THIS ROW IS MEASURED AGAINST RIGHT NOW. An outcome answers
               with its own target — prorated where it compiles by Sum, whole
               where it does not — and says what that is a part of; everything
               else answers with the share of its plan that is due, exactly as
               it did before. */
            var bench = tacticBenchmark(x.obj);
            var whole = onOutcome(x.obj) || outcomeOf(x.obj)
              ? outcomeTargetShown(x.obj) : null;
            return '<tr' + (needsNote(x) ? ' class="wantnote"' : '') + '>' +
              '<td class="idx">' + (i+1) + '</td>' +
              nameCell + '<td>' + esc(x.obj.owner) + '</td>' +
              '<td>' + qs(x.obj) + '</td>' +
              '<td class="num">' + (bench ? esc(bench) : '<span class="nobody">&mdash;</span>') +
                (whole && whole !== bench ? '<span class="subhd">of ' + esc(whole) + '</span>' : '') +
                '</td>' +
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
        '</span>' + tally(done, total) +
        /* §250: the finished mark, on the pillar it is about. */
        doneCtl(u.ukey, p.id, p.owner)) +
      mTable + tTable;
  };

  /* Entries given of asked, per pillar \u2014 what the rail rows and the pane pill
     both read, so they can never disagree. */
  var pillarTally = function(p){
    var done = 0, total = 0;
    SMPRules.shown(p.measures).forEach(function(m){
      total++;
      if (m.actual != null && m.actual !== "") done++;
    });
    SMPRules.shown(p.tactics).forEach(function(t){
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
    pillars = railWorthIt(u.items)
      ? '<div class="split">' + rail + '<div class="pane">' + pane + '</div></div>'
      : '<div class="pane">' + pane + '</div>';
  }

  /* Published to the chrome rather than drawn here (§150): the shell reads
     REPORT_CHROME after this render and hangs it on the tab row, the same
     trip PAGE_TOOLS already makes. */
  /* §250: what a bounded reporter is told in place of "View only" — built
     from the SAME pillarTally() the rail rows read, so the chip and the rail
     can never disagree about how much is entered. */
  REPORT_CHROME = repChrome(u.ukey, c.done, c.total, pctDone, mayAll, subd,
                            reportParked(u.ukey), submitWhyShort(u.ukey),
    !boundedReporter(u.ukey) ? null : ownStateChip(u.ukey, (u.items || []).map(function(p, pi){
      var t = pillarTally(p);
      return { id:p.id, code:pillarCode(u, pi), owner:p.owner,
               done:t.done, total:t.total };
    }), L("pillar","bu").toLowerCase()));
  var bar = "";

  var summary =
    '<h4 class="mini">The owner\'s note on this cycle</h4>' +
    '<div class="card" style="padding:14px 16px">' + (mayAll
      ? '<textarea class="fld" data-unote="' + u.ukey + '" rows="3" style="width:100%;max-width:none" ' +
        'placeholder="What the numbers do not say \u2014 what happened, what is being done, what to expect next.">' +
        esc(cycleNote(u.ukey)) + '</textarea>'
      : '<span class="why" style="margin:0">' + (cycleNote(u.ukey) ? esc(cycleNote(u.ukey)) : "None.") + '</span>') +
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
/* ── WHAT EACH RAIL ACTUALLY DREW (§177.2) ────────────────────────────────
   `RAIL` holds only what somebody has PICKED, and both pickers below fall
   back to the first item — so on a page nobody has clicked, `RAIL` is empty
   while three panes are plainly on the screen. The gap walker asked `RAIL`
   whether a chip's place was showing, got "no" for a place in front of it,
   and pressed the chip for the page it was already on: "Next gap" moved
   nothing. This is the RESOLVED answer, written where the resolving happens,
   so the two cannot disagree (§53.5) — reset by the shell before each paint,
   like PAGE_TOOLS and PAGE_ACTS (§130). */
var RAIL_SHOWN = {};
/* THE PANE SAYS WHICH PLACE IT IS (§177.2). A gap chip lands on a place and
   then lights that place's first gap -- and a FUNCTION'S projects page draws
   every capability at once, so "the first gap on the page" belonged to
   whichever pane happened to be topmost and the chip for MKT03 lit a field
   in MKT02. The pane carries the same rail-and-code pair the chip does,
   built HERE so the two cannot spell it differently (§53.5). */
function gapPlaceAttr(railKey, code){
  return code == null ? "" :
    ' data-gplace="' + esc(railKey + "|" + code) + '"';
}
function railShow(k, id){ if (id != null) RAIL_SHOWN[k] = id; return id; }
function railPick(c){
  var k = railKeyFor(c), want = RAIL[k];
  var list = c.projects || [];
  if (!list.length) return null;
  for (var i = 0; i < list.length; i++)
    if (list[i].id === want) { railShow(k, list[i].id); return list[i]; }
  railShow(k, list[0].id);
  return list[0];
}
/* ── ONE ITEM STILL GETS THE RAIL (§130.2, reversing the line below) ────
   It used to read "below two items there are no siblings to move between, so
   the rail is a column of wasted width" — true about the width, and it made
   the platform lay the same page out two different ways. Islam, of a function
   whose capability holds one project: "keep the rail there to keep the
   standard view even with 1 capability either in the strategy or the
   performance or reporting."

   MARKETING SHOWED BOTH ON ONE SCREEN. Brand Positioning has two projects and
   got a rail; Product Mindset has one and did not — so two capabilities
   stacked on the same page started at two different left edges, and the second
   one read as a different kind of thing.

   THE PEN ALREADY DISAGREED WITH THE READING VIEW. renderFnProjects() has
   drawn the rail from one project since §69.13, because *Add a project* lives
   in it — so the editing view was already the "standard view" and only the
   reading view was not.

   THE ONE ANSWER, ASKED IN FOUR PLACES. A capability's projects, and a unit's
   pillars on Plan, Performance and Reporting: three of those spelled it
   `u.items.length >= 2` inline, which is exactly how a unit and a function
   come to be fine DIFFERENTLY (§53.5). Islam, asked whether this was functions
   only: "units and functions."

   STILL FALSE FOR AN EMPTY LIST, which is what keeps the `.pane`-only branch
   at each call site meaningful: nothing to list is not the same question as
   one thing to list. */
function railWorthIt(list){ return (list || []).length >= 1; }

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
/* ── COLLAPSED IS THE DEFAULT (§119) ──────────────────────────────
   Islam: "make the default view for the pillar rail to be the collapsed one."
   The rail's small line under each name carries counts and an owner — useful
   once you are deep in a plan, noise when you are looking for which pillar to
   open, and it is what makes a ten-pillar rail taller than the pane beside it.

   READ THE OTHER WAY ROUND, LIKE §104'S TWO SETTINGS: absent now means TERSE,
   so only an explicit "0" — somebody who pressed the control to bring the
   detail back — turns it off. A stored "1" from before this change still
   reads as terse, so nobody who had already collapsed it sees a change; and
   the preference stays in localStorage, per screen, never the state graph
   (§25, §47.1). */
var RAIL_TERSE = (function(){
  try { return localStorage.getItem("smp.rail.terse") !== "0"; } catch(e){ return true; }
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
function railSub(html, alarm){
  /* TERSE DROPS THE DETAIL, NEVER THE ALARM (§119). Collapsed is the default
     now, and the routine half of this line — how many measures, how many
     tactics, who owns it — is exactly what somebody scanning for a pillar does
     not need. The other half is not detail: §106.2 put the count of rows
     wanting attention HERE so the project holding them can be found without
     opening each in turn (§93.4, the count belonging where the gap is closed),
     and a default that hid it would have quietly undone that. So an `alarm`
     survives terse and the rest does not; with both, terse shows the alarm
     alone. Found by checks/project-tables.py going red on the day the default
     flipped — the rail's line was carrying two different kinds of thing and
     nothing had had to tell them apart before. */
  var body = RAIL_TERSE ? (alarm || "") : [html, alarm].filter(Boolean).join(" &middot; ");
  return body ? '<span class="rsub">' + body + '</span>' : "";
}

/* `opts` carries the two things the PLAN page's rail needs and the
   Performance page's must not have (§69.13): drag handles, and an Add row at
   the end. Optional and absent by default, so the four other callers are
   untouched — a rail that grew an Add button on Performance would be offering
   to author a plan from the page that reports against it. */
function railFor(list, sel, numOf, subOf, groupOf, footNote, codeOf, opts){
  opts = opts || {};
  /* The half of the small line that survives a collapsed rail (§119). Optional
     and last, so every existing caller is untouched. */
  var alarmOf = opts.alarmOf;
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
        /* §145.12: the row's own count of gaps to fill, for whoever can act
           on them — drawn only while it is not zero, rewritten in place as
           fills land. Optional and last, so the other callers are untouched. */
        (opts.gapOf && opts.gapOf(it)
          ? '<span class="rgap" data-rgap="pr:' + esc(it.id) + '" title="' +
            plural(opts.gapOf(it), "missing element") + ' — the fill grant can close them">' +
            opts.gapOf(it) + ' Missing</span>'
          : '') +
        /* NO NUMBER MEANS NO ELEMENT. An empty `.rnum` still takes its column in
         the row's grid, so a rail with nothing to show on the right laid its
         names out as though something were there — the unit's Plan rail, which
         has never had a number, does not render one at all. */
      (numOf ? '<span class="rnum">' + numOf(it) + '</span>' : '') +
        railSub(subOf ? subOf(it) : "", alarmOf ? alarmOf(it) : "") +
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
/* ── ONE TABLE, ONE ROW SHAPE (§104, undoing §99's split) ────────────────
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
/* ── WHAT THE SCORE COLUMN IS CALLED (§104.9) ─────────────────────────
   The two tables read their last column from two different numbers, so they
   say two different words. A deliverable or an outcome answers "how well" --
   PERFORMANCE, the word this pane's own card and the group's projects table
   already use for the same figure. A milestone answers "how far" -- PROGRESS,
   which is what a unit's page has called that number since the scoring model
   existed.

   Both were "%" for one version, which is a unit and not a name: it says what
   the cell is measured in and nothing about what it measures, on the one
   column somebody runs their eye down. Named once, because the pane, the
   reporting pane and the deck are three surfaces onto the same column and the
   third is the one that gets left behind (§59). */
var DX_PCT = "Performance";
var MS_PCT = "Progress";
function dxIsDeliv(row){ return row.kind === "d"; }
function dxType(row){
  /* PLAIN TEXT, NEVER A CHIP (§179). Islam: "for the types deliverable and
     Outcome don't make them chips let's make them normal text."

     A chip is a mark on a value that could be one of several, or one the eye
     has to pick out of a sentence. This column holds one word per row out of
     two, under a heading that already asks the question -- so the border was
     boxing the only thing in the cell. §93's ruling about the register's Unit
     chip, on a different table: "an ordinary value now."

     THE WIDTH SURVIVES THE BOX, and it is the half that was load-bearing:
     "Deliverable" and "Outcome" are seven characters apart, so left to
     themselves the column reads as two different marks rather than one
     question answered two ways -- and a column that resizes with its rows
     drags every column beside it. `.dxtype` carries that width and nothing
     else, which is why it is its own class rather than a stripped `.pill`:
     "this column has a fixed measure" and "paint a box round it" are two
     different facts, and merging them is what made removing one remove both. */
  return '<span class="dxtype">' + (dxIsDeliv(row) ? "Deliverable" : "Outcome") + '</span>';
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

   §104.8: NO SETTER. The date is off the tables and off the templates "for
   now", so nothing writes it any more -- and a setter with no caller is the
   kind of leftover §24 exists to stop. The READER stays, because the date is
   still what decides whether a row is asked for and whether it is late, for
   any plan that already carries one. */
function dxWhen(row){ return dxIsDeliv(row) ? row.obj.due : row.obj.measureAt; }
/* THE DUE-DATE CELL SAYS WHICH OF THREE THINGS IS TRUE. Overdue is red and
   loud -- past its date, unfinished, and being asked for. Not due is quiet --
   its cycle has not come, so nothing is asked and nothing is scored. On time
   is just a date. */
/* THE DUE DATE IS HIDDEN, NOT DELETED (§104.8). It still decides whether a
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
/* ── NOT DUE IS A LABEL, NOT A LOCK (§104.8) ──────────────────────
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
/* An In progress that has not said how far is OUTSTANDING, and the pane says
   so rather than leaving an empty box that reads like the optional Note beside
   it (§104.10). The same `.missing` the plan pane uses for a target nobody
   set -- one idiom for "this is owed", not a second one. */
function needsPct(){ return '<span class="missing pctneed">Needs a %</span>'; }
function reportedAny(x, d){
  return d ? !!x.status : (x.actual != null && x.actual !== "");
}
var MS_WORDS = [["", "\u2014"], ["todo", "Not started"], ["wip", "In progress"], ["done", "Completed"]];
var DX_WORDS = [["", "\u2014"], ["todo", "Not started"], ["wip", "In progress"], ["done", "Delivered"]];
/* A milestone finishing after the project's end date is saved as entered and
   said out loud. Two things might be true and the platform picks neither. */
/* ── A DUE DATE THAT IS NOT ONE, IN A PLAN ALREADY STORED (§106) ─────────
   The upload has warned about this since §103 -- "Done" and "Pending" sitting
   in a due-date column, named as what they are rather than as "invalid". But
   NOTHING HAS EVER LOOKED AT A PLAN ALREADY IN THE DATABASE, so a tenant that
   uploaded before that check existed is told nothing at all and has to find
   them by eye across every project.

   `dueFits()` is the SAME reader the upload uses and the same one the product
   asks when it decides whether a row is due (§42, in the small) -- a second
   question here would be a second definition of "a date".

   MILESTONES ONLY, deliberately. A milestone's due date is on this page and
   the pen edits it, so the note points at something that can be fixed here. A
   deliverable's due date is not drawn on any pane since §104.8, so naming a
   bad one would send somebody looking for a control that is not there (§61).
   Its only door is an upload, which already validates it. */
function badDues(p){
  return (p.milestones || []).filter(function(m){
    var v = String(m.finish == null ? "" : m.finish).trim();
    return v !== "" && !dueFits(v);
  });
}
function dueNote(p){
  var bad = badDues(p);
  if (!bad.length) return "";
  var names = bad.map(function(m){
    return '<b>' + esc(m.finish) + '</b> on ' + esc(m.name);
  }).join("; ");
  return '<div class="note bad-note"><b>' + plural(bad.length, "due date") +
    ' on this project ' + (bad.length === 1 ? "is" : "are") + ' not a date, a month or a quarter.</b> ' +
    names + '. Saved exactly as entered \u2014 the platform refuses nothing \u2014 but a date it ' +
    'cannot read is one it cannot compare, so those rows are asked for every cycle. ' +
    'The pen on this page corrects them.</div>';
}
/* How many rows on a project want attention, for the rail's small line -- so
   the project holding them can be found without opening each one in turn
   (§93.4: the count belongs where the gap is closed, and this points at the
   pane one press away rather than at another screen). */
function planAttention(p){ return badDues(p).length + projOverruns(p).length; }

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
      '<div class="headline"><span class="big" style="color:' + bandInk(ko) + '">' + pctBig(ko) + '</span></div>' +
      '<div class="minirow"><div><em>Objectives</em><b>' + c.keyObjectives.length + '</b></div>' +
        '<div><em>Weighted</em><b>' + c.keyObjectives.map(function(m){ return m.weight == null ? "\u2014" : m.weight; }).join(" / ") + '</b></div>' +
        '<div><em>Reported</em><b>' + c.keyObjectives.filter(function(m){ return m.actual != null && m.actual !== ""; }).length +
          ' / ' + c.keyObjectives.length + '</b></div></div></div>');
  }
  cards.push('<div class="card tight' + (ko == null ? " primary-card" : "") + '">' +
    '<div class="score-h"><h4>Project performance' + (ko == null ? ' <span class="rank">primary</span>' : '') + '</h4>' +
      '<span class="pill ' + band(perf) + '">' + bandWord(perf) + '</span></div>' +
    '<div class="headline"><span class="big" style="color:' + bandInk(perf) + '">' + pctBig(perf) + '</span></div>' +
    '<div class="minirow"><div><em>Deliverables</em><b>' + pct(capDeliverySide(c)) + '</b></div>' +
      '<div><em>Outcomes</em><b>' + pct(capOutcomeSide(c)) + '</b></div>' +
      '<div><em>Projects</em><b>' + c.projects.length + '</b></div></div></div>');
  /* WHAT THE FIGURE IS BUILT ON, WHEN SOME OF IT IS MISSING (§106). An In
     progress milestone with no per-cent LEAVES the average rather than
     counting as nought (§104.10) -- honest, and silent, so the figure rises
     and nothing on the card says why. `capExec()` has returned the count since
     that section and nothing showed it. Only drawn when there is one: a card
     that always says "0 outstanding" is noise on every capability that has
     nothing outstanding. */
  cards.push('<div class="card tight">' +
    '<div class="score-h"><h4>Execution</h4>' +
      '<span class="pill ' + band(ce.pct) + '">' + bandWord(ce.pct) + '</span></div>' +
    '<div class="headline"><span class="big" style="color:' + bandInk(ce.pct) + '">' + pctBig(ce.pct) + '</span>' +
      '<span class="ofplan">' + ce.done + ' of ' + ce.total + ' milestones' +
        (ce.pending ? ' &middot; <span class="missing">' + ce.pending +
          ' not counted yet</span>' : '') + '</span></div>' +
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
          '<td class="cc">' + dirCell(m.dir) + '</td>' +
          '<td class="num">' + (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</td>' +
          '<td class="num">' + (m.actual == null || m.actual === "" ? "&mdash;" : figShown(m)) + '</td>' +
          '<td class="num final" style="color:' + bandInk(m.progress) + '">' + pct(m.progress) + '</td></tr>';
      }).join(""));
}

function projPerformanceBody(p, fk){
  /* Status holds the WORD for a deliverable and the FIGURE for an outcome --
     both are "what was reported" -- and % holds the number the score is built
     from, for both, so the score column runs down one edge (§104). */
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
        ' style="color:' + bandInk(reads) + '"') + '>' +
        (statusPending(o) ? needsPct()
          : has ? pct(reads) : (notDue ? notDueCell() : "&mdash;")) + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    var v = msReads(m), quiet = !dueThisCycle(m.finish) && !m.status;
    return '<tr' + (quiet ? ' class="notdue"' : '') + '>' +
      '<td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + esc(m.owner || "\u2014") + '</td>' +
      /* \u00a7224: the same read the tactics table gives Performance \u2014 who supports
         the row, em-dash when nobody (\u00a715.1: absent, never an alarm). */
      '<td class="collabs">' + collabCell(m) + '</td>' +
      '<td class="cc">' + dxDate(m.finish, m.status === "done") + '</td>' +
      '<td class="cc">' + (quiet ? notDueCell() : msPill(m)) + '</td>' +
      '<td class="num final">' + (statusPending(m) ? needsPct()
        : quiet ? notDueCell() : (v == null ? "&mdash;" : v + "%")) +
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
    miniTable(["#","Deliverables &amp; outcomes","Type","Target","Status",DX_PCT], dxr) +
    '<h4 class="mini">Milestones <em>' + mst.done + ' of ' + mst.total + ' completed</em></h4>' +
    miniTable(["#","Milestone","Owner","Collabs.","Due date","Status",MS_PCT], mRows);
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
  /* And the person who could give it one is offered the act, not only the
     directions (\u00a7118's audit, \u00a761's rule): the button re-asks the shared
     rule on the click, because this note has no pen to gate it. */
  return '<div class="note">' + esc(f ? f.name : "This function") +
    ' improves no capability yet, so there is nothing here to plan or report. ' +
    (mayAuthor("k_found", "fn:" + fk)
      ? '<button class="linkbu" data-fncapadd="' + esc(fk) + '">Add its first capability</button> &mdash; ' +
        'or allocate one on <b>Setup \u2192 Capabilities</b>, or set this function to plan in ' +
        L("pillar", "bu").toLowerCase() + ' on <b>Setup \u2192 Functions</b>.'
      : 'Allocate one on <b>Setup \u2192 Capabilities</b>, or set this function to plan ' +
        'in ' + L("pillar", "bu").toLowerCase() + ' on <b>Setup \u2192 Functions</b>.') + '</div>';
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
  return '<div class="pageact">' + presentMenu("fn", fk) + '</div>' +
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
          : '<b style="color:' + bandInk(v) + '">' + v + '%</b>'; },
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
/* ── A PROJECT'S FRONT MATTER (§109) ─────────────────────────────────────
   Islam: "any project needs 3 things at its starting part which are the brief,
   stakeholders, start and end date."

   THE START AND END WERE STORED AND SHOWN NOWHERE. They appeared in exactly
   one place in the whole product -- the review deck -- so the one page that
   AUTHORS a project could not tell you when it runs. The overrun note was the
   only thing that mentioned the end date, and only when a milestone overshot
   it. That is the gap; the arrangement is the answer to it.

   ONE BOX, DIVIDED: who and when down the left, what and with whom on the
   right. Not a `<table>`, deliberately -- the platform sets a global
   `table { min-width: 620px }` so its data tables never squash, which makes any
   small table overflow its own grid track by 300px. A grid of rows has no such
   inheritance, and the labels still line up in a column, which is the whole
   reason a table was asked for.

   BOTH VALUE COLUMNS START AT THE SAME X. The left column is sized to the
   longest label there and the right to the longest label there, so "the brief
   begins where the pills begin" is a property of the grid rather than
   something that happens to be true today. */
function projFrontMatter(p, ed){
  var row = function(side, label, value){
    return '<div class="pfrow"><em>' + label + '</em><div class="pfval">' + value + '</div></div>';
  };
  var f = function(v, setter){
    return ed ? inputOr("plan", v == null ? "" : v, "", setter)
              : (v ? esc(v) : '<span class="missing">Missing</span>');
  };
  /* The pills carry their own leading margin, which is right in a sentence and
     wrong as the first thing in a cell -- `.pfval` neutralises it so the chip's
     BORDER lines up with the brief's first letter, not its text. */
  var stake = ed
    ? inputOr("plan", collabText({ collaborators: p.stakeholders }), "",
        function(v){ p.stakeholders = collabParse(v); })
    : ((p.stakeholders || []).length
        ? (p.stakeholders || []).map(function(x){
            return '<span class="pill kind">' + esc(x) + '</span>'; }).join(" ")
        : '<span class="missing">None named</span>');
  /* REPEATS (§115). Read mode shows the row only when it says something — a
     "Repeats: No" on every build-once project is noise (§41's budget, in
     words). The setter DELETES the key on the default (§50.6): a project
     unmarked and one never asked must be byte-identical. */
  var repRow = "", repVal = repeatLabel(p.repeats);
  if (ed) {
    var repOpts = ["No"].concat(REPEAT_MONTHS.map(repeatLabel));
    /* A STORED VALUE THE LIST DOES NOT OFFER IS KEPT AND OFFERED (§96.2,
       §114): `"cycle"` from before §196, or a month count somebody set on
       another deployment. Displaying it wrong, or dropping it on the first
       repaint, are both worse than one extra line in a dropdown. */
    if (repOpts.indexOf(repVal) < 0) repOpts.splice(1, 0, repVal);
    repRow = row("l", "Repeats",
      selectOr("plan", repVal, repOpts, "", function(v){
        var n = REPEAT_MONTHS.filter(function(m){ return repeatLabel(m) === v; })[0];
        if (n) p.repeats = n;
        else if (v === "Each cycle") p.repeats = "cycle";
        /* DELETED on the default (§50.6): a project unmarked and one never
           asked must be byte-identical, or every save carries a phantom
           change and a non-office save is refused for ever (§42). */
        else delete p.repeats;
      }));
  } else if (repeatsOn(p)) {
    repRow = row("l", "Repeats", esc(repVal));
  }
  return '<div class="pfront">' +
    '<div class="pfcol">' +
      /* §145 MERGED WITH §130.1: the three gap-fillable facts go through
         gapCell — the fill grant closes a Missing owner or date, the
         office's write settles, read mode carries the chip and the tick —
         and the OWNER IS A PICK, NOT A TYPED LINE, in the office's pen and
         in fill mode alike: the control hook renders §130.1's register-fed
         list while gapCell keeps the pending lifecycle. */
      row("l", "Owner", gapCell("plan", "k_proj", p, "owner", {
        ctx: { project: p },
        control: function(set, pendCls){
          return selectOr("plan", p.owner == null ? "" : p.owner,
            ownerChoices(p.owner, true), "ownersel " + (pendCls || ""), set);
        } })) +
      /* §179: A PROJECT'S SPAN IS PICKED TOO, AND IN THE SAME WORDS. Islam
         asked for `Jul 26` here after settling exactly that shape for a
         milestone's due date in §177 -- so this is that control, not a second
         way to say a date (§53.5). Every argument §177 wrote down holds: the
         comparisons the platform makes about a project's span are monthly, a
         day is precision it cannot use, and `Jan 26` reads one way in every
         country where `1/1/2026` reads two.

         AND IT WAS NOT ONLY A LOOK. A free box had collected `30/4/2026` on a
         live tenant, which `monthsOf()` cannot read at all -- so that project's
         End was, to the platform, no date, and `projOverruns()` below could
         never fire on it. `1/1/2026` beside it read as January by luck, the
         browser taking slashes month-first; `3/4/2026` would have read as
         March. With no box there is nothing to mistype (§177).

         DATES ALREADY WRITTEN ARE NOT TOUCHED. `monthPickOr` shows what is
         stored and rewrites nothing until somebody picks -- guessing whether
         `30/4/2026` means April is inventing a date (§96.2). The cost, stated
         rather than discovered: a quarter can no longer be set as a Start or
         an End, the same trade §177 took for a milestone. */
      row("l", "Start", gapCell("plan", "k_proj", p, "start", {
        ctx: { project: p },
        control: function(set, pendCls){
          return monthPickOr("plan", p.start, pendCls || "", set);
        } })) +
      row("l", "End",   gapCell("plan", "k_proj", p, "end", {
        ctx: { project: p },
        control: function(set, pendCls){
          return monthPickOr("plan", p.end, pendCls || "", set);
        } })) +
      repRow +
    '</div>' +
    '<div class="pfcol pfright">' +
      row("r", "Brief", ed ? textOr("plan", p.brief || "", "", function(v){ p.brief = v; })
                           : '<p>' + esc(p.brief || "") + '</p>') +
      row("r", "Stakeholders", stake) +
    '</div>' +
  '</div>';
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
  /* §177 TOOK THE LAST TWO CALLERS OF THE LOCAL `f`: an outcome's target and
     a milestone's due date both go through gapCell now, so the helper had no
     caller left and is gone rather than left lying about (§24). */
  var sortAttr = function(kind){
    return on ? ' class="sortable" data-item="tr" data-kind="' + kind +
      '" data-fk="' + esc(fk) + '" data-pid="' + esc(p.id) + '"' : '';
  };
  /* ONE ROW SHAPE (§104). A deliverable's direction and target are written
     for it; only its due date is its own to choose. An outcome carries all
     three. Every cell answered, and no band to keep two halves aligned. */
  var dxr = dxRows(p).map(function(row, i){
    var o = row.obj, d = dxIsDeliv(row);
    return '<tr data-oi="' + i + '"' + hidCls(o) + '><td class="idx">' +
      (on ? handle("Reorder " + o.name) : '') + '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? textOr("plan", o.name, "", function(v){ o.name = v; }) : esc(o.name)) +
        (ed ? eyeBtn(o, "plan", "k_proj") : hidChip(o)) +
        xb(d ? "deliverables" : "outcomes", o.id) + '</td>' +
      '<td class="cc">' + dxType(row) + '</td>' +
      '<td class="cc">' + dxDir(row) + '</td>' +
      /* §177: AN OUTCOME'S TARGET IS FILLABLE, A DELIVERABLE'S IS NOT.
         `dxTarget` prints a deliverable's fixed "Y/N" -- written for it, not
         asked of it (§104) -- so there is nothing there to fill; the outcome
         beside it is the cell that has been printing red Missing all along. */
      '<td class="num">' + (d ? dxTarget(row)
        : gapCell("plan", "k_proj", o, "target", { ctx: { project: p, row: o } })) +
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
    return '<tr data-oi="' + i + '"' + hidCls(m) + '><td class="idx">' +
      (on ? handle("Reorder " + m.name) : '') + '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? textOr("plan", m.name, "", function(v){ m.name = v; }) : esc(m.name)) +
        (ed ? eyeBtn(m, "plan", "k_proj") : hidChip(m)) +
        xb("milestones", m.id) + '</td>' +
      '<td>' + (ed ? textOr("plan", m.covers || "", "", function(v){ m.covers = v; })
                   : esc(m.covers || "")) + '</td>' +
      /* §177: BOTH FILLABLE, AND THE OWNER'S EM-DASH BECOMES Missing.
         A dash is the platform's word for ABSENT, which says nothing is owed
         -- a milestone with nobody against it IS owed, so it reads like every
         other gap. The owner is PICKED from the register (§130.1) and the due
         date from the month panel; gapCell keeps the pending lifecycle around
         both, and `ctx` narrows them to the project's own owner (§177). */
      '<td class="cc">' + gapCell("plan", "k_proj", m, "owner", {
          ctx: { project: p, row: m },
          control: function(set, pendCls){
            return selectOr("plan", m.owner == null ? "" : m.owner,
              ownerChoices(m.owner, true), "ownersel " + (pendCls || ""), set);
          } }) + '</td>' +
      /* §227: COLLABORATORS BESIDE THE OWNER — the tactic's cell moved over
         (§145.10, §130.1), because "similar to the tactics" is the ask and
         one shape for one word is the rule (§53.5). Ticked from the same
         register list the owner is picked from, never typed; fillable only
         while EMPTY and never counted as missing (§187 holds on both sides
         of the switch); an emptied list DELETES its key (§50.6). Being named
         here is a reporting right — namedOn() reads the row whole — which is
         why the cell sits behind the same pen as the owner. */
      '<td class="collabs">' + gapCell("plan", "k_proj", m, "collaborators", {
          ctx: { project: p, row: m }, text: collabText,
          parse: function(v){ return Array.isArray(v)
            ? v.map(function(x){ return String(x).trim(); }).filter(Boolean)
            : collabParse(v); },
          del: true,
          readEmpty: '<span class="nobody">&mdash;</span>',
          control: function(set, pendCls){
            return selectManyOr("plan", collabNames(m),
              ownerChoices(collabNames(m), false),
              "collabsel " + (pendCls || ""), set);
          } }) + '</td>' +
      '<td class="cc mp-host">' + gapCell("plan", "k_proj", m, "finish", {
          ctx: { project: p, row: m },
          control: function(set, pendCls){
            return monthPickOr("plan", m.finish, pendCls || "", set);
          } }) + '</td></tr>';
  }).join("") +
  (ed ? '<tr class="newrow"><td class="idx">+</td><td colspan="5">' +
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
  /* THE BAND IS IDENTITY, THE BLOCK IS THE FACTS (§109). The owner moved into
     the front matter below, and the Timeline pill is GONE -- not relocated.
     Islam asked what it was for and the honest answer was almost nothing: it
     once decided how every date on the project was read, §104 ended that
     (either form is right on any row), and the only thing it still gated was
     projOverruns(), which needs two parseable dates and gives up without them
     anyway. Its one remaining effect was to SUPPRESS a true overrun warning on
     a project marked "By quarter" whose end date happened to be a date. The
     field is untouched in the data and on the import template; what goes is a
     pill nobody could act on. */
  /* ── AND THE SAVE TRAVELS WITH THE BAND (§194.2) ────────────────────
     Islam: *"when I scroll down the freezed banner doesn't contain the save
     button which should be there."* §194 pinned the head and put the pen
     INSIDE it — on a UNIT's pillar. A capability's project pane builds its own
     band, and `.pane > .pband` has been sticky since §53.7, so the band pinned
     correctly and the pen did not: `paneActs` is `position:absolute` against
     the PANE, so it scrolled away while the band stayed. The identity froze
     and the way to save went with the page.

     §53.5, and the reason it keeps being worth saying: two panes doing the
     same job wore one header (§51.3) and then drifted the moment one of them
     learned something. In edit mode the acts go in the band's own right slot,
     so the pair cannot separate again; READING is untouched, where the pen
     sits in the pane's corner and has nothing to stay level with. */
  var acts = paneActs("plan", "u_plan");
  var band = ed
    ? '<div class="pband edband"><span class="pband-code">' + esc(projCode(fk, p)) + '</span>' +
        '<span class="pband-name">' +
          textOr("plan", p.name, "", function(v){ p.name = v; }) + '</span>' +
        /* The pillar head's own control on the project's band (§232, §53.5:
           a unit and a function are the same product). The id alone is the
           address — capOfProjectId() resolves the holder at press time. */
        '<button class="rmplan" data-rmrow="project|' + esc(p.id) +
          '">Remove this project</button>' +
        (acts ? '<span class="pband-r">' + acts + '</span>' : '') + '</div>'
    /* §192: the pending count left this slot for the totals row above — it
       was the SUBJECT's number on one pillar's band, printing under the fill
       button. `pendBadge()` is deleted rather than left uncalled (§24). */
    : pillarBand(projCode(fk, p), p.name) + acts;
  return band +
    projFrontMatter(p, ed) +
    '<h4 class="mini">' + DX_HEADING +
      ' <em>\u2014 what the project hands over, and what it is meant to change</em></h4>' +
    miniTable(["#","Deliverables &amp; outcomes","Type","Direction","Target"], dxr) +
    '<h4 class="mini">Milestones <em>\u2014 the timeline as planned</em></h4>' +
    /* NAME, THEN DESCRIPTION (§103). Islam: "we need the milestone name before
       the description." So the pair stays -- a milestone is identified by a
       short name and explained by a line under it -- and only the LABEL
       changes: "What it covers" was a question, "Description" is the word the
       tactics sheet has always used for the same thing. The stored field keeps
       its spelling (§58, §65): `covers` is an identifier, this is a label. */
    /* "Collabs." — the word the tactics column wears on every surface
       (§53.5), and the whole 11px the full word cost a 515px pane at 830. */
    miniTable(["#","Milestone","Description","Owner","Collabs.","Due date"], mRows) +
    dueNote(p) + overrunNote(p);
}

/* THE "PLANS UNDER …" LINE IS GONE (§214.3). Islam: *"in the merchandising
   remove the line that's talking about the Retail aspiration … I will think
   later how to edit it, let's remove it for them to avoid any confusion."*

   It was information rather than a description (rule 1b-ii) and it is still a
   fact worth stating — where a supporting function's aspiration and SWOT
   actually live is said nowhere else. What it is NOT is settled wording, and a
   sentence nobody has settled, sitting at the top of a page people are filling
   in, is a question mark rather than an answer. Removed whole rather than
   reworded on his behalf, and its builder is DELETED rather than left with no
   callers (§24) — so bringing it back is a decision somebody makes, not a
   line somebody finds.

   RECORDED AS OUTSTANDING, not closed: nothing on either of a supporting
   function's pages now says its strategy is the parent unit's. */
function renderFnProjects(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  if (fnPlansInPillars(FUNCTIONS[fk])) return renderUnitPlan(fnAsUnit(fk));
  if (!caps.length) return fnNothingBehind(fk);
  var ed = projEditing(), on = projArranging(fk);
  /* Gone here for the same reason and in the same breath (§94.15, §53.5):
     a unit and a function are the same product, and a button removed from one
     side of the navigation switch and left on the other is exactly the drift
     that rule exists to stop. */
  return fillBarOr("plan", "k_proj",
      caps.reduce(function(a, c){
        return a + (c.projects || []).reduce(function(b, p){
          return b + SMPRules.gapMissing("project", p).length; }, 0); }, 0),
      "the projects") + caps.map(function(c){
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
      function(p){
        return plural(p.deliverables.length, "deliverable") + ' &middot; ' +
          plural(p.outcomes.length, "outcome") + ' &middot; ' +
          plural(p.milestones.length, "milestone"); },
      null, null,
      function(p){ return projCode(fk, p); },
      { arranging: on, add: ed, capId: c.id,
        /* Appended to the SUB line, never passed as `numOf`: that argument
           puts a `.rnum` on EVERY row and an empty one still takes its column
           in the grid (the note on railFor says so). */
        alarmOf: function(p){
          var n = planAttention(p);
          return n ? '<span class="missing">' + plural(n, "row") + ' to check</span>' : ''; },
        gapOf: (typeof seesGaps === "function" && seesGaps())
          ? function(p){ return SMPRules.gapMissing("project", p).length; }
          : null });
    /* splitOrPane() drops the rail below railWorthIt()'s threshold, which is
       right for reading and wrong while a plan is being authored: with one
       project there would be nowhere to press Add. */
    var pane = projPlanBody(sel, fk);
    return capBand(c) + '<div class="capbody"' +
        gapPlaceAttr(railKeyFor(c), sel.id) + '>' +
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
/* THE PER-CENT AN IN-PROGRESS ROW REQUIRES (§104). Its own field rather than
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

/* PER ROW SINCE §147.7, because two bounded roles meet on one project: its
   OWNER reaches every row, while a milestone's owner (a Contributor, once
   that row is opened) reaches their milestone and nothing beside it — so one
   `may` for the pane would either over-offer or under-offer. Each control
   asks canReportFnRow(), which is the server's own reach rule (§42). */
function projReportBody(p, fk){
  var r = projReported(p);
  var mayRow = function(o){ return canReportFnRow(fk, p, o); };
  /* THE PANE SOMEBODY FILLS IN UNDER TIME PRESSURE, and the widest table in
     the product at eight columns -- the honest cost of one row shape carrying
     Type, Due date, Target, Status, % and Note (§104).

     A deliverable PICKS a status and the per-cent follows: 100 for Delivered,
     0 for Not started, a box only for In progress, which is the whole of "in
     progress requires a % of completion". An outcome TYPES a figure and its
     per-cent is computed against the target -- shown, never typed.

     A ROW NOT DUE THIS CYCLE IS NOT ASKED, and says so rather than sitting
     there as an empty box somebody forgot -- but THE CONTROL IS STILL THERE,
     because anyone who wants to report early may (§104.8). That sentence was
     written here first and the code under it did the opposite for a version:
     it replaced the picker with the word, so the one act the sentence
     promised was the one act the pane refused. The word now sits where the
     READING would be, and steps aside the moment there is one. */
  var dxr = dxRows(p).map(function(row, i){
    var o = row.obj, d = dxIsDeliv(row), when = dxWhen(row);
    var notDue = d ? !dueThisCycle(when) : !outcomeDue(o);
    var has = reportedAny(o, d), quiet = notDue && !has;
    var mayR = mayRow(o);
    var ent, pcell;
    if (d) {
      ent = capPickBox(o, mayR, DX_WORDS, o.status);
      pcell = o.status === "wip" ? capPctBox(o, mayR, o.name) + (statusPending(o) ? needsPct() : "")
        : (has ? '<b>' + statusReads(o) + '%</b>'
               : (notDue ? notDueCell() : '<b>&mdash;</b>'));
    } else {
      ent = capEntryBox(o, splitTarget(String(o.target)).unit, mayR, o.name);
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
      '<td class="notecol">' + capNoteBox(o, mayR) + '</td></tr>';
  }).join("");
  var mRows = p.milestones.map(function(m, i){
    var notDue = !dueThisCycle(m.finish), quiet = notDue && !m.status;
    var mayM = mayRow(m);
    return '<tr' + (quiet ? ' class="notdue"' : '') + '><td class="idx">' + (i+1) + '</td>' +
      '<td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + dxDate(m.finish, m.status === "done") + '</td>' +
      '<td class="cc">' + capPickBox(m, mayM, MS_WORDS, m.status) + '</td>' +
      '<td class="cc">' + (m.status === "wip"
        ? capPctBox(m, mayM, m.name) + (statusPending(m) ? needsPct() : "")
        : (m.status ? '<b>' + msReads(m) + '%</b>'
                    : (notDue ? notDueCell() : '<b>&mdash;</b>'))) + '</td>' +
      '<td class="notecol">' + capNoteBox(m, mayM) + '</td></tr>';
  }).join("");
  return pillarBand(projCode(fk, p), p.name,
      '<span class="pill ' + (r.done >= r.total ? "good" : "attn") + '">' + r.done + ' / ' + r.total + '</span>' +
      /* §250: the finished mark, on the project it is about. */
      doneCtl("fn:" + fk, p.id, p.owner)) +
    '<h4 class="mini">' + DX_HEADING + '</h4>' +
    miniTable(["#","Deliverables &amp; outcomes","Type","Target","Status",DX_PCT,"Note"], dxr) +
    '<h4 class="mini">Milestones</h4>' +
    miniTable(["#","Milestone","Due date","Status",MS_PCT,"Note"], mRows);
}

function capReportBody(c){
  /* Same two gates as a unit's reporting: the cycle has to be open AND
     unlocked, or the server refuses the figures the page is inviting. */
  /* inOffice(), not hasRole("super") — the TENTH place meaning "the office"
     (§89, found in §94). A unit's Reporting page has asked it this way since
     §89; a function's had not, so an SMO team member could report past a
     locked cycle on one side of the navigation switch and not the other
     (§53.5). The server was on `super` for both and refused either way. */
  /* ONE gate per surface since §130: canReportFn() is the three gates that
     were inline here; the capability's OWN rows ask the whole-function
     question, because a project owner speaks for their project and a
     capability's key objectives belong to no project. Each project asks for
     ITSELF, below, through the same pair the server enforces. */
  var may = canReportFnWhole(c.fn);
  var kRows = c.keyObjectives.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td>' + esc(m.name) + '</td>' +
      '<td class="cc">' + dirCell(m.dir) + '</td>' +
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
    splitOrPane(c.projects, sel, rail, projReportBody(sel, c.fn));
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
  /* ── A FUNCTION SUBMITS, AND IT ALWAYS COULD (§105) ──────────────────
     Every other half of this was already built: `canSpeakFor()` answers for an
     `fn:` target, `CURRENT_REPORT_KEY` is already that string,
     `reportSectionState()` already draws the Submitted badge from it, and
     `lib/authorize.js` already classifies the change as `reportState` with an
     explicit `fn:` branch. THE CONTROL WAS NEVER DRAWN -- §71's fault exactly,
     which is why `reportPending()` has been putting a dot on this tab saying a
     submission was owed with nothing on the page that would clear it (§69.9,
     broken by the rule that wrote it).

     The target is the `fn:<key>` string and not the bare key: it is what every
     one of those five already expects, and a second key shape would mean a
     second answer everywhere. */
  var fnKeyTarget = "fn:" + fk;
  var mayAll = canSpeakFor(fnKeyTarget), subd = !!(REVIEW.submitted || {})[fnKeyTarget];
  /* The same box the unit's report publishes (§150, §53.5) — one builder, so
     the two sides cannot explain the same state differently. */
  /* §250: the same chip the unit's bar carries, over this function's
     projects. A function that plans in PILLARS never reaches here — it
     returned above through `renderReport(fnAsUnit(fk))`, the unit's own path,
     which carries the chip and the band control already (§59: one shape, one
     answer, and no second copy of either). */
  var ownList = [];
  caps.forEach(function(c){
    (c.projects || []).forEach(function(p){
      var r = projReported(p);
      ownList.push({ id:p.id, code:projCode(fk, p), owner:p.owner,
                     done:r.done, total:r.total });
    });
  });
  REPORT_CHROME = repChrome(fnKeyTarget, done, total, pctDone, mayAll, subd,
                            reportParked(fnKeyTarget), submitWhyShort(fnKeyTarget),
    !boundedReporter(fnKeyTarget) ? null
      : ownStateChip(fnKeyTarget, ownList, "projects"));
  var bar = "";
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
  var k = unitRailKey(u), want = RAIL[k], list = u.items || [];
  if (!list.length) return null;
  for (var i = 0; i < list.length; i++)
    if (list[i].code === want) { railShow(k, list[i].code); return list[i]; }
  railShow(k, list[0].code);
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
    /* §145.12: which pillar owes what, for the people who can act on it —
       drawn only while it owes something (§41's budget), and rewritten in
       place as fills land (gapBandRefresh finds it by data-rgap). */
    var gaps = 0;
    if (typeof seesGaps === "function" && seesGaps()) {
      (it.measures || []).forEach(function(m){ gaps += SMPRules.gapMissing("measure", m).length; });
      (it.tactics  || []).forEach(function(x){ gaps += SMPRules.gapMissing("tactic", x).length; });
    }
    return '<button class="ritem' + (it.code === sel.code ? " on" : "") + '" data-urail="' +
        esc(u.ukey) + '|' + esc(it.code) + '" data-oi="' + i + '">' +
        (on ? handle("Reorder " + it.name) : '') +
        railName(pillarCode(u, i), it.name) +
        (gaps ? '<span class="rgap" data-rgap="p:' + esc(it.code || String(i)) +
          '" title="' + plural(gaps, "missing element") + ' — the fill grant can close them">' +
          gaps + ' Missing</span>' : '') +
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
/* ── THE CONTROL SITS ON THE BOX IT IS ABOUT (§250) ────────────────────
   Islam, generally, in §190: *"make generally the dismiss under the box with
   the issue"* — and §192 said the same of a count that could not take you to
   what it counted. A finished mark is about ONE project, so it goes in that
   project's own band, beside the tally it is a statement about.

   THE MOCKUP PUT IT IN THE REPORTING BAR AND IT MOVED, for a reason the
   mockup could not show: a supporting function draws EVERY capability at
   once, each with its own project rail, so a single control in the bar would
   have to guess which project it meant — and a person who owns projects in
   two capabilities would find one of them unreachable (§147.7 names that
   trade: one `may` for the pane either over-offers or under-offers). In the
   band there is nothing to guess. The bar still stops lying; it carries the
   state (`ownStateChip` below) and no longer the control.

   NO NEW VOCABULARY: `Mark done` is the ordinary small button every pen bar
   wears, and marked reads as the pill-and-way-back pair the report already
   uses for Submitted · Reopen. Nothing new in the stylesheets. */
function doneCtl(target, id, owner){
  if (!mayMarkDoneOn(target, owner)) return "";
  var on = !!doneMark(id);
  var addr = esc(String(id));
  return on
    ? '<span class="pill good" title="Marked finished. The report is still open ' +
      '— figures can still be entered.">Done</span>' +
      '<button class="linkbu" data-rowdone="' + addr + '|0">Undo</button>'
    : '<button class="editbtn" data-rowdone="' + addr + '|1" ' +
      'title="Tells whoever submits the report that your part is finished. ' +
      'It does not close anything.">Mark done</button>';
}

/* ── AND THE BAR STOPS SAYING "View only" TO SOMEBODY WHO REPORTS (§250) ──
   `repChrome`'s pill is drawn from `canSpeakFor()` — may this person SUBMIT —
   so a project owner with twelve live boxes beneath it was told the page was
   read-only. This is what stands in that slot for anybody who reports here
   through bounded roles alone: their own container's state where they own
   one, a count where they own several, and the plain fact where they own none
   but still report rows that name them.

   `list` is `[{id, code, owner, done, total}]`, built by each caller from the
   containers that caller already tallies, so the chip can never disagree with
   the rail beside it (§53.5). */
function ownStateChip(target, list, word){
  var mine = (list || []).filter(function(c){ return mayMarkDoneOn(target, c.owner); });
  var submits = String(target).indexOf("fn:") === 0 ? "function's" : "unit's";
  var tip = 'You report your own rows. The ' + submits +
            ' custodian submits the report.';
  /* ── A CLOSED REPORT SAYS SO TO THEM TOO (§250.2) ─────────────────
     §220 disables every control in the pane the moment the report is
     submitted or parked — and the word that explains it, `Submitted` /
     `Draft saved`, lives in `repChrome`'s OTHER branch, the one a bounded
     role never reaches. So the whole page went grey with nothing anywhere
     saying why: before §250 that slot read *View only*, which is no
     explanation either, and this section owns the slot now. The word is the
     same word (§53.5) and the way back is NOT offered — reopening speaks for
     the whole subject, which is exactly what a bounded role does not do. */
  /* ONE WORD, and never a second one beside it: the first build put a
     `Closed` pill next to it and the bar then read *Closed · Close*, one
     letter apart and meaning different things — §87's twins in the chrome.
     The word says the state, the hover says who can undo it. */
  if (reportClosed(target)) {
    var subd = !!(REVIEW.submitted || {})[String(target)];
    return '<span class="rc-state ' + (subd ? 'done' : 'draft') + '" title="' +
      esc('The report is closed — the ' + submits + ' custodian reopens it.') +
      '">' + (subd ? 'Submitted' : 'Draft saved') + '</span>';
  }
  if (!mine.length)
    return '<span class="pill none" title="' + esc(tip) + '">Your rows only</span>';
  if (mine.length === 1) {
    var c = mine[0];
    return doneMark(c.id)
      ? '<span class="rc-state done" title="' + esc(tip) + '">' +
        esc(c.code) + ' · Done</span>'
      : '<span class="rc-state draft" title="' + esc(tip) + '">' +
        esc(c.code) + ' · ' + c.done + ' of ' + c.total + ' entered</span>';
  }
  var n = mine.filter(function(c){ return !!doneMark(c.id); }).length;
  return '<span class="rc-state ' + (n >= mine.length ? "done" : "draft") +
    /* NEVER `plural()` HERE (§107.8, and §160.6 for the second time): a
       tenant's label is already plural — `L("pillar","bu")` is "Pillars" —
       so plural() would print "2 pillarss". This branch only runs at two or
       more, so the count and the label as given are always right. */
    '" title="' + esc(tip) + '">Your ' + mine.length + ' ' + esc(word) +
    ' · ' + n + ' of ' + mine.length + ' done</span>';
}

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
  /* §177: WHERE THIS ROW SITS, for the bounded roles. A pillar owner reaches
     the rows of the pillar whose Owner names them; a contributor reaches the
     rows that name them. Same shape §147.7 hands the authoriser, so the two
     sides answer with one voice. */
  var pctx = function(row){ return { pillarOwner: it.owner, row: row }; };
  /* §201.2: does this table carry a Unit column right now? The office's pen
     always; a filler's only while some row has a missing unit to offer. */
  var unitCol = !ed && it.measures.some(function(m){
    return fillUnitOffered("plan", "u_plan", m, pctx(m)); });
  var mRows = it.measures.map(function(m, i){
    return '<tr data-oi="' + i + '"' + hidCls(m) + '><td class="idx">' +
      (on ? handle("Reorder " + m.name) : '') +
      '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? textOr("plan", m.name, "", function(v){ m.name = v; }) : esc(m.name)) +
        (ed ? eyeBtn(m, "plan", "u_plan") : hidChip(m)) +
        xb("measures", m.id) + '</td>' +
      /* EDITABLE SINCE §114, reversing §31's read-only. That section closed the
         direction and the compile rule because "they change what a figure
         MEANS" — the right worry while the pen could fall to the person being
         measured, and §94 ended that: the pen is the office's. What was left
         was the office unable to correct exactly the fields that most need
         correcting after an upload. The vocabulary is the Temple's own
         (selectOr, same options), never a second list (§53.5) — and a value
         already stored that is NOT in the list is prepended rather than
         silently displayed wrong (§96.2: the display must not disagree with
         the data). */
      /* \u00a7130: the three gap-fillable cells go through gapCell in EVERY mode \u2014
         the office's setter lifts the pending mark (correcting confirms), the
         fill grant reaches only a blank or a still-pending value, and read
         mode carries the chip and the office's tick. \u00a7114's prepend rule for
         an out-of-list stored value lives inside gapCell now, and \u00a7148's
         hover words come back through `read`. */
      '<td class="cc">' + gapCell("plan", "u_plan", m, "dir",
        { ctx:pctx(m), kind:"select", opts:["\u2265","\u2264"], cls:"mono", read:dirCell }) + '</td>' +
      /* §199.5: THE SAME UNIT PICKER AS A KEY OBJECTIVE'S. Islam, of the
         measures: *"let's do the same fix."* They have the identical shape —
         76 of them across the plan, the unit typed into the target — so they
         get the identical control, from the identical functions. Two tables
         asking one question must not answer it twice (§53.5), which is why
         `targetUnitOf`/`setTargetUnit` lost their `ko` prefix rather than
         being copied.

         THE PEN ONLY, exactly as on a key objective: a unit is not a gap, so
         it does not go through gapCell and does not join the count. The
         READING table (measureRows) is untouched — it prints `esc(m.target)`,
         the whole string, which is where §199.4 put the unit back. */
      (ed
        ? '<td class="cc">' + (hasTargetToHoldAUnit(m)
            ? selectOr("plan", targetUnitOf(m), targetUnitOpts(targetUnitOf(m)), "",
                function(v){ setTargetUnit(m, v); })
            : '<span class="why" title="Set a target first \u2014 the unit is ' +
              'written with it">\u2014</span>') + '</td>'
        : unitCol
        /* §201.2: fill mode. The COLUMN is decided once for the whole table
           (unitCol, below) or the header and the rows stop agreeing about
           how many cells a row has; a row with nothing to offer gets the
           unit it already carries, read-only. */
        ? '<td class="cc">' + (fillUnitCell("plan", "u_plan", m, pctx(m))
            || esc(targetUnitOf(m))) + '</td>'
        : '') +
      '<td class="num">' + gapCell("plan", "u_plan", m, "target",
        { ctx:pctx(m), kind:"input", cls:"mono", parse: unitInherit(m) }) + '</td>' +
      /* NO 3-YEAR COLUMN. Islam, 2026-08-22: "in the direction plans the key
         measures are for 1 year only". A pillar's key measures carry one
         target and it is this year's; the three-year horizon belongs to the
         unit's KEY OBJECTIVES, which are a different table on a different page
         and keep theirs. `target3y` is still stored and still travels through
         import, export and the archive — this removes a column, not a field,
         so nothing a plan already carries is lost. */
      '<td class="cc">' + gapCell("plan", "u_plan", m, "compile",
        { ctx:pctx(m), kind:"select", opts:["Sum","Latest","Average"],
          readEmpty:"\u2014", read:compileCell }) + '</td></tr>';
  }).join("");
  var tRows = it.tactics.map(function(t, i){
    /* §249: THE CELL ASKS WHETHER IT DREW THE FOUR BOXES, rather than
       predicting it. `.tgtcell` is what stops the Target column folding below
       880 (arrange.css) and the fold must never take the only way to SET a
       target off the screen (§61) — which was true of the pen and is now true
       of fill mode as well. Re-deriving gapCell's own open-or-read decision
       here would be a second copy of it, and the two would drift the first
       time either moved (§53.5); the control hook runs when and only when a
       control is drawn, so it can simply say so. */
    var tgtOpen = false;
    var tgtCell = gapCell("plan", "u_plan", t, "outTarget", {
      ctx: pctx(t), del: true, fillKind: "tactic",
      control: function(set, pendCls){
        tgtOpen = true;
        return outcomeEdit(t, set, pendCls, !ed);
      } });
    return '<tr data-oi="' + i + '"' + hidCls(t) + '><td class="idx">' +
      (on ? handle("Reorder " + t.name) : '') +
      '<span class="idx-n">' + (i+1) + '</span></td>' +
      '<td>' + (ed ? textOr("plan", t.name, "", function(v){ t.name = v; })
                    : '<b class="tacname">' + esc(t.name) + '</b>') +
        (ed ? eyeBtn(t, "plan", "u_plan") : hidChip(t)) +
        xb("tactics", t.id) +
        /* THE DESCRIPTION SITS UNDER THE TACTIC'S OWN NAME, in the same cell,
           on all three surfaces — Islam's choice between the two drawn
           options, and the one that keeps every control on screen while a plan
           is being written (a column made the editing table 1517px and pushed
           Quarters off the right at a 1500 window). A column here would also
           put the field in a different place on this page than on Reporting
           and Performance, which have no width for one at all.

           §158 comes free with it: seven columns fit the pane at every width,
           so nothing has to fold and no plan table scrolls sideways. */
        (ed ? textOr("plan", t.description || "", "tacdesc",
                     function(v){ setOr(t, "description", v); })
            : (t.description ? '<span class="why">' + esc(t.description) + '</span>' : '')) +
        '</td>' +
      /* WHAT IT SHOULD PRODUCE (§248), AND IT IS OWED (§249, reversing that
         section's own exclusion at Islam's direction: *"the tactics outcome
         and target ... should count as missing"*).

         `textOr` BEHIND THE HOOK, never instead of gapCell: the outcome is
         prose that must wrap (§189) — a title in an <input> is one line by
         definition and runs off the end — and it is a counted gap now, so the
         CONTROL is the hook's while the lifecycle, the red word and the walk
         mark stay gapCell's. §130.1's shape exactly, for its reason. */
      '<td>' + gapCell("plan", "u_plan", t, "outcome", {
        /* §228.2: NAMING THE KIND IS WHAT KEEPS THE TWO LISTS ONE. Without
           it the cell opens to a filler whatever the shared list says, so a
           later decision to stop counting these would leave the box open and
           the save refusing it — §205's drift, latent until somebody used it. */
        ctx: pctx(t), del: true, fillKind: "tactic",
        read: function(v){ return '<b>' + esc(v) + '</b>'; },
        control: function(set, pendCls){
          return textOr("plan", t.outcome || "", pendCls || "", set);
        } }) +
        /* The same double-render as the description one column left: below
           880 the Target column goes and its value appears here instead,
           because seven columns still run 44px past a 515px pane and §158
           does not bend.

           §249: AND THE FOLD MUST NOT SWALLOW THE GAP. This line was drawn
           only where there was a target to show, which was harmless while an
           absent one said nothing — now that the count names the place, on a
           narrow window the only column that could show it is the column that
           has gone. It says Missing here instead. */
        (!ed && !tgtOpen ? '<span class="subhd narrowtgt">' +
           (SMPRules.gapEmpty("outTarget", t)
             ? '<span class="missing">Missing</span>'
             : esc(t.outDir || "\u2265") + ' ' + esc(t.outTarget)) + '</span>' : '') +
        '</td>' +
      /* THE OUTCOME'S TARGET: reading says the target, writing gives each of
         its four facts a control of its own in one cell (Islam). §249 draws
         it through gapCell, above, so the same cell serves the office's pen,
         the filler's two boxes and the red word. */
      '<td class="' + (tgtOpen ? 'tgtcell' : 'tgtcol num') + '">' + tgtCell + '</td>' +
      /* §145 MERGED WITH §130.1: gapCell keeps the pending lifecycle and
         the read-mode Missing word; the control hook renders the register-
         fed picker — an owner is PICKED, not typed, in the pen and in fill
         mode alike. */
      '<td>' + gapCell("plan", "u_plan", t, "owner", {
        ctx:pctx(t),
        readEmpty:'<span class="missing">Missing</span>',
        control: function(set, pendCls){
          return selectOr("plan", t.owner == null ? "" : t.owner,
            ownerChoices(t.owner, true), "ownersel " + (pendCls || ""), set);
        } }) + '</td>' +
      /* THE ONE PLACE COLLABORATORS CAN BE TYPED (§50.2). Before this they
         could only arrive with the upload, so a name that changed after the
         plan landed meant re-uploading the unit to fix it. It sits under the
         SAME pen that corrects the rest of the plan, and behind the same gate
         (§31): who is named on a tactic decides who may report it, so it is
         not a field the people being measured hold. */
      /* §145.10 MERGED WITH §130.1: collaborators are FILLABLE (Islam:
         "it's optional anyway") — an EMPTY list is a gap, an existing one
         never opens to the filler, and a pending name confers no reporting
         right until the office confirms (namedOn skips marked fields) —
         AND they are TICKED FROM THE SAME LIST THE OWNER IS PICKED FROM,
         never typed: the control hook renders §130.1's multi-select in the
         pen and in fill mode alike, while gapCell keeps the lifecycle.
         Emptied, the key is DELETED rather than left as an empty array
         (`del`, §50.6): a tactic nobody supports and one never asked must
         be byte-identical, or every save carries a change nobody made.
         Read mode keeps §15.1's em-dash: nobody supporting is an ordinary
         answer. */
      '<td class="collabs">' + gapCell("plan", "u_plan", t, "collaborators",
        { ctx:pctx(t), text: collabText,
          parse: function(v){ return Array.isArray(v)
            ? v.map(function(x){ return String(x).trim(); }).filter(Boolean)
            : collabParse(v); },
          del: true,
          readEmpty: '<span class="nobody">&mdash;</span>',
          control: function(set, pendCls){
            return selectManyOr("plan", collabNames(t),
              ownerChoices(collabNames(t), false),
              "collabsel " + (pendCls || ""), set);
          } }) + '</td>' +
      /* Quarters (§145): only a tactic naming NO quarter is a gap, and while
         its fill is pending the four stay the filler's — read mode carries
         the same chip and tick every other pending value wears. */
      '<td>' + (ed ? qsEdit(t)
        : (filling("plan", "u_plan", pctx(t)) &&
           (SMPRules.quartersBlank(t) || SMPRules.pendOf(t).quarters))
          ? qsFill(t)
          : qs(t)) + '</td></tr>';
  }).join("");
  var meta = pillarMeta(it, ed);
  /* ── EDITING KEEPS ITS HEAD, AND THE NAME GETS THE LINE (§194) ──────
     Islam: *"when I edit a plan or a pillar it loses its design and the name
     box becomes very small — it can be along the line … and on editing we
     still need to maintain the pillar Code and name fixed so on scrolling
     down I can still see that save button."*

     Both halves measured on Mobile's plan at 1500px with the pen open: the
     name box was **228px** inside a pane over a thousand wide, because the
     code and the box share an `h3` inside a shrink-to-fit column; and at 480px
     of scroll the code, the name AND the Done tick were all off screen
     (top −211). Reading keeps `.pane > .pband` pinned the whole time —
     EDITING HAD NO EQUIVALENT, which is exactly what "loses its design" is.

     `edhead` is the marker, not a style: what pins is the head somebody is
     WORKING in, and reading's own band is untouched (§53.5 — one question,
     one answer, and the two are different questions). The column takes
     `flex:1` so the growing box (§189) fills the line instead of taking a
     slice of it. */
  var head = showHead
    ? '<div class="ptitle hoverpen' + (ed ? ' edhead' : '') + '"><div class="pthead"><h3>' +
        '<span class="ptcode">' + code + '</span>' +
        (ed ? textOr("plan", it.name, "ptname", function(v){ it.name = v; })
            : '&nbsp; ' + esc(it.name)) + '</h3>' +
        (meta ? '<div class="pmeta">' + meta + '</div>' : '') + '</div>' +
        kindPill(it) +
        /* ── REMOVE, WORDED, IN THE HEAD THAT PINS (§232) ──────────────
           The × removes a ROW; removing the whole pillar had no control at
           all, so the only way to take one out was re-uploading the plan.
           Beside Done because reading order is "remove, or finish", and in
           the pinned head (§194) so it is reachable from anywhere in a long
           pillar. Only while the pen is open — it follows the Strategy
           grant exactly as the pen does. The confirmation carries the
           weight; these are quiet words (mockup, signed off 2026-09-01). */
        (ed ? '<button class="rmplan" data-rmrow="pillar|' + esc(u.ukey) +
              '|' + esc(it.id) + '">Remove this ' +
              esc(L("pillar", "bu").toLowerCase().replace(/s$/, "")) +
              '</button>' : '') +
        (mayEditPlan() ? penBtn("plan", "u_plan") : '') + '</div>'
    : pillarBand(code, it.name) + paneActs("plan", "u_plan");
  return head +
    /* ── THE PILLAR'S OWNER, CORRECTABLE AT LAST (§130.1) ────────────────
       Islam, asked whether the pillar's owner should join the other four:
       "the pillar as well yes". It has been READ-ONLY EVERYWHERE since the
       pillar model existed — shown in the rail's small line and in `.pmeta`,
       and editable on no screen at all, so an owner who moved meant
       re-uploading the unit's whole plan to fix a name (§53.3's complaint,
       one field further along).

       EDIT MODE ONLY, and that is deliberate rather than lazy. In read mode
       the name is already on the page twice — the rail row says it and the
       meta line says it — and a third telling is spending the page's budget
       to repeat itself (§41). What was missing was never a place to READ it.

       THE PROJECT'S OWN FRONT MATTER, one column wide (§109). Not a new
       component: a project's Owner row and a pillar's are the same fact in
       the same place on the same kind of pane, and drawing them two ways is
       how a unit and a function come to be fine differently (§53.5). */
    (ed
      ? '<div class="pfront one"><div class="pfcol"><div class="pfrow"><em>Owner</em>' +
          '<div class="pfval">' +
          ownerSel("plan", it.owner, function(v){ it.owner = v; }) +
        '</div></div></div></div>'
      : '') +
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
    /* ── AND THE NOTE BAR IS NOT DRAWN (§194, Islam: "hide the note bar
       for now") ────────────────────────────────────────────────────────
       This was the box under Owner with no label at all — his *"the line
       under the owner has no title and I don't understand what this is."*
       It is the pillar's `sub`, hidden when reading since August (only Mobile
       ever filled it in, so a line that appeared for one pillar and not the
       others made the page jump) and left editable here on the reasoning that
       a page which cannot SHOW a field also cannot FIX it.

       Offered a label, he chose to hide it instead. **THE COST IS REAL AND
       IS THE REASON THAT REASONING EXISTED**: `sub` is still stored and now
       renders nowhere at all, so a value that arrived with an upload can no
       longer be corrected or cleared from any screen (§61's trap, entered
       deliberately and reversibly — "for now"). Nothing reads it, so nothing
       displays wrongly; it is simply out of reach.

       THE BUILDER IS DELETED, NOT COMMENTED OUT (§24) — dead code kept "for
       reference" is code the next reader has to prove is dead. Giving it back
       is one `textOr` call, and this note says where. */
    /* The "Plan only" notice went in 3.4. The tab you are on says Plan, the
       table headings say "as planned", and every actual column reads em-dash -
       three statements of the same thing above a fourth. */
    '<h4 class="mini">Key measures <em>\u2014 as planned: this year\u2019s target, and how it compiles</em></h4>' +
    /* §199.5: the Unit heading appears only with the pen, because the column
       under it does — and `addRow`'s span has to follow, or the Add row stops
       reaching the end of the table the moment somebody opens the pen. */
    miniTable((ed || unitCol) ? ["#","Measure","Dir.","Unit","Target","Compiled"]
                 : ["#","Measure","Dir.","Target","Compiled"],
      mRows + addRow((ed || unitCol) ? 6 : 5, "measure", "Add a measure"), sortAttr("measures")) +
    '<h4 class="mini">Tactics <em>\u2014 who carries it, who supports, and in which quarters</em></h4>' +
    /* §248: Description and Outcome are stored on every tactic and the upload
       has written both since the template existed — the description was
       displayed on NO screen at all and the outcome only as a grey line under
       the name. They are columns now, on the page where the plan is written.
       `addRow` spans one less than the head, as it always has. */
    /* THE TARGET FOLDS BELOW 880 AND THE HEAD FOLDS WITH ITS CELLS — decided
       here, where `ed` is known, rather than guessed at with `:nth-child`.
       Never while the pen is open: the four controls are the only way to set
       the target, so hiding them leaves a field nobody can reach (§61). */
    miniTable(["#","Tactic","Outcome",{h:"Target", cls: ed ? "" : "tgtcol"},
               "Owner","Collabs.","Quarters"],
      tRows + addRow(6, "tactic", "Add a tactic"), sortAttr("tactics"));
}
function renderUnitPlan(u){
  var sel = unitRailPick(u);
  /* AN EMPTY PAGE HAS TO SAY WHAT WOULD FILL IT (§61). This said "This unit"
     on a supporting function's own page — and only ever appeared there,
     because before §61 a function with no plan was missing from the navigation
     and there was no way to reach the sentence. */
  /* AN EMPTY PLAN IS WHERE THE FIRST PILLAR GOES (\u00a7118's audit, \u00a761's shape
     from the capability side): the note used to point at Import and offer
     nothing, and the pen had no pane to sit on \u2014 so the only way to start a
     plan here was to upload one. The button asks mayEditPlan() itself
     because there is no pen on an empty page to gate it (\u00a761's trap: the
     control's anchor is the thing that does not exist yet). */
  if (!sel) return '<div class="note">' + esc(u.name) + ' has no ' +
    L("pillar", "bu").toLowerCase() + ' yet, so there is no plan to show. ' +
    (typeof mayEditPlan === "function" && mayEditPlan()
      ? '<button class="linkbu" data-rowadd="pillar|' + esc(u.ukey) +
        '">Add the first one</button> &mdash; or upload a plan on <b>Setup \u2192 Import &amp; plans</b>.'
      : 'A plan arrives as a file: <b>Setup \u2192 Import</b>, the pillars template.') + '</div>';
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
  return fillBarOr("plan", "u_plan",
      (sel.measures || []).reduce(function(a, m){
        return a + SMPRules.gapMissing("measure", m).length; }, 0) +
      (sel.tactics || []).reduce(function(a, t){
        return a + SMPRules.gapMissing("tactic", t).length; }, 0),
      "this " + L("pillar","bu").toLowerCase().replace(/s$/, "")) +
    (arranging("unit", u.ukey)
      ? '<p class="sec-hint">' + u.items.length + ' ' + L("pillar","bu").toLowerCase() +
        ' &middot; drag by the handle to reorder, here and inside each ' +
        L("pillar","bu").toLowerCase().replace(/s$/, "") + '</p>' : '') +
    (railWorthIt(u.items)
      ? '<div class="split"' + gapPlaceAttr(unitRailKey(u), sel.code) + '>' +
          unitRailFor(u, sel) + '<div class="pane">' + unitPlanBody(sel, u, true) + '</div></div>'
      : '<div class="pane"' + gapPlaceAttr(unitRailKey(u), sel.code) + '>' +
          unitPlanBody(sel, u, false) + '</div>');
}


/* ── Capability \u2192 Strategy \u2192 Foundation ────────────────────────────
   A capability has no clauses, no aspiration and no SWOT \u2014 its foundation is
   the group's. What it does have is a definition and, where it has any, its key
   objectives. Same two-card grid a unit's Foundation uses, so the two read as
   the same page with different content.

   The third column is WEIGHT rather than a three-year target: a capability's
   objectives carry the optional weighting and have never had a horizon. */
/* ── A PILLARS FUNCTION'S OVERVIEW (§213) ─────────────────────────────
   The capability function's two cards, carried by the function itself: what
   it is, and what it is judged on. No aspiration, no SWOT, no who-we-are —
   those belong to the unit it plans under — §214.3 removed the line that
   said so, at Islam's direction, until he settles its wording.

   `def` IS A NEW FIELD ON THE FUNCTION and needs no migration: `functions`
   names six columns in `lib/state-io.js` and files everything else into
   `extra` (verified, the same route `format`, `under` and `items` already
   take). A capability has carried one since the model existed; this is the
   function finally being asked the same question. */
function fnPillarsOverview(fk){
  var f = FUNCTIONS[fk];
  if (!f) return "";
  var ed = authoring("capfoundation", "k_found");
  /* THE WRITING VIEW MINTS THE CONTAINER (§50.6). `fnAsUnit()` hands out a
     SHARED frozen empty where `keyObjectives` does not exist, so a first
     objective added against the reading view would be pushed onto an empty
     every function shares. */
  var list = (ed ? unitLikeWritable("fn:" + fk) : unitLike("fn:" + fk)).keyObjectives || [];
  /* §226: WHILE IT IS BEING WRITTEN, THE TABLE GETS THE PAGE — §96.6's rule,
     which fixed exactly this squeeze on a unit's Foundation and never reached
     the function's Overview: inside the fgrid card the Objective box measured
     101px and the Dir. select 34px at a 1500px window, which is a select whose
     value cannot be seen. Reading mode keeps the card, because the objectives
     belong beside what the function is when you are READING it. */
  var fl = filling("capfoundation", "k_found");
  var koCard = '<div class="cardhead"><h2 class="sec first">' + L("keyobj","bu") + '</h2>' +
      '<span class="pill horizon">Horizon &middot; ' + horizonLabel() + '</span></div>' +
      ((ed || fl)
        ? capKoEdit({ id:"fn:" + fk, keyObjectives:list })
        : koReadBlock(list,
            "None. This function is judged by its " +
            esc(L("pillar","bu").toLowerCase()) + "."));
  return editBar("capfoundation", "k_found") +
    fillBarOr("capfoundation", "k_found",
      list.reduce(function(a, m){
        return a + SMPRules.gapMissing("capko", m).length; }, 0),
      "the overview") +
    '<div class="fgrid">' +
      '<div class="card"><h2 class="sec first">What it is</h2><dl style="margin:0">' +
        '<div class="clause"><dt>Function</dt><dd>' + esc(f.name) + '</dd></div>' +
        /* §226: LED BY OPENS, FOR THE OFFICE (Islam: "led by by office ok").
           The picker is Setup's own assignPicker writing the SAME head pointer
           through grantPersonRole — one fact, one door (§33), so this and
           Setup › Supporting functions can never disagree. Office-only because
           the server classifies a head change as Setup (FN_SETUP), and a pen
           held by anybody else would be the screen offering what the save
           refuses (§42). The sentence is a hover, never a printed line (1b-ii). */
        '<div class="clause"><dt>Led by</dt><dd' +
          (ed && inOffice() ? ' title="Names the function’s head — the same fact the register holds"' : '') + '>' +
          (ed && inOffice()
            ? assignPicker("fn:" + fk, "fnhead", f.head || null, true)
            : (f.head ? esc(personName(f.head)) : "&mdash;")) + '</dd></div>' +
        '<div class="clause"><dt>Definition</dt><dd>' +
          /* §214: THROUGH `gapCell`, NOT `fieldOr`. The definition is a gap
             now, and a counted gap has to be typable by whoever the count is
             shown to — a fill-grant holder seeing it in the band and finding
             a read-only line is §61 exactly, and their save would be refused
             (§184). `area`, because it is a sentence.

             `gapCell` reads `row[field]`, so it never renders the word
             "undefined" the way `fieldOr(page, f.def, …)` did — that third
             argument is a CLASS, not a placeholder (§213.1, found in a
             screenshot). */
          /* §214.4: AN EM-DASH, NOT THE RED WORD. The definition stopped
             being counted, and a page printing `Missing` over a count of
             nought is the product arguing with itself (§177, sign reversed).
             `readEmpty` is the hook gapCell already carries for exactly this.
             It stays FILLABLE — the box still opens and still saves. */
          gapCell("capfoundation", "k_found", f, "def",
                  { kind:"area", readEmpty:"&mdash;", fillKind:"cap" }) +
        '</dd></div>' +
      '</dl></div>' +
      ((ed || fl) ? '' : '<div class="card">' + koCard + '</div>') +
    '</div>' +
    ((ed || fl) ? '<div class="card koband">' + koCard + '</div>' : '');
}
function renderFnFoundation(fnKey){
  var fk = fnKeyOf(fnKey), caps = capsOfFunction(fk);
  /* A SUPPORTING FUNCTION'S OVERVIEW IS A SUPPORTING FUNCTION'S OVERVIEW,
     WHICHEVER WAY IT PLANS (§213). Islam: *"what if the overview of the
     functions that plan in pillars [were] like the overview of the functions
     that plan as projects … because the function will never have an
     aspiration, will never have a foundation, but they will have maybe key
     objectives."*

     Right, and §212 had reached for the wrong neighbour: it gave this format
     a UNIT's foundation — who we are, a winning aspiration, an end in mind —
     which is the strategy the function INHERITS from the unit it plans under
     and never authors itself. What it does have is what a capability has: a
     definition, and some key objectives.

     So both formats draw the same two cards, and the only difference is what
     carries them — a capability each on one side, the function itself on the
     other. Same page key (`capfoundation`), same access key (`k_found`), same
     builder for the objectives (§53.5).

     A UNIT IS UNTOUCHED BY ALL OF THIS, deliberately and at Islam's
     instruction: `renderUnitFoundation()` is exactly what it always was, on
     `foundation`/`u_found`, and nothing here calls it. */
  if (fnPlansInPillars(FUNCTIONS[fk])) return fnPillarsOverview(fk);
  var ed = authoring("capfoundation", "k_found");
  /* §145: the fill grant opens the same editor, whose gap cells then draw
     only the blanks — Add and Remove stay the author's. */
  var fl = filling("capfoundation", "k_found");
  return editBar("capfoundation", "k_found") +
    fillBarOr("capfoundation", "k_found",
      caps.reduce(function(a, c){
        return a + (c.keyObjectives || []).reduce(function(b, m){
          return b + SMPRules.gapMissing("capko", m).length; }, 0); }, 0),
      "the overview") +
    caps.map(function(c){
    var f = functionOf(c.fn);
    /* A CAPABILITY'S OBJECTIVES CAN FINALLY BE AUTHORED HERE (§129's audit).
       They could arrive in a projects file and be READ on this page, and no
       surface in the product could write the first one — the same
       import-only trap as the SWOT and the clauses. Behind the page's own
       pen; a row minted empty carries the same shape the seed's rows have. */
    var koBlock = (ed || fl)
      ? capKoEdit(c)
      : koReadBlock(c.keyObjectives,
          "None. This capability is judged by its projects.");
    /* §226: WHILE IT IS BEING WRITTEN, THE TABLE GETS THE PAGE — the same
       band the pillars format takes, because the two formats draw ONE page
       (§53.5) and a squeeze fixed on one side of it is §211's drift back. */
    var koCard = '<div class="cardhead"><h2 class="sec first">' + L("keyobj","bu") + '</h2>' +
        '<span class="pill horizon">Horizon &middot; ' + horizonLabel() + '</span></div>' +
        koBlock;
    return capBand(c) + '<div class="capbody"><div class="fgrid">' +
      '<div class="card"><h2 class="sec first">What it is</h2><dl style="margin:0">' +
        '<div class="clause"><dt>Capability</dt><dd>' + esc(c.name) + '</dd></div>' +
        '<div class="clause"><dt>Carried by</dt><dd>' +
          esc(f ? f.name : "\u2014") +
          (f && f.head ? " \u2014 " + esc(personName(f.head)) : "") + '</dd></div>' +
        /* §214: the same fillable cell the other format's Overview draws —
           one page, one answer (§53.5), or a fill grant would reach a
           function's definition and not a capability's. */
        '<div class="clause"><dt>Definition</dt><dd>' +
          gapCell("capfoundation", "k_found", c, "def",
                  { kind:"area", readEmpty:"&mdash;", fillKind:"cap" }) + '</dd></div>' +
      '</dl></div>' +
      ((ed || fl) ? '' : '<div class="card">' + koCard + '</div>') +
    '</div>' +
    ((ed || fl) ? '<div class="card koband">' + koCard + '</div>' : '') +
    '</div>';
  }).join("") +
  /* A second capability for the same function, added where the first is
     described. addCapability() is the ONE minter (§51.11) — the Temple's
     add and this one cannot drift. */
  (ed ? '<div class="addrow"><button class="editbtn" data-fncapadd="' + esc(fk) +
    '">+ Add a capability</button></div>' : '');
}

/* ── A SUPPORTING FUNCTION'S KEY OBJECTIVES, READ (§213) ──────────────
   Lifted out of the capability branch unchanged so a capability's card and a
   pillars function's cannot drift into two answers about one table (§53.5) —
   the whole reason §211 cost a day. The empty line is the caller's, because
   what an empty list MEANS differs: a capability with none is judged by its
   projects; a function with none is judged by its pillars. */
/* ONE CELL, EVERYWHERE A FIGURE IS READ AGAINST ITS TARGET (§243). The
   shortened form is what is shown and the full one is on the hover, so nothing
   a unit reported is ever out of reach — and the decision about WHETHER to
   shorten is made once, in `figureScaled()`, rather than at nine call sites
   that would drift (§53.5). */
function figShown(m){
  var s = figureScaled(m.target, m.actual), full = figureFull(m.target, m.actual);
  return full ? '<span title="' + esc(full) + '">' + esc(s) + '</span>' : esc(s);
}
function koReadBlock(list, emptyLine){
  if (!(list || []).length)
    return '<p class="sub" style="margin:0">' + emptyLine + '</p>';
  /* §243, Islam: *"in the functions overview if there is no weights submitted
     the table shouldn't show weights."* A column of em-dashes says nothing
     except that a question was asked and not answered — and since §243 a blank
     weight is not nought but an equal share, so the column would also be
     stating a value nobody set. `.one` is the two-column shape `koView()`
     already uses when it drops a column; there is no second layout here. */
  var wtd = koWeighted(list);
  return '<div class="ohead' + (wtd ? '' : ' one') + '"><span>Objective</span>' +
      '<span>This year</span>' + (wtd ? '<span>Weight</span>' : '') + '</div>' +
    list.map(function(m){
      /* §145: the pending chips, including a direction or compile that has no
         column here — read mode is where the office's tick is. */
      /* §214.2: AN EM-DASH, NOT THE RED WORD. A function's key objectives
         stopped being counted as missing, and a page that prints `Missing`
         over a count of nought is the product arguing with itself — §177's
         own fault with the sign reversed (there the page said missing and the
         count said nothing was). The em-dash is what the Weight column beside
         it has always drawn for an absent optional value. */
      return '<div class="orow' + (wtd ? '' : ' one') +
          (SMPRules.isHidden(m) ? ' hiddenrow' : '') +
          '"><span class="on">' + esc(m.name) + hidChip(m) +
          '</span>' +
        '<span class="ot">' + (m.target ? esc(m.target) : '&mdash;') +
          '</span>' +
        (wtd ? '<span class="ot h">' + (m.weight == null ? "&mdash;" : m.weight + "%") +
          '</span>' : '') + '</div>';
    }).join("");
}
/* The capability objectives editor — koEdit's shape with the WEIGHT column a
   capability's rows actually carry, addressed by capId + index the way the
   Temple's tables are (no ids: the seed's rows never had them, and §96.4's
   rule about mixed lists says do not mint some now). */
/* §213: addressed by HOLDER id, which is a capability's `id` or `fn:<key>` for
   a function that plans in pillars — the same string `koHolderById()` resolves
   on the other side of the click, so one table serves both and the add/remove
   handlers have one thing to look up. */
function capKoEdit(c){
  var pg = "capfoundation";
  /* §145: the four gap-fillable columns through gapCell; the NAME, Remove
     and Add stay the author's — a fill-mode render draws them read-only or
     not at all. */
  var ed = authoring(pg, "k_found");
  /* §226: the same three answers the unit's table got and this one never did —
     the NAME is prose and wraps (§189's textOr; a function's objective titles
     clipped at 101px in the card this table used to edit inside), the UNIT is
     §199's column exactly (a view of the target string, nothing stored, the
     office picks it and a filler may set a MISSING one), and a bare number
     typed into This year inherits the row's unit (§199.6). The unit's own
     koEdit is deliberately untouched — Islam: "don't touch the unit side". */
  return '<div class="scroll"><table><thead><tr><th>Objective</th><th class="cc">Dir.</th>' +
    '<th class="cc">Unit</th>' +
    '<th class="cc">This year</th><th class="cc">Compile</th><th class="cc">Weight %</th><th></th></tr></thead><tbody>' +
    c.keyObjectives.map(function(m, i){
      return '<tr' + hidCls(m) + '><td>' + textOr(ed ? pg : null, m.name, "", function(v){ m.name = v; }) +
        (ed ? '' : hidChip(m)) + '</td>' +
        '<td class="cc">' + gapCell(pg, "k_found", m, "dir",
          { kind:"select", opts:["≥", "≤"] }) + '</td>' +
        '<td class="cc">' + (ed
          ? (hasTargetToHoldAUnit(m)
              ? selectOr(pg, targetUnitOf(m), targetUnitOpts(targetUnitOf(m)), "",
                  function(v){ setTargetUnit(m, v); })
              : '<span class="why" title="Set a target first — the unit is ' +
                'written with it">—</span>')
          : (fillUnitCell(pg, "k_found", m) || esc(targetUnitOf(m)))) + '</td>' +
        '<td class="cc">' + gapCell(pg, "k_found", m, "target",
          { kind:"input", cls:"mono", parse: unitInherit(m) }) + '</td>' +
        '<td class="cc">' + gapCell(pg, "k_found", m, "compile",
          { kind:"select", opts:["Sum", "Latest", "Average"] }) + '</td>' +
        '<td class="cc">' + gapCell(pg, "k_found", m, "weight",
          { kind:"input", cls:"mono", num:true }) + '</td>' +
        '<td class="cc">' + (ed ? eyeBtn(m, pg, "k_found") +
          ' <button class="rmbtn" data-capkorm="' + esc(c.id) + '|' + i +
          '">Remove</button>' : '') + '</td></tr>';
    }).join("") + '</tbody></table></div>' +
    (ed ? '<div class="addrow"><button class="editbtn" data-capkoadd="' + esc(c.id) +
      '">+ Add an objective</button></div>' : '');
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
      '<span class="rnum" style="color:' + bandInk(perf) + ';font-weight:700">' + pct(perf) + '</span>' +
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
  return railWorthIt(u.items)
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
