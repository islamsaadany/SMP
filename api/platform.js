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
            units: facts.units, planned: facts.planned,
            cycleOpen: facts.cycleOpen, unreadable: !!facts.unreadable
          });
        }
        return send(res, 200, { ok: true, cards: cards,
          canAdd: FF.mayCreateClient(world, account),
          canConsultants: FF.mayReadConsultants(world, account),
          canAccess: FF.mayEditAccess(world, account) });
      }

      return send(res, 400, { ok: false, error: "unknown action" });
    });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : e.code === "NO_CLIENT" ? 404 : 500,
                { ok: false, error: safeError(e) });
  }
};
