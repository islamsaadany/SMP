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

/* ── A CONNECTION FOR THE DOOR (spec 030, §288.13) ─────────────────
   Signing in is not about a client. Identity lives in `platform.accounts`,
   which is shared, and the four things the door does — is anyone signed in,
   sign in, sign out, change the password — read and write nothing else.

   `connectFor()` was answering all four, purely to hand back a connection, and
   the cost of that was not theoretical: on a deployment carrying this code
   with its registry not yet filled in, the door refused every one of them with
   *"That client is not available."* — so the one screen somebody needs in
   order to fix anything was the screen that turned them away, pointing at the
   wrong thing entirely (§16.7's rule: a refusal names the place that can fix
   it, and this one named a place that could not).

   Paired with releaseClient() like connectFor's, so there is still exactly one
   thing that puts a connection back. */
async function connectPlatform(pg) {
  const client = await getPool(pg).connect();
  try {
    await ensurePlatformReady(client);
    await pointAt(client, PLATFORM_SCHEMA);
  } catch (e) {
    client.release();
    throw e;
  }
  client._smpClient = null;
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
    /* SHAPE FIRST ON AN EXISTING PLATFORM (§33.5, one schema out). This file
       is all CREATE TABLE IF NOT EXISTS, so it can never add a column to a
       table that already exists — and it now INDEXES one (`seat`). A
       migration marked `-- @phase: pre` runs before it; on a fresh database
       those find nothing to alter and say so. */
    await applyPlatformMigrations(client, "pre");
    await client.query(fs.readFileSync(path.join(dbDir(), "platform-schema.sql"), "utf8"));
    await applyPlatformMigrations(client, "post");
    await bootstrapOffice(client);
    await resetTheSuperUserPassword(client);
    await adoptExistingTenant(client);
    return { created: true };
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [PLATFORM_LOCK]);
  }
}

/* ── A WAY IN (§288.14, and §43.1's own rule one level out) ──────────
   A PLATFORM WITH NO ACCOUNTS IS A PLATFORM NOBODY CAN OPEN, and there is
   nothing inside it that could grant the first one — the consultants page is
   behind the sign-in it would create. The client's schema has answered this
   since v3.12 with `smo` / `1234` forced to change at once; this is the same
   answer one level out, and it carries the same trade in the same words: the
   convenience it buys is one screen, once, and it is never touched again the
   moment any account exists.

   THE ADDRESS IS THE ONE ISLAM ASKED FOR, and it is an environment variable so
   a deployment that is not Forefront's does not inherit it.

   IT NO LONGER FORCES A CHANGE (Islam, 2026-09-01: "keep my password
   islam.saadany@forefront.consulting and 1234 without changing passwords").
   Asked, refused once with the cost stated, and reaffirmed — so it is his
   decision and it is written down rather than argued again. THE COST, in one
   line: 1234 is four digits on a public URL, and this account is the platform
   admin, so anybody who guesses it holds every client Forefront runs. The
   forced change itself is untouched for everybody else — `must_change` still
   means what it meant, and a password issued to a consultant still has to be
   replaced before they can go anywhere.

   NEVER TOUCHED AGAIN ONCE ANY ACCOUNT EXISTS — asked of the whole table, not
   of this address, so an office that has since removed this account does not
   have it put back under them. */
const BOOTSTRAP_PASSWORD = "1234";
function bootstrapEmail() {
  return String(process.env.SMP_BOOTSTRAP_EMAIL || "islam.saadany@forefront.consulting")
    .trim().toLowerCase();
}

async function bootstrapOffice(client) {
  const any = await client.query("SELECT 1 FROM accounts LIMIT 1");
  if (any.rowCount) return { made: false };
  const auth = require("./auth.js");
  const email = bootstrapEmail();
  if (!email) return { made: false };
  await client.query(
    "INSERT INTO accounts (email, name, kind, is_admin, password_hash, must_change, status) " +
    "VALUES ($1, $2, 'office', true, $3, false, 'active') ON CONFLICT (email) DO NOTHING",
    [email, nameFromEmail(email), auth.hashPassword(BOOTSTRAP_PASSWORD)]);
  return { made: true, email: email };
}

/* WHO AN OFFICE ACCOUNT IS INSIDE A CLIENT — minted once from the address,
   never from the name, which changes. Written inline in `setTeam` and needed
   again the moment an admin opens a client nobody has been put on (§288.20),
   so it is one function: two spellings of a person key are two people. */
function officePersonKey(email) {
  return "ff_" + String(email || "").toLowerCase().split("@")[0]
    .replace(/[^a-z0-9]+/g, "_").slice(0, 24);
}

