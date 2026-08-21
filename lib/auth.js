/* Identity, Phase 1 of the real build (§19).

   Passwords are scrypt-hashed with a per-password salt and compared in
   constant time; only the hash is ever stored. Sessions are random tokens in
   an httpOnly cookie, stored server-side by their SHA-256 so a leaked table
   cannot be replayed. The policy is HR_ERP's, adopted as proposed: at least
   8 characters with an uppercase letter, a number and a special character;
   admin-issued passwords are temporary and force a change on first sign-in. */

const crypto = require("crypto");

const COOKIE = "smp_session";
const SESSION_DAYS = 30;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pw), salt, 32).toString("hex");
  return "s1:" + salt + ":" + hash;
}

function verifyPassword(pw, stored) {
  const parts = String(stored || "").split(":");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  const hash = crypto.scryptSync(String(pw), parts[1], 32);
  const want = Buffer.from(parts[2], "hex");
  return hash.length === want.length && crypto.timingSafeEqual(hash, want);
}

/* null when acceptable, otherwise the sentence to show. */
function passwordPolicy(pw) {
  pw = String(pw || "");
  if (pw.length < 8) return "at least 8 characters";
  if (!/[A-Z]/.test(pw)) return "at least one uppercase letter";
  if (!/[0-9]/.test(pw)) return "at least one number";
  if (!/[^A-Za-z0-9]/.test(pw)) return "at least one special character";
  return null;
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createSession(client, personKey) {
  const token = crypto.randomBytes(32).toString("base64url");
  await client.query(
    "INSERT INTO sessions (token_hash, person_key, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)",
    [tokenHash(token), personKey, String(SESSION_DAYS)]);
  return token;
}

function readCookie(req) {
  const raw = req.headers && req.headers.cookie;
  if (!raw) return null;
  for (const part of String(raw).split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq) === COOKIE) return part.slice(eq + 1);
  }
  return null;
}

/* The signed-in person, joined live against the people table — a session
   whose person no longer exists simply stops resolving. */
async function getSession(client, req) {
  const token = readCookie(req);
  if (!token) return null;
  /* A session held by someone since retired is no session. Checked on every
     read rather than by deleting their sessions at retirement, because the
     truth is "may this person act", and a row that answers it directly cannot
     be left behind by a step somebody forgot to run. */
  const r = await client.query(
    "SELECT s.person_key, p.name, p.role, p.unit_key, p.fn_key, p.title, c.must_change " +
    "FROM sessions s " +
    "JOIN people p ON p.key = s.person_key " +
    "LEFT JOIN credentials c ON c.person_key = s.person_key " +
    "WHERE s.token_hash = $1 AND s.expires_at > now() " +
    "  AND COALESCE(p.extra->>'active', 'true') <> 'false'",
    [tokenHash(token)]);
  if (!r.rowCount) return null;
  const p = r.rows[0];
  /* `role` is the SEAT role only — super / gceo / cceo — which is all the
     server needs: the only authorisation it enforces today is "is this the
     SMO". Owner, custodian and function head are read on the client from what
     points at the person (§33), and per-action authorisation is Phase 2
     (§19.2). */
  return { key: p.person_key, name: p.name, role: p.role, unit: p.unit_key,
           fn: p.fn_key, title: p.title, mustChange: !!p.must_change };
}

async function destroySession(client, req) {
  const token = readCookie(req);
  if (token) await client.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
}

function cookieHeader(req, token, expire) {
  const secure = (req.headers && req.headers["x-forwarded-proto"]) === "https" ? "; Secure" : "";
  if (expire) return COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + secure;
  return COOKIE + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    (SESSION_DAYS * 86400) + secure;
}

module.exports = { hashPassword, verifyPassword, passwordPolicy,
                   createSession, getSession, destroySession, cookieHeader };
