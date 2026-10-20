-- "I have read version N": one row per person per version. New table only.
CREATE TABLE IF NOT EXISTS "process_acknowledgements" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "personKey" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "process_acknowledgements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "process_acknowledgements_processId_versionNumber_personKey_key" ON "process_acknowledgements"("processId", "versionNumber", "personKey");
CREATE INDEX IF NOT EXISTS "process_acknowledgements_processId_versionNumber_idx" ON "process_acknowledgements"("processId", "versionNumber");
ALTER TABLE "process_acknowledgements" ADD CONSTRAINT "process_acknowledgements_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
