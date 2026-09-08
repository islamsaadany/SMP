/* ══ SETTING A CLIENT UP (§303, spec 042) ═══════════════════════════════

   Islam: *"any Consultant who gets into the platform and adds a new client to
   set up this client he needs to go through a series of questions … there
   needs to be a buildup of some sort of wizard that builds with the Consultant
   showing him some sort of visuals so he can see what this means and what this
   looks like."* Drawn first and signed off from
   `design-mockups/onboarding-wizard/2026-09-07_set-up-a-client.html`.

   FOUR DECISIONS SHAPE EVERYTHING HERE, all his:

   · A MARCH FOR THE SHAPE, A MAP AFTER. The steps run in an order because
     they cascade — you cannot name a function's capabilities before the
     function exists — but every one is openable from the rail at any time.
     Once the shape is set the CONTENT is the plan builder (§129), which is a
     map; this wizard deliberately stops at its door.

   · IT BUILDS UP RATHER THAN INTERROGATES: *"the wizard should be dynamic in a
     way that accepts a build up of these different setups, allocation, naming
     type of plans for each."* Units, functions and a function's capabilities
     are lists you add to, and every function carries its own plan type — so
     one client runs both plan types at once.

   · LIVE IMMEDIATELY, NOTHING STORED. Every answer writes to the graph as it
     is given, exactly as a pen edit does. `WIZ` holds which step is open and
     nothing else: it is a screen mode, never state-graph content (§25, §47.1),
     and progress is DERIVED from the data — so pausing costs nothing, there is
     no draft flag for anybody to forget to clear, and the shape drawn on the
     right cannot fall out of step with the answers, because there is no second
     copy of them (§129's rule, applied one level up).

   · WHAT THE PLATFORM CANNOT DO YET IS DRAWN AND DULLED. Islam: *"keep the
     mockup as is but kepe the non existing parts dull for now"*, and *"don't
     build things that doesn't exist now in the platform … i will take it to
     another discussion to build what's missing."* So the capabilities step and
     the third plan type are DRAWN, inert, and each says *Later*. This is a
     deliberate exception to §61/§94.15 — a control with nothing behind it is
     normally furniture — taken on his instruction, and its cost is stated: the
     consultant meets two greyed choices. Every one of them names itself, which
     is the one thing a greyed control must do or it reads as broken.

   AND NOTHING HERE WRITES THROUGH A SECOND DOOR (§53.5). Units, companies,
   functions and capabilities are minted by `addBusinessUnit`, `addCompany`,
   `addFunction` and `addCapability` — the same minters Setup and the plan
   builder use — and every FIELD carries the attribute the platform's own
   Setup wiring already looks for (`data-uname`, `data-ucomp`, `data-fname`,
   `data-fnformat`, `input.lbl`), so the writer is the platform's rather than
   a copy of it. The wizard is a guided way through Setup, not a second store.

   WHAT THIS FILE IS AND IS NOT. It holds the wizard's state, its HTML and its
   data logic. It never calls paint(), never touches `current`, the modal or
   any other shell-closure state: the shell owns navigation and wires the
   `data-w*` attributes this file's HTML carries, exactly as it does the
   builder's `data-b*`. */

var WIZ = null;          /* { at, seen:[] } while the wizard is open */

var WIZ_STEPS = [
  { k:"client", key:"The organisation", label:"The client",     q:"Which client are you setting up?" },
  { k:"year",   key:"The organisation", label:"The year",       q:"Which year is this plan for?" },
  { k:"units",  key:"The organisation", label:"Business units", q:"What are the business units?" },
  { k:"cos",    key:"The organisation", label:"Companies",      q:"Are the units grouped into companies?", optional:1 },
  { k:"caps",   key:"Strategy",         label:"Capabilities",   q:"Are there capabilities beside the units?", later:1 },
  { k:"fns",    key:"Strategy",         label:"Functions",      q:"What supporting functions are there?", optional:1 },
  { k:"words",  key:"Language",         label:"The words",      q:"What does this client call these things?", optional:1 },
  { k:"office", key:"People",           label:"The office",     q:"Who runs the strategy office?", optional:1 },
  { k:"done",   key:"Done",             label:"Summary",        q:"" }
];
var WIZ_LAST = WIZ_STEPS.length - 1;

