/* The Internal Tracker's progress, and a fuller history (spec 054, §657)

   Islam: "we need to have a progress input box per task so we input what
   happened in this task on weekly basis", and the task's own history of
   "creation and movement etc." opened in a different way. Two things here:

   PROGRESS IS A TABLE OF ITS OWN, not a kind of event: an entry is what a
   person WROTE at a review and may be edited or deleted by its writer, while
   tracker_events is appended and never edited (§42) — one table that is
   both would be neither. One row per entry: the action, the words, who and
   when, and when it was last edited (NULL until it is). An action's entries
   go with it when it is deleted.

   THE HISTORY SAYS MORE: a carry to another week, a hand-over, a rename and
   a move to another topic are movements the history did not record. The
   kind check widens and a `detail` column carries what it was and what it
   became, as the status columns already do for a status change.

   schema.sql runs once (§33.5), so this file carries both for a database
   already up, IF NOT EXISTS because on a fresh one schema.sql made them
   first; and it fences the new table itself, the loop's policy copied, for
   011/012's reason. Idempotent. */

CREATE TABLE IF NOT EXISTS tracker_progress (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL,
  body text NOT NULL,
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, action_id) REFERENCES tracker_actions (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT tracker_progress_body CHECK (btrim(body) <> '')
);
CREATE INDEX IF NOT EXISTS tracker_progress_action ON tracker_progress (tenant_id, action_id, at);
CREATE INDEX IF NOT EXISTS tracker_progress_tenant ON tracker_progress (tenant_id);

ALTER TABLE tracker_events ADD COLUMN IF NOT EXISTS detail jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tracker_events DROP CONSTRAINT IF EXISTS tracker_event_kind;
ALTER TABLE tracker_events ADD CONSTRAINT tracker_event_kind CHECK (kind IN ('created','status','due','owner','title','topic'));

ALTER TABLE tracker_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_progress FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tracker_progress'] LOOP
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
