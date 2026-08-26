# 019 · Strategy | Reporting split, and the plan as slides

**Version:** v3.40 · **Decisions:** §117 (follow-ups §119, v3.42) · **Status:** answered; built

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
`scripts/test-authorize.js` §15 (six assertions that fail on the pre-§117
rules), the full check suite and `qa.py` green. See §117.3.


---

## 4 · Follow-ups, §119 (v3.42)

From using it, the day it shipped:

1. **Missing, in bold red** on the downloaded plan wherever a plan fact is
   owed — and the Foundation, SWOT and capability slides are drawn even when
   empty, because a skipped slide says nothing is missing.
2. **The tactics table is four quarter columns** with a mark in each quarter
   in action.
3. **The pillar rail opens collapsed**, with the rows-to-check alarm surviving
   the collapse.
4. **The knowledge base is the office's** (reversing §30/§37) — `when:
   inOffice()`, not a matrix cell. Open consequence: the tour's replay button
   is no longer reachable by anybody it fits.
5. **Arrange/download on a capability's Projects pane** could not be
   reproduced — both draw correctly on live production for the office and for
   a function head — and is asked rather than fixed (§119.5).


---

## 5 · Follow-ups, §123 (v3.46)

6. **A tactic with no quarter at all** is ticked in **bold red in all four**
   quarter columns; the four columns keep the template's shape and nothing is
   merged. A tactic that names some quarters is untouched (§119.1 stands).
   The first build merged one `Missing` across the four and was turned down.
7. **Every plan deck closes on a Thank you slide**, the shape `present.js`
   already ends on.
8. **The Function overview carries the download too** — the other section of a
   capability function's strategy tab. It first rendered invisible (§70: a
   card-corner control in a worded bar), caught by clicking rather than
   querying.