/* THE TWO PLAN TYPES THE PLATFORM ACTUALLY HAS, and the one it does not.
   Read from `fnFormat`'s own two values (config-data.js) rather than written
   out again; the third carries `later:0` and is drawn disabled. */
var WIZ_FORMATS = [
  { v:"pillars",    label:"Pillars",
    why:"The same shape a business unit has &mdash; pillars, key measures and tactics. Its plan sits on the function itself.",
    live:1 },
  { v:"projects",   label:"Capabilities &amp; projects",
    why:"The function holds capabilities; each capability holds projects, with deliverables, outcomes and milestones.",
    live:1 },
  { v:"objectives", label:"Objectives &amp; actions",
    why:"Objectives measured like a key measure, actions under them with a due date, and requirements raised on other functions.",
    live:0 }
];
var WIZ_LATER = "Not built yet — a separate discussion.";

/* ── Where the wizard is, and whether it is here ──────────────────────── */
function wizOpen(){ return !!WIZ; }
function wizAt(){ return WIZ ? WIZ.at : 0; }
function wizStep(){ return WIZ_STEPS[wizAt()] || WIZ_STEPS[0]; }
function wizSeen(i){ return !!(WIZ && WIZ.seen.indexOf(i) > -1); }

/* A TENANT NOBODY HAS SHAPED YET. The Overview's loud door is drawn only
   while this is true — once there are units, the rail entry is the way in and
   a second shouting door on the landing page would be furniture (§94.15). */
function wizTenantBare(){ return !UNIT_KEYS.length && !FUNCTION_KEYS.length; }

/* ── PROGRESS IS DERIVED, NEVER STORED (§129) ─────────────────────────
   A step is answered when the DATA says so. The optional steps — a client may
   legitimately have no companies and no functions — fall back to "you have
   been here", because there is nothing to read and an eternally unticked step
   reads as unfinished work that does not exist. */
function wizAnswered(i){
  var s = WIZ_STEPS[i];
  if (!s || s.later) return false;
  if (s.k === "client") return !!String(GROUP.org || "").trim();
  if (s.k === "year")   return horizonSet();
  if (s.k === "units")  return UNIT_KEYS.length > 0;
  if (s.k === "done")   return false;
  return wizSeen(i);
}

/* ── The rail ─────────────────────────────────────────────────────────── */
function wizRailHtml(){
  return '<nav class="wzrail" aria-label="Set-up steps">' + WIZ_STEPS.map(function(s, i){
    var here = i === wizAt(), done = !here && wizAnswered(i);
    return '<button type="button" class="wzstep' + (done ? " done" : "") +
      (s.later ? " wzlater" : "") + '" data-wgo="' + i + '"' +
      (here ? ' aria-current="step"' : "") + '>' +
      '<span class="wzn">' + (done ? "&#10003;" : (i + 1)) + '</span>' + esc(s.label) +
      '</button>';
  }).join("") + '</nav>';
}

