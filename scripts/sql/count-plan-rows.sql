-- ═══════════════════════════════════════════════════════════════════════════
-- SMP — HOW MANY ROWS A CLIENT'S PLAN HOLDS
-- Paste into Neon's SQL editor and run ONE query at a time (they are separated
-- by the rules below). Reads only; writes nothing.
--
-- READ THIS BEFORE YOU TRUST A NUMBER. A supporting function's whole plan is
-- ONE JSON BLOB in functions.extra — its pillars ("items"), its own key
-- objectives, and its own projects — and nothing puts any of it in the
-- pillars, measures, tactics or projects tables. So a plain
--     SELECT count(*) FROM projects
-- answers only the projects a CAPABILITY holds. On the worked example that is
-- 1 where the true figure is 19. Every query below reads both halves.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── QUERY 0 — WHICH SCHEMA IS THE LIVE ONE. Run this first. ────────────────
-- Raya Trade's tables could be in either of two places. `smp` is the shared
-- schema the served app uses, one row per client keyed by tenant_id. `public`
-- is where Raya Trade sat when every client had a schema of its own. Count
-- whichever this lists — if it lists both, use QUERY 0b to see which is live.

SELECT table_schema AS schema_, count(*) AS plan_tables_present
FROM information_schema.tables
WHERE table_name IN ('units','functions','pillars','measures','tactics',
                     'projects','unit_key_objectives','group_key_objectives')
GROUP BY 1
ORDER BY 2 DESC, 1;


-- ── QUERY 0b — which one people are actually writing to. ───────────────────
-- Run whichever line matches a schema QUERY 0 listed; the later timestamp is
-- the live copy. (Run them separately — one will error if that schema is not
-- there, and an error stops the whole statement.)

--   SELECT max(at) AS last_change FROM smp.change_log c
--     JOIN smp.tenants t ON t.id = c.tenant_id WHERE t.key = 'raya-trade';
--   SELECT max(at) AS last_change FROM public.change_log;


-- ── QUERY 1 — the count, against the SHARED schema (`smp`). ────────────────
-- Change the slug below for another client. Inactive (retired) units and
-- functions are left out — take the `u.active` / `f.active` tests off to count
-- them too.

WITH t AS (
  SELECT id FROM smp.tenants WHERE key = 'raya-trade'
),

-- Every active supporting function's plan blob.
fnx AS (
  SELECT f.extra AS x
  FROM smp.functions f JOIN t ON f.tenant_id = t.id
  WHERE f.active
),
-- A function's pillars, and its own projects, unpacked out of that blob.
fn_pillar AS (
  SELECT e AS p FROM fnx,
  LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(x->'items') = 'array' THEN x->'items' ELSE '[]'::jsonb END) e
),
fn_proj AS (
  SELECT e AS p FROM fnx,
  LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(x->'projects') = 'array' THEN x->'projects' ELSE '[]'::jsonb END) e
),

