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

  /* ── WHAT CHANGED ───────────────────────────────────────────────────
     `base` is what the server last confirmed; `next` is what is on screen.
     Returns { set: { path: value }, del: [path] } with paths one or two
     segments deep, dot-joined.

     A KEY THAT WENT IS NOT A KEY SET TO NULL. `priorCycle` is legitimately
     null on a tenant that has never closed a cycle, so "null means remove"
     would make an ordinary value indistinguishable from a deletion — and a
     deletion is how a unit is removed. They are two lists. */
  function graphChanges(base, next) {
    var set = {}, del = [];
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
          if (!same(b[s], n[s])) set[k + "." + s] = n[s];
        });
        return;
      }
      if (!same(b, n)) set[k] = n;
    });
    return { set: set, del: del };
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

    Object.keys(set).forEach(function (p) {
      var parts = p.split(".");
      if (parts.length === 1) { target[parts[0]] = set[p]; return; }
      if (!isMap(target[parts[0]])) target[parts[0]] = {};
      target[parts[0]][parts[1]] = set[p];
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
    return Object.keys(changes.set || {}).length + ((changes.del || []).length);
  }

  return { graphChanges: graphChanges, applyChanges: applyChanges,
           countChanges: countChanges, BY_KEY: BY_KEY, sameValue: same };
});
