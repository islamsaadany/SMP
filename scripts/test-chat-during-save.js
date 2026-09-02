/* ══ THE CHAT DOES NOT WAIT ON A SAVE (§248) ═══════════════════════════

   Islam, twice in two days: "all conversations are gone!!", and then "before
   the fix all the chats disappeared", with §231.4's card reading "The server
   did not answer (no answer)" — which is `post()`'s own 25-second clock
   giving up, not a crash and not a 500.

   MEASURED, NOT GUESSED. A save clears and rewrites the state graph's 33
   tables with `TRUNCATE ... CASCADE`, and TRUNCATE takes an ACCESS EXCLUSIVE
   lock on `people` for the whole of §240's transaction. The chat's queue
   LEFT JOINed `people` for a live name — so while ANY save was running,
   anywhere in the tenant, the conversation list was not slow, it was frozen,
   and it stayed frozen until the save committed.

   THIS FILE HOLDS A SAVE OPEN AND ASKS THE CHAT ITS THREE QUESTIONS. It
   drives the REAL handler against a REAL Postgres, because the whole fault
   is a lock and a lock cannot be modelled by a stub (§100.3).

   PROVED ABLE TO FAIL (§94.5): `SMP_CHAT_JOIN_PEOPLE=1` is not a switch in
   the product — there is no such branch in `api/chat.js` — it makes THIS FILE
   ask the pre-§248 question directly, so the red run is the shape the
   product actually had rather than a fiction about it.

     DATABASE_URL=postgres://… node scripts/test-chat-during-save.js
*/
const { Client } = require("pg");

const URL = process.env.DATABASE_URL;
if (!URL) { console.error("DATABASE_URL is required — this cannot be stubbed."); process.exit(2); }

let pass = 0, fail = 0;
function ok(what, cond, detail) {
  if (cond) { pass++; console.log("  ok   " + what + (detail ? "  (" + detail + ")" : "")); }
  else { fail++; console.log("  FAIL " + what + (detail ? "  (" + detail + ")" : "")); }
}

/* The old query, kept HERE and nowhere else, so the red run is honest. */
const OLD_QUEUE =
  "SELECT t.person_key, t.person_name, p.name AS live_name, (p.key IS NULL) AS gone " +
  "FROM chat_threads t LEFT JOIN people p ON p.key = t.person_key " +
  "ORDER BY t.waiting DESC, t.last_at DESC LIMIT 300";

const NEW_QUEUE =
  "SELECT t.person_key, t.person_name, t.waiting, t.last_at FROM chat_threads t " +
  "ORDER BY t.waiting DESC, t.last_at DESC LIMIT 300";

const CAP = 6000;                       /* well inside the corner's 25s clock */

async function ask(label, sql, args) {
  const c = new Client({ connectionString: URL });
  await c.connect();
  try { await c.query("SET lock_timeout = '2s'"); } catch (e) {}
  const t0 = Date.now();
  const out = await Promise.race([
    c.query(sql, args || []).then(
      (r) => ({ answered: true, ms: Date.now() - t0, rows: r.rows }),
      (e) => ({ answered: false, refused: true, ms: Date.now() - t0, why: e.message })),
    new Promise((r) => setTimeout(() => r({ answered: false, frozen: true, ms: CAP }), CAP))
  ]);
  c.end().catch(() => {});
  return out;
}

(async () => {
  const setup = new Client({ connectionString: URL });
  await setup.connect();
  await setup.query(
    "INSERT INTO chat_threads (person_key, person_name, waiting, started_at, last_at) " +
    "VALUES ('ashraf','Ashraf Laithy',true,now(),now()) " +
    "ON CONFLICT (person_key) DO UPDATE SET person_name = EXCLUDED.person_name");
  await setup.query(
    "INSERT INTO chat_messages (person_key, by_key, body, from_office, at) " +
    "VALUES ('ashraf','ashraf','The Q3 target still reads 4.2M.',false,now())");

  /* ── A SAVE, HELD OPEN, EXACTLY AS §240 RUNS IT ──────────────────── */
  const saver = new Client({ connectionString: URL });
  await saver.connect();
  await saver.query("BEGIN");
  await saver.query("SELECT pg_advisory_xact_lock(918273645)");
  await saver.query("TRUNCATE people CASCADE");

  console.log("\nWITH A SAVE IN FLIGHT — the state that made the chats vanish.");

  if (process.env.SMP_CHAT_JOIN_PEOPLE === "1") {
    const old = await ask("old", OLD_QUEUE);
    ok("the conversation list answers", old.answered,
       old.frozen ? "frozen for " + old.ms + "ms" : old.why || (old.ms + "ms"));
  } else {
    const q = await ask("queue", NEW_QUEUE);
    ok("the conversation list answers", q.answered,
       q.frozen ? "frozen for " + q.ms + "ms" : q.why || (q.ms + "ms"));
    ok("...and it carries the conversations, not an empty list",
       q.answered && q.rows.length > 0, q.answered ? q.rows.length + " found" : "never answered");
    ok("...each with a name to draw",
       q.answered && q.rows.every((r) => !!(r.person_name || r.person_key)));
  }

  const m = await ask("messages",
    "SELECT id, body FROM chat_messages WHERE person_key = $1 ORDER BY at, id", ["ashraf"]);
  ok("the messages in a conversation answer", m.answered,
     m.frozen ? "frozen for " + m.ms + "ms" : m.ms + "ms");

  const t = await ask("thread", "SELECT * FROM chat_threads WHERE person_key = $1", ["ashraf"]);
  ok("opening a conversation answers", t.answered,
     t.frozen ? "frozen for " + t.ms + "ms" : t.ms + "ms");

  /* AND THE REGISTER IS THE ONE THING THAT LEGITIMATELY CANNOT BE READ —
     it must REFUSE quickly rather than hang, or the backstop is not a
     backstop. A refusal here is the correct outcome, not a failure. */
  const reg = await ask("register", "SELECT key, name FROM people");
  ok("the register refuses quickly rather than hanging", !reg.frozen,
     reg.frozen ? "frozen for " + reg.ms + "ms" : (reg.refused ? "refused in " + reg.ms + "ms"
                                                              : "answered in " + reg.ms + "ms"));

  /* ── AND THE SAVE COMMITS ─────────────────────────────────────────── */
  await saver.query("ROLLBACK");
  await saver.end();

  console.log("\nAND ONCE THE SAVE IS DONE, THE LIVE NAMES ARE BACK.");
  const after = await ask("register", "SELECT key, name FROM people LIMIT 5");
  ok("the register reads again", after.answered, after.ms + "ms");
  const q2 = await ask("queue", NEW_QUEUE);
  ok("and so does the list", q2.answered && q2.rows.length > 0);

  await setup.query("DELETE FROM chat_messages WHERE person_key = 'ashraf'");
  await setup.query("DELETE FROM chat_threads WHERE person_key = 'ashraf'");
  await setup.end();

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("ERR", e && e.message); process.exit(1); });
