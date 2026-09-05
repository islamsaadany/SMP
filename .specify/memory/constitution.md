# SMP Constitution

The Strategy Management Platform's house rules in enforceable form. Adapted from
`SMP-Project-Folder/CLAUDE-RULES.md` and the standing laws in
`DECISIONS-AND-LOGIC-*.md`; where the two disagree, the decisions document wins
and this file is corrected.

## Core Principles

### I. Align before building (NON-NEGOTIABLE)

Proposal → Islam's approval → then build. Never the other way. **A question is
not authorisation, and a question returned is not an answer** — if a choice put
to Islam comes back as a question of his own, the choice is still open: answer
it and wait. A feature already settled by a recorded decision may be built
against that record; anything new is agreed in words first.

**MOCKUP-FIRST IS PART OF THIS PRINCIPLE.** No visual or structural change —
layout, section order, styling, any visual element — is made without first
showing a static HTML mockup of the proposed look and getting explicit sign-off
on that view. The mockup is **published as an artifact, never handed over as a
file to download** (`CLAUDE-RULES.md` A17): it exists to be looked at, and a
file somebody has to save and open is a review that happens later or not at
all. The HTML still lives under `design-mockups/<feature>/<YYYY-MM-DD>_<desc>.html`
as the record of what was proposed, settled or rejected. There is no "build it
and review at the end" for visual work.

*Amended 2026-08-20, and REVERSED 2026-08-24:* this principle briefly retired
the mockup requirement as belonging to the prototype era. Islam reinstated it
two days later — *"the mockup needs to be always an artifact here not a
downloadable html"* — and it has been in force since. Recorded as a reversal
rather than overwritten (Principle II): the versions built in between made
visual changes under the weaker "describe it in words" rule, and that is why
the reversal exists.

*Corrected 2026-09-05:* this file went on carrying the retirement for eleven
days after it was reversed, while every feature in that period (§259, §261,
§266, §273, §278.2, §279) was in fact settled from a published mockup — so the
document specs are checked against said the opposite of what the project does.
`CLAUDE-RULES.md` A1 carried the same stale note and is corrected in the same
change.

### II. The decisions document is the contract

`DECISIONS-AND-LOGIC-vX.Y.md` records every decision with its reasoning.
Reversals are recorded as reversals, never silently overwritten. Anything
agreed but not built goes into the document immediately. If a decision changes,
it changes there first and every screen, spec and Info panel follows. Code that
contradicts the document is a defect in one of the two — say which.

### III. Edit the sources, never the built file

`src/` is the platform; `strategy-management-platform-vX.Y.html` is its build.
`python3 build.py` must reproduce the shipped file byte-identically. Every
change is made in `src/` and verified by rebuilding; a build that is not
byte-identical to what is shipped means something is out of step and stops the
line.

### IV. Verify by walking, not by eye

`python3 qa.py` (or its environment-adapted runner) walks every page as every
viewer and asserts no console errors, after every change. Measurements beat
impressions: report numbers, not "it fits". A defect found in Claude's own work
is reported plainly, not fixed quietly.

### V. Derived, never stored; null is never zero

Every score is computed from the items beneath it — a row and its expansion
cannot disagree. A missing number is absent from every average, never counted
as zero. One band function produces both the colour and the status word.
Cleared means unreported. These rules are load-bearing; no feature may
reintroduce a typed score or a zeroed blank.

### VI. Follow what the platform already does

Before building anything new, read how the platform already solves the same
problem — same table, same card, same colour for the same meaning — and follow
it. Two screens doing the same job are the same screen with different content.
New patterns only where the thing is genuinely new, and the difference stated.

### VII. Version in the filename, never in the app

`strategy-management-platform-v1.9.html`, `DECISIONS-AND-LOGIC-v1.9.md`. Minor
for a batch of changes, major for a structural one. Nothing on screen.

### VIII. Islam decides content; Claude builds capability

Names, labels, values and navigation entries are Islam's choices. Fields are
built empty, never seeded with a guess. Demo data is labelled invented, in the
product and in the document, and never reaches a client.

### IX. One copy of a rule, run on both sides (NON-NEGOTIABLE)

A rule the browser uses to decide what to OFFER and the server uses to decide
what to ACCEPT is written once and shared — `lib/rules.js`, `lib/audience.js`,
inlined by `build.py` and required by Node. Two copies drift, and the drift is
silent in the worst way: a screen that offers an edit the server then refuses,
or a list of recipients the page showed and the server did not send to.

