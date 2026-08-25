/* ── TALKING TO THE STRATEGY OFFICE (§95) ─────────────────────────────────
   Islam: "can we have some sort of a chat but on the platform where on the
   bottom right they have this … they open the chat and they send a message
   there and they have a conversation with one of our team … so it sounds like
   a chat, people chatting, sending messages, and picks the people and replies
   to them."

   ITS OWN ENDPOINT, for the reason §71 gave and this inherits: `/api/state`
   writes the strategy graph, authorises every field against who you are (§42),
   and TRUNCATEs thirty tables to do it. A conversation is none of those
   things — it is raised by somebody who may hold no role at all, and it must
   survive every save.

   WHO MAY DO WHAT, and it is shorter than §71's because the unit is now the
   PERSON rather than the ticket:
     write        anybody signed in, into their own conversation and no other.
     read own     anybody. There is exactly one conversation that is theirs.
     read all     the OFFICE — isOfficeRole(), so Super user AND SMO team
                  (§89). Asked through lib/rules.js, never spelled out here:
                  a second copy of "who is the office" is the drift that file
                  exists to prevent (§42).
     reply        the office, into anybody's.
     flag         the office. Nobody classifies their own question.

   THE OFFICE TEST IS THE SEAT ROLE, AND THAT IS ENOUGH HERE. `super` and
   `smoteam` are both seat roles, stored on `people.role` and returned by
   getSession() — so this endpoint answers "is this the office" without reading
   thirty tables to build a world. A responsibility role (owner, custodian)
   could never make somebody the office, so nothing is missed by not looking.
   ──────────────────────────────────────────────────────────────────────── */
const auth = require("../lib/auth.js");
const pg = require("pg");
const io = require("../lib/state-io.js");
const Rules = require("../lib/rules.js");
const Audience = require("../lib/audience.js");
const mailer = require("../lib/mailer.js");
const { ensureReady } = io;
function getPool() { return io.getPool(pg); }

/* §71's caps, unchanged: the client already shrinks a picture to 1600px and
   keeps the smaller of PNG and JPEG, so this is the backstop for a client that
   did not — never the only limit. A chat line is shorter than a bug report. */
const MAX_SHOT = 3 * 1024 * 1024;
const MAX_TEXT = 4000;
const FLAGS = ["issue", "idea", "question"];

/* HOW LONG SOMEBODY COUNTS AS "HERE" (§95.5). Their own browser stamps
   here_at every time it asks for new messages — 4 seconds while the panel is
   open, 60 while it is not — so 3 minutes is comfortably longer than the slow
   cadence plus a missed beat, and short enough that a closed laptop stops
   counting as present within one coffee. */
