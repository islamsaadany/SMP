/* ── SENDING MAIL (§72) ───────────────────────────────────────────────────
   Islam: "I need to have a test email send to see the design of the email and
   the sender of the email name etc. A communication setup page should handle
   all the relevant details."

   THE KEY NEVER LEAVES THE SERVER. The platform ships as one HTML file, so it
   is worth being explicit: `RESEND_API_KEY` is read here and nowhere else, it
   is not in the repo, and nothing this endpoint returns contains it — `status`
   reports whether a key is PRESENT, never what it is.

   TWO HALVES OF THE FROM-ADDRESS, and the split is deliberate:
     SMP_MAIL_FROM   the ADDRESS, in the environment, because it is tied to the
                     domain verified with Resend — changing it is a deployment
                     decision, not a screen one.
     comms.fromName  the DISPLAY NAME, in the tenant's own settings, because
                     "Raya Trade" is a thing Islam should be able to change on
                     a Tuesday without a redeploy.
   Together they make `Raya Trade <smp@domain>`. Written apart, they cannot
   drift: there is exactly one place each lives.
   ──────────────────────────────────────────────────────────────────────── */
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");
const Rules = require("../lib/rules.js");
const Audience = require("../lib/audience.js");
const { ensureReady, readState } = io;
function getPool() { return io.getPool(pg); }

