/* /api/auth — sign in, sign out, who am I, change my password, and (SMO
   only) read who has a password, issue or reset one, and issue temporary
   passwords in bulk. One endpoint, action-shaped, because the operations
   share every line of plumbing.

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

/* A database error names tables, columns and sometimes values. None of that
   belongs in a browser: it is a free map of the schema to anyone probing, and
   it means nothing to the person who hit it. The real error goes to the
   function's own log, where it is visible to us and to nobody else. */
function safeError(e) {
  if (e && e.code === "NO_DB") return String(e.message);
  console.error("api/auth:", e && (e.stack || e.message || e));
  return "Something went wrong. Try again, and tell the SMO if it keeps happening.";
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
      const ip = auth.clientIp(req);
      /* One DELETE on a path that is already writing — there is no scheduler
         in a serverless deployment, and expired sessions and stale attempts
         were accumulating for ever. */
      await auth.pruneExpired(client);
      /* Checked BEFORE the password is verified, or the limiter is a timing
         oracle: a wrong password would take a scrypt hash's worth of time and
         a locked-out one would not. */
      const slow = await auth.tooManyAttempts(client, key, ip);
      if (slow) return send(res, 429, { ok: false, error: slow });
      const cred = (await client.query(
        "SELECT c.password_hash, c.must_change, p.name, p.role, " +
        "       COALESCE(p.extra->>'active', 'true') <> 'false' AS active " +
        "FROM credentials c JOIN people p ON p.key = c.person_key WHERE c.person_key = $1", [key])).rows[0];
      /* One message for a wrong name and a wrong password — a login screen
         should not confirm which usernames exist. A RETIRED person gets the
         same one: they are refused here, on the server, and not only by a
         client that stops offering them roles. Retirement is what happens when
         somebody leaves, so it has to close the door, not just the menu. */
      if (!cred || !cred.active || !auth.verifyPassword(body.password, cred.password_hash)) {
        await auth.recordFailure(client, key, ip);
        return send(res, 401, { ok: false, error: "Wrong sign-in. Check both fields, or ask the SMO to reset your password." });
      }
      /* Getting in clears this key's failures: the threshold is there to slow
         a guess, and a guess that succeeded is not what it is counting. */
      await auth.clearFailures(client, key);
      const token = await auth.createSession(client, key);
      res.setHeader("Set-Cookie", auth.cookieHeader(req, token));
      return send(res, 200, { ok: true, person: { key: key, name: cred.name, role: cred.role, mustChange: cred.must_change } });
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
      /* The old password may be exactly why they are changing it, so every
         other session it opened ends here. Their own stays: being signed out
         of the tab you just used to choose a password is not security, it is
         a bug that looks like one. */
      await auth.destroyOtherSessions(client, req, person.key);
      await auth.clearFailures(client, person.key);
      return send(res, 200, { ok: true });
    }

    if (action === "setPassword") {
      const person = await auth.getSession(client, req);
      /* The server's own check, not the client's. The SEAT role is stored on
         the person, so this stays a single column comparison — 'super' is what
         'smo' was called before roles (§33). */
      if (!person || person.role !== "super") {
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

    /* Who has a password, and is it still the temporary one. The People page
       cannot show a "no password yet" column without this, and it cannot be
       derived from the state graph: credentials live in their own table and
       deliberately never enter the graph (§19). Keys and states only — no
       hash, no timestamp, nothing that helps anyone guess. */
    if (action === "passwordStates") {
      const person = await auth.getSession(client, req);
      if (!person || person.role !== "super") {
        return send(res, 403, { ok: false, error: "Passwords are the SMO's." });
      }
      const rows = (await client.query(
        "SELECT p.key, c.must_change FROM people p LEFT JOIN credentials c ON c.person_key = p.key")).rows;
      const states = {};
      rows.forEach(function (r) {
        states[r.key] = r.must_change == null ? "none" : (r.must_change ? "temporary" : "set");
      });
      return send(res, 200, { ok: true, states: states });
    }

    /* Bulk issue: one temporary password, set for everyone who has NONE.
       Islam chose one shared password over one generated each — it is
       single-use by construction (must_change forces a change on first
       sign-in), and a list of per-person passwords has to be carried
       somewhere, which in practice is less safe than the password was.

       THE SERVER DECIDES WHO IS IN THE SET, not the client. The client knows
       who has no password only because passwordStates told it, and a client
       that sends a list can send a longer one — this way the worst a bad
       request can do is nothing, because anyone with a password is excluded
       by the query itself. Nobody's existing password is ever overwritten
       here; resetting one person is the per-row action, deliberately. */
    if (action === "issueTemporary") {
      const person = await auth.getSession(client, req);
      if (!person || person.role !== "super") {
        return send(res, 403, { ok: false, error: "Issuing passwords is the SMO's." });
      }
      const why = auth.passwordPolicy(body.password);
      if (why) return send(res, 400, { ok: false, error: "The password needs " + why + "." });
      const hash = auth.hashPassword(body.password);
      const done = await client.query(
        "INSERT INTO credentials (person_key, password_hash, must_change) " +
        "SELECT p.key, $1, true FROM people p " +
        "WHERE NOT EXISTS (SELECT 1 FROM credentials c WHERE c.person_key = p.key) " +
        "RETURNING person_key",
        [hash]);
      return send(res, 200, { ok: true, issued: done.rows.map(function (r) { return r.person_key; }) });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500, { ok: false, error: safeError(e) });
  } finally {
    if (client) client.release();
  }
};
