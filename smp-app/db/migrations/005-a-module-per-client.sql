/* A MODULE PER CLIENT (spec 046 §4.5)

   schema.sql runs ONCE and is recorded as `schema` in _migrations, so a
   deployment that has already applied it never sees a column added there
   (§33.5: a fresh-deploy test and an existing-database test see different
   things, and each is blind to the other's fault). This is that column for
   the database that is already up.

   ONE COLUMN HOLDING THE WHOLE LIST, never a boolean per module (§104.7): a
   fifth module is a new value in a list, not a fifth column and a rule about
   which of them wins. The DEFAULT is Strategy alone, which is what every
   client has today, so no row has to be told anything it did not already
   mean — and the backfill is the same value written explicitly, because a
   DEFAULT applies to rows INSERTED after it and says nothing about the rows
   already there.

   NOTHING IS TRUSTED FROM THIS COLUMN. lib/modules.ts modulesFor() drops a
   word the code no longer knows and always returns the default, so a list
   written months ago cannot make a client unopenable — which is why there is
   no CHECK constraint naming the modules here: the names live in one place
   (MODULE_DEF) and a constraint would be a second copy of them, refusing an
   UPDATE the day a module is renamed rather than the day somebody looks. */
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '["strategy"]'::jsonb;
UPDATE tenants SET modules = '["strategy"]'::jsonb WHERE modules IS NULL OR jsonb_typeof(modules) <> 'array';
