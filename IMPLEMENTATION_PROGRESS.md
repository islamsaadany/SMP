# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** **§295 — Import & archives is three tabs — on the branch
`claude/data-export-import-archive-ot4vl8`, NOT merged**, awaiting Islam's word
on the merge and on which artefact "the presentation" means.

**What §295 is.** Islam, of the page §294's audit was done for: *"I need a
mockup to refine this page and the buttons inside it as it's too clumsy"*, then,
of three tidier drawings of it, *"I don't like any of the options. we need to
rethink the page."* He was right, and the reason is nameable: **the page was a
tutorial — 1, 2, 3 — for something nobody does in one sitting.** You take a
file, it goes away for a week, somebody sends it back. Numbering those as
consecutive steps makes the page furniture for anyone who has done it once, and
it forced *which kind of file* to be answered twice.

Measured before anything was proposed, and it was one CSS declaration:
`.minisw { margin-left:auto }` put step 1's controls **894px along an empty
row**, at a distance that changed with the window (1180 / 860 / 680 at 1600 /
1280 / 1100). Three tabs now — **Download · Upload · Archived plans** — the mode
switch deleted rather than restyled, and the page **435px at rest against 727**.

Download is a blank template card and one **ticked, searchable list of subjects**
with **three buttons over whoever is ticked: Plans · Progress · Archives**, each
carrying its count; one subject is one workbook, several are a zip. Upload is
**two buttons**, and the file confirms the one you pressed — every workbook
opens its Read me with *"Plan workbook"* or *"Progress workbook"*, so the wrong
button is refused by name rather than read wrong. **No CSV leaves; a CSV is
still read.** Every file now names its cycle — measured, no workbook named one
at all, so two progress files taken a cycle apart were identical in their
headings.

**The builder's door moved** to the subject's own empty Plan page, where the
empty state already offered two routes: `data-buildplan` appeared exactly once
in the whole product, so taking the band off Import would have stranded spec 020
entirely. Told that, Islam said *"keep the builder"*.

**One line the whole export rests on:** `zipStore()` encoded every member with
`TextEncoder`, and a workbook through that is mangled silently — the archive
builds, downloads and refuses to open. Falsified: **0 of 19 workbooks open**
without it, with `testzip` still passing.

**Verified.** `checks/import-page.py` (1 red / 2 red on two falsifications, from
the sources) · full `qa.py` ERRORS none · `test-authorize` 527/0 ·
`test-graph-diff` 131/0 · `node --check sw.js` · eleven neighbouring checks
green. `plan-builder.py` rewritten, never loosened.

**Earlier on this branch — what §294 is.** Islam asked for a button that exports every plan at once, and
put the precondition first: *"mka esure that the plans templates for upload and
download are matching all what we have on the platform now and then let's think
how to have this download all build."* That ordering is right, and §22 is why —
an upload AUTHORS a plan, so a column the file does not carry is a column the
plan loses on a download-and-re-upload, and a bulk export built on such files is
a complete-looking archive that cannot be restored.

Measured rather than read: each subject's workbook built with the platform's own
builder, zipped, read back with its own reader, applied through the real replace
path, compared field by field. **Five gaps, and a sixth found on the way — and
every one of them is invisible on the demo data**, so the state had to be made
first. A unit's objectives lost the Weight §243 gave them, so a round trip read
the headline back at equal weight. A capability's `Hidden` was written and never
read, so a hidden objective came home counted. A project's repeat mark had no
column, which changes what happens to its figures at the next cycle. A
capability's progress upload **could not report a deliverable at all** — the
reader asked two fields §104 removed, so "In progress" became `"no"` in a field
nothing reads and the row went on saying Not started while the upload looked
accepted — and a milestone dropped the per-cent §104.10 requires while its
stored figure was written into the box the reporter fills. And a unit's progress
file had no Note column at all, so a report filed entirely by file could never
satisfy §105 and never submit; nor could it carry a tactic's outcome figure,
which §248 made the question that row is actually asked.

Nothing stored moves and nothing is migrated. `checks/template-round-trip.py`
asserts a fixed point rather than a list of columns, so a field added to the pen
turns it red until the file carries it: **19 red** on the shipped build, proved
able to fail one fix at a time. Full `qa.py` ERRORS none, 527/0 on the
authoriser, 131/0 on the differ, and round trip, clean parity, two tabs and eight
concurrent saves green on a virgin Postgres 16. Three neighbouring checks were
stale — one of them **13 red on `main`** since §268 moved the strategy pen — and
were repaired or rewritten rather than loosened (§218).

**Next, already settled with Islam:** the export-all itself — plans + progress +
archives in one zip, from the download dropdown that already holds the
templates. The one piece of new machinery is that `zipStore()` encodes its
members as text, so it must accept bytes before a zip can hold `.xlsx` files.

**Before it: §278.3 — the objectives table — merged to `main`
2026-09-04 on Islam's word**, from
`claude/seasonal-targets-monthly-proration-5clvu3`, on top of §279–§287 from
other sessions.

**What §278.3 was.** Four reports from the live product, two causes. The monthly
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

**Latest merged:** **§293 — the platform collects for ten minutes, then sends
one email.** Nothing goes out while a collection fills; one email then carries
every waiting conversation, and the same rule runs the other way for a colleague
who has not come back. Presence decides nothing (his ruling); only a reply stops
it on the office's side. The existing away setting is repurposed as the
collecting time and ships at 10 — no new control. The send rides the platform's
own traffic, so no scheduler. **It supersedes §283's chase**, at Islam's
decision: `chaseDue()` and `chase_html` are gone, the column stays unread.

## Waiting on Islam

Nothing proceeds past this line without an answer.

**§295 — which artefact is "the presentation"?** Asked for on the Download tab
alongside the workbooks. SMP has two things that answer to the word, and they
differ by a lot of work:

* **The plan as slides** — `buildPlanPptx()`, a real editable `.pptx`, plan
  content only, no figures. It exists, and it is a fourth button for almost
  nothing.
* **The review deck** — what *Present* opens, with the cycle's figures. HTML
  only; nothing converts it to `.pptx`, and `pptx.js`'s own comment says so:
  *"the review deck with its figures already exists and is a different artefact
  for a different meeting."*

**§295 — the merge.** The branch is built, checked and pushed; `main` is Islam's
call on that merge (rule 4). It changes how a save is judged in no way, so it
carries no forced sign-out — but it does change the built file, so `SHELL` in
`sw.js` needs bumping at the merge, to a name `origin/main` does not already
hold (§91, §94.12, §94.16).
