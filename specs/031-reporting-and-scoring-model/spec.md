# 031 · How a figure is scored

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §5 (the original model) · §35 · §199 · §239 (+.1 –.6) · §243 ·
§248 · §249 (+.2 –.4) · §250 (+.1, .2) · §251 · §254.2 · §257 (+.2 –.3) ·
§264 (+.1, .2) · §276 · §277 · §278 (+.2, .3)
**Constitution:** checked against v1.2.0 — Principles V (derived, never stored;
null is never zero), VI (follow what the platform already does), IX (one copy of
a rule, run on both sides) and XVI (a check that measures the wrong thing
passes) carry the weight here.

---

## 0 · Why this document exists

The scoring model is the part of SMP a client's judgement of its own business
rests on, and it is the part with no spec. It was built and rebuilt across
**fourteen decision sections in five weeks** — proration, the review point,
tactic outcomes, units on a target, yes/no targets, whole counts, monthly plans
— each of them correct, each recorded, and none of them anywhere that answers
the question somebody actually has: *given this row, what number does the
platform put on it, and why that one?*

That answer currently requires reading fourteen sections in the order they were
written, several of which reverse or narrow the ones before them. This document
is that answer in one place, written from the code rather than from the log, and
traced back so the reasoning stays reachable.

**It changes nothing.** Where this document and the product disagree, the
product is right and this file is the defect (Principle II's rule, applied to a
spec rather than to a screen).

---

## 1 · What carries a score

Four kinds of row are scored by one arithmetic:

| Row | Where it lives | Notes |
|---|---|---|
| A **key objective** | a unit, the group, a supporting function, a capability | weighted (§243) |
| A **key measure** | inside a pillar | the ordinary case |
| A **tactic's outcome** | inside a pillar's tactic | added §248; measured against the tactic's own window (§250) |
| A **deliverable / outcome / milestone** | inside a capability's project | its own family, out of scope here (§99, §104.10) |

Every one of the first three carries the same five facts, which is what lets one
arithmetic serve them: a **direction** (`≥` or `≤`), a **target** (a number and
a unit, in one string — §199), a **compile rule**, an **actual**, and — since
§278 — an optional **monthly plan** of twelve numbers.

---

## 2 · The one arithmetic

`measureDue(row, share)` answers *what is this row measured against right now*
and `measureScore(row, share)` answers *what does it score*. Both live in
`src/config-data.js`; the rules they lean on are in `lib/rules.js`, which is
inlined into the platform and required by the server, so screen and save can
never answer differently (Principle IX).

**PRORATE THE TARGET, THEN COMPARE — never the ratio.** Dividing a score by the
elapsed share is right for *more is better* and exactly backwards for *less is
better*, so the share goes onto the target and one expression serves both
directions (§239).

`measureDue` in order, and the order is the specification:

1. No target → **null** (nothing to measure against).
2. The target's unit is `Y/N` → **null** — it may still be *carrying* a number
   (§257.2 keeps the figure when you switch), so the test is the unit and never
   "can a number be found in this string".
3. The target holds no number → **null** (§251 lets a unit be picked before the
   number, so `"%"` is a real intermediate state and is not scorable).
4. **A monthly plan answers first** if all twelve months are set and the review
   point is readable (§278) — it supersedes the flat share *and* a supplied one.
5. Otherwise: the target's number, prorated by the share **only if the compile
   rule prorates**.
6. A `Count` is floored to a whole one, with an epsilon (§276).

`measureScore`:

1. `Y/N` → **100, 0, or null if unanswered** (§257).
2. Due is null or **nought** → **null**. Not scored, and that is not a failure:
   a row whose own monthly plan asks for nothing this month has not been asked
   yet (§278).
3. The actual is not a number → **null**.
4. `≤` with an actual of **0** → **150**, the cap. Nought on a *less is better*
   measure is the best possible answer, and a guard written to avoid dividing
   by zero had been turning it into *Not scored* (§239.4 — found on Islam's own
   `Data duplicate rate ≤ 1%, 0%`).
5. Otherwise `(≤ ? due/a : a/due) × 100`, clamped to **0–150**.

---

## 3 · The four compile rules

`SMPRules.COMPILES` = **Sum · Count · Latest · Average**, named once and read by
the four pen pickers, the plan builder, the workbook's validation ranges and the
upload's refusal — because adding a fifth value to seven copies is how one gets
missed (§276).

