/* WHO MAY CHANGE WHAT — the server's answer, on every save (spec 006).
   ═══════════════════════════════════════════════════════════════════════

   /api/state used to check that you were signed in and nothing else. It then
   truncated thirty tables and wrote back whatever arrived, register and access
   matrix included — so the lowest-privilege person in the tenant could post a
   state making themselves the SMO. Everything v3.10 built decided what a
   screen OFFERED; nothing decided what the server ACCEPTED.

   This module closes that. Given the stored state and an incoming one, it
   works out WHAT CHANGED, and refuses any change the person's roles do not
   allow.

   TWO THINGS CARRY THE WHOLE DESIGN.

   1. THE WORLD IS THE STORED STATE, NEVER THE INCOMING ONE. Roles, the access
      map, unit ownership and the company flags are all read from what the
      database already holds. Authorise against the incoming state and a save
      can grant itself the role that authorises it, in the same request. This
      is the single most important line in the file.

   2. AN UNRECOGNISED CHANGE IS THE SMO'S. Every classifier below ends in a
      fall-through that lands on `unknown`, which only the SMO may make. So a
      field added in a later version is guarded the day it is added rather than
      the day somebody remembers to guard it. It fails CLOSED, and the cost of
      that is a refusal the SMO can always make instead — never a silent hole.

   Refusing the WHOLE save rather than the disallowed part is also deliberate
   (spec 006 §4): a partial save leaves the browser holding a picture the
   database does not share, and its next save writes that picture back. */

const R = require("./rules.js");

/* ── Field families ───────────────────────────────────────────────
   What counts as REPORTING on each kind of row. Everything else on the same
   row is the PLAN, which §31 reserves to the SMO. */
const REPORT = {
  measure:   ["actual", "progress", "note"],
  unitKO:    ["actual", "progress", "note"],
  tactic:    ["status", "actual", "note"],
  capKO:     ["actual", "progress", "note"],
  outcome:   ["actual", "progress", "note"],
  milestone: ["status", "note"]
};

/* §16.7 splits a unit's reporting in two. The FIGURE may belong to a source
   team — Finance enters revenue once for every unit that uses it. The NOTE
   never does: the number is the source's, the performance is the unit's, and
   the explanation belongs to whoever owns the performance. */
const FIGURE = ["actual", "progress"];
const NOTE = ["note"];
/* WHO is master of a figure is a setting, not a plan and not a report — it is
   assigned on a Setup page by the SMO (§16.7). Carried separately so the
   refusal says "Setup is the SMO's" rather than "a plan is corrected by the
   SMO", which would be true but would send somebody to the wrong screen. */
const SRC = ["src"];

/* A unit's own columns, by who may change them. `weight` is derived and
   zeroed in transit (§5.1); `perf` and a pillar's exec/planned/outcomes are
   figures nothing in the platform writes, so they sit with the plan — where a
   crafted request cannot move a headline and no real save is ever refused. */
const UNIT_CONFIG     = ["name", "navName", "codePrefix", "active", "real", "company"];
const UNIT_FOUNDATION = ["aspiration", "endInMind", "clauses"];
const UNIT_KNOWN      = UNIT_CONFIG.concat(UNIT_FOUNDATION,
  ["ukey", "weight", "perf", "keyObjectives", "swot", "items"]);

const GROUP_OWN = ["org", "horizon", "asOfQuarter", "aspiration", "endInMind",
                   "mission", "values", "clauses", "keyObjectives", "themes",
                   "portfolio", "themePillars", "themeView", "weighting"];

const TOP_SETUP = ["people", "unitRoles", "access", "labels", "bands",
                   "koWeights", "companies", "companyKeys", "functionKeys"];
const TOP_CYCLE = ["history", "priorCycle", "archives"];

function j(v) { return JSON.stringify(v === undefined ? null : v); }
function same(a, b) { return j(a) === j(b); }
function pick(o, fields) {
  const out = {};
  fields.forEach(function (f) { if (o && o[f] !== undefined) out[f] = o[f]; });
  return out;
}
function omit(o, fields) {
  const out = {};
  Object.keys(o || {}).forEach(function (k) { if (fields.indexOf(k) === -1) out[k] = o[k]; });
  return out;
}
function idsOf(list) { return (list || []).map(function (x) { return x && x.id; }); }
function byId(list) {
  const m = {};
  (list || []).forEach(function (x) { if (x && x.id !== undefined) m[x.id] = x; });
  return m;
}

