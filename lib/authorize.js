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
/* §234: the differ and this file must agree about which review fields are
   keyed by target — a field on one list and not the other travels whole and
   reverts every other function's report state (the incident §234 records). */
const DIFF = require("./graph-diff.js");

/* ── Field families ───────────────────────────────────────────────
   What counts as REPORTING on each kind of row. Everything else on the same
   row is the PLAN, which §31 reserves to the SMO. */
const REPORT = {
  measure:   ["actual", "progress", "note"],
  unitKO:    ["actual", "progress", "note"],
  /* §245: `outActual` is the figure a tactic measured by its OUTCOME reports.
     It had to join this list in the same edit as the box that writes it, or
     the screen would offer a field the save refuses — §42's drift, and the
     exact fault §147 records for a milestone's `pct`. Its target, direction
     and compile rule are NOT here: those are the plan, and the plan is the
     office's (§94). */
  tactic:    ["status", "actual", "note", "outActual"],
  capKO:     ["actual", "progress", "note"],
  outcome:   ["actual", "progress", "note"],
  /* `pct` on both since §147 — it arrived with migration 024 (§104.10: an In
     progress row REQUIRES a %) and this list was never told, so the very %
     the pane demanded was classified as PLAN and the save refused. And a
     DELIVERABLE had no family at all: its status/pct/note fell into the
     project-body compare and came back "a plan is corrected by the SMO" for
     every custodian who reported one. The screen had offered both since §104;
     the server refused both; nothing compared the two (§94.2's class). */
  deliverable: ["status", "pct", "note"],
  milestone: ["status", "pct", "note"]
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
/* `logo` is a unit SETTING, classified with the rest of them rather than
   left to the unknown fall-through. Both land on the SMO, so this changes
   no permission — it changes the REFUSAL, which then says Setup is the
   SMO's and sends the person to the page that holds it (§16.7). */
const UNIT_CONFIG     = ["name", "navName", "codePrefix", "active", "real", "company", "logo"];
/* §256: which slides a review does not show. Its own kind rather than a
   setting, and the reason is §16.7's: both land on the office, so this
   changes no permission — it changes the REFUSAL, which must not send
   somebody to Setup for a control that lives in Manage slides.

   NAMED FROM THE SHARED MODULE, never spelled again here. A field the screen
   writes under one name and the server classifies under another is seen by
   nothing at all, which is §191 — and §234 is what it costs when the two
   lists that must agree are kept apart. */
const HIDE_SLIDES     = R.HIDE_SLIDES;
const UNIT_FOUNDATION = ["aspiration", "endInMind", "clauses"];
/* `pend` is §145's pending-fill marks — known here so a mark the gap pass
   did not accept falls to the PLAN comparison (office-only) rather than to
   `unknown`, which would be true but would name the wrong screen. */
const UNIT_KNOWN      = UNIT_CONFIG.concat(UNIT_FOUNDATION,
  ["ukey", "weight", "perf", "keyObjectives", "swot", "items", "pend", HIDE_SLIDES]);

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

/* THE SAME ROWS IN A DIFFERENT ORDER IS NOT THE SAME CHANGE AS DIFFERENT ROWS
   (§101). Both fail `same(idsOf(a), idsOf(b))`, because that comparison is
   ordered — which is exactly why every drag a unit head made was classified as
   authoring the plan and refused on save, silently, while the rows moved on
   screen (§94.3 recorded it; this is the other half of giving it back).

   Answered by SET rather than by sorting the two arrays and comparing: a list
   that somehow held the same id twice would sort-compare equal to a list that
   held it twice in the other order, and a reorder is the one classification
   where a duplicate id must NOT be waved through. Null ids are the group's six
   objectives, which have never had them (§96.4) — an all-null pair cannot be
   told apart, so it is never called a reorder. */
function reordered(sList, iList) {
  const a = idsOf(sList), b = idsOf(iList);
  if (a.length !== b.length || a.length === 0) return false;
  if (a.every(function (x) { return x == null; })) return false;
  if (same(a, b)) return false;                       /* nothing moved */
  const count = {};
  a.forEach(function (x) { count[String(x)] = (count[String(x)] || 0) + 1; });
  for (let i = 0; i < b.length; i++) {
    const k = String(b[i]);
    if (!count[k]) return false;                      /* a row arrived or left */
    count[k]--;
  }
  return true;
}
function byId(list) {
  const m = {};
  (list || []).forEach(function (x) { if (x && x.id !== undefined) m[x.id] = x; });
  return m;
}

/* ── A ROW NOTHING CAN NAME IS A ROW NOTHING CAN AUTHORISE (§191) ──
   `byId` drops a row with no id — correctly, because two rows sharing
   `undefined` are not one row — and that is exactly how the hole opened: a
   list of them produced an EMPTY map, the comparison loop never ran, and
   every change to those rows fell out of the classifier as no change at all.
   Measured before this was written: with the ids stripped, a VIEW-ONLY unit
   head could rewrite a key objective, a pillar, a measure and a tactic, and
   all four saves were accepted. With the ids present all four are refused.

   §42 promises that an unclassified change is the SMO's. This is the one
   place that promise was not kept, and it failed OPEN.

   THREE THINGS COUNT AS UNIDENTIFIED, because each leaves a row unjudged:
   a missing id, a null one (which `byId` keeps under the string "null", so
   a whole list of them collapses onto one entry — measured), and a DUPLICATE,
   where the second row silently takes the first one's place in the map. §96.2
   fixed a minter that produced duplicates; this is the other end, and it does
   not assume that fix has always been in place.

   IT IS NEVER MATCHED BY POSITION (§48). Position is not identity — one row
   inserted and everything after it reads as edited — so a list that cannot be
   matched is judged AS A WHOLE: byte-identical costs nobody anything, and
   anything else is a plan change and the office's.

   THE COST IS STATED: on a tenant that really does hold such rows, that list
   is the office's until they open it and save once, which mints the ids
   (`mintRowId`, `renumberUnit`). Nothing else about the plan is affected —
   every other list is judged exactly as before. */
function identified(list) {
  const seen = {};
  return (list || []).every(function (x) {
    if (!x || x.id === undefined || x.id === null || x.id === "") return false;
    if (seen[x.id]) return false;
    seen[x.id] = 1;
    return true;
  });
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
  const add = function (kind, target, what, rows, claims, ctx) {
    out.push({ kind: kind, target: target || null, what: what,
               rows: rows || null, claims: claims || null,
               /* §177: WHERE THE ROW SITS, for the bounded fill roles. Built
                  from the STORED graph and nowhere else (§42) -- a project
                  whose Owner the incoming save has just rewritten must not be
                  what decides whether that save was allowed. */
               ctx: ctx || null,
               ids: rows ? uniq(rows.map(function (r) { return r.id; })) : null });
  };

  /* — top level — */
  TOP_SETUP.forEach(function (k) {
    if (same(stored[k], incoming[k])) return;
    /* ── TWO OF THE THIRTEEN ARE NOT ORDINARY SETUP (§89) ────────────
       `access` is who may do what, and a save that rewrites it is a save that
       rewrites who may authorise saves — the SMO team holds Setup at edit
       precisely so they can run every other page here, so classifying this
       one with them would hand them the matrix.

       `people` carries the register, and REMOVING a row from it is a delete
       whichever screen it came from. Adding and amending stay ordinary setup:
       the office maintains the register, it just does not destroy rows. */
    if (k === "access") { add("access", null, "who may do what"); return; }
    if (k === "people") {
      const gone = (stored.people || []).filter(function (sp) {
        return !(incoming.people || []).some(function (ip) { return ip.key === sp.key; });
      });
      if (gone.length)
        add("destroy", null, (gone.length === 1 ? "a person" : gone.length + " people") +
            " removed from the register (" +
            gone.map(function (x) { return x.name || x.key; }).join(", ") + ")");
      /* ── THE REGISTER CARRIES THE SEAT, SO IT CARRIES THE MATRIX (§89) ──
         Found by the check, not by reading: an SMO team member holds the
         register at edit, and `people[].role` is where super / smoteam / gceo
         / cceo are STORED (§33) — so writing their own row made them a Super
         user without ever opening Roles & access. A role that cannot edit the
         matrix but can promote itself has not been restricted, it has been
         inconvenienced.

         A seat is therefore classified as `access`, whichever screen moved it.
         Everything else about a row — name, address, employee number, where
         they sit — stays ordinary setup, which is the register's day job. */
      const seatMoved = [];
      (incoming.people || []).forEach(function (ip) {
        const sp = (stored.people || []).filter(function (x) { return x.key === ip.key; })[0];
        const was = (sp && sp.role) || "", now = ip.role || "";
        if (sp && was !== now)
          seatMoved.push((ip.name || ip.key) + ": " + (was || "no seat") + " \u2192 " + (now || "no seat"));
      });
      (incoming.people || []).forEach(function (ip) {
        if (!(stored.people || []).some(function (x) { return x.key === ip.key; }) && ip.role)
          seatMoved.push((ip.name || ip.key) + " added holding " + ip.role);
      });
      if (seatMoved.length)
        add("access", null, "a seat role moved (" + seatMoved.join("; ") + ")");

      /* The rest of the row, with the seat taken out of the comparison on both
         sides so it is not refused twice for one edit. */
      const bare = function (list) {
        return (list || []).map(function (p) { return omit(p, ["role"]); });
      };
      const kept = (stored.people || []).filter(function (sp) {
        return (incoming.people || []).some(function (ip) { return ip.key === sp.key; }); });
      if (!same(bare(kept), bare(incoming.people))) add("setup", null, "the register");
      return;
    }
    add("setup", null, k);
  });
  TOP_CYCLE.forEach(function (k) {
    if (!same(stored[k], incoming[k])) add("cycle", null, k);
  });

  /* — the cycle, and the focus marks inside it — */
  const sc = stored.cycle || {}, ic = incoming.cycle || {};
  if (!same(sc.focus, ic.focus)) add("focus", null, "focus measures");
  if (!same(omit(sc, ["focus"]), omit(ic, ["focus"]))) add("cycle", null, "the reporting cycle");

  /* — the review: submitting, its note and its picture slides all belong to
       whoever is reporting.

       PICTURE SLIDES ARE NOT A NEW RULE (§50.5). A picture put in front of the
       board speaks for the whole unit, which is the same act as submitting and
       the same act as the note — so it is classified with them rather than
       given a classification of its own. A contributor limited to their own
       lines is refused all three by the one check below, and a locked cycle
       stops taking all three together. `slides` is keyed by target exactly as
       `note` is, which is what lets it join this loop instead of needing a
       second one. */
  const sr = stored.review || {}, ir = incoming.review || {};
  /* §220: `parked` joins them. Saving a draft now CLOSES the report until
     it is reopened, so it speaks for the whole unit exactly as submitting
     does — same classification, same rule, no second answer (§53.5). */
  /* §234: THE ONE LIST — the differ splits exactly these per target, so a
     field added here without joining REVIEW_PER_TARGET would travel whole
     and carry every function's copy of itself into one person's save. */
  const perTarget = DIFF.REVIEW_PER_TARGET;
  const WHAT = { submitted: "submitting the report", parked: "closing the report",
                 note: "the report's note",
                 slides: "the review's picture slides" };
  perTarget.forEach(function (field) {
    const a = sr[field] || {}, b = ir[field] || {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (t) {
      if (same(a[t], b[t])) return;
      if (out.some(function (c) { return c.kind === "reportState" && c.target === t; })) return;
      add("reportState", t, WHAT[field]);
    });
  });
  if (!same(omit(sr, perTarget), omit(ir, perTarget))) add("cycle", null, "the review");

  /* — the group's own strategy — */
  const sg = stored.group || {}, ig = incoming.group || {};
  GROUP_OWN.forEach(function (k) {
    if (same(sg[k], ig[k])) return;
    /* Only a field that IS a value carries a row: the group's lists (its
       objectives, its themes, its weighting) are judged by their own rows. */
    const scalar = function (v) { return v == null || typeof v !== "object"; };
    add("group", "group", k, scalar(sg[k]) && scalar(ig[k])
        ? fieldRows("group", (sg.org && sg.org.name) || "The group", sg, ig, [k]) : null);
  });
  /* The tenant's colours are the BRANDING page, which is Setup — a brand is
     not a screen preference and must not be changeable by whoever happens to
     be looking. */
  if (!same(sg.branding, ig.branding)) add("setup", null, "the tenant's branding");
  /* The group's mark (§259). SETUP for branding's own reason, and NAMED
     rather than left to the unknown bucket below, so a refusal sends the
     person to Branding instead of reporting "the group's logo" (§16.7). */
  if (!same(sg.logo, ig.logo)) add("setup", null, "the group's mark");
  /* Figure sets are SETUP: who is master of which numbers is the SMO's to
     decide, and a set that could name its own owner could name anybody. */
  if (!same(sg.sets, ig.sets)) add("setup", null, "figure sets");
  /* Claim requests. Anybody who may fill a set may ASK for a figure another
     set holds — that is the whole point of the request. Everything else about
     the list is the SMO's: answering one, editing one, removing one. */
  if (!same(sg.claims, ig.claims)) addClaimChange(sg.claims, ig.claims, add);
  /* Whether unit custodians may name people against their own figures (spec
     008 §3B). SETUP: it is the switch that decides whether a whole second way
     of assigning exists, so it is the SMO's — and a switch anybody could flip
     would be no switch at all. */
  if (!same(sg.naming, ig.naming))
    add("setup", null, "whether unit custodians may name who enters a figure");
  /* The BU list (§54.1, spec 011): the client's own names for parts of the
     business, and which unit, function or company each one opens. SETUP, and
     not a soft one — a row's target decides where every person carrying that
     name is attached the next time an employee file lands, so anybody who
     could re-point one could walk a whole department into a unit whose plan
     they wanted read. */
  /* Whether focus measures exist at all (§102). SETUP, deliberately NOT the
     `focus` kind beside it: marking a measure is the CEO's (§37), and turning
     the whole feature off for the tenant is not a bigger version of marking
     one — it is the same argument as `naming` directly above. */
  if (!same(sg.focusOff, ig.focusOff))
    add("setup", null, "whether focus measures are used at all");
  if (!same(sg.mainbus, ig.mainbus)) add("setup", null, "the BU list");
  /* Communication (§72): the display name on outgoing mail, the reply-to and
     the footer. SETUP for the same reason branding is - it is what the
     organisation looks like to somebody who is not in the platform - and named
     here rather than left to the unknown bucket so a refusal sends the person
     to Setup rather than reporting "the group's comms". */
  if (!same(sg.comms, ig.comms)) add("setup", null, "the communication settings");
  /* The knowledge base's tenant overlay (§140): rewritten and added answers.
     SETUP, like comms — it is what the platform says on the office's behalf —
     and named here so a refusal sends somebody to the page with the pen. */
  if (!same(sg.kb, ig.kb)) add("setup", null, "the knowledge base's answers");
  collectCapabilities(sg.capabilities, ig.capabilities, add);
  const gExtra = GROUP_OWN.concat(["capabilities", "branding", "sets", "claims",
                                   "naming", "focusOff", "mainbus", "comms", "kb", "logo"]);
  /* NAMED, not "the group". A refusal that cannot be diagnosed is a bug
     report addressed to nobody — and the first thing this bucket caught was a
     field the browser invented and the database never held. */
  const gUnknown = uniq(Object.keys(omit(sg, gExtra)).concat(Object.keys(omit(ig, gExtra))))
    .filter(function (k) { return !same(sg[k], ig[k]); });
  if (gUnknown.length) add("unknown", "group", "the group's " + gUnknown.join(", "));

  /* — the supporting functions — */
  const fnKeys = uniq(Object.keys(stored.functions || {}).concat(Object.keys(incoming.functions || {})));
  if (!same(Object.keys(stored.functions || {}).sort(),
            Object.keys(incoming.functions || {}).sort()))
    add("setup", null, "the list of supporting functions");
  fnKeys.forEach(function (k) {
    collectFunction(k, (stored.functions || {})[k], (incoming.functions || {})[k], add, w);
  });

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

/* Append one row list to another, tolerating the null `splitRows` hands over
   when a plan change has no addressable row (§184). */
function keep(into, rows) { (rows || []).forEach(function (r) { into.push(r); }); }

function uniq(a) {
  const seen = {}, out = [];
  a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
  return out;
}

/* A list of rows with ids, split into what is reporting and what is plan.
   A change to WHICH rows exist is always plan: adding or removing a measure
   is authoring, not reporting. */
function splitRows(sList, iList, fields, onReport, onPlan, onArrange) {
  /* §191: FAIL CLOSED BEFORE ANYTHING ELSE IS ASKED. Without this the two
     maps below come back empty or collapsed and the loop finds nothing to
     classify, which reads as "no change" and is allowed. */
  if (!identified(sList) || !identified(iList)) {
    if (!same(sList, iList)) onPlan();
    return;
  }
  if (!same(idsOf(sList), idsOf(iList))) {
    if (onArrange && reordered(sList, iList)) { onArrange(); return; }
    onPlan(); return;
  }
  const sm = byId(sList), im = byId(iList);
  const moved = [];
  /* §184: THE PLAN HALF NAMES ITS ROWS TOO. `onPlan` was a bare signal, so a
     refused plan change said "a project's milestones" and nothing about
     WHICH — and with nothing to name, the only way past a refusal was to
     throw the whole save away. These rows are the address the client puts
     back, and the sentence the refusal reads out.

     `planMoved` STAYS THE GATE, byte for byte. Classification is decided by
     the same omit-compare it always was; the rows are extra. Deriving the
     gate from the row list instead would quietly WIDEN what is allowed —
     `same()` is stringify-based, so a key-ORDER difference (which is what
     Postgres jsonb hands back) trips that compare and produces no differing
     key, and a save that used to be refused would start passing. §42 fails
     closed, so a change with no addressable rows stays a refusal that simply
     cannot be undone for you. */
  const planRows = [];
  let planMoved = false;
  Object.keys(sm).forEach(function (id) {
    const a = sm[id], b = im[id];
    fields.forEach(function (f) {
      if (!same(a[f], b[f])) moved.push({ id: id, name: a.name || null, field: f,
                                          /* `had` separates "it held null" from "the key
                                             was not there" — putting a null back where
                                             nothing was is a change of its own, and would
                                             be refused a second time (§184). */
                                          had: a[f] !== undefined,
                                          from: a[f] === undefined ? null : a[f],
                                          to: b[f] === undefined ? null : b[f] });
    });
    if (same(omit(a, fields), omit(b, fields))) return;
    planMoved = true;
    uniq(Object.keys(a).concat(Object.keys(b))).forEach(function (k) {
      if (fields.indexOf(k) > -1 || same(a[k], b[k])) return;
      planRows.push({ id: id, name: a.name || null, field: k,
                      had: a[k] !== undefined,
                      from: a[k] === undefined ? null : a[k],
                      to: b[k] === undefined ? null : b[k] });
    });
  });
  if (moved.length) onReport(moved);
  if (planMoved) onPlan(planRows.length ? planRows : null);
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

/* ── FILL THE GAPS: THE PASS THAT RUNS BEFORE THE DIFF (§145, spec 023) ──
   A fill-grant holder writes only where the plan holds nothing, and the
   write stays PENDING (`row.pend[field] = {by, at}`) until the office
   confirms it. This pass walks the gap fields (`R.GAP_FIELDS` — the one
   definition the screen and the deck also read), classifies each accepted
   transition, and applies it to a CLONE of the stored side — so the
   existing classifiers below then see no difference and everything the
   pass did NOT accept falls through and is judged exactly as before,
   which is the fail-closed direction (§42.2's shape: the stored side is
   never mutated, and nothing here reads the incoming world to decide).

   The transitions, per field (s stored, i incoming, sp/ip the marks):
     blank(s) ∧ ¬sp ∧ value(i) ∧ ip  → FILL          → gapFill
     sp ∧ ip ∧ anything moved        → AMEND          → gapFill
     sp ∧ ¬ip ∧ blank(i)             → UNFILL (undo)  → gapFill
     sp ∧ ¬ip ∧ value(i)             → CONFIRM        → gapConfirm
   Anything else — filling with no mark (the office's plain edit), marking
   a settled value pending, touching a settled value — is left alone and
   classifies as plan, office-only. `quarters` is virtual and moves q1–q4
   as one: only a tactic with NO quarter is a gap (§128, §119.1). */
const GAP_Q = ["q1", "q2", "q3", "q4"];

/* KEY ORDER IS NOT CONTENT. `same()` is stringify-based, and two things
   reorder a pend object's keys without changing a byte of meaning: this
   pass rebuilding the map field by field, and POSTGRES ITSELF — jsonb
   stores {by, at} back as {at, by} (measured on a real 16). A mark compared
   order-sensitively reads as an amend that never happened, so marks are
   compared canonically here and the clone takes the incoming spelling. */
function canonJson(v) {
  if (Array.isArray(v)) return "[" + v.map(canonJson).join(",") + "]";
  if (v && typeof v === "object")
    return "{" + Object.keys(v).sort().map(function (k) {
      return JSON.stringify(k) + ":" + canonJson(v[k]); }).join(",") + "}";
  return JSON.stringify(v === undefined ? null : v);
}
function sameCanon(a, b) { return canonJson(a) === canonJson(b); }

/* §249.3: KEY ORDER IS NOT CONTENT — AND IT IS NOT ONLY `pend`.
   The repair below was written for the marks (§145: Postgres jsonb stores
   {by, at} back as {at, by}); the same fault sits one level up, on the ROW,
   and it refuses honest saves.

   `same()` is stringify-based, so it is order-sensitive. This pass clears what
   it classifies by ASSIGNING onto the stored clone, which APPENDS any key the
   stored row did not have — while the incoming row carries those keys in its
   own order. Fill two fields whose keys are absent from the stored row in ONE
   post and the clone ends up spelling the same row differently: the residual
   diff sees a change it cannot attribute, classifies it `unitPlan`, and the
   whole save is refused — costing every fill in it (§184, the CX refusal).

   MEASURED, AND IT PREDATES §249: on the build before it, a filler writing an
   owner and a collaborator together is REFUSED when both keys are absent and
   ACCEPTED when both are present-but-empty. It was rare because an imported
   plan writes "" for the fields it does not fill, so the keys usually exist —
   and §249 makes it the common case, because §248's five fields are absent on
   every tactic written before them and two of them are now asked for.

   THE GUARD IS THE WHOLE SAFETY ARGUMENT: `sameCanon` is a deep canonical
   comparison, so this only ever re-spells rows whose CONTENT is already
   identical. A real difference anywhere in the row leaves it alone, and the
   narrower `pend` repair stays for exactly that case. */
function respell(sRow, iRow) {
  Object.keys(sRow).forEach(function (k) { delete sRow[k]; });
  Object.keys(iRow).forEach(function (k) {
    sRow[k] = JSON.parse(JSON.stringify(iRow[k]));
  });
}

function gapFieldPass(kind, sRow, iRow, target, add, what, ctx) {
  gapFields(kind, sRow, iRow, target, add, what, ctx);
  if (sRow.pend && iRow.pend && !same(sRow.pend, iRow.pend) &&
      sameCanon(sRow.pend, iRow.pend))
    sRow.pend = JSON.parse(JSON.stringify(iRow.pend));
  if (!same(sRow, iRow) && sameCanon(sRow, iRow)) respell(sRow, iRow);
}

function gapFields(kind, sRow, iRow, target, add, what, ctx) {
  /* §205: THE FILLABLE LIST, NOT THE COUNTED ONE. They were the same list
     until §187 took collaborators out of GAP_FIELDS to stop the band nagging
     about an optional blank — which also, silently, took away the only way
     the screen's offer could ever be accepted here. */
  (R.GAP_FILLABLE[kind] || []).forEach(function (f) {
    const vq = f === "quarters";
    const sMark = (sRow.pend || {})[f], iMark = (iRow.pend || {})[f];
    /* §249.2: A GAP MOVED TO ANOTHER GAP IS STILL THE FILLER'S. §248 lets the
       office — and now a filler — choose what an outcome is measured in before
       deciding how much of it, so `outTarget` legitimately holds "%" on the way
       to "90%". That value is non-blank and still EMPTY by the gap rule, so the
       screen writes it WITHOUT a mark (a marked field reads as answered, §249.2
       on the client) — and with no mark on either side this pass used to skip
       the field entirely and the change fell through to `unitPlan`, refusing
       the whole save and costing every other fill in the same post (§184, the
       CX refusal exactly).
       NOTHING IS GAINED BY IT: both sides are values the platform cannot use,
       so the row is still counted Missing, still not scored, and still refuses
       Submit. What is allowed is moving between two ways of holding nothing. */
    if (!sMark && !iMark) {
      const sE = vq ? R.gapEmpty(f, sRow) : R.gapEmpty(f, sRow);
      const iE = vq ? R.gapEmpty(f, iRow) : R.gapEmpty(f, iRow);
      const moved = vq ? !same(pick(sRow, GAP_Q), pick(iRow, GAP_Q))
                       : !same(sRow[f], iRow[f]);
      if (!sE || !iE || !moved) return;
      add("gapFill", target, what, [{ id: sRow.id || null, name: sRow.name || null,
        field: f, had: sRow[f] !== undefined,
        from: sRow[f] === undefined ? null : sRow[f],
        to:   iRow[f] === undefined ? null : iRow[f] }], null, ctx || {});
      if (iRow[f] === undefined) delete sRow[f];
      else sRow[f] = JSON.parse(JSON.stringify(iRow[f]));
      return;
    }
    /* §184: `gapEmpty` and not `gapBlank`. For the three fields that hold a
       TIME, a value the platform cannot read is a gap — so correcting
       `30/09/2026` on a milestone is FILLING, which is what the screen now
       offers, and one definition answers both sides. Asking gapBlank here
       while the screen asked gapEmpty would be §42's drift with the sign
       reversed: a control drawn and a save refused. */
    const sBlank = R.gapEmpty(f, sRow);
    const iBlank = R.gapEmpty(f, iRow);
    const valueSame = vq ? same(pick(sRow, GAP_Q), pick(iRow, GAP_Q))
                         : same(sRow[f], iRow[f]);
    let kindOut = null;
    if (sBlank && !sMark && !iBlank && iMark) kindOut = "gapFill";
    /* §201.2: A UNIT ARRIVING ON A BARE NUMBER IS A FILL. `30` → `30%`, the
       number byte-identical, marked pending like any other fill — without
       this line it fell through to plan and the custodian met the CX
       refusal one field over (§184). The UNDO is its own transition below,
       or taking the unit back off would classify as the office's CONFIRM
       and the filler could put it on and never take it off (§110's rule:
       either way out of a control must work). */
    else if (!sBlank && !sMark && !iBlank && iMark &&
             R.unitAddedOnly(f, sRow[f], iRow[f])) kindOut = "gapFill";
    else if (sMark && iMark) {
      if (valueSame && sameCanon(sMark, iMark)) return; /* untouched */
      kindOut = "gapFill";
    }
    else if (sMark && !iMark && iBlank) kindOut = "gapFill";
    else if (sMark && !iMark && !iBlank &&
             R.unitAddedOnly(f, iRow[f], sRow[f])) kindOut = "gapFill";
    else if (sMark && !iMark && !iBlank) kindOut = "gapConfirm";
    if (!kindOut) return;                               /* falls through to plan */
    add(kindOut, target, what, [{ id: sRow.id || null, name: sRow.name || null,
      field: f, had: vq ? true : sRow[f] !== undefined,
      from: vq ? pick(sRow, GAP_Q) : (sRow[f] === undefined ? null : sRow[f]),
      to:   vq ? pick(iRow, GAP_Q) : (iRow[f] === undefined ? null : iRow[f]) }],
      null, ctx || {});
    /* Apply to the clone, so the residual diff sees nothing. */
    if (vq) GAP_Q.forEach(function (q) {
      if (iRow[q] === undefined) delete sRow[q];
      else sRow[q] = JSON.parse(JSON.stringify(iRow[q]));
    });
    else if (iRow[f] === undefined) delete sRow[f];
    else sRow[f] = JSON.parse(JSON.stringify(iRow[f]));
    if (iMark) { sRow.pend = sRow.pend || {}; sRow.pend[f] = JSON.parse(JSON.stringify(iMark)); }
    else if (sRow.pend) {
      delete sRow.pend[f];
      if (!Object.keys(sRow.pend).length) delete sRow.pend;
    }
  });
}

/* `ctxOf` answers WHERE the stored row sits, for the bounded fill roles
   (§177). Omitted means "inside no row", which closes every bounded role —
   the safe way round, and the same default the screen takes. */
function gapRows(kind, sList, iList, target, add, what, ctxOf) {
  /* §191: AND THE GAP PASS STOPS TOO. It clears what it classifies from the
     clone, so running it over a list whose rows cannot be told apart would
     wipe one row's change while crediting it to another. `splitRows` then
     refuses the list as a whole, which is the right answer and the stated
     cost: a filler cannot fill a list the platform cannot name. */
  if (!identified(sList) || !identified(iList)) return;
  const sm = byId(sList), im = byId(iList);
  Object.keys(sm).forEach(function (id) {
    if (im[id]) gapFieldPass(kind, sm[id], im[id], target, add, what,
                             ctxOf ? ctxOf(sm[id]) : {});
  });
}

/* The unit-shaped half: aspiration on the unit itself, the key objectives,
   and each pillar's measures and tactics. Returns the clone. */
function gapPassUnit(target, su, iu, add) {
  const s2 = JSON.parse(JSON.stringify(su));
  gapFieldPass("unit", s2, iu, target, add, "the aspiration");
  gapRows("ko", s2.keyObjectives, iu.keyObjectives, target, add, "a key objective");
  const sm = byId(s2.items), im = byId(iu.items || []);
  Object.keys(sm).forEach(function (id) {
    if (!im[id]) return;
    /* §177: the pillar's OWN owner, off the stored pillar, so a pillar owner
       fills the rows of the pillar that names them and nobody else's. */
    const pctx = function (row) { return { pillarOwner: sm[id].owner, row: row }; };
    gapRows("measure", sm[id].measures, im[id].measures, target, add, "a key measure", pctx);
    gapRows("tactic", sm[id].tactics, im[id].tactics, target, add, "a tactic", pctx);
  });
  return s2;
}

/* An ADDED open request is its own kind; anything else about the list — an
   answer, an edit, a removal — is the SMO's. Split here rather than in the
   verdict, because "what changed" and "who may change it" are different
   questions and mixing them is how a classifier grows holes. */
function addClaimChange(before, after, add) {
  const was = before || [], now = after || [];
  const byId = {};
  was.forEach(function (c) { byId[c.id] = c; });
  const added = now.filter(function (c) { return !byId[c.id]; });
  const rest = now.filter(function (c) { return !!byId[c.id]; });
  /* Removing one, or changing one that already existed, is not a request. */
  if (was.length !== rest.length || !same(was, rest)) {
    add("setup", null, "claim requests");
  }
  if (added.length) add("claimRequest", null, "a claim request", null, added);
}

/* §262.3: A FOUNDATION TEXT IS A FIELD WITH A BEFORE AND AN AFTER. The unit's
   own words, its SWOT, the group's own words and a capability's definition
   were logged as a sentence with no rows, so History drew the line and could
   not say what moved or put it back. The row is the SUBJECT itself (its id is
   the unit key, "group", or the capability's id) and the field is named —
   a SWOT quadrant as `swot.s`, so one reader tells a list from a row field. */
function fieldRows(id, name, a, b, fields, prefix) {
  const rows = [];
  fields.forEach(function (f) {
    const av = prefix ? (a || {})[f] : a[f], bv = prefix ? (b || {})[f] : b[f];
    if (same(av, bv)) return;
    rows.push({ id: id, name: name || null, field: (prefix || "") + f,
                had: av !== undefined, from: av === undefined ? null : av,
                to: bv === undefined ? null : bv });
  });
  return rows;
}

function collectUnit(key, su, iu, add, w) {
  if (!su || !iu) { add("setup", key, "a business unit was added or removed"); return; }

  /* §145: extract and classify the pending-fill transitions first, applied
     to a clone of the stored side so everything below judges the residue. */
  su = gapPassUnit(key, su, iu, add);

  /* §256, ahead of the settings compare and deliberately not part of it:
     `HIDE_SLIDES` is in UNIT_KNOWN and in no other list, so it is neither a
     setting nor unknown, and a change to it produces exactly one sentence. */
  if (!same(su[HIDE_SLIDES], iu[HIDE_SLIDES]))
    add("deckHide", key, "which slides the review shows");

  if (!same(pick(su, UNIT_CONFIG), pick(iu, UNIT_CONFIG))) add("setup", key, "the unit's settings");
  if (!same(pick(su, UNIT_FOUNDATION), pick(iu, UNIT_FOUNDATION)))
    add("unitFoundation", key, "the unit's own words", fieldRows(key, su.name || key, su, iu, UNIT_FOUNDATION));
  if (!same(su.swot, iu.swot))
    add("unitAnalysis", key, "the unit's SWOT", fieldRows(key, su.name || key, su.swot, iu.swot, ["s", "w", "o", "t"], "swot."));

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
    function (rows) { add("unitPlan", key, "the unit's key objectives", rows); },
    function () { add("arrange", key, "the order of the unit's key objectives"); });

  /* Pillars, and the measures and tactics under them. */
  /* §191: THE PILLAR LIST IS ASKED THE SAME QUESTION AS EVERY OTHER LIST.
     This walk builds its own maps rather than going through `splitRows`, so
     the guard there did not reach it — measured: with the pillar ids stripped
     a view-only unit head could still rewrite a pillar's name and weight
     while the other three lists were correctly refused. A fix that closes
     three of four holes is the one that gets trusted. */
  if (!identified(su.items) || !identified(iu.items)) {
    if (!same(su.items, iu.items)) add("unitPlan", key, "the unit's pillars");
  } else if (!same(idsOf(su.items), idsOf(iu.items))) {
    if (reordered(su.items, iu.items)) add("arrange", key, "the order of the unit's pillars");
    else add("unitPlan", key, "the unit's pillars");
  } else {
    const sm = byId(su.items), im = byId(iu.items);
    const moved = [];
    /* The rows a refused plan change would put back (§184). A change to the
       PILLAR itself carries no row address — its id is the pillar's, not a
       row's — so it leaves this empty and the refusal stays un-undoable. */
    const planRows = [];
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
        function (rows) { planMoved = true; keep(planRows, rows); });
      splitRows(a.tactics, b.tactics, REPORT.tactic,
        function (rows) { rows.forEach(function (x) { moved.push(x); }); },
        function (rows) { planMoved = true; keep(planRows, rows); });
    });
    if (moved.length) add("unitReporting", key, "reported figures", moved);
    if (planMoved) add("unitPlan", key, "the unit's plan", planRows.length ? planRows : null);
  }

  const uUnknown = uniq(Object.keys(omit(su, UNIT_KNOWN)).concat(Object.keys(omit(iu, UNIT_KNOWN))))
    .filter(function (k) { return !same(su[k], iu[k]); });
  if (uUnknown.length) add("unknown", key, "the unit's " + uUnknown.join(", "));
}

