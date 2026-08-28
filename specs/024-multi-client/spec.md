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

**The main address carries no client's name.** The door is the platform's own
address; each client hangs off it under its own name — `/raya-trade`, `/rhi`,
`/el-abd`, `/demo`. Today the deployment answers only at `/raya-trade`, which
is one client's name on the front of the product (Islam, 2026-08-28).

**Demo is a client like any other.** It sits on the cards for Forefront only,
holds invented content, and — unlike everything demo has been until now — it
**saves**, so it can be added to between pitches.

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
| The main address | **No client's name on it.** The door is the root; each client is that name after the slash. An address of a client's own (`raya-trade.smp…`) is not in v1. |
| Where the office's seats are set | **In the client's configuration on the outer platform**, not in the client's register. One list — the SMO team — with one of them marked that client's Super user. |
| Who may open a client | **A matrix decides** (Islam, 2026-08-28, revising "everyone sees and opens every client" the same day): four office roles × six columns, view / edit / nothing. |
| A client's own Super user | **Possible, and granted from outside** — usually Islam for now, a client's own person when he decides. |
| How the seat move lands | **Two steps**: read-only in the register first, out of Roles & access once proven. |
| A Demo client | **Yes**, on the cards, Forefront only. Seeded with the Raya worked example, **renamed to invented names**, and editable from then on. |
| The Demo data button | **Goes.** One place for demo material, and it is the one that can be added to. |
| The first-run tour | **Not offered until the client has a plan**, then it walks their own. |
| One demo or several | **One now, split into industry demos later.** |

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
- **Who manages whom.** Forefront accounts are managed on the outer platform's
  Consultants page (§7.1); a client's own people are managed inside their
  client, on the register they already have. One door, two desks, and neither
  can issue the other's passwords (§89's rule, unchanged).
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
- **What is on the cards is what your row allows** (§7.4) — your clients
  always, other clients only if your role reaches them. Nobody is shown a card
  they cannot open.
- **Demo sits among them**, marked as the demo so nobody mistakes it for a
  client, and drawn for Forefront only — it is on the cards, and the cards are
  the office's.
- Inside a client, the chrome carries the client's name; pressing it returns
  to the cards. **No dropdown** — a list of every client on every page of a
  client's platform is one mis-gate away from being read by that client.

## 6 · Inside a client — and where the office's seats are decided

**The office's seats are granted outside the client, not inside it** (Islam,
2026-08-28). Each client's configuration on the outer platform names its
**SMO team** — one list — and marks one of them as that client's **Super
user**. That is the only place those two seats are decided.

- A Forefront person on a client's team **appears on that client's register**,
  marked as the office, so every rule that already reads the register — roles,
  chat, email audiences, the change log, `namedOn()` — keeps working with
  nothing added beside it (§53.5). The row is **written from the
  configuration and read-only inside the client**, and says where it is set.
- The **Super user** may be a Forefront person or, when Islam decides, a
  person on that client's own register. Either way they are named in the
  client's configuration, and they hold everything §89 gives a Super user
  inside that client: the access matrix, destruction, issuing passwords.
- **What a Forefront person may reach is the matrix's answer** (§7.4), not
  the team list's alone: the team says which clients are *yours*, and the
  matrix says what *yours* and *others* are worth. This replaces the earlier
  "everyone sees and opens every client", and it settles the one line the
  first draft of this section had to guess at.
- Everything else a client's people see is the platform as it stands today.
  A client's own roles — unit owner, strategy custodian, function head,
  contributor — are theirs, granted inside their client, and nothing here
  touches them.

### 6.0.1 How the seat move lands — two steps (Islam's answer)

1. **Step one, in this build.** The configuration decides the office seats;
   the client's register shows them, marked, and refuses to edit them. Two
   surfaces, one source (§53.5).
2. **Step two, once step one is proven on a live client.** The office seats
   come out of the client's own Roles & access page entirely. Only then is
   `people.role` no longer where `super` and `smoteam` are decided.

Doing it in one step would move the client's role model on the same day the
door, the schemas and the accounts move. Two steps is Islam's call and the
safer order.

## 6.1 · The Demo data button goes — and what that reverses

