-- A step can be drawn in the same column as the one before it. Additive: one flag, off by default.
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "sameColumn" BOOLEAN NOT NULL DEFAULT false;
