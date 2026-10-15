-- Risks and controls, and non-conformances, per process. New tables only; nothing existing changes.
CREATE TABLE IF NOT EXISTS "process_controls" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "stepId" TEXT,
    "risk" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "control" TEXT,
    "controlType" TEXT,
    "frequency" TEXT,
    "owner" TEXT,
    "evidence" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "process_controls_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "process_controls_processId_idx" ON "process_controls"("processId");
CREATE INDEX IF NOT EXISTS "process_controls_stepId_idx" ON "process_controls"("stepId");
ALTER TABLE "process_controls" ADD CONSTRAINT "process_controls_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "process_controls" ADD CONSTRAINT "process_controls_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "process_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "process_non_conformances" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "correctiveAction" TEXT,
    "actionOwner" TEXT,
    "dueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "process_non_conformances_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "process_non_conformances_processId_idx" ON "process_non_conformances"("processId");
ALTER TABLE "process_non_conformances" ADD CONSTRAINT "process_non_conformances_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
