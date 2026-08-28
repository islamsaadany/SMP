# Phase 0 · Research — the questions the code had to answer first

Four unknowns stood between the signed-off spec and a plan. Each was resolved by
reading the running code, not by preference.

## 1 · Where the tenant boundary goes

**Decision:** one Postgres **schema** per client; `SET search_path` on each
checked-out connection, reset on release; never on the pool.

**Rationale:** `readState`/`writeState` move a whole client's graph in one go, so
the boundary can be one statement. A tenant column would touch every query,
insert, migration and uniqueness constraint in ~30 tables, and §36.3's trap is
fatal to it: person keys are short and global (`smo`, `ceo`), so every client
wants the same key and `credentials`/`sessions` would need composite keys.

**Alternatives considered:** a `client_id` column (rejected — above); a database
per client (rejected — a pool, an env var and a migration run per client, and
Neon compute per client).

## 2 · Where identity lives, now that sign-in happens before a client is chosen

**Decision:** `platform.accounts`, keyed by **email**; `platform.sessions` and
`platform.login_attempts` beside it. Each client keeps its own `people`
register; `platform.account_clients` maps an account to a client and to the
`person_key` it is inside that client.

**Rationale:** the password has to be verified before the client is known, so it
cannot live inside a client. §43's mechanics — scrypt, `must_change`, the
httpOnly cookie, the 30-day session, the 8/25-per-15-minutes limiter checked
*before* the password — move schema unchanged; nothing about them is rewritten.
Islam's instruction settles the identifier: *"access only through email … no
access through user name SMO in any place."*

**Cost, accepted:** existing sessions die once, and a person with no email
cannot sign in (spec §4.1).

**Alternatives considered:** keeping `credentials` per client and asking a
directory which client to verify against (rejected — an office account belongs
to many clients, so its password would have no home, and two credential stores
is exactly the drift Principle IX exists to stop).

## 3 · The memoisation trap in `ensureReady`

**Finding:** `lib/state-io.js` memoises readiness in a single module-level
`READY` promise — deliberately, because it was 10 of the 14 round trips a poll
cost (§98). Memoised per **process**, the second client opened in that process
would answer from the first client's "already ready" and **never be migrated**.

**Decision:** the memo becomes a map keyed by schema, and the advisory lock is
taken per schema (`hashtext(schema)`), so two cold starts on two clients cannot
serialise behind each other.

**Why it matters more than it looks:** it fails silently and in the direction
that looks fine — a fresh client renders, because `readState` on absent tables
throws only when a page asks for one.

## 4 · How the office's seat reaches the client's rules

**Decision:** the client's configuration is the source; a **row is written into
that client's `people` register**, marked as the office, and shown read-only
there (step one of spec §6.0.1).

**Rationale:** `lib/rules.js`, `lib/authorize.js`, the chat, the email audience
and `namedOn()` all answer from the register. Resolving the office anywhere else
would mean an office branch beside every one of those reads — Principle IX's
drift, multiplied. Writing the row keeps one vocabulary and changes no rule.

**Alternatives considered:** resolving the office outside the register entirely
(rejected — see above; it is step two, after this feature, once step one has run
on the live client).

## 5 · Colour, measured before use

`#0F2C69` carries white at **13.25:1**. `#F5A623` carries `#231500` at
**9.04:1** and is **2.03:1 as type on white** — so it is a fill, and words take
`#9C5D08` (**5.27:1** on white, **4.62:1** on `--surface-2`); in the dark
palette the bright amber is the word colour at **8.15:1**. Principle XIII, which
this product earned seven times.
