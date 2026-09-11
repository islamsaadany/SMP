# Spec 044 — Four modules on one spine

**Status:** decisions taken in session 2026-09-11 (Islam, question by question,
two rounds) and **recorded as §318** in the decisions document the same day.
**Nothing is built and nothing is drawn** — the chrome carrying the module
switch wants a mockup before a line of it is written (rule 1c).

**Depends on:** spec 042 / §313 (one door, many clients) and spec 043 / §314
(the shared-schema rebuild). This work lands **after** the cutover, with one
exception — §7, which is cheap now and expensive later, and is Islam's call on
that change.

**Reverses:** nothing. It generalises by one level three things already built:
§46 (Setup is a place with a rail), §37 and §117 (the access matrix), and §313
(the client registry).

---

## 1 · What this is

SMP today is one product — a client's strategy, its plans, its reviews — served
to many clients. Islam:

> for each client we will need to have mutliple modules one for the Strategy &
> Functions ... and one for the project management and one for the resources and
> one for the process and we are open for more modules.

Four modules, each **a separate world** with its own navigation, its own roles
and its own rhythm, standing on one shared **spine** that belongs to the client
and to no module:

**Strategy · Portfolio · Insights · Processes**

The spine is not a new idea; it is a line the product already draws and has
never named. The Setup rail's *People & access* and *The organisation* groups
are not Strategy's — they are the client's. *Running the cycle*, *Measurement*
and everything the plan and the deck read are Strategy's and nothing else's.
This spec names that line and builds on it.

---

## 2 · The decisions, and why

Every one was put to Islam on 2026-09-11 and answered. Quoted verbatim where
the words decide something.

| # | Decision | Islam's answer, and what it settles |
|---|---|---|
| 1 | What a module is | **A separate world.** *"No, it's a different world with navigation separate ... It's a separate module with own accessibility and its own details."* Not a tab on a unit, not a section of Setup: its own navigation, its own roles, its own rhythm. |
| 2 | The name for "Strategy & Functions" | **Strategy.** A supporting function is a *place in the org*, like a business unit — every module will address it. The module is the plan, its measures and its reviews. Recommended and not objected to. |
| 3 | The name for the project management module | **Portfolio.** `Projects` already names a capability's projects inside Strategy, and two lists one word apart is §87's twins. Renaming Strategy's was offered with its cost (every screen, the workbook, the deck, stored data) and not taken. |
| 4 | The name for the research module | **Insights.** Standing beside a project management module, `Resources` reads as *people and capacity* — the one thing it is not. Covers research, analytics and market reports in one word and collides with nothing. |
| 5 | What the client does in Portfolio | *"they update progress and add notes."* The plans themselves are *"very very detailed and complex"* — breakdowns, timelines. |
| 6 | Portfolio's projects against Strategy's | **Different things.** *"PM project is more of a detailed project with breakdowns and timelines very very detailed and complex thing not like the Strategy project with Strategy project is a simple one with some milestones and timelines."* Two separate lists; **no pointer between them** (§8). |
| 7 | What Insights holds | *"researches and the analytics and Market reports relevant to the client so it's a client document documents and researches."* **The client's own material, per client.** Not a bank shared across clients — which removes the one part of this design that would have reached into the isolation being built right now. |
| 8 | What Processes holds | **The client's own processes, documented by Forefront** — *"a bank of processes that they can search and look up how things go."* Per client, same shape as Insights, isolation absolute. |
| 9 | Who publishes to Insights and Processes | **Forefront only.** The client searches, opens and downloads. No authoring surface in the client app at all. |
| 10 | Whether Processes grows teeth | **A bank, for now.** The stored item keeps room for an owner and a next-review date and **draws neither**, so growing teeth later is an addition rather than a rebuild. |
| 11 | Roles | **Per module.** *"No, not the same roles. The roles are different in each module maybe some modules with adapt but yes, they might be separated for each module."* |
| 12 | Rhythm | **Per module.** *"they don't have the same cycle the reporting as an example it's happens in the any time the process is a continuous work and the project management is maybe a weekly or a monthly checkpoints."* |
| 13 | Two modules at once | **Never on screen together.** *"it's good to be able to navigate between the modules, but no, I don't think they need to screen at the same time."* |
| 14 | The administrator | **Client-wide Super user, plus a per-module admin.** Lets a module be handed to its own owner without handing over the client. |
| 15 | Visibility inside a library | **Whole module, for now.** If you can open Insights you can see everything in it; who may open it is the role. |

### 2.1 The finding underneath the answers

The four are **not four of a kind**, and saying so is most of what this spec
saves. Strategy and Portfolio are planning-and-reporting worlds: objects,
owners, a rhythm, figures going in. Insights and Processes are **libraries** —
a catalogue you search, look up and take something from, published by Forefront
and read-only for the client.

As described, Insights and Processes are **the same machine with different
content**. That is built once and instantiated twice (§4.8), and it decides the
order of the work (§5).

---

## 3 · What the code says today

Measured, not remembered.

