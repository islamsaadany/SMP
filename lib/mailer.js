/* ══ THE ONE PLACE A MESSAGE LEAVES THE PLATFORM (§97.5) ═══════════════════

   EXTRACTED FROM api/mail.js, not written beside it. §72's rule was "api/mail.js
   is the only place RESEND_API_KEY is read, and nothing it returns contains
   it" — and the moment a SECOND endpoint had to send something (a chat reply
   to somebody who is not on the platform, §97), that rule had exactly two
   futures: a second copy of the credential handling, or one module both
   endpoints call. The rule is unchanged; the address it points at moved.

   NOTHING IN HERE KNOWS WHO ANYBODY IS. It takes an address, a subject and a
   block of HTML and posts them. Deciding WHO may be written to, and resolving
   a person into an address, is the caller's — and both callers do it against
   the STORED register, never against anything a browser sent (§74.2).

   NOTHING IT RETURNS OR THROWS CONTAINS THE KEY. The error carried back is
   Resend's own sentence, which names the real cause (an unverified domain, a
   bad address, a rate limit) far better than anything generic here could. */

/* ── THE PROVIDER'S ADDRESS IS AN ENVIRONMENT VARIABLE (spec 022) ────────
   Defaulting to the real one, so a deployment that sets nothing behaves
   exactly as it always has. It exists because a check has to be able to MODEL
   the provider rather than branch around it (§100.3, the same reason
   GEMINI_ENDPOINT is one): what each recipient was actually sent is the whole
   of what spec 022 claims, and the only way to know it is to stand in front
   of the send and read it. A test double that lived behind an `if` in this
   file would be a second code path shipping to production. */
const RESEND = String(process.env.SMP_RESEND_ENDPOINT || "").trim() ||
               "https://api.resend.com";

/* The key, read here and nowhere else. Absent is a normal state — a deployment
   with no mail configured simply does not send, and every caller checks. */
function apiKey() { return process.env.RESEND_API_KEY || ""; }

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

/* `Name <addr>`, or the bare address when nobody has set a display name. */
function fromHeader(name) {
  const addr = fromAddress();
  const n = String(name || "").trim();
  return n ? n + " <" + addr + ">" : addr;
}

/* Can this deployment send at all? Asked before anything is written, so a
   caller can say "no mail is configured here" rather than failing later. */
function configured() { return !!apiKey() && !!fromAddress(); }

/* ── A SEND THAT NEVER COMES BACK MUST NOT HOLD UP THE REQUEST IT RODE IN
   ON (§302) ──────────────────────────────────────────────────────────────
   Islam, of the Knowledge base's questions list: it drew a garbled failure
   card reading "no answer" while the assistant beside it was answering
   normally. "no answer" is the BROWSER's own 25-second clock, so the list had
   not failed — it had HUNG, behind §293's collection sweep, which every
   /api/chat request runs before it does anything else.

   AND THE HANG HAD NO END, because `fetch` has no timeout of its own: a
   provider that accepts the connection and never answers holds the socket for
   as long as the function is allowed to live. Measured against a stand-in
   provider doing exactly that, `askQuestions` — a 15ms query — hung past 45
   seconds, while the very next request answered in 18ms, because the sweep is
   throttled once a minute per instance. That is the report exactly: one
   request a minute paid the whole hang, and it was the one asking for the
   list.

   TEN SECONDS IS GENEROUS AND IS NOT THE INTERESTING NUMBER. A real send is
   well under two; what matters is that there IS a ceiling, in the one place
   every message leaves from, so no caller has to remember one.

   THE COST IS STATED: a provider that is genuinely slow rather than stuck can
   now be cut off after it has accepted the message, so that message may go and
   be counted as failed. Nothing here stamps a conversation unless the send
   came back with an id (§293), so the next sweep tries again — and the price
   of that is one duplicate email, against a platform that stops answering. */
const MAIL_WAIT = 10000;

/* ONE POST, TWO ENDPOINTS. The single and batch calls were the same twelve
   lines twice, and a ceiling written into one of them is a ceiling the other
   does not have (§53.5). */
async function call(key, path, body) {
  const stop = new AbortController();
  const clock = setTimeout(function () { stop.abort(); }, MAIL_WAIT);
  let r;
  try {
    r = await fetch(RESEND + path, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: stop.signal
    });
  } catch (err) {
    /* AN ABORT IS OURS AND IS SAID AS SUCH. Every other network error keeps
       its own words. `timeout` is what lets a caller tell "this address is
       wrong" from "the provider is not answering at all" — the first costs one
       message, the second costs every message after it (§302). */
    if (stop.signal.aborted) {
      const e = new Error("The mail provider did not answer within " +
                          Math.round(MAIL_WAIT / 1000) + " seconds.");
      e.timeout = true; throw e;
    }
    throw err;
  } finally {
    clearTimeout(clock);
  }
  const j = await r.json().catch(function () { return null; });
  if (!r.ok) {
    const why = (j && (j.message || (j.error && j.error.message))) || ("Resend said " + r.status + ".");
    const e = new Error(why); e.resend = true; throw e;
  }
  return j;
}

async function resendSend(key, payload) {
  return await call(key, "/emails", payload);
}

async function resendBatch(key, emails) {
  const j = await call(key, "/emails/batch", emails);
  return (j && (j.data || j)) || [];
}

/* ONE MESSAGE TO ONE PERSON. Returns the provider's id, or null when this
   deployment has no mail configured — never throws for that, because "there is
   no mail here" is a normal deployment and not a failure of the thing that
   asked. A provider refusal still throws, with Resend's own sentence. */
async function sendOne(opts) {
  const key = apiKey();
  if (!key || !fromAddress()) return null;
  const out = await resendSend(key, {
    from: fromHeader(opts.fromName),
    to: [opts.to],
    subject: String(opts.subject || ""),
    html: String(opts.html || ""),
    reply_to: String(opts.replyTo || "").trim() || undefined
  });
  return (out && out.id) || null;
}

module.exports = {
  RESEND,
  apiKey, fromAddress, fromHeader, domainOf, configured,
  resendSend, resendBatch, sendOne
};
