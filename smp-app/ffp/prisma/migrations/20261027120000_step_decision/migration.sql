-- A flagged step can go in its own wave. Additive: one nullable column.
ALTER TABLE "process_steps" ADD COLUMN IF NOT EXISTS "deepDiveDecision" "DeepDiveDecision";
