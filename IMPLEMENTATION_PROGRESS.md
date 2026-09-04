# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** §232/§233 on `main` (removing a pillar or a project,
and hiding an element from the presentation). **§287 is on
`claude/project-owner-reporting-access-uzze9s`, pushed and not merged** — a
project owner's reporting bar, and the finished mark.
**Latest version:** **§279 — the reporting page says where Submit is held —
merged to `main` 2026-09-04 on Islam's word**, from
`claude/smo-reporting-submission-m6gbwa`, on top of §274–§278.2 from five other
sessions; built as §274 and renumbered at the merge because main had taken
§274 through §278.2 while it was in flight.

**What §279 is.** Islam, from his own tenant: *"the reporting is not submitting
to the SMO as there is someting requires a note but I can't find it."* Every
figure was in, the plan owed nothing, and the gate was held by a single row — in
a pillar the page was not showing, since a unit's Reporting page draws one
pillar at a time. The rail was worse than silent: the pillar holding the report
up wore a **green 4/4**, because that tally counts figures *entered*. And a
capability function had no note banner at all, so its Submit was refused with
the reason on a hover and nothing on the page. From three options drawn in the
running platform he chose **C**: §272's own missing bar, brought to Reporting —
a count, one chip per place, and a **Next →** walk that opens the right pillar
and puts the cursor in the box that is owed — counting all four things that
hold Submit, with the plan's own gaps as a door to the Strategy tab. The rail
carries the mark too, and stops showing green over a pillar that owes something.
`checks/report-blockers.py` is **43 red** on the build before and **51 green**
after.

**Earlier:** §276 (the `Count` compile rule — a count is owed in whole ones)
and §277 (a reported figure follows the target's unit), merged 2026-09-04 from
`claude/integer-prorating-compilation-6dq77s`.

**§266 — the master presentation — IS ON `main`**, merged 2026-09-03 on
Islam's word (it was built as §261 and renumbered at that merge, because main
had taken §261 and everything up to §265 while it was in flight). The SMO picks
who presents and in what order from the Presentation menu, and the decks are run
end to end as one flow. Six decisions were drawn in the running platform and
answered before a line was written; the reasoning is §266 and the spec is
`specs/029-master-presentation/`.

**§266.10 — the picker is two tables, searched, and dragged by its own
numbers** — merged 2026-09-04 on Islam's word, from his own tenant with eighteen
subjects in it: a searchable *Everyone who reports* table with a **BU / FUNC**
column, a wider dialog, and a running order where **the number is the handle**
(the digit at rest, the platform's own bars the moment you point at it) with the
↑ ↓ buttons gone and the × left. Nothing underneath it moved — the stored order,
its classification and every server rule are byte for byte what §266 shipped, so
no migration. **The glitch he reported on the drawing was measured before this
was built**: with the swap driven by `:hover` alone a four-row drag swapped the
bars six times, half of them onto a row the pointer was passing, so the CSS now
holds the swap for the row in your hand. `checks/master-picker.py` is 37 red on
the build before and **51 green** after.

**Still open on it, and said rather than discovered:** a drag cannot
auto-scroll — with all eighteen in the flow the list is 654px in a 420px box, so
a drop can only land where you can already see (the keyboard route does scroll).
That is true of every sortable table in the product, so closing it means
changing `arrange.js` for all of them.
**Latest version:** **§268, §269 and §270 are ON `main`** — the strategy pen on
the section line, one edit for the whole tab, and three loose ends closed —
merged 2026-09-02 on Islam's word, verified live (production serves the merged
bytes; gate 200, api 401). **§274 is the audit of that merge**, asked for
straight afterwards: nothing in the product was damaged, and the merge did leave
three of main's own checks reading a control that had moved — two failing
loudly, one (`band-corner`) falling silent while still printing "all passed".
All three fixed; the rule earned is *grep the checks on BOTH sides of a merge,
not only before it.*

*(This line read v3.58 while the section below it ran to v3.65: a documentation
drift, flagged before it was corrected rather than quietly realigned.)*

**Sign in as:** `SMO` / `1234` — a password change is forced at once (§43.1,
reversing §19.4).
**Direction:** rebuilding on the HR_ERP stack (§20, decided 2026-08-20).

---

## Waiting on Islam

Nothing proceeds past this line without an answer.

| # | Decision needed | Why it is blocking | Recorded |
|---|---|---|---|
| **D5** | **Go-ahead for R2** — sign-in and the shell on the new stack. | R1 proved the stack; R2 is the first thing anyone would see change. Nothing starts without the word (A1). | §20 |
| **D8** | **What each of the ten BU names points at.** The page and the ten rows are built; the targets are empty. | Until a name points somewhere, everyone carrying it is on the register with nothing to open — and a role cannot be given from the employee file, because a role is held over the person's own BU. **IT is the one to think about: a unit and a supporting function share the name.** | §54.1 |

**Answered:**

- **D9 · The hide-from-presentation mockup — ANSWERED 2026-09-01: approved**,
  and built the same day as §233.

- **D7 · The companies — ANSWERED 2026-08-20: Distribution and B2C are real**,
  with Mobile / Consumer Electronics / IT and Retail Stores / Online Shop / Care
  under them. They stand alongside the units and the supporting functions as the
  client's own, and survive the clean slate (§23.4).
- **D6 · The weighting values — ANSWERED 2026-08-20: cleared too.** The factor
  model stays (the four factors, their types and their 40/30/20/10 weights); the
  per-unit figures, the written reasons and the prior cycle are gone. With
  nothing entered, every unit counts equally (§21.5).
- **D4 · The rebuild plan — ANSWERED 2026-08-20:** CSS carried **verbatim**
  (Tailwind only for genuinely new things); cutover **early, page group by page
  group**, the new app becoming the live site while un-ported screens link back
  to the frozen build.
- **D3 · The demo content in the open — ANSWERED by v2.2.** It is no longer in
  the tenant at all. It lives in the demo dataset, behind a button, labelled
  while it is on screen, and it cannot be written to the database (§21).
