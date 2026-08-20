/* /api/state — the platform's one persistence endpoint.

   GET  → the whole state graph, in exactly the shapes the front end holds.
          On first contact with an empty database it applies the schema and
          seeds it (advisory-locked, so concurrent cold starts cannot
          double-seed) — this is "database building and seeding on
          deployment": the deployment IS the first request.
   POST → replaces the state transactionally, through the same writer the
          seed uses. Last writer wins; the platform has one SMO.

   The connection comes from the environment Vercel already holds (the Neon
   integration's standard names) — never from anywhere else. */

const pg = require("pg");
const { writeState, readState, ensureReady, tuneTypes } = require("../lib/state-io.js");
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
    const e = new Error("No database connection configured. Connect the Neon integration " +
      "(it sets DATABASE_URL) in the Vercel project settings.");
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
      try { resolve(data ? JSON.parse(data) : null); } catch (e) { reject(e); }
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
    const ready = await ensureReady(client);

    /* Since v2.1 the state is for signed-in people only (§19). Phase 1
       enforces WHO at the door; per-action WHAT enforcement is Phase 2 and
       recorded as such. */
    const person = await auth.getSession(client, req);
    if (!person) return send(res, 401, { ok: false, auth: true, error: "sign in required" });

    if (req.method === "GET") {
      const state = await readState(client);
      return send(res, 200, { ok: true, seeded: ready.seeded, person: person, state: state });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      const state = body && body.state;
      /* A minimal shape check — a malformed save must fail loudly rather than
         wipe the tenant with nothing to write back. */
      if (!state || !state.group || !state.units || !Array.isArray(state.unitKeys) || !state.unitKeys.length) {
        return send(res, 400, { ok: false, error: "state is missing or not shaped like the platform's graph" });
      }
      await writeState(client, state);
      return send(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "method not allowed" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500, { ok: false, error: String(e.message || e) });
  } finally {
    if (client) client.release();
  }
};
