/* CLEAR PROJECT MUST BE WHAT A CLIENT ACTUALLY GETS (§67).
 *
 * `clearedGraph()` in the platform mirrors db/migrations/004-clean-slate.sql so
 * that the screen Islam shows a client and the screen they get on day one are
 * the same screen. It is a second copy of a rule, which the codebase forbids —
 * and it cannot be avoided, because 004 is SQL against thirty tables and
 * clearedGraph() is a graph in a browser.
 *
 * So it is asserted rather than trusted. 004 has already been amended three
 * times (§44's figure sets, §54's BU list, spec 010's function pillars), each
 * time because a feature stored something the clean slate was not looking at.
 * The fourth time, this fails.
 *
 *   DATABASE_URL=postgres://... node scripts/test-clean-parity.js
 */
const fs = require("fs");
const path = require("path");
const pg = require("pg");
const io = require("../lib/state-io.js");

const ROOT = path.join(__dirname, "..");

/* clearedGraph() lives in the platform's sources, which are browser scripts
 * with no exports. Read the one function out and evaluate it beside `clone`,
 * rather than duplicating it here — a test holding its own copy of the thing
 * it is testing proves only that the copy agrees with itself. */
function loadClearedGraph() {
  const src = fs.readFileSync(
    path.join(ROOT, "SMP-Project-Folder/src/config-data.js"), "utf8");
  const at = src.indexOf("function clearedGraph(");
  if (at < 0) throw new Error("clearedGraph() is not in config-data.js");
  /* Balance braces from the opening one so the extraction cannot silently
     take half a function when something is added after it. */
  let i = src.indexOf("{", at), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (!depth) { end = j + 1; break; } }
  }
  if (end < 0) throw new Error("clearedGraph() is not balanced");
  const body = src.slice(at, end);
  const clone = x => JSON.parse(JSON.stringify(x));
  return new Function("clone", body + "; return clearedGraph;")(clone);
}

/* Absent and null are the same word everywhere in this codebase, and an empty
 * object and an empty array are how "nothing" arrives from two different
 * writers. Compared the way the platform reads them. */
function norm(v) {
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v).sort().forEach(k => {
      if (v[k] === null || v[k] === undefined || v[k] === "") return;
      const n = norm(v[k]);
      if (Array.isArray(n) && !n.length) return;
      if (n && typeof n === "object" && !Array.isArray(n) && !Object.keys(n).length) return;
      out[k] = n;
    });
    return out;
  }
  return v;
}

/* What each side says about one subject, in words rather than in rows — the
 * two hold the same facts in different shapes, and comparing the shapes would
 * fail on every difference that does not matter. */
function shapeOf(g) {
  const G = g.group || {};
  const units = {};
  (g.unitKeys || []).forEach(k => {
    const u = g.units[k] || {};
    units[k] = {
      pillars: (u.items || []).length,
      objectives: (u.keyObjectives || []).length,
      clauses: (u.clauses || []).length,
      swot: ["s","w","o","t"].reduce((n, x) => n + ((u.swot || {})[x] || []).length, 0),
      aspiration: u.aspiration || "",
      endInMind: u.endInMind || "",
      perf: (u.extra && u.extra.perf) || u.perf || null
    };
  });
  const fns = {};
  (g.functionKeys || []).forEach(k => {
    const f = g.functions[k] || {};
    fns[k] = { items: (f.items || (f.extra && f.extra.items) || []).length,
               head: f.head || null, custodian: f.custodian || null };
  });
  return {
    units, fns,
    caps: (G.capabilities || []).map(c => ({
      name: c.name, fn: c.fn || null, def: c.def || "",
      objectives: (c.keyObjectives || []).length,
      projects: (c.projects || []).length })),
    group: {
      clauses: (G.clauses || []).length,
      objectives: (G.keyObjectives || []).length,
      values: (G.values || []).length,
      aspiration: G.aspiration || "", endInMind: G.endInMind || "",
      mission: G.mission || "", horizon: G.horizon || "",
      sets: G.sets || null, claims: G.claims || null,
      naming: G.naming || null, mainbus: G.mainbus || null,
      portfolio: G.portfolio || null, themeView: G.themeView || null,
      themePillars: G.themePillars || null,
      themes: (G.themes || []).length
    },
    cycle: g.cycle || {},
    review: g.review || {},
    history: (g.history || []).length,
    koWeights: Object.keys(g.koWeights || {}).length,
    people: (g.people || []).map(p => p.key).sort(),
    unitRoles: Object.keys(g.unitRoles || {}).length,
    companies: (g.companyKeys || []).length,
    unitCount: (g.unitKeys || []).length,
    fnCount: (g.functionKeys || []).length
  };
}

(async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  pg.types && io.tuneTypes(pg);
  await client.connect();

  /* The real thing: seed, then 004, exactly as a first deployment runs it. */
  const r = await io.ensureReady(client);
  console.log("seeded:", r.seeded);
  const real = await io.readState(client);

  /* And the platform's own answer, from the SAME seed the deployment used. */
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "db/seed-state.json"), "utf8"));
  const ours = loadClearedGraph()(seed);

  const a = norm(shapeOf(real)), b = norm(shapeOf(ours));
  const errs = [];
  const walk = (x, y, at) => {
    const keys = [...new Set([...Object.keys(x || {}), ...Object.keys(y || {})])];
    keys.forEach(k => {
      const p = at ? at + "." + k : k;
      const xv = (x || {})[k], yv = (y || {})[k];
      if (xv && yv && typeof xv === "object" && typeof yv === "object"
          && !Array.isArray(xv) && !Array.isArray(yv)) return walk(xv, yv, p);
      if (JSON.stringify(xv) !== JSON.stringify(yv))
        errs.push(`${p}: migration 004 leaves ${JSON.stringify(xv)}, clearedGraph() ${JSON.stringify(yv)}`);
    });
  };
  walk(a, b, "");

  if (errs.length) {
    console.log("CLEAN PARITY: FAIL");
    errs.forEach(e => console.log("  " + e));
  } else {
    console.log("CLEAN PARITY: PASS — Clear Project is what migration 004 leaves");
    console.log("  " + a.unitCount + " units, " + a.fnCount + " functions, " +
                a.companies + " companies, " + a.caps.length + " capabilities, " +
                a.people.length + " person" + (a.people.length === 1 ? "" : "s") +
                " (" + a.people.join(", ") + ")");
  }
  await client.end();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error("ERROR", e.message); process.exit(1); });