- **D1 · Stack — ANSWERED 2026-08-20: move to the HR_ERP stack** (Next.js,
  React, TypeScript, Prisma, NextAuth). Reverses §19's Path A. The database,
  the identity model and every recorded decision carry across; the glue is
  discarded; the offline single-file prototype stops gaining features at v2.1
  (it still takes corrections and the client's own instructions — §20, clarified).
  Recorded as §20.
- **D2 · Phase 2 as it stood** — superseded by the stack move. Its content
  (per-action writes, server-side rule enforcement, the change log) does not go
  away; it becomes part of the rebuild rather than a patch on the old stack.

---

## Known red, on purpose

- **`checks/report-saves.py` — 3 × "nothing threw while reporting".** Not a
  product defect and **red on `main` before this branch**, reproduced there with
  §250's changes removed: the failure is
  *"The script has an unsupported MIME type ('text/html')"* — the check's own
  stub does not serve `sw.js`, so the platform's §231.5 registration rejects and
  the page-error listener reports it. §100.3 exactly: *a stand-in that models
  less than the thing it stands in for reports a working build as broken.* Every
  other assertion in the file passes. Fix belongs in that check's stub.

- **`checks/no-jump.py` — "sorting a column" (1 JUMPED).** Real defect,
  diagnosed 2026-08-26 (§109.5): with a register row open for editing, sorting
  collapses the page 1457px → 913px (the open row keeps its class, loses its
  height) and the scroll clamps up. Pre-dates the §109 merge; needs its own
  fix in the register's sort, not a merge-widening patch. Until then this red
  is a true signal — do not silence it.

## Built and verified

### §287.4 — theirs opens, not the first one (2026-09-02, same branch)

Islam: *"when the user login he should land on his project by default"* and
*"abdel azim still can't edit"* — **one fault**. Measured: he lands on the
function, the pane opens on the FIRST project (somebody else's), and there he
correctly has **0 controls**; clicking his own on the rail gives **12 live,
enabled controls**. Only the fallback changes — an explicit pick still wins,
and nothing moves for the office or the custodian (asserted). 2 red on the
build before, printing his complaint verbatim.

**Asked and not built:** hiding the other projects via Roles & access. It is
per-row visibility, a different shape from the 49-cell role × area matrix, and
it would leave a capability's headline numbers describing projects the reader
cannot see. Put to him with options rather than guessed at.


### §287.2 / §287.3 — what testing §287 found (2026-09-02, same branch)

Islam, on the built branch, two things.

**§287.2 — a closed report says so to him too.** *"reporting is closed for him
and showing a button of mark done only."* Measured: with the custodian's
submission in, §220 correctly disables all 8 figure boxes, the note and the new
Mark done — and **nothing said why**, because the word `Submitted` lives in the
half of the bar a bounded role never reaches. Not a §287 regression (that slot
read *View only* before, which explains no better), but a hole §287 now owns.
The bar says `Submitted`, with who can reopen it on the hover; the way back is
deliberately not offered, because reopening speaks for the whole subject and
the server would refuse it. The first build put a `Closed` pill beside the
`Close` link — one letter apart, meaning different things — and that is gone.

**§287.3 — no fill door when nothing is owed, narrowing §272 to nobody.** *"it requires
him to fill something empty and there is nothing empty."* Measured in his
shape: **0 counted, 0 red *Missing* on the page, and a red button** — opened by
**milestone collaborators alone**, the field he ruled must never count (§187,
§227). **Proved to predate §287**: identical on the previous build. Three
answers were put to him with the cost of each; he chose *no button when nothing
is owed* over the recommendation, and **the cost is recorded as his**: a
bounded role holds Fill and not Edit, so an optional field is now beyond them
until somebody with the pen writes it. **Main had meanwhile shipped §272 from
the same symptom**, which answered the office's half and kept the door for a
filler — so this is expressed as `seesEmpty()` returning false, the one place
§272 built to answer it, with all of its machinery untouched and reversible.
An earlier build of this DELETED that machinery, written before §272 existed;
merging main made the deletion wrong and it was reverted.

**And a correction to the previous handover:** `report-chrome` and
`report-saves` were reported green and **had not run** — neither reads this
container's browser variable, so Playwright printed an error box and exited 0,
and `tail -1` on that box looked like a result. Run properly they fail 1 and 3,
and **both reproduce identically on the pre-§287 build**, so neither is this
work; recorded, not fixed in passing.

`checks/project-done.py` now carries both, each proved able to fail on the
build before it.


### §287 — a project owner reports, and the bar said View only (2026-09-02, branch `claude/project-owner-reporting-access-uzze9s`)

Islam, from the running platform: *"a project owner is not able to report,
despite being the project owner and in the roles and access I allowed this."*

**He could, and the page was telling him he could not.** Measured in his own
shape before anything was written: 12 live, ENABLED controls on his own project,
a press writing the row, the server accepting the save — under a bar reading
**View only**, with no Submit and no Save draft, so nothing acknowledged that
anything had been entered. The pill is drawn from `canSpeakFor()` — may this
person SUBMIT — which is rightly false for a bounded role and the wrong two
words for everything he can do. §147.6 recorded it and deferred it.

Settled from a mockup drawn in the running platform in **his own shape** —
Shared Services, Cost Optimization, ADM01/ADM02, never the Raya Trade example
(§245) — and he chose the fuller answer: say what is true, **and** a control to
mark his own project finished so the custodian can see which are ready.

- **The bar** carries his own container's state, built from the same tally the
  rail reads; a plain reader still reads *View only*, and it is asserted.
- **The control** moved from the mockup's bar to the project's own band, per
  §190's general rule and because a function draws every capability at once, so
  one control in the bar would have to guess which project it meant. Recorded
  as a departure from the approved drawing, with the reason.
- **Keyed by the project, not the subject** — the round trip against Postgres
  exposed it (jsonb reorders `{by, at}`, §145), and following that thread found
  that a target-keyed map makes two owners in one function collide, the second
  reverting the first and being refused for it (§234 one level finer).
- **No migration**, proved on a real Postgres 16; the emptied field is deleted.
- **A signal, never a lock**: a marked project still takes figures until the
  report is closed (§220).

**Proved able to fail:** `checks/project-done.py` 14 red on the previous build
(and its first run DIED rather than reported — §215 — so every dependent step
degrades now); `test-authorize.js` 498/0 falsified three ways; `test-graph-diff.js`
131/0, falsified by putting `done` back in the whole-review path, where the first
owner's mark is destroyed. Round trip on a virgin Postgres PASS, two tabs 24/0,
and the ten reporting/plan checks green.

**Recorded, not done:** the rail does not show the mark — a second surface for
one fact wants a mockup, not a quiet widening.


### §278.2 — a mark, not a word (2026-09-04, same branch)

Islam, of what §278 shipped: *"the button montthly is big. do you suggest other
options for it's setting or placement?"*

**Measuring it reframed the complaint.** Four treatments drawn into the live
table all leave the Target box between 334 and 343px and the row at 57px — the
column had the slack, so this was never about room. It was bordered, uppercase
and bold, eight times down one column, on rows that mostly will never use it.

**He picked the 24px mark** — twelve cells, four across and three down, wearing
the eye's own 24×22 and amber lit state from two columns to its left, declared
in one CSS block with it. It is the only one of the four where *which of these
eight has a monthly plan* reads at a glance. The caret was drawn and refused:
invisible lit state, and it reads as a dropdown for the box beside it.

Cost stated: the hover is now the only thing that says what the control is, so
it says it in full and on `aria-label` too.

`checks/monthly-plan.py` 51/51 · 497/0 · 131/0 · full sweep ERRORS none · six
neighbouring checks green. **On the branch, not merged.**

### §278 — a target with a shape of its own (2026-09-03, branch `claude/seasonal-targets-monthly-proration-5clvu3`)

Islam: *"targets proration is always flat acorss the year but some targets have
seasonality so the proration is not valid so some targets needs a monthly plan
input so the calculation becomes more accurate."*

Aligned first, then drawn first: the mockup
(`design-mockups/monthly-plan/2026-09-03_monthly-plan-entry.html`) was shot from
the running plan pane and signed off before a source was touched. **The argument
is one row of his own plan** — Accessory revenue, 300M EGP, 96M reported at
June, reads 64% behind flat and 100% on plan against its own shape.

**What was built.** Twelve numbers on a row, in the target's own unit, compiled
by the row's own compile rule (Sum adds the elapsed months, Average takes their
mean, Latest takes the month being stood in). It answers at `measureDue()`, the
one seam every score, YTD column and deck benchmark already goes through, so no
surface had to be taught anything. On all four surfaces he asked for: a pillar's
key measures, a unit's and the group's key objectives, a supporting function's,
and a tactic's outcome.

**His three decisions, taken before it was built.** (a) The monthly plan becomes
the target once complete — the annual box shows the sum, read-only. (a′) His own
correction: a typed 0 is a real month and a blank box is not. (b) All four
surfaces. (c) Reporting unchanged — one YTD figure per cycle.

**Verified.** `checks/monthly-plan.py` 47/47 and **36 red** on the shipped
pre-§278 build; `test-authorize.js` 497/0 (six new, both directions);
`test-graph-diff.js` 131/0 (five new); round trip, clean parity and two tabs
green on a virgin Postgres 16, with the monthly plan written and read back on
all three shapes and its nulls intact; full `qa.py` sweep ERRORS none; twelve
neighbouring checks green.

**Two faults found by driving it rather than reading it.** The drawer's boxes
named the `plan` page for all four callers, so on Foundation they rendered as
read-only spans that looked exactly like boxes (§96). And the check's own first
falsification run died on a missing control and reported 9 failures where the
build has 36 (§215).

**On the branch, not merged.** Recorded, not done: the deck prints the seasonal
benchmark with no word saying why it is not half the year, and a monthly plan is
deliberately not a counted gap.
### §277 — a reported figure follows the target's unit (2026-09-04, branch `claude/integer-prorating-compilation-6dq77s`)

Islam, from his Performance page: *"the YTD is showing 2% from 2# I don't
know where this error is happening."* Not the arithmetic — the reporting box
stamps a typed number with the target's unit AT THAT MOMENT, and the office
later changed the target from % to #, so the figure kept its old stamp.
Reproduced on a tactic's outcome and a key measure alike.

**Built:** when the office changes a target's unit, a figure carrying exactly
the old unit is rewritten in the new one (`2%` → `2#`) with the target's own
separator; a figure typed with its own unit is left as typed (§243); the
FIRST unit is not a change (a filler's act, §201.2); Y/N is neither side
(§257). One function, both surfaces, no server change, nothing migrated.
**Cost stated and accepted:** a row already stored stays `2%` until the
figure is re-entered once on Reporting.

**Verified:** `checks/unit-follows.py` (new; **5 red** on the build before,
printing `2% / 2#` verbatim), nine neighbouring checks, `test-authorize`
491/0, full `qa.py` sweep green. **On the branch, not merged.**

### §276 — a count is owed in whole ones (2026-09-03, branch `claude/integer-prorating-compilation-6dq77s`)

Islam: *"we need a compilation type that prorate to integrs only .. if we have
a target of 2 shops to open in the year so in the 8th month that proration asks
for 1.3 stores which is not feasible."* Aligned first; **Count** as the name
and **rounded down** are both his.

**Built:**

- **A fourth compile rule, `Count`** — Sum for things finished one at a time.
  It prorates the target like Sum and rounds the due figure DOWN to a whole
  one: 2 shops owe nothing until June, one from June, two in December. At
  August his row reads **1 due, 100%** where Sum read 1.33 and 75%.
- **Not a change to Sum**, because that would move stored scores on every
  integer Sum target already planned; 0 of 122 demo rows carry Count and every
  existing row prorates exactly as before, asserted.
- **"Nothing due yet"** on the Performance page for a count with nothing owed,
  in the tactics' own not-yet-due pill; the row leaves every average and no
  `/ 0 #` benchmark is printed.
- **One list (`SMPRules.COMPILES`) where there were seven** — four pen pickers,
  the plan builder, the workbook's validation ranges and the upload's refusal
  all read it. No server change, nothing migrated.

**Verified:** `checks/count-compile.py` (new; **13 red** with the floor
taken out, **2 red** with one picker left on the old list, both from rebuilt
sources — editing the built file instead silenced the whole script block under
§238's hashed CSP); `plan-builder.py` rewritten from a literal to
agreement; `test-authorize` 491/0; eight neighbouring checks and the full
`qa.py` sweep green. **On the branch, not merged.**
### §275 — a function's Presentation button sits where a unit's does (2026-09-04, branch `claude/plans-edit-button-placement-jxw8or`)

Islam: *"can you move the presntation button for the functions to be in the same
place like what we did in the units while having the bands button as well?"* —
then **"yes"** to the mockup.

**Measuring narrowed the ask.** This was the **only** Performance page in the
product drawing its controls in the page body: a unit's, the group's, a
company's and a **pillars**-format function's all call `perfActs()`, which hangs
them on the tab row and appends the Bands menu itself. So the two halves of
"supporting function" had disagreed on this one screen since spec 010 routed the
pillars format through the unit's own page — A15 with no *why* behind it.

**The change is one line** in `renderFnPerformance()`. Screen only: no `api/`,
`lib/` or `db/` file touched, read off the diff rather than remembered.

- **The Bands half comes free and is NEW, not restored** — that page has printed
  *Off track* pills since it was built with nowhere to learn what they mean.
- **One row comes back**: capability band y 300 → 237.
- **The controls land on x 1206 / 1372 — a unit's pixels exactly.**
- **Nobody's rights move**: the menu is asked of `SMPRules.mayDownloadPlan()`,
  of somebody it refuses as well as somebody it allows.
- **The group and a company still carry no Presentation button**, outside the
  ask, untouched and asserted as an absence.

**Fit measured, not assumed** (§158): one line at 1920 / 1500 / 1280 / 1100 /
1000 / 900 / 820 / 768, no overflow, no sideways scroll, 151px still clear at
the narrowest.

Green: `fn-perf-controls` (new, **16 red** on the build before), `perf-line`,
`fn-pillars`, `scoring-bands`, `hide-slide`, `setup-header`, and the full
`qa.py` sweep. `report-chrome`'s one failure reproduces byte-for-byte on main
(§274's list) and is not this change's.

**§275.1 — one of the new check's own assertions could not fail as written**: it
measured the content's start off `panel.firstElementChild`, and before the change
the `.pageact` div WAS that child, so it went green on the reverted build
(§113.8). It measures the capability band now and fails at (224, 181).

Mockup: `design-mockups/fn-performance-controls/2026-09-04_presentation-on-the-tab-row.html`

### §274 — the audit of the §268–§270 merge (2026-09-03, branch `claude/plans-edit-button-placement-jxw8or`)

Islam, straight after the merge: *"did we change or damage something on this
merge from the previous changes?"*

**Nothing in the product.** Every source line the merge removed is one this
branch removed deliberately (`editBar()`, `dlPlanBtn()` and its call, the pen's
old positions, three wrapper lines, two CSS rules); **no documentation was
lost**; of 34 page keys only three remap and only on a function target;
production serves the merged bytes (gate 200, api 401).

**Three of main's own checks were reading a control that had moved**, and the
split between them is the finding:

- `plan-tail-fold.py` (19 failed) and `one-line-titles.py` (rc=1) pressed
  `#panel .penbtn[data-page]`. They failed **loudly**. Both were **added on
  main** (§253, §267) *after* the §268 sweep ran against this branch — so the
  sweep was early rather than careless, and the rule gains a clause: **grep for
  a moved control on both sides of a merge.** Green after: 0 failed / all good.
- `band-corner.py` guarded its last assertion with *if the control is there*,
  so it ran **twice on main and none here** while printing *"all band-corner
  checks passed"*. The property was **measured, not assumed** — the corner still
  holds §268's Arrange arrows, and a click reaches them for `mobhead` and
  `own_mob` in both themes at scroll 0/300/700. The check switches to that
  viewer now and says out loud that somebody still gets the control, so it can
  never fall silent again (§113.8). Falsified: stubbed to nobody it fails twice.

**Attributed, not mine:** nine checks were already red on main (verified against
a worktree at `5cdcd1a`; `tactic-outcome` diffs line-for-line identical), and
eight more fail on both with §167.2's *`welcomeover` intercepts pointer events*.
`office-chat` was never red — it takes over four minutes and had been cut off by
the runner's 240s cap.

**Recorded and deliberately not fixed:** `tactic-outcome.py` skips its own pen
the same silent way, but fails identically on main, so it belongs to its own
pass rather than to this audit.

### §273 — editing the cycle that is running (2026-09-03, branch `claude/cycle-name-date-edit-ze49d0`)

Islam: *"allow me to edit the cycle name. give me an edit button the cycle to
edit the date as you already built and the cycel name edit as well"* — then, of
two shapes drawn in the real page: *"keep the close cycle inside the edit. as
it's a critical button to click, the pen should hold everything editable so
it's kept secured."*

**What was wrong.** A cycle's name and its three dates are written once, when
it is opened (§47.8), and were plain text ever after — so a typo in *H1 2026*,
or a due date that moved, could only be corrected by CLOSING the cycle and
opening another, which archives and clears every figure in the tenant (§49.1).

**What is there now.** One **Edit** on the cycle strip, and nothing else: Close
the cycle moved inside it and the review-point picker went with it, so while a
cycle runs that line carries no control that can be pressed by accident. The
pen is the *Open a new cycle* panel's own shape — Name · Covers from · to ·
Reports due · Reporting as of — with Save and Cancel at one end of its act row
and Close the cycle at the other. Nothing reaches the cycle until Save; Cancel
writes nothing. While anything is unsaved **Close is held and says why**, asked
again at press time rather than trusted from the render.

**What it does not touch.** No figure, no score, no report state. Nothing new
is stored and nothing is migrated: those five values were already there, and
the server has always treated them as the office's (§234) — what is new is that
until today nothing in the product could send one.

**Verified.** `checks/cycle-edit.py` **46 red** on the build before and 47
green after, re-falsified after every correction; full `qa.py` sweep ERRORS
none; 496/0 authoriser (five new, both ways); 126/0 differ; `ytd-proration`,
`repeat-project`, `cycle-board`, `setup-overview`, `setup-header`, `table-fit`,
`safety-banners`, `submit-gate` and `gap-fill` green; the pen's two new inks
measured with the sweep's own function (5.31 light / 5.96 dark) and the probe
proved able to see them. Mockup:
`design-mockups/cycle-name-date-edit/2026-09-03_edit-the-cycle.html`.

**Merged to `main` and live** (§273 · §273.1 · §273.2 · §273.3).

### §273.4 — the pen closes itself, and the banner is two columns (2026-09-04, same branch)

Islam, using what §273 shipped: *"when I'm editing why is the edit button still
there it should turn into done editing so I clik it and thebox collapse saving
what I did rather tahn having a save and candel buttons inside the box itself
rearrange th e buttons and think of different structures of this banner"* —
then, having asked to see **both states** of each, *"C"*.

**What was wrong.** He is describing the platform's own editing model, and §273
had invented a second one. Every pen in SMP is `penBtn()` — Edit ⇄ **Done
editing** — over fields bound through `FIELDS` that write on blur (§35); there
is no Save and no Cancel anywhere else in the product, because there is nothing
for them to do. §273 built a DRAFT, and a draft is what forces a Save (to commit
it), a Cancel (to throw it away) and a guard on Close (because the draft and the
cycle can disagree).

**What is there now.** The draft is gone and the three controls with it. Edit is
a toggle that reads **Done editing** and lights up while the pen is open. The pen
is two columns: the five facts on the left under *This cycle*, **Close the cycle**
alone on the right behind a rule under *Ending it*, with one line saying what it
does — so the destructive act never shares a reading column with the boxes you
type in, which keeps §273's security argument and sharpens it. It stacks below
1100px. An empty name is still refused, and the refusal is now **the stored name
coming back into the box** (§124), because there is no press left to refuse at;
a name with space around it is trimmed rather than refused.

**What it does not touch.** Nothing server-side moves — these five fields already
classified as `cycle` — and it is asserted (514/0).

**Verified.** `checks/cycle-edit.py` **37 red** on the build before, **69 green**
after; §2, §4 and §5 rewritten rather than deleted (§218). Three of the check's
own first failures were one fault: Edit is a TOGGLE now, so a section pressing it
blind shuts the pen a previous section left open. Mockup:
`design-mockups/cycle-name-date-edit/2026-09-03_editing-strip-structures.html`.

### §273.5 — "Open a new cycle" drew nothing, on `main` (2026-09-04, same branch)

Found while re-running the neighbours: `checks/repeat-project.py` hung for
thirty seconds on `#nc-name`, and the fault **reproduced on the shipped build
before a line was written**. §261.2 replaced `renderCycle()`'s
`NEWCYCLE ? … : CYCLEEDIT ? …` chain with a `CYCLEEDIT`-only branch and took the
NEWCYCLE arm with it — so pressing *Open a new cycle…* sets the draft and
**renders nothing at all**, on the only way to start a cycle. §96 in the worst
place: the state it writes is correct, so every assertion short of asking whether
a PANEL was DRAWN passes.

Put back **verbatim**, not rebuilt on §273.4's `cycleField()` — this panel is
wired by ID in the shell and writes on `input` rather than `change` for a stated
reason, so re-expressing it would be a second change riding a restoration.
`cycle-edit.py` gains §5c, asserting the draft and the panel separately.

**Recorded, not done (§273.6).** Found by looking at the built pen: with no
review point picked — the demo's state, and a legitimate one — the strip reads
*"taken from the cycle's end"* and the month control inside the pen reads a red
**MISSING**. §239.3 settled that a working fallback must not cry Missing and
settled it for the STRIP only; the pen calls `monthBtnHtml()` directly, where
*Missing* is correct for the OTHER panel (opening a cycle refuses without a
month). The fix is a per-caller word, which is a wording decision. It predates
§273.4 and is left alone rather than changed on the way past.

**Merged to `main`** — §273.4, §273.5 and §273.6 together, on Islam's word,
after merging main's §274–§278.2 from five other sessions into the branch:
the three source files both sides touched auto-merged and were grep'd for
duplicate declarations (§56.7), the built file was rebuilt rather than merged
(§91), and `sw.js` bumped past a name main had already served (§94.12, §94.16).
520/0 authoriser and 131/0 differ after the merge, with main's own
`unit-follows`, `count-compile`, `monthly-plan`, `fn-perf-controls` and
`master-picker` green beside the cycle's three (§273.7).
### §263 — a saved draft can be submitted where it stands (2026-09-03, branch `claude/draft-save-smo-submit-8ew3n3`)

Islam, using the reporting page: *"in the reporting on saving the draft keep
the submit to smo button there as it's posible to save the draft and if it's
complete we can submit directly rather than reopen to submit."* Drawn in the
real bar first and published as an artifact (rule 1c); he picked **C**, the
variation that also gives Reopen back its quiet voice.

**Built:**

- **Submit stays on the bar while a draft is saved.** §220 built it as one
  either/or — `subd || parked` drew the state word and Reopen, everything else
  drew Submit — so the control disappeared at the moment somebody looks for it
  and sending a finished draft took three presses.
- **The report itself is unchanged and still locked** until Reopen. Measured
  on the built file: `editable 0 of 25` before and after.
- **One Submit button, written out once** (§53.5): §221's gate cannot differ
  between the open bar and the parked one, and the check asserts the pair —
  the button is back AND it is still shut while figures or plan items are owed.
- **Reopen drops its box** where Submit is beside it, taking the quiet orange
  type Save draft wears while the report is open. One declaration, two
  selectors; the class stays `rc-reopen` so one handler answers for both states.

**Cost, stated before he chose:** the bar rides the tab row, so it goes
494 → 659px (against 577px for the open bar). Nothing moves at 1440 or 1280;
below about 1000px the draft bar becomes the widest state of the page where
today it is the narrowest. Asserted at 1500 and 1280 rather than remembered.

**Checked:** `submit-gate.py` all green and **11 red** on the shipped
pre-§263 build — its first falsification run *died rather than reporting*
(§215), so every press in the new section degrades now. One assertion reversed
and rewritten rather than deleted (§218). `perf-line`, `table-fit` green;
`test-authorize` 491/0, `test-graph-diff` 126/0 (nothing server-side moved).
`report-saves.py` is red on the untouched build for the stub-without-a-worker
fault §250.2 records — reproduced before this change and not touched by it.

**Merged to `main`** on Islam's word, 2026-09-03.


### §259 — the group's mark, and four blue section dividers (2026-09-03, branch `claude/deck-separators-brand`)

Islam, in one message: *"where can I upload the raya trade mark so it can be
used? then work on separators let's make teh serparators blue background like
the client brand colors"* — then four sections by number. Both halves were
drawn in the real deck and published as one artifact before a source was
touched (rule 1c); two of his four answers are choices between treatments that
only existed because they were drawn.

**Built:**

- **Four dividers on `--panel`** — Foundation (new), SWOT (recoloured),
  Strategic pillars (new), Overall performance (new). The blue is the token
  Setup › Branding's *Navigation bar* control sets, so a divider follows a
  tenant who rebrands; the check proves it by rebranding one mid-run rather
  than by naming a hex.
- **The SWOT divider's four hues become one rule** — measured, not preferred:
  2.55 / 2.26 / 3.49 against the blue, and *Opportunities* was `--panel` on
  `--panel`. The four category slides keep their colours.
- **No footer mark on a divider**, his word — and it removes a real fault, the
  plate that keeps a navy lockup readable being switched on by the page being
  dark, which a blue divider on a light page is not.
- **The pillars roll-call stays white** (his, reversing my recommendation) and
  **the closing divider carries no numbers** (his, agreeing with it).
- **A group mark on Setup › Branding** — one upload, the same intake as a
  unit's, `deckMark()` the one reader, no migration, the key deleted on Remove,
  classified `setup` and named so a refusal says Branding. A supporting
  function's deck wears a mark for the first time.
- The knowledge base's branding answer, wrong since the page was written.

**Verified:** `checks/deck-dividers.py` 22 red on the previous build and green
after (every probe degrades — its first two runs there died rather than
reporting); `test-authorize.js` 489/0 with the new rule falsified; full `qa.py`
sweep ERRORS none; nine neighbouring deck checks green.

**Waiting on Islam:** the Raya Trade PNG is rendered and in the repo at
`clients/raya-trade/brand/raya-trade-group-mark.png` — he uploads it on
Setup › Branding once this is merged. Whether the deck cover, Thank you and the
four per-pillar covers should also go blue is asked and deliberately not done.
### §252.2 — the plan download, in the menu and the office's (2026-09-02, same branch)

Islam, in the same breath as the merge: *"the ppt download leave it as an
option in the drop down for the smo only."*

§145.9 hid the pane-corner button for everyone in August and kept the machinery,
saying giving it back was one line. It comes back **somewhere else**: an entry
in the **Presentation** menu, beside *Present* and *Manage slides* — three
deck-shaped things in one place, rather than a fourth control in a pane corner
that already holds the pen, the arrows and the fill button.

**For the office alone**, which reverses §117's audience (the office plus a
unit's owner and custodian and a function's head) at his instruction, and is
recorded as a reversal rather than written over. Reordering is untouched — still
the custodian's and the owner's (§101). The corner button, its page map and the
`editBar` term are **deleted rather than left returning ""** (§24).

Green: `strategy-split` ALL OK (rewritten around the new placement, both ends
per person), `test-authorize` 474/0 with the three reversed assertions
**rewritten, not deleted** (§218), `deck-outcome` 0 failed, `plan-fields`,
`perf-line`, and the full `qa.py` sweep.

### §254.7–.12 — the deck round, finished (2026-09-02, same branch)

Four more from the running deck, on top of the eight before them.

- **§254.7** — a unit written twice *with or without a gap*. His `40 %%`
  survived §254.1's collapse, which split the unit on whitespace. **And it
  caught a regression of my own**: §254.1 added a space to any unit it did not
  recognise, so `40%%` became `40 %%` — made worse by the tidier.
- **§254.8 / §254.12** — the pillar cards size themselves AND fill the slide
  rather than one row of it. Up to three in a row, above that `ceil(sqrt(n))`,
  so *"4 can form a box"* is 2×2 and five goes 264px → 445px. Vertical sizes
  follow the rows, horizontal ones the columns; swept 1 to 10, nothing
  overflows.
- **§254.9** — the aspiration runs the width, *This year* comes first, and the
  objectives table grows. **10 of 10 aim slides were on the generic 19px floor;
  none are now.**
- **§254.10 / .11** — two numbers not four, with the reading put back before it
  was obeyed; the sentence explaining Execution stays.

**Verified:** `deck-figures` **11 red** on the build before; that check plus
`deck-blank-slides`, `notes-slide`, `slide-move`, `deck-outcome`,
`deck-and-weights`, `ytd-proration`, `tactic-proration`, `table-fit`,
`submit-gate` green, **and main's own three new checks** (`hide-slide` 42/0,
`reported-note` 0 failed, `hide-slide-mockup`) green on the merged build.

### §254 — a figure is read against what it is measured by (2026-09-02, same branch)

Eight things Islam sent from the live deck in one afternoon, all mocked up from
the running deck first (`design-mockups/deck-review-round/`) and six built.

- **The benchmark, and the column that names it** — *Annual target*, and what
  is due so far beside every figure, on a unit's objectives, a pillar's
  measures and a capability's objectives. Nothing new computed; one builder.
- **§254.1** — a scaled currency reads as one token wherever it is drawn
  (`8M EGP`), display only, and the doubled unit healed on reporting and save.
- **§254.2** — one question decides the whole row, narrowing §248 at his
  direction: a tactic whose outcome has a target says it is owed a figure.
  0 of 78 demo tactics are in that state, so nothing in the demo moves.
- **§254.3** — a not-due tactic is not dimmed.
- **§254.4 / §254.5** — the pillars are named before they are scored, and the
  deck ends on the score table then the three readings.

**Verified:** `checks/deck-figures.py` **33 red** on the build before, green
after; `deck-blank-slides`, `notes-slide`, `deck-outcome`, `deck-and-weights`,
`ytd-proration`, `tactic-proration`, `slide-move`, `cycle-board`, `table-fit`,
`project-tables`, `submit-gate`, `gap-fill`, `fn-pillars`, `fn-report-gate`,
`hide-element` green. Three checks held literals these decisions moved and were
rewritten rather than loosened. `report-saves` is the known-red-on-main stub
fault (§250.2).

**Waiting on Islam:** `K EGP` on the offered unit list; the deck marks (a
supporting function can never have one, and there is no group mark to fall back
on); whether the notes slide keeps the last word before Thank you.

### §253 — a table with no rows is not a slide (2026-09-02, branch `claude/merchandizing-slides-blank-mxcjfj`)

Islam: *"slides are showing blank pages for the merchandizing."* Measured
before anything was proposed: **four** slides in the whole product draw a
heading, a column strip and a whole empty page, and **all four are
Merchandising** — its own deck's two objectives slides (a function judged by
its pillars legitimately carries none, §214.2) and Retail's **RS04**, the
pillar carried by that function, which printed **93% / 60% / 61%** over
nothing at all.

`deckSlidesFn` has guarded its objectives slide since it was written, which is
why **Marketing** has always been right; the unit deck, which a pillars
function goes through since §224, had no such guard (§53.5). Islam ruled it
for **any** subject, reversing the narrower rule recommended to him.

- **§253.1** — the headline slide drops the objectives cell for any subject
  with none. No new CSS: `.headgrid` without `.three` is the shape it wore
  before §243. Settled from a mockup made of the real deck, which earned its
  place by exposing a footnote that would have gone on explaining a number no
  longer on the slide.
- **§253.2** — the Retail → Merchandising pointer is cut at his instruction.
  The **feature** is untouched; the demo no longer *shows* a carried pillar, so
  spec 010 is described and not visible. Measured across every unit: Retail
  execution 102→104, planned 57→56, RS04's three figures to three dashes,
  nothing else moves.
- **§253.3** — *"the manage presentation show this"*: Manage slides on a
  pillars function, bar drawn, rail and stage empty. §224's fault on two more
  surfaces. `deckHtmlFor()` is the one reader now, asked by Present, Manage
  slides and the anchors; `openDeckFn()` on a pillars function goes **2 → 13**,
  and the capability deck is asserted unchanged. The editor's silent failure
  was given a voice in the same change. **Not claimed**: the demo's pre-fix
  editor draws two slides and his screenshot shows none, so whether the prefix
  branch is exactly what emptied his rail cannot be proved from here.

**Verified:** `checks/deck-blank-slides.py` **14 red** on the build before, all
green after; `notes-slide`, `deck-outcome`, `deck-and-weights`,
`ytd-proration`, `cycle-board`, `table-fit`, `project-tables`, `slide-move`,
`gap-fill`, `submit-gate`, `fn-pillars` green; every unit's five scores read
before and after. `report-saves` is the known-red-on-main stub fault (§250.2),
reproduced on the pre-change build.

**Open, and next:** three from the live deck, taken as their own piece — the
deck's measures table shows no prorated benchmark where Performance does, a
doubled unit (`8 M EGP M EGP`), and a not-due tactic row that is dimmed as
well as labelled.

### §252 — the presentation reads what was reported (2026-09-02, branch `claude/presentations-plan-performance-update-7a94p2`)

Islam: *"presentations doesn't change when the plan performance is done"*, and
then *"the presentation should update on either save draft or submit."* **The
fix he proposed would have changed nothing** — `openDeck()` calls
`deckSlides()` on the press, so a deck is assembled fresh every time it opens
(§51.8) and there is nothing stale for a refresh to clear. **This closes
§250.2**, which the branch beside this one recorded as not done.

**The fault is five readers still looking in the old box.** §248 puts a
tactic's outcome figure in `outActual`. Measured on Mobile before anything was
written:

| | Performance says | The slide said |
|---|---|---|
| a tactic reported through its outcome | `4# / 3 #` · `133%` | `— / 50%` · `—` |

…under a heading on that same slide already reading **`Delivered 98%`** — a
number that counts the row its own table was calling empty. Beside it:
`reportedCount` went **41 of 41 → 40 of 41**, so **Submit refused a finished
report** with *"1 figure still to enter"*; the note rule could not see an
outcome at all; the cycle board's tactics column under-counted; and on
Performance the row was dimmed as unreported next to its own printed figure.

**One expression, named once.** `onOutcome(t) ? tacticReads(t) : tacticRatio(t)`
existed inline in the Performance pane and nowhere else — it is
`tacticProgress()` now, with `rowAnswered()` beside it answering *has this row
been answered* for every kind of row (§53.5). The ternary it replaces in
`reportedCount` had the same expression in both branches.

**The slide's shape is Islam's**, picked from three drawn options shot out of
the real deck (`design-mockups/tactic-outcome-slide/`, published as an artifact
for sign-off): the **outcome takes a column of its own**, as on Performance.
Cost measured before he chose: Mobile's deck **24 → 27 slides**, every extra one
a continuation the deck already makes. Two headings take Performance's words
(*YTD actual* · *Progress*, §239.2), a row owed a figure says **"Not reported ·
due at …"** instead of the em-dash that means *nothing to report*, and a tactic
with no outcome is byte-for-byte what it was.

**Recorded, not done:** the `.pptx` plan download still has no outcome column
(its own mockup), and a deck already open on a projector does not redraw
mid-presentation — put to Islam and deliberately left.

Green: `deck-outcome` (**19 red on the shipped file**, 0 after — and its own
first run died rather than reported, §215), `tactic-proration` (33),
`tactic-outcome` (47), `ytd-proration`, `submit-gate`, `cycle-board`,
`notes-slide`, `project-tables`, `setup-overview`, `gap-fill`, the full `qa.py`
sweep (ERRORS none), `test-authorize` 472/0, `test-graph-diff` 126/0.

### §251 — the unit is there before the number is (2026-09-02, branch `claude/measure-unit-edit-7klw9y`)

Islam, from his own plan with the pen open: *"In the edit I can't set the unit
for a measure."* Two of his four Key measures had no target yet, and the unit
has no field of its own — it lives inside the target string (§199) — so a row
with no target had nowhere to keep one and the column drew an em-dash. The
target holds the unit ALONE until a number joins it, which is §248's own answer
for a tactic's outcome; that section's explicit carve-out for the measures
column is reversed here at his instruction.

**Mockup first (rule 1c), published as an artifact**, built from his own four
rows in the platform's own tokens — never the demo tenant's names (§244) —
because the question he asked was WHERE. He answered **"all 4 places"**: a
pillar's Key measures, a unit's Overview objectives, the group's Foundation, and
a supporting function's Overview on both formats.

**The one cost was stated before it was built and he was told it is not
optional:** a target holding only a unit is unusable, so `target`/`target3y`
join `GAP_NUM` — screen and server through the shared module — and the row goes
on saying **Missing**. Measured: 208 non-blank targets in the shipped plan, 0
non-numeric, so nothing in the demo moves; with the rule removed the count falls
46 → 45 the instant a unit is picked. **Fill mode is deliberately unchanged**
(§201.2) and asserted, one line to open when he asks.

Nothing stored that was not stored before, no migration, no score moves.
`checks/unit-before-number.py` drives all four surfaces through the real
controls and reads the plan back — proved able to fail twice (16 red with the
em-dash put back, 6 red with the numeric rule removed). `objective-unit`,
`tactic-outcome`, `gap-fill`, `submit-gate`, `fn-pillars`, `fn-ko-edit`,
`table-fit`, `plan-fields`, `ytd-proration`, `project-tables`,
`deck-and-weights` green; 472/0 authoriser, 126/0 differ, full `qa.py` sweep
clean. One assertion in `fn-ko-edit.py` was REWRITTEN rather than deleted (§218).

**Not done, and recorded:** the merge to `main` is Islam's word (rule 4) — the
branch carries §251 only, and main has moved to §250 meanwhile, so the merge
needs the fetch-and-look, a rebuild, `node --check sw.js` and a SHELL name
confirmed against `origin/main` immediately before the push (§91, §94.16).


### §250 — a tactic's outcome is measured against its own window (2026-09-02, branch `claude/tactic-proration-calc-uyspmb`)

Islam: a tactic marked Q2 and Q3 "is a 6 months project from april till
september .. now we are reporting till august so the proration how should it be
calauclated? because it's different than the proration of the measurs that
prorate across the eyar." **Half of it was already true** — §239 gave the
*% delivered* column the tactic's own months, so it read **5 of 6 = 83%** — and
§248's OUTCOME still went through the YEAR's share, reading **88% for every one
of ten window shapes** at August: one number for ten periods. The share is now
supplied to the one arithmetic (`measureDue`/`measureScore`/`measureDueLabel`
take an optional share; a measure passes nothing, a tactic's outcome passes
`tacticShare(t)`), and it is an **exact fraction** — the first draft read it back
out of the rounded per cent and moved a whole-year tactic from 88% to 87%.
Islam's case: annual target 12 over Apr–Sep reads **10** at August, and 7 against
it scores **70%** where it read 88%.

**Nothing stored moves, measured not asserted:** 842–852 scores — ten units,
their pillars, every measure and tactic, all eight capabilities, the group and
both companies — read off the shipped build and this one at **six review points**
including unset, identical at every one. **Proved able to fail: 15 red** on the
shipped build, the reporting pane printing `8 # of 12 #`.

**§250.1 — and it nearly shipped a silent disaster.** `pillarPerf` mapped
`measureScore` point-free, and `Array.map` hands its callback the INDEX — so the
new optional share would have been 0, then 1, then 2 down every pillar (one
pillar **100 → not scored**, another **83 → 65**), wrong only for the `Sum` rows.
Guarded by `checks/tactic-proration.py` §2b. The probe that should have caught it
was itself blind, comparing two identical crash strings (§94.5).

**§250.2 — recorded, not done:** the review deck still ignores an outcome
entirely (`present.js` prints `t.actual` against `tacticPlanned`), measured
byte-identical before and after — §248's omission, and correcting it is a
decision about what a slide shows for a row measured in stores.

Green: `tactic-proration` (33), `ytd-proration`, `tactic-outcome` (47),
`submit-gate`, `table-fit`, `cycle-board`, `project-tables`, `plan-fields`,
`gap-fill`, `gap-walk`, `save-fidelity`, the full `qa.py` sweep (ERRORS none),
`test-authorize` 472/0, `test-graph-diff` 126/0.
### §270 — three loose ends closed (2026-09-02, same branch)

Islam, on the three things §268 and §269 had recorded and not done: *"1. make
the fix, noting that editing is only for the smo for now anyway 2. ok will see
it later 3. ok."*

**The screen and the save were asking two different questions.** For a
supporting function's plan, the save checks the *function's* Strategy setting
and the screen checked the *business unit's*. Measured: **nothing changes on
this tenant** — both settings hold the same value for every role, and editing is
the office's anyway, which is exactly why it was safe to fix now. Set them
differently, which is the whole point of having two, and **six people** would
get an Edit button that refuses to save, or be refused one that would have
worked. Fixed in the three places the browser asks, rather than at the twenty
places that ask them.

**The remove × sits beside its field again** on Who we are (6) and the SWOT
(23) — about 400px of empty height between them. The SWOT needed a column
rather than a width, which the check caught on the build that was meant to have
fixed it.

**And two automatic tests stopped crying wolf.** Neither was a real problem: one
was looking for something deliberately removed weeks ago (with another test
asserting its absence — two tests arguing), the other had a fault in its own
setup. A test that is always red is one people stop reading.

25 checks green including the two that were red, full sweep clean, server 454/0
and 126/0, build byte-identical.

*The falsification is worth keeping: with the permissions fix reverted, the
shipped data still passes all 264 person × function pairs. Only a deliberately
divergent tenant goes red — a check that walked only what is in front of it
would have blessed the broken build.*

### §269 — one edit, one done (2026-09-02, same branch)

Islam, on §268: *"the edit opens all so I don't need to edit each tab and then
save for each — it's one edit and one save?"*

**Right, and what was there was worse than three presses.** Measured first: the
edit mode was held per SECTION and is only cleared when you change tab or
destination — so opening Foundation and walking to SWOT left Foundation open
behind you with the line reading *Edit*, and opening the Plan as well gave two
open modes whose single control could close only the one you were standing on.
A control whose word is true of one section and false of the one beside it.

One press now opens every section of the Strategy tab, one press closes them
all, and the word reads the same wherever you stand — **filtered to what that
person may author**, which on a unit is the one Strategy grant (measured: its
three pages can never differ) and on a supporting function is two separate
columns. The red *Fill in what is empty* opens the same mode, so the two doors
cannot leave the tab in a state the Edit button cannot describe.

**And §268 had taken something away without noticing.** A fill-grant holder's
way out of fill mode used to be the corner control; §268 removed it as a
duplicate, and the bar only draws *Done filling* once nothing is missing — so a
custodian with gaps left could leave only by changing tab. Restored, drawn
beside *Next gap*, and asserted in both states. It surfaced as a check timing
out on a control that was no longer there, not by anybody reading the code.

`checks/plan-edit-line.py` §1b–§1d: 8 red with the behaviour broken, printing
the old fault verbatim. Twenty checks green, full `qa.py` sweep clean, server
454/0 and 126/0.

*Recorded, not fixed — both pre-existing: the screen asks the unit's Strategy
column for a supporting function's plan where the server asks the function's
(they never disagree on this tenant, and correcting it would move rights); and
the SWOT's remove × wraps onto its own line, because §114.4's fix is scoped to
table cells and those fields are list items.*

### §268 — the strategy pen lives on the section line (2026-09-02, this branch)

Islam: *"the edit button of the plans can you make it in the same line of the
foundation sowt and plan? as it's a better placement for opening and savng?
verifying that it's only in the startegy anyway and not anywhere else."*

**Checked first, and the check said more than the ask did.** With the plan open
the line ALREADY carried a control — `Done filling`, the wrong word for the
office (who are editing, not filling) and stripped of its button dress by
`.tabs button`, which is §145.14's own recorded trap on the one control it
missed. What was genuinely absent was the way IN. The pen sat at four different
heights depending on the section (234 · 233 · 236 · 308) and **twice** on a
two-project function, the second copy below the fold, both throwing one flag.
Foundation and SWOT were hover-only, so on a tablet the pen measured hidden
until the card itself was tapped — §70's own finding, fixed for the pane in
August and left on the cards.

**Islam picked A** (the red fill button stays beside the pen for the office) and
**the whole Strategy tab** from three placements drawn into the real page and
published as a mockup; the pen glyph was rejected because a 28px hollow circle
built for a card corner all but disappears in a wide tab row. **Not `Save`** —
asked, answered and recorded: the platform writes as you type, so the word would
say the work is lost until it is pressed.

**One map now answers which page a section's pen is**, read by the pen and by
the fill bar — which fixed a bug nobody had reported: a pillars function's
Overview button named `foundation` while that page has read `capfoundation`
since §213, so it set a flag nothing acts on and opened **0 editable fields**,
rendering perfectly the whole time.

**The group is untouched**, which answers the second half of the ask: within a
unit and a supporting function the pen is only on the Strategy tab, and the
group's own Foundation and Temple are tabs with no section line, so both keep
their controls. Arrange stays in the pane's corner (§101's arrows go to somebody
who may reorder and not author, so the slot is never shared), and the pillar's
pinned head keeps its code, name field and Remove.

`checks/plan-edit-line.py`: **48 red** on the build before, all green after.
Contrast 8.95/5.32 light and 8.53/9.82 dark. Full `qa.py` sweep clean, ERRORS
none. **The check sweep was most of the work** — fourteen check files and
`qa.py` pressed the moved pen and would have gone silently green (§51.11).

*Two pre-existing failures were left alone rather than quietly folded in:
`strategy-office.py` §4 and `report-saves.py` fail identically on the previous
build.*

### §236.3 — slide by slide, only the originals pinned (2026-09-01, same branch)

Islam, testing §236.2: "the slides jump from slide 9 to 13 one jump .. the added
slides can move slide by slide the prohipted slides from the movement are the
original slides." Right — §236.2 stopped the dead presses and drew its landing
places from the anchors that already existed, so the SWOT run and the pillar
dividers were still hopped four at a time. Every ORIGINAL slide is a landing
place now (unit: SWOT title, three categories, each pillar title; function:
capability cover, key objectives, project title, milestones), existing keys
unmoved so placed pictures stay put, no migration. A split table's parts stay
ONE stop — a picture cannot sit between a table and its own continuation.
`checks/slide-move.py`: 6 red pre-§236.3 (printing his jump), 20 green after;
deck-adjacent checks and full qa.py green.

### §236.2 — a picture slide can travel the whole deck (2026-09-01, same branch)

Islam, using §236's arrows: "the rearrange of slides doesn't move around the
fixed slides of the main flow." Measured: 25 dead presses of 28 on Mobile's
deck; a function's slide never moved at all. The stored position is an anchor
(§50.3) and the arrows stepped blindly one row, so a press into an unanchored
run recomputed the same position — a button doing nothing, silently. His two
decisions: the arrows now jump to the nearest real landing place, and between
a pillar's measures and tactics IS a place (each measures slide takes its own
anchor; a project's deliverables slide mirrors it on a function's deck,
§53.5). Projector honours the new places for free — one placement function.
`checks/slide-move.py`: 5 red on the pre-§236.2 build, 18 green after;
hide-element, project-tables, repeat-project and full qa.py green.

### §236 — "Add slide after" (2026-09-01, on `claude/slide-insertion-rearrange-fga828`)

