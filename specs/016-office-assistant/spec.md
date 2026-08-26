# 016 · The assistant answers first

**Version:** not built · **Decisions:** §101 (provisional — a shared sequential
number, so it is claimed at merge time, not now) · **Status:** agreed in
outline, awaiting sign-off on this document.
**Constitution:** checked against v1.1.0.

Islam: *"Can we take this chat to another setting which is an AI bot option,
where I add an API key to the Vercel environment, and when the user asks the bot
something the AI can look up the knowledge base first to get an answer on how to
do things or if something exists or not. And if the answer is not there it
notifies the user that the SMO will answer directly. And at the start of chatting
the user is notified that the bot will try to answer him first. This might
require an arrangement for the knowledge base or require anything else."*

---

## 1 · The measurement that decides the design

The knowledge base was measured before anything was proposed:

| Source | Size |
|---|---|
| `pageinfo.js` — 26 page explainers | ~4,600 words |
| The Knowledge base page — 9 sections | ~2,500 words |
| **Together** | **~7,000 words ≈ 9,500 tokens** |

**The whole knowledge base fits in one prompt.** So there is no vector
database, no embeddings, no chunking, no retrieval step and no second store to
keep in step with the first — the expensive assumption these features usually
start from, removed by a measurement rather than by an opinion. It is one API
call with the knowledge base in the system prompt.

## 2 · The three questions, and their answers

| # | Question | Islam's answer |
|---|---|---|
| 1 | Who writes the task recipes? | **Claude writes them.** |
| 2 | Does the assistant answer everyone, or only some roles? | **Everyone.** |
| 3 | When it answers, does the office still see it in *Waiting*? | **No — it is answered.** *"We will wait for the complaint, or the user in the chat asking for the SMO to reply rather than the bot."* |

**Answer 3 carries a requirement the original ask did not.** *Asking for the
office* has to be a thing somebody can do **in words**, not only by pressing
something — so "I'd rather a person looked at this" is an intent the assistant
must recognise and hand over on, never one it tries to answer. §4.3 below.

## 3 · The property that makes this safe, and the line not to cross

The knowledge base is `c_kb` — **readable by everyone, always**, by rule rather
than by a matrix cell (§37, and §89 for the same shape). So an assistant that
answers **only** from it can never tell somebody something they were not
already entitled to read.

That single fact removes an entire half of the feature: **no per-person
authorisation anywhere in the assistant.** It cannot leak one unit's figures to
another unit's head, because it has never seen them.

**THE LINE IS READING THE STATE GRAPH.** The obvious next feature — *"what is
Mobile's score?"* — destroys the property outright: every answer would then need
authorising against the asker's roles, by a component that reasons in prose,
and §42's rule (the server authorises every save, and an unrecognised change is
the SMO's) has no equivalent for a sentence. **Not in this version, and the
settings page says so in words**, so the next person to look does not assume
otherwise.

## 4 · What the assistant does

### 4.1 The handoff is a decision, not a sentence

If the assistant writes *"I'm not sure, the office will get back to you"* as
prose, **nothing in the system knows the conversation is waiting.** It reads as
answered, and it drops out of the office's queue — the person is told somebody
is coming and nobody is.

So the model returns a structured output, and the platform reads the flag, not
the words:

```
{ answered: true | false,
  reply:    "…",              // shown only when answered
  source:   "kb:scoring"      // which section it came from, or null
}
```

- `answered: true` → written into the thread as a message; the thread is
  **answered**.
- `answered: false` → the handoff line is shown; the thread stays **waiting**.

**This is §97's existing invariant, untouched** — *waiting and answered move by
themselves; the status you must remember to set is the one nobody sets.* The
assistant simply becomes another thing that can move a thread. **No new state
machine, no new statuses, no second queue.**

### 4.2 A failure lands on today's product

Order is load-bearing:

1. Write the person's message. **Commit it.**
2. *Then* ask the model, with a hard timeout.
3. On any failure — no key, rate limit, timeout, malformed output — return with
   the thread **waiting**.

So a broken API key degrades to **exactly the chat as it works today**: the
message is saved, the office answers it. Nothing a person typed is ever lost to
the assistant failing. `maxDuration` is set explicitly in `vercel.json`
(`functions` is already there and carries no value today, so the default
applies).

### 4.3 Asking for a person

Two ways, one outcome:

- **In words.** *"Can someone from the office look at this?"* is classified
  `answered: false` with no attempt at an answer. It is an instruction, not a
  question.
- **On the control.** Every assistant answer carries a one-press **"This didn't
  answer it — send to the office"**, which moves the thread to waiting.

The button exists because **§4.1 covers the assistant KNOWING it cannot answer,
and the harder case is the assistant being WRONG** — confident, plausible and
incorrect. The original ask covers the first; nothing covered the second.

### 4.4 A handoff reaches a person, by email

Islam: *"An email should be sent to the office representative, which needs to be
set in the chat."*

