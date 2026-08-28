# Quickstart · running and proving the multi-client split locally

Prerequisites: Node 20, Python 3 with Playwright available through
`SMP_CHROME`, and a throwaway Postgres 16. Nothing here touches production.

## 1 · A database with more than one client in it

```bash
# a throwaway Postgres, then:
export DATABASE_URL=postgres://…/smp_local
node scripts/migrate-to-multi-client.js --seed-demo   # public → raya_trade, platform, rhi, el_abd, demo
```

Expected: `platform` with four rows in `clients`, three in `accounts`;
`raya_trade` holding everything the single-tenant database held; `rhi` and
`el_abd` with the schema applied and **no plan rows**; `demo` holding the
renamed worked example.

## 2 · Serve it

```bash
node scripts/dev-server.js        # / (the door and the cards), /raya-trade, /rhi, /el-abd, /demo
```

Sign in as `islam.saadany@forefront.consulting` with the temporary password the
migration printed. Expected: the change is forced, then the cards.

## 3 · Prove the boundary (the assertions that matter most)

```bash
node scripts/test-platform.js "$SMO_PASSWORD"     # server half, against the real database
```

Expected, in order: an account not on a client is refused it; an unknown client
and an unreachable one produce **identical** refusals; a request naming a schema
rather than a slug is refused; a second client opened first in a fresh process
is migrated; `search_path` is reset when a connection goes back to the pool
(asserted by asking the next request from another client for a known row);
an Observer's save is refused; `saveAccess` on the admin row is refused.

## 4 · Prove the product still works, per client

```bash
SMP_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome python3 qa-run.py \
  SMP-Project-Folder/strategy-management-platform-v3.22.html
python3 SMP-Project-Folder/src/checks/multi-client.py     # cards, matrix, read-only seats, the door
python3 SMP-Project-Folder/src/checks/gap-fill.py         # …and every existing check, unchanged
```

Expected: the existing suite is **unchanged and green** against `raya-trade` —
that is the point of the boundary — plus `qa.py` walking a **blank** client
(`rhi`) with no console error and no invented content.

## 5 · The round trip, on a virgin client

```bash
DATABASE_URL=… node scripts/test-roundtrip.js --client rhi
```

Expected: clean slate PASS, round trip PASS, fixed point PASS — run against a
client created today, because §113.7's fault (a migration reading a column
`schema.sql` no longer creates) is invisible on a database that already exists.

## What "done" looks like

- Every check above green, and each new check watched to **fail** against the
  pre-split build first (Principle XVI).
- `python3 build.py` reproduces the shipped file byte-identically, `sw.js`'s
  `SHELL` bumped, and `node --check sw.js` clean (§146.2).
- The live migration rehearsed on a copy of production before it is run on
  production, with the rollback written down first.
