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

---

## 6 · §385 — one question, and it is "do I run this one?"

Islam, correcting §3's one-door rule two days after it shipped: *"we need not
to confuse the custodian with the tactic owner … the custodian should have
always access to their unit or function entry except in one case when we set
figure sets … my reporting appears for tactics for units or functions she is
not the custodian or the owner."*

**One question is asked per subject and its answer decides both halves at
once** — where somebody types, and whether they get a second screen for it:

| | the unit's own Reporting page | My reporting |
|---|---|---|
| I run it, and the line is mine | **I type it** | no tab for this subject |
| I run it, the line is somebody else's | I read it | — |
| I run it, the line names nobody the register holds | **I type it** | — |
| I don't run it, the line is mine | I read it | **I type it** |

**"Do I run it" is the GRANT, never a list of role names.** `canReport()` is
*may I enter figures for this unit at all*, so a custodian whose Reporting
cell the office has narrowed to `view` falls to the other branch and types
their own lines on My reporting, rather than being told they run a unit they
have no way to report on (§61). On the worked example the two readings answer
identically; what differs is a tenant that has narrowed a cell, where only
this reading leaves somebody a door.

**A name that reaches nobody is not an owner.** `lineOwned()` asks whether the
plan NAMES somebody; `SMPRules.lineOwnerIsHere()` asks whether the register
holds them — and on the worked example **83 tactics name an owner and only 51
name a person**, because a plan is typed by a custodian and a register is
filled from HR. Classified as its owner's, such a row is refused to everybody,
since there is nobody to be them. It falls back to the unit exactly as it was
before the switch was turned on, on the screen and on the server, through one
predicate (§42).

**The register rides the world** (named in `W()` AND in `worldOf()`, §102.4's
own instruction for the third time), which is the guarantee rather than the
line count: the server builds its world from the STORED state, so a save
cannot put somebody on the register and claim their line in the same request
(§42.2).

**What it moves, measured:** 83 tactics name an owner · 51 name a person · 49
of those are owned by somebody who also runs that subject, and lose a second
screen · **2 reach My reporting**, one person · 32 name nobody and go back to
the unit.

## 7 · §385 — and §382's Tactic owner row comes off the table

§382 added a **Tactic owner** row to Roles & access on Islam's ask, shipped at
*none* everywhere. It lasted two days; shown two drawn options he picked
**A — the switch decides, and the row goes.**

- **The two controls answered one question and could disagree about it.**
  Measured across the four states, the row is not consulted at all while the
  switch is on — and the switch is what a tenant turns on to mean *owners
  enter their own lines*. So the row could only ever say no to something the
  switch had just said yes to; and it ships SHUT, so a tenant turning the
  switch on would have found owners typing on a row they had never opened.
  The merge that brought §380 and §382 together recorded that contradiction
  and left it for Islam rather than picking one (rule 1b). He picked.
- **Removing it moves nobody: 33 people × 36 page keys × 21 targets = 24,948
  answers from `grantAtPage`, 0 changed** — the two companies included, because
  a company CEO's reach is resolved per target (§37). A tactic's owner is
  `namedInUnit`,
  so the Contributor floor covers them exactly as it did before §382 — which
  is where the role came from in the first place.
- **The floor's exemption goes with it.** §382 had to exclude its own role
  from `!out.length`, because a role granting nothing would have taken away
  the floor it stood on. The test is `out.length` again.
- **`ctx.tacticOwner` goes too** (§24), at all four sites that were taught it.

Recorded as a reversal rather than overwritten (Principle II): §382's reasoning
is right that a tactic's owner derived nothing anybody could see on the table,
and what changed is that the switch turned out to be the visible control.

## 8 · How §385 is checked

- `scripts/test-my-reporting.js` §3b/§3c — the four states, the unmatched
  name, and the role's removal with the floor it stood on put back (the one
  claim carried out of the deleted `scripts/test-tactic-owner.js`, §218).
  **65 assertions, 0 failed.**
- `scripts/test-authorize.js` §43 — the server, both ends. **709 assertions**,
  and the §385 pair proved able to fail: with `lineOwnerIsHere` taken out of
  `addOwnedTactics`, **2 red**.
- `SMP-Project-Folder/src/checks/my-reporting.py` §8/§9 — the presses and a
  sweep of every line owner. Proved able to fail **three ways from the
  SOURCES** (§276): the unit page refusing an owned line to its runner **2
  red**, a name that reaches nobody treated as an owner **1 red**, a subject
  I run still drawing rows on My reporting **1 red**.
- `scripts/test-tactic-owner.js` is **deleted**: its whole subject was the
  role (§24).