Islam's wording on Manage slides' Add button: `+ Add a slide` becomes
**`+ Add slide after`**, so the button says where the empty slide lands. The
hint under it keeps only its half of the sentence ("the one selected" / "the
slide selected below") instead of repeating "after"; the read-mode prose names
the control by its new name. **His rearrange question needed no build**: §51.10's
▲▼ arrows already move ADDED slides only, over generated neighbours too, with
the generated order fixed — exactly the design he proposed. Verified by driving
Mobile's deck: slide added at position 4 with slide 3 selected, arrives
selected, arrows still step it, generated slides offer none, no errors.
*(The open findability question answered itself in §236.2: he found the
arrows, and they were broken — fixed there.)*


### §230 / §230.2 — the hard-refresh notice (merged to `main` 2026-09-01)

- **§230:** when the server's answer arrives after the page's 8-second
  give-up (cold start after a deployment), the real page now appears by
  itself and the notice comes down — no reload, nothing pressed. Measured
  first: the server is healthy; only the cold first answer exceeds 8s.
- **§230.2:** the notice's words are the user's — *Just a moment… / Your
  page is taking a little longer to open. Your work is safe. / It will open
  by itself — no need to do anything. / Try again* — and the "look at the
  example" link is removed at Islam's direction (cost stated: while the
  server is truly down there is no way past).
- Proof: `checks/boot-skeleton.py` §6 new, §4 rewritten — 2 red on the
  build before; ALL GREEN after; full `qa.py` clean.

### §233 — hiding an element from the presentation (2026-09-01, on `claude/smo-hide-element-ppt-s3rodi`)

Islam's three decisions, mockup signed off the same day: hidden is NOT
counted, rows only (never a pillar, capability or project), the workbook
carries the mark. One predicate (`SMPRules.isHidden`/`shown`) runs every
reader — scores, reporting asks, the note rule, Submit, the gap count and
walk, the reporting pane, the deck, the .pptx builder — because not counted
means not asked and not owed. The pen's eye toggles `row.hide` (an absence,
riding extra, no migration); read mode wears "Hidden — not counted" for
everyone; every row sheet gains a Hidden column read both ways.
`checks/hide-element.py`: 17 red pre-§233, 21 green after; the
neighbourhood and the full sweep green; the server suites untouched
(451/106).

### §232 — removing a pillar or a project (2026-09-01, on `claude/smo-hide-element-ppt-s3rodi`)

The mockup an earlier session published for sign-off, signed off by Islam and
built: a worded quiet-red Remove control in the pinned editing head (a
pillar's edhead, a project's edband), drawn only while the pen is open,
opening the platform's own confirmation — what the thing holds, what has been
reported this cycle, and the archive-first way back. Never renumbers (ids are
what figures and snapshots key on); the server needed nothing. **And the way
back was broken for every pillars function** — `restoreArchive()` could not
resolve an `fn:` archive — fixed at both ends, because §232's confirmation
promises it. `checks/pillar-project-remove.py`: 13 red on the pre-§232 build,
27 green after; neighbours and the full sweep green.

### v3.80 — the pending count says where, and walks you there (§192)

- **The badge pointed nowhere.** As the SMO you were told three values were
  waiting for you and given no way to find them.
- **And it printed under the button beside it** — 160 pixels of overlap
  reading, 110 while filling, measured on the real page.
- **The number was never that pillar's**: it counts the whole unit. It moves to
  the totals row where the unit's other counts already are (Islam's pick of two
  drawn options), and the collision goes with it.
- **"Next pending" walks you through them**, the same way "Next gap" already
  does — across pillars and across sections — landing on the tick that confirms
  each one. Confirming updates the count and the button as you go.
- **Only somebody who can confirm gets the walk.** A filler sees the count,
  because those values are still theirs to correct.
- **The bug worth knowing:** the new chip was given a name the product already
  used for something else, which silently stopped every confirm tick in the
  platform being drawn. Found by driving it, not by reading it.
- Proof: `checks/pending-walk.py` is new — 14 red on the build before,
  including the reported overlap.

### v3.83 — editing a pillar keeps its head (§194)

- **The name box now runs the whole line** — it was 228px in a pane 1225px
  wide, which is why a long title stacked up in a narrow column.
- **The code, the name and the Done tick stay put when you scroll.** Reading
  has always kept a band pinned; editing had no equivalent, so the mode you
  work in was the one that lost its place.
- **The unlabelled box under Owner is hidden**, as you asked. Worth knowing:
  that field is still stored but now shows nowhere, so a value that came in
  with an upload can't be corrected from any screen. One line to give back.
- Proof: `checks/plan-edit-head.py` is new — 10 red on the build before.

### v3.82 — "Sending…" stops lying, and home moves left (§193)

- **The reply says "Sent." within about two seconds** instead of sitting on
  *Sending…* for as long as the email takes. The server stores your reply first
  and emails it second, and it only used to speak when both were done.
- **Then it upgrades to "Sent, and emailed to …"** when the email finishes —
  two true sentences in the right order.
- **A request that never comes back now says so** rather than leaving the word
  up for ever. It says the reply may still have gone and points at the thread,
  because that's the truth — and it can never take back a "Sent." you've
  already seen.
- **The home button moved to the far left**, for everyone. It was beside the
  gear, and the gear is the Setup door — which most people never see at all.

### v3.80b — the gap walk reaches every place again (§192.4)

- **"Next gap" on a unit reached two places out of five**, then ran out. It was
  never stuck: it walks every field it has marked, and in the first pillar it
  had marked **six** while the band counted **one**.
- **Five of the six were collaborator boxes.** When we stopped counting missing
  collaborators as missing items, the counts changed and the walker didn't — so
  every press went to a row nothing was asking about, and the walk never got as
  far as Foundation, Objectives or the last two pillars.
- Now the walk visits exactly what the count counts.
- **Left alone, and flagged:** a collaborator box still shows the red "Missing"
  dress while you're filling, even though it is no longer counted. That's a look
  question, so it needs a mockup and your say-so.
- It was reproduced on what's live now before anything was changed, so we knew
  it wasn't from the work beside it.

### v3.79 — a line the platform cannot name is nobody's to change (§191)

- **The hole.** The system works out what changed by matching plan lines
  against their reference numbers. A line with no number matched nothing, so
  nothing was compared — which read as *nothing changed*, and nothing changed
  is allowed. Measured: a **view-only** unit head could rewrite a key
  objective, a pillar, a measure, a tactic and a project's details.
- **Three ways a line goes unnamed** — no number, an empty one, or two lines
  sharing one — and all three are now refused.
- **Three places do the matching**, not one. Fixing the shared one closed three
  of four cases; the sweep across all nine lists found the other two.
- **The rule:** a list the system cannot match line by line is the Strategy
  Office's. Leaving it alone still costs nobody anything.
- **The shipped data is clean** except the group's own six objectives, which
  nobody could ever have edited anyway — they're refused by a separate rule.
  They now carry numbers, with migration 034 for tenants already running.
- **The first draft of that migration would have caused the problem it fixes** —
  it would have handed an existing line a number another line already had.
  Caught by running it against a real database, in four different shapes.
- Proof: 416 assertions pass. Proved able to fail — 19 / 3 / 3 red with each
  of the three guards taken out in turn.

### v3.78 — an attention item you can answer, on the box it is about (§190)

- **Three of the seven kinds could never be cleared.** A seat somebody meant to
  give, a row that never signs in, and two people who really are two people —
  each counted on the button, the Setup Overview and the welcome screen for
  ever, with no data to change that would answer them. A count nobody can get
  to zero is one people stop reading.
- **Every kind has a Dismiss now**, under the box it is about, except a
  declaration — which has had its own since §180 and keeps exactly one control.
- **The sentence moved onto the field**, inside a ring on the whole field
  (label and control), in the warning ground. §116.2's band above the fields
  said what was wrong and left nine boxes to guess between — and it was the
  queue's alone, so *Edit details* said nothing at all.
- **A dismissal remembers WHAT it answered.** Dismissing a Super user seat says
  nothing about the next one: move the person and the item comes straight back.
  That is what makes a dismiss safe to give at §186's own alarm.
- Stored as an absence on `people.extra` — **no migration**, and no server
  change (a non-seat person edit already classifies as `setup`).
- Proof: `checks/attention-dismiss.py` is new — one item per kind, the ring
  measured as paint, one press clearing all three surfaces, both ends.
  **21 red** on the pre-§190 build. `qa.py` clean.
- **Two of its own first failures were the check**: the stub answered the wrong
  action names, so the two server-backed kinds read as *not raised* on a build
  that raises them perfectly. `people-dialog.py` carries the same two typos.

### v3.77 — plan titles you can read while you edit them (§189)

- **They could not wrap at all.** Every title and description on a plan was a
  single-line input. Measured with the pen open: 4 of 23 boxes clipped at
  1440px, 8 at 1100px on a unit's Plan; on a function's Projects the
  Description column already had two clipped cells in the demo's own data.
- **Pillar, measure, tactic, milestone, description, deliverable, outcome,
  project name, sub-line and the Brief** all grow to fit now, on units and
  functions alike.
- **Short fields are untouched** — direction, target, compile rule, dates,
  Repeats, and the picked owner and collaborators. Asserted, so a build that
  turned everything into a paragraph box would fail.
- **It broke the remove ×**, which now sat under the field instead of beside
  it — caught by `plan-fields.py` going red, not by reading the CSS.
- Proof: `checks/plan-wrap.py` is new, asserts the problem rather than the
  control, both ends, two widths, both panes. **14 red** on main.

### v3.76 — the office inbox: the caret, the box, the pill and the tag (§188)

- **Three of the four are one omission.** The corner chat panel was built
  carefully against exactly these faults; the office's own inbox — the surface
  the office lives in — got a thinner version that skipped them.
- **The caret** no longer jumps: only the messages redraw while you have the
  cursor in the reply box. Your text was already being carried across, which
  is why it read as the cursor moving rather than work being lost.
- **The reply box grows** with what you type, like the corner's already did.
- **The rail's pill follows the inbox.** Both numbers were right and of
  different ages — the inbox re-asks every beat, the pill was fetched once per
  visit and never told the summary had changed. Replying is the act that makes
  it wrong. The pill is rewritten in place, never by repainting.
- **A reply that left by email says so**, with the address on the hover.
  Migration 033 adds the column. Nothing is backfilled — the platform never
  recorded it, so nothing is claimed for messages already sent.
- Proof: `checks/office-inbox.py` is new, over HTTP with a stub, **6 red** on
  main. Two of its own first runs were the check: Playwright types `\n` as
  Enter (which sends), so the caret assertions compared "" with "" and passed;
  and 129 characters in a 964px box fits on one line, so the grow test called
  a working build broken.

### Awaiting sign-off — the plan's titles (§188.5)

- Measured with the pen open: **4 of 23 boxes clip their text at 1440px, 8 at
  1100px.** Not because they wrap badly — because every title on a plan is a
  single-line input and cannot wrap at all.
- Mockup published; nothing applied.

### v3.75 — a seat is granted, never derived, and four small ones (§187)

- **`level: "smo"` no longer makes anybody a Super user.** The role rules read
  a field from before roles existed, so a person carrying it derived Super
  user on the screen *and* on the server. Nothing has written it for fifty
  versions — which is what made it dangerous. Islam's instruction: a seat is
  granted on the register and nothing else.
- **"N people hold a seat" on the register**, with every holder on the hover.
  This closes the hole I measured and told him about: the attention queue is
  deliberately quiet about a seat held by somebody who sits at the group.
  Always drawn — a count that vanishes cannot be trusted to be complete.
- **Collaborators are no longer a missing item** (reversing §145.10 at his
  direction). A tactic with nobody supporting it is one person's to run.
- **The welcome header** at 204px — his pick from the mockup. The tenant block
  held its place at every width tested; below 820px it stacks again on
  purpose, and that is asserted.
- **The chat inbox list shows the name, not the full one.** §181 did the
  thread and stopped at the queue — a different builder. Search matches both.
- Proof: `checks/seat-count-and-small.py` is new, every assertion at both
  ends, **9 red** on main's build. `test-authorize.js` §22 added and its
  collaborators block moved to the new contract — **352 passed**.
- **Out of this round by his call:** the Overview redesign and the
  squeezed-window damage. **The chat caret** is banked with his answer — it
  happens while typing, after a few seconds, which points at the poll.

### v3.74 — a seat is not an ordinary role (§186)

- **It was not impossible, and I had said it was.** The register's role picker
  is a plain dropdown, and a role with one destination is granted on the pick
  (§92) — a seat has one destination. So Super user was one selection with
  nothing in between. The people file's Role column was the same grant by
  another road.
- **One line stood behind both:** the grantable test excluded only the derived
  floor roles and said nothing about seats.
- **The server was always right** — a seat move is an `access` change, which
  is the Super user's. The fault was the screen offering what the save
  refuses, and going through instantly for the one person it does not refuse.
- **Now:** seats are not offered to anybody who may not give one, in the
  picker or in the workbook template; and the Super user is asked, with the
  ask naming the person, the role and what it hands over.
- **The ask is state in the dialog's body, never its own modal** — the first
  build used one and the register's repaint painted straight back over it.
- **The register watches**: a seat whose place is not where the person sits
  joins the attention queue, under a collision and above every gap. The test
  is the place, not "holds two roles" — the bootstrap SMO holds a seat and
  heads the SMO function, and must not be nagged.
- **Not claimed:** who granted Hussein's seat and when. The change log holds
  it; that needs the database.
- Proof: `checks/seat-grant.py` is new, every assertion at both ends, proved
  able to fail **2 and 3** ways. `role-picker.py` moved to the new contract —
  it was asserting §92's grant-on-pick, which is the behaviour that caused
  this. 345 server assertions pass; `qa.py` clean.

### v3.73 — viewing as somebody, a way back, and a mark nobody could see (§185)

- **"Viewing as" used your rights, not theirs.** Measured: the same edit,
  refused for Hala and accepted for the SMO. The server reads the person off
  the session, so simulating somebody changed everything the screen drew and
  nothing it accepted — no refusal anybody meets could be reproduced from the
  office, and the office could write through a colleague's view what that
  colleague never could. The simulated person now travels with the save.
- **It can only narrow.** The gate is the seat role on the session, the person
  is looked up in the stored register, and an unknown key is refused rather
  than treated as somebody with no roles. `SMPRules.actingFor()` is the rule,
  so it is testable without a database.
- **A refusal while simulating says so** — "Setup is the SMO's" is baffling
  when you are the SMO.
- **A way back to the welcome screen**: a house beside the gear, drawn
  independently of it so it is not the office's alone.
- **The dismissed mark is CSS, not a character.** §180 proved the dotted circle
  was not tofu; re-measured, it laid down 29 ink pixels against tofu's 28. It
  is a 9px ring now, filled while waiting and open once answered.
- Proof: `test-authorize.js` §21 (**345 passed**), `people-dialog.py`
  re-pointed at the visible mark, `welcome.py` and `refusal-keeps-work.py`
  green, `qa.py` clean.
- **Awaiting sign-off, not applied:** the welcome header when somebody holds
  two long roles — the tenant block wraps below at every width measured
  (294px → 204px header). Mockup published; rule 1c, nothing touched.

### v3.72 — a date the platform cannot read, and a refusal that costs one row (§184)

- **The CX custodian's loss, reproduced against the real authoriser first.**
  An empty due date filled is accepted; the same act on a date holding
  `30/09/2026` is refused, because a non-blank value is not a gap so
  correcting it is *authoring*, which is the office's. The refusal is right.
  The loss is that the whole graph posts together, so one refused row failed
  the whole save and took three legitimate fills with it — and the only
  control on the banner destroyed them. That is why the SMO never received
  them: they were never stored.
- **`monthsOf()` moved into `lib/rules.js`.** The platform's definition of a
  time lived in the browser alone, so the screen and the server answered "is
  this a date" differently. One reader now; `dueFits()` uses it too.
- **An unreadable date is a gap**, keyed on the field name (`start`, `end`,
  `finish`), asked by the counts, the cell and the server through one
  function. A readable one is still the office's — asserted at both ends.
- **The row opens AND still shows what is stored.** Rendering *Missing* over
  `30/09/2026` would hide the value the person is being asked to correct.
- **A refusal now carries an address**, not only a sentence: target, row id,
  field, and the value the row held. The banner names the lines and offers
  **"Put back those lines and save the rest"**. Discard stays, and is never
  the only control again.
- **A change with no row address offers no button** — the server decides
  that, because a button that cannot work is worse than the destructive one.
- **Nothing stored, nothing migrated.**
- Proof: `test-authorize.js` §19–§20 (**336 passed**), proved able to fail 3
  and 2 ways; `checks/refusal-keeps-work.py` is new, drives the whole path in
  a browser with the **real authoriser behind the stub**, and is **11 red** on
  the previous build; `checks/milestone-fill.py` §9. `qa.py` clean.
- **Recorded, not fixed:** the put-back is offered only when every refusal in
  one response is addressable. A save mixing an addressable refusal with an
  un-addressable one still offers Discard alone — nothing is destroyed
  unasked, but the platform cannot rescue it automatically.

### v3.65 — a function could not report at all, and Save draft never finished (§183)

- **A supporting function that plans in pillars reported nothing.** Its
  reporting page is drawn by the unit's renderer, and both field handlers
  looked the subject up with `UNITS[current]` — undefined for `fn:…` — so the
  handler threw and every figure and note typed was discarded in silence.
  Measured: 0 saves before, 1 after. §63's own fault in the two places that
  fix did not reach.
- **Save draft sat on "Saving…" for ever.** A caller arriving while another
  save was in flight was told `"busy"` and nothing ever followed up. Since
  §170's leading-edge autosave this is the ordinary sequence, not a race: the
  button you press right after typing lands inside the flight. Such a caller
  is parked and answered when the next save settles.
- `"busy"` stops being an outcome, so both readers of it go — including
  §170's 300ms retry timer, which the parking replaces.
- `checks/report-saves.py` is new: a figure and a note on a unit, a capability
  function AND a pillars function must reach the stored plan and schedule a
  save. **5 red** on the previous build.
- **Not reproduced:** filling a missing date on a function stamps its pending
  mark correctly here. Left open rather than claimed fixed.

### v3.65 — dismissing a declaration (§180)

- **Accepting always worked** — driven, not read: Use it moved the person, the
  count cleared, the queue emptied. What never existed was the other answer.
- **There was no dismiss anywhere** — not on the row, not in the dialog, not in
  the server — so a claim the SMO disagreed with kept its mark, its queue
  entry, the register badge, the rail pill and the Overview row for ever. The
  Overview has promised "accept or dismiss" since §108.10.
- **The claim is kept and marked answered** (Islam's pick of three), not
  deleted. Migration 031, nothing backfilled, nobody's access moves.
- **Saying it again clears the answer** — a fresh statement is owed a fresh
  reply. There is deliberately no un-dismiss: changing your mind is accepting.
- **The glyph carries the state, not the colour** — `◎` waiting, `◌` answered.
  One ring in two inks was drawn first and the mockup killed it: 9.6px at 11px
  type is too small for a colour to be a state.
- Proved against a real Postgres 16 (virgin round trip, and the migration on a
  tenant that predates the column) and in `checks/people-dialog.py` §8,
  **proved able to fail twice**.

### v3.65 — four from using it (§179)

- **Viewing as reaches the welcome screen.** The screen covers the window, so
  the control underneath could not be reached at all. It sits above the
  greeting — Islam's pick of two placements drawn in the running product — and
  switching redraws the screen for that person. Only a Super-user session gets
  it, asked through the same function the chrome asks.
- **Greeted on every sign-in.** "Seen" was remembered for the browser session
  and signing out only reloads the page in the same tab, so the memory outlived
  the session. It is cleared when a credential is accepted — never on a plain
  refresh, never on a resume.
- **A project's Start and End are picked, as `Jul 26`** — §177's own control,
  reused rather than a second way to say a date. **Not only a look:**
  `30/4/2026` was unreadable to the platform, so that project's End was no date
  and the overrun warning could never fire on it; and `Date.parse("Jul 26")` is
  26 July **2001**, so shipping the picker without repairing the reader would
  have woken a dead warning as a false one on every milestone.
- **Deliverable and Outcome are plain text.** One builder, three panes; the
  column keeps its measure so nothing reflows, and the rows come in 17px
  shorter.
- Dates already written are untouched, a quarter can no longer be a Start or
  End, and nothing moves on the demo (2 overruns before, 2 after).
- `checks/project-dates.py` is new (**5 red** on the previous build);
  `checks/welcome.py` gains §8 and §9 (**2 red**); `checks/project-header.py`
  presses the picker instead of typing. `qa.py` green.

### v3.65 — who owns every place, named once (§175)

- **Islam asked about the CEO rows; both were already right** — a Group CEO owns
  every unit and function (so the *other* columns were already dashed), a
  Company CEO owns their company's units and never a function (so *own
  function* was already dashed).
- **The question found the SMO team row instead.** It read `a_unit_other` /
  `a_fn_other` for everything, so its four *own* cells could never be consulted
  — and it silently behaved differently from the Super user, whose grants it is
  meant to share.
- **The cause was two lists**: `roleOwns()` and the matrix each kept their own
  idea of who owns everything, and neither included the SMO team. One exported
  rule now, asked by both.
- **The SMO team joins the Super user and the Group CEO**, at Islam's direction.
  Nothing moves on a default tenant; a tenant that had narrowed the
  other-columns widens for its SMO team.
- **The check asserts the agreement for every role** rather than the pairs
  somebody noticed — offered-but-unreachable and reachable-but-not-offered,
  both ends. **3 red** with the SMO team reverted.

### v3.65 — the matrix header, and two cells that could never come up (§173–§174)

- **The header is smaller and it stays.** Settled from a mockup drawn in the
  real page: **83px → 53px**, no heading past two lines from 1600 down to 1024,
  the top row vertically centred, and both rows of the head pinned while the
  rows scroll under them. Islam's own acronyms did not meet his own two-line
  rule at 1180 — shown the measurement he picked the shortest wording (Own
  Func. / Other Func.) and kept *Reporting cycle*.
- **`short` is the header's word, `label` is still the product's**, so the full
  name is on every hover and no sentence anywhere changed.
- **Two cells that could never come up are gone**: a Project owner is only ever
  derived on a supporting function, so the own-BU columns can never be theirs;
  and a BU owner can never hold an own supporting function. Defaults were
  already `none`, so nobody's access moves — what goes is an option with
  nothing behind it.
- **One of the two reported examples was wrong and is recorded as such**: a
  Pillar owner IS derived on a function that plans in pillars, so those cells
  stay, and the check asserts they stay.
- **A refresh stays where you are** (§173) — remembered in sessionStorage, so a
  new session still opens where §94.6 says.
- `checks/access-header.py` **13 red** on the previous build; `checks/stay-put.py`
  asserts both halves.

### v3.64 — fill is a grant, and the constraint never heard (§172)

- **The Roles & access 500, found.** §145 gave the Strategy cells a third state
  — **Fill gaps** — and `db/schema.sql` still allowed only none/view/edit. So
  granting it violated a CHECK constraint, `writeState` threw, and the save
  answered 500.
- **It was never one save.** The whole graph is posted each time, so the refused
  value stayed on screen and in every later payload: from that press onward
  **every save of every page failed**. That is why it read as "Roles & access
  never saves".
- Fixed in `schema.sql` and migration **030** (idempotent, backfills nothing —
  no stored row could hold a value the database was refusing). Both paths
  driven: a virgin database and an existing one.
- **The blind spot is closed**: the seed grants no `fill`, so the round trip had
  never offered the fourth value to the database. It now writes one grant of
  every value in `STATE_RANK` — read from the shared rule, not listed — and
  fails loudly on the old constraint.
- §171's banner is what made this findable in twenty minutes instead of another
  round of guessing.

### v3.64 — a failed save says so (§171)

- **Islam reported Roles & access not saving a second time.** It saves in every
  configuration this repository can build — the demo tenant, a **cleared**
  tenant (what a real deployment is), and a refresh 150ms after the press, read
  back from `access_grants` each time. Production's `/api/state` answers 401
  rather than 500 unauthenticated, and `ensureReady()` runs before the session
  check, so its migrations apply cleanly. Nothing visible from here is broken.
- **So what was fixed is the invisibility.** A save that FAILS wrote one line to
  a console nobody has open, which makes a 500, a dropped connection or a
  timeout look exactly like a save that worked. Three silences closed: a server
  error (naming the status), an unreachable server, and — the truly silent one
  — a **remembered refusal**, where `save()` short-circuits before the banner is
  ever drawn. Demo data now says so at the moment of the change too.
- **This is a diagnostic, not a cure.** If the next attempt shows a banner, its
  sentence says where to look. If it shows nothing and the value still reverts,
  the save is landing and the fault is past it.
- `checks/save-said.py` drives seven states through a stub that can be told to
  fail; **5 red** on the previous build.

### v3.64 — a change is saved at once (§170)

- **Press a setting and refresh straight away, and it used to be lost** — on
  every page in the product. The autosave waited 800ms; §138's flush-on-leave
  was meant to cover that and cannot, because `keepalive` caps a body at 64KB
  and **one SMP save is 216,307 bytes**. Measured, not reasoned: pressed a
  Roles & access cell, reloaded 150ms later, the row was unchanged.
- **The wait goes, the coalescing stays.** `afterPaint()` is a leading-edge
  debounce now: the first change of a burst is sent immediately and the
  trailing timer still runs, so one press is durable at once and five presses
  in half a second cost two saves instead of five. Typing is untouched (a field
  writes on blur, so a keystroke never reached that path).
- **One place, no list of controls** — every writer ends in `paint()` and every
  `paint()` ends in `afterPaint()`, so a control added later is covered.
- Verified end to end against a real Postgres on **Roles & access, Scoring
  bands and Terminology** — pressed, refreshed at 150ms, read back from their
  own tables. `checks/save-flush.py` gains the "on the wire inside 250ms"
  assertion, which is **0 posts on the previous build**.

### v3.64 — a Setup page that fits, an editable scale, and the away threshold (§167–§169)

- **The Platform Inbox's headers, and the Setup rail's, stop being lost.**
  `.setuprail` is sticky and on a page where the rail is the tallest thing in
  its row it has **zero travel**, so it never pins — measured on the Inbox at
  1440×760, rail at y=37 and its head at y=38 behind a chrome ending at 75.
  The scroll that did it was 60px the page never needed: `.wrap` ends every
  page with `padding-bottom:80px` while three caps reserved 20 (§122.5's own
  fault, third time). Two numbers now — `--page-foot` for a page of content,
  `--pane-foot` for one capped to the window — because reserving the full 80
  turned the register's table 80px short of the fold and
  `checks/register-header.py` said so six times.
