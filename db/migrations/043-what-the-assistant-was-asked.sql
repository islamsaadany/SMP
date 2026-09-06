-- ── WHAT THE ASSISTANT WAS ASKED (§299) ────────────────────────────────
-- Islam: "if the SMO asks a question that the assistant can't answer it
-- should be recorded for the future enrichment of the data base, btw that
-- should be the same for the users questions" — and then, of where it is
-- read: "the history of questions needs to be kept somewhere visible by the
-- super user as well, in case of something is not working on the platform or
-- question that repeates that require a fix."
--
-- ONE TABLE, TWO JOBS, AND THAT IS THE WHOLE DESIGN. The office's own Ask box
-- keeps its history here, and the list on the Knowledge base page is the same
-- rows read the other way round — grouped by question rather than by asker.
-- A second store for the history would be a second answer to "what has been
-- asked", and the two would drift the first time either is corrected (§53.5).
--
-- ONLY WHAT THE ASSISTANT ACTUALLY READ. A row is written when the model
-- answered or declined; it is NOT written when the assistant could not be
-- reached at all — no key, a refusal, a timeout, the switch off. Those are a
-- plumbing fault with their own diagnostic (§123), and mixing them in would
-- fill the office's list with rows no answer could ever close (§112.2's rule
-- from the reading side).
--
-- `qkey` IS THE SAME QUESTION, NEVER A SIMILAR ONE. Case, surrounding space
-- and a trailing question mark are one spelling of one string; anything
-- looser is the platform guessing that two questions are the same in front of
-- the office, which was refused when this was drawn. It is stored rather than
-- computed on read so the grouping cannot change under a tenant when the
-- normaliser is touched, and it is indexed because the list groups on it.
--
-- OUTSIDE THE STATE GRAPH, like the chat tables it sits beside: a save clears
-- the thirty tables of the graph and cannot reach this (§97, §288). It is
-- deliberately absent from `ALL_TABLES` in lib/state-io.js.
--
-- NOTHING IS BACKFILLED. Every question asked before today was answered or
-- handed over inside a conversation, which is still there and still readable
-- in the Platform Inbox; inventing rows for them would put questions on the
-- list with no record of what the assistant actually said (§35).

CREATE TABLE IF NOT EXISTS assistant_asks (
  id         BIGSERIAL PRIMARY KEY,
  at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  asker_key  TEXT NOT NULL,
  asker_name TEXT,
  -- WHICH SIDE ASKED, so the list can say so and an answer written from it can
  -- default to the audience that asked (§161.1's office / others / everyone).
  -- Islam: "sometimes the same question gets 2 different answers depending on
  -- their role smo or user."
  office     BOOLEAN NOT NULL DEFAULT FALSE,
  question   TEXT NOT NULL,
  qkey       TEXT NOT NULL,
  -- What the assistant said, kept for the answered rows: the list shows it, so
  -- the office can see whether a question that keeps coming back is being
  -- answered badly rather than not at all.
  answer     TEXT,
  answered   BOOLEAN NOT NULL DEFAULT FALSE,
  -- WHICH KNOWLEDGE BASE ENTRY IT ANSWERED FROM, when it answered. It is what
  -- lets an answered row on the list open the answer rather than offer to write
  -- a second one beside it — a question the assistant answered already HAS an
  -- entry, and a list that offered to add another would be manufacturing the
  -- duplicates §87 spends its length refusing.
  source     TEXT
);

CREATE INDEX IF NOT EXISTS assistant_asks_at_idx    ON assistant_asks (at DESC);
CREATE INDEX IF NOT EXISTS assistant_asks_qkey_idx  ON assistant_asks (qkey);
CREATE INDEX IF NOT EXISTS assistant_asks_asker_idx ON assistant_asks (asker_key, at);
