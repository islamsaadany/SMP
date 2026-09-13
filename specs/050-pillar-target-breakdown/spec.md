# Spec 050 · A breakdown of a pillar's targets

**Status:** BUILT · branch `claude/inspiring-lamport-pm0ki2` · §339 in
`DECISIONS-AND-LOGIC-v3.22.md`
**Asked for:** Islam, 2026-09-13 — *"let's start with what's drawn and signed
off"*, of the four extras §324.8 recorded. Only one of the four was ever
drawn; this is that one.

---

## 0 · Where this comes from

The picture was settled on 2026-09-11 and signed off:
`design-mockups/pillar-category-breakdown/2026-09-11_targets-breakdown-by-category.html`
— drawn out of the running platform with Islam's own pillar and its own five
categories, with today beside the proposal.

Its closing line: *"Settled: this shape · every category counts equally ·
Growth and CM are both higher-is-better and both scored · Mix is reported and
never scored · Submit waits for every one of them."*

**ONE CONTRADICTION HAD TO BE SETTLED BEFORE ANYTHING WAS BUILT.** The mockup
says *Submit waits for every one of them*; a day later Islam ruled the extras
**optional**, which §336 recorded as reversing exactly that half. Both cannot
be true. Put to him as two readings with the cost of each:

- **A** — optional to *have*. Only pillars that need a breakdown get one, and
  once a pillar has one its figures are owed like any other.
- **B** — optional to *fill*. A pillar can have a breakdown and be submitted
  with the figures blank.

> *"A"*

Recommended, and taken: a figure that scores the pillar and can be left blank
makes the pillar's number quietly wrong.

---

## 1 · The fault, in one sentence

Islam's *Maximizing Current Stores* pillar has its targets broken down by
five categories — growth, contribution margin and share of the mix for each —
and **fifteen numbers had nowhere to go**. Written as fifteen measures the
pillar reads as though it had nineteen headline targets rather than three and
a table; written as one measure (*Categories mix*) it is a row nobody can
fill, which is what the worked example's own screenshot shows.

## 2 · The model

**A column is a key measure with several values instead of one.** That single
sentence is the whole of it.

| | |
|---|---|
| a **column** | one score: every category's figure against its own target, averaged |
| a **category** | a row, carrying one target and one figure per column |
| the **table** | named by the tenant — another client types Region, or Channel, or Brand |

Each scored column joins the pillar's own measures **carrying the same weight
as any of them**, and **every category counts equally**.

