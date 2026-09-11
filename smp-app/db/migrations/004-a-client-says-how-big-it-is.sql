/* A CLIENT IS DESCRIBED BY MORE THAN ITS NAME (§320)

   Islam, setting up ElAbd Foods: "for the client we will need data like the
   number of employees and the industry should be a serachable drop down check
   the strategy formulation repo we build that list there so you can have a
   standard list."

   The industry needed no column — it has been one since the table was
   written; what changes is that the set-up flow offers Strategy
   Formulation's own 45 GICS entries rather than a free text box, which is a
   screen decision and nothing the database has to know about.

   The size does need one, and it is a BAND rather than a headcount — the
   same five that product asks for (startup · small · medium · large ·
   enterprise). A number typed once is stale within the year and nobody
   returns to correct it; a band still reads true. Text rather than an enum,
   and no CHECK: the five are the screen's list, and a sixth band is a
   decision somebody makes on a Tuesday, not a migration.

   Empty is the honest default — every client that exists today was created
   before anybody was asked — and the card reads "Not set" for it rather
   than guessing (§35). */
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS size text NOT NULL DEFAULT '';
