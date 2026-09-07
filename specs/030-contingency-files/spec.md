# 030 · The contingency files

**Version:** v3.22 · **Decisions:** §297 · **Status:** answered; built

Islam, over five messages, arriving at the requirement that governs everything
here:

> if the platform all is down we need to have a substitue action. so before the
> review day I will download all the presnetations with a time stamp. so in
> case if things are down I have a backup to adjust to and present from

---

## 1 · What the ask changed on the way

It opened as *"where is the presentation download?"* and became something else
twice, and both turns are worth keeping because they moved the answer.

| he said | what it ruled out |
|---|---|
| *"for mass keeping and documentation"* | a fixed record was enough |
| *"in case something needs fixing"* | a fixed record was **not** enough |
| *"a backup to adjust to and present from"* | a PDF cannot satisfy it at all |

A PDF cannot be adjusted, so on his own terms the format he first asked for
answers the errand he first described and not the one he arrived at.

Then two corrections of the first drawing, each of which killed an option
rather than adjusting it:

- **The whole feature is the SMO team's.** The first mockup hung the reminder
  on the welcome screen's *Waiting on you* list — a screen **every** viewer
  opens — so the drawing showed it beside a unit head's own row. Taking these
  files is the office's act; a unit head has nothing to download.
- **The review day is not a measuring date.** *"the cycle is about the time we
  cover and what we report already and how we preorate more dates will create
  confusion. push back if you want."* He is right about the three that are
  there, and the answer was to move the new one out of that block rather than
  to argue for a fourth.

---

## 2 · Two files, one outage, two sides of it

**The working copy** is the platform's own built file with the tenant's graph
parked in it as a `<script type="application/json">` block. Opened from a
laptop with nothing running anywhere it holds every plan, every figure and
every deck, and each deck can be presented and printed from it.

It is **not a second product**: `sync.js` reads the block at the exact point
where it already decides that a `file://` page runs on baked data, so the copy
*is* the platform rather than a rendering of it.

**The slides** are the review deck converted to PowerPoint, for the half the
working copy cannot answer — somebody re-cutting a slide at six in the morning
on a machine that is not theirs.

### Why the slides are converted and not written a second time

§296 refused to write the review deck as a `.pptx`, and the refusal was
measured: `deckSlides` + `deckSlidesFn` are 639 lines over some twenty-one
kinds of slide, and the deck has moved four times in a fortnight (§243, §253,
§254, §259). A second description would have had to be corrected on every one
of those, with the drifting copy being the one nobody opens until the platform
is down.

So it is not described a second time. `deckHtmlFor()` assembles the **real**
deck — the same call Present and the PDF make — and the converter walks the
slides it produced, turning each one's heading, prose and **tables** into
PowerPoint shapes. A slide kind added to the deck tomorrow arrives here with no
edit: nothing in the converter knows the difference between a pillar's measures
and a project's milestones. It knows headings, paragraphs and tables.

**The cost, stated:** the file is text and tables, not a picture of the deck.
Gauges, band fills and the SWOT's four hues do not survive — a figure that
reads as a red pill on screen reads as the words *Off track* here. That is the
trade for slides somebody can actually edit.

### What the existing download is, measured

*Download the plan* (§117, §252.2) is a different document. Its cover slide
says so in words — **"as agreed, no reported figures"** — and its tables are:

| sheet | columns |
|---|---|
| Key measures | Measure · Dir. · Target · Compiles |
| Tactics | Tactic · Owner · Collaborators · Q1 Q2 Q3 Q4 |

Not one reported number. It cannot rescue a review, which is the whole reason
this was built.

---

## 3 · The review day

`REVIEW.reviewDay` + `REVIEW.reviewAt`, in **their own block** on the cycle pen,
under the two columns and behind a rule.

It could not ride on `Reports due`: that is thirteen days earlier in the worked
example — figures in on the 15th, presented on the 28th — and it is free text
carrying **no time of day**, so *"three hours before"* has nothing to count
back from. Both new fields are **picked**, not typed (§177's rule for §177's
reason).

