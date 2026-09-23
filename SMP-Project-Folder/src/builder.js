/* ══ THE PLAN BUILDER (§129, spec 020) ═══════════════════════════════

   The SMO team builds a plan ON the platform: pick a unit or a function —
   or create one — and author the whole plan through the plan's own pages.

   THREE DECISIONS SHAPE EVERYTHING HERE, all Islam's:

   · A MAP, NOT A MARCH. The band under the tab row is one chip per section
     of the plan, each openable in any order. Nothing waits on a previous
     step, and the left-to-right order is a suggestion, never a gate.

   · A ROW IS ADDED WHOLE. Every "+ Add" in build mode opens a form asking
     that row kind's fields in the order the outcome reads them (§116's
     dialog shape, generalised). The name is what makes Add live; anything
     else left empty is NAMED before the row lands and reads as missing
     after — asked for, never forced, so "we have not set the target yet"
     stays sayable.

   · LIVE IMMEDIATELY, NOTHING STORED. The plan appears as it is built,
     like pen edits today. Progress is DERIVED from the plan itself — the
     chips read the data, so pausing costs nothing and there is no draft
     flag for anybody to forget to clear. BUILDER is a screen mode, never
     state-graph content (§25, §47.1 — and it is not even a preference, so
     it is not stored at all: reopening the door reads the same truth off
     the data).

   WHAT THIS FILE IS AND IS NOT. It holds the builder's STATE, its HTML and
   its data logic — everything that can live in the global scope the other
   sources share. It never touches paint(), current, the modal or any other
   shell-closure state: the shell owns navigation and dialogs, and wires the
   data-b* attributes this file's HTML carries (the same contract every
   config page already uses). Nothing in here writes a second copy of a
   rule: rows are minted by the SAME add*()/koMint() the pen uses, cleared
   plans go through the SAME clearUnitPlan()/clearFunction() the import and
   Clear plan use (so starting fresh archives, §49.2), and the server
   classifies every edit exactly as it classifies the pen's. */

var BUILDER = null;       /* { target } while a build is underway */
var BFORM = null;         /* { kind, ctx, draft, added } while a row form is open */
var BCHOOSE = null;       /* { side, confirm } while the chooser is open */

/* ── Which way a subject plans ────────────────────────────────────── */
/* IS THE BUILD UNDERWAY ON THE PLACE BEING DRAWN (§292)? Six places spell
   this out inline (`BUILDER && BUILDER.target === current`); this is the
   first that needed it from a RENDERER rather than a handler, so it is
   named once here. The six are deliberately left as they are — folding them
   in is a sweep nobody asked for (§2b) — and recorded so the next reader
   knows the helper is the place to add a seventh. */
function builderHere(){
  return !!(typeof BUILDER !== "undefined" && BUILDER &&
            typeof current !== "undefined" && BUILDER.target === current);
}
/* §381.2: THREE WAYS A FUNCTION PLANS, AND THE ROUTE NAMES ALL THREE.
   It read `fnPlansInPillars(f) ? "fnpillars" : "fnprojects"`, so §342's
   objectives-and-actions fell through to the PROJECTS route and was offered a
   Projects box its pages do not have — measured, a function holding five
   actions with its band reading ○ Projects: a box that can never fill, beside
   no box at all for the work it really has (§61). `fnFormat` is the product's
   own reader and answers all three, so a fourth format is a case here rather
   than a fall-through. */
function builderRoute(target){
  var t = String(target || "");
  if (t.indexOf("fn:") !== 0) return UNITS[t] ? "unit" : null;
  var f = FUNCTIONS[t.slice(3)];
  if (!f) return null;
  var fmt = fnFormat(f);
  return fmt === "pillars" ? "fnpillars"
       : fmt === "objectives" ? "fnobjectives"
       : "fnprojects";
}
/* Is this route a supporting function's? Named once: four places ask, and a
   list of three spellings is a list somebody forgets to add a fourth to
   (§104.7). */
function builderIsFnRoute(route){
  return route === "fnpillars" || route === "fnprojects" || route === "fnobjectives";
}
function builderSubjectName(target){
  /* Not unitLike(): that resolver answers only what the UNIT PAGES draw, and
     a projects function is not drawn by them — asked through it, every
     projects function built here was nameless (found by driving, §51.7). */
  var t = String(target || "");
  if (t.indexOf("fn:") === 0) { var f = FUNCTIONS[t.slice(3)]; return f ? f.name : ""; }
  return UNITS[t] ? UNITS[t].name : "";
}
function builderHasPlan(target){
  var r = builderRoute(target);
  if (r === "unit" || r === "fnpillars")
    return !planIsEmpty(unitSnapshotCounts(unitPlanSnapshot(unitLike(target))));
  if (r === "fnprojects") return fnHasWork(String(target).slice(3));
  /* §381.2: AND THE OBJECTIVES ROUTE ASKS ITS OWN QUESTION, DELIBERATELY.
     `fnHasWork` does not know about actions — measured, a function holding two
     of them and nothing else answers FALSE — so routing this through it would
     offer *Build* over a standing plan, and Build does not archive (§49.2).
     That gap is wider than the builder (`fnShows` reads the same answer, so on
     a tenant where somebody holds no fill grant such a function is invisible
     to them in the navigation, §61); it is LATENT on this one, because all 33
     people can fill. Flagged for Islam rather than widened here, since
     changing it changes who sees a function (rule 1b). */
  if (r === "fnobjectives") {
    var f = FUNCTIONS[String(target).slice(3)];
    return !!(f && (fnActions(String(target).slice(3)).length ||
                    (f.keyObjectives || []).length || f.def));
  }
  return false;
}

