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
function builderRoute(target){
  var t = String(target || "");
  if (t.indexOf("fn:") !== 0) return UNITS[t] ? "unit" : null;
  var f = FUNCTIONS[t.slice(3)];
  if (!f) return null;
  return fnPlansInPillars(f) ? "fnpillars" : "fnprojects";
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
  var caps = function(){
    return route === "fnprojects" ? capsOfFunction(String(target).slice(3)) : [];
  };
  var listChip = function(n){ return n ? { s:"part", mark:String(n) } : { s:"empty", mark:"○" }; };

  if (route === "unit" || route === "fnpillars") {
    var secs = [];
    if (route === "unit") {
      secs.push({ k:"found", label:"Foundation", tab:"strategy", sec:"found", pen:"foundation",
        chip:function(){
          var x = u(), filled = (x.aspiration ? 1 : 0) + (x.endInMind ? 1 : 0) +
            ((x.clauses || []).some(function(c){ return c && c[1]; }) ? 1 : 0);
          return filled === 3 ? { s:"ok", mark:"✓" } : filled ? { s:"part", mark:"…" } : { s:"empty", mark:"○" };
        },
        hint:function(){ return '<b>Foundation</b> — who this unit is: the “who we are” lines, the aspiration and the end in mind.'; } });
      secs.push({ k:"obj", label:"Objectives", tab:"strategy", sec:"found", pen:"foundation", scrollTo:".koband",
        chip:function(){ return listChip(u().keyObjectives.length); },
        hint:function(){
          var n = u().keyObjectives.length;
          return '<b>' + esc(L("keyobj","bu")) + '</b> — what this unit is judged on. Name, direction, targets and compile; 3–5 is typical.' +
            (n ? ' <b>' + n + ' added.</b>' : '');
        } });
      secs.push({ k:"swot", label:"SWOT", tab:"strategy", sec:"swot", pen:"analysis",
        chip:function(){
          var s = u().swot || {}, n = ["s","w","o","t"].reduce(function(a,q){ return a + ((s[q] || []).length); }, 0);
          return listChip(n);
        },
        hint:function(){ return '<b>SWOT</b> — the analysis the ' + esc(L("pillar","bu").toLowerCase()) + ' are reasoned from. Empty is allowed; say what you know.'; } });
    }
    secs.push({ k:"plan", label:L("pillar", "bu"),
      tab:route === "unit" ? "strategy" : "fnstrat",
      sec:route === "unit" ? "plan" : "proj", pen:"plan",
      chip:function(){ return listChip(u().items.length); },
      hint:function(){
        var x = u(), m = 0, t = 0;
        x.items.forEach(function(p){ m += p.measures.length; t += p.tactics.length; });
        return '<b>' + esc(L("pillar","bu")) + '</b> — the work the strategy commits to, each with its measures and tactics.' +
          (x.items.length ? ' <b>' + x.items.length + ' · ' + m + ' measures · ' + t + ' tactics so far.</b>' : '');
      } });
    secs.push(builderReviewSection());
    return secs;
  }

  if (route === "fnprojects") {
    return [
      { k:"def", label:"Definitions", tab:"fnstrat", sec:"found", pen:"capfoundation",
        chip:function(){
          var cs = caps(), have = cs.filter(function(c){ return c.def; }).length;
          if (!cs.length) return { s:"empty", mark:"○" };
          return have === cs.length ? { s:"ok", mark:"✓" } : have ? { s:"part", mark:"…" } : { s:"empty", mark:"○" };
        },
        hint:function(){ return '<b>Definitions</b> — what each capability is, in a sentence somebody outside the function would recognise.'; } },
      { k:"obj", label:"Objectives", tab:"fnstrat", sec:"found", pen:"capfoundation",
        chip:function(){
          return listChip(caps().reduce(function(a,c){ return a + (c.keyObjectives || []).length; }, 0));
        },
        hint:function(){ return '<b>' + esc(L("keyobj","bu")) + '</b> — optional: a capability with none is judged by its projects.'; } },
      { k:"proj", label:"Projects", tab:"fnstrat", sec:"proj", pen:"plan",
        chip:function(){
          return listChip(caps().reduce(function(a,c){ return a + (c.projects || []).length; }, 0));
        },
        hint:function(){
          var d = 0, o = 0, ms = 0, n = 0;
          caps().forEach(function(c){ (c.projects || []).forEach(function(p){
            n++; d += p.deliverables.length; o += p.outcomes.length; ms += p.milestones.length; }); });
          return '<b>Projects</b> — the enhancement work: front matter, deliverables, outcomes, milestones.' +
            (n ? ' <b>' + n + ' · ' + d + ' deliverables · ' + o + ' outcomes · ' + ms + ' milestones.</b>' : '');
        } }
      , builderReviewSection()];
  }
  return [];
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
    '<button data-bside="units" aria-pressed="' + (side === "units") + '">Business units</button>' +
    '<button data-bside="fns" aria-pressed="' + (side === "fns") + '">Supporting functions</button></div>';

  var rows = (side === "units"
    ? activeKeys().map(function(k){ return { t:k, name:UNITS[k].name }; })
    : activeFunctionKeys().map(function(k){
        return { t:"fn:" + k, name:FUNCTIONS[k].name,
                 fmt:fnPlansInPillars(FUNCTIONS[k]) ? L("pillar","bu").toLowerCase() : "projects" };
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
  else if (route === "fnprojects") clearFunction(String(target).slice(3), "plan", why);
}

/* Entering a projects function that has no capability yet mints its first,
   named after the function — a projects plan has to hang off something, and
   the Temple's addCapability() is the one place that mints one (§51.11). */
function builderEnsureCapability(target){
  if (builderRoute(target) !== "fnprojects") return;
  var fk = String(target).slice(3);
  if (capsOfFunction(fk).length) return;
  var c = addCapability(fk);
  c.name = FUNCTIONS[fk].name;
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
                     opts:[["Latest","Latest"],["Sum","Sum"],["Average","Average"]] };
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
        { k:"name", label:"Objective", req:true, ph:"What this capability is judged on" },
        dirSeg,
        { k:"target", label:"Target this year", mono:true },
        compileSeg,
        { k:"weight", label:"Weight %", mono:true, ph:"its share of the capability’s score" }
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
        { k:"company", label:"Company", type:"select",
          opts:COMPANY_KEYS.filter(function(ck){ return companyActive(ck); })
            .map(function(ck){ return [ck, COMPANIES[ck].name]; })
            .concat([["","— its own company —"]]) }
      ] },
    newfn: { title:"New supporting function", noAnother:true, verb:"Create",
      fields:[
        { k:"name", label:"Name", req:true },
        { k:"format", label:"Plans in", type:"seg", def:"projects",
          opts:[["projects","Projects"],["pillars",L("pillar","bu")]] }
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
    var c = capById(ctx.capId); if (!c) return false;
    c.keyObjectives.push({ name:v("name"), dir:d.dir || "≥", target:v("target"),
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
    var cc = capById(ctx.capId); if (!cc) return false;
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
    format:format === "pillars" ? "pillars" : "projects" };
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
  if (route === "unit" || route === "fnpillars") {
    var u = unitLike(target);
    say("obj", u.keyObjectives.filter(function(m){ return !m.target; }).length,
      "objective has no target this year", "objectives have no target this year");
    var mNoTarget = 0, bareP = 0, idleT = 0;
    u.items.forEach(function(p){
      if (!p.measures.length && !p.tactics.length) bareP++;
      p.measures.forEach(function(m){ if (!m.target) mNoTarget++; });
      p.tactics.forEach(function(t){ if (!t.q1 && !t.q2 && !t.q3 && !t.q4) idleT++; });
    });
    var pw = L("pillar","bu").toLowerCase().replace(/s$/, "");
    say("plan", bareP, pw + " holds no measures and no tactics yet", pw + "s hold no measures and no tactics yet");
    say("plan", mNoTarget, "measure has no target — it will read as missing it",
      "measures have no target — they will read as missing it");
    say("plan", idleT, "tactic is due in no quarter, so no cycle will ask for it",
      "tactics are due in no quarter, so no cycle will ask for them");
  }
  if (route === "fnprojects") {
    var noDef = 0, emptyP = 0, oNoT = 0, msNoDue = 0;
    capsOfFunction(String(target).slice(3)).forEach(function(c){
      if (!c.def) noDef++;
      (c.projects || []).forEach(function(p){
        if (!p.deliverables.length && !p.outcomes.length) emptyP++;
        p.outcomes.forEach(function(o){ if (!o.target) oNoT++; });
        p.milestones.forEach(function(m){ if (!m.finish) msNoDue++; });
      });
    });
    say("def", noDef, "capability has no definition", "capabilities have no definition");
    say("proj", emptyP, "project holds neither deliverables nor outcomes",
      "projects hold neither deliverables nor outcomes");
    say("proj", oNoT, "outcome has no target", "outcomes have no target");
    say("proj", msNoDue, "milestone has no due date", "milestones have no due date");
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
