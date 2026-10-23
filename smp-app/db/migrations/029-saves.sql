/* THE SAVE ITSELF, NUMBERED (§585.1). Islam: *"is there a way or a mechanism
   where people save things in the same time without needing a refresh …
   without impacting the speed of the platform?"*

   §585 took other people's changes in without a reload, but found out about
   them through §258's peek — per target, every twenty seconds — and fetched
   the WHOLE graph to do it. This table is the lighter way: every save that
   lands is written here as the change list it carried, with a number in the
   order the save lock let them land, so a tab asks "what changed since N"
   and is answered with the change and nothing else, tenant-wide. A body too
   large to carry (a plan import) or a whole-graph post from an older tab is
   recorded as {"full": true}, which tells the tab to fetch the graph.

   A new tenant table, so the row policy, the forced row-level security and
   the tenant index that schema.sql's closing block gives every table on a
   fresh database are written here for a database that already exists.
   Written so a second run changes nothing. */
CREATE TABLE IF NOT EXISTS saves (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  at timestamptz NOT NULL DEFAULT now(),
  person_key text NOT NULL,
  person_name text,
  changes jsonb NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS saves_since ON saves (tenant_id, id);
CREATE INDEX IF NOT EXISTS saves_tenant ON saves (tenant_id);
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                 JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = current_schema() AND c.relname = 'saves' AND p.polname = 'tenant_rows') THEN
    CREATE POLICY tenant_rows ON saves FOR ALL
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
END $$;
