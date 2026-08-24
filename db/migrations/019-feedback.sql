-- @phase: pre
--
-- 019 · FEEDBACK FROM WHOEVER IS LOOKING AT THE SCREEN (§71).
--
-- Islam: "some sort of feedback box in the bottom right of the page where the
-- person who is using it, if he finds any issue with a page or a number, can
-- submit an issue or feedback or a request that includes text and an optional
-- screenshot and a title — and this feedback should land in the admin page so
-- we can work on the fixes and enhancements."
--
-- OUTSIDE THE STATE GRAPH, and for the reason credentials, change_log and
-- bu_declarations are: a save TRUNCATEs thirty tables CASCADE, so feedback
-- stored in the graph would be erased by the next autosave — by the very
-- person it was reported to. A foreign key to people(key) would be worse
-- still: CASCADE would take the whole table with it.
--
-- So `person_key` is a plain text column, resolved at read time. A report from
-- somebody since deleted still stands, which is right: the report is about the
-- PRODUCT, and it does not stop being true when its author leaves.
--
-- WHERE IT WAS RAISED IS CAPTURED, NOT TYPED. `page`, `target` and `cycle` are
-- what the screen already knew — nobody should have to describe which page
-- they were on, and a description of it would be wrong more often than the
-- machine's answer. `build` is the platform version, so a report can be read
-- against the thing that was actually on screen.

CREATE TABLE IF NOT EXISTS feedback (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  person_key  text NOT NULL,
  person_name text,
  kind        text NOT NULL DEFAULT 'issue',   -- issue | idea | question
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  -- Captured from the screen, never asked for.
  page        text,
  target      text,
  cycle       text,
  build       text,
  -- new | open | done | parked. Not an enum: a status list that needs a
  -- migration to gain a word is a status list nobody changes (§30.2's shape).
  status      text NOT NULL DEFAULT 'new',
  -- One image, as a data URI, shrunk on the way in (§50's picIntake). One,
  -- deliberately: a cap that is a NUMBER is a cap somebody can reason about,
  -- and the admin page shows the total so it can never surprise anybody.
  shot        text,
  seen_at     timestamptz
);

CREATE INDEX IF NOT EXISTS feedback_at     ON feedback (at DESC);
CREATE INDEX IF NOT EXISTS feedback_status ON feedback (status, at DESC);
CREATE INDEX IF NOT EXISTS feedback_person ON feedback (person_key, at DESC);

-- The conversation on one item (Islam chose a thread over a bare status).
-- ON DELETE CASCADE is safe HERE and only here: the parent is in this same
-- table, outside the graph, and a reply to a deleted report is nothing.
CREATE TABLE IF NOT EXISTS feedback_replies (
  id          bigserial PRIMARY KEY,
  feedback_id bigint NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  at          timestamptz NOT NULL DEFAULT now(),
  person_key  text NOT NULL,
  person_name text,
  body        text NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_replies_parent
  ON feedback_replies (feedback_id, at);
