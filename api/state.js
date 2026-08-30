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
const R = require("../lib/rules.js");

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
  if (e && e.code === "NO_DB") return String(e.message);
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

async function logChanges(client, person, changes) {
  if (!changes || !changes.length) return;
  /* ONE STATEMENT, NOT ONE PER CHANGE (§195). A save's whole cost is the
     number of times it has to wait for the database, and a plan import
     produces a change per unit — so this loop was quietly adding a network
     crossing each. The rows are the same rows, in the same order. */
  try {
    const vals = [], params = [];
    changes.forEach(function (ch, i) {
      const rows = ch.rows && ch.rows.length
        ? { count: ch.rows.length, moved: ch.rows.slice(0, LOG_ROW_CAP) }
        : null;
      const b = i * 6;
      vals.push("($" + (b+1) + ",$" + (b+2) + ",$" + (b+3) + ",$" + (b+4) + ",$" + (b+5) + ",$" + (b+6) + ")");
      params.push(person.key, person.name || null, ch.kind, ch.target, ch.what,
                  rows ? JSON.stringify(rows) : null);
    });
    await client.query(
      "INSERT INTO change_log (person_key, person_name, kind, target, what, rows_) VALUES " +
      vals.join(","), params);
  } catch (e) {
    /* A log that cannot be written must not lose a save that already landed.
       It is reported to the function's own output, where it is visible. */
    console.error("change_log write failed:", e.message);
  }
}

module.exports = async function handler(req, res) {
  let client;
  try {
    client = await getPool().connect();
    const ready = await ensureReady(client);

    /* Since v2.1 the state is for signed-in people only (§19). Phase 1
       enforces WHO at the door; per-action WHAT enforcement is Phase 2 and
       recorded as such. */
    const person = await auth.getSession(client, req);
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
      const state = await readState(client);
      return send(res, 200, { ok: true, seeded: ready.seeded, person: person, state: state });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
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

      /* ── VIEWING AS SOMEBODY IS JUDGED AS SOMEBODY (§185) ────────────
         Islam: *"Hala got this error, when I view as her I didn't get it."*
         The screen drew her view and the save was checked against the SMO's
         rights, so no refusal she meets could ever be reproduced — and the
         office could write through her view what she could never write.

         THE RULE IS IN `lib/rules.js`, not here (§42): who may act as whom is
         exactly the kind of question that must have one answer and be
         testable without a database. It can only narrow — the gate is the
         SEAT ROLE ON THE SESSION, the same fact that draws the switcher, so a
         session that cannot simulate is judged as itself exactly as before
         and a forged `viewAs` buys nothing. The simulated person is looked up
         in the STORED people, never taken from the incoming state. */
      const act = R.actingFor(me, body && body.viewAs, person.role, stored.people);
      if (act.refuse) {
        return send(res, 403, { ok: false, refused: true, error: act.refuse,
                                refusals: [act.refuse], refusedChanges: [],
                                undoable: false });
      }
      const acting = act.person;

      const verdict = authorize(stored, state, acting);
      if (!verdict.ok) {
        /* §184: SAY WHICH ROWS, NOT ONLY WHY. `refusals` is unchanged and
           still carries the sentences §171's banner reads. `refusedChanges`
           is the address of every field the verdict would not take, with the
           value it HELD — so the platform can put back exactly those and
           save the rest, instead of offering nothing but "discard
           everything". `undoable` is the server's own answer to "is every
           refusal addressable", because a client that worked it out for
           itself would be a second copy of that rule (§42). */
        const undoable = verdict.refused.length > 0 &&
          verdict.refused.every(function (r) { return r.rows && r.rows.length; });
        return send(res, 403, { ok: false, refused: true,
                                error: verdict.refusals.join(" "),
                                refusals: verdict.refusals,
                                refusedChanges: verdict.refused,
                                undoable: undoable,
                                /* §185: AND WHO IT WAS JUDGED AS, when that is
                                   not you. "Setup is the SMO's" is a baffling
                                   thing to read when you ARE the SMO; the
                                   banner needs the missing half of the
                                   sentence, and only the server knows it. */
                                judgedAs: acting.key === me.key ? null
                                  : { key: acting.key, name: acting.name || acting.key } });
      }

      await writeState(client, state);
      /* Logged AFTER the write and outside its transaction on purpose: a log
         entry for a save that did not land is worse than a missing one. */
      /* THE LOG NAMES WHO SIGNED IN, NEVER THE SIMULATION (§185). The save
         was AUTHORISED as the person being viewed — that is the fix — but it
         was MADE by whoever is at the keyboard, and a change log that named
         the simulation would be a log that cannot answer "who moved this". */
      await logChanges(client, me, verdict.changes);
      return send(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "method not allowed" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500, { ok: false, error: safeError(e) });
  } finally {
    if (client) client.release();
  }
};
