-- 030 · FILL IS A GRANT, AND THE CONSTRAINT NEVER HEARD (§172)
--
-- Islam, three times: "the roles and access are not saving." §171 made the
-- failure visible and the page answered "HTTP 500" — which is what turned a
-- guess into this file.
--
-- §145 (spec 023) gave the two Strategy cells a THIRD state: View / Fill gaps
-- / Edit. `lib/rules.js` has ranked it since that day (`STATE_RANK` reads
-- none 0, view 1, fill 2, edit 3), the matrix draws it, and
-- `db/schema.sql` went on saying:
--
--     CHECK (grant_ IN ('none','view','edit'))
--
-- So the moment anybody granted Fill gaps to a role, the INSERT violated the
-- constraint, `writeState` threw, and /api/state answered 500. And because
-- the whole graph is posted on every save, the refused value stayed on screen
-- and EVERY LATER SAVE FAILED TOO — of any page, not only this one. It reads
-- exactly like "Roles & access never saves", which is how it was reported.
--
-- WHY NOTHING CAUGHT IT. The seed grants no `fill` anywhere, so the round
-- trip, the fixed point and every deploy test wrote only the three old
-- values: §94.2's rule with the sign reversed — a check that exercises only
-- the shipped defaults cannot see a value nobody has set. The screen offered
-- it, the shared rules ranked it, the authoriser allowed it, and the one
-- layer that had to agree was never asked. `scripts/test-roundtrip.js` now
-- writes a `fill` grant and reads it back, so the four values are asserted
-- together and this cannot drift again in silence.
--
-- IDEMPOTENT, and safe on a database that has never seen the old name: the
-- constraint is dropped IF EXISTS and re-added under the name Postgres itself
-- generates, so a fresh deployment (which gets the four-value CHECK straight
-- from schema.sql) and an existing one end in the same state.
--
-- NOTHING IS BACKFILLED. No stored row can be `fill` — that is the whole
-- point, the database refused them all — so widening what is allowed changes
-- no existing grant and moves nobody's access.

ALTER TABLE access_grants DROP CONSTRAINT IF EXISTS access_grants_grant__check;

ALTER TABLE access_grants
  ADD CONSTRAINT access_grants_grant__check
  CHECK (grant_ IN ('none','view','fill','edit'));
