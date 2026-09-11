# Tasks: One schema, every client — the spike

**Input**: `plan.md`, `spec.md` (§5's proofs are the stories — this slice has no
user-facing story and no screen), `research.md` §P1–P7 (all answered by Islam
2026-09-09, §314.2), `data-model.md`, `contracts/tenant-request.md`,
`contracts/spike.md`, `quickstart.md`.

**Tests**: every proof is its own test and is written **red first** — each
`--break=<name>` run is recorded as a task before the green run counts
(constitution XVI). There are no separate unit-test tasks.

**Organization**: one phase per proof, in `plan.md`'s delivery order
(S1 → S3 → S5 → schema → S2 → S6 → S4 → S7 → S8 → S9). Each phase ends green
on its own and the next depends on it. Story labels are the proof numbers.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: `[S1]`…`[S9]` — the proof the task serves (`contracts/spike.md`)
- Every path is repository-relative; `smp-app/` is the new app, `lib/` and
  `db/` at the root are the frozen product's (read, never edited here)

## Path conventions

- New code: `smp-app/db/`, `smp-app/lib/`, `smp-app/spike/`, `smp-app/scripts/`
- Frozen product, read-only for this slice: `lib/*.js`, `db/schema.sql`,
  `db/migrations/*.sql`, `scripts/test-*.js`, `SMP-Project-Folder/`
- Nothing in this slice is served; `main` is untouched until Islam says merge

**Standing rules while working these tasks**

- Never ask for, print or paste a connection string; the local URL is the
  sandbox's `postgres://postgres@localhost:5432/…`, the Neon one is Islam's
  (T072).
- No model identifier in commits.
- A proof that dies before printing its properties is a harness fault, not a
  red run (§215) — every script prints every property it reached.
- A task that changes a decision recorded in `research.md` or §314.x is not a
  task; it is a question for Islam first (constitution I).

---

## Phase 1: Setup

**Purpose**: the app skeleton loses what the plan threw away and gains the
folders the proofs live in; the local database is up.

