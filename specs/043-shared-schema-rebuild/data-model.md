# Phase 1 · Data model — one schema, every client

One Postgres schema, `public`. Two kinds of table: the **platform's own**,
read before a tenant is known and carrying no tenant policy; and the
**tenant-owned**, every one carrying `tenant_id` and refusing rows from any
other tenant under `FORCE ROW LEVEL SECURITY`. Spec §4 decides the shape; this
file names every table and what happens to its key.

## The platform's own tables

| table | key | notes |
|---|---|---|
| `tenants` | `id uuid` | `key text UNIQUE` (the slug) · `name` · `region` (one value, unread, §4.5) · `kind` client/demo · `status` active/retired · `mark` (PNG data URI) · `colors jsonb` · `made_here bool` · `created_at`. No `schema_name`. |
| `users` | `id uuid` | `email text UNIQUE` lower-cased · `name` · `password_hash` (scrypt) · `must_change bool` · `is_admin bool` · `kind` office/client · `status` · `created_at`, `updated_at`. **No tenant column.** |
| `tenant_users` | `(tenant_id, user_id)` | `person_key text` (the `people` row this login *is* inside the tenant; FK `(tenant_id, person_key) → people`, deferrable, because an office login may be placed after the register exists — §313.32) · `seat` super/smoteam/none. **Rule on the server:** a `client`-kind user holds exactly one row; a tenant may hold more than one `super` (§313.26, reversing §313.4 — migration 001 drops the index the first cut of this schema carried). |
| `sessions` | `token_hash text` | `user_id → users ON DELETE CASCADE` · `expires_at` · `created_at`. One door (§313.2). |
| `login_attempts` | `id bigserial` | `key` (email or address) · `at`. §43's two windows, unchanged. |
| `platform_access` | `(role_key, area_key)` | §37's matrix one level up, as §313 built it. |
| `tenant_log` | `id bigserial` | `tenant_id` · `user_id` · `at` · `what`. `client_log` renamed. |
| `push_keys` | `id = 1` | **moves here from the tenant side**: one VAPID pair per deployment (§231), not per tenant. |
| `_migrations` | `name text` | the registry `db/apply.mjs` writes; `_sql_migrations` and `_platform_migrations` both retire. |

`platform_access` and `tenant_log` are exactly §313's; only the vocabulary
moves (`client` → `tenant`).

## The tenant-owned tables — 42

Every row: `tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE
CASCADE`, an index on it, `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL
SECURITY`, and one policy for all four verbs:

