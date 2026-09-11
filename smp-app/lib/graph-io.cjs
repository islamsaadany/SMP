/* smp-app/lib/graph-io.cjs — the frozen product's lib/state-io.js, lines
   1–995 CARRIED ACROSS (spec 043 §4.8: the entity descriptors, splitRow/
   mergeRow, rowsOf/colsFor, the reader) and edited in exactly four ways for
   the shared schema:
     1. every table's rows are BUILT by tableRows(state) — writeState's own
        gathering, lifted out of the transaction so the row-addressed writer
        (state-io.ts) and the loader use one set of rows; the clear and the
        purge are gone (§314.2: no statement in a save clears a table);
     2. the four singletons (org, cycle, review, prior_cycle) carry no `id`
        — one row per tenant, keyed by tenant_id (data-model.md);
     3. loadGraph(client, state) inserts every table's rows into an EMPTY
        tenant — the migration's and the demo seed's path, never a save's;
     4. the reader's `WHERE id=1` is gone: inside withTenant the policy
        leaves one row.
   tenant_id is never written here: the column defaults to the transaction's
   own setting, so a row lands under the tenant the request is for and under
   nothing else (the policy's WITH CHECK would refuse anything else). Nothing
   about how a row is SHAPED changed, which is what S8's byte-identical plan
   asserts. */
const fs = require("fs");
const path = require("path");

/* pg returns numeric as a string to protect precision; every numeric in this
   schema is a small score or weight, so parse them back to numbers or the
   round trip turns 43 into "43". */
function tuneTypes(pg) {
  pg.types.setTypeParser(1700, function (v) { return v == null ? null : parseFloat(v); });
}


/* ── Entity descriptors ─────────────────────────────────────────────────
   cols: JS field → column. jsonCols: columns that carry JSON (stringified on
   write). drop: fields never stored (derived). Everything else → extra. */
const E = {
  groupClauses:  { table: "group_clauses" },
  groupKOs:      { table: "group_key_objectives",
    cols: { id:"id", name:"name", group:"grp", dir:"dir", target3y:"target3y",
            target:"target", compile:"compile", actual:"actual", progress:"progress" } },
  themes:        { table: "themes", cols: { ab:"ab", name:"name", note:"note" } },
  capabilities:  { table: "capabilities", cols: { id:"id", name:"name", def:"def", fn:"fn_key" },
    /* Their own tables own these. Without the drop they were written a
       second time into `extra`, where a clean slate would not reach them
       and a later save would restore them. */
    drop: ["keyObjectives", "projects"] },
  capKOs:        { table: "cap_key_objectives",
    cols: { id:"id", name:"name", dir:"dir", target:"target", compile:"compile",
            weight:"weight", actual:"actual", progress:"progress", note:"note" } },
  projects:      { table: "projects",
    cols: { id:"id", name:"name", brief:"brief", owner:"owner", timeline:"timeline",
            start:"start_label", end:"end_label", stakeholders:"stakeholders" },
    jsonCols: ["stakeholders"], drop: ["capId"] },
  /* §104. A DUE DATE IS BACK (reversing §53.4, which dropped it on the
     argument that a deliverable is delivered when the project ends -- some
     are not), and `kind`/`actual` are gone: a deliverable is reported the way
     a milestone is, so `status` and `pct` are the columns and both are typed
     properly. Still NO OWNER -- the project's owner owns it, which §53.4 got
     right and §104 does not touch. */
  deliverables:  { table: "deliverables",
    cols: { id:"id", name:"name", due:"due", status:"status", pct:"pct", note:"note" },
    drop: ["kind", "actual"] },
  outcomes:      { table: "outcomes",
    cols: { id:"id", name:"name", dir:"dir", target:"target", measureAt:"measure_at",
            actual:"actual", progress:"progress", note:"note" } },
  milestones:    { table: "milestones",
    cols: { id:"id", name:"name", covers:"covers", owner:"owner", finish:"finish",
            status:"status", pct:"pct", note:"note" } },
  units:         { table: "units",
    cols: { name:"name", navName:"nav_name", codePrefix:"code_prefix", active:"active",
            real:"real", aspiration:"aspiration", endInMind:"end_in_mind",
            company:"company" },
    drop: ["weight", "ukey", "clauses", "keyObjectives", "swot", "items"] },
  unitKOs:       { table: "unit_key_objectives",
    cols: { id:"id", name:"name", dir:"dir", target3y:"target3y", target:"target",
            compile:"compile", actual:"actual", progress:"progress", note:"note" } },
  pillars:       { table: "pillars",
    cols: { id:"id", code:"code", name:"name", sub:"sub", kind:"kind",
            theme:"theme", owner:"owner" },
    drop: ["measures", "tactics"] },
  measures:      { table: "measures",
    cols: { id:"id", name:"name", dir:"dir", target:"target", target3y:"target3y",
            compile:"compile", actual:"actual", progress:"progress", note:"note",
            horizon:"horizon" } },
  tactics:       { table: "tactics",
    cols: { id:"id", name:"name", owner:"owner", collaborators:"collaborators",
            q1:"q1", q2:"q2", q3:"q3", q4:"q4", status:"status", actual:"actual",
            note:"note" },
    jsonCols: ["collaborators"] },
  functions:     { table: "functions",
    cols: { name:"name", navName:"nav_name", codePrefix:"code_prefix",
            head:"head", custodian:"custodian", active:"active" } },
  people:        { table: "people",
    /* `role` is the SEAT role only — super / gceo / cceo. Owner, custodian and
       function head are read from what points at the person, so they are not
       stored twice and cannot disagree (§33). */
    cols: { key:"key", name:"name", role:"role", unit:"unit_key", fn:"fn_key",
            title:"title" },
    /* `role` is NOT NULL in the schema, and most people have no SEAT role at
       all — theirs is read from what points at them. An absent key inserts as
       NULL rather than falling back to the column default, so it is coerced
       here, at the one boundary that knows the column exists. */
    coerce: function (r) { if (r.role == null) r.role = ""; return r; },
    /* And undone on the way back, or the round trip is not a round trip: the
       graph would gain a `role: ""` on every person who never had the key.
       Empty and absent both mean "no seat", so only one of them belongs in the
       graph — and it is the one the platform's own data uses. */
    revive: function (o) { if (o.role === "") delete o.role; return o; } },
  labels:        { table: "labels",
    cols: { key:"key", internal:"internal", group:"grp", bu:"bu", note:"note" } },
  factors:       { table: "weighting_factors",
    cols: { key:"key", name:"name", kind:"kind", basis:"basis", weight:"weight" } },
  history:       { table: "history",
    cols: { name:"name", group:"group_score", units:"units" }, jsonCols: ["units"] },
};

