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
/* The SAME builder the platform inlines (§262): one answer to what an
   email from here looks like, whoever composes it. */
const MAIL = require("../lib/mail-html.js");
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

/* ── WHAT IS STILL UNANSWERED IN THIS CONVERSATION (§261) ─────────────
   Every message the person has written since the office last answered them —
   the "waiting spell", which is exactly what the office is being emailed
   about.

   THE BOUNDARY EXCLUDES THE ASSISTANT'S HANDOFF LINE, and getting that wrong
   would have emptied the email at the one moment it matters most: the handoff
   is `from_office` (§104 — the assistant answers on the office's behalf) and
   it is written the moment the question arrives, so a naive "since the last
   office message" would find nothing to compile. An assistant ANSWER is a
   different thing and correctly ends the spell: it marks the conversation
   answered, and an answered conversation is not collected at all. */
async function waitingSpell(client, key) {
  const r = await client.query(
    "SELECT body, (shot IS NOT NULL) AS has_shot, at FROM chat_messages " +
    " WHERE person_key = $1 AND NOT from_office " +
    "   AND at > COALESCE((SELECT max(at) FROM chat_messages " +
    "                       WHERE person_key = $1 AND from_office " +
    "                         AND NOT COALESCE(handoff, false)), '-infinity'::timestamptz) " +
    " ORDER BY at, id", [key]);
  return r.rows;
}

/* ── WHERE THE PLATFORM IS, ASKED OF THE REQUEST (§176, §262) ─────────
   A link in an email has nothing to be relative to, so the button needs an
   absolute address — and the browser that used to supply it is not in the
   room when a collection goes out. The request that drove the sweep IS a
   browser on this deployment, so its own address answers: a same-origin fetch
   carries the page it came from, which is the platform's path rather than the
   sign-in gate (§35.6, and spec 027's own ruling about which of the two is
   right).

   NO GUESS AND NO FALLBACK TO THE GATE. If nothing here says where the
   platform is, the email draws no button at all rather than one that lands
   somewhere nobody meant (§176: html() omits it when the href is empty). */
