# 019 · Strategy | Reporting split, and the plan as slides

**Version:** v3.39 · **Decisions:** §116 · **Status:** answered; built

Islam: *"the accessibility should have an option that differentiate the
strategy from the reporting — the strategy should be locked from the non SMO
but the reporting should be editable by who we grant the access so they can
submit. so we need this split in the roles and access table."* And: *"add the
access of downloading a presentation for the plan for the custodian and the
business unit owner through a button in the strategy panel."*

Settled from a mockup made of the real platform
(`design-mockups/access-strategy-reporting-split/`), confirmed 2026-08-26.

---

## 1 · What is asked

1. The Roles & access table must say — and control — strategy and reporting
   separately for a person's own unit and own supporting function.
2. Strategy authoring defaults to the office; **the SMO may deliberately open
   it to a role** (Islam's choice, against the recommendation, recorded).
3. Reporting grants decide who may enter figures, save drafts and submit —
   untouched by the strategy half.
4. A download button on the Strategy panel produces the plan as **editable
   PowerPoint slides** — plan content only, including the SWOT, with no
   reported figure — for the office, the BU owner, the custodian, and a
   function's head for their function.

## 2 · The shape

- Two new access keys, `a_unit_own_strat` / `a_fn_own_strat`, resolved by the
  five strategy pages (`u_found`, `u_anal`, `u_plan`, `k_found`, `k_proj`).
  **The old keys keep meaning the Reporting half**, which is what a stored
  grant actually governed — so no tenant's rights move and no migration runs.
- `mayAuthorPage()` asks the grant instead of the office; authoring another
  role's unit/function remains office-only (the other columns are not split).
- `mayArrange()` rides the Reporting half (§101 preserved) and follows the
  pane out when strategy is `none`.
- `mayDownloadPlan()` — office, or a holder (`owner`/`custodian`/`fnhead`)
  of the target, with the plan page visible. Client-side only: a download
  writes nothing.
- `src/pptx.js` builds the .pptx with `zipStore()` (no new dependency,
  offline); `sendFileBytes()` extracts the third copy of the blob dance.

## 3 · What proves it

`checks/strategy-split.py` (both ends, both directions, file torn open and
read, negatives asserted; proved able to fail three ways),
`scripts/test-authorize.js` §15 (six assertions that fail on the pre-§116
rules), the full check suite and `qa.py` green. See §116.3.
