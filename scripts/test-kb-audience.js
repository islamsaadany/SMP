/* ── WHO SEES WHICH ANSWER (§160) ──────────────────────────────────────────
   `who` used to be RELEVANCE and never permission: the whole corpus went to
   the model and the tag only chose between two public answers. Islam settled
   that the Strategy Office's operational answers are the office's alone, so
   `assistant.officeOnly()` filters the corpus by the asker's seat.

   ASSERTED AT BOTH ENDS, because a filter is the easiest thing in the world
   to get half right (§94.2): an office answer must be ABSENT for everybody
   else AND still PRESENT for the office — a build that filtered both ways
   passes the first assertion on its own.

   AND THE PAIR IS ASSERTED SEPARATELY, because that is the shape the filter
   exists to serve: a question with two true answers must leave each side
   exactly one, never both and never none (§113.8 — "the two agree" is
   preserved by removing both).

   No database and no network: officeOnly() is a pure function over the
   generated corpus, so this runs in a second and can sit in front of any
   change to the tag's meaning.

     node scripts/test-kb-audience.js
*/
const assistant = require("../lib/assistant.js");
const Rules = require("../lib/rules.js");
const kb = require("../db/kb.json");

let bad = 0;
function ck(what, ok, extra) {
  if (!ok) bad++;
  console.log((ok ? "  ok      " : "  FAIL    ") + what +
              (!ok && extra !== undefined ? "  — " + JSON.stringify(extra) : ""));
}

const officeIds = kb.recipes.filter(r => r.who === "office").map(r => r.id);
const forOffice = assistant.officeOnly(kb, true);
const forOthers = assistant.officeOnly(kb, false);

console.log("\n1 · the office's answers reach the office, and nobody else");
ck("there are office-tagged answers to test at all (" + officeIds.length + ")",
   officeIds.length > 0);
const leaked = officeIds.filter(id => forOthers.recipes.some(r => r.id === id));
ck("none reaches a non-office asker", leaked.length === 0, leaked);
const lost = officeIds.filter(id => !forOffice.recipes.some(r => r.id === id));
ck("and every one still reaches the office", lost.length === 0, lost);
ck("everyone else keeps the rest (" + forOthers.recipes.length + " of " +
   kb.recipes.length + ")",
   forOthers.recipes.length === kb.recipes.length - officeIds.length,
   { others: forOthers.recipes.length, all: kb.recipes.length });

console.log("\n2 · nothing else about the corpus moves");
ck("the office's corpus is the whole corpus",
   forOffice.recipes.length === kb.recipes.length);
["sections", "pages"].forEach(k => {
  ck("the " + k + " are untouched for both (" + (kb[k] || []).length + ")",
     (forOffice[k] || []).length === (kb[k] || []).length &&
     (forOthers[k] || []).length === (kb[k] || []).length);
});

console.log("\n3 · a question with two true answers leaves each side exactly one");
const qs = {};
kb.recipes.forEach(r => { (qs[r.q] = qs[r.q] || []).push(r); });
const pairs = Object.keys(qs).filter(q => qs[q].length > 1);
ck("there is at least one pair (" + pairs.length + ")", pairs.length > 0);
pairs.forEach(q => {
  const mine = forOthers.recipes.filter(r => r.q === q);
  const theirs = forOffice.recipes.filter(r => r.q === q);
  ck('"' + q.slice(0, 46) + '" — one answer for everyone else', mine.length === 1,
     mine.map(r => r.id));
  ck('"' + q.slice(0, 46) + '" — both still there for the office', theirs.length === 2,
     theirs.map(r => r.id));
});

console.log("\n4 · the seat is read the one way the endpoint reads it");
ck("isOfficeRole answers for the two office seats",
   Rules.isOfficeRole("super") && Rules.isOfficeRole("smoteam"));
ck("and for nobody else",
   !Rules.isOfficeRole("custodian") && !Rules.isOfficeRole("owner") &&
   !Rules.isOfficeRole("") && !Rules.isOfficeRole("gceo"));

console.log(bad ? "\n" + bad + " FAILED\n" : "\nALL CLEAR\n");
process.exit(bad ? 1 : 0);
