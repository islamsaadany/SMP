/* A PROJECT CHANGING HANDS SURVIVES A SAVE (§321).

   Removing a capability can now keep its projects: they move to another
   capability of the same function and the wrapper goes. The browser half is
   driven by `checks/capability-remove.py`; THIS proves the half that check
   cannot see — that the stored plan survives it.

   It matters because a project is not a free-standing row:

       projects.cap_id text NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE

   so a project cannot outlive its capability, and the database will delete
   one on its own the moment the parent goes. If the move did not land, the
   cascade would take three projects with their deliverables, outcomes and
   milestones and nothing would say so — the save would report success.

   THE MOVE IS READ OUT OF THE PRODUCT, never copied (§283): a second copy of
   the one function this is about is how the two come to disagree.

     DATABASE_URL=postgres://... node scripts/test-capability-move.js
*/
const fs = require("fs");
const path = require("path");
const pg = require("pg");
const io = require("../lib/state-io.js");

let bad = 0;
function ck(what, ok, detail) {
  if (!ok) bad++;
  console.log((ok ? "  ok    " : "  FAIL  ") + what +
    (!ok && detail !== undefined ? "  — " + JSON.stringify(detail) : ""));
}

/* `moveCapProjects` lifted from the source it lives in. It reads GROUP only
   for `GROUP.capabilities.indexOf`, so a one-key stand-in is the whole world
   it needs — and any later edit to that function is picked up here on the
   next run rather than drifting. */
function loadMove(graph) {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "SMP-Project-Folder", "src", "config-data.js"), "utf8");
  const m = /function moveCapProjects\(from, to\)\{[\s\S]*?\n\}/.exec(src);
  if (!m) throw new Error("moveCapProjects not found in config-data.js");
  const GROUP = { capabilities: graph.group.capabilities };
  // eslint-disable-next-line no-new-func
  return new Function("GROUP", m[0] + "; return moveCapProjects;")(GROUP);
}

function rowsOf(p) {
  return { d: (p.deliverables || []).length,
           o: (p.outcomes || []).length,
           m: (p.milestones || []).length,
           figs: (p.outcomes || []).filter(function (x) {
             return x.actual != null && x.actual !== ""; }).length };
}

