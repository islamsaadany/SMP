# Spec 062 — Revenue drivers

**Asked for** 2026-09-21 by Islam, in a written alignment note kept beside this
page (`reference/alignment-note-2026-09-21.md`), and answered question by
question on 2026-09-22.

**Status:** the arithmetic is built and proved against his own tool. The
screens are **drawn and signed off** (§6) — nothing visual is built yet.

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

And five more on 2026-09-22, against the drawn screens
(`design-mockups/revenue-drivers/2026-09-22_the-drivers-tab.html`, published as
an artifact — rule 1c):

| # | Question | Answer |
|---|---|---|
| 6 | Where the tree sits | **"it's a tab beside the swot ok."** Strategy's own section row, between SWOT and Plan. §6.1 |
| 7 | An unanswered connection | **"just say so."** Nothing is held back — which changed the colour. §6.2 |
| 8 | The review reading | **"the perfomance shall split to strategy and revenue driver."** §6.3 |
| 9 | Who types a driver's actual | **"what do oyu mean? they are all typed."** Corrects §4.5. §6.4 |
| 10 | The seasons page | **"ok."** In Setup, beside the reporting cycle. |

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

Answer 4: **"it's copied to add new numbers."** The tree is duplicated into the
new cycle, last year's stays where it is, and the new numbers go into the copy.

**And the new baseline is what was ACHIEVED, not what was planned** — Islam,
2026-09-22: *"no the new baseline is the achievement which is added as well
manually."* This is the answer I did not expect and it is the better one: a
plan of 1B that delivered 900M has a baseline of 900M next year, so a unit
cannot quietly compound growth on a number it never reached. Carrying Year 1
forward — which is what I had proposed — would do exactly that.

It is **typed**, not derived, which is the same answer as §4.5.

### 4.5 Who types what

| | |
|---|---|
| **The baseline** | the office, by hand (*"typed by office"*) |
| **Every driver's actual** | the office, by hand (answer 9: *"they are all typed"*) |

**THE MIDDLE ROW WAS MINE AND IT WAS WRONG** (§4.5a). This table first read
*"a connected row's actual is read from the measure it connects to — nothing is
entered twice"*, and he never said that: he answered only about the
**unconnected** rows (*"the smo for now"*) and I filled the other line in by
inference. Asked directly, answer 9 is *"what do oyu mean? they are all
typed."*

And the inference was wrong on the arithmetic as well as on the authority: **a
measure and the driver beside it are usually different quantities.** A measure
reads *the work to lift conversion was 96% delivered* while the driver beside
it reads *4,100 transactions a month against 4,500 assumed* — which is the
whole of what the review screen exists to show (§6.3), and it cannot be shown
by a build that copies one into the other.

**SO THE CONNECTION DOES NO FILLING AT ALL — IT IS ONLY FOR READING.** That
makes the build smaller and leaves §4.3's storage finding untouched: the
pointer still has to survive the positional renumbering, so it still rides on
the objective.

**One cost, named rather than discovered:** where a measure's target genuinely
IS a driver's Year 1 figure, the same number is typed in two places and the two
can drift. Nothing here forecloses reading one from the other later.

**"For now" is recorded as his**, not smoothed away: the natural next step is
the unit entering its own assumption figures.

**AND THE PLATFORM COULD OFTEN FILL THE BASELINE AND WILL NOT.** Where a row
connects to a measure, last year's actual is already in the closed cycle, so
the box could arrive with a figure in it. He said typed, so it is typed — the
most this should ever do is OFFER what it knows beside an empty box, and even
that is a screen decision rather than something to slip in here.

---

## 5 · What is built

**The arithmetic is in `lib/rules.js`, the SHARED module** — inlined into the
platform by `build.py` and `require`d by `api/state.js` (§42) — not in a
module of the new stack's own, because the browser draws the tree and the
server authorises every change to it, and two copies of *what a driver
multiplies* is the drift that module exists to stop. It carries the shape, the
season windows, the months, the multiply-and-roll-up, the growth split, the
three connection states, and what actually happened.

