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
  industry    text NOT NULL DEFAULT '',       -- the standard GICS list (§322)
  size        text NOT NULL DEFAULT '',       -- a band, never a headcount (§322)
  notes       text NOT NULL DEFAULT '',
  made_here   boolean NOT NULL DEFAULT false,  -- §313.31
  -- §323: read beside status='retired', which is what "archived" is stored as.
  -- NULL on a live client, and cleared again when one is brought back.
  archived_at timestamptz,
  archived_by text,                            -- the account's email, printed
  -- WHICH MODULES THIS CLIENT HAS (spec 046 §4.5). The whole list, in the
  -- client's own words, read back through lib/modules.ts modulesFor() —
  -- which drops a word the code no longer knows and always returns the
  -- default, so a list written months ago can never make a client
  -- unopenable. Everybody starts on Strategy alone.
  modules     jsonb NOT NULL DEFAULT '["strategy"]'::jsonb,
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

-- ── The consulting memory (spec 044) ───────────────────────────────────
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
CREATE TABLE memory_entries (
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
CREATE INDEX memory_about ON memory_entries (about_tenant_id, created_at DESC);
CREATE INDEX memory_author ON memory_entries (author_id);

-- ── The strategy frameworks library (spec 052) ──────────────────────────
-- Forefront's own, and the one platform table that names no client at all:
-- the memory's entries are ABOUT an engagement, and a framework is about
-- nobody. So there is no tenant column here of any kind — and forgetting the
-- exclusion list below still fails the apply outright, at the loop's own
-- CREATE INDEX … (tenant_id), which is the loud failure `memory_entries`
-- chose its column name to get. Same property, for free.
--
-- `added_by` IS NULL-ABLE AND `ON DELETE SET NULL`, where the memory's author
-- is NOT NULL … RESTRICT, and the two differences are the same decision read
-- twice: the eighty that come with the library were written by nobody here,
-- and an entry outlives whoever typed it. Absent means "came with the
-- library" and nothing derives a person to fill it (§35). Refusing to remove
-- a consultant because they once added a framework is the wrong trade — where
-- refusing to remove one who wrote up an engagement is exactly the right one.
--
-- THE NINE CONTENT FIELDS ARE NOT NULL DEFAULT '', so every reader is spared
-- a null check and an empty field reads as empty everywhere. The name is the
-- only one that cannot be blank — a framework with no name is not a row.
CREATE TABLE frameworks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- the address, and UNIQUE in the database rather than in whatever mints it:
  -- a one-off script derived these and nothing could collide; with admins
  -- adding, two frameworks can want one slug, and a collision is refused BY
  -- NAME rather than resolved silently (§87).
  slug                 text NOT NULL UNIQUE,
  -- THE BOOK'S OWN ORDER, and it is why there is no second list of section
  -- names anywhere: the eight sections are ordered by the smallest `idx` in
  -- each, and the frameworks inside one by their own. Alphabetical would
  -- scramble a sequence that teaches — Knowing Your Business comes before
  -- Addressing Risk because you do it first. A framework an admin adds takes
  -- max(idx)+1, so it lands at the end and moves no section (§101's `units.idx`,
  -- the same answer to the same question).
  idx                  integer NOT NULL DEFAULT 0,
  name                 text NOT NULL,
  section              text NOT NULL,
  purpose              text NOT NULL DEFAULT '',
  key_questions        text NOT NULL DEFAULT '',
  when_to_use          text NOT NULL DEFAULT '',
  when_not_to_use      text NOT NULL DEFAULT '',
  inputs_required      text NOT NULL DEFAULT '',
  outputs              text NOT NULL DEFAULT '',
  executive_example    text NOT NULL DEFAULT '',
  consultant_use_case  text NOT NULL DEFAULT '',
  facilitation_tips    text NOT NULL DEFAULT '',
  added_by             uuid NULL REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT frameworks_name CHECK (btrim(name) <> '')
);
CREATE INDEX frameworks_section ON frameworks (idx);

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

