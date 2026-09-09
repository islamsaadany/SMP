-- SMP shared schema — one schema, every client (spec 043, §314).
--
-- Two kinds of table. THE PLATFORM'S OWN, read before a tenant is known and
-- carrying no tenant policy: the registry, the logins, the memberships, the
-- door. THE TENANT-OWNED, every one carrying tenant_id and refusing rows from
-- any other tenant under FORCE ROW LEVEL SECURITY — added below the platform
-- half, and given their policy by ONE loop over the catalogue at the end, so a
-- table added later is covered on the next apply.
--
-- Applied once by db/apply.mjs as the owner; smp_app (db/roles.sql) owns
-- nothing here. Written as plain SQL because RLS, FORCE, roles and grants are
-- SQL whatever runs the queries; Prisma introspects this and never migrates it.

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid() on older builds

-- ── The platform's own tables ──────────────────────────────────────────

-- The registry. No schema_name: there is nothing for it to name.
CREATE TABLE tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,            -- the slug in the address: raya-trade
  name        text NOT NULL,
  region      text NOT NULL DEFAULT 'default', -- §4.5: one value, unread, Islam's to name
  kind        text NOT NULL DEFAULT 'client',
  status      text NOT NULL DEFAULT 'active',
  mark        text,                            -- PNG data URI only (§52)
  colors      jsonb NOT NULL DEFAULT '{}'::jsonb,
  industry    text NOT NULL DEFAULT '',
  notes       text NOT NULL DEFAULT '',
  made_here   boolean NOT NULL DEFAULT false,  -- §313.31
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenants_kind   CHECK (kind IN ('client','demo')),
  CONSTRAINT tenants_status CHECK (status IN ('active','retired'))
);

-- Logins, platform-wide. NO TENANT COLUMN: membership is tenant_users, so a
-- consultant on three clients and a client user on one are the same shape.
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,          -- lower-cased by whoever writes it
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,                 -- scrypt, lib/auth's s1: form (§43)
  must_change   boolean NOT NULL DEFAULT true,
  is_admin      boolean NOT NULL DEFAULT false,
  kind          text NOT NULL DEFAULT 'client',
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_kind   CHECK (kind IN ('office','client')),
  CONSTRAINT users_status CHECK (status IN ('active','retired'))
);

-- Who is on which tenant, and who they are inside it. The FK to people is
-- added at the end of this file, DEFERRABLE, because an office login may be
-- placed after the register exists (§313.32).
CREATE TABLE tenant_users (
  tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  person_key  text NOT NULL,
  seat        text NOT NULL DEFAULT 'none',
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id),
  CONSTRAINT tenant_users_seat CHECK (seat IN ('super','smoteam','none'))
);
CREATE INDEX tenant_users_user ON tenant_users (user_id);
-- One super user per tenant (§313.4): naming a second MOVES the seat.
CREATE UNIQUE INDEX tenant_users_one_super ON tenant_users (tenant_id) WHERE seat = 'super';

-- The door (§43), keyed on the login.
CREATE TABLE sessions (
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

CREATE TABLE login_attempts (
  id        bigserial PRIMARY KEY,
  at        timestamptz NOT NULL DEFAULT now(),
  key_tried text,
  ip        text
);
CREATE INDEX login_attempts_key ON login_attempts (key_tried, at DESC);
CREATE INDEX login_attempts_ip  ON login_attempts (ip, at DESC);
CREATE INDEX login_attempts_at  ON login_attempts (at DESC);

-- §37's matrix one level up, exactly §313's.
CREATE TABLE platform_access (
  role_key text NOT NULL,
  area_key text NOT NULL,
  grant_   text NOT NULL,
  PRIMARY KEY (role_key, area_key)
);

-- Who opened which tenant, when (client_log renamed with the vocabulary).
CREATE TABLE tenant_log (
  id         bigserial PRIMARY KEY,
  at         timestamptz NOT NULL DEFAULT now(),
  user_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  tenant_id  uuid REFERENCES tenants (id) ON DELETE SET NULL,
  what       text NOT NULL DEFAULT 'open'
);
CREATE INDEX tenant_log_tenant ON tenant_log (tenant_id, at DESC);

-- One VAPID pair per DEPLOYMENT (§231), not per tenant.
CREATE TABLE push_keys (
  id          int PRIMARY KEY DEFAULT 1,
  public_key  text NOT NULL,
  private_key text NOT NULL,
  made_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_keys_one_row CHECK (id = 1)
);

-- ── The tenant-owned tables (42) ────────────────────────────────────────
-- (added in the schema phase, data-model.md, group by group)

-- ── Row-level security: one loop from the catalogue ─────────────────────
-- Every table in public that is not on the platform list carries tenant_id
-- and gets ENABLE, FORCE, an index and the one policy. A table added later is
-- covered on the next apply. S5 (lib/schema-check.ts) asserts nothing slipped.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname NOT IN ('tenants','users','tenant_users','sessions','login_attempts',
                            'platform_access','tenant_log','push_keys','_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (tenant_id)', t || '_tenant', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                   WHERE c.relname = t AND p.polname = 'tenant_rows') THEN
      EXECUTE format(
        'CREATE POLICY tenant_rows ON %I FOR ALL ' ||
        'USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid) ' ||
        'WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)', t);
    END IF;
  END LOOP;
END $$;
