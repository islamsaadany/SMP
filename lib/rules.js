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
    { key:"owner", name:"BU owner", scope:"unit",
      note:"Accountable for one unit's strategy. Named on the unit itself." },
    { key:"custodian", name:"Strategy custodian", scope:"unitfn",
      note:"Carries the strategy work for a unit or a supporting function, alongside its head." },
    { key:"fnhead", name:"Function head", scope:"fn",
      note:"Runs a supporting function and the capabilities it owns." },
    /* ── TWO NAMED ROLES, READ OFF THE PLAN (§147.7, Islam 2026-08-28) ──
       "a project owner is a role", and "we need to add another role which is
       pillar owner which ... follows the same pattern and conditions of the
       project owners but on the level of a pillar."

       Both are derived the way every responsibility role is (§33): being
       named the Owner of a project or a pillar IS the role — nothing is
       granted by hand, and the naming is already the office's own act,
       because the plan pen is the office's (§94). TWO CONDITIONS before
       anybody reports (Islam's words): this row's Reporting cell opened to
       edit on Roles & access, AND being named the Owner on the thing. The
       role without the grant reads; the grant without the naming reaches
       nothing. */
    { key:"powner", name:"Project owner", scope:"fn",
      note:"Named as a project's Owner on a supporting function. With Reporting opened on this row, they report that project — whole, and only it." },
    { key:"plowner", name:"Pillar owner", scope:"unitfn",
      note:"Named as a pillar's Owner, on a unit or a pillars function. With Reporting opened on this row, they report that pillar — whole, and only it." },
    /* CONTRIBUTOR IS EVERYONE ELSE THE PLAN NAMES (§147.8, Islam): "contributor
       is someone whose name is on the project anywhere but that doesn't mean
       that he is a project owner", and "stakeholders are contributors". They
       report NOTHING until the tenant opens this row's edit — and then only
       the rows that name them. */
    { key:"contrib", name:"Contributor", scope:"unit",
      note:"Named anywhere on a plan or a project — a collaborator, a stakeholder, a milestone's owner. Reads; reports their own rows only where this row is opened to edit." },
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

  /* ── 2 · Areas (§37; the own pair split in two, §117) ───────────
     THE OWN COLUMNS ARE TWO QUESTIONS EACH (Islam, 2026-08-26): "the strategy
     should be locked from the non SMO but the reporting should be editable by
     who we grant the access so they can submit — we need this split in the
     roles and access table." One grant had covered the strategy pages AND
     reporting together, so §94's office-only lock was invisible on the table
     and reporting could not be granted without the ambiguous whole.

     THE NEW KEY IS THE STRATEGY HALF, AND THAT IS THE BACK-COMPAT ARGUMENT:
     a tenant's stored grant on the old key governed what the person could
     actually do — reporting, because §94 refused strategy authoring by rule —
     so the old key KEEPS meaning the Reporting half and nobody's rights move
     on upgrade. The Strategy half is a NEW key, absent from every stored map,
     so it falls back to the shipped defaults below (§30.2: absent means "not
     answered yet"). Renaming the stored key instead would have silently reset
     every tenant that ever touched the matrix.

     `pair` and `col` are the two-row header's vocabulary: the pair name spans
     the two halves, the col name titles each. Entries without a pair span
     both header rows. The OTHER columns are deliberately not split — they are
     view/none for everyone but the office, and ten columns already cost the
     table width; strategy authoring on somebody else's unit stays the
     office's (mayAuthorPage below). */
  /* ── `short` IS THE HEADER'S WORD, `label` IS THE PRODUCT'S (§174) ──
     Islam: *"use Acronyms to make the header smaller. Business unit is BU,
     Function is Func., Supporting is Support, so the header becomes maximum 2
     lines."* Measured before choosing: "Other supporting functions" ran to
     THREE lines at 1500px and FOUR at 1180, which is most of why the head was
     83px deep on a squeezed window.

     A SECOND FIELD RATHER THAN A RENAME, and that is the whole care here.
     `label` is the area's name everywhere it is spoken in a sentence — the
     hover on each heading, and anywhere a refusal or a log has to say which
     area it means — and an abbreviation is right in a 93px column and wrong
     in prose. So the column takes `short` where it has one and `label`
     everywhere else, and nothing that reads `label` had to change.

     WRITTEN OUT, HIS ACRONYMS DID NOT MEET HIS OWN CONSTRAINT: "Other Support
     Func." still wraps to three lines at 1180. Shown the measurement and three
     wordings, he chose the shortest (option C) and kept "Reporting cycle"
     as it is. */
  var AREAS = [
    { key:"a_group",      label:"Group",
      note:"Performance, Foundation, Temple, Weighting, Focus" },
    { key:"a_unit_own_strat", label:"Own business unit — Strategy",
      pair:"Own business unit", short:"Own BU", col:"Strategy",
      note:"Authoring: Foundation · Analysis & SWOT · Plan" },
    { key:"a_unit_own",   label:"Own business unit — Reporting",
      pair:"Own business unit", short:"Own BU", col:"Reporting",
      note:"Performance · entering figures · saving drafts · submitting" },
    { key:"a_unit_other", label:"Other business units", short:"Other BUs",
      note:"Every unit they do not hold" },
    { key:"a_fn_own_strat", label:"Own supporting function — Strategy",
      pair:"Own supporting function", short:"Own Func.", col:"Strategy",
      note:"Authoring: a capability's definition and projects" },
    { key:"a_fn_own",     label:"Own supporting function — Reporting",
      pair:"Own supporting function", short:"Own Func.", col:"Reporting",
      note:"Performance · entering figures · saving drafts · submitting" },
    { key:"a_fn_other",   label:"Other supporting functions", short:"Other Func.",
      note:"Every function they do not hold" },
    { key:"a_cycle",      label:"Reporting cycle",
      note:"Open, chase and close · Import · Archived plans · Focus measures" },
    { key:"a_setup",      label:"Setup",
      note:"Units, Companies, Functions, People, Labels, Bands, Capabilities, this page" }
  ];
  var AREA_KEYS = AREAS.map(function (a) { return a.key; });

  /* The shipped answer for every role in every area. A tenant's stored map
     overrides it; an ABSENT key falls back here, because absent means "not
     answered yet", not "denied" (§30.2). */
  /* THE STRATEGY DEFAULTS ARE §94 WRITTEN AS CELLS (§117). Edit starts with
     the office alone and everyone else reads — the same behaviour the hard
     rule enforced, now visible on the table. The SMO can OPEN strategy edit
     to a role deliberately (Islam's choice, 2026-08-26), which makes §94 the
     shipped default rather than a floor nobody can lower. */
  var ACCESS_DEFAULTS = {
    /* The SMO. Everything, everywhere. */
    super:     { a_group:"edit", a_unit_own:"edit", a_unit_own_strat:"edit", a_unit_other:"edit",
                 a_fn_own:"edit", a_fn_own_strat:"edit", a_fn_other:"edit", a_cycle:"edit", a_setup:"edit" },
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
    smoteam:   { a_group:"edit", a_unit_own:"edit", a_unit_own_strat:"edit", a_unit_other:"edit",
                 a_fn_own:"edit", a_fn_own_strat:"edit", a_fn_other:"edit", a_cycle:"edit", a_setup:"edit" },
    /* Sees the whole organisation and manages none of it. */
    gceo:      { a_group:"view", a_unit_own:"view", a_unit_own_strat:"view", a_unit_other:"view",
                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"view", a_cycle:"view", a_setup:"none" },
    cceo:      { a_group:"view", a_unit_own:"view", a_unit_own_strat:"view", a_unit_other:"view",
                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"view", a_cycle:"view", a_setup:"none" },
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
    owner:     { a_group:"view", a_unit_own:"edit", a_unit_own_strat:"view", a_unit_other:"none",
                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    custodian: { a_group:"view", a_unit_own:"edit", a_unit_own_strat:"view", a_unit_other:"none",
                 a_fn_own:"edit", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    fnhead:    { a_group:"view", a_unit_own:"none", a_unit_own_strat:"none", a_unit_other:"none",
                 a_fn_own:"edit", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    /* VIEW ON THE REPORTING CELLS, DELIBERATELY (§147.7): Islam's first
       condition is that the grant is MADE on this table — "1- is to be
       granted edit access in the roles & access setup" — so shipping edit
       would make the second condition the only one. The SMO opens the
       own-function cell for project owners, the own-unit (and, for a pillars
       function, own-function) cell for pillar owners. */
    powner:    { a_group:"view", a_unit_own:"none", a_unit_own_strat:"none", a_unit_other:"none",
                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    plowner:   { a_group:"view", a_unit_own:"view", a_unit_own_strat:"view", a_unit_other:"none",
                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    /* VIEW, at Islam's direction (spec 006 §7.2): "contributors only view, and
       if we allow them they should be allowed to their lines only". The second
       half of that sentence is CONTRIB_OWN_LINES below — a rule with teeth,
       so a tenant that has edit stored here still cannot touch anybody
       else's rows. */
    contrib:   { a_group:"view", a_unit_own:"view", a_unit_own_strat:"view", a_unit_other:"none",
                 a_fn_own:"view", a_fn_own_strat:"view", a_fn_other:"none", a_cycle:"none", a_setup:"none" },
    /* THE SAME AS A CONTRIBUTOR'S, DELIBERATELY. A new role's defaults reach
       every existing tenant at once (§30.2: an absent key means "not answered
       yet", so `grant()` falls back to the shipped default) — so shipping a
       tighter floor would quietly take the group away from people who can see
       it today, on the day they upgraded and without anybody choosing it.
       It starts where they already are; the SMO tightens it on the matrix,
       which is the whole reason the role is a row of its own. */
    /* ── THE FLOOR OPENS NOTHING (§207) ───────────────────────────────
       Islam: *"anyone who has no role should default as Employee with no
       access to anything."*

       §93 settled that the floor is not a ROLE — nobody holds it, the picker
       does not offer it, `personRoles()` returns `[]` — while keeping it as a
       matrix row titled *Everyone else*, because what somebody with no role
       may open is still the client's to answer. This is that answer, and it
       is now nothing.

       WHAT IT SHIPPED AS AND WHY THAT IS NO LONGER RIGHT: `a_group:"view"`
       plus view on their own unit and their own function. That was a
       reasonable reading of "an employee should see where they work", and it
       is the wrong default for a platform holding a group's strategy: it
       means anybody the register holds — including a row created by a people
       upload, and including a session the register cannot match (§206) — can
       read the group's plan and figures without anybody granting anything.
       A floor is what applies when NO decision has been made, so it must be
       the safe answer, not the friendly one.

       THE COST IS STATED. On a tenant that has never touched these cells,
       people relying on the floor to read their own unit lose that reading
       and it is given back by granting a role or by opening the row on Roles
       & access — which is the deliberate act this makes it. A tenant that
       HAS stored values keeps them (§30.2: a saved map is merged with the
       defaults, never replaced), so this reaches fresh deployments and
       untouched cells and changes nothing somebody has already decided. */
    employee:  { a_group:"none", a_unit_own:"none", a_unit_own_strat:"none", a_unit_other:"none",
                 a_fn_own:"none", a_fn_own_strat:"none", a_fn_other:"none", a_cycle:"none", a_setup:"none" }
  };

  /* `fill` sits between view and edit (§145, spec 023): everywhere the
     platform asks `=== "edit"` nothing widens, and everywhere it asks
     `!== "none"` a fill grant shows the page — which is exactly the seat
     a fill-the-gaps grant needs, and why no other comparison changed. */
  var STATE_RANK = { none:0, view:1, fill:2, edit:3 };

  /* ── 3 · Pages, and which area answers for each ───────────────── */
  var PAGES = [
    { key:"g_perf",   area:"a_group", scope:"group", label:"Performance", note:"Group headline, business units, themes, capabilities" },
    { key:"g_found",  area:"a_group", scope:"group", label:"Foundation",  note:"Purpose, aspiration, core values, who we are" },
    { key:"g_temple", area:"a_group", scope:"group", label:"Temple",      note:"The strategy on one page. No performance figures" },
    { key:"g_weight", area:"a_group", scope:"group", label:"Weighting",   note:"How much each business unit counts" },
    { key:"u_perf",   area:"unit", scope:"unit",  label:"Performance", note:"The unit's headline and its pillars" },
    { key:"u_found",  area:"unit_strat", scope:"unit",  label:"Foundation",  note:"The unit's own words and Key Objectives" },
    { key:"u_plan",   area:"unit_strat", scope:"unit",  label:"Strategy",    note:"The plan as agreed, with no reported figure on it" },
    { key:"u_anal",   area:"unit_strat", scope:"unit",  label:"Analysis",    note:"The unit's SWOT" },
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
    /* THE OFFICE'S INBOX (§97.2). `area:"always"` with the real gate done by
       inOffice() on the page def and again on the server — the same shape
       c_send has, and for the same reason: who may read what everybody wrote
       in confidence is not a matrix cell somebody could tick. */
    { key:"c_chat",   area:"always", scope:"manage", label:"Messages",         note:"Answer what people write from the corner of the page" },
    { key:"c_import", area:"a_cycle", scope:"manage", label:"Import",          note:"Plan and progress templates" },
    { key:"c_fns",    area:"a_setup", scope:"setup", label:"Supporting functions", note:"Who carries the capabilities" },
    { key:"c_caps",   area:"a_setup", scope:"setup", label:"Capabilities",    note:"What exists, and which function owns each" },
    { key:"k_perf",   area:"fn", scope:"fn",    label:"Performance",     note:"What this function's capabilities read" },
    { key:"k_found",  area:"fn_strat", scope:"fn",    label:"Function overview",     note:"What each capability is, and its key objectives" },
    { key:"k_proj",   area:"fn_strat", scope:"fn",    label:"Projects",        note:"The plan behind each project, with no reported figure on it" },
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
      /* TWO ALLOW-LISTS, ONE BEHIND THE OTHER (§102). worldOf() names the keys
         it lifts off the group and W() names the keys it keeps — so a group
         setting has to be added in BOTH, and forgetting either fails silently
         in the safe-looking direction: the reader sees undefined and answers
         the default, which for a switch means "on". Found by driving the real
         page, not by reading (§44, twice now). */
      focusOff: !!o.focusOff,
      naming: !!o.naming,
      /* §147: a project's owner is a Contributor of its function, and the
         projects live on the capabilities — so the world has to carry them or
         namedInFn() reads an empty list and the floor never derives. §102.4's
         trap exactly: added here AND in worldOf(), in the same edit as the
         rule that reads it. */
      capabilities: o.capabilities || []
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
               /* §102, and it is §44's trap by a slightly different road: this
                  is an ALLOW-LIST, so a group key added later is invisible to
                  every rule until it is named here — and the failure is silent
                  and in the safe-looking direction, because the reader simply
                  sees undefined and answers the default. Add the key here in
                  the same edit as the rule that reads it. */
               focusOff: (state.group || {}).focusOff,
               naming: (state.group || {}).naming,
               capabilities: (state.group || {}).capabilities });
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
    /* ── THE SEAT IS GRANTED, NEVER DERIVED (§187) ────────────────────
       Islam: *"level smo shouldn't be a super user — super user is only
       granted by the super user in the registry, for now."*

       This read `p.level` as a fallback: the pre-§33 field that levels used
       before roles replaced them. Nothing in the product has written it for
       fifty versions — it survives only in two dead prototype files that are
       not in the build — but `personRoles()` is what BOTH sides ask, so a
       person object carrying `level:"smo"` derived Super user on the screen
       AND on the server, and an unrecognised key on a person round-trips
       through `people.extra` untouched. An ungated fallback nobody was
       watching, which is the exact shape of the thing §186 was about.

       THE COST IS STATED, NOT GLOSSED: if any row on any tenant still relies
       on `level` and has no `role`, that person loses the seat and it is
       granted again on the register — which is where Islam has said seats
       come from. §33's migration set `role` on every row it moved, so no row
       should be in that state; a row that is, was never migrated and is a
       thing to find rather than to keep working by accident. */
    var seat = p.role || null;
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

    /* ── PROJECT OWNER AND PILLAR OWNER (§147.7) ──────────────────────
       Read off the plan's own Owner rows, exactly as a unit's head is read
       off the unit — and UNCONDITIONAL, unlike the floor below: a custodian
       somewhere else who also owns a project here holds both. Attachment is
       deliberately NOT required (Islam named two conditions and this was not
       one): the Owner is picked from the register in the office's own pen, so
       the naming is already a deliberate act about a known person. One entry
       per place, however many projects or pillars there name them. */
    var seen = {};
    var once = function (role, at) {
      if (seen[role + "|" + at]) return;
      seen[role + "|" + at] = 1;
      out.push({ role: role, at: at });
    };
    var owns = function (row) { return namedOn({ owner: row && row.owner }, p); };
    (w.capabilities || []).forEach(function (c) {
      if (!c || !c.fn) return;
      if ((c.projects || []).some(owns)) once("powner", "fn:" + c.fn);
    });
    w.unitKeys.forEach(function (k) {
      if ((((w.units || {})[k] || {}).items || []).some(owns)) once("plowner", k);
    });
    w.functionKeys.forEach(function (k) {
      var f = w.functions[k] || {};
      if (String(f.format) === "pillars" && (f.items || []).some(owns))
        once("plowner", "fn:" + k);
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
    /* §147.8: THE SAME FLOOR ON A FUNCTION'S PROJECTS — for everyone the
       projects name who is not an OWNER of one: a milestone's owner, a
       stakeholder, a collaborator. Islam: "contributor is someone whose name
       is on the project anywhere but that doesn't mean that he is a project
       owner." Being NAMED is the whole trigger, like the owner roles above —
       attachment is not asked, because the names are picked from the register
       in the office's own pen. They report nothing until the Contributor row
       is opened, and then only the rows that name them (boundedReach). */
    if (!out.length) w.functionKeys.forEach(function (k) {
      if (namedInFn(w, p, k)) out.push({ role:"contrib", at:"fn:" + k });
    });
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
  /* ── WHO OWNS EVERY PLACE, NAMED ONCE (§175) ──────────────────────
     Three roles are seated at the group and hold the whole tenant, so every
     unit and every function is THEIRS and no page is ever "somebody else's".
     That makes their `other` columns unreachable and their `own` columns the
     only live ones — which is why the matrix has to read this list too.

     IT WAS TWO LISTS AND THEY DISAGREED, and that is the whole of the bug
     Islam found by asking about the CEOs. `roleOwns()` said super and gceo;
     the matrix's own `notApplicable()` said super and gceo; and NEITHER said
     `smoteam` — so an SMO team member owned nothing, read `a_unit_other` for
     every unit, and their four `own` cells were controls that could never be
     consulted. Both sides ask this now, so the table and the resolver cannot
     drift apart again (§42's rule about one copy of a rule).

     SMO TEAM JOINS THEM AT ISLAM'S DIRECTION: *"in case the SMO team is from
     inside the company as well, to have their own access."* It also settles an
     inconsistency §89 had left standing — that row is meant to carry the same
     grants as the Super user, and until now the two read different columns
     while looking identical on the table. Nothing moves on a default tenant
     (both columns ship at edit); a tenant that had NARROWED the other-columns
     widens for its SMO team, which is the direction intended. */
  var OWNS_EVERY_PLACE = ["super", "gceo", "smoteam"];
  function ownsEveryPlace(roleKey) { return OWNS_EVERY_PLACE.indexOf(roleKey) > -1; }

  function roleOwns(w, r, target) {
    if (ownsEveryPlace(r.role)) return true;
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
    /* THE STRATEGY PAGES RESOLVE TO THEIR OWN HALF (§117). An OTHER unit or
       function has no split column — reading somebody else's strategy rides
       the same other-grant as reading their performance, and AUTHORING it is
       refused for everyone but the office by mayAuthorPage() whatever that
       grant says. */
    if (area === "unit_strat" || area === "fn_strat") {
      var owns = roleOwns(w, r, target);
      return area === "unit_strat" ? (owns ? "a_unit_own_strat" : "a_unit_other")
                                   : (owns ? "a_fn_own_strat"   : "a_fn_other");
    }
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

  /* ── A SEAT IS NOT AN ORDINARY ROLE (§186) ────────────────────────
     Islam, from the deployment: *"hussein khaled is a custodian and getting
     the super user … you assured me it's impossible."* It was not
     impossible, and the route is one unconfirmed selection: the register's
     role picker offers every role a `<select>` can hold and commits on the
     `change` event, so ONE pick on the most powerful grant in the product
     writes `p.role = "super"` with nothing in between.

     The SERVER has always been right about this — a change to somebody's
     seat classifies as `access`, which `mayEditAccess()` keeps to the Super
     user — so what was wrong is entirely the SCREEN, offering a control the
     save refuses for everybody but the one person it does not refuse, for
     whom it goes through instantly and silently. §42's drift, in the most
     dangerous place it could be.

     NAMED HERE, not in the browser, because three surfaces have to agree
     about which roles these are: the picker, the people workbook's Role
     column, and the register's own watch for a seat nobody meant to grant.
     `cceo` is on the list although it is held at a company rather than the
     group — what makes a seat a seat is that it is a property of the PERSON
     (§33) rather than something a unit points at, and handing one out is a
     decision about the organisation rather than about a plan. */
  var SEAT_ROLES = ["super", "smoteam", "gceo", "cceo"];
  function isSeatRole(k) { return SEAT_ROLES.indexOf(k) > -1; }

  /* A SEAT SITTING SOMEWHERE ELSE (§186). A seat is held over the group (or,
     for a company CEO, over their company) and the people who hold one sit
     there too — so a seat whose place is NOT where the person sits is the
     shape of an accident, and it is exactly what the chrome's own role line
     already prints with a place beside it (§178).

     THE OFFICE IS NOT FLAGGED, and that is why the test is the PLACE rather
     than "holds a seat and something else": the bootstrap SMO holds
     super@group AND heads the SMO function (§118), so a rule about holding
     two roles would nag about the one row that is certainly correct. */
  function seatOutOfPlace(w, p, at) {
    var wrong = null;
    personRoles(w, p).forEach(function (r) {
      if (wrong || !isSeatRole(r.role)) return;
      if (r.at !== at) wrong = r;
    });
    return wrong;
  }

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
     (§97.1). A responsibility role could never make somebody the office or the
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
     closed.

     §117 MOVES §94'S LOCK FROM A HARD RULE TO THE STRATEGY HALF'S GRANT.
     The five strategy pages resolve to `a_unit_own_strat` / `a_fn_own_strat`
     (areaFor), whose shipped default is edit for the office and view for
     everyone else — so the behaviour §94 enforced is unchanged until the SMO
     deliberately opens a role's Strategy cell, which was Islam's choice
     (2026-08-26): the lock is now the default, not a floor nobody can lower.
     ONE EXCEPTION SURVIVES AS A RULE: authoring somebody ELSE'S unit or
     function stays the office's, because the other columns are not split and
     an a_unit_other edit is the office's own wide grant, not a client role
     handing itself a neighbour's plan. */
  function mayAuthorPage(w, person, pageKey, target) {
    if (isStrategyPage(pageKey) && !isOffice(w, person)) {
      var ownsIt = rolesOrFloor(w, person).some(function (r) {
        return roleOwns(w, r, target);
      });
      if (!ownsIt) return false;
    }
    return grantAtPage(w, person, pageKey, target) === "edit";
  }

  /* ── FILL THE GAPS (§145, spec 023) ────────────────────────────────
     A third level of Strategy access between view and edit: the custodian
     or the owner writes only where the plan holds NOTHING — and the fill
     stays PENDING, theirs to correct, until the office confirms it.

     ONE DEFINITION OF A GAP. The deck marks Missing (§119), the screen
     draws the fillable field, and the server judges the transition — all
     three read this table, or the screen lets somebody type what the save
     then refuses (§42's drift). A gap is a place holding nothing: null or
     whitespace, never a typed 0 (§104.10 — Number("") is 0, and an empty
     box must not read as a genuine nought). */
  var GAP_FIELDS = {
    unit:    ["aspiration"],
    ko:      ["dir", "target", "target3y", "compile"],
    measure: ["dir", "target", "compile"],
    /* `quarters` is VIRTUAL and covers q1–q4 as one mark: a tactic set to
       Q2 and Q3 is saying something by leaving Q1 and Q4 empty (§119.1),
       so only a tactic with NO quarter at all is a gap (§128) — and while
       that fill is pending the four move together.

       `collaborators` IS OUT AGAIN (§187, reversing §145.10 at Islam's
       direction: *"remove the missing collaborators as missing items"*).
       §145.10 put it in — itself reversing this section's first exclusion —
       on the reasoning that an empty list is a place the plan holds
       nothing. It is not: a tactic with nobody supporting it is a tactic
       ONE person owns, which is an ordinary and complete way to write a
       line, and every one of them was being counted as owing something.
       An optional blank is not a gap (§119.1's own rule, which the deck
       has followed for collaborators all along) — so this brings the fill
       count into line with what the deck already declined to mark.

       Recorded as a reversal rather than overwritten, per Principle II:
       the machinery §145.10 built is untouched and one word gives it back.
       The `owner` stays, because a line nobody owns is a line nobody can
       report. */
    /* §249: THE OUTCOME AND ITS TARGET ARE OWED, REVERSING §248's OWN
       EXCLUSION. Islam: *"the tactics outcome and target are not counting
       missing in the units plans. they should count as missing."*

       §248 built both fields and deliberately kept them out of this list —
       *"the risk was noise, so the default is quiet"* — because shipping
       them counted would have put the red word on all 83 tactics in the
       demo the day it landed. That was a judgement about the ROLLOUT and
       he has now made the judgement about the PLAN: a tactic that names
       nothing it should produce is a line nobody can measure, which is
       the same argument that keeps `owner` here.

       BOTH, and the target is the half that carries the arithmetic: an
       outcome with no target scores nothing, and a target with no outcome
       is a number with nothing to name it. Counting one and not the other
       would leave a row half-owed with no way for the page to say which.

       WHAT FOLLOWS FROM ONE LINE, stated because it is the cost he
       accepted: they become FILLABLE (this list is the floor of
       GAP_FILLABLE, §205), the band, the rail, the chips and the Next-gap
       walk all count them (§116.2), and SUBMIT REFUSES while any tactic
       still owes one (§221 reads the same map) — so no unit submits until
       its plan is written through. */
    tactic:  ["owner", "quarters", "outcome", "outTarget"],
    /* §214.2: A FUNCTION'S KEY OBJECTIVES ARE NOT COUNTED (Islam: *"the key
       objectives should not count as missing in the functions in general.
       The definition is OK and the owner is OK, but the key objective
       specifically should not count."*). A capability with none is judged by
       its projects and a function with none by its pillars — so an objective
       is an optional line, and an optional blank is not a gap (§119.1, §187).

       THEY STAY FILLABLE, which is what `GAP_OPTIONAL` is for and is §205's
       lesson paid rather than repeated: §187 stopped collaborators counting
       by EMPTYING the one list the server also reads, so the screen went on
       opening the cell while every save of one was refused — a BU owner met a
       refusal among rows that were accepted. COUNTED and FILLABLE are two
       questions and this answers only the first. */
    capko:   [],
    /* §214: THE OVERVIEW IS MANDATORY (Islam: *"all the overview for the
       functions planning by pillars should be mandatory and be counted as
       missing"*). `cap` is the holder of that page — a capability on one
       function format, the function itself on the other (§213) — and what it
       owes is the sentence saying what it is.

       ONE ENTRY FOR BOTH, or the two Overviews start answering the same
       question differently, which is the drift §211 cost a day and §213
       closed by construction. It is deliberately NOT "and at least one key
       objective": a function judged by its pillars legitimately has none, an
       optional blank is not a gap (§119.1, §187), and fill mode cannot ADD a
       row (§145) — so counting it would promise a control that does not
       exist (§61). */
    /* §214.4 REVERSES §214 (Islam: *"for the functions that plan with pillars
       remove the elements of the overview from the missing items"*).

       §214 made the definition mandatory, on his instruction and scoped to
       pillars functions; the capability side was added here for §53.5, so
       that it stays ONE page with ONE answer. The reversal takes both back
       for the same reason — a definition counted on one format and not the
       other is exactly the drift §211 cost a day and §213 closed. Capability
       functions are simply back where they were for their whole life.

       STILL FILLABLE, in `GAP_OPTIONAL` beside the objectives — §205's rule
       for the third time: counted and fillable are two questions, and
       answering the first by emptying the list the SERVER reads is what
       refuses a save the screen has already offered. */
    cap:     [],
    project: ["owner", "start", "end"],
    /* §177: THE PAGE ALREADY CALLED THESE MISSING. A project pane prints the
       red word in exactly two more places -- an outcome with no target, and a
       milestone with no due date -- and a milestone with no owner printed an
       em-dash, which is the platform's word for ABSENT and says nothing is
       owed. So the fill grant counted 0 on a project showing three red
       Missings and drew no control at all: the product's own vocabulary
       disagreeing with the one feature named after it (Islam: "his project
       has missing items. he should be able to fill the missing items").
       A deliverable is NOT here -- its direction and target are written FOR
       it ("=" and "Y/N", §104) and there is nothing to fill. */
    outcome:   ["target"],
    milestone: ["owner", "finish"]
  };
  /* ── FILLABLE IS NOT THE SAME LIST AS COUNTED (§205) ────────────────
     From the deployment: a BU owner filling gaps had *"Enable a seamless
     customer experience — Collaborators"* refused, among rows that were
     accepted. Islam settled it in one line: *"collaborators are fillable
     but not counted as missing."*

     THE SERVER WALKED THE COUNTING LIST. §187 took collaborators OUT of
     GAP_FIELDS so the band would stop nagging about an optional blank —
     correct, and it also took away the only list the authoriser's gap pass
     reads, so the SCREEN went on opening the cell (an empty list is blank,
     and `filling()` only asks the page) while every save of it was refused
     as authoring. §42's drift: a control drawn and a save refused, silent
     until somebody used it.

     So the two questions are separated, the way §192.4 already separated
     the WALK from the count for the same reason. `GAP_FIELDS` stays the
     answer to *is this owed* — the band, the rail, the chips, the deck's
     Missing and Submit all read it and none of them changes. `GAP_FILLABLE`
     is the answer to *may a filler write this where it is empty*, and it is
     GAP_FIELDS plus the optional blanks. Nothing is fillable that was not
     fillable before §187; this restores what that section removed by
     accident while keeping what it removed on purpose. */
/* §224.2: THE DEFINITION IS THE OFFICE'S, and it is a fill decision rather
   than a counting one. Islam, having seen §223 open the door on it: *"remove
   the definition of the functions overview from the filling what's missing or
   filling what's empty — the SMO will do it."*

   `cap` therefore has NOTHING fillable, which is why the entry goes rather
   than becoming an empty array: §223's door asks whether anything on the page
   is fillable, so an empty list already closes it for the definition while
   leaving the key objectives beside it open, which is what he asked for.

   ONE LIST, BOTH SIDES (§205). The authoriser reads this same map, so the
   save refuses a filler's definition exactly where the screen declines to
   open it — the pair §205 exists to keep together, in the direction that
   closes rather than opens. */
var GAP_OPTIONAL = { tactic: ["collaborators"],
                     /* §227: A MILESTONE'S COLLABORATORS, THE TACTIC'S RULE
                        MOVED OVER (Islam: "add collaborators beside the owner
                        column similar to the collaborators in the tactics").
                        Fillable while EMPTY, never counted as missing — §187's
                        ruling holds on both sides of the switch (A15). */
                     milestone: ["collaborators"],
                     capko:  ["dir", "target", "compile", "weight"] };
  var GAP_FILLABLE = (function () {
    var out = {};
    Object.keys(GAP_FIELDS).forEach(function (k) {
      out[k] = GAP_FIELDS[k].concat(GAP_OPTIONAL[k] || []);
    });
    return out;
  })();
  /* ── THE OFFICE'S APPROVAL IS GONE (§218) ─────────────────────────
     Islam: *"please remove the approval of the SMO on the missing filling
     … the custodian is already choosing from lists and he is responsible.
     The confirmation is just a gate that we never needed."* Put to him
     that being named an Owner is what confers the right to report a line,
     so the gate was doing a second job; he answered that the custodian is
     responsible, and that is his call to make.

     WHAT SURVIVES IS THE STAMP, NOT THE GATE. `pend` is still written and
     still read by the authoriser, so somebody who fills a value can still
     correct their own typo (§145's "still the filler's to correct"). It
     no longer decides anything: no amber, no tick, no waiting, and the
     value counts in the score the moment it is written.

     `GAP_SCORE_FIELDS` and `pendingScore()` went with the gate. They
     answered "is this row's comparison not ready yet", and with no gate
     the answer is always no — a predicate that cannot be true is worse
     than none, because the next reader takes it for load-bearing (§24). */

  /* ── WHEN A DATE IS A DATE (§184) ─────────────────────────────────
     `monthsOf()` in the platform is what decides whether a row is due, what
     `dueFits()` calls a date on upload, and what the overrun warning
     compares — so it is the platform's definition of a time, and until now
     it lived in the browser alone. THE SERVER NEEDED IT: §184's whole
     fault is that a value the platform cannot read — `30/09/2026`, typed
     before §179 gave these fields a picker — is not blank, so the screen
     let a filler correct it and the server classified the correction as
     AUTHORING and refused it. Two answers to "is this a date", one per
     side, which is §42's drift with a lost afternoon on the end of it.

     So the reader moves here whole, as a pure function taking the cycle's
     year rather than reading REVIEW, and `monthsOf()` becomes a one-line
     wrapper (§130.7's shape, where the name rule made the same move).
     Nothing about what it reads changes — the regexes, the two-digit year
     rule and the quarter/half `last` behaviour are as they were. */
  var WHEN_MONTHS = ["jan","feb","mar","apr","may","jun",
                     "jul","aug","sep","oct","nov","dec"];
  function whenMonthIndex(w) {
    return WHEN_MONTHS.indexOf(String(w || "").slice(0, 3).toLowerCase());
  }
  function whenFullYear(y) {
    var n = +y;
    if (!n && n !== 0) return null;
    /* "26" is 2026, not 26 AD — a plan is never written about the year 26. */
    return n < 100 ? 2000 + n : n;
  }
  /* Months since year zero, so two dates in different years compare with one
     subtraction. Null when the text is not a time at all — which is what the
     upload notice reports and what "Done" in a due-date column produces.
     `cyYear` is the cycle's year, used only where a quarter or a half names
     none; null there means the SHAPE is still read (see whenReadable). */
  function whenMonths(v, last, cyYear) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return null;
    var m;
    /* W3 Mar 26 / Week 3 March 2026 — the week is read and discarded,
       because the comparison is monthly. It is kept in the TEXT. */
    if ((m = /^w(?:eek)?\s*[1-5]\s+([a-z]+)\.?\s*'?(\d{2,4})$/i.exec(s)))
      return whenMonthIndex(m[1]) < 0 ? null : whenFullYear(m[2]) * 12 + whenMonthIndex(m[1]);
    /* July 26 / Jul 2026 / Dec 26 */
    if ((m = /^([a-z]+)\.?\s*'?(\d{2,4})$/i.exec(s)))
      return whenMonthIndex(m[1]) < 0 ? null : whenFullYear(m[2]) * 12 + whenMonthIndex(m[1]);
    /* Q3 2026 / Q3 — a quarter is its FIRST month, or its last when `last`
       is asked for, which is how a cycle named Q2 covers April to June. */
    if ((m = /^q([1-4])\s*'?(\d{2,4})?$/i.exec(s))) {
      var qy = m[2] ? whenFullYear(m[2]) : cyYear;
      return qy == null ? null : qy * 12 + (+m[1] - 1) * 3 + (last ? 2 : 0);
    }
    /* H1 2026 / H2 26 — a half year, which is what a review is usually
       called and what the old reader could not see at all. */
    if ((m = /^h([12])\s*'?(\d{2,4})?$/i.exec(s))) {
      var hy = m[2] ? whenFullYear(m[2]) : cyYear;
      return hy == null ? null : hy * 12 + (+m[1] - 1) * 6 + (last ? 5 : 0);
    }
    /* FY26 / 2026 — a whole year. */
    if ((m = /^(?:fy)?\s*'?(\d{4})$/i.exec(s)))
      return whenFullYear(m[1]) * 12 + (last ? 11 : 0);
    /* 31 May 2026, and anything else a browser genuinely reads as a date. */
    var t = Date.parse(s);
    if (!isNaN(t)) { var d = new Date(t); return d.getFullYear() * 12 + d.getMonth(); }
    return null;
  }
  /* CAN THE PLATFORM READ THIS AT ALL — the SHAPE, never which month it
     lands on. A bare "Q3" names no year and is still a time somebody wrote;
     it resolves against the cycle on a page and against nothing on a server
     that is not looking at one, so readability is asked with a year SUPPLIED
     rather than with none. One reader, asked twice — never a second list of
     regexes, which is exactly how "a date" would come to mean two things
     again (§53.5). */
  function whenReadable(v) { return whenMonths(v, false, 2000) != null; }

  /* ── WHOSE RIGHTS A SAVE IS JUDGED BY (§185) ──────────────────────
     Islam: *"Hala got this error, when I view as her I didn't get it — so
     the view-as function is not showing exactly what people see."*
     Viewing as somebody changed everything the screen DREW and nothing the
     server ACCEPTED, so no refusal anybody met could be reproduced, and the
     office could write through a colleague's view what that colleague could
     never write themselves.

     A RULE, NOT A BRANCH IN THE ENDPOINT, for §42's reason: it decides who
     may act as whom, which is exactly the kind of question that must have
     one answer and be testable without a database.

     IT CAN ONLY NARROW, and the three answers are what make that true.
     `seatRole` is the seat the SESSION carries — never a role read out of
     the state, which is the thing being written — so a forged `viewAs` from
     a session that cannot simulate buys nothing and is judged as itself.
     An unknown key is REFUSED rather than treated as somebody with no roles:
     "no roles" is a narrowing that hides a mistake instead of reporting it. */
  function actingFor(me, viewAs, seatRole, people) {
    var want = typeof viewAs === "string" ? viewAs.trim() : "";
    if (!me || !want || want === me.key) return { person: me };
    if (seatRole !== "super")
      return { refuse: "Only the SMO can act through somebody else's view." };
    var them = null;
    (people || []).forEach(function (p) { if (p && p.key === want) them = p; });
    if (!them)
      return { refuse: "The register does not hold the person this view belongs to." };
    return { person: them, simulated: true };
  }

  function gapBlank(v) { return v == null || String(v).trim() === ""; }
  /* The virtual quarters field, read as one. */
  function quartersBlank(t) { return !t.q1 && !t.q2 && !t.q3 && !t.q4; }

  /* THE THREE GAP FIELDS THAT HOLD A TIME (§184). Keyed on the FIELD NAME,
     not on the row kind, because `start`, `end` and `finish` appear in
     GAP_FIELDS as dates and as nothing else — so one list answers for a
     project's front matter and a milestone's due date without either call
     site having to remember which it is. */
  var GAP_WHEN = ["start", "end", "finish"];
  function gapWhenField(f) { return GAP_WHEN.indexOf(f) > -1; }

  /* ── A TARGET IS A NUMBER, AND A UNIT ON ITS OWN IS NOT ONE (§249) ──
     §248 lets the office pick what an outcome is measured in before
     deciding how much of it — `outTarget` holds "%" for as long as it takes
     to type 90 — so the field is legitimately non-blank while holding
     nothing anybody can be measured against: `outcomeOf` refuses to score
     it and the tactic goes on being read the old way.

     A BLANK TEST WOULD THEREFORE CALL THAT ROW ANSWERED. §184's rule, with
     a number in place of a date: a gap is a place holding nothing the
     platform can USE, and a value the reader cannot parse is one. The
     PRODUCT's own definition of "is there a number in here" is what is
     asked (`outcomeOf` calls this too), or the count and the score would
     disagree about the same string — the drift §42 exists to prevent. */
  /* §251: AND `target` AND `target3y` JOIN IT, for the same reason one field
     over. The office may now pick a measure's or an objective's unit before
     its number (Islam: *"In the edit I can't set the unit for a measure"*), so
     `target` holds "%" for as long as it takes to type 90 — non-blank, and
     holding nothing anybody can be measured against. Without this line the red
     Missing would vanish the instant a unit was picked, the gap count would
     drop, the Next-gap walk would step past the row and Submit would stop
     refusing on a plan with no target in it — §249.2's fault exactly, and the
     one cost of §251, stated to Islam before it was built.

     KEYED ON THE FIELD NAME, so it reaches a project OUTCOME's target too,
     which carries no picker. That is the rule being consistent rather than an
     accident: a target holding no number is unscorable there as well, and
     `measureDue` — which every one of these rows is scored through — has
     always returned null for one. Measured on the shipped plan before adding
     it: **208 non-blank target fields across objectives, measures, capability
     objectives and project outcomes, 0 of them non-numeric**, so not one row
     in the demo changes what it counts. On a tenant that has typed a target
     as words, that row starts saying Missing, which is the thing to watch. */
  var GAP_NUM = ["outTarget", "target", "target3y"];
  function gapNumField(f) { return GAP_NUM.indexOf(f) > -1; }
  function targetHasNumber(v) {
    return !isNaN(parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")));
  }

  /* ── A TARGET THAT IS A YES OR A NO (§251) ─────────────────────────
     Islam: *"for the target we need to add a Y/N in the units which dims the
     target itself."* Some rows are not measured, they either happened or
     they did not — a certification achieved, an agreement signed, a
     warehouse open. Until now the plan had no way to write one: every
     target box wants a number, so such a row was left blank and read as a
     gap for ever.

     IT IS A UNIT, NOT A SECOND FIELD, and that is the whole of why it
     costs no migration. §199 put the unit ON the target string ("6.2B EGP"
     is one field), so `Y/N` is simply the unit whose value part is always
     empty: the target reads exactly `Y/N`, `target`/`outTarget` go on
     holding the whole string, and every one of the places that read them
     keeps working. A second field would have been a second source of truth
     and the two would have drifted the first time anything wrote one of
     them (§53.5).

     AND IT IS A COMPLETE ANSWER, NEVER A GAP. §249 made a target holding
     only a unit read as Missing, which is exactly right for `%` on its way
     to `90%` and exactly wrong here: `Y/N` is not a target half-typed, it
     is the finished target of a row that has no number. Without this line
     every Y/N row would wear the red word for ever and refuse Submit
     (§221) — a hole nobody could close, because there is nothing to fill.

     THE COMPARISON IS CASE-INSENSITIVE AND TRIMMED, because this string
     also arrives from an uploaded workbook (§22), where somebody has typed
     it into a cell. What the PEN writes is always the canonical `Y/N`. */
  var YN_UNIT = "Y/N";
  /* ── §251.2: THE UNIT SAYS IT, AND THE VALUE IS SIMPLY NOT COUNTED ──
     The first build read the WHOLE STRING, so a row became yes/no only by
     having its number destroyed — and Islam, from the running page with a
     target reading `100  Y/N` and nothing dimmed: *"even they are set
     before they need to be dimmed even by keeping the values but as if they
     are not counted anymore."*

     He is right, and it is the better model twice over. Picking a unit has
     never destroyed a figure anywhere else in this product, and destroying
     one here would make changing your mind cost somebody the number they
     had typed — with no undo, because the old value is gone. So `Y/N` is
     read exactly as every other unit is: off the END of the target string.
     `100 Y/N` is a yes/no row that still remembers 100, and picking `B EGP`
     again gives `100B EGP` back.

     READ THE SAME WAY `outUnitOf` READS ONE (§248): `targetParts` looks for
     a number FOLLOWED BY a unit, so with no number the whole string IS the
     unit — which is what makes a bare `Y/N` (a row that never had a figure)
     and `100 Y/N` (one that did) the same kind of row. */
  function ynUnitOf(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return "";
    var p = targetParts(s);
    return /^-?[\d.,]+$/.test(p.value) ? p.unit : s;
  }
  function isYesNo(v) {
    return ynUnitOf(v).trim().toUpperCase() === YN_UNIT;
  }
  /* WHAT A YES OR A NO SCORES: 100 or 0, Islam's own choice, so the row
     counts in the pillar's and the unit's averages exactly as a measured
     row does. Anything else — blank, or a value from before this existed —
     is NOT SCORED rather than nought (§35: absent is not zero, and §104.10
     in the same shape). One reader for the screen and the score alike, or
     the page and the average would disagree about one word. */
  function ynAnswer(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    if (s === "yes" || s === "y") return true;
    if (s === "no" || s === "n") return false;
    return null;
  }
  function ynScore(v) {
    var a = ynAnswer(v);
    return a == null ? null : (a ? 100 : 0);
  }

  /* ── A TARGET WITH A SHAPE OF ITS OWN (§261) ───────────────────────
     Islam: *"targets proration is always flat across the year but some
     targets have seasonality so the proration is not valid .. so some
     targets needs a monthly plan input so the calculation becomes more
     accurate nor flatly proration."*

     TWELVE NUMBERS IN THE TARGET'S OWN UNIT, on the row, January first.
     §239 has spread an annual target evenly across the year since it was
     written, which is right for a business that trades evenly and wrong for
     one with a season. Measured on Mobile's own plan: Accessory revenue,
     300M EGP for the year, 96M reported at June, reads **64% — behind**
     against a flat half-year and **100% — on plan** against its own shape.
     Same plan, same figure, same day, and only one of the two is a fact
     about the business.

     THE COMPILE RULE ALREADY SAYS HOW TO READ THEM, which is what keeps
     this one arithmetic rather than a second scoring model: `Sum` adds up
     the months that have passed, `Average` takes their mean, and `Latest`
     takes the month being stood in — the same three words the plan already
     uses to compile what is REPORTED (§53.5). It also retires §239's reason
     for refusing to prorate Latest and Average at all ("with no baseline
     stored, prorating them would be inventing a glide path"): a monthly plan
     IS that glide path, supplied by the tenant rather than invented here.
     A row with NO compile rule is not in force — without one the platform
     does not know whether the year is the sum of the twelve or the last of
     them, and guessing would put a number nobody chose on the page.

     IN FORCE ONLY WHEN ALL TWELVE ARE SET, AND A TYPED 0 IS A REAL MONTH —
     Islam's own correction, taken before this was built ("a month target
     might be entered 0 and it's fine"). That distinction has teeth:
     `Number("")` and `Number(null)` are both 0 and both finite (§104.10),
     so a truthiness test or a bare `Number()` would silently read seven
     empty boxes as seven planned noughts and cut the year by more than
     half — a target nobody typed, arrived at by arithmetic nobody could
     see. The BLANK test comes first and the number second, here and
     nowhere else, so there is one definition of "this month is set".

     A HALF-FILLED PLAN IS STORED AND NOT USED. Twelve boxes are filled over
     more than one sitting, so what has been typed is kept; what it must not
     do is quietly become the target. Until the twelfth is set the row is
     prorated flat exactly as it is today, and the page says so in words
     rather than leaving somebody to wonder why nothing happened (§61). */
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  /* IS THIS MONTH SET. Blank first, THEN the number — see above. A value
     that is present and not a number counts as not set, so a plan carrying
     one is not in force and the row goes on being read exactly as it was:
     the safe direction, and the count on the page says so. */
  function monthSet(v) {
    if (v == null || String(v).trim() === "") return false;
    return isFinite(Number(String(v).replace(/,/g, "")));
  }
  function monthlySet(row) {
    var a = row && row.monthly, n = 0;
    if (!Array.isArray(a)) return 0;
    for (var i = 0; i < 12 && i < a.length; i++) if (monthSet(a[i])) n++;
    return n;
  }
  /* Anything typed at all — what lights the chip in the pen, so a plan
     somebody is halfway through is findable again. */
  function monthlyStarted(row) { return monthlySet(row) > 0; }
  /* The twelve as numbers, or null when the plan is not complete. */
  function monthlyPlan(row) {
    var a = row && row.monthly;
    if (!Array.isArray(a) || a.length !== 12) return null;
    var out = [];
    for (var i = 0; i < 12; i++) {
      if (!monthSet(a[i])) return null;
      out.push(Number(String(a[i]).replace(/,/g, "")));
    }
    return out;
  }
  var MONTHLY_COMPILES = ["sum", "average", "latest"];
  function monthlyCompile(row) {
    var c = String(row && row.compile || "").trim().toLowerCase();
    return MONTHLY_COMPILES.indexOf(c) > -1 ? c : "";
  }
  function monthlyInForce(row) {
    return !!(monthlyPlan(row) && monthlyCompile(row));
  }
  /* WHAT THE ROW IS MEASURED AGAINST AFTER `months` OF THE YEAR. The one
     arithmetic every surface asks; `months` is 1..12 and comes from the
     review point, never from a tactic's own window — a monthly plan already
     states what each month is expected to carry, including the noughts for
     months a thing does not run in, so it is the more specific answer and
     supersedes §250's share. */
  function monthlyDue(row, months) {
    var p = monthlyPlan(row), c = monthlyCompile(row);
    if (!p || !c) return null;
    var n = Math.floor(Number(months));
    if (!(n >= 1)) return null;
    if (n > 12) n = 12;
    if (c === "latest") return p[n - 1];
    var t = 0;
    for (var i = 0; i < n; i++) t += p[i];
    return c === "average" ? t / n : t;
  }
  /* THE YEAR'S TARGET, DERIVED. It is the same question asked of all twelve
     months, which is what makes the annual figure and the year-to-date one
     impossible to disagree: one function, one compile rule, one plan. */
  function monthlyAnnual(row) { return monthlyDue(row, 12); }
  /* IS THIS FIELD A GAP — the ONE test the screen, the counts, the deck and
     the server all ask. A gap is a place holding nothing the platform can
     USE, which for a date includes a value it cannot read: a milestone due
     `30/09/2026` is a row the plan says nothing usable about, the page
     already prints a red note naming it, and every score treats it as no
     date at all. Before §184 it was merely non-blank, so the fill grant
     would not open it, the office was the only one who could correct it,
     and a filler who tried had the whole save refused. */
  function gapEmptyValue(field, v) {
    if (gapBlank(v)) return true;
    /* §251: a Y/N target is a finished answer with no number in it, so it
       is answered BEFORE the numeric test — which would otherwise call
       every yes/no row a gap and block Submit with nothing to fill. */
    if (gapNumField(field)) return !isYesNo(v) && !targetHasNumber(v);
    return gapWhenField(field) && !whenReadable(v);
  }
  function gapEmpty(field, row) {
    if (field === "quarters") return quartersBlank(row);
    return gapEmptyValue(field, row ? row[field] : null);
  }

  /* The pending marks on a row (or on the unit itself, for aspiration):
     `pend = { field: {by, at} }`. Stored as an ABSENCE — confirming
     deletes the key, the last key leaving deletes `pend` (§50.6) — and
     read through one frozen empty, never created by reading. */
  var FROZEN_PEND = Object.freeze({});
  function pendOf(row) { return (row && row.pend) || FROZEN_PEND; }
  /* The fields on this row still holding NOTHING — blank and unmarked. A
     pending fill is answered, not missing, so it is not in this list; the
     gap band, the tab badge and the rail counts all count through here
     (§145.12: one definition, or the counts disagree with the fields). */
  /* IS THIS FIELD EVER A GAP AT ALL (§192.4)? Asked of the WHOLE table rather
     than of one kind, because the cell builder is shared and is not told which
     kind of row it is drawing — and the union fails in the safe direction: a
     field that is a gap somewhere is walked everywhere it is blank (a
     nuisance), where the other way round would silently skip a real gap.

     §187 is why this exists. It removed `collaborators` from GAP_FIELDS at
     Islam's direction — *"remove the missing collaborators as missing items"* —
     so the COUNTS stopped including them, and the walker, which marks any
     blank fillable cell, did not. Measured on a unit's plan: the band said one
     gap in that pillar and "Next gap" walked six fields, five of them
     collaborator pickers, so the walk spent every press on rows nothing was
     asking about and never reached the other four places. The count and the
     walk are one list (§116.2) and they had stopped being one. */
  var GAP_ANY = null;
  function isGapField(field) {
    if (!GAP_ANY) {
      GAP_ANY = {};
      Object.keys(GAP_FIELDS).forEach(function (k) {
        GAP_FIELDS[k].forEach(function (f) { GAP_ANY[f] = 1; });
      });
    }
    return !!GAP_ANY[field];
  }
  function gapMissing(kind, row) {
    return (GAP_FIELDS[kind] || []).filter(function (f) {
      /* §249.2: A MARK ON A VALUE THAT IS STILL EMPTY DOES NOT ANSWER IT.
         A pending fill is answered, not missing — true of a fill that put
         something usable there, and a marked field was ALWAYS non-blank until
         §249 gave `outTarget` a second way of holding nothing ("%", a unit
         chosen before its number). The screen no longer stamps such a value,
         so this changes no count on any stored plan (measured on the shipped
         seed: 156 gaps either way); it is here so the count cannot be
         quietened by a mark however that mark came to be written — the count,
         the walk and Submit's refusal all read this one list (§116.2). */
      if (pendOf(row)[f] && !gapEmpty(f, row)) return false;
      return gapEmpty(f, row);
    });
  }

  /* May this person FILL this page's gaps? The same ownsIt walk as
     mayAuthorPage — a non-office role never fills a unit or function it
     does not hold — and the grant must be exactly `fill`: at edit they
     author (their writes settle, no pending mark), at view they read.
     The OFFICE never fills for the same reason — mayAuthorPage already
     answers for them, and an office write is a settled write. */
  /* u_anal is a strategy page with NO fillable field (the SWOT is rows,
     and rows are never fill mode's — §145.2), so the fill grant must not
     draw its pen: a pen that opens nothing is §61's trap wearing §145's
     clothes. The list is the pages GAP_FIELDS actually reaches. */
  var FILL_PAGES = ["u_found", "u_plan", "k_found", "k_proj"];
  function mayFillPage(w, person, pageKey, target) {
    if (FILL_PAGES.indexOf(pageKey) < 0) return false;
    if (isOffice(w, person)) return false;
    var ownsIt = rolesOrFloor(w, person).some(function (r) {
      return roleOwns(w, r, target);
    });
    if (!ownsIt) return false;
    return grantAtPage(w, person, pageKey, target) === "fill";
  }

  /* ── REORDERING COMES BACK, AND IT IS ITS OWN QUESTION (§101) ────
     §94.3 folded reordering into authoring and closed it to the office, on the
     argument that the order of a plan is as much a part of what was agreed as
     its words. Islam is giving it back: "I will give it back — shall we align
     where to visually have it?"

     IT IS A SEPARATE RULE, NOT A HOLE IN mayAuthorPage(). Authoring means
     changing WHAT the plan says; arranging means changing the order the same
     rows are read in. Widening mayAuthorPage() to let these roles through
     would have handed them the words as well — the exact fault §94 was fixing.

     WHO: the roles that HOLD the thing. Islam: "no, only custodian and BU
     owner", and, of a supporting function's Projects pane, "same". A function
     has no BU owner, so the holder there is its head — and a custodian
     attached to a function holds it the same way. A Contributor never, which
     was asked and answered directly; a group or company CEO only if they also
     hold one of these, because reaching a unit is not holding it (§37).

     THE GRANT STILL HAS TO SAY EDIT. This narrows from the grant, it never
     widens: a tenant that has closed a unit's plan to its own custodian keeps
     it closed. The office is answered first and separately — they arrange
     through the pen, and inOffice() is the tenth-place lesson of §89. */
  /* ── FOCUS MEASURES HAVE A SWITCH (§102) ─────────────────────────
     Islam: "give me the option to turn off in the product settings in general
     to verify with the CEO later, and off means it disappears across the
     platform" — and, asked whether off should also forget: "off and on brings
     back history yes."

     SO THE SWITCH HIDES; IT NEVER DELETES. `cycle.focus` keeps every mark, and
     turning it back on restores the lot. §44's rule, third time: a switch that
     destroys data is not a switch, it is a delete with a friendly label.

     STORED AS AN ABSENCE. `GROUP.focusOff` exists only while the feature is
     off, so on is what a tenant that has never been asked already has, and
     turning it back on DELETES the key rather than writing `false` (§50.6 — a
     reader that creates what it looked for puts a phantom change into every
     save). Named `focusOff` and not `focus`, because `CYCLE.focus` is the
     marks map one level away and two things called focus is exactly how §87's
     twins get made.

     NOT THE SAME PERMISSION AS MARKING. The marks are the CEO's and the SMO's
     (§37); the switch is the SMO's alone, classified `setup` beside `naming`
     — a CEO who may mark a measure must not be able to turn the whole feature
     off for the tenant, and a switch anybody could flip would be no switch. */
  function focusOn(w) { return !w || w.focusOff !== true; }

  var ARRANGE_ROLES = ["owner", "custodian", "fnhead"];

  function mayArrange(w, person, target) {
    if (!person || !target) return false;
    if (target === "group") return isOffice(w, person);
    if (isOffice(w, person)) return grantAtPage(w, person, planPageOf(target), target) === "edit";
    var holds = rolesOrFloor(w, person).some(function (r) {
      return ARRANGE_ROLES.indexOf(r.role) > -1 && roleOwns(w, r, target);
    });
    if (!holds) return false;
    /* §117 MOVED THE PLAN PAGE'S GRANT TO THE STRATEGY HALF, WHICH A HOLDER
       READS AT VIEW — so the edit §101 tested here has to stay the holder's
       WORKING grant, the Reporting half, or the split would silently take the
       arrows §101 gave back. Exactly the grant this rule asked before the
       split, under its old name. The page itself must still be reachable:
       strategy at none hides the pane the arrows live on. */
    if (grantAtPage(w, person, planPageOf(target), target) === "none") return false;
    return grantAtPage(w, person, reportPageOf(target), target) === "edit";
  }

  /* ── WHICH STRATEGY PAGE GOVERNS THIS TARGET (§217) ───────────────
     A unit's three strategy pages resolve to `unit_strat`, a function's two
     to `fn_strat` — so this is really the question "whose Strategy column
     decides here", and it must be asked of the TARGET rather than assumed
     from the page the caller happens to be thinking about.

     `lib/authorize.js` assumed. Its plan, foundation and SWOT guards each
     named a UNIT page key outright while the target they were handed can be
     `fn:<key>` — a supporting function that plans in pillars is classified
     through the unit-shaped pass (§59), which is right — so a pillars
     function's plan was authorised against the BUSINESS UNIT column. Both
     directions were wrong at once and it was measured both ways: granting a
     custodian Edit on their own supporting function's Strategy changed
     nothing, and granting Edit on business units silently handed them
     authority over supporting functions' plans. The gap guard two lines
     below had it right the whole time, which is what made it findable.

     ONE PAIRING, NAMED ONCE. `planPageOf` keeps its name and its callers and
     becomes this asked for the plan, or the two answers drift the way §211's
     did. */
  var STRATEGY_PAIR = { u_found: "k_found", u_anal: "k_found", u_plan: "k_proj" };
  function strategyPageOf(target, unitPage) {
    return String(target).indexOf("fn:") === 0
      ? (STRATEGY_PAIR[unitPage] || "k_proj") : unitPage;
  }
  /* A unit arranges its Plan; a supporting function arranges its Projects.
     One place, so the two panes cannot be asked different questions (§53.5). */
  function planPageOf(target) {
    return strategyPageOf(target, "u_plan");
  }
  /* The same pairing for the Reporting half (§117). */
  function reportPageOf(target) {
    return String(target).indexOf("fn:") === 0 ? "k_report" : "u_report";
  }

  /* ── THE PLAN LEAVES AS SLIDES (§117) ────────────────────────────
     Islam, 2026-08-26: "add the access of downloading a presentation for the
     plan for the custodian and the business unit owner through a button in
     the strategy panel — sometimes they need it in slides to update things
     and view it outside to come back with the SMO for refinement."

     WHO: the office, and the roles that HOLD the thing — §101's list, and for
     the same reason: a function has no BU owner, so its holder is its head,
     and a unit and a function are the same product (§53.5). A CEO reaches a
     unit without holding it, so reaching is still not enough (§37).

     A CLIENT-SIDE RULE ONLY, deliberately: the download re-arranges what the
     page already shows this person — no write, no new data — so the server
     has nothing to refuse that the state read has not already gated. The
     strategy page must still be visible: a none grant hides the pane the
     button sits on, and the rule says so too rather than trusting the layout
     (§42, on the screen).

     ── §252.2: THE OFFICE'S ALONE NOW, REVERSING §117'S AUDIENCE ──────
     Islam, giving the feature back after §145.9 hid it from everyone: *"the
     ppt download leave it as an option in the drop down for the smo only."*

     So the two lines that let a role reach it by HOLDING the thing go. The
     grant test above stays, because it is a different question — a page this
     person cannot open is not one they may take away — and it now narrows the
     office rather than a wider list. Recorded as a reversal rather than
     rewritten over (Principle II): §117's reasoning was sound when the button
     sat in the pane a custodian works in, and it is his call that the file
     leaving the platform is the office's act.

     `ARRANGE_ROLES` is untouched: reordering is still the custodian's and the
     owner's (§101). The two questions merely stopped sharing an answer. */
  function mayDownloadPlan(w, person, target) {
    if (!person || !target || target === "group") return false;
    if (grantAtPage(w, person, planPageOf(target), target) === "none") return false;
    return isOffice(w, person);
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

  /* ── WHAT THE OFFICE HAS SET ABOUT THE CHAT (§98) ─────────────────
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
    mail: true,      /* a reply chases somebody who is away */
    /* ── THE ASSISTANT, OFF UNTIL SOMEBODY TURNS IT ON (§104) ──────
       Islam: "I need a switch to turn off AI response and just keep it to the
       SMO inbox." That is the DEFAULT, not a mode — the four settings above
       ship on because they describe a chat that already worked, and this one
       describes a capability that did not. A deployment that upgrades gets
       exactly the chat it had.

       OFF IS ENFORCED ON THE SERVER, in `say`, where the model is simply never
       called. Not by hiding a control: with the assistant off there is nothing
       on screen to hide, so the guard IS the feature (§42, §44, §98.2 — a
       switch that only hides a control is decoration). */
    assistant: false,
    /* Whether a question the assistant could not answer emails somebody, and
       who. Its own switch rather than part of the assistant's, because the
       event is "a conversation is waiting on a person" — which happens whether
       or not the assistant is on, and tying it to the assistant would mean
       turning the assistant off silently turned the emails off too. */
    notify: false,
    /* ── A BOX FROM THE COMPUTER WHEN A REPLY LANDS (§225) ─────────
       Islam: *"we need to have a browser notification approach for the
       platform messages — for the SMO so I get notified when someone
       replies, and for the users when the SMO replies to them."*

       OFF UNTIL SOMEBODY TURNS IT ON, and read the other way round with the
       assistant and the handover email: only an explicit `true`. §104's
       argument — the settings that ship ON describe a chat that already
       worked, and this describes a capability that did not, so a deployment
       that upgrades gets exactly the chat it had. A notification is also an
       interruption, and switching one on for a whole company without being
       asked is the wrong way round.

       NOT NAMED `notify`, WHICH IS TAKEN by the handover email one line
       above (§87: a name is never an identifier, and two settings sharing
       one word is how the wrong switch gets flipped). */
    popup: false,
    rep: "",
    /* ── HOW LONG SOMEBODY COUNTS AS HERE (§169) ───────────────────
       Islam: *"in the chat settings for the away email add my a small option
       to set the number of away minutes to send the email."* It was
       `HERE_MINUTES = 3` in `api/chat.js` and a hardcoded "three minutes" in
       the setting's own tooltip — a number in the source and a second copy of
       it in prose, which is how a sentence comes to describe a threshold
       nobody changed it with (§53.5).

       IT LIVES HERE BECAUSE BOTH SIDES NEED IT: the server decides `here` from
       it and the office's page says what it means, and a client that kept its
       own copy would explain a rule the server does not follow (§44).

       THE FLOOR IS ONE MINUTE AND IT IS WORTH KNOWING WHY THREE IS MARGINAL.
       A shut panel stamps `here_at` every 180 seconds (§98's idle beat), so at
       exactly three minutes somebody sitting at their desk is between beats as
       often as not — recorded rather than quietly changed, because the shipped
       default moving is a decision about when emails go out, not a fix. */
    away: 3
  });
  var CHAT_PROMISE = "Usually answers the same day";
  /* Named once, so the box's own limits and the clamp behind them are the
     same pair (§53.5). Two hours is a working morning; past that "away" has
     stopped meaning away. */
  var CHAT_AWAY_MIN = 1, CHAT_AWAY_MAX = 120;

  function chatCfg(raw) {
    var c = (raw && typeof raw === "object") ? raw : null;
    return {
      on:      !c || c.on      !== false,
      fast:    !c || c.fast    !== false,
      shots:   !c || c.shots   !== false,
      mail:    !c || c.mail    !== false,
      /* THE TWO THAT DEFAULT OFF ARE READ THE OTHER WAY ROUND — only an
         explicit `true` turns them on, so a stale or half-written value can
         never switch the assistant on by accident. The four above read
         "anything but false", because their default is on. */
      assistant: !!(c && c.assistant === true),
      notify:    !!(c && c.notify === true),
      popup:     !!(c && c.popup === true),
      rep:       (c && typeof c.rep === "string") ? c.rep.trim() : "",
      /* A NUMBER, CLAMPED AND NEVER NaN. A stored value out of range, a
         string, or nothing at all all answer the shipped default — this is
         read on every poll and on every reply, so it may not throw and it may
         not return something a comparison quietly treats as false. */
      away:      (function (v) {
                   /* ABSENT IS NOT ZERO. `Number(null)` is 0 and `Number("")`
                      is 0, both finite — so a clamp alone answered ONE MINUTE
                      for every tenant that had never set this, which is the
                      §104.10 trap in a second place. Absence is tested for
                      before the value is read as a number. */
                   if (v === null || v === undefined || v === "") return CHAT_DEFAULTS.away;
                   var n = Math.round(Number(v));
                   if (!isFinite(n)) return CHAT_DEFAULTS.away;
                   return Math.max(CHAT_AWAY_MIN, Math.min(CHAT_AWAY_MAX, n));
                 })(c && c.away),
      promise: (c && typeof c.promise === "string" && c.promise.trim())
                 ? c.promise.trim() : CHAT_PROMISE
    };
  }
  /* ── A UNIT ADDED TO A BARE NUMBER IS A FILL, NOT AN EDIT (§201.2) ────
     Islam, watching a custodian fill gaps: *"he can't fill the unit while he
     needs to fill if missing."* A target reading `30` with no unit is a
     number the plan has not finished saying; the custodian could fill an
     EMPTY target and could not put the unit on one already typed, because
     changing `30` to `30%` amends a non-blank value and amending is the
     office's — the CX refusal's shape (§184), one field over.

     THE RULE IS THE NARROWEST THAT SAYS YES: only `target`/`target3y`, only
     where the stored value carries NO unit at all, and only where the NUMBER
     is byte-identical — anything that also moves the number is still
     authoring. Asked by the screen to draw the picker and by the server to
     accept the save, from ONE function, or the two drift (§42, §185). */
  var UNIT_FIELDS = { target: 1, target3y: 1 };
  function targetParts(s) {
    if (s == null) return { value: "", unit: "" };
    var m = String(s).trim().match(/^(-?[\d.,]+)\s*(.*)$/);
    return m ? { value: m[1], unit: m[2] } : { value: String(s), unit: "" };
  }
  function unitAddedOnly(field, was, now) {
    if (!UNIT_FIELDS[field]) return false;
    var a = targetParts(was), b = targetParts(now);
    return !!a.value && a.unit === "" && b.unit !== "" && a.value === b.value;
  }

  /* How often an open panel asks, in milliseconds. Named here rather than in
     the client, so the setting and the number it means cannot drift apart —
     and so the check can assert the pair. */
  function chatBeat(raw) { return chatCfg(raw).fast ? 4000 : 15000; }

  /* ── The knowledge base's tenant overlay (§140) ────────────────────
     The office can rewrite a shipped answer and add its own (GROUP.kb →
     org.extra: { ov: { id: {q,a} }, add: [ {id,g,q,a} ] }). THE PRECEDENCE
     LIVES HERE AND ONLY HERE, because the page a person reads and the corpus
     the assistant answers from are the same words (§103) — two readers of the
     shape are fine, two definitions of which wording wins are how they start
     disagreeing. A malformed entry answers null/[], never throws: this runs
     on every page paint and inside every assistant call. */
  function kbTenant(t) { return (t && typeof t === "object") ? t : {}; }
  function kbLook(t, id) {
    var o = kbTenant(t).ov;
    var e = o && typeof o === "object" ? o[id] : null;
    return (e && typeof e === "object" && (e.q || e.a || e.w)) ? e : null;
  }

  /* ── WHO AN ANSWER IS FOR (§161, extending §160's two into three) ──
     Islam, asked whether the questions file may change the audience: "on
     every question and the question might be seen by only the smo or by
     other audience or both."

     THE OLD TWO MAP STRAIGHT ON, which is the whole back-compat argument:
     `office` already meant the office alone, and `everyone` already meant
     everybody INCLUDING the office, so nothing stored moves and an absent
     value still reads as `everyone` (§30.2). What is new is `others` —
     everybody EXCEPT the office — and it is what makes a two-answer pair
     deterministic: §160 handed the office both halves and told the model to
     pick, and now each side is served exactly one.

     THE AUDIENCE GOVERNS THE ASSISTANT AND NEVER THE PAGE. The Knowledge
     base page is the office's (§119.4), so an answer marked `others` shown
     by this rule on the page would be readable by nobody and therefore
     editable by nobody — §61's trap. The page shows the office everything
     with the audience MARKED on it; only `kbSees()` below is consulted when
     the corpus is assembled. */
  var KB_AUDIENCES = ["office", "others", "everyone"];
  var KB_AUDIENCE_LABEL = {
    office:   "Strategy Office only",
    others:   "Everyone else",
    everyone: "Both"
  };
  /* The word, whatever arrives: an unknown or absent value is `everyone`,
     which is the shipped default and the safe direction for a READING
     permission — a typo must not silently hide an answer from the people it
     was written for. */
  function kbAudienceWord(w) {
    return KB_AUDIENCES.indexOf(String(w || "")) > -1 ? String(w) : "everyone";
  }
  /* This tenant's audience for a question, or the shipped one. Read through
     kbLook so the override lives with the wording it belongs to. */
  function kbAudience(t, id, shipped) {
    var o = kbLook(t, id);
    return kbAudienceWord((o && o.w) || shipped);
  }
  /* Is this answer served to this asker? The ONE question the corpus filter
     asks, so the client, the server and any check cannot answer it
     differently (§42). */
  /* ── WHAT SEPARATES TWO PARAGRAPHS (§161.3) ──────────────────────
     The shipped answers use `|`, because recipes.js is a source file and a
     separator that cannot appear in prose costs one line to split (§103).
     The PEN's own lede has said "a blank line is a paragraph break" since
     §140 and the renderer only ever split on `|` — so an office rewrite
     typed as two paragraphs rendered as one run-on, on the page AND in the
     answer the assistant gives. A promise the product made and did not keep.

     Both are read now: `|` for the shipped text, a blank line for anything
     typed into a textarea or a spreadsheet cell, where `|` is not a thing
     anybody would reach for. ONE reader, here, so the page, the corpus and
     the file cannot disagree about where a paragraph ends (§53.5). */
  function kbParas(t) {
    return String(t == null ? "" : t)
      .split(/\s*\|\s*|\n[ \t]*\n\s*/)
      .map(function (x) { return x.trim(); })
      .filter(function (x) { return x.length > 0; });
  }

  /* IS THIS THE SAME PROSE? Asked by the writer (does this override still
     say what the platform ships, §50.6) and by the questions file's reader
     (has this row changed at all). TWO COPIES OF THAT QUESTION IS HOW THE
     REVIEW COMES TO SAY "reworded" WHILE THE WRITER STORES NOTHING (§53.5),
     which is a disagreement nobody would see until a client's edit vanished.
     One function, so a change to what counts as a paragraph moves both. */
  function kbSame(a, b) { return kbParas(a).join("|") === kbParas(b).join("|"); }

  /* ── A TITLE IS ONE LINE, AND THE PLATFORM MUST BE ABLE TO SAY SO (§260) ──
     Islam, from a client's plan with the pen open: a tactic's name box 643px
     tall holding one line of text, the description and the outcome the same.

     NOTHING WAS WRONG WITH THE BOX. §189 sizes a growing box to what is IN
     it, and what was in it was blank lines — thirty of them on one row.
     Invisible everywhere else: the read table is 42px, because HTML collapses
     a line break, and the deck and both workbooks print these on one line
     too. So the value could carry them for weeks and only the pen would ever
     show it.

     WHERE THEY CAME FROM: Enter, which added one per press and did nothing
     else visible until §229 stopped it — so somebody expecting "save" or
     "next" presses it again, and again — and a PASTE, which §229 does not
     reach and which was measured storing "Line one\nLine two\n\n\n" verbatim.

     SO THE RULE IS HERE, not in the box: what may live in a one-line field is
     a fact about the VALUE, and three places need the same answer (§42) — the
     builder that draws the box, the commit that stores what was typed, and
     the one-off heal of what a tenant already holds.

     IT KEEPS EVERY WORD. A run of whitespace that contains a line break
     becomes ONE SPACE, and the ends are trimmed: two paragraphs become one
     sentence-and-a-half, blank lines vanish, and no character of anybody's
     text is lost. Ordinary spaces are left exactly as typed (§96.2) — this
     is about line breaks, not about tidying somebody's spacing.

     IT IS NOT FOR EVERY FIELD. A capability's definition, a reporter's note,
     an aspiration and an end-in-mind are PARAGRAPHS and keep their breaks;
     they are drawn as rows-2 areas, and §229 already leaves Enter alone
     there for the same reason. */
  function oneLine(v) {
    return String(v == null ? "" : v).replace(/[ \t]*[\r\n]+[ \t\r\n]*/g, " ").trim();
  }
  /* The plan fields that are one line of prose, by row kind — the list the
     heal walks. It is the same set `textOr()` draws, and the reason each one
     is on it is that every surface already prints it on one line: a name, the
     sentence under a tactic, what an outcome is, a project's brief, what a
     milestone covers. */
  var ONE_LINE_FIELDS = {
    ko:        ["name"],
    pillar:    ["name"],
    measure:   ["name"],
    tactic:    ["name", "description", "outcome"],
    project:   ["name", "brief"],
    dx:        ["name"],
    milestone: ["name", "covers"]
  };

  function kbSees(who, isOffice) {
    var w = kbAudienceWord(who);
    return isOffice ? w !== "others" : w !== "office";
  }
  function kbAllAdds(t) {
    var a = kbTenant(t).add;
    if (!Array.isArray(a)) return [];
    return a.filter(function (x) {
      return x && typeof x === "object" && x.id && (x.q || x.a);
    });
  }
  function kbAdds(t, g) {
    return kbAllAdds(t).filter(function (x) { return x.g === g; });
  }
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
  /* ══ WHAT SOMEBODY IS CALLED, SHORT (§130.7) ═══════════════════════════
     Moved here from config-data.js, where it had always lived, because the
     PLAN now stores what the register's Name column shows (§130.7) and
     namedOn() below has to be able to recognise it. Two copies of a name rule
     is the drift lib/rules.js exists to prevent (§42) — the browser keeps thin
     wrappers that call these.

     A PARTICLE IS NOT A NAME. "Abd El Moniem Mohamed" is two names, not four:
     the list is the particles this register actually carries plus the European
     ones a client could arrive with, and a word not on it is a name.
     ══════════════════════════════════════════════════════════════════════ */
  var NAME_PARTICLES = ["abd", "abdel", "abd-el", "el", "al", "abu", "abou",
    "bin", "ben", "ibn", "bint", "van", "von", "de", "del", "della", "der",
    "den", "di", "da", "dos", "du", "la", "le", "st", "st.", "mac", "mc"];
  var KNOWN_NAME_WORDS = 2;

  function nameWords(name, n) {
    var parts = String(name == null ? "" : name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    var out = [], names = 0, i = 0;
    while (i < parts.length && names < n) {
      /* Take the run of particles, then the word they belong to. A name ENDING
         in a particle (a truncated row) still terminates, or this loops. */
      var start = i;
      while (i < parts.length &&
             NAME_PARTICLES.indexOf(parts[i].toLowerCase().replace(/[^a-z.-]/g, "")) > -1) i++;
      if (i < parts.length) i++;
      else if (i === start) break;
      names++;
      out = parts.slice(0, i);
    }
    return out.join(" ");
  }
  function knownGuess(name) { return nameWords(name, KNOWN_NAME_WORDS); }

  /* EVERY LEADING RUN OF SOMEBODY'S NAMES, from the register's own short form
     up to the whole thing — which is exactly the set of labels the register
     can show for them: the guess, each lengthening displayNames() applies to
     separate a clashing pair (§81.1), and the full name itself.

     IT NEVER YIELDS ONE NAME. KNOWN_NAME_WORDS is the floor, so "Karim" on a
     plan still matches nobody — a bare first name would hand reporting rights
     to whoever happens to share it, which is wider than the fault this fixes.

     THE ONE OVER-MATCH IS RECORDED RATHER THAN CHASED: two people whose first
     two names are identical both answer to the short form. The picker never
     writes it (displayNames lengthens both), so it can only arrive from a plan
     uploaded before this or typed by hand, where today it matches NOBODY. */
  function nameRuns(name) {
    var whole = String(name == null ? "" : name).trim();
    if (!whole) return [];
    var out = [], seen = {}, n = KNOWN_NAME_WORDS;
    for (; n <= 12; n++) {
      var run = nameWords(whole, n);
      if (!run || seen[run.toLowerCase()]) continue;
      seen[run.toLowerCase()] = 1;
      out.push(run);
      if (run.length >= whole.length) break;
    }
    return out;
  }

  /* ── THE FIRST NAME, AND IT IS ONE NAME KEPT WHOLE (spec 022) ──────
     What an email greets somebody by. `nameWords(…, 1)` is the SAME reader
     the register's short-name guess uses, so a compound first name arrives
     whole — "Abd El Moniem", never "Abd", which is the case Islam asked about
     twice and the one this would otherwise get wrong on his own register.

     A TYPED SHORT NAME WINS. `known` is the SMO's correction to the guess
     (§93.8); somebody who has been written down as "Mo" is greeted "Mo".

     IT MAY RETURN "". A row whose name cannot produce one is not an error
     here — the caller drops the greeting line rather than writing "Dear ,". */
  function firstName(person) {
    if (!person) return "";
    var typed = String(person.known == null ? "" : person.known).trim();
    return nameWords(typed || person.name, 1);
  }

  /* ── THE GREETING IS FILLED IN ON THE SERVER (spec 022) ────────────
     ONE BUILDER STILL BUILDS THE EMAIL (§72.3): the page builds the HTML and
     posts it, and the server sends it. But a greeting names the RECEIVER, so
     the emails stop being identical — and who the receivers are is the
     server's answer, never the browser's (§74.2). So the builder leaves a
     marked region and the server fills it once per recipient.

     THE REGION IS DELIMITED, NOT JUST TOKENISED, for two reasons. A sender
     who happens to type the token in their own message can never have it
     substituted, because nothing outside the region is touched. And an empty
     name removes the WHOLE greeting paragraph rather than leaving "Dear ,",
     which is the one string this feature must never produce.

     HTML COMMENTS, so a region that somehow survives unfilled renders as
     nothing rather than as markup somebody reads.

     Declared here because BOTH SIDES need the same three strings and a second
     copy of a contract drifts in silence. mail.js writes them, api/mail.js
     reads them. */
  var GREET_OPEN = "<!--smp-greet-->";
  var GREET_CLOSE = "<!--/smp-greet-->";
  var GREET_NAME = "<!--smp-name-->";

  function greetEsc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* html → html, for ONE recipient. An empty or missing name drops the region
     entirely. Only the FIRST region is touched: the greeting is the first
     thing in the message, and a message with no region comes back unchanged,
     which is what makes "the switch is off" cost nothing. */
  function greetFill(html, name) {
    var s = String(html == null ? "" : html);
    var a = s.indexOf(GREET_OPEN);
    if (a < 0) return s;
    var b = s.indexOf(GREET_CLOSE, a);
    if (b < 0) return s;
    var end = b + GREET_CLOSE.length;
    var who = String(name == null ? "" : name).trim();
    if (!who) return s.slice(0, a) + s.slice(end);
    var region = s.slice(a + GREET_OPEN.length, b).split(GREET_NAME).join(greetEsc(who));
    return s.slice(0, a) + region + s.slice(end);
  }

  /* ── A LINK IN AN EMAIL HAS NOTHING TO BE RELATIVE TO (spec 027) ────────
     Islam, on the button in a message he sent himself: macOS "The application
     can't be opened. -50". The link was `smp-orpin-tau.vercel.app` — what he
     typed, taken exactly as typed and sent. A BROWSER forgives a missing
     scheme because it has an address bar to guess with; an EMAIL has no base
     document, so the mail client hands the raw string to the operating system,
     which looks for a file of that name and refuses. The button is dead for
     every recipient, and nothing on the way out said so.

     ONE FUNCTION, ASKED BY BOTH SIDES, which is why it is here rather than in
     mail.js: the composer completes what somebody typed, and api/mail.js
     refuses what arrives — and a screen that tidies a value the server judges
     by a different rule is §42's drift with an inbox on the end of it.

     COMPLETING IS NOT GUESSING. `https://` is added only where what is there
     is already a host: a dot, no space, and no scheme of its own. Anything
     else is REFUSED rather than decorated, because inventing an address is how
     a message goes out pointing somewhere nobody meant.

     AND ONLY http(s) SURVIVE. `javascript:` and `data:` are refused outright —
     harmless in a mail client, and this same string is rendered into the
     platform's own live preview, which is a page (§43.6). A scheme the product
     does not send is not a scheme it should carry. */
  function webUrl(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s) return "";
    /* A scheme it already has decides it: http and https pass, everything
       else — mailto, javascript, data, file — is not a link to the platform. */
    var m = s.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (m) return /^https?$/i.test(m[1]) ? s : "";
    /* Protocol-relative, which an email cannot resolve either. */
    if (s.indexOf("//") === 0) return "https:" + s;
    /* A host, and nothing that could be a stray sentence: no whitespace, at
       least one dot, and something on each side of it. A bare path ("/plan")
       fails here on purpose — in an email it points at nothing. */
    if (!/\s/.test(s) && /^[^\s\/?#]+\.[^\s\/?#]+/.test(s)) return "https://" + s;
    return "";
  }

  /* Did completing it change what was typed? The composer says so rather than
     silently rewriting somebody's field — and the two questions are separate
     because "this cannot be a link" and "this needed https://" send a person
     to two different places. */
  function webUrlFixed(raw) {
    var out = webUrl(raw);
    return !!out && out !== String(raw == null ? "" : raw).trim();
  }

  /* ── HIDDEN FROM THE PRESENTATION (§233) ──────────────────────────────
     A row the office keeps and does not present: left out of the deck and
     NOT counted in any score, on every surface at once — Islam's decision,
     2026-09-01. The mark is `row.hide === true`, riding each row's `extra`
     JSONB (§177's road, no migration), stored as an ABSENCE (§50.6): a row
     never hidden and one hidden-and-shown-again are byte-identical.

     ONE PREDICATE, because the screen's scores, the deck and the counts must
     answer together (§42, §53.5) — a score that includes a row the slide
     does not show is a number nobody can defend. `shown()` is the list-side
     spelling of the same answer, for the readers that draw or average. */
  function isHidden(row) { return !!(row && row.hide === true); }
  function shown(list) {
    return (list || []).filter(function (r) { return !isHidden(r); });
  }

  /* ── A WHOLE SLIDE THE OFFICE DOES NOT PRESENT (§256) ─────────────────
     Islam: *"allow the smo to hide presentation slides of any unit or
     function."* §246 recorded this as the feature it had not built and named
     the question inside it — which slides may be hidden, and whether hiding
     one hides what it counts. Both answers are his, taken before anything was
     drawn.

     AND THE ANSWER IS THE OPPOSITE OF §233's, WHICH IS WHY THEY SIT
     TOGETHER. That one hides a ROW and takes it out of every score, on every
     surface; this hides a generated SLIDE and takes it out of NOTHING. The
     figures on a hidden slide are still reported, still asked for, still
     scored and still on the page — it is a decision about a projector.
     Two switches, two clearly different jobs: one that did both would mean
     tidying a deck before a board meeting silently moved a unit's figures.

     A SLIDE IS NAMED BY ITS ANCHOR, NEVER BY ITS POSITION (§48, §236.3).
     Every generated slide already carries one — it is what the picture
     placer is built from — so the list of nameable slides IS the deck and
     the two cannot drift. A stored number would hide a different slide the
     day a pillar is added upstream.

     IT LASTS, so it does not live in `REVIEW`, which is cleared with the
     cycle (§50, §115): the shape of a subject's deck is not this quarter's
     evidence. It rides `units[k].extra` / `functions[k].extra`, which both
     already carry (§52, §213) — so no migration — and is stored as an
     ABSENCE (§50.6): never hidden and hidden-then-shown-again are the same
     bytes rather than two states nothing distinguishes.

     THE FIELD IS NAMED ONCE. `lib/authorize.js` classifies it by this
     constant rather than by a literal of its own, because a field spelled in
     one place and not the other is §234's fault waiting to be reborn. */
  var HIDE_SLIDES = "hideSlides";
  /* Frozen and SHARED: every subject with nothing hidden is handed this same
     array, so one careless push would hide a slide on all of them. Reading
     never creates the field (§42) — the writer does, and deletes it again. */
  var NO_SLIDES = Object.freeze([]);
  function hiddenSlides(subject) {
    var v = subject && subject[HIDE_SLIDES];
    return Array.isArray(v) ? v : NO_SLIDES;
  }
  function slideHidden(subject, anchor) {
    return !!anchor && hiddenSlides(subject).indexOf(anchor) >= 0;
  }

  function namedOn(row, person) {
    if (!row || !person) return false;
    /* THE NAME THE REGISTER SHOWS COUNTS TOO (§130.7). The plan's owner and
       collaborators are picked from the register's **Name** column now, not
       from the full legal name — so matching only `person.name` would put the
       platform back where §130.1 found it: 32 of 78 tactics owned by somebody
       it could not recognise. `known` is the typed short name; nameRuns() is
       every form the register can derive. */
    var me = [String(person.key || ""), String(person.name || ""),
              String(person.known || "")]
      .concat(nameRuns(person.name))
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(function (s) { return !!s; });
    /* §218 REVERSES §145.10 AT ISLAM'S DIRECTION. That section made a
       filled-but-unconfirmed name silent here, because being named is what
       lets somebody report the line — so the office's tick was the thing
       standing between filling in a name and gaining a reporting right.
       With the tick gone the skip has nothing to wait for, and leaving it
       would make an owner that the page plainly shows count for nothing.

       THE COST IS REAL AND WAS STATED BEFORE IT WAS ACCEPTED: a person who
       may fill gaps can now write their own name into an empty Owner and
       report that line. Islam: *"the custodian is already choosing from
       lists and he is responsible."* */
    var hits = [row.owner].concat(
      Array.isArray(row.collaborators) ? row.collaborators : []);
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

  /* §147: Is this person named on any of this function's projects? The
     function-side half of namedInUnit(), asked through the same namedOn() so
     "named on a project" means one thing in the platform. The unit of the
     naming is the PROJECT — being its owner (or, should projects ever carry
     them, a collaborator) speaks for every row the project holds, which is
     what "a custodian per project" means. Capability projects only: a pillars
     function's plan is classified with the units and has no per-project
     owner; its floor is deliberately not derived here (flagged in §147.5). */
  function capsOfFn(w, fnKey) {
    return (w.capabilities || []).filter(function (c) { return c && c.fn === fnKey; });
  }
  function namedInFn(w, p, fnKey) {
    if (!p || !fnKey) return false;
    /* Named ANYWHERE in the function's projects (§147.8): the project's own
       rows (owner, collaborators), its stakeholder list, or a milestone's
       Owner — and since §227 a milestone's COLLABORATORS, because the row
       travels whole through namedOn(): being named on the milestone is what
       lets somebody report it, exactly the meaning the word carries on a
       tactic. A project's owner also matches here and it does not matter —
       they derive powner above, so the floor is never reached for them. */
    return capsOfFn(w, fnKey).some(function (c) {
      return (c.projects || []).some(function (pr) {
        return namedOn(pr, p) ||
               namedOn({ collaborators: pr.stakeholders }, p) ||
               (pr.milestones || []).some(function (m) {
                 return namedOn(m, p);
               });
      });
    });
  }
  /* Which project a reporting row belongs to, read from the world the caller
     already holds — the server asks it of the STORED state (§42.2), the
     screen of its own. A capability's key objectives belong to no project, so
     an id found only there answers null: for somebody who speaks only for
     their own project, no project means no. */
  function capProjectOf(w, fnKey, id) {
    var hit = null;
    capsOfFn(w, fnKey).forEach(function (c) {
      (c.projects || []).forEach(function (pr) {
        if (hit) return;
        var holds = (pr.deliverables || []).concat(pr.outcomes || [], pr.milestones || [])
          .some(function (x) { return x && x.id === id; });
        if (holds) hit = pr;
      });
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
  /* §147.7 ADDS THE TWO NAMED OWNERS. Each speaks for a bounded piece — a
     project, a pillar, the rows that name them — and never for the whole
     subject: no Submit, no cycle note, no picture slides, and every reporting
     save is narrowed to their reach by mayReportRow() below. Adding a key
     here is what wires all of that at once, which is exactly the property
     §55 recorded this list for. */
  var OWN_LINES_ONLY = ["contrib", NO_ROLE, "powner", "plowner"];

  /* Which of a person's roles is what lets them edit here. The floor rule
     applies when the floor is ALL they have. */
  /* ONE WALK, ASKED FOR A STATE (§177). `editingRoles` and `fillingRoles`
     differ by one string, and two copies of "which of this person's roles
     answers `x` here" is how the edit path and the fill path come to disagree
     about who a bounded role is (§53.5). */
  function rolesAtState(w, person, area, target, state) {
    return rolesOrFloor(w, person).filter(function (r) {
      if (!companyAllows(w, r, target)) return false;
      return grantFor(w, r.role, areaFor(area, w, r, target)) === state;
    }).map(function (r) { return r.role; });
  }
  function editingRoles(w, person, area, target) {
    return rolesAtState(w, person, area, target, "edit");
  }
  /* The roles that grant FILL here. Never the max across roles the way
     grantIn() answers -- mayFillPage() has already asked that question, and
     this one is about WHICH role let them in, because that is what decides
     how far they reach. */
  function fillingRoles(w, person, area, target) {
    return rolesAtState(w, person, area, target, "fill");
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

  /* ── WHICH ROWS A BOUNDED ROLE REACHES (§147.7) ───────────────────
     One rule for both sides and every bounded role, because three copies of
     "is this row theirs" is how the screen and the server come to disagree
     (§42). `ctx` carries the row and what it sits inside — whichever of
     these the calling side has:

       row          the row itself; namedOn() reads owner + collaborators
       pillarOwner  the Owner of the pillar the row sits under (unit side —
                    also what §55's measure rule has always leaned on)
       project      the project the row sits inside (function side)

     · a PROJECT OWNER reaches every row of a project whose Owner names them;
     · a PILLAR OWNER reaches every row of a pillar whose Owner names them;
     · a CONTRIBUTOR (and the floor) reaches the rows that NAME them — the
       row's own owner or collaborators, or the project's stakeholder and
       collaborator lists (§147.8: "stakeholders are contributors"). */
  function boundedReach(person, roleKey, ctx) {
    ctx = ctx || {};
    if (roleKey === "powner")
      return !!ctx.project && namedOn({ owner: ctx.project.owner }, person);
    if (roleKey === "plowner")
      return ctx.pillarOwner != null && ctx.pillarOwner !== "" &&
             namedOn({ owner: ctx.pillarOwner }, person);
    if (ctx.row && namedOn(ctx.row, person)) return true;
    return !!ctx.project &&
           (namedOn({ collaborators: ctx.project.stakeholders }, person) ||
            namedOn({ collaborators: ctx.project.collaborators }, person));
  }
  /* May this person report THIS row? True outright when any unbounded role
     grants edit here; a person editing only through bounded roles reaches the
     union of what those roles reach. The one question the unit's pane, the
     function's pane and the authoriser all ask (§42). */
  function mayReportRow(w, person, area, target, ctx) {
    var via = editingRoles(w, person, area, target);
    if (!via.length) return false;
    if (via.some(function (r) { return OWN_LINES_ONLY.indexOf(r) === -1; })) return true;
    return via.some(function (r) { return boundedReach(person, r, ctx); });
  }
  /* ── AND A BOUNDED ROLE FILLS ONLY WHAT IT HOLDS (§177) ──────────
     mayReportRow()'s mirror, and for the same reason. Islam, on a project
     owner given Fill gaps over a supporting function: "the fill grant should
     be for his project only he is not a cutodian." The grant is per PAGE --
     there is no per-project cell and there should not be one -- so the
     narrowing is a rule, exactly as §147.7 narrowed reporting.

     APPLIED TO A PILLAR OWNER TOO, on the unit side, unasked and deliberately:
     the sentence is about a bounded role rather than about projects, and a
     unit and a function are the same product (§53.5). A gap that sits inside
     NO row -- a unit's aspiration, its key objectives, a capability's
     objectives -- falls out closed on its own, because boundedReach() answers
     false with no project and no pillar to name them. */
  function mayFillRow(w, person, pageKey, target, ctx) {
    if (!mayFillPage(w, person, pageKey, target)) return false;
    var via = fillingRoles(w, person, PAGE_AREA[pageKey], target);
    if (!via.length) return false;
    if (via.some(function (r) { return OWN_LINES_ONLY.indexOf(r) === -1; })) return true;
    return via.some(function (r) { return boundedReach(person, r, ctx); });
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
    OWNS_EVERY_PLACE: OWNS_EVERY_PLACE, ownsEveryPlace: ownsEveryPlace,
    grantIn: grantIn, grantAtPage: grantAtPage, isSMO: isSMO, NO_ROLE: NO_ROLE,
    mayEditAccess: mayEditAccess, mayDestroy: mayDestroy,
    SEAT_ROLES: SEAT_ROLES, isSeatRole: isSeatRole,
    seatOutOfPlace: seatOutOfPlace,
    isOffice: isOffice, isOfficeRole: isOfficeRole, isSuperRole: isSuperRole,
    mayIssuePasswordTo: mayIssuePasswordTo,
    STRATEGY_PAGES: STRATEGY_PAGES, isStrategyPage: isStrategyPage,
    ARRANGE_ROLES: ARRANGE_ROLES, mayArrange: mayArrange, planPageOf: planPageOf, strategyPageOf: strategyPageOf,
    reportPageOf: reportPageOf, mayDownloadPlan: mayDownloadPlan,
    focusOn: focusOn,
    mayAuthorPage: mayAuthorPage,
    GAP_FIELDS: GAP_FIELDS, GAP_FILLABLE: GAP_FILLABLE,
    isGapField: isGapField,
    gapBlank: gapBlank, quartersBlank: quartersBlank,
    WHEN_MONTHS: WHEN_MONTHS, whenMonths: whenMonths, whenReadable: whenReadable,
    GAP_WHEN: GAP_WHEN, gapWhenField: gapWhenField,
    GAP_NUM: GAP_NUM, gapNumField: gapNumField,
    targetHasNumber: targetHasNumber,
    YN_UNIT: YN_UNIT, isYesNo: isYesNo, ynUnitOf: ynUnitOf,
    ynAnswer: ynAnswer, ynScore: ynScore,
    MONTH_NAMES: MONTH_NAMES, monthSet: monthSet, monthlySet: monthlySet,
    monthlyStarted: monthlyStarted, monthlyPlan: monthlyPlan,
    monthlyCompile: monthlyCompile, monthlyInForce: monthlyInForce,
    monthlyDue: monthlyDue, monthlyAnnual: monthlyAnnual,
    actingFor: actingFor,
    gapEmptyValue: gapEmptyValue, gapEmpty: gapEmpty,
    pendOf: pendOf, mayFillPage: mayFillPage,
    FILL_PAGES: FILL_PAGES, gapMissing: gapMissing,
    namedOn: namedOn, namedInUnit: namedInUnit,
    namedInFn: namedInFn, capProjectOf: capProjectOf,
    NAME_PARTICLES: NAME_PARTICLES, KNOWN_NAME_WORDS: KNOWN_NAME_WORDS,
    nameWords: nameWords, knownGuess: knownGuess, nameRuns: nameRuns,
    firstName: firstName,
    GREET_OPEN: GREET_OPEN, GREET_CLOSE: GREET_CLOSE, GREET_NAME: GREET_NAME,
    webUrl: webUrl, webUrlFixed: webUrlFixed,
    isHidden: isHidden, shown: shown,
    HIDE_SLIDES: HIDE_SLIDES, hiddenSlides: hiddenSlides, slideHidden: slideHidden,
    greetFill: greetFill,
    editingRoles: editingRoles, onlyVia: onlyVia, rolesOrFloor: rolesOrFloor,
    OWN_LINES_ONLY: OWN_LINES_ONLY, onlyOwnLines: onlyOwnLines,
    isOwnLinesRole: isOwnLinesRole,
    boundedReach: boundedReach, mayReportRow: mayReportRow,
    fillingRoles: fillingRoles, mayFillRow: mayFillRow,
    isSourced: isSourced, sourceRows: sourceRows, sourcesFor: sourcesFor,
    ownsSources: ownsSources, rowsOfSet: rowsOfSet, rowById: rowById,
    setsOf: setsOf, setById: setById, mayPickInto: mayPickInto,
    pickableSets: pickableSets, assigneeOf: assigneeOf, sourceLabel: sourceLabel,
    claimsOf: claimsOf, openClaims: openClaims, openClaimFor: openClaimFor,
    namingOn: namingOn, mayName: mayName,
    CHAT_DEFAULTS: CHAT_DEFAULTS, CHAT_PROMISE: CHAT_PROMISE,
    CHAT_AWAY_MIN: CHAT_AWAY_MIN, CHAT_AWAY_MAX: CHAT_AWAY_MAX,
    chatCfg: chatCfg, chatBeat: chatBeat,
    targetParts: targetParts, unitAddedOnly: unitAddedOnly,
    kbLook: kbLook, kbAdds: kbAdds, kbAllAdds: kbAllAdds,
    KB_AUDIENCES: KB_AUDIENCES, KB_AUDIENCE_LABEL: KB_AUDIENCE_LABEL,
    kbAudienceWord: kbAudienceWord, kbAudience: kbAudience, kbSees: kbSees,
    kbParas: kbParas, kbSame: kbSame,
    oneLine: oneLine, ONE_LINE_FIELDS: ONE_LINE_FIELDS,
    PICK_SMO: PICK_SMO, PICK_OWNER: PICK_OWNER
  };
});
