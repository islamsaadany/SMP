# SMP — Strategy Management Platform

A consulting product for running a client's strategy: group and business-unit
plans, derived scoring, reporting cycles with snapshots, focus measures,
capabilities with enhancement projects, import/export, and presentation mode.

The demo tenant is Raya Trade (group shape). Only Mobile's plan content is
real — everything else is labelled invented, and never reaches the database.

## Where things are

| Path | What it is |
|---|---|
| `SMP-Project-Folder/` | **The product.** Sources, docs and design history |
| `SMP-Project-Folder/src/` | The sources `build.py` assembles, plus `qa.py` and `checks/` |
| `SMP-Project-Folder/strategy-management-platform-v3.22.html` | The built single-file platform — **generated, never edited by hand** |
| `lib/` | Shared rules (`rules.js`), the authoriser, auth, mailer, state IO |
| `api/` | Serverless endpoints — `state`, `auth`, `chat`, `mail` |
| `db/` | `schema.sql`, `migrations/`, `seed-state.json` |
| `scripts/` | Dev server and the round-trip / authorisation / mail tests |
| `specs/` | Feature specifications (spec-kit), one folder each |
| `index.html` | The sign-in gate, served at the root |

## Build and check

```bash
cd SMP-Project-Folder/src
python3 build.py     # assembles the platform; must be byte-identical to the shipped file
python3 qa.py        # walks every page as every viewer, asserts no console errors
```

Individual checks live in `SMP-Project-Folder/src/checks/` and are listed with
what each one guards in `CLAUDE.md`.

Server-side tests need a database:

```bash
DATABASE_URL=… node scripts/test-roundtrip.js
DATABASE_URL=… node scripts/test-authorize.js
```

## How it runs

A single self-contained HTML file — no framework, no dependencies, works
offline from `file://`. Served over http(s) it hydrates from `GET /api/state`
and autosaves on change.

Deployed on Vercel from `main`: static files plus `/api/*` as serverless
functions, backed by Neon Postgres. The first request against an empty
database applies the schema and migrations and seeds it under an advisory
lock — nobody runs SQL by hand.

## Read these first

1. **`CLAUDE.md`** — how to work here: conventions, house rules, and the
   engineering lessons this project has paid for.
2. **`SMP-Project-Folder/CLAUDE-RULES.md`** — the working rules between Islam
   and Claude. These take precedence where the two overlap.
3. **`SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md`** — every decision with
   its reasoning. Reversals are recorded, never overwritten.
4. **`SMP-Project-Folder/README.md`** — the map of what each file and mockup
   is, and whether it is settled, pending or rejected.
5. **`IMPLEMENTATION_PROGRESS.md`** — what is built, in flight, and next.

Two rules worth knowing before you touch anything: **edit the sources, never
the built file**, and **never write a second copy of a rule** — `lib/rules.js`
is shared by the browser, the server and the seed generator precisely so the
screen and the server cannot drift apart.