-- ── The library: Insights and Processes, one table (spec 053) ──────────
-- ONE MACHINE, INSTANTIATED TWICE (spec 046 §4.8, Islam 2026-09-11). Both
-- libraries are a catalogue you search and take something from; one has a file
-- on the end and the other has steps. `kind` is which, and it is the only
-- thing that differs between them here — two tables would be these columns
-- written twice, drifting the first time a category rule or a search changed
-- in one of them (§53.5).
--
-- PUBLISHED BY FOREFRONT, READ BY THE CLIENT (spec 046 decision #9, confirmed
-- 2026-09-13). Nothing in the client's app writes this table; the console does,
-- through lib/platform-api.ts. The rows are still the CLIENT'S — one client's
-- research is not another's — so they are tenant-owned and carry tenant_id,
-- and a consultant reads them through withTenant like anything else.
--
-- THE BYTES ARE NOT HERE. The file lives in the blob store at file_path (§261,
-- and lib/blob-api.ts's own reason: a serverless function refuses a request
-- body over about 4.5MB, so a 20MB report cannot arrive in one piece). What
-- this row holds is where it is, what it was called and how big it was.
CREATE TABLE library_items (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'insights',
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  -- A SET OF WORDS, canonically ordered on the way in (lib/library.ts), so the
  -- order somebody clicked cannot change what is stored. The WORDS and not
  -- keys: one list serves every client today (spec 053 §7.1), and giving a
  -- client their own later reads these same rows and moves no data.
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- THE REPORT'S OWN DATE, never the upload's — a market report is filed under
  -- when it was written. NULL is honest: a process has no such date, and
  -- absent is not a guess at one (§35).
  report_date date,
  state text NOT NULL DEFAULT 'draft',
  -- Moved by replacing the file and by nothing else, so the number means one
  -- thing (spec 053 §4.6).
  version integer NOT NULL DEFAULT 1,
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  -- A COUNT AND NEVER A LOG (spec 053 §4.9): what a client's staff each opened
  -- is a surveillance decision nobody asked for.
  downloads integer NOT NULL DEFAULT 0,
  -- Stamped the FIRST time it goes out and never rewritten, so withdrawing and
  -- republishing does not move a report's place in history.
  published_at timestamptz,
  published_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- ROOM FOR AN OWNER AND A NEXT-REVIEW DATE, DRAWN BY NOTHING — Islam's "for
  -- now" on Processes (spec 046 decision #10), so growing teeth later is an
  -- addition rather than a migration (§177, §213).
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT library_kind CHECK (kind IN ('insights','processes')),
  CONSTRAINT library_state CHECK (state IN ('draft','published')),
  CONSTRAINT library_title CHECK (btrim(title) <> '')
);
-- What a client's library reads, in the order it reads it.
CREATE INDEX library_items_shelf ON library_items (tenant_id, kind, state, report_date DESC);

-- ── THE INTERNAL TRACKER (spec 054) ──────────────────────────────────────
-- The office's weekly list about ONE client, kept in the client's own room:
-- an action, and one row per status change. Both are tenant-owned, so the
-- loop below fences them on a fresh database and migration 012 fences them on
-- one already up (the same two paths library_items took, and the same reason).
CREATE TABLE tracker_actions (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  -- A register KEY, never a name (§48): the register renders the name, so a
  -- rename reaches every action. It must hold an office seat (spec 054
  -- decision 5), which is the server's rule (lib/tracker.ts) and not the
  -- database's, because the seat lives on the platform's own table.
  owner_key text NOT NULL,
  -- One action, one owner (§356.11): the collaborators column the first build
  -- carried is gone, migration 013 on a database already up.
  -- NULL is "no date yet" and is never late (§35).
  due date,
  -- The first due date ever set, kept while the action is open so a
  -- reschedule cannot reset the carried-weeks count; cleared on Done.
  first_due date,
  status text NOT NULL DEFAULT 'not_started',
  done_at timestamptz,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Room for what is deliberately not built (spec 054 §7): a late override,
  -- a reason, a link to a plan item — drawn by nothing.
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT tracker_status CHECK (status IN ('not_started','in_progress','done')),
  CONSTRAINT tracker_title CHECK (btrim(title) <> '')
);
CREATE INDEX tracker_actions_week ON tracker_actions (tenant_id, status, due);

-- One row per status change, plus one on creation. Appended, never edited:
-- a log a save could rewrite is not a log (§42).
CREATE TABLE tracker_events (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  action_id uuid NOT NULL,
  kind text NOT NULL,
  from_status text,
  to_status text,
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, action_id) REFERENCES tracker_actions (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT tracker_event_kind CHECK (kind IN ('created','status'))
);
CREATE INDEX tracker_events_action ON tracker_events (tenant_id, action_id, at);

