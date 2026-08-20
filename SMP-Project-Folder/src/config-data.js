/* ── CONFIGURATION ────────────────────────────────────────────────────────
   Everything a tenant can configure. The internal name is the contract the
   platform is built on and never changes; the display label is what a tenant
   sees on screen. The SMO manages this, not the client.

   Decisions this file implements:
     · Labels are per TENANT, not per cycle — renaming mid-history would make
       a 2026 report and a 2027 report use different words for one object.
     · Every level of the model is configurable, group and business unit alike.
     · Two entities may never share a display label; the collision is blocked
       at save time rather than discovered in a client demo.
   ──────────────────────────────────────────────────────────────────────── */

var LABELS = {
  scope: "tenant",              /* not per-cycle */
  managedBy: "SMO",
  entries: [
    { key:"theme",       internal:"Theme",              group:"Themes",            bu:"Themes",
      note:"The group's standing columns. Also called pillars or motto elements by clients." },
    { key:"pillar",      internal:"Pillar",             group:"Group capabilities", bu:"Pillars",
      note:"A business unit's direction or capability. Carries key measures and tactics." },
    { key:"keyobj",      internal:"Key Objectives",     group:"Key Objectives",    bu:"Key Objectives",
      note:"A unit's own scorecard. Previously called North Star and Guiding Objectives." },
    { key:"aspiration",  internal:"Winning Aspiration", group:"Vision",            bu:"Winning Aspiration",
      note:"One entity. Vision, End State and Winning Aspiration are display labels for it." },
    { key:"purpose",     internal:"Purpose",            group:"Mission",           bu:"—",
      note:"Held by the top unit only. Business units inherit it." },
    { key:"values",      internal:"Core Values",        group:"Core Values",       bu:"—",
      note:"Group-level only. A unit never declares its own." },
    { key:"measure",     internal:"Key Measure",        group:"Key measures",      bu:"Key measures",
      note:"The measures under a single pillar." },
    { key:"tactic",      internal:"Tactic",             group:"Tactics",           bu:"Tactics",
      note:"The work under a pillar. Spans quarters, has an owner." }
  ]
};

/* ── Levels ───────────────────────────────────────────────────────────────
   Levels replace job titles so the model travels between clients. Each tenant
   maps its own titles onto them. A person carries a level AND a unit
   attachment: the level decides WHICH pages, the attachment decides WHOSE.
   The SMO sits outside the ladder entirely — it is a super user, not a rank.
   ──────────────────────────────────────────────────────────────────────── */

var LEVELS = [
  { key:"ceo",  name:"CEO",  titles:"Group Chief Executive",
    note:"One person. Sees everything, manages nothing outside their own unit." },
  { key:"n1",   name:"N-1",  titles:"Business Unit Head · Group CFO · Group COO",
    note:"Runs a business unit, or a group function with no unit of its own." },
  { key:"n2",   name:"N-2",  titles:"Director · Pillar owner",
    note:"Owns pillars within a unit. Most tactic owners sit here." },
  { key:"n3",   name:"N-3",  titles:"Manager · Tactic owner",
    note:"Delivers tactics. Reports progress, reads little else." }
];

var SMO_ROLE = { key:"smo", name:"SMO", note:"Super user. Sees and edits everything, including configuration. Not a level." };

/* The eleven pages, grouped by the seven page TYPES the matrix actually
   controls. A page type resolves against the person's unit attachment, so
   \"N-1 sees BU Performance\" means their own unit's, automatically. */
var PAGES = [
  { key:"g_perf",  scope:"group", label:"Performance", note:"Group headline, business units, themes, capabilities" },
  { key:"g_found", scope:"group", label:"Foundation",  note:"Purpose, aspiration, core values, who we are" },
  { key:"g_temple",scope:"group", label:"Temple",      note:"The strategy on one page. No performance figures" },
  { key:"g_weight",scope:"group", label:"Weighting",   note:"How much each business unit counts" },
  { key:"u_perf",  scope:"unit",  label:"Performance", note:"The unit's headline and its pillars" },
  { key:"u_found", scope:"unit",  label:"Foundation",  note:"The unit's own words and Key Objectives" },
  { key:"u_plan",  scope:"unit",  label:"Strategy",    note:"The plan as agreed, with no reported figure on it" },
  { key:"u_anal",  scope:"unit",  label:"Analysis",    note:"The unit's SWOT" },
  { key:"c_labels",scope:"setup", label:"Labels",      note:"Internal names and tenant display labels" },
  { key:"c_access",scope:"setup", label:"Levels & access", note:"This matrix" },
  { key:"c_bands", scope:"setup", label:"Scoring bands",   note:"The one scale every score reads on" },
  { key:"c_units", scope:"setup", label:"Business units",  note:"Names, codes and which units are active" },
  { key:"c_import",scope:"manage", label:"Import",          note:"Plan and progress templates" },

  { key:"c_fns",   scope:"setup", label:"Supporting functions", note:"Who carries the capabilities" },
  { key:"c_caps",  scope:"setup", label:"Capabilities",    note:"What exists, and which function owns each" },
  { key:"k_perf",  scope:"fn",    label:"Performance",     note:"What this function's capabilities read" },
  { key:"k_found", scope:"fn",    label:"Capability foundation", note:"What each capability is, and its key objectives" },
  { key:"k_proj",  scope:"fn",    label:"Projects",        note:"The plan behind each project, with no reported figure on it" },
  { key:"k_report",scope:"fn",    label:"Reporting",       note:"Enter this cycle's figures" },
  { key:"g_focus", scope:"group", label:"Focus",           note:"Every unit's focus measures" },
  { key:"c_focus", scope:"manage", label:"Focus measures",  note:"Choose what carries reward this cycle" },
  { key:"c_cycle", scope:"manage", label:"Reporting cycle", note:"Open, chase and close" },
  { key:"u_report",scope:"unit",  label:"My reporting",    note:"Enter this cycle's figures" }
];

/* Foundation and Analysis are static pages that can be put into edit. They
   hold authored content, not reported numbers, so reading is the normal state. */
var EDIT_PAGE = { foundation:false, analysis:false, temple:false };

/* How the objectives box reads. A view preference, not stored on the object —
   it changes nothing about the strategy, only how one box is laid out. */
var KO_VIEW = "chips";

/* Configuration screens open read-only. Editing is entered deliberately, which
   is what makes a change to a weight or a threshold an act rather than a slip. */
var EDITING = { weights:false, factors:false, bands:false, units:false };

/* none | view | edit — three states, because the CEO can see the weighting
   table but does not manage it, and that is not expressible in two. */
