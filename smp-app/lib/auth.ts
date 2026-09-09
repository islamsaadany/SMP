/* The door — lib/auth.js ported rule for rule (research §P1, §43). No
   library: every rule here is already decided and already in production.

   Passwords: scrypt with a per-password salt, `s1:<salt>:<hash>`, compared in
   constant time — the SAME encoding, so a hash carried across from
   platform.accounts verifies unchanged (§314.1, "nobody gets a new password").
   Sessions: a random token in an httpOnly cookie, stored by its SHA-256,
   30 days, keyed on users.id. Attempts: 8 per email and 25 per address in a
   rolling 15 minutes, checked BEFORE the password is verified (a limiter
   consulted after verification is a timing oracle), failures only, cleared
   on success, pruned on the sign-in path because there is no scheduler.
   A password change ends every OTHER session (§43.7) — never the one making
   the request.

   users, sessions and login_attempts are platform tables with no policy on
   them; smp_app holds its privileges on them through db/roles.sql, so every
   query here runs on the app pool and none needs the owner. */
import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { appPool } from "./db.ts";

export const COOKIE = "smp_session";
export const SESSION_DAYS = 30;
export const ATTEMPT_WINDOW_MIN = 15;
export const MAX_PER_KEY = 8;
export const MAX_PER_IP = 25;

type Q = Pool | PoolClient;

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pw), salt, 32).toString("hex");
  return "s1:" + salt + ":" + hash;
}
export function verifyPassword(pw: string, stored: string | null | undefined): boolean {
  const parts = String(stored || "").split(":");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  const hash = crypto.scryptSync(String(pw), parts[1], 32);
  const want = Buffer.from(parts[2], "hex");
  return hash.length === want.length && crypto.timingSafeEqual(hash, want);
}
/* null when acceptable, otherwise the sentence to show. */
export function passwordPolicy(pw: string): string | null {
  pw = String(pw || "");
  if (pw.length < 8) return "at least 8 characters";
  if (!/[A-Z]/.test(pw)) return "at least one uppercase letter";
  if (!/[0-9]/.test(pw)) return "at least one number";
  if (!/[^A-Za-z0-9]/.test(pw)) return "at least one special character";
  return null;
}
export function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string; email: string; name: string; kind: "office" | "client";
  isAdmin: boolean; mustChange: boolean;
};

export async function createSession(c: Q, userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await c.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)",
    [tokenHash(token), userId, String(SESSION_DAYS)]);
  return token;
}

/* The signed-in login — a session whose user has since been retired simply
   stops resolving, checked on every read rather than at retirement. */
export async function getSession(c: Q, token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const r = await c.query(
    "SELECT u.id, u.email, u.name, u.kind, u.is_admin, u.must_change FROM sessions s JOIN users u ON u.id = s.user_id " +
    "WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status <> 'retired'", [tokenHash(token)]);
  if (!r.rowCount) return null;
  const u = r.rows[0];
  return { id: u.id, email: u.email, name: u.name, kind: u.kind, isAdmin: !!u.is_admin, mustChange: !!u.must_change };
}

export function readCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of String(cookieHeader).split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq) === COOKIE) return part.slice(eq + 1);
  }
  return null;
}
export function cookieFor(token: string, secure: boolean): string {
  return COOKIE + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + (SESSION_DAYS * 86400) + (secure ? "; Secure" : "");
}

/* ── Slowing down a guess (§43) ─────────────────────────────────────── */
export async function pruneExpired(c: Q): Promise<void> {
  await c.query("DELETE FROM sessions WHERE expires_at < now()");
  await c.query("DELETE FROM login_attempts WHERE at < now() - ($1 || ' minutes')::interval", [String(ATTEMPT_WINDOW_MIN)]);
}
/* null when the attempt may proceed, otherwise the sentence to show — which
   never says WHICH threshold was hit or whether the email exists. */
export async function tooManyAttempts(c: Q, key: string, ip: string): Promise<string | null> {
  const r = await c.query(
    "SELECT count(*) FILTER (WHERE key_tried = $1) AS by_key, count(*) FILTER (WHERE ip = $2 AND $2 <> '') AS by_ip " +
    "FROM login_attempts WHERE at > now() - ($3 || ' minutes')::interval", [key, ip, String(ATTEMPT_WINDOW_MIN)]);
  const row = r.rows[0] || {};
  if (Number(row.by_key) >= MAX_PER_KEY || Number(row.by_ip) >= MAX_PER_IP) {
    return "Too many sign-in attempts. Wait " + ATTEMPT_WINDOW_MIN + " minutes and try again, or ask the SMO to reset your password.";
  }
  return null;
}
export async function recordFailure(c: Q, key: string, ip: string): Promise<void> {
  await c.query("INSERT INTO login_attempts (key_tried, ip) VALUES ($1, $2)", [key, ip]);
}
export async function clearFailures(c: Q, key: string): Promise<void> {
  await c.query("DELETE FROM login_attempts WHERE key_tried = $1", [key]);
}

/* ── Sign in: limit → verify → session (that order) ─────────────────── */
export type SignInResult =
  | { ok: true; token: string; user: SessionUser }
  | { ok: false; message: string };

const WRONG = "That email and password do not match.";

export async function signIn(c: Q, email: string, password: string, ip: string): Promise<SignInResult> {
  const key = String(email || "").trim().toLowerCase();
  await pruneExpired(c);
  const slow = await tooManyAttempts(c, key, ip);
  if (slow) { await recordFailure(c, key, ip); return { ok: false, message: slow }; }
  const r = await c.query(
    "SELECT id, email, name, kind, is_admin, must_change, password_hash FROM users WHERE email = $1 AND status <> 'retired'", [key]);
  const u = r.rows[0];
  if (!u || !verifyPassword(password, u.password_hash)) {
    await recordFailure(c, key, ip);
    return { ok: false, message: WRONG };
  }
  await clearFailures(c, key);
  const token = await createSession(c, u.id);
  return { ok: true, token, user: { id: u.id, email: u.email, name: u.name, kind: u.kind, isAdmin: !!u.is_admin, mustChange: !!u.must_change } };
}

export async function signOut(c: Q, token: string | null): Promise<void> {
  if (token) await c.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
}

/* Does this password open this account today? Asked by the password change
   when the account is NOT on a temporary password (contracts §2: `current`) —
   a settled password is changed only by somebody who knows it. */
export async function verifyCurrent(c: Q, userId: string, current: string): Promise<boolean> {
  const r = await c.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
  return !!r.rowCount && verifyPassword(current, r.rows[0].password_hash);
}

/* A new password: the policy, the hash, must_change cleared, and every OTHER
   session of this user ended (§43.7) — never the one asking. */
export async function changePassword(c: Q, userId: string, keepToken: string | null, next: string): Promise<string | null> {
  const bad = passwordPolicy(next);
  if (bad) return bad;
  await c.query("UPDATE users SET password_hash = $2, must_change = false, updated_at = now() WHERE id = $1", [userId, hashPassword(next)]);
  await c.query("DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2", [userId, keepToken ? tokenHash(keepToken) : ""]);
  return null;
}

/* The pool every door query runs on. */
export function doorPool(): Pool { return appPool(); }
