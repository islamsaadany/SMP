-- A note box on each step for its escalation rules and notes. Additive: one nullable column.
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "escalationNote" TEXT;