var ACCESS = {
  smo: { g_perf:"edit", g_found:"edit", g_temple:"edit", g_weight:"edit",
         u_perf:"edit", u_found:"edit", u_anal:"edit", u_plan:"edit", c_labels:"edit", c_access:"edit", c_bands:"edit", c_units:"edit", c_import:"edit", g_focus:"edit", c_focus:"edit", c_cycle:"edit", c_fns:"edit", c_caps:"edit", k_perf:"edit", k_found:"edit", k_proj:"edit", k_report:"edit", u_report:"edit" },
  ceo: { g_perf:"view", g_found:"view", g_temple:"view", g_weight:"view",
         u_perf:"view", u_found:"view", u_anal:"view", u_plan:"view", c_labels:"none", c_access:"none", c_bands:"none", c_units:"none", c_import:"none", g_focus:"edit", c_focus:"edit", c_cycle:"view", c_fns:"view", c_caps:"view", k_perf:"view", k_found:"view", k_proj:"view", k_report:"view", u_report:"none" },
  n1:  { g_perf:"view", g_found:"view", g_temple:"view", g_weight:"none",
         u_perf:"edit", u_found:"edit", u_anal:"edit", u_plan:"edit", c_labels:"none", c_access:"none", c_bands:"none", c_units:"none", c_import:"none", g_focus:"none", c_focus:"none", c_cycle:"none", c_fns:"none", c_caps:"none", k_perf:"edit", k_found:"edit", k_proj:"edit", k_report:"edit", u_report:"edit" },
  n2:  { g_perf:"none", g_found:"view", g_temple:"view", g_weight:"none",
         u_perf:"view", u_found:"view", u_anal:"view", u_plan:"view", c_labels:"none", c_access:"none", c_bands:"none", c_units:"none", c_import:"none", g_focus:"none", c_focus:"none", c_cycle:"none", c_fns:"none", c_caps:"none", k_perf:"edit", k_found:"edit", k_proj:"edit", k_report:"edit", u_report:"none" },
  n3:  { g_perf:"none", g_found:"none", g_temple:"view", g_weight:"none",
         u_perf:"view", u_found:"none", u_anal:"none", u_plan:"none", c_labels:"none", c_access:"none", c_bands:"none", c_units:"none", c_import:"none", g_focus:"none", c_focus:"none", c_cycle:"none", c_fns:"none", c_caps:"none", k_perf:"edit", k_found:"edit", k_proj:"edit", k_report:"edit", u_report:"none" }
};

/* Who is signed in. Changing this re-renders the whole shell against the
   matrix above, so the grid can be judged by using it rather than reading it. */
var PEOPLE = [
  { key:"smo",     name:"Strategy Management Office", level:"smo", unit:"group",  title:"SMO" },
  { key:"ceo",     name:"Group CEO",                  level:"ceo", unit:"group",  title:"Chief Executive" },
  { key:"mobhead", name:"Ashraf Laithy",              level:"n1",  unit:"mobile", title:"Head of Mobile" },
  { key:"loghead", name:"Hazem Roushdy",              level:"n1",  unit:"logistics", title:"Head of Logistics" },
  { key:"rethead", name:"Hossam Farid",               level:"n1",  unit:"retailstores", title:"Head of Retail Stores" },
  { key:"cfo",     name:"Group CFO",                  level:"n1",  unit:"group",  title:"Chief Financial Officer" },
  { key:"b2bhead", name:"Nour Selim",      level:"n1", unit:"b2becomm",            title:"Head of B2B Ecomm" },
  { key:"cehead",  name:"Tarek Nassar",    level:"n1", unit:"consumerelectronics", title:"Head of Consumer Electronics" },
  { key:"oshead",  name:"Sherif Adel",     level:"n1", unit:"onlineshop",          title:"Head of Online Shop" },
  { key:"cohead",  name:"Amr Bakr",        level:"n1", unit:"corporate",           title:"Head of Corporate" },
  { key:"cahead",  name:"Mostafa Deif",    level:"n1", unit:"care",                title:"Head of Care" },
  { key:"ithead",  name:"Yasser Kamal",    level:"n1", unit:"it",                  title:"Head of IT" },
  { key:"nghead",  name:"Chidi Okafor",    level:"n1", unit:"nigeria",             title:"Head of Nigeria" },
  { key:"own_mob", name:"Mennah Farouk",   level:"n1", unit:"mobile",              title:"Strategy custodian, Mobile" },
  { key:"own_ret", name:"Dalia Sabry",     level:"n1", unit:"retailstores",        title:"Strategy custodian, Retail Stores" },
  { key:"own_b2b", name:"Kareem Hafez",    level:"n1", unit:"b2becomm",            title:"Strategy custodian, B2B Ecomm" },
  { key:"own_ce",  name:"Heba Salem",      level:"n1", unit:"consumerelectronics", title:"Strategy custodian, Consumer Electronics" },
  { key:"own_os",  name:"Nadia Fouad",     level:"n1", unit:"onlineshop",          title:"Strategy custodian, Online Shop" },
  { key:"own_co",  name:"Laila Zaki",      level:"n1", unit:"corporate",           title:"Strategy custodian, Corporate" },
  { key:"own_ca",  name:"Rania Fahmy",     level:"n1", unit:"care",                title:"Strategy custodian, Care" },
  { key:"own_it",  name:"Dina Shawky",     level:"n1", unit:"it",                  title:"Strategy custodian, IT" },
  { key:"own_lg",  name:"Mai Sobhy",       level:"n1", unit:"logistics",           title:"Strategy custodian, Logistics" },
  { key:"own_ng",  name:"Amaka Eze",       level:"n1", unit:"nigeria",             title:"Strategy custodian, Nigeria" },
  { key:"fn_fin",  name:"Hossam Abuelenien", level:"n1", unit:null, fn:"finance",   title:"Head of Finance" },
  { key:"fn_hr",   name:"Noran Adel",        level:"n1", unit:null, fn:"hr",        title:"Head of HR" },
  { key:"fn_tre",  name:"Fayad Sobhy",       level:"n1", unit:null, fn:"treasury",  title:"Head of Treasury" },
  { key:"fn_mkt",  name:"Yara Kamal",        level:"n1", unit:null, fn:"marketing", title:"Head of Marketing" },
  { key:"fn_mkt2", name:"Tarek Nour",        level:"n1", unit:null, fn:"marketing", title:"Strategy custodian, Marketing" },
  { key:"dir",     name:"Ramy Behairy",               level:"n2",  unit:"mobile", title:"Director, Digital Operations" }
];

/* Each unit names two people. The HEAD is accountable for the unit; the OWNER
   holds the same access and does the actual work — entering results, adjusting
   the plan, reporting. Separating them stops "who can edit this" and "whose
   number is this" from being the same question, which they are not. */
/* head = the unit's owner by default; the head IS the owner, so nothing else
   should claim that word. The second role holds the strategy on the head's
   behalf: keeps the plan current, makes the entries, reports, and often
   presents. Custodian says exactly that \u2014 keeps it, does not own it.

   "Owner" survives on pillars and tactics, where it means responsibility for a
   piece of work rather than access to a unit. */
var UNIT_ROLES = {
  mobile:              { head:"mobhead", custodian:"own_mob" },
  retailstores:        { head:"rethead", custodian:"own_ret" },
  b2becomm:            { head:"b2bhead", custodian:"own_b2b" },
  consumerelectronics: { head:"cehead",  custodian:"own_ce"  },
  onlineshop:          { head:"oshead",  custodian:"own_os"  },
  corporate:           { head:"cohead",  custodian:"own_co"  },
  care:                { head:"cahead",  custodian:"own_ca"  },
  it:                  { head:"ithead",  custodian:"own_it"  },
  logistics:           { head:"loghead", custodian:"own_lg"  },
  nigeria:             { head:"nghead",  custodian:"own_ng"  }
};

function personName(key){
  var p = PEOPLE.filter(function(x){ return x.key === key; })[0];
  return p ? p.name : null;
}

