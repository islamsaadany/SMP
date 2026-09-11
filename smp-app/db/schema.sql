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
  industry    text NOT NULL DEFAULT '',       -- the standard GICS list (§320)
  size        text NOT NULL DEFAULT '',       -- a band, never a headcount (§320)
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
-- A tenant may have more than one super user (§313.26, reversing §313.4's
-- seat move): giving somebody the seat takes nothing from anybody.

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
-- Every row: tenant_id uuid NOT NULL → tenants ON DELETE CASCADE, and the
-- key it has today with tenant_id in front of it (data-model.md). The
-- singletons (org, cycle, review, prior_cycle) are one row per tenant keyed
-- by tenant_id alone; the bigserial tables keep `id` and add UNIQUE
-- (tenant_id, id) so a child's FK can carry the tenant (S5 rule 4). Every FK
-- between tenant tables is (tenant_id, …) → (tenant_id, …) ON DELETE CASCADE.
-- The `extra jsonb` columns are untouched; nothing inside them names a tenant.
-- Column shapes are the frozen product's as they stand after migration 043,
-- read off a real database rather than off 44 migration files.

CREATE TABLE org (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  org_name text NOT NULL,
  horizon text NOT NULL DEFAULT '',
  as_of_quarter integer NOT NULL DEFAULT 2,
  aspiration text NOT NULL DEFAULT '',
  end_in_mind text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id)
);

CREATE TABLE cycle (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  reward_at numeric NOT NULL DEFAULT 100,
  locked boolean NOT NULL DEFAULT false,
  focus jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id)
);

CREATE TABLE review (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  from_label text NOT NULL DEFAULT '',
  to_label text NOT NULL DEFAULT '',
  due_label text NOT NULL DEFAULT '',
  ends_quarter integer DEFAULT 2,        -- §316.3: absent since §307 took it off the pen
  state text NOT NULL DEFAULT 'open',
  cadence text,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id)
);

CREATE TABLE prior_cycle (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id)
);

CREATE TABLE group_clauses (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  idx integer NOT NULL,
  label text NOT NULL DEFAULT '',
  text_ text NOT NULL DEFAULT '',
  cid text,
  PRIMARY KEY (tenant_id, idx)
);

CREATE TABLE group_key_objectives (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  idx integer NOT NULL,
  id text,
  name text NOT NULL DEFAULT '',
  grp text,
  dir text NOT NULL DEFAULT '≥',
  target3y text,
  target text,
  compile text,
  actual text,
  progress numeric,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, idx)
);

CREATE TABLE themes (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  idx integer NOT NULL,
  ab text NOT NULL,
  name text NOT NULL DEFAULT '',
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, idx)
);

CREATE TABLE bands (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  idx integer NOT NULL,
  key text NOT NULL,
  floor integer NOT NULL,
  label text NOT NULL DEFAULT '',
  PRIMARY KEY (tenant_id, idx)
);

CREATE TABLE history (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  group_score numeric,
  units jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, idx)
);