/* ── The classifier ───────────────────────────────────────────────
   Produces one entry per KIND of change, each naming what moved. The `ids`
   on a reporting change are what the contributor rule needs. */
function collect(stored, incoming, w) {
  const out = [];
  /* `rows` is what makes the change log answer "who moved this target": one
     entry per field that actually moved, with its before and after. Whole-area
     changes (the register, the matrix, the cycle) carry no values — a diff of
     the people array is not a sentence anybody reads — so for those the WHAT
     is the record. */
  const add = function (kind, target, what, rows) {
    out.push({ kind: kind, target: target || null, what: what,
               rows: rows || null,
               ids: rows ? uniq(rows.map(function (r) { return r.id; })) : null });
  };

  /* — top level — */
  TOP_SETUP.forEach(function (k) {
    if (!same(stored[k], incoming[k])) add("setup", null, k);
  });
  TOP_CYCLE.forEach(function (k) {
    if (!same(stored[k], incoming[k])) add("cycle", null, k);
  });

  /* — the cycle, and the focus marks inside it — */
  const sc = stored.cycle || {}, ic = incoming.cycle || {};
  if (!same(sc.focus, ic.focus)) add("focus", null, "focus measures");
  if (!same(omit(sc, ["focus"]), omit(ic, ["focus"]))) add("cycle", null, "the reporting cycle");

  /* — the review: submitting and its note belong to whoever is reporting — */
  const sr = stored.review || {}, ir = incoming.review || {};
  const perTarget = ["submitted", "note"];
  perTarget.forEach(function (field) {
    const a = sr[field] || {}, b = ir[field] || {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (t) {
      if (same(a[t], b[t])) return;
      if (out.some(function (c) { return c.kind === "reportState" && c.target === t; })) return;
      add("reportState", t, field === "submitted" ? "submitting the report" : "the report's note");
    });
  });
  if (!same(omit(sr, perTarget), omit(ir, perTarget))) add("cycle", null, "the review");

  /* — the group's own strategy — */
  const sg = stored.group || {}, ig = incoming.group || {};
  GROUP_OWN.forEach(function (k) {
    if (!same(sg[k], ig[k])) add("group", "group", k);
  });
  /* The tenant's colours are the BRANDING page, which is Setup — a brand is
     not a screen preference and must not be changeable by whoever happens to
     be looking. */
  if (!same(sg.branding, ig.branding)) add("setup", null, "the tenant's branding");
  /* Figure sets are SETUP: who is master of which numbers is the SMO's to
     decide, and a set that could name its own owner could name anybody. */
  if (!same(sg.sets, ig.sets)) add("setup", null, "figure sets");
  collectCapabilities(sg.capabilities, ig.capabilities, add);
  const gExtra = GROUP_OWN.concat(["capabilities", "branding", "sets"]);
  /* NAMED, not "the group". A refusal that cannot be diagnosed is a bug
     report addressed to nobody — and the first thing this bucket caught was a
     field the browser invented and the database never held. */
  const gUnknown = uniq(Object.keys(omit(sg, gExtra)).concat(Object.keys(omit(ig, gExtra))))
    .filter(function (k) { return !same(sg[k], ig[k]); });
  if (gUnknown.length) add("unknown", "group", "the group's " + gUnknown.join(", "));

  /* — the supporting functions — */
  if (!same(stored.functions, incoming.functions)) add("setup", null, "supporting functions");

  /* — each unit — */
  const unitKeys = uniq((stored.unitKeys || []).concat(incoming.unitKeys || []));
  if (!same(stored.unitKeys, incoming.unitKeys)) add("setup", null, "the list of business units");
  unitKeys.forEach(function (k) {
    collectUnit(k, (stored.units || {})[k], (incoming.units || {})[k], add, w);
  });

  /* — anything at the top the platform does not name — */
  const known = TOP_SETUP.concat(TOP_CYCLE,
    ["group", "cycle", "review", "functions", "unitKeys", "units"]);
  uniq(Object.keys(stored).concat(Object.keys(incoming))).forEach(function (k) {
    if (known.indexOf(k) > -1) return;
    if (!same(stored[k], incoming[k])) add("unknown", null, k);
  });

  return out;
}

