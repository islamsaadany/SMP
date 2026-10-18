-- ── MERIDIAN GROUP (key `demo`) · WHAT IS THERE ──────────────────────────
-- Spec 066 stage 3b, for §544.6. READ ONLY: six SELECTs, no transaction,
-- nothing created, nothing changed.
--
-- Written after Wander taught two things the hard way (§544.10): ask the
-- database rather than the working copy, and ask in a way that can tell two
-- answers apart. So nothing below is wrapped in a coalesce that would read
-- the same for "the key is absent" and "the key is an empty list".

-- 1 · THE COMPANY ROW, and whether the keys the move touches EXIST at all.
--     `?` is the jsonb has-key test: this is the question whose coalesced
--     version hid Wander's missing `items` and broke a file.
SELECT o.org_name,
       (o.extra ? 'items')                               AS "has an items key",
       jsonb_typeof(o.extra->'items')                    AS "what items is",
       jsonb_array_length(o.extra->'items')              AS "pillars in it",
       (o.extra ? 'structure')                           AS "has a structure key",
       o.extra->'structure'->'top'                       AS "the top level as stored",
       o.extra->'structure'->'cap'                       AS "the capabilities as stored"
  FROM smp.org o JOIN smp.tenants t ON t.id = o.tenant_id
 WHERE t.key = 'demo';

-- 2 · THE TWO CAPABILITIES, every field the move reads.
SELECT c.id, c.idx, c.name, c.def, c.fn_key,
       (c.extra ? 'items')                               AS "has an items key",
       jsonb_array_length(c.extra->'items')              AS "pillars in it",
       c.extra->>'format'                                AS "plans in",
       c.extra->>'head'                                  AS head,
       c.extra->>'custodian'                             AS custodian,
       (SELECT count(*) FROM smp.projects p           WHERE p.cap_id = c.id) AS "project rows",
       (SELECT count(*) FROM smp.cap_key_objectives k WHERE k.cap_id = c.id) AS "objective rows"
  FROM smp.capabilities c JOIN smp.tenants t ON t.id = c.tenant_id
 WHERE t.key = 'demo'
 ORDER BY c.idx;

-- 3 · THE INNER PILLARS THEMSELVES — name and owner decide what the move
--     writes, and an empty name or owner is filled from the record.
SELECT c.id AS capability, el.ord AS "pillar #",
       el.item->>'id'    AS "row id",
       el.item->>'name'  AS name,
       el.item->>'owner' AS owner,
       el.item->>'kind'  AS kind,
       jsonb_array_length(el.item->'measures') AS measures,
       jsonb_array_length(el.item->'tactics')  AS tactics
  FROM smp.capabilities c
  JOIN smp.tenants t ON t.id = c.tenant_id
  CROSS JOIN LATERAL jsonb_array_elements(c.extra->'items') WITH ORDINALITY AS el(item, ord)
 WHERE t.key = 'demo'
 ORDER BY c.idx, el.ord;

-- 4 · ANY PROJECTS, and everything hanging off them. The move refuses a row
--     that carries a date, a state or a note, so those are shown.
SELECT p.id AS project, p.name, p.owner,
       (SELECT count(*) FROM smp.deliverables d WHERE d.project_id = p.id) AS deliverables,
       (SELECT count(*) FROM smp.milestones   m WHERE m.project_id = p.id) AS milestones,
       (SELECT count(*) FROM smp.outcomes     o WHERE o.project_id = p.id) AS outcomes,
       (SELECT count(*) FROM smp.milestones   m WHERE m.project_id = p.id
          AND (coalesce(m.covers,'')<>'' OR coalesce(m.finish,'')<>'' OR coalesce(m.status,'')<>''
               OR m.pct IS NOT NULL OR coalesce(m.note,'')<>''))            AS "milestones with a date/state/note",
       (SELECT count(*) FROM smp.deliverables d WHERE d.project_id = p.id
          AND (coalesce(d.status,'')<>'' OR d.pct IS NOT NULL
               OR coalesce(d.note,'')<>'' OR coalesce(d.due,'')<>''))       AS "deliverables with a state/date/note"
  FROM smp.projects p
  JOIN smp.capabilities c ON c.id = p.cap_id
  JOIN smp.tenants t      ON t.id = c.tenant_id
 WHERE t.key = 'demo'
 ORDER BY p.id;

-- 5 · AND WHO THE HEADS ARE, where a record names one: the move writes the
--     person's NAME onto the pillar, and it needs to find them.
SELECT c.id AS capability, c.extra->>'head' AS "head key",
       (SELECT pe.name FROM smp.people pe
         WHERE pe.key = c.extra->>'head' AND pe.tenant_id = c.tenant_id) AS "head name"
  FROM smp.capabilities c JOIN smp.tenants t ON t.id = c.tenant_id
 WHERE t.key = 'demo' AND coalesce(c.extra->>'head','') <> ''
 ORDER BY c.idx;

-- 6 · AND WHICH BACKUP TABLES ARE ALREADY THERE, so a name cannot collide
--     the way Wander's did (§544.9), and so the old ones can be dropped.
SELECT table_name, pg_size_pretty(pg_total_relation_size('smp.' || quote_ident(table_name))) AS size
  FROM information_schema.tables
 WHERE table_schema = 'smp' AND table_name LIKE '%_before_%'
 ORDER BY table_name;
