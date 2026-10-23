-- Priorities: choosing which high-level processes to take deep. Adds nullable columns to processes and one new table.
DO $$ BEGIN
  CREATE TYPE "DeepDiveDecision" AS ENUM ('WAVE_1', 'WAVE_2', 'LATER', 'HIGH_LEVEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "PriorityPlanStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "processes"
  ADD COLUMN IF NOT EXISTS "priorityImportance" INTEGER,
  ADD COLUMN IF NOT EXISTS "priorityComplexity" INTEGER,
  ADD COLUMN IF NOT EXISTS "priorityRisk" INTEGER,
  ADD COLUMN IF NOT EXISTS "priorityWhy" TEXT,
  ADD COLUMN IF NOT EXISTS "deepDiveDecision" "DeepDiveDecision";

CREATE TABLE IF NOT EXISTS "priority_plans" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weightImportance" INTEGER NOT NULL DEFAULT 35,
    "weightRisk" INTEGER NOT NULL DEFAULT 40,
    "weightComplexity" INTEGER NOT NULL DEFAULT 25,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "wave1Label" TEXT NOT NULL DEFAULT 'Start now',
    "wave2Label" TEXT NOT NULL DEFAULT 'Next',
    "laterLabel" TEXT NOT NULL DEFAULT 'Review later',
    "status" "PriorityPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "approverPersonId" TEXT,
    "approverName" TEXT,
    "approverRole" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentByName" TEXT,
    "sentByEmail" TEXT,
    "snapshot" JSONB,
    "returnReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByName" TEXT,
    "approvedByRole" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "priority_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "priority_plans_workspaceId_key" ON "priority_plans"("workspaceId");
ALTER TABLE "priority_plans" ADD CONSTRAINT "priority_plans_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