/* ── The sections, per route ──────────────────────────────────────────
   Each names the tab and section that show it, the EDIT_PAGE key whose pen
   the chip opens, and how its chip reads. `state()` answers one of
   "ok" | "part" | "empty" with a short mark for the chip; the hint is the
   band's one sentence about the section. All of it reads the DATA — nothing
   here is stored, so the chips cannot drift from the plan (§53.5). */
function builderSections(target){
  var route = builderRoute(target);
  var u = function(){ return unitLike(target); };
  var fk = function(){ return String(target).slice(3); };
  /* THE FUNCTION'S OWN WORK, THROUGH THE ONE LIST ITS PAGES READ (§334).
     It counted `capsOfFunction` until §381, and §326 moved a function's
     projects onto the function itself — so the box was empty and every chip
     read ○ over a plan that was plainly there: measured, Finance holds three
     projects, a definition and two key objectives and its band read
     ○ ○ ○ ○, on six of the seven functions that plan in projects. The
     builder's whole promise is that the map is DERIVED from the plan (§129),
     so a map reading empty over a plan is the one failure it cannot have.
     A capability is a destination of its own now and is built by opening the
     builder ON IT (§334), so nothing here walks one — and `fnHolders` answers
     for exactly the cases the pages draw a holder for, which is what stops the
     band and the page disagreeing about whether there is anywhere to put a
     first project (§61, §334.18). */
  var holders = function(){
    return builderIsFnRoute(route) ? fnHolders(fk()) : [];
  };
  var listChip = function(n){ return n ? { s:"part", mark:String(n) } : { s:"empty", mark:"\u25cb" }; };

  if (route === "unit") {
    var secs = [];
    secs.push({ k:"found", label:"Foundation", tab:"strategy", sec:"found", pen:"foundation",
      chip:function(){
        var x = u(), filled = (x.aspiration ? 1 : 0) + (x.endInMind ? 1 : 0) +
          ((x.clauses || []).some(function(c){ return c && c[1]; }) ? 1 : 0);
        return filled === 3 ? { s:"ok", mark:"\u2713" } : filled ? { s:"part", mark:"\u2026" } : { s:"empty", mark:"\u25cb" };
      },
      hint:function(){ return '<b>Foundation</b> \u2014 who this unit is: the \u201cwho we are\u201d lines, the aspiration and the end in mind.'; } });
    secs.push({ k:"obj", label:"Objectives", tab:"strategy", sec:"found", pen:"foundation", scrollTo:".koband",
      chip:function(){ return listChip(u().keyObjectives.length); },
      hint:function(){
        var n = u().keyObjectives.length;
        return '<b>' + esc(L("keyobj","bu")) + '</b> \u2014 what this unit is judged on. Name, direction, targets and compile; 3\u20135 is typical.' +
          (n ? ' <b>' + n + ' added.</b>' : '');
      } });
    secs.push({ k:"swot", label:"SWOT", tab:"strategy", sec:"swot", pen:"analysis",
      chip:function(){
        var sw = u().swot || {}, n = ["s","w","o","t"].reduce(function(a,q){ return a + ((sw[q] || []).length); }, 0);
        return listChip(n);
      },
      hint:function(){ return '<b>SWOT</b> \u2014 the analysis the ' + esc(L("pillar","bu").toLowerCase()) + ' are reasoned from. Empty is allowed; say what you know.'; } });
    secs.push({ k:"plan", label:L("pillar", "bu"), tab:"strategy", sec:"plan", pen:"plan",
      chip:function(){ return listChip(u().items.length); },
      hint:function(){ return builderPillarHint(u()); } });
    secs.push(builderReviewSection());
    return secs;
  }

  /* ── A SUPPORTING FUNCTION: ONE SHAPE, THREE FORMATS (§381.2) ─────────
     Islam, of the shape put to him before anything was built: *"yes the shape
     is right."* Four boxes — Definition, Objectives, its work, Review — where
     a unit has five, because a supporting function does not author its own
     aspiration or its own SWOT: it inherits both from the unit it plans under
     (§213). So the two the unit has and this does not are absent by DECISION,
     and "like the units" cannot mean identical.

     ALL THREE FORMATS DRAW THE SAME TWO SECTIONS, measured rather than
     assumed: `found` (Overview) and `proj` (the work, labelled Plan, Projects
     or Plan), with SEC_PENS mapping them to `capfoundation` and `plan`. So
     only the WORK box differs, and it differs in three things — its key, its
     word and what it counts — which is what keeps this one branch rather than
     three (§53.5).

     THE DEFINITION AND THE OBJECTIVES ARE THE FUNCTION'S OWN, read off the
     function and never off a holder: a pillars function HAS no holder
     (`fnOwnHolder` answers null for one), and §213's Overview draws both from
     the function itself — which `fnOwnHolder`'s own comment says in as many
     words. One reader, so the three formats cannot answer differently. */
  if (builderIsFnRoute(route)) {
    var work = {
      fnpillars: { k:"plan", label:L("pillar", "bu"),
        count:function(){ return u().items.length; },
        hint:function(){ return builderPillarHint(u()); } },
      fnprojects: { k:"proj", label:L("project"),
        count:function(){ return holders().reduce(function(a,c){ return a + (c.projects || []).length; }, 0); },
        hint:function(){
          var d = 0, o = 0, ms = 0, n = 0;
          holders().forEach(function(c){ (c.projects || []).forEach(function(pr){
            n++; d += pr.deliverables.length; o += pr.outcomes.length; ms += pr.milestones.length; }); });
          return '<b>' + L("project") + '</b> \u2014 the enhancement work: front matter, deliverables, outcomes, milestones.' +
            (n ? ' <b>' + n + ' \u00b7 ' + d + ' deliverables \u00b7 ' + o + ' outcomes \u00b7 ' + ms + ' milestones.</b>' : '');
        } },
      fnobjectives: { k:"act", label:"Actions",
        count:function(){ return fnActions(fk()).length; },
        hint:function(){
          var n = fnActions(fk()).length;
          return '<b>Actions</b> \u2014 the work itself, each with an owner and a date it is due.' +
            (n ? ' <b>' + n + ' added.</b>' : '');
        } }
    }[route];

    return [
      { k:"def", label:"Definition", tab:"fnstrat", sec:"found", pen:"capfoundation",
        chip:function(){
          var f = FUNCTIONS[fk()];
          return (f && f.def) ? { s:"ok", mark:"\u2713" } : { s:"empty", mark:"\u25cb" };
        },
        hint:function(){ return '<b>Definition</b> \u2014 what this function is, in a sentence somebody outside it would recognise.'; } },
      { k:"obj", label:"Objectives", tab:"fnstrat", sec:"found", pen:"capfoundation",
        chip:function(){
          var f = FUNCTIONS[fk()];
          return listChip(((f && f.keyObjectives) || []).length);
        },
        hint:function(){
          var f = FUNCTIONS[fk()], n = ((f && f.keyObjectives) || []).length;
          return '<b>' + esc(L("keyobj","bu")) + '</b> \u2014 what this function is judged on. ' +
            'Optional: one with none is judged by its work.' + (n ? ' <b>' + n + ' added.</b>' : '');
        } },
      { k:work.k, label:work.label, tab:"fnstrat", sec:"proj", pen:"plan",
        chip:function(){ return listChip(work.count()); },
        hint:work.hint },
      builderReviewSection()
    ];
  }
  return [];
}
/* The pillar box's sentence, written once: a unit and a pillars function draw
   the same work from the same reader, so they say the same thing about it. */