- [x] T001 Start the sandbox cluster and confirm it answers: `sudo -u postgres pg_ctlcluster 16 main start` then `psql postgres://postgres@localhost:5432/postgres -c 'select version()'` (quickstart §1); record the version line in `smp-app/spike/README.md`
- [x] T002 Remove `next-auth` from `smp-app/package.json` dependencies (research §P1) and run `npm install` in `smp-app/` so `package-lock.json` follows; confirm `grep -r next-auth smp-app/app smp-app/lib` finds nothing
- [x] T003 [P] Create `smp-app/db/`, `smp-app/db/migrations/`, `smp-app/spike/` and add `smp-app/spike/README.md` (one paragraph: run order S1, S3, S5, schema, S2, S6, S4, S7, S8, S9; what green means; that every script takes `--break=<name>`; that the harness makes and drops `smp_spike_<n>`)
- [x] T004 [P] Rewrite `smp-app/lib/db.ts`: export `ownerPool()` and `appPool()` (both `pg.Pool`), each reading **`DATABASE_URL_UNPOOLED` first, then `POSTGRES_URL_NON_POOLING`, then the pooled names** (§313.34's order, the reverse of the file today); `appPool()` connects as `smp_app` using `SMP_APP_URL` when set and otherwise the direct URL with the user swapped to `smp_app` and password from `SMP_APP_PASSWORD`; one log line at startup naming which name was used, never its value
- [x] T005 [P] Add `smp-app/spike/_harness.mjs`: `makeDb()` creates `smp_spike_<pid>` as the owner and returns `{ ownerUrl, appUrl, drop() }`; `applyAll(url)` runs `db/roles.sql`, `db/schema.sql` and `db/migrations/*` through `db/apply.mjs`; `seedTwoTenants(url)` inserts tenants A and B and **one row in every tenant-owned table for each** (read the table list from the catalogue, §113.8 — a proof over an empty table is vacuous); `brk(name)` reads `--break=<name>` from `process.argv`; `ok(label)`/`fail(label, measured)` print one line each and `fail` sets a non-zero exit at the end, never throws mid-run (§215); `poolerModel(url)` returns a client that resets session state after every autocommit statement, copied from `scripts/test-cold-starts.js`'s model

**Checkpoint**: `node smp-app/spike/_harness.mjs --selftest` makes a database, prints its name, drops it, exits 0.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the pieces every proof after S1 depends on.

- [x] T006 Write `smp-app/db/roles.sql`: `CREATE ROLE smp_app LOGIN NOBYPASSRLS PASSWORD :'app_password'` guarded by `DO $$ … IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='smp_app') …`; `GRANT USAGE ON SCHEMA public`; `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public` and `ALTER DEFAULT PRIVILEGES … GRANT … ON TABLES`; `GRANT USAGE ON ALL SEQUENCES` + default privileges for sequences; **no `CREATE`**; idempotent on a second run
- [x] T007 Write `smp-app/db/apply.mjs`: connects as the owner (`ownerPool()`), `BEGIN`, `SELECT pg_advisory_xact_lock(420043, 0)`, creates `_migrations(name text primary key, applied_at timestamptz)` if absent, runs `db/schema.sql` when `_migrations` holds no `schema` row, then every `db/migrations/*.sql` not yet in `_migrations` in name order, records each, `COMMIT`; a failing file rolls the whole transaction back and records nothing (§289's shape, research §P6); prints one line per file applied and exits non-zero on failure
- [x] T008 Write `smp-app/lib/tenant.ts`: `withTenant<T>(tenantId: string, fn: (c: PoolClient) => Promise<T>): Promise<T>` — checks out a client from `appPool()`, `BEGIN`, `SET LOCAL app.tenant_id = $1` (parameterised via `SELECT set_config('app.tenant_id', $1, true)`), runs `fn`, `COMMIT` (or `ROLLBACK` and rethrow), releases; refuses an argument that is not a uuid before touching the database; **no `SET` outside a transaction anywhere in the file** (S3, §289)
- [x] T009 Write `smp-app/db/schema.sql` **platform half only** for now: `tenants`, `users`, `tenant_users` (with the deferrable FK `(tenant_id, person_key) → people` added later in T028 once `people` exists), `sessions`, `login_attempts`, `platform_access`, `tenant_log`, `push_keys`, exactly `data-model.md`'s columns and keys, plus the partial unique index for one `super` per tenant; no tenant table yet

**Checkpoint**: `node smp-app/db/apply.mjs` against a fresh harness database applies `roles.sql` + the platform half and exits 0; a second run applies nothing and exits 0.

---

## Phase 3: S1 — the role and `FORCE` 🎯 MVP

**Goal**: prove that `smp_app` can be made, owns nothing, and that `FORCE ROW LEVEL SECURITY` holds against it — the one thing the whole spec rests on (spec §4.3).

**Independent test**: `node smp-app/spike/s1-neon-role.mjs` prints `rolcreaterole`/`rolsuper` then five `ok` lines; `--break=no-force` and `--break=bypass` each print a `FAIL` and exit 1.

- [x] T010 [S1] Write `smp-app/spike/s1-neon-role.mjs`: prints the connected key's `rolcreaterole` and `rolsuper` from `pg_roles` **first**; runs `db/roles.sql`; creates one scratch table `_spike_rls (tenant_id uuid not null, v text)` with the `tenant_rows` policy, `ENABLE` and `FORCE`; inserts two rows under two uuids as the owner; asserts (1) `smp_app` exists with `rolbypassrls = f`, (2) `smp_app` owns no table (`pg_tables WHERE tableowner='smp_app'` empty), (3) as `smp_app` with no setting `SELECT count(*)` is **0**, (4) as `smp_app` inside `withTenant(A)` the count is 1, (5) as the owner with no setting the count is 2 (the owner bypasses — which is why the app must not be the owner); drops the scratch table
- [x] T011 [S1] Add the breaks to `s1-neon-role.mjs`: `--break=no-force` omits `FORCE` and connects as the owner for assertion 3 (expected FAIL: sees every row); `--break=bypass` creates the role with `BYPASSRLS` (expected FAIL on assertion 1 and 3)
- [x] T012 [S1] Add `--neon` mode to `s1-neon-role.mjs` (quickstart §4): no harness database, works in the connected database, creates `smp_app` only if absent, uses the scratch table only, prints the same lines, **never prints the URL**, and prints `STOP: this key cannot create roles (rolcreaterole f) — research §P5` and exits 2 when the first line is `f`
- [x] T013 [S1] Run red first and record: `node smp-app/spike/s1-neon-role.mjs --break=no-force` (FAIL), `--break=bypass` (FAIL), then the green run — paste the three outputs' property lines into `smp-app/spike/README.md` under "S1 · first runs"

**Checkpoint**: S1 green locally. T072 (Islam's Neon run) is queued from here and does **not** block S3–S9; it blocks the first screen.

---

## Phase 4: S3 — the pooler

**Goal**: prove a bare `SET` leaks under a transaction pooler and `SET LOCAL` inside `withTenant` does not (§289, §313.34).

**Independent test**: `node smp-app/spike/s3-pooler.mjs` prints `ok` for both halves; `--break=bare-set` prints FAIL.

- [x] T014 [S3] Write `smp-app/spike/s3-pooler.mjs`: on the harness database with `_spike_rls` seeded (A: 1 row, B: 1 row) as `smp_app`: (1) through `poolerModel()` a bare `SET app.tenant_id = A` then `SELECT count(*)` reads **0** (the setting did not survive the statement boundary); (2) through `withTenant(A)` on the direct URL the count is 1; (3) through `poolerModel()` a `BEGIN; SET LOCAL …; SELECT; COMMIT` also reads 1 (a transaction pins one backend even under the pooler); prints each
- [x] T015 [S3] Add `--break=bare-set` to `s3-pooler.mjs`: swaps `withTenant` for a version that runs `SET` outside a transaction and asserts (2) — expected FAIL reading 0
- [x] T016 [S3] Run red first (`--break=bare-set`) then green; record both under "S3 · first runs" in `smp-app/spike/README.md`

---

## Phase 5: S5 — the schema check, written before the tables it checks

**Goal**: the catalogue query every later table must pass (data-model.md's four rules), red on a table added wrong.

**Independent test**: `node smp-app/spike/s5-schema-check.mjs --break=add-table` names `stray`; the green run passes on the platform-only schema (zero tenant tables is a pass with the count printed).

- [x] T017 [S5] Write `smp-app/lib/schema-check.ts` exporting `schemaCheck(client): Promise<{ ok: boolean; problems: string[]; tenantTables: string[] }>` implementing data-model.md's rules: (1) every `public` table not in the platform list (`tenants users tenant_users sessions login_attempts platform_access tenant_log push_keys _migrations`) has `tenant_id uuid NOT NULL` with an FK to `tenants` whose `confdeltype = 'c'`; (2) `relrowsecurity` and `relforcerowsecurity` both true and exactly one `pg_policy` row named `tenant_rows` with `polcmd = '*'`; (3) `smp_app` owns no table and `rolbypassrls = f`; (4) every FK between two tenant tables lists `tenant_id` on both sides; each violation is one sentence naming the table
- [x] T018 [S5] Write `smp-app/spike/s5-schema-check.mjs`: applies the schema, runs `schemaCheck`, prints `ok <n> tenant tables pass` or one `FAIL` per problem; `--break=add-table` creates `stray (id int, name text)` before the check (expected FAIL naming `stray`, rule 1); `--break=no-force:<table>` runs `ALTER TABLE <table> NO FORCE ROW LEVEL SECURITY` first (expected FAIL, rule 2; usable only once tenant tables exist — T031 re-runs it)
- [x] T019 [S5] Run `--break=add-table` (FAIL) then green on the platform-only schema; record under "S5 · first runs"

---

## Phase 6: The shared schema — the 42 tenant tables (no proof of its own; S5 is its gate)

**Goal**: `smp-app/db/schema.sql` holds every tenant-owned table with its composite key, `tenant_id`, index, `ENABLE`, `FORCE` and `tenant_rows` policy, exactly as `data-model.md` lists them; S5 green over all 42.

- [x] T020 Write a generator-free, hand-checked SQL block in `smp-app/db/schema.sql` for the **singletons** `org`, `cycle`, `review`, `prior_cycle`: columns from `db/schema.sql` + migrations (read the frozen files; `extra jsonb` kept), `CHECK (id = 1)` removed, primary key `tenant_id`
- [x] T021 [P] Add the **idx-keyed** tables `group_clauses`, `group_key_objectives`, `themes`, `bands`, `history` with PK `(tenant_id, idx)`
- [x] T022 [P] Add the **key-keyed** tables `units`, `companies`, `functions`, `people`, `labels`, `weighting_factors` with PK `(tenant_id, key)`; `units.company` FK → `(tenant_id, key)` of `companies` where the frozen schema has one
- [x] T023 [P] Add the **id-keyed** plan tables `capabilities`, `projects`, `deliverables`, `outcomes`, `milestones`, `cap_key_objectives`, `unit_key_objectives`, `pillars`, `measures`, `tactics`, `plan_archives` with PK `(tenant_id, id)` and every FK (`cap_id`, `project_id`, `unit_key`, `pillar_id`, `fn`) rewritten as `(tenant_id, …)` keeping `ON DELETE CASCADE`
- [x] T024 [P] Add `unit_clauses (tenant_id, unit_key, idx)`, `swot_items (tenant_id, unit_key, cat, idx)`, `unit_roles`, `weighting_rows`, `ko_weights` keyed `(tenant_id, unit_key)`, `weighting_values (tenant_id, unit_key, factor_key)`, `access_grants (tenant_id, role_key, page_key)` — noting `access_grants` is `role_key` here where the frozen `schema.sql` still says `level_key` (§33; read `db/migrations` for the rename before copying columns)
- [x] T025 [P] Add the nine tables outside the clear: `bu_declarations (tenant_id, person_key)` **with no FK to people** (§56), `change_log` (bigserial kept, `tenant_id`, index `(tenant_id, at)`), `chat_threads (tenant_id, person_key)`, `chat_messages` (FK `(tenant_id, person_key) → chat_threads`), `messages`, `message_drafts`, `message_recipients` (FK `(tenant_id, message_id) → messages`), `push_subscriptions (tenant_id, person_key, endpoint)`, `assistant_asks` (bigserial, `tenant_id`, index on `(tenant_id, ask_key)`)
- [x] T026 Write the RLS block once at the end of `smp-app/db/schema.sql`: a `DO $$ … FOR t IN (every table in public not on the platform list) LOOP … ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY; CREATE POLICY tenant_rows … USING (…) WITH CHECK (…); CREATE INDEX IF NOT EXISTS … (tenant_id) END LOOP $$` — one loop from the catalogue, so a table added later is covered on the next apply (data-model.md's policy text verbatim)
- [x] T027 Add the `tenant_users (tenant_id, person_key) → people (tenant_id, key)` FK, `DEFERRABLE INITIALLY DEFERRED`, at the end of `smp-app/db/schema.sql` (after `people` exists; §313.32)
- [x] T028 Extend `_harness.mjs`'s `seedTwoTenants()` so it inserts one row per tenant into **every** table the catalogue lists (walks `schemaCheck().tenantTables`, fills NOT NULL columns from `information_schema.columns` with typed placeholders, satisfies FKs by inserting parents first in dependency order from `pg_constraint`); asserts afterwards that no tenant table is empty for A or B
- [x] T029 Run `smp-app/spike/s5-schema-check.mjs`: expected `ok 42 tenant tables pass`; if the count is not 42, reconcile against `data-model.md`'s list (the list is the decision — a 43rd table is a question, not a fix) and record the count under "schema" in `smp-app/spike/README.md`
- [x] T030 Run `s5-schema-check.mjs --break=no-force:tactics` (expected FAIL naming `tactics`) and record it
- [x] T031 Run `npx prisma db pull` in `smp-app/` against the harness database (`DATABASE_URL_UNPOOLED` exported) and commit the regenerated `smp-app/prisma/schema.prisma`; confirm every tenant model carries `tenant_id` and the composite `@@id`; Prisma introspects and never migrates (research §P2) — do not run `prisma migrate`

**Checkpoint**: S5 green over 42 tables, red on `add-table` and `no-force:<table>`; `schema.prisma` regenerated.

---

## Phase 7: S2 — isolation

**Goal**: as `smp_app` with A set, no-WHERE reads, inserts and deletes on every tenant table stay inside A (spec §4.3, §5).

**Independent test**: `node smp-app/spike/s2-isolation.mjs` prints `ok` for all 42 tables × three verbs; `--break=no-policy:tactics` and `--break=owner` print FAIL.

- [x] T032 [S2] Write `smp-app/spike/s2-isolation.mjs`: seeds A and B; for every table from `schemaCheck().tenantTables` (never a literal list), inside `withTenant(A)`: (1) `SELECT count(*)` with no WHERE equals A's seeded count and `SELECT DISTINCT tenant_id` is `{A}`; (2) `INSERT … tenant_id = B` is refused with SQLSTATE `42501` and B's count is unchanged; (3) `DELETE FROM <t>` with no WHERE deletes A's rows only, B's count unchanged — read B's counts as the owner before and after; prints one line per table per verb
- [x] T033 [S2] Add the breaks: `--break=no-policy:<table>` drops that table's `tenant_rows` policy after seeding (expected FAIL: read returns B's rows too — note `FORCE` with no policy denies everything, so the assertion that fails must be named: rule (1) reads 0, and the check must report 0 ≠ A's count as FAIL rather than as "isolated"); `--break=owner` runs the three verbs as the owner (expected FAIL on all three)
- [x] T034 [S2] Run both breaks red, then green; record under "S2 · first runs"

---

## Phase 8: S6 — the Prisma wrapper

**Goal**: every Prisma operation reaches tenant tables inside `withTenant`; one that escapes sees an empty world and S6 says so (research §P2).

**Independent test**: `node smp-app/spike/s6-prisma-wrapper.mjs` prints `ok` for each operation kind; `--break=escape` prints FAIL. If it cannot be made green, T038 applies.

- [x] T035 [S6] Write `smp-app/lib/prisma.ts`: the base client on `appPool()` via `@prisma/adapter-pg`; `tenantClient(tenantId)` returns `prisma.$extends({ query: { $allModels: { $allOperations({ args, query }) { return withTenantPrisma(tenantId, () => query(args)) } } } })` where the extension opens an interactive `$transaction`, runs `SELECT set_config('app.tenant_id', $1, true)` first, then the operation; `$queryRaw`/`$executeRaw` covered by `$allOperations` on `$queryRaw`/`$executeRaw` keys; the **unextended** client is exported only as `platformPrisma` for the platform tables
- [x] T036 [S6] Write `smp-app/spike/s6-prisma-wrapper.mjs`: through `tenantClient(A)`: `findMany` on `units` returns A's rows only; `create`, `update`, `delete` on `labels` land under A (read back as the owner); `$queryRaw\`SELECT current_setting('app.tenant_id', true)\`` returns A; a `$transaction([...])` of two ops both see A; through `platformPrisma`: the same `$queryRaw` returns `null` and `findMany` on `units` returns `[]` — **both asserted** (§94.2: the empty world is the safe failure and must be proved, not assumed)
- [x] T037 [S6] Add `--break=escape` to `s6-prisma-wrapper.mjs`: routes one operation kind (`update`) round the extension; expected FAIL — the update writes nothing (0 rows under FORCE) and the check reports it
- [x] T038 [S6] (not needed — S6 went green on Prisma) If T036 cannot go green for **every** operation kind after the extension is written honestly: write `smp-app/lib/tenant-pg.ts` (hand-written queries over `withTenant`, `lib/state-io.js`'s shape), re-point S6's tenant half at it, keep Prisma for the platform tables only, and record the outcome as **§314.3** in `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md` plus a line in `research.md` §P2 — this is the planned fallback, not a surprise; **do not** widen the extension into a `WHERE tenant_id` filter (spec §4.3 forbids it as the guarantee)
- [x] T039 [S6] Run `--break=escape` red, then green; record under "S6 · first runs" which driver the tenant layer ended on

---

## Phase 9: S4 — deletion

**Goal**: `DELETE FROM tenants WHERE id = $1` cascades through every tenant table and a neighbour loses nothing (spec §4.6).

**Independent test**: `node smp-app/spike/s4-delete.mjs` prints `ok 0 rows` per table for A and `ok unchanged` per table for B; `--break=no-cascade:measures` prints FAIL.

- [x] T040 [S4] Write `smp-app/lib/tenant-delete.ts`: `deleteTenant(ownerClient, tenantId): Promise<{ counts: Record<string, number> }>` — runs as the **owner** (the only role that reaches `tenants`), inside one transaction: `DELETE FROM tenants WHERE id = $1`, then for every table in `schemaCheck().tenantTables` counts rows `WHERE tenant_id = $1` and throws if any is non-zero; returns the counts; the export step (§304's workbooks) is **not** in this slice and is named in a comment as the caller's first step
- [x] T041 [S4] Write `smp-app/spike/s4-delete.mjs`: seeds A and B, records B's per-table counts, calls `deleteTenant(A)`, asserts every table 0 for A and B's counts identical; `--break=no-cascade:<table>` recreates that table's FK to `tenants` with `ON DELETE RESTRICT` before the delete (expected FAIL: the delete is refused, or — if the break instead drops the FK — a row survives; the script must name which)
- [x] T042 [S4] Run `--break=no-cascade:measures` red, then green; record under "S4 · first runs"

---

## Phase 10: S7 — the door

**Goal**: `lib/auth.js` ported rule for rule; a client user at another slug lands on their own; refused and nonexistent are one sentence (contracts/tenant-request.md §1–§2).

**Independent test**: `node smp-app/spike/s7-door.mjs` prints `ok` for landing, refusal, nonexistent-identical, must_change; `--break=follow-slug` and `--break=two-refusals` print FAIL.

- [x] T043 [S7] Write `smp-app/lib/auth.ts` porting from `lib/auth.js` **by reading it, not by rewriting**: `hashPassword`/`verifyPassword` (scrypt, per-password salt, same encoding so migrated hashes verify), `SESSION_DAYS = 30`, `tokenHash`, `createSession(userId)` writing `sessions(token_hash, user_id, expires_at)`, `getSession(cookie)` joining `users` and pruning expired rows, `rateLimited(email, address)` reading `login_attempts` **before** verification (8 per email, 25 per address, 15 minutes, failures only, cleared on success), `passwordPolicy`, `endOtherSessions(userId, keepTokenHash)` (§43.7), cookie serialisation with `httpOnly; SameSite=Lax; Secure` outside development. `sessions`, `users` and `login_attempts` are platform tables with no RLS, reached through `platformPrisma` or a plain `appPool()` query as `smp_app` — never the owner pool at runtime; note in the file that `roles.sql` grants `smp_app` its table privileges on them
- [x] T044 [S7] Write `smp-app/lib/door.ts`: `resolveTenant(session, slug)` implementing contracts/tenant-request.md §1 steps 2–4 — `tenants WHERE key = $1 AND status='active'`; `kind='client'` → their single `tenant_users` row, a different slug answers `{ redirect: '/<own-slug>' }`; `kind='office'` → a `tenant_users` row for this tenant, or `is_admin`, or `platform_access` (port `mayOpenClient()` from `lib/platform-rules.js`); refused and nonexistent both return the **same** `{ status: 404, message: NO_SUCH_TENANT }` constant (one string, `lib/platform-io.js`'s `noSuchClient()` sentence); exports `NO_SUCH_TENANT`
- [x] T045 [S7] Write `smp-app/spike/s7-door.mjs`: seeds A and B, three users (a `client` user on A, an office user on A only, an admin), signs each in through `auth.ts` (a real hash, a real session row): (1) client user resolving B's slug → redirect to A's; (2) office user resolving B → refused; (3) anyone resolving `no-such-slug` → **byte-identical** status and message to (2); (4) a user with `must_change` gets `MUST_CHANGE` from `resolveTenant` before any tenant is set; (5) `rateLimited` answers true on the 9th failure for one email and clears after one success; prints each
- [x] T046 [S7] Add the breaks: `--break=follow-slug` makes the client branch return B (expected FAIL on 1); `--break=two-refusals` makes nonexistent answer 404 and refused 403 (expected FAIL on 3)
- [x] T047 [S7] Run both breaks red, then green; record under "S7 · first runs"

---

## Phase 11: S8 — Raya Trade carried across

**Goal**: `scripts/migrate-raya.mjs` moves the `raya_trade` schema into the shared schema under Raya's `tenant_id`, proved on a copy (spec §4.7, §314.1).

**Independent test**: `node smp-app/spike/s8-raya-migration.mjs --from=<copy url>` prints `ok <table> n = n` for every tenant table, `ok plan mobile byte-identical`, `ok save round-trip`, `ok sign-in <email>`; `--break=short:people` and `--break=wrong-tenant` print FAIL.

- [x] T048 [S8] Write `smp-app/lib/state-io.ts` **read side**: `readState(client)` ported from `lib/state-io.js`'s `readState` (line ~814) to run inside `withTenant` with no `tenant_id` in any WHERE (RLS supplies it), returning the same graph shape byte for byte (canonical JSON compare, §249.3); readers return frozen empties, never create (constitution XII)
- [x] T049 [S8] Write `smp-app/lib/state-io.ts` **seed/load side**: `loadGraph(client, graph)` — inserts a whole graph under the current tenant (the migration's and the demo seed's path, **not** a save path: it is only ever run into an empty tenant and throws if any graph table already holds a row for this tenant); ported row builders from `lib/state-io.js`'s `rowsOf`/`colsFor` with `tenant_id` added to every row
- [x] T050 [S8] Write `smp-app/scripts/migrate-raya.mjs`: `--from=<url of the copy>`; reads `raya_trade` through the **frozen** `lib/state-io.js` `readState()` (require it from the repo root — the reader that wrote the blobs interprets them once, data-model.md), creates Raya's `tenants` row (`key='raya-trade'`), `loadGraph()` under it, copies the nine outside-the-clear tables row by row with `tenant_id` added (keeping bigserial ids where they are keys), copies `platform.accounts` → `users` (hash and `must_change` verbatim) and `platform.account_clients` → `tenant_users` (seat verbatim, `person_key` resolved by email against Raya's register as §313.32 does), **not** `platform.sessions`; prints per-table counts; header comment says it is deleted after the cutover (§314.1)
- [x] T051 [S8] Make the copy per quickstart §3: `createdb smp_v20`, `DATABASE_URL=postgres://postgres@localhost:5432/smp_v20 node scripts/test-roundtrip.js` (seeds the v2.0 shape), `DATABASE_URL=… node scripts/migrate-to-multi-client.js` (public → `raya_trade` + platform); confirm `raya_trade.people` has 33 rows; record the two commands' last lines
- [x] T052 [S8] Write `smp-app/spike/s8-raya-migration.mjs`: runs `migrate-raya.mjs` against the copy into a harness database; for every tenant table asserts `count WHERE tenant_id = Raya` equals `count` in `raya_trade.<table>` (change_log and the chat tables included); reads Mobile's plan through `state-io.ts` inside `withTenant(Raya)` and through the frozen `readState()` on the copy and asserts canonical-JSON equality; posts one change-list save through the save handler of T057 (or, until T057 exists, through `applyChanges` + T058's writer called directly) and reads it back; signs in as a migrated account with its stored hash and asserts a session row and `must_change` unchanged
- [x] T053 [S8] Add the breaks: `--break=short:<table>` skips one table in the migration (expected FAIL naming it); `--break=wrong-tenant` writes one table under B's `tenant_id` (expected FAIL: Raya short by that table AND B's count moved — both named)
- [x] T054 [S8] Run both breaks red, then green; record under "S8 · first runs"; **do not** delete `migrate-raya.mjs` (that is a cutover-day task, §314.1)

---

## Phase 12: S9 — the row-addressed save (§314.2)

**Goal**: a change list writes only the rows it names; nothing clears a table; an unaddressable shape is a 400 (research §P3, contracts/tenant-request.md §3).

**Independent test**: `node smp-app/spike/s9-row-write.mjs` prints `ok` for the one-field save, the `xmin` sweep, add/remove/reorder, the 400, and B untouched; `--break=full-write` and `--break=silent-fallback` print FAIL.

- [x] T055 [S9] Port `lib/graph-diff.js` to `smp-app/lib/graph-diff.ts` **unchanged in semantics** (it is a UMD file; wrap, do not rewrite): `diff`, `applyChanges`, `REVIEW_PER_TARGET`, the three-segment allow-list (§215, §234) — re-run `scripts/test-graph-diff.js`'s assertions against the port (copy the file to `smp-app/tests/graph-diff.mjs` pointing at the port; expect the same 136/0)
- [x] T056 [S9] Port `lib/authorize.js` to `smp-app/lib/authorize.ts` with `lib/rules.js` as `smp-app/lib/rules.ts` (one module, both sides, constitution IX): row lookup takes `{ tenantId, key }` only where a row is addressed by key outside the graph; the graph-shaped classification is byte-for-byte; re-run `scripts/test-authorize.js` against the port as `smp-app/tests/authorize.mjs` (expect the same 588/0)
- [x] T057 [S9] Write `smp-app/lib/save.ts`: `save(tenantId, actor, body: { base, changes, expect })` implementing contracts/tenant-request.md §3 steps 1–6 inside `withTenant`: `pg_advisory_xact_lock(420043, hashtext($1))`, `readState`, `applyChanges`, `authorize` (403 with §184's verdict shape), `writeChanges` (T058), `change_log` rows from the diff, COMMIT, `{ ok, wrote: 'rows', rows, at }`; a whole-graph body (`body.state`) is **400**
- [x] T058 [S9] Write `smp-app/lib/state-io.ts` **write side** `writeChanges(client, stored, incoming, changes)`: starting from `lib/state-io.js`'s `planSubjects`/`writeStateIncremental` (line ~596–800) but **row-addressed, not subject-addressed** — for each change path: a field on an existing row → `UPDATE <table> SET <col> = $ WHERE tenant_id = current_setting(…) AND <key> = $` (or the `extra` jsonb key when the field is filed there, per `colsFor`); a row that appeared → `INSERT`; a row that went → `DELETE … WHERE <key>`; a reorder → `UPDATE … SET idx` for the rows whose idx moved only; a singleton field → `UPDATE org/cycle/review`; `review.<map>.<target>` → the row's `extra` jsonb key; a path it cannot address → throw `UnaddressableChange(path)` **before any write** (the handler answers 400 naming it); **no `DELETE` without a key and no `TRUNCATE` anywhere in the file** — add a test in T059 that greps the compiled module for both
- [x] T059 [S9] Write `smp-app/spike/s9-row-write.mjs`: seeds A from the worked example (`db/seed-state.json` through `loadGraph`) and B with the harness rows; snapshot `xmin` for every row of every tenant table as the owner; (1) `save(A, smo, one change to one measure's target)` → that row holds the value; (2) every other row's `xmin` unchanged (a row whose `xmin` moved is named — table and key); (3) a change list adding a tactic writes one row, `xmin` sweep unchanged elsewhere; (4) removing it deletes one row; (5) reordering two pillars moves exactly the rows whose `idx` changed; (6) a change list with a path outside the allow-list answers 400 naming the path and the `xmin` sweep shows no write at all; (7) B's counts and `xmin` identical throughout; (8) `grep -c 'TRUNCATE\|DELETE FROM [a-z_]* *WHERE tenant_id *= *\$1 *$'` over `smp-app/lib/state-io.ts` is 0
- [x] T060 [S9] Add the breaks: `--break=full-write` swaps `writeChanges` for a clear-and-reinsert of the graph (expected FAIL on 2: every row's `xmin` moved — the reported fault, §314.2); `--break=silent-fallback` makes an unaddressable path fall through to the full writer instead of throwing (expected FAIL on 6)
- [x] T061 [S9] Run both breaks red, then green; record under "S9 · first runs" with the count of rows a one-field save wrote (expected 1, plus the `change_log` row)
- [x] T062 [S9] Re-run S8's save round-trip assertion (T052) through `save()` now that it exists, and confirm S2, S4, S5 still green on the same schema (a writer that added a table or an FK would move S5)

**Checkpoint**: S1–S9 green, each recorded red first. The data layer is settled (quickstart §5).

---

## Phase 13: Polish, record, and what waits on Islam

- [x] T063 [P] Write `smp-app/db/README.md`: what `apply.mjs` does and when it runs (deploy, never per request — research §P6), the two roles and which pool each file uses, and that `schema.prisma` is a pull (`npm run db:pull`) never a migration source
- [x] T064 [P] Add `npm run spike` to `smp-app/package.json` running all nine green scripts in delivery order and stopping at the first non-zero exit; add `npm run spike:red` running every documented `--break` and asserting each exits non-zero (a break that goes green is the finding — §94.5)
- [x] T065 [P] Run `npm run typecheck` in `smp-app/`; fix every error in the new files; no `any` on a tenant id
- [x] T066 Run the frozen product's own checks once to prove nothing in it moved: `node scripts/test-authorize.js`, `node scripts/test-graph-diff.js`, `node scripts/test-session-state.js`, and `git diff --stat -- lib db SMP-Project-Folder api` must be empty (constitution III: the frozen build is untouched by this slice)
- [x] T067 Run `node scripts/test-session-state.js`'s grep over `smp-app/lib/*.ts` as well (a bare `SET`, `pg_advisory_lock`, `LISTEN`, `PREPARE`, a temp table outside a transaction) — extend the script's file list or copy its grep into `smp-app/tests/session-state.mjs`; expect 0
- [x] T068 Append **§314.3** to `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md`: what the spike found — the S6 driver outcome, the S5 table count, the S9 row count for a one-field save, anything a break taught (in the file's voice: the measurement, the decision, the cost) — in the same commit as the last green proof (constitution II)
- [x] T069 Update `IMPLEMENTATION_PROGRESS.md` (built / in flight / next / waiting on Islam) and the direction paragraph in `CLAUDE.md` in that same commit: nine proofs green, the data layer settled, the first screen group next and it begins with a mockup
- [x] T070 Update `specs/043-shared-schema-rebuild/spec.md`'s status line and `quickstart.md` §5 with the date the spike went green and the S6 outcome
- [x] T071 Commit on `claude/smp-tenancy-stack-decision-l5aoo5` with a message naming the proofs and their red counts; push with `git push -u origin claude/smp-tenancy-stack-decision-l5aoo5`; **do not merge** — `main` is Islam's call, on that merge
- [x] T072 **Answered 2026-09-09 through Neon's SQL editor, recorded as §314.4** (`neondb_owner · rolcreaterole t · rolsuper f · rolbypassrls t`; the sign-in-as-`smp_app` half stays local until the first deploy applies `roles.sql`). The ask as it stood: hand him the one command from quickstart §4 (`export DATABASE_URL_UNPOOLED='…'` from the Vercel project's settings, then `node smp-app/spike/s1-neon-role.mjs --neon`) to run from his own shell, and ask for the printed lines only — never the URL. If the first line is `rolcreaterole f`, stop: research §P5 names the two ways forward and neither is taken without his decision. Record his answer in §314.3 (or §314.4 if §314.3 has landed)

---

## Dependencies

- Phase 1 → Phase 2 → S1 (Phase 3). S1 green is the gate for everything after it **locally**; T072 (Neon) gates the first **screen**, not the spike.
- S3 (Phase 4) needs `tenant.ts` (T008) and the harness pooler model (T005).
- S5 (Phase 5) is written **before** the tenant tables so Phase 6 can fail it one table at a time; Phase 6 ends with S5 green.
- S2, S6, S4 (Phases 7–9) each need Phase 6 and the full seed (T028); they are independent of one another and may run in parallel once written.
- S7 (Phase 10) needs the platform tables (T009) and T027's deferred FK; independent of S2/S6/S4.
- S8 (Phase 11) needs the read side of `state-io.ts` (T048), `loadGraph` (T049) and the copy (T051); its save assertion is finished by T062 after S9.
- S9 (Phase 12) needs the ports (T055, T056), `save.ts` (T057) and the writer (T058); its `xmin` sweep needs the full seed.
- Phase 13 needs S1–S9 green.

## Parallel opportunities

- T003, T004, T005 together (Phase 1).
- T021–T025 together (five SQL blocks, one file — merge by section, or write each to `smp-app/db/parts/*.sql` and concatenate in T026's order).
- After Phase 6: S2 (T032–T034), S6 (T035–T039) and S4 (T040–T042) in parallel; S7 (T043–T047) alongside them.
- T055 and T056 (the two ports) together, before T057.
- T063, T064, T065 together.

## Implementation strategy

1. **MVP is S1 green locally** (Phases 1–3): if the role and `FORCE` do not hold, nothing else is worth writing — and T072's Neon answer decides whether the plan continues or stops for a decision (research §P5).
2. Then the two proofs that need no tenant tables (S3, S5), then the schema under S5's eye, table group by table group.
3. Then the three isolation proofs in parallel, the door, Raya's copy, and last the row-addressed save — the enhancement Islam asked for (§314.2) — because it needs every earlier piece.
4. Every proof red first, every red run recorded in `smp-app/spike/README.md`; the decisions log and the tracker in the same commit as the last green.
5. Nothing served, nothing merged. The first screen group is a new `tasks.md`, and it starts with its mockup.

## Status (2026-09-09)

T001–T071 done the same day the list was written; every proof green and red first (§314.3, `smp-app/spike/README.md`). **T072 answered (§314.4).** Departures from the plan, recorded: the writer is a table-level row diff rather than a path interpreter (T058 — simpler, and it covers every shape by construction); the policy took `NULLIF` and `tenant_id` a default (§314.3); `app/page.tsx` is a compile placeholder, not a screen.

## Task count

72 tasks: Setup 5 · Foundational 4 · S1 4 · S3 3 · S5 3 · schema 12 · S2 3 · S6 5 · S4 3 · S7 5 · S8 7 · S9 8 · Polish/record/waiting 10.
