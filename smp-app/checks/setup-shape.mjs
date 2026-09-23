/* WHAT THE SET-UP FLOW WRITES, AND WHAT IT MUST NOT TOUCH (§346)

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
     node checks/setup-shape.mjs --break=extra-word    # must go red
     node checks/setup-shape.mjs --break=no-caps       # must go red
     node checks/setup-shape.mjs --break=count-any-cap # must go red          */
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
   works and nothing about the product.

   AND THE SOURCE THEY MUST REACH MOVED (§365). __smpShape used to live in
   frozen.cjs's own glue, so doctoring frozen.cjs's text reached it; §363
   carried the flow out into the frozen source client-setup.js, which
   frozen.cjs now RUNS rather than holds — so every one of these patterns
   quietly stopped matching and five of the six breaks became no-ops. The
   check went on reading 33 ok, 0 failed with five of its guards proving
   nothing: §54.5's own shape, and indistinguishable from a working guard.

   So the doctoring reaches the text frozen.cjs LOADS, and — §344.1 — a
   pattern that does not match is a hard failure rather than a silent
   no-op, which is the only thing that stops this happening a third time. */
const require_ = createRequire(import.meta.url);
let frozen;
if (!BREAK || BREAK === "extra-word") {
  frozen = require_(join(APP, "lib", "frozen.cjs"));
} else {
  /* Each break is [pattern, replacement] against client-setup.js — the frozen
     source that now holds __smpShape and the carry it is all about. */
  const BREAKS = {
    "no-carry": [
      [/UNITS\[k\] = __smpCarry\(wasUnits\[k\], UNITS\[k\], \["name", "company", "ukey"\]\);\n\s*if \(wasRoles\[k\]\) UNIT_ROLES\[k\] = wasRoles\[k\];/, "void 0;"],
      [/FUNCTIONS\[k\] = __smpCarry\(wasFns\[k\], FUNCTIONS\[k\], \["name", "format"\]\);/, "void 0;"]],
    "no-dropped":    [[/return \{ state: state, dropped: dropped \};/, "return { state: state, dropped: [] };"]],
    "keep-weights":  [[/if \(state\.group && state\.group\.weighting\) state\.group\.weighting\.units = \[\];/, "void 0;"]],
    "no-caps":       [[/var made = addCapability\(holder\);/, "var made = { }; return;"]],
    "count-any-cap": [[/if \(n\) caps\+\+;/, "caps++;"]]
  };
  if (!BREAKS[BREAK]) { console.log("unknown break: " + BREAK); process.exit(2); }

  /* THE PATTERN MUST MATCH, OR THE RUN STOPS (§344.1). A replace over text it
     no longer fits changes nothing and prints "0 red", which reads exactly
     like a guard doing its job. */
  const flow = join(ROOT, "SMP-Project-Folder", "src", "client-setup.js");
  let text = readFileSync(flow, "utf8");
  for (const [re, to] of BREAKS[BREAK]) {
    if (!re.test(text)) {
      console.log("  BREAK PATTERN DID NOT MATCH — " + BREAK + ": " + String(re).slice(0, 70));
      console.log("  The source moved and this falsification stopped falsifying (§344.1).");
      process.exit(2);
    }
    text = text.replace(re, to);
  }
  const dir = mkdtempSync(join(tmpdir(), "smp-frozen-"));
  writeFileSync(join(dir, "client-setup.js"), text);

  /* frozen.cjs is copied too, with the one line that loads the frozen sources
     taught to prefer the doctored copy — so everything else it reads is still
     the real thing. */
  let src = readFileSync(join(APP, "lib", "frozen.cjs"), "utf8");
  const loader = 'for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), c, { filename: f });';
  if (!src.includes(loader)) { console.log("  frozen.cjs's loader line moved; this harness cannot doctor it"); process.exit(2); }
  src = src.replace(loader,
    'for (const f of FILES) { const d = path.join(' + JSON.stringify(dir) + ', f);\n' +
    '    vm.runInContext(fs.readFileSync(fs.existsSync(d) ? d : path.join(SRC, f), "utf8"), c, { filename: f }); }');
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
  /* THE FLOW MOVED AND THIS ASSERTION DID NOT (§51.11, §218). §363 carried
     the set-up flow out of platform.html into client-setup.js, so reading the
     console page here found no WORDS at all — and the claim underneath is
     unchanged, because it is about the FLOW and never about which file holds
     it. Re-pointed, never loosened; `asked.length > 0` is what caught the
     move and is why it stays. */
  const page = read("SMP-Project-Folder/src/client-setup.js");
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
  /* §395: the flow asks both forms now, as Setup › Terminology does. The
     old string shape above still lands on MANY (a tab on an older build);
     the pair lands on both, and an empty box keeps the word that was there. */
  const r3 = frozen.shape(clone(bare), { units: [{ name: "Mobile" }], companies: [], functions: [],
    words: { pillar: { one: "Theme of work", many: "Themes of work" }, measure: { one: "", many: "KPIs" } } });
  const l3 = (k) => r3.state.labels.find((x) => x.key === k) || {};
  check("the word for ONE is stored beside the word for many (§395)",
    l3("pillar").group === "Theme of work" && l3("pillar").bu === "Themes of work", JSON.stringify(l3("pillar")));
  check("…and an empty box keeps the word that was there",
    l3("measure").group === "Key measure" && l3("measure").bu === "KPIs", JSON.stringify(l3("measure")));
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

/* ── 7 · the capabilities the flow makes ────────────────────────────────── */
console.log("\n7 · capabilities");
{
  const A = { companies: [], units: [{ name: "Bakery" }],
              functions: [{ name: "Finance", format: "projects" },
                          { name: "Supply Chain", format: "pillars" }],
              capabilities: [{ name: "Cold chain", fn: "Supply Chain", format: "pillars" },
                             { name: "Food safety", fn: "Nobody here", format: "projects" }],
              words: {} };
  const g = frozen.shape(clone(bare), A).state;
  const caps = (g.group || {}).capabilities || [];
  const by = (n) => caps.find((c) => c.name === n) || {};
  check("the flow's capabilities are minted", caps.length === 2, caps.map((c) => c.name));
  /* THE HOLDER IS RESOLVED FROM A NAME to the function's KEY, because the
     flow's rows carry no keys and addCapability takes one. */
  check("…each carried by the function it names",
    by("Cold chain").fn && g.functions[by("Cold chain").fn]
      && g.functions[by("Cold chain").fn].name === "Supply Chain", by("Cold chain").fn);
  /* THE OTHER END (§94.2): a name that matches nothing is UNASSIGNED, which
     is a state the Setup page already draws, not an error to invent (§35). */
  check("…and one whose holder names nobody is unassigned rather than refused",
    by("Food safety").fn === null, by("Food safety").fn);
  check("each carries its own form", by("Cold chain").format === "pillars"
    && by("Food safety").format === "projects",
    caps.map((c) => c.name + ":" + c.format));
  check("…and every one has an id the platform minted",
    caps.every((c) => !!c.id), caps.map((c) => c.id));
  /* A CAPABILITY HAS TWO FORMS, NOT THE FUNCTION'S THREE (§342): capFormat()
     reads anything that is not "pillars" as projects, so an unknown word
     accepted here would be stored meaning something nobody chose (§96.2). */
  const odd = frozen.shape(clone(bare), Object.assign({}, A, {
    capabilities: [{ name: "Cold chain", fn: "", format: "objectives" }] })).state;
  check("a form the platform does not have for a capability reads as projects",
    (odd.group.capabilities[0] || {}).format === "projects",
    (odd.group.capabilities[0] || {}).format);
  /* A SECOND PASS keeps what the flow never asked about — matched by NAME,
     because the id is minted fresh and the flow's rows carry none. */
  const planted = clone(g);
  planted.group.capabilities[0].def = "Keep it cold, end to end.";
  const again = frozen.shape(clone(planted), A).state;
  check("a definition typed inside the platform survives a second pass",
    (again.group.capabilities.find((c) => c.name === "Cold chain") || {}).def
      === "Keep it cold, end to end.",
    (again.group.capabilities[0] || {}).def);
  check("…and the list does not grow", (again.group.capabilities || []).length === 2,
    (again.group.capabilities || []).length);
  const cut = frozen.shape(clone(planted), Object.assign({}, A, {
    capabilities: [{ name: "Cold chain", fn: "Supply Chain", format: "pillars" }] })).state;
  check("one taken off the answers is gone (§322: the answers ARE the list)",
    (cut.group.capabilities || []).length === 1, (cut.group.capabilities || []).map((c) => c.name));
}

/* ── 8 · what counts as work a re-shape must not overwrite ──────────────── */
console.log("\n8 · an empty capability is not authored work");
{
  const withCap = (extra) => {
    const g = clone(bare);
    g.group.capabilities = [Object.assign(
      { id: "cap1", name: "Cold chain", def: "", fn: null, keyObjectives: [], projects: [] }, extra)];
    return frozen.holds(g).capabilities;
  };
  /* THE REASON THIS MOVED: the flow can make a capability now, so counting the
     BOX rather than what is in it means adding one refuses the very next pass
     and locks the consultant out of their own set-up (§61). */
  check("a capability the flow just made does not block a re-shape", withCap({}) === 0, withCap({}));
  /* BOTH ENDS (§94.2), and all three of the things a capability can hold —
     counting only one of them is the same fault one field along. */
  check("…one holding a project does", withCap({ projects: [{ name: "x" }] }) === 1);
  check("…one holding an objective does", withCap({ keyObjectives: [{ name: "x" }] }) === 1);
  check("…and one planned in pillars does", withCap({ items: [{ name: "x" }] }) === 1);
  check("and the worked example's own capability still counts",
    frozen.holds(clone(seed)).capabilities === 1, frozen.holds(clone(seed)).capabilities);
}

console.log("\n" + ok + " ok, " + bad.length + " failed");
if (bad.length) process.exit(1);
