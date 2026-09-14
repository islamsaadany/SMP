# 049 · Resources — the client's library, published by Forefront

**Status:** clarified 2026-09-13, not yet planned. The frame, the access model
and who publishes are settled below; what the module actually holds waits on a
reading of the SMS repository (§2).

**Not spec 052.** That one is Forefront's own strategy frameworks library,
which lives outside every client and is nobody's module. The two share only
the word *library*.

Read with **spec 046 (Modules)**, whose §4.2 contract is the test this passes,
whose §4.4 already decides access per module, and whose §4.8 describes the
library machine this is an instance of.

---

## 1 · What is asked

Islam, 2026-09-13: *"we need to check the sms repo and get the resources module.
and let's align how should it be copied to our repo here and how shall we manage
the access.. andwork on the spec kit .. by clarifying first"*

Three questions, in that order: what is it, how does it come across, and who may
open it. All three are answered here. Only the first is answered incompletely,
and §2 says why.

---

## 2 · What could not be read, and why it does not block this

`aleymahmoud-ff/strategy-management-system` exists and is reachable to Islam's
account. **It cannot be attached to this session**: the tool refuses to add a
repository owned by somebody else to a session that already holds
`islamsaadany`'s. That is a limit of how the session was started and **not a
GitHub permission**, so no amount of retrying inside it helps.

So the reading happens in a session of its own (Islam's answer to question 4)
and comes back as a written description. **Most of this spec does not wait on
it** — the module frame, the access model and the publishing side are decided
from what SMP already is. What waits is §6: the item's own fields, its
categories, and the screens.

*Recorded rather than worked around: the alternative was forking SMS under
`islamsaadany`, which would let a later session read it directly. Not taken, as
a fork of somebody else's repository is a thing to keep in step afterwards.*

---

## 3 · The decisions

Put to Islam as four questions on 2026-09-13, before anything was written.

| # | Question | Answer |
|---|---|---|
| 1 | What is Resources? | **A library.** A catalogue of items with a name, a category, a date and something to open — the machine spec 046 §4.8 already describes. Not a new shape. |
| 2 | Their code, or their model? | **Rebuilt here, SMS as the reference.** SMS is a separate codebase; carrying its files in would be a second answer to the address, the switcher, Setup and access, which this platform already answers once (§53.5). |
| 3 | Who publishes? | **Forefront publishes, the client reads.** Upload and categorise from the client's card in `/platform`; inside the client's platform it is search, open and download and nothing else. |
| 4 | How is SMS read? | **A session of its own**, reporting back (§2). |

**It is alongside Insights, not instead of it** — question 2's third option
(*Resources is what we called Insights*) was offered and not taken.

### 3.1 And it reorders spec 046's own build order

046 §5 puts the two libraries **second and third**, with a stated reason: they
*"prove the module frame at small cost before the expensive module is built into
it."* That reason holds and the ordering changes, because there is now working
code to read for a library and none for the other two. **Resources becomes the
first instance of that machine**; Insights and Processes follow it nearly free.

That saving exists **only if it is built as an instance and not as its own
thing.** Built once and named three times, the second and third cost a row in a
list. Built separately, we pay three times and they drift.

---

## 4 · It passes the contract, and the five parts are the build

Spec 046 §4.2: a module must bring all five, or it is a page inside a module
rather than a module. 046 §8 left *a fifth module* open with exactly this as the
test. Resources brings them:

1. **Its own navigation** — the second row is its categories (046 §4.6: *"a
   library's are its categories"*).
2. **Its own roles and areas** — its own tab on Roles & access (§5).
3. **Its own Setup group** — the rail gains one group when the client has it,
   and loses it when they do not (046 §4.5).
4. **Its own rhythm, or none** — **none.** Versions and no clock (046 §4.7). It
   may not borrow Strategy's cycle.
5. **A landing** — the catalogue itself.

---

## 5 · Access, which is already decided

Nothing here is new; it is 046 §4.4 applied. Written down so it is not
re-decided.

- **The word is `resources`**, reserved in `MODULES` and `MODULE_DEF` with
  `built: false` until there is something behind it. A reserved-and-unbuilt word
  is offered to nobody and still claims its address, so a business unit keyed
  `resources` cannot take it later (`lib/modules.ts`).
- **A client HAS it** by Forefront switching it on from the client's card. One
  row in the registry, one press.
- **A person REACHES it** by holding a role in it. **There is no per-person
  module tick** — no role, no module in the switcher. Two levels, and neither is
  a list somebody keeps by hand.
- **Read-only in the client app, refused on the server** and not only on the
  screen (046 §4.8; constitution X). A screen that hides a control has decided
  nothing.
- **Whole-module visibility for now.** If you can open it you can see all of it.
  046 §8 keeps per-category for the day a report must not reach unit staff.
- **Its roles are not named yet** — that waits on the screens (§6). What is
  already certain is the *shape*: whatever they are, they live in this module's
  own tab and none of them is a Strategy role.

---

## 6 · What it stores — open, and what is already known

Waits on the reading (§2). What 046 §4.8 already commits to, and what any answer
must fit:

- an item has **a name, a category, a published date, a version, and something
  to open**;
- the item **keeps room for an owner and a next-review date and draws neither**.

The reading has to settle: the real fields, whether categories nest, how a file
is stored and served, what retiring an item does, and whether an item can point
at a unit or a function or belongs to the client whole.

---

## 7 · What the reading session is asked

So the description that comes back is usable rather than a tour:

1. **What is an item?** Every field it stores, and which are required.
2. **Categories** — a flat list or a tree? Who creates them?
3. **The file** — what kinds, how big, where are the bytes kept, and how does a
   reader open one?
4. **Versions** — does an item keep its history, or does a new version replace
   the old one?
5. **Retiring** — can an item be taken down, and what does a reader see then?
6. **The screens** — what does a reader actually see: a list, a search, a filter,
   a detail page? Roughly what is on each.
7. **The publishing side** — what does whoever uploads see and do?
8. **Who may do what** — every rule it enforces about who reads and who writes.
9. **What it depends on** — database, storage service, libraries. This decides
   how much of it can cross at all.
10. **What is half-built** — anything drawn and not wired, so it is not copied as
    though it worked.

---

## 8 · Recorded, not decided here

- **Three names for one machine.** Resources, Insights and Processes would be
  three instances of one catalogue. That is cheap to build and may be one word
  too many for a client to read. Worth one question once the screens are seen.
- **Per-category visibility** — 046 §8, unchanged.
- **Whether the reading is worth a fork.** §2 took the cheaper route; if SMS
  turns out to hold more than one module worth having, a fork under
  `islamsaadany` becomes the better answer.
- **Owners and review dates** — room kept, nothing drawn (046 §8).

---

## 9 · What must be proved

Beyond 046 §6, which already covers the module frame:

- A client **without** Resources cannot reach its address, and is landed exactly
  as any other word the client does not hold — never a refusal of its own.
- A person holding **no** role in it does not see it in the switcher, and the
  server refuses the request as well as the screen not drawing it.
- **Every write from the client app is refused on the server**, driven rather
  than read.
- Switching the module **off takes nothing with it** (§44) — switched on again,
  every item is there.
- The catalogue is **one machine**: what is asserted is that the instances
  **agree**, never what a particular one shows (§53.5, §94.8).
