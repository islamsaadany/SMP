/* THE PLATFORM'S OWN I/O — the registry, the office's accounts, and the one
   place a connection is pointed at a client.
   ═══════════════════════════════════════════════════════════════════════

   TWO RULES HOLD THE WHOLE BOUNDARY UP, and both are in this file:

   1 · A REQUEST NAMES A CLIENT BY SLUG; THE SCHEMA COMES FROM ITS ROW. Never
       from the request, or the address bar becomes a way to name a schema
       (§36.4). The slug is looked up; the row answers; nothing else is trusted.

   2 · search_path IS SET ON A CHECKED-OUT CONNECTION AND RESET WHEN IT GOES
       BACK. `pg` pools keep session state across checkouts, so a connection
       released while still pointed at one client would serve the next request
       — possibly another client's — from the wrong schema. That is this
       feature's worst possible bug, so it is belt and braces: every checkout
       SETS its own path, and every release RESETS it. */

const fs = require("fs");
const path = require("path");
const io = require("./state-io.js");

const PLATFORM_SCHEMA = "platform";
const PLATFORM_LOCK = 420043;          /* beside state-io's 420042, never equal */

/* A schema name is an identifier, and an identifier cannot be a bound
   parameter — so it is interpolated, and therefore validated first. The
   registry is the only writer, and this is the belt to that braces. */
const SAFE_IDENT = /^[a-z][a-z0-9_]{0,48}$/;
function ident(name) {
  if (!SAFE_IDENT.test(String(name || ""))) {
    const e = new Error("Not a schema name.");
    e.code = "BAD_SCHEMA";
    throw e;
  }
  return String(name);
}

/* The slug in the address, and the schema derived from it ONCE at creation.
   Stored on the row from then on; never recomputed, because a client whose
   name is corrected must not change schema. */
