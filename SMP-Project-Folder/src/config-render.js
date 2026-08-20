/* ── CONFIGURATION SCREENS ───────────────────────────────────────────────
   Labels · Levels & access · and the factor editor that extends Weighting.
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
    : '<div class="note"><b>No collisions.</b> Every display label at each level is unique, so no two entities can render under the same word.</div>';

  return '<p class="lede">Every level of the model carries an <strong>internal name</strong> the platform is built on, and a <strong>display label</strong> the tenant sees. The internal name never changes. <strong>The SMO manages this, not the client</strong> &mdash; which is what stops a label collision reaching a screen.</p>' +

    '<div class="kv"><span class="pill kind">Scope: per tenant</span>' +
    '<span class="pill kind">Managed by: SMO</span>' +
    '<span class="pill ' + (editable ? "good" : "none") + '">' + (editable ? "Editable" : "Read only for this viewer") + '</span></div>' +

    section("", "Labels", null,
      '<div class="cfg"><table><thead><tr>' +
      '<th style="width:34%">Internal name<span class="why">The contract. Never changes.</span></th>' +
      '<th style="width:33%">Display at group level</th>' +
      '<th style="width:33%">Display at business unit level</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' + warn) +

    '<div class="note"><b>Labels are per tenant, not per strategy cycle.</b> A cycle-scoped label would let 2026 and 2027 use different words for the same object, and no report spanning both could be read without a glossary.</div>' +

    '<div class="note"><b>Vision, End State and Winning Aspiration are one entity.</b> They are three display labels for the same statement, which is why a unit holds exactly one of them and never two.</div>';
}

/* ── Levels & access ────────────────────────────────────────────────── */
function stateCell(levelKey, pageKey, editable){
  var v = ACCESS[levelKey][pageKey];
  if (!editable) {
    return '<td class="ac"><span class="st st-' + v + '">' + v + '</span></td>';
  }
  var opts = ["none","view","edit"].map(function(o){
    return '<button type="button" class="stbtn' + (o === v ? " on " + o : "") + '" data-ac="' +
      levelKey + '|' + pageKey + '|' + o + '" aria-label="' + o + '">' +
      (o === "none" ? "&minus;" : o === "view" ? "&#128065;" : "&#9998;") + '</button>';
  }).join("");
  return '<td class="ac"><span class="stset">' + opts + '</span></td>';
}