```sql
CREATE POLICY tenant_rows ON <t>
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

With no setting `current_setting(…, true)` is null, the comparison is null,
and the table is empty to the caller. That is the safe failure spec §4.3
relies on, and S6 asserts it rather than assuming it.

*Corrected at the spike, 2026-09-09 (§314.3):* the spec's text compared
against `current_setting(…, true)::uuid` alone. A custom setting that has
ever been set on a backend reads back as **`''`, not NULL**, once its
transaction ends — so on a reused connection a query outside `withTenant`
errored `22P02` instead of reading an empty world (S6 found it; S3's first
pooler model, built on `RESET ALL`, had met the same `''`). Both fail closed,
but one is a blank page and the other a 500; `NULLIF(…, '')` makes unset and
`''` the same thing: nothing visible.

**The spec's count was 44; it is 42.** The 47 live tables less `credentials`,
`sessions` and `login_attempts` (the door, platform-side) is 44 only if
`push_keys` and `_sql_migrations` are counted as tenant data; neither is. The
spec is corrected in the same commit.

### The 33 graph tables — cleared and rewritten by a whole-graph save

The clear becomes `DELETE FROM <t> WHERE tenant_id = $1` on these and only
these, inside the save's transaction, ROW EXCLUSIVE (§288 kept by
construction).

| table | key today | key in the shared schema |
|---|---|---|
| `org`, `cycle`, `review`, `prior_cycle` | `id = 1` singleton | **`tenant_id`** alone — one row per tenant; the `CHECK (id = 1)` goes |
| `group_clauses`, `group_key_objectives`, `themes`, `bands`, `history` | `idx` | `(tenant_id, idx)` |
| `units`, `companies`, `functions`, `people`, `labels`, `weighting_factors` | `key` | `(tenant_id, key)` |
| `capabilities`, `projects`, `deliverables`, `outcomes`, `milestones`, `cap_key_objectives`, `unit_key_objectives`, `pillars`, `measures`, `tactics`, `plan_archives` | `id` | `(tenant_id, id)`; every FK (`cap_id`, `project_id`, `unit_key`, `pillar_id`) becomes `(tenant_id, …)` and keeps `ON DELETE CASCADE` |
| `unit_clauses` | `(unit_key, idx)` | `(tenant_id, unit_key, idx)` |
| `swot_items` | `(unit_key, cat, idx)` | `(tenant_id, unit_key, cat, idx)` |
| `unit_roles`, `weighting_rows`, `ko_weights` | `unit_key` | `(tenant_id, unit_key)` |
| `weighting_values` | `(unit_key, factor_key)` | `(tenant_id, unit_key, factor_key)` |
| `access_grants` | `(role_key, page_key)` | `(tenant_id, role_key, page_key)` |

Row ids stay what §191 made them (unique within a tenant); `people.key` stays
the minted short key. `smo` exists in every tenant and is unambiguous only
beside its `tenant_id` — §36.3's trap, paid (§314). The `extra jsonb` columns
are untouched; nothing inside them names a tenant.

### The 9 tables outside the clear — a record a save cannot erase (XI)

| table | key today | key in the shared schema |
|---|---|---|
| `bu_declarations` | `person_key` | `(tenant_id, person_key)` — **no FK to `people`**, deliberately (§56) |
| `change_log` | `id bigserial` | keeps `id`; gains `tenant_id`; index `(tenant_id, at)` — the §262 read and §258's peek stay one indexed query |
| `chat_threads` | `person_key` | `(tenant_id, person_key)` — one conversation per person per tenant (§97) |
| `chat_messages` | `id bigserial` | keeps `id`; FK `(tenant_id, person_key) → chat_threads` |
| `messages`, `message_drafts` | `id bigserial` | keep `id`; gain `tenant_id` |
| `message_recipients` | `(message_id, …)` | gains `tenant_id`; FK `(tenant_id, message_id) → messages` |
| `push_subscriptions` | endpoint | `(tenant_id, person_key, endpoint)` |
| `assistant_asks` | `id bigserial` | keeps `id`; gains `tenant_id`; the `ask_key` grouping (§299) is per tenant |

A `DELETE FROM tenants WHERE id = $1` reaches all 42 through the cascade;
S4 counts every table the catalogue says carries `tenant_id` and asserts zero.

## What is gone from the tenant side

`credentials` (§313.2 moved sign-in to the platform; the column is
`users.password_hash`), the per-tenant `sessions`, `login_attempts`,
`push_keys` (above), `feedback` and `feedback_replies` (dropped by migration
022 already), and `_sql_migrations`.

## Schema check (S5)

Read from the catalogue at every deploy and in the spike:

1. every table in `public` not on the platform list carries a `tenant_id uuid
   NOT NULL` column referencing `tenants` with `ON DELETE CASCADE`;
2. every such table has `relrowsecurity` **and** `relforcerowsecurity` set and
   exactly one policy named `tenant_rows` covering ALL commands;
3. `smp_app` owns no table and has `NOBYPASSRLS`;
4. every composite FK between tenant tables carries `tenant_id` on both sides.

A table added next month without any of the four is named by the check the
day it is added. Proved able to fail by adding one on purpose (contracts/spike.md, S5's break).

## Raya Trade's migration (§4.7, S8)

`scripts/migrate-raya.mjs` reads the `raya_trade` schema through the frozen
product's own `readState()` (so the JSON blobs and `extra` columns are
interpreted exactly once, by the reader that wrote them) and writes under
Raya's `tenant_id` through the new `writeState()`; the nine tables outside
the graph are copied row for row with `tenant_id` added. Accounts:
`platform.accounts` → `users` (hash and `must_change` verbatim),
`platform.account_clients` → `tenant_users`, `platform.sessions` **not**
copied (everyone signs in once, as §313 did). Row counts per table, one
unit's plan byte-identical through the new reader, a save round-tripping and
a migrated sign-in are what S8 asserts.
