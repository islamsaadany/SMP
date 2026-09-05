# 035 · Gaps, filling, and where Submit is held

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §116.2 · §128 · §145.10 –.14 · §177 (+.2) · §184 · §187 · §192.4 ·
§205 · §214 (+.2 –.4) · §220 · §221 · §223 · §249 (+.2 –.4) · §251 · §263 · §272
(+.7 –.9) · §279 (+.1 –.3)
**Constitution:** checked against v1.2.0 — Principles IX (one copy of a rule,
run on both sides), X (the server decides) and XVI (a check that measures the
wrong thing passes).
**Related:** spec 023 (fill the gaps — §145, the feature itself), spec 006 (who
may change what), spec 031 (why a target holding only a unit is still missing).

---

## 0 · Why this document exists

Spec 023 specified **filling**. What has happened since is that the platform
learned to distinguish three different things a blank box can mean, and the
distinction is spread across a dozen sections that mostly read as small
corrections:

- **counted** — the plan owes this, it is red, and Submit is held until it is
  written;
- **fillable** — somebody other than the office may write it, whether or not it
  is owed;
- **empty** — nothing is owed and nothing is wrong, and there is still a box
  with nothing in it.

Getting those three confused is what produced almost every fault in this list:
a red count with no control behind it, a control the save then refused, a door
with no count, and a count with no door. This document states the three and what
follows from each.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · Counted and fillable are two questions

Three lists in `lib/rules.js`, and the relationship between them is the whole
design:

| List | Means | Read by |
|---|---|---|
| `GAP_FIELDS` | **counted** — the plan owes it | the band's number, the chips, the rail marks, the walk, Submit's refusal, the deck's *Missing* |
| `GAP_OPTIONAL` | fillable but never owed | — |
| `GAP_FILLABLE` | `GAP_FIELDS` **+** `GAP_OPTIONAL` | which cells open in fill mode, on the screen **and on the server** |

**`GAP_FIELDS` is the floor of `GAP_FILLABLE`** — counted-and-not-fillable would
be a red count with no control behind it (§223), and fillable-and-not-counted is
the ordinary case.

### 1.1 · §205 is the lesson everything after it pays

§187 stopped collaborators counting as missing — *"a tactic with nobody
supporting it is a tactic ONE person owns"*, which is a complete way to write a
line — and it did so by **emptying the one list the server also reads**. So the
screen went on opening the cell and **every save of one was refused**: a BU owner
met a refusal among rows that were accepted, with nothing on the page explaining
the difference.

> **Answering "should this be counted?" by deleting it from the list that
> decides "may this be written?" is how a screen comes to offer what the server
> refuses.** `GAP_OPTIONAL` exists so the two questions can be answered
> separately.

§214.2 paid that lesson rather than repeating it: when Islam ruled that a
function's key objectives *"should not count as missing"*, they moved into
`GAP_OPTIONAL` instead of out of the shared list. §214.4 did the same when he
reversed §214 for the Overview.

### 1.2 · And the page had to stop saying the word

A red **Missing** over a count of nought is §177 with the sign reversed. When a
field stops being counted, `koReadBlock()`'s hardcoded red word had to go with
it — an em-dash, which is what the Weight column beside it already drew (§214.2,
§214.4).

---

## 2 · What is counted, and the one line that decided the biggest change

`GAP_FIELDS.tactic` is `["owner", "quarters", "outcome", "outTarget"]`.

The last two are **§249**, and they were left out of §248 deliberately, which
said whose call it was: *"one line and is Islam's to take."* §248's quiet default
answered a question about the **rollout** — the risk was noise, and 83 demo
tactics would have gained the red word overnight — not a question about the plan.

*"the tactics outcome and target are not counting missing in the units plans.
they should count as missing."* **Both**, because half a row cannot be said: the
target carries the arithmetic, the outcome names what the number is about.

**One line does four things**, all put to him with the arithmetic first:

