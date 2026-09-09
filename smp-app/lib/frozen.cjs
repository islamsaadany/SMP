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
const FILES = ["group-data.js", "config-data.js", "group-render.js", "config-render.js"];

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
module.exports = { landing, placeLabel, FILES };
