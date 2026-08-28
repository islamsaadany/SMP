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

async function resendSend(key, payload) {
  const r = await fetch(RESEND + "/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const j = await r.json().catch(function () { return null; });
  if (!r.ok) {
    const why = (j && (j.message || (j.error && j.error.message))) || ("Resend said " + r.status + ".");
    const e = new Error(why); e.resend = true; throw e;
  }
  return j;
}

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
