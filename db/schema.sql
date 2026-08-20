-- SMP schema — the §4 hierarchy plus configuration and the cycle, as tables.
-- Idempotent by construction (CREATE TABLE IF NOT EXISTS): applied on every
-- cold start, harmless on every one after the first. A migrations registry
-- arrives when this schema first CHANGES; creating it before then would be
-- machinery with nothing to record.
--
-- Two standing rules carried into the shape:
--   · Derived figures are never stored (§5.1). These tables hold what was
--     AUTHORED and what was REPORTED; every score is computed on read.
--   · Stable ids are the keys (§4 Identity). Names are display only.
-- Each entity carries an `extra` JSONB for provenance and display fields
-- (source_slide, notes, legacy figures), so a round trip loses nothing.

CREATE TABLE IF NOT EXISTS org (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  org_name      text NOT NULL,
  horizon       text NOT NULL DEFAULT '',
  as_of_quarter int  NOT NULL DEFAULT 2,
  aspiration    text NOT NULL DEFAULT '',
  end_in_mind   text NOT NULL DEFAULT '',
  mission       text NOT NULL DEFAULT '',
  extra         jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS group_clauses (
  idx   int PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  text_ text NOT NULL DEFAULT '',
  cid   text
);

CREATE TABLE IF NOT EXISTS group_key_objectives (
  idx      int PRIMARY KEY,
  id       text,
  name     text NOT NULL DEFAULT '',
  grp      text,
  dir      text NOT NULL DEFAULT '≥',
  target3y text,
  target   text,
  compile  text,
  actual   text,
  progress numeric,
  extra    jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS themes (
  idx  int PRIMARY KEY,
  ab   text NOT NULL,
  name text NOT NULL DEFAULT '',
  note text,
  extra jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS capabilities (
  id     text PRIMARY KEY,
  idx    int NOT NULL,
  name   text NOT NULL DEFAULT '',
  def    text NOT NULL DEFAULT '',
  fn_key text,
  extra  jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS cap_key_objectives (
  id       text PRIMARY KEY,
  cap_id   text NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  idx      int NOT NULL,
  name     text NOT NULL DEFAULT '',
  dir      text NOT NULL DEFAULT '≥',
  target   text,
  compile  text,
  weight   numeric,
  actual   text,
  progress numeric,
  note     text,
  extra    jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS projects (
  id           text PRIMARY KEY,
  cap_id       text NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  idx          int NOT NULL,
  name         text NOT NULL DEFAULT '',
  brief        text NOT NULL DEFAULT '',
  owner        text NOT NULL DEFAULT '',
  timeline     text NOT NULL DEFAULT 'quarter',
  start_label  text NOT NULL DEFAULT '',
  end_label    text NOT NULL DEFAULT '',
  stakeholders jsonb,
  extra        jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS deliverables (
  id         text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idx        int NOT NULL,
  name       text NOT NULL DEFAULT '',
  kind       text NOT NULL DEFAULT 'binary',
  due        text,
  owner      text,
  actual     text,
  note       text,
  extra      jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS outcomes (
  id         text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idx        int NOT NULL,
  name       text NOT NULL DEFAULT '',
  dir        text NOT NULL DEFAULT '≥',
  target     text,
  measure_at text,
  actual     text,
  progress   numeric,
  note       text,
  extra      jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS milestones (
  id         text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idx        int NOT NULL,
  name       text NOT NULL DEFAULT '',
  covers     text,
  owner      text,
  finish     text,
  status     text,
  note       text,
  extra      jsonb NOT NULL DEFAULT '{}'
);

-- Companies (§15.13). A layer between the group and the business unit: a
-- group of units, each with its own CEO. In this version it is VISIBILITY,
-- not strategy — no score, no page — so it holds only its name and the two
-- flags that decide what its CEO reaches.
CREATE TABLE IF NOT EXISTS companies (
  key         text PRIMARY KEY,
  idx         int NOT NULL,
  name        text NOT NULL DEFAULT '',
  ceo         text,
  see_others  boolean NOT NULL DEFAULT false,
  see_group   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS units (
  key         text PRIMARY KEY,
  idx         int NOT NULL,
  -- A unit belongs to a company or is its own — never neither. NULL is the
  -- explicit "its own company", which the Setup table names in words so an
  -- empty cell can never read as somebody having forgotten.
  company     text,
  name        text NOT NULL DEFAULT '',
  nav_name    text,
  code_prefix text NOT NULL DEFAULT '',
  active      boolean NOT NULL DEFAULT true,
  real        boolean NOT NULL DEFAULT false,
  aspiration  text NOT NULL DEFAULT '',
  end_in_mind text NOT NULL DEFAULT '',
  extra       jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS unit_clauses (
  unit_key text NOT NULL REFERENCES units(key) ON DELETE CASCADE,
  idx      int NOT NULL,
  label    text NOT NULL DEFAULT '',
  text_    text NOT NULL DEFAULT '',
  cid      text,
  PRIMARY KEY (unit_key, idx)
);

CREATE TABLE IF NOT EXISTS unit_key_objectives (
  id       text PRIMARY KEY,
  unit_key text NOT NULL REFERENCES units(key) ON DELETE CASCADE,
  idx      int NOT NULL,
  name     text NOT NULL DEFAULT '',
  dir      text NOT NULL DEFAULT '≥',
  target3y text,
  target   text,
  compile  text,
  actual   text,
  progress numeric,
  note     text,
  extra    jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS swot_items (
  unit_key text NOT NULL REFERENCES units(key) ON DELETE CASCADE,
  cat      text NOT NULL CHECK (cat IN ('s','w','o','t')),
  idx      int NOT NULL,
  text_    text NOT NULL DEFAULT '',
  PRIMARY KEY (unit_key, cat, idx)
);

CREATE TABLE IF NOT EXISTS pillars (
  id       text PRIMARY KEY,
  unit_key text NOT NULL REFERENCES units(key) ON DELETE CASCADE,
  idx      int NOT NULL,
  code     text,
  name     text NOT NULL DEFAULT '',
  sub      text,
  kind     text NOT NULL DEFAULT 'Direction',
  theme    text,
  owner    text,
  extra    jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS measures (
  id        text PRIMARY KEY,
  pillar_id text NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  idx       int NOT NULL,
  name      text NOT NULL DEFAULT '',
  dir       text NOT NULL DEFAULT '≥',
  target    text,
  target3y  text,
  compile   text,
  actual    text,
  progress  numeric,
  note      text,
  horizon   text,
  extra     jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS tactics (
  id            text PRIMARY KEY,
  pillar_id     text NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  idx           int NOT NULL,
  name          text NOT NULL DEFAULT '',
  owner         text,
  collaborators jsonb,
  q1 boolean NOT NULL DEFAULT false,
  q2 boolean NOT NULL DEFAULT false,
  q3 boolean NOT NULL DEFAULT false,
  q4 boolean NOT NULL DEFAULT false,
  status        text,
  actual        numeric,
  note          text,
  extra         jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS functions (
  key         text PRIMARY KEY,
  idx         int NOT NULL,
  name        text NOT NULL DEFAULT '',
  nav_name    text,
  code_prefix text,
  head        text,
  custodian   text,
  active      boolean NOT NULL DEFAULT true,
  extra       jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS people (
  key      text PRIMARY KEY,
  idx      int NOT NULL,
  name     text NOT NULL DEFAULT '',
  level    text NOT NULL DEFAULT '',
  unit_key text,
  fn_key   text,
  title    text,
  extra    jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS unit_roles (
  unit_key  text PRIMARY KEY,
  head      text,
  custodian text
);

CREATE TABLE IF NOT EXISTS levels (
  key    text PRIMARY KEY,
  idx    int NOT NULL,
  name   text NOT NULL DEFAULT '',
  titles text,
  note   text,
  extra  jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS access_grants (
  level_key text NOT NULL,
  page_key  text NOT NULL,
  grant_    text NOT NULL CHECK (grant_ IN ('none','view','edit')),
  PRIMARY KEY (level_key, page_key)
);

CREATE TABLE IF NOT EXISTS labels (
  key      text PRIMARY KEY,
  idx      int NOT NULL,
  internal text NOT NULL DEFAULT '',
  grp      text,
  bu       text,
  note     text,
  extra    jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS bands (
  idx   int PRIMARY KEY,
  key   text NOT NULL,
  floor int NOT NULL,
  label text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS weighting_factors (
  key    text PRIMARY KEY,
  idx    int NOT NULL,
  name   text NOT NULL DEFAULT '',
  kind   text NOT NULL DEFAULT 'judgement',
  basis  text,
  weight numeric NOT NULL DEFAULT 0,
  extra  jsonb NOT NULL DEFAULT '{}'
);

-- One row per unit per factor; `why` (the written reason for the judgement
-- factor) lives on weighting_rows, once per unit.
CREATE TABLE IF NOT EXISTS weighting_values (
  unit_key   text NOT NULL,
  factor_key text NOT NULL,
  value      numeric,
  PRIMARY KEY (unit_key, factor_key)
);

CREATE TABLE IF NOT EXISTS weighting_rows (
  unit_key  text PRIMARY KEY,
  idx       int NOT NULL,
  unit_name text,
  why       text,
  extra     jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ko_weights (
  unit_key text PRIMARY KEY,
  weights  jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS cycle (
  id        int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name      text NOT NULL DEFAULT '',
  reward_at numeric NOT NULL DEFAULT 100,
  locked    boolean NOT NULL DEFAULT false,
  focus     jsonb NOT NULL DEFAULT '{}',
  extra     jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS review (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name          text NOT NULL DEFAULT '',
  from_label    text NOT NULL DEFAULT '',
  to_label      text NOT NULL DEFAULT '',
  due_label     text NOT NULL DEFAULT '',
  ends_quarter  int  NOT NULL DEFAULT 2,
  state         text NOT NULL DEFAULT 'open',
  cadence       text,
  notes         jsonb NOT NULL DEFAULT '{}',
  submitted     jsonb NOT NULL DEFAULT '{}',
  extra         jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS history (
  idx         int PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  group_score numeric,
  units       jsonb NOT NULL DEFAULT '{}',
  extra       jsonb NOT NULL DEFAULT '{}'
);

-- The prior cycle's factor split, shown beside the new one on Weighting.
CREATE TABLE IF NOT EXISTS prior_cycle (
  id    int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data  jsonb NOT NULL DEFAULT '{}'
);

-- Archived plans (§22). An upload authors a plan and archives the one it
-- displaces, so nothing an import does is a deletion. The snapshot is the
-- whole plan as the platform held it, reported figures included, kept as one
-- document because it is restored as one.
CREATE TABLE IF NOT EXISTS plan_archives (
  id        text PRIMARY KEY,
  idx       integer NOT NULL,
  kind      text NOT NULL,
  key       text NOT NULL,
  name      text NOT NULL,
  at_label  text,
  by_name   text,
  why       text,
  counts    jsonb,
  plan      jsonb NOT NULL
);