const HERE_MINUTES = 3;

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let s = "";
    req.on("data", function (c) {
      s += c;
      /* Refused while it arrives, not after: a body read to the end and then
         rejected has already cost the memory it was meant to protect. */
      if (s.length > MAX_SHOT + 64 * 1024) { reject(new Error("too large")); req.destroy(); }
    });
    req.on("end", function () { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}
const str = function (v, max) {
  return String(v == null ? "" : v).trim().slice(0, max || MAX_TEXT);
};

/* The columns every message is read through, in one string, because the list
   is asked for in three places and a column added to two of them is the bug
   nobody sees until a message renders without its picture. */
const MSG_COLS =
  "id, at, from_office, by_key, by_name, body, page, target, cycle, build, flag, " +
  "(shot IS NOT NULL) AS has_shot";

/* A thread is made on first contact and never before: a person who has never
   written to the office has no row, which is what makes "who is waiting" a
   list of real conversations rather than a list of everybody. */
async function ensureThread(client, key, name) {
  await client.query(
    "INSERT INTO chat_threads (person_key, person_name) VALUES ($1,$2) " +
    "ON CONFLICT (person_key) DO UPDATE SET person_name = COALESCE(EXCLUDED.person_name, chat_threads.person_name)",
    [key, name || null]);
}

/* THE PERSON'S OWN VIEW. One conversation, every message in it, and a count of
   what they have not read — which is what the bubble carries. */
async function mine(client, me) {
  const t = (await client.query(
    "SELECT person_key, waiting, seen_by_them, last_at FROM chat_threads WHERE person_key = $1",
    [me.key])).rows[0];
  if (!t) return { ok: true, thread: null, messages: [], unread: 0 };
  const msgs = (await client.query(
    "SELECT " + MSG_COLS + " FROM chat_messages WHERE person_key = $1 ORDER BY at, id",
    [me.key])).rows;
  const unread = msgs.filter(function (m) {
    return m.from_office && (!t.seen_by_them || new Date(m.at) > new Date(t.seen_by_them));
  }).length;
  return { ok: true, thread: { waiting: t.waiting, lastAt: t.last_at }, messages: msgs, unread: unread };
}

module.exports = async function handler(req, res) {
  let client;
  try {
    client = await getPool().connect();
    await ensureReady(client);
    const body = req.method === "POST" ? await readBody(req) : {};
    const action = body.action || (req.method === "GET" ? "mine" : "");
    const me = await auth.getSession(client, req);
    if (!me) return send(res, 401, { ok: false, error: "sign in first" });
    /* IDENTITY BEFORE ANYTHING ELSE (§43.2). A temporary password buys a
       session and nothing a session is for; the chat is no exception. */
    if (me.mustChange) return send(res, 403, { ok: false, error: "choose a password first" });
    const office = Rules.isOfficeRole(me.role);

    /* ── WHAT THE PERSON'S OWN PANEL ASKS FOR ─────────────────────────
       And the one thing it writes without being told to: `here_at`, which is
       the whole of the presence test the email rule reads (§95.5). Stamped on
       the POLL rather than on a send, because being present is about looking
       at the screen, not about having typed. */
    if (action === "mine") {
      await client.query(
        "UPDATE chat_threads SET here_at = now() WHERE person_key = $1", [me.key]);
      const out = await mine(client, me);
      out.office = office;
      return send(res, 200, out);
    }

    /* Everything the person has now read. Their own thread only — there is no
       id to pass, which is the shape of "one conversation per person" showing
       up in the endpoint rather than being enforced by it. */
    if (action === "seen") {
      await client.query(
        "UPDATE chat_threads SET seen_by_them = now(), here_at = now() WHERE person_key = $1",
        [me.key]);
      return send(res, 200, { ok: true });
    }

    if (action === "say") {
      const text = str(body.body);
      const shot = body.shot ? String(body.shot) : null;
      if (!text && !shot) return send(res, 400, { ok: false, error: "Nothing to send." });
      if (shot && shot.length > MAX_SHOT) {
        return send(res, 400, { ok: false, error: "That picture is too large even after shrinking." });
      }
      /* A data URI or nothing. A `shot` that is a URL would make the office's
         page fetch whatever the sender pointed it at — the page renders this
         into an <img>, and that is somebody else's server learning who opened
         it (§71). */
      if (shot && !/^data:image\/(png|jpeg|webp);base64,/.test(shot)) {
        return send(res, 400, { ok: false, error: "That is not a picture this can store." });
      }
      await ensureThread(client, me.key, me.name);
      await client.query(
        "INSERT INTO chat_messages (person_key, from_office, by_key, by_name, body, " +
        "                           page, target, cycle, build, shot) " +
        "VALUES ($1,false,$2,$3,$4,$5,$6,$7,$8,$9)",
        [me.key, me.key, me.name || null, text,
         str(body.page, 120), str(body.target, 120), str(body.cycle, 120),
         str(body.build, 60), shot]);
      /* WAITING GOES BACK ON WHEN THEY WRITE, whatever it was. A conversation
         the office marked answered is not answered any more the moment the
         person says something else, and nobody should have to notice. */
      /* NOT `here_at`. Presence is stamped by the POLL and by nothing else —
         being present is about looking at the screen, not about having typed,
         and a second place that sets it is a second rule to keep true. It
         costs nothing in the product, where the panel cannot be open without
         polling every four seconds; it is only visible to something that
         writes without ever looking, which is exactly the case the rule is
         supposed to call away. `seen_by_them` moves, though: nobody has
         unread messages at the moment they send one. */
      await client.query(
        "UPDATE chat_threads SET waiting = true, last_at = now(), " +
        "       seen_by_them = now() WHERE person_key = $1", [me.key]);
      return send(res, 200, await mine(client, me));
    }

    /* ── THE OFFICE'S SIDE ────────────────────────────────────────────
       Everything below is refused to everybody else with one sentence, and it
       is the same sentence: naming which of the two roles somebody lacks tells
       an outsider the shape of the office. */
    if (!office) return send(res, 403, { ok: false, error: "The Strategy Office answers these." });

    /* THE QUEUE IS PEOPLE, NOT TICKETS (§95.2). Two groups, and the last line
       of each conversation so a name has something under it. */
    if (action === "queue") {
      const rows = (await client.query(
        "SELECT t.person_key, t.person_name, t.waiting, t.last_at, t.here_at, " +
        "       p.name AS live_name, p.unit_key, p.fn_key, p.title, " +
        "       (p.key IS NULL) AS gone, " +
        "       (SELECT count(*) FROM chat_messages m " +
        "         WHERE m.person_key = t.person_key AND NOT m.from_office " +
        "           AND (t.seen_by_us IS NULL OR m.at > t.seen_by_us)) AS unread, " +
        "       (SELECT m.body FROM chat_messages m WHERE m.person_key = t.person_key " +
        "         ORDER BY m.at DESC, m.id DESC LIMIT 1) AS last_body, " +
        "       (SELECT m.from_office FROM chat_messages m WHERE m.person_key = t.person_key " +
        "         ORDER BY m.at DESC, m.id DESC LIMIT 1) AS last_from_office, " +
        "       (SELECT m.by_name FROM chat_messages m WHERE m.person_key = t.person_key " +
        "         ORDER BY m.at DESC, m.id DESC LIMIT 1) AS last_by, " +
        /* HOW MANY FLAGS ARE ON THIS CONVERSATION, so the third filter is a
           filter over the SAME list rather than a second kind of list with a
           different row in it. A flag is put on a message and read off a
           person, which is the shape the office already works in. */
        "       (SELECT count(*) FROM chat_messages m " +
        "         WHERE m.person_key = t.person_key AND m.flag IS NOT NULL) AS flagged " +
        "FROM chat_threads t LEFT JOIN people p ON p.key = t.person_key " +
        "ORDER BY t.waiting DESC, t.last_at DESC LIMIT 300")).rows;
      return send(res, 200, {
        ok: true, office: true, threads: rows,
        waiting: rows.filter(function (r) { return r.waiting; }).length,
        flagged: rows.filter(function (r) { return +r.flagged > 0; }).length,
        hereMinutes: HERE_MINUTES,
        /* WHETHER THIS DEPLOYMENT CAN MAIL AT ALL, so the line above the reply
           box says "no mail is configured here" rather than promising a send
           that was never going to happen. */
        mail: mailer.configured()
      });
    }

    if (action === "thread") {
      const who = str(body.person, 120);
      if (!who) return send(res, 400, { ok: false, error: "Which conversation?" });
      const t = (await client.query(
        "SELECT t.*, p.name AS live_name, p.extra AS extra, p.unit_key, p.fn_key, p.title " +
        "FROM chat_threads t LEFT JOIN people p ON p.key = t.person_key " +
        "WHERE t.person_key = $1", [who])).rows[0];
      if (!t) return send(res, 404, { ok: false, error: "No conversation with that person." });
      const msgs = (await client.query(
        "SELECT " + MSG_COLS + " FROM chat_messages WHERE person_key = $1 ORDER BY at, id",
        [who])).rows;
      await client.query(
        "UPDATE chat_threads SET seen_by_us = now() WHERE person_key = $1", [who]);
      const here = t.here_at && (Date.now() - new Date(t.here_at).getTime()) < HERE_MINUTES * 60000;
      return send(res, 200, {
        ok: true, person: who, name: t.live_name || t.person_name,
        gone: !t.live_name, unit: t.unit_key, fn: t.fn_key, title: t.title,
        address: Audience.addressOf(t.extra || {}),
        waiting: t.waiting, here: !!here, hereAt: t.here_at,
        mail: mailer.configured(), messages: msgs
      });
    }

    /* The picture, asked for by itself. It is three orders of magnitude larger
       than the rest of a row, and a queue of forty would otherwise carry forty
       images to draw forty one-line rows (§71). */
    if (action === "shot") {
      const r = (await client.query(
        "SELECT person_key, shot FROM chat_messages WHERE id = $1", [body.id])).rows[0];
      if (!r || !r.shot) return send(res, 404, { ok: false, error: "No picture there." });
      return send(res, 200, { ok: true, shot: r.shot });
    }

    if (action === "reply") {
      const who = str(body.person, 120);
      const text = str(body.body);
      if (!who) return send(res, 400, { ok: false, error: "Which conversation?" });
      if (!text) return send(res, 400, { ok: false, error: "Nothing to send." });
      const t = (await client.query(
        "SELECT here_at FROM chat_threads WHERE person_key = $1", [who])).rows[0];
      if (!t) return send(res, 404, { ok: false, error: "No conversation with that person." });

      await client.query(
        "INSERT INTO chat_messages (person_key, from_office, by_key, by_name, body) " +
        "VALUES ($1,true,$2,$3,$4)", [who, me.key, me.name || null, text]);
      /* ANSWERED BY THE ACT, not by remembering to set it — the status nobody
         sets is the status somebody has to remember (§71). */
      await client.query(
        "UPDATE chat_threads SET waiting = false, last_at = now(), seen_by_us = now() " +
        "WHERE person_key = $1", [who]);

      /* ── AND THE ONE THING THAT LEAVES THE PLATFORM (§95.5) ────────
         Only if they are not here. The decision is made HERE and reported
         back, because the office was shown which way it would go before
         pressing Send and the two must agree — a screen that predicts and a
         server that decides separately is the drift lib/rules.js exists to
         prevent, one endpoint further out.

         THE ADDRESS IS RESOLVED ON THE SERVER, from the stored register,
         never taken from the browser (§74.2). The browser sends the HTML it
         built with the one builder every other message uses (§72.3) — content,
         never a recipient. */
      const here = t.here_at && (Date.now() - new Date(t.here_at).getTime()) < HERE_MINUTES * 60000;
      let mailed = null;
      if (!here && body.html) {
        const p = (await client.query(
          "SELECT name, extra FROM people WHERE key = $1 " +
          "  AND COALESCE(extra->>'active','true') <> 'false'", [who])).rows[0];
        const addr = p ? Audience.addressOf(p.extra || {}) : "";
        if (!addr) mailed = { sent: false, why: "no address on the register" };
        else if (!mailer.configured()) mailed = { sent: false, why: "no mail is configured here" };
        else {
          try {
            const id = await mailer.sendOne({
              to: addr,
              fromName: str(body.fromName, 120),
              replyTo: str(body.replyTo, 200),
              subject: str(body.subject, 200) || "A reply from the Strategy Office",
              html: String(body.html)
            });
            mailed = { sent: !!id, to: addr, why: id ? null : "no mail is configured here" };
          } catch (e) {
            /* A FAILED EMAIL IS NOT A FAILED REPLY. The message is already in
               the conversation and the person will see it the moment they
               open the platform; what the office needs is to be told the
               chase did not go out, not to have the reply rejected. */
            mailed = { sent: false, why: e.resend ? e.message : "could not reach the mail service" };
          }
        }
      }
      return send(res, 200, { ok: true, here: !!here, mailed: mailed });
    }

    /* THE OFFICE'S OWN CLASSIFICATION, per message, and it toggles: this is
       where §71's issue / idea / question went, moved off the person who
       should not have to sort their own question to be allowed to ask it. */
    if (action === "flag") {
      const f = body.flag == null ? null : String(body.flag);
      if (f !== null && FLAGS.indexOf(f) < 0) return send(res, 400, { ok: false, error: "Not a flag." });
      await client.query("UPDATE chat_messages SET flag = $1 WHERE id = $2", [f, body.id]);
      return send(res, 200, { ok: true });
    }

    /* NOTHING TO SAY BACK IS AN ANSWER. A conversation that needs no reply
       still has to leave the waiting list, or the queue fills with things
       already dealt with and stops meaning anything. */
    if (action === "answered") {
      const who = str(body.person, 120);
      await client.query(
        "UPDATE chat_threads SET waiting = $2, seen_by_us = now() WHERE person_key = $1",
        [who, body.waiting === true]);
      return send(res, 200, { ok: true });
    }

    /* THE WHOLE CONVERSATION, AND IT IS THE SUPER USER'S ALONE. Retiring is
       reversible and deleting is not (§89's mayDestroy) — asked through the
       shared rule rather than spelled out, and the pictures are the reason it
       exists at all: a conversation nobody needs any more should not keep
       three megabytes of screenshots for ever (§71). */
    if (action === "drop") {
      if (!Rules.isSuperRole(me.role)) {
        return send(res, 403, { ok: false, error: "Removing a conversation is the Super user's." });
      }
      await client.query("DELETE FROM chat_threads WHERE person_key = $1", [str(body.person, 120)]);
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500,
                { ok: false, error: e.message === "too large" ? "Too large." : "Something went wrong." });
  } finally {
    if (client) client.release();
  }
};
