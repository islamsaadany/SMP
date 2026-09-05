# 034 · The review deck

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §50 · §51.8 · §69.7 · §224 · §236 (+.2, .3) · §246 · §252 (+.2) ·
§253 (+.1 –.3) · §254 (+.1 –.12) · §255 · §256 (+.1 –.3) · §259 (+.2) · §265 ·
§275 · §280
**Constitution:** checked against v1.2.0 — Principles V (derived, never stored),
VI (follow what the platform already does) and XIII (a colour that works as a
fill fails as type) carry the weight here.
**Related:** spec 003 (presentation mode for a supporting function), spec 009
(collaborators and picture slides), spec 029 (one flow, several decks),
spec 031 (what the figures on a slide mean).

---

## 0 · Why this document exists

The deck is what a client's board actually sees, and it is the surface where a
mistake is most expensive: a wrong number on a projector is wrong in front of
the room, and nobody can check it there.

It was rebuilt across **fifteen sections in four days** — what a slide reads,
which slides exist at all, what a figure is measured against, how a deck is
navigated, and whose marks it wears. Most of those sections were opened by Islam
looking at a real deck and reporting something, which is the best evidence there
is and also why the record is a list of repairs rather than a shape.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · A deck is assembled on the press, and never stored

This is the single fact the rest of the document rests on. `openDeck()` calls
the builder every time it opens, so **there is no stored copy to go stale**
(§51.8) — which is why §252's reported symptom (*"presentations doesn't change
when the plan performance is done"*) could not have been fixed by a refresh, and
why a picture slide stores a title, an anchor, an arrangement and the pictures
rather than a slide (§50).

`deckBuild(target)` is one subject's finished deck, and the pass order **is** its
correctness:

1. `deckHtmlFor(target)` — the generated slides. **One reader**, asked by
   Present, by Manage slides and by the anchors alike (§253.3).
2. `insertPictureSlides()` — the custodian's own (§50).
3. `deckHidePass()` — remove what the office hid (§256). **After** the pictures,
   because a picture anchored to a hidden slide is still evidence; **before** the
   fit pass, because a continuation carries its parent's anchor, so removing the
   parent first takes a long table whole.
4. `deckFootMarks()` — one mark for the whole deck (§259.2).

`deckFitPass()` runs afterwards on the assembled deck, and **it measures**:
`scrollHeight` and `clientHeight` are both **0 on a detached element**, so a
detached deck reports every slide as fitting perfectly and the pass silently does
nothing (§69). That is why the three passes above run **per subject** and the fit
pass does not — a flow passed as one lump would wear the first unit's lockup
throughout (§266).

`openDeckWith(titleHtml, targets)` is the **one opener**, taking a list: a unit's
Present, a function's Present and the office's master flow are three doors onto
one act differing only in how many subjects go in (spec 029).

---

## 2 · Which deck a subject gets (§224, §253.3)

**The FORMAT decides, never the `fn:` prefix.** §224 made the Present button
branch on a supporting function's format — a pillars function goes through the
unit deck — and left `slidesAssemble()` and `deckAnchors()` still asking by
prefix. So the Manage slides editor assembled **2** slides where Present opened
**13**, and a picture could be placed in one of two positions in a deck that has
thirteen.

`deckHtmlFor(target)` is the one reader and all three surfaces ask it. The
capability deck is asserted **unchanged** in the same breath (Marketing 15 before
and after), or a build routing everything through the unit deck would pass every
assertion about the function.

**And the failure had no voice**: `slidesAssemble()` had a `try/finally` and no
`catch`, and `slidesPaint()` opened `if (!all.length) return;` — so a throw, or
an empty deck, left the bar over a blank rail with nothing said (§32, §171, on
the one surface that had neither). Both speak now.

> **What is not claimed:** the demo's pre-fix editor draws two slides and Islam's
> screenshot showed none, so the prefix branch is certainly a defect and
> certainly made that editor useless for a pillars function — whether it is
> exactly what emptied *his* rail cannot be proved from here. Which is why the
> failure was given a voice in the same change.

---

## 3 · A slide says what was reported (§252)

Measured on Mobile: the slide read **`— / 50%`** and **`—`** where Performance
read **`4# / 3 #`** and **`133%`**, under a heading on that same slide already
saying **`Delivered 98%`**.