/* ── A choice, with its own small drawing ─────────────────────────────── */
var WIZ_PIC = {
  pillars: '<span class="wzm navy"></span><span class="wzm row"><i class="on"></i><i class="on"></i><i class="on"></i></span><span class="wzm thin"></span><span class="wzm thin"></span>',
  projects:'<span class="wzm navy"></span><span class="wzm gold"></span><span class="wzm row"><i></i><i></i></span><span class="wzm row"><i></i><i></i><i></i></span>',
  objs:    '<span class="wzm navy"></span><span class="wzm row"><i class="on"></i><i class="on"></i></span><span class="wzm thin"></span><span class="wzm row"><i></i><i></i><i></i></span>',
  many:    '<span class="wzm navy"></span><span class="wzm row"><i class="on"></i><i class="on"></i><i class="on"></i></span>',
  co:      '<span class="wzm gold"></span><span class="wzm row"><i class="on"></i><i class="on"></i></span><span class="wzm row"><i></i><i></i><i></i></span>'
};
function wizChoice(on, name, why, pic, attr){
  return '<button type="button" class="wzchoice" aria-pressed="' + (on ? "true" : "false") + '"' +
    (attr || "") + '><span class="wzpic">' + pic + '</span>' +
    '<span><span class="wzcname">' + name + '<span class="wztick">&#10003;</span></span>' +
    '<span class="wzcwhy">' + why + '</span></span></button>';
}
/* ITS OWN BUILDER, NEVER A FLAG ON wizChoice (§61): a dulled option is inert
   by construction — a `<div>` with no handler to reach — rather than a button
   that stays pressable the day somebody forgets to check the flag. */
function wizChoiceLater(name, why, pic){
  return '<div class="wzchoice wzlater" aria-disabled="true"><span class="wzpic">' + pic + '</span>' +
    '<span><span class="wzcname">' + name + '<span class="wztag">Later</span></span>' +
    '<span class="wzcwhy">' + why + '</span></span></div>';
}

/* THE PLAN-TYPE CONTROL IS THE FUNCTIONS PAGE'S OWN, NOT A SECOND ONE.
   The first build wrote its own select here and dropped two things
   `planFormatCell` carries: the tenant's own word for a pillar (L("pillar"))
   and — the one that matters — the GUARD. A function that already holds
   capabilities cannot become a pillars one and a function holding pillars
   cannot go back, because switching would not delete the work, it would stop
   DRAWING it, which is worse. That control shows the reason and disables
   itself; mine would have offered the switch and let the page silently stop
   rendering somebody's plan. §53.5 caught in the act: two controls for one
   decision, and the newer one forgot why the older one was careful.

   The third plan type is therefore NOT on this select — it is not a real
   answer, and §61 says an option that cannot be taken does not belong on the
   control that takes them. It is drawn, dulled and named in the choice cards
   below, which is where the explanation lives. */