1. **The access matrix is one table of 99 cells** — `lib/rules.js` `AREAS` holds
   **nine** areas (group, own BU strategy, own BU reporting, other BUs, own
   function strategy, own function reporting, other functions, reporting cycle,
   setup) and `ACCESS_DEFAULTS` holds **eleven** rows. Four modules multiplied
   out naively is **396 cells**, and §37 exists precisely because 525 controls
   on one page is not a question anybody asks.
2. **Setup is one railed page of 20 entries in five groups** — *Running the
   cycle · People & access · The organisation · Measurement · Branding*
   (`shell.html`, `SETUP_GROUPS`). Three of those five groups are already the
   spine and two are already Strategy's.
3. **Navigation is destination × tab × section** — group / company / business
   unit / supporting function, then Strategy · Performance · Reporting, then
   sections inside a tab. There is no level above the destination row.
4. **`REVIEW` is read by scoring, reporting, the deck, the cycle board and the
   archives.** All of it is Strategy's; none of it is the client's. There has
   never been a platform-wide cycle — there has been Strategy's, standing in
   for one because nothing else existed.
5. **The new app's addresses are `/<client>/…`** (spec 043 §315), with the slug
   load-bearing in the shell's route, the door's landing, the service worker's
   address list and the push payload's open address.

---

## 4 · The shape

### 4.1 The spine — the client's, and no module's

Read by every module, owned by none:

- the client's identity, its door, sign-in, sessions and passwords
- the **people register** — who exists, their email, their status
- the **org structure** — companies, business units, supporting functions, the
  Official BU list
- **where each person sits**
- the **client-wide seat** (Super user) and the SMO team
- **branding** and **email settings**
- the **inbox**, the **assistant** and the **knowledge base** — one conversation
  per person as today (§97); a knowledge-base entry gains a module tag, which is
  the same shape as the audience it already carries (§161.1)
- the **change log** — gains a module column

**Each module decides how much of the spine it uses.** Strategy addresses every
unit and function; a Portfolio project may belong to none of them. The spine
*offers* structure — it does not require a module to be shaped by it.

**Terminology splits with everything else.** *Business unit*, *supporting
function* and *company* are the client's words and stay on the spine; *pillar*,
*aspiration* and *tactic* are Strategy's and move into its group.

### 4.2 What a module must supply — the contract

A module is not a page with a new name. To be one it has to bring all five:

1. **Its own navigation** — the second row is the module's, not the platform's.
2. **Its own roles and areas**, in its own tab of Roles & access.
3. **Its own Setup group**.
4. **Its own rhythm, or none** — and it may not borrow another module's.
5. **A landing** — where somebody holding a role in it opens.

Anything that cannot supply all five is a page inside a module, not a module.
This is the test that keeps *"we are open for more modules"* from turning the
switcher into a second tab row.

### 4.3 The four

| Module | What it holds | Who writes | Rhythm |
|---|---|---|---|
| **Strategy** | Today's product: foundation, SWOT, plans, measures, reporting, performance, the review deck. Addresses the group, companies, business units and supporting functions. | The client, through the matrix | A reporting cycle |
| **Portfolio** | Detailed projects — breakdowns, timelines, dependencies. The client updates progress and adds notes. | The client | Checkpoints: weekly or monthly |
| **Insights** | The client's own research, analytics and market reports. Search, open, download. | **Forefront only** | None; versions |
| **Processes** | The client's own processes, documented. Search and look up how things go. | **Forefront only** | None; continuous |

### 4.4 Access — one page, a Client tab and a tab per module

One page. A **Client** tab holding the seats and where each person sits, then
**one tab per module**, holding that module's roles against that module's areas.
Nothing is multiplied: a module costs the areas it actually has, not a copy of
the other nine.

**Holding a role in a module is what makes the module appear.** There is no
per-person module tick — no role, no module in the switcher (§61: a control with
nothing behind it is not a choice). Which modules a *client* has is a row in the
platform registry and Forefront's press. Two levels, and neither of them is a
list somebody maintains by hand.

Two areas move:

- **`a_setup` splits.** *Client setup* — the register, the org, branding, email
  — is the client-wide Super user's. *Module setup* is a grant in the module's
  own tab, which is what lets a module have an admin who is not the client's.
- **`a_cycle` stops being a platform area** and becomes Strategy's, with the
  cycle it gates.

### 4.5 Setup — one page, a Client group and a group per module

One page, one rail. A **Client** group first — register, access, org, Official
BU list, branding, email — then one group per module the client has.

A module switched off **removes its group** rather than leaving pages with
nothing behind them (§61).

Cost, stated rather than discovered: the rail gets long. That is what the folds
(§47.3) and the keyword search (§108.13) already exist for, and the search finds
a page without the rail being opened at all.

Rejected, with its reason: **a Setup page per module, reached from inside that
module.** It reads tidier and it fails twice — an administrator sets several
modules up in one sitting, and the spine has to live somewhere that is not
inside any module.

### 4.6 Navigating — the module is the outermost switch

The module sits **above the destination row**, because everything below it —
which unit, which tab, which section — happens *inside* a module. Somebody with
one module sees a plain label, not a dropdown (§32: a door behind a door, and
the pattern the group/company control already uses).

**Never two at once**, so a module owns the whole viewport.