function builderPillarHint(x){
  var m = 0, t = 0;
  x.items.forEach(function(pi){ m += pi.measures.length; t += pi.tactics.length; });
  return '<b>' + esc(L("pillar","bu")) + '</b> \u2014 the work the strategy commits to, each with its measures and tactics.' +
    (x.items.length ? ' <b>' + x.items.length + ' \u00b7 ' + m + ' measures \u00b7 ' + t + ' tactics so far.</b>' : '');
}
function builderReviewSection(){
  return { k:"review", label:"Review", tab:null, sec:null, pen:null,
    chip:function(){ return { s:"empty", mark:"○" }; },
    hint:function(){ return '<b>Review</b> — the plan as it stands, gaps named.'; } };
}
function builderSectionByKey(target, k){
  return builderSections(target).filter(function(s){ return s.k === k; })[0] || null;
}

/* Which chip the page on screen belongs to. Derived, never stored — the
   band has to agree with the navigation even when the navigation moved by
   its own tabs rather than by a chip. */
function builderCurrentKey(target, tabKey, secOf){
  var secs = builderSections(target), hit = null;
  secs.forEach(function(s){
    if (s.tab && s.tab === tabKey && s.sec === (secOf[s.tab] || null) && !hit) hit = s.k;
  });
  return hit;
}

/* ── The band ─────────────────────────────────────────────────────── */
function builderBandHtml(tabKey, secOf){
  if (!BUILDER) return "";
  var target = BUILDER.target;
  var cur = builderCurrentKey(target, tabKey, secOf);
  var secs = builderSections(target);
  var chips = secs.map(function(s){
    var c = s.chip();
    return '<button class="bchip' + (s.k === cur ? " cur" : "") + '" data-bnav="' + s.k + '"' +
      ' title="Open ' + esc(s.label) + '">' +
      '<span class="bst ' + c.s + '">' + c.mark + '</span>' + esc(s.label) + '</button>';
  }).join("");
  var curSec = secs.filter(function(s){ return s.k === cur; })[0];
  return '<div class="bband"><span class="bwho">Building this plan — ' +
      esc(builderSubjectName(target)) + '</span>' +
    '<span class="bchips" role="tablist">' + chips + '</span>' +
    '<span class="bhint">' + (curSec ? curSec.hint() :
      'Open any section — the order is a suggestion, not a gate.') + '</span>' +
    '<span class="bacts"><button class="blink" data-bpause="1" title="Leave the builder — everything built stays; come back from Setup → Import &amp; plans">Pause</button>' +
    '<button class="bprim" data-bfinish="1">Finish building</button></span></div>';
}

