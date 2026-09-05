# 037 · Authoring a plan on the screen

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §31 · §35 · §61 · §71.2 · §96 (+.2 –.6) · §114 (+.4) · §130.1 ·
§158 · §189 · §194 · §226 · §227 · §228 · §229 · §232 · §233 · §260 · §267
(+.1, .2) · §268 · §269 · §270 · §271 · §281 (+.1, .2)
**Constitution:** checked against v1.2.0 — Principles VI (follow what the
platform already does), IX (one copy of a rule), XIV (a class name is one global
namespace) and XV (typing never repaints, and a repaint never moves the page).
**Related:** spec 020 (building a plan on the platform — the flow that creates
one), spec 012 (one table standard), spec 023/035 (filling), spec 031 (what the
fields mean).

---

## 0 · Why this document exists

Spec 020 specified **creating** a plan. What has no spec is **editing one** —
the pen, the tables it opens, and the rules that keep a half-typed sentence
alive while the page around it repaints.

It is the surface the office spends most of its day in, and its record is
sixteen sections that read as unrelated layout fixes. They are not: they are one
argument — **the platform writes as you type, so every control has to survive a
repaint that can happen at any moment** — and a second one about width, because
a table full of controls cannot shrink the way a table full of text can.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · The three rules everything here obeys

1. **A field writes on `change`, i.e. on blur** (§35). Nothing is posted while
   the cursor is in a box, which is why §219 blurs before leaving and why a
   button pressed with the mouse works at all — the click blurs on its way past.
2. **Typing never repaints** (§71.2, Principle XV). A bound `data-fld` handler
   writes **without** calling `paint()`. Everything that needs to change on the
   screen while somebody types is rewritten **in place**.
3. **A control must be wired by whoever destroys it** (§29.5, §47.2). Any
   function that replaces `innerHTML` re-wires what it replaced, in the same
   function.

Every fault in the rest of this document is one of those three, arriving
somewhere new.

---

## 2 · Prose you can read while you edit it (§189)

*"wrap the content of the plans edit boxes across pillars and functions,
specially for the titles and descriptions."*

**Not a bad wrap**: every title and description was `inputOr()`, and **an
`<input>` is ONE LINE by definition**, so a long title ran off the end and you
scrolled sideways inside it. Measured with the pen open: 4 of 23 clipped at 1440,
8 at 1100 on a unit's Plan; two Descriptions clipped on a function's Projects in
the demo's **own** data.

- **`textOr()` is its own builder, never a flag on `inputOr`** — which fields are
  prose is a decision per call site (an owner is picked, a target is one value),
  and guessing by class is how a target becomes a paragraph box.
- **A growing box, not a taller one**: `fieldOr()`'s two rows is too many for a
  short title and too few for a long one. `growFields()` runs at the end of
  `paint()`.
- **Enter still blurs** — a plan row's name is one line of prose however long
  (§229 below is where that promise was finally kept).
- **And it broke §114.4**: `display:block` took the whole cell and pushed the
  remove **×** onto a second line. `inline-block` restores it — **found by
  `checks/plan-fields.py` going red, not by reading the cascade**, which is the
  argument for that check existing.

**§260 — a title is one line, and the box was the only place that said
otherwise.** A screenshot of a client's plan with the pen open: a tactic's name
box **643px tall holding one sentence**.

> **Nothing was wrong with the box.** §189 sizes a growing box to what is in it,
> and what was in it was **blank lines** — thirty of them reproduce the
> screenshot to the pixel.

**Invisible everywhere else**, which is why it reads as a sudden layout fault:
the same row is **42px** in reading mode because HTML collapses a break, and the
deck and both workbooks print these on one line — *so a value carries them for
weeks and only the pen shows it.* Two routes, both measured: Enter added one per
press until §229 stopped it, and a **paste**, which §229 does not reach.

The rule is about the **value**, so it is `SMPRules.oneLine()` (§42), and
**`.grow` is the decision** — §229 drew that line for Enter and this uses the
same one, so a rows-2 paragraph box is untouched and there is no second list to
forget. **Three touches, three reasons**: `textOr()` draws one line whatever is
stored (which closes it for good — it does not care how the breaks got there);
the commit stores one line **and writes it back into the box**, because seeing
the lines close up is the explanation (§124); and a **one-off heal** of what a
tenant already holds, or the workbook, the archive and every export go on
carrying them.

