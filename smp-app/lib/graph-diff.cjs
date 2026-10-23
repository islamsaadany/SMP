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
   no longer touch each other at all, which is what was happening today.

   ── §215 THEN MADE IT FINER (a field of a row, by id), AND §585 CLOSES THE
   LAST GAP: ADDING, REMOVING AND REORDERING ROWS ──────────────────────────
   Until §585 a row added, removed or moved made the WHOLE part travel again
   (`set["units.mobile"] = the unit`), which carried the adder's stale copy
   of every other cell in that unit. Measured: the office adds a pillar while
   a custodian fills a figure on the same unit, and whichever save lands
   second with the whole unit puts the other's cell back as it was. Now a
   structural change travels as a LIST OPERATION (`changes.lists`): which
   rows to drop (by id), which to add (the whole new row, and the id it goes
   after), and the id order when it moved. Applied by id onto the stored
   list, so a cell somebody else filled meanwhile is never touched, and the
   same operation applied twice lands once (a replay after a failed save,
   §504, and the quiet merge, §585, both depend on that). The whole-part
   path stays for what has no ids (§191), exactly as before. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SMPDiff = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* The four maps a save is compared through entry by entry. Everything else
     in the graph is compared whole, because everything else IS one thing: a
     register, a matrix, a cycle. */
  var BY_KEY = ["units", "functions", "companies", "unitRoles"];

  /* ── THE REVIEW IS A TENANT-WIDE ENVELOPE, SPLIT PER TARGET (§234) ────
     A CF custodian pressed Submit and was refused with "You cannot report
     for admin." four times over — four functions he had never opened, in the
     middle of a session where their own custodians were reporting. `review`
     holds four maps keyed by TARGET for the WHOLE tenant (submitted · parked
     · note · slides), and it travelled WHOLE: his stale copy, applied onto
     the stored graph, reverted every submission and note the others had
     written since his tab loaded, and the authoriser rightly judged those
     reversions as his — §216's fault one part over, because the plans were
     split per subject and the reporting envelope never was. Now one submit
     travels as `review.submitted.fn:cf` and nothing else.

     THE AUTHORISER READS THIS SAME LIST (lib/authorize.js's per-target
     loop): two lists of "which review fields are keyed by target" is how a
     field joins one and silently travels whole through the other. */
  /* §301 ADDS `done` — the "I have finished mine" mark — AND ITS KEY IS A
     PROJECT, NOT A TARGET. That is the whole reason it is keyed the way it
     is: keyed by target, one function's map would travel whole, and two
     project owners marking their own projects in the same function would be
     §234's fault one level finer — the second tab reverts the first's mark
     and is refused for it, losing its own work with it (§184). Keyed by the
     container's id, `review.done.cap1-P1` travels alone and two owners never
     touch. Ids are unique across the tenant by construction (§191, measured
     219 of 219), and the authoriser refuses one that resolves to two.

     So this list means "maps split per KEY"; four of the five keys happen to
     be targets. The authoriser reads the same list, and classifies `done`
     apart from the other four — a bounded role may write it and may not
     submit, which is a fact about who may write the field rather than about
     how it is addressed. */
  /* §382 adds `lines`: an owner saving their OWN lines in one subject as a
     draft. Keyed "<target>|<person>", so two owners in one unit travel apart
     exactly as §234 made the other four travel apart. */
  var REVIEW_PER_TARGET = ["submitted", "parked", "note", "slides", "done", "lines"];
  var SUB_TARGET = { review: REVIEW_PER_TARGET };

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
    /* a function that plans in objectives and actions (§342) */
    actions:       {},
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
  /* ── A LIST THAT GAINED, LOST OR MOVED ROWS TRAVELS AS ONE OPERATION (§585) ──
     `ia` and `ib` are the two sides' id orders. What left is dropped by id;
     what arrived is added whole, each new row naming the id it follows (null
     for the first place) so a chain of new rows lands in order; and if the
     surviving order still differs from `ib` once those are replayed, the
     whole id order travels too. The replay here is the SAME rule `applyChanges`
     uses to insert, so `order` is sent only when it is needed. */
  function listOp(at, here, name, A, B, ia, ib) {
    var ma = byId(A), mb = byId(B);
    var drop = ia.filter(function (id) { return !mb[id]; });
    var add = [];
    for (var i = 0; i < B.length; i++) {
      var id = String(B[i].id);
      if (ma[id]) continue;
      add.push({ row: B[i], after: i ? String(B[i - 1].id) : null });
    }
    var seq = ia.filter(function (id) { return !!mb[id]; });
    add.forEach(function (x) { seq = insertAfter(seq, String(x.row.id), x.after); });
    var op = { at: at, path: here, list: name };
    if (drop.length) op.drop = drop;
    if (add.length) op.add = add;
    if (seq.join("\u0001") !== ib.join("\u0001")) op.order = ib;
    return (op.drop || op.add || op.order) ? op : null;
  }
  /* Where a new row goes: first when it follows nothing, after the row it
     names when that row is here, and last when that row has gone meanwhile
     (somebody removed it between the two saves — the row still lands). */
  function insertAfter(ids, id, after) {
    var out = ids.slice();
    if (after == null) { out.unshift(id); return out; }
    var i = out.indexOf(after);
    if (i < 0) out.push(id); else out.splice(i + 1, 0, id);
    return out;
  }

  function walkRows(at, here, tree, a, b, out, lists) {
    if (!isMap(a) || !isMap(b)) return false;
    var skip = [];
    var names = Object.keys(tree);
    for (var i = 0; i < names.length; i++) {
      var name = names[i], la = a[name], lb = b[name];
      if (la === undefined && lb === undefined) continue;
      /* §585: a list that is not there yet counts as empty, so the first row
         added to a pillar with no `tactics` key is still an add and not the
         whole unit. Anything else that is not a list sends the part whole. */
      if ((la !== undefined && !Array.isArray(la)) || (lb !== undefined && !Array.isArray(lb))) return false;
      skip.push(name);
      var A = la || [], B = lb || [];
      if (same(A, B)) continue;
      var ia = idsOf(A), ib = idsOf(B);
      if (!ia || !ib) return false;                    /* unnamed rows — whole (§191) */
      if (!sameIds(A, B)) {
        var op = listOp(at, here, name, A, B, ia, ib);
        if (op) lists.push(op);
      }
      var ma = byId(A), mb = byId(B), ids = Object.keys(ma);
      for (var j = 0; j < ids.length; j++) {
        var ra = ma[ids[j]], rb = mb[ids[j]];
        if (!rb || same(ra, rb)) continue;             /* gone, or unchanged */
        var below = tree[name];
        if (Object.keys(below).length &&
            !walkRows(at, here.concat([name, ids[j]]), below, ra, rb, out, lists)) return false;
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

  /* ── THE REVIEW, FIELD BY FIELD AND TARGET BY TARGET (§234) ──────────
     Splits a SUB_TARGET part (the review) into per-field changes, and its
     per-target maps into per-entry ones — `review.state` when the office
     moves the cycle, `review.submitted.fn:cf` when one function submits.
     A field this cannot address finely still travels, whole, as its own
     2-segment path: the fine path is an optimisation and must never be the
     only way a change can travel (§210). Returns true always — once both
     sides are maps, per-field sets and dels reproduce the next copy exactly,
     so there is nothing left to fall back to. */
  function keysAddressable(m) {
    /* A key that cannot be a path segment — a dot inside it, or nothing at
       all — sends its whole field instead. No target the platform mints
       carries a dot (unit keys, "fn:<key>"); this is the guard for one that
       somehow does, because a path the server refuses fails the WHOLE save. */
    return Object.keys(m).every(function (t) { return t && t.indexOf(".") < 0; });
  }
  function splitSubTarget(part, a, b, set, del) {
    /* A FIELD name that cannot be a path segment sends the whole PART — the
       differ must never emit a path the server refuses, because that fails
       the save entirely where travelling whole would have landed it. No
       field the platform writes has one; this guards a stored stranger. */
    if (!keysAddressable(a) || !keysAddressable(b)) return false;
    var fields = {};
    Object.keys(a).forEach(function (f) { fields[f] = 1; });
    Object.keys(b).forEach(function (f) { fields[f] = 1; });
    Object.keys(fields).forEach(function (f) {
      var inB = Object.prototype.hasOwnProperty.call(b, f);
      if (!inB) { del.push(part + "." + f); return; }
      if (same(a[f], b[f])) return;
      /* A per-target map compares entry by entry. The base's side may be
         absent — a tenant that has never parked anything holds no `parked` —
         and absent compares as empty, so the first park still travels as one
         entry and not as the whole new map beside everybody's future ones. */
      var ma = a[f] === undefined ? {} : a[f];
      if (SUB_TARGET[part].indexOf(f) > -1 && isMap(ma) && isMap(b[f]) &&
          keysAddressable(ma) && keysAddressable(b[f])) {
        var ts = {};
        Object.keys(ma).forEach(function (t) { ts[t] = 1; });
        Object.keys(b[f]).forEach(function (t) { ts[t] = 1; });
        Object.keys(ts).forEach(function (t) {
          var has = Object.prototype.hasOwnProperty.call(b[f], t);
          if (!has) { del.push(part + "." + f + "." + t); return; }
          if (same(ma[t], b[f][t])) return;
          set[part + "." + f + "." + t] = b[f][t];
        });
        return;
      }
      set[part + "." + f] = b[f];
    });
    return true;
  }

  /* The tree a given part is walked with. A keyed map's entries are plans; a
     flat part is the group, whose addressable half is its capabilities. */
  function treeFor(part) {
    /* §326: A SUPPORTING FUNCTION'S OWN PROJECTS TRAVEL ROW BY ROW. Its plan
       is one JSON blob (§118), so without this the whole function is sent on
       every figure — which is §216's fault reborn one model later, and worst
       in exactly the live case: a function head and a project owner reporting
       in the same minutes (§147.7, §301). The SAME subtree a capability's
       projects are walked with, never a second copy of it (§53.5). */
    /* §342: AND ITS ACTIONS, for the same reason and the same cost — a
       function that plans in objectives holds them in that one blob, so
       without this line its head and an action's owner reporting in the same
       minutes is §216 again. */
    if (ROW_PARTS_MAP.indexOf(part) > -1)
      return { keyObjectives: ROW_TREE.keyObjectives, items: ROW_TREE.items,
               actions: ROW_TREE.actions,
               projects: ROW_TREE.capabilities.projects };
    /* §428: the top layer's own pillars travel row by row too, as a unit's
       do, or the office and the CEO reporting in the same minutes send the
       whole group part and collide (§216). */
    if (ROW_PARTS_FLAT.indexOf(part) > -1)
      return { capabilities: ROW_TREE.capabilities, items: ROW_TREE.items };
    return null;
  }
  function entryRows(at, part, a, b) {
    var tree = treeFor(part);
    if (!tree) return null;
    var out = [], lists = [];
    if (!walkRows(at, [], tree, a, b, out, lists)) return null;
    return (out.length || lists.length) ? { rows: out, lists: lists } : null;
  }

  function graphChanges(base, next) {
    var set = {}, del = [], rows = [], lists = [];
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
            if (r) { rows = rows.concat(r.rows); lists = lists.concat(r.lists); return; }
          }
          set[k + "." + s] = n[s];
        });
        return;
      }
      if (same(b, n)) return;
      /* §234: THE REVIEW SPLITS PER FIELD AND PER TARGET — one function's
         submit must never carry every other function's report state. */
      if (SUB_TARGET[k] && isMap(b) && isMap(n)) {
        if (splitSubTarget(k, b, n, set, del)) return;
      }
      /* §216: A FLAT PART IS WALKED TOO. `org` carries every capability in the
         tenant, so before this a save made on one function travelled with all
         of them and a stale copy of somebody else's plan was judged as this
         person's — the refusal naming a function they had never opened. */
      if (ROW_PARTS_FLAT.indexOf(k) > -1) {
        var fr = entryRows(k, k, b, n);
        if (fr) { rows = rows.concat(fr.rows); lists = lists.concat(fr.lists); return; }
      }
      set[k] = n;
    });
    var out = { set: set, del: del };
    if (rows.length) out.rows = rows;
    if (lists.length) out.lists = lists;
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
  /* THE PATH SHAPES ARE AN ALLOW-LIST, NEVER A WALK (§215's rule, on the
     part paths too): one segment for a whole part, two for a keyed map's
     entry or a review field, three ONLY for a review per-target entry
     (§234). Anything else is refused rather than resolved. */
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
      if (!parts.length || parts.length > 3 || parts.some(function (p) { return !p; }))
        return { ok: false, error: "a change names a path this server does not apply: " + paths[i] };
      if (parts.length === 2 && BY_KEY.indexOf(parts[0]) < 0 && !SUB_TARGET[parts[0]])
        return { ok: false, error: "a change reaches inside a part that is written whole: " + paths[i] };
      if (parts.length === 3 &&
          !(SUB_TARGET[parts[0]] && SUB_TARGET[parts[0]].indexOf(parts[1]) > -1))
        return { ok: false, error: "a change names a path this server does not apply: " + paths[i] };
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

    /* ── LIST OPERATIONS ARE VALIDATED THE SAME WAY (§585) ──────────────
       The address is walked down the same tree, to the HOLDER of the list
       (so the path has an even number of steps), and the list itself must be
       one the tree names. What the operation does is checked for shape here
       and applied below; a row it adds must carry an id, because everything
       else in this file finds rows by id and a row with none could never be
       edited, removed or merged afterwards (§191). */
    var lists = Array.isArray(changes.lists) ? changes.lists : [];
    var listPlan = [];
    for (var L = 0; L < lists.length; L++) {
      var op = lists[L];
      if (!isMap(op) || typeof op.at !== "string" || typeof op.list !== "string")
        return bad("a list change has no address");
      var lpath = Array.isArray(op.path) ? op.path : null;
      if (!lpath || lpath.length % 2) return bad("a list change path is malformed: " + (lpath || []).join("/"));
      var lseg = op.at.split("."), lhost = null, lpart = lseg[0];
      if (lseg.length === 2 && ROW_PARTS_MAP.indexOf(lpart) > -1 && lseg[1])
        lhost = isMap(target[lpart]) ? target[lpart][lseg[1]] : null;
      else if (lseg.length === 1 && ROW_PARTS_FLAT.indexOf(lpart) > -1)
        lhost = target[lpart];
      else return bad("a list change names a part this server does not address: " + op.at);
      if (!isMap(lhost)) return bad("a list change names something that is not here: " + op.at);
      var ltree = treeFor(lpart), lholder = lhost;
      for (var lq = 0; lq < lpath.length; lq += 2) {
        if (!ltree || !Object.prototype.hasOwnProperty.call(ltree, lpath[lq]))
          return bad("a list change path this server does not apply: " + lpath.join("/"));
        lholder = byId(lholder[lpath[lq]])[String(lpath[lq + 1])] || null;
        if (!isMap(lholder)) return bad("a list change names a row that is not here: " + lpath[lq + 1]);
        ltree = ltree[lpath[lq]];
      }
      if (!ltree || !Object.prototype.hasOwnProperty.call(ltree, op.list))
        return bad("a list change names a list this server does not address: " + op.list);
      if (lholder[op.list] !== undefined && !Array.isArray(lholder[op.list]))
        return bad("a list change names something that is not a list: " + op.list);
      var ladd = op.add === undefined ? [] : op.add, ldrop = op.drop === undefined ? [] : op.drop,
          lorder = op.order === undefined ? null : op.order;
      if (!Array.isArray(ladd) || !Array.isArray(ldrop) || (lorder !== null && !Array.isArray(lorder)))
        return bad("a list change is not shaped like one");
      for (var ai = 0; ai < ladd.length; ai++) {
        var x = ladd[ai];
        if (!isMap(x) || !isMap(x.row) || x.row.id === undefined || x.row.id === null || x.row.id === "")
          return bad("a list change adds a row with no id");
        if (x.after != null && typeof x.after !== "string" && typeof x.after !== "number")
          return bad("a list change adds a row after something that is not an id");
      }
      if (!ladd.length && !ldrop.length && !lorder) return bad("a list change changes nothing: " + op.list);
      listPlan.push({ holder: lholder, list: op.list, add: ladd, drop: ldrop, order: lorder });
    }

    Object.keys(set).forEach(function (p) {
      var parts = p.split(".");
      if (parts.length === 1) { target[parts[0]] = set[p]; return; }
      if (!isMap(target[parts[0]])) target[parts[0]] = {};
      if (parts.length === 2) { target[parts[0]][parts[1]] = set[p]; return; }
      /* §234: a review per-target entry lands inside its own field's map,
         creating the map if this tenant has never held one — the first
         park writes review.parked.fn:cf into a review with no `parked`. */
      if (!isMap(target[parts[0]][parts[1]])) target[parts[0]][parts[1]] = {};
      target[parts[0]][parts[1]][parts[2]] = set[p];
    });
    /* §585: APPLIED BY ID, AND APPLIED TWICE LANDS ONCE. A dropped id that is
       already gone is nothing to do; an added row whose id is already here
       stays as it is (the add landed before — a replay must not double it);
       a new row goes after the row it names, first when it names none, and
       last when that row has gone meanwhile; an order names the rows it
       knows, and rows it does not know (added by somebody else between the
       two saves) keep their places after them rather than being lost. */
    listPlan.forEach(function (e) {
      var list = Array.isArray(e.holder[e.list]) ? e.holder[e.list].slice() : [];
      if (e.drop.length) {
        var gone = {};
        e.drop.forEach(function (id) { gone[String(id)] = 1; });
        list = list.filter(function (r) { return !(isMap(r) && gone[String(r.id)]); });
      }
      e.add.forEach(function (x) {
        var id = String(x.row.id);
        if (byId(list)[id]) return;
        var row = JSON.parse(JSON.stringify(x.row));
        var ids = list.map(function (r) { return isMap(r) ? String(r.id) : null; });
        var i = x.after == null ? -1 : ids.indexOf(String(x.after));
        if (x.after != null && i < 0) list.push(row); else list.splice(i + 1, 0, row);
      });
      if (e.order) {
        var have = byId(list), placed = {}, next = [];
        e.order.forEach(function (id) {
          id = String(id);
          if (have[id] && !placed[id]) { placed[id] = 1; next.push(have[id]); }
        });
        list.forEach(function (r) { if (!(isMap(r) && placed[String(r.id)])) next.push(r); });
        list = next;
      }
      e.holder[e.list] = list;
    });
    plan.forEach(function (e) {
      Object.keys(e.set).forEach(function (k) { e.row[k] = e.set[k]; });
      e.del.forEach(function (k) { delete e.row[k]; });
    });
    del.forEach(function (p) {
      var parts = p.split(".");
      if (parts.length === 1) { delete target[parts[0]]; return; }
      if (!isMap(target[parts[0]])) return;
      if (parts.length === 2) { delete target[parts[0]][parts[1]]; return; }
      /* §234: reopening deletes review.submitted.<target> — the key goes,
         never a false left behind (§50.6), and only that target's. */
      if (isMap(target[parts[0]][parts[1]])) delete target[parts[0]][parts[1]][parts[2]];
    });
    return { ok: true, state: target };
  }

  /* How many parts a change list touches — for the record and for a check to
     assert against, so "only what changed travels" is a measurement rather
     than a claim. */
  function countChanges(changes) {
    if (!changes) return 0;
    return Object.keys(changes.set || {}).length + ((changes.del || []).length) +
           ((changes.rows || []).length) + ((changes.lists || []).length);
  }

  /* ── ONE CHANGE LIST AS LINES (§504) ──
     A failed save is kept on the person's computer and, if they choose, sent
     to the Strategy Office — and what the office acts on is ONE LINE, never a
     whole plan, so two people's failed saves never become two versions to
     reconcile. A line is the smallest piece of a change list that still
     applies on its own through applyChanges: one part path, or one field of
     one row. `addr` names WHAT the line changes (never who sent it), which is
     how two people sending the same line are recognised as the same line. */
  function splitLines(changes) {
    var out = [];
    if (!changes || typeof changes !== "object") return out;
    var set = isMap(changes.set) ? changes.set : {};
    Object.keys(set).forEach(function (p) {
      var ch = { set: {} }; ch.set[p] = set[p];
      out.push({ addr: "p:" + p, change: ch, mine: { has: true, value: set[p] } });
    });
    (Array.isArray(changes.del) ? changes.del : []).forEach(function (p) {
      out.push({ addr: "p:" + p, change: { del: [p] }, mine: { has: false } });
    });
    (Array.isArray(changes.rows) ? changes.rows : []).forEach(function (e) {
      if (!isMap(e)) return;
      var head = "r:" + e.at + "|" + (e.path || []).join("/") + "|" + (e.id == null ? "" : e.id) + "|";
      var es = isMap(e.set) ? e.set : {};
      Object.keys(es).forEach(function (f) {
        var s1 = {}; s1[f] = es[f];
        out.push({ addr: head + f, change: { rows: [{ at: e.at, path: e.path || [], id: e.id, set: s1, del: [] }] },
                   mine: { has: true, value: es[f] } });
      });
      (Array.isArray(e.del) ? e.del : []).forEach(function (f) {
        out.push({ addr: head + f, change: { rows: [{ at: e.at, path: e.path || [], id: e.id, set: {}, del: [f] }] },
                   mine: { has: false } });
      });
    });
    /* §585: a list operation splits into one line per row it drops or adds,
       and one for the order. `l:<at>|<path>|<list>|drop|<id>` names what
       went, `…|add|<id>` what arrived (the row is the value), `…|order` the
       new sequence — so two people removing the same row are the same line,
       and a replay can ask "is it here now?" of each on its own. */
    (Array.isArray(changes.lists) ? changes.lists : []).forEach(function (op) {
      if (!isMap(op)) return;
      var head = "l:" + op.at + "|" + (op.path || []).join("/") + "|" + op.list + "|";
      var one = function (extra) {
        var o = { at: op.at, path: op.path || [], list: op.list };
        Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
        return { lists: [o] };
      };
      (Array.isArray(op.drop) ? op.drop : []).forEach(function (id) {
        out.push({ addr: head + "drop|" + id, change: one({ drop: [id] }), mine: { has: false } });
      });
      (Array.isArray(op.add) ? op.add : []).forEach(function (x) {
        if (!isMap(x) || !isMap(x.row)) return;
        out.push({ addr: head + "add|" + x.row.id, change: one({ add: [x] }), mine: { has: true, value: x.row } });
      });
      if (Array.isArray(op.order))
        out.push({ addr: head + "order", change: one({ order: op.order }), mine: { has: true, value: op.order } });
    });
    return out;
  }

  /* What a line's place holds in a graph, read leniently: anything that is
     not there answers { has:false } rather than throwing, because the graph a
     line is read against may have moved on since the line was written. */
  function valueAt(state, line) {
    var none = { has: false };
    if (!state || !line || !line.change) return none;
    var ch = line.change;
    var p = ch.set ? Object.keys(ch.set)[0] : (ch.del && ch.del[0]);
    if (p != null) {
      var parts = String(p).split("."), h = state;
      for (var i = 0; i < parts.length; i++) {
        if (!isMap(h) || !Object.prototype.hasOwnProperty.call(h, parts[i])) return none;
        h = h[parts[i]];
      }
      return { has: true, value: h };
    }
    /* §585: a list line answers with the row it names (add, drop) or with
       the list's id order (order), read off whatever the graph holds now. */
    var op = ch.lists && ch.lists[0];
    if (op) {
      var hseg = String(op.at).split("."), hh = null;
      if (hseg.length === 2) hh = isMap(state[hseg[0]]) ? state[hseg[0]][hseg[1]] : null;
      else hh = state[hseg[0]];
      var hp = op.path || [];
      for (var hq = 0; hq < hp.length; hq += 2) {
        if (!isMap(hh)) return none;
        hh = byId(hh[hp[hq]])[String(hp[hq + 1])] || null;
      }
      if (!isMap(hh) || !Array.isArray(hh[op.list])) return none;
      var lst = hh[op.list];
      if (Array.isArray(op.order))
        return { has: true, value: lst.map(function (r) { return isMap(r) && r.id != null ? String(r.id) : null; }) };
      var want = Array.isArray(op.drop) && op.drop.length ? op.drop[0]
               : (Array.isArray(op.add) && op.add[0] && isMap(op.add[0].row) ? op.add[0].row.id : null);
      if (want == null) return none;
      var hit = byId(lst)[String(want)];
      return hit ? { has: true, value: hit } : none;
    }
    var e = ch.rows && ch.rows[0];
    if (!e) return none;
    var f = Object.keys(e.set || {})[0] || (e.del || [])[0];
    var seg = String(e.at).split("."), host = null;
    if (seg.length === 2) host = isMap(state[seg[0]]) ? state[seg[0]][seg[1]] : null;
    else host = state[seg[0]];
    var path = e.path || [], holder = host;
    for (var q = 0; q < path.length; q += 2) {
      if (!isMap(holder)) return none;
      holder = byId(holder[path[q]])[String(q + 1 < path.length ? path[q + 1] : e.id)] || null;
    }
    if (!isMap(holder) || !Object.prototype.hasOwnProperty.call(holder, f)) return none;
    return { has: true, value: holder[f] };
  }

  return { graphChanges: graphChanges, applyChanges: applyChanges,
           countChanges: countChanges, BY_KEY: BY_KEY, sameValue: same,
           REVIEW_PER_TARGET: REVIEW_PER_TARGET,
           splitLines: splitLines, valueAt: valueAt };
});
