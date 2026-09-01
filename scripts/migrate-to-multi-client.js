/* Move a single-tenant deployment into the multi-client shape.
   Run:  DATABASE_URL=…  node scripts/migrate-to-multi-client.js --dry-run
         DATABASE_URL=…  node scripts/migrate-to-multi-client.js

   WHAT IT DOES, IN ORDER
     1 · moves every table in `public` into a schema of its own — ALTER TABLE
         SET SCHEMA, so NO DATA IS COPIED and nothing can be half-copied
     2 · creates the platform schema, the registry, and the three office
         accounts, each with a temporary password printed ONCE
     3 · creates the empty clients
     4 · reads the result back and reports it — table counts per schema, a
         known figure out of the moved client, an empty new one

   IT IS IDEMPOTENT. Run twice and the second run finds the move done, the
   registry rows present, and says so; it never re-creates an account or
   re-issues a password. */

const pg = require("pg");
const crypto = require("crypto");
const io = require("../lib/state-io.js");
const P = require("../lib/platform-io.js");
const auth = require("../lib/auth.js");

const DRY = process.argv.indexOf("--dry-run") > -1;

/* WHAT THE DEPLOYMENT BECOMES. Islam's clients and their industries, approved
   2026-08-28. Demo is a client like any other and is created here too — its
   CONTENT arrives separately, from scripts/seed-demo-client.js, because an
   empty Demo is still a correct Demo and a migration that also seeds a worked
   example has two ways to fail. */
const LIVE = { key: "raya-trade", name: "Raya Trade", schema: "raya_trade",
               industry: "Distribution & retail" };
const NEW_CLIENTS = [
  { key: "rhi",    name: "RHI",     schema: "rhi",    industry: "Industrial" },
  { key: "el-abd", name: "El Abd",  schema: "el_abd", industry: "Food & beverage" },
  { key: "demo",   name: "Demo",    schema: "demo",   industry: "Worked example", kind: "demo" }
];
/* ONE PLATFORM ADMIN, AND A SEAT ON EACH CLIENT (spec 024 §7.0a, revision 3).
   The four platform roles are gone: `admin` is a flag on the account, and what
   somebody may do about a client is the seat they hold on it. */
const OFFICE = [
  { email: "islam.saadany@forefront.consulting", name: "Islam Saadany", admin: true, person: "ff_islam", seat: "super" },
  { email: "mohamed.essam@forefront.consulting", name: "Mohamed Essam", person: "ff_essam", seat: "smoteam" },
  { email: "omar.alaa@forefront.consulting",     name: "Omar Alaa",     person: "ff_omar",  seat: "smoteam" }
];

/* A password nobody chose, said once. Not a memorable one: it exists to be
   replaced on first use (§43.1), and a memorable temporary password is a
   permanent one somewhere. */
function tempPassword() {
  return crypto.randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
}

const say = (s) => console.log(s);

async function tablesIn(c, schema) {
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename", [schema]);
  return r.rows.map(function (x) { return x.tablename; });
}

