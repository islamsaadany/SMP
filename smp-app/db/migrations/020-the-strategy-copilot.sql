/* The Strategy Copilot — chats and deliverables, per client (spec 064)

   The four tables for a database already up: schema.sql runs ONCE and is
   recorded, so a deployment already up never sees a table added there
   (§33.5). IF NOT EXISTS because on a FRESH database schema.sql creates them
   first and this file meets them in the same transaction (migration 011's own
   note). It fences them itself, for 012's reason: the loop at the end of
   schema.sql is not re-run on a database already up. The policy text is the
   loop's own, copied, and checks/copilot.mjs asserts the two spellings are
   IDENTICAL by reading them back from the catalogue (§94.8). Old Copilot data
   is not carried (decision record v0.4, Islam's "start empty"). */

CREATE TABLE IF NOT EXISTS copilot_chats (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  -- The product's own place word (§54): `group`, `co:<k>`, a unit key,
  -- `fn:<k>`, `cap:<id>`.
  place text NOT NULL,
  section text NOT NULL,
  title text NOT NULL,
  -- What "assume for me" recorded on this chat (decisions §3.3), carried onto
  -- anything saved from it. Written by stage 2; stored empty until then.
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- The Advisory question budget (decisions §5): questions asked, the round.
  budget jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT copilot_chat_section CHECK (section IN ('foundation','analysis','directions','execution','advisory')),
  CONSTRAINT copilot_chat_title CHECK (btrim(title) <> '')
);
CREATE INDEX IF NOT EXISTS copilot_chats_shelf ON copilot_chats (tenant_id, place, section, last_at DESC);

-- Appended, never edited: what was said is the record of how a deliverable
-- came to be (decisions §3.6).
CREATE TABLE IF NOT EXISTS copilot_messages (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  chat_id uuid NOT NULL,
  who text NOT NULL,
  by_key text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  -- What the screen draws specially (playback, draft, an offer, an
  -- assumption, pasted material). NULL is a plain message.
  part jsonb,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, chat_id) REFERENCES copilot_chats (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT copilot_message_who CHECK (who IN ('person','ai'))
);
CREATE INDEX IF NOT EXISTS copilot_messages_chat ON copilot_messages (tenant_id, chat_id, id);

CREATE TABLE IF NOT EXISTS copilot_deliverables (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  place text NOT NULL,
  section text NOT NULL,
  type text NOT NULL DEFAULT 'free',
  kind text NOT NULL DEFAULT 'copilot-only',
  title text NOT NULL,
  -- The approach recorded when the place was not set up yet (decisions §4.3).
  approach text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, id),
  CONSTRAINT copilot_deliverable_section CHECK (section IN ('foundation','analysis','directions','execution','advisory')),
  CONSTRAINT copilot_deliverable_kind CHECK (kind IN ('promotable','copilot-only')),
  CONSTRAINT copilot_deliverable_title CHECK (btrim(title) <> '')
);
CREATE INDEX IF NOT EXISTS copilot_deliverables_shelf ON copilot_deliverables (tenant_id, place, section);

-- A version is never edited or deleted: an edit and a restore each ADD one
-- (decisions §3.6, §3.7). `chat_id` carries NO foreign key on purpose — a
-- chat may be deleted by whoever started it, and the version it produced is
-- the record and must outlive it; the chat's title is kept beside it.
CREATE TABLE IF NOT EXISTS copilot_versions (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id bigserial,
  deliverable_id uuid NOT NULL,
  n integer NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text NOT NULL DEFAULT '',
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  chat_id uuid,
  chat_title text NOT NULL DEFAULT '',
  restored_from integer,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  pasted boolean NOT NULL DEFAULT false,
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, deliverable_id) REFERENCES copilot_deliverables (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT copilot_version_n UNIQUE (tenant_id, deliverable_id, n),
  CONSTRAINT copilot_version_positive CHECK (n >= 1)
);

CREATE INDEX IF NOT EXISTS copilot_chats_tenant ON copilot_chats (tenant_id);
CREATE INDEX IF NOT EXISTS copilot_messages_tenant ON copilot_messages (tenant_id);
CREATE INDEX IF NOT EXISTS copilot_deliverables_tenant ON copilot_deliverables (tenant_id);
CREATE INDEX IF NOT EXISTS copilot_versions_tenant ON copilot_versions (tenant_id);

ALTER TABLE copilot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_chats FORCE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE copilot_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_deliverables FORCE ROW LEVEL SECURITY;
ALTER TABLE copilot_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_versions FORCE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['copilot_chats', 'copilot_messages', 'copilot_deliverables', 'copilot_versions'] LOOP
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
