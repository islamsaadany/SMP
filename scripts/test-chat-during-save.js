/* ══ THE CHAT DOES NOT WAIT ON A SAVE (§282) ═══════════════════════════

   Islam, twice in two days: "all conversations are gone!!", and then "before
   the fix all the chats disappeared", with §231.4's card reading "The server
   did not answer (no answer)" — which is `post()`'s own 25-second clock
   giving up, not a crash and not a 500.

   MEASURED, NOT GUESSED. A save that rewrites the whole graph clears its 33
   tables, and it cleared them with `TRUNCATE ... CASCADE`, which takes an
   ACCESS EXCLUSIVE lock on every one of them for the whole of §240's
   transaction. The chat's queue LEFT JOINed `people` for a live name — so
   while such a save was running, anywhere in the tenant, the conversation
   list was not slow, it was frozen, and it stayed frozen until it committed.

   WHICH SAVES THOSE ARE, SAID EXACTLY, or this file models something the
   product rarely does: §241's incremental writer is LIVE on production
   (SMP_INCREMENTAL_WRITE=1, since 2026-09-03) and rewrites only the subjects
   that changed, with per-subject deletes that take ROW EXCLUSIVE and never
   blocked a reader. So a plain field edit does NOT come here. What falls back
   to the whole-graph clear is every settings, register, reorder and
   add/remove change, and every whole-graph post from a tab on an older build
   — which a new build produces across the entire tenant at once, and is
   exactly when the chat was reported dying.

   THIS FILE MODELS THAT FALLBACK, and does it by holding the clear open
   directly rather than by calling the writer, because what is under test is a
   LOCK and not a code path (§100.3).

   THIS FILE HOLDS A SAVE OPEN AND ASKS THE CHAT ITS QUESTIONS. It drives
   the REAL handler against a REAL Postgres, because the whole fault is a
   lock and a lock cannot be modelled by a stub (§100.3).

   AND ITS FIRST VERSION LOCKED `people` AND NOTHING ELSE, WHICH IS WHY IT
   PASSED ON THE FAULT IT EXISTS TO CATCH (§288). A save does not truncate
   one table, it truncates ALL 33 — `org` among them — and `chatSettings()`
   reads `org` on EVERY request before it reaches any action at all. So the
   conversation list was fixed and the door in front of it was left open, and
   Islam went on seeing "Looking…" and "the server did not answer". §100.3
   from the inside: a stand-in that models LESS than the thing it stands in
   for reports a broken build as working.

   THE LIST IS READ OUT OF `lib/state-io.js`, NEVER COPIED (§283's rule): a
   table added to the save tomorrow is locked here that day, and a list that
   moves breaks this file loudly rather than quietly narrowing what it tests.

   PROVED ABLE TO FAIL (§94.5), TWO WAYS, AND NEITHER IS A SWITCH IN THE
   PRODUCT — both make THIS FILE behave as the product used to, so a red run
   is the shape it actually had rather than a fiction about it:

     SMP_SAVE_TRUNCATE=1     clear the way a save cleared before §288, with
                             TRUNCATE. Every door below goes red.
     SMP_CHAT_JOIN_PEOPLE=1  ask the pre-§282 queue question, which joined
                             the register for a live name.

   THE SECOND NO LONGER GOES RED ON ITS OWN, and that is the point rather
   than a gap: with the clear taking ROW EXCLUSIVE instead of ACCESS
   EXCLUSIVE, even the old joined query answers. §282's reader fix is right
   and is now belt to §288's braces — so the two levers are used TOGETHER to
   show the original fault whole.

     DATABASE_URL=postgres://… node scripts/test-chat-during-save.js
*/
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

/* WHAT A SAVE ACTUALLY LOCKS, read from the writer rather than kept here. */
const ALL_TABLES = (function () {
  const src = fs.readFileSync(path.join(__dirname, "..", "lib", "state-io.js"), "utf8");
  const m = src.match(/const ALL_TABLES = \[([\s\S]*?)\];/);
  if (!m) {
    console.error("could not read ALL_TABLES out of lib/state-io.js — the list moved,");
    console.error("and this file must lock what a save locks or it tests nothing.");
    process.exit(2);
  }
  const names = m[1].match(/"[a-z_]+"/g).map(function (q) { return q.slice(1, -1); });
  if (names.length < 20) { console.error("ALL_TABLES read back too short: " + names.length); process.exit(2); }
  return names;
})();

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
  /* THE WHOLE LIST, exactly as writeState() clears it (§288). Locking
     `people` alone is what let this file go green over a frozen endpoint. */
  if (process.env.SMP_SAVE_TRUNCATE === "1") {
    await saver.query("TRUNCATE " + ALL_TABLES.join(", ") + " CASCADE");
  } else {
    for (const t of ALL_TABLES) await saver.query("DELETE FROM " + t);
  }

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

  /* ── AND THE THREE DOORS IN FRONT OF EVERY ACTION (§288) ───────────
     §282 fixed the conversation list and these were left standing, which is
     why Islam went on seeing "Looking…" and "the server did not answer"
     after it shipped. None of them belongs to the chat: `getSession` sits in
     front of every authenticated request in the product, and every one of
     them reads a table the clear holds. */
  const sess = await ask("session",
    "SELECT s.person_key, p.name, p.role FROM sessions s " +
    "JOIN people p ON p.key = s.person_key " +
    "LEFT JOIN credentials c ON c.person_key = s.person_key " +
    "WHERE s.expires_at > now() LIMIT 1");
  ok("the session is resolved — the door in front of EVERY request", sess.answered,
     sess.frozen ? "frozen for " + sess.ms + "ms" : sess.why || (sess.ms + "ms"));

  const set = await ask("settings", "SELECT extra FROM org WHERE id = 1");
  ok("the chat's settings are read", set.answered,
     set.frozen ? "frozen for " + set.ms + "ms" : set.why || (set.ms + "ms"));

  /* AND THE REGISTER READS, WHICH REVERSES THIS FILE'S OWN ASSERTION AND IS
     REWRITTEN RATHER THAN DELETED (§218). Under §282 the honest claim was
     that it must REFUSE quickly rather than hang, because a truncate made it
     genuinely unreadable; with the clear taking ROW EXCLUSIVE it is readable
     throughout, and a save no longer costs anybody the register. */
  const reg = await ask("register", "SELECT key, name FROM people");
  ok("the register reads, rather than merely refusing quickly", reg.answered,
     reg.frozen ? "frozen for " + reg.ms + "ms" : (reg.refused ? "refused in " + reg.ms + "ms"
                                                              : "answered in " + reg.ms + "ms"));

  /* AND SO DOES THE PLAN — nothing about this is particular to the chat. */
  const plan = await ask("plan", "SELECT id, name FROM pillars LIMIT 5");
  ok("a unit's plan reads while a save is running", plan.answered,
     plan.frozen ? "frozen for " + plan.ms + "ms" : plan.why || (plan.ms + "ms"));

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