- **The scoring bands are the tenant's**: add a level, remove one, and set each
  one's colour from the five the product paints. The colour **is** the key, so
  picking red is also what makes that level one a reporter has to explain
  (`needsNote()`). Two levels is the floor and the reason is on the page; the
  bottom level always starts at 0. The two stale notes go (one cited a file
  that is not in this product); the "changing a threshold rewrites history"
  warning stays.
- **How long somebody counts as away is a setting**, on the Away email row —
  1 to 120 minutes, off the shipped 3, read by the server and by the row's own
  sentence from one place in `lib/rules.js`. It was a constant in `api/chat.js`
  and a hardcoded "three minutes" in prose beside it.
- **Two checks were blind to §148's welcome screen** and one of them had been
  reporting it as a product defect for a section. Both suppress it now.
- Verified: `checks/setup-sticky.py` (**16 failures** on the previous build),
  `checks/scoring-bands.py` (**4 then a crash**), `scripts/test-chat.js`
  (**57 passed**, 3 red with the server's constant restored),
  `scripts/test-authorize.js` (306 passed), the round trip on a **virgin
  database** (clean slate / round trip / fixed point / archive all PASS), a
  five-band tenant with two levels sharing a colour round-tripped through real
  Postgres, and the full `qa.py` sweep.

### v3.62 — the Performance line, three bands, and two headers over their own rows (§162–§163)

- Islam's seven from a squeezed window; five needed a decision and he gave
  them, two were defects.
- **The hover WAS working** — as a native `title`. Product bubble now, on hover
  and on focus (a tap). Then **the black box**: the compiled cell built its own
  span and kept its own `title`, so it took the new bubble with no words in it
  and the tooltip a second later. §96 again.
- **The bands are a row in a table**, hydrated over the baked default — which
  is why changing what ships changed nothing for him. Migration 029 moves a
  tenant still on the shipped four and leaves a customised one alone; both
  cases and the full round trip driven against a real Postgres.
- **§163.5, the one worth reading**: every Setup table pinned its header to a
  PAGE offset inside a box that scrolls, so the offset resolved from the top of
  the TABLE — the Scoring bands heading 136px down its own body, across the
  third row, at every width unscrolled. §130.2 fixed `.acgrid` and stopped.
- **And my own first guard broke something real**: raising the pinned pane
  title above everything made fill fields unclickable and the sweep failed. The
  tie needed breaking from below.
- Also: the colour banner was the page's control row; the squeezed rail had
  said `display:flex` for versions and meant nothing by it; the chart legend
  kept a second copy of the bands that already disagreed.
- **Awaiting sign-off**: the editable Scoring bands table (add/remove a level,
  set the colour) — the open question is a choice of the product's five colours
  versus a free picker.

### v3.60 — the Performance line, Bands, three bands, a real hover (§161)

- Islam's remaining five from using the product; settled from a mockup drawn
  into the real platform and confirmed before a source was touched.
- **The hover WAS working** — as a native `title`: a second's delay, an 11px
  target, and on an iPad nothing at all. It is the product's own bubble now,
  opening on hover **and on focus**, which is what a tap gives. The `title` is
  removed rather than kept beside it.
- **The colour bar was also the page's control row**, which is why Report and
  Presentation read as a row of their own. Banner gone; the three controls sit
  right on the Performance line; the page gains a whole row.
- **Bands** (his word, over "Colour key") — one noun shared with the Setup page
  that edits them. Opens under its button, shuts on a second press or a click
  outside.
- **Three bands: 90+ / 70–89 / below 70.** `warn` leaves the default, not the
  product — the list is a tenant setting, so a deployment that saved four keeps
  them. Nobody's note obligations move.
- **The chart legend kept its own copy and it was already wrong** (70/50/50
  against the real 85/70/50) — found by reading the function the mockup made me
  open. Derived now.
- **§145.14 came back and the mockup caught it**: `.tabs button` outranks a
  bare class, so the new button first rendered as plain words.
- **§161.2 — the squeezed-window damage is guarded, not fixed.** The trigger
  was never reproduced (ten widths, every scroll offset, both ways in, two
  hypotheses tested and both wrong). What is fixed is the one undecided thing:
  the frozen header cells tied with the pinned title at z-index 4, so document
  order decided which won. **The first attempt fixed it from above and broke a
  real interaction** — raising the title made fill fields unclickable under it,
  and gap-fill went red within minutes; the title is left alone. The check
  sweeps eight widths for anything covering it.
- `checks/perf-line.py` — 7 failures on the pre-§161 build.

### v3.60 — the squeezed rail and the demo banner (§160)

- Two of Islam's seven from using the product on a smaller window. The other
  five need a decision from him and are **not built**.
- **The rail had said `display:flex` for versions and meant nothing by it.**
  Reordering later wrapped every row in a `.sortable` div, so the rail laid out
  its ONE child in a row and the pillars stacked inside it — 255px of a
  squeezed window on a list of four. §51.11's family, failing in the direction
  that looks deliberate.
- **The two sides had drifted and the FUNCTION was the correct one**: its
  projects are direct children of the rail and were horizontal all along. The
  fix is a no-op there. 255px → 66px, and the strip scrolls to the last item.
- `display:flex` on the wrapper, never `display:contents` — that removes the
  box `makeSortable` measures to place a dragged row.
- **The demo banner loses the invented-content line** (Islam's call). Cost
  recorded: nothing on that screen now says which parts were made up. The line
  that stops somebody mistaking the demo for their own tenant stays.
- **Two assertions in the new check could not fail** until they were run
  against the previous build: one read the baked banner instead of the demo
  one (invisible over file://), and one matched a character the built file
  holds only as an escape sequence. 3 failures on the pre-§160 build once
  fixed.
- On its own branch for review: `claude/wave5-demo-line-and-squeezed-rail`.

*The five v3.59 entries below are the UI/UX audit's waves 2 and 3, built and
checked as separate rounds on one branch and shipping as one version — main
took v3.52–v3.57 from four other sessions while they were being built.*

### v3.59 — the welcome screen's way out (§159)

- Islam, on §148's screen: *"continue to the unit or the function button is a
  bit not obvious"* — five variations drawn in the real screen, and he chose
  **B**, one bar across both columns.
- **Three faults, and weight fixes one.** It is the *only* exit (no ×, no
  Escape, no click-outside); it was the quietest thing on the screen; and it
  sat inside the left column, so it read as the end of the list. Measured: the
  link began 585px into the columns and 165px above their bottom, and **below
  960px it was not even last** — at 900px, 411px of side column came after the
  way out.
- **The bar spans the grid**, sits after `.wcols` inside `.wwrap`, and is last
  at every width. It wears `.wpages`' wide-row shape rather than a second
  vocabulary (§53.5) and spends none of §41's accent.
- **The empty case closes a drift**: §148's approved mockup said Continue is
  the loud control when nothing is waiting and the build never did it, so an
  empty welcome was a grey link and nothing else. `.wexit.wloud` is its own
  class, and a row arriving late gives the fill back through `unEmpty()`.
- **The drawing's grey *Strategy · Plan* sub-line is not built** — the label
  already names the destination (1b-ii), and the second line needs the
  navigation-word reader §99 deleted. Recorded, not dropped silently.
- `checks/welcome.py` — 7 failures on the pre-§159 build, exactly the seven
  new assertions. Contrast measured in all four palettes (lowest 4.99).
  **Escape and click-outside still do not close the overlay** — offered with
  the variations, not taken up, and left as its own ask. **Not merged —
  awaiting Islam.**

### v3.59 — the plan tables fit the pane (§158)

- Islam, wave 4: on a smaller window the plan tables were cut off down the
  right — the last column sliced, the heading reading *COMPILE*.
- **A floor cannot yield.** `table { min-width:620px }` is the right default
  and the pane narrows past it: at a 900px window the pane is 585 and the
  table stays at exactly 620. Only between ~820 and 960 — above it fits,
  below 820 the split stacks — which is why 1440 and 768 both look clean.
- **Two wrong fixes were drawn first.** Tightening cell padding narrowed the
  columns and left `scrollWidth` at 620 to the pixel (the flexible column
  absorbs it); §108.5's scroll shadow and track was an affordance over a
  fault, and could not even be demonstrated — headless paints no scrollbar,
  and on an iPad the native one is an overlay that vanishes.
- **§53.5 paid within a minute**: with the floor gone the unit fits and a
  supporting function still ran 11px over at 860 and 41px at 830 (five columns,
  intrinsic minimum). 13px → 8px of cell padding closes it with no heading
  taking a second line.
- **`:not(.setuppane)` was found by the check** — Setup's pane is also `.pane`,
  so the obvious selector stripped the register's floor too.
- **And the obvious both-ends assertion could not fail**: `.cfg table`'s 760px
  floor is dead code, re-declared as 0 later in the same file (the fifth
  duplicate this project has recorded). Asserted on the selector instead.
- `checks/table-fit.py` — 7 failures on the pre-§158 build. Whole suite and
  the 33-viewer sweep green. **Not merged — awaiting Islam.**

### v3.59 — two faces (§157)

- Islam: *"let's make the 2 fonts available are the sytem font and the source
  san3."* §38.7 carried four faces so they could be judged in the real product
  rather than on a specimen sheet; the judging is done. Inter, Manrope and IBM
  Plex Sans leave — files, `@font-face` blocks and `[data-font]` rules together
  (§24) — and the switch offers **System** and **Source Sans**.
- The built file goes **2,690,171 → 2,531,861 bytes** (2.69 → 2.46 MB), which
  is 116 KB of face in every handover of the single file.
- A face lives in three places that must agree — `fonts/`, `FACES` in
  `build.py`, `FONTS` in `theme.js` — and `FONTS` is also the sanitiser, which
  is what makes a browser remembering `manrope` fall back to the system stack
  with the switch still working rather than being stranded.
- **The check reported a correct build broken first.** A `data:` URI removes
  the network and not the asynchrony: the face is `unloaded` until asked for,
  so a width measured in the same frame as the attribute is the system stack's
  width under the right family name (279.95 = 279.95). `await
  document.fonts.load()` first (227.91 vs 279.95), with the decode asserted as
  its own fact.
- **And one assertion could not fail when written** (§94.5): it derived the
  attribute key from the family name, and `"IBM Plex Sans".split()[0]` is
  `ibm` where the selector has always been `plex`.
- `checks/typeface.py` — 11 failures on the pre-§157 build. Wave 1–3 suite,
  `save-flush`, `state-contrast` and the 33-viewer sweep green.
  **Not merged — awaiting Islam.**

### v3.59 — the card sentences and the delta (§156)

- Islam's redirect of Wave 3's item 2: the three group cards each carried a
  different kind of sentence and none said what its number meant — a data
  note, ten unit weights, and "variance +2" under a headline of 104%.
- Each now says what the number IS, with the arithmetic left to "How this is
  calculated →". `deliveryLine()` reads the ratio out in words — **ahead of
  plan / behind plan / exactly on plan** — one function for the group's card
  and a company's, and the check asserts the verdict AGREES with the figure
  rather than asserting the wording.
- The ▲ delta moves from the title into the number (where a unit's own cards
  have always put it); "primary" drops from gold to the page's neutrals.
- 4 failures on the pre-§156 build; whole suite and 33-viewer sweep green.
  **Not merged — awaiting Islam.**


### v3.59 — Wave 3: four visual refinements (§155)

- **The group landing answers "where do I look next"** — one entry per unit,
  worst first, each linking to it; the same figures the Business units section
  already shows, asserted equal entry by entry.
- **Caption explainers stop shouting**; **Branding's pickers open on the colour
  the platform actually paints** (read live, never a literal); **Full Name
  leaves the register's default columns** and stays one tick away.
- **§155.1**: the strip's entries first carried `data-u` and went nowhere —
  that wiring is scoped to the chrome. `data-go` is the platform's own
  document-wide attribute. Found by pressing, §150.1 twice in one session.
- **§155.2**: an assertion nearly forced a wrong design — "quieter" measured
  as colour would have made the explanation fainter than the quietest ink.
  Corrected the check, not the design.
- `checks/wave3.py` — 12 failures on the pre-§155 build. Full sweep: 33
  viewers, no errors. **Not merged — awaiting Islam.**
- **Still with Islam**: the three card sentences (§156 mockup) and whether the
  chip refinement goes in with them.


### v3.59 — the three contrast repairs (§154)

- Islam approved §153's three findings for repair. All three were **one fault**:
  a scoring colour used as TYPE rather than as a mark — the rail's figure
  (3.26 → 4.93), the focus strip's count (4.45 → 6.45), the hovered button and
  its caret (4.34 → 5.36).
- `bandInk()` beside `band()`, applied at 30 call sites, with a fallback for a
  tenant band that has no text twin. Two more fixed by hand, same move.
- **§154.1**: the caret's first fix made it worse (4.34 → 1.43) — a blanket
  rule hit a caret sitting on the navy chrome. Reverted; fixed at the control
  that failed.
- `state-contrast.py`'s baseline is now **empty** — anything failing from here
  is new. Full sweep: 33 viewers, no errors. **Not merged — awaiting Islam.**


### v3.59 — Wave 2 of the UI/UX audit (§149–§153)

- **§151 the tables Islam was stuck on**: a plan wider than its pane was cut
  with no way to scroll (the page never scrolls sideways, §27.2). It scrolls
  inside its own box now, with the `#` and name column frozen — and the second
  frozen column parks against the first one's MEASURED width, because
  `left:38px` slid the name 2.5px on every scroll (§151.1).
- **§150 the reporting controls ride the tab row** — Islam's placement, better
  than the audit's pinned bar: the row is already pinned chrome, so no new
  sticky element and none of its arithmetic. Submit wears the Report orange,
  Save draft the same orange as type with no box. **§150.1**: putting them in
  the row made them subject to the row's wiring — every `#subtabs button` was
  bound as a tab, so Save draft closed the report. Found by pressing it.
- **§149 the glyphs keep their place and gain their meaning**: "More is
  better / Less is better", and the compile rules described; the repeated
  "Latest" quiet, with no standing dotted mark.
- **§152 the viewer switcher** reads name + place, job title on the hover.
- **§153 hover and focus are measured at last** (closes §16.17), reusing the
  sweep's own rule. Three light-mode failures recorded as a named baseline —
  `.dlcar` 4.34, `<b>` 4.45, `.rnum` 3.26 — **awaiting Islam's colour
  decision**, since a palette is his (rule 1c).
- Checks: `plan-columns.py` (6 failures on the old build), `report-chrome.py`
  (12), `table-scroll.py` (9), `state-contrast.py` (new), plus qa.py's own
  reporting assertion updated — it went red for the right reason. Full sweep:
  33 viewers, no errors. **Not merged — on the branch awaiting Islam's word.**


### v3.58 — the welcome screen (§148, spec 025)

- **One screen after sign-in, before the platform**: "Welcome, <first name>"
  leads with the person's role chips and the cycle state; Raya Trade and the
  Strategy Management Office sign the band on the separator's edge. Settled
  over three mockup rounds — the greeting moved left and the bare count
  badges became sentences at Islam's direction.
- **"Waiting on you" computes nothing new**: the submission row, the plan's
  missing elements (§145) and the office's unread reply are the same
  functions their destination pages call; the SMO's list is the Setup
  Overview's own rows. An empty list says so. Every door presses the
  platform's own navigation — "Open reporting" arrives IN reporting mode.
- **The intro round card is the tour's visible offer** and its reachable
  home again (§119.4); starting it hands the screen to the real tour. Once
  per browser session; never the office's tour, never over file://.
- Proof: `checks/welcome.py` (three viewers, made state, doors pressed and
  read back, absences, proved to fail on the pre-§148 build) + full `qa.py`.

### v3.57 — a custodian per project: two roles, not one (§147, spec 024)

- **Three bounded roles, all derived from being named** (§147.7, Islam's
  correction of the first build): **Project owner** from a project's Owner
  row; **Pillar owner** from a pillar's, on a unit or a pillars function;
  **Contributor** for everyone else the plan names — collaborators,
  stakeholders, milestone owners — who report nothing until their row is
  opened, and then only the rows that name them.
- **Two conditions before an owner reports**: their role's Reporting cell at
  edit on Roles & access (both owner rows ship at view), and being named the
  Owner. No register attachment — the silent third condition that broke the
  first live test is gone.
- **One reach rule per row** (`mayReportRow` in `lib/rules.js`), asked by
  both panes and the authoriser; none of the three roles ever submits.
- **Two drifts fixed on the way**: a custodian's deliverable report and the
  §104.10 milestone % were refused as plan since migration 024; and a
  pillars function's Report page read the own-unit cell while the server
  judged the own-function one.
- Proof: `test-authorize.js` §17 (297 passed; proved able to fail),
  `checks/project-custodian.py` (three viewers, both ends, proved able to
  fail), the matrix and project checks, the full `qa.py` sweep; the seed
  scanned — 24 people gain a true chip, nobody's grants move.

### v3.56 — a test copy is a send, and it says so (§146)

- **Islam:** *"there have been multiple sent emails earlier. weren't they saved?
  I can't see them in the overview."*
- **Nothing was lost, and proving that came first.** `messages` sits outside the
  state graph with no foreign key, so the `TRUNCATE … CASCADE` on every save
  cannot reach it, and no `DELETE FROM messages` exists in the product. Driven
  end to end against a real Postgres with a stub in front of Resend: a send
  writes its row *before* the emails go out and appears on the Overview at once.
- **The cause:** two kinds of email leave this platform and only one was
  recorded. `test` — *Send me a copy*, and the test send on Email settings —
  sends a real email through the same builder and wrote nothing at all.
- **Built:** the test copy is recorded (`kind`, migration 028; NULL is a real
  send, nothing backfilled), marked in the **audience** column — beside the
  heading it wrapped the frozen first column, §88 and §116.4 — and **Delete
  reaches test copies only** (Islam's B), drawn behind `mayDestroy()` and
  refused again on the server.
- **The note by *Send me a copy* shrank** to one clause on the hover it already
  had: with the row in the record beneath, the list is the answer (CLAUDE.md
  1b-ii, §127).
- **Found on the way:** `SYNC.mailTest()` did not forward the body — §142's
  fault, found by looking this time rather than by being bitten.
- **Proved:** `checks/send-overview.py` §6 (5 / 1 / 2 failures against three
  deliberate breaks) and `scripts/test-test-copies.js`, 19/0 against a real
  Postgres (3 / 11 against two breaks). Round trip PASS on a virgin database and
  on a tenant rolled back to its pre-§146 shape.
### v3.55 — fill the gaps (§145, spec 023)

- **A third Strategy-cell state, Fill gaps**: the custodian or owner writes
  only where the plan holds nothing — targets, directions, compile rules,
  owners, project dates, a tactic naming no quarter, the aspiration. Granted
  per role by the SMO on Roles & access; reaches only what the person holds;
  no rows added, removed, renamed or reordered in this mode.
- **A fill is pending until the office confirms** (Islam's design): live,
  amber, still the filler's to correct; the office confirms with a tick or
  by simply correcting the value. Stored as `pend` marks in each row's
  `extra` JSONB — no migration, proved on a real Postgres 16.
- **Reporting flows, performance waits**: figures and drafts land against a
  pending target; the score reads a dash and leaves every average until the
  office confirms; **Submit is refused**, naming the rows and pointing at
  the office. Save draft is never blocked.
- **Server-authoritative**: the authoriser classifies fill / amend / unfill /
  confirm ahead of the ordinary diff; anything else falls through
  office-only. `test-authorize.js` §16 — 231 pass, 6 red on the pre-build.
- **The access matrix restyle Islam approved from the mockup** (chip
  toggles, tinted lit states, hairline rows) rides along.
- **§117's .pptx plan download button is hidden for everyone** (§145.9,
  asked mid-build) — machinery kept, one line to give back.
- Proved by `checks/gap-fill.py` (fails on the pre-build from its first
  section), the full `qa.py` walk, and the virgin-database round trip.
- **Second build (§145.10–13), same branch:** collaborators fillable — an
  empty list only, and a pending name confers no reporting right until the
  office confirms (`namedOn` skips marked fields, owner included); the
  objectives' This-year column shows by default (§66's toggle and saved
  choices kept); and the plan says where it is owed — a count on the
  Strategy tab, per-row rail counts, a fill-mode gap band of place chips
  (each a door that keeps fill mode on), and a Next-gap walker, all fed by
  one list and rewritten in place as fills land. 237 server tests, the
  extended browser check, qa and eleven suites green.
- **Third build (§145.14), same branch — the finding system red and worded,
  from Islam's screens:** the whole missing bar ("N Missing" + one red chip
  per owing place + the solid red *Fill in missing elements* button) moves
  INTO the section row beside the section tabs, read mode included, nothing
  in the page body; the Strategy tab's number is gone. The corner button
  beside the arrange arrows is the same press (red → *Done filling* →
  quiet amber *Review pending · N*); rail rows read red italic "N Missing"
  → green ✓; a page owing nothing says so and points away. One press opens
  fill mode and walks to the first blank — fixed to wait for the paint
  §30.1 holds mid-click, the bug that made a real press behave differently
  from every programmatic probe. Red words on `--bad-tx` (§38.5).
  `checks/gap-fill.py` §9 rewritten (58 assertions); qa and the suite
  battery re-run green.

### v3.54 — Send an email opens on what went (§144)

Islam: *"The opening page ... should be a dashboard of what was sent, to whom,
how many people ... and when I say create a message it takes me to another tab
... and when I finish and send it it should take me back to the dashboard and
show me that the message was sent there."* And: *"change messages to
Overview."*

- **Two subtabs** — **Overview** and **Write a message** — in the platform's
  own section row, not a page with a button that navigates.
- **Overview is the record**: drafts under *Not sent yet*, then what was sent
  with heading, when, **who it went to** (in the platform's own words for roles
  and places), how many it reached, and by whom. A row still opens what
  happened to each person.
- **Sending lands back on the Overview** with a green outcome band and the
  composer emptied. A partial failure lands there too; only a send that never
  happened stays put, in red, with the message still loaded.
- **No grey descriptions** on either tab, and the two header dropdowns are
  gone. The one sentence carrying a real fact — that the audience criteria add
  up rather than narrow — moved to the heading's hover.
- **§143 is superseded**: *Write another* and the bar's outcome line go, and
  `checks/send-said.py` is deleted rather than left red. Its surviving rule —
  a send cannot be repeated by one press — now holds by construction.
- **A loud control for the action** (§144.8): **Send an email**, above the
  lists. Both the placement and the word are Islam's, picked from three drawn
  in the real page, and both costs were stated before he chose — the button
  scrolls away on a long record, and the platform now has three nouns for one
  thing. Drawn only on the Overview, asserted at both ends.

**The bug it cost:** both list fetches were gated on `#msgsend`, the Send
button, which now lives on the other tab — so on the Overview neither list was
ever asked and both said *Asking…* for ever. Found by driving the built page,
not by reading the diff. Three other checks held the same stale selector and
were fixed (§51.11).

**Proved:** `checks/send-overview.py`, watched to fail first — the fetches
re-gated on `#msgsend` → 3 failures; the return-to-record removed → 8. `qa.py`
green with no console errors; `send-message.py` and `email-greeting.py` green
after being taught about the tabs.

**On the branch only — not merged to main.**


### v3.54 — the bar reports, and moves on (§143)

Islam, using the product: *"When I send I don't get any verification that the
message was sent and the page stays the same view."*

**The send was working.** Established first, by driving the built platform and
sending a real message through its own controls. Two faults after that moment,
both pre-existing §95 code:

- **Success was written in the failure-neutral voice.** The words were there —
  in 12px, the page's quietest grey. `reallySend()` works out `ok: !j.failed`,
  stores it, and nothing ever read it: a *failed* send turned red, a successful
  one got no colour at all.
- **The loudest control still said not-sent.** The orange button read *Send to
  76 people* and was live — one press from sending the whole thing again, with
  nothing on screen to say it had already gone.

Now: the outcome reads in `--good-tx` / `--bad-tx` at `--fs-note`, and the CTA
becomes **Write another** (clears the message, keeps the audience). `sent` is
its own flag, because a refused request and a partial delivery both read
`ok:false` and only one must lock the button. Both buttons are drawn with one
hidden, so the way back needs no repaint — the message is typed *into* the
preview and a repaint would kill the caret mid-word.

**Found while building it (§142.8):** the greeting was being emitted *inside*
`data-mail-body`, the editable region — so one keystroke in the message
absorbed *"Dear Ahmed,"* into the body text, and the email would have carried
the greeting twice with the wrong person's name for every other recipient.
Moved outside; three assertions added.

**Proved:** `checks/send-said.py` — the assertions that matter are that the
send cannot be repeated by one press (asked by pressing where Send was and
counting requests) and that the way back exists with the caret intact. Watched
to fail first: the pre-§143 bar → 5 failures; `sendmsgTouched()` removed → 2.
`qa.py` green; `send-message.py` and `email-greeting.py` green;
`test-email-greeting.js` 37/0; `test-authorize.js` 212/0;
`test-mail-contrast.js` 16/0.

**On the branch only — not merged to main.**


### v3.54 — the email greets its receiver (§142, spec 022)

Islam: *"can we make an option while sending the email to customize the email
by the first name of the reciever like starting the email with Dear Ahmed ...
it's a turn on and off option."* Settled by question-and-answer, then from a
mockup of the real composer, then **corrected once by looking at it**.

- **A per-message switch on Send a message**, off by default, with the greeting
  word editable per message (starting at "Dear"). Send a message only —
  including *Send me a copy*, which greets whoever is **signed in**.
- **Every recipient already got their own email** (§74.3), so nothing about how
  many go out changes; what changes is that they stop being identical. The
  builder leaves a **marked region** and the server fills it once per recipient
  off the stored register.
- **The first name kept whole** — "Dear Abd El Moniem", never "Dear Abd" —
  using the register's own name reader, so there is no second definition.
- **Never "Dear ,":** a row whose name yields nothing loses the greeting LINE,
  and still receives the message.
- **One line, no prose** (Islam's correction to a two-line first draft), with
  the word box before the switch so the switch never moves.
- **Migration 027**: one nullable `greet` column on `messages` and
  `message_drafts`. NULL is off; nothing backfilled.

**The bug it found:** `SYNC.mailSend()` names every field it forwards, so
`greet` was silently dropped — the emails would have been personalised
perfectly and **the record would have said no message ever greeted anybody**.

**Proved:** `test-email-greeting.js` 37/0 (a real Postgres, standing in front
of the provider via the new `SMP_RESEND_ENDPOINT`, reading what each recipient
was actually sent); `checks/email-greeting.py` 38/0 (the screen and the seam,
over HTTP). Both watched to fail first — 8/2/2 and 2/3. `qa.py` green, no
console errors; `send-message.py`, `setup-pages`, `setup-rail`, `setup-search`,
`office-chat` green; `test-authorize.js` 212/0; `test-mail-contrast.js` 16/0;
round trip and clean parity PASS **on virgin databases**.

**On the branch only — not merged to main.**

### v3.51 — Wave 1 of the UI/UX audit: the destination row scrolls (§136)

- **From the platform-wide audit** (branch `claude/platform-ui-ux-audit-4pf8e5`;
  plan and Wave 1 mockups under `design-mockups/`). Islam chose the scrolling
  row over the wrap-and-grow chrome (“Decision 1: B”) from live screenshots of
  the real build at 1024.
- Below ~1280px the row wrapped inside a 46px box, so the second line painted
  over the tab row and on some pages ate its clicks (§118.7, seen live at
  1024). Now the destinations scroll in one line; the Group menu, the
  Units | Functions switch and the gear are pinned outside the scroll region;
  fades show each side only while that side has more; the lit destination is
  scrolled into view on every paint.
- `checks/nav-scroll.py` — fails 6 ways on the pre-§136 build, green here,
  with page-width, setup-rail, setup-header and the full qa.py sweep re-run
  beside it. **Not merged — on the branch awaiting Islam's word.**
- **§137 — a failed render says so on the page.** The guard sits on the page's
  render alone, so the chrome and navigation stay alive and the card's "open
  another page from the menu above" is true. Islam's words after revising the
  mockup: simple, friendly, one Reload button, the error folded behind a
  closed "Technical details". `checks/render-fail.py` fails 3 ways on the
  pre-§137 build — the production symptom verbatim.
- **§138 — the last 800ms survive leaving the page (closes §126.1).** One
  function in sync.js: on visibilitychange/pagehide anything waiting to save
  is sent immediately (keepalive under 64KB, plain fetch over). Touches no
  save bookkeeping, skips while a save is in flight (ordering), sends nothing
  when clean. `checks/save-flush.py` reproduces §126.1 end to end on the old
  build (0 posts, edit lost) and passes here; `test-roundtrip.js` re-run
  against a throwaway Postgres 16 — all PASS.


### v3.50 — the Setup header line, the marking table, and a repaired matrix (§135)

- Eleven asks from using the Setup pages. **Seven of them are one standard
  applied to sixteen pages**: the page's own search and buttons share the
  pinned line with its name, the `SMO` pill and every count chip go, the quick
  filters and the row count go the way the register's did, and the grey
  briefing paragraph goes everywhere.
- **§121.2 had left those controls on a row of their own for a good reason,
  and that reason forbade the FAKE move rather than the move** — a negative
  margin pulled a non-sticky row up under a pinned title and scrolling slid it
  out. Inside the header they pin with it.
- **Roles & access is repaired, and it had one cause** (§135.2): `.acgrid` is
  `overflow-x:auto`, so the BOX — not the page — is what its head pins against,
  and §121.4's 141px page offset pushed the header 141px down inside the table,
  onto rows three and four. The exact fault §121.4 wrote down about the
  register, on the one table its exclusion forgot. Repairing it made §117's
  *Own business unit* and *Own supporting function* headings readable for the
  first time since the split shipped.
- **Focus measures reaches supporting functions** in both of their shapes, with
  a segmented On|Off switch on the header line, a navigation-style destination
  row carrying each place's mark count, and one table headed like the register.
  The group's Focus board grows the same half, or the marks are stored where
  nobody can see them (§61).
- **Send a message → Send an email**, with the Email settings folded in as its
  second section (a status table, four fields, a live rendered preview and a
  test send: not a dropdown). **Inbox → Platform Inbox**, and Focus measures moves to *Measurement*.
- **A person's company is sometimes derived and sometimes stored** (§135.6):
  read-only wherever the unit has already answered it, written only where
  nothing else has, so two fields cannot contradict one stored fact.
- **A four-pixel slot was closed** (§135.10): `--sethead-h` was a guessed 46px
  and the header is 42–49px depending on the page, so scrolling rows showed
  through the gap between the two pinned headers. Published by a
  ResizeObserver now.
- `checks/setup-header.py` was proved able to fail first — **33 failures
  against the previous build** — and **two of its own assertions could not
  fail when written** (§113.8's blind spot, and `tr.getBoundingClientRect()`
  reporting the un-stuck layout).
- Verified after the merge: `qa.py`, setup-header, setup-rail, setup-pages,
  setup-search, register-header, focus-switch, role-picker, table-standard-all,
  no-wrap, and main's own band-corner, owner-picker and rail-standard all
  green; `test-authorize` 212/0; **round trip and clean parity on a virgin
  Postgres 16** (§113.7); contrast 52 failures, unchanged, none on the new
  surfaces.

### v3.52 — the Knowledge base in two tabs (§141)

How it works 9 | Questions & answers 43 — counts on the tabs, contents pills
per tab, the pen on the questions tab alone, the tour's replay with the
explanations, and the last-used tab remembered per browser. Server untouched.

**Verified:** kb-pen.py §0 (failed 4 ways with the default flipped) ·
knowledge-base.py re-taught to gather from both tabs after going loudly red ·
tour.py clean · qa.py ERRORS: none.

### v3.52 — the knowledge base gets a pen (§140)

The office edits the assistant's scenarios on the page they are read from —
approved from a mockup first. One precedence rule in `lib/rules.js` feeds the
page AND the assistant's corpus, so the two can never disagree; overrides ride
`org.extra`, delete on default, and the shipped wording is always one click
back. Standard entries can be rewritten but never deleted; own questions can be
added per group and removed. Typed text renders escaped.

**Verified:** driven against a real Postgres including the reload round trip ·
kb-pen.py ALL CLEAR, failing 2 ways with the rule broken · test-assistant 45/0
· test-authorize 215/0 · extract-kb --check in step · qa.py clean.

### v3.52 — the send says what is happening (§139)

The "glitch": with the assistant on, `say` holds its response for the model
round-trip, so the typed message sat in the box for seconds. Now it moves into
the thread the moment Send is pressed, the box empties, and a quiet *Asking
the assistant…* line shows until the reply replaces the echo. A failed send
puts the words back in the box; the poll skips a beat while a send is in
flight so it cannot erase the echo; a network failure says "That did not
send" instead of the browser's "Failed to fetch".

**Verified:** driven against a 4s-slow model and an aborted send ·
office-chat.py §13 permanent, failing 3 ways on the pre-§139 build.

### v3.49 — the register notices two people whose name reads the same (§131)

- Islam: *"notify me as an issue to address if 2 people their 1st 2 names are
  the same so I can edit one of them."* The pair now joins the **Attention
  queue** on the People register — the button counts them, opening it walks to
  each with the reason above the fields, naming the other person in full.
- **A notice, never a duplicate mark** (§87: a shared name is not one human),
  and it sorts last — collisions, declarations and missing identifiers stay
  worse. Anybody already flagged as a possible duplicate is left to that flag.
- **Amending one Name clears both**; a typed Name that still collides stays
  flagged, because typed values are never auto-lengthened (§81.1).
- Proved in `checks/duplicates.py` (watched to fail 4 ways on the pre-§131
  build), with `identity-merge`, `people-dialog`, `table-standard` and the
  full `qa.py` sweep green. Found on the way: the demo's two placeholder
  company CEOs genuinely read the same ("Company CEO,") and now say so.

### v3.47 — building a plan on the platform (§129, spec 020)

- **A second door beside Import**: *Build a plan* opens a chooser of every
  unit and function — with an honest Empty / Has-a-plan status, **Continue**
  on a part-built subject, and **Start fresh** behind a confirm that archives
  first through the import's own path. A new unit or function is created in
  the same place; a new function is asked *pillars or projects* at birth.
- **The builder band** under the tab row is a MAP: one chip per plan section,
  openable in any order, each chip reading the data (✓ / count / ○). Nothing
  is stored; pausing costs nothing. Finish opens a review that names every
  gap and jumps to it.
- **Every "+ Add" in build mode opens a form** asking the row kind's fields
  in the outcome's order (§116's dialog shape); the name makes Add live,
  gaps are named in amber and never forced; *Add & add another* for tables.
- **Five empty-state fixes** outside the builder too: the first "Who we are"
  line (unit and group), SWOT add/remove, the empty Plan page offering its
  first pillar, a virgin pillars function's first row actually writing, and
  a capability's key objectives gaining their first authoring surface.
- **"+ Add a business unit" asks a form now** — name, prefix, company — with
  the key minted from the name, `real:true`, and the weighting row minted
  from the factor list.
- Proved by `checks/plan-builder.py` (every control pressed, the DATA asked,
  able to fail twice — the second proof caught the check itself), plus the
  full `qa.py` sweep and the affected checks on the merged bytes.

### v3.46 — the deck's last gaps, and the overview's download (§128)

- **A tactic that names no quarter is ticked in bold red in all four**
  quarter columns — the template's four columns are untouched and nothing is
  merged. A tactic that names some quarters is left alone, as before.
- **Every plan deck ends on a Thank you slide**, matching the review deck.
- **The Function overview carries the download**, beside Edit — the other half
  of a capability function's strategy tab had no way to take the plan away.
- Proved by `checks/strategy-split.py` §5 (state made, merged-cell attributes
  read, the button pressed with a hit test), able to fail 3 ways.

### v3.46 — the settings, in the order you'd decide them (§127)

Asked to rethink the chat settings' sequence, titles and explanations. Settled
from a mockup made of that very panel, approved, then built. **882px → 478px**,
same seven controls, nothing removed, no stored key renamed.

- **The order was not one.** The master switch sat *third*, under a setting it
  governs; the two email rows sat five apart. It now descends from *does this
  exist* to *a tuning knob*.
- **Every explanation is a tooltip** that opens on **hover, focus or tap** —
  hover doesn't exist on a tablet, and these now carry the whole explanation.
- **A status is not an explanation.** *"No one is set"* stays on the page: behind
  a hover, somebody turns Handover email on, nobody is chosen, and nothing says
  so.
- **The bubble is anchored to the row, not the mark** — centring a 264px note on
  a 14px mark hangs it off a 392px dropdown, at seven different x positions.

**Verified:** office-chat.py §12 ALL CLEAR, asserting the *problems* rather than
the layout, each watched to fail first · qa.py ERRORS: none · test-chat 52/0 ·
test-assistant 33/0 · test-authorize 193/0. **One assertion was rewritten for
being unfalsifiable** — it measured the row against the panel, and a row is
inside its own panel by definition.

### v3.50 — the knob's guard keyed on words the provider never says (§134.5)

§134 shipped and went straight down in production: gemini-3.6-flash refuses
the thinking cap with the GENERIC "400: Request contains an invalid argument."
— and the self-healing retry only fired when the 400 named thinking, because
the stub imitated the documentation's verbose refusal instead of the
provider's real one. The guard now keys on the situation (a 400 on a request
that carried the knob), never the wording. Stub corrected to production's
verbatim words; the shipped guard reproduces the production failure 2 ways in
the suite; 39/0 after.

### v3.49 — the thinking cap (§134)

§133's 20s budget blew on its first preview run — the same model, the same
question, under 12s the hour before. Reasoning time is a lottery, so the fix is
not a bigger timeout: **thinking is capped at nought**, because answering from
a corpus that is in the prompt is retrieval, not reasoning. And since the
knob's contract on future models is unknowable, **a 400 naming thinking drops
the knob and re-asks once**, remembered per process — a config knob must never
be what takes the assistant down. Bad keys are never retried into.

**Verified:** test-assistant 38/0 (retry watched to fail — 2), test-chat 52/0,
built file byte-identical. The preview URL's CSP console error is Vercel's SSO
layer fetching the manifest — harmless, absent from production (§134.3).

### v3.49 — the reply that never came back (§133)

Every diagnostic row green, and still no reply in the chat. The diagnostic and
the conversation share one code path; what differs is time. Two budgets fixed:

- **The function outlives the model now** — the model timeout was 12s inside
  Vercel's default 10s function cap, so a slow answer had the whole function
  killed under it after the message was stored and before any reply or handoff
  could be written. `api/*.js` gets 30s; the model gets 20.
- **Thinking counts** — Gemini 2.5+ bills its reasoning against
  `maxOutputTokens`, so the 700 cap could be eaten whole by thought and the
  truncated JSON read as a failure, which by design writes nothing. Now 2048.
- **Failures reach the operator** — one `console.error` with the provider's own
  reason, into the Vercel function log. The person's silence (§112.2) is
  untouched; proved by driving a real `say` against a quota-refusing stub.

**Verified:** test-assistant 34/0 · test-chat 52/0 · the say-path failure
observed in the log with the provider's reason while the send still succeeded ·
built file byte-identical (server-only).

### v3.49 — the key was right, the model was retired (§132)

The re-issued key WORKS — Google's 404 proved authentication passed — and the
404's own text named the last problem: `gemini-2.5-flash` is retired for new
users. SF keeps using it on its old project; SMP's fresh project cannot. The
default moves to `gemini-3.6-flash` (Google's recommendation, verbatim);
`GEMINI_MODEL` still overrides.

And §126's shape row called the newer `AQ.`-prefixed key "a different kind of
credential" while the provider accepted it one step later. Both Google shapes
are recognised now; an unmatched one reads UNRECOGNISED, never wrong — a
heuristic never overrules the provider.

**Verified:** test-assistant 34/0, the new assertion watched to fail · both
cases driven end to end through the diagnostic · built file byte-identical
(server-only, no SHELL bump).

### v3.48 — §126 resolved: the key was not the key (redeploy commit)

The diagnosis held. Comparing against Strategy-Formulation's working Gemini
setup showed the two projects byte-equivalent on the wire — same env name,
same model, same endpoint, same header — so the only remaining difference was
the stored VALUE in this project's Vercel environment. Islam's own AI Studio
chart agreed: SMP_Key had accepted a real request, while the deployment's copy
was refused, which means the deployment held a different string.

Islam deleted and re-added `GEMINI_API_KEY` in Vercel. **This commit exists to
trigger the build that bakes it in** — a deployment only carries the variables
that existed when it was built, and editing one changes nothing until the next
build. Proof on screen after deploy: Test the assistant → the key row's length
and first four characters match SMP_Key, and the model row reads WORKING.

### v3.46 — which key, without saying which key (§126)

The diagnostic read *switch WORKING · knowledge base WORKING · key PRESENT*
with Google still refusing the key. **"Rejected" and "that's not the key you
made" send you to two different websites**, and nothing on screen could tell
them apart.

The key row now reports its **length and first four characters** — an AI Studio
key is `AIza` plus 35, so any other shape is a different kind of credential
entirely — and names the Vercel trap: a deployment only carries the variables
that existed when it was **built**.

**Recorded and deliberately not fixed:** the autosave is debounced 800ms with
**no flush when the page goes away**. Press a switch, leave 150ms later, and
nothing is saved while the screen shows the new value. It affects every setting
in the platform, and it was **not** the fault being chased.

### v3.46 — a handoff the person can see (§125)

*"Nothing happens at all"* — with the assistant on and a key the provider now
accepts. That was §104 working exactly as designed, and that is the problem.

- **A handoff wrote nothing**, so the person saw a screen identical to the one
  they'd see if the assistant had never been asked. §123 separated four
  failures for the *operator*; this is the same fault on the *person's* side.
- **One line now says so** — the product's words, never the model's — and the
  conversation **stays waiting**, so the office's queue, the Waiting tab and
  the email chase are unchanged.
- **Narrated, not spoken**: no name, no bubble, no way out button. The two
  sides of the conversation are the person and the office; a handoff is
  neither, and somebody is already coming.
- **A failure still writes nothing.** No key, a refusal, a timeout, malformed
  JSON, the switch off — all unchanged. A handoff is a decision; a failure is
  not, and saying otherwise would mask the faults §123 exists to surface.

**And a test was found reading a setting it did not control** — `test-chat.js`
failed five assertions after a restart and passed on the next run, which looks
exactly like a race and is not one: with the assistant on, her message comes
back with a second row beside it. An hour went into hunting a product race that
did not exist.

**Verified:** test-assistant 28/0 and office-chat.py ALL CLEAR, each new
assertion watched to fail first (2 and 3 failures respectively) · one assertion
thrown away for being unfalsifiable (§94.5) · test-chat 52/0, twice running ·
qa.py ERRORS: none · test-authorize 193/0 · extract-kb --check in step ·
migration 026 applied to a **virgin database**, round trip PASS (§113.7) ·
contrast measured by hand at 5.00 light / 6.61 dark, because the chat panel has
never been in the sweep at all.

**Flagged, not fixed:** `.chbot` and `.chout` have no CSS anywhere — the
way-out button under an assistant answer is a bare browser button. A visual
decision on a surface this work was not asked to touch.

### v3.46 — the diagnostic contradicted itself (§124)

The first thing §123's button reported was **"It is not working — the model"**
with *The API key · **WORKING*** in the row directly above the provider's
*400: API key not valid*. Two rows on one screen disagreeing, both written by
the diagnostic.

- **A status word is a claim.** `configured()` only checks that a variable is
  non-empty; the word *working* claimed the provider accepts it. That row reads
  **PRESENT** now, and a step may choose its own word wherever the state's
  default would overclaim.
- **The refusal is reported against the key, not the model.** Google answers a
  bad key with **400**, so the generic branch had caught it —
  `looksLikeBadKey()` reads 401, 403 and the provider's own words, and the row
  is *The key itself*, naming the three causes that produce a correct-looking
  key the provider refuses.
- **Two of those can no longer happen**: `apiKey()` trims and strips
  surrounding quotes, because a value that only works when it is clean should
  be cleaned by whatever reads it.
- **The headline spells its own field names** — `toLowerCase()` had turned
  *The API key* into *the api key*; only the leading article moves now.

**Verified:** office-chat.py ALL CLEAR with three new assertions, each watched
to fail first (3 failures against the previous build) · all five real states
driven end to end against a Google stub, each landing on the step it belongs
to · qa.py ERRORS: none · test-chat 52/0 · test-assistant 25/0 ·
test-authorize 193/0 · extract-kb --check in step.

### v3.46 — is the bot working? (§123)

Islam turned the assistant on, asked it something, and nothing came back — but
the message reached the inbox. That was the designed degradation working, and
it is precisely why he could not tell it from the assistant never being asked.

- **Four failures looked identical**: no API key, a rejected model, an
  unreachable provider, and a genuine decline.
- **The diagnostic walks the chain and names where it stops** — a button in the
  Messages Settings dropdown, where you stand after flipping the switch.
- It makes a **real call**, and stores nothing.
- The **Vercel trap is named in the row**: a deployment only has the
  environment variables that existed when it was built.

**And it rendered perfectly and did nothing** — the branch went into the
menu's `change` listener instead of `click`, and a `<button>` never fires
`change`. Every assertion short of pressing it passed.

**Verified:** office-chat.py §10 ALL CLEAR (asserts the diagnostic *separates*
outcomes, not that it appears) · all five real states driven end to end against
a stub modelling Google · qa.py clean · test-assistant 25/0 · test-authorize
193/0.
### v3.41 — the CF tab (§118)

**§118 — reported from production.** *"The CF tab is not showing anything
while it was showing it a minute ago."* Reordering a measure or tactic with
the pen on counted the "+ Add" row, appended one phantom entry per drag, and
the autosave wrote it as a `null` into the pillars function's plan blob —
from the next hydration on, the function's page threw mid-paint and the tab
read as dead, with the error only in the console. Fixed at the commit
(`makeSortable` counts data rows only), backstopped (`applyOrder` refuses a
non-permutation), and healed for tenants that already saved the poison
(`fnPruneNulls()` at the hydration door — CF comes back on its next visit,
nothing was lost). The tour is no longer offered to the office (§118.5).
`checks/reorder-integrity.py` fails 16 ways against the previous build and
is green on this one; qa.py and the full battery green on the merged build.
Flagged, not fixed (§118.7): a dead render still says nothing on the page;
the wrapped destination row eats clicks below ~1100px; no-jump.py's
"sorting a column" trial fails on main's own build.

### v3.39 — the register stops being a form (§116) — another session's

- Merged from main during this release: the People register edits in a dialog,
  the attention chips become one queue, the quick filters go. See §116 in the
  decisions document; its checks (people-dialog and the reworked register
  checks) ride in this repo and are green on the merged build.

### v3.41 — the deck names its gaps, and the base becomes the office's (§118)

- **The plan download says `Missing` in bold red** wherever the plan owes
  something, and draws the Foundation, SWOT and capability slides even when
  they are empty — a skipped slide says "nothing is missing here".
- **The tactics table becomes four quarter columns** (Q1–Q4) with a mark in
  the ones in action, the shape the plan workbook already has.
- **The pillar rail opens collapsed**; only an explicit press turns it off.
  The rows-to-check alarm survives the collapse (§106.2 is preserved).
- **The knowledge base is the office's** — Super user and SMO team — reversing
  §30/§37. Cost recorded: the tour's replay button is no longer reachable by
  the people it fits; the first-run tour is untouched, and where that button
  should live is an open question.
- **Not reproducible and asked instead**: "for the projects there is no arrange
  or download" — measured on live production, the office gets pen + download
  and a function head gets arrange + download.

### v3.40 — the Strategy | Reporting split, and the plan as slides (§117, spec 019)

- The Roles & access table's own columns are two halves each — **Strategy**
  (Foundation · SWOT · Plan; a capability's definition and projects) and
  **Reporting** (figures, drafts, submitting). Strategy edit ships with the
  office alone; **the SMO can open it to a role deliberately** (Islam's
  choice). A stored grant on the old key keeps meaning the Reporting half, so
  nobody's rights move on upgrade and no migration runs.
- §101's reorder arrows survive the split (they ride the Reporting grant), and
  strategy-at-none hides the pane, the arrows and the download together.
- **Download the plan as slides**: a button beside the pen on the Strategy
  panel builds a real editable `.pptx` — plan content only, SWOT included, no
  reported figures — for the office, the BU owner, the custodian, and a
  function's head. Offline, no new dependency (the platform's own zip writer).
- Proved by `checks/strategy-split.py` (both ends, both directions, the file
  unzipped and read, proved able to fail three ways), `test-authorize.js` §15
  (212 assertions), the full check suite and `qa.py`.

### v3.37 — the assistant (§111, §112), and a chat that vanished (§113)

**§113 — reported from production.** *"I replied and the chat disappeared from
all places."* Nothing was deleted: replying marks a conversation answered, the
inbox opens on Waiting, and Waiting excludes answered ones — so replying
removed the row from the list the office was looking at. Two correct decisions;
nobody had asked what they do to each other.

- **The conversation you have open is exempt from the filter**, and only that
  one. Waiting still means Waiting.
- **An empty list names where everything went** instead of being a dead end —
  and the Flagged tab stops claiming there are no conversations when there are.
- A handler that lit tabs by comparing nodes would have un-lit all three when
  the new shortcut was pressed. Lit by value now.

**Verified:** office-chat.py §9 ALL CLEAR, proved to fail (3 failures) with the
exemption removed. Reproduced against a real database before and after.

### v3.37 — the assistant (§111, §112; spec 016)

**§111 — the corpus.** 43 task recipes in `src/recipes.js`, as data, rendered
on the Knowledge base page and read by `scripts/extract-kb.js` into
`db/kb.json`: 9 sections, 26 page explainers, 43 recipes, ~9,800 words.

**§112 — the assistant answers first.** Gemini, at Islam's choice.

- **Off is the default**, and off means the model is never called — enforced in
  `say` on the server, asserted as a call count of zero.
- **Order is the robustness argument:** the message is stored and the thread is
  already waiting before the model is asked, so every failure lands on exactly
  the chat as it worked before.
- **The handoff is a flag**, not a sentence — `{answered, reply, source}`.
- **Every answer carries a way out**, for the case the spec did not cover: the
  assistant being confidently wrong.
- `bot` and `source` columns (migration 024); an answer never wears a
  colleague's name.
- A handoff can email a named representative — its own switch.

**Verified:** `scripts/test-assistant.js` **25 passed, 0 failed** against a real
Postgres and a stub that models Google · office-chat.py ALL CLEAR ·
knowledge-base.py ALL CLEAR · test-authorize 190/0 · qa.py clean.

**Waiting on:** `GEMINI_API_KEY` in Vercel. Everything is built and tested
against a stub; the live call is the only unexercised path.

### v3.38 — the pen's last read-only fields, and a repeating project (§114–§115)

- **§114:** a measure's direction and compile, and a tactic's quarters, are
  editable behind the plan pen — §31's read-only reason expired with §94. The
  Temple's own vocabulary; quarters as pressable marks; all three proved to
  WRITE (§96).
- **§115: a repeating project.** CX-mystery-shopping-shaped work is marked
  *Repeats: each cycle* from the front matter pen. On a new cycle it is
  archived, cleared and its dates shift one cycle forward (rhythm kept,
  adjustable); an **unmarked project now keeps its figures** — before this,
  every project was wiped on every new cycle, a landmine the live tenant had
  not yet stepped on. The archive also stops storing a deliverable's deleted
  `actual` and starts keeping the milestone's `pct` (stale since migration 024).

- **§114.4: the remove button's seat.** The row-removing × wrapped under its
  field (`.fld` is `width:100%`) and cost every editable row 20px. Islam picked
  **beside the field** over inside it — inside an input, an × means clear the
  text, not remove the row. Keyed on the pair (`td:has(> .fld + .xbtn)`), so
  every table using the pattern is seated at once.

**Verified:** `plan-fields.py` and `repeat-project.py` all passed, the second
failing three ways on the pre-§115 build before its green was believed ·
test-authorize **195** · full battery + qa.py clean · §114.4: pairs share one
line and the × is hittable at its centre, proved able to fail (width rule
removed → 1 FAILED).

### v3.34 — a project's front matter (§109)

Islam: *"any project needs 3 things at its starting part — the brief,
stakeholders, start and end date."*

- **The start and end were stored and shown nowhere.** They appeared in exactly
  one place in the whole product — the review deck — so the page that *authors*
  a project could not say when it runs.
- **One box, divided:** owner · start · end down the left, the brief and the
  stakeholders as two labelled rows on the right. Settled from a mockup made of
  the real platform, over two other arrangements.
- **Deliberately not a `<table>`.** The platform's global
  `table { min-width: 620px }` makes any small table overflow its own grid track
  by 300px — Islam caught it in the mockup, and the column was 320px throughout.
- **Both value columns start at one x**, which was the ask: each column's label
  track is sized to its own longest label, and a pill's leading margin is pulled
  back so the chip's border meets the brief's first letter.
- **The Timeline pill is gone.** It once decided how every date was read; §104
  ended that, and its one remaining effect was to *suppress* a true overrun
  warning. The field and the import template are untouched.
- **Plan pane only** — Performance and Reporting show no dates, confirmed as
  right by Islam rather than assumed.

**Verified:** new `src/checks/project-header.py` **all passed**, both halves
proved able to fail first (an `auto` label track reproduces the exact
misalignment, 627 vs 687; wiring one field to a bare `<input>` fails twice) ·
every other check clean against the merged build · qa.py clean.

### v3.32 — the onboarding tour (§107, spec 017)

A first-sign-in guided tour on demo data: the page dims, what matters stays
lit — the one button that says where you are, or a section button together
with its content — and a short card explains it. **Two stories** (strategy
custodian; unit / function owner), told wherever the person actually works,
on a unit or on a function. Next and Back only; **one exit** through the ×,
which asks *Don't show again* or *Skip for now* with a way back for a stray
press. Replay from the Knowledge base. Memory in the browser only.

Settled over **four reviewed revisions of a working mockup** before a line of
`src/` was touched — and three of the five decisions are reversals of
something drawn first, none of which could have been argued in the abstract:
the interactive click-the-real-button tour was built and then reversed
(§107.2), Skip tour was removed in favour of the × asking (§107.3), and the
spotlight narrowed from the whole navigation row to the one button that says
where you are (§107.4).

Built with `src/tour.js` + `tour.css`, mounted outside every region `paint()`
rewrites, holding selectors rather than nodes, navigating by pressing the
platform's own controls, and reading roles through the platform's own
`personRoles()`. `src/checks/tour.py` walks every story as every role —
custodian on a unit AND on a function, owner of a unit AND head of a
function — and was **proved able to fail before its green run was believed**
(§107.10); the first deliberate break was a no-op and caught nothing, which
is §94.5's own fault repeated.

Found by measuring rather than reasoning: a step that disagreed with itself
once a function walked it (§107.7), a tenant's label inflected into *"the
pillarss"* (§107.8), and a contrast measurement proved real by wrecking the
card's text and watching it report 1.6:1.

Corrected after Islam replayed it (§107.14): the tour now takes you to the
main page before the welcome card, rather than drawing it over the Knowledge
base — and the dataset swap moved ahead of resolving where to tour, because
`own` was being read from the client's own tenant and looked up in the demo
tenant's navigation. The check had asserted the tour was *running* and stopped
there; **"it started" is not "it went anywhere"**, and it now asserts a
destination is selected, the Knowledge base is off screen, and there are tabs
to tour.

**Waiting on Islam:** the owner story's copy. The custodian's is his, word
for word off the signed-off mockup; the owner's is mine until he has read it.

### v3.30 — reordering comes back (§101), and focus gets a switch (§102)

Two small independent changes, both agreed in words first.

**§101 — reordering comes back**, reversing §94.3. `mayArrange()` is a separate
rule, not a widening of the authoring gate: the plan's order is the unit's, its
words stay the office's. BU owner, strategy custodian, function head; never a
contributor. `lib/authorize.js` learned to tell a reorder from a rewrite. The
control is up-down arrows in the pen's slot — Islam's pick over the grip mark.

**§102 — focus measures get a switch.** Off hides every surface and keeps every
mark; on restores them. Stored as an absence (`GROUP.focusOff`), so an unasked
tenant and one switched off and on again are byte-identical. The switch is the
SMO's alone while marking stays the CEO's, and the page carrying it survives
being switched off (§61).

**The bug worth remembering:** the switch was wired, the rule was written, and
flipping it did nothing — `worldOf()` and `W()` are **two allow-lists, one
behind the other**, and a group key must be named in both. Silent, and in the
safe-looking direction. Found by driving the page.

**Verified:** test-authorize 165 → **190, 0 failed** · new
`src/checks/plan-arrange.py` and `src/checks/focus-switch.py` **ALL CLEAR** ·
qa.py clean · all four failure modes proved to fail before being trusted.

### v3.32 — the plan's own shape, one row, and a function that submits (§103–§106)

Four sections of one thread: the project tables rethought from the plan
outwards, then the two things that thread turned up.

- **§103 · The plan's own shape.** A milestone keeps a **name and** a
  description; a deliverable gets a **due date** back (some land before the
  project ends). Dates are read, never refused — `Done` and `Pending` in a
  due-date column are **named as what they are**.
- **§104 · One table, one row shape.** §99's split is undone for a better
  reason: giving a deliverable a real direction (`=`) and target (`Y/N`) means
  the cells it left empty now have answers. Reporting is **Not started / In
  progress / Delivered**, the per-cent typing itself at both ends. The score
  column is **Performance** on deliverables and outcomes, **Progress** on
  milestones — `%` is a unit, not a name.
- **Not due is a label, not a lock** (§104.8). The comment said so from the day
  it was written and the code did the opposite: a not-due row had its picker
  **replaced** by a word, so reporting early was the one act the pane refused.
- **An In progress with no number is not nought** (§104.10). It read **0**, so
  the average counted it and a project's figure fell the instant a dropdown
  changed. It leaves the average now and the row is marked *Needs a %*.
- **§105 · A supporting function submits**, and everything except the button
  was already built — the server has carried an explicit `fn:` branch since
  spec 006. The dot on that tab had been asking for a submission nobody could
  make. It refuses on a row owing a per-cent or a red figure with no note, and
  the SMO's cycle board carries the functions.
- **§106 · What the merge does to a plan already uploaded.** Nothing is
  deleted. **Execution rises 8–27 points on every capability**, because an In
  progress milestone stops counting as nought — so the card now prints
  `5 of 12 milestones · 2 not counted yet`. And a bad due date in a plan
  **already stored** is finally noticed, named by value and row, with the count
  on the rail.

**Verified:** `src/checks/project-tables.py` all passed, every new assertion
proved able to fail first · test-authorize **184, 0 failed** · qa.py clean ·
main's `plan-arrange.py` and `office-chat.py` ALL CLEAR against the merged
build. **Not run: migration 024 against a real Postgres** — score-preserving by
construction, formula parity asserted, SQL never executed against a live schema.

### v3.30 — reordering comes back, as its own grant (§101)

Islam is giving arrangement back to unit people, reversing §94.3.

- **`mayArrange()` is a separate rule**, not a widening of the authoring gate —
  the order of a plan is the unit's; its words stay the office's.
- **Who:** BU owner, strategy custodian, supporting function head. Never a
  contributor; a group or company CEO only if they hold one of those.
- **The authoriser learned a new shape.** `same(idsOf(a), idsOf(b))` is an
  ordered comparison, which is why §94.3's drags were refused silently.
  `reordered()` answers by set and classifies as `arrange`.
- **The control** is up-down arrows in the pen's slot — Islam's pick over the
  grip mark — and is never drawn beside a pen. Settled from a mockup made of
  the real platform.
- Performance and Reporting needed nothing: the order **is** the array.

**Verified:** test-authorize 165 → **181, 0 failed** · new
`src/checks/plan-arrange.py` **ALL CLEAR** (five viewers, both ends, the button
pressed, 0 → 13 handles) · qa.py clean · both failure modes proved to fail
before being trusted.

### v3.29 — the corner, corrected again (§100.4, §100.5)

Three more notes from using it, and one of them turned out to be three.

- **Clicking outside minimises the panel**, on `pointerdown`, with the dock and
  an open modal deliberately not counting as "outside" (a screenshot opened
  *from* the panel renders into the platform's overlay). **Escape now works from
  anywhere** — it had been wired on the composer alone, so it did nothing once
  focus moved. A half-typed message survives all of it.
- **The bubble is not drawn while the panel is open**, which is what puts the
  panel's bottom edge 18px from the window's instead of a bubble's height above
  it. CSS off the class the opener already sets, not a second piece of state.
- **The office's inbox follows the window.** It stood at a fixed 593px, so on a
  short screen the reply box and Send fell below the fold — 506px of page scroll
  at 700px tall, measured before touching it. Now `calc(100dvh - --chin-top -
  20px)` with a 340px floor, and the scrolling moved inside the two panes.

**Verified:** office-chat.py **ALL CLEAR** with a new section 8 sweeping four
window heights · the fix proved by putting `height:593px` back and watching
section 8 fail at 660px and on the sweep · qa.py clean.

**The assertion that matters is that the box MOVED with the window.** Every
other one of section 8's — Send on screen, the thread scrolling in its own box —
passes on a tall window with the fixed height back in place, which is exactly
how this shipped. And the stub had to grow a conversation of twenty messages
before any of it could be measured: the office's page had never once been
opened with a thread in it, so the inbox drew "Pick somebody on the left" and
there was nothing to look at.

### v3.28 — the corner, corrected by using it (§100.1–§100.3)

Three notes from Islam within minutes of v3.26 reaching production, all from
having it open rather than reading about it.

- **The captured context line is gone everywhere** — §97.4 reversed. Not hidden
  from the sender: the helpers, the icon, `BUILD_ID` and the build stamp are
  deleted, and **migration 023 drops the four columns**. The composer's
  "the page you are on is sent with your message" went with it.
- **The × is a minus labelled Minimise.** Nothing was ever closed — one
  conversation per person, permanent.
- **A reply announces itself.** A third cadence (15s) while the conversation is
  waiting, back to 180s once answered, and a one-shot ring on the bubble.

**Verified:** office-chat.py **37 checks ALL CLEAR** (the context assertions
inverted to assert absence) · test-chat.js 52/52 · settings drive 21/21 · chat
drive 25/25 · test-authorize 165/165 · test-roundtrip on a virgin database all
PASS · migration 023 applied and the columns confirmed gone.

Two things the checks caught that reading would not have: the announcement
compared the arriving count against a value it had already overwritten, so it
could never fire; and the check's stub answered `thread: null` where the real
server returns `{waiting:true}`, so correct client behaviour read as broken.

### v3.27 — the chat gets a switch, and a poll gets cheaper (§98)

Two asks, one subject.

**What a poll was costing.** Measured, not estimated: one poll was **14
database round trips**, of which **ten were `ensureReady()`** re-running the
whole schema and both migration phases on every request. Memoised per process:
**14 → 5**, and that helps `/api/state` as much as the chat. The client also
**stops polling entirely while the tab is hidden**, and the idle beat goes from
60s to 180s.

The two real limits are worth knowing and neither is a request quota:
**Vercel's Hobby plan is not licensed for commercial use** (a licence term, so
a client deployment wants Pro whatever the volume), and **Neon's free compute
never autosuspends while anything polls** — one signed-in tab keeps the
database awake whether or not a word is written.

**Five settings**, in a dropdown on the Messages page header: on/off,
Live/Relaxed, the promise the panel shows, screenshots, email-when-away. Off
removes the corner everywhere, stops all polling, and turns the office's reply
box off with it — nothing is deleted, and the page stays in the rail so it can
be turned back on.

**Verified, and how:**

- `scripts/test-chat.js` — **52 checks, all clear** against a real Postgres,
  including every setting enforced **on the server** with the corner not drawn.
- `SMP-Project-Folder/src/checks/office-chat.py` — **29 checks, all clear.**
- Browser drive of the settings — **21 checks**: the menu, each control, the
  corner going and coming back, and the tenant storing **nothing at all** once
  everything is back at its default.
- `scripts/test-roundtrip.js` on a **virgin** database — clean slate PASS,
  round trip PASS, fixed point PASS. (It first read FAIL on a database I had
  already run it against; the assertion only holds on a first deployment.)
- `qa.py` — **ERRORS: none**. `test-authorize.js` — 165 passed.

### v3.26 — talking to the Strategy Office (§97, spec 015)

A bubble in the bottom-right corner of every page opens **one running
conversation with the office**. The office answers from **Setup › Running the
cycle › Messages**: who is waiting on the left, the conversation on the right.

**It is §71 finished, not a second feature.** That section built the endpoint,
two tables, the reply thread, the screenshot handling and the access rules —
and the box that was meant to sit in that corner was never drawn. This is that
box, reshaped from a form into a conversation, so `022-office-chat.sql` drops
`feedback`/`feedback_replies` (no human could ever reach them) and
`api/feedback.js` goes with them.

What was settled with Islam before anything was drawn:

| | |
|---|---|
| one box, or two? | **one** — the chat absorbs §71's feedback |
| who is written to? | **the office**; replies are signed by a name |
| does it leave the platform? | **only when the person is away** |
| where does the office answer? | **Setup › Running the cycle › Messages** |
| what is the unit of work? | **the person**, not the ticket |

**Verified, and how:**

- `SMP-Project-Folder/src/checks/office-chat.py` — **20 checks, all clear.**
  Serves the built file over HTTP with a stub `/api/chat`, because the whole
  feature is invisible over `file://`. Covers the corner being *pressable* (not
  merely present), the captured page reading in the navigation's own words, a
  poll not eating a half-typed message, and the three states where **no bubble
  is the pass** — a projector, `file://`, and a refused session.
- `scripts/test-chat.js` — **36 checks, all clear**, against a real Postgres
  with the dev-server running. Signs in as a second person holding **no role**
  and has all seven of the office's actions refused, checks the refusal does not
  name a role, and asserts **both sides** of the presence rule.
- `qa.py` — **ERRORS: none** across the whole product. It is also what caught
  the office's Setup page fetching `/api/chat` over `file://`.
- Driven end to end in a browser against Postgres: sign in, write from the
  corner, answer from Setup, watch it come back to the corner — **25 checks**.

**Waiting on nothing.** One thing is recorded rather than fixed: with no
scheduler on Vercel, "are they away?" is decided at the moment of replying, so
somebody who shut their laptop thirty seconds ago gets no email. The office is
shown which way it will go before pressing Send. A proper sweep needs a cron
entry in `vercel.json`.

### v3.24 — the floor stops being a role, and the password column stops lying

Four of Islam's, from using the register (§93).

- **Employee is no longer a role.** *"Anyone with no role is employee — it
  doesn't give the person anything, so let's remove this strange role."* It was
  never granted, only derived, so the chip could not be taken off. The floor
  itself stays and is still the client's to set: **Everyone else** on the access
  matrix, marked as not a role, under the key it always had.
- **The password column was never asked.** Nothing was lost — `credentials` is
  its own table outside the state graph. The fetch was gated on the page's old
  edit pen, which spec 012 removed, so the column showed the dash that means
  *not asked yet*. It asks on the register now, and says **unreadable** with the
  reason when the ask fails, rather than showing the same dash.
- **The Unit cell is an ordinary value**, not a chip.
- The role chip's place label stays, on his instruction — it is already
  suppressed where a role has one possible place (§92).
- **A note about the units nobody is keeping**, on the register beside the
  other counts, because that is where a custodian is given. A retired person
  does not count as one. Adding it pushed *Register file* off the pane —
  `.hright` never wrapped — which is now fixed and asserted by pressing the
  point rather than asking whether the button exists.
- **The merge receipt is the wizard's last step**, not a panel left standing
  under the table: *"this page is a table page, not for other notifications."*
- **Name and Full Name are two columns.** *Name* is what somebody is called —
  two names, stored and correctable — and *Full Name* is what the employee file
  holds, in its own hideable column. It reverses half of the previous day's
  answer and gives most of the width back: the frozen column is 216px, not 392.
  Files written before today still read correctly.
- **Email and mobile copy on click.**


### v3.24 — who a row is, and merging two rows that are one person

Islam: *"in the send message functionality I got 3 people skipped but they have
an email in the registry."* They did. **The three were on the register twice** —
once from the employee file with an address, once typed into the role picker
with a shorter spelling of the same name and no identifier — and the role sat on
the copy that could not be emailed. Nothing in the resolver was wrong; the
register let one human become two rows and had no way to say so (§87, spec 013).

- **A name is never an identifier.** Emp ID, then email, and no third rung —
  `personByIdentity()` is the one answer and it says which rung decided. An
  address on two rows answers nothing, the same as at the door (§69.23).
- **Both hand-typed doors ask for one now**, and refuse an identifier already
  here by naming who it is. A matching *name* stops nothing — two people can
  share one. Neither is required; the row is **marked** instead, because that is
  the shape the next upload cannot match.
- **The role picker suggests before it creates.** A name typed a little
  differently matched nobody and the only offer was *"+ Add"*; it now shows the
  rows whose chain of names runs through what was typed, and searches on the
  employee number and the address too.
- **The upload sets aside what it cannot place** — an ID and an email pointing at
  two people, or an address arriving under a number never seen — names both
  readings with the people they mean, and applies **nothing** until each is
  answered.
- **A difference is an offer, never an instruction.** Recorded value beside
  proposed one, taken only where ticked, with *take everything from the file* as
  one press. The register wins by default: a people file is usually an export
  somebody edited two cells of.
- **Merge**, from the row's ⋮. The survivor is chosen (defaulting to the row that
  can be matched later); every role, figure set, named figure and open claim
  moves; the last act is the delete, so anything the merge forgot refuses it and
  fails loudly rather than dropping a role.

Verified: `qa.py` green including the new §87 block and the people-file fixed
point **re-measured with every pick taken** (with the ticks off it would have
been measuring the defaults, §51.11), plus `src/checks/identity-merge.py`
driving the screen — the add row refuses and then relents, the merge runs from
the menu, and the role ends up on a row a message can reach.

**Still to do, and it needs Islam:** the three real pairs in the live tenant.
The merge button is built and the register now points at the pairs itself, but
this session has no access to the production database — merging them is three
presses on the People page, or send the register export and the exact pairs can
be named first.

### v3.21 — a function that plans in pillars actually works

The piece flagged when spec 010 merged. Building the two Setup controls
surfaced **four faults from that merge**, each hidden behind the last (§59):

- **Its custodian could not report on it** — every change to a function
  classified as Setup. Now classified through the unit's own classifier against
  the `fn:<key>` target, so §42's figure/note/plan split arrives intact.
- **Its pillars had no ids**, so the authoriser compared them by `undefined`
  and saw no change at all. `renumberUnit()` runs over them now.
- **It was not in the navigation** — and the rule was written twice, so fixing
  one copy left it as invisible. `fnHasWork()` answers it once.
- **Its Performance page then threw**, because `deltaFor()` resolved a target
  as `UNITS[key]`. `unitLike()` resolves either kind in one place.

Plus the controls themselves: **Plans in** and **Under** on Setup › Supporting
functions, refused while the other side holds a plan, shown disabled with the
reason rather than hidden.

Verified: `test-authorize.js` 142 passed (136 + 6 new, including a custodian
reporting a figure and being refused the plan); `qa.py` 31 viewers clean — and
it walks Merchandising for the first time, which is what found the crash;
`test-roundtrip.js` all four PASS on a fresh Postgres 16.

**Still open on spec 010:** a pillars function's plan cannot yet ARRIVE by
upload — the plan template lists business units only.

### v3.21 — Official BU, and it is measured by nothing

- **Main BU → Official BU** everywhere a person reads it (§58): the register's
  column, the Setup page and its rail entry, the workbook's column and Read-me,
  and every sentence pointing at the page. *BU* keeps its own name — it is what
  the official one points at, and what decides access.
- **The workbook writes the new header and reads either.** Somebody is holding
  a file downloaded before the rename; a header is a contract.
- **No logic was built for it, deliberately** — recorded as a decision rather
  than left as an absence. An Official BU has no plan, no score and no page:
  what carries a score is a business unit, a supporting function, or a company
  grouping them, and each already has its own record. The page now says so.
- Stored field names unchanged (`p.mainbu`, `GROUP.mainbus`), so no migration.

### v3.21 — a Main BU holds several, and the sign-in list gets short

- **Setup › BU list maps one name to several units and functions** (§57) —
  chips with an ×, a dropdown that offers only what is unmapped. Editable by
  the SMO, which is what Islam asked for so he can do the mapping himself.
- **A name that holds several places nobody**: the employee file leaves them
  unattached and the sign-in picker offers those few instead. The importer was
  attaching people to the ARRAY until the new assertion caught it.
- **The gate's list is narrowed on the server** from that mapping — their own
  under the client's own word, then *Other business units* / *Other supporting
  functions*, so nothing is unreachable.
- Reads the old single-target shape, so nothing already mapped is lost and
  there is no migration.

Verified end to end on a real Postgres: Distribution mapped to Mobile and
Consumer Electronics on Setup, the SMO given that Main BU, and the sign-in card
offering **Distribution (2) · Other business units (8) · Other supporting
functions (8)** with the pick landing in `bu_declarations`.

### v3.21 — where people say they work, and no attention slide

- **The first sign-in asks where they work** (§56) — every business unit and
  every supporting function, or "I would rather the SMO set it". It is a
  DECLARATION and grants nothing: the SMO sees "They said X — Use it" under the
  BU on the register and accepts it there. Stored outside the state graph and
  without a foreign key, or a save would erase it.
- **The "What needs attention" slide is gone** from both decks — a second
  telling of numbers already shown pillar by pillar, and the one slide that read
  as a list of failures rather than the unit's own account.
- **A merge bug found by driving the product** (§56.6): two branches each added
  a `var pf` to the same function, 600 lines apart with no textual conflict, so
  a function's Present button threw and did nothing.

Verified: the picker driven end to end against a real Postgres — declared,
stored, read back on the register, accepted with one press and the person's
`unit_key` moved; `test-authorize.js` 136 passed; `qa.py` 31 viewers clean;
both decks open (unit 27 → 24 slides, function 19 → 18).

### v3.21 — the floor is two roles

- **Employee** joins the seven roles: on the register, attached to a part of the
  business, named on nothing. **Contributor** keeps its meaning — named on a
  measure or a tactic. Both derived from the plan, neither grantable (§55).
- The concept behind twelve `"contrib"` checks is named once
  (`OWN_LINES_ONLY`), so an employee given edit still speaks only for
  themselves — it cost nothing to add and would have been a silent widening to
  miss.
- Employee ships with a Contributor's current access, so no one's view changes
  on upgrade; the matrix is where it gets tightened. 49 stored grants → 56.

Verified: `test-authorize.js` 136 passed (131 + 5 new, including the widening
that would otherwise have gone unnoticed); `qa.py` 31 viewers clean; the split
measured on real data — Ramy Behairy a Contributor, the Group CFO an Employee;
`test-roundtrip.js` all four PASS on a fresh Postgres 16.

### v3.21 — a unit and a function are the same product

Five items from Islam, and the middle one is the rule the other four are
evidence for. Full reasoning in §53 of the decisions log.

- **A function opens on its Projects**, as a unit opens on its Plan. §28 decided
  that for plans; the code said `&& !isFn(k)`, so it reached units only.
- **A capability is a band, not a card.** Its body was a bordered box with 16px
  of padding, so the rail and pane inside it sat 34px narrower than the
  identical rail and pane on a unit's page — and its white ground fought the
  pinned band's ground filler down both sides.
- **The function's rails match the unit's**: no bare number, no footer
  captioning it (§29.6, applied to one rail of two), a small line of counts
  rather than counts plus both dates plus the timeline kind, and a footer that
  states the summary. The project's owner moved onto the band.
- **Deliverables and outcomes are one table with a Type column** — while the
  score still keeps them apart, half per side. **No due** (a deliverable is
  delivered when the project ends) and **no owner** (the department is
  responsible), removed from the panes, the deck, both `.xlsx` sheets, both CSV
  column lists, the seed and the database (migration 016).
- **THE RULE: any functional or visual change is tested on both sides of the
  navigation switch.** Walking both sides is not testing both sides — the sweep
  had walked every function page each time and reported "ok", because walking
  proves a page renders and none of these were rendering faults. `qa.py` now
  measures the two panes and asserts they agree.

Verified: `qa.py` — 31 viewers, no console errors, template round trip, parity
same-shape, both landings; `test-authorize.js` 125 passed; `test-roundtrip.js`
clean slate / round trip / fixed point / archived plan all PASS on a fresh
Postgres 16, plus an upgrade run against a database created at v3.19 with
`due` and `owner` populated; contrast sweep 53 failing runs across 4
combinations × 34 pages and states — unchanged, all pre-existing (§16.15).

### v3.21 — the BU list, and the register as a file

Islam brought one row of Raya's employee data (`Emp.ID 102347 · Mohamed
Hassanin Ehsan Hassanin · … · BU: Distribution`) and the official list of ten
BUs, and asked for the mapping, an Excel template for the register, roles as a
dropdown, and *Standing* renamed to *Status*.

**Checked before building, and six of the ten do not resolve.** Distribution is
a *company* here, not a unit; Retail is *Retail Stores*; IT is the name of both
a unit and a function; Maintenance, Mazaya, Risk and Support Function have no
counterpart at all. So the file cannot be read against the platform's own list.

- **Setup → BU list** (new page, under *Who*, shares `c_people`). The client's
  ten names, each pointing at a unit, a function, a company, the group — or at
  nothing, which is a real answer for a department that employs people and
  carries no strategy. **The ten names ship; the mappings are deliberately
  empty** (A4) — IT in particular is Islam's call.
- **The register gains *Main BU* and renames two columns.** *Belongs to* →
  **BU** and *Standing* → **Status**, both at Islam's word. Where a person sits
  somewhere other than their Main BU points, the cell says so rather than
  either being quietly corrected.
- **Download and upload on the People page.** One workbook, eight columns,
  matched on **Emp ID**. It downloads the register as it stands, so it is the
  export as well as the template. **An upload adds and amends and never removes
  anybody**; a department it has never met is added to the BU list unmapped
  rather than refused.
- Employee number, email and Main BU are new facts on a person, and **none
  needed a migration**.

**What the round trip caught immediately:** the platform refused its own
export — 31 of 33 downloaded rows named a role the upload could not place.
Fixed by the rule the column already promised: it gives a role, it never takes
or moves one (§54.4).

**Verified:** `test-authorize.js` 131 passed / 0 failed (five new, covering
that nobody below the SMO can point a BU row); `qa.py` clean across all 31
viewers with a new people-file round trip (33 rows, fixed point PASS); contrast
53 failing runs before and 53 after; `test-roundtrip.js` PASS against a real
Postgres 16; and the whole path driven signed-in against the API — the BU list
and a seeded person save, persist, read back, and appear in `change_log` as
*"the BU list"* rather than *unknown*.

**Cost, recorded rather than hidden:** the register table was already 1061px
inside a 920px box; Main BU makes it 1127px. It scrolls in place, the page does
not, and Job title or Contact can be switched off to recover it.

**Waiting on Islam:** what each of the ten names points at (see D8 above).

### v3.21 — the client's mark, on the door and on the deck

- The Raya Trade lockup on the sign-in gate, both cards (§52)
- A unit's own mark: uploaded on Setup › Business units, **PNG only** because an
  uploaded SVG is executable content; large on its review deck's cover and small
  in the footer of every other slide (§52.9)
- The group and unit lockups extracted as vector from the client's brand manual,
  and the client's material filed under `clients/raya-trade/`

### v3.19 — the capability half catches up, and slides get a place

Islam went through the built product and sent notes as he found things. Almost
none of it is a feature: most are paths broken since a rename, fields nothing
read, or controls that looked like one thing and behaved as another.

| What | Outcome |
|---|---|
| **Adding a capability took the product down** | The add button minted `{name, def, measures, tactics}` — the shape a capability had **before §15**. No id, no function, neither list, and the Capabilities Setup page threw and rendered nothing. Removing one threw before it could confirm. §24's rule with the sign reversed: **when a field is renamed, find the code that CREATES it, not only the code that reads it.** |
| **The capability table** | Name typed rather than printed, Remove on the row, Add beneath it, and a confirmation naming what would be destroyed. |
| **Capability pages ↔ pillar pages** | Project codes (FIN01), the coded band on all three project panes, and the function nameplate gone — a unit has no such band, so a function carrying one made the two halves read as two products. |
| **1.43:1** | Two `.capline` rules in one file; the second won on source order, so the band moved to navy and kept the page's ink. The capability's own name, on the band that exists to say it. Sixth header missed by §41.10 — and the function pages had **never been contrast-checked at all**. |
| **Manage slides** | A mode, not a dialog: the whole deck down the left as real slides at one tenth, the selected one large on the right. That removed the position dropdown entirely — you place a slide by where you insert it. Add, move up/down, Fit/Fill, crop, caption. |
| **Fit, not fill** | Two of Islam's notes were one note. Frames were `object-fit:cover`, so a portrait infographic lost both edges and the zoom could only make it worse — 100% was already the tightest crop available. A picture fits whole now; Fill is the deliberate choice. |
| **One switching button** | Units \| Functions had looked like one control since §41.8 and was two buttons dressed to look like one. I measured the container, showed him it was one box, and argued the point. **The measurement was true and the answer was still wrong.** |
| **Four found by using it** | A function's "Shown in the nav" read by nothing; the searchable dropdown closing when you scrolled its own list; long-text boxes two lines tall; blank lines shown at last. |

**Verified:** `qa.py` 31 viewers, no console errors. `test-authorize.js` 123
passed. `test-roundtrip.js` clean slate, round trip, fixed point and archived
plan against a fresh Postgres 16. Contrast **53 failing runs across 34 pages and
states** — every one of them the §16.15 family already recorded, none on any
surface this version built.

**And the checks themselves were wrong three times in one day** (§51.11). A
sweep labelled a page it had never scanned; a probe of mine broke when I edited
what it string-matched and reported the page behind as the new surface; and
removing the two-button fold would have left `qa.py` reporting "ok" having
walked half the product. **A check keyed on markup that no longer exists does
not fail — it passes quietly.** Both sweeps now assert what is lit and say which
page they actually scanned.

### v3.18 — collaborators get a column, and the review gets pictures

Two asks from Islam. The four product decisions inside the second were put to
him before anything was written; his answers are in §50 and spec 009.

| What | Outcome |
|---|---|
| **Collabs.** | A column beside Owner on all three tactics tables — the unit's Performance page, the Plan page and the deck. The data was never missing: `collaborators` has been on a tactic since the import template, is stored in the database, and is what lets a Contributor report a line they are named on. It had no column, no way to be typed, and no demo content — so 116 tactics rendered nothing. §45.2 again. |
| **Setting them** | Under the SMO's pen on Plan, the same gate as any plan correction. Not tidiness: **being named on a tactic decides who may report it**, so a unit that could edit its own collaborators could grant itself reporting rights the matrix never gave it. |
| **Picture slides** | The custodian, owner or SMO adds a titled slide of one to four pictures at any of twelve named points in the deck (five for a function), crops each one inside its frame by dragging and zooming, and captions it. Builds backlog §16.12, undesigned since v3.5. |
| **What is stored** | Never a slide — a title, a position, an arrangement and the pictures. The deck is built fresh every time it opens, and a stored slide would be the exported deck the feature exists to avoid. Lands in `review.extra`, so **no migration**. |
| **Where they go** | An anchor is written on the deck slide it names and carries its own label; the position picker is built by reading the deck back. **The list of places IS the deck**, so the two cannot drift. An anchor that has gone sends its picture to the end rather than dropping it. |
| **How long they last** | The cycle. Archived with its figures on close, cleared for the next one — a picture that stayed would present itself as this cycle's until somebody remembered to remove it. |
| **Who may add one** | Not a new rule: a picture speaks for the whole unit, the same act as submitting and the same act as the cycle note, so it is classified with them and both sides ask one function. |
| **Taking a picture in** | Shrunk to 1,600px, then **encoded both ways and the smaller kept** — measured, not guessed: a screenshot is 164 KB as PNG against 256 KB as JPEG; a photograph is 395 KB as JPEG against 3,058 KB as PNG. |
| **One way into the dialog** | §48.4 made the modal actually modal and left two callers setting `.on` by hand. `openModalHtml()` is the single door now; all three go through it. |

**Verified by driving it, not by reading it.** `qa.py` 31 viewers, no console
errors. Contrast **0 failures on the two new surfaces** across all four
palette-and-theme combinations. **Screen against server: 527 questions — every
person against every unit and function — 0 disagreements.**
`test-authorize.js` 123 passed (8 new). `test-roundtrip.js` with picture slides
in the graph: clean slate, round trip, fixed point and archived plan all PASS
against a fresh Postgres 16. Then signed in to a running `dev-server.js`, added
a picture, watched `POST /api/state` return 200, **reloaded, and read it back
out of the database** on the slide it was placed on.

**Two checks were found lying, both silently and in the safe direction.** The
contrast sweep clicked a unit and labelled what appeared `unit/perf` — but since
§28 a unit opens on Strategy › Plan, so for twelve versions it measured the Plan
page twice and the Performance page never. Clicking Performance explicitly
surfaces **31 failures that have been there all along** (§16.15, recorded and
NOT fixed — a palette decision on a page this version was not asked to touch).
And a scoped probe of my own broke when I edited the sweep, silently scanning
the whole page and reporting the page behind as mine; it asserts its contract
now instead of string-matching it.

### v3.17 — one door, a switch, and a cycle that asks

| What | Outcome |
|---|---|
| **Setup + Manage merged** | One railed page, five groups, *Running the cycle* first. The gear navigates instead of opening a menu — with one destination behind it, a menu of one is a door behind a door. Groups fold, never the one you are in. |
| **Units \| Functions** | A two-position switch: one side always lit, the row always showing one list. The third "both closed" state is what had made it a pair of folds; the disclosure arrow went with it. |
| **Opening a cycle** | Asks for name, period, due date and end quarter. `endsQuarter` was hard-coded to 4 and decides which tactics count as due — a silent guess that moved every unit's execution score. Nothing touches REVIEW until Open. |
| **Prose cleaning** | All thirteen user-facing pages driven and read. Nine already clean. One line cut outright (Weighting described the database); three trimmed of their aphorism but kept their fact. |
| **Report page** | Gets the pillar band Plan and Performance took in §46.3, and stops printing "Direction" — the last place `SHOW_KIND` was ignored. |
| **Pillar note** | Gone. One unit had it, nine did not, so the layout shifted by pillar. Still editable while correcting a plan. |
| **Pillar switch** | Returns you to the top of the pane, with the rail still pinned — not `scrollTo(0,0)`, which would throw the pin away. |

**Verified:** `qa.py` 31 viewers no console errors; contrast sweep **0 failures
across 4 combinations × 25 pages and states**; `test-authorize.js` 114 passed;
`test-roundtrip.js` clean slate, round trip, fixed point and archived plan
against a fresh Postgres 16. Both sweeps were themselves updated — they clicked
menu entries that no longer exist, and now walk the rail and unfold every group
first (§41.5, third time).

### v3.16 — Setup becomes a place, and four things drawn before they were built

Four of the five items were settled from a **mockup** rather than a
description. Two options in it were killed by being drawn, one of them mine
(§46).

| What | Outcome |
|---|---|
| **Setup rail** | Ten flat tabs become a rail grouped by *the question you came to answer* — Who · What we run · How it's measured · How it looks. `.rail` is the unit pages' own component, so nothing new was invented. The gear menu now offers Setup as **one** entry: listing the pages in the menu *and* the rail states the navigation twice. The icon-strip collapse was **killed by its own mockup** — ten setup pages need ten icons, and a label, a scoring band and a figure set have no picture anyone guesses right. |
| **Figure sets** | Configuring and filling become two sections of one page. Gated on `c_source` (`area:"always"`), so the SECTIONS decide: the SMO gets both, a set owner gets only *Fill*, anyone else gets no entry. |
| **Pillar title** | Back on Plan and Performance as **treatment B3** — `--surface-2` with a 3px gold left edge, to the pixel what `.ritem.on` wears. 57px → 33px. Exposed that the Plan page printed `01` where every other surface printed `MB01`: **the code shown is derived, the code stored is an identifier.** |
| **Fill a figure set** | One flat searchable table across all ten units. Measure and Target are separate columns so search can't match `4B EGP`; key objectives join through an `In` column; `#` numbers what is *shown*. Typing never repaints. |
| **People** | 79px → **39px, every row the same height.** Content-sized columns, a *Belongs to* column, roles clipped with the full text on hover, Password squeezed to None/Set/Temp, and a kebab at the end of the row holding Reset password, View as and Retire. |
| **Collective passwords** | Two actions, not one with a wider reach. *Issue to those with none* can lock nobody out; *Reset everyone* overwrites live passwords, ends those sessions, is confirmed first, and **excludes the person asking** — on the server. |

**Verified by driving it.** `qa.py` walks 31 viewers with no console errors;
contrast sweep **0 failures across 4 combinations × 25 pages and states**;
`test-authorize.js` 114 passed; `test-roundtrip.js` passes clean slate, round
trip, fixed point and archived plan. Both collective actions were run against a
live Postgres and checked at the row level — the SMO's hash and `must_change`
untouched, everyone else's replaced and their sessions gone.

**One crash found and fixed on the way:** an empty array is truthy, so a viewer
whose every section was refused walked into `secs[0].k`. The real fault was
upstream — paint() fell back to the *unfiltered* def list when the reachable one
came out empty, putting back exactly what it had ruled out.

### v3.15 — eight refinements, and what the measuring found

Islam went through the built product screen by screen. Eight items, none of
them a feature; half of them a symptom with a cause worth recording (§45).

| # | Asked for | What it turned out to be |
|---|---|---|
| 1 | Drop the 3-year column from a plan's key measures | Done on the **Plan page only**. Key objectives keep theirs on Foundation, the Temple and the deck — a different table, and Islam was told which. `target3y` is still stored: a column went, not a field. |
| 2 | The pane repeats the rail card | Removed on Plan and Performance. Kept where a unit has ONE pillar (no rail to name it) and in edit mode (the name is typed in that heading). The pen moved, because **a hover control needs something to hover**. |
| 3 | Keep the "view as" dropdown; put the Finance-entry thing in the demo data | The dropdown was a **live bug**: `sync.js` read `person.level`, a field §33 deleted, so the switcher was hidden from everybody including the SMO. And the demo shipped with no figure sets, so §44 rendered nothing anywhere. |
| 4 | Dropdowns beyond 5 items searchable | One component, every `<select>` in the platform. The native select **stays and is hidden in place** — nothing wire() attaches is disturbed. |
| 5 | What does this toggle do? | Answered, no change: it is §44's tenant switch for *Strategy › Who enters*. |
| 6 | The access table's design | Header notes to hover; the eye was a **colour emoji** that could neither take the button's colour nor fit inside it — both icons are SVG now; rows tightened; the two essays moved to the knowledge base. |
| 7 | The fill-a-figure-set list is screen wide | Capped at 760px. The tick and the state it produces were at opposite ends of the monitor. |
| 8 | People rows are very high; where is password reset? | The chips explained the **worst** row and none of the ordinary ones. Measuring every cell found three things paid on all 31 rows: 61px → 41px. Password reset was never missing — credentials are not in the state graph, so the column is absent from a file-opened build. |

**Verified by driving it, not by reasoning.** `qa.py` walks 31 viewers with no
console errors; the contrast sweep reports **0 failures across 4 combinations ×
25 pages and states**; `test-authorize.js` passes 114; `test-roundtrip.js`
passes clean slate, round trip, fixed point and archived plan against a fresh
Postgres 16 — where `org.extra` now holds no `sets`, because the demo's figure
set was the first thing §44 stored where §21's clean slate was not looking.

**Multi-tenant:** restated by Islam and recorded as §36.5. Still nothing built
and nothing scaffolded, deliberately. His restatement settles half of §36.4's
open question — *enter first, then choose the client* means one account
reaching many tenants, not an account per tenant.

### v3.14 — figure sets: who is responsible for which numbers

The whole of spec 008, in three steps. **Many numbers are not the business
unit's number** — revenue and margin exist in Finance before a unit is asked
for them, and asking ten units to type them means the same figure is entered
ten times and can be wrong ten times.

**A set is the thing that owns numbers** — a name, a team, one owner, and a
list of figures drawn from any unit. *Financial Figures · team Finance · owner
Hossam.* Naming the set is what makes it workable: "figure custodian 1, 2, 3"
says nothing, and the owner then needs no role of their own. The **team is on
the set**, so the unit reads *Set by Finance* — which is what the BU head
actually needs when he is writing the note against a number he did not enter.

**Who may pick a set's figures is a security setting, not a convenience.**
Ticking from the full list means reading every number in the group. For Finance
that costs nothing; for anybody else it hands the lot to somebody whose job was
three of them. So it **defaults to you**, and you open it deliberately — and
the server enforces it, not the screen.

**One figure, one set — first claim wins.** A figure somebody already holds is
refused by name, with **Request the claim** beside it rather than nothing. The
request records the figure, the asking set and who asked; **you answer it** on
the Reporting cycle page — *Move it* or *Leave it*. Asking twice is refused.

**The second way of assigning is built and switched OFF**, as you asked. Once
you turn it on (Setup › Figure sets, behind Edit), every unit gains a
**Strategy › Who enters** page: the unit's own plan in the order it reads, with
a searchable name against each figure. Naming somebody gives them **that figure
and nothing else**. Turning the switch back off hides the page and keeps every
naming.

**Three pages:** Setup › Figure sets, Setup › Fill a figure set (offered only
to somebody who has a set to fill), Manage › Figures I report (hidden for
anybody named on nothing).

*Verified:* 114 authorisation checks, 0 failures. Driven against a running
server and a real Postgres — the custodian's save was accepted and the server
holds it; a forged naming against another unit was refused, said so on the
page, and wrote nothing. Round trip, clean slate and fixed point PASS on a
fresh database. Contrast 0 across 4 combinations × 25 pages and states. QA's 31
viewers, zero console errors. Byte-identical rebuild.

### v3.13 — the headers wear your brand again

You spotted the rail's **PILLARS** header and the table headers had gone grey.
That was deliberate in v3.11 — the design language I ported uses a light table
header — and you were right that it was wrong for us: **`--panel` is the colour
Setup › Branding sets for the navigation bar**, so a header on it wears the
tenant's brand. A grey header wears nothing.

**All five went back together:** every table header, the pillar-list header,
the rail's header, the grouping rows in Setup, and the unit and capability card
headers. Half of them would have been worse than none — the ones left behind
read as mistakes rather than as a style, which is exactly what had happened to
the presentation deck.

Rather than list them from memory I diffed every rule that used the bar colour
before the retheme against every rule that uses it now. Eight had lost it: five
were headers and are restored; three had gone to the accent instead, which is a
different decision and stays.

### v3.12 — Finance enters the numbers Finance owns

Your Finance custodian, built. §16.7 in the decisions document had already
designed this; your description matched it, so nothing was reinvented.

**Setup › Source of figures.** You choose the **team and the person once**, at
the top. Then the units are buttons in a row — with a count on each, so you can
see where the work is left — and every figure is a single tick: *is this theirs
or not.* Measure and target, nothing else. A figure already marked for another
team shows that team's name instead of a tick, so you cannot overwrite it
without noticing.

The first version asked for two dropdowns on every row, one unit at a time —
116 of them. You were right that it was impractical; this is one choice and a
run of ticks.

**Manage › Figures I report.** The custodian's own screen: every figure they are
master of, across every unit, in one place. Finance enters revenue once per unit
without visiting ten pages. Nobody else sees this page — it is hidden outright
for anyone named on nothing.

**On the unit's own page**, a sourced figure shows greyed with the team's name
beside it. The unit cannot type it — the server refuses, not just the screen.

**Three things worth knowing, all of them already settled in §16.7:**

- **The unit still writes the note.** The number is Finance's; the performance is
  the unit's; the explanation belongs to whoever owns the performance.
- **A sourced figure still counts toward the unit's total**, so a unit cannot
  submit around a missing Finance number. That looks like a defect and is not
  one: it means the unit chases too, instead of the SMO being the only one. The
  page names what is outstanding and which team owes it.
- **Who is master of a figure is yours alone to set.** A unit that could nominate
  the source of its own numbers could nominate itself.

**Not sourced yet:** capability projects — deliverables, outcomes and milestones.
Unit key objectives and key measures are what you described, and what is built.

### v3.12 — the security floor

Everything in the list I gave you, built.

**The `1234` password is retired, not deleted.** You can still sign in with it
— a deployment with no way in is not a deployment — but it now takes you
straight to "choose your own password", once. If you have already changed it,
nothing happens: the check asks whether the stored password is still the
shipped one, and only nags if it is. **It cannot lock you out.**

**A temporary password now buys nothing.** Before, someone you issued a
password to could ignore the change screen and still open the whole tenant for
thirty days. The server refuses until they have chosen their own.

**Guessing is slowed down.** Eight wrong attempts on one person, or twenty-five
from one address, in fifteen minutes, and it stops answering. It clears itself
— no lock for anyone to lift. One thing to know: anyone who knows a username
can push that account over the limit on purpose. That is the price of having a
limit at all, and a short self-clearing window is the cheaper half of the
trade.

**Security headers, on every page.** The platform can no longer be put in a
frame on someone else's site, cannot load anything from anywhere else, and
cannot send anything anywhere else. One honest limit: the single-file design
means the strictest form of this is not available yet — recorded, with what it
would cost.

**Database errors stop reaching the browser.** They named tables and columns —
a free map for anyone probing. One plain sentence now; the real error goes to
our log.

**Sessions.** Expired ones are cleaned up. And changing your password now signs
out every other device you were signed in on — which is the point of changing
it.

**Still open, and these need decisions rather than code:** who at Forefront can
read the production database, backups and what happens to a client's data when
an engagement ends, and an outside penetration test before go-live.

### v3.12 — the server decides who may change what

**The hole.** Saving used to check that you were signed in and nothing else,
then write back whatever the browser sent — the whole tenant, register and
permissions included. Anyone with a login could make themselves the SMO. The
access page we built in v3.10 decided what a screen *showed*; it decided
nothing about what the server *accepted*.

**Closed.** The server now compares every save against what it already holds,
works out what actually changed, and refuses anything that person's roles do
not allow. You see nothing different — same screens, same saving.

**And you get the history for free.** The comparison that decides the save is
the one that gets written down: *Mobile · Data duplicate rate · actual · 1.4%
→ 51% · Ashraf Laithy.* "Who moved this target" has an answer now.

**Your three answers, built.** A locked cycle takes no more figures from
anyone but you. Contributors view by default, and if you give one edit they
can only touch the lines they are named on — and they cannot submit the unit's
report, because that speaks for the whole unit. A tactic's quarters are part
of the plan, so only you move them.

**A refused save now says so, on the page.** Before, a failed save warned a
console nobody has open and retried for ever — which with this change would
have meant an edit sitting on screen as though it had landed.

**One defect this found:** the platform was quietly sending a "branding" the
database never had, on every single save. Sixty-seven tests missed it; signing
in as a unit head and typing one number found it in a minute.

**Not closed, and next:** the `1234` password, the temporary-password gap, no
limit on password guessing, and the missing security headers.

### v3.11 — a new look, and colours and fonts you can swap

The Strategy-Formulation design language, ported onto SMP's own screens: 14px
body, no serif, black-weight uppercase micro-labels, hairline cards that state
themselves by border colour, and a light table header where SMP had a navy band
and a zebra stripe.

**Two layers.** The *language* — type, shape, weight — is one set and never
changes. The *palette* is colours only: **Slate** and **Forefront**, each in
light and dark. When multi-tenant lands, a client's branding will arrive as a
palette, never a language — so they get their colours without getting a
different product.

**Branding is a Setup page** (§39). Two colours — the accent and the navigation
bar — and the platform works out the other five, including darkening a colour
that cannot be read as text and telling you it did. Every derived pair is
contrast-checked as you type. It is saved with everything else, so it is what
everyone in the tenant sees; the switches in the top bar remain your own screen.

**Typeface is a third switch, for now.** Four faces are embedded in the file:
Inter, Source Sans 3, Manrope, IBM Plex Sans. Try them on your own screens with
your own numbers, then tell me which face belongs to which palette — at that
point the switch folds into the palette and the ones you did not pick come out
of the file. Embedded rather than linked because the file has to open from a
memory stick and still look like itself.

**Zero contrast failures across all four colour combinations.** Light mode had
been carrying 61 known failures since v3.0; the new palette clears them rather
than fixing them one at a time.

**The accent budget** (§41). The retheme gave a solid accent fill to five
things at once, and one solid fill is a mark where nine is a colour scheme —
it is a strategy platform, it should be quietly coloured. The rail's selected
direction went back to a grey ground with an accent EDGE, the navigation went
back to the underline, and the pips stayed solid because a 20px pip is a mark,
not a slab. The **open Units / Functions fold** was the last one left: with the
navigation quiet again, the menu you had opened was louder than the page you
were on. It is accent words with no fill now — an open fold is a heading over
the list it just revealed, and a heading does not need a box.

The file is 994 KB with all four typefaces inside, up from 792 KB.

**Merged in v3.12.** Some deeper reporting and config surfaces still carry old
shapes. The login page is untouched — it has its own design you approved.

### v3.10 — roles and access, at the size you can read

The page you called exhausting was 25 pages × 7 roles, three buttons a cell —
**525 controls on one screen**. It is **seven roles down and seven kinds of page
across**: Group, own business unit, other business units, own supporting
function, other supporting functions, Reporting cycle, Setup. Forty-nine cells,
one screen, none / view / edit, and edit includes view.

Two changes to your six columns, both forced by what the current settings
actually said. **Setup and Management could not be one column** — every role
sees the Reporting cycle and only you touch Labels and Bands. And the
**Knowledge base left the table**: it was `view` for all seven roles, and a
column where every cell holds the same answer is a question with no second
answer.

**"Own" is not a setting**, exactly as you said. It is read from what each role
is attached to. That also let the table say something it never could before:
*a unit owner may view other units.* Tested live — granting it took Mobile's
head from 2 destinations to 11 on the next repaint.

**Three things became rules instead of cells**: the knowledge base is readable
by everyone; a plan is corrected by the SMO alone, however much access the
unit's people hold; and focus measures are marked by the group CEO and you.

One thing this costs, recorded rather than hidden: a **Contributor** with edit
on their own unit can now also edit that unit's Foundation and SWOT, where
before the SWOT was hidden from them. Reversible by setting Contributor to
*view*, at the cost of their reporting.

### v3.9 — the sign-in page, and the register

**The sign-in page** (§34). One 400px card was carrying the whole product, so
every line of brand had to be squeezed above the password box. It is a split
now: a navy wall arguing the product's case, a pale dotted field the form floats
on. Glass card, icon-inset fields with a gold focus ring, one staggered
entrance. Everything the wall claims is something SMP actually does — the front
door is the last place invented capability belongs.

**The register** (§35). A People page: everyone the platform knows, their job
title (which never decides access), contact, roles with what each is attached
to, password state, and standing. SMO only.

Your "these three tables should interact together" needed no synchronising. §33
had already put a responsibility role on the **thing**, so the People page
writes `UNIT_ROLES.mobile.head` — the same field the Business units page writes,
through the same function. There is one copy, so they cannot disagree.

The role dropdown is a **search** now, with **+ Add new**. The old `<select>`
could offer only people already attached to the unit, which meant a new unit
could never be given its first head; and it could not offer somebody who does
not exist, which is the normal case when a plan arrived yesterday. Typing a name
nobody has creates the person and gives them the role in one act, and they are
in the register immediately.

**Passwords.** Per-row set and reset, plus one shared temporary password issued
to everyone who has none — the **server** picks that set, so a stale screen can
only ever issue to fewer people, never more. Each person is forced to choose
their own on first sign-in.

**People are retired, never deleted** — snapshots name whoever entered a figure.
Retiring revokes every role they hold and closes the door on the server: a
retired person is refused with the correct password.

**The URL** (§35.6). It read `/SMP-Project-Folder/strategy-management-platform-v3.8.html`;
it reads `/raya-trade` now. The version stays in the filename, because the
version is the cache bust — it just stops being something a person has to look
at.

**Multi-tenant** (§36) is assessed, not built: one Postgres schema per tenant
when the time comes, never a tenant column — person keys are short and global,
so a column forces composite keys through credentials and sessions.

### v3.8 — roles replace levels
N-1 / N-2 / N-3 are gone. **The role is the thing**, and job titles never decide
access — they are information about a person. Seven roles: Super user, Group
CEO, Company CEO, Business unit owner, Strategy custodian, Supporting function
head, Contributor.

The design that makes your "and vice versa" work: a role naming a **seat**
(super user, CEO) lives on the person; a role naming **responsibility for a
thing** (unit owner, custodian, function head) lives on the thing — Mobile
already had a head field, and that pointer *is* the role read from the other
end. So setting it on the unit page and setting it in the registry are the same
write and cannot disagree. Several roles at once come free: group CEO *and*
owner of Care are two records in two places.

Someone holding several roles gets the **most generous** grant across them —
but only ever within the reach each role carries.

The matrix was **rebuilt, not mapped**, as you asked, and now shows seven role
columns across every page.

**Two things this caught that would have hit production.** The access matrix
crashed on a migrated tenant, because its map is legitimately empty and the
page read it directly. And more seriously: `schema.sql` can never add a column
to an existing table, so the seed would have written `people.role` before the
migration renaming `level` ever ran — breaking your live database, invisible to
every fresh-deploy test. Migrations now declare `-- @phase: pre` and run in two
passes: schema before the seed, data after.

Verified against a **faithful v3.7 tenant built by the v3.7 code itself**, then
upgraded.

### v3.7 — one door
**The gate was three states, not two.** It painted the sign-in card
immediately in its old shape, then reshaped it when `/api/auth` answered, then —
if your session was already valid — swapped the whole thing for a Starting page
whose only content was a button to the platform. Every time.

Now: nothing paints until the session check answers. **Session live → the
platform opens and the gate is never seen.** No session → the sign-in card,
once, in its final shape. Temporary password → the change-password step, because
that is the one thing standing between signing in and being in. The Starting
page is gone entirely; sign out lives in the platform's top bar.

The **30 days were already true** (`SESSION_DAYS = 30`) — what made it feel
untrue was being asked to press a button every time. The gate now says it out
loud under the button.

The door itself follows HR_ERP: navy ground rather than pale grey, a gold
eyebrow above the mark, deeper corners, more padding, errors as a tinted block.

Also: the Labels page loses its last three notes to the knowledge base. The
**collision alarm stays** — that is a blocked save, not an explanation.

### v3.6 — the plan is correctable, for the SMO
The pen you asked for is on the Plan page, **for the SMO only**. §22 still
stands: a plan is authored by upload, the template still carries no codes, and
replacing one still archives it. What this adds is the correction afterwards —
a target typed wrong, an owner who moved — without re-uploading a whole unit to
fix a word.

Editable: the pillar name and end-state, each measure's name, target and
three-year target, each tactic's name and owner. Not editable: the code (minted
on arrival), and the direction and compile rule — those change what a figure
*means*, and a plan whose meaning drifts under a reported actual is worse than
one that is wrong in a name.

