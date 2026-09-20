-- RAYA TRADE — HOW MANY ROWS THE PLAN HOLDS.
-- Paste into Neon's SQL editor and run. Reads only; writes nothing.
--
-- It reads two places, and it has to. A supporting function's whole plan is
-- ONE JSON BLOB in functions.extra — its pillars ("items"), its own key
-- objectives and its own projects — so a plain count(*) on the tables misses
-- every bit of it: on the worked example that reads 1 project where the true
-- figure is 19. Retired units and functions are left out.
--
-- `total` is the rows people report against. Units, functions and pillars are
-- counted beside it and left out of it: those are the containers the reported
-- rows sit in, so summing them counts the shelves along with what is on them.
-- Put them in the sum on the last line if you would rather have them there.

WITH t AS (
  SELECT id FROM smp.tenants WHERE key = 'raya-trade'
),
fnx AS (                                   -- each live function's plan blob
  SELECT f.extra AS x
  FROM smp.functions f JOIN t ON f.tenant_id = t.id
  WHERE f.active
),
fn_pillar AS (                             -- the pillars inside those blobs
  SELECT e AS p FROM fnx, LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(x->'items') = 'array' THEN x->'items' ELSE '[]'::jsonb END) e
),
n AS (
  SELECT
    (SELECT count(*) FROM smp.units u JOIN t ON u.tenant_id = t.id
       WHERE u.active)                                                       AS units,

    (SELECT count(*) FROM smp.functions f JOIN t ON f.tenant_id = t.id
       WHERE f.active)                                                       AS functions,

    (SELECT count(*) FROM smp.group_key_objectives g JOIN t ON g.tenant_id = t.id)
    + (SELECT count(*) FROM smp.unit_key_objectives k JOIN t ON k.tenant_id = t.id
         JOIN smp.units u ON u.tenant_id = k.tenant_id AND u.key = k.unit_key AND u.active)
    + (SELECT count(*) FROM smp.cap_key_objectives c JOIN t ON c.tenant_id = t.id)
    + (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(x->'keyObjectives') = 'array'
         THEN x->'keyObjectives' ELSE '[]'::jsonb END)), 0) FROM fnx)        AS key_objectives,

    (SELECT count(*) FROM smp.pillars p JOIN t ON p.tenant_id = t.id
       JOIN smp.units u ON u.tenant_id = p.tenant_id AND u.key = p.unit_key AND u.active)
    + (SELECT count(*) FROM fn_pillar)                                       AS pillars,

    (SELECT count(*) FROM smp.measures m JOIN t ON m.tenant_id = t.id
       JOIN smp.pillars p ON p.tenant_id = m.tenant_id AND p.id = m.pillar_id
       JOIN smp.units u ON u.tenant_id = p.tenant_id AND u.key = p.unit_key AND u.active)
    + (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'measures') = 'array'
         THEN p->'measures' ELSE '[]'::jsonb END)), 0) FROM fn_pillar)       AS key_measures,

    (SELECT count(*) FROM smp.tactics ta JOIN t ON ta.tenant_id = t.id
       JOIN smp.pillars p ON p.tenant_id = ta.tenant_id AND p.id = ta.pillar_id
       JOIN smp.units u ON u.tenant_id = p.tenant_id AND u.key = p.unit_key AND u.active)
    + (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'tactics') = 'array'
         THEN p->'tactics' ELSE '[]'::jsonb END)), 0) FROM fn_pillar)        AS tactics,

    (SELECT count(*) FROM smp.projects pr JOIN t ON pr.tenant_id = t.id)
    + (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(x->'projects') = 'array'
         THEN x->'projects' ELSE '[]'::jsonb END)), 0) FROM fnx)             AS projects
  FROM t
)
SELECT units, functions, key_objectives, pillars, key_measures, tactics, projects,
       key_objectives + key_measures + tactics + projects AS total
FROM n;
