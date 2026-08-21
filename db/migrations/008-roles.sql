-- @phase: pre
-- 008 — roles replace levels (§33, v3.8)
--
-- N-1 / N-2 / N-3 were org depth. The platform works on ROLES now: super user,
-- group CEO, company CEO, business unit owner, strategy custodian, supporting
-- function head, contributor. A person's official job title is information
-- about them and is never consulted for access.
--
-- people.level -> people.role, and only the SEAT roles live there (super,
-- gceo, cceo). Owner, custodian and function head are read from whatever
-- points at the person — unit_roles.head/custodian, functions.head/custodian —
-- so a role and its assignment cannot disagree.
--
-- EVERY STEP IS CONDITIONAL, because ensureReady seeds BEFORE it migrates
-- (§21): on a fresh deployment schema.sql has already created the new shape
-- and the seed has already filled it, so this file must find nothing to do
-- and say so quietly rather than failing on a column that was never there.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'people' AND column_name = 'level') THEN

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'people' AND column_name = 'role') THEN
      ALTER TABLE people DROP COLUMN level;      -- new column already present
    ELSE
      ALTER TABLE people RENAME COLUMN level TO role;

      UPDATE people SET role = CASE
        WHEN role = 'smo' THEN 'super'
        WHEN role = 'ceo' THEN 'gceo'
        ELSE ''            -- n1/n2/n3 held no seat: read from what names them
      END;

      -- A company CEO is attached to a company rather than a unit.
      UPDATE people SET role = 'cceo'
       WHERE role = 'gceo' AND (extra ->> 'company') IS NOT NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'access_grants' AND column_name = 'level_key') THEN
    -- The matrix is rebuilt rather than mapped, at Islam's direction: the rows
    -- mean something different now, so a grant carried across would be an old
    -- answer to a new question. Emptying it hands every role its shipped
    -- default, which is what the tenant would have had if roles had existed
    -- when it was seeded (§30.2).
    DELETE FROM access_grants;
    ALTER TABLE access_grants RENAME COLUMN level_key TO role_key;
  END IF;
END $$;

-- Roles are a fixed list in the platform, not per-tenant data, so there is
-- nothing left to store. Left behind, this would be a table the next person
-- has to work out is dead.
DROP TABLE IF EXISTS levels;
