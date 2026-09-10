/* A DEVICE THAT CHANGES HANDS MUST MOVE, NOT MULTIPLY (§231, §316.7)

   The frozen table keys a push subscription on its ENDPOINT alone — one
   endpoint, one row — and `pushOn` upserts `ON CONFLICT (endpoint) DO UPDATE
   SET person_key = EXCLUDED.person_key`, which is how a shared laptop signed
   in to by somebody else stops notifying the person who had it before.

   The shared schema's rule is "the key it has today, with tenant_id in front
   of it" (schema.sql, data-model.md). This table was written
   `(tenant_id, person_key, endpoint)`, which is not that: it lets the SAME
   endpoint hold a row per person, so the upsert inserts instead of moving and
   the old person's notifications keep arriving on a device that is no longer
   theirs. Found by pressing the endpoint rather than by reading the file —
   Postgres refused the conflict target outright ("there is no unique or
   exclusion constraint matching the ON CONFLICT specification"), which is the
   loud half; the quiet half is what would have happened had the target been
   loosened to match.

   The person is still indexed — every read is by person — and nothing else
   about the table moves. */
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_pkey;
DELETE FROM push_subscriptions a
 USING push_subscriptions b
 WHERE a.tenant_id = b.tenant_id AND a.endpoint = b.endpoint
   AND a.seen_at < b.seen_at;
ALTER TABLE push_subscriptions ADD PRIMARY KEY (tenant_id, endpoint);
CREATE INDEX IF NOT EXISTS push_subscriptions_person ON push_subscriptions (tenant_id, person_key);
