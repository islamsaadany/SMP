/* WHAT THE SET-UP FLOW WRITES, AND WHAT IT MUST NOT TOUCH (§340)

   Four faults in one line of frozen.cjs, and none of them was visible to any
   check that existed: the flow's own file asserts the way in, the client, the
   units, the functions, the summary and the modules band, and has no section
   for the words step, the companies step or what a SECOND pass does.

   WHAT IS ASSERTED HERE IS THE MINTER, not the screen — the screen's own
   guards are in checks/client-setup-outside.py, where a browser is. This
   half needs no database and no browser: frozen.shape is a pure function of
   a graph and the answers, which is also what makes it worth asserting here
   rather than behind a server (§42: the rule, not the page).

   AND §1 IS AN AGREEMENT, NEVER A LIST (§94.8). The words step asked for a
   word under a key the label registry does not hold, so the minter walked
   the list, found no match and dropped the answer — accepted, saved, and the
   platform went on saying its own word (§294.2). Asserting that one key
   exists would guard that one key; asserting that EVERY key the flow asks
   for is a key the registry holds guards the next one somebody adds.

   BOTH ENDS EVERY TIME (§94.2): a row that survives keeps what the flow
   never asked about AND a row the answers drop is gone; a rename that would
   lose somebody is named AND one that loses nobody is not.

     node checks/setup-shape.mjs
     node checks/setup-shape.mjs --break=no-carry      # must go red
     node checks/setup-shape.mjs --break=no-dropped    # must go red
     node checks/setup-shape.mjs --break=keep-weights  # must go red
     node checks/setup-shape.mjs --break=extra-word    # must go red          */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..");
