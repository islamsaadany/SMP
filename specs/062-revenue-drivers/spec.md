# Spec 062 — Revenue drivers

**Asked for** 2026-09-21 by Islam, in a written alignment note kept beside this
page (`reference/alignment-note-2026-09-21.md`), and answered question by
question on 2026-09-22.

**Status:** the arithmetic is built and proved against his own tool. No screen
is built and none is drawn. Rule 1c is owed on every screen in §6.

**Reference, and this time it is in the repository:** his working tool,
`reference/revenue-driver-tree-tool-v12.html`, kept here unchanged. Every
statement in §3 was **measured by running that file**, not read off the note —
and the check in §5 runs that same file's own arithmetic beside the port and
asserts the two agree. Nothing about the model is retyped from a description.

---

## 1 · What this is

A business unit gets handed a revenue number. It builds the logic that gets to
that number — how many stores, how many transactions, what basket — and the
strategy is then built to deliver it.

Two readings that must not be merged:

- **Strategy performance** — did we do what we said we would do?
- **Revenue performance** — did the money show up?

A unit can deliver every tactic and still miss revenue because an assumption
was wrong. Keeping them apart is what makes that visible.

---

## 2 · The decisions

Islam's, 2026-09-22, in his own words where the words decide something.

| # | Question | Answer |
|---|---|---|
| 1 | Where does it live? | **A tab on a business unit, inside Strategy** — not a fifth module. Recommended with the cost of each stated and taken ("building"). It fails the module test in spec 046 §4.2 on four of five counts, and one of them the note rules out itself: §6 says the existing roles handle who enters what, and §7 reads at the review, which is Strategy's cycle. Spec 061 made the same call for Insights two days earlier for the same reason. |
| 2 | How do the rows combine? | **Answered by the tool, not by asking again** — Islam: *"I dont' get this question."* Measured: multiply inside a table, add across tables, sub-channels and channels. §3. |
| 3 | The revenue target | **"tree is the main source."** The typed revenue target goes away; the tree is where the number comes from. §4.2. |
| 4 | A new cycle | **"it's copied to add new numbers."** The tree is copied forward and new numbers go into the copy. Not archived-and-rebuilt. §4.4. |
| 5 | Who builds it | **"the smo build the trees."** |

### 2.1 · One thing changed from the note, and it is worth saying

The note's §3 says the tree is built by **the business unit**, negotiated and
approved above it. Answer 5 says **the SMO builds it**. That is a reversal of
the note and it is recorded as one rather than quietly folded in — and it makes
the build smaller, not larger: the office already reaches every unit, so no new
role, no new grant and no new column on Roles & access. What it costs is that a
unit cannot draft its own tree in the platform; it sends the numbers and the
office enters them. Stated rather than discovered.

### 2.2 · And a correction of mine

Two turns ago I said the platform's twelve monthly boxes on a measure were the
answer to the note's open question about monthly rates. **They are not.** His
tool does not phase by month at all — it phases by **seasons with real dates**,
cut out of a base year (§3.4). The monthly boxes are a different shape and
forcing one into the other would lose the season dates, which are the whole
mechanism. The connection carries a reading instead (§4.3).

---

## 3 · The model, measured

Run from `reference/revenue-driver-tree-tool-v12.html`.

### 3.1 The shape

```
tree
 └── channel          (Retail, E-commerce, FMCG, B2B, Events)   — a business unit
      └── sub-channel (Own app, Call centre, Aggregators)       — routes to market
           └── period (base | season | increment)
                └── driver  (name, volume-or-value, number-or-%, baseline, uplift, why)
```

A channel with one route is **flat** — it has exactly one sub-channel and never
shows the strip. Retail, B2B and Events are flat; E-commerce and FMCG are not.

### 3.2 A driver

Six things, and the last one is not decoration:

| | |
|---|---|
| **Name** | *Transactions per store-month* |
| **Volume or Value** | volume drivers multiply together; value drivers multiply together; revenue is the two multiplied |
| **Number or %** | a `%` driver divides by 100 before it multiplies — that is how *Maturity factor 70%* and *Commission retention 78%* work |
| **Baseline** | last completed year |
| **Uplift** | either a **percentage** of the baseline or a **plus-n** added to it |
| **Why** | the rationale, in prose, beside the number |

The **why** column is the one thing in the tool that no spreadsheet keeps
honestly, and it is the reason a review can ask *which assumption failed*. It
comes across.

### 3.3 The arithmetic

Inside one period, all volume drivers multiply, all value drivers multiply,
revenue is `volume × value × months`. Across periods, sub-channels and
channels, everything **adds**.

So the answer to question 2 is **both**, and which one depends on the level:
multiplication builds a number, addition rolls it up.

