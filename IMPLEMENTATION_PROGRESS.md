# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** **§278.3 — the objectives table — merged to `main`
2026-09-04 on Islam's word**, from
`claude/seasonal-targets-monthly-proration-5clvu3`, on top of §279–§287 from
other sessions.

**What §278.3 is.** Four reports from the live product, two causes. The monthly
drawer spanned every column except the first, and a table shares a spanning
cell's width across the columns it covers — so on the objectives tables, whose
first column was the prose one, Objective went 242px → 97px the instant the
drawer opened and the row 57px → 136px. Islam's own proposal is the fix: the
drawer starts at the second column, under a new `#` column, and no column moves
at all. And `display:flex` on the target `<td>` had stopped it being a
table-cell, which cost two more things nobody had connected — the cell no longer
filled its row (his *"the target cell turned white"*) and, through the sibling
`display:block` rule, a tactic's four target boxes laid out **on top of the
Owner column** at every width (his *"the table is damged"*, measured on the
shipped build with the grid reporting a width of zero). The flex box moved
inside the cell and all three ended together. The row hover is gone at his
instruction — measured, on a striped row the stripe outranked it and it changed
nothing on every second row — and the objectives tables gained the `#` and the
drag handle a pillar's key measures have always had, with the pair centred **by
their marks** rather than by their boxes. Review page:
`design-mockups/objectives-table/2026-09-04_the-objectives-table.html`; the
reasoning is §278.3. `checks/objectives-table.py` is **24 red** on the build
before and green after, 523/0 on the authoriser, 131/0 on the differ, the full
`qa.py` sweep ERRORS none. Three checks held literals these decisions moved and
were **rewritten, not deleted** (§218) — one of which had been red on `main`
since §278 landed and was missed at that merge.

**Before it: §279 — the reporting page says where Submit is held — merged to
`main` 2026-09-04**, from `claude/smo-reporting-submission-m6gbwa`, on top of
§274–§278.2 from five other sessions; built as §274 and renumbered at the merge
because main had taken §274 through §278.2 while it was in flight.

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

**§266.11 — and the dialog stopped changing size as rows move**, from his first
minutes with it: each list was sized by its own content under a cap, so a tick
made one column shorter and the other taller and the whole dialog stepped under
the pointer (measured on that build: 571, 604 and 634px across twelve moves). It
takes the height the whole list would need — both columns together, which cannot
change while it is open — measured rather than written as a constant, and capped
so *Start the flow* stays on screen.

**§266.12 — and one deck's strip is labelled, and its pills grouped**, from
what the master flow already does: a unit's own deck drew 31 blank dots on three
rows, and everything the flow's labelled strip needed a single deck already had
— every slide carries an anchor, and the anchors name the deck's parts. One pill
per section, gathered into the deck's own four blue dividers, so Mobile reads
COVER │ FOUND │ SWOT │ PILLARS MB01 MB02 MB03 MB04 │ SCORE END: 10 pills in 5
groups, 547px, one row at every width from 1920 down to 1024. Four treatments
were drawn in the real deck's bar first and three of them died by being drawn.
The master flow's own strip is unchanged and it is asserted.

**Still open on it, and said rather than discovered:** a projects function's
pills are its capabilities and not its projects, so Marketing gets four pills
with nothing to group. And a drag cannot
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

**Latest merged:** **§293 — the platform collects for ten minutes, then sends
one email.** Nothing goes out while a collection fills; one email then carries
every waiting conversation, and the same rule runs the other way for a colleague
who has not come back. Presence decides nothing (his ruling); only a reply stops
it on the office's side. The existing away setting is repurposed as the
collecting time and ships at 10 — no new control. The send rides the platform's
own traffic, so no scheduler. **It supersedes §283's chase**, at Islam's
decision: `chaseDue()` and `chase_html` are gone, the column stays unread.

---

## Documentation sweep, 2026-09-05

A pass over the whole platform's documentation against spec-kit. It touched no
product code **except one thing it found and Islam asked to be fixed** — see
*The one defect, and the fix* at the end. What it found and what was done:

- **§238 and §241 had no section in the decisions document at all**, while being
  referenced by number from §276, §282, §287 and §288 as though they had one.
  Both are live: the hashed CSP plus the `.vercelignore`, and the incremental
  writer. Written up, marked as recorded late.
- **The constitution contradicted the rules file.** Principle I still said
  mockup-first *"is retired"*, eleven days after Islam reinstated it and while
  every feature in that period was being settled from a published mockup.
  Corrected in both files as a reversal; constitution bumped to **1.2.0**.