/* ── The chooser ──────────────────────────────────────────────────── */
function builderChooserHtml(){
  var side = (BCHOOSE && BCHOOSE.side) || "units";
  var seg = '<div class="bseg">' +
    '<button data-bside="units" aria-pressed="' + (side === "units") + '">' + L("unitword","bu") + '</button>' +
    '<button data-bside="fns" aria-pressed="' + (side === "fns") + '">' + L("fnword") + '</button></div>';

  var rows = (side === "units"
    ? activeKeys().map(function(k){ return { t:k, name:UNITS[k].name }; })
    : activeFunctionKeys().map(function(k){
        return { t:"fn:" + k, name:FUNCTIONS[k].name,
                 /* §381.2: three ways now, so the word is read off the format
                    rather than off a yes/no — which called an objectives
                    function "projects" on the one screen where you pick what
                    to build. */
                 fmt:{ pillars:L("pillar","bu").toLowerCase(),
                       projects:"projects",
                       objectives:"objectives and actions" }[fnFormat(FUNCTIONS[k])] };
      })
  ).map(function(r){
    var has = builderHasPlan(r.t);
    var confirming = BCHOOSE && BCHOOSE.confirm === r.t;
    return '<div class="brow">' +
      '<b>' + esc(r.name) + '</b>' +
      (r.fmt ? '<span class="bwhy">plans in ' + esc(r.fmt) + '</span>' : '') +
      '<span class="bstat ' + (has ? "has" : "empty") + '">' + (has ? "Has a plan" : "Empty") + '</span>' +
      (confirming
        ? '<span class="bconfirm">Archive today’s plan and start fresh? ' +
            '<button class="bdanger" data-bfresh="' + esc(r.t) + '">Yes, archive it</button>' +
            '<button class="blink" data-bnofresh="1">Cancel</button></span>'
        /* A subject with content gets TWO ways in: Continue picks up a
           paused build exactly where the data stands (§129: progress is the
           plan itself, so nothing was ever "saved" to resume), and Start
           fresh archives first. One button that always cleared would make
           pausing cost the whole plan. */
        : has
        ? '<button class="bgo" data-bcont="' + esc(r.t) + '">Continue</button>' +
          '<button class="blink" data-bpick="' + esc(r.t) + '">Start fresh</button>'
        : '<button class="bgo" data-bpick="' + esc(r.t) + '">Build</button>') +
      '</div>';
  }).join("");

  return seg + '<div class="blist">' + (rows ||
      '<div class="brow"><span class="bwhy">Nothing here yet — create one below.</span></div>') + '</div>' +
    '<div class="bnewrow">' +
      '<button class="blink" data-bnew="unit">+ New business unit</button>' +
      '<button class="blink" data-bnew="fn">+ New supporting function</button></div>' +
    '<p class="bfoot">Starting fresh archives the standing plan first — restorable from ' +
      '<b>Archived plans</b>. Nothing the builder does is a deletion.</p>';
}

/* Starting fresh IS the import's replace and the row's Clear plan — the same
   functions, so the same archive (§49.2). A pillars function goes through the
   writable view and writes back, exactly as an uploaded replacement does. */
function builderStartFresh(target){
  var route = builderRoute(target);
  var why = "replaced by a plan built on the platform";
  if (route === "unit") clearUnitPlan(UNITS[target], why);
  else if (route === "fnpillars") {
    var fk = String(target).slice(3), w = unitLikeWritable(target);
    clearUnitPlan(w, why);
    fnWriteBack(fk, w);
  }
  /* §381.2: and an objectives function clears the same way — measured, not
     assumed: `clearFunction` goes through `fnOwnHolder`, which carries the
     function's actions, and `clearCapability` empties them (two actions in,
     nought out). So the third format needed no clearing rule of its own. */
  else if (route === "fnprojects" || route === "fnobjectives")
    clearFunction(String(target).slice(3), "plan", why);
}

/* ── The row forms ────────────────────────────────────────────────────
   One definition per row kind: the fields IN THE ORDER THE OUTCOME READS
   THEM, which is the whole point (Islam: "the template should protect the
   structure of the outcome"). `req` is the one field that makes Add live;
   everything else is asked, named while empty, and never forced. The
   vocabulary is the pen's own selectOr lists — never a second copy (§53.5). */