const GROUP_EXTRA_KEYS = null; /* computed: everything not a table or org column */
const ORG_COLS = { org:"org_name", horizon:"horizon", asOfQuarter:"as_of_quarter",
                   aspiration:"aspiration", endInMind:"end_in_mind", mission:"mission" };
const GROUP_TABLED = ["clauses", "keyObjectives", "themes", "capabilities", "weighting"];

const ALL_TABLES = [
  "plan_archives", "companies",
  "history", "prior_cycle", "review", "cycle", "ko_weights", "weighting_rows",
  "weighting_values", "weighting_factors", "bands", "labels", "access_grants",
  "unit_roles", "people", "functions", "tactics", "measures",
  "pillars", "swot_items", "unit_key_objectives", "unit_clauses", "units",
  "milestones", "outcomes", "deliverables", "projects", "cap_key_objectives",
  "capabilities", "themes", "group_key_objectives", "group_clauses", "org",
];

/* Split an object into typed column values and the extra blob. */
function splitRow(obj, ent) {
  const cols = ent.cols || {};
  const drop = ent.drop || [];
  const row = {}, extra = {};
  Object.keys(obj).forEach(function (k) {
    if (drop.indexOf(k) > -1) return;
    if (Object.prototype.hasOwnProperty.call(cols, k)) row[cols[k]] = obj[k];
    else extra[k] = obj[k];
  });
  return { row, extra };
}

/* Merge a database row back into the object shape. Null columns are omitted —
   the codebase reads every optional field with == null, so absent and null
   are the same word. `false`, 0 and "" are values and survive. */
function mergeRow(dbRow, ent) {
  const out = Object.assign({}, dbRow.extra || {});
  const cols = ent.cols || {};
  Object.keys(cols).forEach(function (jsKey) {
    const v = dbRow[cols[jsKey]];
    if (v !== null && v !== undefined) out[jsKey] = v;
  });
  /* An entity may undo a write-side coercion here, so the graph that comes
     back out is the graph that went in. Without it a NOT NULL column forces a
     value into every object, and the round trip stops being one. */
  return ent.revive ? ent.revive(out) : out;
}

