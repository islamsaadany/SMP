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

GRANT USAGE ON SCHEMA public TO smp_app;
-- No CREATE on the schema: smp_app cannot make a table it would then own.
REVOKE CREATE ON SCHEMA public FROM smp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smp_app;
-- Tables and sequences made LATER by the owner (a migration) are reachable
-- the day they are made, so a table added next month needs no grant somebody
-- remembers to write. Scoped to the owner running this file.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO smp_app;
