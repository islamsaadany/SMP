-- @phase: pre
--
-- 011 · Contributors view rather than edit (spec 006 §7.2).
--
-- Islam: "contributors only view, and if we allow them they should be allowed
-- to their lines only." The second half is a rule with teeth in lib/rules.js
-- and cannot be turned off; this is the first half — the SHIPPED DEFAULT for a
-- contributor's own unit moves from edit to view.
--
-- Only where the tenant still holds the old default. A stored 'none' is a
-- deliberate denial and stays; a tenant whose SMO has already chosen something
-- for this cell keeps their choice, because a migration that overwrites a
-- setting somebody made is a migration that lies about being a default.
--
-- Pre-phase, and it makes no difference which: on a FRESH deployment the table
-- is empty when this runs and the seed then writes 'view' from seed-state.json
-- anyway; on a tenant already running, the seed does not run at all and this is
-- the only thing that moves the row. Stated because "pre or post" is the
-- question §33.5 was written about, and the answer here is "neither matters",
-- which is worth recording rather than leaving somebody to re-derive.

UPDATE access_grants SET grant_ = 'view'
 WHERE role_key = 'contrib' AND page_key = 'a_unit_own' AND grant_ = 'edit';
