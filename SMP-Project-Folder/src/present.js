/* ── Presentation mode ────────────────────────────────────────────────────
   A unit's review, built from whatever the platform holds at the moment it is
   opened. There is no exported copy and no version to go stale: a figure
   corrected an hour before the meeting is the figure on the slide.

   It is a mode rather than a page. It takes the whole window, the app chrome
   disappears, and Exit returns the presenter to exactly where they were.
   ──────────────────────────────────────────────────────────────────────── */

var DECK = { i:0, slides:[], root:null, flow:null, stops:null, title:"", from:"page",
             targets:null, clock:null };
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
                 sperf:"SCORE", scaps:"CAPS", sprojects:"PLAN" };
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
/* ── THE PLAN IS THIS DECK WITHOUT ITS FIGURES (§564) ───────────────────
   Islam agreed the plan download be the presentation's own slides with
   every reported figure taken out, one template rather than two builders
   (spec 066 §5). `buildPlanPptx` sets this while it asks `deckHtmlFor`; the
   few things only a plan carries are drawn here, and taking the figures
   out is the converter's (`planDeckBox` in pptx.js). It is never left on. */
var DECK_PLAN = false;
var DECK_EXAMPLE = false;   /* §574.2: drawing the guided tour's example */
/* What the plan still OWES is named, in the platform's red, as the plan
   download always did (§119): a tactic's owner or quarters, the aspiration,
   an empty SWOT box. The review shows none of it — it is about the figures. */
var PLAN_MISS = '<span class="missing">Missing</span>';
function deckHtmlFor(target){
  var t = String(target || ""), r = boxRef(t);
  /* §554.1: and a part of the FLOW that is not a box either — its cover,
     and a group's roll-call in front of the first of its members. Answered
     before `boxRef`, which would read an unknown prefix as a business unit. */
  if (t.indexOf("flow:") === 0) return flowPartHtml(t);
  /* §574: the guided tour's made-up direction, drawn fresh on every open. */
  if (t === EXAMPLE_T) return exampleDeckHtml();
  /* §481: a direction's own deck, presented by whoever owns it. */
  if (r.kind === "dir") return dirDeckHtml(t);
  /* §553: and a part of the order that is not a box at all. */
  if (r.kind === "sec") return secDeckHtml(t);
  /* §253.3: ONE ANSWER TO WHICH DECK A TARGET GETS, asked by the Present
     button, the slide editor and the anchors alike. §334: and the FORM
     decides, never the prefix — `plansInPillars` answers for a unit, a
     function and a capability, which is the fault §253.3 fixed on one surface
     of three arriving as a third kind of subject. */
  if (r.area === "fn")
    return plansInPillars(t) ? (unitLike(t) ? deckSlides(unitLike(t)) : "")
                             : deckSlidesFn(t);
  /* §405: a unit that plans in projects or in objectives and actions gets the
     function's deck, over its own holder — Islam's fourth answer, *"use the
     existing function versions"*. */
  var ou = subjKey(t) === "group" ? topAsUnit() : UNITS[subjKey(t)];
  if (ou && unitWayOf(ou)) return deckSlidesFn("u:" + subjKey(t));
  var u = unitLike(t);
  return u ? deckSlides(u) : "";
}

