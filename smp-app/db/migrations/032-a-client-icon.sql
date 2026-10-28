/* A client's icon (§629)

   Islam: *"in the client brand, give me another thing beside the client mark
   to upload an icon or use the mark as an icon. and this icon view appears in
   the dashboard of your clients as some clients have a wide mark that doesn't
   fit in that view"*.

   One nullable column beside `mark`, same kind of value: a PNG data URI and
   nothing else (§52 — an SVG is executable content). NULL means "use the
   mark", which is every client today, so no row needs writing.

   `IF NOT EXISTS` for 004's reason: on a FRESH database apply.mjs runs
   schema.sql (which already has the column) and then every migration in one
   transaction, so this must be a no-op there. */

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS icon text;
