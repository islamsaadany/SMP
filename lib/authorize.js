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
/* `logo` is a unit SETTING, classified with the rest of them rather than
   left to the unknown fall-through. Both land on the SMO, so this changes
   no permission — it changes the REFUSAL, which then says Setup is the
   SMO's and sends the person to the page that holds it (§16.7). */
const UNIT_CONFIG     = ["name", "navName", "codePrefix", "active", "real", "company", "logo"];
const UNIT_FOUNDATION = ["aspiration", "endInMind", "clauses"];
/* `pend` is §145's pending-fill marks — known here so a mark the gap pass
   did not accept falls to the PLAN comparison (office-only) rather than to
   `unknown`, which would be true but would name the wrong screen. */
const UNIT_KNOWN      = UNIT_CONFIG.concat(UNIT_FOUNDATION,
  ["ukey", "weight", "perf", "keyObjectives", "swot", "items", "pend"]);

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
  const add = function (kind, target, what, rows, claims) {
    out.push({ kind: kind, target: target || null, what: what,
               rows: rows || null, claims: claims || null,
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
  const perTarget = ["submitted", "note", "slides"];
  const WHAT = { submitted: "submitting the report", note: "the report's note",
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
    if (!same(sg[k], ig[k])) add("group", "group", k);
  });
  /* The tenant's colours are the BRANDING page, which is Setup — a brand is
     not a screen preference and must not be changeable by whoever happens to
     be looking. */
  if (!same(sg.branding, ig.branding)) add("setup", null, "the tenant's branding");
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
  collectCapabilities(sg.capabilities, ig.capabilities, add);
  const gExtra = GROUP_OWN.concat(["capabilities", "branding", "sets", "claims",
                                   "naming", "focusOff", "mainbus", "comms"]);
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

function uniq(a) {
  const seen = {}, out = [];
  a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
  return out;
}

/* A list of rows with ids, split into what is reporting and what is plan.
   A change to WHICH rows exist is always plan: adding or removing a measure
   is authoring, not reporting. */
function splitRows(sList, iList, fields, onReport, onPlan, onArrange) {
  if (!same(idsOf(sList), idsOf(iList))) {
    if (onArrange && reordered(sList, iList)) { onArrange(); return; }
    onPlan(); return;
  }
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

function gapFieldPass(kind, sRow, iRow, target, add, what) {
  gapFields(kind, sRow, iRow, target, add, what);
  if (sRow.pend && iRow.pend && !same(sRow.pend, iRow.pend) &&
      sameCanon(sRow.pend, iRow.pend))
    sRow.pend = JSON.parse(JSON.stringify(iRow.pend));
}

function gapFields(kind, sRow, iRow, target, add, what) {
  (R.GAP_FIELDS[kind] || []).forEach(function (f) {
    const vq = f === "quarters";
    const sMark = (sRow.pend || {})[f], iMark = (iRow.pend || {})[f];
    if (!sMark && !iMark) return;
    const sBlank = vq ? R.quartersBlank(sRow) : R.gapBlank(sRow[f]);
    const iBlank = vq ? R.quartersBlank(iRow) : R.gapBlank(iRow[f]);
    const valueSame = vq ? same(pick(sRow, GAP_Q), pick(iRow, GAP_Q))
                         : same(sRow[f], iRow[f]);
    let kindOut = null;
    if (sBlank && !sMark && !iBlank && iMark) kindOut = "gapFill";
    else if (sMark && iMark) {
      if (valueSame && sameCanon(sMark, iMark)) return; /* untouched */
      kindOut = "gapFill";
    }
    else if (sMark && !iMark && iBlank) kindOut = "gapFill";
    else if (sMark && !iMark && !iBlank) kindOut = "gapConfirm";
    if (!kindOut) return;                               /* falls through to plan */
    add(kindOut, target, what, [{ id: sRow.id || null, name: sRow.name || null,
      field: f,
      from: vq ? pick(sRow, GAP_Q) : (sRow[f] === undefined ? null : sRow[f]),
      to:   vq ? pick(iRow, GAP_Q) : (iRow[f] === undefined ? null : iRow[f]) }]);
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

function gapRows(kind, sList, iList, target, add, what) {
  const sm = byId(sList), im = byId(iList);
  Object.keys(sm).forEach(function (id) {
    if (im[id]) gapFieldPass(kind, sm[id], im[id], target, add, what);
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
    gapRows("measure", sm[id].measures, im[id].measures, target, add, "a key measure");
    gapRows("tactic", sm[id].tactics, im[id].tactics, target, add, "a tactic");
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

function collectUnit(key, su, iu, add, w) {
  if (!su || !iu) { add("setup", key, "a business unit was added or removed"); return; }

  /* §145: extract and classify the pending-fill transitions first, applied
     to a clone of the stored side so everything below judges the residue. */
  su = gapPassUnit(key, su, iu, add);

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
    function () { add("unitPlan", key, "the unit's key objectives"); },
    function () { add("arrange", key, "the order of the unit's key objectives"); });

  /* Pillars, and the measures and tactics under them. */
  if (!same(idsOf(su.items), idsOf(iu.items))) {
    if (reordered(su.items, iu.items)) add("arrange", key, "the order of the unit's pillars");
    else add("unitPlan", key, "the unit's pillars");
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
  if (String(sf.format) === "pillars") {
    collectUnit(target, asUnit(sf, target), asUnit(iff, target), add, w);
  } else if (!same(pick(sf, FN_KNOWN), pick(iff, FN_KNOWN))) {
    /* Pillars on a projects function are not its plan — nothing renders them —
       so a change to them is not reporting; it is the SMO's. */
    add("setup", null, "a supporting function");
  }

  const fUnknown = uniq(Object.keys(omit(sf, FN_KNOWN)).concat(Object.keys(omit(iff, FN_KNOWN))))
    .filter(function (k) { return !same(sf[k], iff[k]); });
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
    gapRows("capko", a.keyObjectives, b.keyObjectives, target, add, "a capability key objective");
    gapRows("project", a.projects, b.projects, target, add, "a project's front matter");
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

  const no = function (why) { refusals.push(why); };

  changes.forEach(function (ch) {
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
      case "unitFoundation":
        if (!R.mayAuthorPage(w, person, "u_found", ch.target))
          no("A unit's own words are the SMO's — " + ch.what + where + " cannot be changed here.");
        return;

      case "unitAnalysis":
        if (!R.mayAuthorPage(w, person, "u_anal", ch.target))
          no("A unit's SWOT is the SMO's — " + ch.what + where + " cannot be changed here.");
        return;

      case "unitPlan":
        if (!R.mayAuthorPage(w, person, "u_plan", ch.target))
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
      case "gapFill":
        if (!R.mayAuthorPage(w, person, R.planPageOf(ch.target), ch.target) &&
            !R.mayFillPage(w, person, R.planPageOf(ch.target), ch.target))
          no("Filling " + ch.what + where + " needs the fill-the-gaps grant, " +
             "and it reaches only a unit or function this sign-in holds.");
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
        /* Submitting, and the unit's own note on the cycle, speak for the
           whole unit — so a contributor limited to their own lines does
           neither (spec 006 §7.2). */
        if (!isFn && R.onlyOwnLines(w, person, "unit", t)) {
          if (ch.kind === "reportState") {
            no("A contributor reports their own lines; " + ch.what + " is the unit's.");
            return;
          }
        }
        if (ch.kind !== "unitReporting" || !ch.ids || isFn) return;
        /* "Contributors only view, and if we allow them they should be allowed
           to their lines only" — a rule with teeth, so a tenant that still has
           edit stored for contrib cannot touch anybody else's rows. */
        if (!R.onlyOwnLines(w, person, "unit", t)) return;
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

      case "capReporting":
        if (!edits(w, person, "fn", ch.target)) { no("You cannot report for " + where.trim() + "."); return; }
        if (locked && !office) no("This cycle is locked. Ask the SMO to reopen it before entering figures.");
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
