-- 005 · Clear the weighting values (2026-08-20, Islam's instruction:
--       "Clear the weighting values as well").
--
-- The second half of the clean slate. Migration 004 kept the weighting factors
-- and their values because they were not in the instruction; they were, like
-- everything else in §13, invented — ten units' revenue, profit, impact and
-- growth figures, the written reason beside each, and a 2025 cycle that never
-- happened.
--
-- KEPT
--   · the factor table itself — Revenue contribution, Profit contribution,
--     Impact on group, Potential growth, with their types, their bases and
--     their 40/30/20/10 weights. That is the weighting MODEL, which is
--     configuration; what goes in it is the tenant's to enter.
--   · one row per business unit, so each unit still has somewhere to enter its
--     figures and still receives a composite weight.
--
-- REMOVED
--   · every per-unit factor value
--   · every written reason for an impact judgement
--   · the prior cycle carried for comparison
--
-- With nothing entered, the platform gives every unit an EQUAL weight rather
-- than zero (§21.5): a tenant that has not filled the table has not decided
-- that one unit contributes nothing.

DELETE FROM weighting_values;
UPDATE weighting_rows SET why = NULL, extra = '{}'::jsonb;
DELETE FROM prior_cycle;
