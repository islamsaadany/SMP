# Platform migrations

Numbered `.sql` files that evolve `db/platform-schema.sql` after a deployment
already holds data — the same convention `db/migrations/` uses for a client,
with its own registry (`_platform_migrations`) so the two can never be confused
for one another.

`platform-schema.sql` is all `CREATE TABLE IF NOT EXISTS`, so it can never add
a column to a table that already exists. That is what these are for.

A file may declare `-- @phase: pre` on its first line to run before the
platform is seeded; no marker means after. Both phases are recorded by name.
