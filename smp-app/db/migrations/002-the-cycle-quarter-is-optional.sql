/* OPENING A NEW CYCLE COULD NOT BE SAVED (§316.3)

   The same correction as the frozen stack's 044, for a shared-schema
   deployment whose `review` table was created before it. Pressing "Open a
   new cycle" mints a review carrying no `endsQuarter` — §307 took the review
   point off that panel — and the column was NOT NULL, so the save was
   refused and the cycle never left the browser.

   Proved on the FROZEN writer before anything moved (§303), so this is a
   live defect on main rather than something the rebuild introduced; what the
   rebuild changed is that a refused statement now names itself (§316.2).

   The DEFAULT stays, so a tenant already holding a quarter keeps it, and no
   row is rewritten. schema.sql carries the same shape for a database made
   from scratch. */
ALTER TABLE review ALTER COLUMN ends_quarter DROP NOT NULL;
