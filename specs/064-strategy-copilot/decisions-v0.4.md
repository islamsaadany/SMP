# Copilot inside SMP: rethink decisions

**Version:** 0.4 (working draft, 30 Sep 2026)
**Status:** All design questions raised so far are settled. Nothing is built yet.
**Source files:** `smp-platform-reference.html` (SMP as built) and `platform-reference.html` (Strategy Copilot as built).

This document records only what has been agreed. It is updated as the conversation continues.

**Changes since v0.3**
- Roads are defined: the AI proposes a way forward; the named list per deliverable is deferred until real use shows what's needed (§3.2).
- Company-level planning with assignment: one deliverable at company level, each row carries its owning place, and the set is split at promote (§4.6, §9).

**Changes since v0.2**
- The methodology is edited by Islam alone (§10).
- Authorship shows clearly on the shelf (§3.8, §8).
- No open questions remain (§13).

**Changes since v0.1**
- Consultant Mode dissolves: its lane goes, and its discipline is split between all chats and Advisory (§3.3, §5.3, §6).
- Advisory is defined: free-form deliverables, not promotable, and it covers mid-year performance work (§6).
- A per-client material library is added, separate from Insights (§7).
- Deliverables come in two kinds, promotable and Copilot-only, and the shelf shows which is which; Full Framework outputs survive as Copilot-only (§4.5).
- The Copilot never writes into SMP; small changes are made by hand (§9).
- Out of scope: the review deck and client-card flags (§12).

---

## 1. The problem being solved

Today the Copilot takes a planner through one fixed sequence:

> Foundation → Situational Analysis → Strategy Selection → Execution

Each step is locked until the previous one is approved. That works for a blank-page strategy. It fails for most real work, where the client is already established (e.g. Raya) and the consultant needs to work on one specific thing in whatever order the work demands.

**The rethink turns the Copilot from a fixed step-by-step builder into a conversational workspace inside SMP.**
- The methodology stays.
- It shapes where work is stored and what a deliverable looks like.
- It no longer dictates the order in which work is done.

---

## 2. Where the Copilot lives

### 2.1 A tab inside each place
- The Copilot is a **tab inside each place in SMP**, beside Strategy · Performance · Reporting · Insights.
- A "place" is any level in the client's structure: group, company, business unit, supporting function, capability.
- Opening the Copilot inside Mobile means everything there is about Mobile. The chat knows its context without anyone choosing it.
- History lives where people look for it: the discussion about Mobile's plan sits in Mobile, beside that plan.

### 2.2 Sections inside the Copilot tab
Inside the Copilot tab there is a second row, the same pattern as the Strategy tab's section switch. It has five sections:

| Section | Holds |
|---|---|
| Foundation | Identity, purpose, aspiration, key objectives, values |
| Analysis | Macro, micro, internal, SWOT |
| Directions | Strategy selection work: directions, pillars, capabilities, IE position, discipline, etc. |
| Execution | Objectives, tactical plans, cascading to functions |
| Advisory | Everything else (see §6) |

- A second row of tabs inside a tab is **accepted**. SMP already does this under Strategy.
- **Advisory** exists so that non-phase work has an honest home instead of being stuffed into the nearest section.

### 2.3 Cross-unit work
Cross-unit conversations belong at **group level** (or company level where there is no group). The group is a place with its own Copilot. An example is "the group set this focus; how should it flow into all six units?"

### 2.4 Office overview
- The office also gets an **overview per client**: every Copilot chat and deliverable across all its places, in one list. It shows what is in flight, what changed recently, and what is waiting to be promoted.
- The overview is **not a second store**. It is a different door onto the same shelves. Opening an item takes you into that place's Copilot.

---

## 3. Chats and deliverables

### 3.1 Terms

| Term | Meaning |
|---|---|
| Section | A shelf (e.g. Directions). Holds chats and deliverables. |
| Chat | A named working session. A section holds **many** chats, not one long thread. |
| Deliverable | The stored outcome (e.g. a SWOT). It outlives the chat that made it. |
| Version | Each saved state of a deliverable: v1, v2, v3… |

### 3.2 How a chat starts
- The chat opens as an **empty box, clean in view**, like Claude.
- Above it sits **one line of context** saying what the AI can see for this place, e.g. "Mobile — three pillars, Q3 reported, two measures off track."
- There are no road-picker cards, no banners and no explanatory text. SMP's rule applies: no grey descriptions; extra facts go in hover tips.
- **Roads** are the ways of producing a deliverable. They are **not a gate** in front of the chat:
  - The consultant says what they want. The AI then **proposes a way forward**, e.g. "Building Mobile's SWOT — I can ask you through it, work from something you paste, or use the template."
  - Where the AI can already see enough (reported cycles, relevant material in the library), it **proposes the road it thinks fits** without asking, and the consultant redirects if they want another.
