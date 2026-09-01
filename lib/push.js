/* ══ THE ONE PLACE A NOTIFICATION LEAVES THE PLATFORM (§231) ═══════════════

   §225 drew a box from the browser, and it only ever appeared while the SMP
   tab was the tab you were looking at — measured: 45 seconds in the
   background, zero requests and zero boxes, then both boxes at once on
   coming back, which is the moment they are worth nothing. The cause was a
   decision made long before it (§98.1): the chat stops asking the server
   entirely while `document.hidden`, so the database can sleep instead of
   being kept awake by a tab somebody left open on Friday. That was right for
   a badge you see next time you look. It is exactly wrong for a
   notification, whose whole job is to reach somebody who is NOT looking.

   So the browser stops asking and the SERVER sends. This is that send.

   MIRRORS `lib/mailer.js` DELIBERATELY (§72, §97.5): one module, the only
   place the credential is read, nothing it returns or throws contains it,
   and it knows nothing about who anybody is — it takes a subscription and a
   payload. Deciding WHO may be written to is the caller's, resolved against
   the stored register (§74.2).

   WHY A DEPENDENCY, WHEN §72 REFUSED ONE FOR THE ASSISTANT. That refusal was
   right: talking to Gemini is one POST and an SDK would have been a hundred
   files to spell `fetch`. Web push is not one POST. RFC 8291 is an ECDH key
   agreement, an HKDF, an AES-128-GCM record with padding, and RFC 8292 is an
   ES256 JWT beside it — and every one of those is silently wrong in the same
   way, which is that nothing arrives and nothing says why. The deciding fact
   is that THIS SANDBOX CANNOT REACH A PUSH SERVICE, so hand-rolled crypto
   here could never be tested against the thing it has to satisfy; `web-push`
   is the reference implementation of both RFCs, and what is then left to
   test is our own plumbing, which is testable. Stated rather than hidden. */

/* ── LOADED LAZILY, AND ITS ABSENCE IS NOT AN OUTAGE (§231.3) ──────────
   THIS WAS A TOP-LEVEL `require`, AND api/chat.js REQUIRES THIS FILE AT ITS
   OWN TOP LEVEL — so anything that stopped the library loading took the WHOLE
   CHAT ENDPOINT down with it, and §197's corner is revealed only by a
   SUCCESSFUL answer, so the bubble simply never appeared. Islam: "the chat
   bubble disappeared!"

   A notification helper must never be able to do that. §104's rule, one
   module out: no key, a refusal, a timeout and the switch off all land on the
   chat exactly as it worked before the assistant existed — and "the package
   did not load" belongs in that list. It degrades to no push, never to no
   conversation. */
let webpush = null;
let webpushWhy = "";
function lib() {
  if (webpush) return webpush;
  if (webpushWhy) return null;                 /* already tried, already failed */
  try { webpush = require("web-push"); }
  catch (e) { webpushWhy = (e && e.message) || "web-push did not load"; return null; }
  return webpush;
}

/* ── THE KEY PAIR (§231.1) ────────────────────────────────────────────
   Generated ONCE per deployment and kept in the database, not in the
   environment — with an environment override for anybody who would rather
   hold it themselves.

   IN THE DATABASE BECAUSE THE ALTERNATIVE IS A SETUP STEP NOBODY CAN DO.
   The platform already applies its own schema, its own migrations and its
   own seed on first contact with an empty database (nobody runs SQL by
   hand); a feature that instead required somebody to generate a key pair on
   a laptop and paste two strings into Vercel would be a feature that is off
   on every deployment until an engineer visits. It is the same reasoning
   that put the bootstrap SMO in the schema rather than in a runbook.

   WHAT THAT COSTS, SAID PLAINLY: a dump of the database now contains a key
   that could send a notification to a subscribed device. That is a far
   smaller thing than what is already in there — password hashes, live
   session tokens — and it is the same trust boundary, not a new one. It
   cannot read anything, and it cannot reach a device that has not
   subscribed.

   `push_keys` sits OUTSIDE the state graph, beside `credentials`, because a
   save TRUNCATEs the thirty tables of the graph CASCADE (§56) and a key that
   a save could erase would take every subscription with it. */
const KEYS_SQL =
  "CREATE TABLE IF NOT EXISTS push_keys (" +
  "  id         INT PRIMARY KEY DEFAULT 1," +
  "  public_key TEXT NOT NULL," +
  "  private_key TEXT NOT NULL," +
  "  made_at    TIMESTAMPTZ NOT NULL DEFAULT now()," +
  "  CONSTRAINT push_keys_one_row CHECK (id = 1))";

/* The subject a push service is given so it can reach whoever operates this
   deployment if something goes wrong. A URL or a mailto:, and it must be one
   or the other — a bare address is refused by the library, and by the
   services. */
function subject() {
  const raw = String(process.env.VAPID_SUBJECT || "").trim();
  if (/^(https?:|mailto:)/i.test(raw)) return raw;
  if (raw.indexOf("@") > 0) return "mailto:" + raw;
  return "mailto:strategy-office@example.com";
}

