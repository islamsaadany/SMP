# SMP — Revenue Drivers Module

*Working write-up from the alignment session of 21 September 2026. Captures what was agreed, in the order it was agreed. Nothing here is built yet; Islam decides what goes into the platform.*

---

## 1. Purpose

Add the revenue driver tree to the Strategy Management Platform as its own module, so a business unit can open its strategy and, on a separate tab, see the revenue logic behind it.

The two are linked but are **not the same thing**:

- **Strategy performance** answers: *did we do what we said we would do?*
- **Revenue driver performance** answers: *did the money show up?*

A unit can deliver every tactic and still miss revenue because an assumption was wrong. Keeping the two readings separate is what makes that visible.

---

## 2. The logical sequence (top down)

1. **Top management or the board** hands a unit a big number. *Example: "Retail stores must bring 1 billion EGP next year."*
2. **The business unit** builds its revenue driver tree: the combination of drivers that gets close to that number.
3. **Someone above approves the tree.** This involves real negotiation: is the combination logical, too conservative, or stretching?
4. **The platform stamps the agreed version.** The negotiation happens outside the platform; the platform does not manage drafts or approval states for now.
5. **The strategy is built to deliver it**: key objectives, then pillars, then measures, then tactics.

The tree comes before the strategy. Strategy should start from the financial objectives and cascade down, not start from a blank page of directions.

---

## 3. Generating the tree

| Item | Decision |
|---|---|
| Who builds it | The business unit |
| Starting point | A revenue number handed down from top management / board |
| Approval | Negotiated and approved above the unit, outside the platform |
| What the platform holds | The final agreed version only |
| What comes across | **The whole tree**, so the unit can always see its own logic |

---

## 4. How the tree connects to the strategy

### 4.1 Tree → Key Objectives

- The tree's **top-line revenue is the unit's revenue key objective.** One number: the tree calculates it, the platform displays it. The hand-typed revenue target goes away.
- Some other tree rows may also become key objectives if they matter to the unit's success, but not all of them.
- **Key objectives are the unit's definition of success**, not simply the tree's biggest rows. Some key objectives have nothing behind them in the tree.
  *Example: "Open 8 stores" or "Cover X governorates" can be a key objective because expansion itself is essential, even if one store adds little revenue.*

### 4.2 Key Objectives → Pillars

- Pillars are the unit's **focus areas**, the big titles it works on to achieve its key objectives.
- *Retail example: merchandising, workflow and process enhancement, expansion, maximising the store itself.*
- Grouping is a judgement call. Some ideas are too tactical to be pillars and sit under one; others span several.
- Pillars serve the key objectives. They do not need to reference the tree directly; the tree already did its job at key objective level.

### 4.3 Pillars → Measures

- Each level measures its own success: key objectives measure the unit; **pillar measures measure the focus area.**

### 4.4 Measures → Tactics

- Tactics are **what the unit does** to achieve the pillar measures.

### 4.5 Where each driver row lands

Every tree row that needs work lands somewhere in the strategy:

- either as a **key objective**, or
- as a **measure under the pillar that owns it**.
  *Example: a "maximise the store" pillar carries "average basket size" as a measure.*

| Row type | Test | Where it lives |
|---|---|---|
| **Work row** (moves because people do work) | e.g. number of stores, basket size | Tree **and** a key objective or pillar measure |
| **Decision / assumption row** (moves because of a one-time decision) | e.g. a price increase set by finance or marketing | **Tree only.** Not a measure; no performance is set against it |

**Who decides placement:** the business unit, reviewed by the Strategy Management Office.

---

## 5. Keeping the tree and the strategy connected

### 5.1 Same number, not enforced

- The tree holds a **level**, not a growth path. *Example: average basket size = 500 EGP.*
- The linked measure's target should read the same 500.
- The platform **does not lock or enforce** this. Doing so is not practical while plans are being built.

### 5.2 Connection status on the drivers tab

- The drivers tab shows a **status** on each row: connected, or not connected.
- A not-connected row **asks for its connection**: the user picks the key objective or measure it belongs to.
- This is part of setup, not a warning or a nag.
- Once connected, the row is tracked and the platform can always see differences between the tree and the strategy.

---

## 6. Actuals

| Row type | Where the actual comes from |
|---|---|
| Connected row | The **progress of the connected measure / key objective**, no second entry |
| Assumption row (tree only) | **Direct entry** on the drivers tab |

Who enters what is handled by the platform's existing roles and assignments.

---

## 7. Reading the drivers tab at review

- Reviews read **prorated to the review date** (e.g. at quarter review, the share of the yearly target due by then). The platform's existing proration concept applies; the tree's months and seasons give the phasing.
- **Headline first:** are we on track, will we achieve, or are we behind?
- **Then the deviation and the rows that caused it.**
  *Examples: an assumption that didn't hold; stores that weren't opened.*
- **The drivers tab stays about the money.** It does not show tactics. To understand *why* a row is behind, the user crosses to the strategy side.

---

## 8. Mapping reference (revenue tree ↔ platform)

| Revenue tree | Platform |
|---|---|
| Channel tab (e.g. Retail) | A business unit (e.g. Retail stores) |
| Channel year-1 revenue | That unit's revenue key objective |
| Work row with an uplift | A key objective or a pillar measure |
| Flat / decision row | Stays in the tree; actual entered directly |
| Increment table (e.g. new stores 2026) | Typically a key objective or pillar measure (openings); delivered by tactics |
| Driver moved by a support function (e.g. Marketing traffic) | A link to that function's measure |

**Raya examples that already fit the model**

- Nigeria tactic *"Branded shops with Xiaomi & Samsung"* (outcome: 2 shops) — the same shape as a new-stores increment.
- Marketing *"Total WS/App traffic"* — the sessions driver for Online shop.
- Marketing *"Increase store traffic"* — feeds the transactions driver for Retail stores.
- Consumer Finance *"Achieve revenue target"* (1.6B EGP) — what a tree total would populate.

---

## 9. Still open (not yet discussed)

1. **Monthly rate vs yearly total.** Tree drivers are monthly (e.g. 62,000 sessions/month); some measures compile as Sum (e.g. 13.5M total traffic). Each connection needs to state which reading it uses, or target and actual won't reconcile.
2. **Support-function links.** When a unit's driver is moved by a function (Marketing traffic → Retail transactions), how the connection crosses from function to unit.
3. **Tree scope.** Confirm one tree per business unit (as discussed) versus one per company with a tab per unit (as in the current tool).

## 10. Ideas raised, not agreed

Parked for when the module is built. Not part of the agreed model.

- **Revenue at stake per row:** how much growth disappears if a row stays at last year's level, to rank rows by money.
- **Unbacked growth:** an uplift in the tree with no connection behind it. The connection status in 5.2 may already cover this.
- **Year-end forecast:** actuals to date plus plan for remaining months, giving an estimated gap to target.
