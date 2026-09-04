/* ── THE INCREMENTAL WRITER IS BYTE-IDENTICAL TO THE FULL ONE (2026-09-01) ────
   The safety proof for writeStateIncremental (lib/state-io.js), which is dark /
   off by default. For many change shapes it writes the change BOTH ways — the
   full writeState, and the incremental writer — against a database reset to the
   same baseline each time, and asserts the resulting readState() is identical.
   If they ever differ, the incremental writer is wrong and this goes red.

   It also asserts that the shapes meant to be OPTIMISED were actually handled
   incrementally (not silently fallen back), and that the shapes meant to FALL
   BACK did — because a writer that always fell back would pass every
   equivalence check while doing nothing.

   Needs a database:  DATABASE_URL=… node scripts/test-incremental-write.js */
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { Pool } = require(path.join(ROOT, "node_modules/pg"));
const io = require(path.join(ROOT, "lib/state-io.js"));
const D = require(path.join(ROOT, "lib/graph-diff.js"));

const clone = o => JSON.parse(JSON.stringify(o));
/* Canonical (sorted-key) JSON, so a compare is insensitive to key order — the
   database hands columns back in its own order, not the graph's. */
function canon(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
}

let fail = 0;
const check = (w, ok, x) => {
  console.log((ok ? "  ok    " : "  FAIL  ") + w + (ok || !x ? "" : "  — " + x));
  if (!ok) fail++;
};

/* A scenario: a name, a mutation of the graph, and whether it should be handled
   incrementally (true) or fall back to a full rewrite (false). */
