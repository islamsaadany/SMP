/* THE FROZEN READERS, RUN OUTSIDE A BROWSER (spec 043 D4, §53.5).

   The welcome screen decides what is waiting on somebody by asking the
   product's own readers — reportPending, subjectReported, submitBlockers,
   seesGaps, gapMap, cycleTotals, attentionRows, placeLabel, personRoles —
   and those live in the frozen browser sources, not in lib/rules.cjs. Writing
   a second copy of any of them for the landing page is the drift §53.5 exists
   to stop: the first day either side changes, the landing says one thing and
   the page behind it another.

   So the sources are evaluated HERE, in a vm context with no document, the
   way scripts/extract-state.js and extract-kb.js have done since §103.4: one
   context per process, loaded once (≈40ms), then per request the graph is
   hydrated onto its globals exactly as sync.js's hydrate() does and the
   readers are asked in ONE synchronous call. Synchronous is the safety
   argument — the context is shared, and a request that awaited mid-read
   would read another tenant's graph.

   The four files are the four the readers span (group-data, config-data,
   group-render, config-render — esc() and syncWeights() live in the render
   files). Nothing here writes: the graph is the request's own copy from
   readState(), and the context's globals are overwritten on the next call. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = path.join(process.cwd(), "..", "SMP-Project-Folder", "src");
const RULES = path.join(process.cwd(), "lib", "rules.cjs");
/* builder.js joins the four for §322: `addFunction` is declared there while
   `addBusinessUnit` and `addCompany` are in config-data — three minters in
   two files, and the set-up flow must call the PRODUCT'S, never a second
   copy of what a unit or a function is shaped like (§53.5). Proved to
   evaluate in this context before it was relied on, not assumed. */
const FILES = ["group-data.js", "config-data.js", "group-render.js", "config-render.js",
               "builder.js"];

/* sync.js's hydrate(), line for line, plus the landing's own builder — ES5,
   because it runs in the frozen sources' world. */
