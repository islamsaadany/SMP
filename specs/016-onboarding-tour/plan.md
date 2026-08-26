# Implementation Plan: The onboarding tour

**Branch**: `claude/onboarding-flow-spec-v9g7x5` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/016-onboarding-tour/spec.md`

## Summary

A first-sign-in spotlight tour on demo data: two role stories (strategy
custodian; unit/function owner) held as data, one engine that dims the page
through an SVG-masked shade with one hole per target, self-walking Next/Back
cards, one exit through × asking *Don't show again* / *Skip for now*, replay
from the Knowledge base, all memory in `localStorage` — plus a build check
that walks every story as every role and fails when a target disappears.
The visual contract is mockup rev 4
(`design-mockups/onboarding-tour/2026-08-26_spotlight-tour.html`), whose
tour machinery (shade, rings, card placement, close prompt) is the reference
implementation to port, not re-invent.

## Technical Context

**Language/Version**: ES5-style browser JavaScript + CSS, matching every
existing `src/*.js` module (IIFE exposing one global); Python 3 for the check.

**Primary Dependencies**: none new. The engine joins `build.py`'s inline list
as `("TOUR","tour.js")` with `tour.css` in the CSS concatenation (beside
`chat.css`, concatenated late for the same source-order reason). The check
uses Playwright via the existing `qa-run.py` wrapper.

**Storage**: `localStorage` only — `smp.tour.<story>` = `"never"` (set by
finishing or *Don't show again*); `sessionStorage` `smp.tour.later` for
*Skip for now* (dies with the session, which is exactly its meaning). Nothing
in the state graph, nothing for `lib/authorize.js` to classify (spec FR-008).

**Testing**: `src/checks/tour.py` (new, FR-010) driven through `qa-run.py`;
`qa.py` stays green; `python3 build.py` byte-identical discipline.

**Target Platform**: the single built HTML file, over http(s) with a session
and over `file://` (replay only there — no sign-in exists to hook).

**Project Type**: feature inside the existing single-file prototype.

**Performance Goals**: no polling, no timers while idle; re-anchor work only
on paint/resize/scroll; a tour run adds zero server requests beyond what the
platform already makes.

**Constraints**: engine lives OUTSIDE the repainted region and never calls
`paint()` (§97's rule); anchors are selectors, never held nodes; never drawn
under `body.presenting`; offer waits for `land()` (§94.10); storage reads and
writes guarded so blocked site data fails quiet.

**Scale/Scope**: 2 stories × ~9 steps; one engine file, one CSS file, a story
data block, one KB entry, one check.

## Constitution Check

*GATE: evaluated before Phase 0, re-checked after Phase 1 design — PASS.*

- **I — Align before building**: decisions settled in chat, visual settled by
  mockup rev 4 with explicit sign-off ("proceed"). The mockup-first rule
  (reinstated 2026-08-24 in CLAUDE.md, superseding the constitution's retired
  amendment) is satisfied; the mockup is committed and published.
- **II — Decisions document is the contract**: the § entry is written when
  this lands on `main`; the reversal (interactive → self-walking) is recorded
  in the spec and will be recorded as a reversal in the §.
- **III — Edit the sources**: only `src/` files change (plus `build.py`'s
  lists); the built file is regenerated, never edited.
- **IV — Verify by walking**: the new check drives every story as every role;
  `qa.py` runs after; the check is proved able to fail before trusted (§94.5).
- **V — Derived, never stored**: no scores involved; the only stored thing is
  a screen preference, which Principle and §25 place in `localStorage`.
- **VI — Follow what the platform already does**: modal inertness and Escape
  handling follow `openModalHtml`'s patterns; the corner-feature gates follow
  the chat bubble (`body.presenting`, servable checks); the card follows the
  mockup, which was drawn in the product's own tokens.
- **VIII — Islam decides content**: custodian copy is rev 4's, approved;
  owner copy drafted at build and flagged for his approval before merge.
- **IX — One copy of a rule**: story selection reads `SMPRules.personRoles()`
  / `worldOf()`; the tour defines no role logic of its own.
- **X — The server decides**: the tour grants nothing and writes nothing;
  demo mode's save refusal is the existing guarantee (§21/§67), not a new
  mechanism.

No violations; Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/016-onboarding-tour/
├── spec.md
├── checklists/requirements.md
├── plan.md              # this file
├── research.md          # Phase 0 — integration points, resolved
├── data-model.md        # Phase 1 — story/step/storage shapes
├── quickstart.md        # Phase 1 — how to validate end to end
├── contracts/tour-api.md# Phase 1 — the engine's public surface
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
SMP-Project-Folder/src/
├── tour.js              # NEW — engine + STORIES data (one IIFE, global TOUR)
├── tour.css             # NEW — shade/ring/card/prompt styles (concat late)
├── build.py             # + ("TOUR","tour.js") tag; + tour.css in css concat
├── shell.html           # + <div id="tourdock"> outside #panel; + {TOUR} tag;
│                        #   + TOUR.onPaint() at end of paint() beside
│                        #   SEARCHSEL.wire()/CHAT.wireInbox(); KB entry via
│                        #   renderKB (config-render.js)
├── config-render.js     # renderKB(): the one replay entry
├── sync.js              # the offer hook inside land() (after first paint)
└── checks/tour.py       # NEW — every story × every role, provable-to-fail
qa-run.py                # unchanged — runs checks/tour.py too
```

**Structure Decision**: one new module + one new stylesheet, following the
`chat.js`/`chat.css` shape exactly (the platform's one prior corner feature
living outside the repainted region); stories live inside `tour.js` as data,
beside the engine that reads them, because nothing else reads them.
