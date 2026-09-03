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
/* ── ONE ANSWER TO "WHICH DECK DOES THIS TARGET GET" (§253.3) ─────────
   Islam, on the live deployment: *"the manage presentation show this"* — the
   Manage slides editor open on `fn:merchandizing`, its bar drawn and the rail
   and the stage completely empty.

   §224 IS THE SAME FAULT AND IT WAS FIXED ON ONE SURFACE OF THREE. That
   section made the Present button branch on the function's FORMAT rather than
   on the `fn:` prefix, because a function that plans in PILLARS has no
   capabilities at all and the capability deck therefore has nothing to say
   about it. `slidesAssemble()` and `deckAnchors()` were both still asking by
   prefix, so Manage slides assembled a deck of ONE useless cover reading
   "Capability review · 0 capabilities" (measured on the demo), and the
   anchors it offers a picture came from that same wrong deck. §53.5: a
   question with three call sites and two answers.

   THE PAIRING IS NAMED ONCE NOW and the three surfaces ask it, so the next
   surface to want a deck cannot get a different one. `unitLike()` resolves a
   unit key and an `fn:` key in one place, exactly as the Present button has
   done since §224. */
function deckHtmlFor(target){
  var t = String(target || "");
  var fk = t.indexOf("fn:") === 0 ? t.slice(3) : null;
  if (fk && !fnPlansInPillars(FUNCTIONS[fk])) return deckSlidesFn(fk);
  var u = unitLike(t);
  return u ? deckSlides(u) : "";
}

function deckAnchors(kind, key){
  var box = document.createElement("div");
  box.innerHTML = deckHtmlFor(kind === "fn" ? "fn:" + key : key);
  var seen = {}, out = [];
  [].forEach.call(box.querySelectorAll("[data-anchor]"), function(el){
    var a = el.dataset.anchor;
    if (seen[a]) return;
    seen[a] = 1;
    out.push({ a:a, label:el.dataset.anchorLabel || a });
  });
  return out;
}

/* ── A TABLE WITH NO ROWS IS NOT A SLIDE (§253) ───────────────────────
   Islam: *"slides are showing blank pages for the merchandizing."* Measured
   on the demo before anything was changed: FOUR slides in the whole product
   render a heading, a navy column strip and then a whole empty page, and all
   four of them are Merchandising — its own deck's two objectives slides
   (a supporting function judged by its pillars legitimately carries none,
   §214.2, and the deck never learned it) and Retail's RS04, the pillar
   carried by that function, which by construction holds no measures and no
   tactics of its own.

   THE PRODUCT ALREADY KNEW THE ANSWER AND APPLIED IT TO ONE HALF.
   `deckSlidesFn` has guarded its objectives slide on
   `SMPRules.shown(c.keyObjectives).length` since it was written, which is why
   Marketing — whose two capabilities also carry no objectives — has always
   been right. The unit deck, which a pillars function goes through since
   §224, had no such guard. §53.5: one question, two answers, and the half
   left behind is the half Islam was looking at.

   ISLAM RULED IT FOR ANY SUBJECT, not only a function: *"drop them on any
   subject with none"*, reversing the narrower rule recommended to him (that a
   unit keep its empty slides, because a unit AUTHORS objectives and an empty
   table there is a plan not yet written — §243's own test for SWOT). Recorded
   as his: the cost is that a unit that has left its objectives blank is no
   longer told so from the projector, and is still told so on every screen
   that counts gaps.

   IT DROPS THE TABLE, AND THE SLIDE ONLY WHERE THAT LEAVES NOTHING. The aim
   slide carries a unit's aspiration and end-in-mind ABOVE its table, and
   neither is a table with no rows — dropping the whole slide there would
   remove an aspiration nobody asked to remove. On a function that half is
   already absent (§243), so an empty table empties the slide and it goes.

   AN ANCHOR GOES WITH ITS SLIDE, and that is §50.3's existing behaviour
   rather than a new cost: a picture placed after a slide that is no longer
   drawn lands at the end of the deck instead of being dropped. */