**It could not be a `.sql` file**: a pillars function's plan is one JSON blob
(§118) and a tactic's description and outcome ride in `extra` (§248), so the
fields sit at four depths in three shapes — and a blanket replace over the blob
would flatten the paragraphs. **Archives are deliberately not touched** (§22,
§49.2: a record somebody tidied is no longer the record).

**Proved able to fail both ways** — heal stubbed **14 red**, heal made
over-eager **3 red and all three are the paragraphs**, which is the worse failure
and the one a one-sided check would have applauded.

**§271 — and the reporting note had one line to say it in.** §189's fault on the
one field the platform **requires** (§105): the box was an `<input>`. Measured
with a real off-track sentence: **404px shown of 1334 needed** at 1500, **209 of
1334** on a supporting function at 1100. **Enter is a newline here, which
reverses §229 for this field alone** and needed no code — that key handler lives
in the `[data-fld]` branch these fields do not pass through — with **both ends
asserted**, because a title and a note now hold opposite rules one class apart.
**And the break must survive being read** (§161.3): `white-space:pre-line`
through **one builder** for all six places that print a stored note.

---

## 3 · Enter commits a one-line prose box (§229)

Found during §231's audit: **§189's own text promised *"Enter blurs, which is
what commits"* and no code ever carried it out**, so Enter inserted a newline
into every growing title box.

> **A comment can describe an intention the code never carried out, and nothing
> in a build compares the two** (§104.8's family).

One listener in the shell's `data-fld` textarea branch, **gated on `.grow`**
(§104.7 — no list to forget); a `rows="2"` area keeps Enter as a paragraph key;
**blur, never a synthesised change** (§219). **Nothing stored is scrubbed** —
which is the bill §260 later paid.

---

## 4 · The editing head, and the width the controls take

**§194 — editing keeps its head, and the name gets the line.** *"when I edit a
plan or a pillar it loses its design and the name box becomes very small … on
scrolling down I can still see that save button."* Measured on Mobile's plan at
1500px with the pen open: the name box **228px in a 1225px pane** (19% of the
line), and at 480px of scroll the code, the name and the Done tick all off screen.

> ***"Loses its design" is exact**: reading has pinned `.pane > .pband` since
> §53.7 and editing, which REPLACES that band, pinned nothing — the mode you
> WORK in was the one that lost the page's identity.*

`edhead` is a marker, not a style; reading's band is untouched (§53.5: two modes,
two questions) and the editing head takes **the same sticky offset**, so
switching does not jump. **Not a negative margin** — §121.2's fault is a
*non*-sticky row pulled under a pinned one; this whole row pins.

**The name had no width to grow into**: §189 made it a growing box and the code
and box shared an `h3` in a shrink-to-fit column — the column flexes now and it
is **228 → 1101px**. *A growing field in a container that does not grow is a
fixed field.* **§228** is the same repair reaching a project's `edband`: 181px of
1223 and three lines → 85% and one.

**§226 — a function's objectives are written at the page's width.** Three of four
reported faults are ONE omission: the function Overview's `capKoEdit` edited
inside the half-width card — Objective input **101px**, Dir. select **34px** at
1500px — and §96.6's band, §199's Unit column and §189's wrapping prose had each
reached the unit's table and **never this one**. In edit/fill mode the table
takes a band under the cards, **on both formats** (§53.5); reading mode keeps the
card. **Led by opens for the office through the register's own door**
(`assignPicker` writing `FUNCTIONS[k].head` via `grantPersonRole` — §33, one fact
one door), and **the unit side is untouched at Islam's instruction, asserted as a
measurement.**

---

## 5 · A control does not shrink, so the prose pays for the window (§267)

With the plan's pen open, **five of a tactic's seven columns hold controls** and
their **666px is the same at 1920 and at 1100** — so every pixel the window loses
comes off the two **prose** columns, which are the only elastic thing in the row.

Measured: the Tactic column **269 → 192 → 115 → 74px** at 1400/1300/1200/1100,
the tallest row **191 → 1957**, and at 1100 the table stopped fitting its pane at
all (§158, silently).

> **Read mode has none of it** — its seven columns are all text, so they shrink
> together — *which is why four versions of sweeps at 1440 walked past it: the
> tables are walked, and they are walked CLOSED.*