function uniq(a) {
  const seen = {}, out = [];
  a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
  return out;
}

/* A list of rows with ids, split into what is reporting and what is plan.
   A change to WHICH rows exist is always plan: adding or removing a measure
   is authoring, not reporting. */
function splitRows(sList, iList, fields, onReport, onPlan) {
  if (!same(idsOf(sList), idsOf(iList))) { onPlan(); return; }
  const sm = byId(sList), im = byId(iList);
  const moved = [];
  let planMoved = false;
  Object.keys(sm).forEach(function (id) {
    const a = sm[id], b = im[id];
    fields.forEach(function (f) {
      if (!same(a[f], b[f])) moved.push({ id: id, name: a.name || null, field: f,
                                          from: a[f] === undefined ? null : a[f],
                                          to: b[f] === undefined ? null : b[f] });
    });
    if (!same(omit(a, fields), omit(b, fields))) planMoved = true;
  });
  if (moved.length) onReport(moved);
  if (planMoved) onPlan();
}

/* Split the figures that moved by WHOSE they are. A figure with a source is
   the source's to enter; everything else is the unit's. Whose is read from the
   STORED row — asking the incoming one would let a save name itself as the
   source in the same request (§42.2 again). One entry per source person, so
   the refusal can name them. */
function addFigures(w, unitKey, storedUnit, rows, what, add) {
  const mine = [], byOwner = {};
  const find = function (id) {
    let hit = null;
    (storedUnit.keyObjectives || []).forEach(function (m) { if (m.id === id) hit = m; });
    (storedUnit.items || []).forEach(function (p) {
      (p.measures || []).forEach(function (m) { if (m.id === id) hit = m; });
    });
    return hit;
  };
  rows.forEach(function (r) {
    const stored = find(r.id);
    /* Resolved through the STORED world, so a save cannot claim a figure and
       enter it in the same request (§42.2). */
    const who = R.assigneeOf(w, stored);
    if (who) {
      (byOwner[who] = byOwner[who] || []).push(
        Object.assign({}, r, { by: who, label: R.sourceLabel(w, stored) }));
    } else {
      mine.push(r);
    }
  });
  if (mine.length) add("unitReporting", unitKey, what, mine);
  Object.keys(byOwner).forEach(function (who) {
    add("sourceReporting", unitKey, what + " entered by " +
        (byOwner[who][0].label || who), byOwner[who]);
  });
}

