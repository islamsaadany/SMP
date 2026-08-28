# Implementation Plan: One door, many clients

**Branch**: `claude/multitenant-platform-split-5468e9` (feature `024-multi-client`)
**Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)
**Mockup**: `design-mockups/multi-client/2026-08-28_outer-platform.html` — signed off 2026-08-28

## Summary

SMP becomes multi-client. A Forefront consultant signs in at one door with an
email, sees the clients their row reaches, and opens one; inside, it is the
platform exactly as it is today, named after that client and holding only that
client's data. Isolation is **one Postgres schema per client** (§36.2), so
`readState`, `writeState`, `lib/rules.js` and `lib/authorize.js` are untouched
and the boundary is `SET search_path` on a connection. A new **platform schema**
holds the client registry, the office's accounts, their per-client teams and the
office's own access matrix.

## Technical Context

**Language/Version**: ES2018 JavaScript, no transpile — browser sources in
`SMP-Project-Folder/src/` assembled by `python3 build.py`; Node 20 serverless
functions in `api/`.
**Primary Dependencies**: `pg` only. No framework, no ORM, no SDK (§72, §97.5).
**Storage**: Neon Postgres, one database. New: schema `platform`; per client
`raya_trade`, `rhi`, `el_abd`, `demo`.
**Testing**: `python3 qa.py` and `src/checks/*.py` (Playwright/Chromium) for the
screen; `scripts/test-*.js` against a real Postgres for the server.
**Target Platform**: Vercel static + serverless functions; Chromium/Safari/Firefox.
**Project Type**: single-file browser platform + serverless API (existing shape).
**Performance Goals**: no regression on the poll path — `ensureReady` stays
memoised (§98: 14 → 5 round trips per request), now per schema.
**Constraints**: offline `file://` handover must still open; CSP unchanged
(`connect-src 'self'`); no new dependency.
**Scale/Scope**: 4 client schemas at launch, ~10 office accounts, 33-person
registers. Five new screens; ~30 existing tables per client, unchanged.

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1.*

| Principle | How this plan satisfies it |
|---|---|
| **I · Align before building** | Every decision was put to Islam and answered (spec §2); the mockup was published and signed off before any source is touched. |
| **II · The decisions document is the contract** | §147 is written in the same commit as the first code, and records the two reversals this carries: §21's "no invented content in the database" (for the Demo client) and the Demo-data button's retirement. |
| **III · Edit the sources, never the built file** | All screen work in `SMP-Project-Folder/src/`; `build.py` must reproduce byte-identically; `sw.js` `SHELL` bumped on every content change (§91). |
| **IV · Verify by walking** | `qa.py` runs against a **blank** client as well as a full one; new checks under `src/checks/`. |
| **V · Derived, never stored** | Untouched — no scoring surface changes. "My clients" is **derived** from the client's team, never a second stored list. |
| **VI · Follow what the platform already does** | The outer platform reuses the register's shapes: §35's people table and password states, §37's matrix (roles × areas, view/edit/none), §90's header dropdowns, §116's dialog. One `action`-style endpoint like `api/auth.js` and `api/chat.js`. |
| **VIII · Islam decides content** | Client names, industries and the Demo client's invented names are his, approved 2026-08-28. |
| **IX · One copy of a rule** | `lib/platform-rules.js` is the single definition of the office roles, the six areas, the defaults and every `may…` question; the browser inlines it via `build.py`, the API requires it. |
| **X · The server decides** | The client is resolved from the registry row and authorised against the signed-in account on **every** request; the browser sends a slug, never a schema name. |
| **XI · A record a save can erase is not a record** | Everything new lives in `platform`, which no client's `TRUNCATE` can reach. |
| **XII · A reader never creates** | `clientOf()` / `teamOf()` return frozen empties; the writing half is separate. |
| **XIII · A fill is not a type colour** | Measured: `#F5A623` as type on white is **2.03:1**, so `--ff-amber` (fill) and `--ff-amber-tx` `#9C5D08` (words, 5.27:1) are declared together; dark takes the bright one at 8.15:1. |
| **XIV · Class names are one namespace** | Every new class is prefixed `ff-` (outer platform) — the navigation already owns `.units`, `.tabs`, `.prow`. |
| **XV · Typing never repaints** | The client search filters cards in place; the consultants table follows §35's rule. |
| **XVI · Prove a check by breaking it** | Each new check is run against the pre-split build and its failures counted before its green run is believed. |

