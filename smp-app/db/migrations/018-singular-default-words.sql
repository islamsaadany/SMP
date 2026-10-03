/* THE SINGULAR DEFAULT WORDS (§404.3 — the frozen stack's 047, per tenant). Islam: "for the default wording
   written it should be singular, plural for only Objectives, Pillars,
   Capabilities, values" — and, of an existing client still reading Missions,
   "yes build it".

   Migration 016 wrote "Missions" and "Winning Aspirations" into every client
   whose word still sat on the platform's default, BECAUSE NOBODY HAD CHOSEN
   IT. The same reasoning moves them back: a row holding EXACTLY that default
   is the platform's word, never the client's, so it takes the new default;
   any word a client typed is left alone (§96.2). Written so a second run
   changes nothing. */
UPDATE labels SET bu = 'Mission'            WHERE key = 'purpose'    AND bu = 'Missions';
UPDATE labels SET bu = 'Winning Aspiration' WHERE key = 'aspiration' AND bu = 'Winning Aspirations';
