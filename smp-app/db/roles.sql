-- The runtime role. Spec 043 §4.3: the app never connects as a table's owner,
-- because Postgres bypasses every row-level policy for the owner, and a shared
-- schema without a non-owner role is WEAKER than the schemas it replaces.
--
--   smp_app: LOGIN, NOBYPASSRLS, owns nothing, may CREATE nothing.
--
-- Idempotent: safe on every apply. The password is read from the
-- psql variable :app_password (db/apply.mjs sets it from SMP_APP_PASSWORD) —
-- never written in this file. Run only by the owner (db/apply.mjs); smp_app
-- itself cannot run it, which is the point.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smp_app') THEN
    EXECUTE format('CREATE ROLE smp_app LOGIN NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L',
                   current_setting('smp.app_password', true));
  ELSE
    -- Never let a later ALTER hand it bypass: assert the shape every apply.
    EXECUTE 'ALTER ROLE smp_app NOBYPASSRLS NOCREATEDB NOCREATEROLE';
    IF current_setting('smp.app_password', true) IS NOT NULL THEN
      EXECUTE format('ALTER ROLE smp_app PASSWORD %L', current_setting('smp.app_password', true));
    END IF;
  END IF;
END $$;

-- THE GRANTS ARE ON THE SHARED SCHEMA, NOT ON `public` (§317.4). Its name
-- rides the same transaction-local setting the password does, because on the
-- real database `public` belongs to a CLIENT and granting smp_app anything
-- there would hand the runtime role a way into live data the shared schema
-- knows nothing about. Dynamic, so the name stays declared in exactly one
-- place (db/schema-name.mjs).
DO $$
DECLARE s text := current_setting('smp.schema', true);
BEGIN
  IF s IS NULL OR s = '' THEN RAISE EXCEPTION 'roles.sql: smp.schema is not set — db/apply.mjs sets it'; END IF;
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO smp_app', s);
  -- No CREATE on the schema: smp_app cannot make a table it would then own.
  EXECUTE format('REVOKE CREATE ON SCHEMA %I FROM smp_app', s);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO smp_app', s);
  EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO smp_app', s);
  -- Tables and sequences made LATER by the owner (a migration) are reachable
  -- the day they are made, so a table added next month needs no grant somebody
  -- remembers to write. Scoped to the owner running this file.
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smp_app', s);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO smp_app', s);
  -- AND ANY GRANT THIS ROLE WAS EVER GIVEN IN `public` IS TAKEN BACK, because
  -- on the real database that schema is a CLIENT's live data. WHAT THIS DOES
  -- NOT DO, said rather than implied (§124): USAGE on `public` is granted to
  -- PUBLIC by Postgres itself and a revoke from one role does not remove it,
  -- so `has_schema_privilege` goes on answering true. That is not a way in —
  -- reaching a TABLE needs a table privilege, and this role holds none there
  -- (asserted: has_table_privilege(smp_app, public.people, SELECT) is false).
  -- Revoking the PUBLIC grant instead would reach the frozen site's own role,
  -- which is not this file's to touch.
  EXECUTE 'REVOKE ALL ON SCHEMA public FROM smp_app';
END $$;