**It consults no arithmetic**, and that is asserted rather than promised: every
score, benchmark, elapsed-month count and review point on the page is read
before and after a review day is set and must be byte-identical.

The four dates a cycle now has, and what each is for:

| field | what it is |
|---|---|
| `from` / `to` | the stretch of year the cycle covers |
| `due` | when the **units** hand figures in |
| `asOfMonth` | the month the figures are **measured against** (§239) |
| `reviewDay` | the day the units **present** — new, and drives only this |

---

## 4 · The reminders

Islam's option B, from two drawn: a banner across the top of the page, in the
slot the platform already keeps for *something about saving* (§258).

- **24 · 12 · 6 · 3 hours before**, set on one line beside the review day —
  per review, not per tenant, and no settings page for one line (§32).
- **Quiet at 24 and 12** on the attention ground, where nothing has gone wrong
  yet (§168, §190); **the alarm at 6 and 3**; and the last drops *Later*,
  because at three hours there is no later.
- **Each person's reminders end when that person has both files** — not when
  somebody else has. Four is the most anybody who ignores it ever sees, and
  nought after the first press.
- **The SMO team's and nobody else's**, asked of the shared rule.

### The limit, stated rather than discovered

Nothing wakes this platform up — there is no clock on the server (§97.5, §283,
§293). A reminder appears **the next time that person opens the platform**. At
three hours before, at 7am, with nobody's tab open, nobody is reminded. Email
would have the same floor.

---

## 5 · The record

Who on the team has taken what, under the cycle it is about — without which
*"all the SMO team will download the contingency files"* cannot be
established. It is the register's own list, filtered by the same rule, so a new
team member appears the day they are given the seat.

Drawn only while there is a review day: with no day nothing is being counted
down to, and a table of *Not yet* against a deadline that does not exist is an
alarm about nothing.

---

## 6 · What it costs, and what it does not

**No migration.** All three fields ride the review row's `extra`, proved on a
real Postgres 16 rather than claimed (§172): they round trip and the keys
**delete** again (§50.6).

**No server change**, and it is asserted anyway (§172): they are review fields
outside `REVIEW_PER_TARGET`, so they classify as `cycle` by the rule that has
governed the cycle's own facts all along — the office may set them, a unit head
and a strategy custodian may not, both ways.

**Two things are named rather than hidden:**

1. The working copy has **no sign-in in front of it**. Whoever holds the file
   sees everything in it. That comes with any backup, which is why the card
   says it rather than leaving it to be found out.
2. The `taken` map is keyed by **person** and travels whole, so two of the
   office pressing inside one save window can lose a stamp (§234's shape, one
   map over). The cost of losing one is one extra reminder, not a lost file —
   recorded rather than split per person, which the differ and the authoriser
   would have to be taught together.

---

## 7 · Proof

`checks/contingency.py` — 63 assertions, over HTTP, because the banner does not
exist over `file://` (§94.11). It **opens** the working copy rather than only
building it: a copy that boots on the baked worked example renders perfectly
and is the one failure this feature exists to prevent.

Falsified from the sources (§276), never by editing the built file:

| what was broken | red |
|---|---|
| the block appended at the end instead of above the scripts | **3** — printing `Mobile`, the worked example |
| the reminder never ending once both files are taken | **1** |
| the slides built by the **plan** builder | **5** |

Beside it: 534/0 authoriser (7 new, both ways), 131/0 differ, round trip and
clean parity on a virgin Postgres 16, two tabs 24/0, concurrent saves none
lost, the incremental writer byte-identical, the full `qa.py` sweep clean, and
`cycle-edit.py` **rewritten, not loosened** (§214.3, §218) — it held every box
in the pen as one flat list, which this decision deliberately splits.

---

## 8 · Recorded, not done

- A flow (§266) still cannot be downloaded; the slides are one file per subject.
- Nothing carries a **PDF** of every subject: §296's per-subject print stands,
  and Islam dropped the collective PDF once the working copy existed.
- With nobody signed in anywhere, an overnight reminder waits for the morning.
