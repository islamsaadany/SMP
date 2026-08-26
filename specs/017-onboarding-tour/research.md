# Research: integration points for the onboarding tour

Every unknown in the Technical Context, resolved by reading the sources
(paths relative to `SMP-Project-Folder/src/` unless noted). No NEEDS
CLARIFICATION remains.

## 1 · Where the engine lives, and how it survives paint()

- **Decision**: `tour.js` is an IIFE exposing `window.TOUR`, mounted in a
  `#tourdock` element in `shell.html`'s static markup OUTSIDE `#panel` and
  outside every region any painter rewrites — the same placement argument as
  the chat dock. `paint()` already ends with `SEARCHSEL.wire()` (shell.html
  ≈1417) and `CHAT.wireInbox()` (≈1423); a `TOUR.onPaint()` call joins them,
  which is the re-anchor hook (recompute holes/card from stored selectors).
  `resize` and `scroll` listeners re-run the same placement.
- **Rationale**: §97's hard rule — nothing in a corner feature ever calls
  `paint()`, or it destroys what the person is doing; and §35/§30.1's family —
  hold selectors, never nodes, because every paint replaces the nodes.
- **Alternatives considered**: MutationObserver on `#panel` (rejected: the
  platform already has the explicit end-of-paint convention; an observer is a
  second, racier copy of the same signal).

## 2 · Driving the navigation

- **Decision**: the engine navigates by clicking the REAL controls
  programmatically: destination buttons carry `data-u` (paintUnits,
  shell.html ≈978), tabs carry `data-ms`, section buttons carry `data-sub2`
  with `CURSEC` state (≈1352). Each step declares `{dest, tab, sec}` keys and
  the engine presses whichever of them is not already current, then waits for
  the paint it caused (the `onPaint` hook fires) before placing spotlights.
- **Rationale**: the real handlers already maintain `current`/`currentSub`/
  `CURSEC`, reachability and repainting; a parallel navigation path would be
  a second copy of that rule (Constitution IX in spirit) and would drift.
- **Alternatives considered**: setting `current`/`currentSub` directly and
  calling paint (rejected: the tour must never call `paint()`, and reaching
  into shell state couples the engine to internals the buttons already wrap).

## 3 · Demo data in and out

- **Decision**: `SYNC.setMode("demo")` on Start; the pre-tour mode is
  remembered and `SYNC.setMode(<previous>)` restores it on every exit path
  (finish, both close choices, Escape-close). `SYNC.setMode` is already
  exported (sync.js ≈464) and `isDemoMode()` already refuses every save
  (≈183, ≈369) — the tour adds no write path and rides that guarantee.
  The demo banner shows whenever demo mode is on; nothing extra to draw.
- **Rationale**: §67 — demo writes nothing, and the Demo BUTTON being the
  SMO's (§69.15) is about the control, not the mode: the tour is its own
  door into a read-only view, exactly as *Clear project* is the SMO's
  worked example of the same mechanism.
- **Alternatives considered**: touring the person's own tenant (rejected by
  Islam — decision 4); hydrating a private copy of DEMO (rejected: a second
  dataset path beside `datasetFor()` is a second copy of a rule).

## 4 · Choosing the story

- **Decision**: `SMPRules.personRoles(SMPRules.worldOf(<graph>), person)`
  gives the person's role list; the story map is
  `custodian → "custodian"`, `owner`/`fnhead` → `"owner"`, custodian winning
  when both (spec assumption). The person is `window.VIEWER`'s register row
  (offline) / the signed-in person (`sync.js`'s `person`, who sets `VIEWER`
  on the deployed product) — one code path, because sync already funnels
  both into `VIEWER`.
- **Rationale**: Constitution IX — the tour defines no role logic; twelve
  places testing a role string is the §55 fault this avoids.
- **Alternatives considered**: a per-story grant in the access matrix
  (rejected: the tour grants nothing, so the matrix has nothing to say).

## 5 · When the offer fires

- **Decision**: from `land()` in `boot()` (sync.js ≈574) — the one idempotent
  door every boot path passes (§94.10) — after its paint, and only when: over
  http(s) with a session (`person` set), `!body.presenting`, storage readable,
  no `smp.tour.<story>` mark, no session `smp.tour.later` mark, and the
  person's roles map to a story.