**The direction is the column's, and the column with none is the indicator.**
`Mix` is reported and never scored, because the five shares add up to the
revenue mix and one category beating its share forces another to miss. There
is no second switch: the absence of a direction IS the signal — one control
with three answers rather than two that can disagree (§110's pair).

**There is no compile rule.** A blank compile compares against the whole
target and prorates nothing (§276), which is what a category's annual share
already is. Fifteen glide paths would be a fourth control in a table drawn to
hold three.

## 3 · What is stored, and where

```
pillar.breakdown = {
  name: "Categories",
  cols: [ { id:"c1", name:"Growth", dir:"≥" },
          { id:"c3", name:"Mix",    dir:""  } ],     /* the indicator */
  rows: [ { id:"<pillar>-B1", name:"Bakery",
            t_c1:"7%", a_c1:"4%", t_c3:"13%", a_c3:"9%",
            note:"Ramadan shifted the bread mix." } ]
}
```

**NO SCHEMA CHANGE, AND IT IS MEASURED RATHER THAN CLAIMED** (§172, a claim
this project has made wrongly before): `pillars` maps nine columns in
`lib/state-io.js` and files every other key into `extra`. `scripts/test-roundtrip.js`
writes a breakdown with a scored column, an indicator, a note and a row with
targets and no figures yet, reads it back, and asserts **the table gained no
column** — then removes it and asserts the key is **deleted** (§50.6).

**A CELL IS TWO FLAT FIELDS, NEVER AN OBJECT**, and that is the one shape
decision everything else rests on. The authoriser tells a plan change from a
reported one by FIELD NAME (`splitRows`), and `same()` is stringify-based
while jsonb hands an object's keys back in its own order (§145, §249.3) — one
object holding every actual would read as a change nobody made and refuse the
save that carried it.

**STORED EXACTLY WHEN IT IS SHOWN.** `bdTidy` deletes the whole key the moment
`bdHas` goes false, so a pillar that never had a breakdown and one whose last
row was removed are byte-identical.

## 4 · Where it is drawn

| surface | what it shows |
|---|---|
| Strategy › Plan, reading | the targets, one row per category |
| Strategy › Plan, pen open | the name, a name box and a direction picker per column, `+` to add one, `×` to remove one, the targets, Add a row |
| Reporting | a box per asked cell with its target behind it, **one note per row** |
| Performance | figure / target, the scored columns wearing their band and the indicator plain |
| the review deck | one slide of its own, after that pillar's targets |

**DRAWN ONLY WHERE THERE IS ONE.** A pillar without a breakdown shows no
table, no empty section and nothing said about it (Islam, on the mockup) —
§45.2 read the right way round: that rule is about a FEATURE rendering
nothing, this is about a pillar that committed to no breakdown.

## 5 · What a figure costs

- **Submit waits for every asked cell** (decision A). A cell is asked for only
  where it has a target: asking for a figure against nothing is asking for a
  number nothing can read.
- **A scored figure at risk requires a note**, which is §105 reaching ten more
  cells. **An indicator's never can**, because it is not scored — proved by
  putting a Mix figure miles off its target and asserting no note is asked.
- **The note is the ROW's**, so one line clears every cell in it. The ask list
  still counts cells, so a refusal reads *"3 figures are at risk with no
  note"* and one sentence answers all three.

## 6 · The workbook

§22's contract: an upload AUTHORS, so a column the file does not carry is a
column the plan LOSES. Both workbooks gain a **Breakdowns** sheet.

**ONE SHEET OF FIXED WIDTH FOR A TABLE OF VARIABLE WIDTH.** A breakdown has as
many columns as its pillar chose and two pillars need not agree, so a sheet
shaped like the screen would need a column per column and a sheet per pillar.
Written long — one line per CELL, naming its pillar, its column and its
category — the shape is fixed whatever any tenant does, which is the same
reason the SWOT sheet is a Kind column and four words rather than four
columns.

The plan sheet's column name and direction ride on every one of that column's
lines; the reader takes the **first** spelling it meets and the order it meets
them in, so a file edited by hand reads the way it looks. The progress sheet's
ID is `<row>|<column>`, because that pair is what addresses a figure (§48).

## 7 · What the check asserts

`checks/pillar-breakdown.py` — 33 assertions, 0 failures, and **the state is
MADE and put back** (§255, §94.2), because no pillar in the worked example
carries a breakdown and every assertion here would otherwise pass on a build
that lost the feature.

Proved able to fail three ways from the SOURCES (§276):

| break | red |
|---|---|
| the column scores do not join the pillar's headline | **1** |
| every column is scored (no indicator) | **7** |
| the cells never reach the ask list | **2** |

**AND THE SECOND FALSIFICATION FOUND A WEAKNESS IN THE CHECK ITSELF**
(§113.8, §94.5): §4 reached for *the column with no direction*, which on that
build is `undefined` — `bdCellScore(r, undefined)` answers null and all three
assertions went green on exactly the build they exist to catch. The column is
asserted to be FOUND first; the falsification then goes 2 red → 7.

Beside it: `test-authorize.js` §39 (8 assertions, both ends, red 2 ways),
`test-roundtrip.js` (no schema change, key deleted), and
`checks/template-round-trip.py` carrying a breakdown through the plan file.

---

## 7b · And the head held three controls in one cell (§339.10)

Islam, with the pen open on it: *"the table is messed up not fitting in the
box."*

Measured before anything changed, at 1600: the table wanted **1851px in a
1285px box**, and the column head's cell was **660px holding 1286px of
controls**. So the `≥` and the `+` in his screenshot were **clipped rather
than drawn small** — a different fault from the one it looks like.

The cause is `.fld { width:100% }`, which is §110.8's own fix and is right
where it was written: a definite width is what stops an open register row
growing its table. It assumes ONE control in a cell. Three of them each take
the whole cell and the cell takes the sum.

It is **worst with one column**, which reads backwards until the cause is the
one above: a single head gets the whole free width, so both boxes claim 633px
each, where three columns share it and each pair claims 293 — the same table
is 566px over at one column and 264 at three. The check's fixture builds
three, so its falsification prints the smaller number.

The cell becomes a flex row (`.bdhead`): only the name box grows, the
direction picker takes **`--tw`** — the product's own 96px, what a select
needs to show *Average* — and the × is its natural size; the add-column cell
is sized to its own button. Measured after: **1285/1285, 965/965, 997/997**
at 1600/1280/1100.

**Two of the three assertions first written could not fail** (§113.8, §94.5).
*"The picker is not a sliver"* passes on the broken build, because
`width:100%` **stretches** it to 293px. And *"the × is inside the box"*
measured the scroll box's own right edge, which contains everything by
definition. Both rewritten, never loosened (§218) — at `--tw` read off the
page, and against the **visible** edge — and the falsification goes **3 red →
9**.

`checks/pillar-breakdown.py` had no width assertion at all, which is why the
overrun shipped: 33 assertions about what the table says, none about whether
it fits. 42 now.

---

## 8 · Recorded, not done

- **A breakdown travels as ONE field on ONE pillar row** in the change list.
  Finer would need `graph-diff`'s walker to descend into an object whose
  `rows` is an array, which it cannot do — so two people entering different
  categories of the SAME pillar in the same seconds still resolve
  last-write-wins. Two people on two pillars never collide.
- **A category row cannot be hidden from the presentation** (§233 reaches
  measures, tactics and the rest; a breakdown row is not in `hideableById`).
- **Fill mode does not reach it.** A blank target is the office's and is not a
  counted gap, which is why it draws an em-dash rather than the red word
  (§214.4) — counted-and-not-fillable would be §223's fault exactly.
- **The plan builder does not offer one.** A breakdown is added from the Plan
  page's pen.
- **The three other extras are still not drawn**: the pillar's description,
  the pillar committee, and the next-cycle focus box with its switch at cycle
  open. They were named in a list on 2026-09-11 and never drawn, so each wants
  a picture before anything is built (rule 1c).
