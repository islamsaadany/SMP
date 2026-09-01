-- @phase: pre
-- 001 · A role is a seat on a client (spec 024, revision 3 — Islam 2026-08-29).
--
-- The four platform roles go: what somebody may do about a client is the seat
-- they hold ON that client, and the platform itself has one admin.
--
-- NOBODY'S STANDING CHANGES IN THE MOVE. An admin stays an admin; anybody who
-- was that client's super user keeps that seat; everybody else on a team was
-- SMO team already, which is what the column defaults to.
--
-- EVERY STEP IS CONDITIONAL, and on the platform that is not the same reason
-- as §33.5's on a client. This phase runs BEFORE platform-schema.sql — it has
-- to, because that file now indexes a column this migration adds — so on a
-- FRESH database the tables do not exist yet at all, and the file must find
-- nothing to do and say so rather than failing on `accounts`. 008 carries the
-- same rule from the other side, where schema.sql has already run.

DO $$
BEGIN
  IF to_regclass('accounts') IS NOT NULL THEN
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'accounts' AND column_name = 'role') THEN
      UPDATE accounts SET is_admin = true WHERE role = 'admin';
      ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_role;
      ALTER TABLE accounts DROP COLUMN role;
    END IF;
  END IF;

  IF to_regclass('account_clients') IS NOT NULL THEN
    ALTER TABLE account_clients ADD COLUMN IF NOT EXISTS seat text NOT NULL DEFAULT 'smoteam';

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'account_clients' AND column_name = 'is_super') THEN
      UPDATE account_clients SET seat = 'super' WHERE is_super;
      -- The old index names the old column, so it goes here; platform-schema.sql
      -- creates the new one straight after this runs (§33.5's ordering: shape
      -- first, then the file that assumes the shape).
      DROP INDEX IF EXISTS account_clients_one_super;
      ALTER TABLE account_clients DROP COLUMN is_super;
    END IF;
  END IF;

  -- The old table's rows named roles that no longer exist. Dropped rather than
  -- translated: `my_clients` is the seat now, and a row keyed `lead` would sit
  -- there for ever meaning nothing (§24).
  IF to_regclass('platform_access') IS NOT NULL THEN
    ALTER TABLE platform_access DROP CONSTRAINT IF EXISTS platform_access_grant;
    DELETE FROM platform_access WHERE role_key <> 'everyone';
  END IF;
END $$;
