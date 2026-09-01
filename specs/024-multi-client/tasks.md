---
description: "Task list for 024-multi-client — one door, many clients"
---

# Tasks: One door, many clients

**Input**: `specs/024-multi-client/` — spec.md, plan.md, research.md, data-model.md, contracts/platform-api.md, quickstart.md
**Mockup**: signed off 2026-08-28 · **Tests**: required (Principle IV and XVI — every check proved by breaking what it guards)

## Format: `[ID] [P?] [Story] Description`

- **[P]** — parallelisable (different files, no dependency on unfinished work)
- **[Story]** — US1 the boundary · US2 the door and the cards · US3 the office's pages · US4 Demo and the retirement

## Path conventions

Browser sources `SMP-Project-Folder/src/` (built by `build.py`); shared rules `lib/`;
serverless functions `api/`; SQL `db/`; checks `SMP-Project-Folder/src/checks/`; node tests `scripts/`.

---

## Phase 1 · Setup

- [x] T001 Create `db/platform-schema.sql` with `clients`, `accounts`, `account_clients`, `platform_access`, `sessions`, `login_attempts`, `client_log` per specs/024-multi-client/data-model.md, idempotent (`CREATE TABLE IF NOT EXISTS`) and with the partial unique index for one super user per client
- [x] T002 [P] Create `db/platform-migrations/` with its own `_sql_migrations` registry, mirroring the convention in `lib/state-io.js` (numbered files, `-- @phase:` honoured)
- [x] T003 [P] Create `lib/platform-rules.js` — `OFFICE_ROLES` (admin·lead·consultant·observer), `AREAS` (my_clients·other_clients·client_config·consultants·create_client·demo), `ACCESS_DEFAULTS` from spec §7.3, `grantIn()` merging stored over defaults (§30.2), and `mayOpenClient` / `mayEditClient` / `mayConfigureClient` / `mayManageConsultants` / `mayCreateClient` / `mayEditAccess` — pure functions, no I/O
- [x] T004 **NOT DONE, AND THAT IS THE ANSWER.** `platform.html` asks the
  SERVER for everything — `cards`, `consultants`, `access` and `client` each
  come back already resolved, carrying `canOpen`, `canConfig`, `canEdit` and
  the seat — so it holds **no copy of a rule to keep in step**: `grep -c
  'FF\.\|SMPRules' platform.html` is 0. Inlining `lib/platform-rules.js`
  into a page that reads none of it is dead code (§24), and the drift
  Principle IX guards against cannot occur where there is only one side
- [x] T005 [P] Write `scripts/test-platform-rules.js` — the four roles against the six areas, defaults merged, an unknown area answering `none`, and the admin row unwritable

## Phase 2 · Foundational (blocks every story)

- [x] T006 Add `lib/platform-io.js` — `getPlatformPool()`, `clientByKey()` (returns a frozen empty when absent, Principle XII), `clientsFor(email)`, `teamOf(clientKey)`, `accountByEmail()`, `withClient(clientKey, fn)` which sets `search_path` on the checked-out connection and **resets it on release**
- [x] T007 Change `ensureReady` in `lib/state-io.js` from one module-level `READY` promise to a **map keyed by schema**, and take the advisory lock per schema (`hashtext(schema)`) — research.md §3; keep the §98 memoisation win
- [x] T008 Teach `lib/state-io.js`'s `getPool` to hand back a connection with `search_path` set for a named schema, and never to set it on the pool
- [x] T009 Add `ensurePlatformReady()` to `lib/platform-io.js` — applies `db/platform-schema.sql` + `db/platform-migrations/*` under an advisory lock, memoised per process
- [x] T010 [P] Write `scripts/test-platform.js` skeleton against a real Postgres: create two client schemas, assert `ensureReady` migrates the **second** one opened first in a fresh process (the trap), and assert `search_path` is reset when a connection returns to the pool

---

## Phase 3 · US1 · The boundary (P1 — the MVP, invisible to everyone)

**Goal**: one client's data is reachable only through that client, with the product unchanged.
**Independently testable**: the existing suite passes untouched against `raya-trade`, and a request for a client the account may not open is refused identically to one that does not exist.