const ROOT = join(APP, "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const BREAK = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

/* THE BREAKS ARE MADE FROM THE SOURCE (§276), never by editing the graph a
   probe hands in: a fixture bent into the shape of the bug proves the probe
   works and nothing about the product. frozen.cjs is doctored into a copy
   and required from there — it resolves the frozen sources off process.cwd(),
   which does not move, so the copy reads exactly what the real one reads. */
const require_ = createRequire(import.meta.url);
let frozen;
if (!BREAK || BREAK === "extra-word") {
  frozen = require_(join(APP, "lib", "frozen.cjs"));
} else {
  let src = readFileSync(join(APP, "lib", "frozen.cjs"), "utf8");
  if (BREAK === "no-carry") {
    src = src.replace(/UNITS\[k\] = __smpCarry\(wasUnits\[k\], UNITS\[k\], \["name", "company", "ukey"\]\);\n\s*if \(wasRoles\[k\]\) UNIT_ROLES\[k\] = wasRoles\[k\];/,
      "void 0;")
             .replace(/FUNCTIONS\[k\] = __smpCarry\(wasFns\[k\], FUNCTIONS\[k\], \["name", "format"\]\);/, "void 0;");
  } else if (BREAK === "no-dropped") {
    src = src.replace(/return \{ state: state, dropped: dropped \};/, "return { state: state, dropped: [] };");
  } else if (BREAK === "keep-weights") {
    src = src.replace(/if \(state\.group && state\.group\.weighting\) state\.group\.weighting\.units = \[\];/, "void 0;");
  } else { console.log("unknown break: " + BREAK); process.exit(2); }
  const dir = mkdtempSync(join(tmpdir(), "smp-frozen-"));
  const p = join(dir, "frozen.cjs");
  writeFileSync(p, src);
  frozen = require_(p);
}

const seed = JSON.parse(read("db/seed-state.json"));
const clone = (v) => JSON.parse(JSON.stringify(v));
const bare = frozen.bare(clone(seed));

/* ── 1 · the flow asks for words the registry holds ────────────────────── */
console.log("\n1 · the words step and the label registry");
let asked = [];
{
  const page = read("platform.html");
  const blk = page.slice(page.indexOf("var WORDS = ["));
  const arr = blk.slice(0, blk.indexOf("];"));
  asked = [...arr.matchAll(/\[\s*"([A-Za-z0-9_]+)"/g)].map((m) => m[1]);
  if (BREAK === "extra-word") asked.push("howevertheyspellit");
}
const held = (seed.labels || []).map((e) => e.key);
check("the words step asks for something", asked.length > 0, JSON.stringify(asked));
const orphans = asked.filter((k) => held.indexOf(k) < 0);
check("every word the flow asks for is a key the registry holds (§53.5)",
  orphans.length === 0, orphans.length ? "asked and unheld: " + orphans.join(", ") : "");
/* THE OTHER END, or a registry emptied of everything would satisfy the line
   above perfectly (§94.2, §113.8). */
check("…and the registry holds words the flow does not ask for, so this is an " +
      "agreement and not two copies of one list",
  held.some((k) => asked.indexOf(k) < 0), "held: " + held.length + ", asked: " + asked.length);

/* ── 2 · a word sent through the flow reaches the stored label ──────────── */
console.log("\n2 · the word is stored");
{
  const r = frozen.shape(clone(bare), { units: [{ name: "Mobile" }], companies: [], functions: [],
                                        words: { unitword: "Divisions", pillar: "Themes of work" } });
  const e = (k) => (r.state.labels.find((x) => x.key === k) || {}).bu;
  check("the client's word for a business unit is stored", e("unitword") === "Divisions", String(e("unitword")));
  check("…and so is a word that already worked, so this is not the only key that does",
    e("pillar") === "Themes of work", String(e("pillar")));
  const r2 = frozen.shape(clone(bare), { units: [{ name: "Mobile" }], companies: [], functions: [], words: {} });
  const e2 = (r2.state.labels.find((x) => x.key === "unitword") || {}).bu;
  check("a word left alone keeps the platform's own (§50.6)", e2 === "Business units", String(e2));
}

/* ── 3 · a row that survives keeps what the flow never asked about ──────── */
console.log("\n3 · a second pass through the flow");
const ANSWERS = { companies: [{ name: "Distribution" }],
                  units: [{ name: "Mobile", company: "Distribution" }, { name: "Retail" }],
                  functions: [{ name: "Finance", format: "projects" }], words: {} };
/* The state is MADE, because nothing the flow itself writes can produce it:
   a head, a mark, a weight and an aspiration all arrive INSIDE the platform,
   after set-up, which is exactly the state this fault lived in (§255). */
const planted = (() => {
  const g = frozen.shape(clone(bare), ANSWERS).state;
  g.unitRoles.mobile = { head: "ahmed", custodian: "hala" };
  g.units.mobile.logo = "data:image/png;base64,AAA";
  g.units.mobile.aspiration = "Be the best";
  g.units.mobile.codePrefix = "MBL";
  (g.group.weighting.units.find((x) => x.key === "mobile") || {}).rev = 40;
  g.functions.finance.head = "omar";
  g.functions.finance.def = "Runs the money";
  g.companies.newco1.seeOthers = true;
  return g;
})();
{
  const r = frozen.shape(clone(planted), Object.assign({}, ANSWERS, { words: { unitword: "Divisions" } }));
  const g = r.state, u = g.units.mobile || {}, ro = g.unitRoles.mobile || {}, f = g.functions.finance || {};
  check("whoever is in charge of a unit is still in charge",
    ro.head === "ahmed" && ro.custodian === "hala", JSON.stringify(ro));
  check("its mark, its aspiration and its code are still its own",
    u.logo === "data:image/png;base64,AAA" && u.aspiration === "Be the best" && u.codePrefix === "MBL",
    JSON.stringify({ logo: !!u.logo, asp: u.aspiration, code: u.codePrefix }));
  check("a function keeps its head and its definition",
    f.head === "omar" && f.def === "Runs the money", JSON.stringify({ head: f.head, def: f.def }));
  check("a company keeps the flags the flow never asked about",
    Object.keys(g.companies).some((k) => g.companies[k].seeOthers === true),
    JSON.stringify(g.companies));
  /* AND THE OTHER END: the flow still owns what the flow collects, or
     "nothing is touched" would be satisfied by a pass that wrote nothing. */
  const r2 = frozen.shape(clone(planted), Object.assign({}, ANSWERS, {
    units: [{ name: "Mobile", company: "" }, { name: "Retail" }] }));
  check("…while the name, the company and the plan type are still the flow's",
    r2.state.units.mobile.company == null, JSON.stringify(r2.state.units.mobile.company));
  const r3 = frozen.shape(clone(planted), Object.assign({}, ANSWERS, {
    units: [{ name: "Mobile", company: "Distribution" }] }));
  check("a unit taken off the list is gone (§322: the answers ARE the list)",
    !r3.state.units.retail && r3.state.unitKeys.indexOf("retail") < 0, JSON.stringify(r3.state.unitKeys));
}

/* ── 4 · the weighting rows do not multiply ────────────────────────────── */
console.log("\n4 · the weighting rows");
{
  let g = clone(planted);
  for (let i = 0; i < 3; i++) g = frozen.shape(g, ANSWERS).state;
  const rows = g.group.weighting.units.filter((r) => g.units[r.key]);
  const keys = rows.map((r) => r.key);
  check("three more passes leave one weighting row per unit",
    rows.length === g.unitKeys.length && new Set(keys).size === keys.length,
    rows.length + " rows for " + g.unitKeys.length + " units: " + keys.join(","));
  check("…and the factor somebody typed is still on it",
    (rows.find((r) => r.key === "mobile") || {}).rev === 40,
    JSON.stringify(rows.find((r) => r.key === "mobile")));
}

/* ── 5 · what cannot be carried is named, and nothing else is ──────────── */
console.log("\n5 · a rename the flow cannot carry");
{
  const rename = (from, to) => frozen.shape(clone(planted), Object.assign({}, ANSWERS, {
    units: ANSWERS.units.map((u) => (u.name === from ? Object.assign({}, u, { name: to }) : u)) }));
  check("renaming a unit somebody runs is refused BY NAME",
    rename("Mobile", "Mobiles").dropped.join() === "Mobile",
    JSON.stringify(rename("Mobile", "Mobiles").dropped));
  check("…and renaming one nobody runs is not (§94.2)",
    rename("Retail", "Retail Stores").dropped.length === 0,
    JSON.stringify(rename("Retail", "Retail Stores").dropped));
  const gone = frozen.shape(clone(planted), Object.assign({}, ANSWERS, {
    functions: [] }));
  check("a function with a head taken off the list is named too",
    gone.dropped.join() === "Finance", JSON.stringify(gone.dropped));
  check("a plain second pass names nobody",
    frozen.shape(clone(planted), ANSWERS).dropped.length === 0, "");
}

/* ── 6 · a row with no name ─────────────────────────────────────────────── */
console.log("\n6 · a row with no name");
{
  const r = frozen.shape(clone(bare), { companies: [{ name: "" }],
    units: [{ name: "Mobile" }, { name: "   " }], functions: [], words: {} });
  check("the minter still drops it, which is why the screen refuses to move on",
    r.state.unitKeys.length === 1 && r.state.companyKeys.length === 0,
    JSON.stringify({ units: r.state.unitKeys, cos: r.state.companyKeys }));
}

console.log("\n" + ok + " ok, " + bad.length + " failed");
if (bad.length) process.exit(1);
