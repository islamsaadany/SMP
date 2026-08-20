# Feature Specification: Presentation mode for a supporting function

**Feature Branch**: `claude/adminsmo-access-module-wj89vv`
**Created**: 2026-08-20
**Status**: Approved by record — DECISIONS-AND-LOGIC v1.8 §15.12 ("Presentation
mode still renders a capability the old way"), shape governed by §8.8 and A13
(a capability's review is the unit's review with the project model's content)
**Input**: Backlog item §15.12, third bullet.

## User Scenarios & Testing

### User Story 1 — Present a function's review (P1)

The head of a supporting function (or the SMO/CEO) opens the function's
Performance page and presses **Present** — the same button, in the same place,
as on a unit's Performance page. A 16:9 deck assembles from whatever the
platform holds at that moment, covering each capability the function carries
with the project model's content: no measures-and-tactics leftovers.

**Why this priority**: the review meeting is where the platform earns its
place; a function's review currently cannot be presented at all.

**Independent Test**: as Noran Adel (HR head), open HR → Performance →
Present; walk the deck; Esc returns to the page.

**Acceptance Scenarios**:

1. **Given** a function carrying one capability, **When** Present is pressed,
   **Then** the deck runs: cover (function · cycle) · what we are aiming at
   (the capability's definition and key objectives, targets only) · where it
   stands (key objectives / project performance / execution, at headline size)
   · projects overview · then per project a lead-in and its deliverables,
   outcomes and milestones · what needs attention · thank you.
2. **Given** Marketing (two capabilities), **Then** each capability gets its
   own aiming-at/standing/projects run, separated by a capability cover slide.
3. **Given** a capability with no key objectives, **Then** no key-objectives
   block renders anywhere in its slides — absent, never zero (§15.1).
4. **Given** an outcome not yet measured, **Then** its row reads "Measured at
   Qn" rather than a figure; a milestone past its project's end date carries
   the overrun note's meaning in its row (tinted date), never a refusal.
5. **Given** notes written during reporting, **Then** they travel onto the
   slides beside their figures, and "what needs attention" gathers everything
   below 70 with what is being done.

### Edge Cases

- A function with no capabilities never shows Present (it also never appears
  in the nav — `fnsReachable` already requires capabilities).
- A capability with no projects: overview says so; no per-project slides.
- Long project tables squeeze then split with "continued", exactly as unit
  decks do (same `deckFitPass`, `data-split` markers).
- The deck is available to anyone who can view the function's Performance page
  (same rule as units, §8.8).

## Requirements

- **FR-001**: A Present button on the function Performance page action area,
  visually identical to the unit's.
- **FR-002**: `deckSlidesFn(fnKey)` producing the sequence above, reusing the
  deck's existing slide classes, chrome, keyboard control, fit/split pass and
  scaling — one deck system, two content shapes (A13, B5).
- **FR-003**: Slide content follows the platform's own tables: deliverables
  (reported/reads), outcomes (target/actual/reads or measured-at), milestones
  (finish/status pill wording), project lead-in stats (performance /
  deliverables / outcomes / milestones counts).
- **FR-004**: "What needs attention": deliverables and outcomes reading below
  70, and milestone overruns (§15.4), each with its note where one exists.
- **FR-005**: The owner's-note slide binds to the function's review note
  (editable in the room), keyed like unit notes so nothing collides.

## Success Criteria

- **SC-001**: QA walk clean; opening and closing the deck as every function
  viewer produces no console errors.
- **SC-002**: No slide overflows at 1600×900 after the fit pass (measured).
