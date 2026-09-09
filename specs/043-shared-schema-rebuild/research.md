# Phase 0 · What the codebase says — the four questions

Islam's decision record asked four questions to be answered against the code
before anything is written. Answered 2026-09-09 on the branch carrying §313
(the multi-client split, merged to `main` 2026-09-08). Every claim below names
its file and line so it can be re-checked rather than believed.

## 1 · How is a tenant identified today?

A **registry row**, and nothing inside the tenant.

- `db/platform-schema.sql:31` — `platform.clients (key text PK, name,
  schema_name text UNIQUE, industry, notes, mark, colors, kind, made_here,
  status, created_at)`. The slug is the key; the schema name is derived from it
  once (`lib/platform-io.js:50`) and read from the row ever after.
- **Zero tenant columns** in `db/schema.sql` (35 tables) and `db/migrations/*`
  (14 more, of which migration 022 drops two: 47 live). A grep for `client_key | client_id | tenant` matches prose
  comments only; the only `client_key` in the product is on the platform side
  (`account_clients`, `client_log`).
- Every tenant table is keyed by a bare global text key: `units.key`,
  `people.key`, `functions.key`, `companies.key`, `capabilities.id`, every
  plan row's id (§191 makes them unique **within one client**). `org` is a
  singleton, `id int PRIMARY KEY DEFAULT 1 CHECK (id = 1)` (`db/schema.sql:14`);
  so are `cycle`, `review` and `prior_cycle`.
- `db/platform-schema.sql:14` states the design in its own words: *"a tenant
  COLUMN would touch every query, insert, migration and uniqueness
  constraint."* That is the sentence spec 043 reverses.

## 2 · Can tenant assignment move off the URL?

**Half of it already has; the other half cannot come from the user record.**

Already off the URL — a client user:

- `platform.accounts.kind = 'client'` and one `account_clients` row
  (`db/platform-schema.sql:67, :100`).
- `api/auth.js:74-125` `landingFor()`: a client-kind account lands in
  `mine[0].client_key` whatever door they came through; the door slug wins
  only if `mayOpenClient()` says so.

Not off the URL — a consultant, and the plumbing:

| where | what depends on the slug |
|---|---|
| `SMP-Project-Folder/src/sync.js:864-896` | `clientSlug()` reads `location.pathname`; `withClient()` appends `?client=`; `withClientBody()` sets `body.client`; **`doorUrl()`** builds `/<slug>/sign-in` (used at `:638, :643, :847, :1059, :1353, :1396`) |
| `sync.js:290, :624, :1023` | the slug is spliced into the raw JSON of every `/api/state` POST, including the keepalive flush |
| `sync.js:922, :948, :959, :1057, :1198, :1348` | `/api/auth`, `/api/blob`, `/api/mail`, `/api/state` GET |
| `src/chat.js:172-178` | the one chokepoint for every `/api/chat` request |
| `src/slides.js:398` | the blob/media URL |
| `src/history.js:212` | builds `/api/state?…` **without** the slug and lands on the default |
| `index.html:974, :1002-1004, :1087, :1210` | the door's regex, `?door=`, and the redirect to `/<clientKey>` |
| `lib/platform-io.js:250-260` | `clientSlugFrom()`: body first, then `?client=`, then **`SMP_DEFAULT_CLIENT || "raya-trade"`** — a request naming no client is served the live tenant |
| `api/state.js:154`, `api/auth.js:175`, `api/chat.js:725`, `api/mail.js:121`, `api/blob.js:153` | the five call sites |
| `vercel.json` rewrites; `scripts/dev-server.js:56-102` | `/:client/sign-in → index.html`, `/:client → the built file` |
| `sw.js:400-421, :508-511` | the cache list hardcodes `/raya-trade`; the push payload's `open` is set server-side at `api/chat.js:1012, :1220, :1797` as `"/" + client._smpClient.key` |

A consultant is on several clients (`account_clients` is many-to-many), so
"their tenant" is which one they opened. The spec keeps the slug as the
**address** and makes the server check it against the session's memberships
(§4.4), which is the check `landingFor()` and `mayOpenClient()` already make.

## 3 · Two user models or one?

**Two, and a half.**

