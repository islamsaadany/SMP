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
               "builder.js", "client-setup.js"];

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
    /* Reporting cycle since §359 — the Overview this once opened is gone
       (step 1 moved welcome.js and left this carried copy behind, §359.3:
       the door-landing check compared the page with THIS reader and the two
       agreed about a page that no longer exists, §113.8) */
    pages.push({ label: "Setup — Reporting cycle", small: "", go: { setup: "cycle" } });
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
/* MAY THIS PERSON OPEN A MODULE (spec 056 research R3, s356.5): the product's
   own reader, mayOpenModuleArea in config-data.js -- the one the module's
   Access page draws its cells from -- asked of the stored graph. A person the
   register does not hold is judged as holding nothing, which is the shipped
   state (absent means not answered yet, s30.2). */
function __smpMayOpen(state, personKey, area) {
  __smpHydrate(state);
  var row = null;
  for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].key === personKey) { row = PEOPLE[i]; break; }
  try { return !!mayOpenModuleArea(row, area); } catch (e) { return (area.shipped || "none") !== "none"; }
}
/* THE FACTS A LANDING LINE IS MADE OF (§359.4): the cycle's state and its
   due day off REVIEW, and how many subjects have submitted off cycleTotals()
   — the product's own count, the one the cycle board and the welcome screen
   read, never a second sum (§53.5). */
function __smpLandingFacts(state) {
  __smpHydrate(state);
  var out = { cycleOpen: null, cycleName: "", due: "", total: null, sub: null };
  try {
    if (REVIEW) {
      out.cycleOpen = REVIEW.state === "open";
      out.cycleName = String(REVIEW.name || "");
      out.due = String(REVIEW.due || "").trim();
    }
    /* SUBJECTS, never figures: total and done are the FIGURES entered across
       the tenant and units is the subjects the board has a row for (§244),
       of which sub have submitted — the first draft read t.total and the
       line said "249 of 255 still to submit" about a tenant with eighteen
       subjects (§100.3, measured before it shipped). */
    var t = cycleTotals();
    if (t && typeof t.units === "number") { out.total = t.units; out.sub = t.sub; }
  } catch (e) {}
  return out;
}
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
/* WHAT THIS CLIENT HOLDS AND WHAT THE SET-UP WRITES INTO IT ARE THE
   SOURCE'S OWN NOW (§360, spec 057): __smpHolds and __smpShape live in
   SMP-Project-Folder/src/client-setup.js, where the browser runs them over
   the live graph, and this glue only hands them its hydrate. One shape
   function for both hosts (§53.5) — the copies that lived here went. */
function __smpHoldsG(state) { return __smpHolds(state, __smpHydrate); }
function __smpShapeG(state, a) { return __smpShape(state, a, __smpHydrate); }
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
/* The cycle half of a landing line's facts (§359.4); the library half is
   the server's own (lib/landing-facts.ts). */
function landingFacts(graph) {
  const c = context();
  return detach(c.__smpLandingFacts(graph));
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
  return detach(c.__smpHoldsG(graph));
}
/* The set-up flow's answers written in by the product's own minters (§322).
   Answers { state, dropped }: `dropped` names the units and functions that
   had somebody in charge and are not in the answers, so the caller can write
   nothing rather than lose them (§346). */
function shape(graph, answers) {
  const c = context();
  return detach(c.__smpShapeG(graph, answers));
}
/* Whether a person may open a module whose grant is `area` (spec 056 §4.4),
   answered by the frozen product's own reader — the cell on the module's
   Access page and the door in front of the module cannot then disagree. */
function mayOpen(graph, personKey, area) {
  const c = context();
  return !!c.__smpMayOpen(graph, personKey || "", area);
}
module.exports = { landing, placeLabel, landingFacts, mayOpen, cleared, bare, shape, holds, FILES };
