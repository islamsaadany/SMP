# Phase 1 · Data model

Two worlds. **`platform`** is new and holds everything about clients, the office
and the door. **Each client's schema** is today's thirty-odd tables, unchanged —
`db/schema.sql` and `db/migrations/*` are applied to it verbatim.

## The platform schema

### `clients` — the registry, and the only place a schema name is decided

| column | type | notes |
|---|---|---|
| `key` | text PK | the slug in the address: `raya-trade`, `rhi`, `el-abd`, `demo` |
| `name` | text NOT NULL | what the cards and the client's chrome say |
| `schema_name` | text NOT NULL UNIQUE | `raya_trade`, `rhi`, `el_abd`, `demo` — **read from here, never built from a request** |
| `industry` | text | Distribution & retail · Industrial · Food & beverage |
| `notes` | text | |
| `mark` | text | data URI, PNG only (§52's security decision: an SVG is executable content) |
| `colors` | jsonb | the client's palette; absent means the product's own |
| `kind` | text | `client` or `demo` — one column holding the word, never a boolean beside it (§104.7) |
| `status` | text | `active` / `retired`; retiring is not in v1 |
| `created_at` | timestamptz | |

**Invariant:** `key` is minted from the name once and then editable only
deliberately — a link that has been sent must keep working. `schema_name` is
derived from `key` at creation and **never** afterwards.

### `accounts` — one row per Forefront person, keyed by email

| column | type | notes |
|---|---|---|
| `email` | text PK | lower-cased; the only identifier the door accepts |
| `name` | text NOT NULL | |
| `role` | text NOT NULL | `admin` · `lead` · `consultant` · `observer`; **absent role is not a row** — nothing until granted |
| `password_hash` | text NOT NULL | scrypt, exactly as `credentials` today |
| `must_change` | boolean NOT NULL DEFAULT true | |
| `status` | text NOT NULL | `active` / `retired` — retire, never delete (§35) |
| `updated_at` | timestamptz | |

### `account_clients` — the team, and what "my clients" means

| column | type | notes |
|---|---|---|
| `email` | text | → `accounts` |
| `client_key` | text | → `clients` |
| `person_key` | text | the row this account **is** inside that client's register |
| `is_super` | boolean NOT NULL DEFAULT false | that client's Super user |
| PK | (`email`,`client_key`) | |

**Derived, never stored:** *my clients* is this table read for the signed-in
account. There is no second list, and the cards, the matrix and the register row
all answer from it.

**One super user per client:** a partial unique index on
(`client_key`) WHERE `is_super` — a client with two people holding the access
matrix is a client where nobody can say who does.

### `platform_access` — §37's matrix, one level up

| column | type | notes |
|---|---|---|
| `role_key` | text | `admin` · `lead` · `consultant` · `observer` |
| `area_key` | text | `my_clients` · `other_clients` · `client_config` · `consultants` · `create_client` · `demo` |
| `grant_` | text | `none` · `view` · `edit` (`create_client` uses `none` / `edit`) |
| PK | (`role_key`,`area_key`) | |

**A stored map is merged with the defaults, never substituted** (§30.2): an area
added later is absent from a map written before it existed, and reading absent as
`none` would hide every new thing from everyone who ever touched the table. The
**admin row is not writable** — editing the matrix is editing who may edit it.

### `sessions` and `login_attempts`

Exactly today's shapes (`token_hash` PK, `expires_at`; `key_tried`, `ip`, `at`),
moved to `platform` and keyed on **email** instead of `person_key`. The
limiter's thresholds, its check-before-verify order and its pruning are unchanged.

### `client_log`

Who opened which client, and when — `email`, `client_key`, `at`. The change log
inside a client already records what was *done*; this records that an office
account was *there*, which no client's log can (its own `TRUNCATE` cannot reach
this table, Principle XI).

## What does not change, and is the point

Every client schema is `db/schema.sql` plus `db/migrations/*` as they stand.
`people`, `unit_roles`, `access_grants`, the plan tables, `change_log`,
`chat_threads`, `messages`, `credentials` — all per client, all untouched.

Two rows are **written** into a client's `people` by the outer platform: an
office account on that client's team, marked as Forefront, holding `smoteam`
(or `super` for the client's Super user). Marked in `people.extra`
(`{forefront:true}`) so no column is added and no migration is needed — the
shape §52 and §44 already rely on.

## Relationships

```text
accounts ──< account_clients >── clients ──1:1── a Postgres schema
   │                                   │
   │ role                              └── people row (marked forefront) inside that schema
   ▼
platform_access (role × area → none/view/edit)
```
