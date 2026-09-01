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
const io = require("../lib/state-io.js");
const { writeState, readState, ensureReady } = io;
const auth = require("../lib/auth.js");
const { authorize } = require("../lib/authorize.js");
const P = require("../lib/platform-io.js");

/* The six env-var spellings Neon and Vercel use between them live in ONE
   place now (lib/state-io.js): this was copied here and into api/auth.js
   identically, and what is copied is the LIST — a third copy, which
   api/feedback.js would have been, is a third place to forget one the day the
   integration renames something. */
function getPool() { return io.getPool(pg); }

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

/* A database error names tables, columns and sometimes values — a free map of
   the schema to anyone probing, and meaningless to the person who hit it. The
   real one goes to the function's log. */
function safeError(e) {
  if (e && (e.code === "NO_DB" || e.code === "NO_CLIENT")) return String(e.message);
  console.error("api/state:", e && (e.stack || e.message || e));
  return "Something went wrong saving. Nothing was changed — try again, and tell the SMO if it keeps happening.";
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

/* One row per kind of change. `rows` is capped: a plan import moves thousands
   of figures at once, and a log entry nobody can read is not a record — the
   count stays exact, the itemised before-and-after stops at the cap. */
const LOG_ROW_CAP = 200;

/* `person` is the REGISTER ROW — what the stored graph knows, which is what
   decides authorisation — and `email` is who actually signed in. On a client
   whose register predates the platform those are deliberately different
   things: several of Forefront's people act as one row (§147.30), so the row
   says what may be done and the address says who did it. Written first as
   `person.email`, which is the register's own address and empty for a row the
   client wrote — so the column landed and stayed blank. */
async function logChanges(client, person, changes, email) {
  if (!changes || !changes.length) return;
  try {
    for (const ch of changes) {
      const rows = ch.rows && ch.rows.length
        ? { count: ch.rows.length, moved: ch.rows.slice(0, LOG_ROW_CAP) }
        : null;
      await client.query(
        /* AND THE ADDRESS THEY SIGNED IN WITH (§147.30). Several of
           Forefront's people may act as one row on a client's register, so the
           row alone no longer says who did it — the session has always known
           the address and it simply was not written down. */
        "INSERT INTO change_log (person_key, person_name, email, kind, target, what, rows_) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [person.key, person.name || null, email || person.email || null,
         ch.kind, ch.target, ch.what,
         rows ? JSON.stringify(rows) : null]);
    }
  } catch (e) {
    /* A log that cannot be written must not lose a save that already landed.
       It is reported to the function's own output, where it is visible. */
    console.error("change_log write failed:", e.message);
  }
}

module.exports = async function handler(req, res) {
  let client;
  try {
    /* WHICH CLIENT IS THIS FOR (spec 024). Read BEFORE the connection,
       because the connection is what gets pointed at the client's schema —
       which is also why a POST's body is read here rather than in its own
       branch below. */
    const body = req.method === "POST" ? await readBody(req) : null;
    client = await P.connectFor(pg, P.clientSlugFrom(req, body));
    const ready = await ensureReady(client, client._smpClient.schema_name);

    /* Since v2.1 the state is for signed-in people only (§19). Phase 1
       enforces WHO at the door; per-action WHAT enforcement is Phase 2 and
       recorded as such. */
    const person = await auth.getSession(client, req, client._smpClient.key);
    if (!person) return send(res, 401, { ok: false, auth: true, error: "sign in required" });
    /* A TEMPORARY password is not a password yet. The gate has always sent
       people to the change screen, but the SERVER did not care whether they
       went — so an issued password bought a full thirty-day session and the
       whole tenant's data with it. It is refused here, where it matters, and
       the flag tells the platform to send them back to the door. */
    if (person.mustChange) {
      return send(res, 403, { ok: false, auth: true, mustChange: true,
                              error: "Choose your own password before going on." });
    }

    if (req.method === "GET") {
      /* THE OFFICE ARRIVES ON THE REGISTER (spec 024 §6). Done on the way in
         rather than when somebody is added to a team, because a client created
         later, or a team changed while nobody was looking, would otherwise
         leave a person signed in and holding nothing. */
      if (person.kind !== "client") {
        /* THE SEAT THE SESSION ALREADY RESOLVED, not a second lookup (§147.22).
           This asked `seatIn()` again — which returns nothing for an office
           account with no row on this client — so the platform's super user
           opening a client nobody has been put on got NO register row, and the
           page told them they were "signed in but not on this register" over a
           plan that was sitting right there.

           §147.20's fault one layer on, and the same shape: getSession() has
           already answered this, including the seat the RULE gives somebody
           arriving without one, so asking the database a second way could only
           ever disagree with it. */
        await P.ensureOfficeRow(client, { person_key: person.key, seat: person.seat },
          { name: person.name, email: person.email, kind: person.kind },
          /* WHOSE REGISTER IT IS (§147.31) — the registry row says, and the
             endpoint has it already. */
          !!client._smpClient.made_here);
      }
      const state = await readState(client);
      /* WHAT THE CHROME NEEDS TO DRAW THE WAY BACK (spec 024): the client's
         own name, and whether this person has cards to go back TO. Only the
         server knows the second — a client's own person holds one client and
         has no outer platform at all. */
      const who = Object.assign({}, person, {
        clientName: client._smpClient.name,
        cards: person.kind !== "client"
      });
      return send(res, 200, { ok: true, seeded: ready.seeded, person: who, state: state });
    }
    if (req.method === "POST") {
      const state = body && body.state;
      /* A minimal shape check — a malformed save must fail loudly rather than
         wipe the tenant with nothing to write back. */
      if (!state || !state.group || !state.units || !Array.isArray(state.unitKeys) || !state.unitKeys.length) {
        return send(res, 400, { ok: false, error: "state is missing or not shaped like the platform's graph" });
      }

      /* WHO MAY CHANGE WHAT (spec 006). Until this existed, being signed in
         was the whole check: any signed-in person could post a state making
         themselves the SMO, because the save rewrites the register and the
         access matrix along with everything else.

         The person is looked up in the STORED graph, not taken from the
         session and not read from the incoming state — the session carries
         only the seat role, and the incoming state is exactly what must not
         be trusted. Somebody the graph does not know holds no roles, so their
         save is refused rather than waved through. */
      const stored = await readState(client);
      const me = (stored.people || []).filter(function (p) { return p.key === person.key; })[0]
              || { key: person.key, name: person.name };
      const verdict = authorize(stored, state, me);
      if (!verdict.ok) {
        return send(res, 403, { ok: false, refused: true,
                                error: verdict.refusals.join(" "),
                                refusals: verdict.refusals });
      }

      await writeState(client, state);
      /* Logged AFTER the write and outside its transaction on purpose: a log
         entry for a save that did not land is worse than a missing one. */
      await logChanges(client, me, verdict.changes, person.email);
      return send(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "method not allowed" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : e.code === "NO_CLIENT" ? 404 : 500, { ok: false, error: safeError(e) });
  } finally {
    if (client) await P.releaseClient(client);
  }
};
