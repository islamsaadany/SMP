/* Portfolio — the delivery plan, per client (spec 056 §5)

   The eight tables for a database already up: schema.sql runs ONCE and is
   recorded, so a deployment already up never sees a table added there
   (§33.5). IF NOT EXISTS because on a FRESH database schema.sql creates them
   first and this file meets them in the same transaction (migration 011's own
   note).

   AND IT FENCES THEM ITSELF, for 011's reason: the loop at the end of
   schema.sql is not re-run on a database that is already up, so without these
   lines the tables would exist UNFENCED on production and fenced on every
   fresh one. The policy text is the loop's own, copied, and
   checks/portfolio.mjs asserts the two spellings are IDENTICAL by reading
   them back from the catalogue (§94.8). Every statement is idempotent.

   NOTHING IS BACKFILLED AND NOTHING IS DROPPED. Portfolio is `built: false`
   in lib/modules.ts, so no client holds it and these tables open empty on
   every deployment — which is why there is no data step here and no
   migration blocker: §7.6 names one (their duplicate phase numbers, which a
   MySQL unique index over nullable columns never constrained), and it
   belongs to the carry in §9.7 rather than to this file. */

-- The plan's parent, and the charter it is described by (§5.1). Decision 2
-- in one table: what was a (client, agreement, scope) triple is one object
-- this module owns outright, and the tenants row is the only thing borrowed.
CREATE TABLE IF NOT EXISTS portfolio_projects (
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
CREATE INDEX IF NOT EXISTS portfolio_projects_tenant ON portfolio_projects (tenant_id, name);

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
CREATE TABLE IF NOT EXISTS portfolio_members (
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
CREATE INDEX IF NOT EXISTS portfolio_members_person ON portfolio_members (tenant_id, person_key);

-- Phase, numbered by position, under a project.
CREATE TABLE IF NOT EXISTS portfolio_phases (
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
CREATE INDEX IF NOT EXISTS portfolio_phases_project ON portfolio_phases (tenant_id, project_id, pos);

-- Optional level between a phase and its activities.
CREATE TABLE IF NOT EXISTS portfolio_work_packages (
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
CREATE INDEX IF NOT EXISTS portfolio_work_packages_phase ON portfolio_work_packages (tenant_id, phase_id, pos);

-- THE WORKING UNIT, and where everything that matters lives (§3).
--
-- TWO NULLABLE PARENTS AND A CONSTRAINT SAYING EXACTLY ONE IS SET (§7.6).
-- Theirs has the two columns and nothing saying so, which is the row that
-- section opens with.
CREATE TABLE IF NOT EXISTS portfolio_activities (
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
CREATE INDEX IF NOT EXISTS portfolio_activities_phase ON portfolio_activities (tenant_id, phase_id, pos);
CREATE INDEX IF NOT EXISTS portfolio_activities_wp ON portfolio_activities (tenant_id, work_package_id, pos);
-- What the sign-off queue and the landing read (§9.10, §9.13).
CREATE INDEX IF NOT EXISTS portfolio_activities_owed ON portfolio_activities (tenant_id, status, planned_end);

-- The weighted breakdown that drives an activity's progress (§3 №3).
-- Nobody reads this as a list: it exists to work out the percentage.
CREATE TABLE IF NOT EXISTS portfolio_sub_activities (
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
CREATE INDEX IF NOT EXISTS portfolio_sub_activities_activity ON portfolio_sub_activities (tenant_id, activity_id, pos);

-- Supporting people on an activity — whom it TAGS, as against whom it is
-- assigned to. The distinction is the whole of §6.2's last line: whether a
-- Contributor reports or only comments is read off the ACTIVITY and never
-- from the membership.
CREATE TABLE IF NOT EXISTS portfolio_collaborators (
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
CREATE TABLE IF NOT EXISTS portfolio_terminology (
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

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_members FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_phases FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_work_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_work_packages FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_activities FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sub_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sub_activities FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_collaborators FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_terminology FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['portfolio_projects', 'portfolio_members', 'portfolio_phases', 'portfolio_work_packages', 'portfolio_activities', 'portfolio_sub_activities', 'portfolio_collaborators', 'portfolio_terminology'] LOOP
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
