/* Two cold starts, one new migration, a pooled connection (§289).

   THE FAULT: ensureReadyOnce took a SESSION advisory lock and then ran the
   migrations as separate statements. Neon's pooled endpoint (PgBouncer,
   transaction mode) may run every statement outside a transaction on a
   different backend, so the lock is taken on one backend and the work runs on
   another — it holds nothing. A deploy carrying a new migration file reloads
   every open tab (the version banner) and starts several instances cold at
   once; two of them both run the migration and the second's INSERT into the
   registry hits the primary key. api/auth catches it and the sign-in page
   says "Something went wrong. Try again, and tell the SMO if it keeps
   happening." Islam saw it twice in one day, once per deploy.

   THE POOLER IS MODELLED, NOT ASSUMED (§100.3): this runs against a direct
   Postgres, where a session lock WOULD hold, so each client is wrapped to
   behave the way the pooler does — any session state acquired by a statement
   outside a transaction is gone by the next statement. Inside BEGIN … COMMIT
   nothing is touched, because a transaction pins one backend there too. That
   is exactly the difference the fix relies on, so it is exactly what the
   model has to reproduce.

   Proved able to fail: with SMP_STATE_IO pointed at the pre-§289 module this
   reports one cold start refused with 23505 on _sql_migrations_pkey.

     DATABASE_URL=postgres://… node scripts/test-cold-starts.js */
const pg = require("pg");
const io = require(process.env.SMP_STATE_IO || "../lib/state-io.js");
const MIG = "040-a-reply-that-was-never-told.sql";
let fails = 0;
function ok(cond, what) { console.log((cond ? "ok   " : "FAIL ") + what); if (!cond) fails++; }

/* The pooler model: session state does not survive an autocommit statement. */
function pooled(client) {
  const raw = client.query.bind(client);
  let inTxn = false;
  client.query = async function (sql, params) {
    const word = typeof sql === "string" ? (sql.trim().split(/\s+/)[0] || "").toUpperCase() : "";
    const r = await raw(sql, params);
    if (word === "BEGIN") inTxn = true;
    else if (word === "COMMIT" || word === "ROLLBACK") inTxn = false;
    if (!inTxn) await raw("SELECT pg_advisory_unlock_all()");
    return r;
  };
  return client;
}

async function coldStart(pool) {
  const c = pooled(await pool.connect());
  io.forgetReady();
  const p = io.ensureReady(c).then(function () { return { ok: true }; },
                                  function (e) { return { ok: false, code: e.code, message: e.message }; });
  const r = await p;
  c.release();
  return r;
}

(async function () {
  const pool = io.getPool(pg);
  const c0 = await pool.connect();
  await io.ensureReady(c0);                                   /* the tenant as it stands */
  await c0.query("DELETE FROM _sql_migrations WHERE name = $1", [MIG]);   /* a deploy carrying a new file */
  c0.release();

  /* §1 — two instances start cold in the same second. */
  const [a, b] = await Promise.all([coldStart(pool), coldStart(pool)]);
  for (const r of [a, b]) {
    ok(r.ok, "a cold start bootstraps cleanly" + (r.ok ? "" : " — " + r.code + " " + r.message));
  }
  const c1 = await pool.connect();
  const n = (await c1.query("SELECT count(*)::int AS n FROM _sql_migrations WHERE name = $1", [MIG])).rows[0].n;
  ok(n === 1, "the migration is recorded exactly once (" + n + ")");
  const col = (await c1.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'chase_html'")).rowCount;
  ok(col === 1, "and what it adds is there");

  /* §2 — the door still opens: the bootstrap credential survives both. */
  const cred = (await c1.query("SELECT 1 FROM credentials WHERE person_key = 'smo'")).rowCount;
  ok(cred === 1, "the SMO's credential is intact");

  /* §3 — with nothing new to apply, two cold starts are still fine (control). */
  const [d, e] = await Promise.all([coldStart(pool), coldStart(pool)]);
  ok(d.ok && e.ok, "two cold starts with nothing to migrate both bootstrap");

  /* §4 — a bootstrap that fails leaves no half-applied migration behind. */
  await c1.query("DELETE FROM _sql_migrations WHERE name = $1", [MIG]);
  await c1.query("ALTER TABLE chat_messages RENAME TO chat_messages_gone");
  const f = await coldStart(pool);
  ok(!f.ok, "a migration that cannot run fails the bootstrap loudly");
  const n2 = (await c1.query("SELECT count(*)::int AS n FROM _sql_migrations WHERE name = $1", [MIG])).rows[0].n;
  ok(n2 === 0, "and records nothing for it (" + n2 + ")");
  await c1.query("ALTER TABLE chat_messages_gone RENAME TO chat_messages");
  const g = await coldStart(pool);
  ok(g.ok, "the next boot applies it (a failed bootstrap is not remembered)");
  c1.release();
  await pool.end();
  console.log(fails ? fails + " FAILED" : "all cold-start checks passed");
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error("harness:", e); process.exit(2); });