1. the page says Missing where it said an em-dash;
2. every count and the Next-gap walk include them;
3. they become **fillable** (§205's floor rule);
4. **Submit refuses while any tactic still owes one** — the cost, and he took
   it.

**A target holding only a unit is still missing** (`GAP_NUM` +
`targetHasNumber()`, spec 031 §5), **and `outcomeOf` asks that same function**,
or the count and the score would disagree about one string.

**A tactic that names no quarter at all is a gap** (§128) — §119.1 was right to
leave a *single* blank quarter alone, because a tactic marked Q2 and Q3 is saying
something by leaving Q1 and Q4 empty, and that reasoning never covered a row that
answered nothing. The four columns stay as they are and **all four cells carry a
bold red mark**; §128.5 then made that mark a **`?`** rather than a `✓`, because
a tick in a Q column *means something on its own* — *this runs in this quarter* —
so painting it red asked the colour to reverse the mark.

---

## 3 · Who may fill, and how far

**The grant is per page and the reach is per row** (§177). There is no
per-project cell and there should not be one, so `mayFillRow()` is
`mayFillPage()` plus §147.7's `boundedReach()`, narrowing **only** when every
role granting fill here is a bounded one — a project owner, a pillar owner, a
contributor.

- Applied to a pillar owner too, unasked: *the rule is about bounded roles, not
  about projects* (§53.5).
- **A gap inside no row falls out closed on its own**, and `gapCell` defaults its
  context to *inside no row* — the safe way round.
- **`gapMap()` counts only what this viewer could close**, or the red button
  promises a field it will not open (§61).
- **No migration**: the mark rides `extra` on `outcomes` and `milestones` —
  claimed, then **proved by writing one of each against a real Postgres and
  reading it back** (§172).
- **The server's `gapRows()` reaches those rows BEFORE `splitRows` compares
  them**, or a fill falls through to `capPlan` and is refused as authoring; its
  context is built from the **stored** graph (§42).

**Proved able to fail three ways**, and the two REFUSED cases are the ones that
matter: they go green the moment `mayFillRow` is swapped for `mayFillPage`, which
is the only proof worth anything when a pre-change build refuses everything
anyway.

### 3.1 · The direction and the compile rule stay the office's (§249.4)

*"I viewed as Ali Reda from corporate, I can't adjust the direction or the
compiling. is that ment to be?"* It is: neither is a gap (both carry a working
default), so a filler writing one is **authoring**, the server refuses it, and a
save is all or nothing (§184).

**The grant decides, and it was measured rather than read off a screenshot** —
**view** draws read-only text, **fill** two controls and two read-only facts,
**edit** all four. So there is no defect; somebody who needs those two is given
Edit.

> *My first reading came from a screenshot of a tenant I cannot see and Islam
> corrected it. The answer only became worth trusting when it came from the
> rule.*

**The cost was stated before he chose**: the direction stays `≥`, so a *less is
better* outcome scores backwards until the office corrects it, and a blank
compile compares against the whole year. He kept both the office's, consistent
with §99.8 — *how a thing is measured is a plan decision, not a reporting one.*

---

## 4 · The door, and the walk

**The whole missing bar lives in the section row** beside Foundation · SWOT ·
Plan, read mode included, with nothing in the page body and the Strategy tab's
number gone (§145.14). The total as *"N Missing"*, one red chip per owing place,
and a solid red **Fill in missing elements**.

- **Red means missing, amber means pending — never mixed** (§145.14).
- **A chip is a door that keeps fill mode on**, and it carries its **own**
  rail-and-code pair (`data-gplace`), because on a function's projects page every
  capability is drawn at once and the first gap on the *page* belongs to another
  pane (§177.2).
- **The walk follows whatever the bar is counting** (§192.4): the question is not
  *is this field counted* but *is this one of the fields the bar in front of me is
  counting*, worked out once per paint in `GAP_MODE` and reset beside `FIELDS`.
- **A real press is not a programmatic one** (§145.14): §30.1's `CLICKING` guard
  holds the paint until the click lands, so the walk read the read-mode page,
  found nothing and marched off through another place's chip — invisible to every
  evaluate-driven probe. It queues behind the release timer.

**§192.4 is the fault this rule exists to stop.** *Next gap* reached two of five
places and stopped — and it was never stuck: it walked every field it had
**marked**, and in that pillar it had marked six while the band counted one. Five
were collaborator pickers. §187 moved the count and did not move the walk, so
every press was spent on rows nothing was asking about and the presses ran out
before three more pillars. **The count and the walk are one list and they had
stopped being one.**

