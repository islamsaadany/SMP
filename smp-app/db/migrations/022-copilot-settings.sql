/* The Copilot's own settings (§456, spec 064) — a platform table, the same
   for every client. schema.sql is the source and carries the comments; this
   is the table for a database already running (009's reason, and IF NOT
   EXISTS for 009's other reason: on a fresh one schema.sql has just made it).
   No RLS statements: the table names no client (schema.sql's exclusion list,
   lib/schema-check.ts PLATFORM_TABLES — the two kept equal by
   checks/memory-boundary.mjs). */
CREATE TABLE IF NOT EXISTS copilot_assets (
  key         text PRIMARY KEY,
  text        text NOT NULL DEFAULT '',
  name        text NOT NULL DEFAULT '',
  bytes       bytea,
  updated_by  uuid NULL REFERENCES users (id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT copilot_asset_key CHECK (key ~ '^(part([1-9]|1[0-4])|t[1-5])$'),
  CONSTRAINT copilot_asset_size CHECK (bytes IS NULL OR octet_length(bytes) <= 3145728)
);