function scenarios(base) {
  const firstUnit = base.unitKeys[0], secondUnit = base.unitKeys[1];
  const capId = (base.group.capabilities[0] || {}).id;
  const fnKey = base.functionKeys[0];
  const S = [];
  const add = (name, incremental, mut) => S.push({ name, incremental, mut });

  add("unit: aspiration", true, s => { s.units[firstUnit].aspiration = "CHANGED " + Date.now(); });
  add("unit: a measure's actual", true, s => {
    const p = s.units[firstUnit].items[0]; if (p && p.measures[0]) p.measures[0].actual = "77%";
  });
  add("unit: a tactic's note", true, s => {
    const p = s.units[firstUnit].items[0]; if (p && p.tactics[0]) p.tactics[0].note = "note " + Date.now();
  });
  add("unit: add a pillar (intra-unit structural)", true, s => {
    s.units[firstUnit].items.push({ id: firstUnit + "-PNEW", code: "NEW", name: "New pillar",
                                    kind: "internal", measures: [], tactics: [] });
  });
  add("unit: a key objective target", true, s => {
    const k = s.units[firstUnit].keyObjectives[0]; if (k) k.target = "42%";
  });
  add("unit: a SWOT item", true, s => {
    s.units[firstUnit].swot = s.units[firstUnit].swot || { s: [], w: [], o: [], t: [] };
    s.units[firstUnit].swot.s = (s.units[firstUnit].swot.s || []).concat(["new strength"]);
  });
  add("two units at once", true, s => {
    s.units[firstUnit].aspiration = "A " + Date.now();
    s.units[secondUnit].aspiration = "B " + Date.now();
  });
  if (capId) {
    add("capability: definition", true, s => {
      s.group.capabilities[0].def = "redefined " + Date.now();
    });
    add("capability: a project's brief", true, s => {
      const p = (s.group.capabilities[0].projects || [])[0]; if (p) p.brief = "brief " + Date.now();
    });
    add("capability: a milestone's status", true, s => {
      const p = (s.group.capabilities[0].projects || [])[0];
      if (p && (p.milestones || [])[0]) p.milestones[0].status = "Done";
    });
  }
  if (fnKey) add("function: head", true, s => { s.functions[fnKey].head = "someone" + Date.now(); });

  /* ── FUNCTION PLAN REPORTS — the "Marketing" shape (§241 Fix A) ──────────
     A supporting function that plans in pillars. Its whole plan rides in the
     `functions` row's `extra`, so rewriteFunction must preserve every reported
     figure. This is the exact shape the live incident feared and never tested. */
  const pillFn = base.functionKeys.filter(function (k) {
    return (base.functions[k].items || []).some(function (p) { return (p.tactics || []).length; });
  })[0];
  if (pillFn) {
    const fp = base.functions[pillFn].items.findIndex(function (p) { return (p.tactics || []).length; });
    add("function: a tactic report (actual + status)", true, s => {
      const t = s.functions[pillFn].items[fp].tactics[0]; t.actual = "83"; t.status = "done"; t.note = "fn report";
    });
    add("function: a tactic outcome (outActual §248)", true, s => {
      s.functions[pillFn].items[fp].tactics[0].outActual = "6";
    });
    const fm = base.functions[pillFn].items.findIndex(function (p) { return (p.measures || []).length; });
    if (fm >= 0) add("function: a measure actual", true, s => { s.functions[pillFn].items[fm].measures[0].actual = "71%"; });
    if ((base.functions[pillFn].keyObjectives || []).length)
      add("function: a key-objective target", true, s => { s.functions[pillFn].keyObjectives[0].target = "40%"; });
  }

  /* ── FULLER CAPABILITY REPORTS — a project's outcome / deliverable / milestone ── */
  const caps = base.group.capabilities || [];
  let cI = -1, pI = -1;
  for (let i = 0; i < caps.length && cI < 0; i++) {
    const ps = caps[i].projects || [];
    for (let jx = 0; jx < ps.length; jx++) {
      if ((ps[jx].outcomes || []).length || (ps[jx].deliverables || []).length || (ps[jx].milestones || []).length) { cI = i; pI = jx; break; }
    }
  }
  if (cI >= 0) {
    const proj = () => caps[cI].projects[pI];
    if ((proj().outcomes || []).length) add("capability: an outcome actual", true, s => { s.group.capabilities[cI].projects[pI].outcomes[0].actual = "55%"; });
    if ((proj().deliverables || []).length) add("capability: a deliverable status", true, s => {
      const d = s.group.capabilities[cI].projects[pI].deliverables[0];
      d.status = d.status === "done" ? "wip" : "done";   /* toggle → always a real change */
    });
    if ((proj().milestones || []).length) add("capability: a milestone pct", true, s => { s.group.capabilities[cI].projects[pI].milestones[0].pct = "60"; });
  }

  /* ── A TACTIC OUTCOME ON A UNIT (§248) ── */
  add("unit: a tactic outcome (outActual §248)", true, s => {
    const p = s.units[firstUnit].items[0]; if (p && p.tactics[0]) p.tactics[0].outActual = "7";
  });

  /* ── REPORT STATE lives in `review` — these MUST fall back (planSubjects
     does not address `review`), and MUST still be byte-identical to full.
     A save that dropped the submit/note would be exactly the silent loss. */
  add("review: submit a unit (fallback)", false, s => {
    s.review = clone(s.review || {}); s.review.submitted = Object.assign({}, s.review.submitted); s.review.submitted[firstUnit] = true;
  });
  add("review: a cycle note (fallback)", false, s => {
    s.review = clone(s.review || {}); s.review.note = Object.assign({}, s.review.note); s.review.note[firstUnit] = "repro note " + Date.now();
  });
  add("review: park a unit (fallback)", false, s => {
    s.review = clone(s.review || {}); s.review.parked = Object.assign({}, s.review.parked); s.review.parked[firstUnit] = true;
  });

  /* ── MIXED SAVES — a figure AND report state in one post. Because `review`
     is present, the whole save must fall back to the full writer. */
  add("mixed: a unit figure + a review note (fallback)", false, s => {
    const p = s.units[firstUnit].items[0]; if (p && p.measures[0]) p.measures[0].actual = "66%";
    s.review = clone(s.review || {}); s.review.note = Object.assign({}, s.review.note); s.review.note[firstUnit] = "mixed " + Date.now();
  });
  add("mixed: a unit figure + a submit (fallback)", false, s => {
    const p = s.units[firstUnit].items[0]; if (p && p.tactics[0]) p.tactics[0].actual = "44";
    s.review = clone(s.review || {}); s.review.submitted = Object.assign({}, s.review.submitted); s.review.submitted[firstUnit] = true;
  });

  /* These MUST fall back — the writer does not handle them yet. */
  add("cycle change (fallback)", false, s => { s.cycle = clone(s.cycle); s.cycle.name = "New cycle"; });
  add("an access grant (fallback)", false, s => {
    const role = Object.keys(s.access)[0]; const page = Object.keys(s.access[role])[0];
    s.access[role][page] = s.access[role][page] === "edit" ? "view" : "edit";
  });
  add("reorder units (fallback)", false, s => {
    s.unitKeys = [s.unitKeys[1], s.unitKeys[0]].concat(s.unitKeys.slice(2));
  });
  add("a person's name (fallback)", false, s => { if (s.people[0]) s.people[0].name = "Renamed " + Date.now(); });
  add("group KO (fallback)", false, s => {
    if (s.group.keyObjectives && s.group.keyObjectives[0]) s.group.keyObjectives[0].name = "GKO " + Date.now();
  });
  return S;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  const c = await pool.connect();
  try {
    io.forgetReady();
    await io.ensureReady(c);
    /* ensureReady seeds the demo and then runs the clean-slate migration (§21),
       so a fresh database is EMPTY. Write the full worked example over it so the
       baseline has real plan content — measures, tactics, projects, milestones —
       for the deep-row scenarios to touch. */
    const seed = JSON.parse(require("fs").readFileSync(path.join(ROOT, "db/seed-state.json"), "utf8"));
    await io.writeState(c, seed);
    const base = await io.readState(c);

    for (const sc of scenarios(base)) {
      const next = clone(base); sc.mut(next);
      const changes = D.graphChanges(base, next);

      /* FULL path */
      await io.writeState(c, base);            /* reset */
      await io.writeState(c, next);
      const full = await io.readState(c);

      /* INCREMENTAL path (with fallback) */
      await io.writeState(c, base);            /* reset */
      const handled = await io.writeStateIncremental(c, next, changes);
      if (!handled) await io.writeState(c, next);
      const inc = await io.readState(c);

      check(sc.name + " — identical to full rewrite", canon(full) === canon(inc),
            "the two databases differ");
      const okHandled = handled === sc.incremental;
      check(sc.name + " — " + (sc.incremental ? "handled incrementally" : "fell back"),
            okHandled, "handled=" + handled);
      if (!okHandled) {
        console.log("        diff: set=" + JSON.stringify(Object.keys(changes.set || {})) +
          " del=" + JSON.stringify(changes.del || []) +
          " rows=" + JSON.stringify((changes.rows || []).map(r => r.at + "|" + (r.path || []).join("/"))));
      }
    }

    await io.writeState(c, base);              /* leave the demo as we found it */
  } finally {
    c.release();
    await pool.end();
  }
  console.log(fail ? "\nINCREMENTAL-WRITE FAILED (" + fail + ")" : "\nINCREMENTAL-WRITE OK — byte-identical to the full rewrite");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
