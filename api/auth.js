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
const io = require("../lib/state-io.js");
const { ensureReady } = io;
const P = require("../lib/platform-io.js");
const auth = require("../lib/auth.js");
const FF = require("../lib/platform-rules.js");
const Rules = require("../lib/rules.js");

/* THE OFFICE, READ OFF THE STORED SEAT (§89). `people.role` holds the seat and
   nothing else does, so this is one column either way — but it is asked
   through the shared list rather than by typing the two strings here, because
   a third office role would otherwise have to be remembered in this file. */
function isOffice(row) { return Rules.isOfficeRole(String((row && row.role) || "")); }

/* The six env-var spellings Neon and Vercel use between them live in ONE
   place now (lib/state-io.js): this was copied here and into the other
   endpoint identically, and what is copied is the list — a third copy would
   be a third place to forget one the day the integration renames something. */
function getPool() { return io.getPool(pg); }

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
  if (e && (e.code === "NO_DB" || e.code === "NO_CLIENT")) return String(e.message);
  console.error("api/auth:", e && (e.stack || e.message || e));
  return "Something went wrong. Try again, and tell the SMO if it keeps happening.";
}

/* ONE MESSAGE FOR A WRONG NAME AND A WRONG PASSWORD (§43.3). A sign-in screen
   must not confirm which addresses or keys this tenant holds, so every refusal
   but one says exactly this. Named once now that two paths reach it — two
   copies of a security message is how one of them comes to say more than the
   other. The exception is the duplicate-address refusal below, which Islam
   settled deliberately and which is rate limited like any other failure. */
const WRONG_SIGNIN =
  "Wrong sign-in. Check both fields, or ask the SMO to reset your password.";

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}


/* WHERE AN ACCOUNT LANDS AFTER THE DOOR (spec 024).
   ONE DESTINATION IS NOT A QUESTION (§32), and the destinations are what this
   account can OPEN — not the clients it is on the team of. An Admin is on one
   team and can open every client, so counting team rows would land them in one
   client and they would never see the cards their own row entitles them to.
   Asked through the shared rules, so the answer and the cards agree. */
async function landingFor(client, account) {
  if (!account || !account.email) return { land: null, list: [] };
  const mine = (await client.query(
    "SELECT client_key, person_key, seat FROM platform.account_clients WHERE email = $1",
    [account.email])).rows;
  if (account.kind === "client") {
    /* Their one client, always — and never a card. */
    return { land: mine.length ? mine[0].client_key : null, list: null };
  }
  const access = (await client.query(
    "SELECT role_key, area_key, grant_ FROM platform.platform_access")).rows
    .reduce(function (m, r) { (m[r.role_key] = m[r.role_key] || {})[r.area_key] = r.grant_; return m; }, {});
  const world = { mine: mine, access: access };
  const all = (await client.query(
    "SELECT key, kind, status FROM platform.clients ORDER BY kind, name")).rows;
  /* LANDING COUNTS WHAT THEY CAN OPEN, not what they can see. With the
     default setting a consultant is shown every client by name — that is the
     office knowing what Forefront runs — while holding a seat on one. Counting
     the LISTED ones would put a card page in front of somebody with exactly
     one destination, which is the door behind a door §32 removed. */
  const listed = FF.visibleClients(world, account, all).map(function (c) { return c.key; });
  const openable = all.filter(function (c) { return FF.mayOpenClient(world, account, c); })
                      .map(function (c) { return c.key; });
  return { land: openable.length === 1 ? openable[0] : null, list: listed };
}

