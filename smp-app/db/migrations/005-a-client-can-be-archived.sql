/* ARCHIVING A CLIENT — WHEN, AND BY WHOM (§321)

   Islam: "we need an option to remove the client", then "both, demo client is
   not removable, and the name is Archive not put aside".

   THE STATE ITSELF NEEDS NO COLUMN. `tenants.status` has read
   'active' | 'retired' since the table was written, and everything downstream
   already honours it: visibleClients() keeps a retired client off the cards,
   and door.ts turns its address away identically to a client that never
   existed. Nothing has ever SET it — §61's trap, the machinery built and the
   door not drawn — so this migration adds the two facts a person needs to
   read beside it, and the control is the screen's half.

   THE STORED WORD STAYS `retired` AND THE LABEL IS "Archived" (§30.2, §65's
   own rule: the column was renamed on the page and the key was not). Three
   files already compare against that string, and a CHECK constraint names it;
   renaming a stored value for a word nobody reads is a migration with no
   reader on the other end of it.

   NULL is the honest default on both — every client that exists today was
   retired by nobody, because nothing could. A client brought back has them
   cleared, so they always describe the state the row is IN rather than the
   last time it was in one (§50.6: a value nobody chose is worse than none).

   `archived_by` is the account's EMAIL and never its id: it is read to be
   printed, an account that is later removed still leaves a true sentence,
   and there is no foreign key to take a tenant down with it. */
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS archived_by text;