/* THE NAME IS READ OFF THE ADDRESS, NOT WRITTEN INTO THE CODE. The first
   version called this account "Forefront", which is the company rather than
   the person and reads on the consultants list as a row belonging to nobody.
   `islam.saadany@…` gives "Islam Saadany", and no person is named in a source
   file — the address is already the only thing this function is told.

   IT IS A GUESS AND IT IS MEANT TO BE ONE (§93.8's shape): the register lets
   anybody correct their own name, and an address that does not look like a
   name simply produces a shorter guess rather than a wrong fact. */
function nameFromEmail(email) {
  const local = String(email || "").split("@")[0];
  const words = local.split(/[._\-+]+/).filter(Boolean)
    .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
  return words.join(" ") || local;
}

/* ── THE TENANT THAT WAS ALREADY HERE (§288.21) ──────────────────────
   A deployment carrying this code and an unmigrated database has a real client
   in it — its plan, its people, its reported figures — and no row saying so,
   so the boundary refuses it and Forefront's cards are empty. Islam, looking
   at exactly that: "raya trade should be appearing there."

   IT MOVES NOTHING. This is one row in the registry saying the client lives in
   the schema it already lives in. `schema_name` has always been a column
   rather than a convention, so `public` is as legal a value as `raya_trade` —
   which is what makes this cheap and reversible: delete the row and the
   deployment is exactly as it was.

   AND IT IS WHAT DECOUPLES THE CODE FROM THE MIGRATION. Without it this branch
   cannot be deployed until `migrate-to-multi-client.js` has run, or the live
   client goes dark — two things that must land together, which is the most
   dangerous shape a release can have. With it, the branch is safe on its own
   and moving the tables becomes tidying that can happen any time, or never.

   THREE GUARDS, because adopting the wrong thing would be worse than adopting
   nothing:
     · only when the registry is EMPTY — a platform that already knows its
       clients is not missing one;
     · only when the original schema really holds a tenant, asked of the org
       row rather than of the tables, because `schema.sql` creates the shape
       for anything that touches it and an empty shape is not a client;
     · once, and recorded — an office that deliberately removes this client
       must not find it back on the next deploy (bootstrapOffice's own rule).

   WHAT IT DOES NOT DO: the client's own people have no accounts until either
   the migration makes them or somebody issues them a password from the
   People page. Forefront can open the client; its staff cannot sign in yet.
   Said here rather than half-done, because a partial migration wearing a
   whole one's clothes is worse than a stated limit. */
const ORIGINAL_SCHEMA = "public";
const ADOPT = "003-adopt-the-existing-tenant.js";

