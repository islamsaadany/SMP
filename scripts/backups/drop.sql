-- ════════════════════════════════════════════════════════════════════════
--  DROPPING THE FOUR SAFETY COPIES  (§544.15)
--
--  Islam: "drop the backup tables".
--
--  These are the ONLY copy of El Abd's and Wander's plans as they stood
--  before their capabilities were folded into the company plan. Once they
--  are gone there is no way back to that state, so this file is in TWO
--  PARTS and the second one is not meant to be run until the first has
--  been read.
--
--  PART 1 is read-only. It lists what is actually there and shows that both
--  moves landed, which is the thing that makes dropping safe.
--  PART 2 does the dropping.
--
--  Run PART 1, look at the three results, then run PART 2.
-- ════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════
--  PART 1 — READ ONLY.  Changes nothing.  Run this first.
-- ════════════════════════════════════════════════════════════════════════

-- 1 · WHAT IS ACTUALLY THERE. Every safety copy in the schema, not just the
--     four expected — so a fifth nobody remembered shows up here rather than
--     being missed. "rows" is what each one is holding.
-- `reltuples` reads -1 on a table nobody has analysed, which every one of
-- these is — so it is left out rather than printed as a row count that is
-- not one. Result 3 below counts them exactly.
SELECT c.relname                                   AS "table",
       pg_size_pretty(pg_total_relation_size(c.oid)) AS "size",
       CASE WHEN c.relname IN ('org_before_20261018',
                               'capabilities_before_20261018')            THEN 'El Abd'
            WHEN c.relname LIKE '%wander_development%'                    THEN 'Wander Development'
            ELSE '← NOT ONE OF THE FOUR. Look at this before going on.'
       END                                         AS "whose"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'smp' AND c.relkind = 'r'
  AND (c.relname LIKE 'org_before%' OR c.relname LIKE 'capabilities_before%')
ORDER BY c.relname;


-- 2 · AND THAT BOTH MOVES LANDED, which is the reason the copies are no
--     longer needed. Expect: no capability records left for either client,
--     and their capabilities present as pillars in the company's own plan.
SELECT t.name                                                AS "client",
       (SELECT count(*) FROM smp.capabilities c
          WHERE c.tenant_id = t.id)                          AS "capability records left",
       coalesce(jsonb_array_length(o.extra->'items'), 0)     AS "pillars in the company plan",
       (SELECT count(*) FROM jsonb_array_elements(
            coalesce(o.extra->'items', '[]'::jsonb)) e
          WHERE e->>'kind' = 'Capability')                   AS "…of them capabilities",
       CASE WHEN (SELECT count(*) FROM smp.capabilities c WHERE c.tenant_id = t.id) = 0
             AND (SELECT count(*) FROM jsonb_array_elements(
                    coalesce(o.extra->'items', '[]'::jsonb)) e
                    WHERE e->>'kind' = 'Capability') > 0
            THEN 'moved — the copy is spare'
            ELSE '← NOT AS EXPECTED. Do not run part 2.'
       END                                                   AS "verdict"
FROM smp.tenants t
LEFT JOIN smp.org o ON o.tenant_id = t.id
WHERE t.key IN ('el-abd', 'wander-development')
ORDER BY t.name;


-- 3 · WHAT THE COPIES STILL HOLD, so what is being given up is on the screen
--     rather than taken on trust.
SELECT 'El Abd — capabilities'  AS "copy", count(*) AS "rows" FROM smp.capabilities_before_20261018
UNION ALL
SELECT 'El Abd — org',          count(*) FROM smp.org_before_20261018
UNION ALL
SELECT 'Wander — capabilities', count(*) FROM smp.capabilities_before_wander_development_20261018
UNION ALL
SELECT 'Wander — org',          count(*) FROM smp.org_before_wander_development_20261018;


-- ════════════════════════════════════════════════════════════════════════
--  PART 2 — THE DROP.  This cannot be undone.
--
--  Run it only once part 1's second result says "moved — the copy is spare"
--  on BOTH clients, and its first result shows no fifth table you did not
--  expect.
--
--  It is one transaction: either all four go or none does. The check inside
--  re-asks part 1's question and REFUSES to commit if either client's move
--  does not look done — so a wrong moment costs nothing.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE seen int; bad int;
BEGIN
  /* IT MUST FIND BOTH CLIENTS FIRST. Asking only "is any of them unmoved?"
     passes when the answer is "none of them is anything" — a mistyped or
     renamed tenant key matches no rows, `bad` is 0, and the copies go
     without their reason ever being checked. A guard that cannot tell
     "all well" from "I found nothing" is not a guard, so the count is
     asserted before the verdict is. */
  SELECT count(*) INTO seen FROM smp.tenants t
   WHERE t.key IN ('el-abd', 'wander-development');
  IF seen <> 2 THEN
    RAISE EXCEPTION
      'Not dropping: expected both clients by key and found %. The keys here are el-abd and wander-development — check them before going on.', seen;
  END IF;

  SELECT count(*) INTO bad
  FROM smp.tenants t
  LEFT JOIN smp.org o ON o.tenant_id = t.id
  WHERE t.key IN ('el-abd', 'wander-development')
    AND NOT (
      (SELECT count(*) FROM smp.capabilities c WHERE c.tenant_id = t.id) = 0
      AND (SELECT count(*) FROM jsonb_array_elements(
             coalesce(o.extra->'items', '[]'::jsonb)) e
             WHERE e->>'kind' = 'Capability') > 0
    );
  IF bad > 0 THEN
    RAISE EXCEPTION
      'Not dropping: % of these clients does not look moved. Run part 1 and read it.', bad;
  END IF;
END $$;

DROP TABLE IF EXISTS smp.org_before_20261018;
DROP TABLE IF EXISTS smp.capabilities_before_20261018;
DROP TABLE IF EXISTS smp.org_before_wander_development_20261018;
DROP TABLE IF EXISTS smp.capabilities_before_wander_development_20261018;

COMMIT;


-- 4 · READ IT BACK. Run after the commit; changes nothing. Expect no rows.
SELECT c.relname AS "still there"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'smp' AND c.relkind = 'r'
  AND (c.relname LIKE 'org_before%' OR c.relname LIKE 'capabilities_before%')
ORDER BY c.relname;
