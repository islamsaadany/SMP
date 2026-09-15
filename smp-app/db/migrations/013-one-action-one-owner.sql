/* One action, one owner (spec 054, §356.11)

   Islam: "no need for the 'with' part for collaborators it's a simple task
   management thing." Nothing in the product reads or writes the column any
   more, and a column the platform no longer reads is worse than no column
   (§53.4): somebody fills it in for nothing. schema.sql no longer creates it
   on a fresh database; this takes it off one already up. Nothing stored is
   lost that anything could still show — every row's collaborators were the
   opened row's own ticks, which are gone with it. Idempotent. */
ALTER TABLE tracker_actions DROP COLUMN IF EXISTS collaborators;
