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
const { writeState, writeStateIncremental, readState, ensureReady } = io;
const auth = require("../lib/auth.js");
const { authorize } = require("../lib/authorize.js");
const R = require("../lib/rules.js");
const D = require("../lib/graph-diff.js");

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

/* ── SAVES TAKE TURNS (2026-09-01 concurrency safety) ────────────────────────
   A save is a read-modify-write: read the stored graph, lay this client's
   changes over it (§210), write the result. There was no lock around those
   three steps, so two saves that OVERLAP both read the same starting state
   before either writes — and the second write silently overwrote the first's
   change (a lost update). §210's diff shrank the envelope and made refusals
   accurate; it did NOT close this, because the server still writes the whole
   applied graph, so the later writer clobbers the earlier one's row. The window
   is milliseconds, but it opens exactly when many people save at once — a
   reporting deadline — and the loss is silent.

   A TRANSACTION-SCOPED advisory lock serialises the read-modify-write: the
   whole thing runs in one transaction (below), the lock is taken at the top of
   it, and the second save blocks until the first COMMITs — then reads the
   first's result and merges onto it. Nobody is lost.

   IT MUST BE TRANSACTION-SCOPED, not session-scoped: production is Neon behind
   PgBouncer transaction pooling, where a session lock can sit on a backend the
   next statement never sees. `pg_advisory_xact_lock` lives and dies with the
   transaction, on the one backend the transaction is pinned to, so it is the
   only kind that holds up there.

   THE KEY IS ITS OWN, distinct from ensureReady's schema lock, so the two
   never contend. Only the POST path takes it — a GET read needs no lock
   (writeState's transaction makes a concurrent read see all-old or all-new,
   never a torn half). The cost is that concurrent saves queue for well under a
   second each; they were already partly serialised by writeState's TRUNCATE.

   SMP_NO_SAVE_LOCK=1 disables it, so the test can show the loss it prevents. */
const SAVE_LOCK = 420043;
const USE_SAVE_LOCK = process.env.SMP_NO_SAVE_LOCK !== "1";

/* ── WRITE ONLY WHAT CHANGED — OFF BY DEFAULT (2026-09-01, dark) ──────────────
   When SMP_INCREMENTAL_WRITE=1, a save that arrives as a change list is written
   by rewriting only the subjects that changed (lib/state-io.js), instead of
   rewriting all 31 tables. It falls back to the full rewrite for any shape it
   does not handle, so turning it on can never write a wrong result — only a
   faster one. Proved byte-identical to the full rewrite by
   scripts/test-incremental-write.js. Left OFF so the deploy changes nothing;
   flip the env var to test on a real deployment, after a cycle closes. */
