/* The strategy frameworks library (spec 052)

   schema.sql runs ONCE and is recorded as `schema`, so a deployment already
   up never sees a table added there (§33.5). This is that table for the
   database that is already running.

   NO RLS STATEMENTS, for migration 004's reason word for word: on an existing
   database the loop at the end of schema.sql is not re-run, which is the
   outcome wanted, and a migration switching row-level security on would be a
   SECOND answer to what the exclusion list already answers (§53.5).

   `IF NOT EXISTS` BECAUSE OF THE OTHER PATH, which 004 learned by applying to
   an empty database rather than by reasoning: on a FRESH one apply.mjs runs
   schema.sql and every migration IN ONE TRANSACTION, so schema.sql creates
   this table and the migration then meets it — 42P07, the whole run rolled
   back, and every new deployment failing to start.

   The column comments live in schema.sql, which is the source. */
CREATE TABLE IF NOT EXISTS frameworks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text NOT NULL UNIQUE,
  idx                  integer NOT NULL DEFAULT 0,
  name                 text NOT NULL,
  section              text NOT NULL,
  purpose              text NOT NULL DEFAULT '',
  key_questions        text NOT NULL DEFAULT '',
  when_to_use          text NOT NULL DEFAULT '',
  when_not_to_use      text NOT NULL DEFAULT '',
  inputs_required      text NOT NULL DEFAULT '',
  outputs              text NOT NULL DEFAULT '',
  executive_example    text NOT NULL DEFAULT '',
  consultant_use_case  text NOT NULL DEFAULT '',
  facilitation_tips    text NOT NULL DEFAULT '',
  added_by             uuid NULL REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT frameworks_name CHECK (btrim(name) <> '')
);
CREATE INDEX IF NOT EXISTS frameworks_section ON frameworks (idx);