### X. The server decides; the browser only draws

Every save is authorised on the server, **against the STORED world, never the
incoming one** — a save authorised against the state it is writing can grant
itself the role that authorises it. Every classifier falls through to
*unknown*, and an unrecognised change is the SMO's: a field added later is
guarded the day it is added, not the day somebody remembers. A control that
only hides itself is decoration. The browser sends criteria, never conclusions.

### XI. A record a save can erase is not a record

`POST /api/state` TRUNCATEs the state graph's tables CASCADE. Credentials,
sessions, declarations, the change log, login attempts, feedback, sent messages
and drafts therefore live **outside** it, and with **no foreign key to
`people`** — deleting somebody must not take the record of what they did or
were sent. Anything that must outlive a save goes in its own table.

### XII. A reader never creates what it was looking for

An accessor returns a shared **frozen** empty rather than building a container;
the writing half is a separate function; removing the last item deletes the key
again. A reader that mutates what it reads is caught by whoever compares before
and after — and until then every save carries a phantom change.

### XIII. A colour that works as a fill fails as type

Scoring and accent colours are **marks**, not words: each has a `-tx` twin for
text, every surface with its own ground needs its own ink, and ink over a
tenant-set colour is DERIVED rather than assumed. Measured against the ground it
actually sits on — a token checked against the most generous background it ever
meets is checked against the case that was never in doubt. Seven occurrences
before this became a law.

### XIV. A class name is one global namespace

A one-word class that reads naturally in two places will eventually be written
in both, and the collision is silent: both names valid, both scopes real, and an
element wearing somebody else's rules. Component classes are prefixed or
compound. Three occurrences before this became a law.

### XV. Typing never repaints, and a repaint never moves the page

A handler that rewrites the DOM must not run in the middle of an interaction
with it. Search filters rows in place; a field mirrors its value without
redrawing. Where a repaint is genuinely needed — a row added, a role given — it
restores the page scroll, every scroll box inside it, and the caret, **in the
same frame**: drawing at the top and then moving is the same jump, only quicker.

### XVI. A check that measures the wrong thing passes

Assert the contract, not the appearance; make the label say what was actually
scanned. After renaming a field, grep the old name across every source. When a
control changes shape, grep the checks for the old selector. **Prove a new check
by breaking what it guards** and watching it fail — a check that asks whether it
can run is a check that skips in silence while the suite reports green.

## Development Workflow

- Specs live in `specs/` (spec-kit); each feature runs specify → plan → tasks →
  implement, honouring Principle I at every gate. **Every feature gets a spec
  before it gets code** — a numbered folder under `specs/`, naming the decisions
  document sections it implements, and checked against every principle here.
  Work already built without one is backfilled when it is next touched, so the
  gap closes where it matters rather than as an exercise.
- Every editable field binds to a setter; an unbound input is a bug by
  definition.
- The navigation owns `.units`, `.tabs` and `.prow` — prefix new component
  classes.
- A handover sends two things: the loose platform HTML, and the full
  `SMP-Project-Folder-vX.Y.zip` with README, rules, decisions, src and mockups.

## Governance

This constitution restates the working agreement between Islam and Claude; it
amends only when that agreement does, recorded in `CLAUDE-RULES.md` and the
decisions document in the same change. All specs, plans and reviews verify
compliance against it.

*Amended 2026-08-24 to 1.1.0:* principles IX-XVI added. None is new — each is a
law the work earned by breaking it, some of them repeatedly (XIII seven times,
XIV three, XVI four), and each was recorded only in the decisions document where
a spec review would not meet it. A principle is where a rule goes once it has
cost something more than once.

*Amended 2026-09-05 to 1.2.0:* Principle I corrected to carry mockup-first,
which Islam reinstated on 2026-08-24 and this file had gone on denying. Nothing
new is decided here — the correction brings the constitution back into step with
`CLAUDE-RULES.md` A17 and with what the work has actually been doing. Recorded
in the same change: this file was edited on 2026-08-31 (§214.3, removing a line
whose wording was unsettled) without a version bump or an amendment note, which
this section requires; that edit is acknowledged here rather than backdated.

**Known and not decided here:** `CLAUDE.md` rule 1b-ii (2026-08-27, no grey
descriptions under page and section headings) is a standing rule with no
principle. Whether it becomes one is Islam's call, not a tidy-up.

**Version**: 1.2.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-09-05