function platformHref(req) {
  const ref = String((req && req.headers && req.headers.referer) || "").trim();
  if (/^https?:\/\//i.test(ref) && ref.indexOf("/api/") < 0) return ref.split("#")[0];
  return "";
}

/* WHAT AN EMAIL FROM THIS PLATFORM LOOKS LIKE, resolved on the server from the
   stored tenant (§72's shape, read where the sweep can reach it). The browser's
   `commsShape()` answers the same question from the same fields; both hand it
   to the same builder, which is now `lib/mail-html.js` (§262). */
async function mailShape(client, req) {
  const r = (await client.query("SELECT org_name, extra FROM org WHERE id = 1")).rows[0] || {};
  const x = r.extra || {}, c = x.comms || {}, b = x.branding || {};
  const org = c.headerName || r.org_name || "";
  return {
    org: org,
    fromName: c.fromName || r.org_name || "Strategy Management Platform",
    replyTo: c.replyTo || "",
    eyebrow: c.eyebrow || "Strategy Management Platform",
    footer: c.footer || MAIL.footerDefault(r.org_name || ""),
    accent: b.accent || "",
    panel: b.bar || "",
    href: platformHref(req)
  };
}

/* ── THE COLLECTION (§262) ────────────────────────────────────────────
   Islam, having had one email per message: *"if the smo don't reply in 10 min
   the email should come and same for them ... sometimes people might be at
   their desk but not focusing or they closed the notification."*

   SO PRESENCE DECIDES NOTHING ANY MORE, and the shape follows from that: a
   message that leaves a conversation waiting starts a clock, anything written
   while it runs joins the collection, and at the end ONE email goes out
   carrying all of it. Only an answer stops it — the office's reply on one
   side, and on the other the person coming back to the platform, because a
   reply needs reading rather than answering.

   AND NOTHING WAKES THIS PLATFORM UP (§97.5, still true — there is no
   scheduler on Vercel and this deployment has none). The collection is due at
   a moment when, by definition, nobody is doing anything: he has not written
   again, you are not looking. So the sweep borrows SOMEBODY ELSE'S request —
   every signed-in browser checks in at least every three minutes (§98's idle
   beat), and one of those check-ins carries the send. The stated cost, put to
   Islam before it was built: with literally nobody using the platform the
   email waits for the next sign of life, so ten minutes is a floor and not a
   promise.

   ONE SWEEP AT A TIME, ACROSS EVERY INSTANCE. `pg_try_advisory_xact_lock`
   rather than a claim-then-send: claiming first would mark the conversations
   emailed before the provider had accepted anything, and a stamp with no
   email behind it is silence bought for nothing (§188's rule, and §261's).
   A second instance arriving mid-sweep does not queue — it skips, because the
   work is already being done and a queue of sweeps is a queue of duplicate
   emails.

   IT NEVER COSTS THE REQUEST IT RODE IN ON. Everything here is inside one
   try; a mail failure, a lock it could not take, a query that threw all leave
   the chat exactly as it was, which is the correct state (§104's ordering,
   one layer out). */
const SWEEP_LOCK = 262001;
/* Once a minute per warm instance. The due test is two indexed reads, and
   §98.1's lesson is that per-request work nobody thinks about is what a poll
   turns into a bill — so the common case is a comparison against a number in
   memory and nothing else. */
const SWEEP_EVERY = 60000;
let LAST_SWEEP = 0;

async function sweep(client, cfg, req) {
  /* WITH THE CHAT OFF NOTHING LEAVES THE PLATFORM (§98.2). The corner is not
     drawn, nobody can answer what arrives, and an email pointing at a chat
     that is switched off is a message with nowhere to go. */
  if (!cfg.on) return;
  if (!mailer.configured()) return;
  const now = Date.now();
  if (now - LAST_SWEEP < SWEEP_EVERY) return;
  LAST_SWEEP = now;
  try {
    await client.query("BEGIN");
    const got = (await client.query("SELECT pg_try_advisory_xact_lock($1) AS ok",
                                    [SWEEP_LOCK])).rows[0];
    if (!got || !got.ok) { await client.query("ROLLBACK"); return; }
    await collectForOffice(client, cfg, req);
    await collectForPeople(client, cfg, req);
    await client.query("COMMIT");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (e2) { /* the pool will drop it */ }
    /* VISIBLE TO THE OPERATOR, INVISIBLE TO EVERYBODY ELSE (§133, §123). */
    console.error("collection sweep:", (e && e.message) || e);
  }
}

/* ── ONE EMAIL FOR EVERY CONVERSATION WAITING ON THE OFFICE (§262) ────
   Islam: *"the email is sent with all the pending conversations, not one for
   each person."* So the unit of the email is the OFFICE'S QUEUE, not the
   conversation — three people waiting is one email naming three people, where
   §261 would have sent three.

   THE TRIGGER AND THE CONTENTS ARE DIFFERENT QUESTIONS. It is sent when
   ANYTHING has been waiting long enough; what it then carries is every
   conversation with something unanswered, including one that arrived a minute
   ago. That is deliberate and it is fewer emails, not more: the newcomer is
   covered by this email and stamped with it, so it will not trigger one of its
   own ten minutes from now. */
async function collectForOffice(client, cfg, req) {
  if (!cfg.notify || !cfg.rep) return;
  const rows = (await client.query(
    "SELECT t.person_key, COALESCE(p.name, t.person_name, t.person_key) AS name, " +
    "       p.unit_key, p.fn_key, p.extra->>'company' AS company, t.chased_at, " +
    "       (SELECT min(m.at) FROM chat_messages m " +
    "         WHERE m.person_key = t.person_key AND NOT m.from_office " +
    "           AND m.at > COALESCE(t.chased_at, '-infinity'::timestamptz)) AS oldest " +
    "  FROM chat_threads t LEFT JOIN people p ON p.key = t.person_key " +
    " WHERE t.waiting AND t.person_key <> $1", [cfg.rep])).rows;
  const withNew = rows.filter(r => r.oldest);
  if (!withNew.length) return;
  const due = withNew.some(r => Rules.chatCollectDue(r.oldest, Date.now(), cfg.away));
  if (!due) return;

  const to = await addressOfPerson(client, cfg.rep);
  if (!to) return;
  /* THE SPELL, PER CONVERSATION — everything since the office last answered
     that person, not merely what arrived since the last email. The email is a
     picture of what is waiting, and a picture missing the first half of a
     conversation is worse than no picture. */
  const blocks = [];
  for (const r of withNew) {
    const said = await waitingSpell(client, r.person_key);
    if (said.length) blocks.push({ row: r, said: said });
  }
  if (!blocks.length) return;

  const id = await mailer.sendOne({
    to: to,
    subject: blocks.length > 1
      ? blocks.length + " conversations waiting"
      : "A question is waiting: " + blocks[0].row.name,
    html: officeDigestHtml(blocks, platformHref(req))
  });
  /* STAMPED ONLY WHEN IT ACTUALLY WENT, and every conversation the email
     carried is stamped — including the one that was not yet due, because it
     has now been said (§188's rule: the mark follows the send, never the
     intention). */
  if (id) {
    await client.query(
      "UPDATE chat_threads SET chased_at = now() WHERE person_key = ANY($1)",
      [blocks.map(b => b.row.person_key)]);
  }
}

/* PLAIN, AND DELIBERATELY NOT THE TENANT'S BRANDED TEMPLATE (§104.4). That
   template exists for what the ORGANISATION looks like to somebody outside the
   platform; this is a work queue for one person who works in it. Tables,
   inline styles and literal colours all the same, because email is not the
   web (§72). */
function officeDigestHtml(blocks, href) {
  const q = (m) =>
    '<blockquote style="margin:0 0 8px;padding:9px 14px;border-left:3px solid #C9A24D;' +
    'background:#F4F6FA;color:#3D4C68">' +
    escHtml(String(m.body || "").slice(0, 400) || (m.has_shot ? "(a screenshot)" : "")) +
    (m.body && m.has_shot ? '<span style="color:#5E6E88"> (with a screenshot)</span>' : "") +
    "</blockquote>";
  /* A CAP PER CONVERSATION, because one long thread must not push the other
     people out of sight. Trimmed from the FRONT — the newest are the ones
     worth reading — and said out loud, or the email misreports what is
     waiting. */
  const MAX = 6;
  const one = (b) => {
    const shown = b.said.slice(-MAX), hidden = b.said.length - shown.length;
    const place = placeWord(b.row);
    return '<div style="margin:0 0 20px">' +
      '<p style="margin:0 0 7px;font:600 15px/1.4 -apple-system,Segoe UI,Arial,sans-serif">' +
      escHtml(b.row.name) +
      '<span style="font-weight:400;color:#5E6E88">' +
      (place ? " &middot; " + escHtml(place) : "") +
      " &middot; waiting " + escHtml(sinceWord(b.said[0].at)) + "</span></p>" +
      shown.map(q).join("") +
      (hidden > 0
        ? '<p style="margin:0;color:#5E6E88;font-size:13px">and ' + hidden +
          (hidden === 1 ? " earlier message" : " earlier messages") + " in the platform</p>"
        : "") +
      "</div>";
  };
  return '<div style="font:15px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#1B2740">' +
    '<p style="margin:0 0 18px"><b>' +
    (blocks.length > 1 ? blocks.length + " conversations</b> are" : "One conversation</b> is") +
    " waiting for an answer.</p>" +
    blocks.map(one).join("") +
    (href
      ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" ' +
        'style="margin:6px 0 20px"><tr><td bgcolor="#16325C" style="border-radius:6px">' +
        '<a href="' + escHtml(href) + '" style="display:inline-block;padding:11px 20px;' +
        'font:600 14px/1 -apple-system,Segoe UI,Arial,sans-serif;color:#FFFFFF;' +
        'text-decoration:none">Open the Platform Inbox</a></td></tr></table>'
      : "") +
    '<p style="margin:0;color:#5E6E88">Setup &rsaquo; Running the cycle &rsaquo; ' +
    'Platform Inbox.</p></div>';
}

/* Where somebody sits, in the navigation's own words — the register already
   answers this and the email should not invent a second vocabulary (§65,
   §93.12). Absent is absent: a person the register has not placed gets no
   suffix rather than a guess (§15.1). */
function placeWord(r) {
  if (r.fn_key) return String(r.fn_key) + " (function)";
  if (r.unit_key) return String(r.unit_key);
  if (r.company) return String(r.company);
  return "";
}
function sinceWord(at) {
  const ms = Date.now() - new Date(at).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return mins + (mins === 1 ? " minute" : " minutes");
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return hrs + (hrs === 1 ? " hour" : " hours");
  const days = Math.round(hrs / 24);
  return days + (days === 1 ? " day" : " days");
}

async function addressOfPerson(client, key) {
  const r = (await client.query(
    "SELECT extra FROM people WHERE key = $1 " +
    "  AND COALESCE(extra->>'active','true') <> 'false'", [key])).rows[0];
  return r ? Audience.addressOf(r.extra || {}) : "";
}

/* ── AND THE SAME RULE GOING THE OTHER WAY (§262) ─────────────────────
   One email per person, because a person only ever sees their own
   conversation — there is nothing to group, and grouping across people is
   exactly what must not happen here.

   WHAT COUNTS AS UNSAID IS "SINCE THE LATER OF two things": the last email we
   sent them, and the last time they had the platform open. Coming back is
   what stops this (his rule: a reply needs reading, not answering), and
   taking only the later of the two is what makes a person who looked in
   half-way through get the replies that arrived AFTER their visit rather than
   all of them or none.

   THE ASSISTANT'S OWN MESSAGES ARE NOT CHASED. A handoff line says a person
   will answer, and an assistant answer is already on their screen the moment
   they ask — emailing either would be the platform writing to somebody about
   its own reply to them (§104). */
async function collectForPeople(client, cfg, req) {
  if (!cfg.mail) return;
  const rows = (await client.query(
    "SELECT t.person_key, COALESCE(p.name, t.person_name) AS name, p.extra, " +
    "       GREATEST(COALESCE(t.chased_them_at, '-infinity'::timestamptz), " +
    "                COALESCE(t.here_at,        '-infinity'::timestamptz)) AS since " +
    "  FROM chat_threads t JOIN people p ON p.key = t.person_key " +
    " WHERE COALESCE(p.extra->>'active','true') <> 'false'")).rows;
  if (!rows.length) return;
  const shape = await mailShape(client, req);
  for (const r of rows) {
    const said = (await client.query(
      "SELECT body, at FROM chat_messages " +
      " WHERE person_key = $1 AND from_office AND NOT COALESCE(bot, false) " +
      "   AND at > $2 ORDER BY at, id", [r.person_key, r.since])).rows;
    if (!said.length) continue;
    if (!Rules.chatCollectDue(said[0].at, Date.now(), cfg.away)) continue;
    const addr = Audience.addressOf(r.extra || {});
    if (!addr) continue;
    const many = said.length > 1;
    const body = (many
        ? said.length + " replies are waiting for you in the platform.\n\n"
        : "") +
      said.map(m => "“" + String(m.body || "").slice(0, 600) + "”").join("\n\n") +
      "\n\nOpen the platform to read " + (many ? "them" : "it") + " in full and answer.";
    try {
      const id = await mailer.sendOne({
        to: addr,
        fromName: shape.fromName,
        replyTo: shape.replyTo,
        subject: many ? said.length + " replies from the Strategy Office"
                      : "A reply from the Strategy Office",
        html: MAIL.html({
          org: shape.org, accent: shape.accent, panel: shape.panel,
          footer: shape.footer, eyebrow: shape.eyebrow,
          title: many ? said.length + " replies from the Strategy Office"
                      : "The Strategy Office replied",
          preheader: String(said[0].body || "").slice(0, 140),
          body: body,
          cta: { label: "Open the platform", href: shape.href }
        })
      });
      if (id) {
        await client.query(
          "UPDATE chat_threads SET chased_them_at = now() WHERE person_key = $1",
          [r.person_key]);
        /* §188's tag, on the messages this email actually carried. */
        await client.query(
          "UPDATE chat_messages SET emailed_to = $2 " +
          " WHERE person_key = $1 AND from_office AND NOT COALESCE(bot,false) AND at > $3",
          [r.person_key, addr, r.since]);
      }
    } catch (e) {
      /* ONE PERSON'S EMAIL FAILING COSTS ONLY THAT PERSON'S EMAIL. Nothing is
         stamped, so the next sweep tries again — and everybody else in this
         sweep still receives theirs. */
      console.error("collection to " + r.person_key + ":", (e && e.message) || e);
    }
  }
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
    const cfg = await chatSettings(client);

    /* ── THE HEARTBEAT (§262) ──────────────────────────────────────────
       Every request through this endpoint is somebody's browser saying it is
       there, and a collection that has come due needs exactly that: something
       happening, at a moment when the person it concerns is doing nothing.
       Throttled to once a minute per instance and skipped outright when
       another instance holds the lock, so the ordinary poll pays a comparison
       against a number in memory (§98.1).

       BEFORE THE ACTION, not after: work queued after the response is work a
       serverless function is free to kill. */
    await sweep(client, cfg, req);

    /* ── WHAT THE PERSON'S OWN PANEL ASKS FOR ─────────────────────────
       And the one thing it writes without being told to: `here_at`, which is
       the whole of the presence test the email rule reads (§97.5). Stamped on
       the POLL rather than on a send, because being present is about looking
       at the screen, not about having typed. */
    if (action === "mine") {
      /* AND COMING BACK IS WHAT STOPS THEIR COLLECTION (§262) — but it is
         `here_at` that says so, not a cleared watermark. `chased_them_at`
         means "we have emailed them up to here" and clearing it would make
         messages they were already sent eligible all over again; the sweep
         reads the LATER of the two, so a visit silences everything that
         arrived before it and nothing that arrived after. */
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
      /* NO EMAIL FROM HERE ANY MORE (§262). §104.4 emailed the office at the
         moment a question arrived, which is what made five messages five
         emails; the collection above sends instead, ten minutes later and
         once. What stays here is everything that is INSTANT by nature — the
         message stored, the conversation waiting, and the box below on a
         device that asked for one. */
      const stillWaiting = (await client.query(
        "SELECT waiting FROM chat_threads WHERE person_key = $1", [me.key])).rows[0];

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
        /* WHAT "HERE" MEANS, which is no longer what the setting says (§262):
           the setting is how long the platform collects before emailing, and
           this is the short window the word "here" describes. */
        hereMinutes: Rules.CHAT_HERE_MIN,
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
      /* PRESENT MEANS PRESENT, WHEREVER IT IS ASKED (§53.5, §262). This read
         the collecting time until §262 changed what that number means, and
         would then have called somebody "here" nine minutes after they shut
         the tab — the same drift the reply path was fixed for, on the surface
         that DRAWS the sentence rather than the one that answers it. */
      const here = t.here_at &&
        (Date.now() - new Date(t.here_at).getTime()) < Rules.CHAT_HERE_MIN * 60000;
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

      /* NO ID BACK ANY MORE (§262, §24). §188 marked the one message the
         chase carried, and the chase now carries every reply since they were
         last here — so the tag is written by the sweep, over the messages the
         email actually held, and there is nothing for this insert to hand
         back. */
      await client.query(
        "INSERT INTO chat_messages (person_key, from_office, by_key, by_name, body) " +
        "VALUES ($1,true,$2,$3,$4)",
        [who, me.key, me.name || null, text]);
      /* ANSWERED BY THE ACT, not by remembering to set it — the status nobody
         sets is the status somebody has to remember (§71).

         AND ANSWERING ENDS THE OFFICE'S OWN CHASE (§261): `chased_at` is the
         memory of an email about a conversation waiting on the office, and
         this is the office answering it. Cleared here, in the write that
         already says so, so the next thing that person writes chases at once
         rather than waiting out a quiet period bought by the last spell. */
      await client.query(
        "UPDATE chat_threads SET waiting = false, last_at = now(), seen_by_us = now(), " +
        "       chased_at = NULL WHERE person_key = $1", [who]);

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

      /* ── WHAT WILL HAPPEN NEXT, SAID RATHER THAN DONE (§262) ──────
         The email does not go from here any more. A reply starts their
         collection and the sweep sends it ten minutes later if they have not
         come back — so what this returns is not "did it send" but "what is
         going to happen", which is the only honest answer at this moment.

         `here` KEEPS ITS OWN SHORT WINDOW (`CHAT_HERE_MIN`), because it is a
         description of right now — "they have the platform open" — and the
         setting beside it is a collecting time. Reading presence off ten
         minutes would call somebody present nine minutes after they closed
         the tab (§262, and §169's floor argument for why three was already
         marginal). */
      const here = t.here_at &&
        (Date.now() - new Date(t.here_at).getTime()) < Rules.CHAT_HERE_MIN * 60000;
      const addr = await addressOfPerson(client, who);
      let mailed = null;
      if (!cfg.mail) mailed = { sent: false, why: "emailing is turned off" };
      else if (!addr) mailed = { sent: false, why: "no address on the register" };
      else if (!mailer.configured()) mailed = { sent: false, why: "no mail is configured here" };
      else mailed = { sent: false, pending: true, to: addr, mins: cfg.away };
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

/* ── A DOOR FOR THE CHECK, AND NOTHING ELSE (§262) ────────────────────
   The sweep is throttled to once a minute per warm instance, which is right
   for a deployment and wrong for a file that drives ten trials in three
   seconds — without this, every trial after the first would find the sweep
   asleep and report a working build as silent (§100.3's shape: a harness that
   cannot reach the thing under test measures something else).

   It resets a clock and nothing more: no behaviour branches on it, so there
   is no second code path shipping to production (§142.6's rule about the mail
   endpoint, one module over). */
module.exports.__resetSweep = function () { LAST_SWEEP = 0; };