CREATE TABLE companies (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  key text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  ceo text,
  see_others boolean NOT NULL DEFAULT false,
  see_group boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE units (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  key text NOT NULL,
  idx integer NOT NULL,
  company text,
  name text NOT NULL DEFAULT '',
  nav_name text,
  code_prefix text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  real boolean NOT NULL DEFAULT false,
  aspiration text NOT NULL DEFAULT '',
  end_in_mind text NOT NULL DEFAULT '',
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE functions (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  key text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  nav_name text,
  code_prefix text,
  head text,
  custodian text,
  active boolean NOT NULL DEFAULT true,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE people (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  key text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  unit_key text,
  fn_key text,
  title text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE labels (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  key text NOT NULL,
  idx integer NOT NULL,
  internal text NOT NULL DEFAULT '',
  grp text,
  bu text,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE weighting_factors (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  key text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'judgement',
  basis text,
  weight numeric NOT NULL DEFAULT 0,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE capabilities (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  def text NOT NULL DEFAULT '',
  fn_key text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE projects (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  cap_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  brief text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  timeline text NOT NULL DEFAULT 'quarter',
  start_label text NOT NULL DEFAULT '',
  end_label text NOT NULL DEFAULT '',
  stakeholders jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT projects_cap_id_fkey FOREIGN KEY (tenant_id, cap_id) REFERENCES capabilities (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE deliverables (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  project_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  status text,
  pct numeric,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  due text,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT deliverables_project_id_fkey FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE outcomes (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  project_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  dir text NOT NULL DEFAULT '≥',
  target text,
  measure_at text,
  actual text,
  progress numeric,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT outcomes_project_id_fkey FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE milestones (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  project_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  covers text,
  owner text,
  finish text,
  status text,
  pct numeric,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT milestones_project_id_fkey FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE cap_key_objectives (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  cap_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  dir text NOT NULL DEFAULT '≥',
  target text,
  compile text,
  weight numeric,
  actual text,
  progress numeric,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT cap_key_objectives_cap_id_fkey FOREIGN KEY (tenant_id, cap_id) REFERENCES capabilities (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE unit_key_objectives (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  unit_key text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  dir text NOT NULL DEFAULT '≥',
  target3y text,
  target text,
  compile text,
  actual text,
  progress numeric,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT unit_key_objectives_unit_key_fkey FOREIGN KEY (tenant_id, unit_key) REFERENCES units (tenant_id, key) ON DELETE CASCADE
);

CREATE TABLE pillars (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  unit_key text,
  idx integer NOT NULL,
  code text,
  name text NOT NULL DEFAULT '',
  sub text,
  kind text NOT NULL DEFAULT 'Direction',
  theme text,
  owner text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  fn_key text,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT pillars_one_owner CHECK (((unit_key IS NULL) <> (fn_key IS NULL))),
  CONSTRAINT pillars_fn_key_fkey FOREIGN KEY (tenant_id, fn_key) REFERENCES functions (tenant_id, key) ON DELETE CASCADE,
  CONSTRAINT pillars_unit_key_fkey FOREIGN KEY (tenant_id, unit_key) REFERENCES units (tenant_id, key) ON DELETE CASCADE
);
CREATE INDEX pillars_fn_key_idx ON pillars (tenant_id, fn_key);

CREATE TABLE measures (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  pillar_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  dir text NOT NULL DEFAULT '≥',
  target text,
  target3y text,
  compile text,
  actual text,
  progress numeric,
  note text,
  horizon text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT measures_pillar_id_fkey FOREIGN KEY (tenant_id, pillar_id) REFERENCES pillars (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE tactics (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  pillar_id text NOT NULL,
  idx integer NOT NULL,
  name text NOT NULL DEFAULT '',
  owner text,
  collaborators jsonb,
  q1 boolean NOT NULL DEFAULT false,
  q2 boolean NOT NULL DEFAULT false,
  q3 boolean NOT NULL DEFAULT false,
  q4 boolean NOT NULL DEFAULT false,
  status text,
  actual numeric,
  note text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT tactics_pillar_id_fkey FOREIGN KEY (tenant_id, pillar_id) REFERENCES pillars (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE plan_archives (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id text NOT NULL,
  idx integer NOT NULL,
  kind text NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  at_label text,
  by_name text,
  why text,
  counts jsonb,
  plan jsonb,
  figures jsonb,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE unit_clauses (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  idx integer NOT NULL,
  label text NOT NULL DEFAULT '',
  text_ text NOT NULL DEFAULT '',
  cid text,
  PRIMARY KEY (tenant_id, unit_key, idx),
  CONSTRAINT unit_clauses_unit_key_fkey FOREIGN KEY (tenant_id, unit_key) REFERENCES units (tenant_id, key) ON DELETE CASCADE
);

CREATE TABLE swot_items (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  cat text NOT NULL,
  idx integer NOT NULL,
  text_ text NOT NULL DEFAULT '',
  PRIMARY KEY (tenant_id, unit_key, cat, idx),
  CONSTRAINT swot_items_cat_check CHECK ((cat = ANY (ARRAY['s'::text, 'w'::text, 'o'::text, 't'::text]))),
  CONSTRAINT swot_items_unit_key_fkey FOREIGN KEY (tenant_id, unit_key) REFERENCES units (tenant_id, key) ON DELETE CASCADE
);

CREATE TABLE unit_roles (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  head text,
  custodian text,
  PRIMARY KEY (tenant_id, unit_key)
);

CREATE TABLE weighting_rows (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  idx integer NOT NULL,
  unit_name text,
  why text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, unit_key)
);

CREATE TABLE ko_weights (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  weights jsonb NOT NULL,
  PRIMARY KEY (tenant_id, unit_key)
);

CREATE TABLE weighting_values (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  unit_key text NOT NULL,
  factor_key text NOT NULL,
  value numeric,
  PRIMARY KEY (tenant_id, unit_key, factor_key)
);

CREATE TABLE access_grants (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  role_key text NOT NULL,
  page_key text NOT NULL,
  grant_ text NOT NULL,
  PRIMARY KEY (tenant_id, role_key, page_key),
  CONSTRAINT access_grants_grant__check CHECK ((grant_ = ANY (ARRAY['none'::text, 'view'::text, 'fill'::text, 'edit'::text])))
);

CREATE TABLE bu_declarations (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  person_key text NOT NULL,
  at text NOT NULL,
  declared_on timestamptz NOT NULL DEFAULT now(),
  dismissed_on timestamptz,
  dismissed_by text,
  PRIMARY KEY (tenant_id, person_key)
);

CREATE TABLE change_log (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  at timestamptz NOT NULL DEFAULT now(),
  person_key text NOT NULL,
  person_name text,
  kind text NOT NULL,
  target text,
  what text,
  rows_ jsonb,
  email text,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id)
);
CREATE INDEX change_log_at ON change_log (tenant_id, at DESC);
CREATE INDEX change_log_target ON change_log (tenant_id, target, at DESC);
CREATE INDEX change_log_person ON change_log (tenant_id, person_key, at DESC);
CREATE INDEX change_log_email ON change_log (tenant_id, email, at DESC);

CREATE TABLE chat_threads (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  person_key text NOT NULL,
  person_name text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_at timestamptz NOT NULL DEFAULT now(),
  waiting boolean NOT NULL DEFAULT true,
  seen_by_them timestamptz,
  seen_by_us timestamptz,
  here_at timestamptz,
  chased_at timestamptz,
  chased_them_at timestamptz,
  PRIMARY KEY (tenant_id, person_key)
);
CREATE INDEX chat_threads_waiting ON chat_threads (tenant_id, waiting, last_at DESC);
CREATE INDEX chat_threads_last ON chat_threads (tenant_id, last_at DESC);

CREATE TABLE chat_messages (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  person_key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  from_office boolean NOT NULL DEFAULT false,
  by_key text NOT NULL,
  by_name text,
  body text NOT NULL,
  shot text,
  flag text,
  emailed_to text,
  bot boolean NOT NULL DEFAULT false,
  source text,
  handoff boolean NOT NULL DEFAULT false,
  chase_html text,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id),
  CONSTRAINT chat_messages_person_key_fkey FOREIGN KEY (tenant_id, person_key) REFERENCES chat_threads (tenant_id, person_key) ON DELETE CASCADE
);
CREATE INDEX chat_messages_thread ON chat_messages (tenant_id, person_key, at);
CREATE INDEX chat_messages_flag ON chat_messages (tenant_id, flag, at DESC) WHERE (flag IS NOT NULL);
CREATE INDEX chat_messages_chase ON chat_messages (tenant_id, at) WHERE ((chase_html IS NOT NULL) AND (emailed_to IS NULL));

CREATE TABLE messages (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  sent_at timestamptz NOT NULL DEFAULT now(),
  by_key text NOT NULL,
  by_name text,
  subject text NOT NULL,
  body text NOT NULL,
  cta_label text,
  cta_href text,
  audience jsonb,
  total integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  greet text,
  kind text,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id)
);
CREATE INDEX messages_sent_at ON messages (tenant_id, sent_at DESC);

CREATE TABLE message_drafts (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  by_key text NOT NULL,
  by_name text,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cta_label text,
  cta_href text,
  audience jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  greet text,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id)
);
CREATE INDEX message_drafts_updated ON message_drafts (tenant_id, updated_at DESC);

CREATE TABLE message_recipients (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  message_id bigint NOT NULL,
  person_key text,
  person_name text,
  address text NOT NULL,
  ok boolean NOT NULL DEFAULT false,
  error text,
  provider_id text,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id),
  CONSTRAINT message_recipients_message_id_fkey FOREIGN KEY (tenant_id, message_id) REFERENCES messages (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX message_recipients_msg ON message_recipients (tenant_id, message_id);

CREATE TABLE push_subscriptions (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  person_key text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  made_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz NOT NULL DEFAULT now(),
  -- ONE ENDPOINT, ONE SUBSCRIPTION (§231, corrected at §316.7). The frozen
  -- table keys on `endpoint` alone, and `pushOn` upserts on it so a device
  -- signed in to by somebody else MOVES rather than gaining a second row —
  -- which is what stops the previous person's notifications arriving on it.
  -- Keyed by person as well, this was not "the key it has today with
  -- tenant_id in front of it": migration 003 carries it for a database made
  -- before this line.
  PRIMARY KEY (tenant_id, endpoint)
);
CREATE INDEX push_subscriptions_person ON push_subscriptions (tenant_id, person_key);

CREATE TABLE assistant_asks (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  at timestamptz NOT NULL DEFAULT now(),
  asker_key text NOT NULL,
  asker_name text,
  office boolean NOT NULL DEFAULT false,
  question text NOT NULL,
  qkey text NOT NULL,
  answer text,
  answered boolean NOT NULL DEFAULT false,
  source text,
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id)
);
CREATE INDEX assistant_asks_at_idx ON assistant_asks (tenant_id, at DESC);
CREATE INDEX assistant_asks_qkey_idx ON assistant_asks (tenant_id, qkey);
CREATE INDEX assistant_asks_asker_idx ON assistant_asks (tenant_id, asker_key, at);

-- An office login may be placed on a register that does not exist yet
-- (§313.32), so the membership's pointer at the person is checked at COMMIT.
ALTER TABLE tenant_users
  ADD CONSTRAINT tenant_users_person_fkey
  FOREIGN KEY (tenant_id, person_key) REFERENCES people (tenant_id, key)
  ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


-- ── Row-level security: one loop from the catalogue ─────────────────────
-- Every table in THIS schema that is not on the platform list carries tenant_id
-- and gets ENABLE, FORCE, an index and the one policy. A table added later is
-- covered on the next apply. S5 (lib/schema-check.ts) asserts nothing slipped.
--
-- NULLIF(…, ''): a custom setting that has EVER been set on a backend reads
-- back as '' once its transaction ends, not as NULL — so on a reused
-- connection a query outside withTenant would error 22P02 instead of reading
-- an empty world (found by S6, and by S3's first pooler model). Both fail
-- closed; one of them is a blank page and the other a 500, and a safe failure
-- should be one thing. NULLIF makes '' and unset the same: nothing visible.
-- `current_schema()`, NEVER THE LITERAL `public` (§317.4). This loop reads the
-- catalogue and then ALTERs whatever it finds, so pointed at the wrong schema
-- it does not fail politely — on the real database `public` is a CLIENT, and
-- this would have enumerated Raya Trade's 46 live tables and tried to enable
-- row-level security, add an index and attach a policy to each. It stopped
-- only because the unqualified ALTER resolved in THIS schema and found
-- nothing: `relation "credentials" does not exist`, which reads like a missing
-- table and was a loop pointed at somebody else's data. The path is set by
-- db/apply.mjs and holds this schema alone.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = current_schema() AND c.relkind = 'r'
      AND c.relname NOT IN ('tenants','users','tenant_users','sessions','login_attempts',
                            'platform_access','tenant_log','push_keys','_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (tenant_id)', t || '_tenant', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                   JOIN pg_namespace n ON n.oid = c.relnamespace
                   WHERE n.nspname = current_schema() AND c.relname = t AND p.polname = 'tenant_rows') THEN
      EXECUTE format(
        'CREATE POLICY tenant_rows ON %I FOR ALL ' ||
        'USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) ' ||
        'WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)', t);
    END IF;
  END LOOP;
END $$;
