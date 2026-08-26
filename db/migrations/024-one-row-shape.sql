-- @phase: pre
--
-- ONE ROW SHAPE (§101).
--
-- A deliverable is reported the way a milestone is: Not started / In progress
-- with a per-cent / Delivered. So `kind` -- the plan's choice between
-- "delivered or not" and "a percentage" -- has nothing left to decide, and
-- `actual`, which held "yes"/"no" on one kind and a number on the other, has
-- nothing left to hold.
--
-- AND A DUE DATE COMES BACK, reversing migration 016. That one dropped it on
-- the argument, Islam's own, that "it's delivered when the project ends".
-- Some deliverables land before the project ends, which is simply more true
-- of real plans, so the column returns. Its OWNER does not: the project's
-- owner owns it, which 016 got right.
--
-- NOBODY'S SCORE MOVES. The mapping below is score-preserving by
-- construction: what read 100 reads 100, what read 0 reads 0, and a
-- percentage in between becomes In progress at exactly that figure.
--
--   kind=binary, actual='yes'  -> status='done'            100 -> 100
--   kind=binary, actual='no'   -> status='todo'              0 ->   0
--   kind=pct,    actual=100    -> status='done'            100 -> 100
--   kind=pct,    actual=0      -> status='todo'              0 ->   0
--   kind=pct,    actual=57     -> status='wip', pct=57      57 ->  57
--   nothing reported           -> status=NULL         nothing -> nothing
--
-- The old `actual` rode in `extra` rather than in the text column beside it
-- (see the note this replaces in schema.sql), so BOTH are read -- the column
-- for any tenant that ever wrote it, the jsonb for every tenant that did.
--
-- @phase: pre, because a schema change has to be in place before the seed
-- writes rows against it (§33.5).

ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS due    text;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS pct    numeric;
ALTER TABLE milestones   ADD COLUMN IF NOT EXISTS pct    numeric;

UPDATE deliverables SET status = CASE
    WHEN COALESCE(actual, extra->>'actual') IS NULL
      OR COALESCE(actual, extra->>'actual') = ''            THEN NULL
    WHEN lower(COALESCE(actual, extra->>'actual')) = 'yes'  THEN 'done'
    WHEN lower(COALESCE(actual, extra->>'actual')) = 'no'   THEN 'todo'
    WHEN COALESCE(actual, extra->>'actual') ~ '^[0-9.]+$'
     AND COALESCE(actual, extra->>'actual')::numeric >= 100 THEN 'done'
    WHEN COALESCE(actual, extra->>'actual') ~ '^[0-9.]+$'
     AND COALESCE(actual, extra->>'actual')::numeric <= 0   THEN 'todo'
    WHEN COALESCE(actual, extra->>'actual') ~ '^[0-9.]+$'   THEN 'wip'
    ELSE NULL END
  WHERE status IS NULL;

UPDATE deliverables SET pct = COALESCE(actual, extra->>'actual')::numeric
  WHERE status = 'wip' AND pct IS NULL
    AND COALESCE(actual, extra->>'actual') ~ '^[0-9.]+$';

-- The old keys go from `extra` too, or state-io reads them straight back out
-- and the round trip stops being a fixed point.
UPDATE deliverables SET extra = (extra - 'actual' - 'kind') WHERE extra ? 'actual' OR extra ? 'kind';

ALTER TABLE deliverables DROP COLUMN IF EXISTS kind;
ALTER TABLE deliverables DROP COLUMN IF EXISTS actual;
