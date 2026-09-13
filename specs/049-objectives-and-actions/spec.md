# Spec 049 · Objectives and actions — the third way a function plans

**Status:** BUILT · branch `claude/inspiring-lamport-pm0ki2` · §338 in
`DECISIONS-AND-LOGIC-v3.22.md`
**Asked for:** Islam, 2026-09-13 — *"we need to build the objectives and
actions"*, and the same day *"yes we need to fix that"* for the reporting
column (§337, built first and separately).

---

## 0 · Where this comes from

Islam, 2026-09-11, of the three shapes drawn for him in the platform's own
pages and signed off:

> *"the functional plans might be in the form of projects that they work on as
> functions and in the form of objectives and actions that we discussed
> earlier"*

and, of the model, 2026-09-11:

> *"each function has objectives like the measures we have and actions like
> tactics they work on that has due dates. and finally they have requirements
> from other functions and departments."*

The picture is settled: `design-mockups/function-plan-types/
2026-09-11_three-ways-a-function-plans.html`, panel three, **Objectives &
actions** — signed off with his own two questions answered in it (the three
names, and whether the owner column stays on actions).

§318 §5 wrote the model down and deliberately did not build it. §324 recorded
it as *"big enough to want a written spec first"*. This is that spec.

---

## 1 · The fault, in one sentence

A supporting function can plan in **pillars** or in **projects** and in nothing
else — measured: `fnFormat()` and `capFormat()` are ternaries that collapse
anything which is not `"pillars"` into `"projects"`, so a third value cannot
exist without moving those two functions, the minter and the render fork. A
function whose plan is a list of numbers it owes and a list of things it is
doing has to be forced into one of the two shapes, and both cost it something:
pillars invents a layer of grouping nobody agreed, projects invents deliverables
and milestones under work that has neither.

---

## 2 · The shape, and it is made almost entirely of rows the platform has

