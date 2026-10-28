-- Priorities inside a process: flag a step and score it. Additive only: nullable columns and one flag with a default.
ALTER TABLE "process_steps"
  ADD COLUMN IF NOT EXISTS "priorityFlagged" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "priorityImportance" INTEGER,
  ADD COLUMN IF NOT EXISTS "priorityComplexity" INTEGER,
  ADD COLUMN IF NOT EXISTS "priorityRisk" INTEGER,
  ADD COLUMN IF NOT EXISTS "priorityWhy" TEXT;