/* ── A supporting function (§59) ───────────────────────────────────────
   It used to be ONE line: any change anywhere in `functions` classified as
   Setup. That was right while a function was only a name and two pointers —
   and wrong the moment spec 010 let one plan in PILLARS, because its plan and
   its reported figures then lived on the function too. A custodian could open
   the Report page and every save was refused: Merchandising could not be
   reported on at all.

   THE PILLARS ARE CLASSIFIED BY collectUnit(), the unit's own classifier, run
   against the `fn:<key>` target. Not a second copy of it — the verdict already
   understands a function target (`unitReporting` asks `edits(…, "fn", t)`), so
   the whole of §42's figure/note/plan split arrives for free and cannot drift
   away from the unit's. What is left here is the function's SETTINGS, which
   are Setup exactly as they always were. */
const FN_SETUP = ["name", "navName", "codePrefix", "active", "head", "custodian",
                  "format", "under", "logo"];
/* Everything collectUnit() speaks for, plus the settings above. A field on a
   function that is in neither list is unknown and falls to the SMO — the
   fall-through §42 exists for. */
const FN_KNOWN = FN_SETUP.concat(UNIT_FOUNDATION,
  ["key", "items", "keyObjectives", "swot", "perf", "exec", "pend"]);
/* §256: everything FN_KNOWN speaks for, plus the field classified on its own.
   It is a SECOND list because the two questions genuinely differ — FN_KNOWN
   decides what the projects-branch compare calls "a supporting function's
   settings", and a hidden slide is not one of those, while the unknown sweep
   must still not report it. Without the split it would produce two sentences
   for one press, or one that names the wrong screen. */
