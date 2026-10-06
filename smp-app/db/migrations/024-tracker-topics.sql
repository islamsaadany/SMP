/* The Internal Tracker's topics (spec 054, §492)

   Islam: "sometimes we have a general topic that is already continuing with
   us on the tasks over the weeks like the Budget or strategy Communication
   etc. and we can group by them." His three answers: an action belongs to ONE
   topic, a closed topic is still shown while it holds open actions, and
   anybody in the office may create one.

   A topic is a row of its own rather than a word typed on each action, so a
   rename reaches every action under it (§48) and two spellings of "Budget"
   cannot become two topics — a name is unique per client, ignoring case.

   schema.sql runs once (§33.5), so this file carries the table and the column
   for a database already up, IF NOT EXISTS because on a fresh one schema.sql
   made them first; and it fences the table itself, the loop's policy copied,
   for 011/012's reason. Deleting a topic first takes it off its actions
   (lib/tracker.ts deleteTopic) — the foreign key deliberately has no ON
   DELETE, so a topic still named by an action cannot vanish under it.
   Idempotent. */

CREATE TABLE IF NOT EXISTS tracker_topics (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  closed_at timestamptz,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT tracker_topic_name CHECK (btrim(name) <> '')
);
CREATE UNIQUE INDEX IF NOT EXISTS tracker_topics_name ON tracker_topics (tenant_id, lower(name));

ALTER TABLE tracker_actions ADD COLUMN IF NOT EXISTS topic_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tracker_actions_topic') THEN
    ALTER TABLE tracker_actions ADD CONSTRAINT tracker_actions_topic
      FOREIGN KEY (tenant_id, topic_id) REFERENCES tracker_topics (tenant_id, id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS tracker_actions_topic_ix ON tracker_actions (tenant_id, topic_id);
CREATE INDEX IF NOT EXISTS tracker_topics_tenant ON tracker_topics (tenant_id);

ALTER TABLE tracker_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_topics FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tracker_topics'] LOOP
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
