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

/* ── IDENTITY LIVES IN THE PLATFORM SCHEMA (spec 024) ─────────────────
   Sign-in happens BEFORE a client is chosen, so the password cannot live
   inside one: `platform.accounts` is keyed by email, and `account_clients`
   says which client each account is, and who it is inside it.

   Every statement below names its schema explicitly rather than leaning on
   search_path. The connection is pointed at the CLIENT — that is what makes
   the rest of the endpoint work — and each client schema still carries its own
   `sessions` and `credentials` tables from migration 002, so an unqualified
   name would resolve to the wrong one, silently and in the direction that
   looks fine. */
const T_SESSIONS = "platform.sessions";
const T_ACCOUNTS = "platform.accounts";
const T_ACCOUNT_CLIENTS = "platform.account_clients";
const T_ATTEMPTS = "platform.login_attempts";

/* The one refusal, matching lib/platform-io.js's word for word — declared here
   rather than imported to keep this file free of a cycle, and asserted equal
   by scripts/test-platform.js so the two can never drift apart. */
function notThisClient() {
  const e = new Error("That client is not available.");
  e.code = "NO_CLIENT";
  return e;
}

async function createSession(client, email) {
  const token = crypto.randomBytes(32).toString("base64url");
  await client.query(
    "INSERT INTO " + T_SESSIONS + " (token_hash, email, expires_at) " +
    "VALUES ($1, $2, now() + ($3 || ' days')::interval)",
    [tokenHash(token), String(email).toLowerCase(), String(SESSION_DAYS)]);
  return token;
}

/* Who is this account INSIDE this client? One row, or none — and none means
   they hold nothing here, whatever they hold elsewhere. */
async function seatIn(client, clientKey, email) {
  const r = await client.query(
    "SELECT person_key, seat FROM " + T_ACCOUNT_CLIENTS + " WHERE email = $1 AND client_key = $2",
    [String(email).toLowerCase(), String(clientKey)]);
  return r.rowCount ? r.rows[0] : null;
}

/* The email an account uses, found from who they are inside a client. Needed
   wherever the register speaks in person keys and the door speaks in
   addresses — which is every password control on the People page. */