function deckSlides(u){
  var S = [];
  var ko = unitObjectives(u), ex = unitRatio(u);
  var dl = deltaFor(u.ukey);
  var dtag = (!dl || !dl.d) ? "" :
    '<span class="ddelta ' + (dl.d > 0 ? "up" : "down") + '">' +
    (dl.d > 0 ? "\u25b2" : "\u25bc") + " " + Math.abs(dl.d) + '</span>';

  /* 1 — the cover carries the unit and the cycle, and nothing else. */
  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") + '>' +
    (unitLogo(u)
        ? '<img class="dcovermark" src="' + esc(unitLogo(u)) + '" alt="' + esc(u.name) + '">'
        : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
    '<h1 class="cover">' + esc(u.name) + '</h1><div class="coverrule"></div>' +
    '<p class="coversub">Strategy review &middot; ' + esc(REVIEW.name) + '</p></section>');

  /* 2 — what we are aiming at: statement above, targets below, no actuals. */
  /* The near horizon is hidden on a unit's objectives (§51.16). This is the
     deck's other side-by-side view of the two, so it drops the same column the
     Foundation page does — and the scoring slide further on keeps it, because
     that is where an actual is read against a target. */
/* ── A SUPPORTING FUNCTION AIMS AT ITS OBJECTIVES, AND NOTHING ELSE (§243)
     Islam, of a pillars function's deck: *"it has a title of winning
     aspiration but it shouldn't show this as they don't have it, and what we
     are aiming at should be the key objectives only — remove the by 2027 and
     the direction."*

     A supporting function INHERITS its aspiration and its SWOT from the unit
     it plans under and never authors either (§213), so the label was standing
     over an empty paragraph; and its objectives carry a WEIGHT and no 3-year
     target, so the horizon column held nothing but em-dashes.

     THE THIS-YEAR COLUMN IS UNCONDITIONAL HERE: `SHOW_KO_THIS_YEAR` is a
     per-viewer setting (§66), so on a function — whose only target this is —
     a viewer who had turned it off would get objectives with no target at all.
     Islam settled the reason himself: *"the functions has no 3 years
     objectives."*

     AND `Dir.` IS OFF EVERY DECK, not only a function's — §239, from the same
     week and the other half of the same conversation: *"for direction and
     compile remove them from slides but keep in the reporting as they are
     obvious for the audience."* A projector audience reads the number rather
     than auditing how it is defined. The two instructions compose: Direction
     gone for everyone, the horizon column and the aspiration gone on a
     function. THE HEADER AND THE ROW COME OFF TOGETHER — dropping a `<th>`
     and leaving its `<td>` shifts every cell after it and the slide still
     renders perfectly.

     A BUSINESS UNIT'S SLIDE KEEPS ITS ASPIRATION AND ITS HORIZON, and it is
     asserted, because a unit authors both. */
  var fnAim = !!u.fnKey;
  var aimNear = fnAim || SHOW_KO_THIS_YEAR;
  /* §254.9: THIS YEAR COMES FIRST. Islam: *"flip this year column with the 2027
     so the this year column to come after the obcejtives."* The eye meets the
     number being worked towards this cycle before the horizon it heads for —
     and THE HEADER AND THE ROW ARE SWAPPED TOGETHER, or every cell after them
     shifts and the slide still renders perfectly (§243's own note). */
  var aimRows = SMPRules.shown(u.keyObjectives).map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      '<td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
      (aimNear
        ? '<td class="num">' + (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>'
        : '') +
      (fnAim ? '' : '<td class="num big3">' +
        (m.target3y ? tgtShown(m.target3y) : "&mdash;") + '</td>') + '</tr>';
  }).join("");
  if (aimRows || !fnAim) S.push('<section class="dslide"' + anch("aim", "After \u201cWhat we are aiming at\u201d") +
    '><h2>What we are aiming at</h2>' +
    (fnAim ? '' :
      '<div class="aimtop"><div><span class="dlab">' + L("aspiration","bu") + '</span>' +
      '<p class="asp2">' + esc(u.aspiration) + '</p></div>' +
      (u.endInMind
        ? '<div><span class="dlab">End in mind</span><p class="asp3">' + esc(u.endInMind) + '</p></div>'
        : '') + '</div>') +
    (aimRows
      ? '<div class="aimbottom">' +
          (fnAim ? '' : '<span class="dlab">' + L("keyobj","bu") + horizonBy() + '</span>') +
          '<table class="zebra dbig"><thead><tr><th class="idx">#</th><th>Objective</th>' +
          (aimNear ? '<th class="num">This year</th>' : '') +
          (fnAim ? '' : '<th class="num">' + horizonColLabel() + '</th>') +
          '</tr></thead><tbody>' + aimRows + '</tbody></table>' +
        '</div>'
      : '') +
    '</section>');

  /* ── 3 · THE THREE READINGS, AT THE SIZE THEY DESERVE (§243) ───────
     Islam: *"where the units stands needs to show the 3 main numbers not only
     2"* — and, of the same slide on a function, *"where merchandizing
     stands."*

     THE MIDDLE NUMBER IS NOT NEW. §64 gave a unit's Performance page three
     headline figures — what it is judged on, how the work it set itself is
     going, and whether that work is landing on time — and `unitPillars()`
     has existed since the scoring model did. Only the SLIDE was left at two,
     so every review deck since has shown two thirds of a reading the screen
     behind it shows in full (§53.5: a projector is another surface onto
     the same page, and two surfaces must not disagree about how many numbers
     there are).

     THE HEADING NAMES ITS SUBJECT ON A FUNCTION and keeps "the unit" on a
     unit: a supporting function's review opened by calling itself a business
     unit, which is the one place this slide was plainly wrong. A unit's
     wording is right as it stands and is not changed for tidiness. */
  /* ── AND THE READING NOBODY TOOK IS NOT DRAWN AT ALL (§253) ────────
     Islam, of the first of these three cells on Merchandising: drop it, *"and
     this applies to any function without key objectives like marekting as
     well."* Measured, it read a grey dash under *"no earlier cycle to
     compare"* — a whole column of nothing beside two real numbers, which
     reads as a cell that failed to render rather than as an absence (§45.2,
     §15.1).

     MARKETING IS ALREADY RIGHT, and that is the evidence this is one rule and
     not two: a capability function's cover guards this same cell on the same
     test, so the fix brings the unit deck up to the half of the product that
     never had the fault.

     THE SHAPE COSTS NO NEW CSS. `.headgrid` without `.three` is the
     two-column shape this slide wore before §243 added the third number, so
     the surviving figures simply grow back into the room they had.

     AND THE FOOTNOTE LOSES THE CLAUSE THAT NAMES THE MISSING NUMBER, or the
     slide explains a reading it is not showing. */
  var pl = unitPillars(u), koShown = SMPRules.shown(u.keyObjectives).length;
  var standSlide = ('<section class="dslide d-head"' + anch("stand", "After \u201cWhere the unit stands\u201d") +
    '><h2>Where ' + (u.fnKey ? esc(u.name) : "the unit") + ' stands</h2>' +
    '<div class="headgrid' + (koShown ? ' three' : '') + '">' +
      (koShown
        ? '<div class="headcell"><span class="dlab">' + L("keyobj","bu") + ' performance</span>' +
          '<b class="' + dBand(ko) + '">' + dPct(ko) + '</b>' +
          '<span class="headsub">' + (dtag ? dtag + " against the last cycle" : "no earlier cycle to compare") +
          '</span></div>'
        : '') +
      '<div class="headcell"><span class="dlab">' + L("pillar","bu") + ' performance</span>' +
        '<b class="' + dBand(pl) + '">' + dPct(pl) + '</b>' +
        '<span class="headsub">' + u.items.length + ' ' + esc(L("pillar","bu").toLowerCase()) +
          ', by their measures</span></div>' +
      '<div class="headcell"><span class="dlab">Execution performance</span>' +
        '<b class="' + dBand(ex) + '">' + dPct(ex) + '</b>' +
        '<span class="headsub">' + dPct(unitExec(u)) + ' delivered against ' +
          dPct(unitPlan(u)) + ' planned</span></div>' +
    '</div><p class="headfoot">' +
    (koShown ? 'Objectives measure what was committed to. ' : '') +
    esc(L("pillar","bu")) + ' measure how the work set against them is going. ' +
    'Execution measures whether that work is landing on time.</p></section>');

  /* ── AND IT IS SAID LAST (§254.4) ──────────────────────────────────────
     Islam: *"where the units stands to be the last slide"*, and *"move the
     pillars performance till the end before the where we stand slide."*

     It opened the deck, before anything had been shown — three numbers as a
     preview. Said last, with the score table immediately before it, the deck
     ends on its reading: every pillar named, then worked through, then scored,
     then the three headline figures. Both slides are built where they always
     were, so nothing about what they SAY changes; only where they are pushed.

     THE ANCHORS TRAVEL WITH THEM, which is §236.3's rule holding rather than a
     new cost: a picture placed after "Where the unit stands" follows that
     slide to the end, because the anchor is on the slide and not on a
     position. */

  /* 4 — the objectives in detail. */
  /* §254: THE ANNUAL TARGET, AND WHAT IS DUE SO FAR BESIDE THE FIGURE.
     Islam: *"key objectives actual should show the proration as well"*, and of
     the column, *"it's called annual target"* — which is Performance's own
     word since §239.2, so the projector and the page behind it stop using two
     names for one number. */
  var oRows = SMPRules.shown(u.keyObjectives).map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      '<td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
      '<td class="num">' + (m.target ? tgtShown(m.target) : "&mdash;") + '</td>' +
      '<td class="num">' + figVsDue(m) + '</td>' +
      '<td class="num final ' + dBand(measureScore(m)) + '">' + dPct(measureScore(m)) + '</td></tr>';
  }).join("");
  if (oRows) S.push('<section class="dslide"' + anch("objectives", L("keyobj","bu") + " \u2014 after the table") +
    '><h2>' + L("keyobj","bu") + ' &mdash; where we stand</h2>' +
    '<table class="zebra dbig"><thead><tr><th class="idx">#</th><th>Objective</th>' +
    '<th class="num">Annual target</th><th class="num">Actual</th>' +
    '<th class="num">Progress</th></tr></thead><tbody>' + oRows + '</tbody></table></section>');

