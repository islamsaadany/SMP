/* ── THE TEN-MINUTE COLLECTION (§293) ─────────────────────────────────────
   Islam, having reported one email per message: *"if the smo don't
   reply in 10 min the email should come and same for them ... sometimes
   people might be at their desk but not focusing"*, and *"the email is sent
   with all the pending conversations, not 1 for each person."*

   SO WHAT IS ASSERTED HERE IS FOUR THINGS AT ONCE, and each of them fails on
   its own if the build gets one wrong: nothing goes out before the time is
   up; ONE email then carries every waiting conversation; only a reply stops
   it on the office's side and only coming back stops it on theirs; and
   presence suppresses nothing.

   THE SWEEP IS NOT A TIMER AND MUST NOT BE TESTED AS ONE. There is no
   scheduler (§97.5) — the send rides somebody's ordinary request — so every
   trial here MAKES a request and then reads what left. Time is moved in the
   database rather than waited for: a check that slept through ten minutes is
   a check nobody runs.

   DRIVEN THROUGH THE REAL HANDLER with a mock req/res against a real
   Postgres, in the shape scripts/test-safety-peek.js uses, and with a
   STAND-IN MAIL SERVICE in front of it (§142.6, §100.3) — `SMP_RESEND_ENDPOINT`
   is a deployment variable, not a branch in lib/mailer.js — so what actually
   left the platform is read off the wire rather than inferred.

   Run: DATABASE_URL=… node scripts/test-chat-chase.js
   ──────────────────────────────────────────────────────────────────────── */
const path = require("path");
const http = require("http");
const ROOT = path.join(__dirname, "..");

/* BEFORE api/chat.js IS REQUIRED. lib/mailer.js reads the endpoint once at
   module load, which is right for a server and means the stand-in has to be
   standing before anything asks. */
const MAIL = [];
const srv = http.createServer(function (req, res) {
  let raw = "";
  req.on("data", function (c) { raw += c; });
  req.on("end", function () {
    let j = null; try { j = JSON.parse(raw); } catch (e) {}
    /* A REFUSAL ON DEMAND (§7 below): a send that fails must buy no silence. */
    if (MAIL.refuse) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "the mail service said no" }));
    }
    MAIL.push(j || {});
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: "mail-" + MAIL.length }));
  });
});