const GLUE = String.raw`
function __smpHydrate(state) {
  GROUP = state.group; UNIT_KEYS = state.unitKeys; UNITS = state.units;
  FUNCTION_KEYS = state.functionKeys; FUNCTIONS = state.functions;
  if (typeof fnPruneNulls === "function") (FUNCTION_KEYS || []).forEach(function (k) { fnPruneNulls(FUNCTIONS[k]); });
  COMPANY_KEYS = state.companyKeys || []; COMPANIES = state.companies || {};
  PEOPLE = state.people; UNIT_ROLES = state.unitRoles; ACCESS = state.access;
  LABELS.entries = state.labels; BANDS.bands = state.bands;
  KO_WEIGHTS = state.koWeights || {}; CYCLE = state.cycle; REVIEW = state.review;
  HISTORY = state.history; ARCHIVES = state.archives || [];
  PRIOR_CYCLE = state.priorCycle || { factors: [] };
  UNIT_KEYS.forEach(function (k) { UNITS[k].ukey = k; });
  syncWeights();
}
/* welcome.js's ownTargets(): where the roles are held plus where the register
   sits them — units and functions only (§59, §68). */
function __smpOwnTargets(row, rs) {
  var out = [];
  function add(t) {
    if (!t || t === "group" || String(t).indexOf("co:") === 0) return;
    var real = String(t).indexOf("fn:") === 0 ? !!FUNCTIONS[String(t).slice(3)] : !!UNITS[t];
    if (real && out.indexOf(t) < 0) out.push(t);
  }
  rs.forEach(function (r) { add(r.at); });
  try { add(personAt(row)); } catch (e) {}
  return out;
}
/* THE RAIL'S OWN WORD FOR A DESTINATION (attnDestLabel) asks setupDefs(),
   which lives in shell.html and is not loaded here. The two rows the
   attention list can produce without a server-fed count (claims, nocust)
   name these two pages; the words are the rail's (§108.3) and go the day
   the Setup group carries setupDefs across. */
var __smpSetupWords = { cycle: "Reporting cycle", people: "People" };
function __smpLanding(state, personKey) {
  __smpHydrate(state);
  var row = null;
  for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].key === personKey) { row = PEOPLE[i]; break; }
  var org = (GROUP && GROUP.org) || "";
  var initials = org.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
  if (!row) return { known: false, org: org, initials: initials };
  VIEWER = personKey;
  var rs = personRoles(row) || [];
  var office = rs.some(function (r) { return SMPRules.isOfficeRole(r.role); });
  var targets = __smpOwnTargets(row, rs);
  var name = "";
  try { name = SMPRules.firstName(row); } catch (e) {}
  if (!name) name = String(row.name || "").split(/\s+/)[0] || "";
  var chips = rs.slice(0, 3).map(function (r) {
    var where = ""; try { where = roleWhereLabel(r.at); } catch (e) { where = String(r.at || ""); }
    return { role: roleName(r.role), where: where };
  });
  if (!chips.length) { var at0 = null; try { at0 = personAt(row); } catch (e) {} if (at0) chips.push({ role: placeLabel(at0), where: "" }); }
  var open = !!(REVIEW && REVIEW.state === "open");
  var home = office ? "group" : (targets[0] || null);
  TARGET = home || "group";
  var cycle = null;
  try {
    if (REVIEW && grant("c_cycle") !== "none") {
      var t = cycleTotals();
      cycle = { name: REVIEW.name || "", open: open, done: t.done, total: t.total, sub: t.sub, progress: t.progress, none: t.none, meta: cycleMeta() };
    }
  } catch (e) { cycle = null; }
  var acts = [];
  if (office) {
    try {
      attentionRows().forEach(function (r) {
        if (r.k === "chat") return;
        acts.push({ title: r.text, sub: [], btn: "Open " + (__smpSetupWords[r.dest] || "Setup"), cta: false, go: { setup: r.dest } });
      });
    } catch (e) {}
  } else {
    targets.forEach(function (t) {
      var pending = false; try { pending = reportPending(t); } catch (e) {}
      if (!pending) return;
      var parts = [];
      try {
        var c = subjectReported(t), left = Math.max(0, (c.total | 0) - (c.done | 0));
        parts.push(left ? { text: plural(left, "figure") + " still open", kind: "em" } : { text: "Every figure is entered", kind: "plain" });
      } catch (e) {}
      try {
        var b = submitBlockers(t);
        if (b.notes.length) parts.push({ text: b.notes.length + (b.notes.length === 1 ? " needs a note" : " need a note"), kind: "alert" });
        if (b.pending.length) parts.push({ text: b.pending.length + " said In progress with no %", kind: "alert" });
      } catch (e) {}
      acts.push({ title: "Submit " + placeLabel(t) + "’s " + ((REVIEW && REVIEW.name) || "") + " report",
                  sub: parts, btn: "Open reporting", cta: true, go: { target: t, tab: "performance", report: true } });
    });
    targets.forEach(function (t) {
      var n = 0, owed = [];
      try {
        if (!seesGaps(t)) return;
        n = gapTotal(t);
        if (n > 0) owed = gapMap(t).filter(function (e) { return e.count > 0; }).map(function (e) { return e.label; });
      } catch (e) { return; }
      if (n <= 0) return;
      var names = owed.slice(0, 4).join(" · ") + (owed.length > 4 ? " · …" : "");
      acts.push({ title: "Fill " + placeLabel(t) + "’s missing plan elements",
                  sub: [{ text: plural(n, "missing element", "missing elements"), kind: "alert" }].concat(names ? [{ text: "— " + names, kind: "plain" }] : []),
                  btn: "Fill the gaps", cta: false, go: { target: t, tab: "strategy" } });
    });
  }
  var pages = [];
  if (office) {
    pages.push({ label: "Setup — Overview", small: "", go: { setup: "overview" } });
    pages.push({ label: "The group — Performance", small: "", go: { target: "group", tab: "performance" } });
  } else if (home) {
    var nm = placeLabel(home), isFn = String(home).indexOf("fn:") === 0;
    pages.push({ label: nm + " — Strategy", small: isFn ? "" : "Plan · Foundation · SWOT", go: { target: home, tab: "strategy" } });
    pages.push({ label: nm + " — Performance", small: "", go: { target: home, tab: "performance" } });
    var canRep = false; try { canRep = open && canSpeakFor(home); } catch (e) {}
    if (canRep) pages.push({ label: nm + " — Reporting", small: "", go: { target: home, tab: "performance", report: true } });
  }
  var tour = false;
  try { tour = !office && !!home && SMPRules.tourReady(world(), home); } catch (e) { tour = false; }
  var word = home ? "Continue to " + placeLabel(home) : "Continue";
  return { known: true, office: office, name: name, chips: chips, org: org, initials: initials,
           review: REVIEW ? { name: REVIEW.name || "", open: open } : null, cycle: cycle,
           acts: acts, pages: pages, tour: tour, home: home, continueWord: word };
}
function __smpPlaceLabel(state, target) { __smpHydrate(state); try { return placeLabel(target); } catch (e) { return String(target); } }
/* §67's clearedGraph(), the platform's own mirror of migration 004: what a
   client's deployment holds on day one. Hydrated first so clone() and the
   graph's own invariants are the product's. */
function __smpCleared(state) { __smpHydrate(state); return clearedGraph(state); }

/* ── WHAT A CLIENT IS BORN AS (§322) ──────────────────────────────────
   Islam: "the default create it's own units and functions that's wrong there
   is not default. it should open blank if they want." §67's cleared graph
   keeps the unit and function NAMES and empties their content — right for
   migration 004, which clears a deployment that is already this client's,
   and wrong for a client that has never existed: it arrived wearing Raya's
   ten units and eight functions with nothing in them, so the set-up flow's
   first list was somebody else's names to rename and wizTenantBare() was
   false, which is why no set-up invitation ever appeared.

   Cleared FIRST and then emptied, rather than built from nothing: the clear
   is what removes the figures, the roles, the people, the cycle and the
   archives, and re-deciding that list here would be a second answer to what
   day one holds (§53.5). What this adds is only that the shapes go too. */
function __smpBare(state) {
  var g = clearedGraph(__smpHydrateAnd(state));
  g.unitKeys = []; g.units = {};
  g.functionKeys = []; g.functions = {};
  g.companyKeys = []; g.companies = {};
  g.unitRoles = {}; g.koWeights = {};
  if (g.group) g.group.capabilities = [];
  return g;
}
function __smpHydrateAnd(state) { __smpHydrate(state); return state; }

/* ── AND WHAT THE SET-UP FLOW WRITES INTO IT (§322) ───────────────────
   Every row is minted by the platform's OWN minter — addCompany then its
   rename, addBusinessUnit, addFunction — so a unit created out here is byte
   for byte a unit created on Setup's own page. Companies first, because a
   unit names the company it belongs to; the words last, because they are a
   fact about the whole client rather than about any row.

   IT IS A REPLACE, NOT AN AMEND. The flow shows the whole list every time
   and the answers it posts ARE the list, so a name removed there has to
   disappear here — and a client being set up has no figures to lose, which
   is what makes replacing safe at all. The caller hands in a BARE graph each
   time for that reason, so nothing minted on a previous pass survives to be
   minted twice.

   AND NO BACKTICK MAY APPEAR IN THIS BLOCK: it lives inside the GLUE raw
   template literal, so one closes the string and the module stops parsing —
   which is how this comment first shipped. */
/* WHAT THIS CLIENT ALREADY HOLDS, so the caller can refuse rather than
   overwrite it. The flow REPLACES the shapes, which is safe on a client
   being set up and is not safe on one with plans in it — a pillar, an
   objective, a SWOT point or a capability all mean somebody has authored
   something, and the set-up flow is not the place to lose it. Counted by
   walking the graph rather than by asking whether the lists are empty: a
   client can legitimately hold three units and no plan, and that must not
   be refused. */
function __smpHolds(state) {
  __smpHydrate(state);
  /* A CAPABILITY THAT HOLDS NOTHING IS NOT AUTHORED WORK (§347). This counted
     capabilities AT ALL, which was right for as long as nothing out here could
     make one: the flow could not create a capability, so one existing meant
     somebody had made it inside the platform. The set-up step makes them now,
     so counting the box rather than what is in it would mean adding one locks
     the consultant out of their own set-up on the very next press (§61). What
     a capability holds is its objectives, its projects and its pillars — the
     same three things that make a unit's plan count above. */
  var plans = 0, caps = 0;
  ((GROUP && GROUP.capabilities) || []).forEach(function (c) {
    var n = ((c.keyObjectives || []).length) + ((c.projects || []).length) +
            ((c.items || []).length);
    if (n) caps++;
  });
  (UNIT_KEYS || []).concat((FUNCTION_KEYS || []).map(function (k) { return "fn:" + k; }))
    .forEach(function (t) {
      var u = String(t).indexOf("fn:") === 0 ? FUNCTIONS[String(t).slice(3)] : UNITS[t];
      if (!u) return;
      plans += ((u.items || []).length) + ((u.keyObjectives || []).length);
      var sw = u.swot || {};
      plans += ["s", "w", "o", "t"].reduce(function (n, q) { return n + ((sw[q] || []).length); }, 0);
    });
  return { plans: plans, capabilities: caps,
           units: (UNIT_KEYS || []).length, functions: (FUNCTION_KEYS || []).length };
}

/* WHAT THE FLOW NEVER ASKED ABOUT IS NOT THE FLOW'S TO RESET (§346).
   The rewrite below empties four lists and re-mints every row, which is
   right for the shape and wrong for everything hanging off it: a second
   pass through the flow — fixing a spelling, adding a unit, changing one
   word — put back a unit with no head, no custodian, no weight, no mark,
   no aspiration and no Who we are answers, and a function with no head and
   no definition. Silently, and on a client the 409 in the caller does not
   refuse, because that guard counts authored PLAN LINES and a client can
   hold a full register and not one pillar.

   So a row whose key survives keeps everything except what the flow
   collects, which is exactly a name, a company and a plan type. Expressed
   as "start from the old row and let the minter overwrite what it owns",
   never as a list of fields to carry: a field added to a unit next year is
   kept by this without anybody remembering to come back (§104.7). */
function __smpCarry(old, fresh, owned) {
  var out = {}, k;
  for (k in old) if (Object.prototype.hasOwnProperty.call(old, k)) out[k] = old[k];
  for (k in fresh) if (Object.prototype.hasOwnProperty.call(fresh, k)) {
    if (owned.indexOf(k) > -1 || !Object.prototype.hasOwnProperty.call(out, k)) out[k] = fresh[k];
  }
  return out;
}
function __smpHeld(r) { return !!(r && (r.head || r.custodian)); }

function __smpShape(state, a) {
  /* THE ANSWERS ARE THE LIST, so the shapes are replaced rather than added
     to: a unit taken off the flow's list has to disappear here, or walking
     the flow a second time leaves rows nobody can see any more. Everything
     that is NOT a shape — the register the team has been added to, the
     cycle, the group's own words — is left exactly where it is, which is
     why this empties four lists rather than starting from a bare graph. */
  var wasUnits = state.units || {}, wasFns = state.functions || {};
  var wasCos = state.companies || {}, wasRoles = state.unitRoles || {};
  /* A CAPABILITY IS A ROW THE FLOW OWNS NOW (§347), so it is replaced with the
     rest of the shape — and matched by NAME on the way back, because its id is
     minted fresh by addCapability and the flow's rows carry none. Safe only
     because the caller refuses the whole re-shape once any capability HOLDS
     something, so nothing keyed on an id can be standing here. */
  var wasCaps = {};
  ((state.group && state.group.capabilities) || []).forEach(function (c) {
    var nm = String((c && c.name) || "").trim().toLowerCase();
    if (nm && !wasCaps[nm]) wasCaps[nm] = c;
  });
  /* AND THE WEIGHTING ROWS GO WITH THE UNITS, or the flow appends a second
     row per unit on every pass: addBusinessUnit pushes one, nothing here
     cleared them, and syncWeights normalises across whatever it finds — so
     a third pass halved every unit's weight and the composite it feeds.
     Matched by KEY, which is what that table has been matched by since the
     rename bug (§ syncWeights' own comment). */
  var wasW = {};
  var wlist = (state.group && state.group.weighting && state.group.weighting.units) || [];
  wlist.forEach(function (row) { if (row && row.key && !wasW[row.key]) wasW[row.key] = row; });

  state.unitKeys = []; state.units = {};
  state.functionKeys = []; state.functions = {};
  state.companyKeys = []; state.companies = {};
  state.unitRoles = {};
  if (state.group) state.group.capabilities = [];
  if (state.group && state.group.weighting) state.group.weighting.units = [];
  __smpHydrate(state);
  a = a || {};
  var byName = {}, coByName = {};
  Object.keys(wasCos).forEach(function (k) {
    var nm = String((wasCos[k] && wasCos[k].name) || "").trim().toLowerCase();
    /* A COMPANY'S KEY IS POSITIONAL (addCompany mints newco1, newco2), so it
       is the one row that cannot be matched by key across a rewrite — drop
       the first company and every key after it shifts by one. Matched by
       NAME here, which is the only thing about a company the flow carries,
       so its CEO and its two visibility flags survive a re-run. */
    if (nm && !coByName[nm]) coByName[nm] = wasCos[k];
  });
  (a.companies || []).forEach(function (c) {
    var nm = String((c && c.name) || "").trim();
    if (!nm) return;
    var k = addCompany();
    COMPANIES[k].name = nm;
    var had = coByName[nm.toLowerCase()];
    if (had) COMPANIES[k] = __smpCarry(had, COMPANIES[k], ["name"]);
    byName[nm.toLowerCase()] = k;
  });
  (a.units || []).forEach(function (u) {
    var nm = String((u && u.name) || "").trim();
    if (!nm) return;
    var co = byName[String((u && u.company) || "").trim().toLowerCase()] || null;
    var k = addBusinessUnit(nm, (u && u.prefix) || "", co);
    if (k && wasUnits[k]) {
      UNITS[k] = __smpCarry(wasUnits[k], UNITS[k], ["name", "company", "ukey"]);
      if (wasRoles[k]) UNIT_ROLES[k] = wasRoles[k];
      if (wasW[k]) {
        var rows = GROUP.weighting.units;
        for (var i = 0; i < rows.length; i++) {
          if (rows[i] && rows[i].key === k) { wasW[k].unit = nm; rows[i] = wasW[k]; break; }
        }
      }
    }
  });
  (a.functions || []).forEach(function (f) {
    var nm = String((f && f.name) || "").trim();
    if (!nm) return;
    /* §342: THREE FORMATS, so the set-up flow's third choice reaches the
       graph — without this line the console offers it and the client is
       shaped as a projects function, which is §96's fault at the one moment
       nobody is watching (the shape is written before anybody signs in). */
    var ff = (f && f.format) === "pillars" ? "pillars"
           : (f && f.format) === "objectives" ? "objectives" : "projects";
    var k = addFunction(nm, ff);
    /* BOTH SIDES OF THIS HUNK WERE RIGHT AND EITHER TAKEN WHOLE DROPS THE
       OTHER (§318.7): main's third format, and the carry that stops a second
       pass through the flow resetting a function's head and its definition. */
    if (k && wasFns[k]) FUNCTIONS[k] = __smpCarry(wasFns[k], FUNCTIONS[k], ["name", "format"]);
  });
  /* ── AND THE CAPABILITIES, AFTER THE FUNCTIONS THAT CARRY THEM (§347) ──
     addCapability takes the function's KEY, so the functions have to exist
     first; the flow names its holder, because a name is the only thing about
     a function its own rows carry. A name that matches nothing leaves the
     capability unassigned, which is a real state the Setup page already draws
     rather than an error to invent (§35). The form is the thing's own since
     §334, and it is validated here rather than trusted: capFormat reads
     anything that is not "pillars" as projects, so an unknown word would be
     silently accepted and silently mean something else (§96.2). */
  var fnByName = {};
  (FUNCTION_KEYS || []).forEach(function (k) {
    var nm = String((FUNCTIONS[k] && FUNCTIONS[k].name) || "").trim().toLowerCase();
    if (nm && !fnByName[nm]) fnByName[nm] = k;
  });
  (a.capabilities || []).forEach(function (cp) {
    var nm = String((cp && cp.name) || "").trim();
    if (!nm) return;
    var holder = fnByName[String((cp && cp.fn) || "").trim().toLowerCase()] || null;
    var made = addCapability(holder);
    made.name = nm;
    made.format = (cp && cp.format) === "pillars" ? "pillars" : "projects";
    var had = wasCaps[nm.toLowerCase()];
    if (had) {
      var keep = __smpCarry(had, made, ["name", "fn", "format", "id", "code"]);
      for (var kk in keep) if (Object.prototype.hasOwnProperty.call(keep, kk)) made[kk] = keep[kk];
    }
  });
  /* AND A ROW THAT DID NOT SURVIVE IS NOT CARRIED ANYWHERE, so whoever was
     in charge of it would simply be gone. The caller writes nothing when
     this list is not empty and says which rows, rather than this deciding
     on its own: renaming a unit that has a head is a real thing to want,
     and it is done inside the platform where the rename keeps the row. */
  var dropped = [];
  Object.keys(wasRoles).forEach(function (k) {
    if (__smpHeld(wasRoles[k]) && !UNITS[k]) {
      dropped.push(String((wasUnits[k] && wasUnits[k].name) || k));
    }
  });
  Object.keys(wasFns).forEach(function (k) {
    if (__smpHeld(wasFns[k]) && !FUNCTIONS[k]) {
      dropped.push(String((wasFns[k] && wasFns[k].name) || k));
    }
  });
  syncWeights();
  /* THE TENANT'S OWN WORDS, through the registry's own entries: the label a
     client uses is the bu column, which is what every heading reads
     (L of the key against "bu"). A word left blank leaves the shipped one — a set-up that
     wrote an empty string would take the word away rather than decline to change it. */
  var words = a.words || {};
  (LABELS.entries || []).forEach(function (e) {
    var v = words[e.key];
    if (v == null) return;
    v = String(v).trim();
    if (v) e.bu = v;
  });
  state.labels = LABELS.entries;
  return { state: state, dropped: dropped };
}
`;

