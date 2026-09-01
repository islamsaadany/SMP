/* The boundary, against a real database.
   Run: DATABASE_URL=postgres://…  node scripts/test-platform.js

   Every assertion here is about something that fails SILENTLY if it is wrong:
   a second client that is never migrated, a pooled connection still pointed at
   the last request's client, a new client seeded with somebody else's units.
   None of them throws; all of them render. */

const pg = require("pg");
const path = require("path");
const { spawn } = require("child_process");
const io = require("../lib/state-io.js");
const P = require("../lib/platform-io.js");
const auth = require("../lib/auth.js");

const PORT = 3991;
const BASE = "http://127.0.0.1:" + PORT;

function waitFor(url, tries) {
  return new Promise(function (resolve, reject) {
    (function go(n) {
      fetch(url).then(function () { resolve(); })
        .catch(function () {
          if (n <= 0) return reject(new Error("dev-server never came up"));
          setTimeout(function () { go(n - 1); }, 300);
        });
    })(tries);
  });
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name + (extra ? "\n        " + extra : ""));
}
const eq = (name, got, want) =>
  check(name + "  (got " + JSON.stringify(got) + ", wanted " + JSON.stringify(want) + ")", got === want);

async function main() {
  const pool = P.getPool(pg);

  /* ── 1 · the platform schema ──────────────────────────────────── */
  await P.withPlatform(pg, async function (c) {
    const r = await P.ensurePlatformReady(c);
    check("the platform schema is created", r.created === true);
    const t = await c.query("SELECT to_regclass('platform.clients') AS t");
    check("…with its registry", !!t.rows[0].t);
  });
  await P.withPlatform(pg, async function (c) {
    const again = await P.ensurePlatformReady(c);
    check("…and asking twice does the work once (§98's memo)", again.created === false);
  });

  /* ── 2 · two clients, and the trap ────────────────────────────── */
  /* THE ASSERTION THIS FILE EXISTS FOR. With ensureReady memoised per PROCESS
     rather than per schema, the second client opened in a warm instance
     answers from the first one's "already ready" and gets no tables at all. */
  await P.createClientSchema(pg, "t_alpha", "Alpha Group");
  await P.createClientSchema(pg, "t_beta", "Beta Holdings");

  /* Caught rather than allowed to throw, so a broken memo REPORTS the trap by
     name instead of ending the run with a stack: a test that dies says only
     that something went wrong, and this one knows exactly what. */
  const safely = async (what, fn, fallback) => {
    try { return await fn(); } catch (e) { console.log("  (" + what + " threw: " + e.message + ")"); return fallback; }
  };
  for (const s of ["t_alpha", "t_beta"]) {
    const there = await safely(s, () => P.withSchema(pg, s, async function (c) {
      return (await c.query("SELECT to_regclass($1) AS t", [s + ".org"])).rows[0].t;
    }), null);
    check("client " + s + " has its own tables — the per-schema readiness memo", !!there);
  }

  const names = {};
  for (const s of ["t_alpha", "t_beta"]) {
    names[s] = await safely(s, () => P.withSchema(pg, s, async function (c) {
      return (await c.query("SELECT org_name FROM org WHERE id = 1")).rows[0].org_name;
    }), null);
  }
  eq("alpha holds its own name", names.t_alpha, "Alpha Group");
  eq("beta holds its own name", names.t_beta, "Beta Holdings");

  /* ── 3 · a new client is EMPTY, not somebody else's example ───── */
  const counts = await safely("t_beta counts", () => P.withSchema(pg, "t_beta", async function (c) {
    const q = async (t) => Number((await c.query("SELECT count(*)::int AS n FROM " + t)).rows[0].n);
    return { units: await q("units"), people: await q("people"), pillars: await q("pillars"),
             creds: await q("credentials"), companies: await q("companies") };
  }), { units:-1, people:-1, pillars:-1, creds:-1, companies:-1 });
  eq("a new client has no business units", counts.units, 0);
  eq("…no people", counts.people, 0);
  eq("…no plan", counts.pillars, 0);
  eq("…no companies", counts.companies, 0);
  /* No bootstrap seat: a client is opened from a card by an account that
     already exists, so a known password on its door buys nothing (spec §4). */
  eq("…and no bootstrap password", counts.creds, 0);

  /* ── 3b · a new client is the same SHAPE as a long-lived one ────
     A client created today runs the same schema.sql and the same migrations a
     tenant from v2.0 ran — so their shapes must match exactly. §113.7 is what
     this guards: a migration reading a column schema.sql no longer creates is
     perfect on every existing database and broken on every fresh one, and
     only a comparison catches it. */
  const shapeOf = (schema) => P.withSchema(pg, schema, async function (c) {
    const r = await c.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns " +
      "WHERE table_schema = $1 ORDER BY table_name, column_name", [schema]);
    return r.rows.map(function (x) { return x.table_name + "." + x.column_name + ":" + x.data_type; });
  });
  /* t_migrated runs the real path — seed then migrations, as a deployment
     that has existed since v2.0 did. */
  await P.withPlatform(pg, function (c) { return c.query("CREATE SCHEMA IF NOT EXISTS t_migrated"); });
  await P.withSchema(pg, "t_migrated", function (c) { return io.ensureReady(c, "t_migrated"); });
  const baselined = await shapeOf("t_beta");
  const migrated = await shapeOf("t_migrated");
  const only = (a, b) => a.filter(function (x) { return b.indexOf(x) < 0; });
  check("a baselined client has the same columns as a migrated one",
    only(migrated, baselined).length === 0 && only(baselined, migrated).length === 0,
    "missing from a new client: " + (only(migrated, baselined).join(", ") || "none") +
    "\n        only in a new client: " + (only(baselined, migrated).join(", ") || "none"));

  /* ── 4 · one client cannot see another ────────────────────────── */
  await P.withSchema(pg, "t_alpha", async function (c) {
    await c.query("INSERT INTO units (key, idx, name) VALUES ('mobile', 1, 'Mobile')");
  });
  const seenFromBeta = await P.withSchema(pg, "t_beta", async function (c) {
    return (await c.query("SELECT count(*)::int AS n FROM units")).rows[0].n;
  });
  eq("a row written in one client is invisible in the other", Number(seenFromBeta), 0);

  /* ── 5 · the connection does not carry the last client home ───── */
  /* A pg pool keeps session state across checkouts. A connection released
     while still pointed at a client would serve the NEXT request — possibly
     another client's — from the wrong schema, and it would look like data
     loss rather than like a bug. */
  await P.withSchema(pg, "t_alpha", async function (c) {
    const p = (await c.query("SHOW search_path")).rows[0].search_path;
    check("inside withSchema the path is the client's", /t_alpha/.test(p), p);
  });
  const raw = await pool.connect();
  try {
    const p = (await raw.query("SHOW search_path")).rows[0].search_path;
    check("a released connection is no longer pointed at that client", !/t_alpha/.test(p), p);
  } finally { raw.release(); }

  /* ── 6 · a schema name is never taken from a request ──────────── */
  let refused = false;
  try { P.ident('public"; DROP SCHEMA platform CASCADE; --'); } catch (e) { refused = e.code === "BAD_SCHEMA"; }
  check("a schema name that is not an identifier is refused", refused);
  eq("a slug becomes its schema name", P.schemaNameFor("raya-trade"), "raya_trade");
  eq("…and a client's name becomes its slug", P.slugFor("El Abd"), "el-abd");

  /* ── 7 · the registry answers, and never invents ──────────────── */
  await P.withPlatform(pg, async function (c) {
    await c.query(
      "INSERT INTO clients (key, name, schema_name, industry) VALUES ($1,$2,$3,$4) " +
      "ON CONFLICT (key) DO NOTHING", ["t-alpha", "Alpha Group", "t_alpha", "Industrial"]);
    const got = await P.clientByKey(c, "t-alpha");
    eq("a client is read by its slug", got.schema_name, "t_alpha");
    const missing = await P.clientByKey(c, "nobody");
    eq("an unknown client is an empty answer, not a built one", Object.keys(missing).length, 0);
    check("…and it is frozen (constitution XII)", Object.isFrozen(missing));
  });

  /* ── 8 · over HTTP, which is the only place the refusal is real ──
     Everything above proves the plumbing; this proves what a browser gets.
     The endpoints resolve the client themselves, and a refusal that is only
     ever asserted in-process is a refusal nobody has seen. */
  await P.createClientSchema(pg, "t_http", "HTTP Client");
  await P.withPlatform(pg, async function (pc) {
    await pc.query("INSERT INTO clients (key, name, schema_name) VALUES ('t-http','HTTP Client','t_http') " +
                   "ON CONFLICT (key) DO NOTHING");
  });
  /* Somebody to sign in as. SINCE US2 THE ACCOUNT IS THE PLATFORM'S, keyed by
     email, and the row inside the client says who that account is there — the
     two halves this file exists to keep apart. (Written first against the
     client's own `credentials` table, which is what the door used to read: the
     check went red the day the door moved, which is the right way round.) */
  await P.withSchema(pg, "t_http", async function (c) {
    await c.query("INSERT INTO people (key, idx, name) VALUES ('smo', 1, 'Test SMO') " +
                  "ON CONFLICT (key) DO NOTHING");
    await c.query("UPDATE org SET org_name = 'HTTP Client' WHERE id = 1");
  });
  await P.withPlatform(pg, async function (c) {
    await c.query(
      "INSERT INTO accounts (email, name, kind, password_hash, must_change) " +
      "VALUES ('desk@t-http.example','Test SMO','client',$1,false) " +
      "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_change = false",
      [auth.hashPassword("testpw123")]);
    await c.query(
      "INSERT INTO account_clients (email, client_key, person_key) " +
      "VALUES ('desk@t-http.example','t-http','smo') ON CONFLICT (email, client_key) DO NOTHING");
  });

  const dev = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), String(PORT)], {
    env: Object.assign({}, process.env, { SMP_DEFAULT_CLIENT: "t-http" }), stdio: "ignore" });
  try {
    await waitFor(BASE + "/api/state", 25);
    const post = (body) => fetch(BASE + "/api/auth", { method:"POST",
      headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });

    const login = await post({ action:"login", user:"desk@t-http.example", password:"testpw123", client:"t-http" });
    const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
    check("a person signs in by email, against the platform's accounts", (await login.json()).ok === true);

    const get = (q) => fetch(BASE + "/api/state" + q, { headers: cookie ? { cookie: cookie } : {} });

    const mine = await (await get("?client=t-http")).json();
    eq("…and reads that client's own state", mine.state && mine.state.group.org, "HTTP Client");

    /* THE TWO REFUSALS MUST BE INDISTINGUISHABLE. Told apart, trying slugs
       tells an outsider which clients Forefront has. */
    const unknown = await get("?client=nobody-here");
    const asSchema = await get("?client=t_http");     /* a schema name, not a slug */
    const uBody = await unknown.json(), sBody = await asSchema.json();
    eq("an unknown client is refused", unknown.status, 404);
    eq("a SCHEMA name is refused too — the address bar cannot name a schema", asSchema.status, 404);
    eq("…and the two refusals are word for word the same", uBody.error, sBody.error);
    /* AND BOTH ARE THE PLATFORM'S ONE REFUSAL. Asserting only that they match
       each other passes when an endpoint invents its own message and both
       paths happen to use it — §113.8's blind spot, found by breaking this
       very assertion and watching it stay green. Asked against the shared
       constant, so a hand-written refusal anywhere fails here. */
    eq("…and both are the platform's single refusal", uBody.error, P.noSuchClient().message);
    /* TWO FILES DECLARE THAT SENTENCE — platform-io for a slug that is not in
       the registry, auth for a session that may not open the client — and a
       refusal that differs by a word tells the two cases apart. */
    eq("…and the door's copy of it says exactly the same thing",
       auth.notThisClient().message, P.noSuchClient().message);
    check("…which mentions neither a schema nor what was tried",
      !/schema/i.test(uBody.error || "") && !/nobody-here|t_http/.test(uBody.error || ""), uBody.error);

    /* A browser holding the PREVIOUS platform file (§91: a service worker
       serves the shell from its own disk) posts no client at all. It must
       land on the named default rather than be refused, or deploy day takes
       the live client down. */
    const noSlug = await (await get("")).json();
    eq("a request naming no client lands on the default", noSlug.state && noSlug.state.group.org, "HTTP Client");

    /* THE FIXTURE NEEDS SOMETHING TO SAVE. `/api/state` refuses a graph with
       no units — the shape guard that stops a malformed save wiping a tenant —
       and this client was created empty, so it is given one unit and its
       register row is given the office seat. */
    await P.withSchema(pg, "t_http", async function (sc) {
      /* THE SEED, not a hand-made row. A unit inserted by hand round-tripped
         into a graph `writeState` could not write back, and the endpoint
         answered its generic 500 — my fixture failing, dressed as the product
         failing. A known-good graph is the only honest thing to save. */
      const seed = JSON.parse(require("fs").readFileSync(
        path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));
      seed.group.org = "HTTP Client";
      await io.writeState(sc, seed);
      await sc.query("UPDATE people SET role = 'super' WHERE key = 'smo'");
    });

    /* ── NOBODY IS CREATED ON A CLIENT THAT HAS A REGISTER (§147.30) ──
       Islam: "make the access from the platform match the raya registry
       without creating new people." Asserted HERE rather than through the
       screen, and that is the finding: with the mapping REQUIRED, the create
       path cannot be reached from the product at all — so a browser check
       removing the guard stays green and proves nothing (§94.5, in my own
       check). The rule is asked of the function that carries it. */
    await P.withSchema(pg, "t_http", async function (sc) {
      const was = (await sc.query("SELECT count(*)::int AS n FROM people")).rows[0].n;
      const got = await P.ensureOfficeRow(sc,
        { person_key: "ff_nobody_here", seat: "smoteam" },
        { name: "Nobody", email: "nobody@ff.example", kind: "office" });
      const now = (await sc.query("SELECT count(*)::int AS n FROM people")).rows[0].n;
      check("a client with a register gains nobody", now === was, { was: was, now: now });
      check("…and the platform says it placed nobody", got === null, got);
      /* AND AN EMPTY REGISTER IS THE ONE CASE THAT DOES GET A ROW — a client
         created from the cards has nobody to match, and somebody has to be
         able to open it in order to build one. */
      await sc.query("CREATE TEMP TABLE kept AS SELECT * FROM people");
      await sc.query("DELETE FROM people");
      const first = await P.ensureOfficeRow(sc,
        { person_key: "ff_first", seat: "super" },
        { name: "First In", email: "first@ff.example", kind: "office" });
      const after = (await sc.query(
        "SELECT count(*)::int AS n, MAX(extra->>'ffrow') AS mine FROM people")).rows[0];
      check("…while an empty register gets its first row", first === "ff_first" && after.n === 1, after);
      check("…marked as the platform's own", after.mine === "true", after);
      await sc.query("DELETE FROM people");
      await sc.query("INSERT INTO people SELECT * FROM kept");
    });

    /* ── THE LOG SAYS WHO SIGNED IN, NOT ONLY WHICH ROW (§147.30) ──
       Several of Forefront's people may act as ONE row on a client whose
       register predates the platform, so the row alone no longer says who did
       something. Islam saw that the address was already known and simply not
       written down — this asserts it lands.

       IT IS ASKED OF A SAVE, not of the column: the first build passed
       `person.email`, which is the REGISTER row's address and empty for a row
       the client wrote, so the column existed and stayed blank. */
    const fresh = await (await get("?client=t-http")).json();
    const state = fresh.state;
    state.group.aspiration = "Changed while the log was being watched";
    const saved = await fetch(BASE + "/api/state", { method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookie },
      body: JSON.stringify({ client: "t-http", state: state }) });
    const sj = await saved.json();
    check("a save lands", sj.ok === true, JSON.stringify(sj).slice(0, 160));
    await P.withSchema(pg, "t_http", async function (sc) {
      const r = await sc.query(
        "SELECT person_key, email FROM change_log ORDER BY at DESC LIMIT 1");
      check("…and the change log records the address that signed in",
        r.rowCount > 0 && r.rows[0].email === "desk@t-http.example",
        r.rows[0] || "no log row");
      /* AND THE ROW IS STILL THE REGISTER'S. The two answer different
         questions and neither replaces the other. */
      check("…beside the register row it was done as",
        r.rowCount > 0 && !!r.rows[0].person_key, r.rows[0]);
    });
  } finally {
    dev.kill();
  }

  /* ── 9 · the office's own model, on the server (US3, revision 3) ─
     Two levels: one platform admin, and a SEAT on each client. The screen is
     checked by checks/multi-client.py; this is the half that has to hold when
     nothing is drawing anything (constitution X). */
  const FF = require("../lib/platform-rules.js");
  await P.withPlatform(pg, async function (c) {
    await c.query(
      "INSERT INTO accounts (email, name, kind, is_admin, password_hash) VALUES " +
      "('a@ff.example','A','office',true,'x'), ('o@ff.example','O','office',false,'x') " +
      "ON CONFLICT (email) DO UPDATE SET is_admin = EXCLUDED.is_admin");
    await c.query("INSERT INTO clients (key, name, schema_name) VALUES ('t-team','T','t_team') " +
                  "ON CONFLICT (key) DO NOTHING");
    await c.query(
      "INSERT INTO accounts (email, name, kind, password_hash) VALUES ('desk@client.example','Desk','client','x') " +
      "ON CONFLICT (email) DO NOTHING");
    await c.query(
      "INSERT INTO account_clients (email, client_key, person_key, seat) VALUES " +
      "('o@ff.example','t-team','ff_o','smoteam'), ('desk@client.example','t-team','desk','smoteam') " +
      "ON CONFLICT (email, client_key) DO UPDATE SET seat = EXCLUDED.seat");

    const world = await P.worldFor(c, "o@ff.example");
    const admin = { email:"a@ff.example", is_admin:true, kind:"office", status:"active" };
    const cons = { email:"o@ff.example", is_admin:false, kind:"office", status:"active" };
    const CLIENT = { key:"t-team", kind:"client", status:"active" };
    const OTHER = { key:"t-alpha", kind:"client", status:"active" };

    eq("the seat is what the configuration gave", FF.seatOn(world, "t-team"), "smoteam");
    check("a seat opens its client", FF.mayOpenClient(world, cons, CLIENT));
    check("and a client they hold no seat on is listed, not opened",
      FF.mayListClient(world, cons, OTHER) && !FF.mayOpenClient(world, cons, OTHER));
    check("a consultant does not add clients or set the table",
      !FF.mayCreateClient(world, cons) && !FF.mayEditAccess(world, cons));
    check("the platform admin does both", FF.mayCreateClient(world, admin) && FF.mayEditAccess(world, admin));
    check("an admin does not issue a password to another admin",
      !FF.mayIssuePasswordTo(world, admin, { email:"b@ff.example", is_admin:true }) &&
      FF.mayIssuePasswordTo(world, admin, { email:"o@ff.example", is_admin:false }));
    check("nobody changes their own admin rights", !FF.maySetAdmin(world, admin, admin));

    /* A CLIENT MAY HAVE MORE THAN ONE SUPER USER (§147.26, Islam: "a project
       might have 2 super users"). This asserted the OPPOSITE — a unique index
       refusing a second — and the reasoning behind it was tidy about a table
       and wrong about the work. Asked of the database, because that is where
       the refusal used to live. */
    await c.query("UPDATE account_clients SET seat = 'super' WHERE client_key = 't-team' AND email = 'o@ff.example'");
    let refused = false;
    try {
      await c.query(
        "INSERT INTO account_clients (email, client_key, person_key, seat) " +
        "VALUES ('a@ff.example','t-team','ff_a','super') " +
        "ON CONFLICT (email, client_key) DO UPDATE SET seat = 'super'");
    } catch (e) { refused = true; }
    check("a client may hold two super users", !refused);
    const supers = (await c.query(
      "SELECT count(*)::int AS n FROM account_clients WHERE client_key = 't-team' AND seat = 'super'"))
      .rows[0].n;
    check("…and both are kept, neither demoted", supers === 2, supers);
    /* WHAT THE OLD CONSTRAINT WAS REALLY PROTECTING is that SOMEBODY holds it,
       and that is unaffected: `isSuperOf` answers of a person, so two people
       both answering true is the point rather than a contradiction. */
    const w2 = await P.worldFor(c, "o@ff.example");
    check("…and each of them reads as this client's super user",
      FF.mayConfigureClient(w2, cons, CLIENT));

    /* THE TEAM IS FOREFRONT'S. account_clients maps a client's own people too
       — that is how their account knows which client it is — so a team read
       without `kind = 'office'` offers a client's own staff as consultants. */
    const team = await P.teamOf(c, "t-team");
    /* ASSERTED AS THE RULE, NOT AS A COUNT. It read `team.length === 1`, which
       is a fact about the fixture rather than about the filter — and the
       moment §147.26 let a second super user sit on this client, a correct
       reading of `kind = 'office'` failed. The question is whether a CLIENT'S
       OWN person can appear here, and that is what is asked. */
    check("a client's team holds Forefront's people", team.length > 0, team.length);
    check("…and nobody who belongs to the client",
      team.every(function (m) { return /@ff\.example$/.test(m.email); }),
      team.map(function (m) { return m.email; }));
    check("…and none of them is the client's own desk",
      !team.some(function (m) { return m.email === "desk@client.example"; }),
      team.map(function (m) { return m.email; }));
    const held = team.filter(function (m) { return m.email === "o@ff.example"; })[0];
    eq("…carrying the seat, not a boolean", held && held.seat, "super");
  });

  /* ── 10 · a way in (§147.14) ──────────────────────────────────
     A PLATFORM WITH NO ACCOUNTS IS A PLATFORM NOBODY CAN OPEN, and there is
     nothing inside it that could grant the first one — the consultants page
     is behind the sign-in it would create. This is §43.1's own answer one
     level out, and it carries the same trade: one screen, once. */
  await P.withPlatform(pg, async function (c) {
    const first = (await c.query("SELECT email, is_admin, must_change, kind FROM accounts " +
      "WHERE email = $1", [P.bootstrapEmail()])).rows[0];
    check("the platform bootstraps a first office account", !!first, P.bootstrapEmail());
    if (first) {
      check("…as the platform admin", first.is_admin === true && first.kind === "office", first);
      /* THE FIRST THING IT CAN DO IS STOP BEING THIS. A known password that
         did not force a change is a back door, which is §43.1's whole
         reversal of §19.4. */
      /* NOT FORCED, at Islam's explicit direction (§147.25) — and the
         machinery is untouched: a password ISSUED to a consultant still has
         to be replaced before they can go anywhere, which section 9 above
         exercises. */
      check("…and is usable as it stands", first.must_change === false, first);
      const auth2 = require("../lib/auth.js");
      check("…and the known password is the one said in the open",
            auth2.verifyPassword("1234", (await c.query(
              "SELECT password_hash FROM accounts WHERE email = $1",
              [P.bootstrapEmail()])).rows[0].password_hash));
    }
    /* AND IT IS NEVER PUT BACK. Asked of the whole table rather than of this
       address, so an office that has since removed it does not find it
       returned under them — the same rule the client's bootstrap follows. */
    await c.query("UPDATE accounts SET must_change = false WHERE email = $1", [P.bootstrapEmail()]);
    await P.bootstrapOffice(c);
    const again = (await c.query("SELECT must_change FROM accounts WHERE email = $1",
      [P.bootstrapEmail()])).rows[0];
    check("…and never re-made once any account exists", again && again.must_change === false, again);
  });

  /* ── 11 · an explicit reset, once (§147.17) ───────────────────
     Islam asked for 1234 back. The whole risk in granting that is a step that
     runs on EVERY deploy, which would put the password back to 1234 every time
     a real one was chosen — a permanent backdoor wearing a one-off's clothes,
     and the exact thing §43.1 removed. So the assertion that matters is the
     SECOND one: it does not come back. */
  await P.withPlatform(pg, async function (c) {
    const auth3 = require("../lib/auth.js");
    const EMAIL = P.bootstrapEmail();
    /* A platform already in use: a real password chosen, and a second
       consultant who has chosen their own. */
    await c.query("UPDATE accounts SET password_hash = $1, must_change = false WHERE email = $2",
      [auth3.hashPassword("MyRealPassw0rd!"), EMAIL]);
    await c.query(
      "INSERT INTO accounts (email, name, kind, is_admin, password_hash, must_change, status) " +
      "VALUES ($1,$2,'office',false,$3,false,'active') ON CONFLICT (email) DO UPDATE " +
      "SET password_hash = EXCLUDED.password_hash, must_change = false",
      ["someone.else@forefront.consulting", "Someone Else", auth3.hashPassword("TheirOwnPass!9")]);
    await c.query("DELETE FROM _platform_migrations WHERE name = $1", ["004-keep-the-simple-password.js"]);

    const first = await P.resetTheSuperUserPassword(c);
    check("the explicit reset runs", first.reset === true, first);
    const me = (await c.query("SELECT password_hash, must_change FROM accounts WHERE email = $1",
      [EMAIL])).rows[0];
    check("…putting 1234 back over a real password", auth3.verifyPassword("1234", me.password_hash));
    /* AND IT IS NOT TEMPORARY (§147.25). Islam asked for the PASSWORD, not
       for a way in to choose another, and reaffirmed it after the cost was
       stated. The forced change still means what it means for everybody else,
       which is what the next assertion is really about. */
    check("…and does not ask for it to be changed", me.must_change === false, me);
    /* IT NAMES ONE ADDRESS: nobody else's password is touched, or an explicit
       favour to one person hands a known password to everybody. */
    const other = (await c.query("SELECT password_hash FROM accounts WHERE email = $1",
      ["someone.else@forefront.consulting"])).rows[0];
    check("…and nobody else's password moves",
      auth3.verifyPassword("TheirOwnPass!9", other.password_hash) &&
      !auth3.verifyPassword("1234", other.password_hash));

    /* THE ONE THAT MATTERS. */
    await c.query("UPDATE accounts SET password_hash = $1, must_change = false WHERE email = $2",
      [auth3.hashPassword("Chosen4Real!"), EMAIL]);
    const again = await P.resetTheSuperUserPassword(c);
    check("…and never runs a second time", again.reset === false, again);
    const now = (await c.query("SELECT password_hash FROM accounts WHERE email = $1",
      [EMAIL])).rows[0];
    check("…so a chosen password is not replaced on the next deploy",
      auth3.verifyPassword("Chosen4Real!", now.password_hash) &&
      !auth3.verifyPassword("1234", now.password_hash));
  });

  /* ── 12 · the tenant that was already here (§147.21) ──────────
     A deployment carrying this code and an unmigrated database has a real
     client in it and no row saying so. Adoption registers it WHERE IT ALREADY
     LIVES — no table moves — which is what lets the code ship without the
     migration having to land in the same breath. */
  await P.withPlatform(pg, async function (c) {
    /* A platform that already knows its clients is not missing one. */
    await c.query("DELETE FROM _platform_migrations WHERE name = $1",
                  ["003-adopt-the-existing-tenant.js"]);
    const before = (await c.query("SELECT count(*)::int AS n FROM clients")).rows[0].n;
    const skipped = await P.adoptExistingTenant(c);
    check("a platform that already has clients adopts nothing",
          before > 0 && skipped.adopted === null, { before: before, got: skipped });
    /* AND ONCE: the row it just wrote says it has been asked. */
    const again = await P.adoptExistingTenant(c);
    check("…and does not ask again", again.adopted === null, again);
  });

  console.log("\n" + pass + " passed, " + fail + " failed");
  await pool.end();
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) {
  console.error("\nTHREW: " + (e && (e.stack || e.message)));
  process.exit(1);
});
