# Feature Specification: Database persistence — the platform's state in Neon

**Feature Branch**: `claude/adminsmo-access-module-wj89vv`
**Created**: 2026-08-20
**Status**: Instructed by Islam (2026-08-20): "everything in the configuration
and accessibility and all functionality in the database … including database
seeding on deployment." First slice of the "real build" the decisions document
anticipates in §16.9.
**Input**: The platform is deployed on Vercel with a Neon Postgres database.

## What changes, and what deliberately does not

The product on screen changes **nothing**: same pages, same scoring, same
rules. What changes is where its state lives. Today every unit, capability,
figure, label, band, access grant and person is baked into the HTML, so an
edit lives only in the open tab and dies on reload. After this feature, the
deployed platform **loads its state from the database and writes every change
back**, so edits survive reloads and every viewer shares one state. The file
still opens from disk with its baked demo content — the offline handover
property survives, and the baked content is exactly what seeds a fresh
database.

**Deliberately not in this slice:** real sign-in. People, levels and the
access matrix move into the database and persist, but enforcement stays where
it is today — client-side, with the viewer switcher as the documented
prototype device. Server-enforced identity is §16.9, with product decisions
(credential flow, password policy) not yet made. This is stated, not hidden.

## User Scenarios & Testing

### User Story 1 — Edits survive (P1)

The SMO renames a unit, marks a focus measure, moves a target, reports a
figure. They close the browser. Tomorrow, on another machine, everything is
as they left it.

**Acceptance Scenarios**:

1. **Given** the platform served on Vercel with the Neon integration, **When**
   any change that repaints the page is made (foundation text, a reported
   actual, a label, an access cell, a weighting value, an arrangement, a
   cycle close), **Then** the state is saved to the database within a couple
   of seconds and a reload shows the change.
2. **Given** the platform opened as a local file, **Then** it behaves exactly
   as v1.9 did — baked data, no network calls, no errors.

### User Story 2 — The database builds and seeds itself on deployment (P1)

Nobody runs SQL by hand. The first request after a fresh deployment creates
the schema (idempotent DDL) and, if the database is empty, seeds it with the
platform's own dataset — the same Raya Trade content, generated from the
sources so the two can never drift.

**Acceptance Scenarios**:

1. **Given** an empty Neon database, **When** the platform is first opened,
   **Then** the schema exists, the seed is applied once (advisory-locked, so
   concurrent first requests cannot double-seed), and the page renders the
   familiar content — now from the database.
2. **Given** a later deployment against the same database, **Then** nothing
   is re-seeded and no data is touched.

### User Story 3 — The state is real tables (P1)

"Everything in the database" means queryable structure, not a blob: the §4
hierarchy (organization → themes/capabilities → units → foundation, key
objectives, SWOT, pillars → measures, tactics; capabilities → projects →
deliverables, outcomes, milestones), plus configuration (labels, levels,
access grants, bands, units, functions, people, roles, weighting factors and
values) and the cycle (review, focus marks, KO weights, history snapshots).

**Acceptance Scenario**: a SQL query against `measures` returns Mobile's
measures with their targets and actuals; `access_grants` returns the matrix.

## Requirements

- **FR-001**: A relational schema derived from §4, one table per entity, with
  stable ids as keys and an `extra` JSONB column per entity for provenance and
  display fields — so a round trip through the database loses **nothing**.
  Derived figures are never stored (§5.1 stands).
- **FR-002**: The canonical seed (`db/seed-state.json`) is **generated from
  the platform's own source data** by a script, and applied through the same
  writer the save path uses — one writer, no second source of truth.
- **FR-003**: `/api/state` (Vercel serverless function, `pg` over TCP —
  works identically against Neon and a local Postgres): GET assembles the
  exact object shapes the front end already uses; POST replaces the tenant's
  state transactionally (wipe-and-write by the same writer). Connection from
  the standard env names the Neon/Vercel integration sets; never from chat.
- **FR-004**: `ensureReady` on each request: applies the idempotent schema,
  seeds only when empty, under a Postgres advisory lock.
- **FR-005**: Front-end sync (`src/sync.js`, part of the built file): on an
  http(s) origin, hydrate the globals from GET before the second paint; after
  any repaint, serialize, compare against the last saved state, and save when
  different (debounced). On file:// or API failure: silently local, exactly
  v1.9 behaviour.
- **FR-006**: Round-trip fidelity is proven, not assumed: seed → write → read
  → deep-equal against the canonical state, byte-for-byte after
  normalization.

## Success Criteria

- **SC-001**: Round-trip deep-equal passes against a throwaway local
  Postgres 16.
- **SC-002**: Browser test: edit → autosave → reload → the edit is there, and
  the exact row in the database shows the new value.
- **SC-003**: QA walk from file:// stays clean for all viewers (offline
  fallback intact); byte-identical build discipline holds.
- **SC-004**: A fresh empty database self-builds and self-seeds on first
  request; a second request changes nothing.