| Rule | Means | Prorates? | Whole units? |
|---|---|---|---|
| **Sum** | accumulates across the period | yes | no |
| **Count** | Sum for things finished one at a time | yes | **yes** — floored |
| **Latest** | a rate or share at a point in time | no | no |
| **Average** | already normalised | no | no |

**Latest and Average do not prorate and that is a decision, not an omission**
(§239): with no baseline stored, prorating them would invent a glide path
nobody agreed. §278 is what legitimately lifts it — a monthly plan *is* the
stated glide path, so where one exists it is used whatever the compile rule.

**Count is a fourth rule and not a change to Sum** (§276). Rounding Sum whenever
its target looked whole would move stored scores on every integer Sum target
already planned; 0 of 122 demo rows carry Count and every existing row prorates
exactly as before, asserted.

**The epsilon is not decoration.** `7 × (3/12)` is `1.7499999999999998`, so a
raw floor owes one fewer on precisely the month a whole unit falls due:
`Math.floor(due + 1e-9)`.

---

## 4 · The review point

Proration needs to know how far through the year we are, and **it is a month,
not a quarter** (§239.1): `REVIEW.asOfMonth`, riding `review.extra`, so no
migration. Set when a cycle opens and editable mid-cycle.

Two rules that were each learned the hard way:

- **It falls back to the cycle's end quarter when unset**, so nothing moved on
  any tenant until the office set a month, and it **never writes** (§42, §50.6 —
  a reader that creates what it looked for puts a phantom change into every
  save).
- **It carries its own year** (§239.3). `"Aug 26"` states the year; the first
  build threw it away and asked `cycleYear()`, which scrapes four digits out of
  the cycle's name — a cycle called *"Annual Plan / Jan / Dec"* has none, so the
  share came back null and **everything silently fell back to the whole year
  with the month plainly set**. Shipped and reported within the hour.

The strip says what the month means (*"· 8 of 12 months"*), and unset it says
*"taken from the cycle's end"* rather than crying Missing over a working
fallback (§214.4).

---

## 5 · A target is a number and a unit, in one string

There is no unit field. §199 put the unit **on** the target
(`"1.6B EGP"`, `"75%"`, `"6 #"`), read back by `targetParts` / `targetUnitOf`,
which is why a unit costs no migration and why several later decisions are
shaped the way they are.