- **Rationale**: §94.10 made every exit from boot() go through `land()`
  precisely so late-comers like this have one door to stand behind; offering
  before it would spotlight the skeleton.
- **Alternatives considered**: offering from `chromeFor()` (rejected: that
  function is about the chrome and already carries §69.15's warning about
  gates that fail open).

## 6 · Storage semantics

- **Decision**: `localStorage["smp.tour."+story] = "never"` written by
  *Don't show again* AND by finishing; *Skip for now* writes
  `sessionStorage["smp.tour.later"] = "1"` (a new sign-in is a new session —
  "offers itself again next sign-in" for free). Every access in one guarded
  helper (try/catch both directions); a throwing storage reads as "marked",
  so the tour fails quiet and never nags (spec edge case).
- **Rationale**: §25/§47.1 (screen preferences live in localStorage), and the
  spec's chosen cost: per-browser memory, new device replays once.
- **Alternatives considered**: server-side flag (rejected in spec — a save
  for the authoriser to classify, for a fact that costs nothing to forget).

## 7 · The spotlight mechanics

- **Decision**: port mockup rev 4's machinery verbatim in structure: a
  transparent full-cover click-absorber; an SVG `<mask>` shade painting ALL
  dim with one black rect per target; gold ring rects; a translucent card
  placed below/beside/above the LAST target, corner-docked only when no
  candidate clears every hole. The close prompt replaces the card's content
  in place (never a browser `confirm()` — §95).
- **Rationale**: the mockup is the signed-off visual contract, and its two
  hard-won lessons are load-bearing: the double-dim washes out a lit control
  (§68.10 family), and one box-shadow cutout cannot light a section button
  and its content together.
- **Alternatives considered**: four dim rectangles (rejected: cannot hold two
  holes); elevating lit elements above the dim (dropped with the do-steps —
  nothing needs to be clickable inside a spotlight any more).

## 8 · The Knowledge base entry

- **Decision**: one entry in `renderKB()` (config-render.js ≈2703): a short
  section with a button `data-tour-replay`; wiring lives in the KB page's own
  wiring path, calling `TOUR.start(<story for this viewer>)`. Replay ignores
  stored marks and does not change them until the person closes again
  (spec FR-009).
- **Rationale**: v3.5's rule — the knowledge base is where explanation lives;
  and §90's — two buttons do not deserve permanent furniture elsewhere.

## 9 · The check (provable-to-fail)

- **Decision**: `src/checks/tour.py`, run through `qa-run.py`, opening the
  BUILT file over `file://` (the tour engine is client-only; no server stub
  needed). For each story × each role that can be offered it: switch the
  viewer via the SMO's `#asWho` simulation (the same mechanism `qa.py`
  leans on), call `TOUR.start(story)`, then step through asserting per step:
  the declared page/tab/section is the one on screen (`aria-selected`,
  `CURSEC` via DOM), every target selector resolves to a VISIBLE element
  (a real box via `getClientRects`, §68.10's lesson — never computed style
  alone), the ring rects sit over those boxes, and the card intersects no
  hole. Also: Back from every step, the close prompt's three buttons, and
  that ending restored the pre-tour mode. **Proof it can fail**: run once
  with a target selector deliberately misspelled and once with a step's
  `sec` wrong, and show both runs red, before the green run is believed.
- **Rationale**: §51.11 (a check keyed on removed markup passes quietly) is
  the whole reason this feature ships with a check; §94.2 (a check that only
  looks for something present cannot see a shut door) is why it walks every
  role, not just one.
- **Alternatives considered**: asserting against the mockup (rejected: the
  mockup is a replica; the contract is the real controls).

## 10 · What the tour deliberately does NOT do

- No interactive do-steps (reversed decision, spec table row 2).
- No opening of real menus (Presentation's stays shut — rev 4).
- No auto-offer from `file://` (no sign-in exists there).
- No SMO / CEO / contributor stories in this release (spec assumption; the
  backlog carries them).
- No server involvement of any kind.
