/* Steps inside an Internal Tracker task (§745)

   Islam: "how shall we add sub tasks for the task? … sometimes we have a
   long task and breaking it down would help in planning" → mockup
   design-mockups/internal-tracker/2026-11-03_task-steps.html → "go with B,
   but remove the owner for now. the task already has an owner he shall
   manage the steps".

   A STEP IS A LINE OF THE TASK, not a task: its words, an optional week
   (stored as a day, as the task's own week is), whether and when it was
   ticked, and its place in the task's order. No owner — the task's owner
   manages its steps. Steps go with their task when it is deleted.

   schema.sql runs once (§33.5), so this file carries the table for a
   database already up, IF NOT EXISTS because on a fresh one schema.sql made
   it first; and it fences it, the loop's policy copied, for 011/012's
   reason. Idempotent. */

CREATE TABLE IF NOT EXISTS tracker_steps (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL,
  title text NOT NULL,
  due date,
  done_at timestamptz,
  pos integer NOT NULL DEFAULT 0,
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, action_id) REFERENCES tracker_actions (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT tracker_steps_title CHECK (btrim(title) <> '')
);
CREATE INDEX IF NOT EXISTS tracker_steps_action ON tracker_steps (tenant_id, action_id, pos);
CREATE INDEX IF NOT EXISTS tracker_steps_tenant ON tracker_steps (tenant_id);

ALTER TABLE tracker_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_steps FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tracker_steps'] LOOP
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
