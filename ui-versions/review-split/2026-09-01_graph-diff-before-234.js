/* ── WHAT CHANGED, AND HOW TO APPLY IT (§210) ────────────────────────────
   Islam, after a morning of refusals naming things nobody had touched:
   *"why is the whole plan is sent, why don't we just send the changed element
   only not to cause this issue?"*

   Right, and it is the root the day's three faults share. Every save posted
   the WHOLE graph and the server threw its copy away and took the client's,
   which means:

     · work done before a view switch rode into a save under the new
       identity, and the refusal named things the person never touched (§204);
     · a tab that had been open a while silently overwrote everybody else's
       saved work, with no error at all (measured against a real Postgres:
       an aspiration and a register rename, both gone);
     · and a refusal could name any part of the product, because every part
       of the product was in the envelope.

   THE SHAPE OF THE FIX IS "APPLY, DON'T REPLACE". The client sends the parts
   it changed; the server applies them ONTO ITS OWN CURRENT COPY and judges
   the result exactly as it judged a whole posted graph before. Nothing about
   authorisation changes — `lib/authorize.js` still compares a stored graph
   with an incoming one — and nothing about writing changes. What changes is
   only how `incoming` is arrived at, and that is the whole of the bug.

   ONE MODULE, BOTH SIDES (§42). The browser computes the changes and the
   server applies them; two definitions of "what counts as a change" is
   exactly the drift that produces a save the screen believes in and the
   server does not.

   ── THE GRANULARITY, AND WHY IT IS NOT FINER ────────────────────────────
   A change is a TOP-LEVEL PART, except for the four maps keyed by subject —
   `units`, `functions`, `companies`, `unitRoles` — which are compared entry
   by entry. So filling a gap on Consumer Finance sends `units.consumerfinanc`
   and nothing else.

   Finer than that (a path per field) needs arrays matched by row ID rather
   than by position, or a save lands a value on the wrong row when two people
   have added rows — §48's rule about snapshots keyed by id, in a place where
   getting it wrong writes a number against somebody else's measure. That is
   worth doing and it is not worth doing in the same change as this: this one
   is provable in an afternoon and removes the reported faults, and the
   remaining exposure it leaves is stated rather than implied — two people
   editing THE SAME unit at the same time still resolve last-write-wins on
   that unit. Two people on different units, or on a unit and the register,
   no longer touch each other at all, which is what was happening today. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SMPDiff = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* The four maps a save is compared through entry by entry. Everything else
     in the graph is compared whole, because everything else IS one thing: a
     register, a matrix, a cycle. */
  var BY_KEY = ["units", "functions", "companies", "unitRoles"];

  /* ── ROW-LEVEL, FOR A PLAN (§215) ──────────────────────────────────────
     Islam: *"for the business units we need to apply the same thing — when
     you change a small thing it just sends the thing that changed."*

     §210 stopped at a top-level part on purpose and said why: finer needs
     arrays matched by ROW ID rather than by position, or a save lands a value
     on somebody else's row when two people have added rows (§48). Every plan
     row has carried a unique id since §191 (219 of 219 across the demo, none
     missing, none shared), so that is now a matching problem rather than a
     guessing one.

     AND THE OTHER HALF OF THE RISK IS GONE BY THE RULES. Adding, removing or
     reordering a pillar needs authoring rights, which are the office's alone
     (§94) — a custodian or a BU owner can only fill blanks and report. So the
     two people who share a unit day to day cannot change WHICH rows exist,
     which is exactly the case that made position-matching dangerous.

     THE ADDRESSABLE LISTS ARE NAMED, NEVER DISCOVERED. A shape this does not
     recognise falls back to sending the whole part, which is §210's behaviour
     and always correct — the fine-grained path is an optimisation that must
     never be the only way a change can travel. */
  /* ── THE ADDRESSABLE TREE (§216 generalises §215) ─────────────────────
     Hala, a strategy custodian and project owner working on CX, was refused
     with *"a project's milestones (admin) cannot be changed here"* — naming a
     supporting function she had never opened. Measured: EVERY capability in
     the tenant lives in `group`, which travels as ONE top-level part, so a
     save made on CX carries all eight functions' plans and any difference
     between her tab's copy and the stored one is judged as HERS.

     THE PART IS CALLED `group`, AND THAT IS WORTH SAYING because the first
     build of this said `org` — the name §210's own comment uses in prose —
     and every unit test passed, because those tests built their own fixture
     with the wrong name too. The end-to-end test against a real Postgres is
     what caught it (§100.3: a fixture that does not model the server is
     testing something the product does not do).

     §215's own fault, in the one place §210 could not reach: units and
     functions are keyed maps and were split; capabilities are an ARRAY inside
     a part, and were not.

     A shape not in this tree returns null and the part travels whole, exactly
     as before — the fine path stays an optimisation, never the only way. */
  var ROW_TREE = {
    /* a unit, or a function that plans in pillars */
    keyObjectives: {},
    items:         { measures: {}, tactics: {} },
    /* the group's capabilities, and the projects inside them */
    capabilities:  { keyObjectives: {},
                     projects: { deliverables: {}, outcomes: {}, milestones: {} } }
  };
  /* Which top-level parts are worth addressing this way, and how they are
     reached: a keyed map (`units.mobile`) or the part itself (`org`). */
  var ROW_PARTS_MAP  = ["units", "functions"];
  var ROW_PARTS_FLAT = ["group"];

  function isMap(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }
  /* Value equality by canonical JSON. Postgres jsonb reorders object keys
     (§145 records a save refused for exactly that), so a comparison that is
     sensitive to key ORDER reports a change nobody made — and here that would
     mean sending a part that did not move, which is the fault this file
     exists to remove. */
  function canon(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    return "{" + Object.keys(v).sort().map(function (k) {
      return JSON.stringify(k) + ":" + canon(v[k]);
    }).join(",") + "}";
  }
  function same(a, b) { return canon(a) === canon(b); }

  /* Row lists compare by ID, everything else on the object compares whole. */
  function idsOf(list) {
    if (!Array.isArray(list)) return null;
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || typeof r !== "object") return null;      /* not a row list */
      var id = r.id;
      /* §191: A LIST THE PLATFORM CANNOT NAME IS ONE NOBODY MAY ADDRESS.
         A missing, null or repeated id means this list falls back to
         travelling whole — the same answer the authoriser gives it. */
      if (id === undefined || id === null || id === "") return null;
      if (seen[id]) return null;
      seen[id] = 1; out.push(String(id));
    }
    return out;
  }
  function sameIds(a, b) {
    var x = idsOf(a), y = idsOf(b);
    if (!x || !y || x.length !== y.length) return false;
    /* ORDER INCLUDED, deliberately: reordering IS a change the authoriser
       classifies by comparing id order (§101), so a reorder must travel as a
       whole list and never as a set of field edits. */
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }
  function byId(list) {
    var m = {};
    (list || []).forEach(function (r) { if (r && r.id != null) m[String(r.id)] = r; });
    return m;
  }
  /* The changed FIELDS of one row, skipping the lists it carries — those are
     walked separately so a measure never rides inside its pillar. */
  function fieldDiff(a, b, skip) {
    var set = {}, del = [], keys = {}, any = false;
    Object.keys(a || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(b || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      if (skip && skip.indexOf(k) > -1) return;
      var inB = Object.prototype.hasOwnProperty.call(b || {}, k);
      if (!inB) { del.push(k); any = true; return; }
      if (!same((a || {})[k], b[k])) { set[k] = b[k]; any = true; }
    });
    return any ? { set: set, del: del } : null;
  }

  /* ── ONE OBJECT, WALKED DOWN THE TREE (§215, generalised by §216) ────
     Appends row edits for `obj` and everything addressable beneath it.
     Returns FALSE the moment anything is structural — a row added, removed or
     moved, a list the platform cannot name, or a shape not in the tree — and
     the caller then sends the part whole, which is always correct.

     `here` is the path walked so far: alternating list name and row id, so
     ["capabilities","cap1","projects"] addresses a project inside cap1. The
     server validates against the SAME tree rather than walking freely. */
  function walkRows(at, here, tree, a, b, out) {
    if (!isMap(a) || !isMap(b)) return false;
    var skip = [];
    var names = Object.keys(tree);
    for (var i = 0; i < names.length; i++) {
      var name = names[i], la = a[name], lb = b[name];
      if (la === undefined && lb === undefined) continue;
      if (!Array.isArray(la) || !Array.isArray(lb)) return false;
      skip.push(name);
      if (same(la, lb)) continue;
      if (!sameIds(la, lb)) return false;              /* structural — whole */
      var ma = byId(la), mb = byId(lb), ids = Object.keys(ma);
      for (var j = 0; j < ids.length; j++) {
        var ra = ma[ids[j]], rb = mb[ids[j]];
        if (same(ra, rb)) continue;
        var below = tree[name];
        if (Object.keys(below).length &&
            !walkRows(at, here.concat([name, ids[j]]), below, ra, rb, out)) return false;
        var fd = fieldDiff(ra, rb, Object.keys(below));
        if (fd) out.push({ at: at, path: here.concat([name]), id: ids[j],
                           set: fd.set, del: fd.del });
      }
    }
    /* Anything on the PART ITSELF that moved travels with no id — an
       aspiration, a name, the SWOT. Only at the top: a nested row's own fields
       are emitted by the caller that found it, and emitting them here as well
       produced the row twice, the second time with a path that addresses no
       list (`items/p1`) and so is refused on arrival. */
    if (!here.length) {
      var top = fieldDiff(a, b, skip);
      if (top) out.push({ at: at, path: [], id: null, set: top.set, del: top.del });
    }
    return true;
  }

  /* The tree a given part is walked with. A keyed map's entries are plans; a
     flat part is the group, whose addressable half is its capabilities. */
  function treeFor(part) {
    if (ROW_PARTS_MAP.indexOf(part) > -1)
      return { keyObjectives: ROW_TREE.keyObjectives, items: ROW_TREE.items };
    if (ROW_PARTS_FLAT.indexOf(part) > -1)
      return { capabilities: ROW_TREE.capabilities };
    return null;
  }
  function entryRows(at, part, a, b) {
    var tree = treeFor(part);
    if (!tree) return null;
    var out = [];
    if (!walkRows(at, [], tree, a, b, out)) return null;
    return out.length ? out : null;
  }

  function graphChanges(base, next) {
    var set = {}, del = [], rows = [];
    base = base || {}; next = next || {};
    var keys = {};
    Object.keys(base).forEach(function (k) { keys[k] = 1; });
    Object.keys(next).forEach(function (k) { keys[k] = 1; });

    Object.keys(keys).forEach(function (k) {
      var b = base[k], n = next[k];
      var inNext = Object.prototype.hasOwnProperty.call(next, k);
      if (!inNext) { del.push(k); return; }
      if (BY_KEY.indexOf(k) > -1 && isMap(b) && isMap(n)) {
        var sub = {};
        Object.keys(b || {}).forEach(function (s) { sub[s] = 1; });
        Object.keys(n || {}).forEach(function (s) { sub[s] = 1; });
        Object.keys(sub).forEach(function (s) {
          var has = Object.prototype.hasOwnProperty.call(n, s);
          if (!has) { del.push(k + "." + s); return; }
          if (same(b[s], n[s])) return;
          /* §215: ROW BY ROW WHERE THE SHAPE ALLOWS IT, AND WHOLE OTHERWISE.
             `entryRows` returns null for anything structural — a row added,
             removed or moved, or a list it cannot name — and the entry then
             travels exactly as §210 sent it. The coarse path is never removed,
             so a shape this does not understand still saves correctly. */
          if (!(b[s] === undefined || n[s] === undefined)) {
            var r = entryRows(k + "." + s, k, b[s], n[s]);
            if (r) { rows = rows.concat(r); return; }
          }
          set[k + "." + s] = n[s];
        });
        return;
      }
      if (same(b, n)) return;
      /* §216: A FLAT PART IS WALKED TOO. `org` carries every capability in the
         tenant, so before this a save made on one function travelled with all
         of them and a stale copy of somebody else's plan was judged as this
         person's — the refusal naming a function they had never opened. */
      if (ROW_PARTS_FLAT.indexOf(k) > -1) {
        var fr = entryRows(k, k, b, n);
        if (fr) { rows = rows.concat(fr); return; }
      }
      set[k] = n;
    });
    var out = { set: set, del: del };
    if (rows.length) out.rows = rows;
    return out;
  }

  /* ── APPLY THEM ONTO A TARGET ───────────────────────────────────────
     The target on the server is the STORED graph, which is the whole point:
     everything the client did not touch stays exactly as the database has
     it, including work somebody else saved thirty seconds ago.

     REFUSES A PATH IT DOES NOT UNDERSTAND rather than guessing. A save is
     the one place in this product where being approximately right is worse
     than failing: an unknown path either means a client newer than the
     server (which cannot happen — they deploy together) or a forged body,
     and both should stop here. §42's rule that an unstated case resolves the
     safe way, on the write path. */
  var MAX_SEGMENTS = 2;
  function bad(why) { return { ok: false, error: why }; }
  function applyChanges(target, changes) {
    if (!changes || typeof changes !== "object")
      return { ok: false, error: "no changes to apply" };
    var set = changes.set || {}, del = changes.del || [];
    if (!isMap(set) || !Array.isArray(del))
      return { ok: false, error: "changes are not shaped like a change list" };

    var paths = Object.keys(set).concat(del);
    for (var i = 0; i < paths.length; i++) {
      var parts = String(paths[i]).split(".");
      if (!parts.length || parts.length > MAX_SEGMENTS || parts.some(function (p) { return !p; }))
        return { ok: false, error: "a change names a path this server does not apply: " + paths[i] };
      if (parts.length === 2 && BY_KEY.indexOf(parts[0]) < 0)
        return { ok: false, error: "a change reaches inside a part that is written whole: " + paths[i] };
    }

    /* ── ROW EDITS ARE VALIDATED BEFORE ANY OF THEM IS APPLIED (§215) ──
       A save is the one place where being approximately right is worse than
       failing, so the whole list is checked first and applied second: a body
       naming one row it cannot resolve changes nothing at all, rather than
       half-landing and leaving a plan nobody can reason about.

       THE SHAPE IS AN ALLOW-LIST, NEVER A WALK. `path` is [] , [list], or
       [list, pillarId, sublist] and nothing else — replacing §210's blanket
       "no path deeper than two" with something equally strict rather than
       with a general resolver, which is where a bug here would be dangerous.

       A ROW IS FOUND BY ID. Not by position, which is the whole reason §210
       stopped short of this (§48). An id the stored graph does not hold is a
       refusal: it means the client is working from a plan that no longer
       exists, and guessing which row it meant is exactly the fault. */
    var rows = Array.isArray(changes.rows) ? changes.rows : [];
    var plan = [];
    for (var r = 0; r < rows.length; r++) {
      var e = rows[r];
      if (!isMap(e) || typeof e.at !== "string") return bad("a row edit has no address");
      if (!isMap(e.set) || !Array.isArray(e.del || []))
        return bad("a row edit is not shaped like one");
      var path = Array.isArray(e.path) ? e.path : null;
      if (!path) return bad("a row edit has no path");

      /* WHERE IT STARTS. Either a keyed map's entry (`units.mobile`) or a flat
         part (`org`) — nothing else is addressable, and an unknown address is
         refused rather than resolved. */
      var seg = e.at.split("."), host = null, part = seg[0];
      if (seg.length === 2 && ROW_PARTS_MAP.indexOf(part) > -1 && seg[1])
        host = isMap(target[part]) ? target[part][seg[1]] : null;
      else if (seg.length === 1 && ROW_PARTS_FLAT.indexOf(part) > -1)
        host = target[part];
      else return bad("a row edit names a part this server does not address: " + e.at);
      if (!isMap(host)) return bad("a row edit names something that is not here: " + e.at);

      /* WALKED DOWN THE SAME TREE THE DIFFER USED, never freely: the path is
         list name / row id / list name … and every step is checked against the
         tree before it is taken. A row is found by ID and never by position
         (§48) — an id the stored graph does not hold is a refusal, because it
         means the client is describing a plan that no longer exists. */
      var tree = treeFor(part), holder = host, okShape = true;
      for (var q = 0; q < path.length && okShape; q += 2) {
        var listName = path[q];
        if (!tree || !Object.prototype.hasOwnProperty.call(tree, listName)) { okShape = false; break; }
        if (q + 1 < path.length) {
          holder = byId(holder[listName])[String(path[q + 1])] || null;
          if (!isMap(holder)) return bad("a row edit names a row that is not here: " + path[q + 1]);
          tree = tree[listName];
        } else {
          holder = byId(holder[listName])[String(e.id)] || null;
        }
      }
      if (!okShape) return bad("a row edit path this server does not apply: " + path.join("/"));
      if (path.length % 2 === 0 && path.length) return bad("a row edit path is malformed: " + path.join("/"));
      if (!isMap(holder)) return bad("a row edit names a row that is not here: " + e.id);
      plan.push({ row: holder, set: e.set, del: e.del || [] });
    }

    Object.keys(set).forEach(function (p) {
      var parts = p.split(".");
      if (parts.length === 1) { target[parts[0]] = set[p]; return; }
      if (!isMap(target[parts[0]])) target[parts[0]] = {};
      target[parts[0]][parts[1]] = set[p];
    });
    plan.forEach(function (e) {
      Object.keys(e.set).forEach(function (k) { e.row[k] = e.set[k]; });
      e.del.forEach(function (k) { delete e.row[k]; });
    });
    del.forEach(function (p) {
      var parts = p.split(".");
      if (parts.length === 1) { delete target[parts[0]]; return; }
      if (isMap(target[parts[0]])) delete target[parts[0]][parts[1]];
    });
    return { ok: true, state: target };
  }

  /* How many parts a change list touches — for the record and for a check to
     assert against, so "only what changed travels" is a measurement rather
     than a claim. */
  function countChanges(changes) {
    if (!changes) return 0;
    return Object.keys(changes.set || {}).length + ((changes.del || []).length) +
           ((changes.rows || []).length);
  }

  return { graphChanges: graphChanges, applyChanges: applyChanges,
           countChanges: countChanges, BY_KEY: BY_KEY, sameValue: same };
});