/* POSTGRES TAKES 65535 BIND PARAMETERS AND NOT ONE MORE (§195).
   Harmless while the writer issued a statement per parent — no single one
   could get large. Batching per table removes that accident, so the cap is
   asked for out loud instead: the rows are written in chunks that cannot
   reach it, whatever a tenant grows to. Rows are written in order within a
   chunk and chunks in order, so `idx` still lands where it was read. */
const MAX_PARAMS = 60000;

async function insertMany(client, table, colNames, rows) {
  if (!rows.length) return;
  const per = Math.max(1, Math.floor(MAX_PARAMS / Math.max(1, colNames.length)));
  if (rows.length > per) {
    for (let i = 0; i < rows.length; i += per) {
      await insertChunk(client, table, colNames, rows.slice(i, i + per));
    }
    return;
  }
  return insertChunk(client, table, colNames, rows);
}

async function insertChunk(client, table, colNames, rows) {
  const params = [];
  const tuples = rows.map(function (r, i) {
    const ph = colNames.map(function (_, j) { return "$" + (i * colNames.length + j + 1); });
    colNames.forEach(function (c) { params.push(r[c] === undefined ? null : r[c]); });
    return "(" + ph.join(",") + ")";
  });
  const quoted = colNames.map(function (c) { return '"' + c + '"'; });
  await client.query(
    "INSERT INTO " + table + " (" + quoted.join(",") + ") VALUES " + tuples.join(","),
    params
  );
}

function j(v) { return v === undefined ? null : JSON.stringify(v); }

/* Build the insertable rows for a list, and the column list for a table.
   Lifted to module scope (2026-09-01) so the incremental writer below builds
   BYTE-IDENTICAL rows to writeState — they are the same two functions, used by
   both, rather than a second copy that could drift. Pure: they read only the
   entity descriptor, splitRow and j. */
function rowsOf(list, ent, parent) {
  return (list || []).map(function (o, i) {
    const s = splitRow(o, ent);
    const r = s.row;
    (ent.jsonCols || []).forEach(function (c) { if (r[c] !== undefined) r[c] = j(r[c]); });
    r.idx = i;
    r.extra = j(s.extra);
    if (parent) Object.assign(r, parent(o, i));
    return ent.coerce ? ent.coerce(r) : r;
  });
}
function colsFor(ent, more) {
  const base = Object.keys(ent.cols || {}).map(function (k) { return ent.cols[k]; });
  return base.concat(["idx", "extra"], more || []);
}