let ctx = null;
function context() {
  if (ctx) return ctx;
  const c = vm.createContext({ console });
  c.self = c; c.window = c;
  vm.runInContext(fs.readFileSync(RULES, "utf8"), c, { filename: "rules.cjs" });
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), c, { filename: f });
  vm.runInContext(GLUE, c, { filename: "frozen-glue.js" });
  ctx = c;
  return c;
}
/* Detached from the context: a plain object the caller may keep after the
   next request has hydrated somebody else's graph over these globals. */
function detach(v) { return JSON.parse(JSON.stringify(v)); }

function landing(graph, personKey) {
  const c = context();
  return detach(c.__smpLanding(graph, personKey || ""));
}
function placeLabel(graph, target) {
  const c = context();
  return String(c.__smpPlaceLabel(graph, target));
}
/* The graph a NEW client starts with (§67, §313.31): the seed cleared by the
   product's own clearedGraph() — unit and function names kept, every plan
   line, figure, role and person but the bootstrap SMO gone. */
function cleared(graph) {
  const c = context();
  return detach(c.__smpCleared(graph));
}
/* The graph a client is born as when nobody has answered anything: §67's
   clear with the shapes emptied too (§322). */
function bare(graph) {
  const c = context();
  return detach(c.__smpBare(graph));
}
/* What a client already holds, so a set-up cannot overwrite real work
   (§322). */
function holds(graph) {
  const c = context();
  return detach(c.__smpHolds(graph));
}
/* The set-up flow's answers written in by the product's own minters (§322).
   Answers { state, dropped }: `dropped` names the units and functions that
   had somebody in charge and are not in the answers, so the caller can write
   nothing rather than lose them (§346). */
function shape(graph, answers) {
  const c = context();
  return detach(c.__smpShape(graph, answers));
}
module.exports = { landing, placeLabel, cleared, bare, shape, holds, FILES };
