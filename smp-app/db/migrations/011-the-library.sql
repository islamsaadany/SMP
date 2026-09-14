/* The library — Insights and Processes, one table (spec 053)

   schema.sql runs ONCE and is recorded as `schema` in _migrations, so a
   deployment that has already applied it never sees a table added there
   (§33.5: a fresh-deploy test and an existing-database test see different
   things). This is that table for the database that is already up, and it is
   `IF NOT EXISTS` because on a FRESH database apply.mjs runs schema.sql and
   then every migration IN ONE TRANSACTION — so schema.sql creates it and this
   file meets it (migration 004 found that by applying to an empty database,
   where the whole run rolled back and every new deployment failed to start).

   AND IT SWITCHES ROW-LEVEL SECURITY ON ITSELF, WHICH IS THE OPPOSITE OF WHAT
   MIGRATION 004 DID, FOR THE OPPOSITE REASON. That table is the platform's
   and must have NO tenant policy, so it says nothing and the loop's exclusion
   list answers for it. This one is a CLIENT'S and must have one — and the loop
   at the end of schema.sql is NOT RE-RUN on an existing database, so on the
   deployment that is already up there is nothing else to give it one. Left to
   the loop alone, the table would exist unfenced on production and fenced on
   every fresh database: the two deployments disagreeing, silently, about the
   one thing specs 042 and 043 were built for.

   THE POLICY IS THE LOOP'S OWN TEXT, COPIED, and that is a second spelling of
   one rule (§53.5) — which is why checks/insights.mjs asserts that this
   table's policy expression is IDENTICAL to an existing tenant table's, read
   back from the catalogue rather than compared with typed text (§94.8).
   schema-check.ts checks that a policy named tenant_rows exists and covers
   ALL; it does not read the expression, so nothing else would catch a drift.

   Every statement here is idempotent: run twice it changes nothing. */

CREATE TABLE IF NOT EXISTS library_items (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'insights',
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  report_date date,
  state text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  published_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT library_kind CHECK (kind IN ('insights','processes')),
  CONSTRAINT library_state CHECK (state IN ('draft','published')),
  CONSTRAINT library_title CHECK (btrim(title) <> '')
);

CREATE INDEX IF NOT EXISTS library_items_shelf ON library_items (tenant_id, kind, state, report_date DESC);

-- The name the loop would give it, so the two paths converge on one index
-- rather than leaving a fresh database with two.
CREATE INDEX IF NOT EXISTS library_items_tenant ON library_items (tenant_id);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                 JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = current_schema() AND c.relname = 'library_items'
                   AND p.polname = 'tenant_rows') THEN
    CREATE POLICY tenant_rows ON library_items FOR ALL
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
END $$;