function deckAnchors(kind, key){
  var box = document.createElement("div");
  box.innerHTML = deckHtmlFor(kind === "fn" ? "fn:" + key
                            : kind === "cap" ? "cap:" + key : key);
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

/* §405: the aim slides, lifted out of deckSlides so a unit that plans in
   projects or objectives presents its aspiration too (§53.5: one builder). */
function unitAimSlides(u, bare){
  var S = [];
  var fnAim = !!u.fnKey;
  var aimNear = fnAim || SHOW_KO_THIS_YEAR;
  /* §254.9: THIS YEAR COMES FIRST. Islam: *"flip this year column with the 2027
     so the this year column to come after the obcejtives."* The eye meets the
     number being worked towards this cycle before the horizon it heads for —
     and THE HEADER AND THE ROW ARE SWAPPED TOGETHER, or every cell after them
     shifts and the slide still renders perfectly (§243's own note). */
  /* §404: the aspiration and the North Star are components; off draws nothing. */
  /* §428: the top layer's own deck carries no aim slide — its aspiration and
     objectives are the group's Foundation, shown on its own tab, and its
     unit-shaped view holds neither (topAsUnit). */
  var aimAsp = !fnAim && !u.topLayer && compOn(u.ukey, "aspiration"), aimKo = !u.topLayer && compOn(u.ukey, "keyobj");
  var aimRows = !aimKo ? "" : SMPRules.shown(u.keyObjectives).map(function(m, i){
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
  /* §557: `bare` leaves the divider to foundationPart(), which draws it
     once in front of the whole part, Who we are and Values included. */
  if (!bare && (aimRows || aimAsp))
    S.push(sectSlide("sfound", "After the Foundation divider", "Foundation",
      "What " + (u.fnKey ? u.name : "this unit") + " is aiming at, and the objectives it is judged on.",
      foundCells));

  if (aimRows || aimAsp) S.push('<section class="dslide"' + anch("aim", "After \u201cWhat we are aiming at\u201d") +
    '><h2>What we are aiming at</h2>' +
    (!aimAsp ? '' :
      '<div class="aimtop"><div><span class="dlab">' + L1("aspiration") + '</span>' +
      '<p class="asp2">' + (u.aspiration || !DECK_PLAN ? esc(u.aspiration) : PLAN_MISS) + '</p></div>' +
      (u.endInMind
        ? '<div><span class="dlab">' + L1("endinmind") + '</span><p class="asp3">' + esc(u.endInMind) + '</p></div>'
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

  return S;
}
/* §405: the SWOT section, lifted out of deckSlides for the same reason. */
function unitSwotSlides(u){
  var S = [];
  /* §557 reverses §243's "a unit with an empty SWOT still draws its
     section": Islam chose the deck model on a page that said, of every
     part, switched on but empty draws no slide yet — and the company's
     analysis has always worked that way. One rule for every box. */
  var swAny = u.swot && SMPRules.swotQuads(GROUP, u.ukey).some(function(q){
    return (u.swot[q] || []).some(function(t){ return String(t || "").trim(); }); });
  if (!u.fnKey && compOn(u.ukey, "swot") && (swAny || DECK_PLAN)) {
    /* §418: the boxes this layer carries, under the layer's own names. */
    var hues = { s:"good", w:"bad", o:"stone", t:"warn" };
    var sw = SMPRules.swotQuads(GROUP, u.ukey).map(function(q){
      return [q, LTraw(u.ukey, SMPRules.QUAD_KEYS[q]), hues[q]]; });
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
    S.push(sectSlide("swothead", "After the SWOT title page",
      SMPRules.swotTitle(GROUP, u.ukey) || LTraw(u.ukey, "swot"),
      "Where " + (u.topLayer ? deckBoxName(u) : "this unit") + " is strong, exposed, and what the market is offering it.",
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
        '><h2>' + esc(x[1]) + '</h2>' +
        (items || !DECK_PLAN ? '<ol class="dswot">' + items + '</ol>' : '<p>' + PLAN_MISS + '</p>') + '</section>');
    });
  }

  return S;
}
/* ── §557: THE DECK SHOWS WHAT THE BOX'S STRUCTURE HAS ──────────────────
   Islam, choosing the deck model: *"the presentation should show what the
   function or unit or company has in their structure"* — not a list kept per
   kind of box. Client set-up › Structure switches each Foundation part on or
   off per layer (`compOn`, §404); a part that is on AND filled in is a slide,
   on every kind of box, through these two builders and the aim slide beside
   them. Off, or on and empty, draws nothing (§253: a heading over nothing is
   not a slide).

   WHERE A BOX'S FOUNDATION IS KEPT: the group's on GROUP, a unit's on its
   UNITS entry, a function's on FUNCTIONS, a capability's on its own record.
   Read from the target, never from the kind of deck asking. */
function foundSrc(target){
  var t = String(target || ""), r = boxRef(t);
  if (t === "group") return GROUP;
  if (r.kind === "fn") return FUNCTIONS[r.key] || null;
  if (r.kind === "cap") return capById(r.key) || null;
  return UNITS[t] || null;
}
/* "Who we are": the brief's lines and the description, with the purpose
   under them — each only where it is switched on and written. */
function whoWeAreSlide(target){
  var o = foundSrc(target);
  if (!o) return "";
  var lines = !compOn(target, "brief") ? [] : (o.clauses || []).filter(function(c){
    return c && String(c[1] || "").trim(); });
  var desc = !compOn(target, "desc") ? "" : String(o.desc || o.def || "").trim();
  var mission = !compOn(target, "purpose") ? "" : String(o.mission || "").trim();
  if (!lines.length && !desc && !mission) return "";
  return '<section class="dslide d-who"' + anch("who", "After “Who we are”") + '>' +
    '<h2>Who we are</h2>' +
    (desc ? '<p class="whodesc">' + esc(desc) + '</p>' : '') +
    (lines.length ? '<dl class="wholines">' + lines.map(function(c){
      return '<dt>' + esc(c[0] || "") + '</dt><dd>' + esc(c[1]) + '</dd>'; }).join("") + '</dl>' : '') +
    (mission ? '<div class="whomission"><span class="dlab">' + L1("purpose") + '</span>' +
      '<p>' + esc(mission) + '</p></div>' : '') +
    '</section>';
}
/* The values, one card each, where Values is switched on and written. */
function valuesSlide(target){
  var o = foundSrc(target);
  if (!o || !compOn(target, "values")) return "";
  var vals = (o.values || []).filter(function(v){ return v && String(v.name || "").trim(); });
  if (!vals.length) return "";
  return '<section class="dslide d-values"' + anch("values", "After the values") + '>' +
    '<h2>' + esc(L("values", target === "group" ? "group" : "bu")) + '</h2>' +
    '<div class="dvals" style="--n:' + vals.length + '">' + vals.map(function(v){
      return '<div class="dval"><b>' + esc(v.name) + '</b>' +
        (String(v.def || "").trim() ? '<span>' + esc(v.def) + '</span>' : '') + '</div>'; }).join("") +
    '</div></section>';
}
/* THE FOUNDATION PART, IN ONE ORDER FOR EVERY BOX (§557): its divider, who
   we are, what we are aiming at, the values, and the key objectives read
   against their targets. The divider is drawn only when something follows
   it (§253), and it is the part's own: Islam chose *"before every part"*. */
function deckFoundationBody(target, aim, objectives){
  /* The whole section has a switch of its own (Client set-up › Structure,
     `foundOn`), and a name of its own on each layer — "Overview" on a
     function and a capability (`foundTitle`). Off, the part is not drawn. */
  if (!SMPRules.foundOn(GROUP, target)) return [];
  return [whoWeAreSlide(target)].concat(aim || [], [valuesSlide(target)], objectives || [])
    .filter(Boolean);
}
function foundationPart(target, name, cells, aim, objectives){
  var body = deckFoundationBody(target, aim, objectives);
  if (!body.length) return [];
  return [sectSlide("sfound", "After the Foundation divider", SMPRules.foundTitle(GROUP, target) || "Foundation",
    "What " + name + " is aiming at, and the objectives it is judged on.", cells)].concat(body);
}
/* A SWOT divider in front of a SWOT drawn as one slide (a function's
   strengths and weaknesses, the company's analysis), so every part opens
   the same way (§557). */
function swotPart(target, name, slides){
  slides = (slides || []).filter(Boolean);
  if (!slides.length) return [];
  return [sectSlide("swothead", "After the SWOT title page",
    SMPRules.swotTitle(GROUP, target) || LTraw(target, "swot"),
    "Where " + name + " is strong, exposed, and what the market is offering it.", null)].concat(slides);
}
/* §492: HOW WE COMPETE (spec 064 §3.1), one slide after the SWOT, drawn
   only when the layer carries the section AND it holds something (§253: a
   table with no rows is not a slide). The same table as the page. */
function competeSlides(u){
  if (!u || u.fnKey || !compOn(u.ukey, SMPRules.COMPETE)) return [];
  var c = competeOf(u.ukey), vals = (c.values || []).filter(function(v){
    return String(v.title || "").trim() || (v.how || []).length || (v.measure || []).length; });
  if (!c.discipline && !vals.length) return [];
  var ul = function(a){ var l = (a || []).filter(function(x){ return String(x || "").trim(); });
    return l.length ? '<ul class="cmpul">' + l.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join("") + '</ul>' : '&mdash;'; };
  var cells = function(f){ return vals.length ? vals.map(f).join("") : '<td>&mdash;</td>'; };
  return ['<section class="dslide d-compete"' + anch("compete", "After Competitive Discipline") + '>' +
    '<h2>Competitive Discipline</h2><table class="cmptab"><thead><tr><th class="cmprow">Discipline</th>' +
    '<th class="cmpd" colspan="' + Math.max(1, vals.length) + '">' +
    (c.discipline ? esc(SMPRules.disciplineName(c.discipline)) : "&mdash;") + '</th></tr></thead><tbody>' +
    '<tr><th class="cmprow">Value</th>' + cells(function(v){ return '<td class="cmpval">' + esc(v.title || "") + '</td>'; }) + '</tr>' +
    '<tr><th class="cmprow">How</th>' + cells(function(v){ return '<td>' + ul(v.how) + '</td>'; }) + '</tr>' +
    '<tr><th class="cmprow">Measure</th>' + cells(function(v){ return '<td>' + ul(v.measure) + '</td>'; }) + '</tr>' +
    '</tbody></table></section>'];
}
/* ── §553.2 — "WHERE IT STANDS", BUILT ONCE FOR EVERY KIND OF BOX ───────
   Stage 5 (b). A box that plans in PILLARS ends its deck on three readings —
   its objectives, its pillars and its execution — and a box that plans in
   PROJECTS ended on nothing at all: no Overall performance divider and no
   standing, so a function presenting its projects never said how it did.

   WHY IT IS NOT A COPY OF THE PILLARS SLIDE. A projects box has no pillars
   score — `unitPillars` answers null for it — so pasting that slide would
   print an empty cell where the middle reading goes. What it HAS is its
   objectives (`capKOScore`) and its execution (`capExec`), measured. So the
   slide is the same slide and the CELLS are whatever the box has, which is
   what one template means: the shape is shared, the content is the box's.

   ONE DESCRIPTION, NOT TWO (§53.5). Writing a second copy of this markup
   beside `deckSlidesFn` is exactly the drift stage 5 exists to remove, so
   both callers build cells and hand them here. A change to the wording, the
   bands or the footer reaches both by construction. */
function standCell(label, val, sub){
  return '<div class="headcell"><span class="dlab">' + label + '</span>' +
    '<b class="' + dBand(val) + '">' + dPct(val) + '</b>' +
    '<span class="headsub">' + sub + '</span></div>';
}
function standSlideOf(name, cells, foot){
  cells = cells.filter(Boolean);
  return '<section class="dslide d-head"' + anch("stand", "After \u201cWhere the unit stands\u201d") +
    '><h2>Where ' + name + ' stands</h2>' +
    '<div class="headgrid' + (cells.length > 2 ? ' three' : '') + '">' +
    cells.join("") + '</div><p class="headfoot">' + foot + '</p></section>';
}

/* ── A BOX IS PRESENTED UNDER ITS OWN NAME (§553.8) ──────────────────────
   Islam, of the review built for El Abd: *"there is nothing called elabd
   review as a group or as a company"*.

   The deck was headed "Group", and ended on "Where Group stands". "Group"
   is the tenant's WORD for the top layer — what you call it in a navigation
   row, beside "Business unit" and "Function" — and `topAsUnit()` hands it
   over as the box's `name` because that is the right word on every page
   that is about the SHAPE of the company.

   A ROOM IS NOT A NAVIGATION ROW. On a projector the cover says who is
   presenting, and that is the company: El Abd. So the deck asks for the
   name and the pages go on asking for the word. The fallback is the word
   again, so a client who has not named their company reads exactly as it
   does today (§50.6). */
function deckBoxName(u){
  return (u && u.topLayer && String(GROUP.org || "").trim()) || (u && u.name) || "";
}

function pillarCard(u, p, i){
  /* §542: on a box SHOWN APART, an internal pillar says what it is where
     it has nothing else to say — exactly as a capability's own card does
     below, so a client whose capabilities have become pillars reads the
     roll-call it read when they were records. Its own sub-line still wins.

     THE SETTING DECIDES, NEVER THE MARK ALONE, and that is not a detail:
     six of the worked example's ten units carry a pillar marked Capability
     in one joined list, and the first draft of this line put the word
     "Capability" under every one of them on their decks. checks/
     deck-figures.py caught it on the heading below; the same mistake was
     here, one line up, and the same guard closes both. */
  var sub = p.sub || (boxSplit(u) && SMPRules.pillarIsCap(p) ? L1("capability") : "");
  return '<div class="pcard"><span class="pcard-c">' + pillarCode(u, i) + '</span>' +
    '<span class="pcard-n">' + esc(p.name) + '</span>' +
    (sub ? '<span class="pcard-s">' + esc(sub) + '</span>' : '') +
    /* §416: the years each direction runs in, and a later one says when. */
    (yearsOn(p) ? '<span class="pcard-y">' + esc(runsNow(p) ? yearsTag(p) : yearsLater(p)) + '</span>' : '') +
    '</div>';
}

/* ── THE ROLL-CALL, FOR WHOEVER IS DRAWING IT (§554.1) ──────────────────
   It was written inside `deckSlides`, which is the only place that needed
   it until Islam asked for the same page in the MASTER flow: *"before the
   directions I find the grouped directions and same for the capabilities"*.
   Lifted out unchanged so the flow shows the same slide the company's own
   review shows, and a change to one is a change to both (§53.5). */
function groupSize(g){
  return g.ix.length + (g.cards ? boardCapTargets().length : 0);
}
function rollCallSlide(u, g){
  var n = groupSize(g);
  if (!n) return "";
  return '<section class="dslide"' +
    anch(g.names, "After the " + g.plain + " names") +
    '><h2>' + g.many + '</h2>' +
    '<div class="pcards" style="--n:' + n +
      ';--c:' + pillarCols(n) +
      ';--r:' + Math.ceil(n / pillarCols(n)) + '">' +
    g.ix.map(function(x){ return pillarCard(u, x.p, x.i); }).join("") +
    g.cards + '</div></section>';
}

/* ── THE GROUPS A BOX IS PRESENTED IN, FOR WHOEVER ASKS (§554.1) ───────
   Lifted out of `deckSlides` whole, so the master flow can draw the same
   roll-calls the company's own review draws rather than a second pair
   that looks like them (§53.5). `short` is the caller's: the company's
   review splits its two kinds, a unit's deck does not. */
function pillarGroups(u, short){
var capCards = !short ? "" : boardCapTargets().map(function(t){
  var c = capById(t.slice(4)), nm = placeLabel(t);
  return '<div class="pcard"><span class="pcard-c">' + esc(deckCode(t, nm)) + '</span>' +
    '<span class="pcard-n">' + esc(nm) + '</span>' +
    '<span class="pcard-s">' + esc(L1("capability")) + '</span></div>';
}).join("");
/* ── THE GROUPS THIS BOX IS PRESENTED IN (§553.6) ───────────────────
   One group, as every deck has had, EXCEPT on the company's own review of
   a plan that is shown apart: there the directions and the capabilities
   are two things, and reading all ten under one heading called Directions
   was not a wording slip — the standing slide below counted ten of them
   and said "10 Directions, by their measures", five of which were
   capabilities.

   THE FIRST GROUP KEEPS THE ANCHORS. A picture slide placed after the
   roll-call or the score table stays where its owner put it; the second
   group's two slides are new ground and carry new anchors (§96.2).

   A GROUP WITH NOTHING IN IT IS NOT DRAWN (§45.2), so a company with
   directions and no capabilities reads exactly as it does today. */
var groups;
if (short && boxSplit(u)) {
  var dirs = [], caps = [];
  u.items.forEach(function(p, i){
    (SMPRules.pillarIsCap(p) ? caps : dirs).push({ p: p, i: i });
  });
  /* ── THE RUNNING ORDER IS THE ORDER (§553.10) ──────────────────────
     Islam: *"the company picker should pick the foundation of the company
     then I pick the directions arrangement and then the capabilities
     arranged. and the grouped directions comes before the directions
     automatically and the capability grouped comes before the
     capabilities automatically"*.

     THE PICKER ALREADY HOLDS THEM. The Master presentation's running
     order lists every direction and every capability by name, draggable,
     stored per client as an absence (§50.6) — `dir:<id>` for each. So the
     company's own review reads THAT, and there is no second control to
     keep in step (§53.5). The alternative was the plan's own Arrange,
     which works today and renumbers as it goes: drag Egypt Expansion to
     the top and it becomes D001 on every surface in the platform. An
     order for a room must not rewrite the codes the year is filed under.

     THE ORDER ONLY, NEVER THE MEMBERSHIP. A tick in that picker says
     who presents in the MASTER FLOW; it cannot mean "and is therefore in
     the company's own deck", or unticking a direction would silently
     drop it from the company's review of its own plan (§96.2). Anything
     the order does not name keeps its place in the plan, after those it
     does.

     AND THE ROLL-CALLS ARE NOT IN THE PICKER. "Directions" and
     "Capabilities" are drawn in front of their own group, automatically,
     because they are the group — not a subject somebody places. */
  var flow = masterOrder();
  var at = function(x){
    var k = flow.indexOf("dir:" + x.p.id);
    return k < 0 ? flow.length + x.i : k;
  };
  var byFlow = function(a, b){ return at(a) - at(b); };
  dirs.sort(byFlow); caps.sort(byFlow);
  groups = [
    { ix: dirs, many: L("pillar","bu"),     plain: L("pillar","bu"),
      one: L1("pillar"), head: L("pillar","bu"),
      names: "pillarnames", score: "pillars", cards: "" },
    { ix: caps, many: L("capability","bu"), plain: L("capability","bu"),
      one: L1("capability"), head: L("capability","bu"),
      names: "capnames",    score: "caps",    cards: capCards }
  ].filter(function(g){ return g.ix.length || g.cards; });
  /* AND THE GROUPS LEAD IN THE ORDER THEIR FIRST MEMBER DOES, so dragging
     a capability above every direction makes Capabilities the first
     group — one list, one answer, no second setting for "which kind
     comes first" (§53.5). */
  groups.sort(function(a, b){
    return (a.ix.length ? at(a.ix[0]) : flow.length + 99) -
           (b.ix.length ? at(b.ix[0]) : flow.length + 99);
  });
} else {
  var bothKinds = !!capCards ||
    (boxSplit(u) && u.items.some(function(p){ return SMPRules.pillarIsCap(p); }));
  groups = [{
    ix: u.items.map(function(p, i){ return { p: p, i: i }; }),
    /* §542: the one heading names both kinds whether the capabilities are
       records beside the list or pillars inside a list SHOWN APART —
       never because a joined list happens to hold a marked row (see the
       sub-line above, and checks/deck-figures.py, which went red on
       exactly that). */
    many: L("pillar","bu") + (bothKinds ? ' &amp; ' + L("capability","bu") : ''),
    /* The anchor's label is PLAIN TEXT, not the heading: the heading
       carries `&amp;`, and a label is escaped on its way into the
       attribute, so the rail would have read "Directions &amp;amp;
       Capabilities". */
    plain: L("pillar","bu") + (bothKinds ? ' & ' + L("capability","bu") : ''),
    one: L1("pillar"),
    /* THE SCORE TABLE KEEPS THE HEADING IT HAD. Only the roll-call ever
       named both kinds (§542); the table below has always been headed
       with the pillar word alone, and widening it here would have moved
       a live client's slide for nothing. */
    head: L("pillar","bu"),
    names: "pillarnames", score: "pillars", cards: capCards
  }];
}

  return groups;
}

function deckSlides(u){
  var S = [];
  var ko = unitObjectives(u), ex = unitRatio(u);
  /* §422: a plan switched off draws no plan slides (Islam's *"yes"*). */
  var pOn = planOn(u);
  /* §481: the company's own review is SHORT when its plan is the whole plan
     (units off): foundation, analysis, the directions and capabilities, then
     their performance. Each direction's detail is its owner's own deck. */
  var short = !!u.topLayer && companyReviewOn();
  var dl = deltaFor(u.ukey);
  var dtag = (!dl || !dl.d) ? "" :
    '<span class="ddelta ' + (dl.d > 0 ? "up" : "down") + '">' +
    (dl.d > 0 ? "\u25b2" : "\u25bc") + " " + Math.abs(dl.d) + '</span>';

  /* 1 — the cover carries the unit and the cycle, and nothing else. */
  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") +
    sec("COVER", deckBoxName(u), true) + '>' +
    (deckMark(u)
        ? '<img class="dcovermark" src="' + esc(deckMark(u)) + '" alt="' + esc(u.name) + '">'
        : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
    '<h1 class="cover">' + esc(deckBoxName(u)) + '</h1><div class="coverrule"></div>' +
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
  /* §557: built here, pushed as one Foundation part with the objectives
     slide below — so Who we are, the aim, the values and the objectives
     read in one order under one divider on every box. The company's own
     aim is its Foundation's (`companyFoundationSlides`) whether or not its
     units present too: the structure decides what shows, not the shape. */
  var aimS = u.topLayer ? companyFoundationSlides() : unitAimSlides(u, true);

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
  /* §515.2 P5: a function whose objectives are switched off (§437) has no
     objectives reading on its page — the pillars card leads there — so the
     projector does not draw one either. fnKoCounted() answers true for
     everything that is not a function, so a unit's slide is unchanged. */
  var pl = unitPillars(u), koShown = fnKoCounted(u.ukey) ? SMPRules.shown(u.keyObjectives).length : 0;
  /* §553.6: the company's own review shows its directions and its
     capabilities apart, so the wording below has two groups to name. */
  var capsApart = short && boxSplit(u) &&
    u.items.some(function(p){ return SMPRules.pillarIsCap(p); }) &&
    u.items.some(function(p){ return !SMPRules.pillarIsCap(p); });
  /* §553.2: the cells are this box's; the slide is everyone's. */
  var standSlide = standSlideOf(
    (u.fnKey || u.topLayer ? esc(deckBoxName(u)) : "the unit"),
    [ koShown && standCell(L("keyobj","bu") + ' performance', ko,
        (dtag ? dtag + " against the last cycle" : "no earlier cycle to compare")),
      /* ── IT COUNTS WHAT IT NAMES (§553.6) ───────────────────────────
         On El Abd this cell read "Directions performance · 10 Directions,
         by their measures" — and five of the ten are capabilities. The
         figure was right (it is the average over every pillar the box
         plans) and the words were wrong, which is the worse of the two:
         a room can check a name and cannot check an average.

         ONE CELL STILL, not two. The two groups now have a score table
         each (above), which is where a per-group reading belongs; this
         slide is the box's overall and stays the box's overall. A fourth
         cell would also break a grid that goes to three. */
      standCell(capsApart
          ? L("pillar","bu") + ' &amp; ' + L("capability","bu") + ' performance'
          : L("pillar","bu") + ' performance', pl,
        capsApart
          ? itemsNow(u).filter(function(p){ return !SMPRules.pillarIsCap(p); }).length +
            ' ' + esc(L("pillar","bu")) + ' and ' +
            itemsNow(u).filter(function(p){ return SMPRules.pillarIsCap(p); }).length +
            ' ' + esc(L("capability","bu")) + ', by their measures'
          : itemsNow(u).length + ' ' + esc(L("pillar","bu")) + ', by their measures'),
      standCell('Execution performance', ex,
        dPct(unitExec(u)) + ' delivered against ' + dPct(unitPlan(u)) + ' planned') ],
    (koShown ? 'Objectives measure what was committed to. ' : '') +
    esc(L("pillar","bu")) + (capsApart ? ' and ' + esc(L("capability","bu")) : '') +
    ' measure how the work set against them is going. ' +
    'Execution measures whether that work is landing on time.');

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
  /* §404: a switched-off North Star draws no slide. */
  var objS = !(oRows && compOn(u.ukey, "keyobj")) ? [] : ['<section class="dslide"' + anch("objectives", L("keyobj","bu") + " \u2014 after the table") +
    '><h2>' + L("keyobj","bu") + ' &mdash; where we stand</h2>' +
    '<table class="zebra dbig"><thead><tr><th class="idx">#</th><th>Objective</th>' +
    '<th class="num">Annual target</th><th class="num">Actual</th>' +
    '<th class="num">Progress</th></tr></thead><tbody>' + oRows + '</tbody></table></section>'];
  var foundKOs = u.topLayer ? SMPRules.shown(Array.isArray(GROUP.keyObjectives) ? GROUP.keyObjectives : [])
                            : SMPRules.shown(u.keyObjectives);
  var foundCells = foundKOs.length ? [[foundKOs.length, L("keyobj","bu")]] : [];
  if (!u.fnKey && GROUP.horizon && foundKOs.length) foundCells.push([GROUP.horizon, "Horizon"]);
  S = S.concat(foundationPart(u.ukey,
    u.fnKey ? u.name : u.topLayer ? deckBoxName(u) : "this unit", foundCells, aimS, objS));

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
  /* §399: A FUNCTION HAS ITS OWN S&W NOW — strengths and weaknesses, never
     the market's two, which stay the business's. One slide, and only when it
     has something on it (§253: a table with no rows is not a slide).
     §404: AND A CLIENT THAT SWITCHED THE SWOT OFF IS NOT SHOWN ONE, on either
     side of the switch. */
  if (u.fnKey && compOn(u.ukey, "swot")) S = S.concat(swotPart(u.ukey, u.name, [fnSWSlide(FUNCTIONS[u.fnKey])]));
  S = S.concat(u.topLayer ? swotPart("group", deckBoxName(u), companyAnalysisSlides(u)) : unitSwotSlides(u));
  S = S.concat(competeSlides(u));

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
  /* ── §553.6: A CARD, A ROW, AND THE GROUP THEY BELONG TO ────────────
     Islam, on the company's own review, a week before El Abd present it:
     *"when we are presenting on a company level it acts like a business unit
     approach, foundation, aims, key objectives and maybe directions and
     capabilities showing the directions as one slide and then showing
     progress then the capabilities as a group"*.

     The card and the row are lifted out of the two `.map`s they were written
     inside, unchanged, so one group or two is a question of WHICH PILLARS
     are handed to them — never of a second copy of the markup (§53.5). Each
     takes the pillar's REAL index in `u.items`, because `pillarCode` numbers
     from the whole list and must keep doing so when the list is shown in two
     halves; the row's own counter is separate and restarts per table. */
  /* THE ROLL-CALL STAYS WHITE AND TAKES A DIVIDER IN FRONT OF IT — Islam's
     B, chosen from two drawn in the real deck: *"the pillars page stay the
     same white background as is just the divider with the strategic pillars
     title."* The cost he took with it is one slide per deck; what it buys is
     that all four sections are announced the same way, and that the roll-call
     goes on reading as the content slide it is. */
  /* The divider belongs to the deck, not to the group reader: the master
     flow draws the roll-calls without it (§554.1). */
  if (pOn && u.items.length && !short)
    S.push(sectSlide("spillars", "After the Strategic " + labelWord("pillar","bu") + " divider",
      "Strategic " + L("pillar","bu"),
      "The " + u.items.length + " " + L("pillar","bu") +
        " " + (u.fnKey || u.topLayer ? deckBoxName(u) : "this unit") + " committed to, and how each is going.", null));

  var groups = pillarGroups(u, short);

  if (pOn) groups.forEach(function(g){
    if (!groupSize(g)) return;
    /* §557: Islam's *"before every part"* — the company's review shows its
       directions and its capabilities as two parts, so each opens with its
       own divider, as the one group of a unit's deck does above. */
    if (short) S.push(sectSlide(g.names === "capnames" ? "scaps" : "spillars",
      "After the " + g.plain + " divider", (g.names === "capnames" ? "" : "Strategic ") + g.plain,
      "The " + groupSize(g) + " " + g.plain + " " + deckBoxName(u) + " committed to, and how each is going.", null));
    S.push(rollCallSlide(u, g));
    /* ── AND THEN EACH ONE, IN TURN (§553.9) ──────────────────────────
       Islam, having been shown Raya's Mobile beside El Abd's review:
       *"yes I want elabd as a unit"*.

       THIS IS THE WHOLE DIFFERENCE, and it took three readings to see it.
       A unit's deck draws every pillar's own slides — twelve of Mobile's
       twenty-eight ARE its four pillars, three slides each. El Abd's
       review drew none of them: its directions and capabilities were
       named in a roll-call, scored in a table, and never shown. "Each
       direction performance" was never the score table; it is the
       direction's own measures and tactics, exactly as a pillar's are.

       THE SLIDES ARE NOT NEW. `pillarSlidesOf` is the same builder each
       owner's own deck already calls (§53.5) — the company's review had
       simply never called it. It is called INSIDE the group, so a group's
       pillars follow their own roll-call: the directions after Directions,
       the capabilities after Capabilities. */
    g.ix.forEach(function(x){ S = S.concat(pillarSlidesOf(u, x.p, x.i)); });
  });

  /* The score table's rows, built here and pushed at the END (§254.4).
     `i` is the pillar's place in `u.items` (its code); `n` is its place in
     the table it is being printed in (§553.6). */
  function pillarRow(p, i, n){
    /* §416: a direction that does not run this year is listed, not scored. */
    if (!runsNow(p)) return '<tr class="later"><td class="idx">' + n + '</td><td class="dirname">' +
      '<b><span class="dcode">' + pillarCode(u, i) + '</span> ' + esc(p.name) + '</b>' +
      '<span class="dsub">' + esc(yearsLater(p)) + '</span></td>' +
      '<td class="num">&mdash;</td><td class="num">&mdash;</td></tr>';
    var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
    return '<tr><td class="idx">' + n + '</td><td class="dirname">' +
      '<b><span class="dcode">' + pillarCode(u, i) + '</span> ' + esc(p.name) + '</b>' +
      '<span class="dsub">' + esc(p.kind) + ' &middot; ' + esc(p.theme) + ' &middot; ' + esc(p.owner) + '</span></td>' +
      '<td class="num final ' + dBand(pillarPerf(p)) + '">' + dPct(pillarPerf(p)) + '</td>' +
      '<td class="num final ' + dBand(r) + '">' + dPct(r) + '</td></tr>';
  }
  /* NAMED APART FROM THE ROLL-CALL (§254.5). With both slides headed by the
     tenant's word for a pillar, the deck said "Pillars" twice — §87's twins on
     a projector, and two rows in Manage slides' rail that read the same. The
     scoring table takes the deck's OWN existing phrasing, the one the
     objectives table has always worn, rather than a new form of words. */
  function groupScoreSlide(g){
    if (!g.ix.length) return "";
    return '<section class="dslide"' +
      anch(g.score, "After the " + g.plain + " overview") +
      '><h2>' + g.head + ' &mdash; where we stand</h2>' +
      '<table class="zebra dirs"><thead><tr><th class="idx">#</th><th>' + g.one + '</th>' +
      '<th class="num">' + L("measure") + '</th><th class="num">Execution</th></tr></thead>' +
      '<tbody>' + g.ix.map(function(x, n){ return pillarRow(x.p, x.i, n + 1); }).join("") +
      '</tbody></table></section>';
  }
  /* SAID AT THE END, FOR EVERY DECK (§254.4). §553.8 moved the company's
     two tables up beside their roll-calls, for the one reason that the
     review had no detail slides between them — *"move the pillars
     performance till the end before the where we stand slide"* exists to
     keep the scoring beside the reading it serves, and with nothing in
     between there was nothing to keep it away from. §553.9 put the detail
     slides back, so that reason is gone and so is the exception. */
  var pillarScoreSlides = groups.map(groupScoreSlide).filter(Boolean);


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
  /* ── AND THE COMPANY'S REVIEW GETS IT TOO (§553.6) ──────────────────
     Islam, of the company's own review: *"and then performance and the
     overall performance etc."* It was the one deck with no divider in front
     of its closing block — §481 made the review short by leaving things
     out, and this went with them. What it announces was always there: the
     score tables and the slide the whole deck ends on.

     §253 IS SATISFIED BY CONSTRUCTION, as it is for every other deck: the
     stand slide always draws, so this is never a divider over nothing. */
  S.push(sectSlide("sperf", "After the Overall performance divider",
    "Overall performance",
    /* It announces what is BEHIND it, and §553.8 moved the two score
       tables in front of it — so where they have already been read, this
       says the one thing left (§253, §61). */
    "Where the " + L("pillar","bu") +
      (capsApart ? " and the " + L("capability","bu") : "") + " stand, where " +
      (u.fnKey || u.topLayer ? deckBoxName(u) : "the unit") +
      " stands, and what the cycle is remembered for.",
    null));
  if (pOn && u.items.length) pillarScoreSlides.forEach(function(x){ S.push(x); });
  S.push(standSlide);
  if (noteSlide) S.push(noteSlide);

  S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last \u2014 before Thank you", "before") +
    sec("END", "Thank you") +
    '><h1 class="cover">Thank you</h1>' +
    '<div class="coverrule"></div><p class="coversub">' + esc(deckBoxName(u)) +
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

/* §481: ONE DIRECTION'S SLIDES, lifted out of deckSlides so a direction can
   be presented on its own by whoever owns it (Islam, round 2: *"when press
   present he will only see his slides"*). deckSlides calls this for every
   direction, so the whole-plan deck and a direction's own deck cannot
   disagree about what a direction's slides are (§53.5). */
/* ── `named`: THE DECK HAS ALREADY SAID WHOSE SLIDES THESE ARE (§553.4) ──
   Islam, of a direction owner's own deck: *"the cover page is enough let's
   remove the 2nd page as the performance appear at the last slide anyway"*.

   A direction's own deck opens on a cover carrying that direction's name,
   its code, the cycle and who presents it — and then said all of it again on
   a title page, whose other job, the two readings, §553.3 moved to the end.
   Two slides introducing one direction to a room that has just been told.

   NOT A SETTING, A FACT ABOUT THE DECK (§50.6). The full plan deck has no
   per-pillar cover: there the title page is the ONLY slide that names the
   pillar it is opening, so it stays, and `named` is false for it. The flag
   says what the caller has already drawn, which is why it is the caller's to
   pass and not the client's to choose.

   A PICTURE SLIDE PLACED ON THE TITLE PAGE IS NOT LOST: an anchor that is no
   longer there sends its slide to the end of the deck rather than dropping
   it (§96.2, and `insertPictureSlides`'s own note). */
function pillarSlidesOf(u, p, pi, named){
  var S = [];
  /* §416: and it gets no slides of its own until its year comes — except in
     the plan (§564), which carries every direction with its years, as the
     plan download always has. */
  if (!runsNow(p) && !DECK_PLAN) return S;
  var r = pillarExec(p) && pillarPlan(p) ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
  if (!named) S.push('<section class="dslide d-cover"' +
    anch("p" + pillarCode(u, pi) + "d", "After the " + pillarCode(u, pi) + " title page") +
    sec(pillarCode(u, pi), p.name) +
    '><span class="seclab">' + esc(p.kind) +
    ' &middot; ' + L1("theme") + ' ' + esc(p.theme) + ' &middot; ' + esc(p.owner) +
    (DECK_PLAN && yearsOn(p) ? ' &middot; ' + esc(yearsTag(p)) : '') + '</span>' +
    '<h1 class="pillarname"><span class="dcode huge">' + pillarCode(u, pi) + '</span> ' +
      esc(p.name) + '</h1>' +
    (p.sub ? '<p class="coversub">' + esc(p.sub) + '</p>' : '') +
    '<div class="coverrule"></div><div class="leadstats">' +
      '<div><span class="dlab">' + L("measure") + '</span><b class="' + dBand(pillarPerf(p)) + '">' +
        dPct(pillarPerf(p)) + '</b></div>' +
      '<div><span class="dlab">Execution</span><b class="' + dBand(r) + '">' + dPct(r) + '</b></div>' +
    '</div></section>');

  /* ── THE DIRECTION'S OVERVIEW, ONE SLIDE AFTER ITS TITLE (§413) ────
     Islam, of the mockup: "approved, keep the objective preview, build it".
     Drawn only while the client's Structure carries the Direction overview
     AND this direction has something in it: an empty slide on a projector
     says the plan owes an answer nobody asked it for (§253, §45.2). The
     right-hand panel is READ from the direction's own tables, never typed a
     second time (§53.5). */
  if (planDetailOn("overview", p) && ["ovObj","ovWhy","ovRisk"].some(function(k){ return String(p[k] || "").trim(); })) {
    var ovMs = SMPRules.shown(p.measures || []).slice(0, 5).map(function(m){
      return '<div class="row"><span>' + esc(m.name) + '</span><b>' + (m.target ? tgtShown(m.target) : '&mdash;') + '</b></div>';
    }).join("");
    var ovTs = SMPRules.shown(p.tactics || []).slice(0, 5).map(function(t){
      return '<div class="row"><span>' + esc(t.name) + '</span><i>' + esc(t.owner || "") + '</i></div>';
    }).join("");
    var ovRisks = String(p.ovRisk || "").split(/\n+/).map(function(x){ return x.trim(); }).filter(Boolean);
    S.push('<section class="dslide dovs"' +
      anch("p" + pillarCode(u, pi) + "o", "After " + pillarCode(u, pi) + " — " + detailWord("overview", "one", p)) + '>' +
      deckPillarHead(u, p, pi, DW("overview", "one", p)) +
      '<div class="obody"><div>' +
        (String(p.ovObj || "").trim() ? '<div class="ok">' + ovArea("ovobj", p) + '</div><p class="objq">' + esc(p.ovObj) + '</p>' : '') +
        '<div class="two">' +
          (String(p.ovWhy || "").trim() ? '<div><div class="ok">' + ovArea("ovwhy", p) + '</div><p>' + esc(p.ovWhy) + '</p></div>' : '<div></div>') +
          (ovRisks.length ? '<div><div class="ok">' + ovArea("ovrisk", p) + '</div><ul>' +
            ovRisks.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join("") + '</ul></div>' : '<div></div>') +
        '</div></div>' +
        ((ovMs || ovTs) ? '<div class="side">' +
          (ovMs ? '<div><div class="ok">' + L("measure") + '</div>' + ovMs + '</div>' : '') +
          (ovTs ? '<div><div class="ok">' + L("tactic") + '</div>' + ovTs + '</div>' : '') +
        '</div>' : '') +
      '</div></section>');
  }

  var mRows = SMPRules.shown(p.measures).map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      /* §572: the name bold and the Progress larger (Islam, on Option B). */
      '<td class="lead strong">' + esc(m.name) + fmark(m.id) + '</td>' +
      '<td class="num">' + (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>' +
      '<td class="num">' + figVsDue(m) + '</td>' +
      '<td class="num final dprog ' + dBand(measureScore(m)) + '">' + dPct(measureScore(m)) + '</td>' +
      (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') +
      '</tr>';
  }).join("");
  /* §236.2: Islam — "the slide can be set between the measures and tactics
     because that's a valid place to be." The lowercase suffix keeps the key
     clear of the tactics anchor below ("p" + code), which stored slides
     already name. */
  if (mRows) S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'M"' +
    anch("p" + pillarCode(u, pi) + "m", "After " + pillarCode(u, pi) + " — " + labelWord("measure","bu")) + '>' +
    deckPillarHead(u, p, pi, L("measure")) +
    '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>' + L1("measure") + '</th>' +
    '<th class="num">Annual target</th><th class="num fig">Actual</th>' +
    '<th class="num fig">Progress</th><th class="fig">Note</th></tr></thead><tbody>' + mRows + '</tbody></table></section>');

  /* ── §343: AND THE BREAKDOWN GETS A SLIDE OF ITS OWN ────────────────
     After that pillar's targets, because the columns ARE two of the numbers
     the heading above already averages — a room reading "Key measures 95%"
     needs the five rows that make it, not three of them.

     DRAWN ONLY WHERE THERE IS ONE, exactly as it is on the three screens: a
     pillar with no breakdown mints no slide and no anchor (§253 — a table
     with no rows is not a slide).

     A COLUMN'S HEAD CARRIES ITS DIRECTION and a scored figure wears its
     band, which is what says which columns count with no total row under
     the table. The INDICATOR is drawn plain — deliberately the same rule as
     the page, or the projector says something the screen does not (§53.5).

     ITS ANCHOR IS THE PILLAR'S CODE PLUS `b`, clear of the measures slide's
     `m` and the tactics slide's bare code, both of which stored picture
     slides already name (§236.2, §50.3).

     §568: EACH COLUMN IS TWO, Target and Actual. Islam: *"remove the
     progress just keep the target and actual and color code the actual as
     you did earlier but after splitting to 2 columns"* — §557's split on
     Reporting, carried here and to Performance. The target heads with the
     column's own name and direction, as there; the actual wears the band it
     wore as one cell, and an indicator's stays plain. The plan download
     (§564) keeps its one target column. */
  var bdCols = SMPRules.bdCols(p), bdShow = SMPRules.bdHas(p);
  var bdRows = !bdShow ? "" :
    SMPRules.shown(SMPRules.bdRows(p)).map(function(r, ri){
      return '<tr><td class="idx">' + (ri + 1) + '</td><td>' + esc(r.name) + '</td>' +
        bdCols.map(function(c){
          var t = SMPRules.bdTarget(r, c), a = SMPRules.bdActual(r, c);
          /* §564: the plan carries the target alone. */
          if (DECK_PLAN)
            return '<td class="num">' + (String(t).trim() ? esc(t) : '&mdash;') + '</td>';
          var dash = '<td class="num"><span class="dmuted">&mdash;</span></td>';
          var sc = String(a).trim() ? bdCellScore(r, c) : null;
          return (String(t).trim() ? '<td class="num">' + esc(t) + '</td>' : dash) +
            (!String(a).trim() ? dash
              : '<td class="num' + (sc == null ? '' : ' final ' + dBand(sc)) + '">' + esc(a) + '</td>');
        }).join("") +
        (r.note ? '<td class="dnote">' + esc(r.note) + '</td>'
                : '<td class="dnote empty">&mdash;</td>') + '</tr>';
    }).join("");
  if (bdRows) S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'B"' +
    anch("p" + pillarCode(u, pi) + "b",
         "After " + pillarCode(u, pi) + " — " + SMPRules.bdName(p)) + '>' +
    deckPillarHead(u, p, pi, SMPRules.bdName(p)) +
    '<table class="zebra withnote"><thead><tr><th class="idx">#</th>' +
    '<th>' + esc(SMPRules.bdName(p)) + '</th>' +
    bdCols.map(function(c){
      var h = '<th class="num">' + esc(bdColWord(p, c)) +
        (SMPRules.bdScored(c) ? ' ' + esc(c.dir) : '') + '</th>';
      if (DECK_PLAN) return h;
      return h + '<th class="num fig">Actual</th>';
    }).join("") +
    '<th class="fig">Note</th></tr></thead><tbody>' + bdRows + '</tbody></table></section>');

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
    /* §414: SEVERAL OUTCOMES. The shared cells span the tactic's lines and
       each outcome takes a line of its own, as on the page behind it. */
    var xs = scoredExtras(t), rs = outRowspan(xs.length);
    var lead = '<td class="idx"' + rs + '>' + (i+1) + '</td>' +
      '<td class="lead strong"' + rs + '>' + esc(t.name) + planReqs(t) + '</td>' +
      '<td class="outc">' + (xs.length ? otag("O1") : '') + outcomeCell(t) + '</td>' +
      (deckColOn("owner") ? '<td' + rs + '>' + (t.owner || !DECK_PLAN ? esc(t.owner) : PLAN_MISS) + '</td>' : '') +
      (deckColOn("collabs") ? '<td class="collabs"' + rs + '>' + collabCell(t) + '</td>' : '') +
      '<td class="cc"' + rs + '>' + (DECK_PLAN && !["q1","q2","q3","q4"].some(function(q){ return t[q]; })
        ? PLAN_MISS : qs(t)) + '</td>' +
      /* §571: the Status, as Performance draws it — the word in its band and
         Delayed under it when late. On every row, the plan's too, so the cells
         line up with the head and `planStripFigs` takes it out as a `fig`. */
      /* §572.2: the pill and Delayed as one block, Delayed centred under the
         pill as Performance's centred cell draws it (Islam). */
      '<td class="dstat ' + tacticBand(t) + '"' + rs + '><span class="dstack">' +
        '<span class="dpill">' + esc(tacticStatusWord(t)) + '</span>' +
        (tacticDelayed(t) ? '<span class="dsub dlate">Delayed</span>' : '') + '</span></td>';
    var note = t.note ? '<td class="dnote"' + rs + '>' + esc(t.note) + '</td>'
                      : '<td class="dnote empty"' + rs + '>&mdash;</td>';
    if (xs.length) return deckOutRows(t, lead, note, xs, rs);
    /* §254.3: NOT DIMMED. Islam: *"for a non due tactic don't dim it show it
       normally it has the comment of not due this cycle anyway."* The cell
       already says it in words, and dimming says it a second time in a way
       that also costs the owner and the quarters their legibility on a
       projector. */
    if (!tacticDue(t))
      return '<tr>' + lead + '<td colspan="2" class="cc"></td>' + note + '</tr>';
    /* What this row is measured against RIGHT NOW: an outcome answers with
       its own target, prorated where it compiles by Sum or Count (§276); everything else
       with the share of its plan that is due (§239). One function, so the
       slide and the page cannot differ about it. */
    var bench = tacticBenchmark(t);
    if (!tacticAnswered(t))
      return '<tr>' + lead + '<td colspan="2" class="cc">Not reported' +
        (bench ? ' <i>&middot; due at ' + figHtml(bench) + '</i>' : '') + '</td>' +
        note + '</tr>';
    var r = tacticProgress(t);
    var shown = onOutcome(t) ? outcomeShown(t) : t.actual + "%";
    /* §571: the benchmark beside the figure is the page's (§300) — a yes/no
       row shows it only against a partial, so 0% and 100% stand alone. */
    var pair = onOutcome(t) && outcomeOf(t) ? benchBeside(outcomeOf(t), tacticShare(t)) : bench;
    return '<tr>' + lead +
      '<td class="num"><b>' + figHtml(shown) + '</b>' + dueLine(pair ? figHtml(pair) : "") + '</td>' +
      '<td class="num final dprog ' + dBand(r) + '">' + dPct(r) + '</td>' +
      note + '</tr>';
  }).join("");
  if (tRows) S.push('<section class="dslide" data-split="' + pillarCode(u, pi) + 'T"' +
    anch("p" + pillarCode(u, pi), "After " + pillarCode(u, pi) + " \u2014 " + p.name) + '>' +
    deckPillarHead(u, p, pi, L("tactic")) +
    '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>' + L1("tactic") + '</th>' +
    '<th>' + DW("outcomes", "one", p) + '</th>' +
    (deckColOn("owner") ? '<th>Owner</th>' : '') +
    (deckColOn("collabs") ? '<th>Collabs.</th>' : '') +
    '<th class="num">Quarters</th><th class="fig">Status</th>' +
    '<th class="num fig">YTD actual</th><th class="num fig">Progress</th>' +
    '<th class="fig">Note</th></tr></thead><tbody>' + tRows + '</tbody></table></section>');

  return S;

  /* §414: a tactic with several outcomes on the review deck — one line per
     outcome with its own figure against its own benchmark, and the tactic's
     Progress as their average, spanning the lines. `deckFitPass()` moves a
     tactic's lines as one group, so a continuation never splits them. */
  function deckOutFig(t, x){
    var o = outcomeOf(x);
    if (!o) return '<td class="cc"><span class="missing">Missing</span></td>';
    var bench = benchBeside(o, tacticShare(t)), shown = outcomeShown(x);
    if (shown == null)
      return '<td class="cc">Not reported' +
        (bench ? ' <i>&middot; due at ' + figHtml(bench) + '</i>' : '') + '</td>';
    return '<td class="num"><b>' + figHtml(shown) + '</b>' + dueLine(bench ? figHtml(bench) : "") + '</td>';
  }
  function deckOutRows(t, lead, note, xs, rs){
    var due = tacticDue(t), sub = outSubCls(t), out;
    if (!due) {
      out = '<tr>' + lead + '<td colspan="2" class="cc"' + rs + '></td>' + note + '</tr>';
      xs.forEach(function(x){
        out += '<tr class="' + sub + '"><td class="outc">' + otag(x.id) + outcomeCell(exAsT(t, x)) + '</td></tr>';
      });
      return out + outPad(xs.length);
    }
    var r = tacticProgress(t);
    var prog = r == null ? '<td class="num"' + rs + '>&mdash;'
                         : '<td class="num final dprog ' + dBand(r) + '"' + rs + '>' + dPct(r);
    prog += '<span class="oavg">average of ' + (xs.length + 1) + '</span></td>';
    out = '<tr>' + lead + deckOutFig(t, t) + prog + note + '</tr>';
    xs.forEach(function(x){
      var e = exAsT(t, x);
      out += '<tr class="' + sub + '"><td class="outc">' + otag(x.id) + outcomeCell(e) + '</td>' +
        deckOutFig(t, e) + '</tr>';
    });
    return out + outPad(xs.length);
  }
}

/* ── §481: THE COMPANY'S SHORT REVIEW, AND A DIRECTION'S OWN DECK ────────
   Islam, round 2: *"it will be 1 flow … it needs to be short yes as a company
   performance the foundation, the analysis, the directions & capbilities and
   then thier performance"*, and of the owner, *"when press present he wll
   only see his slides"*.

   ONLY WHERE THE COMPANY'S PLAN IS THE WHOLE PLAN: the units off and the
   directions in pillars. Everywhere else the group deck is exactly what it
   was, asserted. */
/* §571: ONE SWITCH FOR EVERY SLIDE — Owner and Collabs. on the tactics
   slides, the office's, kept on the company (`SMPRules.slideColOn`). The plan
   download keeps both: there an empty owner is a gap the plan still owes. */
function deckColOn(k){
  /* §574.2: the guided tour's made-up direction draws neither, whatever the
     office's switch says for the real slides (Islam: *"hide the owner and
     collaborator columns from the demo slides"*). Set only while its deck
     is drawn, as DECK_PLAN is for the plan. */
  if (DECK_EXAMPLE && (k === "owner" || k === "collabs")) return false;
  return DECK_PLAN || SMPRules.slideColOn(GROUP, k);
}
function companyReviewOn(){
  return !SMPRules.buExists(GROUP) && topWay() !== "projects";
}
/* The Foundation: the aspiration, the end in mind and the company's key
   objectives — the Foundation tab's own three, read off GROUP (§428 put them
   there; the unit-shaped view carries none). Nothing to say draws nothing
   (§253). */
function companyFoundationSlides(){
  /* §557: what the company's structure switches on, and nothing it does not. */
  var aspOn = compOn("group", "aspiration");
  var asp = aspOn ? String(GROUP.aspiration || "").trim() : "", end = aspOn ? String(GROUP.endInMind || "").trim() : "";
  var kos = !compOn("group", "keyobj") ? [] : SMPRules.shown(Array.isArray(GROUP.keyObjectives) ? GROUP.keyObjectives : []);
  if (!asp && !end && !kos.length) return [];
  var rows = kos.map(function(m, i){
    return '<tr><td class="idx">' + (i+1) + '</td><td class="lead">' + esc(m.name) + fmark(m.id) + '</td>' +
      '<td class="num">' + (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>' +
      '<td class="num big3">' + (m.target3y ? tgtShown(m.target3y) : "&mdash;") + '</td></tr>';
  }).join("");
  /* ── IT CONTINUES RATHER THAN RUNS OFF THE SLIDE (§553.7) ──────────
     On El Abd this slide is 22px taller than the slide it is drawn on, with
     the last objective cut in half — and the fit pass could do nothing
     about it, because `.tight` is all it has for a slide that does not say
     it may be split. It says so now, and the pass continues the objectives
     table onto a second slide exactly as it does for every other long table
     in the deck (§69.5). The continuation does not repeat the aspiration:
     present.css hides `.aimtop` on a `[data-cont]` slide, because a lead
     paragraph said twice is the room reading it twice. */
  return ['<section class="dslide" data-split="cofound"' +
    anch("aim", "After the Foundation") + '><h2>What we are aiming at</h2>' +
    ((asp || end) ? '<div class="aimtop">' +
      (asp ? '<div><span class="dlab">' + L1("aspiration") + '</span><p class="asp2">' + esc(asp) + '</p></div>' : '') +
      (end ? '<div><span class="dlab">' + L1("endinmind") + '</span><p class="asp3">' + esc(end) + '</p></div>' : '') +
      '</div>' : '') +
    (rows ? '<div class="aimbottom"><span class="dlab">' + L("keyobj","bu") + horizonBy() + '</span>' +
      '<table class="zebra dbig"><thead><tr><th class="idx">#</th><th>Objective</th>' +
      '<th class="num">This year</th><th class="num">' + horizonColLabel() + '</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' : '') +
    '</section>'];
}
/* The analysis: the four boxes on ONE slide, two by two, in the SWOT's own
   hues — the full section is four slides and a divider, which is the length
   this review exists to lose. */
function companyAnalysisSlides(u){
  if (!compOn("group", "swot")) return [];
  var hues = { s:"good", w:"bad", o:"stone", t:"warn" };
  var quads = SMPRules.swotQuads(GROUP, "group");
  var has = function(q){ return (u.swot[q] || []).filter(function(t){ return String(t || "").trim(); }); };
  if (!quads.some(function(q){ return has(q).length; })) return [];
  return ['<section class="dslide d-coswot"' + anch("swot", "After the Analysis") + '>' +
    '<h2>' + (esc(SMPRules.swotTitle(GROUP, "group")) || "Analysis") + '</h2><div class="dswgrid">' +
    quads.map(function(q){
      var items = has(q);
      return '<div class="dswcol t-' + hues[q] + '"><h3>' + esc(LTraw("group", SMPRules.QUAD_KEYS[q])) + '</h3>' +
        (items.length ? '<ol class="dswot">' + items.map(function(t, i){
          return '<li><span class="n">' + (i+1) + '</span><span>' + esc(t) + '</span></li>';
        }).join("") + '</ol>' : '<p class="dswnone">&mdash;</p>') + '</div>';
    }).join("") + '</div></section>'];
}
/* ── §553 — A PART OF THE RUNNING ORDER THAT IS NOT A BOX ────────────────
   Islam, of the presentation: *"we choose to present the foundation and then
   the swot if needed and then every direction and capability in the sequence
   selected and then the functions in the sequence selected as well"*.

   The company's Foundation and its SWOT were only ever drawn INSIDE the
   company's own deck, which the flow puts LAST (§481, his *"company comes
   last"*) — so a review that wants to set the scene first could not. They are
   parts now, placed anywhere in the order, and `sec:found` / `sec:swot` are
   how you place them.

   NOT A SECOND DESCRIPTION OF THE SAME SLIDES (§53.5). It calls the very
   functions the company review calls — `companyFoundationSlides` and
   `companyAnalysisSlides` — so a change to either reaches both, and a part
   presented on its own cannot drift from the same part presented in the
   company's deck. The cover and the Thank you are `dirDeckHtml`'s, for the
   same reason: a part is a part. */
var SEC_PART_KEYS = ["found", "swot"];
var SEC_PARTS = {
  /* §557: the whole Foundation part, as the company's deck draws it — Who
     we are and Values included — under the part's own cover. */
  found: { name: "Foundation", slides: function(u){ return deckFoundationBody("group", companyFoundationSlides(u), []); } },
  swot:  { name: "Analysis",   slides: function(u){ return companyAnalysisSlides(u); } }
};
function secDeckHtml(t){
  var key = boxRef(t).key, part = SEC_PARTS[key];
  if (!part) return "";
  var u = topAsUnit(), body = part.slides(u) || [];
  /* NOTHING TO SHOW IS NOTHING TO PRESENT (§45.2): a cover and a Thank you
     over an empty section is a blank slide with a heading on it. */
  if (!body.length) return "";
  var title = part.name;
  var S = ['<section class="dslide d-cover"' + anch("cover", "After the cover") +
    sec("COVER", title, true) + '>' +
    (deckMark(u)
        ? '<img class="dcovermark" src="' + esc(deckMark(u)) + '" alt="' + esc(u.name) + '">'
        : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
    '<h1 class="cover">' + esc(title) + '</h1><div class="coverrule"></div>' +
    '<p class="coversub">' + esc(GROUP.org) + ' &middot; Strategy review &middot; ' +
    esc(REVIEW.name) + '</p></section>'];
  S = S.concat(body);
  S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last — before Thank you", "before") +
    sec("END", "Thank you") + '><h1 class="cover">Thank you</h1>' +
    '<div class="coverrule"></div><p class="coversub">' + esc(title) +
    ' &middot; ' + esc(REVIEW.name) + '</p></section>');
  return S.join("");
}

/* A direction's own deck: its cover naming who presents it, the direction's
   own slides — the very ones the full plan deck draws, through the one
   builder (§53.5) — and Thank you. */
function dirDeckHtml(t){
  var d = dirPillar(t);
  return d ? dirDeckOf(topAsUnit(), d.p, d.i, null) : "";
}
/* §574: THE ONE BUILDER OF A DIRECTION'S DECK, so the guided tour's made-up
   direction is drawn by exactly what draws a real one (§53.5) — a second
   copy of these slides for the example would be a second answer to "what
   does a direction's deck look like", and the tour would then be explaining
   slides nobody presents. `ex` is the example's: the line saying the figures
   are made up (B3), its slides whatever the company's own plan switch says,
   and no Thank you, because the tour ends the deck. Null for every real one. */
function dirDeckOf(u, p, i, ex){
  var code = pillarCode(u, i);
  var who = [p.owner ? "Presented by " + esc(p.owner) : "",
             p.custodian ? "custodian " + esc(p.custodian) : ""].filter(Boolean).join(" &middot; ");
  var S = ['<section class="dslide d-cover"' + anch("cover", "After the cover") +
    sec("COVER", p.name, true) + '>' +
    (deckMark(u)
        ? '<img class="dcovermark" src="' + esc(deckMark(u)) + '" alt="' + esc(u.name) + '">'
        : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
    '<h1 class="cover">' + esc(p.name) + '</h1><div class="coverrule"></div>' +
    /* AND IT CARRIES WHAT THE TITLE PAGE CARRIED (§96.2, §553.4). Dropping
       that slide would otherwise take the theme and the subtitle with it —
       neither is on the cover, and neither is anywhere else in this deck.
       Both are drawn only where the direction HAS one (§45.2); on all three
       live clients today, none of them does, so no cover moves. */
    '<p class="coversub">' + esc(code) +
      (String(p.theme || "").trim()
        ? ' &middot; ' + L1("theme") + ' ' + esc(p.theme) : '') +
      ' &middot; Strategy review &middot; ' + esc(REVIEW.name) + '</p>' +
    (String(p.sub || "").trim() ? '<p class="coversub">' + esc(p.sub) + '</p>' : '') +
    (who ? '<p class="coversub dwho">' + who + '</p>' : '') +
    (ex ? '<p class="coversub dexample">' + ex.aside + '</p>' : '') + '</section>'];
  var on = !!ex || planOn(u);
  if (on) S = S.concat(pillarSlidesOf(u, p, i, true));

  /* ── AND IT ENDS ON ITS READING (§553.3) ──────────────────────────────
     The deck a direction's owner presents had no slide that said how the
     direction did. It carried the two figures in the corner of every slide
     after the title (`deckPillarHead`, until §553.3) and presented neither,
     so the owner stood in front of 95% with nothing on the screen saying
     what it counts or what it is measured against.

     IT IS THE SAME SLIDE THE FULL DECK ENDS ON, through the same builder
     (§553.2, §53.5): a word under each reading saying what it counts, and a
     line under both saying why they are different questions. Only the cells
     are this direction's.

     AND IT IS SAID LAST, where §254.4 put it — Islam: *"where the units
     stands to be the last slide"*. The measures, the categories and the
     tactics are worked through first; then the reading they add up to.

     DRAWN ONLY WHERE THERE IS A READING (§45.2). A direction with no
     measures and nothing delivered would otherwise get a headline slide
     carrying two dashes, which says the plan owes an answer nobody asked
     it for. */
  var dirPerf = on ? pillarPerf(p) : null;
  var dirExec = on && pillarExec(p) && pillarPlan(p)
    ? Math.round(pillarExec(p) / pillarPlan(p) * 100) : null;
  if (dirPerf != null || dirExec != null) {
    S.push(standSlideOf(esc(p.name),
      [ dirPerf != null && standCell(L("measure") + ' performance', dirPerf,
          SMPRules.shown(p.measures || []).length + ' ' + esc(L("measure")) +
          ', by their targets'),
        dirExec != null && standCell('Execution performance', dirExec,
          dPct(pillarExec(p)) + ' delivered against ' + dPct(pillarPlan(p)) + ' planned') ],
      /* AND THE FOOTNOTE NAMES ONLY THE READINGS ON THE SLIDE (§243): a
         direction with nothing delivered draws no Execution cell, and a
         footnote explaining Execution would be the slide explaining a
         figure it is not showing. */
      (dirPerf != null
        ? esc(L("measure")) + ' measure how the work set against this ' +
          esc(p.kind || L1("pillar")).toLowerCase() + ' is going. ' : '') +
      (dirExec != null
        ? 'Execution measures whether that work is landing on time.' : '')));
  }

  if (!ex) S.push('<section class="dslide d-cover d-thanks"' + anch("end", "Last — before Thank you", "before") +
    sec("END", "Thank you") + '><h1 class="cover">Thank you</h1>' +
    '<div class="coverrule"></div><p class="coversub">' + esc(p.name) +
    ' &middot; ' + esc(REVIEW.name) + '</p></section>');
  return S.join("");
}

/* ── THE RUNNING HEAD SAYS WHICH SLIDE, NOT HOW IT WENT (§553.3) ────────
   Islam, of a direction owner's own deck: *"the user view of a performance
   where he opens the presentation is not clear as the user only sees the
   performance of his directions in the presentation directly"* — and, shown
   that deck rendered: the two readings stood in the corner of four slides
   out of six, and no slide presented them.

   A NUMBER REPEATED IS NOT A NUMBER PRESENTED. Key Measures and Execution
   were drawn here, small, over the measures, the categories and the tactics
   — three slides that are each ABOUT something else, and none of which can
   explain what the two figures mean or what they are measured against. The
   reader meets 95% four times and is told once what it is: never.

   So the figures leave the running head and are said ONCE, properly, on
   "Where it stands" — the slide §553.2 made every box's, with a word under
   each reading saying what it counts and a line under both saying why they
   are different questions. A direction's own deck gets that slide for the
   first time (`dirDeckHtml`); the full plan deck already ended on it.

   NOTHING IS HIDDEN BY THIS. The pillar's own title page still carries both
   readings large (`.leadstats`, the slide immediately before these), and the
   score table still scores every pillar. What goes is the third printing.

   IT GOES EVERYWHERE, not only in a direction's own deck. The four callers
   are all `pillarSlidesOf`, which is the ONE builder a direction's deck and
   the full plan deck share (§53.5) — so "only on the owner's copy" is not a
   setting, it is a fork of the shared builder, and it would make the same
   direction read two different ways depending on who opened it. */
/* §564: WHAT A TACTIC NEEDS rides under its name in the plan, as it does on
   the Plan page and always did in the plan download (§415) — never in the
   review, which is about how the figures went. */
function planReqs(t){
  var rq = DECK_PLAN && requirementsOn(t) ? reqsOf(t) : [];
  return rq.length ? '<span class="dsub">' + esc(detailWord("requirements", "many", t)) + ': ' +
    esc(rq.join("  \u00b7  ")) + '</span>' : '';
}
function deckPillarHead(u, p, pi, which){
  return '<div class="dphdr"><h2><span class="dcode">' + pillarCode(u, pi) + '</span> ' +
    esc(p.name) + '<span class="dwhich">' + which + '</span></h2></div>';
}

/* ── A supporting function's review (§15.12) ──────────────────────────────
   The same deck, carrying the project model's content: no measures, no
   tactics. One system — a function's review must read as the same product as
   a unit's, which is why every slide reuses the unit deck's shapes. */

/* ── A SUPPORTING FUNCTION'S S&W ON ONE SLIDE (§399) ─────────────────
   Two columns, the unit SWOT's own list and its own two hues, so a function's
   slide reads as the same thing a unit's does (§53.5). Blank lines are not
   items (§246's whitespace rule). No slide at all when both lists are empty. */
function fnSWSlide(f){
  if (!f) return "";
  var sw = f.swot || {};
  /* §418: which boxes, what they are called and what the slide is called are
     the functions layer's (Structure); unset, it is today's two. */
  var fk = Object.keys(FUNCTIONS).filter(function(k){ return FUNCTIONS[k] === f; })[0] || "";
  var tg = "fn:" + fk, hues = { s:"good", w:"bad", o:"stone", t:"warn" };
  var quads = SMPRules.swotQuads(GROUP, tg);
  var title = esc(SMPRules.swotTitle(GROUP, tg)) || "Strengths &amp; Weaknesses";
  var col = function(key, title, hue){
    var items = (sw[key] || []).filter(function(t){ return String(t || "").trim(); });
    return '<div class="dswcol t-' + hue + '"><h3>' + title + '</h3>' +
      (items.length ? '<ol class="dswot">' + items.map(function(t, i){
        return '<li><span class="n">' + (i+1) + '</span><span>' + esc(t) + '</span></li>';
      }).join("") + '</ol>' : '<p class="dswnone">&mdash;</p>') + '</div>';
  };
  var any = quads.some(function(k){
    return (sw[k] || []).some(function(t){ return String(t || "").trim(); }); });
  if (!any) return "";
  return '<section class="dslide d-fnsw"' + anch("fnsw", "After Strengths & Weaknesses") + '>' +
    '<h2>' + title + '</h2><div class="dswgrid">' +
    quads.map(function(q){ return col(q, LT(tg, SMPRules.QUAD_KEYS[q]), hues[q]); }).join("") +
    '</div></section>';
}
function deckSlidesFn(subject){
  /* §326: the function's OWN work — the same list its four pages draw, so the
     projector cannot show a deck the screen does not (§53.5).

     §334: OR A CAPABILITY'S, because a capability presents its own review and
     it is planned exactly the same way. The builder takes a TARGET and reads
     the holder from it; a second deck builder for the second kind is what
     §296 and §305 each measured the cost of and refused. */
  var target = holderTarget(subject), isCap = isCapTarget(target);
  /* §405: a unit that is not planned in pillars reads this deck too. */
  var isUnit = isUnitHolderId(target);
  var cap = isCap ? capById(capKeyOf(target)) : null;
  var fk = isCap ? (cap && cap.fn) : isUnit ? null : fnKeyOf(target);
  var f = isCap ? cap : isUnit ? subjUnit(target) : FUNCTIONS[fk];
  var noteKey = isUnit ? subjKey(target) : "fn:" + fk;
  var caps = capsShown(target);
  var realCaps = (isCap || isUnit) ? [] : capsOfFunction(fk);
  /* §342: a function that plans in objectives and actions. The deck is the
     same deck — one builder, because a second one is what §296 and §305 each
     measured the cost of and refused — and what changes is the ONE slide that
     lists the work: Actions where a projects holder lists Projects, with no
     per-project sections behind it because there are none. */
  var objMode = plansInObjectives(target);
  var S = [];

  S.push('<section class="dslide d-cover"' + anch("cover", "After the cover") +
    sec("COVER", f.name, true) + '>' +
    (groupLogo()
        ? '<img class="dcovermark" src="' + esc(groupLogo()) + '" alt="' + esc(GROUP.org) + '">'
        : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
    '<h1 class="cover">' + esc(f.name) + '</h1><div class="coverrule"></div>' +
    /* §326: THE COVER NAMES WHAT THE DECK HOLDS. A function whose projects
       are its own is not presenting a capability review, and saying so on the
       first slide in front of a room is Islam's complaint at its loudest. The
       capability wording survives for a function that really carries one. */
    '<p class="coversub">' + (realCaps.length
      ? L1("capability") + ' review &middot; ' + esc(REVIEW.name) + ' &middot; ' +
        realCaps.length + ' ' + (realCaps.length === 1 ? L1("capability") : L("capability"))
      : 'Review &middot; ' + esc(REVIEW.name) + ' &middot; ' +
        (objMode
          /* §342: the cover says what the deck holds, which is the whole of
             §326's argument one format along — "0 projects" over a plan made
             of objectives and actions names a thing that does not exist. */
          ? plural(SMPRules.shown(caps.reduce(function(a2, c){
              return a2.concat(c.actions || []); }, [])).length, "action")
          : plural(caps.reduce(function(n, c){
              return n + ((c.projects || []).length); }, 0), "project"))) + '</p></section>');

  /* §399: the function's S&W, right after its cover, where a unit's SWOT
     sits after its foundation. Never on a capability's own deck. */
  /* ── §557: THE PARTS, IN THE ONE ORDER ──────────────────────────────
     Foundation, then SWOT, then the plan, then Overall performance, each
     behind its own divider (Islam: *"before every part"*). The key
     objectives of the box's OWN work are its Foundation's; those of a
     capability it carries stay inside that capability, where they are
     read. A unit presents its aspiration and its SWOT whichever way it
     plans (§405). */
  var structT = isUnit ? subjKey(target) : isCap ? target : "fn:" + fk;
  var kSlide = function(c){
    var kRows = SMPRules.shown(c.keyObjectives).map(function(m, i){
      return '<tr><td class="idx">' + (i+1) + '</td>' +
        '<td class="lead">' + esc(m.name) + '</td>' +
        '<td class="num">' + (m.weight == null ? "&mdash;" : m.weight + "%") + '</td>' +
        '<td class="num">' + (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>' +
        '<td class="num">' + (m.actual == null || m.actual === "" ? "&mdash;" : figVsDue(m)) + '</td>' +
        '<td class="num final ' + dBand(measureScore(m)) + '">' + dPct(measureScore(m)) + '</td>' +
        (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
    }).join("");
    return '<section class="dslide"' + anch("cap" + c.id + "k", "After " + c.name + " — " + labelWord("keyobj","bu")) +
      '><h2>' + L("keyobj") + (DECK_PLAN ? '' : ' &mdash; where we stand') +
      '<span class="dwhich">' + esc(c.name) + '</span></h2>' +
      '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Objective</th>' +
      '<th class="num">Weight</th><th class="num">Annual target</th>' +
      '<th class="num fig">Actual</th><th class="num fig">Score</th><th class="fig">Note</th></tr></thead>' +
      '<tbody>' + kRows + '</tbody></table></section>';
  };
  var ownKs = caps.filter(function(c){ return c.own && holderHasKOs(c); });
  var nKO = ownKs.reduce(function(n, c){ return n + SMPRules.shown(c.keyObjectives).length; }, 0);
  S = S.concat(foundationPart(structT, f.name, nKO ? [[nKO, L("keyobj","bu")]] : [],
    isUnit ? unitAimSlides(f, true) : [], ownKs.map(kSlide)));
  if (!isCap && !isUnit && compOn("fn:" + fk, "swot")) S = S.concat(swotPart("fn:" + fk, f.name, [fnSWSlide(f)]));
  if (isUnit) { S = S.concat(unitSwotSlides(f)); S = S.concat(competeSlides(f)); }
  /* The plan's divider: projects, or actions where the box plans that way. */
  var nWork = caps.reduce(function(n, c){
    return n + (objMode ? SMPRules.shown(c.actions).length : (c.projects || []).length); }, 0);
  if (planOn(target) && nWork)
    S.push(sectSlide("sprojects", "After the " + (objMode ? "Actions" : labelWord("project","bu")) + " divider",
      objMode ? "Actions" : L("project"),
      "The " + nWork + " " + (objMode ? (nWork === 1 ? "action" : "actions") : (nWork === 1 ? L1("project") : L("project"))).toLowerCase() +
        " " + f.name + " committed to, and how each is going.", null));
  var scoreTables = [];

  caps.forEach(function(c){
    /* §515.2 (spec 066 P5): THE DECK READS WHAT THE PAGE READS. A unit that
       plans in projects is drawn here through its own holder, and the page has
       always scored that holder's objectives as the UNIT's (holderKOScore);
       the deck asked capKOScore and could print a different number for the
       same objectives on a projector (§53.5). */
    var ko = holderKOScore(c), perf = capPerf(c), ce = capExec(c);

    /* The capability's cover carries its definition and its readings — key
       objectives only where it has any (§15.1: absent, never zero). */
    /* §236.3's anchors, mirrored on the function's deck (§53.5): keyed on the
       capability's and the project's ids, the same stability class as the
       "cap"+id and "dx"+id anchors beside them. */
    /* §326: NO SECOND COVER FOR THE FUNCTION'S OWN WORK. The deck has just
       opened on the function's own name; a slide headed "Capability · Finance"
       over the word "Finance" names a thing that does not exist and says the
       name twice (§87's twins, on a projector). A capability it CARRIES still
       gets one — telling one from another is what that slide is for. */
    if (!c.own)
    S.push('<section class="dslide d-cover"' + anch("cap" + c.id + "c", "After " + c.name + " — cover") +
      sec(secTwo(c.name), c.name) +
      '><span class="seclab">' + L1("capability") + ' &middot; ' +
        esc(f.name) + '</span>' +
      '<h1 class="cover">' + esc(c.name) + '</h1>' +
      '<p class="coversub">' + esc(c.def) + '</p>' +
      '<div class="coverrule"></div><div class="leadstats">' +
        (holderHasKOs(c)
          ? '<div><span class="dlab">' + L("keyobj") + '</span><b class="' + dBand(ko) + '">' + dPct(ko) + '</b></div>'
          : '') +
        '<div><span class="dlab">' + L1("project") + ' performance</span><b class="' + dBand(perf) + '">' + dPct(perf) + '</b></div>' +
        '<div><span class="dlab">Milestones</span><b class="plain">' + ce.done + ' of ' + ce.total + '</b></div>' +
      '</div></section>');

    /* §515.2 P5: holderHasKOs() is the page's own test, so a function's
       objectives switched off (§437) draw no slide here either. */
    if (!c.own && holderHasKOs(c)) S.push(kSlide(c));
    if (!planOn(target)) return;
    if (objMode) {
      var acts = SMPRules.shown(c.actions);
      var aRows = acts.map(function(a3, i){
        var v = msReads(a3);
        return '<tr><td class="idx">' + (i+1) + '</td><td class="dirname">' +
          '<b>' + esc(a3.name) + '</b>' +
          (a3.owner ? '<span class="dsub">' + esc(a3.owner) + '</span>' : '') + '</td>' +
          '<td class="num">' + esc(a3.due || "\u2014") + '</td>' +
          '<td class="num">' + esc(msStatusWord(a3.status) || "\u2014") + '</td>' +
          '<td class="num final ' + dBand(v) + '">' +
            (statusPending(a3) ? '<span class="missing">Needs a %</span>' : dPct(v)) +
          '</td>' +
          (a3.note ? '<td class="dnote">' + esc(a3.note) + '</td>'
                   : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      var tal = fnActionsTally(c.fn);
      S.push('<section class="dslide"' + anch("cap" + c.id, "After " + c.name + " \u2014 actions") +
        '><h2>Actions<span class="dwhich">' + esc(c.name) + '</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Action</th>' +
        '<th class="num">Due</th><th class="num fig">Status</th>' +
        '<th class="num fig">Progress</th><th class="fig">Note</th></tr></thead>' +
        '<tbody>' + (aRows || '<tr><td colspan="6">No actions yet.</td></tr>') + '</tbody></table>' +
        '<p class="headfoot">' + tal.done + ' of ' + tal.total + ' done' +
          (tal.due < tal.total ? ' &middot; ' + tal.due + ' due so far' : '') +
          (tal.pending ? ' &middot; ' + tal.pending + ' said In progress with no per-cent' : '') +
          '. Actions are counted, never scored into the objectives.</p></section>');
      return;
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
/* ── §557: THE PROJECTS ARE NAMED BEFORE THEY ARE SCORED ─────────
       Islam: *"the projects view at the start should show the projects
       like the pillars not the performance … in the overall performance
       view it's fine to show it as performance"*. The same cards as the
       pillars' roll-call (§254.5); the table with the figures moves to
       Overall performance. The anchor stays here, where the list was, so
       a picture placed after it keeps its place. */
    if (c.projects.length) S.push('<section class="dslide"' + anch("cap" + c.id, "After " + c.name + " \u2014 " + labelWord("project","bu")) +
      '><h2>' + L("project") + (c.own ? '' : '<span class="dwhich">' + esc(c.name) + '</span>') + '</h2>' +
      '<div class="pcards" style="--n:' + c.projects.length + ';--c:' + pillarCols(c.projects.length) +
        ';--r:' + Math.ceil(c.projects.length / pillarCols(c.projects.length)) + '">' +
      c.projects.map(function(p){
        var who = [p.owner || "", (p.start || "") + (p.end ? " \u2192 " + p.end : "")].filter(function(x){ return String(x).trim(); }).join(" \u00b7 ");
        return '<div class="pcard"><span class="pcard-c">' + esc(projCode(holderCodeOwner(c), p)) + '</span>' +
          '<span class="pcard-n">' + esc(p.name) + '</span>' +
          (who ? '<span class="pcard-s">' + esc(who) + '</span>' : '') + '</div>';
      }).join("") + '</div></section>');
        if (c.projects.length) scoreTables.push('<section class="dslide"' + anch("cap" + c.id + "p", "After " + c.name + " \u2014 " + labelWord("project","bu") + " where we stand") +
      '><h2>' + L("project") + ' &mdash; where we stand<span class="dwhich">' + esc(c.name) + '</span></h2>' +
      '<table class="zebra dirs"><thead><tr><th class="idx">#</th><th>' + L1("project") + '</th>' +
      '<th class="num">Deliverables</th><th class="num">Outcomes</th>' +
      '<th class="num">Performance</th><th class="num">Milestones</th></tr></thead>' +
      '<tbody>' + (pRows || '<tr><td colspan="6">No ' + L("project") + ' yet.</td></tr>') + '</tbody></table>' +
      '<p class="headfoot">Performance is half deliverables, half outcomes, per side. Milestones are completed of total.</p></section>');

    c.projects.forEach(function(p){
      var mst = projMilestones(p);
      /* §334: A PROJECT IS A SECTION OF THIS DECK. §326 stopped drawing the
         holder's cover for a function's OWN work — rightly, a slide headed
         "Capability · Finance" over the word Finance says the name twice
         (§87) — and the `sec()` stamp rode on that slide, so a projects
         function's strip came out COVER · END over thirteen slides: a
         navigation bar naming nothing for the whole middle of the deck
         (§266.12, whose own recorded gap this closes). The code is the one
         the page, the rail and the workbook already show (§48, §310), so the
         strip names what the audience is looking at and nothing is invented. */
      S.push('<section class="dslide d-cover"' + anch("prj" + p.id, "After " + p.name + " — title page") +
        sec(projCode(holderCodeOwner(c), p), p.name) +
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
                    : (o.actual == null || o.actual === "" ? "\u2014"
                       /* §300: a yes/no answer reads in words on the projector
                          too, so the room is never shown the stored spelling
                          of one ("In progress 60"). */
                       : esc(SMPRules.isYesNo(o.target) ? SMPRules.ynShown(o.actual)
                                                        : String(o.actual)));
        var notDue = !dueThisCycle(dxWhen(row));
        return '<tr' + (notDue ? ' class="dim"' : '') + '><td class="idx">' + (i+1) + '</td>' +
          '<td class="lead">' + esc(o.name) + '</td>' +
          '<td>' + (d ? "Deliverable" : "Outcome") + '</td>' +
          '<td class="num">' + esc(dxWhen(row) || "\u2014") + '</td>' +
          '<td class="num">' + (d ? "Y/N" : figHtml(o.target || "\u2014")) + '</td>' +
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
        '<th class="num">Target</th><th class="num fig">Status</th><th class="num fig">' + DX_PCT + '</th>' +
        '<th class="fig">Note</th></tr></thead><tbody>' + dxRowsHtml + '</tbody></table></section>');

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
          (over.indexOf(m.id) > -1 ? ' <span class="dsub">after the ' + L1("project") + ' ends</span>' : '') + '</td>' +
          '<td class="num final ' + (m.status === "done" ? "good" : m.status === "wip" ? "attn" : "") + '">' + word + '</td>' +
          '<td class="num">' + (msReads(m) == null ? "&mdash;" : msReads(m) + "%") + '</td>' +
          (m.note ? '<td class="dnote">' + esc(m.note) + '</td>' : '<td class="dnote empty">&mdash;</td>') + '</tr>';
      }).join("");
      if (mRows) S.push('<section class="dslide" data-split="' + esc(p.id) + 'M"' +
        anch("ms" + p.id, "After " + p.name + " — milestones") + '>' +
        '<h2>' + esc(p.name) + '<span class="dwhich">Milestones' + (DECK_PLAN ? '' : ' &middot; ' + mst.done + ' of ' + mst.total + ' completed') + '</span></h2>' +
        '<table class="zebra withnote"><thead><tr><th class="idx">#</th><th>Milestone</th>' +
        '<th>Owner</th><th>Collabs.</th><th class="num">Due date</th><th class="num fig">Status</th><th class="num fig">' + MS_PCT + '</th>' +
        '<th class="fig">Note</th></tr></thead><tbody>' + mRows + '</tbody></table></section>');
    });
  });

  /* AND NONE ON A FUNCTION'S DECK EITHER. The same slide, gathering
     deliverables, outcomes and milestone overruns instead of measures and
     tactics — and removed for the same reason, on both sides of the switch
     rather than on one (A15). */

  /* §243: the same rule as a unit's deck — drawn only when a note is written.
     One question, one answer on both decks (§53.5). */
  /* §553.2 — AND IT SAYS HOW IT DID. A projects box ended on its last
     milestone: no Overall performance divider, no standing, nothing that
     answers the question the review is for. The pillars deck has said this
     since §254.4 (Islam: *"where the units stands to be the last slide"*),
     and there was never a decision that a projects box should not — it
     simply fell between two builders.

     THE CELLS IT HAS, NOT THE CELLS THE OTHER ONE HAS: no pillars reading,
     because it has no pillars. Its objectives where it has them (§515.2's
     P4 rule — `holderHasKOs` is the same question the PAGE asks, so the two
     cannot disagree), and its execution, which `capExec` counts the one way
     §515.2's P2 settled. Drawn only when there IS a reading, or the slide is
     a heading over three dashes (§45.2).

     AND IT GOES BEFORE THE NOTES, which is where a unit's is: a unit reads
     sperf, pillars, stand, notes, end. The first draft of this pushed it
     after them, so a projects box alone would have ended notes, sperf,
     stand — the same slides in a different order from every other box,
     which is the drift this stage exists to remove, introduced by the
     change meant to remove it. `checks/projects-box-stands.py` caught it. */
  var exTally = capExec(f) || {}, exPct = exTally.pct;
  var koHere = holderHasKOs(f) ? capKOScore(f) : null;
  if (exPct != null || koHere != null || scoreTables.length) {
    S.push(sectSlide("sperf", "After the Overall performance divider",
      "Overall performance",
      "Where " + (scoreTables.length ? "the " + L("project").toLowerCase() + " stand, where " : "") +
        esc(f.name) + " stands, and what the cycle is remembered for.",
      null));
    S = S.concat(scoreTables);
  }
  if (exPct != null || koHere != null) {
    S.push(standSlideOf(esc(f.name),
      [ koHere != null && standCell(L("keyobj","bu") + ' performance', koHere,
          'by their measures'),
        exPct != null && standCell('Execution performance', exPct,
          (exTally.done || 0) + ' of ' + (exTally.due || 0) + ' done that are due') ],
      (koHere != null ? 'Objectives measure what was committed to. ' : '') +
      'Execution measures whether the work is landing on time.'));
  }

  var fnote = cycleNote(noteKey);
  if (fnote) S.push('<section class="dslide"' + anch("notes", "After \u201cNotes and achievements\u201d") +
    '><h2>Notes and achievements</h2>' +
    '<div class="dnotebox" contenteditable="true" data-deckunote="' + esc(noteKey) + '">' +
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
  /* §481: a direction hides its own slides on the direction itself. */
  var r = boxRef(target);
  if (r.kind === "dir") { var d = dirPillar(target); return d ? d.p : null; }
  return r.kind === "fn" ? FUNCTIONS[r.key] : UNITS[target];
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
  /* The company by its own name (§553.8's rule, reaching the strip under the
     room): the slides it adds itself were labelled "the group" there, which
     is the word Islam struck out — "there is nothing called elabd review as
     a group". */
  var org = String((GROUP && GROUP.org) || "").trim();
  var name = (target === "group" && org) ? org : placeLabel(target);
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
  /* ── A FLOW'S OWN PAGES ARE NOT SUBJECTS (§554.3) ──────────────────
     §554.1's cover and roll-calls are slides, not people presenting — and
     the presenter counts SUBJECTS off `data-subject`, so each of them took
     a dot of its own, a pill reading "FL", and turned "1 of 3" into
     "1 of 4". Found by the checks rather than by looking, which is the
     point of them.

     EACH ONE IS STAMPED WITH WHAT IT INTRODUCES: the cover with the first
     subject of the flow, a group's page with the first of that group. So
     the strip, the dots and the pills read exactly as they did before the
     pages existed, and the pages ride inside the section they open. */
  var slides = [].slice.call(root.querySelectorAll(".deck .dslide"));
  for (var i = slides.length - 1; i >= 0; i--) {
    var sub = slides[i].dataset.subject || "";
    if (sub.indexOf("flow:") !== 0) continue;
    /* …and marked as the flow's own, so the clock can tell it is nobody's
       time (§556.9): stamped with the first direction, the cover was
       spending that direction's minutes before it had begun. */
    slides[i].dataset.flowpart = "1";
    var next = slides[i + 1];
    if (next && next.dataset.subject) {
      slides[i].dataset.subject = next.dataset.subject;
      /* BOTH, because the strip names a stop from `subjectName` and falls
         back to the target only when there is none — so rewriting the
         subject alone left the first dot reading "flow:cover". */
      if (next.dataset.subjectName) slides[i].dataset.subjectName = next.dataset.subjectName;
      else slides[i].removeAttribute("data-subject-name");
    } else {
      slides[i].removeAttribute("data-subject");
      slides[i].removeAttribute("data-subject-name");
    }
  }
  /* §340: the subjects this deck is of, kept because one subject's deck has
     stops that name SECTIONS rather than subjects, so there is nothing else
     to ask which unit is presenting. Mounted after the innerHTML that would
     otherwise destroy it, and before the fit pass, which only ever inserts
     `.dslide` siblings and leaves it alone. */
  /* …and they are not in the list of who is presenting either (§554.3). */
  DECK.targets = list.filter(function(t){ return String(t).indexOf("flow:") !== 0; });
  DECK.clock = null;
  clockMount(root);
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
  /* §554.3: and the stops are the subjects, so the flow's own pages are
     not in the list the strip is built from either. */
  DECK.flow = DECK.targets.length > 1 ? DECK.targets : null;
  DECK.title = titleHtml;
  root.querySelector(".dtitle").innerHTML = titleHtml;
  root.classList.add("on");
  document.body.classList.add("presenting");
  deckFitPass();
  deckIndex();
  deckTourEnd();   /* §574 */
  deckShow(0);
  deckScale();
  root.focus();
}
/* THE TWO OPENERS STAY, AND BOTH GO THROUGH THE ONE READER (§253.3). They
   are two doors onto one question — Present on a unit, Present on a function —
   and `deckHtmlFor()` is what decides which deck each gets, so a pillars
   function opened through either lands on the same slides. */
function openDeck(u, from){
  /* The bar under the room names the box as its cover does (§553.8): the
     company by its own name, never the top word "Group". */
  openDeckWith("<b>" + esc(deckBoxName(u)) + "</b> &middot; " + esc(REVIEW.name), [u.ukey], from);
}
function openDeckFn(subject, from){
  /* §334: a TARGET, so a capability opens its own review with its own name on
     the bar. `holderTarget` takes the bare function key every existing caller
     hands it. */
  var t = holderTarget(subject);
  var h = isCapTarget(t) ? capById(capKeyOf(t)) : FUNCTIONS[fnKeyOf(t)];
  openDeckWith("<b>" + esc(h ? h.name : "") + "</b> &middot; " + esc(REVIEW.name),
    [t], from);
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
  var t = String(target), r = boxRef(t);
  /* §481: one direction, or the several a person owns ("dir:a,dir:b"),
     each its own deck back to back — the owner's Present shows only theirs.
     A comma-joined list still reads as `dir` on its first address, which is
     the answer the prefix test gave here before §531. */
  if (r.kind === "dir") {
    var ds = t.split(",").filter(function(x){ return dirPillar(x); });
    if (!ds.length) return;
    openDeckWith(ds.map(function(x){ return esc(placeLabel(x)); }).join(" &middot; "), ds, from);
    return;
  }
  /* §334: a capability joins the same branch — the FORM decides, so one
     planned in pillars takes the unit deck exactly as a pillars function
     does, and one planned in projects takes the holder deck. */
  if (r.area === "fn") {
    if (plansInPillars(t)) openDeck(unitLike(t), from);
    else openDeckFn(t, from);
    return;
  }
  openDeck(unitLike(t), from);
}

/* ── THE DECK AS A PDF (§305) ─────────────────────────────────────────
   Islam asked for the presentation to be downloadable beside the plan, and
   chose the PDF over an editable .pptx for now.

   IT PRINTS THE REAL DECK, WHICH IS THE WHOLE ARGUMENT. The deck is
   assembled fresh on the press (§253.3) and then MEASURED — `deckFitPass()`
   splits a long table across slides by reading heights off the attached
   page, and §69 records what happens to that pass on a detached element:
   `scrollHeight` and `clientHeight` are both 0, so every slide reports as
   fitting and the pass silently does nothing. So the deck is opened for
   real, exactly as Present opens it, and the browser prints what is there.

   FIT-TO-WINDOW IS TURNED OFF FIRST, AND PUT BACK. It is a toggle that
   persists on the root between openings (§69.7), and it changes `.deck` to
   the window's size — so the fit pass would split the tables against a box
   that is not the page, and the presenter would get a PDF whose slides break
   in different places from the one they rehearsed.

   THE DECK CLOSES WHEN THE DIALOG DOES, so the press ends where it started.
   `afterprint` fires on Save and on Cancel alike, which is what makes
   cancelling cost nothing; a browser that never fires it leaves the deck
   open on screen, with Exit where Exit always is — a nuisance and not a trap
   (§61). */
/* ONE PRINTER, TWO WAYS IN (§53.5, §312). §305 wrote all of this against a
   single subject and §312 needed the same act over a FLOW; a second copy
   would be a second answer to "what does the platform do to make a PDF",
   and the fit-pass handling and the put-back are exactly the parts that
   would drift. What differs between the two is which deck is opened, so
   that is the argument. */
function deckPrint(open){
  var root = document.getElementById("deckroot");
  var wasFit = root.classList.contains("fitwin");
  root.classList.remove("fitwin");
  open();
  var done = function(){
    window.removeEventListener("afterprint", done);
    closeDeck();
    if (wasFit) root.classList.add("fitwin");
  };
  window.addEventListener("afterprint", done);
  /* One tick, so the paint that `openDeckWith()` just asked for has happened
     before the browser is asked to lay the same thing out for paper. */
  setTimeout(function(){ window.print(); }, 50);
}

function deckToPdf(target){
  deckPrint(function(){ openDeckFor(target); });
}

/* ── EVERY SUBJECT, ONE PDF (§312) ────────────────────────────────────
   Islam, of the contingency pack: *"the pdf in the contiengcy back is like
   the master presentation a full pdf with all slides there."*

   THAT SENTENCE DISSOLVES THE OBSTACLE RATHER THAN WORKING AROUND IT. A PDF
   here is the BROWSER printing (§305) — the platform never holds PDF bytes,
   which is exactly why the file cannot differ from the projector — so a
   folder of nineteen PDFs would have been nineteen print dialogs answered
   one at a time. A flow is ONE deck, so it is one dialog and one file.

   EVERY SUBJECT, IN THE FLOW'S ORDER WHERE ONE IS SET. `masterOrder()` is
   the running order and is allowed to be a SELECTION — the office may tick
   three of eighteen for a board meeting — and a backup of some of the
   subjects is not a backup (the card above says so about the picker). So the
   order is the flow's and the membership is everything, which answers both
   halves of what he asked for rather than one.

   RECORDED, NOT STAMPED. A print dialog's outcome cannot be known — the
   browser fires `afterprint` on Save and on Cancel alike (§305) — so marking
   this person as holding the file would be a claim the platform cannot see
   (§124). §306's reminders go on ending when the two DOWNLOADS are taken. */
function contFlowTargets(){
  var all = masterSubjects();
  var first = SMPRules.masterFlow(GROUP).filter(function(t){
    return all.indexOf(t) >= 0;
  });
  return first.concat(all.filter(function(t){ return first.indexOf(t) < 0; }));
}

/* ── THE FLOW IS ONE PRESENTATION, SO IT OPENS LIKE ONE (§554.1) ────────
   Islam, having played it: *"we need a cover slide for the whole
   presentation as we are presenting elabd q3 strategy review and before the
   directions I find the grouped directions and same for the capabilities"*.

   The master flow was each subject's deck, back to back — nineteen covers
   and no cover for the thing itself, and the directions arriving one after
   another with nothing in front of them saying what the room was about to
   see. The company's own review has had that page since §553.6; this gives
   the flow the SAME page, through the same builder, rather than a second
   one that looks like it (§53.5).

   INSERTED, NOT PLACED. The cover and the two roll-calls are not subjects
   somebody ticks: the cover opens the flow because the flow is a
   presentation, and a group's page goes in front of the first of its
   members because that is what the page is for. Islam's word for it was
   *"automatically"*, twice.

   A GROUP WITH NOBODY IN THE FLOW GETS NO PAGE (§45.2, §253): tick three
   directions and no capability and the Capabilities page is not drawn. */
function flowCoverHtml(){
  var u = topAsUnit();
  return '<section class="dslide d-cover"' + anch("flowcover", "After the cover") +
    sec("COVER", deckBoxName(u), true) + '>' +
    (deckMark(u)
      ? '<img class="dcovermark" src="' + esc(deckMark(u)) + '" alt="' + esc(deckBoxName(u)) + '">'
      : '<div class="eyebrow">' + esc(GROUP.org) + '</div>') +
    '<h1 class="cover">' + esc(deckBoxName(u)) + '</h1><div class="coverrule"></div>' +
    '<p class="coversub">Strategy review &middot; ' + esc(REVIEW.name) + '</p></section>';
}
function flowPartHtml(t){
  if (t === "flow:cover") return flowCoverHtml();
  var u = topAsUnit(), gs = pillarGroups(u, true);
  for (var i = 0; i < gs.length; i++)
    if ("flow:g" + gs[i].names === t) return rollCallSlide(u, gs[i]);
  return "";
}
/* The flow, with its own cover in front and each group's page in front of
   the first of its members. */
function flowWithParts(list){
  var u = topAsUnit(), gs = pillarGroups(u, true);
  var owner = {};
  gs.forEach(function(g){
    g.ix.forEach(function(x){ owner["dir:" + x.p.id] = "flow:g" + g.names; });
  });
  var seen = {}, out = ["flow:cover"];
  list.forEach(function(t){
    var k = owner[t];
    if (k && !seen[k]) { seen[k] = 1; out.push(k); }
    out.push(t);
  });
  return out;
}

function flowToPdf(){
  var list = contFlowTargets();
  if (!list.length) return false;
  deckPrint(function(){
    openDeckWith("<b>Master presentation</b> &middot; " + esc(REVIEW.name),
      flowWithParts(list));
  });
  return true;
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
  /* §334: the capabilities between them, in the board's own order — the flow
     and the board must never disagree about who presents (§245). */
  /* §481: with the company's plan the whole plan, the flow is its directions,
     its capabilities and its functions, and the short company review LAST —
     Islam: *"company comes last"*. */
  /* §553 — THE COMPANY'S OWN SECTIONS ARE PARTS, AND THEY COME FIRST in the
     list the picker opens on. Islam: *"the foundation and then the swot if
     needed and then every direction and capability"* — "if needed" is the
     half that matters, so a part is offered only where it would draw
     something (`secDeckHtml` answers "" over an empty section, §45.2) and a
     client with no Foundation written never sees it in the picker (§61).

     OFFERED TO EVERY SHAPE, not only a company that plans its own strategy:
     Raya's review can open on the group's Foundation before its units, which
     is the same sentence read on a client with units.

     OFFERED, NOT PLACED — and the first draft of this got it wrong. Putting
     the parts in `masterSubjects` alone also put them in the DEFAULT order,
     because `masterOrder` falls back to the whole list when nobody has
     chosen — so every tenant that never touched its flow would have found
     the Foundation at the front of its review. The comment here claimed
     "no tenant's order moves" while the code moved every one of them.
     Islam's word was *"we CHOOSE to present the foundation"*, so a section
     part is placeable and is not placed until somebody places it:
     `masterDefault()` is the order a tenant that has chosen nothing gets,
     and it is the list WITHOUT them. */
  var secs = SEC_PART_KEYS.filter(function(k){ return secDeckHtml("sec:" + k) !== ""; })
                          .map(function(k){ return "sec:" + k; });
  if (companyReviewOn()) {
    var dirs = (Array.isArray(GROUP.items) ? GROUP.items : []).filter(function(p){
      return p && p.id && runsNow(p) && planOn("group"); }).map(function(p){ return "dir:" + p.id; });
    return secs.concat(dirs).concat(boardCapTargets()).concat(boardFunctionTargets())
      .concat(topHasPlan() && planOn("group") ? ["group"] : []);
  }
  return secs.concat(boardUnitTargets()).concat(boardCapTargets()).concat(boardFunctionTargets());
}
/* The running order to open the picker on: the stored one, filtered to
   subjects that still report, and the whole list in board order when nothing
   is stored. A subject added to the tenant AFTER an order was agreed arrives
   NOT presenting rather than being appended — walking a new unit into a board
   meeting because somebody created it is the office's decision, not ours. */
/* §553: everything the picker may offer, minus the parts nobody has placed.
   Two lists where there was one, because "what can be in the order" and
   "what IS in the order when nobody has said" stopped being the same
   question the moment a part could be offered without being default. */
function masterDefault(){
  return masterSubjects().filter(function(t){ return t.indexOf("sec:") !== 0; });
}
function masterOrder(){
  var all = masterSubjects();
  var kept = SMPRules.masterFlow(GROUP).filter(function(t){ return all.indexOf(t) >= 0; });
  return kept.length ? kept : masterDefault();
}
/* Stored as an ABSENCE (§50.6): an order that is simply everybody in the
   board's own order is what an untouched tenant already has, so it deletes the
   key rather than writing a copy of the default — which also means a unit
   added tomorrow joins the flow of a tenant that never chose one, and does not
   join one that did. */
function masterWrite(list){
  /* §553: measured against the DEFAULT, not against everything placeable —
     otherwise an order that is exactly the default would be written out in
     full rather than deleting the key (§50.6), and tomorrow's new unit would
     not join the flow of a tenant that never chose one. */
  var all = masterDefault();
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

/* ── HOW LONG EACH SUBJECT HAS (§340) ─────────────────────────────────
   Islam: *"I need to set as an SMO the time of each presentation so the timer
   appears for the presenter"*, and *"it needs to be per unit and it can be set
   in the master presentation sectoin with the flow."*

   THE READER IS THE SHARED RULE and never a second copy, because the server
   judges the same field (§42) — and the WRITER reaches into `GROUP` directly
   rather than through `presentMinsMap()`, which hands back a FROZEN empty when
   nothing is stored: a reader that created what it looked for would put a
   phantom change into every save (§42's own scar). */
function slotMins(t){ return SMPRules.presentMins(GROUP, t); }
/* Stored as an ABSENCE (§50.6), at both levels: a subject put back to no time
   loses its key, and the last key leaving takes the map with it — so never set
   and set-then-cleared are the same bytes rather than two states nothing
   distinguishes. */
function minsWrite(t, n){
  var map = GROUP[SMPRules.PRESENT_MINS];
  if (n > 0) {
    if (!map || typeof map !== "object" || Array.isArray(map))
      map = GROUP[SMPRules.PRESENT_MINS] = {};
    map[t] = n;
  } else if (map && typeof map === "object") {
    delete map[t];
    if (!Object.keys(map).length) delete GROUP[SMPRules.PRESENT_MINS];
  }
  masterMark();
}
/* 225 minutes is "3h 45m" and 45 is "45m" — never "0h 45m", which reads as a
   figure somebody typed. ONE writer of this string, because the dialog's line
   is rewritten in place as well as painted and the two must not disagree. */
function minsWords(n){
  var h = Math.floor(n / 60), m = n % 60;
  return h ? (h + "h" + (m ? " " + m + "m" : "")) : (m + "m");
}
/* The line above the running order. THE TOTAL IS THE WHOLE ARGUMENT for
   setting the minutes here rather than on nineteen separate unit screens: it
   is an afternoon somebody is dividing, and nowhere else can add it up. It
   sits on the line that already counts the slides, because "how long is this
   review" and "how big is it" are the same question asked twice. */
function masterSumLine(slides){
  if (!MFLOW.pick.length) return "";
  var mins = 0, none = 0;
  MFLOW.pick.forEach(function(t){ var n = slotMins(t); if (n) mins += n; else none++; });
  var out = "about " + plural(slides, "slide");
  if (mins) out += ' &middot; <b class="mftime">' + minsWords(mins) + "</b>";
  /* Named rather than counted silently: a review whose total looks short
     because four subjects have no time is a total that lies by omission.

     ONLY ONCE SOMETHING IS SET, THOUGH. On a tenant that has never used this
     the line would open "19 with no time", which reads as a fault on a
     perfectly healthy review — nagging about a feature nobody has started is
     §45.2's empty state wearing an alarm's clothes. Measured on the worked
     example, which is exactly that tenant. */
  if (mins && none) out += ' &middot; <span class="mfnone">' + none + " with no time</span>";
  return out;
}

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
/* ── WHAT KIND A SUBJECT IS, IN ONE WORD (§554.2) ───────────────────────
   `masterKind` above answers the same question in a chip; this answers it
   as the bare word the filter groups by, and the chip is built FROM this
   so a filter can never offer a word the column does not show (§53.5). */
function masterKindWord(t){
  t = String(t);
  var k = boxRef(t).kind;
  if (k === "sec") return "SECTION";
  if (k === "dir") return SMPRules.pillarIsCap((dirPillar(t) || {}).p) ? "CAP" : "DIR";
  if (k === "cap") return "CAP";
  if (t === "group" && companyReviewOn()) return "CO";
  return k === "fn" ? "FUNC" : "BU";
}
var MFKIND_NAME = { SECTION:"Sections", DIR:"Directions", CAP:"Capabilities",
                    BU:"Business units", FUNC:"Functions", CO:"The company" };

function masterKind(t){
  /* ── ONE ANSWER, WORN AS A CHIP (§554.2) ──────────────────────────────
     §481's four kinds were spelled out again here, and the filter above
     would have been a fifth spelling — so the chip is built FROM
     `masterKindWord` and the two cannot disagree by construction (§53.5).

     IT ALSO FIXES WHAT THE COLUMN SAID. A capability of El Abd's is
     presented as `dir:<id>` like a direction is, so every one of its five
     read DIR in this column while the Capabilities tab, the roll-call and
     the deck all called them capabilities (§542). */
  var k = masterKindWord(t);
  return '<span class="mfkind' + (k === "CAP" || k === "FUNC" ? " fn" : "") +
    '">' + k + '</span>';
}
function masterPaint(){
  var box = document.getElementById("modal-b");
  if (!box || !MFLOW) return;
  var all = masterSubjects();
  /* ── THE LISTS STAY WHERE THEY WERE (§554.2) ──────────────────────
     Islam: *"everytime I remove something from the right the list jumps it
     needs to stay still"*. Every press repaints the whole dialog, so both
     columns were scrolled back to the top under the finger — on a flow of
     nineteen, taking out the last one put the row you were working on off
     the screen. Read before the repaint, put back after. */
  var keepTop = [].map.call(box.querySelectorAll(".mflist"), function(e){ return e.scrollTop; });
  var rest = all.filter(function(t){ return MFLOW.pick.indexOf(t) < 0; });
  /* ── AND THE LEFT COLUMN NARROWS BY KIND (§554.2) ─────────────────
     Islam: *"on the left list I need to have filters so I can choose from
     directions or capabilities or divisions to filter the functions so I
     can select properly or all"*. The chips are built from the kinds the
     client ACTUALLY has, in the picker's own order, so a client with no
     divisions is not offered a Divisions chip over nothing (§45.2). */
  var kinds = [];
  all.forEach(function(t){
    var k = masterKindWord(t);
    if (kinds.indexOf(k) < 0) kinds.push(k);
  });
  if (MFLOW.kind && kinds.indexOf(MFLOW.kind) < 0) MFLOW.kind = "";
  if (MFLOW.kind) rest = rest.filter(function(t){ return masterKindWord(t) === MFLOW.kind; });
  var chips = kinds.length < 2 ? "" :
    '<div class="mfkinds" role="group" aria-label="Narrow the list by kind">' +
    [""].concat(kinds).map(function(k){
      var lit = (MFLOW.kind || "") === k;
      return '<button type="button" class="mfchip' + (lit ? " on" : "") +
        '" data-mfkind="' + esc(k) + '" aria-pressed="' + (lit ? "true" : "false") + '">' +
        esc(k ? (MFKIND_NAME[k] || k) : "All") + '</button>';
    }).join("") + '</div>';
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
  /* §340: THREE BUTTONS, which is Islam's own choice over a list and over a
     typed box, taken with the cost of each stated — that nineteen rows is
     fifty-seven controls, and that three fixed numbers cannot express a slot
     that is not one of them. Recorded as his.

     PRESSING THE LIT ONE CLEARS IT. A dropdown had a blank entry and three
     buttons have nowhere to put one, so the way back to no time is the same
     control pressed twice — which is what `aria-pressed` already means, so
     the keyboard and a screen reader get it for nothing. */
  var minsCell = function(t, name){
    var cur = slotMins(t);
    return '<td class="c-m"><div class="minset" role="group" aria-label="' +
      esc("How long " + name + " has") + '">' +
      SMPRules.PRESENT_MIN_CHOICES.map(function(v){
        var lit = v === cur;
        return '<button type="button" class="minbtn' + (lit ? ' on' : '') +
          '" data-mins="' + v + '" data-minsfor="' + esc(t) + '"' +
          ' aria-pressed="' + (lit ? "true" : "false") + '" title="' +
          esc(lit ? "Press again to leave " + name + " with no time"
                  : name + " gets " + v + " minutes") + '">' + v + '</button>';
      }).join("") + '</div></td>';
  };
  var on = function(t, i){
    var name = placeLabel(t);
    return '<tr data-oi="' + i + '">' +
      '<td class="mfh"><span class="idx-n">' + (i + 1) + '</span>' +
        handle("Drag to reorder " + name) + '</td>' +
      '<td class="c-nm"><b>' + esc(name) + '</b></td>' +
      '<td class="c-k">' + masterKind(t) + '</td>' +
      minsCell(t, name) +
      '<td class="c-n">' + masterCount(t) + '</td>' +
      '<td class="c-x"><button class="mfx" data-mftick="' + esc(t) + '" title="Take out"' +
        ' aria-label="Take ' + esc(name) + ' out of the flow">×</button></td></tr>';
  };
  box.innerHTML = '<div class="mflow"><div class="mfcols">' +
    '<div class="mfcol"><div class="mfhead">' +
      '<h4>Everyone who reports</h4>' + chips +
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
      /* ── AND A WAY BACK TO AN EMPTY FLOW (§554.2) ─────────────────
         Islam: *"there should be somewhere where I reset all and bring all
         selected flow to the left as if deselect all from the right pan"*.
         Nineteen presses, or one. Drawn only while there is something to
         take out, so it is never a control over nothing (§61). */
      (MFLOW.pick.length
        ? '<button type="button" class="lnk" data-mfnone="1">Take all out</button>'
        : '') +
      '<span class="mfcount" data-mfsum>' + masterSumLine(total) + '</span></div>' +
      '<div class="mflist"><table class="mftbl"><thead><tr>' +
        '<th class="c-h"></th><th>Name</th><th class="c-k">Kind</th>' +
        '<th class="c-m">Minutes</th>' +
        '<th class="c-n">Slides</th><th class="c-x"></th></tr></thead>' +
        '<tbody data-mfflow>' + MFLOW.pick.map(on).join("") + '</tbody></table>' +
      '<p class="mfempty"' + (MFLOW.pick.length ? ' hidden' : '') + '>' +
        'Nobody yet — tick a unit or function on the left.</p></div></div>' +
    '</div>' +
    (MFLOW.note ? '<p class="mfnote" role="status">' + esc(MFLOW.note) + '</p>' : '') +
    '<div class="cbtns"><button data-mfno="1">Cancel</button>' +
    '<button class="mfgo" data-mfgo="1"' +
      (MFLOW.pick.length ? "" : ' aria-disabled="true"') +
      '>Go to the slides</button></div></div>';
  masterWire();
  [].forEach.call(box.querySelectorAll(".mflist"), function(e, i){
    if (keepTop[i] != null) e.scrollTop = keepTop[i];
  });
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
  /* §554.2: the kind chips and the way back to an empty flow. Both repaint
     through `masterPaint`, which now keeps each column where it was. */
  [].forEach.call(box.querySelectorAll("[data-mfkind]"), function(b){
    b.addEventListener("click", function(){
      MFLOW.kind = (MFLOW.kind || "") === this.dataset.mfkind ? "" : this.dataset.mfkind;
      MFLOW.note = "";
      masterPaint();
    });
  });
  var none = box.querySelector("[data-mfnone]");
  if (none) none.addEventListener("click", function(){
    MFLOW.pick = [];
    MFLOW.note = "";
    masterWrite(MFLOW.pick);
    masterPaint();
  });
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
  /* ── THE MINUTES, WRITTEN WITHOUT A REPAINT (§340) ─────────────────
     DELEGATED ON THE TBODY, not wired per button: the cell's three buttons are
     rewritten in place on every press, so a listener on each one would die
     with the node that carried it — and the tbody is replaced whole by
     `masterPaint()`, so nothing accumulates either (§24, §47.2).

     AND IT MUST NOT REPAINT. §71.2's rule, with a reason this dialog makes
     sharp: `.mflist` is a scrolling box holding nineteen rows, so a repaint
     would throw somebody setting the fifteenth subject's time back to the top
     of the list on every press. Three buttons and one line are rewritten
     instead. */
  var flow = box.querySelector("[data-mfflow]");
  if (flow) flow.addEventListener("click", function(ev){
    var b = ev.target.closest && ev.target.closest("[data-mins]");
    if (!b || !flow.contains(b)) return;
    var t = b.dataset.minsfor, v = +b.dataset.mins;
    /* PRESSED AGAIN, IT CLEARS — the only way back to no time once the
       dropdown's blank entry became three buttons (§340). */
    minsWrite(t, v === slotMins(t) ? 0 : v);
    var set = b.closest(".minset"), name = placeLabel(t), cur = slotMins(t);
    if (set) [].forEach.call(set.querySelectorAll("[data-mins]"), function(o){
      var lit = +o.dataset.mins === cur;
      o.classList.toggle("on", lit);
      o.setAttribute("aria-pressed", lit ? "true" : "false");
      o.title = lit ? "Press again to leave " + name + " with no time"
                    : name + " gets " + o.dataset.mins + " minutes";
    });
    var sum = box.querySelector("[data-mfsum]");
    if (sum) sum.innerHTML = masterSumLine(
      MFLOW.pick.reduce(function(a, k){ return a + masterCount(k); }, 0));
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
    /* ── IT OPENS THE SLIDES, NOT THE SHOW (§556) ──────────────────
       Islam: *"after we set the master presentation, we say 'here, manage
       the slides' … and then it takes me to the presentation when I say
       present"*. The first time anybody saw this deck was in front of the
       room; now the flow lands on its own slides, where a slide that
       should not be there can be taken out before it is projected. Play
       is one press from there, and leaving the show comes back here
       (§295). */
    var list = MFLOW.pick.slice();
    closeModal();
    slidesOpenFlow(list);
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
/* ── FULL SCREEN, STRAIGHT AWAY (§556.11) ──────────────────────────────
   The class first, so the bar is gone even where the browser refuses full
   screen (a preview frame, a locked-down kiosk): the deck still fills what
   it has, and Esc still comes back. */
function deckGoFull(){
  var root = document.getElementById("deckroot");
  DECK.direct = true;
  root.classList.add("fs");
  try {
    var p = root.requestFullscreen && root.requestFullscreen();
    if (p && p.catch) p.catch(function(){});
  } catch (e) { /* refused: the class above already did what it can */ }
  deckScale();
}
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
  /* §556.11: which slide the room reached, so the slides come back on it. */
  var reached = toEditor ? slidesWhich(DECK.slides, DECK.i) : null;
  DECK.from = "page";
  DECK.direct = false;
  /* §340: the clock's own interval, stopped with the deck it was drawing. An
     interval left running is the leak §24 is about — it would go on writing
     into a node that has been replaced, twice a second, for the life of the
     tab. */
  if (CLOCKTICK) { clearInterval(CLOCKTICK); CLOCKTICK = null; }
  DECK.clock = null;
  deckTourEnd();   /* §574 */
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
  if (toEditor) slidesResume(reached);
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
      /* §414: a tactic's outcome lines (and the hidden row that keeps the
         stripe) travel WITH the row whose cells span them, never alone. */
      var n = 1;
      while (n < tb.rows.length && /\b(osub|opad)\b/.test(tb.rows[tb.rows.length - n].className)) n++;
      if (n >= tb.rows.length) { s.classList.remove("on"); return; }
      for (var k = 0; k < n; k++) ntb.insertBefore(tb.rows[tb.rows.length - 1], ntb.firstChild);
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
  var r = boxRef(target);
  if (r.kind === "dir") {
    var dd = dirPillar(target);
    if (dd) return pillarCode(topAsUnit(), dd.i);
  }
  var o = r.kind === "fn" ? FUNCTIONS[r.key] : UNITS[target];
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
/* ══ THE CLOCK ON THE REVIEW (§340) ═══════════════════════════════════
   Islam: *"in the presentation module I need to set as an SMO the time of each
   presentation so the timer appears for the presenter."*

   IT IS ON THE SLIDE, AND THAT IS NOT A PREFERENCE. The obvious home is the
   bar beside the counter — and §265 takes the bar off the screen in
   fullscreen, at his own report that it flashed on every click, so a clock
   there is invisible in exactly the state a review is presented in. So it
   sits in the corner of the stage, which means the ROOM reads it too: stated
   before he chose, and chosen.

   INSIDE `.deck`, NEVER IN `.deckstage`. The deck is a fixed 1600x900 box
   that `deckScale()` transforms into whatever room there is, so a child of it
   scales with the slide and holds the corner it was drawn in. A sibling in
   the stage would keep its own size and, in a letterboxed window, float
   outside the slide's edge entirely.

   BOTTOM-RIGHT, measured against what the slides already carry: the footer
   mark is bottom-LEFT on every slide (§52) and a pillar's own two headline
   figures are top-right, so that corner is the one that is empty on every
   slide kind rather than on the one that was looked at. */

/* Under two minutes it turns; the amber is a warning and the red is a fact. */
var CLOCK_NEAR_MS = 2 * 60000;
var CLOCKTICK = null;

/* Which subject is being presented RIGHT NOW. In a flow the stops ARE the
   subjects, so it is the stop the current slide falls in — and on one
   subject's deck the stops are that deck's own SECTIONS (§266.12), which name
   no subject at all, so it is the one target the deck was opened with. Asked
   of `DECK.flow`, which is the same question §266.12 had to teach the title
   bar for the same reason.

   NAMED `clockSubject`, AND THE NAME IS THE WHOLE POINT. It was written as
   `deckSubject()` and this file ALREADY declares `deckSubject(target)` 250
   lines above — the stored subject a target names, which `deckHidePass()` and
   the whole of Manage slides ask. Two declarations of one name, the later
   winning by hoisting (§56.7, §281, §147.4 — the fourth time this project has
   recorded it), so every caller got this one, which ignores the argument: the
   office pressed the eye, `slidesSetHidden` read `!subj` and returned, and
   HIDING A SLIDE SILENTLY STOPPED WORKING across the product.

   It threw nothing and logged nothing, and `node --check` passes on it —
   §56.7's own signature. What found it was `checks/hide-slide.py` going 20
   red, and what made that finding trustworthy was running the check from the
   BASELINE WORKTREE: these neighbours do not honour `SMP_BUILT`, so a
   §303 baseline run from this directory measures this build and says the
   failure is not yours (§334.13, walked into an hour before this comment). */
function clockSubject(){
  /* THE FLOW'S OWN PAGES RUN NO CLOCK (§556.9). Islam: *"it should reset
     when we get to a new direction as we set in the start of the flow"* —
     the cover and the group pages ride inside the first subject's section
     (§554.3), so its time was running from the cover, and by its own first
     slide it no longer read what the flow had set. A subject's time starts
     on that subject's slides. */
  var here = DECK.slides && DECK.slides[DECK.i];
  if (here && here.dataset.flowpart) return null;
  if (DECK.flow && DECK.stops) {
    var k = deckStopAt(DECK.i);
    return k >= 0 ? DECK.stops[k].t : null;
  }
  return DECK.targets && DECK.targets.length === 1 ? DECK.targets[0] : null;
}
/* NO MINUTES, NO CLOCK (§340, agreed): a subject the office left blank draws
   nothing at all, rather than a clock counting down from a number nobody
   chose (§35). */
function clockStart(t){
  var mins = t ? slotMins(t) : 0;
  DECK.clock = mins ? { t:t, mins:mins, ran:0, from:Date.now() } : null;
  clockPaint();
}
/* Called from `deckShow()`, so on EVERY arrow press — and it must only act
   when the subject changes, which is the whole value of it: a flow moving on
   to the next unit starts their time with nobody pressing anything, and
   walking back a slide inside one unit does not restart it. */
function clockFollow(){
  var t = clockSubject();
  if (DECK.clock ? DECK.clock.t === t : !t) return;
  clockStart(t);
}
/* `from` is when the current run began and null means held, so the elapsed
   time is what has already run plus what is running — one field doing both
   jobs, and no interval that has to be stopped and started to pause. */
function clockLeft(){
  var c = DECK.clock;
  if (!c) return 0;
  return c.mins * 60000 - (c.ran + (c.from ? Date.now() - c.from : 0));
}
function clockToggle(){
  var c = DECK.clock;
  if (!c) return;
  if (c.from) { c.ran += Date.now() - c.from; c.from = null; }
  else c.from = Date.now();
  clockPaint();
}
/* THE BAR'S ALONE, deliberately (§340): pause is reversible and a stray press
   costs one press back, where reset throws the elapsed time away and cannot
   be undone — so it is not on the key and not on the clock, which are the two
   surfaces a hand can brush past in fullscreen. */
function clockReset(){
  if (!DECK.clock) return;
  DECK.clock.ran = 0;
  DECK.clock.from = Date.now();
  clockPaint();
}
/* Counting DOWN, and it keeps counting when it runs out: "+2:30", because a
   timer that stops has stopped being useful (§340, agreed). */
function clockWords(ms){
  var over = ms < 0, s = Math.floor((over ? -ms : ms) / 1000);
  return (over ? "+" : "") + Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
}
/* WRITTEN INTO THE NODES, NEVER PAINTED (§63, §71.2): this runs twice a
   second for the length of a review, and a `paint()` here would rebuild the
   platform underneath the deck every time. The parts are toggled rather than
   the element rewritten, so nothing churns under the presenter. */
function clockPaint(){
  var root = document.getElementById("deckroot");
  if (!root) return;
  var c = DECK.clock, el = root.querySelector("#dclock");
  /* A CONTROL WITH NOTHING TO ACT ON IS NOT A CONTROL (§61): with no time set
     for this subject the two bar buttons are not drawn either. */
  [].forEach.call(root.querySelectorAll("[data-dpause], [data-dreset]"), function(b){
    b.hidden = !c;
  });
  if (!el) return;
  if (!c) { el.hidden = true; return; }
  el.hidden = false;
  var left = clockLeft(), held = !c.from, over = left < 0;
  /* THE COLOUR ALWAYS SAYS WHERE YOU ARE AND THE MARK SAYS IT IS HELD — two
     facts, two devices. Paused takes its own quiet grey only where there is
     nothing louder to say; a clock paused while OVER stays red, or holding it
     would hide the one thing the room needs to know. */
  el.classList.toggle("near", !over && left <= CLOCK_NEAR_MS);
  el.classList.toggle("over", over);
  el.classList.toggle("paused", held);
  el.querySelector(".dctime").textContent = clockWords(left);
  el.querySelector(".pausemark").hidden = !held;
  el.querySelector(".dcw").hidden = !held;
  el.title = (held ? "Held at " : "") + clockWords(left) +
    (over ? " over" : " left") + " of " + c.mins + " minutes \u2014 press to " +
    (held ? "start it again" : "pause");
}
/* THE CLOCK IS A `<button>`, which is the whole of how a tap on it reaches
   pause without also advancing the slide: `deckOwnControl()` already exempts
   one from the stage's click and from the swipe (§297, §280), so a tablet —
   which has no `P` key and is what §280 exists for — gets the only pause it
   can reach, for no new rule at all.

   BUILT HERE rather than in the shell, because `.deck`'s innerHTML is
   replaced on every open and anything the shell put inside it would be
   destroyed by the first deck. */
function clockMount(root){
  var el = document.createElement("button");
  el.type = "button"; el.id = "dclock"; el.className = "dclock"; el.hidden = true;
  el.innerHTML = '<span class="pausemark" hidden></span>' +
                 '<span class="dctime"></span>' +
                 '<span class="dcw" hidden>Paused</span>';
  el.addEventListener("click", clockToggle);
  root.querySelector(".deck").appendChild(el);
  /* TWICE A SECOND, not once: at one second the shown figure can be a whole
     second stale, which reads as a clock that skips. Cleared in `closeDeck()`
     — an interval left running outlives the deck it was drawing (§24). */
  if (CLOCKTICK) clearInterval(CLOCKTICK);
  CLOCKTICK = setInterval(clockPaint, 500);
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
  /* §340: a flow crossing into the next unit starts their time by itself. */
  clockFollow();
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
    /* ── A PLAYER IS SOMETHING ON THE STAGE, NOT THE STAGE (§297) ────
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
  /* The keyboard is the presentation's, on every slide (§297). Armed once,
     here, beside the rest of the deck's wiring. */
  videoKeepKeys(root);
  root.querySelector("[data-dnext]").addEventListener("click", function(){ deckShow(DECK.i + 1); });
  root.querySelector("[data-dprev]").addEventListener("click", function(){ deckShow(DECK.i - 1); });
  root.querySelector("[data-dexit]").addEventListener("click", closeDeck);
  /* §340. Both are in the bar, which in fullscreen is not on the screen — so
     pause has two more ways in (the `P` key and the clock itself) and reset
     deliberately has none, because it cannot be undone. */
  root.querySelector("[data-dpause]").addEventListener("click", clockToggle);
  root.querySelector("[data-dreset]").addEventListener("click", clockReset);
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
    /* §556.11: a deck the slides opened full screen has no windowed state
       to fall back to — leaving full screen IS leaving the deck, or one Esc
       lands on the bar Islam asked never to see. */
    if (!document.fullscreenElement && DECK.direct && root.classList.contains("on")) {
      closeDeck();
      return;
    }
    root.classList.toggle("fs", document.fullscreenElement === root || !!DECK.direct);
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
    /* §340: `P` pauses. A letter is this deck's existing idiom rather than a
       new one — `f` and `w` below have answered since §69.7 — and `p` was
       free, checked rather than assumed. It reaches FULLSCREEN, which is the
       whole point: the bar's own button does not. Typing into the cycle note
       never gets here, because the contenteditable branch above returns
       first. */
    if (ev.key === "p" || ev.key === "P") { ev.preventDefault(); clockToggle(); }
    /* §556.11: T pauses and starts, R resets — listed on the slides, which
       is where they are read now the room has no bar. BY THE KEY'S PLACE as
       well as its letter: on an Arabic keyboard the T key sends "ف" and R
       "ق", and Islam's "T is not working" was exactly that. */
    var kc = ev.code || "";
    if (kc === "KeyT" || ev.key === "t" || ev.key === "T") { ev.preventDefault(); clockToggle(); }
    if (kc === "KeyR" || ev.key === "r" || ev.key === "R") { ev.preventDefault(); clockReset(); }
    if (ev.key === "f" || ev.key === "F") root.querySelector("[data-dfs]").click();
    if (ev.key === "w" || ev.key === "W") root.querySelector("[data-dfit]").click();
  });
}

/* ══ A GUIDED TOUR, ON A MADE-UP DIRECTION (§574) ═══════════════════════
   Islam, before El Abd's Q3 review: *"an option … to present a demo
   direction … on clicking in on the presentation it takes us in a tour
   through the slides of this direction … that highlights a part and dim the
   rest with a tool tip to explain what this is"*, naming the key measures
   slide, the tactics slide and the direction's overall performance.

   AND THEN, ON THE FIRST BUILD: *"remove step 14 … start it maybe out of the
   flow … from the options of presentation drop down below the master
   presentation … on a dummy direction with multiple dynamics to explain the
   concept a made up one not an actual one"*. So the first build's picker in
   the Master presentation and its button on a real direction's cover are
   gone, reversed rather than kept beside this (§24): one way in, the
   Presentation menu, under Master presentation, for whoever may open that.

   THE DIRECTION IS MADE UP AND NEVER STORED. Built fresh on every open from
   the lines below and handed to the same builder a real direction's deck
   uses (`dirDeckOf`), so the slides the tour explains are the slides the
   room is about to see — and nothing reaches GROUP, a save, or anybody's
   plan. Its cover says the figures are made up (B3), and its code is EX001,
   never a D-code a real direction could hold.

   "MULTIPLE DYNAMICS" ARE ASKED OF THE PLATFORM, NOT ASSUMED. Which of a
   tactic's quarters make it Completed, Delayed, on track or Not due depends
   on where this client's cycle stands — Raya reviews at H1, El Abd at Q3 — so
   each tactic tries windows until the platform's own `tacticStatusKey()` and
   `tacticDelayed()` give the state it is there to show, and a state the cycle
   cannot hold (nothing is Not due in Q4) is a tactic left out (§45.2). The
   sales figure is set against what is due by now through `elapsedShare()`,
   for the same reason.

   THE TOUR WALKS THE SLIDES THE DECK ALREADY HAS. Each stop names a KIND of
   slide and the part of it to light; a part a slide does not carry is a stop
   not made. The words are the client's: `L()` for measures and tactics, the
   company's own word for a pillar (El Abd's "direction"), and the bands read
   off `BANDS` with their floors (§53.5).

   DRAWN INSIDE `#deckroot`: the deck goes full screen as an ELEMENT, and
   anything outside that element is not on the screen. The onboarding tour's
   spotlight (tour.css), at projector size. Never printed (§305). */
var DTOUR = null;
var EXAMPLE_T = "example:tour";

function exampleDirection(){
  var top = topAsUnit(), u = {};
  for (var k in top) u[k] = top[k];
  u.pillarPrefix = u.pillarCapPrefix = "EX";
  var share = elapsedShare();
  if (share == null) share = Math.max(0.25, Math.min(1, (REVIEW.endsQuarter || 2) / 4));
  var sales = Math.round(120 * share * 0.82 * 10) / 10;
  var p = { id:"example-P1", name:"Growing the Restaurant Business", code:"", kind:"", theme:"",
    sub:"", owner:"Head of Restaurants", custodian:"",
    measures:[
      { id:"example-M1", name:"Restaurant sales", dir:"≥", target:"120 M EGP", compile:"Sum",
        actual:sales + "M EGP",
        note:"Two new branches opened a quarter late, so sales are behind plan." },
      { id:"example-M2", name:"Average spend per guest", dir:"≥", target:"350 EGP",
        compile:"Latest", actual:"368 EGP" },
      { id:"example-M3", name:"Delivery share of sales", dir:"≥", target:"25%",
        compile:"Latest", actual:"11%",
        note:"Our own delivery app slipped; orders still come through third-party apps." },
      { id:"example-M4", name:"Food cost as a share of sales", dir:"≤", target:"32%",
        compile:"Latest", actual:"33%" } ],
    tactics:[] };
  /* Every window of one to four quarters in a row, each tactic trying them
     in its own order until the platform says it shows what it is there for. */
  var wins = [];
  for (var a = 1; a <= 4; a++) for (var b = a; b <= 4; b++) {
    var w = []; for (var q = a; q <= b; q++) w.push(q); wins.push(w);
  }
  var place = function(t, order, ok){
    var ws = wins.slice().sort(order);
    for (var i = 0; i < ws.length; i++) {
      t.q1 = t.q2 = t.q3 = t.q4 = 0;
      ws[i].forEach(function(q){ t["q" + q] = 1; });
      if (ok(t)) return t;
    }
    return null;
  };
  var early = function(x, y){ return x[x.length-1] - y[y.length-1] || y.length - x.length; };
  var late = function(x, y){ return y[y.length-1] - x[x.length-1] || y.length - x.length; };
  var now = function(x, y){ return x[0] - y[0] || y.length - x.length; };
  p.tactics = [
    place({ id:"example-T1", name:"Open two new restaurant branches", owner:"Operations",
            outcome:"Two branches trading", status:"Done", actual:100 }, early,
      function(t){ return tacticStatusKey(t) === "done" && tacticShare(t) === 1; }),
    place({ id:"example-T2", name:"Launch delivery through our own app", owner:"Digital",
            outcome:"App live in all branches", status:"WIP", actual:40,
            note:"Payment gateway approval is pending; launch moved to next quarter." }, late,
      function(t){ return tacticStatusKey(t) === "wip" && tacticDelayed(t); }),
    place({ id:"example-T3", name:"Refresh the menu around best sellers", owner:"Culinary",
            outcome:"New menu in all branches", status:"WIP", actual:0 }, now,
      function(t){
        var sh = tacticShare(t);
        if (!(sh > 0 && sh < 1)) return false;
        t.actual = Math.round(sh * 95);
        return tacticStatusKey(t) === "wip" && !tacticDelayed(t);
      }),
    place({ id:"example-T4", name:"Family-meal campaign for the holidays", owner:"Marketing",
            outcome:"Campaign in market", status:"", actual:0 }, late,
      function(t){ return tacticStatusKey(t) === "notdue"; })
  ].filter(Boolean);
  return { u:u, p:p };
}
function exampleDeckHtml(){
  var x = exampleDirection();
  DECK_EXAMPLE = true;
  try {
    return dirDeckOf(x.u, x.p, 0,
      { aside:"An example to show how the slides read &middot; the figures are made up" });
  } finally { DECK_EXAMPLE = false; }
}
/* The Presentation menu's Guided tour: the example, full screen, the tour
   already on its first stop — one press from the menu to the room. Asked
   the office's rule at the press, never trusted from the menu (§48.2). */
function exampleTourOpen(){
  if (!SMPRules.mayMasterPresent(world(), viewer())) return;
  openDeckWith("<b>Guided tour</b> &middot; an example", [EXAMPLE_T]);
  deckGoFull();
  requestAnimationFrame(function(){ deckTourStart(); });
}

function deckTourOwn(){
  return (DECK.slides || []).filter(function(s){
    return s.dataset.subject === EXAMPLE_T;
  });
}
function deckTourBands(){
  var bs = BANDS.bands;
  return '<span class="dtbands">' + bs.map(function(x, i){
    var rng = i === 0 ? x.floor + "% and above"
      : i === bs.length - 1 ? "below " + bs[i-1].floor + "%"
      : x.floor + "–" + (bs[i-1].floor - 1) + "%";
    return '<span><i style="background:var(--' + esc(x.key) + ')"></i>' +
      esc(x.label) + ' <em>' + rng + '</em></span>';
  }).join("") + '</span>';
}
/* A table column, head to last row — so a column is lit whole, whatever a
   tactic's several outcome lines do to the rows under it (§414). */
function deckTourCol(s, test){
  var ths = [].slice.call(s.querySelectorAll("table thead th"));
  var hit = ths.filter(function(th, i){
    return test(th.textContent.trim().toLowerCase(), i);
  });
  if (!hit.length) return null;
  var tb = hit[0].closest("table").getBoundingClientRect();
  var a = hit[0].getBoundingClientRect(), z = hit[hit.length - 1].getBoundingClientRect();
  return { left:a.left, top:a.top, right:z.right, bottom:tb.bottom };
}
/* The extent of an element's text, for `deckTourBox` — which takes a Range
   as readily as an element, since both answer getBoundingClientRect. */
function deckTourInk(e){
  if (!e) return null;
  var r = document.createRange();
  r.selectNodeContents(e);
  return r;
}
function deckTourBox(els){
  els = els.filter(Boolean);
  if (!els.length) return null;
  var r = null;
  els.forEach(function(e){
    var b = e.getBoundingClientRect();
    if (!b.width && !b.height) return;
    r = r ? { left:Math.min(r.left, b.left), top:Math.min(r.top, b.top),
              right:Math.max(r.right, b.right), bottom:Math.max(r.bottom, b.bottom) }
          : { left:b.left, top:b.top, right:b.right, bottom:b.bottom };
  });
  return r;
}
/* The key measure furthest behind: the first in the lowest band the slide
   paints, else the first carrying a note. */
function deckTourRow(s){
  var rows = [].slice.call(s.querySelectorAll("table tbody tr"));
  var by = function(sel){
    return rows.filter(function(r){ return r.querySelector(sel); })[0];
  };
  return by("td.dprog.bad") || by("td.dprog.warn") || by("td.dprog.attn") ||
    by("td.dnote:not(.empty)") || null;
}
function deckTourNoun(){
  return esc(LTraw("group", "pillar", "one").toLowerCase());
}
function deckTourStops(){
  var M = L("measure"), T = L("tactic"), T1 = esc(labelWord("tactic", "group")).toLowerCase();
  var noun = deckTourNoun();
  var isM = function(s){ return /M$/.test(s.dataset.split || "") && !s.dataset.cont; };
  var isT = function(s){ return /T$/.test(s.dataset.split || "") && !s.dataset.cont; };
  var eq = function(w){ return function(x){ return x === w; }; };
  /* §574.2: EACH TABLE OPENS AND CLOSES ON THE WHOLE SLIDE, CLEAR. Islam:
     *"start the key measure tour with the full view all clear first and then
     the tour appears … and finish after the note with the full view clear as
     well showing everything. same for the tactics"*. A clear stop lights
     nothing and draws no card: the room sees the slide as it is presented,
     and the next press brings the spotlight in. */
  /* §574.5: AND THE CLEAR VIEW SAYS WHICH SLIDE IT IS, AND WHAT IT IS
     ABOUT. Islam: *"in the whole slide in the key measures or the tactics
     can we highlight somehow that we are in the measures and the tactics
     slides so people can be aware of the difference?"* — shown two ways and
     choosing both, on the clear views only: the slide's title ringed with
     its name in gold, and a label in the corner naming the slide and the
     difference, results against work. Nothing is dimmed. */
  var clear = function(on, mark){ return { on:on, clear:true, mark:mark }; };
  var markM = [M, "The results we committed to"], markT = [T, "The work that delivers them"];
  return [
    { on:function(s){ return s.classList.contains("d-cover") && !s.classList.contains("d-thanks"); },
      /* §574.4: the WORDS, not the blocks they sit in — a heading is as wide
         as the slide, so lighting its box left the bigger card nowhere to
         stand but on top of it. A Range measures the text itself. */
      at:function(s){ return deckTourBox([s.querySelector(".dcovermark"), deckTourInk(s.querySelector(".eyebrow")),
                       deckTourInk(s.querySelector("h1")), s.querySelector(".coverrule")]
                       .concat([].slice.call(s.querySelectorAll(".coversub")).map(deckTourInk))); },
      h:"One " + noun + ", from cover to close",
      b:"Every " + noun + " in today's review is presented the same way: its " + M +
        ", its " + T + ", and where it stands overall. This made-up one shows how to read them." },

    clear(isM, markM),
    { on:isM, at:function(s){ return deckTourCol(s, function(x, i){ return i === 1; }); },
      h:M,
      b:"The results this " + noun + " committed to for the year, one to a row." },
    { on:isM, at:function(s){ return deckTourCol(s, eq("annual target")); },
      h:"Annual target",
      b:"What the plan set for the whole year." },
    { on:isM, at:function(s){ return deckTourCol(s, eq("actual")); },
      h:"Actual",
      b:"What was reported for this cycle. Under it, in grey, what was <b>due</b> by " +
        "this point in the year, which is what the figure is judged against." },
    { on:isM, at:function(s){ return deckTourCol(s, eq("progress")); },
      h:"Progress",
      b:"The actual against what was due, in the colour of its band:" + deckTourBands() },
    { on:isM, at:function(s){ return deckTourCol(s, eq("note")); },
      h:"Note",
      b:"The owner's word on the figure: why it is where it is, and what happens next." },
    /* §574.3: AND ONE LINE READ ACROSS, as the tactics light their delayed
       row — Islam: *"for the measures let's highlight a whole line like we
       did in the tactics after the note part"*. The line furthest behind,
       so the note has something to explain. */
    { on:isM, at:function(s){ var r = deckTourRow(s); return r ? deckTourBox([r]) : null; },
      h:function(s){
        var r = deckTourRow(s), n = r && r.querySelector("td.lead");
        return n ? esc(n.textContent.trim()) : "One line, read across"; },
      b:"One line read across: the target, what was reported against what was due, " +
        "the progress in its band, and the owner's note on why." },
    clear(isM, markM),

    clear(isT, markT),
    { on:isT, at:function(s){ return deckTourCol(s, function(x, i){ return i === 1 || i === 2; }); },
      h:T,
      b:"The work that delivers the " + M + ": each " + T1 +
        " with the outcome it is measured by." },
    { on:isT, at:function(s){ return deckTourCol(s, eq("quarters")); },
      h:"Quarters",
      b:"The quarters this work is planned to run in." },
    { on:isT, at:function(s){ return deckTourCol(s, eq("status")); },
      h:"Status",
      b:"Where the work stands, as its owner reported it: " +
        [TACTIC_WORDS.done, TACTIC_WORDS.wip, TACTIC_WORDS.todo, TACTIC_WORDS.notdue]
          .map(esc).join(", ") + "." },
    /* §574.2: YTD actual and Progress before Delayed (Islam). */
    { on:isT, at:function(s){ return deckTourCol(s, function(x){
        return x === "ytd actual" || x === "progress"; }); },
      h:"YTD actual and Progress",
      b:"What has been delivered so far against what was due by now, and the progress " +
        "that makes, in the same colours as the " + M + "." },
    { on:isT, at:function(s){
        var late = s.querySelector(".dlate");
        return late ? deckTourBox([late.closest("tr")]) : null; },
      h:"Delayed",
      b:"A red <b>DELAYED</b> means this " + T1 + " has fallen behind its plan: its window " +
        "has passed unfinished, or its first quarter went by with nothing delivered." },
    clear(isT, markT),

    { on:function(s){ return s.classList.contains("d-head"); },
      at:function(s){ return deckTourBox([s.querySelectorAll(".headcell")[0]]); },
      h:"Where it stands: " + M,
      b:"How the results are doing: every one of the " + M +
        " against its target, in one figure." },
    /* §574: and it ends here. Islam struck the stop on the line under the
       two readings ("remove step 14"). */
    { on:function(s){ return s.classList.contains("d-head"); },
      at:function(s){ return deckTourBox([s.querySelectorAll(".headcell")[1]]); },
      h:"Where it stands: Execution",
      b:"Whether the work is landing on time: what the " + T +
        " have delivered against what was planned by now." }
  ];
}
function deckTourStart(){
  var root = document.getElementById("deckroot");
  var own = deckTourOwn();
  if (!root.classList.contains("on") || !own.length) return;
  deckTourEnd();
  /* Only the stops whose part is on the slide. Asked with the slide SHOWN,
     because a slide behind `display:none` measures as nothing (§69). */
  var keep = [];
  deckTourStops().forEach(function(st){
    var s = own.filter(st.on)[0];
    if (!s) return;
    var at = DECK.slides.indexOf(s);
    deckShow(at);
    if (st.clear || st.at(s)) keep.push({ at:at, s:s, st:st });
  });
  if (!keep.length) { deckShow(0); return; }
  keep.push({ at:keep[keep.length - 1].at, end:true,
    st:{ h:"That is how every " + deckTourNoun() + " reads",
         b:"Every one in today's review follows this pattern. Finish takes you back to the platform." } });
  DTOUR = { stops:keep, i:0 };
  root.insertAdjacentHTML("beforeend",
    '<div class="dtour" data-dtour>' +
      '<svg class="dtsvg" aria-hidden="true"><defs><mask id="dtmask">' +
        '<rect x="0" y="0" width="100%" height="100%" fill="#fff"/>' +
        '<rect class="dthole" rx="10" fill="#000"/></mask></defs>' +
        '<rect class="dtshade" x="0" y="0" width="100%" height="100%" mask="url(#dtmask)"/>' +
        '<rect class="dtring" rx="10"/></svg>' +
      '<div class="dtlabel" aria-live="polite"></div>' +
      '<div class="dtcard" role="dialog" aria-live="polite">' +
        '<div class="dttop"><span class="dtstep"></span>' +
          '<button type="button" class="dtx" data-dtend title="End the tour (G)" aria-label="End the tour">&times;</button></div>' +
        '<h3></h3><div class="dtbody"></div>' +
        '<div class="dtfoot"><button type="button" class="dtback" data-dtback>Back</button>' +
          '<button type="button" class="dtnext" data-dtnext>Next</button></div>' +
      '</div></div>');
  var dock = root.querySelector("[data-dtour]");
  /* EVERY PRESS ON THE TOUR IS THE TOUR'S. The deck advances on a click and
     a swipe in full screen (§265, §280); left to bubble, one press would move
     the tour AND the deck under it. A press on the dim is Next, which is
     what a presenter's hand does. */
  ["pointerdown", "pointerup"].forEach(function(n){
    dock.addEventListener(n, function(ev){ ev.stopPropagation(); });
  });
  dock.addEventListener("click", function(ev){
    ev.stopPropagation();
    if (ev.target.closest("[data-dtend]")) return deckTourEnd();
    if (ev.target.closest("[data-dtback]")) return deckTourGo(DTOUR.i - 1);
    if (ev.target.closest(".dtcard") && !ev.target.closest("[data-dtnext]")) return;
    deckTourGo(DTOUR.i + 1);
  });
  deckTourGo(0);
}
function deckTourGo(n){
  if (!DTOUR) return;
  if (n < 0) n = 0;
  /* Past the closing card is past the example: it exists for the tour, so
     the deck closes with it and the platform is where Finish lands. */
  if (n >= DTOUR.stops.length) { deckTourEnd(); closeDeck(); return; }
  DTOUR.i = n;
  var x = DTOUR.stops[n];
  if (DECK.i !== x.at) deckShow(x.at);
  requestAnimationFrame(deckTourDraw);
}
function deckTourDraw(){
  if (!DTOUR) return;
  var root = document.getElementById("deckroot");
  var dock = root.querySelector("[data-dtour]");
  if (!dock) return;
  var x = DTOUR.stops[DTOUR.i], st = x.st;
  var card = dock.querySelector(".dtcard");
  dock.classList.toggle("dtclear", !!st.clear);
  deckTourUnmark();
  dock.classList.toggle("dtmark", !!(st.clear && st.mark && deckTourMark(dock, x.s, st.mark)));
  if (st.clear) return;
  /* The count is of the parts lit — a clear view is not a step to count. */
  var lit = DTOUR.stops.filter(function(y){ return !y.st.clear && !y.end; });
  card.querySelector(".dtstep").textContent = x.end ? "Guided tour" :
    (lit.indexOf(x) + 1) + " of " + lit.length;
  card.querySelector("h3").innerHTML = typeof st.h === "function" ? st.h(x.s) : st.h;
  card.querySelector(".dtbody").innerHTML = st.b;
  card.querySelector("[data-dtback]").hidden = DTOUR.i === 0;
  card.querySelector("[data-dtnext]").textContent = x.end ? "Finish" : "Next";
  var r = x.end ? null : st.at(x.s);
  var hole = dock.querySelector(".dthole"), ring = dock.querySelector(".dtring");
  card.classList.toggle("dtcentre", !r);
  if (!r) {
    [hole, ring].forEach(function(e){ e.setAttribute("width", 0); e.setAttribute("height", 0); });
    card.style.left = card.style.top = "";
    return;
  }
  var pad = 10;
  var hx = r.left - pad, hy = r.top - pad, hw = r.right - r.left + pad * 2, hh = r.bottom - r.top + pad * 2;
  [hole, ring].forEach(function(e){
    e.setAttribute("x", hx); e.setAttribute("y", hy);
    e.setAttribute("width", hw); e.setAttribute("height", hh);
  });
  /* The card where there is room: under the part, then over it, then
     beside it — and failing all three, in the corner of the screen, never
     over the part it is explaining. */
  var W = innerWidth, H = innerHeight, gap = 18;
  var cw = card.offsetWidth, ch = card.offsetHeight;
  var left, top;
  if (hy + hh + gap + ch <= H - 12) { top = hy + hh + gap; left = hx; }
  else if (hy - gap - ch >= 12) { top = hy - gap - ch; left = hx; }
  else if (hx + hw + gap + cw <= W - 12) { left = hx + hw + gap; top = hy; }
  else if (hx - gap - cw >= 12) { left = hx - gap - cw; top = hy; }
  else { left = W - cw - 24; top = H - ch - 24; }
  card.style.left = Math.max(12, Math.min(left, W - cw - 12)) + "px";
  card.style.top = Math.max(12, Math.min(top, H - ch - 12)) + "px";
}
function deckTourEnd(){
  var root = document.getElementById("deckroot");
  var dock = root && root.querySelector("[data-dtour]");
  if (dock) dock.remove();
  deckTourUnmark();
  DTOUR = null;
}
/* §574.5: the clear view's mark — the title's words ringed, the slide's own
   name in gold (a class on the slide, taken off as the stop is left), and
   the label at the table's right edge, level with the title. */
function deckTourMark(dock, s, words){
  var h = s.querySelector(".dphdr h2"), t = s.querySelector("table");
  if (!h || !t) return false;
  var b = deckTourInk(h).getBoundingClientRect(), tb = t.getBoundingClientRect(), pad = 12;
  var ring = dock.querySelector(".dtring");
  ring.setAttribute("x", b.left - pad); ring.setAttribute("y", b.top - pad);
  ring.setAttribute("width", b.width + pad * 2); ring.setAttribute("height", b.height + pad * 2);
  var lab = dock.querySelector(".dtlabel");
  lab.innerHTML = '<b>' + words[0] + '</b><span>' + esc(words[1]) + '</span>';
  lab.style.right = Math.max(12, innerWidth - tb.right) + "px";
  lab.style.top = (b.top + b.height / 2) + "px";
  s.classList.add("dtmarked");
  return true;
}
function deckTourUnmark(){
  [].forEach.call(document.querySelectorAll("#deckroot .dtmarked"), function(e){
    e.classList.remove("dtmarked");
  });
}
/* THE KEYBOARD IS THE TOUR'S WHILE IT RUNS — asked BEFORE the deck's own
   listener (the capture phase), so Next lights the next part instead of
   turning the slide out from under it. Escape is left alone: in full screen
   the browser takes it first, and leaving full screen leaves the deck
   (§556.11), so inside the deck the tour ends on `G` or its ×. `G` starts it
   again, on the example only. */
addEventListener("keydown", function(ev){
  var root = document.getElementById("deckroot");
  if (!root || !root.classList.contains("on")) return;
  var kc = ev.code || "";
  var g = kc === "KeyG" || ev.key === "g" || ev.key === "G";
  if (!DTOUR) {
    if (g && !ev.target.isContentEditable && deckTourOwn().length) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      deckTourStart();
    }
    return;
  }
  var fwd = { ArrowRight:1, ArrowDown:1, PageDown:1, " ":1 };
  var back = { ArrowLeft:1, ArrowUp:1, PageUp:1 };
  if (fwd[ev.key]) deckTourGo(DTOUR.i + 1);
  else if (back[ev.key]) deckTourGo(DTOUR.i - 1);
  else if (g || ev.key === "Escape") deckTourEnd();
  else return;
  ev.preventDefault(); ev.stopImmediatePropagation();
}, true);
addEventListener("resize", function(){ if (DTOUR) requestAnimationFrame(deckTourDraw); });
addEventListener("fullscreenchange", function(){ if (DTOUR) requestAnimationFrame(deckTourDraw); });
