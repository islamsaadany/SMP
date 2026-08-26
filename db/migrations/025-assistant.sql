-- @phase: pre
-- ══ AN ANSWER FROM THE ASSISTANT IS NOT AN ANSWER FROM A PERSON (§104) ══
-- Islam: "when the user asks the bot something the AI can look up the
-- knowledge base first … and if the answer is not there it notifies the user
-- that the SMO will answer directly."
--
-- A message written by the assistant is marked as one, and that is a
-- GOVERNANCE decision rather than a cosmetic one. This product spends a great
-- deal of care on who is authorised to say what: §31 closed a plan to the
-- person measured against it, §94 closed the whole strategy tab to the office.
-- An automated answer wearing the Strategy Office's name would be a colleague's
-- ruling as far as the reader is concerned, and it is not one.
--
-- A COLUMN RATHER THAN A CONVENTION. The alternative was a reserved by_key
-- like "assistant" — which is a person key that could collide with a real
-- person's the day somebody is called that (§87: a name is never an
-- identifier), and which every reader would have to know about. A boolean is
-- read by anything that draws a message, including a reader written later.
--
-- NOT `from_office`. The assistant answers ON BEHALF of the office, so it is
-- from_office TRUE and bot TRUE: the conversation's shape is unchanged (a
-- message is either the person's or the office's), and the mark is a property
-- of HOW the office's side of it was written.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS bot BOOLEAN NOT NULL DEFAULT FALSE;

-- WHICH SECTION THE ANSWER CAME FROM, so a person can go and read the whole
-- thing and a wrong answer is traceable to the paragraph that produced it
-- (spec 016 §5.4). NULL for everything a human wrote, and for an assistant
-- answer that cited nothing.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS source TEXT;
