-- @phase: pre
-- 014 · A company gets a life, and an archive can hold figures (§49.3, §49.1).
--
-- @phase MUST be the first line — migrationPhase() reads only line one, and a
-- marker further down silently makes the file `post`, which for a shape change
-- means the seed writes into columns that are not there yet. Numbered 014
-- rather than 013: 013 is already taken in the registry by the JS step that
-- retires the simple password.
--
-- Companies arrived in 006 as two rows and two flags each, and the platform
-- offered no way to make a third, rename one, or take one out of use. Every
-- other Setup table — units, functions, people — has had all three since 1.7.
--
-- Retired, never deleted, and for the same reason a unit is: a company key is
-- written into every company CEO's role as `co:<key>` and into `units.company`,
-- so a deleted row leaves a pointer at nothing. The platform refuses to retire
-- a company while any unit still belongs to it.
--
-- schema.sql gains the column for a database built from scratch; a tenant
-- already deployed needs it added here.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- ── A cycle's figures are archived before they are cleared (§49.1) ──────
-- Opening a new cycle used to carry last period's actuals, progress marks,
-- tactic statuses and notes straight over, so every unit read "reported" the
-- moment it opened. It clears them now — and archives them first, because
-- `history` keeps a SCORE per unit and never the raw figures, so a clear with
-- nothing behind it would destroy the closed cycle's numbers.
--
-- Its own column rather than reusing `plan`: a plan archive holds no figures
-- and a figures archive holds no plan, and one column carrying either
-- depending on `kind` is a lie the next reader has to discover.
ALTER TABLE plan_archives ADD COLUMN IF NOT EXISTS figures jsonb;
ALTER TABLE plan_archives ALTER COLUMN plan DROP NOT NULL;