**§177.2 — five faults, each hiding the next**: the walker asked for an element
*type* so §177's month picker (a button) was invisible; an author's fields were
never marked at all, so Next gap had never worked for the office; it used
`document.activeElement` as its cursor and the press moves focus to the button;
it asked `RAIL`, which holds only what somebody *picked*; and a chip lit the
first gap on the page rather than in its own pane.

---

## 5 · The door with no count (§223)

*"Hala from CX can't fill the missing definition"* — the Definition an em-dash,
no control on the page. Measured: `mayFillPage` **true**, `gapTotal` **0**,
**not one fill control drawn**. Her permission was never the issue and the server
accepts the save.

**This is the unstated cost of §214.2 and §214.4.** Both took fields out of the
counted list at Islam's direction and both carefully left them fillable — and
nobody asked how they would then be **reached**, because fill mode is entered
from a button drawn from the counted total. *A page whose only blanks are
optional had no door at all.*

`gapOpenable()` counts fillable-and-blank and decides the **door**; the red count
and the chips still come from the counted total, so a bar with nothing owed
carries no number, no chips and the words *Fill in what is empty*. **The walk
stops offering a next gap that is not there.**

**And `fn-pillars.py` asserted the bar was ABSENT** — the exact state Hala met —
so it was rewritten to assert no count, no chips, and a door (§218).

---

## 6 · Empty is not missing, and the bar now says which (§272)

*"mobile keeps showing filling what's missing while we can't find something
missing and there is no the side badges that identify where the missing part
is."*

**Reproduced by making the state, not by reading the code**: with every counted
gap on Mobile filled and the collaborators left alone, `gapTotal` is **0** and
`gapOpenable` is **22** — §223's door drawn with no count, no chips and no rail
marks, because all three read `GAP_FIELDS` and there is nothing in it. His Care
screenshot named the cause without guessing: the **COLLABS.** column, an em-dash
on both tactics.

**Both halves were behaving as decided and nothing joined them up** — §187 ruled
a tactic nobody supports is not missing, §205 kept the box fillable, §223 drew a
door from that second list and stopped at the door.

**The office is not shown it at all**, which is the half that answers what he was
looking at: `mayFillPage` refuses the office outright (their write settles, so
they hold the pen), and with nothing owed the door is a second way into a page
they can already edit, wearing a word that does not apply to them (§94.15).
`seesEmpty()` sits beside `seesGaps()` and is **asked before the count is
taken**, so the office does not pay for a walk of the subject to be told about a
bar they will not see.

**The filler's bar is the same bar in a quieter voice** — a count, a chip per
place, a mark per rail row — through `missBarCta(n, empty)` and **one**
`missBar()`, never a second builder.

