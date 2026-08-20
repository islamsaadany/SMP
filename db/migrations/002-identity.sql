-- 002 · Identity (v2.1, Phase 1 of the real build).
--
-- Credentials and sessions live OUTSIDE the state graph on purpose: a state
-- save wipes and rewrites the tenant's content, and a password must survive
-- every one of those. Neither table carries a foreign key to people for the
-- same reason — people rows are rewritten on every save; the person_key is a
-- soft reference resolved at read time, and a session whose person no longer
-- exists simply stops resolving.

CREATE TABLE IF NOT EXISTS credentials (
  person_key    text PRIMARY KEY,
  password_hash text NOT NULL,
  must_change   boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  person_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_person ON sessions (person_key);
