# 018 · The Setup makeover

**Version:** v3.30 · **Decisions:** §108, §119, §120 · **Status:** answered; built
**Constitution:** checked against v1.1.0.

Islam: *"Rethink the whole settings page. The design, the grouping, the
arrangement, a search bar maybe, the namings … let's have a makeover that makes
things easier for the SMO team. The HRerp project has nice practice in the admin
page we can consider as well. Do your audit and evaluation and come back to me
with suggested structures and mockups to decide and we can do it step by step."*

Settled from a mockup carrying the audit, two drawn structures and a per-row
naming table (`design-mockups/setup-makeover/2026-08-26_…html`). Islam chose
**Option A** — the rail keeps the door, an Overview page opens it — the gear
landing on Overview, search on names and keywords first, all namings accepted.

---

## 1 · The audit, in numbers

Measured on v3.29 as the SMO with every group unfolded, which is the state the
office works in:

| What | Measured |
| --- | --- |
| The rail's height | **984px**, pinned 128px down |
| Below the fold | **112px** at a 1000px window, 212px at 900, **312px** at 800 |
| What fell off | **Branding** and **Communication** |
| Entries · groups | 18 · 5, of which the office uses one group daily |
| Names from one word family | **3** — Messages, Send a message, Communication |
| Group badges | Counted entries (6 · 3 · 4 · 3 · 2) — numbers that never change |

## 2 · What was taken from HR_ERP's admin home

Read from its source, not from memory. **Attention pills that never render a
zero**; **the daily queue leads** and set-once trails; **grouped rows on one
screen**; **a description beside the name**; **one quiet glyph per row**, drawn
rather than emoji so it inherits the text colour.

Deliberately not taken: its **hover-only descriptions** (a rail row is too
narrow to hover-reveal usefully), and its **two-column card home** — that *is*
Option B, and Option B was costed and turned down.

## 3 · Why Option A rather than the hub

Option B put every destination on one hub, HR_ERP's shape whole. It was turned
down on one measurement rather than on taste: **every hop between two Setup
pages would go through the hub**, one extra click, dozens of times a day, for
exactly the people the makeover is for. It also abandons the rail pattern the
rest of the product uses and reverses §47.7's page shape.

**Option A's Overview gives the hub's one real gift** — seeing everything
outstanding at a glance — without giving up one-click movement.

## 4 · The namings

Stored keys never change; every rename is a label (§30.2, §58).

| Today | Becomes | Why |
| --- | --- | --- |
| Messages | **Inbox** | What the office *answers*; Send a message is what it *sends* |
| Communication | **Email** | The page is narrower than its name: it sets what a message wears |
| Labels | **Terminology** | The tenant's vocabulary, not stickers |
| Import + Archived plans | **Plan import & archives** | One subject; §22 made importing an archiving act |
| Who | **People & access** | A rail is scanned — an answer reads faster than a question |
| What we run | **The organisation** | |
| How it's measured | **Measurement** | |
| How it looks | **Branding & email** | |
| Official BU list | *unchanged* | The client's own word (§58); the confusion is answered by a description |
| Running the cycle | *unchanged* | Already names what it holds, and the office lives in it |

## 5 · The Overview

**One question: *is anything waiting on me?*** Before it existed the answer took
a walk through five pages, because each outstanding thing lived only on the page
that fixes it — right for the thing, wrong for the question.

**Every row names the function it counts.** A summary page is the one place a
disagreement with the page it summarises is guaranteed to be seen and impossible
to explain, so no row computes anything: each declares a `count` calling the
**same** function its destination page calls, and the check asserts the two
agree rather than asserting the number (§53.5, §94.8).

| Row | Source | Goes to |
| --- | --- | --- |
| Conversations waiting | `CHAT.officeQueue()` — the Inbox's own `queue` action | Inbox |
| Claim requests | `openClaimsList()` | Reporting cycle |
| Units with no custodian | `unitsWithoutCustodian()` | People register |
| Never issued a password | `noPasswordCount()` | People register |
| Said where they work | `saidWhereCount()` | People register |

**A count has three answers, not two.** A number, zero, and *we have not asked*.
Three of the five depend on a server fact fetched outside the state graph, so
`null` is real and is **not** zero: a null row is absent, a zero says nothing is
waiting, and the page never prints `0`. This is §93's fault one surface out — a
summary that shows zeroes for questions it never asked has told somebody they
are clear when it does not know.

