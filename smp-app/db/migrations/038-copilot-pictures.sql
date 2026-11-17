/* Pictures in the Copilot (§780)

   Islam: "in the builder or refiner allow me to paste pictures as well with
   data where the AI can analyze and get data from". A PNG, JPEG or WebP is
   attached to a chat, or kept as a SWOT source, and goes to the model as
   itself, as a PDF does. The two kind fences widen to take them.

   schema.sql runs once (§33.5), so this file carries the change for a
   database already up; on a fresh one schema.sql made the fences wide
   already, and dropping and adding them again is the same. Idempotent. */

ALTER TABLE copilot_files DROP CONSTRAINT IF EXISTS copilot_file_kind;
ALTER TABLE copilot_files ADD CONSTRAINT copilot_file_kind CHECK (kind IN ('pdf','docx','xlsx','png','jpg','webp'));

ALTER TABLE copilot_sources DROP CONSTRAINT IF EXISTS copilot_source_file_kind;
ALTER TABLE copilot_sources ADD CONSTRAINT copilot_source_file_kind CHECK (file_kind IS NULL OR file_kind IN ('pdf','docx','xlsx','png','jpg','webp'));