SMO only and not merely by access key: `u_plan` at edit is held by unit heads
too, and a plan being correctable by the person measured against it is a
different decision from one correctable by its custodian.

### v3.5 — the knowledge base, and the two-click save
**The two-click save.** Fields commit on `change`, which fires on *blur* — so
pressing Done blurred the field, which saved, which repainted, which destroyed
the button you were pressing. Your value was saved on click one; what needed the
second click was leaving edit mode. Fixed once for every field: a repaint asked
for while the mouse is down waits until the click lands.

**The Knowledge Base is live**, first in the Manage menu, open to everyone.
Seven sections with a contents strip — scoring, access, labels, units and
functions, plans, the cycle, and where the data lives. Everything I removed from
the four setup screens is in it, plus rules that were previously only in the
decisions document.

Building it caught something worse: **a page added in a new version was
invisible on every existing tenant.** The access map is stored per tenant, so it
only holds the keys that existed when it was written, and a missing key read as
"denied". It now falls back to the shipped default. That would have bitten every
future page, silently, and only in production.

Also: **Companies is its own tab**; the **pen icon** replaces the bare Edit bar
on Foundation and SWOT, appearing on hover and staying while you edit; a third
byte-identical **dead duplicate function** removed.

Two things not done, both deliberate. The **Plan page has no pen**: it has no
edit mode because plans are authored by upload (§22), so adding one is a real
change to how plans work, not a seventh tweak. The **scroll step that reverts**
did not reproduce under real wheel input — one candidate named in §30.8, not
fixed on a guess.