module.exports = async function handler(req, res) {
  let client;
  try {
    /* WHICH CLIENT IS THIS FOR (spec 024). The browser sends the slug it was
       served at; the schema comes from the registry row, never from the
       request (§36.4). An unknown client and one this account may not open are
       the same refusal, so trying slugs tells nobody anything. */
    const body = req.method === "POST" ? await readBody(req) : {};
    client = await P.connectFor(pg, P.clientSlugFrom(req, body));
    await ensureReady(client, client._smpClient.schema_name);
    /* Which client this request is about — the sessions are the platform's,
       the people are this client's, and every lookup below needs both. */
    const CLIENT_KEY = client._smpClient.key;

    const action = body.action || (req.method === "GET" ? "me" : "");

    if (action === "me") {
      /* ASKED WITHOUT A CLIENT (spec 024). This is the door's own question —
         "is there a live session, and where does it land" — and asking it
         against a client would refuse anybody whose client is not the default
         one, which from the door reads as "your session expired". */
      const person = await auth.getSession(client, req, null);
      if (!person) return send(res, 200, { ok: true, person: null });
      const where = await landingFor(client, { email: person.email, kind: person.kind,
                                               is_admin: person.isAdmin, status: "active" });
      return send(res, 200, { ok: true, person: person, client: where.land, clients: where.list });
    }

    if (action === "login") {
      const typed = String(body.user || "").trim().toLowerCase();
      const ip = auth.clientIp(req);
      /* One DELETE on a path that is already writing — there is no scheduler
         in a serverless deployment, and expired sessions and stale attempts
         were accumulating for ever. */
      await auth.pruneExpired(client);
      /* Checked BEFORE the password is verified, or the limiter is a timing
         oracle: a wrong password would take a scrypt hash's worth of time and
         a locked-out one would not. Counted against WHAT WAS TYPED rather than
         against whoever it resolves to: that is the string an attacker varies,
         and it is also the only thing there is to count when it resolves to
         nobody. */
      const slow = await auth.tooManyAttempts(client, typed, ip);
      if (slow) return send(res, 429, { ok: false, error: slow });

      /* An empty box matches nothing. */
      if (!typed) {
        await auth.recordFailure(client, typed, ip);
        return send(res, 401, { ok: false, error: WRONG_SIGNIN });
      }

      /* ── EMAIL, AND NOTHING ELSE (spec 024) ────────────────────────
         Islam, 2026-08-28: "access only through email ... no access through
         user name SMO in any place." The person-key path is gone, and with it
         §69.23's two-rows-one-address refusal — an address is the PRIMARY KEY
         of platform.accounts now, so the ambiguity it existed to name cannot
         occur. Somebody on a register with no address simply has no account,
         which the Attention queue already names. */
      const acct = (await client.query(
        "SELECT email, name, kind, is_admin, password_hash, must_change, status " +
        "FROM platform.accounts WHERE email = $1", [typed])).rows[0];

      /* ONE MESSAGE for an address nobody has and a password that is wrong —
         a door should not confirm which addresses exist. A RETIRED account
         gets the same one: retirement closes the door, not just the menu. */
      if (!acct || acct.status === "retired" ||
          !auth.verifyPassword(body.password, acct.password_hash)) {
        await auth.recordFailure(client, typed, ip);
        return send(res, 401, { ok: false, error: WRONG_SIGNIN });
      }
      /* Getting in clears the failures: the threshold slows a guess, and a
         guess that succeeded is not what it counts. */
      await auth.clearFailures(client, typed);
      const token = await auth.createSession(client, acct.email);
      res.setHeader("Set-Cookie", auth.cookieHeader(req, token));

      /* WHERE THIS PERSON LANDS. A client's own person holds exactly one
         client and goes straight into it — they never see a card, and never
         learn another client exists. Somebody at Forefront gets the cards.
         Answered HERE, on the server, because the browser asking would have
         to be told the list first. */
      const where = await landingFor(client, { email: acct.email, kind: acct.kind,
                                               is_admin: acct.is_admin, status: acct.status });
      return send(res, 200, { ok: true, person: {
        key: acct.email, email: acct.email, name: acct.name, kind: acct.kind,
        isAdmin: !!acct.is_admin, mustChange: acct.must_change
      }, client: where.land, clients: where.list });
    }

    if (action === "logout") {
      await auth.destroySession(client, req);
      res.setHeader("Set-Cookie", auth.cookieHeader(req, "", true));
      return send(res, 200, { ok: true });
    }

    if (action === "change") {
      const person = await auth.getSession(client, req, CLIENT_KEY);
      if (!person) return send(res, 401, { ok: false, error: "sign in first" });
      const why = auth.passwordPolicy(body.password);
      if (why) return send(res, 400, { ok: false, error: "The password needs " + why + "." });
      /* The password belongs to the ACCOUNT, not to a row on one client's
         register: one person, one password, whichever client they are in. */
      await client.query(
        "UPDATE platform.accounts SET password_hash = $1, must_change = false, updated_at = now() " +
        "WHERE email = $2", [auth.hashPassword(body.password), person.email]);
      /* The old password may be exactly why they are changing it, so every
         other session it opened ends here. Their own stays: being signed out
         of the tab you just used to choose a password is not security, it is
         a bug that looks like one. */
      await auth.destroyOtherSessions(client, req, person.email);
      await auth.clearFailures(client, person.key);
      return send(res, 200, { ok: true });
    }

    if (action === "setPassword") {
      const person = await auth.getSession(client, req, CLIENT_KEY);
      /* ── THE SERVER'S OWN CHECK, AND IT IS ABOUT THE TARGET (§89) ──
         Was `person.role !== "super"` — one column, which is all the question
         needed while the office was one person. It is two roles now, and the
         SMO team's limit is not WHAT they may do but WHOSE account they may do
         it to: the client's people, never a Super user's and never another
         team member's.

         BOTH ROLES ARE READ OFF THE STORED ROW, never off anything the browser
         sent — the screen hides the control on the office's rows, and this is
         what makes hiding it more than decoration (§42). */
      if (!person || !isOffice(person)) {
        return send(res, 403, { ok: false, error: "Issuing passwords is the SMO's." });
      }
      /* LOWERCASED, BECAUSE THE DOOR LOWERCASES (§69.11). This stored the key
         exactly as it arrived while login() compares against a lowercased one,
         so a mixed-case key would write a credential nothing could ever match:
         the correct password, refused for ever, with nothing anywhere saying
         why. Latent rather than live — mintPersonKey() lowercases, so every
         key the platform has ever minted is safe — but it is precisely the
         shape of the fault Islam reported, and a pair of comparisons that
         normalise differently will find each other eventually. */
      const key = String(body.person || "").trim().toLowerCase();
      const target = (await client.query("SELECT key, role FROM people WHERE key = $1", [key])).rows[0];
      if (!target) return send(res, 400, { ok: false, error: "No person with key " + key + "." });
      /* NAMED, NOT VAGUE. A refusal that says only "not allowed" leaves
         somebody pressing it again; this says which rule stopped them and
         who can do it (§16.7). */
      if (person.role !== "super" && isOffice(target)) {
        return send(res, 403, { ok: false, error:
          "That is the strategy office's own account. A Super user resets those." });
      }
      const why = auth.passwordPolicy(body.password);
      if (why) return send(res, 400, { ok: false, error: "The password needs " + why + "." });
      /* Admin-issued passwords are temporary: the person must choose their
         own on first sign-in. Their existing sessions end — a reset is
         usually a lockout or a handover, and either way old sessions die. */
      /* A PASSWORD IS ISSUED TO AN ADDRESS, because that is what the door
         takes (spec 024). Somebody on the register with no address cannot be
         given one — said plainly, with the thing to go and do, rather than
         refused as "not allowed" (§16.7). */
      const addr = String((await client.query(
        "SELECT COALESCE(extra->>'email','') AS email FROM people WHERE key = $1", [key]
      )).rows[0].email || "").trim().toLowerCase();
      if (!addr) {
        return send(res, 400, { ok: false, error:
          "That person has no email address on the register, and people sign in " +
          "by email. Add their address first, then issue the password." });
      }
      const nameOf = (await client.query("SELECT name FROM people WHERE key = $1", [key])).rows[0].name;
      await client.query(
        "INSERT INTO platform.accounts (email, name, kind, password_hash, must_change) " +
        "VALUES ($1,$2,'client',$3,true) " +
        "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, " +
        "  must_change = true, updated_at = now()",
        [addr, nameOf || "", auth.hashPassword(body.password)]);
      /* And the account is tied to THIS client, as this person. Without the
         row they would have a password and nowhere to use it. */
      await client.query(
        "INSERT INTO platform.account_clients (email, client_key, person_key) VALUES ($1,$2,$3) " +
        "ON CONFLICT (email, client_key) DO NOTHING", [addr, CLIENT_KEY, key]);
      await auth.destroySessionsFor(client, [addr]);
      return send(res, 200, { ok: true });
    }

    /* Who has a password, and is it still the temporary one. The People page
       cannot show a "no password yet" column without this, and it cannot be
       derived from the state graph: credentials live in their own table and
       deliberately never enter the graph (§19). Keys and states only — no
       hash, no timestamp, nothing that helps anyone guess. */
    /* ── Where people say they work (§56) ──────────────────────────
       THE LIST IS BUILT ON THE SERVER, not sent up by the client. A client
       that names its own options can name one that is not there, and the
       declaration is stored by key — so the choices and the check come from
       the same query rather than from two that can disagree.

       Readable by anybody signed in, and it holds nothing confidential: the
       units and supporting functions are the navigation bar. */
    if (action === "whereList") {
      const person = await auth.getSession(client, req, CLIENT_KEY);
      if (!person) return send(res, 401, { ok: false, error: "sign in first" });
      /* `active` IS A COLUMN ON BOTH, NOT A KEY IN `extra` (§69.14). These read
         `extra->>'active'`, which is never set on a unit or a function — only
         on a PERSON, where retirement really does ride in the extra blob
         (§35). So COALESCE returned 'true' every time and the filter passed
         everything: a retired unit has been offered on the first-sign-in list
         since §56 shipped, and a retired one is exactly the place somebody
         must not say they work.

         The same shape as §48.6 and §45.3: a comparison against a field
         nobody sets fails SILENTLY, and here it failed in the GENEROUS
         direction, which is why no sweep caught it. Found by asserting it. */
      const us = (await client.query(
        "SELECT key, name, company FROM units WHERE active ORDER BY idx")).rows;
      const fs = (await client.query(
        "SELECT key, name FROM functions WHERE active ORDER BY idx")).rows;
      const mine = (await client.query(
        "SELECT at, declared_on FROM bu_declarations WHERE person_key = $1", [person.key])).rows[0];

      /* ── THE SHORT LIST (§57) ──────────────────────────────────────
         Their own Main BU says which units and functions it holds, so that is
         what they are offered first. NARROWED ON THE SERVER from the stored
         BU list, never sent up and filtered by the page: a client that decides
         its own short list has decided nothing, because it still had the long
         one to decide from.

         AND THE REST IS STILL THERE, under its own heading. Islam: "they can
         always choose other and we can adjust with them later if something is
         missing." A short list that cannot be escaped is a short list that
         strands whoever it forgot — and the declaration grants nothing either
         way, so nothing turns on which half they pick from.

         A row written before the list held several still reads: `at` is a
         string there and an array here, and both mean the same thing. */
      const mb = (await client.query(
        "SELECT extra->'mainbus' AS mainbus FROM org LIMIT 1")).rows[0];
      const rows = (mb && mb.mainbus) || [];
      const who = (await client.query(
        "SELECT extra->>'mainbu' AS mainbu, unit_key, fn_key, extra->>'company' AS company " +
        "FROM people WHERE key = $1", [person.key])).rows[0];
      const norm = function (x) { return String(x == null ? "" : x).trim().toLowerCase(); };
      const row = rows.filter(function (b) { return norm(b.name) === norm(who && who.mainbu); })[0];
      const raw = !row ? []
        : (Array.isArray(row.at) ? row.at : (row.at ? [row.at] : [])).filter(Boolean);

      /* ── A COMPANY IS NOT SOMEWHERE YOU SAY YOU WORK (§69.14) ────────
         The short list came out EMPTY for the one tenant it was built for, and
         the page then showed the flat list it shows when nothing is mapped —
         Islam: "on the selection of the unit on login the whole list was
         brought while we already set the Official BU he belongs to."

         The cause is §54's own vocabulary meeting §57's narrowing. An Official
         BU points at whatever `r.at` can name — a unit, `fn:<key>`, `co:<key>`,
         "group", or nothing — and in THIS tenant Distribution is a COMPANY
         (§54.1: six of the ten client names are not units here). But this list
         offers units and functions only, because those are the places a person
         can BE. So `co:distribution` matched nothing, `near` came back empty,
         and every narrowing collapsed silently into no narrowing at all —
         failing in the safe direction and therefore never noticed (§48.6, the
         fourth time that shape has cost a version).

         A COMPANY EXPANDS TO THE UNITS IT HOLDS, which is the honest reading:
         "you work at Distribution" narrows the question to Distribution's
         three units rather than answering it. The GROUP expands to nothing —
         everything is under the group, so it narrows nothing and offering the
         full list under a heading saying "yours" would be a lie about where
         somebody works. */
      const inCompany = function (co) {
        return us.filter(function (u) { return u.company === co; })
                 .map(function (u) { return u.key; });
      };
      /* ── AND WHERE THE REGISTER ALREADY PUTS THEM (§69.18) ──────────
         The Official BU was the only thing this narrowed by, and it is the one
         fact half the register does not carry: in Raya's own file some rows
         have an Official BU and no Unit, and others have a Unit and no
         Official BU. For everybody in the second group the short list was
         empty for a reason that had nothing to do with them — the SMO had
         already said where they sit, and the question ignored it.

         So the person's own attachment is added to the offer. It is not a
         second source of truth: `unit_key` / `fn_key` / `company` are what
         personAt() reads (§54.1), and the declaration still grants nothing
         either way — this only decides which two or three names are at the
         top of a list of eighteen. */
      if (who) {
        if (who.unit_key && who.unit_key !== "group") raw.push(who.unit_key);
        if (who.fn_key) raw.push("fn:" + who.fn_key);
        if (who.company) raw.push("co:" + who.company);
      }
      const ats = [];
      raw.forEach(function (at) {
        const t = String(at);
        if (t === "group") return;
        if (t.indexOf("co:") === 0) {
          inCompany(t.slice(3)).forEach(function (k) {
            if (ats.indexOf(k) === -1) ats.push(k);
          });
          return;
        }
        if (ats.indexOf(t) === -1) ats.push(t);
      });
      /* AND ONLY THINGS THIS LIST ACTUALLY OFFERS. A unit or function that has
         since been retired can still be named by an Official BU or held on a
         person's row, and an `at` the page cannot find is an `at` that makes
         `near` look longer than the group it renders (§57's gate reads
         `near.indexOf`). Filtered against what is being served, so the two
         halves of the answer cannot disagree. */
      const offered = us.map(function (u) { return u.key; })
        .concat(fs.map(function (f) { return "fn:" + f.key; }));
      const near = ats.filter(function (a) { return offered.indexOf(a) > -1; });

      /* ── AND IF THE REGISTER ALREADY SAYS, DO NOT ASK (§93.13) ──────
         Islam: "Ahmed Mostafa's unit is already set in the registry table, he
         shouldn't get the dropdown of what unit he belongs to."

         Right, and it follows from what a declaration IS. §56 built it as a
         thing that grants nothing: the person says where they think they work
         and the SMO — who decides — accepts it on the register. When the SMO
         has ALREADY placed them, the question has already been answered by the
         only person whose answer counts, and asking it again offers somebody a
         choice that changes nothing.

         THE TEST IS THE ATTACHMENT, NOT THE OFFICIAL BU. `unit_key` / `fn_key`
         / `company` are what personAt() reads and what decides access (§54.1);
         an Official BU is the client's own word for a department and may point
         at nothing here (§58.3), so a row carrying only that is still a row
         nobody has placed. And "group" is not a placement — the seat roles all
         sit there — so it does not count either.

         DECIDED ON THE SERVER, like the short list above it and for the same
         reason: a page that decides whether to ask has decided nothing,
         because it still had the question. */
      const placed = !!(who && ((who.unit_key && who.unit_key !== "group") ||
                                who.fn_key || who.company));

      return send(res, 200, { ok: true,
        units: us.map(function (r) { return { at: r.key, name: r.name }; }),
        functions: fs.map(function (r) { return { at: "fn:" + r.key, name: r.name }; }),
        mainbu: (row && row.name) || null,
        near: near,
        settled: placed,
        mine: mine ? mine.at : null });
    }

    /* A DECLARATION, AND NOTHING ELSE HAPPENS. It does not touch `people`, so
       it moves nobody's access: the SMO reads it on the People page and
       attaches them there, which is an ordinary edit the authoriser already
       guards. Validated against the same list `whereList` builds, so a crafted
       request can only store something that exists. */
    if (action === "declareWhere") {
      const person = await auth.getSession(client, req, CLIENT_KEY);
      if (!person) return send(res, 401, { ok: false, error: "sign in first" });
      const at = String(body.at || "").trim();
      if (!at) {
        await client.query("DELETE FROM bu_declarations WHERE person_key = $1", [person.key]);
        return send(res, 200, { ok: true, at: null });
      }
      /* Validated against the same set whereList OFFERS, retirement included —
         the comment above this handler says "validated against the same list
         whereList builds", and it was not: this accepted a retired unit the
         list no longer shows. */
      const known = at.indexOf("fn:") === 0
        ? (await client.query("SELECT 1 FROM functions WHERE key = $1 AND active", [at.slice(3)])).rowCount
        : (await client.query("SELECT 1 FROM units WHERE key = $1 AND active", [at])).rowCount;
      if (!known) return send(res, 400, { ok: false, error: "That is not somewhere in this organisation." });
      await client.query(
        "INSERT INTO bu_declarations (person_key, at) VALUES ($1, $2) " +
        "ON CONFLICT (person_key) DO UPDATE SET at = EXCLUDED.at, declared_on = now()",
        [person.key, at]);
      return send(res, 200, { ok: true, at: at });
    }

    /* What everybody said, for the SMO to act on. The same shape and the same
       gate as passwordStates, which the People page already reads. */
    if (action === "declarations") {
      const person = await auth.getSession(client, req, CLIENT_KEY);
      if (!person || person.role !== "super") {
        return send(res, 403, { ok: false, error: "The register is the SMO's." });
      }
      const rows = (await client.query("SELECT person_key, at FROM bu_declarations")).rows;
      const said = {};
      rows.forEach(function (r) { said[r.person_key] = r.at; });
      return send(res, 200, { ok: true, said: said });
    }

    if (action === "passwordStates") {
      const person = await auth.getSession(client, req, CLIENT_KEY);
      if (!person || !isOffice(person)) {
        return send(res, 403, { ok: false, error: "Passwords are the SMO's." });
      }
      /* THE STATE IS THE ACCOUNT'S, READ THROUGH THIS CLIENT (spec 024).
         A person with no account has no password — which is the same dash the
         column has always drawn for "we never asked" (§35) — and a person with
         no ADDRESS can never have one, which is why the register names them in
         its Attention queue rather than leaving the dash to be interpreted. */
      const rows = (await client.query(
        "SELECT p.key, a.must_change FROM people p " +
        "LEFT JOIN platform.account_clients ac ON ac.person_key = p.key AND ac.client_key = $1 " +
        "LEFT JOIN platform.accounts a ON a.email = ac.email", [CLIENT_KEY])).rows;
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
      const person = await auth.getSession(client, req, CLIENT_KEY);
      if (!person || !isOffice(person)) {
        return send(res, 403, { ok: false, error: "Issuing passwords is the SMO's." });
      }
      const why = auth.passwordPolicy(body.password);
      if (why) return send(res, 400, { ok: false, error: "The password needs " + why + "." });
      const hash = auth.hashPassword(body.password);
      /* TWO SCOPES, AND THE SECOND ONE IS NOT THE FIRST ONE WITH A WIDER WHERE.
         'none' (the default, and what this endpoint always did) reaches only
         people who have never had a password: it can lock nobody out, because
         nobody it touches could sign in anyway.

         'all' is a RESET — it overwrites a password somebody is using — so it
         carries two things the first does not. Their other sessions END, or a
         reset leaves the person it was aimed at still signed in, which is not a
         reset. And it EXCLUDES THE PERSON ASKING: §43 already learned that
         being signed out of the tab you are working in is a bug that looks
         like security, and here it is worse — mistype the shared password
         while resetting everybody and the SMO has locked themselves out of
         their own deployment with no second SMO to ask.

         Retired people are excluded from both. §35 turns them away at the door
         with the correct password, so issuing them one is issuing a password
         that cannot be used. */
      /* AND THE SET SHRINKS FOR THE SMO TEAM (§89). The screen already counts
         only who they may reach, but the screen does not decide — this does.
         A Super user reaches everybody; a team member reaches the client's
         people, so the office's own rows are excluded in SQL rather than
         trusted to have been left out of a list nobody sent. */
      const officeOnly = person.role !== "super"
        ? " AND COALESCE(p.role,'') NOT IN ('super','smoteam')" : "";
      const all = body.scope === "all";

      /* THE SERVER STILL DECIDES WHO IS IN THE SET — the client sends a scope,
         never a list. What changed with spec 024 is only WHERE the password
         lands: platform.accounts, keyed by the address on the register, with
         the row that ties that account to this client written beside it.

         PEOPLE WITH NO ADDRESS ARE NOT IN THE SET, and they are COUNTED
         rather than passed over in silence — "12 issued" when the register
         holds 20 people is a number somebody has to explain. */
      const rows = (await client.query(
        "SELECT p.key, p.name, lower(trim(COALESCE(p.extra->>'email',''))) AS email " +
        "FROM people p " +
        "WHERE COALESCE(p.extra->>'active','true') <> 'false' AND p.key <> $1" + officeOnly,
        [person.key])).rows;

      const withAddress = rows.filter(function (r) { return !!r.email; });
      const noAddress = rows.filter(function (r) { return !r.email; }).map(function (r) { return r.name || r.key; });

      const held = (await client.query(
        "SELECT ac.person_key FROM platform.account_clients ac " +
        "JOIN platform.accounts a ON a.email = ac.email " +
        "WHERE ac.client_key = $1", [CLIENT_KEY])).rows.map(function (r) { return r.person_key; });

      const set = all ? withAddress
                      : withAddress.filter(function (r) { return held.indexOf(r.key) < 0; });

      const issued = [];
      for (const r of set) {
        await client.query(
          "INSERT INTO platform.accounts (email, name, kind, password_hash, must_change) " +
          "VALUES ($1,$2,'client',$3,true) " +
          "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, " +
          "  must_change = true, updated_at = now()", [r.email, r.name || "", hash]);
        await client.query(
          "INSERT INTO platform.account_clients (email, client_key, person_key) VALUES ($1,$2,$3) " +
          "ON CONFLICT (email, client_key) DO NOTHING", [r.email, CLIENT_KEY, r.key]);
        issued.push(r.key);
      }
      if (all && issued.length) {
        await auth.destroySessionsFor(client, set.map(function (r) { return r.email; }));
      }
      return send(res, 200, { ok: true, issued: issued, noAddress: noAddress });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : e.code === "NO_CLIENT" ? 404 : 500, { ok: false, error: safeError(e) });
  } finally {
    if (client) await P.releaseClient(client);
  }
};