const FN_SEEN = FN_KNOWN.concat(HIDE_SLIDES);

function collectFunction(key, sf, iff, add, w) {
  if (!sf || !iff) { add("setup", null, "a supporting function was added or removed"); return; }
  if (same(sf, iff)) return;

  if (!same(pick(sf, FN_SETUP), pick(iff, FN_SETUP)))
    add("setup", null, "a supporting function's settings");

  /* Only where it plans in pillars, and read from the STORED side: a save that
     switched `format` and rewrote the plan in one request would otherwise be
     asking the incoming world whether it was allowed (§42.2). A function that
     plans in projects keeps its plan in its capabilities, which
     collectCapabilities() has always classified. */
  const target = "fn:" + key;
  /* §214: THE FUNCTION'S OWN DEFINITION IS A GAP, on a clone exactly as the
     capability side runs it. `def` stays OUT of FN_KNOWN deliberately: what
     the pass does not classify falls through to the unknown sweep below and
     is the office's (§42), which is the safe way round — putting it in
     FN_KNOWN would leave a non-fill change to it seen by nothing at all on a
     pillars function, and §191 is what happens when a change reaches nobody. */
  const sf2 = JSON.parse(JSON.stringify(sf));
  gapFieldPass("cap", sf2, iff, target, add, "what the function is");

  /* §256. Classified HERE and not inside collectUnit(), because `asUnit()`
     builds a fresh object from named fields and would drop it on the way —
     so a pillars function's hidden slides would reach the unit pass as no
     change at all, which is §191's fault exactly: seen by nothing, and
     therefore allowed. */
  if (!same(sf[HIDE_SLIDES], iff[HIDE_SLIDES]))
    add("deckHide", target, "which slides the review shows");

  if (String(sf.format) === "pillars") {
    collectUnit(target, asUnit(sf2, target), asUnit(iff, target), add, w);
  } else if (!same(pick(sf2, FN_KNOWN), pick(iff, FN_KNOWN))) {
    /* Pillars on a projects function are not its plan — nothing renders them —
       so a change to them is not reporting; it is the SMO's. */
    add("setup", null, "a supporting function");
  }

  const fUnknown = uniq(Object.keys(omit(sf2, FN_SEEN)).concat(Object.keys(omit(iff, FN_SEEN))))
    .filter(function (k) { return !same(sf2[k], iff[k]); });
  if (fUnknown.length) add("unknown", target, "the function's " + fUnknown.join(", "));
}