/* The owner reaches the same pages as the head, for the same unit. */
function unitRoleOf(personKey, unitKey){
  var r = UNIT_ROLES[unitKey];
  if (!r) return null;
  if (r.head === personKey) return "head";
  if (r.custodian === personKey) return "custodian";
  return null;
}

/* ── Focus measures ───────────────────────────────────────────────────────
   The CEO marks a few measures per unit as the ones carrying reward. A mark is
   stored against the CYCLE, not against the measure \u2014 every cycle starts
   unmarked, so last year's emphasis cannot quietly become this year's default.

   Where reward begins is one rule for the whole cycle, not a second target on
   each measure. Focus changes no score anywhere: the unit headline, the pillar
   figures and the group compile are computed exactly as before. Unit weights
   already decide how much a unit counts, and letting focus alter scoring would
   count the same emphasis twice. No compensation arithmetic lives here \u2014 the
   platform reports standing; the scheme pays.

   Focus is a business-unit idea only. The group unit carries none. */
var CYCLE = {
  name: "2026",
  rewardAt: 100,     /* percent of target at which reward begins */
  locked: false,     /* true once the cycle opens */
  /* Chosen so the demo carries every standing the rule can produce \u2014 earning,
     short, and one with nothing reported. A board on which every row says the
     same word demonstrates nothing. */
  focus: {
    "mobile-KO2": true, "mobile-P1-M3": true, "mobile-P3-M2": true,
    "retailstores-KO2": true, "retailstores-P1-M2": true,
    "care-KO2": true, "care-P1-M3": true,
    "logistics-KO3": true, "logistics-P2-M1": true
  }
};

function isFocus(id){ return !!CYCLE.focus[id]; }
function toggleFocus(id){
  if (CYCLE.locked) return false;
  if (CYCLE.focus[id]) delete CYCLE.focus[id]; else CYCLE.focus[id] = true;
  return true;
}
function canMarkFocus(){
  var v = viewer();
  return !CYCLE.locked && (v.level === "smo" || v.level === "ceo");
}

/* Standing is derived from the one rule. Three states at a rule of 100%, four
   above it \u2014 a measure can deliver its commitment without clearing the reward
   line, and that is neither short nor earning. */
function focusStanding(progress){
  if (progress == null) return { key:"none",  label:"Not reported" };
  if (progress >= CYCLE.rewardAt) return { key:"over", label:"Earning" };
  if (progress >= 100) return { key:"met",  label:"Met, not earning" };
  return { key:"short", label:"Short" };
}

/* Every marked item in a unit, objectives and pillar measures alike. */
function unitFocus(u){
  var out = [];
  u.keyObjectives.forEach(function(m){
    if (isFocus(m.id)) out.push({ m:m, src:L("keyobj","bu").toLowerCase() });
  });
  u.items.forEach(function(p, pi){
    p.measures.forEach(function(m){
      if (isFocus(m.id)) out.push({ m:m, src:pillarCode(u, pi) });
    });
  });
  return out;
}
function focusTally(u){
  var t = { over:0, met:0, short:0, none:0, total:0, mean:null };
  var vals = [];
  unitFocus(u).forEach(function(x){
    t.total++;
    t[focusStanding(x.m.progress).key]++;
    if (x.m.progress != null) vals.push(x.m.progress);
  });
  t.mean = avg(vals);
  return t;
}

/* ── Supporting functions ─────────────────────────────────────────────────
   A capability is cross-cutting: the whole group depends on it, and a supporting
   function improves it through enhancement work. Finance, HR and Treasury are
   not business units and never will be \u2014 they carry no plan and no weight \u2014 so
   they are their own list rather than units in disguise.

   A function has a head and, optionally, one Strategy custodian \u2014 the same two
   roles a business unit has, in the same shape. Where the head does the work
   themselves the slot stays empty: they already have access as head, and a
   second record for the same person would put one person on the board twice. */
/* Version. Counted from the point versioning began rather than from nothing \u2014
   there were roughly eleven build rounds before this, so the first numbered
   release is 1.0. It lives in the FILENAME, not on screen: the platform is shown
   to clients and a version badge in the chrome is noise to them. */
var VERSION = "2.1";

/* A function carries the same fields a unit does, in the same shapes: an
   editable name, a short name for the navigation, a code prefix for numbering
   its work, one head and one Strategy custodian, and a retired flag. Two
   configuration screens that mean the same thing should not behave differently.

   navName is left empty deliberately \u2014 what appears in the navigation is a
   choice for whoever runs the platform, not a default anybody inherits. */
var FUNCTIONS = {
  finance:   { name:"Finance",   navName:null, codePrefix:"FIN", head:"fn_fin",  custodian:null,     active:true },
  hr:        { name:"HR",        navName:null, codePrefix:"HR",  head:"fn_hr",   custodian:null,     active:true },
  treasury:  { name:"Treasury",  navName:null, codePrefix:"TRS", head:"fn_tre",  custodian:null,     active:true },
  marketing: { name:"Marketing", navName:null, codePrefix:"MKT", head:"fn_mkt",  custodian:"fn_mkt2",active:true },
  it:        { name:"IT",        navName:null, codePrefix:"ITF", head:"ithead",  custodian:"own_it", active:true },
  care:      { name:"Care",      navName:null, codePrefix:"CAF", head:"cahead",  custodian:"own_ca", active:true },
  smo:       { name:"Strategy Management Office", navName:null, codePrefix:"SMO", head:"smo", custodian:null, active:true }
};
var FUNCTION_KEYS = ["finance","hr","treasury","marketing","it","care","smo"];

/* Each capability is allocated to exactly one function. A function may hold
   more than one \u2014 Marketing carries both Brand Positioning and Product Mindset
   \u2014 which is why a custodian is named after the FUNCTION and never after a
   capability. */
var CAP_FUNCTION = {
  "Operational Excellence":  "treasury",
  "People":                  "hr",
  "Innovation and Tech":     "it",
  "Brand Positioning":       "marketing",
  "Customer Centric":        "care",
  "Product Mindset":         "marketing",
  "Financial Infrastructure":"finance",
  "Strategy":                "smo"
};
GROUP.capabilities.forEach(function(c){ c.fn = CAP_FUNCTION[c.name] || null; });

function functionOf(key){ return FUNCTIONS[key] || null; }
function capById(id){
  return GROUP.capabilities.filter(function(c){ return c.id === id; })[0] || null;
}
/* Who reaches a capability: the SMO and CEO see all of them; a function's own
   people see theirs. A unit head has no business in a capability at all. */
function reachesCap(capId){
  var v = viewer(), c = capById(capId);
  if (!c) return false;
  if (v.level === "smo" || v.level === "ceo") return true;
  return functionPeople(c.fn).indexOf(v.key) > -1;
}
/* ── What a capability reads ──────────────────────────────────────────
   Three numbers, never folded into one, and one of them is optional.

   KEY OBJECTIVES — optional. Weighted exactly as a unit's are. A capability
   with none does not show the card at all; it is not shown at zero.

   PROJECT PERFORMANCE — half from the deliverables side, half from the
   outcomes side, PER SIDE and not per row. Four deliverables and one outcome
   still weigh 50/50, because they are two different kinds of evidence that a
   project achieved what it set out to, not six comparable items.

   EXECUTION — milestones completed, and nothing else.

   An outcome whose measurement time has not arrived is absent from the
   arithmetic. It is not a zero. A project that has delivered everything and
   cannot yet be measured reads on its deliverables alone, which is why its
   number can FALL later when the outcomes arrive below target. That is the
   project's real story rather than a defect. */

