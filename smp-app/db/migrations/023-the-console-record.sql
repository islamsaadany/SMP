/* WHAT FOREFRONT HAS DONE IN ITS OWN CONSOLE (§487, audit fix 04).

   `tenant_log` has been here since the rebuild and has never had a row
   written by anything in the product — its only readers are two checks
   counting rows as a control. This gives it the three columns a RECORD needs
   and nothing else; schema.sql is the source and carries the reasoning.

   THE NAMES ARE STORED ON THE ROW, AND THAT IS THE WHOLE MIGRATION. Both
   foreign keys are ON DELETE SET NULL, and *deleting a client* and *removing
   a consultant* are two of the acts recorded — so a row that read its
   subject through a join would lose exactly the two acts most worth keeping
   (§49.2: a record somebody tidied is no longer the record).

   No RLS statements: the table names no client of its own (schema.sql's
   exclusion list, lib/schema-check.ts PLATFORM_TABLES — the two kept equal
   by checks/memory-boundary.mjs). */
ALTER TABLE tenant_log ADD COLUMN IF NOT EXISTS who_name    text NOT NULL DEFAULT '';
ALTER TABLE tenant_log ADD COLUMN IF NOT EXISTS tenant_name text NOT NULL DEFAULT '';
ALTER TABLE tenant_log ADD COLUMN IF NOT EXISTS detail      text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS tenant_log_at ON tenant_log (at DESC);
