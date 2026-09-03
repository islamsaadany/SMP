-- 042 · ONE CHASE PER CONVERSATION, NOT ONE PER MESSAGE (§261)
--
-- Islam: "the messages emailed to me from the platform when someone sends to
-- me — when I don't reply it sends an email for each message. It needs to
-- compile some messages rather than an email for each message."
--
-- Both chases had the same shape and the same fault: the decision was made at
-- the moment a message arrived and nothing remembered that it had already been
-- made. Five messages, five emails; three replies to somebody who is away,
-- three emails. These two columns are that memory, and nothing else.
--
-- CLEARED BY THE ANSWER, never by a clock. `chased_at` is wiped when the
-- office replies and `chased_them_at` when the person's own browser polls, so
-- a fresh spell always chases and the quiet period only ever silences a
-- repeat (§261, and lib/rules.js `chatChaseDue` is the one rule).
--
-- NOTHING IS BACKFILLED, deliberately. NULL is "no email has gone out about
-- this spell", which is exactly what an untouched row means for a tenant
-- upgrading: the next message chases once, and every one after it is quiet.
-- A backfill of now() would silence conversations that are waiting today.
--
-- OUTSIDE THE STATE GRAPH, like everything else in chat_threads: a save
-- TRUNCATEs the thirty tables and cannot reach this (§97).

ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS chased_at      TIMESTAMPTZ;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS chased_them_at TIMESTAMPTZ;
