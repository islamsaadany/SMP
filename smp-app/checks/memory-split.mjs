/* The debrief splitter (spec 045, phase B) — pure, no browser, no database.
 *
 * This is the one piece of the memory with a WRONG ANSWER available to it:
 * everything else either works or throws, and this can quietly hand back four
 * insights where there were five, or nothing where there was a conversation.
 * So it is its own module and its own check, and every assertion below points
 * the same way — LOSING WHAT SOMEBODY DICTATED IS THE ONLY UNACCEPTABLE
 * OUTCOME (§184). A block it cannot read is kept whole; a paste with no rules
 * at all is one entry, never nought.
 *
 *   node checks/memory-split.mjs
 *   … --break=drop-unread     (RED: a block it cannot read is thrown away)
 *   … --break=empty-on-noise  (RED: prose with no rules in it becomes nothing)
 */
import { createRequire } from "node:module";
const S = createRequire(import.meta.url)("../lib/memory-split.cjs");
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
const section = (n) => console.log("── " + n);

/* the break is applied to the RESULT, so the module under test is the shipped
   one — a check that tests a doctored copy tests the doctoring (§276) */
const split = (t) => {
  const r = S.split(t);
  if (brk === "drop-unread") return { entries: r.entries, unread: [] };
  if (brk === "empty-on-noise" && !/^[ \t]*={3,}[ \t]*$/m.test(t)) return { entries: [], unread: [] };
  return r;
};

const FOUR = `===
KIND: hiccup
TITLE: The weighting workshop ran twice
WHEN: 1 August to 11 September 2026
WHAT HAPPENED: We ran it with the ten heads.
WHAT WE DID: Went back to them one by one.
WHAT CAME OF IT: The weights are right and the room is not.
WHAT THE NEXT PERSON SHOULD KNOW: Have the owner in the room.
===
KIND: practice
TITLE: Rehearse the first review
WHAT HAPPENED: Nothing exposes a half-filled plan like presenting it.
===
KIND: lesson
TITLE: Nobody reads forty pages, everybody reads their own
WHAT HAPPENED: Three replies in two weeks.
WHAT WE DID: Sent each head their own pages.
===
Also worth saying — finance moved faster once they had a named contact.
===`;

section("1 · four blocks, and the one it cannot read");
{
  const r = split(FOUR);
  check(r.entries.length === 3, "three blocks are read", r.entries.length);
  check(r.unread.length === 1, "…and the fourth is KEPT, not dropped — losing somebody's words is the one unacceptable outcome", JSON.stringify(r.unread));
  check(/named contact/.test(r.unread[0] || ""), "…with its text intact, so it can be given a title and saved", JSON.stringify(r.unread[0]));
  check(r.entries.map((e) => e.kind).join(",") === "hiccup,practice,lesson", "every kind is read", JSON.stringify(r.entries.map((e) => e.kind)));
  check(r.entries[0].title === "The weighting workshop ran twice", "the title is read", r.entries[0].title);
  check(r.entries[0].occurred === "1 August to 11 September 2026", "the period rides onto the entry", r.entries[0].occurred);
  check(r.entries[0].next_person === "Have the owner in the room.", "the fourth answer is read", r.entries[0].next_person);
  check(r.entries[1].did === "" && r.entries[1].came_of_it === "",
    "…and a block that answered two of four leaves the others EMPTY rather than borrowing the neighbour's", JSON.stringify(r.entries[1]));
}

section("2 · an assistant is asked for a shape, not held to a spelling");
{
  const r = split(`===
kind: Hiccup — it cost us a week
Title: lower case keys
what happened : spaced colon
WHAT_CAME_OF_IT: underscored
===`);
  check(r.entries.length === 1, "lower case, a spaced colon and an underscore all read", JSON.stringify(r));
  check(r.entries[0].kind === "hiccup", "…a kind with a sentence after it still reads as the kind", r.entries[0].kind);
  check(r.entries[0].happened === "spaced colon" && r.entries[0].came_of_it === "underscored", "…and both answers land in the right field", JSON.stringify(r.entries[0]));
}

section("3 · what it does with what it does not expect");
{
  let r = split(`===
KIND: musing
TITLE: An unknown kind
MOOD: reflective
WHAT HAPPENED: something
===`);
  check(r.entries.length === 1 && r.entries[0].kind === "lesson" && r.entries[0].kindGuessed === true,
    "an unknown kind falls back and SAYS it was guessed, rather than refusing the whole write-up", JSON.stringify(r.entries[0]));
  check(r.entries[0].happened === "something", "…and an unknown line is ignored rather than fatal", JSON.stringify(r.entries[0].happened));

  r = split(`===
WHAT HAPPENED: a block with no title at all
===`);
  check(r.entries.length === 0 && r.unread.length === 1,
    "a block with no title cannot be an entry — but it is KEPT, because a title is the one thing a person can add", JSON.stringify(r));

  r = split(`===
KIND: lesson
TITLE:   a title over
   two lines
WHAT HAPPENED: x
===`);
  /* §260's rule exactly: a run of whitespace CONTAINING A BREAK becomes one
     space, and ordinary spacing is left as typed. Written first as "collapse
     everything", which asked for something the product deliberately does not
     do — the CHECK was wrong, not the splitter. */
  check(r.entries[0].title === "a title over two lines", "a title that wrapped comes back as ONE line (§260)", JSON.stringify(r.entries[0].title));
  check(!/\n/.test(r.entries[0].title), "…with no break left in it at all", JSON.stringify(r.entries[0].title));
}

section("4 · the degenerate paste, which is the one that matters");
{
  let r = split("I talked for ten minutes and pasted the prose.\nIt has no rules in it at all.");
  check(r.entries.length + r.unread.length === 1, "prose with no rules becomes ONE thing, never nought", JSON.stringify(r));
  check(/ten minutes/.test((r.unread[0] || "") + (r.entries[0] ? r.entries[0].happened + r.entries[0].title : "")),
    "…and every word of it survives", JSON.stringify(r));

  r = split("");
  check(r.entries.length === 0 && r.unread.length === 0, "CONTROL — an empty paste is genuinely nothing, or 'never nought' would be meaningless", JSON.stringify(r));
  r = split("   \n  \n");
  check(r.entries.length === 0 && r.unread.length === 0, "…and so is whitespace (§246)", JSON.stringify(r));
}

section("5 · the shape the prompt actually asks for, end to end");
{
  const r = split(FOUR);
  const fields = ["kind", "title", "occurred", "happened", "did", "came_of_it", "next_person"];
  const missing = fields.filter((f) => !(f in r.entries[0]));
  check(missing.length === 0, "an entry carries every field the endpoint stores, so nothing is dropped between here and the save", JSON.stringify(missing));
}

console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
