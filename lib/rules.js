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
      unitRoles: o.unitRoles || {},
      functionKeys: o.functionKeys || [], functions: o.functions || {},
      companies: o.companies || {}, access: o.access || {}
    };
  }
  /* A world built straight off a state graph — the shape the server holds. */
  function worldOf(state) {
    state = state || {};
    return W({ unitKeys: state.unitKeys, units: state.units, unitRoles: state.unitRoles,
               functionKeys: state.functionKeys, functions: state.functions,
               companies: state.companies, access: state.access });
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
    namedOn: namedOn, editingRoles: editingRoles, onlyVia: onlyVia
  };
});
