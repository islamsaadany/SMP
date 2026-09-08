# Contract · the outer platform's API, and how every existing endpoint takes a client

House shape, followed rather than reinvented (Principle VI): **one endpoint with
an `action`**, as `api/auth.js` and `api/chat.js` already do. JSON in, JSON out,
`Cache-Control: no-store`, and a database error never reaches the browser
(§43.7 — it names tables to whoever is probing).

## `POST /api/platform`

Every action requires a session. Every action that names a client resolves it
through the registry and authorises it against the signed-in account **before**
touching a schema.

| action | body | answers | who |
|---|---|---|---|
| `me` | — | `{email, name, role, clients:[…], access:{…}}` | any account |
| `cards` | — | the clients this account's row reaches, each with name, industry, mark, whether a cycle is open, unit count, and `mine` | any account |
| `client` | `{key}` | one client's configuration + its team | `client_config` ≥ view, and the client must be reachable |
| `saveClient` | `{key, name, industry, notes, mark, colors}` | `{ok}` | `client_config` = edit |
| `createClient` | `{name, industry, notes}` | `{key}` — creates the schema, applies `schema.sql` + every migration, writes the org name, **and nothing else** | `create_client` = edit (admin) |
| `setTeam` | `{key, email, on, is_super}` | `{ok}` — writes/removes the client's `people` row too | `client_config` = edit |
| `consultants` | — | the office list with password states | `consultants` ≥ view |
| `saveConsultant` | `{email, name, role, status}` | `{ok}` | `consultants` = edit |
| `issuePassword` | `{email}` | `{password}` once, never stored in the clear | `consultants` = edit, **and the target is not an admin** (§89's rule: the test is the target) |
| `access` | — | the matrix, defaults merged with what is stored (§30.2) | `consultants` ≥ view |
| `saveAccess` | `{role, area, grant}` | `{ok}` | admin only, and **the admin row is refused** |

### Refusals

- A client that does not exist and a client this account may not reach are
  **the same refusal**, word for word. Telling them apart hands over Forefront's
  client book.
- A refusal names what would fix it where fixing is possible (§16.7), and never
  names a role the person does not hold.

## How the existing endpoints take a client

`/api/state`, `/api/chat`, `/api/mail` each gain **one** field: `client`, the
slug. Nothing else about their bodies changes.

```text
1. session          → the account
2. clients[slug]    → the schema name (from the row; never from the slug)
3. account_clients  → may this account open this client, at what grant
4. SET search_path TO <schema>       ← on the checked-out connection
5. … the endpoint exactly as it is today …
6. RESET search_path                 ← on release, always
```

**The browser sends a slug, never a schema name** (Principle X). Two tabs on two
clients work, because the client rides the request rather than the session.

**`ensureReady(client, schema)`** is memoised per schema and takes its advisory
lock per schema. Same function, one more argument, and the reason is in
`research.md` §3.

## Sign-in — `POST /api/auth`

| what | before | after |
|---|---|---|
| identifier | person key **or** email, matched inside the tenant | **email only**, against `platform.accounts` |
| `SMO` / `1234` | bootstrap seat with `must_change` | **gone** — a client is opened from a card, so it never needs a seat of its own |
| session | `sessions` inside the tenant, keyed `person_key` | `platform.sessions`, keyed `email` |
| rate limit | `login_attempts` inside the tenant | `platform.login_attempts`, same thresholds, same check-before-verify order |
| a client's own person | signs in here and lands in their client | unchanged, and they never see a card |

## What a check must be able to prove

- The same refusal for an unknown client and an unreachable one.
- `search_path` is set on the connection and **reset on release** — a pooled
  connection carrying a previous request's client is this feature's worst bug.
- A second client, opened first in a fresh process, is migrated (the memo).
- The matrix has teeth on the server, not only on the screen: an Observer's
  `saveClient` is refused; `saveAccess` on the admin row is refused.