async function main() {
  const pool = P.getPool(pg);
  const c = await pool.connect();
  try {
    /* ── 1 · what is there now ──────────────────────────────────── */
    const inPublic = await tablesIn(c, "public");
    const inLive = await tablesIn(c, LIVE.schema);
    say("public holds " + inPublic.length + " tables; " + LIVE.schema + " holds " + inLive.length + ".");

    if (inPublic.length && inLive.length) {
      say("REFUSED: both public and " + LIVE.schema + " hold tables. Somebody has moved");
      say("some of this already, and guessing which half is current is not this");
      say("script's decision to make.");
      process.exit(2);
    }

    if (DRY) {
      say("\n── DRY RUN · nothing will be changed ──");
      if (inPublic.length) {
        say("would move " + inPublic.length + " tables from public to " + LIVE.schema + ":");
        say("  " + inPublic.join(", "));
      } else {
        say("the move is already done.");
      }
      say("would create the platform schema and its registry");
      say("would register: " + [LIVE].concat(NEW_CLIENTS).map(function (x) { return x.key; }).join(", "));
      say("would create empty clients: " + NEW_CLIENTS.map(function (x) { return x.schema; }).join(", "));
      say("would create accounts: " + OFFICE.map(function (o) { return o.email; }).join(", "));
      say("\nRun again without --dry-run to do it.");
      return;
    }

    /* ── 2 · the move ───────────────────────────────────────────── */
    if (inPublic.length) {
      await c.query("CREATE SCHEMA IF NOT EXISTS " + P.ident(LIVE.schema));
      await c.query("BEGIN");
      try {
        for (const t of inPublic) {
          /* SET SCHEMA moves the table with its indexes and its owned
             sequences. No row is copied, so there is no half-copied state to
             recover from — either the transaction commits or nothing moved. */
          await c.query('ALTER TABLE public."' + t + '" SET SCHEMA ' + P.ident(LIVE.schema));
        }
        await c.query("COMMIT");
      } catch (e) { await c.query("ROLLBACK"); throw e; }
      say("moved " + inPublic.length + " tables into " + LIVE.schema + ".");
    } else {
      say("the move was already done — nothing to move.");
    }
  } finally {
    c.release();
  }

  /* ── 3 · the platform ─────────────────────────────────────────── */
  await P.withPlatform(pg, async function (pc) {
    await P.ensurePlatformReady(pc);

    for (const cl of [LIVE].concat(NEW_CLIENTS)) {
      await pc.query(
        /* THE SCHEMA IS UPDATED, NOT LEFT ALONE (§147.21). A deployment may
           already have ADOPTED this client — one row saying it lives in
           `public`, which is what lets the code ship before this script runs.
           `DO NOTHING` would then leave the row pointing at a schema this
           script has just emptied, and every request would resolve to it: the
           client would go dark at the exact moment its tables arrived safely.
           The name and industry are only filled where the row has none, so an
           office that has renamed a client keeps its own words. */
        /* `made_here` is FALSE for the live client — it brought its own
           register of 33 people and the platform adds nobody to it — and TRUE
           for the empty ones this script creates, whose registers are the
           platform's to build (§147.31). */
        "INSERT INTO clients (key, name, schema_name, industry, kind, made_here) VALUES ($1,$2,$3,$4,$5,$6) " +
        "ON CONFLICT (key) DO UPDATE SET schema_name = EXCLUDED.schema_name, " +
        "  name = CASE WHEN clients.name = '' THEN EXCLUDED.name ELSE clients.name END, " +
        "  industry = CASE WHEN clients.industry = '' THEN EXCLUDED.industry ELSE clients.industry END",
        [cl.key, cl.name, cl.schema, cl.industry, cl.kind || "client", cl.key !== LIVE.key]);
    }
    say("registry: " + (await pc.query("SELECT count(*)::int AS n FROM clients")).rows[0].n + " clients.");

    for (const o of OFFICE) {
      const has = await pc.query("SELECT 1 FROM accounts WHERE email = $1", [o.email]);
      if (has.rowCount) { say("account " + o.email + " already exists — left alone."); continue; }
      const pw = tempPassword();
      await pc.query(
        "INSERT INTO accounts (email, name, kind, is_admin, password_hash, must_change) " +
        "VALUES ($1,$2,'office',$3,$4,true)",
        [o.email, o.name, !!o.admin, auth.hashPassword(pw)]);
      /* SAID ONCE, HERE, AND STORED NOWHERE IN THE CLEAR. */
      say("account " + o.email + "  (" + (o.admin ? "platform admin" : "consultant") +
          ")  temporary password: " + pw);
    }

    /* Everyone at Forefront is on the live client's team to begin with, with
       Islam holding its super seat — his own answer, and the only shape that
       lets anybody open it on day one. */
    for (const o of OFFICE) {
      await pc.query(
        "INSERT INTO account_clients (email, client_key, person_key, seat) VALUES ($1,$2,$3,$4) " +
        "ON CONFLICT (email, client_key) DO NOTHING",
        [o.email, LIVE.key, o.person, o.seat]);
    }
    say("team on " + LIVE.key + ": " +
        (await pc.query("SELECT count(*)::int AS n FROM account_clients WHERE client_key=$1", [LIVE.key])).rows[0].n);
  });

  /* ── 4 · the empty clients ────────────────────────────────────── */
  for (const cl of NEW_CLIENTS) {
    await P.createClientSchema(pg, cl.schema, cl.name);
    say("created " + cl.schema + " — schema, migrations, and its own name.");
  }

  /* ── 4b · the client's own people become accounts ─────────────
     Their PASSWORD comes across as it is — the stored scrypt hash is copied,
     never re-hashed and never seen — so nobody has to be issued a new one.
     What does not survive is their SESSION, because sessions move schema:
     everyone signs in again once, which is spec §4.1's stated cost.

     TWO PEOPLE IN TWO CLIENTS SHARING AN ADDRESS cannot both become one
     account, and this refuses to guess which (§87): it names them and moves
     on, leaving the second one to be sorted out by a person. */
  const clash = [];
  for (const cl of [LIVE]) {
    const people = await P.withSchema(pg, cl.schema, async function (sc) {
      return (await sc.query(
        "SELECT p.key, p.name, lower(trim(COALESCE(p.extra->>'email',''))) AS email, " +
        "       c.password_hash, c.must_change " +
        "FROM people p LEFT JOIN credentials c ON c.person_key = p.key " +
        "WHERE COALESCE(p.extra->>'active','true') <> 'false'")).rows;
    });
    let moved = 0, noAddress = 0, noPassword = 0;
    await P.withPlatform(pg, async function (pc) {
      for (const person of people) {
        if (!person.email) { noAddress++; continue; }
        if (!person.password_hash) { noPassword++; continue; }
        const taken = await pc.query(
          "SELECT email FROM account_clients ac WHERE ac.email = $1 AND ac.client_key <> $2",
          [person.email, cl.key]);
        if (taken.rowCount) { clash.push(person.email); continue; }
        await pc.query(
          "INSERT INTO accounts (email, name, kind, password_hash, must_change) " +
          "VALUES ($1,$2,'client',$3,$4) ON CONFLICT (email) DO NOTHING",
          [person.email, person.name || "", person.password_hash, person.must_change !== false]);
        await pc.query(
          "INSERT INTO account_clients (email, client_key, person_key) VALUES ($1,$2,$3) " +
          "ON CONFLICT (email, client_key) DO NOTHING", [person.email, cl.key, person.key]);
        moved++;
      }
    });
    say(cl.key + ": " + moved + " people became accounts · " + noAddress +
        " have no address · " + noPassword + " never had a password");
  }
  if (clash.length) {
    say("NOT MOVED — the same address is already an account on another client:");
    clash.forEach(function (e) { say("  " + e); });
  }

  /* ── 5 · read the result back, and say what is there ──────────── */
  say("\n── verification ──");
  for (const cl of [LIVE].concat(NEW_CLIENTS)) {
    const n = await P.withSchema(pg, cl.schema, async function (sc) {
      const q = async (t) => Number((await sc.query("SELECT count(*)::int AS n FROM " + t)).rows[0].n);
      return { tables: (await tablesIn(sc, cl.schema)).length,
               units: await q("units"), people: await q("people"), pillars: await q("pillars") };
    });
    say(cl.key.padEnd(12) + " tables " + String(n.tables).padStart(3) +
        " · units " + String(n.units).padStart(3) +
        " · people " + String(n.people).padStart(3) +
        " · pillars " + String(n.pillars).padStart(3));
  }
  const sample = await P.withSchema(pg, LIVE.schema, async function (sc) {
    const r = await sc.query("SELECT org_name FROM org WHERE id = 1");
    return r.rowCount ? r.rows[0].org_name : "(no org row)";
  });
  say("the moved client still says its name is: " + sample);
  say("\nDone. Every account above must change its password on first use.");
  await pool.end();
}

main().catch(function (e) {
  console.error("\nSTOPPED: " + (e && (e.stack || e.message)));
  process.exit(1);
});
