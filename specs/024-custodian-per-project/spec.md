# 021 · A custodian per project

**Version:** v3.57 · **Decisions:** §147 · **Status:** answered; built

Islam: *"in a case of a function that has 2 projects each project has an
owner so the custodian here is not on the whole capability there is a
custodian per project. how can we make this work?"* Aligned in chat
2026-08-27; three decisions confirmed, the first with an addition: *"agreed,
and this needs to be in the access setup table if it's not."*

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

## 2 · The design

- **A project's owner is a Contributor of its function** — derived, never
  granted, exactly as a unit's Contributor is derived from being named on a
  plan line (§55, spec 006 §7.2). `namedInFn()` beside `namedInUnit()`, both
  through `namedOn()`; the floor arm of `personRoles()` reads `p.fn` beside
  `p.unit`.
- **The line is the project.** An owner reports every deliverable, outcome
  and milestone their project holds, and nothing beside it — not the project
  next door, not the capability's own key objectives, not the submission,
  the cycle note or the picture slides.
- **Governed by the existing cell** Contributor × *Own supporting function —
  Reporting* (`a_fn_own`), shipped default **view**; the SMO opens it to
  edit. Enforced on both sides: `canReportFnProject()` on the screen,
  `capProjectOf()` + `namedOn()` against the stored state in
  `lib/authorize.js`.
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
