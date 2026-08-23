/* ── CONFIGURATION SCREENS ───────────────────────────────────────────────
   Labels · Roles & access · and the factor editor that extends Weighting.
   ─────────────────────────────────────────────────────────────────────── */

function L(key, scope){
  var e = LABELS.entries.filter(function(x){ return x.key === key; })[0];
  if (!e) return key;
  return (scope === "group" ? e.group : e.bu) || e.internal;
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

  return section("", "Labels", null,
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
  var opts = ["view","edit"].map(function(o){
    var on = o === v;
    return '<button type="button" class="stbtn' + (on ? " on " + o : "") + '" data-ac="' +
      roleKey + '|' + areaKey + '|' + (on ? "none" : o) + '" title="' +
      (on ? "Turn off — leaves no access" : o === "view" ? "May read" : "May read and change") +
      '" aria-label="' + (on ? "turn off " + o : o) + '" aria-pressed="' + on + '">' +
      (o === "view" ? ICON_EYE : ICON_PEN) + '</button>';
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
  var editable = grant("c_access") === "edit";

  /* Whether an area can come up at all for a role. Only the own/other pair
     ever collapses, and only upwards: somebody who owns everything has no
     "other", and somebody who owns no unit has no "own". Returning a REASON
     rather than a boolean, because the cell shows it on hover. */
  function notApplicable(roleKey, areaKey){
    var ownsAll = roleKey === "super" || roleKey === "gceo";
    if (ownsAll && (areaKey === "a_unit_other" || areaKey === "a_fn_other")) {
      return "Every unit and function is theirs, so there is no “other”.";
    }
    if (roleKey === "fnhead" && areaKey === "a_unit_own") {
      return "A function head holds no business unit.";
    }
    if (roleKey === "cceo" && areaKey === "a_fn_own") {
      return "A company CEO holds no supporting function.";
    }
    return null;
  }

  /* THE HEADER SAYS WHAT THE COLUMN IS; HOVER SAYS WHAT IS IN IT
     (Islam, 2026-08-22: "remove all the descriptions from the headers and just
     make it appear on hovering"). The notes are lists — "Open, chase and
     close · Import · Archived plans · Focus measures" — and seven of them
     stacked under seven labels made the HEAD of a 49-cell table taller than
     its body. The same answer the role column already reached in §37: the
     sentence is on hover, and the column keeps its name. */
  var head = '<tr><th style="width:19%">Role</th>' + AREAS.map(function(a){
    return '<th class="ac" title="' + esc(a.note) + '">' + esc(a.label) + '</th>';
  }).join("") + '</tr>';

  var body = ROLES.map(function(r){
    var n = PEOPLE.filter(function(p){ return personRoleKeys(p).indexOf(r.key) > -1; }).length;
    /* Two lines, never more. The role's description is a sentence, and a
       sentence in a 19% column wraps to eight lines and makes every row of a
       49-cell table a hundred pixels tall — the exact fault this page was
       rebuilt to remove. It is on hover instead. */
    return '<tr><td class="rolecell" title="' + esc(r.note) + '"><b>' + esc(r.name) + '</b>' +
        '<span class="why">' +
        (n ? plural(n, "person").replace("persons", "people") : "nobody yet") +
        '</span></td>' +
      AREAS.map(function(a){
        return stateCell(r.key, a.key, editable, notApplicable(r.key, a.key));
      }).join("") + '</tr>';
  }).join("");

  return section("", "Who may see what",
      "Seven roles, and the kinds of page each may reach. Edit includes view. " +
      "Change any cell and the navigation above re-renders immediately for whoever is being viewed as.",
      '<div class="cfg acgrid"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="chart-legend" style="margin-top:12px">' +
        '<span><i class="st st-view">' + ICON_EYE + '</i> may read</span>' +
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
  var editable = grant("c_bands") === "edit" && EDITING.bands;
  var b = BANDS.bands;

  var rows = b.map(function(x, i){
    var top = i === 0 ? "and above" : "to " + (b[i-1].floor - 1) + "%";
    return '<tr><td><span class="swatch" style="background:var(--' + x.key + ')"></span>' +
      (editable
        ? '<input class="blabel" data-b="' + i + '" value="' + esc(x.label) + '" aria-label="Label for band ' + (i+1) + '" />'
        : '<b>' + esc(x.label) + '</b>') + '</td>' +
      '<td class="cc">' + (editable && i < b.length - 1
        ? '<input class="bfloor" data-b="' + i + '" value="' + x.floor + '" aria-label="Floor for ' + esc(x.label) + '" />'
        : '<span class="mono">' + x.floor + '</span>') + '</td>' +
      '<td class="cc"><span class="mono">' + x.floor + '% ' + top + '</span></td>' +
      '<td><span class="pill ' + x.key + '">' + esc(x.label) + '</span></td></tr>';
  }).join("");

  /* Floors must descend, or a figure falls into two bands at once. */
  var ok = true;
  for (var i = 1; i < b.length; i++) if (b[i].floor >= b[i-1].floor) ok = false;

  return section("", "Scoring bands",
      "The lowest band has no floor to set &mdash; it catches everything beneath the band above it.",
      '<div class="cfg-bar plain"><span class="cfg-lab">' + b.length + ' bands</span>' +
        (grant("c_bands") === "edit"
          ? '<button class="editbtn" data-edit="bands">' + (EDITING.bands ? "Done" : "Edit") + '</button>'
          : '') + '</div>' +
      '<div class="cfg"><table><thead><tr><th style="width:34%">Band</th>' +
        '<th class="cc" style="width:16%">Floor</th><th class="cc" style="width:26%">Range</th>' +
        '<th style="width:24%">Appears as</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (ok ? '' : '<div class="note bad-note"><b>Floors must descend.</b> Two bands overlap, so a figure would fall into both. Saving is blocked until the order is fixed.</div>') +
      '<div class="note"><b>70 and 50 match the platform\'s existing thresholds</b> in <code>src/lib/scoring.ts</code>, so the strategy layer and the functional layer never disagree about a colour. 85 is the added top edge. <i>Reconcile against the codebase &mdash; this is carried from the handoff, not verified.</i></div>' +
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
function cfgHead(title, chips, editKey, mayEdit, clearScope, labels, extra){
  var editing = EDITING[editKey];
  var open = CLEARMENU === editKey;
  return '<div class="phead2"><h2 class="secttl">' + title + '</h2>' +
    '<div class="hright">' +
      chips.map(function(x){ return '<span class="chip">' + x + '</span>'; }).join("") +
      (extra || "") +
      (mayEdit
        ? '<span class="iconwrap">' +
            '<button class="ico' + (editing ? " on" : "") + '" data-edit="' + editKey +
              '" title="' + (editing ? "Done" : "Edit") + '" aria-label="' +
              (editing ? "Done editing" : "Edit this page") + '">' +
              (editing ? ICO_DONE : ICO_EDIT) + '</button>' +
            /* No clear scope, no clear button. Companies and People have
               nothing to clear — a page's rows are retired one at a time — and
               Companies was rendering the control anyway: it shares the
               "units" edit key, so opening the menu there read labels[0] off
               an argument nobody had passed and threw. A control that cannot
               work should not be drawn. */
            (!clearScope ? '' :
            '<button class="ico' + (open ? " on" : "") + '" data-clearmenu="' + editKey +
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
        : '') +
    '</div></div>';
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
  var row = function(p){
    return '<button class="pickrow" data-name="' + esc(p.name.toLowerCase()) + '" ' +
      'data-pick-set="' + esc(id + '|' + p.key) + '">' +
      '<b>' + esc(p.name) + '</b>' +
      (p.title ? '<span class="why" style="margin:0">' + esc(p.title) + '</span>' : '') +
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
      group(String(where).indexOf("fn:") === 0 ? "In this function" : "In this unit", pool.here) +
      group("Everyone else", pool.rest) +
      '<div class="pickempty" hidden>No name matches. Add them below.</div>' +
    '</div>' +
    '<div class="pickfoot">' +
      '<button class="linkbu" data-pick-new="' + esc(id) + '" hidden></button>' +
      '<span class="why pickhint" style="margin:0">Type a name to add someone new</span>' +
      (current ? '<button class="linkbu" data-pick-clear="' + esc(id + '|' + current) +
                 '">Unassign</button>' : '') +
      '<button class="linkbu" data-pick-cancel="1">Cancel</button>' +
    '</div></div>';
}

function renderUnits(){
  var editable = grant("c_units") === "edit" && EDITING.units;
  var live = activeUnits().length;

  var rows = UNIT_KEYS.map(function(k, i){
    var u = UNITS[k];
    var wrow = GROUP.weighting.units.filter(function(r){ return r.key === k; })[0];
    var roles = UNIT_ROLES[k] || {};
    /* Was a <select> limited to people already attached to this unit, which
       meant a new unit could never be given its first head. It is the shared
       picker now — search, the unit's own people first, and Add new (§35). */
    var pick = function(role, sel){ return assignPicker(k, role === "head" ? "owner" : "custodian", sel, editable); };
    return '<tr' + (u.active ? '' : ' class="retired"') + '>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(u.name) + '" data-uname="' + k + '">'
        : '<b>' + esc(u.name) + '</b>') +
        '<span class="why mono">key ' + k + '</span></td>' +
      /* Short name for the navigation only \u2014 everywhere else keeps the full
         one. Empty means "use the full name", so nothing has to be filled in. */
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(u.navName || "") + '" data-unav="' + k +
          '" placeholder="' + esc(u.name) + '">'
        : (u.navName ? '<span class="val">' + esc(u.navName) + '</span>'
                     : '<span class="why" style="margin:0">' + esc(u.name) + '</span>')) + '</td>' +
      '<td class="cc">' + (editable
        ? '<input class="fld mono" value="' + esc(u.codePrefix) + '" data-upx="' + k + '">'
        : '<span class="mono">' + esc(u.codePrefix) + '</span>') + '</td>' +
      '<td class="cc"><span class="mono">' + u.items.length + '</span></td>' +
      '<td class="cc"><span class="mono">' + u.keyObjectives.length + '</span></td>' +
      '<td class="cc"><span class="mono">' + (wrow ? u.weight + '%' : '&mdash;') + '</span></td>' +
      /* A unit belongs to a company or is its own — never neither. "Its own"
         is an explicit choice rather than an empty cell, because an empty cell
         reads as somebody having forgotten and standing alone is a decision. */
      '<td>' + (editable
        ? '<select class="fld" data-ucomp="' + k + '">' +
            /* A retired company is nowhere a unit can be MOVED to, but a unit
               already in one still shows it — hiding it would silently read
               as "its own company" (§49.3). */
            COMPANY_KEYS.filter(function(ck){ return companyActive(ck) || u.company === ck; })
              .map(function(ck){
              return '<option value="' + ck + '"' + (u.company === ck ? " selected" : "") + '>' +
                esc(COMPANIES[ck].name) + (companyActive(ck) ? '' : ' (retired)') + '</option>';
            }).join("") +
            '<option value=""' + (u.company ? "" : " selected") + '>\u2014 its own company \u2014</option>' +
          '</select>'
        : (u.company ? '<span class="val">' + esc(COMPANIES[u.company].name) + '</span>'
                     : '<span class="why" style="margin:0">its own company</span>')) + '</td>' +
      '<td class="cc">' + pick("head", roles.head) + '</td>' +
      '<td class="cc">' + pick("custodian", roles.custodian) + '</td>' +
      '<td class="cc">' + (editable
        ? '<div class="rowacts">' +
            '<button class="rmbtn' + (u.active ? '' : ' on') + '" data-uact="' + k + '">' +
              (u.active ? "Retire" : "Restore") + '</button>' +
            (CLEARING === k + "|plan"
              ? '<span class="confirm"><b>Clear the whole plan?</b>' +
                  '<span class="why" style="margin:0">Pillars, measures, tactics, objectives, SWOT and the foundation text. ' +
                    'Kept as an archive dated today and restorable from <b>Archived plans</b>.</span>' +
                  '<button class="rmbtn" data-clearyes="' + k + '|plan">Yes, clear the plan</button>' +
                  '<button class="linkbu" data-clearno="1">Cancel</button></span>'
              : CLEARING === k + "|nums"
              ? '<span class="confirm"><b>Clear the reported progress?</b>' +
                  '<span class="why" style="margin:0">Actuals and progress only. The plan stands.</span>' +
                  '<button class="rmbtn" data-clearyes="' + k + '|nums">Yes, clear the progress</button>' +
                  '<button class="linkbu" data-clearno="1">Cancel</button></span>'
              : '<button class="linkbu" data-clear="' + k + '|nums">Clear progress</button>' +
                '<button class="linkbu" data-clear="' + k + '|plan">Clear plan</button>') +
          '</div>'
        : '<span class="pill ' + (u.active ? "good" : "none") + '">' + (u.active ? "Active" : "Retired") + '</span>') +
      '</td></tr>';
  }).join("");

  return cfgHead("Business units",
      ['<span class="pill kind">SMO</span>',
       UNIT_KEYS.length + ' units',
       live + ' active'].concat(
         live < UNIT_KEYS.length ? [(UNIT_KEYS.length - live) + ' retired'] : []),
      "units", grant("c_units") === "edit", "all",
      ["Clear all progress", "Clear all plans"]) +

    section("", "Business units", null,
      '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th><th style="width:18%">Unit</th>' +
        '<th style="width:14%">Shown in the nav</th>' +
        '<th class="cc" style="width:8%">Code</th>' +
        '<th class="cc" style="width:7%">Pillars</th><th class="cc" style="width:9%">Objectives</th>' +
        '<th class="cc" style="width:7%">Weight</th>' +
        '<th style="width:12%">Company</th>' +
        '<th class="cc" style="width:14%">BU head</th><th class="cc" style="width:15%">Strategy custodian</th>' +
        '<th class="cc" style="width:9%">Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (editable ? '<div class="addrow"><button class="editbtn" id="addunit">+ Add a business unit</button></div>' : '')) +

    renderUnitMarks(editable);
}

/* ── The units' own marks (§52.9) ────────────────────────────────────
   Its OWN SECTION rather than a twelfth column. The units table already
   carries eleven, its widths are declared on the header row and sum to
   the whole, and a mark needs a preview and two controls in one cell —
   three things a 7% column cannot hold. A section on the same page keeps
   one question in one place, which is what §46 settled Setup pages are
   for.

   Shown to everyone who can reach the page and editable only by the SMO,
   the same gate as the table above: `logo` is in UNIT_CONFIG, so the
   server classifies a change to it as the unit's settings and refuses it
   from anybody else. A control that changes nothing is worse than no
   control (§42), so it is not drawn when it cannot be used. */
function renderUnitMarks(editable){
  var rows = UNIT_KEYS.map(function(k, i){
    var u = UNITS[k], src = unitLogo(u);
    return '<tr' + (u.active ? '' : ' class="retired"') + '>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td><b>' + esc(u.name) + '</b>' +
        (u.company ? '<span class="why">' + esc(COMPANIES[u.company].name) + '</span>' : '') + '</td>' +
      '<td>' + (src
        ? '<span class="umarkbox"><img class="umarkimg" src="' + esc(src) + '" alt="' + esc(u.name) + '"></span>'
        : '<span class="why" style="margin:0">no mark &mdash; the unit\u2019s name is used</span>') + '</td>' +
      '<td class="cc">' + (editable
        ? '<div class="rowacts">' +
            '<label class="linkbu umarkpick">' + (src ? "Replace" : "Upload") +
              '<input type="file" accept="image/png" data-ulogo="' + k + '" hidden></label>' +
            (src ? '<button class="linkbu" data-ulogoclear="' + k + '">Remove</button>' : '') +
          '</div>'
        : '<span class="why" style="margin:0">SMO</span>') + '</td></tr>';
  }).join("");

  return section("", "Unit marks", null,
    '<p class="why" style="margin:0 0 12px">Shown on the unit\u2019s review deck &mdash; large on the cover, ' +
      'small in the footer of every other slide. A unit with no mark shows its name, which is what every ' +
      'slide does today, so a missing one costs nothing. ' +
      '<b>PNG only</b>, and keep the background transparent: a mark with white behind it paints a box ' +
      'around itself on a dark slide.</p>' +
    '<div class="cfg"><table><thead><tr>' +
      '<th class="idx" style="width:38px">#</th><th style="width:26%">Unit</th>' +
      '<th style="width:44%">Mark</th><th class="cc" style="width:22%"></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    (LOGO_NOTE ? '<p class="why logonote">' + esc(LOGO_NOTE) + '</p>' : ''));
}


/* ── Setup · Focus measures ─────────────────────────────────────────
   Marking is a configuration act, not something to be done while reading a
   unit's page \u2014 a marking mode sitting in a reading view invites a stray click
   on a decision that carries money.

   Everything measurable in the unit is offered: its Key Objectives first, then
   each pillar's key measures, each with its target so the choice is made
   against the number rather than the name alone. */
var FSET = { unit:"mobile" };

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
var IMP = { unit:"mobile", kind:"plan", text:"", diff:null, summary:null,
            read:"", check:null, done:null };

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
function renderBranding(){
  var mayEdit = grant("c_brand") === "edit";
  var b = branding(), checks = brandChecks(), t = brandTokens();
  var set = !!(b.accent || b.bar || b.palette || b.font);

  function swatch(key, label, value, note){
    var shown = value || "";
    return '<tr><td><b>' + esc(label) + '</b><span class="why">' + esc(note) + '</span></td>' +
      '<td class="cc">' + (mayEdit
        ? '<span class="brandpick">' +
            '<input type="color" class="brandcolor" data-brand="' + key + '" value="' +
              esc(shown || "#4F46E5") + '" aria-label="' + esc(label) + '">' +
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

  return cfgHead("Branding",
      ['<span class="pill kind">SMO</span>',
       set ? 'set for this tenant' : 'using the shipped palette'],
      "brand", mayEdit, null) +

    section("", "The tenant’s colours",
      "Two colours, and the platform works out the rest. They apply to everyone here — " +
      "unlike the switches in the top bar, which are your own screen and nobody else’s.",
      '<div class="cfg"><table><thead><tr><th style="width:34%">What it colours</th>' +
      '<th class="cc">Colour</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (mayEdit && set ? '<div style="margin-top:12px"><button class="linkbu" data-brandreset="1">' +
                        'Reset to the shipped palette</button></div>' : '')) +

    (derived ? section("", "What follows from them", null, derived) : "") +

    (checkRows ? section("", "Is it readable?",
      "Run on every derived pair, every time you change one. A brand colour that cannot be read " +
      "is worth knowing about here rather than in a screenshot three weeks from now.",
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
  if (!SAIDWHERE) return "";
  var said = SAIDWHERE[p.key];
  if (!said || said === personAt(p)) return "";
  return '<span class="why saidwhere">They said ' + esc(roleWhereLabel(said)) +
    (editable ? ' <button class="linkbu" data-usesaid="' + esc(p.key) + '">Use it</button>' : '') +
    '</span>';
}
/* And for the same reason, what each person said about where they work (§56):
   a declaration lives outside the state graph, so the register asks for it
   separately and simply has nothing to show from a file. */
var SAIDWHERE = null;  /* key -> the `at` they picked, once asked */

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
  { k:"empid",    label:"Emp. ID", off:true },
  { k:"title",    label:"Job title" },
  { k:"mainbu",   label:"Official BU" },
  { k:"bu",       label:"BU" },
  { k:"contact",  label:"Contact",  off:true },
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

function renderPeople(){
  var mayEdit = grant("c_people") === "edit";
  var editable = mayEdit && EDITING.people;
  var live = typeof SYNC !== "undefined" && SYNC.isLive() && hasRole("super");
  var retired = PEOPLE.filter(function(p){ return !personActive(p); }).length;
  var noPw = live && PWSTATES
    ? PEOPLE.filter(function(p){ return personActive(p) && PWSTATES[p.key] === "none"; }).length
    : 0;

  /* Lifted out of this function 2026-08-23: restoring a person names the
     places their roles were held, and a second copy of this in the shell is
     exactly the drift lib/rules.js exists to prevent. It is roleWhereLabel()
     in config-data.js now, with the reasoning that belongs to it. */
  var whereLabel = roleWhereLabel;

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

  function roleCell(p){
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
          return '<span class="rolechip" title="' + esc(roleName(r.role)) + ' \u00b7 ' + esc(at) + '">' +
            '<b>' + esc(roleName(r.role)) + '</b>' +
            (elsewhere ? '<span class="rolewhere">' + esc(at) + '</span>' : '') +
            (editable
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
      : '<span class="pill none">No role</span>';
    if (!editable) return held;
    var addRole = ADDROLE === p.key;
    return held +
      (addRole
        ? '<span class="roleadd">' +
            '<select class="fld" data-prole-pick="' + p.key + '">' +
              ROLES.map(function(r){
                return '<option value="' + r.key + '"' + (r.key === ADDROLE_KIND ? " selected" : "") +
                  '>' + esc(r.name) + '</option>';
              }).join("") + '</select>' +
            '<select class="fld" data-prole-where="' + p.key + '">' +
              roleWheres(ADDROLE_KIND).map(function(w){
                return '<option value="' + esc(w.v) + '">' + esc(w.label) + '</option>';
              }).join("") + '</select>' +
            '<button class="linkbu" data-prole-add="' + p.key + '">Give</button>' +
            '<button class="linkbu" data-prole-cancel="1">Cancel</button>' +
          '</span>'
        : '<button class="linkbu" data-prole-open="' + p.key + '">+ role</button>');
  }

  /* Read-only, and spelled out rather than leaning on `"" || dash` — an
     expression whose falsiness carries the meaning is one refactor away from
     being wrong (CLAUDE.md: explicit over clever). */
  function contactCell(p){
    var bits = [];
    if (p.email) bits.push('<span class="val">' + esc(p.email) + '</span>');
    if (p.phone) bits.push('<span class="mono">' + esc(p.phone) + '</span>');
    if (!bits.length) return '<span class="why" style="margin:0">&mdash;</span>';
    return bits.join("");
  }

  /* STATUS ONLY, AND SQUEEZED (Islam, 2026-08-22). The action left this cell
     for the row's kebab; what is left is one word in one pill, so the column
     is 76px instead of 150. "Temporary" becomes "Temp" for the same reason —
     three states that have to be told apart at a glance, not read. */
  function pwCell(p){
    if (!live) return '';
    if (!personActive(p)) {
      return '<td class="cc"><span class="why" style="margin:0">&mdash;</span></td>';
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
    if (live && personActive(p)) {
      acts.push('<button data-setpw="' + p.key + '">' +
        (st === "none" || !st ? "Set a password" : "Reset password") + '</button>');
    }
    if (mayEdit) {
      acts.push('<button data-pedit="' + p.key + '">Edit details</button>');
    }
    if (personActive(p)) {
      acts.push('<button data-as="' + p.key + '">View the platform as them</button>');
    }
    if (mayEdit) {
      acts.push('<hr>');
      acts.push('<button class="danger" data-pact="' + p.key + '">' +
        (personActive(p) ? "Retire this person" : "Restore this person") + '</button>');
    }
    if (!acts.length) return '<td class="cc"></td>';
    return '<td class="cc kebcell">' +
      '<button class="kebab' + (open ? " open" : "") + '" data-pmenu="' + p.key + '" ' +
      'aria-haspopup="true" aria-expanded="' + open + '" ' +
      'title="Actions" aria-label="Actions for ' + esc(p.name) + '">' +
      '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<circle cx="10" cy="4.6" r="1.5"/><circle cx="10" cy="10" r="1.5"/>' +
      '<circle cx="10" cy="15.4" r="1.5"/></svg></button>' +
      (open ? '<div class="kmenu">' + acts.join("") + '</div>' : '') + '</td>';
  }

  /* THREE COLUMNS THAT WRAP, ONE THAT CLIPS, AND THE ACTIONS AT THE END
     (Islam, 2026-08-22). Name, job title and contact are given room and allowed
     to wrap — they are what you scan the register FOR. Roles clip to their
     column, because a person with three of them was making a 90px row for
     information the hover can carry.

     The key is gone from under the name. It is the username, it is generated
     from the name, and it was costing 31 rows a line each to say what the
     sign-in page already knows. It is still on the row's hover. */
  var rows = PEOPLE.map(function(p, i){
    var home = belongsLabel(p);
    var drift = mainbuDrift(p);
    return '<tr' + (personActive(p) ? '' : ' class="retired"') + '>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td title="' + esc(p.key) + '">' + (editable
        ? '<input class="fld" value="' + esc(p.name) + '" data-pname="' + p.key + '">'
        : '<b>' + esc(p.name) + '</b>') + '</td>' +
      /* The employee number. Off by default — it is the client's own
         identifier and matters when a file is being reconciled, not when
         somebody is looking up who runs Retail. */
      (showCol("empid") ? '<td>' + (editable
        ? '<input class="fld" value="' + esc(p.empId || "") + '" data-pempid="' + p.key +
          '" placeholder="Emp. ID">'
        : (p.empId ? '<span class="mono">' + esc(p.empId) + '</span>'
                   : '<span class="why" style="margin:0">&mdash;</span>')) + '</td>' : '') +
      /* The job title is information and nothing else. It sits in the register
         because "who is Mennah" is a fair question; it is never read when
         deciding what anyone may see (§33). */
      (showCol("title") ? '<td>' + (editable
        ? '<input class="fld" value="' + esc(p.title || "") + '" data-ptitle="' + p.key +
          '" placeholder="Job title">'
        : (p.title ? '<span class="val">' + esc(p.title) + '</span>'
                   : '<span class="why" style="margin:0">not given</span>')) + '</td>' : '') +
      /* MAIN BU IS THE CLIENT'S WORD, BU IS OURS (§54.1). The first is typed
         (or arrives in the file) and is never interpreted; the second is read
         through the BU list and is what decides which pages open.

         WHERE THEY DISAGREE, THE CELL SAYS SO rather than either being
         quietly corrected. The list can be re-pointed after a file was loaded
         and a person can be moved by hand afterwards — neither is a fault, and
         a mapping that silently moved thirty people the next time a row
         changed would be the worst kind of helpful. */
      (showCol("mainbu") ? '<td>' + (p.mainbu
        ? '<span class="val">' + esc(p.mainbu) + '</span>' +
          (mainbuBy(p.mainbu) ? '' : '<span class="why">not on the Official BU list</span>')
        : '<span class="why" style="margin:0">&mdash;</span>') + '</td>' : '') +
      (showCol("bu") ? '<td>' + (home
        ? '<span class="uchip">' + esc(home) + '</span>' + (drift
            ? '<span class="why" title="' + esc(p.mainbu) + ' points at ' +
              esc(whereLabel(drift)) + ' on the Official BU list">the list says ' +
              esc(whereLabel(drift)) + '</span>'
            : '')
        : (drift
            ? '<span class="why" style="margin:0">&mdash; the list says ' +
              esc(whereLabel(drift)) + '</span>'
            : '<span class="why" style="margin:0">&mdash;</span>')) +
        saidWhereNote(p, editable) + '</td>' : '') +
      /* Email above the number. Both are how you reach somebody, and giving
         each a column of its own made an eleven-column register — the pair is
         one answer to one question. */
      (showCol("contact") ? '<td>' + (editable
        ? '<input class="fld" value="' + esc(p.email || "") + '" data-pemail="' + p.key +
          '" placeholder="Email"><input class="fld" value="' + esc(p.phone || "") +
          '" data-pphone="' + p.key + '" placeholder="Mobile">'
        : contactCell(p)) + '</td>' : '') +
      (showCol("roles")
        ? '<td class="roles"><span class="rolebox">' + roleCell(p) + '</span></td>' : '') +
      /* Standing before Password, at Islam's direction — whether somebody can
         sign in at all is the question you ask before what their password is
         doing. */
      (showCol("status")
        ? '<td class="cc"><span class="pill ' + (personActive(p) ? "good" : "none") + '">' +
          (personActive(p) ? "Active" : "Retired") + '</span></td>' : '') +
      (showCol("password") ? pwCell(p) : '') +
      kebab(p) + '</tr>';
  }).join("");

  var cols = 3 + PEOPLE_COLS.filter(function(c){
    return showCol(c.k) && (!c.live || live);
  }).length;
  var addRow = editable
    ? '<tr class="newrow"><td class="idx">+</td><td colspan="' + (cols - 2) + '">' +
        '<input class="fld" id="newPersonName" placeholder="Full name" ' +
          'value="' + esc(NEWPERSON) + '">' +
      '</td><td class="cc"><button class="linkbu" data-padd="1">Add</button></td></tr>'
    : '';

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
      (PWMENU
        ? '<div class="hmenu-panel">' +
            '<button class="hmenu-item" data-pwbulk="none"' + (noPw ? "" : " disabled") + '>' +
              '<span class="t">Issue to those with no password</span>' +
              '<span class="d">' + (noPw
                ? plural(noPw, "person").replace("persons", "people") + ' cannot sign in yet.'
                : 'Everybody active already has one.') + '</span></button>' +
            '<div class="hmenu-sep"></div>' +
            '<button class="hmenu-item danger" data-pwbulk="all">' +
              '<span class="t">Reset everyone&rsquo;s password</span>' +
              '<span class="d">All ' + Math.max(0, activeCount - 1) + ' others get a temporary ' +
              'one and are signed out. Never you.</span></button>' +
          '</div>'
        : '') +
    '</span>';

  /* The explanation stays; the CONTROLS moved to the header. A note that
     carries buttons is a second place to press them. */
  var bulk = !live ? "" :
    '<div class="note"><b>Passwords are issued from <i>Passwords</i>, above.</b> ' +
      'Each person is asked to choose their own the first time they use the one you ' +
      'issue, so the same password never works twice for the same person. Resetting ' +
      'everyone ends their open sessions &mdash; and never touches your own password, ' +
      'because being signed out of the screen you are working in is not a safety ' +
      'feature.</div>';

  return cfgHead("People",
      ['<span class="pill kind">SMO</span>',
       plural(PEOPLE.length - retired, "person").replace("persons", "people") + ' active'].concat(
        retired ? [retired + ' retired'] : []).concat(
        noPw ? ['<span class="pill warn">' + noPw + ' with no password</span>'] : []),
      "people", mayEdit, null, null, colMenu + pwMenu) +

    section("", "The register",
      "Everyone the platform knows. A role is given here or on the unit's own page — " +
      "it is the same fact either way, so the two can never disagree.",
      /* NO COLUMN WIDTHS, and no table-layout:fixed (see .peoplecfg in
         config.css). Islam: "the first column of the name needs to wrap
         around the name length" — the column fits the name, rather than the
         name being broken to fit the column. Only ROLES is given a width, and
         it is given the leftovers. */
      '<div class="cfg peoplebox"><table class="unitcfg peoplecfg"><thead><tr>' +
        '<th class="idx">#</th>' +
        '<th>Person</th>' +
        /* "Never decides access" is gone at Islam's direction. It was a note
           about the MODEL sitting on a column header, and the knowledge base
           is where the model is explained (§30) — `c_access` says it there. */
        (showCol("empid")    ? '<th>Emp. ID</th>'   : '') +
        (showCol("title")    ? '<th>Job title</th>'  : '') +
        (showCol("mainbu")   ? '<th>Official BU</th>' : '') +
        (showCol("bu")       ? '<th>BU</th>'         : '') +
        (showCol("contact")  ? '<th>Contact</th>'    : '') +
        (showCol("roles")    ? '<th class="roles">Roles</th>' : '') +
        (showCol("status")   ? '<th class="cc">Status</th>' : '') +
        (live && showCol("password") ? '<th class="cc">Password</th>' : '') +
        '<th class="cc"></th>' +
      '</tr></thead><tbody>' + rows + addRow + '</tbody></table></div>' +
      bulk +
      '<div class="note"><b>People are retired, never deleted.</b> Snapshots name whoever ' +
      'entered a figure, so removing the row would turn a closed cycle into one nobody ' +
      'reported. Retiring takes away every role they hold and closes the door — they ' +
      'cannot sign in — while everything already attributed to them stays true.</div>') +

    renderPeopleFile(mayEdit);
}


/* ══════════════════════════════════════════════════════════════════
   THE REGISTER'S FILE (§54.3, spec 011)

   A section on the People page rather than a page of its own, and not on
   Import either. Import authors ONE UNIT'S PLAN and is reached from the
   cycle; this amends the register, and the register is what you are already
   looking at when you decide five hundred people need to be in it. A13: the
   three-step shape, the review-before-apply and every class here are the
   import page's, because it is the same job done to a different table.
   ══════════════════════════════════════════════════════════════════ */
function renderPeopleFile(mayEdit){
  if (!mayEdit) return "";
  var plan = PPLF.plan;

  var step1 =
    '<div class="imp-step"><div class="imp-n">1</div><div class="imp-b">' +
      '<h4>Download the register</h4>' +
      '<p class="sub">The same file both ways: what comes down is who is on the register ' +
        'now, so it is the export as well as the template. ' +
        plural(PEOPLE.length, "row") + ', with Role and Status as dropdowns' +
        (mainbus().length
          ? ' and your ' + mainbus().length + ' names in the Official BU column'
          : ' — the Official BU column has no list yet, so type the names and they will be ' +
            'added to the Official BU list on arrival') + '.</p>' +
      '<div class="imp-row">' +
        '<button class="editbtn" data-dlppl="1">Download the people template</button>' +
      '</div>' +
    '</div></div>';

  var step2 =
    '<div class="imp-step"><div class="imp-n">2</div><div class="imp-b">' +
      '<h4>Upload the filled file</h4>' +
      '<p class="sub">Matched on <b>Emp ID</b>. A number already here updates that person, ' +
        'a new one adds them, and a person the file does not mention is not touched — ' +
        '<b>an upload never removes anybody</b>.</p>' +
      '<div class="imp-row"><input type="file" id="ppl-file" accept=".xlsx" ' +
        'aria-label="Choose a filled people file to upload">' +
        (PPLF.read ? '<span class="pill quiet">Read &middot; ' + esc(PPLF.read) + '</span>' : '') +
      '</div>' +
    '</div></div>';

  /* THE RECEIPT, and it names the way back to nothing — you are already on the
     page the change landed on, so it says what moved and stops. */
  var step3 = PPLF.done
    ? '<div class="applied"><b>' + esc(PPLF.done) + '</b></div>'
    : "";

  if (!step3 && plan) {
    var blocked = plan.problems.length;
    var checks =
      plan.problems.map(function(x){
        return '<div class="chk bad"><span class="pill bad">Problem</span>' +
          '<b>' + esc(x.at) + '</b><span>' + esc(x.msg) + '</span></div>';
      }).join("") +
      plan.notices.map(function(x){
        return '<div class="chk note-c"><span class="pill attn">Notice</span>' +
          '<b>' + esc(x.at) + '</b><span>' + esc(x.msg) + '</span></div>';
      }).join("");

    /* WHAT MOVES, PERSON BY PERSON. A tally alone ("31 updated") is unreadable
       against a file that came straight back off the download with two cells
       changed — the whole point of reviewing is seeing which two. Rows that
       change nothing are counted and not listed, or the table is the file. */
    var moving = plan.rows.filter(function(r){ return r.action !== "same"; });
    var same = plan.rows.length - moving.length;
    var body = moving.length
      ? '<div class="scroll"><table><thead><tr><th>Row</th><th>Person</th>' +
          '<th>Official BU</th><th class="cc">What happens</th></tr></thead><tbody>' +
        moving.map(function(r){
          return '<tr><td class="mono">' + esc(r.id) + '</td>' +
            '<td><b>' + esc(r.name) + '</b></td>' +
            '<td>' + (r.mainbu
              ? esc(r.mainbu) + (r.where
                  ? ' <span class="why" style="margin:0">&rarr; ' + esc(roleWhereLabel(r.where)) + '</span>'
                  : ' <span class="why" style="margin:0">&rarr; not mapped</span>')
              : '<span class="why" style="margin:0">&mdash;</span>') + '</td>' +
            '<td class="cc">' + (r.action === "add"
              ? '<span class="pill good">Added</span>'
              : '<span class="pill attn">' + esc(r.changes.join(", ")) + '</span>') +
            '</td></tr>';
        }).join("") + '</tbody></table></div>'
      : '<div class="note">Nothing in this file differs from what is recorded.</div>';

    step3 =
      '<div class="imp-step"><div class="imp-n">3</div><div class="imp-b">' +
        '<h4>Review, then apply</h4>' +
        (checks ? '<div class="imp-checks">' + checks + '</div>' : '') +
        (blocked
          ? '<div class="note bad-note"><b>Nothing can be applied while a problem stands.</b> ' +
            'Data that loads badly is harder to find later than a file that refuses to load.</div>'
          : '') +
        '<div class="imp-tally">' +
          (plan.added   ? '<span class="pill good">' + plan.added + ' added</span>' : '') +
          (plan.updated ? '<span class="pill attn">' + plan.updated + ' updated</span>' : '') +
          (plan.roles   ? '<span class="pill kind">' + plan.roles + ' given a role</span>' : '') +
          (plan.retired ? '<span class="pill bad">' + plan.retired + ' retired</span>' : '') +
          (plan.restored? '<span class="pill good">' + plan.restored + ' restored</span>' : '') +
          (plan.newBus.length
            ? '<span class="pill attn">' + plural(plan.newBus.length, "new BU name") + '</span>' : '') +
          (same ? '<span class="pill quiet">' + same + ' unchanged</span>' : '') +
        '</div>' + body +
        '<div class="imp-row" style="margin-top:14px">' +
          (blocked
            ? '<button class="editbtn" disabled style="opacity:.45;cursor:not-allowed">Apply blocked</button>'
            : '<button class="editbtn apply" data-pplapply="1">Apply to the register</button>') +
          '<button class="linkbu" data-pplcancel="1">Discard</button></div>' +
      '</div></div>';
  }

  return section("", "Seed the register from a file",
    "One row per person, matched on their employee number. Adds and amends — it never " +
    "removes anybody, and a blank cell means \u201cnothing to say about this\u201d rather than " +
    "\u201cclear it\u201d.",
    '<div class="imp">' + step1 + step2 + step3 + '</div>');
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
  var mayEdit = grant("c_people") === "edit";
  var editable = mayEdit && EDITING.people;
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
  function target(b){
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
    var n = peopleOfMainbu(b.name).length;
    return '<tr><td class="idx">' + (i + 1) + '</td>' +
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(b.name) + '" data-mbname="' + esc(b.name) + '">'
        : '<b>' + esc(b.name) + '</b>') + '</td>' +
      '<td>' + target(b) + '</td>' +
      '<td class="cc"><span class="mono">' + n + '</span></td>' +
      '<td class="cc">' + (editable
        /* Deleted rather than retired, and that is safe only because it is
           REFUSED while anybody carries the name — the same contract as
           retiring a company that still holds units (§49.3). A list row
           records nothing, so there is no history to protect. */
        ? (n
            ? '<span class="pill none" title="' + n + ' on the register">held by ' + n + '</span>'
            : '<button class="linkbu danger" data-mbdel="' + esc(b.name) + '">Remove</button>')
        : '') + '</td></tr>';
  }).join("");

  var addRow = editable
    ? '<tr class="newrow"><td class="idx">+</td><td colspan="3">' +
        '<input class="fld" id="newMainbu" placeholder="Business unit name, as your own records spell it" ' +
        'value="' + esc(NEWMAINBU) + '">' +
      '</td><td class="cc"><button class="linkbu" data-mbadd="1">Add</button></td></tr>'
    : '';

  var table = list.length || editable
    ? '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th>' +
        '<th style="width:30%">Official BU</th>' +
        '<th style="width:40%">Points at</th>' +
        '<th class="cc" style="width:14%">People</th>' +
        '<th class="cc" style="width:18%"></th>' +
      '</tr></thead><tbody>' + rows + addRow + '</tbody></table></div>'
    : '<div class="note"><b>Empty.</b> Names arrive by themselves the first time an employee ' +
      'file is uploaded on <b>People</b> — every BU it mentions is added here, pointing at ' +
      'nothing, for you to map. Or type them in with Edit.</div>';

  return cfgHead("Official BU list",
      ['<span class="pill kind">SMO</span>',
       plural(list.length, "name"),
       mapped + ' mapped'].concat(
        strays.length ? ['<span class="pill warn">' + plural(strays.length, "name") +
                         ' on people and not on this list</span>'] : []),
      "people", mayEdit) +

    section("", "Your names, and what they point at",
      "Your organisation's own official names for parts of the business, and which units " +
      "and supporting functions each one holds here. An official BU carries no strategy and " +
      "no score of its own — it is vocabulary, and what it points at is what is measured. " +
      "Set once: every employee file then reads itself, and everyone signs in to a short " +
      "list instead of the whole organisation.",
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

function renderCompanies(){
  var editable = grant("c_units") === "edit" && EDITING.units;
  var live = activeCompanyKeys().length;
  return cfgHead("Companies",
      ['<span class="pill kind">SMO</span>',
       COMPANY_KEYS.length + ' ' + (COMPANY_KEYS.length === 1 ? 'company' : 'companies'),
       plural(soloUnits().length, "unit") + ' standing alone'].concat(
         live < COMPANY_KEYS.length ? [(COMPANY_KEYS.length - live) + ' retired'] : []),
      "units", grant("c_units") === "edit") +
    section("", "Companies", null,
      '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th><th style="width:24%">Company</th>' +
        '<th class="cc" style="width:8%">Units</th>' +
        '<th class="cc" style="width:18%">Sees other companies</th>' +
        '<th class="cc" style="width:18%">Sees the group</th>' +
        '<th class="cc" style="width:20%">Status</th></tr></thead><tbody>' +
      COMPANY_KEYS.map(function(ck, i){
        var co = COMPANIES[ck], on = companyActive(ck), blockers = companyRetireBlockers(ck);
        var flag = function(field, val){
          if (!editable) return '<span class="pill ' + (val ? "good" : "none") + '">' +
            (val ? "Yes" : "No") + '</span>';
          return '<select class="fld" data-coflag="' + ck + '|' + field + '">' +
            '<option value="no"' + (val ? "" : " selected") + '>No</option>' +
            '<option value="yes"' + (val ? " selected" : "") + '>Yes</option></select>';
        };
        return '<tr' + (on ? '' : ' class="retired"') + '><td class="idx">' + (i+1) + '</td>' +
          '<td>' + (editable
            ? '<input class="fld" value="' + esc(co.name) + '" data-coname="' + ck + '">'
            : '<b>' + esc(co.name) + '</b>') +
            '<span class="why mono">key ' + ck + '</span></td>' +
          '<td class="cc"><span class="mono">' + unitsOfCompany(ck).length + '</span></td>' +
          '<td class="cc">' + flag("seeOthers", co.seeOthers) + '</td>' +
          '<td class="cc">' + flag("seeGroup", co.seeGroup) + '</td>' +
          /* Retiring is REFUSED while units still belong here, and the cell says
             how many rather than going quiet about why there is no button. */
          '<td class="cc">' + (editable
            ? (on && blockers.length
                ? '<span class="pill none" title="' + esc(blockers.join(", ")) + '">holds ' +
                    plural(blockers.length, "unit") + '</span>'
                : '<button class="rmbtn' + (on ? '' : ' on') + '" data-coact="' + ck + '">' +
                    (on ? "Retire" : "Restore") + '</button>')
            : '<span class="pill ' + (on ? "good" : "none") + '">' +
                (on ? "Active" : "Retired") + '</span>') + '</td></tr>';
      }).join("") + '</tbody></table></div>' +
      (editable ? '<div class="addrow"><button class="editbtn" id="addcompany">+ Add a company</button></div>' : '') +
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
      { h: "Seven roles, seven kinds of page",
        p: 'The table on <b>Roles &amp; access</b> is roles down the side and kinds of page ' +
           'across the top. Not individual pages — a unit\u2019s five pages answer together, ' +
           'because &ldquo;may they open this unit&rdquo; is one question, not five.' },
      { h: "Own is not a setting",
        p: '<b>Own business unit</b> means the units they hold a role in. The head and the ' +
           'custodian of Mobile own Mobile; a company CEO owns every unit in their company; ' +
           'the SMO and the group CEO own all of it. Nobody types that in — it is read from ' +
           'who is attached to what, so this table and the unit pages cannot disagree.' },
      { h: "Three states, never more",
        p: 'Each cell is <b>none</b>, <b>view</b> or <b>edit</b>. Edit includes view. Two ' +
           'would not be enough: a unit head reads the weighting table but does not manage ' +
           'it, and that is not expressible in two.' },
      { h: "Someone holding several roles",
        p: 'They get the <b>most generous</b> answer of them — but each role answers only ' +
           'about what it is attached to. Owning Mobile and sitting on Finance gives the ' +
           'owner\u2019s answer for Mobile and the other-unit answer for Retail, from the ' +
           'same two roles, without either being asked about the wrong thing.' },
      { h: "Three things the table does not decide",
        p: 'The <b>knowledge base</b> is readable by everyone, always. A <b>plan</b> is ' +
           'corrected by the SMO alone, however much access the unit\u2019s people hold — a ' +
           'plan you are measured against is not yours to rewrite. And <b>focus measures</b>, ' +
           'what carries reward, are marked by the group CEO and the SMO. These are rules; ' +
           'they do not change when the table does.' },
      { h: "Companies decide reach",
        p: 'A company groups business units so a company CEO sees their own. It carries ' +
           '<b>no score and no page</b> — it decides who sees what, nothing more. Its two ' +
           'flags, whether its CEO sees the group and the other companies, can only ever ' +
           '<b>narrow</b> what the table allows. Supporting functions belong to no company: ' +
           'they serve all of them.' },
      { h: "The gate is real, the rest is Phase 2",
        p: 'Signing in is checked on the server against a stored password. Per-action ' +
           'authorisation and the change log are not built yet: today the enforcement is ' +
           'at the door, not at each button.' }
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
    ])
  ];

  var toc = '<div class="kb-toc">' + [
      ["scoring","Scoring"],["access","Access"],["labels","Labels"],
      ["units","Units & functions"],["plans","Plans"],["cycle","Cycle"],["data","Data"]
    ].map(function(x){ return '<a href="#kb-' + x[0] + '">' + x[1] + '</a>'; }).join("") + '</div>';

  return cfgHead("Knowledge base",
      ['<span class="pill kind">Everyone</span>', secs.length + ' sections'],
      null, false) +
    '<p class="kb-lede">How the platform works, in one place. This grows — anything we ' +
      'settle that a reader would need to know belongs here rather than in a note under ' +
      'the screen it happens to affect.</p>' +
    toc + '<div class="kb">' + secs.join("") + '</div>';
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
var FSET = { unit:"mobile" };

function renderFocusSetup(){
  /* Marking is the CEO's and the SMO's — a rule now, not a cell (§37).
     mayMarkFocus() carries the lock too, so there is one gate, not two. */
  var editable = mayMarkFocus();
  var u = UNITS[FSET.unit];

  var pick = function(m, src){
    var on = isFocus(m.id);
    return '<div class="pick ' + (on ? "on" : "off") + '">' +
      (editable
        ? '<button class="fmark-btn' + (on ? ' on' : '') + '" data-focus="' + m.id + '" ' +
          'aria-pressed="' + on + '" aria-label="' + (on ? "Unmark " : "Mark ") + esc(m.name) + '"></button>'
        : '<span class="fmark-btn' + (on ? ' on' : '') + '" style="cursor:default"></span>') +
      '<span>' + esc(m.name) + ' <span class="src">' + esc(src) + '</span></span>' +
      '<span class="num why" style="margin:0">target ' +
        (m.target ? esc(m.target) : '<span class="missing">Missing</span>') + '</span>' +
      '<span class="why" style="margin:0;min-width:74px;text-align:right">' +
        (on ? "marked" : (editable ? "click to mark" : "")) + '</span>' +
    '</div>';
  };

  var blocks =
    '<div class="grouphead">' + L("keyobj","bu") + '</div>' +
    (u.keyObjectives.length
      ? u.keyObjectives.map(function(m){ return pick(m, "objective"); }).join("")
      : '<div class="fstrip-empty">None set for this unit.</div>') +
    u.items.map(function(p, pi){
      return '<div class="grouphead">' + pillarCode(u, pi) + ' ' + esc(p.name) +
             ' &middot; ' + esc(p.kind).toLowerCase() + '</div>' +
        (p.measures.length
          ? p.measures.map(function(m){ return pick(m, ""); }).join("")
          : '<div class="fstrip-empty">No key measures.</div>');
    }).join("");

  var n = unitFocus(u).length;
  var unitPick = '<select class="fld" id="fset-unit" aria-label="Which unit to mark">' +
    activeKeys().map(function(k){
      var c = unitFocus(UNITS[k]).length;
      return '<option value="' + k + '"' + (k === FSET.unit ? " selected" : "") + '>' +
        esc(UNITS[k].name) + (c ? "  \u2014 " + c + " marked" : "") + '</option>';
    }).join("") + '</select>';

  return '<div class="kv"><span class="pill kind">CEO &amp; SMO</span>' +
      '<span class="pill ' + (CYCLE.locked ? "none" : "good") + '">' +
        (CYCLE.locked ? "Locked for the cycle" : "Open for marking") + '</span>' +
      '<span class="pill kind">reward begins at ' + CYCLE.rewardAt + '%</span></div>' +
    section("", "Focus measures", null,
      '<div class="imp-row" style="margin:0 0 16px">' + unitPick +
        '<span class="cfg-lab">' + n + ' marked in ' + esc(u.name) + '</span></div>' +
      '<div class="cfg" style="padding:0">' + blocks + '</div>' +
      '<div class="note">Marks are stored against the cycle, not the measure \u2014 <b>every cycle ' +
        'starts unmarked</b>, so last year\'s emphasis cannot quietly become this year\'s. ' +
        'There is no cap: three is the usual choice and it stays a choice. ' +
        '<b>Focus changes no score</b>; it is a lens and an incentive, not a second weighting.</div>');
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
    return '<select class="fld" ' + attr + '><option value="">\u2014</option>' +
      PEOPLE.filter(personActive).map(function(p){
        return '<option value="' + esc(p.key) + '"' + (p.key === sel ? " selected" : "") + '>' +
          esc(p.name) + (p.title ? " \u2014 " + esc(p.title) : "") + '</option>';
      }).join("") + '</select>';
  };
  var pickOptions = function(sel, attr){
    return '<select class="fld" ' + attr + '>' +
      '<option value="smo"' + (sel !== "owner" ? " selected" : "") + '>The SMO fills it</option>' +
      '<option value="owner"' + (sel === "owner" ? " selected" : "") + '>Its owner picks</option>' +
      '</select>';
  };

  var rows = sets.map(function(st, i){
    var n = SMPRules.rowsOfSet(world(), st.id).length;
    return '<tr>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td>' + (editing
        ? '<input class="fld" value="' + esc(st.name) + '" data-setname="' + esc(st.id) + '">'
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
      '<td class="cc">' + (editing
        ? '<button class="linkbu" data-setdel="' + esc(st.id) + '">Remove</button>'
        : '') + '</td></tr>';
  }).join("");

  var addRow = editing
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

  return cfgHead("Figure sets",
      [sets.length + (sets.length === 1 ? " set" : " sets"),
       claimed + " figure" + (claimed === 1 ? "" : "s") + " claimed"],
      "sets", mayEdit, null, null) +
    '<div class="cfg"><table><thead><tr>' +
      '<th style="width:34px">#</th><th style="width:26%">Set</th>' +
      '<th style="width:16%">Team</th><th style="width:22%">Owner</th>' +
      '<th style="width:20%">Who picks its figures</th>' +
      '<th class="cc" style="width:9%">Figures</th><th class="cc" style="width:9%"></th>' +
    '</tr></thead><tbody>' + (rows || (editing ? "" :
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
  var open = REVIEW.state === "open" && !(CYCLE.locked && !hasRole("super"));
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
          (m.target ? esc(m.target) : '<span class="missing">No target</span>') + '</span>' +
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
  var u = isCap ? impCap() : UNITS[IMP.unit];
  var isPlan = IMP.kind === "plan";
  var d = IMP.diff;

  var unitPick = '<select class="fld" id="imp-unit">' +
    '<optgroup label="Business units">' + UNIT_KEYS.map(function(k){
      return '<option value="' + k + '"' + (k === IMP.unit ? " selected" : "") + '>' + esc(UNITS[k].name) + '</option>';
    }).join("") + '</optgroup>' +
    '<optgroup label="Capabilities">' + GROUP.capabilities.map(function(c){
      return '<option value="cap:' + c.id + '"' + ("cap:" + c.id === IMP.unit ? " selected" : "") + '>' +
        esc(c.name) + '</option>';
    }).join("") + '</optgroup></select>';

  var kindPick = '<span class="minisw">' +
    '<button data-impkind="plan" aria-pressed="' + isPlan + '">Plan</button>' +
    '<button data-impkind="progress" aria-pressed="' + !isPlan + '">Progress</button></span>';

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
        ? "The same file whichever unit you are planning. Choose the unit on its Read me sheet, fill it in Excel, and the platform assigns every code itself."
        : "One row per reportable item, with its target and what is currently recorded. Only the New value column is typed.") +
      '</p>' +
      '<div class="imp-row">' + (isPlan ? "" : unitPick) + kindPick +
        '<button class="editbtn" data-dlx="1">' +
          (isPlan ? "Download the plan template" : "Download Excel") + '</button>' +
        (isPlan
          ? '<button class="linkbu" data-dlxcap="1">Capability template</button>'
          : '<button class="linkbu" data-dl="1">or the raw CSV</button>' +
            '<button class="linkbu" data-showcsv="1">View the CSV</button>') +
      '</div>' +
      '<p class="sub" style="margin-top:8px">' + (isPlan
        ? UNIT_KEYS.filter(function(k){ return UNITS[k].active !== false; }).length +
          " business units and " + GROUP.themes.length + " themes are in its dropdowns"
        : counts) + '</p>' +
    '</div></div>';

  var step2 =
    '<div class="imp-step"><div class="imp-n">2</div><div class="imp-b">' +
      '<h4>Upload the filled file</h4>' +
      '<p class="sub">' + (isPlan
        ? "The file says which unit it is for, so there is nothing to select here. An upload <b>authors</b> that plan \u2014 the outgoing one is archived, not destroyed \u2014 and no other unit is touched."
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

  return '<div class="kv"><span class="pill kind">SMO only</span>' +
      '<span class="pill kind">' + (isPlan
        ? "One generic template &middot; one unit per file"
        : "One file per unit or capability") + '</span></div>' +
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
      "A plan is archived here whenever an upload replaces one or a clear empties one, and a " +
      "cycle's figures whenever a new cycle clears them. Nothing has been replaced yet.",
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
    var live = a.kind === "figures" ? true : a.kind === "unit" ? UNITS[a.key] : capById(a.key);
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
    "Every plan an upload replaced or a clear emptied, and every cycle's figures a new cycle " +
    "cleared \u2014 newest first. Restoring puts one back and archives whatever is there now: " +
    "the same act in reverse, with the same warning.",
    '<div class="cfg"><table><thead><tr>' +
      '<th style="width:22%">Plan</th><th class="cc" style="width:12%">Archived</th>' +
      '<th style="width:20%">Replaced by</th><th>What it held</th>' +
      '<th class="cc" style="width:16%"></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>');
}

/* ── Setup · Reporting cycle ────────────────────────────────────────
   Opening turns a plan into a request. Closing snapshots it, which is the
   only way the product ever acquires a past to compare against.

   The SMO can close with gaps: waiting for the last number means never
   closing, and a cycle that never closes writes no history. Unreported items
   close as unreported and stay visibly so \u2014 a stronger prompt than an email. */
function renderCycle(){
  var can = grant("c_cycle") === "edit";
  var open = REVIEW.state === "open";

  var rows = activeKeys().map(function(k){
    var u = UNITS[k], c = reportedCount(u), st = unitState(u);
    var r = UNIT_ROLES[k] || {};
    var who = personName(r.custodian) || personName(r.head) || "\u2014";
    var pctD = c.total ? Math.round(c.done / c.total * 100) : 0;
    var miss = missingNotes(u).length;
    var by = { obj:[0,0], mea:[0,0], tac:[0,0] };
    askedItems(u).forEach(function(x){
      var slot = x.kind === "objective" ? "obj" : x.kind === "measure" ? "mea" : "tac";
      by[slot][1]++;
      if (x.obj.actual != null && x.obj.actual !== "") by[slot][0]++;
    });
    return '<tr><td><b>' + esc(u.name) + '</b></td>' +
      '<td class="why" style="margin:0">' + esc(who) + '</td>' +
      '<td><div class="repcell"><span class="repbar' + (pctD < 100 ? " part" : "") + '">' +
        '<i style="width:' + pctD + '%"></i></span>' +
        '<span class="mono why" style="margin:0">' + c.done + '/' + c.total + '</span></div></td>' +
      '<td class="num">' + by.obj[0] + '/' + by.obj[1] + '</td>' +
      '<td class="num">' + by.mea[0] + '/' + by.mea[1] + '</td>' +
      '<td class="num">' + by.tac[0] + '/' + by.tac[1] + '</td>' +
      '<td class="cc">' + (miss ? '<span class="badge b-late">' + miss + ' need notes</span>' : '') + '</td>' +
      '<td class="cc"><span class="badge b-' + st.key + '">' + st.label + '</span></td></tr>';
  }).join("");

  var t = { done:0, total:0, sub:0, none:0 };
  activeKeys().forEach(function(k){
    var c = reportedCount(UNITS[k]); t.done += c.done; t.total += c.total;
    var st = unitState(UNITS[k]);
    if (st.key === "done") t.sub++; if (st.key === "late") t.none++;
  });

  var head =
    '<div class="fstrip" style="margin-bottom:20px"><div class="fstrip-head">' +
      '<span class="fstrip-t">' + esc(REVIEW.name) + '</span>' +
      '<span class="fstrip-meta">' + esc(REVIEW.from) + ' to ' + esc(REVIEW.to) +
        ' &middot; due ' + esc(REVIEW.due) + ' &middot; as of Q' + REVIEW.endsQuarter + '</span>' +
      '<span class="badge b-' + (open ? "open" : "none") + '">' + (open ? "Open" : "Closed") + '</span>' +
      (can
        ? (open
            ? '<button class="editbtn danger" data-closecycle="1">Close the cycle</button>'
            : '<button class="editbtn" data-opencycle="1">Open a new cycle&hellip;</button>')
        : '') +
    '</div>' +
    /* ── OPENING A CYCLE ASKS WHAT IT IS (§47.8) ────────────────────
       Islam: "on opening the cycle it didn't ask me any questions … we should
       set the name of the cycle and the duration it covers."

       It used to mint `{ name:"Cycle 3", from:<last cycle's end>, to:"",
       due:"", endsQuarter:4 }` and open it — a name nobody chose, a period
       half filled from a guess, and a hard-coded end quarter. That last one is
       not cosmetic: `endsQuarter` decides which tactics count as DUE, so a
       wrong guess silently changes every unit's execution score.

       An inline panel rather than a modal, because the fields want the page's
       own controls and because what you are about to replace — the cycle
       above — should stay on screen while you describe its successor. */
    (NEWCYCLE
      ? '<div class="cfg newcycle"><div class="nc-h">Open a new cycle</div>' +
        '<div class="nc-grid">' +
          '<label><span>Name</span><input class="fld" id="nc-name" value="' +
            esc(NEWCYCLE.name) + '" placeholder="H1 2027"></label>' +
          '<label><span>Covers from</span><input class="fld" id="nc-from" value="' +
            esc(NEWCYCLE.from) + '" placeholder="Jan 2027"></label>' +
          '<label><span>to</span><input class="fld" id="nc-to" value="' +
            esc(NEWCYCLE.to) + '" placeholder="Jun 2027"></label>' +
          '<label><span>Reports due</span><input class="fld" id="nc-due" value="' +
            esc(NEWCYCLE.due) + '" placeholder="15 Jul 2027"></label>' +
          '<label><span>Ends in quarter</span><select class="fld" id="nc-q">' +
            [1,2,3,4].map(function(q){
              return '<option value="' + q + '"' +
                (Number(NEWCYCLE.endsQuarter) === q ? " selected" : "") + '>Q' + q + '</option>';
            }).join("") + '</select></label>' +
        '</div>' +
        '<div class="nc-why"><b>The quarter decides which tactics are asked for.</b> ' +
          'A tactic whose span has not started yet is not counted as unreported.</div>' +
        '<div class="nc-act">' +
          '<button class="editbtn" data-nc-go="1">Open this cycle</button>' +
          '<button class="linkbu" data-nc-cancel="1">Cancel</button></div></div>'
      : '') +
    '<div class="fstrip-body">' +
      '<div class="kpi"><b>' + t.done + '</b><span>of ' + t.total + ' items reported</span></div>' +
      '<div class="fchips"><span class="badge b-done">' + t.sub + ' submitted</span>' +
        '<span class="badge b-part">' + (activeKeys().length - t.sub - t.none) + ' in progress</span>' +
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

  return '<div class="kv"><span class="pill kind">SMO</span>' +
      '<span class="pill kind">' + esc(REVIEW.cadence) + '</span>' +
      (claims.length ? '<span class="pill attn">' + claims.length + ' claim request' +
        (claims.length === 1 ? "" : "s") + '</span>' : '') + '</div>' + head +
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
        '<tbody>' + rows + '</tbody></table></div>' +
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

function renderFunctions(){
  var editable = grant("c_fns") === "edit" && EDITING.fns;
  /* The same picker the Business units page uses, addressed at "fn:<key>"
     rather than a unit key — search, this function's own people first, and Add
     new (§35). It replaces a <select> that listed every person in the tenant
     in one flat list, retired ones included. */
  var pick = function(role, current, fk){
    return assignPicker("fn:" + fk, role === "head" ? "fnhead" : "custodian", current, editable);
  };

  var rows = FUNCTION_KEYS.map(function(fk, i){
    var f = FUNCTIONS[fk], caps = capsOfFunction(fk);
    return '<tr' + (f.active === false ? ' class="retired"' : '') + '>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(f.name) + '" data-fname="' + fk + '">'
        : '<b>' + esc(f.name) + '</b>') +
        '<span class="why mono">key ' + fk + '</span></td>' +
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(f.navName || "") + '" data-fnav="' + fk +
          '" placeholder="' + esc(f.name) + '">'
        : (f.navName ? '<span class="val">' + esc(f.navName) + '</span>'
                     : '<span class="why" style="margin:0">' + esc(f.name) + '</span>')) + '</td>' +
      '<td class="cc">' + (editable
        ? '<input class="fld mono" value="' + esc(f.codePrefix || "") + '" data-fpx="' + fk + '">'
        : '<span class="mono">' + esc(f.codePrefix || "\u2014") + '</span>') + '</td>' +
      /* ── PLANS IN, AND UNDER (§59) ─────────────────────────────────
         Spec 010 built both and gave neither a control: `format` and `under`
         could only be set by editing the source, so a second Merchandising was
         impossible to create through the product.

         SWITCHING IS REFUSED WHILE THE OTHER SIDE HOLDS SOMETHING, and it says
         what is in the way rather than hiding a plan that still exists — the
         same contract as retiring a company that still holds units (§49.3). */
      '<td class="cc">' + planCell(fk, f, editable) + '</td>' +
      '<td class="cc"><span class="mono">' + caps.length + '</span></td>' +
      '<td class="cc">' + pick("head", f.head, fk) + '</td>' +
      '<td class="cc">' + pick("custodian", f.custodian, fk) + '</td>' +
      '<td class="cc">' + (editable
        ? '<div class="rowacts">' +
            '<button class="linkbu" data-fnretire="' + fk + '">' +
              (f.active === false ? "Reinstate" : "Retire") + '</button>' +
            (CLEARING === "fn|" + fk + "|plan"
              ? '<span class="confirm"><b>Clear the whole plan?</b>' +
                  '<span class="why" style="margin:0">Key objectives and projects across ' +
                    functionCapCount(fk) + ' ' +
                    (functionCapCount(fk) === 1 ? "capability" : "capabilities") +
                    '. The definitions stand, and each plan is archived first.</span>' +
                  '<button class="rmbtn" data-clearyes="fn|' + fk + '|plan">Yes, clear the plan</button>' +
                  '<button class="linkbu" data-clearno="1">Cancel</button></span>'
              : CLEARING === "fn|" + fk + "|nums"
              ? '<span class="confirm"><b>Clear the reported progress?</b>' +
                  '<span class="why" style="margin:0">Actuals and notes across ' +
                    functionCapCount(fk) + ' ' +
                    (functionCapCount(fk) === 1 ? "capability" : "capabilities") +
                    '. The plan stands.</span>' +
                  '<button class="rmbtn" data-clearyes="fn|' + fk + '|nums">Yes, clear the progress</button>' +
                  '<button class="linkbu" data-clearno="1">Cancel</button></span>'
              : '<button class="linkbu" data-clear="fn|' + fk + '|nums">Clear progress</button>' +
                '<button class="linkbu" data-clear="fn|' + fk + '|plan">Clear plan</button>') +
          '</div>'
        : '<span class="pill ' + (f.active === false ? "none" : "good") + '">' +
            (f.active === false ? "Retired" : "Active") + '</span>') + '</td></tr>';
  }).join("");

  /* "Functions" in the rail and on the page (Islam, 2026-08-23). The page has
     always been about all of them, and "supporting" was doing no work in a
     list where nothing else is a function — it only made the rail's longest
     entry longer. The ROLE keeps its full name: "Supporting function head" is
     what somebody holds, and that is a different word doing a different job. */
  return cfgHead("Functions",
      ['<span class="pill kind">SMO</span>', activeFunctionKeys().length + ' active',
       GROUP.capabilities.length + ' capabilities'],
      "fns", grant("c_fns") === "edit", "fnall",
      ["Clear all progress", "Clear all plans"]) +
    section("", "", null,
      '<div class="cfg"><table><thead><tr><th class="idx">#</th><th style="width:16%">Function</th>' +
        /* SHORTENED, BECAUSE THEY NO LONGER FIT. Measured rather than judged:
           at 920px "Shown in the nav" wanted 119px in a 94px cell, "Strategy
           custodian" 129 in 119 and "Capabilities" 86 in 68 — three headers
           overlapping their neighbours, which adding a ninth column caused.
           Each still says what its column is; the long forms were describing
           what the row already shows. */
        '<th style="width:11%">Nav name</th><th class="cc" style="width:6%">Code</th>' +
        '<th class="cc" style="width:15%">Plans in</th>' +
        '<th class="cc" style="width:8%">Caps</th>' +
        '<th class="cc" style="width:14%">Head</th><th class="cc" style="width:14%">Custodian</th>' +
        '<th class="cc" style="width:9%">Status</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      /* The three notes that sat here are in the knowledge base now (§30). A
         setup table is where you change a thing; it is not where the thing is
         explained, and three paragraphs of prose under every table is how a
         configuration screen stops being scannable. */
      (editable ? '<div class="addrow"><button class="editbtn" id="addfn">+ Add a supporting function</button></div>' : ''));
}

/* ── Setup · Capabilities ───────────────────────────────────────────
   The SMO decides which capabilities exist and which function owns each. Each
   belongs to exactly one function; the enhancement work inside them arrives by
   template, the way a unit's plan does. */
function renderCaps(){
  var editable = grant("c_caps") === "edit";
  var rows = GROUP.capabilities.map(function(c, i){
    var f = functionOf(c.fn);
    return '<tr><td class="idx">' + (i+1) + '</td>' +
      /* THE NAME IS TYPED HERE (§51.11, Islam). It was printed and nothing
         else, so a capability could be given an owner but never renamed —
         and a capability added from Temple arrived called "New capability"
         with no way on this page to say what it actually is. */
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(c.name) + '" data-capname="' + i +
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
      '<td class="cc">' + (editable
        ? '<button class="rmbtn" data-caprm="' + i + '">Remove</button>' : '') + '</td></tr>';
  }).join("");

  var orphan = GROUP.capabilities.filter(function(c){ return !c.fn; }).length;
  return '<div class="kv"><span class="pill kind">SMO</span>' +
      '<span class="pill ' + (orphan ? "none" : "good") + '">' +
        (orphan ? orphan + " unassigned" : "all assigned") + '</span></div>' +
    section("", "Capabilities", null,
      /* Widths set so a long head name \u2014 "Strategy Management Office" \u2014 does not
         wrap and leave one row taller than the rest, which reads as broken
         shading rather than as a long name. */
      '<div class="cfg"><table><thead><tr><th class="idx">#</th><th style="width:26%">Capability</th>' +
        '<th style="width:20%">Owned by</th><th style="width:24%">Head</th>' +
        '<th class="cc">Key objectives</th><th class="cc">Projects</th>' +
        '<th class="cc"></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      (editable
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