- **Roads carried over from the built product:**

| Section | Roads |
|---|---|
| Foundation | Guided questions (recommended) · Upload notes · Template (multi-stakeholder synthesis, filled outside and brought back) · Import a finished foundation |
| Analysis | Guided questions · Template · Upload data or reports · Deep-research prompt (run in another tool, pasted back) · Import a finished analysis |
| Directions, Execution | None in the built product |

- **Deferred:** a named list of roads **per deliverable type** (roads belong to a deliverable, not a section), and roads for Directions and Execution. These are designed later, from what consultants actually reach for in the free chat, not invented now. When defined, they live in the methodology (§10).

### 3.3 Playback before producing (all chats)
Before producing anything, the AI says:
- what it understood
- what it will work from
- what is missing

This playback is general to every chat. It is inherited from the old Consultant Mode. The missing-input check in §5.3 is part of it.

### 3.4 Chats stay reopenable
- A chat can be reopened weeks later and continued.
- Starting a fresh chat that works from an existing deliverable is equally normal.
- The deliverable is the current truth; a chat may go stale.

### 3.5 Making a deliverable
1. The AI produces the content (e.g. a SWOT) inside the conversation.
2. The consultant keeps discussing and refining it in the chat.
3. When it is right, the consultant presses a small **Save** option.
4. On save, the AI **re-renders it into the fixed shape** (see §4) and **shows exactly what will be stored**, including any gaps (e.g. "no evidence on three items").
5. The consultant confirms. It is stored as the next version.

- Refining an existing deliverable in any chat and saving produces **the next version of the same deliverable**, not a second copy.
- A section shows one SWOT with its version history, not a pile of near-identical SWOTs.

### 3.6 Inline editing
- A saved deliverable can be **edited directly, inline**, without going through the chat. This is for things like typos and rewording one item.
- An inline edit creates a new version like any other change.

### 3.7 Versions
Every version carries:
- a **short note** on what changed and why
- **who** created it
- **when** it was created

**Restoring an older version** creates a new version at the top of the history. For example, restoring v2 when the latest is v4 creates v5, noted "restored from v2", with who and when.
- History stays one straight line; nothing is lost.
- The latest version on the shelf and what is live in SMP never disagree silently.

### 3.8 How a section's shelf is organised
- Deliverables are organised **by the structure**: by the name of the unit, function, capability or company they belong to. Consultants work place by place, especially in strategy selection and in cascading to functions.
- Each deliverable shows plainly whether it is **promotable** or **Copilot-only** (see §4.5).
- Each deliverable shows plainly **who made it** (see §8).

---

## 4. Structure and shape

### 4.1 Structure comes from SMP
- The Copilot does not ask about the organisation. It **reads the client's structure from SMP** (Setup › Structure): levels on or off, companies, units, functions, capabilities, and the plan type each one uses.
- The consultant is expected to have set the client up in SMP before working in the Copilot.

### 4.2 The shape follows the place
The **plan type set on that place in SMP decides what a deliverable looks like**. The consultant does not pick a format when it is already defined. Plan types are:
- Pillars → key measures + tactics
- Projects → deliverables, outcomes, milestones
- Objectives & actions → objectives with dated actions

### 4.3 When the place is not set up yet
- The chat **asks which approach**, from a **fixed list of options** only. It never invents a shape.
- The chosen approach is **recorded on the deliverable**, e.g. "planned as a function, pillars format".
- When the client is later set up in SMP, the setup must match what was planned, or the deliverable will not be promotable. The recorded approach tells whoever sets up SMP what to build to.

### 4.4 SMP owns the shape
- **There is one shape per deliverable type, and SMP defines it.** It is expressed in the client's own words, from Setup › Terminology.
- Where the old Copilot's shape differs (e.g. Guiding Objectives vs Key Objectives, Valued Behaviors vs Core Values, SWOT counts), **SMP wins**.
- Where the Copilot has a genuinely better field, it is **proposed as an addition to SMP's shape**, so that both sides have it. There are never two shapes.
- The Copilot's writing rules (counts, evidence tags, naming conventions) stay as **quality guidance inside the chat**. They never change the stored shape.

### 4.5 Two kinds of deliverable

| Kind | Shape | Can be promoted to SMP? | Examples |
|---|---|---|---|
| Promotable | Defined by SMP (§4.4) | Yes | Foundation, SWOT, pillar set, projects, objectives & actions |
| Copilot-only | Defined by the Copilot's methodology | No; it lives on the shelf as thinking and reference | Old Full Framework outputs, Advisory deliverables |

