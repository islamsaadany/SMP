-- Controlled lifecycle for processes. Adds columns with defaults and one new table.
DO $$ BEGIN
  CREATE TYPE "ProcessLifecycleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "processes"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" "ProcessLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "reviewIntervalMonths" INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS "nextReviewDue" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approverPersonId" TEXT,
  ADD COLUMN IF NOT EXISTS "approverName" TEXT,
  ADD COLUMN IF NOT EXISTS "approverRole" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewers" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "submittedByName" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedByEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "returnReason" TEXT,
  ADD COLUMN IF NOT EXISTS "pendingChangeNote" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retiredAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "process_versions" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "changeNote" TEXT NOT NULL,
    "submittedBy" TEXT,
    "approvedBy" TEXT NOT NULL,
    "approvedRole" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "process_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "process_versions_processId_number_key" ON "process_versions"("processId", "number");
ALTER TABLE "process_versions" ADD CONSTRAINT "process_versions_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: a process that already names who approved it is in force today, so it
-- starts Published (with a first version and a review a year out), not Draft.
-- Runs only on rows still at the default, so a re-run changes nothing.
WITH inforce AS (
  UPDATE "processes"
     SET "lifecycleStatus" = 'PUBLISHED',
         "publishedAt" = now(),
         "nextReviewDue" = now() + interval '12 months',
         "approverName" = btrim("sopApprovedBy")
   WHERE "lifecycleStatus" = 'DRAFT'
     AND "sopApprovedBy" IS NOT NULL AND btrim("sopApprovedBy") <> ''
  RETURNING "id", "sopApprovedBy"
)
INSERT INTO "process_versions" ("id", "processId", "number", "changeNote", "approvedBy", "publishedAt")
SELECT gen_random_uuid()::text, "id", 1, 'Baseline: approved before the controlled lifecycle was introduced', btrim("sopApprovedBy"), now()
  FROM inforce
ON CONFLICT DO NOTHING;
