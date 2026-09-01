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

      const account = { email: me.email, name: me.name, role: me.officeRole,
                        kind: me.kind, status: "active" };
      const world = await P.worldFor(c, me.email);

      if (action === "me") {
        return send(res, 200, { ok: true, account: {
          email: account.email, name: account.name, role: account.role
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
            grant: FF.clientGrant(world, account, row),
            /* Said per client, because configuration rides what the role can
               REACH: a Lead configures their own clients and not another's. */
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
        const rows = (await c.query(
          "SELECT a.email, a.name, a.role, a.status, a.must_change, " +
          "       (SELECT count(*)::int FROM account_clients ac WHERE ac.email = a.email) AS clients " +
          "FROM accounts a WHERE a.kind = 'office' ORDER BY a.name")).rows;
        return send(res, 200, { ok: true, people: rows.map(function (r) {
          return { email: r.email, name: r.name, role: r.role, status: r.status,
                   /* §35's three states, unchanged: a person the platform has
                      never been asked about has NO password state, which is a
                      dash and not a "none". */
                   password: r.must_change == null ? "none" : (r.must_change ? "temporary" : "set"),
                   clients: r.clients };
        }), canEdit: FF.mayManageConsultants(world, account), roles: FF.ROLES });
      }

      if (action === "saveConsultant") {
        if (!FF.mayManageConsultants(world, account)) {
          return send(res, 403, { ok: false, error: "Adding and changing consultants is the platform admin's." });
        }
        const email = String(body.email || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return send(res, 400, { ok: false, error: "That is not an email address." });
        }
        const role = body.role === null || body.role === "" ? null : String(body.role);
        if (role !== null && FF.ROLE_KEYS.indexOf(role) < 0) {
          return send(res, 400, { ok: false, error: "There is no such role." });
        }
        /* THE ADMIN'S OWN ROW IS NOT EDITABLE FROM HERE, for §89's reason: the
           platform must always have somebody who can run it, and the fastest
           way to lose that is to demote yourself while tidying up. */
        const existing = await P.accountByEmail(c, email);
        if (existing.email === account.email && role !== account.role) {
          return send(res, 400, { ok: false, error: "You cannot change your own role." });
        }
        if (existing.email && existing.role === FF.ADMIN && account.role !== FF.ADMIN) {
          return send(res, 403, { ok: false, error: "That is an admin's account." });
        }
        if (existing.email) {
          await c.query(
            "UPDATE accounts SET name = COALESCE($2, name), role = $3, status = COALESCE($4, status), " +
            "updated_at = now() WHERE email = $1",
            [email, body.name || null, role, body.status || null]);
        } else {
          /* A NEW CONSULTANT IS CREATED WITH A TEMPORARY PASSWORD, said once
             and stored nowhere in the clear (§43.1). */
          const pw = require("crypto").randomBytes(9).toString("base64")
            .replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
          await c.query(
            "INSERT INTO accounts (email, name, kind, role, password_hash, must_change) " +
            "VALUES ($1,$2,'office',$3,$4,true)",
            [email, body.name || "", role, auth.hashPassword(pw)]);
          return send(res, 200, { ok: true, created: true, password: pw });
        }
        return send(res, 200, { ok: true });
      }

      if (action === "issuePassword") {
        const target = await P.accountByEmail(c, String(body.email || "").toLowerCase());
        if (!target.email) return send(res, 400, { ok: false, error: "No such account." });
        /* THE TEST IS THE TARGET (§89) — one rule, in the shared file. */
        if (!FF.mayIssuePasswordTo(world, account, target)) {
          return send(res, 403, { ok: false, error:
            target.role === FF.ADMIN ? "That is an admin's account."
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
        return send(res, 200, { ok: true, client: row, team: await P.teamOf(c, row.key),
          canEdit: FF.mayConfigureClient(world, account, row),
          office: (await c.query("SELECT email, name, role FROM accounts " +
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
        const personKey = "ff_" + email.split("@")[0].replace(/[^a-z0-9]+/g, "_").slice(0, 24);
        await c.query(
          "INSERT INTO account_clients (email, client_key, person_key) VALUES ($1,$2,$3) " +
          "ON CONFLICT (email, client_key) DO NOTHING", [email, row.key, personKey]);
        if (body.super === true) {
          /* ONE SUPER USER PER CLIENT is a unique index, so the seat is moved
             rather than added — the database would refuse a second. */
          await c.query("UPDATE account_clients SET is_super = false WHERE client_key = $1", [row.key]);
          await c.query("UPDATE account_clients SET is_super = true WHERE client_key = $1 AND email = $2",
                        [row.key, email]);
        }
        return send(res, 200, { ok: true });
      }

      /* ── Who sees what ──────────────────────────────────────── */
      if (action === "access") {
        return send(res, 200, { ok: true, roles: FF.ROLES, areas: FF.AREAS,
          defaults: FF.ACCESS_DEFAULTS, stored: world.access,
          canEdit: FF.mayEditAccess(world, account), admin: FF.ADMIN });
      }

      if (action === "saveAccess") {
        const roleKey = String(body.role || ""), areaKey = String(body.area || "");
        if (!FF.mayEditAccessRow(world, account, roleKey)) {
          return send(res, 403, { ok: false, error:
            roleKey === FF.ADMIN
              ? "The admin's row cannot be changed — editing this table is editing who may edit it."
              : "This table is the platform admin's." });
        }
        if (FF.AREA_KEYS.indexOf(areaKey) < 0) {
          return send(res, 400, { ok: false, error: "There is no such column." });
        }
        const grant = String(body.grant || "none");
        if (["none", "view", "edit"].indexOf(grant) < 0) {
          return send(res, 400, { ok: false, error: "That is not a setting." });
        }
        /* A CELL PUT BACK TO ITS DEFAULT DELETES ITS ROW (§50.6): a stored map
           holds what has been CHANGED, so a tenant that has been set and unset
           is byte-identical to one nobody has touched. */
        const def = (FF.ACCESS_DEFAULTS[roleKey] || {})[areaKey] || "none";
        if (grant === def) {
          await c.query("DELETE FROM platform_access WHERE role_key = $1 AND area_key = $2",
                        [roleKey, areaKey]);
        } else {
          await c.query(
            "INSERT INTO platform_access (role_key, area_key, grant_) VALUES ($1,$2,$3) " +
            "ON CONFLICT (role_key, area_key) DO UPDATE SET grant_ = EXCLUDED.grant_",
            [roleKey, areaKey, grant]);
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
