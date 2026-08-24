# 012 · Tasks

Spec §6 answered 2026-08-24. Building.

## Phase 1 — extract, changing nothing
- [x] `tablekit` module + `tk-` classes; `data-tablekit` opt-in with a per-table declaration
- [x] Move the register's freeze onto it (`<tr>` for vertical, cell for horizontal, `background:inherit`)
- [x] Move the columns chooser onto it, keeping merge-with-defaults
- [x] Move the row menu onto it
- [x] **Assert the register is unchanged**: columns, freeze offsets, actions, scroll — measured before and after

## Phase 2 — the reversal  *(next)*
- [x] *Edit this row* on the row menu; cells become fields in place
- [x] Save / Cancel in the actions cell; Cancel restores from the copy taken on open
- [x] One row open at a time; leaving the page cancels
- [x] Assert: no repaint jump, caret kept, other rows untouched

## Phase 3 — search and sort
- [x] Search box, filtering in place, appearing above the row threshold
- [x] Quick-filter chips (per spec §6.1, once answered)
- [x] Header sort: asc → desc → the table's own order
- [x] Assert: typing does not repaint; sort is view-only and saves nothing

## Phase 4 — the other six
- [x] Official BU list · Business units · Functions · Capabilities · Companies · Figure sets
- [x] Each driven before the next is started
- [ ] Add and Retire/Delete per table, each with its own blockers, refusal naming what

## Phase 5 — the rest
- [ ] Roles & access: freeze only
- [ ] `qa.py` and the contrast sweep at baseline
- [ ] Each new check proved by breaking what it guards
- [ ] §79 written; spec status updated


*Phases 1–3 done on the register, v3.24 (§80). The freeze and the columns
chooser have not yet MOVED into `tablekit` — they still live in the register's
own CSS and render, which is why phase 1 is only half ticked.*
