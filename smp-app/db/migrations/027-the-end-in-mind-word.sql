/* THE END IN MIND'S OWN WORD (§508) — the frozen stack's 048, per tenant.
   Written LAST in the shipped order, never over a row a client already has. */
INSERT INTO labels (tenant_id, key, idx, internal, grp, bu, note)
SELECT t.id, 'endinmind', 16, 'End in Mind', 'End in Mind', 'End in Mind',
       'The lasting mark the organisation works towards, long after this plan ends'
  FROM tenants t
ON CONFLICT (tenant_id, key) DO NOTHING;
