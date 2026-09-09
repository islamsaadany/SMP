# Contract · How a request learns its tenant, the door, and the save

Written for the route handlers the spike's libraries will serve. Nothing here
is a screen.

## 1 · Resolving the tenant (`lib/door.ts`)

Input: the request's cookie and the `<slug>` segment of its path.

1. `auth.session(req)` → the `users` row, or **401**. `must_change` set →
   **403 `MUST_CHANGE`** for every route but the password change (§43.2).
2. `tenants WHERE key = $slug AND status = 'active'` → the row, or refused.
3. May this user open it?
   - `kind = 'client'`: exactly their one `tenant_users` row. A different
     slug → **302 to their own** (`landingFor()`'s rule, §313.36).
   - `kind = 'office'`: a `tenant_users` row for this tenant, or `is_admin`,
     or `platform_access` says so — `mayOpenClient()`'s question, ported.
4. Refused and non-existent answer **identically** — one status, one
   sentence (§313's one refusal). S7 asserts they cannot be told apart.
5. Only then: `withTenant(tenant.id, fn)` — `BEGIN; SET LOCAL app.tenant_id =
   $1; … COMMIT` on the direct pool as `smp_app`. **The slug text never
   reaches SQL.** A request that names no tenant is refused; there is no
   default (§4.4 — `clientSlugFrom()`'s `raya-trade` fallback is gone).

`withTenant` is the **only** way tenant data is reached; `lib/prisma.ts`'s
extension calls it for every operation (S6). A handler that calls Prisma
outside it gets an empty world, and S6 makes that a red test rather than an
empty page.

## 2 · The door (`lib/auth.ts`) — `lib/auth.js` ported, rule for rule

| route | body | answers |
|---|---|---|
| `POST /api/auth/sign-in` | `{ email, password }` | sets the httpOnly cookie; `{ mustChange, landing }` where `landing` is the client user's slug or `/platform` for the office. Rate-limited **before** verification: 8 per email, 25 per address, 15 minutes; failures only; never says which threshold or whether the email exists (§43). |
| `POST /api/auth/password` | `{ current, next }` | clears `must_change`; ends every **other** session of this user (§43.7). |
| `POST /api/auth/sign-out` | — | deletes the session row. |
| `GET /api/auth/me` | — | `{ email, name, kind, isAdmin, mustChange, tenants: [{key, name, seat}] }`. |
| `GET /api/auth/where` | — | the door's own question (§56, §57, §93.13): `{ units, functions, near, mainbu, mine, settled }` under the client user's one tenant — `settled` when the register has already placed them, so the card asks nothing; an office login answers `settled`. |
| `POST /api/auth/where` | `{ at }` | stores the declaration (`bu_declarations`, grants nothing); refused unless `at` is on the list above. |

**Added by §315:** `sign-in` also takes `door` (the client whose door the
person stood at, §313.36) and narrows `landing` to that client only if
they may open it; `password` takes `current` only when `must_change` is
NOT set — a temporary password is replaced without it, because the door
has just checked it and the card has no box for it. Both forms post to
these routes themselves before the page's script is live: a form post
(urlencoded) is answered with a **303** — to the landing, to the door for
`must_change`, or to the door with `?refused=1` — never with JSON.

Sessions: `token_hash` of a random token, 30 days (`SESSION_DAYS`), pruned on
sign-in (§43). Passwords: scrypt, per-password salt, `lib/auth.js`'s `hash`
and `verify` byte-for-byte.

## 3 · The save (`POST /api/<slug>/state`) — §210's contract, per tenant

Body: `{ base, changes: [{ path, set | del }], expect }` exactly as
`src/sync.js` posts today; a whole-graph body is **not** accepted (the frozen
build never posts one to the new app).

Inside `withTenant`:

1. `SELECT pg_advisory_xact_lock(420043, hashtext($tenantId))` — §240's lock,
   **per tenant**.
2. `readState()` → the stored world.
3. `applyChanges(stored, changes)` → the incoming world (§210/§215).
4. `authorize(stored, incoming, actor)` → allowed, or **403** with the same
   verdict shape as today (`{ refused: [{why, kind, target, rows}] }`, §184).
5. `writeChanges(stored, incoming, changes)`: **only the rows the change list
   names** are written — an `UPDATE` of the field on its row, an `INSERT` for
   a row that appeared, a `DELETE … WHERE tenant_id = $1 AND <key>` for one
   that went, a row's `idx` rewritten for a reorder (§241 as the only writer,
   research §P3, §314.2). No statement in a save clears a table; a change
   shape the writer cannot address is a **400** naming it, never a full
   rewrite. `change_log` written from the diff (§42).
6. COMMIT. Response `{ ok, wrote: "rows", rows: <n>, at }`.

A save of one field therefore holds one row lock for one transaction; two
saves naming different rows never wait on each other beyond the per-tenant
advisory lock, and a reader never waits on a save (§288, now by construction).
S9 proves it: after a one-field save, every other row of the tenant carries
the `xmin` it had before.

`GET /api/<slug>/state` reads the graph; `?since=&target=` keeps §258's peek
as one indexed query on `change_log (tenant_id, at)`.

## 4 · Deletion (`DELETE /api/platform/tenants/<key>`)

Super user only, confirmed twice (§146). Export every subject's workbook and
archive first (§304's builders), then `DELETE FROM tenants WHERE id = $1`,
then the catalogue count — every table with `tenant_id`, zero rows. The
response carries the counts. S4.
