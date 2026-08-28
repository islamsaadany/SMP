-- 006 · The company level (§15.13), ported from Islam's own build.
--
-- A layer between the group and the business unit: a company is a group of
-- business units, and each company has its own CEO. In this version it is
-- VISIBILITY, not strategy — no score, no page — so a company carries only its
-- name and the two flags that decide what its CEO reaches.
--
-- schema.sql creates these for a database built from scratch; CREATE TABLE IF
-- NOT EXISTS skips an existing one, so a tenant already deployed needs the
-- column and the rows added here.
--
-- The two companies and the six assignments are Islam's: he authored them
-- outside and named the companies as real when the clean slate was drawn
-- (§21). If they are not the right companies, change them in Setup → Business
-- units — the platform is where they are edited, not this file.

CREATE TABLE IF NOT EXISTS companies (
  key         text PRIMARY KEY,
  idx         int NOT NULL,
  name        text NOT NULL DEFAULT '',
  ceo         text,
  see_others  boolean NOT NULL DEFAULT false,
  see_group   boolean NOT NULL DEFAULT true
);

-- A unit belongs to a company or is its own — never neither. NULL is the
-- explicit "its own company", which Setup names in words.
ALTER TABLE units ADD COLUMN IF NOT EXISTS company text;

-- GUARDED ON THE TENANT IT WAS WRITTEN FOR (spec 024, 2026-08-28).
-- Distribution and B2C are RAYA's companies. With a schema per client this
-- file runs for every client created from now on, and unguarded it would put
-- one client's companies into another's database (§21: no invented content in
-- a client's database). It applies where Raya's units are and nowhere else;
-- the existing tenant recorded this migration long ago and does not move.
INSERT INTO companies (key, idx, name, ceo, see_others, see_group)
SELECT * FROM (VALUES
  ('distribution', 0, 'Distribution', NULL::text, false, true),
  ('b2c',          1, 'B2C',          NULL::text, false, true)
) AS v(key, idx, name, ceo, see_others, see_group)
WHERE EXISTS (SELECT 1 FROM units WHERE key = 'mobile')
ON CONFLICT (key) DO NOTHING;

UPDATE units SET company = 'distribution' WHERE key IN ('mobile','consumerelectronics','it');
UPDATE units SET company = 'b2c'          WHERE key IN ('retailstores','onlineshop','care');
-- B2B Ecomm, Corporate, Logistics and Nigeria stand alone, which is a decision
-- rather than an omission — they are left NULL deliberately.
