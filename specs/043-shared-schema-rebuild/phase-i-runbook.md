# Phase I — the data, step by step

**Stop point E.** Islam runs database work through **Neon's SQL editor only**
— his word, 2026-09-09 — never a connection string in chat and no Node script
from his shell. So every step below is either something he presses in the
product, SQL he pastes, or something that runs **at deploy from Vercel's own
environment**. A step that fits none of those is said here rather than assumed.

---

## What has to happen, and who does it

| | Step | Who | How |
|---|---|---|---|
| 1 | The shared schema exists on the production database | deploy | `db/apply.mjs` — already the deploy step (Phase J) |
| 2 | **Raya Trade carried across** | deploy, once | `scripts/migrate-raya.mjs`, guarded — see below |
| 3 | **RHI and El Abd created empty** | Islam, in the product | Forefront's own page → *Add a client* |
| 4 | **The demo seeded** | deploy, once | `scripts/seed-demo.mjs` |
| 5 | Everybody signs in again | deploy | `DELETE FROM sessions;` — Phase J's row |

---

## 2 · Raya Trade — why it runs at deploy, and what that costs

`migrate-raya.mjs` reads the frozen `raya_trade` schema **through the frozen
product's own reader** (`lib/state-io.js`) — the reader that wrote those JSON
blobs is the one that interprets them, once — and then loads the graph under a
new tenant. It walks JSON. **It cannot be said in SQL**, which is the case
stop point E anticipated.

**It needs no second database and nothing pasted.** The frozen schemas
(`raya_trade`, `platform`) and the shared schema live in the SAME Neon
database, so `--from` and `--to` are the same connection string Vercel already
holds. The command is:

```
node scripts/migrate-raya.mjs --from=$DATABASE_URL_UNPOOLED
```

**It runs once by construction, not by care:** the first thing it does is
refuse if a `raya-trade` tenant already exists. Everything after that is one
transaction, so a failure rolls back and leaves nothing half-carried.

**The cost, stated.** A deploy that runs it is a deploy that touches data, and
the frozen product is still serving while it does — so it is run **after** the
frozen site has been switched off (Phase J's order), or a figure entered in
the minutes between the read and the switch is carried and then lost. That is
the one thing about it that has to be sequenced rather than guarded.

**Proved on a copy, not on the real thing** — `spike/s8-raya-migration.mjs`,
four assertions: counts equal per table, a plan byte-identical, a save round
tripping, every migrated sign-in still working, and two breaks (`short:`,
`wrong-tenant`) that must go red.

---

## 3 · RHI and El Abd — through the page, NEVER by pasted SQL

**This is a Phase I finding and it changes the instruction.** A tenant made
with `INSERT INTO tenants …` holds **no graph**, and a tenant with no graph
answers **404 “This client holds no plan yet.”** at the state API: the client
cannot be opened at all, by anybody, and the landing sends whoever tries to
`/platform`. Measured, not reasoned — a hand-made `rhi` did exactly that.

Forefront's own **Add a client** does it correctly: it writes the row AND loads
**§67's cleared graph** — the product's own `clearedGraph()` over the seed,
the same shape a fresh deployment has always started from — with the client's
own name on the group, an empty register, and `made_here` set so the platform
may place people on it. If the graph fails to load it **deletes the row**,
because a client that cannot be opened is worse than one that was never made.

So: **Islam presses *Add a client* twice.** No SQL, which also suits the
constraint better than SQL would.

What he sees afterwards, measured on a client made this way: the ten unit names
and the functions as §67 leaves them for Setup to rename, `1 Missing` on
Foundation, and the plan builder as the way in.

---

## 4 · The demo

```
node scripts/seed-demo.mjs
```

The renaming table and the refusal are the frozen `scripts/seed-demo-client.js`'s,
required and not copied — it **throws** on any real name that survived, and
this refuses twice: on the graph it builds and on the graph Postgres hands
back. `--dry-run` prints what it would write without a database. Re-running is
refused unless `--replace` is passed, because a demo somebody has practised in
is not something to overwrite by typing a command twice.

`checks/demo-seed.mjs` scans the **columns** of every tenant-owned table under
the demo tenant — not the graph, which is only what a reader surfaces — and
scans Raya's the same way as the control, because a scan that finds nothing
proves nothing until it has been shown finding something.

---

## What Islam is asked for, in one list

1. Press **Add a client** twice: *RHI*, *El Abd*.
2. Nothing else — steps 1, 2, 4 and 5 run at deploy (Phase J).

Everything he might otherwise have been asked to paste has been removed from
this phase deliberately: the only SQL in it (`DELETE FROM sessions`) belongs to
the cutover, and the only data-walking step runs where the connection string
already lives.