- [x] T011 [US1] Resolve the client in `api/state.js`: read `client` from the body/query, look up the schema through `clientByKey()`, authorise it against the session's account, then run today's code inside `withClient()`
- [x] T012 [P] [US1] Same resolution in `api/chat.js`
- [x] T013 [P] [US1] Same resolution in `api/mail.js`
- [x] T014 [US1] Make the refusal for an unknown client and an unreachable client **byte-identical**, and never name a role the person does not hold (contracts/platform-api.md)
- [x] T015 [US1] Send the client with every request from the browser in `SMP-Project-Folder/src/sync.js` — read from the path, never stored, so two tabs on two clients cannot cross
- [x] T016 [US1] Add the client to `SMP-Project-Folder/src/chat.js`'s `post()` in the one place every chat request already goes through (§97)
- [x] T017 [US1] Write `scripts/migrate-to-multi-client.js`: `CREATE SCHEMA raya_trade`, `ALTER TABLE public.<t> SET SCHEMA raya_trade` for every table (no data copied, so nothing can be half-copied), create `platform`, seed the three office accounts with temporary passwords, seed Raya's configuration and team, then create `rhi` and `el_abd` empty — with a `--dry-run` that prints the plan and changes nothing
- [x] T018 [US1] Verification step inside the migration: table counts per schema, one known figure read out of `raya_trade`, an empty `rhi`, and a report naming any account it could not create
- [x] T019 [US1] Teach `scripts/dev-server.js` the client paths (`/raya-trade`, `/rhi`, `/el-abd`, `/demo`) and keep `PLATFORM_FILE` serving the same built file for each
- [x] T020 [US1] Extend `scripts/test-platform.js`: an account not on a client is refused; the two refusals match; a request naming a **schema** rather than a slug is refused; an Observer's save is refused by the server
- [x] T021 [US1] Run `DATABASE_URL=… node scripts/test-roundtrip.js` inside `raya_trade` **and** against a virgin `rhi` (§113.7 — a migration reading a column `schema.sql` no longer creates is invisible on an existing database)
- [ ] T022 [US1] Run the whole existing suite unchanged against `raya-trade` (`qa.py`, every `src/checks/*.py`, `test-authorize.js`, `test-chat.js`) and record the numbers in the commit

**Checkpoint**: the product is identical, and the boundary exists.

---

## Phase 4 · US2 · The door and the cards (P2)

**Goal**: a consultant signs in by email and opens a client; a client's own person lands straight in theirs.
**Independently testable**: sign in as each of the three office accounts and as a Raya person; the cards show only what the row reaches; `SMO` is refused.

- [x] T023 [US2] Move sign-in in `api/auth.js` to `platform.accounts`: **email only**, the person-key path removed, `SMO`/`1234` gone
- [x] T024 [US2] Move `sessions` and `login_attempts` reads/writes in `lib/auth.js` to the platform schema, keyed on email, thresholds and check-before-verify order unchanged (§43.2)
- [x] T025 [US2] Route a signed-in person after sign-in: office → the cards; a client's own person → their client, no card (`account_clients` has exactly one row)
- [x] T026 [P] [US2] **Landed in `index.html` instead of new `src/ff-*` files** — it already IS the door (the wall-and-card §34 settled), it is not built from `src/`, and a second build output for one page duplicates machinery for nothing. Forefront's palette added there, with the amber as a fill and `--gold-deep` for words (Principle XIII, measured)
- [x] T027 [US2] **Not needed** — `index.html` is already served at `/`; `vercel.json` gained one rewrite per client in US1 and `dev-server.js` reads that list
- [x] T028 [US2] Bump `SHELL` in `sw.js`, add the client paths to its precache list, and `node --check sw.js` after every merge (§91, §146.2)
- [x] T029 [US2] Put the client's name in the platform's chrome in `SMP-Project-Folder/src/shell.html`, pressing it returns to the cards — no dropdown (spec §5)
- [x] T030 [P] [US2] `cards` and `me` actions in the new `api/platform.js`, answering only what the row reaches
- [x] T031 [US2] Write `SMP-Project-Folder/src/checks/multi-client.py` §1–2: the door refuses a person key, the cards show what the row allows and nothing more, the chrome's client name returns to the cards
- [x] T032 [US2] Prove T031 by running it against the pre-split build and counting its failures before believing its green run (Principle XVI)

**Checkpoint**: one door, four clients, and nobody sees a card they cannot open.

---

## Phase 5 · US3 · The office's pages (P3)

**Goal**: Forefront's own people, each client's configuration, and the table that decides who sees what.
**Independently testable**: as Admin, add a consultant, put them on a client, watch the row appear in that client's register read-only; as Observer, watch every edit refused on screen and by the server.

