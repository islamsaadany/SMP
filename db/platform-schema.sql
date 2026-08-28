-- ── THE PLATFORM SCHEMA ────────────────────────────────────────────────
-- Forefront's own world: the client registry, the office's accounts, which
-- clients each of them works on, the table that decides who may do what, and
-- the door's sessions and rate limiting.
--
-- WHY IT IS A SCHEMA OF ITS OWN, AND NOT A SET OF TABLES BESIDE A CLIENT'S.
-- POST /api/state TRUNCATEs a client's thirty-odd tables CASCADE on every
-- save. Anything that must outlive a save lives outside the state graph
-- (constitution XI) — and everything in this file must outlive every save of
-- every client, because it is what decides who is allowed to make one.
--
-- WHY A SCHEMA PER CLIENT AT ALL (§36.2, spec 024). readState and writeState
-- move a whole client's graph in one go, so the boundary can be one statement:
-- SET search_path. A tenant COLUMN would touch every query, insert, migration
-- and uniqueness constraint in the product, and §36.3's trap is fatal to it —
-- person keys are short and global (`smo`, `ceo`), so every client wants the
-- same key and credentials/sessions would need composite keys everywhere.
--
-- Idempotent by construction (CREATE TABLE IF NOT EXISTS): applied on every
-- cold start, exactly as db/schema.sql is for a client.

CREATE TABLE IF NOT EXISTS _platform_migrations (
  name       text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- ── The registry ───────────────────────────────────────────────────────
-- THE ONLY PLACE A SCHEMA NAME IS DECIDED. A request names a client by its
-- slug; the server reads the schema name from this row and never builds one
-- from the request, or the address bar becomes a way to name a schema (§36.4).
CREATE TABLE IF NOT EXISTS clients (
  key         text PRIMARY KEY,              -- the slug in the address: raya-trade
  name        text NOT NULL,                 -- what the cards and the chrome say
  schema_name text NOT NULL UNIQUE,          -- raya_trade — derived once, never after
  industry    text NOT NULL DEFAULT '',
  notes       text NOT NULL DEFAULT '',
  mark        text,                          -- data URI, PNG only (§52: an SVG is executable content)
  colors      jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- ONE COLUMN HOLDING THE WORD, never a boolean beside it (§104.7): a second
  -- kind of client later is a new value, not a second column and a rule about
  -- which of them wins.
  kind        text NOT NULL DEFAULT 'client',
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_kind CHECK (kind IN ('client','demo')),
  CONSTRAINT clients_status CHECK (status IN ('active','retired'))
);

-- ── The office ─────────────────────────────────────────────────────────
-- KEYED BY EMAIL, because sign-in happens BEFORE a client is chosen, so the
-- password cannot live inside one (research.md §2). Islam, 2026-08-28:
-- "access only through email ... no access through user name SMO in any place."
--
-- The hashing, must_change, and everything the door does with them are §43's,
-- moved schema rather than rewritten.
CREATE TABLE IF NOT EXISTS accounts (
  email         text PRIMARY KEY,            -- lower-cased by whoever writes it
  name          text NOT NULL DEFAULT '',
  -- NOTHING UNTIL GRANTED (Islam's answer): a person with no role signs in and
  -- sees an empty platform. That is deliberately not a floor role — there is
  -- nothing to configure about somebody who holds nothing (§93 from the other
  -- side), so this is nullable rather than defaulted to the weakest role.
  role          text,
  password_hash text NOT NULL,
  must_change   boolean NOT NULL DEFAULT true,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounts_role CHECK (role IS NULL OR role IN ('admin','lead','consultant','observer')),
  CONSTRAINT accounts_status CHECK (status IN ('active','retired'))
);

-- ── Which clients are MINE, and who I am inside them ───────────────────
-- "My clients" is DERIVED from this table (constitution V) — the cards, the
-- access matrix and the client's own register all answer from it, and there is
-- no second list to drift.
--
-- person_key is the row this account IS inside that client's register. It is
-- written when the account joins the team, and it is what lets every rule that
-- already reads the register keep working untouched (research.md §4).
CREATE TABLE IF NOT EXISTS account_clients (
  email       text NOT NULL REFERENCES accounts (email) ON DELETE CASCADE,
  client_key  text NOT NULL REFERENCES clients (key) ON DELETE CASCADE,
  person_key  text NOT NULL,
  is_super    boolean NOT NULL DEFAULT false,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, client_key)
);

-- A CLIENT WITH TWO SUPER USERS IS A CLIENT WHERE NOBODY CAN SAY WHO HOLDS THE
-- ACCESS MATRIX. Enforced here rather than remembered in a handler.
CREATE UNIQUE INDEX IF NOT EXISTS account_clients_one_super
  ON account_clients (client_key) WHERE is_super;

CREATE INDEX IF NOT EXISTS account_clients_client ON account_clients (client_key);

-- ── Who sees what (§37's matrix, one level up) ─────────────────────────
-- Roles down, areas across, each cell none/view/edit. Only what has been
-- CHANGED is stored: a saved map is merged over the defaults in
-- lib/platform-rules.js, never substituted (§30.2) — an area added later is
-- absent from a map written before it existed, and reading absent as `none`
-- would hide every new thing from everyone who ever touched the table.
CREATE TABLE IF NOT EXISTS platform_access (
  role_key text NOT NULL,
  area_key text NOT NULL,
  grant_   text NOT NULL,
  PRIMARY KEY (role_key, area_key),
  CONSTRAINT platform_access_grant CHECK (grant_ IN ('none','view','edit'))
);

-- ── The door ───────────────────────────────────────────────────────────
-- Today's shapes, keyed on email instead of person_key. The 30-day life, the
-- httpOnly cookie, the thresholds and the check-BEFORE-verify order are all
-- §43's and are unchanged.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_email ON sessions (email);

CREATE TABLE IF NOT EXISTS login_attempts (
  id        bigserial PRIMARY KEY,
  at        timestamptz NOT NULL DEFAULT now(),
  key_tried text,
  ip        text
);
CREATE INDEX IF NOT EXISTS login_attempts_key ON login_attempts (key_tried, at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip  ON login_attempts (ip, at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_at  ON login_attempts (at DESC);

-- ── Who was in which client ────────────────────────────────────────────
-- A client's own change_log records what was DONE inside it. This records that
-- an office account was THERE — which that log cannot, because a client's save
-- truncates its own tables and because opening a client changes nothing.
CREATE TABLE IF NOT EXISTS client_log (
  id         bigserial PRIMARY KEY,
  at         timestamptz NOT NULL DEFAULT now(),
  email      text NOT NULL,
  client_key text NOT NULL,
  what       text NOT NULL DEFAULT 'open'
);
CREATE INDEX IF NOT EXISTS client_log_client ON client_log (client_key, at DESC);
