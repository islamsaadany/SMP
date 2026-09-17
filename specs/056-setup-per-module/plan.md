# Implementation Plan: Setup per module, and the client's own setup on the landing

**Branch**: `claude/blissful-cray-o5bi2r` (feature `054-setup-per-module`)
**Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) — signed off 2026-09-15
("as drawn for all four", then "ok" to the landing-line storage, then "ok
signed off" to the Overview's fate).
**Mockups**: `design-mockups/module-setup/2026-09-15_setup-per-module.html`
(the four frames) and `design-mockups/module-setup/2026-09-15_overview-fate.html`
(three frames), both published as artifacts and signed off (constitution I).
The two Insights pages and the Client rail are drawn in the first; nothing
else in this plan draws a screen that was not signed off. **Research**:
[research.md](./research.md) — the four plan-stage questions, answered from
the sources.

## Summary

The one Setup page inside Strategy becomes **one Setup per module plus a
Client group on the landing**. The pages are the existing pages, moved and not
rewritten: each def in the frozen shell learns which module owns it, the rail
draws the module the document is stamped with, and the route serves Setup for
any module from the spine. The landing gains a Client setup block (Super user
only) and a *Your modules* list carrying a line each module chose on its own
Landing line page. Insights gets its first two pages of its own — a one-column
access table and the Landing line — both drawn by the frozen shell from what
the server stamps on the document, so a module still supplies its facts in
`MODULE_DEF` and nowhere else. The Setup Overview is deleted, because both of
its halves are already on the landing (§148, §200). No schema change, no
migration: the landing-line pick rides `org.extra` and a module's grant rides
`access_grants` under the key it declared.

## Technical Context

**Language/Version**: the frozen product's ES5 sources under
`SMP-Project-Folder/src/` (assembled by `build.py`, carried to
`smp-app/public/shell.js` by `scripts/build-shell.mjs`) and the Next app's
TypeScript (`smp-app/lib`, `smp-app/app`, `smp-app/modules`).
**Primary Dependencies**: none new.
**Storage**: Postgres, the shared schema — `org.extra` for the landing-line
pick, `access_grants` for a module's grant. **No new column, no migration**,
and both proved on a real Postgres rather than claimed (§172: "no migration"
has been claimed wrongly here before).
**Testing**: the frozen checks through `qa-run.py` with `SMP_CHROME` set,
against the built file over `file://` AND the served app (`SMP_BASE`), because
this change is different on the two stacks by design (research R2's table);
the app's checks (`npm run check:*`) on a throwaway Postgres 16; every new
assertion red first from the SOURCES (§276), never from an edited built file.
**Target Platform**: the Next app on Vercel is production (§332); the built
file is the offline contingency copy (§306) and must keep its single rail.
**Constraints**: the frozen `lib/rules.js` gains no module key (§335); the
module seam grows by nothing (§355); typing on any Setup page never repaints
(constitution XV); a rail's fold state stays keyed by group key (§30.2).
**Scale/Scope**: one shell file, one route, four lib files, one React
component, two new shell pages, one deleted page, ~8 checks rewritten, one
new check.

## Constitution Check

- **I. Align before building** — both mockups signed off; the two screens
  this plan adds that the first mockup draws only in outline (the Client rail
  heading, the Strategy Landing line page's choices) are the drawing's own
  shapes with the drawing's own words; anything beyond that stops for a
  mockup.
- **II. The decisions document is the contract** — §359 is written in the
  commit that lands step 2, and the reversal of spec 046 §4.5/§4.4 is already
  recorded in that spec.
- **III. Edit the sources, never the built file** — every frozen change is in
  `SMP-Project-Folder/src/`, rebuilt by `build.py`, re-carried by the four
  generators; `checks/generated-in-step.mjs` and `checks/built-in-step.py`
  both green before any push.
- **IX. One copy of a rule** — a module's areas and lines are declared once
  in `MODULE_DEF` and reach the browser stamped on the document; the rail's
  membership is the `mod` field on the def and nothing else; the landing line
  is one function read by the card and the landing.
- **X. The server decides** — a module's grant is enforced at the route, the
  landing-line pick and the grant are written through the authoriser, and
  the Client setup block is drawn from the seat the door resolved.
- **XVI. A check that measures the wrong thing passes** — every assertion
  here is written at both ends and falsified from the sources before its
  green run is believed; the list is in §6 of the spec and step by step
  below.

## Project Structure

```text
specs/056-setup-per-module/
├── spec.md          # signed off
├── research.md      # R1–R5, the plan-stage answers
├── plan.md          # this file
└── tasks.md         # /speckit-tasks, not written here
```

Sources touched (spec §8, confirmed by reading):

```text
SMP-Project-Folder/src/shell.html       SUBS defs gain `mod`; SETUP_GROUPS gains
                                        access + landing; setupRail filters;
                                        menuHTML's gear; Overview def deleted;
                                        two Insights defs
SMP-Project-Folder/src/config-render.js renderOverview() deleted; renderModuleAccess(),
                                        renderLandingLine() added
SMP-Project-Folder/src/welcome.js       untouched (frozen landing keeps its rows)
lib/authorize.js                        GROUP.landing classified `setup` + in gExtra
lib/rules.js                            a_setup's note only (no key added, §335)
smp-app/lib/modules.ts                  whereOf, MODULE_DEF.lines, landingLine(),
                                        moduleRows() reads it
smp-app/lib/shell.ts                    data-modules stamps areas + lines
smp-app/lib/landing.ts                  Landing gains modules[] and clientSetup
smp-app/lib/access.ts (new)             mayOpenModule() — the route's gate
smp-app/app/(platform)/[slug]/[...rest]/route.ts   Setup served from the spine;
                                        the module gate
smp-app/app/(platform)/[slug]/Welcome.tsx          Client setup block, Your modules
smp-app/app/(platform)/landing.css      the two new blocks, from the mockup's tokens
smp-app/modules/strategy/index.ts       header comment corrected (Setup no longer arrives)
```

## Phases — the order of the work, each red first

Spec §9's order, made concrete. Each step ends with its checks green on both
stacks and is a commit of its own; nothing is pushed to `main`.

### Step 1 · The Overview goes (spec §9.1, signed off)

- Delete the `overview` def, `renderOverview()`, its CSS, and the two checks
  that measure it; `primary` moves to `cycle` (menuHTML already falls back
  to it). `attentionRows()` and `attentionByPage()` stay — the landing and the
  rail's pills read them.
- **Prove**: `welcome.py` asserts the office's rows are `attentionRows()`
  row for row (it already does) and gains the cycle column assertion from
  `setup-overview.py`'s only assertion worth keeping; `setup-pages.py` asserts
  the gear lands on Reporting cycle; the Overview asserted ABSENT at its old
  address (a 404 through the shell's own not-found, never a blank pane).
- Red first: the `primary` move alone, without the deletion, reddens the
  absence; the deletion without the move reddens the landing assertion.

### Step 2 · A def knows its module, the rail draws by it (spec §9.2)

- `mod` on every def in `SUBS.manage`/`SUBS.setup`: `"strategy"` on the cycle
  and measurement pages, `null` on the eight Client pages (people, mainbu,
  units, companies, fns, caps, brand, kb), and `SETUP_GROUPS` gains `access`
  and `landing` after `meas`. Terminology stays `meas`/`strategy` (spec §2.2).
- `setupRail(defs, activeKey)` reads `data-module` off the document and
  filters by research R2's table; an unstamped document with no server draws
  everything. The rail head says `<Module> · Setup` or `Client · Setup`.
- `whereOf()`: `setup` after a module word returns that module; the route
  serves `shellDocument()` for both shapes **itself**, before `serverFor`.
  `shell/route.js` writes `/<client>/<module>/setup/<page>` inside a module
  and `/<client>/setup/<page>` on the spine; `doorHref()`'s `setup` door
  takes the spine shape.
- `menuHTML()`'s gear: drawn inside a module, opening that module's first
  page; not drawn on the landing (the landing is React and draws no gear
  today, so this is an absence to assert rather than a removal).
- The Client rail gets a way back to the landing as its head's own link.
- **Prove** (new `checks/setup-per-module.py`, at Next through `SMP_BASE`):
  Strategy's rail holds exactly the `mod:"strategy"` defs, asserted as
  agreement with `setupDefs()` filtered, never a typed list; the spine rail
  holds exactly the `mod:null` defs; **over `file://` the rail holds every
  def in one list** (the contingency copy, §306); every moved page, opened at
  its new address, still writes what it wrote (§96: five pages driven, the
  stored graph read back); `setup-search.py` finds a Client page from a
  Client rail and does NOT find it from Strategy's (both ends); the fold map
  keys unchanged (`smp.setup.rail` read back after a fold, §30.2).
- Rewritten, never loosened (§218): `setup-pages.py`, `setup-rail.py`,
  `setup-header.py`, `setup-search.py`, `setup-sticky.py`,
  `setup-squeezed.py`, `access-header.py`, and `qa.py`'s Setup walk, which
  must now walk BOTH rails or half the product goes unswept (§51.11).
- **§359 in the decisions log lands in this commit.**

### Step 3 · The landing's Client setup block and Your modules (spec §9.3)

- `landing.ts` returns `clientSetup: boolean` from the seat the door
  resolved (`super` only) and `modules: {key,label,line,href}[]` from
  `modulesFor` + `landingLine()` (step 4 fills the line; step 3 draws the
  default).
- `Welcome.tsx` draws the block (six doors, `doorHref` spine shape) and the
  list, in `landing.css` from the mockup's own tokens. The Access door opens
  the People register at the seat column (`#seat` anchor, no new page).
- **Prove** (`checks/door-landing.mjs`, sections added; `welcome.py`): the
  block drawn for the Super user and ABSENT for the SMO team and a unit head
  (three seats, both ends); every door's href resolves to a spine Setup
  address; Your modules lists `modulesFor()` in `MODULES` order, one row with
  one module; the block absent over `file://` (the frozen welcome draws none,
  asserted so a later port cannot add it there by accident).

### Step 4 · The landing line (spec §9.4, research R4)

- `MODULE_DEF[k].lines: {key,label,example,read(facts)}[]` with a default
  first; `landingLine(k, pick, facts)`; `moduleRows()` reads it (the console
  card and the landing become one reader).
- `shellDocument()` stamps `lines` (and step 5's `areas`) into
  `data-modules`; `renderLandingLine()` in config-render.js draws the radio
  list and the preview from it and writes `GROUP.landing[<module>]` through
  the ordinary bound-field path — a `select`-shaped write, so it repaints
  (§257.2a), and the default DELETES the key (§50.6).
- `lib/authorize.js`: `landing` classified `setup` AND named in `gExtra`,
  falsified separately (§259.2).
- **Prove**: `test-authorize.js` gains both ends (the office allowed, a head
  refused, and the two-edits falsification: 5 red with the classification
  out, 1 red with the key out); `test-roundtrip.js` writes a pick on a real
  Postgres and reads it back, the table gaining no column; the browser check
  picks a line on Strategy's page and reads the landing's row AND the console
  card's row, asserted equal to each other and to `landingLine()`; *Nothing*
  draws the row with no line.

### Step 5 · Insights' Setup: Access and Landing line (spec §9.5, research R3)

- Two defs with `mod:"insights"`; `renderModuleAccess()` draws the roles ×
  the module's declared areas from `data-modules`, writing `access_grants`
  rows under `a_insights` through the frozen matrix's own writer (`access`,
  the Super user's).
- **Before building on it**: read `lib/state-io.js`'s access read and the
  hydrate's `ACCESS` merge and PROVE a stored key outside `AREAS` survives a
  round trip; if it does not, that is the first commit of this step and its
  own red-first assertion.
- `smp-app/lib/access.ts`: `mayOpenModule()` — seat opens all; else the
  person's roles (through `frozen.cjs`, a `mayOpen` export beside `landing`)
  against the stored grant, defaulting to `shipped`. The route asks it before
  `serverFor`; a refusal is the legacy redirect (§320.5, one behaviour).
- **Prove**: `checks/modules.mjs` gains the gate at both ends (a role set to
  `none` refused by its address, `view` served, the seat always served,
  Strategy's matrix byte-identical before and after); the browser check sets
  a grant on Insights' page as the Super user and reads it back through the
  tenant; the SMO team shown the page and refused the write (§89's line,
  kept); `checks/insights.mjs`'s narrowing assertions unchanged.

### Step 6 · The sweep

- Full `qa.py` at Next (`SMP_BASE`) and over `file://`, ERRORS none on both;
  `built-in-step.py` and `generated-in-step.mjs` clear; `sw.js` `SHELL`
  bumped and confirmed against `origin/main` immediately before the push
  (§94.16) because the built file's bytes change (§91); the what-to-check
  list written in the words of the navigation (A16).

## What this plan does not do

- Does not split Terminology, move the Platform Inbox to the spine, or build
  Portfolio's or Processes' Setup (spec §7).
- Does not touch the wizard (spec 044), which already walks the client-wide
  half; its rail-and-page assertions in `client-setup-outside.py` are run,
  not rewritten, unless step 2 moves something they address.
- Does not merge. `main` is Islam's call, on that merge.