/* ── Write ─────────────────────────────────────────────────────────── */
function tableRows(state) {
  const out = [];
  const push = function (table, cols, rows) { out.push({ table: table, cols: cols, rows: rows }); };
  /* When the caller already holds a transaction, writeState must NOT open or
     close its own — a nested BEGIN is a no-op that warns, and the inner COMMIT
     would end the CALLER's transaction early. api/state.js wraps the whole
     read-authorise-write in one transaction under a transaction-scoped
     advisory lock (so concurrent saves take turns, and the lock is the only
     kind that holds up behind PgBouncer/Neon transaction pooling), and calls
     this with { inTransaction: true }. Every other caller (the seed, the
     tests) passes nothing and keeps the self-contained transaction it had. */

    /* org — the group's scalar fields; everything else on GROUP that is not
       its own table travels in extra. */
    const g = state.group;
    const orgExtra = {};
    Object.keys(g).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(ORG_COLS, k)) return;
      if (GROUP_TABLED.indexOf(k) > -1) return;
      orgExtra[k] = g[k];
    });
    push("org", ["org_name", "horizon", "as_of_quarter", "aspiration", "end_in_mind", "mission", "extra"],
      [{ org_name: g.org, horizon: g.horizon, as_of_quarter: g.asOfQuarter, aspiration: g.aspiration,
         end_in_mind: g.endInMind, mission: g.mission, extra: j(orgExtra) }]);

    push("group_clauses", ["idx", "label", "text_", "cid"],
      (g.clauses || []).map(function (c, i) { return { idx: i, label: c[0], text_: c[1], cid: c[2] }; }));

    push("group_key_objectives", colsFor(E.groupKOs), rowsOf(g.keyObjectives, E.groupKOs));
    push("themes", colsFor(E.themes), rowsOf(g.themes, E.themes));
    push("capabilities", colsFor(E.capabilities), rowsOf(g.capabilities, E.capabilities));

    /* ── ONE STATEMENT PER TABLE, NEVER ONE PER PARENT (§195) ────────────
       These four loops used to issue an INSERT inside them, so the writer's
       cost was one round trip per capability, per project, per unit and per
       pillar rather than one per table. Measured on the demo tenant: 190
       round trips to write a graph of 30 tables. Locally that is 111ms and
       invisible; every one of them is a network crossing in production, and
       236 of them is what a save actually costs.

       The rows are gathered and written per table instead. Nothing about
       WHAT is written changes — same rows, same columns, same `idx` (it is
       taken from each child list's own position, so gathering cannot move
       it) — and the ORDER of the tables is unchanged, which is what keeps
       every foreign key satisfied inside the one transaction: a parent is
       still written before anything that points at it. */
    const capKOs = [], projRows = [], delivRows = [], outRows = [], msRows = [];
    for (const c of g.capabilities || []) {
      capKOs.push.apply(capKOs,
        rowsOf(c.keyObjectives, E.capKOs, function () { return { cap_id: c.id }; }));
      projRows.push.apply(projRows,
        rowsOf(c.projects, E.projects, function () { return { cap_id: c.id }; }));
      for (const p of c.projects || []) {
        delivRows.push.apply(delivRows,
          rowsOf(p.deliverables, E.deliverables, function () { return { project_id: p.id }; }));
        outRows.push.apply(outRows,
          rowsOf(p.outcomes, E.outcomes, function () { return { project_id: p.id }; }));
        msRows.push.apply(msRows,
          rowsOf(p.milestones, E.milestones, function () { return { project_id: p.id }; }));
      }
    }
    push("cap_key_objectives", colsFor(E.capKOs, ["cap_id"]), capKOs);
    push("projects", colsFor(E.projects, ["cap_id"]), projRows);
    push("deliverables", colsFor(E.deliverables, ["project_id"]), delivRows);
    push("outcomes", colsFor(E.outcomes, ["project_id"]), outRows);
    push("milestones", colsFor(E.milestones, ["project_id"]), msRows);

    /* Units, in navigation order (order is data — the arrangement feature). */
    const unitRows = (state.unitKeys || []).map(function (k, i) {
      const u = state.units[k];
      const s = splitRow(u, E.units);
      const r = s.row;
      r.key = k; r.idx = i; r.extra = j(s.extra);
      return r;
    });
    push("units", colsFor(E.units, ["key"]), unitRows);

    /* Companies keep their declared order: the Setup table reads in it. */
    push("companies",
      ["key", "idx", "name", "ceo", "see_others", "see_group", "active"],
      (state.companyKeys || []).map(function (k, i) {
        const c = (state.companies || {})[k] || {};
        return { key: k, idx: i, name: c.name || "", ceo: c.ceo || null,
                 see_others: !!c.seeOthers, see_group: c.seeGroup !== false,
                 active: c.active !== false };
      }));

    /* Gathered per table, for §195's reason above. */
    const uClauses = [], uKOs = [], swotRows = [], pillarRows = [],
          measureRows = [], tacticRows = [];
    for (const k of state.unitKeys || []) {
      const u = state.units[k];
      (u.clauses || []).forEach(function (c, i) {
        uClauses.push({ unit_key: k, idx: i, label: c[0], text_: c[1], cid: c[2] });
      });
      uKOs.push.apply(uKOs,
        rowsOf(u.keyObjectives, E.unitKOs, function () { return { unit_key: k }; }));
      ["s", "w", "o", "t"].forEach(function (cat) {
        ((u.swot || {})[cat] || []).forEach(function (t, i) {
          swotRows.push({ unit_key: k, cat: cat, idx: i, text_: t });
        });
      });
      pillarRows.push.apply(pillarRows,
        rowsOf(u.items, E.pillars, function () { return { unit_key: k }; }));
      for (const p of u.items || []) {
        measureRows.push.apply(measureRows,
          rowsOf(p.measures, E.measures, function () { return { pillar_id: p.id }; }));
        tacticRows.push.apply(tacticRows,
          rowsOf(p.tactics, E.tactics, function () { return { pillar_id: p.id }; }));
      }
    }
    push("unit_clauses", ["unit_key", "idx", "label", "text_", "cid"], uClauses);
    push("unit_key_objectives", colsFor(E.unitKOs, ["unit_key"]), uKOs);
    push("swot_items", ["unit_key", "cat", "idx", "text_"], swotRows);
    push("pillars", colsFor(E.pillars, ["unit_key"]), pillarRows);
    push("measures", colsFor(E.measures, ["pillar_id"]), measureRows);
    push("tactics", colsFor(E.tactics, ["pillar_id"]), tacticRows);

    const fnRows = (state.functionKeys || []).map(function (k, i) {
      const s = splitRow(state.functions[k], E.functions);
      const r = s.row;
      r.key = k; r.idx = i; r.extra = j(s.extra);
      return r;
    });
    push("functions", colsFor(E.functions, ["key"]), fnRows);

    push("people", colsFor(E.people), rowsOf(state.people, E.people));
    push("unit_roles", ["unit_key", "head", "custodian"],
      Object.keys(state.unitRoles || {}).map(function (k) {
        return { unit_key: k, head: state.unitRoles[k].head, custodian: state.unitRoles[k].custodian };
      }));

    const grantRows = [];
    Object.keys(state.access || {}).forEach(function (role) {
      Object.keys(state.access[role]).forEach(function (pg) {
        grantRows.push({ role_key: role, page_key: pg, grant_: state.access[role][pg] });
      });
    });
    push("access_grants", ["role_key", "page_key", "grant_"], grantRows);

    push("labels", colsFor(E.labels), rowsOf(state.labels, E.labels));
    push("bands", ["idx", "key", "floor", "label"],
      (state.bands || []).map(function (b, i) { return { idx: i, key: b.key, floor: b.floor, label: b.label }; }));

    const w = g.weighting || { factors: [], units: [] };
    push("weighting_factors", colsFor(E.factors), rowsOf(w.factors, E.factors));
    const wRows = [], wVals = [];
    (w.units || []).forEach(function (row, i) {
      const known = { key: 1, unit: 1, why: 1 };
      const extra = {};
      Object.keys(row).forEach(function (f) {
        if (known[f]) return;
        const isFactor = (w.factors || []).some(function (x) { return x.key === f; });
        if (isFactor) wVals.push({ unit_key: row.key, factor_key: f, value: row[f] });
        else extra[f] = row[f];
      });
      wRows.push({ unit_key: row.key, idx: i, unit_name: row.unit, why: row.why, extra: j(extra) });
    });
    push("weighting_rows", ["unit_key", "idx", "unit_name", "why", "extra"], wRows);
    push("weighting_values", ["unit_key", "factor_key", "value"], wVals);

    push("ko_weights", ["unit_key", "weights"],
      Object.keys(state.koWeights || {})
        .filter(function (k) { return state.koWeights[k] != null; })
        .map(function (k) { return { unit_key: k, weights: j(state.koWeights[k]) }; }));

    const cy = state.cycle || {};
    const cyExtra = {};
    Object.keys(cy).forEach(function (k) {
      if (["name", "rewardAt", "locked", "focus"].indexOf(k) === -1) cyExtra[k] = cy[k];
    });
    push("cycle", ["name", "reward_at", "locked", "focus", "extra"],
      [{ name: cy.name, reward_at: cy.rewardAt, locked: !!cy.locked, focus: j(cy.focus || {}), extra: j(cyExtra) }]);

    const rv = state.review || {};
    const rvExtra = {};
    Object.keys(rv).forEach(function (k) {
      if (["name", "from", "to", "due", "endsQuarter", "state", "cadence", "note", "submitted"].indexOf(k) === -1)
        rvExtra[k] = rv[k];
    });
    push("review", ["name", "from_label", "to_label", "due_label", "ends_quarter", "state", "cadence", "notes", "submitted", "extra"],
      [{ name: rv.name, from_label: rv.from || "", to_label: rv.to || "", due_label: rv.due || "", ends_quarter: rv.endsQuarter,
         state: rv.state, cadence: rv.cadence, notes: j(rv.note || {}), submitted: j(rv.submitted || {}), extra: j(rvExtra) }]);

    push("history", colsFor(E.history), rowsOf(state.history, E.history));
    push("prior_cycle", ["data"], state.priorCycle ? [{ data: j(state.priorCycle) }] : []);

    /* Archived plans keep their order: the list reads newest first and that
       order is the tenant's, not the database's idea of one. */
    push("plan_archives",
      ["id", "idx", "kind", "key", "name", "at_label", "by_name", "why", "counts",
       "plan", "figures"],
      (state.archives || []).map(function (a, i) {
        return { id: a.id, idx: i, kind: a.kind, key: a.key || "", name: a.name,
                 at_label: a.at, by_name: a.by, why: a.why,
                 counts: j(a.counts || {}),
                 /* Whichever payload this kind carries; the other stays NULL,
                    so the round trip cannot invent a field the graph never
                    held (§42.9). */
                 plan: a.plan === undefined ? null : j(a.plan),
                 figures: a.figures === undefined ? null : j(a.figures) };
      }));

    return out;
}

