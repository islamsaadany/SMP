# The spike — nine proofs on a real Postgres (spec 043 §5)

Run from `smp-app/` with the sandbox cluster up
(`sudo -u postgres pg_ctlcluster 16 main start`, version 16.13) and
`DATABASE_URL_UNPOOLED=postgres://postgres:postgres@localhost:5432/postgres`
exported — the local owner key, never the Neon one (quickstart §4 is Islam's).

Order: S1 · S3 · S5 · the schema · S2 · S6 · S4 · S7 · S8 · S9 — each depends
on the one before. Every script takes `--break=<name>` (contracts/spike.md),
builds the thing under test wrongly in the way named, and that red run is
recorded here before the green run is believed. `_harness.mjs` makes
`smp_spike_<pid>_<t>` per run as the owner, applies `db/roles.sql` +
`db/schema.sql` + `db/migrations/*` through `db/apply.mjs`, seeds tenants A
and B, and drops the database at the end. A red run that prints nothing is
the harness dying, not a failure (§215).

## First runs

### S1 · the role and FORCE (2026-09-09)
`--break=no-force` → RED 5 ok, 1 failed: *"with no tenant set the app role reads 0 rows — 2 rows visible"* (the owner, FORCE off, sees every row).
`--break=bypass` → RED 1 ok, 5 failed, the first *"smp_app exists: LOGIN, NOBYPASSRLS — rolbypassrls: true"*.
green → 6 ok: role LOGIN NOBYPASSRLS · owns no table · 0 rows with nothing set · A's one row inside withTenant(A) · an INSERT under B refused 42501 · the OWNER reads every row (why the app is not the owner).
**The Neon run is Islam's** (quickstart §4); its lines go here when he sends them.

### S3 · the pooler (2026-09-09)
The model is a fresh connection per statement outside a transaction (a
transaction pooler hands each autocommit statement to whatever backend is
free); `RESET ALL` was tried first and reads a custom setting back as `''`,
not NULL — a different fault from the one being modelled, and it errors the
policy with 22P02 rather than reading anything.
`--break=bare-set` → RED 4 ok, 1 failed: *"withTenant(A) on the direct connection reads A's row — 0"*.
green → 5 ok: a bare SET reads 0 on the next statement · withTenant(A) reads 1 · SET LOCAL inside BEGIN…COMMIT reads 1 through the model · after COMMIT 0 · no bare SET in `lib/tenant.ts`.

### S5 · the schema check (2026-09-09, platform half only)
`--break=add-table` → RED: *"stray: no tenant_id column (rule 1)"*.
green → *"0 tenant tables pass the four rules"* — vacuous by design until the schema phase; re-run over the 42 with `--break=no-force:<table>` there.

### The schema (2026-09-09)
The 42 tenant tables' columns were read off a real database (`smp_v20`,
seeded by the frozen `scripts/test-roundtrip.js`, migrations 001–043 applied)
rather than off 44 migration files; the generator ran once and the SQL is
the source from then on. S5 over the 42: **green**; `--break=no-force:tactics`
→ RED naming `tactics`; `--break=bare-fk` → RED *"deliverables: FK … does not
carry tenant_id on both sides (rule 4)"* — **and that break exists because
rule 4 passed on a build it should have failed**: `array_agg(attname)` came
back as a `name[]` string, and `"{tenant_id,cap_id}".includes("tenant_id")`
is true of a string (§94.5). Cast to `text[]` on both sides. `prisma db pull`
regenerated `schema.prisma` (51 models, every tenant model with `tenant_id`
and a composite `@@id`); Prisma introspects, never migrates.

### S2 · isolation (2026-09-09)
`--break=no-policy:tactics` → RED 41 ok, 3 failed: with FORCE on and no
policy the table is empty to the app role, so the read returns 0 of A's 1 and
the DELETE removes nothing — reported as FAIL, not as "isolated" (§113.8).
`--break=owner` → RED 0 ok, 127 failed — every table leaks on every verb.
green → 43 ok: 42 tables × read-with-no-WHERE · INSERT-under-B refused 42501 ·
DELETE-with-no-WHERE inside A, B's counts untouched. Tables walked children
first, or one table's DELETE cascades the next table's A rows away before it
is measured.

### S4 · deletion (2026-09-09)
`--break=no-cascade:measures` → RED: the DELETE is refused by the RESTRICT
FK and every table keeps its rows (45 failed, named).
green → 4 ok: the delete ran · 0 rows for A in every one of 42 tables · B's
counts unchanged · the tenants row gone.