**This follows from answer 3 and could not have been left out once that was
decided.** With the assistant marking threads answered, the office stops
watching the Waiting queue — so a handoff is now the exception, and an exception
nobody is told about is one nobody acts on. The very decision that makes the
feature worth having is what makes this necessary.

- **A named representative**, set in the chat's Settings dropdown, picked from
  people who are in the office. Stored in `GROUP.chat.rep` beside the rest
  (§98) — `org.extra`, **no migration**.
- **Sent at the moment of the handoff**, not batched. There is no scheduler on
  Vercel (§97.5 settled this once already), so the decision is made where the
  event happens or it is not made at all.
- **Reuses `lib/mailer.js`** — `api/chat.js` already calls it for the
  away-email, so this is the same call site, and the key still lives in exactly
  one place (§72, §97.5).

**NOBODY SET IS SAID, NEVER SILENTLY NOTHING.** With no representative chosen,
the settings row reads *"no one — handoffs wait in the queue"* rather than
looking configured and doing nothing. §35's rule: absent is not "none".

**AND THE SETTING IS NOT THE ASSISTANT'S — IT IS THE THREAD'S.** The event is
*a conversation is waiting on a person*, which happens whether or not the
assistant is on. Two readings, and the cost of each is stated rather than
glossed:

| The assistant is… | What the representative gets |
|---|---|
| **On** | Only the questions it could not answer — the exception, which is the point |
| **Off** | Every new question, because every one waits on a person |

Tying it to the assistant instead would mean **turning the assistant off
silently turns the emails off**, which is the shape of fault this file keeps
recording. So it is its own switch, and with the assistant off it is a mailing
list for the whole chat — correct for a low-volume product, and worth Islam
knowing before he turns it on.

### 4.5 An assistant answer must not look like the office's

This product spends a great deal of care on who is authorised to say what —
§31 closed a plan to the person measured against it, §94 closed the whole
strategy tab to the office. **An automated answer wearing the Strategy Office's
name is a governance problem, not a cosmetic one.**

