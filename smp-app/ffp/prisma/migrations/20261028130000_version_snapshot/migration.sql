-- Stage 5 of the Processes redesign (spec 067 §1, "only the version in force"):
-- each approved version keeps what was approved, as its readers read it, so the
-- office can draft the next version while readers keep this one. Additive:
-- one nullable column. A version published before this has none; it is taken
-- from the process the first time anyone opens it (ffp/lib/data/process-content.ts).
ALTER TABLE "process_versions" ADD COLUMN IF NOT EXISTS "snapshot" JSONB;