n AS (
  SELECT
    (SELECT count(*) FROM smp.group_key_objectives g JOIN t ON g.tenant_id = t.id)                      AS group_ko,
    (SELECT count(*) FROM smp.unit_key_objectives k JOIN t ON k.tenant_id = t.id
        JOIN smp.units u ON u.tenant_id = k.tenant_id AND u.key = k.unit_key AND u.active)              AS unit_ko,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(x->'keyObjectives') = 'array'
        THEN x->'keyObjectives' ELSE '[]'::jsonb END)), 0) FROM fnx)                                    AS fn_ko,
    (SELECT count(*) FROM smp.cap_key_objectives c JOIN t ON c.tenant_id = t.id)                        AS cap_ko,

    (SELECT count(*) FROM smp.pillars p JOIN t ON p.tenant_id = t.id
        JOIN smp.units u ON u.tenant_id = p.tenant_id AND u.key = p.unit_key AND u.active)              AS unit_pillars,
    (SELECT count(*) FROM fn_pillar)                                                                    AS fn_pillars,

    (SELECT count(*) FROM smp.measures m JOIN t ON m.tenant_id = t.id
        JOIN smp.pillars p ON p.tenant_id = m.tenant_id AND p.id = m.pillar_id
        JOIN smp.units u ON u.tenant_id = p.tenant_id AND u.key = p.unit_key AND u.active)              AS unit_measures,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'measures') = 'array'
        THEN p->'measures' ELSE '[]'::jsonb END)), 0) FROM fn_pillar)                                   AS fn_measures,

    (SELECT count(*) FROM smp.tactics ta JOIN t ON ta.tenant_id = t.id
        JOIN smp.pillars p ON p.tenant_id = ta.tenant_id AND p.id = ta.pillar_id
        JOIN smp.units u ON u.tenant_id = p.tenant_id AND u.key = p.unit_key AND u.active)              AS unit_tactics,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'tactics') = 'array'
        THEN p->'tactics' ELSE '[]'::jsonb END)), 0) FROM fn_pillar)                                    AS fn_tactics,

    (SELECT count(*) FROM smp.capabilities c JOIN t ON c.tenant_id = t.id)                              AS caps,
    (SELECT count(*) FROM smp.projects pr JOIN t ON pr.tenant_id = t.id)                                AS cap_projects,
    (SELECT count(*) FROM fn_proj)                                                                      AS fn_projects,

    (SELECT count(*) FROM smp.deliverables d JOIN t ON d.tenant_id = t.id)                              AS cap_deliverables,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'deliverables') = 'array'
        THEN p->'deliverables' ELSE '[]'::jsonb END)), 0) FROM fn_proj)                                 AS fn_deliverables,
    (SELECT count(*) FROM smp.outcomes o JOIN t ON o.tenant_id = t.id)                                  AS cap_outcomes,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'outcomes') = 'array'
        THEN p->'outcomes' ELSE '[]'::jsonb END)), 0) FROM fn_proj)                                     AS fn_outcomes,
    (SELECT count(*) FROM smp.milestones ms JOIN t ON ms.tenant_id = t.id)                              AS cap_milestones,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'milestones') = 'array'
        THEN p->'milestones' ELSE '[]'::jsonb END)), 0) FROM fn_proj)                                   AS fn_milestones
  FROM t
)

SELECT * FROM (
  SELECT 1 AS ord, 'Key objectives — group'        AS row_kind, group_ko                        AS how_many FROM n
  UNION ALL SELECT 2, 'Key objectives — units',        unit_ko              FROM n
  UNION ALL SELECT 3, 'Key objectives — functions',    fn_ko                FROM n
  UNION ALL SELECT 4, 'Key objectives — capabilities', cap_ko               FROM n
  UNION ALL SELECT 5, 'KEY OBJECTIVES, ALL',           group_ko+unit_ko+fn_ko+cap_ko FROM n
  UNION ALL SELECT 6, 'Key measures',                  unit_measures+fn_measures     FROM n
  UNION ALL SELECT 7, 'Tactics',                       unit_tactics+fn_tactics       FROM n
  UNION ALL SELECT 8, 'Projects',                      cap_projects+fn_projects      FROM n
  UNION ALL SELECT 9, 'OBJECTIVES + MEASURES + TACTICS + PROJECTS',
      group_ko+unit_ko+fn_ko+cap_ko + unit_measures+fn_measures + unit_tactics+fn_tactics + cap_projects+fn_projects FROM n
  UNION ALL SELECT 10, '— context —',                  NULL                 FROM n
  UNION ALL SELECT 11, 'Pillars',                      unit_pillars+fn_pillars       FROM n
  UNION ALL SELECT 12, 'Capabilities',                 caps                 FROM n
  UNION ALL SELECT 13, 'Deliverables',                 cap_deliverables+fn_deliverables FROM n
  UNION ALL SELECT 14, 'Outcomes (under projects)',    cap_outcomes+fn_outcomes      FROM n
  UNION ALL SELECT 15, 'Milestones',                   cap_milestones+fn_milestones  FROM n
  UNION ALL SELECT 16, 'EVERY PLAN ROW',
      group_ko+unit_ko+fn_ko+cap_ko + unit_measures+fn_measures + unit_tactics+fn_tactics
      + cap_projects+fn_projects + cap_deliverables+fn_deliverables
      + cap_outcomes+fn_outcomes + cap_milestones+fn_milestones FROM n
) z ORDER BY ord;


-- ── QUERY 2 — the same rows, per subject, so you can see where they sit. ──

