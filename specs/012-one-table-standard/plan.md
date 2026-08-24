# 012 · Plan

**Spec:** `spec.md` · **Constitution:** v1.1.0 · **Status:** awaiting Islam's
answers to spec §6 before implementation begins (Principle I).

## Order, and why this order

`tablekit` is built **under the register first**, not beside it. The register
already carries the freeze, the columns chooser, the kebab, Add and Delete —
five of the seven — and every one of them was paid for with a real fault
(§69.19's sticky-on-the-row, §69.20's unreachable Delete, §71.2's jumping,
§73.1's class collision). Extracting from a page that works and asserting it
still works is a smaller risk than writing a component from the spec and then
retro-fitting the one page that already does the job.

1. **Extract.** Move the register's freeze, columns chooser and row menu into
   `tablekit`, behind `data-tablekit`. No behaviour changes. The register is
   measured before and after and must agree: same columns, same freeze offsets,
   same actions, same scroll behaviour.
2. **Row edit** (spec §2.1) on the register — the reversal, and the piece with
   no precedent anywhere in the platform.
3. **Search and sort** (§2.2, §2.3) on the register, where 33 rows make both
   worth having and testable.
4. **The other six**, one at a time, each driven before the next: Official BU
   list · Business units · Functions · Capabilities · Companies · Figure sets.
5. **Roles & access** gets the freeze alone (§4).

## What must not change

- The register's current behaviour, at every step. It is the one table people
  use daily.
- `POST /api/state` and `lib/authorize.js`. This is a screen change: every edit
  it offers is an edit that already exists, so **no new classification is
  needed** — and if any step seems to need one, that step is adding a capability
  and belongs in its own spec.
- The state graph. Column visibility and sort are `localStorage` (§25, §47.1).

## Risks, named

- **A shared component is where a class collision happens next** (XIV). Every
  class is `tk-` prefixed from the first commit, not tidied later.
- **Row edit is a new interaction pattern.** Nothing else in the platform edits
  one row inline. The nearest relative is the plan pane's pen (§70), which
  edits everything at once — the opposite. Expect the first draft to be wrong
  about where Save sits and how the row looks while open.
- **Sorting a table whose order is a setting** is the trap in §6.2, unanswered.
  Until it is answered, those two tables get search and not sort.
- **The columns map** has already caused one silent regression (§30.2). The
  merge-with-defaults rule is asserted by adding a column in the test and
  checking it appears for a map written before it.

## Definition of done

Spec §5, all six items, plus: the decisions document carries §79 in the same
commit as the code (Principle II), and this spec's status line moves to *built
and verified* with the version it shipped in.
