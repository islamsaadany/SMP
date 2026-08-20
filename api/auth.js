/* /api/auth — sign in, sign out, who am I, change my password, and (SMO
   only) issue or reset anyone's. One endpoint, action-shaped, because the
   five operations share every line of plumbing.

   Usernames are person keys — the same keys the platform uses everywhere
   (§4: stable ids are the contract). The SMO sees each person's key beside
   the Set-password control on Levels & access and hands credentials over
   outside the platform; self-service recovery is a later decision (§16.9),
   so a forgotten password is reset by the SMO. */

const pg = require("pg");
const { ensureReady, tuneTypes } = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

let pool = null;
function getPool() {
  if (pool) return pool;
  tuneTypes(pg);
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;
  if (!url) {
    const e = new Error("No database connection configured.");
    e.code = "NO_DB";
    throw e;
  }
  pool = new pg.Pool({ connectionString: url, max: 3 });
  return pool;
}

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
  }
  return new Promise(function (resolve, reject) {
    let data = "";
    req.on("data", function (c) { data += c; });
    req.on("end", function () {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  let client;
  try {
    client = await getPool().connect();
    await ensureReady(client);
    const body = req.method === "POST" ? await readBody(req) : {};
    const action = body.action || (req.method === "GET" ? "me" : "");

    if (action === "me") {
      const person = await auth.getSession(client, req);
      return send(res, 200, { ok: true, person: person });
    }

    if (action === "login") {
      const key = String(body.user || "").trim().toLowerCase();
      const cred = (await client.query(
        "SELECT c.password_hash, c.must_change, p.name, p.level FROM credentials c " +
        "JOIN people p ON p.key = c.person_key WHERE c.person_key = $1", [key])).rows[0];
      /* One message for a wrong name and a wrong password — a login screen
         should not confirm which usernames exist. */
      if (!cred || !auth.verifyPassword(body.password, cred.password_hash)) {
        return send(res, 401, { ok: false, error: "Wrong sign-in. Check both fields, or ask the SMO to reset your password." });
      }
      const token = await auth.createSession(client, key);
      res.setHeader("Set-Cookie", auth.cookieHeader(req, token));
      return send(res, 200, { ok: true, person: { key: key, name: cred.name, level: cred.level, mustChange: cred.must_change } });
    }

    if (action === "logout") {
      await auth.destroySession(client, req);
      res.setHeader("Set-Cookie", auth.cookieHeader(req, "", true));
      return send(res, 200, { ok: true });
    }

    if (action === "change") {
      const person = await auth.getSession(client, req);
      if (!person) return send(res, 401, { ok: false, error: "sign in first" });
      const why = auth.passwordPolicy(body.password);
      if (why) return send(res, 400, { ok: false, error: "The password needs " + why + "." });
      await client.query(
        "UPDATE credentials SET password_hash = $1, must_change = false, updated_at = now() WHERE person_key = $2",
        [auth.hashPassword(body.password), person.key]);
      return send(res, 200, { ok: true });
    }

    if (action === "setPassword") {
      const person = await auth.getSession(client, req);
      if (!person || person.level !== "smo") {
        return send(res, 403, { ok: false, error: "Issuing passwords is the SMO's." });
      }
      const key = String(body.person || "").trim();
      const exists = (await client.query("SELECT 1 FROM people WHERE key = $1", [key])).rowCount;
      if (!exists) return send(res, 400, { ok: false, error: "No person with key " + key + "." });
      const why = auth.passwordPolicy(body.password);
      if (why) return send(res, 400, { ok: false, error: "The password needs " + why + "." });
      /* Admin-issued passwords are temporary: the person must choose their
         own on first sign-in. Their existing sessions end — a reset is
         usually a lockout or a handover, and either way old sessions die. */
      await client.query(
        "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1, $2, true) " +
        "ON CONFLICT (person_key) DO UPDATE SET password_hash = $2, must_change = true, updated_at = now()",
        [key, auth.hashPassword(body.password)]);
      await client.query("DELETE FROM sessions WHERE person_key = $1", [key]);
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500, { ok: false, error: String(e.message || e) });
  } finally {
    if (client) client.release();
  }
};