async function emailOf(client, clientKey, personKey) {
  const r = await client.query(
    "SELECT email FROM " + T_ACCOUNT_CLIENTS + " WHERE client_key = $1 AND person_key = $2",
    [String(clientKey), String(personKey)]);
  return r.rowCount ? r.rows[0].email : null;
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
async function getSession(client, req, clientKey) {
  const token = readCookie(req);
  if (!token) return null;
  /* A session held by someone since retired is no session. Checked on every
     read rather than by deleting their sessions at retirement, because the
     truth is "may this person act", and a row that answers it directly cannot
     be left behind by a step somebody forgot to run. */
  /* THE SESSION IS THE ACCOUNT'S; THE PERSON IS THE CLIENT'S. Two lookups
     rather than one join, because they answer two different questions: is this
     token still somebody, and who is that somebody HERE. A session held by a
     retired account is no session (checked on every read rather than by
     deleting rows at retirement — the truth is "may this account act", and a
     row that answers it directly cannot be left behind by a step somebody
     forgot to run). */
  const a = await client.query(
    "SELECT s.email, a.name, a.kind, a.is_admin, a.must_change " +
    "FROM " + T_SESSIONS + " s JOIN " + T_ACCOUNTS + " a ON a.email = s.email " +
    "WHERE s.token_hash = $1 AND s.expires_at > now() AND a.status <> 'retired'",
    [tokenHash(token)]);
  if (!a.rowCount) return null;
  const acct = a.rows[0];
  if (!clientKey) {
    /* Asked outside any client — the outer platform's own pages. */
    return { key: null, email: acct.email, name: acct.name, kind: acct.kind,
             isAdmin: !!acct.is_admin, mustChange: !!acct.must_change };
  }
  /* ── SIGNED IN, AND NOT FOR THIS CLIENT (spec 024) ───────────────
     Answered as "that client is not available" — the SAME refusal an unknown
     slug gets, and deliberately not a 401. A door that says "sign in first"
     for a client that exists and "no such client" for one that does not has
     told an outsider which clients Forefront has, one slug at a time. */
  const seat = await seatIn(client, clientKey, acct.email);
  if (!seat) throw notThisClient();
  if (acct.kind !== "client") {
    /* An office account is governed by the office's table: holding a seat on
       a client is not the same as being allowed to open it (an Observer's
       row may say nothing at all). Asked through the SHARED rules, so the
       cards and the endpoints can never disagree about the same client. */
    const FF = require("./platform-rules.js");
    const world = {
      mine: (await client.query(
        "SELECT client_key, person_key, seat FROM " + T_ACCOUNT_CLIENTS + " WHERE email = $1",
        [acct.email])).rows,
      access: (await client.query(
        "SELECT role_key, area_key, grant_ FROM platform.platform_access")).rows
        .reduce(function (m, r) { (m[r.role_key] = m[r.role_key] || {})[r.area_key] = r.grant_; return m; }, {})
    };
    const row = (await client.query(
      "SELECT key, kind, status FROM platform.clients WHERE key = $1", [clientKey])).rows[0];
    const account = { email: acct.email, is_admin: acct.is_admin, kind: acct.kind, status: "active" };
    if (!FF.mayOpenClient(world, account, row)) throw notThisClient();
  }
  const r = await client.query(
    "SELECT p.key AS person_key, p.name, p.role, p.unit_key, p.fn_key, p.title " +
    "FROM people p WHERE p.key = $1 " +
    "  AND COALESCE(p.extra->>'active', 'true') <> 'false'",
    [seat.person_key]);
  /* NO ROW ON THIS CLIENT'S REGISTER IS NOT NOBODY. An office account opening
     a client for the first time has no row there yet — the row is written as
     they arrive (spec §6) — so the seat from the configuration is what answers
     until it exists, rather than a null that would read as "not signed in". */
  const p = r.rowCount ? r.rows[0]
          : { person_key: seat.person_key, name: acct.name,
              /* THE SEAT THE CONFIGURATION GIVES THEM (revision 3) — the
                 client's own word, so nothing downstream translates. */
              role: seat.seat || "smoteam",
              unit_key: null, fn_key: null, title: null };
  p.must_change = acct.must_change;
  p.email = acct.email;
  p.kind = acct.kind;
  p.seat = seat.seat || "smoteam";
  /* `role` is the SEAT role only — super / gceo / cceo — which is all the
     server needs: the only authorisation it enforces today is "is this the
     SMO". Owner, custodian and function head are read on the client from what
     points at the person (§33), and per-action authorisation is Phase 2
     (§19.2). */
  return { key: p.person_key, name: p.name, role: p.role, unit: p.unit_key,
           fn: p.fn_key, title: p.title, mustChange: !!p.must_change,
           email: p.email, kind: p.kind, seat: p.seat,
           isAdmin: !!acct.is_admin };
}

async function destroySession(client, req) {
  const token = readCookie(req);
  if (token) await client.query("DELETE FROM " + T_SESSIONS + " WHERE token_hash = $1", [tokenHash(token)]);
}

/* Every session this person holds EXCEPT the one making the request. Called
   when they choose a new password: the old one may be the reason they are
   choosing, and a password change that leaves the old sessions alive changes
   nothing for whoever already has one. */
async function destroyOtherSessions(client, req, email) {
  const token = readCookie(req);
  await client.query(
    "DELETE FROM " + T_SESSIONS + " WHERE email = $1 AND token_hash <> $2",
    [String(email).toLowerCase(), token ? tokenHash(token) : ""]);
}

/* Every session an account holds, ended — a reset is usually a lockout or a
   handover, and either way the old sessions die. */
async function destroySessionsFor(client, emails) {
  if (!emails || !emails.length) return;
  await client.query("DELETE FROM " + T_SESSIONS + " WHERE email = ANY($1)",
    [emails.map(function (e) { return String(e).toLowerCase(); })]);
}

/* Expired rows are never read — getSession filters on expires_at — but they
   are never removed either, so the table grew for ever. There is no scheduler
   in a serverless deployment, so the cheap honest place is the sign-in path:
   one DELETE, on a request that is already writing. */
async function pruneExpired(client) {
  await client.query("DELETE FROM " + T_SESSIONS + " WHERE expires_at < now()");
  await client.query(
    "DELETE FROM " + T_ATTEMPTS + " WHERE at < now() - ($1 || ' minutes')::interval",
    [String(ATTEMPT_WINDOW_MIN)]);
}

/* ── Slowing down a guess ─────────────────────────────────────────────
   Two thresholds, because they answer two different attacks. PER KEY stops
   somebody working through a password list against one person. PER ADDRESS
   stops them working through a list of PEOPLE instead — person keys are short
   and guessable, so without this the username half of a guess is free.

   The window is short and self-clearing rather than a lock somebody has to
   lift, deliberately: see the note in migration 012. */
const ATTEMPT_WINDOW_MIN = 15;
const MAX_PER_KEY = 8;
const MAX_PER_IP = 25;

function clientIp(req) {
  const h = (req && req.headers) || {};
  const fwd = h["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim().slice(0, 60);
  return String(h["x-real-ip"] || (req.socket && req.socket.remoteAddress) || "").slice(0, 60);
}

/* null when the attempt may proceed, otherwise the sentence to show. The
   sentence never says WHICH threshold was hit or whether the key exists —
   a rate limiter that confirms usernames has given away what it was
   protecting. */
async function tooManyAttempts(client, key, ip) {
  const r = await client.query(
    "SELECT count(*) FILTER (WHERE key_tried = $1) AS by_key, " +
    "       count(*) FILTER (WHERE ip = $2 AND $2 <> '') AS by_ip " +
    "FROM " + T_ATTEMPTS + " WHERE at > now() - ($3 || ' minutes')::interval",
    [key, ip, String(ATTEMPT_WINDOW_MIN)]);
  const row = r.rows[0] || {};
  if (Number(row.by_key) >= MAX_PER_KEY || Number(row.by_ip) >= MAX_PER_IP) {
    return "Too many sign-in attempts. Wait " + ATTEMPT_WINDOW_MIN +
           " minutes and try again, or ask the SMO to reset your password.";
  }
  return null;
}
async function recordFailure(client, key, ip) {
  await client.query("INSERT INTO " + T_ATTEMPTS + " (key_tried, ip) VALUES ($1,$2)", [key, ip]);
}
async function clearFailures(client, key) {
  await client.query("DELETE FROM " + T_ATTEMPTS + " WHERE key_tried = $1", [key]);
}

function cookieHeader(req, token, expire) {
  const secure = (req.headers && req.headers["x-forwarded-proto"]) === "https" ? "; Secure" : "";
  if (expire) return COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + secure;
  return COOKIE + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    (SESSION_DAYS * 86400) + secure;
}

module.exports = { hashPassword, verifyPassword, passwordPolicy,
                   seatIn, emailOf, destroySessionsFor, notThisClient,
                   createSession, getSession, destroySession, destroyOtherSessions,
                   pruneExpired, cookieHeader,
                   clientIp, tooManyAttempts, recordFailure, clearFailures,
                   ATTEMPT_WINDOW_MIN, MAX_PER_KEY, MAX_PER_IP };
