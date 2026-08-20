# Implementation Plan: Capability project import and export

**Spec**: `spec.md` · **Sources touched**: `src/templates.js`, `src/xlsx.js`,
`src/config-render.js`, `src/shell.html`, `src/config-data.js` (id lookup
helper only), `src/pageinfo.js` (c_import Info)

## Technical Context

The unit import pipeline is: template builders (`planTemplate`,
`progressTemplate`, `planWorkbook`, `progressWorkbook`) → `parseCSV` /
`readXlsx`+`*FromWorkbook` → `checkFileShape` + `validatePlan` → `diffPlan` /
`diffProgress` → `applyPlan` / `applyProgress`, orchestrated by `renderImport`
+ `wireImport` with state in `IMP`. Capabilities already carry stable ids
(`capN`, `capN-P1`, `capN-P1-D1/-O1/-M1`, `capN-KO1`) and an addresser
(`capItemById`). Same parser, same validation shape, same id rules (§16.4).

## Design

1. **Scope**: `IMP.unit` holds either a unit key or `"cap:capN"`. The dropdown
   gains two `<optgroup>`s (Business units / Capabilities). Helpers
   `impIsCap()`, `impCap()`.
2. **CSV contract** (`templates.js`): `CAPP_COLS` per FR-003.
   `capPlanTemplate(c)` emits PLAN row, CAPOBJECTIVE rows (weight, compile,
   target split), PROJECT rows (description=brief, owner, stakeholders piped,
   timeline, start, end), then per project DELIVERABLE (kind, due, owner),
   OUTCOME (direction, value+unit, measure_at) and MILESTONE (covers, owner,
   finish, status **excluded** — plan carries no reporting) rows.
   `capProgressTemplate(c)` mirrors the reporting page with
   `current`/`new_value` (and `new_status` for milestones folded into
   `new_value`).
3. **Workbooks** (`xlsx.js`): `capPlanWorkbook(c)` / `capProgressWorkbook(c)`
   with the sheets and validations of FR-002/FR-006, and
   `capPlanFromWorkbook` / `capProgressFromWorkbook` reducing sheets to the
   CSV row shape (project chosen by name, `parentFor`-style fallback to the
   recorded parent for known ids).
4. **Find/validate/diff/apply** (`templates.js`):
   - `capFindById(c, id)` wrapping `capItemById` but scoped to one capability
     (plus `capN-PLAN`).
   - `checkCapFileShape(c, rows, kind)` — foreign-capability and unit-file
     detection by id prefix; plan/progress kind check (progress = has
     `new_value`, no PROJECT rows).
   - `validateCapPlan(c, rows)` — problems and notices per FR-004 (overrun
     milestone = notice, wording from §15.4).
   - `diffCapPlan(c, rows)` / `applyCapPlan` — per-field cmp; creation order
     PROJECT before children; deliverable/outcome/milestone created null-
     reported (never zero); absent collected as `missing`.
   - `diffCapProgress(c, rows)` / `applyCapProgress` — deliverable Yes/No/pct,
     outcome actual joined with its unit and progress recomputed (dir-aware,
     clamp 0–150), milestone status.
5. **UI** (`config-render.js` `renderImport` + `shell.html` `wireImport`):
   branch every unit-specific call on `impIsCap()`; counts line shows
   objectives · projects · deliverables · outcomes · milestones; receipt links
   to the owning function's pages via the existing nav (`fn:` + fn key).
6. **Info**: `c_import` gains a capability-scope section (own sheets, project
   dropdown, same rules underneath).

## Verification

Automated browser script (Playwright, page context): for every capability run
`diffCapPlan(c, parseCSV(capPlanTemplate(c)))` → assert zero changed/new/
missing; same via workbook build+read; same for progress. Then a mutation
test: change one target in the rows, assert exactly one change diffs and
applies. Full QA walk after.

## Constitution Check

- I: §16.4 records the agreed design (Setup→Import, own scope, own sheets,
  same parser/validation/id rules); the §15 model supplies the sheet list.
- II: DECISIONS gains the §15.12 closure note in the same change.
- V: nothing typed becomes a score; progress recomputed on arrival.
- VI: the flow, the three steps, the review table, the receipt and the
  workbook conventions are the unit import's, reused.
