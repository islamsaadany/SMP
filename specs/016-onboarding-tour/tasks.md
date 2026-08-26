---

description: "Task list for spec 016 — the onboarding tour"
---

# Tasks: The onboarding tour

**Input**: Design documents from `specs/016-onboarding-tour/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tour-api.md](contracts/tour-api.md),
[quickstart.md](quickstart.md)

**Tests**: this feature ships with a check because FR-010 requires one — a tour
keyed on a removed selector does not fail, it passes quietly (§51.11). The
check is written against the ENGINE before the stories are filled in, and is
**proved able to fail before any green run is believed** (§94.5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: US1 custodian first sign-in · US2 owner story · US3 replay

## Path Conventions

Sources live in `SMP-Project-Folder/src/`; checks in
`SMP-Project-Folder/src/checks/`. **Edit the sources, never the built file**
(Constitution III) — every task that changes behaviour ends with
`python3 build.py`.

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: the new files exist and reach the built platform.

- [x] T001 Create `SMP-Project-Folder/src/tour.js` as an empty IIFE exposing `window.TOUR` with the five contract exports as no-ops (`onPaint`, `offer`, `start`, `storyFor`, `state`), per `contracts/tour-api.md`
- [x] T002 [P] Create `SMP-Project-Folder/src/tour.css` with the token-based shade/ring/card rules ported from the mockup's stylesheet, plus the `body.presenting` suppression rule
- [x] T003 Register both in `SMP-Project-Folder/src/build.py`: add `("TOUR","tour.js")` to the inline tag list and `tour.css` to the CSS concatenation, after `chat.css` (source order matters — §69)
- [x] T004 Add `<div id="tourdock"></div>` to `SMP-Project-Folder/src/shell.html`'s static markup, OUTSIDE `#panel` and every painted region, and place the `{TOUR}` script tag beside `{CHAT}`
- [x] T005 Run `python3 build.py` and confirm the built file grows by exactly the new sources (no other diff) — the byte-identical discipline (Constitution III)

**Checkpoint**: the engine is in the product and does nothing.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the engine's mechanics, independent of any story's content.

**⚠️ No user story work can begin until this phase is complete.**

