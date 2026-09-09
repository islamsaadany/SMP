# Spec 043 — One schema, every client: the rebuild's data layer

**Status:** decisions agreed 2026-09-09 (Islam, in session, question by
question, on his own written decision record); **signed off the same day**
(§314.1); `plan.md` written 2026-09-09; its four plan-stage choices (`research.md`
§P1–P7) **answered by Islam the same day** — three as written, and the save
enhanced: every box still saves itself, and the server writes only the rows
the change list names (§314.2, research §P3, spike S9). `tasks.md` written the same
day (72 tasks, nine proofs). Next: the spike, red first. **Nothing built**, and no source is touched before then
(constitution I).

**Reverses:** §36 (schema per tenant, recommended 2026-08-20) and §313 / spec
042 (schema per tenant, built and merged 2026-09-08). Recorded as a reversal in
§314 of the decisions document, never overwritten (constitution II).

**Depends on:** §20 (the move to the HR_ERP stack, decided 2026-08-20) and D4
(CSS carried verbatim; cutover early, page group by page group).

## 1 · What this is

SMP moves from a single-file HTML build with one Postgres schema per client to
**Next.js with one shared schema and Postgres row-level security (RLS)**. Both
changes happen together, in one rebuild, on this branch.

Islam's decision record, verbatim where it decides something:

> Tenants in 3 years: tens, approaching 100 · Custom fields per client: none;
> the platform is dynamic and new options ship to all clients as
> configuration · Cross-client reporting: wanted (benchmarking, aggregate
> analytics) · Data residency: possible KSA requirement later; regional
> deployments, not a different tenancy model · Schema change frequency: high;
> pre-launch, structure moving weekly · Full client delete/export: a client
> may request deletion; a cascading delete, not a blocker.

And in session, on the reversal: *"This choice was changed upon a discussion
with Claude saying that a shared database will be better ... with nothing to
lose from the security of the different schemas, given that having the users
in check all the time so there is no one called `smo` — always people access
through emails and passwords."*

Why not database-per-tenant: ruled out by Islam; operational cost with no
compliance driver that requires it.

## 2 · The decisions, and why

Every one was put to Islam on 2026-09-09 and answered. The number is the
question as it was asked. **Signed off the same day, with one change**: asked
four closing questions — the live data, the isolation shape (§4.3), the first
slice, and the two deferred items (the benchmarking role, the region names) —
he approved the isolation as written, chose the spike first, deferred both,
and **reversed the plan's "existing data is throwaway" for Raya Trade** (§4.7,
row 1, S8). Recorded as §314.1.

