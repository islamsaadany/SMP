-- Hand-overs between steps of different processes. New table only; nothing existing changes.
CREATE TABLE IF NOT EXISTS "step_handoffs" (
    "id" TEXT NOT NULL,
    "fromStepId" TEXT NOT NULL,
    "toStepId" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "step_handoffs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "step_handoffs_fromStepId_toStepId_key" ON "step_handoffs"("fromStepId", "toStepId");
CREATE INDEX IF NOT EXISTS "step_handoffs_toStepId_idx" ON "step_handoffs"("toStepId");
ALTER TABLE "step_handoffs" ADD CONSTRAINT "step_handoffs_fromStepId_fkey" FOREIGN KEY ("fromStepId") REFERENCES "process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "step_handoffs" ADD CONSTRAINT "step_handoffs_toStepId_fkey" FOREIGN KEY ("toStepId") REFERENCES "process_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