- **The unit may be held alone** while a number is typed — `"%"` on the way to
  `"90%"` (§248 for a tactic's outcome, generalised to every target by §251 at
  Islam's instruction: *"all 4 places"*).
- **A target holding only a unit is still Missing** — non-blank and unusable —
  so `targetHasNumber()` is asked by the gap count, the score and Submit's
  refusal alike, or a row is counted as missing while quietly being scored
  (§249.2).
- **Prose is the guard**: anything that is not a unit the picker *offers* is
  kept exactly as typed, or a target reading *"Maintain share"* would be read as
  a unit nobody chose (§96.2, §199.4).
- **A scaled currency is one token wherever it is drawn** — `6.2M EGP`, never
  `6.2 M EGP` — display only, with the stored value untouched unless it is
  re-entered (§254.1).

---

## 6 · A target that is a yes or a no (§257)

Some rows are not measured — a certification achieved, an agreement signed. They
had no way to be written, so they sat blank, wore the red *Missing* for ever and
refused Submit with nothing anybody could fill.

**`Y/N` is a unit, not a second field**, which is the whole of why it costs no
migration. Both product decisions are Islam's, taken before anything was built:

- **100 or 0**, so a yes/no row counts in every average like any other.
- **Silence is not a no** — unanswered scores null and leaves every average
  (§35: absent is never zero).

The direction and the compile rule are **drawn and `disabled`** alongside the
dimmed target, never merely dimmed (§220) and never removed — a hole among equal
boxes reads as a control that failed to render — while **the unit picker stays
live, being the only way back out** (§61). Switching to `Y/N` **keeps** the
number beside it (`100 Y/N`), so changing your mind costs nothing (§257.2,
Islam's own correction of the first build, which destroyed it).

---

## 7 · A tactic's outcome, and its own window

§248 gave a tactic an **outcome** with a direction, a target and a compile rule,
*"so it can be reported in the reporting and measured in the performance
accordingly"*. It is **shaped as a measure on purpose**, so the one arithmetic
serves it unchanged.

**The figure is its own field, and that is the whole migration story.**
`t.actual` has always meant *% delivered* and is what `pillarExec` averages and
`figuresSnapshot` archives — an outcome's number in that box would make a tactic
at 45 read **750%** against `≥ 6 #` the moment a target was set. It reports into
**`outActual`**; the five new fields ride in `extra`, so no migration and no
schema change, and every closed cycle reads as it did.

**The switch is per tactic, when a human types**: a tactic is asked and scored
the old way until its outcome has a target (§254.2 narrowed this from "a target
AND a figure" — a figure reported before the target was added would otherwise sit
in the old field for ever while the benchmark switched under it). Proved, not
argued: 19 subjects read off the build before and after, byte-identical.

**§250 — the window.** A tactic marked Q2–Q3 runs April to September, so its
outcome is measured against **six months, not twelve**. `measureDue` takes an
**optional share**: a key objective and a pillar measure pass nothing and read
`elapsedShare()` exactly as before; a tactic's outcome passes `tacticShare(t)`.
A second `outcomeDue()` would be two definitions of proration drifting apart the
first time either is corrected.

- **It is an exact fraction, never the rounded per cent** — 83/100 is not 5/6,
  and the first draft made a target of 12 read `9.96`.
- **Absent and null both mean the year**, so a tactic naming no quarters still
  scores.
- **§250.1 nearly shipped a silent disaster**: `pillarPerf` mapped
  `measureScore` **point-free**, and `Array.map` hands its callback the index —
  so the first measure of every pillar would have been prorated by 0, the second
  by the whole year, the third by twice it, wrong only for `Sum` rows. Measured:
  one pillar 100 → not scored, another 83 → 65. **Adding an optional parameter
  is a change to every place that function is passed by name.**

---

## 8 · A target with a shape of its own (§278)

*"Targets proration is always flat acorss the year but some targets have
seasonality so the proration is not valid."* The argument is one row of Islam's
own plan: Accessory revenue, 300M EGP, 96M reported at June — **64% behind**
flat, **100% on plan** against its own shape.

Twelve numbers in the target's own unit, compiled by the row's own compile rule.
**Nothing new is invented**: the compile rule already says how to read twelve
numbers, so Sum adds the months that have passed, Average takes their mean,
Latest takes the month being stood in.

- **A typed 0 is a real month and a blank is not** — Islam's own correction, and
  the whole of the arithmetic. `Number("")` is 0 *and finite* (§104.10), so a
  truthiness test reads seven empty boxes as seven planned noughts and cuts the
  year by more than half.
- **In force only when all twelve are set.** A half-filled plan is stored, says
  so in the warning ink, and leaves the annual box authored and live (§61).
- **The monthly plan becomes the target** (Islam's (a)), so the deck, the
  workbook, the archive and the Focus board are right without being taught
  anything. The normalised-shape alternative was drawn and refused: months
  adding to 1.05B under a 1.0B target stop matching what was typed.
- **No migration** — it rides `extra`, proved by round-tripping one on all three
  shapes against a real Postgres rather than claimed (§172's lesson).
- **The workbook gains twelve columns, appended**, because a validation range is
  a POSITION (§65).

---

## 9 · Derived, never stored

Principle V, and it is what makes every section above safe to have shipped:

- **`m.progress` never moves.** It goes on holding the raw
  actual-against-annual ratio, so every archive and every closed cycle reads as
  it did and nothing is migrated. `measureScore` is computed.
- **The Focus board reads the raw figure on purpose** (§239): reward stays a
  year-end judgement. Asserted at both ends, or a build that swept every reader
  would pass everything else.
- **A missing number is absent from every average, never zero** (§35), and
  *Not scored*, *Nothing due yet* and *Not asked* are three different sentences
  the product says in three different situations (§276, §250).

---

## 10 · Weights, and the summaries

**A blank weight is never nought** (§243): it counts as the average of the
weights that were set; if none were set every objective counts equally; and
every set weight being zero falls back to equal rather than to a dash. Before
that, `koScore()` read `weights[i] == null ? 0`, so a subject where every
reported row was unweighted totalled nothing and the headline returned null.

**A summary is made of the number it summarises** (§264). §239 made the score
derived and moved every reader that AVERAGES, leaving every reader that
SUMMARISES holding `m.progress` — so a row read headline **90%**, Progress
**90%**, and Highest/Lowest **60%**, all three arithmetically correct, of two
different questions. Seven cells: three Highest/Lowest pairs and four breakdown
tables, each of which opens *from* a headline to explain it.

`scoreSpread()` is handed **the very list the average was taken over**, so a
card cannot name a row its own headline left out. And `measureScore` is
**wrapped, never passed by name** — §250.1's trap, and this is exactly its
shape.

**It shipped because only `Sum` prorates**, so on a plan compiled by `Latest`
the two figures are byte-identical: 30 rows in the worked example, every one of
them Sum.

---

## 11 · A reported figure follows the target's unit (§277)

*"the YTD is showing 2% from 2# I don't know where this error is happening."*
Not the arithmetic. The reporting box stamps a typed number with the target's
unit **at that moment**; the office later changed the target from `%` to `#`,
and nothing told the figure.

`actualFollowsUnit()` is the one function both writers call:

- **The platform's own stamp follows** — a figure whose unit is *exactly* the
  one the target just left is rewritten in the new unit, with the target's own
  separator.
- **A person's does not.** Any other unit was typed (§243) and stays.
- **The first unit is not a change** (§201.2: a filler may not write a figure,
  so following there would cost the whole fill's save — §184).
- **Y/N is neither side** (§257), and **a unit cleared is not a unit changed**.

Cost stated before it was chosen: a row already stored keeps `2%` until
re-entered once; a one-time heal was offered and not taken up.

---

## 12 · Requirements, as things that can be checked

- **R1** One arithmetic serves key objectives, key measures and tactic
  outcomes; a second `outcomeDue()` is a defect.
- **R2** The share is *supplied*, never re-derived by the caller.
- **R3** `m.progress` is never written by any of this.
- **R4** A monthly plan supersedes both the flat share and a supplied one.
- **R5** A blank month is not a nought; a typed 0 is.
- **R6** `Count` floors with an epsilon; `Sum` does not floor at all.
- **R7** A `Y/N` target scores 100/0/null and is never given a due figure.
- **R8** A target holding a unit and no number is Missing everywhere — the
  count, the walk, Submit's refusal and the score all agree.
- **R9** The Focus board reads the raw stored figure, not the derived score.
- **R10** `COMPILES` is the single list; the pen, the plan builder, the workbook
  and the upload all read it.

---

## 13 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| Proration, review point, `≤` at nought | §239 (+.1 –.6) | `checks/ytd-proration.py` |
| Weights, deck, blank weight | §243 | `checks/deck-and-weights.py` |
| Tactic outcome | §248 | `checks/tactic-outcome.py` |
| Outcome and target are owed | §249 | `checks/gap-fill.py`, `submit-gate.py` |
| The tactic's own window | §250 | `checks/tactic-proration.py` |
| Unit before number | §251 | `checks/unit-before-number.py` |
| Benchmark on the slide | §254 | `checks/deck-figures.py` |
| Yes/No target | §257 | `checks/yn-target.py` |
| Highest/Lowest and breakdowns | §264 | `checks/measure-score-spread.py` |
| Count compiles in whole ones | §276 | `checks/count-compile.py` |
| A figure follows the unit | §277 | `checks/unit-follows.py` |
| Monthly plan | §278 | `checks/monthly-plan.py`, `objectives-table.py` |

---

## 14 · Open, and recorded rather than done

- **A project's outcomes are a different model** — a reported figure against a
  target, not a measure against a prorated one — and are deliberately left
  alone. Whether they should prorate has not been put to Islam (§264.2).
- **A Y/N measure stores no `progress`**, so the Focus board shows nothing for
  one. That is a reward decision (§239), not an oversight.
- **`reportedCount` reads `actual` for every kind**, so a tactic reporting into
  `outActual` is never counted done. It predates §257 and is measured as no
  worse for it; fixing it changes what Submit demands of every existing tactic,
  which is Islam's call.
- **The deck prints the seasonal benchmark with no word saying why** (§278), and
  a monthly plan is deliberately not a counted gap.
- **The objectives' reading view draws no `#`** where a pillar's key measures
  number their rows in both modes (§278.3).

## 15 · One defect found while writing this

`src/config-data.js` cites **§264** three times for the yes/no behaviour that is
recorded at **§257** (§264 is the Highest/Lowest section and says nothing about
Y/N). Almost certainly a number the branch carried before the merge renumbered
it — §257's own header records being renumbered from §251 for exactly that
reason. **Not corrected here**: it is a comment in product source, so changing
it changes the built file's bytes and pulls in a rebuild, the §238 CSP hashes
and a `sw.js` shell bump. It is a merge-shaped change, not a documentation one,
and it is Islam's to schedule.