**What folds is a control, so it cannot be a media query.** A query hides a
column; it cannot move one. Drawing the tail twice so CSS can pick a copy puts
two things in the document writing one field (§53.5, §96). `tailFolds()` is read
while the row is **built** and is **one answer for the whole table** — the head,
every row and the Add row's span, or they disagree about how many columns there
are.

- **A render decision has to hear the window change, and a zoom is a resize** —
  which is what was reported. Repaint only when the answer **flips**, armed once
  (§24, §47.2), and **never under a typing hand**.
- **A heading is a control's name.** *"the collab and the quarters to lose their
  haeders"* — right for the width, and a column head is the accessible name of
  every cell under it, so the word moves **onto** the control (`aria-label`,
  `role="group"`) rather than back onto the page (1b-ii).
- **Drop a floor that never bites**: the mockup carried a `min-width` on the
  prose columns; with the fold and the stack in place the Tactic column is 247px
  at a 1000px window on its own, so the floor would only be a thing to explain
  later (§2b).
- **A fixed rail beside a squeezed table is the first thing to spend** (§267.2,
  amending §162): 196px of fixed width plus a gutter, beside the table through
  the whole band where the prose columns are collapsing — *the list is taller
  than the pane it is narrowing.*

**§267.2 — a box sized at paint time clips on a resize.** A growing field is
sized by **measuring** its text (§189) at the end of a paint, so a window that
narrows without crossing a repaint threshold leaves the box holding a height
measured at the old width. **Only ever on a resize**, which is why nothing saw
it: opened at 1000px, **0 of 15** boxes cut; **narrowed** to 1000px, **9**.
*Assert it by narrowing, never by loading, or the check passes on the broken
build.*

**§267.1 — a fix for the stripe is not a fix for the hover.** §73.2 gave the two
frozen columns `background:inherit` so a striped row is striped all the way
across, and answered the stripe only: `tbody tr:hover > td` is outranked by it,
so a hovered row went grey **except its first two cells** — measured, `#EFF2F6`
against `#FFFFFF`. **Older than the fold and measured identically on the build
before it**; what the fold changed is that a sliver became a slab.

---

## 6 · One pen, on the section line (§268), and one press (§269)

*"the edit button of the plans can you make it in the same line of the foundation
sowt and plan?"*

**Half of it was already there**: with the plan open the line rendered *Done
filling* — the wrong word for the office, who are **editing**, and **undressed**
(`background: rgba(0,0,0,0)`, `border: 0`), because `.tabs button` (0,1,1)
outranks `.editbtn` (0,1,0). §145.14's own trap on the one control it missed.
**What was missing was the way in.**

**The pen was never in one place** — 234 · 233 · 236 · 308 by section, and
Marketing drew **two** (one below the fold). **One map, read by the pen AND by
the fill bar**, and it fixed a bug nobody had reported: `fillPageForSec()`
answered `foundation` for a pillars function's Overview while §213 made that page
read `capfoundation`, so its red button set a flag nothing acts on and opened
**0 fields** — rendering perfectly (§96).

- **Which pen a section has and which gaps it can fill are two questions** —
  collapsing them handed the bar `analysis` for the SWOT, a page no fill grant
  reaches.
- **The pairs are the ones the old controls asked, to the letter**, so nobody's
  rights move.
- **One tail**: `.missbar` already carries `margin-left:auto`, so a second
  right-aligned group strands the red button mid-row — drawn, looked at, thrown
  away.
- **Arrange stays in the pane** — §101's arrows go to somebody who may reorder
  and **not** author, so the slot is never shared.
- **Not `Save`** (asked, answered, recorded): the platform writes as you type, so
  the word would say the work is lost until pressed (§124), and *Save draft* is
  taken (§87).

**§269 — one edit, one done.** *"the edit opens all so I don't need to edit each
tab and then save for each — it's one edit and one save?"*

**What was there was worse than three presses**: `EDIT_PAGE` is per **section**
and `leaveModes()` clears it on a tab or destination change and **not on a
section one**, so opening Foundation and walking to SWOT left it **open** with
the line reading *Edit*, and opening the Plan too gave `["foundation","plan"]`
whose one control could only close the section you stood on.

> **A control whose word is true of one section and false of its neighbour is not
> a control anybody can trust.**

