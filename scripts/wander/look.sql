-- ── WANDER DEVELOPMENT · WHAT IS THERE, BEFORE ANYTHING IS WRITTEN ────────
-- Spec 066 stage 3b, for §544.6. READ ONLY: four SELECTs, no transaction,
-- nothing created, nothing changed. Paste the whole thing into Neon's SQL
-- editor and send me the four results.
--
-- Why it is being asked rather than assumed: the live database is not the
-- one in this repository (§542.5), and a file written from the repository
-- ran against the wrong shape once already and rolled back.

-- 1 · WHICH CLIENT IS WHICH, and how many capabilities each holds.
--     I need Wander's key from this; the name alone is not the key.
SELECT t.key, t.name, t.status,
       (SELECT count(*) FROM smp.capabilities c WHERE c.tenant_id = t.id) AS capabilities,
       (SELECT o.org_name  FROM smp.org o        WHERE o.tenant_id = t.id) AS "name inside",
       (SELECT jsonb_array_length(coalesce(o.extra->'items','[]'::jsonb))
          FROM smp.org o WHERE o.tenant_id = t.id)                         AS "company pillars"
  FROM smp.tenants t
 ORDER BY t.name;

-- 2 · WANDER'S THREE CAPABILITIES, and where each one's work actually sits:
--     its inner pillars ride as JSON on the row; its projects do not.
SELECT c.id, c.name, c.fn,
       c.extra->>'format'                                            AS "plans in",
       jsonb_array_length(coalesce(c.extra->'items','[]'::jsonb))     AS "pillars in extra",
       (SELECT count(*) FROM smp.projects p           WHERE p.cap_id = c.id) AS "project rows",
       (SELECT count(*) FROM smp.cap_key_objectives k WHERE k.cap_id = c.id) AS "objectives",
       coalesce(c.extra->>'head','')                                  AS head,
       coalesce(c.extra->>'def','')                                   AS "definition"
  FROM smp.capabilities c
  JOIN smp.tenants t ON t.id = c.tenant_id
 WHERE t.name ILIKE '%wander%'
 ORDER BY c.name;

-- 3 · AND THE ONE THAT PLANS IN PROJECTS, row by row — the milestones that
--     have to become tactics. Every column of theirs, so nothing is dropped
--     for want of knowing it was there.
SELECT p.id AS project, p.name AS "project name", p.owner AS "project owner",
       m.id AS milestone, m.idx, m.name, m.covers, m.owner, m.finish, m.status, m.pct, m.note
  FROM smp.projects p
  JOIN smp.capabilities c ON c.id = p.cap_id
  JOIN smp.tenants t      ON t.id = c.tenant_id
  LEFT JOIN smp.milestones m ON m.project_id = p.id
 WHERE t.name ILIKE '%wander%'
 ORDER BY p.id, m.idx;

-- 4 · AND WHAT ELSE HANGS OFF THOSE PROJECTS, which the move must not lose.
SELECT p.id AS project,
       (SELECT count(*) FROM smp.deliverables d WHERE d.project_id = p.id) AS deliverables,
       (SELECT count(*) FROM smp.outcomes    o WHERE o.project_id = p.id) AS outcomes,
       (SELECT count(*) FROM smp.milestones  m WHERE m.project_id = p.id) AS milestones
  FROM smp.projects p
  JOIN smp.capabilities c ON c.id = p.cap_id
  JOIN smp.tenants t      ON t.id = c.tenant_id
 WHERE t.name ILIKE '%wander%'
 ORDER BY p.id;