- **specs/ hygiene**: a duplicate 029 (save-safety-banners → **030**), three
  specs titled with the wrong number, four saying "not built" long after they
  shipped (010, 012, 016, 017 — 016's provisional §101 was never claimed).
- **Seven backfills**, each of behaviour built across a dozen or more sections
  with no single place stating the model:

  | | | |
  |---|---|---|
  | **031** | How a figure is scored | §239, §243, §248–§251, §257, §264, §276–§278 |
  | **032** | How a save reaches the database | §195, §210, §215, §216, §234, §240, §241, §288 |
  | **033** | Reaching somebody who is not looking | §225, §231, §247, §283–§286 |
  | **034** | The review deck | §224, §236, §252–§256, §259, §265, §275, §280 |
  | **035** | Gaps, filling, and where Submit is held | §205, §214, §223, §249, §272, §279 |
  | **036** | Setup: the register, the matrix and the cycle | §116, §174, §175, §186, §187, §190, §261, §273 |
  | **037** | Authoring a plan on the screen | §189, §194, §226–§229, §232, §260, §267–§271, §281 |
  | **038** | The escaping sweep, and the net behind it | §235, §238 |
  | **039** | Reporting is a tab | §222, revisiting §63 |
  | **040** | A supporting function's report | §242 |

**Coverage: 122 → 217 of 286 decision sections named in a spec (76%), and every
feature-sized decision up to §288 now has one.**

**Corrected at the merge (§274's rule — the sweep runs again afterwards).** Main
moved 30 commits while this ran, and three of them changed what a spec said:

- **§293 supersedes §283's chase.** Spec 033 described the chase as live; it is
  gone from the product (`chaseDue()`, `chase_html` unread). Rewritten as
  *what ships now* (§293's collected email) followed by *what §283 was, and why
  its reasoning survives*.
- **§290 changed how the corner arrives**, which spec 033 described through
  §197's hidden-until-answered rule. Noted, with why that rule permitted the
  change.
- **§288 narrowed its own claim** and confirms §241's writer has been live on
  production since 2026-09-03 — which the §241 section had to hedge on, and now
  cites.

**Arrived after the sweep and not yet specified:** §289 (the bootstrap's lock
inside one transaction — spec 032's family), §292 (a row's type is a picker —
spec 031/037's), §294 (the settings panel scrolls — spec 033's). Named here
rather than left to be discovered.

**What is left, honestly.** The 67 uncovered sections are fixes and refinements,
where the decisions document is the right home and a spec would be filing for
its own sake: §10–§20 (the original handoff), §77–§86 (the table standard's
detail, under spec 012), §131–§146 (email and messaging detail, under specs 014,
022 and 027), §149–§157 (the UI audit waves), §164–§167 (the knowledge base),
§173 and §200–§209 (welcome, session and boot follow-ups), §274 and §287.

None of them is a model anybody has to reconstruct, which was the test applied
throughout: **a section gets a spec when reading it alone does not tell you how
the thing works.**

### The one defect, and the fix (§264.3)

Writing spec 031 turned up **17 comments in `config-data.js` and
`group-render.js` citing §264 for the yes/no target behaviour, which is recorded
at §257** — §264's body mentions `Y/N` nought times, against 34 in §257's. Islam
asked for it to be fixed rather than left to ride along with a later change.

**The cause ran the opposite way from the obvious guess**, which is why it is
worth recording rather than just correcting. Both features were renumbered on
their merges, and the Y/N comments had already been renumbered **correctly** to
§257. It was §264's own merge — renumbering *its* §257 → §264 with a blanket
sweep of the sources — that took main's along with its own. The arithmetic is
exact: main carried 3 + 14 such citations, the branch 1 + 8, and the merged
files hold 4 + 22. Every one of main's, none spared.

**A renumber is scoped to the lines the renumbering branch wrote** — after a
merge the sources are not all yours — **and it is silent**, because the number
it produces is a real section, so nothing parses wrong and no check can see it.

The two sets were separated twice by different methods (reading every comment;
matching each line's text against main's own §257 lines at the merge parent),
both naming the same 17. The 9 genuinely about the headline, the breakdown and
the derived score keep §264. **Nothing on any screen moves**: the built file
differs by those 17 comment lines and one §238 CSP hash, which regenerated in
the same build exactly as that section designed it to. `yn-target`,
`measure-score-spread`, `count-compile` and `unit-follows` green; 527/0 on the
authoriser, 131/0 on the differ; full `qa.py` sweep clean. `sw.js` bumped,
because the built file's bytes changed.


---

## Waiting on Islam

Nothing proceeds past this line without an answer.
