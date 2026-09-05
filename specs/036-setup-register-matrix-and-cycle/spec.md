# 036 · Setup: the register, the matrix and the cycle

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §37 · §55 · §89 · §92 · §93 (+.4 –.14) · §110 (+.1, .7, .8) ·
§116 (+.2, .4, .6, .9) · §122 (+.4 –.6) · §174 (+.1) · §175 (+.2) · §186 · §187 ·
§190 · §261 (+.2) · §273 (+.1 –.7)
**Constitution:** checked against v1.2.0 — Principles VI (follow what the
platform already does), X (the server decides), XIV (a class name is one global
namespace) and XVI (a check that measures the wrong thing passes).
**Related:** spec 011 (the BU list and the register as a file), spec 013 (who a
row is, and merging two rows that are one person), spec 018 (the Setup
makeover), spec 019 (the Strategy | Reporting split), spec 021 (the Setup header
line), spec 028 (History).

---

## 0 · Why this document exists

Spec 018 specified the Setup **makeover** — the rail, the grouping, the words.
What it could not specify is what those pages then became: the register stopped
being a form, the access matrix stopped being a matrix of pages, seats stopped
being an ordinary role, and the cycle — which had been written once and never
touched again — became editable while it runs.

That is the administration surface of the product: **who holds what, who is
notified about what, and what the office may change once a cycle is open.** It is
also where the most dangerous single control in the platform lives (granting a
Super user), and it had no spec.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · The register stopped being a form (§116)

Six asks from Islam, and **one thing follows from them that nobody asked for,
which is why they hang together: with editing, adding and the queue all in a
dialog, the table no longer edits anything.**

Every collision this register has had was a control clicked inside a 158px cell:

- §110.1's *+ role* under the frozen Cancel;
- §110.8's fields painting over their neighbours;
- the Add row's boxes under the wrong headings.

**Not one of them survives the move.**

- **The same `data-` attributes**, so moving the form changed where it is drawn
  and nothing about how it saves — but `fieldWire` and the control wiring now
  take a **root**, or re-running `wire()` binds a second handler to the page
  behind (§24, §47.2).
- **`paint()` repaints the dialog too**, one line at its end rather than one per
  handler: the dialog's controls are the register's and all end in `paint()`, so
  *+ role* pressed inside it changed nothing at all.
- **`NEWDRAFT` is a person before it is on the register** — not in `PEOPLE`, but
  `personBy()` answers for it, so Add and Edit are one form.
- **And the field being typed is committed before the press**: fields write on
  `change`, which for a text input means on blur, so the last box typed into has
  not been written when somebody reaches for the button. A mouse click blurs on
  the way past, which is the almost-always that hid it.

**§116.4 — a mark belongs inside the block it marks.** The declaration note, the
duplicate mark and the Official BU disagreement were each placed *next to* a
value, and `.val` and `<b>` are `display:block` under §88's clip rule — so each
put its row at 51px against its neighbours' 39px. Three times, in one section.
One glyph inside the value's own line, the sentence on the hover, the full words
in the queue: **`◎`** a declaration, **`‖`** a collision, **`≈`** a resemblance,
**`≠`** a disagreement.

**§116.6 — every way out of a dialog is the same way out.** The × and Escape
closed the overlay directly, which was fine when it held a wizard and not when it
holds a form with a row snapshot and a draft behind it. **And the body is emptied
on close**, or a form left in the hidden overlay collects a second handler on
every repaint, for ever (§3.2: hidden is not gone).

**§116.9 — a local alias is invisible from another file, and only over HTTP.**
`attentionOf()` spelt half its declaration sentence with `whereLabel`, which is a
**`var` inside `renderPeople()` in another file**. Every check was green: the
crash needs a declaration AND a register placement that disagree, which is
invisible over `file://` and short-circuits for anybody the register has not
placed — *and that was every person the queue's own check had made* (§94.2 from
the inside). **A sentence that names two places and compares them must spell them
the same way**, or a match reads as a difference.

---

## 2 · One entry per person, and it can be answered (§116.2, §190)

**The count and the queue are the same list.** The register used to carry six
alarm chips across its header, each naming a number and pointing at rows you then
had to find by eye — *"I don't know which lines I should go and check"*. A number
that cannot take you to what it counts is a number that makes work (§16.7).

- **One entry per person, not per problem**: somebody with no password *and* no
  email is one stop with two things to fix, because the dialog shows their whole
  row.
- **Worst first, then by name**, so it is stable between two people, **and it
  walks the list it started with** — fixing somebody removes them, and a
  recomputed queue renumbers under whoever is working through it.