**Five readers were looking in the old box.** §248 puts a tactic's outcome figure
in `outActual` (spec 031 §7), and `reportedCount` went 41 of 41 → **40 of 41**,
so **Submit refused a finished report**; `rowReads` returned null so the note rule
never saw an outcome; and the row wore `.notdue` while its own last two cells
printed the figure.

The expression existed and was written out **once**, inline in the Performance
pane — it is `tacticProgress()` now, with `rowAnswered()` beside it answering
*has this row been answered* for every kind of row. The ternary it replaced in
`reportedCount` had **the same expression in both branches**: a tactic case
written and never filled in.

**The slide's shape is Islam's**, from three shot out of the real deck: the
outcome takes a **column of its own**, as on Performance, because a projector
must not say something different from the page behind it. Cost measured before he
chose: Mobile's deck **24 → 27 slides**. A row owed a figure says
*"Not reported · due at …"* rather than the em-dash that means *nothing to
report* (§35), and **a tactic with no outcome is byte-for-byte what it was**,
asserted both ways.

---

## 4 · A table with no rows is not a slide (§253)

*"slides are showing blank pages for the merchandizing."* Measured before
anything was proposed: **four** slides in the whole product draw a heading, a
navy column strip and then an empty page, and **all four are Merchandising** —
its own deck's two objectives slides, and Retail's **RS04**, the pillar carried
by that function, which printed **93% / 60% / 61%** across the top of a slide
with nothing behind those numbers.

**The product already knew the answer and applied it to one half**:
`deckSlidesFn` has guarded its objectives slide since it was written, which is
why Marketing has always been right; the unit deck, which a pillars function goes
through since §224, had no such guard (§53.5).

**Islam ruled it for any subject**, reversing the narrower rule recommended to
him, and the cost is named as his: a unit that has left its objectives blank is
no longer told so from the projector, and still is on every screen that counts
gaps.

**It drops the table, and the slide only where that leaves nothing** — the aim
slide carries a unit's aspiration *above* its table, and that is not a table with
no rows, so a unit keeps the slide and a function loses it. **An anchor goes with
its slide**, which is §50.3's existing behaviour: a picture placed after it lands
at the end rather than being dropped.

**§253.1** — the headline slide's objectives cell read a grey dash under *"no
earlier cycle to compare"*, which is a control that failed to render rather than
an absence (§45.2). It goes for any subject with none, **at no CSS cost**:
`.headgrid` without `.three` is the shape that slide wore before §243 added the
third number. **And the mockup earned its place** — shooting it exposed a
footnote still opening *"Objectives measure what was committed to"*, explaining a
number that would no longer be there.

---

## 5 · A figure is read against what it is measured by (§254)

Eight things from one afternoon of Islam looking at the live deck, all mocked up
first.

**The benchmark, and the column that names it.** His row read `6#` against `4#`
at 133% with nothing saying why. §239 has prorated a `Sum` measure since it was
written and the deck never printed what is due so far — so **nothing new is
computed**, the shape is §252's own (figure bold, benchmark behind a slash),
through **one builder `figVsDue()`** the three tables ask. *Annual target* is
Performance's word (§239.2); the aim slide keeps *This year*, where it contrasts
with the 3-year column and is doing different work.

**§254.1 — a scaled currency is one token wherever it is drawn.** The convention
existed and was only ever applied on the way IN, so a value that *arrived* with a
space was never tightened. **That rule is about what is stored and it stands** —
`unitTight()` is display only, asserted by building every deck and comparing
every stored figure byte for byte. The test is a **magnitude letter**, not a
list, so `K EGP` reads right the day a tenant types it though the picker does not
offer it. **The first draft closed the wrong gap** and produced `8MEGP`: *tight
is a fact about the SEPARATOR, never about the unit.*

