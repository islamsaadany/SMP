/* THE STRUCTURE'S THREE WORDS (§404) — the frozen stack's 046, per tenant.
   Written LAST in the shipped order, never over a row a client already has;
   the words are what the screen already says, so nothing moves. */
WITH d(idx, key, internal, one, many, note) AS (VALUES
  (13,'topword','Group','Group','Group','The level at the top: the group, the company, or the client''s own word'),
  (14,'brief','Brief','Who we are','Who we are','A short description of who this part of the business is'),
  (15,'swot','SWOT','SWOT','SWOT','Strengths, weaknesses, opportunities and threats')
)
INSERT INTO labels (tenant_id, key, idx, internal, grp, bu, note)
SELECT t.id, d.key, d.idx, d.internal, d.one, d.many, d.note
  FROM tenants t CROSS JOIN d
ON CONFLICT (tenant_id, key) DO NOTHING;
