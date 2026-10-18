-- ── WANDER DEVELOPMENT · ROUND 2, STILL READ ONLY ────────────────────────
-- Round 1 answered which client is which (wander-development, 3 capabilities,
-- 0 company pillars) and then tripped on `c.fn`, which is not a column — it
-- rides in `extra`, as `items` does. So this one asks the tables to list
-- their own columns first, and reads the capability rows through `extra`.
-- Four SELECTs, no transaction, nothing written.

-- 1 · WHAT COLUMNS THESE TABLES ACTUALLY HAVE. Everything else here is
--     written against the answer rather than against the repository.
SELECT table_name, ordinal_position AS pos, column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'smp'
   AND table_name IN ('capabilities', 'projects', 'milestones', 'outcomes', 'deliverables')
 ORDER BY table_name, ordinal_position;

-- 2 · WANDER'S THREE, read through extra.
SELECT c.id, c.name,
       c.extra->>'fn'                                             AS "held by",
       coalesce(c.extra->>'format','projects')                    AS "plans in",
       jsonb_array_length(coalesce(c.extra->'items','[]'::jsonb))  AS "pillars in extra",
       coalesce(c.extra->>'head','')                              AS head,
       coalesce(c.extra->>'custodian','')                         AS custodian,
       coalesce(c.extra->>'def','')                               AS definition,
       (SELECT count(*) FROM smp.projects p           WHERE p.cap_id = c.id) AS "project rows",
       (SELECT count(*) FROM smp.cap_key_objectives k WHERE k.cap_id = c.id) AS "objective rows"
  FROM smp.capabilities c
  JOIN smp.tenants t ON t.id = c.tenant_id
 WHERE t.key = 'wander-development'
 ORDER BY c.name;

-- 3 · THE PROJECT AND ITS MILESTONES — the rows that become tactics.
--     SELECT * on purpose: whatever columns there are, I see them.
SELECT p.id AS project, p.name AS "project name", p.owner AS "project owner", m.*
  FROM smp.projects p
  JOIN smp.capabilities c ON c.id = p.cap_id
  JOIN smp.tenants t      ON t.id = c.tenant_id
  LEFT JOIN smp.milestones m ON m.project_id = p.id
 WHERE t.key = 'wander-development'
 ORDER BY p.id, m.idx;

-- 4 · AND WHAT ELSE HANGS OFF THAT PROJECT, which the move must not lose.
SELECT p.id AS project,
       (SELECT count(*) FROM smp.deliverables d WHERE d.project_id = p.id) AS deliverables,
       (SELECT count(*) FROM smp.outcomes    o WHERE o.project_id = p.id) AS outcomes,
       (SELECT count(*) FROM smp.milestones  m WHERE m.project_id = p.id) AS milestones
  FROM smp.projects p
  JOIN smp.capabilities c ON c.id = p.cap_id
  JOIN smp.tenants t      ON t.id = c.tenant_id
 WHERE t.key = 'wander-development'
 ORDER BY p.id;
