# 044 — The consulting memory

**Status:** written 2026-09-11, awaiting Islam's sign-off. Nothing built.
**Asked for by Islam, 2026-09-11.** Two of its decisions are already his (below).

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
| **author** | the account that wrote it |
| **written / updated** | timestamps |

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
3. **The entry names its author, so the reader knows who to go and ask.** The
   most valuable thing in a consulting memory is not the write-up, it is the
   person it points at. (See *Open* below — I am not certain this is all he
   meant by that sentence.)

## The way in

**One page of questions, and two ways to finish it.** The questions are the
after-action shape and there are four:

1. What happened?
2. What did we do?
3. What came of it?
4. What should the next person know?

At the foot: type the answers in, **or press *Copy the prompt*** — the same four
questions with the client's name and industry already in them — paste it into
whatever assistant they use, speak the answer, and paste the result back into
one box. **This is Islam's own proposal and it is the right one**: SMP has no
audio anywhere in it (verified — no `MediaRecorder`, no `getUserMedia`, no
`SpeechRecognition`), and it needs none, because every consultant already
carries a device that dictates.

**A title and a client are enough to save.** Everything else may be empty and
filled in later. This is the one rule that decides whether the memory survives:
the standard failure of a consulting memory is that it is written at the end of
an engagement, which means never — so it has to be possible to drop one line on
the day the hiccup happens, and finish it on the plane.

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
  reopened. Red first.
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

- **No phase-of-engagement field.** *When* in an engagement something happened
  is real and is one more thing to fill in; it can be said in the prose until
  somebody misses it.
- **No attachments.** A screenshot of the slide that caused the row is exactly
  what somebody will want; the store exists (§261's blob endpoint) and it is a
  second decision.
- **No editing of somebody else's entry** in the first build — only its author
  and a platform admin. A memory that anybody can rewrite is a memory nobody
  trusts; who may correct a colleague's write-up is worth asking rather than
  assuming.
- **Nothing is imported.** Every engagement before today is in somebody's head
  and in old decks, and backfilling it is a decision about effort, not code.

## Open — one question for Islam

*"Everyone can read the lesson of course, but we can identify who read what to
find."* I can read that two ways and they are different features:

- **(a) the entry names its author**, so a reader knows **who to find** and go
  and ask. This is in the spec as decision 3 — it is needed either way.
- **(b) the platform records who OPENED which entry.** `client_log` already
  logs opens, so it is cheap. **A count on the entry** — *read by 7 people* —
  is genuinely useful and names nobody: it tells you which lessons are worth
  writing. **A named readership log** is a different decision with a
  surveillance flavour, and it is yours to take rather than mine to assume.

Which of those did you mean? And I could not parse *"I'm very very input"* —
if it carries a decision, it has not been recorded here.
