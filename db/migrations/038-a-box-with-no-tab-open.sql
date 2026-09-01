-- ── A BOX THAT ARRIVES WITH NO TAB OPEN (§231) ─────────────────────────
-- Islam, having turned §225's notifications on and received nothing: "I
-- didn't get any notifications despite enabling the notifications." His bell
-- was on, his browser had allowed them, the company switch was on.
--
-- Measured rather than guessed: 45 seconds with the SMP tab in the
-- background produced ZERO requests to the server and zero boxes, and both
-- boxes appeared at once the instant the tab came back — the one moment they
-- are worth nothing. §98.1 stops the chat's clock dead while `document.hidden`
-- so the database can sleep overnight instead of being kept awake by a tab
-- somebody left open on Friday. Right for a badge you see next time you look;
-- exactly wrong for a notification, whose whole job is to reach somebody who
-- is not looking. §225 was built on top of that and never noticed.
--
-- So the browser stops asking and the SERVER sends. This is where the devices
-- that have said yes are kept.
--
-- ONE ROW PER DEVICE, KEYED BY THE ENDPOINT. A person has a laptop and a
-- phone and both may say yes; the endpoint is what the push service hands out
-- and what identifies the device, so it is the key — and re-subscribing the
-- same device replaces its row rather than adding a second (ON CONFLICT in
-- the endpoint that writes it). The person's own switch IS this row: turning
-- the bell off deletes it, which is why there is no `on` column to disagree
-- with the switch (§104.7, and §50.6's rule that a preference is stored as an
-- absence).
--
-- OUTSIDE THE STATE GRAPH, beside `credentials` and `chat_threads`. A save
-- TRUNCATEs the graph's thirty tables CASCADE (§56); a subscription that a
-- save could erase would silence every device in the tenant the first time
-- anybody edited a plan, and nothing would say so.
--
-- AND NO FOREIGN KEY TO `people`, for the same reason `bu_declarations` has
-- none: that table IS in the graph, so a cascade would take these with it.
-- A row whose person is gone is swept when the send finds no such person, and
-- `officeSubs` joins to the live register rather than trusting this table to
-- know who still works here.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint    TEXT PRIMARY KEY,
  person_key  TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  made_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_person ON push_subscriptions (person_key);

-- The deployment's own key pair, minted on first use and read on every send.
-- Kept here rather than in the environment because the alternative is a setup
-- step nobody can perform: this platform already applies its own schema, its
-- own migrations and its own seed on first contact with an empty database, and
-- a feature that instead needed somebody to generate a key pair on a laptop
-- and paste two strings into Vercel would be a feature that is OFF on every
-- deployment until an engineer visits.
--
-- WHAT IT COSTS, SAID: a dump of this database now contains a key that could
-- send a notification to a subscribed device. Smaller than what is already in
-- here — password hashes and live session tokens — and the same trust
-- boundary rather than a new one. It reads nothing and it reaches no device
-- that has not subscribed. VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in the
-- environment override it for anybody who would rather hold their own.
--
-- The CHECK is what makes "one pair per deployment" a fact about the table
-- rather than a promise in the code above it.
CREATE TABLE IF NOT EXISTS push_keys (
  id          INT PRIMARY KEY DEFAULT 1,
  public_key  TEXT NOT NULL,
  private_key TEXT NOT NULL,
  made_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_keys_one_row CHECK (id = 1)
);
