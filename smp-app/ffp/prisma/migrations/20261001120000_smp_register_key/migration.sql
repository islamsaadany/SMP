-- SMP: a Processes person mirrors one row of the client's People register.
-- The key is that row's register key; a person with none is Processes' own.
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "smpKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "people_workspaceId_smpKey_key" ON "people"("workspaceId", "smpKey");
