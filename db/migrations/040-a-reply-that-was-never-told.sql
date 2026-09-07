-- ── A REPLY NOBODY WAS EVER TOLD ABOUT (§283) ──────────────────────────
-- The office replies. The platform asks, at that instant, "has this person
-- been on a page in the last few minutes?" — and if the answer is yes, it
-- sends no email, because they are here and they will see it.
--
-- THAT IS A GUESS ABOUT THE FUTURE, AND IT IS WRONG IN ONE DIRECTION. Somebody
-- who was reading a page two minutes ago, then shut their laptop and went to a
-- meeting, counts as present. No email goes out. They come back next week and
-- there is nothing — no email, no notification, nothing at all. §97.5 wrote
-- this edge down when it built the rule ("somebody who shut their laptop
-- thirty seconds ago gets no email") and called a proper sweep a later
-- decision. This is that decision.
--
-- SO THE DECISION MOVES TO WHERE THE FACT IS. Instead of guessing whether they
-- WILL read it, wait and see whether they DID. A reply still unread after the
-- office's chosen wait — 30 minutes, Islam's number — is chased then. Only one
-- case changes: present-and-never-came-back, which today gets nothing, ever.
-- Somebody who was away is still emailed at once, and somebody who reads it is
-- still not emailed at all.
--
-- WHY THE HTML IS KEPT HERE. The email's content is built by the BROWSER, with
-- the one builder every other message in the product uses (§72.3) — the server
-- is handed content and resolves the recipient itself (§74.2). A chase that
-- happens half an hour later has no browser to ask, so the message it would
-- have sent is kept until it is either sent or no longer needed. It is the
-- SAME email, merely later, rather than a second kind of email that would
-- drift from the first (§53.5).
--
-- AND IT IS SHORT-LIVED BY CONSTRUCTION: written only when the send is
-- deferred (somebody away is mailed at once and stores nothing), and cleared
-- the moment it is sent, or the moment they read the reply and it is not
-- needed. Nothing accumulates.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chase_html TEXT;

-- The sweep asks for office messages that are still owed an email. Partial, so
-- it indexes the handful that are actually pending rather than every message
-- ever sent.
CREATE INDEX IF NOT EXISTS chat_messages_chase
  ON chat_messages (at)
  WHERE chase_html IS NOT NULL AND emailed_to IS NULL;
