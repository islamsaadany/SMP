# Tasks: Capability project import and export

- [x] T001 [US1] `src/templates.js`: `CAPP_COLS`, `capPlanTemplate`,
      `capProgressTemplate`, `capFindById`.
- [x] T002 [US1] `src/xlsx.js`: `capPlanWorkbook`, `capProgressWorkbook`,
      `capPlanFromWorkbook`, `capProgressFromWorkbook`.
- [x] T003 [US2] `src/templates.js`: `checkCapFileShape`, `validateCapPlan`,
      `diffCapPlan`, `applyCapPlan` (+ create path, projects first).
- [x] T004 [US3] `src/templates.js`: `diffCapProgress`, `applyCapProgress`.
- [x] T005 [US1] `src/config-render.js` + `src/shell.html`: capability scope in
      the Import page (grouped dropdown, counts, download/upload/paste/apply
      branches, receipt).
- [x] T006 `src/pageinfo.js`: c_import Info section for the capability scope.
- [x] T007 Verify: idempotence for all 8 capabilities (CSV + workbook, plan +
      progress), one-field mutation diff, shape refusals, QA walk.
