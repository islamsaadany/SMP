/* ── Presentation mode ────────────────────────────────────────────────────
   A unit's review, built from whatever the platform holds at the moment it is
   opened. There is no exported copy and no version to go stale: a figure
   corrected an hour before the meeting is the figure on the slide.

   It is a mode rather than a page. It takes the whole window, the app chrome
   disappears, and Exit returns the presenter to exactly where they were.
   ──────────────────────────────────────────────────────────────────────── */

var DECK = { i:0, slides:[], root:null, flow:null, stops:null, title:"", from:"page" };
/* `from` is WHERE THIS DECK WAS OPENED FROM — "page" or "editor" (§295). It is
   read by `closeDeck()` alone, to decide where Escape and Exit put you, and it
   is written on EVERY open rather than only the editor's: a value left standing
   would send the NEXT deck back to a Manage slides nobody opened, which is the
   shape §265 recorded when the `fs` class survived a windowed close. */

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
/* ── A SECTION DIVIDER WEARS THE TENANT'S OWN BLUE (§259.1) ───────────
   Islam: *"let's make the separators blue background like the client brand
   colors"*, naming four sections — the foundation, the SWOT that already had
   a divider, the strategic pillars, and a final overall performance before
   the closing readings.

   `--panel` IS THE BLUE, AND IT IS NOT A CHOICE OF MINE. It is the token
   Setup › Branding's *Navigation bar* control sets, so a divider wears
   whatever blue the tenant picked for their own bar and changes the day they
   change it (§41.10: a surface on `--panel` wears the tenant's brand). No new
   token, no literal (§25).

   THE THREE INKS ALREADY EXISTED for exactly this ground, because §38.5 says
   a surface with its own background needs its own ink: `--panel-ink` for the
   title, `--panel-quiet` for the sub-line and labels, `--panel-accent` for the
   rule and the SECTION key. Measured on the shipped blue: 12.77 / 7.24 /
   7.66:1.

   NO FOOTER MARK ON A DIVIDER, at Islam's word (*"remove the logo footer from
   the blue pages"*), and it takes a real problem with it: the white plate that
   makes a navy lockup readable on a dark slide is switched on by the PAGE
   being dark (§52), which a blue divider on a light page is not — so the mark
   would have vanished into its own ground. `deckFootMarks()` skips `.d-sect`,
   which is one test rather than an unconditional plate and a white rectangle
   in the corner of every divider. */
var SEC_WORD = { sfound:"FOUND", swothead:"SWOT", spillars:"PILLARS",
                 sperf:"SCORE" };
function sectSlide(key, label, title, sub, cells){
  return '<section class="dslide d-cover d-sect"' + anch(key, label) +
    sec(SEC_WORD[key] || secTwo(title), title, true) + '>' +
    '<span class="seclab">Section</span>' +
    '<h1 class="cover">' + esc(title) + '</h1><div class="coverrule"></div>' +
    '<p class="coversub">' + esc(sub) + '</p>' +
    (cells && cells.length
      ? '<div class="secgrid c' + cells.length + '">' + cells.map(function(c){
          return '<div class="seccell"><b>' + esc(c[0]) + '</b><span>' +
            esc(c[1]) + '</span></div>';
        }).join("") + '</div>'
      : '') +
    '</section>';
}

/* ── A SLIDE THAT STARTS A SECTION SAYS SO (§266.12) ───────────────────
   Islam, of the flow's own labelled strip: *"for the presentations in general
   of the units not the master how can we use the bullets in the bottom like we
   did in the master one?"*, and of the four treatments drawn for him,
   *"B is good but we can make them grouped like C as well."*

   The strip is drawn from what the deck DECLARES, never from what it looks
   like: the builder knows the pillar's code and the capability's name, and a
   strip that read them back out of a heading would be guessing at prose it does
   not own (§96, and `deckStops()`'s own reason for reading `data-subject`).

   `head` marks the ones the deck's four blue dividers already are (§259) — the
   groups are the parts of the review, not a decoration invented for the bar. */
function sec(code, name, head){
  return ' data-sec="' + esc(code) + '" data-sec-name="' + esc(name) + '"' +
         (head ? ' data-sec-head="1"' : '');
}

/* Two letters, for a section with no code of its own — a capability. The rule
   is §266.9's own fallback for a subject with no prefix, and it is a fallback
   rather than a scheme: a pillar HAS a code, printed on every one of its
   slides, and inventing a second abbreviation beside it is what that section
   refused. */
