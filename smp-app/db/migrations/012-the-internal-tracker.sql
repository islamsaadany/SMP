/* The Internal Tracker — the office's weekly list, per client (spec 054)

   schema.sql runs ONCE and is recorded, so a deployment already up never sees
   a table added there (§33.5); this is the two tables for that database, and
   IF NOT EXISTS because on a FRESH one schema.sql creates them first and this
   file meets them in the same transaction (migration 011's own note).

   AND IT FENCES THEM ITSELF, for the reason 011 gives: the loop at the end of
   schema.sql is not re-run on a database that is already up, so without these
   lines the tables would exist unfenced on production and fenced on every
   fresh database. The policy text is the loop's own, copied, and
   checks/tracker.mjs asserts the two spellings are IDENTICAL by reading them
   back from the catalogue (§94.8). Every statement is idempotent. */

CREATE TABLE IF NOT EXISTS tracker_actions (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  owner_key text NOT NULL,
  collaborators jsonb NOT NULL DEFAULT '[]'::jsonb,
  due date,
  first_due date,
  status text NOT NULL DEFAULT 'not_started',
  done_at timestamptz,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT tracker_status CHECK (status IN ('not_started','in_progress','done')),
  CONSTRAINT tracker_title CHECK (btrim(title) <> '')
);
CREATE INDEX IF NOT EXISTS tracker_actions_week ON tracker_actions (tenant_id, status, due);
CREATE INDEX IF NOT EXISTS tracker_actions_tenant ON tracker_actions (tenant_id);

CREATE TABLE IF NOT EXISTS tracker_events (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  action_id uuid NOT NULL,
  kind text NOT NULL,
  from_status text,
  to_status text,
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, action_id) REFERENCES tracker_actions (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT tracker_event_kind CHECK (kind IN ('created','status'))
);
CREATE INDEX IF NOT EXISTS tracker_events_action ON tracker_events (tenant_id, action_id, at);
CREATE INDEX IF NOT EXISTS tracker_events_tenant ON tracker_events (tenant_id);

ALTER TABLE tracker_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_actions FORCE ROW LEVEL SECURITY;
ALTER TABLE tracker_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_events FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tracker_actions', 'tracker_events'] LOOP
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
