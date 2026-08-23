-- @phase: pre
--
-- FUNCTIONS THAT PLAN IN PILLARS (spec 010, §52).
--
-- A function may now plan in the BUSINESS UNIT's format — pillars carrying key
-- measures and tactics — rather than in capabilities and projects. And a
-- function may sit UNDER a unit rather than beside the group.
--
-- WHY THE PILLARS TABLE RATHER THAN A SECOND SET OF TABLES. A function's pillar
-- is a unit's pillar in every respect: the same fields, the same measures, the
-- same tactics, the same scoring, and the same pages rendering it (A13 — two
-- screens doing the same job should be one screen with different content).
-- Three parallel tables would be three copies of the same rows, and every
-- reader, every migration and every clean slate would have to remember both.
-- So the OWNER of a pillar becomes "a unit or a function" rather than "a unit".
--
-- `unit_key` stops being NOT NULL and gains `fn_key` beside it, with a CHECK
-- that exactly ONE is set — an ownerless pillar and a doubly-owned one are both
-- nonsense and neither should be storable. Measures and tactics hang off the
-- pillar and cascade from it, so they need no change at all.
--
-- @phase: pre, and it matters (§33.5): schema.sql is all CREATE TABLE IF NOT
-- EXISTS and can never add a column to a table that already exists, so a
-- SCHEMA migration has to run BEFORE the seed. Run after it, the seed would
-- write fn_key into a table that does not have the column yet and take the
-- live database down on deploy.

ALTER TABLE pillars ALTER COLUMN unit_key DROP NOT NULL;

ALTER TABLE pillars ADD COLUMN IF NOT EXISTS fn_key text
  REFERENCES functions(key) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pillars_one_owner') THEN
    ALTER TABLE pillars ADD CONSTRAINT pillars_one_owner
      CHECK ((unit_key IS NULL) <> (fn_key IS NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS pillars_fn_key_idx ON pillars (fn_key);
