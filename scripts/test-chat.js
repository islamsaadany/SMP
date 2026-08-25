/* ── WHAT THE CHAT ENDPOINT REFUSES (§95) ─────────────────────────────────
   Run against a dev-server with a database behind it:

     DATABASE_URL=postgres://… node scripts/dev-server.js 3999 &
     DATABASE_URL=postgres://… node scripts/test-chat.js <smo-password>

   THE REFUSALS ARE THE POINT, and they are what a browser drive cannot reach:
   driving the product as the SMO proves the office's own path and proves
   NOTHING about the person who may hold no role at all — §94.2's lesson, that
   a check which only looks for something PRESENT cannot see a door that should
   be shut. So this signs in as a second, ordinary person and tries every one
   of the office's actions with their session.

   It creates that person and their credential DIRECTLY, and removes them
   again: there is no UI path to a password for somebody else that does not go
   through the office, and the point here is to hold a session that is not the
   office's.
   ──────────────────────────────────────────────────────────────────────── */
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

const BASE = process.env.SMP_BASE || "http://127.0.0.1:3999";
const SMO_PW = process.argv[2];
if (!SMO_PW) { console.error("usage: node scripts/test-chat.js <smo-password>"); process.exit(2); }

const OTHER = { key: "chattest", name: "Dalia Chattest", pw: "TestingChat!2026" };
let pass = 0; const fails = [];
function ok(cond, what) { if (cond) { pass++; console.log("  ok   " + what); }
                          else { fails.push(what); console.log("  FAIL " + what); } }

/* A cookie jar of one, because that is all a session is here. */
async function call(cookie, body) {
  const r = await fetch(BASE + "/api/chat", {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" },
                           cookie ? { Cookie: cookie } : {}),
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json().catch(function () { return null; }) };
}
async function signIn(who, password) {
  const r = await fetch(BASE + "/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", user: who, password: password })
  });
  const j = await r.json().catch(function () { return null; });
  const set = r.headers.get("set-cookie") || "";
  return { ok: !!(j && j.ok), cookie: set.split(";")[0], why: j && j.error };
}