function collectUnit(key, su, iu, add, w) {
  if (!su || !iu) { add("setup", key, "a business unit was added or removed"); return; }

  if (!same(pick(su, UNIT_CONFIG), pick(iu, UNIT_CONFIG))) add("setup", key, "the unit's settings");
  if (!same(pick(su, UNIT_FOUNDATION), pick(iu, UNIT_FOUNDATION))) add("unitFoundation", key, "the unit's own words");
  if (!same(su.swot, iu.swot)) add("unitAnalysis", key, "the unit's SWOT");

  /* Key objectives: figure and note travel separately, because a figure may
     be somebody else's and a note never is. */
  splitRows(su.keyObjectives, iu.keyObjectives, FIGURE,
    function (rows) { addFigures(w, key, su, rows, "key objective figures", add); },
    function () { /* handled by the NOTE + plan passes below */ });
  splitRows(su.keyObjectives, iu.keyObjectives, NOTE,
    function (rows) { add("unitReporting", key, "key objective notes", rows); },
    function () {});
  splitRows(su.keyObjectives, iu.keyObjectives, SRC,
    function (rows) { add("claim", key, "who reports a key objective's figure", rows); },
    function () {});
  splitRows(su.keyObjectives, iu.keyObjectives, REPORT.unitKO.concat(SRC),
    function () {},
    function () { add("unitPlan", key, "the unit's key objectives"); });

  /* Pillars, and the measures and tactics under them. */
  if (!same(idsOf(su.items), idsOf(iu.items))) {
    add("unitPlan", key, "the unit's pillars");
  } else {
    const sm = byId(su.items), im = byId(iu.items);
    const moved = [];
    let planMoved = false;
    Object.keys(sm).forEach(function (id) {
      const a = sm[id], b = im[id];
      if (!same(omit(a, ["measures", "tactics"]), omit(b, ["measures", "tactics"]))) planMoved = true;
      splitRows(a.measures, b.measures, FIGURE,
        function (rows) { addFigures(w, key, su, rows, "reported figures", add); },
        function () {});
      splitRows(a.measures, b.measures, NOTE,
        function (rows) { rows.forEach(function (x) { moved.push(x); }); },
        function () {});
      splitRows(a.measures, b.measures, SRC,
        function (rows) { add("claim", key, "who reports a figure", rows); },
        function () {});
      splitRows(a.measures, b.measures, REPORT.measure.concat(SRC),
        function () {},
        function () { planMoved = true; });
      splitRows(a.tactics, b.tactics, REPORT.tactic,
        function (rows) { rows.forEach(function (x) { moved.push(x); }); },
        function () { planMoved = true; });
    });
    if (moved.length) add("unitReporting", key, "reported figures", moved);
    if (planMoved) add("unitPlan", key, "the unit's plan");
  }

  const uUnknown = uniq(Object.keys(omit(su, UNIT_KNOWN)).concat(Object.keys(omit(iu, UNIT_KNOWN))))
    .filter(function (k) { return !same(su[k], iu[k]); });
  if (uUnknown.length) add("unknown", key, "the unit's " + uUnknown.join(", "));
}

/* Capabilities. WHAT EXISTS and WHICH FUNCTION OWNS IT is Setup (c_caps);
   what a capability IS, its key objectives and its projects belong to the
   function that carries it (k_found, k_proj); the figures are its reporting
   (k_report). */
const CAP_SETUP = ["id", "name", "fn"];
const CAP_KNOWN = CAP_SETUP.concat(["def", "keyObjectives", "projects", "perf", "exec"]);

function collectCapabilities(sList, iList, add) {
  if (same(sList, iList)) return;
  if (!same(idsOf(sList), idsOf(iList))) { add("setup", null, "the list of capabilities"); return; }
  const sm = byId(sList), im = byId(iList);
  Object.keys(sm).forEach(function (id) {
    const a = sm[id], b = im[id];
    if (same(a, b)) return;
    if (!same(pick(a, CAP_SETUP), pick(b, CAP_SETUP))) add("setup", null, "a capability's name or function");
    const target = "fn:" + (a.fn || "");
    if (!same(a.def, b.def)) add("capPlan", target, "what a capability is");
    if (!same(pick(a, ["perf", "exec"]), pick(b, ["perf", "exec"]))) add("capReporting", target, "a capability's figures");

    splitRows(a.keyObjectives, b.keyObjectives, REPORT.capKO,
      function (rows) { add("capReporting", target, "capability key objective figures", rows); },
      function () { add("capPlan", target, "a capability's key objectives"); });

    /* Projects: the brief is plan, the outcomes and milestones carry figures. */
    if (!same(idsOf(a.projects), idsOf(b.projects))) {
      add("capPlan", target, "a capability's projects");
    } else {
      const sp = byId(a.projects), ip = byId(b.projects);
      Object.keys(sp).forEach(function (pid) {
        const pa = sp[pid], pb = ip[pid];
        if (!same(omit(pa, ["outcomes", "milestones"]), omit(pb, ["outcomes", "milestones"])))
          add("capPlan", target, "a project");
        splitRows(pa.outcomes, pb.outcomes, REPORT.outcome,
          function (rows) { add("capReporting", target, "project outcome figures", rows); },
          function () { add("capPlan", target, "a project's outcomes"); });
        splitRows(pa.milestones, pb.milestones, REPORT.milestone,
          function (rows) { add("capReporting", target, "project milestones", rows); },
          function () { add("capPlan", target, "a project's milestones"); });
      });
    }
    if (!same(omit(a, CAP_KNOWN), omit(b, CAP_KNOWN))) add("unknown", target, "a capability");
  });
}

