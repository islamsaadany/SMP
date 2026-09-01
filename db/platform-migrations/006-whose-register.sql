-- @phase: pre
-- 006 · Whose register is it (§147.31).
--
-- A client CREATED from the platform has its register built here, so its team
-- is added to it automatically. A client that predates the platform brought
-- its own, and the platform adds nobody to it.
--
-- EXISTING ROWS DEFAULT TO FALSE, which is the safe reading: it says "this
-- register is not ours to write into", and the worst it can do is ask who
-- somebody is on a register the platform did in fact build — a question with
-- an answer. The other way round writes rows into a client's own register
-- without being asked, which is the thing §147.30 exists to stop.
--
-- CONDITIONAL, like every step in this phase: on a fresh database
-- platform-schema.sql creates the column and there is nothing to add.
DO $$
BEGIN
  IF to_regclass('clients') IS NOT NULL THEN
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS made_here boolean NOT NULL DEFAULT false;
  END IF;
END $$;