**The place is remembered per module**, so switching back lands where you left
it — §173 one level out.

The second row belongs to the module: Strategy's destinations are the group, the
companies, the units and the functions; Portfolio's is its own list; a library's
are its categories.

### 4.7 Time — every module keeps its own rhythm

Strategy keeps the reporting cycle. Portfolio has checkpoints. Processes is
continuous. Insights has versions and no time at all.

Nothing reads another module's clock, and no module may borrow Strategy's: a
platform-wide cycle would make three modules answer to a rhythm that is not
theirs.

### 4.8 Insights and Processes are one machine

Both are a catalogue: an item with a name, a category, a published date, a
version and something to open. One has a file on the end; the other has steps.

**Built once, instantiated twice, named differently.**

In the client app they are **read-only**: search, open, download, and nothing
else. No upload, no publish gate, no versioning surface, no per-item permission
— and the endpoints refuse a write on the **server**, not only in the screen
(§42, §44).

**The item keeps room for an owner and a next-review date and draws neither** —
Islam's *"for now"* on Processes.

### 4.9 The Forefront console grows a document room

Publishing is Forefront's, so the authoring surface is on the client's card in
`/platform`: upload, categorise, retire, and see what is there — for both
libraries.

**That is where the real build for these two modules is.** The client side is
thin by design.

---

## 5 · The order of the work

1. **The spine and the module switch** — the platform work. The same size
   whether there are two modules or six.
2. **Insights.**
3. **Processes** — nearly free once Insights exists.
4. **Portfolio** — on Islam's description the largest single build on this list,
   larger than Strategy was. It needs a spec of its own.

The libraries are second and third **because they prove the module frame at
small cost before the expensive module is built into it.** A frame with one
tenant in it is not a frame that has been proved.

---

## 6 · What must be proved

Before Portfolio is built, and each at **both ends** (§94.2):

- A person holding a role in one module and none in another sees **exactly one**
  in the switcher — and somebody holding roles in three sees three.
- Two modules read the spine **identically**, and neither can write the other's
  rows.
- The Setup **Client** group is reachable by the client-wide seat; a module admin
  reaches **their own group and no other**.
- Turning a module off in the registry removes it from the switcher, the Setup
  rail and the access page — **and takes nothing with it** (§44: a switch that
  destroys data is a delete with a friendly label). Turning it back on returns
  what was there.
- The place is remembered **per module**, across a switch and across a reload.
- A library is read-only in the client app: no upload and no delete, refused by
  the **endpoint** and not only undrawn.
- Strategy is measured **byte-identical** on every page it already has, or the
  spine extraction has moved something nobody asked to move.

---

## 7 · The one thing that lands before the cutover

The new app's addresses are `/<client>/…`. With modules they become
`/<client>/<module>/…`.

Adding that segment **now** — while only Strategy exists and nobody holds a
bookmark — is a small change to work that is already built and green. Adding it
**after** the cutover means either breaking every saved link or special-casing
Strategy for ever.

Recommended: `/<client>/strategy/…`, with `/<client>/…` redirecting to it, and
nothing else changed. It touches the four places spec 043 already names as
carrying the slug — the shell's route, the door's landing, the service worker's
address list and the push payload's open address.

**Islam's call, on that change.** It is the only part of this spec that gets
materially more expensive by waiting, and the only reason to interrupt the
cutover sequence.

---

## 8 · Deliberately not decided here

- **A Portfolio project pointing at a Strategy project.** Islam: they are
  different things. Nothing is designed for the link; adding one later is an
  optional field on the Portfolio row, not a redesign. Recorded so it does not
  get added quietly.
- **Per-category or per-item visibility in a library.** Whole-module for now. A
  market report that must not reach unit staff is the case that reopens it, and
  per-category fits the roles table when it does.
- **Owners and review dates on a process.** Room kept, nothing drawn.
- **Whether the office is the same team in every module.** One inbox, one
  conversation per person (§97). A module wanting its own desk is a change to
  the inbox, not to this.
- **What Portfolio actually contains.** Breakdowns, timelines and dependencies
  are named and not specified. Portfolio needs its own spec.
- **A fifth module.** The contract in §4.2 is the test; nothing is reserved.

---

## 9 · Files this will touch

Indicative, and to be settled by `plan.md`:

- `lib/platform-rules.js`, `db/platform-*` — the registry gains which modules a
  client has.
- `lib/rules.js` — roles and areas become per module; `a_setup` splits;
  `a_cycle` becomes Strategy's.
- The shell's chrome and routing — the module switch, the per-module second row,
  the remembered place per module.
- `SETUP_GROUPS` and the Setup page defs — a Client group and a group per
  module.
- `platform.html` — the document room on a client's card.
- New, for the library engine and its two instances.

---

## 10 · How this gets built

1. This spec, signed off.
2. **A mockup of the chrome** (rule 1c, non-negotiable): where the switch sits,
   what it looks like with four modules and with one, and what the second row
   does when the world changes. Published as an artifact, saved under
   `design-mockups/modules/`.
3. `plan.md`, then `tasks.md`, then the order in §5.

Nothing is built from a description.