### v3.4 — seven from the deployed product
**The Units/Functions buttons weren't lagging — they were dead.** Open the
Manage menu, close it any way at all, and both folds stopped listening until
something else forced a repaint. The row's HTML is rewritten whenever the menu
opens or closes, which destroys every handler inside it; the folds were wired
somewhere that only ran on a full repaint. Now whoever rewrites that row re-wires
it, in the same place.

The **first line is 27px**, half of 47. It was stuck at 31px of content because
two `.themebtn` rules disagreed and the wrong one won — a duplicated rule doesn't
fail loudly, it quietly ignores you.

The **rail no longer slides**. It sat 34px below the chrome and pinned at 12px,
so it dropped 22px on the first scroll. The gap and the pin are now the same
variable, so the difference can't be non-zero: measured 0px of travel at every
scroll position.

Also: **Direction/Capability is hidden everywhere a reader goes** (one flag,
five call sites — flip it to bring them all back; the field itself is untouched
in the data and the import template). The **"Plan only" notice** and the rail's
**"Figure shown is key measures"** footer are gone. The rail rows now read
**"3 measures · 2 tactics"** instead of a small line and a bare unlabelled
number. The Manage menu's group labels sit on a grey band.

### v3.3 — your six, and the scroll glitch at its source
The footer sentence is gone. **Manage is a gear**, not a word — it was the
widest thing in the navigation row and it named a menu rather than a place; the
word moved to its tooltip. The **rail expands to fit any number of directions**
— the cap that cut lists off mid-row is gone, proven against a unit with 18.
The heading above it went too, on both Plan and Performance, along with the unit
name and the "plan as agreed" note: the nav row and the tab already say both. A
**business unit now opens on Strategy › Plan**.