The mode is the **tab's** — one press opens every section, one closes them all —
filtered to **only what this person may author**. *And the first draft of that
comment was FALSE*: a unit's three pages all resolve to `unit_strat`, so over
every person × unit **not one pair differs** — the filter earns its place on a
**function**, whose Overview asks `k_found` and Plan asks `u_plan`.

**And §268 had taken the filler's way out**: the bar draws *Done filling* only at
zero gaps, and §268 removed the corner copy — so a custodian with anything
missing could leave fill mode only by changing tab (§61, *introduced by the
section removing a duplicate*). **Found by `gap-fill.py` timing out, not by
reading.** And the §268 sweep missed it **because it grepped the wrong word** —
the filler's control is a `.fillcta`, not a `.penbtn`: *§51.11 means grep for the
CONTROL, and a control that moved has more than one class.*

**§270 — the screen asks the column the save asks.** §217 fixed the **server** —
a supporting function's plan is judged by the **function's** Strategy column —
and the browser went on passing the raw unit keys at ~20 call sites. Measured:
**0 disagreements and 0 answers moved on this tenant** (both columns hold one
value for every role); set them differently, which is what §117's split is for,
and **6 people** get a pen the save refuses or are refused one it accepts.
**Resolved in the wrappers, not at the call sites**, so a twenty-first cannot
forget — and **the falsification is the point**: with the fix reverted the
shipped tenant still passes all 264 person × function pairs, and only the
constructed divergent tenants go red (§94.2 in its purest form).

---

## 7 · Removing a row, and hiding one (§232, §233)

**Removing a pillar or a project** is a worded quiet-red control **in the pinned
editing head**, drawn only while the pen is open, opening the platform's own
confirmation — what the thing holds, what has been reported against it this
cycle, and the way back.

- **Archive first, always** (§49.2's rule with a third caller, through the same
  `archiveUnitPlan()`/`archiveCapPlan()` the import and Clear plan take).
- **Never renumber** — ids are what figures, focus marks and snapshots key on, so
  the survivors keep theirs.
