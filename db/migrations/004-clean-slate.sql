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
