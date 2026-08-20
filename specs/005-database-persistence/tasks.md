# Tasks: Database persistence

- [x] T001 `scripts/extract-state.js`: evaluate the platform sources, emit
      `db/seed-state.json` (canonical graph).
- [x] T002 `db/schema.sql`: idempotent DDL for the §4 hierarchy +
      configuration + cycle tables, `extra` JSONB per entity.
- [x] T003 `lib/state-io.js`: `writeState` / `readState` / `ensureReady`
      (advisory-locked, seed-if-empty).
- [x] T004 `api/state.js`: GET/POST handler, connection from standard env
      names, JSON errors.
- [x] T005 `src/sync.js` + `shell.html` boot/afterPaint hooks + `build.py`.
- [x] T006 `package.json` (pg only, no build script), `vercel.json`
      (includeFiles db/**), .gitignore (node_modules).
- [x] T007 Verify on throwaway local Postgres 16: schema+seed on first call,
      no re-seed on second, round-trip deep-equal, SQL spot checks.
- [x] T008 Browser persistence test through a local dev server; QA walk from
      file:// unchanged.
- [x] T009 v2.0: shipped file + decisions doc renamed, §18 recorded, README,
      gate link, CLAUDE.md.