/* ── Each step's body ─────────────────────────────────────────────────── */
function wizBodyHtml(){
  var k = wizStep().k;

  if (k === "client")
    return '<div class="wzfields"><div class="wzfield">' +
      '<label for="wz-org">The client&rsquo;s name</label>' +
      '<input id="wz-org" type="text" class="fld" data-worg="1" value="' + esc(GROUP.org || "") + '">' +
      '<span class="wzhint">What the platform is named after, everywhere &mdash; the chrome, ' +
      'the review deck and every email that leaves.</span></div></div>';

  if (k === "year")
    return '<div class="wzfields"><div class="wzfield">' +
      '<label for="wz-yr">The plan runs to</label>' +
      '<input id="wz-yr" type="text" class="fld mono yr" data-wyear="1" value="' +
        esc(GROUP.horizon == null ? "" : GROUP.horizon) + '">' +
      '<span class="wzhint">The horizon every 3-year target is measured against. ' +
      'Left blank, the platform reads as though there were none rather than trailing a dangling ' +
      '&ldquo;by&rdquo;.</span></div></div>';

  if (k === "units")
    return (UNIT_KEYS.length
      ? '<div class="wzrows">' + UNIT_KEYS.map(function(u){
          return '<div class="wzrow"><span class="wznm">' +
            '<input type="text" class="fld" data-uname="' + esc(u) + '" value="' + esc(UNITS[u].name) + '">' +
            '</span><span class="wzrt"><span class="wzcode">' + esc(UNITS[u].codePrefix) + '</span>' +
            '</span></div>'; }).join("") + '</div>'
      : '<p class="wzempty">No business units yet.</p>') +
      '<button class="wzadd" type="button" data-wadd="unit">+ Add a business unit</button>' +
      '<p class="wzwhy">A unit plans in pillars, with key measures and tactics under each. ' +
      'The code is minted from the name and prefixes every pillar on it.</p>';

  if (k === "cos"){
    var cos = activeCompanyKeys();
    return '<div class="wzchoices">' +
      wizChoice(!cos.length, "No &mdash; the units sit directly under " + esc(GROUP.org || "the group"),
        "One less layer to explain. Companies can be added later without touching a single plan.",
        WIZ_PIC.many, ' data-wnoco="1"') +
      wizChoice(cos.length > 0, "Yes &mdash; group them into companies",
        "A company holds several units and decides who can see across them. It carries no plan and no score of its own.",
        WIZ_PIC.co, ' data-wadd="co"') +
      '</div>' +
      (cos.length
        ? '<div class="wzrows" style="margin-top:14px">' + cos.map(function(c){
            return '<div class="wzrow"><span class="wznm">' +
              '<input type="text" class="fld" data-coname="' + esc(c) + '" value="' + esc(COMPANIES[c].name) + '">' +
              '</span><span class="wzrt"><span class="wzcode">' +
              plural(unitsOfCompany(c).length, "unit") + '</span></span></div>'; }).join("") +
          '</div>' +
          '<div class="wzwhy" style="margin-top:12px">Which company each unit belongs to is set beside ' +
          'the unit on Setup &rsaquo; Business units &mdash; one field, one place (§130.6).</div>'
        : "");
  }

  if (k === "caps")
    return '<p class="wzwhy" style="margin-top:0">A capability is strategic work that sits beside the ' +
      'business units, planned in pillars, and owned by a function head.</p>' +
      '<div class="wzlaterline"><b>' + WIZ_LATER + '</b> The platform has capabilities today only ' +
      'underneath a function that plans in capabilities and projects &mdash; not as their own entry on the ' +
      'strategic side. Drawn here so the whole shape reads; it does nothing yet.</div>' +
      '<div class="wzrows wzlater" style="margin-top:12px">' +
      '<div class="wzrow"><span class="wznm">A capability beside the units</span>' +
      '<span class="wzrt"><span class="wztag">Later</span></span></div></div>';

  if (k === "fns")
    return (FUNCTION_KEYS.length
      ? FUNCTION_KEYS.map(function(fk){
          var f = FUNCTIONS[fk], caps = capsOfFunction(fk);
          var h = '<div class="wzrow"><span class="wznm">' +
            '<input type="text" class="fld" data-fname="' + esc(fk) + '" value="' + esc(f.name) + '">' +
            '</span><span class="wzrt"><span class="wzkey">plans in</span>' +
            planFormatCell(fk, f, true) + '</span></div>';
          if (fnFormat(f) === "projects")
            h += '<div class="wznest">' +
              (caps.length
                ? caps.map(function(c){
                    return '<div class="wznestrow"><span class="wzdot"></span>' + esc(c.name) + '</div>'; }).join("")
                : '<div class="wznestrow wzquiet">No capabilities yet</div>') +
              '<button class="wzadd wznestadd" type="button" data-wadd="cap" data-wfn="' + esc(fk) + '">' +
              '+ Add a capability to ' + esc(f.name) + '</button></div>';
          return h;
        }).join("")
      : '<p class="wzempty">No supporting functions yet. A client can have none.</p>') +
      '<button class="wzadd" type="button" data-wadd="fn">+ Add a supporting function</button>' +
      '<div class="wzkey" style="margin-top:20px">What each plan type means</div>' +
      '<div class="wzchoices" style="margin-top:8px">' +
      WIZ_FORMATS.map(function(f){
        return f.live
          ? wizChoice(false, f.label, f.why, f.v === "pillars" ? WIZ_PIC.pillars : WIZ_PIC.projects)
          : wizChoiceLater(f.label, f.why + " <b>Not built yet.</b>", WIZ_PIC.objs);
      }).join("") + '</div>';

  if (k === "words") return wizWordsHtml();

  if (k === "office"){
    var office = PEOPLE.filter(function(p){
      return p.active !== false && personRoleKeys(p).some(SMPRules.isOfficeRole);
    });
    return (office.length
      ? '<div class="wzrows">' + office.map(function(p){
          return '<div class="wzrow"><span class="wznm">' + esc(p.name) + '</span>' +
            '<span class="wzrt"><span class="wzkey">' +
            personRoleKeys(p).filter(SMPRules.isOfficeRole).map(roleName).join(" &middot; ") +
            '</span></span></div>'; }).join("") + '</div>'
      : '<p class="wzempty">Nobody holds an office seat yet.</p>') +
      '<button class="wzadd" type="button" data-setupgo="people">' +
      'Open the People register &rsaquo;</button>' +
      '<p class="wzwhy">Seats are given on the register, which is the one door onto a person ' +
      '(§87: who a row IS is asked in one place, and a second adder here would be a second ' +
      'answer to it). Unit heads, custodians and function heads are given their roles there too.</p>';
  }

  return wizSummaryHtml();
}

