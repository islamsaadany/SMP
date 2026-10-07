/* THE END IN MIND'S OWN WORD (§508)

   Islam: "it needs a simple prompt as well and a naming in the foundation
   terminologies." The label registry had no row for it, so a client could
   rename the Winning Aspiration beside it and never this. Hydration REPLACES
   the list rather than merging it (§346.3), so the row added to the source
   reaches a new client and nobody else — written here, LAST, in the shipped
   order, and never over a row a client already has. Written so a second run
   changes nothing. */
-- @phase: post
INSERT INTO labels (key, idx, internal, grp, bu, note)
VALUES ('endinmind', 16, 'End in Mind', 'End in Mind', 'End in Mind',
        'The lasting mark the organisation works towards, long after this plan ends')
ON CONFLICT (key) DO NOTHING;
