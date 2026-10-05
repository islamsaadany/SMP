/* The Copilot's sources (spec 064, the SWOT flow, §490)

   Islam, of the SWOT flow: everything brought in — a filled template, a
   ready report, the answer to a deep-research prompt, the guided answers
   themselves — is saved as a SOURCE, and "per client is better": a source
   belongs to the CLIENT, not to the chat it arrived in, so a market report
   brought in for Mobile's SWOT can be picked again for Retail's, or by next
   year's chat. That is the difference from copilot_files (021), which belong
   to their chat and go with it.

   `place` is the unit (or function, or the group) a source is about, or
   'all' for every unit. `kind` says how it came in. `bytes` holds the file
   for a document and is NULL for a source made of text (the guided answers);
   `text` is what was read out of it, for the model. Deleting a source is the
   person who added it or the Super user, asked on the server. */

CREATE TABLE IF NOT EXISTS copilot_sources (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  place text NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  file_kind text,
  size integer NOT NULL DEFAULT 0,
  bytes bytea,
  text text NOT NULL DEFAULT '',
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT copilot_source_kind CHECK (kind IN ('guided','template','report','research')),
  CONSTRAINT copilot_source_file_kind CHECK (file_kind IS NULL OR file_kind IN ('pdf','docx','xlsx')),
  CONSTRAINT copilot_source_size CHECK (size >= 0 AND size <= 3145728),
  CONSTRAINT copilot_source_name CHECK (btrim(name) <> '')
);
CREATE INDEX IF NOT EXISTS copilot_sources_shelf ON copilot_sources (tenant_id, place, at DESC);
CREATE INDEX IF NOT EXISTS copilot_sources_tenant ON copilot_sources (tenant_id);

ALTER TABLE copilot_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_sources FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                 JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = current_schema() AND c.relname = 'copilot_sources' AND p.polname = 'tenant_rows') THEN
    EXECUTE 'CREATE POLICY tenant_rows ON copilot_sources FOR ALL USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)';
  END IF;
END $$;
