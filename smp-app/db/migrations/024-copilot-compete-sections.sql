/* Two more Copilot sections (spec 064 §2, §492.1): How we compete, and
   Capabilities when capabilities are their own layer. The section is a CHECK
   on both tables, so a new one is a widened constraint and never only a word
   in the code — a value the database refuses is a save that fails (§172).
   Both named here at once so the Capabilities stage needs no second change.
   Idempotent: dropped and re-made, and on a fresh database schema.sql has
   already made the wider one, which this re-makes identically. */
ALTER TABLE copilot_chats DROP CONSTRAINT IF EXISTS copilot_chat_section;
ALTER TABLE copilot_chats ADD CONSTRAINT copilot_chat_section
  CHECK (section IN ('foundation','analysis','compete','directions','capabilities','execution','advisory'));
ALTER TABLE copilot_deliverables DROP CONSTRAINT IF EXISTS copilot_deliverable_section;
ALTER TABLE copilot_deliverables ADD CONSTRAINT copilot_deliverable_section
  CHECK (section IN ('foundation','analysis','compete','directions','capabilities','execution','advisory'));
