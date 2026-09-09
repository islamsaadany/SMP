# Quickstart · running the spike

Prerequisites: Node 22, Postgres 16 (the sandbox cluster at
`/usr/lib/postgresql/16`, or any throwaway). Nothing here touches production
or `main`.

## 1 · A throwaway database

```bash
sudo -u postgres pg_ctlcluster 16 main start          # sandbox: the cluster is installed and down
export DATABASE_URL_UNPOOLED=postgres://postgres@localhost:5432/postgres   # owner key, local only
```

The harness creates `smp_spike_<n>` per run as the owner, applies
`smp-app/db/schema.sql`, `db/roles.sql` and the migrations through
`db/apply.mjs`, seeds tenants A and B, and drops the database at the end.

## 2 · Run the proofs, red first

```bash
cd smp-app
node spike/s1-neon-role.mjs --break=no-force      # expected: FAIL — the owner sees every row
node spike/s1-neon-role.mjs                       # expected: 5 lines, all ok
node spike/s3-pooler.mjs --break=bare-set && echo UNEXPECTED
node spike/s3-pooler.mjs
node spike/s5-schema-check.mjs --break=add-table  # expected: FAIL naming `stray`
node spike/s5-schema-check.mjs
node spike/s2-isolation.mjs --break=no-policy:tactics
node spike/s2-isolation.mjs                       # walks all 42 tables from the catalogue
node spike/s6-prisma-wrapper.mjs --break=escape
node spike/s6-prisma-wrapper.mjs
node spike/s4-delete.mjs --break=no-cascade:measures
node spike/s4-delete.mjs
node spike/s7-door.mjs --break=two-refusals
node spike/s7-door.mjs
node spike/s9-row-write.mjs --break=full-write     # S9 needs no copy; S8 (§3) does
node spike/s9-row-write.mjs
```

Or all of it: `npm run spike` (the nine green runs, in order, stopping at the
first red) and `npm run spike:red` (every documented break, asserting each
exits non-zero — a break that goes green is the finding, §94.5).

Expected on every unbroken run: every line `ok`, exit 0. Expected on every
`--break`: at least one `FAIL` naming the property, exit 1. **A red run that
prints nothing is the harness dying, not a failure** (§215) — every script
reports every property it reached.

## 3 · S8 — Raya's migration, on a copy

```bash
# a second throwaway with the frozen product's shape:
createdb smp_v20 && DATABASE_URL=postgres://postgres@localhost:5432/smp_v20 node ../scripts/test-roundtrip.js   # seeds a v2.0-shaped tenant
DATABASE_URL=… node ../scripts/migrate-to-multi-client.js          # public → raya_trade (+ platform, rhi, el_abd)
node spike/s8-raya-migration.mjs --from=postgres://…/smp_v20 --break=short:people
node spike/s8-raya-migration.mjs --from=postgres://…/smp_v20
```

Expected: one line per tenant table `ok <table> <n> = <n>`, then
`ok plan mobile byte-identical`, `ok save round-trip`, `ok sign-in <email>`.

## 4 · S1 against the real Neon key — Islam's machine, not this sandbox

```bash
export DATABASE_URL_UNPOOLED='…'      # from the Vercel project's settings; never pasted in chat
node smp-app/spike/s1-neon-role.mjs --neon
```

`--neon` makes no throwaway: it creates `smp_app` if absent, one scratch
table `_spike_rls` with the policy, proves `FORCE` against the role, and drops
the scratch table. It prints the key's `rolcreaterole` / `rolsuper`, five
`ok`/`FAIL` lines, and nothing else. **If the first line is
`rolcreaterole f`, stop and say so** — research.md §P5 names the two ways
forward and neither is taken without a decision.

**The gating line alone can be answered in Neon's SQL editor** — it runs as
the owner, which is what the script's first step is — with no connection
string involved at all:

```sql
SELECT rolname, rolcreaterole, rolsuper, rolbypassrls
FROM pg_roles WHERE rolname = current_user;
```

**Answered 2026-09-09 (§314.4):** `neondb_owner · rolcreaterole t · rolsuper f
· rolbypassrls t` — the key makes the role; §P5's stop does not fire. The
editor cannot run the rest (it cannot sign in AS `smp_app`); that half is
proved locally (§2) and runs against Neon when `db/apply.mjs` first applies
`roles.sql` at a deploy.

## 5 · What green means

S1–S9 green, each having been red under its `--break`, is the data layer
settled — **reached 2026-09-09 on the sandbox's Postgres 16** (§314.3,
`smp-app/spike/README.md`). Nothing is served; the frozen build keeps every
client. S1's Neon answer is in (§4, §314.4). The first screen group — the
door and the landing — is built (§315, `tasks-door-landing.md`); §6 opens it.

## 6 · The door and the landing, locally (§315)

```
cd smp-app
export DATABASE_URL_UNPOOLED=postgres://postgres:postgres@localhost:5432/smp_dev   # sandbox only
createdb -h localhost -U postgres smp_dev 2>/dev/null; npm run dev:tenant           # raya-trade + four logins
npm run build && npm run check:door        # 44 assertions in headless Chromium, GREEN
npm run check:door:red                     # both breaks RED
npm run start                              # then open http://localhost:3000/
```

`scripts/dev-tenant.mjs` prints the four emails; the passwords are in that
file (development only, never a deployment). `/` is Forefront's door,
`/raya-trade/sign-in` the client's; a client login lands on `/raya-trade`,
the office on `/platform`. Every page behind the landing answers with a
holder that says it is the next group's.