(async () => {
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  process.env.SMP_RESEND_ENDPOINT = "http://127.0.0.1:" + srv.address().port;
  process.env.RESEND_API_KEY = "test-key";
  process.env.SMP_MAIL_FROM = "SMP <smp@example.com>";

  const { Pool } = require(path.join(ROOT, "node_modules/pg"));
  const io = require(path.join(ROOT, "lib/state-io.js"));
  const auth = require(path.join(ROOT, "lib/auth.js"));
  const Rules = require(path.join(ROOT, "lib/rules.js"));
  const handler = require(path.join(ROOT, "api/chat.js"));

  function mockRes() {
    let resolve;
    const done = new Promise(r => (resolve = r));
    return { statusCode: 200, setHeader() {},
             end(body) { resolve({ status: this.statusCode, body: body }); }, done };
  }
  /* A REAL READABLE, because api/chat.js STREAMS its body — it refuses an
     oversized one while it arrives rather than after (§71), so there is no
     `req.body` shortcut to hand an object to, and a stub with an inert `on()`
     simply hangs for ever. A stand-in that models less than the thing it
     stands in for is not a stand-in (§231.5, §100.3). */
  const { Readable } = require("stream");
  /* THE THROTTLE IS PER WARM INSTANCE (§98.1) and this file is one process,
     so without this every trial after the first would find the sweep asleep
     and report a working build as silent. Reset rather than removed: what is
     under test is the sweep, not the interval in front of it. */
  function wakeSweep() {
    try { handler.__resetSweep && handler.__resetSweep(); } catch (e) {}
  }
  async function call(cookie, body) {
    wakeSweep();
    const res = mockRes();
    const req = Readable.from([JSON.stringify(body)]);
    req.method = "POST"; req.url = "/api/chat";
    req.headers = { cookie: cookie, "content-type": "application/json" };
    handler(req, res);
    const r = await res.done;
    let j = null; try { j = JSON.parse(r.body); } catch (e) {}
    return { status: r.status, j: j };
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  let fail = 0;
  const check = (w, ok, x) => {
    console.log((ok ? "  ok    " : "  FAIL  ") + w + (ok || x == null ? "" : "  — " + x));
    if (!ok) fail++;
  };
  const c = await pool.connect();
  try {
    io.forgetReady();
    await io.ensureReady(c);
    await c.query("UPDATE credentials SET must_change = false WHERE person_key = 'smo'");
    /* The office needs an address to be chased at, and the asker one to be
       chased AT — both on the register, because the server resolves every
       address from the stored register and never from a request (§74.2). */
    await c.query(
      "UPDATE people SET extra = COALESCE(extra,'{}'::jsonb) || '{\"email\":\"office@example.com\"}'::jsonb " +
      " WHERE key = 'smo'");
    await c.query(
      "INSERT INTO people (key, idx, name, extra) VALUES " +
      " ('asker', 901, 'Asking Person', '{\"email\":\"asker@example.com\"}'::jsonb) " +
      "ON CONFLICT (key) DO UPDATE SET extra = EXCLUDED.extra, name = EXCLUDED.name");
    /* Chat settings, written where the endpoint reads them (org.extra.chat).
       The assistant stays OFF: it would answer some of these and end the
       waiting spell, and what is under test is what happens while a
       conversation waits. */
    await c.query(
      "UPDATE org SET extra = COALESCE(extra,'{}'::jsonb) || " +
      " '{\"chat\":{\"on\":true,\"notify\":true,\"rep\":\"smo\",\"mail\":true,\"assistant\":false}}'::jsonb " +
      " WHERE id = 1");

    const smo = "smp_session=" + await auth.createSession(c, "smo");
    const her = "smp_session=" + await auth.createSession(c, "asker");
    const say = (t) => call(her, { action: "say", body: t });
    const reply = (t) => call(smo, { action: "reply", person: "asker", body: t,
                                     html: "<p>" + t + "</p>", subject: "A reply" });
    const thread = () => call(smo, { action: "thread", person: "asker" });
    const chased = async () => (await c.query(
      "SELECT chased_at, chased_them_at FROM chat_threads WHERE person_key = 'asker'")).rows[0] || {};
    const toOffice = () => MAIL.filter(m => (m.to || []).indexOf("office@example.com") >= 0);
    const toHer = () => MAIL.filter(m => (m.to || []).indexOf("asker@example.com") >= 0);
    const ageChase = (col, mins) => c.query(
      "UPDATE chat_threads SET " + col + " = now() - ($1 || ' minutes')::interval " +
      " WHERE person_key = 'asker'", [String(mins)]);

    /* THE COLLECTING TIME, SHORTENED SO THE TRIALS CAN MOVE TIME RATHER THAN
       WAIT FOR IT. The rule is asserted at the boundary either side of this
       number, never at ten minutes specifically — a check pinned to the
       shipped default fails the day somebody sets a different one. */
    const MINS = 10;
    /* TIME PASSING MOVES EVERYTHING TOGETHER — the messages AND the marks on
       the conversation. Shifting only the messages backwards puts them BEFORE
       the watermark that says what has been emailed, which is not "ten minutes
       later", it is a different history: the first draft of this file did
       exactly that and reported a working build as silent (§94.5's own lesson,
       from the harness side). */
    const passes = async (mins, key) => {
      const k = key || "asker";
      await c.query("UPDATE chat_messages SET at = at - ($1 || ' minutes')::interval " +
                    " WHERE person_key = $2", [String(mins), k]);
      await c.query("UPDATE chat_threads SET " +
                    "  chased_at      = chased_at      - ($1 || ' minutes')::interval, " +
                    "  chased_them_at = chased_them_at - ($1 || ' minutes')::interval, " +
                    "  here_at        = here_at        - ($1 || ' minutes')::interval " +
                    " WHERE person_key = $2", [String(mins), k]);
    };
    /* A CLEAN CONVERSATION, because each trial below is a different scenario
       and a leftover unemailed reply from the last one sends an email in the
       middle of the next (it did, and it read as a product fault). */
    const reset = async () => {
      await c.query("DELETE FROM chat_messages WHERE person_key = 'asker'");
      await c.query("UPDATE chat_threads SET chased_at = NULL, chased_them_at = NULL, " +
                    "  here_at = NULL, waiting = false WHERE person_key = 'asker'");
      MAIL.length = 0;
    };

    console.log("\n1 · nothing goes out while the collection is still filling");
    for (const t of ["First one", "Second one", "Third one"]) await say(t);
    await call(her, { action: "mine" });   /* a request, so the sweep has run */
    check("three messages, no email yet", toOffice().length === 0, toOffice().length + " emails");
    check("...and nothing was marked as sent", !(await chased()).chased_at);

    console.log("\n2 · when the time is up, ONE email carrying all of it");
    await passes(MINS + 1);
    await call(her, { action: "mine" });
    check("one email", toOffice().length === 1, toOffice().length + " emails");
    const first = toOffice()[0] || {};
    check("...naming the person", /Asking Person/.test(first.subject || ""), first.subject);
    check("...and carrying every message, not just the newest",
          ["First one", "Second one", "Third one"].every(w => (first.html || "").indexOf(w) >= 0));
    check("...and the conversation is marked as said", !!(await chased()).chased_at);

    console.log("\n3 · and it does not go again on its own");
    await passes(MINS + 1);
    await call(her, { action: "mine" });
    check("no second email without something new", toOffice().length === 1,
          toOffice().length + " emails");

    console.log("\n4 · a new message starts a fresh collection");
    await say("Fourth one, next morning");
    await call(her, { action: "mine" });
    check("still nothing while it fills", toOffice().length === 1, toOffice().length + " emails");
    await passes(MINS + 1);
    await call(her, { action: "mine" });
    check("then one more", toOffice().length === 2, toOffice().length + " emails");
    /* READ THROUGH A DEFAULT, because a missing email must be REPORTED and
       not thrown on — a probe that dies prints fewer failures than there are
       and `grep -c FAIL` reads the wrong number (§215). */
    const mail = (i) => toOffice()[i] || {};
    check("...carrying the whole waiting spell, the earlier ones included",
          ["First one", "Fourth one, next morning"].every(w => (mail(1).html || "").indexOf(w) >= 0));

    console.log("\n5 · being at your desk suppresses nothing (§293, his own case)");
    await reset();
    await say("Fifth one, while the office sits there");
    await passes(MINS + 1);
    /* The office is HERE, right now — the state Islam named: at the desk, not
       focusing. Nothing about it may hold the email back. */
    await c.query("UPDATE chat_threads SET here_at = now() WHERE person_key = 'asker'");
    await call(her, { action: "mine" });
    check("the email goes anyway", toOffice().length === 1, toOffice().length + " emails");

    console.log("\n6 · ONE email for every conversation waiting, not one each");
    /* A SECOND PERSON, because "all the pending conversations" cannot be
       measured on a tenant with one (§94.2: the state has to be MADE). */
    await c.query(
      "INSERT INTO people (key, idx, name, extra) VALUES " +
      " ('hend2', 902, 'Second Person', '{\"email\":\"hend2@example.com\"}'::jsonb) " +
      "ON CONFLICT (key) DO UPDATE SET extra = EXCLUDED.extra, name = EXCLUDED.name");
    const him = "smp_session=" + await auth.createSession(c, "hend2");
    await reset();
    await say("From the first person");
    await call(him, { action: "say", body: "From the second person" });
    await passes(MINS + 1); await passes(MINS + 1, "hend2");
    await call(her, { action: "mine" });
    const digest = toOffice()[0] || {};
    check("one email, not two", toOffice().length === 1, toOffice().length + " emails");
    check("...and it names both conversations",
          /Asking Person/.test(digest.html || "") && /Second Person/.test(digest.html || ""),
          (digest.html || "").slice(0, 80));
    check("...with the count in the subject", /2 conversations waiting/.test(digest.subject || ""),
          digest.subject);
    check("...and both are marked, so neither triggers its own email later",
          (await c.query("SELECT count(*)::int AS n FROM chat_threads WHERE chased_at IS NOT NULL"))
            .rows[0].n === 2);

    console.log("\n7 · replying is what stops it");
    await c.query("DELETE FROM chat_messages WHERE person_key = 'hend2'");
    await c.query("DELETE FROM chat_threads WHERE person_key = 'hend2'");
    await reset();
    await say("Something they will answer");
    const rr = await reply("Here is your answer");
    check("the reply is accepted", rr.status === 200, rr.status + " " + JSON.stringify(rr.j));
    await passes(MINS + 1);
    await call(her, { action: "mine" });
    check("no email about an answered conversation", toOffice().length === 0,
          toOffice().length + " emails");

    console.log("\n8 · and the same rule going the other way");
    /* Their side: the office's replies collect, and COMING BACK is what stops
       them — a reply needs reading, not answering (Islam's own distinction). */
    const mailsToHer = () => toHer().length;
    await reset();
    await reply("Reply one"); await reply("Reply two");
    await call(her, { action: "mine" });   /* NB: this also marks them present */
    check("nothing while their collection fills", mailsToHer() === 0, mailsToHer() + " emails");
    /* Their poll just said they are here, so those two replies are seen. The
       next one is what they do not come back to. */
    await reply("Reply three, after they left");
    await passes(MINS + 1);
    await call(smo, { action: "queue" });  /* somebody else's request drives it */
    check("one email once the time is up", mailsToHer() === 1, mailsToHer() + " emails");
    const hers = toHer()[0] || {};
    check("...carrying only what they have not seen", /Reply three/.test(hers.html || "") &&
          !/Reply one/.test(hers.html || ""), (hers.html || "").length + " bytes");
    check("...in the tenant's branding, not the plain office note",
          /Raya Trade/.test(hers.html || "") && /<table/.test(hers.html || ""));
    check("...and the messages it carried are tagged (§188)",
          (await c.query("SELECT count(*)::int AS n FROM chat_messages " +
                         " WHERE person_key = 'asker' AND emailed_to IS NOT NULL")).rows[0].n >= 1);

    console.log("\n9 · coming back stops theirs");
    await reset();
    await reply("Reply four");
    await passes(MINS + 1);
    await call(her, { action: "mine" });   /* they came back */
    const n9 = mailsToHer();
    await call(smo, { action: "queue" });
    check("a reply they came back for is not emailed", mailsToHer() === n9,
          mailsToHer() + " emails");

    console.log("\n10 · a send that failed buys no silence");
    await reset();
    await say("A question nobody will be told about");
    await passes(MINS + 1);
    MAIL.refuse = true;
    await call(her, { action: "mine" });
    MAIL.refuse = false;
    check("nothing was remembered", !(await chased()).chased_at);
    await call(her, { action: "mine" });
    check("so the next request sends it", toOffice().length === 1,
          toOffice().length + " emails");

    console.log("\n11 · the rule itself, at both ends (§94.5)");
    check("nothing waiting is not 'not yet due', it is nothing to send",
          Rules.chatCollectDue(null, Date.now(), 10) === false);
    check("two minutes old → not due",
          Rules.chatCollectDue(Date.now() - 120000, Date.now(), 10) === false);
    check("eleven minutes old → due",
          Rules.chatCollectDue(Date.now() - 660000, Date.now(), 10) === true);
    check("a time that will not read → due, never silent",
          Rules.chatCollectDue("not a time", Date.now(), 10) === true);
    check("...and the number is the tenant's setting, not one written twice",
          Rules.chatCollectDue(Date.now() - 300000, Date.now(), 3) === true &&
          Rules.chatCollectDue(Date.now() - 300000, Date.now(), 10) === false);
    check("the setting ships at ten minutes", Rules.chatCfg(null).away === 10);
    check("...and a tenant that typed one keeps it", Rules.chatCfg({ away: 25 }).away === 25);

  } finally {
    for (const k of ["asker", "hend2"]) {
      await c.query("DELETE FROM chat_messages WHERE person_key = $1", [k]).catch(() => {});
      await c.query("DELETE FROM chat_threads WHERE person_key = $1", [k]).catch(() => {});
      await c.query("DELETE FROM people WHERE key = $1", [k]).catch(() => {});
    }
    c.release();
    await pool.end();
    srv.close();
  }
  console.log(fail ? "\n" + fail + " FAILED" : "\nall ok");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
