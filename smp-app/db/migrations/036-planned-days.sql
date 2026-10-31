/* Planned man-days on an assignment (spec 069, §696)

   Islam: "one more thing I want to add to the assignment, the planned
   man-days, which is basically the number of days of the agreement that we
   agreed on with the client." One column on the registry's row: a whole
   number of days, or nothing where none was recorded — NULL, never 0, so a
   zero can only mean a zero somebody typed. The same column schema.sql now
   carries, for the database already up; IF NOT EXISTS for 030's reason, the
   constraint asked of the catalogue. Idempotent. */

ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS planned_days integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'case_planned_days') THEN
    ALTER TABLE case_studies ADD CONSTRAINT case_planned_days CHECK (planned_days IS NULL OR planned_days >= 0);
  END IF;
END $$;
