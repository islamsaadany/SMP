# 044 — The consulting memory

**Status:** signed off and **BUILT 2026-09-11, all three phases**, on
`claude/blissful-brown-fxlait`. Not merged — `main` is Islam's word, on that
merge (rule 4).
**Asked for by Islam, 2026-09-11.** Five of its decisions are already his
(below), including the two settled the same day on who reads and who is named,
and the correction that made the **period debrief** the main way in rather than
the one-at-a-time form.
**Mockup:** `design-mockups/consulting-memory/2026-09-11_consulting-memory.html`
— six states, drawn in the platform's own tokens.

## The question

Islam: *"We need to have somewhere a consulting memory where the consultants
put all their good practices and lessons learned and hickups they faced with
the client to have a memory of what happened and we can get back later … and
eventually we will need a helpful bot to ask about previous experience or a
problem we are facing to get previous actions that happened and what we
learned from."*

## It is three things, and the last two depend on the first

1. **The record** — an entry, written down, naming its client and its author.
2. **The way in** — a short wizard, which can be answered on the page or taken
   as a prompt to whatever voice assistant the consultant already uses.
3. **The way out** — an assistant that answers *"we have hit this before, what
   happened?"* from those entries.

**Built in that order.** An assistant over an empty memory is worse than no
assistant: it answers confidently from nothing, which is §125's fault with the
sign reversed — there, silence read as an answer; here, an answer would stand in
for a memory nobody has written yet.

## Where it lives, and why it cannot live anywhere else

Specs 042 and 043 spent two weeks making sure **one client's data can never
reach another client** — a schema each, the tenant set per request inside the
transaction, the app connecting as a non-owner role with `FORCE ROW LEVEL
SECURITY`. A consulting memory is deliberately the opposite: a lesson from Raya
Trade is worth having **because** it helps on RHI.

So it is **not a tenant table and never can be**. It lives in the **platform
schema**, beside `clients`, `accounts` and `client_log` — the one layer that
already spans clients — and it is served on **Forefront's own side of the door**
(`/platform`), never inside a client's shell.

**A lesson is never drawn on a client's own pages.** A client's staff open that
product; what Forefront learned about them is not theirs to read. The client's
**card** on Forefront's side may carry a count and a way in; the client's
platform carries nothing.

## What an entry holds

| | |
| --- | --- |
| **client** | required — Islam's decision, below |
| **kind** | one word: *practice* · *hiccup* · *lesson* |
| **title** | one line (§260: one line, and the box says so) |
| **body** | prose — what happened, what we did, what came of it, what the next person should know |
| **when** | optional — the period it is about, filled in by the debrief and typed by nobody |
| **author** | the account that wrote it |
| **written / updated** | timestamps |

**`when` and `written` are two different facts** and the entry carries both: one
is when the thing happened, the other is when somebody got round to writing it
down, and on a period debrief they are weeks apart. Absent is absent — an entry
with no period says nothing rather than borrowing its write-up date (§35).

**Prose, not twenty fields.** Twenty fields is what nobody fills in after an
engagement, and prose is what both a person and the assistant read. The
structure lives in the *questions*, not in the columns.

**The industry is NOT a field on the entry.** Every client card already carries
one (`clients.industry`, collected today and read by nothing but the card), so
an entry inherits its client's industry and there is exactly one answer to
*what kind of business was this* (§53.5). Two copies would drift the first time
a client is re-classified.

**The kind is one column holding the word** (§104.7, and `clients.kind`'s own
comment), used for filtering and for nothing else — never a different shape of
form per kind, which is §104's own ruling about a deliverable and §300's about
a Y/N row.

## Decisions taken by Islam, with their costs

1. **Every consultant reads every lesson.** *"Everyone can read the lesson of
   course."* **Cost, stated and accepted:** a lesson naming Raya's numbers is
   readable by a consultant who has never worked on Raya. That is the feature
   working, and it is why the whole thing sits behind Forefront's door and not
   inside a client's.