**§254.5 — the pillars are named before they are scored.** His concept, the
platform's treatment: one gold rule across the row rather than a hue per card
(§41's budget), **the CODE as the number**, and **the two pillar slides cannot
share a name** — the score table takes the deck's own existing *"— where we
stand"* rather than a new form of words (§87's twins on a projector, and two
identical rows in Manage slides' rail).

**§254.8 / §254.12 — the pillar cards size themselves.** `--c` and `--r` carry
the shape: up to three stay in a row, above that it is `ceil(sqrt(n))`, so **four
reads as 2×2** and five goes 264px/27.6px → 445px/34.7px. **Flex-wrap, never a
grid**, because a ragged last row has to be centred — and **the vertical sizes
follow the ROWS and the horizontal ones the COLUMNS**, which getting wrong ran
three rows 84px off the slide.

**§254.9 — the aim slide runs the width** and the table grows: **the ceiling is
the fit pass, not taste**, because `.tight` shrinks the aspiration too. Measured
across all ten units: **10 of 10 aim slides were on the generic 19px floor and
none are now.**

---

## 6 · A reported note is named as one (§255)

*"the perofmrance is showing hte notes under the tactic name. what is this
issue?"* — then the correction that set the scope: *"notes is not in the
desciption, notes is something relevant to the reporting and appears in
performance as a separate element. so it needs to be there so we can't drop."*

**Neither placement was a mistake.** §239.2 put the reporter's note under the
name and §248 later put the plan's *description* in the same cell; both right on
their own, and both drawn as `.why` (12px, `--ink-3`), so **a permanent statement
and a this-cycle statement render identically with nothing saying which is
which.**

**The cost decided it and was measured before he chose**: a Note column of its
own — what the deck has always had — takes the Tactic column **790 → 209px at
1920** and starts running past the pane at **1280px**, an ordinary laptop;
**naming it in place costs no width at any width the table fits today.**

**A rule, not a second size or colour**: smaller or paler would rank the note
*under* the description, and it is the newer of the two. It keeps `.why`'s size
and ink and is set apart sideways — 2px in `--line`, never the accent — and one
uppercase key. **One builder, both tables on the page**, including the key
measures table, which stacks the same two greys the moment a row has a horizon
as well as a note: nought in the demo, so **latent rather than absent**.

**And the mockup's `.85` opacity was dropped in the build** — about 4.2:1 at
10px, §38.5 walked into while quoting it; without it 4.95 light / 5.53 dark.

---

## 7 · A slide the office does not present (§256)

*"allow the smo to hide presentation slides of any unit or function."* §246 named
this and left the question inside it: *which slides may be hidden, and whether
hiding one hides what it counts.*

**It changes no number, and that is the answer.** §233 hides a ROW and takes it
out of every score; this hides a generated SLIDE and takes it out of **nothing**
— still reported, still asked for, still scored, still on the page. Two switches,
two jobs: one that did both would mean tidying a deck before a board meeting
silently moved a unit's figures. **Asserted first**, off the platform's own
functions, byte-identical either side of the press.

- **It lasts** (so not in `REVIEW`, which the cycle clears — §50), and is guarded
  by the rail always saying *"N slides hidden"* with one press back.
- **The office's alone**, and a custodian **sees** the marks and the count and
  gets no eye — seeing a state is not setting it, asserted at both ends.
- **Named by its anchor, never by its position** (§48, §236.3): every generated
  slide has carried one since the picture placer needed somewhere to land, so the
  nameable slides *are* the deck. It rides `extra` (no migration), is stored as
  an **absence** (§50.6), and is **sorted**, or two spellings of one fact report a
  change that is not one.
- **The editor marks what the projector removes**, or a hidden slide could never
  be brought back (§61).
- **A deck cannot be emptied**, refused on the press rather than in the pass, and
  `aria-disabled`, never `disabled` (§163, §221).
- The server's `deckHide` is **its own kind**, so the refusal names Manage slides
  and not Setup (§16.7), and is deliberately **not** gated on the cycle lock —
  pruning the deck the morning of the meeting is when this is used.

**§256.2 — two sessions found the same fault on the same day, and git merged both
fixes silently.** Both wrote a function named `deckHtmlFor` in the same file four
hundred lines apart, with **no conflict**: two declarations of one name, the later
winning by hoisting, so the product would have run this branch's copy while
main's sat dead under comments still describing it as live. **After any merge
touching a file both sides changed, grep the result for its own declarations.**

---

## 8 · The deck wears the client's marks (§259)

*"where can I upload the raya trade mark so it can be used? then work on
separators let's make teh serparators blue background like the client brand
colors."*

**`--panel` is the blue and it is not a colour of the deck's own**: it is the
token Setup › Branding's *Navigation bar* control sets, so a divider wears
whatever blue the tenant picked and moves the day they move it. No new token, no
literal (§25) — **and the check proves it by REBRANDING the tenant mid-run and
asserting the dividers followed**, because an assertion naming `#16325C` passes
on exactly the build that rules out (§94.8).

**The four SWOT hues could not survive the move, measured not preferred** — 2.55
/ 2.26 / 3.49, and *Opportunities* was drawn in `--panel` itself, **1.00:1
against its own ground**. One rule across the row instead, the four category
slides keeping their hues, `.seccell.t-*` deleted with the classes it styled.

**No footer mark on a divider** (his word), which removes a fault as well as a
decoration: the white plate that makes a navy lockup readable is switched on by
the *page* being dark, which a blue divider on a light page is not. **A divider
is only drawn if its section is** (§253) — a unit 28 → 31 slides with four, a
pillars function two, **a capability function byte-for-byte what it was**.

**§259.2 — the group's mark.** §52.9 gave every UNIT one and stopped, so a
supporting function showed nothing and the group had nowhere to go. One upload on
Branding, through the **same `logoIntake()`** as a unit's or there would be two
answers to *what may be uploaded*. **`deckMark(u)` is the one reader** — the
subject's own, the group's otherwise. No migration (`org.extra`), Remove
**deletes** the key. **And the two server edits go together**: with only the
`add()` line removed and `"logo"` still in `gExtra` the field is neither
classified nor swept and **a unit head may set the group's mark** — 3 of 489 red.

**The demo seed carries no group mark, deliberately** (§54's rule: a client must
never inherit Raya's). **And the knowledge base had been wrong since the page was
written** — it promised Branding set *"the colours and the logo"* and that page
set colours only; it became true that day.

---

## 9 · Presenting it

### 9.1 · Fullscreen is the slide, the arrows and nothing else (§265)

From a live presentation: *"with every click the bottom banner appear then hide.
it shouldn't appear full screen accepts only the arros."*

**§69.7 is right and its second half answered a different question.** It hid the
62px strip — *7% of the projected image spent on controls the room can see and
the presenter does not need* — and then brought it back for 2.2s on a pointer
move so Exit could always be found. **And a click is a pointer event.**

> **A control that appears and disappears under an audience's eyes costs more
> attention than it saves the presenter.**

**The way out moves to the keyboard, which the room cannot see** — that is the
whole trade, and it is why **Escape stopped doing two things at once**: it called
`closeDeck()`, so the one key a presenter presses to get their laptop back
**threw away the presentation and dropped them onto the page behind it**. Out of
fullscreen first, then out of the deck — asked of `document.fullscreenElement`,
never of the `fs` class.

**Deleted, not switched off** (§24): `DECKPEEK`, `deckPeek()`, the two pointer
listeners, the `peek` class and its CSS rule.

**A click on the slide advances it, in fullscreen only** (Islam's, from two he
was given) — **forward only**, because a click that went back on one half needs a
visible boundary and the point of fullscreen is that nothing is drawn over the
slide; **windowed mode does not get it** and the interactive targets keep their
own clicks, or clicking into the note box to type advances the slide out from
under the cursor. **Forward is four keys and back is three** — his Down/Up, plus
PageDown/PageUp, because most clickers send those and *a clicker that does
nothing is indistinguishable from a flat battery* — and every one now stops the
page behind.

**The cost was stated before he chose**: a touch screen with no keyboard has no
on-screen way out of fullscreen. Which is what §280 is.

### 9.2 · A finger gets a way back (§280, reversing §265 for touch)

Presenting from a tablet: *"it doesn't go left or right."*

**§265 was right about a room and silent about a tablet.** Its forward-only rule
is argued from a **projector**, where the audience sees every affordance you
draw; a tablet has no arrow keys at all, so there forward-only is the only
direction the deck can go — §265's own stated cost arriving as a second symptom.

- **The boundary is at a third, not the middle** (his, from three drawn with the
  cost of each): forward is the act of a talk and back is the exception, so
  forward keeps the large target and two thirds of the slide can still be pointed
  at without the deck moving.
- **A mouse is unchanged, his call, cost stated** — one act now answers two ways
  by device — **asserted at both ends**, a mouse click on the very pixel a finger
  goes back from still going forward.
- **The kind is remembered from the pointerdown, never read off the click**: a
  `click` is not reliably a `PointerEvent`, so asking it takes the mouse branch on
  exactly the tablets this is for — invisible in Chromium, real in Safari.
- **Swipe: left is forward, right is back** (his), touch and pen only, horizontal
  beating vertical. **A swipe ends in a click**, so the tap and the swipe are two
  readings of one gesture with one `deckOwnControl()` between them.
- **And the rightward swipe was already doing something worse than nothing**:
  with no `touch-action` the browser claims it for its own back-navigation and
  **the page LEFT** — measured, `about:blank`, the presenter dropped out of the
  platform mid-presentation. `pan-y` is half the fix, not a detail; the vertical
  is given away deliberately and pinch-zoom with it, on a slide already scaled to
  fit.

### 9.3 · The button sits where a unit's does (§275)

*"can you move the presntation button for the functions to be in the same place
like what we did in the units while having the bands button as well?"*

Measuring narrowed the ask: this was the **only** Performance page in the product
drawing its controls in the page body — a unit's, the group's, a company's and a
**pillars** function's all call `perfActs()`. **The two halves of "supporting
function" had disagreed since spec 010**, because the pillars format is drawn by
`renderUnitPerformance(fnAsUnit(fk))` six lines above the line this changes.

**The bands half comes free and is new, not restored**: that screen has printed
*Off track* pills since it was built with nowhere to learn what they mean, and
saying so is what stops it reading as a repair. The controls land on **a unit's
pixels exactly**, which is what the check asserts — **agreement, never a
coordinate**, with both ends named first or two empty rows agree perfectly.

---

## 10 · Placing a picture, and where it may go (§236)

**Every original slide is a landing place, and what is pinned is the originals'
own order** (§236.3). §236 made the button say *"+ Add slide after"*; §236.2
found that the arrows were **25 dead presses of 28**, because a stored position
is an ANCHOR and the arrows stepped blindly one row, recomputing the same
position and repainting in place.

**The existing keys do not move** (§30.2 applied to anchors), so every picture
already placed in a live tenant stays exactly where it sits, and there is no
migration. One grouping survives and is not a gap: the parts of a table split by
`deckFitPass()` share their parent's anchor and are **one stop, after the last
part** — a picture cannot live between a table and its own continuation.

---

## 11 · Requirements, as things that can be checked

- **R1** A deck is assembled on the press; nothing stores a slide.
- **R2** One reader (`deckHtmlFor`) serves Present, Manage slides and the
  anchors.
- **R3** The pass order is pictures → hide → foot marks, per subject; the fit
  pass runs last, on the assembled deck, and must not be measured detached.
- **R4** Hiding a slide changes no score, no count and no refusal — asserted
  byte-identical either side of the press.
- **R5** A section with no rows draws no table, and no slide where that leaves
  nothing.
- **R6** A figure is printed beside what it is measured against, from one
  builder.
- **R7** A reported note is distinguishable from a plan description.
- **R8** Divider colour is the tenant's `--panel`, proved by rebranding mid-run.
- **R9** In fullscreen, Escape leaves fullscreen and not the deck; a touch in the
  left third goes back and a mouse click there does not.
- **R10** A supporting function's Performance controls sit where a unit's do,
  asserted as agreement.

---

## 12 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| Which deck a subject gets | §224, §253.3 | `checks/deck-blank-slides.py` §6 |
| The deck reads what was reported | §252 | `checks/deck-outcome.py` |
| No blank slides | §253 | `checks/deck-blank-slides.py` |
| Benchmarks, tight units, pillar cards | §254 | `checks/deck-figures.py` |
| A reported note is named | §255 | `checks/reported-note.py` |
| Hiding a slide | §256 | `checks/hide-slide.py`, `hide-slide-mockup.py` |
| Dividers and the group mark | §259 | `checks/deck-dividers.py` |
| Fullscreen, keys, touch | §265, §280 | `checks/deck-fullscreen.py` |
| The function's controls | §275 | `checks/fn-perf-controls.py` |
| The notes slide | §246 | `checks/notes-slide.py` |
| Moving a slide | §236 | `checks/slide-move.py` |
| Weights on the deck | §243 | `checks/deck-and-weights.py` |

---

## 13 · Open, and recorded rather than done

- **A deck already open on a projector does not redraw mid-presentation** — put
  to Islam and deliberately left (§252).
- **The `.pptx` plan download has no outcome column** (§252), and carries a
  **Due date** column the three panes lost in §104.8.
- **A pillars function's deck opens cover → *Where X stands* → *Pillars* with no
  aim slide at all** — correct, and the first deck in the product without one.
  Whether it should open on something of its own has not been put to Islam
  (§253).
- **A single deck still draws one unlabelled dot per slide**, nothing says the
  master order is saved without presenting it, and a flow cannot be downloaded
  (§266).
- **The deck prints the seasonal benchmark and no word saying why** (§278).
- **`K EGP` is not on the unit picker's list**, and a function can never have a
  deck mark of its own (§254).