function renderAccess(){
  var editable = grant("c_access") === "edit";
  var levels = [SMO_ROLE].concat(LEVELS);

  var groups = [
    { name:"Group pages",    keys:["g_perf","g_found","g_temple","g_weight"] },
    { name:"Business unit pages", keys:["u_perf","u_found","u_anal"] },
    { name:"Configuration",  keys:["c_labels","c_access"] }
  ];

  var head = '<tr><th style="width:24%">Page</th>' + levels.map(function(l){
    return '<th class="ac"><div class="factor-h"><b>' + esc(l.name) + '</b><span>' +
      esc(l.titles || "Super user") + '</span></div></th>';
  }).join("") + '</tr>';

  var body = groups.map(function(g){
    return '<tr class="grouprow"><td colspan="' + (levels.length + 1) + '">' + esc(g.name) + '</td></tr>' +
      g.keys.map(function(pk){
        var p = PAGES.filter(function(x){ return x.key === pk; })[0];
        return '<tr><td><b>' + esc(p.label) + '</b><span class="why">' + esc(p.note) + '</span></td>' +
          levels.map(function(l){ return stateCell(l.key, pk, editable); }).join("") + '</tr>';
      }).join("");
  }).join("");

  var levelRows = LEVELS.map(function(l){
    return '<tr><td><b>' + esc(l.name) + '</b></td><td>' +
      (editable ? '<input class="lvl" data-lvl="' + l.key + '" value="' + esc(l.titles) + '" aria-label="Titles at ' + esc(l.name) + '" />'
                : '<span class="mono">' + esc(l.titles) + '</span>') +
      '</td><td><span class="why" style="margin:0">' + esc(l.note) + '</span></td></tr>';
  }).join("");

  var peopleRows = PEOPLE.map(function(p){
    var lv = p.level === "smo" ? SMO_ROLE : LEVELS.filter(function(x){ return x.key === p.level; })[0];
    return '<tr><td><b>' + esc(p.name) + '</b><span class="why">' + esc(p.title) + '</span></td>' +
      '<td><span class="pill kind">' + esc(lv.name) + '</span></td>' +
      '<td><span class="pill ' + (p.unit === "group" ? "theme" : "kind") + '">' +
        /* A person may belong to a supporting function rather than a business
           unit \u2014 Finance and HR are not units and never will be. */
        (p.unit === "group" ? "Group &mdash; all units"
         : p.unit && UNITS[p.unit] ? esc(UNITS[p.unit].name)
         : p.fn && FUNCTIONS[p.fn] ? esc(FUNCTIONS[p.fn].name) + " &mdash; function"
         : "\u2014") + '</span></td>' +
      '<td><button class="linkbu" data-as="' + p.key + '">View as this person &rarr;</button></td></tr>';
  }).join("");

  return '<p class="lede">Access is <strong>page level only</strong>. If a level can open a page, it sees everything on that page &mdash; restriction happens by removing the page, never by trimming its contents. A person carries a <strong>level</strong>, which decides which pages, and a <strong>unit attachment</strong>, which decides whose.</p>' +

    '<div class="kv"><span class="pill kind">Page level, never per element</span>' +
    '<span class="pill kind">Three states: none / view / edit</span>' +
    '<span class="pill ' + (editable ? "good" : "none") + '">' + (editable ? "Editable" : "Read only for this viewer") + '</span></div>' +

    section("", "The visibility matrix",
      "Pre-filled with a working default. Change any cell and the navigation above re-renders immediately for whoever is currently being viewed as.",
      '<div class="cfg acgrid"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="chart-legend" style="margin-top:12px">' +
        '<span><i class="st st-none">none</i> no access, page hidden</span>' +
        '<span><i class="st st-view">view</i> reads, cannot change</span>' +
        '<span><i class="st st-edit">edit</i> reads and changes</span></div>' +
      '<div class="note"><b>The CEO views weighting but does not manage it.</b> That single row is why a cell needs three states rather than two &mdash; visible and editable are different grants, and collapsing them would either lock the CEO out or hand them the model.</div>') +

    section("", "Levels and titles",
      "Levels travel between clients; titles do not. Each tenant maps its own titles onto the ladder.",
      '<div class="cfg"><table><thead><tr><th style="width:12%">Level</th><th style="width:40%">Titles at this level</th><th>What sits here</th></tr></thead><tbody>' +
      levelRows + '</tbody></table></div>' +
      '<div class="note"><b>The SMO is not a level.</b> An SMO manager might sit at N-2 and still need edit rights no N-1 has, so it is held as a super user beside the ladder rather than a rung on it.</div>') +

    section("", "People",
      "Level plus unit attachment. Two people at N-1 reach the same page types but different units &mdash; which is why the matrix alone cannot express access.",
      '<div class="cfg"><table><thead><tr><th style="width:34%">Person</th><th>Level</th><th>Attached to</th><th>Simulate</th></tr></thead><tbody>' +
      peopleRows + '</tbody></table></div>' +
      '<div class="note"><b>Ashraf and Hossam are both N-1.</b> The matrix grants both the same page types; their unit attachment is what sends one to Mobile and the other to Retail. A person attached to the group reaches every unit.</div>');
}

/* ── The factor editor, appended to the Weighting page ──────────────── */
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
        var pf = PRIOR_CYCLE.factors.filter(function(x){ return x.key === f.key; })[0];
        if (!pf) return "new this cycle";
        var d = f.weight - pf.weight;
        return pf.weight + "% &rarr; " + (d === 0 ? "unchanged"
          : '<b style="color:' + (d > 0 ? "var(--good)" : "var(--warn)") + '">' + (d > 0 ? "+" : "\u2212") + Math.abs(d) + '</b>');
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
      '<th style="width:22%">' + PRIOR_CYCLE.year + ' cycle</th><th style="width:10%"></th>' +
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

  return '<p class="lede">One scale for every figure scored against a benchmark. <strong>Performance is actual over target; execution is delivered over plan</strong> &mdash; the same kind of number, so both read on these bands. The colour and the status word come from the same place, so they can never contradict each other.</p>' +

    '<div class="kv"><span class="pill kind">Scope: per tenant</span>' +
    '<span class="pill kind">One standing scale</span>' +
    '<span class="pill ' + (editable ? "good" : "none") + '">' + (editable ? "Editing" : "View only") + '</span></div>' +

    section("", "Scoring bands",
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
              : '') +
          '</span>'
        : '') +
    '</div></div>';
}

