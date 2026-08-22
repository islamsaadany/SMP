/* THE RULES — who holds which role, and who may change what.
   ═══════════════════════════════════════════════════════════════════════

   ONE COPY, RUN ON BOTH SIDES. The browser asks "may this person edit this?"
   to decide what to draw; the server asks the same question to decide what to
   accept. Two copies of that answer are two copies that will drift, and the
   drift is silent in the worst way — a screen that offers an edit the server
   then refuses. So this file is inlined into the platform by build.py and
   required by Node in api/state.js. It is §33's pattern (one fact, two
   surfaces) applied to authorisation.

   NOTHING IN HERE TOUCHES THE DOM OR THE DATABASE. Every function is pure:
   it takes a WORLD — the tenant's units, functions, companies, roles and
   access map — and answers from it. That is what lets the same code run in
   two places, and it is also what makes it testable.

   THE WORLD IS ALWAYS THE STORED ONE, ON THE SERVER. Read §5's note: a save
   authorised against the state it is trying to write could grant itself the
   role that authorises it. */

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.SMPRules = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ── 1 · Roles (§33) ──────────────────────────────────────────────
     A SEAT is a property of the person (super, gceo, cceo). RESPONSIBILITY
     FOR A THING is a property of the thing — a unit's head pointer IS the
     owner role, read from the other end. One fact, two editing surfaces,
     cannot disagree. */
  var ROLES = [
    { key:"super", name:"Super user", scope:"group",
      note:"The SMO. Sees and edits everything, including configuration." },
    { key:"gceo",  name:"Group CEO",  scope:"group",
      note:"Sees the whole group. Manages nothing outside their own unit." },
    { key:"cceo",  name:"Company CEO", scope:"company",
      note:"Sees their company's units. Whether they also see the group and the other companies is set per company." },
    { key:"owner", name:"Business unit owner", scope:"unit",
      note:"Accountable for one unit's strategy. Named on the unit itself." },
    { key:"custodian", name:"Strategy custodian", scope:"unitfn",
      note:"Carries the strategy work for a unit or a supporting function, alongside its head." },
    { key:"fnhead", name:"Supporting function head", scope:"fn",
      note:"Runs a supporting function and the capabilities it owns." },
    { key:"contrib", name:"Contributor", scope:"unit",
      note:"Named on a measure or a tactic. Reports against their own work and reads their unit." }
  ];
  var ROLE_KEYS = ROLES.map(function (r) { return r.key; });

  /* ── 2 · Areas (§37) ──────────────────────────────────────────── */
  var AREAS = [
    { key:"a_group",      label:"Group",
      note:"Performance, Foundation, Temple, Weighting, Focus" },
    { key:"a_unit_own",   label:"Own business unit",
      note:"The units they hold a role in" },
    { key:"a_unit_other", label:"Other business units",
      note:"Every unit they do not" },
    { key:"a_fn_own",     label:"Own supporting function",
      note:"The functions they hold a role in" },
    { key:"a_fn_other",   label:"Other supporting functions",
      note:"Every function they do not" },
    { key:"a_cycle",      label:"Reporting cycle",
      note:"Open, chase and close · Import · Archived plans · Focus measures" },
    { key:"a_setup",      label:"Setup",
      note:"Units, Companies, Functions, People, Labels, Bands, Capabilities, this page" }
  ];
  var AREA_KEYS = AREAS.map(function (a) { return a.key; });

  /* The shipped answer for every role in every area. A tenant's stored map
     overrides it; an ABSENT key falls back here, because absent means "not
     answered yet", not "denied" (§30.2). */
  var ACCESS_DEFAULTS = {
    /* The SMO. Everything, everywhere. */
    super:     { a_group:"edit", a_unit_own:"edit", a_unit_other:"edit",
                 a_fn_own:"edit", a_fn_other:"edit", a_cycle:"edit", a_setup:"edit" },
    /* Sees the whole organisation and manages none of it. */
    gceo:      { a_group:"view", a_unit_own:"view", a_unit_other:"view",
                 a_fn_own:"view", a_fn_other:"view", a_cycle:"view", a_setup:"none" },
    cceo:      { a_group:"view", a_unit_own:"view", a_unit_other:"view",
                 a_fn_own:"view", a_fn_other:"view", a_cycle:"view", a_setup:"none" },
    owner:     { a_group:"view", a_unit_own:"edit", a_unit_other:"none",
                 a_fn_own:"view", a_fn_other:"none", a_cycle:"view", a_setup:"none" },
    custodian: { a_group:"view", a_unit_own:"edit", a_unit_other:"none",
                 a_fn_own:"edit", a_fn_other:"none", a_cycle:"view", a_setup:"none" },
    fnhead:    { a_group:"view", a_unit_own:"none", a_unit_other:"none",
                 a_fn_own:"edit", a_fn_other:"none", a_cycle:"view", a_setup:"none" },
    /* VIEW, at Islam's direction (spec 006 §7.2): "contributors only view, and
       if we allow them they should be allowed to their lines only". The second
       half of that sentence is CONTRIB_OWN_LINES below — a rule with teeth,
       so a tenant that has edit stored here still cannot touch anybody
       else's rows. */
    contrib:   { a_group:"view", a_unit_own:"view", a_unit_other:"none",
                 a_fn_own:"view", a_fn_other:"none", a_cycle:"view", a_setup:"none" }
  };

  var STATE_RANK = { none:0, view:1, edit:2 };

  /* ── 3 · Pages, and which area answers for each ───────────────── */
  var PAGES = [
    { key:"g_perf",   area:"a_group", scope:"group", label:"Performance", note:"Group headline, business units, themes, capabilities" },
    { key:"g_found",  area:"a_group", scope:"group", label:"Foundation",  note:"Purpose, aspiration, core values, who we are" },
    { key:"g_temple", area:"a_group", scope:"group", label:"Temple",      note:"The strategy on one page. No performance figures" },
    { key:"g_weight", area:"a_group", scope:"group", label:"Weighting",   note:"How much each business unit counts" },
    { key:"u_perf",   area:"unit", scope:"unit",  label:"Performance", note:"The unit's headline and its pillars" },
    { key:"u_found",  area:"unit", scope:"unit",  label:"Foundation",  note:"The unit's own words and Key Objectives" },
    { key:"u_plan",   area:"unit", scope:"unit",  label:"Strategy",    note:"The plan as agreed, with no reported figure on it" },
    { key:"u_anal",   area:"unit", scope:"unit",  label:"Analysis",    note:"The unit's SWOT" },
    { key:"c_labels", area:"a_setup", scope:"setup", label:"Labels",      note:"Internal names and tenant display labels" },
    { key:"c_access", area:"a_setup", scope:"setup", label:"Roles & access", note:"Which roles reach which kinds of page" },
    { key:"c_bands",  area:"a_setup", scope:"setup", label:"Scoring bands",   note:"The one scale every score reads on" },
    { key:"c_units",  area:"a_setup", scope:"setup", label:"Business units",  note:"Names, codes and which units are active" },
    { key:"c_people", area:"a_setup", scope:"setup", label:"People",           note:"Everyone the platform knows, and what they hold" },
    { key:"c_brand",  area:"a_setup", scope:"setup", label:"Branding",         note:"The tenant's colours, and the type they carry" },
    { key:"c_import", area:"a_cycle", scope:"manage", label:"Import",          note:"Plan and progress templates" },
    { key:"c_fns",    area:"a_setup", scope:"setup", label:"Supporting functions", note:"Who carries the capabilities" },
    { key:"c_caps",   area:"a_setup", scope:"setup", label:"Capabilities",    note:"What exists, and which function owns each" },
    { key:"k_perf",   area:"fn", scope:"fn",    label:"Performance",     note:"What this function's capabilities read" },
    { key:"k_found",  area:"fn", scope:"fn",    label:"Capability foundation", note:"What each capability is, and its key objectives" },
    { key:"k_proj",   area:"fn", scope:"fn",    label:"Projects",        note:"The plan behind each project, with no reported figure on it" },
    { key:"k_report", area:"fn", scope:"fn",    label:"Reporting",       note:"Enter this cycle's figures" },
    { key:"g_focus",  area:"a_group", scope:"group", label:"Focus",           note:"Every unit's focus measures" },
    { key:"c_focus",  area:"a_cycle", scope:"manage", label:"Focus measures",  note:"Choose what carries reward this cycle" },
    /* The sets themselves — Setup, so the SMO alone (spec 008). */
    { key:"c_sets",   area:"a_setup", scope:"setup", label:"Figure sets", note:"Named sets of numbers, their team, their owner, and who fills them" },
    /* FILLING a set. Area "always", because who may open it is not a matrix
       question: it is whether this person owns a set whose switch lets them
       pick. Hidden outright otherwise — "the owner picks" IS the grant of sight
       over the whole group's figures, so there is no half-view to draw. */
    { key:"c_source", area:"always", scope:"setup", label:"Fill a figure set", note:"Tick the figures that belong to a set you fill" },
    /* A source team's own reporting surface. AREA "always", because its reach
       is not a setting: it is whatever that person has been named on, and the
       page is hidden outright when they have been named on nothing. */
    { key:"c_myfig",  area:"always", scope:"manage", label:"Figures I report", note:"Every figure you are master of, across the units" },
    { key:"c_kb",     area:"always", scope:"manage", label:"Knowledge base", note:"How the platform works, in one place" },
    { key:"c_cycle",  area:"a_cycle", scope:"manage", label:"Reporting cycle", note:"Open, chase and close" },
    { key:"u_report", area:"unit", scope:"unit",  label:"My reporting",    note:"Enter this cycle's figures" }
  ];
  var PAGE_AREA = {};
  PAGES.forEach(function (p) { PAGE_AREA[p.key] = p.area; });

  /* ── 4 · The world, and the roles a person holds in it ────────── */

  function W(o) {
    o = o || {};
    return {
      unitKeys: o.unitKeys || [], units: o.units || {},
      unitRoles: o.unitRoles || {}, sets: o.sets || [], claims: o.claims || [],
      functionKeys: o.functionKeys || [], functions: o.functions || {},
      companies: o.companies || {}, access: o.access || {}
    };
  }
  /* A world built straight off a state graph — the shape the server holds. */
  function worldOf(state) {
    state = state || {};
    return W({ unitKeys: state.unitKeys, units: state.units, unitRoles: state.unitRoles,
               functionKeys: state.functionKeys, functions: state.functions,
               companies: state.companies, access: state.access,
               sets: (state.group || {}).sets,
               claims: (state.group || {}).claims });
  }

  function personActive(p) { return !!p && p.active !== false; }

  function unitsOfCompany(w, ck) {
    return w.unitKeys.filter(function (k) { return (w.units[k] || {}).company === ck; });
  }

  /* Every role a person holds, with what each is attached to. Derived, never
     stored: seat roles from the person, responsibility roles from whatever
     points at them. */
  function personRoles(w, p) {
    if (!p) return [];
    if (!personActive(p)) return [];   /* a retired person holds nothing */
    var out = [];
    var seat = p.role || (p.level === "smo" ? "super"
                        : p.level === "ceo" ? (p.company ? "cceo" : "gceo") : null);
    if (seat) out.push({ role: seat, at: p.company ? "co:" + p.company : (p.at || "group") });

    w.unitKeys.forEach(function (k) {
      var r = w.unitRoles[k] || {};
      if (r.head === p.key)      out.push({ role:"owner",     at:k });
      if (r.custodian === p.key) out.push({ role:"custodian", at:k });
    });
    w.functionKeys.forEach(function (k) {
      var f = w.functions[k] || {};
      if (f.head === p.key)      out.push({ role:"fnhead",    at:"fn:" + k });
      if (f.custodian === p.key) out.push({ role:"custodian", at:"fn:" + k });
    });

    if (!out.length && p.unit) out.push({ role:"contrib", at:p.unit });
    return out;
  }
  function personRoleKeys(w, p) {
    return personRoles(w, p).map(function (r) { return r.role; });
  }

  function grantFor(w, roleKey, areaKey) {
    var row = w.access[roleKey];
    if (row && Object.prototype.hasOwnProperty.call(row, areaKey)) return row[areaKey] || "none";
    return (ACCESS_DEFAULTS[roleKey] || {})[areaKey] || "none";
  }

  /* OWN is read off the role's attachment, never set. Reaching and OWNING are
     different words: a company CEO whose company may see the others REACHES
     those units without owning them. */
  function roleOwns(w, r, target) {
    if (r.role === "super" || r.role === "gceo") return true;
    var at = String(r.at || "");
    if (String(target).indexOf("fn:") === 0) return at === target;
    if (at.indexOf("fn:") === 0) return false;
    if (r.role === "cceo") {
      var ck = at.replace(/^co:/, "");
      if (target === "group") return false;
      return unitsOfCompany(w, ck).indexOf(target) > -1;
    }
    return at === target;
  }

  /* The company's own two flags (§23) can only ever NARROW. */
  function companyAllows(w, r, target) {
    if (r.role !== "cceo") return true;
    var co = w.companies[String(r.at || "").replace(/^co:/, "")] || {};
    if (target === "group") return co.seeGroup !== false;
    if (String(target).indexOf("fn:") === 0) return true;
    if (roleOwns(w, r, target)) return true;
    return !!co.seeOthers;
  }

  function areaFor(area, w, r, target) {
    if (area !== "unit" && area !== "fn") return area;
    var own = roleOwns(w, r, target);
    return area === "unit" ? (own ? "a_unit_own" : "a_unit_other")
                           : (own ? "a_fn_own" : "a_fn_other");
  }

  /* The most generous answer across the roles somebody holds, each role
     resolving its own OWN. */
  function grantIn(w, person, area, target) {
    if (area === "always") return "view";
    var rs = personRoles(w, person), best = "none";
    for (var i = 0; i < rs.length; i++) {
      if (!companyAllows(w, rs[i], target)) continue;
      var g = grantFor(w, rs[i].role, areaFor(area, w, rs[i], target));
      if (STATE_RANK[g] > STATE_RANK[best]) best = g;
    }
    return best;
  }
  function grantAtPage(w, person, pageKey, target) {
    return grantIn(w, person, PAGE_AREA[pageKey], target);
  }

  function isSMO(w, person) { return personRoleKeys(w, person).indexOf("super") > -1; }

  /* ── 5 · Figure sets (§16.7, spec 008) ───────────────────────────
     Many figures are not the business unit's number. Revenue and margin exist
     in Finance before a unit is asked for them, and asking the unit to type
     them means the same number is entered ten times — and can be wrong ten
     times, because the person typing is not the person who knows it.

     THE UNIT OF OWNERSHIP IS A SET, not a person and not a department:

         { id, name, team, owner, pick }

     A set is named, belongs to a team, has ONE owner, and says WHO MAY PICK
     its figures. Naming the set is what makes several of these workable —
     "custodian 1, 2, 3" says nothing, "Financial Figures" says everything —
     and it means the role needs no name of its own.

     THE TEAM IS ON THE SET, not read off the person. What the unit needs to
     know is who to talk to when it writes the note against a number it did not
     enter; "Set by Financial Figures" does not say that and "Set by Finance"
     does. And the person's own department cannot be trusted to say it — a
     custodian may sit with the office rather than in the team whose number it
     is. On the set it also survives the owner changing.

     A FIGURE STORES ONLY THE SET:

         row.src = { set: "<set id>" }     claimed into a set
         row.src = { by:  "<person key>" } named directly by a unit custodian

     Who enters a set-claimed figure is the set's OWNER, read from the set
     rather than copied onto every figure it holds. That is what one owner per
     set buys: handing a set over is one edit, and no figure is left pointing
     at whoever used to hold it. Same pattern as a unit's head pointer (§33) —
     a role is read from the thing, never stored twice.

     THE FIGURE MOVES, THE NOTE DOES NOT. The set enters actual and progress;
     the UNIT always writes the note. The number is the set's, the performance
     is the unit's, and the explanation belongs to whoever owns the
     performance.

     THIS IS A RULE, NOT A MATRIX CELL. A set's reach is entirely what it has
     been ticked onto — it crosses units without owning them and reaches
     nothing else. */

  /* Ticking from the full list IS reading every number in the group. For a
     team like Finance that costs nothing; for anybody else it hands the whole
     group's figures to somebody whose job was entering three of them. So each
     set says who may pick, and it DEFAULTS TO THE SMO: the exception is the
     one you switch on, not the one you remember to switch off. */
  const PICK_SMO = "smo", PICK_OWNER = "owner";

  function setsOf(w) { return w.sets || []; }
  function setById(w, id) {
    return setsOf(w).filter(function (s) { return s.id === id; })[0] || null;
  }
  function mayPickInto(w, person, set) {
    if (!set || !person) return false;
    if (isSMO(w, person)) return true;
    return set.pick === PICK_OWNER && set.owner === person.key;
  }
  /* Which sets this person may open a picking page for. Empty is the answer
     for most people, and the page is then not offered at all. */
  function pickableSets(w, person) {
    return setsOf(w).filter(function (s) { return mayPickInto(w, person, s); });
  }

  function isSourced(row) {
    return !!(row && row.src && (row.src.set || row.src.by));
  }
  /* Who enters this figure: the set's owner, or the person named directly.
     Resolved against the world it is asked about, never stored on the row. */
  function assigneeOf(w, row) {
    if (!row || !row.src) return null;
    if (row.src.set) {
      const set = setById(w, row.src.set);
      return set ? set.owner || null : null;
    }
    return row.src.by || null;
  }
  /* What the UNIT reads beside a figure it does not enter. The set's team, or
     — for a figure a unit custodian named directly — the person, because there
     the person IS the answer to "who do I ask". */
  function sourceLabel(w, row) {
    if (!row || !row.src) return "";
    if (row.src.set) {
      const set = setById(w, row.src.set);
      return set ? (set.team || set.name || "") : "";
    }
    return row.src.by || "";
  }

  /* Every claimed figure in the tenant, flattened. Small by construction — a
     tenant has tens of measures, not thousands — and every caller wants the
     same shape. */
  function sourceRows(w) {
    const out = [];
    w.unitKeys.forEach(function (k) {
      const u = w.units[k] || {};
      (u.keyObjectives || []).forEach(function (m) {
        if (isSourced(m)) out.push({ unit: k, kind: "objective", id: m.id, row: m, src: m.src,
                                     by: assigneeOf(w, m) });
      });
      (u.items || []).forEach(function (p) {
        (p.measures || []).forEach(function (m) {
          if (isSourced(m)) out.push({ unit: k, kind: "measure", id: m.id, row: m, src: m.src,
                                       pillar: p.name, by: assigneeOf(w, m) });
        });
      });
    });
    return out;
  }
  function sourcesFor(w, person) {
    if (!person) return [];
    return sourceRows(w).filter(function (r) { return r.by === person.key; });
  }
  function ownsSources(w, person) { return sourcesFor(w, person).length > 0; }
  function rowsOfSet(w, id) {
    return sourceRows(w).filter(function (r) { return r.src.set === id; });
  }

  /* ── 5b · Claim requests (spec 008 §5) ────────────────────────────
     One figure belongs to one set, so claiming one somebody already holds is
     refused. A silent refusal is a dead end: the platform is the only thing
     that knows the claim was turned away, so it carries the request forward.

         { id, unit, figure, set, by, at, state }

     THE SMO ANSWERS IT, not the holder — the holder has an interest in the
     answer, and the SMO is the only person who can see both sides.

     This REVERSES §16.7's "disagreement is settled off the platform, no
     challenge workflow". That still holds for whether a NUMBER is right; what
     changed is whether somebody may CLAIM it, and the old decision assumed the
     SMO was the only person assigning. */
  function claimsOf(w) { return w.claims || []; }
  function openClaims(w) {
    return claimsOf(w).filter(function (c) { return c.state === "open"; });
  }
  /* One open request per figure per set: asking twice is not asking louder. */
  function openClaimFor(w, figureId, setId) {
    return openClaims(w).filter(function (c) {
      return c.figure === figureId && c.set === setId;
    })[0] || null;
  }

  /* Find one row by id, wherever it lives. The authoriser needs the STORED
     row to ask whose figure it is — asking the incoming one would let a save
     name itself as the source in the same request, which is §42.2 again. */
  function rowById(w, unitKey, id) {
    const u = (w.units || {})[unitKey] || {};
    let hit = null;
    (u.keyObjectives || []).forEach(function (m) { if (m.id === id) hit = m; });
    (u.items || []).forEach(function (p) {
      (p.measures || []).forEach(function (m) { if (m.id === id) hit = m; });
      (p.tactics || []).forEach(function (t) { if (t.id === id) hit = t; });
    });
    return hit;
  }

  /* ── 5 · Named on a line ──────────────────────────────────────────
     "Contributors only view, and if we allow them they should be allowed to
     their lines only" (spec 006 §7.2). A tactic names its own owner and
     collaborators; a MEASURE names nobody, so the nearest thing the data
     supports is the owner of the pillar it sits under — which is what this is
     given. Both columns hold a TYPED NAME rather than a link to a person, so
     the key and the name are both matched. That is a weakness, recorded as
     one: the Finance custodian work adds a real per-measure owner, and this
     tightens the day it lands.

     It lives HERE rather than in authorize.js because the screen has to make
     the same decision — a page that offers a pen the server then refuses is
     the drift this whole file exists to prevent. */
  function namedOn(row, person) {
    if (!row || !person) return false;
    var me = [String(person.key || ""), String(person.name || "")]
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(function (s) { return !!s; });
    var hits = [row.owner].concat(Array.isArray(row.collaborators) ? row.collaborators : []);
    return hits.some(function (h) {
      return h != null && me.indexOf(String(h).trim().toLowerCase()) > -1;
    });
  }

  /* Which of a person's roles is what lets them edit here. The contributor
     rule applies when contrib is the ONLY one. */
  function editingRoles(w, person, area, target) {
    return personRoles(w, person).filter(function (r) {
      if (!companyAllows(w, r, target)) return false;
      return grantFor(w, r.role, areaFor(area, w, r, target)) === "edit";
    }).map(function (r) { return r.role; });
  }
  function onlyVia(w, person, area, target, roleKey) {
    var via = editingRoles(w, person, area, target);
    return via.length === 1 && via[0] === roleKey;
  }

  return {
    ROLES: ROLES, ROLE_KEYS: ROLE_KEYS,
    AREAS: AREAS, AREA_KEYS: AREA_KEYS,
    PAGES: PAGES, PAGE_AREA: PAGE_AREA,
    ACCESS_DEFAULTS: ACCESS_DEFAULTS, STATE_RANK: STATE_RANK,
    W: W, worldOf: worldOf,
    personActive: personActive, personRoles: personRoles, personRoleKeys: personRoleKeys,
    unitsOfCompany: unitsOfCompany, grantFor: grantFor,
    roleOwns: roleOwns, companyAllows: companyAllows, areaFor: areaFor,
    grantIn: grantIn, grantAtPage: grantAtPage, isSMO: isSMO,
    namedOn: namedOn, editingRoles: editingRoles, onlyVia: onlyVia,
    isSourced: isSourced, sourceRows: sourceRows, sourcesFor: sourcesFor,
    ownsSources: ownsSources, rowsOfSet: rowsOfSet, rowById: rowById,
    setsOf: setsOf, setById: setById, mayPickInto: mayPickInto,
    pickableSets: pickableSets, assigneeOf: assigneeOf, sourceLabel: sourceLabel,
    claimsOf: claimsOf, openClaims: openClaims, openClaimFor: openClaimFor,
    PICK_SMO: PICK_SMO, PICK_OWNER: PICK_OWNER
  };
});
