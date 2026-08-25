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
    /* ── THE OFFICE, NOT ITS OWNER (§89, Islam 2026-08-24) ──────────
       "I need to add the SMO team and their role needs to be below the super
       user but nearly very close."

       The Super user was doing two jobs: owning the deployment, and running it
       day to day. Only the first is one person's — the second is a team's, and
       until now the only way to give it to them was to make each of them a
       Super user, which is not a smaller grant, it is the same one.

       THE FIRST ROLE HELD OVER THE GROUP THAT IS NOT A CEO. Its scope is
       "everywhere" rather than "own unit", which is why it needs a row of its
       own rather than being a Strategy custodian with a wider reach. What it
       does NOT carry is in the three rules below (mayEditAccess, mayDestroy,
       mayIssuePasswordTo) — each of them a sentence that is true whatever the
       matrix says, the same shape §37 gave its three. */
    { key:"smoteam", name:"SMO team", scope:"group",
      note:"Runs the platform day to day. Everything the Super user has, except the access matrix, deleting anything, and passwords for the office's own people." },
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
      note:"Named on a measure or a tactic. Reports against their own work and reads their unit." },
    /* EMPLOYEE WAS HERE, AND IT WAS NEVER A ROLE (§93, Islam 2026-08-24):
       "anyone with no role is employee … employee doesn't give the person
       anything and if so then let's remove this strange role."

       Half right, and the half that was wrong is why it is going. It DID give
       something — view of the group and of their own unit, which is what let
       an ordinary person sign in and read anything at all. What it never was
       is a role: nobody granted it, the × could not take it off, and drawing
       it as a chip beside Business unit owner claimed somebody held something
       they did not.

       So the WORD goes and the ACCESS stays, as `NO_ROLE` below: not a role
       anybody holds, but the floor anybody with no role stands on. The key is
       still `employee` in ACCESS_DEFAULTS and in every tenant's stored map,
       because renaming a stored key would silently reset the one thing this
       change is trying not to move (§30.2). */
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
    /* ── THE SAME GRANTS AS THE SUPER USER, AND THAT IS DELIBERATE (§89) ──
       What separates the two is not a cell in this table. Every area a Super
       user edits, the SMO team edits — because the difference is three things
       no area can express: who may change the access matrix, who may delete
       something, and whose password may be reset. Writing a narrower area here
       instead would take away whole pages to withhold three acts, and the team
       would be unable to do the job the role exists for.

       IT IS STILL A ROW, so a tenant that wants a narrower SMO team can have
       one — the rules below are a floor nobody can raise, not a ceiling
       nobody can lower. */
    smoteam:   { a_group:"edit", a_unit_own:"edit", a_unit_other:"edit",
                 a_fn_own:"edit", a_fn_other:"edit", a_cycle:"edit", a_setup:"edit" },
    /* Sees the whole organisation and manages none of it. */
    gceo:      { a_group:"view", a_unit_own:"view", a_unit_other:"view",
                 a_fn_own:"view", a_fn_other:"view", a_cycle:"view", a_setup:"none" },
    cceo:      { a_group:"view", a_unit_own:"view", a_unit_other:"view",
                 a_fn_own:"view", a_fn_other:"view", a_cycle:"view", a_setup:"none" },
    /* ── SETUP IS THE SMO'S, AND SO IS THE CYCLE'S MACHINERY (§51.18) ──
       Islam: "no one should have access to the settings except for the SMO."

       `a_cycle` gates Import, Focus measures, Archived plans and the Reporting
       cycle — the pages that RUN a cycle, not the pages that report into one.
       Reporting is `a_unit_own` / `a_fn_own` (`u_report`, `k_report`), so
       closing this takes nothing away from the people entering figures: it
       closes the office's own machinery to everyone but the office.

       THE GROUP CEO KEEPS IT, deliberately. §37 made marking focus measures a
       RULE rather than a cell — "focus measures are marked by the CEO and the
       SMO" — and a CEO who cannot open the page cannot obey a rule addressed
       to them. Same for the company CEO, who reads the cycle and marks
       nothing.

       What a unit head, a custodian or a function head is left with behind the
       gear is only what is theirs by rule: the knowledge base, the figures
       they report, and the set they fill. Those are `area:"always"` and were
       never a matrix question. */
    owner:     { a_group:"view", a_unit_own:"edit", a_unit_other:"none",
                 a_fn_own:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    custodian: { a_group:"view", a_unit_own:"edit", a_unit_other:"none",
                 a_fn_own:"edit", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    fnhead:    { a_group:"view", a_unit_own:"none", a_unit_other:"none",
                 a_fn_own:"edit", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    /* VIEW, at Islam's direction (spec 006 §7.2): "contributors only view, and
       if we allow them they should be allowed to their lines only". The second
       half of that sentence is CONTRIB_OWN_LINES below — a rule with teeth,
       so a tenant that has edit stored here still cannot touch anybody
       else's rows. */
    contrib:   { a_group:"view", a_unit_own:"view", a_unit_other:"none",
                 a_fn_own:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    /* THE SAME AS A CONTRIBUTOR'S, DELIBERATELY. A new role's defaults reach
       every existing tenant at once (§30.2: an absent key means "not answered
       yet", so `grant()` falls back to the shipped default) — so shipping a
       tighter floor would quietly take the group away from people who can see
       it today, on the day they upgraded and without anybody choosing it.
       It starts where they already are; the SMO tightens it on the matrix,
       which is the whole reason the role is a row of its own. */
    employee:  { a_group:"view", a_unit_own:"view", a_unit_other:"none",
                 a_fn_own:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" }
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
    { key:"c_people", area:"a_setup", scope:"setup", label:"People register", note:"Everyone the platform knows, and what they hold" },
    { key:"c_brand",  area:"a_setup", scope:"setup", label:"Branding",         note:"The tenant's colours, and the type they carry" },
    /* Sending mail OUT of the platform (§72). Setup, and the same argument
       branding makes: an email leaves over the organisation's name, so who may
       decide what that name is and what the message looks like is not a
       question about the screen somebody happens to be on. */
    { key:"c_comms",  area:"a_setup", scope:"setup", label:"Communication",     note:"The address emails come from, the name on them, and how they look" },
    /* WRITING one (§74). It sits with the CYCLE rather than beside the
       Communication settings — §46.1's split: that page is what you SET, this
       is what you DO.

       AREA "always", NOT a_cycle, and the page is hidden outright for anybody
       but the SMO. `api/mail.js` refuses a non-SMO outright, so a matrix cell
       here would let the SMO grant a page the server then refuses on every
       press — §42's drift, the thing lib/rules.js exists to prevent. Mailing
       the whole register in the organisation's name is not "running a cycle",
       and a_cycle edit is held by more people than that. */
    { key:"c_send",   area:"always", scope:"manage", label:"Send a message",   note:"Write to the register, or part of it" },
    /* THE OFFICE'S INBOX (§95.2). `area:"always"` with the real gate done by
       inOffice() on the page def and again on the server — the same shape
       c_send has, and for the same reason: who may read what everybody wrote
       in confidence is not a matrix cell somebody could tick. */
    { key:"c_chat",   area:"always", scope:"manage", label:"Messages",         note:"Answer what people write from the corner of the page" },
    { key:"c_import", area:"a_cycle", scope:"manage", label:"Import",          note:"Plan and progress templates" },
    { key:"c_fns",    area:"a_setup", scope:"setup", label:"Supporting functions", note:"Who carries the capabilities" },
    { key:"c_caps",   area:"a_setup", scope:"setup", label:"Capabilities",    note:"What exists, and which function owns each" },
    { key:"k_perf",   area:"fn", scope:"fn",    label:"Performance",     note:"What this function's capabilities read" },
    { key:"k_found",  area:"fn", scope:"fn",    label:"Function overview",     note:"What each capability is, and its key objectives" },
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
    /* The OTHER way a figure gets an owner (spec 008 §3B): the unit's own
       custodian names somebody, figure by figure, on their own plan. A UNIT
       page, not a Setup one — a custodian holds no Setup at all, so a Setup
       page would be unreachable by the only person it is for. It is hidden
       until the tenant switches naming on. */
    { key:"u_src",    area:"unit",   scope:"unit",   label:"Who enters", note:"Name who enters each of this unit's figures" },
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
      companies: o.companies || {}, access: o.access || {},
      naming: !!o.naming
    };
  }
  /* A world built straight off a state graph — the shape the server holds. */
  function worldOf(state) {
    state = state || {};
    return W({ unitKeys: state.unitKeys, units: state.units, unitRoles: state.unitRoles,
               functionKeys: state.functionKeys, functions: state.functions,
               companies: state.companies, access: state.access,
               sets: (state.group || {}).sets,
               claims: (state.group || {}).claims,
               naming: (state.group || {}).naming });
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

    /* THE FLOOR, AND WHICH OF THE TWO IT IS. Somebody attached to a unit and
       holding nothing else is a Contributor if a plan names them and an
       Employee if it does not. Read, never stored — the same argument that
       makes every other role derived (§33): a plan that names somebody makes
       them a contributor to it, and one that stops naming them stops.

       Only reached when the person holds no other role, so the scan is
       bounded to the people who have nothing else to be. */
    /* A plan that names somebody makes them a Contributor of that unit, and one
       that stops naming them stops. Somebody attached and named on nothing now
       holds NOTHING — what they may see is NO_ROLE's floor, applied in
       grantIn() rather than dressed up as a role they never got (§93). */
    if (!out.length && p.unit && namedInUnit(w, p, p.unit))
      out.push({ role:"contrib", at:p.unit });
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
      /* THE COMPANY ITSELF IS A TARGET NOW (§68). A company has a Performance
         page, so `co:<key>` reaches this — and without a case for it the
         company's own CEO did not OWN their own company, which turned their
         page into an "other company" and handed the answer to the seeOthers
         flag. Their own is theirs; anybody else's still goes through
         companyAllows(). */
      if (String(target).indexOf("co:") === 0) return at === target;
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
  /* ── WHAT SOMEBODY WITH NO ROLE MAY SEE (§93) ─────────────────────
     The floor. It is not a role and nobody holds it: it is the answer for a
     person who is on the register, attached to a part of the business, and
     holding nothing — which is most of a five-hundred-row register.

     STORED UNDER THE KEY IT ALWAYS HAD. Every tenant's saved access map has an
     `employee` row in it, and a map is merged with the defaults rather than
     replacing them (§30.2) — so keeping the key is what makes this change move
     the word and not the permissions.

     IT IS STILL A ROW ON THE MATRIX, because it has to be somebody's to
     decide: a client who wants people with no role to see nothing sets it to
     none there, and sees that they have. A floor nobody can reach is a rule
     hiding as a default. */
  var NO_ROLE = "employee";
  /* THE FLOOR IS READ THE SAME WAY A ROLE IS, so every function that walks
     somebody's roles walks it too. Written as a separate list rather than
     inline in grantIn because grantIn is not the only reader: editingRoles
     asks the same question to decide whether an edit reaches anybody else's
     lines, and a floor invisible to it would let a person holding NOTHING,
     given edit on the matrix, edit their whole unit's plan — wider than a
     Contributor, which is the opposite of a floor. */
  function rolesOrFloor(w, person) {
    var rs = personRoles(w, person);
    if (rs.length) return rs;
    /* Read at the person's own attachment, so "own unit" still means theirs. */
    var at = person && (person.fn ? "fn:" + person.fn
                      : person.company ? "co:" + person.company : person.unit);
    return at ? [{ role: NO_ROLE, at: at }] : [];
  }

  function grantIn(w, person, area, target) {
    if (area === "always") return "view";
    var rs = rolesOrFloor(w, person), best = "none";
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

  /* ── THE THREE THINGS THE SMO TEAM DOES NOT GET (§89) ─────────────
     Each is a rule rather than a cell, for the same reason §37's three are:
     each is true whatever the matrix says. They are here, in the shared file,
     because the screen and the server must ask them with one voice — a control
     hidden on one side and permitted on the other is the drift `lib/rules.js`
     exists to prevent (§42), and the drift that matters here hands somebody
     the platform.

     Read them as one sentence: THE SMO TEAM RUNS THE PLATFORM; IT CANNOT
     CHANGE WHO RUNS THE PLATFORM, UNDO ANYTHING PERMANENTLY, OR TAKE ITS OWN
     PEOPLE'S SEATS. */

  /* 1 · WHO MAY EDIT THE ACCESS MATRIX. Editing it is editing who may edit it,
     so anybody who can is a Super user whether or not the row says so. The
     page stays readable to them — knowing what everyone may do is part of
     running the office. */
  function mayEditAccess(w, person) { return isSMO(w, person); }

  /* 2 · WHO MAY DESTROY SOMETHING. Retiring is reversible and keeps every
     attribution true (§69); deleting, clearing a plan and clearing the tenant
     are not, and a mistake there is not recoverable from inside the product.
     Merging is NOT destruction and is deliberately absent: it hands every
     pointer over before it removes a row, and refuses if it cannot (§87.4). */
  function mayDestroy(w, person) { return isSMO(w, person); }

  /* 3 · WHOSE PASSWORD MAY BE RESET (Islam: "for the passwords ok for the
     super user and the team members, but for the client they might be able to
     reset"). The office may let a colleague on the client's side in; it may
     not take a seat belonging to the office itself.

     THE TEST IS ON THE TARGET, NOT ON THE ACT. First-issue and reset are the
     same power — an account you can hand a password to is an account you can
     sign in as — so splitting them would be a distinction that protects
     nobody. What decides is WHOSE account it is.

     A Super user may still reset anybody, including themselves; that is what
     makes them the way back in when the office locks itself out. */
  /* THE SEAT-ROLE TESTS, asked of a role KEY rather than of a person, because
     the server often holds the seat and not a world: getSession() returns
     `people.role`, and both of these roles are seat roles, so an endpoint can
     answer "is this the office" without reading thirty tables to build one
     (§95.1). A responsibility role could never make somebody the office or the
     Super user, so nothing is missed by not looking for one. */
  function isSuperRole(k) { return k === "super"; }
  function isOfficeRole(k) { return k === "super" || k === "smoteam"; }
  function isOffice(w, person) {
    return personRoleKeys(w, person).some(isOfficeRole);
  }
  function mayIssuePasswordTo(w, actor, target) {
    if (isSMO(w, actor)) return true;
    if (personRoleKeys(w, actor).indexOf("smoteam") < 0) return false;
    /* Their own row included: an SMO team member choosing their own password
       is the password page, not this control. */
    return !isOffice(w, target);
  }

  /* ── 4 · THE STRATEGY TAB IS AUTHORED BY THE OFFICE (§94) ─────────
     Islam, 2026-08-25: "for user access don't allow anyone else other than
     the SMO and super user to edit the strategy tab of the units or the
     functions." Asked whether he meant the plan alone or the whole tab, he
     answered by saying he had signed in as a strategy custodian and FOUND
     THE PENS — so it is the tab.

     THIS EXTENDS §31 RATHER THAN INVENTING A RULE. A plan arrives by upload
     and is corrected by the SMO alone; that argument — a plan correctable by
     the person measured against it is a different decision from one
     correctable by its custodian — is exactly as true of the aspiration the
     objectives hang off, the SWOT the pillars were reasoned from, and the
     definition of a capability. Only the Plan had ever been closed, so a
     custodian could not touch the measures and could rewrite the aspiration
     above them. That is not a smaller grant, it is a stranger one.

     WHY A LIST AND NOT A TEST ON THE AREA. `a_unit_own` also carries
     Performance and My reporting, which the unit's own people must keep —
     closing the area would take reporting away to withhold authoring. So the
     unit of the decision is the PAGE, and the pages are named here once.

     IT FAILS CLOSED FOR EVERY PEN. `penBtn()` and `editBar()` in the platform
     both ask this rather than the raw grant, so a pen added to a strategy
     page later is gated on the day it is added and not on the day somebody
     remembers (§42's rule, on the screen instead of the server).

     NOT ON THIS LIST, DELIBERATELY:
     · `g_found`, `g_temple`, `g_weight` — the GROUP's own pages. Islam said
       "of the units or the functions", and `a_group` edit is already the
       office's by default.
     · `u_report`, `k_report`, `u_perf`, `k_perf` — reporting IS the unit's
       job, and this must take nothing away from the people entering figures.
     · `u_src` (Strategy › Who enters) — it is a section of the tab, but it is
       hidden behind a tenant switch that is OFF by default, and turning it on
       is the office deliberately handing naming to the custodian (spec 008
       §3B). A rule cannot close a door somebody has to open on purpose.
       PUT TO ISLAM AS AN OPEN QUESTION AND ANSWERED "leave it" (2026-08-25),
       because this is the one page where the rule read literally and the rule
       read for its reason disagree — so the omission is a decision, not an
       oversight. Revisit it if that switch is ever turned on. */
  var STRATEGY_PAGES = ["u_found", "u_anal", "u_plan", "k_found", "k_proj"];
  function isStrategyPage(k) { return STRATEGY_PAGES.indexOf(k) > -1; }

  /* May this person AUTHOR this page — write what was agreed, as opposed to
     reporting against it? The grant still has to say edit: this narrows, it
     never widens, so a tenant that has closed a page to the office keeps it
     closed. */
  function mayAuthorPage(w, person, pageKey, target) {
    if (isStrategyPage(pageKey) && !isOffice(w, person)) return false;
    return grantAtPage(w, person, pageKey, target) === "edit";
  }

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

  /* ── 5c · Naming a person against ONE figure (spec 008 §3B) ──────
     The other way a figure gets an owner, and the one that needs no set. A
     unit's strategy custodian works down their OWN directions and targets and
     names somebody against a number. Islam: "the custodian doesn't get a
     ticking page — he gets all his directions and targets and a searchable
     dropdown in front of each number so he can set who can input them."

         row.src = { by: "<person key>" }

     NAMING SOMEBODY GIVES THEM THAT FIGURE AND NOTHING ELSE (spec 008 §9).
     Not the unit's other measures, not its plan, not its score: they sign in
     during the cycle and find one page listing every figure they owe, wherever
     those figures live. Which is why it is stored as a person and not as a
     role — there is no role to give.

     IT IS OFF UNTIL THE TENANT SWITCHES IT ON, at Islam's direction: one way
     of assigning is watched in practice before the second is turned on. The
     switch is READ HERE, so the server refuses a naming while it is off — a
     switch that only hides a control is decoration (§42), which is the same
     lesson §2b's "who picks" already cost us.

     FIRST CLAIM WINS, with no precedence between this and a set (spec 008 §4).
     A figure a set holds cannot be named from here, and a figure named here
     cannot be claimed into a set: whoever asked first holds it, and the other
     side is offered the request rather than a dead end. */
  function namingOn(w) { return !!(w && w.naming); }

  /* ── WHAT THE OFFICE HAS SET ABOUT THE CHAT (§96) ─────────────────
     Islam: "I will need in the setup page to enable or disable the chat with
     some settings maybe."

     ONE NORMALISER, ASKED OF THE RAW OBJECT rather than of a world, because
     the two sides hold it differently: the browser has the whole state graph
     and the chat endpoint has a single `SELECT extra FROM org`. Taking the
     raw value means neither has to build the other's shape, and there is still
     exactly one place that decides what a missing key means (§42).

     `on` DEFAULTS TO TRUE, and that is deliberate. A tenant that has never
     opened the menu has no `chat` key at all, and the feature it never turned
     off should be the one that is running. The same argument every other
     absent-key default in this file is made from (§30.2).

     WHAT IT NEVER DOES IS DECIDE WHO MAY CHANGE THESE. That is `isOffice()`,
     asked on the page and again on the server. */
  var CHAT_DEFAULTS = Object.freeze({
    on: true,        /* people can write to the office */
    fast: true,      /* Live (4s) rather than Relaxed (15s) */
    promise: "",     /* falls back to the shipped sentence when empty */
    shots: true,     /* a screenshot may be attached */
    mail: true       /* a reply chases somebody who is away */
  });
  var CHAT_PROMISE = "Usually answers the same day";

  function chatCfg(raw) {
    var c = (raw && typeof raw === "object") ? raw : null;
    return {
      on:      !c || c.on      !== false,
      fast:    !c || c.fast    !== false,
      shots:   !c || c.shots   !== false,
      mail:    !c || c.mail    !== false,
      promise: (c && typeof c.promise === "string" && c.promise.trim())
                 ? c.promise.trim() : CHAT_PROMISE
    };
  }
  /* How often an open panel asks, in milliseconds. Named here rather than in
     the client, so the setting and the number it means cannot drift apart —
     and so the check can assert the pair. */
  function chatBeat(raw) { return chatCfg(raw).fast ? 4000 : 15000; }
  function mayName(w, person, unitKey) {
    if (!namingOn(w) || !person) return false;
    if (isSMO(w, person)) return true;
    if (grantIn(w, person, "unit", unitKey) !== "edit") return false;
    /* A contributor reports their own lines (spec 006 §7.2); deciding who
       enters the unit's figures speaks for the unit. */
    return !onlyOwnLines(w, person, "unit", unitKey);
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

  /* Is this person named anywhere in this unit's plan? The question personRoles
     asks to tell a Contributor from an Employee, answered with the same
     namedOn() the reporting rule uses — so "named on a line" means one thing
     in the platform, not two that can drift apart. */
  function namedInUnit(w, p, unitKey) {
    var u = ((w || {}).units || {})[unitKey];
    if (!u || !p) return false;
    var hit = (u.keyObjectives || []).some(function (m) { return namedOn(m, p); });
    (u.items || []).forEach(function (it) {
      if (hit) return;
      hit = (it.measures || []).some(function (m) { return namedOn(m, p); }) ||
            (it.tactics  || []).some(function (t) { return namedOn(t, p); });
    });
    return hit;
  }

  /* ── ROLES THAT SPEAK ONLY FOR THEMSELVES ─────────────────────────
     A Contributor reports the lines they are named on and nothing else (spec
     006 §7.2); an Employee is named on nothing, so the same rule leaves them
     nothing. Both are the floor, and every place that asks "is this person
     here ONLY as somebody who speaks for themselves" has to ask about both.

     NAMED ONCE. Twelve call sites tested the literal string "contrib", and a
     second floor role added beside it would have widened every one of them by
     omission: a tenant that gave Employee edit on its own unit would have got
     an employee who could submit the unit's report, write the cycle note, add
     a picture slide to the review and decide who enters a figure — none of
     which anybody would have chosen, and all of which would have passed every
     test, because the tests name the role too. */
  /* STILL TWO, and the second is no longer a role (§93). Employee stopped
     being something anybody holds, but `rolesOrFloor()` hands the floor to
     `editingRoles()` exactly as if it were — so it has to be named here, or a
     tenant that sets *Everyone else* to edit gives every unroled person on the
     register the run of their unit's whole plan. Wider than a Contributor,
     which is the opposite of a floor. */
  var OWN_LINES_ONLY = ["contrib", NO_ROLE];

  /* Which of a person's roles is what lets them edit here. The floor rule
     applies when the floor is ALL they have. */
  function editingRoles(w, person, area, target) {
    return rolesOrFloor(w, person).filter(function (r) {
      if (!companyAllows(w, r, target)) return false;
      return grantFor(w, r.role, areaFor(area, w, r, target)) === "edit";
    }).map(function (r) { return r.role; });
  }
  function onlyVia(w, person, area, target, roleKey) {
    var via = editingRoles(w, person, area, target);
    return via.length === 1 && via[0] === roleKey;
  }
  /* Every way this person could edit here is a floor role. Replaces the
     twelve `onlyVia(..., "contrib")` checks — same answer for a Contributor,
     and the right answer for an Employee. */
  function onlyOwnLines(w, person, area, target) {
    var via = editingRoles(w, person, area, target);
    return via.length > 0 && via.every(function (r) { return OWN_LINES_ONLY.indexOf(r) > -1; });
  }
  /* Is this role one of the two that speak only for themselves? Asked by the
     employee file and the People page, which must never GRANT either. */
  function isOwnLinesRole(roleKey) { return OWN_LINES_ONLY.indexOf(roleKey) > -1; }

  return {
    ROLES: ROLES, ROLE_KEYS: ROLE_KEYS,
    AREAS: AREAS, AREA_KEYS: AREA_KEYS,
    PAGES: PAGES, PAGE_AREA: PAGE_AREA,
    ACCESS_DEFAULTS: ACCESS_DEFAULTS, STATE_RANK: STATE_RANK,
    W: W, worldOf: worldOf,
    personActive: personActive, personRoles: personRoles, personRoleKeys: personRoleKeys,
    unitsOfCompany: unitsOfCompany, grantFor: grantFor,
    roleOwns: roleOwns, companyAllows: companyAllows, areaFor: areaFor,
    grantIn: grantIn, grantAtPage: grantAtPage, isSMO: isSMO, NO_ROLE: NO_ROLE,
    mayEditAccess: mayEditAccess, mayDestroy: mayDestroy,
    isOffice: isOffice, isOfficeRole: isOfficeRole, isSuperRole: isSuperRole,
    mayIssuePasswordTo: mayIssuePasswordTo,
    STRATEGY_PAGES: STRATEGY_PAGES, isStrategyPage: isStrategyPage,
    mayAuthorPage: mayAuthorPage,
    namedOn: namedOn, namedInUnit: namedInUnit,
    editingRoles: editingRoles, onlyVia: onlyVia, rolesOrFloor: rolesOrFloor,
    OWN_LINES_ONLY: OWN_LINES_ONLY, onlyOwnLines: onlyOwnLines,
    isOwnLinesRole: isOwnLinesRole,
    isSourced: isSourced, sourceRows: sourceRows, sourcesFor: sourcesFor,
    ownsSources: ownsSources, rowsOfSet: rowsOfSet, rowById: rowById,
    setsOf: setsOf, setById: setById, mayPickInto: mayPickInto,
    pickableSets: pickableSets, assigneeOf: assigneeOf, sourceLabel: sourceLabel,
    claimsOf: claimsOf, openClaims: openClaims, openClaimFor: openClaimFor,
    namingOn: namingOn, mayName: mayName,
    CHAT_DEFAULTS: CHAT_DEFAULTS, CHAT_PROMISE: CHAT_PROMISE,
    chatCfg: chatCfg, chatBeat: chatBeat,
    PICK_SMO: PICK_SMO, PICK_OWNER: PICK_OWNER
  };
});