`smp-app/checks/drivers.mjs` proves it by **running his tool's own functions in
a sandbox beside the port and asserting the two agree** on every channel,
sub-channel, period and every figure in the bridge — on the tool's own five
channels, which carry all four awkward cases (flat and split, rate and count,
seasons, increments, `%` drivers, plus-n uplifts). Agreement, never a typed
number: if the port drifts, the check goes red without anybody editing it.
**99 assertions, red under seven breaks**, one per decision.

**The three signed-off screens are built** (§6.1–§6.5 below record each one,
what was decided inside it, and how it was proved):

| | where | what |
|---|---|---|
| The tree | Strategy → **Drivers**, between SWOT and Plan | the whole channel, editable end to end behind the plan's own pen |
| The reading | **Performance**, split *Strategy* \| *Revenue drivers* | what was argued against what was delivered, per period and per driver |
| The seasons | Setup → **Seasons** | a name and two dates, set once for the client |

**Nothing new is stored where a migration would be needed**: a unit's tree
rides `units.extra` and the seasons ride the group's, both of which
`lib/state-io.js` already files and reads back (§118, §213). Nothing on
Roles & access moves — the tree is `u_plan`'s and the seasons are `c_bands`'s.
The demo carries Islam's own Retail tree and Ramadan, and **both are scrubbed**
so no client inherits them: `clearedGraph()` on the screen and migration 004 in
the database (§21, §45.3).

---

## 6 · The screens, drawn and signed off

Rule 1c paid: `design-mockups/revenue-drivers/2026-09-22_the-drivers-tab.html`,
published as an artifact and answered point by point.

**Every planned figure on it is real** — run out of his own tool through the
port, never typed to look plausible: Retail 125.02M → 153.83M with its bridge
(volume 0.91M · price 12.50M · interaction 0.09M · new business 15.31M),
E-commerce 13.48M → 34.83M and its three routes. **The ACTUAL column on the
review screen is invented and says so on the page** — nobody has reported
against a tree yet — but it goes through the same arithmetic, so the per-driver
effects add to the period gaps and the period gaps add to the channel's
−15.38M.

**AND WHAT COULD NOT BE CHECKED IS ON THE PAGE RATHER THAN LEFT TO BE
DISCOVERED** (§124): python playwright is not installed in this session, so
this is **not** a mockup driven out of the running platform the §41.9 way. The
palette, the type scale, the radii, the navy band, the zebra and the table
rules are lifted from `platform.css`; the pixel fit of a long table at a narrow
window is unproved until it is built.

### 6.1 Where the tree sits

**A section in Strategy's own row, between SWOT and Plan** (answer 6). A unit
reads *who we are → where we stand → where the number comes from → what we will
do about it*.

It uses `u_plan`'s grant, so **nobody's access moves and no column appears on
Roles & access** — which is the promise §2.1 made. A top-level tab was the
alternative, and was refused with its cost stated: a five-tab row where there
are four, and the tree separated from the plan it exists to justify.

**Built 2026-09-22.** The whole channel on one page: a total line, a band per
period naming what it is (a base year carries the months it has left after its
own seasons, a season its real dates, an increment how long its rows trade),
the drivers under it, and a sub-channel rail where there is more than one.
Editable end to end behind the plan's own pen — add and remove a driver, type
a baseline and a target, pick volume or value, name the unit, mark a row an
assumption, connect it to an objective, add a period, add a route.

**A PERIOD IS ADDED FROM A `<select>` AND NEVER A BUTTON**, which is
arithmetic rather than taste: `driverMonths` gives every base period twelve
months less its own seasons, so two base periods are two full years added
together — a plain *+ Add a period* would have silently doubled the plan. The
control is narrowed to the choices that are legal, and a season already used in
this sub-channel is not one of them.

**A ROW IS ADDRESSED BY INDEX AND A DRIVER BY ITS ID**, because `paint()`
redraws after every change while a driver keeps its id — an objective points
AT it (§4.3), so it is the one thing on the page that cannot be renumbered.

### 6.2 An unanswered connection says so and holds nothing back

Answer 7: *"just say so."*

