# Spec 062 — My reporting: the lines a tactic's owner enters

**Asked for** 2026-09-20 by Islam:

> *"If we'd like to show the tactics owners to report the progress of their own
> tactics. is that built?"*

Built as **§380**.

---

## 1 · What was there, measured before anything was proposed

It was not built, and the reason it looked as though it might be is that the
platform already holds two of the three pieces.

- **The plan names an owner on every tactic.** Measured on the worked example:
  **83 tactics, 0 without an owner.** The name is matched to the register by
  `namedOn()` — key, full name, typed short name, or any leading run of two
  words or more (§130.7).
- **Being named already means something.** A person named on a plan and holding
  nothing else derives the **Contributor** floor (§147.8), and a bounded role
  reaches only the rows that name them (`boundedReach`).
- **But nothing pointed either at the Owner column.** The figure-set machinery
  (§16.7 — `row.src`, `assigneeOf`, `sourceReporting`) walks a subject's key
  objectives and its pillar measures, and **never its tactics.**

So a tactic's owner who was not the unit's head or custodian either entered
nothing at all, or — where the tenant had opened the Contributor row — entered
their lines on the unit's own Reporting page, mixed in with everybody else's.

## 2 · What Islam decided, in his own words

1. *"the tab of what I report is not a room it a slice of reporting that's all
   in the same straety module"* — a **tab beside Reporting**, not a module and
   not a Setup page.
2. *"contributor should not report, the owner only."*
3. *"they can enter figures yes but they cannot submit"* — the note and the
   submission stay the unit's.
4. **Case 1** — an owner inside a unit he does not run: *"the figures on the
   reporting tab that belongs to him should be read only as well the only
   reporting way is his lines."*
5. **Case 2** — an owner of lines in a unit he does not belong to: *"no units
   appear in navigation. he sees his lines and all his lines can be tagged or
   filtered by the unit."*
6. *"the sense of saving that we do in the reporting already gives the feel of
   saving that locks the reporting with ability to open again"* — the lock
   §309 already built, per subject, per person.
7. *"align with me more not to ruin any access"* — nothing on Roles & access
   moves. One tenant switch, off by default.
8. *"My reporting is better"* — the name.
9. The welcome screen tells somebody their lines are waiting.

## 3 · The shape

- **One switch on the group**, `lineOwners`, stored as an absence (§50.6) and
  shipping **off**, so an untouched tenant is byte-identical to today.
- **One page key**, `c_mylines`, `area:"always"` — so it is not a matrix cell
  and nobody's grants move. The tab is drawn only where `myLinesHere()` says,
  which is the person's own place (§94.6's own resolver), so case 2 needs no
  navigation change at all: a foreign unit is a BAND on their page.
- **`myLineRows()` is `reportItems()` filtered**, never a second walk (§53.5).
- **One door**: `canEnterLine()` refuses an owned tactic anywhere but
  `where === "mine"`, which is case 1.
- **The server has its own kinds**: `lineReporting` (a figure, grouped by the
  tactic's owner and refused to anybody else BY NAME) and `lineDone` (the
  draft lock, yours alone), with `lines` joining `REVIEW_PER_TARGET` so the
  map travels per key rather than whole (§234).

## 4 · What was deliberately NOT built, and why

- **The narrowing does not reach any row but a tactic.** A branch in
  `boundedReach` reading *"with the switch on, a bounded role reaches only
  what it OWNS"* was written and taken out again: nothing reaches it for a
  tactic, so the only rows it could ever have narrowed are the other kinds —
  and narrowing those reverses §227, where Islam decided that being named a
  collaborator on a **milestone** is a reporting right. He asked about
  tactics. Measured: 704 and 53 assertions unmoved with the branch removed.
- **The office is not shown the welcome row.** They enter a tactic's figure on
  the unit's own Reporting page, which they already reach.
- **A projects-format supporting function contributes nothing**, because
  tactics live on pillars. Seven of the demo's eight functions are in that
  state.

## 5 · How it is checked

- `scripts/test-my-reporting.js` — the rules and the renderer, in a vm, with
  no browser and no database. **53 assertions, red six ways.**
- `scripts/test-authorize.js` §43 — the server. **Red eight ways**, including
  the dangerous direction (a stranger allowed).
- `SMP-Project-Folder/src/checks/my-reporting.py` — the presses. **Written and
  NOT RUN**: this sandbox has Chromium and no Playwright driver.
