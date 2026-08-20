# Feature Specification: The rail on a unit's My reporting

**Feature Branch**: `claude/adminsmo-access-module-wj89vv`
**Created**: 2026-08-20
**Status**: Approved by record — DECISIONS-AND-LOGIC v1.8 §15.12 first bullet
(the rail on Performance and My reporting; Performance shipped in 1.8, My
reporting remains), design by §15.6 ("Where it earns most: reporting") and
`mockups/mock-unitrail.html`
**Input**: Backlog item §15.12, first bullet — the remaining half.

## User Scenarios & Testing

### User Story 1 — Report through the rail (P1)

Mennah Farouk opens Mobile → Performance → Report. Instead of the stacked
pillar accordion, the rail lists the pillars on the left with each one's
entry tally — exactly what a capability's Reporting page already does — and
the pane carries the selected pillar's measures and tactics entry tables. While
entering one pillar she can see the state of the others, which an accordion
cannot show.

**Independent Test**: as any unit custodian with the cycle open, enter a figure
in one pillar, see its rail tally advance, switch pillars without scrolling.

**Acceptance Scenarios**:

1. **Given** the Report section with ≥2 pillars, **Then** a rail renders with
   each pillar's code, name, tally (done/total of what is asked) and a sub-line
   (complete / N still to enter / not asked this cycle); the pane holds the
   selected pillar's measure and tactic tables unchanged in content.
2. **Given** a selection made on Performance, Strategy or Report, **When** the
   viewer switches between those tabs, **Then** the same pillar stays open —
   the selection belongs to the unit (§15.6).
3. **Given** a unit with fewer than two pillars, **Then** no rail draws; the
   pane fills the width (§15.6).
4. **Given** the Key Objectives section and the report bar (progress, due date,
   submit), **Then** they are unchanged above the rail — only the pillar
   accordion is replaced.
5. **Given** entry, notes, note-required gating, submit/reopen and the
   closed-cycle state, **Then** all behave exactly as before.

## Requirements

- **FR-001**: Replace the pillar accordion in `renderReport` with the
  rail/pane split used by capability Reporting: rail rows carry
  `data-urail` (shared selection state `RAIL["unit:" + ukey]`), an
  `rtally` count of asked-and-given, and the sub-line wording capability
  reporting uses.
- **FR-002**: The pane renders one pillar's measures table and tactics table
  with the existing entry boxes, note fields, not-asked dimming and unit
  suffixes — no content change.
- **FR-003**: The rail foot carries the unit's overall tally.
- **FR-004**: No reordering on the Report section (entry, not arrangement).
- **FR-005**: Update `u_report` Info: the rail carries each pillar's tally so
  the state of the others stays visible while entering one.

## Success Criteria

- **SC-001**: QA walk clean; entering figures through the rail writes exactly
  as the accordion did (same `data-rep`/`data-note` path).
- **SC-002**: Rail tallies agree with the report bar's total.
