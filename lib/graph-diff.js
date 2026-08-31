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
  var ROW_LISTS = ["keyObjectives", "items"];   /* on a unit or a pillars function */
  var PILLAR_LISTS = ["measures", "tactics"];   /* inside one of `items` */

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

  /* ── ONE PLAN-SHAPED ENTRY, ROW BY ROW ──────────────────────────────
     Returns a list of row edits, or NULL meaning "send this entry whole".
     Null is the honest answer for anything structural: a row added, removed
     or moved, a list the platform cannot name, or a shape not listed above.
     The caller then does exactly what §210 did. */
  function entryRows(part, key, a, b) {
    if (!isMap(a) || !isMap(b)) return null;
    var rows = [], at = part + "." + key, skipTop = [];

    for (var i = 0; i < ROW_LISTS.length; i++) {
      var name = ROW_LISTS[i], la = a[name], lb = b[name];
      if (la === undefined && lb === undefined) continue;
      if (!Array.isArray(la) || !Array.isArray(lb)) return null;
      skipTop.push(name);
      if (same(la, lb)) continue;
      if (!sameIds(la, lb)) return null;               /* structural — whole */
      var ma = byId(la), mb = byId(lb), ids = Object.keys(ma);
      for (var j = 0; j < ids.length; j++) {
        var ra = ma[ids[j]], rb = mb[ids[j]];
        if (same(ra, rb)) continue;
        var skipRow = null;
        if (name === "items") {
          /* A PILLAR CARRIES TWO LISTS OF ITS OWN and they are addressed
             through it, never inside its field diff. */
          skipRow = [];
          for (var q = 0; q < PILLAR_LISTS.length; q++) {
            var sub = PILLAR_LISTS[q], sa = ra[sub], sb = rb[sub];
            if (sa === undefined && sb === undefined) continue;
            if (!Array.isArray(sa) || !Array.isArray(sb)) return null;
            skipRow.push(sub);
            if (same(sa, sb)) continue;
            if (!sameIds(sa, sb)) return null;
            var na = byId(sa), nb = byId(sb), sids = Object.keys(na);
            for (var z = 0; z < sids.length; z++) {
              if (same(na[sids[z]], nb[sids[z]])) continue;
              var sd = fieldDiff(na[sids[z]], nb[sids[z]], null);
              if (!sd) return null;
              rows.push({ at: at, path: [name, ids[j], sub], id: sids[z],
                          set: sd.set, del: sd.del });
            }
          }
        }
        var fd = fieldDiff(ra, rb, skipRow);
        if (fd) rows.push({ at: at, path: [name], id: ids[j],
                            set: fd.set, del: fd.del });
      }
    }

    /* Anything on the entry ITSELF that moved — an aspiration, a name, the
       SWOT — travels as a field edit on the entry, addressed with no id. */
    var top = fieldDiff(a, b, skipTop);
    if (top) rows.push({ at: at, path: [], id: null, set: top.set, del: top.del });
    return rows.length ? rows : null;
  }

  /* ── WHAT CHANGED ───────────────────────────────────────────────────
     `base` is what the server last confirmed; `next` is what is on screen.
     Returns { set: { path: value }, del: [path] } with paths one or two
     segments deep, dot-joined.

     A KEY THAT WENT IS NOT A KEY SET TO NULL. `priorCycle` is legitimately
     null on a tenant that has never closed a cycle, so "null means remove"
     would make an ordinary value indistinguishable from a deletion — and a
     deletion is how a unit is removed. They are two lists. */
  /* Which parts are plan-shaped, and so worth addressing row by row. */
  var ROW_PARTS = ["units", "functions"];

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
          if (ROW_PARTS.indexOf(k) > -1 && !(b[s] === undefined || n[s] === undefined)) {
            var r = entryRows(k, s, b[s], n[s]);
            if (r) { rows = rows.concat(r); return; }
          }
          set[k + "." + s] = n[s];
        });
        return;
      }
      if (!same(b, n)) set[k] = n;
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
      var seg = e.at.split(".");
      if (seg.length !== 2 || ROW_PARTS.indexOf(seg[0]) < 0 || !seg[1])
        return bad("a row edit names a part this server does not address: " + e.at);
      var host = isMap(target[seg[0]]) ? target[seg[0]][seg[1]] : null;
      if (!isMap(host)) return bad("a row edit names something that is not here: " + e.at);
      var path = Array.isArray(e.path) ? e.path : null;
      if (!path) return bad("a row edit has no path");
      if (!isMap(e.set) || !Array.isArray(e.del || []))
        return bad("a row edit is not shaped like one");

      var holder = null;
      if (path.length === 0) holder = host;
      else if (path.length === 1) {
        if (ROW_LISTS.indexOf(path[0]) < 0) return bad("unknown list: " + path[0]);
        holder = byId(host[path[0]])[String(e.id)] || null;
      } else if (path.length === 3) {
        if (path[0] !== "items" || PILLAR_LISTS.indexOf(path[2]) < 0)
          return bad("unknown list: " + path.join("/"));
        var pil = byId(host.items)[String(path[1])];
        if (!isMap(pil)) return bad("a row edit names a pillar that is not here: " + path[1]);
        holder = byId(pil[path[2]])[String(e.id)] || null;
      } else return bad("a row edit path this server does not apply: " + path.join("/"));

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
