# Feature Specification: One kind of thing — the simplification

**Feature Branch**: `claude/blissful-tesla-c5amlg` (stage 1 built; stages 2–5 not started)

**Created**: 2026-10-07

**Status**: Direction agreed by Islam 2026-10-07; §7.1 decided the same day; **stage 1 built on the branch 2026-10-07 (§507.2), not merged** — the six rules of §4 below, with the client copies waived at Islam's word (*"No need for client data proceed"*)

**Input**: Islam, 2026-10-07:

> "the platform got very complex, from the setup with company vs units and the
> roles and access to what to present. things became very complex and not easily
> customized and every change requires me a new addition like adding a direction
> owner or a capability or planning in pillars only or projects in the roles and
> access or trying to see the BUs swot despite planning on the company level in
> addition to how performance is calculated and how presentations are set.
> please review the platform thoroughly and let's think of a simplification for
> all these interconnected areas"

His answers to the review (2026-10-07), recorded verbatim because the model below
is built on them:

1. *One kind of thing, in a tree* — **"yes"**.
2. *A blank objective weight counts as the average of the weights that were set,
   everywhere* — **"ok"**.
3. *When the company plans directly, do the units stay underneath?* —
   **"nothing hides anything else. all is on and off and we make the settings of
   each on what to show"**.
4. *Is a direction different from a pillar?* — **"a pillar is external and
   internal pillars and they are the same like directions but internal
   directions are called capabilities. but when we plan in pillars we put all of
   them under the same list but when we plan in directions and capabilities we
   split them like in elabd"**.

---

## 1. Why it got complicated

The platform was built around ONE real kind of plan: a business unit planned in
pillars, with real tables behind it (`units`, `pillars`, `measures`, `tactics`).
Everything added since has been made to *imitate* a business unit so the
existing pages would draw it:

| Added later | How it imitates a unit today |
|---|---|
| Supporting function | `fnAsUnit()` / `fnWritable()` / `fnWriteBack()`, plan stored as one JSON blob in `functions.extra` |
| Capability | `capAsUnit()` / `capWritable()`, its own `cap:<id>` address, its own owner role (`capowner`) |
| The company's own plan | `topAsUnit()` / `topWritable()`, pillars in `GROUP.items`, address `group` |
| A unit planning in projects | `unitOwnHolder()`, address `u:<key>` |
| The company planning in projects | address `u:group` |
| A company direction | `dir:<id>` for its deck, its own owner role (`dirowner`) |
| A division | `co:<key>`, its own formula (`companyMix`) |

Each imitation needed its own adapter, its own role, its own scoring formula and
its own deck branch. That is why each request arrives as a new special case.
There is no general "thing with a plan", only a unit and copies of it.

### Measured (2026-10-07, read off the code)

- **8** spellings of "a thing with a plan"; about **160** places ask *which kind
  is this?* before deciding what to do; **96** comparisons against `"group"`.
- **12** roles, of which **one** (the seat) is granted and **11** are worked out
  from where a name appears — one per kind of thing. Access table **117** cells,
  plus **44** rules that sit outside it.
- **10** different headline formulas over one row scorer. A blank objective
  weight is the average of the set weights on a unit (`koWeights`) and **1** on a
  function or capability (`capKOScore`): weights 40/blank/blank on scores
  100/50/50 read **67** on a unit and **98** on a function. "Execution" means four
  different things.
- **3** deck builders, **34** slide kinds (three Thank-you slides, three SWOT
  layouts, three covers), about **15** presentation settings in **5** places; the
  plan download is a second, separate description of the same slides.
- About **450** setup controls, **250** on the Structure step; a plan's shape
  can be set in 3–4 places with different defaults; *are there capabilities?* has
  three answers.
- **The BU SWOT case:** with the company planning directly ("units off"), each
  unit's SWOT and Foundation are still stored but no page shows them — the
  archive page shows counts only. "Units off" was built as *hide the units*.

---

## 2. The model

### 2.1 One kind of thing: a box in the client's tree

The company, a division, a business unit and a supporting function are all the
same kind of object — called a **box** here. Every box has:

1. **A parent and a weight.** The tree is the client's structure. *Company vs
   units* is no longer a mode; it is where a box sits.
