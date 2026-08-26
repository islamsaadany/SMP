/* State in, state out — one module owns both directions, so the seed, the
   save path and the read path can never disagree about the shape.

   The contract: writeState(readState()) is a fixed point. Typed columns are
   listed once per entity below; every other field on an object lands in that
   row's `extra` JSONB and is merged back on read, which is what makes the
   round trip lossless and provable (the deep-equal check in the tests).

   Derived figures are never stored (§5.1): a unit's weight is dropped on
   write and recomputed from the factor table after hydration. */

const fs = require("fs");
const path = require("path");

/* pg returns numeric as a string to protect precision; every numeric in this
   schema is a small score or weight, so parse them back to numbers or the
   round trip turns 43 into "43". */
function tuneTypes(pg) {
  pg.types.setTypeParser(1700, function (v) { return v == null ? null : parseFloat(v); });
}

function dbDir() {
  const candidates = [
    path.join(process.cwd(), "db"),
    path.join(__dirname, "..", "db"),
  ];
  for (const c of candidates) if (fs.existsSync(path.join(c, "schema.sql"))) return c;
  throw new Error("db/ directory not found");
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
  /* §103. A DUE DATE IS BACK (reversing §53.4, which dropped it on the
     argument that a deliverable is delivered when the project ends -- some
     are not), and `kind`/`actual` are gone: a deliverable is reported the way
     a milestone is, so `status` and `pct` are the columns and both are typed
     properly. Still NO OWNER -- the project's owner owns it, which §53.4 got
     right and §103 does not touch. */
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

async function insertMany(client, table, colNames, rows) {
  if (!rows.length) return;
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

/* ── Write ─────────────────────────────────────────────────────────── */
async function writeState(client, state) {
  await client.query("BEGIN");
  try {
    await client.query("TRUNCATE " + ALL_TABLES.join(", ") + " CASCADE");

    /* org — the group's scalar fields; everything else on GROUP that is not
       its own table travels in extra. */
    const g = state.group;
    const orgExtra = {};
    Object.keys(g).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(ORG_COLS, k)) return;
      if (GROUP_TABLED.indexOf(k) > -1) return;
      orgExtra[k] = g[k];
    });
    await client.query(
      "INSERT INTO org (id, org_name, horizon, as_of_quarter, aspiration, end_in_mind, mission, extra) " +
      "VALUES (1,$1,$2,$3,$4,$5,$6,$7)",
      [g.org, g.horizon, g.asOfQuarter, g.aspiration, g.endInMind, g.mission, j(orgExtra)]
    );

    await insertMany(client, "group_clauses", ["idx", "label", "text_", "cid"],
      (g.clauses || []).map(function (c, i) { return { idx: i, label: c[0], text_: c[1], cid: c[2] }; }));

    const rowsOf = function (list, ent, parent) {
      return (list || []).map(function (o, i) {
        const s = splitRow(o, ent);
        const r = s.row;
        (ent.jsonCols || []).forEach(function (c) { if (r[c] !== undefined) r[c] = j(r[c]); });
        r.idx = i;
        r.extra = j(s.extra);
        if (parent) Object.assign(r, parent(o, i));
        return ent.coerce ? ent.coerce(r) : r;
      });
    };
    const colsFor = function (ent, more) {
      const base = Object.keys(ent.cols || {}).map(function (k) { return ent.cols[k]; });
      return base.concat(["idx", "extra"], more || []);
    };

    await insertMany(client, "group_key_objectives", colsFor(E.groupKOs), rowsOf(g.keyObjectives, E.groupKOs));
    await insertMany(client, "themes", colsFor(E.themes), rowsOf(g.themes, E.themes));
    await insertMany(client, "capabilities", colsFor(E.capabilities), rowsOf(g.capabilities, E.capabilities));

    for (const c of g.capabilities || []) {
      await insertMany(client, "cap_key_objectives", colsFor(E.capKOs, ["cap_id"]),
        rowsOf(c.keyObjectives, E.capKOs, function () { return { cap_id: c.id }; }));
      await insertMany(client, "projects", colsFor(E.projects, ["cap_id"]),
        rowsOf(c.projects, E.projects, function () { return { cap_id: c.id }; }));
      for (const p of c.projects || []) {
        await insertMany(client, "deliverables", colsFor(E.deliverables, ["project_id"]),
          rowsOf(p.deliverables, E.deliverables, function () { return { project_id: p.id }; }));
        await insertMany(client, "outcomes", colsFor(E.outcomes, ["project_id"]),
          rowsOf(p.outcomes, E.outcomes, function () { return { project_id: p.id }; }));
        await insertMany(client, "milestones", colsFor(E.milestones, ["project_id"]),
          rowsOf(p.milestones, E.milestones, function () { return { project_id: p.id }; }));
      }
    }

    /* Units, in navigation order (order is data — the arrangement feature). */
    const unitRows = (state.unitKeys || []).map(function (k, i) {
      const u = state.units[k];
      const s = splitRow(u, E.units);
      const r = s.row;
      r.key = k; r.idx = i; r.extra = j(s.extra);
      return r;
    });
    await insertMany(client, "units", colsFor(E.units, ["key"]), unitRows);

    /* Companies keep their declared order: the Setup table reads in it. */
    await insertMany(client, "companies",
      ["key", "idx", "name", "ceo", "see_others", "see_group", "active"],
      (state.companyKeys || []).map(function (k, i) {
        const c = (state.companies || {})[k] || {};
        return { key: k, idx: i, name: c.name || "", ceo: c.ceo || null,
                 see_others: !!c.seeOthers, see_group: c.seeGroup !== false,
                 active: c.active !== false };
      }));

    for (const k of state.unitKeys || []) {
      const u = state.units[k];
      await insertMany(client, "unit_clauses", ["unit_key", "idx", "label", "text_", "cid"],
        (u.clauses || []).map(function (c, i) {
          return { unit_key: k, idx: i, label: c[0], text_: c[1], cid: c[2] };
        }));
      await insertMany(client, "unit_key_objectives", colsFor(E.unitKOs, ["unit_key"]),
        rowsOf(u.keyObjectives, E.unitKOs, function () { return { unit_key: k }; }));
      const swotRows = [];
      ["s", "w", "o", "t"].forEach(function (cat) {
        ((u.swot || {})[cat] || []).forEach(function (t, i) {
          swotRows.push({ unit_key: k, cat: cat, idx: i, text_: t });
        });
      });
      await insertMany(client, "swot_items", ["unit_key", "cat", "idx", "text_"], swotRows);
      await insertMany(client, "pillars", colsFor(E.pillars, ["unit_key"]),
        rowsOf(u.items, E.pillars, function () { return { unit_key: k }; }));
      for (const p of u.items || []) {
        await insertMany(client, "measures", colsFor(E.measures, ["pillar_id"]),
          rowsOf(p.measures, E.measures, function () { return { pillar_id: p.id }; }));
        await insertMany(client, "tactics", colsFor(E.tactics, ["pillar_id"]),
          rowsOf(p.tactics, E.tactics, function () { return { pillar_id: p.id }; }));
      }
    }

    const fnRows = (state.functionKeys || []).map(function (k, i) {
      const s = splitRow(state.functions[k], E.functions);
      const r = s.row;
      r.key = k; r.idx = i; r.extra = j(s.extra);
      return r;
    });
    await insertMany(client, "functions", colsFor(E.functions, ["key"]), fnRows);

    await insertMany(client, "people", colsFor(E.people), rowsOf(state.people, E.people));
    await insertMany(client, "unit_roles", ["unit_key", "head", "custodian"],
      Object.keys(state.unitRoles || {}).map(function (k) {
        return { unit_key: k, head: state.unitRoles[k].head, custodian: state.unitRoles[k].custodian };
      }));

    const grantRows = [];
    Object.keys(state.access || {}).forEach(function (role) {
      Object.keys(state.access[role]).forEach(function (pg) {
        grantRows.push({ role_key: role, page_key: pg, grant_: state.access[role][pg] });
      });
    });
    await insertMany(client, "access_grants", ["role_key", "page_key", "grant_"], grantRows);

    await insertMany(client, "labels", colsFor(E.labels), rowsOf(state.labels, E.labels));
    await insertMany(client, "bands", ["idx", "key", "floor", "label"],
      (state.bands || []).map(function (b, i) { return { idx: i, key: b.key, floor: b.floor, label: b.label }; }));

    const w = g.weighting || { factors: [], units: [] };
    await insertMany(client, "weighting_factors", colsFor(E.factors), rowsOf(w.factors, E.factors));
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
    await insertMany(client, "weighting_rows", ["unit_key", "idx", "unit_name", "why", "extra"], wRows);
    await insertMany(client, "weighting_values", ["unit_key", "factor_key", "value"], wVals);

    await insertMany(client, "ko_weights", ["unit_key", "weights"],
      Object.keys(state.koWeights || {})
        .filter(function (k) { return state.koWeights[k] != null; })
        .map(function (k) { return { unit_key: k, weights: j(state.koWeights[k]) }; }));

    const cy = state.cycle || {};
    const cyExtra = {};
    Object.keys(cy).forEach(function (k) {
      if (["name", "rewardAt", "locked", "focus"].indexOf(k) === -1) cyExtra[k] = cy[k];
    });
    await client.query(
      "INSERT INTO cycle (id, name, reward_at, locked, focus, extra) VALUES (1,$1,$2,$3,$4,$5)",
      [cy.name, cy.rewardAt, !!cy.locked, j(cy.focus || {}), j(cyExtra)]);

    const rv = state.review || {};
    const rvExtra = {};
    Object.keys(rv).forEach(function (k) {
      if (["name", "from", "to", "due", "endsQuarter", "state", "cadence", "note", "submitted"].indexOf(k) === -1)
        rvExtra[k] = rv[k];
    });
    await client.query(
      "INSERT INTO review (id, name, from_label, to_label, due_label, ends_quarter, state, cadence, notes, submitted, extra) " +
      "VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [rv.name, rv.from || "", rv.to || "", rv.due || "", rv.endsQuarter, rv.state, rv.cadence,
       j(rv.note || {}), j(rv.submitted || {}), j(rvExtra)]);

    await insertMany(client, "history", colsFor(E.history), rowsOf(state.history, E.history));
    if (state.priorCycle)
      await client.query("INSERT INTO prior_cycle (id, data) VALUES (1,$1)", [j(state.priorCycle)]);

    /* Archived plans keep their order: the list reads newest first and that
       order is the tenant's, not the database's idea of one. */
    await insertMany(client, "plan_archives",
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

    /* ── A DELETED PERSON'S DOOR GOES WITH THEM (§69) ───────────────
       `people` is TRUNCATEd and rewritten on every save. The four tables that
       make up an identity are NOT: credentials, sessions, bu_declarations and
       login_attempts live outside the state graph deliberately (§19, §56) and
       carry NO foreign key to people — a FK would take the whole table with it
       on the truncate, and a column on `people` would be erased by it.

       Which was right while a person could only ever be RETIRED: retirement
       leaves the row standing, and both getSession() and the sign-in query
       JOIN `people`, so a retired person is turned away by the join. A DELETED
       person has no row, so those two are already closed — but the credential
       stays, and person keys are MINTED FROM THE NAME. Delete "Ahmed Ali",
       add "Ahmed Ali" again, and mintPersonKey() hands back `ahmedali`: the
       new person inherits the deleted person's password, and nobody is told.
       That is the hole this closes, and it is why the purge is here rather
       than on a delete endpoint — a save is the only thing that can tell that
       a person is gone.

       TWO TABLES ARE DELIBERATELY NOT IN THE LIST, and for one reason:
       `change_log` is the record of who changed what (§42) and
       `login_attempts` is the record of who is failing to get in (§43.4,
       whose own migration says outright that "a save must not be able to erase
       the record of an attack on it"). Both live outside the graph precisely
       so a save cannot reach them, and a log that forgets is not a log. The
       second would not have worked anyway — its column is `key_tried`, not
       `person_key`, because it records keys that were never people.

       Deriving the survivors from `state.people` rather than from a list the
       caller passes: the authoritative answer to "who exists now" is the rows
       that were just written, and asking anything else is a second copy of it.
       An EMPTY register purges everything, which is correct — that is what
       migration 004's clean slate leaves behind, and a tenant with no people
       must not keep a password that opens it. */
    const alive = (state.people || []).map(function (p) { return p.key; });
    for (const t of ["credentials", "sessions", "bu_declarations"]) {
      /* GUARDED, because the first write of all happens BEFORE the tables
         exist. ensureReady seeds and THEN migrates (§33.5 — a data migration
         has to run after the seed it clears), and `credentials` and `sessions`
         are created by migration 002, which is a post-phase one. So the very
         first writeState of a deployment runs against a database that has
         people and no door yet — and there is nothing to purge there, which is
         what this says rather than throwing. Found by running the round trip:
         reading the phase rule would not have caught it, because the rule is
         about columns and this is about a table that is not there at all. */
      const there = (await client.query("SELECT to_regclass($1) AS t", ["public." + t])).rows[0].t;
      if (!there) continue;
      await client.query(
        "DELETE FROM " + t + " WHERE person_key <> ALL($1::text[])", [alive]);
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}

/* ── Read ──────────────────────────────────────────────────────────── */
async function readState(client) {
  const q = async function (sql) { return (await client.query(sql)).rows; };

  const org = (await q("SELECT * FROM org WHERE id=1"))[0];
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

  const cyRow = (await q("SELECT * FROM cycle WHERE id=1"))[0] || {};
  const cycle = Object.assign({}, cyRow.extra || {},
    { name: cyRow.name, rewardAt: cyRow.reward_at, locked: cyRow.locked, focus: cyRow.focus || {} });

  const rvRow = (await q("SELECT * FROM review WHERE id=1"))[0] || {};
  const review = Object.assign({}, rvRow.extra || {}, {
    name: rvRow.name, from: rvRow.from_label, to: rvRow.to_label, due: rvRow.due_label,
    endsQuarter: rvRow.ends_quarter, state: rvRow.state,
    note: rvRow.notes || {}, submitted: rvRow.submitted || {},
  });
  if (rvRow.cadence !== null && rvRow.cadence !== undefined) review.cadence = rvRow.cadence;

  const history = (await q("SELECT * FROM history ORDER BY idx"))
    .map(function (r) { return mergeRow(r, E.history); });

  const pcRow = (await q("SELECT * FROM prior_cycle WHERE id=1"))[0];

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
const LOCK_KEY = 420042;

/* The registry promised for when the schema first changed — it has (002,
   identity). schema.sql stays the idempotent base; everything after it is a
   numbered file in db/migrations/, applied once in order and recorded. */
/* TWO PHASES, because there are two kinds of migration and they want opposite
   orders around the seed.

   A DATA migration changes what is stored and must run AFTER the seed: 004
   clears the worked example the seed just wrote, and running it first would
   do nothing at all (§21). That is why the seed goes first.

   A SCHEMA migration changes the SHAPE and must run BEFORE it, because the
   seed writes into that shape. schema.sql cannot do this job on an existing
   tenant: every statement in it is CREATE TABLE IF NOT EXISTS, which never
   adds a column to a table that already exists. 008 hit this exactly — the
   seed tried to write people.role on a tenant whose people table still had
   `level`, and failed before the migration that would have renamed it ever
   ran. It would have broken the deployed database and no fresh-deploy test
   could have caught it.

   A migration declares its phase in its first line — `-- @phase: pre` — so the
   answer travels with the file rather than in a list here that drifts. No
   marker means post, which is what every migration before 008 wants. */
function migrationPhase(sql) {
  return /^\s*--\s*@phase:\s*pre\b/i.test(sql.split("\n")[0] || "") ? "pre" : "post";
}

async function applyMigrations(client, dir, phase) {
  await client.query(
    "CREATE TABLE IF NOT EXISTS _sql_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const mdir = path.join(dir, "migrations");
  if (!fs.existsSync(mdir)) return;
  const done = {};
  (await client.query("SELECT name FROM _sql_migrations")).rows
    .forEach(function (r) { done[r.name] = true; });
  const files = fs.readdirSync(mdir).filter(function (f) { return /\.sql$/.test(f); }).sort();
  for (const f of files) {
    if (done[f]) continue;
    const sql = fs.readFileSync(path.join(mdir, f), "utf8");
    if (migrationPhase(sql) !== phase) continue;
    await client.query(sql);
    await client.query("INSERT INTO _sql_migrations (name) VALUES ($1)", [f]);
  }
}

/* ── ONCE PER PROCESS, NOT ONCE PER REQUEST (§98.1) ──────────────────────
   This function takes an advisory lock, executes the whole of schema.sql,
   runs both migration phases and checks the bootstrap credential — TEN
   database round trips — and it was doing all of it on EVERY request. Fine
   when a request was a page load; not fine once the chat's corner asks every
   four seconds (§97). Measured before the guard: 14 round trips per poll, of
   which 10 were this.

   THE GUARD IS PER PROCESS, WHICH IS EXACTLY THE RIGHT LIFETIME. A serverless
   instance is torn down and replaced constantly, and a DEPLOY replaces every
   instance — so a newly added migration still runs on the first request each
   fresh instance serves, which is the only moment it needs to. What is skipped
   is the second and subsequent requests to a WARM instance, where the answer
   cannot have changed: nothing but this function writes migrations.

   IT REMEMBERS THE PROMISE, NOT A BOOLEAN. Two requests can arrive at a warm
   instance before the first has finished; awaiting the same promise makes the
   second wait for the real answer rather than racing past a flag that is not
   true yet. */
let READY = null;
function forgetReady() { READY = null; }   /* for tests that rebuild a database */

function ensureReady(client) {
  if (READY) {
    /* ONLY THE CALL THAT DID THE WORK REPORTS HAVING DONE IT. Handing back the
       remembered result would have every later caller told `seeded: true` on a
       database nothing seeded — which is the answer test-roundtrip asserts is
       false, and a lie whatever asserts it. */
    return READY.then(function () { return { seeded: false }; });
  }
  READY = ensureReadyOnce(client).catch(function (e) {
    /* A FAILED BOOTSTRAP MUST NOT BE REMEMBERED. Caching the rejection would
       leave the instance permanently broken over one lost connection. */
    READY = null;
    throw e;
  });
  return READY;
}

async function ensureReadyOnce(client) {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
  try {
    const dir = dbDir();
    await client.query(fs.readFileSync(path.join(dir, "schema.sql"), "utf8"));

    /* Baseline first, then migrations forward from it.
       The seed is the STARTING state; migrations evolve it. Run the other way
       round, a migration against an empty database does nothing and the seed
       then puts back exactly what it was meant to change — which is how the
       clean slate (004) silently failed on a fresh database while working on
       the deployed one. */
    /* Shape first, on an existing tenant, or the seed writes into columns that
       are not there yet. On a fresh one these find nothing to do and say so. */
    await applyMigrations(client, dir, "pre");

    let seeded = false;
    const r = await client.query("SELECT 1 FROM org LIMIT 1");
    if (!r.rowCount) {
      const seed = JSON.parse(fs.readFileSync(path.join(dir, "seed-state.json"), "utf8"));
      await writeState(client, seed);
      seeded = true;
    }
    await applyMigrations(client, dir, "post");
    /* Bootstrap: with no credentials at all there has to be a way in, so the
       SMO can sign in with the simple password — and, SINCE v3.12, is asked to
       choose their own before going anywhere. §19.4 said otherwise (Islam,
       2026-08-20: "just let me access with SMO and 1234"); that was right for
       a prototype nobody's data was in and is wrong for a product a client's
       strategy is in. The convenience it bought is one screen, once.
       Never touched again once any credential exists. */
    const auth = require("./auth.js");
    const c = await client.query("SELECT 1 FROM credentials LIMIT 1");
    if (!c.rowCount) {
      await client.query(
        "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ('smo', $1, true)",
        [auth.hashPassword("1234")]);
    }
    await retireTheSimplePassword(client, auth);
    await resetTheSMOPassword(client, auth);
    return { seeded: seeded };
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]);
  }
}

/* THE ONE STEP THAT COULD NOT BE A .sql FILE.
   A tenant already running has an SMO credential whose hash was written by
   migration 003, with its own salt — so "is this still the shipped 1234?"
   cannot be asked in SQL. It is asked here, once, and recorded in the same
   registry the SQL migrations use so it never runs twice.

   It sets must_change rather than clearing the password, deliberately: this
   must not be able to lock anybody out of their own deployment. If the SMO has
   already chosen a real password, verifyPassword fails and nothing happens —
   which is the difference between retiring a default and nagging somebody who
   already did the right thing. */
const RETIRE_1234 = "013-retire-the-simple-password.js";

async function retireTheSimplePassword(client, auth) {
  const done = await client.query("SELECT 1 FROM _sql_migrations WHERE name = $1", [RETIRE_1234]);
  if (done.rowCount) return;
  const r = await client.query("SELECT password_hash FROM credentials WHERE person_key = 'smo'");
  if (r.rowCount && auth.verifyPassword("1234", r.rows[0].password_hash)) {
    await client.query("UPDATE credentials SET must_change = true WHERE person_key = 'smo'");
  }
  await client.query("INSERT INTO _sql_migrations (name) VALUES ($1)", [RETIRE_1234]);
}

/* ── An explicit reset, once (Islam, 2026-08-21) ──────────────────────
   "Please reset my admin password to 1234 for now until later adjustment."

   It runs AFTER retireTheSimplePassword, deliberately: that step sets
   must_change on a shipped 1234, and if this ran first the retirement would
   undo it in the same request. Order is the whole of the correctness here.

   ONCE, and recorded. A reset that ran on every deployment would be a
   permanent backdoor — the exact thing §43.1 removed — because it would put
   the password back to 1234 every time a real one was chosen. This runs on the
   next deploy and never again; changing the password inside the product from
   then on is what it is for, and this step will not fight it.

   It is asked for and it is a weakening, so it is written where it can be seen
   rather than done quietly: 1234 is four digits on a public URL, and the whole
   of §43 exists because that is not a password. Delete this function and its
   registry row to end it, or simply change the password from People. */
const RESET_1234 = "014-reset-smo-password.js";

async function resetTheSMOPassword(client, auth) {
  const done = await client.query("SELECT 1 FROM _sql_migrations WHERE name = $1", [RESET_1234]);
  if (done.rowCount) return;
  await client.query(
    "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ('smo', $1, false) " +
    "ON CONFLICT (person_key) DO UPDATE SET password_hash = $1, must_change = false, updated_at = now()",
    [auth.hashPassword("1234")]);
  await client.query("INSERT INTO _sql_migrations (name) VALUES ($1)", [RESET_1234]);
}

/* ── ONE POOL, ONE LIST OF ENV NAMES (§71) ────────────────────────────
   `getPool()` was copied into api/auth.js and api/state.js, identically, and
   api/feedback.js would have been the third. What is copied is the LIST OF
   ENVIRONMENT VARIABLE NAMES — the six spellings Neon and Vercel use between
   them — and a third copy is a third place to forget one the day the
   integration renames something. The endpoints keep their own `pool` cache
   through this single function.

   It is lazy for the reason it always was: a module that connects on require
   cannot be loaded by a script that only wants to read the schema. */
let _pool = null;
function getPool(pg) {
  if (_pool) return _pool;
  tuneTypes(pg);
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;
  if (!url) {
    /* The FULLER of the two messages that were copied here, kept deliberately:
       it names the thing to go and do. A message that says only "not
       configured" sends somebody to read this file. */
    const e = new Error("No database connection configured. Connect the Neon integration " +
      "(it sets DATABASE_URL) in the Vercel project settings.");
    e.code = "NO_DB";
    throw e;
  }
  _pool = new pg.Pool({ connectionString: url, max: 3 });
  return _pool;
}

module.exports = { writeState, readState, ensureReady, forgetReady, tuneTypes, getPool };