§21 gave every client a **Demo data** button holding the invented Raya example,
baked into the platform file and refusing to save (§21.1's guard). With a Demo
*client* on the cards, that button is a second, weaker home for the same
material: it cannot be added to, which is the whole reason Islam asked for the
Demo client.

- **The button, demo mode, and §67's Filled/Clear project pair leave the
  product.** The controls, the switch and the banner go; nothing that reads
  live data changes.
- **The baked dataset itself stays.** Opened as a file with no server, the
  platform *is* the example — that is where the offline handover file gets its
  content — so the bake is data of last resort, not a mode anyone switches into.
- **This reverses §21's "never put invented content in the database", for one
  client and deliberately.** The Demo client is invented content, in a database,
  saved on purpose. What replaces §21's guard is the boundary this spec builds:
  Demo is its own schema, on the cards only, and no client can reach it.

## 6.2 · The first-run tour

The tour (§107) switched to demo data to walk a new person through a filled-in
plan. With the switch gone, **the tour runs on the person's own plan, and is
not offered until there is one** (Islam's answer, and it is the honest one — a
tour of an empty screen teaches nothing).

- `tourReady(target)` — the place the story would be told on holds at least one
  pillar or capability and one key objective. Absent that, the tour is not
  offered, and the replay button on the Knowledge base says why rather than
  starting something that lights nothing (§61: a control that opens nothing).
- Nothing else about §107 changes: the same two stories, the same steps, the
  same rule that it never appears for the office (§118).

## 6.3 · The Demo client's content

Created like any other client, then seeded from `db/seed-state.json` — the Raya
worked example the product already carries — **with the company, the units and
the people renamed to invented ones**. Real numbers against a real client's
name is the one thing a demo must not be.

The invented names are content, not code: I draft them and Islam approves the
list before it is seeded. Nothing is shown to anyone until he has.

## 7 · The outer platform — what it holds

Four things, and nothing else. It is the office's platform, not a second copy
of the product: consultants, clients, who may do what, and the cards.

### 7.1 Consultants (people and passwords)

The Forefront team: name, email, whether they are active, and their password
state. It **borrows the register's own mechanics** (§35, §43) rather than
inventing a second way to do the same job — a temporary password issued by the
platform's Super user, forced change on first use, the *not asked / temporary /
set* status column, retire rather than delete, and rate limiting on the door.

Islam is the platform's Super user. Day one: Islam, Omar, Essam.

### 7.2 Clients — the configuration page

Per client: **name** (what the cards and the client's own chrome say),
**address name** (the name after the slash, derived from the name and editable
once, since a link that has been sent should keep working), **industry**,
**notes**, the client's **mark and colours**, and the **SMO team** — the list,
with one person marked as that client's Super user.

**Creating one** does exactly what §36.4 describes and no more: create the
schema, apply `db/schema.sql` and every migration, write the org name, and
stop. **No seed, no invented content** — which is what migration 004's clean
slate already produces, so "real but empty" is a shape the product has and has
been checked. Defaults an empty client does not hold (labels, bands, the
access matrix) are already answered by `lib/rules.js` when the stored map does
not carry them (§30.2).

**Retiring a client is not in v1**, flagged rather than silently omitted: a
schema holding a client's whole strategy is not deleted from a button.

### 7.3 Who may see and do what — the platform's own access matrix

Islam: *"someone who is early in the company will not see all the clients,
might be only seeing his own clients, not even editing… we need an
accessibility table."* It is **§37's table one level up**: roles down, areas
across, each cell **view · edit · nothing**, and the same reason §37 has *own
business unit* apart from *other business units* — the interesting question is
almost always whether the thing is yours.

**Four roles:** Admin · Lead · Consultant · Observer.
**Six columns:** My clients · Other clients · Client configuration ·
Consultants and passwords · Creating a client · Demo client.

- **"My clients" are the clients whose SMO team I am on** (§7.2). One
  definition, read from the configuration — never a second list.
- **The configuration column is exercised over the clients that role can
  reach.** A Lead who may edit configuration edits it for their own clients;
  it does not hand them a client their row cannot open.
- **Creating a client** is an act, not a page: nothing or edit.
- **Nothing until granted** (Islam's answer): a Forefront person with no role
  signs in and sees an empty platform. That is deliberately *not* §93's floor
  row — there is nothing to configure about somebody who holds nothing.
- **The Admin's row is not editable**, for §89's reason: editing the matrix is
  editing who may edit the matrix, so the platform must always have somebody
  who can. Creating clients and managing consultants stay the Admin's whatever
  the table says.

Proposed shipped defaults — Islam's to change from the page, and the point of
writing them down is that a default nobody chose is still a decision:

| | My clients | Other clients | Client config | Consultants | Create a client | Demo |
|---|---|---|---|---|---|---|
| **Admin** | edit | edit | edit | edit | edit | edit |
| **Lead** | edit | view | edit | view | — | edit |
| **Consultant** | edit | — | view | — | — | view |
| **Observer** | view | — | — | — | — | view |

The Demo column is why a new joiner can be given somewhere real to practise
while seeing no client at all.

### 7.4 The cards

The way in. Covered in §5.

## 8 · Files this touches

`index.html` (the door; Raya's mark stops being hardcoded) · a new cards page
· `api/auth.js` (email-only, accounts in `platform`) · `lib/auth.js` ·
`api/state.js`, `api/chat.js`, `api/mail.js` (client on every request) ·
`lib/state-io.js` (`getPool`, `ensureReady` per schema, `search_path`) ·
new `db/platform-schema.sql` + migrations · `vercel.json` (a rewrite per
client) · `sw.js` (it precaches `/raya-trade` by name — §91: bump `SHELL`) ·
`scripts/dev-server.js` (one path per client) · the shell's chrome (client
name) · the outer platform's three pages — Consultants, Clients, the cards ·
`lib/rules.js` (`isForefront`, `tourReady`, the office seat read from the
configuration) · the platform's shell and
`src/sync.js` (the Demo data button, demo mode and §67's Filled/Clear pair
come out) · `src/tour.js` — and the checks.

**`lib/authorize.js` and the rest of `lib/rules.js` are untouched.** If this
work starts editing the authoriser, the boundary has been drawn in the wrong
place.

## 9 · Moving the live deployment

Rehearsed against a copy of production before it is run against production,
with the rollback written down first.

1. `CREATE SCHEMA raya_trade;` then `ALTER TABLE public.<t> SET SCHEMA
   raya_trade;` for every table — no data is copied, so nothing can be
   half-copied.
2. Create `platform`; seed the three Forefront accounts (Islam, Omar, Essam —
   their addresses read off Raya's register and shown to Islam before they are
   used), and Raya's configuration with its SMO team. Then build `accounts`
   from the existing `credentials` joined to each person's email on the
   register. A person with a password
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
- **The demo material:** the Demo button is gone from every page and every
  viewer (asserted as an absence at both ends, §94.2), the offline file opened
  from disk still shows the full example, and the Demo *client* opens with a
  complete plan and saves.
- **The matrix has teeth:** each of the four roles is signed in and asked for
  a client its row does not reach — refused on the screen **and** by the
  server, and refused identically to a client that does not exist (§3.1). The
  Observer's edit is refused everywhere, and the Admin's row cannot be edited
  into locking the Admin out (§89).
- **The seats agree:** the office people the client's register shows are
  exactly the client's configured SMO team, the seat cannot be edited from
  inside the client, and a consultant who is not on the team enters read-only —
  asserted on the screen **and** against the server, since a screen that
  refuses an edit the server would accept is §94's drift.
- **The tour:** not offered on a client with no plan, offered and walked
  through on one that has, and still never offered to the office (§118).
- Each check is watched to fail against the pre-split build before its green
  run is believed (§94.5).

## 11 · Deliberately not in v1

An address of a client's own (`raya-trade.smp…`) — decided, not forgotten:
paths first, and the work is arranged so a client address can be added later
without redoing it. A demo client per industry (one now, split when the
industries are known). A guest login into Demo for a prospect. Cross-client
reporting for Forefront; a client person
who holds two clients; retiring or exporting a client; per-client backup and
retention; assigning office people to a subset of clients (all see all, §2);
and the Neon compute question — every open tab polls (§98), and three clients
polling is three times the traffic on one free instance.
