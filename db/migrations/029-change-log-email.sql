-- @phase: pre
-- 029 · The change log records WHO SIGNED IN, not only which row they are.
--
-- Islam, on the multi-client platform: "isn't the action on raya's can be
-- recorded by the email the account connect to the person?" — and he is right,
-- and it corrects something I had stated as a cost.
--
-- Several of Forefront's people may act as ONE row on a client's register
-- (spec 030 §288.30): on Raya Trade, `smo` is Mohamed Essam, and the other
-- consultants work as that same person rather than being added to the client's
-- register as new people. Without this column the log says `smo` for all of
-- them and the client cannot tell who did what — which would be a real cost of
-- sharing a row, and is not: the session already knows the address, it simply
-- was not written down.
--
-- NULLABLE, and nothing is backfilled: rows written before today were written
-- by somebody who WAS that person, so an address invented for them now would
-- be a fact nobody established.
ALTER TABLE change_log ADD COLUMN IF NOT EXISTS email text;
CREATE INDEX IF NOT EXISTS change_log_email ON change_log (email, at DESC);
