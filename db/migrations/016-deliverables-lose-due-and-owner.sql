-- @phase: pre
--
-- A DELIVERABLE HAS NO DUE AND NO OWNER (§53.4).
--
-- Islam, 2026-08-23: "remove the due column, it's not mandatory as it's a full
-- project due — it's delivered when the project ends", and "there is no owner
-- on the deliverables or outcomes, the department is responsible."
--
-- Both were answers a deliverable was giving quietly, alongside the project's
-- own. The project has an owner and an end date; a row inside it repeating
-- them in a smaller font invited an argument about which of the two was right.
-- An OUTCOME never had either, so this touches deliverables alone.
--
-- The columns are dropped rather than left standing and ignored. Nothing
-- writes them any more — not the platform, not the .xlsx template, not the CSV
-- — so a column still holding last quarter's answer is a value that can only
-- be read by mistake. What was in them is recoverable from the archive of any
-- plan that carried them (plan_archives), which is where a replaced plan has
-- lived since §22.
--
-- @phase: pre, because a schema change has to be in place before the seed
-- writes rows against it (§33.5). The seed no longer names these columns.

ALTER TABLE deliverables DROP COLUMN IF EXISTS due;
ALTER TABLE deliverables DROP COLUMN IF EXISTS owner;
