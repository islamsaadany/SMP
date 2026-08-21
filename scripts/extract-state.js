/* Emits db/seed-state.json — the canonical state graph — by evaluating the
   platform's own data sources. The seed IS the sources, mechanically: the
   demo content in the database can never drift from the file, because it is
   generated from it. Run after any change to group-data.js / config-data.js:

     node scripts/extract-state.js
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "..", "SMP-Project-Folder", "src");
const ctx = vm.createContext({});
/* lib/rules.js first, exactly as build.py inlines it — config-data.js aliases
   the roles, areas and access defaults off it, so the seed and the platform
   read one list rather than two (spec 006 §2). */
ctx.self = ctx;
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "lib", "rules.js"), "utf8"),
                ctx, { filename: "rules.js" });
["group-data.js", "config-data.js"].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, { filename: f });
});

const state = {
  group: ctx.GROUP,
  unitKeys: ctx.UNIT_KEYS,
  units: ctx.UNITS,
  functionKeys: ctx.FUNCTION_KEYS,
  functions: ctx.FUNCTIONS,
  people: ctx.PEOPLE,
  unitRoles: ctx.UNIT_ROLES,
  access: ctx.ACCESS,
  labels: ctx.LABELS.entries,
  bands: ctx.BANDS.bands,
  weighting: ctx.GROUP.weighting, /* kept inside group too; top-level view for clarity is NOT stored twice — see below */
  koWeights: ctx.KO_WEIGHTS,
  cycle: ctx.CYCLE,
  review: ctx.REVIEW,
  history: ctx.HISTORY,
  priorCycle: ctx.PRIOR_CYCLE,
  /* The demo dataset has never had a plan replaced, so this is empty — but it
     travels, so the seed and the round trip agree on the shape. */
  archives: ctx.ARCHIVES || [],
  companies: ctx.COMPANIES,
  companyKeys: ctx.COMPANY_KEYS,
};
/* weighting lives on group; do not store it twice. */
delete state.weighting;

/* A unit's weight is DERIVED from the factor table (§6) and recomputed by
   syncWeights() after hydration — never stored. Zeroed here so the round-trip
   comparison is against the underived state. */
state.unitKeys.forEach(function (k) { state.units[k].weight = 0; });

const out = path.join(__dirname, "..", "db", "seed-state.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(state, null, 1) + "\n");
console.log("wrote", out,
  "| units:", state.unitKeys.length,
  "| capabilities:", state.group.capabilities.length,
  "| people:", state.people.length,
  "| bytes:", fs.statSync(out).size);
