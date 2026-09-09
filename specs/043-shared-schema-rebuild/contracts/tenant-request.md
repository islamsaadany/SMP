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
5. `writeState(incoming)`: `DELETE … WHERE tenant_id = $1` on the 33 graph
   tables, then the inserts; `change_log` written from the diff (§42).
6. COMMIT. Response `{ ok, wrote, at }`.

`GET /api/<slug>/state` reads the graph; `?since=&target=` keeps §258's peek
as one indexed query on `change_log (tenant_id, at)`.

## 4 · Deletion (`DELETE /api/platform/tenants/<key>`)

Super user only, confirmed twice (§146). Export every subject's workbook and
archive first (§304's builders), then `DELETE FROM tenants WHERE id = $1`,
then the catalogue count — every table with `tenant_id`, zero rows. The
response carries the counts. S4.
