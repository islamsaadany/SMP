# Tasks: Capability card and Cards/Table view toggle

- [ ] T001 [US1] `src/group-render.js`: add `capMilestonesBody(c)` and replace the
      capability `splitCard` call with the two-box `capCard` (Performance dial +
      Milestones box), keeping both drill modals and adding the function · head
      sub-line.
- [ ] T002 [US2] `src/group-render.js`: add `GVIEW` state, `viewToggle()` control,
      `unitsTable()` and `capsTable()`; render toggle in the Business units and
      Group capabilities section headers; branch cards/table per `GVIEW`.
- [ ] T003 [US2] `src/shell.html`: wire `[data-gview]` clicks in `wire()`.
- [ ] T004 `src/pageinfo.js`: extend `g_perf` Info with the toggle and the
      capability table's ranking rule.
- [ ] T005 Verify: rebuild, run the QA walk (all viewers), and measure the card
      at 330px minimum — labels must not clip (B1).