2. **A lesson names its client, always.** *"The relevance of the input is
   relevant to this specific client with its own dynamics."* This **overrules**
   my own recommendation that a client-less lesson (*"what we have learned about
   family-owned distributors"*) should be allowed. **Cost:** none that matters,
   because the generalisation arrives anyway — through the client's industry,
   which is what makes *"show me the hiccups on distribution clients"* a
   question the memory can answer without a second kind of entry.
3. **The entry names its author, so the reader knows who to go and ask.**
   Islam, asked which of two readings he meant: *"the entry is for the team and
   identified by who added this lesson or insight."* The most valuable thing in
   a consulting memory is not the write-up, it is the person it points at — a
   reader who cannot tell who wrote it has a document, not a memory.
4. **Nothing records who READ an entry**, and that is a decision rather than an
   omission. A readership log was offered with the same sentence and refused:
   *"the Consulting team can read the insights and search it."* Reading is the
   team's, freely, and a memory that watches who opens it is a memory people
   stop opening. **No open count, no named log, no `client_log` row.** Written
   down so a later reader does not take it for something that was forgotten
   (§35: an absence is only trustworthy when somebody said it).
5. **A period is the usual unit, not a single event.** *"It will not be case by
   case usually, it would be a period of time to share."* The debrief takes the
   loud button and the one-at-a-time form stands beside it quietly. **Cost:**
   two doors onto one store, which is two things to keep in step — paid
   deliberately, because the four questions and everything downstream are
   shared and only the harvesting differs.

## The way in — two doors, and the second is the usual one

The four questions are the after-action shape and they are the same on both
doors:

1. What happened?
2. What did we do?
3. What came of it?
4. What should the next person know?

### Add one insight — for the day it happens

One page of those four questions, and two ways to finish it: type the answers
in, **or press *Copy the prompt*** — the same four questions with the client's
name and industry already in them — take it to whatever assistant they use,
speak the answer, paste the result back.

**A title and a client are enough to save.** Everything else may be empty and
filled in later. This is the one rule that decides whether the memory survives:
the standard failure of a consulting memory is that it is written at the end of
an engagement, which means never — so it has to be possible to drop one line on
the day the hiccup happens, and finish it on the plane.

### Write up a period — for the month you have just had

**This is the main door, and it is Islam's correction of the first drawing**
(2026-09-11): *"we need a starting add insight prompt for voice chat to capture
all the lessons in general for a case or a client … it will not be case by case
usually it would be a period of time to share."* He is right, and it changes
which button is loud: a consultant comes back from a period with six things in
their head, not one.

**One conversation, several insights.** Pick the client and the period; the
platform writes a prompt with both in it; the consultant talks it through with
an assistant and pastes the whole answer back **in one box**. The platform
splits it into drafts.

**The prompt interviews rather than collects** — that is the whole of why it is
worth writing rather than leaving people to ask their own:

- **one question at a time, waiting for the answer**, or the assistant asks five
  things at once and gets five half-answers;
- it draws out **what went better than expected · what cost us time · what I
  know now that I did not at the start · what I would warn the next consultant
  about**, which is where several insights come from where one question gets
  one;
- **it pushes back on a vague answer** and does not move on until the answer
  would make sense to somebody who was not there;
- it writes every item back in **one fixed block** — `KIND · TITLE · WHEN` and
  the four answers, between `===` rules, and nothing else — which is what makes
  a paste splittable.

**Storing the conversation whole was considered and refused.** One long entry
per period loses the kind, the search and the filter — most of what the memory
is for — and buries five insights inside a sixth.

**The prompt forbids invention, and the review screen exists because that
cannot be enforced.** It ends *"use my words, not yours; if I only half answered
something, leave that line out rather than filling it in"* — and the platform
**cannot tell a paragraph somebody said from one a model completed**. So a
paste never lands in the list: it lands as **drafts somebody reads**, each
editable, each droppable, saved together. The cost is that a debrief is never
one press, and it is worth it — several write-ups about real client situations,
drafted from a conversation, going straight into a memory the whole firm reads
is the one thing worth a step in front of.

**A block that could not be read is shown, never dropped** (§184): it comes back
in the warning ground with its text intact and a title to give it. The count
says **three read, and one it could not** rather than four found (§108.1: the
count and the rows are one list).

**SMP still has no audio and needs none** — verified: no `MediaRecorder`, no
`getUserMedia`, no `SpeechRecognition` anywhere in the product. Every consultant
already carries a device that dictates, and the platform's part is the prompt
and the paste.

**The period rides onto every insight it produced** (`when`) — one optional
line, filled in by the debrief and typed by nobody, which answers the question a
reader has about an old entry: *was this during the plan build, or during
reporting?*

## The way out

The assistant already exists and is not rebuilt: `lib/assistant.cjs` takes a
corpus, answers, declines rather than invents, hands over to a person (§104),
and records what was asked (§299). This points it at a second corpus, with
**two rules of its own**:

- **Every answer names its sources** — which entry, which client, who wrote it.
  An answer with no source is worse than no answer here, because the errand is
  *go and ask that person*, and the KB assistant's sources (a manual everybody
  can already read) do not carry that weight.