- [x] T006 Implement the guarded storage helper in `tour.js`: `smp.tour.<story>` in `localStorage`, `smp.tour.later` in `sessionStorage`, try/catch on both directions, **a throwing store reads as "marked"** so the tour fails quiet (spec edge case)
- [x] T007 Implement `storyFor(person)` in `tour.js` using `SMPRules.personRoles(SMPRules.worldOf(...))` only — no role string tested anywhere else in the file (Constitution IX); resolve `$own` from the same role list's `at`
- [x] T008 Implement the shade in `tour.js`: transparent full-cover click absorber plus the SVG `<mask>` with one hole rect per target and one ring rect per target — **all dim painted by the mask, never a second dim over a lit control** (the mockup's §68.10-family lesson)
- [x] T009 Implement card placement in `tour.js`: below → beside → above the LAST target, corner-dock as fallback, clearing every hole; translucent card per the mockup
- [x] T010 Implement step navigation in `tour.js`: press the real `[data-u]`, `[data-ms]`, `[data-sub2]` controls for a step's `{dest,tab,sec}`; **never call `paint()`** and never write shell state directly (research §2)
- [x] T011 Implement `onPaint()` re-anchoring (selectors re-resolved, shade/card re-placed) and wire it at the end of `paint()` in `shell.html` beside `SEARCHSEL.wire()` / `CHAT.wireInbox()`; add `resize` and `scroll` listeners
- [x] T012 Implement the card chrome in `tour.js`: step counter (`n of steps.length - 2`), progress dots, Back (absent on welcome), Next, and the × — **no Skip-tour control anywhere** (rev 4)
- [x] T013 Implement the close prompt in `tour.js` (replacing the card's content in place, never `confirm()` — §95): *Keep the tour* · *Don't show again* · *Skip for now*, with Escape opening the same prompt
- [x] T014 Implement demo entry/exit in `tour.js`: remember the pre-tour mode, `SYNC.setMode("demo")` on start, restore on EVERY exit path (finish, both close choices, Escape-close)
- [x] T015 Create `SMP-Project-Folder/src/checks/tour.py`: walks every story × every role it can be offered to, asserting per step — page/tab/section as declared, every target present and **visibly boxed via `getClientRects`** (not computed style — §68.10), rings over those boxes, card clear of every hole; plus Back from every step, all three prompt buttons, and the pre-tour mode restored
- [x] T016 **Prove the check can fail** (§94.5): misspell one target selector → red naming story/step/selector; set one step's `sec` wrong → red on the page assertion; restore both and record both failures in the commit message

**Checkpoint**: engine complete and provably checked; stories are now data.

---

## Phase 3: User Story 1 — A strategy custodian's first sign-in (Priority: P1) 🎯 MVP

**Goal**: a first-time custodian is walked through the nine settled steps on demo data.

**Independent Test**: sign in as a custodian-only person in a fresh browser; the tour offers itself, all nine steps walk with Back working from each, and closing at any point lands on their own data with nothing written.

- [x] T017 [US1] Add the `custodian` story to `STORIES` in `tour.js` — nine steps with `$own` destinations, the tab/section keys, target selectors and rev 4's approved copy (data-model §1)
- [x] T018 [US1] Implement `TOUR.offer(person)` in `tour.js` per the contract's six conditions, and call it from `land()` in `SMP-Project-Folder/src/sync.js` after its paint (research §5 — never over the boot skeleton)
- [x] T019 [US1] Extend `checks/tour.py` with the custodian story's specifics: step 7 opens Performance with tab + headline numbers lit, step 9 explains Presentation with **no menu opened**, and the last ordinary step reads `9 of 9`
- [x] T020 [US1] Run `python3 build.py`, then `qa-run.py checks/tour.py` and `qa-run.py qa.py` — both green, no console errors anywhere
- [ ] T021 [US1] Verify zero writes: a full tour on a live tenant leaves `/api/state` byte-identical (SC-004)

**Checkpoint**: US1 is the MVP — shippable on its own.

---

## Phase 4: User Story 2 — A unit or function owner's first sign-in (Priority: P2)

**Goal**: owners get the same shaped story addressed to them, following a function's own sections where the person owns a function.

**Independent Test**: sign in as a unit-owner-only person, then as a function owner; every lit control exists for that role and a function's walk uses its own sections.

- [ ] T022 [US2] Draft the `owner` story's copy and **put it to Islam for approval before merge** (FR-012, Constitution VIII)
- [x] T023 [US2] Add the `owner` story to `STORIES` in `tour.js`, resolving a function's own sections (Overview · Projects/Plan per `fnPlansInPillars`) rather than a unit's (§59, §53)
- [x] T024 [US2] Extend `storyFor()` mapping so `owner` and `fnhead` both reach it, custodian still winning when both are held (data-model §4)
- [x] T025 [US2] Extend `checks/tour.py` to walk the owner story as a unit owner AND as a function owner — a unit and a function are the same product, and only asking both finds the drift (§53.5)
- [x] T026 [US2] Run `build.py`, both sweeps green

**Checkpoint**: both stories work independently.

---

## Phase 5: User Story 3 — Replaying the tour (Priority: P3)

**Goal**: anyone can restart their story from the Knowledge base.

**Independent Test**: choose *Don't show again*, sign out and in (no offer), open the Knowledge base, start the tour — it runs in full.

- [x] T027 [US3] Add the replay entry to `renderKB()` in `SMP-Project-Folder/src/config-render.js` — one short section with a `[data-tour-replay]` button, absent when `storyFor()` returns null (FR-009)
- [x] T028 [US3] Wire the button to `TOUR.start(TOUR.storyFor(viewer))`; replay ignores stored marks and writes none until the person closes again
- [x] T029 [US3] Extend `checks/tour.py`: with a `never` mark set, the offer stays silent AND the KB entry still starts the tour — **assert both ends**, or a build that lost the entry passes (§90's rule)
- [x] T030 [US3] Run `build.py`, both sweeps green

**Checkpoint**: all three stories functional.

---

## Phase 6: Polish & cross-cutting

- [ ] T031 [P] Walk `quickstart.md` end to end by hand, including the `file://` no-auto-offer path, the projector suppression, and the blocked-site-data path
- [x] T032 [P] Sweep the tour's own surfaces for contrast in both themes (the card, the prompt, the ring on both palettes) — §38.5's family, and a new surface has never been measured
- [x] T033 Write the decisions-document § in `SMP-Project-Folder/DECISIONS-AND-LOGIC-vX.Y.md`: the five decisions, the **reversal** (interactive → self-walking) recorded as a reversal, and the costs (Constitution II)
- [x] T034 Update `IMPLEMENTATION_PROGRESS.md` (move from "Agreed, not built" to "Built and verified") and `CLAUDE.md`'s rules block if this establishes a new pattern — in the same commit as the code
- [ ] T035 Bump the version: filename, `index.html`'s link, `sw.js`'s `SHELL` **confirmed against `git show origin/main:sw.js` immediately before pushing** (§94.16), `vercel.json`, `scripts/dev-server.js`, and regenerate `db/seed-state.json`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: needs Phase 1; **blocks every story**. T016 gates trust in everything after it.
- **Phase 3 (US1)**: needs Phase 2. The MVP.
- **Phase 4 (US2)**: needs Phase 2; independent of US1 except that both edit `STORIES` in `tour.js` (same file — not parallel with T017).
- **Phase 5 (US3)**: needs Phase 2 and at least one story to replay.
- **Phase 6**: needs whatever stories are shipping.

### Parallel opportunities

- T002 with T001 (different files).
- T031 with T032 (different activities, no shared file).
- US2's copy drafting (T022) can run while US1 is being built — it is a document, not code.
- Everything else in `tour.js` is one file: sequential by construction.

---

## Implementation Strategy

**MVP** = Phases 1–3 (T001–T021): the custodian story, offered on first
sign-in, with the check that keeps it honest. Shippable alone.

**Then** US2 (owner), then US3 (replay) — each a merge of its own with the
version and document tasks from Phase 6 applied at the merge that ships.

## Notes

- Every task that changes behaviour ends with `python3 build.py`; the built
  file is never edited.
- The engine never calls `paint()` and never holds a node — the two rules the
  whole design rests on.
- Copy is Islam's; T022 is a real gate, not a formality.
