/* ── STAGE 3b, THE SECOND MOVE: WHAT REMOVING A SWITCHED-OFF UNIT TAKES ────
   Islam, 2026-10-15, of El Abd's five hidden business units: *"the business
   units were a mistake that we removed later and adjusted the planning to
   pillars under the company directly so they need to be removed ensuring that
   the directions and capabilities under the company are untouched"*, and
   *"there is not units coming back"*.

   THAT REVERSES AN ASSUMPTION IN SPEC 066 (§2.2, §9), which had El Abd's
   units *"coming back as boxes"*. They are not coming back; they are dead
   records to delete. Which makes this the most dangerous operation in the
   whole of stage 3 — a delete — so this script exists to put the whole of
   what would go in front of him first. IT DELETES NOTHING and writes nothing.

   WHAT IT ASKS, and why each question is here rather than assumed:
     1 · EVERY reference to the doomed keys anywhere in the stored state,
         found by walking the whole tree rather than by checking the places
         somebody remembered. A delete that leaves a dangling pointer is the
         failure mode, and the only honest way to rule it out is exhaustion.
     2 · The named things a delete would break — people attached, history,
         archives, reported figures, notes, slides, weights, access rows —
         each asserted at zero rather than inferred from the walk above
         finding nothing (§94.2: a silence is not an answer).
     3 · WHAT CONTENT GOES: objectives, actions, pillars, projects, SWOT
         lines, foundation clauses, and how many carry a reported figure.
     4 · AND THE ONE THAT DECIDES IT: which of those objectives already exist
         as a key measure on the company's own plan — because these units were
         folded INTO that plan (§447), so most of what they hold is a copy.
         The ones that are NOT a copy are what a delete actually loses, and
         they are listed by name. Matching is by WORDING and is therefore a
         prompt to look, never a verdict: an objective reported here as a copy
         should still be eyeballed before anything runs.

   Usage:
     node scripts/stage3-unit-removal-readings.js <working-copy.html>
     node scripts/stage3-unit-removal-readings.js <file> --json
   A working copy is the file Setup › Reporting cycle › Contingency files
   hands out (§306). No browser, no database, no network. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const input = args.find((a) => !a.startsWith("--"));
if (!input) { console.error("usage: node scripts/stage3-unit-removal-readings.js <working-copy.html> [--json]"); process.exit(2); }

const html = fs.readFileSync(input, "utf8");
const m = html.match(/<script type="application\/json" id="smp-offline">([\s\S]*?)<\/script>/);
if (!m) { console.error(input + " holds no smp-offline block — is it a working copy?"); process.exit(2); }
const s = JSON.parse(m[1]);

/* The doomed keys: the units that exist in storage while the Structure says
   business units do not. Read from the state, never typed in — a typed list
   is a second opinion about which rows die (§100.3). */
const OFF = !!(s.group && s.group.structure && s.group.structure.bu && s.group.structure.bu.exists === false);
const KEYS = (s.unitKeys || []).slice();
const norm = (x) => String(x == null ? "" : x).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/* 1 · every reference, by walking the whole tree */
const refs = [];
(function walk(node, p) {
  if (node === null || node === undefined) return;
  if (typeof node === "string") { if (KEYS.includes(node)) refs.push({ path: p, how: "value", key: node }); return; }
  if (typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, p + "[" + i + "]")); return; }
  Object.keys(node).forEach((k) => {
    if (KEYS.includes(k)) refs.push({ path: p + "." + k, how: "key", key: k });
    walk(node[k], p + "." + k);
  });
})(s, "");

/* 2 · the named things a delete would break, each counted on its own */
const BREAKS = [
  ["people attached to one of them", (s.people || []).filter((p) => KEYS.includes(p.unit)).map((p) => p.key)],
  ["history entries naming one", (s.history || []).filter((h) => h.units && Object.keys(h.units).some((k) => KEYS.includes(k))).map((h) => h.name)],
  ["archives naming one", (s.archives || []).filter((a) => KEYS.includes(a.unit) || KEYS.includes(a.target)).map((a) => a.unit || a.target)],
  ["submitted reports naming one", Object.keys((s.review && s.review.submitted) || {}).filter((k) => KEYS.includes(k))],
  ["cycle notes naming one", Object.keys((s.review && s.review.notes) || {}).filter((k) => KEYS.includes(k))],
  ["deck slides naming one", Object.keys((s.review && s.review.slides) || {}).filter((k) => KEYS.includes(k))],
  ["objective weights naming one", Object.keys(s.koWeights || {}).filter((k) => KEYS.includes(k))],
  ["access rows naming one", Object.keys(s.access || {}).filter((k) => KEYS.includes(k))],
  ["an owner or custodian on one", KEYS.filter((k) => { const r = (s.unitRoles || {})[k] || {}; return !!(r.head || r.custodian); })],
  ["a figure sourced from one", (function () {
    const out = []; (function w(x) {
      if (!x || typeof x !== "object") return;
      if (x.src && KEYS.includes(x.src.unit)) out.push(x.name || x.id || "a row");
      Object.keys(x).forEach((k) => w(x[k]));
    })(s); return out;
  })()]
];

