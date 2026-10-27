/* Track Record (spec 069)

   Case studies become the Track Record: each row is an ASSIGNMENT on the
   client registry — Planning or Retainer — added by the super user with its
   lead, and the lead is asked for the write-up when its end month comes.
   The same two columns schema.sql now carries, for the database already up.

   EVERY STATEMENT IS `IF NOT EXISTS`, for 030's reason: on a fresh database
   schema.sql has already made them and this must be a no-op there. The
   constraint has no IF NOT EXISTS of its own, so it is asked of the catalogue.

   EVERY ROW ALREADY HERE IS A PLANNING ASSIGNMENT WITH NO LEAD, which is the
   honest default: nothing was recorded about either, and a lead is set on the
   Clients page rather than guessed from who wrote it. */

ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'planning';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES users (id) ON DELETE SET NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'case_kind') THEN
    ALTER TABLE case_studies ADD CONSTRAINT case_kind CHECK (kind IN ('planning','retainer'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS case_lead ON case_studies (lead_id) WHERE state <> 'done';
