-- @phase: pre
-- ══ TALKING TO THE STRATEGY OFFICE (§97) ═══════════════════════════════
-- Islam: "can we have some sort of a chat but on the platform where on the
-- bottom right they have this … they open the chat and they send a message
-- there and they have a conversation with one of our team … so it sounds like
-- a chat, people chatting, sending messages, and picks the people and replies
-- to them."
--
-- OUTSIDE THE STATE GRAPH, like credentials, change_log, bu_declarations and
-- login_attempts: a save TRUNCATEs thirty tables CASCADE, and a message a save
-- can erase is not a message. NO FOREIGN KEY to people, for the same reason —
-- a person removed from the register must not take the conversation with them
-- (§69.23's rule, from the other end). person_key is plain text, resolved at
-- read time.
--
-- ONE CONVERSATION PER PERSON, AND THAT IS WHY person_key IS THE KEY. It is an
-- invariant rather than a rule somebody remembers to check (§44's "one figure,
-- one set", the same shape). The moment a person has to decide whether what
-- they are about to type is a new item or the same one, it has stopped being a
-- chat — so they never decide it, and the office does its sorting on its own
-- side by FLAGGING individual messages.

-- ── §71's FEEDBACK TABLES GO, AND THIS IS THE ONE DESTRUCTIVE LINE HERE ──
--    §71 built the tables, the endpoint and the rules for a feedback box in
--    the bottom-right corner. THE BOX WAS NEVER DRAWN — the client half was
--    never built, so no human has ever been able to raise a feedback item, and
--    these two tables cannot hold a row in any deployment. Islam chose one box
--    over two (2026-08-25), so what stands here is that box, reshaped from a
--    form into a conversation.
--
--    They are DROPPED rather than left standing, because two unreachable
--    tables behind an unreachable endpoint are exactly what the next person
--    reads as load-bearing (§24). Dropping empty tables is not the destruction
--    mayDestroy() guards — there is nothing in them to destroy.
--    019-feedback.sql STAYS WHERE IT IS. A fresh database creates those two
--    tables and drops them again a moment later, which costs nothing and is
--    the honest record: every deployment already in the world ran 019, and a
--    migration directory that disagrees with `_sql_migrations` about what was
--    applied is the confusion this project keeps writing rules about.
DROP TABLE IF EXISTS feedback_replies;
DROP TABLE IF EXISTS feedback;

CREATE TABLE IF NOT EXISTS chat_threads (
  person_key   TEXT PRIMARY KEY,
  person_name  TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- WAITING ON US, OR ANSWERED. Two groups and no invented statuses: it goes
  -- true when the person writes and false when the office answers, so nobody
  -- has to remember to set it — which is the status nobody sets (§71).
  waiting      BOOLEAN NOT NULL DEFAULT TRUE,
  -- Read marks, one per side. What they drive is a count of UNREAD REPLIES on
  -- the bubble; there is no read receipt shown to anybody.
  seen_by_them TIMESTAMPTZ,
  seen_by_us   TIMESTAMPTZ,
  -- WHEN THIS PERSON'S BROWSER LAST ASKED. This is the whole of the presence
  -- test behind "email only if they are away" — their own polling says it, and
  -- there is no scheduler on Vercel to say it any other way (§97.5).
  here_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  -- WHOSE conversation this belongs to, which is not who wrote it.
  person_key  TEXT NOT NULL REFERENCES chat_threads(person_key) ON DELETE CASCADE,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  from_office BOOLEAN NOT NULL DEFAULT FALSE,
  -- WHO WROTE IT, stored as it was at the time. A reply is signed by a name
  -- (§97.3) and a name read back through the register would change under a
  -- rename or vanish under a delete — the person who answered still answered.
  by_key      TEXT NOT NULL,
  by_name     TEXT,
  body        TEXT NOT NULL,
  -- WHERE THEY WERE was captured here (§97.4) and is gone (§99). Not left as
  -- four empty columns: 023 drops them on a database that already has them,
  -- and they are absent here so a fresh one never grows them at all.
  -- One shrunk screenshot, as a data URI. §71's handling exactly.
  shot        TEXT,
  -- THE OFFICE'S OWN CLASSIFICATION, and only the office's — this is where
  -- §71's issue / idea / question went. Nobody should have to classify their
  -- own question before they are allowed to ask it.
  flag        TEXT
);

CREATE INDEX IF NOT EXISTS chat_threads_waiting ON chat_threads (waiting, last_at DESC);
CREATE INDEX IF NOT EXISTS chat_threads_last    ON chat_threads (last_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_thread ON chat_messages (person_key, at);
CREATE INDEX IF NOT EXISTS chat_messages_flag   ON chat_messages (flag, at DESC) WHERE flag IS NOT NULL;
