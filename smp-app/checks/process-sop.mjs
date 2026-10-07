/* ── THE SOP COMPILE (§510) ───────────────────────────────────────────────
 *
 * No database and no browser: compileSop is pure. Both ends every time
 * (§94.2) — a blank is Missing AND a filled cell is not; a step that
 * carries approval says so AND one that does not says nothing.
 *
 *   node --experimental-strip-types checks/process-sop.mjs          the check
 *   node --experimental-strip-types checks/process-sop.mjs --red    each break
 *       is made in a COPY of the source (§276) and must turn this red; every
 *       break asserts it matched before it is written (§344.1).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const real = join(here, "../ffp/lib/domain/sop.ts");

const BREAKS = {
  "no-missing-who": ['if (!who) missing.push("who");', ""],
  "no-missing-control": ["Object.values(control).filter((v) => v === null).length +", "0 +"],
  "approval-needs-no-flag": ["row?.requiresApproval && row.approverLabel", "row?.approverLabel"],
  "no-handoff-number": ["const n = src.steps.findIndex((x) => x.id === to.id) + 1;", "const n = 0;"],
  "blank-is-text": ["(v && v.trim() ? v.trim() : null)", "(v ?? null)"],
  "end-step-missing": ['const isWork = s.type === "TASK" || s.type === "DECISION";', "const isWork = true;"],
};

if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "sop-red");
  mkdirSync(dir, { recursive: true });
  const src = readFileSync(real, "utf8");
  let notRed = 0;
  for (const [name, [from, to]] of Object.entries(BREAKS)) {
    if (!src.includes(from)) { console.log("BREAK DID NOT MATCH: " + name); notRed++; continue; }
    const f = join(dir, name + ".ts");
    writeFileSync(f, src.replace(from, to));
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)],
      { env: { ...process.env, SOP_MODULE: f }, encoding: "utf8" });
    const n = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + name); notRed++; } else console.log("red " + n + ": " + name);
  }
  process.exit(notRed ? 1 : 0);
}

const { compileSop } = await import(process.env.SOP_MODULE || real);

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};

const full = () => ({
  code: "P01", name: "Pay a supplier", processPurpose: "Pay suppliers correctly and on time.",
  inScope: ["Invoices"], outOfScope: ["Payroll"],
  sopVersion: "1.0", sopOwner: "Hend", sopEffectiveDate: "2026-10-01", sopApprovedBy: "Islam",
  sopRevisions: [{ version: "1.0", date: "2026-10-01", by: "Hend", change: "First issue" }],
  kpis: [{ metric: "Days to pay", target: "30", frequency: "Monthly" }],
  steps: [
    { id: "a", type: "START", label: "Start", detailedAction: [], sopInputs: null, sopOutput: null, sopErrors: null, assignedRole: null, slaDays: null, links: [] },
    { id: "b", type: "TASK", label: "Check invoice", detailedAction: ["Match to PO"], sopInputs: "Invoice, PO", sopOutput: "Checked invoice", sopErrors: "Mismatch: return it", assignedRole: { name: "Accountant" }, slaDays: 2, links: [] },
    { id: "c", type: "TASK", label: "Approve payment", detailedAction: ["Review"], sopInputs: "Checked invoice", sopOutput: "Approval", sopErrors: null, assignedRole: { name: "Finance Manager" }, slaDays: null, links: [{ targetProcess: { code: "P02", name: "Banking" } }] },
    { id: "d", type: "END", label: "End", detailedAction: [], sopInputs: null, sopOutput: null, sopErrors: null, assignedRole: null, slaDays: null, links: [] },
  ],
  connections: [
    { fromStepId: "a", toStepId: "b", label: null },
    { fromStepId: "b", toStepId: "c", label: "Valid" },
    { fromStepId: "c", toStepId: "d", label: null },
  ],
  combinedRows: [
    { label: "Check invoice", approverLabel: "Someone Else", requiresApproval: false },
    { label: "Approve payment", approverLabel: "Finance Manager", requiresApproval: true },
  ],
  involvedRoles: [{ name: "Accountant" }, { name: "Finance Manager" }],
  controlPoints: [{ statement: "Two people sign off" }],
});

console.log("\n§1  a complete process owes nothing");
const s = compileSop(full());
check("nothing is missing", s.missingCount === 0, String(s.missingCount));
check("procedure is numbered one per step", s.procedure.map((p) => p.number).join() === "1,2,3,4");
check("who, how, inputs, output, errors carried", s.procedure[1].who === "Accountant" && s.procedure[1].how[0] === "Match to PO" && s.procedure[1].inputs === "Invoice, PO" && s.procedure[1].output === "Checked invoice" && s.procedure[1].errors === "Mismatch: return it");

console.log("\n§2  approval, time limit and hand-over are derived, never invented");
check("a step with a time limit and no approval says only the limit", s.procedure[1].approval === "within 2 days", String(s.procedure[1].approval));
check("a step needing approval names the approver", s.procedure[2].approval === "Approver: Finance Manager", String(s.procedure[2].approval));
check("a step with neither says nothing", s.procedure[0].approval === null && s.procedure[3].approval === null);
check("hand-over names the next step by number", s.procedure[0].handoff === "→ 2. Check invoice", String(s.procedure[0].handoff));
check("a labelled branch keeps its label", s.procedure[1].handoff === "Valid → 3. Approve payment", String(s.procedure[1].handoff));
check("a link to another process is a hand-over", /→ P02 Banking/.test(s.procedure[2].handoff || ""), String(s.procedure[2].handoff));

console.log("\n§3  blanks are Missing, and only where they should be");
const blanky = full();
blanky.sopVersion = "  "; blanky.sopOwner = null; blanky.sopEffectiveDate = ""; blanky.sopApprovedBy = null;
blanky.processPurpose = " ";
blanky.steps[1].assignedRole = null;
blanky.steps[2].sopOutput = null;
const b = compileSop(blanky);
check("whitespace is blank, not a value", b.control.version === null && b.purpose === null);
check("all four control fields are Missing", Object.values(b.control).every((v) => v === null));
check("purpose Missing", b.purpose === null);
check("a work step without who or output lists exactly those", b.procedure[1].missing.join() === "who" && b.procedure[2].missing.join() === "output");
check("start and end steps owe no detail", s.procedure[0].missing.length === 0 && b.procedure[3].missing.length === 0);
check("the count is every blank: 4 control + purpose + 2 cells", b.missingCount === 7, String(b.missingCount));
check("errors are optional and never Missing", s.procedure[2].errors === null && s.procedure[2].missing.indexOf("errors") === -1);

console.log("\n§4  the rest travels whole");
check("revisions, kpis, controls, roles", s.revisions.length === 1 && s.kpis.length === 1 && s.controls[0] === "Two people sign off" && s.roles.join() === "Accountant,Finance Manager");

console.log(`\n${ok} ok, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