**No violations to justify.** The one thing that *looks* like a violation — a
second access matrix — is the opposite: it is §37's matrix reused rather than a
second way of expressing permission, and its rules live in one shared file.

## Project Structure

### Documentation (this feature)

```text
specs/024-multi-client/
├── spec.md
├── plan.md              # this file
├── research.md          # the four questions the code had to answer first
├── data-model.md        # the platform schema, and what stays per client
├── contracts/
│   └── platform-api.md  # /api/platform actions + how every existing endpoint takes a client
├── quickstart.md        # how to run and prove it locally
└── tasks.md             # /speckit-tasks output — not created here
```

### Source code (repository root)

```text
lib/
├── platform-rules.js    # NEW · office roles, areas, defaults, may… questions (shared)
├── platform-io.js       # NEW · registry reads/writes, schema creation, search_path
├── state-io.js          # ensureReady memo becomes per-schema; getPool takes a schema
├── auth.js              # sessions move to platform; email-only identity
└── rules.js             # + isForefront(), tourReady(); office seat read from config

api/
├── platform.js          # NEW · one action endpoint (cards, clients, consultants, access)
├── auth.js              # email-only sign-in against platform.accounts
├── state.js             # takes a client, authorises it, sets search_path
├── chat.js  · mail.js   # same client resolution
db/
├── platform-schema.sql  # NEW · the registry, accounts, teams, matrix, sessions
├── platform-migrations/ # NEW · numbered, registered like db/migrations
└── migrations/          # unchanged; now applied once per client schema

SMP-Project-Folder/src/
├── ff-shell.html · ff.css · ff.js   # NEW · door, cards, clients, consultants, matrix
├── shell.html                        # client name in the chrome → back to the cards
├── config-render.js                  # office rows on the register read-only
├── sync.js · group-render.js         # Demo data button and demo mode removed
└── tour.js                           # runs on the client's own plan; tourReady()

src/checks/
├── multi-client.py      # NEW · isolation, the matrix, the cards, read-only seats
└── (existing checks run unchanged against a client)

scripts/
├── test-platform.js     # NEW · server half against a real Postgres
├── migrate-to-multi-client.js  # NEW · public → raya_trade, platform, rhi/el_abd/demo
└── dev-server.js        # serves /, /raya-trade, /rhi, /el-abd, /demo
```

**Structure Decision**: the existing shape is kept exactly — browser sources
under `SMP-Project-Folder/src/` assembled into the single platform file, thin
`api/*.js` functions, shared rules in `lib/`. The outer platform is **new
sources in the same tree**, not a second app: it is built by the same `build.py`
into its own small file served at `/`, so there is one build, one stylesheet
vocabulary and one set of checks.

## Delivery order

Four slices, each shippable and provable on its own. Nothing in a later slice is
needed to prove an earlier one.

1. **The boundary** (invisible to anyone). `platform` schema; `search_path` per
   request; `ensureReady` memoised per schema; the client resolved from the
   registry and authorised. Raya moves from `public` to `raya_trade`. The
   product looks identical and every existing check still passes.
2. **The door and the cards.** Email-only sign-in against `platform.accounts`;
   the cards; the client name in the chrome. `rhi`, `el_abd` created empty.
3. **The outer platform's pages.** Consultants (with §35's password machinery),
   the client configuration page, the access matrix — and the office seats
   written into each client's register, read-only there (step one of §6.0.1).
4. **Demo, and the demo retirement.** The `demo` client seeded from the renamed
   worked example; the Demo-data button, demo mode and §67's Filled/Clear pair
   removed; the tour switched to `tourReady()`.

Step two of the seat move (§6.0.1) — taking `super`/`smoteam` out of a client's
Roles & access entirely — is **after** this feature, once slice 3 has been
proven on the live client.

## Complexity Tracking

No constitution violations. One cost is accepted and recorded rather than
justified away: **everyone signs in again once**, when sessions move into the
platform schema (spec §4.1).
