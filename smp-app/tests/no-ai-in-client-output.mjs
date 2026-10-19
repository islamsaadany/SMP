/* A client's report must never show the AI review's words. Run: node tests/no-ai-in-client-output.mjs
   Islam: "i dont want clients report to show AI options". The AI review's note on a step
   (`reviewNotes`, "AI Review note:"), a finding waiting to become a step (`proposed*`, "Proposed ·
   from AI review") and the findings themselves (`ReviewFinding`) are the OFFICE's working
   material. Everything a client can read or download is listed below; none of it may so much as
   name them. Text-level, no database. A new client-facing file belongs in the list. */
import fs from "fs";
import path from "path";

const APP = new URL("..", import.meta.url).pathname;
const PROC = "app/(ffp)/[slug]/processes";
const ROOTS = [
  "ffp/lib/reports",                       // the Export Report's data
  `${PROC}/reports`,                       // the report, the printed map, the SOP document
  `${PROC}/read`,                          // the staff reader view
  "app/api/ffp/export",                    // PDF / Word / sheet downloads
  "ffp/lib/domain/sop.ts",                 // the SOP compile
  "ffp/lib/domain/process-report.ts",      // the report's own rules
];
const FORBIDDEN = /reviewNotes|proposedLabel|proposedNotes|proposedAfterStepId|reviewFinding|ReviewFinding|AI Review|from AI review|ai-review/;

let pass = 0, fail = 0;
const check = (n, c, extra) => (c ? pass++ : (fail++, console.log("  FAIL  " + n + (extra ? "\n        " + extra : ""))));

function* files(p) {
  const full = path.join(APP, p);
  if (!fs.existsSync(full)) { check(`${p} exists (a moved file would silently drop out of this check)`, false); return; }
  if (fs.statSync(full).isFile()) { yield p; return; }
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(p, e.name);
    if (e.isDirectory()) yield* files(rel);
    else if (/\.(ts|tsx|css)$/.test(e.name)) yield rel;
  }
}

let scanned = 0;
for (const root of ROOTS) {
  for (const f of files(root)) {
    scanned++;
    const m = fs.readFileSync(path.join(APP, f), "utf8").match(FORBIDDEN);
    check(`${f} does not touch the AI review's words`, !m, m && `found "${m[0]}"`);
  }
}
check("scanned the client-facing files", scanned >= 15, `only ${scanned}`);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
