# Spec 024 — One door, many clients

**Status:** decisions agreed 2026-08-28 (Islam, in session, question by
question). **Nothing built.** The cards page, the client name in the chrome
and the "add a client" page are visual work and are mockup-first (CLAUDE.md
§1c): no source is touched until the mockup is published and signed off.

## 1 · What this is

SMP stops being one client's platform. A Forefront person signs in at one
door, is shown a card per client, and opens one — inside, it is the platform
exactly as it is today, named after that client and holding only that
client's data. **Raya Trade** carries everything the live deployment holds
now. **RHI** and **El Abd** exist, are real, and are empty.

A client's own people (Raya's CEO, a unit head) sign in at the same door and
land straight in their client. They never see a card, and never learn that
another client exists.

**Where this sits beside the rebuild (D1 / §20).** The direction of travel is
still a rebuild on the HR_ERP stack; this is built on the live platform
because that is what Islam uses today, and the boundary is drawn so a rebuild
inherits rather than repeats it: the client lives in the URL, in the
connection's `search_path` and in the `platform` schema — never inside a page,
a component or a rule.

## 2 · The decisions, and why

| Decision | Islam's answer |
|---|---|
| Who sees the cards | One door for everybody; **cards only for Forefront**. A client's own person goes straight in. |
| How clients are kept apart | **One Postgres schema per client** (§36.2). |
| What an empty client holds | **Real but empty** — its name, its own schema, nothing else. |
| How a client is created | **An office-only page**, in this build, not a config file. |
| What a Forefront person is inside a client | **SMO team by default**; the Super user's three acts only where that client's Super user granted them. |
| Which cards a Forefront person sees | **All of them.** |
| Switching client | The **client's name in the chrome**; pressing it returns to the cards. |
| Demo data inside a client | **Office only** — a client's people never see another client's worked example. |
| Signing in | **Email only.** No person-key sign-in anywhere. A person is assigned to a client by email. |
| A register row with no email | **Stays, and cannot sign in.** |
| The first office account | `islam.saadany@forefront.consulting`, temporary password, must change on first use. The `SMO` / `1234` seat goes. |
| Where it is built | **The live platform** (gate + built HTML + `/api/*`). `smp-app/` is untouched. |

## 3 · The shape

One Neon database. **One schema per client**, plus one shared schema.

- `platform` — the registry and the door: `clients`, `accounts`,
  `account_clients`, `sessions`, `login_attempts`.
- `raya_trade`, `rhi`, `el_abd` — each one exactly the thirty-odd tables
  `db/schema.sql` creates today, unchanged.

`readState` / `writeState` / `authorize` / `lib/rules.js` are **not touched**.
That is the whole argument for schemas over a tenant column (§36.2): the
boundary is `SET search_path`, so no query, insert, migration or uniqueness
constraint changes, and one forgotten `WHERE` cannot show one client another's
plan. §36.3's trap disappears with it — every client wants a person keyed
`smo`, and under separate schemas that is simply a different table.

### 3.1 Resolving the client on a request

1. The page names its client (it is in the path: `/raya-trade`, `/rhi`,
   `/el-abd`) and sends it with every `/api/*` call.
2. The server looks the slug up in `platform.clients` and takes the schema
   name **from that row** — never from the request string, or the path becomes
   a way to name a schema (§36.4).
3. The server checks `account_clients` says this signed-in account may open
   that client. A refusal is the same refusal an unknown client gets: the two
   must not be told apart, or the door lists Forefront's client book.
4. `SET search_path TO <schema>` on the checked-out connection, reset on
   release. Never on the pool.

Two tabs on two clients therefore work, and neither can be steered into the
other by editing a URL.

### 3.2 The trap already in the code

`ensureReady` is memoised **per process** (§98, deliberately — it was 10 of
14 round trips per request). Memoised per process and not per schema, the
second client is never migrated: it would answer from the first client's
"already ready". The memo becomes a map keyed by schema, and the advisory
lock a per-schema lock. This is the one existing line that fails silently
under multi-client, and it fails in the direction that looks fine.

## 4 · Identity — email is the account

Today: `credentials` and `sessions` live inside the tenant and are keyed on a
short, global `person_key`; the door accepts a key **or** an email (§69).
That cannot survive, because the password has to be verified **before** a
client is chosen.

- **`platform.accounts`** — one row per email: scrypt hash, `must_change`,
  created/updated. The hashing, the session token, its httpOnly cookie, the
  30-day life, the forced change and the rate limiter are §43's, moved
  schema, not rewritten.
- **`platform.account_clients`** — email × client, plus `person_key`: the row
  in that client's register this account is, and a `forefront` flag.
- **Sign-in takes an email and nothing else.** The person-key path is
  removed, including `SMO`. A deployment is entered by the office account
  that created it, so no client ever needs a bootstrap seat of its own.
- **Rate limiting stays where guessing happens** — `platform.login_attempts`,
  by email and by address, on the same thresholds, checked before the
  password is verified (§43.2).

### 4.1 What this costs, stated rather than discovered

