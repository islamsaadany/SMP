# 016 · The onboarding tour

**Feature Branch**: `claude/onboarding-flow-spec-v9g7x5`

**Created**: 2026-08-26

**Status**: Agreed — mockup rev 4 signed off; not built. The decisions-document
§ is assigned when this reaches `main` (§94's lesson: numbered when it lands).

**Input**: Islam: *"for first time users we need some orientation flow that
takes them through the platform — the concept of highlighting some areas while
dimming the rest of the page with focus on a button or an area with brief
messages with a next and skip and close buttons … which would take them through
the tabs and the buttons to press and the functionality in a user story mode
for proper onboarding."*

**Visual treatment**: settled from a working mockup, four revisions, each
looked at and corrected —
`design-mockups/onboarding-tour/2026-08-26_spotlight-tour.html` (rev 4 is the
signed-off record). The mockup is a replica; the build anchors to the real
controls.

---

## 1 · The decisions

Asked and answered in chat before anything was drawn, then corrected by
looking at the drawn thing. One reversal, recorded as a reversal.

| # | Question | Answer |
|---|----------|--------|
| 1 | One tour or a story per role? | **Per role.** First release: the **strategy custodian** and the **business unit / function owner**. |
| 2 | Does the person press the real buttons? | **No — the tour walks itself** (Next / Back only). **This reverses the first answer**: interactive do-steps were chosen, built in mockup rev 3, and reversed by Islam in rev 4 after using them. The record keeps both because the intervening mockups were built under the first answer. |
| 3 | When does it fire? | **First sign-in**, remembered per browser. Replay lives in the **Knowledge base**. |
| 4 | What data does it show? | **Demo data.** The tour opens the demo view itself — the Demo data button is the SMO's (§67), and demo writes nothing, which is what makes a first-time user safe in it. |
| 5 | How does it end? | **One exit.** There is no Skip-tour button anywhere (rev 4 removed it); the **×** (or Escape) asks: **Don't show again** or **Skip for now**, with a quiet *Keep the tour* path back for a stray click. |

### 1.1 What the mockup rounds settled beyond the questions

- **The spotlight names where you are.** On navigation steps the lit thing is
  the ONE button of the current selection (your unit, then the Strategy tab) —
  never the whole row, which says nothing (rev 3, Islam: *"to know where am
  I"*). The dim can hold **several holes at once**, so a strategy section
  lights its own section button AND the content it opened together.
- **The strategy sections are seen one by one, in place** — Strategy is one
  tab holding Foundation · SWOT · Plan in a section row (`shell.html`), and
  the tour opens each in turn. The first mockup flattened them into sibling
  tabs and was corrected against the real structure.
- **The card never covers a dimmed spotlight.** It places itself below,
  beside or above the lit area; when the subject is a whole view and there is
  no clear space, it docks in a corner — and the card is **slightly
  transparent** throughout, so what it must overlap stays readable (rev 2,
  Islam: *"relocating or make it a bit transparent"*).
- **Performance opens onto its numbers.** After the Strategy walk the tour
  opens the Performance tab itself and lights the tab together with the three
  headline numbers, BEFORE Report is explained. Report and Presentation are
  each explained in place; **Presentation's menu is not opened** (rev 4
  reversed rev 3's menu-opening step).
- **Buttons sit where the built product puts them** — in the mockup's replica
  the Report / Presentation / band-legend row is the FIRST row of a unit's
  Performance page because `renderUnitPerformance` returns it first; in the
  build this is true by construction, since the tour anchors to the real
  controls.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A strategy custodian's first sign-in (Priority: P1)

Amina has just been given her password and signs in for the first time. The
platform finishes loading her own (empty or part-filled) tenant, then offers
the tour. Starting it switches her to the labelled demo dataset and walks her
through nine steps, each dimming the page and lighting what the step is about,
with a short card beside it. She presses only Next and Back. Closing or
finishing returns her to her own data.

**The nine steps** (subjects; exact wording is the mockup's, Islam's to amend —
Principle VIII):

1. **Where you are** — the one navigation button of her own unit, lit alone.
2. **The Strategy tab** — lit alone; the card names Performance beside it.
3. **Strategy › Foundation** — section button + its content lit together.
4. **Strategy › SWOT** — same treatment.
5. **Strategy › Plan — the pillars rail** — Plan section button + rail.
6. **A pillar's measures and tactics** — Plan section button + pane.
7. **Performance — the headline numbers** — the tour opens the tab itself;
   tab + the three headline figures lit together.
8. **Report** — explained in place, not pressed.
9. **Presentation** — explained in place; the menu is not opened.

Plus a welcome card (Start the tour) and a finish card (Close, naming the
Knowledge base as the replay home).

**Why this priority**: the custodian is the person the platform most needs to
onboard — they carry the unit's reporting — and this story is the one the
mockup fully settled.

**Independent Test**: sign in as a person holding only the strategy custodian
role in a browser with no stored tour choice; the tour offers itself, all nine
steps walk in order with Back working from every step, and closing at any
point lands on the person's own data with nothing written.

**Acceptance Scenarios**:

1. **Given** a custodian's first sign-in in a fresh browser, **When** the
   platform finishes hydrating, **Then** the welcome card appears over the
   dimmed page, offering Start and ×— and nothing else.
2. **Given** the tour is running, **When** Amina reaches step 7, **Then** the
   platform is showing the demo Performance page with the tab and the
   headline numbers lit and everything else dimmed.
3. **Given** any step, **When** she presses Back repeatedly, **Then** the
   tour retraces to the welcome card with every view matching its step.
4. **Given** any step, **When** she presses × and then *Keep the tour*,
   **Then** she is returned to the same step unchanged.

---

### User Story 2 — A unit or function owner's first sign-in (Priority: P2)

A business unit head (or supporting function owner) signs in for the first
time and gets the same shaped story addressed to an owner: where their unit
(or function) is, what Strategy holds, and how Performance reads their score —
ending on Report and Presentation as the acts their custodian or they perform
each cycle. For a **function**, the walk uses the function's own real
navigation (its Strategy sections are Overview and Projects — or Plan, for a
function that plans in pillars, §59) — a unit and a function are the same
product (§53) and the story adapts to which one the person owns rather than
being written twice.

**Why this priority**: owners are the second population that arrives on day
one; their story shares the engine and most of the walk, so it is cheap after
P1 — and it is the test that stories really are data, not code.

**Independent Test**: sign in as a person holding only a unit-owner role;
the owner story offers itself and every lit control exists for that role.
Repeat as a function owner and the walk follows the function's own sections.

**Acceptance Scenarios**:

1. **Given** a unit head's first sign-in, **When** the tour runs, **Then**
   every spotlighted control is one the head can really see, and the wording
   addresses the owner, not the custodian.
2. **Given** a pillars-planning function's owner, **When** the tour reaches
   the strategy walk, **Then** the sections toured are the function's own
   (Overview · Plan), not a unit's.

---

### User Story 3 — Replaying the tour (Priority: P3)

Anyone who dismissed the tour — or anyone at all — can start it again from
the **Knowledge base**, the page where explanation lives (§30). The entry
runs the story matching their role.

**Why this priority**: it is what makes "Don't show again" safe to press and
a new-device replay a feature instead of a bug.

**Independent Test**: choose *Don't show again*, sign out and in (no tour),
open the Knowledge base, start the tour from there — it runs in full.

**Acceptance Scenarios**:

1. **Given** any signed-in person on the Knowledge base, **When** they press
   the tour entry, **Then** the tour starts from its welcome card regardless
   of any stored choice.
2. **Given** a person whose roles match no story, **When** they open the
   Knowledge base, **Then** the entry offers the nearest story that their
   grants can display, or is absent — never a tour with missing steps.

---

### Edge Cases

- **A viewer whose role reaches none of a story's pages**: no story is
  offered automatically. A tour that skips half its steps reads as broken
  (the rev 1 alignment settled this: per-role stories, not one story with
  holes).
- **The boot skeleton (§94.10)**: the tour must not offer itself until the
  platform has landed — a spotlight on a grey placeholder tours nothing.
  The offer waits for the same `land()` door the skeleton uses.
- **Presentation mode (a projector)**: the tour never draws there, same gate
  as the chat corner (§97).
- **Opened from `file://`**: there is no sign-in and no "first sign-in", so
  the tour never auto-offers; the Knowledge base entry still works, because
  the demo dataset is baked into the file.
- **A repaint mid-step (§35, §97)**: the platform rebuilds the page's DOM on
  every `paint()`. The tour lives outside the repainted region and re-anchors
  its spotlights to selectors after every repaint, scroll and resize — it
  never holds a node.
- **A missing target at runtime**: if a step's control is absent for this
  person despite the check (a tenant switch, a race), the step is skipped
  and the skip is counted in the console — never a blank spotlight. The
  check (FR-010) exists so this path stays cold.
- **Storage unavailable** (blocked site data): every read and write of the
  stored choice is guarded; when storage fails the tour does NOT auto-offer
  — failing quiet, never nagging on every load.
- **A small window**: card placement falls back to a corner dock; the card's
  translucency is what makes that overlap acceptable. Below the placement
  candidates nothing scrolls off-frame.
- **Demo entry and exit**: starting the tour enters the demo view; finish,
  either close choice, and Escape-then-close all return the person to their
  own view. Demo mode already refuses every save (§21, §67) — the tour adds
  no write path and rides that guarantee.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On a signed-in person's arrival with no stored tour choice for
  their story, after hydration lands, the platform MUST offer the tour
  (welcome card over the dimmed page). No offer in presentation mode, from
  `file://`, or while the boot skeleton is up.
- **FR-002**: Starting the tour MUST switch the platform to the demo dataset
  for the tour's duration, with the demo banner visible throughout; ending it
  by any path MUST return the person to their own data. Nothing done during
  a tour may write to the tenant.
- **FR-003**: The story offered MUST be chosen from the person's roles by the
  shared rules (`lib/rules.js` vocabulary — never a second copy): strategy
  custodian → the custodian story; unit/function owner → the owner story. A
  person holding both gets the custodian story (the doing role); a person
  holding neither gets no automatic offer.
- **FR-004**: Every step MUST advance with Next and retreat with Back (Back
  absent only on the welcome card); a step counter ("Step n of N") and
  progress dots MUST show; going Back MUST restore that step's page, section
  and spotlights exactly.
- **FR-005**: Each step MUST dim the whole page except its named targets:
  one dim layer holding one hole per target, each ringed; navigation steps
  light exactly the one button of the current selection; section steps light
  the section button and its content together.
- **FR-006**: The step card MUST be slightly transparent, placed clear of
  every spotlight when space exists (below, beside, above, corner), and
  corner-docked over content only as the last resort.
- **FR-007**: The ONLY exits are the × and Escape, both opening the same
  choice: *Don't show again* (stored per browser; the tour never auto-offers
  again there), *Skip for now* (no durable mark; the tour offers itself
  again next sign-in), and *Keep the tour* (returns to the current step).
  Finishing the tour stores the same mark as *Don't show again*.
- **FR-008**: All tour memory MUST live in browser storage (`localStorage`,
  `smp.tour.*`), never in the state graph (§25, §47.1). No save, no
  migration, nothing for `lib/authorize.js` to classify.
- **FR-009**: The Knowledge base MUST carry the one replay entry (FR-003
  picks the story); replay ignores stored choices and never changes them
  until the person closes again.
- **FR-010**: A build check MUST walk every story as every role it can be
  offered to, over the built file, and assert for every step: the target(s)
  exist, are visible, and the step's page and section are the ones the step
  names — failing the build otherwise (§51.11: a tour keyed on a removed
  selector does not fail, it passes quietly; this check is what makes that
  impossible). It MUST be proved able to fail before it is trusted (§94.5).
- **FR-011**: The tour engine MUST survive `paint()`: it lives outside the
  repainted region, holds selectors rather than nodes, and re-anchors on
  repaint, resize and scroll. Nothing in the engine ever calls `paint()`
  itself (§97's rule for the chat corner, same reason).
- **FR-012**: Step wording is content — Islam's to approve (Constitution
  VIII). The custodian story's copy in mockup rev 4 is the approved baseline;
  the owner story's copy is drafted at build time and approved before merge.

### Key Entities

- **Story**: an ordered list of steps for one role key (first release:
  `custodian`, `owner`), stored as data beside the page definitions — never
  as code per role.
- **Step**: what one card shows — the page/tab/section to open, the target
  selectors to light (the last being the main subject), a title and a body.
- **Stored choice**: per browser, per story — *never show* (set by finishing
  or by Don't-show-again) or nothing. *Skip for now* deliberately stores
  nothing durable.
- **The check**: a build-time walk of every story × role, asserting FR-010.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time custodian reaches the finish card unaided, using
  only Next, in under three minutes.
- **SC-002**: In every story, for every role it is offered to, 100% of
  spotlighted controls exist and are visible at the moment their step shows —
  enforced by the check on every build, so the number cannot drift below 100
  without the build failing.
- **SC-003**: After *Don't show again* (or finishing), the tour never
  auto-offers again in that browser; after *Skip for now*, it offers exactly
  once more per subsequent sign-in.
- **SC-004**: Zero writes reach the tenant from any tour run, verified by
  comparing stored state before and after a full tour including the Report
  and Presentation steps.
- **SC-005**: Every page visited during a tour stays free of console errors
  for every viewer the sweep covers (`qa.py` extended over the touring
  state).

## Assumptions

- **Two stories in the first release** (custodian, owner). SMO, CEO and
  contributor stories are follow-ups for the §16 backlog, not silently
  included here.
- **A person holding both first-release roles gets the custodian story** —
  the doing role; the owner story remains reachable from the Knowledge base.
- **"Next sign-in" for Skip-for-now** means the offer returns when a new
  session begins, not on every page load within the same session.
- **The demo dataset stays baked and non-saving** (§21, §67) — the tour adds
  no mechanism of its own for either.
- **Per-browser memory is accepted**: a new device or cleared storage replays
  the offer once; one press of × answers it. This was chosen over a
  server-side flag, whose cost would be a save for the authoriser to classify
  for a fact that costs nothing to forget.
- **The mockup is the visual contract** for dim, rings, card, prompt and
  step order; the build anchors to real controls, so replica geometry is not
  part of the contract.
