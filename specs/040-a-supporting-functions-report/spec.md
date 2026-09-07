# 040 · A supporting function's report

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §242 · §48.1 · §51.10 · §53.5 · §59 · §96.2 · §96.4 · §104.10 ·
§105 · §113.8 · §118 · §172 · §191 · §215 · §224 · §244
**Constitution:** checked against v1.2.0 — Principles VI (follow what the
platform already does), IX (one copy of a rule) and XVI (a check that measures
the wrong thing passes).
**Related:** spec 010 (functions that plan in pillars), spec 039 (Reporting is a
tab), spec 035 (what Submit refuses), spec 032 (why the heal could not live in
the browser).

---

## 0 · Why this document exists

From a live client session: *"for the functions planning in pillars the key
objectives reporting wasn't done and the button of submit to smo was allowed and
the input there wasn't saved."*

**One report, three faults, each needing a different fix** — and the third of
them was silently discarding figures somebody had typed. It is the clearest
worked example in the project of what spec 010's format split costs when a rule
is asked **by prefix** rather than **by format**, and it had no spec.

All three were **reproduced on the shipped build before a line was changed.**

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · The submit gate was blind to the whole plan

`submitBlockers()` asked **by prefix**: every `fn:` target went to
`fnAskedItems()` / `fnReportedCount()`, which walk **capabilities**. A function
that plans in pillars has none — by construction — so the gate looked at an
empty list, found nothing owed, and **opened the button.**

Measured on Merchandising with every figure stripped:

| | the reporting page says | the submit gate says | the refusal |
|---|---|---|---|
| the pillars function | 0 of **10** entered | 0 of **0** | *(nothing in the way)* |
| a business unit, same state | 0 of 41 | 0 of 41 | *"41 figures still to enter."* |

> **§59's rule in the last place still asking by prefix**, and the same fault
> §224 fixed on the Present button: *the format decides, not the prefix.*

A pillars function's plan is unit-shaped, so it is asked the unit's question
through `unitLike()` — **exactly as its Report page already draws it.** The page
and the gate had been reading two different plans.

**It was never only the count.** `submitBlockers` reads its **rows** from the
same list, so the note rule (§105) and the In-progress rule (§104.10) had
**never once run** on this format either. With the fix, Merchandising's own demo
data immediately produces a real blocker it had never shown: *"2 figures are at
risk or off track with no note."*

**One reader — `subjectAsked()` / `subjectReported()`** — because the welcome
screen asks the same question one line before it asks this one and carried the
identical prefix test. *Two answers to "what does this subject owe" is how a
screen comes to disagree with the button on it* (§53.5).

**A pillars function is never also asked for capabilities**, and that is by
construction rather than by a rule here: the format cannot be switched while the
other side holds anything (§59), so the two lists are exclusive.

---

## 2 · A key objective added to a function had no id