function bformDef(kind, ctx){
  var dirSeg = { k:"dir", label:"Direction", type:"seg", def:"≥",
                 opts:[["≥","≥ at least"],["≤","≤ at most"]] };
  var compileSeg = { k:"compile", label:"Compile rule — how the year’s figure is read",
                     type:"seg", def:"Latest",
                     /* §276: the one list, in the pen's own order. */
                     opts:SMPRules.COMPILES.map(function(c){ return [c, c]; }) };
  var defs = {
    pillar: { title:"Add a " + L("pillar","bu").toLowerCase().replace(/s$/, ""),
      fields:[
        { k:"name", label:"Name", req:true, ph:"What this " + L("pillar","bu").toLowerCase().replace(/s$/, "") + " is called" },
        { k:"sub", label:"One line under the name", ph:"e.g. the end-state it reaches for" },
        { k:"theme", label:"Theme", type:"select",
          opts:[["","— cross-cutting, no theme —"]].concat(
            GROUP.themes.map(function(t){ return [t.ab, t.ab + " · " + t.name]; })) },
        { k:"owner", label:"Owner", ph:"Who answers for it" }
      ] },
    measure: { title:"Add a measure",
      fields:[
        { k:"name", label:"Measure", req:true, ph:"What is measured" },
        dirSeg,
        { k:"target", label:"Target this year", mono:true, ph:"e.g. 90%" },
        { k:"target3y", label:horizonSet() ? "Target by " + esc(String(GROUP.horizon)) : "3-year target", mono:true, ph:"optional" },
        compileSeg
      ] },
    tactic: { title:"Add a tactic",
      fields:[
        { k:"name", label:"Tactic", req:true, ph:"The work itself, as a sentence" },
        { k:"owner", label:"Owner", ph:"Who runs it" },
        { k:"q", label:"Quarters it is due in", type:"quarters" }
      ] },
    objective: { title:"Add a key objective",
      fields:[
        { k:"name", label:"Objective", req:true, ph:"What the unit is judged on" },
        dirSeg,
        { k:"target", label:"Target this year", mono:true },
        { k:"target3y", label:horizonSet() ? "Target by " + esc(String(GROUP.horizon)) : "3-year target", mono:true, ph:"optional" },
        compileSeg
      ] },
    capko: { title:"Add a key objective",
      fields:[
        { k:"name", label:"Objective", req:true, ph:"What this function is judged on" },
        dirSeg,
        { k:"target", label:"Target this year", mono:true },
        compileSeg,
        { k:"weight", label:"Weight %", mono:true, ph:"its share of the function’s score" }
      ] },
    cap: { title:"Add a capability",
      fields:[
        { k:"name", label:"Capability", req:true, ph:"What the function builds or runs" },
        { k:"def", label:"Definition", type:"long", ph:"What it is, in a sentence" }
      ] },
    project: { title:"Add a project",
      fields:[
        { k:"name", label:"Project", req:true, ph:"What the project is called" },
        { k:"owner", label:"Owner", ph:"Who answers for it" },
        { k:"start", label:"Start", mono:true, ph:"e.g. Q1 2026" },
        { k:"end", label:"End", mono:true, ph:"e.g. Q4 2026" },
        { k:"brief", label:"Brief", type:"long", ph:"Why this project exists, in two sentences" }
      ] },
    deliverable: { title:"Add a deliverable",
      fields:[
        { k:"name", label:"Deliverable", req:true, ph:"What the project hands over" },
        { k:"kind", label:"Measured as", type:"seg", def:"binary",
          opts:[["binary","Done or not"],["pct","% of progress"]] },
        { k:"due", label:"Due date", mono:true, ph:"e.g. Sep 2026" }
      ] },
    outcome: { title:"Add an outcome",
      fields:[
        { k:"name", label:"Outcome", req:true, ph:"What the project is meant to change" },
        dirSeg,
        { k:"target", label:"Target", mono:true },
        { k:"measureAt", label:"Measure date", mono:true, ph:"when it is read, e.g. Q4 2026" }
      ] },
    milestone: { title:"Add a milestone",
      fields:[
        { k:"name", label:"Milestone", req:true, ph:"Short name" },
        { k:"covers", label:"Description", type:"long", ph:"What done looks like" },
        { k:"owner", label:"Owner" },
        { k:"finish", label:"Due date", mono:true, ph:"e.g. March 2026" }
      ] },
    /* §381.2: AN ACTION IS THE MILESTONE'S FORM, THREE FIELDS RATHER THAN
       FOUR — §342 built it as *a milestone with a DATE where a tactic has
       quarters*, and its plan table draws exactly Action · Owner · Due, so
       the form asks what that table holds and nothing else. `status` is
       deliberately absent: it is what a REPORTER writes, and a plan pane
       holds none (§104). */
    action: { title:"Add an action",
      fields:[
        { k:"name", label:"Action", req:true, ph:"The work itself, as a sentence" },
        { k:"owner", label:"Owner", ph:"Who runs it" },
        { k:"due", label:"Due date", mono:true, ph:"e.g. Sep 2026" }
      ] },
    clause: { title:"Add a line to “Who we are”",
      fields:[
        { k:"label", label:"The lead — the words down the left", req:true, ph:"e.g. We serve" },
        { k:"text", label:"The line itself", type:"long" }
      ] },
    swot: { title:"Add " + ({ s:"a strength", w:"a weakness", o:"an opportunity", t:"a threat" }[ctx && ctx.q] || "a line"),
      fields:[
        { k:"text", label:{ s:"Strength", w:"Weakness", o:"Opportunity", t:"Threat" }[ctx && ctx.q] || "Line",
          req:true, type:"long" }
      ] },
    newunit: { title:"New business unit", noAnother:true, verb:"Create",
      fields:[
        { k:"name", label:"Name", req:true },
        { k:"prefix", label:"Code prefix", mono:true, ph:"e.g. LE — minted from the name if left empty" },
        { k:"company", label:L1("division"), type:"select",
          opts:COMPANY_KEYS.filter(function(ck){ return companyActive(ck); })
            .map(function(ck){ return [ck, COMPANIES[ck].name]; })
            .concat([["","— its own company —"]]) }
      ] },
    newfn: { title:"New supporting function", noAnother:true, verb:"Create",
      fields:[
        { k:"name", label:"Name", req:true },
        /* §381.2: THREE, because §342 made objectives-and-actions a real
           format and this control was the last list still offering two —
           read from FN_FORMATS rather than written out again (§53.5), so a
           fourth way is offered here the day it exists. */
        { k:"format", label:"Plans in", type:"seg", def:"projects",
          opts:FN_FORMATS.map(function(fm){
            return [fm, fm === "pillars" ? L("pillar","bu")
                      : fm === "objectives" ? "Objectives and actions" : "Projects"];
          }) }
      ] }
  };
  return defs[kind] || null;
}

