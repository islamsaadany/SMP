-- A step's RACI row showed "New step" after the step was renamed on the Map: the row's Activity kept the placeholder name
-- it was given when the first RACI letter was set. This brings those names up to date, and only those: an Activity that
-- still carries the Map's placeholder name ("New step" / "New decision", English or Arabic), is the step's only Activity, and
-- whose step has since been given a real name takes that name. Nothing else is renamed, nothing is deleted.
UPDATE "activities" a
SET "name" = s."label"
FROM "process_steps" s
WHERE a."relatedStepId" = s."id"
  AND a."name" IN ('New step', 'New decision', 'خطوة جديدة', 'قرار جديد')
  AND s."label" NOT IN ('New step', 'New decision', 'خطوة جديدة', 'قرار جديد')
  AND btrim(s."label") <> ''
  AND (SELECT count(*) FROM "activities" x WHERE x."relatedStepId" = s."id") = 1;