**WHICH CHANGED THE COLOUR, AND THAT IS THE DECISION RATHER THAN A DETAIL.** It
was drawn as the platform's red `Missing`, and red on a value means *this is
holding something up* everywhere else here — a missing figure, a gap that shuts
Submit. A red word over something that stops nobody teaches people to stop
reading the red (§214.4's own fault, §41's budget). It takes §272's quiet grey:
outstanding, findable, blocking nothing.

So the last column has three states and the difference is what the review turns
on: **connected** to work somebody is doing, an **assumption** that moves for a
reason nobody is scored on (§343's indicator column, the absence of a direction
being the signal), and **nobody has said yet**.

### 6.3 Performance splits in two

Answer 8: *"the perfomance shall split to strategy and revenue driver."* Two
sections — **Strategy** and **Revenue drivers**.

**EACH SECTION CARRIES BOTH HEADLINE NUMBERS**, which is the one thing the
split must not cost: §1's whole argument is that the two readings are worth
reading beside each other, so 94% and 90% show whichever section you stand in
and the section row is how you cross.

**§63 IS NOT REVERSED AND IT IS WORTH SAYING WHY.** That section removed a
Reporting *section* from inside Performance on Islam's own point that
*"performance is a result of reporting, so having inside performance 2 buttons
performance and reporting doesn't make sense"* — two siblings repeating the
tab's own word. These two are different readings, and neither repeats the tab.

**FLAGGED, NOT DECIDED** (rule 1b): a section called **Strategy** under
Performance sits one row below a **tab** called Strategy — two levels, one word
(§87's twins). His words are used. *Delivery* is the alternative and is one
word to change.

**Built 2026-09-22.** *Revenue drivers* is drawn only for a unit that HAS a
tree — a section that opens on nothing is worse than no section (§45.2) — so a
unit nobody has built one for keeps the Performance page it has today, with no
second section and no row of its own.

The reading is three bands, one per period: **argued &middot; delivered &middot;
the gap**, and under each the drivers that explain it, each with the money its
own movement accounts for. The effects in a period sum **exactly** to that
period's gap, which is the cascade (§3.4) and the reason it is measured that
way rather than one driver at a time.

**A DEVIATION FROM THE MOCKUP, STATED RATHER THAN QUIET**: the drawn screen
shows the revenue score in red. The build gives it **the tenant's own scoring
band**, so on the demo's scale 90% reads *On track* and is green. A second
answer to *what does 90% mean* is exactly what §167 built the bands page to
prevent, and a figure that wore its own colour here would disagree with every
other figure on the same page. One word from Islam puts the drawing back.

**A FIGURE THAT WAS NEVER TYPED IS NOT NOUGHT** (§35, §93): a driver nobody
reported against says so and moves nothing, and the period's delivered figure
stands on the rows that WERE reported. Both ends are asserted, because a build
that ignored every reported figure satisfies the first half perfectly.

**ONE SCALE PER LINE.** The money formatter takes a reference figure, so a band
reading *argued 117.41M &middot; delivered 108.59M &middot; −8.82M* never puts
a K beside two Ms and make a reader rescale in their head — and the negative
sign is a true minus (U+2212), which lines up in tabular figures where a hyphen
does not.

### 6.4 The connection reads; it does not fill

Answer 9, and §4.5a. Every driver's actual is typed by the office; the
connection exists so the review can say which work a moved driver belonged to.

**Built 2026-09-22.** The connection is stored **on the objective**
(`obj.driver = "d10"`) and never on the driver, which is not a preference:
`renumberUnit()` rewrites a unit's key objective, measure and tactic ids BY
POSITION on every load (§48), so a pointer kept the other way round would
re-aim itself at whichever row moved into that slot. The driver's own id is
minted from the MAXIMUM and never the count (§96.2), so it survives a row
above it being removed.

### 6.5 The seasons page

Answer 10: *"ok."* In Setup — a name and two dates, defined once for the
client, used by name in any unit. Change Ramadan's dates once and every base
period in the client moves with it.

**Built 2026-09-22.** A table in the family's own shape (`unitcfg`): the name
in a bound box, the two dates on the platform's one date control (§307's
`monthBtnHtml` with `{day:true}`), the length **derived** beside them, and a
count of the units that still name it.

