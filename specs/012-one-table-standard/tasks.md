# 012 · Tasks

Gated: nothing below starts until spec §6 is answered (Constitution I).

## Phase 1 — extract, changing nothing
- [ ] `tablekit` module + `tk-` classes; `data-tablekit` opt-in with a per-table declaration
- [ ] Move the register's freeze onto it (`<tr>` for vertical, cell for horizontal, `background:inherit`)
- [ ] Move the columns chooser onto it, keeping merge-with-defaults
- [ ] Move the row menu onto it
- [ ] **Assert the register is unchanged**: columns, freeze offsets, actions, scroll — measured before and after

## Phase 2 — the reversal
- [ ] *Edit this row* on the row menu; cells become fields in place
- [ ] Save / Cancel in the actions cell; Cancel restores from the copy taken on open
- [ ] One row open at a time; leaving the page cancels
- [ ] Assert: no repaint jump, caret kept, other rows untouched

## Phase 3 — search and sort
- [ ] Search box, filtering in place, appearing above the row threshold
- [ ] Quick-filter chips (per spec §6.1, once answered)
- [ ] Header sort: asc → desc → the table's own order
- [ ] Assert: typing does not repaint; sort is view-only and saves nothing

## Phase 4 — the other six
- [ ] Official BU list · Business units · Functions · Capabilities · Companies · Figure sets
- [ ] Each driven before the next is started
- [ ] Add and Retire/Delete per table, each with its own blockers, refusal naming what

## Phase 5 — the rest
- [ ] Roles & access: freeze only
- [ ] `qa.py` and the contrast sweep at baseline
- [ ] Each new check proved by breaking what it guards
- [ ] §79 written; spec status updated