Every *add a row* control in the product mints one — `addMeasure()`,
`addTactic()`, `addProject()`, and for a **unit's** objectives `koSettle()` since
§96.4. **The one behind `data-capkoadd`** — which serves a **capability** *and* a
**pillars function's Overview** — pushed `{name, dir, target, compile, weight,
actual, progress}` and **no id at all.**

So the reporting page drew that row's box carrying the string `"undefined"`,
`findById()` matched nothing, and the handler returned without writing —
**no error, no console, the figure gone.**

> §51.10 exactly: **the code that CREATES a field has to be found as well as the
> code that reads it.** A reader that crashes is loud; a writer that mints the
> wrong shape is silent until somebody opens the page that reads it.

**It is worse on a capability, and the schema is what says so.**
`cap_key_objectives.id` is a PRIMARY KEY, so a capability's id-less objective
could never be stored at all — that save **failed outright**, which is §172's
shape where one refused value then poisons every later save. A pillars function
keeps its objectives in `functions.extra`, which is **jsonb and holds anything**
— *which is precisely why these survived to be reported against and could not
be.*

Fixed with `mintRowId(h.list, (h.cap ? h.cap.id : h.target) + "-KO")` — the same
helper and the same **from the maximum, never from the count** rule (§96.2) the
other minters use.

---

## 3 · The rows already in a client's database, and why the heal is not in the browser

**The first build healed them at the hydration door**, beside `fnPruneNulls`
(§118), and **it was reverted.**

`lastSaved` is taken **after** hydration, so a minted id joins the save
**baseline** and never travels — while every later row edit is addressed **at**
that id, and `applyChanges()` resolves a row edit against the **stored** graph
and refuses one it cannot find (*"a row edit names a row that is not here"*),
which fails the **whole** save and takes unrelated work with it (§215, and
spec 032 §3).

> **A client-side heal of an identifier is a change the server never agreed to,
> made to the one thing every later message is addressed by.**

So the heal is **migration 039**, which is §191's own answer to the same fault on
the group's six objectives:

- it **fills only blanks**, never rewriting an id already written — that is what
  a reported figure, a focus mark and a cycle snapshot are keyed on (§48.1);
- it **continues past the highest already present** rather than counting from
  position, which is the duplicate §191 nearly shipped, *and a duplicate id is
  treated by the authoriser exactly like a missing one.*

---

## 4 · Proved able to fail

- **`checks/fn-report-gate.py`: 16 red** against the shipped pre-§242 build,
  among them `boxId: 'undefined'` — **the reported fault verbatim.** 0 after.
- **Two of its own assertions could not fail when first written** and were
  tightened: the id-uniqueness check **counted one row holding `undefined` and
  passed** (§113.8), and the gate/page agreement was measured on the demo's
  *fully reported* function, where a gate counting nothing agrees with a page
  counting ten (§94.2 — the state is stripped first now).
- **And the check crashed rather than failing**, which read as zero failures
  until it was guarded — §215's lesson paid again: **a throw is a failure.**
- **`scripts/test-ko-ids.js`: 15 assertions** against a real Postgres 16 — every
  blank named, an existing id and its figure untouched, `""` treated as an
  absence, the numbering clearing an existing `KO7`, other keys in `extra`
  surviving, a second run byte-identical, and the fault itself reproduced.
- **Round trip on a virgin database** with 039 in place: PASS.
- `test-authorize` 451/0 · `test-graph-diff` 126/0 · `submit-gate`,
  `fn-pillars`, `fn-ko-edit`, `gap-fill`, `objective-unit`, `welcome`,
  `report-saves` all green · full `qa.py` sweep clean.

---

## 5 · Requirements, as things that can be checked

- **R1** The submit gate and the reporting page count the same rows, on both
  formats — asserted as **agreement**, with the state stripped first.
- **R2** A pillars function's plan is asked the unit's question through
  `unitLike()`, never by the `fn:` prefix.
- **R3** The note rule and the In-progress rule run on every format.
- **R4** Every add-a-row control mints an id, from the maximum present.
- **R5** No id is ever minted in the browser after hydration.
- **R6** Migration 039 fills blanks only and is byte-identical on a second run.
- **R7** One reader answers *what does this subject owe*, shared with the
  welcome screen.

---

## 6 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| The gate, and the ids | §242 | `checks/fn-report-gate.py` |
| The heal, on a real database | §242.3 | `scripts/test-ko-ids.js` |
| Both formats draw one Overview | §211–§213 | `checks/fn-pillars.py` |
| The objectives editor | §226 | `checks/fn-ko-edit.py` |
| Submit's refusal | §221 | `checks/submit-gate.py` |
| Reporting reaches the stored plan | §183 | `checks/report-saves.py` |

---

## 7 · Recorded at the time, and since closed

§242 recorded that **the SMO's cycle board left pillars functions off
entirely** — `boardFunctionKeys()` filtered on
`!fnPlansInPillars(...) && capsOfFunction(k).length` — so the office could not
see whether such a function had reported. It noted their vocabulary is a
**unit's**, so they belong on the board's unit half.

**§244 closed it**, and §245 then corrected the placement at Islam's word:
*"merch and marketing and cf should be with functions not units"* — one band,
one list, the register's own order, with the format deciding only which builder
draws the row. `boardUnitTargets()` is the one list the rows and the headline
totals both walk, so the total can never disagree with what is drawn.

*Recorded here because a "recorded, not done" that was later done should say so
where the reader is standing, rather than leaving a live gap on the page.*

---

## 8 · Open, and recorded rather than done

- **`reportedCount` reads `actual` for every kind**, so a tactic reporting into
  `outActual` is never counted done (§257). It predates this and is measured as
  no worse for it; fixing it changes what Submit demands of every existing
  tactic, which is Islam's call.
- **A capability function's note boxes are still drawn with `want:false`**
  (§279), so on that side the box a refusal points at is not itself rung.
