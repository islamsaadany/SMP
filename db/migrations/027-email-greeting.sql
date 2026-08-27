-- @phase: pre
-- ══ THE EMAIL GREETS ITS RECEIVER (spec 021) ═══════════════════════════
-- Islam: "can we make an option while sending the email to customize the
-- email by the first name of the reciever like starting the email with Dear
-- Ahmed ... it's a turn on and off option."
--
-- ONE NULLABLE COLUMN PER TABLE, HOLDING THE WORD. Not a boolean beside a
-- word: a switch that is on with no word is a state nothing in the product
-- allows, and two columns that must agree are two columns that drift
-- (§104.7's rule — take the type from the one value there is).
--
-- NULL IS OFF, so every row that exists today is already correct and no
-- backfill is needed. It is also what the product stores when somebody turns
-- the greeting off, so an untouched message and one switched on and off again
-- are byte-identical (§50.6).
--
-- ON `messages` BECAUSE THE RECORD IS THE RECORD. "What did we send in March"
-- has to be able to answer whether those messages greeted anybody; the record
-- is written before the send (§74) and a fact the send used that the record
-- does not hold is a fact nobody can check afterwards.
--
-- ADD COLUMN IF NOT EXISTS, and it runs pre-phase like the tables it touches
-- (020, 021). §113.7 is the reason to be careful about the other direction:
-- this reads nothing, so it is safe on a fresh database and on an existing
-- tenant alike.

ALTER TABLE messages       ADD COLUMN IF NOT EXISTS greet TEXT;
ALTER TABLE message_drafts ADD COLUMN IF NOT EXISTS greet TEXT;
