/* RAYA KEEPS WHAT IT SEES (§423.1). §423 makes a supporting function's own
   S&W wait for the office on a client that never saved a Structure. Islam,
   2026-09-29: *"keep what raya sees today with the ticks"* — so for Raya
   Trade alone the functions' level is written out as it reads today:
   every component on, S&W included. Nothing else about Raya moves, and every
   other level stays unsaid (still read as everything on).

   Only where the functions' level has never been saved, so a choice the
   office has already made is never overwritten, and a second run changes
   nothing. A client without that slug is untouched. */
UPDATE org o
   SET extra = jsonb_set(
         CASE WHEN jsonb_typeof(o.extra -> 'structure') = 'object'
              THEN o.extra ELSE o.extra || '{"structure":{}}'::jsonb END,
         '{structure,fn}',
         '{"on":["brief","purpose","aspiration","keyobj","theme","pillar","capability","values","swot"]}'::jsonb,
         true)
  FROM tenants t
 WHERE t.id = o.tenant_id
   AND t.key = 'raya-trade'
   AND jsonb_typeof(o.extra -> 'structure' -> 'fn' -> 'on') IS DISTINCT FROM 'array';
