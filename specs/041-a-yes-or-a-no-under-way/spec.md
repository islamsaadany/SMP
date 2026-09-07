# 041 — A yes or a no that can be under way (§300)

**Status:** merged to `main` 2026-09-06.
**Decided with Islam, 2026-09-06.** Mockup: `design-mockups/yn-in-progress/2026-09-06_yn-in-progress.html`.

## The question

Some yes/no rows are genuinely binary — the business became profitable, or it
did not. Others are yes/no in the end and take months to get there: an agreement
under negotiation. Islam asked whether Y/N should stay strictly binary, whether
anything with a middle should be planned as a `%` row, or whether a third
category was needed.

## The answer

**One kind of Y/N row. The plan is unchanged; the REPORTING control gains the
middle answer** — which is what §104 already did for a deliverable, whose plan-
time `kind` was deleted because Not started / In progress with a per-cent /
Delivered serves both.

## What the reporter sees

A status picker with **— · Not started · In progress · Done**, and, only while
the answer is In progress, a **separate per-cent box** stacked under it. The two
are `ynBoxes()`, one builder, drawn on a unit's, a pillars function's and a
capability function's reporting page alike.

## What it scores

| answer | score |
| --- | --- |
| Done | **100**, whenever it arrives — it does not prorate |
| Not started | **0** |
| In progress + % | the per-cent **against the share of its own window that has elapsed** — 60% at half a Q2–Q3 window is 120% |
| In progress + % on a row that names no window | the per-cent **as itself** — 60 reads 60 |
| In progress with no % | **not scored, and not answered**: the box says *Needs a %* and Submit waits for it |
| nothing said | **not scored** — absent is not nought (§35) |

## What is stored

One field, the one the figure already lived in (`actual`, or `outActual` on a
tactic's outcome): `Not started`, `In progress`, `In progress 60`, `Done`.
`SMPRules.ynState` reads it and `ynJoin` writes it. **No migration, no schema
change, no new column in any workbook.** A tenant's stored `Yes` and `No` go on
scoring 100 and 0 and are shown in the new words without being rewritten.

## Decisions taken by Islam, with their costs

1. **Done does not prorate.** *"delivering early of an action doesn't indicate a
   higher % of achievement."* Cost: a row 60% through a half-elapsed window
   reads 120 and reads 100 once finished.
2. **The three words are Not started · In progress · Done** — the tactic's own
   Status vocabulary, not a new one.
3. **The target keeps `Y/N`.** *Delivery*, *Completion*, *Stage*, *Achievement*
   and *Done / Not done* were weighed. Cost: the plan's word and the reporter's
   words are one step apart. Gain: nothing is renamed, nothing migrates.
4. **Two boxes, not one compound control** — §104's own pair.

## Verification

- `checks/yn-in-progress.py` — **30 red** on the build before, green after.
- `checks/yn-target.py` — two assertions rewritten (§218), all green.
- `scripts/test-authorize.js` §32 — the answer classifies as `unitReporting`
  and nothing else; allowed for a reporter, refused for somebody else. 534/0.
- `scripts/test-graph-diff.js` 131/0; neighbouring checks green; full `qa.py`
  sweep clean.

## Recorded, not done

- The progress workbook carries no column for a tactic's outcome figure at all
  (§250.2), so a yes/no answer on a tactic does not round-trip through the file.
- `checks/tactic-outcome.py` is red on `main` (13 assertions, plan-pen section),
  reproduced identically before this change and left alone.