const USE_INCREMENTAL = process.env.SMP_INCREMENTAL_WRITE === "1";

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
      /* §256: A LIGHT LOOK AT change_log, for the save-safety banner. While a
         tab is open on a page the platform asks whether anybody ELSE landed a
         change on that page since it loaded — never the whole graph (§98: a
         poll is paid for in database round trips). Answered from the log the
         save already writes (§42), the asker excluded, oldest first so the
         client can remember the newest it has seen. The target is compared
         exactly as the log stores it ("mobile", "fn:cf"). An unparseable
         `since` falls through to the ordinary read rather than to a 500. */
      let q = null;
      try { q = new URL(req.url, "http://x").searchParams; } catch (e) {}
      const since = q && q.get("since"), target = q && q.get("target");
      if (since && target && !isNaN(Date.parse(since))) {
        const r = await client.query(
          "SELECT person_key AS by_key, person_name AS by, at FROM change_log " +
          "WHERE target = $1 AND at > $2::timestamptz AND person_key <> $3 " +
          "ORDER BY at ASC LIMIT 50", [target, since, person.key]);
        return send(res, 200, { ok: true, changed: r.rows.map(function (x) {
          return { by: x.by || x.by_key, at: x.at }; }) });
      }
      const state = await readState(client);
      return send(res, 200, { ok: true, seeded: ready.seeded, person: person, state: state });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      /* ── WHAT CHANGED, APPLIED ONTO OUR OWN COPY (§210) ──────────────
         Islam: *"why is the whole plan is sent, why don't we just send the
         changed element only not to cause this issue?"*

         Until now this took the client's whole graph and wrote it, throwing
         away whatever the database held — so a tab that had been open a
         while silently erased everybody else's saved work (measured against
         a real Postgres), and work done before a view switch rode into a
         save under the wrong identity and was refused naming parts nobody
         had touched (§204).

         A client now sends only the parts it changed and they are applied
         ONTO THE STORED GRAPH, a few lines below where `stored` is read.
         Everything downstream is untouched: the authoriser still compares a
         stored graph with an incoming one, and `writeState` still writes a
         whole graph. Only the way `incoming` is arrived at has changed, and
         that was the whole of the fault.

         THE WHOLE-GRAPH PATH STAYS, for exactly one reason: tabs that are
         open right now are running the previous build and will go on posting
         `{state}` until somebody reloads them. Refusing those would turn a
         data-safety fix into an outage for everybody mid-sentence. They keep
         the old behaviour — including its exposure — until they reload, which
         §208's sign-out makes short work of. */
      const changes = body && body.changes;
      let state = body && body.state;
      if (!changes && (!state || !state.group || !state.units ||
                       !Array.isArray(state.unitKeys) || !state.unitKeys.length)) {
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
      /* ── THE READ-MODIFY-WRITE IS ONE TRANSACTION, UNDER ONE LOCK ────
         Read the stored graph, lay this client's changes over it (§210),
         authorise, write — all inside a single transaction, with a
         transaction-scoped advisory lock taken at the top of it. The lock is
         held for the life of the transaction and released automatically on
         COMMIT or ROLLBACK: the only kind that is reliable behind PgBouncer/
         Neon transaction pooling, where a session lock could sit on a backend
         the next statement never sees. So a second concurrent save blocks here
         until the first COMMITs, then reads the first's result and merges onto
         it — nobody is silently overwritten. */
      await client.query("BEGIN");
      let out = null;                    /* { code, obj } to send, or null on success */
      let logWho = null, logList = null, wrotePath = null;
      try {
        if (USE_SAVE_LOCK) await client.query("SELECT pg_advisory_xact_lock($1)", [SAVE_LOCK]);
        const stored = await readState(client);
        const me = (stored.people || []).filter(function (p) { return p.key === person.key; })[0]
                || { key: person.key, name: person.name };

        /* WHO IT IS JUDGED AS (§185): the SEAT role on the session may act as a
           colleague (view-as), never wider; the simulated person is looked up
           in the STORED people, never trusted from the incoming state. */
        const act = R.actingFor(me, body && body.viewAs, person.role, stored.people);
        if (act.refuse) {
          out = { code: 403, obj: { ok: false, refused: true, error: act.refuse,
                                    refusals: [act.refuse], refusedChanges: [], undoable: false } };
        } else {
          const acting = act.person;
          /* §210: the incoming graph is the STORED one with this client's
             changes laid over it — anything they did not touch is what the
             database holds RIGHT NOW (this read is under the lock), not what
             their tab was showing. */
          if (changes) {
            const applied = D.applyChanges(JSON.parse(JSON.stringify(stored)), changes);
            if (!applied.ok) out = { code: 400, obj: { ok: false, error: applied.error } };
            else state = applied.state;
          }
          if (!out) {
            const verdict = authorize(stored, state, acting);
            if (!verdict.ok) {
              /* §184: say WHICH rows, not only why, so the banner can put back
                 exactly those and save the rest; §185: and who it was judged
                 as, when that is not you. */
              const undoable = verdict.refused.length > 0 &&
                verdict.refused.every(function (r) { return r.rows && r.rows.length; });
              out = { code: 403, obj: { ok: false, refused: true,
                        error: verdict.refusals.join(" "), refusals: verdict.refusals,
                        refusedChanges: verdict.refused, undoable: undoable,
                        judgedAs: acting.key === me.key ? null
                          : { key: acting.key, name: acting.name || acting.key } } };
            } else {
              /* In OUR transaction — writeState must not open or close its own
                 (see lib/state-io.js), or the lock would release mid-write.
                 When the incremental writer is on and handles this change shape
                 it writes only the changed subjects; otherwise (or when off) the
                 full rewrite runs, exactly as before. */
              let wrote = false;
              if (USE_INCREMENTAL && changes) {
                wrote = await writeStateIncremental(client, state, changes);
              }
              if (!wrote) await writeState(client, state, { inTransaction: true });
              wrotePath = wrote ? "incremental" : "full";
              logWho = me; logList = verdict.changes;
            }
          }
        }
        if (out) await client.query("ROLLBACK");
        else await client.query("COMMIT");
      } catch (e) {
        try { await client.query("ROLLBACK"); } catch (e2) {}
        throw e;
      }
      if (out) return send(res, out.code, out.obj);
      /* Logged AFTER the commit, outside the transaction on purpose (§185): a
         log entry for a save that did not land is worse than a missing one,
         and it names who SIGNED IN, never the simulation. */
      await logChanges(client, logWho, logList);
      /* Diagnostic (§241): report which writer ran, so a save can be seen to
         have gone bit-by-bit (incremental) or the full rewrite (full) — read in
         the browser Network tab's Response, and in Vercel's runtime logs. */
      console.log("[save]", wrotePath);
      return send(res, 200, { ok: true, wrote: wrotePath });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "method not allowed" });
  } catch (e) {
    return send(res, e.code === "NO_DB" ? 503 : 500, { ok: false, error: safeError(e) });
  } finally {
    if (client) client.release();
  }
};