**It is the office's**, by the same `when` as Send a message and Inbox, and for
the same reason those are rules rather than matrix cells (§37, §89). A
non-office viewer's gear falls through to Reporting cycle, where it landed
before this page existed.

**The cycle strip** is `cycleTotals()`, extracted from the Reporting cycle page
so both read one answer — and it carries a way through rather than any control,
because this page is read and that page is acted on.

## 6 · The rail fits the window

**§28.3 forbids a max-height fed by `--chrome-h`.** That rule was written
against v2.8's oscillation, whose loop ran measured chrome height → rail height
→ page height → scroll clamp → header **condense** → measured chrome height.
The condense was deleted in v3.3, so the loop is broken at a link rather than
argued away, and `--chrome-h` is a constant (73px at every height swept). The
check folds every group and asserts `--chrome-h` is unmoved — **that assertion
is what licenses the cap**, and if it ever fails the cap goes.

**§100.5 refused this same cap six days earlier**, for a different and correct
reason: *a list must not say "it ends here" when it does not.* So the cap ships
with the sign — a visible scrollbar track and a sticky fade that comes to rest
after the last row.

## 7 · The search, and the pills

**The search** (§108.13) filters the rail on the page's name plus keywords held
in `find` on the def beside the label — one list, so a rename cannot orphan
them. Every typed word must match, in any order. The box sits in the rail's
head, outside the list §108.5 capped, so it cannot scroll away from its own
results. Typing never repaints; the query is held in `RAILQ` and re-applied
after every paint, because the Overview's own fetches call `paint()` about a
second after the page opens — exactly when somebody is typing. It clears on
arrival, and says so when it finds nothing.

That required the fold to stop omitting rows from the DOM (§108.14): a filter
cannot reveal a row that was never drawn, and the failure would have looked
exactly like "there is no such setting".

**The pills** (§108.15) are the Overview's own rows summed by destination —
nothing new is counted, so a rail badge cannot disagree with the page it points
at. Never a zero; never for somebody who cannot clear it (§69); and on a group
heading only while that group is folded, because an open group's rows already
speak for themselves.

## 8 · Corrections after it shipped (§116)

Assessed against the LIVE build once it reached a real client tenant. Everything
in Option A was merged and deployed; four things came out of laying the built
product beside the signed-off mockup:

1. **A cycle with no dates printed its separators** — *"to · due · as of Q4"*.
   Now one shared `cycleMeta()` both the Overview and the Reporting cycle read,
   saying *"Dates not set"* rather than punctuating an absence. Not introduced
   by the Overview: the same line predates it on the cycle page.
2. **The rail's glyphs were drawn in the mockup and never built** — the only
   one of the five HR_ERP practices that did not arrive. Adding them exposed
   that `group-extra.css` had been styling this rail as a two-column grid all
   along, and that one mark (`⌗`) renders as an empty box in the product's font.
3. **People & access is back in the drawn order** — register, roles, BU list.
4. **The strip's way through keeps its place** — 19px from the right edge at
   every width from 1920 to 1024, and the strip never exceeds 145px.

## 9 · The pages sit still (§120)

Five notes on the built product, settled from a measured mockup. Two were not
what they looked like: the rail's head and search **already** stick (they move
33px and pin), so the ask was about the pane's title; and the title's problem
was not its size but that it had no container.

- **Named once, in the rail's word.** The shell draws the page's name from the
  def's label, and a section heading repeating it is dropped — compared against
  the name, never by position, so a real first section keeps its heading.
  Fixes two duplicates and five pages that disagreed with the rail.
- **The name and the table head stay on screen**, pinned at the rail's own
  offset expression, with §53.7's ground filler over the strip above.
  `.peoplebox` and `.srctable` keep their own in-box sticky heads.
- **36px rows**, and the long label shortened to *Import & archives* rather
  than clipped: in a navigation list the label is the destination.
- **A hairline between table headings**, which at a narrow pane were merging
  into one word.

## 10 · Still open

Nothing from this makeover. The two candidates deliberately NOT built:
**data-search** (a typed person's name jumping to their register row) — a real
feature with its own decisions, and Islam chose keywords first; and **renaming
`Official BU list`**, which stays the client's own word (§58).
