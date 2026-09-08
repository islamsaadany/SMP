-- ── BOTH HALVES OF THE HISTORY (§303) ─────────────────────────────────
-- Islam, asked to align on what the questions history is: "my understand is
-- the history of questions is about what has been asked, answered through the
-- bot or throu the smo team to have an overview of the questoins and answers"
-- — and then, of how the office's half is gathered: "the smo doesn't mark
-- anything the list is collected and then later is verified ... you can't mark
-- what is answered and not this is only viable in case of the bot."
--
-- ONE TABLE, TWO READINGS, WHICH IS §299'S OWN ARGUMENT UNCHANGED. A second
-- store for what the office answered would be a second answer to "what has
-- been asked", and the two would drift the first time either was corrected
-- (§53.5). It is also what makes his reason work: the point of keeping them
-- apart is to compare them later, and a comparison across two tables is a join
-- somebody has to remember to write.
--
-- `answered_by` IS WHO ANSWERED, NOT WHO ASKED. Which side ASKED has been on
-- this row since §299 (`office`), and it is a different fact: a question a
-- user asked and the office answered by hand is `office = false,
-- answered_by = 'office'`. Defaulting to 'assistant' is correct for every row
-- already stored, because until today nothing else could write one.
ALTER TABLE assistant_asks
  ADD COLUMN IF NOT EXISTS answered_by TEXT NOT NULL DEFAULT 'assistant';

-- `reached` REVERSES §299'S OWN REFUSAL, AT ISLAM'S WORD. That section
-- deliberately wrote no row when the assistant could not be reached at all —
-- no key, a refusal, a timeout — on the reasoning that it would fill the
-- office's list with rows no answer can close. It is recorded as a reversal
-- rather than overwritten (Principle II), and the reason he is right is his
-- own case: he asked a question, nothing came back, and NOTHING ANYWHERE said
-- it had happened. A question that vanished is exactly the thing a history is
-- for.
--
-- WHAT KEEPS §299'S POINT INTACT is that such a row is not a gap in the
-- corpus and must never be counted as one: it joins no unanswered filter and
-- offers no answer to write, because nothing was ever asked of the knowledge
-- base. It points at the diagnostic instead (§123).
--
-- TRUE for every row already stored, and that is not merely a convenient
-- default — §299 wrote a row ONLY when the model had read the question, so
-- every existing row was reached by construction. Nothing is backfilled and
-- nothing needs to be.
ALTER TABLE assistant_asks
  ADD COLUMN IF NOT EXISTS reached BOOLEAN NOT NULL DEFAULT TRUE;

-- The list groups per side, so the read is (answered_by, qkey) within a
-- window. `at DESC` leads because the window is what narrows it first.
CREATE INDEX IF NOT EXISTS assistant_asks_side_idx
  ON assistant_asks (answered_by, at DESC);