So: a `bot` flag on the message (migration 024), drawn as its own kind — its
own mark, its own name, visibly not a person. *(Islam has referred to it as the
"SMO Bot"; the name is his to set. What this section fixes is that the MESSAGE
is distinguishable from a colleague's ruling, whatever the thing is called.)*

The office sees assistant answers in the thread like any other message, and
gets a **queue filter for them** — which is the only way anybody finds out it
is answering badly, given answer 3.

### 4.6 The greeting

The control already exists: §98's **promise** line on the panel. With the
assistant on it reads as two facts rather than one —

> *The assistant answers from the knowledge base first. Anything it can't
> answer goes to the office — usually the same day.*

— where the second half stays the office's own typed words. **Not a second
setting.**

## 5 · The knowledge base, which is the actual work

### 5.1 What is missing is not organisation

The knowledge base explains **how things work**. It barely explains **how to do
things**: across 693 lines of `pageinfo.js` there are **four** mentions of
pressing anything.

But *"how do I submit my report"*, *"where do I add a project"*, *"can I still
report now the cycle is locked"* is what somebody types into a bubble in the
corner. **As it stands the assistant would decline most real questions and look
broken** — and it would be right to decline, which is the point: the fault
would be the corpus, not the model.

**The build is a day; the recipes are the project.** They are worth having on
the Knowledge base page for people to read whether or not this ships.

### 5.2 The recipes

Roughly forty, grouped as the platform is. Each is one question, one short
answer, and — where the answer is *"you can't, and here is who can"* — the
person to ask. That last kind is not a gap in the product; it is §31 and §94
being explained to the person who just hit them.

**Reporting**
1. How do I report a figure?
2. Save draft and Submit — what is the difference?
3. Can I still report once the cycle is locked?
4. Why is a figure someone else's to enter? *(figure sets, §44)*
5. Why does my score show a dash instead of 0?
6. How do I add a note to a figure, and who reads it?
7. I submitted by mistake — what now?
8. What does the dot on Performance mean?

**My plan**
9. There is a typo in my plan — how is it corrected? *(the office's, §94)*
10. How do I add a pillar, a measure or a tactic?
11. Why can't I reorder my pillars any more? *(§94.15)*
12. Who may edit my unit's plan, and why not me?
13. How does a plan arrive in the first place? *(import authors, §22)*
14. What happens to the old plan when a new one is uploaded? *(archives)*
15. What is a collaborator on a tactic, and what does it let them do?

**Scores**
16. How is my unit's headline number calculated?
17. Why does a pillar disagree with my objectives?
18. What is execution, and why is 100% not "finished"?
19. What do the colours mean?
20. What is a focus measure and the reward line?
21. How does the group's number relate to mine? *(weighting)*

**Capabilities and projects**
22. How do I add a project to a capability?
23. Deliverable or outcome — which is this?
24. How is a project's performance worked out? *(§99)*
25. Due date and measure date — what is the difference?

**Getting in, and getting at things**
26. How do I sign in — my email or my name?
27. I have forgotten my password.
28. Why can't I open another business unit?
29. What does my role let me do?
30. How do I get access to something I cannot open?

**The office's own work**
31. How do I add somebody to the register?
32. How do I upload the people file, and what does it change?
33. How do I open a new reporting cycle?
34. How do I run a review, or present one?
35. How do I put a picture into the review deck? *(§50)*
36. How do I set the tenant's colours and mark?
37. What does Demo data do, and why can't I save in it? *(§67)*

**The platform itself**
38. Does it work with no internet?
39. Can I install it like an app?
40. Where does my data actually live?

### 5.3 Generated, never a second copy

`scripts/extract-kb.js` → `db/kb.json`, read by `api/chat.js` — the same shape
`scripts/extract-state.js` already uses for the seed. **Edit the knowledge base
and the assistant's answers change in the same commit.** A hand-maintained
second copy of the product's own explanations is the fault `lib/rules.js` exists
to prevent (§42), one surface further out.

The tenant's **labels** ride alongside as a short block, because `renderKB`
already calls `L("pillar","bu")` and a tenant that calls a pillar something else
must not be answered in Raya's vocabulary (§65).

### 5.4 Citing where it came from

Each extracted section keeps a **stable id and title**, and an answer names it —
*"Knowledge base › Scoring"*. Two reasons, and the second is the one that
matters: the person can go and read the whole thing, and **a wrong answer is
traceable to the paragraph that produced it.**

## 6 · Settings

Added to the existing **Settings dropdown on the Messages page** (§90's shape,
§98's row — never a second Setup page, §32):

| Control | Default |
|---|---|
| Assistant answers first | **Off** |
| Tell someone when a question needs a person | **Off** |
| — who | **nobody set** (the row says so, §4.4) |
| *(shown, not settable)* What it can see: the knowledge base only | — |

Stored in `GROUP.chat` beside the rest (§98) — `org.extra`, **no migration**,
and a value put back to its default deletes its key (§50.6).

**THE SERVER REFUSES, WHICH IS THE HALF NOT ON SCREEN.** With the assistant off,
`say` never calls the model — guarded on the server, because a switch that only
hides a control is decoration (§42, §44, §98.2).

**The key is an environment variable** (`ANTHROPIC_API_KEY`), read in exactly
one place — `lib/assistant.js` — the same rule `lib/mailer.js` follows for
Resend (§72, §97.5). Never a setting, never pasted into chat.

## 7 · Model, and what it costs

`claude-opus-5`, adaptive thinking, `effort: "low"` — the task is recall from a
supplied corpus, not reasoning — with the knowledge base under a cache
breakpoint.

| | |
|---|---|
| Per question, sparse traffic (cold cache) | **~$0.06** |
| Per question inside a burst (cached prefix) | ~$0.014 |
| 500 questions a month | **~$30** |

Chat traffic is bursty and sparse, so **the cold number is the planning
number**; caching is enabled because it costs nothing and helps a person asking
follow-ups. Haiku 4.5 is about a fifth of the price and is the lever if this
ever matters — started on Opus 5 deliberately, because **the hard part here is
declining confidently**, not composing prose.

## 8 · What proves it

An assistant's wording is not deterministic, so **nothing asserts what it
says**. What is asserted is the contract (§94.8: write the check against the
problem, not the phrasing):

`scripts/test-assistant.js`, against a real Postgres and a stubbed model:

1. With the setting **off**, `say` never reaches the model — asserted from the
   stub's call count, not from the screen.
2. `answered: true` writes a message **and** leaves the thread not waiting.
3. `answered: false` writes **no** message and leaves the thread **waiting**.
4. A model failure (throw, timeout, malformed JSON, missing key) leaves the
   person's message stored and the thread waiting — **four separate faults, each
   injected**, because they fail at different points.
5. A request for a person, in words, is handed over rather than answered.
6. An answer containing `<script>` arrives escaped.
7. A bot message carries the `bot` flag and never the office's name.
8. A handoff emails the representative; an answered question does **not**.
9. With no representative set, nothing is sent and nothing throws.
10. A mail failure never costs the handoff — the thread is waiting either way.

`src/checks/office-chat.py` gains: the panel's greeting says the assistant tries
first; an assistant answer is drawn as its own kind; and its "send to the
office" control is **pressable, not merely present** (§70, §93.4).

## 9 · Open, and deliberately not decided here

- **The recipes are the deliverable to review.** §5.2 is a list of titles;
  what needs Islam's eye is a handful written out, to settle the voice.
- **What happens on the second unanswered question in a row** — nothing
  special is proposed. If it turns out people ping-pong with the assistant, an
  automatic handoff after two declines is the obvious answer, and it is not
  worth building before it is seen.
- **Reading the state graph is refused** (§3), not deferred with a plan.