- **The old Full Framework outputs survive in the Copilot** as Copilot-only deliverables:
  - IE matrix with IFE/EFE scores
  - value-discipline scoring
  - directions with urgency × importance × ease scores
  - 3-year allocation and themes
  - SMART / Balanced Scorecard / OKR objective sets
- Over time, when one of them proves its worth, it is **given a home in SMP** and becomes promotable. The same route applies as in §4.4 and §11.
- The shelf **shows each deliverable's kind plainly**, so a consultant sees at a glance what can go live and what cannot.

### 4.6 Company-level planning with assignment
Some clients plan as one company but hand parts of the plan to the units or functions that will own and report them.

| Case | How it plans | Assignment needed? |
|---|---|---|
| **Raya** (group with units) | Each unit plans its own foundation, SWOT, directions… in its own Copilot. | No |
| **El Abd** (one company) | Directions and capabilities are planned together at company level, then owned by different functions or units. | Yes |

- **In the Copilot, the set stays one deliverable at company level.** It was argued as one piece, so it is planned and versioned as one object, with no forked history.
- **Each row carries its owning place**: the unit or function, taken from SMP's structure, that will own and report it. Examples: one direction to Sales, two to Operations, a capability to HR.
- **The split happens at promote, not in the Copilot** (§9). Each row goes to its owning place, so in SMP every owner sees, reviews and reports only their own directions.
- The next planning round starts again from the company deliverable. If an owning place has since changed its rows in SMP, the next promote shows it among the consequences (§9). Nothing is overwritten silently.
- Raya uses the same mechanism; it simply never assigns.

---

## 5. What the chat can read

### 5.1 The client's data
- A Copilot chat can read **everything in the client that the signed-in person may see**. This includes:
  - structure
  - live plans
  - reported figures
  - scores
  - the Insights library
  - the people register
  - other units' data
  - the material library (§7)
- Reading across units is a core feature, not a side effect. Example uses: comparing units, checking correlations, asking how the group is doing and how its focus should flow into the units.

### 5.2 Sources are shown
When a chat brings in another unit's figures, it says where each number came from, in the same discipline as evidence on a SWOT.

### 5.3 Missing-input handling
Before answering, the AI checks what already exists for this place and says so. For example, "you're asking for directions and there's no analysis on the shelf." It then offers two ways forward:
1. Go fill that section first and come back.
2. Paste what you have and work from it here. Pasted material is **marked as such** on the result. The AI also **offers to save the pasted material as its own deliverable**, e.g. save a pasted SWOT to Analysis, so that nothing rests on material that lives nowhere.

### 5.4 Assumption record (all chats)
- When the consultant says "I don't know — assume for me", the AI records the assumption and **carries it onto the deliverable**.
- Anyone reading later sees what the output rests on.
- An assumption, once recorded, is not asked again.
- This is general to every chat. It is inherited from the old Consultant Mode.

---

## 6. Advisory

- **Consultant Mode as a separate lane is removed.** Its work lands in Advisory, which sits inside a place like every other section, so it can read the client's data. The old Consultant Mode never could.
- Advisory covers:
  - one-off decisions and questions (pricing, operating model, board papers…)
  - **mid-year performance work**: why a measure keeps missing, why a tactic hasn't moved, preparing a quarterly review. For now there is no separate section for this.
- **Advisory keeps the old Consultant Mode's questioning discipline:**
  - one question per turn
  - at most 5 questions per round, at most 2 rounds; once the budget is spent, it produces an outcome using assumptions
  - quick replies: "I don't know — assume for me" and "Proceed with what you have"
  - contradictions between pasted material, answers and platform data are surfaced; the consultant chooses which source wins, and the AI never picks silently
- **The Decision Brief** remains Advisory's typical outcome:
  - situation
  - what we know, tagged by source
  - 2–4 options with exactly one recommended
  - rationale
  - next steps
- **Advisory deliverables are free-form**: a title and a body, in whatever form the work needs (text, a table…). There is no fixed shape.
- **Advisory deliverables are Copilot-only.** They are record and reference and are never promoted to SMP.
- The playback (§3.3) and the assumption record (§5.4) apply everywhere. The **question budget and the Decision Brief are Advisory's own**. The other sections are guided tracks with their own guidance and don't need a budget.

---

## 7. Material library

- Each client has **one material library**, reachable from every place and every chat of that client. It holds raw working material such as:
  - interviews
  - meeting and board minutes
  - financials and data
  - deep-research results
