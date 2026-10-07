/* Unsaved changes sent to the Strategy Office (§504)

   Islam: "Can't we have a way to avoid the data unsaved error something like
   the data is saved locally until we get back and fix things" — and, of the
   office's side, one list of LINES rather than a version per person: "the
   issue is if everyone saves something their input due to a server error we
   will have a lot of versions."

   A row is ONE line of a save that failed (lib/graph-diff splitLines): a part
   path, or one field of one row. `addr` names what the line changes, never
   who sent it, which is how two people sending the same line are seen as one
   line with two answers. `role` and `view_as` are the sender's as the SERVER
   knew them at send time, because applying a line runs the ordinary save as
   the sender (lib/state-api.ts) and never borrows the office's rights.

   schema.sql runs once (§33.5), so this file carries the table for a
   database already up, IF NOT EXISTS because a fresh one has it already, and
   fences it itself with the loop's own policy (011/012's reason). Idempotent. */

CREATE TABLE IF NOT EXISTS unsaved_lines (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report uuid NOT NULL,
  person_key text NOT NULL,
  person_name text,
  role text NOT NULL DEFAULT '',
  view_as text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  addr text NOT NULL,
  change jsonb NOT NULL,
  base jsonb,
  mine jsonb,
  error text,
  status text NOT NULL DEFAULT 'open',
  done_by text,
  done_at timestamptz,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT unsaved_status CHECK (status IN ('open', 'applied', 'discarded', 'landed'))
);
CREATE INDEX IF NOT EXISTS unsaved_lines_open ON unsaved_lines (tenant_id, status, addr);
CREATE INDEX IF NOT EXISTS unsaved_lines_report ON unsaved_lines (tenant_id, report);

ALTER TABLE unsaved_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsaved_lines FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['unsaved_lines'] LOOP
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