function capKOScore(c){
  var list = (c.keyObjectives || []).filter(function(m){ return m.progress != null; });
  if (!list.length) return null;
  var tw = 0, sum = 0;
  list.forEach(function(m){ var w = m.weight == null ? 1 : m.weight; tw += w; sum += m.progress * w; });
  return tw ? Math.round(sum / tw) : null;
}

/* A deliverable reads 100 or 0 when it is delivered-or-not, and its own
   percentage when it is a percentage. Nothing reported is absent, not zero. */
function delivReads(d){
  if (d.actual == null || d.actual === "") return null;
  if (d.kind === "pct") return Math.max(0, Math.min(100, Number(d.actual)));
  return String(d.actual).toLowerCase() === "yes" ? 100 : 0;
}
function sideAvg(vals){
  var v = vals.filter(function(x){ return x != null && !isNaN(x); });
  if (!v.length) return null;
  return Math.round(v.reduce(function(a, b){ return a + b; }, 0) / v.length);
}
function projDeliverySide(p){
  return sideAvg((p.deliverables || []).map(delivReads));
}
function projOutcomeSide(p){
  return sideAvg((p.outcomes || []).map(function(o){ return o.progress; }));
}
function projPerf(p){
  var d = projDeliverySide(p), o = projOutcomeSide(p);
  if (d == null && o == null) return null;
  if (d == null) return o;
  if (o == null) return d;
  return Math.round(d * 0.5 + o * 0.5);
}
function projMilestones(p){
  var ms = p.milestones || [], done = 0, wip = 0, todo = 0;
  ms.forEach(function(m){
    if (m.status === "done") done++;
    else if (m.status === "wip") wip++;
    else todo++;
  });
  return { done: done, wip: wip, todo: todo, total: ms.length };
}
/* A milestone whose finish date falls after its project's end date is saved
   exactly as entered. The platform never refuses it \u2014 it says so, and offers
   the two things that might be true. */
function projOverruns(p){
  if (p.timeline !== "date" || !p.end) return [];
  var endT = Date.parse(p.end);
  if (isNaN(endT)) return [];
  return (p.milestones || []).filter(function(m){
    var t = Date.parse(m.finish);
    return !isNaN(t) && t > endT;
  });
}
function capPerf(c){
  return sideAvg((c.projects || []).map(projPerf));
}
function capExec(c){
  var done = 0, total = 0, wip = 0, todo = 0;
  (c.projects || []).forEach(function(p){
    var m = projMilestones(p);
    done += m.done; wip += m.wip; todo += m.todo; total += m.total;
  });
  return { done: done, wip: wip, todo: todo, total: total,
           pct: total ? Math.round(done / total * 100) : null };
}
function capDeliverySide(c){ return sideAvg((c.projects || []).map(projDeliverySide)); }
function capOutcomeSide(c){ return sideAvg((c.projects || []).map(projOutcomeSide)); }

/* What a capability asks for this cycle: its key objectives, plus everything in
   its projects whose time has come. An outcome measured at Q4 is not an empty
   box somebody forgot in Q2 \u2014 it is not asked. */
function outcomeDue(o){
  if (!o.measureAt) return true;
  var q = String(o.measureAt).match(/Q([1-4])\s*(\d{4})?/);
  if (!q) return true;
  var cq = String(REVIEW.name || "").match(/Q([1-4])\s*(\d{4})?/);
  if (!cq) return true;
  var oy = q[2] ? +q[2] : 0, cy = cq[2] ? +cq[2] : 0;
  if (oy && cy && oy !== cy) return oy < cy;
  return +q[1] <= +cq[1];
}
function delivDue(d){
  if (!d.due) return true;
  var q = String(d.due).match(/Q([1-4])/);
  var cq = String(REVIEW.name || "").match(/Q([1-4])/);
  if (!q || !cq) return true;
  return +q[1] <= +cq[1];
}
function projReported(p){
  var n = 0, total = 0;
  (p.deliverables || []).forEach(function(d){
    if (!delivDue(d)) return;
    total++;
    if (d.actual != null && d.actual !== "") n++;
  });
  (p.outcomes || []).forEach(function(o){
    if (!outcomeDue(o)) return;
    total++;
    if (o.actual != null && o.actual !== "") n++;
  });
  (p.milestones || []).forEach(function(m){
    total++;
    if (m.status) n++;
  });
  return { done: n, total: total };
}
function capReported(c){
  var n = 0, total = 0;
  (c.keyObjectives || []).forEach(function(m){
    total++;
    if (m.actual != null && m.actual !== "") n++;
  });
  (c.projects || []).forEach(function(p){
    var r = projReported(p);
    n += r.done; total += r.total;
  });
  return { done: n, total: total };
}

function capsReachable(){
  return GROUP.capabilities.filter(function(c){ return reachesCap(c.id); });
}
function capsOfFunction(key){
  return GROUP.capabilities.filter(function(c){ return c.fn === key; });
}
/* Everyone who can act for a function: the head, and the custodian if there is one. */
function functionPeople(key){
  var f = FUNCTIONS[key];
  if (!f) return [];
  return [f.head, f.custodian].filter(Boolean);
}
/* Who can reach a capability: the people of the function that carries it, plus
   the SMO and the CEO. Nobody else \u2014 a business unit has no business in another
   function's improvement work. */
/* Navigation is by FUNCTION, not by capability. The custodian is named after
   the function, a function may carry more than one capability, and the
   capabilities themselves already appear in the temple \u2014 so the row offers the
   organisation you belong to, and the capability names appear inside its
   pages. */
/* A short name for the navigation only. "Consumer Electronics" costs more of
   the row than it earns, and a unit may be known internally by a brand the
   formal name does not carry \u2014 B2B Ecomm trading as Mazaya.

   It is deliberately NOT used anywhere else. Page titles, group cards, the
   deck and every export keep the full name, or a board pack ends up saying
   "CE" to people who have never heard it. */
function navName(x){ return (x && x.navName) ? x.navName : (x ? x.name : ""); }

function reachesFn(key){
  var v = viewer();
  if (v.level === "smo" || v.level === "ceo") return true;
  return functionPeople(key).indexOf(v.key) > -1;
}
function fnsReachable(){
  return FUNCTION_KEYS.filter(function(k){
    return FUNCTIONS[k].active !== false && reachesFn(k) && capsOfFunction(k).length;
  });
}
/* A function is retired, never deleted \u2014 it carries reported history, exactly
   as a unit does. */
/* Clearing a capability. Its PLAN is the work it intends \u2014 today measures and
   initiatives, tomorrow enhancement projects. Its PROGRESS is what has been
   reported against that work. The definition is the capability's identity, not
   its plan, so it survives both. */