function renderUnits(){
  var editable = grant("c_units") === "edit" && EDITING.units;
  var live = activeUnits().length;

  var rows = UNIT_KEYS.map(function(k, i){
    var u = UNITS[k];
    var wrow = GROUP.weighting.units.filter(function(r){ return r.key === k; })[0];
    var roles = UNIT_ROLES[k] || {};
    var pick = function(role, sel){
      /* Only people attached to this unit can hold either role — the dropdown
         cannot offer someone from another unit. */
      var opts = PEOPLE.filter(function(p){ return p.unit === k; });
      if (!editable) {
        var n = personName(sel);
        return n ? esc(n) : '<span class="why" style="margin:0">unassigned</span>';
      }
      return '<select class="fld" data-urole="' + k + '|' + role + '">' +
        '<option value="">unassigned</option>' +
        opts.map(function(p){
          return '<option value="' + p.key + '"' + (p.key === sel ? " selected" : "") + '>' + esc(p.name) + '</option>';
        }).join("") + '</select>';
    };
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

    section("", "", null,
      '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th><th style="width:20%">Unit</th>' +
        '<th style="width:14%">Shown in the nav</th>' +
        '<th class="cc" style="width:8%">Code</th>' +
        '<th class="cc" style="width:7%">Pillars</th><th class="cc" style="width:9%">Objectives</th>' +
        '<th class="cc" style="width:8%">Weight</th>' +
        '<th class="cc" style="width:16%">BU head</th><th class="cc" style="width:18%">Strategy custodian</th>' +
        '<th class="cc" style="width:10%">Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (editable ? '<div class="addrow"><button class="editbtn" id="addunit">+ Add a business unit</button></div>' : ''));
}

/* ── Import ─────────────────────────────────────────────────────────
   Two templates, one file per unit. Download, fill, upload, review, apply.
   Nothing is written until the differences have been seen. ── */
var IMP = { unit:"mobile", kind:"plan", text:"", diff:null, check:null, done:null };

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
  var editable = grant("c_focus") === "edit" && !CYCLE.locked;
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

  return cfgHead("Business units",
      ['<span class="pill kind">SMO</span>', UNIT_KEYS.length + ' units',
       activeKeys().length + ' active'],
      "units", grant("c_units") === "edit", "all",
      ["Clear all progress", "Clear all plans"]) +
    section("", "", null,
      '<div class="cfg"><table class="unitcfg"><thead><tr>' +
        '<th class="idx" style="width:38px">#</th><th style="width:20%">Unit</th>' +
        '<th style="width:14%">Shown in the nav</th>' +
        '<th class="cc" style="width:8%">Code</th>' +
        '<th class="cc" style="width:7%">Pillars</th><th class="cc" style="width:9%">Objectives</th>' +
        '<th class="cc" style="width:8%">Weight</th>' +
        '<th class="cc" style="width:16%">BU head</th><th class="cc" style="width:18%">Strategy custodian</th>' +
        '<th class="cc" style="width:10%">Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (editable ? '<div class="addrow"><button class="editbtn" id="addunit">+ Add a business unit</button></div>' : ''));
}

/* ── Import ─────────────────────────────────────────────────────────
   Two templates, one file per unit. Download, fill, upload, review, apply.
   Nothing is written until the differences have been seen. ── */
var IMP = { unit:"mobile", kind:"plan", text:"", diff:null, check:null, done:null };

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
  var editable = grant("c_focus") === "edit" && !CYCLE.locked;
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

  var step1 =
    '<div class="imp-step"><div class="imp-n">1</div><div class="imp-b">' +
      '<h4>Download the template</h4>' +
      '<p class="sub">' + (isPlan
        ? "One sheet per part of the plan, with dropdowns instead of ids. Fill it in Excel; the platform reads it back."
        : "One row per reportable item, with its target and what is currently recorded. Only the New value column is typed.") +
      '</p>' +
      '<div class="imp-row">' + unitPick + kindPick +
        '<button class="editbtn" data-dlx="1">Download Excel</button>' +
        '<button class="linkbu" data-dl="1">or the raw CSV</button>' +
        '<button class="linkbu" data-showcsv="1">View the CSV</button></div>' +
      '<p class="sub" style="margin-top:8px">' + counts + '</p>' +
    '</div></div>';

  var step2 =
    '<div class="imp-step"><div class="imp-n">2</div><div class="imp-b">' +
      '<h4>Upload the filled file</h4>' +
      '<p class="sub">' + (isPlan
        ? "Upload the workbook or a CSV. Rows carrying an id are compared against what is recorded; rows without one are new."
        : "Fill the new_value column only where a figure changed. Blank rows are ignored.") + '</p>' +
      '<div class="imp-row"><input type="file" id="imp-file" accept=".xlsx,.csv">' +
        '<button class="linkbu" data-paste="1">or paste the file</button></div>' +
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
  if (d) {
    var changed = d.rows.filter(function(r){ return r.status === "changed"; });
    var added   = d.rows.filter(function(r){ return r.status === "new"; });
    var same    = d.rows.filter(function(r){ return r.status === "same"; });
    var unknown = d.rows.filter(function(r){ return r.status === "unknown"; });

    var body = "";
    if (isPlan) {
      body = changed.length || added.length
        ? '<div class="scroll"><table><thead><tr><th>Item</th><th class="cc">Type</th>' +
            '<th>Field</th><th>Recorded</th><th>In the file</th></tr></thead><tbody>' +
          changed.map(function(r){
            return r.changes.map(function(c, i){
              return '<tr><td>' + (i === 0 ? esc(r.name) : '') + '</td>' +
                '<td class="cc">' + (i === 0 ? '<span class="pill kind">' + r.type + '</span>' : '') + '</td>' +
                '<td>' + c.f + '</td><td class="was">' + esc(c.was) + '</td>' +
                '<td class="now">' + esc(c.now) + '</td></tr>';
            }).join("");
          }).join("") +
          added.map(function(r){
            return '<tr><td>' + esc(r.name || r.id) + '</td><td class="cc"><span class="pill kind">' + r.type + '</span></td>' +
              '<td colspan="3"><span class="pill good">New \u2014 will be created</span></td></tr>';
          }).join("") +
          '</tbody></table></div>'
        : '<div class="note">Nothing differs from what is recorded.</div>';
    } else {
      body = changed.length
        ? '<div class="scroll"><table><thead><tr><th>' + (isCap ? "Project" : L("pillar","bu")) + '</th><th>Item</th>' +
            '<th class="cc">Type</th><th class="cc">Recorded</th><th class="cc">In the file</th></tr></thead><tbody>' +
          changed.map(function(r){
            return '<tr><td>' + esc(r.pillar) + '</td><td>' + esc(r.name) + '</td>' +
              '<td class="cc"><span class="pill kind">' + r.type + '</span></td>' +
              '<td class="num was">' + esc(r.was) + '</td><td class="num now">' + esc(r.now) + '</td></tr>';
          }).join("") + '</tbody></table></div>'
        : '<div class="note">No reported figure differs from what is recorded.</div>';
    }

    step3 =
      '<div class="imp-step"><div class="imp-n">3</div><div class="imp-b">' +
        '<h4>Review, then apply</h4>' + checkBlock +
        '<div class="imp-tally">' +
          '<span class="pill attn">' + changed.length + ' changed</span>' +
          (isPlan ? '<span class="pill good">' + added.length + ' new</span>' : '') +
          (isPlan ? '<span class="pill kind">' + same.length + ' unchanged</span>' : '') +
          (d.missing.length ? '<span class="pill warn">' + d.missing.length + ' in the platform, absent from the file</span>' : '') +
          (unknown.length ? '<span class="pill bad">' + unknown.length + ' unrecognised id</span>' : '') +
        '</div>' + body +
        (d.missing.length
          ? '<div class="note"><b>Absent from the file, kept.</b> ' + d.missing.length +
            ' item' + (d.missing.length > 1 ? 's are' : ' is') + ' recorded but missing from the upload &mdash; ' +
            'they are reported, never removed. A missing row is more often an editing slip than a decision to ' +
            'delete something with reported history against it.</div>'
          : '') +
        (changed.length || added.length
          ? '<div class="imp-row" style="margin-top:14px">' +
            (blocked
              ? '<button class="editbtn" disabled style="opacity:.45;cursor:not-allowed">Apply blocked</button>'
              : '<button class="editbtn apply" data-apply="1">Apply to ' + esc(u.name) + '</button>') +
            '<button class="linkbu" data-cancel="1">Discard</button></div>'
          : '') +
      '</div></div>';
  }

  return '<div class="kv"><span class="pill kind">SMO only</span>' +
      '<span class="pill kind">One file per unit or capability</span></div>' +
    section("", (isPlan ? "Plan" : "Progress") + " import", null,
      '<div class="imp">' + step1 + step2 + step3 + '</div>');
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
  var pick = function(role, current, fk){
    if (!editable) {
      var n = personName(current);
      return n ? esc(n) : '<span class="why" style="margin:0">unassigned</span>';
    }
    return '<select class="fld" data-fnrole="' + fk + '|' + role + '">' +
      '<option value="">unassigned</option>' +
      PEOPLE.map(function(p){
        return '<option value="' + p.key + '"' + (p.key === current ? " selected" : "") + '>' +
          esc(p.name) + '</option>';
      }).join("") + '</select>';
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
      (editable ? '<div class="addrow"><button class="editbtn" id="addfn">+ Add a supporting function</button></div>' : '') +
      '<div class="note"><b>The short name is for the navigation only.</b> Leave it blank and the ' +
        'full name is used. Page titles and every export keep the full name.</div>' +
      '<div class="note">A function carries no plan, no weight and no pillars \u2014 it improves a ' +
        'cross-cutting capability the whole group depends on. The <b>code prefix</b> numbers the work ' +
        'it owns, the way a unit\'s prefix numbers its pillars.</div>' +
      '<div class="note">A function is <b>retired, never deleted</b>: it carries reported history, ' +
        'and removing it would rewrite what was already said. <b>The custodian slot is optional</b> \u2014 ' +
        'where the head does the work themselves they already have access as head.</div>');
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