**It is under *Measurement*, not under *Running the cycle*, and that is a
deviation from the sentence above.** §261.9 settled this shape of question
once already — a page was put in *Running the cycle*, Islam questioned it, and
the answer was that the group's own note is the test. That note says **what you
do while a cycle is open**, and naming Ramadan is what you do when one is not;
*Measurement*'s note says **what the numbers mean**, and a season is the line
that decides how many months a base year has. It sits immediately under
**Scoring bands**, which is the same kind of fact set the same way. One word
from Islam moves it.

**`c_bands` is its grant**, so no column appears on Roles & access and nobody's
access moves: a season and a scoring band are both *the office decides what a
figure means*, and a cell of its own would be a question with no second answer
(§37). The SERVER still classifies it separately (`seasons`), because a
refusal has to name the page that answers it (§16.7).

**Four decisions inside it, each with a reason that is not taste:**

* **A season is added UNDATED and named afterwards** — the dates are picked,
  and a picker has nothing to open beside a row that is not there yet.
  `driverMonths` reads a missing window as nought months (§93), so an undated
  season takes nothing out of anybody's base year and every tree goes on adding
  up while somebody is still deciding.
* **The stored value is ISO and the control speaks** — `2026-02-17` stored,
  *17 Feb 2026* shown and written, converted at the one seam through the
  platform's own `dayParts` rather than a second parser. Mixing the two
  spellings is not cosmetic: `new Date("2026-02-17")` is UTC midnight and
  `new Date("17 Feb 2026")` is local, so a window with one of each is out by
  the timezone offset and the day count can land a day either side.
* **A blank name is refused and the stored one comes back into the box**
  (§124, §273.4's own answer): there is no Save to refuse at, and a tree
  names a season by `id` while showing the name, so a nameless season is a
  period reading nothing at all.
* **Removing is refused while a unit still names it, and the units are NAMED**
  (§62). Nothing would corrupt — `seasonById` answers null, the base year
  gets its month back and the tree still adds up — but it leaves a period on
  somebody's Drivers page reading an em-dash for ever with no control able to
  say what it was, which is §61's dead end wearing a clean save. Asked again
  at press time rather than trusted from the render (§48.2), and the last row
  leaving **deletes** `GROUP.seasons` (§50.6).

**Proved by driving it**, on the built file with no console error: Add mints
beside the demo's hand-written `ramadan` with no collision, the name writes and
a blank one is put back, the picker writes ISO and clearing deletes the key,
the refusal names Retail Stores, an unused season goes and the last one leaving
takes the key with it. **And the promise the page makes is measured end to
end**: moving Ramadan's end date on this page takes Retail Stores' base year
from **10.981 to 9.962 months** and its season from 1.019 to 2.038, still
summing to twelve. The table fits its box at 1600 / 1280 / 1100 / 1000 with no
page scroll.

**Checked**: `smp-app/checks/drivers.mjs` §11 (10 assertions on
`seasonMintId`, `seasonUsedBy`, `seasonMonths` and `seasonById`, both ends
every time), red under a seventh break (`season-id-from-count`);
`scripts/test-authorize.js` §43 gains five — adding, removing, and the key
being deleted outright are all `seasons` and all the office's — **8 red** with
the classification removed, which is the §259.2 failure this exists to stop: a
change that is swept but unclassified is INVISIBLE and therefore allowed to
everybody, so a unit head could otherwise empty the client's seasons and take
every base year to twelve months.

### 6.6 What the mockup does not draw

**The roll-up on the group and a company.** §4.1 says a channel is a unit and
the Master roll-up is what those pages already are, so there is nothing new to
draw until the unit-level screens exist to roll up.

---

## 7 · Open

All three of the questions this page opened with were answered on 2026-09-22
and are recorded in §4.4 and §4.5. What is left is not a question about the
model:

1. **Where the baseline figures live.** The tree is per cycle and copied
   forward (§4.4) and the new baseline is last year's ACHIEVEMENT, typed — so
   the store has to hold more than one year without the copy becoming a second
   source of the truth. This follows the screens rather than leading them, and
   it is the next thing to settle.
2. **The section's name under Performance** (§6.3's flag), which is one word
   and is Islam's whenever he looks at it on a screen.