**An objective is the platform's own measured row.** `{ id, name, dir, target,
compile, actual, progress, weight }` — a supporting function has held exactly
that list since §213 (`keyObjectives`, drawn on its Overview), and
`measureScore()` already scores it, prorates it (§239), caps it at 150 and
reads its unit off the target (§199). **Nothing new.**

**An action is a milestone row with a date instead of quarters.**
`{ id, name, owner, due, status, pct, note }` — Not started · In progress with a
per-cent · Done, which is the product's own three words (§300, §104.10), with
the per-cent required when the status is the middle one. The date control is
§177's: a month and a year, **picked and never typed**.

**What is new is a function that holds them directly**, with no pillar and no
project in between.

### 2.1 · Where each is drawn

| | Overview | Plan | Performance | Reporting |
|---|---|---|---|---|
| **Objectives** | already there (§213) — the authoring table | — | the mockup's table and card | figures |
| **Actions** | — | the new authoring table | the mockup's table and card | status · % · note |

**The objectives are NOT a second list.** They are the `keyObjectives` the
function already holds, so there is one list, one door and one authoring
surface — a second list called objectives on one function is §87's twins, and
§211/§213 each cost a day undoing exactly that kind of per-format drift.

**The mockup is the PERFORMANCE page**, and reading it that way is what settled
the table above: its objectives columns are *Achievement* and *Progress* and its
actions columns are *Status* and *Progress*, which are reported values, under two
headline cards. It is not the plan.

### 2.2 · Two numbers, read separately

From the mockup, and it is the decision rather than an implementation detail:

> *"Actions are counted, not scored into the objectives. The two cards read
> separately, as they do on every other page: what was committed to, and
> whether the work happened."*

So **Objectives performance** is `koScore(keyObjectives, weights)` — the
function's own headline, unchanged — and **Actions** is a count done over a
count of actions, the shape `capExec()` already uses for milestones. Neither
feeds the other, and no existing score anywhere in the product moves.

### 2.3 · The owner column stays

The mockup asked and gave its own reason, which is the answer: **being named on
a row is how somebody gets to enter its figure** (§130.1, §147.7). Without it
every action would be the office's to report, which is the opposite of the point
of the format.

---

## 3 · What it is called

**Objectives & actions**, Islam's own words from the mockup's three names. The
stored value is a new key beside the two that exist; **`pillars` and `projects`
do not move** (§30.2 — a stored key renamed is a migration for a word nobody
reads).

---

## 4 · Settled, with the reasoning

1. **A requirement is NOT in this round.** §318 §5's third object is drawn at
   both ends — on the raiser's page and on the owing function's — and it is the
   one genuinely new thing in the model. Islam asked for *"the objectives and
   actions"* and the mockup he signed off draws those two. A round that reached
   further than what was drawn would be building against no picture (rule 1c,
   §316).
2. **Changing a function's plan type ARCHIVES the standing plan** — §318 §6.2,
   his *"archvied when type changes and create the new apprach"*. It replaces
   §59's flat refusal for this one transition, through the archive path §49.2
   and §22 already take, so it is restorable from Import & storage and no second
   archiving rule is written.
3. **The workbook grows an Actions sheet.** §22 is why this is not optional: an
   upload AUTHORS, so a column the file does not carry is a column the plan
   LOSES on a download-and-re-upload — and §295's bulk export would otherwise
   produce a complete-looking archive of such a function that cannot be
   restored. The Objectives sheet already exists (§213).
4. **Nothing is a counted gap that was not one before**, and nothing new holds
   Submit beyond what the row itself needs: an objective with no target is
   missing exactly as a measure's is (§249, §251), and an action that says *In
   progress* with no per-cent is not an answer (§104.10). A requirement would
   have been neither (§318 §6.1) and is not here to be either.
5. **The office's, to set.** Which way a function plans is a Setup decision and
   already is (`planFormatCell`, §326) — the control gains a third entry and
   keeps the tenant's own word for a pillar and the guard §318 §6.2 replaces.

---

## 5 · What the check must assert

- **Both ends, every time** (§94.2): a function set to this format draws the
  objectives and the actions AND draws no pillar rail and no project band; a
  function on the other two formats is measured byte-identical.
- **Every press read back off the STORED graph** (§96) — a table wired to
  nothing renders perfectly, which is the fault §96 and §219 each record.
- **The two headline numbers asserted as AGREEMENT** with the functions that
  compute them (§94.8), never as literals.
- **An action's date is PICKED** — the month panel, never a typed string, or
  `24/07/2026` reads as null in every comparison the platform makes (§177).
- **The state is MADE** (§255): the demo holds no function planning this way,
  so every assertion here would pass on a build that lost the feature.
- **The round trip closes**: the workbook out, back in through the real replace
  path, every field the same (§22, §294).
- **The archive on a type change is taken and is restorable** (§318 §6.2).
- **The server needed nothing and it is asserted anyway** (§172).

---

## 6 · Recorded, not done

- **Requirements**, per §4.1 — the model is in §318 §5 and waits for its own
  round.
- **A business unit planning this way.** The model admits it; no control does.
- **The dialog's undo and a real act** — §338.1 closes the row dialog on the
  switch. What it does NOT do is give `rowEditCancel` a way to undo an archive;
  no dialog can, and any other destructive act that later moves into a row
  dialog inherits the same rule: close it, or the snapshot is a revert waiting
  for somebody to navigate.

---

## 7 · Proved

- `checks/objectives-actions.py` — **47 passed, 0 failed**, ten sections, both
  ends throughout, with the progress workbook driven end to end (§294.4).
  Proved able to fail eight ways from the SOURCES (§276): the format layer
  **16 red**, the archive **1**, the three page branches **6**, §338.1's own
  line **15**, §338.2's two halves **1** each, and the progress route's two
  **1** each.
- `scripts/test-roundtrip.js` — a third format and a list of actions written to
  a real Postgres 16 and read back, with the table asserted to have **gained no
  column** and both keys DELETED on leaving the form. Proved able to fail by
  dropping `actions` from the extra blob.
- `test-authorize.js` **633/0** · `test-graph-diff.js` **140/0** ·
  clean parity, two tabs **21/0**, functional projects **18/0**, capability
  move, the incremental writer — all green on virgin databases.
- Neighbours: `fn-pillars`, `functional-projects` **45/0**, `capability-entry`
  **43/0**, `capability-remove`, `setup-arrange`, `fn-perf-controls`,
  `fn-ko-edit`, `import-page`, `template-round-trip` — all green; full `qa.py`
  ERRORS none; `tsc` clean with the cache removed first.
