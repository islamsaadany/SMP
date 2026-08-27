# Spec 021 — Fill the gaps

**Status:** agreed 2026-08-27 (Islam, in session), mockup signed off
(`design-mockups/gap-fill/2026-08-27_gap-fill-states.html`, published as an
artifact and approved with the words "great agreed on this build"; the matrix
restyle approved separately from its screenshot: "I really like that design
for the access table … enhance it in this build as well").

## 1 · What this is

A third level of Strategy access between View and Edit: **Fill gaps**. A
role holding it (typically the Strategy custodian and the Business unit
owner, on the unit or function they hold) may write into the plan **only
where the plan currently holds nothing** — a missing target, direction,
compile rule, owner, project date, a tactic that names no quarter, a missing
aspiration — and may never touch, move, or delete anything already written.

A fill is **pending** until the Strategy Office confirms it: still editable
by fill-grant holders, marked amber everywhere it shows. Confirming removes
the mark and the value becomes an ordinary settled one, the office's alone.
Performance is computed only over confirmed inputs; reporting and drafts
flow freely; Submit waits while a score-bearing field is pending.

## 2 · The grant (lib/rules.js)

- `STATE_RANK` becomes `{none:0, view:1, fill:2, edit:3}`. Fill implies
  view everywhere visibility is asked (`!== "none"`); nothing that asks
  `=== "edit"` widens.
- The state is **offered only on the two Strategy halves**
  (`a_unit_own_strat`, `a_fn_own_strat`) — the matrix cell for every other
  area keeps its two toggles.
- `mayFillPage(w, person, pageKey, target)`: pageKey must be a strategy
  page; the person must **hold** the target (same `ownsIt` walk as
  `mayAuthorPage`); the resolved grant must be exactly `fill`. The office
  never fills — their writes settle (no pending mark), so `mayFillPage`
  is false for them and their path is unchanged.

## 3 · What counts as a gap

*A gap is a place holding nothing; writing the first value into it is
filling; touching anything already there is authoring.* Empty means
null/undefined/whitespace — a typed `0` is a value (§104.10).

`GAP_FIELDS` in `lib/rules.js`, one definition for screen, server, deck:

| Row kind | Fillable when empty |
|---|---|
| unit / function (page `u_found`) | `aspiration` |
| key objective (`u_found`) | `dir`, `target`, `target3y`, `compile` |
| key measure (`u_plan`) | `dir`, `target`, `compile` |
| tactic (`u_plan`) | `owner`; **quarters as a group** — fillable only when none of q1–q4 is marked (§119.1: a single blank quarter is saying something; four blanks say nothing) |
| capability key objective (`k_found`) | `dir`, `target`, `compile`, `weight` |
| project front matter (`k_proj`) | `owner`, `start`, `end` |

**Deliberately not in v1** (flagged, not silently omitted): SWOT quadrants
(filling one means adding rows, and "no rows added or removed in this
mode" is Islam's explicit decision — the two rules collide there, so the
quadrant stays the office's); deliverable/outcome/milestone fields; End in
mind (optional by design, §45.2 — not a gap).

**Never in fill mode:** adding or removing rows, renaming anything,
reordering (its own grant, §101, untouched), collaborators (§50.2: they
decide who may report), anything on the group's own pages.

## 4 · The pending mark

`row.pend = { <field>: {by, at} }` — per field, on the row it marks (the
unit object itself for `aspiration`; the virtual key `quarters` covers
q1–q4 as one). Stored as an **absence**: confirming deletes the key, the
last key leaving deletes `pend` (§50.6). Rows persist unknown keys through
each table's `extra` JSONB (`lib/state-io.js`), so **no migration**.
`by`/`at` are informational (the chip and its hover); `change_log` remains
the record of identity.

## 5 · The server (lib/authorize.js)

A **gap pass runs before the existing diff**, per row matched by id, per
`GAP_FIELDS` field. It classifies each transition, applies the accepted
ones to a **clone of the stored side**, and hands the clone to the
existing classifier — so anything it does not accept falls through and is
judged exactly as today (office-only). Transitions, where `s`/`i` are the
stored/incoming value and `sp`/`ip` the pending marks:

- blank(s) ∧ no sp ∧ value(i) ∧ ip → **fill** → `gapFill`
- sp ∧ ip → **amend while pending** (any value, blank included) → `gapFill`
- sp ∧ no ip ∧ blank(i) → **unfill** (their own undo) → `gapFill`
- sp ∧ no ip ∧ value(i) → **confirm** (value kept or corrected) → `gapConfirm`
- anything else — filling without the mark, marking a settled value
  pending, touching a settled value — **falls through to the existing
  classification** and is refused to non-office as today.

Verdict: `gapFill` passes if `mayAuthorPage` **or** `mayFillPage` answers
for that page and target; `gapConfirm` needs `mayAuthorPage`. Refusals
name the grant and whose act confirming is.

## 6 · The screen

- The pen is drawn for fill-grant holders too; pressing it opens **fill
  mode**: only gap fields render as inputs (red dashed when empty, amber
  when pending); every settled value stays text; no add rows, no ×, no
  drag handles, no name fields. A mode bar states the contract.
- One builder (`gapCell`) draws a gap-fillable cell in its three states
  for all row kinds — no second way to draw one (§96's lesson).
- The fill setter writes the value **and stamps the mark**; clearing the
  box removes both (unfill). An office edit through the normal pen
  **deletes the mark** on that field — correcting is confirming.
- Read mode: a pending value wears an amber chip naming who filled it
  (date on hover); the office also sees a **Confirm ✓** beside it. A
  count — "N awaiting confirmation" — sits on the strategy pane band,
  drawn only when N > 0 (§41's budget), for office and fill holders.

## 7 · Scores, submit, deck

- `GAP_SCORE_FIELDS = dir · target · compile · weight · quarters` — the
  fields a score reads. A row with one of them pending **scores null**:
  excluded from `scorableMeasures`, `koScore`, `capKOScore`, and
  `tacticPlanned` returns null (the not-yet-due shape). The row shows a
  dash with the reason on hover, and the table carries "N not counted
  yet — awaiting target confirmation", only when there is one (§106).
- **Reporting and Save draft are never held up.** Submit is refused while
  any score-bearing field on that subject is pending — a third entry in
  `submitBlockers`/`submitRefusal` (§105's one function for both sides),
  wording that names the rows and sends the person to the office, since
  only the office can clear it. A pending owner or date never blocks.
- The deck prints a pending value as the value plus "(pending)" — never
  `Missing` (answered, not settled).

## 8 · The matrix (approved restyle, §41's budget)

`stateCell` gains the third toggle on the two Strategy halves only: a pen
over a dashed line, amber when lit (`st-fill`), between the eye and the
pen. Legend gains "may fill what's empty". The approved cosmetic pass on
the acgrid: lit toggles tinted with a coloured border instead of a solid
fill, each toggle its own rounded chip with a small gap, hairline row
separators with roomier padding.

## 9 · Proof

- `scripts/test-authorize.js`: fill accepted for the fill grant; the same
  save refused with the grant at view; a settled value overwritten by a
  fill holder refused; confirm refused to the fill holder and accepted
  for the office; amend-while-pending accepted; unfill accepted — each
  asserted through a real classify+verdict round, and each proved able to
  fail by inverting the rule under test (§94.5).
- `src/checks/gap-fill.py` (over HTTP where needed): drives fill mode as
  a custodian — presses the pen, fills a gap, reads the DATA back (§96),
  sees the pending chip, confirms as the SMO, watches the chip go and the
  score appear; asserts the dash and its reason while pending; asserts
  Submit refused with the pending row named and Save draft alive; asserts
  the absences — no add row, no ×, no name field, no handle in fill mode
  (§94.2). Proved able to fail against the pre-build.
