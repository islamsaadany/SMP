-- @phase: pre
-- ══ A MESSAGE YOU HAVE NOT SENT YET (§76) ══════════════════════════════
-- Islam: "allow me to save draft messages".
--
-- ITS OWN TABLE, NOT A FLAG ON `messages`. That table is the record of what
-- WAS SENT, and "what did we send in March" must not have to remember to say
-- "and not the ones we did not". A draft is a different thing with a different
-- lifetime: it is edited, it is deleted, and it stops existing the moment it
-- becomes a message.
--
-- Outside the state graph like everything else identity- or record-shaped
-- (§74.5): a save TRUNCATEs thirty tables CASCADE, and a draft erased by
-- somebody else pressing save is worse than no drafts at all. No foreign key
-- to people for the same reason.
--
-- NOT localStorage, deliberately: a draft is real work somebody typed, and a
-- screen preference is not (§25, §47.1). Written on a laptop it has to be there
-- on the desk.

CREATE TABLE IF NOT EXISTS message_drafts (
  id          BIGSERIAL PRIMARY KEY,
  by_key      TEXT NOT NULL,
  by_name     TEXT,
  subject     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  cta_label   TEXT,
  cta_href    TEXT,
  audience    JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_drafts_updated ON message_drafts (updated_at DESC);
