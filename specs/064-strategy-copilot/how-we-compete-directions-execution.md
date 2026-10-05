# Spec 064 · How we compete, Directions, Capabilities and Execution in the Copilot

**Status:** signed off by Islam 2026-10-05 (*"ok signed off, write the spec"*). Nothing built yet. Build starts only on his word; nothing merges to `main` without his word on that merge.

**Picture signed off:** `design-mockups/copilot-directions-flow/2026-10-05_directions-flow-v2.html` (artifact https://claude.ai/artifact/QchujNL42JboaiRcfDvwEu). Where this text and the mockup disagree, the mockup is what was approved and this text is a documentation bug.

**Builds on:** `decisions-v0.4.md` (sections, chats, deliverables, house rules), `plan.md` (copilot tables and files), DECISIONS §490 (the SWOT flow: start-from-existing-or-fresh, a to-do column, results agreed in the chat, then saved into the plan).

---

## 1. One rule for every step

- **The side column holds only the to-do list.** Results — scores, tables, chosen items — appear in the conversation, never in the side column.
- Every step: the Copilot proposes first, the user can change anything, then confirms. Nothing reaches the plan until the user presses Save.
- The client's own words are used everywhere (labels: El Abd says *Directions / Capabilities*, RHI says *Pillars*).

## 2. The Copilot's sections

Foundation · Analysis · **How we compete** · **Directions** · (**Capabilities** — only when capabilities are their own layer) · **Execution** · Advisory.

## 3. How we compete

### 3.1 Where it lives
- A new section on the Strategy tab, **after SWOT and before Plan**.
- Switched On/Off **per layer** on Client set-up › Structure (a chip beside the layer's other sections). Off hides the section and keeps what was saved. Stored as an absence (§50.6); unsaid reads Off, so no existing client changes.
- The section shows the saved value-proposition table (§3.4). It also appears in the review deck as one slide when it holds something (assumed; Islam did not object).

### 3.2 Value discipline scoring
- Three disciplines: **Best Total Cost (BTC)**, **Best Total Solution (BTS)**, **Best Product (BP)**.
- **10 market factors** and **10 internal factors**; each factor is scored 0 / 1 / 2 for each discipline.
- Results shown as a percentage per discipline, separately for market and internal.
- **Clarity** from the gap between first and second: above 25 points = *Clear*; 10 or more = *Leaning*; below 10 = *Unclear*.
- **The market result decides.** Ties break BTC, then BTS, then BP.
- The Copilot scores first; the user can change any score; the user confirms the discipline (and may choose a different one than the score suggests).
- Factor wording comes from the old Copilot method (`smp-app/assets/copilot/instructions-source.md`).

### 3.3 Value proposition chat
- The Copilot suggests **5 values**, each with **How** (about 3 bullets) and **Measure** (1–3 bullets, with targets).
- Shown as cards; the user ticks the closest (usually 3–4).
- The chat continues: the user may ask for another title (alternatives offered as quick replies), drop or add a How, add a Measure.
- It ends on the **final table** (§3.4). Every cell is editable by hand. Buttons: **Keep chatting** · **Save to How we compete**.

### 3.4 The table
Discipline across the top; then **Value / How / Measure** rows; one column per chosen value — the shape of Islam's *Best Total Cost* slide.

### 3.5 To-do
Score the disciplines · Choose the discipline · Pick the values · Refine and check the table · Save.

## 4. Directions chat

- Opens by asking: **start from the existing Directions, or start fresh** (as §490).
- The Copilot suggests options drawn from the SWOT and the chosen discipline.
- **Only external options are scored**: Urgency × Importance × Ease, each 1–4, total out of 64. The Copilot scores first; the user can change scores.
- At company level each Direction has an **Owned by** function (**decision a**: a new owning-function field on the Direction).
- The user ticks which go ahead; can press **Suggest more** (new ones marked *New*) or **+ Add my own** (scored, marked *Yours*).
- Save writes the ticked Directions into the plan (the company plan's pillars, or the unit's, by where the chat runs).

## 5. Capabilities — two modes, decided by Structure

Capabilities are suggested, never scored. The Copilot proposes 3–5 from the chosen Directions and the SWOT. Each carries:
- **Kind** (**decision c**: kinds kept):
  - *Gap-closing* — something we must build because a weakness or a Direction needs it.
  - *Transformation* — a change we choose to make for its own sake.
  - *Enabler* — a supporting foundation such as data or systems.
- **Serves** — which Directions it supports.
- **Owned by** — a function.

The user can keep/tick, edit the wording, **Suggest more**, or **+ Add my own** (*Yours*).

### 5.1 Capabilities in the company plan (`SMPRules.capAtTop` true)
Chosen at the end of the Directions chat. To-do: **Options · Choose Directions · Choose Capabilities · Save**.

### 5.2 Capabilities as their own layer
- The Directions chat ends at Save Directions. To-do: **Options · Choose Directions · Save**.
- A separate **Capabilities** Copilot section appears between Directions and Execution. It starts from the saved Directions and the SWOT, with the same table. To-do: **Suggest Capabilities · Choose and set owners · Save**.

## 6. Execution chat

### 6.1 The plan period
- Asked once: *"How long is this plan?"* — quick choices: **full year**, **this quarter to year end**, **pick months**.
- At most one year, or what remains of the year.
- Stored on the existing planning period (`GROUP.planFrom` / `planTo`, §308) and shown in the chat as *"This plan covers Jul–Dec 2026 (Q3–Q4) · Change"*.
- The Copilot asks again once the period has ended.

### 6.2 Measures and tactics
For each chosen Direction and Capability: measures (with targets) and tactics, whose quarters are limited to the period. Then **Save to plan**.

To-do: Plan period · one item per Direction and Capability · Save.

## 7. Setup › Planning & reporting cycle

Replaces Setup › Reporting cycle.
- The **plan period** is the first block, with an **Edit** button.
- **Reporting cycles sit inside it**; a cycle running past the period is flagged.
- Changing the period changes what is due on targets (it already drives proration, §308).
- Tactics outside a shortened period are **flagged, never deleted**.

## 8. Data (shapes, not yet migrations)

| Thing | Where | Shape |
|---|---|---|
| How we compete on/off | `GROUP.structure[level].compete` | absence = off |
| Discipline scores | the How-we-compete record, per subject | `{market:{factor:{btc,bts,bp}}, internal:{…}, chosen:"btc"\|"bts"\|"bp"}` |
| Value proposition | same record | `{discipline, values:[{title, how:[…], measure:[…]}]}` |
| Direction score | pillar `extra` | `{urgency, importance, ease}` (1–4 each) |
| Direction owner | pillar `extra.ownedBy` | function key |
| Capability kind / serves / owner | capability row | `kind`, `serves:[direction ids]`, `ownedBy` |
| Plan period | `GROUP.planFrom` / `planTo` | existing |

The How-we-compete record rides the subject's `extra` (no migration) unless the build finds a reason otherwise — said, not assumed, when built. Server classification for each new field is part of the build (§259.2: classify and sweep together).

## 9. Left out of this round

The Projects approach and the 3×3 grid.

## 10. How it will be proved

- A browser check per chat, driving the real controls and reading the stored plan back (§96), both ends of every switch (§94.2).
- The scoring arithmetic (percentages, clarity bands, tie-break, ×64) asserted as agreement with one shared function, never typed numbers (§94.8).
- Each check proved able to fail from the sources (§276).

## 11. Open

- Where the factor wording for §3.2 is tuned (taken from the old method; Islam may edit).
- The deck slide for How we compete — assumed, to confirm on the first built screen.
