# 028 · One flow, several decks, back to back

**Version:** v3.22 · **Decisions:** §261 · **Status:** answered; built

Islam:

> for the presentation give an option for the smo from the presentation list to
> do master presentation which is a flow of presentations in a flow and he is
> just asked the flow of the units and functions who will present he make the
> flow and all the slides are put back to back to be presented in one flow

---

## 1 · What was already true

A subject's review deck is assembled **fresh every time it opens**, by one
reader — `deckHtmlFor(target)` (§253.3) — with three passes over it:

| pass | what it does |
|---|---|
| `insertPictureSlides` | the custodian's own picture slides, at their anchors (§50) |
| `deckHidePass` | removes the slides the office hid (§256) |
| `deckFootMarks` | foots every slide with the subject's own mark, or the group's (§52.9, §259) |

Nothing about a deck is stored, which is the whole of why a flow costs so
little: **putting several decks end to end is not a new kind of deck**, it is
the decks the Present button already opens, one after another.

Measured on the worked example before anything was proposed:

- **18** subjects report — 10 business units, 8 supporting functions
- **335** slides if every one of them presents
- three decks concatenated open first time, no error: **68** slides, **71**
  after `deckFitPass()` continues the long tables

## 2 · The six decisions

Every one was put to Islam with a recommendation and a cost, drawn in the
running platform first (rule 1c). Four came back in his words, two after the
strip at the bottom of the deck was drawn twice.

| # | question | answer |
|---|---|---|
| 1 | who may open it | **the SMO** |
| 2 | the picker's shape | **A — one list**, the flow at the top, everybody else under a band |
| 3 | is the flow remembered | **yes** |
| 4 | the Thank you between subjects | **every deck whole — "evey deck for transition"** |
| 5 | what the strip says | **the subject you are standing in, and its place in the order** |
| 6 | the row of dots | **one dot per subject** |

**Decision 4 reverses the recommendation put to him**, and is recorded as his.
The case against seventeen Thank yous mid-review was that they read as the
meeting ending; his case for them is the room's rather than the screen's — that
slide is what marks the end of one subject's turn before the next cover
arrives. It is also the cheaper build and it **removes** a rule: a deck inside
the flow is byte for byte the deck that subject presents alone, so there is no
second version of anybody's deck and nothing to explain about which slides a
flow drops.

## 3 · What was built

### The entry

A fourth line in the **Presentation** dropdown, beside Present, Manage slides
and Download the plan — his words, and §252.2's reason: that menu is where the
decks already are, so a flow of them costs no new control on any page.

It is the one entry in that menu that is **not about the subject whose menu it
is**, which is why it names none: the flow spans the tenant and the menu is
drawn in eighteen places.

The narrowing lives in `SMPRules.mayMasterPresent()`, never in the menu, so the
entry and the press cannot answer differently (§42, §48.2).

### The picker

The platform's own dialog. Every subject that reports has a row — from
`boardUnitTargets()` + `boardFunctionTargets()`, the same pair of lists the
cycle board is built from (§245), so the picker and the page the office watches
can never disagree about who reports. Names come from `placeLabel()`, which is
what tells a unit called *Care* from a function called *Care* (§244).

- a **tick** puts a subject into the flow or takes it out
- **↑ ↓** move it, and the number beside it is its place in the running order
- the header states *N of M presenting · about N slides* — **about**, because
  the count is the deck's own and `deckFitPass()` adds a slide when a long
  table continues at present time (§35: better a stated approximation than a
  number the deck's own counter then contradicts)
- **Start the flow** is refused, never disabled, when nothing is ticked
  (§221, §163)

Every press writes at once — the platform's own idiom (§35, §219) — through
`masterWrite()`, which schedules the save without a repaint exactly as Manage
slides does (§170).

### Where the order lives

`GROUP.masterFlow`, an array of targets. It rides the group's `extra`, which
already carries `sets`, `naming` and `focusOff`, so there is **no migration**
— claimed, then proved against a real Postgres 16: written, read back
identical, cleared, and the key gone with nothing else in the graph moved.

It **lasts** rather than riding `REVIEW`, which the cycle clears (§50, §115):
the order a board meeting runs in is agreed once and used every quarter.

Stored as an **absence** (§50.6): an order that is simply everybody in the
board's own order deletes the key rather than writing a copy of the default.
That is also what makes it self-healing — a unit created tomorrow joins the
flow of a tenant that never chose one, and does **not** silently join one that
did. A subject added after an order was agreed arrives *Not presenting*, and a
subject that has stopped reporting drops out of the stored list on the way in.

### The deck

`deckBuild(target)` is one subject's finished deck — its slides with all three
passes run on them. `openDeckWith(title, targets)` is now the **one opener**:
a unit's Present, a function's Present and a master flow are three doors onto
one act, and they differ only in how many subjects go in.

The passes run **per subject** and not over the concatenation, or a flow would
wear the first unit's lockup throughout and hide the wrong slides.

Every slide is stamped with whose it is, on a single deck as well as in a flow
(§53.5) — which is what lets the strip name the subject without keeping a
second list beside the deck that could disagree with it.

### The strip at the bottom

Two changes, both only inside a flow:

- it names **the subject you are standing in** and its place in the running
  order — *Retail Stores · 2 of 3 · H1 2026* — instead of saying one thing for
  seventy slides
- the dots become **one per subject**, each jumping to that subject's cover,
  while the counter goes on counting slides

The dot strip is one dot per slide today, and at **71** slides it already wraps
onto three rows and spills past the strip — measured, and true of the product
before this feature; a flow is what exposes it.

## 4 · What it does not touch

- **Present** and **Manage slides**, for every subject
- any score, figure or note — nothing is read, written or moved
- hidden slides and picture slides, which travel with their subject
- a single subject's deck: one dot per slide, no running order in the title,
  `DECK.flow` null — asserted, because everything now rides one opener

## 5 · Proof

`checks/master-presentation.py` — **31 red** on the pre-§261 build, 34 green
after. It asserts **agreement, never a number** (§94.8): a flow's slide count
against the sum of the decks its subjects present alone, the picker's names
against `placeLabel`, the footer marks against `deckMark`, and who sees the
entry against `SMPRules.mayMasterPresent` — at both ends, with the viewer who
may not open one asserted to still see Present (§113.8).

`scripts/test-authorize.js` §28 — the office may set and clear the order, a
unit custodian may not, the refusal names the Presentation menu rather than
Setup (§16.7), and a locked cycle does not stop it. **499 passed, 0 failed**,
and proved able to fail twice: the rule stubbed true → 3 red; the
classification removed → 4 red, because `MASTER_FLOW` is in `gExtra`, so
without its own line the change would be seen by nothing at all and allowed to
everybody (§191, §259.2 — the two edits go together).

Round trip, clean-slate parity and two tabs all green on a virgin Postgres 16;
the full `qa.py` sweep reports no page errors.

## 6 · Recorded, not done

- The dot strip still draws one dot per slide on a **single** subject's deck,
  where a 28-slide deck is fine and nothing has been measured as broken. The
  flow's own strip is fixed; the general case is a decision about a deck nobody
  has complained about.
- There is no way to **save an order without presenting it** other than to
  arrange it and close the dialog — which does save, because every press
  writes. What is missing is a control that says so.
- A flow cannot be **downloaded**: `mayDownloadPlan` and `sendPlanPptx` are one
  subject's plan, and what a master `.pptx` would contain is its own decision.
