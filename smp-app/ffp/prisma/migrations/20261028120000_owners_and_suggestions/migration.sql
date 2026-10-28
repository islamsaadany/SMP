-- Stage 4 of the Processes redesign (spec 067 §3, §4.2): a process's owner,
-- picked from the client register; when its owner last said it is still
-- right; and the suggestions the client's people send the Strategy Office.
-- Additive only: three nullable columns and one new table.
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "ownerPersonId" TEXT;
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "reviewConfirmedAt" TIMESTAMP(3);
ALTER TABLE "processes" ADD COLUMN IF NOT EXISTS "reviewConfirmedByKey" TEXT;
CREATE INDEX IF NOT EXISTS "processes_ownerPersonId_idx" ON "processes"("ownerPersonId");
ALTER TABLE "processes" ADD CONSTRAINT "processes_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "process_suggestions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "processId" TEXT,
    "stepId" TEXT,
    "byPersonId" TEXT NOT NULL,
    "byName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "why" TEXT,
    "state" TEXT NOT NULL DEFAULT 'NEW',
    "answerText" TEXT,
    "answerBy" TEXT,
    "answeredAt" TIMESTAMP(3),
    "replyText" TEXT,
    "repliedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "process_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "process_suggestions_workspaceId_state_idx" ON "process_suggestions"("workspaceId", "state");
CREATE INDEX IF NOT EXISTS "process_suggestions_processId_idx" ON "process_suggestions"("processId");
CREATE INDEX IF NOT EXISTS "process_suggestions_byPersonId_idx" ON "process_suggestions"("byPersonId");
ALTER TABLE "process_suggestions" ADD CONSTRAINT "process_suggestions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "process_suggestions" ADD CONSTRAINT "process_suggestions_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "process_suggestions" ADD CONSTRAINT "process_suggestions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "process_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "process_suggestions" ADD CONSTRAINT "process_suggestions_byPersonId_fkey" FOREIGN KEY ("byPersonId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