/* ── 5 · SWOT, AND A SUPPORTING FUNCTION HAS NONE (§243) ──────────────
     Islam: *"the functions has no swot, remove from the slides."* Measured on
     the demo's own pillars function: a section cover reading **0 · 0 · 0 · 0**
     and four empty category slides — five of twenty-one, for something the
     function does not have and never authors. It inherits its strengths and
     threats from the unit it plans under (§213), where they are written and
     where they are already presented.

     A UNIT WITH AN EMPTY SWOT STILL DRAWS ITS SECTION, deliberately: there it
     is a plan that has not been analysed yet, which is worth saying out loud,
     and §45.2's argument holds. The test is whether the subject AUTHORS a
     SWOT at all, not whether this one happens to be empty.

     MAIN'S §236.3 IS KEPT WHOLE INSIDE THE GATE: every fixed slide carries an
     anchor, so every gap between two originals is a place a picture can live.
     A function simply has no such gaps here, because it has no such slides. */
  if (!u.fnKey) {
    var sw = [["s","Strengths","good"],["w","Weaknesses","bad"],
              ["o","Opportunities","stone"],["t","Threats","warn"]];
    S.push('<section class="dslide d-cover"' + anch("swothead", "After the SWOT title page") +
      '><span class="seclab">Section</span>' +
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
      /* The LAST category keeps the old key "swot", which stored slides
         already name (§236.3). */
      S.push('<section class="dslide d-swot t-' + x[2] + '"' +
        (xi === sw.length - 1 ? anch("swot", "After the SWOT section")
                              : anch("swot" + x[0], "After " + x[1])) +
        '><h2>' + x[1] + '</h2>' +
        '<ol class="dswot">' + items + '</ol></section>');
    });
  }

  /* ── 6 · THE PILLARS ARE NAMED BEFORE THEY ARE SCORED (§254.5) ────────
     Islam: *"before the pillars performance we need 1 slide with just the 2
     titles ... don't follow the same design but the concept of having the
     pillars first"*, and of two treatments drawn in the real deck, *"option
     A"* — the row.

     A roll-call: what this unit committed to, in its own words, before a
     single number. The concept is from his own Raya deck; the treatment is the
     platform's, and the difference is deliberate — his reference gives each
     card its own hue, which spends three accents on a distinction that means
     nothing (§41's budget). One gold rule across the row instead.

     THE CODE IS THE NUMBER. `RS01` is what every other surface calls that
     pillar, so one mark identifies it AND orders it, where an invented `01`
     would only order it — a structural device that encodes something true
     rather than decorating the slide.

     THE ROW DIVIDES FOR ANY NUMBER of pillars, so a unit with two and one with
     eight both fill their line; `--n` is set from the list rather than assumed,
     and the sub-line comes only where the pillar has one (§15.1). */
  var pNames = u.items.map(function(p, i){
    return '<div class="pcard"><span class="pcard-c">' + pillarCode(u, i) + '</span>' +
      '<span class="pcard-n">' + esc(p.name) + '</span>' +
      (p.sub ? '<span class="pcard-s">' + esc(p.sub) + '</span>' : '') + '</div>';
  }).join("");
  if (u.items.length) S.push('<section class="dslide"' +
    anch("pillarnames", "After the " + L("pillar","bu").toLowerCase() + " names") +
    '><h2>' + L("pillar","bu") + '</h2>' +
    '<div class="pcards" style="--n:' + u.items.length +
      ';--c:' + pillarCols(u.items.length) +
      ';--r:' + Math.ceil(u.items.length / pillarCols(u.items.length)) + '">' +
    pNames + '</div></section>');

  /* The score table, built here and pushed at the END (§254.4). */
  var pRows = u.items.map(function(p, i){
    var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
    return '<tr><td class="idx">' + (i+1) + '</td><td class="dirname">' +
      '<b><span class="dcode">' + pillarCode(u, i) + '</span> ' + esc(p.name) + '</b>' +
      '<span class="dsub">' + esc(p.kind) + ' &middot; ' + esc(p.theme) + ' &middot; ' + esc(p.owner) + '</span></td>' +
      '<td class="num final ' + dBand(pillarPerf(p)) + '">' + dPct(pillarPerf(p)) + '</td>' +
      '<td class="num final ' + dBand(r) + '">' + dPct(r) + '</td></tr>';
  }).join("");
  /* NAMED APART FROM THE ROLL-CALL (§254.5). With both slides headed by the
     tenant's word for a pillar, the deck said "Pillars" twice — §87's twins on
     a projector, and two rows in Manage slides' rail that read the same. The
     scoring table takes the deck's OWN existing phrasing, the one the
     objectives table has always worn, rather than a new form of words. */
  var pillarScoreSlide = '<section class="dslide"' +
    anch("pillars", "After the " + L("pillar","bu").toLowerCase() + " overview") +
    '><h2>' + L("pillar","bu") + ' &mdash; where we stand</h2>' +
    '<table class="zebra dirs"><thead><tr><th class="idx">#</th><th>Pillar</th>' +
    '<th class="num">Measures</th><th class="num">Execution</th></tr></thead>' +
    '<tbody>' + pRows + '</tbody></table></section>';

  u.items.forEach(function(p, pi){
    var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
    S.push('<section class="dslide d-cover"' +
      anch("p" + pillarCode(u, pi) + "d", "After the " + pillarCode(u, pi) + " title page") +
      '><span class="seclab">' + esc(p.kind) +
      ' &middot; theme ' + esc(p.theme) + ' &middot; ' + esc(p.owner) + '</span>' +
      '<h1 class="pillarname"><span class="dcode huge">' + pillarCode(u, pi) + '</span> ' +
        esc(p.name) + '</h1>' +
      (p.sub ? '<p class="coversub">' + esc(p.sub) + '</p>' : '') +
      '<div class="coverrule"></div><div class="leadstats">' +
        '<div><span class="dlab">Key measures</span><b class="' + dBand(pillarPerf(p)) + '">' +
          dPct(pillarPerf(p)) + '</b></div>' +
        '<div><span class="dlab">Execution</span><b class="' + dBand(r) + '">' + dPct(r) + '</b></div>' +
      '</div></section>');

    var mRows = SMPRules.shown(p.measures).map(function(m, i){
      return '<tr><td class="idx">' + (i+1) + '</td>' +
        '<td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
        '<td class="num">' + (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>' +
        '<td class="num">' + figVsDue(m) + '</td>' +
        '<td class="num final ' + dBand(measureScore(m)) + '">' + dPct(measureScore(m)) + '</td>' +
        (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') +
        '</tr>';
    }).join("");
    /* §236.2: Islam — "the slide can be set between the measures and tactics
       because that's a valid place to be." The lowercase suffix keeps the key
       clear of the tactics anchor below ("p" + code), which stored slides
       already name. */
    if (mRows) S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'M"' +
      anch("p" + pillarCode(u, pi) + "m", "After " + pillarCode(u, pi) + " — key measures") + '>' +
      deckPillarHead(u, p, pi, "Key measures") +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Measure</th>' +
      '<th class="num">Annual target</th><th class="num">Actual</th>' +
      '<th class="num">Progress</th><th>Note</th></tr></thead><tbody>' + mRows + '</tbody></table></section>');

    /* ── 6 · A TACTIC IS SHOWN BY WHAT IT PRODUCED (§252) ──────────────
       Islam: *"presentations doesn't change when the plan performance is
       done."* Measured on Mobile before a line was written: a tactic reported
       through its outcome read **&mdash; / 50%** and **&mdash;** here, while
       the Performance page read **4# / 3 #** and **133%** for that same row --
       and the heading three inches above it on this very slide already said
       **Delivered 98%**, a number that COUNTS the outcome the table under it
       was calling empty. The deck was reading `t.actual`, and §248 puts the
       figure in `outActual`.

       THE OUTCOME TAKES A COLUMN OF ITS OWN, Islam's pick from three drawn in
       the real deck (design-mockups/tactic-outcome-slide/). It is what the
       figure beside it is measured against, so it belongs on the line where an
       audience can run an eye down it -- the same shape the Performance page
       has worn since §248, because a projector must not say something
       different from the page behind it (§53.5). The cost was measured and
       accepted: Mobile's deck goes from 24 slides to 27, all of them
       continuations of a table the deck already splits (§69.5).

       AND THE TWO HEADINGS TAKE PERFORMANCE'S WORDS -- *YTD actual* and
       *Progress* -- for §239.2's own reason: "delivery" is wrong for a row
       measured in stores or in EGP, and one number should not have two names.

       A ROW THAT IS OWED A FIGURE SAYS SO. It printed the same em-dash as an
       unmeasurable row, so a review could not tell "nobody has entered this"
       from "there is nothing to enter" (§35). */
    var tRows = SMPRules.shown(p.tactics).map(function(t, i){
      var lead = '<td class="idx">' + (i+1) + '</td>' +
        '<td class="lead">' + esc(t.name) + '</td>' +
        '<td>' + outcomeCell(t) + '</td>' +
        '<td>' + esc(t.owner) + '</td>' +
        '<td class="collabs">' + collabCell(t) + '</td>' +
        '<td class="cc">' + qs(t) + '</td>';
      var note = t.note ? '<td class="dnote">' + esc(t.note) + '</td>'
                        : '<td class="dnote empty">&mdash;</td>';
      /* §254.3: NOT DIMMED. Islam: *"for a non due tactic don't dim it show it
         normally it has the comment of not due this cycle anyway."* The cell
         already says it in words, and dimming says it a second time in a way
         that also costs the owner and the quarters their legibility on a
         projector. */
      if (!tacticDue(t))
        return '<tr>' + lead +
          '<td colspan="2" class="cc">Outside this cycle</td>' + note + '</tr>';
      /* What this row is measured against RIGHT NOW: an outcome answers with
         its own target, prorated where it compiles by Sum; everything else
         with the share of its plan that is due (\u00a7239). One function, so the
         slide and the page cannot differ about it. */
      var bench = tacticBenchmark(t);
      if (!tacticAnswered(t))
        return '<tr>' + lead + '<td colspan="2" class="cc">Not reported' +
          (bench ? ' <i>&middot; due at ' + esc(bench) + '</i>' : '') + '</td>' +
          note + '</tr>';
      var r = tacticProgress(t);
      var shown = onOutcome(t) ? outcomeShown(t) : t.actual + "%";
      return '<tr>' + lead +
        '<td class="num"><b>' + esc(shown) + '</b>' +
          (bench ? ' <i>/ ' + esc(bench) + '</i>' : '') + '</td>' +
        '<td class="num final ' + dBand(r) + '">' + dPct(r) + '</td>' +
        note + '</tr>';
    }).join("");
    if (tRows) S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'T"' +
      anch("p" + pillarCode(u, pi), "After " + pillarCode(u, pi) + " \u2014 " + p.name) + '>' +
      deckPillarHead(u, p, pi, "Tactics") +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Tactic</th>' +
      '<th>Outcome</th><th>Owner</th>' +
      '<th>Collabs.</th>' +
      '<th class="num">Quarters</th><th class="num">YTD actual</th><th class="num">Progress</th>' +
      '<th>Note</th></tr></thead><tbody>' + tRows + '</tbody></table></section>');
  });

  /* ── 7 · THE NOTE, DRAWN ONLY WHEN THERE IS ONE (§243) ────────────────
     Islam: *"make the notes and achievements slide optional and they can add
     it when they need"*, and of this shape: *"ok clear accepted."*

     There is no switch to remember and nothing new stored: the note is
     written on the reporting page as it always was, and the slide follows it.
     A deck with nothing to say on it does not spend a slide saying so.

     THE COST IS REAL AND WAS STATED BEFORE IT WAS ACCEPTED: this box is
     editable in the room, so until now a note could be STARTED on the
     projector. One that already exists can still be corrected there; one that
     does not has no box to start it in, and is written where every other
     figure in the review is written. */
  var unote = cycleNote(u.ukey);
  var noteSlide = !unote ? "" : ('<section class="dslide"' + anch("notes", "After \u201cNotes and achievements\u201d") +
    '><h2>Notes and achievements</h2>' +
    '<div class="dnotebox" contenteditable="true" data-deckunote="' + u.ukey + '">' +
      esc(unote) + '</div>' +
    '<p class="dhint">Editable here. A number challenged in the room is corrected in the ' +
    'platform, not in a deck that is already wrong.</p></section>');

  /* THERE IS NO "WHAT NEEDS ATTENTION" SLIDE (Islam, 2026-08-23). It gathered
     every measure and tactic reading under 70 into one closing table — a
     second telling of numbers the deck has already shown pillar by pillar,
     and the one slide in the review that reads as a list of failures rather
     than as the unit's own account of its plan. The notes slide above is
     where what is being done gets said, in the unit's words. Its anchor
     ("attention") goes with it; a picture slide that named it lands at the
     end rather than being dropped (§50.3). */

  /* ── §254.6 · THE LAST FOUR SLIDES, IN HIS ORDER ──────────────────────
     The score table, the three readings, the note, then Thank you.

     ISLAM PUT THE NOTE LAST, asked directly and answering *"notes before thank
     you"* — which reverses the order §254.4 shipped in an hour earlier, and is
     recorded as a reversal rather than overwritten. It also means the deck's
     last content slide is the unit's own words rather than its numbers, which
     sits against *"where the units stands to be the last slide"*: both cannot
     be true at once, and this is the one he answered most recently and most
     specifically. Swapping the two is one line if he wants it back. */
  if (u.items.length) S.push(pillarScoreSlide);
  S.push(standSlide);
  if (noteSlide) S.push(noteSlide);

  S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last \u2014 before Thank you", "before") +
    '><h1 class="cover">Thank you</h1>' +
    '<div class="coverrule"></div><p class="coversub">' + esc(u.name) +
    ' &middot; ' + esc(REVIEW.name) + '</p></section>');

  return S.join("");
}