- [x] T033a [US2] *(found while building)* An office account APPEARS on the client's register the first time it opens one (`P.ensureOfficeRow`) — without it the platform correctly says "signed in but not on this register" and draws nothing. Spec §6's own wording, needed a slice earlier than planned
- [x] T033 [P] [US3] `consultants`, `saveConsultant`, `issuePassword` actions in `api/platform.js` — §35's password states and §89's rule that the test is the **target** (never issue to an admin)
- [x] T034 [P] [US3] `client`, `saveClient`, `createClient`, `setTeam` actions in `api/platform.js`
- [x] T035 [P] [US3] `access` and `saveAccess` actions in `api/platform.js`, defaults merged with stored (§30.2), the admin row refused
- [x] T036 [US3] `createClient` creates the schema, applies `db/schema.sql` and every migration, writes the org name, and **stops** — no seed, no invented content (spec §7.2)
- [x] T037 [US3] The consultants page (in `index.html`, per T026's note) — the register's own table, statuses and dialog shapes (§35, §116), typing filters in place (Principle XV)
- [x] T038 [US3] The client configuration page (reached from the client's own card) — name, address name, industry, notes, mark (PNG only, §52), colours, and the team with its super user
- [x] T039 [US3] The access table (same page, same palette) — §37's two-toggle cell, the admin row visibly locked
- [x] T040 [US3] `setTeam` writes the office row into that client's `people` with `extra.forefront = true` and the seat (`smoteam`, or `super` for the client's super user); removing from the team removes the row (or retires it where it holds anything)
- [x] T041 [US3] Show office rows read-only on the client's register in `SMP-Project-Folder/src/config-render.js`, saying where the seat is set — step one of spec §6.0.1
- [x] T042 [US3] Refuse an office-seat edit from inside a client in `lib/authorize.js`'s people classification, so the screen and the server agree (§94's drift)
- [x] T043 [US3] Extend `SMP-Project-Folder/src/checks/multi-client.py` §3–5: every control **pressed** (§70), both ends asked of each refusal, the seats read-only, the admin row unwritable
- [x] T044 [US3] Extend `scripts/test-platform.js`: the matrix has teeth on the server for all four roles; `issuePassword` refuses an admin target; `setTeam` writes and removes the client-side row

**Checkpoint**: the office runs itself, and the seats are set in one place.

---

## Phase 6 · US4 · Demo, and the retirement (P4)

**Goal**: a Demo client that saves, and one home for demo material.
**Independently testable**: open Demo and edit it; confirm the Demo-data button is gone for every viewer; confirm a blank client offers no tour and a filled one does.

- [x] T045 [US4] Add `scripts/seed-demo-client.js` — `db/seed-state.json` renamed per the approved list (Meridian Group; Devices; B2B Online; Home Electronics; Customer Care; IT Distribution; every person invented, addresses at `meridian.example`) into the `demo` schema
- [x] T046 [US4] Mark the Demo client `kind = 'demo'` and draw it as such on the cards; it is a client in every other respect and it **saves**
- [x] T047 [US4] Remove the Demo data button, demo mode and §67's Filled/Clear pair from `SMP-Project-Folder/src/sync.js`, `group-render.js` and the shell — controls, switch and banner, with the CSS deleted beside them (§24)
- [x] T048 [US4] Keep the baked dataset as what the offline `file://` build runs on, and assert it still opens with the full example
- [x] T049 [US4] Add `tourReady(target)` to `lib/rules.js` — at least one pillar or capability and one key objective — and switch `SMP-Project-Folder/src/tour.js` off demo mode onto the client's own plan
- [x] T050 [US4] Say why rather than starting nothing: the Knowledge base replay button explains when the tour is not available (§61)
- [x] T051 [P] [US4] Update `SMP-Project-Folder/src/checks/tour.py` for the new rule, both ends (offered with a plan, absent without, never for the office — §118)
- [x] T052 [US4] Extend `multi-client.py` §6: the Demo button absent for every viewer, the Demo client editable, the offline file still showing the example

**Checkpoint**: one home for demo material, and it is the one that can be added to.

---

## Phase 6b · US2b · The door is a door (revision 2, 2026-08-29)

**Goal**: the login page does nothing but sign you in; the office's pages live
inside a Forefront platform with its own chrome.
**Independently testable**: the door holds no tab, table or card; signing in
lands on a platform whose navigation carries the three pages; a client's own
person still goes straight into their client.