function clearCapability(cap, what){
  if (what === "plan") {
    /* A capability's plan is its key objectives and its PROJECTS, each
       carrying deliverables, outcomes and milestones. Until 2026-08-20 this
       emptied `cap.measures` and `cap.tactics` — the fields a capability
       stopped having in 1.7 when the project model replaced them. The line
       threw on a missing array, so "Clear all plans" on Supporting functions
       had done nothing at all since then. The definition survives: it is the
       capability's identity, not its plan. */
    if (cap.keyObjectives) cap.keyObjectives.length = 0;
    if (cap.projects) cap.projects.length = 0;
    return;
  }
  (cap.keyObjectives || []).forEach(function(m){ m.actual = ""; m.progress = null; m.note = ""; });
  (cap.projects || []).forEach(function(p){
    (p.deliverables || []).forEach(function(d){ d.actual = null; d.note = ""; });
    (p.outcomes || []).forEach(function(o){ o.actual = null; o.progress = null; o.note = ""; });
    (p.milestones || []).forEach(function(m){ m.status = null; m.note = ""; });
  });
}
/* One function may carry several capabilities \u2014 Marketing carries two \u2014 so
   clearing at the function level names how many it will take with it. */
function clearFunction(fnKey, what){
  capsOfFunction(fnKey).forEach(function(c){ clearCapability(c, what); });
}
function functionCapCount(fnKey){ return capsOfFunction(fnKey).length; }

function activeFunctionKeys(){
  return FUNCTION_KEYS.filter(function(k){ return FUNCTIONS[k].active !== false; });
}
function reachesCap(cap){ return !!cap.fn && reachesFn(cap.fn); }
function capsReachable(){ return GROUP.capabilities.filter(reachesCap); }
function unitsReachable(){
  return activeKeys().filter(reaches);
}
/* The folds exist for the length problem, and only two roles have one. Someone
   who reaches a single unit never meets the concept. */
function navFolds(){
  return unitsReachable().length > 1 && fnsReachable().length > 1;
}

function functionsOfPerson(personKey){
  return FUNCTION_KEYS.filter(function(k){
    return functionPeople(k).indexOf(personKey) > -1;
  });
}

/* ── The reporting cycle ──────────────────────────────────────────────────
   A window the SMO opens. It becomes a request sitting with each unit's owner,
   and closing it snapshots everything \u2014 which is what finally gives the
   product a past to compare against.

   The window's end is where `as-of` comes from. It was a constant of 2 sitting
   in the data; a review that covers Jan\u2013Jun and one that covers the full year
   cannot both be measured from the same quarter. */
var REVIEW = {
  name: "H1 2026",
  from: "Jan 2026", to: "Jun 2026", due: "15 Jul 2026",
  endsQuarter: 2,
  state: "open",              /* open | closed */
  /* Seeded mid-cycle: most units have reported and submitted, a few are still
     working, one has not begun. A board on which every row says the same thing
     demonstrates nothing \u2014 the same lesson the focus board taught. */
  note: {
    mobile: "Digital work is landing but the app rollout slipped a quarter behind the principal's own launch. Q3 recovery agreed with Ramy.",
    retailstores: "Strong half on revenue per store. New store programme is one site behind, land permits.",
    care: "First-time fix rate now above target for the first time. Headcount is the constraint on the next step."
  },
  submitted: { retailstores:true, care:true, corporate:true, it:true, logistics:true, onlineshop:true },
  cadence: "Half-yearly"
};

/* Prior closes. Only the headline per unit is kept here; a real build snapshots
   every figure and the target it was judged against. Seeded with one earlier
   cycle so deltas have something to read \u2014 these numbers are invented. */
var HISTORY = [
  { name:"H2 2025", group:64,
    units:{ mobile:56, retailstores:79, b2becomm:61, consumerelectronics:58, onlineshop:66,
            corporate:71, care:66, it:63, logistics:69, nigeria:44 } }
];
function lastClose(){ return HISTORY.length ? HISTORY[HISTORY.length - 1] : null; }
function deltaFor(key){
  var h = lastClose(); if (!h) return null;
  var was = key === "group" ? h.group : h.units[key];
  var now = key === "group" ? groupUnitsObjectives() : unitObjectives(UNITS[key]);
  if (was == null || now == null) return null;
  return { was:was, d:now - was };
}

/* Whether the plan may be edited. Opening a cycle does not freeze the plan
   outright \u2014 it makes changes the SMO's alone for the span, so a mid-cycle
   correction still goes through one accountable hand rather than a unit
   quietly moving its own target while reporting against it. */
function planEditable(){
  return REVIEW.state !== "open" || viewer().level === "smo";
}

/* Reporting reaches the unit's owner and its head; the owner is the primary
   user. The SMO can enter on anyone's behalf, and enters the group's own
   objectives and capabilities directly \u2014 nobody is asked for those. */
function canReport(unitKey){
  var v = viewer();
  if (REVIEW.state !== "open") return false;
  if (v.level === "smo") return true;
  var r = UNIT_ROLES[unitKey];
  return !!r && (r.head === v.key || r.custodian === v.key);
}

/* What this cycle asks a unit for: its objectives, every measure carrying a
   target, and the tactics whose quarters fall inside the window. A tactic
   outside it is not an empty box somebody forgot \u2014 it is not asked. */
function reportItems(u){
  var out = [];
  u.keyObjectives.forEach(function(m){
    out.push({ id:m.id, obj:m, kind:"objective", group:L("keyobj","bu"), sub:"" });
  });
  u.items.forEach(function(p, pi){
    var head = pillarCode(u, pi) + " " + p.name;
    p.measures.forEach(function(m){
      out.push({ id:m.id, obj:m, kind:"measure", group:head, sub:"" });
    });
    p.tactics.forEach(function(t){
      out.push({ id:t.id, obj:t, kind:"tactic", group:head,
                 sub:spanLabel(t), asked:tacticDue(t) });
    });
  });
  return out;
}
function askedItems(u){
  return reportItems(u).filter(function(x){ return x.kind !== "tactic" || x.asked; });
}
function reportedCount(u){
  var a = askedItems(u), n = 0;
  a.forEach(function(x){
    var v = x.kind === "tactic" ? x.obj.actual : x.obj.actual;
    if (v != null && v !== "") n++;
  });
  return { done:n, total:a.length };
}
/* A note is required where a figure lands in the bottom two bands. A red
   number with no explanation is the thing a review meeting stalls on. */
function needsNote(x){
  var p = x.kind === "tactic" ? tacticRatio(x.obj) : x.obj.progress;
  if (p == null) return false;
  var k = bandOf(p).key;
  return (k === "bad" || k === "warn") && !(x.obj.note && x.obj.note.trim());
}
function missingNotes(u){ return askedItems(u).filter(needsNote); }
function unitState(u){
  if (REVIEW.submitted[u.ukey]) return { key:"done", label:"Submitted" };
  var c = reportedCount(u);
  if (!c.done) return { key:"late", label:"Not started" };
  return { key:"part", label:"In progress" };
}

/* Two units are genuinely mid-report: some figures in, some not. Without this
   every row on the SMO's board reads 100% and the screen cannot show what it
   exists to show. */
(function seedPartialReporting(){
  var partial = { consumerelectronics:5, nigeria:99 };
  Object.keys(partial).forEach(function(k){
    var u = UNITS[k], left = partial[k], seen = 0;
    var wipe = function(m){
      seen++;
      if (seen > left) { m.actual = ""; m.progress = null; }
    };
    u.keyObjectives.forEach(wipe);
    u.items.forEach(function(p){ p.measures.forEach(wipe); });
    if (k === "nigeria") {
      u.keyObjectives.forEach(function(m){ m.actual = ""; m.progress = null; });
      u.items.forEach(function(p){
        p.measures.forEach(function(m){ m.actual = ""; m.progress = null; });
        p.tactics.forEach(function(t){ t.actual = null; t.status = "Not started"; });
      });
    }
  });
})();

