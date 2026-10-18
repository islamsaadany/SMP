/* Is every page under Processes behind a gate? Run: node tests/processes-gate.mjs
   The frame layout (processes/layout.tsx) only checks the person got through
   the door. WHO may open a page is asked by the area it sits in:
     · the office-only areas call officeOnlyNotice(...) first in their layout;
     · the staff reader view (read/) calls readerSeat(...) in its layout.
   A page with neither above it would be open to every client person, so this
   fails when one is left bare. No database needed. */
import fs from "fs";
import path from "path";

const ROOT = new URL("../app/(ffp)/[slug]/processes", import.meta.url).pathname;
let pass = 0, fail = 0;
const check = (n, c, extra) => (c ? pass++ : (fail++, console.log("  FAIL  " + n + (extra ? "\n        " + extra : ""))));

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/^(page|route)\.(tsx|ts)$/.test(e.name)) yield p;
  }
}
const layoutIn = (dir) => ["layout.tsx", "layout.ts"].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));

/** The layouts above a page, below the frame. */
function ancestors(file) {
  const out = [];
  for (let d = path.dirname(file); d.length > ROOT.length; d = path.dirname(d)) {
    const l = layoutIn(d);
    if (l) out.push(l);
  }
  return out;
}
const firstCall = (src, ...names) => Math.min(...names.map((n) => (src.indexOf(n) === -1 ? Infinity : src.indexOf(n))));

let pages = 0;
for (const file of walk(ROOT)) {
  pages++;
  const rel = path.relative(ROOT, file);
  const layouts = ancestors(file).map((l) => ({ l, src: fs.readFileSync(l, "utf8") }));
  if (rel.startsWith("read" + path.sep)) {
    check(`${rel} is behind readerSeat`, layouts.some((x) => x.src.includes("readerSeat(")));
  } else {
    const gate = layouts.find((x) => x.src.includes("officeOnlyNotice("));
    check(`${rel} is behind officeOnlyNotice`, !!gate);
    // The gate must run before the layout does anything else with the request.
    if (gate) check(`${path.relative(ROOT, gate.l)} asks officeOnlyNotice before anything else`, gate.src.indexOf("officeOnlyNotice(") < firstCall(gate.src, "requireWorkspaceAccess(", "prisma."));
  }
}
check("found the pages", pages > 15, `only ${pages}`);

const frame = fs.readFileSync(path.join(ROOT, "layout.tsx"), "utf8");
check("the frame still asks the door", frame.includes("resolveTenant("));
check("the frame no longer turns staff away itself", !/office \? \(/.test(frame));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