/* ── THE WORDS, GENERATED FROM THE SHAPE (Islam: "this needs to be dynamic
   as each client has it's own naming") ─────────────────────────────────
   The platform's own eight label entries, each with the reason it is being
   asked about THIS client — and the rows a client's shape does not use are
   not drawn at all. The cells carry `class="lbl" data-lbl data-scope`, which
   is what the Terminology page's own writer looks for, so the wizard changes
   where the question is asked and nothing about how the answer is stored. */
function wizWordsHtml(){
  var anyProj = FUNCTION_KEYS.some(function(fk){ return fnFormat(FUNCTIONS[fk]) === "projects"; });
  var why = {
    theme:      "The group's standing columns",
    pillar:     UNIT_KEYS.length ? "Every business unit plans in these" : "Used once a unit exists",
    keyobj:     "A unit's own scorecard",
    aspiration: "On the group and on every unit",
    purpose:    "The group holds this alone",
    values:     "The group holds this alone",
    measure:    "Under a pillar",
    tactic:     "Under a pillar"
  };
  var rows = LABELS.entries.map(function(e, i){
    return { e:e, i:i, why:why[e.key] || "" };
  });
  var cell = function(e, i, which){
    if (e[which] === "—") return '<td><span class="pill none">Not held</span></td>';
    return '<td><input class="lbl fld" data-lbl="' + i + '" data-scope="' + which +
      '" value="' + esc(e[which]) + '" aria-label="' + esc(e.internal) + ' at ' + which + '"></td>';
  };
  return '<div class="wztbl"><table><thead><tr>' +
      '<th style="width:24%">What it is</th><th style="width:23%">At the group</th>' +
      '<th style="width:23%">At a unit</th><th style="width:30%">Where it is used here</th>' +
    '</tr></thead><tbody>' +
    rows.map(function(r){
      return '<tr><td><b>' + esc(r.e.internal) + '</b></td>' +
        cell(r.e, r.i, "group") + cell(r.e, r.i, "bu") +
        '<td class="wzours">' + esc(r.why) + '</td></tr>';
    }).join("") +
    (anyProj
      ? '<tr class="wzlater"><td><b>Capability</b> <span class="wztag">Later</span></td>' +
        '<td colspan="2"><span class="wzours">Named on Setup &rsaquo; Capabilities</span></td>' +
        '<td class="wzours">A function plans in capabilities</td></tr>'
      : "") +
    '</tbody></table></div>' +
    '<p class="wzwhy">Two words for each thing, because the group and a unit often call it ' +
    'differently. This is the Terminology page&rsquo;s own table, asked once here with the reason ' +
    'beside it &mdash; every word stays editable there afterwards.</p>';
}