- **Logins**: `platform.accounts` (`email` PK, `name`, `kind` office/client,
  `is_admin`, `password_hash`, `must_change`, `status`) — one door for
  consultants and client users alike since §313.2. **Membership and seat**:
  `platform.account_clients (email, client_key, person_key, seat)`.
- **The register**: every client schema's `people` (`key` PK, 33 rows in the
  worked example; most never sign in). The rules read roles off it
  (`personRoles()`, `namedOn()`, `boundedReach()` in `lib/rules.js`).
- **The half**: every client schema also creates `credentials (person_key PK)`
  and `sessions (token_hash PK)` through `db/migrations/002-identity.sql:10,
  :17`, which the door no longer signs in through (`lib/auth.js:43-57` names
  `platform.sessions` explicitly for that reason).

The link is `account_clients.person_key` → `people.key`. The spec keeps two
tables, `users` and `people`, linked by tenant and person (spec §4.1).

## 4 · What assumes per-schema isolation?

**All of it lives in `lib/platform-io.js`; everything else consumes it.**

Session state and roles, per connection:

- `lib/platform-io.js:64-73` `pointAt()` — `"SET search_path TO " + ident(schema)`.
- `:106` `badgeRoleFor()` → `smp_<schema>`; `:130-184` `ensureBadge()` —
  `CREATE ROLE … NOLOGIN NOINHERIT`, `GRANT … ON SCHEMA <schema>`,
  `ALTER DEFAULT PRIVILEGES IN SCHEMA <schema>`, all string-built through
  `ident()` (`:37-45`, the only validator); `:149-159` **degrades silently to
  owner rights** when the key lacks `CREATEROLE`, warning once.
- `:188-206` `wearBadge()` `SET ROLE`, `takeBadgeOff()` `RESET ROLE; RESET search_path`.
- `:213-239` `withSchema()`, `withOwner()`, `withPlatform()`; `:273-331`
  `connectFor()`, `connectPlatform()`, `releaseClient()`.
- `lib/state-io.js:1440-1504` prefers the direct URL **because** `SET
  search_path` does not survive a transaction pooler, and only warns without
  one.

Schema names written into SQL:

- `platform.*` in `lib/auth.js:43-57` (four constants used at thirteen
  sites) and inline in `api/auth.js:77, :80, :84, :140, :227, :275, :338,
  :346, :617-618, :690-691, :700, :705`.
- `api/platform.js` runs inside `withPlatform()` and its queries are
  unqualified — they rely on `search_path = platform`.
- `lib/platform-io.js:350, :370, :505, :508, :595`; `scripts/migrate-to-multi-client.js:95, :102, :272`.

The state graph's clear:

- `lib/state-io.js:120-129` `ALL_TABLES` — 33 unqualified names;
  `:296` `DELETE FROM <t>` for each. **A wrong `search_path` here wipes
  another tenant**; the search path and the badge are the only guard.
- `:531-551` the credentials/sessions/declarations purge asks `to_regclass`
  with a **bare** name on purpose (the comment at `:541-546` records that
  qualifying it with `public.` was the bug).

Bootstrap, per schema:

- `lib/state-io.js:1084-1166` `ensureReady()` / `ensureReadyOnce()` — `READY`
  keyed by schema, `pg_advisory_xact_lock(420042, hashtext(schema))`, then
  `schema.sql` and all 44 migrations, per schema; baselining was rejected
  (`:1153-1166`).
- `lib/platform-io.js:340-388, :570-605` — the platform's own bootstrap,
  migrations and `createClientSchema()`.
- `scripts/migrate-to-multi-client.js` — `ALTER TABLE public.<t> SET SCHEMA
  raya_trade` for every table, then the registry, accounts and three empty
  schemas. `scripts/seed-demo-client.js` — the worked example renamed and
  written through `withOwner()` into the demo schema, refusing if any real
  name survives (`:300-315`).

## What this means for the spec

- The four risks the inventory names — the unqualified `DELETE` list, the
  `raya-trade` fallback, the silent owner-rights degrade, and session state on
  a pooled connection — are each answered by one line of spec §4.3 or §4.4,
  and each has a proof in §5.
- Nothing found contradicts the decision. Two sentences of Islam's plan are
  corrected by it: *per connection* becomes *per request*, and *from their user
  record* is true of a client user and becomes *checked against their
  memberships* for a consultant.
