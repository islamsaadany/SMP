-- A step proposed from an AI review finding, pending Confirm/Delete on the map.
ALTER TABLE "review_findings" ADD COLUMN IF NOT EXISTS "proposedLabel" TEXT;
ALTER TABLE "review_findings" ADD COLUMN IF NOT EXISTS "proposedNotes" TEXT;
ALTER TABLE "review_findings" ADD COLUMN IF NOT EXISTS "proposedAfterStepId" TEXT;
