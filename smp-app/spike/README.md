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
**The Neon key, from Islam via Neon's SQL editor (§314.4):** `rolname neondb_owner · rolcreaterole t · rolsuper f · rolbypassrls t` — the key makes the role, §P5's stop does not fire. The editor runs as the owner, so steps 3–4 (signing in AS `smp_app`) did not run on Neon; they run when `db/apply.mjs` first applies `roles.sql` at a deploy.

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

### S6 · the Prisma wrapper (2026-09-09) — Prisma stays; two findings
The extension is Prisma's own documented RLS shape: every model operation
AND every raw query runs as the second statement of a batch `$transaction`
whose first is `set_config('app.tenant_id', $1, true)`. An interactive
transaction does not bind `query(args)` (the first build tried it and read
0 rows); a batch does. **What it does not give**: several operations in ONE
transaction — the save with its lock goes through `withTenant()` on pg, said
in `lib/prisma.ts`.
**Finding, and a correction to the policy (§314.3):** on a reused connection
a custom setting that has ever been set reads back as `''` after its
transaction ends, not NULL — so the unextended client errored `22P02` rather
than reading an empty world. Both fail closed; a safe failure should be one
thing, so the policy is `NULLIF(current_setting(…, true), '')::uuid` on
every table, data-model.md corrected, S1–S5 re-run green on it.
`--break=escape` → RED 10 ok, 1 failed: *"updateMany writes A's row — count 0"*
— the escaped operation silently wrote nothing, which is exactly the blank
page this proof exists to catch.
green → 11 ok: findMany · $queryRaw reads A · create under A · create under
B refused · updateMany · deleteMany · two at once · $executeRaw · the
unextended client reads no setting · sees an EMPTY table · B untouched.

### S7 · the door (2026-09-09)
`lib/auth.ts` is `lib/auth.js` rule for rule (scrypt `s1:` hashes verify
unchanged, 30-day sessions on `users.id`, 8/25 in 15 minutes checked before
the password, failures only, cleared on success, a change ending the OTHER
sessions); `lib/door.ts` is `platform-rules.js`'s `clientState`/`mayOpenClient`
ported with `landingFor`.
`--break=follow-slug` → RED 14 ok, 1 failed: the client user at B's slug is
let into B.
`--break=two-refusals` → RED 13 ok, 2 failed: refused answers 403 *"You are
not on that client"* where nonexistent answers 404 — the two can be told apart.
green → 15 ok: sign-in · the wrong password's one sentence · the token
resolves · client user at B → 302 /a-co · at their own slug in · office user
not on B refused · nonexistent byte-identical · client user at nonexistent
sent home · the admin opens B holding `super` · must_change blocks the tenant
route and not the password route · a change clears it and keeps THIS
session · the 9th attempt refused with the right password · a success clears
the failures · no session → the same refusal, no default tenant.

### S8 · Raya Trade carried across (2026-09-09)
Against the copy (`smp_v20`, seeded by the frozen round trip and moved by
`scripts/migrate-to-multi-client.js` into `raya_trade` + `platform`):
`scripts/migrate-raya.mjs` reads through the FROZEN reader and loads through
`loadGraph` under Raya's tenant; the nine outside tables row for row; the
accounts with their hashes. The three office memberships name nobody on
Raya's register (`ff_islam`, §313.32) and are skipped and said, exactly as
the frozen door refuses them.
`--break=short:people` → RED 4 ok, 4 failed: *"people: 32 under Raya, 33 in
the copy"*, the graph no longer byte-identical, and the save refused because
the first person dropped was the SMO.
`--break=wrong-tenant` → RED 4 ok, 5 failed: *"labels: 0 under Raya, 8 in the
copy"* AND *"labels: B 0 → 8"* — both named. **Its first shape went green**:
it moved `chat_threads`, which the copy holds none of (§113.8); it moves a
graph table with rows now.
green → 7 ok: 42 counts equal · the whole graph byte-identical (normalised)
through `state-io.ts` · mobile's plan on its own · a change-list save
round-trips · a migrated account signs in with its OLD hash, `must_change`
intact · the door answers for raya-trade · B untouched.

### S9 · the row-addressed save (2026-09-09) — the enhancement (§314.2)
The save is `lib/save.ts` (lock per tenant · read · actingFor · applyChanges
· authorize · `writeChanges` · change_log · COMMIT) and the writer is
`lib/state-io.ts`: the two graphs' rows are built by the SAME builders the
loader uses and only the rows that differ are written. Every change list is
made by the differ's own `graphChanges()`.
**The sweep had to count a vanished ctid as a rewrite**: an UPDATE gives its
row a new ctid, so a "changed xmin at the same ctid" test walked past every
update — including a clear-and-reinsert of 795 rows (§94.5). It counts a row
as rewritten when its xmin changed OR its ctid is gone, and asserts EXACTLY
the rows named.
`--break=full-write` → RED 1 ok, 7 failed: the first *"every OTHER row's xmin
is what it was — 795 rows rewritten"*, the reported fault.
`--break=silent-fallback` → RED 11 ok, 2 failed: *"a row with no id is refused
… — code 200 {wrote: full-fallback}, rewritten 795"*.
green → 13 ok: one field → 1 UPDATE, 795 rows swept, one measures row moved ·
the save reports 1 row · change_log carries it · add → 1 INSERT · remove → 1
DELETE · a reorder → exactly the 2 pillar rows whose idx moved · a row with
no id → 400 naming `measures`, nothing written · a group setting → 1 UPDATE on
`org` · a register edit → 1 people row · a whole-graph body → 400 · B
untouched · no TRUNCATE and no keyless DELETE in the writer.

### Also run (2026-09-09)
`tests/graph-diff.cjs` 136/0 and `tests/authorize.cjs` 588/0 against the
carried-across copies (`lib/graph-diff.cjs`, `lib/authorize.cjs`,
`lib/rules.cjs`); `npx tsc --noEmit` clean; the frozen product's own
`test-authorize`, `test-graph-diff` and `test-session-state` green and
`git diff` on `lib/ db/ api/ SMP-Project-Folder/` empty — nothing in it moved.
