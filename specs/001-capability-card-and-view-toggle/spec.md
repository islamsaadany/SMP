# Feature Specification: Capability card and Cards/Table view toggle

**Feature Branch**: `claude/adminsmo-access-module-wj89vv`
**Created**: 2026-08-20
**Status**: Approved by record — DECISIONS-AND-LOGIC v1.8 §16.6 and §15.1, mockup `mockups/mock-capcard.html` (option 2 + toggle, marked settled in the folder README)
**Input**: Backlog item §16.6 — "The capability card, and a view toggle"

## User Scenarios & Testing

### User Story 1 — The capability card reads like a unit card (P1)

The CEO scans Group Performance → Group capabilities. Each capability shows the
same two-box card a business unit shows: the performance dial on the left, and
on the right the milestones that produce its execution — *2 of 3*, with in
progress, not started and project count beneath. Today the right box is dead
("— no plan") because it still expects tactic data a capability no longer has.

**Why this priority**: the current card mislabels the dial "Objectives" and
shows a permanently empty Execution box — a visible defect on the group page.

**Independent Test**: open Group → Performance → Group capabilities as the SMO;
every capability card shows a Performance dial and a Milestones box with real
counts; no card reads "no plan".

**Acceptance Scenarios**:

1. **Given** Operational Excellence (3 projects, 10 milestones, 6 done), **When**
   its card renders, **Then** the left box is labelled Performance and dials
   `capPerf`, and the right box reads "6 of 10" with in progress, not started
   and projects (3) beneath.
2. **Given** any capability, **When** the ⓘ on either box is pressed, **Then**
   the same derivation modals the card carries today open (performance from
   projects; execution from milestones per project).
3. **Given** the card header, **Then** its sub-line names the owning function
   and its head (e.g. "Treasury · Fayad Sobhy"), per the settled mockup.

### User Story 2 — Cards/Table toggle on both sections (P1)

The SMO scanning ten units or eight capabilities flips the section to a table;
the CEO judging one at a glance keeps the cards. The toggle appears on **both**
the Business units section and the Group capabilities section, or neither —
"or the two sections stop matching" (§16.6).

**Independent Test**: on Group → Performance, both sections carry a
Cards/Table switch; flipping one section leaves the other's choice alone.

**Acceptance Scenarios**:

1. **Given** the Business units section in Table view, **Then** each row shows
   the unit (click-through), weight, pillars, execution-of-plan, and objectives
   performance as the final, band-coloured column, in the arranged order.
2. **Given** the Group capabilities section in Table view, **Then** each row
   shows the capability (with function · head beneath), projects, milestones as
   done/wip/todo, and project performance as the final, band-coloured column —
   **ranked on project performance** (§15.1), unscored last.
3. **Given** either section in Table view, **When** the viewer navigates away
   and back, **Then** the choice persists for the session (a view preference,
   not stored on the object).
4. **Given** Arrange mode, **Then** reordering remains a cards-view act; the
   capability table stays ranked by performance regardless of stored order.

### Edge Cases

- A capability with no projects: dial renders the null dash; milestones box
  reads "0 of 0" with counts of zero — never invents a figure.
- A capability with no key objectives changes nothing here — the card never
  showed KO figures; the drill explains where KOs exist.
- Table view with a retired unit: retired units are already excluded by
  `activeKeys()`; the table walks the same list as the cards.

## Requirements

- **FR-001**: Replace the capability `splitCard` on Group Performance with a
  two-box card: Performance (gauge of `capPerf`) left; Milestones right —
  "done of total" plus in progress / not started / projects — reusing the
  existing `.two`/`.box-obj`/`.box-exec`/`.ratio`/`.led` card anatomy (A13).
- **FR-002**: Card header sub-line: function name · head name; " · N projects".
- **FR-003**: Both drill modals retained (ⓘ never becomes a +).
- **FR-004**: A Cards/Table toggle (existing `.minisw` control family) on the
  section headers of Business units and Group capabilities only. Session-held
  state (`GVIEW`), default cards.
- **FR-005**: Units table: unit (link, `data-go`), weight, pillars count,
  execution of plan (with delivered/planned beneath), objectives performance
  last with band colour. Stored (arranged) order.
- **FR-006**: Capabilities table: capability + function·head, projects count,
  milestones done/wip/todo (coloured counts as in the mockup), performance
  last with band colour; sorted by performance descending, nulls last.
- **FR-007**: Dark table headers (§8.9); the row's conclusion is the last
  column and carries the band colour (§8.5); nulls render as dashes via `pct()`.

## Success Criteria

- **SC-001**: `qa.py` walk clean for all viewers.
- **SC-002**: Rendered figures in both views agree exactly (same derivations).
- **SC-003**: Byte-identical rebuild discipline holds (`build.py` output ships).
