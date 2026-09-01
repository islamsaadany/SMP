/* /api/platform — Forefront's own platform: the cards, and who may open them.
   ═══════════════════════════════════════════════════════════════════════

   ONE ENDPOINT WITH AN ACTION, the shape api/auth.js and api/chat.js already
   have (constitution VI). Its connection is pointed at the PLATFORM schema,
   never at a client — a client's data is reached through /api/state, which
   does its own resolving.

   WHAT IT ANSWERS IS WHAT THE SERVER WILL OPEN. The cards are drawn from
   SMPRules' sibling — lib/platform-rules.js — and the same function decides
   both, so a card can never offer a client the next request refuses. */

const pg = require("pg");
const P = require("../lib/platform-io.js");
const FF = require("../lib/platform-rules.js");
const auth = require("../lib/auth.js");

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
  }
  return new Promise(function (resolve, reject) {
    let data = "";
    req.on("data", function (c) { data += c; });
    req.on("end", function () { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function safeError(e) {
  if (e && (e.code === "NO_DB" || e.code === "NO_CLIENT")) return String(e.message);
  console.error("api/platform:", e && (e.stack || e.message || e));
  return "Something went wrong. Nothing was changed — try again, and tell the platform's admin if it keeps happening.";
}

/* What a card says, and every number on it is read rather than stored: a card
   that remembered how many units a client had would be a second copy of that
   fact, going stale quietly (constitution V). */
async function factsFor(row) {
  try {
    return await P.withSchema(pg, row.schema_name, async function (c) {
      const n = async (t) => Number((await c.query("SELECT count(*)::int AS n FROM " + t)).rows[0].n);
      const units = await n("units");
      const pillars = await n("pillars");
      /* A CYCLE IS OPEN WHEN IT IS NAMED AND NOT LOCKED. There is no `open`
         column — the first version of this asked for one and every card came
         back blank, which the log said and the screen did not. `locked` is
         what Setup › Running the cycle sets, and a cycle with no name has not
         been opened at all. */
      const cyc = await c.query("SELECT name, locked FROM cycle WHERE id = 1");
      const row = cyc.rowCount ? cyc.rows[0] : null;
      return { units: units,
               planned: pillars > 0,
               cycleOpen: !!(row && String(row.name || "").trim() && !row.locked) };
    });
  } catch (e) {
    /* A client whose schema cannot be read is still a client — the card says
       so rather than the whole page failing because one of them is unwell. */
    console.error("card facts for " + row.key + ":", e.message);
    return { units: null, planned: null, cycleOpen: null, unreadable: true };
  }
}

module.exports = async function handler(req, res) {
  try {
    const body = req.method === "POST" ? await readBody(req) : {};
    const action = body.action || (req.method === "GET" ? "me" : "");

    return await P.withPlatform(pg, async function (c) {
      await P.ensurePlatformReady(c);

      /* Asked with no client: the session resolves to the ACCOUNT, which is
         what every page of the outer platform is about. */
      const me = await auth.getSession(c, req, null);
      if (!me) return send(res, 401, { ok: false, auth: true, error: "sign in required" });
      if (me.mustChange) {
        return send(res, 403, { ok: false, auth: true, mustChange: true,
                                error: "Choose your own password before going on." });
      }
      /* A CLIENT'S OWN PERSON HAS NO OUTER PLATFORM. They are not refused a
         page here so much as there is no page here for them: they hold one
         client and they are already in it. */
      if (me.kind === "client") {
        return send(res, 403, { ok: false, error: "That is not something this account opens." });
      }

      const account = { email: me.email, name: me.name, is_admin: me.isAdmin,
                        kind: me.kind, status: "active" };
      const world = await P.worldFor(c, me.email);

      if (action === "me") {
        return send(res, 200, { ok: true, account: {
          email: account.email, name: account.name, isAdmin: !!account.is_admin
        }, access: world.access, mine: FF.myClientKeys(world) });
      }

      if (action === "cards") {
        const all = await P.allClients(c);
        /* THE ONE LIST. visibleClients is what the endpoints ask too, so a
           card is never drawn for a client the next request would refuse. */
        const shown = FF.visibleClients(world, account, all);
        const cards = [];
        for (const row of shown) {
          const facts = await factsFor(row);
          cards.push({
            key: row.key, name: row.name, industry: row.industry, kind: row.kind,
            mark: row.mark, mine: FF.isMine(world, row.key),
            /* THE SEAT IS WHAT A CARD SAYS ABOUT THIS PERSON AND THIS CLIENT
               (revision 3): `state` is how far they may go — listed, or open —
               and `seat` is what they hold when they arrive. */
            seat: FF.seatOn(world, row.key),
            state: FF.clientState(world, account, row),
            canOpen: FF.mayOpenClient(world, account, row),
            canConfig: FF.mayReadConfig(world, account, row),
            units: facts.units, planned: facts.planned,
            cycleOpen: facts.cycleOpen, unreadable: !!facts.unreadable
          });
        }
        return send(res, 200, { ok: true, cards: cards,
          canAdd: FF.mayCreateClient(world, account),
          canConsultants: FF.mayReadConsultants(world, account),
          canAccess: FF.mayEditAccess(world, account) });
      }

      /* ── Forefront's own people ─────────────────────────────── */
      if (action === "consultants") {
        if (!FF.mayReadConsultants(world, account)) {
          return send(res, 403, { ok: false, error: "The consultants list is not yours to open." });
        }
        /* THE SEATS ARE READ HERE AND SET ON EACH CLIENT'S CONFIGURATION —
           one place writes them (§53.5). Gathered per person so the row can
           say "Raya Trade · Super user", which is what somebody opening this
           page is actually asking. */
        const rows = (await c.query(
          "SELECT a.email, a.name, a.is_admin, a.status, a.must_change, " +
          "  COALESCE((SELECT json_agg(json_build_object('client', cl.name, 'key', cl.key, 'seat', ac.seat) " +
          "            ORDER BY cl.name) " +
          "            FROM account_clients ac JOIN clients cl ON cl.key = ac.client_key " +
          "            WHERE ac.email = a.email), '[]'::json) AS seats " +
          "FROM accounts a WHERE a.kind = 'office' ORDER BY a.name")).rows;
        return send(res, 200, { ok: true, people: rows.map(function (r) {
          return { email: r.email, name: r.name, isAdmin: !!r.is_admin, status: r.status,
                   seats: r.seats,
                   /* §35's three states, unchanged: a person the platform has
                      never been asked about has NO password state, which is a
                      dash and not a "none". */
                   password: r.must_change == null ? "none" : (r.must_change ? "temporary" : "set") };
        }), canEdit: FF.mayManageConsultants(world, account),
            canSetAdmin: FF.isAdmin(account), me: account.email });
      }

      if (action === "saveConsultant") {
        if (!FF.mayManageConsultants(world, account)) {
          return send(res, 403, { ok: false, error: "Adding and changing consultants is the platform admin's." });
        }
        const email = String(body.email || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return send(res, 400, { ok: false, error: "That is not an email address." });
        }
        const existing = await P.accountByEmail(c, email);

        /* THE ADMIN FLAG IS ITS OWN ACT, and never one somebody performs on
           themselves: a platform with no admin cannot be run, and demoting
           yourself while tidying up is the fastest way there (§89). */
        if (body.isAdmin !== undefined && existing.email) {
          if (!FF.maySetAdmin(world, account, existing)) {
            return send(res, 403, { ok: false, error:
              existing.email === account.email
                ? "You cannot change your own admin rights."
                : "Only the platform admin sets that." });
          }
          await c.query("UPDATE accounts SET is_admin = $2, updated_at = now() WHERE email = $1",
                        [email, !!body.isAdmin]);
        }

        if (existing.email) {
          await c.query(
            "UPDATE accounts SET name = COALESCE($2, name), status = COALESCE($3, status), " +
            "updated_at = now() WHERE email = $1", [email, body.name || null, body.status || null]);

          /* ── AND THE ADDRESS ITSELF CAN CHANGE (§147.27) ─────────────
             Islam: "I need to edit the consultants names and emails as well."
             The name was already editable; the address was not, because it is
             what everything here is keyed by — the account, the seats, the
             sessions.

             A RENAME, NOT A NEW PERSON. Done as ordered statements in one
             transaction rather than by adding ON UPDATE CASCADE, because the
             order is the part worth reading: the new row first, then the
             things that point at it, then the old row — so nothing is ever
             pointing at an address that does not exist.

             THE PERSON KEY DOES NOT MOVE. `ff_islam_saadany` is minted from
             the address once and is written into the client's register, where
             a unit's custodian and an owner point at it — changing it because
             a label changed is §87's fault exactly. The address SHOWN on that
             register follows, so the two do not disagree.

             AND EVERY SESSION IS ENDED. They carry the old address, and a
             signed-in tab holding a name the accounts table no longer has is
             a session nobody can reason about — signing in again is cheap and
             is the honest answer (§43's rule for a password change). */
          const to = String(body.newEmail || "").trim().toLowerCase();
          if (to && to !== email) {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
              return send(res, 400, { ok: false, error: "That is not an email address." });
            }
            const taken = await P.accountByEmail(c, to);
            if (taken.email) {
              return send(res, 409, { ok: false, error:
                "That address already belongs to somebody on this platform." });
            }
            await c.query("BEGIN");
            try {
              await c.query(
                "INSERT INTO accounts (email, name, kind, is_admin, password_hash, must_change, status, created_at) " +
                "SELECT $2, name, kind, is_admin, password_hash, must_change, status, created_at " +
                "FROM accounts WHERE email = $1", [email, to]);
              await c.query("UPDATE account_clients SET email = $2 WHERE email = $1", [email, to]);
              await c.query("DELETE FROM sessions WHERE email = $1", [email]);
              await c.query("DELETE FROM accounts WHERE email = $1", [email]);
              await c.query("COMMIT");
            } catch (e) {
              await c.query("ROLLBACK");
              throw e;
            }
            /* The address on each client's register follows the account, so
               the register and the platform say the same thing about the same
               person. Best-effort per client: a client whose schema is
               unreachable must not undo a rename that has already landed. */
            const mine = (await c.query(
              "SELECT client_key, person_key FROM account_clients WHERE email = $1", [to])).rows;
            for (const m of mine) {
              const cl = await P.clientByKey(c, m.client_key);
              if (!cl.schema_name) continue;
              try {
                await P.withSchema(pg, cl.schema_name, function (sc) {
                  return sc.query(
                    "UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{email}', to_jsonb($2::text)) " +
                    "WHERE key = $1", [m.person_key, to]);
                });
              } catch (e) {
                console.error("renaming " + m.person_key + " in " + m.client_key + ":", e.message);
              }
            }
            return send(res, 200, { ok: true, email: to, signedOut: true });
          }
          return send(res, 200, { ok: true });
        }

        /* A NEW CONSULTANT ARRIVES ON NO CLIENT, holding nothing — which is
           what a new joiner is, and needs no role of its own to say. Their
           temporary password is said once and stored nowhere in the clear. */
        const pw = require("crypto").randomBytes(9).toString("base64")
          .replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
        await c.query(
          "INSERT INTO accounts (email, name, kind, is_admin, password_hash, must_change) " +
          "VALUES ($1,$2,'office',$3,$4,true)",
          [email, body.name || "", !!body.isAdmin && FF.isAdmin(account), auth.hashPassword(pw)]);
        return send(res, 200, { ok: true, created: true, password: pw });
      }

      if (action === "issuePassword") {
        const target = await P.accountByEmail(c, String(body.email || "").toLowerCase());
        if (!target.email) return send(res, 400, { ok: false, error: "No such account." });
        /* THE TEST IS THE TARGET (§89) — one rule, in the shared file. */
        if (!FF.mayIssuePasswordTo(world, account, target)) {
          return send(res, 403, { ok: false, error:
            target.is_admin ? "That is an admin's account."
                            : "Issuing passwords is the platform admin's." });
        }
        const pw = require("crypto").randomBytes(9).toString("base64")
          .replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
        await c.query("UPDATE accounts SET password_hash = $2, must_change = true, updated_at = now() " +
                      "WHERE email = $1", [target.email, auth.hashPassword(pw)]);
        /* A reset is a lockout or a handover, and either way the old sessions
           die (§43). */
        await auth.destroySessionsFor(c, [target.email]);
        return send(res, 200, { ok: true, password: pw });
      }

      /* ── A client's configuration ───────────────────────────── */
      if (action === "client") {
        const row = await P.clientByKey(c, body.key);
        if (!row.key || !FF.mayReadConfig(world, account, row)) throw P.noSuchClient();
        /* ── WHO THEY ALREADY ARE ON THIS REGISTER (§147.29) ─────────
           Raya Trade's register was built before the platform existed, so
           Forefront's own people are already on it — Mohamed Essam is `smo`,
           under a Raya address. Adding him to the team mints `ff_essam` and he
           becomes TWO rows for one human, which is the fault §87 exists for.

           From now on the platform is the entry point and this cannot arise;
           what is needed is a way to say it ONCE for the clients that predate
           it. So the configuration offers the register, and the SMO points the
           account at the row that is already there.

           A LIST, NOT A MATCH. §87 is explicit that a name is never an
           identifier, and these two rows share no identifier at all — his Raya
           address is not his Forefront one. A person answers it, exactly as
           the role picker suggests before it creates (§87.3). Read
           best-effort: a client whose schema is unreachable must not stop its
           configuration opening. */
        let register = [];
        try {
          register = await P.withSchema(pg, row.schema_name, async function (sc) {
            return (await sc.query(
              "SELECT key, name, role, extra->>'email' AS email, extra->>'forefront' AS ff " +
              "FROM people WHERE COALESCE(extra->>'active','true') <> 'false' ORDER BY idx")).rows;
          });
        } catch (e) { console.error("reading " + row.key + "'s register:", e.message); }
        return send(res, 200, { ok: true, client: row, team: await P.teamOf(c, row.key),
          seats: FF.SEATS,
          canEdit: FF.mayConfigureClient(world, account, row),
          register: register,
          office: (await c.query("SELECT email, name, is_admin FROM accounts " +
                                 "WHERE kind='office' AND status='active' ORDER BY name")).rows });
      }

      if (action === "saveClient") {
        const row = await P.clientByKey(c, body.key);
        if (!row.key || !FF.mayReadConfig(world, account, row)) throw P.noSuchClient();
        if (!FF.mayConfigureClient(world, account, row)) {
          return send(res, 403, { ok: false, error: "This client's configuration is not yours to change." });
        }
        /* THE SCHEMA NAME IS NEVER TOUCHED HERE. A client whose name is
           corrected must not change schema — that is a move, not an edit. */
        await c.query(
          "UPDATE clients SET name = COALESCE($2,name), industry = COALESCE($3,industry), " +
          "notes = COALESCE($4,notes), mark = COALESCE($5,mark) WHERE key = $1",
          [row.key, body.name || null, body.industry == null ? null : String(body.industry),
           body.notes == null ? null : String(body.notes), body.mark || null]);
        return send(res, 200, { ok: true });
      }

      if (action === "createClient") {
        if (!FF.mayCreateClient(world, account)) {
          return send(res, 403, { ok: false, error: "Adding a client is the platform admin's." });
        }
        const name = String(body.name || "").trim();
        if (!name) return send(res, 400, { ok: false, error: "A client needs a name." });
        const key = P.slugFor(body.key || name);
        if (!key) return send(res, 400, { ok: false, error: "That name does not make an address." });
        const taken = await P.clientByKey(c, key);
        if (taken.key) return send(res, 400, { ok: false, error: "There is already a client at /" + key + "." });
        const schema = P.schemaNameFor(key);
        /* THE SCHEMA IS MADE FIRST AND THE ROW SECOND: a registry row pointing
           at a schema that does not exist is a client that cannot be opened,
           and every request would answer "not available" with no way to see
           why. The other order leaves an unreferenced schema, which is
           invisible and harmless. */
        await P.createClientSchema(pg, schema, name);
        await c.query(
          "INSERT INTO clients (key, name, schema_name, industry, notes) VALUES ($1,$2,$3,$4,$5)",
          [key, name, schema, String(body.industry || ""), String(body.notes || "")]);
        return send(res, 200, { ok: true, key: key });
      }

      if (action === "setTeam") {
        const row = await P.clientByKey(c, body.key);
        if (!row.key || !FF.mayReadConfig(world, account, row)) throw P.noSuchClient();
        if (!FF.mayConfigureClient(world, account, row)) {
          return send(res, 403, { ok: false, error: "This client's team is not yours to change." });
        }
        const email = String(body.email || "").trim().toLowerCase();
        const who = await P.accountByEmail(c, email);
        if (!who.email || who.kind !== "office") {
          return send(res, 400, { ok: false, error: "That is not somebody at Forefront." });
        }
        if (body.on === false) {
          const seat = (await c.query(
            "SELECT person_key FROM account_clients WHERE email = $1 AND client_key = $2",
            [email, row.key])).rows[0];
          await c.query("DELETE FROM account_clients WHERE email = $1 AND client_key = $2", [email, row.key]);
          /* AND THE ROW INSIDE THE CLIENT IS RETIRED, NOT DELETED (§35's rule,
             and §62's): the person may be a custodian, may have entered
             figures, may be named on a plan line — deleting the row would
             orphan every pointer at them, and retiring says the true thing,
             which is that they are no longer working on this client. Their
             seat goes with it, because a retired row holding `smoteam` is a
             seat nobody occupies. */
          if (seat && seat.person_key) {
            try {
              await P.withSchema(pg, row.schema_name, async function (sc) {
                /* `role` is NOT NULL with '' as its default (§33: an empty
                   seat is the empty string, never null). Written as NULL
                   first, which the database refused and the log said — the
                   retire silently did not happen while the endpoint answered
                   ok, because it is deliberately in a try. */
                await sc.query(
                  "UPDATE people SET role = '', " +
                  "extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{active}', 'false'::jsonb) " +
                  "WHERE key = $1", [seat.person_key]);
              });
            } catch (e) {
              /* Said, not swallowed: the team row is gone either way, and an
                 unretired row is something a person can fix on the register. */
              console.error("retiring " + seat.person_key + " in " + row.key + ":", e.message);
            }
          }
          return send(res, 200, { ok: true });
        }
        /* The person key this account IS inside that client — minted once from
           the address, and never from the name, which changes. */
        /* THE ROW THEY ALREADY ARE, if the configuration says so (§147.29);
           otherwise minted from the address, which is what a client created
           since the platform always gets.

           VALIDATED AGAINST THAT CLIENT'S OWN REGISTER, and refused if another
           account already holds it — two accounts pointing at one register row
           is the same duplicate seen from the other side. */
        let personKey = P.officePersonKey(email);
        const asKey = String(body.personKey || "").trim();
        /* AND ON A CLIENT THAT HAS A REGISTER, SAYING WHO THEY ARE IS
           REQUIRED (§147.30). Nothing is created there any more, so an account
           added without an answer would hold a seat and be nobody — a team row
           that opens a client showing nothing. A register with nobody in it is
           the one case that needs no answer, because there is nobody to be. */
        if (body.on !== false && !asKey) {
          let peopled = false;
          try {
            peopled = await P.withSchema(pg, row.schema_name, async function (sc) {
              return (await sc.query("SELECT 1 FROM people LIMIT 1")).rowCount > 0;
            });
          } catch (e) { console.error("reading " + row.key + "'s register:", e.message); }
          const has = (await c.query(
            "SELECT person_key FROM account_clients WHERE email = $1 AND client_key = $2",
            [email, row.key])).rows[0];
          if (peopled && !has) {
            return send(res, 400, { ok: false, error:
              "Say who they are on this client's register — nobody is created there." });
          }
        }
        if (asKey && asKey !== personKey) {
          /* SEVERAL ACCOUNTS MAY BE ONE ROW (§147.30, Islam's option B). On a
             client whose register predates this platform there is nobody for
             most of Forefront to be — Raya's register holds Mohamed Essam and
             not the others — so the honest answer is that they ACT AS that
             person rather than being added to the client's register as new
             people.

             The guard that refused this is gone. What made it look necessary
             was the change log saying `smo` for all of them, and Islam saw
             that for what it was: the session knows the address, it simply was
             not written down. Migration 029 records it, so the client can tell
             two consultants apart on one row. */
          let there = false;
          try {
            there = await P.withSchema(pg, row.schema_name, async function (sc) {
              return (await sc.query("SELECT 1 FROM people WHERE key = $1", [asKey])).rowCount > 0;
            });
          } catch (e) { console.error("checking " + asKey + " in " + row.key + ":", e.message); }
          if (!there) {
            return send(res, 400, { ok: false, error: "That person is not on this client's register." });
          }
          personKey = asKey;
        }
        const seat = FF.SEAT_KEYS.indexOf(String(body.seat)) > -1 ? String(body.seat) : "smoteam";
        /* A CLIENT MAY HAVE MORE THAN ONE SUPER USER (§147.26). This MOVED
           the seat — demote whoever held it, then write the new one — because
           a unique index refused a second. Islam: "a project might have 2
           super users", so the index is gone and so is the move: giving
           somebody the seat gives it to them, and takes nothing from anybody.

           The transaction stays. It guarded a pair of statements that had to
           land together and now guards one, which costs nothing and means the
           next thing added here inherits it rather than having to remember. */
        await c.query("BEGIN");
        try {
          /* THE PERSON KEY MOVES ONLY WHEN IT WAS ASKED FOR. The upsert set
             `seat` alone, so pointing an account at an existing register row
             answered `ok` and changed nothing — silent, and in the direction
             that looks like the control is broken.

             AND IT CANNOT SIMPLY BE ADDED TO THE UPDATE: `personKey` falls
             back to the one minted from the address, so every later press of
             a SEAT would quietly undo the mapping. `$5` is the explicit
             answer or nothing, and nothing keeps what is there. */
          await c.query(
            "INSERT INTO account_clients (email, client_key, person_key, seat) VALUES ($1,$2,$3,$4) " +
            "ON CONFLICT (email, client_key) DO UPDATE SET seat = EXCLUDED.seat, " +
            "  person_key = COALESCE($5, account_clients.person_key)",
            [email, row.key, personKey, seat, asKey || null]);
          await c.query("COMMIT");
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        }
        /* AND THE SEAT REACHES THE CLIENT'S OWN REGISTER, where every rule in
           lib/rules.js reads it. Without this the configuration would say one
           thing and the client's platform another until their next visit.

           ONLY ON A ROW THE PLATFORM CREATED (§147.29). This wrote the role
           unconditionally and went straight past `ensureOfficeRow`'s adoption
           rule — so pointing an account at a row that was already there, and
           then touching the seat, DEMOTED Raya's own SMO from `super` to
           `smoteam` on their own register. A row the client wrote is the
           client's: the seat says what the ACCOUNT may do on the platform, and
           the register says what the person is inside it.

           Asked of `ffrow` — the platform minted this row — and never of
           `forefront`, which says whose PERSON it is and is true of Mohamed
           Essam whether or not the platform wrote his row. Two different
           facts, and conflating them puts the hole straight back. */
        /* THE KEY THE ROW ACTUALLY HOLDS, read back rather than re-minted.
           This used `personKey`, which for an existing member is the key
           MINTED FROM THE ADDRESS — and where the stored one differs it names
           nobody, so the seat never reached the register and nothing said so.
           Raya's own team is exactly that case: the migration wrote `ff_omar`
           and the minter produces `ff_omar_alaa`. Silent, and in the direction
           where the configuration and the client disagree for ever. */
        const landed = (await c.query(
          "SELECT person_key FROM account_clients WHERE email = $1 AND client_key = $2",
          [email, row.key])).rows[0];
        /* ── AND A ROW THIS LEAVES BEHIND IS RETIRED, NEVER DELETED
              (§147.30, Islam: "should be retired for now until we verify the
              other flow working and I will delete them myself") ──────────
           Pointing an account at somebody who is already on the register
           orphans the row the platform minted for them. Retiring says the true
           thing — nobody works here as that person any more — and leaves
           anything that ever pointed at it intact (§35, §62). Only rows the
           PLATFORM created are touched: `ffrow` is the mark, never
           `forefront`, which is a fact about the person (§147.29). */
        try {
          await P.withSchema(pg, row.schema_name, async function (sc) {
            await sc.query(
              "UPDATE people SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{active}', 'false'::jsonb) " +
              "WHERE extra->>'ffrow' = 'true' AND key <> ALL($1::text[])",
              [(await c.query("SELECT person_key FROM account_clients WHERE client_key = $1",
                              [row.key])).rows.map(function (x) { return x.person_key; })]);
          });
        } catch (e) { console.error("retiring in " + row.key + ":", e.message); }
        try {
          await P.withSchema(pg, row.schema_name, async function (sc) {
            await sc.query(
              "UPDATE people SET role = $2 WHERE key = $1 AND extra->>'ffrow' = 'true'",
              [landed ? landed.person_key : personKey, seat]);
          });
        } catch (e) { console.error("seat into " + row.key + ":", e.message); }
        return send(res, 200, { ok: true });
      }

      /* ── Who sees what ──────────────────────────────────────── */
      if (action === "access") {
        return send(res, 200, { ok: true, areas: FF.AREAS,
          defaults: FF.ACCESS_DEFAULTS[FF.EVERYONE], stored: world.access[FF.EVERYONE] || {},
          canEdit: FF.mayEditAccess(world, account) });
      }

      if (action === "saveAccess") {
        if (!FF.mayEditAccess(world, account)) {
          return send(res, 403, { ok: false, error: "This table is the platform admin's." });
        }
        const areaKey = String(body.area || "");
        const area = FF.AREAS.filter(function (a) { return a.key === areaKey; })[0];
        if (!area) return send(res, 400, { ok: false, error: "There is no such column." });
        const state = String(body.grant || "");
        /* EACH COLUMN TAKES ITS OWN WORDS — hidden/listed/open for the clients
           somebody holds no seat on, none/view/edit for the consultants list,
           none/yes for adding one. Checked against the column rather than
           against one list for all of them, or a column would quietly accept a
           word it does not mean. */
        if (area.states.indexOf(state) < 0) {
          return send(res, 400, { ok: false, error: "That is not a setting for that column." });
        }
        /* A CELL PUT BACK TO ITS DEFAULT DELETES ITS ROW (§50.6). */
        const def = FF.ACCESS_DEFAULTS[FF.EVERYONE][areaKey];
        if (state === def) {
          await c.query("DELETE FROM platform_access WHERE role_key = $1 AND area_key = $2",
                        [FF.EVERYONE, areaKey]);
        } else {
          await c.query(
            "INSERT INTO platform_access (role_key, area_key, grant_) VALUES ($1,$2,$3) " +
            "ON CONFLICT (role_key, area_key) DO UPDATE SET grant_ = EXCLUDED.grant_",
            [FF.EVERYONE, areaKey, state]);
        }
        return send(res, 200, { ok: true });
      }

      return send(res, 400, { ok: false, error: "unknown action" });
    });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : e.code === "NO_CLIENT" ? 404 : 500,
                { ok: false, error: safeError(e) });
  }
};