var VIEWER = "smo";

/* Every caller treats this as a person, not a maybe — `grant`, `reaches`,
   `paint` and the pages all read straight off the result. So it resolves
   rather than returning nothing: if the name being viewed as is no longer in
   the list, the first person stands in and VIEWER is corrected to match, so
   the switcher and the screen cannot disagree. The list changes under a live
   page in two ways — hydration replaces the baked-in example with the tenant's
   own people, and the Demo button swaps the two datasets — and before
   2026-08-20 either one left a departed key selected and threw on the next
   repaint. */
function viewer(){
  var v = PEOPLE.filter(function(p){ return p.key === VIEWER; })[0];
  if (v) return v;
  if (!PEOPLE.length) return { key: VIEWER, name: "\u2014", title: "", level: "smo", unit: "group" };
  VIEWER = PEOPLE[0].key;
  return PEOPLE[0];
}
function grant(pageKey){
  var v = viewer();
  return (ACCESS[v.level] || {})[pageKey] || "none";
}
/* A person attached to the group reaches every unit; a person attached to a
   unit reaches only their own. This is the whole of scope — no page ever
   renders a trimmed version of itself. */
function reaches(unitKey){
  var v = viewer();
  if (unitKey === "group" || unitKey === "setup") return true;
  /* Someone attached to a supporting function rather than a business unit
     reaches no unit pages. Attaching them to "group" would hand them all ten,
     because that is what group attachment means here. */
  if (!v.unit) return false;
  return v.unit === "group" || v.unit === unitKey;
}

/* ── Key Objective weights ────────────────────────────────────────────────
   Optional. Unweighted means equal weight, which is the one default nobody
   has to argue for. Where weights are set they must total 100 within the unit.
   ──────────────────────────────────────────────────────────────────────── */

/* Only Mobile has weights set, to show the mechanism. Every other unit is
   equal-weighted, which is the default nobody has to defend. */
var KO_WEIGHTS = { mobile: [40, 25, 20, 15] };

function koScore(list, weights){
  var vals = list.filter(function(m){ return !m.milestone && m.progress != null; });
  if (!vals.length) return null;
  if (!weights) {
    return Math.round(vals.reduce(function(a, m){ return a + m.progress; }, 0) / vals.length);
  }
  var tot = 0, acc = 0;
  list.forEach(function(m, i){
    if (m.milestone || m.progress == null) return;
    var w = weights[i] == null ? 0 : weights[i];
    acc += m.progress * w; tot += w;
  });
  return tot ? Math.round(acc / tot) : null;
}

/* ── Weighting factors: configurable from the start ───────────────────────
   Stored as rows rather than four fixed columns, so adding a fifth factor is
   data entry rather than a migration. Each factor declares its own type,
   which decides how its values are captured.

   Per cycle, not per tenant — each year takes insight from the last, so the
   previous cycle's split is carried here to be shown beside the new one.
   ──────────────────────────────────────────────────────────────────────── */

var FACTOR_TYPES = {
  derived:   { label:"Derived",   note:"Read from a stored figure. Not typed by hand." },
  judgement: { label:"Judgement", note:"Set on a scale, carries a written reason." },
  estimate:  { label:"Estimate",  note:"A view, entered as a figure." }
};

var PRIOR_CYCLE = {
  year: 2025,
  factors: [ { key:"rev", weight:45 }, { key:"prof", weight:30 },
             { key:"imp", weight:15 }, { key:"growth", weight:10 } ],
  composite: { Mobile:48, Retail:30, Mazaya:22 }
};

/* Set true once a review cycle has been reported. Any factor change from here
   moves a number that has already been seen, so it warns first. */
var CYCLE_REPORTED = true;

/* Units carry their own key so a render function can look up configuration
   that lives outside the unit object. */
Object.keys(UNITS).forEach(function(k){ UNITS[k].ukey = k; });



/* ── Scoring bands ────────────────────────────────────────────────────────
   ONE scale for every achievement-against-benchmark figure. Performance is
   actual over target; execution is delivered over plan. Both are the same kind
   of number, so both read on the same bands — and the status word is derived
   from the same function as the colour, which is what stops a green figure
   sitting beside a contradicting word.

   Per tenant, one standing scale. Moving a threshold silently rewrites how
   every past report reads, so a change warns the same way a weighting change
   does. 70 and 50 match the platform's existing STATUS_THRESHOLDS so the
   strategy layer and the functional layer never disagree about a colour;
   85 is the added top edge.
   ──────────────────────────────────────────────────────────────────────── */

var BANDS = {
  scope: "tenant",
  bands: [
    { key:"good", floor:85, label:"On track" },
    { key:"attn", floor:70, label:"Needs attention" },
    { key:"warn", floor:50, label:"At risk" },
    { key:"bad",  floor:0,  label:"Off track" }
  ]
};

function bandOf(v){
  if (v == null || isNaN(v)) return { key:"none", label:"No data" };
  var b = BANDS.bands;
  for (var i=0;i<b.length;i++) if (v >= b[i].floor) return b[i];
  return b[b.length-1];
}

/* ── Derived scores ───────────────────────────────────────────────────────
   Nothing below is stored. A pillar's performance comes from its measures and
   its execution from its tactics; a unit compiles from its pillars; the group
   compiles from its units. A row and its expansion can therefore never
   disagree, which is the failure the earlier prototype had built in.
   ──────────────────────────────────────────────────────────────────────── */

/* ── Quarters ─────────────────────────────────────────────────────────────
   A tactic carries a flag per quarter rather than a start and an end, because
   real work skips quarters — a plan can run Q2 and Q4 with nothing in Q3, and
   a span cannot say that.

   This is what finally makes `planned` derived rather than stored. What a
   tactic SHOULD have delivered by now is the share of its own active quarters
   that have already passed. A tactic running Q1–Q2, reviewed at H1, is due at
   100%; one running Q2–Q4 is due at a third.
   ──────────────────────────────────────────────────────────────────────── */

function quartersOf(t){
  return [t.q1, t.q2, t.q3, t.q4].map(function(x){ return x ? 1 : 0; });
}
function tacticPlanned(t){
  var q = quartersOf(t), total = 0, elapsed = 0;
  for (var i = 0; i < 4; i++) {
    if (!q[i]) continue;
    total++;
    if (i + 1 <= REVIEW.endsQuarter) elapsed++;
  }
  if (!total) return null;
  return Math.round(elapsed / total * 100);
}
/* A tactic whose quarters have not begun is not behind — it is not yet due,
   and averaging a zero into execution would say otherwise. */
function tacticDue(t){ return tacticPlanned(t) > 0; }
function tacticRatio(t){
  var p = tacticPlanned(t);
  return p && t.actual != null ? Math.round(t.actual / p * 100) : null;
}
function spanLabel(t){
  var q = quartersOf(t), on = [];
  for (var i = 0; i < 4; i++) if (q[i]) on.push("Q" + (i + 1));
  return on.join(", ");
}

/* Nulls are dropped rather than counted. A measure with no target set is not
   a measure scoring zero \u2014 it is a measure that cannot be scored, and averaging
   a zero in would report a plan as failing because a target was left blank. */