And the scroll-up glitch, at its source this time. Three earlier versions fixed
real causes underneath it and the symptom kept returning. What was still there,
measured: **at scroll position 25 the chrome settled at 190px if you arrived
scrolling down and 168px if you arrived scrolling up — and stayed there.** That
is the condense-on-scroll's hysteresis working as designed, and its cost is that
scrolling back up drops 22px of chrome into the page in one animated step,
moving everything below it. It bought 22px on a header that is now 47px tall.
The whole mechanism is gone. The chrome reports **one single height** across a
full sweep in both directions and 65 frames of continuous upward scroll.

### v3.2 — one line, and the thing that was really moving it
The first line is now **one line at every width**, not just at 1180 and above —
which is what v3.0 actually verified, and why it still arrived as two rows on
your laptop. It no longer wraps at all; the pieces shrink instead, buttons last.
The product name went from 26px to 13px (it was the largest text in the whole
product, restating the tab you are already on), and the header went **from 108px
tall to 47px**. Auto is gone: Light and Dark only, with your device still
deciding where the switch starts.

The "glitchy header" was never the header. Every explanatory icon's hover note
is a ~320px box that was laid out **at all times** at `opacity: 0` — invisible,
but still counted. Wherever one sat near the right edge it pushed the page wider
than the window, the page scrolled sideways, and the sticky chrome slid with it,
as sticky is defined to do. Hidden tooltips are `display: none` now, so nothing
in the product scrolls sideways any more.

