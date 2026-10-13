/* ── AI REVIEW: ADD A FINDING AS A PROPOSED STEP (§524) ───────────────────
 *
 * No database here, and said so (§54.5): the pure rules are RUN, and the three
 * actions are READ for the shape that makes the flow safe. The real press
 * (propose -> confirm / delete against Postgres) is not exercised by this file.
 *
 *   node --experimental-strip-types checks/review-propose-step.mjs
 *   node --experimental-strip-types checks/review-propose-step.mjs --red
 *       each break is made in a COPY and must turn this red (§276); every
 *       break asserts it matched first (§344.1).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const FILES = {
  findings: join(here, "../ffp/lib/domain/review-findings.ts"),
  order: join(here, "../ffp/lib/domain/step-order.ts"),
  actions: join(here, "../ffp/lib/actions/ai-review.ts"),
};

const BREAKS = {
  "proposal-always": [FILES.findings, "proposal: f.proposedLabel\n      ?", "proposal: true\n      ?"],
  "confirm-keeps-proposal": [FILES.actions, "        proposedLabel: null,\n        proposedNotes: null,\n        proposedAfterStepId: null,\n      },\n      include: { integratedStep: true },\n    });\n  });", "      },\n      include: { integratedStep: true },\n    });\n  });"],
  "confirm-not-integrated": [FILES.actions, 'status: "INTEGRATED",\n        integratedStepId: created.id,', 'status: "OPEN",\n        integratedStepId: created.id,'],
  "no-splice": [FILES.actions, "data: { fromStepId: created.id },", "data: { fromStepId: anchorId },"],
  "no-shift": [FILES.actions, "if (position < orderedIds.length) {", "if (false) {"],
  "delete-reopens-handled": [FILES.actions, '...(finding.status === "INTEGRATED" || finding.status === "DISMISSED" ? {} : { status: "OPEN" })', '...{ status: "OPEN" }'],
  "propose-adds-step": [FILES.actions, "const updated = await prisma.reviewFinding.update({\n    where: { id: finding.id },\n    data: {\n      proposedLabel: parsed.data.label,", "await prisma.processStep.create({ data: { processId: finding.processId, type: \"TASK\", label: parsed.data.label, positionX: 0, positionY: 0, order: 0 } });\n  const updated = await prisma.reviewFinding.update({\n    where: { id: finding.id },\n    data: {\n      proposedLabel: parsed.data.label,"],
  "anchor-any-process": [FILES.actions, "if (!anchor || anchor.processId !== finding.processId) return notFound();", "if (!anchor) return notFound();"],
  "end-is-start": [FILES.order, "return index === -1 ? orderedStepIds.length : index + 1;", "return 0;"],
};

if (process.argv.includes("--red")) {
  const dir = join(process.env.TMPDIR || "/tmp", "propose-red");
  mkdirSync(dir, { recursive: true });
  let notRed = 0;
  for (const [name, [file, from, to]] of Object.entries(BREAKS)) {
    const src = readFileSync(file, "utf8");
    if (!src.includes(from)) { console.log("BREAK DID NOT MATCH: " + name); notRed++; continue; }
    const f = join(dir, name + ".ts");
    writeFileSync(f, src.replace(from, to));
    const env = { ...process.env };
    for (const [k, p] of Object.entries(FILES)) if (p === file) env["MOD_" + k.toUpperCase()] = f;
    const r = spawnSync(process.execPath, ["--experimental-strip-types", fileURLToPath(import.meta.url)], { env, encoding: "utf8" });
    const n = (r.stdout.match(/^ {2}FAIL/gm) || []).length;
    if (r.status === 0) { console.log("NOT RED: " + name); notRed++; } else console.log("red " + n + ": " + name);
  }
  process.exit(notRed ? 1 : 0);
}

const path = (k) => process.env["MOD_" + k.toUpperCase()] || FILES[k];
const { toPersistedFinding } = await import(path("findings"));
const { insertPositionAfter } = await import(path("order"));
const actions = readFileSync(path("actions"), "utf8");

let ok = 0; const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const body = (name) => {
  const i = actions.indexOf("export async function " + name);
  const j = actions.indexOf("export async function ", i + 10);
  return actions.slice(i, j === -1 ? undefined : j);
};

const base = { id: "f", title: "t", description: "d", category: "GAP", area: "STEPS", severity: "HIGH", status: "OPEN",
  integratedStepId: null, integrationMode: null, integratedStep: null };

console.log("\n§1  the finding carries a proposal only while one waits");
const none = toPersistedFinding({ ...base });
check("no proposed label means no proposal", none.proposal === null, JSON.stringify(none.proposal));
const withP = toPersistedFinding({ ...base, proposedLabel: "Check ID", proposedNotes: null, proposedAfterStepId: "s2" });
check("a proposal carries label, empty notes and the anchor", withP.proposal && withP.proposal.label === "Check ID" && withP.proposal.notes === "" && withP.proposal.afterStepId === "s2", JSON.stringify(withP.proposal));

console.log("\n§2  where a confirmed step lands");
const ids = ["a", "b", "c"];
check("after a middle step goes straight after it", insertPositionAfter(ids, "b") === 2);
check("after the last step goes to the end", insertPositionAfter(ids, "c") === 3);
check("no anchor goes to the end", insertPositionAfter(ids, null) === 3);
check("a deleted anchor falls back to the end, not an error", insertPositionAfter(ids, "gone") === 3);

console.log("\n§3  the three actions (read, not run)");
const prop = body("proposeStepFromFinding"), conf = body("confirmProposedStep"), del = body("deleteProposedStep");
check("proposing creates no step", !/processStep\.create/.test(prop) && /reviewFinding\.update/.test(prop));
check("a handled finding cannot be proposed against", /DISMISSED[\s\S]*INTEGRATED|INTEGRATED[\s\S]*DISMISSED/.test(prop));
check("the anchor must belong to the same process", /anchor\.processId !== finding\.processId/.test(prop));
check("confirming with no proposal is refused", /!finding\.proposedLabel/.test(conf));
check("confirming makes one step and marks the finding integrated", /processStep\.create/.test(conf) && /status: "INTEGRATED"/.test(conf));
check("confirming clears the proposal", /proposedLabel: null,\s*\n\s*proposedNotes: null,\s*\n\s*proposedAfterStepId: null,\s*\n\s*\},\s*\n\s*include/.test(conf.slice(conf.indexOf("reviewFinding.update"))));
check("confirming shifts later steps down and splices the flow", /increment: 1/.test(conf) && /fromStepId: created\.id/.test(conf) && /toStepId: created\.id/.test(conf));
check("the shift only happens when it lands before the end", /if \(position < orderedIds\.length\)/.test(conf));
check("it all happens in one transaction", /\$transaction/.test(conf));
check("deleting creates no step", !/processStep\.create/.test(del));
check("deleting clears all three proposal fields", /proposedLabel: null/.test(del) && /proposedNotes: null/.test(del) && /proposedAfterStepId: null/.test(del));
check("deleting reopens an open finding but not a handled one", /finding\.status === "INTEGRATED" \|\| finding\.status === "DISMISSED" \? \{\} : \{ status: "OPEN" \}/.test(del));
check("all three need an editor", [prop, conf, del].every((b) => /requireWorkspaceAccess\([^)]*"EDITOR"\)/.test(b)));

console.log(`\n${ok} ok, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
