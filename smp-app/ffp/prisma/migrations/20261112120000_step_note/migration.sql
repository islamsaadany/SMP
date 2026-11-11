-- A notes box on every step, Start and End included. Additive: one nullable column.
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "stepNote" TEXT;
