# 021 · A custodian per project

**Version:** v3.57 · **Decisions:** §147 · **Status:** answered; built

Islam: *"in a case of a function that has 2 projects each project has an
owner so the custodian here is not on the whole capability there is a
custodian per project. how can we make this work?"* Aligned in chat
2026-08-27; three decisions confirmed, the first with an addition: *"agreed,
and this needs to be in the access setup table if it's not."* Then corrected
2026-08-28 (§147.7): *"contributor is not the right naming … these are 2
roles"* — the owner became a role of its own, **Pillar owner** joined it,
stakeholders became contributors, and contributors report nothing until
their row is opened.

---

## 1 · What is asked

1. A supporting function's projects each have an **owner**, and that owner
   should be able to act as the custodian **of their project** — the single
   function-wide custodian is too coarse where two projects have two owners.
2. Whatever grants this must be visible and governable on **Roles & access**.
3. Submitting the function's report stays with the function's custodian and
   its head (confirmed: point 2 of the alignment).
4. The project's Owner field offers **register people**, so the link is a
   real identity rather than a spelling (confirmed: point 3).

## 2 · The design (as corrected by §147.7)

- **Three bounded roles, all derived from being named, none grantable by
  hand.** A **Project owner** (`powner`) is named on a project's Owner row;
  a **Pillar owner** (`plowner`) on a pillar's, on a unit or a pillars
  function; a **Contributor** is anyone else the plan names — a
  collaborator, a stakeholder, a milestone's owner. Two conditions before an
  owner reports (Islam's words): the role's Reporting cell at edit, and the
  naming. No register attachment is asked.
- **The line is the thing named.** A project owner reports every
  deliverable, outcome and milestone their project holds; a pillar owner
  their pillar's measures and tactics; a contributor, once their row is
  opened, only the rows that name them. None of the three submits, writes
  the cycle note or adds picture slides.
- **Each role has its own row on Roles & access**, shipped at **view** —
  condition 1 is that the grant is made on the table. Enforced on both
  sides through one reach rule, `mayReportRow()`/`boundedReach()` in
  `lib/rules.js`, asked per row by the panes and by `lib/authorize.js`
  against the stored state.
- **The Owner field offers register people** — this landed twice in one
  day: §130.1 (another session, Islam's own wider ask) built register-picked
  owner NAMES on five plan fields with `namedOn()` taught every register
  spelling, and recorded the name-not-key decision. This feature rides that
  model whole; a keyed `ownerKey` variant was built first and removed at the
  merge, because a tactic's owner (already rights-bearing on units) matches
  by name and one question must not have two answers (§53.5). Residual
  recorded in §130.7 and §147.4: colliding short names over-match, renames
  part company with old plans.

## 3 · Repairs made on the way (found, not asked)

- The server had **refused a custodian's deliverable report outright** and
  the **milestone %** §104.10 requires, both classified as plan, since
  migration 024 — `REPORT` had no `deliverable` family and `milestone`
  lacked `pct`. Fixed; regression asserted by name.
- `reportState`'s own-lines guard skipped every `fn:` target (`!isFn`);
  `canSpeakFor()` now excludes own-lines people on functions too, so the
  Submit control, the note and the pending dot all agree with the rule.

## 4 · Proof

- `node scripts/test-authorize.js` §16 — derivation, world, custodian
  regressions, three allowed row kinds, five refusals, shipped-default
  nothing, unknown-name nothing, retired owner. Proved able to fail two ways
  (narrowing stubbed: 2 failures; derivation stubbed: 6).
- `src/checks/project-custodian.py` — the screen as both viewers, both ends
  against the shared rule, data asked after every press; state made, not
  found. Proved able to fail (gate flattened: 2 failures).
- Seed scanned: nobody's standing changes on the shipped tenant.

## 5 · Flagged, not built (§147.6)

- A **pillars** function derives no contributors (its rows go through the
  unit classifier, whose own-lines narrowing skips `fn:` targets).
- The reporting bar's **"View only"** pill still shows to a contributor with
  editable rows below it — same wording the unit side has always used; a
  wording change is a decision for both sides at once.