-- ── MEETING NOTES (spec 055) ─────────────────────────────────────────────
-- One meeting, one note, kept in the client's own room: the note, and one row
-- per send of its minutes — who, when, whether it was an update, who it went
-- to, and THE MINUTES AS SENT, because the note stays editable (decision 6)
-- and the record of what went out must not move with it. An attendee is a
-- {key} the register renders at draw and send time (§48), or a {name, email}
-- for this meeting only (decision 4). Both tenant-owned, so the loop below
-- fences them on a fresh database and migration 014 on one already up.
CREATE TABLE notes (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  met_on date NOT NULL,
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw text NOT NULL DEFAULT '',
  minutes jsonb,
  refined_at timestamptz,
  refined_by text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id)
);
CREATE INDEX notes_met_on ON notes (tenant_id, met_on DESC, created_at DESC);

CREATE TABLE note_sends (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  note_id uuid NOT NULL,
  sent_by text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  is_update boolean NOT NULL DEFAULT false,
  subject text NOT NULL DEFAULT '',
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  minutes jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, note_id) REFERENCES notes (tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX note_sends_note ON note_sends (tenant_id, note_id, sent_at);

-- ── PORTFOLIO — the delivery plan, per client (spec 060) ─────────────────
-- A client has PROJECTS and a project holds a tree: phases, optionally work
-- packages, and activities, which may be broken into sub-activities. Every
-- table is tenant-owned, so the loop below fences them on a fresh database
-- and migration 015 fences them on one already up (the two paths
-- library_items and tracker_actions both took, for the same reason).
--
-- EVERY TABLE IS PREFIXED, AND FOR A HARDER REASON THAN TIDINESS (§5):
-- `projects` and `milestones` are ALREADY tables in this schema — Strategy's
-- — so an unprefixed one would not merely read ambiguously, it would
-- collide. `scope_milestones` is renamed `portfolio_work_packages` on the way
-- in for the same reason (§5: the concept was renamed there in Dec 2025 and
-- the table never was).
--
-- THE CONSTRAINTS ARE NEW, NOT INHERITED (§7.6). Their schema has six columns
-- carrying no foreign key at all and NO CHECK anywhere, so orphans are
-- assumed rather than ruled out; the rows get them on the way in. "You will
-- not get a cleaner moment."
--
-- A CODE IS A POSITION, NEVER A STORED NUMBER (§310, §7.6). Theirs lets the
-- browser supply phase numbers and never renumbers on a delete, so its plans
-- carry gaps and stale codes. Here `pos` orders the row and `renumber()`
-- (lib/portfolio.ts) derives 1 / 1.1 / 1.1.1 from where it sits, so a gap
-- cannot happen — and ids are never touched, because figures key on them
-- (§232).
--
-- NEITHER A PHASE NOR A WORK PACKAGE STORES HOW FAR ALONG IT IS. Their two
-- DECIMAL(5,2) columns are dropped rather than ported: nothing in their code
-- ever writes either, and the endpoint that selects one never reads it
-- (§9.8). The figure is derived when the page is drawn, which is how a
-- pillar's is (§264: a summary must be made of the numbers it summarises).

-- The plan's parent, and the charter it is described by (§5.1). Decision 2
-- in one table: what was a (client, agreement, scope) triple is one object
-- this module owns outright, and the tenants row is the only thing borrowed.
CREATE TABLE portfolio_projects (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brief text NOT NULL DEFAULT '',
  -- PEOPLE, PICKED — never typed (§5.1, §130.1). A list of {key}, which the
  -- register renders at draw time so a rename reaches every mention (§48) —
  -- or {name} for a value outside it, because his own example writes "HR
  -- Director/Head", which is a post and not a person (§96.2).
  -- NAMING SOMEBODY HERE GRANTS NOTHING (§5.1a, Islam: "not related to the
  -- roles of accessability") — reach is portfolio_members and nothing else,
  -- which is §56's rule: a claim about somebody is not a grant.
  sponsors jsonb NOT NULL DEFAULT '[]'::jsonb,
  consultants jsonb NOT NULL DEFAULT '[]'::jsonb,
  stakeholders jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Prose, written as a list by a person: his own example is dashes and a
  -- placeholder. Turning them into rows would invent a structure the
  -- document does not have (§5.1).
  pain_drivers text NOT NULL DEFAULT '',
  gain_drivers text NOT NULL DEFAULT '',
  -- In and out are TWO fields, confirmed against his own form's single cell
  -- (§5.1): nobody types a heading into a box.
  in_scope text NOT NULL DEFAULT '',
  out_scope text NOT NULL DEFAULT '',
  deliverables text NOT NULL DEFAULT '',
  success_criteria text NOT NULL DEFAULT '',
  resources text NOT NULL DEFAULT '',
  -- New: nothing in SMP or the reference holds this (§5.1).
  risks text NOT NULL DEFAULT '',
  -- WHAT WAS AGREED, beside what is happening (§5.2). The plan holds the
  -- real dates; these two are the charter's own, and the row shows both when
  -- they differ — which is the single most useful fact on that page, and is
  -- the product's own idiom rather than a new one (§239, §344).
  agreed_start date,
  agreed_end date,
  -- A HEADLINE FIGURE, and the breakdown NAMED and not built (§5.2): the
  -- platform has no money concept at all (§9.6 — 57 tables, not one holds a
  -- budget, a fee or an hour), and a breakdown is a feature the size of the
  -- plan tree. Text, because a headline is written as somebody writes it and
  -- nothing sums it; the day anybody tracks spend it becomes a number and a
  -- currency, which is a question about the practice rather than the code.
  budget text NOT NULL DEFAULT '',
  -- ITS OWN RHYTHM, and A CHECKPOINT IS A DATE AND NOTHING ELSE (§9.10):
  -- two fields, no table, and the next one derived (`nextCheckpoint`).
  -- Strategy's reporting cycle does not reach this and must not.
  checkpoint_cadence text,
  checkpoint_day smallint,
  -- NOTHING GATES BUILDING THE PLAN (§5.1): approval is not built, because
  -- here it would be a stamp nothing reads, and a field nothing reads is
  -- worse than no field (§24, §294.2's write-only column).
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT portfolio_project_name CHECK (btrim(name) <> ''),
  CONSTRAINT portfolio_cadence CHECK (checkpoint_cadence IS NULL OR checkpoint_cadence IN ('weekly','monthly')),
  -- 0–6 for a week (Sunday first, the week this platform already uses) and
  -- 1–28 for a month, so a cadence set on the 30th cannot skip February.
  CONSTRAINT portfolio_checkpoint_day CHECK (
    checkpoint_day IS NULL
    OR (checkpoint_cadence = 'weekly'  AND checkpoint_day BETWEEN 0 AND 6)
    OR (checkpoint_cadence = 'monthly' AND checkpoint_day BETWEEN 1 AND 28)
  ),
  CONSTRAINT portfolio_agreed_window CHECK (agreed_start IS NULL OR agreed_end IS NULL OR agreed_end >= agreed_start)
);
CREATE INDEX portfolio_projects_tenant ON portfolio_projects (tenant_id, name);

-- A ROW PER (project, person, role) — §6's whole answer, and the two of
-- theirs that said one thing between them (client_team_members and
-- scope_lead_assignments) as ONE table. THREE ROLES, ON THE PROJECT: there
-- is no Portfolio column on Roles & access, so if you are not here you see
-- nothing, and if you are, your role on THIS project is the whole answer.
--
-- THE LIST IS THE PEOPLE WHO HOLD NEITHER SEAT (§6.1) — a property of the
-- model rather than a sentence about Forefront: anybody holding one is
-- already on every project, so a row for them could add nothing.
--
-- A LEAD IS LEAD OF ONE PROJECT (§7.4C): their Lead was narrowed by scope,
-- and that narrowing MOVES here rather than going, because a client has
-- several projects and this key is (project, person).
CREATE TABLE portfolio_members (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  -- A register KEY, never a name (§48), and the register is what renders it.
  person_key text NOT NULL,
  -- EVERYBODY LANDS AS VIEWER (§6.4, Islam): nothing is granted until
  -- somebody decides, which is the safe direction (§42 fails closed), and
  -- the list is never in a state where a person is on a project with no role.
  role text NOT NULL DEFAULT 'viewer',
  added_by text NOT NULL DEFAULT '',
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, project_id, person_key),
  FOREIGN KEY (tenant_id, project_id) REFERENCES portfolio_projects (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, person_key) REFERENCES people (tenant_id, key) ON DELETE CASCADE,
  CONSTRAINT portfolio_member_role CHECK (role IN ('lead','contributor','viewer'))
);
CREATE INDEX portfolio_members_person ON portfolio_members (tenant_id, person_key);

-- Phase, numbered by position, under a project.
CREATE TABLE portfolio_phases (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  pos integer NOT NULL DEFAULT 0,
  -- §9.8's weight, per row, defaulting to a blank rather than to a number:
  -- a blank counts as the average of the weights that WERE set, which is
  -- §243 in Islam's own words and is reused rather than re-decided.
  weight numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, project_id) REFERENCES portfolio_projects (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT portfolio_phase_name CHECK (btrim(name) <> ''),
  CONSTRAINT portfolio_phase_weight CHECK (weight IS NULL OR weight >= 0)
);
CREATE INDEX portfolio_phases_project ON portfolio_phases (tenant_id, project_id, pos);

-- Optional level between a phase and its activities.
CREATE TABLE portfolio_work_packages (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL,
  name text NOT NULL,
  pos integer NOT NULL DEFAULT 0,
  weight numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, phase_id) REFERENCES portfolio_phases (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT portfolio_wp_name CHECK (btrim(name) <> ''),
  CONSTRAINT portfolio_wp_weight CHECK (weight IS NULL OR weight >= 0)
);
CREATE INDEX portfolio_work_packages_phase ON portfolio_work_packages (tenant_id, phase_id, pos);

-- THE WORKING UNIT, and where everything that matters lives (§3).
--
-- TWO NULLABLE PARENTS AND A CONSTRAINT SAYING EXACTLY ONE IS SET (§7.6).
-- Theirs has the two columns and nothing saying so, which is the row that
-- section opens with.
CREATE TABLE portfolio_activities (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phase_id uuid,
  work_package_id uuid,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  deliverables text NOT NULL DEFAULT '',
  pos integer NOT NULL DEFAULT 0,
  weight numeric,
  -- PLANNED, then REAL. The two real ones are written by ONE chokepoint
  -- (`stampDates`, lib/portfolio.ts) and by nothing else: theirs has four
  -- copies of that arithmetic and the live ones disagree about whether a
  -- date snaps to Sunday (§7, their trap 4).
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  -- ONE DEPENDENCY (§5), so the graph is a forest of chains and the cascade
  -- preview is a walk. Self-referencing, within the tenant.
  depends_on uuid,
  -- A register key, or a name kept as typed for somebody outside it — which
  -- comes free, because SMP's plan rows already keep a stored value the
  -- register does not hold rather than guessing (§96.2, §130.7).
  assignee_key text,
  assignee_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'not_started',
  progress smallint NOT NULL DEFAULT 0,
  -- TWO FLAGS, AND THEIR THIRD IS NOT PORTED (§5, §9.9): `trigger_invoice`
  -- is an agreement's fact, and decision 2 deleted the agreement.
  is_milestone boolean NOT NULL DEFAULT false,
  is_billable boolean NOT NULL DEFAULT false,
  -- Who accepted it, and when — the second half of §3 №1. Cleared on a
  -- reopen, exactly as actual_end is.
  signed_off_by text NOT NULL DEFAULT '',
  signed_off_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, phase_id) REFERENCES portfolio_phases (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, work_package_id) REFERENCES portfolio_work_packages (tenant_id, id) ON DELETE CASCADE,
  -- A dependency going away does not take the row that depended on it: the
  -- activity stands, its chain simply stops (§7.6's cascade lesson).
  FOREIGN KEY (tenant_id, depends_on) REFERENCES portfolio_activities (tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT portfolio_activity_name CHECK (btrim(name) <> ''),
  CONSTRAINT portfolio_activity_parent CHECK ((phase_id IS NULL) <> (work_package_id IS NULL)),
  CONSTRAINT portfolio_activity_status CHECK (status IN ('not_started','in_progress','done','completed')),
  CONSTRAINT portfolio_activity_progress CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT portfolio_activity_weight CHECK (weight IS NULL OR weight >= 0),
  CONSTRAINT portfolio_activity_self_dep CHECK (depends_on IS NULL OR depends_on <> id),
  CONSTRAINT portfolio_activity_window CHECK (planned_start IS NULL OR planned_end IS NULL OR planned_end >= planned_start),
  -- AN ACTIVITY WITH NO REAL END DATE IS NOT COUNTED AT ALL (§7.6, §9.11),
  -- which is why the pair must stay honest: a real end without a real start
  -- is a row nothing could have produced.
  CONSTRAINT portfolio_activity_actual CHECK (actual_end IS NULL OR actual_start IS NOT NULL),
  CONSTRAINT portfolio_activity_signed CHECK (status = 'completed' OR (signed_off_at IS NULL AND actual_end IS NULL))
);
CREATE INDEX portfolio_activities_phase ON portfolio_activities (tenant_id, phase_id, pos);
CREATE INDEX portfolio_activities_wp ON portfolio_activities (tenant_id, work_package_id, pos);
-- What the sign-off queue and the landing read (§9.10, §9.13).
CREATE INDEX portfolio_activities_owed ON portfolio_activities (tenant_id, status, planned_end);

-- The weighted breakdown that drives an activity's progress (§3 №3).
-- Nobody reads this as a list: it exists to work out the percentage.
CREATE TABLE portfolio_sub_activities (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL,
  name text NOT NULL,
  pos integer NOT NULL DEFAULT 0,
  -- By weight only if the SET sums to 100, otherwise by a plain count
  -- (`progressFromSubs`). Their own schema comment says the weights must sum
  -- to 100 and nothing enforces it; nothing enforces it here either, and the
  -- fallback is the honest answer to a half-filled set rather than a refusal
  -- that would strand a plan mid-edit.
  weight numeric,
  status text NOT NULL DEFAULT 'todo',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES portfolio_activities (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT portfolio_sub_name CHECK (btrim(name) <> ''),
  CONSTRAINT portfolio_sub_status CHECK (status IN ('todo','in_progress','done')),
  CONSTRAINT portfolio_sub_weight CHECK (weight IS NULL OR (weight >= 0 AND weight <= 100))
);
CREATE INDEX portfolio_sub_activities_activity ON portfolio_sub_activities (tenant_id, activity_id, pos);

-- Supporting people on an activity — whom it TAGS, as against whom it is
-- assigned to. The distinction is the whole of §6.2's last line: whether a
-- Contributor reports or only comments is read off the ACTIVITY and never
-- from the membership.
CREATE TABLE portfolio_collaborators (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  activity_id uuid NOT NULL,
  person_key text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, activity_id, person_key),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES portfolio_activities (tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, person_key) REFERENCES people (tenant_id, key) ON DELETE CASCADE
);

-- THE THREE WORDS, PER CLIENT (§9.1, answered 2026-09-17). One client calls
-- it a Phase, another a Wave. Theirs is keyed per (agreement, scope) and
-- decision 2 deletes that key; a faithful port would have been per project,
-- and one client calling a Phase two things in two projects is the confusion
-- the feature removes.
--
-- IT COULD NOT RIDE SMP'S `labels` TABLE, and why is the part worth keeping:
-- that is Strategy's own fixed vocabulary, read by six frozen sources and
-- run in a vm by lib/frozen.cjs to answer the landing — so a Portfolio row
-- put there would be hydrated into the frozen product's readers on every
-- request and travel into the plan workbook.
CREATE TABLE portfolio_terminology (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  phase_word text NOT NULL DEFAULT 'Phase',
  package_word text NOT NULL DEFAULT 'Work package',
  activity_word text NOT NULL DEFAULT 'Activity',
  updated_by text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- A singleton per client, keyed by the tenant ALONE (§316.7: `FROM org
  -- WHERE id = 1` named a column the shared schema does not have, and every
  -- chat request answered "Something went wrong").
  PRIMARY KEY (tenant_id)
);

-- NAMED AND NOT BUILT, so nobody reads the absence as an oversight (§5):
-- portfolio_phase_groups (optional above phases — dropping it degrades the
-- roll-up to a plain phase list and changes nothing else, and their own
-- version is 642 lines of CRUD admin screen), portfolio_comments,
-- portfolio_comment_mentions, portfolio_comment_reactions, portfolio_files
-- and portfolio_history. Each arrives with the screen that reads it; a table
-- ahead of its screen is a column nothing writes (§294.2).

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
                            'platform_access','tenant_log','push_keys','memory_entries',
                            'frameworks','_migrations')
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
