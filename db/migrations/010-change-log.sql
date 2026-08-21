-- @phase: pre
--
-- 010 · The change log (spec 006 §5).
--
-- The diff that AUTHORISES a save is the diff that gets written here, so the
-- log costs nothing extra: the comparison has already been done by the time
-- the row is written. Without it "who moved this target" has no answer, which
-- for a product whose whole job is holding a client's commitments is the one
-- question that must always be answerable.
--
-- Deliberately OUTSIDE the state graph, like credentials and sessions (002):
-- a save wipes and rewrites the tenant's content, and a log that a save can
-- erase is not a log. It is not in ALL_TABLES and is never truncated.
--
-- `rows` carries the before and after for each figure that actually moved.
-- Whole-area changes (the register, the access matrix, the cycle) carry no
-- values — a diff of the people array is not a sentence anybody reads — so
-- for those the `what` IS the record.
--
-- Pre-phase, so it exists before the seed on a fresh deployment and before
-- the first save on one already running.

CREATE TABLE IF NOT EXISTS change_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  person_key  text NOT NULL,
  person_name text,
  kind        text NOT NULL,
  target      text,
  what        text,
  rows_       jsonb
);

CREATE INDEX IF NOT EXISTS change_log_at     ON change_log (at DESC);
CREATE INDEX IF NOT EXISTS change_log_target ON change_log (target, at DESC);
CREATE INDEX IF NOT EXISTS change_log_person ON change_log (person_key, at DESC);
