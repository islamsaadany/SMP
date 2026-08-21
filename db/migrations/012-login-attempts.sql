-- @phase: pre
--
-- 012 · Failed sign-ins, so guessing can be slowed down.
--
-- Before this there was no limit at all: a password could be guessed as fast
-- as the network allowed, and person keys are short and guessable (smo, ceo),
-- so the username half of the guess was free.
--
-- Only FAILURES are recorded, and a successful sign-in clears that key's row —
-- so this table holds nothing about who is using the platform, only about who
-- is failing to. Rows older than the window are pruned on every sign-in, so it
-- stays small without a scheduled job (there is no scheduler here).
--
-- Outside the state graph, like credentials and sessions: a save must not be
-- able to erase the record of an attack on it.
--
-- THE TRADE-OFF, stated rather than buried: a threshold per person key means
-- somebody who knows a key can push that account over the threshold on
-- purpose. That is why the window is short and self-clearing (15 minutes)
-- rather than a lock that has to be lifted by hand — a permanent lockout
-- turns "I know your username" into "I can keep you out indefinitely".

CREATE TABLE IF NOT EXISTS login_attempts (
  id        bigserial PRIMARY KEY,
  at        timestamptz NOT NULL DEFAULT now(),
  key_tried text,
  ip        text
);

CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts (key_tried, at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip  ON login_attempts (ip, at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_at  ON login_attempts (at DESC);