(async function () {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const client = await pool.connect();
  try {
    await io.ensureReady(client);
    /* The clean slate (§21) empties a fresh tenant, so the worked example is
       written explicitly — this is about the writer, not about the seed. */
    const seed = JSON.parse(fs.readFileSync(
      path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));
    /* THE FIXTURE MAKES ITS OWN PAIR (§255, §329). The seed carried eight
       capabilities until the worked example was finished, and this file needs
       a function holding TWO — a move between siblings is its whole subject,
       and stage 2 gives the product real ones again. So one function's own
       projects are split back into a pair, which is the inverse of the
       dissolve; anything with fewer than two projects is left alone, because
       a pair made of one project and none proves nothing about a move. */
    (function () {
      const caps = [];
      Object.keys(seed.functions || {}).forEach(function (fk) {
        const f = seed.functions[fk];
        if (!f || String(f.format) === "pillars" || (f.projects || []).length < 2) return;
        const cut = f.projects.length - 1;
        [f.projects.slice(0, cut), f.projects.slice(cut)].forEach(function (ps, i) {
          const id = "box-" + fk + "-" + (i + 1);
          ps.forEach(function (p) { p.capId = id; });
          caps.push({ id: id, fn: fk, name: (f.name || fk) + " work " + (i + 1),
                      def: "", keyObjectives: [], projects: ps });
        });
        f.projects = [];
      });
      seed.group.capabilities = caps;
    })();
    await io.writeState(client, seed);
    const graph = await io.readState(client);

    /* The one function in the worked example with two capabilities. Found
       rather than named, so the proof survives the seed being re-generated. */
    const caps = graph.group.capabilities;
    const byFn = {};
    caps.forEach(function (c) { (byFn[c.fn] = byFn[c.fn] || []).push(c); });
    const fn = Object.keys(byFn).filter(function (k) { return byFn[k].length > 1; })[0];
    ck("the worked example holds a function with two capabilities", !!fn, Object.keys(byFn));
    if (!fn) throw new Error("nothing to move");

    const from = byFn[fn][0], to = byFn[fn][1];
    const movedIds = (from.projects || []).map(function (p) { return p.id; });
    const was = {};
    (from.projects || []).forEach(function (p) { was[p.id] = rowsOf(p); });
    /* The function's whole project list, in the order its CODES are derived
       from (§310) — capsOfFunction order, then each capability's own. */
    const orderWas = byFn[fn].reduce(function (a, c) {
      return a.concat((c.projects || []).map(function (p) { return p.id; })); }, []);
    ck("...and it holds projects to move", movedIds.length > 0, movedIds);

    const moveCapProjects = loadMove(graph);
    const n = moveCapProjects(from, to);
    ck("the move reports what it moved", n === movedIds.length, { n: n, ids: movedIds });
    graph.group.capabilities = caps.filter(function (c) { return c.id !== from.id; });

    await io.writeState(client, graph);
    const back = await io.readState(client);

    const gone = !back.group.capabilities.some(function (c) { return c.id === from.id; });
    ck("the capability is gone from the stored graph", gone);

    const dest = back.group.capabilities.filter(function (c) { return c.id === to.id; })[0];
    ck("the destination is still there", !!dest);
    const held = dest ? (dest.projects || []).map(function (p) { return p.id; }) : [];
    ck("...and holds every moved project, by its OWN id",
       movedIds.every(function (i) { return held.indexOf(i) > -1; }), held);

    /* THE CASCADE IS THE THING THIS FILE EXISTS FOR: with the move lost, the
       parent's removal deletes these rows in Postgres and the save still
       reports success. */
    const orderNow = back.group.capabilities.filter(function (c) { return c.fn === fn; })
      .reduce(function (a, c) {
        return a.concat((c.projects || []).map(function (p) { return p.id; })); }, []);
    ck("no project of that function was eaten by the cascade",
       orderNow.length === orderWas.length, { was: orderWas, now: orderNow });
    ck("...and their ORDER is what it was, so every code still reads the same",
       JSON.stringify(orderNow) === JSON.stringify(orderWas), { was: orderWas, now: orderNow });

    let intact = true, detail = null;
    (dest ? dest.projects || [] : []).forEach(function (p) {
      if (!was[p.id]) return;
      const now = rowsOf(p);
      if (JSON.stringify(now) !== JSON.stringify(was[p.id])) {
        intact = false; detail = { id: p.id, was: was[p.id], now: now };
      }
    });
    ck("...with their deliverables, outcomes, milestones and figures intact",
       intact, detail);

    /* The database's own answer, not the reader's: the column that could not
       be null now names the new holder. */
    const q = await client.query(
      "SELECT id, cap_id FROM projects WHERE id = ANY($1) ORDER BY id", [movedIds]);
    ck("the stored rows name their new holder",
       q.rows.length === movedIds.length &&
       q.rows.every(function (r) { return r.cap_id === to.id; }),
       q.rows);
    const orph = await client.query(
      "SELECT count(*)::int n FROM projects WHERE cap_id = $1", [from.id]);
    ck("...and nothing is left pointing at the capability that went",
       orph.rows[0].n === 0, orph.rows[0]);

    /* BOTH ENDS (§94.2): removing WITHOUT the move must still take them, or
       "the projects survived" would be true of a build that never removes
       anything. */
    const g2 = await io.readState(client);
    const target = g2.group.capabilities.filter(function (c) { return c.id === to.id; })[0];
    const doomed = (target.projects || []).map(function (p) { return p.id; });
    g2.group.capabilities = g2.group.capabilities.filter(function (c) { return c.id !== to.id; });
    await io.writeState(client, g2);
    const after = await client.query(
      "SELECT count(*)::int n FROM projects WHERE id = ANY($1)", [doomed]);
    ck("removing a capability WITHOUT moving them takes its projects",
       after.rows[0].n === 0, after.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
  console.log("\n" + (bad ? bad + " failure(s)" : "all passed"));
  process.exit(bad ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