/* ── The summary, and the two doors ───────────────────────────────────── */
function wizSummaryHtml(){
  var cos = activeCompanyKeys();
  var lines = [
    ["The client",     String(GROUP.org || "").trim() || "Not named yet", 0],
    ["The year",       horizonSet() ? String(GROUP.horizon) : "Not set", 1],
    ["Business units", UNIT_KEYS.length
        ? UNIT_KEYS.map(function(k){ return UNITS[k].name; }).join(" · ") : "None yet", 2],
    ["Companies",      cos.length
        ? cos.map(function(c){ return COMPANIES[c].name; }).join(" · ")
        : "None — units sit under " + (GROUP.org || "the group"), 3],
    ["Functions",      FUNCTION_KEYS.length
        ? FUNCTION_KEYS.map(function(fk){
            return FUNCTIONS[fk].name + " (" + fnFormat(FUNCTIONS[fk]) + ")"; }).join(" · ")
        : "None", 5],
    ["The words",      plural(LABELS.entries.length, "word") + " set", 6],
    ["The office",     (function(){
        var o = PEOPLE.filter(function(p){
          return p.active !== false && personRoleKeys(p).some(SMPRules.isOfficeRole); });
        return o.length ? o.map(function(p){ return p.name; }).join(" · ") : "Nobody yet";
      })(), 7]
  ];
  return '<div class="wzsumm">' + lines.map(function(l){
      return '<div class="wzsline"><span class="wzsk">' + esc(l[0]) + '</span>' +
        '<span class="wzsv">' + esc(l[1]) + '</span>' +
        '<button type="button" class="wzed" data-wgo="' + l[2] + '">Change</button></div>';
    }).join("") + '</div>' +
    '<div class="wzkey">Where to now</div>' +
    '<div class="wzdoors">' +
      '<button class="wzdoor" type="button" data-wdoor="plan">' +
        '<span class="wzdn">Start the plans</span>' +
        '<span class="wzdw">Open the plan builder and author the first pillar.</span></button>' +
      /* THE PLATFORM'S OWN NAVIGATION, not a second one (§53.5): `data-setupgo`
         is what every other jump into a Setup page uses, and it clears the
         rail's filter and leaves open modes on the way (§108.13). */
      '<button class="wzdoor" type="button" data-setupgo="people">' +
        '<span class="wzdn">Bring the people in</span>' +
        '<span class="wzdw">Open the register, add the heads and custodians, and issue their ' +
        'passwords.</span></button>' +
    '</div>';
}

/* ── THE SHAPE, DRAWN FROM THE SAME DATA THE STEPS WRITE ──────────────
   Never from a copy of the answers: the chips cannot disagree with the graph
   because there is nothing else for them to read. It uses the product's own
   navigation switch so it reads as the thing being built. */
function wizShapeHtml(){
  var at = wizAt();
  var h = '<div class="wzorg"><span class="wzonm">' +
    esc(String(GROUP.org || "").trim() || "The client") + '</span>' +
    (horizonSet() ? '<span class="wzoyr">to ' + esc(GROUP.horizon) + '</span>' : "") + '</div>';

  if (!UNIT_KEYS.length && !FUNCTION_KEYS.length)
    return h + '<div class="wzstem"></div><div class="wzquiet">Its units come next.</div>';

  h += '<div class="wzstem"></div><div class="wzswitch"><span class="on">Strategic</span>' +
       '<span>Functions</span></div>';

  h += '<div class="wzside"><div class="wzsidekey">Business units ' +
    '<span class="wzct">' + UNIT_KEYS.length + '</span></div>' +
    (UNIT_KEYS.length
      ? '<div class="wzchips">' + UNIT_KEYS.map(function(k){
          return '<span class="wzchip unit">' + esc(UNITS[k].name) +
            '<span class="wzfmt">pillars</span></span>'; }).join("") + '</div>'
      : '<div class="wzquiet">None yet</div>') + '</div>';

  if (activeCompanyKeys().length)
    h += '<div class="wzside"><div class="wzsidekey">Companies ' +
      '<span class="wzct">' + activeCompanyKeys().length + '</span></div>' +
      '<div class="wzchips">' + activeCompanyKeys().map(function(c){
        return '<span class="wzchip co">' + esc(COMPANIES[c].name) + '</span>'; }).join("") +
      '</div></div>';

  if (at >= 5)
    h += '<div class="wzside"><div class="wzsidekey">Supporting functions ' +
      '<span class="wzct">' + FUNCTION_KEYS.length + '</span></div>' +
      (FUNCTION_KEYS.length
        ? '<div class="wzchips">' + FUNCTION_KEYS.map(function(fk){
            var f = FUNCTIONS[fk], n = capsOfFunction(fk).length;
            return '<span class="wzchip fn">' + esc(f.name) +
              '<span class="wzfmt">' + fnFormat(f) + '</span>' +
              (fnFormat(f) === "projects" && n
                ? '<span class="wzown">' + plural(n, "cap") + '</span>' : "") +
              '</span>'; }).join("") + '</div>'
        : '<div class="wzquiet">None</div>') + '</div>' +
      '<div class="wzbeneath">' +
        '<div class="wzbrow"><span class="wzb" style="background:var(--panel)"></span>' +
          'A unit holds pillars, key measures and tactics</div>' +
        '<div class="wzbrow"><span class="wzb" style="background:var(--good)"></span>' +
          'A function plans in pillars, or holds capabilities and projects</div>' +
      '</div>';

  return h;
}