/* ── HOW MANY ACROSS (§254.12) ─────────────────────────────────────────
   Islam, looking at five in a row: *"the 5 pillars beside each other are very
   small can we arrange them in the slide to fill better?"*

   ONE ROW USES HALF A SLIDE. Five cards across a 1600px stage are 264px wide
   and the name lands at 27.6px, with the whole lower half of the slide empty —
   the layout was spending width it did not have and leaving height it did.

   AND HIS OWN FIRST INSTRUCTION READS DIFFERENTLY NOW: *"4 can form a box"* is
   two by two, which is what he meant and what a square arrangement of four
   gives. Up to three stay in a row, because two rows for three is a shape
   nobody would draw on purpose; above that it is the square-ish grid
   `ceil(sqrt(n))` gives — 4 as 2x2, 5 and 6 as three across, 8 as three across
   in three rows, ten as four.

   A RAGGED LAST ROW IS CENTRED, which is why the cards lay out with flex-wrap
   rather than a grid: five in three columns leaves two on the second row, and
   a grid would push them left. */
function pillarCols(n){
  return n <= 3 ? Math.max(1, n) : Math.ceil(Math.sqrt(n));
}

function deckPillarHead(u, p, pi, which){
  var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
  return '<div class="dphdr"><h2><span class="dcode">' + pillarCode(u, pi) + '</span> ' +
    esc(p.name) + '<span class="dwhich">' + which + '</span></h2>' +
    /* ── TWO NUMBERS, NOT FOUR (§254.10) ──────────────────────────────
       Islam: *"remove the deliverd /planned from the slides maintain just the
       2 numbers of measurs and execution"*, and of the reading put back to
       him, *"yes drop for both keep the 2 measures only across."*

       DELIVERED AND PLANNED APPEARED IN TWO PLACES, SPELLED DIFFERENTLY, which
       is why the instruction was read back before it was obeyed: the pillar's
       title slide carried Key measures · Execution · Delivered / planned, so
       dropping the third leaves the two he named — while THIS head carried
       Measures · Delivered · Planned and had no Execution on it at all.
       Dropping two here would have left one number, so Execution takes their
       place and both surfaces end up saying the same two things.

       The figures are unchanged: `pillarExec` and `pillarPlan` are still what
       Execution is computed from, and are still explained in words on "Where
       the unit stands", which he looked at and kept. */
    '<div class="dstats"><span><i>Measures</i><b class="' + dBand(pillarPerf(p)) + '">' +
      dPct(pillarPerf(p)) + '</b></span>' +
    '<span><i>Execution</i><b class="' + dBand(r) + '">' + dPct(r) + '</b></span></div></div>';
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
    /* §236.3's anchors, mirrored on the function's deck (§53.5): keyed on the
       capability's and the project's ids, the same stability class as the
       "cap"+id and "dx"+id anchors beside them. */
    S.push('<section class="dslide d-cover"' + anch("cap" + c.id + "c", "After " + c.name + " — cover") +
      '><span class="seclab">Capability &middot; ' +
        esc(f.name) + '</span>' +
      '<h1 class="cover">' + esc(c.name) + '</h1>' +
      '<p class="coversub">' + esc(c.def) + '</p>' +
      '<div class="coverrule"></div><div class="leadstats">' +
        (SMPRules.shown(c.keyObjectives).length
          ? '<div><span class="dlab">Key objectives</span><b class="' + dBand(ko) + '">' + dPct(ko) + '</b></div>'
          : '') +
        '<div><span class="dlab">Project performance</span><b class="' + dBand(perf) + '">' + dPct(perf) + '</b></div>' +
        '<div><span class="dlab">Milestones</span><b class="plain">' + ce.done + ' of ' + ce.total + '</b></div>' +
      '</div></section>');

    if (SMPRules.shown(c.keyObjectives).length) {
      var kRows = SMPRules.shown(c.keyObjectives).map(function(m, i){
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(m.name) + '</td>' +
          '<td class="num">' + (m.weight == null ? "&mdash;" : m.weight + "%") + '</td>' +
          '<td class="num">' + (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>' +
          '<td class="num">' + (m.actual == null || m.actual === "" ? "&mdash;" : figVsDue(m)) + '</td>' +
          '<td class="num final ' + dBand(measureScore(m)) + '">' + dPct(measureScore(m)) + '</td>' +
          (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      S.push('<section class="dslide"' + anch("cap" + c.id + "k", "After " + c.name + " — key objectives") +
        '><h2>Key objectives &mdash; where we stand' +
        '<span class="dwhich">' + esc(c.name) + '</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Objective</th>' +
        '<th class="num">Weight</th><th class="num">Annual target</th>' +
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
      S.push('<section class="dslide d-cover"' + anch("prj" + p.id, "After " + p.name + " — title page") +
        '><span class="seclab">' + esc(c.name) +
          ' &middot; ' + esc(p.owner || "") + ' &middot; ' + esc(p.start) + ' &rarr; ' + esc(p.end) + '</span>' +
        '<h1 class="pillarname">' + esc(p.name) + '</h1>' +
        '<p class="coversub">' + esc(p.brief || "") + '</p>' +
        '<div class="coverrule"></div><div class="leadstats">' +
          '<div><span class="dlab">Performance</span><b class="' + dBand(projPerf(p)) + '">' + dPct(projPerf(p)) + '</b></div>' +
          '<div><span class="dlab">Deliverables</span><b class="' + dBand(projDeliverySide(p)) + '">' + dPct(projDeliverySide(p)) + '</b></div>' +
          '<div><span class="dlab">Outcomes</span><b class="' + dBand(projOutcomeSide(p)) + '">' + dPct(projOutcomeSide(p)) + '</b></div>' +
          '<div><span class="dlab">Milestones</span><b class="plain">' + mst.done + ' of ' + mst.total + '</b></div>' +
        '</div></section>');

      /* NO OWNER AND NO DUE (§53.4). The project has an owner and an end date;
         a deliverable was carrying a second, quieter answer to both. */
      /* ONE SLIDE, ONE ROW SHAPE (§104). Two slides made sense while a
         deliverable and an outcome answered different questions; they answer
         the same ones now, so a projector showing them apart would be showing
         a distinction the product no longer draws. */
      var dxRow = function(row, i){
        var o = row.obj, d = row.kind === "d";
        var reads = d ? statusReads(o) : o.progress;
        var got = d ? (o.status === "done" ? "Delivered" : o.status === "wip" ? "In progress"
                       : o.status === "todo" ? "Not started" : "\u2014")
                    : (o.actual == null || o.actual === "" ? "\u2014" : esc(String(o.actual)));
        var notDue = !dueThisCycle(dxWhen(row));
        return '<tr' + (notDue ? ' class="dim"' : '') + '><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(o.name) + '</td>' +
          '<td>' + (d ? "Deliverable" : "Outcome") + '</td>' +
          '<td class="num">' + esc(dxWhen(row) || "\u2014") + '</td>' +
          '<td class="num">' + (d ? "Y/N" : esc(o.target || "\u2014")) + '</td>' +
          '<td class="num">' + got + '</td>' +
          '<td class="num final ' + dBand(reads) + '">' + (notDue ? "not due" : dPct(reads)) + '</td>' +
          (o.note ? '<td class="dnote">' + esc(o.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') +
          '</tr>';
      };
      /* §233: filtered HERE, never inside dxRows() — the pane's pen
         shares that builder and the pen shows everything. */
      var dxRowsHtml = dxRows(p).filter(function(r){
        return !SMPRules.isHidden(r.obj); }).map(dxRow).join("");
      /* §236.2: the unit ruling's mirror — between a project's deliverables and
         its milestones is a valid place too, or the two sides drift (§53.5). */
      S.push('<section class="dslide" data-split="' + esc(p.id) + 'D"' +
        anch("dx" + p.id, "After " + p.name + " — deliverables and outcomes") + '>' +
        '<h2>' + esc(p.name) + '<span class="dwhich">Deliverables and outcomes</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th>' +
        '<th>Deliverables &amp; outcomes</th><th>Type</th><th class="num">Due date</th>' +
        '<th class="num">Target</th><th class="num">Status</th><th class="num">' + DX_PCT + '</th>' +
        '<th>Note</th></tr></thead><tbody>' + dxRowsHtml + '</tbody></table></section>');

      var over = projOverruns(p).map(function(m){ return m.id; });
      var mRows = SMPRules.shown(p.milestones).map(function(m, i){
        var word = m.status === "done" ? "Completed" : m.status === "wip" ? "In progress" : "Not started";
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(m.name) +
          (m.covers ? '<span class="dsub">' + esc(m.covers) + '</span>' : '') + '</td>' +
          '<td>' + esc(m.owner || "—") + '</td>' +
          /* §227: the same cell the deck's tactic tables carry (§50). */
          '<td class="collabs">' + collabCell(m) + '</td>' +
          '<td class="num' + (over.indexOf(m.id) > -1 ? ' warn' : '') + '">' + esc(m.finish) +
          (over.indexOf(m.id) > -1 ? ' <span class="dsub">after the project ends</span>' : '') + '</td>' +
          '<td class="num final ' + (m.status === "done" ? "good" : m.status === "wip" ? "attn" : "") + '">' + word + '</td>' +
          '<td class="num">' + (msReads(m) == null ? "&mdash;" : msReads(m) + "%") + '</td>' +
          (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      if (mRows) S.push('<section class="dslide" data-split="' + esc(p.id) + 'M"' +
        anch("ms" + p.id, "After " + p.name + " — milestones") + '>' +
        '<h2>' + esc(p.name) + '<span class="dwhich">Milestones &middot; ' + mst.done + ' of ' + mst.total + ' completed</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Milestone</th>' +
        '<th>Owner</th><th>Collabs.</th><th class="num">Due date</th><th class="num">Status</th><th class="num">' + MS_PCT + '</th>' +
        '<th>Note</th></tr></thead><tbody>' + mRows + '</tbody></table></section>');
    });
  });

  /* AND NONE ON A FUNCTION'S DECK EITHER. The same slide, gathering
     deliverables, outcomes and milestone overruns instead of measures and
     tactics — and removed for the same reason, on both sides of the switch
     rather than on one (A15). */

  /* §243: the same rule as a unit's deck — drawn only when a note is written.
     One question, one answer on both decks (§53.5). */
  var fnote = cycleNote("fn:" + fk);
  if (fnote) S.push('<section class="dslide"' + anch("notes", "After \u201cNotes and achievements\u201d") +
    '><h2>Notes and achievements</h2>' +
    '<div class="dnotebox" contenteditable="true" data-deckunote="fn:' + fk + '">' +
      esc(fnote) + '</div>' +
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

/* ── THE SLIDES THE OFFICE DOES NOT PRESENT (§256) ────────────────────────
   The stored subject behind a deck target. Deliberately NOT `unitLike()`:
   that returns a fresh reading view for a pillars function (§61's frozen
   empties), and what is wanted here is the object the office's press writes
   to. One resolver, asked by the projector, the editor and the writer, so
   the three cannot disagree about whose list they are reading (§53.5). */
function deckSubject(target){
  if (!target) return null;
  return target.indexOf("fn:") === 0 ? FUNCTIONS[target.slice(3)] : UNITS[target];
}

/* AFTER THE PICTURES ARE PLACED, AND BEFORE THE FIT PASS. Both halves of
   that order are load-bearing.

   After, because a picture anchored to a hidden slide is still the
   custodian's evidence: hiding the neighbour it was placed against must not
   swallow it. `insertPictureSlides()` has already run, so the picture is in
   the deck on its own account and only the anchor slide leaves.

   Before, because `deckFitPass()` CLONES a long table to continue it and the
   clone carries its parent's anchor (§236.3). Removing the parent first means
   no continuation is ever made, so a hidden table goes whole rather than
   leaving its second half standing — which is what removing afterwards would
   have to remember to do.

   Picture slides carry no `data-anchor` at all, so they cannot be reached by
   this pass. Removing one is `Remove slide`, which already exists. */
function deckHidePass(deck, target){
  var hid = SMPRules.hiddenSlides(deckSubject(target));
  if (!hid.length) return;
  [].forEach.call(deck.querySelectorAll(".dslide[data-anchor]"), function(s){
    if (hid.indexOf(s.dataset.anchor) >= 0) s.remove();
  });
}

/* ── The unit's own mark on the deck (§52.9) ──────────────────────────
   Large on the cover in place of the group's name, small in the footer of
   every other slide. A unit with no mark keeps the eyebrow and gets no
   footer mark, which is what every slide did before — so a missing mark
   costs nothing and half a set of lockups is still worth having.

   Appended in ONE place rather than at twenty push() calls: AFTER the
   picture slides are inserted, so a custodian's own slide is footed too,
   and BEFORE deckFitPass(), so a slide it splits carries the footer into
   every continuation. */
function deckFootMarks(deck, u){
  var src = unitLogo(u);
  if (!src) return;
  [].forEach.call(deck.querySelectorAll(".dslide"), function(s){
    s.classList.add("hasmark");
    /* Skipped on the slide that already wears the mark LARGE, and only
       there. Written first against `.d-cover`, which silently took the
       footer off five more: the SWOT and pillar dividers carry that class
       too, and so does Thank you. Asking whether the mark is already on
       the slide cannot make that mistake. */
    if (s.querySelector(".dcovermark")) return;
    s.insertAdjacentHTML("beforeend",
      '<div class="dfoot"><img class="dfootmark" src="' + esc(src) + '" alt=""></div>');
  });
}

function openDeckWith(titleHtml, slides, target){
  var root = document.getElementById("deckroot");
  root.querySelector(".deck").innerHTML = slides;
  if (target) insertPictureSlides(root.querySelector(".deck"), target);
  if (target) deckHidePass(root.querySelector(".deck"), target);
  if (target && target.indexOf("fn:") !== 0 && UNITS[target]) {
    deckFootMarks(root.querySelector(".deck"), UNITS[target]);
  }
  root.querySelector(".dtitle").innerHTML = titleHtml;
  root.classList.add("on");
  document.body.classList.add("presenting");
  deckFitPass();
  deckIndex();
  deckShow(0);
  deckScale();
  root.focus();
}
/* THE TWO OPENERS STAY, AND BOTH GO THROUGH THE ONE READER (§253.3). They
   are two doors onto one question — Present on a unit, Present on a function —
   and `deckHtmlFor()` is what decides which deck each gets, so a pillars
   function opened through either lands on the same slides. */
function openDeck(u){
  openDeckWith("<b>" + esc(u.name) + "</b> &middot; " + esc(REVIEW.name),
    deckHtmlFor(u.ukey), u.ukey);
}
function openDeckFn(fk){
  openDeckWith("<b>" + esc(FUNCTIONS[fk].name) + "</b> &middot; " + esc(REVIEW.name),
    deckHtmlFor("fn:" + fk), "fn:" + fk);
}

/* §256.2 WAS HERE, AND IT IS §253.3's NOW. Two sessions found the same fault
   on the same day and fixed it independently: Manage slides asked
   `kind === "fn"` while the Present button asked the FORMAT, so a pillars
   function's editor assembled a deck nobody would ever project (measured on
   the demo: the editor 2 slides, the projector 15).

   `deckHtmlFor()` at the top of this file is the survivor, and it is the
   better of the two — it also routes `deckAnchors()`, which this one did not,
   so the anchors offered to a picture come from the same deck as well. What
   stood here was a second declaration of that same function, and git merged
   the two with NO CONFLICT: the later one wins by hoisting, so the product
   would have run this copy and main's would have been dead (§146.2, §56.7).
   Removed rather than reconciled, because one question may have one answer. */
function closeDeck(){
  var root = document.getElementById("deckroot");
  root.classList.remove("on");
  /* Both fullscreen classes go with it. `fullscreenchange` would clear them
     too, but only if the deck was in fullscreen — leaving `peek` set on a deck
     closed from windowed mode means the NEXT fullscreen opens with the bar
     already showing and no move to explain it. */
  root.classList.remove("fs", "peek");
  if (DECKPEEK) { clearTimeout(DECKPEEK); DECKPEEK = null; }
  document.body.classList.remove("presenting");
  if (document.fullscreenElement) document.exitFullscreen();
}

/* Squeeze anything that overruns, then split what still does. Run once on
   open, so the deck never reflows while it is being presented.

   TAKES THE DECK IT IS FITTING (§69.5). It read `#deckroot .deck` off the
   document, so it could only ever fit the deck that was being PROJECTED — and
   Manage slides assembles its own copy, which is why the editor showed the one
   thing the whole mode exists to prevent: a slide overflowing its box, and a
   long table stopping at the bottom edge instead of continuing. The default
   keeps every existing caller unchanged.

   IT MEASURES, so whatever is passed has to be IN THE DOCUMENT and laid out
   at 1600x900: `scrollHeight` and `clientHeight` on a detached element are
   both 0, and 0 > 0 is false — so a detached deck is reported as fitting
   perfectly, every slide, every time. That is §50.3's detached-render trick
   used for the one job it cannot do. */
function deckFitPass(deck){
  deck = deck || document.querySelector("#deckroot .deck");
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
/* Show the bar, then take it away again after a pause. Only in fullscreen —
   everywhere else it is simply always there, and a timer running against a
   class that does nothing is a timer somebody will one day wonder about.

   The timer is cleared before it is set, or a mouse moving continuously leaves
   one pending timeout per event and the bar hides on the first of them. */
var DECKPEEK = null;
function deckPeek(hideNow){
  var root = document.getElementById("deckroot");
  if (!root || !root.classList.contains("fs")) return;
  if (DECKPEEK) { clearTimeout(DECKPEEK); DECKPEEK = null; }
  if (hideNow) { root.classList.remove("peek"); return; }
  root.classList.add("peek");
  DECKPEEK = setTimeout(function(){
    DECKPEEK = null;
    var r = document.getElementById("deckroot");
    /* Never pull it out from under the pointer: a bar that vanishes as you
       reach for Exit is worse than one that never appeared. */
    if (r && !r.querySelector(".deckbar:hover")) r.classList.remove("peek");
  }, 2200);
}

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
    if (box) setCycleNote(box.dataset.deckunote, box.textContent);
  });
  /* Any of the three ways somebody reaches for the controls. `pointermove`
     covers mouse and pen; a touch is a `pointerdown` that never moves; and the
     keyboard has to be able to summon it too, or a presenter driving the deck
     by arrow keys can never see where they are. */
  root.addEventListener("pointermove", function(){ deckPeek(false); });
  root.addEventListener("pointerdown", function(){ deckPeek(false); });
  addEventListener("resize", deckScale);
  /* ── The bar hides in fullscreen, and comes back on a move (§69.7) ──
     The class is set from the EVENT rather than from the button, because
     fullscreen can be left by pressing Escape or by the browser deciding — and
     a state kept by whoever pressed the control is a state that is wrong every
     other way in. `document.fullscreenElement === root` rather than a
     truthiness test: another element on the page going fullscreen must not
     take this deck's bar away.

     deckScale() runs after the class, or it measures the stage at its old
     inset and scales the deck to the box it is about to stop being. */
  addEventListener("fullscreenchange", function(){
    var root = document.getElementById("deckroot");
    root.classList.toggle("fs", document.fullscreenElement === root);
    root.classList.remove("peek");
    deckPeek(true);
    deckScale();
  });
  addEventListener("keydown", function(ev){
    if (!root.classList.contains("on")) return;
    if (ev.target.isContentEditable) { if (ev.key === "Escape") ev.target.blur(); return; }
    /* Driving the deck from the keyboard shows the bar too — otherwise a
       presenter using the arrows in fullscreen has no way to see which slide
       they are on, and the counter is the one thing the bar is FOR. */
    deckPeek(false);
    if (ev.key === "ArrowRight" || ev.key === " ") { ev.preventDefault(); deckShow(DECK.i + 1); }
    if (ev.key === "ArrowLeft") deckShow(DECK.i - 1);
    if (ev.key === "Home") deckShow(0);
    if (ev.key === "End") deckShow(DECK.slides.length - 1);
    if (ev.key === "Escape") closeDeck();
    if (ev.key === "f" || ev.key === "F") root.querySelector("[data-dfs]").click();
    if (ev.key === "w" || ev.key === "W") root.querySelector("[data-dfit]").click();
  });
}
