# 016 · The Setup makeover

**Version:** v3.30 · **Decisions:** §101 · **Status:** answered; steps 1–2 built, step 3 open
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

## 7 · Still open

1. **The rail's search** — names plus hidden keywords ("logo" → Branding,
   "password" → People register). Typing must never repaint (§35, §45.5).
2. **Attention pills on the rail**, and the group badge changing meaning from
   entry-count to waiting-count. Last on purpose: a pill is only worth drawing
   once the count behind it is real, which is what §5 above just made true.
