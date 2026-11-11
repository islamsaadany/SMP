-- Gap marks the office skips, per step and per kind. Additive: one array column with an empty default.
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "skippedGaps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