/* Into an EMPTY tenant only — the migration and the demo seed. Refuses a
   tenant holding anything, because the save never comes here (§314.2). */
async function loadGraph(client, state) {
  const here = (await client.query("SELECT count(*)::int AS n FROM org")).rows[0].n;
  if (here) throw new Error("loadGraph: this tenant already holds a graph");
  for (const t of tableRows(state)) await insertMany(client, t.table, t.cols, t.rows);
}

/* The subject-addressed incremental writer (§241) is NOT carried across:
   the save writes the ROWS its change list names (state-io.ts, §314.2). */

const READ_SQL = [
  "SELECT * FROM access_grants",
  "SELECT * FROM bands ORDER BY idx",
  "SELECT * FROM cap_key_objectives ORDER BY cap_id, idx",
  "SELECT * FROM capabilities ORDER BY idx",
  "SELECT * FROM companies ORDER BY idx",
  "SELECT * FROM cycle",
  "SELECT * FROM deliverables ORDER BY project_id, idx",
  "SELECT * FROM functions ORDER BY idx",
  "SELECT * FROM group_clauses ORDER BY idx",
  "SELECT * FROM group_key_objectives ORDER BY idx",
  "SELECT * FROM history ORDER BY idx",
  "SELECT * FROM ko_weights",
  "SELECT * FROM labels ORDER BY idx",
  "SELECT * FROM measures ORDER BY pillar_id, idx",
  "SELECT * FROM milestones ORDER BY project_id, idx",
  "SELECT * FROM org",
  "SELECT * FROM outcomes ORDER BY project_id, idx",
  "SELECT * FROM people ORDER BY idx",
  "SELECT * FROM pillars ORDER BY unit_key, idx",
  "SELECT * FROM plan_archives ORDER BY idx",
  "SELECT * FROM prior_cycle",
  "SELECT * FROM projects ORDER BY cap_id, idx",
  "SELECT * FROM review",
  "SELECT * FROM swot_items ORDER BY unit_key, cat, idx",
  "SELECT * FROM tactics ORDER BY pillar_id, idx",
  "SELECT * FROM themes ORDER BY idx",
  "SELECT * FROM unit_clauses ORDER BY unit_key, idx",
  "SELECT * FROM unit_key_objectives ORDER BY unit_key, idx",
  "SELECT * FROM unit_roles",
  "SELECT * FROM units ORDER BY idx",
  "SELECT * FROM weighting_factors ORDER BY idx",
  "SELECT * FROM weighting_rows ORDER BY idx",
  "SELECT * FROM weighting_values"
];