/* ── The page ─────────────────────────────────────────────────────────── */
function renderWizard(){
  if (!WIZ) WIZ = { at:0, seen:[] };
  var s = wizStep(), at = wizAt();
  var why = "";
  if (s.k === "fns")  why = "Each function plans its own way, and it stays changeable until that " +
                            "function has a plan in it.";
  if (s.k === "caps") why = "";
  if (s.k === "done") why = "Everything below stays editable in Setup. Nothing here is locked.";

  return cfgHead("Set-up", null, null, false) +
    '<div class="wzhead">' +
      '<span class="wzprog">' + (at === WIZ_LAST ? "Finished" : ("Step " + (at + 1) + " of " + WIZ_LAST)) + '</span>' +
    '</div>' +
    wizRailHtml() +
    '<div class="wzgrid"><section class="wzcol">' +
      '<div class="wzkey">' + esc(s.key) + '</div>' +
      '<h3 class="wzq">' + esc(s.k === "done"
        ? (String(GROUP.org || "").trim() || "The client") + " is set up." : s.q) + '</h3>' +
      (why ? '<p class="wzwhy wztop">' + esc(why) + '</p>' : "") +
      '<div class="wzbody">' + wizBodyHtml() + '</div>' +
      '<div class="wzfoot">' +
        (at > 0 ? '<button class="editbtn" type="button" data-wgo="' + (at - 1) + '">Back</button>' : "") +
        (at < WIZ_LAST
          ? '<button class="bprim" type="button" data-wgo="' + (at + 1) + '">Next</button>'
          : '<button class="bprim" type="button" data-wdone="1">Close set-up</button>') +
        '<span class="wznote">Nothing is final &mdash; every answer stays editable in Setup ' +
        'afterwards.</span>' +
      '</div>' +
    '</section>' +
    '<aside class="wzshape" aria-label="What you are building">' +
      '<h4>What you are building</h4>' +
      '<p class="wzcap">' + (UNIT_KEYS.length || FUNCTION_KEYS.length
        ? esc(String(GROUP.org || "The client").trim()) + ", as answered so far."
        : "It fills in as you answer.") + '</p>' +
      wizShapeHtml() +
    '</aside></div>';
}

/* ── The writes ───────────────────────────────────────────────────────
   Each one goes through the platform's own minter. `wizAdd` is the ONE place
   a row is created here, so a fifth kind cannot be added by a route that
   forgets the minter (§104.7). */
function wizAdd(kind, fnKey){
  if (kind === "unit") return addBusinessUnit("", "", null);
  if (kind === "co")   return addCompany();
  if (kind === "fn")   return addFunction("New function " + (FUNCTION_KEYS.length + 1), "pillars");
  if (kind === "cap")  return fnKey ? addCapability(fnKey) : null;
  return null;
}
