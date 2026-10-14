/* ── RACI: FILL FROM OWNERS AND SUGGEST (§530) ────────────────────────────
 * No database, no browser: both planners are pure. Both ends every time
 * (§94.2): an empty cell IS filled and a filled one is NOT; a row with no A
 * IS offered one and a row with an A is NOT.
 *   node --experimental-strip-types checks/raci-autofill.mjs          the check
 *   node --experimental-strip-types checks/raci-autofill.mjs --red    each break
 *       is made in a COPY (§276) and must turn this red; each asserts it
 *       matched before it is written (§344.1).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const real = join(here, "../ffp/lib/domain/raci-table.ts");

const BREAKS = {
  "overwrite": ["if (!ownerRoleId || row.assignments[ownerRoleId]) continue;", "if (!ownerRoleId) continue;"],
  "fill-skipped": ["if (row.skipped || !row.stepId) continue;\n    const ownerRoleId", "if (!row.stepId) continue;\n    const ownerRoleId"],
  "suggest-over-a": ['if (Object.values(row.assignments).includes("ACCOUNTABLE")) continue;', ""],
  "suggest-over-filled": ["if (row.assignments[managerRoleId]) continue;", ""],
  "suggest-hidden-column": ["!visibleRoleIds.includes(managerRoleId)", "false"],
  "suggest-r": ['out.push({ row, roleId: managerRoleId, code: "ACCOUNTABLE" });', 'out.push({ row, roleId: managerRoleId, code: "RESPONSIBLE" });'],
};

if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "raci-red");
  mkdirSync(dir, { recursive: true });
  const src = readFileSync(real, "utf8");
  let notRed = 0;
  for (const [name, [from, to]] of Object.entries(BREAKS)) {
    if (!src.includes(from)) { console.log("BREAK DID NOT MATCH: " + name); notRed++; continue; }
    const f = join(dir, name + ".ts");
    writeFileSync(f, src.replace(from, to));
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)],
      { env: { ...process.env, RACI_MODULE: f }, encoding: "utf8" });
    const n = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + name); notRed++; } else console.log("red " + n + ": " + name);
  }
  process.exit(notRed ? 1 : 0);
}

const { planOwnerFill, planSuggestions } = await import(process.env.RACI_MODULE || real);

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

const row = (id, stepId, assignments = {}, skipped = false, kind = "step") =>
  ({ id, kind, stepId, stepType: "TASK", label: id, skipped, assignments });
const rows = [
  row("r1", "s1"),                                   // empty: fill + suggest
  row("r2", "s2", { acc: "RESPONSIBLE" }),           // owner cell already filled
  row("r3", "s3", {}, true),                         // skipped
  row("r4", "s4", { acc: "ACCOUNTABLE" }),           // already has an A (elsewhere)
  row("r5", null),                                   // freestanding
  row("r6", "s6", { boss: "CONSULTED" }),            // manager cell filled
  row("r7", "s7"),                                   // manager column hidden
];
const owners = {
  s1: { ownerRoleId: "acc", managerRoleId: "boss" },
  s2: { ownerRoleId: "acc", managerRoleId: "boss" },
  s3: { ownerRoleId: "acc", managerRoleId: "boss" },
  s4: { ownerRoleId: "acc", managerRoleId: "boss" },
  s6: { ownerRoleId: "acc", managerRoleId: "boss" },
  s7: { ownerRoleId: "acc", managerRoleId: "ghost" },
};

console.log("\n§1  Fill from step owners");
const fill = planOwnerFill(rows, owners);
const fid = fill.map((c) => c.row.id).sort().join(",");
check("empty owner cells get R on rows 1, 6, 7", fid === "r1,r6,r7", fid);
check("every fill is Responsible, in the owner's column", fill.every((c) => c.code === "RESPONSIBLE" && c.roleId === "acc"));
check("an already-filled cell is never overwritten", !fill.some((c) => c.row.id === "r2"));
check("a skipped row is untouched", !fill.some((c) => c.row.id === "r3"));
check("a stepless row is untouched", !fill.some((c) => c.row.id === "r5"));
check("a step with no owner fills nothing", planOwnerFill([row("x", "sx")], { sx: { ownerRoleId: null, managerRoleId: "boss" } }).length === 0);

console.log("\n§2  Suggest");
const sug = planSuggestions(rows, owners, ["acc", "boss"]);
const sid = sug.map((c) => c.row.id).sort().join(",");
check("only rows 1 and 2 are offered an A", sid === "r1,r2", sid);
check("every suggestion is Accountable, in the manager's column", sug.every((c) => c.code === "ACCOUNTABLE" && c.roleId === "boss"));
check("no suggestion over an existing A", !sug.some((c) => c.row.id === "r4"));
check("no suggestion into a filled cell", !sug.some((c) => c.row.id === "r6"));
check("no suggestion into a hidden column", !sug.some((c) => c.row.id === "r7"));
check("no suggestion on a skipped or stepless row", !sug.some((c) => c.row.id === "r3" || c.row.id === "r5"));
check("no manager data means no suggestions", planSuggestions(rows, {}, ["acc", "boss"]).length === 0);

console.log(`\n${ok} ok, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
