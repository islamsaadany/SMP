/* ── CONFIGURATION SCREENS ───────────────────────────────────────────────
   Labels · Roles & access · and the factor editor that extends Weighting.
   ─────────────────────────────────────────────────────────────────────── */

/* ── THE TENANT'S LABEL COMES OUT CLEANED (2026-09-01 security sweep) ────
   A label (the word for Pillar / Measure / Aspiration …) is editable text and
   was rendered RAW at ~43 sites — and, through recipeText(), spliced raw into
   the knowledge base. A label of `<img src=x onerror=…>` therefore ran as code
   for every reader in the tenant. Escaping HERE fixes both at once, because
   every reader goes through L(). Safe: L()'s 88 uses are all display-only
   (verified — no comparison, key, or data-attribute read back), and a normal
   label has no special characters, so cleaning it changes nothing on screen. */
function L(key, scope){
  var e = LABELS.entries.filter(function(x){ return x.key === key; })[0];
  if (!e) return esc(key);
  return esc((scope === "group" ? e.group : e.bu) || e.internal);
}

/* ── Labels ─────────────────────────────────────────────────────────── */
function renderLabels(){
  var editable = grant("c_labels") === "edit";

  var rows = LABELS.entries.map(function(e, i){
    var cell = function(which){
      var val = e[which];
      if (val === "—") return '<td><span class="pill none">Not held</span></td>';
      return '<td>' + (editable
        ? '<input class="lbl" data-lbl="' + i + '" data-scope="' + which + '" value="' + esc(val) + '" aria-label="' + esc(e.internal) + ' label at ' + which + ' level" />'
        : '<span class="mono">' + esc(val) + '</span>') + '</td>';
    };
    return '<tr><td><b>' + esc(e.internal) + '</b><span class="why">' + esc(e.note) + '</span></td>' +
      cell("group") + cell("bu") + '</tr>';
  }).join("");

  /* Two entities sharing one display label would render two different things
     under one word on the same screen. Caught here, not in a client demo. */
  var seen = {}, clashes = [];
  LABELS.entries.forEach(function(e){
    ["group","bu"].forEach(function(s){
      var v = (e[s] || "").toLowerCase();
      if (!v || v === "—") return;
      if (seen[s + "|" + v]) clashes.push(e[s]);
      seen[s + "|" + v] = true;
    });
  });

  var warn = clashes.length
    ? '<div class="note bad-note"><b>Label collision.</b> <span class="mono">' + esc(clashes[0]) +
      '</span> is in use by two entities at the same level. Saving is blocked until one of them changes &mdash; ' +
      'two different objects rendering under one word on the same screen is not recoverable by the reader.</div>'
    /* The "all clear" note went to the knowledge base with the rest of the
       explanation (§30.4). A collision still shouts, because that is not an
       explanation - it is a state that blocks saving and has to be seen. */
    : '';

  return section("", "Terminology", null,
      '<div class="cfg"><table><thead><tr>' +
      '<th style="width:34%">Internal name<span class="why">The contract. Never changes.</span></th>' +
      '<th style="width:33%">Display at group level</th>' +
      '<th style="width:33%">Display at business unit level</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' + warn);
}

/* MONOCHROME, AND INSIDE THE BOX (Islam, 2026-08-22: "make the icons of view
   and edit in place and make the eye icon colorless like the pen").

   The eye was `&#128065;` — U+1F441, which every platform renders as a COLOUR
   EMOJI. Two faults follow from that one fact and both were on screen. A
   colour emoji ignores its element's `color`, so a lit cell painted the glyph
   in the emoji's own browns on a navy ground instead of inverting; and at
   emoji metrics it overhangs a 26×24 button, which is why it appeared to sit
   BELOW its box rather than in it. The pen (`&#9998;`, U+270E) is a text glyph
   and behaved — which is exactly why the pair looked mismatched.

   Two inline SVGs settle both at once: they take `currentColor`, so the lit
   state inverts like every other control here, and the RULE sizes them rather
   than a font nobody chose. Used by the buttons AND by the legend, so the
   legend cannot drift from the thing it explains. */
var ICON_EYE = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M1.7 10S4.8 5 10 5s8.3 5 8.3 5-3.1 5-8.3 5-8.3-5-8.3-5z" fill="none" ' +
    'stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<circle cx="10" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
var ICON_PEN = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M13.4 3.6l3 3L7.9 15.1l-3.9.9.9-3.9z" fill="none" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
/* §145: the fill-the-gaps mark — a pen over a dashed line, writing into the
   blank. The same pen, lifted, with the line it writes on. */
var ICON_FILL = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M12.6 3.4l3 3-7 7-3.6.6.6-3.6z" fill="none" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<path d="M3 17.4h14" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-dasharray="2 3"/></svg>';

/* ── Roles & access ─────────────────────────────────────────────────── */
function stateCell(roleKey, areaKey, editable, disabled){
  /* grantFor(), never ACCESS[role][area]. A tenant carried across from an
     earlier version has an EMPTY access map by design — the rows were rebuilt
     rather than migrated (§33, §37) — so a direct read was undefined[key] and
     the whole page threw. The cell shows what the platform would actually
     answer, which is the shipped default until somebody changes it. */
  var v = grantFor(roleKey, areaKey);
  /* A cell that cannot come up is drawn as a dash rather than as "none". The
     group CEO owns every unit, so "other business units" is an empty set for
     them: saying "none" there would read as a denial of something, when there
     is no something. */
  if (disabled) {
    return '<td class="ac"><span class="why" style="margin:0" title="' + esc(disabled) +
      '">&mdash;</span></td>';
  }
  if (!editable) {
    return '<td class="ac"><span class="st st-' + v + '">' + v + '</span></td>';
  }
  /* TWO buttons, not three. Islam: "no need for the none box that's the
     default no need to grow the matrix" — and he is right that none is not a
     third thing you choose, it is the absence of the other two. So each button
     is a TOGGLE: pressing the lit one turns it off and the cell falls back to
     none. The state each press produces is worked out here rather than in the
     handler, so the click still says only "set this cell to this". */
  /* §145: THE TWO STRATEGY HALVES CARRY A THIRD STATE — Fill gaps — between
     view and edit. Only those two cells: everywhere else the state would
     grant nothing (`mayFillPage` answers only for the strategy pages), and
     a toggle that does nothing is decoration (§42). */
  var states = (areaKey === "a_unit_own_strat" || areaKey === "a_fn_own_strat")
    ? ["view", "fill", "edit"] : ["view", "edit"];
  var WORD = { view: "May read",
               fill: "May fill what’s empty — Missing values only, and they count straight away",
               edit: "May read and change" };
  var ICON = { view: ICON_EYE, fill: ICON_FILL, edit: ICON_PEN };
  var opts = states.map(function(o){
    var on = o === v;
    /* `st-view`, NOT `view` (§65). A class name is one global namespace, and
       `.view` is the PAGE REGION — `.view { padding-top: var(--rail-gap) }` —
       so the lit eye was given 22px of padding inside a 24px box and its icon
       sat 11px below the middle of its own button. Nothing was wrong with the
       button's own rules; it was wearing somebody else's. §56.7 in CSS instead
       of JS: a one-word modifier will eventually collide with a one-word
       component, and the collision is silent because both rules are valid. */
    return '<button type="button" class="stbtn' + (on ? " on st-" + o : "") + '" data-ac="' +
      roleKey + '|' + areaKey + '|' + (on ? "none" : o) + '" title="' +
      (on ? "Turn off — leaves no access" : WORD[o]) +
      '" aria-label="' + (on ? "turn off " + o : o) + '" aria-pressed="' + on + '">' +
      ICON[o] + '</button>';
  }).join("");
  /* Nothing lit IS the answer, so the cell says so rather than looking
     unanswered — a blank cell in a permissions table reads as "not filled in",
     which is the one thing it must never be mistaken for. */
  return '<td class="ac"><span class="stset' + (v === "none" ? " off" : "") + '">' +
    opts + '</span></td>';
}

/* ── Roles &amp; access (§37) ─────────────────────────────────────────
   Islam: *"we just need the roles on the left and the types of pages they
   might see/edit on the horizontal access."*

   Seven roles down, seven areas across. Forty-nine cells, on one screen,
   in place of the 525 controls the page carried before. */
function renderAccess(){
  /* ── THE MATRIX IS THE SUPER USER'S (§89) ─────────────────────────
     A grant cannot express this: the SMO team holds `a_setup` at edit, which
     is what lets them run every other Setup page — and editing THIS page is
     editing who may edit this page, so anybody who can is a Super user
     whatever their row says. The page stays READABLE to them: knowing what
     everyone may do is part of running the office, and §37's rules are shown
     to everyone who can open the page. */
  var editable = grant("c_access") === "edit" && mayEditAccess();

  /* Whether an area can come up at all for a role. Only the own/other pair
     ever collapses, and only upwards: somebody who owns everything has no
     "other", and somebody who owns no unit has no "own". Returning a REASON
     rather than a boolean, because the cell shows it on hover. */
  function notApplicable(roleKey, areaKey){
    /* ASKED OF THE SHARED RULE, NOT OF A LIST REPEATED HERE (§175). This
       carried its own copy of "super or gceo", and the copy is why the SMO
       team's row was wrong in both directions at once: `roleOwns()` did not
       count them as owning anything, and this did not mark their other
       columns either, so four cells did nothing and nobody could see it. */
    if (SMPRules.ownsEveryPlace(roleKey) &&
        (areaKey === "a_unit_other" || areaKey === "a_fn_other")) {
      return "Every unit and function is theirs, so there is no “other”.";
    }
    /* The split halves collapse exactly as their whole did (§117): no unit
       means neither half of the unit pair can come up. */
    if (roleKey === "fnhead" && (areaKey === "a_unit_own" || areaKey === "a_unit_own_strat")) {
      return "A function head holds no business unit.";
    }
    if (roleKey === "cceo" && (areaKey === "a_fn_own" || areaKey === "a_fn_own_strat")) {
      return "A company CEO holds no supporting function.";
    }
    /* ── TWO MORE THAT COULD NEVER COME UP (§174) ─────────────────────
       Islam: *"a project owner has options to edit or fill in a business
       unit. Business units have no project owners, they have only pillar
       owners."* Correct, and it is the derivation that says so rather than a
       convention: `personRoles()` mints `powner` only from
       `capabilities[].projects`, and a capability belongs to a FUNCTION
       (`c.fn`) — so the role is only ever held at `fn:<key>` and a business
       unit can never be the one this person holds.

       The OTHER columns stay, which is the same reading `fnhead` has had
       since §117: a project owner holds no unit, so every unit is "other" to
       them, and that column is how a tenant would let them read one.

       The defaults were already `none` here, so nothing anybody has is
       changing — what goes is being OFFERED a choice with nothing behind it.
       An option that cannot do anything is worse than an absent one: it reads
       as a decision somebody forgot to make. */
    if (roleKey === "powner" && (areaKey === "a_unit_own" || areaKey === "a_unit_own_strat")) {
      return "A project owner holds no business unit — projects belong to a " +
             "supporting function's capabilities.";
    }
    /* AND THE MIRROR, WHICH THE SAME LOOK FOUND: a BU owner's scope is a unit
       and `roleWheres()` offers only units, so "own supporting function" can
       never be theirs either — `fnhead`'s exclusion above with the sides
       swapped, missed when that one was written. */
    if (roleKey === "owner" && (areaKey === "a_fn_own" || areaKey === "a_fn_own_strat")) {
      return "A business unit owner holds no supporting function.";
    }
    /* DELIBERATELY NOT plowner × own function. Islam expected the mirror
       ("same for pillar owner in the function") and the derivation disagrees:
       `personRoles()` mints `plowner` from a unit's `items` AND from a
       function whose `format` is "pillars" (§59) — a supporting function that
       plans in pillars has pillars, and its pillar owners are derived by the
       same line as a unit's. Removing that cell would close a real
       configuration this tenant already has. Left, and said out loud rather
       than quietly obeyed. */
    return null;
  }

  /* THE HEADER SAYS WHAT THE COLUMN IS; HOVER SAYS WHAT IS IN IT
     (Islam, 2026-08-22: "remove all the descriptions from the headers and just
     make it appear on hovering"). The notes are lists — "Open, chase and
     close · Import · Archived plans · Focus measures" — and seven of them
     stacked under seven labels made the HEAD of a 49-cell table taller than
     its body. The same answer the role column already reached in §37: the
     sentence is on hover, and the column keeps its name. */
  /* ── TWO HEADER ROWS, BECAUSE TWO COLUMNS SHARE A NAME (§117) ──────
     The own pair split into Strategy | Reporting halves, and the pair's name
     is written ONCE above them rather than twice into them. Built off the
     `pair`/`col` fields the AREAS entries carry — the header is derived from
     the same list the cells walk, so a column cannot appear in one and not
     the other. Entries without a pair span both rows. Consecutive same-pair
     entries group; the AREAS order is the column order, as it always was. */
  var headTop = '<tr><th style="width:17%" rowspan="2">Role</th>', headSub = "<tr>";
  var hi = 0;
  while (hi < AREAS.length) {
    var ha = AREAS[hi];
    if (!ha.pair) {
      /* THE SHORT WORD IN THE COLUMN, THE FULL ONE ON THE HOVER (§174), so
         nothing is lost by abbreviating — the heading says "Other Func." and
         hovering it says which functions and what is in the column. */
      headTop += '<th class="ac" rowspan="2" title="' +
        esc(ha.label + " — " + ha.note) + '">' + esc(ha.short || ha.label) + '</th>';
      hi++;
      continue;
    }
    var span = 0;
    while (hi + span < AREAS.length && AREAS[hi + span].pair === ha.pair) span++;
    headTop += '<th class="ac acpair" colspan="' + span + '" title="' + esc(ha.pair) +
      '">' + esc(ha.short || ha.pair) + '</th>';
    for (var hj = 0; hj < span; hj++) {
      var hb = AREAS[hi + hj];
      headSub += '<th class="ac achalf" title="' + esc(hb.label + " — " + hb.note) +
        '">' + esc(hb.col) + '</th>';
    }
    hi += span;
  }
  var head = headTop + "</tr>" + headSub + "</tr>";

  /* ── THE LAST ROW IS NOT A ROLE (§93) ─────────────────────────────
     Employee stopped being one: nobody grants it, the × could never take it
     off, and it was drawn as a chip beside Business unit owner claiming
     somebody held something they did not. What it decided is still a real
     question — what somebody on the register with NO role may open — so it is
     still a row here, labelled as the state it is.

     It has to stay editable. A client who wants people with no role to see
     nothing sets this row to none and can see that they have; a floor nobody
     can reach is a rule hiding as a default. */
  var MATRIX_ROWS = ROLES.concat([{
    key: SMPRules.NO_ROLE, name: "Everyone else", scope: "unit", floor: true,
    note: "Not a role — what somebody on the register who holds no role may " +
          "open. Most of the register, on a tenant of any size." }]);

  var body = MATRIX_ROWS.map(function(r){
    var n = r.floor
      ? PEOPLE.filter(function(p){
          return personActive(p) && personAt(p) && !personRoleKeys(p).length; }).length
      : PEOPLE.filter(function(p){ return personRoleKeys(p).indexOf(r.key) > -1; }).length;
    /* Two lines, never more. The role's description is a sentence, and a
       sentence in a 19% column wraps to eight lines and makes every row of a
       49-cell table a hundred pixels tall — the exact fault this page was
       rebuilt to remove. It is on hover instead. */
    return '<tr' + (r.floor ? ' class="floorrow"' : '') + '>' +
      '<td class="rolecell" title="' + esc(r.note) + '"><b>' + esc(r.name) + '</b>' +
        '<span class="why">' +
        (n ? plural(n, "person").replace("persons", "people") : "nobody yet") +
        '</span></td>' +
      AREAS.map(function(a){
        return stateCell(r.key, a.key, editable, notApplicable(r.key, a.key));
      }).join("") + '</tr>';
  }).join("");

  return section("", "Roles & access",
      null,
      '<div class="cfg acgrid"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="chart-legend" style="margin-top:12px">' +
        '<span><i class="st st-view">' + ICON_EYE + '</i> may read</span>' +
        '<span><i class="st st-fill">' + ICON_FILL + '</i> may fill what&rsquo;s empty (Strategy halves only)</span>' +
        '<span><i class="st st-edit">' + ICON_PEN + '</i> may read and change</span>' +
        '<span><i class="st st-none">neither</i> no access, page hidden</span>' +
        '<span><i class="st" style="background:none;color:var(--none);border:1px dashed var(--none)">&mdash;</i> cannot come up for this role</span>' +
      '</div>');
}
/* THE TWO ESSAYS ARE GONE FROM THE PAGE (Islam, 2026-08-22, on this table:
   "the design is poor"). "Own is not a setting" and "Three things are rules"
   ran to twelve lines under a table of 49 cells, and neither is something you
   read while setting a grant — they are what the page MEANS, which is what the
   knowledge base is for (§30). Both are now `c_access` in pageinfo.js, whole
   and reachable by everyone, and this page ends where the table does. */

/* ── The factor editor, appended to the Weighting page ──────────────── */
/* The previous cycle's split, carried so a factor change can be read against
   what it replaces (§6). A tenant in its first cycle has no previous one — the
   column then says so and every factor reads "new this cycle", rather than
   showing deltas against a year that never happened. */
function priorFactors(){
  return (PRIOR_CYCLE && PRIOR_CYCLE.factors) || [];
}
function priorLabel(){
  if (!priorFactors().length) return "Previous cycle";
  return (PRIOR_CYCLE.year ? PRIOR_CYCLE.year + " " : "") + "cycle";
}

function renderFactorEditor(){
  var w = GROUP.weighting;
  var editable = grant("g_weight") === "edit" && EDITING.factors;
  var total = w.factors.reduce(function(a, f){ return a + f.weight; }, 0);

  var rows = w.factors.map(function(f, i){
    var t = FACTOR_TYPES[f.kind];
    return '<tr><td><b>' + esc(f.name) + '</b><span class="why">' + esc(f.basis) + '</span></td>' +
      '<td><span class="pill kind">' + t.label + '</span><span class="why">' + t.note + '</span></td>' +
      '<td class="num">' + (editable
        ? '<input class="fwt" data-f="' + i + '" value="' + f.weight + '" aria-label="Weight for ' + esc(f.name) + '" />'
        : '<b>' + f.weight + '%</b>') + '</td>' +
      '<td class="num"><span class="why" style="margin:0">' + (function(){
        var pf = priorFactors().filter(function(x){ return x.key === f.key; })[0];
        if (!pf) return "new this cycle";
        var d = f.weight - pf.weight;
        return pf.weight + "% &rarr; " + (d === 0 ? "unchanged"
          : '<b style="color:' + (d > 0 ? "var(--good-tx)" : "var(--warn-tx)") + '">' + (d > 0 ? "+" : "\u2212") + Math.abs(d) + '</b>');
      })() + '</span></td>' +
      '<td>' + (editable ? '<button class="rmbtn" data-rmf="' + i + '" aria-label="Remove ' + esc(f.name) + '">Remove</button>' : '') + '</td></tr>';
  }).join("");

  var totalOK = total === 100;

  /* The note that was here described HOW THE DATA IS STORED — "as rows, not as
     fixed columns … rather than a schema change". That is a sentence for
     whoever maintains the platform, and it was rendering on a page a group CEO
     opens. Cut outright rather than trimmed: none of it was about weighting
     (§47.5). */
  return section("", "Weighting factors", null,

    '<div class="cfg-bar plain">' +
      '<span class="cfg-lab">' + w.factors.length + ' factors &middot; totalling ' + total + '%</span>' +
      (grant("g_weight") === "edit"
        ? '<button class="editbtn" data-edit="factors">' + (EDITING.factors ? "Done" : "Edit") + '</button>'
        : '<span class="pill none">View only</span>') + '</div>' +
    '<div class="cfg"><table><thead><tr>' +
      '<th style="width:30%">Factor</th><th style="width:24%">Type</th><th style="width:14%">Weight</th>' +
      '<th style="width:22%">' + priorLabel() + '</th><th style="width:10%"></th>' +
    '</tr></thead><tbody>' + rows + '</tbody>' +
    '<tfoot><tr><td colspan="2"><b>Total</b></td>' +
      '<td class="num"><b class="' + (totalOK ? "" : "overload") + '">' + total + '%</b></td>' +
      '<td colspan="2">' + (totalOK
        ? '<span class="pill good">Totals 100</span>'
        : '<span class="pill bad">Must total 100 &mdash; saving blocked</span>') + '</td></tr></tfoot></table></div>' +

    (editable ? '<div class="addrow"><button class="editbtn" id="addf">+ Add a factor</button>' +
      '<span class="why" style="margin:0">A fifth factor takes a share of the same 100 &mdash; the others must give way.</span></div>' : '') +

    /* The reasoning lives in the page Info. What stays is the one thing that
       is not explanation but consequence, and only while someone is editing:
       a change from here moves a figure that has already been reported. */
    (CYCLE_REPORTED && editable
      ? '<div class="note bad-note"><b>H1 2026 has already been reported.</b> Changing a factor or a weight now recomputes every business unit\'s contribution, and with it the group figure that has already been seen.</div>'
      : ''));
}


/* ── Scoring bands ──────────────────────────────────────────────────
   One scale for every achievement-against-benchmark figure, held once so the
   legend, the colours and the status words can never drift apart. ── */
function renderBands(){
  var can = grant("c_bands") === "edit";
  var editable = can && EDITING.bands;
  var b = BANDS.bands;

  /* THE COLOUR IS THE KEY, AND THAT IS THE WHOLE MODEL (§168). A band's `key`
     is read as a CSS token (`var(--good)`, `.pill.good`) AND by `needsNote()`,
     which asks for an explanation on a figure that lands in `bad` or `warn`.
     So a level's colour is not decoration beside its key — it IS the key, and
     picking red is what makes that level one a reporter has to explain. Five
     to pick from, because those are the five the product paints; a sixth
     would be a colour nothing else in the platform knows. */
  var rows = b.map(function(x, i){
    var top = i === 0 ? "and above" : "to " + (b[i-1].floor - 1) + "%";
    var colour = editable
      ? '<span class="bcols">' + BAND_COLOURS.map(function(c){
          return '<button type="button" class="bcol' + (c.key === x.key ? " on" : "") +
            '" data-bcol="' + i + '|' + c.key + '" title="' + c.word +
            '" aria-label="' + c.word + ' for ' + esc(x.label) + '"' +
            (c.key === x.key ? ' aria-pressed="true"' : '') +
            ' style="background:var(--' + c.key + ')"></button>';
        }).join("") + '</span>'
      : '<span class="swatch" style="background:var(--' + x.key + ')"></span>';
    /* THE BOTTOM BAND'S FLOOR IS NOT A CHOICE. Every figure has to land
       somewhere, so the last one starts at 0 and says so rather than offering
       a box whose only valid answer is the one already in it (§61). */
    return '<tr><td>' + colour +
      (editable
        ? '<input class="blabel" data-b="' + i + '" value="' + esc(x.label) + '" aria-label="Label for band ' + (i+1) + '" />'
        : '<b>' + esc(x.label) + '</b>') + '</td>' +
      '<td class="cc">' + (editable && i < b.length - 1
        ? '<input class="bfloor" data-b="' + i + '" value="' + x.floor + '" aria-label="Floor for ' + esc(x.label) + '" />'
        : '<span class="mono">' + x.floor + '</span>') + '</td>' +
      '<td class="cc"><span class="mono">' + x.floor + '% ' + top + '</span></td>' +
      '<td><span class="pill ' + x.key + '">' + esc(x.label) + '</span></td>' +
      (editable
        ? '<td class="cc">' + (b.length > 2
            ? '<button class="xbtn" data-bdel="' + i + '" type="button" title="Remove this level" ' +
              'aria-label="Remove ' + esc(x.label) + '">\u00d7</button>'
            /* TWO IS THE FLOOR, AND THE REASON IS SAID RATHER THAN THE BUTTON
               MERELY MISSING (§59): one band is not a scale, it is a colour
               painted on every figure in the tenant. */
            : '<span class="why" title="A scale needs at least two levels">\u2014</span>') + '</td>'
        : '') + '</tr>';
  }).join("");

  /* Floors must descend, or a figure falls into two bands at once. */
  var ok = true;
  for (var i = 1; i < b.length; i++) if (b[i].floor >= b[i-1].floor) ok = false;

  return section("", "Scoring bands",
      null,
      '<div class="cfg-bar plain"><span class="cfg-lab">' + b.length + ' bands</span>' +
        (can
          ? '<button class="editbtn" data-edit="bands">' + (EDITING.bands ? "Done" : "Edit") + '</button>'
          : '') + '</div>' +
      '<div class="cfg"><table class="bandtbl"><thead><tr><th style="width:34%">Band</th>' +
        '<th class="cc" style="width:16%">Floor</th><th class="cc" style="width:26%">Range</th>' +
        '<th style="width:24%">Appears as</th>' +
        (editable ? '<th class="cc" style="width:6%"><span class="vh">Remove</span></th>' : '') +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (editable
        ? '<div class="cfg-bar plain"><button class="addbtn" data-badd="1" type="button">' +
          '+ Add a level</button></div>'
        : '') +
      (ok ? '' : '<div class="note bad-note"><b>Floors must descend.</b> Two bands overlap, so a figure would fall into both. Saving is blocked until the order is fixed.</div>') +
      '<div class="note bad-note"><b>Changing a threshold rewrites history.</b> A quarter reported as on track becomes needs attention with no data having changed. Bands are per tenant and change rarely; the warning is what makes a change visible rather than silent.</div>');
}

/* ── Business units ─────────────────────────────────────────────────
   The one place a unit's name and code prefix are set. Everything else in the
   platform references the unit's KEY, so a rename here propagates and can
   never detach a unit from its weight, its pillars or its people.

   Units are marked inactive rather than deleted. A unit carries pillars,
   measures, tactics and reported progress; retiring it must not destroy a
   cycle's record. ── */
var CLEARING = null;

/* ── One header for both configuration tables ───────────────────────
   The title anchors the left; the facts about the page and its two controls sit
   far right on the same line. Before this, Business units used four elements
   for the same job \u2014 a chip row, a bar with the count and Edit, the table, then
   master clear buttons at the very bottom of the page.

   Edit is a pencil on a square: it edits THIS PAGE, not one thing. Clear is an
   eraser, the only common mark meaning "rub out the contents and leave the
   thing" \u2014 a bin would say the row is going away, which is the opposite. */
var ICO_EDIT = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M16 10.5V16a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 013 16V6a1.5 1.5 0 011.5-1.5H10"/>' +
  '<path d="M14 2.8l3.2 3.2L10 13.2l-3.6.4.4-3.6z"/></svg>';
/* THE ATTENTION MARK IS A RING, NOT A WARNING TRIANGLE (§116). A triangle
   says something is broken; what this counts is a list of things WAITING —
   somebody's declaration to accept, a password never issued. A ring around a
   dot is the mark this product already uses for "look here" and it carries no
   alarm of its own; the button's fill is what makes it loud (§94.8's budget:
   one solid fill on the page, and this is it while there is a queue). */
var ICO_ATTN = '<svg viewBox="0 0 20 20" aria-hidden="true" class="attnico">' +
  '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.4" fill="currentColor"/></svg>';
var ICO_DONE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>';
var ICO_CLEAR = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M8.5 16.5H16"/>' +
  '<path d="M11.8 3.9l4.3 4.3a1.2 1.2 0 010 1.7l-6 6a1.2 1.2 0 01-1.7 0L4.1 11.6a1.2 1.2 0 010-1.7' +
  'l6-6a1.2 1.2 0 011.7 0z"/><path d="M7 7l5.5 5.5"/></svg>';

var CLEARMENU = null;

/* `extra` is a slot for page-level ACTIONS in the header's right cluster,
   before the edit pen. HR_ERP puts its bulk controls exactly here — a row of
   worded dropdown buttons beside the title — and Islam asked for the password
   actions to match, so the slot exists rather than each page inventing a place
   to put its own (§47.2). */
/* ── THE PAGE IS NAMED ONCE (§121.1) ─────────────────────────────────────
   Islam: *"there is some duplication in the titles like business unit business
   unit"* — Business units and Companies each printed their name as the page
   title and again as the first section's heading.

   The Setup page's name is drawn by the shell now, from the RAIL'S OWN LABEL,
   so the two can never disagree: five pages were calling themselves something
   the rail did not (Terminology opened "Labels", Email opened "Communication"),
   which is §108's rename reaching the navigation and stopping there.

   SO A SECTION HEADING THAT REPEATS THE PAGE'S NAME IS NOT DRAWN — §28's rule
   that a header saying nothing new still spends its line. It is compared
   against the name the shell is showing, NOT suppressed by position: the
   Reporting cycle's first section is "Who has reported", which is a real
   section name and keeps its heading. The row itself survives either way,
   because it also carries the page's controls. */
var PAGE_TITLE = null;

/* ── ONE LINE, AND THE PAGE'S CONTROLS ARE ON IT (§135) ────────────────
   Islam, of six Setup pages at once: *"bring all the buttons and search bar to
   the sticky header line."*

   §121.2 pinned the page's NAME and deliberately left the controls on a row
   of their own beneath it — for a good reason, recorded there: the row is not
   sticky, so pulling it up with a negative margin slid it out from under the
   pinned title and left a stray "Clear plan" floating. **A sticky box may only
   overlap something that pins with it.** That reason does not forbid the move;
   it forbids the FAKE move. So the controls go INSIDE the header, where they
   pin with the name rather than under it.

   THE SHELL DRAWS THE HEADER, so the controls have to reach it, and they are
   produced deep inside a page's own render. `PAGE_TITLE` already solves exactly
   this problem in exactly this direction (§121.1) — these are its two
   siblings, reset by the shell before the page renders and read after. Two
   slots and not one, because the search box and the buttons are different
   things and the search sits left of them on every page that has both.

   A CALLER OUTSIDE A SETUP PAGE STILL GETS ITS ROW. `PAGE_TITLE == null` is
   what says "the shell is not drawing a header here" — there is no such
   caller today, and a silent loss of every control on the day one appears is
   not a trade worth making. */
var PAGE_TOOLS = "";
var PAGE_ACTS  = "";
/* THE REPORTING BOX TRAVELS THE SAME WAY (§150). The tab row is written
   BEFORE the page renders, so a report cannot put its controls there
   directly — it publishes them here and the shell hangs them on the row
   afterwards, which is exactly the trip the two slots above already make.
   Reset with them, or a report's box would survive onto the next page. */
var REPORT_CHROME = "";
function pageLineReset(){ PAGE_TOOLS = ""; PAGE_ACTS = ""; REPORT_CHROME = ""; }
function pageLineHTML(){
  if (!PAGE_TOOLS && !PAGE_ACTS) return "";
  return (PAGE_TOOLS ? '<div class="headtools">' + PAGE_TOOLS + '</div>' : '') +
         (PAGE_ACTS ? '<div class="hright">' + PAGE_ACTS + '</div>' : '');
}

/* THE COUNT CHIPS AND THE `SMO` PILL ARE GONE (§135.1). Islam: *"remove the
   smo pill and 10 names and 10 mapped."* The chrome says who you are on every
   page, and the table under the header is how big the list is — §122 removed
   the badge and one copy of the count from the register on those two arguments
   and left the other copy standing, which is how a rule half-applied looks.

   `alerts` IS WHAT SURVIVES, and it is not the same thing wearing a shorter
   name: "10 names" is the list, and "3 names on people and not on this list" is
   something outstanding. A page keeps the second and loses the first. */
/* ── AND A PAGE MAY HAVE NO PEN AT ALL (§261) ────────────────────────
   `editKey` null means the page has nothing for a page-level pen to open —
   which is true of every table that edits a ROW in a dialog. The eraser is not
   a pen and does not go with it: Clear all progress and Clear all plans are
   decisions about the page's contents, not a mode you enter to correct a field
   (§62), so it keeps its own control and its own gate.

   THE CLEAR MENU IS KEYED ON WHICHEVER OF THE TWO THE PAGE HAS. It used to be
   keyed on `editKey` alone, so a page that lost its pen would have opened a
   menu under the key `null` — one open menu on any such page opening the menu
   on all of them (§46.4's own reason for one key rather than a flag per row). */
function cfgHead(title, alerts, editKey, mayEdit, clearScope, labels, extra){
  var editing = editKey ? EDITING[editKey] : false;
  var menuKey = editKey || clearScope;
  var open = CLEARMENU === menuKey;
  var dup = PAGE_TITLE != null &&
            String(title).trim().toLowerCase() === String(PAGE_TITLE).trim().toLowerCase();
  var acts =
      (alerts || []).map(function(x){ return '<span class="chip">' + x + '</span>'; }).join("") +
      (extra || "") +
      (mayEdit && (editKey || clearScope)
        ? '<span class="iconwrap">' +
            (!editKey ? '' :
            '<button class="ico' + (editing ? " on" : "") + '" data-edit="' + editKey +
              '" title="' + (editing ? "Done" : "Edit") + '" aria-label="' +
              (editing ? "Done editing" : "Edit this page") + '">' +
              (editing ? ICO_DONE : ICO_EDIT) + '</button>') +
            /* No clear scope, no clear button. Companies and People have
               nothing to clear — a page's rows are retired one at a time — and
               Companies was rendering the control anyway: it shares the
               "units" edit key, so opening the menu there read labels[0] off
               an argument nobody had passed and threw. A control that cannot
               work should not be drawn. */
            (!clearScope ? '' :
            '<button class="ico' + (open ? " on" : "") + '" data-clearmenu="' + menuKey +
              '" title="Clear" aria-label="Clear plans or progress" aria-expanded="' + open + '">' +
              ICO_CLEAR + '</button>' +
            /* The confirmation replaces the menu in the same place, so the
               second press lands where the first one did. Deleting the old
               master block took its confirmation with it, and the menu set the
               state with nothing left to ask. */
            (CLEARING === clearScope + "||nums" || CLEARING === clearScope + "||plan"
              ? '<div class="menu confirmwrap">' +
                  '<div class="cq"><b>' +
                    (CLEARING === clearScope + "||plan"
                      ? "Clear every plan?" : "Clear all reported progress?") + '</b>' +
                    '<span class="why" style="margin:4px 0 0">' +
                      (CLEARING === clearScope + "||plan"
                        ? "The work itself, everywhere on this page. Names and definitions stand. " +
                          "Each one is archived first and can be restored."
                        : "Actuals and notes, everywhere on this page. Every plan stands.") +
                    '</span></div>' +
                  '<button class="danger" data-clearyes="' + CLEARING + '">Yes, clear</button>' +
                  '<button data-clearno="1">Cancel</button>' +
                '</div>'
              : open
              ? '<div class="menu">' +
                  '<button data-clear="' + clearScope + '||nums">' + labels[0] + '</button>' +
                  '<button data-clear="' + clearScope + '||plan">' + labels[1] + '</button>' +
                '</div>'
              : '')) +
          '</span>'
        : '');
  if (PAGE_TITLE != null) { PAGE_ACTS += acts; return ""; }
  return '<div class="phead2' + (dup ? ' named' : '') + '">' +
    (dup ? '' : '<h2 class="secttl">' + title + '</h2>') +
    '<div class="hright">' + acts + '</div></div>';
}

/* ── Assigning a person to a thing (§35) ────────────────────────────
   Islam: "a search field with a list that appears below with relevant names
   but with an Add new button that creates only the name and the Role."

   It replaces a plain <select>, which had two faults. It could only offer
   people already attached to this unit — so the first person on a new unit
   could never be chosen, because nobody was attached yet. And it could not
   offer somebody who does not exist, which is the normal case when a unit is
   being set up from a plan that arrived yesterday.

   The list is ORDERED, not filtered: this unit's people first under their own
   heading, then everybody else. A picker that hides the rest cannot move a
   person between units, and people move between units.

   `where` is the same encoding personRoles() reports — a unit key, or
   "fn:<function>" — so one picker serves Business units and Supporting
   functions without either knowing about the other. */
function assignPicker(where, roleKey, current, editable){
  var id = where + "|" + roleKey;
  if (!editable) {
    var n = personName(current);
    return n ? esc(n) : '<span class="why" style="margin:0">unassigned</span>';
  }
  if (PICKING !== id) {
    var held = personName(current);
    return '<button class="pickbtn' + (held ? '' : ' empty') + '" data-pick-open="' + esc(id) + '">' +
      (held ? esc(held) : 'unassigned') + '</button>';
  }
  var pool = peopleFor(where);
  /* SEARCHABLE ON WHAT IDENTIFIES SOMEBODY, not only on what they are called
     (§87.3). `data-name` stays the NAME alone, because the near-name fallback
     compares chains of names and an employee number in the string would break
     it; `data-find` is what the substring search reads. */
  var row = function(p){
    var find = [p.name, p.empId || "", p.email || ""].join(" ").toLowerCase();
    return '<button class="pickrow" data-name="' + esc(p.name.toLowerCase()) + '" ' +
      'data-find="' + esc(find) + '" ' +
      'data-pick-set="' + esc(id + '|' + p.key) + '">' +
      '<b>' + esc(p.name) + '</b>' +
      (p.title ? '<span class="why" style="margin:0">' + esc(p.title) + '</span>' : '') +
      (p.email ? '<span class="why mono" style="margin:0">' + esc(p.email) + '</span>' : '') +
      '</button>';
  };
  var group = function(label, list){
    return list.length
      ? '<div class="pickhead">' + label + '</div>' + list.map(row).join("")
      : '';
  };
  return '<div class="picker">' +
    '<input class="fld" id="pickQ" placeholder="Search people…" autocomplete="off" ' +
      'aria-label="Search people">' +
    '<div class="picklist">' +
      /* ABOVE the names it is talking about \u2014 a "did you mean" under the list
         is a caption on something the reader has already scrolled past. */
      '<div class="pickdym" hidden>Nothing matches exactly \u2014 is it one of these?</div>' +
      group(String(where).indexOf("fn:") === 0 ? "In this function" : "In this unit", pool.here) +
      group("Everyone else", pool.rest) +
      '<div class="pickempty" hidden>No name matches. Add them below.</div>' +
    '</div>' +
    /* ── A PERSON CREATED HERE IS IDENTIFIABLE, OR THEY ARE THE NEXT
           DUPLICATE (§87.3) ────────────────────────────────────────
       This control is where the twins were made: it takes a typed name and
       mints a row with no employee number and no address, which is precisely
       the row a later upload cannot match — so the upload adds the person a
       second time, and the role sits on the copy nobody can email.

       Two fields, and neither is required (the SMO may know only a name), but
       they are IN FRONT OF the person adding somebody rather than a correction
       to make later on a page they have no reason to open. */
    '<div class="picknew" hidden>' +
      '<input class="fld" id="pickNewId" placeholder="Emp ID" autocomplete="off">' +
      '<input class="fld" id="pickNewEmail" placeholder="Email" type="email" ' +
        'autocomplete="off" spellcheck="false">' +
    '</div>' +
    '<div class="pickerr" hidden></div>' +
    '<div class="pickfoot">' +
      '<button class="linkbu" data-pick-new="' + esc(id) + '" hidden></button>' +
      '<span class="why pickhint" style="margin:0">Type a name to add someone new</span>' +
      (current ? '<button class="linkbu" data-pick-clear="' + esc(id + '|' + current) +
                 '">Unassign</button>' : '') +
      '<button class="linkbu" data-pick-cancel="1">Cancel</button>' +
    '</div></div>';
}

/* ══ ARRANGING A SETUP TABLE, AND IT IS THE NAVIGATION'S ORDER (§261) ══
   Islam: *"allow me in the setup to rearrange the business units table so they
   appear in the navigation as per this order."*

   NOTHING NEW IS STORED, which is the whole reason this is small: the order
   already IS `UNIT_KEYS` / `FUNCTION_KEYS`, written to `units.idx` on every
   save and read back by `ORDER BY idx`; the navigation row, the group page and
   this table have always drawn from the same list. `lib/authorize.js` already
   classifies a change to it as `setup` — the office's — so there is no
   migration, no schema change and no new rule.

   IT COULD ALREADY BE DONE, JUST NOT WHERE ANYBODY WOULD LOOK: the group's
   Performance page has arranged these cards since §101, and only in its CARD
   view — switch that section to its table and the handles are gone. Setup, the
   page named after setting things, had none. Both stay: they are two views of
   one list, exactly as the group's themes and capabilities already are.

   A MODE, NOT A PERMANENT HANDLE. An accidental drag here reorders the
   navigation for everybody in the tenant, so it takes a press to arm — the
   same trade §101 made for a plan's rows, and the same word on the button. */
function setArrangeOn(table){ return SETARRANGE === table; }

/* The button goes in the header line's own actions slot (§135), beside the
   eraser, where every other page-level control on a Setup page already sits. */
function setArrangeBtn(table, may){
  if (!may) return "";
  var on = setArrangeOn(table);
  return '<button class="editbtn' + (on ? ' on' : '') + '" data-setarrange="' + esc(table) + '" ' +
    'title="' + (on ? "Finish arranging" : "Change the order these appear in") + '">' +
    (on ? "Done" : "Arrange") + '</button>';
}

/* THE BAND IS THE PLATFORM'S OWN, word for word (§53.5): `cfg-bar plain` with a
   `cfg-lab` inside it is what the group's cards say while they are being
   arranged, and a second sentence for the same act on a second page is how one
   product comes to describe one gesture two ways. What is added is the sentence
   that makes it worth pressing — the order here is the order in the navigation
   — because that is the fact somebody is acting on and it is stated nowhere. */
function setArrangeBand(table, n, noun, extra){
  if (!setArrangeOn(table)) return "";
  return '<div class="cfg-bar plain"><span class="cfg-lab">' +
    plural(n, noun) + ' · drag by the handle to reorder · ' +
    'the order here is the order in the navigation' + (extra ? ' · ' + extra : '') +
    '</span></div>';
}

/* THE NUMBER IS `.idx-n` AND NOT A BARE NUMBER, because `makeSortable` renumbers
   the rows as one is dragged past another and finds them by that class
   (arrange.js). A row drawn without it drags perfectly and shows the wrong
   number until the paint that follows the drop.

   `data-oi` IS THE POSITION IN THE LIST BEING ORDERED, and every row carries
   one — including a retired unit, which is still in `UNIT_KEYS` and still holds
   a place in it. A row without one is furniture to the sorter (§118), which is
   right for an add row and would silently drop a real row from the commit. */
function setArrangeIdx(table, i, label){
  var on = setArrangeOn(table);
  return '<td class="idx">' + (on ? handle(label) : '') +
    '<span class="idx-n">' + (i + 1) + '</span></td>';
}
/* The tbody is what `makeSortable` binds to, and it says what it holds (§63.5):
   the selector comes from `data-item`, never guessed from the kind. */
function setArrangeBody(table, kind){
  return setArrangeOn(table)
    ? '<tbody class="sortable" data-kind="' + esc(kind) + '" data-item="tr">'
    : '<tbody>';
}

/* ── Business units ─────────────────────────────────────────────────
   The one place a unit's name and code prefix are set. Everything else in the
   platform references the unit's KEY, so a rename here propagates and can
   never detach a unit from its weight, its pillars or its people.

   Units are marked inactive rather than deleted. A unit carries pillars,
   measures, tactics and reported progress; retiring it must not destroy a
   cycle's record. ── */
/* ── AND THE ROW STOPPED BEING A FORM (§261) ─────────────────────────
   Islam: *"let's clean this table making a three dots option to actions like
   the registry file."*

   §93.14 did this to the FUNCTIONS page — "learn from what we have done in the
   people table" — and stopped there, so for two weeks the two neighbouring
   pages have disagreed about what a row's last column is for. Measured before
   anything was written: a units row is **130px** where a register row is 39 and
   a functions row is 37, and all of it is one cell holding a pen, Retire,
   Clear progress and Clear plan in a stack. Every collision this table has ever
   had was a control clicked inside a 150px cell.

   SO THE FIELDS GO WHERE THE REGISTER'S WENT (§116) — a dialog — and what is
   left on the row is a status and a menu. The table is 535px where it was 1338,
   and it can never widen when a pen is pressed, because there is no longer a
   pen on it to press.

   THE MENU'S WORDING IS THE FUNCTIONS PAGE'S, copied rather than composed:
   `Clear progress`, `Clear plan`, the destructive act below a rule. Two
   differences, both deliberate — there is no Delete, because a unit is retired
   and never deleted (§62's refusal has nothing to refuse), and Edit details
   carries the mark, which is where the Unit marks table went. */
var CLEARING = null;

/* ── ONE HEADER FOR BOTH CONFIGURATION TABLES ───────────────────────
   The title anchors the left; the facts about the page and its two controls sit
   far right on the same line. Before this, Business units used four elements
   for the same job — a chip row, a bar with the count and Edit, the table, then
   master clear buttons at the very bottom of the page.

   Edit is a pencil on a square: it edits THIS PAGE, not one thing. Clear is an
   eraser, the only common mark meaning "rub out the contents and leave the
   thing" — a bin would say the row is going away, which is the opposite. */
var ICO_EDIT = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M16 10.5V16a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 013 16V6a1.5 1.5 0 011.5-1.5H10"/>' +
  '<path d="M14 2.8l3.2 3.2L10 13.2l-3.6.4.4-3.6z"/></svg>';
/* THE ATTENTION MARK IS A RING, NOT A WARNING TRIANGLE (§116). A triangle
   says something is broken; what this counts is a list of things WAITING —
   somebody's declaration to accept, a password never issued. A ring around a
   dot is the mark this product already uses for "look here" and it carries no
   alarm of its own; the button's fill is what makes it loud (§94.8's budget:
   one solid fill on the page, and this is it while there is a queue). */
var ICO_ATTN = '<svg viewBox="0 0 20 20" aria-hidden="true" class="attnico">' +
  '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.4" fill="currentColor"/></svg>';
var ICO_DONE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>';
var ICO_CLEAR = '<svg viewBox="0 0 20 20" aria-hidden="true">' +
  '<path d="M8.5 16.5H16"/>' +
  '<path d="M11.8 3.9l4.3 4.3a1.2 1.2 0 010 1.7l-6 6a1.2 1.2 0 01-1.7 0L4.1 11.6a1.2 1.2 0 010-1.7' +
  'l6-6a1.2 1.2 0 011.7 0z"/><path d="M7 7l5.5 5.5"/></svg>';

var CLEARMENU = null;

/* THE THREE DOTS, ON A ROW OF ANY OF THE THREE TABLES (§261) ─────────
   `fnKebab`'s shape, lifted so a fourth table gets it without a fourth copy of
   the same twelve lines and the same stacking-context comment. What differs
   between the three is only the LIST, which is the argument; the button, the
   panel and the lift are identical and were already written twice.

   THE LIFT IS NOT DECORATION (§69.22): this column is frozen, so every actions
   cell is `position:sticky` with a z-index and therefore its own stacking
   context — a menu's z-index cannot escape a context its parent created, so the
   open cell is raised instead of the menu. */
function kebabCell(open, acts, panels, label, attr, lifted){
  if (!acts.length) return '<td class="cc kebcell">' + (panels || '') + '</td>';
  return '<td class="cc kebcell' + (open || lifted ? " lifted" : "") + '">' +
    '<button class="kebab' + (open ? " open" : "") + '" ' + attr + ' ' +
    'aria-haspopup="true" aria-expanded="' + !!open + '" ' +
    'title="Actions" aria-label="Actions for ' + esc(label) + '">' +
    '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
    '<circle cx="10" cy="4.6" r="1.5"/><circle cx="10" cy="10" r="1.5"/>' +
    '<circle cx="10" cy="15.4" r="1.5"/></svg></button>' +
    (open ? '<div class="kmenu">' + acts.join("") + '</div>' : '') + (panels || '') + '</td>';
}

/* The two clear questions, each replacing the menu in the same corner so the
   second press lands where the first one did (§46.2). They were inline in the
   actions cell, which is what a 130px row is made of. */
function unitPanels(k, u){
  if (CLEARING === k + "|plan")
    return '<div class="kmenu kconfirm"><div class="cq">' +
      '<b>Clear ' + esc(u.name) + '’s whole plan?</b> ' +
      'Pillars, measures, tactics, objectives, SWOT and the foundation text. ' +
      'Kept as an archive dated today and restorable from <b>Import &amp; archives</b>.' +
      '</div><div class="cbtns">' +
        '<button class="danger" data-clearyes="' + esc(k) + '|plan">Yes, clear the plan</button>' +
        '<button data-clearno="1">Cancel</button></div></div>';
  if (CLEARING === k + "|nums")
    return '<div class="kmenu kconfirm"><div class="cq">' +
      '<b>Clear ' + esc(u.name) + '’s reported progress?</b> ' +
      'Actuals and progress only. The plan stands.' +
      '</div><div class="cbtns">' +
        '<button class="danger" data-clearyes="' + esc(k) + '|nums">Yes, clear the progress</button>' +
        '<button data-clearno="1">Cancel</button></div></div>';
  return "";
}

function unitKebab(k, u, mayEdit){
  var panels = unitPanels(k, u);
  if (!mayEdit) return '<td class="cc kebcell"></td>';
  var acts = [];
  acts.push('<button data-rowdlg="units|' + esc(k) + '">Edit details</button>');
  acts.push('<button data-clear="' + esc(k) + '|nums">Clear progress</button>');
  /* Clearing a plan destroys authored work and stays the Super user's (§89).
     Absent rather than disabled, for §62's reason: the refusal would be about
     who is reading it, not about this row. */
  if (mayDestroy())
    acts.push('<button data-clear="' + esc(k) + '|plan">Clear plan</button>');
  acts.push('<hr>');
  /* NO DELETE. A unit carries pillars, figures and a cycle's record, and the
     product has never offered to destroy one — so there is no entry here whose
     refusal would have to be written (§62). Retire is reversible and keeps
     every attribution true. */
  acts.push('<button class="danger" data-uact="' + esc(k) + '">' +
    (u.active ? "Retire this unit" : "Restore this unit") + '</button>');
  return kebabCell(UMENU === k, acts, panels, u.name, 'data-umenu="' + esc(k) + '"',
                   String(CLEARING || "").indexOf(k + "|") === 0);
}

function renderUnits(){
  /* `mayEdit` is whether this viewer may change anything on the page at all.
     There is no longer a second question — a row is opened from its own menu
     and edited in a dialog, so `rowEditIs("units", k)` no longer decides what
     the ROW draws (§261). */
  var mayEdit = grant("c_units") === "edit";
  var arranging = setArrangeOn("units");

  var rows = UNIT_KEYS.map(function(k, i){
    var u = UNITS[k];
    var wrow = GROUP.weighting.units.filter(function(r){ return r.key === k; })[0];
    var roles = UNIT_ROLES[k] || {};
    return '<tr data-oi="' + i + '" data-tkrow="' + (u.active ? "active" : "retired") + '"' +
      (u.active ? '' : ' class="retired"') + '>' +
      setArrangeIdx("units", i, u.name) +
      '<td><b>' + esc(u.name) + '</b>' +
        '<span class="why mono">key ' + esc(k) + '</span></td>' +
      /* Short name for the navigation only — everywhere else keeps the full
         one. Empty means "use the full name", so nothing has to be filled in. */
      '<td>' + (u.navName ? '<span class="val">' + esc(u.navName) + '</span>'
                          : '<span class="why" style="margin:0">' + esc(u.name) + '</span>') + '</td>' +
      '<td class="cc"><span class="mono">' + esc(u.codePrefix) + '</span></td>' +
      '<td class="cc"><span class="mono">' + u.items.length + '</span></td>' +
      '<td class="cc"><span class="mono">' + u.keyObjectives.length + '</span></td>' +
      '<td class="cc"><span class="mono">' + (wrow ? u.weight + '%' : '&mdash;') + '</span></td>' +
      /* A unit belongs to a company or is its own — never neither. "Its own"
         is an explicit choice rather than an empty cell, because an empty cell
         reads as somebody having forgotten and standing alone is a decision. */
      '<td>' + (u.company && COMPANIES[u.company]
        ? '<span class="val">' + esc(COMPANIES[u.company].name) + '</span>'
        : '<span class="why" style="margin:0">its own company</span>') + '</td>' +
      '<td class="cc">' + assignPicker(k, "owner", roles.head, false) + '</td>' +
      '<td class="cc">' + assignPicker(k, "custodian", roles.custodian, false) + '</td>' +
      /* STATUS HOLDS A STATUS (§93.14's rule, reaching the page it was written
         about). This column was headed Status and showed four controls. */
      '<td class="cc"><span class="pill ' + (u.active ? "good" : "none") + '">' +
        (u.active ? "Active" : "Retired") + '</span></td>' +
      /* THE MENU STEPS ASIDE WHILE ARRANGING (§261). One act at a time: a
         row wearing a handle and a menu offers a drag and a Retire in the same
         28px, and the press that opens the menu is the press that starts the
         drag. `mayEdit && !arranging` rather than a second branch, so the
         read-only cell is the one that was already written. */
      unitKebab(k, u, mayEdit && !arranging) + '</tr>';
  }).join("");

  return cfgHead("Business units", [], null, mayEdit, "all",
      ["Clear all progress", "Clear all plans"], setArrangeBtn("units", mayEdit)) +

    /* §84. SEARCH BUT NO SORT (spec §6.2). This table's row order is the order
       the units appear in the navigation and on the group page — somebody
       ARRANGED it — so a sort would be indistinguishable from a rearrangement
       the moment a row is dragged, and no label fixes that. Ten rows: search
       narrows it better than sorting would anyway.

       AND THE SEARCH GOES WHILE IT IS BEING ARRANGED (§261). `tkApply` HIDES
       the rows it filters out rather than removing them, so they stay in the
       tbody, keep their `data-oi` and sit between the ones you can see — a drop
       between two visible rows would land somewhere else entirely. You cannot
       arrange a filtered list, so while arranging there is no filter to have. */
    section("", "Business units", null,
      (arranging ? "" : tkBar("units", { placeholder:"Search the units…" })) +
      setArrangeBand("units", UNIT_KEYS.length, "business unit") +
      '<div class="cfg' + (arranging ? ' arranging' : '') + '">' +
      '<table class="unitcfg" data-tktable="units"><thead><tr>' +
        '<th class="idx" style="width:' + (arranging ? 54 : 38) + 'px">#</th>' +
        '<th style="width:18%">Unit</th>' +
        '<th style="width:14%">Shown in the nav</th>' +
        '<th class="cc" style="width:8%">Code</th>' +
        '<th class="cc" style="width:7%">Pillars</th><th class="cc" style="width:9%">Objectives</th>' +
        '<th class="cc" style="width:7%">Weight</th>' +
        '<th style="width:12%">Company</th>' +
        '<th class="cc" style="width:14%">BU head</th><th class="cc" style="width:15%">Strategy custodian</th>' +
        '<th class="cc" style="width:7%">Status</th>' +
        '<th class="cc kebcell" style="width:44px"></th>' +
      '</tr></thead>' + setArrangeBody("units", "units") + rows + '</tbody></table></div>' +
      /* ADD IS THE PAGE'S, NOT A ROW'S — and it is not drawn while arranging,
         because a row minted mid-drag lands at the end of a list somebody is in
         the middle of ordering. */
      (mayEdit && !arranging
        ? '<div class="addrow"><button class="editbtn" id="addunit">+ Add a business unit</button></div>'
        : ''));
}

/* ── The units' own marks: THE SECTION IS GONE (§261) ─────────────────
   §52.9 gave the marks a section of its own rather than a twelfth column, for
   a reason that was true at the time: a mark needs a preview and two controls,
   which a 7% column cannot hold. What that argument did not have was a third
   place to put it.

   Islam, on the first drawing of this change — which offered a Mark column:
   *"let the mark out of the table and only in the settings."* So it is in the
   dialog, where there is room for the preview, both controls AND the sentence
   about PNG and transparency that this section was carrying, and the second
   table repeating all ten unit names — 705px of it — goes.

   THE COST IS STATED RATHER THAN DISCOVERED: this section was the only place
   that answered "which units have no mark" at a glance, and that answer is now
   one dialog per unit. All ten in the worked example carry one.

   `renderUnitMarks()` is DELETED, not left uncalled (§24) — a builder nobody
   calls is one the next reader has to prove is dead before touching anything
   near it. `LOGO_NOTE` and the `data-ulogo` handlers stay: they are the
   upload's, and the upload moved rather than went. */

/* ══ THE SETUP DIALOG (§261) ═══════════════════════════════════════════
   One dialog for Business units, Functions and Companies, in the REGISTER'S
   OWN markup and classes — `.pdlg`, `.pdsect`, `.pdf`, `.pdfl`, `.pdro`,
   `.pdfoot` — because the platform has one dialog and a second vocabulary for
   the same shape is how two pages come to look like two products (§53.5).
   Those styles were never scoped to people; they only ever had one caller.

   THE FIELDS ARE THE PAGE'S OWN, unchanged. `data-uname`, `data-ucomp`,
   `data-coflag` and the rest are the same attributes the row carried, so they
   are bound by the same handlers writing to the same places — moving a form
   into a dialog changed WHERE it is drawn and nothing about what it does. That
   is §116's own finding on the register, and it is why this needed no second
   set of handlers either.

   `ROWEDIT` STILL HOLDS THE ROW, so Cancel still restores the snapshot it
   always did — and §110's role pointers now come with it on a unit and a
   function, which they did not before (see `ROLE_BEARING_ROWS`): a head is not
   ON the unit, so restoring the unit alone left a grant standing.

   THE SUBTITLE CARRIES WHAT CANNOT BE EDITED HERE — a unit's code, its pillars,
   its objectives, its weight — rather than four dead fields for facts derived
   elsewhere (§45.2: a control that changes nothing is worse than no control). */
function pdField(label, ctrl, wide){
  return '<div class="pdf' + (wide ? ' wide' : '') + '">' +
    (label ? '<div class="pdfl">' + label + '</div>' : '') + ctrl + '</div>';
}
function pdSect(t){ return '<div class="pdsect">' + t + '</div>'; }

/* WHAT THE DIALOG IS, FOR EACH TABLE, IN ONE PLACE. Deliberately not `ROWFIND`
   widened: that map answers "where does this row live" for six tables, and this
   one answers "what does its dialog hold" for three. A table absent from here
   simply has no dialog, which is the safe way round — the alternative is a menu
   entry that opens an empty box (§61). */
var ROWDLG_SPECS = {
  units: {
    find:  function(k){ return UNITS[k]; },
    title: function(u){ return u.name; },
    sub:   function(u, k){
      return [esc("Code " + (u.codePrefix || "—")),
              /* THE LABEL IS TAKEN EXACTLY AS IT COMES (§107.8). `plural()` returns
                 a COUNT followed by the word, and `L("pillar","bu")` is already
                 "Pillars" — so this read "3 pillarss" in the first build, which
                 is the fault §107.8 wrote down, committed by somebody quoting
                 it. There is no singular anywhere to reach for. */
              esc(u.items.length + " " + String(L("pillar","bu")).toLowerCase()),
              plural(u.keyObjectives.length, "key objective"),
              (u.weight != null ? u.weight + "% of the group" : "no weight set")].join(" · ");
    },
    body:  function(u, k){
      var roles = UNIT_ROLES[k] || {}, src = unitLogo(u);
      return pdSect("What it is") +
        pdField("Name", '<input class="fld tk-firstfield" value="' + esc(u.name) +
                        '" data-uname="' + esc(k) + '">') +
        pdField("Shown in the nav", '<input class="fld" value="' + esc(u.navName || "") +
                        '" data-unav="' + esc(k) + '" placeholder="' + esc(u.name) + '">') +
        pdField("Code prefix", '<input class="fld mono" value="' + esc(u.codePrefix) +
                        '" data-upx="' + esc(k) + '">') +
        pdSect("Where it sits, and who runs it") +
        pdField("Company",
          '<select class="fld" data-ucomp="' + esc(k) + '">' +
            /* A retired company is nowhere a unit can be MOVED to, but a unit
               already in one still shows it — hiding it would silently read as
               "its own company" (§49.3). */
            COMPANY_KEYS.filter(function(ck){ return companyActive(ck) || u.company === ck; })
              .map(function(ck){
                return '<option value="' + esc(ck) + '"' + (u.company === ck ? " selected" : "") +
                  '>' + esc(COMPANIES[ck].name) + (companyActive(ck) ? '' : ' (retired)') + '</option>';
              }).join("") +
            '<option value=""' + (u.company ? "" : " selected") + '>— its own company —</option>' +
          '</select>') +
        pdField("BU head", assignPicker(k, "owner", roles.head, true)) +
        pdField("Strategy custodian", assignPicker(k, "custodian", roles.custodian, true)) +
        pdSect("The unit’s mark") +
        pdField("Mark", src
          ? '<span class="umarkbox"><img class="umarkimg" src="' + esc(src) +
            '" alt="' + esc(u.name) + '"></span>'
          : '<span class="pdro">no mark — the unit’s name is used</span>') +
        pdField("", '<span class="rowacts markacts">' +
            '<label class="linkbu umarkpick">' + (src ? "Replace" : "Upload") +
              '<input type="file" accept="image/png" data-ulogo="' + esc(k) + '" hidden></label>' +
            (src ? '<button class="linkbu" data-ulogoclear="' + esc(k) + '">Remove</button>' : '') +
          '</span>') +
        /* §52.9's own sentence, carried across rather than rewritten: it is the
           only place in the product the PNG rule is stated. */
        pdField("", '<p class="why" style="margin:0">Shown on the unit’s review deck — large on ' +
          'the cover, small in the footer of every other slide. A unit with no mark shows its name, ' +
          'so a missing one costs nothing. <b>PNG only</b>, and keep the background transparent: a ' +
          'mark with white behind it paints a box around itself on a dark slide.</p>', true) +
        (LOGO_NOTE ? pdField("", '<p class="why logonote">' + esc(LOGO_NOTE) + '</p>', true) : '');
    }
  },
  fns: {
    find:  function(k){ return FUNCTIONS[k]; },
    title: function(f){ return f.name; },
    sub:   function(f, k){
      return [esc("Code " + (f.codePrefix || "—")),
              plural(capsOfFunction(k).length, "capability", "capabilities"),
              esc("key " + k)].join(" · ");
    },
    body:  function(f, k){
      return pdSect("What it is") +
        pdField("Name", '<input class="fld tk-firstfield" value="' + esc(f.name) +
                        '" data-fname="' + esc(k) + '">') +
        pdField("Nav name", '<input class="fld" value="' + esc(f.navName || "") +
                        '" data-fnav="' + esc(k) + '" placeholder="' + esc(f.name) + '">') +
        pdField("Code prefix", '<input class="fld mono" value="' + esc(f.codePrefix || "") +
                        '" data-fpx="' + esc(k) + '">') +
        pdSect("How it plans") +
        /* THE ONE FIELD THE ROW COULD HIDE. §93.14 wrote the trap down where it
           made it — "a hidden column renders nothing at all, edit field
           included" — so with the Columns menu turned down, Plans in and Under
           could not be reached at all. In a dialog every field is drawn
           whatever that menu says: a fault closed, not a feature added. */
        pdField("Plans in", planCell(k, f, true), true) +
        pdSect("Who runs it") +
        pdField("Head", assignPicker("fn:" + k, "fnhead", f.head, true)) +
        pdField("Custodian", assignPicker("fn:" + k, "custodian", f.custodian, true));
    }
  },
  companies: {
    find:  function(k){ return COMPANIES[k]; },
    title: function(c){ return c.name; },
    sub:   function(c, k){
      return [plural(unitsOfCompany(k).length, "business unit"), esc("key " + k)].join(" · ");
    },
    body:  function(c, k){
      var flag = function(field, val){
        return '<select class="fld" data-coflag="' + esc(k + "|" + field) + '">' +
          '<option value="no"' + (val ? "" : " selected") + '>No</option>' +
          '<option value="yes"' + (val ? " selected" : "") + '>Yes</option></select>';
      };
      return pdSect("What it is") +
        pdField("Name", '<input class="fld tk-firstfield" value="' + esc(c.name) +
                        '" data-coname="' + esc(k) + '">') +
        pdSect("What its CEO sees") +
        pdField("Sees other companies", flag("seeOthers", c.seeOthers)) +
        pdField("Sees the group", flag("seeGroup", c.seeGroup));
    }
  }
};

function rowDlgSpec(){ return ROWDLG ? ROWDLG_SPECS[ROWDLG.table] : null; }
function rowDlgRow(){ var sp = rowDlgSpec(); return sp ? sp.find(ROWDLG.key) : null; }
function rowDialogTitle(){
  var sp = rowDlgSpec(), r = rowDlgRow();
  if (!sp || !r) return { t:"", s:"" };
  return { t: sp.title(r, ROWDLG.key), s: sp.sub(r, ROWDLG.key) };
}
/* Cancel and Save, in the register's own foot. SAVE CLOSES AND COMMITS NOTHING,
   because every field has already written itself on blur (§35) — a button that
   pretended to be the moment of saving would be reassurance that lies (§63.2).
   Cancel is the one that acts: it puts back the snapshot `rowEditOpen` took,
   the row's pointers included. */
function rowDialogHtml(){
  var sp = rowDlgSpec(), r = rowDlgRow();
  if (!sp || !r) return "";
  return '<div class="pdlg">' + sp.body(r, ROWDLG.key) + '</div>' +
    '<div class="pdfoot"><span class="pdrt">' +
      '<button class="linkbu" data-rowdlg-cancel="1">Cancel</button>' +
      '<button class="linkbu tk-save" data-rowdlg-close="1">Save</button>' +
    '</span></div>';
}

/* ── Setup · Focus measures ─────────────────────────────────────────
   Marking is a configuration act, not something to be done while reading a
   unit's page \u2014 a marking mode sitting in a reading view invites a stray click
   on a decision that carries money.

   Everything measurable in the unit is offered: its Key Objectives first, then
   each pillar's key measures, each with its target so the choice is made
   against the number rather than the name alone. */

/* `renderFocusSetup` was defined TWICE, and the first one — 56 lines that
   returned the Business units screen rather than the focus one — was dead:
   a function declaration later in the file silently replaces an earlier one,
   so only the second ever ran. Removed. It is the same accident as the double
   `IMP` below, and it is what made a copy of this file taken outside look as
   though the Focus measures page were broken. */

/* ── Import ─────────────────────────────────────────────────────────
   A plan AUTHORS (§22): one generic template, the unit named on its Read me
   sheet, every code minted on arrival, and the plan it replaces archived.
   Reporting still amends: download, fill, upload, review the differences,
   apply. Nothing is written until it has been seen either way.

   `IMP` was declared twice, identically, a few hundred lines apart — the
   second silently won. One declaration now. ── */
/* `filled` is which plan the EXAMPLE download carries (§69.12), and it is its
   own field rather than reusing `unit`: that one is the subject a PROGRESS file
   is for and the two are chosen for opposite reasons — one is who is reporting,
   the other is whose finished plan makes the clearest example. Sharing the
   field would move a selection somebody made on one control by pressing the
   other. Screen state, never saved (§25.2). */
var IMP = { unit:"mobile", kind:"plan", text:"", diff:null, summary:null,
            read:"", check:null, done:null, filled:"" };

/* WHICH OF THE TWO PLANS A SUBJECT KEEPS (§61). A business unit and a function
   that plans in pillars take the PILLARS workbook; a capability and the
   functions that improve it take the PROJECTS one. Two files, so the download
   is one button with two entries rather than a button and a link beside it
   calling itself "Capability template" — the second was unfindable, and it was
   the only place the word for the other half appeared.

   READ OFF THE SUBJECT, never stored beside it. A second field would be a
   second copy of the same fact and the two would drift — the progress list
   would offer capabilities while the format said pillars, and the select would
   show nothing selected. The subject already says which plan it keeps, so
   changing the format IS changing the subject. */
function impFmtOf(target){
  return String(target || "").indexOf("cap:") === 0 ? "projects" : "pillars";
}
/* The subjects a progress file can be downloaded for, in the chosen format. */
function impSubjects(fmt){
  if (fmt === "projects") {
    return GROUP.capabilities.map(function(c){
      return { v:"cap:" + c.id, label:c.name };
    });
  }
  return UNIT_KEYS.filter(function(k){ return UNITS[k].active !== false; })
    .map(function(k){ return { v:k, label:UNITS[k].name }; })
    .concat(FUNCTION_KEYS.filter(function(k){
      var f = FUNCTIONS[k];
      return f.active !== false && fnPlansInPillars(f);
    }).map(function(k){ return { v:"fn:" + k, label:FUNCTIONS[k].name }; }));
}

/* The register's own file, on the People page (§54.3). Its own state rather
   than a second `kind` on IMP: the import page authors a PLAN for one unit,
   this amends the register for everybody, and the two share no step but the
   word "upload". `plan` is what planPeopleFile() read and nothing has been
   written yet — Apply is what writes it. */
var PPLF = { read:"", plan:null, done:null };


/* ── Setup · Companies ──────────────────────────────────────────────
   Its own page since 3.5. It sat above the Business units table, which put two
   different questions on one screen: which units exist, and who is allowed to
   see whom. They are edited at different times by different reasoning, and the
   units table is long enough to push the company rules off the top. */
/* ── Branding (§39) ─────────────────────────────────────────────────
   The tenant's own colours and typeface, for everyone in the tenant. Two
   colours in, seven tokens out — see brandTokens() — and the contrast of every
   derived pair reported as you type, because a brand colour that cannot be
   read is a thing to be told about at the moment you enter it, not discovered
   in a screenshot three weeks later. */
/* The colour the running page is actually painting for a branding slot, as a
   hex a <input type="color"> will accept. Read from the computed style, never
   from a table of literals — the palette is themed and tenant-branded, and a
   second copy of its values is a second thing to keep in step (§25, §53.5). */
function brandNow(key){
  var token = { accent: "--gold", bar: "--panel" }[key];
  if (!token) return "#000000";
  var v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (v.charAt(0) === "#") return v.length === 4
    ? "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3] : v;
  var m = v.match(/\d+/g);
  return m ? "#" + m.slice(0,3).map(function(x){
    return ("0" + (+x).toString(16)).slice(-2); }).join("") : "#000000";
}

function renderBranding(){
  var mayEdit = grant("c_brand") === "edit";
  var b = branding(), checks = brandChecks(), t = brandTokens();
  var set = !!(b.accent || b.bar || b.palette || b.font);

  function swatch(key, label, value, note){
    var shown = value || "";
    return '<tr><td><b>' + esc(label) + '</b><span class="why">' + esc(note) + '</span></td>' +
      '<td class="cc">' + (mayEdit
        ? '<span class="brandpick">' +
            /* AN UNSET PICKER OPENS ON WHAT THE PLATFORM IS PAINTING (§155).
               It opened on #4F46E5 — an indigo that exists nowhere in SMP — so
               an unbranded tenant met two indigo swatches on the one page that
               defines colour, while the product around them was navy and gold.
               `brandNow()` reads the live token rather than repeating a
               literal, so this cannot go stale the day a palette moves (§25). */
            '<input type="color" class="brandcolor" data-brand="' + key + '" value="' +
              esc(shown || brandNow(key)) + '" aria-label="' + esc(label) + '">' +
            '<input type="text" class="fld mono brandhex" data-brandhex="' + key +
              '" value="' + esc(shown) + '" placeholder="not set" spellcheck="false" size="9">' +
            (shown ? '<button class="linkbu" data-brandclear="' + key + '">Clear</button>' : '') +
          '</span>'
        : (shown
            ? '<span class="brandpick"><i class="brandchip" style="background:' + esc(shown) + '"></i>' +
              '<span class="mono">' + esc(shown) + '</span></span>'
            : '<span class="why" style="margin:0">the palette’s own</span>')) +
      '</td></tr>';
  }

  var rows =
    swatch("accent", "Accent", b.accent,
           "The selected tab, the rail’s current pillar, links and every primary control") +
    swatch("bar", "Navigation bar", b.bar,
           "The dark band the units sit on");

  var derived = Object.keys(t).length
    ? '<div class="cfg"><table><thead><tr><th style="width:34%">Derived from those two</th>' +
        '<th style="width:22%">Colour</th><th>Why it is not asked for</th></tr></thead><tbody>' +
      [["--gold-deep","The accent as TEXT","Darkened until a word in it is readable on the page — a fill and a word are not the same job (§38.4)"],
       ["--on-accent","Ink on the accent","Black or white, whichever can actually be read on it. White on the house gold is 2.4:1"],
       ["--panel-ink","Ink on the bar","The same choice, for the bar"],
       ["--panel-quiet","The bar’s quiet ink","The bar mixed toward its own ink — never the page’s, which on a dark bar is 2.5:1"],
       ["--panel-hover","The bar’s hover","One step from the bar toward its ink, so a hover never paints a page colour onto it"]]
      .filter(function(r){ return t[r[0]]; })
      .map(function(r){
        return '<tr><td><b>' + esc(r[1]) + '</b><span class="why mono">' + r[0] + '</span></td>' +
          '<td class="cc"><span class="brandpick"><i class="brandchip" style="background:' + t[r[0]] +
          '"></i><span class="mono">' + t[r[0]] + '</span></span></td>' +
          '<td><span class="why" style="margin:0">' + esc(r[2]) + '</span></td></tr>';
      }).join("") + '</tbody></table></div>'
    : '';

  var checkRows = checks.length
    ? '<div class="cfg"><table><thead><tr><th>What was checked</th>' +
      '<th class="cc" style="width:14%">Ratio</th><th class="cc" style="width:14%">Verdict</th></tr></thead><tbody>' +
      checks.map(function(c){
        var ok = c.ratio >= c.need;
        return '<tr><td><b>' + esc(c.what) + '</b>' +
          (c.note ? '<span class="why">' + esc(c.note) + '</span>' : '') + '</td>' +
          '<td class="cc"><span class="mono">' + c.ratio + ':1</span></td>' +
          '<td class="cc"><span class="pill ' + (ok ? "good" : "bad") + '">' +
            (ok ? "Readable" : "Too close") + '</span></td></tr>';
      }).join("") + '</tbody></table></div>'
    : '';

  /* ── THE GROUP'S MARK (§259) ─────────────────────────────
     FIRST on the page, deliberately. A mark is the most concrete thing a
     tenant has, and the three colour sections under it are one argument
     read in order (the two colours, what follows from them, whether it is
     readable) — dropping the mark into the middle of that would break the
     only sequence on the page.

     THE UNIT MARKS' OWN SHAPE (§52.9), not a second one: a preview, the
     two controls, and the note that says what may be uploaded. Nothing to
     hold apart, so no table — there is one row and one row is not a list. */
  var gm = groupLogo();
  var markBlock = section("", "The group’s mark", null,
    '<p class="why" style="margin:0 0 14px">Shown on any deck that has no mark of its own — ' +
      'a business unit whose own mark has not been uploaded, and every supporting function, ' +
      'which never has one. Large on the cover, small in the footer of every other slide. ' +
      '<b>PNG only</b>, and keep the background transparent: a mark with white behind it paints ' +
      'a box around itself on a dark slide.</p>' +
    '<div class="gmarkrow">' +
      (gm
        ? '<span class="umarkbox"><img class="umarkimg" src="' + esc(gm) + '" alt="' +
            esc(GROUP.org) + '"></span>'
        : '<span class="why" style="margin:0">No mark — a deck with none shows the ' +
            'subject’s name instead, which costs nothing.</span>') +
      (mayEdit
        ? '<div class="rowacts">' +
            '<label class="linkbu umarkpick">' + (gm ? "Replace" : "Upload") +
              '<input type="file" accept="image/png" data-glogo="1" hidden></label>' +
            (gm ? '<button class="linkbu" data-glogoclear="1">Remove</button>' : '') +
          '</div>'
        : '<span class="why" style="margin:0">SMO</span>') +
    '</div>' +
    (LOGO_NOTE ? '<p class="why logonote">' + esc(LOGO_NOTE) + '</p>' : ''));

  return cfgHead("Branding", [], "brand", mayEdit, null) +

    markBlock +

    section("", "The tenant’s colours",
      null,
      '<div class="cfg"><table><thead><tr><th style="width:34%">What it colours</th>' +
      '<th class="cc">Colour</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (mayEdit && set ? '<div style="margin-top:12px"><button class="linkbu" data-brandreset="1">' +
                        'Reset to the shipped palette</button></div>' : '')) +

    (derived ? section("", "What follows from them", null, derived) : "") +

    (checkRows ? section("", "Is it readable?",
      null,
      checkRows) : "") +

    section("", "Typeface", null,
      '<div class="note"><b>The tenant’s face is set with the switch in the top bar for now</b> ' +
      '(§38.7). Four are embedded so they can be compared in the real product; once one is ' +
      'settled it moves here and the rest leave the file.</div>') +

    section("", null, null,
      '<div class="note"><b>Branding is the tenant’s, not the screen’s.</b> It is saved with ' +
      'everything else and is what everyone here sees on opening. Light and dark stay personal — ' +
      'that is about the room somebody is sitting in, not about the brand — and anyone who ' +
      'prefers a different palette on their own screen may still pick one, without changing ' +
      'what anybody else sees.</div>');
}

/* ── The register (§35) ─────────────────────────────────────────────
   Everyone the platform knows, in one table. It replaces the People section
   that used to sit at the bottom of Roles & access — a matrix page is where
   you set what a role may reach, not where you keep a staff list, and putting
   both on one screen is most of why that page reads as exhausting.

   SMO only, at Islam's direction: adding a person creates an identity, and an
   identity is the SMO's to create. The whole page is gated on c_people, which
   only `super` holds.

   PASSWORD STATE IS NOT IN THE STATE GRAPH and never will be — credentials
   live in their own table (§19). The column is filled by a separate ask
   (SYNC.passwordStates) and simply absent when the platform is opened from a
   file, where there are no credentials to have a state. */
var PWSTATES = null;   /* key -> "none" | "temporary" | "set", once asked */

/* ── What somebody said about themselves (§56) ─────────────────────
   Shown under the BU, never instead of it. A declaration is collected at the
   first sign-in and grants nothing at all: this is the SMO reading it and
   deciding, and pressing Use it is an ordinary edit of the person's BU —
   through attachPersonAt(), the same one door the register and the file
   importer both use (§54), and authorised on the server like any other.

   Silent when it agrees with where they already are: a register that
   annotated every row with a note confirming the row would be a register
   nobody reads. */
function saidWhereNote(p, editable){
  var said = saidAt(p.key);
  if (!said || said === personAt(p)) return "";
  /* ── TWO ANSWERS, NOT ONE (§180) ──────────────────────────────────
     "Use it" moves them; "Dismiss" records that you looked and the register
     was already right. Only ONE of them existed until now, so a claim you
     disagreed with had no reply at all — and the Setup Overview had been
     offering "accept or dismiss" the whole time.

     ONCE DISMISSED, Use it STAYS. Changing your mind is accepting, which is
     the same act it always was; there is deliberately no "un-dismiss" button,
     because a second control for "put it back to unanswered" would be a third
     state nobody asked for, and saying it again does that anyway (the server
     clears the answer on a fresh declaration). */
  var done = saidDismissed(p.key);
  return '<span class="why saidwhere' + (done ? " done" : "") + '">They said ' +
    esc(roleWhereLabel(said)) + (done ? " \u2014 dismissed" : "") +
    (editable
      ? ' <button class="linkbu" data-usesaid="' + esc(p.key) + '">Use it</button>' +
        (done ? "" : ' <button class="linkbu" data-dropsaid="' + esc(p.key) + '">Dismiss</button>')
      : '') +
    (SAIDFAIL && SAIDFAIL.key === p.key
      ? '<b class="saidfail">' + esc(SAIDFAIL.why) + '</b>' : '') +
    '</span>';
}
/* And for the same reason, what each person said about where they work (§56):
   a declaration lives outside the state graph, so the register asks for it
   separately and simply has nothing to show from a file. */
var SAIDWHERE = null;  /* key -> the `at` they picked, once asked */

/* ── WHAT THEY SAID, AND WHETHER IT HAS BEEN ANSWERED (§180) ──────────
   Two shapes cross the wire, deliberately (api/auth.js says why): an
   OUTSTANDING claim is the bare string it has always been, and a DISMISSED one
   is `{at, dismissed}`. So a client older than §180 reads every outstanding
   claim exactly as before, and the one shape it cannot understand is the one
   already answered — the safe way round (§58: write the new, read either).

   FIVE PLACES READ THIS — the row's mark, the row's note, the Overview's
   count, the attention queue and the accept handler — and every one of them
   asks these two rather than reaching into the map. A second place that
   unwrapped the shape by hand is exactly how the count and the mark come to
   disagree about the same row (§53.5). */
function saidRaw(key){
  if (!SAIDWHERE || SAIDWHERE.__error) return null;
  return SAIDWHERE[key] || null;
}
function saidAt(key){
  var v = saidRaw(key);
  if (!v) return null;
  return typeof v === "string" ? v : (v.at || null);
}
/* Has the SMO answered it? A string is a claim nobody has replied to. */
function saidDismissed(key){
  var v = saidRaw(key);
  return !!(v && typeof v !== "string" && v.dismissed);
}
/* THE ONE TEST FOR "THIS IS WAITING ON SOMEBODY". Silent agreement is not an
   outstanding item (§56) and neither is an answered claim (§180) — asked here
   once so the mark, the count and the queue can never disagree. */
function saidOutstanding(p){
  if (!p) return false;
  var at = saidAt(p.key);
  return !!at && at !== personAt(p) && !saidDismissed(p.key);
}

/* ── THE THREE COUNTS THE OVERVIEW AND THE REGISTER SHARE (§108.10) ──
   NULL IS "WE HAVE NOT ASKED", AND IT IS NOT ZERO. Both of these depend on a
   server fact fetched separately from the state graph, so there are three
   answers and not two: a number, "nothing waiting", and "we do not know yet".
   §93 is the whole reason — the register reported everybody as having no
   password because a failed ask was being counted as an absence, and the dash
   that replaced it means exactly this null. The Overview draws no row at all
   for a null, which is the same decision one surface further out: a summary
   that prints 0 for a question it never asked is worse than a summary that
   stays quiet.

   EXTRACTED RATHER THAN COPIED. The register computed both inline, which was
   right while it was the only page that wanted them; the Overview exists to
   summarise this page, so a second copy would be two answers to one question
   in the one place a disagreement is guaranteed to be seen (§53.5). */
function noPasswordCount(){
  var live = typeof SYNC !== "undefined" && SYNC.isLive();
  /* A FAILED ASK IS NOT AN ANSWER (§93): PWSTATES carries {__error} when the
     server refused, and counting over it would read every key as absent. */
  if (!live || !PWSTATES || PWSTATES.__error) return null;
  /* COUNTED OVER WHO THIS VIEWER MAY ACTUALLY REACH (§89) — the same set the
     register counts and the same set the server would issue to. */
  return passwordReach().filter(function(p){
    return PWSTATES[p.key] === "none";
  }).length;
}
/* Somebody said where they work and it disagrees with where they are attached
   — which is exactly `saidWhereNote()`'s own test, asked of the whole register
   rather than of one row. Silent agreement is not an outstanding item (§56). */
function saidWhereCount(){
  var live = typeof SYNC !== "undefined" && SYNC.isLive();
  if (!live || !SAIDWHERE || SAIDWHERE.__error) return null;
  /* §180: an ANSWERED claim is not waiting on anybody, and this is the count
     the Overview's row and the rail's pill are both built from — asked through
     saidOutstanding() so it cannot say something different from the mark on
     the row it points at. */
  return PEOPLE.filter(function(p){
    return personActive(p) && saidOutstanding(p);
  }).length;
}

/* ══ WHICH COLUMNS THE REGISTER SHOWS (§47.1) ═════════════════════════
   Islam: "add a columns filter to mark what to show of the columns and make
   the contact unchecked by default."

   THIS IS A PROPERTY OF THE SCREEN, NEVER OF THE STATE GRAPH — §25's rule for
   the theme, and the same reason: autosaving it would decide for everyone in
   the tenant which columns THEY see. localStorage, per browser, like the
   theme and unlike anything the platform reports on.

   `Person` is not in the list. A register with the names hidden is not a
   register, and HR_ERP reaches the same answer by marking `name` non-hideable
   rather than by trusting nobody to untick it. */
var PCOLS_KEY = "smp.people.columns";
/* RENAMED TWICE IN ONE VERSION, and both are Islam's words (§54.1).
   `belongs` → `bu`: "belongs to is not good naming" — a strategy platform's
   word for a part of the business is BU, and the column says which one the
   person opens. `standing` → `status`: it holds Active or Retired, which is a
   status; standing is what a focus measure has.

   THE KEYS MOVED WITH THE LABELS, which costs anybody who has ever opened the
   column chooser their saved preference for those two — an absent key falls
   back to the shipped default (§30.2), and both default to shown, so the worst
   case is a column reappearing rather than one silently gone. */
var PEOPLE_COLS = [
  /* FULL NAME IS A COLUMN OF ITS OWN (§93.8, Islam: "we can have it Name and
     Full Name"). The frozen first column is what somebody is CALLED — two
     names — and this is what the employee file holds. Shown by default,
     because on a register being reconciled against a file it is the value the
     file is written in; hideable, because on an ordinary day nobody reads it.

     It sits immediately after the name rather than with the identifiers: it is
     the same fact at a different length, and putting it beside Emp ID would
     imply it identifies somebody, which is exactly what it must not do. */
  /* OFF BY DEFAULT (§155). Everything above stays true — it is the value the
     employee file is written in, and on a reconciliation day it is the column
     you want. But until somebody types a short name it is IDENTICAL to the
     frozen Name beside it, which today is 33 rows of 33: the register's most
     valuable column, the one a wide table never scrolls away, spent saying
     the same thing twice. One tick in Columns brings it back, and a saved
     choice still wins (§30.2), so nobody who has ever opened the chooser is
     affected. */
  { k:"fullname", label:"Full Name", off:true },
  { k:"empid",    label:"Emp. ID", off:true },
  /* THE SIGN-IN NAME, OFF BY DEFAULT (§69.11). §35 took it out from under the
     name and it was right to: it cost 31 rows a line each to say what the
     sign-in page already knew. Then the sign-in page stopped knowing — the
     door asked for it, it was on a hover title and in one prompt, and the SMO
     could issue a password to somebody who then had no way to discover who
     they were. Sign-in takes the EMAIL now, so this is a diagnostic rather
     than the thing everybody needs: a column you can turn on when somebody
     cannot get in, and nothing at all until then. */
  { k:"key",      label:"Sign-in name", off:true },
  { k:"title",    label:"Job title" },
  { k:"mainbu",   label:"Official BU" },
  /* "Unit", not "BU" (Islam, §65). The column holds a business unit, a
     supporting function or a company — "BU" named a third of what it can
     say, which is why he could read the register and still not see where the
     other two kinds of person sit. The KEY stays `bu`, because a stored
     column preference written before the rename would otherwise fall back to
     the default and reappear for everybody who ever touched the chooser
     (§30.2) — the label is what people read, the key is what code holds. */
  { k:"bu",       label:"Unit" },
  /* ── THE COMPANY, OFF BY DEFAULT (§135.6) ─────────────────────────
     Islam asked for the company beside the unit on the person's own form; the
     register gets the column too, because a value that can be set and never
     read back is half a feature. OFF by default: for most of the register it
     repeats what the Unit column already implies (Mobile is Distribution's),
     and it earns its place only when somebody is looking for the people who
     belong to a company and no unit. */
  { k:"company",  label:"Company", off:true },
  /* TWO COLUMNS, NOT ONE (Islam, 2026-08-24: "the contact in the People
     register table needs to split the email from the contact number").
     §54 put them together as "one answer to one question" — how you reach
     somebody — and that reading stopped being true the day the EMAIL became
     how somebody signs in (§69.11). It is not a contact detail any more; it
     is their name at the door, and it is now the column the SMO reads when
     access does not work. So it gets a column of its own, shown by default,
     and the number keeps one that is off by default. The old `contact` key is
     GONE rather than repurposed: a stored preference for "contact" meant both,
     and silently reading it as "email" would turn one answer into another
     (§30.2, §65). */
  { k:"email",    label:"Email" },
  { k:"phone",    label:"Mobile",  off:true },
  { k:"roles",    label:"Roles" },
  { k:"status",   label:"Status" },
  { k:"password", label:"Password", live:true }
];
var PCOLS = null;      /* {key:bool}, loaded once */

function peopleCols(){
  if (PCOLS) return PCOLS;
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(PCOLS_KEY) || "null"); } catch (e) { saved = null; }
  PCOLS = {};
  /* MERGED, not replaced. A column added later is not in a map written before
     it existed, and reading a missing key as `false` would hide every new
     column from everybody who had ever opened the chooser — §30.2's lesson
     about the access map, one surface further out. */
  PEOPLE_COLS.forEach(function(c){
    PCOLS[c.k] = (saved && typeof saved[c.k] === "boolean") ? saved[c.k] : !c.off;
  });
  return PCOLS;
}
function setPeopleCol(k, on){
  peopleCols()[k] = on;
  try { localStorage.setItem(PCOLS_KEY, JSON.stringify(PCOLS)); } catch (e) {}
}
function showCol(k){ return peopleCols()[k] !== false; }

/* The mark itself, and it NAMES THE OTHER ROWS rather than saying "duplicate".
   "Emp ID 10154 is on two rows" is a fact somebody can act on; a red dot is a
   thing to hunt for — §62's rule about a refusal naming what is in the way,
   applied to a warning. */
function dupeMark(dupes){
  if (!dupes || !dupes.length) return "";
  var WORD = { empId:"Emp ID", email:"Email", name:"Name" };
  /* A RESEMBLANCE IS MARKED DIFFERENTLY FROM A COLLISION (§87.2). The first
     three are two rows holding the same value and are always a fault; this one
     is two rows that LOOK like one person and may well be two. Saying both in
     the same words would either overstate the guess or understate the fault. */
  var near = dupes.filter(function(d){ return d.kind === "likely"; });
  var hard = dupes.filter(function(d){ return d.kind !== "likely"; });
  var out = "";
  if (hard.length) {
    var why = hard.map(function(d){
      var others = d.rows.map(function(x){ return x.name; }).join(", ");
      return WORD[d.kind] + " " + d.value + " is on " +
             plural(d.rows.length, "row") + ": " + others;
    }).join(" \u00b7 ");
    /* ── A MARK, NOT A SENTENCE IN THE NAME COLUMN (§116.4) ────────
       It read "Emp ID twice" beside the name, in the frozen 216px column — so
       any row carrying one wrapped to a second line and stood at 52px against
       its neighbours' 39px. §88's own wrapping fault, in the one column that is
       never scrolled away, and the same shape the declaration note had.

       The words are not lost: the whole of `why` is the hover, and the queue
       says it in full above the fields when it opens the person (§116.2). What
       is on the row is a mark you can see at a glance and run past. */
    out += '<span class="dupemark" title="' + esc(why) + '">&#8214;</span>';
  }
  if (near.length) {
    var names = near[0].rows.map(function(x){ return x.name; });
    out += '<span class="dupemark soft" title="' + esc('This row has no employee number and no ' +
      'address, and the name reads like ' + names.join(", ") + '. If they are the same person, ' +
      'merge the two rows from the \u22ee menu.') + '">&#8776;</span>';
  }
  return out;
}

function renderPeople(){
  var mayEdit = grant("c_people") === "edit";
  /* ── A ROW IS EDITED ON THE ROW (§79.2, spec 012 §2.1) ─────────────
     Islam, after using the whole-table edit: "I don't need to edit the whole
     table — maybe by pressing the 3 dots on the right of the row I can work on
     the row inline and then a small save button."

     He is right and the number says why: whole-table edit turns this register
     into 33 rows x 9 columns = 297 inputs to change one job title, every one of
     them a way to change something by accident, and it repaints the whole table
     to get there.

     `editable` was ONE BOOLEAN read at ten places. It becomes a function of the
     row, and the ten places do not otherwise change — which is the whole reason
     this is a small diff rather than a rewrite. The Add row keeps `mayEdit`:
     adding is not editing a row, and it must be reachable without opening one.

     ROWEDIT holds the key of the one row open. One at a time, because two open
     rows are two unsaved states and a question about which Save means which. */
  var mayEdit_ = mayEdit;
  /* Whether THIS person is the one the dialog has open. The table no longer
     asks — it never edits — but the dialog does, and `ROWEDIT` is still what
     carries the snapshot Cancel restores from (§79.2, §110.6). */
  function rowOpen(p){ return mayEdit_ && rowEditIs("people", p.key); }
  var live = typeof SYNC !== "undefined" && SYNC.isLive() && inOffice();
  /* `retired` was counted here for the header's count line, which §122
     removed. Deleted rather than left standing: a variable nothing reads is
     one the next person reads as load-bearing (§24). Retired is still a row
     state, behind the search. */
  /* COUNTED OVER WHO THIS VIEWER MAY ACTUALLY REACH (§89). A Super user reaches
     everybody; an SMO team member reaches the client's people and not the
     office's — so a count taken over the whole register would promise them a
     number the server is going to shrink (§35: the server picks the set). */
  var reach = live ? passwordReach() : [];
  var noCust = unitsWithoutCustodian();
  /* A FAILED ASK IS NOT AN ANSWER (§93), and the test now lives in
     noPasswordCount() so the Overview counts what this chip counts (§108.10).
     `|| 0` is the coercion this page wants and the Overview does not: here a
     null means "draw no chip", there it means "draw no row". */
  var noPw = noPasswordCount() || 0;

  /* Lifted out of this function 2026-08-23: restoring a person names the
     places their roles were held, and a second copy of this in the shell is
     exactly the drift lib/rules.js exists to prevent. It is roleWhereLabel()
     in config-data.js now, with the reasoning that belongs to it. */
  /* THE REGISTER SAYS IT THE NAVIGATION'S WAY (§93.12). `placeLabel` rather
     than `roleWhereLabel`, and the swap is HERE rather than at each of the
     five call sites below — the drift the alias was extracted to prevent
     (§35) works in this direction too. `roleWhereLabel` stays what the people
     workbook is written in and read against (§65). */
  var whereLabel = placeLabel;

  /* The role cell. Read-only it is a list of what they hold and where; in edit
     it gains an X per role and one add control. Two selects rather than one
     long list of every role-times-place, because "where" depends on which
     role was chosen and a combined list would offer Company CEO of Mobile. */
  /* WHERE THE PERSON SITS, which is not the same question as what a role
     reaches (§46.4). Islam: "we can add the unit/function they belong to".
     It is already on the person — `unit` / `fn`, §33's seat fields — and
     giving it a column of its own is what lets the role chips stop repeating
     it. A person attached to nothing is not "the group": the group is a real
     attachment somebody can hold, so an unattached person gets a dash. */
  /* The KEY the person is attached to, in the same vocabulary `r.at` uses —
     which is what makes "is this role somewhere else?" a comparison of facts
     rather than of two display strings. It was written as a label comparison
     first and every group-level role read as "elsewhere", because belongsLabel
     said "The group" and whereLabel said "the group". Two renderings of one
     fact will always find a way to disagree; compare the fact. */
  /* Lifted into config-data.js as personAt() 2026-08-23 (§54.1). It read
     `p.fn` then `p.unit`, which was complete until a Main BU could point at a
     COMPANY — a person attached to Distribution has neither, and the cell read
     as a dash for somebody who is very much somewhere. The file importer has
     to answer the same question, and two copies of "where does this person
     sit" would find a way to disagree. */
  var belongsKey = personAt;
  function belongsLabel(p){
    var k = belongsKey(p);
    return k ? whereLabel(k) : null;
  }

  /* ── THE CHIPS READ IN THE TABLE AND EDIT IN THE DIALOG (§116) ────
     `editable` was computed here from `rowOpen(p)` for a good reason (a
     parameter the caller forgot would have put an × on a closed row), and the
     reason expired when the table stopped editing: there is no open row now, so
     the answer would always be false and the picker would exist nowhere. It is
     a parameter again — passed false by the row, true by the dialog — and there
     are exactly two callers, both in this file, both named. */
  function roleCell(p, editable){
    var rs = personRoles(p);
    var home = belongsKey(p);
    /* ONE ROLE WIDE, AND THE REST BEHIND A "…" (Islam, 2026-08-22). Most people
       hold one; a handful hold three, and sizing all 31 rows for the handful is
       what made this the widest column on the page. The overflow is a CONTROL,
       not a hover: a hover cannot be reached on a touch screen and cannot be
       read aloud, and this is the only place the second role appears. */
    var openRoles = PROLES === p.key;
    var shownRoles = (rs.length > 1 && !openRoles) ? rs.slice(0, 1) : rs;
    var hiddenRoles = rs.length - shownRoles.length;
    var held = rs.length
      ? shownRoles.map(function(r){
          /* THE CHIP NAMES THE PLACE ONLY WHEN IT IS NOT THE PERSON'S OWN.
             Islam, on Hossam's row: "we don't need finance again. it's
             Function Head" — right, and the rule generalises rather than
             stopping at that row. His own principle is "do not repeat what
             the row already says", and now that Belongs to is a column, the
             attachment IS said already for the ordinary case.

             But dropping it everywhere drops the half that decides access:
             "Strategy custodian" says nothing about WHOSE plan they may
             change, and one person can hold that role over a unit they do not
             sit in. So the place survives exactly where it would otherwise be
             lost — when the role reaches somewhere other than home. The full
             "role · where" is always on the hover, so nothing is hidden, only
             unrepeated. */
          var at = whereLabel(r.at);
          var elsewhere = !home || r.at !== home;
          /* A DERIVED ROLE HAS NO \u00d7 (\u00a7147.7): a Project owner or Pillar owner
             is read off the plan's own Owner rows and a Contributor off being
             named \u2014 there is nothing here to revoke, and an \u00d7 that silently
             does nothing is \u00a796's family. The chip says where the role comes
             from instead, so the way to take it off is findable. */
          var derived = SMPRules.isOwnLinesRole(r.role);
          var tip = roleName(r.role) + " \u00b7 " + at +
            (derived ? " \u2014 comes from being named on the plan; change the Owner there to move it" : "");
          return '<span class="rolechip" title="' + esc(tip) + '">' +
            '<b>' + esc(roleName(r.role)) + '</b>' +
            (elsewhere ? '<span class="rolewhere">' + esc(at) + '</span>' : '') +
            (editable && !derived
              ? '<button class="xbtn" data-prole-off="' + p.key + '|' + r.role + '|' + r.at +
                '" title="Remove this role" aria-label="Remove this role">&times;</button>'
              : '') + '</span>';
        }).join("") +
        (hiddenRoles
          ? '<button class="rolemore" data-proles="' + p.key + '" title="Show ' +
            hiddenRoles + ' more" aria-label="Show ' + hiddenRoles + ' more role' +
            (hiddenRoles === 1 ? "" : "s") + ' for ' + esc(p.name) + '">&hellip;</button>'
          : (openRoles && rs.length > 1
              ? '<button class="rolemore on" data-proles="" title="Show fewer" ' +
                'aria-label="Show fewer roles">&lsaquo;</button>'
              : ''))
      /* NO "NO ROLE" PILL WHILE THE PICKER IS OPEN (Islam, 2026-08-24):
         "remove the no role pill now I'm editing". It is a READING state — it
         answers "what does this person hold" for somebody scanning the
         register — and while the two dropdowns are on screen the answer is
         being typed, not read. */
      : (editable && ADDROLE === p.key ? '' : '<span class="pill none">No role</span>');
    if (!editable) return held;
    /* ── A RETIRED ROW HOLDS NOTHING, SO IT IS NOT OFFERED A ROLE ─────
       `SMPRules.personRoles()` opens with "a retired person holds nothing" and
       returns [] — but the picker was drawn on a retired row anyway, so giving
       one Business unit owner WROTE the grant (the unit's `head` now points at
       them) while the row went on reading "No role": the rule that decides what
       a row SHOWS is not the one the grant went through, and nothing compared
       them.

       Two silent wrongs in one press — nothing said the grant had happened, and
       a unit was left pointed at somebody who cannot sign in, which is exactly
       the state §93.4's custodian count exists to find. Refused where the
       control was, and the refusal says the way out (§62). */
    if (!personActive(p))
      return held + '<span class="rolestop">Retired \u2014 restore this person ' +
        'before giving them a role.</span>';
    /* ── ONE DROPDOWN: THE UNIT CELL ALREADY SAYS WHERE (§110) ───────
       Islam, of the second half this used to draw: "choose where is very
       strange sentence. make it Unit and it's already in a cell what am I
       missing here?"

       Nothing, and it was worse than redundant. `personAtChoices()` — the Unit
       cell's own dropdown — offers the group, every unit, every function and
       every company: item for item the list `roleWheres()` was drawing from, a
       superset of every role's where. And `grantPersonRole()` WRITES IT BACK
       every time — owner and unit custodian set `p.unit`, fnhead sets `p.fn`,
       cceo sets `p.company` — so the second dropdown asked a question the first
       had already answered and then forced its own answer onto it. The two
       could never disagree, because the grant made them agree.

       §69.1's split survives in the half that mattered: the unit selection is
       in the Unit column and the role selection is in Roles. What goes is the
       DUPLICATE, not the arrangement. §46.4's "where somebody sits and where a
       role reaches are two different facts" stayed true of the CONCEPTS and was
       never true of the code.

       AND IT IS WHY THEY NO LONGER BLOCK EACH OTHER (Islam: "the role and the
       unit shouldn't block each other but they only function together"). Two
       ordinary fields on the row, set in either order, neither emptying the
       other; both have to say something before somebody holds a role somewhere,
       and where they cannot agree the row explains it rather than doing
       nothing. */
    var addRole = ADDROLE === p.key;
    return held +
      (addRole
        ? '<select class="fld rolepick" data-prole-pick="' + p.key + '" ' +
            'aria-label="Which role to give ' + esc(p.name) + '">' +
            '<option value=""' + (ADDROLE_KIND ? "" : " selected") + '>Choose a role\u2026</option>' +
            ROLES.filter(function(r){ return roleIsGrantable(r.key); }).map(function(r){
              return '<option value="' + r.key + '"' + (r.key === ADDROLE_KIND ? " selected" : "") +
                '>' + esc(r.name) + '</option>';
            }).join("") + '</select>' + roleStop(p) + seatAsk(p)
        : '<button class="linkbu" data-prole-open="' + p.key + '">+ role</button>');
  }

  /* ── A PICK THAT CANNOT LAND SAYS SO, WHERE IT WAS MADE (§110) ─────
     The one thing the old pair could not do. It committed on the second answer,
     so "not yet" and "never" looked identical from the outside: nothing
     happened, and nothing was said.

     TWO REFUSALS, TWO SENTENCES, because they have different ways out — one
     wants a Unit set at all, the other wants a different KIND of Unit. What
     each role may be held at is still `roleWheres()` and nothing else: this
     asks that list rather than carrying a second opinion about it (§42), and
     only the WORD for a kind is written here.

     `ROLESTOP` is the outcome of the last pick and lives on the screen, never
     on the person (§25.2) — cleared by the pick that succeeds, by opening the
     picker again, and by leaving the row. */
  function roleStop(p){
    if (!ROLESTOP || ROLESTOP.key !== p.key) return "";
    return '<span class="rolestop">' + esc(ROLESTOP.why) + '</span>';
  }

  /* ── ASKING BEFORE A SEAT IS HANDED OVER (§186) ────────────────────
     Islam, from the deployment: *"hussein khaled is a custodian and getting
     the super user … you assured me that it's impossible."* It was not: §92
     grants a one-destination role ON THE PICK, and a seat has exactly one
     destination, so the most powerful grant in the product was a single
     `change` event with nothing in between.

     §92's argument survives for every other role — a door behind a door is a
     broken control — and it was about a role whose second question has one
     answer, never about how much the role is worth. What a seat needs is not
     a second question; it is the first one, asked out loud.

     IT NAMES THE ROLE AND WHAT IT HANDS OVER. The failure mode is landing on
     the wrong line of a dropdown, and a confirmation that does not say which
     line catches none of them. */
  var SEAT_GIVES = {
    super:   "Everything, including who may do what, and this register.",
    smoteam: "Everything the Strategy Office does \u2014 every plan, every cycle, " +
             "and every page of Setup.",
    gceo:    "Every unit and every function in the group, and the group\u2019s own pages.",
    cceo:    "Their whole company, and whatever its settings let them see beyond it."
  };
  function seatAsk(p){
    if (!SEATASK || SEATASK.key !== p.key) return "";
    var r = SEATASK.role;
    return '<div class="seatask"><b>Give ' + esc(p.name) + " " +
      esc(roleName(r)) + '?</b>' +
      '<p>' + (SEAT_GIVES[r] || "") + '</p>' +
      '<p class="why">A seat stays with the person wherever they move \u2014 it is ' +
      'not a job on one plan. They keep the roles they already hold.</p>' +
      '<span class="pdrt">' +
        '<button class="linkbu" data-seatno="1">Cancel</button>' +
        '<button class="linkbu tk-save" data-seatyes="1">Give ' +
          esc(roleName(r)) + '</button></span></div>';
  }

  /* ── THE DECLARATION, AS A MARK (§116.4) ──────────────────────────
     One ring on the value's own line. `.val` is display:block under §88's clip
     rule, so a SIBLING would start a second line and grow the row — which is
     exactly the fault this replaces. Inside it, always. */
  function saidMark(p){
    var said = saidAt(p.key);
    if (!said || said === personAt(p)) return "";
    /* ── TWO MARKS, BECAUSE A COLOUR IS NOT A STATE AT THIS SIZE (§180) ──
       Islam's pick of two drawn answers. The first proposal kept ONE ring and
       shifted it from `--gold-deep` to `--ink-3`, and the mockup killed it:
       the ring is 9.6px wide at 11px type, and at that size the two inks are
       not a difference anybody reads. So the GLYPH carries the state — a solid
       ring for a claim still waiting, a dotted one for a claim answered — and
       the colour follows rather than leads.

       AND THE DOTTED RING WAS MEASURED BEFORE IT WAS CHOSEN (§52, §120.2). A
       font subset maps far more than it draws, so a mark can be mapped and
       ship as a blank box; U+25CC differs from the tofu rectangle by 1.3% of
       its box, which is what says it is drawn. Ink alone could not have
       answered it — an absent glyph renders a hollow rectangle, which has ink
       of its own. */
    var done = saidDismissed(p.key);
    return '<span class="saidmark' + (done ? " done" : "") +
      '" title="They said they work in ' + esc(roleWhereLabel(said)) +
      (done ? ' \u2014 dismissed. Open their row to accept it after all.'
            : '. Open their row to accept or dismiss it.') +
      '">' + (done ? "&#9676;" : "&#9678;") + '</span>';
  }

  /* ══ THE EDITING HALF, IN ONE PLACE (§116) ═══════════════════════════
     Every field the register can change, with its label — rendered into the
     dialog and nowhere else. The table above is values; this is the form.

     THE SAME `data-` ATTRIBUTES AS BEFORE, deliberately: `data-pknown`,
     `data-pname`, `data-pat` and the rest are what `wire()` binds and what
     `fieldSaved()` writes through (§71.2), so moving the fields into a dialog
     changed WHERE they are drawn and nothing about how they save. A rename
     here would have been a second wiring to keep in step.

     TWO GROUPS, because the row answers two different questions and the second
     one is the one with consequences: who this person is, and what they may do.
     `add` drops the fields that cannot exist yet — a person with no key has no
     roles, no password state and no declaration to accept. */
  function personFields(p, add){
    var out = [];
    var F = function(label, html, wide){ out.push({ label:label, html:html, wide:!!wide }); };
    F("Group", "who", false);
    F("Name", '<input class="fld" value="' + esc(p.known || "") + '" data-pknown="' + p.key +
        '" placeholder="' + esc(knownName(p, DNAMES)) + '">');
    F("Full name", '<input class="fld" value="' + esc(p.name) + '" data-pname="' + p.key + '">');
    F("Emp. ID", '<input class="fld" value="' + esc(p.empId || "") + '" data-pempid="' + p.key +
        '" placeholder="Emp. ID">');
    F("Email", '<input class="fld" value="' + esc(p.email || "") + '" data-pemail="' + p.key +
        '" type="email" autocomplete="off" spellcheck="false" placeholder="Email">');
    F("Mobile", '<input class="fld" value="' + esc(p.phone || "") + '" data-pphone="' + p.key +
        '" placeholder="Mobile">');
    /* THE REASON IS ON THE HOVER (§122). It was a two-line paragraph, the
       tallest single thing in the dialog, saying the same sentence on every
       person you open — and the dialog scrolled. It reads as not-editable
       from its own look (`.pdro`, dashed and quiet) rather than from a
       sentence explaining that it is. The words are UNCHANGED, and they are a
       real `title` rather than a `.vwhy` the layout has to make room for. */
    if (!add)
      F("Sign-in name", '<span class="pdro mono" title="Minted from the name. ' +
        'Their password and open sessions are keyed on it, so it cannot be ' +
        'changed.">' + esc(p.key) + '</span>');
    F("Group", "where", false);
    F("Job title", '<input class="fld" value="' + esc(p.title || "") + '" data-ptitle="' + p.key +
        '" placeholder="Job title">', true);
    /* WIDE, SO THE THREE PLACES SIT TOGETHER (§135.6). Adding Company left the
       second block at four fields in a three-column grid — a row of three and
       a row of one, which is the empty cell §122 spent a redesign removing.
       Job title is a free-text field and reads fine across the width; Official
       BU, Unit or function and Company are the three answers to one question
       and now sit side by side, which is where somebody compares them. */
    /* THE CLIENT'S OWN WORD, and a name not on the list is KEPT rather than
       refused — a fresh tenant could never read its first file otherwise
       (§22's locked-dropdown trap, §54). */
    F("Official BU", '<select class="fld" data-pmainbu="' + esc(p.key) + '">' +
        '<option value="">&mdash; none &mdash;</option>' +
        mainbuNamesFor(p).map(function(nm){
          return '<option value="' + esc(nm) + '"' +
            (mainbuKey(nm) === mainbuKey(p.mainbu) ? " selected" : "") + '>' + esc(nm) + '</option>';
        }).join("") + '</select>' +
      (p.mainbu && !mainbuBy(p.mainbu)
        ? '<span class="vwhy">not on the Official BU list</span>' : ''));
    var drift = mainbuDrift(p);
    /* "Unit or function", because that is what it holds now — the companies
       moved to the field below it (§135.6). */
    F("Unit or function", '<select class="fld" data-pat="' + esc(p.key) + '">' +
        '<option value="">&mdash; nowhere yet &mdash;</option>' +
        personAtChoices().map(function(o){
          return '<option value="' + esc(o.v) + '"' +
            (o.v === belongsKey(p) ? " selected" : "") + '>' + esc(o.label) + '</option>';
        }).join("") + '</select>' +
      (drift && drift !== belongsKey(p)
        ? '<span class="vwhy">the Official BU list says ' + esc(whereLabel(drift)) + '</span>' : '') +
      saidWhereNote(p, true));
    /* ── AND THE COMPANY, WHICH IS SOMETIMES THE UNIT'S ANSWER (§135.6) ──
       Read-only wherever the unit above has already answered it, writable
       where nothing else has — so a person in Mobile reads "Distribution" and
       cannot be moved to another company behind their unit's back, and the CEO
       who belongs to a company and no unit is written here. */
    var derived = personCompanyDerived(p), co = personCompany(p);
    F("Company", '<select class="fld" data-pco="' + esc(p.key) + '"' +
        (derived ? ' disabled' : '') + '>' +
        '<option value="">&mdash; none &mdash;</option>' +
        companyChoices().map(function(o){
          return '<option value="' + esc(o.v) + '"' +
            (o.v === co ? " selected" : "") + '>' + esc(o.label) + '</option>';
        }).join("") + '</select>' +
      (derived
        ? '<span class="vwhy">from the unit above</span>'
        : ''));
    if (!add) F("Roles", '<span class="rolebox rolebox-wide">' + roleCell(p, true) + '</span>', true);
    return out;
  }
  /* The dialog's body. `groups` is a marker rather than a field, so the two
     headings cannot drift out of step with what sits under them. */
  /* ── AND THE ISSUE IS DRAWN ON THE BOX THAT ANSWERS IT (§190) ─────
     Islam: "attention items that stays attention item is a problem — always
     give me the option to dismiss, and make generally the dismiss under the
     box with the issue and mark the issue box with some sort of surrounding
     outline to make sure I understand what is the issue."

     Both halves of that are one argument. §116.2 made the queue open each
     person in this dialog and print the sentence ABOVE the fields, which says
     what is wrong and leaves nine boxes to guess between — and the two items
     that name a place ("they hold Super user over the group", "the Official BU
     list says Retail Stores") read as being about whichever box you look at
     first. The outline is the address.

     ONE MARKUP FOR EVERY KIND. `attentionOf()` hands each entry the FIELD it
     is about, so a kind added later is outlined the day it is added and there
     is no list here to forget (§104.7's rule, on a render).

     A KIND WITH NO FIELD IS SAID, NEVER DROPPED. "They have never been issued
     a password" is answered from the header's Passwords menu, not from a box
     in this dialog, so it goes in a block of its own at the end — dismissible
     like the rest, because an item that can only be left standing is exactly
     what he is describing. */
  function attnFor(p){
    var a = p && p.key ? attentionOf(p) : null;
    var by = {};
    (a ? a.why : []).forEach(function(w){
      var k = w.at || "";
      (by[k] = by[k] || []).push(w);
    });
    return by;
  }
  function attnBlock(p, list){
    return list.map(function(w){
      return '<div class="attnsay">' + esc(w.say) +
        (w.own ? '' :
          ' <button class="linkbu attndrop" data-attnoff="' + esc(p.key) +
          '" data-attnkind="' + esc(w.kind) + '">Dismiss</button>') +
        '</div>';
    }).join("");
  }
  function personFieldsHtml(p, add){
    /* NEVER ON THE ADD FORM: a person who is not on the register yet has no
       row for anything to be outstanding about, and attentionOf() would be
       asked about a draft (§116's NEWDRAFT). */
    var by = add ? {} : attnFor(p), drawn = {};
    var body = personFields(p, add).map(function(f){
      if (f.label === "Group")
        return '<div class="pdsect">' + (f.html === "who"
          ? "Who they are" : "Where they sit, and what they may do") + '</div>';
      var mine = by[f.label] || [];
      if (mine.length) drawn[f.label] = 1;
      return '<div class="pdf' + (f.wide ? ' wide' : '') +
        (mine.length ? ' attn' : '') + '">' +
        '<div class="pdfl">' + esc(f.label) + '</div>' + f.html +
        (mine.length ? attnBlock(p, mine) : '') + '</div>';
    }).join("");
    /* What no field can answer, and anything whose field this person's form
       does not draw — said in full rather than counted and hidden. Asked of
       what was ACTUALLY drawn, never of the label list, or a field the form
       omits for this person takes its issue silently with it (§61). */
    var loose = [];
    Object.keys(by).forEach(function(k){
      if (!drawn[k]) loose = loose.concat(by[k]);
    });
    return '<div class="pdlg">' + body +
      (loose.length
        ? '<div class="pdf wide attn attnloose">' + attnBlock(p, loose) + '</div>'
        : '') + '</div>';
  }

  /* roleWhereCell() was here. It drew the picker's second half — "Choose
     where\u2026" — in the Unit column, and §110 deleted it rather than renaming
     it: the cell's own dropdown already answers that question and the grant
     already writes the answer back, so the two could never disagree. Removed
     with its call site rather than left returning "" (§24), because a function
     nothing calls is one the next reader has to prove is dead before touching
     anything near it.

     It also carried a bug worth remembering. `.cfg table td` is
     `white-space:nowrap` (§88's one-line standard), so the cell laid its two
     controls SIDE BY SIDE rather than stacking them: the second started 150px
     into a 158px cell, ran 133px past its own right edge and landed under the
     Email field, which took every click. Present, enabled, correctly sized and
     unreachable — §93.4 for the third time, and invisible to every check in the
     suite, because all of them ask whether a control is in the document.
     `elementFromPoint` at its own centre returned the Email input. */

  /* contactCell() was here. It stacked the address over the number in one
     cell, and the two are two columns now (§69.16) — a function nothing calls
     is a function the next reader has to prove is dead before touching
     anything near it (§24). */

  /* STATUS ONLY, AND SQUEEZED (Islam, 2026-08-22). The action left this cell
     for the row's kebab; what is left is one word in one pill, so the column
     is 76px instead of 150. "Temporary" becomes "Temp" for the same reason —
     three states that have to be told apart at a glance, not read. */
  /* ── AN ADDRESS AND A NUMBER ARE THERE TO BE USED (§93.6) ─────────
     Islam: "make the email and the phone to be copied on clicking on them."
     They are the two values on this register that always leave it — into a
     mail client, into a phone — and selecting text inside a horizontally
     scrolling table with a frozen column is a drag that starts a scroll.

     A BUTTON, NOT A SPAN WITH A HANDLER. It is a real action, so it takes a
     real control: keyboard-reachable, announced, and carrying its own hint.
     It is styled to LOOK like the value rather than like a control, though —
     `linkbu` was the first go and put an accent underline on every row of the
     register, which reads as a table of links to somewhere.

     Empty stays a dash — there is nothing to copy, and a button that copies
     "" would report success for doing nothing. */
  function copyable(v, cls){
    if (!v) return '<span class="why" style="margin:0">&mdash;</span>';
    /* THE VALUE IS IN THE TITLE, not just the hint. §88's clipTitles() only
       fills a title that is empty, so a bare "Click to copy" would have taken
       the hover away from exactly the values too long to read — which is the
       one case the hover exists for. Both, in one string. */
    return '<button class="copyval ' + cls + '" data-copy="' + esc(v) +
      '" title="' + esc(v) + ' \u00b7 click to copy">' + esc(v) + '</button>';
  }

  function pwCell(p){
    if (!live) return '';
    if (!personActive(p)) {
      return '<td class="cc"><span class="why" style="margin:0">&mdash;</span></td>';
    }
    /* AND A DASH IS NOT AN ERROR EITHER (§93). Islam, on a column that had
       gone all dashes: "some people already changed the passwords, the all -s
       are not actual." They were not: the ask never happened. When it happens
       and FAILS, the column says so — a dash that means "we could not find
       out" is indistinguishable from one that means "not asked yet", and both
       read as "no password" to whoever is looking. */
    if (PWSTATES && PWSTATES.__error) {
      return '<td class="cc"><span class="pill bad" title="' +
        esc(PWSTATES.__error) + '">unreadable</span></td>';
    }
    var st = PWSTATES ? PWSTATES[p.key] : null;
    /* Absent is not "none" (§35): a person the server has not been asked about
       yet has no state, and a dash says so rather than claiming they have no
       password. */
    var pill = st === "set"       ? '<span class="pill good">Set</span>'
             : st === "temporary" ? '<span class="pill warn">Temp</span>'
             : st === "none"      ? '<span class="pill none">None</span>'
             : '<span class="why" style="margin:0">&mdash;</span>';
    return '<td class="cc">' + pill + '</td>';
  }

  /* ── THE ROW'S ACTIONS, IN ONE MENU AT THE END OF THE ROW ──────────
     Islam: "we have a vertical 3 dots at the end of row on the right with the
     actions like reset password."

     It fixes more than the height it saves. Every per-person action used to
     need a column of its own — that is how Password came to be 150px wide to
     hold one word and one link, and how View as ended up duplicating the
     switcher in the top bar. A menu is where the NEXT one goes too.

     Open state is a single key, not a flag per row: two menus open at once is
     a state nobody wants and one that has to be closed twice. */
  /* ── ALWAYS THE MENU NOW (§116) ───────────────────────────────────
     The Save/Cancel branch went with inline editing: those two acts live at the
     foot of the dialog, where the fields are. What is left is one shape for
     every row, which is also 84px of column the register gets back — the
     actions cell used to widen from 49px to 133px the moment a pen was pressed
     (§110.8), and now it never does. */
  function kebab(p){
    var open = PMENU === p.key;
    var st = PWSTATES ? PWSTATES[p.key] : null;
    /* THE ORDER IS WRITTEN DOWN, not produced by splicing into an index. The
       first version inserted "Edit details" at position 1, which is second
       only while "Reset password" is present — from a file there are no
       credentials, so it silently became second-after-"View as". A list whose
       order depends on which items happened to qualify is a list that reorders
       itself for some viewers.

       EDIT DETAILS was in the approved mockup and did not make the first
       build; Islam caught it. It turns the page's edit mode on and puts the
       cursor in THIS person's name rather than inventing a per-person modal:
       the page already has one edit mode, and a second way to edit the same
       row is a second place for the two to disagree. */
    var acts = [];
    /* WHOSE PASSWORD, NOT WHICH ACT (§89). The SMO team may let anybody on the
       client's side in and may not touch the office's own — a Super user's or
       another team member's. The entry is absent on those rows rather than
       disabled: a disabled control on somebody else's row invites a press and
       has nowhere to put "because of who they are, not who you are". */
    if (live && personActive(p) && mayIssuePasswordTo(p)) {
      acts.push('<button data-setpw="' + p.key + '">' +
        (st === "none" || !st ? "Set a password" : "Reset password") + '</button>');
    }
    if (mayEdit) {
      acts.push('<button data-pedit="' + p.key + '">Edit details</button>');
    }
    if (personActive(p)) {
      acts.push('<button data-as="' + p.key + '">View the platform as them</button>');
    }
    /* MERGE IS NOT A DESTRUCTIVE ACTION AND DOES NOT SIT WITH THEM (§87.4).
       Retire and Delete are below the rule because they take something away;
       merging two rows that were always one person takes nothing away, and it
       is the ordinary fix for what the marks on this row are pointing at. */
    if (mayEdit && personActive(p)) {
      var cands = mergeCandidates(p.key, DUPES);
      acts.push('<button data-pmerge="' + p.key + '">Merge with another row' +
        (cands.length === 1 ? ' (' + esc(shortName(cands[0].person.name)) + ')' : '\u2026') +
        '</button>');
    }
    if (mayEdit) {
      acts.push('<hr>');
      acts.push('<button class="danger" data-pact="' + p.key + '">' +
        (personActive(p) ? "Retire this person" : "Restore this person") + '</button>');
      /* ── DELETE, AND THE REFUSAL IS WHERE THE CONFIRMATION WOULD BE ──
         §62's shape, because it is the same job on a different table: the
         entry is always LIVE rather than shown disabled, and pressing it
         either asks the question or names what is in the way. A disabled item
         in a menu has nowhere to put the reason — the menu is 240px wide and
         the reason is a sentence naming a unit and a page (§59). */
      /* DELETING IS THE SUPER USER'S (§89). Retiring stays — it is reversible
         and keeps every attribution true — so the office loses nothing it
         needs day to day. The entry is ABSENT rather than disabled: §62's
         disabled-with-the-reason is right where the reason is about THIS row,
         and this reason is about the person reading it. */
      if (mayDestroy())
        acts.push('<button class="danger" data-pdel="' + p.key + '">Delete permanently</button>');
    }
    if (!acts.length) return '<td class="cc kebcell"></td>';
    /* THE CELL WITH A PANEL OPEN HAS TO OUTRANK THE CELLS BELOW IT (§69.22).
       Freezing this column (§69.20) gave every actions cell `position:sticky`
       and a z-index, which makes each one its own STACKING CONTEXT — so the
       menu's `z-index:40` is resolved inside its cell, and the sticky cells of
       every LATER row, being later in the DOM at the same level, paint on top
       of it. The panel was drawn correctly and buried under the rows beneath
       it, which is why it read as clipped.

       The open row's cell is lifted instead of raising the menu: the menu's
       own z-index cannot escape a context its parent created. */
    var lifted = open || PDEL === p.key || PSETPW.key === p.key;
    return '<td class="cc kebcell' + (lifted ? " lifted" : "") + '">' +
      '<button class="kebab' + (open ? " open" : "") + '" data-pmenu="' + p.key + '" ' +
      'aria-haspopup="true" aria-expanded="' + open + '" ' +
      'title="Actions" aria-label="Actions for ' + esc(p.name) + '">' +
      '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<circle cx="10" cy="4.6" r="1.5"/><circle cx="10" cy="10" r="1.5"/>' +
      '<circle cx="10" cy="15.4" r="1.5"/></svg></button>' +
      (open ? '<div class="kmenu">' + acts.join("") + '</div>' : '') +
      deletePanel(p) + pwPanel(p) + '</td>';
  }

  /* ── THE PASSWORD PANEL (§69.22) ────────────────────────────────
     Where the prompt was. It replaces the menu in the same corner, the way
     the delete question does, so the second press lands where the first one
     did (§46.2).

     THE RULES ARE THE SERVER'S AND ARE NOT RESTATED AS A CHECK. They are
     printed so somebody can read them before typing, and the only thing that
     REFUSES is `auth.passwordPolicy` on the server, whose sentence is shown
     verbatim. A second copy of the policy here would be a rule in two places,
     and the two would drift the first time either moved (§42).

     AND THE PASSWORD IS SHOWN AFTER IT IS SET, which the prompt could never
     do: an issued password exists to be read out to somebody, and the SMO had
     to remember what they had just typed into a dialog that was already gone. */
  function pwPanel(p){
    if (PSETPW.key !== p.key) return "";
    if (PSETPW.done) {
      return '<div class="kmenu kconfirm pwset"><div class="cq">' +
        '<b>Done \u2014 ' + esc(p.name) + ' signs in with this once.</b> ' +
        'They are asked to choose their own straight afterwards, so it stops ' +
        'working the moment they do.</div>' +
        '<div class="pwout"><code class="mono" id="pwset-done">' + esc(PSETPW.done) +
          '</code><button class="linkbu" data-pwcopy="1">Copy</button></div>' +
        '<div class="cbtns"><button data-pwcancel="1">Close</button></div></div>';
    }
    return '<div class="kmenu kconfirm pwset"><div class="cq">' +
      '<b>A temporary password for ' + esc(p.name) + '.</b> ' +
      'Type one or generate it \u2014 they choose their own the first time they use it.</div>' +
      '<div class="pwrow">' +
        '<input class="fld" id="pwset-field" type="text" autocomplete="off" ' +
          'spellcheck="false" autocapitalize="none" placeholder="Temporary password" ' +
          'aria-label="Temporary password for ' + esc(p.name) + '" value="' + esc(PSETPW.pw) + '">' +
        '<button class="linkbu" data-pwgen="1">Generate</button>' +
      '</div>' +
      '<div class="pwrule">At least 8 characters, with an uppercase letter, a ' +
        'number and a special character.</div>' +
      (PSETPW.err ? '<div class="picerr">' + esc(PSETPW.err) + '</div>' : '') +
      '<div class="cbtns">' +
        '<button data-pwcancel="1">Cancel</button>' +
        '<button class="danger" data-pwset="' + esc(p.key) + '">Set it</button>' +
      '</div></div>';
  }

  /* The question, or the reason there is no question. It replaces the menu in
     the same corner, so the second press lands where the first one did — the
     same placement the clear-plan confirmation uses (§46.2).

     BLOCKERS ARE RE-ASKED ON YES, in deletePerson(), and never trusted from
     the render that drew this (§48.2). What is drawn here is what to READ;
     what is enforced is asked again at the moment it matters. */
  function deletePanel(p){
    if (PDEL !== p.key) return "";
    var blockers = personDeleteBlockers(p.key);
    if (blockers.length) {
      return '<div class="kmenu kconfirm"><div class="cq">' +
        /* NO "There is/are" LEAD-IN. It was chosen by how many BLOCKERS there
           are and the blocker itself opens with a count of its own, so one
           blocker naming two roles read "There is 2 roles still held". The
           blockers are sentences; they do not need introducing. */
        '<b>' + esc(p.name) + ' cannot be deleted.</b> ' +
        blockers.map(function(b){ return b.full; }).join('; and ') + '.' +
        ' <b>Retire</b> closes the door and keeps every attribution true.</div>' +
        '<div class="cbtns"><button data-pdel-no="1">Close</button></div></div>';
    }
    var takes = personDeleteTakes(p.key);
    var named = personNamedLines(p.key);
    return '<div class="kmenu kconfirm"><div class="cq">' +
      '<b>Delete ' + esc(p.name) + ' for good?</b> This takes ' +
      takes.join(", ").replace(/, ([^,]*)$/, " and $1") + '. It cannot be undone.' +
      (named
        ? ' Their name stays where the plan types it (' + plural(named, "line") +
          ') \u2014 those are text, not a link to this row.'
        : '') +
      '</div><div class="cbtns">' +
        '<button data-pdel-no="1">No</button>' +
        '<button class="danger" data-pdel-yes="' + esc(p.key) + '">Yes, delete</button>' +
      '</div></div>';
  }

  /* THREE COLUMNS THAT WRAP, ONE THAT CLIPS, AND THE ACTIONS AT THE END
     (Islam, 2026-08-22). Name, job title and contact are given room and allowed
     to wrap — they are what you scan the register FOR. Roles clip to their
     column, because a person with three of them was making a 90px row for
     information the hover can carry.

     The key is gone from under the name. It is the username, it is generated
     from the name, and it was costing 31 rows a line each to say what the
     sign-in page already knows. It is still on the row's hover. */
  /* ── COMPUTED BEFORE THE ROWS THAT READ IT (§81.2) ─────────────────
     It sat with the other counts two hundred lines below the row map, and
     `var` hoists the declaration without the value — so every row read
     `undefined` and the first person with no employee number and no address
     threw, because the first two tests short-circuited past it and the third
     did not. A "one fact, three surfaces" helper has to be computed before the
     first surface, not beside the last. */
  var DUPES = registerDupes();
  var DNAMES = displayNames();
  /* ── THE DIALOG'S THREE ENTRY POINTS, PUBLISHED (§116) ─────────────
     `personDialogHtml`, its foot and its title live inside this render because
     they use its helpers — `roleCell`, `belongsLabel`, `personFields` and this
     `DNAMES` — and lifting them out would mean lifting all four with them, or
     passing a bag of functions to each call.

     So the shell reaches them through one holder, assigned on every People
     paint. Two things make that safe rather than fragile: the controls that
     open the dialog exist ONLY on this page, so it cannot be opened before this
     line has run; and the closures capture the variables rather than their
     values, so a later paint hands the dialog the register as it now stands. */
  PEOPLEDLG = { html:personDialogHtml, foot:personDialogFoot, title:personDialogTitle };
  var dupRows = PEOPLE.filter(function(p){
    return personActive(p) && personDupe(p, DUPES).length; }).length;
  var dupId = Object.keys(DUPES.empId).length;
  var dupName = Object.keys(DUPES.name).length;
  var likely = (DUPES.likely || []).length;
  /* ── A ROW NOTHING CAN MATCH (§87.3) ──────────────────────────────
     Counted over active rows only, like every other count on this header: a
     retired row is not what the next upload is going to fail to find.

     AND SAID ONLY WHERE IT DISTINGUISHES SOMEBODY. A register nobody has ever
     uploaded a file to has no employee numbers and no addresses at all, and a
     warning naming every row on it is a warning about nothing — §45.2 turned
     round. What is worth pointing at is the handful of rows that were typed in
     beside five hundred that came from the file. */
  var identified = PEOPLE.filter(function(p){
    return personActive(p) && personIdentified(p); }).length;
  var noIdent = !identified ? 0 : PEOPLE.filter(function(p){
    return personActive(p) && !personIdentified(p); }).length;

  /* ── THE TABLE READS. THE DIALOG WRITES (§116) ────────────────────
     Islam: "the edit button can open a pop up modal with the data rather than
     inline."

     Every cell below used to be `ed ? <field> : <value>`, and that one ternary
     is where the whole of §110 came from: a field in a 158px cell, under a
     frozen column, beside a picker whose second half had nowhere to go. The
     rows are values now and nothing else — no inputs, no selects, no Save and
     Cancel column, no Add row. `personFields()` is the editing half, drawn
     once, in a dialog with room.

     WHAT THIS BUYS BEYOND TIDINESS: a read-only table can be as wide as its
     columns need. Every collision this register has had — §110's + role under
     Cancel, the Add row's three boxes under the wrong headings, the fields
     painting over their neighbours — was a control being clicked inside a
     cell, and none of them survives the move. */
  var rows = PEOPLE.map(function(p, i){
    var home = belongsLabel(p);
    var drift = mainbuDrift(p);
    /* THE FILTERS READ ATTRIBUTES, NOT THE RENDERED TEXT. "Active" is a fact
       about the person; the word "Active" may not be in the row at all, because
       the Status column can be turned off under Columns. A filter that searched
       the visible text would answer differently depending on which columns
       somebody had hidden. */
    var dupes = personDupe(p, DUPES);
    var flags = (personActive(p) ? "active" : "retired") +
      (live && PWSTATES && PWSTATES[p.key] === "none" ? " nopw" : "") +
      (String(p.email == null ? "" : p.email).trim() ? "" : " noemail") +
      (personIdentified(p) ? "" : " noident") +
      (dupes.length ? " dupe" : "");
    return '<tr data-tkrow="' + esc(flags) + '" class="' +
             (personActive(p) ? '' : 'retired') + '">' +
      '<td class="idx">' + (i + 1) + '</td>' +
      /* `pname` so the frozen column can be named rather than counted (§69.19).
         `td:nth-child(2)` would be right today and wrong the first time a
         column is added before it. */
      '<td class="namecell" title="' + esc(p.name) + ' · ' + esc(p.key) + '">' +
        /* INSIDE THE <b>, NEVER BESIDE IT. §88 makes `b` in a setup cell
           display:block, so a mark placed after it starts a second line and the
           row grows — measured at 51px against its neighbours' 39px. It is the
           third time in this section that a thing put NEXT TO a value landed
           under it (the declaration note, the Official BU disagreement, this),
           and the rule is the same each time: a mark belongs inside the block
           it marks. */
        '<b>' + esc(knownName(p, DNAMES)) + dupeMark(dupes) + '</b></td>' +
      (showCol("fullname")
        ? '<td><span class="val">' + esc(p.name) + '</span></td>' : '') +
      (showCol("empid") ? '<td>' + (p.empId
        ? '<span class="mono">' + esc(p.empId) + '</span>'
        : '<span class="why" style="margin:0">&mdash;</span>') + '</td>' : '') +
      /* READ-ONLY WHEREVER IT APPEARS. The key is minted (§35) and it is what
         `credentials` and `sessions` are keyed on — it is shown so somebody can
         be TOLD it, never so it can be changed. */
      (showCol("key") ? '<td><span class="mono">' + esc(p.key) + '</span></td>' : '') +
      (showCol("title") ? '<td>' + (p.title
        ? '<span class="val">' + esc(p.title) + '</span>'
        : '<span class="why" style="margin:0">&mdash;</span>') + '</td>' : '') +
      /* ── A DISAGREEMENT IS A MARK TOO (§116.4) ─────────────────────
         Both notes this cell and the next could add — "not on the Official BU
         list", "the list says Retail Stores" — were a SECOND LINE under a
         value, so any row carrying one stood at 51px against its neighbours'
         39px. Exactly what the declaration note and the duplicate mark were
         doing, and exactly the same answer: one glyph on the value's own line,
         the whole sentence on the hover.

         `≠` rather than a warning colour: these two say the register and the
         client's own list DISAGREE, which is a thing to know rather than a
         thing that is broken. */
      (showCol("mainbu") ? '<td>' + (p.mainbu
        ? '<span class="val">' + esc(p.mainbu) +
          (mainbuBy(p.mainbu) ? '' : '<span class="driftmark" title="' + esc(p.mainbu) +
            ' is not on the Official BU list.">&ne;</span>') + '</span>'
        : '<span class="why" style="margin:0">&mdash;</span>') + '</td>' : '') +
      /* ── THE DECLARATION IS A MARK, NOT A SENTENCE (§116.4) ─────────
         Islam: the note "appears glitched and grows the row size with the word
         use it." It did: "They said Retail Stores — Use it" is a second line in
         a 150px cell, so every row carrying one stood at 57px beside its
         neighbours' 39px — §88's own wrapping fault, arriving by a road §88 did
         not walk.

         A mark on the value's own line instead, with the whole sentence on the
         hover — the shape §87 already uses for a duplicate. The ACT moves to
         where acts now live: the dialog, reached from the attention queue,
         which is also what makes it findable rather than something to spot. */
      (showCol("bu") ? '<td>' + (function(){
          var marks = saidMark(p) + (drift && drift !== belongsKey(p)
            ? '<span class="driftmark" title="' + esc(p.mainbu || "") + ' points at ' +
              esc(whereLabel(drift)) + ' on the Official BU list.">&ne;</span>' : '');
          return home
            ? '<span class="val">' + esc(home) + marks + '</span>'
            : '<span class="why" style="margin:0">&mdash;' + marks + '</span>';
        })() + '</td>' : '') +
      (showCol("company") ? '<td>' + (function(){
          var ck = personCompany(p);
          return ck
            ? '<span class="val">' + esc(COMPANIES[ck].name) + '</span>'
            : '<span class="why" style="margin:0">&mdash;</span>';
        })() + '</td>' : '') +
      (showCol("email") ? '<td class="wrapany">' + copyable(p.email, "val") + '</td>' : '') +
      (showCol("phone") ? '<td>' + copyable(p.phone, "mono") + '</td>' : '') +
      (showCol("roles")
        ? '<td class="roles"><span class="rolebox">' + roleCell(p, false) + '</span></td>' : '') +
      (showCol("status")
        ? '<td class="cc"><span class="pill ' + (personActive(p) ? "good" : "none") + '">' +
          (personActive(p) ? "Active" : "Retired") + '</span></td>' : '') +
      (showCol("password") ? pwCell(p) : '') +
      kebab(p) + '</tr>';
  }).join("");

  var cols = 3 + PEOPLE_COLS.filter(function(c){
    return showCol(c.k) && (!c.live || live);
  }).length;
  /* ── ADD ASKS FOR AN IDENTIFIER, AND DOES NOT INSIST (§87.3) ───────
     Three fields where there was one. Neither identifier is required — the SMO
     often knows a name and a role and nothing else, and a door that demanded
     an employee number would mean a unit could not be given its head until HR
     replied — but a row with neither is marked on the register the moment it
     exists, because that is the row the next upload cannot match.

     THE STOP IS SHOWN IN THE ROW IT WOULD HAVE ADDED. A number or an address
     already here means the person is already here, and the answer is almost
     never "add them again": the line names them, offers their row, and keeps
     Add anyway for the case where it really is a coincidence somebody has
     checked. */
  /* THE ADD ROW LEFT THE TABLE (§116.3). It was one cell spanning nine columns
     with three boxes laid out inside it, so not one of them sat under its own
     heading: `Full name` ran across Name, Full Name, Job title and Official BU;
     `Emp ID` sat under a column headed UNIT; `Email` spanned six and ended
     under the frozen actions column, which clipped it. A reader maps a field to
     the heading above it, and every one of those mappings was wrong.

     `+ Add someone` is in the header and it opens the same dialog Edit opens,
     with the fields empty (§116.3) — so the warning that somebody is already on
     the register (§87.3) has room to be read, which in a table row it never
     did. */
  var addRow = "";

  /* ══ THE PERSON DIALOG (§116) ════════════════════════════════════════
     Three ways in and one body: the ⋮'s Edit details, `+ Add someone`, and the
     attention queue. They differ in what is said ABOVE the fields and which two
     buttons sit below them — never in the fields themselves, because a form
     that is subtly different depending on how you reached it is two forms.

     IT IS THE PLATFORM'S OWN DIALOG (§90): `openModalHtml` makes the page
     behind inert, returns focus to whatever opened it, and closes on Escape.
     Nothing new to design, and the queue's "Save & next" is the same mechanism
     the merge wizard already uses to move between steps (§90.4).

     PDLG holds which person is open and why. It is screen state and never the
     tenant's (§25.2). */
  function personDialogHtml(){
    if (!PDLG) return "";
    var p = personBy(PDLG.key);
    if (!p) return "";
    var add = PDLG.mode === "add";
    /* §116.2's BAND WENT WHEN THE FIELDS LEARNED TO SAY IT (§190). It printed
       the queue's sentences above the form, which said what was wrong and left
       nine boxes to guess between — and the two items that name a place read
       as being about whichever box you looked at first. The sentence now sits
       under the control that answers it, with the outline saying which. Two
       copies of one sentence is worse than either (§53.5), and it was the
       queue's ALONE, so somebody who reached the same row through Edit details
       was told nothing at all. */
    var stop = add && NEWPERSON.hit
      /* ── THE STOP, AND THE ONE WAY PAST IT (§87.3) ────────────────
         Never "add them again": it names who is already here, offers their row,
         and keeps Add anyway for the case where it really is a coincidence
         somebody has checked. A stop any further press gets through is a
         message that goes away by itself. */
      ? (function(){ var h = personBy(NEWPERSON.hit);
          return '<div class="pdband bad"><span><b>' + esc(h ? h.name : NEWPERSON.hit) +
            ' is already on the register</b> with that ' +
            (NEWPERSON.hitBy === "empId" ? "employee number" : "address") + '.</span>' +
            '<span class="pdways">' +
            '<button class="linkbu" data-pgo="' + esc(NEWPERSON.hit) + '">Open their row</button>' +
            '<button class="linkbu" data-pdlg-anyway="1">Add anyway as a new person</button>' +
            '</span></div>'; })()
      : add && NEWPERSON.warn
      ? (function(){ var w = personBy(NEWPERSON.warn);
          return '<div class="pdband"><span><b>' + esc(w ? w.name : NEWPERSON.warn) +
            '</b> is already here and the name reads the same. Add if they are two ' +
            'people; if not, give the role to them instead.</span></div>'; })()
      : "";
    return stop + personFieldsHtml(p, add);
  }
  function personDialogFoot(){
    if (!PDLG) return "";
    if (PDLG.mode === "add")
      return '<span class="why" style="margin:0">Only a name is needed. Everything ' +
        'else can wait.</span><span class="pdrt">' +
        '<button class="linkbu" data-pdlg-close="1">Cancel</button>' +
        '<button class="linkbu tk-save" data-pdlg-add="1">Add them</button></span>';
    if (PDLG.mode === "queue") {
      var left = PDLG.at + 1 < PDLG.queue.length;
      return '<span class="why" style="margin:0">' +
          (left ? plural(PDLG.queue.length - PDLG.at - 1, "more") + ' after this one'
                : 'This is the last one.') + '</span><span class="pdrt">' +
        '<button class="linkbu" data-pdlg-skip="1">' + (left ? "Skip" : "Close") + '</button>' +
        (left ? '<button class="linkbu tk-save" data-pdlg-next="1">Save &amp; next</button>'
              : '<button class="linkbu tk-save" data-pdlg-close="1">Save &amp; close</button>') +
        '</span>';
    }
    return '<span class="pdrt">' +
      '<button class="linkbu" data-pdlg-cancel="1">Cancel</button>' +
      '<button class="linkbu tk-save" data-pdlg-close="1">Save</button></span>';
  }
  function personDialogTitle(){
    if (!PDLG) return { t:"", s:"" };
    if (PDLG.mode === "add") return { t:"Add someone", s:"They appear on the register at once." };
    var p = personBy(PDLG.key);
    var nm = p ? knownName(p, DNAMES) : "";
    if (PDLG.mode === "queue")
      return { t:nm, s:(PDLG.at + 1) + " of " + PDLG.queue.length + " needing attention" };
    var held = p ? personRoles(p) : [];
    return { t:nm, s:held.length
      ? held.map(function(r){ return roleName(r.role) + " · " + whereLabel(r.at); }).join(" · ")
      : "No role" };
  }

  /* ── THE COLLECTIVE ACTIONS (Islam, 2026-08-22) ────────────────────
     "we need the collective action list of password reset for all or for
     people without set passwords."

     Two, and they are not one control with a wider reach. THE FIRST CAN LOCK
     NOBODY OUT — it only touches people who have never had a password, so the
     worst it does is hand a way in to somebody who had none. THE SECOND IS A
     RESET: it overwrites passwords people are using and ends their sessions,
     so it is drawn as the destructive thing it is and asks twice.

     THE SERVER PICKS THE SET, both times. The screen sends a password and a
     scope, never a list of keys — a stale screen can then only ever issue to
     fewer people than it thinks, never more (§35). And "everyone" excludes the
     person pressing it, on the server: mistype the shared password while
     resetting everybody and the SMO would otherwise have locked themselves out
     of their own deployment, with no second SMO to ask. */
  var activeCount = PEOPLE.filter(personActive).length;

  /* ── WHAT WOULD STOP SOMEBODY SIGNING IN (§69.11) ──────────────────
     Sign-in takes the email address on the register, so two register facts
     became access facts the day that changed, and the SMO has no other way to
     see either. Both are counted over ACTIVE people only: a retired person is
     turned away at the door whatever their address says (§35), so counting
     them would be reporting a problem that is not one.

     THE DUPLICATE IS THE ONE THAT NEEDS SAYING HERE. The door tells the person
     stuck that their address is on two rows, at Islam's direction — but they
     cannot fix it, and nothing else in the platform would ever show the SMO
     which two rows they are. `addrRows` is a map of address to names, so the
     chip's title can name them rather than just count them. */
  var addrRows = {};
  PEOPLE.forEach(function(p){
    if (!personActive(p)) return;
    var a = String(p.email == null ? "" : p.email).trim().toLowerCase();
    if (!a) return;
    (addrRows[a] = addrRows[a] || []).push(p.name);
  });
  var dupAddr = Object.keys(addrRows).filter(function(a){ return addrRows[a].length > 1; });
  var noEmail = PEOPLE.filter(function(p){
    return personActive(p) && !String(p.email == null ? "" : p.email).trim();
  }).length;

  /* ── THE TWO HEADER MENUS (§47.2) ──────────────────────────────────
     Islam: "the options of password reset needs to be in the top right page —
     check the password reset design in the people erp repo."

     HR_ERP's registry puts its bulk controls exactly there: worded dropdown
     buttons in the header's right cluster, each menu item a TITLE plus a line
     of description, the destructive one below a divider and drawn in red. Same
     shape here, because it is the same job and Islam already reads that one.

     One rule carried over verbatim, and it is load-bearing in both codebases:
     THE ACTION FIRES BEFORE THE MENU CLOSES. HR_ERP's `runAndClose` has a
     comment about a shipped-but-dead bulk password action, and SMP's own
     CLAUDE.md records the same fault from the React side — closing the menu
     from the button's own handler unmounts the control before the click
     finishes. The handlers in shell.html dispatch first and clear PMENUHEAD
     after. */
  /* ── THE REGISTER'S FILE, WITH THE OTHER COLLECTIVE ACTIONS (§90) ─
     Two acts, one dropdown, in the header cluster where Columns and Passwords
     already are. The file input is REAL and hidden behind its own label rather
     than a button that reaches for one: a `<input type=file>` cannot be opened
     from script without a user gesture in every browser, and a control that
     works in Chrome and silently does nothing elsewhere is worse than a plain
     one (§34's rule about hiding a field's furniture — here the furniture IS
     the field, so the label is what is styled). */
  var fileMenu = !mayEdit ? "" :
    '<span class="hmenu' + (PFILEMENU ? " open" : "") + '">' +
      '<button class="hmenu-btn" data-filemenu="1" aria-haspopup="true" ' +
        'aria-expanded="' + PFILEMENU + '">Register file <span class="hcar">&#9662;</span></button>' +
      (PFILEMENU
        ? '<div class="hmenu-panel">' +
            '<button class="hmenu-item" data-dlppl="1">' +
              '<span class="t">Download the register</span>' +
              '<span class="d">' + plural(PEOPLE.length, "row") + ', with Role and Status as ' +
              'dropdowns' + (mainbus().length
                ? ' and your ' + mainbus().length + ' names in the Official BU column'
                : ' — the Official BU column has no list yet, so type the names and they ' +
                  'are added on arrival') + '. The export and the template are one file.</span></button>' +
            '<div class="hmenu-sep"></div>' +
            '<label class="hmenu-item" for="ppl-file">' +
              '<span class="t">Upload a filled file</span>' +
              '<span class="d">Matched on Emp ID, then Email. A row matching nobody adds ' +
              'them; a row whose two identifiers disagree is set aside for you to answer. ' +
              'You review every change before anything is applied.</span></label>' +
            '<input type="file" id="ppl-file" accept=".xlsx" class="vh" ' +
              'aria-label="Choose a filled people file to upload">' +
          '</div>'
        : '') +
    '</span>';

  var colMenu =
    '<span class="hmenu' + (PCOLMENU ? " open" : "") + '">' +
      '<button class="hmenu-btn" data-colmenu="1" aria-haspopup="true" ' +
        'aria-expanded="' + PCOLMENU + '">Columns <span class="hcar">&#9662;</span></button>' +
      (PCOLMENU
        ? '<div class="hmenu-panel cols">' +
            '<div class="hmenu-h"><span>Show columns</span>' +
              '<span><button class="linkbu" data-colall="1">All</button> &middot; ' +
              '<button class="linkbu" data-colnone="1">None</button></span></div>' +
            PEOPLE_COLS.filter(function(c){ return !c.live || live; }).map(function(c){
              return '<label class="colrow"><input type="checkbox" data-col="' + c.k + '"' +
                (showCol(c.k) ? " checked" : "") + '><span>' + esc(c.label) + '</span></label>';
            }).join("") +
            '<div class="hmenu-note">Person is always shown &mdash; a register ' +
            'with the names hidden is not a register.</div>' +
          '</div>'
        : '') +
    '</span>';

  var pwMenu = !live ? "" :
    '<span class="hmenu' + (PWMENU ? " open" : "") + '">' +
      '<button class="hmenu-btn" data-pwmenu="1" aria-haspopup="true" ' +
        'aria-expanded="' + PWMENU + '">Passwords <span class="hcar">&#9662;</span></button>' +
      (PSETPW.key === "bulk:none" || PSETPW.key === "bulk:all"
        ? pwBulkPanel(reach.length, noPw)
        : PWMENU
        ? '<div class="hmenu-panel">' +
            '<button class="hmenu-item" data-pwbulk="none"' + (noPw ? "" : " disabled") + '>' +
              '<span class="t">Issue to those with no password</span>' +
              '<span class="d">' + (noPw
                ? plural(noPw, "person").replace("persons", "people") + ' cannot sign in yet.'
                : 'Everybody active already has one.') + '</span></button>' +
            '<div class="hmenu-sep"></div>' +
            '<button class="hmenu-item danger" data-pwbulk="all">' +
              '<span class="t">Reset everyone&rsquo;s password</span>' +
              '<span class="d">All ' + reach.length + ' others get a temporary ' +
              'one and are signed out. Never you.</span></button>' +
          '</div>'
        : '') +
    '</span>';

  /* THE SAME PANEL, FOR THE TWO COLLECTIVE ACTIONS (§69.22). Both were
     `prompt()` too, and both had the identical silent failure. It reuses the
     field's id so the typing, Generate and Enter wiring is one implementation
     — two would drift, and the second is the one nobody drives.

     THE DESTRUCTIVE ONE CARRIES ITS OWN WARNING IN THE PANEL rather than in a
     `confirm()` in front of it: a native confirm can be suppressed exactly as
     the prompt was, and a reset that proceeded because a warning was
     suppressed is the worst version of this bug. */
  function pwBulkPanel(activeCount, noPw){
    var all = PSETPW.key === "bulk:all";
    if (PSETPW.done) {
      return '<div class="hmenu-panel pwset"><div class="cq">' +
        '<b>' + esc(PSETPW.done.what) + '</b> Each of them chooses their own the ' +
        'first time they use it.</div>' +
        (PSETPW.done.pw
          ? '<div class="pwout"><code class="mono" id="pwset-done">' + esc(PSETPW.done.pw) +
            '</code><button class="linkbu" data-pwcopy="1">Copy</button></div>'
          : '') +
        '<div class="cbtns"><button data-pwcancel="1">Close</button></div></div>';
    }
    return '<div class="hmenu-panel pwset"><div class="cq">' +
      (all
        ? '<b>Reset everyone\u2019s password?</b> All ' + activeCount +
          ' others get the one below and are signed out at once. Never you.'
        : '<b>One password, for the ' + plural(noPw, "person").replace("persons", "people") +
          ' with none.</b> Nobody who already has one is touched.') + '</div>' +
      '<div class="pwrow">' +
        '<input class="fld" id="pwset-field" type="text" autocomplete="off" ' +
          'spellcheck="false" autocapitalize="none" placeholder="Temporary password" ' +
          'aria-label="One temporary password" value="' + esc(PSETPW.pw) + '">' +
        '<button class="linkbu" data-pwgen="1">Generate</button>' +
      '</div>' +
      '<div class="pwrule">At least 8 characters, with an uppercase letter, a ' +
        'number and a special character.</div>' +
      (PSETPW.err ? '<div class="picerr">' + esc(PSETPW.err) + '</div>' : '') +
      '<div class="cbtns">' +
        '<button data-pwcancel="1">Cancel</button>' +
        '<button class="danger" data-pwset="' + esc(PSETPW.key) + '">' +
          (all ? "Reset them all" : "Issue it") + '</button>' +
      '</div></div>';
  }

  /* ── THE THREE NOTES ARE IN THE KNOWLEDGE BASE (§90, Islam) ───────
     "remove the notes below the registry table and take them to the knowledge
     base as agreed." §30's rule, applied where it had not been: a setup table
     is where you CHANGE a thing, not where the model is explained — and three
     paragraphs under a 33-row table are three paragraphs nobody scrolls to.

     They are not deleted. Sign-in by address, how an issued password behaves,
     and retire-versus-delete are all in `c_kb` now, where the rest of the
     model lives and where somebody goes when they want to understand rather
     than to change something. */

  /* PEOPLE REGISTER, not People (Islam, 2026-08-24). The page has been called
     "the register" in every sentence written about it since §35; the heading
     said something else, so the word people use and the word on the door were
     different words. */
  /* ── THE HEADER IS ONE ROW, AND THE ALARMS ARE A QUEUE (§116) ─────
     Islam: "remove the 76 rows text it's not needed and remove the quick
     filters", and "let's refine the design of the top panel to become more
     concise."

     It carried NINE controls before the table began: a scope pill, two counts,
     up to six alarm chips, three menus, a search box and five filter chips,
     over two rows — and at 1280 the right-hand end ran off the page, so
     "Register file" was the last thing readable.

     THE ALARM CHIPS ARE NOT DELETED, THEY ARE ANSWERED. Each named a number
     and pointed at rows you then had to find by eye; they are one button now,
     and pressing it opens the first of them (§116.2). A count that cannot take
     you to what it counts is a count that makes work.

     THE TWO COUNTS SAID THE SAME THING TWICE — "N people active" in the header
     and "N rows" at the end of the filter row. He asked for the second to go;
     the first stays as a quiet word beside the title rather than a chip,
     because a register with no size at all is a page that will not say how big
     it is.

     WHAT IS KEPT AND WHY: the search box. With the filters gone it is the only
     way to find a row by hand, and it is the one control on the row that costs
     nothing to leave in.

     UNITS WITH NO CUSTODIAN KEEPS ITS OWN CHIP, and that is not an oversight
     (§93.4): it is the one outstanding thing on this page that is not about a
     PERSON, so it cannot be a stop in a queue of people — there would be
     nobody to open. */
  var queue = attentionQueue();
  var attnBtn = !mayEdit || !queue.length ? "" :
    '<button class="attnbtn" data-attn="1" ' +
      'title="Open the first of them, fix it, and move to the next">' +
      ICO_ATTN + 'Attention <span class="attnn">' + queue.length + '</span></button>';
  var addBtn = !mayEdit ? "" :
    '<button class="addbtn" data-padd-open="1">+ Add</button>';

  /* THE ONE OUTSTANDING THING THAT IS NOT A PERSON (§93.4), and it is now a
     CHIP ON THE ROW rather than a line under it (§122). It cannot join the
     Attention queue — a unit is not somebody you can open — so removing the
     count line would have taken it with it, which is why it moved rather than
     went. DRAWN ONLY WHEN THERE IS ONE: a chip that is usually absent is a
     mark, and one that is always there is furniture (§41's budget). */
  var noCustChip = !noCust.length ? "" :
    '<span class="pnocust" title="' + esc(noCust.map(function(k){
        return UNITS[k].name; }).join(", ")) + ' \u2014 nobody is keeping ' +
      (noCust.length === 1 ? "this plan" : "these plans") + ' up to date. Give somebody the ' +
      'Strategy custodian role from their row here.">' +
      plural(noCust.length, "unit") + ' with no custodian</span>';

  /* ── AND HOW MANY PEOPLE HOLD A SEAT (§187) ────────────────────────
     Islam, after §186: *"where will I find this out if it's applied to anyone
     else?"* The attention queue catches a seat sitting somewhere other than
     where its holder does — which is the shape an accident takes — and it
     is deliberately quiet about a seat held BY somebody who sits at the group,
     because for them the two agree and there is nothing anomalous to say.

     THAT LEAVES A HOLE, and this closes it: a plain total that cannot be
     quiet about anybody. It is the register's own equivalent of the
     custodian chip above — the one outstanding thing on this page that is
     not a QUESTION about a person, so it is not a stop in a queue; it is a
     fact you go and read.

     ALWAYS DRAWN, unlike the chip beside it, and that is the point. A count
     that vanishes at some number is a count you cannot trust to be
     complete — and this one exists precisely to be the complete list. It
     names them on the hover in the order the register holds them. */
  var seatHolders = PEOPLE.filter(function(p){
    return personActive(p) &&
      SMPRules.personRoles(world(), p).some(function(r){
        return SMPRules.isSeatRole(r.role); });
  });
  var seatChip = !mayEdit ? "" :
    '<span class="pseats" title="' +
      esc(seatHolders.map(function(p){
        return p.name + " \u2014 " + SMPRules.personRoles(world(), p)
          .filter(function(r){ return SMPRules.isSeatRole(r.role); })
          .map(function(r){ return roleName(r.role); }).join(", ");
      }).join("\n")) + '\n\nA seat is granted by the Super user on this ' +
      'register and by nothing else. Take one off with the \u00d7 on the chip ' +
      'in the Roles column.">' +
      plural(seatHolders.length, "person", "people") + ' hold a seat</span>';

  /* NO BADGE AND NO COUNT LINE (§122). Islam: "the SMO badge remove it and
     remove the 77 people active text ... and accordingly the whole table
     should be just below the buttons line."

     THE BADGE SAID WHO YOU ARE, which the chrome says already and says on
     every page. THE COUNT SAID HOW BIG THE REGISTER IS, and the table under
     it is that — §116 had already dropped the second copy of it from the
     filter row for the same reason, and kept this one; keeping one copy of
     something nobody asked for is still keeping it.

     AND THE TABLE FOLLOWS IMMEDIATELY, which is the part of the ask that is
     not a removal: with nothing between the row and the table, `section("")`
     is what puts the table there, and the header's own 14px bottom margin is
     the whole of the gap. */
  return cfgHead("People register",
      [],
      "people", false, null, null,
      '<span class="hsearch">' + tkSearchOnly("people", "Search the register\u2026") + '</span>' +
      attnBtn + noCustChip + seatChip + addBtn + fileMenu + colMenu + pwMenu) +

    section("", "",
      null,
      /* NO COLUMN WIDTHS, and no table-layout:fixed (see .peoplecfg in
         config.css). Islam: "the first column of the name needs to wrap
         around the name length" — the column fits the name, rather than the
         name being broken to fit the column. Only ROLES is given a width, and
         it is given the leftovers. */
      /* SORTABLE HEADERS ARE BUILT, NOT DECLARED TWICE. The column index a
         sort needs is a POSITION, and the positions move whenever a column is
         hidden under Columns — §65's validation-range trap, in a different
         file. `th()` counts as it emits, so the two can never disagree. */
      (function(){
        var n = 0;
      var th = tkHead("people");

      return '<div class="cfg peoplebox"><table class="unitcfg peoplecfg" ' +
        'data-tktable="people"><thead><tr>' +
        th("#", "idx", false) +
        /* "Name", not "Person" (§93.8): the column beside it is Full Name, and
           two columns about what somebody is called have to say which is
           which. */
        th("Name", "namecell") +
        (showCol("fullname") ? th("Full Name") : '') +
        /* "Never decides access" is gone at Islam's direction. It was a note
           about the MODEL sitting on a column header, and the knowledge base
           is where the model is explained (§30) — `c_access` says it there. */
        (showCol("empid")    ? th("Emp. ID")   : '') +
        (showCol("key")      ? th("Sign-in name") : '') +
        (showCol("title")    ? th("Job title")  : '') +
        /* ── THE TWO EDITED COLUMNS NEED A FLOOR (§93.10) ──────────
           Both hold a `<select>` when a row is open, and a select's width
           cannot be expressed as a percentage here: the cell has no definite
           width under auto layout, so `width:100%` resolves against the whole
           box — 1340px inside a 117px cell, which is §69's feedback loop with
           a different number. A px cap on the select alone just overflows the
           column the read rows sized. So the COLUMN carries the floor, and the
           select is capped to sit inside it. */
        (showCol("mainbu")   ? th("Official BU", "wcol") : '') +
        (showCol("bu")       ? th("Unit", "wcol")        : '') +
        (showCol("company")  ? th("Company")             : '') +
        (showCol("email")    ? th("Email", "wrapany")      : '') +
        (showCol("phone")    ? th("Mobile")     : '') +
        /* Roles is a stack of chips and Password is a pill: sorting either
           orders them by the text that happens to be rendered, which is not a
           fact anybody asked about. */
        (showCol("roles")    ? th("Roles", "roles", false) : '') +
        (showCol("status")   ? th("Status", "cc") : '') +
        (live && showCol("password") ? th("Password", "cc", false) : '') +
        th("", "cc kebcell") +
      '</tr></thead><tbody>' + rows + addRow + '</tbody></table></div>';
      })() +

      "") +

    renderPeopleFile(mayEdit);
}


/* ══════════════════════════════════════════════════════════════════
   MERGING TWO ROWS (§87.4)

   A SECTION UNDER THE TABLE, NOT A PANEL IN THE ROW. Retire and Delete ask one
   question and fit in the 83px actions column (§69.20); this one has to show
   two whole people side by side and every field they disagree about, and the
   answer to "which of these two do we keep" is unreadable in a 240px popover.
   It follows the file review's three-step shape for the same reason that one
   has it: look at what would happen, then do it (A13).

   IT OPENS FROM THE ROW AND SAYS SO. The ⋮ menu sets which row started it, and
   the section names that person in its heading — a panel that appeared at the
   bottom of a 33-row table with no memory of what was pressed would be a
   control nobody could place.
   ══════════════════════════════════════════════════════════════════ */
var PMERGE = { a:null, b:null, keep:null, picks:{}, err:null, done:null, step:1 };

function mergeReset(){
  PMERGE = { a:null, b:null, keep:null, picks:{}, err:null, done:null, step:1 };
}
/* Which row survives, defaulted rather than decided: the one that can be
   matched by a later upload, because the other one is the shape that made the
   duplicate. Still a default — the card is a radio. */
function mergeDefaultKeep(a, b){
  var pa = personBy(a), pb = personBy(b);
  if (!pa || !pb) return a;
  if (personIdentified(pa) !== personIdentified(pb))
    return personIdentified(pa) ? a : b;
  return a;
}
function mergeKeepKey(){
  if (!PMERGE.a || !PMERGE.b) return null;
  return PMERGE.keep || mergeDefaultKeep(PMERGE.a, PMERGE.b);
}
function mergeDropKey(){
  var k = mergeKeepKey();
  return k ? (k === PMERGE.a ? PMERGE.b : PMERGE.a) : null;
}

/* ── THE WIZARD IS THE PAGE'S OWN MODAL (§90.4) ────────────────────
   Islam, on the section this replaces: "when I press merge with other row
   nothing happens." It was not nothing — the section rendered 1086px down the
   page, below the fold, with the page still at scroll 0. It was drawn,
   permitted and unreachable, which is §70's fault reached by a different road:
   there, a control invisible until hover; here, a control below the horizon.

   A POPUP REMOVES THE CLASS OF FAULT rather than patching the scroll. Nothing
   that appears where you are looking can open where you are not.

   IT REUSES `openModalHtml`, and that is the point of using it: the page
   behind goes `inert`, focus moves in and comes back to the ⋮ that opened it,
   and Escape closes — four things §48.4 had to fix once and nobody should fix
   twice. What this adds is a body that REPAINTS without repainting the page:
   `mergePaint()` rewrites the modal's own element, because paint() would
   rebuild the register underneath and leave the dialog holding a step nobody
   chose.

   THREE STEPS, because the three questions are answered at different moments
   and by different reasoning: who is this the same person AS, which of the two
   rows survives, and what to do where they disagree. One panel asking all
   three is the panel that was there before. */
function mergeStepHtml(){
  /* ── THE RECEIPT IS THE LAST STEP, NOT A SECTION ON THE PAGE (§93.5) ─
     Islam, on a "Merge two rows" panel left standing under the register after
     the dialog had closed: "this page is a table page, not for other
     notifications."

     Right, and it is the same argument as §90's — the one that moved steps 1
     and 2 into this dialog in the first place. What is said about an act
     belongs where the act was: the wizard stays open and shows what it did,
     and Close is what ends it. The register behind is repainted (which is
     where the change becomes a save) and it is a table again. */
  if (PMERGE.done) {
    return '<div class="applied"><b>' + esc(PMERGE.done) + '</b></div>' +
      '<div class="cbtns" style="margin-top:14px">' +
        '<button class="danger" data-pmerge-close="1">Close</button></div>';
  }
  var a = PMERGE.a ? personBy(PMERGE.a) : null;
  if (!a) return '<div class="note">That row is no longer on the register.</div>';
  var b = PMERGE.b ? personBy(PMERGE.b) : null;
  var step = PMERGE.step || 1;

  function chips(n){
    return '<div class="mgsteps">' +
      ["1 · who", "2 · which survives", "3 · confirm"].map(function(t, i){
        return '<span class="mgstep' + (i + 1 === n ? " on" : "") +
               (i + 1 < n ? " done" : "") + '">' + t + '</span>';
      }).join("") + '</div>';
  }

  /* ── step 1 ─────────────────────────────────────────────────── */
  if (step === 1 || !b) {
    var cands = mergeCandidates(a.key);
    var WHY = { empId:"same employee number", email:"same address",
                name:"same full name", likely:"the name reads the same" };
    return chips(1) +
      '<p class="mglead">Merging <b>' + esc(shortName(a.name)) + '</b> with\u2026</p>' +
      (cands.length
        ? cands.map(function(c){
            return '<button class="mgsug' + (b && b.key === c.person.key ? " on" : "") +
              '" data-pmerge-b="' + esc(c.person.key) + '">' + esc(c.person.name) +
              ' <i>\u00b7 ' + esc(WHY[c.why] || "looks like a duplicate") + '</i></button>';
          }).join("")
        : '<div class="note">Nothing on the register looks like this row. Choose who it ' +
          'is the same person as below \u2014 the platform will not guess.</div>') +
      '<select class="fld mgsel" data-pmerge-sel="1" aria-label="Choose the other row">' +
        '<option value="">' + (cands.length ? "or somebody else\u2026" : "Choose the other row\u2026") +
        '</option>' +
        PEOPLE.filter(function(p){ return p.key !== a.key && personActive(p); })
          .map(function(p){
            return '<option value="' + esc(p.key) + '"' + (b && b.key === p.key ? " selected" : "") +
              '>' + esc(p.name) + (p.empId ? " \u00b7 " + esc(p.empId) : "") +
              (p.email ? " \u00b7 " + esc(p.email) : "") + '</option>';
          }).join("") +
      '</select>' +
      '<div class="mgfoot">' +
        '<button class="linkbu" data-pmerge-close="1">Cancel</button>' +
        '<button class="editbtn apply" data-pmerge-step="2"' + (b ? "" : " disabled") +
          '>Next</button></div>';
  }

  var keepKey = mergeKeepKey(), dropKey = mergeDropKey();
  var plan = personMergePlan(keepKey, dropKey);
  if (!plan) return chips(step) + '<div class="note bad-note">Those are the same row.</div>';

  /* ── step 2 ─────────────────────────────────────────────────── */
  if (step === 2) {
    /* THE CARDS SAY WHAT EACH ROW COSTS TO LOSE, and the sign-in name is
       first: the key is what `credentials` and `sessions` are keyed on (§35),
       so whichever row goes takes its password with it. */
    function card(p){
      var on = p.key === keepKey;
      var held = personRoles(p).filter(function(r){ return !SMPRules.isOwnLinesRole(r.role); });
      return '<label class="mgcard' + (on ? " on" : "") + '">' +
        '<input type="radio" name="mgkeep" data-pmerge-keep="' + esc(p.key) + '"' +
          (on ? " checked" : "") + '>' +
        '<div class="mgb"><b>' + esc(p.name) + '</b>' +
          '<div class="mgf"><span>Sign-in name</span><span class="mono">' + esc(p.key) + '</span></div>' +
          '<div class="mgf"><span>Emp ID</span><span class="mono">' +
            (p.empId ? esc(p.empId) : "\u2014") + '</span></div>' +
          '<div class="mgf"><span>Email</span><span>' +
            (p.email ? esc(p.email) : "\u2014") + '</span></div>' +
          '<div class="mgf"><span>Unit</span><span>' +
            esc(roleWhereLabel2(personAt(p)) || "\u2014") + '</span></div>' +
          '<div class="mgf"><span>Roles</span><span>' +
            (held.length ? esc(held.map(function(r){ return roleName(r.role); }).join(", "))
                         : "\u2014") + '</span></div>' +
          '<div class="mgverdict ' + (on ? "keep" : "drop") + '">' +
            (on ? "Survives \u00b7 keeps its password and sign-in name"
                : "This row goes \u00b7 its password and sessions go with it") +
          '</div></div></label>';
    }
    var moves = [];
    plan.roles.forEach(function(r){
      moves.push(roleName(r.role) + " \u00b7 " + roleWhereLabel(r.at) +
                 (r.already ? " (already theirs)" : ""));
    });
    if (plan.seat) moves.push(roleName(plan.seat.role) + " \u00b7 " + roleWhereLabel(plan.seat.at));
    plan.owns.forEach(function(o){
      moves.push(o.kind === "set" ? "the figure set " + o.name
               : o.kind === "figure" ? "the figure " + o.name : o.name);
    });
    if (plan.moveTo) moves.push("their place \u2014 " + roleWhereLabel(plan.moveTo));
    plan.fills.forEach(function(f){ moves.push(f.label.toLowerCase() + " \u2014 " + f.value); });

    return chips(2) +
      '<div class="mgcards">' + card(personBy(PMERGE.a)) + card(personBy(PMERGE.b)) + '</div>' +
      (moves.length
        ? '<div class="mgmoves"><b>What moves across</b><ul>' +
          moves.map(function(m){ return '<li>' + esc(m) + '</li>'; }).join("") + '</ul></div>'
        : '<div class="note">Nothing is attached to ' + esc(plan.drop.name) +
          ' \u2014 only the row goes.</div>') +
      '<div class="mgfoot">' +
        '<button class="linkbu" data-pmerge-step="1">Back</button>' +
        '<button class="editbtn apply" data-pmerge-step="3">Next</button></div>';
  }

  /* ── step 3 ─────────────────────────────────────────────────── */
  return chips(3) +
    (plan.picks.length
      ? '<div class="mgpicks"><b>They disagree about ' +
        plural(plan.picks.length, "field") + '</b>' +
        '<div class="pkgrid"><span class="h"></span>' +
          '<span class="h">Keep ' + esc(shortName(plan.keep.name)) + '\u2019s</span>' +
          '<span class="h">Take ' + esc(shortName(plan.drop.name)) + '\u2019s</span>' +
        plan.picks.map(function(f){
          var take = !!PMERGE.picks[f.k];
          return '<span class="pkl">' + esc(f.label) + '</span>' +
            '<label class="pkopt' + (take ? "" : " on") + '">' +
              '<input type="radio" name="mgp-' + esc(f.k) + '" data-pmerge-pick="' +
              esc(f.k) + '|keep"' + (take ? "" : " checked") + '>' +
              '<span>' + esc(f.keep) + '</span></label>' +
            '<label class="pkopt' + (take ? " on" : "") + '">' +
              '<input type="radio" name="mgp-' + esc(f.k) + '" data-pmerge-pick="' +
              esc(f.k) + '|take"' + (take ? " checked" : "") + '>' +
              '<span>' + esc(f.drop) + '</span></label>';
        }).join("") + '</div></div>'
      : '<div class="note">They agree about everything they both say.</div>') +
    '<div class="note"><b>' + esc(plan.keep.name) + ' survives.</b> ' +
      esc(plan.drop.name) + '\u2019s row goes, and with it their password and any ' +
      'sessions they have open \u2014 <b>' + esc(plan.drop.key) + '</b> stops being a ' +
      'sign-in name. Blanks are filled from it without asking; there is nothing to lose.</div>' +
    (PMERGE.err ? '<div class="note bad-note">' + esc(PMERGE.err) + '</div>' : '') +
    '<div class="mgfoot">' +
      '<button class="linkbu" data-pmerge-step="2">Back</button>' +
      '<button class="editbtn apply" data-pmerge-go="' + esc(keepKey) + '|' + esc(dropKey) +
        '">Merge into ' + esc(shortName(plan.keep.name)) + '</button></div>';
}

/* THE RECEIPT STAYS ON THE PAGE. The dialog is gone by the time it is read,
   and a merge is the one act on this register with no row left to point at —
   so what happened is said where the register is (§62's rule about a
   confirmation being where the act was). */
/* ══════════════════════════════════════════════════════════════════
   THE REGISTER'S FILE (§54.3, spec 011)

   A section on the People page rather than a page of its own, and not on
   Import either. Import authors ONE UNIT'S PLAN and is reached from the
   cycle; this amends the register, and the register is what you are already
   looking at when you decide five hundred people need to be in it. A13: the
   three-step shape, the review-before-apply and every class here are the
   import page's, because it is the same job done to a different table.
   ══════════════════════════════════════════════════════════════════ */
/* ── THE FILE IS A HEADER BUTTON, AND THE REVIEW IS TRANSIENT (§90) ─
   Islam: "for the seed the register you can [put] this as a button on the top
   beside the passwords with a drop down to download the template or upload it.
   And remove the sections in the bottom of the page."

   Steps 1 and 2 were PERMANENT FURNITURE for something done twice a year. They
   sat under a 33-row table, which is where the page's own scroll ends, and
   every visit to the register carried them. The two acts are one dropdown now,
   beside Columns and Passwords, where the page's other collective actions
   already live (§69.22).

   WHAT IS NOT FURNITURE IS THE REVIEW. Reading a file produces conflicts to
   answer and differences to tick (§87.5, §87.6) — a table of its own, with
   Apply at the end of it — so it appears UNDER the register at the moment it
   exists and goes again when it is applied or discarded. A dropdown is the
   right home for two buttons and the wrong one for a decision. */
function renderPeopleFile(mayEdit){
  if (!mayEdit) return "";
  var plan = PPLF.plan;
  if (!plan && !PPLF.done) return "";

  /* THE RECEIPT, and it names the way back to nothing — you are already on the
     page the change landed on, so it says what moved and stops. */
  var step3 = PPLF.done
    ? '<div class="applied"><b>' + esc(PPLF.done) + '</b></div>'
    : "";

  if (!step3 && plan) {
    var tally = peopleFileTally(plan);
    var blocked = plan.problems.length || tally.undecided;
    var checks =
      plan.problems.map(function(x){
        return '<div class="chk bad"><span class="pill bad">Problem</span>' +
          '<b>' + esc(x.at) + '</b><span>' + esc(x.msg) + '</span></div>';
      }).join("") +
      plan.notices.map(function(x){
        return '<div class="chk note-c"><span class="pill attn">Notice</span>' +
          '<b>' + esc(x.at) + '</b><span>' + esc(x.msg) + '</span></div>';
      }).join("");

    /* ── THE ROWS THAT NEED AN ANSWER COME FIRST (§87.5) ────────────
       They are the only thing on this screen that BLOCKS, so putting them
       under a table of thirty ordinary updates would mean scrolling past the
       work to find the reason Apply is off. Each one names both readings with
       the person they mean, so the answer is a recognition rather than a
       deduction. */
    var conf = plan.rows.filter(function(r){ return r.action === "conflict"; });
    function who(p){
      return '<b>' + esc(p.name) + '</b>' +
        '<span class="why" style="margin:0">' +
        (p.empId ? 'Emp ID ' + esc(p.empId) : 'no employee number') + ' \u00b7 ' +
        (p.email ? esc(p.email) : 'no address') + '</span>';
    }
    function choice(row, i, mode, key, label, note){
      var on = row.choice && row.choice.mode === mode &&
               (mode !== "match" || row.choice.key === key);
      return '<label class="cfopt' + (on ? " on" : "") + '">' +
        '<input type="radio" name="cf-' + i + '" data-cfchoice="' + i + '|' + mode +
          '|' + esc(key || "") + '"' + (on ? " checked" : "") + '>' +
        '<span>' + label + (note ? '<i>' + esc(note) + '</i>' : '') + '</span></label>';
    }
    var conflicts = conf.length
      ? '<div class="cfbox"><b>' + plural(conf.length, "row") + ' need' +
        (conf.length === 1 ? 's' : '') + ' your decision</b>' +
        '<p class="sub">The employee number and the email on ' +
        (conf.length === 1 ? 'this row do' : 'these rows do') +
        ' not point at the same person, so the file cannot say who it means. ' +
        'Nothing is applied until every one is answered.</p>' +
        conf.map(function(row){
          var i = plan.rows.indexOf(row);
          var c = row.conflict;
          var head = '<div class="cfrow"><div class="cfwhat"><b>' + esc(row.at) + '</b> ' +
            esc(row.name || "\u2014") +
            '<span class="why" style="margin:0">' +
            (row.id ? 'Emp ID ' + esc(row.id) : 'no employee number') + ' \u00b7 ' +
            (row.email ? esc(row.email) : 'no address') + '</span></div>';
          var opts = "";
          if (c.kind === "twoPeople") {
            opts =
              choice(row, i, "match", c.byId.key, who(c.byId), "the employee number matches them") +
              choice(row, i, "match", c.byMail.key, who(c.byMail), "the address matches them");
          } else {
            opts = choice(row, i, "match", c.byMail.key, who(c.byMail),
              "the address matches them \u2014 give them this employee number");
          }
          /* ── "SOMEBODY NEW" IS NOT ON OFFER, AND THE REASON IS §83 ──
             Every conflict is a row whose address ALREADY BELONGS to somebody
             on the register — that is what makes it a conflict. Adding a third
             person with it would hand one address to two people, and sign-in
             takes the address, so it would turn both of them away (§69.23).
             The upload refuses that everywhere else in this reader; offering
             it here as one choice of four would be the same reader answering
             the same question two ways.

             SO IT IS SAID, NOT HIDDEN. A genuinely new colleague who has been
             given a leaver's address is a real case, and the way through it is
             on the register — clear the address from the row that holds it
             first. A missing option explains nothing; this one names what to
             go and do (§59, §16.7). */
          opts += choice(row, i, "skip", "", "<b>Leave it</b>", "change nothing for this row");
          return head + '<div class="cfopts">' + opts + '</div>' +
            '<div class="cfnote">Adding this as a third person is not offered: ' +
            esc(c.byMail.name) + ' already holds <b>' + esc(row.email) + '</b>, and sign-in ' +
            'takes the address — two people holding one turns both of them away. If this ' +
            'really is somebody new, clear the address from ' + esc(c.byMail.name) +
            '\u2019s row first.</div></div>';
        }).join("") +
        '</div>'
      : '';

    /* WHAT MOVES, PERSON BY PERSON. A tally alone ("31 updated") is unreadable
       against a file that came straight back off the download with two cells
       changed — the whole point of reviewing is seeing which two. Rows that
       change nothing are counted and not listed, or the table is the file. */
    var moving = plan.rows.filter(function(r){
      if (r.action === "conflict") return false;
      var eff = peopleRowEffective(r);
      return eff.mode === "add" || peopleRowChanges(r).length || r.picks.length;
    });
    var body = moving.length
      ? '<div class="scroll"><table><thead><tr><th>Row</th><th>Person</th>' +
          '<th>Official BU</th><th>What happens</th></tr></thead><tbody>' +
        moving.map(function(r){
          var i = plan.rows.indexOf(r);
          var ch = peopleRowChanges(r);
          /* ── EVERY DIFFERENCE IS AN OFFER (§87.6) ─────────────────
             Recorded on the left, the file's on the right, and the file's is
             taken only where it is ticked. The default is what is already
             recorded, because a people file is usually an export somebody
             edited two cells of — and thirty untouched cells coming back are
             not thirty decisions to overwrite thirty corrections. */
          var picks = r.picks.length
            ? '<div class="pk">' + r.picks.map(function(f){
                return '<label class="pkrow' + (f.take ? " on" : "") + '">' +
                  '<input type="checkbox" data-pplpick="' + i + '|' + esc(f.k) + '"' +
                    (f.take ? " checked" : "") + '>' +
                  '<span class="pkl">' + esc(f.label) + '</span>' +
                  '<span class="pkw">' + (f.was ? esc(f.was) : '<i>blank</i>') + '</span>' +
                  '<span class="pka">\u2192</span>' +
                  '<span class="pkn">' + esc(f.now) + '</span></label>';
              }).join("") + '</div>'
            : '';
          return '<tr><td class="mono">' + esc(r.id || r.email || r.at) + '</td>' +
            '<td><b>' + esc(r.name) + '</b>' +
            (r.matchedBy === "email"
              ? '<span class="why" style="margin:0">matched on their email</span>' : '') +
            '</td>' +
            '<td>' + (r.mainbu
              ? esc(r.mainbu) + (r.where
                  ? ' <span class="why" style="margin:0">&rarr; ' + esc(roleWhereLabel(r.where)) + '</span>'
                  : ' <span class="why" style="margin:0">&rarr; not mapped</span>')
              : '<span class="why" style="margin:0">&mdash;</span>') + '</td>' +
            '<td>' + (peopleRowEffective(r).mode === "add"
              ? '<span class="pill good">Added</span>'
              : (ch.length
                  ? '<span class="pill attn">' + esc(ch.join(", ")) + '</span>'
                  : '<span class="pill quiet">nothing ticked</span>')) +
            picks + '</td></tr>';
        }).join("") + '</tbody></table></div>' +
        /* ONE PRESS FOR THIRTY TICKS. A real HR export legitimately changes
           thirty job titles, and a safe default that costs thirty clicks is a
           default people work around by not reading the list at all. */
        '<div class="imp-row" style="margin-top:10px">' +
          '<button class="linkbu" data-pplpickall="1">Take everything from the file</button>' +
          ' &middot; <button class="linkbu" data-pplpicknone="1">Keep everything as recorded</button>' +
        '</div>'
      : '<div class="note">Nothing in this file differs from what is recorded.</div>';

    step3 =
      '<div class="imp-step"><div class="imp-n">3</div><div class="imp-b">' +
        '<h4>Review, then apply</h4>' +
        (checks ? '<div class="imp-checks">' + checks + '</div>' : '') +
        (plan.problems.length
          ? '<div class="note bad-note"><b>Nothing can be applied while a problem stands.</b> ' +
            'Data that loads badly is harder to find later than a file that refuses to load.</div>'
          : '') +
        conflicts +
        '<div class="imp-tally">' +
          (tally.added   ? '<span class="pill good">' + tally.added + ' added</span>' : '') +
          (tally.updated ? '<span class="pill attn">' + tally.updated + ' updated</span>' : '') +
          (tally.roles   ? '<span class="pill kind">' + tally.roles + ' given a role</span>' : '') +
          (tally.retired ? '<span class="pill bad">' + tally.retired + ' retired</span>' : '') +
          (tally.restored? '<span class="pill good">' + tally.restored + ' restored</span>' : '') +
          (tally.undecided
            ? '<span class="pill bad">' + tally.undecided + ' waiting on you</span>' : '') +
          (plan.newBus.length
            ? '<span class="pill attn">' + plural(plan.newBus.length, "new BU name") + '</span>' : '') +
          (tally.same ? '<span class="pill quiet">' + tally.same + ' unchanged</span>' : '') +
        '</div>' + body +
        '<div class="imp-row" style="margin-top:14px">' +
          (blocked
            ? '<button class="editbtn" disabled style="opacity:.45;cursor:not-allowed">' +
              (plan.problems.length ? 'Apply blocked' : 'Answer the rows above first') + '</button>'
            : '<button class="editbtn apply" data-pplapply="1">Apply to the register</button>') +
          '<button class="linkbu" data-pplcancel="1">Discard</button></div>' +
      '</div></div>';
  }

  return section("", PPLF.done ? "The file was applied" : "What this file would change",
    PPLF.done ? null
      : "Read from " + esc(PPLF.read || "the file") + ". Nothing has been written yet — " +
        "an upload adds and amends and never removes anybody.",
    '<div class="imp">' + step3 + '</div>');
}

/* ══════════════════════════════════════════════════════════════════
   SETUP · BU LIST (§54.1, spec 011)

   Ten rows and one dropdown each. It sits in *Who* rather than *What we run*
   because its only reader is the register: it is not another thing being
   planned, it is the vocabulary the client's own employee data arrives in.
   It shares `c_people` for the same reason Companies shares `c_units` — the
   same person maintains both, and inventing a fourteenth access key for a
   ten-row table would be a switch nobody ever moves.
   ══════════════════════════════════════════════════════════════════ */
function renderMainbus(){
  /* §85. A name has two editable things — what it is called and what it points
     at — and the second is chips with their own × plus a dropdown, which is
     already per-row. The pen now opens the NAME as well, in the same row. */
  var mayEdit = grant("c_people") === "edit";
  var list = mainbus();
  var mapped = list.filter(function(b){ return mainbuAts(b).length; }).length;
  /* Names people carry that the list has never met. It cannot happen through
     an upload — a new name is added on arrival — but it can through a rename
     the register was mid-edit for, and a list that does not admit it is a list
     that quietly loses people. */
  var strays = [];
  PEOPLE.forEach(function(p){
    if (!p.mainbu || mainbuBy(p.mainbu)) return;
    if (strays.indexOf(p.mainbu) === -1) strays.push(p.mainbu);
  });

  var wheres = mainbuWheres();
  /* A SET OF CHIPS, NOT A DROPDOWN (§57). One name holds several units or
     functions now, so the cell has to show all of them and take one away
     without disturbing the rest — which a single <select> cannot do. Each is
     a chip carrying its own remove; the dropdown underneath adds, and offers
     only what is not already there, so pressing it can never be a no-op. */
  /* `ed` PASSED, NOT CAPTURED (§85.2, the second time in one change). This is
     defined outside the row map, so once editability moved into the row it was
     reading a variable that no longer existed at its scope — the fault that
     rendered the whole Functions page as nothing. Caught here by looking for
     the shape rather than by running into it again. */
  function target(b, editable){
    var ats = mainbuAts(b);
    if (!ats.length && !editable) return '<span class="pill none">Not mapped</span>';
    var chips = ats.map(function(at){
      return '<span class="uchip">' + esc(roleWhereLabel(at)) +
        (editable ? '<button class="chipx" data-mbdrop="' + esc(b.name) + '|' + esc(at) +
                    '" title="Remove ' + esc(roleWhereLabel(at)) + '">&times;</button>' : '') +
        '</span>';
    }).join(" ");
    if (!editable) return chips;
    var left = wheres.map(function(g){
      var opts = g.opts.filter(function(o){ return ats.indexOf(o.v) === -1; });
      return opts.length
        ? '<optgroup label="' + esc(g.label) + '">' + opts.map(function(o){
            return '<option value="' + esc(o.v) + '">' + esc(o.label) + '</option>';
          }).join("") + '</optgroup>'
        : '';
    }).join("");
    return '<div class="mbcell">' + (chips || '<span class="pill none">Not mapped</span>') +
      (left
        ? '<select class="fld mbadd" data-mbadd-at="' + esc(b.name) + '">' +
            '<option value="">+ add a unit or function\u2026</option>' + left + '</select>'
        : '') + '</div>';
  }

  var rows = list.map(function(b, i){
    var editable = mayEdit && rowEditIs("mainbu", String(i));
    var n = peopleOfMainbu(b.name).length;
    /* MAPPED IS "POINTS AT SOMETHING", and a name may hold several (§57), so it
       is the LIST that decides — `b.at` alone was written first and is not even
       the field: it is `mainbuAts()`. Caught immediately, because the row map's
       parameter is `b` and the reference threw. */
    var mapped = mainbuAts(b).length > 0;
    return '<tr data-tkrow="' + (mapped ? "mapped" : "unmapped") + '"' +
      (editable ? ' class="tk-open"' : '') + '><td class="idx">' +
      (i + 1) + '</td>' +
      '<td>' + (editable
        ? '<input class="fld tk-firstfield" value="' + esc(b.name) + '" data-mbname="' + esc(b.name) + '">'
        : '<b>' + esc(b.name) + '</b>') + '</td>' +
      '<td>' + target(b, editable) + '</td>' +
      '<td class="cc"><span class="mono">' + n + '</span></td>' +
      /* Deleted rather than retired, and that is safe only because it is
         REFUSED while anybody carries the name — the same contract as retiring
         a company that still holds units (§49.3). A list row records nothing,
         so there is no history to protect. */
      rowActions("mainbu", String(i), editable,
        !mayEdit || editable ? '' :
          (n ? '<span class="pill none" title="' + n + ' on the register">held by ' + n + '</span>'
             : '<button class="linkbu danger" data-mbdel="' + esc(b.name) + '">Remove</button>')) +
      '</tr>';
  }).join("");

  /* The Add row and the table's own existence are the PAGE's question, not a
     row's — `mayEdit`, so adding a name stays available while a row is open
     and the table does not disappear when the last pen closes (§85.2, third
     instance of the same shape in one change). */
  var addRow = mayEdit
    ? '<tr class="newrow"><td class="idx">+</td><td colspan="3">' +
        '<input class="fld" id="newMainbu" placeholder="Business unit name, as your own records spell it" ' +
        'value="' + esc(NEWMAINBU) + '">' +
      '</td><td class="cc"><button class="linkbu" data-mbadd="1">Add</button></td></tr>'
    : '';

  /* §84. Ten names today and one per department the client has, so it crosses
     the search threshold the day a second client arrives. *Unmapped* is the
     only filter worth having: the whole page exists to get that number to
     zero. */
  var mbth = tkHead("mainbu");
  var table = list.length || mayEdit
    ? tkBar("mainbu", { placeholder:"Search the list\u2026" }) +
      '<div class="cfg"><table class="unitcfg" data-tktable="mainbu"><thead><tr>' +
        mbth("#", "idx", false) +
        mbth("Official BU") +
        mbth("Points at") +
        mbth("People", "cc") +
        mbth("", "cc", false) +
      '</tr></thead><tbody>' + rows + addRow + '</tbody></table></div>'
    : '<div class="note"><b>Empty.</b> Names arrive by themselves the first time an employee ' +
      'file is uploaded on <b>People</b> — every BU it mentions is added here, pointing at ' +
      'nothing, for you to map. Or type them in with Edit.</div>';

  /* THE ONLY CHIP LEFT HERE IS AN ALARM (§135.1). "10 names" and "0 mapped"
     went with the SMO pill; a name sitting on somebody's row and not on this
     list is something outstanding, and it is the one thing this page can say
     that the table under it cannot. */
  return cfgHead("Official BU list",
      strays.length ? ['<span class="pill warn">' + plural(strays.length, "name") +
                       ' on people and not on this list</span>'] : [],
      "people", mayEdit) +

    section("", "Your names, and what they point at",
      null,
      table +
      (strays.length
        ? '<div class="note bad-note"><b>' + esc(strays.join(", ")) +
          '</b> ' + (strays.length === 1 ? 'is on somebody' : 'are on people') +
          '\u2019s record and not on this list. Add ' + (strays.length === 1 ? 'it' : 'them') +
          ' above, or correct the spelling on <b>People</b>.</div>'
        : '') +
      '<div class="note"><b>Pointing at nothing is an answer.</b> A part of the business can ' +
      'employ people and carry no strategy here \u2014 they are on the register, they belong to it, ' +
      'and there is simply nothing for them to open. Mapping it later moves nobody by itself: ' +
      'the register marks where somebody sits somewhere other than their BU says, and leaves ' +
      'the answer to you.</div>' +
      /* REWRITTEN WITH §57. It used to say a name could point at the COMPANY,
         which was the best a single target could do and is exactly why it
         placed nobody: a company holding three units cannot say which one
         somebody is in. Now the name holds the units themselves, and the
         person picks from those few when they sign in. */
      '<div class="note"><b>One name may hold several.</b> Where your own records call ' +
      'something a BU that is a group of units here, map it to the units themselves rather ' +
      'than to one of them. Nobody is placed automatically from a name that holds more than ' +
      'one \u2014 they are offered exactly those to pick from when they first sign in, and you ' +
      'confirm it on <b>People</b>.</div>');
}

/* ── A company's own three dots (§261) ───────────────────────────────
   Two entries and no handle. A company has no order in the navigation — it is
   reached from a dropdown, not from the row of destinations — so there is
   nothing here to arrange, and a grip that reordered a list nobody sees would
   be a control with no outcome (§45.2). */
/* A FULL STOP THAT IS NOT ALREADY THERE (§261). A unit can be called
   "IT Dist.", and a sentence ending in a list of names is where that shows. */
function endStop(t){
  return /[.!?]\s*$/.test(t) ? t : t + ".";
}
function coPanels(ck, co, on){
  if (CLEARING !== "co|" + ck) return "";
  var blockers = companyRetireBlockers(ck);
  /* §62's shape: the entry is always live and the press either asks the
     question or names what is in the way. The chip that used to sit in the row
     said "holds 3 units" and nothing else — a refusal with no way to ask for
     the reason, which is what a disabled control always is. */
  if (on && blockers.length)
    return '<div class="kmenu kconfirm"><div class="cq">' +
      '<b>' + esc(co.name) + ' cannot be retired yet.</b> ' +
      /* THE LIST GOES LAST, and the stop after it is conditional: a unit may be
         called "IT Dist." and the sentence read "IT Dist.." — found by opening
         the refusal and reading it, not by reading the code. `fnPanels` joins
         sentences the same way and has the same latent fault; it is recorded
         rather than fixed here, because that one is not this change's. */
      'Move its ' + plural(blockers.length, "business unit") + ' to another ' +
      'company, or make each of them its own, and this becomes possible. ' +
      'Nothing is lost meanwhile' + endStop(" — " + esc(blockers.join(", "))) +
      '</div><div class="cbtns"><button data-clearno="1">Close</button></div></div>';
  return '<div class="kmenu kconfirm"><div class="cq">' +
    '<b>' + (on ? "Retire " : "Restore ") + esc(co.name) + '?</b> ' +
    (on ? 'It leaves the group dropdown. Its key is written into every role held over it, ' +
          'so nothing is deleted and restoring puts it back exactly as it was.'
        : 'It returns to the group dropdown and every role held over it reads again.') +
    '</div><div class="cbtns">' +
      '<button class="danger" data-coact="' + esc(ck) + '">Yes, ' +
        (on ? "retire" : "restore") + '</button>' +
      '<button data-clearno="1">Cancel</button></div></div>';
}
function coKebab(ck, co, on, mayEdit){
  if (!mayEdit) return '<td class="cc kebcell"></td>';
  var acts = [
    '<button data-rowdlg="companies|' + esc(ck) + '">Edit details</button>',
    '<hr>',
    '<button class="danger" data-coclear="' + esc(ck) + '">' +
      (on ? "Retire this company" : "Restore this company") + '</button>'
  ];
  return kebabCell(COMENU === ck, acts, coPanels(ck, co, on), co.name,
    'data-comenu="' + esc(ck) + '"', CLEARING === "co|" + ck);
}

function renderCompanies(){
  /* §85's pen per row became a dialog per row (§261): what a company is called
     and what its CEO sees are three fields, and they are opened from the row's
     own menu. `mayEdit` is the one remaining question — may this viewer change
     anything on this page at all. */
  var mayEdit = grant("c_units") === "edit";
  var live = activeCompanyKeys().length;
  return cfgHead("Companies", [], null, mayEdit) +
    section("", "Companies", null,
      /* §84. NO SEARCH BAR: two rows, and a search box above two rows hides
         nothing and costs a header — the threshold is in the spec (§2.2) and
         this is the table it was written for. It still sorts and still carries
         the retired filter, because both are one attribute each and a client
         with fifteen companies gets them for free. */
      tkBar("companies", { placeholder:"Search the companies\u2026" }) +
      '<div class="cfg"><table class="unitcfg" data-tktable="companies"><thead><tr>' +
        (function(){ var h = tkHead("companies");
          return h("#", "idx", false) + h("Company") + h("Units", "cc") +
                 h("Sees other companies", "cc") + h("Sees the group", "cc") +
                 h("Status", "cc") + h("", "cc kebcell", false); })() +
      '</tr></thead><tbody>' +
      COMPANY_KEYS.map(function(ck, i){
        var co = COMPANIES[ck], on = companyActive(ck);
        var flag = function(val){
          return '<span class="pill ' + (val ? "good" : "none") + '">' +
            (val ? "Yes" : "No") + '</span>';
        };
        return '<tr data-tkrow="' + (on ? "active" : "retired") + '"' +
          (on ? '' : ' class="retired"') +
          '><td class="idx">' + (i+1) + '</td>' +
          '<td><b>' + esc(co.name) + '</b>' +
            '<span class="why mono">key ' + esc(ck) + '</span></td>' +
          '<td class="cc"><span class="mono">' + unitsOfCompany(ck).length + '</span></td>' +
          '<td class="cc">' + flag(co.seeOthers) + '</td>' +
          '<td class="cc">' + flag(co.seeGroup) + '</td>' +
          /* STATUS HOLDS A STATUS HERE TOO (§261). It held a pen and, beside
             it, a dotted chip reading "holds 3 units" — which is not a fact
             about the company at all but the REFUSAL that stands in for the
             Retire button. A refusal belongs where the confirmation would be
             (§62), so it is a panel under the menu now, and the entry stays
             LIVE rather than being replaced by a chip: pressing it either asks
             the question or names what is in the way. */
          '<td class="cc"><span class="pill ' + (on ? "good" : "none") + '">' +
            (on ? "Active" : "Retired") + '</span></td>' +
          coKebab(ck, co, on, mayEdit) + '</tr>';
      }).join("") + '</tbody></table></div>' +
      (mayEdit ? '<div class="addrow"><button class="editbtn" id="addcompany">+ Add a company</button></div>' : '') +
      '<div class="note"><b>A company groups business units so a company CEO sees their own.</b> ' +
      'In this version it carries <b>no score and no page</b> — it decides who sees what, nothing ' +
      'more. Supporting functions belong to no company: they serve all of them. ' +
      'A company is <b>retired, never deleted</b>, and only once no unit belongs to it. ' +
      (soloUnits().length
        ? soloUnits().length + ' unit' + (soloUnits().length === 1 ? ' stands' : 's stand') +
          ' alone: ' + soloUnits().map(function(k){ return esc(UNITS[k].name); }).join(", ") + '.'
        : 'Every unit belongs to a company.') + '</div>');
}


/* ── Knowledge base ─────────────────────────────────────────────────
   Added 3.5. How the platform works, in one place, so the answer to "why does
   it do that" has an address instead of living in an Info modal on whichever
   page happened to prompt the question.

   It is a PAGE, not a set of tooltips. The Info button and its modals were
   removed in 2.9 for a reason - an explanation that only appears where you
   already are cannot be read before you get there, or sent to someone, or
   scanned. This is written to be read start to finish by someone new, and
   added to every time we settle something.

   What lives here versus in DECISIONS-AND-LOGIC: this says how the platform
   BEHAVES, in the words a client would use. The decisions document says why we
   chose it and what we rejected, in ours. They are different readers. */
function kbSection(id, title, blocks){
  return '<div class="kb-sec" id="kb-' + id + '"><h3>' + title + '</h3>' +
    blocks.map(function(b){
      return b.h ? '<h4 class="mini">' + b.h + '</h4><p class="kb-p">' + b.p + '</p>'
                 : '<p class="kb-p">' + b.p + '</p>';
    }).join("") + '</div>';
}

/* ── The task recipes on the page (§103) ─────────────────────────────
   Rendered from `RECIPES`, which is DATA — so `scripts/extract-kb.js` reads
   the same array into the assistant's corpus and the words a person reads and
   the words it answers from cannot drift (§42, applied to prose).

   `{pillar}` and `{pillars}` are substituted here rather than baked in, because
   a tenant that calls a pillar something else must not be answered in Raya's
   vocabulary (§65) — the same reason `L()` exists everywhere else.

   A recipe's answer is one string with `|` between paragraphs. Not an array:
   the file is long enough already, and a separator that cannot appear in prose
   costs nothing to read and one line to split. */
/* THE LABEL IS TAKEN EXACTLY AS IT COMES (§107.8, fixed 2026-08-29).
   `{pillars}` used to render `plural(2, L("pillar","bu"))` — and `plural()`
   returns a COUNT followed by the word, while `bu` for a pillar is already
   "Pillars". So the shipped question "How do I reorder my {pillars}?" was
   rendering as "How do I reorder my 2 Pillarss?" on every deployment: a
   number nobody asked for and a doubled s. §107.8 had already written the
   rule down — a tenant's label is never inflected, because there is no
   singular anywhere for a sentence to reach for — and this was the one place
   still inflecting one, in the product's own help.

   Both tokens now resolve to the label as given. `{pillars}` is kept as an
   alias so a recipe reworded by a tenant (§140) cannot break by using it,
   and every sentence in recipes.js is phrased to accept a plural noun. */
function recipeText(t){
  var word = L("pillar","bu");
  return String(t)
    .replace(/\{pillars\}/g, word)
    .replace(/\{pillar\}/g, word);
}

/* THE PEN'S STATE. File-scope like the other page modes; the page is the
   office's (§125), so everyone who can open it may edit — the control still
   asks inOffice() (§42: the gate is on the control) and the server classifies
   a GROUP.kb change as setup, so both ends answer alike (§94.2). */
var KBEDIT = false;
/* The file menu's open state, and the classified upload waiting for Apply.
   Both are SCREEN state and neither is stored: a review abandoned by
   navigating away is a review that never happened (§25, §47.1). */
var KBFILEMENU = false;
var KBFILE = null;      /* { changes, name } while a review is on screen */

/* WHICH TAB (§141): "how" or "qa". A SCREEN PREFERENCE (§25, §47.1) — one
   person reading the reference must not decide the tenant's landing tab —
   remembered per browser, with a throwing store reading as the default
   (§107's rule: a page nobody can open is worse than a lost preference). */
function kbTab(){
  try { return localStorage.getItem("smp.kb.tab") === "qa" ? "qa" : "how"; }
  catch (e) { return "how"; }
}
function kbTabSet(t){
  try { localStorage.setItem("smp.kb.tab", t === "qa" ? "qa" : "how"); } catch (e) {}
}

/* WHO AN ANSWER IS FOR, ON THE CARD (§161). Drawn for the two audiences
   that are a DECISION and not for `everyone`, which is the default 57 of 64
   questions carry — a chip on nearly every card is furniture, not a mark
   (§41's budget). The office sees every card whatever the audience says:
   this page is the editing surface, and hiding a question here would leave
   it readable by nobody and editable by nobody (§61). */
function kbAudChip(w){
  w = SMPRules.kbAudienceWord(w);
  if (w === "everyone") return "";
  return ' <span class="pill kind kbaud-' + w + '">' +
    esc(SMPRules.KB_AUDIENCE_LABEL[w]) + '</span>';
}
/* The picker, in edit mode. Here rather than only in the file, or a question
   added on this page could be given an audience nowhere but a spreadsheet —
   which is §61's trap wearing the file's clothes. */
function kbAudPick(id, w){
  w = SMPRules.kbAudienceWord(w);
  return '<label class="kbed-aud"><span>Answered to</span><select data-kbaud="' +
    esc(id) + '">' +
    SMPRules.KB_AUDIENCES.map(function(o){
      return '<option value="' + o + '"' + (o === w ? " selected" : "") + '>' +
        esc(SMPRules.KB_AUDIENCE_LABEL[o]) + '</option>';
    }).join("") + '</select></label>';
}

function kbEdCard(id, q, a, mark, aud){
  return '<div class="kbed' + (mark === "edited" ? " on" : "") + '">' +
    '<input class="kbed-q" data-kbq="' + esc(id) + '" value="' + esc(q) + '">' +
    '<textarea class="kbed-a" data-kba="' + esc(id) + '">' + esc(a) + '</textarea>' +
    '<div class="kbed-foot">' + kbAudPick(id, aud) +
      (mark === "edited"
        ? '<span class="kbed-mark">Edited for this platform</span>' +
          '<button type="button" class="kbed-reset" data-kbreset="' + esc(id) + '">' +
            'Back to the standard wording</button>'
        : "") +
      (mark === "yours"
        ? '<span class="kbed-mark quiet">Yours</span>' +
          '<button type="button" class="kbed-x" data-kbdel="' + esc(id) + '">' +
            'Remove this question</button>'
        : "") +
    '</div></div>';
}

/* ── WHAT AN UPLOAD WILL DO, BEFORE IT DOES IT (§161) ──────────────
   The shape the people file and the plan import already use (§48.2, §87):
   a tally, the rows, and two buttons. Nothing is written until Apply.

   AN UNRECOGNISED ID IS DRAWN IN RED AND APPLIES NOTHING, because that is
   the row that would otherwise become a silent duplicate of a question
   that already exists — and the refusal names the way forward (§16.7),
   which is to clear the Id or correct the spelling.

   THE EMPTY CASE SAYS SO. A file that changes nothing is the answer when
   somebody re-uploads what they downloaded, and a panel that renders
   nothing there reads as a page that failed (§45.2). */
function kbFileReview(){
  if (!KBFILE) return "";
  var c = KBFILE.changes, n = kbChangeCount(c);
  var pill = function(cls, txt){ return '<span class="pill ' + cls + '">' + txt + '</span>'; };
  var tally =
    (c.reword.length ? pill("attn", plural(c.reword.length, "answer") + " reworded") : "") +
    (c.add.length ? pill("", plural(c.add.length, "question") + " added") : "") +
    (c.reset.length ? pill("", c.reset.length + " back to the standard wording") : "") +
    (c.audience.length ? pill("", plural(c.audience.length, "audience") + " changed") : "") +
    (c.unknown.length ? pill("bad", plural(c.unknown.length, "unrecognised id")) : "");
  var W = SMPRules.KB_AUDIENCE_LABEL;
  var line = function(id, what, aud, cls){
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td class="mono">' +
      esc(id) + '</td><td>' + what + '</td><td>' + esc(aud || "") + '</td></tr>';
  };
  var body = "";
  c.reword.forEach(function(x){
    body += line(x.id, "Answer reworded", W[x.w]); });
  c.reset.forEach(function(x){
    body += line(x.id, "<b>Back to the standard wording</b> &mdash; your change is cleared",
      W[x.w]); });
  c.audience.forEach(function(x){
    body += line(x.id, "Wording unchanged",
      W[x.w] + " \u2190 " + W[x.from]); });
  c.add.forEach(function(x){
    body += line("\u2014", "<b>New question</b> &mdash; &ldquo;" + esc(x.q) + "&rdquo;",
      W[x.w]); });
  c.unknown.forEach(function(x){
    body += line(x.id, '<b class="bad-tx">No question has this id</b> &mdash; nothing will ' +
      'be applied to this row. Clear the Id to add it as a new question, or correct the ' +
      'spelling.', "", "kbf-bad"); });
  /* A FILE THAT COULD NOT BE READ SAYS SO HERE, where the upload is (§48.8),
     and nothing else is drawn — a tally of zero beside an error reads as
     though the file was fine and simply changed nothing. */
  if (KBFILE.problem) {
    return '<div class="imp kbfile"><div class="imp-step">' +
      '<div class="note bad-note"><b>' + esc(KBFILE.name || "That file") + '</b> ' +
      esc(KBFILE.problem) + '</div>' +
      '<div class="imp-row" style="margin-top:14px">' +
      '<button class="linkbu" data-kbdiscard="1">Close</button></div></div></div>';
  }
  return '<div class="imp kbfile"><div class="imp-step">' +
    '<h4 class="mini">' + esc(KBFILE.name || "The uploaded file") + '</h4>' +
    (n || c.unknown.length
      ? '<div class="imp-tally">' + tally + '</div>' +
        '<table><thead><tr><th>Id</th><th>What changes</th><th>Audience</th></tr></thead>' +
        '<tbody>' + body + '</tbody></table>'
      : '<p class="why">Nothing in this file is different from what is here now.</p>') +
    '<div class="imp-row" style="margin-top:14px">' +
      (n ? '<button class="editbtn apply" data-kbapply="1">Apply to the knowledge base</button>'
         : '') +
      '<button class="linkbu" data-kbdiscard="1">' + (n ? "Discard" : "Close") + '</button>' +
    '</div></div></div>';
}

function kbRecipes(){
  return RECIPES.map(function(g){
    /* RAW IN EDIT MODE, THE RULE'S IN READ MODE. `kbAdds` drops an entry with
       nothing in it — right for the corpus and the page, where an empty
       question says nothing — but the card just minted by "+ Add" IS empty,
       and filtering it out made the button write state and show nothing
       (§45.2: a feature that renders nothing looks like one that was never
       built — caught by driving it, minutes after writing it). */
    var adds = KBEDIT
      ? ((GROUP.kb && GROUP.kb.add) || []).filter(function(x){ return x && x.g === g.g; })
      : SMPRules.kbAdds(GROUP.kb, g.g);
    var items = g.items.map(function(r){
      /* THE TENANT'S WORDING WINS, by the one rule the assistant also reads
         (§140, §103): what this page shows IS what the bot answers from. */
      var o = SMPRules.kbLook(GROUP.kb, r.id);
      var aud = SMPRules.kbAudience(GROUP.kb, r.id, r.who || g.who);
      if (KBEDIT) {
        return kbEdCard(r.id, o ? o.q : r.q, o ? o.a : r.a, o ? "edited" : null, aud);
      }
      /* AN OVERRIDE IS TYPED TEXT AND RENDERS AS TEXT. The shipped answers
         carry deliberate <b> markup and render raw; a rewritten one must not
         inherit that path — office-only or not, prose typed into a box that
         comes back as live markup is §43's lesson waiting to repeat. */
      if (o) {
        return '<div class="kb-rec" id="kb-r-' + esc(r.id) + '">' +
          '<h4 class="kb-q">' + esc(recipeText(o.q)) + kbAudChip(aud) +
          '</h4>' +
          SMPRules.kbParas(recipeText(o.a)).map(function(para){
            return '<p class="kb-p">' + esc(para) + '</p>';
          }).join("") + '</div>';
      }
      /* TWO TRUE ANSWERS TO ONE QUESTION are two entries sharing a `q`
         (spec 016 §5.2b). On the page BOTH are shown, because the knowledge
         base is readable by everyone and the office's answer is not a secret —
         it is merely useless to somebody who cannot do it.

         SO THE MARK GOES ON THE AUDIENCE, NEVER ON THE DUPLICATE. Marking only
         the second of a pair left the two-track question rendering as the same
         heading twice with nothing between them, which reads as a bug; and
         marking by position would leave a lone office recipe unmarked in a
         group that is not the office's. Whoever it is for, it says so. */
      return '<div class="kb-rec" id="kb-r-' + esc(r.id) + '">' +
        '<h4 class="kb-q">' + esc(recipeText(r.q)) + kbAudChip(aud) + '</h4>' +
        SMPRules.kbParas(recipeText(r.a)).map(function(para){
          return '<p class="kb-p">' + para + '</p>';
        }).join("") +
      '</div>';
    }).join("");
    /* The office's own questions, at the foot of the group they were added
       to — read like any other entry, editable like one of theirs. */
    items += adds.map(function(x){
      if (KBEDIT) return kbEdCard(x.id, x.q, x.a, "yours", x.w);
      return '<div class="kb-rec" id="kb-r-' + esc(x.id) + '">' +
        '<h4 class="kb-q">' + esc(recipeText(x.q)) + kbAudChip(x.w) + '</h4>' +
        SMPRules.kbParas(recipeText(x.a)).map(function(para){
          return '<p class="kb-p">' + esc(para) + '</p>';
        }).join("") + '</div>';
    }).join("");
    if (KBEDIT) {
      items += '<button type="button" class="kbadd" data-kbadd="' + esc(g.g) + '">' +
               '+ Add a question to this group</button>';
    }
    return { id: "how-" + g.g.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""),
             title: g.g, html: items };
  });
}

function renderKB(){
  var L1 = L("pillar","bu");
  var secs = [
    kbSection("scoring", "Scoring — how every figure is judged", [
      { p: 'One scale for every figure scored against a benchmark. <b>Performance is ' +
           'actual over target; execution is delivered over plan</b> — the same kind of ' +
           'number, so both read on the same bands. The colour and the status word come ' +
           'from the same place, so they can never contradict each other.' },
      { h: "Nothing is stored as a score",
        p: 'Every score is derived when the page is drawn, from the figures beneath it. ' +
           'Nothing is written down as a percentage, so a number can never disagree with ' +
           'what it was calculated from.' },
      { h: "Nothing is not zero",
        p: 'A measure with no actual reported is <b>not scored</b>, not scored as zero. ' +
           'Where there is nothing to compute from, the platform says so — ' +
           '"Not yet measurable" — rather than printing a figure it cannot stand behind.' },
      { h: "The reward line",
        p: 'At <b>100%</b> delivering the commitment earns. Set it higher and a measure ' +
           'can meet its target without clearing the reward line — a fourth standing, ' +
           '<i>met, not earning</i>, appears between short and earning. Either way the ' +
           'measure is scored against its own target exactly as before: ' +
           '<b>focus changes no score</b>.' }
    ]),
    kbSection("access", "Access — who sees what", [
      { p: 'Access is <b>page level only</b>. If a role can open a page it sees everything ' +
           'on that page — restriction happens by removing the page, never by trimming its ' +
           'contents. A person carries one or more <b>roles</b>, and each role is attached ' +
           'to something: the group, a company, a unit, a function.' },
      { h: "The office is two roles",
        p: 'The <b>Super user</b> owns the deployment; the <b>SMO team</b> runs it. The team ' +
           'has everything the Super user has — every unit, every function, the reporting ' +
           'cycle, Setup — except three things, which are rules rather than cells: they ' +
           '<b>read</b> Roles &amp; access and do not change it, they <b>retire</b> rather ' +
           'than delete, and they set passwords for the client\u2019s people but never for ' +
           'a Super user or for each other. The register carries the seat, so moving one ' +
           'there is treated as changing the matrix — not as editing a row.' },
      { h: "Nine roles, nine kinds of page",
        p: 'The table on <b>Roles &amp; access</b> is roles down the side and kinds of page ' +
           'across the top. Not individual pages — a unit\u2019s five pages answer together, ' +
           'because &ldquo;may they open this unit&rdquo; is one question, not five. The last ' +
           'row, <i>Everyone else</i>, is not a role anybody holds: it is the floor somebody ' +
           'with no role at all stands on.' },
      { h: "Three of the roles are read off the plan",
        p: '<b>Project owner</b>, <b>' + L1 + ' owner</b> and <b>Contributor</b> are never ' +
           'granted by hand — being named on the plan is the role. Whoever is named a ' +
           'project\u2019s Owner is its project owner; whoever is named a ' + L1.toLowerCase() +
           '\u2019s is its ' + L1.toLowerCase() + ' owner; everybody else a plan names — a ' +
           'collaborator, a stakeholder, a milestone\u2019s owner — is a contributor. Each ' +
           'still needs its <b>Reporting</b> cell opened before it reports anything, and then ' +
           'it reaches only its own lines: the project, the ' + L1.toLowerCase() + ', or the ' +
           'rows that name the person. None of the three ever submits, because submitting ' +
           'speaks for the whole subject.' },
      { h: "Own is not a setting",
        p: '<b>Own business unit</b> means the units they hold a role in. The head and the ' +
           'custodian of Mobile own Mobile; a company CEO owns every unit in their company; ' +
           'the SMO and the group CEO own all of it. Nobody types that in — it is read from ' +
           'who is attached to what, so this table and the unit pages cannot disagree.' },
      { h: "Three states, and one cell with a fourth",
        p: 'Each cell is <b>none</b>, <b>view</b> or <b>edit</b>. Edit includes view. Two ' +
           'would not be enough: a unit head reads the weighting table but does not manage ' +
           'it, and that is not expressible in two.' },
      { h: "Fill gaps sits between reading and editing",
        p: 'The two <b>Strategy</b> cells carry a fourth setting, <b>Fill gaps</b>: the role ' +
           'may write where the plan holds nothing — an unset target, an unnamed owner, a ' +
           'tactic with no quarters — and nowhere else, and never adds, removes, renames or ' +
           'reorders a row. What they write stays <b>pending</b>: amber, theirs to correct, ' +
           'counted nowhere, and not scored where a score would read it, until the office ' +
           'confirms it — with a tick, or simply by correcting the value. Reporting and drafts ' +
           'flow against a pending value; <b>submitting waits</b> on one, because submitting ' +
           'says the performance can be read.' },
      { h: "Someone holding several roles",
        p: 'They get the <b>most generous</b> answer of them — but each role answers only ' +
           'about what it is attached to. Owning Mobile and sitting on Finance gives the ' +
           'owner\u2019s answer for Mobile and the other-unit answer for Retail, from the ' +
           'same two roles, without either being asked about the wrong thing.' },
      { h: "The own columns answer in two halves",
        p: 'Strategy is the <b>words as agreed</b> — Foundation, the SWOT, the Plan, and on a ' +
           'function a capability\u2019s definition and projects. Reporting is the <b>figures ' +
           'entered against them</b>, drafts and submitting. Strategy edit ships with the ' +
           'office alone, because a plan you are measured against is not yours to rewrite — ' +
           'and opening it to a role is a deliberate act made on this table, not a side ' +
           'effect of letting the same people report (§117).' },
      { h: "Two things the table does not decide",
        p: 'The <b>knowledge base</b> is the office\u2019s \u2014 the Super user and the ' +
           'SMO team \u2014 because it explains how the platform itself is run (\u00a7119, ' +
           'reversing \u00a730). And <b>focus measures</b>, what carries reward, are marked ' +
           'by the group CEO and the SMO. These are rules; they do not change when the ' +
           'table does.' },
      { h: "Companies decide reach",
        p: 'A company groups business units so a company CEO sees their own. It carries ' +
           '<b>no score and no page</b> — it decides who sees what, nothing more. Its two ' +
           'flags, whether its CEO sees the group and the other companies, can only ever ' +
           '<b>narrow</b> what the table allows. Supporting functions belong to no company: ' +
           'they serve all of them.' },
      { h: "The server decides, not the screen",
        p: 'Signing in is checked on the server against a stored password, and so is every ' +
           'save: the change is classified against what is <b>stored</b> — a plan edit, a ' +
           'figure, a setting, a gap being filled or confirmed — and refused where the ' +
           'person\u2019s roles do not allow it. A screen that offers something the server ' +
           'would refuse is a fault, not a shortcut. The same comparison writes the ' +
           '<b>change log</b>, so who moved a target is answerable.' }
    ]),
    /* ── THE REGISTER'S THREE NOTES, MOVED HERE (§90) ────────────────
       Islam: "remove the notes below the registry table and take them to the
       knowledge base as agreed." §30's rule — a setup table is where you
       CHANGE a thing, not where it is explained — applied to the last page
       still carrying three paragraphs of model under its rows.

       MOVED, NOT DELETED. Each said something true that is said nowhere else:
       what people actually type at the door, what an issued password does
       next, and why retiring and deleting are different acts. */
    kbSection("register", "The people register", [
      { p: 'One row per person: who they are, where they sit, and what they may do. It is ' +
           'the same file both ways — what downloads from <b>Register file</b> is the ' +
           'register as it stands, so the export and the template are one thing.' },
      { h: "People sign in with the address on the register",
        p: 'Somebody with no address can still sign in with the name in the <i>Sign-in ' +
           'name</i> column, which is off by default under <i>Columns</i>. <b>One address ' +
           'on two rows says who nobody is</b>, so the door refuses both until the register ' +
           'is corrected \u2014 and the register flags the pair rather than leaving it to be ' +
           'discovered at the door.' },
      { h: "An issued password is used once",
        p: 'Whoever you issue one to is asked to choose their own the first time they use ' +
           'it, so the same password never works twice for the same person. Resetting ' +
           'everybody ends their open sessions \u2014 and never touches your own, because ' +
           'being signed out of the screen you are working in is not a safety feature.' },
      { h: "Retire somebody who has left; delete a row that should never have existed",
        p: 'Retiring takes away every role they hold and closes the door, while everything ' +
           'already attributed to them stays true. Deleting takes the row, the password and ' +
           'the open sessions, and is <b>refused while anything still points at the ' +
           'person</b> \u2014 the refusal names what. Deleting is the Super user\u2019s.' },
      { h: "Two rows that are one person are merged, never guessed",
        p: 'Who a row <i>is</i> is decided by <b>Emp ID, then email</b> \u2014 never by the ' +
           'name, because two people really can share one. A row with neither is marked, ' +
           'because that is the row the next upload cannot match. Where two rows turn out ' +
           'to be one person, <b>Merge</b> on the row\u2019s menu hands every role, figure ' +
           'and setting to the row you keep and takes the other away.' }
    ]),
    kbSection("labels", "Labels — what each level is called", [
      { p: 'Every level of the model carries an <b>internal name</b> the platform is built ' +
           'on, and a <b>display label</b> the tenant sees. The internal name never ' +
           'changes. <b>The SMO manages this, not the client</b> — which is what stops a ' +
           'label collision reaching a screen.' },
      { h: "One label, two places",
        p: 'A level can read differently at group and at business unit — what the group ' +
           'calls a ' + L1.toLowerCase() + ' a unit may call something else — and both ' +
           'are set on the Labels page.' },
      { h: "No collisions",
        p: 'Every display label at each level is unique, so no two entities can render ' +
           'under the same word. A collision blocks saving until one of them changes: two ' +
           'different objects under one word on the same screen is not something the ' +
           'reader can recover from.' },
      { h: "Per tenant, not per strategy cycle",
        p: 'A cycle-scoped label would let 2026 and 2027 use different words for the same ' +
           'object, and no report spanning both could be read without a glossary.' },
      { h: "Vision, End State and Winning Aspiration are one entity",
        p: 'They are three display labels for the same statement, which is why a unit ' +
           'holds exactly one of them and never two.' }
    ]),
    kbSection("units", "Business units and supporting functions", [
      { h: "The short name is for the navigation only",
        p: 'Leave it blank and the full name is used. Page titles and every export keep ' +
           'the full name.' },
      { h: "A function is not a small unit",
        p: 'A function carries <b>no plan, no weight and no ' + L1.toLowerCase() + '</b> — ' +
           'it improves a cross-cutting capability the whole group depends on. The ' +
           '<b>code prefix</b> numbers the work it owns, the way a unit’s prefix numbers ' +
           'its ' + L1.toLowerCase() + '.' },
      { h: "Retired, never deleted",
        p: 'A unit or a function is <b>retired</b>, not removed: it carries reported ' +
           'history, and deleting it would rewrite what was already said. ' +
           '<b>The custodian slot is optional</b> — where the head does the work ' +
           'themselves they already have access as head.' },
      { h: "One function each",
        p: 'A function may hold several capabilities, which is why a custodian is named ' +
           'after the function and never after a capability: naming someone after one ' +
           'breaks the moment a second is assigned.' }
    ]),
    kbSection("plans", "Plans — how one arrives", [
      { h: "An upload authors, it does not amend",
        p: 'A plan arrives as a whole. That is why the template carries <b>no codes</b>: ' +
           'the platform mints them on arrival, so nobody has to keep a numbering scheme ' +
           'in their head or risk colliding with one.' },
      { h: "One unit per file",
        p: 'The unit is chosen on the template’s Read me sheet. A plan cannot arrive as ' +
           'a CSV, because a CSV cannot say whose plan it is.' },
      { h: "Nothing an import does is a deletion",
        p: 'Replacing a plan <b>archives</b> the outgoing one first. Archived plans are ' +
           'listed under Manage and can be restored.' }
    ]),
    kbSection("cycle", "The reporting cycle", [
      { p: 'Reporting is not a page you visit: it is what a cycle asks of you for a couple ' +
           'of weeks a quarter. It appears inside Performance while the window is open and ' +
           'leaves again when it closes.' },
      { h: "Closing takes a snapshot",
        p: 'Closing a cycle writes what was reported into history. What was said stays ' +
           'said — later edits do not reach back into a closed cycle.' }
    ]),
    kbSection("data", "Where the data lives", [
      { p: 'The platform holds <b>your own tenant</b>. Everything you enter is saved to the ' +
           'database as you work.' },
      { h: "Demo data is separate, and never saved",
        p: 'The <b>Demo data</b> button swaps the whole platform to a full worked example ' +
           'for explaining how it works. It is labelled while you are in it and it ' +
           '<b>refuses to save</b>. Nothing invented ever reaches your database.' },
      { h: "It works offline",
        p: 'Installed, the platform opens with no network on the data baked into the file, ' +
           'and says so. Live figures are never cached — a stale actual shown as current ' +
           'is worse than one that will not load.' }
    ]),
    kbSection("mail", "Email — what the platform sends", [
      { p: 'Mail leaves over the organisation\u2019s name, so <b>Setup \u203a Communication</b> ' +
           'is the SMO\u2019s. It says whether this deployment can send at all, what a message ' +
           'arrives as, what it looks like, and lets you send one to yourself before anybody ' +
           'else receives one.' },
      { h: "The address and the name are set in different places",
        p: 'The <b>sending address</b> lives in the deployment\u2019s settings, because it is ' +
           'tied to the domain verified with the mail service — changing it is a deployment ' +
           'decision. The <b>sender name</b> beside it is yours, on this page, and changing ' +
           'it takes effect at once.' },
      { h: "Verified is not the same as working",
        p: 'Until the domain is verified, a test can succeed and reach nobody but the ' +
           'account holder. The page says which of those you are in, rather than reporting ' +
           'a green light it has not earned.' },
      { h: "The preview is the real message",
        p: 'What you see on the page is drawn by the same code that builds what is sent — ' +
           'never a picture of it. It carries your accent and your organisation\u2019s name ' +
           'from <b>Branding</b>, so an email looks like the platform it came from.' },
      { h: "Why there is no logo on it",
        p: 'Mail clients block images carried inside a message, so a logo stored here would ' +
           'arrive as a broken box in the places most people read mail. The header is set in ' +
           'type instead. Putting the real mark on it means publishing it at an address ' +
           'anyone can fetch, which is a decision to take rather than assume.' }
    ])
  ];

  /* THE RECIPES: how to DO things, as opposed to how things work. Their own
     part of the page, because mixing a task into a paragraph of reasoning
     serves neither — somebody reading the Access section wants the argument,
     somebody asking "where do I press" wants four lines. */
  var recs = kbRecipes();
  /* THEIR OWN LIST SINCE §141: the page is two tabs — the written
     explanations, and the questions with the pen — and a recipe block pushed
     into `secs` would render on the wrong one. */
  var hows = recs.map(function(r){
    return '<div class="kb-sec kb-how" id="kb-' + r.id + '"><h3>' + esc(r.title) +
           '</h3>' + r.html + '</div>';
  });

  /* DERIVED, NEVER LISTED. This was a hand-written array beside the sections
     and it was ALREADY WRONG — nine sections, eight links, with the people
     register missing since the day it was added. A second copy of a list is a
     list that goes stale on the first edit somebody forgets (§42). */
  /* ── THE TOUR'S ONE WAY BACK IN (spec 017) ───────────────────────
     Explanation lives here (v3.5), so the replay of the guided tour lives
     here too rather than growing furniture of its own on a page somebody
     visits for another reason (§90).

     ABSENT, NEVER DISABLED, when this viewer's roles match no story: a
     button that explains it cannot help you is worse than no button, and
     there is nothing the person could do to earn it. */
  var tourStory = (typeof TOUR !== "undefined") ? TOUR.storyFor(viewer()) : null;
  var tourBlock = tourStory
    ? '<div class="kb-sec" id="kb-tour"><h3>The guided tour</h3>' +
      '<p class="kb-p">A short walk through the platform on the worked example — ' +
      'the demo data, labelled the whole time, so nothing you see belongs to your ' +
      'own tenant and nothing can be saved. It opens by itself the first time you ' +
      'sign in; this is how you see it again.</p>' +
      '<p><button type="button" class="editbtn" data-tour-replay="' + esc(tourStory) +
      '">Start the tour</button></p></div>'
    : '';

  /* THE TOUR IS A SECTION, SO IT GOES IN THE ARRAY (merge, §113.8). It
     arrived from the other session concatenated straight into the page — a
     real `.kb-sec` with a title and an id, but not in `secs`, so the derived
     contents listed sixteen of seventeen sections and the tour had no link.
     Exactly the fault deriving the contents was meant to end, arriving from
     the other side of a merge. First, because somebody who has just arrived
     needs the tour before they need the reference.

     AND IT HAS TO SIT BELOW `tourBlock`'s ASSIGNMENT, which is what the first
     attempt got wrong: `var` hoists the declaration and not the value, so an
     unshift written above it pushed `undefined`, the `if` was false, and the
     tour silently left the page. */
  if (tourBlock) secs.unshift(tourBlock);

  /* EACH TAB'S CONTENTS ARE ITS OWN (§141): a pill that jumps to a section
     on the hidden tab is a link that does nothing — the fault §110 records
     for a control, arriving as navigation. Derived per tab, same rule. */
  var tab = kbTab();
  var shown = tab === "qa" ? hows : secs;
  var toc = '<div class="kb-toc">' +
    shown.map(function(html){
      var id = (html.match(/id="kb-([a-z-]+)"/) || [])[1];
      var title = (html.match(/<h3>([^<]*)/) || [])[1] || "";
      title = title.split(" \u2014 ")[0];
      return id ? '<a href="#kb-' + id + '">' + title + '</a>' : '';
    }).join("") + '</div>';

  /* THE COUNTS SIT ON THE TABS, so the split explains itself (approved
     mockup): sections on one side, questions on the other — the QUESTIONS,
     not the groups, because 43 is what somebody is choosing to search. */
  var nQ = RECIPES.reduce(function(n, g){ return n + g.items.length; }, 0) +
           SMPRules.kbAllAdds(GROUP.kb).length;
  var tabs = '<div class="kbtabs" role="tablist">' +
    '<button type="button" role="tab" data-kbtab="how" aria-selected="' + (tab === "how") + '"' +
      (tab === "how" ? ' class="on"' : '') + '>How it works' +
      '<span class="kbcount">' + secs.length + '</span></button>' +
    '<button type="button" role="tab" data-kbtab="qa" aria-selected="' + (tab === "qa") + '"' +
      (tab === "qa" ? ' class="on"' : '') + '>Questions &amp; answers' +
      '<span class="kbcount">' + nQ + '</span></button>' +
  '</div>';


  /* THE PEN (§140): the office rewrites the answers on the page they are
     read from. Not cfgHead's data-edit machinery — that drives the EDITING
     registry and per-field pens; this page has one mode and its own writers —
     but the same slot on the header line, so the door is where every other
     page keeps it. */
  /* ON THE QUESTIONS TAB ALONE (§141): nothing on the explanations tab is
     editable, and a pen over a page it cannot mark is furniture. */
  var kbPen = inOffice() && tab === "qa"
    ? '<button class="editbtn' + (KBEDIT ? " on" : "") + '" data-kbpen="1">' +
        (KBEDIT ? "Done" : "\u270e Edit the answers") + '</button>'
    : "";
  /* ── THE QUESTIONS FILE (§161) ────────────────────────────────────
     The register's "Register file" shape (§90), on the questions tab only —
     nothing on the explanations tab is in the file, so a menu offering to
     download it there would be offering something else.

     THE UPLOAD IS A <label> STYLED AS THE ITEM: a file picker cannot be
     opened from script without a gesture, and a control that works in one
     browser and silently does nothing elsewhere is worse than a plain one
     (§90, §34's rule about a field's furniture). */
  var nQtotal = RECIPES.reduce(function(n, g){ return n + g.items.length; }, 0) +
                SMPRules.kbAllAdds(GROUP.kb).length;
  var kbFile = !(inOffice() && tab === "qa") ? "" :
    '<span class="hmenu' + (KBFILEMENU ? " open" : "") + '">' +
      '<button class="hmenu-btn" data-kbfilemenu="1" aria-haspopup="true" ' +
        'aria-expanded="' + KBFILEMENU + '">Questions file ' +
        '<span class="hcar">&#9662;</span></button>' +
      (KBFILEMENU
        ? '<div class="hmenu-panel">' +
            '<button class="hmenu-item" data-dlkb="1">' +
              '<span class="t">Download the questions</span>' +
              '<span class="d">All ' + nQtotal + ', in your own wording where you have ' +
              'changed it, with the standard answer beside each to compare against. ' +
              'The export and the template are one file.</span></button>' +
            '<div class="hmenu-sep"></div>' +
            '<label class="hmenu-item" for="kb-file">' +
              '<span class="t">Upload a filled file</span>' +
              '<span class="d">Matched on Id. A row with no Id adds a question; an ' +
              'answer put back to the standard wording clears your change. You see ' +
              'every change before anything is applied.</span></label>' +
            '<input type="file" id="kb-file" accept=".xlsx" class="vh" ' +
              'aria-label="Choose a filled questions file to upload">' +
          '</div>'
        : "") +
    '</span>';
  return cfgHead("Knowledge base", [], null, false, null, null, kbFile + kbPen) +
    kbFileReview() +
    (KBEDIT && tab === "qa"
      ? '<p class="kb-lede kbed-lede">What you write here is what this page shows ' +
        '<b>and</b> what the assistant answers from \u2014 the two can never disagree. ' +
        'A blank line is a paragraph break.</p>'
      : "") +
    /* BOTH SIDES OF THE MERGE BELONG HERE. The lede names the how-tos, which
       exist now (§116); `tourBlock` is the other session's onboarding tour
       (§107), and it opens the page because somebody who has just arrived
       needs the tour before they need the reference. */
    '<p class="kb-lede">How the platform works, and how to do things in it \u2014 in one ' +
      'place. This grows: anything we settle that a reader would need to know belongs here ' +
      'rather than in a note under the screen it happens to affect.</p>' +
    tabs + toc + '<div class="kb">' + shown.join("") + '</div>';
}


/* The reward rule is a property of the cycle, not of each measure \u2014 set once,
   read by every focus measure. A stretch target per measure would mean the line
   is negotiated one row at a time, which is how a scheme stops being a scheme. */
function renderBandsExtra(){
  var can = grant("c_bands") === "edit";
  var rows =
    '<div class="cfg"><table><tbody>' +
      '<tr><td style="width:46%">Reward begins at</td><td>' +
        (can && EDITING.bands
          ? inputOr2(CYCLE.rewardAt + "%", "Reward threshold", function(v){
              var n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
              if (!isNaN(n)) CYCLE.rewardAt = Math.max(1, Math.round(n));
            })
          : '<span class="mono val">' + CYCLE.rewardAt + '%</span>') +
        ' <span class="why" style="margin:0 0 0 8px;display:inline">of target</span></td></tr>' +
      '<tr><td>Marks locked</td><td>' +
        (can && EDITING.bands
          ? '<button class="rmbtn' + (CYCLE.locked ? ' on' : '') + '" data-lockcycle="1">' +
            (CYCLE.locked ? "Locked" : "Open") + '</button>'
          : '<span class="pill ' + (CYCLE.locked ? "none" : "good") + '">' +
            (CYCLE.locked ? "Locked" : "Open for marking") + '</span>') + '</td></tr>' +
    '</tbody></table></div>' +
    '<div class="note">At <b>100%</b> delivering the commitment earns. Set it higher and a ' +
      'measure can meet its target without clearing the reward line \u2014 a fourth standing, ' +
      '<i>met, not earning</i>, appears between short and earning. Either way the measure is ' +
      'scored against its own target exactly as before: <b>focus changes no score</b>.</div>';
  return section("", "Focus and reward", null, rows);
}

/* ── Setup · Focus measures ─────────────────────────────────────────
   Marking is a configuration act, not something to be done while reading a
   unit's page \u2014 a marking mode sitting in a reading view invites a stray click
   on a decision that carries money.

   Everything measurable in the unit is offered: its Key Objectives first, then
   each pillar's key measures, each with its target so the choice is made
   against the number rather than the name alone. */
var FSET = { unit:"mobile", side:"units" };   /* which destination is being marked, and which side of the fold */

/* THE SWITCH LIVES ON THE PAGE IT GOVERNS (§102), which is §90's shape and
   §98's row: five chat settings went into a dropdown on the Messages page
   rather than a Setup page of their own, because a switch behind its own rail
   entry is a door behind a door (§32).

   AND THE PAGE STAYS REACHABLE WHILE IT IS OFF. §61's trap, exactly: if
   turning focus off removed the page that carries the switch, the only way to
   turn it back on would be to turn it on first. So the page always renders,
   and while off it says what is being kept. */
function focusSwitch(){
  var on = focusOn();
  if (!inOffice()) {
    /* Not a control for them, and the fact still has to be said: a page that
       simply looks empty is a page that looks broken (§45.2). */
    return on ? '' : '<div class="note">Focus measures are switched off for this ' +
      'platform. The Strategy Office can turn them back on.</div>';
  }
  /* ── ON AND OFF, ON THE PINNED LINE (§135.5) ──────────────────────
     Islam: *"turn the big button to only On and Off switch and bring it to the
     sticky header line."*

     A SEGMENTED PAIR, which is what the navigation's own Units | Functions
     control already is — you press the state you want rather than pressing a
     button that says the state you are in and means the opposite. The old
     control was a 240px worded button reading "Focus measures are on", which
     is a sentence where a switch belongs, and it sat above a grey paragraph
     saying the same thing again.

     ITS OWN CLASS, NOT `.navswitch`. That one is scoped to `.units` and its
     colours are white-on-navy — reaching for it here is §65.9 exactly, a class
     name being one namespace and a control wearing somebody else's clothes.

     AND THE GREY NOTE GOES WITH IT. It carried the kept-marks count, which
     also carried a bug nobody had reported: `marks + plural(marks,"mark")`
     printed "0 0 marks", because plural() already puts the number in. */
  PAGE_ACTS +=
    '<span class="segsw" role="group" aria-label="Focus measures on or off">' +
      '<button type="button" class="seg' + (on ? ' on' : '') + '" data-focusswitch="1" ' +
        'aria-pressed="' + on + '">On</button>' +
      '<button type="button" class="seg' + (on ? '' : ' on') + '" data-focusswitch="0" ' +
        'aria-pressed="' + (!on) + '">Off</button>' +
    '</span>';
  return '';
}

/* ── WHERE THE MARKING IS BEING DONE (§135.5) ────────────────────────
   Islam: *"rather than a drop down for the units make it like the navigation
   at the top."* A dropdown answers "which one" and hides where the work was
   left; a row of destinations carrying their own counts says both at once —
   §16.7a settled the identical question on the source-of-figures page, and
   this is that answer applied to the page it was borrowed from.

   THE FOLD IS THE NAVIGATION'S, because Units and Functions are the same two
   sides here as up there, and a second word for them is a second thing to
   learn. `FSET.side` is screen state and is corrected rather than trusted: a
   side with nothing reachable behind it must not leave the page blank. */
function focusNav(){
  var subs = focusSubjects();
  var side = FSET.side === "fns" ? "fns" : "units";
  if (!subs[side].length) side = side === "fns" ? "units" : "fns";
  var list = subs[side];
  var both = subs.units.length && subs.fns.length;
  return '<div class="fnav">' +
    (both
      ? '<span class="segsw" role="group" aria-label="Units or supporting functions">' +
          '<button type="button" class="seg' + (side === "units" ? ' on' : '') +
            '" data-fsetside="units">Units</button>' +
          '<button type="button" class="seg' + (side === "fns" ? ' on' : '') +
            '" data-fsetside="fns">Functions</button></span>'
      : '') +
    '<div class="fnav-dests" role="tablist">' +
      list.map(function(x){
        var n = focusIn(x.key).length;
        return '<button type="button" role="tab" data-fsetgo="' + esc(x.key) + '" ' +
          'aria-selected="' + (x.key === FSET.unit) + '">' + esc(x.name) +
          (n ? '<i class="fnav-n">' + n + '</i>' : '') + '</button>';
      }).join("") +
    '</div></div>';
}

function renderFocusSetup(){
  /* Marking is the CEO's and the SMO's — a rule now, not a cell (§37).
     mayMarkFocus() carries the lock too, so there is one gate, not two. */
  var editable = mayMarkFocus();
  var bands = focusBands(FSET.unit);
  /* A destination that has gone (a unit retired, a function switched off)
     leaves the page pointing at nothing — corrected here rather than left to
     render an empty table under a name nobody can select. */
  if (!bands.length) {
    var subs = focusSubjects(), first = (subs.units[0] || subs.fns[0]);
    if (first && first.key !== FSET.unit) { FSET.unit = first.key; bands = focusBands(FSET.unit); }
  }

  /* ── ONE TABLE, HEADED THE WAY THE REGISTER IS (§135.5) ────────────
     Islam: *"make the table headers design better like the other tables like
     registry as an example."* It was never a table — it was `.pick` rows in
     divs under navy `.grouphead` bars, so it had no column headings at all and
     the target and the mark were floated numbers rather than columns.

     THE MARK IS THE LAST COLUMN, because that is the one somebody runs their
     eye down (§104.9's rule, on a different table). The band rows are the
     table's own, so the grouping survives sorting nothing and scrolling. */
  var row = function(m){
    var on = focusMarked(m.id);   /* the RAW map, never isFocus (§102) */
    return '<tr' + (on ? ' class="fon"' : '') + '>' +
      '<td class="fmeas">' + esc(m.name) + '</td>' +
      '<td class="cc ftar">' +
        (m.target ? tgtShown(m.target) : '<span class="missing">Missing</span>') + '</td>' +
      '<td class="cc">' +
        (editable
          ? '<button class="fmark-btn' + (on ? ' on' : '') + '" data-focus="' + esc(m.id) + '" ' +
            'aria-pressed="' + on + '" aria-label="' + (on ? "Unmark " : "Mark ") + esc(m.name) + '"></button>'
          : '<span class="fmark-btn' + (on ? ' on' : '') + '" style="cursor:default"></span>') +
        '<span class="fmark-w">' + (on ? "Marked" : (editable ? "Mark" : "")) + '</span>' +
      '</td></tr>';
  };
  var body = bands.map(function(b){
    /* `dxband` is the shared look (§135.8); `fband` is what this page's own
       spacing rule and its check key off. */
    return '<tr class="fband dxband"><th colspan="3">' + esc(b.band) + '</th></tr>' +
      (b.items.length
        ? b.items.map(row).join("")
        : '<tr><td colspan="3" class="fnone">Nothing to mark here.</td></tr>');
  }).join("");

  return focusSwitch() + focusNav() +
    '<div class="cfg ftable"><table><thead><tr>' +
      '<th style="width:56%">Measure</th>' +
      '<th class="cc" style="width:22%">Target</th>' +
      '<th class="cc" style="width:22%">Focus</th>' +
    '</tr></thead><tbody>' + body + '</tbody></table></div>';
}

/* ── Source of figures (§16.7) ───────────────────────────────────────
   Many measures are not the business unit's number at all. This is where the
   SMO says so: which figures another team is master of, and who in that team
   enters them.

   It is a SETUP page, not a cycle page, because the answer holds across
   cycles — revenue does not stop being Finance's in March. And it is the SMO's
   alone: a unit that could nominate the source of its own numbers could
   nominate itself.

   The pool is large (every key objective and every key measure in every unit),
   so it is filtered by unit, exactly as Focus measures is — one unit at a
   time is how the question is actually asked. */
/* ── Setup › Figure sets (spec 008) ──────────────────────────────────
   A set is named, belongs to a TEAM, has ONE owner, and says WHO MAY PICK its
   figures. Four fields and a count, which is the whole page — the picking
   happens elsewhere, because it is a different job done by a different person.

   WHO PICKS DEFAULTS TO THE SMO, and that is a security setting rather than a
   convenience: ticking from the full list IS reading every number in the
   group. For a team like Finance that costs nothing; for anybody else it hands
   the whole group's figures to somebody whose job was entering three of them.
   The exception is the one you switch on, not the one you remember to switch
   off — and the server enforces it, or the switch is decoration (§42). */
/* THE SECOND WAY OF ASSIGNING, AND ITS SWITCH (spec 008 §3B, §10).
   A unit's own custodian naming people against their own figures is built and
   OFF, at Islam's direction: one way of assigning is watched in practice
   before the second is turned on.

   It sits behind the Edit button on this page rather than on a page of its
   own, because it is one line about the same subject — who is master of which
   numbers — and a switch with a page to itself invites being flipped for the
   sake of it. THE SERVER READS THE SAME FLAG: a switch that only hides a
   control is decoration, which is what §42 cost us once already. */
function namingSwitch(mayEdit, editing){
  if (!mayEdit) return "";
  var on = namingOn();
  return '<div class="imp-row" style="margin:16px 0 0">' +
    '<span class="cfg-lab">Unit custodians may name who enters a figure</span>' +
    (editing
      ? '<span class="minisw">' +
          '<button data-naming="0" aria-pressed="' + (!on) + '">Off</button>' +
          '<button data-naming="1" aria-pressed="' + on + '">On</button></span>'
      : (on ? '<span class="pill attn">On</span>' : '<span class="pill none">Off</span>')) +
    '<span class="why" style="margin:0">' +
      (on
        ? 'Every unit gains a <b>Strategy › Who enters</b> page. A figure a set already holds cannot be named there.'
        : 'Figures are assigned on <b>Fill a figure set</b> only.') +
    '</span></div>';
}

function renderSetsSetup(){
  var mayEdit = grant("c_sets") === "edit";
  var editing = mayEdit && EDITING.sets;
  var sets = setsList();

  var teamOptions = function(sel, attr){
    return '<select class="fld" ' + attr + '><option value="">\u2014</option>' +
      FUNCTION_KEYS.map(function(k){
        return '<option value="' + esc(k) + '"' + (k === sel ? " selected" : "") + '>' +
          esc(FUNCTIONS[k].name) + '</option>';
      }).join("") + '</select>';
  };
  var ownerOptions = function(sel, attr){
    /* §181: THE NAME THE REGISTER SHOWS, not the full legal one. This printed
       "Mohamed Hassanin Ehsan Hassanin — Senior Manager (Sales)" and every
       option in the list was longer than the control. The register settled
       what somebody is called in §93.8 and the viewer switcher has read it
       since §142; this was one of the two surfaces still answering it its own
       way (§53.5).

       THE TITLE STAYS. It is what tells two people apart in a list of
       thirty-three, and it is the thing you pick BY — the same shape the
       switcher uses, where the place does that job. The VALUE is still the
       key, so nothing about what is stored changes. */
    var dn = displayNames();
    return '<select class="fld" ' + attr + '><option value="">\u2014</option>' +
      PEOPLE.filter(personActive).map(function(p){
        return '<option value="' + esc(p.key) + '"' + (p.key === sel ? " selected" : "") +
          ' title="' + esc(p.name + (p.title ? " \u2014 " + p.title : "")) + '">' +
          esc(knownName(p, dn)) + (p.title ? " \u2014 " + esc(p.title) : "") + '</option>';
      }).join("") + '</select>';
  };
  var pickOptions = function(sel, attr){
    return '<select class="fld" ' + attr + '>' +
      '<option value="smo"' + (sel !== "owner" ? " selected" : "") + '>The SMO fills it</option>' +
      '<option value="owner"' + (sel === "owner" ? " selected" : "") + '>Its owner picks</option>' +
      '</select>';
  };

  var rows = sets.map(function(st, i){
    /* §85. `editing` was the whole page; a row's own is whether it is open. */
    var editing = mayEdit && rowEditIs("sets", st.id);
    var n = SMPRules.rowsOfSet(world(), st.id).length;
    return '<tr' + (editing ? ' class="tk-open"' : '') + '>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td>' + (editing
        ? '<input class="fld tk-firstfield" value="' + esc(st.name) + '" data-setname="' + esc(st.id) + '">'
        : '<b>' + esc(st.name) + '</b>') +
        '<span class="why mono">id ' + esc(st.id) + '</span></td>' +
      '<td>' + (editing
        ? teamOptions(st.team, 'data-setteam="' + esc(st.id) + '"')
        : (FUNCTIONS[st.team] ? esc(FUNCTIONS[st.team].name)
                              : '<span class="why" style="margin:0">No team</span>')) + '</td>' +
      '<td>' + (editing
        ? ownerOptions(st.owner, 'data-setowner="' + esc(st.id) + '"')
        : (personName(st.owner)
            ? esc(personName(st.owner))
            : '<span class="missing">Nobody yet</span>')) + '</td>' +
      '<td>' + (editing
        ? pickOptions(st.pick, 'data-setpick="' + esc(st.id) + '"')
        : (st.pick === "owner"
            ? '<span class="pill attn">Its owner picks</span>'
            : '<span class="pill kind">The SMO fills it</span>')) + '</td>' +
      '<td class="num">' + n + '</td>' +
      rowActions("sets", st.id, editing,
        mayEdit && !editing
          ? '<button class="linkbu" data-setdel="' + esc(st.id) + '">Remove</button>' : '') +
      '</tr>';
  }).join("");

  /* The Add row is the page's, so it stays while a row is open (§85.2). */
  var addRow = mayEdit
    ? '<tr class="newrow"><td class="idx">+</td>' +
      '<td><input class="fld" id="newset-name" value="' + esc(NEWSET.name) +
        '" placeholder="Financial Figures"></td>' +
      '<td>' + teamOptions(NEWSET.team, 'id="newset-team"') + '</td>' +
      '<td>' + ownerOptions(NEWSET.owner, 'id="newset-owner"') + '</td>' +
      '<td>' + pickOptions(NEWSET.pick, 'id="newset-pick"') + '</td>' +
      '<td class="num">\u2014</td>' +
      '<td class="cc"><button class="editbtn" id="newset-add">Add</button></td></tr>'
    : '';

  var claimed = SMPRules.sourceRows(world()).length;

  return cfgHead("Figure sets", [], "sets", mayEdit, null, null) +
    /* §84. NO SEARCH, NO SORT, and both are the spec (§2.2, §6.2) rather than
       an omission. One set today: a search box above one row is furniture. And
       the order of the sets is the order somebody put them in — the same
       argument as Business units — so sorting would be indistinguishable from
       rearranging. It is wired into the kit anyway, so a tenant that grows to
       twenty sets gets the search by crossing the threshold rather than by
       somebody remembering this page. */
    tkBar("sets", { rows:sets.length, placeholder:"Search the sets\u2026" }) +
    '<div class="cfg"><table data-tktable="sets"><thead><tr>' +
      '<th style="width:34px">#</th><th style="width:26%">Set</th>' +
      '<th style="width:16%">Team</th><th style="width:22%">Owner</th>' +
      '<th style="width:20%">Who picks its figures</th>' +
      '<th class="cc" style="width:9%">Figures</th><th class="cc" style="width:9%"></th>' +
    '</tr></thead><tbody>' + (rows || (mayEdit ? "" :
      '<tr><td colspan="7" class="why">No sets yet. A set is how a number that ' +
      'belongs to Finance stops being typed by ten business units.</td></tr>')) +
      addRow + '</tbody></table></div>' +
    namingSwitch(mayEdit, editing) +
    '<div class="note"><b>Who picks is a security setting, not a convenience.</b> ' +
      'Ticking from the full list means reading every number in the group \u2014 which ' +
      'costs nothing for a team that sees them all anyway, and hands the lot to somebody ' +
      'whose job was three of them otherwise. It defaults to <b>you</b>, and you open it ' +
      'deliberately. <b>Removing a set releases its figures</b> back to the units; nothing ' +
      'is lost.</div>';
}

/* ── Fill a figure set: ONE FLAT SEARCHABLE TABLE (§46.5) ─────────────
   Islam: "make the tables searchable not categorized by direction like this…
   we can have the table for all units as a default so we have the unit as a
   column that can be filtered by… accordingly the units names at the top are
   not usable and let's get the page neat so the table is pushed up and
   accordingly we have a sticky header."

   THE TWO JOBS WANT OPPOSITE SHAPES. Reading a unit's plan is done in plan
   order, one unit at a time, which is why the plan pages group by pillar.
   Filling a set is the other job entirely: you are hunting for the eleven
   revenue lines among a hundred and sixteen figures, and pillar order actively
   HIDES them from each other. Flat and filtered puts every "revenue" in the
   group on one screen — which is what a set crossing ten units is for.

   Seven columns, each earning its place:
     #        numbers WHAT IS SHOWN, so "11 of 116" is a countable claim
     Unit     a filter, not ten buttons — every unit is in by default
     In       how key objectives join the same table: a pillar code, or the
              words "Key objective". Without it a row cannot say where it sits.
     Measure  }  SEPARATE COLUMNS, deliberately. They were one visual blob, and
     Target   }  search over the blob matches "4B EGP" when you type a name.
     Dir.     the direction of travel
     Status   the tick, or the holding set's name and a request

   TYPING NEVER REPAINTS (§35). The filter runs over rows already in the DOM;
   a repaint would replace the input being typed into. The dropdowns DO
   repaint, because changing them changes the numbering and the tally. */
function srcFigures(){
  var out = [];
  activeKeys().forEach(function(k){
    var u = UNITS[k];
    (u.keyObjectives || []).forEach(function(m){
      out.push({ unit:k, unitName:u.navName || u.name, inw:"ko", inLabel:"Key objective", row:m });
    });
    (u.items || []).forEach(function(pl, pi){
      var code = pillarCode(u, pi);
      (pl.measures || []).forEach(function(m){
        out.push({ unit:k, unitName:u.navName || u.name, inw:code, inLabel:code,
                   inFull:code + " " + pl.name, row:m });
      });
    });
  });
  return out;
}

function renderSourceSetup(){
  var mine = myPickableSets();
  if (!mine.length) {
    return '<div class="note">No figure set is yours to fill. Sets are created on ' +
      '<b>Setup &rsaquo; Figure sets</b>.</div>';
  }
  var st = setById(SRCSET.set) || mine[0];
  if (!SMPRules.mayPickInto(world(), viewer(), st)) st = mine[0];
  SRCSET.set = st.id;

  var figs = srcFigures();
  if (!figs.length) return '<div class="note">No business unit has a plan yet.</div>';

  /* The dropdown filters, applied here; the SEARCH is applied in the browser
     without a repaint. So the tally has to be counted the same way search
     counts it — see srcTally() in the shell. */
  var shown = figs.filter(function(f){
    if (SRCSET.unit && f.unit !== SRCSET.unit) return false;
    if (SRCSET.inw === "ko" && f.inw !== "ko") return false;
    if (SRCSET.inw === "pillar" && f.inw === "ko") return false;
    var held = SMPRules.isSourced(f.row) ? f.row.src : null;
    var mineRow = !!(held && held.set === st.id);
    if (SRCSET.status === "mine"  && !mineRow) return false;
    if (SRCSET.status === "free"  && held) return false;
    if (SRCSET.status === "other" && !(held && !mineRow)) return false;
    return true;
  });

  var inSet = SMPRules.rowsOfSet(world(), st.id).length;
  var team = FUNCTIONS[st.team] ? FUNCTIONS[st.team].name : st.team;

  var setPick = mine.length === 1
    ? '<span class="fbtn set"><span class="fbl">Filling</span> <b>' + esc(st.name) + '</b></span>'
    : '<span class="fbtn set"><span class="fbl">Filling</span>' +
      '<select class="fld bare" id="srcset-set" aria-label="Which set to fill">' +
      mine.map(function(x){
        return '<option value="' + esc(x.id) + '"' + (x.id === st.id ? " selected" : "") + '>' +
          esc(x.name) + '</option>';
      }).join("") + '</select></span>';

  var sel = function(id, label, opts, cur){
    return '<span class="fbtn"><span class="fbl">' + label + '</span>' +
      '<select class="fld bare" id="' + id + '" aria-label="Filter by ' + label.toLowerCase() + '">' +
      opts.map(function(o){
        return '<option value="' + esc(o.v) + '"' + (o.v === cur ? " selected" : "") + '>' +
          esc(o.t) + '</option>';
      }).join("") + '</select></span>';
  };

  var unitOpts = [{ v:"", t:"All units" }].concat(activeKeys().map(function(k){
    return { v:k, t:UNITS[k].navName || UNITS[k].name };
  }));
  var inOpts = [{ v:"", t:"Everything" }, { v:"ko", t:"Key objectives" },
                { v:"pillar", t:"Pillar measures" }];
  var stOpts = [{ v:"", t:"Any" }, { v:"free", t:"Unclaimed" },
                { v:"mine", t:"In this set" }, { v:"other", t:"Another set" }];

  /* Three states per row, not two: unclaimed, in this set, or in ANOTHER —
     the third shown as that set's name rather than a tick that could be
     overwritten without noticing. A refusal with no route forward is a dead
     end, so it carries a request (§44.5). */
  var TICK = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" ' +
    'aria-hidden="true"><path d="M4 10.5l4 4 8-9" stroke-linecap="round" ' +
    'stroke-linejoin="round"/></svg>';

  var rows = shown.map(function(f){
    var m = f.row;
    var held = SMPRules.isSourced(m) ? m.src : null;
    var mineRow = !!(held && held.set === st.id);
    var theirs = held && !mineRow;
    var otherName = theirs
      ? (held.set ? ((setById(held.set) || {}).name || "another set")
                  : (personName(held.by) || held.by))
      : "";
    var asked = theirs ? myOpenClaim(m.id, st.id) : null;
    var t = splitTarget(m.target);
    var status = theirs
      ? '<span class="held">' + esc(otherName) + '</span>' +
        (asked ? ' <span class="pill attn">Asked</span>'
               : ' <button class="linkbu" data-claimask="' + esc(m.id) + '|' + esc(f.unit) +
                 '">Request</button>')
      : '<button class="fmark-btn' + (mineRow ? ' on' : '') + '" data-srcpick="' +
        esc(m.id) + '|' + esc(f.unit) + '" aria-pressed="' + mineRow + '" ' +
        'aria-label="' + (mineRow ? "Release " : "Claim ") + esc(m.name) + '">' +
        (mineRow ? TICK : '') + '</button>' +
        '<span class="held">' + (mineRow ? "in this set" : "click to claim") + '</span>';
    return '<tr class="' + (mineRow ? "mine" : theirs ? "theirs" : "") + '" ' +
        'data-q="' + esc((m.name + " " + f.unitName).toLowerCase()) + '">' +
      '<td class="idx sn"></td>' +
      '<td><span class="uchip">' + esc(f.unitName) + '</span></td>' +
      '<td><span class="inchip' + (f.inw === "ko" ? " ko" : "") + '"' +
        (f.inFull ? ' title="' + esc(f.inFull) + '"' : '') + '>' + esc(f.inLabel) + '</span></td>' +
      '<td class="mname">' + esc(m.name) + '</td>' +
      '<td class="cc">' + esc(m.dir || "—") + '</td>' +
      '<td class="num">' + (m.target ? esc(t.value || m.target) : '<span class="missing">—</span>') +
        (t.unit ? ' <span class="tu">' + esc(t.unit) + '</span>' : '') + '</td>' +
      '<td class="stcell">' + status + '</td></tr>';
  }).join("");

  return '<div class="kv">' +
      '<span class="pill kind">' + esc(team || "No team") + '</span>' +
      '<span class="pill kind">owner ' + esc(personName(st.owner) || "—") + '</span>' +
      '<span class="pill good">' + inSet + ' figure' + (inSet === 1 ? "" : "s") + ' in this set</span>' +
      '</div>' +
    '<div class="srctools">' + setPick +
      '<span class="srchbox">' +
        '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" ' +
          'aria-hidden="true"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4" ' +
          'stroke-linecap="round"/></svg>' +
        '<input id="srcq" type="text" placeholder="Search measures and units…" ' +
          'autocomplete="off" aria-label="Search measures and units" value="' +
          esc(SRCSET.q) + '"></span>' +
      sel("srcf-unit", "Unit", unitOpts, SRCSET.unit) +
      sel("srcf-in", "In", inOpts, SRCSET.inw) +
      sel("srcf-status", "Status", stOpts, SRCSET.status) +
      '<span class="srctally" id="srctally"></span>' +
    '</div>' +
    '<div class="cfg srctable"><table><thead><tr>' +
      '<th class="idx" style="width:40px">#</th>' +
      '<th style="width:128px">Unit</th>' +
      '<th style="width:108px">In</th>' +
      '<th>Measure</th>' +
      '<th class="cc" style="width:52px">Dir.</th>' +
      '<th class="cc" style="width:104px">Target</th>' +
      '<th style="width:194px">Status</th>' +
    '</tr></thead><tbody id="srcrows">' + rows + '</tbody></table>' +
    '<div class="srcempty" hidden>No figure matches. Clear the search, or widen a filter.</div>' +
    '</div>' +
    '<div class="note"><b>A figure in a set is entered once, by the set’s owner.</b> ' +
      'The unit still sees it, still needs it before it can submit, and <b>still writes the ' +
      'note</b> — the number is the set’s, the performance is the unit’s, and the ' +
      'explanation belongs to whoever owns the performance. A figure another set already ' +
      'holds shows that set’s name; only the SMO can move it.</div>';
}

/* The other half of §16.7: a source team is a reporting party like any other,
   so it gets its own surface for the window. Rows come from every unit at
   once — that is the point, Finance enters revenue once per unit in one
   place rather than visiting ten pages. */
function renderMySources(){
  var rows = mySourceRows();
  if (!rows.length) {
    return '<div class="note">No figure is yours to enter. Figures are grouped into ' +
      '<b>sets</b>, and a set\u2019s owner enters everything in it \u2014 the SMO creates ' +
      'them on <b>Setup &rsaquo; Figure sets</b>.</div>';
  }
  var open = REVIEW.state === "open" && !(CYCLE.locked && !inOffice());
  var byUnit = {};
  rows.forEach(function(r){ (byUnit[r.unit] = byUnit[r.unit] || []).push(r); });

  var entry = function(r){
    var m = r.row, cur = m.actual, has = cur != null && cur !== "";
    var unit = splitTarget(m.target).unit;
    var shown = !has ? "" : (splitTarget(cur).value || String(cur));
    if (!open) return '<span class="mono">' + (has ? esc(String(cur)) : "\u2014") + '</span>';
    /* The suffix lives INSIDE .entry, as it does on the unit's own page — put
       outside, it wraps to its own line and the box loses its unit (§A13:
       follow what the platform already does). */
    return '<span class="entry' + (has ? " filled" : "") + '">' +
      '<input class="field" data-rep="' + esc(m.id) + '" data-repu="' + esc(r.unit) + '" ' +
      'data-unit="' + esc(unit) + '" value="' + esc(shown) + '" placeholder="\u2014" ' +
      'aria-label="Report ' + esc(m.name) + ' for ' + esc(UNITS[r.unit].name) + '">' +
      (unit ? '<span class="unitsuf">' + esc(unit) + '</span>' : '') + '</span>';
  };

  var done = rows.filter(function(r){ return r.row.actual != null && r.row.actual !== ""; }).length;

  var blocks = Object.keys(byUnit).map(function(k){
    var list = byUnit[k];
    var n = list.filter(function(r){ return r.row.actual != null && r.row.actual !== ""; }).length;
    return section("", esc(UNITS[k].name) +
      ' <span class="rtally' + (n === list.length ? " full" : "") + '">' + n + '/' + list.length + '</span>',
      null,
      '<table class="cfg"><thead><tr>' +
        '<th style="width:46%">Figure</th><th class="cc" style="width:16%">Target</th>' +
        '<th class="cc" style="width:20%">Reported</th><th style="width:18%">The unit\u2019s note</th>' +
      '</tr></thead><tbody>' + list.map(function(r){
        return '<tr><td>' + esc(r.row.name) +
            (r.pillar ? ' <span class="why" style="margin:0">' + esc(r.pillar) + '</span>' : '') + '</td>' +
          '<td class="cc mono">' + (r.row.target ? esc(r.row.target) : "\u2014") + '</td>' +
          '<td class="cc">' + entry(r) + '</td>' +
          '<td class="why" style="margin:0">' + (r.row.note ? esc(r.row.note) : "\u2014") + '</td></tr>';
      }).join("") + '</tbody></table>');
  }).join("");

  return '<div class="kv">' +
      '<span class="pill kind">' + done + ' of ' + rows.length + ' entered</span>' +
      '<span class="pill ' + (open ? "good" : "none") + '">' +
        (open ? esc(REVIEW.name) + " \u00b7 due " + esc(REVIEW.due) : "No cycle is open") + '</span></div>' +
    (open ? '' : '<div class="note">Figures can be entered while a cycle is open. ' +
      'This is a record until the SMO opens the next one.</div>') +
    blocks +
    '<div class="note"><b>You enter the figure; the unit writes the note.</b> ' +
      'The number is yours, the performance is theirs, and a unit cannot complete its ' +
      'report until these are in \u2014 which is why they will ask.</div>';
}

/* ── Who enters this unit's figures (spec 008 §3B) ────────────────────
   The SECOND way a figure gets an owner, and the one that needs no set.
   Islam: "the custodian doesn't get a ticking page — he gets all his
   directions and targets and a searchable dropdown in front of each number so
   he can set who can input them."

   So it is not a list to hunt through: it IS the unit's plan, in the order the
   plan reads, with a name against each number. The ticking page (A) exists
   because a set owner is looking ACROSS ten units for the few figures that are
   theirs; a custodian is looking DOWN one unit at all of them, and the two
   jobs want opposite shapes.

   FIRST CLAIM WINS (§4). A figure a set already holds is shown with that set's
   team and no control at all — not because the custodian ranks lower, but
   because whoever asked first holds it and moving one is the SMO's answer to a
   request. The same is true from the other side: a set owner ticking the fill
   page finds a named figure already taken.

   HIDDEN UNTIL THE TENANT SWITCHES IT ON, on Setup › Figure sets. */
function namePicker(unitKey, m, editable){
  var id = "src|" + unitKey + "|" + m.id;
  var current = (m.src && !m.src.set) ? m.src.by : null;
  var shown = current ? (personName(current) || current) : "";
  if (!editable) {
    return shown ? esc(shown)
                 : '<span class="why" style="margin:0">the unit enters it</span>';
  }
  if (PICKING !== id) {
    return '<button class="pickbtn' + (shown ? '' : ' empty') + '" data-name-open="' + esc(id) + '">' +
      (shown ? esc(shown) : 'the unit enters it') + '</button>';
  }
  /* Ordered, not filtered — the same rule the register's picker follows (§35).
     A custodian MAY NAME ANYONE THE PLATFORM KNOWS (spec 008 §9), because the
     person who knows a number often does not sit in the unit that reports it;
     this unit's own people simply come first. */
  var pool = peopleFor(unitKey);
  var prow = function(p){
    return '<button class="pickrow" data-name="' + esc(p.name.toLowerCase()) + '" ' +
      'data-name-set="' + esc(id + '|' + p.key) + '">' +
      '<b>' + esc(p.name) + '</b>' +
      (p.title ? '<span class="why" style="margin:0">' + esc(p.title) + '</span>' : '') +
      '</button>';
  };
  var group = function(label, list){
    return list.length ? '<div class="pickhead">' + label + '</div>' + list.map(prow).join("") : '';
  };
  return '<div class="picker">' +
    '<input class="fld" id="pickQ" placeholder="Search people…" autocomplete="off" ' +
      'aria-label="Search people">' +
    '<div class="picklist">' +
      group("In this unit", pool.here) +
      group("Everyone else", pool.rest) +
      '<div class="pickempty" hidden>No name matches.</div>' +
    '</div>' +
    '<div class="pickfoot">' +
      (current ? '<button class="linkbu" data-name-clear="' + esc(id) + '">The unit enters it</button>' : '') +
      '<button class="linkbu" data-pick-cancel="1">Cancel</button>' +
    '</div></div>';
}

function renderUnitNaming(u){
  var editable = canName(u.ukey);
  var figs = figuresOf(u);
  if (!figs.length) {
    return '<div class="note">This unit has no directions or key measures yet. A plan ' +
      'arrives by upload (§22), and this page follows it.</div>';
  }

  var named = 0, inSet = 0;
  figs.forEach(function(f){
    if (!f.row.src) return;
    if (f.row.src.set) inSet++; else if (f.row.src.by) named++;
  });

  var last = null;
  var rows = figs.map(function(f){
    var m = f.row, head = "";
    if (f.group !== last) { last = f.group; head = '<div class="grouphead">' + esc(f.group) + '</div>'; }
    /* A figure a SET holds is shown, attributed and left alone. The team is
       what the page shows rather than the set's name, for the same reason the
       unit's own pages do: the custodian is reading it to know who to talk to. */
    var setHeld = m.src && m.src.set ? setById(m.src.set) : null;
    var who = setHeld
      ? '<span class="srcby">' + esc(srcLabel(m) || "another set") + '</span>' +
        '<span class="why" style="margin:0 0 0 6px">only the SMO can move it</span>'
      : namePicker(u.ukey, m, editable);
    return head +
      '<div class="pick ' + (m.src ? "on" : "off") + '">' +
        '<span>' + esc(m.name) + '</span>' +
        '<span class="num why" style="margin:0">' +
          (m.target ? tgtShown(m.target) : '<span class="missing">No target</span>') + '</span>' +
        '<span style="text-align:right">' + who + '</span>' +
      '</div>';
  }).join("");

  return '<div class="kv">' +
      '<span class="pill ' + (named ? "good" : "none") + '">' + named + ' named here</span>' +
      '<span class="pill kind">' + inSet + ' in a figure set</span>' +
      '<span class="pill kind">' + (figs.length - named - inSet) + ' entered by the unit</span>' +
      '</div>' +
    section("", "Who enters each figure", null,
      '<div class="cfg srcname" style="padding:0">' + rows + '</div>' +
      '<div class="note"><b>Naming somebody gives them that figure and nothing else.</b> ' +
        'Not this unit’s other measures, not its plan, not its score — they sign in ' +
        'during the cycle and find one page listing every figure they owe. ' +
        '<b>The note stays yours</b>, and the figure still counts toward this unit’s ' +
        'report, so it cannot be submitted until the number is in. A figure a ' +
        '<b>figure set</b> already holds is shown with its team and cannot be named from ' +
        'here: whoever claimed it first holds it, and only the SMO moves one.</div>');
}

/* The scope is a business unit OR a capability (§16.4): capability projects
   arrive the way a unit's plan does — same page, same three steps, same
   review — with their own sheets, because the thing being planned is a
   project with deliverables, outcomes and milestones. */
function impIsCap(){ return String(IMP.unit).indexOf("cap:") === 0; }
/* THE IMPORT'S SUBJECT, RESOLVED ONCE (§61). It was a unit key and eight
   places read `UNITS[IMP.unit]` directly; since a function that plans in
   pillars can be planned by file it may also be "fn:<key>", and eight direct
   reads is eight chances to get it wrong — §59.4's fault, which cost a crash
   the first time a target was resolved that way. unitLike() already answers
   this for the whole platform, so this is only where the import asks it. */
function impUnit(){ return unitLike(IMP.unit); }
function impCap(){ return capById(String(IMP.unit).replace(/^cap:/, "")); }

function renderImport(){
  /* The second of three gates, and it is not belt-and-braces for its own sake:
     the rail's `when` decides whether the ROW is drawn, this decides whether
     the PAGE renders, and the two handlers decide whether the file is applied.
     A destination can be reached with a stale `currentSub` after a role
     changes under the viewer, so the page checks for itself. */
  if (grant("c_import") !== "edit") {
    return '<div class="note"><b>Importing is the SMO\u2019s.</b> A plan arrives by ' +
      'upload and is authored by it \u2014 codes are minted, the outgoing plan is ' +
      'archived \u2014 so it is not something a unit does for itself. Ask the SMO, or ' +
      'report figures on your unit\u2019s own <b>Report</b> page.</div>';
  }
  var isCap = impIsCap();
  var u = isCap ? impCap() : impUnit();
  var isPlan = IMP.kind === "plan";
  var d = IMP.diff;

  /* Narrowed to the chosen format, not units-and-capabilities in one list
     (§61) — the list is the subjects that keep THAT plan, so choosing the
     format above it is what makes the two agree. */
  var unitPick = '<select class="fld" id="imp-unit">' +
    impSubjects(impFmtOf(IMP.unit)).map(function(o){
      return '<option value="' + esc(o.v) + '"' + (o.v === IMP.unit ? " selected" : "") + '>' +
        esc(o.label) + '</option>';
    }).join("") + '</select>';

  /* ONE BUTTON, TWO ENTRIES. `<details>` rather than a button and a flag:
     a menu's action fires before the menu closes (§47.2), and a `<details>`
     that is closed from inside its own click has not unmounted the button the
     click is still in — it hides it. Keyboard and screen reader come free. */
  function dlMenu(label, act){
    return '<details class="dlmenu"><summary class="editbtn">' + label +
      '<span class="dlcar" aria-hidden="true">\u25be</span></summary>' +
      '<div class="menu" role="menu">' +
        '<button role="menuitem" data-' + act + '="pillars">Pillars template' +
          '<span class="dlsub">Business units and the functions that plan in pillars</span></button>' +
        '<button role="menuitem" data-' + act + '="projects">Projects template' +
          '<span class="dlsub">Capabilities and the functions that improve them</span></button>' +
      '</div></details>';
  }

  var kindPick = '<span class="minisw">' +
    '<button data-impkind="plan" aria-pressed="' + isPlan + '">Plan</button>' +
    '<button data-impkind="progress" aria-pressed="' + !isPlan + '">Progress</button></span>';

  /* ── A FILLED ONE, TO EXPLAIN THE BLANK ONE (§69.12) ───────────────
     Islam: "add a button for me to download a prefilled template, and an
     option for any unit and one for projects for any function, so I can
     explain using them."

     Which the blank template cannot do. §22's plan file is deliberately
     generic — one file whoever it is for, no codes, the subject chosen on the
     Read me sheet — and that is right for AUTHORING and useless for showing
     somebody what a finished one looks like. An empty grid with a Read me is
     not an example (§45.2, from the other side: a feature that renders nothing
     looks like a feature that was not built).

     ONE SELECT AND ONE BUTTON, and THE FORMAT IS READ OFF THE SUBJECT rather
     than chosen beside it — §61's rule, and the reason it is a rule: a format
     stored next to a subject is a second fact that can disagree with the
     first. Picking Mobile downloads the pillars workbook; picking a capability
     downloads the projects one; nothing else has to be answered.

     Both halves in one list under their own headings, because "any unit" and
     "projects for any function" are the two things he asked for and putting
     them in two controls would ask which one first. A capability is labelled
     with the FUNCTION that improves it, or "projects for any function" cannot
     be answered from a list of capability names. */
  var filledOpts = impSubjects("pillars").filter(function(o){
    var u = unitLike(o.v);
    return u && u.items && u.items.length;
  });
  var filledCaps = impSubjects("projects").filter(function(o){
    var c = capById(o.v.slice(4));
    return c && c.projects && c.projects.length;
  }).map(function(o){
    var c = capById(o.v.slice(4)), f = c && c.fn ? FUNCTIONS[c.fn] : null;
    return { v:o.v, label:o.label + (f ? " \u2014 " + f.name : "") };
  });
  var filledAll = filledOpts.concat(filledCaps);
  /* NOTHING FILLED IN, NOTHING TO OFFER. On a clean tenant (§67) there is no
     plan anywhere, so the control would be a dropdown of nothing beside a
     button that downloads an empty file — which is the blank template, badly.
     It is absent, and the sentence says why rather than leaving a gap. */
  var filled = !isPlan ? "" :
    '<div class="imp-sub">' +
      (filledAll.length
        ? '<p class="sub" style="margin:0 0 8px"><b>Or take one already filled in.</b> ' +
            'The same file, carrying a real plan &mdash; for showing somebody what a ' +
            'finished one looks like before they start their own. The format follows ' +
            'the subject, so there is nothing else to choose.</p>' +
          '<div class="imp-row">' +
            '<select class="fld" id="imp-filled" aria-label="Which plan to fill it with">' +
              (filledOpts.length ? '<optgroup label="Pillars">' + filledOpts.map(function(o){
                return '<option value="' + esc(o.v) + '"' +
                  (o.v === IMP.filled ? " selected" : "") + '>' + esc(o.label) + '</option>';
              }).join("") + '</optgroup>' : '') +
              (filledCaps.length ? '<optgroup label="Projects">' + filledCaps.map(function(o){
                return '<option value="' + esc(o.v) + '"' +
                  (o.v === IMP.filled ? " selected" : "") + '>' + esc(o.label) + '</option>';
              }).join("") + '</optgroup>' : '') +
            '</select>' +
            '<button class="editbtn" data-dlfilled="1">Download it filled in</button>' +
          '</div>'
        : '<p class="sub" style="margin:0">Nothing is planned yet, so there is no ' +
          'filled example to take. Once a plan has been uploaded, the same file comes ' +
          'back down carrying it.</p>') +
    '</div>';

  var counts;
  if (isCap) {
    var nd = 0, no = 0, nm = 0;
    u.projects.forEach(function(p){
      nd += p.deliverables.length; no += p.outcomes.length; nm += p.milestones.length;
    });
    counts = isPlan
      ? u.keyObjectives.length + " objectives &middot; " + u.projects.length + " projects &middot; " +
        nd + " deliverables &middot; " + no + " outcomes &middot; " + nm + " milestones"
      : capReported(u).total + " reportable rows";
  } else {
    counts = isPlan
      ? u.clauses.length + " clauses &middot; " + u.keyObjectives.length + " objectives &middot; " +
        u.items.length + " pillars &middot; " +
        u.items.reduce(function(a,p){ return a + p.measures.length; }, 0) + " measures &middot; " +
        u.items.reduce(function(a,p){ return a + p.tactics.length; }, 0) + " tactics"
      : u.items.reduce(function(a,p){ return a + p.measures.length + p.tactics.length; }, 0) + " reportable rows";
  }

  /* The plan template is GENERIC (§22): one file, whichever unit is being
     planned, with the unit chosen on its own Read me sheet. So the picker is
     not part of downloading a plan — it belongs to reporting, which is per
     unit and amends rows that already exist. */
  var step1 =
    '<div class="imp-step"><div class="imp-n">1</div><div class="imp-b">' +
      '<h4>Download the template</h4>' +
      '<p class="sub">' + (isPlan
        ? "Two formats: <b>pillars</b> for a business unit or a function that plans like one, <b>projects</b> for a capability. Each is the same file whoever it is for &mdash; choose the subject on its Read me sheet, fill it in Excel, and the platform assigns every code itself."
        : "One row per reportable item, with its target and what is currently recorded. Only the New value column is typed.") +
      '</p>' +
      '<div class="imp-row">' + kindPick +
        (isPlan
          ? dlMenu("Download plan template", "dlplan")
          : dlMenu("Download progress template", "dlprog") + unitPick +
            '<button class="linkbu" data-dl="1">or the raw CSV</button>' +
            '<button class="linkbu" data-showcsv="1">View the CSV</button>') +
      '</div>' +
      '<p class="sub" style="margin-top:8px">' + (isPlan
        ? planSubjectNames().length + " business units and functions, " +
          GROUP.capabilities.length + " capabilities and " +
          GROUP.themes.length + " themes are in its dropdowns"
        : counts) + '</p>' +
      filled +
    '</div></div>';

  var step2 =
    '<div class="imp-step"><div class="imp-n">2</div><div class="imp-b">' +
      '<h4>Upload the filled file</h4>' +
      '<p class="sub">' + (isPlan
        ? "The file says which unit, function or capability it is for, so there is nothing to select here. An upload <b>authors</b> that plan \u2014 the outgoing one is archived, not destroyed \u2014 and nothing else is touched."
        : "Fill the new_value column only where a figure changed. Blank rows are ignored.") + '</p>' +
      '<div class="imp-row"><input type="file" id="imp-file" accept=".xlsx,.csv" ' +
        'aria-label="Choose a template file to upload">' +
        (isPlan ? "" : '<button class="linkbu" data-paste="1">or paste the file</button>') +
        (IMP.read ? '<span class="pill quiet">Read &middot; ' + esc(IMP.read) + '</span>' : '') +
      '</div>' +
    '</div></div>';

  var chk = IMP.check;
  var blocked = chk && chk.problems.length;
  var checkBlock = chk && (chk.problems.length || chk.notices.length)
    ? '<div class="imp-checks">' +
        chk.problems.map(function(x){
          return '<div class="chk bad"><span class="pill bad">Problem</span>' +
            '<b>' + esc(x.at) + '</b><span>' + esc(x.msg) + '</span></div>';
        }).join("") +
        chk.notices.map(function(x){
          return '<div class="chk note-c"><span class="pill attn">Notice</span>' +
            '<b>' + esc(x.at) + '</b><span>' + esc(x.msg) + '</span></div>';
        }).join("") +
      '</div>' +
      (blocked ? '<div class="note bad-note"><b>Nothing can be applied while a problem stands.</b> ' +
        'Data that loads badly is harder to find later than a file that refuses to load.</div>' : '')
    : '';

  /* The receipt. An apply that just makes the review vanish leaves the SMO
     with no proof anything happened except going to look \u2014 so the result is
     stated, with the way there. */
  var receipt = IMP.done
    ? '<div class="applied"><b>Applied to ' + esc(IMP.done.unit) + '.</b> ' + IMP.done.what +
      (IMP.done.fn
        ? ' <button class="linkbu" data-gofn="fn:' + esc(IMP.done.fn) + '">Open ' +
          esc(FUNCTIONS[IMP.done.fn] ? FUNCTIONS[IMP.done.fn].name : IMP.done.fn) + '</button>'
        : ' <button class="linkbu" data-gounit="' + IMP.done.key + '">Open ' + esc(IMP.done.unit) + '</button>') +
      '</div>'
    : '';

  /* A FILE THAT FAILS TO READ HAS TO SAY SO (§48.8). `impFail()` writes the
     reason into IMP.check and clears IMP.summary and IMP.diff — but checkBlock
     was only ever concatenated INSIDE step3, and step3 is only built when
     there is a summary or a diff to review. So the one case where the message
     matters most, the file that could not be read at all, was the one case
     where it had nowhere to render: upload the wrong template and the page did
     not move. The sentence existed the whole time.

     §32's rule, which this codebase states outright: a blocked save must say
     why, where the save is. An unreadable upload is the same thing one step
     earlier. */
  var step3 = receipt;
  if (!step3 && chk && chk.problems.length) {
    step3 = '<div class="imp-step"><div class="imp-n">!</div><div class="imp-b">' +
      '<h4>This file could not be read</h4>' + checkBlock + '</div></div>';
  }

  /* A plan upload is not a diff any more (§22). What is shown is the exchange:
     what the file holds, what it displaces, and what of that was reported —
     and then the one button that makes it happen. */
  if (isPlan && IMP.summary) {
    var sm = IMP.summary, inc = sm.incoming, cur = sm.current;
    var line = isCap
      ? inc.objectives + " objectives &middot; " + inc.projects + " projects &middot; " +
        inc.deliverables + " deliverables &middot; " + inc.outcomes + " outcomes &middot; " +
        inc.milestones + " milestones"
      : inc.clauses + " clauses &middot; " + inc.objectives + " objectives &middot; " +
        inc.pillars + " pillars &middot; " + inc.measures + " measures &middot; " +
        inc.tactics + " tactics" + (inc.swot ? " &middot; " + inc.swot + " SWOT points" : "");
    var had = isCap
      ? cur.objectives + " objectives &middot; " + cur.projects + " projects &middot; " +
        cur.deliverables + " deliverables &middot; " + cur.outcomes + " outcomes &middot; " +
        cur.milestones + " milestones"
      : cur.objectives + " objectives &middot; " + cur.pillars + " pillars &middot; " +
        cur.measures + " measures &middot; " + cur.tactics + " tactics";
    var hasPlan = !planIsEmpty(cur);

    step3 =
      '<div class="imp-step"><div class="imp-n">3</div><div class="imp-b">' +
        '<h4>Review, then apply</h4>' + checkBlock +
        '<div class="imp-tally">' +
          '<span class="pill kind">' + esc(u.name) + '</span>' +
          (hasPlan
            ? '<span class="pill attn">Replacing &mdash; the old plan is archived</span>'
            : '<span class="pill good">First plan &mdash; nothing to lose</span>') +
        '</div>' +
        '<div class="scroll"><table><thead><tr><th>What</th><th>Holds</th></tr></thead><tbody>' +
          '<tr><td><b>In this file</b></td><td>' + line + '</td></tr>' +
          '<tr><td>' + (hasPlan ? "Recorded now" : "Recorded now") + '</td><td>' +
            (hasPlan ? had : "nothing yet") + '</td></tr>' +
        '</tbody></table></div>' +
        (hasPlan
          ? '<div class="note"><b>' + esc(u.name) + '\u2019s current plan' +
            (cur.reported
              ? ' and its ' + cur.reported + ' reported figure' + (cur.reported === 1 ? '' : 's')
              : '') +
            ' come off the screen.</b> ' +
            (cur.reported
              ? 'They are kept as an archive dated today and can be restored from Archived plans at any time. '
              : 'It is kept as an archive dated today and can be restored from Archived plans at any time. ') +
            'Nothing is destroyed.</div>'
          : '') +
        '<div class="imp-row" style="margin-top:14px">' +
          (blocked
            ? '<button class="editbtn" disabled style="opacity:.45;cursor:not-allowed">Apply blocked</button>'
            : '<button class="editbtn apply" data-apply="1">' +
              (hasPlan ? "Replace " : "Write ") + esc(u.name) + '\u2019s plan</button>') +
          '<button class="linkbu" data-cancel="1">Discard</button></div>' +
      '</div></div>';
  } else if (d) {
    /* Reporting is unchanged: it amends figures that already exist, so it is
       still a difference against what is recorded. */
    var changed = d.rows.filter(function(r){ return r.status === "changed"; });
    var unknown = d.rows.filter(function(r){ return r.status === "unknown"; });
    var body = changed.length
        ? '<div class="scroll"><table><thead><tr><th>' + (isCap ? "Project" : L("pillar","bu")) + '</th><th>Item</th>' +
            '<th class="cc">Type</th><th class="cc">Recorded</th><th class="cc">In the file</th></tr></thead><tbody>' +
          changed.map(function(r){
            return '<tr><td>' + esc(r.pillar) + '</td><td>' + esc(r.name) + '</td>' +
              '<td class="cc"><span class="pill kind">' + r.type + '</span></td>' +
              '<td class="num was">' + esc(r.was) + '</td><td class="num now">' + esc(r.now) + '</td></tr>';
          }).join("") + '</tbody></table></div>'
        : '<div class="note">No reported figure differs from what is recorded.</div>';

    step3 =
      '<div class="imp-step"><div class="imp-n">3</div><div class="imp-b">' +
        '<h4>Review, then apply</h4>' + checkBlock +
        '<div class="imp-tally">' +
          '<span class="pill attn">' + changed.length + ' changed</span>' +
          (unknown.length ? '<span class="pill bad">' + unknown.length + ' unrecognised id</span>' : '') +
        '</div>' + body +
        (changed.length
          ? '<div class="imp-row" style="margin-top:14px">' +
            (blocked
              ? '<button class="editbtn" disabled style="opacity:.45;cursor:not-allowed">Apply blocked</button>'
              : '<button class="editbtn apply" data-apply="1">Apply to ' + esc(u.name) + '</button>') +
            '<button class="linkbu" data-cancel="1">Discard</button></div>'
          : '') +
      '</div></div>';
  }

  return cfgHead("Import & archives",
      ['<span class="pill kind">' + (isPlan
        ? "One generic template &middot; one unit per file"
        : "One file per unit or capability") + '</span>'],
      null, false) +
    /* THE SECOND DOOR (§129, spec 020): a plan can be BUILT here as well as
       uploaded — the two are siblings on the page where plans arrive, and
       building over a standing plan archives it exactly as an upload does. */
    '<div class="bdoor"><b>Build it here</b>' +
      '<span class="bwhy">A guided flow through the plan’s own pages &mdash; pick a unit or a ' +
      'function, or create one, and author the plan directly. No file needed.</span>' +
      '<button class="bprim" data-buildplan="1">Build a plan</button></div>' +
    section("", (isPlan ? "Plan" : "Progress") + " import", null,
      '<div class="imp">' + step1 + step2 + step3 + '</div>');
}

/* ── Manage · Archived plans (§22) ───────────────────────────────────
   Every plan an upload displaced, newest first, with what it held and a way
   back. This is what makes replacing a plan an ordinary act rather than a
   nervous one: an upload never deletes, and the proof is a list you can read.

   The only destructive control in the import flow is Delete, and it asks. */
function renderArchives(){
  var can = grant("c_import") === "edit";
  if (!ARCHIVES.length)
    return section("", "Archived plans",
      null,
      '<div class="note">Empty. Upload a plan on <b>Import</b>, clear one on <b>Business units</b>, ' +
      'or open a new reporting cycle, and what it displaces will appear here with a way to put ' +
      'it back.</div>');

  var rows = ARCHIVES.map(function(a){
    var c = a.counts || {};
    /* Three kinds now: a unit's plan, a capability's plan, and a CYCLE's
       figures — taken when a new cycle clears the last one's numbers (§49.1).
       A figures archive belongs to no one unit, so it is always restorable. */
    var held = a.kind === "figures"
      ? [plural(c.reported || 0, "reported figure"), plural(c.notes || 0, "note"),
         plural(c.units || 0, "submitted unit")].join(" &middot; ")
      : a.kind === "unit"
      ? [c.pillars + " pillars", c.measures + " measures", c.tactics + " tactics",
         c.objectives + " objectives"].join(" &middot; ")
      : [c.projects + " projects", c.deliverables + " deliverables",
         c.outcomes + " outcomes", c.milestones + " milestones"].join(" &middot; ");
    /* unitLike, never UNITS[] (§232): a pillars function's archive is keyed
       `fn:<key>`, and asking UNITS printed "cannot be restored" for a
       function still on the platform — the same one-line fault as the
       restore itself. */
    var live = a.kind === "figures" ? true : a.kind === "unit" ? unitLike(a.key) : capById(a.key);
    return '<tr><td><b>' + esc(a.name) + '</b>' +
        (a.kind === "figures"
          ? '<span class="why">the cycle\u2019s figures</span>'
          : live ? ''
          : '<span class="why">no longer in the platform &mdash; cannot be restored</span>') +
        '</td>' +
      '<td class="cc">' + esc(a.at) + '</td>' +
      '<td>' + esc(a.by || "\u2014") + '<span class="why">' + esc(a.why || "") + '</span></td>' +
      '<td>' + held +
        (a.kind === "figures"
          ? '<span class="why">put back into whatever plan is standing then</span>'
          : c.reported
          ? '<span class="why">' + c.reported + ' reported figure' + (c.reported === 1 ? '' : 's') + ' kept with it</span>'
          : '<span class="why">nothing reported</span>') + '</td>' +
      '<td class="cc">' + (can && live
        ? '<button class="editbtn" data-restore="' + esc(a.id) + '">Restore</button> ' +
          '<button class="rmbtn" data-forget="' + esc(a.id) + '">Delete</button>'
        : '<span class="pill none">View only</span>') + '</td></tr>';
  }).join("");

  return section("", "Archived plans",
    null,
    '<div class="cfg"><table><thead><tr>' +
      '<th style="width:22%">Plan</th><th class="cc" style="width:12%">Archived</th>' +
      '<th style="width:20%">Replaced by</th><th>What it held</th>' +
      '<th class="cc" style="width:16%"></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>');
}

/* ══ SETUP · OVERVIEW (§108.10, spec 018) ════════════════════════════════
   Islam, on the makeover: Option A, and the gear lands here.

   THE PAGE ANSWERS ONE QUESTION — *is anything waiting on me?* — and before it
   existed the answer took a walk through five pages, because each outstanding
   thing lived only on the page that fixes it. That is right for the thing and
   wrong for the question: nobody opens Setup to read the People register, they
   open it to find out whether the register needs them.

   EVERY ROW NAMES THE FUNCTION IT COUNTS, and that is the whole design. A
   summary page is the one place a disagreement with the page it summarises is
   guaranteed to be seen and impossible to explain, so no row is allowed to
   compute anything: each declares a `count` that calls the SAME function the
   destination page calls, and `checks/setup-overview.py` asserts the two agree
   rather than asserting the number (§53.5, §94.8). Add a row here with fresh
   arithmetic in it and the check cannot help you.

   NULL DRAWS NOTHING; ZERO IS AN ANSWER. Three of these depend on a server
   fact fetched outside the state graph, so "we have not asked" is a real third
   state and it is not "nothing is waiting" (§93, §108.10). A row whose count
   is null is absent — never a 0, and never a spinner, because a page that
   shows five zeroes while it is thinking has told somebody they are clear when
   it does not know.

   THE DESTINATION IS THE PAGE THAT FIXES IT, never a page that merely mentions
   it — the row is a door, and §16.7's rule that a refusal must send somebody
   somewhere applies just as much to a notice. */
function attentionRows(){
  var rows = [
    { k:"chat",  dest:"chat",   glyph:"✉",
      count: function(){ return OVQUEUE && !OVQUEUE.__error
                                ? (OVQUEUE.waiting | 0) : null; },
      text:  function(n){ return plural(n, "conversation") + " waiting for an answer"; } },
    { k:"claims", dest:"cycle", glyph:"Σ",
      count: function(){ return openClaimsList().length; },
      text:  function(n){ return plural(n, "claim request") + " to answer"; } },
    { k:"nocust", dest:"people", glyph:"☰",
      count: function(){ return unitsWithoutCustodian().length; },
      text:  function(n){ return plural(n, "unit") + " with no custodian"; } },
    { k:"nopw",   dest:"people", glyph:"⚿",
      count: noPasswordCount,
      text:  function(n){ return n + (n === 1 ? " person has" : " people have") +
                                 " never been issued a password"; } },
    { k:"said",   dest:"people", glyph:"◎",
      count: saidWhereCount,
      text:  function(n){ return plural(n, "person", "people") +
                                 " said where they work — accept or dismiss"; } }
  ];
  return rows.map(function(r){
    var n = r.count();
    return { k:r.k, n:n, dest:r.dest, glyph:r.glyph,
             text: (n == null || n <= 0) ? null : r.text(n) };
  }).filter(function(r){ return r.text !== null; });
}

/* The label a row's destination wears in the rail, asked of the rail's own
   list rather than written out again — rename a page and this follows (§108.3
   renamed three of them in one afternoon). */
function attnDestLabel(k){
  var d = (typeof setupDefs === "function" ? setupDefs() : []).filter(
    function(x){ return x.k === k; })[0];
  return d ? d.label : k;
}

var OVQUEUE = null;   /* {waiting,flagged} | {__error} | null — asked once per visit */

/* ── THE SAME COUNTS, ON THE RAIL (§108.15) ────────────────────────────
   A pill beside a rail entry says "there is something here for you" without
   opening it, which is HR_ERP's practice and the last piece of the makeover.
   It is deliberately LAST: a pill is only worth drawing once the count behind
   it is real, and until the Overview existed there was no shared, agreed count
   to draw — a rail badge computed on its own would have been the drift §108.10
   was built to prevent, in the one place nobody would ever see it disagree.

   SO IT IS THE OVERVIEW'S OWN LIST, SUMMED BY DESTINATION. Several rows point
   at the People register — custodians, passwords, declarations — and "7 things
   waiting on the register" is exactly what somebody wants from a rail badge.
   Nothing new is counted here, which is the whole point.

   NEVER FOR SOMEBODY WHO CANNOT CLEAR IT (§69). The Performance dot was shown
   to readers until it was noticed that asking a person to act on something
   they hold no control over is how a screen nags. These counts are the
   office's queue, so they are drawn for the office and for nobody else. */
function attentionByPage(){
  var by = {};
  if (typeof inOffice === "function" && !inOffice()) return by;
  attentionRows().forEach(function(r){
    by[r.dest] = (by[r.dest] || 0) + (r.n | 0);
  });
  return by;
}

function renderOverview(){
  var open = REVIEW.state === "open";
  var t = cycleTotals();
  var att = attentionRows();

  /* ── THE WORK FIRST, THE CONTEXT BESIDE IT (§198) ──────────────────────
     Islam picked Option B from two drawn in the real page. The audit behind
     it, measured as the office with things actually waiting:

       · 264 pixels of content beside an 870-pixel rail — the page the gear
         lands on was the shortest in Setup.
       · The biggest thing on it answered a DIFFERENT question. "222 of 245
         items reported" is how much the whole business has reported; the
         office opens Setup to ask *is anything waiting on me*, and that was
         in 13px grey underneath.

     So the queue leads and the cycle becomes a standing summary in a column
     beside it. NOTHING NEW IS COUNTED — the rows are `attentionRows()` and
     the numbers are `cycleTotals()`, exactly as before (§108.9, §108.10);
     what changes is which one the eye lands on first.

     BELOW 900px IT STACKS, queue first, which is CSS and not a second
     builder — a summary page whose shape depended on a JS width test would
     be measuring the window in two places (§27.1). */
  var side =
    '<aside class="ovside">' +
      '<h4>' + esc(REVIEW.name) +
        ' <span class="badge b-' + (open ? "open" : "none") + '">' +
        (open ? "Open" : "Closed") + '</span></h4>' +
      '<div class="ovsline"><span>Reported</span><b>' + t.done + ' of ' + t.total + '</b></div>' +
      '<div class="ovsline"><span>Submitted</span><b>' + t.sub + '</b></div>' +
      '<div class="ovsline"><span>In progress</span><b>' + t.progress + '</b></div>' +
      (t.none ? '<div class="ovsline"><span>Not started</span><b class="ovlate">' +
        t.none + '</b></div>' : '') +
      /* ONE SENTENCE, TWO SURFACES (§120.1) — and it says so when a tenant has
         set no dates, rather than printing the separators alone. */
      '<div class="ovsmeta">' + esc(cycleMeta()) + '</div>' +
      '<button type="button" class="editbtn ovcyc-go" data-setupgo="cycle">' +
        'Open the cycle page</button>' +
    '</aside>';

  var body = att.length
    ? '<div class="ovlist">' + att.map(function(r){
        return '<button type="button" class="ovrow" data-setupgo="' + esc(r.dest) + '">' +
          '<span class="ovico" aria-hidden="true">' + r.glyph + '</span>' +
          '<span class="ovtext">' + esc(r.text) + '</span>' +
          '<span class="ovto">' + esc(attnDestLabel(r.dest)) + ' ›</span></button>';
      }).join("") + '</div>'
    /* NOT AN EMPTY BOX (§45.2 turned round). A page whose one job is to say
       whether anything is waiting has to be able to say NO — an absent section
       would read as a section that failed to load. */
    : '<div class="ovquiet"><b>Nothing is waiting on the office.</b>' +
      '<span>Everything the Overview watches is clear. The rest of Setup is in ' +
      'the list on the left.</span></div>';

  /* THE HEADING CARRIES THE TOTAL, because a count belongs on the thing it
     counts and the rows below it are that thing (§116.2). Never a zero: the
     empty state says it in words one line down (§108.10). */
  var n = att.reduce(function(a, r){ return a + (r.n | 0); }, 0);

  return cfgHead("Overview", [], null, false, null, null, "") +
    '<div class="ovcols">' +
      '<div class="ovmain">' +
        '<div class="ovh">Waiting on the office' +
          (n ? ' \u2014 <em>' + plural(n, "thing") + '</em>' : '') + '</div>' +
        body +
      '</div>' +
      side +
    '</div>';
}

/* ── Setup · Reporting cycle ────────────────────────────────────────
   Opening turns a plan into a request. Closing snapshots it, which is the
   only way the product ever acquires a past to compare against.

   The SMO can close with gaps: waiting for the last number means never
   closing, and a cycle that never closes writes no history. Unreported items
   close as unreported and stay visibly so \u2014 a stronger prompt than an email. */
/* "1 need notes" was on the unit half for as long as it has existed and went
   unnoticed while it was rare; §105 put it on seven more rows and it stopped
   being rare. ONE function, because the two halves saying it differently is
   the fault this board was just built to avoid (§53.5). */
function notesOwed(n){ return n === 1 ? "1 needs a note" : n + " need notes"; }

function renderCycle(){
  var can = grant("c_cycle") === "edit";
  var open = REVIEW.state === "open";

  /* §244: THE UNIT HALF CARRIES A PILLARS FUNCTION TOO (Islam: "put them on
     the unit half"). One builder over a TARGET rather than a second copy of
     the row — the two halves of this board already drifted once (§105.4's
     "1 need notes", right on one half and wrong on the other for as long as
     the column existed), and a third near-identical row builder is how that
     happens again (§53.5).

     THE NAME COMES FROM `placeLabel()`, which is the navigation's own
     vocabulary and already answers the one real collision: this tenant has a
     unit called Care AND a function called Care, and that function alone reads
     "Care (function)" (§65, §93.12). Inventing a tag here would be a second
     naming for a question the product has already answered. */
  var boardRow = function(t){
    var u = unitLike(t);
    if (!u) return "";
    var c = reportedCount(u), st = unitState(u);
    var who = boardWho(t);
    var pctD = c.total ? Math.round(c.done / c.total * 100) : 0;
    var miss = missingNotes(u).length;
    var by = { obj:[0,0], mea:[0,0], tac:[0,0] };
    askedItems(u).forEach(function(x){
      var slot = x.kind === "objective" ? "obj" : x.kind === "measure" ? "mea" : "tac";
      by[slot][1]++;
      /* §252: through `rowAnswered`, or the board's tactics column disagrees
         with the progress bar beside it, which counts the same rows. */
      if (rowAnswered(x)) by[slot][0]++;
    });
    return '<tr><td><b>' + esc(placeLabel(t)) + '</b></td>' +
      '<td class="why" style="margin:0">' + esc(who) + '</td>' +
      '<td><div class="repcell"><span class="repbar' + (pctD < 100 ? " part" : "") + '">' +
        '<i style="width:' + pctD + '%"></i></span>' +
        '<span class="mono why" style="margin:0">' + c.done + '/' + c.total + '</span></div></td>' +
      '<td class="num">' + by.obj[0] + '/' + by.obj[1] + '</td>' +
      '<td class="num">' + by.mea[0] + '/' + by.mea[1] + '</td>' +
      '<td class="num">' + by.tac[0] + '/' + by.tac[1] + '</td>' +
      '<td class="cc">' + (miss ? '<span class="badge b-late">' + notesOwed(miss) + '</span>' : '') + '</td>' +
      '<td class="cc"><span class="badge b-' + st.key + '">' + st.label + '</span></td></tr>';
  };
  var rows = boardUnitTargets().map(boardRow).join("");

  /* ── THE FUNCTIONS ARE ON THE BOARD TOO (§105), ALL OF THEM (§245) ──
     A submission the SMO cannot see anywhere is half a feature. They go in the
     SAME table rather than a second one, because "who has reported" is one
     question -- under a band, because a function planning in projects counts
     its own vocabulary (key objectives, outcomes, deliverables and milestones)
     where a unit counts objectives, measures and tactics, and the two must
     never share a heading unannounced (§99, §105.2).

     §245: ONE BAND FOR BOTH FORMATS. Islam, of the two bands drawn for
     sign-off: *"don't split functions planning in pillars from functions
     planning in projects -- they are functions reporting."* So the list is the
     register's own order and the shape decides only which builder draws the
     row. The band therefore stops naming ONE vocabulary: it cannot, with both
     under it, and a sentence that is true of some of the rows beneath it is
     worse than none (§35). What it names is the count -- and the mapped
     columns keep the per-cell hovers that already explained them (§124). */
  var fnKeys = boardFunctionKeys();
  var fnRows = fnKeys.map(function(fk){
    /* §245: a function that plans in pillars is READ like a unit and LISTED
       like a function -- `boardRow()` is that reading, already written and
       already agreeing with its own Reporting page (§53.5, §59). */
    if (fnPlansInPillars(FUNCTIONS[fk] || {})) return boardRow("fn:" + fk);
    var c = fnReportedCount(fk), st = fnState(fk);
    var f = FUNCTIONS[fk] || {};
    /* Custodian first, head second -- the same order the unit row asks in, so
       the board names the same kind of person on both halves (§53.5). */
    var who = personName(f.custodian) || personName(f.head) || "\u2014";
    var pctD = c.total ? Math.round(c.done / c.total * 100) : 0;
    var miss = fnMissingNotes(fk).length;
    /* THE THREE COLUMNS ARE THREE LAYERS, NOT TWO VOCABULARIES (§105.2).
       The first drawing gave the function half its own column strip and it
       COLLIDED: the strip's widths come from the table's own <thead> -- a
       unit's words -- and "DELIVERABLES" alone is wider than the Measures
       column at every width from 1920 down, so it ran over Milestones with
       nothing to stop it. Wrapping could not save it; a word that does not fit
       does not fit.

       The better answer was underneath the problem. A unit's three columns are
       what we are judged on, what we measure, and the work: objectives,
       measures, tactics. A function has the same three -- key objectives, its
       OUTCOMES (a direction, a target and an actual: that is a measure), and
       its deliverables and milestones (work that happened or did not). Mapped
       onto the same headings the counts become COMPARABLE down the page, which
       is more than the strip ever bought, and the vocabulary is named once in
       the band above where nothing can collide. */
    var by = { ko:[0,0], mea:[0,0], tac:[0,0] };
    var deliv = 0, mile = 0;
    fnAskedItems(fk).forEach(function(x){
      var slot = x.kind === "objective" ? "ko" : x.kind === "outcome" ? "mea" : "tac";
      if (x.kind === "deliverable") deliv++;
      if (x.kind === "milestone") mile++;
      by[slot][1]++;
      if (rowAnswered(x)) by[slot][0]++;   /* §252: one predicate, not a third copy */
    });
    var tacTitle = plural(deliv, "deliverable") + " \u00b7 " + plural(mile, "milestone") +
      ", asked this cycle";
    /* §244: `placeLabel()`, NOT `f.name` — found by the new board check and
       older than the change that found it. This tenant has a unit called Care
       AND a function called Care, so the board printed "Care" twice with
       nothing to tell the two rows apart, on the page the office uses to chase
       people. `placeLabel()` adds the suffix only where the clash is real
       (§65, §93.12) and is what the unit half beside it now uses (§53.5). */
    return '<tr><td><b>' + esc(placeLabel("fn:" + fk)) + '</b></td>' +
      '<td class="why" style="margin:0">' + esc(who) + '</td>' +
      '<td><div class="repcell"><span class="repbar' + (pctD < 100 ? " part" : "") + '">' +
        '<i style="width:' + pctD + '%"></i></span>' +
        '<span class="mono why" style="margin:0">' + c.done + '/' + c.total + '</span></div></td>' +
      '<td class="num" title="Key objectives">' + by.ko[0] + '/' + by.ko[1] + '</td>' +
      '<td class="num" title="Outcomes asked this cycle">' + by.mea[0] + '/' + by.mea[1] + '</td>' +
      '<td class="num" title="' + esc(tacTitle) + '">' + by.tac[0] + '/' + by.tac[1] + '</td>' +
      '<td class="cc">' + (miss ? '<span class="badge b-late">' + notesOwed(miss) + '</span>' : '') + '</td>' +
      '<td class="cc"><span class="badge b-' + st.key + '">' + st.label + '</span></td></tr>';
  }).join("");
  if (fnRows) {
    /* `dxband` is §99's own rule, orphaned when §99.7 removed the split that
       used it (§24 would have had it deleted). It is the right shape for
       exactly this and it is used again.

       §245: THE `em` SLOT SAYS HOW MANY, AND NOTHING ELSE. It used to name one
       vocabulary -- "reporting in capabilities -- key objectives, outcomes,
       and deliverables and milestones" -- which was true of every row beneath
       it until a function planning in pillars joined the list, and a sentence
       true of only some of the rows under it is worse than no sentence (§35,
       and 1b-ii: a line that merely describes what the reader can see is
       furniture). The mapped columns still explain themselves where the
       mapping is not obvious, on the cells' own hovers (§124). */
    fnRows = '<tr class="dxband"><th colspan="8">Supporting functions' +
        '<em>' + plural(fnKeys.length, "function") + ' reporting</em></th></tr>' + fnRows;
  }

  /* ONE ANSWER, TWO PAGES (§108.1). The totals were computed inline here and
     the Overview opens on the same four numbers; cycleTotals() in
     config-data.js is now the only place they are worked out, and it counts
     the FUNCTIONS this page put on the board (§105) as well as the units. */
  var t = cycleTotals();

  var head =
    '<div class="fstrip" style="margin-bottom:20px"><div class="fstrip-head">' +
      '<span class="fstrip-t">' + esc(REVIEW.name) + '</span>' +
      '<span class="fstrip-meta">' + esc(cycleMeta()) + '</span>' +
      /* ── THE REVIEW POINT, EDITABLE WHILE THE CYCLE RUNS (§239) ──────
         Islam: "if I will set the cycle dates you need to give me the ability
         to set this on opening the cycle and ability to edit this in an open
         cycle." Before this there was NO control anywhere -- the value could
         only ever be whatever the seed left, which is how a tenant came to be
         reporting in Q2 against a platform that thought the year was over.

         It is a MONTH because a quarter cannot say "eight months in", and it
         is the platform's own month picker rather than a box, for §177's own
         reason: with no box there is nothing to mistype and the picker can
         only produce a shape `monthsOf()` already reads. */
      '<span class="fstrip-meta asof">reported as of ' +
        /* IT SHOWS WHAT IS ACTUALLY IN USE, not what is stored. With no month
           picked the platform still has an answer -- the cycle's own quarter
           end -- so showing the picker's "Missing" would print an alarm over
           something that is not owed (§177, §214.4) while the note beside it
           reported a real number. The note says whether it was chosen or
           inherited.

           §273: AND IT IS A VALUE HERE, NEVER A CONTROL. The picker moved
           inside the pen with everything else the office can change, so this
           line reads the same for everybody and the strip carries nothing that
           can be pressed by accident. One control for one fact (§53.5): a
           picker here AND a picker in the panel is two, and they would have to
           be kept in step. */
        '<b>' + esc(REVIEW.asOfMonth || reviewAsOfLabel()) + '</b>' +
        /* §239.3: AND IT SAYS WHAT THE MONTH MEANS. Islam could not tell
           whether the month he picked had taken -- "can you check if the cycle
           adjustment is saved" -- because the strip showed the value and
           nothing showed the consequence. `8 of 12 months` is the number every
           figure on the platform is actually prorated by, so a review point
           that is not working says so on the page rather than being inferred
           from a table reading 100%. */
        (elapsedMonths() != null
          ? ' <span class="why" style="margin:0">&middot; ' + elapsedMonths() +
            ' of 12 months' + (REVIEW.asOfMonth ? '' : ', taken from the cycle\u2019s end') +
            '</span>'
          : ' <span class="why" style="margin:0">&middot; the year is not set, so every ' +
            'figure is measured against a whole one</span>') + '</span>' +
      '<span class="badge b-' + (open ? "open" : "none") + '">' + (open ? "Open" : "Closed") + '</span>' +
      /* ── ONE DOOR, AND CLOSE IS BEHIND IT (§273) ───────────────────
         Islam: "keep the close cycle inside the edit. as it's a critical
         button to click, the pen should hold everything editable so it's kept
         secured." So the strip's only control while a cycle runs is Edit, and
         Close the cycle is drawn INSIDE the panel it opens -- the strip is a
         line you read, not a line you press.

         Edit is drawn while the cycle is OPEN only, which is the gate the
         review point already had: a closed cycle's figures are filed under the
         name it closed with (HISTORY keeps the name, §49.1), so renaming it
         afterwards would leave this page and the history saying different
         things. With it closed the strip carries "Open a new cycle..." exactly
         as it did before. */
      /* §273.2: AND A CLOSED CYCLE GETS THE PEN TOO. Islam picked it over a
         Reopen button on the strip: the pen's far end holds the cycle's one
         dangerous state change, whichever direction it goes -- Close while it
         runs, Reopen once it has stopped -- so the strip goes on carrying
         nothing that changes anything. `Open a new cycle...` stays beside it
         because it is a different act with its own panel and its own
         confirmation, and it is the only way to start one. */
      (can
        ? '<button class="editbtn" data-editcycle="1">Edit</button>' +
          (open ? '' : '<button class="editbtn" data-opencycle="1">Open a new cycle&hellip;</button>')
        : '') +
    '</div>' +
    /* ── THE PEN ITSELF ────────────────────────────────────────────
       The panel `NEWCYCLE` already uses, because this asks for the same five
       things and two shapes for one form is how the two drift (§53.5). What
       differs is the act row: Save and Cancel at the near end, Close the cycle
       at the far end of the same row -- inside the pen, apart from them, and
       still the last thing the eye reaches.

       CLOSE IS SAID, NOT HIDDEN, while something is unsaved (§221, §163): a
       control that vanishes reads as broken, one that says why it is waiting
       teaches the rule once. `aria-disabled`, never `disabled`, or the reason
       beside it cannot be reached by keyboard -- and the handler asks again at
       press time rather than trusting this render (§48.2). */
    (CYCLEEDIT
      ? (function(){
          /* §273.3: THE CLOSED CYCLE'S PANEL IS GONE, AND THE PEN OPENS THE
             PLATFORM'S OWN DIALOG INSTEAD. Islam, of three shapes drawn on his
             own tenant: "C". §273.2 drew the record as a band under the strip,
             and a band of facts sitting directly under a band of the SAME facts
             is the fault — every one of them (the name, the dates, the review
             point, the state) is already on the line above, and on a tenant
             where three of five are empty what is left is a row of dashes.

             A panel is the right shape for five fields you are EDITING, which
             is what an open cycle has, and the wrong shape for one question you
             are ANSWERING. So `CYCLEEDIT` is only ever the open cycle's now,
             and the closed branch is DELETED rather than left unreachable
             (§24). The dialog is wired in the shell, beside the other
             confirmations it is built from. */
          var held = cycleEditDirty();
          return '<div class="cfg newcycle"><div class="nc-h">Edit this cycle</div>' +
            '<div class="nc-grid">' +
              '<label><span>Name</span><input class="fld" id="ce-name" value="' +
                esc(CYCLEEDIT.name) + '" placeholder="H1 2027"></label>' +
              '<label><span>Covers from</span><input class="fld" id="ce-from" value="' +
                esc(CYCLEEDIT.from) + '" placeholder="Jan 2027"></label>' +
              '<label><span>to</span><input class="fld" id="ce-to" value="' +
                esc(CYCLEEDIT.to) + '" placeholder="Jun 2027"></label>' +
              '<label><span>Reports due</span><input class="fld" id="ce-due" value="' +
                esc(CYCLEEDIT.due) + '" placeholder="15 Jul 2027"></label>' +
              '<label><span>Reporting as of</span>' +
                monthBtnHtml(CYCLEEDIT.asOfMonth || "", "asofbtn", function(v){
                  if (v) CYCLEEDIT.asOfMonth = v; else delete CYCLEEDIT.asOfMonth;
                }) + '</label>' +
            '</div>' +
            '<div class="nc-why"><b>The month decides what every figure is measured ' +
              'against.</b> A target that adds up across the year is compared with the ' +
              'share of it due by then, and a tactic whose span has not started yet is ' +
              'not asked for.</div>' +
            '<div class="nc-act">' +
              '<button class="editbtn" data-ce-save="1">Save</button>' +
              '<button class="linkbu" data-ce-cancel="1">Cancel</button>' +
              '<span class="nc-gap"></span>' +
              '<span class="why nc-hold" data-ce-hold="1"' + (held ? '' : ' hidden') +
                '>Save or cancel your changes first</span>' +
              '<button class="editbtn danger" data-closecycle="1"' +
                (held ? ' aria-disabled="true"' : '') + '>Close the cycle</button>' +
            '</div></div>';
        })()
      : '') +
    '<div class="fstrip-body">' +
      '<div class="kpi"><b>' + t.done + '</b><span>of ' + t.total + ' items reported</span></div>' +
      '<div class="fchips"><span class="badge b-done">' + t.sub + ' submitted</span>' +
        '<span class="badge b-part">' + t.progress + ' in progress</span>' +
        (t.none ? '<span class="badge b-late">' + t.none + ' not started</span>' : '') + '</div>' +
      '<div class="fmean">plan edits: ' + (open ? "SMO only while open" : "open to unit owners") + '</div>' +
    '</div></div>';

  /* CLAIM REQUESTS (spec 008 §5). The SMO answers them, not the holder — the
     holder has an interest in the answer, and the SMO is the only person who
     sees both sides. They live here because this is the page the SMO already
     opens to see who owes what. */
  var claims = openClaimsList();
  var claimRows = claims.map(function(c){
    var row = SMPRules.rowById(world(), c.unit, c.figure);
    var holder = row ? srcLabel(row) : "\u2014";
    var want = setById(c.set);
    return '<tr><td><b>' + esc(claimFigure(c)) + '</b>' +
        '<span class="why">' + esc((UNITS[c.unit] || {}).name || c.unit) + '</span></td>' +
      '<td>' + esc(holder) + '</td>' +
      '<td>' + esc((want && want.name) || c.set) + '</td>' +
      '<td class="why" style="margin:0">' + esc(personName(c.by) || c.by) + '</td>' +
      '<td class="cc">' + (can
        ? '<button class="editbtn" data-claimyes="' + esc(c.id) + '">Move it</button> ' +
          '<button class="linkbu" data-claimno="' + esc(c.id) + '">Leave it</button>'
        : '') + '</td></tr>';
  }).join("");

  return cfgHead("Reporting cycle",
      ['<span class="pill kind">' + esc(REVIEW.cadence) + '</span>'].concat(
        claims.length ? ['<span class="pill attn">' + claims.length + ' claim request' +
          (claims.length === 1 ? "" : "s") + '</span>'] : []),
      null, false) + head +
    (claims.length
      ? section("", "Claim requests", null,
          '<div class="cfg"><table><thead><tr><th style="width:34%">Figure</th>' +
            '<th style="width:16%">Held by</th><th style="width:20%">Wanted by</th>' +
            '<th style="width:18%">Asked by</th><th class="cc" style="width:12%"></th>' +
          '</tr></thead><tbody>' + claimRows + '</tbody></table></div>' +
          '<div class="note"><b>One figure belongs to one set</b>, so somebody has asked for ' +
            'one that is already held. <b>Move it</b> puts the figure in the asking set; ' +
            '<b>leave it</b> closes the request without moving anything. Either way the ' +
            'conversation about whether it is the right number stays between the two ' +
            'teams \u2014 this only decides who enters it.</div>')
      : '') +
    section("", "Who has reported", null,
      '<div class="cfg"><table><thead><tr><th style="width:17%">Business unit</th><th>Reporting</th>' +
        '<th style="width:20%">Progress</th><th class="cc">Objectives</th><th class="cc">Measures</th>' +
        '<th class="cc">Tactics</th><th class="cc">Notes</th><th class="cc">State</th></tr></thead>' +
        '<tbody>' + rows + fnRows + '</tbody></table></div>' +
      (open
        ? '<div class="note"><b>A cycle can be closed with gaps.</b> Waiting for the last number ' +
          'means never closing, and a cycle that never closes writes no history. Whatever is ' +
          'unreported closes as unreported and stays visibly so.</div>'
        : '<div class="note"><b>' + esc(REVIEW.name) + ' is closed.</b> Its figures are a record. ' +
          'Opening a new cycle asks every unit again and lets each score show what it was last time.</div>') +
      (HISTORY.length
        ? '<h4 class="mini">Closed cycles</h4><div class="cfg"><table><thead><tr><th>Cycle</th>' +
          '<th class="cc">Group figure</th></tr></thead><tbody>' +
          HISTORY.map(function(h){
            return '<tr><td>' + esc(h.name) + '</td><td class="num">' + h.group + '%</td></tr>';
          }).join("") + '</tbody></table></div>'
        : ''));
}

/* ── Setup · Supporting functions ───────────────────────────────────
   The same screen as Business units, because it configures the same kind of
   thing: an editable name, a short name for the navigation, a code prefix for
   numbering its work, one head and one Strategy custodian, and retirement
   rather than deletion. Two configuration pages that mean the same thing should
   not behave differently. */
/* ── The two cells §59 adds ────────────────────────────────────────
   Kept beside the table rather than inline, because each carries a REFUSAL and
   a refusal needs room to say why. */
/* ONE COLUMN, NOT TWO. Drawn as two it took the table to ten columns in edit
   mode: the headers collided, the select was clipped to "Proje", and every row
   grew to three lines. And they are ONE FACT — how this function plans — of
   which `under` is the second half and exists only on the pillars side. So
   they stack in one cell, the way the Official BU list's mapping cell does.
   Measured before and after rather than judged: 10 columns to 9, and the
   widest header stops overlapping its neighbour. */
function planCell(fk, f, editable){
  var under = fnPlansInPillars(f) ? planUnderCell(fk, f, editable) : "";
  return '<div class="plancell">' + planFormatCell(fk, f, editable) +
    (under ? '<span class="planunder">under ' + under + '</span>' : '') + '</div>';
}
function planFormatCell(fk, f, editable){
  var pillars = fnPlansInPillars(f);
  var word = pillars ? L("pillar","bu") : "Projects";
  if (!editable) return '<span class="pill kind">' + esc(word) + '</span>';
  /* What is in the way, if anything. A function holding capabilities cannot
     become a pillars one and a function holding pillars cannot go back —
     switching would not delete the work, it would stop DRAWING it, which is
     worse: the plan is still in the save and nothing shows it. */
  var caps = capsOfFunction(fk).length, items = fnItems(f).length;
  /* "its plan" rather than a count on the pillars side: L("pillar") is the
     tenant's own word and is already a PLURAL noun, so plural() made it
     "3 pillarss" — and a function with exactly one would have read
     "1 pillars". The count is only worth showing where it is grammatical. */
  var blocked = pillars
    ? (items ? "its plan" : "")
    : (caps ? caps + (caps === 1 ? " capability" : " capabilities") : "");
  /* SHOWN AND DISABLED, never hidden. Every function in a live tenant holds
     something, so a control that disappeared while it did would be a control
     nobody ever saw — §45.2's "a feature that renders nothing looks like a
     feature that was not built". Disabled with the reason beside it says the
     true thing: this is settable, once the row is cleared. */
  return '<select class="fld" data-fnformat="' + esc(fk) + '"' +
      (blocked ? ' disabled title="Clear the plan on this row first"' : '') + '>' +
    '<option value="projects"' + (pillars ? "" : " selected") + '>Projects</option>' +
    '<option value="pillars"' + (pillars ? " selected" : "") + '>' + esc(L("pillar","bu")) + '</option>' +
    '</select>' +
    (blocked ? '<span class="why">holds ' + esc(blocked) + '</span>' : '');
}
function planUnderCell(fk, f, editable){
  /* Only a pillars function borrows a foundation, so only it has somewhere to
     sit under — offering this to a projects function would be a control that
     changes nothing. */
  var at = f.under && UNITS[f.under] ? f.under : "";
  if (!editable) {
    return at ? '<span class="uchip">' + esc(UNITS[at].name) + '</span>'
              : '<span class="why" style="margin:0">The group</span>';
  }
  return '<select class="fld" data-fnunder="' + esc(fk) + '">' +
    '<option value=""' + (at ? "" : " selected") + '>The group</option>' +
    activeKeys().map(function(k){
      return '<option value="' + esc(k) + '"' + (k === at ? " selected" : "") + '>' +
        esc(UNITS[k].name) + '</option>';
    }).join("") + '</select>';
}

/* ── A FUNCTION'S COLUMNS (§93.14) ────────────────────────────────────
   The register's chooser, on the table that needed it next. One key is hidden
   by default and the rest are shown, MERGED with the defaults rather than
   substituted — a column added later is absent from a map written before it
   existed, and reading absent as `false` would hide every new column from
   everybody who had ever opened the control (§30.2). */
var FNCOLS_KEY = "smp.fns.columns";
var FN_COLS = [
  { k:"key",     label:"Key", off:true },
  { k:"nav",     label:"Nav name" },
  { k:"code",    label:"Code" },
  { k:"plansin", label:"Plans in" },
  { k:"caps",    label:"Caps" },
  { k:"head",    label:"Head" },
  { k:"cust",    label:"Custodian" }
];
var FNCOLS = null;
function fnCols(){
  if (FNCOLS) return FNCOLS;
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(FNCOLS_KEY) || "null"); } catch (e) { saved = null; }
  FNCOLS = {};
  FN_COLS.forEach(function(c){
    FNCOLS[c.k] = (saved && typeof saved[c.k] === "boolean") ? saved[c.k] : !c.off;
  });
  return FNCOLS;
}
function setFnCol(k, on){
  fnCols()[k] = on;
  try { localStorage.setItem(FNCOLS_KEY, JSON.stringify(FNCOLS)); } catch (e) {}
}
function fnShowCol(k){ return fnCols()[k] !== false; }

/* ── THE ROW'S ACTIONS, IN ONE MENU (§93.14) ──────────────────────────
   The register's kebab, on the table §69.22's argument had not reached. The
   entries and their ORDER are written down rather than spliced by index, for
   the reason the register records: a list whose order depends on which items
   happened to qualify is a list that reorders itself for some viewers.

   DELETE IS "DELETE PERMANENTLY" AND SITS BELOW THE RULE, beside Retire's
   opposite. §62's refusal is unchanged and is still the feature — the entry is
   always LIVE rather than disabled, and pressing it either asks the question
   or names what is holding the function and where to go and clear it. A
   disabled item has nowhere to put a reason that is a sentence. */
function fnKebab(fk, f, mayEdit){
  /* THE SAVE/CANCEL BRANCH IS GONE WITH THE INLINE FIELDS (§261). It existed
     because the row itself opened; those two acts live at the foot of the
     dialog now, where the fields are — which is what §116 found on the
     register, and what leaves one shape for every row of this table. */
  if (!mayEdit) return '<td class="cc kebcell"></td>';

  var open = FNMENU === fk;
  var acts = [];
  acts.push('<button data-rowdlg="fns|' + esc(fk) + '">Edit details</button>');
  acts.push('<button data-clear="fn|' + esc(fk) + '|nums">Clear progress</button>');
  if (mayDestroy())
    acts.push('<button data-clear="fn|' + esc(fk) + '|plan">Clear plan</button>');
  acts.push('<hr>');
  acts.push('<button class="danger" data-fnretire="' + esc(fk) + '">' +
    (f.active === false ? "Reinstate this function" : "Retire this function") + '</button>');
  if (mayDestroy())
    acts.push('<button class="danger" data-fndel="' + esc(fk) + '">Delete permanently</button>');

  /* THE BUTTON, THE PANEL AND THE LIFT ARE `kebabCell`'s NOW (§261). They were
     written here and again on the register, and a third and fourth table were
     about to copy them — the lift in particular, which is not decoration but
     §69.22's answer to a frozen column's stacking context and would be the
     first thing a copy got wrong. What stays here is the LIST, which is the
     only part that is this table's. */
  return kebabCell(open, acts, fnPanels(fk, f), f.name,
    'data-fnmenu="' + esc(fk) + '"',
    String(CLEARING || "").indexOf("|" + fk) > -1 || CLEARING === "fndel|" + fk);
}

/* The three questions, each replacing the menu in the same corner so the
   second press lands where the first one did (§46.2). They were inline in the
   actions cell; the cell is 49px now, so they are panels like the register's
   delete question. */
function fnPanels(fk, f){
  if (CLEARING === "fndel|" + fk) {
    var why = fnDeleteBlockers(fk);
    if (why.length) return '<div class="kmenu kconfirm"><div class="cq">' +
      '<b>' + esc(f.name) + ' cannot be deleted.</b> ' +
      /* Each reason is a sentence in a paragraph of them, so it starts with a
         capital. Written where they are JOINED, not baked into the strings,
         because the same text is spoken mid-sentence by the server's refusal. */
      why.map(function(w){
        return esc(w.full.charAt(0).toUpperCase() + w.full.slice(1)) + ".";
      }).join(" ") +
      ' <b>Retire</b> takes it out of the navigation and keeps all of that.' +
      '</div><div class="cbtns"><button data-clearno="1">Close</button></div></div>';
    var takes = fnDeleteTakes(fk);
    return '<div class="kmenu kconfirm"><div class="cq"><b>Delete ' + esc(f.name) + '?</b> ' +
      (takes.length
        ? "This removes the function and " + takes.join(" and ") + " with it. Nothing " +
          "points at it and nothing has been reported against it, so nothing else changes."
        : "Nothing points at it and nothing has been reported against it. There is no " +
          "undo \u2014 Retire is the reversible one.") +
      '</div><div class="cbtns"><button data-clearno="1">Cancel</button>' +
      '<button class="danger" data-fndelyes="' + esc(fk) + '">Yes, delete it</button></div></div>';
  }
  var n = functionCapCount(fk);
  var caps = n + " " + (n === 1 ? "capability" : "capabilities");
  if (CLEARING === "fn|" + fk + "|plan")
    return '<div class="kmenu kconfirm"><div class="cq"><b>Clear the whole plan?</b> ' +
      'Key objectives and projects across ' + caps + '. The definitions stand, and each ' +
      'plan is archived first.</div><div class="cbtns">' +
      '<button data-clearno="1">Cancel</button>' +
      '<button class="danger" data-clearyes="fn|' + esc(fk) + '|plan">Yes, clear the plan</button>' +
      '</div></div>';
  if (CLEARING === "fn|" + fk + "|nums")
    return '<div class="kmenu kconfirm"><div class="cq"><b>Clear the reported progress?</b> ' +
      'Actuals and notes across ' + caps + '. The plan stands.</div><div class="cbtns">' +
      '<button data-clearno="1">Cancel</button>' +
      '<button class="danger" data-clearyes="fn|' + esc(fk) + '|nums">Yes, clear the progress</button>' +
      '</div></div>';
  return "";
}

function renderFunctions(){
  /* §85: a pen per row. Retire and Delete keep their own controls — they are
     decisions about the function, not corrections to its fields (§62). */
  var mayEdit = grant("c_fns") === "edit";
  /* The same picker the Business units page uses, addressed at "fn:<key>"
     rather than a unit key — search, this function's own people first, and Add
     new (§35). It replaces a <select> that listed every person in the tenant
     in one flat list, retired ones included. */
  /* `ed` IS AN ARGUMENT NOW, NOT A CAPTURE (§85.2). This closure is defined
     OUTSIDE the row map and used to close over a page-level `editable`. Moving
     editability into the row left it referring to a variable that no longer
     exists at its scope — "editable is not defined", and the whole Functions
     page rendered as nothing.

     A closure written beside a loop and called inside it is the shape to watch
     whenever a page-wide flag becomes a per-row one; the units page happens to
     define its picker INSIDE the map and so needed nothing. */
  var pick = function(role, current, fk, ed){
    return assignPicker("fn:" + fk, role === "head" ? "fnhead" : "custodian", current, ed);
  };

  var arranging = setArrangeOn("fns");
  var rows = FUNCTION_KEYS.map(function(fk, i){
    /* THE ROW NO LONGER EDITS ANYTHING (§261). "Edit this row" opened the
       fields in place and "Edit details" opens the same fields in the dialog
       Business units now uses — one word for one act across the two pages that
       sit either side of the same navigation row (§53.5). It also closes the
       trap §93.14 wrote down about itself: a column hidden by the Columns menu
       "renders nothing at all, edit field included", so Plans in and Under
       could not be reached with that column turned off. */
    var f = FUNCTIONS[fk], caps = capsOfFunction(fk);
    return '<tr data-oi="' + i + '" data-tkrow="' + (f.active === false ? "retired" : "active") + '"' +
      (f.active === false ? ' class="retired"' : '') + '>' +
      setArrangeIdx("fns", i, f.name) +
      /* THE KEY LINE IS A COLUMN NOW (§93.14). It sat under every name as a
         second line; the register moved exactly this to an off-by-default
         column (§69.11), because a function key is a DIAGNOSTIC — wanted when
         something is wrong and never when you are reading who runs Marketing.
         It is the ONLY column hidden by default here.

         AND THE WARNING THAT USED TO END THIS NOTE IS SPENT (§261): "a hidden
         column renders nothing at all, edit field included" was true while the
         fields were on the row, and it is why Nav name and Code had to stay
         visible. They are drawn in the dialog now, whatever this menu says. */
      '<td class="fnamecell"><b>' + esc(f.name) + '</b></td>' +
      (fnShowCol("key") ? '<td><span class="mono">' + esc(fk) + '</span></td>' : '') +
      (fnShowCol("nav") ? '<td>' + (f.navName
        ? '<span class="val">' + esc(f.navName) + '</span>'
        : '<span class="why" style="margin:0">' + esc(f.name) + '</span>') + '</td>' : '') +
      (fnShowCol("code") ? '<td class="cc"><span class="mono">' +
        esc(f.codePrefix || "\u2014") + '</span></td>' : '') +
      /* ── PLANS IN, AND UNDER (§59) ─────────────────────────────────
         Spec 010 built both and gave neither a control: `format` and `under`
         could only be set by editing the source, so a second Merchandising was
         impossible to create through the product.

         SWITCHING IS REFUSED WHILE THE OTHER SIDE HOLDS SOMETHING, and it says
         what is in the way rather than hiding a plan that still exists — the
         same contract as retiring a company that still holds units (§49.3).
         The control is in the dialog; this cell reads it. */
      (fnShowCol("plansin") ? '<td class="cc">' + planCell(fk, f, false) + '</td>' : '') +
      (fnShowCol("caps") ? '<td class="cc"><span class="mono">' + caps.length + '</span></td>' : '') +
      (fnShowCol("head") ? '<td class="cc">' + pick("head", f.head, fk, false) + '</td>' : '') +
      (fnShowCol("cust") ? '<td class="cc">' + pick("custodian", f.custodian, fk, false) + '</td>' : '') +
      /* ── STATUS HOLDS A STATUS, AND THE ACTS HOLD A MENU (§93.14) ────
         Islam, on rows measuring 155px beside the register's 39: "learn from
         what we have done in the people table."

         This column was headed Status and showed no status. It carried a pen
         and four stacked links — Retire, Delete, Clear progress, Clear plan —
         and those four lines ARE the 155px. §69.22's argument, already settled
         on the register: every per-row action used to want a line of its own,
         and a menu is where the NEXT one goes too.

         So Status says Active or Retired, which is what its heading has always
         promised, and the acts move into the row's kebab. */
      '<td class="cc"><span class="pill ' + (f.active === false ? "none" : "good") + '">' +
        (f.active === false ? "Retired" : "Active") + '</span></td>' +
      fnKebab(fk, f, mayEdit && !arranging) + '</tr>';
  }).join("");

  /* "Functions" in the rail and on the page (Islam, 2026-08-23). The page has
     always been about all of them, and "supporting" was doing no work in a
     list where nothing else is a function — it only made the rail's longest
     entry longer. The ROLE keeps its full name: "Supporting function head" is
     what somebody holds, and that is a different word doing a different job. */
  /* THE REGISTER'S CHOOSER, SAME SHAPE AND SAME CLASSES (§93.14). Written out
     rather than extracted into a shared helper: the two differ in what they
     say at the foot and in which column can never be hidden, and a helper
     taking two lists and two sentences is longer than the thing it replaces.
     If a third table wants one, that is when it becomes a function. */
  var fnColMenu = !mayEdit ? "" :
    '<span class="hmenu' + (FNCOLMENU ? " open" : "") + '">' +
      '<button class="hmenu-btn" data-fncolmenu="1" aria-haspopup="true" ' +
        'aria-expanded="' + FNCOLMENU + '">Columns <span class="hcar">&#9662;</span></button>' +
      (FNCOLMENU
        ? '<div class="hmenu-panel cols">' +
            '<div class="hmenu-h"><span>Show columns</span>' +
              '<span><button class="linkbu" data-fncolall="1">All</button> &middot; ' +
              '<button class="linkbu" data-fncolnone="1">None</button></span></div>' +
            FN_COLS.map(function(c){
              return '<label class="colrow"><input type="checkbox" data-fncol="' + c.k + '"' +
                (fnShowCol(c.k) ? " checked" : "") + '><span>' + esc(c.label) + '</span></label>';
            }).join("") +
            '<div class="hmenu-note">Function and Status are always shown. ' +
            '<b>Key</b> is the identifier written into a project code and a person\u2019s ' +
            'row \u2014 turn it on when something does not line up.</div>' +
          '</div>'
        : '') +
    '</span>';

  return cfgHead("Functions", [], null, mayEdit, "fnall",
      ["Clear all progress", "Clear all plans"], setArrangeBtn("fns", mayEdit) + fnColMenu) +
    section("", "", null,
      /* §84. Eight rows and nine columns — over the search threshold, so it
         sorts. Its order is NOT "a plain list" any more, which is what this
         comment used to say: the functions sit in the same navigation row as
         the units and are arranged the same way (§261). Both go while
         arranging, for the reason `tkHead`'s own note gives — a filter hides
         rows without removing them and a sort reorders them, and either one
         makes a drop land somewhere other than where it looks. */
      (arranging ? "" : tkBar("fns", { placeholder:"Search the functions\u2026" })) +
      setArrangeBand("fns", FUNCTION_KEYS.length, "supporting function",
                     "sorting and search are off while you arrange") +
      /* SHORTENED, BECAUSE THEY NO LONGER FIT. Measured rather than judged:
         at 920px "Shown in the nav" wanted 119px in a 94px cell, "Strategy
         custodian" 129 in 119 and "Capabilities" 86 in 68 — three headers
         overlapping their neighbours, which adding a ninth column caused.
         Each still says what its column is; the long forms were describing
         what the row already shows.

         The widths went with the conversion to sortable heads (§84): they were
         declared as percentages summing to the whole, which auto layout treats
         as a suggestion anyway, and wrapping (§87) is what decides these now. */
      '<div class="cfg fnsbox' + (arranging ? ' arranging' : '') + '">' +
      '<table class="unitcfg fnscfg" data-tktable="fns"><thead><tr>' +
        (function(){ var h = tkHead("fns", !arranging);
          return h("#", "idx", false) + h("Function", "fnamecell") +
                 (fnShowCol("key")     ? h("Key")               : '') +
                 (fnShowCol("nav")     ? h("Nav name")          : '') +
                 (fnShowCol("code")    ? h("Code", "cc")        : '') +
                 (fnShowCol("plansin") ? h("Plans in", "cc")    : '') +
                 (fnShowCol("caps")    ? h("Caps", "cc")        : '') +
                 (fnShowCol("head")    ? h("Head", "cc")        : '') +
                 (fnShowCol("cust")    ? h("Custodian", "cc")   : '') +
                 h("Status", "cc") +
                 /* Not sortable and never was: it holds one control (§69.22's
                    rule, which the register applies to Roles and Password). */
                 h("", "cc kebcell", false); })() +
        '</tr></thead>' +
        setArrangeBody("fns", "fns") + rows + '</tbody></table></div>' +
      /* The three notes that sat here are in the knowledge base now (§30). A
         setup table is where you change a thing; it is not where the thing is
         explained, and three paragraphs of prose under every table is how a
         configuration screen stops being scannable. */
      (mayEdit && !arranging
        ? '<div class="addrow"><button class="editbtn" id="addfn">+ Add a supporting function</button></div>'
        : ''));
}

/* ── Setup · Capabilities ───────────────────────────────────────────
   The SMO decides which capabilities exist and which function owns each. Each
   belongs to exactly one function; the enhancement work inside them arrives by
   template, the way a unit's plan does. */
function renderCaps(){
  /* §85. This page had NO pen at all — it was editable for the SMO the whole
     time, which is how §84.3's silent sort bug hid: every name cell was an
     input. A row now opens deliberately, like the other six. */
  var mayEdit = grant("c_caps") === "edit";
  var rows = GROUP.capabilities.map(function(c, i){
    var f = functionOf(c.fn);
    var editable = mayEdit && rowEditIs("caps", String(i));
    return '<tr data-tkrow="' + (c.fn ? "assigned" : "unassigned") + '"' +
      (editable ? ' class="tk-open"' : '') + '>' +
      '<td class="idx">' + (i+1) + '</td>' +
      /* THE NAME IS TYPED HERE (§51.11, Islam). It was printed and nothing
         else, so a capability could be given an owner but never renamed —
         and a capability added from Temple arrived called "New capability"
         with no way on this page to say what it actually is. */
      '<td>' + (editable
        ? '<input class="fld tk-firstfield" value="' + esc(c.name) + '" data-capname="' + i +
          '" aria-label="Name of capability ' + (i+1) + '">'
        : '<b>' + esc(c.name) + '</b>') + '</td>' +
      '<td>' + (editable
        /* NAMED. Eight of these on one page announced as eight identical
           unnamed combo boxes, and the searchable button in front of each
           inherits the name from here (§48.5). */
        ? '<select class="fld" data-capfn="' + i + '" aria-label="Which function carries ' +
          esc(c.name) + '">' +
            '<option value="">\u2014 unassigned \u2014</option>' +
            FUNCTION_KEYS.map(function(k){
              return '<option value="' + k + '"' + (k === c.fn ? " selected" : "") + '>' +
                esc(FUNCTIONS[k].name) + '</option>';
            }).join("") + '</select>'
        : '<span class="val">' + esc(f ? f.name : "\u2014") + '</span>') + '</td>' +
      '<td class="nowrapcell">' + esc(f ? (personName(f.head) || "\u2014") : "\u2014") + '</td>' +
      /* Defensive on purpose: a capability minted by an older build carries
         neither list, and a Setup page that throws takes the whole screen with
         it. The minting is fixed (§51.11); this is so a graph saved before the
         fix still opens. */
      '<td class="num">' + (c.keyObjectives || []).length + '</td>' +
      '<td class="num">' + (c.projects || []).length + '</td>' +
      rowActions("caps", String(i), editable,
        mayEdit && !editable ? '<button class="rmbtn" data-caprm="' + i + '">Remove</button>' : '') +
      '</tr>';
  }).join("");

  var orphan = GROUP.capabilities.filter(function(c){ return !c.fn; }).length;
  /* THE `SMO` PILL GOES AND THE ALARM STAYS (§135.1). "all assigned" goes with
     it — a green chip saying nothing is wrong is the state this page is in
     almost always, and §41's budget says a mark that is always lit is not a
     mark. What is left is drawn only when there IS an orphan. */
  return cfgHead("Capabilities",
      orphan ? ['<span class="pill none">' + orphan + ' unassigned</span>'] : [],
      null, false) +
    section("", "Capabilities", null,
      /* Widths set so a long head name \u2014 "Strategy Management Office" \u2014 does not
         wrap and leave one row taller than the rest, which reads as broken
         shading rather than as a long name. */
      /* §84. Eight rows and it grows with the practice; *Unassigned* is the
         filter because an unassigned capability is the one thing this page
         exists to fix, and the header has counted them since §15. */
      tkBar("caps", { placeholder:"Search the capabilities\u2026" }) +
      '<div class="cfg"><table data-tktable="caps"><thead><tr>' +
        (function(){ var h = tkHead("caps");
          return h("#", "idx", false) + h("Capability") + h("Owned by") + h("Head") +
                 h("Key objectives", "cc") + h("Projects", "cc") + h("", "cc", false); })() +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      (mayEdit
        ? '<div class="addrow"><button class="editbtn" id="addcap">+ Add a capability</button>' +
          '<span class="picsub" style="margin-left:10px">Name it, choose the function that ' +
          'carries it, then upload its projects on Import.</span></div>'
        : '') +
      '<div class="note"><b>One function each.</b> A function may hold several capabilities \u2014 ' +
        'Marketing carries two \u2014 which is why a custodian is named after the function and never ' +
        'after a capability: naming someone after one breaks the moment a second is assigned.</div>' +
      '<div class="note"><b>A capability carries projects, and optionally key objectives.</b> ' +
        'Key objectives are optional because some capabilities hold interrelated projects serving ' +
        'one number at the top and others are a portfolio of unrelated work: where there are none ' +
        'the card is hidden rather than shown at zero. Each project carries a brief, its ' +
        'deliverables and outcomes \u2014 half its performance each \u2014 and its milestones, which are ' +
        'its execution.</div>');
}

/* ══ COMMUNICATION (§72) ══════════════════════════════════════════════════
   Islam: "I need to have a test email send to see the design of the email and
   the sender of the email name etc. A communication setup page should handle
   all the relevant details."

   FOUR SECTIONS, IN THE ORDER THE QUESTIONS ARRIVE: can this deployment send
   at all · what does it arrive as · what does it look like · prove it.

   THE FIRST SECTION IS THE SERVER'S ANSWER, NOT THE PAGE'S GUESS. Whether a
   key is present and whether Resend has verified the domain are facts only the
   server holds, so the page ASKS (once per visit, the same shape as the
   register's password states) and says "not asked yet" while it waits rather
   than reporting a working deployment as broken.

   THE PREVIEW IS THE REAL BUILDER'S OUTPUT. `MAIL.html()` draws it and the
   test send carries the same string — a preview drawn from anything else is a
   picture of an email nobody receives.

   AND IT IS DRAWN INSIDE A SHADOW ROOT, not an iframe: the tenant's own CSP
   says `frame-src 'none'` (§43.6), so an iframe is a blank box. A shadow root
   gives the same isolation the iframe was for — nothing in the platform's
   stylesheet can reach into it, and nothing in the email's markup can reach
   out — with no policy to widen. */
var MAILSTATE = null;   /* the server's answer, once asked */
var MAILSENT  = null;   /* {ok,msg} from the last test send, until the next paint */

function commsStatusRows(){
  var live = (typeof SYNC !== "undefined") && SYNC.isLive();
  if (!live) {
    return '<tr><td colspan="2"><span class="why" style="margin:0">' +
      'There is no server here. Opened from a file the platform cannot send anything — ' +
      'this page still sets what the sender looks like, and a deployment does the sending.' +
      '</span></td></tr>';
  }
  var m = MAILSTATE;
  /* NOT ASKED and ASKED-AND-ANSWERED-NOTHING are different sentences. The
     guard sets a pending marker before the request goes out (which is what
     stops every repaint asking again), so without this the page would spend
     the round trip reporting a working deployment as having no key at all —
     §30.2's distinction, on a different kind of absence. */
  if (!m || m.pending) {
    return '<tr><td><b>Asking the server</b></td><td class="cc"><span class="why" style="margin:0">…</span></td></tr>';
  }
  if (m.error) {
    return '<tr><td><b>Could not ask</b><span class="why">' + esc(m.error) + '</span></td>' +
           '<td class="cc"><span class="pill bad">Unknown</span></td></tr>';
  }
  /* Resend's own sentences end without a full stop, so relaying one straight
     into a sentence of ours reads "API key is invalid The variable is set". */
  function sentence(t){
    t = String(t == null ? "" : t).trim();
    return t && !/[.!?]$/.test(t) ? t + "." : t;
  }
  function row(label, why, verdict, good){
    return '<tr><td><b>' + esc(label) + '</b>' +
      (why ? '<span class="why">' + why + '</span>' : '') + '</td>' +
      '<td class="cc"><span class="pill ' + (good ? "good" : "bad") + '">' + esc(verdict) + '</span></td></tr>';
  }
  /* A KEY BEING SET IS NOT A KEY BEING ACCEPTED, and only the domain check
     ever finds that out — it is the one call the status makes with the key in
     it. Reported here rather than on the domain row, where "not verified"
     would send somebody to their DNS records over a typo in a variable. */
  var d = m.domainCheck;
  var bad = !!(d && d.keyBad);
  /* AND "PRESENT" IS NOT "ACCEPTED" EITHER. The only moment the key is put to
     Resend is the domain check, so when there is no address to check a domain
     for, nothing has been asked — and a page that said "accepted" there would
     be reporting a fact nobody established. */
  var tried = !!(d && d.asked);
  var out = row("A key to send with",
    !m.hasKey ? 'Set <span class="mono">RESEND_API_KEY</span> in the deployment’s environment variables.'
      : bad ? esc(sentence(d.why) || "Resend does not accept it.") +
              ' The variable is set — the value in it is not one Resend knows.'
      : tried ? 'Held by the deployment, never shown here. Resend accepted it.'
              : 'Held by the deployment, never shown here. It has not been put to Resend yet.',
    !m.hasKey ? "Missing" : bad ? "Not accepted" : tried ? "Accepted" : "Present",
    !!m.hasKey && !bad);

  out += row("The address it comes from",
    m.from ? '<span class="mono">' + esc(m.from) + '</span>'
           : 'Set <span class="mono">SMP_MAIL_FROM</span> in the deployment’s environment variables. ' +
             'It lives there rather than here because it is tied to the domain verified with Resend.',
    m.from ? "Set" : "Missing", !!m.from);

  /* THE DOMAIN IS THE ONE THAT CATCHES PEOPLE OUT. Until Resend has verified
     it, a send succeeds for the account holder and silently reaches nobody
     else — so "ready" and "ready, for you only" have to be different words. */
  if (m.from && !bad) {
    if (m.sandbox) {
      out += row("Resend’s test domain",
        'Mail from <span class="mono">resend.dev</span> reaches the address the Resend account was opened with ' +
        'and nobody else. Verify your own domain before sending to anyone here.',
        "For you only", false);
    } else if (!d) {
      out += row("The domain " + (m.domain || ""),
        'Not checked — there is no key to ask with.', "Unknown", false);
    } else if (!d.asked) {
      out += row("The domain " + (m.domain || ""),
        esc(sentence(d.why) || "Resend could not be reached.") + ' This says nothing about the domain either way.',
        "Not asked", false);
    } else {
      out += row("The domain " + (m.domain || ""),
        d.ok ? 'Verified with Resend, so mail from it reaches anybody.'
             : esc(sentence(d.why) || ("Resend says it is " + (d.status || "not verified") + ".")) +
               ' Until it is verified, only the Resend account holder receives anything.',
        d.ok ? "Verified" : "Not verified", !!d.ok);
    }
  }
  return out;
}

function renderComms(){
  /* THE PEN DOES SOMETHING HERE. Branding draws one and gates its fields on
     the grant alone, so its edit icon is decoration — a control that changes
     nothing is worse than no control. Four settings that go out over the
     organisation's name are worth one deliberate press first, and it is the
     shape Islam asked every Setup table to take: the edit icon, top right. */
  var mayEdit = grant("c_comms") === "edit";
  var editing = mayEdit && !!EDITING["comms"];
  var c = comms(), sh = commsShape();
  var set = COMMS_FIELDS.some(function(k){ return !!c[k]; });

  function fld(key, label, why, placeholder, area){
    var v = c[key] || "";
    return '<tr><td style="width:32%"><b>' + esc(label) + '</b><span class="why">' + why + '</span></td>' +
      '<td>' + (editing
        ? (area
            ? '<textarea class="fld" rows="3" data-comms="' + key + '" placeholder="' +
              esc(placeholder) + '">' + esc(v) + '</textarea>'
            : '<input class="fld" data-comms="' + key + '" value="' + esc(v) +
              '" placeholder="' + esc(placeholder) + '">')
        : (v ? '<span class="val">' + esc(v) + '</span>'
             : '<span class="why" style="margin:0">' + esc(placeholder) + '</span>')) +
      '</td></tr>';
  }

  var sender = '<div class="cfg"><table><thead><tr><th>What it is</th><th>Value</th></tr></thead><tbody>' +
    fld("headerName", "Header name",
        'The big line in the coloured band at the top of the message. Empty means the ' +
        'organisation’s name — it is asked separately so changing what an email says does not ' +
        'rename the tenant on every screen.',
        sh.org) +
    fld("fromName", "Sender name",
        'The name beside the address in somebody’s inbox. Empty means the organisation’s own name.',
        sh.fromName) +
    fld("replyTo", "Replies go to",
        'Where a reply lands. Empty means the sending address, which nobody reads.',
        "nobody — replies go to the sending address") +
    fld("eyebrow", "Kicker",
        'The small line under the organisation’s name in the header.',
        sh.eyebrow) +
    fld("footer", "Footer",
        'The small print at the bottom of every message.', sh.footer, true) +
    '</tbody></table></div>' +
    (editing && set
      ? '<div style="margin-top:12px"><button class="linkbu" data-commsreset="1">' +
        'Put them all back to their defaults</button></div>'
      : '');

  /* The address the test defaults to is the signed-in person's own, off the
     register — a test that has to be typed before it can be pressed is a test
     most people do not run. */
  var me = (typeof SYNC !== "undefined" && SYNC.person && SYNC.person()) || null;
  var mine = me ? personBy(me.key) : null;
  var to = (mine && mine.email) || "";
  var live = (typeof SYNC !== "undefined") && SYNC.isLive();
  var sent = MAILSENT;

  var test = '<div class="cfg"><table><tbody><tr>' +
    '<td style="width:32%"><b>Send it to</b><span class="why">' +
      (to ? 'Your own address, from the register.'
          : 'You have no address on the register, so type one.') + '</span></td>' +
    '<td><span class="brandpick">' +
      '<input class="fld" id="mailto" value="' + esc(to) + '" placeholder="somebody@example.com"' +
        (live ? '' : ' disabled') + ' style="max-width:280px">' +
      '<button class="editbtn apply" data-mailtest="1"' + (live ? '' : ' disabled') + '>Send a test</button>' +
      /* READ ONCE AND CLEARED. The sentence is written straight into the
         element when the send answers, because a repaint would replace the
         button that was just pressed (§63.4) — so this only exists to survive
         a repaint that happens to land in between. Left standing, "API key is
         invalid" would still be sitting under the button on a visit three days
         later, describing a send nobody made. */
      '<span class="why" id="mailsent" style="margin:0' +
        (sent && sent.ok !== null ? ';color:var(--' + (sent.ok ? "good" : "bad") + '-tx)' : '') + '">' +
        (sent ? esc(sent.msg) : (live ? '' : 'There is no server here to send it.')) +
      '</span>' +
    '</span></td></tr></tbody></table></div>';

  return cfgHead("Email settings", [], "comms", mayEdit, null) +

    section("", "Can this deployment send?",
      null,
      '<div class="cfg"><table><thead><tr><th>What was checked</th>' +
      '<th class="cc" style="width:18%">Verdict</th></tr></thead><tbody>' +
      commsStatusRows() + '</tbody></table></div>') +

    section("", "What it arrives as",
      null,
      sender) +

    section("", "What it looks like",
      null,
      '<div class="mailprev" id="mailprev"></div>') +

    section("", "Prove it",
      null,
      test);
}

/* THE PREVIEW, DRAWN INTO A SHADOW ROOT. Its own function because it is redrawn
   on every field change without repainting the page — and because attachShadow
   throws if one is already there, so "have I done this" has to be asked in
   exactly one place. */
function paintMailPreview(){
  var host = document.getElementById("mailprev");
  if (!host) return;
  var root = host.shadowRoot;
  if (!root) {
    if (!host.attachShadow) {
      /* No shadow DOM: say so rather than injecting the email into the page,
         where the platform's own rules would restyle it and the preview would
         be a picture of something nobody receives. */
      host.textContent = "This browser cannot draw the preview.";
      return;
    }
    root = host.attachShadow({ mode: "open" });
  }
  root.innerHTML = MAIL.sampleFor(commsShape());
}

/* ══ WRITING A MESSAGE (§74) ═══════════════════════════════════════════════
   Islam: "I want to start sending messages … I need the message initiation and
   sending section."

   THREE QUESTIONS, IN THE ORDER SOMEBODY ANSWERS THEM: who · what · send it.

   THE PAGE HOLDS CRITERIA, NEVER A LIST OF ADDRESSES. Ticking a box changes
   what was CHOSEN; who that resolves to is the server's answer, asked as you
   tick and shown before anything is sent. A page that assembled the recipients
   itself would be the browser deciding who gets mail — §42's rule one surface
   out — and it would answer from a register that may be a minute stale.

   AND TYPING NEVER REPAINTS (§35, §71.2). The audience comes back from the
   server while somebody is halfway through a sentence, so the resolved list is
   written into its own element and the composer is left alone. Everything
   typed is mirrored into SENDMSG on `change`, so the one repaint that does
   happen — after a send — does not lose it. */
/* Which recipient dropdown is open, or null. ONE at a time: two overlapping
   popups on the same row are two things covering each other. */
var DDOPEN = null;
var SENDMSG = null;
function sendmsg(){
  /* `greet` is the greeting WORD or null, and null is off (spec 022). One
     value, not a flag beside a word: a switch that is on with no word is a
     state nothing above allows, and two fields that must agree are two fields
     that drift (§104.7's shape). OFF BY DEFAULT — Islam's answer — so a
     message sends exactly as it did before this existed unless somebody asks
     for the greeting on that message. */
  if (!SENDMSG) SENDMSG = { criteria: { everyone:false, roles:[], targets:[], keys:[] },
                            subject:"", body:"", ctaLabel:"", ctaHref:"",
                            greet:null,
                            draftId:null,
                            aud:null, asking:false, busy:false, result:null };
  return SENDMSG;
}
/* ── WHOSE NAME THE PREVIEW SHOWS (spec 022) ────────────────────────────
   The FIRST resolved recipient, looked up on the register so a typed short
   name counts (§93.8) — the audience row carries only key, name and address.
   Falls back to the audience row's own name, and then to nothing at all: a
   preview with no audience yet still has to draw the greeting, and "Dear
   Ahmed" invented out of nowhere would be a name nobody is going to receive.
   The word alone is what it shows then. */
function greetSample(){
  var st = sendmsg(), to = (st.aud && st.aud.to) || [];
  if (!to.length) return "";
  var r = to[0], p = (typeof personBy === "function") ? personBy(r.key) : null;
  return SMPRules.firstName(p || { name: r.name });
}

/* ── THE MESSAGE ON SCREEN IS NO LONGER THE ONE THAT WENT (§143) ────────
   Called the moment anything about the message changes after it has been sent.
   Without it the composer is a dead end (§61): the only control offered is
   *Write another*, which CLEARS — so somebody fixing a typo to re-send the
   corrected version would have to throw away the correction to get a Send
   button back.

   IT DOES NOT REPAINT, and that is the whole reason it exists rather than a
   `paint()` in the editors. The heading and the body are typed into the
   preview itself, so a repaint on the first keystroke rebuilds the
   contenteditable and the caret dies mid-word (§35, §71.2, §30.1). Both
   buttons are drawn and bound at paint time, so this is two `hidden` flags and
   nothing to rewire.

   THE OUTCOME GOES WITH IT: "76 messages sent." describes a message that is no
   longer what is on screen, and a sentence that is merely stale is worse than
   no sentence (§100). */
function sendmsgTouched(){
  var st = sendmsg();
  if (!st.result) return;
  st.result = null;
  var said = document.getElementById("msgsaid");
  if (said) { said.textContent = ""; said.className = "why msgsaid"; }
}

/* Toggling one entry of a criteria list. The lists are small and the order
   does not matter, so membership is the whole of it. */
function sendmsgToggle(list, value, on){
  var m = sendmsg().criteria, a = m[list] || (m[list] = []);
  var i = a.indexOf(value);
  if (on && i < 0) a.push(value);
  if (!on && i > -1) a.splice(i, 1);
}
function sendmsgHasAny(){
  var c = sendmsg().criteria;
  return !!(c.everyone || (c.roles||[]).length || (c.targets||[]).length || (c.keys||[]).length);
}

/* Every place a message can be aimed at, in the vocabulary roles already use
   (§54): "group", "co:…", "fn:…" or a unit key. One list, so the composer and
   the resolver cannot disagree about what a target string means. */
function sendmsgTargets(){
  /* The group sits WITH the companies rather than alone above them: one
     capsule under a heading of its own reads as a category with one member,
     and the two are the same question — how far up do you want this to go. */
  var WIDE = "The group and its companies";
  var out = [{ at:"group", label:"The group", kind:WIDE }];
  Object.keys(COMPANIES || {}).forEach(function(ck){
    if (companyActive(ck)) out.push({ at:"co:" + ck, label:COMPANIES[ck].name, kind:WIDE });
  });
  UNIT_KEYS.forEach(function(k){
    if (UNITS[k] && UNITS[k].active !== false) out.push({ at:k, label:UNITS[k].name, kind:"Business units" });
  });
  FUNCTION_KEYS.forEach(function(k){
    if (FUNCTIONS[k] && FUNCTIONS[k].active !== false)
      out.push({ at:"fn:" + k, label:FUNCTIONS[k].name, kind:"Supporting functions" });
  });
  return out;
}

/* What the resolved list says, drawn on its own so it can be replaced without
   touching the composer around it. */
/* ── THE AUDIENCE IS A SUMMARY, NOT A LIST OF EVERYBODY (§95) ─────────
   Islam, on the page as a whole: "the send message needs a reform for a better
   user experience."

   THE PRIMARY ACTION USED TO RUN AWAY FROM YOU. Every recipient drew a named
   chip, so the more carefully somebody chose who a message went to, the
   further Send moved down the page — 299px of chips for 33 people, and this
   register holds 76. Measured, not guessed: Send sat 1122px down an EMPTY
   page and further with every tick.

   So the counts are the answer and the names are one press away. Two numbers,
   because they are two different facts and only one of them is a problem:
   how many will get it, and how many will not.

   THE SKIPPED COUNT IS NEVER BEHIND THE DISCLOSURE. It is the thing that
   started all of this — three people silently missed — so it reads on the line
   whether or not anybody opens the names.

   `SENDNAMES` is a screen preference and lives nowhere but this page's state:
   who you are sending to is not a thing to remember between sessions. */
var SENDNAMES = false;

function sendmsgAudienceHtml(){
  var st = sendmsg();
  if (!sendmsgHasAny())
    return '<span class="why" style="margin:0">Nobody chosen yet \u2014 tick something above.</span>';
  if (st.asking || !st.aud)
    return '<span class="why" style="margin:0">Working out who that is\u2026</span>';
  if (st.aud.error)
    return '<span class="why" style="margin:0">Could not ask the server: ' + esc(st.aud.error) + '</span>';

  var to = st.aud.to || [], sk = st.aud.skipped || [];

  /* ── NOBODY IS THREE DIFFERENT ANSWERS (§75.3, kept whole) ──────────
     "That comes to nobody with an address" was said for all of them and is
     true of one. The three are: nothing matched · everything that matched has
     no address · the server does not hold the register you are looking at. */
  if (!to.length) {
    if (sk.length) {
      return '<div class="audsum bad">' +
        '<b>Nobody will get this.</b>' +
        '<span class="why" style="margin:0">The ' +
          plural(sk.length, "person", "people") +
          (sk.length === 1 ? ' who matches has' : ' who match have') +
          ' no usable address.</span>' +
        '<button class="linkbu audmore" data-audnames="1">' +
          (SENDNAMES ? "Hide the names" : "Show the names") + '</button>' +
        '</div>' + (SENDNAMES ? sendmsgNamesHtml([], sk) : '');
    }
    var known = (st.aud.active == null) ? null : st.aud.active;
    return '<div class="audsum bad"><b>Nobody on the register matches that.</b>' +
      (known === null ? '' :
        '<span class="why" style="margin:0">The server holds ' + known + ', ' +
        (st.aud.withAddress || 0) + ' of them with an address. ' +
        (known === 0
          ? 'Nothing has been saved to it yet.'
          : 'If somebody you just added is missing, their row had not been saved ' +
            'when this was asked \u2014 change a tick and it will ask again.') +
        '</span>') + '</div>';
  }

  return '<div class="audsum">' +
      '<span class="pill good">Will get it</span><span class="audn">' + to.length + '</span>' +
      (sk.length
        ? '<span class="pill warn">Skipped</span><span class="audn">' + sk.length + '</span>' +
          '<span class="why" style="margin:0">' + esc(sendmsgSkipWhy(sk)) + '</span>'
        : '<span class="why" style="margin:0">Nobody is being skipped.</span>') +
      '<button class="linkbu audmore" data-audnames="1">' +
        (SENDNAMES ? "Hide the names" : "Show the names") + '</button>' +
    '</div>' +
    (SENDNAMES ? sendmsgNamesHtml(to, sk) : '');
}

/* WHY, IN ONE PHRASE, WHEN THEY ALL SHARE ONE. Every skipped person carries a
   reason and they are usually the same reason; saying it once on the line is
   what makes the count actionable without opening anything. Where they differ
   it says so and the names carry the detail. */
function sendmsgSkipWhy(sk){
  var seen = {}, n = 0, first = "";
  sk.forEach(function(r){
    var w = String(r.why || "");
    if (!seen[w]) { seen[w] = 1; n++; if (!first) first = w; }
  });
  return n === 1 ? "\u2014 " + first : "\u2014 for several different reasons";
}

/* SKIPPED FIRST AND NAMED (§75.3). "3 skipped" tells nobody which three, and
   the fix for every one of them is a different edit on a different row. */
function sendmsgNamesHtml(to, sk){
  return '<div class="audnamebox">' +
    (sk.length
      ? '<div class="audskip"><b>' + plural(sk.length, "person", "people") + ' skipped</b>' +
        '<div class="audnames">' + sk.map(function(r){
          return '<span class="chip warnchip" title="' + esc(r.why) + '">' + esc(r.name) +
                 ' <i>' + esc(r.why) + '</i></span>'; }).join("") + '</div></div>'
      : '') +
    (to.length
      ? '<div class="audnames">' + to.map(function(r){
          return '<span class="chip">' + esc(r.name) + '</span>'; }).join("") + '</div>'
      : '') +
    '</div>';
}

function renderSendMessage(){
  var st = sendmsg(), c = st.criteria, sh = commsShape();
  var live = (typeof SYNC !== "undefined") && SYNC.isLive();

  /* ── SEARCHABLE DROPDOWNS, SIDE BY SIDE (§76.2) ─────────────────
     Islam: "for the who gets it just make it multiple drop downs with
     searchable checklists and the drop downs are beside each other."

     The wall of capsules was thirty controls at once, and thirty controls is a
     thing you scan rather than a thing you use — with ten units, eight
     functions and eight roles it only gets worse as the tenant grows. Four
     buttons that each open a searchable list is the same choice made in the
     same vocabulary, and what is CHOSEN stays visible on the buttons, so
     nothing is hidden by closing one.

     One panel open at a time (DDOPEN), because two overlapping popups on one
     row is two things covering each other. */
  function ddrow(list, value, label){
    var on = (c[list] || []).indexOf(value) > -1;
    return '<label class="ddrow' + (on ? ' on' : '') + '" data-ddtext="' +
      esc(label.toLowerCase()) + '">' +
      '<input type="checkbox" data-aud="' + esc(list) + '" value="' + esc(value) + '"' +
        (on ? ' checked' : '') + '>' +
      '<span>' + esc(label) + '</span></label>';
  }
  function dd(key, label, rows, chosen){
    var open = DDOPEN === key;
    return '<div class="pickdd' + (open ? ' open' : '') + '">' +
      '<button class="ddbtn' + (chosen ? ' has' : '') + '" data-ddopen="' + esc(key) + '" ' +
        'aria-expanded="' + open + '">' +
        '<span class="ddlab">' + esc(label) + '</span>' +
        (chosen ? '<span class="ddn">' + chosen + '</span>' : '') +
        '<span class="ddcar">\u25be</span></button>' +
      (open
        ? '<div class="ddpop" data-ddpop="' + esc(key) + '">' +
            '<input class="fld ddsearch" data-ddsearch="' + esc(key) +
              '" placeholder="Search\u2026" autocomplete="off">' +
            '<div class="ddlist">' + rows + '</div>' +
            (chosen ? '<div class="ddfoot"><button class="linkbu" data-ddclear="' +
               esc(key) + '">Clear these ' + chosen + '</button></div>' : '') +
          '</div>'
        : '') +
      '</div>';
  }

  var tg = sendmsgTargets();
  function tgRows(kind){
    return tg.filter(function(t){ return (t.kind || "") === kind; })
             .map(function(t){ return ddrow("targets", t.at, t.label); }).join("");
  }
  function tgCount(kind){
    return tg.filter(function(t){ return (t.kind || "") === kind &&
             (c.targets || []).indexOf(t.at) > -1; }).length;
  }
  var WIDE = "The group and its companies";

  /* Wrapped in a row, or the flex COLUMN the picker is stretches this one
     capsule the full width of the pane — a checkbox with 900px of clickable
     nothing after it. */
  var everyone = '<div class="audrow"><label class="audbox' + (c.everyone ? ' on' : '') + '">' +
      '<input type="checkbox" data-aud="everyone" value="1"' +
        (c.everyone ? ' checked' : '') + '>' +
      '<span>Everyone on the register</span></label></div>';

  var picked = (c.keys || []).map(function(k){
      var p = personBy(k);
      return '<span class="chip">' + esc(p ? p.name : k) +
        '<button class="chipx" data-audkey="' + esc(k) + '" aria-label="Remove">&times;</button></span>';
    }).join("");

  var ddbar = '<div class="ddbar">' +
    dd("roles", "Roles",
       ROLES.map(function(r){ return ddrow("roles", r.key, r.name); }).join(""),
       (c.roles || []).length) +
    dd("wide", "Group & companies", tgRows(WIDE), tgCount(WIDE)) +
    dd("units", "Business units", tgRows("Business units"), tgCount("Business units")) +
    dd("fns", "Functions", tgRows("Supporting functions"), tgCount("Supporting functions")) +
    dd("people", "People",
       PEOPLE.filter(personActive).map(function(p){
         return ddrow("keys", p.key, p.name + (p.email ? "" : " \u2014 no address"));
       }).join(""),
       (c.keys || []).length) +
    '</div>';

  /* NO NOTE (CLAUDE.md 1b-ii). The sentence here was carrying a FACT the screen
     does not otherwise state — that the criteria ADD UP rather than narrow each
     other — so it moves to the heading's HOVER rather than being deleted: that
     is information, not a description (§127's ruling, that prose explaining a
     control belongs behind a mark). `section()`'s fifth argument is the tip. */
  var who = section("", "Who gets it", null,
    '<div class="cfg audpick">' + everyone + ddbar +
      (picked ? '<div class="audrow">' + picked + '</div>' : '') +
      '<div class="audout" id="audout">' + sendmsgAudienceHtml() + '</div>' +
    '</div>',
    "Tick as many as you like \u2014 they add up rather than narrow each other. " +
    "Somebody who matches twice still gets one message.");

  /* ── ONE PLACE TO WRITE IT (§76.3) ──────────────────────────────
     Islam: "should I edit in separate boxes or can you let me edit inside the
     final design box?"

     Inside. A subject box above a preview of the subject is the same words
     twice, and the second copy is the one that is wrong whenever they differ.
     The heading and the body are typed straight into the message; the button
     keeps its own two fields, because a label and a link are not text in the
     flow and there is nowhere in the design to type a URL.

     THE HEADING IS ALSO THE SUBJECT LINE, and the note says so — a person is
     entitled to know that what they type at the top is what lands in an inbox
     list, since those are two different places and only one of them is on
     screen. */
  /* ── THE BUTTON IS PART OF THE MESSAGE (§95) ────────────────────
     It was a top-level section between the message and Send, with a heading as
     loud as "Who gets it" — for two optional fields. It is a row under the
     composer now: same controls, same rules, no longer a step of its own. */
  var ctarow =
    '<div class="ctarow">' +
      '<span class="why" style="margin:0"><b>A button, if you want one.</b> ' +
        'Both halves or neither \u2014 a button with no link does nothing and a ' +
        'link with no words is invisible.</span>' +
      '<input class="fld" id="msgctalabel" value="' + esc(st.ctaLabel) +
        '" placeholder="Open the platform">' +
      '<input class="fld" id="msgctahref" value="' + esc(st.ctaHref) +
        '" placeholder="' + esc(sh.href || "https://\u2026") + '">' +
    '</div>';

  /* ── THE GREETING ROW (spec 022) ────────────────────────────────
     ONE LINE, AND NOTHING EXPLAINING ITSELF. Islam, of a two-line first
     draft: "the design of the setting is poor. It should be one line you dont
     need 2 lines .. and no explanations needed in the setting itself it's
     clear." A label reading "Open with a greeting" beside a box holding the
     word "Dear" has already said what the sentence under it said — §127's
     ruling on the chat settings, reached again from the other direction. And
     the height was not the only cost: two lines under the message made the
     greeting read as a bigger decision than the button row beneath it, which
     is one line.

     `.imp-row` + `.cfg-lab` + `.minisw` is the platform's OWN switch row, the
     one the naming setting wears (§44) — never a control invented for this.

     THE WORD BOX SITS BEFORE THE SWITCH, so the switch is last in the row
     whether the greeting is on or off: a control that moves under the press
     that produced it is §41.8's fault. */
  var greetrow =
    '<div class="ctarow greetrow">' +
      '<div class="imp-row" style="margin:0;grid-column:1 / -1">' +
        '<span class="cfg-lab">Open with a greeting</span>' +
        (st.greet != null
          ? '<input class="fld greetword" id="msggreet" value="' + esc(st.greet) +
              '" placeholder="Dear" aria-label="The greeting word" maxlength="24">'
          : '') +
        '<span class="minisw">' +
          '<button data-greet="0" aria-pressed="' + (st.greet == null) + '">Off</button>' +
          '<button data-greet="1" aria-pressed="' + (st.greet != null) + '">On</button>' +
        '</span>' +
      '</div>' +
    '</div>';

  /* The heading being the subject line is worth saying and is not a
     description of the page, so it rides the hover too (CLAUDE.md 1b-ii). */
  var look = section("", "Write it", null,
    /* The sample line sits between the preview and the greeting row, because
       it is about the message above it. Drawn only while the greeting is on
       (§41's budget), and it is the ONE thing the screen cannot say by
       showing: without it a draft opened by somebody else reads as everybody
       getting "Dear Ahmed". Six words. */
    '<div class="mailprev grows" id="msgprev"></div>' +
    (st.greet != null
      ? '<span class="why greetsay">Everyone sees their own name here.</span>'
      : '') +
    greetrow + ctarow,
    "Type straight into the message. The heading is also the subject line people " +
    "see in their inbox before they open it.");

  /* ── THE BAR DOES NOT MOVE (§95) ────────────────────────────────
     Pinned to the foot of the pane rather than sitting at the end of the
     scroll, so it stays put whether the audience is three people or
     seventy-six — which is the whole complaint, since every recipient used to
     push it further away.

     THE BUTTON SAYS WHAT IT WILL DO. "Send to 47" is the count that cannot be
     taken back, on the control that does it; a bare "Send" makes somebody scroll
     up to check what they are about to do.

     ONE SOLID BUTTON (§94.8's budget). Send is the CTA; Save draft and the test
     are quiet beside it. */
  var r = st.result;
  var n = (st.aud && st.aud.to) ? st.aud.to.length : 0;
  var ready = live && sendmsgHasAny() && st.subject.trim() && st.body.trim() && n;
  /* ── AFTER A SEND, THE BAR REPORTS AND MOVES ON (§143) ──────────
     Islam: "When I send I don't get any verification that the message was sent
     and the page stays the same view."

     Both halves of that were true. The outcome was drawn in `.why` — the same
     12px quiet grey as an empty space — and `result.ok` was worked out and
     never read, so a FAILED send turned red and a successful one got no colour
     at all. And the orange button still read *Send to 76 people* and was still
     live, with the subject, the message and the audience all still loaded: every
     loud signal on the bar said not-sent-yet, which is what the eye reads.

     THE SECOND PRESS IS THE REAL FAULT. §95 put a confirmation in FRONT of the
     send because it cannot be recalled, and then left the button loaded — one
     press from sending the whole thing again, with nothing on screen to say it
     had already gone.

     So the CTA becomes the next thing you would actually do. It is not a
     disabled Send left lying there: a dead control in the loudest slot is
     furniture, and the word "Sent" on it beside "Sent" in the outcome is the
     same word twice (§87's twins). */
  /* ── §143 IS SUPERSEDED BY §144, AND ONLY ITS ANSWER IS ──────────
     That section put the outcome in this bar and turned Send into *Write
     another*, because the page stayed put after a send. The page does not stay
     put now: it goes back to the Overview, which is where the record is and
     therefore where the proof belongs. So the bar keeps the send and nothing
     else — no outcome line to go stale, and no second control.

     WHAT SURVIVES IS THE RULE UNDERNEATH: a send cannot be repeated by one
     press. It cannot here either, and by construction rather than by a flag —
     you are on the other tab, and the composer it left behind is empty. */
  var bar =
    '<div class="sendbar">' +
      '<button class="editbtn cta" id="msgsend"' + (live ? '' : ' disabled') + '>' +
        (n ? 'Send to ' + plural(n, "person", "people") : 'Send') + '</button>' +
      '<button class="editbtn" id="msgdraft"' + (live ? '' : ' disabled') + '>' +
        (st.draftId ? 'Save the draft' : 'Save as a draft') + '</button>' +
      /* ── SEND ME A COPY FIRST (§95) ────────────────────────────
         The missing safeguard, and the cheapest one: a message to
         seventy-six people cannot be recalled, and until now there was no way
         to see the real thing in your own inbox before it went. It sends THIS
         message, built by the same builder (§72.3), to the person pressing it
         — so what they read is what everybody else will read. */
      '<button class="editbtn" id="msgtestme"' +
        (live && st.subject.trim() && st.body.trim() ? '' : ' disabled') +
        /* THE HOVER SAYS WHERE IT GOES (§145). It is one clause on the title
           the button already had, never a new line under it: with the test copy
           now in the record beneath, the row itself is the answer, and a
           sentence explaining a control is what §127 spent a whole panel
           removing (CLAUDE.md 1b-ii). */
        ' title="One copy, to you, before it goes to anybody else \u2014 ' +
        'kept in the record below as a test copy.">' +
        'Send me a copy</button>' +
      /* THIS SAYS ONLY WHAT DID NOT HAPPEN NOW (§144). A send the server
         answered leaves this tab, so its outcome is drawn on the Overview; what
         is left here is the case where nothing went — no server, a refusal, a
         network failure — and you stay put with the message still loaded.
         `--bad-tx` is the type-safe twin (§38.4), 7.55 in light, 8.14 in dark,
         at `--fs-note` because it is a sentence somebody has to read. */
      '<span class="why msgsaid' + (r && !r.landed ? ' bad' : '') +
        '" id="msgsaid" style="margin:0">' +
        (r && !r.landed ? '<b>' + esc(r.msg) + '</b>'
           : (live ? '' : 'There is no server here to send from.')) + '</span>' +
    '</div>';

  /* WHAT HAPPENED, after a send. It belongs with the record rather than the
     composer, so it sits above the bar and goes when the next one starts. */
  var said = (r && r.rows)
    ? section("", "What happened", null,
        '<div class="cfg"><div class="audnames">' +
          r.rows.map(function(x){
            return '<span class="chip' + (x.ok ? '' : ' warnchip') + '">' + esc(x.name) +
              (x.ok ? '' : ' <i>' + esc(x.why) + '</i>') + '</span>'; }).join("") +
        '</div></div>')
    : "";


  /* THE HEADER CARRIES THE PAGE'S NAME AND NOTHING ELSE (§130 from main,
     §144 from here, and they agree). §130's header line dropped the badge and
     the count; §144 dropped Drafts and Sent, because the Overview tab is where
     both lists live now and a dropdown beside the tab that holds them is the
     same list in two places (§90's argument, from the other side). */
  return cfgHead("Send an email", [], null, false, null, null, null) +
    who + look + said + bar;
}

/* ══ THE OVERVIEW (§144) ═══════════════════════════════════════════════════
   Islam: "the opening page ... should be a dashboard of what was sent, to whom,
   how many people ... and when I finish and send it it should take me back to
   the dashboard and show me that the message was sent there."

   NOTHING NEW IS COMPUTED. Every send already writes a row — subject, when,
   the criteria it was aimed at, how many were reached, how many failed, by whom
   — plus a row per recipient. This is that record, moved to the front from the
   header dropdown it was hiding in, and it calls the SAME `renderDraftList()`
   and `renderSentList()` the dropdowns called, so the list cannot say two
   different things depending on where it is drawn.

   THE OUTCOME OF A SEND LANDS HERE, not on the composer you have just left —
   which is the whole of what was asked (§144.2). */
function renderMsgOverview(){
  var st = sendmsg();
  var r = st.result;
  var said = (r && r.landed)
    ? '<div class="sentsaid' + (r.ok ? '' : ' bad') + '"><b>' + esc(r.msg) + '</b>' +
      (r.ok && r.skipped
        ? ' <span class="quiet">' + plural(r.skipped, "person", "people") +
          ' skipped \u2014 no address on their row.</span>'
        : '') + '</div>'
    : '';
  /* `#msgover` IS THE HOOK THE TWO FETCHES ARE GATED ON. They were gated on
     `#msgsend` — the Send button — which now lives on the other tab, so on this
     one neither list was ever asked and both said "Asking…" for ever: §93's
     fault exactly, a gate keyed on markup that moved, failing silently and in
     the safe-looking direction. Gated on the thing that DRAWS the lists. */
  /* ── THE ACTION, MADE OBVIOUS (§144.8) ──────────────────────────
     Islam: "in the overview I'd like to add a button, send an email, somewhere
     for the action to be obvious." He is right that it was missing: *Write a
     message* is a TAB, and a tab reads as where you are rather than as
     something to do, so the page's whole purpose had no loud control on it.

     ABOVE THE LISTS — his pick from three drawn in the real page. The cost was
     stated before he chose and is recorded rather than re-argued: it SCROLLS
     AWAY, so on a long record the one action on the page is off the top of the
     screen. The header (option A) would have stayed put; he wanted it in the
     tab's own content, where it unambiguously belongs to this tab and nothing
     else.

     "SEND AN EMAIL" IS HIS WORD TOO, chosen over *Write a message*, which is
     what the tab it opens is called. The cost is that the platform now has a
     third noun for one thing — page: *Send a message*, tab: *Write a message*,
     button: *Send an email* (§87's twins, in vocabulary rather than in rows).
     Recorded, not re-argued.

     DRAWN ONLY HERE, never on the composer: a button offering to take you
     where you already are is a duplicate, not a choice (§94.15). It is inside
     `#msgover`, which only the Overview renders, so that holds by
     construction. */
  var write = '<div class="msgnew">' +
    '<button class="editbtn cta" data-msgwrite="1">Send an email</button></div>';
  return '<div id="msgover">' + said + write + renderDraftList() +
         renderSentList() + renderSentOne() + '</div>';
}

/* WHAT IS HALF-WRITTEN. Listed above what was sent, because a draft is
   something you are going to do and a sent message is something you did. */
var DRAFTLIST = null;   /* null = not asked */
function renderDraftList(){
  var rows = (DRAFTLIST && DRAFTLIST.drafts) || [];
  var st = sendmsg();
  var body = !DRAFTLIST
    ? '<span class="why" style="margin:0">Asking\u2026</span>'
    : DRAFTLIST.error
      ? '<span class="why" style="margin:0">' + esc(DRAFTLIST.error) + '</span>'
      : !rows.length
        ? '<span class="why" style="margin:0">No drafts. Write something and press ' +
          '<b>Save as a draft</b>.</span>'
        /* THE WIDTHS ARE ON THE HEADER ROW, because `.cfg table` is
           `table-layout:fixed` and fixed layout takes every column width from
           the header and ignores a body cell's (§46). In a 600px panel the
           heading was clipped to "Half-wri…" while a 150px actions column sat
           half empty — and the heading is the ONLY thing that tells one draft
           from another. */
        : '<div class="cfg"><table><thead><tr><th style="width:52%">Heading</th>' +
          '<th style="width:27%">Last saved</th>' +
          '<th class="cc" style="width:21%">&nbsp;</th></tr></thead><tbody>' +
          rows.map(function(d){
            var open = String(st.draftId || "") === String(d.id);
            return '<tr' + (open ? ' class="focusrow"' : '') + '><td><b>' +
              esc(d.subject || "(no heading yet)") + '</b>' +
              (open ? '<span class="why">open now</span>' : '') + '</td>' +
              '<td>' + esc(String(d.updated_at || "").slice(0, 16).replace("T", " ")) + '</td>' +
              '<td class="cc">' +
                '<button class="linkbu" data-draftopen="' + esc(String(d.id)) + '">Open</button> ' +
                '<button class="linkbu danger" data-draftdel="' + esc(String(d.id)) +
                  '">Delete</button></td></tr>';
          }).join("") + '</tbody></table></div>';
  /* NO NOTE. Islam: "remove the grey descriptions and stop adding descriptions
     to pages." The heading names the list; a paragraph under it in grey says it
     again and pushes what people came for down the page (CLAUDE.md 1b-ii). */
  return section("", "Not sent yet", null, body);
}

/* ── WHO A MESSAGE WENT TO, IN WORDS (§144) ───────────────────────────
   From the criteria as they were CHOSEN — `messages.audience`, which is what
   somebody ticked — never from re-resolving them today, which would describe
   who it would reach NOW rather than who it reached.

   NAMED THROUGH THE PLATFORM'S OWN VOCABULARY (§53.5): `roleName()` and
   `placeLabel()` are what the composer's own dropdowns say, so the record reads
   in the same words the choosing did. A key that no longer names anything —
   a unit renamed or retired since — is shown AS THE KEY rather than dropped,
   because a record that quietly loses a recipient group is worse than one with
   an unfamiliar word in it (§96.2's rule, in the record). */
function audienceWords(a){
  if (!a) return "\u2014";
  if (typeof a === "string") { try { a = JSON.parse(a); } catch (e) { return "\u2014"; } }
  if (a.everyone) return "Everyone on the register";
  var out = [];
  (a.roles || []).forEach(function(r){
    out.push(typeof roleName === "function" ? (roleName(r) || r) : r); });
  (a.targets || []).forEach(function(k){
    out.push(typeof placeLabel === "function" ? (placeLabel(k) || k) : k); });
  var n = (a.keys || []).length;
  if (n) out.push(plural(n, "person", "people") + " by name");
  return out.length ? out.join(" \u00b7 ") : "\u2014";
}

/* THE HEADER DROPDOWNS ARE GONE (§144, finishing §95). `renderDraftMenu()`
   and `renderSentMenu()` wrapped the two lists in header menus so a thing done
   occasionally would not sit below the composer. The Overview tab is that
   answer now, and it calls `renderDraftList()` / `renderSentList()` directly —
   so the wrappers had no caller left, and a builder nobody calls is one the
   next reader takes for load-bearing (§24). */

/* WHAT WAS SENT. Its own section rather than its own page: the thing you want
   after pressing Send is to see it in the list, and a second destination puts
   a navigation between the act and its record. */
var SENTLIST = null;   /* null = not asked */
/* ── WHAT HAPPENED TO EACH PERSON (§93.15) ────────────────────────────
   Islam: "I sent a message everyone received but not the SMO team."

   The platform already knew. Every send writes a `message_recipients` row per
   person — the address it used, whether the provider accepted it, the error if
   it did not, and the provider's own id — and `historyOne` has returned all of
   that since the table existed. NOTHING HAS EVER CALLED IT. The record was
   written on every send and could not be read back from any screen, so the one
   question a record exists to answer had to be guessed at instead.

   THE THREE OUTCOMES ARE THREE DIFFERENT PROBLEMS, and separating them is the
   whole value of this screen:

     absent   — they never resolved into the audience. Retired, no address, or
                sharing one with another row. The fix is on the register.
     failed   — the provider refused it, and said why. The fix is the address.
     sent     — the platform handed it over and got an id back. Anything after
                that is delivery: a filter, a rule, a full mailbox. Nothing on
                this side will fix it, and knowing that is the point.

   A summary that says "44 of 47" tells you a number and not one of those. */
var SENTONE = null;   /* { id, asking, data, error } */

function renderSentOne(){
  if (!SENTONE) return "";
  var body;
  if (SENTONE.asking) body = '<span class="why" style="margin:0">Asking\u2026</span>';
  else if (SENTONE.error) body = '<span class="why" style="margin:0">' + esc(SENTONE.error) + '</span>';
  else {
    var to = (SENTONE.data && SENTONE.data.recipients) || [];
    var ok = to.filter(function(r){ return r.ok; });
    var no = to.filter(function(r){ return !r.ok; });
    /* Failures first and named, the same rule the audience already follows:
       "3 failed" tells nobody which three, and each one is a different fix. */
    var row = function(r){
      return '<tr><td><b>' + esc(r.person_name || "\u2014") + '</b></td>' +
        '<td><span class="mono">' + esc(r.address || "") + '</span></td>' +
        '<td class="cc"><span class="pill ' + (r.ok ? "good" : "bad") + '">' +
          (r.ok ? "Sent" : "Failed") + '</span></td>' +
        '<td class="msgerr">' + (r.ok
          ? '<span class="why" style="margin:0">handed to the mail provider</span>'
          : '<span class="why" style="margin:0">' + esc(r.error || "no reason given") + '</span>') +
        '</td></tr>';
    };
    body =
      '<div class="audrow" style="align-items:center;margin-bottom:10px">' +
        '<span class="pill good">' + ok.length + ' sent</span>' +
        (no.length ? '<span class="pill bad">' + no.length + ' failed</span>' : '') +
        '<span class="why" style="margin:0">Sent means the mail provider accepted it and ' +
          'gave us an id. What happens after that \u2014 a filter, a rule, a full mailbox ' +
          '\u2014 is not something this platform can see.</span>' +
      '</div>' +
      (to.length
        /* NOT `unitcfg` (§93.15). That class is `table-layout:fixed`, which
           takes every column width from the header row and makes a body-cell
           cap do nothing at all — §46's lesson, and the reason the provider's
           error sat clipped at 201px however wide it was told to be. This
           table is read-only and wants content-sized columns. */
        ? '<div class="cfg"><table class="msgtable"><thead><tr>' +
            '<th class="msgperson">Person</th><th class="msgaddr">Address</th>' +
            '<th class="cc msgstat">Status</th>' +
            '<th class="msgerr">What the provider said</th>' +
          '</tr></thead><tbody>' + no.map(row).join("") + ok.map(row).join("") +
          '</tbody></table></div>'
        : '<span class="why" style="margin:0">This message has no recipients recorded ' +
          '\u2014 nobody resolved into the audience at all.</span>');
  }
  var m = (SENTONE.data && SENTONE.data.message) || {};
  return section("", "Who got \u201c" + esc(m.subject || "this message") + "\u201d",
    "Written when it was sent, so it is what actually happened rather than what the " +
    "screen worked out beforehand.",
    body + '<div class="imp-row" style="margin-top:12px">' +
      '<button class="linkbu" data-sentclose="1">Close</button></div>');
}

function renderSentList(){
  var rows = (SENTLIST && SENTLIST.messages) || [];
  var body = !SENTLIST
    ? '<span class="why" style="margin:0">Asking…</span>'
    : SENTLIST.error
      ? '<span class="why" style="margin:0">' + esc(SENTLIST.error) + '</span>'
      : !rows.length
        ? '<span class="why" style="margin:0">Nothing has been sent from here yet.</span>'
        /* EVERY COLUMN GETS A SHARE, adding to 100 (§95.5). Under
           `table-layout:fixed` a column left to itself does NOT get the
           leftover — Chrome hands the excess to the columns that asked, so a
           118px "Last saved" came out at 243px and the Heading, which is the
           only thing telling one draft from another, was clipped to
           "Half-wri…" in a 600px panel. Percentages, because the panel's width
           is a `min()` of the window. */
        /* ── THE DELETE COLUMN IS DRAWN FOR WHOEVER MAY USE IT (§145) ──
           `mayDestroy()` is §89's rule — the Super user's alone — asked here
           rather than restated, and asked AGAIN on the server, because a
           control that is only hidden is decoration (§42, §44). A column
           nobody in this seat can act in is furniture, so it is not drawn at
           all rather than drawn empty. */
        : (function(){
            var del = mayDestroy();
            /* The widths add to 100 (§95.5): under `table-layout:fixed` a column
               left to itself does not get the leftover — Chrome hands the excess
               to the columns that asked — so adding one means re-apportioning
               rather than appending. Heading gives up the 9 the actions take. */
            return '<div class="cfg"><table><thead><tr><th style="width:' +
              (del ? '25' : '32') + '%">Heading</th>' +
              '<th style="width:16%">Sent</th>' +
              '<th style="width:23%">Who it went to</th>' +
              '<th class="cc" style="width:15%">Reached</th>' +
              '<th style="width:14%">By</th>' +
              (del ? '<th class="cc" style="width:7%"></th>' : '') +
              '</tr></thead><tbody>' +
          rows.map(function(m){
            /* A TEST COPY SAYS SO IN THE COLUMN THAT ALREADY ANSWERS "WHO GOT
               IT" (§145). Beside the heading it pushed the first column onto a
               second line, which is the one thing a setup table may never do
               (§88) — §116.4's fault exactly, a mark placed BESIDE a value
               rather than inside the block it marks. Here it costs no height.

               `audience` IS NULL ON A TEST, which `audienceWords()` renders as
               a dash; the mark is the honest answer to that column instead. */
            var test = m.kind === "test";
            /* THE ROW OPENS (§93.15). The subject is the control, because it is
               the thing somebody is already looking for when they come here to
               ask what happened to a particular message. */
            return '<tr' + (SENTONE && SENTONE.id === m.id ? ' class="tk-open"' : '') + '>' +
              '<td><button class="linkbu" data-sentone="' + esc(String(m.id)) + '"><b>' +
                esc(m.subject) + '</b></button></td>' +
              '<td>' + esc(String(m.sent_at || "").slice(0, 16).replace("T", " ")) + '</td>' +
              '<td>' + (test ? '<span class="pill">Test copy</span>'
                             : esc(audienceWords(m.audience))) + '</td>' +
              '<td class="cc">' + (m.sent || 0) + ' of ' + (m.total || 0) +
                (m.failed ? ' <span class="pill bad">' + m.failed + ' failed</span>' : '') +
                '</td>' +
              '<td>' + esc(m.by_name || "") + '</td>' +
              /* ONLY A TEST COPY CARRIES IT (Islam's B). A real send has no
                 control here rather than a disabled one: a dead control in a
                 row is furniture, and the refusal it would explain is one the
                 server gives anyway. */
              (del ? '<td class="cc">' +
                 (test ? '<button class="linkbu danger" data-sentdel="' +
                           esc(String(m.id)) + '">Delete</button>' : '') +
                 '</td>' : '') +
              '</tr>';
          }).join("") + '</tbody></table></div>';
          })();
  return section("", "What has been sent", null, body);
}

/* ── THE PREVIEW IS THE EDITOR (§76.3) ────────────────────────────────────
   The heading and the body are contenteditable, so the message is typed into
   the design rather than into boxes beside it.

   IT IS REDRAWN ONLY BY THINGS THAT ARE NOT THE TYPING. Rewriting innerHTML on
   every keystroke would destroy the node the caret is in — §30.1's family, and
   the reason `typing never repaints` is a rule in this project. So typing
   writes into SENDMSG and touches nothing; the branding, the button and
   opening a draft redraw.

   A STYLE BLOCK GOES INTO THE SHADOW ROOT, not the page: the placeholder and
   the focus ring belong to the editor, and the email's own markup must not
   carry them — what is sent has no editor in it. */
var MSGPREV_STYLE =
  '<style>' +
  '[data-mail-title],[data-mail-body]{outline:none;border-radius:4px;' +
    'transition:box-shadow .12s}' +
  '[data-mail-title]:focus,[data-mail-body]:focus{box-shadow:0 0 0 2px #B8862B66}' +
  '[data-mail-title]:hover,[data-mail-body]:hover{box-shadow:0 0 0 2px #B8862B22}' +
  /* A placeholder rather than sample words: sample words typed over become the
     message, and somebody would send "Your message will appear here." */
  '[data-mail-title]:empty::before{content:attr(data-ph);color:#9AA3B2}' +
  '[data-mail-body].blank::before{content:attr(data-ph);color:#9AA3B2;' +
    'font:400 15px/1.6 Helvetica,Arial,sans-serif}' +
  '</style>';

function paintMsgPreview(){
  var host = document.getElementById("msgprev");
  if (!host) return;
  var root = host.shadowRoot;
  if (!root) {
    if (!host.attachShadow) { host.textContent = "This browser cannot draw the preview."; return; }
    root = host.attachShadow({ mode: "open" });
  }
  var st = sendmsg(), sh = commsShape();
  root.innerHTML = MSGPREV_STYLE + MAIL.html({
    org: sh.org, accent: sh.accent, panel: sh.panel, footer: sh.footer, eyebrow: sh.eyebrow,
    title: st.subject,
    preheader: st.subject,
    body: st.body,
    /* A NAME, so the preview shows the real thing rather than the region the
       server fills — the line under the card is what says it is a sample. */
    greeting: st.greet == null ? null : { word: st.greet, name: greetSample() },
    cta: (st.ctaLabel && st.ctaHref) ? { label: st.ctaLabel, href: st.ctaHref } : null
  });
  var t = root.querySelector("[data-mail-title]"),
      b = root.querySelector("[data-mail-body]");
  if (t) {
    t.setAttribute("contenteditable", "true");
    t.setAttribute("data-ph", "Write the heading\u2026");
  }
  if (b) {
    b.setAttribute("contenteditable", "true");
    b.setAttribute("data-ph", "Write the message\u2026");
    if (!st.body) b.classList.add("blank");
  }
  wireMsgEditor(root);
}

/* Reading it back. `innerText` rather than the markup, because the browser is
   free to produce <div>, <br> or a bare text node depending on how somebody
   pressed Enter — and what the message IS, is its words and where the blank
   lines are. MAIL.html turns those back into paragraphs when it sends. */
function wireMsgEditor(root){
  var st = sendmsg();
  var t = root.querySelector("[data-mail-title]"),
      b = root.querySelector("[data-mail-body]");
  if (t) t.addEventListener("input", function(){
    st.subject = t.innerText.replace(/\s+$/, "");
    sendmsgTouched();
  });
  if (b) b.addEventListener("input", function(){
    st.body = b.innerText.replace(/\s+$/, "");
    b.classList.toggle("blank", !st.body);
    sendmsgTouched();
  });
  /* PLAIN TEXT ONLY on paste. A message pasted out of a browser arrives
     carrying its own fonts, colours and links, and none of that survives being
     read back as innerText — so it would look right while being typed and
     wrong when it arrived. */
  [t, b].forEach(function(el){
    if (!el) return;
    el.addEventListener("paste", function(ev){
      ev.preventDefault();
      var txt = (ev.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, txt);
    });
  });
}

/* ══ TABLEKIT — SEARCH AND SORT, ONCE (spec 012 §3) ═══════════════════════
   Seven tables need the same two controls. Seven copies is seven places for
   the next fault to hide, and this project has already paid for that three
   times in CSS (§51.5, §53.6) and twice in JS (§56.7).

   THE CLASSES ARE `tk-` PREFIXED, from the first line rather than tidied later
   (Constitution XIV): `pname` became the pillar rail's rules on a register cell
   because it was one plain word (§73.1), and a component shared by seven tables
   is exactly where that happens next.

   IT FILTERS AND SORTS THE DOM, NOT THE DATA. Search hides rows in place and
   never repaints (Constitution XV) — a repaint would replace the input being
   typed into. Sort reorders the rendered rows and writes nothing: on a table
   whose order is a SETTING that would be indistinguishable from rearranging it,
   which is why those two tables do not sort at all (spec §6.2). */
var TKSORT = {};    /* table id -> {col, dir} — the view's order, never the data's */

/* The bar above a table. `id` names the table for the sort state and nothing
   else; `filters` are [{k, label, title}] and are the table's own question. */
/* THE BAR APPEARS WHEN THERE IS SOMETHING TO SEARCH. Below nine rows a search
   box hides nothing and costs a header — Companies has two and Figure sets has
   one. `rows` is the count the caller already has; a table that omits it always
   gets a bar, which is the register's case and the safe default. One number, so
   a table crosses the threshold as the tenant grows rather than when somebody
   remembers the page (spec §2.2). */
var TK_SEARCH_FROM = 9;
/* ── THE SEARCH BOX ON ITS OWN (§116) ─────────────────────────────────
   The register's header carries the search and nothing else off this bar — no
   filter chips and no row count, both removed at Islam's word — so the field
   is its own function and `tkBar` calls it. One definition, or the register's
   box and every other table's would drift apart in placeholder, in type and in
   the attribute the filter is keyed on (§53.5). */
function tkSearchOnly(id, placeholder){
  return '<input class="fld tk-search" data-tksearch="' + esc(id) + '" type="search" ' +
    'placeholder="' + esc(placeholder) + '" autocomplete="off" ' +
    'value="' + esc(TKQ[id] || "") + '">';
}
/* ── THE SEARCH GOES UP, THE FILTERS AND THE COUNT GO (§135.1) ─────
   Islam, asked whether the quick filters and the row count move up with the
   search or go: *"drop like the way register quick filters were dropped."*
   §116 dropped that pair from the register for a reason that is true of all
   six tables — the filters narrowed to a state the table already prints in a
   column of its own, and the count said how big a list you are looking at.

   NOTHING IS HIDDEN BY IT, and that was checked rather than assumed: every row
   carries `data-tkrow="active|retired"` and every one is drawn — the chip
   narrowed the view, it never revealed rows the table was holding back. So a
   retired unit is still on the page after this, where a "show retired" toggle
   would have taken it away.

   The bar is the page's TOOLS slot now, so it renders on the pinned line
   beside the title rather than above the table (§135). */
function tkBar(id, opts){
  opts = opts || {};
  if (typeof opts.rows === "number" && opts.rows < TK_SEARCH_FROM) return "";
  var bar = '<div class="tk-bar" data-tkbar="' + esc(id) + '">' +
    tkSearchOnly(id, opts.placeholder || "Search…") + '</div>';
  if (PAGE_TITLE != null) { PAGE_TOOLS += bar; return ""; }
  return bar;
}
/* ── THE ACTIONS CELL, FOR ANY TABLE (§85) ───────────────────────────
   Open, it is Save and Cancel; closed, it is a pen and whatever else the row
   can do. The register puts Edit in its ⋮ because it has five other acts to
   put there; the other six have one or two, and a menu holding one item is a
   door behind a door (§32). So the pen is inline on those and the outcome is
   the same — Islam asked for "work on the row inline and then a small save
   button", and the ⋮ was how he got there rather than the point.

   `extra` is the row's own controls (Retire, Remove), drawn only while the row
   is CLOSED: offering Remove beside an unsaved edit is three unrelated outcomes
   in one 83px column, which is the argument the register's own cell makes. */
function rowActions(table, key, ed, extra){
  if (ed) {
    return '<td class="cc tk-editcell">' +
      '<button class="linkbu tk-save" data-rowsave="' + esc(table + "|" + key) + '">Save</button>' +
      '<button class="linkbu tk-cancel" data-rowcancel="1">Cancel</button></td>';
  }
  return '<td class="cc">' +
    '<button class="ico tk-pen" data-rowedit="' + esc(table + "|" + key) + '" ' +
      'title="Edit this row" aria-label="Edit this row">' + ICO_EDIT + '</button>' +
    (extra || '') + '</td>';
}

/* ── THE HEADER ROW, FOR ANY TABLE (§84) ──────────────────────────────
   Extracted from the register, where it was a local closure with "people"
   written into it three times. Six more tables need exactly this and none of
   them needs a second copy — a sort arrow drawn slightly differently on the
   seventh table is how a standard stops being one.

   `sortable:false` is the column's own answer (the index and the actions
   column), and a whole table opts out by never asking for a head at all.
   The column INDEX is counted here rather than passed, because a caller
   counting its own columns gets it wrong the first time a column becomes
   conditional — which every one of these tables has. */
/* `allow:false` TURNS THE WHOLE HEAD OFF (§261). A sorted table cannot be
   arranged: `tkSort` REORDERS the rows in the DOM, so a drop between two rows
   you can see would commit whatever order the sort had put them in — silently,
   into the navigation. The index still counts through the disabled columns, or
   turning sorting back on would sort by the wrong one. */
function tkHead(id, allow){
  var n = 0;
  return function(label, cls, sortable){
    var i = n++;
    if (allow === false) sortable = false;
    if (!label) return '<th' + (cls ? ' class="' + cls + '"' : '') + '></th>';
    if (sortable === false)
      return '<th' + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</th>';
    var st = TKSORT[id];
    var on = st && st.col === i;
    return '<th' + (cls ? ' class="' + cls + ' tk-sortable' : ' class="tk-sortable') +
      (on ? (st.dir === 1 ? ' tk-asc' : ' tk-desc') : '') + '"' +
      ' data-tksort="' + esc(id) + '|' + i + '" tabindex="0" role="button"' +
      ' title="Sort by ' + esc(String(label).replace(/<[^>]+>/g, "")) + '">' +
      label + '<i class="tk-arrow"></i></th>';
  };
}

/* WHAT IS TYPED AND WHICH CHIP IS LIT SURVIVE A REPAINT. Adding a row repaints
   (§75), and a search that emptied itself when you added somebody would be a
   filter you have to retype every time you use the page. */
var TKQ = {};