/* Memoised for the life of the process, the way `ensureReady` is (§98.3):
   this is read on every message and it never changes. */
let CACHED = null;

async function keys(client) {
  if (CACHED) return CACHED;

  /* THE ENVIRONMENT WINS WHERE IT IS SET, so a deployment that would rather
     hold its own keys can, and nothing about the code path changes. */
  const pub = String(process.env.VAPID_PUBLIC_KEY || "").trim();
  const priv = String(process.env.VAPID_PRIVATE_KEY || "").trim();
  if (pub && priv) return (CACHED = { publicKey: pub, privateKey: priv, from: "env" });

  await client.query(KEYS_SQL);
  const row = (await client.query("SELECT public_key, private_key FROM push_keys WHERE id = 1")).rows[0];
  if (row) {
    return (CACHED = { publicKey: row.public_key, privateKey: row.private_key, from: "db" });
  }
  /* MINTED UNDER A RACE THAT CANNOT MATTER. Two cold functions can generate
     two pairs at the same moment; `ON CONFLICT DO NOTHING` means the first
     one to land is the one everybody uses, and the loser's pair is simply
     dropped — which is why the row is READ BACK rather than assumed. A pair
     that reached no device is nothing. */
  const wp = lib();
  if (!wp) throw new Error(webpushWhy);
  const made = wp.generateVAPIDKeys();
  await client.query(
    "INSERT INTO push_keys (id, public_key, private_key) VALUES (1,$1,$2) ON CONFLICT (id) DO NOTHING",
    [made.publicKey, made.privateKey]);
  const now = (await client.query("SELECT public_key, private_key FROM push_keys WHERE id = 1")).rows[0];
  return (CACHED = { publicKey: now.public_key, privateKey: now.private_key, from: "db" });
}

/* THE PUBLIC HALF IS PUBLIC — it is handed to every browser that subscribes,
   which is what it is for. The private half never leaves this module. */
async function publicKey(client) {
  try { return (await keys(client)).publicKey; }
  catch (e) { return ""; }
}

/* ── SENDING ──────────────────────────────────────────────────────────
   ONE PAYLOAD SHAPE, and it is the same two facts every other box in the
   product carries: who wrote, and the first line (§225, Islam's wording B).
   The service worker renders it; nothing here draws anything.

   A DEAD SUBSCRIPTION IS DROPPED, NOT RETRIED. A push service answers 404 or
   410 for a device that has uninstalled the app, cleared its site data or
   simply expired the endpoint — that is the service telling us the device is
   gone, and keeping the row would mean sending to it for ever. Any OTHER
   failure leaves the row alone: a 500 from Apple is about Apple. */
async function sendTo(client, subs, payload) {
  if (!subs || !subs.length) return { sent: 0, dropped: 0, failed: 0 };
  let k;
  try { k = await keys(client); }
  catch (e) { return { sent: 0, dropped: 0, failed: subs.length, why: "no key pair" }; }

  const wp = lib();
  if (!wp) return { sent: 0, dropped: 0, failed: subs.length, why: webpushWhy };
  wp.setVapidDetails(subject(), k.publicKey, k.privateKey);
  const body = JSON.stringify(payload);
  let sent = 0, dropped = 0, failed = 0;
  const gone = [];

  await Promise.all(subs.map(async function (s) {
    try {
      await wp.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        /* TTL: a message that has been sitting undelivered for a day is not
           news any more, and the person will see it in the conversation. */
        { TTL: 3600, urgency: "normal" });
      sent++;
    } catch (err) {
      const code = err && err.statusCode;
      if (code === 404 || code === 410) { gone.push(s.endpoint); dropped++; }
      else failed++;
    }
  }));

  if (gone.length) {
    try {
      await client.query("DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[])", [gone]);
    } catch (e) { /* the row stays and is dropped next time; never fatal */ }
  }
  return { sent: sent, dropped: dropped, failed: failed };
}

/* Every device a person has said yes on. One row per device, keyed by the
   endpoint, which is what a push service gives out and what identifies it. */
async function subsOf(client, personKey) {
  if (!personKey) return [];
  return (await client.query(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE person_key = $1",
    [personKey])).rows;
}

/* And every device belonging to anybody in the office — the half §225 had to
   ask the server for, because the office's corner is their OWN conversation
   and could never speak for the queue. The roles are named by the shared
   rules module, never by a second list here (§89, §42). */
async function officeSubs(client, exceptKey) {
  const Rules = require("./rules.js");
  const rows = (await client.query(
    "SELECT s.endpoint, s.p256dh, s.auth, s.person_key, p.role " +
    "  FROM push_subscriptions s JOIN people p ON p.key = s.person_key " +
    " WHERE COALESCE(p.extra->>'active','true') <> 'false'")).rows;
  return rows.filter(function (r) {
    if (exceptKey && r.person_key === exceptKey) return false;
    return Rules.isOfficeRole(r.role);
  });
}

module.exports = { publicKey, sendTo, subsOf, officeSubs, KEYS_SQL };
