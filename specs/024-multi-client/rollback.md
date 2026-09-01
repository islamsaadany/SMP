# The live migration, and the way back

Written BEFORE the rehearsal, and rehearsed twice against copies of a
production-shaped database. `scripts/migrate-to-multi-client.js` has **not**
been run against production; nothing merges to `main` without Islam's word on
that merge (CLAUDE.md, rule 4).

## What it does, in order

1. Reads `public` and `raya_trade` and **refuses to guess** if both hold tables.
2. `ALTER TABLE … SET SCHEMA raya_trade` for all 44 tables. **No row is copied,
   so nothing can be half-copied** — this is a catalogue update, not a data
   move, and it is the single most important property of the whole script.
3. Creates the `platform` schema and its registry, registers four clients, and
   creates the three office accounts with temporary passwords **said once**.
4. Creates `rhi`, `el_abd` and `demo` — schema, migrations, and their own names,
   with `seed: false`, so they hold nothing.
5. Turns each client's own people with an address into `platform.accounts`.
6. Reads the result back and prints a table per client.

It is **idempotent**: a second run moves nothing, registers nothing new, and
leaves every existing account alone. Proved by running it twice.

## The way back

**Step 2 is the only irreversible-looking step and it is exactly reversible**,
by the same mechanism:

```sql
-- back to a v2.0 deployment, one statement per table
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'raya_trade' LOOP
    EXECUTE format('ALTER TABLE raya_trade.%I SET SCHEMA public', t);
  END LOOP;
END $$;
DROP SCHEMA raya_trade CASCADE;   -- empty by then
DROP SCHEMA platform CASCADE;     -- the registry and the accounts
DROP SCHEMA rhi CASCADE;
DROP SCHEMA el_abd CASCADE;
DROP SCHEMA demo CASCADE;
```

**And the code has to go back with it**, or the platform posts a `client` field
at a deployment that resolves no client: revert to the commit before the
multi-client branch merged. The two must move together — a rolled-back database
under the new code is the one state neither side is written for.

**AND IT WAS EXERCISED, NOT ONLY WRITTEN DOWN.** Run against the migrated
copy: 44 tables back in `public`, all five schemas gone, and the platform reads
it as a v2.0 deployment again — Raya Trade, ten units, thirty-three people,
Mobile's four pillars. A rollback nobody has run is a paragraph, not a plan.

**A NEON BRANCH IS THE REAL ANSWER, AND IT IS CHEAPER THAN ANY OF THIS.** Take
a branch of production first; if the migration goes wrong, point the deployment
at the branch rather than unwinding anything. The SQL above is the fallback for
the case where that is not available.

## What the rehearsal found

Rehearsed on a database seeded exactly as a v2.0 deployment is, and on one
filled with the worked example:

- 44 tables moved; Raya still reads its own name, its ten units, its
  thirty-three people and Mobile's four pillars afterwards.
- `rhi`, `el_abd` and `demo` hold the same 44 tables and no content.
- A second run is a no-op that says so.
- **THE SCRIPT ITSELF WAS BROKEN AND THE REHEARSAL IS WHAT FOUND IT**: it still
  wrote `accounts.role` and `account_clients.is_super`, the two columns
  revision 3 removed — so the one script that sets a deployment up would have
  failed on the shape it was setting up. Reading it would not have shown that.

## Before it is run for real

- [ ] A Neon branch of production, taken and named.
- [ ] `--dry-run` against production, and the table list read.
- [ ] The three temporary passwords captured as it prints them — they are said
      once and stored nowhere in the clear.
- [ ] `/raya-trade` opened and driven afterwards, and `/rhi` walked empty.
- [ ] `db/seed-demo-client.js` run, and `/demo` opened.