- **It is not the Insights module.** Insights holds finished reports Forefront publishes to the client. The library may use the same storage approach, but it is its own shelf inside the Copilot.
- **The chat looks in the library on its own when something is relevant**, but it:
  1. names what it found and why it looks relevant, and
  2. asks the consultant whether to use it before using it.
- This validates every reference. The library may hold superseded plans or unapproved drafts, and nothing is ever used silently.

---

## 8. Access

- **For now: Strategy Management Office only.** Only Super user and SMO team seats can open the Copilot.
- **Built for later:** Copilot access follows the same rules SMP already uses, meaning the person's seat and roles, judged on their own place.
  - The office sees the whole client.
  - A client's own person (unit owner, custodian…) would see **only their own place**, with no cross-unit reading.
  - Opening the Copilot to a client later is **a switch in the module's access areas, not a redesign**.
- **Authorship:** each deliverable records who made it, and the **shelf shows it clearly**, so work by a client's person is visibly distinguishable from the office's work, including at promote time.

---

## 9. Promoting to SMP

- Copilot deliverables and SMP's live plan are **always separate objects**. There is no live link between them; SMP's reporting cycle and the Copilot's versioning run on different clocks.
- The only connection is a **deliberate act: Promote**. It makes a Copilot version the active plan content in SMP. Only **promotable** deliverables can be promoted (§4.5).
- **Office only.** Promote is limited to Super user and SMO team, **even when a client's person wrote the deliverable**.
- **Piece by piece.** Examples: just the SWOT, or just one unit's pillars.
  - SMP must accept partial promotes cleanly. A promoted SWOT does not touch the pillars, and a promoted pillar set does not require a foundation.
  - SMP already tolerates incomplete plans through its Missing bar.
- **Assigned rows split at promote.** A company-level set whose rows carry owning places (§4.6) is delivered row by row to those places in SMP.
- **Promote is a version event on both sides.** SMP keeps what was there before as a superseded version, with the date, who promoted it and the source version, for recovery.
- **No silent overwrite.** Before a promote, SMP shows the consequences and the office confirms. The consequences shown are:
  - what gets replaced
  - what is new
  - which reported figures would be orphaned (e.g. a pillar set drafted in June, where Mobile has since reported two cycles or been renamed)
  - which rows an owning place has changed in SMP since the last promote (§4.6)
- After a promote, the two sides are independent again.
- **The Copilot never writes into SMP directly.** Small changes, such as fixing a target unit or adding a missing measure, are made **by the SMO by hand in SMP**, not through the Copilot.
- (Full integration mechanics are **not in scope yet**. Only the principles above are agreed.)

---

## 10. Methodology

- The methodology the AI works from **is not hard-coded**. It lives on the platform as **editable guidance** that the chat references.
- **One methodology for the firm**, across all clients, never per client.
  - It sits on the **office console**, beside Consultants and Who sees what, not on any client's setup rail.
  - An edit applies to every client's next conversation.
  - Example: a new concept such as revenue drivers is added once and becomes available across the platform.
- **Who may edit it: Islam only.** Not client Super users, not other consultants.
- **Versioned**, with a note per change, so a change in output can be traced to a change in guidance.
- **Structure vs guidance:**
  - The *shape* of a promotable deliverable comes from SMP and is **not** editable as free text.
  - What is editable is the *guidance*: counts, what good looks like, what to avoid, house vocabulary, and the shapes of Copilot-only deliverables.
- **Client-specific words** still come from SMP's Setup › Terminology. The method stays firm-wide; the words stay client-specific.

---

## 11. Running list: Copilot fields to add to SMP

These are fields worth carrying from the Copilot into SMP's own shapes (see §4.4). Each is to be agreed and mocked up before any change.

1. **Evidence on each SWOT item**, i.e. what the item rests on.

Copilot-only deliverables that later earn a home in SMP (§4.5) are also added here when that decision is made.

---

## 12. Out of scope (decided)

- **The review presentation.** SMP's deck stays about performance only. Nothing from the Copilot appears in it.
- **Client-card flags.** The Copilot shows no mark on the client's card in the console.

---

## 13. Open questions

None at present. New questions are added here as they come up.

---

## 14. House rules that apply to any build from this document

- Agree content in plain words first. Then produce a **static navy/gold HTML mockup** for any visual change and wait for sign-off before building.
- Change only what is asked.
- No grey description paragraphs under titles; use hover tips.
- Setup table rows stay on one line.
- The Copilot is an SMP module: a folder plus one registry entry. It **never gets its own sign-in, tenancy or roles**. Its data carries the client id under row-level security, like every other client table.
