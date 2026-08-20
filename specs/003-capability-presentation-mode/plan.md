# Implementation Plan: Presentation mode for a supporting function

**Spec**: `spec.md` · **Sources touched**: `src/present.js`,
`src/group-render.js` (Present button on `renderFnPerformance`),
`src/shell.html` (open wiring), `src/pageinfo.js` (reuse `u_present` Info via
`k_perf`? — no: Info stays page-level; add nothing new)

## Design

1. `deckSlidesFn(fk)` in `present.js`: cover → per capability: capability
   cover (definition as the sub) → aiming-at slide (definition + KO targets
   only, weight column) → standing slide (headgrid of up to three readings;
   KO cell only where KOs exist) → projects overview table (project,
   deliverables %, outcomes %, performance, milestones done/total) → per
   project: lead-in cover (owner, span, three stats) + deliverables table
   (`data-split`) + outcomes table + milestones table → function-level "what
   needs attention" → note slide → thank you.
2. `openDeck(u)` refactor: extract the chrome part (`openDeckWith(title,
   slidesHtml)`); `openDeck(u)` and `openDeckFn(fk)` call it. Note key:
   `REVIEW.note["fn:" + fk]` for the function's closing note.
3. Button: `renderFnPerformance` gains the same `pageact`-style Present button
   (`data-present-fn`), wired in `wire()` beside `[data-present]`.
4. Reuse `dPct`, `dBand`, existing slide classes; milestone status words match
   `msPill` wording; an overrun milestone's finish cell carries the existing
   date-tint treatment (plan-against-plan, §15.5).

## Constitution Check

- I: §15.12 records the item as agreed; A13 dictates the shape (the unit's
  deck with the capability's content) — nothing visually new is invented.
- VI: one deck system; the fn deck adds content shapes only.
