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

*Amended 2026-08-20:* this principle previously required a static HTML mockup
before any visual or structural change. That belonged to the prototype era and
is retired; the alignment it protected is not.

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

## Development Workflow

- Specs live in `specs/` (spec-kit); each feature runs specify → plan → tasks →
  implement, honouring Principle I at every gate.
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

**Version**: 1.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20
