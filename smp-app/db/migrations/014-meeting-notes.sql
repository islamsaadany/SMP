/* Meeting Notes — one meeting, one note, and the minutes as an email (spec 055)

   The two tables for a database already up (schema.sql runs once and is
   recorded, §33.5), IF NOT EXISTS because a fresh database creates them from
   schema.sql first and meets this file in the same transaction (migration
   011's note). AND IT FENCES THEM ITSELF, for 011's reason: the loop at the
   end of schema.sql is not re-run on a database already up, so without these
   lines the tables would be unfenced on production and fenced on every fresh
   one. The policy text is the loop's own, copied; checks/notes.mjs asserts
   the two spellings are IDENTICAL by reading them back (§94.8). Idempotent. */

CREATE TABLE IF NOT EXISTS notes (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  met_on date NOT NULL,
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw text NOT NULL DEFAULT '',
  minutes jsonb,
  refined_at timestamptz,
  refined_by text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS notes_met_on ON notes (tenant_id, met_on DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_tenant ON notes (tenant_id);

CREATE TABLE IF NOT EXISTS note_sends (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  note_id uuid NOT NULL,
  sent_by text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  is_update boolean NOT NULL DEFAULT false,
  subject text NOT NULL DEFAULT '',
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  minutes jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, note_id) REFERENCES notes (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS note_sends_note ON note_sends (tenant_id, note_id, sent_at);
CREATE INDEX IF NOT EXISTS note_sends_tenant ON note_sends (tenant_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;
ALTER TABLE note_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_sends FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['notes', 'note_sends'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                   JOIN pg_namespace n ON n.oid = c.relnamespace
                   WHERE n.nspname = current_schema() AND c.relname = t AND p.polname = 'tenant_rows') THEN
      EXECUTE format(
        'CREATE POLICY tenant_rows ON %I FOR ALL ' ||
        'USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) ' ||
        'WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)', t);
    END IF;
  END LOOP;
END $$;
