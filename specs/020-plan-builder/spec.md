# 020 · Building a plan on the platform

**Version:** v3.41 · **Decisions:** §118 · **Status:** answered; built

Islam: *"I want the team of the SMO to be able to build a plan on the platform
directly. so they identify a function or a unit and set which way are they
going to plan pillars or projects and then they go in a flow of building the
plans on the platform."* Refined over two mockup revisions
(`design-mockups/plan-builder/`): *"the SMO might not build in that sequence —
he might jump to a certain area in the sections of the plan"*, and *"the build
up should be in boxes that respect the outcome structure … the template should
protect the structure of the outcome."*

Settled from the revision-2 mockup, confirmed 2026-08-26.

---

## 1 · What is asked

1. A plan can be **built directly on the platform** — no file — for a business
   unit or a supporting function, chosen or **created** at the start.
2. Only a function is asked *pillars or projects* (a unit always plans in
   pillars); the question uses the existing `format` switch, asked at birth.
3. The flow is a **map, not a march**: every section of the plan is directly
   openable, in any order; the left-to-right order is a suggestion.
4. Every row (objective · measure · tactic · pillar · project · deliverable ·
   outcome · milestone · clause · SWOT line) is added through a **form asking
   that row kind's fields in the outcome's order** — the template protects the
   structure. Only the name is required; anything else left empty is named in
   an amber line before the row lands, and reads as missing after.
5. The plan is **live while it is built** — no draft flag, no stored progress;
   the band's chips are derived from the plan itself.

## 2 · The shape

- **The door**: *Build a plan* beside Upload on Setup › Import & plans (the
  page where plans arrive; office-gated as the page is). The chooser lists
  units and functions with an honest status, offers **Continue** on a subject
  with content and **Start fresh** behind a confirm that archives first
  (`clearUnitPlan` / `clearFunction` — the import's own path, §49.2), and
  creates a new unit (`addBusinessUnit`, now name/prefix/company-parameterised)
  or function (`addFunction`, format asked) in place.
- **The band** (`#buildband`, outside the sticky chrome): one chip per section
  — unit: Foundation · Objectives · SWOT · Pillars · Review; projects
  function: Definitions · Objectives · Projects · Review; pillars function:
  Pillars · Review. A chip opens its section with the pen on. Chip marks read
  the data: ✓ filled, count so far, ○ empty. Pause leaves (mode dropped,
  nothing stored); Finish opens the review.
- **The forms**: `bformDef()` in `src/builder.js` declares one field list per
  row kind; rows are applied through the pen's own minters
  (`addPillar`/`addMeasure`/…/`koMint`) so the two paths cannot drift, and the
  vocabulary is the pen's own `selectOr` lists. *Add & add another* keeps the
  form open. The shell (`shell.html`) owns the dialogs and navigation;
  `builder.js` owns state, HTML and data logic.
- **The review**: rows restating the chips' own marks plus gaps counted from
  the data (targets missing, tactics due in no quarter, projects with neither
  deliverables nor outcomes, …). Not a gate — finishing closes the band and
  nothing else.
- **The server needs nothing new**: every edit is a plan/setup change the
  authoriser already classifies; a new unit or function is the office's by
  the unclassified-change rule.

## 3 · The empty-state audit (part one of the build)

The editors were built for correcting an imported plan; from a truly empty
subject, five surfaces could be read and never started. All fixed:

1. "Who we are" — no way to add or remove a line, lead never editable
   (unit AND group foundation).
2. SWOT — no way to add or remove a line in any quadrant.
3. An empty unit's Plan page — a dead end pointing at Import; now offers the
   first pillar to whoever `mayEditPlan()`.
4. A **virgin** pillars function — `unitLike()` hands frozen empties, so the
   first add wrote into an array the function never held; the rowadd handler
   uses `unitLikeWritable()` now.
5. A capability's key objectives — readable on the function's Overview,
   writable nowhere; `capKoEdit()` behind the page's pen, plus "+ Add a
   capability" there and on the empty-function note.

Also found on the way: the Business units page's "+ Add a business unit"
minted "New unit 1"/prefix NU/`real:false` with hardcoded factor keys — it now
asks the builder's form, mints the key from the name, marks the unit as the
client's own, and mints the weighting row from the factor list (§104.7).

## 4 · What proves it

`src/checks/plan-builder.py` — the door; the chooser's statuses asserted to
AGREE with `builderHasPlan()`; a new unit built end to end with every row
added through the forms and asserted IN THE DATA (§96's question); the
projects route from a function that did not exist; Escape writing nothing;
the band hiding for a viewer `SMPRules.mayAuthorPage()` refuses and returning
via Continue; starting fresh archiving with its reason. Proved able to fail
twice (§94.5) — and the second proof caught the check itself (a substring
"agreement" that a lying chip satisfied; it compares the chip's mark now).

## 5 · Deliberately not in this module

Units planning in projects (functions only — settled). Draft visibility
(live immediately — settled). Templates or pre-filled plans. Any change to
the xlsx import. A key-objectives authoring surface for a **pillars
function** — no page shows them today (the Overview says its foundation is
the parent's), so giving them a surface is a decision, flagged not assumed.
