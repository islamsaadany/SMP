-- 004 · Clean slate (2026-08-20, Islam's instruction).
--
-- The demo tenant becomes the client's own. What was real stays; everything
-- invented goes. Islam's words: "what's super actual for now are the
-- companies, the business units and the supporting functions."
--
-- KEPT
--   · the company (name and horizon), the ten business units, the supporting
--     functions
--   · the three group themes and the eight capability NAMES with their
--     function ownership — §13 records these as real, drawn from Raya's own
--     Strategy Temple slide; only their content was invented
--   · configuration: labels, scoring bands, levels, the access matrix, the
--     weighting factors and their values (not asked for — say the word)
--   · the SMO account, because it is the account the platform is entered with
--
-- REMOVED
--   · every business unit's plan, foundation and SWOT
--   · the group's foundation — clauses, purpose, core values, key objectives
--   · every capability's definition, key objectives and projects
--   · the reporting cycle, its focus marks and its closed history
--   · the invented people, and the role assignments pointing at them
--   · the example's figure set (added to the seed 2026-08-22)
--
-- Nothing is lost: the full example is still in db/seed-state.json and baked
-- into the platform file, which is what the Demo button shows. Runs once and
-- is recorded, so it can never re-clear a tenant that has real work in it.

-- ── Business unit strategy ──────────────────────────────────────────────
DELETE FROM pillars;                 -- cascades measures and tactics
DELETE FROM unit_key_objectives;
DELETE FROM swot_items;
DELETE FROM unit_clauses;
-- `real` was the flag marking a unit's plan as demo content; with no plan
-- left, every unit is the client's own and nothing should read "illustrative".
-- `perf` in extra held pre-computed scores from before §5.1 — figures are
-- derived on read and must not sit in the database at all.
UPDATE units SET aspiration = '', end_in_mind = '', real = true,
                 extra = extra - 'perf';

-- ── Group foundation ────────────────────────────────────────────────────
DELETE FROM group_clauses;
DELETE FROM group_key_objectives;
-- Core values keep their shape: a tenant that has written none has an empty
-- list, not a missing field — the Foundation page reads it either way.
-- `portfolio`, `themeView` and `themePillars` were pre-computed demo figures
-- nothing renders; `keyObjectivesScore` is now derived on read (§5.1).
UPDATE org SET aspiration = '', end_in_mind = '', mission = '',
               extra = (extra - 'portfolio' - 'themeView' - 'themePillars'
                              - 'keyObjectivesScore') || '{"values":[]}'::jsonb;

-- ── The horizon, unconditionally (§51.20) ──────────────────────────────
-- §16.16 and migration 007 cleared it by MATCHING THE SEEDED VALUE —
-- `WHERE horizon = '2029'` — so it would not overwrite a year a tenant had
-- chosen. That was careful and it was fragile: the day the demo's horizon
-- became 2027 the comparison stopped matching and an invented year sailed
-- through the clean slate into a client's tenant, silently and in the wrong
-- direction. §45.1's family, a fourth time.
--
-- Here it can be unconditional and cannot destroy a choice: 004 runs ONCE, on
-- a first deployment, immediately after the seed — before anybody has opened
-- the product, let alone set a year. 007 stays as it is for tenants already
-- deployed, where a value-matching clear is still the only safe kind.
UPDATE org SET horizon = '';

-- ── Figure sets (§44) ───────────────────────────────────────────────────
-- Sets live in org.extra rather than in a table of their own, so they are the
-- one part of §44 the deletes above cannot reach: `DELETE FROM pillars`
-- clears every `row.src` with the measures that carried it, and would leave a
-- set holding nothing and OWNED BY A PERSON THIS MIGRATION HAS JUST DELETED.
--
-- The worked example gained "Financial Figures" on 2026-08-22 so the
-- Finance-entry behaviour could be seen in demo at all — a feature that
-- renders nothing looks like a feature that was not built. It is invented, and
-- §21 is unambiguous about where invented content may live. `claims` and
-- `naming` go with it: both are answers about sets nobody has made yet.
--
-- Safe to add to a migration already recorded as applied, because the only
-- route into org.extra is the SEED, the seed only runs against an EMPTY
-- database, and this file runs immediately after it. A tenant with real work
-- in it is never seeded and therefore never reaches this line twice.
UPDATE org SET extra = extra - 'sets' - 'claims' - 'naming';

-- ── Capability content (the names and their owning function stay) ───────
DELETE FROM projects;                -- cascades deliverables, outcomes, milestones
DELETE FROM cap_key_objectives;
UPDATE capabilities SET def = '', extra = extra - 'keyObjectives' - 'projects';

-- ── The reporting cycle ─────────────────────────────────────────────────
DELETE FROM history;
DELETE FROM ko_weights;
UPDATE cycle  SET name = '', reward_at = 100, locked = false, focus = '{}';
UPDATE review SET name = '', from_label = '', to_label = '', due_label = '',
                  ends_quarter = 4, state = 'closed', cadence = NULL,
                  notes = '{}', submitted = '{}';

-- ── People ──────────────────────────────────────────────────────────────
DELETE FROM people      WHERE key        <> 'smo';
DELETE FROM credentials WHERE person_key <> 'smo';
DELETE FROM sessions    WHERE person_key <> 'smo';
DELETE FROM unit_roles;
UPDATE functions SET custodian = NULL;
UPDATE functions SET head = NULL WHERE head IS DISTINCT FROM 'smo';

-- ── A FUNCTION'S OWN PILLARS (spec 010) ─────────────────────────────────
-- A function that plans in pillars carries `items` — its pillars, with their
-- measures and tactics — and until state-io writes them into the `pillars`
-- table they ride in `functions.extra`, where the DELETE statements above
-- cannot reach them. So the worked example's Merchandising pillars would have
-- survived the clean slate and arrived in a client's live tenant as their own
-- strategy. §21: NEVER put invented content in the database.
--
-- The same trap §44's figure sets fell into, and for the same reason: the first
-- thing a feature stores somewhere the clean slate was not looking is the thing
-- the clean slate then misses. This line goes when the pillars table owns them.
UPDATE functions SET extra = extra - 'items';