/* 3 and 4 · what content goes, and how much of it is a copy */
const dirMeasures = [];
(s.group.items || []).forEach((p) => (p.measures || []).forEach((x) => dirMeasures.push({ pillar: p.name, name: x.name })));
const copyOf = function (name) {
  const a = norm(name); if (!a) return null;
  return dirMeasures.find(function (d) { const b = norm(d.name); return b && (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0); }) || null;
};
const units = KEYS.map(function (k) {
  const u = s.units[k] || {};
  const ko = (u.keyObjectives || []).map(function (o) {
    const hit = copyOf(o.name);
    return { name: o.name || "", reported: String(o.actual || "").trim() !== "",
             copyOf: hit ? hit.pillar : null };
  });
  return {
    key: k, name: u.name || "", active: u.active !== false,
    division: u.company || u.co || null,
    objectives: ko,
    actions: (u.actions || []).length, pillars: (u.items || []).length, projects: (u.projects || []).length,
    swotLines: ["s", "w", "o", "t"].reduce(function (a, q) { return a + (((u.swot || {})[q]) || []).length; }, 0),
    clauses: (u.clauses || []).length,
    aspiration: (u.aspiration || "").trim()
  };
});

if (asJson) {
  console.log(JSON.stringify({ source: path.basename(input), org: s.group.org || "", buOff: OFF,
                               keys: KEYS, references: refs, breaks: BREAKS, units: units }, null, 2));
  process.exit(0);
}

console.log("STAGE 3b, SECOND MOVE · what removing the switched-off units would take");
console.log("source: " + path.basename(input) + (s.group.org ? "   client: " + s.group.org : ""));
console.log("");
if (!KEYS.length) { console.log("This client stores no business units. NOTHING TO REMOVE."); process.exit(0); }
if (!OFF) {
  console.log("Business units are SWITCHED ON in this client, so none of them is a dead record.");
  console.log("This script is for the case where the Structure says units do not exist while the");
  console.log("records are still stored. NOTHING TO REMOVE here — stopping before it reads further.");
  process.exit(0);
}
console.log(KEYS.length + " unit(s) are stored while the Structure says business units do not exist.");
console.log("");

console.log("1 · EVERY REFERENCE TO THEM, anywhere in the stored state — " + refs.length + " in total");
const grouped = {};
refs.forEach(function (r) {
  const g = r.path.replace(/\[\d+\]/g, "[]").replace(new RegExp("\\.(" + KEYS.join("|") + ")(\\.|$)"), ".<unit>$2");
  (grouped[g] = grouped[g] || { n: 0, how: r.how }).n++;
});
Object.keys(grouped).sort().forEach(function (g) {
  console.log("   " + String(grouped[g].n).padStart(3) + "x  " + (grouped[g].how === "key" ? "as a key  " : "as a value") + "  " + g);
});
console.log("   Every one of these is structure — the lists that name a unit. None is a figure,");
console.log("   a report or a person; those are counted on their own below.");
console.log("");

console.log("2 · WHAT A DELETE WOULD BREAK");
let anyBreak = 0;
BREAKS.forEach(function (b) {
  const n = b[1].length; anyBreak += n;
  console.log("   " + (n === 0 ? "clean " : "STOP  ") + String(n).padStart(4) + "  " + b[0] +
              (n ? "   → " + b[1].slice(0, 6).join(", ") + (n > 6 ? " …" : "") : ""));
});
console.log(anyBreak === 0
  ? "   Nothing is attached to them. A delete breaks no pointer."
  : "   ONE OR MORE POINTERS WOULD DANGLE — do not run a delete until each is dealt with.");
console.log("");

console.log("3 · WHAT CONTENT WOULD GO");
let totKO = 0, totRep = 0, totAct = 0, totCl = 0;
units.forEach(function (u) {
  totKO += u.objectives.length; totRep += u.objectives.filter((o) => o.reported).length;
  totAct += u.actions; totCl += u.clauses;
  console.log("   " + u.name + "   (" + u.key + ")");
  console.log("      " + u.objectives.length + " objectives · " + u.actions + " actions · " + u.pillars +
              " pillars · " + u.projects + " projects · " + u.swotLines + " SWOT lines · " + u.clauses + " foundation clauses");
});
console.log("   ──");
console.log("   " + totKO + " objectives, " + totRep + " of them carrying a reported figure; " +
            totAct + " actions; " + totCl + " foundation clauses.");
console.log("");

const orphans = [];
units.forEach(function (u) { u.objectives.forEach(function (o) { if (!o.copyOf) orphans.push([u.name, o.name]); }); });
const copies = totKO - orphans.length;
console.log("4 · HOW MUCH OF IT IS ALREADY ON THE COMPANY'S OWN PLAN");
console.log("   These units were folded into that plan, so most of what they hold is a copy.");
console.log("   " + copies + " of " + totKO + " objectives match a key measure on a direction by wording.");
console.log("");
if (!orphans.length) {
  console.log("   NOTHING IS LOST: every objective on these units also stands on the company's plan.");
} else {
  console.log("   " + orphans.length + " DO NOT APPEAR ANYWHERE ON THE COMPANY PLAN. These are what a delete loses:");
  orphans.forEach(function (o) { console.log("      " + String(o[0]).padEnd(32) + o[1]); });
  console.log("");
  console.log("   Decide on these " + orphans.length + " before anything runs: carried onto a direction as a key");
  console.log("   measure, or let go deliberately. Matching above is by WORDING, so read the list.");
}
console.log("");
console.log("Nothing here has been changed. This script only reads.");