- **The server needed nothing** (§42's fall-through already makes a structural
  plan change the office's).
- **And the way back was broken for every pillars function**: `restoreArchive()`
  resolved a "unit" archive through `UNITS[a.key]`, and a pillars function's
  archives are keyed `fn:<key>` — **un-restorable since spec 010**, found only
  because §232's confirmation *promises* the way back.
- `.rmplan`, never `.rmbtn` — that word is taken (§65.9).

**§233 — hiding an element from the presentation.** Islam's three decisions:
**hidden is NOT counted** in any score; **rows only** (never a pillar, a
capability or a project, so a whole slide cannot disappear); **the workbook
carries the mark**. One predicate — `SMPRules.isHidden`/`shown` — runs every
reader that averages, asks or counts, *because not counted means not asked and
not owed, or the product argues with itself*. The mark rides `extra`, stored as
an **absence**; the eye toggles it (lit on the attention ground — a decision, not
a warning); read mode wears *"Hidden — not counted"* for everyone; and every row
sheet gains a **Hidden** column **at the end**, because a validation range is a
POSITION (§65).

---

## 8 · A milestone's collaborators (§227)

*"add collaborators beside the owner column similar to the collaborators in the
tactics."* Aligned first, and **both decisions are Islam's**: being named is a
**reporting right** (the word means on a milestone what it means on a tactic),
and the column shows **everywhere the tactics show theirs**.

**Every accumulated tactic rule moves over rather than being re-decided**: ticked
from the register (§130.1), fillable while empty and never counted (§187/§205 —
the field joins `GAP_OPTIONAL.milestone` so screen and server answer together),
emptied key **deleted** (§50.6), em-dash for nobody (§15.1).

**One rule, not two**: `namedOn()` always read owner + collaborators; only
§147.8's derivation stripped the milestone to `{owner}` — **the row travels whole
now**. **The workbook carries the column or the round trip drops the names**
(§22), proved a fixed point. **The header is "Collabs."**: the full word cost a
515px pane 11px at 830, found by `table-fit.py` going red.

---

## 9 · The fault was not the duplication (§281)

*"let's tidy things."* Three functions were declared **twice** in the sources,
all three already on `main`.

**Two were harmless and one was not**: `capsReachable()` had **two different
bodies** — one passing `reachesCap` the capability's **id**, one the **object** —
and `reachesCap(cap)` reads `cap.fn`. The later declaration wins by hoisting, so
the product was right; **measured before anything was deleted, the live body
returns 8 capabilities and the dead one returns 0.**

> **One edit — a reorder, or deleting the "wrong" copy without checking which is
> which — and every capability is unreachable for every viewer, gone from the
> navigation and every page that lists them, silently.** §56.7's shape with a
> longer fuse.

**Deleted by named function and matched text, never by line range** (§214), and
of the twins the **second** went, because the first sits under the comment that
explains it. **The scan is the deliverable, not the three names** — the whole
tree now has no duplicated top-level declaration.

**§281.1 — the wider scan found a block, not a line**: six duplicated top-level
`var`s in `config-render.js` are ONE 26-line block copied at a constant offset of
351 lines, values identical and only the comment prose differing. **Recorded and
deliberately not removed** — different file, different shape, behaviour-neutral,
and rule 1b flags rather than folds in.

**§281.2 — and a check was red on `main` for somebody else's decision**:
`fn-pillars.py` asserted a unit's Objectives sheet was *"exactly what it was, plus
§233's Hidden"* and §278 had **appended Jan–Dec** to it, so it had been failing on
a build behaving exactly as decided. **Rewritten, never loosened** (§218): the
months asserted **in order and at the end**, because §65 makes a column's
position what the workbook's validation ranges are built from.

---

## 10 · Requirements, as things that can be checked

- **R1** No bound field handler calls `paint()`.
- **R2** Every prose field is a growing textarea; every one-value field is not.
- **R3** Enter commits a `.grow` box and inserts a newline in a `rows="2"` one —
  both asserted.
- **R4** A stored value carrying blank lines draws on one line, on a unit and on
  a function.
- **R5** The editing head pins at the same offset as the reading band.
- **R6** Above 1400px the plan table is byte-identical to what it was; below it
  the tail folds, and **both controls are still reachable inside the name cell**.
- **R7** Narrowing the window re-fits every grown box; asserted by narrowing,
  never by loading.
- **R8** One press opens every section the viewer may author, and one closes them
  all.
- **R9** A filler always has a way out of fill mode, gaps remaining or not.
- **R10** Removing a pillar or project archives first and renumbers nothing.
- **R11** The source tree has no duplicated top-level declaration.

---

## 11 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| Prose fields, the remove × | §189, §114.4 | `checks/plan-fields.py`, `plan-wrap.py` |
| Enter commits | §229 | `checks/enter-commits.py` |
| One-line titles, the heal | §260 | `checks/one-line-titles.py`, `scripts/test-one-line-heal.js` |
| The reporting note is prose | §271 | `checks/report-note-wrap.py` |
| The editing head | §194, §228 | `checks/plan-edit-head.py` |
| A function's objectives | §226 | `checks/fn-ko-edit.py` |
| The narrow table, the fold | §267 | `checks/plan-tail-fold.py`, `table-fit.py` |
| The pen on the section line; one done | §268, §269 | `checks/plan-edit-line.py` |
| The screen asks the save's column | §270 | `scripts/test-authorize.js` |
| Removing a pillar or project | §232 | `checks/pillar-project-remove.py` |
| Hiding a row | §233 | `checks/hide-element.py` |
| Milestone collaborators | §227 | `checks/project-tables.py` |
| No duplicated declarations | §281 | `checks/duplicates.py` |

---

## 12 · Open, and recorded rather than done

- **`config-render.js` still carries §281.1's duplicated 26-line block** —
  behaviour-neutral, recorded, and not removed under rule 1b.
- **A project's drag grips are bound to nothing** (§99.6): `projPlanBody` defines
  `sortAttr()` and applies it to neither table. What a drop between the two
  halves means is a decision.
- **In fill mode below 1000px the tactics table runs past its pane** (§249.2) —
  every way of reclaiming the width changes a control's drawn shape, which wants
  a mockup.
- **A drag cannot auto-scroll**, and the row lags the pointer with no ghost —
  both true of every sortable table in the product, so closing either means
  changing `arrange.js` for all of them (§266.10).
- **An alt-enter inside a workbook cell still arrives** and is cleaned on the
  next commit (§260); cleaning it at the upload door would name the prose fields
  a third time in a reader that must not flatten a SWOT item.