### 3.4 Months, which is the part that is easy to get wrong

- A **season** is defined once, globally, with real dates, and used by name in a
  sub-channel. Its length in months is its days ÷ (365/12).
- A **base period** is `12 − the seasons used in that sub-channel`. Calculated,
  never typed — so the periods inside one sub-channel always sum to twelve and
  can never overlap.
- An **increment** (new stores, a new product line) is not prorated. It carries
  its own *Months active* driver instead.
- A **count** channel (B2B, Events) is not prorated at all: the figures are
  absolute. `Events per year` is a count, not a rate.

Changing a season's dates changes the base period everywhere at once.

### 3.5 Where growth comes from

The tool splits growth four ways, and this is the reading a review is for:

| | |
|---|---|
| **Volume** | `(year1 volume − baseline volume) × baseline value × months` |
| **Price / value** | `(year1 value − baseline value) × baseline volume × months` |
| **Interaction** | the two compounding together |
| **New business** | the increments — revenue that does not exist yet |

Growth that is more than half **new business** is a different risk from growth
on an existing base, and the tool says so in words. That sentence comes across.

---

## 4 · How it joins the strategy

### 4.1 One channel is one business unit

The note's own mapping table says so. The tool holds every channel in one file
with a Master tab; in the platform, a channel is a **unit's drivers tab** and
the Master roll-up is what the **group and a company** already are. Nothing new
is invented for the roll-up.

### 4.2 The revenue target

Answer 3: the tree is the source. A unit's revenue key objective takes its
target from the channel's Year 1 figure.

**The precedent to follow is the monthly plan**, which already does exactly this
one level down: when the twelve boxes are complete the annual target is derived
from them rather than typed, it writes into the same field, and the deck, the
workbook, the archive and the scoring are taught nothing. The same shape here
means a half-built tree does not take over — which answers the worry I raised
when I asked the question.

### 4.3 Connecting a row

A driver row that somebody does work against connects to a key objective or a
pillar measure. A row that moves because of a one-time decision — a price
increase somebody set — connects to nothing and is never scored. **That second
kind already exists in the platform**: a pillar's target breakdown has a column
that is reported and never scored, with no second switch, the absence of a
direction being the signal.

**Which way the pointer faces is the one design decision here, and it is
load-bearing.** A unit's key objectives and pillar measures are renumbered
**by position on every load** — `mobile-KO3` means *the third objective*, not
*this objective*. So a connection stored on the driver row, pointing at an
objective, silently re-points the moment somebody deletes an objective above it.

The pointer therefore rides **on the objective**, not on the driver row: the
objective carries the driver it answers to. When the objectives are renumbered
the pointer travels with the row, because it is a property of that row.

Its cost, stated: that is a new field in the strategy plan, so the plan workbook
must carry a column for it — an upload authors a plan, so a column the file does
not carry is a column the plan loses on the next download-and-re-upload.

### 4.4 A new cycle

Answer 4: copied forward. The tree is duplicated into the new cycle, last
year's stays where it is, and the new numbers go into the copy.

The natural reading, which needs confirming when the screen is drawn: **Year 1
becomes the new baseline**, so the copy opens with last year's plan as this
year's starting point and the uplifts cleared.

---

## 5 · What is built now

**The arithmetic, and nothing else.** `smp-app/lib/drivers.ts` — the shape, the
season windows, the months, the multiply-and-roll-up, and the growth split.

`smp-app/checks/drivers.mjs` proves it by **running his tool's own functions in
a sandbox beside the port and asserting the two agree** on every channel,
sub-channel, period and every figure in the bridge — on the tool's own five
channels, which carry all four awkward cases (flat and split, rate and count,
seasons, increments, `%` drivers, plus-n uplifts). Agreement, never a typed
number: if the port drifts, the check goes red without anybody editing it.

Nothing is stored, no table is created, no screen exists, `drivers` is nowhere
in the navigation, and no frozen file is touched.

---

## 6 · What is not built, and needs drawing first

Rule 1c is owed on all of it.

1. **The drivers tab** on a business unit — the periods, the driver table, the
   why column.
2. **The seasons page** — defined once per client.
3. **The roll-up** on the group and a company.
4. **The review reading** — headline first, then the deviation and the rows that
   caused it.
5. **The connection control** — a row asking which objective or measure it
   belongs to, and saying when it is not connected yet.

---

## 7 · Open

1. **Does Year 1 become the new baseline on the copy** (§4.4)?
2. **Who types the actual** for a row that connects to nothing — the office, or
   whoever reports the unit?
3. **Baseline figures** are new data the platform has never held. Typed by the
   office, or read from the closed cycle where one exists?

None of the three blocks the arithmetic.