/* ── The verdict ──────────────────────────────────────────────────
   One sentence per refusal, naming what was refused and why. A refusal
   nobody can act on is a bug report addressed to the wrong person. */

function edits(w, person, area, target) {
  return R.grantIn(w, person, area, target) === "edit";
}

/* editingRoles and namedOn live in rules.js — the screen makes the same two
   decisions, and a page that offers a pen the server then refuses is exactly
   the drift the shared file exists to prevent. */
const namedOn = R.namedOn;

/* Every row in a unit that carries an id, so a changed id can be found. */
function rowsOfUnit(u) {
  const out = {};
  (u && u.keyObjectives || []).forEach(function (x) { out[x.id] = x; });
  (u && u.items || []).forEach(function (p) {
    (p.measures || []).forEach(function (m) { out[m.id] = { owner: p.owner, of: m }; });
    (p.tactics || []).forEach(function (t) { out[t.id] = t; });
  });
  return out;
}

function authorize(stored, incoming, person) {
  const w = R.worldOf(stored);              /* THE STORED WORLD. Never the incoming one. */
  const smo = R.isSMO(w, person);
  const locked = !!((stored.cycle || {}).locked);
  const roleKeys = R.personRoleKeys(w, person);
  const changes = collect(stored, incoming, w);
  const refusals = [];

  const no = function (why) { refusals.push(why); };

  changes.forEach(function (ch) {
    const where = ch.target && ch.target !== "group"
      ? " (" + String(ch.target).replace(/^fn:/, "") + ")" : "";

    switch (ch.kind) {
      case "setup":
        if (!edits(w, person, "a_setup", "group"))
          no("Setup is the SMO's — " + ch.what + where + " cannot be changed here.");
        return;

      case "group":
        if (!edits(w, person, "a_group", "group"))
          no("The group's own strategy cannot be changed here — " + ch.what + ".");
        return;

      case "cycle":
        if (!edits(w, person, "a_cycle", "group"))
          no("The reporting cycle is run by the SMO — " + ch.what + " cannot be changed here.");
        return;

      /* A rule, not a setting (§37): what carries reward is the office's
         decision. And a locked cycle has stopped taking marks. */
      case "focus":
        if (roleKeys.indexOf("gceo") === -1 && roleKeys.indexOf("super") === -1)
          no("Focus measures are marked by the CEO and the SMO.");
        else if (locked && !smo)
          no("This cycle is locked, so its focus measures can no longer be changed.");
        return;

      case "unitFoundation":
      case "unitAnalysis":
        if (!edits(w, person, "unit", ch.target))
          no("You cannot change " + ch.what + where + ".");
        return;

      /* A plan ARRIVES by upload and is corrected by the SMO alone (§22, §31).
         A unit owner holding edit on their own unit still cannot rewrite the
         plan they are measured against — that is the point of the rule. */
      case "unitPlan":
        if (!smo || !edits(w, person, "unit", ch.target))
          no("A plan is corrected by the SMO — " + ch.what + where + " cannot be changed here.");
        return;

      case "unitReporting":
      case "reportState": {
        const t = String(ch.target || "");
        const isFn = t.indexOf("fn:") === 0;
        if (!edits(w, person, isFn ? "fn" : "unit", t)) {
          no("You cannot report for " + t.replace(/^fn:/, "") + ".");
          return;
        }
        if (locked && !smo) {
          no("This cycle is locked. Ask the SMO to reopen it before entering figures.");
          return;
        }
        /* Submitting, and the unit's own note on the cycle, speak for the
           whole unit — so a contributor limited to their own lines does
           neither (spec 006 §7.2). */
        if (!isFn && R.onlyVia(w, person, "unit", t, "contrib")) {
          if (ch.kind === "reportState") {
            no("A contributor reports their own lines; " + ch.what + " is the unit's.");
            return;
          }
        }
        if (ch.kind !== "unitReporting" || !ch.ids || isFn) return;
        /* "Contributors only view, and if we allow them they should be allowed
           to their lines only" — a rule with teeth, so a tenant that still has
           edit stored for contrib cannot touch anybody else's rows. */
        if (!R.onlyVia(w, person, "unit", t, "contrib")) return;
        const rows = rowsOfUnit((stored.units || {})[t]);
        const notMine = ch.ids.filter(function (id) {
          const row = rows[id];
          if (!row) return true;
          return !namedOn(row.of ? { owner: row.owner } : row, person);
        });
        if (notMine.length)
          no("A contributor reports only their own lines — " + notMine.length +
             (notMine.length === 1 ? " figure" : " figures") + " in " + t + " is not yours.");
        return;
      }

      /* The figure belongs to whoever the set names — in ANY unit, without
         owning any of them. The unit's own people cannot move it: that is the
         whole point, because a figure entered by the person measured against
         it is not a source of anything. */
      case "sourceReporting": {
        const t = String(ch.target || "");
        if (locked && !smo) {
          no("This cycle is locked. Ask the SMO to reopen it before entering figures.");
          return;
        }
        if (smo) return;
        const notMine = (ch.rows || []).filter(function (r) { return r.by !== person.key; });
        if (notMine.length) {
          const label = (ch.rows || [])[0] && (ch.rows || [])[0].label;
          no("That figure is entered by " + (label || "somebody else") +
             " — " + t + " does not enter it.");
        }
        return;
      }

      /* CLAIMING a figure into a set (spec 008). Three things decide it, and
         all three read the STORED world.

         WHO MAY PICK is a property of the SET, not of the person: ticking from
         the full list IS reading every number in the group, so it defaults to
         the SMO and is opened deliberately for a team like Finance. A switch
         enforced only by hiding a control is decoration (§42).

         ONE FIGURE, ONE SET: a figure somebody already holds is refused, and
         the refusal names the holder so there is a route forward rather than a
         dead end. Moving it is the SMO's, which is what answering a claim
         request will be.

         AND YOU MAY ONLY CLAIM INTO YOUR OWN SET. */
      case "claim": {
        if (smo) return;
        (ch.rows || []).forEach(function (r) {
          const before = R.rowById(w, ch.target, r.id);
          const held = before && before.src;
          const want = r.to && typeof r.to === "object" ? r.to : null;

          /* RELEASING what you hold is allowed; releasing — or overwriting —
             somebody else's is not, and the refusal names them so there is a
             route forward rather than a dead end. */
          if (held) {
            const heldSet = held.set ? R.setById(w, held.set) : null;
            if (!heldSet || !R.mayPickInto(w, person, heldSet)) {
              no("That figure is already held by " +
                 (R.sourceLabel(w, before) || "another set") + ". Ask the SMO to move it.");
              return;
            }
          }
          if (!want) return;
          if (!want.set) {
            no("A figure can only be claimed into a set here.");
            return;
          }
          const set = R.setById(w, want.set);
          if (!set) { no("That set does not exist."); return; }
          if (!R.mayPickInto(w, person, set)) {
            no(set.owner === person.key
              ? "\u201c" + (set.name || want.set) + "\u201d is marked for the SMO to fill \u2014 " +
                "ask them to add this figure to it."
              : "Only \u201c" + (set.name || want.set) + "\u201d\u2019s own owner may claim into it.");
          }
        });
        return;
      }

      case "capPlan":
        if (!edits(w, person, "fn", ch.target))
          no("You cannot change " + ch.what + where + ".");
        return;

      case "capReporting":
        if (!edits(w, person, "fn", ch.target)) { no("You cannot report for " + where.trim() + "."); return; }
        if (locked && !smo) no("This cycle is locked. Ask the SMO to reopen it before entering figures.");
        return;

      /* Fails CLOSED. A field the platform gained after this file was written
         is guarded on the day it is added, not on the day it is remembered. */
      default:
        if (!smo) no("This save changes something only the SMO may change" +
                     (ch.what ? " (" + ch.what + ")" : "") + ".");
    }
  });

  return { ok: !refusals.length, refusals: uniq(refusals), changes: changes };
}

module.exports = { authorize: authorize, collect: collect,
                   REPORT: REPORT, namedOn: namedOn };