function avg(a){
  var v = a.filter(function(x){ return x != null && !isNaN(x); });
  return v.length ? Math.round(v.reduce(function(x,y){ return x+y; },0)/v.length) : null;
}

/* The code is positional, not an identifier — it references nothing outside
   the platform, so reordering renumbers it. The unit prefix is kept because it
   still says which unit a pillar belongs to when pillars are listed together
   at group level. */
function pillarCode(u, i){
  return (u.codePrefix || "") + String(i + 1).padStart(2, "0");
}

function scorableMeasures(p){ return p.measures.filter(function(m){ return m.target && m.progress != null; }); }
function pillarPerf(p){ return avg(scorableMeasures(p).map(function(m){ return m.progress; })); }
function dueTactics(p){ return p.tactics.filter(tacticDue); }
/* A tactic that is due but has nothing reported is not delivering zero \u2014 it is
   unreported, and averaging a zero would say the plan is failing. */
function reportedTactics(p){ return dueTactics(p).filter(function(t){ return t.actual != null; }); }
function pillarExec(p){ return avg(reportedTactics(p).map(function(t){ return t.actual; })); }
function pillarPlan(p){ return avg(reportedTactics(p).map(tacticPlanned)); }
function pillarRatio(p){ var pl = pillarPlan(p); return pl ? Math.round(pillarExec(p)/pl*100) : null; }

function unitPillars(u){ return avg(u.items.map(pillarPerf)); }
function unitExec(u){ return avg(u.items.map(pillarExec)); }
function unitPlan(u){ return avg(u.items.map(pillarPlan)); }
function unitRatio(u){ var pl = unitPlan(u); return pl ? Math.round(unitExec(u)/pl*100) : null; }

var UNIT_KEYS = ["mobile","retailstores","b2becomm","consumerelectronics","onlineshop",
                 "corporate","care","it","logistics","nigeria"];

/* A unit is identified by its KEY everywhere. The name is display only, the
   same as any other label — so renaming one cannot break a lookup. The
   weighting table used to match on the name string, which meant a rename
   silently detached a unit from its weight with no error anywhere. */
GROUP.weighting.units.forEach(function(row){
  row.key = UNIT_KEYS.filter(function(k){ return UNITS[k].name === row.unit; })[0] || null;
});

/* Inactive units keep every pillar, measure, tactic and reported figure. They
   simply stop appearing — retiring a unit must never destroy a cycle's record. */
Object.keys(UNITS).forEach(function(k){ if (UNITS[k].active == null) UNITS[k].active = true; });

/* Seeded at zero and filled by syncWeights() from the factor table. A weight
   stored in the data would be a second source that looks authoritative and is
   overwritten on first render — which is how a stale 45% survived long after
   the composite said 21%. */

/* Every item carries a stable id. Without one, a re-upload cannot tell a
   corrected target from a new measure, and would duplicate a plan every time
   the sheet was loaded. The platform generates these; the template carries
   them; nobody types them. */
UNIT_KEYS.forEach(function(k){
  var u = UNITS[k];
  u.clauses.forEach(function(c, i){ c[2] = k + "-F" + (i + 1); });
  u.keyObjectives.forEach(function(m, i){ m.id = k + "-KO" + (i + 1); });
  u.items.forEach(function(p, pi){
    p.id = k + "-P" + (pi + 1);
    p.measures.forEach(function(m, mi){ m.id = p.id + "-M" + (mi + 1); });
    p.tactics.forEach(function(t, ti){ t.id = p.id + "-T" + (ti + 1); });
  });
});

/* Emptying a unit so a plan can be loaded fresh. The unit itself survives \u2014
   its name, code, roles and weight are configuration, not plan content. What
   goes is everything a plan template carries, which is exactly what a fresh
   upload will put back. */
/* A theme's code is what every pillar points at. Renaming it has to carry the
   pillars with it, or they silently detach and stop appearing under any theme
   \u2014 the same failure the unit-name rename had before keys were introduced. */
function renameTheme(oldAb, newAb){
  if (!newAb || oldAb === newAb) return;
  UNIT_KEYS.forEach(function(k){
    UNITS[k].items.forEach(function(p){ if (p.theme === oldAb) p.theme = newAb; });
  });
}
function pillarsUsingTheme(ab){
  var n = 0;
  UNIT_KEYS.forEach(function(k){
    UNITS[k].items.forEach(function(p){ if (p.theme === ab) n++; });
  });
  return n;
}

/* Group capabilities carry their own reported figures rather than tactics, so
   clearing progress everywhere has to reach them too or the group page would
   still show numbers after every unit had been emptied. */
/* A new unit must be born with every list a page will read, or the first
   click into it crashes on a missing array. It arrives inactive-in-content
   but active in the nav, weighted at zero until the SMO fills its factor row,
   and with the group's clause labels as a starting skeleton. */
function addBusinessUnit(){
  var n = 1, key, name;
  do { key = "newunit" + n; name = "New unit " + n; n++; } while (UNITS[key]);
  UNITS[key] = {
    name: name, codePrefix: "NU", weight: 0, real: false, active: true, ukey: key,
    clauses: GROUP.clauses.map(function(c, i){ return [c[0], "", key + "-F" + (i + 1)]; }),
    aspiration: "", endInMind: "",
    keyObjectives: [], swot: { s: [], w: [], o: [], t: [] }, items: []
  };
  UNIT_KEYS.push(key);
  UNIT_ROLES[key] = { head: null, custodian: null };
  GROUP.weighting.units.push({ key: key, unit: name, rev: 0, prof: 0, imp: 1, growth: 0,
    why: "" });
  syncWeights();
  return key;
}

function clearGroupNumbers(){
  GROUP.capabilities.forEach(function(c){ c.perf = null; c.exec = null; });
  GROUP.keyObjectives.forEach(function(m){ m.actual = ""; m.progress = null; });
}
function clearAllNumbers(){ UNIT_KEYS.forEach(function(k){ clearUnitNumbers(UNITS[k]); }); clearGroupNumbers(); }
function clearAllPlans(){ UNIT_KEYS.forEach(function(k){ clearUnitPlan(UNITS[k]); }); }

function clearUnitPlan(u){
  u.items = [];
  u.keyObjectives = [];
  u.swot = { s:[], w:[], o:[], t:[] };
  u.clauses.forEach(function(c){ c[1] = ""; });
  u.aspiration = "";
  u.endInMind = "";
}

/* Clearing what was REPORTED, keeping what was COMMITTED TO. This is the start
   of a reporting cycle: the plan stands, the numbers go.

   Cleared means null, never zero. A measure with no actual is unreported, not
   a measure that achieved nothing, and a tactic reset to 0% would read as
   started-and-delivered-nothing rather than not-yet-reported. */
function clearUnitNumbers(u){
  u.keyObjectives.forEach(function(m){ m.actual = ""; m.progress = null; });
  u.items.forEach(function(p){
    p.measures.forEach(function(m){ m.actual = ""; m.progress = null; });
    p.tactics.forEach(function(t){ t.actual = null; t.status = "Not started"; });
  });
}

/* Capabilities never got ids. Every other item has one, which is how a row is
   addressed, reported against and matched on import \u2014 without them a
   capability could be rendered but not written to. Projects, and the three
   lists inside them, are addressed the same way. */
