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
const auth = require("../lib/auth.js");
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
  if (e && e.code === "NO_DB") return String(e.message);
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

    /* ── SIGN IN WITH AN EMAIL ADDRESS (§69.11) ─────────────────────
       It took a PERSON KEY, and a person key is minted from the name
       (mintPersonKey) and shown in exactly two places: the Set-a-password
       prompt and a row's hover title. So the one string the door accepts was
       the one string nobody had. Islam, locked out of his own deployment with
       a password he had just issued himself: "it should ask for my email and
       the emails were uploaded in the sheet to the people registry."

       THE KEY STILL WORKS, and that is not tidiness. The bootstrap SMO has no
       email at all (§43.8 keeps `SMO` / `1234` with must_change so a fresh
       deployment has a way in), and so does anybody whose Email cell is blank
       — which today is every row of the demo seed. A door that only takes an
       email locks all of them out, and a deployment nobody can enter is not a
       deployment.

       Resolved on the SERVER, from one query, because the two identifiers have
       to be answered by the same lookup or they are two doors. */
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

      /* An empty box matches nothing. Without this guard `trim(email) = ''`
         is true of every person who has no address, so pressing Enter on a
         blank field would report the whole register as an ambiguous match. */
      if (!typed) {
        await auth.recordFailure(client, typed, ip);
        return send(res, 401, { ok: false, error: WRONG_SIGNIN });
      }
      const who = (await client.query(
        "SELECT key FROM people " +
        "WHERE lower(key) = $1 OR lower(trim(COALESCE(extra->>'email',''))) = $1 " +
        "ORDER BY idx", [typed])).rows;

      /* TWO ROWS, ONE ADDRESS — a shared inbox, or somebody imported twice.
         Nothing has ever enforced uniqueness here, so it is a real state and
         it needs an answer that is not "sign one of them in": signing somebody
         in as a colleague is the worst outcome available, and nothing on the
         screen would say which of the two they had become.

         IT SAYS SO AT THE DOOR, at Islam's direction, and that is a
         deliberate trade against §43.3's rule that a refusal must not confirm
         which names exist. The person stuck cannot fix it themselves and has
         no way to know who to ask otherwise.

         IT RECORDS A FAILURE, and it is worth being precise about which limit
         that buys. Somebody probing addresses uses a DIFFERENT string every
         time, so the 8-per-key threshold never trips for them — the thing that
         bounds enumeration here is the 25-per-ADDRESS-in-15-minutes limit, and
         it only bounds it because this branch records a failure like every
         other refusal. Take the recordFailure out and the oracle is
         unlimited. */
      if (who.length > 1) {
        await auth.recordFailure(client, typed, ip);
        return send(res, 401, { ok: false, error:
          "That address is on more than one row of the register, so it does " +
          "not say who you are. Ask the SMO." });
      }
      const key = who.length ? who[0].key : typed;
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
        await auth.recordFailure(client, typed, ip);
        return send(res, 401, { ok: false, error: WRONG_SIGNIN });
      }
      /* Getting in clears the failures: the threshold is there to slow a
         guess, and a guess that succeeded is not what it is counting. BOTH
         strings, because somebody who tried their key a few times and then
         their address has failures recorded under each. */
      await auth.clearFailures(client, typed);
      if (key !== typed) await auth.clearFailures(client, key);
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
    /* ── Where people say they work (§56) ──────────────────────────
       THE LIST IS BUILT ON THE SERVER, not sent up by the client. A client
       that names its own options can name one that is not there, and the
       declaration is stored by key — so the choices and the check come from
       the same query rather than from two that can disagree.

       Readable by anybody signed in, and it holds nothing confidential: the
       units and supporting functions are the navigation bar. */
    if (action === "whereList") {
      const person = await auth.getSession(client, req);
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
      const person = await auth.getSession(client, req);
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
        /* AND SAYING IT AGAIN CLEARS THE ANSWER (§180). A dismissal is the
           SMO's reply to one statement; a new statement is owed a new reply,
           or one dismissal would silence a person for the life of the tenant.
           Cleared whether or not the place changed — "I still work in
           Logistics" is a thing somebody can mean to say. */
        "INSERT INTO bu_declarations (person_key, at) VALUES ($1, $2) " +
        "ON CONFLICT (person_key) DO UPDATE SET at = EXCLUDED.at, " +
        "declared_on = now(), dismissed_on = NULL, dismissed_by = NULL",
        [person.key, at]);
      return send(res, 200, { ok: true, at: at });
    }

    /* What everybody said, for the SMO to act on. The same shape and the same
       gate as passwordStates, which the People page already reads. */
    if (action === "declarations") {
      const person = await auth.getSession(client, req);
      if (!person || person.role !== "super") {
        return send(res, 403, { ok: false, error: "The register is the SMO's." });
      }
      const rows = (await client.query(
        "SELECT person_key, at, dismissed_on FROM bu_declarations")).rows;
      /* §180 · TWO SHAPES, DELIBERATELY. An undismissed declaration is still
         the bare string it has always been, so a client older than this
         reads every outstanding claim exactly as before; only a DISMISSED one
         becomes {at, dismissed}, which such a client reads as an object and
         draws no note for — the safe way round, since the one it cannot
         understand is the one that is already answered. §58's rule: write the
         new shape, and leave the old one readable. */
      const said = {};
      rows.forEach(function (r) {
        said[r.person_key] = r.dismissed_on
          ? { at: r.at, dismissed: r.dismissed_on }
          : r.at;
      });
      return send(res, 200, { ok: true, said: said });
    }

    /* ── THE OTHER ANSWER (§180) ────────────────────────────────────────
       "No, the register was already right." Accepting has always been an
       ordinary edit of the person's BU on the People page; this is the reply
       that has never existed, and without it a claim the SMO disagrees with
       nags on five surfaces for ever.

       IT STORES AN ANSWER, NOT A DELETION (Islam's pick): the claim stays
       readable on the row and in the dialog, marked as answered.

       THE SAME GATE AS READING THEM. Whoever may see every declaration may
       answer one — and the gate is asked HERE rather than trusted from the
       screen (§42), because a control that only hides is decoration. It
       touches nothing but this table, so it moves nobody's access. */
    if (action === "dismissWhere") {
      const person = await auth.getSession(client, req);
      if (!person || person.role !== "super") {
        return send(res, 403, { ok: false, error: "The register is the SMO's." });
      }
      const key = String(body.person || "").trim();
      if (!key) return send(res, 400, { ok: false, error: "Which person?" });
      /* Nothing is INSERTED: dismissing something nobody said is not a state
         this table should be able to hold, so an unknown key changes nothing
         and says so rather than inventing a row (§15.1). */
      const r = await client.query(
        "UPDATE bu_declarations SET dismissed_on = now(), dismissed_by = $2 " +
        "WHERE person_key = $1", [key, person.key]);
      if (!r.rowCount) return send(res, 404, { ok: false, error: "They have not said where they work." });
      return send(res, 200, { ok: true });
    }

    if (action === "passwordStates") {
      const person = await auth.getSession(client, req);
      if (!person || !isOffice(person)) {
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
      const done = await client.query(
        all
          ? "INSERT INTO credentials (person_key, password_hash, must_change) " +
            "SELECT p.key, $1, true FROM people p " +
            "WHERE COALESCE(p.extra->>'active','true') <> 'false' AND p.key <> $2 " +
            officeOnly +
            "ON CONFLICT (person_key) DO UPDATE " +
            "  SET password_hash = EXCLUDED.password_hash, must_change = true, " +
            "      updated_at = now() " +
            "RETURNING person_key"
          : "INSERT INTO credentials (person_key, password_hash, must_change) " +
            "SELECT p.key, $1, true FROM people p " +
            "WHERE COALESCE(p.extra->>'active','true') <> 'false' AND p.key <> $2 " +
            officeOnly +
            "  AND NOT EXISTS (SELECT 1 FROM credentials c WHERE c.person_key = p.key) " +
            "RETURNING person_key",
        [hash, person.key]);
      const issued = done.rows.map(function (r) { return r.person_key; });
      if (all && issued.length) {
        await client.query("DELETE FROM sessions WHERE person_key = ANY($1)", [issued]);
      }
      return send(res, 200, { ok: true, issued: issued });
    }

    return send(res, 400, { ok: false, error: "unknown action" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500, { ok: false, error: safeError(e) });
  } finally {
    if (client) client.release();
  }
};
