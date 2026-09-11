/* The consulting memory (spec 044)

   schema.sql runs ONCE and is recorded as `schema` in _migrations, so a
   deployment that has already applied it never sees a table added there
   (§33.5: a fresh-deploy test and an existing-database test see different
   things). This is that table for the database that is already up.

   DELIBERATELY NO RLS STATEMENTS. On an existing database the loop at the end
   of schema.sql is not re-run, which is exactly the outcome wanted here — and
   a migration that switched row-level security on would be a SECOND answer to
   a question schema.sql's exclusion list already answers, drifting the moment
   either is edited (§53.5). The two paths must agree that this table has no
   tenant policy, and they do: one by exclusion, one by never being asked.

   AND IT IS `IF NOT EXISTS` BECAUSE OF THE OTHER PATH, which is what running
   it found rather than reasoning about it: on a FRESH database apply.mjs runs
   schema.sql and then every migration IN ONE TRANSACTION, so schema.sql
   creates this table and the migration meets it — `42P07 relation
   "memory_entries" already exists`, the whole run rolled back, and every new
   deployment failing to start. Loud, and only visible by applying to an empty
   database; the existing deployment, which is the one to hand, passes either
   way. Here it must be a no-op; on the database that is already up it is the
   whole of the change.

   Why `about_tenant_id` rather than `tenant_id`, and why both keys RESTRICT,
   are in schema.sql beside the table. */

-- FOREFRONT'S, NOT A CLIENT'S, AND THAT IS THE WHOLE DESIGN. Specs 042 and
-- 043 exist to stop one client's data reaching another; this is deliberately
-- the opposite — an insight from Raya Trade is worth having BECAUSE it helps
-- on RHI — so it is a platform table, read by consultants behind Forefront's
-- own door and never drawn inside a client's shell.
--
-- THE COLUMN IS `about_tenant_id`, NEVER `tenant_id`, AND THE REASON IS THE
-- LOOP AT THE END OF THIS FILE. That loop gives every table RLS and the
-- `tenant_rows` policy BY EXCLUSION, so a column called tenant_id here would
-- be handed a policy reading "this row belongs to the tenant being looked at"
-- — and a consultant on RHI could never read a Raya insight. The feature,
-- gone, with no error anywhere; and the two deployments would DISAGREE
-- (§113.7's mirror), because schema.sql runs once and is recorded, so an
-- existing database would be fine while every fresh one was dead.
--
-- It is also a different FACT: which client this is ABOUT is not which tenant
-- OWNS the row. Both measured on a real database before the name was chosen —
-- `tenant_id` takes the policy silently, `about_tenant_id` fails the apply
-- outright at the loop's own CREATE INDEX if the exclusion list is ever
-- forgotten. A loud failure in place of a quiet one is the whole decision.
--
-- BOTH KEYS ARE `ON DELETE RESTRICT`, deliberately: the memory OUTLIVES the
-- engagement. When Forefront stops working with somebody, what was learned
-- there is worth more rather than less, so deleting a client that holds
-- insights is refused by name (§62's shape) and retiring — the ordinary path
-- — touches none of this. Same for a consultant who leaves: their insights
-- stay, and stay attributed to them (decision 3).
CREATE TABLE IF NOT EXISTS memory_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  author_id       uuid NOT NULL REFERENCES users (id)   ON DELETE RESTRICT,
  kind            text NOT NULL DEFAULT 'lesson',
  title           text NOT NULL,
  -- the four questions, in the order they are asked; every one may be empty,
  -- because a title and a client are enough to save (spec) — which is what
  -- decides whether anybody writes the quick ones
  happened        text NOT NULL DEFAULT '',
  did             text NOT NULL DEFAULT '',
  came_of_it      text NOT NULL DEFAULT '',
  next_person     text NOT NULL DEFAULT '',
  -- WHEN IT HAPPENED, which is not when it was written: on a period debrief
  -- the two are weeks apart. Free text, written by the debrief and typed by
  -- nobody; absent is '' and nothing derives it (§35).
  occurred        text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_kind CHECK (kind IN ('practice','hiccup','lesson')),
  CONSTRAINT memory_title CHECK (btrim(title) <> '')
);
CREATE INDEX IF NOT EXISTS memory_about ON memory_entries (about_tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS memory_author ON memory_entries (author_id);