WITH t AS (
  SELECT id FROM smp.tenants WHERE key = 'raya-trade'
),
per_group AS (
  SELECT 0 AS sort, 'Group' AS kind, 'Raya Trade' AS name,
    (SELECT count(*) FROM smp.group_key_objectives g JOIN t ON g.tenant_id = t.id) AS key_objectives,
    0::bigint AS pillars, 0::bigint AS measures, 0::bigint AS tactics, 0::bigint AS projects
),
per_unit AS (
  SELECT 1000 + u.idx AS sort, 'Business unit' AS kind, u.name,
    (SELECT count(*) FROM smp.unit_key_objectives k
       WHERE k.tenant_id = u.tenant_id AND k.unit_key = u.key)                    AS key_objectives,
    (SELECT count(*) FROM smp.pillars p
       WHERE p.tenant_id = u.tenant_id AND p.unit_key = u.key)                    AS pillars,
    (SELECT count(*) FROM smp.measures m JOIN smp.pillars p
       ON p.tenant_id = m.tenant_id AND p.id = m.pillar_id
       WHERE m.tenant_id = u.tenant_id AND p.unit_key = u.key)                    AS measures,
    (SELECT count(*) FROM smp.tactics ta JOIN smp.pillars p
       ON p.tenant_id = ta.tenant_id AND p.id = ta.pillar_id
       WHERE ta.tenant_id = u.tenant_id AND p.unit_key = u.key)                   AS tactics,
    0::bigint AS projects
  FROM smp.units u JOIN t ON u.tenant_id = t.id
  WHERE u.active
),
per_fn AS (
  SELECT 2000 + f.idx AS sort, 'Supporting function' AS kind, f.name,
    jsonb_array_length(CASE WHEN jsonb_typeof(f.extra->'keyObjectives') = 'array'
      THEN f.extra->'keyObjectives' ELSE '[]'::jsonb END)::bigint                 AS key_objectives,
    jsonb_array_length(CASE WHEN jsonb_typeof(f.extra->'items') = 'array'
      THEN f.extra->'items' ELSE '[]'::jsonb END)::bigint                         AS pillars,
    COALESCE((SELECT sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'measures') = 'array'
        THEN p->'measures' ELSE '[]'::jsonb END))
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(f.extra->'items') = 'array'
        THEN f.extra->'items' ELSE '[]'::jsonb END) p), 0)                        AS measures,
    COALESCE((SELECT sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'tactics') = 'array'
        THEN p->'tactics' ELSE '[]'::jsonb END))
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(f.extra->'items') = 'array'
        THEN f.extra->'items' ELSE '[]'::jsonb END) p), 0)                        AS tactics,
    jsonb_array_length(CASE WHEN jsonb_typeof(f.extra->'projects') = 'array'
      THEN f.extra->'projects' ELSE '[]'::jsonb END)::bigint                      AS projects
  FROM smp.functions f JOIN t ON f.tenant_id = t.id
  WHERE f.active
),
per_cap AS (
  SELECT 3000 + c.idx AS sort, 'Capability' AS kind, c.name,
    (SELECT count(*) FROM smp.cap_key_objectives k
       WHERE k.tenant_id = c.tenant_id AND k.cap_id = c.id)                       AS key_objectives,
    0::bigint AS pillars, 0::bigint AS measures, 0::bigint AS tactics,
    (SELECT count(*) FROM smp.projects pr
       WHERE pr.tenant_id = c.tenant_id AND pr.cap_id = c.id)                     AS projects
  FROM smp.capabilities c JOIN t ON c.tenant_id = t.id
),
all_rows AS (
  SELECT * FROM per_group
  UNION ALL SELECT * FROM per_unit
  UNION ALL SELECT * FROM per_fn
  UNION ALL SELECT * FROM per_cap
)
SELECT kind, name, key_objectives, pillars, measures, tactics, projects,
       key_objectives + measures + tactics + projects AS counted_rows
FROM (
  SELECT sort, kind, name, key_objectives, pillars, measures, tactics, projects FROM all_rows
  UNION ALL
  SELECT 9999, 'TOTAL', '(everything)', sum(key_objectives), sum(pillars), sum(measures),
         sum(tactics), sum(projects) FROM all_rows
) z
ORDER BY sort;


-- ── QUERY 3 — the same count against the FROZEN `public` schema. ───────────
-- Only if QUERY 0/0b say `public` is the live copy. Same logic, no tenant
-- filter (that schema holds one client and one client only).

