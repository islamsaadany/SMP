/* A PART OWNER MAY READ THEIR OWN UNIT (§516.1 — the frozen stack's 048, per tenant). Islam, of the merged Roles &
   access table's one row that drew "differs" on the shipped defaults: "may
   read ok".

   The Part owner row on the table stands for three stored roles — a project's
   owner, a pillar's owner and a direction's owner — and on a unit's Plan and
   Reporting the project's owner held "no access" while the pillar's owner held
   "may read" (a direction's owner never reaches a unit, so it is not in those
   cells). That is the only reason the table drew them "differs"; nobody chose
   it. So the
   shipped default moves to "may read" (lib/rules.js), and a tenant still
   holding EXACTLY the old "none" on those two cells takes the new default.

   Only that. A tenant whose office has set something else on either cell
   keeps it, because a migration that overwrites a setting somebody chose is a
   migration that lies about being a default (the frozen stack's 011's reason). Written so a
   second run changes nothing. A client made after this
   carries the new default from the shared rules, so it holds nothing to move. */
UPDATE access_grants SET grant_ = 'view'
 WHERE role_key = 'powner'
   AND page_key IN ('a_unit_own_strat', 'a_unit_own')
   AND grant_ = 'none';
