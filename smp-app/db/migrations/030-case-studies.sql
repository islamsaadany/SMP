/* Case studies (spec 067)

   schema.sql runs once and is recorded, so a database already up never sees
   what was added there (§33.5). This is the same three changes for that
   database: the case studies table, the insight's link to its piece of work,
   and the past-client flag on a tenant.

   EVERY STATEMENT IS `IF NOT EXISTS`, for the reason 004 found by running it:
   on a FRESH database apply.mjs runs schema.sql and then every migration in
   one transaction, so schema.sql has already made all three and this must be
   a no-op there. On the database that is already up it is the whole change.

   NO ROW-LEVEL SECURITY HERE, for 004's reason: schema.sql answers that by
   leaving `case_studies` off its loop (it is on the exclusion list), and the
   database that is already up is never asked — the two paths agree. Why the
   table is shaped as it is, is written beside it in schema.sql. */

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS past boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS case_studies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  name            text NOT NULL,
  started         text NOT NULL DEFAULT '',
  ended           text NOT NULL DEFAULT '',
  state           text NOT NULL DEFAULT 'running',
  opened_by       uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  writer_id       uuid REFERENCES users (id) ON DELETE RESTRICT,
  asked_by        uuid REFERENCES users (id) ON DELETE SET NULL,
  due             date,
  in_short        text NOT NULL DEFAULT '',
  client_why      text NOT NULL DEFAULT '',
  asked_to_do     text NOT NULL DEFAULT '',
  came_of_it      text NOT NULL DEFAULT '',
  our_team        jsonb NOT NULL DEFAULT '[]'::jsonb,
  their_team      jsonb NOT NULL DEFAULT '[]'::jsonb,
  stages          jsonb NOT NULL DEFAULT '[]'::jsonb,
  deliverables    jsonb NOT NULL DEFAULT '[]'::jsonb,
  who_to_ask      jsonb NOT NULL DEFAULT '[]'::jsonb,
  done_at         timestamptz,
  done_by         uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_state CHECK (state IN ('running','writing','done')),
  CONSTRAINT case_name CHECK (btrim(name) <> ''),
  CONSTRAINT case_writing_has_writer CHECK (state = 'running' OR writer_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS case_about ON case_studies (about_tenant_id);
CREATE INDEX IF NOT EXISTS case_writer ON case_studies (writer_id) WHERE state = 'writing';

ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES case_studies (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS memory_case ON memory_entries (case_id);