- **Grey, never red and never amber**: §145.14's rule kept rather than bent,
  because a tactic nobody supports is a fact on a healthy plan (§187's own
  reasoning, §41's budget).
- **Nothing about counting moves** — no score, no average, nothing Submit
  refuses, nothing the deck marks — which is why §187 and §214.2 stand untouched
  underneath it.
- **The box is not rung in red either** (`eqfld` overrides the colour and not the
  dash): one screen cannot say *Missing* and *empty* about one box.
- **The refresh reads the mode off the band**, never re-derives it: on a quiet
  bar `gapTotal` is 0, which is what a quiet bar *means*, so re-asking it would
  flip every chip to the green tick over a page still full of empty boxes.

**§272.7 — and the second copy of the button was still red**, found by *looking*
at the built page with every assertion green: §145.14 draws the door in two
places and the quiet register had reached one. The check asks **every** element
carrying `data-fillcta` now, because a count of doors is what survives a third
one being added.

**§272.8 — §93.11 was earned twice in one CSS comment.** The `eqfld` rule
provably matched and provably did nothing: first because a paragraph sat *after*
the comment's closing marker, then because the sentence recording that **quoted
the closing marker literally, which ends a CSS comment wherever it appears** — so
the same rule was eaten by the note explaining why it had been eaten. Both times
`document.styleSheets` named it in one run where reading the cascade would not
have.

**Recorded, not done, and measured**: a supporting function's Projects pane gets
the bar and the chips and **no rail mark**, because the two rails already
disagree about scope — a unit's counts what its chip counts, a function's counts
the project's front matter where its chip counts the project plus its outcomes
and milestones — and straightening that changes a number already on screen.

---

## 7 · Submit, and where it is held

### 7.1 · Five reasons, all said before the press (§221)

`owed` (rows asked with no figure) and `gaps` (what the plan still lacks) joined
the three that existed.

- **The gap count ignores the viewer.** `gapMap()` is scoped to what the person
  could close (§177) — right for the counts they clear and **wrong here**, or a
  unit head submits past holes only the office can fill, because to them it reads
  zero.
- **`aria-disabled`, never `disabled`** — a disabled button takes no focus and
  the reason opens on hover *and* focus (§163). The click handler still refuses,
  so the hover explains rather than enforces.
- **One list of reasons behind both wordings** (`submitWhyShort` for the bubble,
  `submitRefusal` for the banner), or the control and its explanation disagree
  about why it is shut.

### 7.2 · A closed report is closed (§220), and a draft can still be sent (§263)

**Measured first: nothing was ever locked** — after Submit all 12 figure boxes
and the note stayed editable, so a report could change after the office received
it. `REVIEW.parked` joins `submitted` in the authoriser's per-target list; **one
Reopen for both**; **disabled, not only dimmed** (`pointer-events:none` is a look
and the keyboard walks past it) and **readable**, because reviewing a closed
report is most of why anybody reopens it.

**§263 does not reverse it and the difference is the point.** *"on saving the
draft keep the submit to smo button there."* The report stays locked until Reopen
— `editable 0 of 25` before and after, measured — and what changes is which
controls the **bar** draws: submitted offers Reopen alone, parked offers Submit
beside it, open is unchanged. **One Submit button, written out once**, because
the thing that must not differ between the two bars is §221's gate — and the
check asserts the **pair**, the button back AND still shut, since a build
satisfying only the first is the dangerous one.

### 7.3 · The page says where it is held (§279)

*"the reporting is not submitting to the SMO as there is someting requires a note
but I can't find it."*

**Reproduced before anything was proposed**: 17 of 17 entered, the plan owing
nothing, the gate held by **one row** (`notes:1, pending:0, owed:0, gaps:0`).

**The row IS marked** (§105's red edge and rung note box) — and **a unit's page
draws ONE pillar at a time**, so it was not on the screen, while the banner above
counted it and named no place.

**The rail was worse than silent**: the pillar holding the report up wore a
**green 4/4**, because that tally counts figures *entered*, and the line that
would have said *Complete* is not drawn at all (the rail ships collapsed, §119).
*The one thing on the page that lists the places was saying "nothing left here"
in the platform's own colour for it.*

**And one side of the switch had nothing at all**: a capability function's page
has never drawn a note banner and `capNoteBox()` passes `want:false` always, so
its Submit was refused with the reason on a hover and not one mark on the page.

Islam chose **C** from three drawn in the running platform: **it is §272's bar,
class for class** — a count, one chip per place, a walk — because a custodian
already meets that control when a plan is short. **What is not shared is the
code** (that one walks a plan in fill mode keyed on `EDIT_PAGE`), so the shape is
shared through the CSS and the cursor through `gapLight()`, with the two field
lists disjoint.

- **One row is one thing to fix, so the bar counts ROWS and the hover counts
  REASONS**: a row that said *In progress* with no per-cent is both unanswered
  and pending, so the gate names it twice — correctly, in two sentences — and a
  bar adding those up would say *"4 to finish"* over three boxes.
- **The plan's gaps are counted here and filled there** — leaving them out would
  read *nothing to finish* over a shut Submit — so that chip is a **door** to the
  Strategy tab and no walk is offered when it is all that is left (§223).
- **The marks are put on in one place** (`repMarkControls()`), driven from the
  **controls** so no id is escaped into a selector and no builder needs a flag
  threaded through it.
- **§279.1** — the chip was addressed by the word on the page: `pillarCode()`
  renders **BE03** and the rail matches `p.code` (**M03**), so the press set the
  rail to a code no pillar has and looked exactly like a dead button (§48).
  Invisible on any tenant where the two coincide, which is why the check asserts
  they **differ**.
- **§279.2** — a red word on a rail is **type**: `--bad` measures **4.49:1** on
  the rail row's ground in dark (§38.5, eighth time), and it was already there.

---

## 8 · What the server has to agree about

A fill is judged by a **gap pass** ahead of the ordinary diff, classifying
fill / amend / unfill / confirm against a **clone**, with everything else falling
through office-only (§145).

**§249.2 — a value that is still a gap is not a fill.** §248 lets the unit be
chosen before the number, so `outTarget` holds `"%"` on the way to `"90%"` —
non-blank and still empty by the gap rule. The first build **stamped** it (and a
marked field reads as *answered*, so the row would have left the count, the walk
and Submit's refusal with an unusable target) and the server **refused** it. The
mark is written only for a value the platform can use; *a gap moved to another
gap is the filler's, and nothing is gained by it.*

**§249.3 — key order is not content.** The gap pass clears by **assigning** onto
the stored clone, which appends a key the stored row lacked, and `same()` is
stringify-based — so two fills of absent keys in one post leave the clone
spelling the row differently, the residual diff calls it `unitPlan`, and the save
is refused. **It predates §249** and was measured on the build before it; §249
makes it the **common** case, because §248's five fields are absent on every
existing tactic and two of them are what a filler is now asked for — *the outcome
and its target, filled together, would have been refused every time.*
`sameCanon` generalises §145's marks comparison to the row, and the guard is the
safety argument: it only re-spells rows whose **content** is already identical,
asserted with a rename and a direction change smuggled in beside the fills and
still refused.

**§184 — and a refusal costs the row it named and nothing else.** See spec 032
§7: the verdict carries an address, and the banner offers to put back the refused
rows and save the rest.

---

## 9 · Requirements, as things that can be checked

- **R1** `GAP_FIELDS ⊆ GAP_FILLABLE`; a counted field is always fillable.
- **R2** Screen and server read the same three lists (Principle IX).
- **R3** A page with nothing owed and something empty draws a door, no count and
  no chips.
- **R4** The office is shown no fill bar at all.
- **R5** The walk visits exactly what the bar in front of it is counting.
- **R6** A chip goes to a place, addressed by the **stored** code, not the drawn
  one.
- **R7** Submit's bubble and its banner give the same five reasons.
- **R8** A submitted or parked report is genuinely uneditable; Reopen unlocks
  either.
- **R9** A parked report keeps Submit **and** keeps §221's gate.
- **R10** Filling a field that is still unusable is not stamped and not accepted.

---

## 10 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| The feature itself | §145 | `checks/gap-fill.py` |
| Fill reach per row | §177 | `checks/milestone-fill.py` |
| The chips and the walk go somewhere | §177.2, §192.4 | `checks/gap-walk.py` |
| Counted vs fillable, the door | §205, §214, §223 | `checks/fn-pillars.py` |
| Empty is not missing | §272 | `checks/empty-not-missing.py` |
| Submit's five reasons; the lock | §220, §221, §263 | `checks/submit-gate.py` |
| Where Submit is held | §279 | `checks/report-blockers.py` |
| A refusal keeps the work | §184 | `checks/refusal-keeps-work.py` |
| The unit before the number | §251 | `checks/unit-before-number.py` |
| The server's gap pass | §145, §249 | `scripts/test-authorize.js` |

---

## 11 · Open, and recorded rather than done

- **A capability function's note boxes are still drawn with `want:false`**, so
  the box the bar sends you to is not itself rung on that side (§279).
- **A function's Projects pane gets the bar and the chips and no rail mark** —
  the two rails disagree about scope, and straightening it moves a number already
  on screen (§272).
- **The two rails' disagreement itself** is recorded and unresolved.
- **In fill mode below 1000px the tactics table runs past its pane** (20px at
  1000, 120px at 900, 45px at 768) — it scrolls rather than clipping, every
  control was driven and writes, but §158's rule is *fit, never "and it
  scrolls"*, and every way of reclaiming the width changes a control's drawn
  shape, which wants a mockup (§249.2).
- **The plan deck has no column for a tactic's outcome or its target**, so
  §119's *the deck names what the plan owes* is true of six of a tactic's eight
  facts and not these two (§249).