/* What the form would leave empty, by label — said BEFORE the row is added,
   in the amber line, so finishing with a gap is a decision (§87's "named,
   not guessed" applied to a form). */
function bformMissing(def, draft){
  return def.fields.filter(function(f){
    if (f.req || f.type === "quarters") return false;
    var v = draft[f.k];
    if (f.type === "seg") return false;              /* a seg always has a value */
    if (f.type === "select") return false;           /* an empty select is a real answer */
    return !(v && String(v).trim());
  }).map(function(f){ return f.label.replace(/ —.*$/, ""); });
}

function bformFieldHtml(f, draft){
  var v = draft[f.k] != null ? draft[f.k] : (f.def != null ? f.def : "");
  var lab = '<div class="bfl">' + f.label + '</div>';
  if (f.type === "seg") {
    return '<div class="bff">' + lab + '<div class="bfseg" data-bfseg="' + f.k + '">' +
      f.opts.map(function(o){
        return '<button type="button" data-bfv="' + esc(o[0]) + '" aria-pressed="' + (v === o[0]) + '">' +
          o[1] + '</button>';
      }).join("") + '</div></div>';
  }
  if (f.type === "select") {
    return '<div class="bff">' + lab + '<select class="bfi" data-bf="' + f.k + '">' +
      f.opts.map(function(o){
        return '<option value="' + esc(o[0]) + '"' + (v === o[0] ? " selected" : "") + '>' + esc(o[1]) + '</option>';
      }).join("") + '</select></div>';
  }
  if (f.type === "quarters") {
    return '<div class="bff">' + lab + '<div class="bfseg bfq" data-bfq="1">' +
      [1,2,3,4].map(function(q){
        return '<button type="button" data-bfqn="' + q + '" aria-pressed="' + !!draft["q" + q] + '">Q' + q + '</button>';
      }).join("") + '</div></div>';
  }
  if (f.type === "long") {
    return '<div class="bff">' + lab + '<textarea class="bfi" rows="2" data-bf="' + f.k + '"' +
      (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + '>' + esc(String(v)) + '</textarea></div>';
  }
  return '<div class="bff">' + lab + '<input class="bfi' + (f.mono ? " mono" : "") + '" data-bf="' + f.k +
    '" value="' + esc(String(v)) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + '></div>';
}

function bformHtml(){
  if (!BFORM) return "";
  var def = bformDef(BFORM.kind, BFORM.ctx), d = BFORM.draft;
  var miss = bformMissing(def, d);
  var reqk = (def.fields.filter(function(f){ return f.req; })[0] || {}).k;
  var live = !reqk || !!(d[reqk] && String(d[reqk]).trim());
  var verb = def.verb || "Add";
  return '<div class="bform">' +
    def.fields.map(function(f){ return bformFieldHtml(f, d); }).join("") +
    '<div class="bfmiss"' + (miss.length ? '' : ' hidden') + '>Still empty: <b>' +
      miss.join(", ") + '</b> — the row is added anyway and reads as missing ' +
      (miss.length === 1 ? 'it' : 'these') + '.</div>' +
    '<div class="bfacts">' +
      (def.noAnother ? '' :
        '<button class="bprim" data-bfadd="more"' + (live ? '' : ' disabled') + '>' + verb + ' &amp; add another</button>') +
      '<button class="' + (def.noAnother ? 'bprim' : 'bgo') + '" data-bfadd="one"' + (live ? '' : ' disabled') + '>' + verb + '</button>' +
      '<button class="blink" data-bfcancel="1">' + (BFORM.added ? "Done" : "Cancel") + '</button>' +
      (BFORM.added ? '<span class="bfnote">' + BFORM.added + ' added</span>' : '') +
    '</div></div>';
}

/* ── Applying a form: the SAME minters the pen uses ─────────────────── */
function bPillarById(target, pid){
  var u = unitLikeWritable(target);
  return u ? (u.items.filter(function(it){ return it.id === pid; })[0] || null) : null;
}
function bApply(kind, ctx, d){
  var v = function(k){ return (d[k] != null ? String(d[k]) : "").trim(); };
  if (kind === "pillar") {
    var u = unitLikeWritable(ctx.target); if (!u) return false;
    var it = addPillar(u); if (!it) return false;
    it.name = v("name"); it.sub = v("sub"); it.theme = v("theme"); it.owner = v("owner");
    return true;
  }
  if (kind === "measure" || kind === "tactic") {
    var p = bPillarById(ctx.target, ctx.pid); if (!p) return false;
    if (kind === "measure") {
      var m = addMeasure(p);
      m.name = v("name"); m.dir = d.dir || "≥"; m.target = v("target");
      if (v("target3y")) m.target3y = v("target3y");
      m.compile = d.compile || "Latest";
    } else {
      var t = addTactic(p);
      t.name = v("name"); t.owner = v("owner");
      [1,2,3,4].forEach(function(q){ t["q" + q] = d["q" + q] ? 1 : 0; });
    }
    return true;
  }
  if (kind === "objective") {
    var w = unitLikeWritable(ctx.target); if (!w) return false;
    var ko = koMint(w.keyObjectives, w.ukey);
    ko.name = v("name"); ko.dir = d.dir || "≥"; ko.target = v("target");
    if (v("target3y")) ko.target3y = v("target3y");
    ko.compile = d.compile || "Latest";
    w.keyObjectives.push(ko);
    renumberUnit(w);
    return true;
  }
  if (kind === "capko") {
    /* §334.18: A HOLDER, which since §326 is a capability OR a supporting
       function's own work — `capById` answered null for the second and the
       form quietly wrote nothing. */
    var c = holderByIdWritable(ctx.capId); if (!c) return false;
    /* §316: A ROW WITH NO ID IS NOBODY'S TO CHANGE (§191). This branch pushed
       a bare object, so the row rendered perfectly, scored, reported — and
       could not be WRITTEN: §241's row-addressed writer refuses the whole save
       by name ("cap_key_objectives - a row has no id"), measured. The unit
       branch above numbers its plan through renumberUnit() and this one had
       nothing, which is why the check one assertion up asks a unit's objective
       for its id and never asked a capability's (§94.2).

       MINTED FROM THE MAXIMUM, NEVER RENUMBERED (§96.2): renumberCapability()
       is positional and rewrites every PROJECT id in the capability too, so on
       a capability whose projects were minted max-based after a removal it
       would silently re-address rows figures and snapshots are keyed on
       (§48). mintRowId is what addProject/addMeasure already use, and it
       touches only the row being added. */
    c.keyObjectives.push({ id:mintRowId(c.keyObjectives, c.id + "-KO"),
      name:v("name"), dir:d.dir || "≥", target:v("target"),
      compile:d.compile || "Latest",
      weight:v("weight") !== "" && isFinite(+v("weight")) ? +v("weight") : null,
      actual:"", progress:null });
    return true;
  }
  if (kind === "cap") {
    var made = addCapability(ctx.fnKey); if (!made) return false;
    made.name = v("name") || made.name; made.def = v("def");
    return true;
  }
  if (kind === "project") {
    var cc = holderByIdWritable(ctx.capId); if (!cc) return false;   /* §334.18 */
    var pr = addProject(cc); if (!pr) return false;
    pr.name = v("name"); pr.owner = v("owner"); pr.start = v("start"); pr.end = v("end"); pr.brief = v("brief");
    if (typeof RAIL !== "undefined" && typeof railKeyFor === "function") RAIL[railKeyFor(cc)] = pr.id;
    return true;
  }
  if (kind === "deliverable" || kind === "outcome" || kind === "milestone") {
    var pj = projById(ctx.projId); if (!pj) return false;
    if (kind === "deliverable") {
      var dl = addDeliverable(pj);
      dl.name = v("name"); dl.kind = d.kind === "pct" ? "pct" : "binary"; dl.due = v("due");
    } else if (kind === "outcome") {
      var oc = addOutcome(pj);
      oc.name = v("name"); oc.dir = d.dir || "≥"; oc.target = v("target"); oc.measureAt = v("measureAt");
    } else {
      var ml = addMilestone(pj);
      ml.name = v("name"); ml.covers = v("covers"); ml.owner = v("owner"); ml.finish = v("finish");
    }
    return true;
  }
  if (kind === "action") {
    /* §381.2: addAction() is what the plan pane's own Add presses, so the
       row a form makes and the row the pen makes are the same row (§53.5) —
       id minted from the maximum, `status` left empty for the reporter. */
    var ac = addAction(ctx.fnKey); if (!ac) return false;
    ac.name = v("name"); ac.owner = v("owner"); ac.due = v("due");
    return true;
  }
  if (kind === "clause") {
    var cu = ctx.target === "group" ? GROUP : unitLikeWritable(ctx.target);
    if (!cu || !Array.isArray(cu.clauses)) return false;
    cu.clauses.push([v("label"), v("text")]);
    if (cu.ukey) renumberUnit(cu);
    return true;
  }
  if (kind === "swot") {
    var su = unitLikeWritable(ctx.target); if (!su || !su.swot) return false;
    if (!Array.isArray(su.swot[ctx.q])) return false;
    su.swot[ctx.q].push(v("text"));
    return true;
  }
  return false;
}

/* ── Creating a subject ───────────────────────────────────────────────
   A UNIT is minted by addBusinessUnit() in config-data.js — the one minter
   the Setup page has always called, now taking the name, prefix and company
   the builder's form asks for (§53.5: a second unit-shape here is how twins
   get made). A FUNCTION gets the same treatment: one minter, shared by the
   Setup page's add button and the builder's chooser, keyed from the name. */
function addFunction(name, format){
  var nm = String(name || "").trim();
  if (!nm) return null;
  var base = nm.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || ("fn" + FUNCTION_KEYS.length);
  var key = base, n = 2;
  while (FUNCTIONS[key]) { key = base + n; n++; }
  FUNCTIONS[key] = { name:nm, navName:null, codePrefix:nm.slice(0, 3).toUpperCase(),
    head:null, custodian:null, active:true,
    /* §381.2: the chooser offers three now, so the minter has to accept
       three — anything else falls back to projects, which is what an
       unknown value already reads as (§fnFormat). */
    format:FN_FORMATS.indexOf(format) >= 0 ? format : "projects" };
  FUNCTION_KEYS.push(key);
  return key;
}

/* ── The review ───────────────────────────────────────────────────────
   Not a gate — an honest reading (§129). Rows restate the SAME counts the
   chips read; gaps are counted from the data in the same pass. Empty is
   allowed, and finishing with a gap is a decision the review makes visible. */
function builderGaps(target){
  var route = builderRoute(target), gaps = [];
  var say = function(k, n, one, many){
    if (n) gaps.push({ k:k, text:plural(n, one, many) });
  };
  /* The pillar work's three gaps, shared by a unit and a pillars function
     because they are the same rows read by the same reader (\u00a753.5, A15) \u2014
     written once here rather than in both branches, which is how the two came
     to be able to differ at all. */
  var pillarGaps = function(x){
    var bare = 0, noTarget = 0, idle = 0;
    x.items.forEach(function(pi){
      if (!pi.measures.length && !pi.tactics.length) bare++;
      pi.measures.forEach(function(m){ if (!m.target) noTarget++; });
      pi.tactics.forEach(function(t){ if (!t.q1 && !t.q2 && !t.q3 && !t.q4) idle++; });
    });
    var pw = L("pillar","bu").toLowerCase().replace(/s$/, "");
    say("plan", bare, pw + " holds no measures and no tactics yet", pw + "s hold no measures and no tactics yet");
    say("plan", noTarget, "measure has no target \u2014 it will read as missing it",
      "measures have no target \u2014 they will read as missing it");
    say("plan", idle, "tactic is due in no quarter, so no cycle will ask for it",
      "tactics are due in no quarter, so no cycle will ask for them");
  };
  var noTargetIn = function(list){
    return (list || []).filter(function(m){ return !m.target; }).length;
  };

  if (route === "unit") {
    var u = unitLike(target);
    say("obj", noTargetIn(u.keyObjectives),
      "objective has no target this year", "objectives have no target this year");
    pillarGaps(u);
  }

  /* \u00a7381.2: ONE BRANCH FOR ALL THREE FORMATS, so what the Review names cannot
     drift from what the band counts \u2014 the definition and the objectives are
     asked of the FUNCTION for every format, exactly as the chips ask them, and
     only the work differs. */
  if (builderIsFnRoute(route)) {
    var fk = String(target).slice(3), f = FUNCTIONS[fk] || {};
    say("def", f.def ? 0 : 1, "the function has no definition", "");
    say("obj", noTargetIn(f.keyObjectives),
      "objective has no target this year", "objectives have no target this year");

    if (route === "fnpillars") pillarGaps(unitLike(target));

    if (route === "fnprojects") {
      var emptyP = 0, oNoT = 0, msNoDue = 0;
      fnHolders(fk).forEach(function(c){
        (c.projects || []).forEach(function(pr){
          if (!pr.deliverables.length && !pr.outcomes.length) emptyP++;
          pr.outcomes.forEach(function(o){ if (!o.target) oNoT++; });
          pr.milestones.forEach(function(m){ if (!m.finish) msNoDue++; });
        });
      });
      say("proj", emptyP, "project holds neither deliverables nor outcomes",
        "projects hold neither deliverables nor outcomes");
      say("proj", oNoT, "outcome has no target", "outcomes have no target");
      say("proj", msNoDue, "milestone has no due date", "milestones have no due date");
    }

    if (route === "fnobjectives") {
      /* An action's two plan-time facts (\u00a7342): who runs it and when it is
         due. Its STATUS is a reporting field, so a plan cannot owe one \u2014 a
         gap list that asked for it would name something no cycle has yet
         asked anybody for. */
      var aNoOwner = 0, aNoDue = 0;
      fnActions(fk).forEach(function(a){
        if (!a.owner) aNoOwner++;
        if (!a.due) aNoDue++;
      });
      say("act", aNoOwner, "action has no owner", "actions have no owner");
      say("act", aNoDue, "action has no date it is due", "actions have no date they are due");
    }
  }
  return gaps;
}
function builderReviewHtml(target){
  var secs = builderSections(target).filter(function(s){ return s.k !== "review"; });
  var gaps = builderGaps(target);
  var rows = secs.map(function(s){
    var c = s.chip();
    var own = gaps.filter(function(g){ return g.k === s.k; });
    return '<button class="brvrow" data-bnav="' + s.k + '">' +
      '<span class="bst ' + c.s + '">' + (c.s === "ok" ? "✓" : c.s === "part" ? c.mark : "○") + '</span>' +
      '<b>' + esc(s.label) + '</b><span class="brvwhat">' +
      (c.s === "empty" ? "Empty" : c.s === "ok" ? "Filled"
        : c.mark === "…" ? "Partly filled" : c.mark + " so far") +
      (own.length ? ' · ' + own.map(function(g){ return g.text; }).join(" · ") : '') +
      '</span></button>';
  }).join("");
  return '<div class="brv">' + rows + '</div>' +
    '<p class="bfoot">Finishing closes the band and nothing else — the plan has been live all along. ' +
      'Gaps stay findable on the pages' + (gaps.length ? '' : ' — and there are none') + '.</p>' +
    '<div class="bfacts"><button class="bprim" data-bdone="1">Finish building</button>' +
    '<button class="blink" data-brvback="1">Keep building</button></div>';
}
