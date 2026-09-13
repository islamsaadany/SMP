/* THE WORD FOR A BUSINESS UNIT IS A REAL LABEL (§340)

   The set-up flow has asked every consultant what their client calls a
   business unit since §322, and wrote the answer NOWHERE: there was no such
   entry in the label registry, so the minter walked the list, found no match
   and dropped it. Accepted, saved, and the platform went on saying "Business
   Unit" on every heading — the quietest kind of fault, because the screen
   looks right and nothing fails (§294.2).

   ADDING IT TO THE SOURCE REACHES A NEW CLIENT AND NOBODY ELSE. Hydration
   REPLACES the label list with the tenant's stored one rather than merging it
   over the shipped defaults, so a label added to the product is invisible to
   every client that already exists — §30.2's rule, never applied to labels.
   And merging at hydrate is not the answer: a reader that creates what it
   looked for puts a phantom change into every save, and a labels change is
   the SMO's, so the first save by anybody else would be refused for ever
   (§42's own recorded fault). So the row is written HERE, once, where it
   lands in the database and both sides agree about it.

   IT GOES LAST, matching the shipped order exactly: first in one place and
   last in the other is two answers to one question (§53.5). Idempotent on
   the key, and it never overwrites — a client who has already been asked
   keeps what they answered, which can only happen on a deployment where this
   has already run. */
INSERT INTO labels (tenant_id, key, idx, internal, grp, bu, note)
SELECT t.id, 'unitword', COALESCE(MAX(l.idx) + 1, 0), 'Business Unit',
       'Business units', 'Business units',
       'What this client calls a business unit. Headings only — sentences keep the platform''s own word.'
  FROM tenants t
  LEFT JOIN labels l ON l.tenant_id = t.id
 GROUP BY t.id
ON CONFLICT (tenant_id, key) DO NOTHING;