function schemaNameFor(key) {
  return ident(String(key || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""));
}
function slugFor(name) {
  return String(name || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

function dbDir() { return path.join(__dirname, "..", "db"); }

/* ── Connections ──────────────────────────────────────────────────── */

function getPool(pg) { return io.getPool(pg); }

async function pointAt(client, schema) {
  await client.query("SET search_path TO " + ident(schema));
}

/* THE ONE DOOR TO A SCHEMA. Everything that touches a client's tables goes
   through here, so there is exactly one place that can forget to reset. */
async function withSchema(pg, schema, fn) {
  const client = await getPool(pg).connect();
  try {
    await pointAt(client, schema);
    return await fn(client);
  } finally {
    /* RESET even when the body threw: a connection carrying a failed request's
       schema is the same bug as one carrying a successful request's. */
    try { await client.query("RESET search_path"); } catch (e) { /* the connection is going away anyway */ }
    client.release();
  }
}

function withPlatform(pg, fn) { return withSchema(pg, PLATFORM_SCHEMA, fn); }

/* ── Which client is this request for? ────────────────────────────
   ONE DEFINITION, asked by every endpoint (constitution IX). The browser
   sends a slug — from the path it was served at — and never a schema name.

   A REQUEST WITH NO SLUG FALLS BACK TO THE DEFAULT CLIENT, deliberately: a
   service worker serves the previous platform file from the client's own disk
   (§91), so on the day this deploys there are browsers posting saves that
   predate the field. Refusing those would take the live tenant down to prove a
   point. The fallback is one named client, not "whichever one you like". */
function defaultClient() { return process.env.SMP_DEFAULT_CLIENT || "raya-trade"; }

function clientSlugFrom(req, body) {
  const fromBody = body && typeof body.client === "string" ? body.client : "";
  let fromQuery = "";
  try {
    const u = new URL(req.url, "http://x");
    fromQuery = u.searchParams.get("client") || "";
  } catch (e) { /* a URL we cannot parse names no client */ }
  return String(fromBody || fromQuery || defaultClient()).trim().toLowerCase();
}

/* THE ONE REFUSAL. A client that does not exist and a client this account may
   not open must be told apart by nobody — otherwise the door hands over
   Forefront's client book to whoever tries slugs (contracts/platform-api.md). */
function noSuchClient() {
  const e = new Error("That client is not available.");
  e.code = "NO_CLIENT";
  return e;
}

/* A connection already pointed at the client's schema, or a refusal. Paired
   with releaseClient(), which is the only thing that puts it back. */
async function connectFor(pg, slug) {
  const row = await withPlatform(pg, async function (pc) {
    await ensurePlatformReady(pc);
    return clientByKey(pc, slug);
  });
  if (!row || !row.schema_name || row.status === "retired") throw noSuchClient();
  const client = await getPool(pg).connect();
  try {
    await pointAt(client, row.schema_name);
  } catch (e) {
    client.release();
    throw e;
  }
  client._smpClient = row;             /* what this connection is pointed at */
  return client;
}

async function releaseClient(client) {
  if (!client) return;
  try { await client.query("RESET search_path"); } catch (e) { /* going away anyway */ }
  client.release();
}

/* ── Readiness ────────────────────────────────────────────────────── */

let PLATFORM_READY = null;
function forgetPlatformReady() { PLATFORM_READY = null; }

/* Memoised per process for §98's reason — a poll must not re-run the schema —
   and never remembering a failure, for ensureReady's. */
function ensurePlatformReady(client) {
  if (PLATFORM_READY) return PLATFORM_READY.then(function () { return { created: false }; });
  PLATFORM_READY = ensurePlatformReadyOnce(client).catch(function (e) {
    PLATFORM_READY = null;
    throw e;
  });
  return PLATFORM_READY;
}

async function ensurePlatformReadyOnce(client) {
  await client.query("CREATE SCHEMA IF NOT EXISTS " + PLATFORM_SCHEMA);
  await client.query("SET search_path TO " + PLATFORM_SCHEMA);
  await client.query("SELECT pg_advisory_lock($1)", [PLATFORM_LOCK]);
  try {
    await client.query(fs.readFileSync(path.join(dbDir(), "platform-schema.sql"), "utf8"));
    await applyPlatformMigrations(client);
    return { created: true };
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [PLATFORM_LOCK]);
  }
}

async function applyPlatformMigrations(client) {
  const dir = path.join(dbDir(), "platform-migrations");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(function (f) { return /\.sql$/.test(f); }).sort();
  for (const f of files) {
    const done = await client.query("SELECT 1 FROM _platform_migrations WHERE name = $1", [f]);
    if (done.rowCount) continue;
    await client.query(fs.readFileSync(path.join(dir, f), "utf8"));
    await client.query("INSERT INTO _platform_migrations (name) VALUES ($1)", [f]);
  }
}

/* A client's schema, created and brought up to date with the SAME schema.sql
   and the SAME migrations every other client runs. There is no second
   definition of what a client's database looks like. */
async function createClientSchema(pg, schemaName, orgName) {
  const name = ident(schemaName);
  await withPlatform(pg, function (c) { return c.query("CREATE SCHEMA IF NOT EXISTS " + name); });
  return withSchema(pg, name, function (c) {
    /* seed:false — the client's own name, and NOTHING else (spec §7.2). */
    return io.ensureReady(c, name, { seed: false, orgName: orgName || "" });
  });
}

/* ── Reading the registry ─────────────────────────────────────────── */

/* A READER NEVER CREATES WHAT IT LOOKED FOR (constitution XII). */
const NO_CLIENT = Object.freeze({});
const NO_ACCOUNT = Object.freeze({});
const NO_LIST = Object.freeze([]);

async function clientByKey(client, key) {
  if (!key) return NO_CLIENT;
  const r = await client.query("SELECT * FROM clients WHERE key = $1", [String(key)]);
  return r.rowCount ? r.rows[0] : NO_CLIENT;
}

async function allClients(client) {
  const r = await client.query("SELECT * FROM clients ORDER BY kind, name");
  return r.rows;
}

async function accountByEmail(client, email) {
  if (!email) return NO_ACCOUNT;
  const r = await client.query("SELECT * FROM accounts WHERE email = $1", [String(email).toLowerCase()]);
  return r.rowCount ? r.rows[0] : NO_ACCOUNT;
}

async function clientsFor(client, email) {
  if (!email) return NO_LIST;
  const r = await client.query(
    "SELECT client_key, person_key, is_super FROM account_clients WHERE email = $1",
    [String(email).toLowerCase()]);
  return r.rows;
}

async function teamOf(client, clientKey) {
  const r = await client.query(
    "SELECT ac.email, ac.person_key, ac.is_super, a.name, a.role, a.status " +
    "FROM account_clients ac JOIN accounts a ON a.email = ac.email " +
    "WHERE ac.client_key = $1 ORDER BY ac.is_super DESC, a.name", [String(clientKey)]);
  return r.rows;
}

/* The stored half of §37's table one level up. Only what has been CHANGED is
   here; lib/platform-rules.js merges it over the shipped defaults (§30.2). */
async function accessMap(client) {
  const r = await client.query("SELECT role_key, area_key, grant_ FROM platform_access");
  const out = {};
  r.rows.forEach(function (row) {
    (out[row.role_key] = out[row.role_key] || {})[row.area_key] = row.grant_;
  });
  return out;
}

/* THE WORLD THE RULES ANSWER FROM — built in ONE place, because the browser
   and the server asking the same question of two differently-built worlds is
   §102.4's fault, which cost a whole afternoon once already. */
async function worldFor(client, email) {
  return {
    mine: await clientsFor(client, email),
    access: await accessMap(client)
  };
}

async function noteOpen(client, email, clientKey, what) {
  try {
    await client.query(
      "INSERT INTO client_log (email, client_key, what) VALUES ($1,$2,$3)",
      [String(email).toLowerCase(), String(clientKey), what || "open"]);
  } catch (e) {
    /* A log that cannot be written must not lose the thing it was recording. */
    console.error("client_log write failed:", e.message);
  }
}

module.exports = {
  PLATFORM_SCHEMA, ident, schemaNameFor, slugFor,
  defaultClient, clientSlugFrom, noSuchClient, connectFor, releaseClient,
  getPool, withSchema, withPlatform, pointAt,
  ensurePlatformReady, forgetPlatformReady, createClientSchema,
  clientByKey, allClients, accountByEmail, clientsFor, teamOf, accessMap,
  worldFor, noteOpen
};