- **Everyone signs in again once.** Sessions move schema; existing tokens die.
- **A person with no email cannot sign in.** Their register row stays, owns
  plan lines and is emailed nothing; the Attention queue (§116.2) names them
  beside the people with no password. All 33 rows in the demo seed carry no
  address, so what matters is the live register, not the example.
- **Two rows sharing an address sign nobody in** — §69's rule, unchanged, now
  refused at the directory instead of inside one client.
- **One password per person across every client they hold.** For the office
  that is the point; for a client person it is invisible, because they hold
  one client.

## 5 · The cards

After sign-in:

- **One client → open it.** No card, no choice (§32: a page whose only content
  is a button to the page you asked for is a door behind a door).
- **More than one → the cards.** All clients, each carrying the client's name
  and its own mark. What else a card says (last opened, whether a cycle is
  open, who leads it) is a design question for the mockup, not decided here.
- Inside a client, the chrome carries the client's name; pressing it returns
  to the cards. **No dropdown** — a list of every client on every page of a
  client's platform is one mis-gate away from being read by that client.

## 6 · Inside a client

- A Forefront person **appears on that client's register**, marked as the
  office, from the first time they open it. Every rule that already reads the
  register — roles, chat, email audiences, the change log, `namedOn()` —
  keeps working with nothing added beside it (§53.5).
- Their default seat is **SMO team** (`smoteam`): run cycles, correct plans,
  read the inbox. The **Super user's** three acts — the access matrix,
  destruction, issuing passwords to the office (§89) — only where that
  client's Super user granted them.
- **Demo data is office-only.** `isForefront(person)` gates the button;
  everything else about the demo dataset (§21, §67) is unchanged.
- Everything else a client's people see is the platform as it stands today.

## 7 · Creating a client (office-only page)

Name, slug, mark, colours. On save: create the schema, apply `db/schema.sql`
and every migration, write the org name, and stop. **No seed, no demo data,
no invented content** (§21) — which is precisely what migration 004's clean
slate produces today, so "real but empty" is a shape the product already has
and has been checked. Defaults absent from an empty client (labels, bands,
the access matrix) are already answered by `lib/rules.js` when the stored map
does not hold them (§30.2).

Retiring a client is **not in v1** and is flagged, not silently omitted: a
schema that holds a client's whole strategy is not deleted from a button.

## 8 · Files this touches

`index.html` (the door; Raya's mark stops being hardcoded) · a new cards page
· `api/auth.js` (email-only, accounts in `platform`) · `lib/auth.js` ·
`api/state.js`, `api/chat.js`, `api/mail.js` (client on every request) ·
`lib/state-io.js` (`getPool`, `ensureReady` per schema, `search_path`) ·
new `db/platform-schema.sql` + migrations · `vercel.json` (a rewrite per
client) · `sw.js` (it precaches `/raya-trade` by name — §91: bump `SHELL`) ·
`scripts/dev-server.js` (one path per client) · the shell's chrome (client
name) · `lib/rules.js` (`isForefront`, the Demo gate) — and the checks.

**`lib/authorize.js` and the rest of `lib/rules.js` are untouched.** If this
work starts editing the authoriser, the boundary has been drawn in the wrong
place.

## 9 · Moving the live deployment

Rehearsed against a copy of production before it is run against production,
with the rollback written down first.

1. `CREATE SCHEMA raya_trade;` then `ALTER TABLE public.<t> SET SCHEMA
   raya_trade;` for every table — no data is copied, so nothing can be
   half-copied.
2. Create `platform`, and build `accounts` from the existing `credentials`
   joined to each person's email on the register. A person with a password
   and no email gets **no account** and is named in the report, not dropped
   silently.
3. Create `rhi` and `el_abd`, empty.
4. Verify by reading, not by reasoning: the three schemas' table counts, one
   known figure out of `raya_trade`, an empty `rhi`, and a sign-in as the
   seeded office account.

## 10 · How it is proved

- **Isolation:** an account assigned to one client is refused the other on
  every endpoint (`state`, `chat`, `mail`, `auth`) — asserted as a refusal,
  not as an absent button (§94.2), and with the unknown-client and
  not-assigned refusals asserted **identical**.
- **The trap:** a second client, opened first in a fresh process, is migrated
  — the `ensureReady` memo test, which is the one failure that would look
  like success.
- **Email only:** signing in as `smo` with the right password is refused.
- **An empty client renders:** every page of `rhi` opens with no console
  error and no invented content (`qa.py` against a blank client).
- **The round trip** (`scripts/test-roundtrip.js`) runs unchanged inside a
  schema, plus once against a virgin client schema (§113.7).
- Each check is watched to fail against the pre-split build before its green
  run is believed (§94.5).

## 11 · Deliberately not in v1

Cross-client reporting for Forefront; a subdomain per client; a client person
who holds two clients; retiring or exporting a client; per-client backup and
retention; assigning office people to a subset of clients (all see all, §2);
and the Neon compute question — every open tab polls (§98), and three clients
polling is three times the traffic on one free instance.