function secTwo(name){
  var w = String(name || "").trim().split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0)
                       : String(w[0] || "?").slice(0, 2)).toUpperCase();
}

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
  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") +
    sec("COVER", u.name, true) + '>' +
    (deckMark(u)
        ? '<img class="dcovermark" src="' + esc(deckMark(u)) + '" alt="' + esc(u.name) + '">'
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
  /* THE DIVIDER IS DRAWN ONLY IF THE SECTION IS (§253). It opens the aim
     slide and the objectives reading, so its test is the aim slide's own —
     a divider standing over nothing is the blank page that section removed,
     with a heading on it.

     THE HORIZON CELL IS A UNIT'S. A supporting function's objectives carry a
     weight and no 3-year target (§243), so on a function the divider names
     one thing rather than printing a horizon that appears nowhere after it. */
  var foundCells = [[SMPRules.shown(u.keyObjectives).length, L("keyobj","bu")]];
  if (!fnAim && GROUP.horizon) foundCells.push([GROUP.horizon, "Horizon"]);
  if (aimRows || !fnAim)
    S.push(sectSlide("sfound", "After the Foundation divider", "Foundation",
      "What " + (u.fnKey ? u.name : "this unit") + " is aiming at, and the objectives it is judged on.",
      foundCells));

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
    /* ONE RULE ACROSS THE ROW, NOT A HUE PER CELL (§259.1), and it is a
       measurement rather than taste. On the blue the four scoring colours
       read 2.55 : 2.26 : 3.49 : 1.00 against it — the last being
       Opportunities, which was drawn in `--panel` itself and would be
       invisible against its own ground. Keeping them would mean inventing
       four colours for one slide; the words under the counts already say
       which is which, and the four category slides that follow keep their
       own hues untouched. `.seccell.t-*` had no other user and is deleted
       with them (§24). It is also what §254.5 settled for the pillar cards:
       one accent across a row, never one per card (§41's budget). */
    S.push(sectSlide("swothead", "After the SWOT title page", "SWOT",
      "Where this unit is strong, exposed, and what the market is offering it.",
      sw.map(function(x){ return [(u.swot[x[0]] || []).length, x[1]]; })));
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
  /* THE ROLL-CALL STAYS WHITE AND TAKES A DIVIDER IN FRONT OF IT — Islam's
     B, chosen from two drawn in the real deck: *"the pillars page stay the
     same white background as is just the divider with the strategic pillars
     title."* The cost he took with it is one slide per deck; what it buys is
     that all four sections are announced the same way, and that the roll-call
     goes on reading as the content slide it is. */
  if (u.items.length)
    S.push(sectSlide("spillars", "After the Strategic pillars divider",
      "Strategic " + L("pillar","bu").toLowerCase(),
      "The " + u.items.length + " " + L("pillar","bu").toLowerCase() +
        " " + (u.fnKey ? u.name : "this unit") + " committed to, and how each is going.", null));

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
      sec(pillarCode(u, pi), p.name) +
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
         its own target, prorated where it compiles by Sum or Count (§276); everything else
         with the share of its plan that is due (§239). One function, so the
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
  /* THE CLOSING BLOCK GETS A DIVIDER OF ITS OWN (§259.1), and it carries
     NO NUMBERS — Islam's B, from two drawn in the real deck. A prints the
     three headline readings two slides before the slide whose whole job is
     those three readings, and prints them without their bands or the change
     on last cycle: the room reads them once flat and once properly and
     cannot tell which is the real one (§87's twins, in figures). The stand
     slide always draws, so there is always something behind this. */
  S.push(sectSlide("sperf", "After the Overall performance divider",
    "Overall performance",
    "Where the " + L("pillar","bu").toLowerCase() + " stand, where " +
      (u.fnKey ? u.name : "the unit") + " stands, and what the cycle is remembered for.",
    null));
  if (u.items.length) S.push(pillarScoreSlide);
  S.push(standSlide);
  if (noteSlide) S.push(noteSlide);

  S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last \u2014 before Thank you", "before") +
    sec("END", "Thank you") +
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

  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") +
    sec("COVER", f.name, true) + '>' +
    (groupLogo()
        ? '<img class="dcovermark" src="' + esc(groupLogo()) + '" alt="' + esc(GROUP.org) + '">'
        : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
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
      sec(secTwo(c.name), c.name) +
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
    sec("END", "Thank you") +
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
  var src = deckMark(u);
  if (!src) return;
  [].forEach.call(deck.querySelectorAll(".dslide"), function(s){
    s.classList.add("hasmark");
    /* Skipped on the slide that already wears the mark LARGE, and only
       there. Written first against `.d-cover`, which silently took the
       footer off five more: the SWOT and pillar dividers carry that class
       too, and so does Thank you. Asking whether the mark is already on
       the slide cannot make that mistake. */
    if (s.querySelector(".dcovermark")) return;
    /* AND NOT ON A SECTION DIVIDER (§259.1). Islam: *"remove the logo footer
       from the blue pages."* It also removes a fault rather than dressing
       one: the plate that keeps a navy lockup readable on a dark slide is
       switched on by the PAGE being dark, which a blue divider on a light
       page is not — so the mark would have sat navy on navy. */
    if (s.classList.contains("d-sect")) return;
    s.insertAdjacentHTML("beforeend",
      '<div class="dfoot"><img class="dfootmark" src="' + esc(src) + '" alt=""></div>');
  });
}

/* ── ONE SUBJECT'S FINISHED DECK (§266) ───────────────────────────────
   `deckHtmlFor()` answers which slides a subject gets; this answers what its
   deck actually IS — those slides with the custodian's pictures inserted, the
   office's hidden ones removed and the subject's own mark footed on. Every
   one of those passes was already run by `openDeckWith()` and none of them
   measures anything, so they run identically on a detached element (the one
   pass that DOES measure, `deckFitPass()`, still runs on the deck in the
   document, once, at the end — §69.5's note explains why it cannot move).

   IT EXISTS BECAUSE A FLOW IS SEVERAL OF THESE. Concatenating first and
   passing afterwards would hide one subject's slides behind another's marks:
   `deckFootMarks()` foots the whole deck with ONE mark and `deckHidePass()`
   reads ONE subject's hidden list, so both have to run per subject or a flow
   would wear the first unit's lockup throughout and hide the wrong slides.

   AND EVERY SLIDE IS STAMPED WITH WHOSE IT IS, on a single deck as well as in
   a flow (§53.5: one builder, one behaviour). It costs a single-subject deck
   two attributes nothing reads, and it is what lets the strip at the bottom
   name the subject you are standing in without keeping a second list beside
   the deck that could disagree with it. */
function deckBuild(target){
  var frag = document.createElement("div");
  frag.innerHTML = deckHtmlFor(target);
  insertPictureSlides(frag, target);
  deckHidePass(frag, target);
  /* EVERY deck, not only a unit's (§259). `deckMark()` answers with the
     subject's own mark or the group's, and a supporting function is not in
     UNITS — so passing null here is not a miss, it is the case that used to
     go unmarked and now wears the group's. */
  deckFootMarks(frag, UNITS[target] || null);
  var name = placeLabel(target);
  [].forEach.call(frag.querySelectorAll(".dslide"), function(sl){
    sl.dataset.subject = target;
    sl.dataset.subjectName = name;
  });
  return frag.innerHTML;
}

/* ── THE ONE OPENER (§266) ────────────────────────────────────────────
   A unit's Present, a function's Present and the office's master flow are
   three doors onto one act, and they differ only in HOW MANY subjects go in —
   so there is one opener taking a list, rather than a second one for flows
   that would have to be kept in step with this one (§53.5, and §253.3's own
   lesson about a deck assembled two ways).

   `DECK.flow` is the LIST OF SUBJECTS, held only while a flow is open. It is
   read by the strip at the bottom and by nothing else; a single subject sets
   it to null, so every existing behaviour is untouched by construction. */
function openDeckWith(titleHtml, targets, from){
  var root = document.getElementById("deckroot");
  var list = [].concat(targets).filter(Boolean);
  root.querySelector(".deck").innerHTML = list.map(deckBuild).join("");
  /* ── THE WAY BACK, AND THE WORD FOR IT (§295) ─────────────────────
     BOTH BRANCHES, EVERY OPEN. Stamping only the editor's case would leave the
     word standing on the next deck opened from a page — a button reading "Back
     to slides" that lands on the platform is worse than one that never said it.

     THE WORD SAYS WHERE YOU LAND, which is the platform's own habit (§124):
     "Exit" is true of a deck opened from the page and false of one played from
     the editor, and a presenter who has just been arranging slides is the one
     person who would read it literally.

     `from` is optional, so `openDeck`, `openDeckFn` and the master flow are
     unchanged by construction. Checked rather than assumed (§250.1): none of
     the three is ever passed BY NAME, so no caller picks the new parameter up
     from a `map` index. */
  DECK.from = from === "editor" ? "editor" : "page";
  var back = DECK.from === "editor";
  var ex = root.querySelector("[data-dexit]");
  ex.textContent = back ? "Back to slides" : "Exit";
  ex.title = (back ? "Back to slides" : "Exit") + " (Esc)";
  DECK.flow = list.length > 1 ? list : null;
  DECK.title = titleHtml;
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
function openDeck(u, from){
  openDeckWith("<b>" + esc(u.name) + "</b> &middot; " + esc(REVIEW.name), [u.ukey], from);
}
function openDeckFn(fk, from){
  openDeckWith("<b>" + esc(FUNCTIONS[fk].name) + "</b> &middot; " + esc(REVIEW.name),
    ["fn:" + fk], from);
}
/* ── WHICH DECK A TARGET GETS, ASKED ONCE (§295) ──────────────────────────
   §224 fixed this branch on the Present button and §253.3 fixed it again on
   Manage slides and the anchors, each time because it had been written out
   separately — so the third caller (Play) is the moment to stop copying it.
   The two doors above stay: §253.3 keeps them deliberately, and this is the
   resolver in front of them rather than a replacement for either.

   THE FORMAT DECIDES, NEVER THE PREFIX: a function that plans in PILLARS is
   unit-shaped, so it takes the unit deck through `unitLike()`, and only a
   capability function takes `openDeckFn`. Asking by `fn:` alone is what gave a
   pillars function a deck reading "Capability review - 0 capabilities". */
function openDeckFor(target, from){
  var t = String(target);
  var fk = t.indexOf("fn:") === 0 ? t.slice(3) : null;
  if (fk && !fnPlansInPillars(FUNCTIONS[fk])) openDeckFn(fk, from);
  else openDeck(unitLike(t), from);
}

/* ══ THE MASTER PRESENTATION (§266) ═══════════════════════════════════
   Islam: *"give an option for the SMO from the presentation list to do master
   presentation which is a flow of presentations in a flow and he is just asked
   the flow of the units and functions who will present he make the flow and
   all the slides are put back to back to be presented in one flow."*

   NOTHING IS ASSEMBLED THAT WAS NOT ASSEMBLED BEFORE. A flow is the decks the
   Present button already opens, one after another, through `deckBuild()` — so
   a picture the custodian placed, a slide the office hid and the subject's own
   mark all travel with it, and none of them needed a line of their own here.

   EVERY DECK TRAVELS WHOLE, INCLUDING ITS THANK YOU — Islam's decision,
   reversing the recommendation put to him: *"evey deck for transition."* The
   argument is the room's rather than the screen's: that slide is what marks
   the end of one subject's turn before the next cover arrives. It is also the
   cheaper build and it removes a rule — a deck inside the flow is byte for
   byte the deck that subject presents alone, so there is no second version of
   anybody's deck and nothing to explain about which slides a flow drops. */

/* Every subject that can be asked for a report, in the register's own order —
   the SAME pair of lists the cycle board is built from (§245), so the picker
   and the page the office watches can never disagree about who reports. */
function masterSubjects(){
  return boardUnitTargets().concat(boardFunctionTargets());
}
/* The running order to open the picker on: the stored one, filtered to
   subjects that still report, and the whole list in board order when nothing
   is stored. A subject added to the tenant AFTER an order was agreed arrives
   NOT presenting rather than being appended — walking a new unit into a board
   meeting because somebody created it is the office's decision, not ours. */
function masterOrder(){
  var all = masterSubjects();
  var kept = SMPRules.masterFlow(GROUP).filter(function(t){ return all.indexOf(t) >= 0; });
  return kept.length ? kept : all.slice();
}
/* Stored as an ABSENCE (§50.6): an order that is simply everybody in the
   board's own order is what an untouched tenant already has, so it deletes the
   key rather than writing a copy of the default — which also means a unit
   added tomorrow joins the flow of a tenant that never chose one, and does not
   join one that did. */
function masterWrite(list){
  var all = masterSubjects();
  if (list.length && !(list.length === all.length && list.every(function(t, i){ return t === all[i]; })))
    GROUP[SMPRules.MASTER_FLOW] = list.slice();
  else delete GROUP[SMPRules.MASTER_FLOW];
  masterMark();
}
/* Schedule the save without a repaint, exactly as Manage slides does (§170's
   rule from the one place that cannot end in `paint()`): this dialog draws its
   own body, and a `paint()` here would rebuild the page behind an inert
   overlay for no reason (§90.4). */
function masterMark(){ if (typeof SYNC !== "undefined" && SYNC.afterPaint) SYNC.afterPaint(); }

var MFLOW = null;

function masterOpen(){
  /* ASKED AGAIN AT THE PRESS, never trusted from the render that drew the
     entry (§48.2): the menu is drawn once and a viewer switch is one click. */
  if (!SMPRules.mayMasterPresent(world(), viewer())) return;
  MFLOW = { pick: masterOrder(), n: {}, note: "", q: "", focusAt: null, h: null };
  openModalHtml("Master presentation", "Pick who presents, and in what order.", "");
  /* WIDER, AND MARKED ON THE OVERLAY (§122, §266.10). Islam: *"make the popup
     a bit bigger to see more of the units and functions."* Two tables of four
     and five columns in a 940px dialog leaves each about 440px, which clips a
     name before the Kind column is reached — never loosened on `.modal`, which
     every dialog in the product shares, and taken off again in `closeModal()`
     rather than left standing on the next thing that opens. */
  var ov = document.getElementById("overlay");
  if (ov) ov.classList.add("mflow-on");
  masterPaint();
}

/* How many slides a subject brings. Counted once per opening and remembered,
   because every tick redraws this dialog and eighteen decks assembled on each
   press is eighteen decks nobody asked for. It is the deck's own count BEFORE
   the fit pass, which splits a long table across slides at present time — so
   the total is stated as "about", rather than as a number the counter in the
   deck will then disagree with (§35). */
function masterCount(t){
  if (MFLOW.n[t] == null) {
    var box = document.createElement("div");
    box.innerHTML = deckBuild(t);
    MFLOW.n[t] = box.querySelectorAll(".dslide").length;
  }
  return MFLOW.n[t];
}

/* ── TWO COLUMNS, AND IT IS A REVERSAL (§266.8) ───────────────────────
   Islam, having used what §266.4 shipped: *"i changed my opinion the 2 columns
   option was better."* Both shapes were drawn in the real dialog before
   anything was built and he picked the single list then; this is the other one,
   and the earlier choice is recorded rather than overwritten (Principle II).

   WHAT CHANGES IS WHERE THE ROWS ARE DRAWN AND NOTHING ELSE. The list of
   subjects, the order, what a press writes and when it is saved are all
   §266.4's and are untouched — which is the whole reason a reversal here costs
   an afternoon rather than a rebuild: `MFLOW.pick` was always the running
   order, and a column is a way of showing it.

   AND EACH COLUMN SAYS WHEN IT IS EMPTY (§45.2). An empty half of a split
   reads as a pane that failed to render, and this one has two states that
   legitimately empty it: nobody picked yet, and everybody picked. */

/* ── AND THE COLUMNS BECOME TABLES, SEARCHED AND DRAGGED (§266.10) ────
   Islam, from his own tenant's picker: *"make the everyone who reports
   searchable and make it a simple table wiht a nother oclumn of a BU or a FUNC
   and make the popup a bit bigger to see more of the units and functions"*,
   and then of the running order: *"make the right hand side without the up and
   down arrows just the x to remove and make the list can be dragged by a
   handle to rearrange if needed"*, and *"do you think the handle can be the
   same as the number?"*

   THE ROWS ARE THE SAME ROWS. `masterSubjects()`, `masterOrder()`,
   `masterWrite()` and every server rule are untouched again — this is the
   third time this dialog has been redrawn without the list underneath it
   moving, and it stays cheap for the same reason: `MFLOW.pick` is the running
   order and a table is a way of showing it.

   THE DRAG IS `makeSortable`, NEVER A SECOND ONE. The number is drawn as
   `.idx-n` and the bars come from `handle()`, so the platform's own sortable
   renumbers, refuses a commit that is not a permutation (§118) and moves a row
   from the keyboard — all of it already written, and a second copy of a drag
   is a second set of those bugs (§53.5).

   AND THE SWAP IS HELD WHILE A DRAG IS ON — measured on the drawing before
   this was built. With the digit-to-bars swap driven by `:hover` alone, a
   four-row drag swapped the bars SIX times, and half of those put them on a
   row the pointer was PASSING rather than on the row in hand: the row moves in
   whole-row steps while the pointer moves continuously, so for about half of
   every row crossed the pointer is not over the dragged handle at all. That is
   the whole of "the handle feels glitchy", and it belongs to the treatment
   rather than to any drawing — the CSS holds the swap on `tr.dragging` and
   takes it away from every other row while `tbody` is `.sorting`.

   TYPING NEVER REPAINTS (§35, §108.13). The search hides rows in place and
   rewrites two counts; a repaint would replace the box being typed into. And
   a repaint KEEPS the filter, or ticking somebody quietly shows the whole list
   again to a person who believes they are reading their results. */
function masterKind(t){
  return String(t).indexOf("fn:") === 0
    ? '<span class="mfkind fn">FUNC</span>' : '<span class="mfkind">BU</span>';
}
function masterPaint(){
  var box = document.getElementById("modal-b");
  if (!box || !MFLOW) return;
  var all = masterSubjects();
  var rest = all.filter(function(t){ return MFLOW.pick.indexOf(t) < 0; });
  var total = MFLOW.pick.reduce(function(a, t){ return a + masterCount(t); }, 0);
  /* Waiting to be picked. The row carries the name AND the code the deck's own
     pills show while presenting (§266.9), because both are what somebody would
     type — and lower-cased once here rather than on every keystroke. */
  var off = function(t){
    var name = placeLabel(t);
    return '<tr data-mfrest="1" data-mffind="' +
        esc((name + " " + deckCode(t, name)).toLowerCase()) + '">' +
      '<td class="c-t"><button class="mftick" data-mftick="' + esc(t) + '"' +
        ' aria-label="Put ' + esc(name) + ' into the flow">✓</button></td>' +
      '<td class="c-nm">' + esc(name) + '</td>' +
      '<td class="c-k">' + masterKind(t) + '</td>' +
      '<td class="c-n">' + masterCount(t) + '</td></tr>';
  };
  /* In the flow: the number IS the handle, and the × is the SAME `data-mftick`
     the left column uses, because it is the same act — one handler, so the two
     columns cannot answer differently (§53.5). */
  var on = function(t, i){
    var name = placeLabel(t);
    return '<tr data-oi="' + i + '">' +
      '<td class="mfh"><span class="idx-n">' + (i + 1) + '</span>' +
        handle("Drag to reorder " + name) + '</td>' +
      '<td class="c-nm"><b>' + esc(name) + '</b></td>' +
      '<td class="c-k">' + masterKind(t) + '</td>' +
      '<td class="c-n">' + masterCount(t) + '</td>' +
      '<td class="c-x"><button class="mfx" data-mftick="' + esc(t) + '" title="Take out"' +
        ' aria-label="Take ' + esc(name) + ' out of the flow">×</button></td></tr>';
  };
  box.innerHTML = '<div class="mflow"><div class="mfcols">' +
    '<div class="mfcol"><div class="mfhead">' +
      '<h4>Everyone who reports</h4>' +
      '<input class="mffind" data-mffind-box="1" autocomplete="off"' +
        ' placeholder="Search a unit or function…"' +
        ' aria-label="Search a unit or function" value="' + esc(MFLOW.q || "") + '">' +
      '<span class="mfcount" data-mfrestcount></span></div>' +
      '<div class="mflist"><table class="mftbl"><thead><tr>' +
        '<th class="c-t"></th><th>Name</th><th class="c-k">Kind</th>' +
        '<th class="c-n">Slides</th></tr></thead><tbody>' +
        rest.map(off).join("") + '</tbody></table>' +
      '<p class="mfempty" data-mfrestempty' + (rest.length ? ' hidden' : '') + '>' +
        'Everybody is in the flow.</p></div></div>' +
    '<div class="mfcol"><div class="mfhead"><h4>The flow</h4>' +
      '<span class="mfcount">' +
        (MFLOW.pick.length ? 'about ' + plural(total, "slide") : '') + '</span></div>' +
      '<div class="mflist"><table class="mftbl"><thead><tr>' +
        '<th class="c-h"></th><th>Name</th><th class="c-k">Kind</th>' +
        '<th class="c-n">Slides</th><th class="c-x"></th></tr></thead>' +
        '<tbody data-mfflow>' + MFLOW.pick.map(on).join("") + '</tbody></table>' +
      '<p class="mfempty"' + (MFLOW.pick.length ? ' hidden' : '') + '>' +
        'Nobody yet — tick a unit or function on the left.</p></div></div>' +
    '</div>' +
    (MFLOW.note ? '<p class="mfnote" role="status">' + esc(MFLOW.note) + '</p>' : '') +
    '<div class="cbtns"><button data-mfno="1">Cancel</button>' +
    '<button class="mfgo" data-mfgo="1"' +
      (MFLOW.pick.length ? "" : ' aria-disabled="true"') +
      '>Start the flow</button></div></div>';
  masterWire();
  /* AFTER the wiring, and from HERE rather than from inside it: the count is
     the whole list's, which `masterWire()` does not hold — the first build
     passed it `all.length` from a scope that function cannot see, and every
     paint threw with the dialog still on screen (§130.3's fault, found by
     opening it). */
  masterFix(box, all.length);
}

/* ── ONE HEIGHT, WHATEVER THE SPLIT (§266.11) ─────────────────────────
   The two lists take the height the WHOLE list would need — both columns
   together — so ticking a subject moves a row from one box to the other and
   moves nothing else. It is measured, never a constant: a row and a header are
   read off the page, because a number written here goes stale the day the type
   scale or the padding changes and nothing compares the two (§122.5).

   Measured ONCE per opening and remembered, because the count it is derived
   from cannot change while the dialog is open — and written as
   `min(Npx, 52vh, 420px)` rather than as a flat pixel height, so a short window
   still keeps the buttons on screen (§90) and a resize while it is open is
   still followed. */
function masterFix(box, rows){
  if (!box || !rows) return;
  if (MFLOW.h == null) {
    var tr = box.querySelector(".mftbl tbody tr");
    var th = box.querySelector(".mftbl thead tr");
    if (!tr || !th) return;
    var rh = tr.getBoundingClientRect().height;
    var hh = th.getBoundingClientRect().height;
    if (!rh || !hh) return;
    MFLOW.h = Math.ceil(hh + rows * rh + 2);
  }
  [].forEach.call(box.querySelectorAll(".mflist"), function(l){
    l.style.height = "min(" + MFLOW.h + "px, 52vh, 420px)";
  });
}

/* The search, in place. Both counts are rewritten INTO their nodes rather than
   by repainting, and the empty line says which of the two silences this is —
   nobody left to pick, or nothing matching what was typed (§105). */
function masterFilter(){
  var box = document.getElementById("modal-b");
  if (!box) return;
  var q = (MFLOW.q || "").toLowerCase();
  var rows = box.querySelectorAll("tr[data-mfrest]");
  var shown = 0;
  [].forEach.call(rows, function(tr){
    var hit = !q || tr.dataset.mffind.indexOf(q) >= 0;
    tr.hidden = !hit;
    if (hit) shown++;
  });
  var c = box.querySelector("[data-mfrestcount]");
  if (c) c.textContent = rows.length ? (q ? shown + " of " + rows.length : String(rows.length)) : "";
  var e = box.querySelector("[data-mfrestempty]");
  if (e) {
    e.hidden = shown > 0;
    e.textContent = rows.length === 0 ? "Everybody is in the flow."
                                      : "Nothing matches “" + MFLOW.q + "”.";
  }
}

/* Whoever rewrites the DOM re-wires it, in the same function (§29.5, §116) —
   and scoped to the dialog's own body, or a second handler is bound to the
   page behind it on every tick (§24, §47.2). */
function masterWire(){
  var box = document.getElementById("modal-b");
  if (!box) return;
  var find = box.querySelector("[data-mffind-box]");
  [].forEach.call(box.querySelectorAll("[data-mftick]"), function(b){
    b.addEventListener("click", function(){
      /* The search keeps the cursor when a tick was made from the search: the
         next name is usually typed straight after, and the repaint that moves
         the row between the columns would otherwise take the box away. */
      var had = find && document.activeElement === find;
      var t = this.dataset.mftick, at = MFLOW.pick.indexOf(t);
      if (at >= 0) MFLOW.pick.splice(at, 1);
      else MFLOW.pick.push(t);
      MFLOW.note = "";
      masterWrite(MFLOW.pick);
      masterPaint();
      if (had) {
        var f = box.querySelector("[data-mffind-box]");
        if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
      }
    });
  });
  if (find) find.addEventListener("input", function(){
    MFLOW.q = this.value.trim();
    masterFilter();
  });
  /* THE PLATFORM'S OWN SORTABLE (§101, arrange.js), never a second one: it
     renumbers `.idx-n`, moves a row from the keyboard, and refuses a commit
     that is not a permutation of the list it is applied to (§118). */
  var tb = box.querySelector("[data-mfflow]");
  if (tb && MFLOW.pick.length > 1) {
    /* WHERE A KEYBOARD MOVE IS GOING, CAPTURED BEFORE IT HAPPENS. Moving a
       row with `insertBefore` blurs whatever inside it had the focus, so by
       the time the commit runs `document.activeElement` is the body and there
       is nothing left to say which row was moved — measured, not assumed. In
       the capture phase, so this runs before `makeSortable`'s own handler on
       the grip; a press at either end of the list moves nothing and is
       recorded as nothing, or the next DRAG would inherit a stale row. */
    tb.addEventListener("keydown", function(e){
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) < 0) return;
      var row = e.target.closest ? e.target.closest("tr[data-oi]") : null;
      var rows = tb.querySelectorAll("tr[data-oi]");
      var at = row ? [].indexOf.call(rows, row) : -1;
      var to = at + (e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1);
      MFLOW.focusAt = (at < 0 || to < 0 || to >= rows.length) ? null : to;
    }, true);
    makeSortable(tb, "tr", masterMoved);
  }
  masterFilter();
  /* A NAME TOO LONG FOR ITS COLUMN IS ONE HOVER AWAY (§88's rule, on a control
     rather than a setup table) — and it is MEASURED rather than guessed, so a
     name that fits gets no title and does not steal the hover from anything
     else (§93.6). At a 1000px window the longest of the tenant's own names is
     the one that needs it. */
  [].forEach.call(box.querySelectorAll(".mftbl .c-nm"), function(td){
    var full = td.textContent.trim();
    td.title = td.scrollWidth > td.clientWidth ? full : "";
  });
  /* A row moved by the keyboard keeps the focus and comes into view — the drag
     cannot scroll the list and the keyboard can. */
  if (MFLOW.focusAt != null) {
    var rows = box.querySelectorAll("[data-mfflow] tr[data-oi]");
    var row = rows[MFLOW.focusAt];
    MFLOW.focusAt = null;
    if (row) {
      var g = row.querySelector(".grip");
      if (g) g.focus();
      row.scrollIntoView({ block: "nearest" });
    }
  }
  var no = box.querySelector("[data-mfno]");
  if (no) no.addEventListener("click", function(){ closeModal(); });
  var go = box.querySelector("[data-mfgo]");
  /* SAID, NEVER DISABLED (§221, §163): a disabled button takes no focus, so
     the one sentence explaining why it will not go could not be reached. */
  if (go) go.addEventListener("click", function(){
    if (!MFLOW.pick.length) {
      MFLOW.note = "Tick at least one unit or function to present.";
      masterPaint();
      return;
    }
    var list = MFLOW.pick.slice();
    closeModal();
    openDeckWith("<b>Master presentation</b> &middot; " + esc(REVIEW.name), list);
  });
}