- **It answers only from what the asker may read.** Today that is everything
  (decision 1), so this filters nothing — and it is written down anyway, or a
  later narrowing would have nowhere to be enforced (§42: the rule, not the
  screen, decides).

## The name

**Memory** — Islam's own word, and it collides with nothing: *Knowledge base* is
the product's manual (§160: it describes the platform, never a tenant), *History*
is the tenant's change log (§262), *Notes* is a field on a client's card and a
reporter's explanation. Two things called a knowledge base — one answering about
the product and one about the engagements — is §87's twins at the worst possible
scale.

It is a **fourth tab** beside Clients · Consultants · Who sees what, and the
**first one with no gate on it**: every signed-in consultant, by decision 1.

## What this depends on, and did not ask for

**`clients.industry` is free text.** Two consultants typing *Retail* and
*retail & distribution* produce two industries, and *"show me the distribution
clients"* then answers half. It costs nothing to fix now and is expensive in a
year. The house answer exists: a picker over a list the platform holds, with
**anything already stored kept as typed** (§199.4's fixed list, §130.1's
out-of-list value). **Flagged rather than done — it touches the client card,
which was not part of the ask** (rule 1b).

## Verification

- `checks/memory-page.mjs` — the tab drawn for every consultant and gated for
  nobody; an entry written and read back **through the platform API**; the
  client required and the refusal saying so; a title-only entry saved and
  reopened; **the author's name drawn on the entry** (decision 3, and the
  reason anybody can act on what they read). Red first.
- `checks/memory-debrief.mjs` — **the split, which is the one piece with a
  wrong answer available to it.** A paste of four blocks becomes four drafts
  with their kinds and titles read off them; **nothing is saved until the drafts
  are saved** (the table counted after the paste and asserted empty, §94.2); a
  block in the wrong shape comes back **with its text intact** and is saveable;
  a paste of pure prose produces **one draft holding all of it and never
  nought**, because losing what somebody dictated is the only unacceptable
  outcome. Red first, and falsified by feeding it a paste the splitter mangles
  rather than by feeding it a clean one.
- **Decision 4 is asserted as an absence, at both ends**: opening an entry
  writes **no row anywhere** — the table counted before and after, because
  *nothing was logged* and *nothing reached the page* look identical from
  outside (§113.8) — while a write of the entry itself is asserted to land in
  the same run, or a build that stored nothing at all would pass it.
- `checks/memory-boundary.mjs` — **the assertion the whole spec rests on**: a
  client's own shell draws no entry anywhere, and the memory's tables are
  refused to the tenant role. Both ends (§94.2), or a build that dropped the
  feature entirely would pass the absence half.
- `scripts/test-platform-rules.js` — who may write, who may edit somebody
  else's entry, who may delete. Falsified in both directions.
- The assistant half re-uses `scripts/test-ask.js`'s shape: a stand-in for the
  model (§100.3), sources asserted present, and a question the corpus does not
  cover asserted to **decline** rather than answer.

## Recorded, not done

- **`when` is free text, not a named engagement.** *"1 August to 11 September"*
  is what the debrief knows; a client Forefront runs two distinct engagements
  for is told apart by its periods today, and giving an engagement a name of its
  own is a second decision.
- **The debrief does not remember where it got to.** Talk it through, paste, and
  the drafts are in front of you; close the tab in between and the conversation
  is in the assistant, not here. Holding a half-finished debrief would mean
  storing what somebody said before they have read it, which is the one thing
  the review screen exists to prevent.
- **No attachments.** A screenshot of the slide that caused the row is exactly
  what somebody will want; the store exists (§261's blob endpoint) and it is a
  second decision.
- **No editing of somebody else's entry** in the first build — only its author
  and a platform admin. A memory that anybody can rewrite is a memory nobody
  trusts; who may correct a colleague's write-up is worth asking rather than
  assuming.
- **Nothing is imported.** Every engagement before today is in somebody's head
  and in old decks, and backfilling it is a decision about effort, not code.

## Open — to settle on the mockup, not here

**What one of these is called.** Islam writes *"this lesson or insight"*, and
uses *good practices*, *lessons learned* and *hiccups* for the three kinds. The
spec calls the row an **entry** and the kinds *practice · hiccup · lesson*,
which is placeholder wording: what the tab, the button and the empty state
actually say is settled when the words are on a screen and can be read in place
(§124, §266 — a wording question is answered by drawing it, not by listing the
candidates in prose).
