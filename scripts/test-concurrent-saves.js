/* ── SAVES TAKE TURNS (2026-09-01 concurrency safety) ────────────────────────
   The scenario that silently loses work at a busy moment: several people save
   at the SAME instant. Each save is read-modify-write, and without a lock they
   all read the same starting state before any writes, so every writer but the
   last overwrites the others (a lost update).

   This drives the REAL api/state.js handler — the real reader, authoriser,
   change-applier, writer AND the advisory lock — with N genuinely concurrent
   saves, each changing a DIFFERENT unit's aspiration from ONE shared baseline,
   and asserts EVERY change survives.

   PROVED ABLE TO FAIL: run the dev process with SMP_NO_SAVE_LOCK=1 and the
   lock is off — the old behaviour — and all but one change is lost. The runner
   (test-concurrent-saves.sh) runs it both ways.

   Needs a database. No browser, no HTTP server: the handler is called directly
   with a mock req/res, which is the most faithful test of the lock short of
   two real browsers. */
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { Pool } = require(path.join(ROOT, "node_modules/pg"));
const io = require(path.join(ROOT, "lib/state-io.js"));
const D = require(path.join(ROOT, "lib/graph-diff.js"));
const auth = require(path.join(ROOT, "lib/auth.js"));
const handler = require(path.join(ROOT, "api/state.js"));

const clone = o => JSON.parse(JSON.stringify(o));
const N = 8;                       /* concurrent savers, each on its own unit */

/* A mock response that captures status and JSON body and resolves a promise. */
function mockRes() {
  let resolve;
  const done = new Promise(r => (resolve = r));
  const res = {
    statusCode: 200,
    setHeader() {},
    end(body) { this._body = body; resolve({ status: this.statusCode, body: body }); },
    done,
  };
  return res;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 12 });
  let fail = 0;
  const check = (w, ok, x) => {
    console.log((ok ? "  ok    " : "  FAIL  ") + w + (ok || !x ? "" : "  — " + x));
    if (!ok) fail++;
  };
  const c = await pool.connect();
  try {
    io.forgetReady();
    await io.ensureReady(c);
    /* The bootstrap SMO is a real super-user person; clear must_change so its
       session is usable, and mint a session token for the cookie. */
    await c.query("UPDATE credentials SET must_change = false WHERE person_key = 'smo'");
    const token = await auth.createSession(c, "smo");
    const cookie = "smp_session=" + token;

    const baseline = await io.readState(c);
    const units = baseline.unitKeys.slice(0, N);
    check("the seed has at least " + N + " units to test with", units.length === N,
          "only " + units.length);

    /* One shared baseline, N different single-field changes — exactly the
       overlapping-saves shape. Each is posted as a §210 change list. */
    const bodies = units.map(k => {
      const screen = clone(baseline);
      screen.units[k].aspiration = "CONCURRENT-" + k;
      return { changes: D.graphChanges(baseline, screen) };
    });

    const calls = bodies.map(body => {
      const req = { method: "POST",
        headers: { cookie: cookie, "content-type": "application/json" },
        body: body, on() {} };
      const res = mockRes();
      handler(req, res);            /* fire; do not await individually */
      return res.done;
    });
    const results = await Promise.all(calls);

    const accepted = results.filter(r => r.status === 200).length;
    check("every concurrent save was accepted (" + accepted + "/" + N + ")", accepted === N,
          results.filter(r => r.status !== 200).map(r => r.status + " " + r.body).join(" | "));

    /* THE POINT: read the final stored state and confirm NONE was lost. */
    const after = await io.readState(c);
    const survived = units.filter(k => after.units[k].aspiration === "CONCURRENT-" + k);
    const lost = units.filter(k => after.units[k].aspiration !== "CONCURRENT-" + k);
    check("all " + N + " concurrent changes survived (none lost)", survived.length === N,
          "lost " + lost.length + ": " + lost.join(", "));

    if (process.env.SMP_NO_SAVE_LOCK === "1") {
      console.log("\n  (lock OFF: " + lost.length + " of " + N +
                  " lost — this is the data loss the lock prevents)");
    }
  } finally {
    c.release();
    await pool.end();
  }
  console.log(fail ? "\nCONCURRENT-SAVES FAILED" : "\nCONCURRENT-SAVES OK — no save lost");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