/* A committed order, applied to the running order through `applyOrder` — which
   leaves the list UNTOUCHED rather than half-applying anything that is not a
   permutation (§118). Where the focus goes afterwards is decided before the
   move, above: a pointer drag never focuses the grip, so `focusAt` is null and
   a mouse never gets a focus ring it did not ask for. */
function masterMoved(order){
  applyOrder(MFLOW.pick, order);
  masterWrite(MFLOW.pick);
  masterPaint();
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
  /* ── ONE DOOR DECIDES WHERE YOU LAND (§295, §53.5) ────────────────
     Escape and the bar's own button both arrive here, so the return path is
     written once and the two cannot disagree about it.

     ASKED OF THE EDITOR'S CLASS AS WELL AS THE FLAG: the deck outlives nothing
     here, but a build that ever closed the editor while a deck it opened was
     still up would otherwise return to a hidden pane and leave the platform
     inert behind it. Both, or neither. */
  var toEditor = DECK.from === "editor" &&
                 document.getElementById("slideroot").classList.contains("on");
  DECK.from = "page";
  root.classList.remove("on");
  /* The fullscreen class goes with it. `fullscreenchange` would clear it too,
     but only if the deck was in fullscreen — a deck closed from windowed mode
     never fires that event, and `fs` left standing would give the NEXT deck a
     hidden bar and a click that advances slides (§265) in a window. */
  root.classList.remove("fs");
  /* `presenting` STAYS when the editor is underneath — it is the editor's too
     (it is what hides the chat dock and stops the page behind scrolling), so
     removing it here would give the mode back its scrollbar and its bubble the
     moment a deck closed over it. */
  if (!toEditor) document.body.classList.remove("presenting");
  if (document.fullscreenElement) document.exitFullscreen();
  if (toEditor) slidesResume();
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

/* Where each subject's deck starts, in the order the slides are in. Read off
   the SLIDES rather than off `DECK.flow`, so a subject whose deck came out
   empty cannot leave a dot pointing at somebody else's cover (§61), and the
   answer is the deck's own rather than a description of it (§50.3). */
/* ── THE PILL SAYS WHICH SUBJECT (§266.9) ─────────────────────────────
   Islam, running a real flow of 308 slides: *"in the pills to write the
   inittials of the unit for better navigation."* Thirteen identical dots is a
   row you can count but cannot read.

   THE LETTERS EXIST ALREADY AND ARE NOT INVENTED HERE. Every unit and every
   supporting function carries a `codePrefix` — MB, RS, FIN, MRC — and it is
   what the tenant reads on every pillar and project code in the product
   (MB01, FIN01). Deriving initials of our own would be a second abbreviation
   for one thing, drifting from the first the day somebody edits it in Setup
   (§53.5, §25) — and it would put CA on both Cares, which the prefixes
   already tell apart (CA and CAF).

   THE FALLBACK IS ONLY FOR A SUBJECT THAT HAS NONE: a unit added this morning
   and not yet given a prefix. Two letters, because one is not a name and three
   from an unknown word is a guess. */
function deckCode(target, name){
  var o = String(target).indexOf("fn:") === 0
    ? FUNCTIONS[String(target).slice(3)] : UNITS[target];
  var pre = o && o.codePrefix;
  if (pre) return String(pre).toUpperCase();
  var words = String(name || target).trim().split(/\s+/).filter(Boolean);
  return (words.length > 1
    ? words[0].charAt(0) + words[1].charAt(0)
    : String(words[0] || "").slice(0, 2)).toUpperCase();
}
function deckStops(){
  var out = [];
  DECK.slides.forEach(function(sl, k){
    var t = sl.dataset.subject;
    if (!t || (out.length && out[out.length - 1].t === t)) return;
    var name = sl.dataset.subjectName || t;
    out.push({ t:t, name:name, code:deckCode(t, name), at:k });
  });
  return out;
}
/* ── ONE DOT PER SLIDE, OR ONE PER SUBJECT (§266) ─────────────────────
   Islam, of the strip on a flow: *"ok"* to both. The dots are one per slide
   and pressing one jumps to it, which is right for a deck of twenty-eight and
   measured as broken well before a flow needs them: at 71 slides they already
   wrap onto THREE ROWS and spill past the strip, and eighteen subjects is 335.

   So in a flow they become one per SUBJECT — eighteen at most — each jumping
   to that subject's cover, while the counter goes on counting slides, because
   "32 / 71" is the question a presenter actually asks of it. A single
   subject's deck is untouched: `DECK.flow` is null there and this is the
   branch it has always taken. */
/* The sections of ONE subject's deck, read off the slides themselves (§266.12).
   A `data-sec` is written by the builder that knows the code and the name, so
   this reads a declaration rather than parsing a heading. */
function deckSections(){
  var out = [];
  DECK.slides.forEach(function(sl, k){
    if (!sl.dataset.sec) return;
    out.push({ at: k, code: sl.dataset.sec, name: sl.dataset.secName || sl.dataset.sec,
               head: sl.dataset.secHead === "1" });
  });
  return out;
}
/* One pill per stop, and the pills gathered into the parts of the review
   (§266.12). Islam, of the four treatments drawn: *"B is good but we can make
   them grouped like C as well."*

   THE GROUPS ARE THE DECK'S OWN FOUR BLUE DIVIDERS (§259) — nothing invented
   for the bar, and the four pillars read as one stretch of the review rather
   than as four things among ten. A flow's strip is untouched: there the stops
   are subjects and every one is its own group. */
function deckPills(stops, grouped){
  var pill = function(st){
    /* The code is DRAWN and the name is on the hover: a pill wide enough to
       hold "Strategy Management Office" is not a pill (§88's rule, on the
       projector's own chrome). */
    return '<button class="ddot" data-dgo="' + st.at + '" title="' + esc(st.name) +
      '" aria-label="' + esc(st.name) + '">' + esc(st.code) + '</button>';
  };
  if (!grouped) return stops.map(pill).join("");
  var out = "", open = false;
  stops.forEach(function(st, k){
    if (!k || st.head) { if (open) out += "</div>"; out += '<div class="dgrp">'; open = true; }
    out += pill(st);
  });
  return out + (open ? "</div>" : "");
}
function deckIndex(){
  var root = document.getElementById("deckroot");
  DECK.slides = [].slice.call(root.querySelectorAll(".dslide"));
  root.querySelector(".dcount-t").textContent = DECK.slides.length;
  var dots = root.querySelector(".ddots");
  /* ONE LIST FOR BOTH (§53.5): a flow's stops are its subjects and one deck's
     are its sections, and everything downstream — which pill is lit, which one
     a slide belongs to — asks `DECK.stops` without caring which it got. A deck
     that declares fewer than two sections falls back to a dot per slide, so a
     shape nobody has thought of still gets a strip (§61). */
  var secs = DECK.flow ? null : deckSections();
  DECK.stops = DECK.flow ? deckStops() : (secs && secs.length > 1 ? secs : null);
  dots.classList.toggle("bysub", !!DECK.stops);
  dots.classList.toggle("bygrp", !!DECK.stops && !DECK.flow);
  dots.innerHTML = DECK.stops
    ? deckPills(DECK.stops, !DECK.flow)
    : DECK.slides.map(function(_, k){
        return '<button class="ddot" data-dgo="' + k + '" aria-label="Slide ' + (k+1) + '"></button>';
      }).join("");
  [].forEach.call(dots.querySelectorAll(".ddot"), function(b){
    b.addEventListener("click", function(){ deckShow(+b.dataset.dgo); });
  });
}
/* Which subject's stretch of the deck slide `i` falls in — the LAST stop at
   or before it, never the one whose `at` matches, or every slide but a cover
   would belong to nobody. */
function deckStopAt(i){
  var stops = DECK.stops || [], k = -1;
  stops.forEach(function(st, j){ if (st.at <= i) k = j; });
  return k;
}
function deckShow(n){
  DECK.i = Math.max(0, Math.min(DECK.slides.length - 1, n));
  DECK.slides.forEach(function(s, k){ s.classList.toggle("on", k === DECK.i); });
  var root = document.getElementById("deckroot");
  /* §261.14: the player is loaded on THIS slide and on no other, which is
     what stops a clip left behind owning the arrow keys from behind
     `display:none`. Named `shown` and never `here`: §266's `here` two lines
     down is a STOP INDEX in the master flow, and one scope holding two
     meanings of one word is §56.7 waiting to happen. */
  var shown = DECK.slides[DECK.i];
  videoArm(root, shown);
  var here = DECK.stops ? deckStopAt(DECK.i) : -1;
  [].forEach.call(root.querySelectorAll(".ddot"), function(b, k){
    b.classList.toggle("on", DECK.stops ? k === here : k === DECK.i);
  });
  /* THE STRIP NAMES THE SUBJECT YOU ARE STANDING IN (§266). On one subject's
     deck the title named it and that was enough; in a flow it read "Master
     presentation" on slide 1 and on slide 71 alike, which names nothing. The
     running order is stated with it, because "which unit is this" and "how
     much is left" are the two questions a room asks. Written into the node,
     never repainted (§63): this runs on every arrow press. */
  /* THE FLOW'S, NEVER ONE DECK'S. §266.12 gives a single deck stops of its own,
     and `DECK.stops` is now set for both — so this had to start asking
     `DECK.flow`, or a unit's deck would rename its own title bar "Foundation ·
     2 of 10" and lose the unit (§266's whole reason for writing it). */
  if (DECK.flow && DECK.stops && here >= 0) {
    var st = DECK.stops[here];
    root.querySelector(".dtitle").innerHTML =
      "<b>" + esc(st.name) + "</b> &middot; " + (here + 1) + " of " + DECK.stops.length +
      " &middot; " + esc(REVIEW.name);
  }
  root.querySelector(".dcount-c").textContent = DECK.i + 1;
}
/* §265 DELETED `deckPeek()` AND ITS TIMER FROM HERE, reversing the second half
   of §69.7. It brought the bar back for 2.2 seconds whenever the pointer moved,
   which was the right answer to "how does a presenter find Exit" and the wrong
   thing to put on a projector: `pointerdown` is a move, so every click during a
   review flashed a navy strip across the bottom of the slide and took it away
   again — Islam, from a live presentation, "with every click the bottom banner
   appear then hide."

   Removed rather than switched off (§24): the two pointer listeners, the timer,
   the `peek` class and the CSS rule that read it are all gone, so nothing is
   left for a later reader to take as load-bearing. What replaces it is the
   keyboard, which the room cannot see — and Escape, which leaves fullscreen
   rather than closing the deck, so the bar comes back whole. */

/* Scale the fixed stage into whatever room there is. */
function deckScale(){
  var root = document.getElementById("deckroot");
  var deck = root.querySelector(".deck");
  if (root.classList.contains("fitwin")) { deck.style.transform = ""; return; }
  var st = root.querySelector(".deckstage");
  var k = Math.min(st.clientWidth / 1600, st.clientHeight / 900);
  deck.style.transform = "scale(" + k + ")";
}

/* ── DRIVING THE DECK WITH A FINGER (§280) ──────────────────────────────
   Three small pieces of state, and each is here rather than inside a handler
   because the tap and the swipe are two readings of ONE gesture and have to
   agree about it.

   `DECKPOINTER` is what produced the gesture. A `click` is not reliably a
   PointerEvent, so the kind is remembered from the pointerdown that came
   before it (§280). It starts as "mouse", so a click arriving with no
   pointerdown at all — a keyboard-driven one — takes the mouse branch and
   moves forward, which is §265's behaviour unchanged.

   `DECKSWIPED` is how the two readings agree: a swipe ends in a click, so
   without it one gesture would move two slides.

   `DECKFROM` is where a swipe began, and is null whenever a swipe could not
   legitimately start — outside fullscreen, on a control, or under a mouse. */
var DECKPOINTER = "mouse", DECKSWIPED = false, DECKFROM = null;

/* A finger travels while it presses, so a tap is never exactly still: this is
   the line between "they meant to tap" and "they meant to swipe". 45px is
   about 6mm on a tablet — further than a tap wanders and shorter than any
   deliberate swipe. */
var DECKSWIPE_MIN = 45;

/* The one answer to "is this the stage, or something ON the stage" — asked by
   the tap and by the swipe, or a gesture that starts in the note box is
   refused by one and obeyed by the other (§53.5). */
function deckOwnControl(t){
  return !!(t && t.closest &&
    /* ── A PLAYER IS SOMETHING ON THE STAGE, NOT THE STAGE (§296) ────
       A click inside an IFRAME never reaches this document, so the embed was
       safe by accident — but a native `<video>` is in our own page, and its
       clicks land here. In fullscreen, where §265 makes a click on the stage
       advance the slide, pressing that player's own play button moved the deck
       on as well: the one gesture Islam named as how a clip should be
       controlled, doing two things at once. `.vwrap` covers the poster and the
       "opens in a new tab" card in the same breath. */
    t.closest(".deckbar, .vwrap, video, iframe, button, a, input, textarea, " +
              "select, [contenteditable]"));
}

function wireDeck(){
  var root = document.getElementById("deckroot");
  /* The keyboard is the presentation's, on every slide (§296). Armed once,
     here, beside the rest of the deck's wiring. */
  videoKeepKeys(root);
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
  /* ── A CLICK ON THE SLIDE MOVES FORWARD, IN FULLSCREEN ONLY (§265) ──
     Islam's choice, so a tablet or a borrowed mouse can still drive the deck
     with the bar gone.

     `.fs` alone, because windowed mode has the bar's own Next button six
     inches below and a click-to-advance stage as well would be two answers to
     one act (§53.5) — and the cycle note is edited on that same stage.

     THE INTERACTIVE TARGETS ARE EXCLUDED, or clicking into the note box to
     type would advance the slide out from under the cursor: a `click` that
     lands on a control is that control's, never the stage's.

     ── AND A FINGER GETS A WAY BACK (§280, reversing §265's forward-only for
     TOUCH and not for a mouse) ──────────────────────────────────────────
     Islam, presenting from a tablet: *"it doesn't go left or right."* §265
     kept the click forward-only for a stated reason — *a click that went back
     on one half needs a visible boundary, and the point of fullscreen is that
     nothing is drawn over the slide* — and that reason is about a ROOM
     watching a projector. A tablet in your hands has no arrows at all, so
     forward-only is not a conservative choice there, it is the only direction
     the device can go.

     THE BOUNDARY IS AT A THIRD, NOT THE MIDDLE (his, from three offered).
     Forward is the act of a talk and back is the exception, so forward keeps
     the big target and back is deliberate rather than a slip — and two thirds
     of the slide can still be pointed at without moving the deck.

     A MOUSE IS UNCHANGED AND THAT IS ALSO HIS CALL, with its cost stated: the
     product now answers one act two ways depending on the device (§53.5), in
     exchange for nothing a laptop presenter has already learned changing
     under them. The KIND is remembered from the pointerdown rather than read
     off the click, because `click` is not reliably a PointerEvent in every
     browser — read it off the event and Safari quietly takes the mouse
     branch on a tablet, which is the fault this section exists to fix. */
  root.addEventListener("click", function(ev){
    if (!root.classList.contains("fs")) return;
    /* A swipe ends in a click. Without this the gesture moves the deck and
       then the click moves it again — one press, two slides. */
    if (DECKSWIPED) { DECKSWIPED = false; return; }
    if (deckOwnControl(ev.target)) return;
    var back = DECKPOINTER !== "mouse" && ev.clientX < innerWidth / 3;
    deckShow(DECK.i + (back ? -1 : 1));
  });

  /* ── SWIPE: LEFT IS FORWARD, RIGHT IS BACK (§280, Islam's) ────────────
     The direction people already have from every photo album: the slide
     follows the finger, so pushing the current slide off to the left brings
     the next one on. It is the same two acts as the tap zones, offered the
     way a tablet offers them — nobody has to be told which third they are in.

     TOUCH AND PEN ONLY, for §280's own reason: a mouse keeps §265 exactly,
     and a drag with a mouse is how somebody selects text rather than how they
     turn a page.

     THE HORIZONTAL HAS TO WIN. A swipe that is mostly vertical is somebody
     scrolling or steadying the tablet, and reading it as a page turn is worse
     than reading it as nothing. */
  root.addEventListener("pointerdown", function(ev){
    DECKPOINTER = ev.pointerType || "mouse";
    DECKSWIPED = false;
    DECKFROM = (root.classList.contains("fs") && DECKPOINTER !== "mouse" &&
                !deckOwnControl(ev.target))
      ? { x: ev.clientX, y: ev.clientY } : null;
  });
  /* The browser took the gesture over (a system edge-swipe, a second finger).
     Whatever it became, it is not ours to read. */
  root.addEventListener("pointercancel", function(){ DECKFROM = null; });
  root.addEventListener("pointerup", function(ev){
    var from = DECKFROM;
    DECKFROM = null;
    if (!from) return;
    var dx = ev.clientX - from.x, dy = ev.clientY - from.y;
    if (Math.abs(dx) < DECKSWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;
    DECKSWIPED = true;
    deckShow(DECK.i + (dx < 0 ? 1 : -1));
  });
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
    deckScale();
  });
  addEventListener("keydown", function(ev){
    if (!root.classList.contains("on")) return;
    /* ── THIS KEY IS THE DECK'S, WHICHEVER LISTENER RUNS FIRST (§295) ──
       The editor stands its own keyboard down while a deck is up by asking
       whether `#deckroot` is `.on` — which is true right up until the line
       below closes it. So on Escape the answer depends on the order the two
       window listeners happened to be registered in: deck first, and the
       editor then sees a deck that is already shut, passes its own gate, and
       closes the MODE as well. Measured — the editor was gone and the page was
       underneath, which is the one thing this whole change exists to prevent.

       The mark travels on the EVENT, so neither listener has to run first: the
       editor is stopped by the class while the deck is still open, and by this
       once it is not. */
    ev.smpDeckKey = true;
    if (ev.target.isContentEditable) { if (ev.key === "Escape") ev.target.blur(); return; }
    /* ── FORWARD IS FOUR KEYS AND BACK IS THREE (§265) ────────────────
       Islam: "down and rigth for moving the slides forward left and up takes
       me back". Down and Up are what a trackpad-less laptop reaches for and
       what a projector remote's second pair sends; PageDown and PageUp are
       what most presentation clickers send, and a clicker that does nothing is
       indistinguishable from a flat battery.

       EVERY NAVIGATION KEY STOPS THE PAGE BEHIND (`preventDefault`), which
       only ArrowRight and Space used to do — Down and PageDown scroll the
       platform underneath the deck, so the slide changes and the page you
       return to has moved. */
    var fwd = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1 };
    var back = { ArrowLeft: 1, ArrowUp: 1, PageUp: 1 };
    if (fwd[ev.key]) { ev.preventDefault(); deckShow(DECK.i + 1); }
    if (back[ev.key]) { ev.preventDefault(); deckShow(DECK.i - 1); }
    if (ev.key === "Home") { ev.preventDefault(); deckShow(0); }
    if (ev.key === "End") { ev.preventDefault(); deckShow(DECK.slides.length - 1); }
    /* ── ESCAPE LEAVES FULLSCREEN, AND ONLY THEN THE DECK (§265) ──────
       It closed the deck outright, so the one key a presenter presses to get
       their laptop back also threw away the presentation and dropped them onto
       the page behind it, in front of the room. Two steps now: out of
       fullscreen (where the bar, the counter and Exit are all waiting), then
       out of the deck.

       Asked of `document.fullscreenElement`, not of the class, because the
       browser can leave fullscreen on its own and the class follows the event
       (§69.7) — and a browser that suppresses this keydown to exit fullscreen
       itself lands on exactly the same state. */
    if (ev.key === "Escape") {
      if (document.fullscreenElement === root) document.exitFullscreen();
      else closeDeck();
    }
    if (ev.key === "f" || ev.key === "F") root.querySelector("[data-dfs]").click();
    if (ev.key === "w" || ev.key === "W") root.querySelector("[data-dfit]").click();
  });
}