- **Units with no custodian cannot join it** — not a person, so there would be
  nobody to open; that keeps its own chip on the row (§93.4, §122).

### 2.1 · Three kinds were a life sentence (§190)

*"attention items that stays attention item is a problem always give me the
option to dismiss and make gnerally the dismiss under the box with the issue and
mark the issue box with some sort of surrounding outline."*

Four of the seven kinds are answered by editing a field. **Three were not**: a
seat somebody meant to give, a row that never signs in, and two people who really
are two people (§87) — counting on the button, the Overview and the welcome
screen for ever with **no data to change that would clear them**.

> **A count nobody can get to zero is one people stop reading, and it takes the
> six that matter down with it.**

**A dismissal remembers what it answered**, which is the whole of why one is safe
to give. `attnMark()` fingerprints the **fact**:

| Kind | Fingerprint |
|---|---|
| a seat | `role@place` **and** where the person sits |
| no email / no identifier | the address and the employee number |
| a collision | who it is with **and what on**, sorted, so the same pair fingerprints identically from either row |
| a name that reads the same | the name itself, which is what amending it changes |

So dismissing *"they hold Super user"* says nothing about the **next** seat, and
moving the dismissed person brings the item straight back. §180's rule applied to
every kind at once.

- **Stored as an absence** riding `people.extra` — **no migration**.
- **Filtered in `attentionOf()` alone**, because the queue, the count, the
  button, the Overview row and the welcome screen all read through it.