function slugFor(name) {
  return String(name || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

async function adoptExistingTenant(client) {
  const done = await client.query("SELECT 1 FROM _platform_migrations WHERE name = $1", [ADOPT]);
  if (done.rowCount) return { adopted: null };
  const any = await client.query("SELECT 1 FROM clients LIMIT 1");
  if (any.rowCount) {
    await client.query("INSERT INTO _platform_migrations (name) VALUES ($1)", [ADOPT]);
    return { adopted: null };
  }
  /* Asked of the ORG ROW, not of the tables (see above). */
  const there = await client.query(
    "SELECT to_regclass($1) IS NOT NULL AS has", [ORIGINAL_SCHEMA + ".org"]);
  if (!there.rows[0].has) return { adopted: null };   /* not recorded: it may arrive later */
  const org = await client.query(
    "SELECT org_name FROM " + ident(ORIGINAL_SCHEMA) + ".org ORDER BY id LIMIT 1");
  const name = org.rowCount ? String(org.rows[0].org_name || "").trim() : "";
  if (!name) return { adopted: null };
  const key = slugFor(name);
  if (!key) return { adopted: null };
  await client.query(
    "INSERT INTO clients (key, name, schema_name, kind, status) " +
    "VALUES ($1, $2, $3, 'client', 'active') ON CONFLICT (key) DO NOTHING",
    [key, name, ORIGINAL_SCHEMA]);
  await client.query("INSERT INTO _platform_migrations (name) VALUES ($1)", [ADOPT]);
  return { adopted: key, name: name, schema: ORIGINAL_SCHEMA };
}

/* ── An explicit reset, once (Islam, 2026-09-01) ─────────────────────
   "please reset my password to 1234".

   §43.8'S OWN ANSWER, ONE LEVEL OUT, and it is written in full rather than
   done quietly for §43.8's own reason: 1234 is four digits on a public URL,
   and the whole of §43 exists because that is not a password.

   ONCE, AND RECORDED. A reset that ran on every deployment would be a
   permanent backdoor — the exact thing §43.1 removed — because it would put
   the password back to 1234 every time a real one was chosen. This runs on the
   next deploy and never again; changing it inside the product from then on is
   what it is for, and this step will not fight it.

   IT RUNS AFTER bootstrapOffice(), deliberately: that step creates the account
   when there is none, and this one resets it when there is. Either way there
   is exactly one account to reset by the time this is asked, and neither can
   undo the other in the same request — §43.8's ordering, which was the whole
   of its correctness.

   `must_change` IS FALSE (§288.25, Islam: "keep my password ... and 1234
   without changing passwords"). It was true for one build — 1234 got somebody
   in and nowhere else — and he asked for the password itself, not for a way
   in to choose another. §43.8 cleared the flag for the same reason and this is
   the same answer, with the cost stated once and not argued again.

   THE NAME CHANGED WITH THE MEANING. A step is recorded by name and never runs
   twice, so leaving it as `002-` would have meant nothing happened on a
   deployment that had already applied the old one — the flag would still be
   set and he would still be asked. A new name is the only honest way to say
   "this is a different act".

   IT NAMES ONE ADDRESS. Every other account on the platform is untouched, so
   this cannot hand a known password to a consultant who already has a real
   one. Delete this function and its registry row to end it, or simply change
   the password from the door. */
const RESET_1234 = "004-keep-the-simple-password.js";

async function resetTheSuperUserPassword(client) {
  const done = await client.query("SELECT 1 FROM _platform_migrations WHERE name = $1", [RESET_1234]);
  if (done.rowCount) return { reset: false };
  const auth = require("./auth.js");
  const r = await client.query(
    "UPDATE accounts SET password_hash = $1, must_change = false, status = 'active', " +
    "updated_at = now() WHERE email = $2",
    [auth.hashPassword(BOOTSTRAP_PASSWORD), bootstrapEmail()]);
  await client.query("INSERT INTO _platform_migrations (name) VALUES ($1)", [RESET_1234]);
  return { reset: r.rowCount > 0 };
}

async function applyPlatformMigrations(client, phase) {
  const dir = path.join(dbDir(), "platform-migrations");
  if (!fs.existsSync(dir)) return;
  /* The registry may not exist yet in the pre-phase — on a fresh database
     nothing has been applied and there is nothing to skip. */
  await client.query(
    "CREATE TABLE IF NOT EXISTS _platform_migrations (name text PRIMARY KEY, " +
    "applied_at timestamptz NOT NULL DEFAULT now())");
  const files = fs.readdirSync(dir).filter(function (f) { return /\.sql$/.test(f); }).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    const want = /^\s*--\s*@phase:\s*pre\b/.test(sql.split("\n")[0]) ? "pre" : "post";
    if (want !== phase) continue;
    const done = await client.query("SELECT 1 FROM _platform_migrations WHERE name = $1", [f]);
    if (done.rowCount) continue;
    await client.query(sql);
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

/* ── The office's row inside a client (spec 030 §6) ───────────────
   A Forefront person on a client's team APPEARS on that client's register,
   marked as the office, from the first time they open it. That is not
   decoration: lib/rules.js, lib/authorize.js, the chat, the email audience and
   namedOn() all answer from the register, so a person who is not on it holds
   nothing — which is exactly what the platform said, in as many words, the
   first time an office account opened a client with no row (constitution IX
   from the other side: one vocabulary, not an office branch beside every
   read).

   IDEMPOTENT AND CHEAP: one SELECT on the way in, an INSERT only the first
   time. The seat comes from the client's configuration and is refreshed on
   every visit, so promoting somebody to that client's Super user takes effect
   the next time they open it rather than when somebody remembers to sync. */
async function ensureOfficeRow(client, seat, account, madeHere) {
  if (!seat || !seat.person_key || !account || account.kind === "client") return null;
  const key = seat.person_key;
  const role = seat.seat || "smoteam";
  const found = await client.query(
    "SELECT key, role, COALESCE(extra->>'ffrow','') AS mine FROM people WHERE key = $1", [key]);
  if (found.rowCount) {
    /* ── A ROW THAT WAS ALREADY THERE IS ADOPTED, NOT REWRITTEN (§288.29) ──
       Where the configuration points an account at somebody the client's
       register already holds — Mohamed Essam is Raya's `smo`, from before this
       platform existed — that row is the CLIENT'S. Its name, its address and
       its role are what the client says about them, and overwriting any of the
       three would be the platform editing a register it does not own: setting
       the seat would demote Raya's own SMO to `smoteam`, and setting the email
       would replace the address the client's own messages go to.

       So a row we did not create gets ONE thing, the mark that says where the
       account comes from, and nothing else. A row this function DID create is
       ours, and its role follows the seat exactly as before. */
    if (!found.rows[0].mine) {
      /* MARKED AS FOREFRONT'S PERSON, NOT AS FOREFRONT'S ROW — and those are
         two different facts, which is the whole of this fix. `forefront` is
         what the register DRAWS: this person works for the office, which is
         true of Mohamed Essam whether or not the platform wrote his row.
         `ffrow` is what the platform may REWRITE: rows it minted itself.

         Conflating them puts the hole straight back: mark an adopted row as
         ours and the next seat press demotes the client's own SMO on the
         client's own register. */
      await client.query(
        "UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{forefront}', 'true'::jsonb) " +
        "WHERE key = $1", [key]);
      return key;
    }
    if (found.rows[0].role !== role) {
      await client.query("UPDATE people SET role = $2 WHERE key = $1", [key, role]);
    }
    return key;
  }
  /* ── AND ON A CLIENT THAT ALREADY HAS A REGISTER, NOTHING IS CREATED
        (§288.30, Islam: "make the access from the platform match the raya
        registry without creating new people") ──────────────────────────
     Raya Trade's register was written before this platform existed and holds
     33 people. Adding Forefront's own on top of it makes rows nobody asked for
     — and for the one consultant who IS on it, a second row for one human,
     which is the fault §87 exists for.

     So where the register holds anybody, an office account is RESOLVED against
     it and never inserted: the client's configuration says which row each
     account is (§288.29), several accounts may say the same row, and somebody
     the configuration has not placed simply has no row here.

     THE ONE EXCEPTION IS A REGISTER WITH NOBODY IN IT, and it is not a
     loophole: a client created from the cards has no register at all, so there
     is nobody to match and somebody has to be able to open it in order to
     build one. That first row is the platform's own, marked `ffrow`, and every
     later one comes from the client's People page like any other person. */
  /* WHOSE REGISTER IS IT (§288.31). On a client the platform BUILT, its team
     is its register — adding somebody adds them, however many are already
     there. On a client that brought its own, nothing is created at any size.

     Asked of the CLIENT rather than of the register's size, which was right
     for the first consultant and wrong for the second: by then the register is
     no longer empty and they would have got no row at all. The size test
     survives only as the answer for a caller that does not know, which is the
     safe reading — a register nobody claimed is not written into. */
  if (!madeHere) {
    const anybody = await client.query("SELECT 1 FROM people LIMIT 1");
    if (anybody.rowCount) return null;
  }
  const idx = (await client.query("SELECT COALESCE(MAX(idx),0) + 1 AS n FROM people")).rows[0].n;
  /* `forefront` and `email` are not COLUMNS — state-io files every key it does
     not recognise into `extra` and reads it back (§52), which is how a
     register grows a field without a migration. */
  await client.query(
    "INSERT INTO people (key, idx, name, role, extra) VALUES ($1,$2,$3,$4,$5) " +
    "ON CONFLICT (key) DO NOTHING",
    [key, idx, account.name || account.email, role,
     /* `ffrow` says the platform minted this row and may keep it in step;
        `forefront` says whose person it is, and is what the register draws. */
     JSON.stringify({ forefront: true, ffrow: true, email: account.email })]);
  return key;
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
    "SELECT client_key, person_key, seat FROM account_clients WHERE email = $1",
    [String(email).toLowerCase()]);
  return r.rows;
}

/* THE TEAM IS FOREFRONT'S, AND `account_clients` HOLDS EVERYBODY. A client's
   own people are mapped through the same table — that is how their account
   knows which client it belongs to — so without `kind = 'office'` this listed
   the client's own staff under "Strategy office for this client", offering to
   make Raya's SMO the super user of Raya as though they were a consultant.
   Found by reading the team on screen, not by reading this query. */
async function teamOf(client, clientKey) {
  const r = await client.query(
    "SELECT ac.email, ac.person_key, ac.seat, a.name, a.is_admin, a.status " +
    "FROM account_clients ac JOIN accounts a ON a.email = ac.email " +
    "WHERE ac.client_key = $1 AND a.kind = 'office' " +
    "ORDER BY (ac.seat = 'super') DESC, a.name", [String(clientKey)]);
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
  defaultClient, clientSlugFrom, noSuchClient, connectFor, connectPlatform, releaseClient,
  getPool, withSchema, withPlatform, pointAt,
  ensurePlatformReady, forgetPlatformReady, createClientSchema,
  bootstrapOffice, bootstrapEmail, nameFromEmail, resetTheSuperUserPassword,
  adoptExistingTenant, slugFor, ORIGINAL_SCHEMA,
  officePersonKey,
  ensureOfficeRow,
  clientByKey, allClients, accountByEmail, clientsFor, teamOf, accessMap,
  worldFor, noteOpen
};
