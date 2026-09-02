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