(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  let hadSmo = false;
  try {
    await io.ensureReady(client);

    /* ── a second person, with a password and no role at all ───────────── */
    await client.query("DELETE FROM chat_threads WHERE person_key = $1", [OTHER.key]);
    await client.query("DELETE FROM credentials WHERE person_key = $1", [OTHER.key]);
    await client.query("DELETE FROM people WHERE key = $1", [OTHER.key]);
    await client.query(
      "INSERT INTO people (key, idx, name, role, extra) VALUES ($1, 900, $2, '', $3)",
      [OTHER.key, OTHER.name, JSON.stringify({ email: "dalia.chattest@example.com" })]);
    await client.query(
      "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1,$2,false)",
      [OTHER.key, await auth.hashPassword(OTHER.pw)]);
    await client.query("DELETE FROM login_attempts");
    /* A TEST THAT LEAVES STATE BEHIND BREAKS THE NEXT ONE. This writes into the
       office's own conversation on purpose (to prove her thread does not show
       it), so it has to know whether that conversation existed before it ran —
       and put things back either way. Learned by running the browser drive
       straight after this and watching it fail on the first-time state. */
    hadSmo = (await client.query(
      "SELECT 1 FROM chat_threads WHERE person_key = 'smo'")).rowCount > 0;

    const smo = await signIn("SMO", SMO_PW);
    ok(smo.ok, "the SMO signs in" + (smo.ok ? "" : " — " + smo.why));
    const her = await signIn(OTHER.key, OTHER.pw);
    ok(her.ok, "a person with no role signs in" + (her.ok ? "" : " — " + her.why));
    if (!smo.ok || !her.ok) throw new Error("cannot continue without both sessions");

    console.log("\nANYBODY SIGNED IN MAY WRITE — that is the whole point (§71).");
    let r = await call(her.cookie, { action: "say", body: "The Care figure looks wrong to me.",
                                     page: "Care › Performance", cycle: "H1 2026" });
    ok(r.status === 200 && r.body.ok, "somebody with no role can write to the office");
    ok(r.body.messages && r.body.messages.length === 1, "and it comes straight back in their thread");

    console.log("\nAND READS THEIR OWN, AND ONLY THEIR OWN.");
    r = await call(smo.cookie, { action: "say", body: "A note the office wrote to itself." });
    ok(r.status === 200, "the office can write into its own conversation too");
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.messages.length === 1, "her thread still holds one message, not the office's");
    ok(r.body.office === false, "and she is not told she is the office");

    console.log("\nEVERY ONE OF THE OFFICE'S ACTIONS IS REFUSED TO HER.");
    for (const body of [{ action: "queue" },
                        { action: "thread", person: "smo" },
                        { action: "reply", person: "smo", body: "let me in" },
                        { action: "flag", id: 1, flag: "issue" },
                        { action: "answered", person: "smo", waiting: false },
                        { action: "shot", id: 1 },
                        { action: "drop", person: "smo" }]) {
      r = await call(her.cookie, body);
      ok(r.status === 403 && !r.body.ok, "refused: " + body.action);
    }

    console.log("\nAND THE REFUSAL NEVER SAYS WHICH ROLE IS MISSING.");
    r = await call(her.cookie, { action: "queue" });
    ok(!/super|smoteam|smo team/i.test(String(r.body.error)),
       "the sentence does not name the office's roles: " + JSON.stringify(r.body.error));

    console.log("\nTHE OFFICE SEES EVERYBODY.");
    r = await call(smo.cookie, { action: "queue" });
    ok(r.status === 200 && r.body.ok, "the office reads the queue");
    const keys = (r.body.threads || []).map(function (t) { return t.person_key; });
    ok(keys.indexOf(OTHER.key) > -1 && keys.indexOf("smo") > -1,
       "and both conversations are on it: " + JSON.stringify(keys));
    const hers = (r.body.threads || []).filter(function (t) { return t.person_key === OTHER.key; })[0];
    ok(hers && +hers.unread === 1, "with her message counted unread");
    ok(hers && hers.waiting === true, "and her conversation waiting on us");

    console.log("\nPRESENCE IS DECIDED BY POLLING, AND BY NOTHING ELSE (§95.5).");
    /* BOTH SIDES OF THE RULE, and the second one has to be staged: she polled
       a moment ago as part of this run, so the only honest way to ask "and
       what about somebody who has been away?" is to age the row. Asserting
       only the first half would leave the whole email rule untested — a check
       that can only see the state it happens to be in. */
    await call(her.cookie, { action: "mine" });
    r = await call(smo.cookie, { action: "thread", person: OTHER.key });
    ok(r.body.here === true, "having just asked, she is here");

    await client.query(
      "UPDATE chat_threads SET here_at = now() - interval '10 minutes' WHERE person_key = $1",
      [OTHER.key]);
    r = await call(smo.cookie, { action: "thread", person: OTHER.key });
    ok(r.body.here === false, "ten minutes without asking, and she is away");
    ok(r.body.address === "dalia.chattest@example.com", "and her address is resolved on the server");

    console.log("\nA REPLY ANSWERS IT, BY THE ACT (§71).");
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "Looking now." });
    ok(r.status === 200 && r.body.ok, "the office replies");
    ok(r.body.here === false, "the reply agrees she was away");
    /* NO `html` WAS POSTED, so there is nothing to send — and the endpoint
       says nothing went out rather than claiming it did. */
    ok(!r.body.mailed || !r.body.mailed.sent, "and with nothing to send, no mail is claimed");
    r = await call(smo.cookie, { action: "queue" });
    const after = (r.body.threads || []).filter(function (t) { return t.person_key === OTHER.key; })[0];
    ok(after && after.waiting === false, "her conversation left the waiting list on its own");

    console.log("\nAND SHE HAS IT, WITH A NAME ON IT.");
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.messages.length === 2, "the reply is in her thread");
    ok(r.body.unread === 1, "and it counts as one unread");
    ok(r.body.messages[1].from_office === true &&
       String(r.body.messages[1].by_name || "").length > 0,
       "signed by whoever answered: " + JSON.stringify(r.body.messages[1].by_name));
    await call(her.cookie, { action: "seen" });
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.unread === 0, "reading it clears the count");

    console.log("\nWHAT IS REFUSED TO EVERYBODY.");
    r = await call(her.cookie, { action: "say", body: "" });
    ok(r.status === 400, "an empty message is refused");
    r = await call(her.cookie, { action: "say", body: "x", shot: "https://example.com/a.png" });
    ok(r.status === 400, "a picture given as a URL is refused, not fetched");
    r = await call(her.cookie, { action: "say", body: "x", shot: "data:image/png;base64,AAAA" });
    ok(r.status === 200, "a data URI is taken");
    r = await call("", { action: "mine" });
    ok(r.status === 401, "no session, no conversation");

    console.log("\nAND DROPPING ONE IS THE SUPER USER'S ALONE (§89).");
    r = await call(smo.cookie, { action: "drop", person: OTHER.key });
    ok(r.status === 200 && r.body.ok, "the Super user drops a conversation");
    const left = +(await client.query(
      "SELECT count(*) AS n FROM chat_messages WHERE person_key = $1", [OTHER.key])).rows[0].n;
    ok(left === 0, "and it takes its messages with it (CASCADE)");
  } finally {
    await client.query("DELETE FROM chat_threads WHERE person_key = $1", [OTHER.key]).catch(function(){});
    if (!hadSmo) {
      await client.query("DELETE FROM chat_threads WHERE person_key = 'smo'").catch(function(){});
    } else {
      await client.query(
        "DELETE FROM chat_messages WHERE person_key = 'smo' AND body = $1",
        ["A note the office wrote to itself."]).catch(function(){});
    }
    await client.query("DELETE FROM credentials WHERE person_key = $1", [OTHER.key]).catch(function(){});
    await client.query("DELETE FROM people WHERE key = $1", [OTHER.key]).catch(function(){});
    await client.query("DELETE FROM login_attempts").catch(function(){});
    client.release();
    await pool.end();
  }

  console.log("\n" + pass + " passed, " + fails.length + " failed");
  if (fails.length) { fails.forEach(function (f) { console.log("  · " + f); }); process.exit(1); }
})().catch(function (e) { console.error(e); process.exit(1); });
