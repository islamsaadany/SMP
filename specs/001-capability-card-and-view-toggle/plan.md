# Implementation Plan: Capability card and Cards/Table view toggle

**Spec**: `spec.md` · **Sources touched**: `src/group-render.js`, `src/group-extra.css` (only if a new class is unavoidable), `src/pageinfo.js` (g_perf Info)

## Technical Context

Group Performance renders four sections (`renderGroupPerformance`), one at a
time via the third nav row. Units and themes use `splitCard`; capabilities use
`splitCard` with `planned=null`, which leaves the execution box dead. All
scores derive from `capPerf` / `capExec` / `projMilestones` in
`config-data.js` — nothing new to compute.

## Design

1. **`capCard(c, ci)`** in `group-render.js` beside `splitCard`: same
   `.gcard` / `.card-head` / `.two` shell. Left box `.box-obj`: label
   "Performance" + ⓘ (existing `pd` drill) + `gauge(capPerf(c), "")`. Right box
   `.box-exec`: label "Milestones" + ⓘ (existing `ed` drill) + body reusing the
   `.ratio` / `.ratio-l` / `.led` anatomy: big count `done`, "of N", then a
   `dl.led` of In progress / Not started / Projects. `capExec(c)` supplies all
   counts. Null-safe: `total === 0` renders the dash body.
2. **Header sub**: `functionOf(c.fn)` → `f.name + " · " + personName(f.head)`,
   then "· N projects". Unassigned function renders just the project count.
3. **`GVIEW = { units:"cards", caps:"cards" }`** module state; a
   `viewToggle(key)` helper emits a `.minisw` with `data-gview="units|cards"`
   etc.; the shell wires `[data-gview]` clicks (one generic handler in
   `wire()`), repainting on change. Placed in the `section()` action slot for
   the two sections.
4. **`unitsTable()` / `capsTable()`**: `.cfg` tables per FR-005/006, reusing
   `miniTable` conventions but with explicit `<div class="cfg"><table>` for the
   dark-header look the setup pages use. Caps sorted:
   `slice().sort(byPerfDescNullsLast)`.
5. When a section is in table view, the arrange bar is suppressed for that
   section (reordering is a cards-view act); Arrange stays available in cards.
6. **Info**: add one bullet to `PAGE_INFO.g_perf` — cards judge, a table
   scans; the capabilities table ranks on project performance.

## Constitution Check

- I: design settled by `mock-capcard.html` (README: settled) + §16.6/§15.1.
- V: no stored score introduced; tables render the same derived figures.
- VI: card anatomy, minisw toggle, cfg tables, band-coloured final column all
  reuse existing patterns; the only new pattern is the toggle placement, which
  the settled mockup draws.
- VII: no version on screen.