2. **The same sections:** Foundation, Analysis (SWOT, How we compete), Plan.
3. **Its own switches** for every section and every part of a section, set once
   per level and adjustable per box (Islam's answer 3).
4. **A plan in one of three shapes:** pillars, projects, or objectives & actions.

### 2.2 Nothing hides anything else (Islam's answer 3)

Every box and every section is on or off **by its own switch**. Turning on the
company's own plan never hides a unit, and switching a unit off never moves its
plan anywhere. So:

- The units' SWOTs and Foundations stay visible on their own pages whenever their
  switch is on — the BU SWOT question disappears rather than being answered.
- **This reverses §447** ("units off" copies every unit's pillars onto the
  company plan, archives the unit plans and hides the units). Recorded as a
  reversal, not overwritten (Principle II).

### 2.3 Pillars: external and internal (Islam's answer 4)

- A **pillar** is either **external** — a **direction** — or **internal** — a
  **capability**. This is the `kind` field every pillar already carries
  (`Direction | Capability`, §29, §324), now load-bearing.
- How a pillars plan is **shown** is one setting per box:
  - **One list** — every pillar together (today's business units);
  - **Split** — directions in one list, capabilities in another (today's El Abd).
- So a direction is a pillar, a capability is a pillar, and neither is a kind of
  box. `dir:<id>` and `cap:<id>` stop being addresses; `dirowner` and
  `capowner` stop being roles (§3).

### 2.4 The three shapes, stated once

| Shape | What it holds |
|---|---|
| Pillars | Pillars (each with key measures and the work under it) |
| Projects | Projects (deliverables, outcomes, milestones) with no pillars above them |
| Objectives & actions | Objectives (measures) and dated actions, no pillars |

Every box draws its shape with **the same pages** — no adapter per kind.

---

## 3. Roles and access

**Seats** (granted, as today): Super user, SMO team.

**Responsibilities** (worked out from where a name sits, as today — but ONE set
for every kind of thing):

| Role | Attached to | Reaches |
|---|---|---|
| **Owner** | a box, or a pillar, or a project | what it is attached to |
| **Custodian** | a box, or a pillar | what it is attached to |
| **Contributor** | named on a row | the rows that name them |
| **Everyone else** | — | the floor |

- The CEO is the **Owner of the top box**; a division CEO the Owner of a division
  box; a unit owner, a function head, a direction owner, a capability owner, a
  pillar owner and a project owner are all **Owner** of what they are attached
  to. **Adding a new kind of thing never adds a role again.**
- **The access table** becomes role × (this box / boxes below it / other boxes /
  reporting cycle / setup): **6 rows × 5 columns = 30 cells**, where today is 117.
  Where somebody is attached decides the scope, exactly as "own" already works
  (§37: *own is not a setting*).
- The rules that live outside the table today (44) are reviewed one by one in
  stage 2; each either becomes a cell or stays a named rule with a reason.

---

## 4. Performance

- **Rows** are scored exactly as today (`measureScore`: proration, direction,
  compile rule, the 150 cap). Unchanged.
- **One weighting rule everywhere** (Islam's answer 2): a blank weight counts as
  the average of the weights that were set; none set means equal; every set
  weight zero falls back to equal (§243's rule, already the unit's).
- **Three readings, defined once, the same for every box** (§64's three):
  *Objectives* (the box's key objectives), *Pillars* (its pillars' average), and
  *Execution* (work done against work planned). "Execution" means one thing.
- **A box with children** also shows its children's weighted roll-up. Functions
  and divisions count toward their parent like anything else (today they never
  enter the group's number).
- **Known divergences this removes** (each measured or read): the two weight
  rules; page and deck disagreeing on a projects/objectives unit; Y/N measures
  showing "Not reported" on the Focus board while scoring 100; a project
  outcome's figure that does not move its project's score when typed on a
  function's Reporting page (reported separately, to be fixed on its own).

---

## 5. Presentations

- **One template for every box**, built from its sections in a fixed order:
  cover → Foundation → Analysis → Plan → results → notes → Thank you. A pillar
  split (§2.3) shows as two sections in the same template.
- **One place per box** for its presentation settings: hidden slides, picture and
  video slides, the timer. These then work identically everywhere, where today
  they fall through on some kinds.
- **The master flow** is a list of boxes in order.
- **The plan download** is the same template without the reported figures —
  never a second builder.
- **The short company review** (today's `short` flag, seven forks) becomes a
  switch on which sections the template draws.

---

## 6. Setup

- **Draw the tree**: the levels, the boxes, each box's parent and weight.
- **Per level, once**: which sections and parts are on, and their words.
- **Per box, only where it differs**: its own switches, its plan shape, and for a
  pillars plan whether it shows one list or splits directions and capabilities.
- **One answer each** to: how does this box plan; are there capabilities (=
  does any pillar have kind *internal*); who enters a figure.
- The 7-step set-up flow becomes three steps: the client, the tree, the office.

---

## 7. Open questions

### 7.1 A capability that today has its own page — DECIDED 2026-10-07

Islam: **"ok for your recommendation"** (the recommendation below, as written).

Today a capability can also be held by a supporting function as its own page,
with its own owner and custodian, planning in projects (Raya Trade's *Product
Mindset*, Setup › Capabilities, §334, §412). Under §2.3 a capability is an
internal pillar.

**Recommendation:** such a capability becomes an **internal pillar of the
function that holds it**, and a pillar's work may be **tactics or projects**,
chosen per pillar. That keeps one rule (a capability is always a pillar) and
keeps its projects whole.

**Cost, stated before choosing:** the capability's own entry in the navigation
goes; it is reached as a pillar on its function's Strategy page, and its owner
and custodian become the pillar's owner and custodian.

### 7.2 Decided, recorded for the record

- Direction agreed (answer 1).
- One weighting rule (answer 2).
- Nothing hides anything else (answer 3).
- Pillar = direction or capability; one list or split (answer 4).
- A capability with its own page becomes an internal pillar of the function
  that holds it; a pillar's work is tactics or projects, chosen per pillar
  (§7.1, "ok for your recommendation").

---

## 8. How it is built — five stages

Each stage ships on its own, is reversible, and is aligned with Islam before it
starts (rule 1b); visual changes are mocked up first (rule 1c).

| # | Stage | Moves data? | What must NOT change | Proof |
|---|---|---|---|---|
| 1 | **Performance** — one formula, one weight rule, one meaning of execution | No | Row scores (`measureScore`) | Before/after headline numbers for every client, shown to Islam **before** anything ships |
| 2 | **Roles** — Owner / Custodian / Contributor on any box, pillar or row; the 30-cell table | No | What every person can open and do | The T0 access baseline (`scripts/test-access-unmoved.js`) reads UNMOVED |
| 3 | **The tree** — every plan holder becomes a box; pillars carry their kind | **Yes** | Every figure, id, code and snapshot | A migration rehearsed on a copy of each client first; round trip a fixed point |
| 4 | **Setup** — draw the tree; per-level and per-box switches | No | What each client currently sees, until changed | Each client opens identically after the switch-over |
| 5 | **Presentations** — one template | No | The slides a review already relies on, unless agreed | Deck-by-deck comparison per client |

**Order rationale:** stage 1 is the smallest, touches no data and is where
clients currently see disagreeing numbers. Stage 3 is the only one that moves
data, so it waits until 1 and 2 have removed most of the special cases it would
otherwise have to carry.

### 8.1 Stage 1, as built (§507.2, 2026-10-07)

| Rule | What changed | Where |
|---|---|---|
| P1 one weight rule | A capability's and a function's objectives use `koScore` (§243): a blank weight is the average of the set ones; hidden rows left out | `capKOScore` |
| P2 one Execution | Milestones and actions count once their date has come; nothing due is no figure; the card says *N due so far* | `capExec`, `fnActionsTally` |
| P3 one roll-up | Group and units-only division execution = weighted average of the units' own execution; the *Delivered X% against Y% planned* line replaced | `groupRatio`, `companyRatio`, `execLine` |
| P4 one headline | A function's headline is its objectives when its plan has them (shown, switched on), else its pillars or projects — on the page and in the division roll-up alike | `holderHasKOs`, `fnMemberScores`, `koLeads`, `capScoreCards` |
| P5 deck = page | The deck shows objectives only where the page does | `present.js` |
| P6 Focus yes/no | A yes/no focus measure reads its answer | `focusFigure` |

Proof: `scripts/test-stage1-rules.js` (38/0, every row score compared with
f1f5d29, red eleven ways from the sources); `scripts/stage1-readings.js` now
reports 0 moves against the built sources and 16 against f1f5d29. The client
copies were waived (Islam: *"No need for client data proceed"*).

---

## 9. What it costs

- **A data migration** (stage 3), rehearsed per client. El Abd needs the most
  care: its units were folded into the company plan by §447 and come back as
  boxes under §2.2.
- **About two thirds of the checks** describe today's special cases and are
  rewritten as their stage lands — rewritten to the new rule, never loosened
  (§218).
- **Visible changes:** some headline numbers move (one weight rule; functions and
  divisions counted); some slide layouts merge; the access table changes shape;
  Setup › Structure is rebuilt.
- **Not in scope:** the other modules (Copilot, Tracker, Notes, Insights,
  Portfolio, Processes) change only in how they read the tree, and only where a
  stage reaches them.

---

## 10. Success criteria

- A new kind of structure (a new level, a new way to plan) is a **setting**, not
  a code change.
- No role, address, formula or deck branch exists for one kind of thing only.
- The same box in the same state reads the same number on every page and slide.
- A request like "a direction owner" or "show the BU SWOT under company planning"
  needs no new build.
