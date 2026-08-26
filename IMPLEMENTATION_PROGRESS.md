# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** v3.45 on `main` — §114.4 (the remove button's seat) merged
**Last updated:** 2026-08-26

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

- **`checks/no-jump.py` — "sorting a column" (1 JUMPED).** Real defect,
  diagnosed 2026-08-26 (§109.5): with a register row open for editing, sorting
  collapses the page 1457px → 913px (the open row keeps its class, loses its
  height) and the scroll clamps up. Pre-dates the §109 merge; needs its own
  fix in the register's sort, not a merge-widening patch. Until then this red
  is a true signal — do not silence it.

## Built and verified

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