async function prefetchReads(client) {
  try {
    const res = await client.query(READ_SQL.join(";\n"));
    const list = Array.isArray(res) ? res : [res];
    /* All or nothing: a short answer means the shape is not what this assumed,
       and half a cache is worse than none. */
    if (list.length !== READ_SQL.length) return null;
    const out = {};
    READ_SQL.forEach(function (sql, i) { out[sql] = list[i].rows; });
    return out;
  } catch (e) {
    /* Fall back to reading one at a time — which is exactly what this did
       before, so a failure here costs speed and never correctness. A real
       error (a missing table) surfaces from the individual query instead,
       naming the same thing. */
    return null;
  }
}

/* ── Read ──────────────────────────────────────────────────────────── */
async function readState(client) {
  const pre = await prefetchReads(client);
  const q = async function (sql) {
    if (pre && Object.prototype.hasOwnProperty.call(pre, sql)) return pre[sql];
    return (await client.query(sql)).rows;
  };

  const org = (await q("SELECT * FROM org"))[0];
  if (!org) return null;

  const group = Object.assign({}, org.extra || {});
  group.org = org.org_name;
  group.horizon = org.horizon;
  group.asOfQuarter = org.as_of_quarter;
  group.aspiration = org.aspiration;
  group.endInMind = org.end_in_mind;
  group.mission = org.mission;

  /* Group clauses are [label, text] pairs; only unit clauses carry a third
     element (their id). A null id must come back as a pair, not a triple. */
  group.clauses = (await q("SELECT * FROM group_clauses ORDER BY idx"))
    .map(function (r) { return r.cid == null ? [r.label, r.text_] : [r.label, r.text_, r.cid]; });
  group.keyObjectives = (await q("SELECT * FROM group_key_objectives ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.groupKOs); });
  group.themes = (await q("SELECT * FROM themes ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.themes); });

  const capKOs = await q("SELECT * FROM cap_key_objectives ORDER BY cap_id, idx");
  const projs = await q("SELECT * FROM projects ORDER BY cap_id, idx");
  const delivs = await q("SELECT * FROM deliverables ORDER BY project_id, idx");
  const outs = await q("SELECT * FROM outcomes ORDER BY project_id, idx");
  const miles = await q("SELECT * FROM milestones ORDER BY project_id, idx");
  const byKey = function (rows, key) {
    const m = {};
    rows.forEach(function (r) { (m[r[key]] = m[r[key]] || []).push(r); });
    return m;
  };
  const capKOBy = byKey(capKOs, "cap_id"), projBy = byKey(projs, "cap_id");
  const delivBy = byKey(delivs, "project_id"), outBy = byKey(outs, "project_id"),
        mileBy = byKey(miles, "project_id");

  group.capabilities = (await q("SELECT * FROM capabilities ORDER BY idx")).map(function (r) {
    const c = mergeRow(r, E.capabilities);
    c.keyObjectives = (capKOBy[r.id] || []).map(function (x) { return mergeRow(x, E.capKOs); });
    c.projects = (projBy[r.id] || []).map(function (pr) {
      const p = mergeRow(pr, E.projects);
      p.capId = r.id;
      p.deliverables = (delivBy[pr.id] || []).map(function (x) { return mergeRow(x, E.deliverables); });
      p.outcomes = (outBy[pr.id] || []).map(function (x) { return mergeRow(x, E.outcomes); });
      p.milestones = (mileBy[pr.id] || []).map(function (x) { return mergeRow(x, E.milestones); });
      return p;
    });
    return c;
  });

  const factors = (await q("SELECT * FROM weighting_factors ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.factors); });
  const wVals = await q("SELECT * FROM weighting_values");
  const wValBy = {};
  wVals.forEach(function (r) { (wValBy[r.unit_key] = wValBy[r.unit_key] || {})[r.factor_key] = r.value; });
  const wUnits = (await q("SELECT * FROM weighting_rows ORDER BY idx")).map(function (r) {
    const row = Object.assign({}, r.extra || {});
    row.key = r.unit_key;
    if (r.unit_name !== null) row.unit = r.unit_name;
    if (r.why !== null) row.why = r.why;
    Object.assign(row, wValBy[r.unit_key] || {});
    return row;
  });
  group.weighting = { factors: factors, units: wUnits };

  /* Read before the units, because a unit names its company. */
  const companyRows = await q("SELECT * FROM companies ORDER BY idx");
  const companyKeys = companyRows.map(function (r) { return r.key; });
  const companies = {};
  companyRows.forEach(function (r) {
    /* `active` is written only when it is FALSE, because that is how the
       platform holds it — a live company has no flag at all, and inventing a
       `true` here would make every read differ from what was written (§42.9,
       the phantom-field lesson branding() taught). */
    companies[r.key] = { name: r.name, ceo: r.ceo,
                         seeOthers: r.see_others, seeGroup: r.see_group };
    if (r.active === false) companies[r.key].active = false;
  });

  const unitRows = await q("SELECT * FROM units ORDER BY idx");
  const unitKeys = unitRows.map(function (r) { return r.key; });
  const uClauses = byKey(await q("SELECT * FROM unit_clauses ORDER BY unit_key, idx"), "unit_key");
  const uKOs = byKey(await q("SELECT * FROM unit_key_objectives ORDER BY unit_key, idx"), "unit_key");
  const uSwot = byKey(await q("SELECT * FROM swot_items ORDER BY unit_key, cat, idx"), "unit_key");
  const uPillars = byKey(await q("SELECT * FROM pillars ORDER BY unit_key, idx"), "unit_key");
  const pMeasures = byKey(await q("SELECT * FROM measures ORDER BY pillar_id, idx"), "pillar_id");
  const pTactics = byKey(await q("SELECT * FROM tactics ORDER BY pillar_id, idx"), "pillar_id");

  const units = {};
  unitRows.forEach(function (r) {
    const u = mergeRow(r, E.units);
    u.weight = 0; /* derived — recomputed by syncWeights() after hydration */
    u.clauses = (uClauses[r.key] || []).map(function (c) { return [c.label, c.text_, c.cid]; });
    u.keyObjectives = (uKOs[r.key] || []).map(function (x) { return mergeRow(x, E.unitKOs); });
    const swot = { s: [], w: [], o: [], t: [] };
    (uSwot[r.key] || []).forEach(function (x) { swot[x.cat].push(x.text_); });
    u.swot = swot;
    u.items = (uPillars[r.key] || []).map(function (pr) {
      const p = mergeRow(pr, E.pillars);
      p.measures = (pMeasures[pr.id] || []).map(function (x) { return mergeRow(x, E.measures); });
      p.tactics = (pTactics[pr.id] || []).map(function (x) {
        const t = mergeRow(x, E.tactics);
        /* Quarter flags are 1/0 in the platform (§5.5) and boolean in the
           database — map them back so the round trip is exact. */
        ["q1", "q2", "q3", "q4"].forEach(function (qk) { t[qk] = t[qk] ? 1 : 0; });
        return t;
      });
      return p;
    });
    u.ukey = r.key;
    units[r.key] = u;
  });

  const fnRows = await q("SELECT * FROM functions ORDER BY idx");
  const functionKeys = fnRows.map(function (r) { return r.key; });
  const functions = {};
  fnRows.forEach(function (r) { functions[r.key] = mergeRow(r, E.functions); });

  const people = (await q("SELECT * FROM people ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.people); });

  const unitRoles = {};
  (await q("SELECT * FROM unit_roles")).forEach(function (r) {
    unitRoles[r.unit_key] = { head: r.head, custodian: r.custodian };
  });

  const access = {};
  (await q("SELECT * FROM access_grants")).forEach(function (r) {
    (access[r.role_key] = access[r.role_key] || {})[r.page_key] = r.grant_;
  });

  const labels = (await q("SELECT * FROM labels ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.labels); });
  const bands = (await q("SELECT * FROM bands ORDER BY idx"))
    .map(function (r) { return { key: r.key, floor: r.floor, label: r.label }; });

  const koWeights = {};
  (await q("SELECT * FROM ko_weights")).forEach(function (r) { koWeights[r.unit_key] = r.weights; });

  const cyRow = (await q("SELECT * FROM cycle"))[0] || {};
  const cycle = Object.assign({}, cyRow.extra || {},
    { name: cyRow.name, rewardAt: cyRow.reward_at, locked: cyRow.locked, focus: cyRow.focus || {} });

  const rvRow = (await q("SELECT * FROM review"))[0] || {};
  const review = Object.assign({}, rvRow.extra || {}, {
    name: rvRow.name, from: rvRow.from_label, to: rvRow.to_label, due: rvRow.due_label,
    endsQuarter: rvRow.ends_quarter, state: rvRow.state,
    note: rvRow.notes || {}, submitted: rvRow.submitted || {},
  });
  if (rvRow.cadence !== null && rvRow.cadence !== undefined) review.cadence = rvRow.cadence;

  const history = (await q("SELECT * FROM history ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.history); });

  const pcRow = (await q("SELECT * FROM prior_cycle"))[0];

  const state = {
    companies: companies, companyKeys: companyKeys,
    group: group, unitKeys: unitKeys, units: units,
    functionKeys: functionKeys, functions: functions,
    people: people, unitRoles: unitRoles, access: access,
    labels: labels, bands: bands, koWeights: koWeights,
    cycle: cycle, review: review, history: history,
  };
  if (pcRow) state.priorCycle = pcRow.data;

  state.archives = (await q("SELECT * FROM plan_archives ORDER BY idx")).map(function (r) {
    var a = { id: r.id, kind: r.kind, key: r.key, name: r.name, at: r.at_label,
              by: r.by_name, why: r.why, counts: r.counts };
    if (r.plan    != null) a.plan    = r.plan;
    if (r.figures != null) a.figures = r.figures;
    return a;
  });
  return state;
}

/* ── Ready: schema + migrations + seed-if-empty, advisory-locked ───── */
module.exports = { E, ALL_TABLES, GROUP_TABLED, ORG_COLS, splitRow, mergeRow, rowsOf, colsFor, j,
                   insertMany, tableRows, loadGraph, readState, prefetchReads, tuneTypes };
