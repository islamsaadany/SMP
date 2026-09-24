/* THE STRUCTURE'S THREE WORDS (§404)

   The structure step names the top level, the brief and the SWOT, and the
   label registry had no row for any of them. Hydration REPLACES the list
   rather than merging it (§346.3), so a row added to the source reaches a new
   client and nobody else — written here, LAST, in the shipped order, and never
   over a row a client already has. The words are what the screen already
   says, so nothing moves. Written so a second run changes nothing. */
-- @phase: post
WITH d(idx, key, internal, one, many, note) AS (VALUES
  (13,'topword','Group','Group','Group','The level at the top: the group, the company, or the client''s own word'),
  (14,'brief','Brief','Who we are','Who we are','A short description of who this part of the business is'),
  (15,'swot','SWOT','SWOT','SWOT','Strengths, weaknesses, opportunities and threats')
)
INSERT INTO labels (key, idx, internal, grp, bu, note)
SELECT d.key, d.idx, d.internal, d.one, d.many, d.note FROM d
ON CONFLICT (key) DO NOTHING;