const RESEND = "https://api.resend.com";

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
  }
  return new Promise(function (resolve, reject) {
    let s = "";
    req.on("data", function (c) { s += c; if (s.length > 2e6) { reject(new Error("big")); req.destroy(); } });
    req.on("end", function () { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

/* The address only, as configured. Split off the display name if somebody has
   put a whole `Name <addr>` in the variable — which they will, because that is
   what every mail tool shows you. */
function fromAddress() {
  const raw = String(process.env.SMP_MAIL_FROM || "").trim();
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim();
}
function domainOf(addr) {
  const i = String(addr || "").lastIndexOf("@");
  return i < 0 ? "" : addr.slice(i + 1).toLowerCase();
}

/* WHAT RESEND SAYS ABOUT THE DOMAIN, not what we assume. Until a domain is
   verified, Resend delivers only to the address the account was opened with —
   so a send that "worked" in testing fails for everybody else, silently as far
   as the sender can tell. Asking is the difference between the page saying
   "ready" and the page saying "ready, for you only". */
async function domainStatus(key, domain) {
  if (!key || !domain) return null;
  try {
    const r = await fetch(RESEND + "/domains", { headers: { Authorization: "Bearer " + key } });
    /* A REFUSED KEY IS NOT A VERDICT ON THE DOMAIN, and saying so here is the
       difference between "your domain is not verified" and the truth, which is
       that nothing about the domain was learned. It is also the only moment
       the platform finds out a present key is a WRONG key — an environment
       variable being set says nothing about whether Resend accepts it. */
    if (!r.ok) {
      const b = await r.json().catch(function () { return null; });
      const msg = (b && (b.message || (b.error && b.error.message))) || "";
      /* MATCHED ON THE MESSAGE, NOT THE STATUS, because Resend answers an
         invalid key with 400 rather than 401 — measured, not assumed. The
         status codes stay in the test as well: a service is free to correct
         that, and then the code is the honest signal. */
      if (r.status === 401 || r.status === 403 || /api key/i.test(msg)) {
        return { asked: true, ok: false, keyBad: true, why: msg || "Resend does not accept this key." };
      }
      return { asked: false, ok: false, why: "Resend answered " + r.status + "." };
    }
    const j = await r.json();
    const list = (j && (j.data || j)) || [];
    const hit = (Array.isArray(list) ? list : []).filter(function (d) {
      return String(d.name || "").toLowerCase() === domain;
    })[0];
    if (!hit) return { asked: true, ok: false, why: "not a domain on this Resend account" };
    return { asked: true, ok: hit.status === "verified", status: hit.status };
  } catch (e) {
    /* A network answer we did not get is not a verdict. The page says it could
       not ask, rather than reporting a domain as unverified on no evidence. */
    return { asked: false, ok: false, why: "could not reach Resend" };
  }
}

/* ── ONE MESSAGE PER PERSON, IN ONE CALL (§74.3) ──────────────────────────
   Never a shared To and never a BCC: nobody should see anybody else's address,
   and when one send fails you have to know WHICH. That is normally the choice
   between privacy and thirty-three HTTP calls — Resend's batch endpoint takes
   up to 100 SEPARATE messages in one request, so it is neither.

   It also settles a constraint that would otherwise have decided the design:
   a serverless function has seconds, and Resend rate-limits at 2 a second, so
   a loop over thirty-three people would have timed out halfway with no record
   of where it stopped. */
const BATCH_MAX = 100;

async function resendBatch(key, emails) {
  const r = await fetch(RESEND + "/emails/batch", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(emails)
  });
  const j = await r.json().catch(function () { return null; });
  if (!r.ok) {
    const why = (j && (j.message || (j.error && j.error.message))) || ("Resend said " + r.status + ".");
    const e = new Error(why); e.resend = true; throw e;
  }
  /* Resend answers with the ids in the order they were sent, so a result is
     matched to a recipient by POSITION. Anything short of a full answer is
     treated as unknown rather than as success. */
  return (j && (j.data || j)) || [];
}

async function resendSend(key, payload) {
  const r = await fetch(RESEND + "/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const j = await r.json().catch(function () { return null; });
  if (!r.ok) {
    /* Resend's own sentence, which names the real cause (an unverified domain,
       a bad address, a rate limit) far better than anything generic here
       could — §69.22's rule about the policy sentence, one service further
       out. */
    const why = (j && (j.message || (j.error && j.error.message))) || ("Resend said " + r.status + ".");
    const e = new Error(why); e.resend = true; throw e;
  }
  return j;
}

module.exports = async function handler(req, res) {
  let client;
  try {
    client = await getPool().connect();
    await ensureReady(client);
    const body = req.method === "POST" ? await readBody(req) : {};
    const action = body.action || (req.method === "GET" ? "status" : "");
    const me = await auth.getSession(client, req);
    if (!me) return send(res, 401, { ok: false, error: "sign in first" });
    /* Mail goes out over the organisation's name. That is the SMO's. */
    if (me.role !== "super") {
      return send(res, 403, { ok: false, error: "Communication is the SMO's." });
    }
    const key = process.env.RESEND_API_KEY || "";
    const addr = fromAddress();

    if (action === "status") {
      const dom = domainOf(addr);
      return send(res, 200, { ok: true,
        hasKey: !!key,
        from: addr || null,
        domain: dom || null,
        /* The sandbox address Resend hands out before any domain is verified.
           Named so the page can say what it means rather than showing it as an
           ordinary from-address that happens not to work for anybody. */
        sandbox: dom === "resend.dev",
        domainCheck: await domainStatus(key, dom === "resend.dev" ? null : dom),
        you: me.name ? { name: me.name, key: me.key } : null });
    }

    if (action === "test") {
      if (!key) return send(res, 400, { ok: false,
        error: "No RESEND_API_KEY in this deployment's environment variables." });
      if (!addr) return send(res, 400, { ok: false,
        error: "No SMP_MAIL_FROM in this deployment's environment variables." });
      const to = String(body.to || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
        return send(res, 400, { ok: false, error: "That is not an address." });
      }
      const name = String(body.fromName || "").trim();
      const html = String(body.html || "");
      if (!html) return send(res, 400, { ok: false, error: "Nothing to send." });
      try {
        const out = await resendSend(key, {
          from: name ? name + " <" + addr + ">" : addr,
          to: [to],
          subject: String(body.subject || "Test from the Strategy Management Platform"),
          html: html,
          reply_to: String(body.replyTo || "").trim() || undefined
        });
        return send(res, 200, { ok: true, id: out && out.id, to: to });
      } catch (e) {
        /* RESEND'S OWN SENTENCE, OR OURS — never undici's. A refusal from
           Resend names the real cause ("Domain is not verified", "API key is
           invalid") far better than anything generic here could. A network
           failure names nothing at all: "fetch failed" is what the person
           would otherwise read, and it tells them neither what broke nor
           whether the message went. */
        return send(res, 400, { ok: false,
          error: e.resend ? e.message
                          : "Could not reach Resend. Nothing was sent — try again." });
      }
    }

    /* ── WHO IT WOULD GO TO (§74.2) ────────────────────────────────
       Resolved HERE, against the stored register, and the composer shows what
       comes back. The browser never says who the recipients are — it says what
       was ticked, and this answers. */
    if (action === "audience") {
      const stored = await readState(client);
      const out = Audience.resolve(Rules.worldOf(stored), stored.people || [], body.criteria);
      return send(res, 200, { ok: true, to: out.to, skipped: out.skipped });
    }

    if (action === "send") {
      if (!key) return send(res, 400, { ok: false,
        error: "No RESEND_API_KEY in this deployment's environment variables." });
      if (!addr) return send(res, 400, { ok: false,
        error: "No SMP_MAIL_FROM in this deployment's environment variables." });

      const subject = String(body.subject || "").trim();
      const bodyText = String(body.body || "").trim();
      if (!subject) return send(res, 400, { ok: false, error: "A message needs a subject." });
      if (!bodyText) return send(res, 400, { ok: false, error: "A message needs something in it." });

      /* RESOLVED AGAIN, on the stored register, never taken from the request.
         The page resolved it a moment ago to show a list; between then and now
         somebody may have been retired, and in any case a posted list of
         addresses is the browser deciding who gets mail (§42). */
      const stored = await readState(client);
      const aud = Audience.resolve(Rules.worldOf(stored), stored.people || [], body.criteria);
      if (!aud.to.length) return send(res, 400, { ok: false,
        error: "Nobody on the register matches that, or none of them has an address." });
      if (aud.to.length > 500) return send(res, 400, { ok: false,
        error: "That is more than 500 people. Narrow it, or tell me and I will raise the cap." });

      const name = String(body.fromName || "").trim();
      const from = name ? name + " <" + addr + ">" : addr;
      const replyTo = String(body.replyTo || "").trim() || undefined;
      /* The HTML the PAGE built, so what arrives is what the preview drew
         (§72.3) — one builder, and the preview is not a picture of it. */
      const html = String(body.html || "");
      if (!html) return send(res, 400, { ok: false, error: "Nothing to send." });

      /* THE ROW IS WRITTEN BEFORE THE SEND, not after. A send that half
         succeeds and then loses the function is the case a record exists for,
         and a record written afterwards is exactly the one that would be
         missing. */
      const msg = (await client.query(
        "INSERT INTO messages (by_key, by_name, subject, body, cta_label, cta_href, audience, total) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
        [me.key, me.name || null, subject, bodyText,
         String(body.ctaLabel || "").trim() || null,
         String(body.ctaHref || "").trim() || null,
         JSON.stringify(body.criteria || {}), aud.to.length])).rows[0];

      let ok = 0, failed = 0;
      for (let i = 0; i < aud.to.length; i += BATCH_MAX) {
        const chunk = aud.to.slice(i, i + BATCH_MAX);
        let ids = [], err = null;
        try {
          ids = await resendBatch(key, chunk.map(function (r) {
            return { from: from, to: [r.email], subject: subject, html: html,
                     reply_to: replyTo };
          }));
        } catch (e) {
          err = e.resend ? e.message : "Could not reach Resend.";
        }
        for (let n = 0; n < chunk.length; n++) {
          const id = (ids && ids[n] && ids[n].id) || null;
          const good = !err && !!id;
          if (good) ok++; else failed++;
          await client.query(
            "INSERT INTO message_recipients (message_id, person_key, person_name, address, ok, error, provider_id) " +
            "VALUES ($1,$2,$3,$4,$5,$6,$7)",
            [msg.id, chunk[n].key, chunk[n].name, chunk[n].email, good,
             good ? null : (err || "Resend did not answer for this one"), id]);
        }
      }
      await client.query("UPDATE messages SET sent = $2, failed = $3 WHERE id = $1",
                         [msg.id, ok, failed]);
      return send(res, 200, { ok: true, id: msg.id, sent: ok, failed: failed,
                              skipped: aud.skipped });
    }

    /* What was sent, newest first. The SMO's own record — and the only place
       "did they get it" can be answered. */
    if (action === "history") {
      const rows = (await client.query(
        "SELECT id, sent_at, by_name, subject, total, sent, failed FROM messages " +
        "ORDER BY sent_at DESC LIMIT 50")).rows;
      return send(res, 200, { ok: true, messages: rows });
    }
    if (action === "historyOne") {
      const id = parseInt(body.id, 10);
      if (!id) return send(res, 400, { ok: false, error: "which message?" });
      const m = (await client.query("SELECT * FROM messages WHERE id = $1", [id])).rows[0];
      if (!m) return send(res, 404, { ok: false, error: "no such message" });
      const to = (await client.query(
        "SELECT person_name, address, ok, error FROM message_recipients " +
        "WHERE message_id = $1 ORDER BY ok DESC, person_name", [id])).rows;
      return send(res, 200, { ok: true, message: m, recipients: to });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500,
                { ok: false, error: "Something went wrong." });
  } finally {
    if (client) client.release();
  }
};
