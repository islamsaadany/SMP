# Implementation Plan: The rail on a unit's My reporting

**Spec**: `spec.md` · **Sources touched**: `src/group-render.js`
(`renderReport`), `src/pageinfo.js` (`u_report`)

## Design

1. In `renderReport`, keep the missing-notes banner, report bar, Key
   Objectives section and owner's-note block untouched.
2. Extract the per-pillar measure/tactic entry tables into
   `reportPillarPane(u, p, pi, may)` (content identical to today's accordion
   body, plus the pane title bar the other rails use: code + name, kind ·
   owner meta, tally pill).
3. Build the rail from `u.items` with `data-urail="ukey|code"` rows (selection
   already wired in the shell and shared with Performance/Strategy), tally =
   asked items given (measures + due tactics), sub-line per capability
   reporting ("Complete" / "N still to enter" / "Not asked this cycle").
4. `splitOrPane`-style branch below two items.
5. Info: replace the accordion-implying wording in `u_report` if any; add the
   rail bullet.

## Constitution Check

- I/VI: §15.12 records the move as agreed and held back only for sequencing;
  the rail is the platform's established pattern (built on five pages).