One thing fixed that you did not ask for: the group's front page read **`NaN%`**
under BUSINESS UNITS — EXECUTION. With no tactics loaded it was computing 0/0.
It reads "Not yet measurable" now, like the two cards beside it. Every clean
slate showed it; the demo dataset never did.

### v3.1 — installable
SMP installs to a dock or a home screen: its own icon, its own window with no
browser chrome, and it opens with no network. The one thing a service worker
must **not** do is the thing it exists for — `/api/*` is never cached, because a
cached `/api/state` is last quarter's actuals wearing this quarter's chrome.
Those go straight to the network and are allowed to fail; the platform already
falls back to its baked data and says so. Everything else — gate, platform file,
icons, manifest — is held, network-first so a deploy still reaches everyone.

Icons: 192, 512 and a 512 **maskable**, which is a different drawing rather than
a resize (platforms crop maskable icons to a circle, so the rounded tile would
have lost its corners). Two `theme-color` tags, one per scheme, or an installed
app in dark keeps a navy title bar over a near-black page.

### v3.0 — light and dark, by choice
The dark palette had been in the stylesheet since the beginning and nothing
ever selected it, so the product followed your laptop silently. Now there is a
control: **Auto · Light · Dark**, cycled by the round mark left of Demo data.
Auto is where everyone starts and keeps following the device. The choice is
remembered **on that screen only** — never in the database, or one person
picking dark would turn the platform dark for the whole tenant — and the
sign-in gate reads the same choice, so signing in never changes the colours
under you. The gate's own dark colours were built; it had none.

Switching the palette on for the first time exposed what had never been
checked: colours written into rules as literals. The zebra stripe on **every
table** was a hardcoded `#F7F9FC`, so in dark it painted a near-white band
under near-white text. Five new tokens close that class. Measured over 19
pages, dark went from **482 failing runs to 11**. Light, untouched, still has
61 — pre-existing, shipped, and a palette decision rather than a dark-mode fix
(§25.5, open).

Two things came back with it: **the client's name** beside the product name on
the first line, which §24 had removed entirely, and the first line **actually
being one line** — measured, it never had been for anyone signed in: the two
buttons had been wrapping onto a row of their own since v2.9.

### v2.9 — two lines of chrome, and one way in
Your six changes, all of them, plus the Info button you asked to remove.

The first line was carrying five statements of where you are — "Strategy
Management Platform · Spec 012", "Raya Trade — B2B eComm", "Group · 10 business
units · H1 2026", Info, Demo data — stacked above a navigation row that already
highlights the unit you are on and a tab row that names the page. It is three
things now: **Strategy Management Platform** on the left, **Viewing as** in the
middle, **Demo data** and **Sign out** on the far right. Then the navigation.
Then the tabs.

Setup and Manage were a gear and a stacked-list glyph pinned at the right of the
nav row, holding ten pages between them, and which glyph held which was
something you had to remember rather than read. They are one **Manage ▾** button
now, with the ten listed under two headings — MANAGE (Reporting cycle, Import,
Archived plans, Focus measures) and SETUP (Labels, Levels & access, Scoring
bands, Business units, Supporting functions, Capabilities). To your test: **every
entry still takes you to its own place**, with the same tab row underneath it.
Nothing about the pages changed — only the way in.

*Verified served and signed in: all ten entries opened their own page with the
right tab selected; the menu closes on an outside click and on Escape; `qa.py`
now walks the menu as well as the row, 31 viewers, zero console errors. The rail
re-proven rather than assumed — three window sizes, four scroll depths,
`elementFromPoint` returning the rail on every row every time. Round trip, fixed
point and archived-plan round trip PASS; the seed is byte-identical, because
none of this touched the data.*

*One thing the removals also fixed: `.eyebrow` was styled for the header but is
also the deck slide's kicker, so a `max-height:20px` clip and a `body.scrolled`
fade written for a condensing header were reaching a full-screen presentation
slide. Deleting the element took its CSS with it.*

### v2.8 — the cap that would not settle
You asked me to test the rail again, so I tested it the way you actually use it:
**served, signed in, on a cleared tenant, against an uploaded plan, clicked while
scrolled.** The browser driver would not click at all — *element is not stable*,
retried for thirty seconds. And the cause was v2.7's own fix.

Capping the rail against the measured chrome height closes a loop: the cap
follows the chrome, the cap changes the page height, that re-clamps the scroll,
that flips the header, that changes the measured height. Traced at
240 → 243 → 290 → 240 → 290, forever. **A sticky offset changes nobody's height;
a max-height does.** The cap is a constant now.

The loop had a second door: the chrome is in flow, so condensing it shortens
every page by ~40px, and where a page is barely taller than the window that
alone flips the header back. The header no longer condenses when there is no
room to scroll — reclaiming 40px on a page with 60px of scroll was never worth
it anyway.

*Verified across three window sizes — desktop, short, and a 620px laptop — on
both Performance and Strategy → Plan, at four scroll depths each: **every rail
click selected the pillar pressed**, no row covered by the chrome on any normal
window, and the rail's position dead steady across 22 consecutive frames.*

One residual, honestly stated: on a very short window the first rail row can sit
behind the chrome — because a sticky element cannot float outside its container,
and on a short page the whole section has scrolled up with it. That is what
sticky does; making the rail escape its container would be worse.

### v2.7 — the rail was pinned under the chrome
You were right that neither was fixed. The rail was `top:12px` — twelve pixels
from the top of the **window**, while the header above it is a sticky bar up to
258px tall. So the moment you scrolled, the rail's first rows slid underneath the
chrome, and because the chrome sits above them the **chrome took the clicks**.
You were pressing a navigation button. That is why it failed on Performance and
on Plan alike, and why it looked fine to me sitting at the top of the page.

Pinned below the chrome now, at the same measured height the pillar header
already used, so it follows the header as it condenses.

**The haze had a second cause:** `.chrome` had no background of its own. It
relied on its three rows tiling it exactly — true at rest, not mid-condense,
when the rows animate their padding while the container animates its height.
Measured 169px against children summing to 170: in that gap, the page showed
through. It has a floor now.

*Verified by asking what a click actually lands on:* `elementFromPoint` over
every rail row at four scroll positions — at rest each row hits itself; before
the fix, past 500px the first row hit `BUTTON.primary` in the nav; after it, no
row is covered at any position. Then clicked through, scrolled, on both
Performance and Plan: every click selects the pillar pressed.

### v2.6 — the horizon stops being a default
You spotted that the plan template shipped with **2029** already in it. That came
from the demo data, the clean slate missed it, and it had therefore survived into
your tenant — a year nobody chose, reading as a decision somebody had made.

The Aspiration sheet now says *"Horizon (the year this plan runs to)"* and leaves
it **blank** until you set one; once you have, it shows what is in force so a
later plan neither hides it nor overwrites it silently. Every page that reads the
horizon copes with it being unset: the Temple heading drops its dangling "by",
and the pill says **not set**.

`007-horizon-is-yours.sql` clears it from your tenant — **but only if it is still
the seeded 2029**. Anything you have entered since is yours and is left alone.

### v2.5 — the company level, and two bugs a real plan exposed
**Companies**, ported from the build you did outside the repo (§23). A layer
between the group and the business unit — Distribution and B2C today, with four
units standing alone. It is **visibility, not strategy**: a company carries no
score and no page. A company CEO sees their own units, and two flags **per
company** decide whether they also see the other companies (default no) and the
group (default yes). Supporting functions belong to no company.

Set up on **Setup → Business units**, which now leads with a Companies table and
gives each unit a Company column. Standing alone is named in words rather than
left as an empty cell, because it is a decision. The navigation row does **not**
group by company — you built that and took it out in the same version, and the
reasoning is recorded rather than deleted.

**Two defects you found by actually using the upload:**

- **A pillar arriving from an upload had no code.** Its title read "undefined"
  and every rail button carried the same key, so the rail could not select
  between pillars. Codes are filled in when absent now, positionally; hand-set
  ones are left alone, because nine units carry codes already printed in decks.
- **The sticky chrome was pinned three times over**, at offsets read from two
  custom properties that the shipped file never sets. The header condenses on
  scroll, so the rows drifted out of register and content showed through the
  seams — the haze. One container is pinned now, and the browser owns the
  offset.

**And one found while porting:** `renderFocusSetup` was defined twice, the first
56 lines dead and returning the wrong screen. That is what made your copy look
as though the Focus measures page were broken. Removed.

*Verified:* the access rule proved for both company CEOs and for both flags ·
the code fix through the real upload path, with the rail navigating to the right
pillar · the chrome screenshotted at four scroll positions, rows stacking
contiguously · round trip, fixed point and archived-plan round trip PASS, with
the clean slate now asserting 2 companies and 6 assigned units · every page as
every viewer, live and demo, no console errors · offline walk clean for all 31
viewers · byte-identical rebuild.

### v2.4 — SMP gets an icon
The Strategy Temple, in the house navy and gold, as the browser-tab and bookmark
icon: pediment, architrave, three pillars, stylobate — the platform's own
drawing rather than a generic mark. It reads at 16px, which is the only size
that really matters.

`favicon.svg` and `favicon.png` sit at the repo root for the served site; the
single-file platform carries the same mark **inlined as a data URI**, so it
still shows its own icon opened from a memory stick with no network.

### v2.3 — the plan template loses its codes
**One generic workbook** instead of a download per business unit, and no code in
it anywhere. The unit is chosen on the Read me sheet (one dropdown, cell B2);
everything else — pillar codes, item ids, the links between a measure and its
pillar — the platform assigns on arrival, exactly as it does when you add a
pillar on screen.

What made that possible is a rule, not a clever matcher: **an upload authors a
plan, it does not amend one.** With no row ever matched against what is
recorded, no row needs an identity typed into a sheet.

**Replacing a plan archives it.** Before the new plan is written, the outgoing
one is snapshotted whole — foundation, aspiration, objectives, SWOT, pillars,
measures, tactics and every figure reported against them. **Archived plans** on
Manage lists them with what each held, who replaced it and when, and a
**Restore** that puts one back (archiving whatever is there now, so a restore
can itself be undone). Nothing an import does is a deletion.

**The template asks in your words, not the platform's:** theme by name with an
explicit *— none —* for a cross-cutting pillar · owner typed, not chosen · the
Pillar list on Measures and Tactics read **live** from the Pillars sheet · units
of measure suggested rather than enforced · targets written as real numbers.

*Fixed on the way, and the reason this was urgent:* on a unit with no plan the
Pillar and Owner dropdowns were **empty**, and Excel refuses whatever is typed
into an empty list — so a first plan could not be authored from the template at
all. The same hole sat in the capability workbook's Project column. And every
cell the workbook wrote was text, so every target carried Excel's "number stored
as text" warning.

*Verified:* the template built and inspected sheet by sheet · a filled template
written, read back, and every code minted in the right order with every child on
the right pillar · the flow driven on the real screens — upload, the unit read
from the file, the warning naming 16 reported figures, apply, archive, restore ·
the same over HTTP against Postgres, including the archive surviving a page
reload · round trip, fixed point and an archived-plan round trip all PASS · every
page walked as every viewer, live and demo, no console errors · offline walk
clean for all 29 viewers · byte-identical rebuild.

**A plan must arrive as the .xlsx template.** A CSV has no Read me sheet, so it
cannot say whose plan it is, and guessing would write one unit's plan into
another. Reporting still takes a CSV — it is per unit and the unit is chosen on
screen.

### v2.2 — the clean slate, and the Demo button
The deployed tenant is now the client's own. **Kept:** the company, the ten
business units, the supporting functions, the three group themes, the eight
capability names with their owning function, and all configuration (labels,
bands, levels, the access matrix, the weighting factors and their values).
**Cleared:** every unit plan, foundation and SWOT · the group's foundation,
purpose, values and key objectives · every capability's definition, key
objectives and projects · the reporting cycle, its focus marks and its history ·
the invented people and their role assignments · every weighting factor value,
the written reasons beside them, and the prior cycle. Only `SMO` can sign in.

The worked example did not go: a **Demo data** button top-right switches the
whole product to the full Raya Trade dataset for explaining, shows the
invented-data banner the whole time it is up, and **cannot be saved** — the
autosave refuses to run in demo mode, and returning restores the client's data
exactly as it was left. Offline the button is hidden, because the file *is* the
example.

Three defects only an empty tenant could expose, fixed on the way: "Clear all
plans" on Supporting functions had been inert since 1.7 (it cleared fields a
capability stopped having); capability key objectives and projects were being
stored twice, so a cleared capability would have refilled itself on the next
save; and the group's own scorecard was a stored number that read `undefined%`
with no objectives set — it is computed on read now, like everything else
(§5.1). The viewer switcher was also filled once at load, so after hydration it
still offered the example's 29 people and threw when one was picked.

*Verified:* clean-slate counts read back from a database seeded and migrated
from scratch (units 10, functions 7, themes 3, capabilities 8, people 1;
pillars, measures, tactics, key objectives, clauses, SWOT, projects and history
all 0; cycle and review empty; `smo` the only account) · every page walked as
every viewer, **live and demo, no console errors** · the database read before,
during and after a demo session and across the autosave interval: **unchanged**
· round trip and fixed point still PASS · the offline file walks clean for all
29 viewers.

**The weighting table, empty.** The four factors and their 40/30/20/10 weights
stay — that is the model, not content — and each unit keeps a row to enter its
figures into. Until anything is entered, **every unit counts equally** in the
group compile and the page says so; a share of nothing reads as a dash, not 0%.
Two more defects fell out of this: emptying a cell used to leave the old figure
in place, and a factor added through the editor never got a share column.

### v2.1 — identity
Real sign-in on the deployed product. The gate is a login (person key +
password, scrypt-hashed, httpOnly session); `/api/state` requires a session; a
signed-in person sees their own view; the SMO issues temporary passwords from
Levels & access and every issued password must be changed on first use. The
viewer switcher survives only as the SMO's read-only simulation and in the
offline file. Sign-in for the SMO is `SMO` / `1234` with no forced change
(§19.4, 2026-08-20).

*Verified:* full flow in a real browser against a throwaway Postgres 16 —
bootstrap forced a change; the SMO issued Mennah Farouk a password; she was
forced to change it, saw only Group and Mobile, reported a figure that landed in
its exact row; her temporary password was refused afterwards; unauthenticated
access bounced to the gate. Offline QA walk clean for all 29 viewers.

### v2.0 — the state moved into the database
Schema (the §4 hierarchy + configuration + cycle as real tables), seed generated
mechanically from the platform sources, one endpoint reading and writing the
whole state, schema and seed applied on first contact with an empty database
under an advisory lock. Offline the file still runs on baked data.

*Verified:* round-trip deep-equal (seed → write → read → identical) and
`write(read())` a fixed point; seed-once / no-reseed; browser edits landing in
their exact rows; QA walk clean over HTTP and file://.

### v1.9 — the last prototype gaps closed
Capability card + Cards/Table toggle (§16.6) · capability project import and
export, idempotent for all eight capabilities (§16.4) · presentation mode for a
supporting function · the rail on a unit's My reporting (§15.12 fully cleared).

*Verified:* byte-identical rebuild, QA walk for all 29 viewers, plus a browser
suite per feature.

---

## In flight

**R1 — the Next.js scaffold — is done, on the branch only.** `main` serves the
v2.9 single file as it always has; nothing anyone uses runs on the new stack
yet.

What R1 proved, in `smp-app/`:

- **Prisma reads the existing database.** All 35 tables introspected with
  `prisma db pull` — no new tables, no data moved, no migration. The schema
  stays owned by `db/schema.sql` and `db/migrations/`, which the platform
  applies itself.
- **The design crosses intact.** `scripts/sync-css.mjs` generates the app's
  stylesheet from the platform's own `src/*.css` in build.py's order — carried,
  never hand-copied. A card rendered with the real class names comes out with
  the navy header and the 112px dial, unaltered.
- **The scoring engine ports exactly.** `lib/scoring.ts` (nulls dropped, one
  band function, optional KO weights) computes **the same figure as the live
  platform for all ten units**, Nigeria's dash included.
- Typecheck and production build both pass.

Stack note: Prisma 7 keeps the connection URL in `prisma.config.ts` and
connects through a driver adapter (`@prisma/adapter-pg`) — the same `pg`
driver the old endpoints used.

---

## Next — the rebuild on the HR_ERP stack

**D4 answered 2026-08-20:** the CSS is carried **verbatim** (Tailwind only for
genuinely new things), and the cutover is **early, page group by page group** —
the new app becomes the live site while un-ported screens still link back to
the v2.9 build. Those two answers work together: because the stylesheet is the
same one, the mixed period looks consistent rather than like two products.

| Step | What it is | Why this order |
|---|---|---|
| ~~**R1**~~ | ~~Scaffold beside the live product.~~ **Done** — see *In flight*. NextAuth itself moves to R2, where the shell needs it. | Proved the new stack reads the real data before a single screen is ported. |
| **R2** | **Sign-in and the shell.** The gate, the session, the navigation, the access matrix — the frame every page hangs in. | Everything else needs the frame and the person. |
| **R3** | **Read-only screens first:** Group Performance, unit Performance, Foundation, SWOT, Temple, Strategy/Plan, capability pages. Measured against the frozen v2.9 file screen by screen. | Reading is the bulk of the product and the highest drift risk — port it while there is a reference to compare against. |
| **R4** | **Editing and reporting, per action.** Each write its own server operation, validated against the cycle rules, carrying the **change log** (§16.0a) — the old Phase 2, now built the right way rather than patched on. | Enforcement stops being the browser's word. |
| **R5** | **The heavy machinery:** import/export (Excel + CSV), presentation mode, cycle close and snapshots. | Self-contained; safest to move last. |
| **R6** | **Cutover**, then multi-tenant (§1) and strategy versions (§16.10). | — |

**Longer-term backlog**, unchanged and unstarted: source teams (§16.7), the help
box (§16.8), the rest of people-and-credentials (§16.9 — Phase 1 took the login
half), images in review mode (§16.11). **Open model questions** still open:
§11 (year-end rollover, mid-year tactic removal, the ELABD single-company
shape, optional pillar-measure weighting).

---

## Known limits of what is deployed

Stated here rather than discovered later.

1. **The tenant is empty, and that is the point.** Until the plans are authored,
   most screens show "No data" rather than figures — which is correct, not
   broken. Load one with **Manage → Import**: download the plan template, choose
   the unit on its Read me sheet, fill it, upload it. Press **Demo data** to show
   anyone what a filled-in platform looks like meanwhile.
2. **A plan upload replaces that unit's whole plan** rather than merging into
   it. The one it replaces is archived and restorable, so this is safe — but it
   is not the way to correct a typo. Edit on screen for that.
3. **Authorization is at the door, not per action.** A signed-in person is
   authenticated, but their browser is still trusted about *what* changed.
   Step R4 of the rebuild closes it.
4. **Last writer wins.** Saves replace the whole state transactionally; two
   people editing at once will not corrupt anything, but the second overwrites
   the first.
5. **The SMO password is `1234`** and is not forced to change (§19.4) — weak,
   deliberate, and to be replaced before anything client-confidential goes in.
   Passwords the SMO issues to other people are still temporary and still force
   a change. **No self-service recovery:** a forgotten password is reset by the
   SMO, which also ends that person's sessions.
6. **Usernames are person keys** (`own_mob`, `mobhead`), shown to the SMO beside
   the Set-password control. Real emails are §16.9 work.
7. **The demo content is invented** except Mobile's plan, and labelled as such
   in the product.

---

## Working outside the repo, and bringing it back

You develop in the project folder outside this repo and bring it back. One rule
makes that safe: **start each outside session from the current folder.** Ask me
for a zip, or pull from GitHub. The v2.5 round arrived on a pre-1.9 base, so
taking it wholesale would have deleted four shipped features and everything from
2.0 on — measured at 409, 191 and 187 lines of pure removal in three files.

- **Quick features and adjustments:** just say so here. Nothing to transfer,
  nothing to reconcile, and it lands verified against the real database.
- **Bigger design rounds outside:** fine, from a fresh copy. Then the difference
  is your new work and it merges cleanly.
- **Never send the built HTML as the thing to merge.** It is generated from
  `src/` by `build.py`; an edit made directly to it cannot go back into the
  sources. Edit sources only.

## Where the pieces live

| Path | What |
|---|---|
| `index.html` | The gate — real login when served with a database, legacy AdminSMO latch offline |
| `SMP-Project-Folder/src/` | The platform's sources; `build.py` assembles the single file, `qa.py` walks every page as every viewer |
| `SMP-Project-Folder/strategy-management-platform-v3.10.html` | The built platform (must rebuild byte-identical from `src/`) |
| `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.17.md` | Every decision with its reasoning — the contract |
| `db/` | `schema.sql`, `migrations/`, `seed-state.json` (generated) |
| `lib/`, `api/` | State reader/writer and auth; the two endpoints |
| `scripts/` | `extract-state.js` (regenerate the seed), `test-roundtrip.js`, `dev-server.js` |
| `specs/` | Per-feature specifications (spec-kit) |

**The verification loop before any handover:** rebuild byte-identical → `qa.py`
walk → `DATABASE_URL=… node scripts/test-roundtrip.js` (clean slate, round trip,
fixed point and the archived-plan round trip must all print PASS) →
`node scripts/dev-server.js` and drive it in a browser, **in both live and demo
mode**.
