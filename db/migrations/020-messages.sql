-- @phase: pre
-- ══ WHAT WAS SENT, AND TO WHOM (§74) ═══════════════════════════════════
-- OUTSIDE THE STATE GRAPH, like credentials, change_log, bu_declarations and
-- feedback: a save TRUNCATEs thirty tables CASCADE, and a record a save can
-- erase is not a record. NO FOREIGN KEY to people for the same reason — a
-- person deleted from the register must not take the history of what they were
-- sent with them (§69.23's rule, from the other end).
--
-- The message is stored ONCE and each recipient is a row, because "did Ashraf
-- get it" and "what did we send in March" are different questions and only the
-- second one is about the message.

CREATE TABLE IF NOT EXISTS messages (
  id          BIGSERIAL PRIMARY KEY,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  by_key      TEXT NOT NULL,
  by_name     TEXT,
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  cta_label   TEXT,
  cta_href    TEXT,
  -- The criteria as they were CHOSEN, not the list they resolved to. The list
  -- is in message_recipients; this is what somebody ticked, which is the thing
  -- you want back when a message reached the wrong people.
  audience    JSONB,
  total       INTEGER NOT NULL DEFAULT 0,
  sent        INTEGER NOT NULL DEFAULT 0,
  failed      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS message_recipients (
  id          BIGSERIAL PRIMARY KEY,
  message_id  BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  person_key  TEXT,
  person_name TEXT,
  address     TEXT NOT NULL,
  ok          BOOLEAN NOT NULL DEFAULT FALSE,
  error       TEXT,
  provider_id TEXT
);

CREATE INDEX IF NOT EXISTS message_recipients_msg ON message_recipients (message_id);
CREATE INDEX IF NOT EXISTS messages_sent_at ON messages (sent_at DESC);
