/* A file in a Copilot chat (spec 064 stage 2, plan §7.3)

   Islam: "Upload Word, PDF and Excel now." A file belongs to ITS CHAT and to
   nothing else — there is no library (decisions v0.4 §7) — so it cascades
   with the chat. `message_id` is NULL while the file sits above the composer
   waiting to be sent, and is set when the message carrying it is sent; a
   pending file left behind is removed with its chat. `text` is what was read
   out of a Word or Excel file (a PDF keeps none: it goes to the model as
   itself). Fenced here for 012's reason, the policy text the loop's own. */

CREATE TABLE IF NOT EXISTS copilot_files (
  tenant_id uuid NOT NULL DEFAULT NULLIF(current_setting('app.tenant_id', true), '')::uuid REFERENCES tenants (id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  message_id bigint,
  name text NOT NULL,
  kind text NOT NULL,
  size integer NOT NULL,
  bytes bytea NOT NULL,
  text text NOT NULL DEFAULT '',
  by_key text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, chat_id) REFERENCES copilot_chats (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT copilot_file_kind CHECK (kind IN ('pdf','docx','xlsx')),
  CONSTRAINT copilot_file_size CHECK (size > 0 AND size <= 3145728)
);
CREATE INDEX IF NOT EXISTS copilot_files_chat ON copilot_files (tenant_id, chat_id);
CREATE INDEX IF NOT EXISTS copilot_files_tenant ON copilot_files (tenant_id);

ALTER TABLE copilot_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_files FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
                 JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = current_schema() AND c.relname = 'copilot_files' AND p.polname = 'tenant_rows') THEN
    EXECUTE 'CREATE POLICY tenant_rows ON copilot_files FOR ALL USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)';
  END IF;
END $$;
