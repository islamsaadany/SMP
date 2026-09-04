-- 034 · A LINE THE PLATFORM CAN NAME (§191)
--
-- Found while chasing a refusal that was itself correct. The authoriser matches
-- plan rows BY ID to work out what changed; `byId()` drops a row that has none
-- — rightly, since two rows sharing `undefined` are not one row — and the loops
-- that walk those maps then found nothing to classify. Nothing classified reads
-- as "no change", and no change is allowed.
--
-- Measured before the guard was written: with the ids stripped, a VIEW-ONLY
-- unit head could rewrite a key objective, a pillar, a measure, a tactic and a
-- project's front matter, and every one of those saves was accepted. With the
-- ids present all of them are refused. `lib/authorize.js` now fails closed —
-- a list it cannot match row to row is judged as a whole and is the office's.
--
-- WHICH LEAVES ONE LIST IN THE PRODUCT THAT CANNOT BE NAMED, and it is the
-- group's own key objectives. §96.4 recorded this and deliberately left it:
-- only rows ADDED were ever given an id, so the shipped six carried none, and
-- a list where one row is identified and six are not is worse than either
-- state. Nothing had needed the ids until now.
--
-- NOBODY COULD EVER EXPLOIT THOSE SIX — the group's own strategy is refused
-- wholesale by a different rule, whatever the ids say — so this is not
-- repairing a hole. It is removing the one list the new guard would have had
-- to refuse for everybody but the office, and giving a cycle snapshot and an
-- archive six rows they can tell apart (§48: a snapshot is keyed by id, never
-- by position, and six rows keyed `null` are six rows it cannot separate).
--
-- THE SPELLING IS THE PRODUCT'S OWN. `koSettle()` in `group-render.js` has
-- minted `group-KO<n>` for every group objective added since it was written,
-- so this is the same convention rather than a second one beside it (§53.5).
-- The seed carries them from this version; this is for a tenant already
-- deployed.
--
-- IDEMPOTENT, AND IT FILLS ONLY BLANKS. A row that already holds an id keeps
-- it, untouched — an id already written is what a reported figure, a focus
-- mark and a cycle snapshot are keyed on (§48.1), and rewriting one orphans
-- all three.
--
-- AND THE NUMBERING CONTINUES PAST WHAT IS ALREADY THERE, rather than counting
-- from the row's position. The first draft numbered from `idx`, and on a
-- tenant that had already had a row added by hand it minted a name that row
-- was holding — a duplicate, which the new guard treats exactly like a missing
-- id, so the list would have stayed refused for everybody but the office and
-- the migration would have caused the very thing it exists to remove. Measured
-- on a real Postgres 16 before this was rewritten.
--
-- `koSettle()` in group-render.js reads the highest `-KO<n>` and counts on
-- from it, which is precisely what this does — the same convention, not a
-- second one beside it (§53.5). On the ordinary case (every id blank) the
-- highest is nothing, so the six land on group-KO1..group-KO6, which is what
-- the seed carries.

UPDATE group_key_objectives t
   SET id = 'group-KO' || (
         COALESCE((SELECT MAX((regexp_match(b.id, '-KO([0-9]+)$'))[1]::int)
                     FROM group_key_objectives b
                    WHERE b.id ~ '-KO[0-9]+$'), 0)
         + (SELECT count(*) FROM group_key_objectives c
             WHERE (c.id IS NULL OR c.id = '') AND c.idx <= t.idx))
 WHERE t.id IS NULL OR t.id = '';
