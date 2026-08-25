# 015 · Talking to the Strategy Office

**Version:** v3.26, extended in v3.27 · **Decisions:** §97, §98 · **Status:** answered; built
**Constitution:** checked against v1.1.0.

Islam: *"Regarding any questions that the team might have or might need to
communicate with us as the Strategy Management Office, can we have some sort of
a chat but on the platform where on the bottom right they have this? Maybe that
they open the chat and they send a message there and they have a conversation
with one of our team, so we set up a back end in the Admin page where that
receives messages from different people — so it sounds like a chat, people
chatting, sending messages, and picks the people and replies to them."*

---

## 1 · What was already there, and what was not

**§71 built this once, and the box was never drawn.** *"Some sort of feedback
box in the bottom right of the page … and this feedback should land in the
admin page"* — the endpoint, two tables, the reply thread, the screenshot
handling, the access rules and a test script all shipped under the commit
*"Feedback: the server half (§71)"*. Nothing was ever built that a person could
press. Searching the built platform for the word finds three hits, all of them
the phrase *"feedback loop"* in unrelated comments.

So this is not a second feature beside that one. It is the missing half of it,
reshaped from a **form** into a **conversation** — which is the first decision
below, and the one every other decision follows from.

## 2 · The five decisions

Asked and answered before anything was drawn, then drawn as a mockup
(`design-mockups/office-chat/2026-08-25_talking-to-the-office.html`) and signed
off before any source was touched.

| # | Question | Answer |
|---|---|---|
| 1 | One box or two? | **One.** The chat absorbs §71's feedback rather than sitting beside it. |
| 2 | Who is being written to? | **The office.** Any member answers; the reply is signed by a name. |
| 3 | Does it leave the platform? | **Only when the person is away.** |
| 4 | Where does the office answer? | **Setup › Running the cycle › Messages.** |
| 5 | What is the unit of work? | **The person**, not the ticket. |

### 2.1 One conversation per person

`chat_threads.person_key` is the PRIMARY KEY, so *one person, one conversation*
is an invariant rather than a rule somebody checks — §44's *one figure, one
set*, the same shape.

**The moment a person has to decide whether what they are about to type is a
new item or the same one, it has stopped being a chat.** So they never decide
it. What is lost is §71's per-item status (*new / open / done / parked*): the
unit is the person now, and a conversation is only ever *waiting on us* or
*answered*. **Flagging** is what is left of the classification, it is the
office's, it is per-message, and it is deliberately weaker. Recorded here
because it is a real cost, not an oversight: if an issue tracker is wanted, it
is a different feature and it should not be smuggled in behind a chat bubble.

### 2.2 Waiting and answered move by themselves

`waiting` goes **true** when the person writes and **false** when the office
replies. Nobody sets it, because **a status you have to remember to set is the
status nobody sets** (§71). *Mark answered* exists for the conversation that
needs no reply, and it toggles back.

### 2.3 Where they were is captured, not typed

§71's rule, unchanged: the page, the subject, the cycle and the build are
things the screen already knows, and asking somebody to describe them is asking
them to do the computer's job.

**And it is read off the NAVIGATION, in the words it is wearing** — not from
`currentSub`, which is a key. The first build put *"the group › performance"* on
a message where the screen said *"Group › Performance"*. §93.12's rule (the
register speaks the navigation's language) applied one surface further out, and
the only way it cannot drift is to take the string from the navigation itself.
Two traps inside that: a tab's visually-hidden half is a **status** (*"— not
submitted yet"*) and not part of its name, and **the group and the companies
sit in a dropdown** whose `<summary>` carries the selection — asking only for
buttons leaves every group page with no destination and slides the tab's name
into first place (§94.6, the same trap that cost that section a wrong landing
page).

### 2.4 The build id comes out of `sw.js`

`BUILD_ID` is stamped by `build.py` from `sw.js`'s `SHELL` constant, which is
the one string this project already guarantees changes whenever the built
file's bytes do (§91). A version literal in a source is a version literal that
goes stale, and one that lies about which build somebody was looking at is
worse than none. The build refuses if it cannot find it.

### 2.5 Email, and the edge it has

**The reply is emailed only if the person is not on the platform**, and the
office is told which way it will go *before* pressing Send.

The presence test is the person's own polling: their panel stamps `here_at`
every time it asks for new messages, and 3 minutes is the window. It is stamped
on the **poll** and on nothing else — being present is about looking at the
screen, not about having typed — and the first build contradicted its own
comment by stamping it on a send as well.

**The edge is real and is not hidden.** There is no scheduler here — no cron in
`vercel.json` — so the decision is made at the moment of replying. Somebody who
was reading a page thirty seconds ago and then shut their laptop gets no email.
The mitigation is that the office can *see the call being made* on the line
above the reply box, which is why that line is there rather than the rule being
silent. A proper sweep needs a cron entry and is a later decision.

## 3 · Who may do what

| | |
|---|---|
| write | anybody signed in, into their own conversation and no other |
| read own | anybody — there is exactly one conversation that is theirs |
| read all | the **office**: `isOfficeRole()`, so Super user **and** SMO team (§89) |
| reply, flag, mark answered | the office |
| drop a conversation | the **Super user** alone — `mayDestroy`'s argument (§89) |

**It is a rule, not a matrix cell.** Reading what everybody in the tenant wrote
in confidence is not a thing to leave to a tick somebody could set on a bad
afternoon — §37 settled three cells that way and §89 three more. `c_chat` is
`area:"always"` with the office test done on the page def and again on the
server, which is the shape `c_send` already has.

