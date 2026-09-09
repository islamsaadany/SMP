# Tasks: the door and the landing — the first screen group (spec 043 D4)

**Input**: `plan.md` §"After 10", `contracts/tenant-request.md` §1–§2, the
signed-off mockup `design-mockups/rebuild-door-landing/2026-09-09_door-and-landing.html`
(§315), `index.html` and `SMP-Project-Folder/src/welcome.{js,css}` (the
product's own door and welcome screen, carried verbatim — D4, §20).

**Format**: `[ID] [P?] Description` — every path repository-relative; the
frozen product is read, never edited.

## Phase 1 · The mockup (rule 1c)

- [x] M001 Draw the door and the landing from the product's own door and welcome screen, two changes marked with their costs; publish as an artifact. `design-mockups/rebuild-door-landing/2026-09-09_door-and-landing.html`
- [x] M002 Islam's correction of the wall's fourth line, twice (an introduction, not a pitch; then *presenting from the same place*), applied and republished. (§315)
- [x] M003 Sign-off: *"ok go ahead and build it"* (2026-09-09).

## Phase 2 · The stylesheets, verbatim

- [x] S001 `smp-app/scripts/sync-css.mjs` concatenates all nine of `build.py`'s sheets (welcome.css among them) and extracts `index.html`'s `<style>` block; both written under `smp-app/public/` and LINKED from their route group's layout, never bundled. (§315 — the bundler refuses §272.8's stray close-comment mark.)

## Phase 3 · The libraries

- [x] L001 [P] `smp-app/lib/door.ts`: `Tenant.mark`, `landingAt()` (§313.36's landing from a client's door), `doorDress()`.
- [x] L002 [P] `smp-app/lib/auth.ts`: `verifyCurrent()` for a settled password's change.
- [x] L003 [P] `smp-app/lib/session.ts`: the session off `next/headers` for pages and off the Request for routes; the caller's address; the slug shape.
- [x] L004 `smp-app/lib/frozen.cjs`: the frozen readers in a vm context, one synchronous `landing(graph, personKey)`; `smp-app/lib/landing.ts` over it with `doorHref()`/`targetOf()`.

## Phase 4 · The routes (contracts §2)

- [x] R001 [P] `POST /api/auth/sign-in` — cookie, `{ mustChange, landing }`, the door slug narrowing the landing; a form post answered with a redirect.
- [x] R002 [P] `POST /api/auth/password` — `next`, `current` only for a settled password; ends every other session; answers the landing.
- [x] R003 [P] `POST /api/auth/sign-out`, `GET /api/auth/me`.
- [x] R004 `GET/POST /api/auth/where` — the door's own question (§56, §57, §93.13), added to the contract.

## Phase 5 · The screens

- [x] P001 Root layout (theme before first paint, no stylesheet); `(door)` layout linking `door.css`; `(platform)` layout linking `platform.css` and its own `landing.css`.
- [x] P002 `Door.tsx` — `index.html`'s markup and script ported: both cards, the reveal, the where-list, the one refusal sentence, `body.ready`, forms posting to the API before hydration.
- [x] P003 `/` and `/[slug]/sign-in` — server-decided card; a live session goes straight through; a client's door wears its mark.
- [x] P004 `/[slug]` — the welcome screen from `landingFor()`; signed-out → the client's door; a temporary password → the card; another client's slug → their own; refused and non-existent identical (`not-found.tsx`).
- [x] P005 `/[slug]/[...rest]` and `/platform` — holders that say in words what they are and that the page is the next group's; sign-out on both.

## Phase 6 · Proof, red first

- [x] T001 `smp-app/scripts/dev-tenant.mjs` — the worked example under `raya-trade` through the app's own `loadGraph()`, four logins.
- [x] T002 `smp-app/checks/door-landing.mjs` — 44 assertions in headless Chromium against the built app; rows asserted as agreement with `lib/frozen.cjs`'s own answer.
- [x] T003 Falsified: `--break=no-rows` (3 red), `--break=first-person` (15 red); green–red–green recorded in §315. S7 rerun green (15/0); `tsc`; `next build`.
- [x] T004 The record: §315, this file, contracts §2, quickstart §6, the tracker, `CLAUDE.md`.

## Not in this group (recorded in §315)

The office's landing (`/platform` cards); every page behind *Continue*; the
intro round itself; the reply row (the chat corner); the demo seed under the
shared schema; where the app is served from (D4's cutover decision).
