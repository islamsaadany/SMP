-- @phase: pre
-- ══ THE MESSAGE STOPS CARRYING WHERE SOMEBODY WAS (§99) ════════════════
-- Islam, looking at a real message on the live site: "the line in front of the
-- chat shouldn't be there" — and, asked how far it should go, choosing GONE
-- EVERYWHERE rather than merely hidden from the sender.
--
-- §97.4 captured the page, the subject, the cycle and the build with every
-- message and drew them under the sender's own words. The argument for it was
-- §71's ("where they were is captured, not typed") and it was a good argument;
-- it is simply not the one that won when somebody looked at it on a screen.
--
-- THE COLUMNS GO WITH THE FEATURE, they are not left standing empty. §53.4
-- settled that when a deliverable lost its due date and its owner: a column
-- the platform no longer reads is worse than no column, because the next
-- person to open the table reads it as something that ought to be filled in.
-- Migration 016 dropped four columns for exactly this reason; this is the
-- same act.
--
-- WHAT IS LOST IS NAMED RATHER THAN GLOSSED: any message already sent keeps
-- its words, its picture, its author and its time, and loses the page it was
-- written from. On this deployment that is a handful of messages sent on the
-- day the feature shipped, and the office has not had a cycle in which to use
-- any of them.
ALTER TABLE chat_messages DROP COLUMN IF EXISTS page;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS target;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS cycle;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS build;
