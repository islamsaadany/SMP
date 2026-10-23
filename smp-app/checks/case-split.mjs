/* The interview's splitter (spec 067 §6) — the one piece of the write-up with
   a wrong answer available to it, checked on the SAME BYTES the browser runs.
   Every case that matters is the one where somebody's words could be lost.

     node checks/case-split.mjs
     node checks/case-split.mjs --break=drop-prose   (RED: a paste with no headings is thrown away)
     node checks/case-split.mjs --break=no-insights  (RED: the insights after the sections are dropped) */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
const CaseSplit = require("../lib/case-split.cjs");
const split = (t) => {
  const r = CaseSplit.split(t);
  if (brk === "drop-prose" && !/===/.test(t)) r.in_short = "";
  if (brk === "no-insights") r.insights = [];
  return r;
};
let oks = 0, fails = 0;
const check = (c, l, m) => { if (c) { oks++; console.log("ok    " + l); } else { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 200))); } };

const PASTE = `=== IN SHORT
Nile Logistics asked us to redesign how its three depots were run.
We moved planning to one team.
=== THE CLIENT AND WHY THEY CAME TO US
Two years of missed delivery targets.
=== WHAT WE WERE ASKED TO DO
Redesign the operating model.
=== THEIR TEAM            (one line each: name · role)
- Hany M. · COO
Sara K. · Head of Planning
=== TIMELINE
Mar · Diagnostic
Apr – Jun · Design, three workshops
=== DELIVERABLES          (one line each: name · what it was · month)
1. Depot diagnostic · Visits and figures from all three depots · Apr 2023
Operating model design · Central planning team, roles and the weekly rhythm · Jul 2023
=== WHO TO ASK
Islam Saadany · the depot managers

===
KIND: hiccup
TITLE: The depot managers heard about it from their drivers first
WHEN: May 2023
WHAT HAPPENED: Announced at head office on a Thursday.
===
KIND: lesson
TITLE: Five measures is the most they will look at
===`;

let r = split(PASTE);
check(r.in_short.startsWith("Nile Logistics asked") && r.in_short.includes("one team"), "In short is read, all of its lines", r.in_short);
check(r.client_why === "Two years of missed delivery targets." && r.asked_to_do === "Redesign the operating model.", "the prose sections land in their own fields", JSON.stringify([r.client_why, r.asked_to_do]));
check(r.their_team.length === 2 && r.their_team[0].name === "Hany M." && r.their_team[0].role === "COO", "their team: a bullet taken off, name and role apart", JSON.stringify(r.their_team));
check(r.stages.length === 2 && r.stages[1].when === "Apr – Jun" && r.stages[1].what === "Design, three workshops", "the timeline keeps a month range whole", JSON.stringify(r.stages));
check(r.deliverables.length === 2 && r.deliverables[0].name === "Depot diagnostic" && r.deliverables[0].month === "Apr 2023", "deliverables: a number taken off, name · what · month apart", JSON.stringify(r.deliverables));
check(r.deliverables[1].what.includes("weekly rhythm"), "…a 'what' with commas in it is kept whole", JSON.stringify(r.deliverables[1]));
check(r.who_to_ask.length === 1 && r.who_to_ask[0].about === "the depot managers", "who to ask, name and what to ask them about", JSON.stringify(r.who_to_ask));
check(r.came_of_it === "" && r.missing.includes("What came of it"), "a section the paste did not have is EMPTY and NAMED as missing, never invented", JSON.stringify(r.missing));
check(r.read.length === 7, "seven of the eight are counted as read", JSON.stringify(r.read));
check(r.insights.length === 2 && r.insights[0].kind === "hiccup" && r.insights[1].title.startsWith("Five measures"), "the insights after the sections are read by the memory's own splitter", JSON.stringify(r.insights.map((e) => e.title)));

r = split("We worked with Nile for nine months and it went well, mostly.\nThe drivers knew first.");
check(r.in_short.includes("nine months") && r.in_short.includes("drivers knew first"), "A PASTE WITH NO HEADINGS LANDS WHOLE IN IN SHORT — nothing dictated is lost (§184)", JSON.stringify(r.in_short));

r = split("Some words the assistant wrote first.\n=== IN SHORT\nThe short of it.");
check(r.in_short.startsWith("Some words") && r.in_short.includes("The short of it."), "words before the first heading are kept, in front of In short", JSON.stringify(r.in_short));

r = split("=== In short:\nlower case heading\n=== Their team\nOnly a name");
check(r.in_short === "lower case heading" && r.their_team[0].name === "Only a name" && r.their_team[0].role === "", "a heading is matched on its letters, and a line with no separator is all name, never dropped", JSON.stringify([r.in_short, r.their_team]));

r = split("=== IN SHORT\nx\n===\nnot an insight at all, just words\n===");
check(r.unread.length === 1 && r.unread[0].includes("just words"), "an insight block it cannot read comes back in unread with its words intact", JSON.stringify(r.unread));

r = split("");
check(r.read.length === 0 && r.missing.length === 8, "an empty paste reads nothing and names all eight as missing", JSON.stringify([r.read, r.missing.length]));

console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