- [x] T060 [US2b] A Forefront platform shell — its own top line and navigation
  (`Clients · Consultants · Who sees what`) — served at `/platform`, in
  Forefront's colours, matching the two-line chrome a client's platform has
- [x] T061 [US2b] Move the cards, the consultants page, the access table and a
  client's configuration off `index.html` and onto that shell; the door keeps
  only sign-in and the forced password change
- [x] T062 [US2b] The door hands over: a client's own person and anybody
  holding one client go straight to that client; everybody else to `/platform`
- [x] T063 [US2b] `checks/multi-client.py` asserts the door holds no tabs, no
  table and no cards, and that every office page is reachable from the shell —
  proved by putting the pages back on the door and watching it fail

## Phase 6c · US3b · A role is a seat on a client (revision 3, 2026-08-29)

**Goal**: the platform has one admin; everything else about a person is the
seat they hold on a particular client.
**Independently testable**: somebody can be one client's Super user and another's
SMO team; a consultant on no client signs in and sees nothing to open; the
platform admin alone adds clients and consultants.

- [x] T064 [US3b] `accounts.role` becomes `is_admin`; `account_clients` gains
  `seat` (`super` / `smoteam`), replacing `is_super` — one platform migration,
  and the existing rows carry across (`is_super` → `super`, else `smoteam`)
- [x] T065 [US3b] `lib/platform-rules.js`: the four roles go; `mayOpenClient`
  answers from the seat, and the platform questions from `is_admin` plus the
  stored table
- [x] T066 [US3b] The matrix becomes four platform columns asked of everybody
  who is not the admin, with **hidden · listed · open** on the first
- [x] T067 [US3b] The seat is set on the client's configuration and shown
  read-only on the consultant's row
- [x] T068 [US3b] `test-platform-rules.js` and `checks/multi-client.py` rewritten
  around seats — proved by putting the platform-wide role back and watching them
  fail

## Phase 7 · Polish and cross-cutting

- [x] T053 Rebuild with `python3 build.py` and confirm the shipped file is reproduced byte-identically (Principle III)
- [x] T054 [P] Run the contrast sweep over the new outer-platform pages in both themes and both palettes, and record the numbers (Principle XIII)
- [x] T055 [P] Sweep the door, the cards and the configuration page at 1920 / 1500 / 1280 / 1000 px asserting no sideways scroll (§27.1, §27.2)
- [x] T056 Write §147 in `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md` — the decisions, and the two reversals: §21's "no invented content in the database" for the Demo client, and the Demo-data button's retirement
- [x] T057 [P] Update `CLAUDE.md` (the multi-client facts, the new commands) and `IMPLEMENTATION_PROGRESS.md` in the same commit as the work (steering currency)
- [x] T058 Rehearse `scripts/migrate-to-multi-client.js` against a **copy of production**, with the rollback written down first, and report what it found before it is run for real
- [x] T059 End the merge with what to go and check — the screens, in the navigation's own words (rule A16) — `specs/024-multi-client/what-to-check.md`

---

## Dependencies

```text
Setup (T001–T005)
   └─> Foundational (T006–T010)
          └─> US1 · the boundary (T011–T022)      ← MVP, shippable alone
                 └─> US2 · door and cards (T023–T032)
                        └─> US3 · the office's pages (T033–T044)
                               └─> US4 · Demo and the retirement (T045–T052)
                                      └─> Polish (T053–T059)
```

US2 depends on US1 (a card opens a client, which needs the boundary). US3
depends on US2 (its pages live behind the door). US4 depends on US3 (Demo is
created by the page that creates clients). Within a phase, `[P]` tasks touch
different files and may run together.

## Parallel opportunities

- **Setup**: T002, T003, T005 together.
- **US1**: T012 and T013 together (two endpoints, same change).
- **US3**: T033, T034, T035 together (three action groups, one file each in
  practice — split `api/platform.js` by action group when they land together).
- **Polish**: T054, T055, T057 together.

## Implementation strategy

**MVP is US1 alone** — the boundary, with the product unchanged and the existing
suite green. It is worth shipping on its own: it is the half that is expensive
to retrofit and invisible to everyone, so it carries no risk to the people using
the platform today.

Then US2 gives the office a door and the clients an address; US3 gives the
office its pages; US4 replaces the demo material. Step two of the seat move
(spec §6.0.1) is deliberately **after** this feature.