| # | Decision | Islam's answer, and what it settles |
|---|---|---|
| 1 | The tenancy model | **One shared schema, a `tenant_id` on every tenant-owned row, RLS as the guarantee.** A reversal of §36 and §313, recorded as one. The cost he accepted: inside a client the keys are short and global (`smo`, `mobile`, a capability's id, the single `org` row), so every one carries the tenant as well, and the rules and save code that find rows by those keys are **rewritten, not copied**. Raya Trade's data is **carried across** by a one-off migration (§4.7, his answer at sign-off); RHI, El Abd and the demo are built clean. |
| 2 | Where a consultant's tenant comes from | **Agreed:** a client user's tenant is on their user record; a consultant's is the client they opened, and the address names it. The URL is an **address the server checks**, never the authority (§4.4). |
| 3 | One user table or two | **Two.** *"These are normally two different tables, one for the overall platform and the other is client based."* `users` is logins, platform-wide; `people` is a client's register, tenant-scoped; linked by tenant and person. |
| 4 | How the database learns the tenant | *"We will work with postgres right?"* — yes, Postgres on Neon, unchanged. The three points under it are how the app talks to Postgres and are written here as the design: **per request** inside a transaction, never per connection; the app connects as a **non-owner** role; **Prisma with a wrapper** on the direct connection. Any of the three can be struck at sign-off. |
| 5 | The live product during the rebuild | **Rebuild only.** *"I will pause the new features until we make the shift."* The single file takes no new features from 2026-09-09. A client-blocking defect is a correction and is asked about first. |
| 6 | ClientPlus and the Strategy Management System | **Later.** *"For now we need to alter the SMP then we can talk about the consolidation later."* The `users` table is designed for SMP alone and must not preclude the consolidation (§4.1). The two repositories exist under another owner and are not read for this spec. |
| 7 | Where the new app lives | **Replace `smp-app/`**, on this branch. `main` is untouched until Islam says merge, on that merge. Where the app is served from is a cutover decision (D4), not this spec's. |
| 8 | The working rules | **Unchanged.** Mockup sign-off before each screen is built; the existing CSS carried verbatim (D4, §20) so the look does not drift. |

## 3 · What the code says today

Islam's record asked four questions to be answered against the codebase
before anything is written. The full inventory with file and line is in
[research.md](./research.md). The answers:

1. **A tenant is a registry row** in `platform.clients` (slug, name,
   `schema_name`, kind, status, mark, colours). Inside a tenant there is **no
   identifier at all**: zero tenant columns across the 35 tables in
   `db/schema.sql` and the 14 more the migrations add (two since dropped); every table is keyed by
   a bare global text key, and `org` is a singleton with `CHECK (id = 1)`.
2. **Tenant assignment is half off the URL already.** A client user's tenant
   comes from `platform.account_clients` and `landingFor()` sends them there
   whatever door they used. A consultant's does not and cannot come from their
   record alone, because a consultant is on several clients. The URL slug is
   load-bearing in five browser call sites, `doorUrl()`, all five endpoints
   through `clientSlugFrom()` (which **falls back to `raya-trade`** when nothing
   names a client), the Vercel rewrites, the door's regex in `index.html`, the
   service worker's cache list and the push payload's `open` address.
3. **Two user models, and a half.** Sign-in is unified on
   `platform.accounts` (email, scrypt hash, `must_change`, `is_admin`, `kind`
   office or client) with `account_clients` giving the seat and the
   `person_key` inside each client. Every client schema also carries a `people`
   register (33 rows in the worked example, most never signing in) and, from
   migration 002, its own `credentials` and `sessions` that the door no longer
   uses.
4. **Everything that assumes a schema per client lives in
   `lib/platform-io.js`** and its consumers: `SET search_path` and `SET ROLE`
   per connection, a per-schema Postgres role created with schema-level
   grants, `platform.*` named explicitly in `lib/auth.js` and `api/auth.js`,
   `state-io.js` clearing the graph with `DELETE FROM` on 33 unqualified table
   names, `ensureReady()` running the whole migration set per schema, and the
   two scripts that move and seed whole schemas.

Nothing found contradicts the decision. Two things in the code **argue with
the plan as written**, and the plan is corrected here rather than worked
around: "set the tenant once per connection" (§4.3 says per request, and why),
and "a user's tenant comes from their user record" (true for a client user,
not for a consultant — §4.4).

## 4 · The shape

### 4.1 The platform's own tables — no tenant policy, read before a tenant is known

| table | what it is | notes |
|---|---|---|
| `tenants` | the registry | `id` uuid PK · `key` text UNIQUE (the slug in the address) · `name` · `region` (§4.5) · `kind` client / demo · `status` active / retired · `mark` (PNG data URI, §52) · `colors` jsonb · `made_here` (§313.31) · `created_at`. **`schema_name` is gone**: there is nothing for it to name. |
| `users` | logins, platform-wide | `id` uuid PK · `email` UNIQUE, lower-cased, the only identifier the door accepts (§313.2) · `name` · `password_hash` (scrypt, §43) · `must_change` · `is_admin` · `kind` office / client · `status` active / retired · timestamps. **What it does not carry:** a tenant. Membership is the table below, so a consultant on three clients and a client user on one are the same shape. This is what keeps the consolidation with ClientPlus open: identity is an email, membership is a row, and another product joining later adds memberships, not columns. |
| `tenant_users` | who is on which client, and who they are inside it | `tenant_id` → tenants · `user_id` → users · `person_key` (the `people` row this login **is** inside that tenant) · `seat` super / smoteam / none (§313.4, §89) · PK (`tenant_id`, `user_id`). **Rule, enforced on the server:** a `client`-kind user holds exactly one row. |
| `sessions`, `login_attempts` | the door | today's shapes (§43), keyed on `user_id`. The per-client `credentials` and `sessions` tables **go**; there is one door. |
| `platform_access` | §37's matrix one level up | unchanged from §313. |
| `tenant_log` | who opened which tenant, when | `client_log` renamed with the vocabulary. |

### 4.2 Tenant-owned tables — every one carries `tenant_id`

Every table a client owns today — the 33 the save clears plus `change_log`,
`bu_declarations`, the chat, messages, drafts, push and assistant tables: 47
live tables across `schema.sql` and the migrations, less `credentials`,
`sessions` and `login_attempts`, which move to the platform side — and
`push_keys`, one VAPID pair per deployment (§231), which moves there too — so
**42** (the spec first said 44 by counting `push_keys` and `_sql_migrations`;
corrected at plan stage, `data-model.md`) —
gains
`tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE`.

What happens to the keys, by kind:

- **Client-local text keys** (`units.key`, `people.key`, `functions.key`,
  `companies.key`, `capabilities.id`, every plan row id) become composite
  primary keys `(tenant_id, key)`, and every foreign key that pointed at them
  carries the tenant too. This is §36.3's trap paid deliberately: `smo` exists
  in every tenant and is unambiguous only with the tenant beside it.
- **Singletons** (`org`, `cycle`, `review`, `prior_cycle`) become one row per
  tenant, primary key `tenant_id`.
- **Serial ids** (`change_log`, `messages`, `history`, `login_attempts`'
  tenant cousins) keep their bigserial and gain the column.
- **The stored graph's `extra` JSONB columns** are untouched; nothing inside
  them names a tenant.

A table that holds tenant data and lacks `tenant_id`, or has it and lacks the
policy in §4.3, **fails a schema check** (§5, S5). The check reads the
catalogue, so a table added next month is covered the day it is added.

### 4.3 Isolation — the database refuses, the app only asks

- Every tenant-owned table: `ENABLE ROW LEVEL SECURITY` and **`FORCE ROW
  LEVEL SECURITY`**, one policy for all four verbs:
  `tenant_id = current_setting('app.tenant_id', true)::uuid`. With no setting
  the comparison is null and **nothing is visible** — a request that forgot
  to name its tenant reads an empty world rather than everybody's.
- **Two database roles.** The owner (Neon's `neondb_owner` or whatever the
  key is) runs migrations and nothing else. The app connects at runtime as
  **`smp_app`**: `LOGIN`, `NOBYPASSRLS`, not the owner of any table, granted
  the table privileges and no more. Without `FORCE` and a non-owner role,
  Postgres bypasses every policy for the owner and the shared schema is
  **weaker** than the schemas it replaces. This is the one thing in the spec
  that must be proved on the real Neon database before anything relies on it
  (§5, S1) — §313.35 already found that creating roles depends on what the key
  allows.
- **Per request, never per connection.** Production talks to Neon through a
  transaction pooler, and §289 and §313.34 recorded what that costs: a `SET`
  made outside a transaction lands on one backend and the next statement may
  run on another. So every request that touches tenant data runs
  `BEGIN; SET LOCAL app.tenant_id = $1; … ; COMMIT`, on the **direct**
  connection string (`DATABASE_URL_UNPOOLED`, the preference §313.34 already
  wrote into `getPool`). The setting dies with the transaction.
- **Prisma, with a wrapper.** Prisma has no per-request `SET LOCAL` of its
  own; a client extension wraps every operation in an interactive transaction
  that sets the tenant first. A query that escapes the wrapper runs with no
  setting and sees nothing (the first bullet), which is the safe failure. If
  the spike (§5, S6) shows the extension cannot guarantee that, the tenant
  layer drops to `pg` directly and Prisma keeps the platform tables — a
  plan-stage choice, named here so it is not a surprise.
- **No query may rely on an application filter for isolation.** A
  `WHERE tenant_id = …` in app code is allowed as a convenience and is never
  the guarantee. The isolation test (§5, S2) queries **without** one.
- **Cross-tenant reporting is a second policy, not a bypass.** The
  benchmarking Islam wants runs as a separate reporting role whose policy
  admits the tenants a consultant may open. Named here; not built in this
  spec, so nobody builds it as a hole in the first one.

### 4.4 How a request learns which tenant it is for

1. The address names the tenant: `/<slug>/…` as today (`/raya-trade`,
   `/rhi`, `/demo`, `/platform` for Forefront's own pages).
2. The server resolves the slug to a `tenants` row and asks, of the signed-in
   user, **may they open it**: a `client`-kind user only their one row; an
   office user through `tenant_users` and `platform_access`, exactly
   `mayOpenClient()`'s question today (§313.36). Refused and non-existent are
   told apart by nobody (§313's one refusal).
3. Only then is `app.tenant_id` set, from the row's id, for this request's
   transaction. **The slug text never reaches SQL.**

What this changes from today: `clientSlugFrom()`'s fallback to `raya-trade`
**goes** — a request that names no tenant is refused, never served the
default. The browser stops splicing a slug into every body; the route carries
it. The service worker and the push payload stop hardcoding one client. A
client user who lands at the wrong slug is sent to their own, as
`landingFor()` does now.

### 4.5 Region — a column now, a deployment later

`tenants.region` is a text column whose values are Islam's to name; until he
does it holds one value for every tenant and nothing reads it. A KSA
deployment is **the same application against a second database in that
region** — configuration, not surgery. Nothing routes by region in this spec,
and the column exists only so that day needs no schema change.

### 4.6 Deletion — one statement, then proof

`DELETE FROM tenants WHERE id = $1` cascades through every tenant-owned
table, because every one references `tenants` with `ON DELETE CASCADE`. The
routine is: **export** (the per-subject workbooks and archive the platform
already builds, §304, run for every subject), **delete**, then **count** — a
query over the catalogue for every table carrying `tenant_id` asserting zero
rows for that tenant. Built and tested now (§5, S4), with the office-only,
asked-twice confirmation §146 gives the Super user's destructive acts.

### 4.7 The data — Raya Trade carried across, the rest built clean

The plan as written said *"existing data is throwaway; write no migration
scripts"*, and the spec's first draft said the same. **At sign-off Islam
reversed it for one tenant** — *"No, carry Raya's data across"* — and it is
recorded as his reversal of his own plan. What that settles:

- **Raya Trade's tenant is migrated, once**, by a script that reads the
  `raya_trade` schema on the day of the cutover and writes every row into the
  shared schema under Raya's `tenant_id`: the register, the plans, the
  figures, the closed cycles and their snapshots, the archives, the messages
  and the questions, the settings — every one of the 42 tenant-owned tables
  (§4.2). Nothing is re-entered and nothing is re-keyed by hand: the table
  gains the tenant and keeps its own keys, which is exactly what the
  composite key in §4.2 exists for.
- **Nobody gets a new password.** Sign-in already lives on the platform side
  (`platform.accounts.password_hash`, scrypt, §313.2), and `users` carries
  the same column; the accounts are copied as they are, `must_change`
  included. The one thing a person notices on cutover day is a new address.
- **RHI and El Abd are created empty**, as today; the **demo tenant** is
  seeded from the worked example under `scripts/seed-demo-client.js`'s
  invented names, its refuse-if-any-real-name-survives scan carried over.
- **The cost, stated before it is paid:** the migration is one more thing
  that has to be right on cutover day, and it is proved the only way a
  migration can be — by running it (S8, §5): every Raya table's row count
  equal on both sides, a spot read of a unit's plan byte-identical through
  the new app's reader, and a save on the migrated tenant round-tripping.
  It runs against a copy first, then against the live schema with the
  frozen build still serving, so a failed run costs a re-run and nothing
  else. It is written for Raya's schema shape as it stands on that day
  (the 44 migrations already applied) and for no other, and is deleted
  from the tree once the cutover is done — a one-off that stays in the
  repository is a second reader of the old schema somebody will trust.

### 4.8 What carries over, and what is thrown away

**Carries over**

- `lib/rules.js` — the executable half of the rebuild contract: roles, areas,
  defaults, every pure *may this person…* question, the scoring, the gap
  rules. Ported to TypeScript as **one module run on both sides**
  (constitution IX), with row addressing gaining the tenant.
- `lib/authorize.js` and `lib/graph-diff.js` **semantics** — classify the
  difference, refuse what the roles disallow, judge against the stored world
  (constitution X). Their code addresses rows by bare id and is rewritten.
- Every stylesheet, verbatim, through the `sync-css.mjs` the skeleton already
  carries (§20, D4).
- The decisions document, every section of it; the checks' **assertions** as
  the acceptance list for each ported screen.

**Thrown away**

- `api/*.js`, `lib/platform-io.js`, `lib/state-io.js`'s whole-graph writer,
  `src/sync.js`, the badge roles, `search_path`, the per-client `credentials`
  and `sessions`, the Vercel rewrites, the `sw.js` cache list, the built
  single file as the live product.
- `smp-app/` as it stands: its Prisma schema is a pull of today's tables and
  is regenerated; its auth library is the previous major line and is chosen
  again at plan stage.

## 5 · What must be proved before a screen is built

The first slice of the rebuild is a **spike**, not a page. Each item is a
test on a real Postgres (throwaway locally, then the real Neon key), and each
is proved able to fail by breaking what it guards (constitution XVI).

| # | Proof | Fails when |
|---|---|---|
| S1 | The real Neon key can create `smp_app` (`LOGIN`, `NOBYPASSRLS`), and `FORCE ROW LEVEL SECURITY` holds against it | the key lacks `CREATEROLE`, or the role turns out to own the tables |
| S2 | As `smp_app` with tenant A set: a `SELECT` **with no WHERE** on every tenant table returns only A's rows; an `INSERT` carrying B's `tenant_id` is refused; a `DELETE` with no WHERE removes only A's rows | any table returns or loses a B row |
| S3 | A bare `SET` on the pooled URL leaks between statements (modelled as `test-cold-starts.js` models the pooler); `SET LOCAL` inside the transaction on the direct URL does not | the two behave the same |
| S4 | The deletion routine leaves zero rows for the tenant in every table the catalogue says carries `tenant_id`, and every other tenant's counts are unchanged | a row survives, or a neighbour loses one |
| S5 | A schema check: every table with `tenant_id` has the policy and `FORCE`; a table with tenant data and no `tenant_id` is named | a table is added without either |
| S6 | Every Prisma operation runs inside the per-request transaction — asserted by reading `current_setting('app.tenant_id')` from inside a query the extension wrapped, and from one that escaped it (which must see nothing) | an operation reaches the database outside the wrapper and sees rows |
| S7 | The door: a client user at another client's slug lands on their own; a consultant not on a tenant is refused identically to a slug that does not exist | the two refusals differ, or the landing follows the slug |
| S8 | The Raya migration (§4.7), run against a copy of the `raya_trade` schema: every tenant-owned table's row count equal on both sides under Raya's `tenant_id`, one unit's plan byte-identical through the new reader, a save on the migrated tenant round-tripping, and every migrated password still signing in | a table is short, a row lands under another tenant, a plan reads differently, or a sign-in that worked stops |

## 6 · Deliberately not decided here

These belong to `plan.md`, after this spec is signed off:

- The order of screens and the cutover. D4 says early, page group by page
  group, the new app becoming the live site while un-ported screens link to
  the frozen build; the groups and their order are the plan's.
- The auth library (the skeleton's `next-auth` v4 is the previous major line).
- Prisma or `pg` for the tenant layer, pending S6.
- The shape of the save: whether the client keeps posting a change list the
  server applies onto the stored graph (§210, §215), or the API becomes
  per-row. §240's lock and §288's non-blocking clear are the properties to
  keep, whichever shape.
- What the checks become on the new stack (Playwright against Next rather
  than against a file).

## 7 · Files this spec touches

Documents only: this folder, §314 in the decisions document,
`IMPLEMENTATION_PROGRESS.md`, and a direction note in `CLAUDE.md`. No source,
no schema, no `smp-app/` file.

## 8 · How it is proved

The spike in §5, each test red first. Then, per screen: the mockup signed
off, the screen built against the frozen build's checks as its acceptance
list, contrast measured in both themes (constitution XIII), and the full
walk (constitution IV).