WITH fnx AS (
  SELECT f.extra AS x FROM public.functions f WHERE f.active
),
fn_pillar AS (
  SELECT e AS p FROM fnx,
  LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(x->'items') = 'array' THEN x->'items' ELSE '[]'::jsonb END) e
),
fn_proj AS (
  SELECT e AS p FROM fnx,
  LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(x->'projects') = 'array' THEN x->'projects' ELSE '[]'::jsonb END) e
),
n AS (
  SELECT
    (SELECT count(*) FROM public.group_key_objectives)                                                  AS group_ko,
    (SELECT count(*) FROM public.unit_key_objectives k JOIN public.units u ON u.key = k.unit_key AND u.active) AS unit_ko,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(x->'keyObjectives') = 'array'
        THEN x->'keyObjectives' ELSE '[]'::jsonb END)), 0) FROM fnx)                                    AS fn_ko,
    (SELECT count(*) FROM public.cap_key_objectives)                                                    AS cap_ko,
    (SELECT count(*) FROM public.pillars p JOIN public.units u ON u.key = p.unit_key AND u.active)      AS unit_pillars,
    (SELECT count(*) FROM fn_pillar)                                                                    AS fn_pillars,
    (SELECT count(*) FROM public.measures m JOIN public.pillars p ON p.id = m.pillar_id
        JOIN public.units u ON u.key = p.unit_key AND u.active)                                         AS unit_measures,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'measures') = 'array'
        THEN p->'measures' ELSE '[]'::jsonb END)), 0) FROM fn_pillar)                                   AS fn_measures,
    (SELECT count(*) FROM public.tactics ta JOIN public.pillars p ON p.id = ta.pillar_id
        JOIN public.units u ON u.key = p.unit_key AND u.active)                                         AS unit_tactics,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'tactics') = 'array'
        THEN p->'tactics' ELSE '[]'::jsonb END)), 0) FROM fn_pillar)                                    AS fn_tactics,
    (SELECT count(*) FROM public.capabilities)                                                          AS caps,
    (SELECT count(*) FROM public.projects)                                                              AS cap_projects,
    (SELECT count(*) FROM fn_proj)                                                                      AS fn_projects,
    (SELECT count(*) FROM public.deliverables)                                                          AS cap_deliv,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'deliverables') = 'array'
        THEN p->'deliverables' ELSE '[]'::jsonb END)), 0) FROM fn_proj)                                 AS fn_deliv,
    (SELECT count(*) FROM public.outcomes)                                                              AS cap_out,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'outcomes') = 'array'
        THEN p->'outcomes' ELSE '[]'::jsonb END)), 0) FROM fn_proj)                                     AS fn_out,
    (SELECT count(*) FROM public.milestones)                                                            AS cap_ms,
    (SELECT COALESCE(sum(jsonb_array_length(CASE WHEN jsonb_typeof(p->'milestones') = 'array'
        THEN p->'milestones' ELSE '[]'::jsonb END)), 0) FROM fn_proj)                                   AS fn_ms
)
SELECT * FROM (
  SELECT 1 AS ord, 'Key objectives — group' AS row_kind, group_ko AS how_many FROM n
  UNION ALL SELECT 2, 'Key objectives — units', unit_ko FROM n
  UNION ALL SELECT 3, 'Key objectives — functions', fn_ko FROM n
  UNION ALL SELECT 4, 'Key objectives — capabilities', cap_ko FROM n
  UNION ALL SELECT 5, 'KEY OBJECTIVES, ALL', group_ko+unit_ko+fn_ko+cap_ko FROM n
  UNION ALL SELECT 6, 'Key measures', unit_measures+fn_measures FROM n
  UNION ALL SELECT 7, 'Tactics', unit_tactics+fn_tactics FROM n
  UNION ALL SELECT 8, 'Projects', cap_projects+fn_projects FROM n
  UNION ALL SELECT 9, 'OBJECTIVES + MEASURES + TACTICS + PROJECTS',
      group_ko+unit_ko+fn_ko+cap_ko+unit_measures+fn_measures+unit_tactics+fn_tactics+cap_projects+fn_projects FROM n
  UNION ALL SELECT 10, '— context —', NULL FROM n
  UNION ALL SELECT 11, 'Pillars', unit_pillars+fn_pillars FROM n
  UNION ALL SELECT 12, 'Capabilities', caps FROM n
  UNION ALL SELECT 13, 'Deliverables', cap_deliv+fn_deliv FROM n
  UNION ALL SELECT 14, 'Outcomes (under projects)', cap_out+fn_out FROM n
  UNION ALL SELECT 15, 'Milestones', cap_ms+fn_ms FROM n
  UNION ALL SELECT 16, 'EVERY PLAN ROW',
      group_ko+unit_ko+fn_ko+cap_ko+unit_measures+fn_measures+unit_tactics+fn_tactics
      +cap_projects+fn_projects+cap_deliv+fn_deliv+cap_out+fn_out+cap_ms+fn_ms FROM n
) z ORDER BY ord;
