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

---

# Phase 0 (plan stage) · The choices spec §6 left to the plan

Each is written as a decision with its reasoning and the road not taken, so
Islam can strike one in a sentence (constitution I). None touches a screen.

## P1 · The auth library — none; the platform's own door, ported

- **Decision:** no `next-auth` (the skeleton's v4 is the previous major line
  and leaves `package.json`). `lib/auth.js` is ported to `smp-app/lib/auth.ts`
  as it stands: scrypt with a per-password salt (§43), an httpOnly cookie, a
  30-day row in `sessions` keyed on `user_id`, `must_change` enforced before
  any tenant data is served (§43.2), the 8-per-key / 25-per-address rate limit
  checked **before** the password is verified (§43's timing-oracle rule), a
  password change ending every other session (§43.7).
- **Rationale:** every one of those rules is already decided and already in
  production; a library would re-decide them (its own session shape, its own
  cookie, its own throttling or none) and constitution VI says follow what the
  platform does. Email + password against our own table needs no OAuth, no
  providers and no adapter. §72 and §97.5's dependency rule: a package is
  taken when it does something we cannot test ourselves (push crypto), not to
  replace fifty lines whose behaviour is specified.
- **Alternatives considered:** Auth.js v5 (still beta across its own major
  line for two years; would carry the same rules on top of it anyway);
  `next-auth` v4 with a Credentials provider (a JWT session by default, which
  cannot be ended from the server — §43.7's guarantee lost).

## P2 · Prisma or `pg` for the tenant layer — Prisma with a wrapper, `pg` if S6 fails

- **Decision:** the platform tables (`tenants`, `users`, `tenant_users`,
  `sessions`, `login_attempts`, `platform_access`, `tenant_log`) are Prisma
  models. Tenant-owned rows are reached through **one** Prisma client whose
  extension runs every operation inside `withTenant()` (BEGIN · `SET LOCAL
  app.tenant_id` · op · COMMIT) on the **direct** pool as `smp_app`. The
  schema is written in SQL and applied by `db/apply.mjs`; Prisma
  **introspects** it (`prisma db pull`) and never migrates it.
- **Rationale:** RLS policies, `FORCE`, roles and grants are SQL whatever
  runs the queries, and Prisma's migrate cannot express them without raw
  blocks — so the SQL is the source and Prisma is the typed reader. D1 chose
  Prisma for the stack; §4.3 chose per-request `SET LOCAL`; the extension is
  the only place the two meet, and S6 is what proves it meets them for
  **every** operation. A query that escapes the extension runs with no
  setting and sees nothing, which is the safe failure — but "sees nothing" is
  a bug that renders as an empty page, so S6 asserts both sides.
- **If S6 cannot pass:** the tenant layer becomes a small `pg` module
  (`withTenant(id, client => …)` with hand-written queries — the shape
  `lib/state-io.js` already has), and Prisma keeps the platform tables only.
  Named here so it is a planned fallback and not a surprise.
- **Alternatives considered:** Prisma's `$extends` with a `WHERE tenant_id`
  injected into every query (an application filter — spec §4.3 forbids it
  being the guarantee); one Prisma client per tenant (a pool per tenant does
  not scale to a hundred and re-creates §36's per-schema cost).

## P3 · The shape of the save — the change list stays, and it writes only its rows

*Islam, 2026-09-09, asked in plain words whether "enhanced" saving meant each
box going on saving itself with the server writing only the rows those boxes
belong to, or a Save button per page: "yes that's what I mean by enhanced."
Recorded as §314.2. The first draft of this section kept today's wipe-and-
rewrite as the writer; that half is reversed here and the reversal is kept
(constitution II).*

- **Decision:** the wire contract is §210/§215's: every box saves on `change`
  (blur), and the client posts the list of changes it made. The server applies
  it onto the stored graph under the tenant's transaction and authorises the
  diff against the stored world (constitution X) exactly as today. **What
  changes is the writer**: the save writes **only the rows the change list
  names** — §241's incremental writer is the *only* writer, extended to every
  change shape the differ can produce, and the whole-tenant `DELETE …` then
  re-insert (`writeState`) is **not carried over** as a save path. A change
  shape the writer cannot address row by row is a 400 with the shape named,
  never a silent fallback to a full rewrite. §240's lock becomes **per
  tenant**: `pg_advisory_xact_lock(420043, hashtext($tenantId))` — today's
  single constant would serialise every client's saves behind each other —
  and it is kept because two saves naming the SAME row still read-modify-write
  the graph they are authorised against.
- **Rationale:** the delays and the "somebody else's save undid mine" faults
  (§240, §282, §288) all come from the writer, not the wire: a save of one
  target rewriting 33 tables is where a colleague's row in another table can
  be lost to a stale tab, and where the clear's lock reaches readers. Writing
  the named rows alone makes a one-box save touch one row, take milliseconds,
  and never collide with a colleague's box in another row; two people on the
  SAME box stay last-write-wins and §258's peek goes on warning about it.
  `lib/graph-diff.js` and `lib/authorize.js` carry over unchanged (spec §4.8);
  what is rewritten is `lib/state-io.js`'s write side, once, in the data
  layer — no screen is touched, which is what keeps D4's page-group cutover
  intact. §288's argument holds by construction: no statement in a save takes
  more than ROW EXCLUSIVE.
- **Cost, stated:** §241 today falls back to the full writer for settings, the
  register, reorders and add/remove; every one of those shapes now needs a
  row-addressed write before the first screen that makes it can save. That is
  the spike's S8 plus one proof (S9, contracts/spike.md): a change list naming
  one field is proved to leave every other row's `xmin` untouched.
- **Alternatives considered:** keep the full rewrite as the fallback (Islam's
  own reading of today's fault — rejected, because a fallback that rewrites
  everything is exactly the path that loses work under a stale tab, and it is
  the common path, not the rare one); per-row endpoints from day one (every
  ported screen would need its own before it could save anything; the change
  list lets a screen port with its save intact — recorded for later, when a
  screen is ported it may gain one); a Save button per page (offered to Islam
  as the alternative and not taken: a box that only saves on a press is typed
  work that can be lost, §219, §170).

## P4 · What the checks become — the same two kinds, pointed at Next

- **Decision:** server proofs stay Node scripts against a real Postgres
  (`smp-app/spike/*.mjs` now; `smp-app/tests/*.mjs` after), exactly
  `scripts/test-*.js`'s shape and exit discipline. Screen checks stay
  Playwright in Python (`checks/*.py`), pointed at `next start` on a throwaway
  database instead of at a file; each ported screen takes the frozen build's
  assertions for that screen as its acceptance list (spec §8). `qa.py` walks
  the new app when the first screen group exists.
- **Rationale:** constitution VI and XVI — the checks' *assertions* are the
  contract; changing the harness and the assertions at once is how a green
  run stops meaning anything.
- **Alternatives considered:** Vitest/Playwright-in-TS from scratch (loses
  every existing assertion and the wrappers that find Chromium here).

## P5 · Where S1 runs, and what if the key cannot make a role

- **Decision:** S1 runs twice — here on Postgres 16 (proves the SQL), and by
  **Islam from his own shell** with `DATABASE_URL_UNPOOLED` exported (proves
  the key). The script prints one line per property and never the URL. If
  Neon's key lacks `CREATEROLE`, the plan **stops for a decision**: the two
  candidates are Neon's console (a role made once by hand, recorded in §314.2)
  or a Neon plan that grants it; §313.35's silent degrade to owner rights is
  **not** carried over, because under a shared schema "owner rights" means
  every tenant.
- **Rationale:** §313.35 proved role creation on three shapes of key including
  one like Neon's, so the expected answer is yes; the spec makes it the one
  proof that must be real before anything relies on it.

## P6 · The migration set runs at deploy, never per request

- **Decision:** `db/apply.mjs` is run once per deploy as the owner (a build
  step or a one-off command), under `pg_advisory_xact_lock` in one transaction
  (§289's shape). `smp_app` cannot run it — it owns nothing. There is no
  `ensureReady()` on the request path.
- **Rationale:** §98 measured what per-request bootstrap costs; §289 measured
  what a per-request bootstrap does under a burst; a shared schema is
  migrated once, which is half of why §314 chose it.

## P7 · The local database for the spike

- **Decision:** the sandbox's Postgres 16 cluster (`/usr/lib/postgresql/16`,
  present and down) is started for the spike; `_harness.mjs` creates a fresh
  database per run and drops it after. Two tenants are seeded (A and B) with
  every tenant table holding at least one row of each — S2 and S4 are vacuous
  otherwise (§113.8).
- **Rationale:** every server proof in the product's history ran this way;
  a proof against an empty table passes on a build that lost the feature.
