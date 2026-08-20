# Tasks: Capability project import and export

- [ ] T001 [US1] `src/templates.js`: `CAPP_COLS`, `capPlanTemplate`,
      `capProgressTemplate`, `capFindById`.
- [ ] T002 [US1] `src/xlsx.js`: `capPlanWorkbook`, `capProgressWorkbook`,
      `capPlanFromWorkbook`, `capProgressFromWorkbook`.
- [ ] T003 [US2] `src/templates.js`: `checkCapFileShape`, `validateCapPlan`,
      `diffCapPlan`, `applyCapPlan` (+ create path, projects first).
- [ ] T004 [US3] `src/templates.js`: `diffCapProgress`, `applyCapProgress`.
- [ ] T005 [US1] `src/config-render.js` + `src/shell.html`: capability scope in
      the Import page (grouped dropdown, counts, download/upload/paste/apply
      branches, receipt).
- [ ] T006 `src/pageinfo.js`: c_import Info section for the capability scope.
- [ ] T007 Verify: idempotence for all 8 capabilities (CSV + workbook, plan +
      progress), one-field mutation diff, shape refusals, QA walk.
