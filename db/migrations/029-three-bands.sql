-- 029 · THREE BANDS, AND ONLY WHERE NOBODY HAS CHOSEN OTHERWISE (§161.4)
--
-- Islam: "I want the colors to be 3 colors only, red, green and yellow" —
-- 90+ green, 70 to 90 yellow, below 70 red. §161 changed the shipped DEFAULT
-- and the seed, and on his own deployment nothing moved, because THE BANDS
-- ARE A ROW IN A TABLE: `sync.js` hydrates `BANDS.bands` from the database
-- over whatever the file was built with. A default only ever reaches a
-- deployment that has not been seeded yet.
--
-- SO THIS REWRITES A STORED SETTING, WHICH IS NOT A THING TO DO LIGHTLY. The
-- band list belongs to the tenant — Setup › Scoring bands edits it — and a
-- migration that overwrites it would throw away a client's own thresholds the
-- next time they deploy. It therefore changes NOTHING unless the stored bands
-- are exactly the four this product used to ship: same keys, same floors. A
-- tenant who has touched them keeps what they chose, and is left to make this
-- change themselves on the page built for it.
--
-- Written as one guarded statement rather than a DELETE plus two UPDATEs, so
-- a tenant midway between the two shapes cannot be left in a third.

DO $$
DECLARE shipped_before boolean;
BEGIN
  SELECT count(*) = 4
     AND count(*) FILTER (WHERE key = 'good' AND floor = 85) = 1
     AND count(*) FILTER (WHERE key = 'attn' AND floor = 70) = 1
     AND count(*) FILTER (WHERE key = 'warn' AND floor = 50) = 1
     AND count(*) FILTER (WHERE key = 'bad'  AND floor = 0)  = 1
    INTO shipped_before
    FROM bands;

  IF shipped_before THEN
    DELETE FROM bands WHERE key = 'warn';
    UPDATE bands SET floor = 90 WHERE key = 'good';
    -- `idx` is the order the list renders in, and removing the third of four
    -- leaves a hole at 2. Renumbered from the floors, highest first, which is
    -- the order the list has always been written in.
    UPDATE bands SET idx = 0 WHERE key = 'good';
    UPDATE bands SET idx = 1 WHERE key = 'attn';
    UPDATE bands SET idx = 2 WHERE key = 'bad';
    RAISE NOTICE '029: bands were the shipped four — now three (90 / 70 / 0)';
  ELSE
    RAISE NOTICE '029: bands are not the shipped four — left exactly as they are';
  END IF;
END $$;