GROUP.capabilities.forEach(function(c, ci){
  c.id = "cap" + (ci + 1);
  c.keyObjectives.forEach(function(m, i){ m.id = c.id + "-KO" + (i + 1); });
  c.projects.forEach(function(p, pi){
    p.id = c.id + "-P" + (pi + 1);
    p.capId = c.id;
    p.deliverables.forEach(function(d, i){ d.id = p.id + "-D" + (i + 1); });
    p.outcomes.forEach(function(o, i){ o.id = p.id + "-O" + (i + 1); });
    p.milestones.forEach(function(m, i){ m.id = p.id + "-M" + (i + 1); });
  });
});

/* Address any row inside a capability by its id: a key objective, or a
   deliverable, outcome or milestone inside one of its projects. Reporting
   needs this to write an entry back — without it a figure could be typed and
   silently lost, which is what happened before the project model landed. */
/* Whether the Report section appears at all, and how loudly.

   Three states, and the middle one is the reason this is a function rather
   than a boolean. While the cycle is OPEN and unsubmitted it is gold: it is the
   only thing on the screen asking for something. Once SUBMITTED it stays, but
   quiet \u2014 somebody who has just sent figures to the SMO will want to see what
   they sent, and if the tab were gone there would be nowhere to look. Once the
   cycle is CLOSED there is genuinely nothing there, and it goes.

   Submission and closure look like one rule and are not: after submitting, the
   cycle is still live and the SMO may reopen it. */
function reportSectionState(){
  if (!REVIEW || REVIEW.state !== "open") return null;
  var submitted = !!(REVIEW.submitted && REVIEW.submitted[CURRENT_REPORT_KEY]);
  return submitted
    ? { cls:"quiet", badge:' <span class="pill good">Submitted</span>' }
    : { cls:"appear", badge:"" };
}
var CURRENT_REPORT_KEY = null;

function capItemById(id){
  var hit = null;
  GROUP.capabilities.forEach(function(c){
    (c.keyObjectives || []).forEach(function(m){ if (m.id === id) hit = { kind:"ko", obj:m, cap:c }; });
    (c.projects || []).forEach(function(p){
      (p.deliverables || []).forEach(function(d){ if (d.id === id) hit = { kind:"deliverable", obj:d, cap:c, proj:p }; });
      (p.outcomes || []).forEach(function(o){ if (o.id === id) hit = { kind:"outcome", obj:o, cap:c, proj:p }; });
      (p.milestones || []).forEach(function(m){ if (m.id === id) hit = { kind:"milestone", obj:m, cap:c, proj:p }; });
    });
  });
  return hit;
}
function capOfProjectId(id){
  var hit = null;
  GROUP.capabilities.forEach(function(c){
    (c.projects || []).forEach(function(p){ if (p.id === id) hit = c; });
  });
  return hit;
}

function findById(u, id){
  var hit = null;
  /* The aspiration is a single field on the unit rather than a row in a list,
     so it needs its own id or a round trip reports it as a new item. */
  if (id === u.ukey + "-ASP1") return { kind:"ASPIRATION", obj:u, which:"aspiration" };
  if (id === u.ukey + "-ASP2") return { kind:"ASPIRATION", obj:u, which:"end" };
  if (id === u.ukey + "-PLAN") return { kind:"PLAN", obj:u };
  var sw = id.match(/^(.+)-([SWOT])(\d+)$/);
  if (sw && sw[1] === u.ukey) {
    var key = { S:"s", W:"w", O:"o", T:"t" }[sw[2]];
    var arr = u.swot[key] || [];
    var idx = +sw[3] - 1;
    if (arr[idx] != null) return { kind:sw[2] === "S" ? "STRENGTH" : sw[2] === "W" ? "WEAKNESS" : sw[2] === "O" ? "OPPORTUNITY" : "THREAT",
                                   obj:{ name:arr[idx] }, swot:{ arr:arr, idx:idx } };
  }
  u.keyObjectives.forEach(function(m){ if (m.id === id) hit = { kind:"OBJECTIVE", obj:m }; });
  u.items.forEach(function(p){
    if (p.id === id) hit = { kind:"PILLAR", obj:p };
    p.measures.forEach(function(m){ if (m.id === id) hit = { kind:"MEASURE", obj:m, pillar:p }; });
    p.tactics.forEach(function(t){ if (t.id === id) hit = { kind:"TACTIC", obj:t, pillar:p }; });
  });
  u.clauses.forEach(function(c){ if (c[2] === id) hit = { kind:"FOUNDATION", obj:c }; });
  return hit;
}
function activeUnits(){ return UNIT_KEYS.filter(function(k){ return UNITS[k].active; }); }

/* A unit's headline is its Key Objectives, optionally weighted. Equal weight
   is the default nobody has to defend. */
function unitObjectives(u){ return koScore(u.keyObjectives, KO_WEIGHTS[u.ukey]); }

/* The group's own scorecard, on the same footing as a unit's: computed from
   the objectives that are actually there, never read from a stored number
   (§5.1). It was a field on GROUP until 2026-08-20 — which agreed with the
   mean while the demo data was the only data, and read "undefined%" the moment
   a tenant had no objectives of its own. Unweighted: weights are a per-unit
   mechanism, and the group has never had a row in the weight table. */
function groupKeyObjectives(){ return koScore(GROUP.keyObjectives); }

/* Themes aggregate from the pillars that actually carry them, across every
   unit — derived rather than a hand-kept list, which is how the earlier
   prototype ended up with a theme table that no longer matched its pillars. */
function themePillars(ab){
  var out = [];
  UNIT_KEYS.forEach(function(k){
    UNITS[k].items.forEach(function(it, i){
      if (it.theme === ab) out.push({ unit: UNITS[k].name, ukey: k, code: pillarCode(UNITS[k], i), it: it });
    });
  });
  return out;
}
function themeStats(ab){
  var list = themePillars(ab);
  return {
    list: list,
    units: list.map(function(x){ return x.unit; }).filter(function(v,i,a){ return a.indexOf(v)===i; }),
    perf: avg(list.map(function(x){ return pillarPerf(x.it); })),
    exec: avg(list.map(function(x){ return pillarExec(x.it); })),
    plan: avg(list.map(function(x){ return pillarPlan(x.it); }))
  };
}

/* Retirement means retirement everywhere. One helper decides which units the
   product is currently about; the nav, the cards, the compile and the
   weighting all ask it, so a retired unit cannot linger in one of them. */
function activeKeys(){
  return UNIT_KEYS.filter(function(k){ return UNITS[k].active !== false; });
}

function groupUnitsObjectives(){
  var acc=0, tot=0;
  UNIT_KEYS.forEach(function(k){
    var v = unitObjectives(UNITS[k]);
    if (v == null) return;
    acc += v * UNITS[k].weight; tot += UNITS[k].weight;
  });
  return tot ? Math.round(acc/tot) : null;
}
function groupExec(){
  var acc=0, tot=0;
  UNIT_KEYS.forEach(function(k){ acc += unitExec(UNITS[k]) * UNITS[k].weight; tot += UNITS[k].weight; });
  return Math.round(acc/tot);
}
function groupPlan(){
  var acc=0, tot=0;
  UNIT_KEYS.forEach(function(k){ acc += unitPlan(UNITS[k]) * UNITS[k].weight; tot += UNITS[k].weight; });
  return Math.round(acc/tot);
}
function groupRatio(){ return Math.round(groupExec()/groupPlan()*100); }
