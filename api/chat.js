/* ── TALKING TO THE STRATEGY OFFICE (§97) ─────────────────────────────────
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
const assistant = require("../lib/assistant.js");
const push = require("../lib/push.js");

/* THE CORPUS IS READ ONCE PER PROCESS. It is a 70KB file that never changes
   between deploys, and §98.1's lesson was that per-request work nobody thinks
   about is what a poll turns into a bill. Failure is not cached: a deploy that
   somehow shipped without it should retry rather than be permanently mute. */
let KB = null;
function corpus() {
  if (KB) return KB;
  try { KB = require("../db/kb.json"); } catch (e) { return null; }
  return KB;
}

/* WHAT THE ASSISTANT IS CALLED, in one place. It is not a person key — §87's
   rule, and the reason migration 024 adds a column rather than reserving a
   name that a real person could one day be given. */
const ASSISTANT_NAME = "Assistant";

/* Escaping, for the one message this file composes itself. Everything else it
   sends was built in the browser and arrives escaped. */
function escHtml(t) {
  return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
const { ensureReady } = io;
const P = require("../lib/platform-io.js");
function getPool() { return io.getPool(pg); }

/* §71's caps, unchanged: the client already shrinks a picture to 1600px and
   keeps the smaller of PNG and JPEG, so this is the backstop for a client that
   did not — never the only limit. A chat line is shorter than a bug report. */
const MAX_SHOT = 3 * 1024 * 1024;
const MAX_TEXT = 4000;
const FLAGS = ["issue", "idea", "question"];

/* HOW LONG SOMEBODY COUNTS AS "HERE" (§97.5) IS THE TENANT'S NOW (§169).
   Their own browser stamps here_at every time it asks for new messages — 4
   seconds while the panel is open, 180 while it is not — and how long after
   the last of those they stop counting as present is `chatCfg().away`, set on
   the Away email row. It lives in `lib/rules.js` because the server decides
   `here` from it and the office's page explains it, and a constant here with
   a sentence there is two copies of one threshold (§53.5). */

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
/* THE FIRST LINE, for a notification (§225's wording B). One place, so the
   box the office gets and the box a person gets are trimmed identically
   (§53.5) — and it collapses whitespace, because a message typed with a
   blank line in it would otherwise arrive as a title with a gap under it. */
const firstLine = function (v) {
  const t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  return t.length > 120 ? t.slice(0, 119) + "\u2026" : t;
};

const str = function (v, max) {
  return String(v == null ? "" : v).trim().slice(0, max || MAX_TEXT);
};

/* The columns every message is read through, in one string, because the list
   is asked for in three places and a column added to two of them is the bug
   nobody sees until a message renders without its picture. */
/* `bot` and `source` travel with every message (§104): a reader that cannot
   tell an automated answer from a colleague's has no way to draw the
   difference, and the whole point of the column is that the difference is
   drawn. */
/* `emailed_to` joins them for §188 — the ONE place these columns are named,
   which is the whole reason that comment above exists: a column added to two
   of the three readers is the bug nobody sees until a message renders
   without the thing it was given. */
const MSG_COLS =
  "id, at, from_office, by_key, by_name, body, flag, bot, source, handoff, " +
  "emailed_to, (shot IS NOT NULL) AS has_shot";

/* ── WHAT THE OFFICE HAS SET ABOUT THE CHAT (§98) ───────────────────────
   ONE SMALL QUERY, not `readState()`. This endpoint has never read the
   strategy graph — it answers from the two chat tables and the session, which
   is why it is cheap enough to be asked every four seconds — and reading
   thirty tables to find five booleans would undo exactly the saving the
   settings exist to make. The five live in `org.extra` (§44's naming switch,
   the same place), and `SMPRules.chatCfg` is the ONE thing that decides what
   an absent key means, on this side and on the screen.

   AND THE SERVER HAS TO ASK AT ALL, which is the whole point of the setting:
   with the chat off, the browser simply does not draw the corner — and a
   switch that only hides a control is decoration (§42, §44). */
async function chatSettings(client) {
  const r = await client.query("SELECT extra FROM org WHERE id = 1");
  const extra = (r.rows[0] && r.rows[0].extra) || {};
  return Rules.chatCfg(extra.chat);
}

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

/* ── ASKING THE ASSISTANT ─────────────────────────────────────────────
   Returns `{answered, reply, source}` or null. NEVER THROWS: a caller that has
   already stored the person's message must not lose it to a provider having a
   bad afternoon (spec 016 §4.2). */
async function assistantAnswer(client, me, question) {
  const kb = corpus();
  if (!kb || !assistant.configured()) return null;
  try {
    /* The conversation so far, so a follow-up reads as one. Bounded, because
       an old thread is unbounded and the corpus is already 13k tokens. */
    const hist = (await client.query(
      "SELECT from_office, body FROM chat_messages WHERE person_key = $1 " +
      "ORDER BY at DESC, id DESC LIMIT 9", [me.key])).rows.reverse();
    /* The last row IS the question just stored; the model gets it as the
       question rather than twice. */
    hist.pop();
    const org = (await client.query("SELECT extra FROM org WHERE id = 1")).rows[0] || {};
    const labels = ((org.extra || {}).labels) || {};
    const out = await assistant.ask({
      /* The tenant's rewritten and added answers, laid over the shipped
         corpus by the same rule the page renders with (§140). */
      kb: assistant.withTenant(kb, (org.extra || {}).kb), question: question, history: hist,
      who: roleWord(me), labels: labels,
      /* The office's own operational answers are withheld from everybody else
         (2026-08-29). Asked of the SEAT, the same test roleWord() above uses,
         so the two can never describe the person differently. */
      isOffice: Rules.isOfficeRole(String((me && me.role) || ""))
    });
    /* VISIBLE TO THE OPERATOR, INVISIBLE TO THE PERSON (§133, §123's rule).
       The person's screen stays silent by design — §112.2 — but a failure
       nobody can see anywhere is how "it is not working" went undiagnosable
       twice. One line to the function log, which Vercel keeps and the chat
       does not: stores nothing, shows nothing, answers "why" when somebody
       finally looks. */
    if (!out || !out.ok) {
      console.error("assistant did not answer:", (out && out.why) || "no result");
      return null;
    }
    return out;
  } catch (e) {
    console.error("assistant did not answer:", (e && e.message) || e);
    return null;
  }
}

/* WHO IS ASKING, in the words the corpus uses — so the assistant can pick
   between two answers to one question (spec 016 §5.2b). READ FROM THE SESSION,
   never sent by the browser: it decides which answer somebody gets, and a
   value the client supplies is a value the client chooses. */
function roleWord(me) {
  const k = String((me && me.role) || "");
  if (Rules.isOfficeRole(k)) return "a member of the Strategy Office";
  if (k === "gceo" || k === "cceo") return "a chief executive";
  if (k === "owner") return "the head of a business unit";
  if (k === "custodian") return "a strategy custodian";
  if (k === "fnhead") return "the head of a supporting function";
  return "someone in the organisation";
}

/* ── TELLING A PERSON THAT A PERSON IS NEEDED (§104.4) ────────────────
   With the assistant answering most things, a handoff is the exception — and
   an exception nobody is told about is one nobody acts on. Sent at the moment
   it happens, because there is no scheduler on Vercel (§97.5 settled that).

   IT NEVER COSTS THE HANDOFF. The conversation is already waiting before this
   runs; a mail failure leaves it waiting, which is the correct state. */
async function tellTheOffice(client, me, text, cfg) {
  if (!cfg.notify || !cfg.rep) return;
  if (cfg.rep === me.key) return;          /* nobody is emailed about their own message */
  if (!mailer.configured()) return;
  try {
    const r = (await client.query(
      "SELECT name, extra FROM people WHERE key = $1", [cfg.rep])).rows[0];
    const to = r && Audience.addressOf(r.extra || {});
    if (!to) return;
    const who = (me.name || me.key);
    /* PLAIN, AND DELIBERATELY NOT THE TENANT'S BRANDED TEMPLATE. `MAIL.html`
       is a browser file (§72) and the office's reply is composed there, so it
       is out of reach here — but it should be anyway: that template exists for
       what the ORGANISATION looks like to somebody outside the platform, and
       this is an operational nudge to one person who works in it. Tables,
       inline styles and literal colours all the same, because email is not the
       web (§72). */
    await mailer.sendOne({
      to: to,
      subject: "A question is waiting: " + who,
      html: '<div style="font:15px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#1B2740">' +
            '<p style="margin:0 0 12px"><b>' + escHtml(who) + '</b> asked something the ' +
            'assistant could not answer.</p>' +
            '<blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid #C9A24D;' +
            'background:#F4F6FA;color:#3D4C68">' + escHtml(String(text || "").slice(0, 400)) +
            '</blockquote>' +
            '<p style="margin:0;color:#5E6E88">It is waiting in Setup &rsaquo; Running the ' +
            'cycle &rsaquo; Messages.</p></div>'
    });
  } catch (e) { /* a mail failure never costs the handoff */ }
}

module.exports = async function handler(req, res) {
  let client;
  try {
    /* WHICH CLIENT IS THIS FOR (spec 024). The browser sends the slug it was
       served at; the schema comes from the registry row, never from the
       request (§36.4). An unknown client and one this account may not open are
       the same refusal, so trying slugs tells nobody anything. */
    const body = req.method === "POST" ? await readBody(req) : {};
    client = await P.connectFor(pg, P.clientSlugFrom(req, body));
    await ensureReady(client, client._smpClient.schema_name);

    const action = body.action || (req.method === "GET" ? "mine" : "");
    const me = await auth.getSession(client, req, client._smpClient.key);
    if (!me) return send(res, 401, { ok: false, error: "sign in first" });
    /* IDENTITY BEFORE ANYTHING ELSE (§43.2). A temporary password buys a
       session and nothing a session is for; the chat is no exception. */
    if (me.mustChange) return send(res, 403, { ok: false, error: "choose a password first" });
    const office = Rules.isOfficeRole(me.role);
    const cfg = await chatSettings(client);

    /* ── WHAT THE PERSON'S OWN PANEL ASKS FOR ─────────────────────────
       And the one thing it writes without being told to: `here_at`, which is
       the whole of the presence test the email rule reads (§97.5). Stamped on
       the POLL rather than on a send, because being present is about looking
       at the screen, not about having typed. */
    if (action === "mine") {
      await client.query(
        "UPDATE chat_threads SET here_at = now() WHERE person_key = $1", [me.key]);
      const out = await mine(client, me);
      out.office = office;
      /* THE SETTINGS TRAVEL WITH THE POLL, so the corner never needs a second
         request to know how to draw itself — and so a switch flipped by the
         office reaches every open browser within one beat rather than on the
         next save. `beat` is the number, not the flag, because the number is
         what the client sets its clock to (§98). */
      out.chat = { on: cfg.on, shots: cfg.shots, promise: cfg.promise,
                   /* §225: NAMED HERE OR IT NEVER ARRIVES. This object lists
                      the keys it forwards, so a setting added to the rules and
                      not added here is silently dropped and the control it
                      draws never appears — §135's fault, where `greet` was
                      missing from the posted body and every stored row would
                      have said no message ever greeted anybody. */
                   popup: cfg.popup,
                   /* §231: THE PUBLIC HALF OF THE KEY TRAVELS WITH THE POLL,
                      like every other setting — the browser needs it to
                      subscribe and it is public by construction (it is handed
                      to every push service). Empty where none could be made,
                      which is what the corner reads to know push is not
                      available here rather than guessing. */
                   vapid: cfg.popup ? await push.publicKey(client) : "",
                   beat: Rules.chatBeat({ fast: cfg.fast }) };
      /* AND THE OFFICE IS TOLD HOW MANY ARE WAITING (§225). Their corner is
         the only thing that polls on EVERY page — the Platform Inbox's own
         clock stops the moment they navigate away (`boxBeat`) — so without
         this the office would only be notified of a new question while sitting
         on the page that already shows it, which is no notification at all.
         One COUNT for a handful of people, and only for the office: everybody
         else's poll is exactly as cheap as it was (§98). */
      if (office) {
        /* THE SAME TWO FACTS AS EVERYBODY ELSE'S BOX — who, and the first
           line (Islam's wording B) — so the office is not served a bare
           number where a person is served a sentence (§53.5). The newest
           waiting conversation is the one that just arrived. */
        const w = (await client.query(
          "SELECT count(*)::int AS n, " +
          "  (SELECT coalesce(p.name, t2.person_name, t2.person_key) " +
          "     FROM chat_threads t2 LEFT JOIN people p ON p.key = t2.person_key " +
          "    WHERE t2.waiting ORDER BY t2.last_at DESC LIMIT 1) AS who, " +
          "  (SELECT m.body FROM chat_threads t3 " +
          "     JOIN chat_messages m ON m.person_key = t3.person_key " +
          "    WHERE t3.waiting ORDER BY t3.last_at DESC, m.at DESC, m.id DESC " +
          "    LIMIT 1) AS body " +
          "FROM chat_threads WHERE waiting")).rows[0] || {};
        out.waiting = w.n | 0;
        out.waitingWho = w.who || null;
        out.waitingBody = w.body || null;
      }
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

    /* ── THIS DEVICE SAYS YES, OR STOPS (§231) ───────────────────────
       THE ROW IS THE SWITCH. There is no `on` column beside it to disagree
       with: a device that has said yes has a row, one that has not does not,
       and turning the bell off deletes it (§104.7, §50.6). That is also what
       makes the person's switch genuinely per device without anything having
       to remember which device is which.

       AND IT IS THE SIGNED-IN PERSON'S, never a key from the body. Taking
       `person` from the browser would let anybody subscribe their own phone
       to somebody else's conversation and read every reply that person is
       sent — the same rule that makes `/api/state` read the person off the
       session and never off the payload (§185). */
    /* ── IS IT WORKING? (§231.6) ──────────────────────────────────────
       §123 built exactly this for the assistant and gave the reason: "it is
       not working" sends somebody to look at everything, and naming the step
       sends them to one page. Notifications are the same shape and worse —
       four links, every one of them failing invisibly by design.

       IT MAKES A REAL SEND, because a chain that is only inspected is a chain
       nobody has walked: a key can be present and refused, a device
       registered and long gone. And it STORES NOTHING — it answers about this
       moment, and a stored answer goes stale where nobody can see it (§35). */
    if (action === "pushTest") {
      const steps = [];
      /* THE WORD IS THE STEP'S TO CHOOSE (§124): "present" is not "working",
         and a row that says the second about the first is the fault that
         section exists to record. */
      const step = function (name, state, detail, word) {
        steps.push({ name: name, state: state, detail: detail || null, word: word || null });
      };

      if (!cfg.on) {
        step("The chat", "off", "The whole chat is switched off, so nothing is sent.");
        return send(res, 200, { ok: true, steps: steps });
      }
      step("The chat", "ok", null, "on");

      if (!cfg.popup) {
        step("Notifications", "off",
             "Switched off for the company on this page. Nobody is notified.");
        return send(res, 200, { ok: true, steps: steps });
      }
      step("Notifications", "ok", "Switched on for the company.", "on");

      const h = await push.health(client, me.key);

      /* THE LIBRARY. It is loaded lazily precisely so its absence cannot take
         the chat down (§231.3) — which means its absence is now silent, and
         this is where it stops being silent. */
      if (!h.library) {
        step("The sending library", "fail",
             (h.libraryWhy || "It did not load.") +
             " Notifications cannot be sent until the deployment carries it.");
        return send(res, 200, { ok: true, steps: steps });
      }
      step("The sending library", "ok", null, "loaded");

      if (!h.key) {
        step("This platform's key", "fail",
             h.keyWhy || "No key pair could be made or read.");
        return send(res, 200, { ok: true, steps: steps });
      }
      step("This platform's key", "ok",
           (h.keyFrom === "env" ? "Set in the environment." : "Made by the platform itself.") +
           " Sending as " + h.subject + ".", "present");

      /* THIS DEVICE. A browser can allow notifications and still never have
         registered — a hang rather than a refusal, which is what §231.5 was
         about — so what is counted is what the SERVER holds, not what the
         browser believes. */
      if (!h.devices) {
        step("Your devices", "fail",
             (h.devicesWhy ? h.devicesWhy + " " : "") +
             "None of your devices is registered here. Open the conversation " +
             "in the corner and allow notifications, then press this again.");
        return send(res, 200, { ok: true, steps: steps });
      }
      step("Your devices", "ok",
           h.devices + (h.devices === 1 ? " device is registered." : " devices are registered."),
           String(h.devices));

      /* AND THE SEND ITSELF, to this person and nobody else — a diagnostic
         that could reach somebody else's screen is a diagnostic nobody should
         press. */
      const out = await push.sendTo(client, await push.subsOf(client, me.key), {
        title: "Strategy Office",
        body: "This is a test. Notifications are working on this device.",
        tag: "reply"
      });
      if (out.sent) {
        step("A box on your screen", "ok",
             "Sent to " + out.sent + (out.sent === 1 ? " device" : " devices") +
             (out.dropped ? ", and " + out.dropped + " that no longer exists was forgotten." : ".") +
             " If nothing appeared, the last step is your operating system: " +
             "check that this browser is allowed to show notifications there.",
             "sent");
      } else {
        step("A box on your screen", "fail",
             (out.why ? out.why + " " : "") +
             (out.dropped ? "Every registered device turned out to be gone and has been " +
                            "forgotten — allow notifications again in the corner. "
                          : "The push service would not take it. ") +
             "Nothing reached you.");
      }
      return send(res, 200, { ok: true, steps: steps });
    }

    if (action === "pushOn") {
      if (!cfg.on || !cfg.popup) {
        return send(res, 403, { ok: false, error: "Notifications are off for this platform." });
      }
      const sub = body.sub || {};
      const endpoint = str(sub.endpoint, 2000);
      const p256dh = str((sub.keys || {}).p256dh, 300);
      const auth2 = str((sub.keys || {}).auth, 300);
      if (!endpoint || !p256dh || !auth2) {
        return send(res, 400, { ok: false, error: "That is not a subscription this can store." });
      }
      /* A subscription must be a URL, and an https one: the endpoint is
         fetched by our own server, so anything else is somebody pointing it
         at a host of their choosing (§71's argument about a screenshot URL,
         one endpoint out). */
      if (!/^https:\/\//i.test(endpoint)) {
        return send(res, 400, { ok: false, error: "That is not a subscription this can store." });
      }
      /* THE SAME DEVICE RE-SUBSCRIBING REPLACES ITS ROW rather than adding a
         second — a browser re-issues the endpoint after clearing site data or
         a long absence, and two rows for one device is two boxes. */
      await client.query(
        "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4) " +
        "ON CONFLICT (endpoint) DO UPDATE SET person_key = EXCLUDED.person_key, " +
        "  p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, seen_at = now()",
        [endpoint, me.key, p256dh, auth2]);
      return send(res, 200, { ok: true });
    }

    if (action === "pushOff") {
      const endpoint = str((body.sub || {}).endpoint || body.endpoint, 2000);
      /* SCOPED TO THE SIGNED-IN PERSON, so a stale or guessed endpoint can
         only ever silence a device of their own. */
      if (endpoint) {
        await client.query(
          "DELETE FROM push_subscriptions WHERE endpoint = $1 AND person_key = $2",
          [endpoint, me.key]);
      }
      return send(res, 200, { ok: true });
    }

    if (action === "say") {
      /* THE SWITCH, ENFORCED WHERE IT COUNTS. With the chat off the corner is
         not drawn at all, so nothing in the product can reach this — which is
         exactly why it has to be here: the browser is not the thing being
         guarded against (§42). */
      if (!cfg.on) {
        return send(res, 403, { ok: false, error: "The chat is off at the moment." });
      }
      const text = str(body.body);
      /* A PICTURE THE OFFICE HAS TURNED OFF IS NOT STORED, and the refusal
         says so rather than silently dropping it — a message that arrived
         without the screenshot somebody attached is worse than one that was
         refused, because only the second tells them to say it in words. */
      if (body.shot && !cfg.shots) {
        return send(res, 400, { ok: false, error: "Screenshots are turned off for this platform." });
      }
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
      /* NOTHING ABOUT WHERE THEY WERE. §97 captured the page, the subject, the
         cycle and the build and drew them under the sender's own words; Islam
         asked for that gone everywhere rather than merely hidden, so it is not
         stored either — and migration 023 takes the four columns with it,
         because a column the platform no longer reads is worse than no column
         (§53.4). Anything a browser still posts is ignored here. */
      await client.query(
        "INSERT INTO chat_messages (person_key, from_office, by_key, by_name, body, shot) " +
        "VALUES ($1,false,$2,$3,$4,$5)",
        [me.key, me.key, me.name || null, text, shot]);
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

      /* ── THE ASSISTANT ANSWERS FIRST (§104, spec 016) ──────────────
         ORDER IS THE WHOLE ROBUSTNESS ARGUMENT. The message is INSERTED and
         the thread is ALREADY WAITING by the time this runs, so every way
         this can fail — no key, a refusal, a timeout, a malformed answer,
         the setting off — lands on exactly the chat as it worked before the
         assistant existed: the words are saved and a person answers them.
         Nothing a human typed is ever lost to the assistant failing.

         AND THE HANDOFF IS A FLAG, NEVER A SENTENCE. If it merely replied
         "the office will get back to you", the thread would read as answered
         and drop out of the queue — the person told somebody is coming and
         nobody is (spec 016 §4.1). So `answered` decides, and the words are
         only shown when it is true. */
      if (cfg.assistant) {
        const a = await assistantAnswer(client, me, text);
        /* SAYING NOTHING IS NOT A NEUTRAL OUTCOME (§125). A handoff used to
           write nothing at all, on the sound reasoning that a sentence would
           make the thread read as answered — and the person was left looking
           at a screen identical to the one they would see if the assistant had
           never run. §123's lesson one layer in.

           SO THE LINE IS THE PRODUCT'S, NEVER THE MODEL'S: §104's rule is that
           `answered` decides and the model's words are only shown when it is
           true, which is untouched. This is fixed text, and the thread STAYS
           WAITING, so the office's queue and the email below are unchanged and
           somebody still comes.

           AND ONLY FOR A REAL HANDOFF — `a` is null when the assistant could
           not be asked at all (no key, no corpus, a timeout, a refusal), and
           every one of those must go on landing exactly as the chat worked
           before the assistant existed (§112.2). Declining is a decision; the
           other four are not, and telling somebody the assistant considered
           their question when it never saw it would be a lie the operator
           cannot see. */
        if (a && !a.answered) {
          await client.query(
            "INSERT INTO chat_messages (person_key, from_office, bot, handoff, by_key, by_name, body) " +
            "VALUES ($1,true,true,true,$2,$3,$4)",
            [me.key, "assistant", ASSISTANT_NAME, assistant.HANDOFF_LINE]);
        }
        if (a && a.answered) {
          await client.query(
            "INSERT INTO chat_messages (person_key, from_office, bot, by_key, by_name, body, source) " +
            "VALUES ($1,true,true,$2,$3,$4,$5)",
            [me.key, "assistant", ASSISTANT_NAME, a.reply, a.source]);
          /* ANSWERED, so it leaves the office's Waiting list — Islam's own
             decision, with the cost stated when he made it: a wrong answer
             sits unnoticed until somebody complains, which is why every
             assistant answer carries a way out on the screen. */
          await client.query(
            "UPDATE chat_threads SET waiting = false, last_at = now() WHERE person_key = $1",
            [me.key]);
        }
      }
      /* A HANDOFF REACHES A PERSON (§104.4). Only when the conversation is
         still waiting — an answered one is not an exception and nobody needs
         telling about it. */
      const stillWaiting = (await client.query(
        "SELECT waiting FROM chat_threads WHERE person_key = $1", [me.key])).rows[0];
      if (stillWaiting && stillWaiting.waiting) await tellTheOffice(client, me, text, cfg);

      /* AND A BOX ON THE OFFICE'S OWN SCREENS, WITH NO TAB OPEN (§231).
         Only while the conversation is still waiting — the same condition the
         email chase already uses, so an assistant answer that settled it does
         not also go and interrupt somebody. Never back to the sender's own
         devices: they are the one person who knows this message exists.

         IT NEVER COSTS THE MESSAGE. The message is stored and the thread is
         already waiting before this runs (§104's ordering); a push service
         that is slow, unreachable or refusing leaves all of that exactly as
         it is, which is the correct state. */
      if (cfg.popup && stillWaiting && stillWaiting.waiting) {
        try {
          await push.sendTo(client, await push.officeSubs(client, me.key), {
            title: me.name || me.key,
            body: firstLine(text || "(a screenshot)"),
            tag: "office"
          });
        } catch (e) { /* a notification never costs the message it is about */ }
      }

      return send(res, 200, await mine(client, me));
    }

    /* ── THE OFFICE'S SIDE ────────────────────────────────────────────
       Everything below is refused to everybody else with one sentence, and it
       is the same sentence: naming which of the two roles somebody lacks tells
       an outsider the shape of the office. */
    if (!office) return send(res, 403, { ok: false, error: "The Strategy Office answers these." });

    /* ── IS THE BOT WORKING? (§123) ───────────────────────────────────
       Islam, having turned the assistant on and had nothing come back: "I need
       to understand if the bot is working."

       THE DEGRADATION WAS CORRECT AND SILENT, which is the fault. §112.2 made
       every failure land on the chat as it worked before — the message is
       stored and a person answers it — so no key, a rejected model, Google
       unreachable, and the assistant legitimately declining all look
       identical from the office's side: something arrives in the inbox and
       nothing explains itself. Right for the person asking; useless to the
       person who just turned it on.

       SO IT WALKS THE CHAIN AND REPORTS WHERE IT STOPS, rather than answering
       yes or no. "It is not working" sends somebody to look at everything;
       "the key is missing" sends them to one page. Each step is checked in the
       order the real path uses them, and the first failure ends the walk —
       reporting a model error under a missing key would be noise.

       IT MAKES A REAL CALL. Anything less tests the parts and not the thing:
       a key can be present and refused, a model name can be valid and retired.
       It is the office's own button, so the cost is one question's worth of
       tokens when somebody presses it. */
    if (action === "assistantTest") {
      const steps = [];
      /* THE WORD IS THE STEP'S TO CHOOSE (§124). "ok" is the state the row
         is drawn in; what the row SAYS about itself is a different fact, and
         the API key's is "present" rather than "working" — which is the whole
         of what this page got wrong the first time. */
      const step = function (name, state, detail, word) {
        steps.push({ name: name, state: state, detail: detail || null,
                     word: word || null });
      };

      step("The switch", cfg.assistant ? "ok" : "off",
           cfg.assistant ? "The assistant answers first"
                         : "Everything goes straight to this inbox");

      const kb = corpus();
      step("The knowledge base", kb ? "ok" : "fail",
           kb ? ((kb.recipes || []).length + " how-tos, " +
                 (kb.sections || []).length + " sections, " +
                 (kb.pages || []).length + " page explainers")
              : "db/kb.json did not reach this deployment");

      /* PRESENT, NOT VALID (§124). This row said "working" off a non-empty
         variable, and Islam read that — reasonably — as the key being fine,
         while the row beneath it carried the provider's "API key not valid".
         Presence is all this step can see; whether the key is accepted is the
         model step's answer, and it now says so there. */
      /* AND WHICH KEY, IN A SHAPE THAT GIVES NOTHING AWAY (§126). "Rejected"
         and "not the key you made" send somebody to two different websites,
         and the deployment cannot tell them apart from the outside — so it
         says the length and the first four characters, and whether that is
         the shape an AI Studio key has. */
      const shape = assistant.keyShape();
      step("The API key", assistant.configured() ? "ok" : "fail",
           shape
             ? (shape.len + " characters, starting " + shape.head + ". " +
                (shape.looksRight
                  ? "That is the shape of an AI Studio key — whether the provider " +
                    "accepts this one is the next step. If it is refused, check " +
                    "this against the key in AI Studio: a deployment only has the " +
                    "variables that existed when it was BUILT, so a key changed " +
                    "since then needs a redeploy."
                  /* NOT "wrong" — UNRECOGNISED (§132.2). This branch once
                     declared any non-AIza value a different kind of credential,
                     and the first real key it met was Google's newer AQ. form,
                     which the provider then accepted. A heuristic never
                     overrules the provider, so the next step still runs and
                     the word here claims only what was measured. */
                  : "An AI Studio key is " + assistant.KEY_LEN + " characters " +
                    "starting " + assistant.KEY_HEAD + ", or Google's newer form " +
                    "starting " + assistant.KEY_HEAD2 + " — this matches neither, " +
                    "so compare it against aistudio.google.com/apikey. The next " +
                    "step is still what decides: the provider may accept a shape " +
                    "this page does not know."))
             : "No " + assistant.KEY_NAME + " here. Note that Vercel only " +
               "gives a deployment the variables that existed when it was " +
               "built — if it was added since, redeploy.",
           !shape ? null : shape.looksRight ? "present" : "unrecognised");

      /* THE CALL ITSELF, only once there is something to call with — against
         the corpus AS THIS TENANT HAS IT (§140), or the diagnostic would test
         a corpus nobody is answered from. */
      if (kb && assistant.configured()) {
        const orgT = (await client.query("SELECT extra FROM org WHERE id = 1")).rows[0] || {};
        const q = "How is my unit's headline number worked out?";
        const out = await assistant.ask({
          kb: assistant.withTenant(kb, (orgT.extra || {}).kb), question: q, history: [],
          who: "a member of the Strategy Office", labels: ((orgT.extra || {}).labels) || {},
          /* The diagnostic is run FROM the office and must exercise the whole
             corpus: a filtered one would test a smaller thing than the one it
             is reporting on. */
          isOffice: true
        });
        if (out && out.badKey) {
          /* REPORTED AGAINST THE KEY, because that is what is wrong and that
             is the page somebody has to go to. The three causes worth naming
             are the ones that produce a correct-looking key the provider
             refuses, and none of them is visible from here. */
          step("The key itself", "fail",
               out.why + " — most often the key was pasted with a stray space " +
               "or newline, is restricted to a website or IP (a server key must " +
               "not be), or belongs to a project where the Generative Language " +
               "API is not switched on.");
        } else if (!out || !out.ok) {
          step("The model (" + assistant.model() + ")", "fail",
               (out && out.why) || "no answer");
        } else {
          step("The model (" + assistant.model() + ")", "ok", "Answered in full");
          /* ANSWERING IS NOT THE SAME AS ANSWERING WELL, and this one question
             has a right answer in the corpus — so a handover here means the
             corpus reached it and it declined, which is a different problem
             from the model being unreachable and is worth separating. */
          step("A question it should know", out.answered ? "ok" : "warn",
               out.answered
                 ? out.reply + (out.source ? "   [" + out.source + "]" : "")
                 : "It handed this one over. The model is reachable, so this is " +
                   "about the knowledge base rather than the connection.");
        }
      }
      return send(res, 200, { ok: true, steps: steps });
    }

    /* THE QUEUE IS PEOPLE, NOT TICKETS (§97.2). Two groups, and the last line
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
        /* The settings, so the page draws the menu from the same answer the
           server just enforced rather than from its own copy of the graph. */
        chat: cfg,
        waiting: rows.filter(function (r) { return r.waiting; }).length,
        flagged: rows.filter(function (r) { return +r.flagged > 0; }).length,
        hereMinutes: cfg.away,
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
      const here = t.here_at && (Date.now() - new Date(t.here_at).getTime()) < cfg.away * 60000;
      return send(res, 200, {
        ok: true, person: who, name: t.live_name || t.person_name,
        gone: !t.live_name, unit: t.unit_key, fn: t.fn_key, title: t.title,
        address: Audience.addressOf(t.extra || {}),
        waiting: t.waiting, here: !!here, hereAt: t.here_at,
        /* `mail` is BOTH questions at once: can this deployment send at all,
           and has the office asked it to. The line above the reply box says
           one sentence, so it needs one answer (§98.2). */
        mail: mailer.configured() && cfg.mail, chatOn: cfg.on, messages: msgs
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
      /* REPLYING GOES OFF WITH THE CHAT, deliberately (§98.2). If the corner
         is not drawn, nobody can open an answer — so a reply that landed would
         be written into a room with no door, and a reply that also EMAILED
         would point somebody at a platform they cannot answer from. Reading
         the history stays open; writing into it does not. */
      if (!cfg.on) {
        return send(res, 403, { ok: false, error: "The chat is off, so nobody would see a reply." });
      }
      const who = str(body.person, 120);
      const text = str(body.body);
      if (!who) return send(res, 400, { ok: false, error: "Which conversation?" });
      if (!text) return send(res, 400, { ok: false, error: "Nothing to send." });
      let t = (await client.query(
        "SELECT here_at FROM chat_threads WHERE person_key = $1", [who])).rows[0];

      /* ── THE OFFICE STARTS ONE (§247) ─────────────────────────────
         Islam: "from the platform inbox allow the smo to initiate a message
         with someone." Until now the office could only ever ANSWER: with
         nobody having written in there was no way to reach them from here at
         all.

         IT IS A FLAG ON THE REPLY, NOT AN ACTION OF ITS OWN. Everything a
         message from the office does — marking the conversation answered
         (§71), chasing by email when they are away (§97.5), the box on their
         screen (§231) — is already written once, here. A second endpoint
         would be a second copy of all of it, and the two would drift (§53.5).
         What starting adds is exactly one thing: the conversation may not
         exist yet.

         AND THE PERSON MUST BE ONE. `ensureThread` will happily mint a row
         for any string, so a typo would create a conversation with nobody,
         visible in the queue for ever and answerable by no one — checked
         against the STORED register, never against what the browser sent
         (§74.2), and against the ACTIVE register, because a retired person
         cannot sign in to read it (§35's rule about writing somewhere nobody
         can reach).

         ONE CONVERSATION PER PERSON SURVIVES UNTOUCHED (§97): starting one
         with somebody who has already written in finds their thread on the
         line above and simply carries on into it. This can never make a
         second — `chat_threads.person_key` is the primary key. */
      if (!t && body.start === true) {
        const p = (await client.query(
          "SELECT key, name FROM people WHERE key = $1 " +
          "  AND COALESCE(extra->>'active','true') <> 'false'", [who])).rows[0];
        if (!p) {
          return send(res, 404, { ok: false, error: "There is no such person on the register." });
        }
        await ensureThread(client, p.key, p.name);
        t = (await client.query(
          "SELECT here_at FROM chat_threads WHERE person_key = $1", [who])).rows[0];
      }
      if (!t) return send(res, 404, { ok: false, error: "No conversation with that person." });

      /* THE ID COMES BACK, because §188 marks THIS message once the email
         has actually gone — not the thread, and not the next one. */
      const said = (await client.query(
        "INSERT INTO chat_messages (person_key, from_office, by_key, by_name, body) " +
        "VALUES ($1,true,$2,$3,$4) RETURNING id",
        [who, me.key, me.name || null, text])).rows[0];
      /* ANSWERED BY THE ACT, not by remembering to set it — the status nobody
         sets is the status somebody has to remember (§71). */
      await client.query(
        "UPDATE chat_threads SET waiting = false, last_at = now(), seen_by_us = now() " +
        "WHERE person_key = $1", [who]);

      /* ── AND THE ONE THING THAT LEAVES THE PLATFORM (§97.5) ────────
         Only if they are not here. The decision is made HERE and reported
         back, because the office was shown which way it would go before
         pressing Send and the two must agree — a screen that predicts and a
         server that decides separately is the drift lib/rules.js exists to
         prevent, one endpoint further out.

         THE ADDRESS IS RESOLVED ON THE SERVER, from the stored register,
         never taken from the browser (§74.2). The browser sends the HTML it
         built with the one builder every other message uses (§72.3) — content,
         never a recipient. */
      /* AND A BOX ON THEIR OWN DEVICES, WITH NO TAB OPEN (§231). Sent
         WHATEVER the email decides below: the two answer different questions —
         a notification reaches the phone in their pocket now, an email reaches
         them tomorrow — and gating one on the other would mean somebody
         sitting in the platform with the panel shut is told nothing at all,
         which is §225's whole fault by another road.

         The page suppresses its own box on any device that is subscribed, so
         nobody ever gets two (§53.5, and it is asserted). */
      if (cfg.popup) {
        try {
          await push.sendTo(client, await push.subsOf(client, who), {
            title: me.name || "Strategy Office",
            body: firstLine(text),
            tag: "reply"
          });
        } catch (e) { /* a notification never costs the reply it is about */ }
      }

      const here = t.here_at && (Date.now() - new Date(t.here_at).getTime()) < cfg.away * 60000;
      let mailed = null;
      if (!here && !cfg.mail) {
        /* SAID, NOT SILENT. The office is shown the same sentence before it
           presses Send; if the two ever disagree, this one is the truth. */
        mailed = { sent: false, why: "chasing by email is turned off" };
      } else if (!here && body.html) {
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
            /* ── AND THE MESSAGE REMEMBERS IT (§188) ────────────────────
               Islam: "if the previous message was sent by email let's add a
               tag to it that it was sent by email as well." The chase has
               existed since §97.5 and was reported to the browser once and
               written down nowhere, so a thread read tomorrow could not say
               which of its replies had left the platform.

               WRITTEN ONLY WHEN IT ACTUALLY WENT. A failed send leaves this
               null, which is the same thing an untouched row says — because
               it is the same fact. A tag on a message that never left would
               be worse than no tag (§35: absence reported as presence). */
            if (id && said && said.id) {
              await client.query(
                "UPDATE chat_messages SET emailed_to = $2 WHERE id = $1",
                [said.id, addr]);
            }
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
    return send(res, e.code === "NO_DB" ? 503 : e.code === "NO_CLIENT" ? 404 : 500,
                { ok: false, error: e.message === "too large" ? "Too large." : "Something went wrong." });
  } finally {
    if (client) await P.releaseClient(client);
  }
};