/* The same shape collectUnit() reads, with the settings left out — they are
   classified above, and passing them through would report every rename twice.
   Mirrors `fnAsUnit()` in the platform, which is what draws these pages. */
function asUnit(f, ukey) {
  const u = { ukey: ukey, items: f.items || [], keyObjectives: f.keyObjectives || [],
              swot: f.swot || {}, aspiration: f.aspiration || "",
              endInMind: f.endInMind || "", clauses: f.clauses || [] };
  /* §145: the pending-fill marks ride through, or a function's aspiration
     fill would vanish from the compare and land on `unknown`. */
  if (f.pend !== undefined) u.pend = f.pend;
  return u;
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
    let a = sm[id];
    const b = im[id];
    if (same(a, b)) return;
    if (!same(pick(a, CAP_SETUP), pick(b, CAP_SETUP))) add("setup", null, "a capability's name or function");
    const target = "fn:" + (a.fn || "");
    /* §145: the gap pass, on a clone, exactly as collectUnit runs it — a
       capability's key objectives and its projects' front matter are the
       fillable rows on this side of the product. */
    a = JSON.parse(JSON.stringify(a));
    /* §214: the definition is a gap, so a blank one being written is a FILL
       and not an authoring change — the same transition on both function
       formats (see collectFunction), because since §213 it is one page. The
       pass runs BEFORE the `def` comparison below, which then sees the
       cleared clone and stays the office's for every other kind of edit. */
    gapFieldPass("cap", a, b, target, add, "what a capability is");
    gapRows("capko", a.keyObjectives, b.keyObjectives, target, add, "a capability key objective");
    gapRows("project", a.projects, b.projects, target, add, "a project's front matter",
            function (pr) { return { project: pr }; });
    /* §177: AND THE ROWS INSIDE A PROJECT. An outcome's target and a
       milestone's owner and due date are gaps now, so the pass has to reach
       them BEFORE splitRows compares the same lists below — a fill left
       unclassified here falls through to capPlan and is refused as though the
       filler had rewritten the plan. Matched by id against the stored project,
       and each row carries its project as context, which is what bounds a
       project owner to their own. */
    (function () {
      const sp = byId(a.projects), ip = byId(b.projects);
      Object.keys(sp).forEach(function (pid) {
        if (!ip[pid]) return;
        const pctx = function (row) { return { project: sp[pid], row: row }; };
        gapRows("outcome", sp[pid].outcomes, ip[pid].outcomes, target, add,
                "a project outcome's target", pctx);
        gapRows("milestone", sp[pid].milestones, ip[pid].milestones, target, add,
                "a project milestone", pctx);
      });
    })();
    if (!same(a.def, b.def)) add("capPlan", target, "what a capability is", fieldRows(a.id, a.name, a, b, ["def"]));
    if (!same(pick(a, ["perf", "exec"]), pick(b, ["perf", "exec"]))) add("capReporting", target, "a capability's figures");

    splitRows(a.keyObjectives, b.keyObjectives, REPORT.capKO,
      function (rows) { add("capReporting", target, "capability key objective figures", rows); },
      function (rows) { add("capPlan", target, "a capability's key objectives", rows); });

    /* Projects: the brief is plan, the outcomes and milestones carry figures. */
    /* §191: THE THIRD LIST THAT BUILDS ITS OWN MAP. The sweep that found the
       pillar walk found this one too — with the project ids stripped, the
       front matter (owner, brief, stakeholders, Start and End) was writable
       by anybody, while the deliverables, outcomes and milestones INSIDE
       those same projects were correctly refused, because those go through
       `splitRows`. Three walks, one question, asked in all three now. */
    if (!identified(a.projects) || !identified(b.projects)) {
      if (!same(a.projects, b.projects)) add("capPlan", target, "a capability's projects");
    } else if (!same(idsOf(a.projects), idsOf(b.projects))) {
      add("capPlan", target, "a capability's projects");
    } else {
      const sp = byId(a.projects), ip = byId(b.projects);
      Object.keys(sp).forEach(function (pid) {
        const pa = sp[pid], pb = ip[pid];
        /* The project's own front matter — owner, brief, stakeholders and
           §179's Start and End. Named row by row (§184) so a refusal here
           can say WHICH field it would not take and put that one back. */
        const pFields = ["deliverables", "outcomes", "milestones"];
        if (!same(omit(pa, pFields), omit(pb, pFields))) {
          const pRows = [];
          uniq(Object.keys(pa).concat(Object.keys(pb))).forEach(function (k) {
            if (pFields.indexOf(k) > -1 || same(pa[k], pb[k])) return;
            pRows.push({ id: pid, name: pa.name || null, field: k,
                         had: pa[k] !== undefined,
                         from: pa[k] === undefined ? null : pa[k],
                         to: pb[k] === undefined ? null : pb[k] });
          });
          add("capPlan", target, "a project", pRows.length ? pRows : null);
        }
        splitRows(pa.deliverables, pb.deliverables, REPORT.deliverable,
          function (rows) { add("capReporting", target, "project deliverables", rows); },
          function (rows) { add("capPlan", target, "a project's deliverables", rows); });
        splitRows(pa.outcomes, pb.outcomes, REPORT.outcome,
          function (rows) { add("capReporting", target, "project outcome figures", rows); },
          function (rows) { add("capPlan", target, "a project's outcomes", rows); });
        splitRows(pa.milestones, pb.milestones, REPORT.milestone,
          function (rows) { add("capReporting", target, "project milestones", rows); },
          function (rows) { add("capPlan", target, "a project's milestones", rows); });
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

/* Every row in a unit that carries an id, with the context mayReportRow()
   reads (§147.7): the row itself and the Owner of the pillar it sits under.
   A measure's `row` still leans on its pillar's owner — §55's rule, kept so
   nothing a unit contributor could reach before the pillar-owner role
   existed is taken away by its arrival. */
function ctxOfUnit(u) {
  const out = {};
  (u && u.keyObjectives || []).forEach(function (x) { out[x.id] = { row: x }; });
  (u && u.items || []).forEach(function (p) {
    (p.measures || []).forEach(function (m) {
      out[m.id] = { row: { owner: p.owner, collaborators: m.collaborators },
                    pillarOwner: p.owner };
    });
    (p.tactics || []).forEach(function (t) {
      out[t.id] = { row: t, pillarOwner: p.owner };
    });
  });
  return out;
}
/* The same map for a function's capabilities: each reporting row with the
   project it sits inside. */
function ctxOfFn(w, fnKey) {
  const out = {};
  (w.capabilities || []).forEach(function (c) {
    if (!c || c.fn !== fnKey) return;
    (c.keyObjectives || []).forEach(function (x) { out[x.id] = { row: x }; });
    (c.projects || []).forEach(function (pr) {
      (pr.deliverables || []).concat(pr.outcomes || [], pr.milestones || [])
        .forEach(function (x) { if (x && x.id !== undefined) out[x.id] = { row: x, project: pr }; });
    });
  });
  return out;
}

function authorize(stored, incoming, person) {
  const w = R.worldOf(stored);              /* THE STORED WORLD. Never the incoming one. */
  const smo = R.isSMO(w, person);
  /* THE OFFICE, NOT ITS OWNER (§89). Reporting past a locked cycle is one of
     the things §89 named as the SMO team's job, and this file was still
     asking for a Super user — so the unit's page offered an SMO team member
     the entry boxes and every save came back refused. `smo` survives for the
     three §89 kept on the Super user alone (the matrix, destroying, and
     passwords for the office's own people). */
  const office = R.isOffice(w, person);
  const locked = !!((stored.cycle || {}).locked);
  const roleKeys = R.personRoleKeys(w, person);
  /* The register, for the refusals that have to name a person. rules.js
     answers from the WORLD, which holds no people — the key is all it can
     give, and a refusal reading "hossam" where the page read "Hossam Fahmy"
     reads as a different person. */
  const peopleByKey = {};
  (stored.people || []).forEach(function (p) { if (p && p.key) peopleByKey[p.key] = p; });
  const nameOf = function (key) {
    const p = peopleByKey[key];
    return (p && p.name) || key || "";
  };
  const changes = collect(stored, incoming, w);
  const refusals = [];
  /* ── A REFUSAL MUST NOT COST THE REST OF THE WORK (§184) ──────────
     Islam, on a strategy custodian who filled three milestone dates and
     touched a fourth the server would not take: "they lost all data they
     inputed." Nothing was wrong with the refusal — one row genuinely was
     the office's. What was wrong is that the whole graph posts together, so
     one refused row failed the whole save, and the only control on offer was
     *Discard the change and reload*, which destroyed the three good fills
     with it.

     So a refusal now carries the CHANGE it came from, not only its sentence:
     the target, and the rows with the value each field HELD. That is the
     address the client puts back — just those fields, from the values here —
     leaving everything else on the page to be saved on the next attempt.

     `refusals` (the sentences) is untouched and still first in the body:
     §171's banner reads it, and a client that has never heard of this still
     behaves exactly as it did. */
  const refused = [];
  let atChange = null;

  const no = function (why) {
    refusals.push(why);
    refused.push({
      why: why,
      kind: atChange ? atChange.kind : null,
      target: atChange ? atChange.target : null,
      what: atChange ? atChange.what : null,
      /* ONLY WHAT CAN BE PUT BACK. A row with no id, or a change that names
         no rows at all (the register, the matrix, a list whose membership
         moved), has no address — so it says so rather than letting the
         client guess, and the offer is simply not made (§42 fails closed:
         an unaddressable refusal keeps the old, destructive way out and
         nothing pretends otherwise). */
      rows: (atChange && atChange.rows || [])
        .filter(function (r) { return r && r.id && r.field; })
        .map(function (r) {
          return { id: r.id, name: r.name || null, field: r.field,
                   had: r.had !== false,
                   from: r.from === undefined ? null : r.from };
        })
    });
  };

  changes.forEach(function (ch) {
    atChange = ch;
    const where = ch.target && ch.target !== "group"
      ? " (" + String(ch.target).replace(/^fn:/, "") + ")" : "";

    switch (ch.kind) {
      case "setup":
        if (!edits(w, person, "a_setup", "group"))
          no("Setup is the SMO's — " + ch.what + where + " cannot be changed here.");
        return;

      /* ── THE TWO A SETUP GRANT DOES NOT BUY (§89) ─────────────────
         Both are rules rather than areas, for the reason §37's three are:
         they are true whatever the matrix says. And both are asked through
         `lib/rules.js`, so the screen that hides the control and the server
         that refuses the save are answering one question (§42). */
      case "access":
        if (!R.mayEditAccess(w, person))
          no("Who may do what is the Super user's — the SMO team reads this page " +
             "and does not change it.");
        return;

      case "destroy":
        if (!R.mayDestroy(w, person))
          no("Deleting is the Super user's — " + ch.what + ". Retiring keeps every " +
             "attribution true and is yours to do.");
        return;

      case "group":
        if (!edits(w, person, "a_group", "group"))
          no("The group's own strategy cannot be changed here — " + ch.what + ".");
        return;

      case "cycle":
        if (!edits(w, person, "a_cycle", "group"))
          no("The reporting cycle is run by the SMO — " + ch.what + " cannot be changed here.");
        return;

      /* ── WHICH SLIDES A REVIEW SHOWS (§256) ─────────────────────────
         The office's, and Islam's decision: *"allow the SMO to hide
         presentation slides of any unit or function."* A rule rather than an
         area, for the reason §37's three are — it is true whatever the matrix
         says — and asked through `lib/rules.js`, so the screen that draws the
         eye and the server that accepts the save answer one question (§42).

         DELIBERATELY NOT GATED ON THE CYCLE LOCK. A locked cycle has stopped
         taking FIGURES; the deck is still presented after it locks, and
         pruning it the morning of the meeting is exactly when this is used. */
      case "deckHide":
        if (!office)
          no("Which slides a review shows is the SMO's — " + ch.what + where +
             " is set in Manage slides.");
        return;

      /* A rule, not a setting (§37): what carries reward is the office's
         decision. And a locked cycle has stopped taking marks. */
      case "focus":
        if (roleKeys.indexOf("gceo") === -1 && roleKeys.indexOf("super") === -1)
          no("Focus measures are marked by the CEO and the SMO.");
        else if (locked && !office)
          no("This cycle is locked, so its focus measures can no longer be changed.");
        return;

      /* ── THE STRATEGY TAB IS THE OFFICE'S (§94) ──────────────────
         A plan ARRIVES by upload and is corrected by the SMO alone (§22,
         §31); §94 read that argument on to the rest of the tab, because the
         aspiration the objectives hang off and the SWOT the pillars were
         reasoned from are as much "what was agreed" as the measures are.

         ALL THREE ASK `mayAuthorPage()`, which is the same call the pen makes
         (§42): the page key it is asked with is the only difference between
         them, and the list of strategy pages lives in `lib/rules.js` where
         both sides can read it.

         `unitPlan` used to ask `smo`, which is the Super user — so an SMO
         TEAM MEMBER WAS OFFERED THE PLAN PEN AND REFUSED ON SAVE, for as long
         as §89's role has existed. That is the drift this file exists to
         prevent, and it was on the wrong side of it. */
      /* §217: THE TARGET DECIDES THE COLUMN, NOT THE PAGE NAME. These three
         guards named a UNIT page key while the target they are handed can be
         `fn:<key>` — a pillars function is classified through the unit-shaped
         pass (§59) — so a supporting function's plan was judged against the
         BUSINESS UNIT Strategy column. Measured both ways: the function's own
         column granted nothing and the unit's granted everything. */
      case "unitFoundation":
        if (!R.mayAuthorPage(w, person, R.strategyPageOf(ch.target, "u_found"), ch.target))
          no("A unit's own words are the SMO's — " + ch.what + where + " cannot be changed here.");
        return;

      case "unitAnalysis":
        if (!R.mayAuthorPage(w, person, R.strategyPageOf(ch.target, "u_anal"), ch.target))
          no("A unit's SWOT is the SMO's — " + ch.what + where + " cannot be changed here.");
        return;

      case "unitPlan":
        if (!R.mayAuthorPage(w, person, R.strategyPageOf(ch.target, "u_plan"), ch.target))
          no("A plan is corrected by the SMO — " + ch.what + where + " cannot be changed here.");
        return;

      /* REORDERING IS ITS OWN GRANT AGAIN (§101). Asked through the shared
         rule, never re-derived here — a screen that offers a handle the server
         then refuses is the drift this file exists to prevent, and it is
         exactly what happened for the two versions §94.3 was in force. */
      case "arrange":
        if (!R.mayArrange(w, person, ch.target))
          no("Reordering " + ch.what + where + " is the unit's own to do — " +
             "this sign-in does not hold it.");
        return;

      /* ── FILL THE GAPS (§145) ────────────────────────────────────
         Both halves resolve to the target's Strategy grant: u_found and
         u_plan share one area, k_found and k_proj share the other, so
         `planPageOf(target)` answers for every gap the pass classifies.
         A fill or an amend passes on the fill grant OR authorship (the
         office amending a pending value through the API is still the
         office); removing the mark — confirming — is authorship alone. */
      /* §177 NARROWS THIS TO THE ROW. Islam, on a project owner given Fill
         gaps over a whole supporting function: "the fill grant should be for
         his project only he is not a cutodian." mayFillRow() is mayFillPage()
         plus §147.7's bounded reach, so an unbounded role is unchanged and a
         project or pillar owner reaches what names them. The screen asks the
         same function (`filling(page, acKey, ctx)`), or a field would open
         that the save then refuses (§42). */
      case "gapFill":
        if (!R.mayAuthorPage(w, person, R.planPageOf(ch.target), ch.target) &&
            !R.mayFillRow(w, person, R.planPageOf(ch.target), ch.target, ch.ctx))
          no("Filling " + ch.what + where + " needs the fill-the-gaps grant, " +
             "and it reaches only the rows this sign-in holds.");
        return;

      case "gapConfirm":
        if (!R.mayAuthorPage(w, person, R.planPageOf(ch.target), ch.target))
          no("Confirming " + ch.what + where + " is the Strategy Office's — " +
             "a fill stays pending, and yours to correct, until they accept it.");
        return;

      case "unitReporting":
      case "reportState": {
        const t = String(ch.target || "");
        const isFn = t.indexOf("fn:") === 0;
        if (!edits(w, person, isFn ? "fn" : "unit", t)) {
          no("You cannot report for " + t.replace(/^fn:/, "") + ".");
          return;
        }
        if (locked && !office) {
          no("This cycle is locked. Ask the SMO to reopen it before entering figures.");
          return;
        }
        /* Submitting, and the subject's own note on the cycle, speak for the
           whole unit or function — so somebody who edits only through a
           bounded role (a contributor, a project owner, a pillar owner) does
           neither (spec 006 §7.2; the two owner roles since §147.7). */
        if (R.onlyOwnLines(w, person, isFn ? "fn" : "unit", t)) {
          if (ch.kind === "reportState") {
            no("Your role reports its own rows; " + ch.what + " is the " +
               (isFn ? "function's." : "unit's."));
            return;
          }
        }
        if (ch.kind !== "unitReporting" || !ch.ids) return;
        /* "They should be allowed to their lines only" — a rule with teeth,
           so a tenant that opened a bounded row cannot touch anybody else's
           rows. mayReportRow() is the one reach rule the screen also asks
           (§42), and since §147.7 it runs for a pillars FUNCTION's plan too:
           the old `isFn` skip existed because no bounded role could reach an
           fn: target, and a pillar owner can. */
        if (!R.onlyOwnLines(w, person, isFn ? "fn" : "unit", t)) return;
        const uStored = isFn
          ? asUnit((stored.functions || {})[t.slice(3)] || {}, t)
          : (stored.units || {})[t];
        const ctxs = ctxOfUnit(uStored);
        const notMine = ch.ids.filter(function (id) {
          const ctx = ctxs[id];
          return !ctx || !R.mayReportRow(w, person, isFn ? "fn" : "unit", t, ctx);
        });
        if (notMine.length)
          no("Your role reports only its own rows — " + notMine.length +
             (notMine.length === 1 ? " figure" : " figures") + " in " +
             t.replace(/^fn:/, "") + " is not yours.");
        return;
      }

      /* The figure belongs to whoever the set names — in ANY unit, without
         owning any of them. The unit's own people cannot move it: that is the
         whole point, because a figure entered by the person measured against
         it is not a source of anything. */
      case "sourceReporting": {
        const t = String(ch.target || "");
        if (locked && !office) {
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
             route forward rather than a dead end.

             TWO KINDS OF HOLD, and FIRST CLAIM WINS between them (spec 008
             §4). A figure claimed into a SET is the set owner's to release; a
             figure NAMED by a unit is that unit's own arrangement, so it is
             released by whoever may name there — and by nobody else, set
             owners included. Neither can take the other's, which is what
             makes "whoever asked first holds it" true rather than aspirational. */
          if (held) {
            if (held.set) {
              const heldSet = R.setById(w, held.set);
              if (!heldSet || !R.mayPickInto(w, person, heldSet)) {
                no("That figure is already held by " +
                   (R.sourceLabel(w, before) || "another set") + ". Ask the SMO to move it.");
                return;
              }
            } else if (!R.mayName(w, person, ch.target)) {
              no("That figure is already entered by " +
                 (nameOf(R.sourceLabel(w, before)) || "somebody else") +
                 ". Ask the SMO to move it.");
              return;
            }
          }
          if (!want) return;

          /* NAMING a person, rather than claiming into a set (spec 008 §3B).
             Off until the tenant switches it on, and refused HERE while it is
             off — hiding the page would leave the save unguarded. */
          if (!want.set) {
            if (!want.by) {
              no("A figure is claimed into a set or named on a person, and this is neither.");
              return;
            }
            if (!R.namingOn(w)) {
              no("Naming who enters a figure is not switched on for this tenant.");
              return;
            }
            if (!R.mayName(w, person, ch.target)) {
              no("You cannot decide who enters " +
                 (before && before.name ? "\u201c" + before.name + "\u201d" : "that figure") +
                 where + ".");
              return;
            }
            /* A CUSTODIAN MAY NAME ANYONE THE PLATFORM KNOWS (spec 008 §9) —
               but only somebody it knows, and only somebody still here. A
               figure pointing at a retired person has nobody to enter it and
               no way to say so, which is the same fault as a figure pointing
               at a removed set. */
            const named = peopleByKey[want.by];
            if (!named) { no("That person is not on the register."); return; }
            if (named.active === false) {
              no((named.name || want.by) + " has been retired, so cannot be named on a figure.");
            }
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

      /* ASKING for a figure another set holds. Anybody who may fill a set may
         ask on its behalf — and only on its behalf, only for themselves, and
         only for a figure somebody actually holds. Asking twice is not asking
         louder, so a second open request for the same figure is refused. */
      case "claimRequest": {
        if (smo) return;
        (ch.claims || []).forEach(function (c) {
          if (c.by !== person.key) { no("A claim request is made in your own name."); return; }
          if (c.state !== "open") { no("A claim request starts open; the SMO answers it."); return; }
          const set = R.setById(w, c.set);
          if (!set || !R.mayPickInto(w, person, set)) {
            no("You can only ask for a figure on behalf of a set you fill."); return;
          }
          const row = R.rowById(w, c.unit, c.figure);
          if (!row || !R.isSourced(row)) { no("That figure is not held by anybody."); return; }
          if (row.src.set === c.set) { no("That figure is already in this set."); return; }
          if (R.openClaimFor(w, c.figure, c.set)) {
            no("You have already asked for that figure. The SMO answers it.");
          }
        });
        return;
      }

      /* THE FUNCTION'S HALF OF THE SAME TAB (§94, §53.5). A capability's
         definition, key objectives, projects, deliverables, outcomes and
         milestones are what a function AGREED — the Strategy tab of a
         supporting function is exactly these. The pen has been the office's
         since §69.13; this side had never been told. */
      case "capPlan":
        if (!R.mayAuthorPage(w, person, "k_proj", ch.target))
          no("A plan is corrected by the SMO — " + ch.what + where + " cannot be changed here.");
        return;

      case "capReporting": {
        if (!edits(w, person, "fn", ch.target)) { no("You cannot report for " + where.trim() + "."); return; }
        if (locked && !office) {
          no("This cycle is locked. Ask the SMO to reopen it before entering figures.");
          return;
        }
        /* ── A CUSTODIAN PER PROJECT (§147) ──────────────────────────
           A PROJECT OWNER reaches every row of their project and nothing in
           the project next to it; a CONTRIBUTOR (a milestone's owner, a
           stakeholder) reaches the rows that name them; the capability's own
           key objectives and its headline figures belong to no project, so
           for anybody bounded they are refused. Resolved against the STORED
           capabilities (§42.2), through the same reach rule the screen asks
           (mayReportRow, §147.7). */
        if (!R.onlyOwnLines(w, person, "fn", ch.target)) return;
        const fk = String(ch.target || "").replace(/^fn:/, "");
        if (!ch.ids) {
          no("Your role reports its own rows — " + ch.what + where +
             " is the function's.");
          return;
        }
        const ctxs = ctxOfFn(w, fk);
        const notMine = ch.ids.filter(function (id) {
          const ctx = ctxs[id];
          return !ctx || !R.mayReportRow(w, person, "fn", ch.target, ctx);
        });
        if (notMine.length)
          no("Your role reports only its own rows — " + notMine.length +
             (notMine.length === 1 ? " row" : " rows") + " in " + fk + " is not yours.");
        return;
      }

      /* Fails CLOSED. A field the platform gained after this file was written
         is guarded on the day it is added, not on the day it is remembered. */
      default:
        if (!smo) no("This save changes something only the SMO may change" +
                     (ch.what ? " (" + ch.what + ")" : "") + ".");
    }
  });

  /* `refusals` is de-duplicated for READING — two identical sentences are one
     thing to say. `refused` is not: two refusals can share a sentence and
     name different rows, and dropping one would leave a row nobody puts back
     and a save that is refused again for a reason the person was told had
     been dealt with. */
  return { ok: !refusals.length, refusals: uniq(refusals),
           refused: refused, changes: changes };
}

module.exports = { authorize: authorize, collect: collect,
                   REPORT: REPORT, namedOn: namedOn };
