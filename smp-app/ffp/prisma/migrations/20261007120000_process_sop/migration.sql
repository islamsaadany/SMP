-- SOP: optional step detail and hand-kept document control. All nullable/defaulted.
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "sopInputs" TEXT;
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "sopOutput" TEXT;
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "sopErrors" TEXT;
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "sopVersion" TEXT;
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "sopOwner" TEXT;
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "sopEffectiveDate" TEXT;
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "sopApprovedBy" TEXT;
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "sopRevisions" JSONB NOT NULL DEFAULT '[]';