- **The server needs nothing**: a non-seat, non-removal change to a person's row
  already classifies as `setup` (§42's fall-through).

**§116.2's band goes.** It said what was wrong *above nine boxes* and left you to
guess which — worst on the two items that name a place — and it was the queue's
alone, so anybody reaching the same row through *Edit details* was told nothing.
The sentence sits under the control that answers it, inside a ring on the
**whole field** (the label is what names the box), in the **warning** ground,
because outstanding is not broken (§168). **A kind no field answers is said,
never dropped.**

**And two of the check's own first failures were the check**: the stub answered
the wrong action names, so both server-backed kinds were reported as not raised
by a build that raises them perfectly. **Read an action name out of `sync.js`,
never guess it** — `people-dialog.py` carried the same two typos and its
assertions had been passing over an empty map since the day it was written.

---

## 3 · A seat is not an ordinary role (§186, §187)

*"hussein khaled is a custodian and getting the super user … you assured me that
it's impossible."* **It was not.**

The register's role picker is a plain `<select>`, and §92 grants a
**one-destination** role on the pick — a seat has one destination — so **the most
powerful grant in the product was a single `change` event with nothing in
between.** The people workbook's Role column is the same grant by another road.

**One line stood behind both**: `roleIsGrantable()` excluded only the derived
floor roles and said nothing about seats.

**The server was always right** (a seat move classifies as `access`, §89), so the
fault was the **screen offering what the save refuses** — and going through
instantly for the one person it does *not* refuse, which is §42's drift in the
worst possible place.

Now `roleIsGrantable()` asks `mayEditAccess()` **of the granter**, so the picker
and the template narrow together; and the Super user is **asked out loud**, with
the ask **naming the role and what it hands over** — the failure mode is landing
on the wrong line, and a confirmation that does not say which line catches none
of them.

- **The ask is state in the dialog's body, never a modal of its own** —
  measured: `openModalHtml()` was painted straight back over by the register's
  own repaint (§116.6).
- **Cancel restores the picker**, or a select still showing the refused value
  fires no `change` (§110).
- **`ROLE_BEARING_ROWS` widens §110**: a head is not stored *on* the unit, so
  Cancel restoring the row alone left the grant standing.
- **And the register watches**: a seat whose place is not where the person
  **sits** joins the attention queue, under a collision and above every gap.
  **The test is the PLACE, not "holds two roles"** — the bootstrap SMO holds
  super@group *and* heads the SMO function, so the other reading nags about the
  one certainly-correct row.

**§187 — a seat is granted and never derived.** *"level smo shouldn't be a super
user."* `personRoles()` read `p.level` (the pre-§33 field) beside `p.role`, so a
person carrying `level:"smo"` derived Super user **on the screen and on the
server** — one function, both sides — and an unrecognised key round-trips through
`people.extra` untouched. **Nothing had written it for fifty versions, which is
what made it dangerous**: an ungated fallback nobody was watching. Cost stated: a
row still relying on `level` with no `role` loses the seat and is granted again
on the register, which is where seats come from.

**§187 — and a count that cannot be quiet about anybody.** §186's queue is
deliberately silent about a seat held by somebody who sits at the group, which is
a hole, measured and stated before this was built. So the register carries
**"N people hold a seat"**, every holder on the hover, **always drawn** — a count
that vanishes at some number cannot be trusted to be complete, and this exists to
be the complete list. **Quiet, not amber**: the chip beside it is a warning, this
is a fact true on every healthy tenant, and alarm colours would cry wolf until
nobody read either. **Asserted as agreement with the register, never as a
number** (§94.8).

---

## 4 · The matrix: areas, not pages (§37, §174, §175)

§37 replaced 25 pages × 7 roles — **525 controls on one screen** — with seven
roles down and seven **areas** across: Group, own/other business unit, own/other
supporting function, Reporting cycle, Setup. **49 cells.**

- **Own is not a setting** — it is read from what each role is attached to, which
  is §33 from the other end, and it made *reaching* and *owning* stop being the
  same word: a company CEO who may see the other companies **reaches** those
  units without owning them.
- **None is not a third thing you choose, it is the absence of the other two**,
  so a cell is two toggles and nothing lit is itself the answer.
- Three cells became **rules** rather than settings (the knowledge base, plan
  correction, focus marks), because who reads the office's own working notes is
  not a tick somebody could set on a bad afternoon.

**§174 — a column a role could never hold is an option that means nothing.**
*"a project owner has options to edit or fill in a business unit."* Right, and
the **derivation** is what says so: `personRoles()` mints `powner` only from
`capabilities[].projects`, and a capability belongs to a **function**, so the
own-BU columns can never be theirs. The same look found the mirror — a BU owner
can never hold an own supporting function. Defaults were already `none`, **so
nobody's access moves; what goes is being offered a choice with nothing behind
it.**

> **And one of the two examples was wrong and is said so**: a `plowner` **is**
> derived on a function whose format is `"pillars"` (§59), so that cell stays and
> the check asserts it stays — a build that dashed the whole table would
> otherwise satisfy every assertion about absence (§113.8).

**§175 — who owns every place was two lists and they disagreed.** `roleOwns()`
said super and gceo; the matrix's `notApplicable()` said super and gceo; and
**neither said `smoteam`** — so an SMO team member owned nothing, read
`a_unit_other` for every unit, and their four *own* cells could never be
consulted. One exported rule (`ownsEveryPlace`) is asked by both sides now.
**SMO team joins them at Islam's direction**, and the effect is stated rather
than discovered: nothing moves on a default tenant.

**§175.2 — assert the agreement between the resolver and the table, not a list
of pairs.** For every role, which columns can `areaFor()` ever answer with, and
does the matrix offer exactly those? *Offered-and-unreachable* is a control with
nothing behind it; *reachable-and-not-offered* is access nobody can grant. Two
traps: a unit page asks the unit areas and a function page the function ones, and
**`roleWheres()` is not the authority for a derived role**. A role nobody holds
is **named as unmeasured**, never passed over (§54.5).

**§174.1 — a two-row head pins as a `thead`, not as cells.** Pinning the cells
needs a second `top` for the lower row measured off the upper, which is
§130.10's hole between two pinned things. §163.5 forbids pinning to the **page**
from inside an overflow box, not pinning to the **box** — so the box takes a
height and the head pins at its top. **The first build guessed 52px for the
legend and overran the window by 5px** — §122.5's fault committed while quoting
it.

---

## 5 · The Setup tables are arranged, and their rows act from one menu (§261)

*"allow me in the setup to rearrange the business units table so they appear in
the navigation as per this order and let's clean this table making a three dots
option to actions like the registry file."*

**Nothing new is stored, which is why it is small**: the order **is**
`UNIT_KEYS`/`FUNCTION_KEYS`, already written to `units.idx` and read back by
`ORDER BY idx`, and `lib/authorize.js` has always classified a change to it as
`setup` — so no migration, no schema change, no new rule.

**And it could already be done, just not where anybody would look**: the group's
Performance page has arranged these cards since §101, in its **card** view only.
Both stay, committing through one `applyOrder`.

- **A mode, not a permanent handle** — a stray drag here reorders the navigation
  for the whole tenant.
- **The filter and the sort go with the press, and that is not tidiness**:
  `tkApply` **hides** rows rather than removing them (they keep their `data-oi`
  and sit between the visible ones) and `tkSort` **reorders the DOM**, so either
  makes a drop land somewhere other than where it looks.
- **§93.14 had been carried out on one of two neighbouring pages** — it did
  exactly this to Functions and stopped, so a units row was **130px** where a
  register row is 39 and a functions row 37, all of it one cell stacking four
  controls. Table **1338 → 535px**, page **2265 → 646px**.
- **The menu's wording is the Functions page's, copied not composed**, less
  Delete — a unit is retired and never deleted, so §62 has nothing to refuse.
- **Companies had a refusal dressed as a fact** (a chip reading *"holds 3
  units"*): the entry is live and the press names what is in the way (§62); **no
  handle**, because a company has no order in the navigation.
- **The mark left the table at Islam's correction** — *"let the mark out of the
  table and only in the settings"* — and his answer beat the drawing: with no
  Mark column the table is still 1285 of 1285, so *Shown in the nav* keeps the
  column the mockup had proposed spending. The cost is stated: it was the only
  place answering *which units have no mark* at a glance.
- **One dialog, in the register's own markup** — `ROWDLG` is `PDLG` one table
  wider, made root-scoped because the body is replaced after `wire()` has run.
- **And it closed a trap §93.14 wrote about itself** — *"a hidden column renders
  nothing at all, edit field included"* — because a dialog draws every field
  whatever the Columns menu says.

**Four faults found by driving it**: *"3 pillarss"* (§107.8's own trap, by
somebody quoting it), the menu standing beside the dialog it opened, the three
dots not stepping aside while arranging, and *"IT Dist.."*, a list ending in a
name that already carries a stop.

**And seven of the check's own assertions passed vacuously** (§113.8: an absence
over an empty menu is not an absence; an undo is only evidence if something was
done; an agreement between two lists nothing moved proves nothing).

---

## 6 · Editing the cycle that is running (§273)

*"allow me to edit the cycle name. give me an edit button the cycle to edit the
date as you already built and the cycel name edit as well"* — then, of two shapes
drawn in the real page: *"keep the close cycle inside the edit. as it's a
critical button to click, the pen should hold everything editable so it's kept
secured."*

**A cycle's name and dates were written once** (§47.8) and were plain text ever
after, so a typo could only be corrected by **closing** the cycle — which
archives and clears every figure in the tenant (§49.1).

**His second instruction is the design.** With Close moved inside the pen the
strip carries **no control at all** while a cycle runs, which is a security
argument and not a tidy one: *a door is only a guard if everything dangerous is
behind it.*

- **It is the `NEWCYCLE` panel, not a second shape** (§53.5).
- **The server needed nothing and it is asserted**: those fields have always
  classified as `cycle` (§234), and what is new is that **nothing in the product
  could send one until that day** (§172's lesson).

### 6.1 · The pen closes itself (§273.4, reshaping §273)

*"when I'm editing why is the edit button still there it should turn into done
editing so I clik it and thebox collapse saving what I did rather tahn having a
save and candel buttons inside the box itself."*

**He is describing the platform's own editing model and §273 invented a second
one.** Every pen in SMP is `penBtn()` (Edit ⇄ **Done editing**) over fields bound
through `FIELDS` that write on blur — **there is no Save and no Cancel anywhere
else in the product**, because there is nothing for them to do. §273 built a
**draft**, and a draft is what forces a Save, a Cancel *and* a guard on Close.

- **The draft goes and the three controls go with it** — `cycleDraft()` and
  `cycleEditDirty()` deleted, not left uncalled (§24).
- **The guard is not relaxed, it is unreachable**: §273 held Close while the
  draft differed from the cycle, and with no draft the name is in `REVIEW` before
  the cursor has left the box.
- **The refusal needed somewhere to happen** — an empty name is still refused (it
  is what every snapshot is filed under) and there is no press to refuse at, so
  it became **the stored name coming back into the box** (§124), wrapped in
  `cycleField()` rather than at the call site: a box showing what was *not*
  stored is §96 with the sign reversed.
- **Both states are what decided the structure** (his ask): A, B and C differ
  only with the pen **open**, so a mockup of the closed strip would have shown
  three identical pictures.
- **C puts the destructive act in its own column** behind a rule under *Ending
  it*, so nobody arrives at it by tabbing down the form.

### 6.2 · Reopening a closed cycle (§273.2, §273.3)

**Nothing reopened a cycle and the page said the SMO could**: `canReport()` opens
with `REVIEW.state !== "open"` **before any role test**, so a closed cycle took no
figures from anyone including the office, while the reporting page promised *"The
SMO reopens a cycle if something has to be corrected"* (§104.8's family). Exactly
one place wrote `state:"open"` and it was the mint of a brand-new cycle.

**Closing loses nothing** — it files a score snapshot and marks the cycle closed;
the clearing happens when the **next** cycle opens, and that path archives first
with a Restore. **The pen, not a button on the strip** (his pick), which makes one
rule of two acts: the pen's far end holds the cycle's one dangerous state change
whichever way it goes.

**§273.3 — a panel edits, a dialog asks.** Of the shipped closed-cycle panel:
*"The design is very poor"* — and, of three shapes drawn for him, **"C"**.

> **My first two answers changed the paint and the fault was the shape**: a
> full-width band of facts under a full-width band of the SAME facts — measured,
> **zero of the five were not already on the strip**.

**And it was invisible on the worked example**: `.nc-grid` sizes each label/value
pair to its own content, so a wide label over a one-character value goes ragged —
every demo value is long, and on his tenant three of five are empty, leaving a
row of floating em-dashes. **§245's rule unpaid**: drawn and signed off on the
prototype's data, which is the one state the layout survives.

**A panel is right for five fields you edit and wrong for one question you
answer** — the open cycle keeps §273's panel unchanged; the closed one loses its
band and the pen opens the platform's own dialog. **It removes a step rather than
restyling one** (it was a panel *and then* a `confirm()`) and **takes a
`confirm()` out of the product**, which §95 ruled against for the most
irreversible act here.

### 6.3 · And "Open a new cycle" drew nothing, on `main` (§273.5)

Found while re-running the neighbours — `checks/repeat-project.py` hung on
`#nc-name`, and the fault **reproduced on the shipped build before a line was
written**. §261.2 replaced `renderCycle()`'s three-way chain with a
`CYCLEEDIT`-only branch and took the NEWCYCLE arm with it, so the button set the
draft and **rendered nothing at all**.

> **§96 in the worst place, because the state it writes is CORRECT** — so every
> assertion short of asking whether a **panel** was **drawn** passes, and there is
> no other way to start a cycle.

**Put back verbatim, not rebuilt** on §273.4's `cycleField()`: this panel is
wired by ID in the shell and writes on `input` rather than `change` for a stated
reason (Open can be pressed from inside a field), so re-expressing it would be a
second change riding a restoration. **The check was right and had been red for as
long as the panel had been gone** (§51.11 from the other side).

---

## 7 · Requirements, as things that can be checked

- **R1** The register table edits nothing; every write goes through the dialog.
- **R2** The attention count and the attention queue are the same list, and the
  button opens what it counts.
- **R3** A dismissal is bound to the fact it answered and returns when that fact
  changes.
- **R4** A seat cannot be granted by anybody who may not edit access, on the
  picker **and** through the workbook.
- **R5** Granting a Super user names the role and what it hands over before it
  commits.
- **R6** Every matrix column a role is offered is one `areaFor()` can answer
  with, and every one it can answer with is offered.
- **R7** Reordering a Setup table changes the navigation and nothing else, and
  is refused for anybody who may not.
- **R8** The cycle strip carries one control while a cycle runs; Close is behind
  the pen.
- **R9** Reopening a closed cycle restores reporting for everybody the role test
  allows.
- **R10** *Open a new cycle* draws a panel — asserted separately from the draft
  it sets.

---

## 8 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| The register's dialog, Add, the queue | §116 | `checks/people-dialog.py` |
| One line above the table | §122 | `checks/register-header.py` |
| Dismissing an attention item | §190 | `checks/attention-dismiss.py` |
| Granting a role, both ends | §110, §186 | `checks/role-picker.py`, `seat-grant.py` |
| The seat count | §187 | `checks/seat-count-and-small.py` |
| The matrix header and its columns | §174 | `checks/access-header.py` |
| Nothing moves the register under you | §110.7 | `checks/no-jump.py` |
| Arranging, and the row menu | §261 | `checks/setup-arrange.py` |
| Editing the running cycle | §273 | `checks/cycle-edit.py` |
| The cycle board | §244, §245 | `checks/cycle-board.py` |
| Who owns every place | §175 | `scripts/test-authorize.js` |

---

## 9 · Open, and recorded rather than done

- **The units table lost the only place answering *which units have no mark* at
  a glance** (§261) — stated as the cost of Islam's correction, not resolved.
- **A company has no order in the navigation**, so its table has no handle; if
  companies ever gain one this is where it goes.
- **`checks/setup-pages.py`'s three sticky-head failures reproduce on the build
  before §273** and are not that section's (recorded at the §273 merge).
- **The bootstrap SMO legitimately holds a seat away from where they sit**, which
  is why §186's queue tests the **place** and not "holds two roles" — a tenant
  that genuinely wants a second such person will see one entry they must dismiss
  each time.
