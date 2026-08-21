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
      (o === "view" ? "&#128065;" : "&#9998;") + '</button>';
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

  var head = '<tr><th style="width:19%">Role</th>' + AREAS.map(function(a){
    return '<th class="ac"><div class="factor-h"><b>' + esc(a.label) + '</b><span>' +
      esc(a.note) + '</span></div></th>';
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
        '<span><i class="st st-view">&#128065;</i> may read</span>' +
        '<span><i class="st st-edit">&#9998;</i> may read and change</span>' +
        '<span><i class="st st-none">neither</i> no access, page hidden</span>' +
        '<span><i class="st" style="background:none;color:var(--none);border:1px dashed var(--none)">&mdash;</i> cannot come up for this role</span>' +
      '</div>') +

    section("", "Own is not a setting",
      null,
      '<div class="note"><b>&ldquo;Own&rdquo; is whatever they hold a role in.</b> ' +
      'The head and the custodian of Mobile own Mobile. A company CEO owns every unit ' +
      'in their company. The SMO and the group CEO own all of it. Nobody types that in ' +
      'anywhere &mdash; it is read from who is attached to what on ' +
      '<b>Business units</b>, <b>Supporting functions</b> and <b>People</b>, which is why ' +
      'those pages and this one cannot disagree.' +
      '<div style="margin-top:10px">Two things a company decides for itself still apply on top, ' +
      'and can only ever narrow this table: whether its CEO sees <b>the group</b>, and whether ' +
      'they see <b>the other companies</b>. Both are on the Companies page.</div></div>' +
      '<div class="note"><b>Three things are rules, not settings, so they are not in the table.</b> ' +
      'The <b>Knowledge base</b> is readable by everyone, always &mdash; an explanation nobody ' +
      'can open is not an explanation. A <b>plan</b> is corrected by the SMO alone, however much ' +
      'access the unit&rsquo;s own people hold, because a plan you are measured against is not ' +
      'yours to rewrite. And <b>focus measures</b> &mdash; what carries reward &mdash; are marked ' +
      'by the group CEO and the SMO. Each of these used to be a cell here.</div>');
}

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

  return section("", "Weighting factors",
    "Factors are stored as rows, not as fixed columns, so adding one is data entry rather than a schema change. Each declares its own type, which decides how its values are captured.",

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

function cfgHead(title, chips, editKey, mayEdit, clearScope, labels){
  var editing = EDITING[editKey];
  var open = CLEARMENU === editKey;
  return '<div class="phead2"><h2 class="secttl">' + title + '</h2>' +
    '<div class="hright">' +
      chips.map(function(x){ return '<span class="chip">' + x + '</span>'; }).join("") +
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
                        ? "The work itself, everywhere on this page. Names and definitions stand."
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
            COMPANY_KEYS.map(function(ck){
              return '<option value="' + ck + '"' + (u.company === ck ? " selected" : "") + '>' +
                esc(COMPANIES[ck].name) + '</option>';
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
                  '<span class="why" style="margin:0">Pillars, measures, tactics, objectives, SWOT and the foundation text.</span>' +
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
      (editable ? '<div class="addrow"><button class="editbtn" id="addunit">+ Add a business unit</button></div>' : ''));
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

function renderPeople(){
  var mayEdit = grant("c_people") === "edit";
  var editable = mayEdit && EDITING.people;
  var live = typeof SYNC !== "undefined" && SYNC.isLive() && hasRole("super");
  var retired = PEOPLE.filter(function(p){ return !personActive(p); }).length;
  var noPw = live && PWSTATES
    ? PEOPLE.filter(function(p){ return personActive(p) && PWSTATES[p.key] === "none"; }).length
    : 0;

  /* A unit and a supporting function may share a name — Care and IT are both,
     in this tenant — and one person is often custodian of each. Unqualified,
     the row then reads "Strategy custodian · Care" twice and looks like a
     duplicate rather than two real roles over two different things. The kind
     is part of the answer, so it is part of the label. */
  function whereLabel(at){
    if (!at || at === "group") return "the group";
    if (String(at).indexOf("fn:") === 0) {
      var f = FUNCTIONS[String(at).slice(3)];
      return (f ? f.name : String(at).slice(3)) + " (function)";
    }
    if (String(at).indexOf("co:") === 0) {
      var c = COMPANIES[String(at).slice(3)];
      return c ? c.name : String(at).slice(3);
    }
    return UNITS[at] ? UNITS[at].name : at;
  }

  /* The role cell. Read-only it is a list of what they hold and where; in edit
     it gains an X per role and one add control. Two selects rather than one
     long list of every role-times-place, because "where" depends on which
     role was chosen and a combined list would offer Company CEO of Mobile. */
  function roleCell(p){
    var rs = personRoles(p);
    var held = rs.length
      ? rs.map(function(r){
          return '<span class="rolechip"><b>' + esc(roleName(r.role)) + '</b>' +
            '<span class="why" style="margin:0">' + esc(whereLabel(r.at)) + '</span>' +
            (editable
              ? '<button class="xbtn" data-prole-off="' + p.key + '|' + r.role + '|' + r.at +
                '" title="Remove this role" aria-label="Remove this role">&times;</button>'
              : '') + '</span>';
        }).join("")
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

  function pwCell(p){
    if (!live) return '';
    if (!personActive(p)) {
      return '<td class="cc"><span class="why" style="margin:0">cannot sign in</span></td>';
    }
    var st = PWSTATES ? PWSTATES[p.key] : null;
    var pill = st === "set"       ? '<span class="pill good">Set</span>'
             : st === "temporary" ? '<span class="pill warn">Temporary</span>'
             : st === "none"      ? '<span class="pill none">None yet</span>'
             : '<span class="why" style="margin:0">&mdash;</span>';
    return '<td class="cc">' + pill +
      '<button class="linkbu" data-setpw="' + p.key + '">' +
      (st === "none" || !st ? "Set" : "Reset") + '</button></td>';
  }

  var rows = PEOPLE.map(function(p, i){
    return '<tr' + (personActive(p) ? '' : ' class="retired"') + '>' +
      '<td class="idx">' + (i + 1) + '</td>' +
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(p.name) + '" data-pname="' + p.key + '">'
        : '<b>' + esc(p.name) + '</b>') +
        '<span class="why mono">' + esc(p.key) + '</span></td>' +
      /* The job title is information and nothing else. It sits in the register
         because "who is Mennah" is a fair question; it is never read when
         deciding what anyone may see (§33). */
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(p.title || "") + '" data-ptitle="' + p.key +
          '" placeholder="Job title">'
        : (p.title ? '<span class="val">' + esc(p.title) + '</span>'
                   : '<span class="why" style="margin:0">not given</span>')) + '</td>' +
      '<td>' + (editable
        ? '<input class="fld" value="' + esc(p.phone || "") + '" data-pphone="' + p.key +
          '" placeholder="Contact number">'
        : (p.phone ? '<span class="mono">' + esc(p.phone) + '</span>'
                   : '<span class="why" style="margin:0">&mdash;</span>')) + '</td>' +
      '<td>' + roleCell(p) + '</td>' +
      pwCell(p) +
      '<td class="cc">' + (editable
        ? '<button class="rmbtn' + (personActive(p) ? '' : ' on') + '" data-pact="' + p.key + '">' +
            (personActive(p) ? "Retire" : "Restore") + '</button>'
        : '<span class="pill ' + (personActive(p) ? "good" : "none") + '">' +
            (personActive(p) ? "Active" : "Retired") + '</span>' +
          /* Moved here with the rest of the register. Seeing the platform as
             somebody else is how a grant is checked, and it belongs beside the
             person rather than under a matrix. */
          (personActive(p)
            ? '<button class="linkbu" data-as="' + p.key + '">View as</button>' : '')) +
      '</td></tr>';
  }).join("");

  var cols = live ? 7 : 6;
  var addRow = editable
    ? '<tr class="newrow"><td class="idx">+</td><td colspan="' + (cols - 2) + '">' +
        '<input class="fld" id="newPersonName" placeholder="Full name" ' +
          'value="' + esc(NEWPERSON) + '">' +
      '</td><td class="cc"><button class="linkbu" data-padd="1">Add</button></td></tr>'
    : '';

  return cfgHead("People",
      ['<span class="pill kind">SMO</span>',
       plural(PEOPLE.length - retired, "person").replace("persons", "people") + ' active'].concat(
        retired ? [retired + ' retired'] : []).concat(
        noPw ? ['<span class="pill warn">' + noPw + ' with no password</span>'] : []),
      "people", mayEdit, null) +

    section("", "The register",
      "Everyone the platform knows. A role is given here or on the unit's own page — " +
      "it is the same fact either way, so the two can never disagree.",
      '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th>' +
        '<th style="width:20%">Person<span class="why">Their key is their username</span></th>' +
        '<th style="width:16%">Job title<span class="why">Never decides access</span></th>' +
        '<th style="width:12%">Contact</th>' +
        '<th>Roles, and what each is attached to</th>' +
        (live ? '<th class="cc" style="width:13%">Password</th>' : '') +
        '<th class="cc" style="width:10%">Standing</th>' +
      '</tr></thead><tbody>' + rows + addRow + '</tbody></table></div>' +
      (live && noPw
        ? '<div class="note"><b>' + plural(noPw, "person").replace("persons", "people") +
          ' cannot sign in yet.</b> Issue one temporary password to all of them at once — ' +
          'each is asked to choose their own the first time they use it, so the same ' +
          'password never works twice for the same person. Nobody who already has a ' +
          'password is touched.' +
          '<div style="margin-top:10px"><button class="linkbu" data-pwbulk="1">' +
          'Issue temporary passwords</button></div></div>'
        : '') +
      '<div class="note"><b>People are retired, never deleted.</b> Snapshots name whoever ' +
      'entered a figure, so removing the row would turn a closed cycle into one nobody ' +
      'reported. Retiring takes away every role they hold and closes the door — they ' +
      'cannot sign in — while everything already attributed to them stays true.</div>');
}

function renderCompanies(){
  var editable = grant("c_units") === "edit" && EDITING.units;
  return cfgHead("Companies",
      ['<span class="pill kind">SMO</span>',
       COMPANY_KEYS.length + ' ' + (COMPANY_KEYS.length === 1 ? 'company' : 'companies'),
       plural(soloUnits().length, "unit") + ' standing alone'],
      "units", grant("c_units") === "edit") +
    section("", "Companies", null,
      '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th><th style="width:22%">Company</th>' +
        '<th class="cc" style="width:10%">Units</th>' +
        '<th class="cc" style="width:20%">Sees other companies</th>' +
        '<th class="cc" style="width:20%">Sees the group</th></tr></thead><tbody>' +
      COMPANY_KEYS.map(function(ck, i){
        var co = COMPANIES[ck], flag = function(field, val){
          if (!editable) return '<span class="pill ' + (val ? "good" : "none") + '">' +
            (val ? "Yes" : "No") + '</span>';
          return '<select class="fld" data-coflag="' + ck + '|' + field + '">' +
            '<option value="no"' + (val ? "" : " selected") + '>No</option>' +
            '<option value="yes"' + (val ? " selected" : "") + '>Yes</option></select>';
        };
        return '<tr><td class="idx">' + (i+1) + '</td>' +
          '<td><b>' + esc(co.name) + '</b><span class="why mono">key ' + ck + '</span></td>' +
          '<td class="cc"><span class="mono">' + unitsOfCompany(ck).length + '</span></td>' +
          '<td class="cc">' + flag("seeOthers", co.seeOthers) + '</td>' +
          '<td class="cc">' + flag("seeGroup", co.seeGroup) + '</td></tr>';
      }).join("") + '</tbody></table></div>' +
      '<div class="note"><b>A company groups business units so a company CEO sees their own.</b> ' +
      'In this version it carries <b>no score and no page</b> — it decides who sees what, nothing ' +
      'more. Supporting functions belong to no company: they serve all of them. ' +
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
  var unitPick = '<select class="fld" id="fset-unit">' + activeKeys().map(function(k){
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
function renderSourceSetup(){
  var editable = grant("c_source") === "edit";
  var u = UNITS[SRCSET.unit] || UNITS[activeKeys()[0]];
  if (!u) return '<div class="note">No business units yet.</div>';

  /* Anyone the platform knows can be named. NOT only people attached to the
     function: Islam's Finance SMO custodian sits with the office rather than
     in Finance, and a picker that could not offer them would make the feature
     unusable for the one person it was described for. */
  var peopleOptions = function(sel){
    return '<option value="">\u2014</option>' + PEOPLE.filter(personActive).map(function(p){
      return '<option value="' + esc(p.key) + '"' + (p.key === sel ? " selected" : "") + '>' +
        esc(p.name) + (p.title ? " \u2014 " + esc(p.title) : "") + '</option>';
    }).join("");
  };
  var teamOptions = function(sel){
    return '<option value="">\u2014</option>' + FUNCTION_KEYS.map(function(k){
      return '<option value="' + esc(k) + '"' + (k === sel ? " selected" : "") + '>' +
        esc(FUNCTIONS[k].name) + '</option>';
    }).join("");
  };

  var row = function(m){
    var src = m.src && m.src.by ? m.src : null;
    var half = !src && m.src && (m.src.team || m.src.by);
    return '<tr' + (src ? ' class="has-src"' : (half ? ' class="wantnote"' : '')) + '>' +
      '<td>' + esc(m.name) + '</td>' +
      '<td class="cc mono">' + (m.target ? esc(m.target) : '<span class="missing">\u2014</span>') + '</td>' +
      '<td>' + (editable
        ? '<select class="fld" data-srcteam="' + esc(m.id) + '">' +
          teamOptions((src || m.src || {}).team) + '</select>'
        : (src ? esc(srcTeamName(src)) : '<span class="why" style="margin:0">The unit</span>')) + '</td>' +
      '<td>' + (editable
        ? '<select class="fld" data-srcby="' + esc(m.id) + '">' +
          peopleOptions((src || m.src || {}).by) + '</select>'
        : (src ? esc((personBy(src.by) || {}).name || src.by) : "")) +
        (half ? ' <span class="why" style="margin:0">Needs both</span>' : '') + '</td>' +
    '</tr>';
  };

  var body =
    '<tr class="grouprow"><td colspan="4"><b>' + esc(L("keyobj","bu")) + '</b></td></tr>' +
    (u.keyObjectives.length ? u.keyObjectives.map(row).join("")
      : '<tr><td colspan="4" class="why">None set for this unit.</td></tr>') +
    u.items.map(function(p, pi){
      return '<tr class="grouprow"><td colspan="4"><b>' + pillarCode(u, pi) + " " + esc(p.name) +
             '</b></td></tr>' +
        (p.measures.length ? p.measures.map(row).join("")
          : '<tr><td colspan="4" class="why">No key measures.</td></tr>');
    }).join("");

  var unitPick = '<select class="fld" id="srcset-unit">' + activeKeys().map(function(k){
      var n = SMPRules.sourceRows(world()).filter(function(r){ return r.unit === k; }).length;
      return '<option value="' + k + '"' + (k === u.ukey ? " selected" : "") + '>' +
        esc(UNITS[k].name) + (n ? "  \u2014 " + n + " sourced" : "") + '</option>';
    }).join("") + '</select>';

  var total = SMPRules.sourceRows(world()).length;

  return '<div class="kv"><span class="pill kind">SMO</span>' +
      '<span class="pill kind">' + total + ' figure' + (total === 1 ? "" : "s") +
      ' sourced across the group</span></div>' +
    section("", "Source of figures", null,
      '<div class="imp-row" style="margin:0 0 16px">' + unitPick + '</div>' +
      '<table class="cfg"><thead><tr>' +
        '<th style="width:44%">Figure</th><th class="cc" style="width:14%">Target</th>' +
        '<th style="width:21%">Team</th><th style="width:21%">Entered by</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table>' +
      '<div class="note"><b>A sourced figure is entered once, by the team that owns the number.</b> ' +
        'The unit still sees it, still needs it before it can submit, and <b>still writes the ' +
        'note</b> \u2014 the number is Finance\u2019s, the performance is the unit\u2019s, and the ' +
        'explanation belongs to whoever owns the performance. Leave a row empty and the unit ' +
        'enters it itself.</div>');
}

/* The other half of §16.7: a source team is a reporting party like any other,
   so it gets its own surface for the window. Rows come from every unit at
   once — that is the point, Finance enters revenue once per unit in one
   place rather than visiting ten pages. */
function renderMySources(){
  var rows = mySourceRows();
  if (!rows.length) {
    return '<div class="note">You are not named as the source of any figure. ' +
      'The SMO assigns these on <b>Setup &rsaquo; Source of figures</b>.</div>';
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

/* The scope is a business unit OR a capability (§16.4): capability projects
   arrive the way a unit's plan does — same page, same three steps, same
   review — with their own sheets, because the thing being planned is a
   project with deliverables, outcomes and milestones. */
function impIsCap(){ return String(IMP.unit).indexOf("cap:") === 0; }
function impCap(){ return capById(String(IMP.unit).replace(/^cap:/, "")); }

function renderImport(){
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
      '<div class="imp-row"><input type="file" id="imp-file" accept=".xlsx,.csv">' +
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

  var step3 = receipt;

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
      "A plan is archived here whenever an upload replaces one. Nothing has been replaced yet.",
      '<div class="note">Empty. Upload a plan on <b>Import</b> and the plan it displaces will ' +
      'appear here, with a way to put it back.</div>');

  var rows = ARCHIVES.map(function(a){
    var c = a.counts || {};
    var held = a.kind === "unit"
      ? [c.pillars + " pillars", c.measures + " measures", c.tactics + " tactics",
         c.objectives + " objectives"].join(" &middot; ")
      : [c.projects + " projects", c.deliverables + " deliverables",
         c.outcomes + " outcomes", c.milestones + " milestones"].join(" &middot; ");
    var live = a.kind === "unit" ? UNITS[a.key] : capById(a.key);
    return '<tr><td><b>' + esc(a.name) + '</b>' +
        (live ? '' : '<span class="why">no longer in the platform &mdash; cannot be restored</span>') +
        '</td>' +
      '<td class="cc">' + esc(a.at) + '</td>' +
      '<td>' + esc(a.by || "\u2014") + '<span class="why">' + esc(a.why || "") + '</span></td>' +
      '<td>' + held +
        (c.reported
          ? '<span class="why">' + c.reported + ' reported figure' + (c.reported === 1 ? '' : 's') + ' kept with it</span>'
          : '<span class="why">nothing reported</span>') + '</td>' +
      '<td class="cc">' + (can && live
        ? '<button class="editbtn" data-restore="' + esc(a.id) + '">Restore</button> ' +
          '<button class="rmbtn" data-forget="' + esc(a.id) + '">Delete</button>'
        : '<span class="pill none">View only</span>') + '</td></tr>';
  }).join("");

  return section("", "Archived plans",
    "Every plan an upload replaced, newest first. Restoring puts one back and archives whatever " +
    "is there now \u2014 the same act in reverse, with the same warning.",
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
            : '<button class="editbtn" data-opencycle="1">Open a new cycle</button>')
        : '') +
    '</div>' +
    '<div class="fstrip-body">' +
      '<div class="kpi"><b>' + t.done + '</b><span>of ' + t.total + ' items reported</span></div>' +
      '<div class="fchips"><span class="badge b-done">' + t.sub + ' submitted</span>' +
        '<span class="badge b-part">' + (activeKeys().length - t.sub - t.none) + ' in progress</span>' +
        (t.none ? '<span class="badge b-late">' + t.none + ' not started</span>' : '') + '</div>' +
      '<div class="fmean">plan edits: ' + (open ? "SMO only while open" : "open to unit owners") + '</div>' +
    '</div></div>';

  return '<div class="kv"><span class="pill kind">SMO</span>' +
      '<span class="pill kind">' + esc(REVIEW.cadence) + '</span></div>' + head +
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
                    '. The definitions stand.</span>' +
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

  return cfgHead("Supporting functions",
      ['<span class="pill kind">SMO</span>', activeFunctionKeys().length + ' active',
       GROUP.capabilities.length + ' capabilities'],
      "fns", grant("c_fns") === "edit", "fnall",
      ["Clear all progress", "Clear all plans"]) +
    section("", "", null,
      '<div class="cfg"><table><thead><tr><th class="idx">#</th><th style="width:20%">Function</th>' +
        '<th style="width:14%">Shown in the nav</th><th class="cc" style="width:8%">Code</th>' +
        '<th class="cc" style="width:10%">Capabilities</th>' +
        '<th class="cc" style="width:16%">Head</th><th class="cc" style="width:16%">Strategy custodian</th>' +
        '<th class="cc" style="width:10%">Status</th></tr></thead>' +
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
      '<td><b>' + esc(c.name) + '</b></td>' +
      '<td>' + (editable
        ? '<select class="fld" data-capfn="' + i + '">' +
            '<option value="">\u2014 unassigned \u2014</option>' +
            FUNCTION_KEYS.map(function(k){
              return '<option value="' + k + '"' + (k === c.fn ? " selected" : "") + '>' +
                esc(FUNCTIONS[k].name) + '</option>';
            }).join("") + '</select>'
        : '<span class="val">' + esc(f ? f.name : "\u2014") + '</span>') + '</td>' +
      '<td class="nowrapcell">' + esc(f ? (personName(f.head) || "\u2014") : "\u2014") + '</td>' +
      '<td class="num">' + c.keyObjectives.length + '</td>' +
      '<td class="num">' + c.projects.length + '</td></tr>';
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
        '<th class="cc">Key objectives</th><th class="cc">Projects</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
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