**The office test is the SEAT role, and that is enough on the server.** `super`
and `smoteam` are both seat roles on `people.role`, returned by `getSession()`,
so `/api/chat` answers "is this the office" without reading thirty tables to
build a world. `isSuperRole()` / `isOfficeRole()` are in `lib/rules.js` and are
asked by both sides — never spelled out in the endpoint.

**The refusal never names the missing role.** Naming which of the two somebody
lacks tells an outsider the shape of the office.

## 4 · Where it lives, and why

Its own tables and its own endpoint, for §71's reason: **a save TRUNCATEs
thirty tables CASCADE**, and a message a save can erase is not a message. No
foreign key to `people` — a person removed from the register must not take the
conversation with them (§69.23 from the other end).

`019-feedback.sql`'s two tables are **dropped** by `022-office-chat.sql`. They
were never reachable by any human, so there is nothing in them to destroy, and
two unreachable tables behind an unreachable endpoint are exactly what the next
person reads as load-bearing (§24). `019` itself stays where it is: every
deployment in the world ran it, and a migration directory that disagrees with
`_sql_migrations` is its own confusion.

## 5 · Nothing here ever calls `paint()`

The rule the client file is built around. `paint()` rebuilds the entire panel —
it would throw away the half-typed message, the focus, the scroll position and
the attached file, four seconds after somebody started typing (§35, §71.2,
§30.1, §63). Every update writes into the node it is about and nothing else,
and **the composer sits outside the region that is rewritten**, so a message
arriving mid-sentence cannot touch what has been written.

Three things that fell out of building it:

- **The outcome sentence has to survive the refresh that reports it.** The
  first build wrote *"Sent, and emailed to…"* into the DOM and then reloaded
  the thread, which wiped it. It lives in `box.note` now — §63's rule, that the
  word must be written where the redraw cannot reach.
- **A flag refreshes the queue as well as the thread**, because *Flagged* is a
  filter over the same list and counts flags per conversation; refreshing one
  side leaves the other showing a count that was true a moment ago.
- **`post()` refuses when there is no server**, at the one place every request
  goes through. `mount()` already refused on `file://`, but the office's Setup
  page is drawn by `paint()` and runs its own clock — found by `qa.py`, which
  walks every Setup page over `file://` and reported a CORS failure nothing
  could catch. The page's `when` hides it there too (§16.7: a control that
  cannot work is worse than no control).

## 6 · Where the corner is not drawn

Three absences, and each is a state in which *no bubble* is the pass:

- **On a projector.** Done in CSS off the class `present.js` already sets, so
  there is no second piece of state to keep in step.
- **From `file://`**, where there is no server to carry a message.
- **For somebody the server turned away** — a control that answers every press
  with a refusal is worse than no control.

## 7 · What proves it

Three suites, because no one of them can see the whole thing:

| | what it can see |
|---|---|
| `src/checks/office-chat.py` | the CLIENT half, over HTTP against a stub — the corner, the capture, typing surviving the clock, and the three absences |
| `scripts/test-chat.js` | the SERVER half, against a real Postgres — every refusal, both sides of the presence rule, and the CASCADE |
| `qa.py` | that nothing else broke, and it is what found the `file://` fetch |

**§94.2's lesson is why the second one exists at all.** Driving the product as
the SMO proves the office's own path and proves *nothing* about the person who
may hold no role: a check that only looks for something PRESENT cannot see a
door that should be shut. So `test-chat.js` signs in as a second, ordinary
person and tries every one of the office's actions with their session.

**And both sides of the presence rule are asserted, one of them staged.** The
away case has to age the row deliberately — asserting only the *here* half
would leave the whole email rule untested by a check that can only see the
state it happens to be in.


---

## 8 · The switch, and what a poll cost (v3.27, §98)

Islam: *"I will need in the setup page to enable or disable the chat with some
settings maybe."* And, before it: *"how much can vercel handle as messages per
day or per time for free?"*

**MESSAGES ARE NOT THE UNIT.** A message costs one request; an open tab costs
900 an hour. One poll was **14 database round trips**, ten of them
`ensureReady()` re-running the schema and both migration phases *on every
request*. Memoised per process — **14 → 5** — plus no polling at all while the
tab is hidden, and an idle beat of 180s rather than 60s.

**Five settings**, in a dropdown on the Messages page header (§90's shape):

| | default | what it does |
|---|---|---|
| people can write | on | off removes the corner everywhere and stops all polling |
| checking for replies | Live | Live 4s / Relaxed 15s, with the cost stated in the row |
| what the panel promises | *Usually answers the same day* | the office's own words, shown under "Strategy Office" |
| screenshots | on | off refuses a picture and says so, rather than dropping it |
| email when away | on | off keeps every conversation inside the platform |

Stored in `GROUP.chat` → `org.extra`, so no migration. `SMPRules.chatCfg()` is
the one thing that decides what an absent key means, on both sides; a value put
back to its default deletes its key, and the last key leaving deletes
`GROUP.chat` (§50.6).

**The server refuses `say` and `reply` when it is off** — with the corner not
drawn, nothing in the product can reach them, which is exactly why they are
guarded. **Off never deletes a conversation** (§44) and **the Messages page
stays in the rail**, or the only way to turn it back on would be to turn it on
first (§61).

**The two real hosting limits are a licence and a database, not a quota:**
Vercel's Hobby plan is not licensed for commercial use, and Neon's free compute
never autosuspends while anything polls.
